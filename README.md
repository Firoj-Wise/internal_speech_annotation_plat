# WiseYak - Speech Annotation Platform

Internal speech synthesis evaluation platform for testing and scoring polysemous words and contextual sentences using Nepali TTS audio generated via WiseAI (`omnivoice_tts` / `Pratikshya`).

---

## Architecture & Features

- **Dataset**: 392 polysemous Nepali headwords across 1,712 context sentences with dictionary definitions and parts of speech.
- **Synthesizer Pipeline**:
  - WiseAI TTS client (`tts_service.py`) supporting both synchronous and asynchronous batch synthesis.
  - Multi-threaded offline batch synthesis runner (`generate_audios.py`).
  - Automatic caching to `audios/<item_id>.wav` with on-demand fallback.
- **Access Gate & Authentication**:
  - Secure company authentication (`*@wiseyak.com`) with PBKDF2/SHA-256 salted password hashing.
  - Multi-tab access gate (Sign In & Register New Member).
  - Dual session persistence (`localStorage` + 30-day session cookies).
- **Workspace UI**:
  - Structured, numbered Nepali dictionary definitions with example usage detection (`[उदा]`).
  - Strict Devanagari token-boundary regex highlighting for target polysemous words.
  - Precision audio scrubbing controls with playback speed adjustments (0.75x, 1.0x, 1.25x) and keyboard hotkeys (`Space` to play/pause, `1` for Thumbs Up, `2` for Thumbs Down, `ArrowLeft` / `ArrowRight` to navigate).
- **Database & Sync**:
  - High-performance SQLite database with Write-Ahead Logging (`WAL` mode).
  - Per-user continuous JSON auto-export (`data/annotations/<annotator_id>_annotations.json`).
  - Direct JSON export endpoint (`/api/export/<annotator_id>`).

---

## Quick Start

### 1. Requirements
- Python 3.8+
- Python packages:
  ```bash
  pip install aiohttp requests
  ```

### 2. Generate Audio Cache (Optional / Offline)
To pre-generate all 1,712 sentence audio files concurrently:
```bash
python3 generate_audios.py
```

### 3. Launch Local Server
```bash
python3 server.py
```
Open `http://localhost:8765` in your browser.

---

## Hosting with Public URL (tmux + ngrok)

### 1. Start tmux session
```bash
tmux new -s wiseyak-platform
```

### 2. Run backend server
```bash
python3 server.py
```

### 3. Start ngrok tunnel (in a second tmux window or split pane)
```bash
# Add authtoken (one-time setup)
ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>

# Expose port 8765
ngrok http 8765
```
