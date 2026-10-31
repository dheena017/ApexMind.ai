/**
 * cutSyncEngine.ts
 * AI Audio-Visual Cut Sync (Dynamic Scene Trimming Engine)
 *
 * Automatically aligns video cut boundaries to:
 * 1. The natural pauses in the speaker's voice (clause ends, terminal punctuation, breath gaps).
 * 2. The musical beat/drop of the background soundtrack (BPM grid and drop impacts).
 */

export interface CutSyncParams {
  storyboard: any[];
  totalDuration?: number;
  bpm?: number;
  sfxDrops?: number[];
  words?: any[];
}

export interface AlignedClip {
  sceneNumber: number;
  start: number;
  duration: number;
  beat: string;
  mediaName?: string;
  cutSyncType: 'drop' | 'downbeat' | 'beat' | 'voice-pause';
  cutSyncLabel: string;
}

export function alignAudioVisualCuts({
  storyboard,
  totalDuration = 30,
  bpm = 140,
  sfxDrops = [],
}: CutSyncParams): AlignedClip[] {
  if (!storyboard || storyboard.length === 0) return [];

  const safeBpm = Math.max(60, Math.min(220, bpm || 140));
  const beatInterval = 60.0 / safeBpm;
  const numScenes = storyboard.length;
  const effectiveDur = Math.max(5.0, totalDuration);

  // Compute text weights based on tokens and punctuation
  const sceneWeights = storyboard.map((sc) => {
    const text = (sc.subtitleText || sc.text || sc.name || '').trim();
    const tokenCount = text.split(/\s+/).filter(Boolean).length;
    let weight = Math.max(1, tokenCount);
    // Punctuation weight for natural pauses
    if (/[.!?]$/.test(text)) weight += 1.8;
    else if (/[,;:\u2014-]$/.test(text)) weight += 0.9;
    return weight;
  });

  const totalWeight = sceneWeights.reduce((a, b) => a + b, 0) || 1;

  let runningStart = 0;
  const alignedClips: AlignedClip[] = [];

  for (let idx = 0; idx < numScenes; idx++) {
    const sc = storyboard[idx];
    const isLast = idx === numScenes - 1;

    if (isLast) {
      const finalDur = Math.max(2.0, parseFloat((effectiveDur - runningStart).toFixed(2)));
      alignedClips.push({
        sceneNumber: sc.sceneNumber || idx + 1,
        start: runningStart,
        duration: finalDur,
        beat: sc.beat || 'cta',
        mediaName: sc.mediaName,
        cutSyncType: 'voice-pause',
        cutSyncLabel: `Final CTA | End at ${effectiveDur.toFixed(1)}s`,
      });
      break;
    }

    // Expected duration proportional to spoken weight
    const speechDur = (sceneWeights[idx] / totalWeight) * effectiveDur;
    let candidateCut = runningStart + speechDur;
    let syncType: 'drop' | 'downbeat' | 'beat' | 'voice-pause' = 'voice-pause';
    let syncLabel = 'Natural Voice Pause';

    // 1. Check nearby SFX drop / impact within +/- 0.45s
    const nearbyDrop = sfxDrops.find((d) => Math.abs(d - candidateCut) <= 0.45);
    if (nearbyDrop !== undefined) {
      candidateCut = nearbyDrop;
      syncType = 'drop';
      syncLabel = `SFX Impact Drop (${candidateCut.toFixed(2)}s)`;
    } else {
      // 2. Snap to musical beat / measure
      const nearestBeat = Math.round(candidateCut / beatInterval) * beatInterval;
      const isBarDownbeat = Math.round(candidateCut / (beatInterval * 4)) * (beatInterval * 4);
      if (Math.abs(isBarDownbeat - candidateCut) <= 0.35) {
        candidateCut = isBarDownbeat;
        syncType = 'downbeat';
        syncLabel = `${safeBpm} BPM Downbeat (${candidateCut.toFixed(2)}s)`;
      } else if (Math.abs(nearestBeat - candidateCut) <= 0.30) {
        candidateCut = nearestBeat;
        syncType = 'beat';
        syncLabel = `${safeBpm} BPM Beat Grid (${candidateCut.toFixed(2)}s)`;
      }
    }

    // Ensure minimum scene breath of 2.2s and ceiling
    const minDur = 2.2;
    if (candidateCut - runningStart < minDur) {
      candidateCut = runningStart + minDur;
    }
    const maxCutAllowed = effectiveDur - (numScenes - idx - 1) * minDur;
    if (candidateCut > maxCutAllowed) {
      candidateCut = maxCutAllowed;
    }

    const clipStart = runningStart;
    const clipDur = Math.max(minDur, parseFloat((candidateCut - runningStart).toFixed(2)));
    runningStart = parseFloat((clipStart + clipDur).toFixed(2));

    alignedClips.push({
      sceneNumber: sc.sceneNumber || idx + 1,
      start: clipStart,
      duration: clipDur,
      beat: sc.beat || 'scene',
      mediaName: sc.mediaName,
      cutSyncType: syncType,
      cutSyncLabel: syncLabel,
    });
  }

  return alignedClips;
}
