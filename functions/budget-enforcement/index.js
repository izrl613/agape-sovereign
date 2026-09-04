/**
 * Budget Enforcement — Cloud Run auto-cap on budget breach.
 * Cloud Function (Gen 2), triggered by the `billing-alerts` Pub/Sub topic.
 *
 * When a billing budget alert crosses CAP_AT_THRESHOLD, the cost-driving
 * Cloud Run services listed in CAP_SERVICES are scaled to maxScale=0 so they
 * can no longer spin up and accrue cost. The change is reversible: re-deploy
 * or set maxScale>0 via gcloud/console to restore.
 *
 * Env:
 *   PROJECT_ID        GCP project id (default: agape-sovereign)
 *   REGION            Cloud Run region (default: us-central1)
 *   CAP_SERVICES      comma-separated Cloud Run service names to cap
 *   CAP_AT_THRESHOLD  breach threshold fraction (default: 1.0 = 100%)
 */
const {GoogleAuth} = require("google-auth-library");

const PROJECT_ID = process.env.PROJECT_ID || "agape-sovereign";
const REGION = process.env.REGION || "us-central1";
const CAP_SERVICES = (process.env.CAP_SERVICES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const CAP_AT_THRESHOLD = parseFloat(process.env.CAP_AT_THRESHOLD || "1.0");

const auth = new GoogleAuth({
  scopes: "https://www.googleapis.com/auth/cloud-platform",
});

function parseBudgetAlert(cloudEvent) {
  try {
    const msg = cloudEvent && cloudEvent.data && cloudEvent.data.message;
    if (msg && msg.data) {
      return JSON.parse(Buffer.from(msg.data, "base64").toString("utf8"));
    }
    if (typeof cloudEvent?.data === "string") return JSON.parse(cloudEvent.data);
    return cloudEvent && cloudEvent.data ? cloudEvent.data : null;
  } catch (e) {
    console.warn("Could not parse budget alert payload:", e.message);
    return null;
  }
}

exports.handleBudgetAlert = async (cloudEvent) => {
  const data = parseBudgetAlert(cloudEvent);
  const threshold =
    data && typeof data.alertThresholdExceeded === "number"
      ? data.alertThresholdExceeded
      : null;
  console.log(`Budget alert received: ${JSON.stringify(data)}`);

  if (threshold === null || threshold < CAP_AT_THRESHOLD) {
    console.log(`Threshold ${threshold} < ${CAP_AT_THRESHOLD}; no action.`);
    return;
  }
  if (!CAP_SERVICES.length) {
    console.log("No CAP_SERVICES configured; nothing to cap.");
    return;
  }

  const client = await auth.getClient();
  const accessToken = (await client.getAccessToken()).token;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  for (const service of CAP_SERVICES) {
    const url =
      `https://run.googleapis.com/v1/projects/${PROJECT_ID}` +
      `/locations/${REGION}/services/${service}`;
    const body = {
      spec: {
        template: {
          metadata: {
            annotations: {
              "autoscaling.googleapis.com/maxScale": "0",
              "run.googleapis.com/min-instances": "0",
            },
          },
        },
      },
    };
    try {
      const res = await fetch(
        `${url}?mask=spec.template.metadata.annotations`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(body),
        }
      );
      const text = await res.text();
      if (!res.ok) {
        console.error(`Failed to cap ${service}: ${res.status} ${text}`);
      } else {
        console.log(`Capped ${service} (maxScale=0).`);
      }
    } catch (e) {
      console.error(`Error capping ${service}:`, e.message);
    }
  }
};
