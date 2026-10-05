#!/usr/bin/env python3
"""
Create a lightweight training defect package with absolute local audio paths
(no audio binaries copied), ideal for training agents on the same device.
"""

import os
import sys
import json
import csv
import shutil
import zipfile
from pathlib import Path

BASE_DIR = Path("/home/oem/wiseyak_backup/firojpaudel/nep_syn_plat")
GEMINI_PIPELINE_AUDIO_DIR = Path("/home/oem/wiseyak_backup/wiseai-training-pipeline/data/gemini_polysemous/audios")
LOCAL_CANDIDATE_AUDIO_DIR = BASE_DIR / "audios"
LOCAL_REF_AUDIO_DIR = BASE_DIR / "static" / "reference_audio"

TEMP_DIR = BASE_DIR / "nep_tts_defect_training_package"
FINAL_ZIP = BASE_DIR / "nep_tts_defect_training_package.zip"

def build():
    # 1. Remove old heavy zip if exists
    if FINAL_ZIP.exists():
        FINAL_ZIP.unlink()
        print(f"Removed older heavy zip: {FINAL_ZIP}")

    if TEMP_DIR.exists():
        shutil.rmtree(TEMP_DIR)
    
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    manifests_dir = TEMP_DIR / "manifests"
    manifests_dir.mkdir(parents=True, exist_ok=True)

    # 2. Load defects dataset
    with open(BASE_DIR / "training_pipeline_defects.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    samples = data.get("samples", [])
    print(f"Loaded {len(samples)} defect samples.")

    # Update samples with absolute paths on this machine
    for s in samples:
        item_id = s["item_id"]
        cand_path = LOCAL_CANDIDATE_AUDIO_DIR / f"{item_id}.wav"
        ref_path = LOCAL_REF_AUDIO_DIR / f"{item_id}.wav"
        gemini_path = GEMINI_PIPELINE_AUDIO_DIR / f"{item_id}.wav"
        
        s["abs_candidate_audio_path"] = str(cand_path)
        s["abs_reference_audio_path"] = str(ref_path) if ref_path.exists() else str(gemini_path)

    # 3. Save JSON manifest with absolute paths
    with open(manifests_dir / "training_pipeline_defects.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # 4. Save JSONL manifest (ready for PyTorch / Coqui / Kaldi dataset loaders)
    jsonl_path = manifests_dir / "defects_train_manifest.jsonl"
    with open(jsonl_path, "w", encoding="utf-8") as f_jsonl:
        for s in samples:
            record = {
                "item_id": s["item_id"],
                "text": s["sentence_text"],
                "target_word": s["target_word"],
                "flagged_token": s["flagged_token"],
                "defect_category": s["defect_category"],
                "severity": s["severity"],
                "recurrence_weight": s.get("token_recurrence_count", 1),
                "annotator_notes": s["annotator_notes"],
                "annotator": s.get("annotator_name", "Subash Sah"),
                "candidate_audio": s["abs_candidate_audio_path"],
                "reference_audio": s["abs_reference_audio_path"],
                "definition": s["definition"]
            }
            f_jsonl.write(json.dumps(record, ensure_ascii=False) + "\n")

    # 5. Save CSV with absolute paths
    csv_path = manifests_dir / "annotation_defects.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f_csv:
        writer = csv.writer(f_csv)
        writer.writerow([
            "item_id", "target_word", "meaning_index", "pos", "score", 
            "flagged_token", "defect_category", "severity", "recurrence_weight",
            "annotator_notes", "sentence_text", "candidate_audio_path", 
            "reference_audio_path", "definition", "annotated_at"
        ])
        for s in samples:
            writer.writerow([
                s["item_id"], s["target_word"], s["meaning_index"], s["pos"], "thumbs_down",
                s["flagged_token"], s["defect_category"], s["severity"], s.get("token_recurrence_count", 1),
                s["annotator_notes"], s["sentence_text"], s["abs_candidate_audio_path"],
                s["abs_reference_audio_path"], s["definition"], s.get("annotated_at", "")
            ])

    # 6. Copy Markdown Report
    shutil.copy(BASE_DIR / "subash_annotation_defect_report.md", TEMP_DIR / "subash_annotation_defect_report.md")

    # 7. Create README_FOR_TRAINING_AGENT.md
    readme_text = f"""# Nepali TTS Training Pipeline - Defect Retraining Package

## Overview
This package contains 221 human-evaluated speech synthesis defects identified by Subash Sah across 1,712 Nepali polysemous sentences.
No audio binaries are included in this archive; instead, **absolute local filesystem paths** are embedded so the training agent on this system can directly ingest the waveforms without data duplication.

---

## Files in Package
```
nep_tts_defect_training_package/
├── README_FOR_TRAINING_AGENT.md         <- Training agent guidelines & taxonomy
├── subash_annotation_defect_report.md   <- Comprehensive defect catalog & linguistics
└── manifests/
    ├── defects_train_manifest.jsonl     <- Line-by-line JSONL with absolute audio paths
    ├── training_pipeline_defects.json   <- Complete JSON dataset with categories & recurrence weights
    └── annotation_defects.csv           <- Tabular CSV with metadata and audio paths
```

---

## Audio Locations on This Device
- **Candidate Flawed Audios (OmniVoice)**:
  `{LOCAL_CANDIDATE_AUDIO_DIR}/{{item_id}}.wav`
- **Gold Standard Reference Audios (Gemini 3.8 Flash)**:
  `{LOCAL_REF_AUDIO_DIR}/{{item_id}}.wav`
  (Also linked at `{GEMINI_PIPELINE_AUDIO_DIR}/`)

---

## Top Defect Categories & Prescriptions for the Agent

| Category | Count | Priority | Root Cause & Training Prescription |
|---|---|---|---|
| `negative_prefix_prosody_stress` | 8 | High | **Unnatural stress on negative prefix `न-`** (`नदिन` 7x, `नडराई`, `नपाएको`). Shift duration & primary stress to root verb. |
| `consonant_cluster_coarticulation` | 43 | High | **Devanagari conjunct blurring** (`प्रस्ट` 5x, `मञ्चको`, `ढकमक्क`, `दृष्टि`). Fine-tune stop-fricative transitions in acoustic model. |
| `case_marker_boundary_prosody` | 37 | Medium | **Boundary elongation on case markers** (`-मा`, `-को`, `-का`, `-की`, `-लाई`, `-ले`). Group vibhakti with stem in front-end prosodic parsing. |
| `nasalization_chandrabindu_loss` | 26 | High | **Loss of Chandrabindu `ँ` nasal formant** (`साँझपख` 3x, `भौँतारिन`, `आँक`). Align 2.5-3.5 kHz spectral loss with gold reference audio. |
| `lexical_pronunciation_defect` | 95 | Medium | **Polysemic lexical pronunciation drift** (`तर` 5x, `खान` 3x, `खेर` 3x, `पटेर` 3x). Add G2P phonetic override dictionary entries. |

---

## Quick Load Example (Python)
```python
import json
from pathlib import Path

manifest_path = "manifests/defects_train_manifest.jsonl"
with open(manifest_path, "r", encoding="utf-8") as f:
    samples = [json.loads(line) for line in f]

for s in samples:
    text = s["text"]
    cand_wav = Path(s["candidate_audio"])   # Flawed candidate wav
    ref_wav = Path(s["reference_audio"])    # Gold benchmark wav
    weight = s["recurrence_weight"]         # Loss multiplier (e.g. 7x for 'नदिन')
    # Train / fine-tune model here
```
"""
    with open(TEMP_DIR / "README_FOR_TRAINING_AGENT.md", "w", encoding="utf-8") as f:
        f.write(readme_text.strip() + "\n")

    # 8. Create lightweight Zip File
    with zipfile.ZipFile(FINAL_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(TEMP_DIR):
            for file in files:
                file_path = Path(root) / file
                archive_name = file_path.relative_to(TEMP_DIR.parent)
                zipf.write(file_path, archive_name)

    shutil.rmtree(TEMP_DIR)
    size_kb = FINAL_ZIP.stat().st_size / 1024
    print(f"SUCCESS: Created lightweight package at {FINAL_ZIP} ({size_kb:.1f} KB)")

if __name__ == '__main__':
    build()
