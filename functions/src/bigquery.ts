import {onCall, HttpsError} from "firebase-functions/v2/https";
import {BigQuery} from "@google-cloud/bigquery";
import {defineString} from "firebase-functions/params";
import {logger} from "firebase-functions";

const bigquery = new BigQuery();

const billingExportTable = defineString("BILLING_EXPORT_TABLE", {
  default: "agape-sovereign.billing_export.gcp_billing_export_v1",
  description: "BigQuery billing export table ID",
});

export const fetchAnalyticsData = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  try {
    const query = `
      SELECT
        DATE(usage_start_time, "America/New_York") AS usage_date,
        service.description AS service,
        sku.description AS sku,
        SUM(cost) AS total_cost_usd,
        SUM(usage.amount) AS usage_quantity,
        usage.unit
      FROM \`${billingExportTable.value()}\`
      WHERE DATE(usage_start_time, "America/New_York") >=
        DATE_SUB(
          CURRENT_DATE("America/New_York"),
          INTERVAL 30 DAY
        )
        AND project.id = 'agape-sovereign'
      GROUP BY usage_date, service, sku, usage.unit
      ORDER BY usage_date DESC, total_cost_usd DESC
      LIMIT 50
    `;

    const [rows] = await bigquery.query({query, location: "US"});

    return {
      status: "success",
      data: rows,
    };
  } catch (error) {
    logger.error("Error querying BigQuery:", error);
    throw new HttpsError(
      "internal",
      "An error occurred while fetching analytics data."
    );
  }
});
