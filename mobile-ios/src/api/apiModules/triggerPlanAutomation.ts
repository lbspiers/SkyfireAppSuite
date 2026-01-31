// src/api/apiModules/triggerPlanAutomation.ts
console.log("🧠 TRIGGER FILE EXECUTED >>> triggerPlanAutomation.ts");

import { Platform } from "react-native";
import axios from "axios";
import { Buffer } from "buffer";
import { fetchActiveNgrokUrl } from "../../api/server_endpoints/getActive";

/** Optional knobs for targeting a specific machine or forcing a URL */
export type TriggerOptions = {
  computerName?: string; // e.g., "ServerComputer2"
  overrideUrl?: string; // if provided, skips DB lookup and uses this URL
  companyUuid?: string; // optional metadata for server
  userUuid?: string; // optional metadata for server
  clientVersion?: string; // optional client version tag
  extraHeaders?: Record<string, string>; // optional extra headers
};

let __cachedNgrokUrl: string | null = null;
let __cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

export const triggerPlanAutomation = async (
  projectId: string, // <-- this is your PROJECT UUID from the app
  secretToken: string, // shared secret (server expects base64 as Bearer)
  processName: string, // required by current Flask contract
  steps: string[] = [],
  opts?: TriggerOptions
): Promise<any> => {
  try {
    // 0) Basic arg checks
    if (!projectId || typeof projectId !== "string") {
      steps.push("❗ Invalid projectId provided to triggerPlanAutomation");
      throw new Error("projectId is required and must be a string");
    }
    if (!secretToken || typeof secretToken !== "string") {
      steps.push("❗ Invalid secretToken provided to triggerPlanAutomation");
      throw new Error("secretToken is required and must be a string");
    }
    if (!processName || typeof processName !== "string") {
      steps.push("❗ Invalid processName provided to triggerPlanAutomation");
      throw new Error("processName is required and must be a string");
    }

    // 1) Encode the secret token (Flask expects base64 of SECRET_TOKEN as Bearer)
    const encodedToken = Buffer.from(secretToken, "utf8").toString("base64");
    steps.push(`🔐 Encoded token: ${encodedToken.slice(0, 8)}...`);

    // 2) Resolve active ngrok URL (override → cache → API)
    let resolvedUrl: string | null = null;

    if (opts?.overrideUrl) {
      resolvedUrl = opts.overrideUrl;
      steps.push(`🛠️ Using overrideUrl: ${resolvedUrl}`);
    } else {
      const now = Date.now();
      if (__cachedNgrokUrl && now - __cachedAt < CACHE_TTL_MS) {
        resolvedUrl = __cachedNgrokUrl;
        steps.push(`🗃️ Using cached ngrok URL: ${resolvedUrl}`);
      } else {
        steps.push("🔎 Fetching active ngrok URL from API...");
        try {
          resolvedUrl = await fetchActiveNgrokUrl(opts?.computerName);
          __cachedNgrokUrl = resolvedUrl;
          __cachedAt = now;
          steps.push(`✅ Active ngrok URL resolved: ${resolvedUrl}`);
        } catch (e: any) {
          steps.push(
            `⚠️ Failed to resolve ngrok URL from API: ${e?.message || e}`
          );
          throw new Error("Could not resolve ngrok URL from API");
        }
      }
    }

    if (!resolvedUrl) {
      throw new Error("No ngrok URL available.");
    }

    // 3) Normalize: ensure scheme + exactly one '/trigger'
    let normalizedUrl = String(resolvedUrl).trim();

    // Prepend scheme if missing
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      steps.push("⚙️ Prepending https:// (scheme missing from API/DB value)");
      normalizedUrl = "https://" + normalizedUrl.replace(/^\/+/, "");
    }

    // Ensure exactly one '/trigger'
    normalizedUrl = normalizedUrl.replace(/\/+$/, ""); // trim trailing slashes
    if (!/\/trigger$/i.test(normalizedUrl)) {
      normalizedUrl = normalizedUrl + "/trigger";
      steps.push(`🧩 Appended '/trigger': ${normalizedUrl}`);
    } else {
      steps.push(`🧩 URL already ends with '/trigger': ${normalizedUrl}`);
    }

    // 4) Payload — keep current Flask contract: { process_name, data: {...} }
    //    We keep legacy "project_id" for compatibility, but also send explicit "project_uuid".
    const payload = {
      process_name: processName,
      data: {
        // Legacy key your server already expects (kept for compatibility):
        project_id: projectId,

        // New explicit key your server can use immediately for UUID-based joins:
        project_uuid: projectId,

        // Optional context (harmless if server ignores for now):
        ...(opts?.companyUuid ? { company_uuid: opts.companyUuid } : {}),
        ...(opts?.userUuid ? { user_uuid: opts.userUuid } : {}),
        client_version: opts?.clientVersion ?? "1.0.7",

        // Trace + meta for log correlation:
        trace_id: `app-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        meta: {
          computerName: opts?.computerName,
          platform: Platform.OS,
        },
      },
    };

    const headers: Record<string, string> = {
      Authorization: `Bearer ${encodedToken}`,
      "Content-Type": "application/json",
      ...(opts?.extraHeaders ?? {}),
    };

    steps.push("📦 Payload prepared:");
    steps.push(safeStringify(payload));
    steps.push(`📨 Headers: ${safeStringify(headers)}`);
    steps.push(`📤 Final POST Body (stringified): ${JSON.stringify(payload)}`);

    // 5) POST to local server via ngrok
    const response = await axios.post(normalizedUrl, payload, {
      headers,
      timeout: 15_000,
    });

    steps.push(`✅ POST complete. Status: ${response.status}`);
    return response.data;
  } catch (err: any) {
    if (err?.response) {
      steps.push(`💥 Response Status: ${err.response.status}`);
      steps.push(`💥 Response Data: ${safeStringify(err.response.data)}`);
    } else if (err?.request) {
      steps.push("💥 Request was made but no response received.");
    } else {
      steps.push(`💥 General Error: ${err?.message || safeStringify(err)}`);
    }
    throw err;
  }
};

// Safer stringify helper (avoids circular structure crashes)
function safeStringify(v: any): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}
