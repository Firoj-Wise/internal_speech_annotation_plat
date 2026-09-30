import hashlib
import json
from pathlib import Path
from typing import Dict, List, Optional
from config import CONFIG

class DatasetManager:
    def __init__(self, dataset_path: str = None):
        self.dataset_path = Path(dataset_path or CONFIG["dataset"]["file_path"])
        self.words_data: Dict[str, dict] = {}
        self.items: List[dict] = []
        self.items_by_id: Dict[str, dict] = {}
        self.words_list: List[str] = []
        self.load()

    def load(self):
        if not self.dataset_path.exists():
            raise FileNotFoundError(f"Dataset file not found at: {self.dataset_path}")

        with open(self.dataset_path, "r", encoding="utf-8") as f:
            self.words_data = json.load(f)

        self.items = []
        self.items_by_id = {}
        self.words_list = list(self.words_data.keys())

        global_idx = 0
        for w_idx, (word, word_info) in enumerate(self.words_data.items()):
            meanings = word_info.get("meanings", [])
            for m_idx, meaning in enumerate(meanings):
                definition = meaning.get("definition", "").strip()
                pos = meaning.get("pos", "").strip()

                for s_key in ["sentence1", "sentence2"]:
                    sentence_text = meaning.get(s_key, "").strip()
                    if not sentence_text:
                        continue

                    # Deterministic hash for item ID
                    seed_str = f"{word}:{m_idx}:{s_key}"
                    item_id = hashlib.sha256(seed_str.encode("utf-8")).hexdigest()[:14]

                    item_obj = {
                        "item_id": item_id,
                        "global_index": global_idx,
                        "word": word,
                        "word_index": w_idx,
                        "meaning_index": m_idx,
                        "meanings_total": len(meanings),
                        "pos": pos,
                        "definition": definition,
                        "sentence_key": s_key,
                        "sentence_text": sentence_text,
                        "audio_filename": f"{item_id}.wav"
                    }
                    self.items.append(item_obj)
                    self.items_by_id[item_id] = item_obj
                    global_idx += 1

    def get_total_items(self) -> int:
        return len(self.items)

    def get_total_words(self) -> int:
        return len(self.words_list)

    def get_item(self, item_id: str) -> Optional[dict]:
        return self.items_by_id.get(item_id)

    def get_item_by_index(self, index: int) -> Optional[dict]:
        if 0 <= index < len(self.items):
            return self.items[index]
        return None

    def get_items_for_word(self, word: str) -> List[dict]:
        return [it for it in self.items if it["word"] == word]

DATASET = DatasetManager()
