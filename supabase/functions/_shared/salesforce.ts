/**
 * _shared/salesforce.ts
 *
 * Salesforce REST API client for Supabase Edge Functions (Deno).
 *
 * Auth strategy: OAuth 2.0 Username-Password flow using the Connected App
 * configured in Salesforce (Consumer Key + Consumer Secret).
 *
 * Required environment variables (set via `supabase secrets set`):
 *   SF_LOGIN_URL       — https://login.salesforce.com
 *   SF_CLIENT_ID       — Connected App Consumer Key
 *   SF_CLIENT_SECRET   — Connected App Consumer Secret
 *   SF_USERNAME        — Integration user email
 *   SF_PASSWORD        — Integration user password
 *   SF_SECURITY_TOKEN  — Security token appended to password (omit if IP is whitelisted)
 */

interface TokenCache {
  accessToken: string;
  instanceUrl: string;
  expiresAt: number; // epoch ms
}

let _cache: TokenCache | null = null;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SalesforceClient {
  query<T = Record<string, unknown>>(soql: string): Promise<T[]>;
  queryOne<T = Record<string, unknown>>(soql: string): Promise<T | null>;
  create(objectName: string, fields: Record<string, unknown>): Promise<string>;
  upsert(
    objectName: string,
    externalIdField: string,
    externalId: string,
    fields: Record<string, unknown>
  ): Promise<{ id: string; created: boolean }>;
  uploadFile(
    parentId: string,
    fileName: string,
    base64Data: string,
    mimeType: string,
    description?: string
  ): Promise<string>;
}

interface TokenResponse {
  access_token: string;
  instance_url: string;
  issued_at: string;
  token_type: string;
}

interface SoqlResponse<T> {
  totalSize: number;
  done: boolean;
  records: T[];
}

interface CreateResponse {
  id: string;
  success: boolean;
  errors: unknown[];
}

interface UpsertResponse {
  id: string;
  success: boolean;
  created: boolean;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

async function authenticate(): Promise<TokenCache> {
  // Return cached token if still valid (5-minute buffer)
  if (_cache && _cache.expiresAt - Date.now() > 5 * 60 * 1000) {
    return _cache;
  }

  const loginUrl = Deno.env.get("SF_LOGIN_URL") ?? "https://login.salesforce.com";
  const clientId = Deno.env.get("SF_CLIENT_ID");
  const clientSecret = Deno.env.get("SF_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Salesforce credentials. Set SF_CLIENT_ID and SF_CLIENT_SECRET via `supabase secrets set`."
    );
  }

