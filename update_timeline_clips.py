with open('frontend/src/features/workspace/components/timeline/StudioTimelinePane.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''        const clipDuration = Number.isFinite(parsedDuration) && parsedDuration >= 3.0 ? parsedDuration : Math.max(3.0, parsedDuration || 3.5);
        const clipStart = Number.isFinite(parsedStart) && parsedStart >= runningStart ? parsedStart : runningStart;
        runningStart = parseFloat((clipStart + clipDuration).toFixed(2));'''

replacement = '''        const clipDuration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 2.5;
        const clipStart = Number.isFinite(parsedStart) ? parsedStart : runningStart;
        runningStart = parseFloat((clipStart + clipDuration).toFixed(2));'''

norm_text = text.replace('\r\n', '\n')
norm_target = target.replace('\r\n', '\n')
norm_rep = replacement.replace('\r\n', '\n')

assert norm_target in norm_text, "target not found in StudioTimelinePane.tsx"
norm_text = norm_text.replace(norm_target, norm_rep)

# Also ensure title and voice tracks are auto-enabled when storyboard loads with title/audio
target_tracks = '''      if (detail.duration && detail.duration > 0) {
        onTimelineDurationChange?.(detail.duration);
        setVideoDuration(detail.duration);
        setVoiceDuration(detail.duration);
      }'''

replacement_tracks = '''      if (detail.duration && detail.duration > 0) {
        onTimelineDurationChange?.(detail.duration);
        setVideoDuration(detail.duration);
        setVoiceDuration(detail.duration);
        setEnabledTracks((prev) => ({ ...prev, voice: true, title: Boolean(script.title) }));
        setVoiceTrackMuted(false);
        if (script.title) setTitleTrackVisible(true);
      }'''

norm_target_tracks = target_tracks.replace('\r\n', '\n')
norm_rep_tracks = replacement_tracks.replace('\r\n', '\n')
assert norm_target_tracks in norm_text, "target_tracks not found in StudioTimelinePane.tsx"
norm_text = norm_text.replace(norm_target_tracks, norm_rep_tracks)

with open('frontend/src/features/workspace/components/timeline/StudioTimelinePane.tsx', 'w', encoding='utf-8', newline='') as f:
    f.write(norm_text)
print("Updated StudioTimelinePane.tsx successfully!")

