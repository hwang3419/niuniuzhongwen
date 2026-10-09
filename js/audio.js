/**
 * 音频与语音合成管理器 (Audio & Speech Synthesis Engine)
 * 1. Web Speech API (TTS): 原生中文朗读汉字、拼音、词组、例句
 * 2. Web Audio API 纯代码合成音效: 翻牌声、叮咚答对、鼓励小星星、欢呼胜利
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
        const silentUtterance = new SpeechSynthesisUtterance('');
        this.speechSynthesis.speak(silentUtterance);
        this.unlocked = true;
      }
      document.removeEventListener('touchstart', unlockHandler, true);
      document.removeEventListener('click', unlockHandler, true);
    };

    document.addEventListener('touchstart', unlockHandler, true);
    document.addEventListener('click', unlockHandler, true);
  }

  // 初始化并选择最佳中文语音
  initVoices() {
    if (!this.speechSynthesis) return;

    const findVoice = () => {
      const voices = this.speechSynthesis.getVoices();
      // 优先选择优质中文女声/普通话
      this.chineseVoice = voices.find(v => 
        (v.lang === 'zh-CN' || v.lang === 'zh_CN') && 
        (v.name.includes('Tingting') || v.name.includes('Li-Mu') || v.name.includes('Google') || v.name.includes('Yaoyao') || v.name.includes('Sinji') || v.name.includes('Xiaoxiao'))
      ) || voices.find(v => v.lang.startsWith('zh')) || null;
    };

    findVoice();
    if (this.speechSynthesis.onvoiceschanged !== undefined) {
      this.speechSynthesis.onvoiceschanged = findVoice;
    }
  }

  // 朗读指定文字
  speak(text, customRate = null) {
    if (!this.speechSynthesis || this.isMuted) return;

    // 停止之前正在朗读的内容
    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    if (this.chineseVoice) {
      utterance.voice = this.chineseVoice;
    }
    utterance.rate = customRate || this.speechRate;
    utterance.pitch = 1.05; // 稍微偏童趣亲切的语调

    this.speechSynthesis.speak(utterance);
    return utterance;
  }

  // 连续朗读汉字与例句
  speakCard(charObj) {
    if (!charObj) return;
    const textToRead = `${charObj.char}。${charObj.pinyin}。${charObj.words.slice(0, 2).join('，')}。${charObj.sentence}`;
    this.speak(textToRead);
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
