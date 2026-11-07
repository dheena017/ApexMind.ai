# ApexMind.ai — Stage 3: Visual Production Implementation & Verification Report (Milestones P0–P8)

**Document Version:** 1.0.0  
**Date:** November 7, 2026  
**Status:** COMPLETE & VERIFIED  
**Architecture Plan Baseline:** `Stage 3 Visual Production Architecture & Implementation Plan v1.1.0`  
**Primary Endpoint:** `POST /api/studio/generate-visuals`  
**Author:** ApexMind.ai Core Engine Architecture Team  

---

## 1. Executive Summary

ApexMind.ai **Stage 3: Visual Production** has been fully implemented, tested, and verified across all milestones (**P0 through P8**). Stage 3 transforms approved narrative storyboards from Stage 1 and duration-locked audio narration from Stage 2 into cinematic, high-fidelity visual scene assets.

### 1.1 Architecture Decisions Enforced
| Decision Area | Frozen Architectural Rule | Verified Implementation Status |
| :--- | :--- | :--- |
| **Default Mode** | **Media** is default production mode | Verified. All generation runs default to `ProductionMode.MEDIA` unless overridden |
| **Alternative Modes** | **3D**, **Hybrid**, and **Automatic** fully supported | Verified. Procedural 3D (Blender 5.2.3 LTS) and Hybrid compositing operational |
| **Quality Target** | **Cinematic** aesthetic & technical threshold | Verified. 3-Category Quality Gate enforcing resolution, bitrate, pacing, and licensing |
| **Review Workflow** | **Preview before approval** | Verified. Scenes start in `preview_ready`; master preview assembles upon full approval |
| **Selective Regeneration** | Scene-level regeneration with rollback | Verified. Atomic version incrementation (`v1 -> v2`) and failed rollback preservation |
| **Downstream Boundary** | Video Rendering remains external capability | Verified. `video_render_service.py` kept outside Stage 1–4 numbering |

---

## 2. Milestone Implementation Breakdown (P0–P8)

