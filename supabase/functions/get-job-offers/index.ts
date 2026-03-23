/**
 * GET /functions/v1/get-job-offers
 *
 * Fetches active job offers from Salesforce and returns them to the Vue frontend.
 *
 * Query params:
 *   ?id=<JobOffer__c Id>    — return a single offer with full detail (skills, etc.)
 *   (no params)             — return the list of all active offers
 *
 * Salesforce objects used:
 *   JobOffer__c             — main object (Title__c, Description__c, Type__c, etc.)
 *   Department__c           — parent lookup (Name)
 *   OfferSkill__c           — junction to Skill__c (Weight__c)
 *   Skill__c                — master skill list (Name)
 *
 * Environment variables required (shared with other functions):
 *   SF_LOGIN_URL, SF_CLIENT_ID, SF_CLIENT_SECRET, SF_USERNAME,
 *   SF_PASSWORD, SF_SECURITY_TOKEN (optional if IP is whitelisted)
 */

import { preflight, json, errorResponse } from "../_shared/cors.ts";
import { createSalesforceClient } from "../_shared/salesforce.ts";

// ─── Salesforce record shapes ─────────────────────────────────────────────────

interface SFDepartment {
  Name: string;
}

interface SFSkill {
  Id: string;
  Name: string;
}

interface SFOfferSkill {
  Id: string;
  Weight__c: number | null;
  Skill__r: SFSkill;
}

interface SFJobOfferListItem {
  Id: string;
  Name: string;
  Title_c__c: string;
  Description_c__c: string | null;
  OfferType__c: string | null;
  Location__c: string | null;
  Experience_Min_c__c: number | null;
  CreatedDate: string;
  Department__r: SFDepartment | null;
}

interface SFJobOfferDetail extends SFJobOfferListItem {
  OfferSkills__r: { records: SFOfferSkill[] } | null;
}

// ─── Data transformers ────────────────────────────────────────────────────────

function transformListItem(record: SFJobOfferListItem) {
  return {
    Id: record.Id,
    Name: record.Name,
    Title__c: record.Title_c__c,
    Description__c: record.Description_c__c,
    OfferType__c: record.OfferType__c,
    Location__c: record.Location__c,
    Experience_Min__c: record.Experience_Min_c__c,
    CreatedDate: record.CreatedDate,
    Department__r: record.Department__r
      ? { Name: record.Department__r.Name }
      : null,
  };
}

function transformDetail(record: SFJobOfferDetail) {
  const base = transformListItem(record);
  const skills =
    record.OfferSkills__r?.records?.map((os) => ({
      Id: os.Id,
      Name: os.Skill__r?.Name ?? "",
      Weight__c: os.Weight__c ?? 1,
    })) ?? [];

  return { ...base, Skills: skills };
}

// ─── SOQL queries ─────────────────────────────────────────────────────────────

// List view — lightweight, no sub-queries needed for the grid
const LIST_SOQL = `
  SELECT
    Id, Name, Title_c__c, Description_c__c, OfferType__c,
    Experience_Min_c__c, CreatedDate
  FROM JobOffer__c
  ORDER BY CreatedDate DESC
  LIMIT 200
`.trim();

// Detail view — includes related OfferSkill__c → Skill__c
function detailSoql(id: string): string {
  // Sanitise id to prevent SOQL injection (SF Ids are 15/18 alphanumeric chars)
  const safeId = id.replace(/[^a-zA-Z0-9]/g, "");
  return `
    SELECT
      Id, Name, Title_c__c, Description_c__c, OfferType__c,
      Experience_Min_c__c, CreatedDate,
      (
        SELECT Id, Weight__c, Skill__r.Id, Skill__r.Name
        FROM OfferSkills__r
        ORDER BY Weight__c DESC NULLS LAST
      )
    FROM JobOffer__c
    WHERE Id = '${safeId}'
    LIMIT 1
  `.trim();
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") return preflight();

  // Only GET is allowed
  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    const sf = createSalesforceClient();

    // ── Single offer detail ──
    if (id) {
      const record = await sf.queryOne<SFJobOfferDetail>(detailSoql(id));

      if (!record) {
        return errorResponse("Job offer not found", 404);
      }

      return json({ offer: transformDetail(record) });
    }

    // ── Full list ──
    const records = await sf.query<SFJobOfferListItem>(LIST_SOQL);
    const offers = records.map(transformListItem);

    return json({ offers, total: offers.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[get-job-offers]", message);
    return errorResponse(message, 500);
  }
});