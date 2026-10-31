"""
backend/features/workspace/video_render_service.py
High-performance server-side video rendering engine for ApexMind Studio.
Renders broadcast-quality, ultra-smooth 1080p 30/60 FPS MP4 videos using native FFmpeg,
with pristine H.264 High Profile, AAC stereo audio, color grading filters, and burned-in kinetic typography.
"""

import base64
import json
import logging
import os
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import urllib.request

logger = logging.getLogger("ApexMind.features.video_render")

# Output directory for rendered Shorts & studio videos
RENDER_DIR = Path("backend/data/rendered_shorts")
RENDER_DIR.mkdir(parents=True, exist_ok=True)

XFADE_MAP: Dict[str, str] = {
    # Fades, Blurs & Glitches
    "fade": "fade",
    "crossfade": "fade",
    "dissolve": "fade",
    "fade-black": "fadeblack",
    "fade-white": "fadewhite",
    "flash": "fadewhite",
    "luma-fade": "fade",
    "blur-crossfade": "hblur",
    "hblur": "hblur",
    "soft-rotate": "radial",
    "rgb-split": "fade",
    "glitch": "pixelize",
    "pixelize": "pixelize",
    "match-cut": "fade",
    # Slides & Pushes
    "slide-left": "slideleft",
    "slide-right": "slideright",
    "slide-up": "slideup",
    "slide-down": "slidedown",
    "push-left": "slideleft",
    "push-right": "slideright",
    "push-up": "slideup",
    "push-down": "slidedown",
    "whip-pan-left": "slideleft",
    "whip-pan-right": "slideright",
    # Zooms & Scales
    "zoom": "smoothup",
    "zoom-in": "smoothup",
    "zoom-out": "smoothdown",
    "smooth-zoom": "smoothup",
    "slow-zoom": "smoothup",
    # Wipes & Shapes
    "wipe": "wipeleft",
    "wipe-left": "wipeleft",
    "wipe-right": "wiperight",
    "wipe-up": "wipeup",
    "wipe-down": "wipedown",
    "circle-wipe": "circlecrop",
    "circle": "circlecrop",
    "circlecrop": "circlecrop",
    "split-reveal": "wipeleft",
    "radial": "radial",
    "none": "fade",
}


def hex_to_ass_color(hex_str: str, alpha: int = 0) -> str:
    """Converts a standard #RRGGBB hex color to ASS format &HAABBGGRR."""
    hex_clean = hex_str.lstrip("#").strip()
    if len(hex_clean) == 3:
        hex_clean = "".join(c * 2 for c in hex_clean)
    if len(hex_clean) != 6:
        hex_clean = "FACC15"  # default gold
    r = hex_clean[0:2]
    g = hex_clean[2:4]
    b = hex_clean[4:6]
    aa = f"{alpha:02X}"
    return f"&H{aa}{b}{g}{r}"


def format_ass_time(seconds: float) -> str:
    """Formats seconds into ASS timestamp format: H:MM:SS.cs"""
    if not isinstance(seconds, (int, float)) or seconds < 0:
        seconds = 0.0
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int(round((seconds - int(seconds)) * 100))
    if centis >= 100:
        centis = 99
    return f"{hrs}:{mins:02d}:{secs:02d}.{centis:02d}"