  // Use Client Credentials Flow
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Salesforce authentication failed: ${body}`);
  }

  const data: TokenResponse = await res.json();

  // Salesforce tokens don't expire by default, but we refresh every 2 hours
  // to handle password/token rotation without needing a restart.
  _cache = {
    accessToken: data.access_token,
    instanceUrl: data.instance_url,
    expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
  };

  return _cache;
}

// ─── Low-level request helper ─────────────────────────────────────────────────

async function sfFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const { accessToken, instanceUrl } = await authenticate();

  const url = `${instanceUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  // If 401, clear cache and retry once (token may have been invalidated)
  if (res.status === 401) {
    _cache = null;
    const { accessToken: newToken, instanceUrl: newInstance } = await authenticate();
    return fetch(`${newInstance}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${newToken}`,
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
  }

  return res;
}

// ─── Client factory ───────────────────────────────────────────────────────────

export function createSalesforceClient(): SalesforceClient {
  // SOQL query returning all records
  async function query<T>(soql: string): Promise<T[]> {
    const encoded = encodeURIComponent(soql);
    const res = await sfFetch(
      `/services/data/v58.0/query/?q=${encoded}`
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Salesforce SOQL error: ${body}`);
    }

    const data: SoqlResponse<T> = await res.json();

    // Handle large result sets with pagination
    let records = data.records;
    let nextUrl = !data.done ? (data as unknown as { nextRecordsUrl: string }).nextRecordsUrl : null;

    while (nextUrl) {
      const pageRes = await sfFetch(nextUrl);
      if (!pageRes.ok) break;
      const page: SoqlResponse<T> = await pageRes.json();
      records = [...records, ...page.records];
      nextUrl = !page.done ? (page as unknown as { nextRecordsUrl: string }).nextRecordsUrl : null;
    }

    return records;
  }

  // SOQL query returning first record or null
  async function queryOne<T>(soql: string): Promise<T | null> {
    const results = await query<T>(soql);
    return results[0] ?? null;
  }

  // Create a new Salesforce record, returns the new record Id
  // Create a new Salesforce record, returns the new record Id
  async function create(
    objectName: string,
    fields: Record<string, unknown>
  ): Promise<string> {
    // We use v58.0 here as it is the most stable version for Developer Orgs
    const path = `/services/data/v58.0/sobjects/${objectName}/`;
    
    console.log(`[DEBUG] Salesforce POST Path: ${path}`);
    console.log(`[DEBUG] Sending Fields:`, JSON.stringify(fields));

    const res = await sfFetch(path, {
      method: "POST",
      body: JSON.stringify(fields),
    });

    if (!res.ok) {
      const body = await res.text();
      // This log will finally show us the REAL reason for the NOT_FOUND
      console.error(`[DEBUG] Salesforce Create Error Body: ${body}`);
      throw new Error(`Salesforce create (${objectName}) failed: ${body}`);
    }

    const data: CreateResponse = await res.json();
    return data.id;
  }

  // Upsert using an external ID field — creates or updates
  async function upsert(
    objectName: string,
    externalIdField: string,
    externalId: string,
    fields: Record<string, unknown>
  ): Promise<{ id: string; created: boolean }> {
    const res = await sfFetch(
      `/services/data/v58.0/sobjects/${objectName}/${externalIdField}/${encodeURIComponent(externalId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(fields),
      }
    );

    // 201 = created, 204 = updated (no body on 204)
    if (res.status === 204) {
      // Updated — SF doesn't return the ID on a 204, so we need to query it
      const record = await queryOne<{ Id: string }>(
        `SELECT Id FROM ${objectName} WHERE ${externalIdField} = '${externalId.replace(/'/g, "\\'")}' LIMIT 1`
      );
      return { id: record?.Id ?? "", created: false };
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Salesforce upsert (${objectName}) failed: ${body}`);
    }

    const data: UpsertResponse = await res.json();
    return { id: data.id, created: data.created };
  }

  /**
   * Upload a file to Salesforce Files (ContentVersion).
   * Returns the ContentDocumentId (for linking to records).
   *
   * @param parentId     - Salesforce record Id to link the file to
   * @param fileName     - e.g. "resume_john_doe.pdf"
   * @param base64Data   - Base64-encoded file content
   * @param mimeType     - e.g. "application/pdf"
   * @param description  - Optional description
   */
  async function uploadFile(
    parentId: string,
    fileName: string,
    base64Data: string,
    mimeType: string,
    description = ""
  ): Promise<string> {
    // Step 1: Create ContentVersion (the file itself)
    const cvRes = await sfFetch("/services/data/v58.0/sobjects/ContentVersion/", {
      method: "POST",
      body: JSON.stringify({
        Title: fileName,
        PathOnClient: fileName,
        VersionData: base64Data,
        ContentLocation: "S", // S = Salesforce (stored in SF Files)
        Description: description,
      }),
    });

    if (!cvRes.ok) {
      const body = await cvRes.text();
      throw new Error(`Salesforce file upload failed: ${body}`);
    }

    const { id: contentVersionId }: { id: string } = await cvRes.json();

    // Step 2: Retrieve ContentDocumentId from the ContentVersion
    const cvRecord = await queryOne<{ ContentDocumentId: string }>(
      `SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${contentVersionId}' LIMIT 1`
    );

    if (!cvRecord?.ContentDocumentId) {
      throw new Error("Could not retrieve ContentDocumentId after upload.");
    }

    const contentDocumentId = cvRecord.ContentDocumentId;

    // Step 3: Link the document to the parent record via ContentDocumentLink
    await sfFetch("/services/data/v58.0/sobjects/ContentDocumentLink/", {
      method: "POST",
      body: JSON.stringify({
        ContentDocumentId: contentDocumentId,
        LinkedEntityId: parentId,
        ShareType: "V", // V = Viewer
        Visibility: "AllUsers",
      }),
    });

    return contentDocumentId;
  }

  return { query, queryOne, create, upsert, uploadFile };
}