import sqlite3
import json
import re
from pathlib import Path
from collections import Counter

def extract_flagged_token_and_tag(note, word):
    note = (note or '').strip()
    if not note:
        return word, 'lexical_pronunciation_defect', 'Medium'

    # Check if note contains In-line Comments format
    if '[In-line Comments]:' in note:
        match = re.search(r'•\s*"([^"]+)"\s*\(([^)]+)\)', note)
        if match:
            span = match.group(1).strip()
            raw_tag = match.group(2).strip().lower()
            if 'उच्चारण' in raw_tag or 'pronunciation' in raw_tag:
                return span, 'phoneme_articulation_error', 'High'
            elif 'तनाव' in raw_tag or 'गति' in raw_tag or 'stress' in raw_tag:
                return span, 'negative_prefix_prosody_stress' if span.startswith('न') else 'case_marker_boundary_prosody', 'High'
            elif 'संयुक्ताक्षर' in raw_tag or 'cluster' in raw_tag:
                return span, 'consonant_cluster_coarticulation', 'High'
            elif 'चन्द्रविन्दु' in raw_tag or 'nasal' in raw_tag:
                return span, 'nasalization_chandrabindu_loss', 'High'
            elif 'काटियो' in raw_tag or 'विराम' in raw_tag:
                return span, 'verbal_inflection_cadence', 'Medium'
            return span, 'lexical_pronunciation_defect', 'Medium'

    # Single token clean extraction
    first_token = note.split()[0].replace('"', '').replace("'", '').replace(",", '').replace(";", '')
    return first_token, None, None

def classify_defect(word, note, sentence):
    note = (note or '').strip()
    token, forced_cat, forced_sev = extract_flagged_token_and_tag(note, word)
    if forced_cat:
        return token, forced_cat, forced_sev

    note_lower = note.lower()

    # 1. Phoneme / pronunciation explicit
    if 'wrong pronunciation' in note_lower or 'mispronounciation' in note_lower or 'pronunciation' in note_lower or 'उच्चारण' in note:
        return token, 'phoneme_articulation_error', 'High'
        
    # 2. Nasalization / Chandrabindu
    if 'ँ' in note or 'ँ' in word or 'चन्द्रविन्दु' in note:
        return token, 'nasalization_chandrabindu_loss', 'High'
        
    # 3. Consonant Conjuncts / Clusters
    if any(c in note for c in ['्र', 'र्', '्य', '्व', 'त्त', 'ष्ट', 'क्क', 'ञ्च', 'स्ट', 'म्प', 'ण्ड', 'ल्प', 'न्द', 'ङ्']):
        return token, 'consonant_cluster_coarticulation', 'High'
        
    # 4. Negative Prefix boundary (न- + root)
    if (token.startswith('न') and len(token) >= 3 and token in ['नदिन', 'नडराई', 'नजमोस्', 'नपाएको']) or 'तनाव' in note or 'stress' in note_lower:
        return token, 'negative_prefix_prosody_stress', 'High'
        
    # 5. Reduplication / Echo words
    if any(token == r for r in ['ढकमक्क', 'खसखस', 'छरपस्ट', 'खरखर']):
        return token, 'reduplicated_adverb_rhythm', 'Medium'
        
    # 6. Agglutinative Case Markers
    if any(token.endswith(s) for s in ['मा', 'को', 'का', 'की', 'लाई', 'ले']):
        return token, 'case_marker_boundary_prosody', 'Medium'
        
    # 7. Verb Inflection / Converb
    if any(token.endswith(s) for s in ['पछि', 'केपछि', 'एर', 'इदिन']):
        return token, 'verbal_inflection_cadence', 'Medium'
        
    return token, 'lexical_pronunciation_defect', 'Medium'

