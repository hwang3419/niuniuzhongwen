/**
 * 学习进度与设置持久化存储 (LocalStorage Manager)
 * 记录：已掌握、需复习、收藏星标、自定义字卡、家长偏好设置
 */

const STORAGE_KEYS = {
  MASTERED: 'mlp_mastered_chars',
  NEED_REVIEW: 'mlp_need_review_chars',
  FAVORITES: 'mlp_favorite_chars',
  CUSTOM_CARDS: 'mlp_custom_cards',
  SETTINGS: 'mlp_app_settings',
  STATS: 'mlp_learning_stats'
};

const DEFAULT_SETTINGS = {
  showPinyinOnFront: true,    // 正面是否显示拼音
  gridType: 'mizige',          // 'mizige' (米字格), 'tianzige' (田字格), 'none' (纯白无格)
  autoPlayInterval: 3.5,       // 自动巡航轮播间隔 (秒)
  speechRate: 0.85,            // 朗读语速
  soundEffects: true,          // 音效开关
  eyeCareMode: false           // 柔和护眼模式
};

class StorageManager {
  constructor() {
    this.mastered = new Set(this._load(STORAGE_KEYS.MASTERED, []));
    this.needReview = new Set(this._load(STORAGE_KEYS.NEED_REVIEW, []));
    this.favorites = new Set(this._load(STORAGE_KEYS.FAVORITES, []));
    this.customCards = this._load(STORAGE_KEYS.CUSTOM_CARDS, []);
    this.settings = Object.assign({}, DEFAULT_SETTINGS, this._load(STORAGE_KEYS.SETTINGS, {}));
    this.stats = this._load(STORAGE_KEYS.STATS, {
      totalCardsFlipped: 0,
      quizCount: 0,
      correctCount: 0,
      starPoints: 10
    });
  }

  _load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
      return fallback;
    }
  }

  _save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // 标记掌握
  markMastered(charStr) {
    this.mastered.add(charStr);
    this.needReview.delete(charStr);
    this.stats.starPoints += 2;
    this._persistStatus();
  }

  // 标记需复习
  markNeedReview(charStr) {
    this.needReview.add(charStr);
    this.mastered.delete(charStr);
    this._persistStatus();
  }

  // 取消状态 (重置为未标记)
  clearStatus(charStr) {
    this.mastered.delete(charStr);
    this.needReview.delete(charStr);
    this._persistStatus();
  }

  // 切换收藏
  toggleFavorite(charStr) {
    if (this.favorites.has(charStr)) {
      this.favorites.delete(charStr);
    } else {
      this.favorites.add(charStr);
    }
    this._save(STORAGE_KEYS.FAVORITES, Array.from(this.favorites));
    return this.favorites.has(charStr);
  }

  isMastered(charStr) {
    return this.mastered.has(charStr);
  }

  isNeedReview(charStr) {
    return this.needReview.has(charStr);
  }

  isFavorite(charStr) {
    return this.favorites.has(charStr);
  }

  _persistStatus() {
    this._save(STORAGE_KEYS.MASTERED, Array.from(this.mastered));
    this._save(STORAGE_KEYS.NEED_REVIEW, Array.from(this.needReview));
    this._save(STORAGE_KEYS.STATS, this.stats);
  }

  // 增加翻卡计数
  incrementFlipCount() {
    this.stats.totalCardsFlipped++;
    this._save(STORAGE_KEYS.STATS, this.stats);
  }

  // 保存设置
  saveSetting(key, val) {
    this.settings[key] = val;
    this._save(STORAGE_KEYS.SETTINGS, this.settings);
  }

  // 添加自定义字卡
  addCustomCard(cardData) {
    this.customCards.push(cardData);
    this._save(STORAGE_KEYS.CUSTOM_CARDS, this.customCards);
  }

  // 批量导入
  importCustomCards(cardsArray) {
    this.customCards = cardsArray;
    this._save(STORAGE_KEYS.CUSTOM_CARDS, this.customCards);
  }

  // 重置学习进度
  resetProgress() {
    this.mastered.clear();
    this.needReview.clear();
    this.stats.totalCardsFlipped = 0;
    this.stats.quizCount = 0;
    this.stats.correctCount = 0;
    this.stats.starPoints = 10;
    this._persistStatus();
  }
}

window.storageManager = new StorageManager();