def save_audio_payload(url_or_data: str, temp_dir: Path) -> Optional[Path]:
    """Saves a data: URL, local file, or remote HTTP URL to a temporary audio file."""
    if not url_or_data:
        return None

    # 1. Base64 Data URL
    if url_or_data.startswith("data:"):
        try:
            header, encoded = url_or_data.split(",", 1)
            ext = "wav"
            if "mp3" in header or "mpeg" in header:
                ext = "mp3"
            elif "ogg" in header:
                ext = "ogg"
            elif "aac" in header or "m4a" in header:
                ext = "aac"
            out_file = temp_dir / f"voiceover_{int(time.time()*1000)}.{ext}"
            with open(out_file, "wb") as f:
                f.write(base64.b64decode(encoded))
            return out_file
        except Exception as e:
            logger.warning(f"Could not decode base64 audio data URL: {e}")
            return None

    # 2. Local relative path or static asset path
    if url_or_data.startswith("/api/audio/"):
        filename = url_or_data.rsplit("/", 1)[-1]
        local_cand = Path("backend/data/audio") / filename
        if local_cand.exists():
            return local_cand

    if url_or_data.startswith("/") or not url_or_data.startswith("http"):
        clean_path = url_or_data.lstrip("/")
        for base in [Path("."), Path("backend/data"), Path("frontend/public"), Path("backend/data/media")]:
            cand = base / clean_path
            if cand.exists():
                return cand

    # 3. Remote HTTP URL
    if url_or_data.startswith("http://") or url_or_data.startswith("https://"):
        try:
            out_file = temp_dir / f"remote_audio_{int(time.time()*1000)}.mp3"
            req = urllib.request.Request(url_or_data, headers={"User-Agent": "ApexMindStudio/2.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                with open(out_file, "wb") as f:
                    f.write(resp.read())
            return out_file
        except Exception as e:
            logger.warning(f"Could not download remote audio from {url_or_data}: {e}")
            return None

    return None


def save_backdrop_payload(url_or_data: str, temp_dir: Path) -> tuple[Optional[Path], str]:
    """Saves image or video backdrop to a local temporary path. Returns (path, 'image'|'video')."""
    if not url_or_data:
        return None, "none"

    # Base64 Data URL
    if url_or_data.startswith("data:"):
        try:
            header, encoded = url_or_data.split(",", 1)
            is_video = "video" in header
            ext = "mp4" if is_video else "jpg"
            out_file = temp_dir / f"backdrop_{int(time.time()*1000)}.{ext}"
            with open(out_file, "wb") as f:
                f.write(base64.b64decode(encoded))
            return out_file, ("video" if is_video else "image")
        except Exception as e:
            logger.warning(f"Could not decode backdrop data URL: {e}")
            return None, "none"

    # Local Path
    is_video_ext = any(url_or_data.lower().endswith(ext) for ext in [".mp4", ".webm", ".mov", ".mkv"])
    media_type = "video" if is_video_ext else "image"

    if url_or_data.startswith("/") or not url_or_data.startswith("http"):
        clean_path = url_or_data.lstrip("/")
        for base in [Path("."), Path("backend/data"), Path("frontend/public"), Path("backend/data/media")]:
            cand = base / clean_path
            if cand.exists():
                return cand, media_type

    # Remote HTTP URL
    if url_or_data.startswith("http://") or url_or_data.startswith("https://"):
        try:
            ext = "mp4" if media_type == "video" else "jpg"
            out_file = temp_dir / f"backdrop_{int(time.time()*1000)}.{ext}"
            req = urllib.request.Request(url_or_data, headers={"User-Agent": "ApexMindStudio/2.0"})
            with urllib.request.urlopen(req, timeout=18) as resp:
                with open(out_file, "wb") as f:
                    f.write(resp.read())
            return out_file, media_type
        except Exception as e:
            logger.warning(f"Could not download remote backdrop: {e}")
            return None, "none"

    return None, "none"


def generate_ass_subtitle_file(
    ass_path: Path,
    width: int,
    height: int,
    title: Optional[str],
    subtitles: List[Dict[str, Any]],
    caption_color_hex: str = "#FACC15",
    caption_font: str = "Impact",
    caption_transform: str = "uppercase",
) -> None:
    """Generates an Advanced Substation Alpha (.ass) subtitle file formatted for viral Shorts / Reels."""
    caption_color_ass = hex_to_ass_color(caption_color_hex)
    font_size = int(round(width * 0.062))  # ~67px on 1080p
    title_font_size = int(round(width * 0.046))  # ~50px on 1080p
    
    # Safe vertical zone for TikTok/IG Reels/Shorts overlay controls
    if height > width:  # vertical 9:16
        vert_margin = int(round(height * 0.22))  # Safe zone above bottom bar
        title_vert_margin = int(round(height * 0.12))  # Below top notch
    else:
        vert_margin = int(round(height * 0.12))
        title_vert_margin = int(round(height * 0.08))

    font_family = (caption_font or "Impact").strip()

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Subtitle,{font_family},Impact,Arial Black,Montserrat,{font_size},{caption_color_ass},&H00FFFFFF,&H00000000,&HC0000000,-1,0,0,0,100,100,1,0,1,6.0,4.0,2,40,40,{vert_margin},1
Style: Title,Arial Black,Impact,Montserrat,{title_font_size},&H00FFFFFF,&H000000FF,&H00000000,&HA0000000,-1,0,0,0,100,100,1,0,1,5.0,3.0,8,40,40,{title_vert_margin},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    dialogues = []

    # Title Banner (visible for first 3.2s with subtle fade in/out)
    clean_title = (title or "").strip().replace("\n", " ")
    if clean_title:
        dialogues.append(
            f"Dialogue: 0,0:00:00.10,0:00:03.20,Title,,0,0,0,,{{\\fad(200,350)}}{clean_title}"
        )

    # Subtitles (with Frame-Accurate Karaoke Word Highlights & Viral Styling)
    for sub in subtitles:
        raw_text = str(sub.get("text", "")).strip()
        if not raw_text:
            continue
        if caption_transform == "uppercase":
            raw_text = raw_text.upper()
        text = raw_text.replace("\n", "\\N")
        
        start = float(sub.get("start", 0))
        duration = float(sub.get("duration", 2.5))
        end = start + duration
        start_fmt = format_ass_time(start)
        end_fmt = format_ass_time(end)

        words = sub.get("words")
        if words and isinstance(words, list) and len(words) > 0:
            k_parts = []
            for w in words:
                w_str = str(w.get("word", "")).strip()
                if not w_str:
                    continue
                if caption_transform == "uppercase":
                    w_str = w_str.upper()
                w_dur = float(w.get("duration", 0) or (float(w.get("end", 0)) - float(w.get("start", 0))))
                cs = max(1, int(round(w_dur * 100)))
                
                # Check for custom emphasis highlight color
                hl_color = w.get("highlightColor")
                is_emp = bool(w.get("emphasis"))
                if hl_color:
                    hl_ass = hex_to_ass_color(hl_color)
                    k_parts.append(f"{{\\k{cs}\\c{hl_ass}\\b1}}{w_str}{{\\c{caption_color_ass}\\b0}}")
                elif is_emp:
                    k_parts.append(f"{{\\k{cs}\\b1}}{w_str}{{\\b0}}")
                else:
                    k_parts.append(f"{{\\k{cs}}}{w_str}")

            if k_parts:
                k_text = " ".join(k_parts)
                dialogues.append(
                    f"Dialogue: 0,{start_fmt},{end_fmt},Subtitle,,0,0,0,,{{\\fad(90,90)}}{k_text}"
                )
                continue

        dialogues.append(
            f"Dialogue: 0,{start_fmt},{end_fmt},Subtitle,,0,0,0,,{{\\fad(100,100)}}{text}"
        )

    content = header + "\n".join(dialogues) + "\n"
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(content)


def build_color_filter_chain(filter_settings: Optional[Dict[str, Any]]) -> List[str]:
    """Generates FFmpeg video filter clauses for brightness, contrast, saturation, blur, vignette, and color presets."""
    if not filter_settings:
        return []

    filters: List[str] = []

    b = float(filter_settings.get("brightness", 100))
    c = float(filter_settings.get("contrast", 100))
    s = float(filter_settings.get("saturate", 100))

    if b != 100 or c != 100 or s != 100:
        b_val = (b - 100.0) / 100.0 * 0.45  # safe range [-0.45, 0.45]
        c_val = max(0.2, min(2.0, c / 100.0))
        s_val = max(0.0, min(3.0, s / 100.0))
        filters.append(f"eq=brightness={b_val:.3f}:contrast={c_val:.3f}:saturation={s_val:.3f}")

    blur_val = float(filter_settings.get("blur", 0))
    if blur_val > 0:
        sigma = min(15.0, blur_val * 0.5)
        filters.append(f"gblur=sigma={sigma:.2f}")

    preset = filter_settings.get("presetFilter")
    if preset == "noir":
        filters.append("hue=s=0,eq=contrast=1.22:brightness=-0.04")
    elif preset == "cinematic":
        filters.append("colorbalance=rs=0.06:bs=-0.06,eq=contrast=1.1:saturation=1.15")
    elif preset == "cyberpunk":
        filters.append("colorbalance=rs=0.08:gs=-0.04:bs=0.1,eq=contrast=1.2:saturation=1.4")
    elif preset == "warm":
        filters.append("colorbalance=rs=0.08:gs=0.02:bs=-0.08")
    elif preset == "cool":
        filters.append("colorbalance=rs=-0.06:gs=0.02:bs=0.08")

    vignette = float(filter_settings.get("vignette", 0))
    if vignette > 15:
        angle = 0.35 + (vignette / 100.0) * 0.45
        filters.append(f"vignette=angle={angle:.2f}")

    return filters


def render_studio_video(
    title: str,
    aspect_ratio: str = "9:16",
    duration: float = 15.0,
    exact_duration: Optional[float] = None,
    audio_url: Optional[str] = None,
    music_url: Optional[str] = None,
    backdrop_url: Optional[str] = None,
    backdrop_type: str = "image",
    video_clips: Optional[List[Dict[str, Any]]] = None,
    image_clips: Optional[List[Dict[str, Any]]] = None,
    sfx_clips: Optional[List[Dict[str, Any]]] = None,
    subtitles: Optional[List[Dict[str, Any]]] = None,
    caption_color: str = "#FACC15",
    caption_font: Optional[str] = "Impact",
    caption_transform: Optional[str] = "uppercase",
    filter_settings: Optional[Dict[str, Any]] = None,
    voice_volume: Optional[float] = 1.0,
    music_volume: Optional[float] = 0.65,
    sfx_volume: Optional[float] = 0.85,
    ducking_settings: Optional[Dict[str, Any]] = None,
    fps: int = 30,
    **kwargs,
) -> Dict[str, Any]:
    """Renders a broadcast-quality Full HD MP4 video using native FFmpeg.
    
    Supports:
    - Multi-clip sequenced timeline video & image tracks
    - Real hardware/software FFmpeg transitions (slide-right, slide-left, fade, dissolve, etc.)
    - Exact frame & second duration without artificial 15s/30s stretching
    - Visual color grading filters (brightness, contrast, saturation, blur, vignette, presets)
    - Mixed voiceover + soundtrack AAC stereo audio with smart ducking and fades
    - Burned-in ASS typography subtitles with kinetic fade in/out
    - Automatic poster thumbnail generation
    """
    subtitles = subtitles or []
    max_sub_end = 0.0
    for s in subtitles:
        st = float(s.get("start", 0.0))
        dur = float(s.get("duration", 2.5))
        if st + dur > max_sub_end:
            max_sub_end = st + dur

    # Combine video clips and image clips chronologically
    all_clips: List[Dict[str, Any]] = []
    if video_clips:
        for c in video_clips:
            if c.get("url"):
                all_clips.append({**c, "type": c.get("type") or "video"})
    if image_clips:
        for c in image_clips:
            if c.get("url"):
                all_clips.append({**c, "type": c.get("type") or "image"})
    
    all_clips.sort(key=lambda c: float(c.get("start", 0.0)))

    # Duration: prioritize exact timeline duration if specified or calculated from clips
    if exact_duration and float(exact_duration) > 0:
        safe_duration = max(0.5, float(exact_duration))
    elif all_clips:
        max_clip_end = max((float(c.get("start", 0.0)) + float(c.get("duration", 3.0))) for c in all_clips)
        safe_duration = max(0.5, max_clip_end)
    else:
        target_duration = max(float(duration), max_sub_end)
        if target_duration < 10.0 and max_sub_end == 0.0:
            target_duration = 15.0
        safe_duration = max(5.0, min(300.0, target_duration))

    # Aspect ratio resolution
    dim_map = {
        "9:16": (1080, 1920),
        "16:9": (1920, 1080),
        "1:1": (1080, 1080),
        "4:5": (1080, 1350),
        "21:9": (1920, 823),
    }
    width, height = dim_map.get(aspect_ratio, (1080, 1920))
    render_fps = 60 if fps == 60 else 30

    clean_title = re.sub(r'[<>:"/\\|?*]+', '', title.strip())[:60] or "apexmind-video"
    time_stamp = int(time.time() * 1000)
    out_filename = f"{clean_title}_{time_stamp}.mp4"
    thumb_filename = f"{clean_title}_{time_stamp}_thumb.jpg"
    out_path = RENDER_DIR / out_filename
    thumb_path = RENDER_DIR / thumb_filename

    temp_dir = Path(tempfile.mkdtemp(prefix="apex_render_"))

    try:
        # 1. Process voiceover audio
        voice_file = save_audio_payload(audio_url, temp_dir) if audio_url else None

        # 2. Process background music
        music_file = save_audio_payload(music_url, temp_dir) if music_url else None

        # 3. Generate ASS subtitles file
        ass_path = temp_dir / "subtitles.ass"
        generate_ass_subtitle_file(
            ass_path=ass_path,
            width=width,
            height=height,
            title=title,
            subtitles=subtitles,
            caption_color_hex=caption_color,
            caption_font=caption_font or "Impact",
            caption_transform=caption_transform or "uppercase",
        )
        ass_path_escaped = str(ass_path.resolve()).replace("\\", "/").replace(":", "\\:")

        # 4. Build FFmpeg command
        cmd = ["ffmpeg", "-y"]
        video_filters: List[str] = []
        input_count = 0

        # Multi-clip visual stream
        if all_clips:
            clip_inputs = []
            for idx, clip in enumerate(all_clips):
                c_url = clip.get("url")
                c_file, c_type = save_backdrop_payload(c_url, temp_dir) if c_url else (None, "none")
                if not c_file or not c_file.exists():
                    c_file = temp_dir / f"fallback_{idx}.mp4"
                    subprocess.run([
                        "ffmpeg", "-y", "-f", "lavfi",
                        "-i", f"color=c=#0B0F19:s={width}x{height}:r={render_fps}:d=5",
                        "-t", "5", "-c:v", "libx264", "-pix_fmt", "yuv420p", str(c_file.resolve())
                    ], capture_output=True)
                    c_type = "video"
                clip_inputs.append((c_file, c_type, clip))

            for c_file, c_type, clip in clip_inputs:
                if c_type == "video":
                    cmd.extend(["-stream_loop", "-1", "-i", str(c_file.resolve())])
                else:
                    cmd.extend(["-loop", "1", "-i", str(c_file.resolve())])
            
            num_clips = len(clip_inputs)
            input_count = num_clips

            # Format each clip to exact canvas dimension, target FPS, and trimmed duration with cinematic camera motion & animations
            for i, (_, _, clip) in enumerate(clip_inputs):
                dur_i = max(0.1, float(clip.get("duration", 3.0)))
                motion = str(
                    clip.get("cameraMotion")
                    or clip.get("animationIn")
                    or clip.get("animation")
                    or ""
                ).lower()

                base_scale = f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},setsar=1,fps={render_fps}"

                if any(k in motion for k in ["push", "zoom-in", "slow-zoom", "orbital", "apex", "in"]):
                    motion_filter = f"scale=eval=frame:w='{width}*(1+0.09*t/{dur_i:.3f})':h='{height}*(1+0.09*t/{dur_i:.3f})',crop={width}:{height}"
                elif any(k in motion for k in ["pull", "zoom-out", "slow-pull", "out"]):
                    motion_filter = f"scale=eval=frame:w='{width}*(1.09-0.09*t/{dur_i:.3f})':h='{height}*(1.09-0.09*t/{dur_i:.3f})',crop={width}:{height}"
                elif any(k in motion for k in ["pan", "drift", "right", "left"]):
                    motion_filter = f"scale=eval=frame:w='{width}*1.08':h='{height}*1.08',crop={width}:{height}:x='(in_w-{width})*(t/{dur_i:.3f})':y='(in_h-{height})/2'"
                else:
                    motion_filter = f"scale=eval=frame:w='{width}*(1+0.04*t/{dur_i:.3f})':h='{height}*(1+0.04*t/{dur_i:.3f})',crop={width}:{height}"

                video_filters.append(
                    f"[{i}:v]{base_scale},{motion_filter},trim=duration={dur_i:.3f},setpts=PTS-STARTPTS[v_clip_{i}]"
                )

            if num_clips == 1:
                last_video_tag = "v_clip_0"
            else:
                prev_tag = "v_clip_0"
                curr_offset = max(0.1, float(clip_inputs[0][2].get("duration", 3.0)))
                for i in range(1, num_clips):
                    clip_prev = clip_inputs[i - 1][2]
                    clip_curr = clip_inputs[i][2]
                    trans_raw = str(clip_prev.get("transition") or clip_curr.get("transition") or "fade").lower()
                    xfade_type = XFADE_MAP.get(trans_raw) or "fade"
                    prev_dur = max(0.1, float(clip_prev.get("duration", 3.0)))
                    curr_dur = max(0.1, float(clip_curr.get("duration", 3.0)))
                    t_dur = float(clip_prev.get("transitionDuration") or clip_curr.get("transitionDuration") or 0.45)
                    t_dur = max(0.1, min(t_dur, prev_dur * 0.4, curr_dur * 0.4, 0.6))
                    offset = max(0.01, curr_offset - t_dur)
                    out_tag = f"v_xfade_{i}"
                    video_filters.append(
                        f"[{prev_tag}][v_clip_{i}]xfade=transition={xfade_type}:duration={t_dur:.3f}:offset={offset:.3f}[{out_tag}]"
                    )
                    prev_tag = out_tag
                    curr_offset = offset + curr_dur
                last_video_tag = prev_tag

            # Color grading filters
            color_filters = build_color_filter_chain(filter_settings)
            if color_filters:
                color_str = ",".join(color_filters)
                video_filters.append(f"[{last_video_tag}]{color_str}[v_graded]")
                last_video_tag = "v_graded"

            video_filters.append(f"[{last_video_tag}]ass='{ass_path_escaped}'[v_out]")
        else:
            # Single Backdrop mode
            backdrop_file, detected_type = save_backdrop_payload(backdrop_url, temp_dir) if backdrop_url else (None, "none")
            actual_type = detected_type if detected_type != "none" else backdrop_type
            if backdrop_file and backdrop_file.exists():
                if actual_type == "video":
                    cmd.extend(["-stream_loop", "-1", "-i", str(backdrop_file.resolve())])
                else:
                    cmd.extend(["-loop", "1", "-i", str(backdrop_file.resolve())])
            else:
                cmd.extend([
                    "-f", "lavfi",
                    "-i", f"color=c=#0B0F19:s={width}x{height}:r={render_fps}:d={safe_duration}"
                ])
            input_count = 1
            video_filters.append(
                f"[0:v]scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},setsar=1,fps={render_fps}[scaled]"
            )
            last_v = "scaled"
            color_filters = build_color_filter_chain(filter_settings)
            if color_filters:
                color_str = ",".join(color_filters)
                video_filters.append(f"[{last_v}]{color_str}[v_graded]")
                last_v = "v_graded"

            video_filters.append(f"[{last_v}]ass='{ass_path_escaped}'[v_out]")

        # ── Audio Inputs ──
        voice_input_idx = -1
        music_input_idx = -1

        if voice_file and voice_file.exists():
            cmd.extend(["-i", str(voice_file.resolve())])
            voice_input_idx = input_count
            input_count += 1

        if music_file and music_file.exists():
            cmd.extend(["-stream_loop", "-1", "-i", str(music_file.resolve())])
            music_input_idx = input_count
            input_count += 1

        # ── SFX Track Inputs (Whooshes, Transitions, Impact Drops) ──
        sfx_inputs: List[Tuple[int, float, float]] = []
        if sfx_clips:
            for sc in sfx_clips:
                u = sc.get("url") or sc.get("audioUrl")
                if not u:
                    continue
                sfx_f = save_audio_payload(u, temp_dir)
                if sfx_f and sfx_f.exists():
                    cmd.extend(["-i", str(sfx_f.resolve())])
                    sc_start = max(0.0, float(sc.get("start", 0.0)))
                    sc_vol = max(0.1, min(1.5, float(sc.get("volume", 0.85))))
                    sfx_inputs.append((input_count, sc_start, sc_vol))
                    input_count += 1

        if voice_input_idx == -1 and music_input_idx == -1 and not sfx_inputs:
            cmd.extend(["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"])
            silent_audio_idx = input_count
            input_count += 1
        else:
            silent_audio_idx = -1

        # ── Audio Mixing & Mastering with Sidechain Ducking & SFX ──
        audio_filters: List[str] = []
        v_vol = max(0.1, min(2.0, float(voice_volume if voice_volume is not None else 1.0)))
        m_vol = max(0.05, min(1.5, float(music_volume if music_volume is not None else 0.65)))
        sfx_eff_vol = max(0.1, min(1.5, float(sfx_volume if sfx_volume is not None else 0.85)))
        fade_out_start = max(0.5, safe_duration - 1.2)

        # Build SFX Layer
        sfx_layer_tag = None
        if sfx_inputs:
            sfx_ch_tags = []
            for j, (idx_sfx, start_s, vol_factor) in enumerate(sfx_inputs):
                delay_ms = int(round(start_s * 1000))
                eff_vol = sfx_eff_vol * vol_factor
                audio_filters.append(
                    f"[{idx_sfx}:a]volume={eff_vol:.2f},adelay={delay_ms}|{delay_ms},apad[sfx_ch_{j}]"
                )
                sfx_ch_tags.append(f"[sfx_ch_{j}]")
            if len(sfx_ch_tags) > 1:
                all_sfx_in = "".join(sfx_ch_tags)
                audio_filters.append(f"{all_sfx_in}amix=inputs={len(sfx_ch_tags)}:dropout_transition=2[sfx_master]")
                sfx_layer_tag = "[sfx_master]"
            else:
                sfx_layer_tag = sfx_ch_tags[0]

        if voice_input_idx != -1 and music_input_idx != -1:
            # ── Native FFmpeg Sidechain Audio Ducking ──
            ds = ducking_settings or {}
            threshold = float(ds.get("threshold", 0.045))
            ratio = float(ds.get("ratio", 4.5))
            attack_ms = float(ds.get("attackMs", 25))
            release_ms = float(ds.get("releaseMs", 320))
            makeup = float(ds.get("makeup", 1.0))

            audio_filters.append(f"[{voice_input_idx}:a]volume={v_vol:.2f},apad[voice_master]")
            audio_filters.append(f"[voice_master]asplit=2[voice_mix][voice_ctrl]")
            audio_filters.append(f"[{music_input_idx}:a]volume={m_vol:.2f},afade=t=in:st=0:d=0.35,apad[music_base]")
            audio_filters.append(
                f"[music_base][voice_ctrl]sidechaincompress=threshold={threshold:.3f}:ratio={ratio:.1f}:attack={attack_ms:.0f}:release={release_ms:.0f}:makeup={makeup:.1f}:detection=rms:link=average[music_ducked]"
            )

            if sfx_layer_tag:
                audio_filters.append(f"[voice_mix][music_ducked]{sfx_layer_tag}amix=inputs=3:duration=first:dropout_transition=2[a_mixed]")
            else:
                audio_filters.append(f"[voice_mix][music_ducked]amix=inputs=2:duration=first:dropout_transition=2[a_mixed]")

            audio_filters.append(
                f"[a_mixed]atrim=0:{safe_duration},afade=t=out:st={fade_out_start:.2f}:d=1.2,alimiter=limit=0.96:attack=5:release=50[a_out]"
            )
            audio_out_tag = "[a_out]"
        elif voice_input_idx != -1:
            if sfx_layer_tag:
                audio_filters.append(f"[{voice_input_idx}:a]volume={v_vol:.2f},apad[v_raw]")
                audio_filters.append(f"[v_raw]{sfx_layer_tag}amix=inputs=2:duration=first:dropout_transition=2[a_mixed]")
                audio_filters.append(f"[a_mixed]atrim=0:{safe_duration},afade=t=out:st={fade_out_start:.2f}:d=1.2,alimiter=limit=0.96[a_out]")
            else:
                audio_filters.append(f"[{voice_input_idx}:a]volume={v_vol:.2f},apad[a_padded]")
                audio_filters.append(f"[a_padded]atrim=0:{safe_duration},afade=t=out:st={fade_out_start:.2f}:d=1.2,alimiter=limit=0.96[a_out]")
            audio_out_tag = "[a_out]"
        elif music_input_idx != -1:
            audio_filters.append(f"[{music_input_idx}:a]volume={m_vol:.2f},afade=t=in:st=0:d=0.3,apad[m_raw]")
            if sfx_layer_tag:
                audio_filters.append(f"[m_raw]{sfx_layer_tag}amix=inputs=2:duration=first:dropout_transition=2[a_mixed]")
                audio_filters.append(f"[a_mixed]atrim=0:{safe_duration},afade=t=out:st={fade_out_start:.2f}:d=1.2,alimiter=limit=0.96[a_out]")
            else:
                audio_filters.append(f"[m_raw]atrim=0:{safe_duration},afade=t=out:st={fade_out_start:.2f}:d=1.2,alimiter=limit=0.96[a_out]")
            audio_out_tag = "[a_out]"
        elif sfx_layer_tag:
            audio_filters.append(f"{sfx_layer_tag}atrim=0:{safe_duration}[a_out]")
            audio_out_tag = "[a_out]"
        else:
            audio_filters.append(f"[{silent_audio_idx}:a]atrim=0:{safe_duration}[a_out]")
            audio_out_tag = "[a_out]"

        filter_complex_str = ";".join(video_filters + audio_filters)
        cmd.extend(["-filter_complex", filter_complex_str])

        cmd.extend([
            "-map", "[v_out]",
            "-map", audio_out_tag,
            "-t", str(safe_duration),
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-profile:v", "high",
            "-level", "4.2",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-colorspace", "bt709",
            "-color_primaries", "bt709",
            "-color_trc", "bt709",
            "-color_range", "tv",
            "-r", str(render_fps),
            "-c:a", "aac",
            "-b:a", "256k",
            "-ar", "48000",
            "-movflags", "+faststart",
            "-threads", "0",
            str(out_path.resolve()),
        ])

        t0 = time.time()
        logger.info(f"Starting multi-clip native FFmpeg render: {out_filename} ({width}x{height}, {render_fps} FPS, {safe_duration}s)...")
        res = subprocess.run(cmd, capture_output=True, text=True)

        if res.returncode != 0:
            logger.error(f"FFmpeg render failed (code {res.returncode}):\n{res.stderr[-1000:]}")
            raise RuntimeError(f"FFmpeg render error: {res.stderr[-300:]}")

        elapsed = time.time() - t0
        file_size_mb = out_path.stat().st_size / (1024 * 1024)
        logger.info(f"Render completed in {elapsed:.2f}s ({file_size_mb:.2f} MB): {out_path.name}")

        # Extract companion poster thumbnail
        thumb_time = min(2.0, max(0.5, safe_duration * 0.5))
        try:
            subprocess.run([
                "ffmpeg", "-y",
                "-ss", f"{thumb_time:.3f}",
                "-i", str(out_path.resolve()),
                "-vframes", "1",
                "-q:v", "2",
                str(thumb_path.resolve())
            ], capture_output=True)
        except Exception as thumb_err:
            logger.warning(f"Thumbnail extraction failed: {thumb_err}")

        return {
            "success": True,
            "filename": out_filename,
            "videoUrl": f"/api/videos/{out_filename}",
            "downloadUrl": f"/api/videos/{out_filename}",
            "thumbnailUrl": f"/api/videos/{thumb_filename}" if thumb_path.exists() else None,
            "duration": round(safe_duration, 2),
            "resolution": f"{width}x{height}",
            "fps": render_fps,
            "fileSizeMb": round(file_size_mb, 2),
            "renderTimeSeconds": round(elapsed, 2),
        }
    finally:
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass


def convert_webm_to_mp4(webm_bytes: bytes, filename_base: str = "rendered_video") -> Dict[str, Any]:
    """Transcodes a browser-recorded WebM (VP9/Opus) into a standardized H.264 / AAC MP4 at 30 FPS."""
    clean_title = re.sub(r'[<>:"/\\|?*]+', '', filename_base.strip())[:60] or "apexmind-video"
    time_stamp = int(time.time() * 1000)
    out_filename = f"{clean_title}_{time_stamp}.mp4"
    thumb_filename = f"{clean_title}_{time_stamp}_thumb.jpg"
    out_path = RENDER_DIR / out_filename
    thumb_path = RENDER_DIR / thumb_filename

    temp_dir = Path(tempfile.mkdtemp(prefix="apex_convert_"))
    temp_webm = temp_dir / "input.webm"

    try:
        with open(temp_webm, "wb") as f:
            f.write(webm_bytes)

        cmd = [
            "ffmpeg", "-y",
            "-i", str(temp_webm.resolve()),
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-profile:v", "high",
            "-level", "4.2",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-r", "30",
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "48000",
            "-movflags", "+faststart",
            "-threads", "0",
            str(out_path.resolve()),
        ]

        t0 = time.time()
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"FFmpeg conversion failed: {res.stderr[-300:]}")

        elapsed = time.time() - t0
        file_size_mb = out_path.stat().st_size / (1024 * 1024)

        try:
            subprocess.run([
                "ffmpeg", "-y",
                "-ss", "00:00:01.000",
                "-i", str(out_path.resolve()),
                "-vframes", "1",
                "-q:v", "2",
                str(thumb_path.resolve())
            ], capture_output=True)
        except Exception:
            pass

        return {
            "success": True,
            "filename": out_filename,
            "videoUrl": f"/api/videos/{out_filename}",
            "downloadUrl": f"/api/videos/{out_filename}",
            "thumbnailUrl": f"/api/videos/{thumb_filename}" if thumb_path.exists() else None,
            "fileSizeMb": round(file_size_mb, 2),
            "renderTimeSeconds": round(elapsed, 2),
        }
    finally:
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass
