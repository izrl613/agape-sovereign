/**
 * Request Batcher & Rate Limiter
 * Ensures the platform stays under the 15 RPM Firebase Free-Tier limit.
 */

export class RequestBatcher {
  private queue: Array<{ request: () => Promise<any>, resolve: Function, reject: Function }> = [];
  private isProcessing = false;
  private readonly RPM_LIMIT = 15;
  private readonly MIN_INTERVAL = 60000 / this.RPM_LIMIT; // ~4 seconds per request

  async enqueueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { request, resolve, reject } = this.queue.shift()!;
      
      try {
        const result = await request();
        resolve(result);
      } catch (e) {
        reject(e);
      }

      // Enforce the minimum interval to prevent HTTP 429
      await new Promise(res => setTimeout(res, this.MIN_INTERVAL));
    }

    this.isProcessing = false;
  }
}
