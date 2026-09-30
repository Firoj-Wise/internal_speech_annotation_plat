// =====================================================================
// Nepali Polysemous TTS Evaluation Platform - Client Application
// NO EMOJIS - Clean SVG icons, Hotkeys, Dynamic State & Audio Controls
// =====================================================================

(function () {
  'use strict';

  // State
  const state = {
    activeAnnotator: null,
    words: [],
    currentWord: null,
    currentItem: null,
    currentItemId: null,
    filterStatus: 'all',
    searchQuery: '',
    playbackSpeed: 1.0,
    audioDuration: 0,
    isPlaying: false
  };

  // DOM Elements
  const el = {
    // Header
    progressCounter: document.getElementById('progressCounter'),
    progressFill: document.getElementById('progressFill'),
    activeAnnotatorName: document.getElementById('activeAnnotatorName'),
    openOnboardingBtn: document.getElementById('openOnboardingBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),

    // Sidebar
    wordSearchInput: document.getElementById('wordSearchInput'),
    filterTabs: document.querySelectorAll('.filter-tab'),
    wordsListContainer: document.getElementById('wordsListContainer'),

    // Stage
    wordIndexBadge: document.getElementById('wordIndexBadge'),
    posBadge: document.getElementById('posBadge'),
    meaningBadge: document.getElementById('meaningBadge'),
    prevItemBtn: document.getElementById('prevItemBtn'),
    nextItemBtn: document.getElementById('nextItemBtn'),
    itemSequenceText: document.getElementById('itemSequenceText'),
    targetWordHeading: document.getElementById('targetWordHeading'),
    currentScoreBadge: document.getElementById('currentScoreBadge'),
    currentScoreLabel: document.getElementById('currentScoreLabel'),
    definitionText: document.getElementById('definitionText'),
    sentenceKeyLabel: document.getElementById('sentenceKeyLabel'),
    audioCacheStatus: document.getElementById('audioCacheStatus'),
    sentenceContent: document.getElementById('sentenceContent'),

    // Audio
    globalAudio: document.getElementById('globalAudioPlayer'),
    playAudioBtn: document.getElementById('playAudioBtn'),
    playIcon: document.getElementById('playIcon'),
    pauseIcon: document.getElementById('pauseIcon'),
    audioScrubBar: document.getElementById('audioScrubBar'),
    audioScrubFill: document.getElementById('audioScrubFill'),
    audioCurrentTime: document.getElementById('audioCurrentTime'),
    audioDuration: document.getElementById('audioDuration'),
    replayAudioBtn: document.getElementById('replayAudioBtn'),
    speedBtns: document.querySelectorAll('.speed-btn'),

    // Scoring & Feedback
    thumbsUpBtn: document.getElementById('thumbsUpBtn'),
    thumbsDownBtn: document.getElementById('thumbsDownBtn'),
    annotationNotesInput: document.getElementById('annotationNotesInput'),
    saveNotesBtn: document.getElementById('saveNotesBtn'),
    feedbackSaveStatus: document.getElementById('feedbackSaveStatus'),
    feedbackCharCount: document.getElementById('feedbackCharCount'),
    feedbackChipsRow: document.getElementById('feedbackChipsRow'),

    // Stats
    statTotalWords: document.getElementById('statTotalWords'),
    statTotalSentences: document.getElementById('statTotalSentences'),
    statEvaluatedCount: document.getElementById('statEvaluatedCount'),
    statPendingCount: document.getElementById('statPendingCount'),
    distThumbsUpBar: document.getElementById('distThumbsUpBar'),
    distThumbsDownBar: document.getElementById('distThumbsDownBar'),
    statThumbsUpNum: document.getElementById('statThumbsUpNum'),
    statThumbsDownNum: document.getElementById('statThumbsDownNum'),
    cfgModel: document.getElementById('cfgModel'),
    cfgVoice: document.getElementById('cfgVoice'),
    cfgLanguage: document.getElementById('cfgLanguage'),
    cfgAudioCache: document.getElementById('cfgAudioCache'),
    jumpNextUnannotatedBtn: document.getElementById('jumpNextUnannotatedBtn'),

    // Analytics Drawer
    toggleAnalyticsBtn: document.getElementById('toggleAnalyticsBtn'),
    analyticsDrawerOverlay: document.getElementById('analyticsDrawerOverlay'),
    closeAnalyticsDrawerBtn: document.getElementById('closeAnalyticsDrawerBtn'),

    // Modal & Authentication
    onboardingModal: document.getElementById('onboardingModal'),
    closeOnboardingModalBtn: document.getElementById('closeOnboardingModalBtn'),
    authModalTitle: document.getElementById('authModalTitle'),
    authTabsRow: document.getElementById('authTabsRow'),
    tabLoginBtn: document.getElementById('tabLoginBtn'),
    tabRegisterBtn: document.getElementById('tabRegisterBtn'),
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    registerForm: document.getElementById('registerForm'),
    registerName: document.getElementById('registerName'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    credentialAlertCard: document.getElementById('credentialAlertCard'),
    createdEmailVal: document.getElementById('createdEmailVal'),
    createdPasswordVal: document.getElementById('createdPasswordVal'),
    credentialContinueBtn: document.getElementById('credentialContinueBtn'),

    authModalSubtitle: document.getElementById('authModalSubtitle'),
    profileDetailsPanel: document.getElementById('profileDetailsPanel'),
    profileCardName: document.getElementById('profileCardName'),
    profileCardEmail: document.getElementById('profileCardEmail'),
    profileCardEvaluated: document.getElementById('profileCardEvaluated'),
    profileCardThumbsUp: document.getElementById('profileCardThumbsUp'),
    profileCardThumbsDown: document.getElementById('profileCardThumbsDown'),
    profileProgressText: document.getElementById('profileProgressText'),
    profileProgressFill: document.getElementById('profileProgressFill'),
    profileExportBtn: document.getElementById('profileExportBtn'),
    signOutBtn: document.getElementById('signOutBtn'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // -------------------------------------------------------------------
  // Initialization
  // Cookie & Session Persistence Helpers
  function setCookie(name, value, days = 30) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  function getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
  }

  function clearCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  }

  // -------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------
  async function init() {
    setupEventListeners();
    setupAudioListeners();
    setupHotkeys();

    // Check stored session immediately (synchronous)
    loadStoredAnnotator();

    if (state.activeAnnotator) {
      el.onboardingModal.classList.add('hidden');
      await Promise.all([loadConfigInfo(), refreshAllData()]);
    } else {
      showOnboardingModal(false);
      await loadConfigInfo();
    }
  }

  function loadStoredAnnotator() {
    let raw = localStorage.getItem('nep_tts_active_annotator');
    if (!raw) {
      raw = getCookie('nep_tts_active_annotator');
    }
    if (raw) {
      try {
        state.activeAnnotator = JSON.parse(raw);
        localStorage.setItem('nep_tts_active_annotator', raw);
        setCookie('nep_tts_active_annotator', raw, 30);
        updateAnnotatorBadge();
      } catch (e) {
        state.activeAnnotator = null;
      }
    }
  }

  function updateAnnotatorBadge() {
    if (state.activeAnnotator) {
      const email = state.activeAnnotator.email ? ` · ${state.activeAnnotator.email}` : '';
      el.activeAnnotatorName.textContent = `${state.activeAnnotator.name || 'Annotator'}${email}`;
    } else {
      el.activeAnnotatorName.textContent = 'Sign In / Register';
    }
  }

  async function loadConfigInfo() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        const logoTitleEl = document.querySelector('.logo-title');
        const logoSubtitleEl = document.querySelector('.logo-subtitle');
        if (logoTitleEl && data.app_name) logoTitleEl.textContent = data.app_name;
        if (logoSubtitleEl && data.app_subtitle) logoSubtitleEl.textContent = data.app_subtitle;

        if (el.statTotalWords) el.statTotalWords.textContent = data.total_words;
        if (el.statTotalSentences) el.statTotalSentences.textContent = data.total_sentences;
        if (el.cfgModel) el.cfgModel.textContent = data.tts_model;
        if (el.cfgVoice) el.cfgVoice.textContent = data.voice_id;
        if (el.cfgLanguage) el.cfgLanguage.textContent = `${data.language} (${data.language === 'nep' ? 'Nepali' : data.language})`;
        if (el.cfgAudioCache) {
          el.cfgAudioCache.textContent = `${data.cached_audios_count} / ${data.total_sentences} (${data.cached_percentage}%)`;
          if (data.cached_audios_count >= data.total_sentences) {
            el.cfgAudioCache.style.color = '#059669';
            el.cfgAudioCache.style.fontWeight = '700';
          }
        }
      }
    } catch (e) {
      console.warn('Config fetch error:', e);
    }
  }

  async function refreshAllData() {
    await Promise.all([
      loadStats(),
      loadWords()
    ]);

    // If no item loaded, load the first item
    if (!state.currentItemId) {
      loadFirstAvailableItem();
    }
  }

  // -------------------------------------------------------------------
  // Stats & Progress
  // -------------------------------------------------------------------
  async function loadStats() {
    if (!state.activeAnnotator) return;
    try {
      const res = await fetch(`/api/stats?annotator_id=${encodeURIComponent(state.activeAnnotator.annotator_id)}`);
      if (res.ok) {
        const { stats } = await res.json();
        renderStats(stats);
      }
    } catch (e) {
      console.error('Stats error:', e);
    }
  }

  function renderStats(stats) {
    el.progressCounter.textContent = `${stats.annotated_count} / ${stats.total_items} (${stats.completion_percentage}%)`;
    el.progressFill.style.width = `${stats.completion_percentage}%`;

    el.statEvaluatedCount.textContent = stats.annotated_count;
    el.statPendingCount.textContent = stats.pending_count;

    el.statThumbsUpNum.textContent = stats.thumbs_up_count;
    el.statThumbsDownNum.textContent = stats.thumbs_down_count;

    const totalScored = stats.thumbs_up_count + stats.thumbs_down_count;
    if (totalScored > 0) {
      const upPct = (stats.thumbs_up_count / totalScored) * 100;
      const downPct = (stats.thumbs_down_count / totalScored) * 100;
      el.distThumbsUpBar.style.width = `${upPct}%`;
      el.distThumbsDownBar.style.width = `${downPct}%`;
    } else {
      el.distThumbsUpBar.style.width = `50%`;
      el.distThumbsDownBar.style.width = `50%`;
    }
  }

  // -------------------------------------------------------------------
  // Words & Sidebar
  // -------------------------------------------------------------------
  async function loadWords() {
    const annotatorId = state.activeAnnotator ? state.activeAnnotator.annotator_id : '';
    try {
      const res = await fetch(`/api/words?annotator_id=${encodeURIComponent(annotatorId)}`);
      if (res.ok) {
        const data = await res.json();
        state.words = data.words || [];
        renderWordsList();
      }
    } catch (e) {
      console.error('Words load error:', e);
      el.wordsListContainer.innerHTML = '<div class="loading-state">Error loading vocabulary.</div>';
    }
  }

  function renderWordsList() {
    const query = state.searchQuery.trim().toLowerCase();
    const status = state.filterStatus;

    const filtered = state.words.filter(w => {
      if (query && !w.word.toLowerCase().includes(query)) {
        return false;
      }
      if (status === 'annotated' && !w.is_complete) {
        return false;
      }
      if (status === 'pending' && w.is_complete) {
        return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      el.wordsListContainer.innerHTML = '<div class="loading-state">No matching words found.</div>';
      return;
    }

    el.wordsListContainer.innerHTML = '';
    filtered.forEach(w => {
      const itemEl = document.createElement('div');
      itemEl.className = 'word-list-item' + (w.is_complete ? ' complete' : '') + (state.currentWord === w.word ? ' active' : '');
      itemEl.dataset.word = w.word;

      itemEl.innerHTML = `
        <span class="word-name devanagari">${escapeHtml(w.word)}</span>
        <span class="word-progress-badge">${w.annotated_sentences} / ${w.total_sentences}</span>
      `;

      itemEl.addEventListener('click', () => {
        selectWord(w.word);
      });

      el.wordsListContainer.appendChild(itemEl);
    });
  }

  async function selectWord(word) {
    state.currentWord = word;
    renderWordsList();

    // Fetch items for this word
    const annotatorId = state.activeAnnotator ? state.activeAnnotator.annotator_id : '';
    try {
      const res = await fetch(`/api/items?word=${encodeURIComponent(word)}&annotator_id=${encodeURIComponent(annotatorId)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          loadItem(data.items[0].item_id);
        }
      }
    } catch (e) {
      console.error('Word select item error:', e);
    }
  }

  async function loadFirstAvailableItem() {
    const annotatorId = state.activeAnnotator ? state.activeAnnotator.annotator_id : '';
    try {
      const res = await fetch(`/api/items?annotator_id=${encodeURIComponent(annotatorId)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          loadItem(data.items[0].item_id);
        }
      }
    } catch (e) {
      console.error('First item error:', e);
    }
  }

  async function jumpToNextUnannotated() {
    if (!state.activeAnnotator) {
      showOnboardingModal();
      return;
    }
    try {
      const res = await fetch(`/api/items?annotator_id=${encodeURIComponent(state.activeAnnotator.annotator_id)}&status=pending&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          await loadItem(data.items[0].item_id);
          showToast('Loaded next unannotated item');
        } else {
          showToast('All items have been annotated! You can export your JSON now.', 'success');
        }
      }
    } catch (e) {
      console.error('Jump unannotated error:', e);
    }
  }

  // -------------------------------------------------------------------
  // Single Item Loading & Display
  // -------------------------------------------------------------------
  async function loadItem(itemId) {
    if (!itemId) return;
    state.currentItemId = itemId;

    const annotatorId = state.activeAnnotator ? state.activeAnnotator.annotator_id : '';
    try {
      const res = await fetch(`/api/item/${encodeURIComponent(itemId)}?annotator_id=${encodeURIComponent(annotatorId)}`);
      if (!res.ok) throw new Error('Failed to fetch item');

      const { item } = await res.json();
      state.currentItem = item;
      state.currentWord = item.word;

      renderItemView(item);
      renderWordsList();
      prepareAudio(item);
    } catch (e) {
      console.error('Load item error:', e);
      showToast('Error loading sentence item', 'error');
    }
  }

  function renderItemView(item) {
    el.wordIndexBadge.textContent = `Word #${item.word_index + 1}`;
    el.posBadge.textContent = item.pos || 'Part of Speech';
    el.meaningBadge.textContent = `Sense ${item.meaning_index + 1} of ${item.meanings_total}`;

    el.prevItemBtn.disabled = !item.prev_item_id;
    el.nextItemBtn.disabled = !item.next_item_id;
    el.itemSequenceText.textContent = `${item.global_index + 1} / 1,712`;

    el.targetWordHeading.textContent = item.word;
    renderDefinition(item.definition);
    el.sentenceKeyLabel.textContent = item.sentence_key === 'sentence1' ? 'Context Sentence 1' : 'Context Sentence 2';

    // Highlight target word in sentence
    el.sentenceContent.innerHTML = formatSentenceWithHighlight(item.sentence_text, item.word);

    // Audio status indicator
    if (item.is_audio_cached) {
      el.audioCacheStatus.textContent = 'Audio: Cached on server';
      el.audioCacheStatus.style.color = '#10b981';
    } else {
      el.audioCacheStatus.textContent = 'Audio: Ready to generate on-demand';
      el.audioCacheStatus.style.color = '#94a3b8';
    }

    // Existing annotation state
    const annot = item.user_annotation;
    resetScoringButtons();

    const notesVal = (annot && annot.notes) ? annot.notes : '';
    el.annotationNotesInput.value = notesVal;

    if (annot && annot.score) {
      if (annot.score === 'thumbs_up') {
        el.thumbsUpBtn.classList.add('selected');
        el.currentScoreBadge.className = 'evaluation-status-tag evaluated-up';
        el.currentScoreLabel.textContent = 'Thumbs Up (Acceptable)';
      } else if (annot.score === 'thumbs_down') {
        el.thumbsDownBtn.classList.add('selected');
        el.currentScoreBadge.className = 'evaluation-status-tag evaluated-down';
        el.currentScoreLabel.textContent = 'Thumbs Down (Unacceptable)';
      }
      updateFeedbackDeck(notesVal, true);
    } else {
      el.currentScoreBadge.className = 'evaluation-status-tag';
      el.currentScoreLabel.textContent = 'Not Evaluated';
      updateFeedbackDeck(notesVal, false);
    }
  }

  function formatSentenceWithHighlight(sentence, word) {
    if (!sentence) return '';
    if (!word) return escapeHtml(sentence);

    const safeSentence = escapeHtml(sentence);
    const trimmedWord = word.trim();
    const escapedWord = trimmedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Boundary markers: whitespace, Devanagari danda/double-danda, common punctuation, string ends
    const punctBefore = `(?:^|[\\s।,!?;:\\-"'()\\[\\]{}«»])`;
    const punctAfter = `(?=[\\s।,!?;:\\-"'()\\[\\]{}«»]|$)`;

    const strictRegex = new RegExp(`(${punctBefore})(${escapedWord})(${punctAfter})`, 'g');

    if (strictRegex.test(safeSentence)) {
      return safeSentence.replace(strictRegex, '$1<span class="highlight-word">$2</span>');
    }

    // For multi-character words with case markers/vibhakti (e.g. अकर -> अकरमा)
    if (trimmedWord.length > 1) {
      const inflectedRegex = new RegExp(`(${punctBefore})(${escapedWord}[\\u0900-\\u097F]{0,4})(${punctAfter})`, 'g');
      return safeSentence.replace(inflectedRegex, '$1<span class="highlight-word">$2</span>');
    }

    return safeSentence;
  }

  function resetScoringButtons() {
    el.thumbsUpBtn.classList.remove('selected');
    el.thumbsDownBtn.classList.remove('selected');
  }

  function renderDefinition(defText) {
    if (!defText) {
      el.definitionText.innerHTML = '<span class="def-empty">No definition available.</span>';
      return;
    }

    // Split multiple sub-meanings joined by ' । , ' or '। ,' or ' ।,'
    const rawParts = defText.split(/\s*।\s*,\s*/);
    const parts = rawParts.map(p => p.trim()).filter(Boolean);

    if (parts.length > 1) {
      const itemsHtml = parts.map((part, idx) => {
        const formatted = formatDefinitionPart(part);
        return `
          <div class="def-clause-item">
            <span class="def-clause-num">${idx + 1}</span>
            <div class="def-clause-content">${formatted}</div>
          </div>
        `;
      }).join('');
      el.definitionText.innerHTML = `<div class="def-clauses-list">${itemsHtml}</div>`;
    } else {
      const formatted = formatDefinitionPart(defText);
      el.definitionText.innerHTML = `<div class="def-single-content">${formatted}</div>`;
    }
  }

  function formatDefinitionPart(text) {
    let str = escapeHtml(text);
    // Ensure terminal purna biram if missing
    if (!str.endsWith('।') && !str.endsWith('। ')) {
      str = str + ' ।';
    }
    // Highlight 'उदा-' (examples)
    str = str.replace(/(उदा-[\s\S]+?)(?=(?:।|$))/g, '<span class="def-example-tag"><span class="def-example-badge">उदा</span> $1</span>');
    str = str.replace(/<span class="def-example-badge">उदा<\/span> उदा-/g, '<span class="def-example-badge">उदा</span>');
    return str;
  }

  // -------------------------------------------------------------------
  // Dynamic Scoring & Annotation
  // -------------------------------------------------------------------
  async function submitScore(score) {
    if (!state.activeAnnotator) {
      showOnboardingModal();
      return;
    }
    if (!state.currentItem) {
      showToast('No active sentence loaded', 'error');
      return;
    }

    const annotatorId = state.activeAnnotator.annotator_id;
    const itemId = state.currentItem.item_id;
    const notes = el.annotationNotesInput.value.trim();

    // Optimistic UI update
    resetScoringButtons();
    if (score === 'thumbs_up') {
      el.thumbsUpBtn.classList.add('selected');
      el.currentScoreBadge.className = 'evaluation-status-tag evaluated-up';
      el.currentScoreLabel.textContent = 'Thumbs Up (Acceptable)';
    } else {
      el.thumbsDownBtn.classList.add('selected');
      el.currentScoreBadge.className = 'evaluation-status-tag evaluated-down';
      el.currentScoreLabel.textContent = 'Thumbs Down (Unacceptable)';
    }

    try {
      const res = await fetch('/api/annotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotator_id: annotatorId,
          item_id: itemId,
          score: score,
          notes: notes
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save score');
      }

      const data = await res.json();
      renderStats(data.stats);
      showToast(score === 'thumbs_up' ? 'Saved: Thumbs Up (Acceptable)' : 'Saved: Thumbs Down (Unacceptable)', 'success');

      // Update words list local count
      if (state.words) {
        const wObj = state.words.find(w => w.word === state.currentItem.word);
        if (wObj) {
          if (!state.currentItem.user_annotation) {
            wObj.annotated_sentences = Math.min(wObj.total_sentences, wObj.annotated_sentences + 1);
            if (wObj.annotated_sentences >= wObj.total_sentences) {
              wObj.is_complete = true;
            }
          }
          renderWordsList();
        }
      }

      // Update current item user annotation
      state.currentItem.user_annotation = { score, notes };

    } catch (e) {
      console.error('Annotation submit error:', e);
      showToast('Error saving score. Please retry.', 'error');
    }
  }

  // -------------------------------------------------------------------
  // Feedback Deck & Notes Management
  // -------------------------------------------------------------------
  function updateFeedbackDeck(notesText = '', hasScore = false) {
    if (el.feedbackCharCount) {
      el.feedbackCharCount.textContent = `${notesText.length} characters`;
    }
    if (el.feedbackSaveStatus) {
      if (hasScore && notesText.trim()) {
        el.feedbackSaveStatus.textContent = 'Saved with rating';
        el.feedbackSaveStatus.className = 'feedback-auto-status saved';
      } else if (hasScore) {
        el.feedbackSaveStatus.textContent = 'Rating saved';
        el.feedbackSaveStatus.className = 'feedback-auto-status saved';
      } else {
        el.feedbackSaveStatus.textContent = 'Auto-saves with rating';
        el.feedbackSaveStatus.className = 'feedback-auto-status';
      }
    }
    const chips = document.querySelectorAll('.feedback-chip');
    chips.forEach(chip => {
      const tag = chip.getAttribute('data-tag');
      if (tag && notesText.includes(tag)) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  function toggleFeedbackChip(chip) {
    const tag = chip.getAttribute('data-tag');
    if (!tag) return;

    let currentVal = el.annotationNotesInput.value.trim();
    if (currentVal.includes(tag)) {
      currentVal = currentVal.replace(tag, '').replace(/,\s*,/g, ',').replace(/^,\s*|\s*,\s*$/g, '').trim();
      chip.classList.remove('active');
    } else {
      if (currentVal.length > 0) {
        currentVal += `, ${tag}`;
      } else {
        currentVal = tag;
      }
      chip.classList.add('active');
    }
    el.annotationNotesInput.value = currentVal;
    const hasScore = !!(state.currentItem && state.currentItem.user_annotation && state.currentItem.user_annotation.score);
    updateFeedbackDeck(currentVal, hasScore);

    if (hasScore) {
      submitScore(state.currentItem.user_annotation.score);
    }
  }

  async function saveNotesOnly() {
    if (!state.currentItem) return;

    const hasScore = state.currentItem.user_annotation && state.currentItem.user_annotation.score;

    if (hasScore) {
      await submitScore(state.currentItem.user_annotation.score);
      if (el.feedbackSaveStatus) {
        el.feedbackSaveStatus.textContent = 'Notes saved';
        el.feedbackSaveStatus.className = 'feedback-auto-status saved';
      }
      if (el.saveNotesBtn) {
        el.saveNotesBtn.classList.add('saved');
        setTimeout(() => el.saveNotesBtn.classList.remove('saved'), 1500);
      }
    } else {
      if (el.feedbackSaveStatus) {
        el.feedbackSaveStatus.textContent = 'Draft ready — choose rating';
        el.feedbackSaveStatus.className = 'feedback-auto-status';
      }
      showToast('Note recorded! Select Thumbs Up (1) or Down (2) to complete evaluation.', 'info');
    }
  }

  // -------------------------------------------------------------------
  // Audio Controls & On-Demand Playback
  // -------------------------------------------------------------------
  function prepareAudio(item) {
    stopAudio();
    const audioUrl = `/api/audio/${encodeURIComponent(item.item_id)}`;
    el.globalAudio.src = audioUrl;
    el.globalAudio.playbackRate = state.playbackSpeed;
    el.audioCurrentTime.textContent = '00:00';
    el.audioDuration.textContent = '00:00';
    el.audioScrubFill.style.width = '0%';
  }

  function toggleAudio() {
    if (!el.globalAudio.src || el.globalAudio.src === window.location.href) {
      return;
    }

    if (state.isPlaying) {
      el.globalAudio.pause();
    } else {
      el.audioCacheStatus.textContent = 'Synthesizing / Loading audio...';
      el.globalAudio.play().then(() => {
        el.audioCacheStatus.textContent = 'Audio playing';
      }).catch(err => {
        console.error('Audio playback error:', err);
        el.audioCacheStatus.textContent = 'Playback error';
        showToast('Audio playback error', 'error');
      });
    }
  }

  function stopAudio() {
    el.globalAudio.pause();
    el.globalAudio.currentTime = 0;
    setPlayingState(false);
  }

  function setPlayingState(playing) {
    state.isPlaying = playing;
    if (playing) {
      el.playIcon.classList.add('hidden');
      el.pauseIcon.classList.remove('hidden');
    } else {
      el.playIcon.classList.remove('hidden');
      el.pauseIcon.classList.add('hidden');
    }
  }

  function setupAudioListeners() {
    const audio = el.globalAudio;

    audio.addEventListener('play', () => setPlayingState(true));
    audio.addEventListener('pause', () => setPlayingState(false));
    audio.addEventListener('ended', () => {
      setPlayingState(false);
      el.audioScrubFill.style.width = '100%';
    });

    audio.addEventListener('loadedmetadata', () => {
      state.audioDuration = audio.duration;
      el.audioDuration.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        el.audioScrubFill.style.width = `${pct}%`;
        el.audioCurrentTime.textContent = formatTime(audio.currentTime);
      }
    });

    audio.addEventListener('canplay', () => {
      el.audioCacheStatus.textContent = 'Audio ready';
    });

    // Scrubbing
    el.audioScrubBar.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = el.audioScrubBar.getBoundingClientRect();
      const clickPos = (e.clientX - rect.left) / rect.width;
      audio.currentTime = clickPos * audio.duration;
    });

    // Replay
    el.replayAudioBtn.addEventListener('click', () => {
      audio.currentTime = 0;
      audio.play();
    });

    // Speed buttons
    el.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        el.speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.playbackSpeed = parseFloat(btn.dataset.speed);
        audio.playbackRate = state.playbackSpeed;
      });
    });
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // -------------------------------------------------------------------
  // Onboarding & Annotator Profile Modal (Access Gate)
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  // Authentication & Access Gate Modal
  // -------------------------------------------------------------------
  function switchAuthTab(tab) {
    el.credentialAlertCard.classList.add('hidden');
    el.authTabsRow.classList.remove('hidden');

    if (tab === 'login') {
      el.tabLoginBtn.classList.add('active');
      el.tabRegisterBtn.classList.remove('active');
      el.loginForm.classList.remove('hidden');
      el.registerForm.classList.add('hidden');
      if (el.authModalTitle) el.authModalTitle.textContent = 'Sign In';
    } else {
      el.tabRegisterBtn.classList.add('active');
      el.tabLoginBtn.classList.remove('active');
      el.registerForm.classList.remove('hidden');
      el.loginForm.classList.add('hidden');
      if (el.authModalTitle) el.authModalTitle.textContent = 'Register New Annotator';
    }
  }

  function showProfileModal() {
    if (!state.activeAnnotator) {
      showOnboardingModal(false);
      return;
    }
    el.onboardingModal.classList.remove('hidden');
    el.closeOnboardingModalBtn.classList.remove('hidden');
    if (el.authModalTitle) el.authModalTitle.textContent = 'Account Details';
    if (el.authModalSubtitle) {
      el.authModalSubtitle.textContent = 'Active Wiseyak Annotator Session';
    }

    // Hide auth tabs & forms
    el.authTabsRow.classList.add('hidden');
    el.loginForm.classList.add('hidden');
    el.registerForm.classList.add('hidden');
    el.credentialAlertCard.classList.add('hidden');

    // Show profile panel
    el.profileDetailsPanel.classList.remove('hidden');

    // Populate profile data
    el.profileCardName.textContent = state.activeAnnotator.name || 'WiseYak Annotator';
    el.profileCardEmail.textContent = state.activeAnnotator.email || '';
    const evaluated = state.stats ? (state.stats.evaluated_count || 0) : 0;
    const thumbsUp = state.stats ? (state.stats.thumbs_up_count || 0) : 0;
    const thumbsDown = state.stats ? (state.stats.thumbs_down_count || 0) : 0;
    const total = state.stats ? (state.stats.total_sentences || 1712) : 1712;
    const pct = total > 0 ? ((evaluated / total) * 100).toFixed(1) : '0.0';

    el.profileCardEvaluated.textContent = evaluated;
    el.profileCardThumbsUp.textContent = thumbsUp;
    el.profileCardThumbsDown.textContent = thumbsDown;

    if (el.profileProgressText) {
      el.profileProgressText.textContent = `${evaluated} / ${total} (${pct}%)`;
    }
    if (el.profileProgressFill) {
      el.profileProgressFill.style.width = `${pct}%`;
    }
  }

  async function showOnboardingModal(canClose = false) {
    el.onboardingModal.classList.remove('hidden');
    if (canClose && state.activeAnnotator) {
      el.closeOnboardingModalBtn.classList.remove('hidden');
    } else {
      el.closeOnboardingModalBtn.classList.add('hidden');
    }
    el.authTabsRow.classList.remove('hidden');
    el.profileDetailsPanel.classList.add('hidden');
    if (el.authModalSubtitle) {
      el.authModalSubtitle.textContent = 'Sign in or register to access the evaluation platform.';
    }
    switchAuthTab('login');
  }

  function hideOnboardingModal() {
    if (!state.activeAnnotator) {
      showToast('Please sign in or register to access the platform.', 'error');
      return;
    }
    el.onboardingModal.classList.add('hidden');
  }

  function openAnalyticsDrawer() {
    if (el.analyticsDrawerOverlay) {
      el.analyticsDrawerOverlay.classList.remove('hidden');
    }
  }

  function closeAnalyticsDrawer() {
    if (el.analyticsDrawerOverlay) {
      el.analyticsDrawerOverlay.classList.add('hidden');
    }
  }

  function selectAnnotator(annotator) {
    state.activeAnnotator = annotator;
    const str = JSON.stringify(annotator);
    localStorage.setItem('nep_tts_active_annotator', str);
    setCookie('nep_tts_active_annotator', str, 30);
    updateAnnotatorBadge();
    el.onboardingModal.classList.add('hidden');
    refreshAllData();
  }

  function signOut() {
    state.activeAnnotator = null;
    localStorage.removeItem('nep_tts_active_annotator');
    clearCookie('nep_tts_active_annotator');
    updateAnnotatorBadge();
    el.profileDetailsPanel.classList.add('hidden');
    showOnboardingModal(false);
    showToast('Signed out successfully.', 'info');
  }

  async function safeFetchJson(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      if (res.status === 404) {
        throw new Error('Server routes need refresh. Please restart python3 server.py in your terminal.');
      }
      throw new Error(text || `Server returned error status ${res.status}`);
    }
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: Failed`);
    }
    return data;
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = el.loginEmail.value.trim().toLowerCase();
    const password = el.loginPassword.value.trim();

    if (!email) {
      showToast('Wiseyak company email is required', 'error');
      return;
    }
    if (!password) {
      showToast('Password is required', 'error');
      return;
    }

    try {
      const data = await safeFetchJson('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      selectAnnotator(data.annotator);
      showToast(`Welcome back, ${data.annotator.name}!`, 'success');
    } catch (err) {
      console.error('Login error:', err);
      showToast(err.message || 'Login failed', 'error');
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = el.registerName.value.trim();
    const email = el.registerEmail.value.trim().toLowerCase();
    const password = el.registerPassword.value.trim();

    if (!name) {
      showToast('Full name is required', 'error');
      return;
    }
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid company email address', 'error');
      return;
    }

    try {
      const data = await safeFetchJson('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      // Store annotator for confirmation step
      state.pendingAnnotator = data.annotator;

      // Reveal credential card
      el.authTabsRow.classList.add('hidden');
      el.registerForm.classList.add('hidden');
      el.loginForm.classList.add('hidden');
      if (el.authModalTitle) el.authModalTitle.textContent = 'Account Created';

      el.createdEmailVal.textContent = data.annotator.email;
      el.createdPasswordVal.textContent = data.assigned_password;
      el.credentialAlertCard.classList.remove('hidden');

      showToast('Account registered! Please note your password below.', 'success');
    } catch (err) {
      console.error('Register error:', err);
      showToast(err.message || 'Registration failed', 'error');
    }
  }

  function handleCredentialContinue() {
    if (state.pendingAnnotator) {
      selectAnnotator(state.pendingAnnotator);
      showToast(`Welcome, ${state.pendingAnnotator.name}!`);
      state.pendingAnnotator = null;
    }
    el.credentialAlertCard.classList.add('hidden');
    el.authTabsRow.classList.remove('hidden');
  }

  // -------------------------------------------------------------------
  // Export JSON
  // -------------------------------------------------------------------
  function exportUserData() {
    if (!state.activeAnnotator) {
      showOnboardingModal(false);
      return;
    }
    const annotatorId = state.activeAnnotator.annotator_id;
    window.location.href = `/api/export/${encodeURIComponent(annotatorId)}`;
    showToast('Exporting annotator JSON dataset...');
  }

  // -------------------------------------------------------------------
  // Event Listeners
  // -------------------------------------------------------------------
  function setupEventListeners() {
    // Header Profile Button: Open Profile Details if logged in, otherwise Sign In modal
    el.openOnboardingBtn.addEventListener('click', () => {
      if (state.activeAnnotator) {
        showProfileModal();
      } else {
        showOnboardingModal(true);
      }
    });

    el.closeOnboardingModalBtn.addEventListener('click', hideOnboardingModal);

    // Analytics Drawer Toggle & Close
    if (el.toggleAnalyticsBtn) {
      el.toggleAnalyticsBtn.addEventListener('click', openAnalyticsDrawer);
    }
    if (el.closeAnalyticsDrawerBtn) {
      el.closeAnalyticsDrawerBtn.addEventListener('click', closeAnalyticsDrawer);
    }
    if (el.analyticsDrawerOverlay) {
      el.analyticsDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === el.analyticsDrawerOverlay) {
          closeAnalyticsDrawer();
        }
      });
    }

    // Dismiss modal on background backdrop click if user is signed in
    el.onboardingModal.addEventListener('click', (e) => {
      if (e.target === el.onboardingModal && state.activeAnnotator) {
        hideOnboardingModal();
      }
    });

    // Sign out button in Profile modal
    if (el.signOutBtn) {
      el.signOutBtn.addEventListener('click', () => {
        signOut();
      });
    }

    // Export button in Profile modal
    if (el.profileExportBtn) {
      el.profileExportBtn.addEventListener('click', exportUserData);
    }

    if (el.exportJsonBtn) {
      el.exportJsonBtn.addEventListener('click', exportUserData);
    }

    // Auth Switcher & Forms
    el.tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
    el.tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));
    el.loginForm.addEventListener('submit', handleLoginSubmit);
    el.registerForm.addEventListener('submit', handleRegisterSubmit);
    el.credentialContinueBtn.addEventListener('click', handleCredentialContinue);

    // Audio Trigger
    el.playAudioBtn.addEventListener('click', toggleAudio);

    // Scoring & Feedback
    el.thumbsUpBtn.addEventListener('click', () => submitScore('thumbs_up'));
    el.thumbsDownBtn.addEventListener('click', () => submitScore('thumbs_down'));
    el.saveNotesBtn.addEventListener('click', saveNotesOnly);

    // Feedback chips & textarea
    document.querySelectorAll('.feedback-chip').forEach(chip => {
      chip.addEventListener('click', () => toggleFeedbackChip(chip));
    });
    el.annotationNotesInput.addEventListener('input', (e) => {
      const hasScore = !!(state.currentItem && state.currentItem.user_annotation && state.currentItem.user_annotation.score);
      updateFeedbackDeck(e.target.value, hasScore);
    });

    // Navigation
    el.prevItemBtn.addEventListener('click', () => {
      if (state.currentItem && state.currentItem.prev_item_id) {
        loadItem(state.currentItem.prev_item_id);
      }
    });

    el.nextItemBtn.addEventListener('click', () => {
      if (state.currentItem && state.currentItem.next_item_id) {
        loadItem(state.currentItem.next_item_id);
      }
    });

    el.jumpNextUnannotatedBtn.addEventListener('click', jumpToNextUnannotated);

    // Search input
    el.wordSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderWordsList();
    });

    // Filter tabs
    el.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        el.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.filterStatus = tab.dataset.status;
        renderWordsList();
      });
    });
  }

  function setupHotkeys() {
    window.addEventListener('keydown', (e) => {
      if (!state.activeAnnotator) return;

      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        if (e.key === 'Enter' && document.activeElement === el.annotationNotesInput) {
          saveNotesOnly();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleAudio();
      } else if (e.key === '1') {
        submitScore('thumbs_up');
      } else if (e.key === '2') {
        submitScore('thumbs_down');
      } else if (e.key === 'ArrowLeft') {
        if (state.currentItem && state.currentItem.prev_item_id) {
          loadItem(state.currentItem.prev_item_id);
        }
      } else if (e.key === 'ArrowRight') {
        if (state.currentItem && state.currentItem.next_item_id) {
          loadItem(state.currentItem.next_item_id);
        }
      }
    });
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
