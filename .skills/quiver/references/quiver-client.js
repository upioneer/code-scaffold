/**
 * Quiver AI Vector Studio Client Reference Implementation
 * Zero-dependency Node.js ESM client for Text-to-SVG and Image Vectorization
 */

export class QuiverClient {
  constructor(apiKey = process.env.QUIVERAI_API_KEY, baseUrl = 'https://api.quiver.ai/v1') {
    if (!apiKey) {
      throw new Error('QUIVERAI_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      const error = new Error(`Quiver API Error [${response.status}]: ${err.message || 'Request failed'}`);
      error.status = response.status;
      error.code = err.code;
      error.requestId = response.headers.get('x-request-id');
      error.retryAfter = response.headers.get('retry-after');
      throw error;
    }

    return response.json();
  }

  /**
   * List available foundation models
   */
  async listModels() {
    return this._request('/models');
  }

  /**
   * Generate SVG from a text prompt
   */
  async generateSvg({
    prompt,
    instructions = '',
    model = 'arrow-2',
    viewBox = { minX: 0, minY: 0, width: 512, height: 512 },
    n = 1,
    reasoningEffort = 'medium',
    references = []
  }) {
    const payload = {
      model,
      prompt,
      instructions,
      n,
      stream: false,
      reasoning_effort: reasoningEffort,
      attributes: { viewBox }
    };

    if (references.length > 0) {
      payload.references = references;
    }

    const result = await this._request('/svgs/generations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      id: result.id,
      created: result.created,
      svg: result.data?.[0]?.svg,
      allSvgs: result.data?.map(d => d.svg) || [],
      usage: result.usage,
      credits: result.credits
    };
  }

  /**
   * Vectorize a raster image (URL or base64) to SVG
   */
  async vectorizeImage({
    image, // { url: string } or { base64: string }
    model = 'arrow-2',
    autoCrop = true,
    targetSize = 1024,
    reasoningEffort = 'medium'
  }) {
    const payload = {
      model,
      image,
      auto_crop: autoCrop,
      target_size: targetSize,
      stream: false,
      reasoning_effort: reasoningEffort
    };

    const result = await this._request('/svgs/vectorizations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      id: result.id,
      svg: result.data?.[0]?.svg,
      usage: result.usage,
      credits: result.credits
    };
  }
}
