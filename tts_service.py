import os
import aiohttp
import requests
from pathlib import Path
from typing import Optional, Tuple
from config import CONFIG

class TTSService:
    def __init__(self):
        self.cfg = CONFIG["tts"]
        self.audio_dir = Path(CONFIG["storage"]["audio_dir"])
        self.audio_dir.mkdir(parents=True, exist_ok=True)

    def get_audio_path(self, item_id: str) -> Path:
        return self.audio_dir / f"{item_id}.wav"

    def is_audio_cached(self, item_id: str) -> bool:
        path = self.get_audio_path(item_id)
        return path.exists() and path.stat().st_size > 500

    def _build_payload(self, text: str, item_id: str) -> dict:
        return {
            "bucket_name": str(self.cfg.get("bucket_name", "string")),
            "target_sample_rate": int(self.cfg.get("target_sample_rate", 0)),
            "filename": f"{self.cfg.get('filename_prefix', 'nep_audio')}_{item_id}.wav",
            "model": str(self.cfg.get("model", "omnivoice_tts")),
            "text": text,
            "user_id": str(self.cfg.get("user_id", "string")),
            "organization": str(self.cfg.get("organization", "string")),
            "service": str(self.cfg.get("service", "string")),
            "reference_audio_id": str(self.cfg.get("reference_audio_id", "Pratikshya")),
            "language": str(self.cfg.get("language", "nep")),
            "output_type": str(self.cfg.get("output_type", "audio")),
            "audio_speed": float(self.cfg.get("audio_speed", 1))
        }

    def generate_sync(self, item_id: str, text: str, force: bool = False) -> Tuple[bool, str]:
        dest_path = self.get_audio_path(item_id)
        if not force and self.is_audio_cached(item_id):
            return True, str(dest_path)

        url = self.cfg["api_url"]
        payload = self._build_payload(text, item_id)
        timeout = self.cfg.get("request_timeout_seconds", 30)

        try:
            resp = requests.post(url, data=payload, timeout=timeout)
            if resp.status_code == 200 and len(resp.content) > 200:
                with open(dest_path, "wb") as f:
                    f.write(resp.content)
                return True, str(dest_path)
            else:
                err_msg = f"HTTP {resp.status_code}: {resp.text[:200]}"
                return False, err_msg
        except Exception as e:
            return False, str(e)

    async def generate_async(self, item_id: str, text: str, force: bool = False) -> Tuple[bool, str]:
        dest_path = self.get_audio_path(item_id)
        if not force and self.is_audio_cached(item_id):
            return True, str(dest_path)

        url = self.cfg["api_url"]
        payload = self._build_payload(text, item_id)
        timeout = aiohttp.ClientTimeout(total=self.cfg.get("request_timeout_seconds", 30))

        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(url, data=payload) as resp:
                    if resp.status == 200:
                        content = await resp.read()
                        if len(content) > 200:
                            # Write atomically
                            temp_path = dest_path.with_suffix(".tmp")
                            with open(temp_path, "wb") as f:
                                f.write(content)
                            temp_path.replace(dest_path)
                            return True, str(dest_path)
                    body_text = await resp.text()
                    return False, f"HTTP {resp.status}: {body_text[:200]}"
        except Exception as e:
            return False, str(e)

TTS_CLIENT = TTSService()
