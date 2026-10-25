/**
 * Toplu Kırp — Toplu & Çoklu Fotoğraf Kırpma Aracı
 * 
 * 1. Mod: Toplu Fotoğraf Kırpma (Bulk Image Cropper + El ile Seçme Modal Desteği)
 * 2. Mod: Çoklu Serbest Kırpma (Multi-Crop Studio on Single Image)
 * 
 * Tamamen istemci taraflı, modern, performanslı ve güvenli.
 */

(function () {
  'use strict';

  // Renk Paleti (Çoklu serbest kırpma kutuları için)
  const BOX_COLORS = [
    '#4f46e5', // İndigo
    '#059669', // Zümrüt Yeşili
    '#d97706', // Kehribar Sarısı
    '#dc2626', // Kırmızı
    '#0284c7', // Açık Mavi
    '#7c3aed', // Mor
    '#db2777', // Pembe
    '#0d9488'  // Deniz Mavisi
  ];

  // ==========================================================================
  // 1. GENEL UYGULAMA DURUMU (GLOBAL APP STATE)
  // ==========================================================================
  const appState = {
    currentMode: 'bulk', // 'bulk' | 'multi'
    isProcessing: false
  };

  // ==========================================================================
  // 2. MOD 1 DURUMU: TOPLU KIRPMA (BULK CROP STATE)
  // ==========================================================================
  const bulkState = {
    images: [], // { id, file, name, originalW, originalH, img, objectUrl, size, type, customCrop, customFilename }
    settings: {
      ratio: '1:1', // 'free', '1:1', '4:3', '3:2', '16:9', '9:16', '3:4', '2:3', 'custom'
      customW: 1,
      customH: 1,
      position: 'center', // 'center', 'top', 'bottom', 'left', 'right', 'custom'
      posX: 50,
      posY: 50,
      scale: 100,
      format: 'original', // 'original', 'jpeg', 'png', 'webp'
      quality: 90,
      maxWidth: 0,
      namingPattern: 'original', // 'original' | 'suffix' | 'custom'
      customPrefix: 'kirpilmis'
    }
  };

  // ==========================================================================
  // 3. MOD 2 DURUMU: ÇOKLU SERBEST KIRPMA (MULTI-CROP STUDIO STATE)
  // ==========================================================================
  const multiState = {
    image: null, // { file, name, objectUrl, img, naturalWidth, naturalHeight }
    cropBoxes: [], // [ { id, x, y, width, height, color, customName } ]
    selectedId: null,
    zoom: 1.0,
    history: {
      stack: [],
      index: -1
    },
    interaction: {
      mode: null, // null | 'drawing' | 'moving' | 'resizing'
      pointerId: null,
      startNatural: { x: 0, y: 0 },
      startBox: null,
      handle: null
    },
    settings: {
      format: 'png', // 'png', 'jpeg', 'webp'
      quality: 90,
      prefix: 'kirpim'
    }
  };

  // ==========================================================================
  // 4. EL İLE KIRPMA MODAL DURUMU (MANUAL CROP MODAL STATE)
  // ==========================================================================
  const modalState = {
    isOpen: false,
    targetImg: null, // Hangi görsele ait olduğu
    box: { x: 0, y: 0, width: 100, height: 100 },
    ratio: 'free', // 'free', '1:1', '4:3', '16:9', '9:16'
    interaction: {
      mode: null, // 'drawing' | 'moving' | 'resizing'
      pointerId: null,
      startNatural: { x: 0, y: 0 },
      startBox: null,
      handle: null
    }
  };

  // ==========================================================================
  // DOM ELEMENTLERİ
  // ==========================================================================
  const DOM = {
    // Mod Sekmeleri
    tabBulkCrop: document.getElementById('tabBulkCrop'),
    tabMultiCrop: document.getElementById('tabMultiCrop'),
    bulkCropView: document.getElementById('bulkCropView'),
    multiCropView: document.getElementById('multiCropView'),
    globalNotice: document.getElementById('globalNotice'),
    toastContainer: document.getElementById('toastContainer'),

    // Toplu Kırpma DOM
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('fileInput'),
    browseBtn: document.getElementById('browseBtn'),
    ratioOptions: document.getElementById('ratioOptions'),
    ratioHint: document.getElementById('ratioHint'),
    customRatioRow: document.getElementById('customRatioRow'),
    customRatioW: document.getElementById('customRatioW'),
    customRatioH: document.getElementById('customRatioH'),
    btnOpenManualCropMaster: document.getElementById('btnOpenManualCropMaster'),
    posPresets: document.getElementById('posPresets'),
    posHint: document.getElementById('posHint'),
    sliderPosX: document.getElementById('sliderPosX'),
    valPosX: document.getElementById('valPosX'),
    sliderPosY: document.getElementById('sliderPosY'),
    valPosY: document.getElementById('valPosY'),
    sliderScale: document.getElementById('sliderScale'),
    valScale: document.getElementById('valScale'),
    formatSelect: document.getElementById('formatSelect'),
    bulkNamePatternSelect: document.getElementById('bulkNamePatternSelect'),
    bulkCustomNameInput: document.getElementById('bulkCustomNameInput'),
    qualityRow: document.getElementById('qualityRow'),
    sliderQuality: document.getElementById('sliderQuality'),
    valQuality: document.getElementById('valQuality'),
    maxWidthInput: document.getElementById('maxWidthInput'),
    imageCountBadge: document.getElementById('imageCountBadge'),
    imageCountText: document.getElementById('imageCountText'),
    summarySubtext: document.getElementById('summarySubtext'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    processZipBtn: document.getElementById('processZipBtn'),
    btnProcessText: document.getElementById('btnProcessText'),
    progressCard: document.getElementById('progressCard'),
    progressStatus: document.getElementById('progressStatus'),
    progressPercent: document.getElementById('progressPercent'),
    progressBarFill: document.getElementById('progressBarFill'),
    emptyState: document.getElementById('emptyState'),
    imageGrid: document.getElementById('imageGrid'),

    // Çoklu Serbest Kırpma DOM
    mcUploadSection: document.getElementById('mcUploadSection'),
    mcDropzone: document.getElementById('mcDropzone'),
    mcFileInput: document.getElementById('mcFileInput'),
    mcBrowseBtn: document.getElementById('mcBrowseBtn'),
    mcWorkspaceSection: document.getElementById('mcWorkspaceSection'),
    mcChangeImgBtn: document.getElementById('mcChangeImgBtn'),
    mcUndoBtn: document.getElementById('mcUndoBtn'),
    mcRedoBtn: document.getElementById('mcRedoBtn'),
    mcClearAllBtn: document.getElementById('mcClearAllBtn'),
    mcZoomOutBtn: document.getElementById('mcZoomOutBtn'),
    mcZoomLevel: document.getElementById('mcZoomLevel'),
    mcZoomInBtn: document.getElementById('mcZoomInBtn'),
    mcZoomFitBtn: document.getElementById('mcZoomFitBtn'),
    mcSelectedBadge: document.getElementById('mcSelectedBadge'),
    mcDuplicateBtn: document.getElementById('mcDuplicateBtn'),
    mcDeleteSelectedBtn: document.getElementById('mcDeleteSelectedBtn'),
    mcViewport: document.getElementById('mcViewport'),
    mcStage: document.getElementById('mcStage'),
    mcImage: document.getElementById('mcImage'),
    mcOverlay: document.getElementById('mcOverlay'),
    mcFilename: document.getElementById('mcFilename'),
    mcDimensions: document.getElementById('mcDimensions'),
    mcCoordStats: document.getElementById('mcCoordStats'),
    mcAreaCountBadge: document.getElementById('mcAreaCountBadge'),
    mcSidebarEmpty: document.getElementById('mcSidebarEmpty'),
    mcAreaList: document.getElementById('mcAreaList'),
    mcExportSummary: document.getElementById('mcExportSummary'),
    mcFormatSelect: document.getElementById('mcFormatSelect'),
    mcFilenamePrefix: document.getElementById('mcFilenamePrefix'),
    mcQualityRow: document.getElementById('mcQualityRow'),
    mcSliderQuality: document.getElementById('mcSliderQuality'),
    mcValQuality: document.getElementById('mcValQuality'),
    mcDownloadSelectedBtn: document.getElementById('mcDownloadSelectedBtn'),
    mcDownloadAllBtn: document.getElementById('mcDownloadAllBtn'),
    mcDownloadZipBtn: document.getElementById('mcDownloadZipBtn'),
    mcBtnZipText: document.getElementById('mcBtnZipText'),
    mcProgressCard: document.getElementById('mcProgressCard'),
    mcProgressStatus: document.getElementById('mcProgressStatus'),
    mcProgressPercent: document.getElementById('mcProgressPercent'),
    mcProgressBarFill: document.getElementById('mcProgressBarFill'),

    // El ile Kırpma Modalı DOM
    manualCropModal: document.getElementById('manualCropModal'),
    mcModalTitle: document.getElementById('mcModalTitle'),
    mcModalSubtitle: document.getElementById('mcModalSubtitle'),
    mcModalCloseBtn: document.getElementById('mcModalCloseBtn'),
    modalRatioOptions: document.getElementById('modalRatioOptions'),
    modalCoordBadge: document.getElementById('modalCoordBadge'),
    modalViewport: document.getElementById('modalViewport'),
    modalStage: document.getElementById('modalStage'),
    modalImg: document.getElementById('modalImg'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalResetBtn: document.getElementById('modalResetBtn'),
    modalCancelBtn: document.getElementById('modalCancelBtn'),
    modalApplyAllBtn: document.getElementById('modalApplyAllBtn'),
    modalApplySingleBtn: document.getElementById('modalApplySingleBtn')
  };

  // ==========================================================================
  // BAŞLATMA (INITIALIZATION)
  // ==========================================================================
  function init() {
    setupModeSwitcher();
    setupBulkCropper();
    setupMultiCropper();
    setupManualCropModal();
    setupGlobalShortcuts();
    checkJSZipAvailability();
  }

  function checkJSZipAvailability() {
    if (typeof window.JSZip === 'undefined') {
      showNotice(
        'Bilgi: JSZip kütüphanesi CDN üzerinden yüklenemedi. Sistem yerleşik ZIP motorunu kullanarak kesintisiz çalışmaya devam edecektir.',
        'info'
      );
    }
  }

  // ==========================================================================
  // MOD GEÇİŞ YÖNETİCİSİ (MODE SWITCHER)
  // ==========================================================================
  function setupModeSwitcher() {
    DOM.tabBulkCrop.addEventListener('click', () => switchMode('bulk'));
    DOM.tabMultiCrop.addEventListener('click', () => switchMode('multi'));
  }

  function switchMode(mode) {
    if (appState.currentMode === mode || appState.isProcessing) return;

    appState.currentMode = mode;

    if (mode === 'bulk') {
      DOM.tabBulkCrop.classList.add('active');
      DOM.tabMultiCrop.classList.remove('active');
      DOM.bulkCropView.classList.remove('hidden');
      DOM.multiCropView.classList.add('hidden');
    } else {
      DOM.tabMultiCrop.classList.add('active');
      DOM.tabBulkCrop.classList.remove('active');
      DOM.multiCropView.classList.remove('hidden');
      DOM.bulkCropView.classList.add('hidden');

      if (multiState.image) {
        requestAnimationFrame(() => {
          mcFitToScreen();
          mcRenderAllBoxes();
        });
      }
    }
  }

  // ==========================================================================
  // KLAVYE KISAYOLLARI (GLOBAL SHORTCUTS)
  // ==========================================================================
  function setupGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      // Modal açıkken ESC ile kapat
      if (modalState.isOpen && e.key === 'Escape') {
        closeManualCropModal();
        return;
      }

      if (appState.currentMode === 'multi' && multiState.image) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault();
          mcUndo();
        } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
          e.preventDefault();
          mcRedo();
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && multiState.selectedId) {
          e.preventDefault();
          mcDeleteSelectedBox();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && multiState.selectedId) {
          e.preventDefault();
          mcDuplicateSelectedBox();
        }
      }
    });
  }

  // ==========================================================================
  // ==========================================================================
  // BÖLÜM 1: TOPLU FOTOĞRAF KIRPMA (MOD 1 MANTIĞI)
  // ==========================================================================
  // ==========================================================================

  function setupBulkCropper() {
    // Sürükle ve Bırak
    ['dragenter', 'dragover'].forEach(name => {
      DOM.dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      DOM.dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.dropzone.classList.remove('dragover');
      });
    });

    DOM.dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        bulkHandleFiles(files);
      }
    });

    DOM.dropzone.addEventListener('click', (e) => {
      if (!appState.isProcessing && e.target !== DOM.fileInput) {
        DOM.fileInput.click();
      }
    });

    DOM.fileInput.addEventListener('click', e => e.stopPropagation());

    DOM.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        bulkHandleFiles(e.target.files);
        DOM.fileInput.value = '';
      }
    });

    // En-Boy Oranı Butonları
    DOM.ratioOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-pill');
      if (!btn) return;

      DOM.ratioOptions.querySelectorAll('.btn-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const ratio = btn.dataset.ratio;
      bulkState.settings.ratio = ratio;

      if (ratio === 'custom') {
        DOM.customRatioRow.classList.remove('hidden');
        bulkState.settings.customW = Math.max(1, parseFloat(DOM.customRatioW.value) || 1);
        bulkState.settings.customH = Math.max(1, parseFloat(DOM.customRatioH.value) || 1);
        DOM.ratioHint.textContent = `Özel (${bulkState.settings.customW}:${bulkState.settings.customH})`;
      } else {
        DOM.customRatioRow.classList.add('hidden');
        DOM.ratioHint.textContent = btn.textContent;
      }

      bulkOnSettingsChanged();
    });

    [DOM.customRatioW, DOM.customRatioH].forEach(input => {
      input.addEventListener('input', () => {
        bulkState.settings.customW = Math.max(1, parseFloat(DOM.customRatioW.value) || 1);
        bulkState.settings.customH = Math.max(1, parseFloat(DOM.customRatioH.value) || 1);
        DOM.ratioHint.textContent = `Özel (${bulkState.settings.customW}:${bulkState.settings.customH})`;
        bulkOnSettingsChanged();
      });
    });

    // Görsel Üzerinde El ile Seçme Butonu (Master)
    DOM.btnOpenManualCropMaster.addEventListener('click', () => {
      if (bulkState.images.length === 0) {
        showToast('El ile kırpma yapabilmek için lütfen önce en az bir fotoğraf yükleyin.', 'warning');
        return;
      }
      openManualCropModal(bulkState.images[0]);
    });

    // Konum Önayarları
    DOM.posPresets.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-pos');
      if (!btn) return;

      DOM.posPresets.querySelectorAll('.btn-pos').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const pos = btn.dataset.pos;
      bulkState.settings.position = pos;

      switch (pos) {
        case 'center': bulkState.settings.posX = 50; bulkState.settings.posY = 50; break;
        case 'top': bulkState.settings.posX = 50; bulkState.settings.posY = 0; break;
        case 'bottom': bulkState.settings.posX = 50; bulkState.settings.posY = 100; break;
        case 'left': bulkState.settings.posX = 0; bulkState.settings.posY = 50; break;
        case 'right': bulkState.settings.posX = 100; bulkState.settings.posY = 50; break;
      }

      DOM.sliderPosX.value = bulkState.settings.posX;
      DOM.sliderPosY.value = bulkState.settings.posY;
      DOM.valPosX.textContent = `${bulkState.settings.posX}%`;
      DOM.valPosY.textContent = `${bulkState.settings.posY}%`;
      DOM.posHint.textContent = `X: ${bulkState.settings.posX}% / Y: ${bulkState.settings.posY}%`;
      bulkOnSettingsChanged();
    });

    DOM.sliderPosX.addEventListener('input', (e) => {
      bulkState.settings.posX = parseInt(e.target.value, 10);
      DOM.valPosX.textContent = `${bulkState.settings.posX}%`;
      DOM.posPresets.querySelectorAll('.btn-pos').forEach(b => b.classList.remove('active'));
      DOM.posHint.textContent = `X: ${bulkState.settings.posX}% / Y: ${bulkState.settings.posY}%`;
      bulkOnSettingsChanged();
    });

    DOM.sliderPosY.addEventListener('input', (e) => {
      bulkState.settings.posY = parseInt(e.target.value, 10);
      DOM.valPosY.textContent = `${bulkState.settings.posY}%`;
      DOM.posPresets.querySelectorAll('.btn-pos').forEach(b => b.classList.remove('active'));
      DOM.posHint.textContent = `X: ${bulkState.settings.posX}% / Y: ${bulkState.settings.posY}%`;
      bulkOnSettingsChanged();
    });

    DOM.sliderScale.addEventListener('input', (e) => {
      bulkState.settings.scale = parseInt(e.target.value, 10);
      DOM.valScale.textContent = `${bulkState.settings.scale}%`;
      bulkOnSettingsChanged();
    });

    DOM.formatSelect.addEventListener('change', (e) => {
      bulkState.settings.format = e.target.value;
      if (e.target.value === 'jpeg' || e.target.value === 'webp' || e.target.value === 'original') {
        DOM.qualityRow.classList.remove('hidden');
      } else {
        DOM.qualityRow.classList.add('hidden');
      }
      bulkOnSettingsChanged();
    });

    // Dosya Adlandırma Şablonu
    DOM.bulkNamePatternSelect.addEventListener('change', (e) => {
      bulkState.settings.namingPattern = e.target.value;
      if (e.target.value === 'custom') {
        DOM.bulkCustomNameInput.classList.remove('hidden');
      } else {
        DOM.bulkCustomNameInput.classList.add('hidden');
      }
      bulkRenderAllCards();
    });

    DOM.bulkCustomNameInput.addEventListener('input', (e) => {
      bulkState.settings.customPrefix = e.target.value.trim() || 'gorsel';
      bulkRenderAllCards();
    });

    DOM.sliderQuality.addEventListener('input', (e) => {
      bulkState.settings.quality = parseInt(e.target.value, 10);
      DOM.valQuality.textContent = `%${bulkState.settings.quality}`;
      bulkOnSettingsChanged();
    });

    DOM.maxWidthInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      bulkState.settings.maxWidth = val > 0 ? val : 0;
      bulkOnSettingsChanged();
    });

    DOM.clearAllBtn.addEventListener('click', bulkClearAllImages);
    DOM.processZipBtn.addEventListener('click', bulkProcessAndDownloadZip);
  }

  let bulkDebounce = null;
  function bulkOnSettingsChanged() {
    if (bulkState.images.length === 0) return;
    if (bulkDebounce) clearTimeout(bulkDebounce);
    bulkDebounce = setTimeout(() => {
      const cards = DOM.imageGrid.querySelectorAll('.image-card');
      cards.forEach((card) => {
        const id = card.dataset.id;
        const imgData = bulkState.images.find(item => item.id === id);
        if (imgData) bulkRenderCardPreview(card, imgData);
      });
    }, 40);
  }

  async function bulkHandleFiles(fileList) {
    const files = Array.from(fileList);
    let addedCount = 0;
    let duplicateCount = 0;
    let unsupportedCount = 0;
    let hasAnimatedGif = false;

    for (const file of files) {
      if (!file.type.startsWith('image/') && !isImageByExt(file.name)) {
        unsupportedCount++;
        continue;
      }
      if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
        hasAnimatedGif = true;
      }
      const fileId = `${file.name}_${file.size}_${file.lastModified}`;
      if (bulkState.images.some(img => img.id === fileId)) {
        duplicateCount++;
        continue;
      }

      try {
        const imgData = await loadSingleImageFile(file, fileId);
        imgData.customCrop = null;
        imgData.customFilename = null;
        bulkState.images.push(imgData);
        addedCount++;
      } catch (err) {
        showToast(`"${file.name}" okunamadı.`, 'error');
      }
    }

    if (hasAnimatedGif) {
      showNotice(
        'Önemli Bilgi: GIF dosyalarının tarayıcı Canvas API ile ilk karesi kırpılarak statik görsel formatında dışa aktarılacaktır.',
        'warning'
      );
    }

    if (addedCount > 0) showToast(`${addedCount} adet görsel başarıyla eklendi.`, 'success');
    if (duplicateCount > 0) showToast(`${duplicateCount} adet yinelenen görsel atlandı.`, 'info');
    if (unsupportedCount > 0) showToast(`${unsupportedCount} adet desteklenmeyen dosya atlandı.`, 'warning');

    bulkUpdateUI();
    bulkRenderAllCards();
  }

  function bulkUpdateUI() {
    const count = bulkState.images.length;
    DOM.imageCountBadge.textContent = count;
    DOM.imageCountText.textContent = 'Görsel Yüklendi';

    if (count === 0) {
      DOM.emptyState.classList.remove('hidden');
      DOM.imageGrid.classList.add('hidden');
      DOM.clearAllBtn.disabled = true;
      DOM.processZipBtn.disabled = true;
      DOM.summarySubtext.textContent = 'Kırpma işlemine başlamak için görsel ekleyin.';
    } else {
      DOM.emptyState.classList.add('hidden');
      DOM.imageGrid.classList.remove('hidden');
      DOM.clearAllBtn.disabled = appState.isProcessing;
      DOM.processZipBtn.disabled = appState.isProcessing;
      DOM.summarySubtext.textContent = `${count} adet görsel kırpmaya ve dışa aktarmaya hazır.`;
    }
  }

  function bulkRenderAllCards() {
    DOM.imageGrid.innerHTML = '';
    bulkState.images.forEach((imgData, index) => {
      const card = document.createElement('div');
      card.className = 'image-card';
      card.dataset.id = imgData.id;

      const outputName = getEffectiveOutputFilename(imgData, index);

      card.innerHTML = `
        <div class="card-preview-area">
          <canvas class="card-preview-canvas"></canvas>
          <div class="card-badges">
            <span class="card-ratio-badge">--</span>
            <span class="card-format-badge">${getEffectiveFormatBadge(imgData.type, bulkState.settings.format)}</span>
            ${imgData.customCrop ? '<span class="card-custom-badge">Özel Kırpma</span>' : ''}
          </div>
        </div>
        <div class="card-body">
          <div class="card-filename-row">
            <span class="card-filename-editable" title="Dosya adını düzenlemek için tıklayın">${escapeHtml(outputName)}</span>
          </div>
          <div class="card-meta-list">
            <div class="card-meta-item">
              <span class="card-meta-label">Orijinal:</span>
              <span class="card-meta-val">${imgData.originalW} × ${imgData.originalH} px</span>
            </div>
            <div class="card-meta-item">
              <span class="card-meta-label">Kırpılmış:</span>
              <span class="card-meta-val highlight card-crop-dims">-- × -- px</span>
            </div>
            <div class="card-meta-item">
              <span class="card-meta-label">Boyut:</span>
              <span class="card-meta-val">${formatFileSize(imgData.size)}</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <button type="button" class="btn-card-action btn-card-manual" title="Bu görseli tuval üzerinde el ile kırp">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg>
            El ile Kırp
          </button>
          <button type="button" class="btn-card-action btn-card-download" title="Yalnızca bu görseli kırp ve indir">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            İndir
          </button>
          <button type="button" class="btn-card-action btn-card-remove" title="Bu görseli listeden kaldır">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            Kaldır
          </button>
        </div>
      `;

      // Dosya Adını Düzenleme (Inline Rename)
      const nameEl = card.querySelector('.card-filename-editable');
      nameEl.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'card-filename-input';
        input.value = imgData.customFilename || outputName;
        nameEl.replaceWith(input);
        input.focus();
        input.select();

        const saveName = () => {
          const val = input.value.trim();
          if (val) {
            imgData.customFilename = val;
          }
          bulkRenderAllCards();
        };

        input.addEventListener('blur', saveName);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') input.blur();
          if (e.key === 'Escape') bulkRenderAllCards();
        });
      });

      // El ile Kırp Butonu
      card.querySelector('.btn-card-manual').addEventListener('click', () => {
        openManualCropModal(imgData);
      });

      // Kaldır Butonu
      card.querySelector('.btn-card-remove').addEventListener('click', () => {
        bulkRemoveImage(imgData.id);
      });

      // Tekil İndir Butonu
      card.querySelector('.btn-card-download').addEventListener('click', () => {
        bulkDownloadSingleImage(imgData, index);
      });

      DOM.imageGrid.appendChild(card);
      bulkRenderCardPreview(card, imgData);
    });
  }

  function bulkRenderCardPreview(card, imgData) {
    const canvas = card.querySelector('.card-preview-canvas');
    if (!canvas) return;

    const crop = calculateBulkCrop(imgData.originalW, imgData.originalH, bulkState.settings, imgData.customCrop);
    const maxDim = 320;
    let previewW = crop.dWidth;
    let previewH = crop.dHeight;

    if (previewW > maxDim || previewH > maxDim) {
      if (previewW > previewH) {
        previewH = Math.round(maxDim * (crop.dHeight / crop.dWidth));
        previewW = maxDim;
      } else {
        previewW = Math.round(maxDim * (crop.dWidth / crop.dHeight));
        previewH = maxDim;
      }
    }

    canvas.width = Math.max(1, previewW);
    canvas.height = Math.max(1, previewH);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const targetFormat = getOutputMimeType(imgData.type, bulkState.settings.format);
    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    try {
      ctx.drawImage(
        imgData.img,
        crop.sx, crop.sy, crop.sWidth, crop.sHeight,
        0, 0, canvas.width, canvas.height
      );
    } catch (e) {}

    const ratioBadge = card.querySelector('.card-ratio-badge');
    const formatBadge = card.querySelector('.card-format-badge');
    const dimsLabel = card.querySelector('.card-crop-dims');

    if (ratioBadge) {
      if (imgData.customCrop) {
        ratioBadge.textContent = 'Özel';
      } else {
        ratioBadge.textContent = bulkState.settings.ratio === 'free' ? 'Serbest' : (bulkState.settings.ratio === 'custom' ? `${bulkState.settings.customW}:${bulkState.settings.customH}` : bulkState.settings.ratio);
      }
    }
    if (formatBadge) {
      formatBadge.textContent = getFormatLabel(targetFormat);
    }
    if (dimsLabel) {
      dimsLabel.textContent = `${crop.dWidth} × ${crop.dHeight} px`;
    }
  }

  /**
   * Toplu kırpma hesaplayıcı: Eğer görselin kendi özel kırpması varsa onu kullanır;
   * yoksa genel toplu ayarları uygular.
   */
  function calculateBulkCrop(origW, origH, settings, customCrop) {
    if (customCrop) {
      let dWidth = customCrop.width;
      let dHeight = customCrop.height;
      if (settings.maxWidth > 0 && dWidth > settings.maxWidth) {
        dWidth = settings.maxWidth;
        dHeight = Math.max(1, Math.round(settings.maxWidth * (customCrop.height / customCrop.width)));
      }
      return {
        sx: customCrop.x,
        sy: customCrop.y,
        sWidth: customCrop.width,
        sHeight: customCrop.height,
        dWidth,
        dHeight
      };
    }

    const origRatio = origW / origH;
    let targetRatio = origRatio;

    if (settings.ratio === 'free') {
      targetRatio = origRatio;
    } else if (settings.ratio === 'custom') {
      targetRatio = (settings.customW || 1) / (settings.customH || 1);
    } else {
      const parts = settings.ratio.split(':');
      if (parts.length === 2) targetRatio = parseFloat(parts[0]) / parseFloat(parts[1]);
    }

    let maxCropW, maxCropH;
    if (targetRatio > origRatio) {
      maxCropW = origW;
      maxCropH = origW / targetRatio;
    } else {
      maxCropH = origH;
      maxCropW = origH * targetRatio;
    }

    const scaleFactor = Math.max(0.3, Math.min(1.0, (settings.scale || 100) / 100));
    const sWidth = Math.max(1, maxCropW * scaleFactor);
    const sHeight = Math.max(1, maxCropH * scaleFactor);

    const maxLeewayX = Math.max(0, origW - sWidth);
    const maxLeewayY = Math.max(0, origH - sHeight);

    let sx = maxLeewayX * (Math.max(0, Math.min(100, settings.posX ?? 50)) / 100);
    let sy = maxLeewayY * (Math.max(0, Math.min(100, settings.posY ?? 50)) / 100);

    sx = Math.max(0, Math.min(origW - sWidth, sx));
    sy = Math.max(0, Math.min(origH - sHeight, sy));

    let dWidth = Math.round(sWidth);
    let dHeight = Math.round(sHeight);

    if (settings.maxWidth > 0 && dWidth > settings.maxWidth) {
      dWidth = settings.maxWidth;
      dHeight = Math.max(1, Math.round(settings.maxWidth / targetRatio));
    }

    return {
      sx: Math.round(sx),
      sy: Math.round(sy),
      sWidth: Math.round(sWidth),
      sHeight: Math.round(sHeight),
      dWidth,
      dHeight
    };
  }

  function getEffectiveOutputFilename(imgData, index) {
    if (imgData.customFilename) return imgData.customFilename;

    const lastDot = imgData.name.lastIndexOf('.');
    const base = lastDot !== -1 ? imgData.name.substring(0, lastDot) : imgData.name;
    const mimeType = getOutputMimeType(imgData.type, bulkState.settings.format);
    const ext = mimeType === 'image/png' ? '.png' : (mimeType === 'image/webp' ? '.webp' : '.jpg');

    const pattern = bulkState.settings.namingPattern;
    if (pattern === 'suffix') {
      return `${base}_kirpilmis${ext}`;
    } else if (pattern === 'custom') {
      const prefix = bulkState.settings.customPrefix || 'kirpilmis';
      return `${prefix}_${pad2(index + 1)}${ext}`;
    }
    return `${base}${ext}`;
  }

  function bulkRemoveImage(id) {
    const idx = bulkState.images.findIndex(i => i.id === id);
    if (idx === -1) return;
    const item = bulkState.images[idx];
    URL.revokeObjectURL(item.objectUrl);
    bulkState.images.splice(idx, 1);

    const card = DOM.imageGrid.querySelector(`.image-card[data-id="${id}"]`);
    if (card) card.remove();
    bulkUpdateUI();
    showToast(`"${item.name}" listeden kaldırıldı.`, 'info');
  }

  function bulkClearAllImages() {
    if (bulkState.images.length === 0) return;
    bulkState.images.forEach(i => URL.revokeObjectURL(i.objectUrl));
    bulkState.images = [];
    DOM.imageGrid.innerHTML = '';
    bulkUpdateUI();
    showToast('Tüm görseller temizlendi.', 'info');
  }

  function generateBulkCroppedBlob(imgData) {
    return new Promise((resolve, reject) => {
      try {
        const crop = calculateBulkCrop(imgData.originalW, imgData.originalH, bulkState.settings, imgData.customCrop);
        const canvas = document.createElement('canvas');
        canvas.width = crop.dWidth;
        canvas.height = crop.dHeight;

        const ctx = canvas.getContext('2d');
        const mimeType = getOutputMimeType(imgData.type, bulkState.settings.format);

        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          imgData.img,
          crop.sx, crop.sy, crop.sWidth, crop.sHeight,
          0, 0, crop.dWidth, crop.dHeight
        );

        const quality = (bulkState.settings.quality || 90) / 100;
        canvas.toBlob((blob) => {
          if (blob) resolve({ blob, mimeType });
          else reject(new Error('Canvas Blob dönüşümü başarısız.'));
        }, mimeType, quality);
      } catch (err) {
        reject(err);
      }
    });
  }

  async function bulkDownloadSingleImage(imgData, index) {
    try {
      showToast(`"${imgData.name}" kırpılıyor...`, 'info');
      const { blob, mimeType } = await generateBulkCroppedBlob(imgData);
      const filename = getEffectiveOutputFilename(imgData, index);
      downloadBlob(blob, filename);
      showToast(`"${filename}" başarıyla indirildi.`, 'success');
    } catch (err) {
      showToast(`"${imgData.name}" kırpılırken hata oluştu.`, 'error');
    }
  }

  async function bulkProcessAndDownloadZip() {
    if (bulkState.images.length === 0 || appState.isProcessing) return;

    appState.isProcessing = true;
    DOM.processZipBtn.disabled = true;
    DOM.clearAllBtn.disabled = true;
    DOM.btnProcessText.textContent = 'İşleniyor...';

    const total = bulkState.images.length;
    let completed = 0;
    const processedFiles = [];
    const usedFilenames = new Set();

    DOM.progressCard.classList.remove('hidden');
    updateProgressUI(DOM.progressBarFill, DOM.progressPercent, DOM.progressStatus, 0, total, 'Görseller hazırlanıyor...');

    try {
      for (let i = 0; i < total; i++) {
        const imgData = bulkState.images[i];
        updateProgressUI(DOM.progressBarFill, DOM.progressPercent, DOM.progressStatus, i, total, `Kırpılıyor (${i + 1} / ${total}): ${imgData.name}`);
        await yieldToMain();

        const { blob, mimeType } = await generateBulkCroppedBlob(imgData);
        const baseName = getEffectiveOutputFilename(imgData, i);
        const uniqueName = getUniqueFilename(baseName, usedFilenames);
        usedFilenames.add(uniqueName);

        processedFiles.push({ name: uniqueName, blob });
        completed++;
        updateProgressUI(DOM.progressBarFill, DOM.progressPercent, DOM.progressStatus, i + 1, total, `${i + 1} / ${total} görsel işlendi`);
      }

      updateProgressUI(DOM.progressBarFill, DOM.progressPercent, DOM.progressStatus, total, total, 'ZIP arşivi paketleniyor...');
      await yieldToMain();

      const zipBlob = await createZipArchive(processedFiles, (pct) => {
        DOM.progressPercent.textContent = `%${pct}`;
        DOM.progressBarFill.style.width = `${pct}%`;
      });

      downloadBlob(zipBlob, 'kirpilmis-gorseller.zip');
      showToast(`${completed} adet görsel başarıyla kırpıldı ve ZIP olarak indirildi!`, 'success');
    } catch (err) {
      showToast(err.message || 'Toplu işlem sırasında hata oluştu.', 'error');
    } finally {
      appState.isProcessing = false;
      DOM.processZipBtn.disabled = false;
      DOM.clearAllBtn.disabled = false;
      DOM.btnProcessText.textContent = 'Tüm Görselleri Kırp ve ZIP İndir';
      setTimeout(() => DOM.progressCard.classList.add('hidden'), 3000);
    }
  }


  // ==========================================================================
  // ==========================================================================
  // BÖLÜM 2: EL İLE KIRPMA DÜZENLEME MODALI (MANUAL CROP MODAL)
  // ==========================================================================
  // ==========================================================================

  let modalBoxEl = null;

  function setupManualCropModal() {
    DOM.mcModalCloseBtn.addEventListener('click', closeManualCropModal);
    DOM.modalCancelBtn.addEventListener('click', closeManualCropModal);

    DOM.manualCropModal.addEventListener('click', (e) => {
      if (e.target === DOM.manualCropModal) closeManualCropModal();
    });

    // Oran Butonları
    DOM.modalRatioOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-pill-sm');
      if (!btn) return;
      DOM.modalRatioOptions.querySelectorAll('.btn-pill-sm').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      modalState.ratio = btn.dataset.ratio;

      if (modalState.ratio !== 'free') {
        applyRatioToModalBox(modalState.ratio);
      }
    });

    // Sıfırla
    DOM.modalResetBtn.addEventListener('click', () => {
      if (!modalState.targetImg) return;
      modalState.targetImg.customCrop = null;
      const initial = calculateBulkCrop(modalState.targetImg.originalW, modalState.targetImg.originalH, bulkState.settings);
      modalState.box = { x: initial.sx, y: initial.sy, width: initial.sWidth, height: initial.sHeight };
      modalRenderBox();
      showToast('Kırpma alanı genel ayarlara sıfırlandı.', 'info');
    });

    // Yalnızca Bu Görsele Uygula
    DOM.modalApplySingleBtn.addEventListener('click', () => {
      if (!modalState.targetImg) return;
      modalState.targetImg.customCrop = { ...modalState.box };
      closeManualCropModal();
      bulkRenderAllCards();
      showToast(`Özel el ile kırpma "${modalState.targetImg.name}" görseline uygulandı!`, 'success');
    });

    // Tüm Görsellere Uygula
    DOM.modalApplyAllBtn.addEventListener('click', () => {
      if (!modalState.targetImg) return;
      const imgW = modalState.targetImg.originalW;
      const imgH = modalState.targetImg.originalH;
      const box = modalState.box;

      // Oranı hesapla
      const boxRatio = box.width / box.height;
      if (modalState.ratio !== 'free') {
        bulkState.settings.ratio = modalState.ratio;
        DOM.ratioOptions.querySelectorAll('.btn-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.ratio === modalState.ratio);
        });
      } else {
        bulkState.settings.ratio = 'custom';
        bulkState.settings.customW = Math.round(box.width);
        bulkState.settings.customH = Math.round(box.height);
        DOM.customRatioW.value = bulkState.settings.customW;
        DOM.customRatioH.value = bulkState.settings.customH;
        DOM.customRatioRow.classList.remove('hidden');
        DOM.ratioOptions.querySelectorAll('.btn-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.ratio === 'custom');
        });
        DOM.ratioHint.textContent = `Özel (${bulkState.settings.customW}:${bulkState.settings.customH})`;
      }

      // Konum yüzdelerini hesapla
      const leewayX = Math.max(1, imgW - box.width);
      const leewayY = Math.max(1, imgH - box.height);
      const posX = Math.round((box.x / leewayX) * 100);
      const posY = Math.round((box.y / leewayY) * 100);

      bulkState.settings.posX = Math.max(0, Math.min(100, posX));
      bulkState.settings.posY = Math.max(0, Math.min(100, posY));
      DOM.sliderPosX.value = bulkState.settings.posX;
      DOM.sliderPosY.value = bulkState.settings.posY;
      DOM.valPosX.textContent = `${bulkState.settings.posX}%`;
      DOM.valPosY.textContent = `${bulkState.settings.posY}%`;
      DOM.posHint.textContent = `X: ${bulkState.settings.posX}% / Y: ${bulkState.settings.posY}%`;

      // Bireysel özel kırpmaları genel ayara çek
      bulkState.images.forEach(i => i.customCrop = null);

      closeManualCropModal();
      bulkRenderAllCards();
      showToast('El ile belirlenen kırpma tüm fotoğraflara uygulandı!', 'success');
    });

    setupModalOverlayInteractions();
  }

  function openManualCropModal(imgData) {
    modalState.targetImg = imgData;
    modalState.isOpen = true;

    DOM.mcModalTitle.textContent = `El ile Kırp — ${imgData.name}`;
    DOM.modalImg.src = imgData.objectUrl;

    DOM.manualCropModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    DOM.modalImg.onload = () => {
      // Eğer özel kırpması varsa onu yükle, yoksa mevcut hesaplanan kırpmayı getir
      if (imgData.customCrop) {
        modalState.box = { ...imgData.customCrop };
      } else {
        const initial = calculateBulkCrop(imgData.originalW, imgData.originalH, bulkState.settings);
        modalState.box = { x: initial.sx, y: initial.sy, width: initial.sWidth, height: initial.sHeight };
      }
      modalRenderBox();
    };
  }

  function closeManualCropModal() {
    modalState.isOpen = false;
    modalState.targetImg = null;
    DOM.manualCropModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function applyRatioToModalBox(ratioStr) {
    if (!modalState.targetImg) return;
    const parts = ratioStr.split(':');
    if (parts.length !== 2) return;
    const targetR = parseFloat(parts[0]) / parseFloat(parts[1]);

    const imgW = modalState.targetImg.originalW;
    const imgH = modalState.targetImg.originalH;

    let newW = modalState.box.width;
    let newH = Math.round(newW / targetR);

    if (newH > imgH) {
      newH = imgH;
      newW = Math.round(newH * targetR);
    }
    if (newW > imgW) {
      newW = imgW;
      newH = Math.round(newW / targetR);
    }

    modalState.box.width = newW;
    modalState.box.height = newH;
    modalState.box.x = Math.max(0, Math.min(imgW - newW, modalState.box.x));
    modalState.box.y = Math.max(0, Math.min(imgH - newH, modalState.box.y));

    modalRenderBox();
  }

  function modalRenderBox() {
    if (!modalState.targetImg) return;
    const imgW = modalState.targetImg.originalW;
    const imgH = modalState.targetImg.originalH;
    const box = modalState.box;

    if (!modalBoxEl) {
      modalBoxEl = document.createElement('div');
      modalBoxEl.className = 'modal-crop-box';
      modalBoxEl.innerHTML = `
        <div class="mc-box-label" id="modalBoxLabel">0 × 0</div>
        <div class="mc-handle handle-nw" data-handle="nw"></div>
        <div class="mc-handle handle-n" data-handle="n"></div>
        <div class="mc-handle handle-ne" data-handle="ne"></div>
        <div class="mc-handle handle-e" data-handle="e"></div>
        <div class="mc-handle handle-se" data-handle="se"></div>
        <div class="mc-handle handle-s" data-handle="s"></div>
        <div class="mc-handle handle-sw" data-handle="sw"></div>
        <div class="mc-handle handle-w" data-handle="w"></div>
      `;
      DOM.modalOverlay.appendChild(modalBoxEl);
    }

    modalBoxEl.style.left = `${(box.x / imgW) * 100}%`;
    modalBoxEl.style.top = `${(box.y / imgH) * 100}%`;
    modalBoxEl.style.width = `${(box.width / imgW) * 100}%`;
    modalBoxEl.style.height = `${(box.height / imgH) * 100}%`;

    const label = modalBoxEl.querySelector('#modalBoxLabel');
    if (label) label.textContent = `${box.width} × ${box.height} px`;

    DOM.modalCoordBadge.textContent = `W: ${box.width} px × H: ${box.height} px (X: ${box.x}, Y: ${box.y})`;
  }

  function setupModalOverlayInteractions() {
    const overlay = DOM.modalOverlay;

    function modalClientToNatural(clientX, clientY) {
      const rect = overlay.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const naturalX = Math.round(normX * modalState.targetImg.originalW);
      const naturalY = Math.round(normY * modalState.targetImg.originalH);
      return { naturalX, naturalY };
    }

    overlay.addEventListener('pointerdown', (e) => {
      if (!modalState.targetImg || e.button !== 0) return;
      const { naturalX, naturalY } = modalClientToNatural(e.clientX, e.clientY);

      if (e.target.classList.contains('mc-handle')) {
        modalState.interaction = {
          mode: 'resizing',
          pointerId: e.pointerId,
          startNatural: { x: naturalX, y: naturalY },
          startBox: { ...modalState.box },
          handle: e.target.dataset.handle
        };
        overlay.setPointerCapture(e.pointerId);
        e.stopPropagation();
        return;
      }

      if (e.target.closest('.modal-crop-box')) {
        modalState.interaction = {
          mode: 'moving',
          pointerId: e.pointerId,
          startNatural: { x: naturalX, y: naturalY },
          startBox: { ...modalState.box }
        };
        overlay.setPointerCapture(e.pointerId);
        e.stopPropagation();
        return;
      }

      // Yeni alan çiz
      modalState.interaction = {
        mode: 'drawing',
        pointerId: e.pointerId,
        startNatural: { x: naturalX, y: naturalY },
        startBox: null
      };
      overlay.setPointerCapture(e.pointerId);
    });

    overlay.addEventListener('pointermove', (e) => {
      const inter = modalState.interaction;
      if (!inter.mode || !modalState.targetImg) return;
      const { naturalX, naturalY } = modalClientToNatural(e.clientX, e.clientY);
      const imgW = modalState.targetImg.originalW;
      const imgH = modalState.targetImg.originalH;

      if (inter.mode === 'drawing') {
        const minX = Math.min(inter.startNatural.x, naturalX);
        const minY = Math.min(inter.startNatural.y, naturalY);
        const w = Math.max(10, Math.abs(naturalX - inter.startNatural.x));
        const h = Math.max(10, Math.abs(naturalY - inter.startNatural.y));
        modalState.box = { x: minX, y: minY, width: w, height: h };
        modalRenderBox();
      } else if (inter.mode === 'moving') {
        const dx = naturalX - inter.startNatural.x;
        const dy = naturalY - inter.startNatural.y;
        const maxX = imgW - inter.startBox.width;
        const maxY = imgH - inter.startBox.height;
        modalState.box.x = Math.max(0, Math.min(maxX, inter.startBox.x + dx));
        modalState.box.y = Math.max(0, Math.min(maxY, inter.startBox.y + dy));
        modalRenderBox();
      } else if (inter.mode === 'resizing') {
        mcApplyResize(modalState.box, inter.startBox, inter.handle, naturalX, naturalY);
        modalRenderBox();
      }
    });

    const endModalInteraction = (e) => {
      if (modalState.interaction.mode) {
        try { overlay.releasePointerCapture(e.pointerId); } catch (err) {}
        modalState.interaction = { mode: null, pointerId: null, startNatural: { x: 0, y: 0 }, startBox: null, handle: null };
      }
    };

    overlay.addEventListener('pointerup', endModalInteraction);
    overlay.addEventListener('pointercancel', endModalInteraction);
  }


  // ==========================================================================
  // ==========================================================================
  // BÖLÜM 3: ÇOKLU SERBEST KIRPMA (MOD 2 MANTIĞI - MULTI-CROP STUDIO)
  // ==========================================================================
  // ==========================================================================

  function setupMultiCropper() {
    ['dragenter', 'dragover'].forEach(name => {
      DOM.mcDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.mcDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      DOM.mcDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.mcDropzone.classList.remove('dragover');
      });
    });

    DOM.mcDropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        mcLoadSingleImage(files[0]);
      }
    });

    DOM.mcDropzone.addEventListener('click', (e) => {
      if (e.target !== DOM.mcFileInput) DOM.mcFileInput.click();
    });

    DOM.mcFileInput.addEventListener('click', e => e.stopPropagation());

    DOM.mcFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        mcLoadSingleImage(e.target.files[0]);
        DOM.mcFileInput.value = '';
      }
    });

    DOM.mcChangeImgBtn.addEventListener('click', () => {
      DOM.mcFileInput.click();
    });

    // Zoom Kontrolleri
    DOM.mcZoomInBtn.addEventListener('click', () => mcSetZoom(multiState.zoom + 0.15));
    DOM.mcZoomOutBtn.addEventListener('click', () => mcSetZoom(multiState.zoom - 0.15));
    DOM.mcZoomFitBtn.addEventListener('click', mcFitToScreen);

    DOM.mcViewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        mcSetZoom(multiState.zoom + delta);
      }
    }, { passive: false });

    // Geri Al / Yinele / Temizle / Çoğalt / Sil
    DOM.mcUndoBtn.addEventListener('click', mcUndo);
    DOM.mcRedoBtn.addEventListener('click', mcRedo);
    DOM.mcClearAllBtn.addEventListener('click', mcClearAllBoxes);
    DOM.mcDuplicateBtn.addEventListener('click', mcDuplicateSelectedBox);
    DOM.mcDeleteSelectedBtn.addEventListener('click', mcDeleteSelectedBox);

    // Format, Kalite ve Ön Ek
    DOM.mcFormatSelect.addEventListener('change', (e) => {
      multiState.settings.format = e.target.value;
      if (e.target.value === 'jpeg' || e.target.value === 'webp') {
        DOM.mcQualityRow.classList.remove('hidden');
      } else {
        DOM.mcQualityRow.classList.add('hidden');
      }
    });

    DOM.mcSliderQuality.addEventListener('input', (e) => {
      multiState.settings.quality = parseInt(e.target.value, 10);
      DOM.mcValQuality.textContent = `%${multiState.settings.quality}`;
    });

    DOM.mcFilenamePrefix.addEventListener('input', (e) => {
      multiState.settings.prefix = e.target.value.trim() || 'kirpim';
    });

    // Dışa Aktarma Butonları
    DOM.mcDownloadSelectedBtn.addEventListener('click', mcDownloadSelectedBox);
    DOM.mcDownloadAllBtn.addEventListener('click', mcDownloadAllBoxesSequentially);
    DOM.mcDownloadZipBtn.addEventListener('click', mcDownloadZip);

    setupOverlayInteractions();
  }

  async function mcLoadSingleImage(file) {
    if (!file.type.startsWith('image/') && !isImageByExt(file.name)) {
      showToast('Lütfen geçerli bir görsel dosyası seçin.', 'error');
      return;
    }

    try {
      if (multiState.image && multiState.image.objectUrl) {
        URL.revokeObjectURL(multiState.image.objectUrl);
      }

      const imgData = await loadSingleImageFile(file, 'mc_active_image');
      multiState.image = {
        file: file,
        name: file.name,
        objectUrl: imgData.objectUrl,
        img: imgData.img,
        naturalWidth: imgData.originalW,
        naturalHeight: imgData.originalH
      };

      multiState.cropBoxes = [];
      multiState.selectedId = null;
      multiState.history = { stack: [], index: -1 };
      mcPushHistory();

      DOM.mcImage.src = multiState.image.objectUrl;
      DOM.mcFilename.textContent = file.name;
      DOM.mcDimensions.textContent = `${multiState.image.naturalWidth} × ${multiState.image.naturalHeight} px`;

      DOM.mcUploadSection.classList.add('hidden');
      DOM.mcWorkspaceSection.classList.remove('hidden');

      DOM.mcImage.onload = () => {
        mcFitToScreen();
        mcRenderAllBoxes();
        mcUpdateUI();
        showToast(`"${file.name}" yüklendi. Şimdi üzerine serbest kırpma alanları çizebilirsiniz!`, 'success');
      };
    } catch (err) {
      showToast('Görsel açılırken hata oluştu.', 'error');
    }
  }

  function mcSetZoom(newZoom) {
    if (!multiState.image) return;
    multiState.zoom = Math.max(0.2, Math.min(3.0, parseFloat(newZoom.toFixed(2))));
    DOM.mcZoomLevel.textContent = `${Math.round(multiState.zoom * 100)}%`;

    const viewportW = DOM.mcViewport.clientWidth - 48;
    const baseW = Math.min(viewportW, multiState.image.naturalWidth);
    const targetW = Math.round(baseW * multiState.zoom);

    DOM.mcStage.style.width = `${targetW}px`;
  }

  function mcFitToScreen() {
    if (!multiState.image) return;
    const viewportW = DOM.mcViewport.clientWidth - 48;
    const viewportH = DOM.mcViewport.clientHeight - 48;

    const scaleW = viewportW / multiState.image.naturalWidth;
    const scaleH = viewportH / multiState.image.naturalHeight;
    const fitScale = Math.min(1.0, Math.min(scaleW, scaleH));

    multiState.zoom = 1.0;
    DOM.mcZoomLevel.textContent = `100%`;

    const targetW = Math.round(multiState.image.naturalWidth * fitScale);
    DOM.mcStage.style.width = `${Math.max(280, targetW)}px`;
  }

  let drawingBoxEl = null;

  function setupOverlayInteractions() {
    const overlay = DOM.mcOverlay;

    overlay.addEventListener('pointerdown', (e) => {
      if (!multiState.image || e.button !== 0) return;

      const target = e.target;
      const { naturalX, naturalY } = clientToNatural(e.clientX, e.clientY);

      if (target.classList.contains('mc-handle')) {
        const boxId = target.dataset.boxId;
        const handle = target.dataset.handle;
        const box = multiState.cropBoxes.find(b => b.id === boxId);
        if (!box) return;

        mcSelectBox(boxId);
        multiState.interaction = {
          mode: 'resizing',
          pointerId: e.pointerId,
          startNatural: { x: naturalX, y: naturalY },
          startBox: { ...box },
          handle: handle
        };
        overlay.setPointerCapture(e.pointerId);
        e.stopPropagation();
        return;
      }

      if (target.closest('.mc-box-btn')) return;

      const boxEl = target.closest('.mc-crop-box');
      if (boxEl) {
        const boxId = boxEl.dataset.id;
        const box = multiState.cropBoxes.find(b => b.id === boxId);
        if (!box) return;

        mcSelectBox(boxId);
        multiState.interaction = {
          mode: 'moving',
          pointerId: e.pointerId,
          startNatural: { x: naturalX, y: naturalY },
          startBox: { ...box }
        };
        overlay.setPointerCapture(e.pointerId);
        e.stopPropagation();
        return;
      }

      mcSelectBox(null);
      multiState.interaction = {
        mode: 'drawing',
        pointerId: e.pointerId,
        startNatural: { x: naturalX, y: naturalY }
      };

      if (!drawingBoxEl) {
        drawingBoxEl = document.createElement('div');
        drawingBoxEl.className = 'mc-drawing-box';
        overlay.appendChild(drawingBoxEl);
      }
      drawingBoxEl.style.display = 'block';
      updateDrawingBoxStyle(naturalX, naturalY, naturalX, naturalY);

      overlay.setPointerCapture(e.pointerId);
    });

    overlay.addEventListener('pointermove', (e) => {
      if (!multiState.image) return;

      const { naturalX, naturalY } = clientToNatural(e.clientX, e.clientY);
      const inter = multiState.interaction;

      DOM.mcCoordStats.innerHTML = `Piksel: X: <strong>${naturalX}</strong>, Y: <strong>${naturalY}</strong>`;

      if (!inter.mode) return;

      if (inter.mode === 'drawing') {
        updateDrawingBoxStyle(inter.startNatural.x, inter.startNatural.y, naturalX, naturalY);
      } else if (inter.mode === 'moving') {
        const dx = naturalX - inter.startNatural.x;
        const dy = naturalY - inter.startNatural.y;
        const box = multiState.cropBoxes.find(b => b.id === multiState.selectedId);
        if (box && inter.startBox) {
          const maxX = multiState.image.naturalWidth - inter.startBox.width;
          const maxY = multiState.image.naturalHeight - inter.startBox.height;

          box.x = Math.max(0, Math.min(maxX, inter.startBox.x + dx));
          box.y = Math.max(0, Math.min(maxY, inter.startBox.y + dy));

          mcApplyBoxPositionToDOM(box);
          mcUpdateSelectedBadge(box);
        }
      } else if (inter.mode === 'resizing') {
        const box = multiState.cropBoxes.find(b => b.id === multiState.selectedId);
        if (box && inter.startBox) {
          mcApplyResize(box, inter.startBox, inter.handle, naturalX, naturalY);
          mcApplyBoxPositionToDOM(box);
          mcUpdateSelectedBadge(box);
        }
      }
    });

    const endInteraction = (e) => {
      const inter = multiState.interaction;
      if (!inter.mode) return;

      try { overlay.releasePointerCapture(e.pointerId); } catch (err) {}

      if (inter.mode === 'drawing') {
        if (drawingBoxEl) drawingBoxEl.style.display = 'none';

        const { naturalX, naturalY } = clientToNatural(e.clientX, e.clientY);
        const minX = Math.min(inter.startNatural.x, naturalX);
        const minY = Math.min(inter.startNatural.y, Math.max(0, Math.min(multiState.image.naturalHeight, naturalY)));
        const w = Math.abs(naturalX - inter.startNatural.x);
        const h = Math.abs(naturalY - inter.startNatural.y);

        if (w >= 10 && h >= 10) {
          const newBox = {
            id: 'crop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            x: minX,
            y: minY,
            width: w,
            height: h,
            color: BOX_COLORS[multiState.cropBoxes.length % BOX_COLORS.length],
            customName: null
          };
          multiState.cropBoxes.push(newBox);
          mcSelectBox(newBox.id);
          mcPushHistory();
          mcRenderAllBoxes();
          mcUpdateUI();
          showToast(`Kırpma #${multiState.cropBoxes.length} alanı oluşturuldu (${w} × ${h} px).`, 'success');
        }
      } else if (inter.mode === 'moving' || inter.mode === 'resizing') {
        const box = multiState.cropBoxes.find(b => b.id === multiState.selectedId);
        if (box && inter.startBox) {
          if (box.x !== inter.startBox.x || box.y !== inter.startBox.y ||
              box.width !== inter.startBox.width || box.height !== inter.startBox.height) {
            mcPushHistory();
            mcUpdateSidebarCard(box);
          }
        }
      }

      multiState.interaction = { mode: null, pointerId: null, startNatural: { x: 0, y: 0 }, startBox: null, handle: null };
    };

    overlay.addEventListener('pointerup', endInteraction);
    overlay.addEventListener('pointercancel', endInteraction);
  }

  function updateDrawingBoxStyle(startX, startY, currentX, currentY) {
    if (!drawingBoxEl || !multiState.image) return;
    const imgW = multiState.image.naturalWidth;
    const imgH = multiState.image.naturalHeight;

    const minX = Math.min(startX, currentX);
    const minY = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    drawingBoxEl.style.left = `${(minX / imgW) * 100}%`;
    drawingBoxEl.style.top = `${(minY / imgH) * 100}%`;
    drawingBoxEl.style.width = `${(w / imgW) * 100}%`;
    drawingBoxEl.style.height = `${(h / imgH) * 100}%`;
  }

  function mcApplyResize(box, startBox, handle, curX, curY) {
    const imgW = multiState.image.naturalWidth;
    const imgH = multiState.image.naturalHeight;
    const minSize = 10;

    let left = startBox.x;
    let top = startBox.y;
    let right = startBox.x + startBox.width;
    let bottom = startBox.y + startBox.height;

    if (handle.includes('w')) left = Math.max(0, Math.min(right - minSize, curX));
    else if (handle.includes('e')) right = Math.min(imgW, Math.max(left + minSize, curX));

    if (handle.includes('n')) top = Math.max(0, Math.min(bottom - minSize, curY));
    else if (handle.includes('s')) bottom = Math.min(imgH, Math.max(top + minSize, curY));

    box.x = Math.round(left);
    box.y = Math.round(top);
    box.width = Math.round(right - left);
    box.height = Math.round(bottom - top);
  }

  function clientToNatural(clientX, clientY) {
    const rect = DOM.mcOverlay.getBoundingClientRect();
    const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const naturalX = Math.round(normX * multiState.image.naturalWidth);
    const naturalY = Math.round(normY * multiState.image.naturalHeight);

    return { naturalX, naturalY };
  }

  function mcApplyBoxPositionToDOM(box) {
    const el = DOM.mcOverlay.querySelector(`.mc-crop-box[data-id="${box.id}"]`);
    if (!el || !multiState.image) return;

    const imgW = multiState.image.naturalWidth;
    const imgH = multiState.image.naturalHeight;

    el.style.left = `${(box.x / imgW) * 100}%`;
    el.style.top = `${(box.y / imgH) * 100}%`;
    el.style.width = `${(box.width / imgW) * 100}%`;
    el.style.height = `${(box.height / imgH) * 100}%`;

    const label = el.querySelector('.mc-box-label');
    if (label) {
      const idx = multiState.cropBoxes.findIndex(b => b.id === box.id);
      label.textContent = `${box.customName || '#' + (idx + 1)} • ${box.width}×${box.height}`;
    }
  }

  function mcRenderAllBoxes() {
    Array.from(DOM.mcOverlay.children).forEach(child => {
      if (child !== drawingBoxEl) child.remove();
    });

    multiState.cropBoxes.forEach((box, index) => {
      const boxEl = document.createElement('div');
      boxEl.className = 'mc-crop-box' + (box.id === multiState.selectedId ? ' selected' : '');
      boxEl.dataset.id = box.id;
      boxEl.style.borderColor = box.color || '#4f46e5';

      const imgW = multiState.image.naturalWidth;
      const imgH = multiState.image.naturalHeight;
      boxEl.style.left = `${(box.x / imgW) * 100}%`;
      boxEl.style.top = `${(box.y / imgH) * 100}%`;
      boxEl.style.width = `${(box.width / imgW) * 100}%`;
      boxEl.style.height = `${(box.height / imgH) * 100}%`;

      const label = document.createElement('div');
      label.className = 'mc-box-label';
      label.textContent = `${box.customName || '#' + (index + 1)} • ${box.width}×${box.height}`;
      boxEl.appendChild(label);

      const actions = document.createElement('div');
      actions.className = 'mc-box-actions';
      actions.innerHTML = `
        <button type="button" class="mc-box-btn btn-dup" title="Çoğalt">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
        <button type="button" class="mc-box-btn btn-del" title="Sil">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;

      actions.querySelector('.btn-dup').addEventListener('click', (e) => {
        e.stopPropagation();
        mcDuplicateBox(box.id);
      });

      actions.querySelector('.btn-del').addEventListener('click', (e) => {
        e.stopPropagation();
        mcDeleteBox(box.id);
      });

      boxEl.appendChild(actions);

      ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(h => {
        const handleEl = document.createElement('div');
        handleEl.className = `mc-handle handle-${h}`;
        handleEl.dataset.handle = h;
        handleEl.dataset.boxId = box.id;
        handleEl.style.borderColor = box.color || '#4f46e5';
        boxEl.appendChild(handleEl);
      });

      DOM.mcOverlay.appendChild(boxEl);
    });

    mcRenderSidebarList();
  }

  function mcSelectBox(id) {
    multiState.selectedId = id;
    const allBoxEls = DOM.mcOverlay.querySelectorAll('.mc-crop-box');
    allBoxEls.forEach(el => {
      el.classList.toggle('selected', el.dataset.id === id);
    });

    const box = multiState.cropBoxes.find(b => b.id === id);
    mcUpdateSelectedBadge(box);

    const allCards = DOM.mcAreaList.querySelectorAll('.mc-area-card');
    allCards.forEach(c => {
      if (c.dataset.id === id) {
        c.classList.add('active');
        c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        c.classList.remove('active');
      }
    });

    DOM.mcDuplicateBtn.disabled = !box;
    DOM.mcDeleteSelectedBtn.disabled = !box;
    DOM.mcDownloadSelectedBtn.disabled = !box;
  }

  function mcUpdateSelectedBadge(box) {
    if (!box) {
      DOM.mcSelectedBadge.textContent = 'Alan Seçilmedi';
      return;
    }
    const idx = multiState.cropBoxes.findIndex(b => b.id === box.id);
    const title = box.customName || `Kırpma #${idx + 1}`;
    DOM.mcSelectedBadge.textContent = `Seçili: ${title} (${box.width} × ${box.height} px | X: ${box.x}, Y: ${box.y})`;
  }

  // ==========================================================================
  // SAĞ PANEL: KIRPMA ALANLARI LİSTESİ VE DÜZENLENEBİLİR İSİMLER
  // ==========================================================================
  function mcRenderSidebarList() {
    DOM.mcAreaList.innerHTML = '';
    const count = multiState.cropBoxes.length;
    DOM.mcAreaCountBadge.textContent = `${count} Alan`;

    if (count === 0) {
      DOM.mcSidebarEmpty.classList.remove('hidden');
      DOM.mcAreaList.classList.add('hidden');
    } else {
      DOM.mcSidebarEmpty.classList.add('hidden');
      DOM.mcAreaList.classList.remove('hidden');

      multiState.cropBoxes.forEach((box, index) => {
        const card = document.createElement('div');
        card.className = 'mc-area-card' + (box.id === multiState.selectedId ? ' active' : '');
        card.dataset.id = box.id;

        const displayName = box.customName || `Kırpma #${index + 1}`;

        card.innerHTML = `
          <div class="mc-area-thumb-wrap">
            <canvas class="mc-area-thumb" width="54" height="54"></canvas>
          </div>
          <div class="mc-area-info">
            <div class="mc-area-title">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${box.color || '#4f46e5'}"></span>
              <span class="area-title-editable" title="Adlandırmak için tıklayın">${escapeHtml(displayName)}</span>
            </div>
            <div class="mc-area-dims">${box.width} × ${box.height} px</div>
            <div class="mc-area-coords">Konum: X:${box.x}, Y:${box.y}</div>
          </div>
          <div class="mc-area-actions">
            <button type="button" class="btn-area-action btn-dl" title="Bu alanı indir">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
            <button type="button" class="btn-area-action btn-del" title="Bu alanı sil">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        `;

        // Tıklayınca alana odaklan
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.btn-area-action') && !e.target.closest('input')) {
            mcSelectBox(box.id);
          }
        });

        // İsim Düzenleme (Inline Rename for Crop Area)
        const titleEl = card.querySelector('.area-title-editable');
        titleEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'card-filename-input';
          input.value = box.customName || `kirpim-${pad2(index + 1)}`;
          titleEl.replaceWith(input);
          input.focus();
          input.select();

          const saveAreaName = () => {
            const val = input.value.trim();
            box.customName = val || null;
            mcRenderAllBoxes();
          };

          input.addEventListener('blur', saveAreaName);
          input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') input.blur();
            if (ev.key === 'Escape') mcRenderSidebarList();
          });
        });

        // Tekil İndirme
        card.querySelector('.btn-dl').addEventListener('click', (e) => {
          e.stopPropagation();
          mcDownloadSingleBox(box, index);
        });

        // Silme
        card.querySelector('.btn-del').addEventListener('click', (e) => {
          e.stopPropagation();
          mcDeleteBox(box.id);
        });

        DOM.mcAreaList.appendChild(card);
        mcRenderSidebarThumb(card.querySelector('.mc-area-thumb'), box);
      });
    }

    mcUpdateUI();
  }

  function mcRenderSidebarThumb(canvas, box) {
    if (!canvas || !multiState.image) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      ctx.drawImage(
        multiState.image.img,
        box.x, box.y, box.width, box.height,
        0, 0, canvas.width, canvas.height
      );
    } catch (e) {}
  }

  function mcUpdateSidebarCard(box) {
    const card = DOM.mcAreaList.querySelector(`.mc-area-card[data-id="${box.id}"]`);
    if (!card) return;

    const dimsEl = card.querySelector('.mc-area-dims');
    const coordsEl = card.querySelector('.mc-area-coords');
    const canvas = card.querySelector('.mc-area-thumb');

    if (dimsEl) dimsEl.textContent = `${box.width} × ${box.height} px`;
    if (coordsEl) coordsEl.textContent = `Konum: X:${box.x}, Y:${box.y}`;
    if (canvas) mcRenderSidebarThumb(canvas, box);
  }

  function mcUpdateUI() {
    const count = multiState.cropBoxes.length;
    DOM.mcExportSummary.textContent = `${count} adet kırpma alanı dışa aktarılmaya hazır`;
    DOM.mcDownloadAllBtn.disabled = count === 0;
    DOM.mcDownloadZipBtn.disabled = count === 0;
    DOM.mcClearAllBtn.disabled = count === 0;
    DOM.mcUndoBtn.disabled = multiState.history.index <= 0;
    DOM.mcRedoBtn.disabled = multiState.history.index >= multiState.history.stack.length - 1;
  }

  // ==========================================================================
  // GERİ AL / YİNELE / ÇOĞALT / SİL EYLEMLERİ
  // ==========================================================================
  function mcPushHistory() {
    multiState.history.stack = multiState.history.stack.slice(0, multiState.history.index + 1);

    const snapshot = {
      boxes: JSON.parse(JSON.stringify(multiState.cropBoxes)),
      selectedId: multiState.selectedId
    };

    multiState.history.stack.push(snapshot);
    if (multiState.history.stack.length > 50) multiState.history.stack.shift();
    multiState.history.index = multiState.history.stack.length - 1;

    DOM.mcUndoBtn.disabled = multiState.history.index <= 0;
    DOM.mcRedoBtn.disabled = true;
  }

  function mcUndo() {
    if (multiState.history.index > 0) {
      multiState.history.index--;
      const snapshot = multiState.history.stack[multiState.history.index];
      multiState.cropBoxes = JSON.parse(JSON.stringify(snapshot.boxes));
      multiState.selectedId = snapshot.selectedId;
      mcRenderAllBoxes();
      mcSelectBox(multiState.selectedId);
      mcUpdateUI();
      showToast('Geri alındı.', 'info');
    }
  }

  function mcRedo() {
    if (multiState.history.index < multiState.history.stack.length - 1) {
      multiState.history.index++;
      const snapshot = multiState.history.stack[multiState.history.index];
      multiState.cropBoxes = JSON.parse(JSON.stringify(snapshot.boxes));
      multiState.selectedId = snapshot.selectedId;
      mcRenderAllBoxes();
      mcSelectBox(multiState.selectedId);
      mcUpdateUI();
      showToast('Yinelendi.', 'info');
    }
  }

  function mcDuplicateSelectedBox() {
    if (!multiState.selectedId) return;
    mcDuplicateBox(multiState.selectedId);
  }

  function mcDuplicateBox(id) {
    const box = multiState.cropBoxes.find(b => b.id === id);
    if (!box || !multiState.image) return;

    const offset = 25;
    const maxX = multiState.image.naturalWidth - box.width;
    const maxY = multiState.image.naturalHeight - box.height;

    const newBox = {
      id: 'crop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      x: Math.min(maxX, box.x + offset),
      y: Math.min(maxY, box.y + offset),
      width: box.width,
      height: box.height,
      color: BOX_COLORS[multiState.cropBoxes.length % BOX_COLORS.length],
      customName: box.customName ? `${box.customName}_kopya` : null
    };

    multiState.cropBoxes.push(newBox);
    mcSelectBox(newBox.id);
    mcPushHistory();
    mcRenderAllBoxes();
    mcUpdateUI();
    showToast('Kırpma alanı çoğaltıldı.', 'success');
  }

  function mcDeleteSelectedBox() {
    if (!multiState.selectedId) return;
    mcDeleteBox(multiState.selectedId);
  }

  function mcDeleteBox(id) {
    const idx = multiState.cropBoxes.findIndex(b => b.id === id);
    if (idx === -1) return;

    multiState.cropBoxes.splice(idx, 1);
    if (multiState.selectedId === id) {
      multiState.selectedId = null;
    }

    mcPushHistory();
    mcRenderAllBoxes();
    mcSelectBox(null);
    mcUpdateUI();
    showToast('Kırpma alanı silindi.', 'info');
  }

  function mcClearAllBoxes() {
    if (multiState.cropBoxes.length === 0) return;
    multiState.cropBoxes = [];
    multiState.selectedId = null;
    mcPushHistory();
    mcRenderAllBoxes();
    mcSelectBox(null);
    mcUpdateUI();
    showToast('Tüm kırpma alanları temizlendi.', 'info');
  }

  // ==========================================================================
  // ÇOKLU KIRPMA DIŞA AKTARMA VE İNDİRME İŞLEMLERİ
  // ==========================================================================

  function mcGenerateBoxBlob(box) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = box.width;
        canvas.height = box.height;

        const ctx = canvas.getContext('2d');
        const mimeType = multiState.settings.format === 'jpeg' ? 'image/jpeg' : (multiState.settings.format === 'webp' ? 'image/webp' : 'image/png');

        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          multiState.image.img,
          box.x, box.y, box.width, box.height,
          0, 0, box.width, box.height
        );

        const quality = (multiState.settings.quality || 90) / 100;
        canvas.toBlob((blob) => {
          if (blob) resolve({ blob, mimeType });
          else reject(new Error('Canvas Blob dönüşümü başarısız.'));
        }, mimeType, quality);
      } catch (err) {
        reject(err);
      }
    });
  }

  function mcGetBoxOutputFilename(box, index, ext) {
    if (box.customName) {
      return box.customName.endsWith(ext) ? box.customName : `${box.customName}${ext}`;
    }
    const prefix = multiState.settings.prefix || 'kirpim';
    return `${prefix}-${pad2(index + 1)}${ext}`;
  }

  async function mcDownloadSelectedBox() {
    if (!multiState.selectedId) return;
    const idx = multiState.cropBoxes.findIndex(b => b.id === multiState.selectedId);
    if (idx !== -1) {
      mcDownloadSingleBox(multiState.cropBoxes[idx], idx);
    }
  }

  async function mcDownloadSingleBox(box, index) {
    try {
      const { blob, mimeType } = await mcGenerateBoxBlob(box);
      const ext = mimeType === 'image/png' ? '.png' : (mimeType === 'image/webp' ? '.webp' : '.jpg');
      const filename = mcGetBoxOutputFilename(box, index, ext);

      downloadBlob(blob, filename);
      showToast(`"${filename}" başarıyla indirildi.`, 'success');
    } catch (err) {
      showToast('Kırpma alanı indirilirken hata oluştu.', 'error');
    }
  }

  async function mcDownloadAllBoxesSequentially() {
    if (multiState.cropBoxes.length === 0) return;

    showToast('Tarayıcınız birden fazla dosya indirme izni isterse lütfen "İzin Ver"e tıklayın.', 'info');
    for (let i = 0; i < multiState.cropBoxes.length; i++) {
      await mcDownloadSingleBox(multiState.cropBoxes[i], i);
      await new Promise(r => setTimeout(r, 220));
    }
  }

  async function mcDownloadZip() {
    if (multiState.cropBoxes.length === 0 || appState.isProcessing) return;

    appState.isProcessing = true;
    DOM.mcDownloadZipBtn.disabled = true;
    DOM.mcBtnZipText.textContent = 'Paketleniyor...';

    const total = multiState.cropBoxes.length;
    const processedFiles = [];
    const usedNames = new Set();

    DOM.mcProgressCard.classList.remove('hidden');
    updateProgressUI(DOM.mcProgressBarFill, DOM.mcProgressPercent, DOM.mcProgressStatus, 0, total, 'Kırpma alanları hazırlanıyor...');

    try {
      for (let i = 0; i < total; i++) {
        const box = multiState.cropBoxes[i];
        updateProgressUI(DOM.mcProgressBarFill, DOM.mcProgressPercent, DOM.mcProgressStatus, i, total, `Kırpılıyor (${i + 1} / ${total})...`);
        await yieldToMain();

        const { blob, mimeType } = await mcGenerateBoxBlob(box);
        const ext = mimeType === 'image/png' ? '.png' : (mimeType === 'image/webp' ? '.webp' : '.jpg');
        const baseName = mcGetBoxOutputFilename(box, i, ext);
        const uniqueName = getUniqueFilename(baseName, usedNames);
        usedNames.add(uniqueName);

        processedFiles.push({ name: uniqueName, blob });
        updateProgressUI(DOM.mcProgressBarFill, DOM.mcProgressPercent, DOM.mcProgressStatus, i + 1, total, `${i + 1} / ${total} kırpma tamamlandı`);
      }

      updateProgressUI(DOM.mcProgressBarFill, DOM.mcProgressPercent, DOM.mcProgressStatus, total, total, 'ZIP arşivi oluşturuluyor...');
      await yieldToMain();

      const zipBlob = await createZipArchive(processedFiles, (pct) => {
        DOM.mcProgressPercent.textContent = `%${pct}`;
        DOM.mcProgressBarFill.style.width = `${pct}%`;
      });

      downloadBlob(zipBlob, 'coklu-kirpimlar.zip');
      showToast(`${total} adet kırpma başarıyla ZIP olarak indirildi!`, 'success');
    } catch (err) {
      showToast(err.message || 'ZIP oluşturulurken hata meydana geldi.', 'error');
    } finally {
      appState.isProcessing = false;
      DOM.mcDownloadZipBtn.disabled = false;
      DOM.mcBtnZipText.textContent = 'Tümünü ZIP Olarak İndir';
      setTimeout(() => DOM.mcProgressCard.classList.add('hidden'), 3000);
    }
  }


  // ==========================================================================
  // ==========================================================================
  // ORTAK YARDIMCI VE ZIP MOTORU (SHARED UTILITIES & ZIP ENGINE)
  // ==========================================================================
  // ==========================================================================

  function loadSingleImageFile(file, fileId) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        resolve({
          id: fileId,
          file: file,
          name: file.name,
          originalW: img.naturalWidth || img.width,
          originalH: img.naturalHeight || img.height,
          objectUrl: objectUrl,
          img: img,
          size: file.size,
          type: file.type || 'image/jpeg'
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Görsel dosyası açılamadı.'));
      };

      img.src = objectUrl;
    });
  }

  async function createZipArchive(files, onProgress) {
    if (typeof window.JSZip !== 'undefined') {
      const zip = new window.JSZip();
      files.forEach(f => zip.file(f.name, f.blob));

      return await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (meta) => {
          if (onProgress && meta.percent) onProgress(Math.round(meta.percent));
        }
      );
    }

    return await createPureJsZip(files, onProgress);
  }

  async function createPureJsZip(files, onProgress) {
    const parts = [];
    const cdHeaders = [];
    let offset = 0;

    const crcTable = makeCrc32Table();
    function crc32(buffer) {
      let c = 0 ^ (-1);
      const u = new Uint8Array(buffer);
      for (let i = 0; i < u.length; i++) c = (c >>> 8) ^ crcTable[(c ^ u[i]) & 0xFF];
      return (c ^ (-1)) >>> 0;
    }

    const encoder = new TextEncoder();

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const buffer = await f.blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const nameBytes = encoder.encode(f.name);
      const fileCrc = crc32(buffer);
      const sz = bytes.length;

      const lh = new Uint8Array(30 + nameBytes.length);
      const v = new DataView(lh.buffer);
      v.setUint32(0, 0x04034b50, true);
      v.setUint16(4, 20, true);
      v.setUint16(6, 0x0800, true);
      v.setUint16(8, 0, true);
      v.setUint16(10, 0, true);
      v.setUint16(12, 0, true);
      v.setUint32(14, fileCrc, true);
      v.setUint32(18, sz, true);
      v.setUint32(22, sz, true);
      v.setUint16(26, nameBytes.length, true);
      v.setUint16(28, 0, true);
      lh.set(nameBytes, 30);

      parts.push(lh);
      parts.push(bytes);

      const cd = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0, true);
      cv.setUint32(16, fileCrc, true);
      cv.setUint32(20, sz, true);
      cv.setUint32(24, sz, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      cd.set(nameBytes, 46);

      cdHeaders.push(cd);
      offset += lh.length + sz;

      if (onProgress) onProgress(Math.round(((i + 1) / files.length) * 100));
    }

    const cdOffset = offset;
    let cdSize = 0;
    cdHeaders.forEach(h => {
      parts.push(h);
      cdSize += h.length;
    });

    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, cdOffset, true);
    ev.setUint16(20, 0, true);
    parts.push(eocd);

    return new Blob(parts, { type: 'application/zip' });
  }

  function makeCrc32Table() {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c >>> 0;
    }
    return table;
  }

  function updateProgressUI(barEl, percentEl, statusEl, current, total, text) {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    if (barEl) barEl.style.width = `${pct}%`;
    if (percentEl) percentEl.textContent = `%${pct}`;
    if (statusEl) statusEl.textContent = text;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
  }

  function yieldToMain() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  function getOutputMimeType(originalType, chosenFormat) {
    if (chosenFormat === 'jpeg') return 'image/jpeg';
    if (chosenFormat === 'png') return 'image/png';
    if (chosenFormat === 'webp') return 'image/webp';
    if (originalType === 'image/png') return 'image/png';
    if (originalType === 'image/webp') return 'image/webp';
    return 'image/jpeg';
  }

  function getFormatLabel(mimeType) {
    switch (mimeType) {
      case 'image/jpeg': return 'JPEG';
      case 'image/png': return 'PNG';
      case 'image/webp': return 'WebP';
      default: return 'JPG';
    }
  }

  function getEffectiveFormatBadge(originalType, chosenFormat) {
    return getFormatLabel(getOutputMimeType(originalType, chosenFormat));
  }

  function getUniqueFilename(name, set) {
    if (!set.has(name)) return name;
    const lastDot = name.lastIndexOf('.');
    const base = lastDot !== -1 ? name.substring(0, lastDot) : name;
    const ext = lastDot !== -1 ? name.substring(lastDot) : '';
    let counter = 1;
    let candidate = `${base}_${counter}${ext}`;
    while (set.has(candidate)) {
      counter++;
      candidate = `${base}_${counter}${ext}`;
    }
    return candidate;
  }

  function isImageByExt(name) {
    const valid = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.svg'];
    const lower = name.toLowerCase();
    return valid.some(ext => lower.endsWith(ext));
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function pad2(num) {
    return num.toString().padStart(2, '0');
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `<span class="toast-icon">${iconSvg}</span><span class="toast-text">${escapeHtml(message)}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, 4000);
  }

  function showNotice(message, type = 'info') {
    DOM.globalNotice.textContent = message;
    DOM.globalNotice.className = `alert-banner alert-${type}`;
    DOM.globalNotice.classList.remove('hidden');
  }

  // DOM hazır olduğunda başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
