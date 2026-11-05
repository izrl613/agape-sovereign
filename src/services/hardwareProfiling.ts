/**
 * Hardware Profiling Service
 * Determines the local VRAM capacity and assigns the SLM execution tier.
 */

export enum SLMTier {
  T1_HIGH_END = 'Tier 1 (Qwen3-VL-4B BF16)',
  T2_MID_RANGE = 'Tier 2 (Qwen3-LITE Quantized)',
  T3_MOBILE = 'Tier 3 (Gemma 4 E2B)',
  T4_CLOUD = 'Tier 4 (Gemini AI Fallback)',
}

export class HardwareProfilingService {
  static async profileHardware(): Promise<SLMTier> {
    try {
      if (!('gpu' in navigator)) {
        return SLMTier.T4_CLOUD;
      }

      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) return SLMTier.T4_CLOUD;

      // In a real implementation, we would query the adapter limits for VRAM.
      // For this implementation, we simulate the VRAM check based on the spec.
      const vramGb = await this.estimateVRAM(adapter);

      if (vramGb >= 12) return SLMTier.T1_HIGH_END;
      if (vramGb >= 4) return SLMTier.T2_MID_RANGE;
      if (vramGb >= 1.5) return SLMTier.T3_MOBILE;
      
      return SLMTier.T4_CLOUD;
    } catch (e) {
      return SLMTier.T4_CLOUD;
    }
  }

  private static async estimateVRAM(adapter: any): Promise<number> {
    // Simulation of VRAM estimation logic
    // In a real browser, this would involve querying GPU limits or a benchmark.
    return 8; // Defaulting to Mid-Range for the prototype
  }
}