### Milestone P0: Repository & Dependency Audit
- **Audit Deliverable**: [`docs/audit/stage3-visual-production-repository-audit.md`](file:///c:/Users/dheen/project/ApexMind.ai/docs/audit/stage3-visual-production-repository-audit.md)
- **Binary Toolchain Verification**:
  - **Blender 5.2.3 LTS**: Verified at `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` (AMD64 headless execution).
  - **FFmpeg & FFprobe 8.1.1**: Verified in system PATH for duration adaptation, stream probing, and filtergraph compositing.
  - **Memory Safety**: Host RAM (16.0 GB) protected by dedicated single-worker hardware serialization (`threading.Lock` / `threading.Semaphore(1)`).
- **Baseline Verification**: Baseline tests passed (38/38) and frontend TypeScript check passed with 0 errors.

---

### Milestone P1: Visual Schemas, Configuration & Storage Manager
- **Core Files Created**:
  - [`schemas.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/visual_production/schemas.py): Defined Pydantic models for `ProductionMode`, `VisualQualityPreset`, `SceneVisualOutput`, `VisualGenerationManifest`, `VisualQualityScore`, and request/response payloads.
  - [`config.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/visual_production/config.py): Environment settings, default stock provider priorities, Blender executable detection, and FFmpeg timeout controls.
  - [`storage/visual_storage.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/visual_production/storage/visual_storage.py): Script-scoped visual asset directory manager (`data/projects/{script_id}/visuals/`), version management (`{scene_id}_v{version}.mp4`), manifest serialization, and rollback safety.
- **Unit Test Coverage**: [`test_visual_production_p1.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p1.py) (6/6 tests passed).

---

### Milestone P2: Orchestration, 3-Tier Mode Routing & Scene Analyzer
- **Core Files Created**:
  - [`scene_analyzer.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/visual_production/engine/scene_analyzer.py): Weighted heuristic scoring evaluating storyboard visual descriptions, character action verbs, and environment types to classify optimal path (`media`, `three_d`, or `hybrid`) when `mode="auto"`.
  - [`visual_orchestrator.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/visual_production/engine/visual_orchestrator.py): Master lifecycle coordinator managing multi-scene batch generation, voice duration locking, single-scene regeneration, and approval transitions.
- **Unit Test Coverage**: [`test_visual_production_p2.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p2.py) (5/5 tests passed).

---

### Milestone P3: Path A — Stock & Curated Media Engine
- **Core Files Created**:
  - [`media/media_engine.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/visual_production/media/media_engine.py):
    - Multi-provider fallback ingestion (Pexels, Pixabay, Wikimedia, synthetic plates).
    - Precise FFmpeg duration adaptation: trimming longer video clips to exact scene narration length, seamless looping for short clips (`stream_loop`), poster extraction (`fps=1`, `scale=720:1280`), and resolution normalization.
- **Unit Test Coverage**: [`test_visual_production_p3.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p3.py) (3/3 tests passed).

---

### Milestone P4: Path B — 3D Blender Procedural Engine
- **Core Files Created**:
  - [`three_d/blender_executor.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/visual_production/three_d/blender_executor.py): Thread-safe headless subprocess manager with hardware concurrency throttle (`Semaphore(1)`), timeout guards (180s), and clean temp file lifecycle.
  - [`render_template.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/visual_production/three_d/generators/render_template.py): Standalone Python script executed within Blender context constructing procedural geometry, 3-point studio lighting, cubic bezier camera motion paths, and EEVEE-Next rendering.
  - [`three_d_engine.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/visual_production/three_d/generators/three_d_engine.py): High-level 3D visual generator mapping storyboard camera cues (pan, tilt, dolly, orbit, zoom) and environment styles into procedural parameters.
- **Unit Test Coverage**: [`test_visual_production_p4.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p4.py) (3/3 tests passed).

---

### Milestone P5: Path C — Hybrid Compositing Engine
- **Core Files Created**:
  - [`hybrid/hybrid_engine.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/visual_production/hybrid/hybrid_engine.py):
    - Orchestrates concurrent background media retrieval and transparent foreground 3D element rendering (RGBA PNG sequence or ProRes with alpha).
    - Executes dual-input FFmpeg complex filtergraph (`[0:v][1:v]overlay=x=(W-w)/2:y=(H-h)/2:shortest=1[outv]`) to composite 3D models seamlessly over curated real-world or stylized stock video plates.
- **Unit Test Coverage**: [`test_visual_production_p5.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p5.py) (1/1 test passed).

---

### Milestone P6: Quality Gate & Scene Approval Lifecycle
- **Core Files Created**:
  - [`quality/quality_gate.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/visual_production/quality/quality_gate.py):
    - **Category 1 (Technical)**: Probe stream parameters using FFprobe (codec, dimensions, framerate, duration drift $\le 0.10\text{s}$, bitrate $\ge 2.5\text{ Mbps}$).
    - **Category 2 (Aesthetic)**: Framerate smoothness, aspect ratio conformance (9:16 portrait or 16:9 widescreen), visual composition.
    - **Category 3 (Legal & Provenance)**: Verifies asset license compliance (Pexels, Pixabay, CC-0, synthetic attribution).
  - [`engine/approval_manager.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/visual_production/engine/approval_manager.py):
    - Updates scene state machine (`preview_ready` $\to$ `approved` / `rejected`).
    - When all scenes reach `approved` status, automatically triggers FFmpeg demuxer concatenation to compile the master visual preview (`master_visual_preview.mp4`).
- **Unit Test Coverage**: [`test_visual_production_p6.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p6.py) (3/3 tests passed).

---

### Milestone P7: Public REST APIs, Durable Jobs & Frontend Studio Integration
- **Backend API & Job Integration**:
  - Added endpoints to [`backend/features/workspace/router.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/router.py):
    - `POST /api/studio/generate-visuals` (synchronous batch generation)
    - `POST /api/studio/generate-visuals/async` (durable background job)
    - `GET /api/studio/scripts/{id}/visuals` (manifest & scene preview retrieval)
    - `POST /api/studio/scripts/{id}/visuals/scenes/{sceneId}/regenerate` (single-scene regeneration)
    - `POST /api/studio/scripts/{id}/visuals/scenes/{sceneId}/approve` (preview approval or rejection)
  - Registered `job_type="visuals"` and visual progress phases in [`job_status.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/generation_jobs/job_status.py) and [`job_service.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/features/workspace/generation_jobs/job_service.py).
- **Frontend Studio UI**:
  - Extended [`studioApi.ts`](file:///c:/Users/dheen/project/ApexMind.ai/frontend/src/features/workspace/api/studioApi.ts) with typed client methods for all visual endpoints.
  - Implemented [`VisualsTab.tsx`](file:///c:/Users/dheen/project/ApexMind.ai/frontend/src/features/workspace/components/panes/ai-agent-creator/VisualsTab.tsx) featuring:
    - Mode selector (Media default, 3D, Hybrid, Automatic).
    - Scene preview cards with thumbnail, duration badge, mode tag, and quality score.
    - Embedded video player for reviewing generated clips before approval.
    - One-click Approve and Reject buttons with modal for regeneration feedback.
    - Progress polling indicator during asynchronous generation jobs.
  - Wired tab into [`AIAgentCreatorPane.tsx`](file:///c:/Users/dheen/project/ApexMind.ai/frontend/src/features/workspace/components/panes/AIAgentCreatorPane.tsx).
- **Unit & Type Check Coverage**: [`test_visual_production_p7.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p7.py) (3/3 tests passed); `npx tsc --noEmit` passed with 0 errors.

---

### Milestone P8: Golden Fixture Verification & End-to-End Proof
- **End-to-End Test Suite**: [`test_visual_production_p0_p8.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p0_p8.py)
- **Golden Fixture Validated**: *The Decennial Sky* (`scr_8f716fa53031`) with 8 storyboard scenes and 28.42 seconds of Stage 2 narration audio.
- **Scenarios Verified**:
  1. `test_stage3_golden_storyboard_automatic_path_selection`: Verified Automatic path routing across all 8 scenes, allocating stock media for environmental shots and procedural 3D for abstract camera maneuvers.
  2. `test_stage3_scene_duration_audio_lock`: Verified exact duration alignment against Stage 2 audio timeline offsets ($|\Delta t| \le 0.05\text{s}$).
  3. `test_stage3_cinematic_quality_gate_compliance`: Verified Quality Gate scoring ($\ge 0.85$ across all technical, aesthetic, and licensing categories).
  4. `test_stage3_selective_regeneration_and_master_preview`: Verified single-scene regeneration (`scn_01_f066b2` upgraded to v2), approval transitions, and master video preview assembly.
- **Unit Test Coverage**: [`test_visual_production_p0_p8.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p0_p8.py) (4/4 tests passed).

---

## 3. Verification Test Evidence Summary

### 3.1 Stage 3 Test Suite Execution Summary
| Test Module | Coverage Area | Status | Execution Time |
| :--- | :--- | :--- | :--- |
| [`test_visual_production_p1.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p1.py) | Schemas, Config, Storage & Rollback | **6 / 6 PASSED** | ~1.5s |
| [`test_visual_production_p2.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p2.py) | Orchestration, 3-Tier Routing, Approval | **5 / 5 PASSED** | ~125.2s |
| [`test_visual_production_p3.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p3.py) | Path A: Stock Media & FFmpeg Adaptation | **3 / 3 PASSED** | ~4.8s |
| [`test_visual_production_p4.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p4.py) | Path B: Blender 3D Headless Engine | **3 / 3 PASSED** | ~28.4s |
| [`test_visual_production_p5.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p5.py) | Path C: Hybrid Overlay Compositing | **1 / 1 PASSED** | ~18.2s |
| [`test_visual_production_p6.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p6.py) | Quality Gate & Master Assembly | **3 / 3 PASSED** | ~3.1s |
| [`test_visual_production_p7.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p7.py) | REST Endpoints, Async Jobs, Rollback | **3 / 3 PASSED** | ~6.5s |
| [`test_visual_production_p0_p8.py`](file:///c:/Users/dheen/project/ApexMind.ai/backend/tests/test_visual_production_p0_p8.py) | Golden Storyboard End-to-End Verification | **4 / 4 PASSED** | ~114.7s |
| **Total Stage 3 Tests** | **Comprehensive Full Suite** | **28 / 28 PASSED** | **100% Success** |

### 3.2 Regression Suite Integrity
| Pipeline Stage | Test Suite | Result |
| :--- | :--- | :--- |
| **Stage 1 (Storyboard)** | `test_asset_resolution_and_adherence.py`, `test_script_generation_v2.py` | **21 / 21 PASSED** |
| **Stage 2 (Voice)** | `test_voice_generation_v4_v7.py`, `test_voice_generation_v8_v10.py` | **17 / 17 PASSED** |
| **Frontend TypeScript** | `cd frontend; npx tsc --noEmit` | **0 ERRORS** |

---

## 4. Production Path Architecture Details

```
                                Stage 1 Storyboard + Stage 2 Narration Timings
                                                     │
                                                     ▼
                                       ┌───────────────────────────┐
                                       │    Visual Orchestrator    │
                                       └─────────────┬─────────────┘
                                                     │
                     ┌───────────────────────────────┼───────────────────────────────┐
                     ▼                               ▼                               ▼
       ┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
       │   Path A: Media Engine    │   │    Path B: 3D Engine      │   │   Path C: Hybrid Engine   │
       │   (Default Production)    │   │    (Blender 5.2.3 LTS)    │   │  (3D + Video Composite)   │
       ├───────────────────────────┤   ├───────────────────────────┤   ├───────────────────────────┤
       │ • Pexels / Pixabay API    │   │ • Procedural Meshes       │   │ • Real Stock Plate Base   │
       │ • Trim / Seamless Loop    │   │ • 3-Point Studio Lighting │   │ • Alpha 3D Model Overlay  │
       │ • FFmpeg Duration Lock    │   │ • Cubic Bezier Camera     │   │ • FFmpeg Complex Filter   │
       └─────────────┬─────────────┘   └─────────────┬─────────────┘   └─────────────┬─────────────┘
                     │                               │                               │
                     └───────────────────────────────┼───────────────────────────────┘
                                                     ▼
                                       ┌───────────────────────────┐
                                       │  Cinematic Quality Gate   │
                                       │ (Technical, Aesthetic, IP)│
                                       └─────────────┬─────────────┘
                                                     │
                                                     ▼
                                       ┌───────────────────────────┐
                                       │  Preview Before Approval  │
                                       │ (Approve / Reject / Regen)│
                                       └─────────────┬─────────────┘
                                                     │ (All Approved)
                                                     ▼
                                       ┌───────────────────────────┐
                                       │   Master Preview Video    │
                                       │  (Concat Timeline Preview)│
                                       └───────────────────────────┘
```

---

## 5. Architectural Boundaries & Next Steps

1. **Stage 1–4 Integrity**:
   - **Stage 1 (Storyboard)**: Approved narrative script, scenes, characters, camera prompts.
   - **Stage 2 (Voice)**: Master narration track, scene audio clips, global timeline offsets.
   - **Stage 3 (Visuals)**: Media, 3D, and Hybrid visual scene generation, Quality Gate validation, preview and approval flow.
   - **Stage 4 (Captions)**: Audio-aligned subtitles and styled caption generation (next stage in pipeline).
2. **External Capabilities**:
   - Final timeline video rendering (`video_render_service.py`), multi-track audio ducking, and export transcoding remain dedicated downstream production capabilities and are not conflated with the 4-stage generation pipeline.

---
*ApexMind.ai — Stage 3: Visual Production is fully operational, verified against the frozen architecture, and ready for production deployment.*

