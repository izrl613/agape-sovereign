/**
 * Quota Guard
 * Enforces the brutal 15 Requests Per Minute (RPM) ceiling of the Firebase Free Tier.
 */

export class QuotaGuard {
  private static requestLog: number[] = [];
  private static readonly RPM_LIMIT = 15;
  private static readonly WINDOW_MS = 60000;

  /**
   * Checks if a request can be made within the current 60s window.
   * Throws an error if the limit is exceeded.
   */
  static async checkQuota(): Promise<void> {
    const now = Date.now();
    
    // Prune logs older than 60 seconds
    this.requestLog = this.requestLog.filter(timestamp => now - timestamp < this.WINDOW_MS);

    if (this.requestLog.length >= this.RPM_LIMIT) {
      console.error("🛑 HTTP 429: Quota Exceeded. Rate limit is 15 RPM.");
      throw new Error("QUOTA_EXCEEDED: Too many requests. Please wait a few seconds.");
    }

    // Log the current request
    this.requestLog.push(now);
    console.log(`📊 Quota Usage: ${this.requestLog.length}/${this.RPM_LIMIT} RPM`);
  }

  /**
   * Batches multiple requests into one to conserve quota.
   */
  static async batchRequest<T>(tasks: (() => Promise<T>)[], processor: (results: T[]) => Promise<T>): Promise<T> {
    await this.checkQuota();
    const results = await Promise.all(tasks.map(task => task()));
    return await processor(results);
  }
}
