import os
import json
import asyncio
from pathlib import Path
from aiohttp import web

from config import CONFIG
from dataset import DATASET
from database import DB
from tts_service import TTS_CLIENT

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

async def index_handler(request):
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        return web.Response(status=404, text="Frontend index.html not found.")
    return web.FileResponse(index_file)

async def api_login(request):
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON body"}, status=400)

    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not email or not password:
        return web.json_response({"error": "Email and password are required"}, status=400)

    try:
        annotator = DB.authenticate_annotator(email, password)
        stats = DB.get_stats(annotator["annotator_id"])
        return web.json_response({
            "status": "ok",
            "annotator": annotator,
            "stats": stats
        })
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=401)
    except Exception as e:
        return web.json_response({"error": f"Server error: {e}"}, status=500)

async def api_register(request):
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON body"}, status=400)

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not name or not email:
        return web.json_response({"error": "Full name and email are required"}, status=400)

    try:
        res = DB.register_annotator(name, email, password)
        annotator = res["annotator"]
        stats = DB.get_stats(annotator["annotator_id"])
        return web.json_response({
            "status": "ok",
            "annotator": annotator,
            "assigned_password": res["assigned_password"],
            "stats": stats
        })
    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)
    except Exception as e:
        return web.json_response({"error": f"Server error: {e}"}, status=500)

async def api_onboard(request):
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON body"}, status=400)

    name = data.get("name", "").strip()
    if not name:
        return web.json_response({"error": "Name is required"}, status=400)

    annotator = DB.save_annotator(data)
    stats = DB.get_stats(annotator["annotator_id"])
    return web.json_response({
        "status": "ok",
        "annotator": annotator,
        "stats": stats
    })

async def api_list_annotators(request):
    annotators = DB.list_annotators()
    return web.json_response({"annotators": annotators})

async def api_get_stats(request):
    annotator_id = request.query.get("annotator_id", "").strip()
    if not annotator_id:
        return web.json_response({"error": "annotator_id query parameter is required"}, status=400)

    stats = DB.get_stats(annotator_id)
    return web.json_response({"stats": stats})

async def api_get_words(request):
    annotator_id = request.query.get("annotator_id", "").strip()
    user_annotations = DB.get_annotator_annotations(annotator_id) if annotator_id else {}

    words_summary = []
    for word in DATASET.words_list:
        items = DATASET.get_items_for_word(word)
        total_items = len(items)
        annotated_items = sum(1 for it in items if it["item_id"] in user_annotations)
        words_summary.append({
            "word": word,
            "total_sentences": total_items,
            "annotated_sentences": annotated_items,
            "is_complete": (annotated_items >= total_items and total_items > 0)
        })

    return web.json_response({
        "total_words": len(words_summary),
        "words": words_summary
    })

async def api_get_items(request):
    annotator_id = request.query.get("annotator_id", "").strip()
    filter_word = request.query.get("word", "").strip()
    filter_status = request.query.get("status", "all").strip().lower()
    page = max(1, int(request.query.get("page", 1)))
    limit = max(1, min(100, int(request.query.get("limit", 20))))

    user_annotations = DB.get_annotator_annotations(annotator_id) if annotator_id else {}

    filtered = []
    for it in DATASET.items:
        if filter_word and it["word"] != filter_word:
            continue

        item_id = it["item_id"]
        annot = user_annotations.get(item_id)
        is_annotated = annot is not None
        score = annot["score"] if annot else None

        if filter_status == "annotated" and not is_annotated:
            continue
        if filter_status == "pending" and is_annotated:
            continue
        if filter_status == "thumbs_up" and score != "thumbs_up":
            continue
        if filter_status == "thumbs_down" and score != "thumbs_down":
            continue

        it_copy = dict(it)
        it_copy["user_annotation"] = annot
        it_copy["is_audio_cached"] = TTS_CLIENT.is_audio_cached(item_id)
        filtered.append(it_copy)

    total_matched = len(filtered)
    start_idx = (page - 1) * limit
    paged_items = filtered[start_idx : start_idx + limit]

    return web.json_response({
        "total": total_matched,
        "page": page,
        "limit": limit,
        "items": paged_items
    })

async def api_get_item(request):
    item_id = request.match_info["item_id"]
    annotator_id = request.query.get("annotator_id", "").strip()

    item = DATASET.get_item(item_id)
    if not item:
        return web.json_response({"error": "Item not found"}, status=404)

    user_annotation = None
    if annotator_id:
        user_annotations = DB.get_annotator_annotations(annotator_id)
        user_annotation = user_annotations.get(item_id)

    item_data = dict(item)
    item_data["user_annotation"] = user_annotation
    item_data["is_audio_cached"] = TTS_CLIENT.is_audio_cached(item_id)

    # Next and previous item IDs in sequence
    cur_idx = item["global_index"]
    prev_item = DATASET.get_item_by_index(cur_idx - 1)
    next_item = DATASET.get_item_by_index(cur_idx + 1)
    item_data["prev_item_id"] = prev_item["item_id"] if prev_item else None
    item_data["next_item_id"] = next_item["item_id"] if next_item else None

    return web.json_response({"item": item_data})

