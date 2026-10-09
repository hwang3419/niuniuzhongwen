/**
 * 主应用程序协调器 (Main App Controller)
 * 适配移动设备手势、状态管理、模式切换与交互驱动
 */

class AppController {
  constructor() {
    this.currentUnitId = 'unit-1';
    this.currentFilter = 'all'; // 'all' | 'need_review' | 'mastered' | 'favorite'
    this.cardList = [];
    this.currentIndex = 0;
    this.isCardFlipped = false;
    this.autoPlayTimer = null;
    this.isAutoPlaying = false;
    this.currentTab = 'card'; // 'card' | 'write' | 'game' | 'list'

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;

    this.init();
  }

  init() {
    this.setupData();
    this.bindDOM();
    this.initTouchGestures();
    this.renderUnitSelector();
    this.applySettings();
    this.loadCards();
    this.updateStats();

    // 注册 Service Worker (用于离线 PWA 支持)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(err => {
        console.log('Service Worker optional cache note:', err);
      });
    }
  }

  // 整理数据与单元合并自定义字卡
  setupData() {
    this.database = JSON.parse(JSON.stringify(MLP_DATABASE));
    
    // 如果有用户自定义字卡，注入为专属自定义单元
    if (window.storageManager.customCards.length > 0) {
      this.database.units.push({
        id: 'unit-custom',
        book: '我的专属字库',
        title: '家长/教师自定义生字',
        description: '自主录入的本周学习字词卡片',
        badge: '自定义',
        color: '#E84393',
        characters: window.storageManager.customCards
      });
    }
  }

  // 绑定 DOM 核心交互
  bindDOM() {
    // 底部导航栏切换
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.onclick = () => {
        const tab = item.getAttribute('data-tab');
        this.switchTab(tab);
      };
    });

    // 单元下拉切换
    const unitSelect = document.getElementById('unitSelect');
    if (unitSelect) {
      unitSelect.onchange = (e) => {
        this.currentUnitId = e.target.value;
        this.currentIndex = 0;
        this.loadCards();
      };
    }

    // 过滤标签 (全部 / 待复习 / 已掌握 / 收藏)
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.onclick = () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentFilter = chip.getAttribute('data-filter');
        this.currentIndex = 0;
        this.loadCards();
      };
    });

    // 卡片翻转点击
    const flashcard = document.getElementById('flashcard');
    if (flashcard) {
      flashcard.onclick = (e) => {
        // 如果点击的是朗读按钮或星星按钮，不触发卡片翻转
        if (e.target.closest('.no-flip')) return;
        this.flipCard();
      };
    }

    // 上一张 / 下一张
    const prevBtn = document.getElementById('prevCardBtn');
    const nextBtn = document.getElementById('nextCardBtn');
    if (prevBtn) prevBtn.onclick = () => this.prevCard();
    if (nextBtn) nextBtn.onclick = () => this.nextCard();

    // 掌握与复习按钮
    const masterBtn = document.getElementById('btnMarkMaster');
    const reviewBtn = document.getElementById('btnMarkReview');
    if (masterBtn) {
      masterBtn.onclick = () => {
        const curChar = this.getCurrentCharacter();
        if (curChar) {
          window.soundEngine.playCorrect();
          window.soundEngine.playStar();
          window.storageManager.markMastered(curChar.char);
          this.updateCardStatusBadge();
          this.updateStats();
          setTimeout(() => this.nextCard(), 350);
        }
      };
    }
    if (reviewBtn) {
      reviewBtn.onclick = () => {
        const curChar = this.getCurrentCharacter();
        if (curChar) {
          window.soundEngine.playEncourage();
          window.storageManager.markNeedReview(curChar.char);
          this.updateCardStatusBadge();
          this.updateStats();
          setTimeout(() => this.nextCard(), 350);
        }
      };
    }

    // 自动巡航轮播
    const autoPlayBtn = document.getElementById('autoPlayBtn');
    if (autoPlayBtn) {
      autoPlayBtn.onclick = () => this.toggleAutoPlay();
    }

    // 随机乱序
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
      shuffleBtn.onclick = () => {
        window.soundEngine.playPop();
        this.cardList.sort(() => Math.random() - 0.5);
        this.currentIndex = 0;
        this.renderCard();
      };
    }

    // 快捷朗读当前汉字
    const speakBtn = document.getElementById('speakCharBtn');
    if (speakBtn) {
      speakBtn.onclick = (e) => {
        e.stopPropagation();
        const cur = this.getCurrentCharacter();
        if (cur) window.soundEngine.speak(cur.char);
      };
    }

    // 点击大字或拼音也直接朗读该字
    const frontPinyin = document.getElementById('cardFrontPinyin');
    const frontChar = document.getElementById('cardFrontChar');
    if (frontPinyin) {
      frontPinyin.onclick = (e) => {
        e.stopPropagation();
        const cur = this.getCurrentCharacter();
        if (cur) window.soundEngine.speak(cur.char);
      };
    }
    if (frontChar) {
      frontChar.onclick = (e) => {
        e.stopPropagation();
        const cur = this.getCurrentCharacter();
        if (cur) window.soundEngine.speak(cur.char);
      };
    }

    // 收藏当前字
    const favBtn = document.getElementById('favCharBtn');
    if (favBtn) {
      favBtn.onclick = (e) => {
        e.stopPropagation();
        const cur = this.getCurrentCharacter();
        if (cur) {
          const isFav = window.storageManager.toggleFavorite(cur.char);
          window.soundEngine.playStar();
          favBtn.classList.toggle('active', isFav);
          favBtn.textContent = isFav ? '★' : '☆';
        }
      };
    }

    // 设置弹窗与自定义字卡弹窗
    this.bindModals();
  }

  // 移动端滑动切卡手势 (Swipe Left / Swipe Right)
  initTouchGestures() {
    const cardContainer = document.getElementById('flashcardWrapper');
    if (!cardContainer) return;

    cardContainer.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    cardContainer.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.touchEndY = e.changedTouches[0].screenY;
      this.handleSwipeGesture();
    }, { passive: true });
  }

  handleSwipeGesture() {
    const diffX = this.touchEndX - this.touchStartX;
    const diffY = this.touchEndY - this.touchStartY;
    const threshold = 45; // 触发滑动的像素阈值

    // 确保水平滑动幅度明显大于垂直滑动（避免和滚动冲突）
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
      if (diffX < 0) {
        // 向左划 -> 下一张
        this.nextCard();
      } else {
        // 向右划 -> 上一张
        this.prevCard();
      }
    }
  }

  // 渲染单元选项
  renderUnitSelector() {
    const select = document.getElementById('unitSelect');
    if (!select) return;

    select.innerHTML = `
      <option value="all">🌟 全部生字 (总复习 120+字)</option>
      ${this.database.units.map(u => `
        <option value="${u.id}" ${u.id === this.currentUnitId ? 'selected' : ''}>
          ${u.badge} | ${u.title} (${u.characters.length}字)
        </option>
      `).join('')}
    `;
  }

  // 加载当前符合条件的字卡列表
  loadCards() {
    let pool = [];
    if (this.currentUnitId === 'all') {
      this.database.units.forEach(u => pool.push(...u.characters));
    } else {
      const u = this.database.units.find(unit => unit.id === this.currentUnitId);
      pool = u ? [...u.characters] : [];
    }

    // 应用过滤器
    if (this.currentFilter === 'need_review') {
      pool = pool.filter(c => window.storageManager.isNeedReview(c.char));
    } else if (this.currentFilter === 'mastered') {
      pool = pool.filter(c => window.storageManager.isMastered(c.char));
    } else if (this.currentFilter === 'favorite') {
      pool = pool.filter(c => window.storageManager.isFavorite(c.char));
    }

    this.cardList = pool;
    if (this.currentIndex >= this.cardList.length) {
      this.currentIndex = Math.max(0, this.cardList.length - 1);
    }

    this.renderCard();
    this.updateStats();

    // 如果在字表列表页，同步刷新列表视图
    if (this.currentTab === 'list') {
      this.renderCharacterList();
    }
  }

  getCurrentCharacter() {
    if (!this.cardList || this.cardList.length === 0) return null;
    return this.cardList[this.currentIndex];
  }

  // 渲染单张卡片
  renderCard() {
    const flashcard = document.getElementById('flashcard');
    const emptyState = document.getElementById('cardEmptyState');
    const counterText = document.getElementById('cardCounter');

    if (!this.cardList || this.cardList.length === 0) {
      if (flashcard) flashcard.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      if (counterText) counterText.textContent = '0 / 0';
      return;
    }

    if (flashcard) flashcard.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    // 重置翻转状态到正面
    this.isCardFlipped = false;
    flashcard.classList.remove('is-flipped');

    const charObj = this.getCurrentCharacter();
    if (!charObj) return;

    if (counterText) {
      counterText.textContent = `${this.currentIndex + 1} / ${this.cardList.length}`;
    }

    // 填充正面内容
    const frontPinyin = document.getElementById('cardFrontPinyin');
    const frontChar = document.getElementById('cardFrontChar');
    const frontRadical = document.getElementById('cardFrontRadical');
    const frontStrokes = document.getElementById('cardFrontStrokes');
    const favBtn = document.getElementById('favCharBtn');

    if (frontPinyin) {
      frontPinyin.textContent = charObj.pinyin;
      frontPinyin.style.display = window.storageManager.settings.showPinyinOnFront ? 'block' : 'none';
    }
    if (frontChar) frontChar.textContent = charObj.char;
    if (frontRadical) frontRadical.textContent = `部首: ${charObj.radical}`;
    if (frontStrokes) frontStrokes.textContent = `${charObj.strokes}画`;

    if (favBtn) {
      const isFav = window.storageManager.isFavorite(charObj.char);
      favBtn.classList.toggle('active', isFav);
      favBtn.textContent = isFav ? '★' : '☆';
    }

    // 填充背面内容
    const backChar = document.getElementById('cardBackChar');
    const backPinyin = document.getElementById('cardBackPinyin');
    const backEnglish = document.getElementById('cardBackEnglish');
    const backWordsContainer = document.getElementById('cardBackWords');
    const backSentence = document.getElementById('cardBackSentence');
    const backMnemonic = document.getElementById('cardBackMnemonic');
    const backStrokeOrder = document.getElementById('cardBackStrokeOrder');

    if (backChar) backChar.textContent = charObj.char;
    if (backPinyin) backPinyin.textContent = charObj.pinyin;
    if (backEnglish) backEnglish.textContent = charObj.english || '';

    if (backWordsContainer) {
      backWordsContainer.innerHTML = charObj.words.map(w => `
        <span class="word-tag no-flip" onclick="event.stopPropagation(); window.soundEngine.speak('${w}');">
          ${w} 🔊
        </span>
      `).join('');
    }

    if (backSentence) {
      backSentence.textContent = charObj.sentence;
    }

    const speakSentenceBtn = document.getElementById('speakSentenceBtn');
    if (speakSentenceBtn) {
      speakSentenceBtn.onclick = (e) => {
        e.stopPropagation();
        window.soundEngine.speak(charObj.sentence);
      };
    }

    if (backMnemonic) {
      backMnemonic.textContent = charObj.mnemonic || charObj.hint || '熟读成诵，天天进步！';
    }

    if (backStrokeOrder && charObj.strokeOrder) {
      backStrokeOrder.innerHTML = charObj.strokeOrder.map((s, i) => `
        <span class="stroke-step-badge">${i + 1}.${s}</span>
      `).join('');
    }

    this.updateCardStatusBadge();
  }

  // 翻转卡片
  flipCard() {
    const flashcard = document.getElementById('flashcard');
    if (!flashcard) return;

    this.isCardFlipped = !this.isCardFlipped;
    flashcard.classList.toggle('is-flipped', this.isCardFlipped);
    window.soundEngine.playFlip();

    // 翻转到背面时，自动朗读例句或词语
    if (this.isCardFlipped) {
      window.storageManager.incrementFlipCount();
      const cur = this.getCurrentCharacter();
      if (cur) {
        setTimeout(() => {
          window.soundEngine.speakCard(cur);
        }, 200);
      }
    }
  }

  // 下一张卡片
  nextCard() {
    if (this.cardList.length === 0) return;
    window.soundEngine.playPop();
    this.currentIndex = (this.currentIndex + 1) % this.cardList.length;
    this.renderCard();

    // 自动朗读正面新字
    const cur = this.getCurrentCharacter();
    if (cur) {
      setTimeout(() => window.soundEngine.speak(cur.char), 250);
    }
  }

  // 上一张卡片
  prevCard() {
    if (this.cardList.length === 0) return;
    window.soundEngine.playPop();
    this.currentIndex = (this.currentIndex - 1 + this.cardList.length) % this.cardList.length;
    this.renderCard();

    const cur = this.getCurrentCharacter();
    if (cur) {
      setTimeout(() => window.soundEngine.speak(cur.char), 250);
    }
  }

  // 状态徽章更新
  updateCardStatusBadge() {
    const cur = this.getCurrentCharacter();
    const badge = document.getElementById('cardStatusBadge');
    if (!badge || !cur) return;

    if (window.storageManager.isMastered(cur.char)) {
      badge.className = 'card-status-badge badge-mastered';
      badge.textContent = '🌟 已掌握';
      badge.style.display = 'inline-block';
    } else if (window.storageManager.isNeedReview(cur.char)) {
      badge.className = 'card-status-badge badge-review';
      badge.textContent = '🔁 待复习';
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  // 自动巡航轮播控制
  toggleAutoPlay() {
    this.isAutoPlaying = !this.isAutoPlaying;
    const btn = document.getElementById('autoPlayBtn');
    if (!btn) return;

    if (this.isAutoPlaying) {
      btn.classList.add('active');
      btn.innerHTML = '<span>⏸ 暂停巡航</span>';
      this.runAutoPlayStep();
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<span>▶ 自动巡航</span>';
      if (this.autoPlayTimer) clearTimeout(this.autoPlayTimer);
    }
  }

  runAutoPlayStep() {
    if (!this.isAutoPlaying) return;
    const interval = (window.storageManager.settings.autoPlayInterval || 3.5) * 1000;

    // 朗读当前字
    const cur = this.getCurrentCharacter();
    if (cur) {
      window.soundEngine.speakCard(cur);
    }

    this.autoPlayTimer = setTimeout(() => {
      if (this.isAutoPlaying) {
        this.nextCard();
        this.runAutoPlayStep();
      }
    }, interval);
  }

  // 切换底部主要视图 (字卡 / 描红写字 / 游戏 / 字表)
  switchTab(tabId) {
    this.currentTab = tabId;
    window.soundEngine.playPop();

    // 更新底部高亮状态
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
    });

    // 隐藏所有视图
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.remove('active');
    });

    // 激活对应视图
    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) activeView.classList.add('active');

    // 处理各个视图的初始化
    if (tabId === 'write') {
      this.initWriteView();
    } else if (tabId === 'game') {
      this.initGameView();
    } else if (tabId === 'list') {
      this.renderCharacterList();
    } else if (tabId === 'card') {
      this.renderCard();
    }
  }

  // 初始化手写描红视图
  initWriteView() {
    const cur = this.getCurrentCharacter();
    const char = cur ? cur.char : '人';
    const canvas = document.getElementById('writeCanvas');
    const writeCharLabel = document.getElementById('writeCurrentCharLabel');
    const writePinyinLabel = document.getElementById('writeCurrentPinyinLabel');

    if (writeCharLabel) writeCharLabel.textContent = char;
    if (writePinyinLabel && cur) writePinyinLabel.textContent = cur.pinyin;

    if (!this.canvasWriter) {
      this.canvasWriter = new window.CanvasWriter(canvas, {
        gridType: window.storageManager.settings.gridType,
        char: char
      });

      // 绑定写字板工具条
      document.getElementById('clearCanvasBtn').onclick = () => {
        window.soundEngine.playPop();
        this.canvasWriter.clear();
      };
      document.getElementById('undoCanvasBtn').onclick = () => {
        window.soundEngine.playPop();
        this.canvasWriter.undo();
      };
      document.getElementById('toggleOutlineBtn').onclick = (e) => {
        window.soundEngine.playPop();
        const active = this.canvasWriter.toggleOutline();
        e.currentTarget.classList.toggle('active', active);
      };

      // 颜色盘选择
      document.querySelectorAll('.color-dot').forEach(dot => {
        dot.onclick = () => {
          document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
          const color = dot.getAttribute('data-color');
          this.canvasWriter.setColor(color);
        };
      });

      // 橡皮擦
      const eraserBtn = document.getElementById('eraserBtn');
      if (eraserBtn) {
        eraserBtn.onclick = () => {
          document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
          eraserBtn.classList.toggle('active');
          if (eraserBtn.classList.contains('active')) {
            this.canvasWriter.setEraser();
          } else {
            this.canvasWriter.setColor('#2D3436');
          }
        };
      }

      // 上一字/下一字练写
      document.getElementById('writePrevBtn').onclick = () => {
        this.prevCard();
        this.initWriteView();
      };
      document.getElementById('writeNextBtn').onclick = () => {
        this.nextCard();
        this.initWriteView();
      };
      document.getElementById('writeSpeakBtn').onclick = () => {
        const curChar = this.getCurrentCharacter();
        if (curChar) window.soundEngine.speak(curChar.char);
      };
    } else {
      this.canvasWriter.setCharacter(char);
      this.canvasWriter.setGridType(window.storageManager.settings.gridType);
      this.canvasWriter.resize();
    }
  }

  // 初始化游戏视图
  initGameView() {
    const gameContainer = document.getElementById('gameDynamicContainer');
    if (!gameContainer) return;

    // 默认启动听音辨字游戏
    window.gameEngine.startListeningGame(this.cardList, gameContainer);

    // 绑定游戏子模式切换
    document.querySelectorAll('.game-mode-tab-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.game-mode-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');

        if (mode === 'listen') {
          window.gameEngine.startListeningGame(this.cardList, gameContainer);
        } else if (mode === 'pair') {
          window.gameEngine.startPairGame(this.cardList, gameContainer);
        } else if (mode === 'quiz') {
          window.gameEngine.startQuizChallenge(this.cardList, gameContainer);
        }
      };
    });
  }

  // 渲染所有生字一览表
  renderCharacterList() {
    const grid = document.getElementById('characterListGrid');
    const searchInput = document.getElementById('charSearchInput');
    if (!grid) return;

    let chars = [...this.cardList];
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (query) {
      chars = chars.filter(c => 
        c.char.includes(query) || 
        c.pinyin.toLowerCase().includes(query) ||
        (c.words && c.words.some(w => w.includes(query)))
      );
    }

    grid.innerHTML = chars.map((c, idx) => {
      const isMaster = window.storageManager.isMastered(c.char);
      const isReview = window.storageManager.isNeedReview(c.char);
      const statusClass = isMaster ? 'char-tile-mastered' : isReview ? 'char-tile-review' : '';

      return `
        <div class="char-tile ${statusClass}" data-char="${c.char}">
          <span class="tile-pinyin">${c.pinyin}</span>
          <span class="tile-char">${c.char}</span>
          <div class="tile-status-icon">
            ${isMaster ? '⭐' : isReview ? '🔁' : ''}
          </div>
        </div>
      `;
    }).join('');

    // 点击任意字直达该字卡
    grid.querySelectorAll('.char-tile').forEach(tile => {
      tile.onclick = () => {
        const char = tile.getAttribute('data-char');
        const foundIdx = this.cardList.findIndex(c => c.char === char);
        if (foundIdx !== -1) {
          this.currentIndex = foundIdx;
          this.switchTab('card');
          window.soundEngine.speak(char);
        }
      };
    });

    if (searchInput) {
      searchInput.oninput = () => this.renderCharacterList();
    }
  }

  // 更新掌握统计栏
  updateStats() {
    const masteredCount = window.storageManager.mastered.size;
    const reviewCount = window.storageManager.needReview.size;
    const starPoints = window.storageManager.stats.starPoints || 0;

    const masterEl = document.getElementById('statMasteredCount');
    const reviewEl = document.getElementById('statReviewCount');
    const starEl = document.getElementById('statStarPoints');

    if (masterEl) masterEl.textContent = masteredCount;
    if (reviewEl) reviewEl.textContent = reviewCount;
    if (starEl) starEl.textContent = starPoints;
  }

  // 应用用户偏好设置 (米字格/田字格, 护眼模式, 拼音隐藏)
  applySettings() {
    const s = window.storageManager.settings;
    const body = document.body;

    // 护眼暖色模式
    body.classList.toggle('eye-care-theme', !!s.eyeCareMode);

    // 网格样式
    const frontCardInner = document.querySelector('.tianzige-bg');
    if (frontCardInner) {
      frontCardInner.classList.remove('grid-mizige', 'grid-tianzige', 'grid-none');
      frontCardInner.classList.add(`grid-${s.gridType}`);
    }

    if (this.canvasWriter) {
      this.canvasWriter.setGridType(s.gridType);
    }
  }

  // 弹窗逻辑 (设置弹窗、添加生字、打印字卡)
  bindModals() {
    // 设置弹窗
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');

    if (openSettingsBtn && settingsModal) {
      openSettingsBtn.onclick = () => {
        this.fillSettingsForm();
        settingsModal.style.display = 'flex';
      };
    }
    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.onclick = () => {
        settingsModal.style.display = 'none';
      };
    }

    // 保存设置表单
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      settingsForm.onsubmit = (e) => {
        e.preventDefault();
        const showPinyin = document.getElementById('settingShowPinyin').checked;
        const gridType = document.getElementById('settingGridType').value;
        const eyeCare = document.getElementById('settingEyeCare').checked;
        const interval = parseFloat(document.getElementById('settingAutoPlaySpeed').value) || 3.5;
        const voiceName = document.getElementById('settingVoiceSelect') ? document.getElementById('settingVoiceSelect').value : '';

        window.storageManager.saveSetting('showPinyinOnFront', showPinyin);
        window.storageManager.saveSetting('gridType', gridType);
        window.storageManager.saveSetting('eyeCareMode', eyeCare);
        window.storageManager.saveSetting('autoPlayInterval', interval);
        window.storageManager.saveSetting('preferredVoiceName', voiceName);

        this.applySettings();
        this.renderCard();
        settingsModal.style.display = 'none';
        window.soundEngine.playPop();
      };
    }

    // 重置进度
    const resetBtn = document.getElementById('btnResetProgress');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm('确定要清空所有已掌握和复习记录，重新开始吗？')) {
          window.storageManager.resetProgress();
          this.loadCards();
          this.updateStats();
          alert('学习记录已重置！');
        }
      };
    }

    // 添加自定义字卡弹窗
    const openAddCardBtn = document.getElementById('openAddCardBtn');
    const addCardModal = document.getElementById('addCardModal');
    const closeAddCardBtn = document.getElementById('closeAddCardBtn');
    const addCardForm = document.getElementById('addCardForm');

    if (openAddCardBtn && addCardModal) {
      openAddCardBtn.onclick = () => {
        addCardModal.style.display = 'flex';
      };
    }
    if (closeAddCardBtn && addCardModal) {
      closeAddCardBtn.onclick = () => {
        addCardModal.style.display = 'none';
      };
    }
    if (addCardForm) {
      addCardForm.onsubmit = (e) => {
        e.preventDefault();
        const char = document.getElementById('inputChar').value.trim();
        const pinyin = document.getElementById('inputPinyin').value.trim();
        const wordsStr = document.getElementById('inputWords').value.trim();
        const sentence = document.getElementById('inputSentence').value.trim();
        const english = document.getElementById('inputEnglish').value.trim();

        if (!char || !pinyin) {
          alert('请至少输入汉字和拼音！');
          return;
        }

        const newCard = {
          char,
          pinyin,
          radical: '自定义',
          strokes: char.length,
          strokeOrder: [],
          words: wordsStr ? wordsStr.split(/[,， ]+/) : [`${char}子`],
          sentence: sentence || `这是生字“${char}”。`,
          english: english || 'custom character',
          mnemonic: '自主拓展字词'
        };

        window.storageManager.addCustomCard(newCard);
        this.setupData();
        this.renderUnitSelector();
        this.currentUnitId = 'unit-custom';
        this.loadCards();
        addCardModal.style.display = 'none';
        addCardForm.reset();
        alert(`成功添加生字“${char}”！`);
      };
    }

    // 打印当前单元字卡
    const printBtn = document.getElementById('btnPrintCards');
    if (printBtn) {
      printBtn.onclick = () => {
        window.print();
      };
    }
  }

  fillSettingsForm() {
    const s = window.storageManager.settings;
    const showPinyinEl = document.getElementById('settingShowPinyin');
    const gridTypeEl = document.getElementById('settingGridType');
    const eyeCareEl = document.getElementById('settingEyeCare');
    const speedEl = document.getElementById('settingAutoPlaySpeed');
    const voiceSelect = document.getElementById('settingVoiceSelect');
    const testVoiceBtn = document.getElementById('btnTestVoice');

    if (showPinyinEl) showPinyinEl.checked = s.showPinyinOnFront;
    if (gridTypeEl) gridTypeEl.value = s.gridType;
    if (eyeCareEl) eyeCareEl.checked = s.eyeCareMode;
    if (speedEl) speedEl.value = s.autoPlayInterval || 3.5;

    // 填充中文语音选项
    if (voiceSelect) {
      const chineseVoices = window.soundEngine.getAvailableChineseVoices();
      if (chineseVoices.length > 0) {
        voiceSelect.innerHTML = `
          <option value="">自动优选标准普通话 (${chineseVoices[0].name})</option>
          ${chineseVoices.map(v => `
            <option value="${v.name}" ${v.name === s.preferredVoiceName ? 'selected' : ''}>
              ${v.name} [${v.lang}]
            </option>
          `).join('')}
        `;
      } else {
        voiceSelect.innerHTML = `
          <option value="">未加载到专属中文语音 (使用系统默认)</option>
        `;
      }
    }

    if (testVoiceBtn) {
      testVoiceBtn.onclick = () => {
        const chosenVoice = voiceSelect ? voiceSelect.value : null;
        window.soundEngine.testVoice(chosenVoice);
      };
    }
  }
}

// 页面加载完成后实例化
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
