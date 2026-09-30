import os
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

DEFAULT_CONFIG_PATH = BASE_DIR / "config.json"

def load_config(config_path: Path = DEFAULT_CONFIG_PATH) -> dict:
    config = {
        "server": {
            "host": os.environ.get("SERVER_HOST", "0.0.0.0"),
            "port": int(os.environ.get("SERVER_PORT", 8080))
        },
        "dataset": {
            "file_path": os.environ.get("DATASET_PATH", str(BASE_DIR / "polysemous_words_sentences 1.json"))
        },
        "storage": {
            "db_path": os.environ.get("DB_PATH", str(BASE_DIR / "data" / "annotations.db")),
            "annotators_dir": os.environ.get("ANNOTATORS_DIR", str(BASE_DIR / "data" / "annotators")),
            "annotations_dir": os.environ.get("ANNOTATIONS_DIR", str(BASE_DIR / "data" / "annotations")),
            "audio_dir": os.environ.get("AUDIO_DIR", str(BASE_DIR / "audios"))
        },
        "tts": {
            "api_url": os.environ.get("TTS_API_URL", "https://dev-tts.wiseai.wiseyak.com/generate_from_text"),
            "model": os.environ.get("TTS_MODEL", "omnivoice_tts"),
            "reference_audio_id": os.environ.get("TTS_REFERENCE_AUDIO_ID", "Pratikshya"),
            "language": os.environ.get("TTS_LANGUAGE", "nep"),
            "output_type": os.environ.get("TTS_OUTPUT_TYPE", "audio"),
            "audio_speed": float(os.environ.get("TTS_AUDIO_SPEED", "1")),
            "bucket_name": os.environ.get("TTS_BUCKET_NAME", "string"),
            "target_sample_rate": int(os.environ.get("TTS_TARGET_SAMPLE_RATE", "0")),
            "filename_prefix": os.environ.get("TTS_FILENAME_PREFIX", "nep_audio"),
            "user_id": os.environ.get("TTS_USER_ID", "string"),
            "organization": os.environ.get("TTS_ORGANIZATION", "string"),
            "service": os.environ.get("TTS_SERVICE", "string"),
            "request_timeout_seconds": int(os.environ.get("TTS_TIMEOUT", "30")),
            "batch_concurrency": int(os.environ.get("TTS_CONCURRENCY", "4"))
        }
    }

    if config_path.exists():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                user_cfg = json.load(f)
                for section, vals in user_cfg.items():
                    if section in config and isinstance(vals, dict):
                        config[section].update(vals)
                    else:
                        config[section] = vals
        except Exception as e:
            print(f"[config] Warning: could not parse {config_path}: {e}")

    # Ensure directories exist
    for dir_key in ["annotators_dir", "annotations_dir", "audio_dir"]:
        target_dir = Path(config["storage"][dir_key])
        if not target_dir.is_absolute():
            target_dir = BASE_DIR / target_dir
            config["storage"][dir_key] = str(target_dir)
        target_dir.mkdir(parents=True, exist_ok=True)

    db_path = Path(config["storage"]["db_path"])
    if not db_path.is_absolute():
        db_path = BASE_DIR / db_path
        config["storage"]["db_path"] = str(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    dataset_path = Path(config["dataset"]["file_path"])
    if not dataset_path.is_absolute():
        dataset_path = BASE_DIR / dataset_path
        config["dataset"]["file_path"] = str(dataset_path)

    return config

CONFIG = load_config()
