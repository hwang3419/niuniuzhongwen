/**
 * 音频与语音合成管理器 (Audio & Speech Synthesis Engine)
 * 1. Web Speech API (TTS): 严格匹配标准中文普通话语音，杜绝读成英文或拼音字母
 * 2. 文本净化：自动过滤拼音与英文字符，只传纯正汉字，确保发音纯正
 * 3. Web Audio API 纯代码合成音效: 翻牌声、叮咚答对、鼓励小星星、欢呼胜利
 * 100% 本地免网络生成，完全无依赖，低延迟
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.speechSynthesis = window.speechSynthesis || null;
    this.chineseVoice = null;
    this.speechRate = 0.85; // 适合少儿的温和语速
    this.isMuted = false;
    this.unlocked = false;
    this._currentUtterance = null; // 防止 Chrome 垃圾回收 bug

    this.initAudioContext();
    this.initVoices();
  }

  // 移动端音频上下文解锁
  initAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.audioCtx = new AudioContextClass();
    }

    const unlockHandler = () => {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      // 唤醒 iOS SpeechSynthesis
      if (this.speechSynthesis && !this.unlocked) {
        const silentUtterance = new SpeechSynthesisUtterance(' ');
        silentUtterance.lang = 'zh-CN';
        this.speechSynthesis.speak(silentUtterance);
        this.unlocked = true;
      }
      document.removeEventListener('touchstart', unlockHandler, true);
      document.removeEventListener('click', unlockHandler, true);
    };

    document.addEventListener('touchstart', unlockHandler, true);
    document.addEventListener('click', unlockHandler, true);
  }

  // 初始化并监听系统语音列表加载
  initVoices() {
    if (!this.speechSynthesis) return;

    const loadVoices = () => {
      this.chineseVoice = this.getBestChineseVoice();
    };

    loadVoices();
    if (this.speechSynthesis.onvoiceschanged !== undefined) {
      this.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  // 获取所有可用的中文语音列表
  getAvailableChineseVoices() {
    if (!this.speechSynthesis) return [];
    const allVoices = this.speechSynthesis.getVoices() || [];

    return allVoices.filter(v => {
      const lang = (v.lang || '').toLowerCase().replace(/_/g, '-');
      const name = (v.name || '').toLowerCase();
      return (
        lang.startsWith('zh') ||
        lang.startsWith('cmn') ||
        name.includes('chinese') ||
        name.includes('mandarin') ||
        name.includes('普通话') ||
        name.includes('国语') ||
        name.includes('tingting') ||
        name.includes('meijia') ||
        name.includes('sinji') ||
        name.includes('xiaoxiao') ||
        name.includes('yunxi') ||
        name.includes('yaoyao') ||
        name.includes('flo') ||
        name.includes('eddy') ||
        name.includes('grandma') ||
        name.includes('grandpa') ||
        name.includes('reed') ||
        name.includes('rocko') ||
        name.includes('sandy') ||
        name.includes('shelley') ||
        name.includes('huihui') ||
        name.includes('kangkang') ||
        name.includes('yaoyao')
      );
    });
  }

  // 严格智能匹配最佳中文语音
  getBestChineseVoice(preferredVoiceName = null) {
    if (!this.speechSynthesis) return null;

    const chineseVoices = this.getAvailableChineseVoices();
    if (chineseVoices.length === 0) {
      return null;
    }

    // 1. 如果用户在设置里选定了语音名称，优先匹配
    const savedName = preferredVoiceName || window.storageManager?.settings?.preferredVoiceName;
    if (savedName) {
      const userChoice = chineseVoices.find(v => v.name === savedName);
      if (userChoice) return userChoice;
    }

    // 2. 优先匹配优质普通话女声/儿童友好声
    const topPicks = [
      'tingting',            // macOS / iOS 经典普通话
      'xiaoxiao',            // Windows / Edge 高清自然普通话
      'google 普通话',       // Android / Chrome
      'google chinese',
      'shelley',
      'flo',
      'sandy',
      'sinji',
      'meijia',
      'yunxi',
      'yaoyao',
      'huihui'
    ];

    for (const pick of topPicks) {
      const found = chineseVoices.find(v => v.name.toLowerCase().includes(pick));
      if (found) return found;
    }

    // 3. 匹配大陆普通话 (zh-CN / cmn-Hans-CN)
    const mainlandVoice = chineseVoices.find(v => {
      const lang = (v.lang || '').toLowerCase().replace(/_/g, '-');
      return lang === 'zh-cn' || lang === 'cmn-hans-cn' || lang.includes('zh-hans');
    });
    if (mainlandVoice) return mainlandVoice;

    // 4. 任意中文语音 (zh-TW, zh-HK)
    return chineseVoices[0];
  }

  // 核心文本净化：滤除英文字母及拼音，只保留纯正中文汉字
  cleanTextForSpeech(text) {
    if (!text) return '';
    
    // 过滤掉所有英文字母 (a-z, A-Z) 及带声调的拼音字母 (āáǎà 等)
    // 彻底杜绝系统把拼音当作英语单词拼读！
    let cleaned = text
      .replace(/[a-zA-Zāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜü]+/g, ' ')
      .replace(/[\(\)（）\[\]【】\/\\#@*]/g, ' ')
      .replace(/\s+([，。！？、])/g, '$1')
      .replace(/([，。！？、])\s+/g, '$1')
      .replace(/([，。！？、])+/g, '$1')
      .replace(/^[，。！？、\s]+|[，。！？、\s]+$/g, '')
      .trim();

    if (cleaned && !/[，。！？、]$/.test(cleaned)) {
      cleaned += '。';
    }

    return cleaned;
  }

  // 朗读指定中文内容
  speak(text, customRate = null) {
    if (!this.speechSynthesis || this.isMuted) return;

    // 文本净化，确保没有英文字符和拼音字母
    const cleanedText = this.cleanTextForSpeech(text);
    if (!cleanedText) {
      console.warn('speak() skipped: no Chinese characters found in input:', text);
      return;
    }

    // 停止之前的朗读
    try {
      this.speechSynthesis.cancel();
    } catch (e) {
      console.warn('SpeechSynthesis cancel error:', e);
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // 动态获取最佳中文语音
    const bestVoice = this.getBestChineseVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang || 'zh-CN';
    } else {
      // 哪怕没有加载到独立语音对象，也强制指定中文普通话语言代码
      utterance.lang = 'zh-CN';
    }

    utterance.rate = customRate || this.speechRate;
    utterance.pitch = 1.05; // 温和亲切的语调

    // 保留引用以避免垃圾回收
    this._currentUtterance = utterance;
    utterance.onend = () => {
      this._currentUtterance = null;
    };
    utterance.onerror = (err) => {
      console.warn('TTS playback error:', err);
      this._currentUtterance = null;
    };

    this.speechSynthesis.speak(utterance);
    return utterance;
  }

  // 纯中文朗读生字卡片：汉字 -> 词组 -> 例句（绝不包含英文拼音）
  speakCard(charObj) {
    if (!charObj) return;

    const wordsText = (charObj.words && charObj.words.length > 0)
      ? charObj.words.slice(0, 2).join('，')
      : '';
    const sentenceText = charObj.sentence || '';

    // 构造纯汉字句子，让语音引擎完全按照标准中文朗读
    const textToRead = wordsText
      ? `${charObj.char}。${wordsText}。${sentenceText}`
      : `${charObj.char}。${sentenceText}`;

    this.speak(textToRead);
  }

  // 停止当前所有语音播放
  stop() {
    if (this.speechSynthesis) {
      try {
        this.speechSynthesis.cancel();
      } catch (e) {
        console.warn('SpeechSynthesis cancel error:', e);
      }
      this._currentUtterance = null;
    }
  }

  // 试听测试语音
  testVoice(voiceName = null) {
    const testText = '你好！我是你的中文识字小助手，我们一起快乐学汉字吧！';
    const originalRate = this.speechRate;
    
    const voices = this.getAvailableChineseVoices();
    const chosen = voices.find(v => v.name === voiceName) || this.getBestChineseVoice(voiceName);

    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(testText);
      if (chosen) {
        utterance.voice = chosen;
        utterance.lang = chosen.lang || 'zh-CN';
      } else {
        utterance.lang = 'zh-CN';
      }
      utterance.rate = originalRate;
      this.speechSynthesis.speak(utterance);
    }
  }

  // 切换语速 (标准 / 慢速)
  toggleSpeed() {
    this.speechRate = this.speechRate === 0.85 ? 0.65 : 0.85;
    return this.speechRate;
  }

  /* ====================== Web Audio API 合成音效 ====================== */

  _getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // 1. 卡片翻转音效 (温润纸张沙沙感)
  playFlip() {
    if (this.isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // 2. 答对/点赞音效 (清脆向上的琴音 C5 -> G5)
  playCorrect() {
    if (this.isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.26);
    });
  }

  // 3. 鼓励/再想想音效 (温和柔和的低音跳跃，不给孩子挫败感)
  playEncourage() {
    if (this.isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [392.00, 329.63]; // G4 -> E4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.15, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.23);
    });
  }

  // 4. 点亮小星星音效 (清脆水晶音)
  playStar() {
    if (this.isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1174.66, now); // D6
    osc.frequency.exponentialRampToValueAtTime(1760.00, now + 0.15); // A6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  // 5. 按钮点击微音 (轻巧可爱的气泡波声)
  playPop() {
    if (this.isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // 6. 闯关完成大欢呼乐曲
  playVictory() {
    if (this.isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    // 胜利号角简谱: 1 3 5 1'
    const melody = [
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.5, d: 0.35 }
    ];

    let t = ctx.currentTime;
    melody.forEach(item => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + item.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + item.d + 0.02);
      t += item.d + 0.04;
    });
  }
}

// 导出单例
window.soundEngine = new SoundEngine();