def export_pipeline_dataset():
    db_path = 'data/annotations.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # Query all annotators for lookup and stats
    annotators_map = {}
    for r in conn.execute("SELECT annotator_id, name, email FROM annotators").fetchall():
        annotators_map[r["annotator_id"]] = {
            "annotator_id": r["annotator_id"],
            "name": r["name"] or r["annotator_id"],
            "email": r["email"] or "",
            "defect_count": 0,
            "total_eval": 0,
            "thumbs_up": 0,
            "thumbs_down": 0
        }

    # Query evaluation counts per annotator
    for r in conn.execute("""
        SELECT annotator_id,
               count(*) as total_eval,
               sum(score = 'thumbs_up') as total_up,
               sum(score = 'thumbs_down') as total_down
        FROM annotations
        GROUP BY annotator_id
    """).fetchall():
        ann_id = r["annotator_id"]
        if ann_id not in annotators_map:
            annotators_map[ann_id] = {
                "annotator_id": ann_id,
                "name": ann_id,
                "email": "",
                "defect_count": 0,
                "total_eval": 0,
                "thumbs_up": 0,
                "thumbs_down": 0
            }
        annotators_map[ann_id]["total_eval"] = r["total_eval"] or 0
        annotators_map[ann_id]["thumbs_up"] = r["total_up"] or 0
        annotators_map[ann_id]["thumbs_down"] = r["total_down"] or 0

    # Query all completed evaluations with flaws / notes with joined annotator info
    rows = conn.execute("""
        SELECT a.item_id, a.word, a.meaning_index, a.pos, a.definition, a.sentence_key,
               a.sentence_text, a.score, a.notes, a.audio_filename, a.updated_at, a.annotator_id,
               ann.name as annotator_name, ann.email as annotator_email
        FROM annotations a
        LEFT JOIN annotators ann ON a.annotator_id = ann.annotator_id
        WHERE a.score = 'thumbs_down' OR (a.notes IS NOT NULL AND TRIM(a.notes) != '')
        ORDER BY a.updated_at DESC, a.id ASC
    """).fetchall()

    # Get overall counts across all annotations
    overall_row = conn.execute("""
        SELECT count(*) as total_eval,
               sum(score = 'thumbs_up') as total_up,
               sum(score = 'thumbs_down') as total_down
        FROM annotations
    """).fetchone()
    total_eval = overall_row["total_eval"] if overall_row else 0
    total_up = overall_row["total_up"] if overall_row else 0
    total_down = overall_row["total_down"] if overall_row else 0

    dataset_entries = []
    category_counts = Counter()
    token_counts = Counter()

    for r in rows:
        note = (r["notes"] or "").strip()
        word = r["word"]
        sentence = r["sentence_text"]
        token, cat, severity = classify_defect(word, note, sentence)
        category_counts[cat] += 1
        clean_token = token if token else word
        token_counts[clean_token] += 1

        ann_id = r["annotator_id"] or "subashsah_wiseyak"
        ann_info = annotators_map.get(ann_id, {})
        ann_name = r["annotator_name"] or ann_info.get("name") or ann_id
        ann_email = r["annotator_email"] or ann_info.get("email") or ""

        if ann_id in annotators_map:
            annotators_map[ann_id]["defect_count"] += 1

        dataset_entries.append({
            "item_id": r["item_id"],
            "target_word": word,
            "meaning_index": r["meaning_index"],
            "pos": r["pos"],
            "flagged_token": clean_token,
            "defect_category": cat,
            "severity": severity,
            "sentence_text": sentence,
            "audio_filename": r["audio_filename"] or f"{r['item_id']}.wav",
            "audio_url": f"/api/audio/{r['item_id']}",
            "reference_audio_url": f"/static/reference_audio/{r['item_id']}.wav",
            "definition": r["definition"],
            "annotator_notes": note,
            "annotator_id": ann_id,
            "annotator_name": ann_name,
            "annotator_email": ann_email,
            "annotated_at": r["updated_at"]
        })

    # Add frequency weights for repetitive tokens
    for entry in dataset_entries:
        entry["token_recurrence_count"] = token_counts.get(entry["flagged_token"], 1)

    annotators_list = [
        v for v in annotators_map.values()
        if v["defect_count"] > 0 or v["total_eval"] > 0
    ]

    output = {
        "metadata": {
            "dataset_name": "Nepali TTS Evaluation Defect Dataset",
            "annotator_id": "all",
            "annotators": annotators_list,
            "total_sentences_evaluated": total_eval,
            "total_thumbs_up": total_up,
            "total_thumbs_down": total_down,
            "total_defect_samples": len(dataset_entries),
            "description": f"Curated set of {len(dataset_entries)} flawed sentences extracted from speech synthesis evaluations, cataloging phoneme, morpheme, and cadence defects for acoustic and G2P model fine-tuning.",
            "category_distribution": dict(category_counts),
            "top_recurrent_error_tokens": token_counts.most_common(20)
        },
        "samples": dataset_entries
    }

    out_file = Path("static/training_pipeline_defects.json")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    with open("training_pipeline_defects.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    conn.close()
    print(f"Exported {len(dataset_entries)} training samples (Total Subash Evaluated: {total_eval})")
    print("Category breakdown:")
    for cat, cnt in category_counts.most_common():
        print(f"  - {cat}: {cnt}")
    print("Top Recurrent Error Tokens:")
    for tok, cnt in token_counts.most_common(10):
        print(f"  - {tok}: {cnt}x")

    return output

if __name__ == '__main__':
    export_pipeline_dataset()
