/**
 * Sovereign Local LLM MCP Server
 * Interface for local inference using Ollama or vLLM with automatic model fallback.
 * Primary: qwen3-vl:4b (vision-language, zero-knowledge sovereign model)
 * Fallback: gemma4:12b (12B general intelligence fallback)
 */
export class SovereignMCP {
  private localLlmEndpoint = 'http://localhost:11434/api/generate';
  private primaryModel = 'qwen3-vl:4b';
  private fallbackModel = 'gemma4:12b';
  private currentModel = this.primaryModel;

  async handleRequest(request: { tool: string, args: any }) {
    console.log(`[MCP-SERVER] Processing tool call: ${request.tool}`);

    // Determine which model to use based on tool and availability
    let prompt: string;
    let model: string;

    switch (request.tool) {
      case 'ask_privacy_expert':
        prompt = `You are a privacy and security expert. Answer the following query about digital identity: ${request.args.prompt}`;
        model = this.currentModel;
        break;
      case 'explain_security_protocol':
        prompt = `Explain the Zero-Knowledge security protocol for: ${request.args.context}`;
        model = this.currentModel;
        break;
      case 'query_sovereign_nyc':
        prompt = `Answer this question about the sovereign.nyc platform: ${request.args.query}`;
        model = this.currentModel;
        break;
      case 'synthesize_identity':
        prompt = `Analyze the following encrypted identity vectors and provide a synthesis of the user's digital sovereignty: ${JSON.stringify(request.args.vectors)}`;
        model = this.currentModel;
        break;
      default:
        return { error: 'Tool not found' };
    }

    // Try current model, fall back to alternative on failure
    return await this.callLocalLlm(prompt, model).catch(() => {
      // Switch model and retry once
      this.currentModel = this.currentModel === this.primaryModel ? this.fallbackModel : this.primaryModel;
      return this.callLocalLlm(prompt, this.currentModel);
    });
  }

  private async callLocalLlm(prompt: string, model: string) {
    try {
      const response = await fetch(this.localLlmEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
        }),
        timeout: 15000, // 15 second timeout for realtime latency
      });

      if (!response.ok) throw new Error(`LLM API error: ${response.statusText}`);
      const data = await response.json();
      return { response: data.response };
    } catch (error) {
      console.error(`[MCP-SERVER] LLM call failed for model ${model}: ${error}`);
      throw error;
    }
  }

  async start() {
    console.log(`[MCP-SERVER] Sovereign Knowledge Layer started.`);
    console.log(`[MCP-SERVER] Primary Model: ${this.primaryModel}`);
    console.log(`[MCP-SERVER] Fallback Model: ${this.fallbackModel}`);
    console.log(`[MCP-SERVER] Endpoint: ${this.localLlmEndpoint}`);
    console.log(`[MCP-SERVER] Auto-swap enabled for realtime latency optimization`);
  }
}

export const sovereignMCP = new SovereignMCP();
sovereignMCP.start();
