import { onCall, HttpsError } from "firebase-functions/v2/https";
import { BigQuery } from "@google-cloud/bigquery";
import { logger } from "firebase-functions/v2";

// Initialize BigQuery client
const bigquery = new BigQuery();

/**
 * Example Firebase Callable Function to fetch data from BigQuery
 * 
 * Replace `your_dataset.your_table` with your actual dataset and table name.
 */
export const fetchAnalyticsData = onCall(async (request) => {
  // Check if user is authenticated (Optional based on your security needs)
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  try {
    // Example query: Fetch top 10 rows from a dataset
    const query = `
      SELECT *
      FROM \`agape-sovereign.your_dataset.your_table\`
      LIMIT 10
    `;

    const options = {
      query: query,
      // Location must match that of the dataset(s) referenced in the query.
      location: 'US',
    };

    // Run the query as a job
    const [job] = await bigquery.createQueryJob(options);
    logger.info(`BigQuery Job ${job.id} started.`);

    // Wait for the query to finish
    const [rows] = await job.getQueryResults();

    return {
      status: "success",
      data: rows,
    };
  } catch (error) {
    logger.error("Error querying BigQuery:", error);
    throw new HttpsError("internal", "An error occurred while fetching analytics data.");
  }
});
