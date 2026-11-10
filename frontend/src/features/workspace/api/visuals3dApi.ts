/**
 * frontend/src/features/workspace/api/visuals3dApi.ts
 * Type-safe API client for ApexMind 3D Visuals & CGI Studio Engine.
 * Covers all 17 dedicated REST endpoints.
 * Zero hardcoded data: connects directly to live backend workspace services.
 */

import {
  BrainConfig,
  BrainPresetItem,
  CameraPresetItem,
  Visual3DItem,
  Visual3DProviderHealth,
} from '../types';

const BASE_URL = '/api/workspace/3d-visuals';

export interface Search3DParams {
  query?: string;
  category?: string;
  provider?: string;
  aspectRatio?: string;
  page?: number;
  pageSize?: number;
}

export interface Search3DResponse {
  success: boolean;
  query: string;
  category: string;
  provider: string;
  totalHits: number;
  page: number;
  pageSize: number;
  items: Visual3DItem[];
  hasMore: boolean;
}

export interface ProvidersResponse {
  success: boolean;
  assetProviders: Visual3DProviderHealth[];
  renderEngines: Visual3DProviderHealth[];
  defaultAssetProvider: string;
  defaultRenderEngine: string;
}

export interface RenderResultResponse {
  success: boolean;
  sceneId: string;
  videoUrl: string;
  localVideoPath: string;
  thumbnailUrl: string;
  durationSeconds: number;
  resolution: string;
  aspectRatio: string;
  engineUsed: string;
  renderTimeSeconds: number;
  fileSizeBytes: number;
}

export interface AssembleShortResponse {
  success: boolean;
  title: string;
  masterVideoUrl: string;
  totalDurationSeconds: number;
  totalScenes: number;
  fileSizeBytes: number;
  resolution: string;
}