async def api_annotate(request):
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON body"}, status=400)

    annotator_id = payload.get("annotator_id", "").strip()
    item_id = payload.get("item_id", "").strip()
    score = payload.get("score", "").strip()
    notes = payload.get("notes", "").strip()

    if not annotator_id or not item_id or not score:
        return web.json_response({"error": "annotator_id, item_id, and score are required"}, status=400)

    if score not in ["thumbs_up", "thumbs_down"]:
        return web.json_response({"error": "score must be 'thumbs_up' or 'thumbs_down'"}, status=400)

    try:
        res = DB.save_annotation(annotator_id, item_id, score, notes)
        stats = DB.get_stats(annotator_id)
        return web.json_response({
            "status": "ok",
            "annotation": res,
            "stats": stats
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def api_audio_handler(request):
    item_id = request.match_info["item_id"]
    item = DATASET.get_item(item_id)
    if not item:
        return web.Response(status=404, text="Item not found")

    audio_path = TTS_CLIENT.get_audio_path(item_id)
    if not TTS_CLIENT.is_audio_cached(item_id):
        # Generate on the fly
        ok, res = await TTS_CLIENT.generate_async(item_id, item["sentence_text"])
        if not ok:
            return web.Response(status=502, text=f"TTS generation failed: {res}")

    return web.FileResponse(audio_path, headers={
        "Content-Type": "audio/wav",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400"
    })

async def api_export_user_json(request):
    annotator_id = request.match_info["annotator_id"]
    annotator = DB.get_annotator(annotator_id)
    if not annotator:
        return web.json_response({"error": "Annotator not found"}, status=404)

    export_data = DB.export_annotator_json(annotator_id)
    response_bytes = json.dumps(export_data, ensure_ascii=False, indent=2).encode("utf-8")
    return web.Response(
        body=response_bytes,
        content_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="annotator_{annotator_id}_data.json"'
        }
    )

async def api_config_info(request):
    audio_dir = Path(CONFIG["storage"]["audio_dir"])
    cached_count = len(list(audio_dir.glob("*.wav"))) if audio_dir.exists() else 0
    total_sentences = DATASET.get_total_items()
    cached_pct = round((cached_count / total_sentences * 100), 1) if total_sentences > 0 else 0.0

    return web.json_response({
        "app_name": CONFIG.get("app", {}).get("name", "NepSyn Plat"),
        "app_subtitle": CONFIG.get("app", {}).get("subtitle", "Nepali Speech Synthesis Platform"),
        "total_words": DATASET.get_total_words(),
        "total_sentences": total_sentences,
        "cached_audios_count": cached_count,
        "cached_percentage": cached_pct,
        "tts_model": CONFIG["tts"]["model"],
        "voice_id": CONFIG["tts"]["reference_audio_id"],
        "language": CONFIG["tts"]["language"],
        "audio_speed": CONFIG["tts"]["audio_speed"]
    })

def make_app():
    app = web.Application(client_max_size=10*1024*1024)

    # API Routes
    app.router.add_get("/", index_handler)
    app.router.add_post("/api/login", api_login)
    app.router.add_post("/api/register", api_register)
    app.router.add_post("/api/onboard", api_onboard)
    app.router.add_get("/api/annotators", api_list_annotators)
    app.router.add_get("/api/stats", api_get_stats)
    app.router.add_get("/api/words", api_get_words)
    app.router.add_get("/api/items", api_get_items)
    app.router.add_get("/api/item/{item_id}", api_get_item)
    app.router.add_post("/api/annotate", api_annotate)
    app.router.add_get("/api/audio/{item_id}", api_audio_handler)
    app.router.add_get("/api/export/{annotator_id}", api_export_user_json)
    app.router.add_get("/api/config", api_config_info)

    # Static file serving
    if STATIC_DIR.exists():
        app.router.add_static("/static/", path=str(STATIC_DIR), name="static")

    return app

if __name__ == "__main__":
    host = CONFIG["server"]["host"]
    base_port = int(CONFIG["server"]["port"])
    app = make_app()
    
    # Try port and fallback if busy
    for port in range(base_port, base_port + 20):
        try:
            print("=" * 60)
            print("Starting Nepali Polysemous Audio Annotation Platform")
            print(f"Platform URL: http://{host}:{port} (Local: http://localhost:{port})")
            print(f"Total Words: {DATASET.get_total_words()} | Total Sentences: {DATASET.get_total_items()}")
            print("=" * 60)
            web.run_app(app, host=host, port=port)
            break
        except OSError as e:
            if e.errno == 98: # Address already in use
                print(f"[server] Port {port} in use, trying next port {port + 1}...")
                continue
            raise e

