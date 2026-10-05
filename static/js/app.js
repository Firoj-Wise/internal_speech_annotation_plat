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
    isPlaying: false,
    refPlaybackSpeed: 1.0,
    refAudioDuration: 0,
    isRefPlaying: false,
    currentComments: []
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

    // Audio (Candidate)
    globalAudio: document.getElementById('globalAudioPlayer'),
    playAudioBtn: document.getElementById('playAudioBtn'),
    playIcon: document.getElementById('playIcon'),
    pauseIcon: document.getElementById('pauseIcon'),
    audioScrubBar: document.getElementById('audioScrubBar'),
    audioScrubFill: document.getElementById('audioScrubFill'),
    audioCurrentTime: document.getElementById('audioCurrentTime'),
    audioDuration: document.getElementById('audioDuration'),
    replayAudioBtn: document.getElementById('replayAudioBtn'),
    speedBtns: document.querySelectorAll('.speed-btn:not(.ref-speed-btn)'),

    // Audio (Reference - Gemini 3.8 Flash)
    refAudio: document.getElementById('refAudioPlayer'),
    playRefAudioBtn: document.getElementById('playRefAudioBtn'),
    refPlayIcon: document.getElementById('refPlayIcon'),
    refPauseIcon: document.getElementById('refPauseIcon'),
    refAudioScrubBar: document.getElementById('refAudioScrubBar'),
    refAudioScrubFill: document.getElementById('refAudioScrubFill'),
    refAudioCurrentTime: document.getElementById('refAudioCurrentTime'),
    refAudioDuration: document.getElementById('refAudioDuration'),
    replayRefAudioBtn: document.getElementById('replayRefAudioBtn'),
    refSpeedBtns: document.querySelectorAll('.ref-speed-btn'),

    // Text Selection & In-line Comments
    selectionCommentPopover: document.getElementById('selectionCommentPopover'),
    popoverSelectedWord: document.getElementById('popoverSelectedWord'),
    popoverQuickTags: document.getElementById('popoverQuickTags'),
    popoverCommentInput: document.getElementById('popoverCommentInput'),
    popoverAddCommentBtn: document.getElementById('popoverAddCommentBtn'),
    popoverCancelBtn: document.getElementById('popoverCancelBtn'),
    sentenceCommentsDeck: document.getElementById('sentenceCommentsDeck'),
    sentenceCommentsCount: document.getElementById('sentenceCommentsCount'),
    sentenceCommentsList: document.getElementById('sentenceCommentsList'),

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

    // Side-by-Side Defect Studio
    openDefectStudioBtn: document.getElementById('openDefectStudioBtn'),
    headerDefectBadge: document.getElementById('headerDefectBadge'),
    defectStudioModal: document.getElementById('defectStudioModal'),
    closeDefectStudioBtn: document.getElementById('closeDefectStudioBtn'),
    refreshDefectsStudioBtn: document.getElementById('refreshDefectsStudioBtn'),
    defectSearchInput: document.getElementById('defectSearchInput'),
    defectAnnotatorSection: document.getElementById('defectAnnotatorSection'),
    defectAnnotatorChips: document.getElementById('defectAnnotatorChips'),
    defectCategoryChips: document.getElementById('defectCategoryChips'),
    defectRepetitiveChips: document.getElementById('defectRepetitiveChips'),
    defectItemsList: document.getElementById('defectItemsList'),
    defectMainInspector: document.getElementById('defectMainInspector'),
    defectStudioTotalCount: document.getElementById('defectStudioTotalCount'),
    defectStudioSubtitle: document.getElementById('defectStudioSubtitle'),
    defectLiveBadge: document.getElementById('defectLiveBadge'),
    studioAudioPlayer: document.getElementById('studioAudioPlayer'),

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
    setupDefectStudio();
    setupSelectionAnnotation();

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
      loadWords(),
      loadGlobalOverview()
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
  // Global Database & SQL Sync Overview
  // -------------------------------------------------------------------
  async function loadGlobalOverview() {
    try {
      let data = null;
      try {
        const res = await fetch(`/api/overview?t=${Date.now()}`);
        if (res.ok) data = await res.json();
      } catch (err) {}

      if (!data) {
        const staticRes = await fetch(`/static/overview.json?t=${Date.now()}`);
        if (staticRes.ok) data = await staticRes.json();
      }

      if (data) {
        renderGlobalOverview(data);
      }
    } catch (e) {
      console.warn('Global overview load warning:', e);
    }
  }

  function renderGlobalOverview(data) {
    if (!data) return;

    // Header badge
    const headerBadge = document.getElementById('headerAnalyticsBadge');
    if (headerBadge) {
      headerBadge.textContent = `${data.completion_percentage}%`;
    }

    // Platform DB Hero Card
    const evalCount = document.getElementById('globalEvaluatedCount');
    if (evalCount) evalCount.textContent = (data.distinct_items_annotated || data.total_annotations || 0).toLocaleString();

    const pendingCount = document.getElementById('globalPendingCount');
    if (pendingCount) pendingCount.textContent = (data.pending_items || 0).toLocaleString();

    const pctBadge = document.getElementById('globalPctBadge');
    if (pctBadge) pctBadge.textContent = `${data.completion_percentage}%`;

    // Multi-track fills
    const totalItems = data.total_dataset_items || 1712;
    const upPct = totalItems > 0 ? ((data.thumbs_up_count || 0) / totalItems) * 100 : 0;
    const downPct = totalItems > 0 ? ((data.thumbs_down_count || 0) / totalItems) * 100 : 0;

    const fillUp = document.getElementById('globalMultiFillUp');
    if (fillUp) fillUp.style.width = `${upPct.toFixed(1)}%`;
    const fillDown = document.getElementById('globalMultiFillDown');
    if (fillDown) fillDown.style.width = `${downPct.toFixed(1)}%`;

    // Split numbers
    const totalScored = ((data.thumbs_up_count || 0) + (data.thumbs_down_count || 0)) || 1;
    const upScoredPct = (((data.thumbs_up_count || 0) / totalScored) * 100).toFixed(1);
    const downScoredPct = (((data.thumbs_down_count || 0) / totalScored) * 100).toFixed(1);

    const upVal = document.getElementById('globalThumbsUpCount');
    if (upVal) upVal.textContent = (data.thumbs_up_count || 0).toLocaleString();
    const upPctEl = document.getElementById('globalThumbsUpPct');
    if (upPctEl) upPctEl.textContent = `${upScoredPct}%`;

    const downVal = document.getElementById('globalThumbsDownCount');
    if (downVal) downVal.textContent = (data.thumbs_down_count || 0).toLocaleString();
    const downPctEl = document.getElementById('globalThumbsDownPct');
    if (downPctEl) downPctEl.textContent = `${downScoredPct}%`;

    // SQL dump info
    const sizeLabel = document.getElementById('sqlFileSize');
    if (sizeLabel && data.sql_dump) {
      sizeLabel.textContent = `${data.sql_dump.size_kb || Math.round((data.sql_dump.size_bytes || 0) / 1024)} KB`;
    }

    // Sync time badge
    const syncBadge = document.getElementById('drawerSyncTimeBadge');
    if (syncBadge && data.last_synced) {
      const timeStr = new Date(data.last_synced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      syncBadge.textContent = `Live SQLite • Synced ${timeStr}`;
    }

    // Annotators Roster
    const annotatorsCountBadge = document.getElementById('annotatorsCountBadge');
    if (annotatorsCountBadge && data.annotators) {
      annotatorsCountBadge.textContent = data.annotators.length;
    }

    const rosterList = document.getElementById('annotatorsRosterList');
    if (rosterList && data.annotators && data.annotators.length > 0) {
      rosterList.innerHTML = data.annotators.map(ann => {
        const total = ann.total_evals || 0;
        const up = ann.thumbs_up || 0;
        const down = ann.thumbs_down || 0;
        const pct = ann.percentage || 0;
        return `
          <div class="annotator-card">
            <div class="annotator-card-top">
              <div>
                <h4 class="annotator-name">${escapeHtml(ann.name)}</h4>
                <p class="annotator-email">${escapeHtml(ann.email || ann.annotator_id)}</p>
              </div>
              <span class="annotator-eval-count">${total.toLocaleString()} sentences</span>
            </div>
            <div class="annotator-mini-bar-track">
              <div class="annotator-mini-bar-fill" style="width: ${Math.min(100, pct)}%;"></div>
            </div>
            <div class="annotator-pills-row">
              <span>👍 ${up.toLocaleString()} acceptable • 👎 ${down.toLocaleString()} flawed</span>
              <span>${pct}% of dataset</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Defects log
    const defectsCountBadge = document.getElementById('defectsCountBadge');
    if (defectsCountBadge) {
      defectsCountBadge.textContent = data.thumbs_down_count || (data.recent_defect_notes ? data.recent_defect_notes.length : 0);
    }

    const defectsList = document.getElementById('defectsLogList');
    if (defectsList && data.recent_defect_notes && data.recent_defect_notes.length > 0) {
      defectsList.innerHTML = data.recent_defect_notes.map(def => {
        const timeStr = def.updated_at ? new Date(def.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        return `
          <div class="defect-log-card" style="cursor: pointer;" onclick="window.nepLoadItem && window.nepLoadItem('${def.item_id}')" title="Click to view this sentence">
            <div class="defect-card-header">
              <span class="defect-word-tag">${escapeHtml(def.word)}</span>
              <span class="defect-note-badge">${escapeHtml(def.notes || 'Flawed')}</span>
            </div>
            <p class="defect-sentence-snippet">"${escapeHtml(def.sentence_text)}"</p>
            <div class="defect-meta-time">Logged at ${timeStr}</div>
          </div>
        `;
      }).join('');
    }
  }

  function switchDrawerTab(tabId) {
    const tabs = [
      { btnId: 'tabOverviewGlobal', panelId: 'panelOverviewGlobal' },
      { btnId: 'tabOverviewAnnotators', panelId: 'panelOverviewAnnotators' },
      { btnId: 'tabOverviewDefects', panelId: 'panelOverviewDefects' },
      { btnId: 'tabOverviewPipeline', panelId: 'panelOverviewPipeline' }
    ];

    tabs.forEach(t => {
      const btn = document.getElementById(t.btnId);
      const panel = document.getElementById(t.panelId);
      if (btn && panel) {
        if (t.btnId === tabId) {
          btn.classList.add('active');
          panel.classList.remove('hidden');
        } else {
          btn.classList.remove('active');
          panel.classList.add('hidden');
        }
      }
    });
  }

  async function refreshOverviewData() {
    const btn = document.getElementById('refreshOverviewBtn');
    if (btn) btn.style.opacity = '0.5';
    showToast('Refreshing live database query and sync...', 'info');
    try {
      try {
        await fetch('/api/export/sql/sync', { method: 'POST' });
      } catch (e) {}
      await loadGlobalOverview();
      showToast('Database overview and SQL dump refreshed!', 'success');
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      if (btn) btn.style.opacity = '1';
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
    window.nepLoadItem = loadItem;
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
      prepareRefAudio(item);
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

    // Existing annotation state & notes
    const annot = item.user_annotation;
    resetScoringButtons();

    const notesVal = (annot && annot.notes) ? annot.notes : '';
    el.annotationNotesInput.value = notesVal;

    // Parse comments and render highlighted sentence + comments deck
    parseCommentsFromNotes(notesVal);
    renderSentenceWithComments();
    renderCommentsList();

    // Audio status indicator
    if (item.is_audio_cached) {
      el.audioCacheStatus.textContent = 'Candidate: Cached on server';
      el.audioCacheStatus.style.color = '#10b981';
    } else {
      el.audioCacheStatus.textContent = 'Candidate: Ready to generate';
      el.audioCacheStatus.style.color = '#94a3b8';
    }

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

      // Real-time Defect Studio Live Sync
      loadDefectStudioData();

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

  function prepareRefAudio(item) {
    stopRefAudio();
    if (!el.refAudio) return;
    const refUrl = `/static/reference_audio/${encodeURIComponent(item.item_id)}.wav`;
    el.refAudio.src = refUrl;
    el.refAudio.playbackRate = state.refPlaybackSpeed || 1.0;
    if (el.refAudioCurrentTime) el.refAudioCurrentTime.textContent = '00:00';
    if (el.refAudioDuration) el.refAudioDuration.textContent = '00:00';
    if (el.refAudioScrubFill) el.refAudioScrubFill.style.width = '0%';
  }

  function toggleAudio() {
    if (!el.globalAudio.src || el.globalAudio.src === window.location.href) {
      return;
    }

    // Pause reference audio if playing
    if (state.isRefPlaying && el.refAudio) {
      el.refAudio.pause();
    }

    if (state.isPlaying) {
      el.globalAudio.pause();
    } else {
      el.audioCacheStatus.textContent = 'Synthesizing / Loading candidate...';
      el.globalAudio.play().then(() => {
        el.audioCacheStatus.textContent = 'Candidate audio playing';
      }).catch(err => {
        console.error('Audio playback error:', err);
        el.audioCacheStatus.textContent = 'Playback error';
        showToast('Candidate audio playback error', 'error');
      });
    }
  }

  function toggleRefAudio() {
    if (!el.refAudio || !el.refAudio.src || el.refAudio.src === window.location.href) {
      return;
    }

    // Pause candidate audio if playing
    if (state.isPlaying && el.globalAudio) {
      el.globalAudio.pause();
    }

    if (state.isRefPlaying) {
      el.refAudio.pause();
    } else {
      el.refAudio.play().catch(err => {
        console.error('Reference audio playback error:', err);
        showToast('Reference audio playback error', 'error');
      });
    }
  }

  function stopAudio() {
    el.globalAudio.pause();
    el.globalAudio.currentTime = 0;
    setPlayingState(false);
  }

  function stopRefAudio() {
    if (el.refAudio) {
      el.refAudio.pause();
      el.refAudio.currentTime = 0;
      setRefPlayingState(false);
    }
  }

  function setPlayingState(playing) {
    state.isPlaying = playing;
    const channelCandidate = document.querySelector('.channel-candidate');
    if (playing) {
      el.playIcon.classList.add('hidden');
      el.pauseIcon.classList.remove('hidden');
      if (channelCandidate) channelCandidate.classList.add('is-playing');
    } else {
      el.playIcon.classList.remove('hidden');
      el.pauseIcon.classList.add('hidden');
      if (channelCandidate) channelCandidate.classList.remove('is-playing');
    }
  }

  function setRefPlayingState(playing) {
    state.isRefPlaying = playing;
    const channelRef = document.querySelector('.channel-reference');
    if (playing) {
      if (el.refPlayIcon) el.refPlayIcon.classList.add('hidden');
      if (el.refPauseIcon) el.refPauseIcon.classList.remove('hidden');
      if (channelRef) channelRef.classList.add('is-playing');
    } else {
      if (el.refPlayIcon) el.refPlayIcon.classList.remove('hidden');
      if (el.refPauseIcon) el.refPauseIcon.classList.add('hidden');
      if (channelRef) channelRef.classList.remove('is-playing');
    }
  }

  function setupAudioListeners() {
    // Candidate Audio Listeners
    const audio = el.globalAudio;

    audio.addEventListener('play', () => {
      setPlayingState(true);
      if (state.isRefPlaying && el.refAudio) el.refAudio.pause();
    });
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

    // Scrubbing Candidate
    el.audioScrubBar.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = el.audioScrubBar.getBoundingClientRect();
      const clickPos = (e.clientX - rect.left) / rect.width;
      audio.currentTime = clickPos * audio.duration;
    });

    // Replay Candidate
    el.replayAudioBtn.addEventListener('click', () => {
      audio.currentTime = 0;
      audio.play();
    });

    // Candidate Speed buttons
    el.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        el.speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.playbackSpeed = parseFloat(btn.dataset.speed);
        audio.playbackRate = state.playbackSpeed;
      });
    });

    // Reference Audio Listeners
    if (el.refAudio) {
      const ref = el.refAudio;

      ref.addEventListener('play', () => {
        setRefPlayingState(true);
        if (state.isPlaying && el.globalAudio) el.globalAudio.pause();
      });
      ref.addEventListener('pause', () => setRefPlayingState(false));
      ref.addEventListener('ended', () => {
        setRefPlayingState(false);
        if (el.refAudioScrubFill) el.refAudioScrubFill.style.width = '100%';
      });

      ref.addEventListener('loadedmetadata', () => {
        state.refAudioDuration = ref.duration;
        if (el.refAudioDuration) el.refAudioDuration.textContent = formatTime(ref.duration);
      });

      ref.addEventListener('timeupdate', () => {
        if (ref.duration) {
          const pct = (ref.currentTime / ref.duration) * 100;
          if (el.refAudioScrubFill) el.refAudioScrubFill.style.width = `${pct}%`;
          if (el.refAudioCurrentTime) el.refAudioCurrentTime.textContent = formatTime(ref.currentTime);
        }
      });

      if (el.playRefAudioBtn) {
        el.playRefAudioBtn.addEventListener('click', toggleRefAudio);
      }

      if (el.refAudioScrubBar) {
        el.refAudioScrubBar.addEventListener('click', (e) => {
          if (!ref.duration) return;
          const rect = el.refAudioScrubBar.getBoundingClientRect();
          const clickPos = (e.clientX - rect.left) / rect.width;
          ref.currentTime = clickPos * ref.duration;
        });
      }

      if (el.replayRefAudioBtn) {
        el.replayRefAudioBtn.addEventListener('click', () => {
          ref.currentTime = 0;
          ref.play();
        });
      }

      if (el.refSpeedBtns) {
        el.refSpeedBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            el.refSpeedBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.refPlaybackSpeed = parseFloat(btn.dataset.speed);
            ref.playbackRate = state.refPlaybackSpeed;
          });
        });
      }
    }
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
      loadGlobalOverview();
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
    loadDefectStudioData();
  }

  function signOut() {
    state.activeAnnotator = null;
    localStorage.removeItem('nep_tts_active_annotator');
    clearCookie('nep_tts_active_annotator');
    updateAnnotatorBadge();
    el.profileDetailsPanel.classList.add('hidden');
    showOnboardingModal(false);
    showToast('Signed out successfully.', 'info');
    loadDefectStudioData();
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

    // Drawer Sub-Tabs
    const tGlobal = document.getElementById('tabOverviewGlobal');
    const tAnn = document.getElementById('tabOverviewAnnotators');
    const tDef = document.getElementById('tabOverviewDefects');
    const tPipe = document.getElementById('tabOverviewPipeline');
    const refreshBtn = document.getElementById('refreshOverviewBtn');

    if (tGlobal) tGlobal.addEventListener('click', () => switchDrawerTab('tabOverviewGlobal'));
    if (tAnn) tAnn.addEventListener('click', () => switchDrawerTab('tabOverviewAnnotators'));
    if (tDef) tDef.addEventListener('click', () => switchDrawerTab('tabOverviewDefects'));
    if (tPipe) tPipe.addEventListener('click', () => switchDrawerTab('tabOverviewPipeline'));
    if (refreshBtn) refreshBtn.addEventListener('click', refreshOverviewData);

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
      // Hotkey routing for Side-by-Side Defect Studio when open
      if (el.defectStudioModal && !el.defectStudioModal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          closeDefectStudio();
          return;
        }
        if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
          e.preventDefault();
          toggleStudioAudio();
          return;
        }
        if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') {
          if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            navigateDefectStudio(1);
            return;
          }
        }
        if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
          if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            navigateDefectStudio(-1);
            return;
          }
        }
        return;
      }

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
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        toggleRefAudio();
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
  // In-line Text Selection Annotation / Google Docs-Style Commenting
  // -------------------------------------------------------------------
  let currentSelectionRange = null;
  let currentSelectedText = '';
  let selectedTag = 'उच्चारण (Pronunciation)';

  function setupSelectionAnnotation() {
    const sc = el.sentenceContent;
    if (!sc) return;

    ['mouseup', 'keyup'].forEach(evt => {
      sc.addEventListener(evt, handleSentenceTextSelection);
    });

    if (el.popoverQuickTags) {
      el.popoverQuickTags.querySelectorAll('.pop-tag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          el.popoverQuickTags.querySelectorAll('.pop-tag-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedTag = btn.dataset.tag;
        });
      });
    }

    if (el.popoverAddCommentBtn) {
      el.popoverAddCommentBtn.addEventListener('click', addCommentFromPopover);
    }
    if (el.popoverCommentInput) {
      el.popoverCommentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addCommentFromPopover();
        } else if (e.key === 'Escape') {
          hideCommentPopover();
        }
      });
    }

    if (el.popoverCancelBtn) {
      el.popoverCancelBtn.addEventListener('click', hideCommentPopover);
    }

    document.addEventListener('mousedown', (e) => {
      if (el.selectionCommentPopover && !el.selectionCommentPopover.classList.contains('hidden')) {
        if (!el.selectionCommentPopover.contains(e.target) && !el.sentenceContent.contains(e.target)) {
          hideCommentPopover();
        }
      }
    });
  }

  function handleSentenceTextSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      return;
    }
    const text = sel.toString().trim();
    if (!text || text.length === 0) {
      return;
    }

    if (!el.sentenceContent.contains(sel.anchorNode) || !el.sentenceContent.contains(sel.focusNode)) {
      return;
    }

    currentSelectionRange = sel.getRangeAt(0).cloneRange();
    currentSelectedText = text;

    showCommentPopover(currentSelectionRange, text);
  }

  function showCommentPopover(range, text) {
    if (!el.selectionCommentPopover) return;
    el.popoverSelectedWord.textContent = text;
    el.popoverCommentInput.value = '';

    const rect = range.getBoundingClientRect();
    const wrapperRect = el.sentenceContent.parentElement.getBoundingClientRect();

    const top = rect.bottom - wrapperRect.top + 8;
    const centerLeft = rect.left - wrapperRect.left + (rect.width / 2);
    const clampedLeft = Math.max(160, Math.min(wrapperRect.width - 160, centerLeft));

    el.selectionCommentPopover.style.top = `${top}px`;
    el.selectionCommentPopover.style.left = `${clampedLeft}px`;
    el.selectionCommentPopover.classList.remove('hidden');

    setTimeout(() => {
      if (el.popoverCommentInput) el.popoverCommentInput.focus();
    }, 50);
  }

  function hideCommentPopover() {
    if (el.selectionCommentPopover) {
      el.selectionCommentPopover.classList.add('hidden');
    }
    currentSelectionRange = null;
    currentSelectedText = '';
  }

  function addCommentFromPopover() {
    if (!currentSelectedText) return;

    const noteText = el.popoverCommentInput.value.trim();
    const commentObj = {
      id: 'c_' + Date.now(),
      span: currentSelectedText,
      tag: selectedTag,
      comment: noteText || selectedTag,
      timestamp: new Date().toISOString()
    };

    if (!state.currentComments) {
      state.currentComments = [];
    }
    state.currentComments.push(commentObj);

    hideCommentPopover();
    if (window.getSelection()) {
      window.getSelection().removeAllRanges();
    }

    renderSentenceWithComments();
    renderCommentsList();
    syncCommentsToNotesInput();
    showToast(`Comment added on "${commentObj.span}"`, 'success');
  }

  function renderSentenceWithComments() {
    if (!state.currentItem) return;
    const rawSentence = state.currentItem.sentence_text;
    const targetWord = state.currentItem.word;

    let html = escapeHtml(rawSentence);

    if (targetWord) {
      const escapedWord = targetWord.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const punctBefore = `(?:^|[^\\u0900-\\u097F])`;
      const punctAfter = `(?=[^\\u0900-\\u097F]|$)`;

      const wordRegex = targetWord.trim().length > 1
        ? new RegExp(`(${punctBefore})(${escapedWord}(?:ले|लाई|मा|को|का|की|बाट|देखि|सँग|सित|हरू|हरु)?)(${punctAfter})`, 'g')
        : new RegExp(`(${punctBefore})(${escapedWord})(${punctAfter})`, 'g');

      html = html.replace(wordRegex, '$1<mark class="target-word-mark">$2</mark>');
    }

    if (state.currentComments && state.currentComments.length > 0) {
      state.currentComments.forEach((c, idx) => {
        const escapedSpan = c.span.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const markTag = `<mark class="doc-comment-mark" data-comment-id="${c.id}">${escapeHtml(c.span)}<span class="comment-num-tag">${idx + 1}</span></mark>`;
        html = html.replace(new RegExp(`(?<!<mark[^>]*>)(${escapedSpan})(?![^<]*</mark>)`), markTag);
      });
    }

    el.sentenceContent.innerHTML = html;

    el.sentenceContent.querySelectorAll('.doc-comment-mark').forEach(m => {
      m.addEventListener('click', (e) => {
        e.stopPropagation();
        const cid = m.dataset.commentId;
        highlightCommentCard(cid);
      });
    });
  }

  function renderCommentsList() {
    const deck = el.sentenceCommentsDeck;
    const list = el.sentenceCommentsList;
    const count = el.sentenceCommentsCount;
    if (!deck || !list) return;

    if (!state.currentComments || state.currentComments.length === 0) {
      deck.classList.add('hidden');
      list.innerHTML = '';
      if (count) count.textContent = '0';
      return;
    }

    deck.classList.remove('hidden');
    if (count) count.textContent = state.currentComments.length;
    list.innerHTML = '';

    state.currentComments.forEach((c, idx) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'comment-card-item';
      itemEl.id = `commentCard_${c.id}`;

      itemEl.innerHTML = `
        <div class="comment-card-left">
          <span class="comment-card-span">#${idx + 1} ${escapeHtml(c.span)}</span>
          <span class="comment-card-tag">${escapeHtml(c.tag.split(' ')[0])}</span>
          <span class="comment-card-text">${escapeHtml(c.comment)}</span>
        </div>
        <button type="button" class="comment-card-delete" title="Remove comment" data-id="${c.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      itemEl.querySelector('.comment-card-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteComment(c.id);
      });

      itemEl.addEventListener('mouseenter', () => {
        const mark = el.sentenceContent.querySelector(`.doc-comment-mark[data-comment-id="${c.id}"]`);
        if (mark) mark.classList.add('active-focus');
      });
      itemEl.addEventListener('mouseleave', () => {
        const mark = el.sentenceContent.querySelector(`.doc-comment-mark[data-comment-id="${c.id}"]`);
        if (mark) mark.classList.remove('active-focus');
      });

      list.appendChild(itemEl);
    });
  }

  function deleteComment(commentId) {
    if (!state.currentComments) return;
    state.currentComments = state.currentComments.filter(c => c.id !== commentId);
    renderSentenceWithComments();
    renderCommentsList();
    syncCommentsToNotesInput();
    showToast('Removed in-line comment');
  }

  function highlightCommentCard(commentId) {
    const card = document.getElementById(`commentCard_${commentId}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      card.style.borderColor = '#be185d';
      card.style.background = '#fff1f2';
      setTimeout(() => {
        card.style.borderColor = '';
        card.style.background = '';
      }, 1500);
    }
  }

  function syncCommentsToNotesInput() {
    let generalNote = '';
    const currentVal = el.annotationNotesInput.value;

    if (currentVal.includes('[In-line Comments]:')) {
      const parts = currentVal.split('[In-line Comments]:');
      generalNote = parts[0].trim();
    } else {
      generalNote = currentVal.trim();
    }

    let result = generalNote;
    if (state.currentComments && state.currentComments.length > 0) {
      const commentsLines = state.currentComments.map(c => `• "${c.span}" (${c.tag}): ${c.comment}`).join('\n');
      result = (generalNote ? generalNote + '\n\n' : '') + `[In-line Comments]:\n${commentsLines}`;
    }

    el.annotationNotesInput.value = result;
    updateFeedbackDeck(result, true);
  }

  function parseCommentsFromNotes(notesStr) {
    state.currentComments = [];
    if (!notesStr || !notesStr.includes('[In-line Comments]:')) {
      return;
    }
    try {
      const section = notesStr.split('[In-line Comments]:')[1];
      const lines = section.trim().split('\n');
      lines.forEach((line, idx) => {
        const match = line.match(/^•\s*"([^"]+)"\s*\(([^)]+)\):\s*(.+)$/);
        if (match) {
          state.currentComments.push({
            id: 'c_' + idx,
            span: match[1],
            tag: match[2],
            comment: match[3],
            timestamp: ''
          });
        }
      });
    } catch (e) {
      console.warn('Error parsing comments from notes:', e);
    }
  }

  // -------------------------------------------------------------------
  // Side-by-Side Defect Studio & Training Pipeline Inspector Module
  // -------------------------------------------------------------------
  const studioState = {
    allRawSamples: [],
    samples: [],
    filtered: [],
    selectedItem: null,
    selectedIndex: 0,
    category: 'all',
    token: 'all',
    annotator: 'all',
    query: '',
    speed: 1.0,
    isPlaying: false,
    autoSyncTimer: null
  };

  function isSupervisorUser() {
    if (!state.activeAnnotator) return true; // Default to supervisor view if not explicitly logged in as single annotator
    const email = (state.activeAnnotator.email || '').trim().toLowerCase();
    return email === 'firoj.paudel@wiseyak.com';
  }

  function formatStudioTime(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const diffSec = Math.floor((now - d) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  const categoryHumanMap = {
    all: 'All Categories',
    consonant_cluster_coarticulation: 'Consonant Cluster Co-articulation',
    case_marker_boundary_prosody: 'Case Marker Boundary Prosody',
    nasalization_chandrabindu_loss: 'Nasalization / Chandrabindu Loss',
    negative_prefix_prosody_stress: 'Negative Prefix Prosody / Stress',
    lexical_pronunciation_defect: 'Lexical Pronunciation Defect',
    phoneme_articulation_error: 'Phoneme Articulation Error',
    verbal_inflection_cadence: 'Verbal Inflection Cadence',
    reduplicated_adverb_rhythm: 'Reduplicated Adverb Rhythm'
  };

  const categoryDiagnosisMap = {
    consonant_cluster_coarticulation: {
      diagnosis: 'Consonant conjunct (संयुक्ताक्षर) phonemes are blurring or suffering from artificial schwa-insertion between plosives and fricatives.',
      actions: [
        'Enforce explicit conjunct phonetic transcription rules in G2P lexicon (e.g. cluster representation for ष्ट, प्र, ञ्च, क्क).',
        'Increase sample weighting for complex Devanagari conjuncts in HiFi-GAN acoustic model training.',
        'Review duration model predictions on stop-fricative transitions.'
      ]
    },
    case_marker_boundary_prosody: {
      diagnosis: 'Agglutinated case markers and postpositions (-को, -का, -की, -मा, -ले, -लाई) exhibit unnatural vowel lengthening or artificial pauses at the stem-affix boundary.',
      actions: [
        'Fine-tune phoneme duration predictor with boundary tags (# or |) for agglutinative case markers.',
        'Adjust F0 / pitch contour prediction to avoid unnatural rise before suffix attachments.',
        'Verify syllable tokenization does not treat case suffixes as separate prosodic words.'
      ]
    },
    nasalization_chandrabindu_loss: {
      diagnosis: 'Chandrabindu (ँ) nasal vowel formant resonance is dropped or mispronounced as oral vowel or harsh velar nasal.',
      actions: [
        'Map Chandrabindu explicitly to nasalized vowel phonemes (e.g. /a~/ /aa~/) in pronunciation dictionary.',
        'Fine-tune acoustic spectrogram generation to maintain spectral energy in 2.5–3.5 kHz nasal resonance bands.',
        'Add nasalized minimal pairs to model validation loss calculation.'
      ]
    },
    negative_prefix_prosody_stress: {
      diagnosis: 'Lexical stress is mistakenly placed on the negative prefix (न-) rather than the root verb, breaking natural Nepali rhythmic cadence.',
      actions: [
        'Add morphological stress rule: shift primary stress from negative prefix न- to the initial syllable of root verb.',
        'Fine-tune duration model on prefixed verbs (नदिन, नडराई, नपाएको) to shorten prefix vowel duration.',
        'Review pitch contour to ensure high-tone anchor sits on verb root.'
      ]
    },
    lexical_pronunciation_defect: {
      diagnosis: 'Word-level pronunciation divergence or ambiguous polysemic reading leading to unnatural speech output.',
      actions: [
        'Update phonetic pronunciation lexicon with context-dependent phoneme override.',
        'Add synthetic audio samples with target pronunciation to acoustic training pipeline.',
        'Review G2P fallback rules for out-of-vocabulary and polysemous entries.'
      ]
    }
  };

  async function loadDefectStudioData(showToastMsg = false) {
    const syncBtn = el.refreshDefectsStudioBtn;
    if (syncBtn) syncBtn.classList.add('is-syncing');

    try {
      const resp = await fetch(`/static/training_pipeline_defects.json?t=${Date.now()}`);
      if (!resp.ok) throw new Error('Failed to fetch defect dataset');
      const data = await resp.json();
      studioState.allRawSamples = data.samples || [];

      const supervisor = isSupervisorUser();

      if (supervisor) {
        // Supervisor view (firoj.paudel@wiseyak.com): see all annotators and filter by annotator
        studioState.samples = studioState.allRawSamples;
        if (el.defectAnnotatorSection) el.defectAnnotatorSection.style.display = '';

        // Dynamically build annotator filter chips
        if (el.defectAnnotatorChips) {
          const annList = (data.metadata && data.metadata.annotators) || [];
          let chipsHtml = `<button class="def-chip ann-chip ${studioState.annotator === 'all' ? 'active' : ''}" data-annotator="all">All Annotators (${studioState.allRawSamples.length})</button>`;
          annList.forEach(a => {
            const count = a.defect_count || studioState.allRawSamples.filter(s => s.annotator_id === a.annotator_id).length;
            const isAct = studioState.annotator === a.annotator_id;
            chipsHtml += `<button class="def-chip ann-chip ${isAct ? 'active' : ''}" data-annotator="${a.annotator_id}">${escapeHtml(a.name || a.annotator_id)} (${count})</button>`;
          });
          el.defectAnnotatorChips.innerHTML = chipsHtml;

          el.defectAnnotatorChips.querySelectorAll('.ann-chip').forEach(chip => {
            chip.addEventListener('click', () => {
              el.defectAnnotatorChips.querySelectorAll('.ann-chip').forEach(c => c.classList.remove('active'));
              chip.classList.add('active');
              studioState.annotator = chip.dataset.annotator;
              applyStudioFilters();
            });
          });
        }

        if (el.defectStudioSubtitle) {
          const annName = studioState.annotator === 'all'
            ? 'all annotators'
            : (studioState.allRawSamples.find(s => s.annotator_id === studioState.annotator)?.annotator_name || studioState.annotator);
          el.defectStudioSubtitle.innerHTML = `Supervisor Master View &bull; Live sync across ${escapeHtml(annName)} (<span id="defectStudioTotalCount">${studioState.samples.length}</span> flaws cataloged)`;
        }
      } else {
        // Specific annotator view: only show defects annotated by activeAnnotator
        const myId = state.activeAnnotator?.annotator_id;
        const myEmail = (state.activeAnnotator?.email || '').trim().toLowerCase();

        studioState.samples = studioState.allRawSamples.filter(s => {
          return (myId && s.annotator_id === myId) || (myEmail && (s.annotator_email || '').toLowerCase() === myEmail);
        });

        if (el.defectAnnotatorSection) el.defectAnnotatorSection.style.display = 'none';

        if (el.defectStudioSubtitle) {
          el.defectStudioSubtitle.innerHTML = `Showing flaws evaluated by <strong>${escapeHtml(state.activeAnnotator?.name || 'Annotator')}</strong> (<span id="defectStudioTotalCount">${studioState.samples.length}</span> flaws cataloged)`;
        }
      }

      // Update badge in header and modal count
      if (el.headerDefectBadge) {
        el.headerDefectBadge.textContent = studioState.samples.length;
      }
      if (el.defectStudioTotalCount) {
        el.defectStudioTotalCount.textContent = studioState.samples.length;
      }

      // Update dynamic category chip counts based on current scoped samples
      if (el.defectCategoryChips) {
        const catCounts = {};
        studioState.samples.forEach(s => {
          catCounts[s.defect_category] = (catCounts[s.defect_category] || 0) + 1;
        });

        el.defectCategoryChips.querySelectorAll('.def-chip').forEach(chip => {
          const cat = chip.dataset.category;
          if (cat === 'all') {
            chip.textContent = `All (${studioState.samples.length})`;
          } else {
            const count = catCounts[cat] || 0;
            const shortName = chip.textContent.split('(')[0].trim();
            chip.textContent = `${shortName} (${count})`;
          }
        });
      }

      // Update dynamic top recurrent error token chips based on current scoped samples
      if (el.defectRepetitiveChips) {
        const tokenCounts = {};
        studioState.samples.forEach(s => {
          const tok = s.flagged_token || s.target_word;
          if (tok) tokenCounts[tok] = (tokenCounts[tok] || 0) + 1;
        });
        const sortedTokens = Object.entries(tokenCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        el.defectRepetitiveChips.innerHTML = `<button class="def-chip rep-chip ${studioState.token === 'all' ? 'active' : ''}" data-token="all">Clear Filter</button>`;
        sortedTokens.forEach(([tok, count]) => {
          const btn = document.createElement('button');
          btn.className = `def-chip rep-chip ${studioState.token === tok ? 'active' : ''}`;
          btn.dataset.token = tok;
          btn.textContent = `${tok} (${count}x)`;
          btn.addEventListener('click', () => {
            el.defectRepetitiveChips.querySelectorAll('.rep-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            studioState.token = tok;
            applyStudioFilters();
          });
          el.defectRepetitiveChips.appendChild(btn);
        });

        el.defectRepetitiveChips.querySelector('[data-token="all"]')?.addEventListener('click', (e) => {
          el.defectRepetitiveChips.querySelectorAll('.rep-chip').forEach(c => c.classList.remove('active'));
          e.target.classList.add('active');
          studioState.token = 'all';
          applyStudioFilters();
        });
      }

      applyStudioFilters();

      if (showToastMsg) {
        showToast(`Defect Studio synchronized: ${studioState.filtered.length} defects live!`, 'success');
      }
    } catch (err) {
      console.error('Error loading defect studio data:', err);
      if (el.defectItemsList) {
        el.defectItemsList.innerHTML = `<div class="loading-state" style="color:var(--color-danger)">Failed to load defect dataset. Please ensure static/training_pipeline_defects.json exists.</div>`;
      }
    } finally {
      if (syncBtn) syncBtn.classList.remove('is-syncing');
    }
  }

  function applyStudioFilters() {
    const q = studioState.query.trim().toLowerCase();
    studioState.filtered = studioState.samples.filter(item => {
      // Annotator filter (when supervisor filters by specific annotator)
      if (studioState.annotator !== 'all') {
        if (item.annotator_id !== studioState.annotator) return false;
      }
      // Category match
      if (studioState.category !== 'all' && item.defect_category !== studioState.category) {
        return false;
      }
      // Token match
      if (studioState.token !== 'all') {
        const flag = (item.flagged_token || '').toLowerCase();
        if (!flag.includes(studioState.token.toLowerCase())) {
          return false;
        }
      }
      // Search query
      if (q) {
        const hay = [
          item.flagged_token,
          item.target_word,
          item.sentence_text,
          item.annotator_notes,
          item.annotator_name,
          item.annotator_email,
          item.definition
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    renderStudioSidebarList();

    // Select first item or keep current if present
    if (studioState.filtered.length > 0) {
      const currentId = studioState.selectedItem ? studioState.selectedItem.item_id : null;
      const foundIdx = studioState.filtered.findIndex(x => x.item_id === currentId);
      if (foundIdx >= 0) {
        selectStudioItem(foundIdx);
      } else {
        selectStudioItem(0);
      }
    } else {
      studioState.selectedItem = null;
      renderEmptyInspector();
    }
  }

  function renderStudioSidebarList() {
    if (!el.defectItemsList) return;
    if (studioState.filtered.length === 0) {
      el.defectItemsList.innerHTML = `<div class="loading-state">No matching defect records found.</div>`;
      return;
    }

    el.defectItemsList.innerHTML = '';
    studioState.filtered.forEach((item, idx) => {
      const card = document.createElement('div');
      const isSelected = studioState.selectedItem && studioState.selectedItem.item_id === item.item_id;
      card.className = `defect-item-card ${isSelected ? 'active' : ''}`;
      card.dataset.index = idx;

      const recBadge = (item.token_recurrence_count && item.token_recurrence_count > 1)
        ? `<span class="defect-rec-count-badge">${item.token_recurrence_count}x Repeated</span>`
        : '';

      const catShort = categoryHumanMap[item.defect_category] || item.defect_category;
      const annotatorLabel = item.annotator_name || item.annotator_id || 'Annotator';

      card.innerHTML = `
        <div class="defect-card-header">
          <div class="defect-card-token-wrap">
            <span class="defect-card-token">${escapeHtml(item.flagged_token || item.target_word)}</span>
            ${recBadge}
          </div>
          <span class="defect-card-cat-badge">${escapeHtml(catShort)}</span>
        </div>
        <p class="defect-card-sentence">${escapeHtml(item.sentence_text)}</p>
        <div class="defect-card-submeta">
          <span class="defect-card-annotator-pill" title="Annotated by ${escapeHtml(annotatorLabel)} (${escapeHtml(item.annotator_email || '')})">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            ${escapeHtml(annotatorLabel)}
          </span>
          <span class="defect-card-time">${formatStudioTime(item.annotated_at)}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        selectStudioItem(idx);
      });

      el.defectItemsList.appendChild(card);
    });
  }

  function selectStudioItem(idx) {
    if (!studioState.filtered || idx < 0 || idx >= studioState.filtered.length) return;
    studioState.selectedIndex = idx;
    studioState.selectedItem = studioState.filtered[idx];

    // Highlight card in left list
    if (el.defectItemsList) {
      const cards = el.defectItemsList.querySelectorAll('.defect-item-card');
      cards.forEach((c, i) => {
        if (i === idx) {
          c.classList.add('active');
          c.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          c.classList.remove('active');
        }
      });
    }

    renderStudioInspector(studioState.selectedItem, idx, studioState.filtered.length);
  }

  function renderEmptyInspector() {
    if (!el.defectMainInspector) return;
    el.defectMainInspector.innerHTML = `
      <div class="defect-inspector-empty">
        <p>No defects match the selected filters.</p>
      </div>
    `;
  }

  function highlightSentence(sentence, targetWord, flaggedToken) {
    if (!sentence) return '';
    let result = escapeHtml(sentence);

    // If flagged token is in sentence, highlight it in red
    if (flaggedToken && flaggedToken.trim()) {
      const cleanToken = flaggedToken.trim().split(/\s+/)[0]; // take first word if note had extra text
      if (cleanToken && result.includes(cleanToken)) {
        const regex = new RegExp(`(${cleanToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
        result = result.replace(regex, `<span class="highlight-defect-token">$1</span>`);
      }
    }

    // If target word is in sentence and not already inside a highlight tag
    if (targetWord && targetWord.trim() && result.includes(targetWord.trim())) {
      const cleanWord = targetWord.trim();
      const regex = new RegExp(`(?<!<span[^>]*>)(${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![^<]*</span>)`, 'g');
      result = result.replace(regex, `<span class="highlight-target-word">$1</span>`);
    }

    return result;
  }

  function renderStudioInspector(item, index, total) {
    if (!el.defectMainInspector) return;

    // Reset studio audio
    if (el.studioAudioPlayer) {
      el.studioAudioPlayer.pause();
      el.studioAudioPlayer.src = item.audio_url || (`/api/audio/${item.item_id}`);
      el.studioAudioPlayer.currentTime = 0;
      studioState.isPlaying = false;
    }

    const catName = categoryHumanMap[item.defect_category] || item.defect_category;
    const diagInfo = categoryDiagnosisMap[item.defect_category] || {
      diagnosis: 'Phonetic or prosodic synthesis defect identified during human polysemous evaluation.',
      actions: [
        'Add target word and context to acoustic training dataset fine-tuning split.',
        'Verify G2P phoneme breakdown against gold-standard Devanagari dictionary.'
      ]
    };

    const actionListHtml = diagInfo.actions.map(act => `<li>${escapeHtml(act)}</li>`).join('');
    const highlightedSentence = highlightSentence(item.sentence_text, item.target_word, item.flagged_token);

    const recBadge = (item.token_recurrence_count && item.token_recurrence_count > 1)
      ? `<span class="tag-pill-rec">${item.token_recurrence_count}x Repeated Flaw</span>`
      : '';

    el.defectMainInspector.innerHTML = `
      <!-- Hero Card -->
      <div class="inspector-hero-card">
        <div class="inspector-hero-meta">
          <span class="inspector-eyebrow">Phonetic Flaw Evaluation</span>
          <div class="inspector-title-row">
            <h2 class="inspector-flawed-token">${escapeHtml(item.flagged_token || item.target_word)}</h2>
            <span class="inspector-target-word-hint">in target word: <span>${escapeHtml(item.target_word)}</span></span>
          </div>
        </div>
        <div class="inspector-hero-tags">
          <span class="tag-pill-high">Severity: ${escapeHtml(item.severity || 'High')}</span>
          ${recBadge}
          <span class="tag-pill-cat">${escapeHtml(catName)}</span>
        </div>
      </div>

      <!-- Studio Audio Console -->
      <div class="studio-audio-console">
        <button type="button" class="studio-play-btn" id="studioPlayBtn" title="Play / Pause Audio (Space)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" id="studioPlayIcon">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" id="studioPauseIcon" style="display:none;">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        </button>

        <div class="studio-scrub-wrap">
          <div class="studio-scrub-track" id="studioScrubTrack">
            <div class="studio-scrub-fill" id="studioScrubFill"></div>
          </div>
          <div class="studio-time-row">
            <span id="studioCurrentTime">0:00</span>
            <span id="studioDuration">--:--</span>
          </div>
        </div>

        <div class="studio-audio-speed-controls">
          <button type="button" class="studio-speed-btn" data-speed="0.75" title="Slow Motion (Phonetic Analysis)">0.75x</button>
          <button type="button" class="studio-speed-btn active" data-speed="1.0" title="Normal Speed">1.0x</button>
        </div>
      </div>

      <!-- Side-by-Side Split Grid -->
      <div class="inspector-split-grid">
        <!-- Left Column: Sentence Context & Definition -->
        <div class="inspector-card">
          <div class="inspector-card-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <h4 class="inspector-card-title">Test Sentence &amp; Context</h4>
          </div>

          <div class="inspector-sentence-box">
            ${highlightedSentence}
          </div>

          <div class="inspector-meta-row">
            <span class="inspector-meta-label">Target Word &amp; Part of Speech</span>
            <span class="inspector-meta-val">${escapeHtml(item.target_word)} &bull; ${escapeHtml(item.pos || 'Unknown')}</span>
          </div>

          <div class="inspector-meta-row">
            <span class="inspector-meta-label">Target Semantic Definition / Sense</span>
            <p class="inspector-meta-val devanagari">${escapeHtml(item.definition || 'No definition available')}</p>
          </div>

          <div class="inspector-meta-row">
            <span class="inspector-meta-label">Audio Sample File</span>
            <span class="inspector-meta-val" style="font-family:monospace;font-size:12px;">${escapeHtml(item.audio_filename || (item.item_id + '.wav'))}</span>
          </div>
        </div>

        <!-- Right Column: Evaluator Finding & Training Pipeline Action -->
        <div class="inspector-card">
          <div class="inspector-card-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <h4 class="inspector-card-title">Evaluator Finding &amp; Pipeline Action</h4>
          </div>

          <div class="feedback-box-raw">
            <div class="feedback-annotator-row">
              <span class="feedback-box-label">Evaluator Finding</span>
              <span class="feedback-annotator-badge" title="${escapeHtml(item.annotator_email || '')}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <strong>${escapeHtml(item.annotator_name || item.annotator_id)}</strong>
                ${item.annotator_email ? `<span class="ann-email">(${escapeHtml(item.annotator_email)})</span>` : ''}
              </span>
            </div>
            <p class="feedback-box-text devanagari">${escapeHtml(item.annotator_notes || 'Marked as thumbs down defect')}</p>
          </div>

          <div class="pipeline-action-box">
            <span class="pipeline-action-heading">Linguistic Root Cause</span>
            <p class="pipeline-action-desc">${escapeHtml(diagInfo.diagnosis)}</p>

            <span class="pipeline-action-heading" style="margin-top:6px;">Training Pipeline Fix Requirements</span>
            <ul class="pipeline-action-points">
              ${actionListHtml}
            </ul>
          </div>
        </div>
      </div>

      <!-- Navigation & Action Footer -->
      <div class="inspector-footer-bar">
        <div class="inspector-stepper">
          <button type="button" class="studio-nav-btn" id="studioPrevBtn" ${index === 0 ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Previous Defect</span>
          </button>
          <span class="studio-seq-text">Defect ${index + 1} of ${total}</span>
          <button type="button" class="studio-nav-btn" id="studioNextBtn" ${index >= total - 1 ? 'disabled' : ''}>
            <span>Next Defect</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <a href="/static/training_pipeline_defects.json" download="training_pipeline_defects.json" class="studio-nav-btn" style="text-decoration:none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Download JSON Pipeline Dataset</span>
        </a>
      </div>
    `;

    bindStudioInspectorEvents();
  }

  function bindStudioInspectorEvents() {
    const playBtn = document.getElementById('studioPlayBtn');
    const scrubTrack = document.getElementById('studioScrubTrack');
    const prevBtn = document.getElementById('studioPrevBtn');
    const nextBtn = document.getElementById('studioNextBtn');
    const speedBtns = document.querySelectorAll('.studio-speed-btn');

    if (playBtn) {
      playBtn.addEventListener('click', toggleStudioAudio);
    }

    if (scrubTrack) {
      scrubTrack.addEventListener('click', (e) => {
        if (!el.studioAudioPlayer || !el.studioAudioPlayer.duration) return;
        const rect = scrubTrack.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        el.studioAudioPlayer.currentTime = pos * el.studioAudioPlayer.duration;
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => navigateDefectStudio(-1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => navigateDefectStudio(1));
    }

    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const spd = parseFloat(btn.dataset.speed) || 1.0;
        studioState.speed = spd;
        if (el.studioAudioPlayer) {
          el.studioAudioPlayer.playbackRate = spd;
        }
      });
    });
  }

  function toggleStudioAudio() {
    if (!el.studioAudioPlayer) return;
    if (el.studioAudioPlayer.paused) {
      // Pause main player if it's playing
      if (el.globalAudio && !el.globalAudio.paused) {
        el.globalAudio.pause();
      }
      el.studioAudioPlayer.playbackRate = studioState.speed;
      el.studioAudioPlayer.play().catch(e => console.log('Audio playback prevented:', e));
    } else {
      el.studioAudioPlayer.pause();
    }
  }

  function navigateDefectStudio(direction) {
    const nextIdx = studioState.selectedIndex + direction;
    if (nextIdx >= 0 && nextIdx < studioState.filtered.length) {
      selectStudioItem(nextIdx);
    }
  }

  function openDefectStudio() {
    if (el.globalAudio && !el.globalAudio.paused) {
      el.globalAudio.pause();
    }
    if (el.refAudio && !el.refAudio.paused) {
      el.refAudio.pause();
    }
    if (el.defectStudioModal) {
      el.defectStudioModal.classList.remove('hidden');
    }
    // Always fetch live dataset with cache-busting timestamp on open
    loadDefectStudioData();

    // Real-time synchronization polling while Defect Studio is open
    if (studioState.autoSyncTimer) clearInterval(studioState.autoSyncTimer);
    studioState.autoSyncTimer = setInterval(() => {
      if (el.defectStudioModal && !el.defectStudioModal.classList.contains('hidden')) {
        loadDefectStudioData(false);
      }
    }, 6000);
  }

  function closeDefectStudio() {
    if (el.studioAudioPlayer) {
      el.studioAudioPlayer.pause();
    }
    if (studioState.autoSyncTimer) {
      clearInterval(studioState.autoSyncTimer);
      studioState.autoSyncTimer = null;
    }
    if (el.defectStudioModal) {
      el.defectStudioModal.classList.add('hidden');
    }
  }

  function setupDefectStudio() {
    if (el.openDefectStudioBtn) {
      el.openDefectStudioBtn.addEventListener('click', openDefectStudio);
    }
    if (el.closeDefectStudioBtn) {
      el.closeDefectStudioBtn.addEventListener('click', closeDefectStudio);
    }
    if (el.refreshDefectsStudioBtn) {
      el.refreshDefectsStudioBtn.addEventListener('click', () => loadDefectStudioData(true));
    }
    if (el.defectStudioModal) {
      el.defectStudioModal.addEventListener('click', (e) => {
        if (e.target === el.defectStudioModal) {
          closeDefectStudio();
        }
      });
    }

    // Initial background load to populate dynamic badges & chip numbers
    loadDefectStudioData();

    // Search filter
    if (el.defectSearchInput) {
      el.defectSearchInput.addEventListener('input', (e) => {
        studioState.query = e.target.value;
        applyStudioFilters();
      });
    }

    // Category chips
    if (el.defectCategoryChips) {
      el.defectCategoryChips.querySelectorAll('.def-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          el.defectCategoryChips.querySelectorAll('.def-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          studioState.category = chip.dataset.category || 'all';
          applyStudioFilters();
        });
      });
    }

    // Repetitive token chips
    if (el.defectRepetitiveChips) {
      el.defectRepetitiveChips.querySelectorAll('.rep-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          el.defectRepetitiveChips.querySelectorAll('.rep-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          studioState.token = chip.dataset.token || 'all';
          applyStudioFilters();
        });
      });
    }

    // Audio player time updates
    if (el.studioAudioPlayer) {
      el.studioAudioPlayer.addEventListener('play', () => {
        const playIcon = document.getElementById('studioPlayIcon');
        const pauseIcon = document.getElementById('studioPauseIcon');
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'block';
      });

      el.studioAudioPlayer.addEventListener('pause', () => {
        const playIcon = document.getElementById('studioPlayIcon');
        const pauseIcon = document.getElementById('studioPauseIcon');
        if (playIcon) playIcon.style.display = 'block';
        if (pauseIcon) pauseIcon.style.display = 'none';
      });

      el.studioAudioPlayer.addEventListener('timeupdate', () => {
        const cur = el.studioAudioPlayer.currentTime;
        const dur = el.studioAudioPlayer.duration;
        const curEl = document.getElementById('studioCurrentTime');
        const fillEl = document.getElementById('studioScrubFill');
        if (curEl) curEl.textContent = formatTime(cur);
        if (fillEl && dur) {
          fillEl.style.width = `${(cur / dur) * 100}%`;
        }
      });

      el.studioAudioPlayer.addEventListener('loadedmetadata', () => {
        const durEl = document.getElementById('studioDuration');
        if (durEl) durEl.textContent = formatTime(el.studioAudioPlayer.duration);
      });

      el.studioAudioPlayer.addEventListener('ended', () => {
        const playIcon = document.getElementById('studioPlayIcon');
        const pauseIcon = document.getElementById('studioPauseIcon');
        if (playIcon) playIcon.style.display = 'block';
        if (pauseIcon) pauseIcon.style.display = 'none';
        const fillEl = document.getElementById('studioScrubFill');
        if (fillEl) fillEl.style.width = '0%';
      });
    }
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
