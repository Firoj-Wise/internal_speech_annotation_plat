#!/usr/bin/env python3
import sys
import time
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from config import CONFIG
from dataset import DATASET
from tts_service import TTS_CLIENT

def process_item(item: dict, force: bool = False) -> dict:
    item_id = item["item_id"]
    text = item["sentence_text"]
    word = item["word"]
    s_key = item["sentence_key"]

    if not force and TTS_CLIENT.is_audio_cached(item_id):
        return {
            "item_id": item_id,
            "word": word,
            "sentence_key": s_key,
            "status": "cached",
            "bytes": TTS_CLIENT.get_audio_path(item_id).stat().st_size
        }

    success, result = TTS_CLIENT.generate_sync(item_id, text, force=force)
    if success:
        size = Path(result).stat().st_size
        return {
            "item_id": item_id,
            "word": word,
            "sentence_key": s_key,
            "status": "generated",
            "bytes": size
        }
    else:
        return {
            "item_id": item_id,
            "word": word,
            "sentence_key": s_key,
            "status": "error",
            "error": result
        }

def main():
    parser = argparse.ArgumentParser(description="Batch audio synthesis generator for Nepali polysemous sentences.")
    parser.add_argument("--workers", type=int, default=CONFIG["tts"].get("batch_concurrency", 4), help="Number of concurrent worker threads")
    parser.add_argument("--limit", type=int, default=0, help="Maximum number of sentences to process (0 = all)")
    parser.add_argument("--word", type=str, default="", help="Filter processing to a specific word")
    parser.add_argument("--force", action="store_true", help="Force regenerate audio even if cached")
    args = parser.parse_args()

    items = DATASET.items
    if args.word:
        items = [it for it in items if it["word"] == args.word]
    if args.limit > 0:
        items = items[:args.limit]

    total = len(items)
    print("=" * 60)
    print("TTS AUDIO GENERATION PIPELINE")
    print(f"Total items to process: {total}")
    print(f"Target TTS URL: {CONFIG['tts']['api_url']}")
    print(f"Model: {CONFIG['tts']['model']} | Voice ID: {CONFIG['tts']['reference_audio_id']}")
    print(f"Workers: {args.workers} | Force regenerate: {args.force}")
    print("=" * 60)

    generated_cnt = 0
    cached_cnt = 0
    error_cnt = 0
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_item = {executor.submit(process_item, it, args.force): it for it in items}
        
        idx = 0
        for future in as_completed(future_to_item):
            idx += 1
            res = future.result()
            status = res["status"]
            
            if status == "generated":
                generated_cnt += 1
                print(f"[{idx}/{total}] GENERATED | Word: {res['word']} | {res['sentence_key']} | Size: {res['bytes']} bytes")
            elif status == "cached":
                cached_cnt += 1
                print(f"[{idx}/{total}] CACHED    | Word: {res['word']} | {res['sentence_key']} | Size: {res['bytes']} bytes")
            else:
                error_cnt += 1
                print(f"[{idx}/{total}] ERROR     | Word: {res['word']} | {res['sentence_key']} | Detail: {res.get('error')}")

    elapsed = round(time.time() - start_time, 2)
    print("=" * 60)
    print("SUMMARY")
    print(f"Processed: {total} items in {elapsed}s")
    print(f"Generated: {generated_cnt}")
    print(f"Cached (skipped): {cached_cnt}")
    print(f"Errors: {error_cnt}")
    print(f"Storage directory: {CONFIG['storage']['audio_dir']}")
    print("=" * 60)

if __name__ == "__main__":
    main()
