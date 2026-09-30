import sqlite3
import json
import datetime
import hashlib
from pathlib import Path
from typing import Optional, List, Dict, Any
from config import CONFIG
from dataset import DATASET

class Database:
    def __init__(self, db_path: str = None):
        self.db_path = Path(db_path or CONFIG["storage"]["db_path"])
        self.annotators_dir = Path(CONFIG["storage"]["annotators_dir"])
        self.annotations_dir = Path(CONFIG["storage"]["annotations_dir"])
        self.annotators_dir.mkdir(parents=True, exist_ok=True)
        self.annotations_dir.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=20.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        return conn

    def init_db(self):
        with self.get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS annotators (
                    annotator_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE,
                    password_hash TEXT,
                    dialect TEXT,
                    experience TEXT,
                    notes TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            # Ensure password_hash column exists
            try:
                conn.execute("ALTER TABLE annotators ADD COLUMN password_hash TEXT")
            except sqlite3.OperationalError:
                pass  # Column already exists

            conn.execute("""
                CREATE TABLE IF NOT EXISTS annotations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    annotator_id TEXT NOT NULL,
                    item_id TEXT NOT NULL,
                    word TEXT NOT NULL,
                    meaning_index INTEGER NOT NULL,
                    pos TEXT,
                    definition TEXT,
                    sentence_key TEXT,
                    sentence_text TEXT NOT NULL,
                    score TEXT NOT NULL, -- 'thumbs_up' or 'thumbs_down'
                    notes TEXT,
                    audio_filename TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(annotator_id, item_id),
                    FOREIGN KEY(annotator_id) REFERENCES annotators(annotator_id)
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_annotator_item ON annotations(annotator_id, item_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_annotator_word ON annotations(annotator_id, word)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_annotator_score ON annotations(annotator_id, score)")

    @staticmethod
    def hash_password(password: str) -> str:
        salt = "wiseyak_annotator_salt_key"
        return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()

    def register_annotator(self, name: str, email: str, password: str = "") -> dict:
        clean_email = email.strip().lower()
        clean_name = name.strip()
        username = clean_email.split("@")[0].lower()
        
        # Default password if omitted: e.g. username123
        assigned_password = password.strip() if password and password.strip() else f"{username}123"
        pwd_hash = self.hash_password(assigned_password)

        with self.get_conn() as conn:
            existing = conn.execute("SELECT * FROM annotators WHERE LOWER(email) = ?", (clean_email,)).fetchone()
            if existing:
                raise ValueError("An account with this email already exists. Please sign in.")

            clean_prefix = "".join(c for c in username if c.isalnum() or c in "-_")
            annotator_id = f"{clean_prefix}_wiseyak"
            now_str = datetime.datetime.utcnow().isoformat()

            conn.execute("""
                INSERT INTO annotators (annotator_id, name, email, password_hash, dialect, experience, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, '', '', '', ?, ?)
            """, (annotator_id, clean_name, clean_email, pwd_hash, now_str, now_str))

        record = {
            "annotator_id": annotator_id,
            "name": clean_name,
            "email": clean_email,
            "created_at": now_str,
            "updated_at": now_str
        }

        # Save profile JSON (omit hash)
        json_file = self.annotators_dir / f"{annotator_id}.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)

        return {
            "annotator": record,
            "assigned_password": assigned_password
        }

    def authenticate_annotator(self, email: str, password: str) -> dict:
        clean_email = email.strip().lower()
        clean_pwd = password.strip()
        pwd_hash = self.hash_password(clean_pwd)

        with self.get_conn() as conn:
            row = conn.execute("SELECT * FROM annotators WHERE LOWER(email) = ?", (clean_email,)).fetchone()
            if not row:
                raise ValueError("No account found with this email. Please register.")

            # If user has no password yet (legacy), initialize it to the entered password
            if not row["password_hash"]:
                conn.execute("UPDATE annotators SET password_hash = ? WHERE annotator_id = ?", (pwd_hash, row["annotator_id"]))
            elif row["password_hash"] != pwd_hash:
                raise ValueError("Invalid password. Please check your credentials.")

            annotator = dict(row)
            annotator.pop("password_hash", None)
            return annotator

    def save_annotator(self, profile: dict) -> dict:
        annotator_id = profile.get("annotator_id") or profile.get("id")
        email = profile.get("email", "").strip().lower()
        name = profile.get("name", "").strip()

        if not annotator_id and email:
            with self.get_conn() as conn:
                existing = conn.execute("SELECT annotator_id FROM annotators WHERE LOWER(email) = ?", (email,)).fetchone()
                if existing:
                    annotator_id = existing["annotator_id"]
                else:
                    clean_prefix = "".join(c for c in email.split("@")[0].lower() if c.isalnum() or c in "-_")
                    annotator_id = f"{clean_prefix}_wiseyak"
        elif not annotator_id:
            clean_name = "".join(c for c in name.lower() if c.isalnum() or c in "-_")
            timestamp = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
            annotator_id = f"{clean_name}_{timestamp}"

        now_str = datetime.datetime.utcnow().isoformat()
        dialect = profile.get("dialect", "").strip()
        experience = profile.get("experience", "").strip()
        notes = profile.get("notes", "").strip()

        with self.get_conn() as conn:
            row = conn.execute("SELECT created_at FROM annotators WHERE annotator_id = ?", (annotator_id,)).fetchone()
            created_at = row["created_at"] if row else now_str

            conn.execute("""
                INSERT INTO annotators (annotator_id, name, email, dialect, experience, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(annotator_id) DO UPDATE SET
                    name=excluded.name,
                    email=excluded.email,
                    dialect=excluded.dialect,
                    experience=excluded.experience,
                    notes=excluded.notes,
                    updated_at=excluded.updated_at
            """, (annotator_id, name, email, dialect, experience, notes, created_at, now_str))

        record = {
            "annotator_id": annotator_id,
            "name": name,
            "email": email,
            "dialect": dialect,
            "experience": experience,
            "notes": notes,
            "created_at": created_at,
            "updated_at": now_str
        }

        # Save profile to JSON
        json_file = self.annotators_dir / f"{annotator_id}.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)

        return record

    def get_annotator(self, annotator_id: str) -> Optional[dict]:
        with self.get_conn() as conn:
            row = conn.execute("SELECT * FROM annotators WHERE annotator_id = ?", (annotator_id,)).fetchone()
            if row:
                return dict(row)
        return None

    def list_annotators(self) -> List[dict]:
        with self.get_conn() as conn:
            rows = conn.execute("SELECT * FROM annotators ORDER BY updated_at DESC").fetchall()
            return [dict(r) for r in rows]

    def save_annotation(self, annotator_id: str, item_id: str, score: str, notes: str = "") -> dict:
        item = DATASET.get_item(item_id)
        if not item:
            raise ValueError(f"Invalid item_id: {item_id}")

        if score not in ["thumbs_up", "thumbs_down"]:
            raise ValueError("Score must be 'thumbs_up' or 'thumbs_down'")

        now_str = datetime.datetime.utcnow().isoformat()

        with self.get_conn() as conn:
            existing = conn.execute(
                "SELECT created_at FROM annotations WHERE annotator_id = ? AND item_id = ?",
                (annotator_id, item_id)
            ).fetchone()
            created_at = existing["created_at"] if existing else now_str

            conn.execute("""
                INSERT INTO annotations (
                    annotator_id, item_id, word, meaning_index, pos, definition,
                    sentence_key, sentence_text, score, notes, audio_filename,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(annotator_id, item_id) DO UPDATE SET
                    score=excluded.score,
                    notes=excluded.notes,
                    updated_at=excluded.updated_at
            """, (
                annotator_id, item_id, item["word"], item["meaning_index"],
                item["pos"], item["definition"], item["sentence_key"],
                item["sentence_text"], score, notes, item["audio_filename"],
                created_at, now_str
            ))

        # Dynamically sync JSON export for this annotator
        self.export_annotator_json(annotator_id)

        return {
            "annotator_id": annotator_id,
            "item_id": item_id,
            "score": score,
            "notes": notes,
            "updated_at": now_str
        }

    def get_annotator_annotations(self, annotator_id: str) -> Dict[str, dict]:
        with self.get_conn() as conn:
            rows = conn.execute("SELECT * FROM annotations WHERE annotator_id = ?", (annotator_id,)).fetchall()
            return {r["item_id"]: dict(r) for r in rows}

    def get_stats(self, annotator_id: str) -> dict:
        total_items = DATASET.get_total_items()
        with self.get_conn() as conn:
            annotated_count = conn.execute(
                "SELECT COUNT(*) as cnt FROM annotations WHERE annotator_id = ?",
                (annotator_id,)
            ).fetchone()["cnt"]

            thumbs_up = conn.execute(
                "SELECT COUNT(*) as cnt FROM annotations WHERE annotator_id = ? AND score = 'thumbs_up'",
                (annotator_id,)
            ).fetchone()["cnt"]

            thumbs_down = conn.execute(
                "SELECT COUNT(*) as cnt FROM annotations WHERE annotator_id = ? AND score = 'thumbs_down'",
                (annotator_id,)
            ).fetchone()["cnt"]

        completion_pct = round((annotated_count / total_items * 100), 2) if total_items > 0 else 0.0

        return {
            "total_items": total_items,
            "annotated_count": annotated_count,
            "pending_count": total_items - annotated_count,
            "thumbs_up_count": thumbs_up,
            "thumbs_down_count": thumbs_down,
            "completion_percentage": completion_pct
        }

    def export_annotator_json(self, annotator_id: str) -> dict:
        annotator = self.get_annotator(annotator_id)
        if not annotator:
            annotator = {"annotator_id": annotator_id}

        stats = self.get_stats(annotator_id)

        with self.get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM annotations WHERE annotator_id = ? ORDER BY word, meaning_index, sentence_key",
                (annotator_id,)
            ).fetchall()
            annotations_list = [dict(r) for r in rows]

        export_data = {
            "annotator": annotator,
            "stats": stats,
            "exported_at": datetime.datetime.utcnow().isoformat(),
            "annotations": annotations_list
        }

        # Write to JSON file
        out_file = self.annotations_dir / f"{annotator_id}_annotations.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)

        return export_data

DB = Database()
