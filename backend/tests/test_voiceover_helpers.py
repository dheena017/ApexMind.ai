import pytest

from backend.shared.gemini import normalize_voiceover_text, convert_l16_pcm_to_wav


def test_normalize_voiceover_text_removes_extra_spacing():
    text = "  Stay strong.   Keep moving. \n\n Discipline wins.  "
    assert normalize_voiceover_text(text) == "Stay strong. Keep moving. Discipline wins."


def test_convert_l16_pcm_to_wav_creates_valid_wav_header():
    pcm = b"\x00\x01\x02\x03" * 8
    wav = convert_l16_pcm_to_wav(pcm, sample_rate=24000)
    assert wav.startswith(b"RIFF")
    assert b"WAVE" in wav[:12]
    assert len(wav) > len(pcm)
