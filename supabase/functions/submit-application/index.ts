/**
 * POST /functions/v1/submit-application
 *
 * Handles the full candidate application flow:
 *
 *  1. Parse multipart/form-data (CV file + candidate info)
 *  2. Validate inputs
 *  3. Upload CV PDF to Supabase Storage (bucket: "cv-uploads")
 *  4. Upsert Lead (Candidate) in Salesforce — keyed by email
 *  5. Create Application__c record in Salesforce
 *  6. Upload CV as a Salesforce File linked to the Lead
 *  7. Trigger n8n webhook for OCR + AI scoring pipeline
 *  8. Return { applicationId, leadId, storageKey } to the frontend
 *
 * Multipart form fields:
 *   cv           File    — PDF resume (required)
 *   firstName    string  — required
 *   lastName     string  — required
 *   email        string  — required
 *   phone        string  — optional
 *   offerId      string  — Salesforce JobOffer__c Id (optional for general apps)
 *
 * Environment variables:
 *   SF_*                   — see salesforce.ts
 *   SUPABASE_URL           — auto-provided by Supabase runtime
 *   SERVICE_ROLE_KEY       — set via `supabase secrets set`
 *   N8N_WEBHOOK_URL        — your n8n HTTP webhook trigger URL
 *   CV_BUCKET              — Storage bucket name (default: "cv-uploads")
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { preflight, json, errorResponse } from "../_shared/cors.ts";
import { createSalesforceClient } from "../_shared/salesforce.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  offerId: string | null;
  cvFile: File;
}

interface SubmitResult {
  success: true;
  leadId: string;
  applicationId: string;
  storageKey: string;
  message: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePayload(payload: Partial<CandidatePayload>): string | null {
  if (!payload.firstName?.trim()) return "firstName is required";
  if (!payload.lastName?.trim())  return "lastName is required";
  if (!payload.email?.trim())     return "email is required";
  if (!validateEmail(payload.email)) return "email is invalid";
  if (!payload.cvFile)            return "CV file is required";
  if (payload.cvFile.type !== "application/pdf") return "CV must be a PDF";
  if (payload.cvFile.size > 10 * 1024 * 1024) return "CV must be under 10 MB";
  return null;
}

// ─── Step 1: Parse form data ───────────────────────────────────────────────────

async function parseForm(req: Request): Promise<CandidatePayload> {
  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    throw new Error("Request must be multipart/form-data");
  }

  const form = await req.formData();

  const cvFile = form.get("cv");
  if (!(cvFile instanceof File)) {
    throw new Error("cv field must be a File");
  }

  return {
    firstName: String(form.get("firstName") ?? "").trim(),
    lastName:  String(form.get("lastName")  ?? "").trim(),
    email:     String(form.get("email")     ?? "").trim().toLowerCase(),
    phone:     String(form.get("phone")     ?? "").trim(),
    offerId:   form.get("offerId") ? String(form.get("offerId")).trim() : null,
    cvFile,
  };
}

// ─── Step 2: Upload to Supabase Storage ───────────────────────────────────────

async function uploadToStorage(
  supabase: ReturnType<typeof createClient>,
  payload: CandidatePayload
): Promise<string> {
  const bucket = Deno.env.get("CV_BUCKET") ?? "cv-uploads";

  // Build a deterministic storage path to deduplicate re-uploads
  const timestamp = Date.now();
  const safeName  = `${payload.lastName}_${payload.firstName}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_");
  const storageKey = `${safeName}_${timestamp}.pdf`;

  const arrayBuffer = await payload.cvFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storageKey, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return storageKey;
}

// ─── Step 3: Generate a signed URL for n8n to fetch the CV ────────────────────

async function getSignedUrl(
  supabase: ReturnType<typeof createClient>,
  storageKey: string
): Promise<string> {
  const bucket = Deno.env.get("CV_BUCKET") ?? "cv-uploads";

  // 24-hour signed URL — n8n will download the file within this window
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storageKey, 60 * 60 * 24);

  if (error || !data?.signedUrl) {
    throw new Error(`Could not generate signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

// ─── Step 4: Upsert Lead (Candidate) in Salesforce ───────────────────────────

async function upsertLead(
  sf: ReturnType<typeof createSalesforceClient>,
  payload: CandidatePayload,
  offerId: string | null
): Promise<{ leadId: string; created: boolean }> {
  const fields: Record<string, unknown> = {
    FirstName:   payload.firstName,
    LastName:    payload.lastName,
    Email:       payload.email,
    Phone:       payload.phone || null,
    Company:     "Candidate", // required field on Lead — placeholder
    RecordTypeId: Deno.env.get("SF_LEAD_RECORD_TYPE_ID") ?? undefined,
    LeadSource:  "Web",
    Status:      "New",
  };

  // Optionally link to the target job offer
  if (offerId) {
    fields["Target_Job_Offer__c"] = offerId;
  }

  // Upsert keyed by email — prevents duplicate Lead records
  const { id: leadId, created } = await sf.upsert(
    "Lead",
    "Email",
    payload.email,
    fields
  );

  return { leadId, created };
}

// ─── Step 5: Create Application__c ───────────────────────────────────────────

async function createApplication(
  sf: ReturnType<typeof createSalesforceClient>,
  leadId: string,
  offerId: string | null
): Promise<string> {
  const fields: Record<string, unknown> = {
    Candidate__c:       leadId,
    Submission_Date__c: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    Status__c:          "New",
    Total_Score__c:     null, // will be populated by n8n/AI pipeline
  };

  if (offerId) {
    fields["Job_Offer__c"] = offerId;
  }

  return sf.create("Application__c", fields);
}

// ─── Step 6: Upload CV as Salesforce File linked to the Lead ─────────────────

async function attachCvToLead(
  sf: ReturnType<typeof createSalesforceClient>,
  leadId: string,
  payload: CandidatePayload
): Promise<string> {
  const arrayBuffer = await payload.cvFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Convert to Base64 for Salesforce Files API
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const fileName = `CV_${payload.lastName}_${payload.firstName}.pdf`;

  return sf.uploadFile(
    leadId,
    fileName,
    base64,
    "application/pdf",
    `Resume submitted via candidate portal`
  );
}

// ─── Step 7: Trigger n8n webhook ─────────────────────────────────────────────

interface N8nPayload {
  event:          "application.submitted";
  applicationId:  string;
  leadId:         string;
  offerId:        string | null;
  candidate: {
    firstName:    string;
    lastName:     string;
    email:        string;
    phone:        string;
  };
  cv: {
    storageKey:   string;
    signedUrl:    string;   // time-limited URL for n8n to download the file
    mimeType:     "application/pdf";
    fileName:     string;
  };
  submittedAt:    string;
}

async function triggerN8n(webhookPayload: N8nPayload): Promise<void> {
  const webhookUrl = Deno.env.get("N8N_WEBHOOK_URL");

  if (!webhookUrl) {
    // Non-fatal: log and continue. The recruiter can still see the SF record.
    console.warn("[submit-application] N8N_WEBHOOK_URL not set — skipping n8n trigger");
    return;
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(webhookPayload),
  });

  if (!res.ok) {
    // Non-fatal: log but don't fail the whole request
    const body = await res.text();
    console.error(`[submit-application] n8n webhook returned ${res.status}: ${body}`);
  } else {
    console.log("[submit-application] n8n webhook triggered successfully");
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return preflight();

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  // ── Supabase admin client (service role — bypasses RLS for storage) ──
  const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey  = Deno.env.get("SERVICE_ROLE_KEY")!;

  if (!supabaseUrl || !serviceRoleKey) {
    return errorResponse("Supabase environment not configured", 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // ── 1. Parse ──
    const payload = await parseForm(req);

    const validationError = validatePayload(payload);
    if (validationError) {
      return errorResponse(validationError, 400);
    }

    const sf = createSalesforceClient();

    // ── 2. Upload to Supabase Storage ──
    console.log("[submit-application] Uploading CV to storage...");
    const storageKey = await uploadToStorage(supabase, payload);
    console.log("[submit-application] Storage key:", storageKey);

    // ── 3. Generate signed URL for n8n ──
    const signedUrl = await getSignedUrl(supabase, storageKey);

    // ── 4. Upsert Lead in Salesforce ──
    console.log("[submit-application] Upserting Lead in Salesforce...");
    const { leadId, created } = await upsertLead(sf, payload, payload.offerId);
    console.log(`[submit-application] Lead ${created ? "created" : "updated"}: ${leadId}`);

    // ── 5. Create Application__c ──
    console.log("[submit-application] Creating Application__c...");
    const applicationId = await createApplication(sf, leadId, payload.offerId);
    console.log("[submit-application] Application created:", applicationId);

    // ── 6. Attach CV to Lead in SF Files ──
    console.log("[submit-application] Attaching CV to Lead in Salesforce...");
    try {
      await attachCvToLead(sf, leadId, payload);
    } catch (sfFileErr) {
      // Non-fatal — CV is still in Supabase Storage and n8n can retrieve it
      console.error("[submit-application] SF file attach failed (non-fatal):", sfFileErr);
    }

    // ── 7. Trigger n8n ──
    console.log("[submit-application] Triggering n8n webhook...");
    await triggerN8n({
      event:         "application.submitted",
      applicationId,
      leadId,
      offerId:       payload.offerId,
      candidate: {
        firstName:   payload.firstName,
        lastName:    payload.lastName,
        email:       payload.email,
        phone:       payload.phone,
      },
      cv: {
        storageKey,
        signedUrl,
        mimeType:    "application/pdf",
        fileName:    `CV_${payload.lastName}_${payload.firstName}.pdf`,
      },
      submittedAt: new Date().toISOString(),
    });

    // ── 8. Return result ──
    const result: SubmitResult = {
      success:       true,
      leadId,
      applicationId,
      storageKey,
      message: created
        ? "Application submitted and candidate profile created."
        : "Application submitted. Your existing profile has been updated.",
    };

    return json(result, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[submit-application] Fatal error:", message);
    return errorResponse(message, 500);
  }
});