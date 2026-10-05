import sqlite3
import json
import os
import datetime
from pathlib import Path

from dataset import DATASET

def generate_overview_and_sql(db_path='data/annotations.db', sql_out='annotations_dump.sql', json_out='static/overview.json'):
    if not os.path.exists(db_path):
        print(f"Error: {db_path} does not exist")
        return

    conn = sqlite3.connect(db_path, timeout=10.0)
    conn.row_factory = sqlite3.Row

    # 1. Total dataset items (1,712 sentences, 392 words)
    total_dataset_items = DATASET.get_total_items()
    total_words = DATASET.get_total_words()

    # 2. Export SQL dump
    with open(sql_out, 'w', encoding='utf-8') as f:
        for line in conn.iterdump():
            f.write(f'{line}\n')
    
    # Also copy or link to static/ for direct download in browser
    static_sql = Path('static/annotations_dump.sql')
    try:
        with open(static_sql, 'w', encoding='utf-8') as f:
            with open(sql_out, 'r', encoding='utf-8') as src:
                f.write(src.read())
    except Exception as e:
        print("Static sql copy warning:", e)

    sql_size = os.path.getsize(sql_out) if os.path.exists(sql_out) else 0

    # 3. Annotations counts
    total_annotations = conn.execute("SELECT COUNT(*) as cnt FROM annotations").fetchone()["cnt"]
    distinct_items = conn.execute("SELECT COUNT(DISTINCT item_id) as cnt FROM annotations").fetchone()["cnt"]
    thumbs_up = conn.execute("SELECT COUNT(*) as cnt FROM annotations WHERE score = 'thumbs_up'").fetchone()["cnt"]
    thumbs_down = conn.execute("SELECT COUNT(*) as cnt FROM annotations WHERE score = 'thumbs_down'").fetchone()["cnt"]

    # 4. Annotator breakdown
    annotator_rows = conn.execute("""
        SELECT 
            a.annotator_id,
            COALESCE(u.name, a.annotator_id) as name,
            COALESCE(u.email, '') as email,
            COUNT(a.id) as total_evals,
            SUM(CASE WHEN a.score = 'thumbs_up' THEN 1 ELSE 0 END) as thumbs_up_count,
            SUM(CASE WHEN a.score = 'thumbs_down' THEN 1 ELSE 0 END) as thumbs_down_count,
            MAX(a.updated_at) as last_activity
        FROM annotations a
        LEFT JOIN annotators u ON a.annotator_id = u.annotator_id
        GROUP BY a.annotator_id
        ORDER BY total_evals DESC
    """).fetchall()

    annotators = []
    for r in annotator_rows:
        total_ev = r["total_evals"] or 0
        pct = round((total_ev / total_dataset_items * 100), 1) if total_dataset_items > 0 else 0.0
        annotators.append({
            "annotator_id": r["annotator_id"],
            "name": r["name"],
            "email": r["email"],
            "total_evals": total_ev,
            "thumbs_up": r["thumbs_up_count"] or 0,
            "thumbs_down": r["thumbs_down_count"] or 0,
            "percentage": pct,
            "last_activity": r["last_activity"]
        })

    # 5. Recent defect / flawed notes
    defect_rows = conn.execute("""
        SELECT item_id, word, sentence_text, score, notes, updated_at, annotator_id
        FROM annotations
        WHERE notes IS NOT NULL AND TRIM(notes) != ''
        ORDER BY updated_at DESC
        LIMIT 25
    """).fetchall()

    recent_notes = [dict(r) for r in defect_rows]
    completion_pct = round((distinct_items / total_dataset_items * 100), 1) if total_dataset_items > 0 else 0.0

    overview = {
        "total_dataset_items": total_dataset_items,
        "total_words": total_words,
        "total_annotations": total_annotations,
        "distinct_items_annotated": distinct_items,
        "pending_items": max(0, total_dataset_items - distinct_items),
        "completion_percentage": completion_pct,
        "thumbs_up_count": thumbs_up,
        "thumbs_down_count": thumbs_down,
        "annotators": annotators,
        "recent_defect_notes": recent_notes,
        "sql_dump": {
            "path": "/static/annotations_dump.sql",
            "size_bytes": sql_size,
            "size_kb": round(sql_size / 1024, 1),
            "last_modified": datetime.datetime.utcnow().isoformat()
        },
        "last_synced": datetime.datetime.utcnow().isoformat()
    }

    Path(json_out).parent.mkdir(parents=True, exist_ok=True)
    with open(json_out, 'w', encoding='utf-8') as f:
        json.dump(overview, f, ensure_ascii=False, indent=2)

    conn.close()
    print(f"Generated {json_out} and {sql_out} successfully! Total annotations: {total_annotations}")

if __name__ == '__main__':
    import sys
    import time
    if '--watch' in sys.argv:
        print("[overview-watcher] Starting live sync loop (every 20s)...")
        while True:
            try:
                generate_overview_and_sql()
            except Exception as e:
                print("[overview-watcher] Warning during sync:", e)
            time.sleep(20)
    else:
        generate_overview_and_sql()
