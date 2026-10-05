import os
import sys
from pathlib import Path
from dataset import DATASET

SRC_DIR = Path("/home/oem/wiseyak_backup/wiseai-training-pipeline/data/gemini_polysemous/audios")
DEST_DIR = Path("/home/oem/wiseyak_backup/firojpaudel/nep_syn_plat/static/reference_audio")

print(f"Checking source directory: {SRC_DIR}")
if not SRC_DIR.exists():
    print(f"Error: Source directory {SRC_DIR} does not exist!")
    sys.exit(1)

DEST_DIR.mkdir(parents=True, exist_ok=True)

# Remove any existing files/symlinks in DEST_DIR
for f in DEST_DIR.iterdir():
    try:
        f.unlink()
    except Exception:
        pass

linked = 0
for idx, item in enumerate(DATASET.items):
    ref_name = f"polysemous_{idx + 1:06d}.wav"
    src_file = SRC_DIR / ref_name
    dest_file = DEST_DIR / f"{item['item_id']}.wav"
    
    if src_file.exists():
        os.link(src_file, dest_file)
        linked += 1

print(f"Successfully hardlinked {linked} reference audio files into {DEST_DIR}!")