export const visuals3dApi = {
  // ── Group 1: 3D Asset Discovery & Catalog ──────────────────────────────────
  async getProviders(): Promise<ProvidersResponse> {
    const res = await fetch(`${BASE_URL}/providers`);
    if (!res.ok) throw new Error(`Failed to load 3D providers: ${res.statusText}`);
    return res.json();
  },

  async searchAssets(params: Search3DParams): Promise<Search3DResponse> {
    const res = await fetch(`${BASE_URL}/assets/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query || '',
        category: params.category || 'all',
        provider: params.provider || 'all',
        aspectRatio: params.aspectRatio || '9:16',
        page: params.page || 1,
        pageSize: params.pageSize || 20,
      }),
    });
    if (!res.ok) throw new Error(`3D search failed: ${res.statusText}`);
    return res.json();
  },

  async downloadAsset(payload: {
    assetId: string;
    provider: string;
    assetUrl: string;
    category?: string;
    title?: string;
    format?: string;
  }): Promise<{ success: boolean; localFilePath: string; sha256: string }> {
    const res = await fetch(`${BASE_URL}/assets/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Download 3D asset failed: ${res.statusText}`);
    return res.json();
  },

  async getLocalAssets(category?: string): Promise<{ success: boolean; items: Visual3DItem[] }> {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${BASE_URL}/assets/local${q}`);
    if (!res.ok) throw new Error(`Failed to load local 3D assets: ${res.statusText}`);
    return res.json();
  },

  // ── Group 2: ApexMind 3D Neural Brain ──────────────────────────────────────
  async getBrainPresets(): Promise<{ success: boolean; presets: BrainPresetItem[] }> {
    const res = await fetch(`${BASE_URL}/brain/presets`);
    if (!res.ok) throw new Error(`Failed to load brain presets: ${res.statusText}`);
    return res.json();
  },

  async generateBrainMesh(config: BrainConfig): Promise<{
    success: boolean;
    brainId: string;
    glbUrl: string;
    previewImageUrl: string;
    triangles: number;
    generationTimeMs: number;
  }> {
    const res = await fetch(`${BASE_URL}/brain/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error(`Failed to generate 3D Brain: ${res.statusText}`);
    return res.json();
  },

  async generateBrain(config: BrainConfig) {
    return this.generateBrainMesh(config);
  },

  async modulateBrainAudio(payload: {
    audioUrl: string;
    bpm?: number;
    intensityFactor?: number;
  }): Promise<{ success: boolean; durationSeconds: number; keyframePulses: any[] }> {
    const res = await fetch(`${BASE_URL}/brain/modulate-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Audio modulation failed: ${res.statusText}`);
    return res.json();
  },

  // ── Group 3: AI 3D Scene Director ──────────────────────────────────────────
  async compilePromptTo3DScene(payload: {
    prompt: string;
    category?: string;
    aspectRatio?: string;
    targetDurationSeconds?: number;
  }): Promise<{
    success: boolean;
    prompt: string;
    recommendedEngine: string;
    shadingStyle: string;
    selectedAssets: any;
    cameraRig: any;
  }> {
    const res = await fetch(`${BASE_URL}/director/compile-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`AI 3D Scene compile failed: ${res.statusText}`);
    return res.json();
  },

  async compileScene(payload: {
    prompt: string;
    category?: string;
    aspectRatio?: string;
    targetDurationSeconds?: number;
  }) {
    return this.compilePromptTo3DScene(payload);
  },

  async getCameraPresets(): Promise<{ success: boolean; presets: CameraPresetItem[] }> {
    const res = await fetch(`${BASE_URL}/director/camera-presets`);
    if (!res.ok) throw new Error(`Failed to load camera presets: ${res.statusText}`);
    return res.json();
  },

  // ── Group 4: 3D Render & Building Engines ──────────────────────────────────
  async renderMotionLoop(payload: {
    query: string;
    durationSeconds?: number;
    aspectRatio?: string;
    subtitles?: { text: string; fontSize?: number; primaryColorHex?: string };
    audioTrackUrl?: string;
  }): Promise<RenderResultResponse> {
    const res = await fetch(`${BASE_URL}/render/motion-loop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Render 3D loop failed: ${res.statusText}`);
    return res.json();
  },

  async renderBlenderHybrid(payload: {
    sceneId?: string;
    prompt?: string;
    query?: string;
    scenePrompt3D?: string;
    cameraMotion?: string;
    character?: {
      archetype?: string;
      name?: string;
      motion?: string;
      outfitColorHex?: string;
      modelUrl?: string;
    };
    objects?: Array<{
      type?: string;
      name?: string;
      motion?: string;
      modelUrl?: string;
    }>;
    environment?: {
      theme?: string;
      atmosphere?: string;
    };
    durationSeconds?: number;
    aspectRatio?: string;
    shadingStyle?: string;
    subtitles?: { text: string };
    animateMotion?: boolean;
  }): Promise<RenderResultResponse> {
    const res = await fetch(`${BASE_URL}/render/blender-hybrid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Render Blender hybrid failed: ${res.statusText}`);
    return res.json();
  },

  async renderBlenderFull(payload: {
    sceneId?: string;
    prompt?: string;
    query?: string;
    scenePrompt3D?: string;
    cameraMotion?: string;
    character?: {
      archetype?: string;
      name?: string;
      motion?: string;
      outfitColorHex?: string;
      modelUrl?: string;
    };
    objects?: Array<{
      type?: string;
      name?: string;
      motion?: string;
      modelUrl?: string;
    }>;
    environment?: {
      theme?: string;
      atmosphere?: string;
    };
    durationSeconds?: number;
    fps?: number;
    aspectRatio?: string;
    shadingStyle?: string;
    subtitles?: { text: string };
    animateMotion?: boolean;
  }): Promise<RenderResultResponse> {
    const res = await fetch(`${BASE_URL}/render/blender-full`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Render Blender full CGI sequence failed: ${res.statusText}`);
    return res.json();
  },

  async saveWebGLStream(blob: Blob, filename = 'webgl_stream.webm'): Promise<{
    success: boolean;
    clipId: string;
    videoUrl: string;
    durationSeconds: number;
  }> {
    const formData = new FormData();
    formData.append('file', blob, filename);
    const res = await fetch(`${BASE_URL}/render/webgl-stream-save`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Failed to save WebGL stream: ${res.statusText}`);
    return res.json();
  },

  // ── Group 5: Jobs, Status & Master Assembly ────────────────────────────────
  async getJobStatus(jobId: string): Promise<{
    success: boolean;
    jobId: string;
    status: string;
    currentFrame: number;
    totalFrames: number;
    percentComplete: number;
    outputVideoUrl?: string;
  }> {
    const res = await fetch(`${BASE_URL}/jobs/${encodeURIComponent(jobId)}/status`);
    if (!res.ok) throw new Error(`Job status check failed: ${res.statusText}`);
    return res.json();
  },

  async cancelJob(jobId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/jobs/${encodeURIComponent(jobId)}/cancel`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Cancel job failed: ${res.statusText}`);
    return res.json();
  },

  async assembleShort(payload: {
    title?: string;
    sceneVideoUrls: string[];
    audioConfig?: { soundtrackUrl?: string; musicVolume?: number };
    aspectRatio?: string;
  }): Promise<AssembleShortResponse> {
    const res = await fetch(`${BASE_URL}/render/assemble-short`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Assemble short failed: ${res.statusText}`);
    return res.json();
  },
};

