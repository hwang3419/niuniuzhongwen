/**
 * 儿童趣味识字互动游戏模块 (Interactive Literacy Games)
 * 1. 听音辨字 (Listening Challenge)
 * 2. 看字组词对对碰 (Word Pairing Game)
 * 3. 识字10题闯关 (Comprehensive Rapid Challenge)
 */

class GameEngine {
  constructor() {
    this.currentMode = null; // 'listen' | 'pair' | 'quiz'
    this.currentQuestion = null;
    this.score = 0;
    this.streak = 0;
    this.totalQuestions = 10;
    this.currentQuestionIndex = 0;
    this.wrongAnswers = [];
    this.pairCards = [];
    this.selectedPairCard = null;
  }

  // 1. 初始化【听音辨字】游戏
  startListeningGame(characters, containerElement) {
    this.currentMode = 'listen';
    this.pool = characters && characters.length >= 4 ? characters : getAllCharacters();
    this.score = 0;
    this.streak = 0;
    this.container = containerElement;
    this.nextListeningQuestion();
  }

  nextListeningQuestion() {
    if (!this.pool || this.pool.length < 4) return;

    // 随机选择目标字
    const targetIdx = Math.floor(Math.random() * this.pool.length);
    const targetChar = this.pool[targetIdx];

    // 随机挑选3个干扰项
    const distractors = [];
    while (distractors.length < 3) {
      const randChar = this.pool[Math.floor(Math.random() * this.pool.length)];
      if (randChar.char !== targetChar.char && !distractors.find(d => d.char === randChar.char)) {
        distractors.push(randChar);
      }
    }

    // 乱序排列4个选项
    const options = [targetChar, ...distractors].sort(() => Math.random() - 0.5);
    this.currentQuestion = { target: targetChar, options };

    // 渲染游戏界面
    this.renderListeningUI();

    // 自动播放读音
    setTimeout(() => {
      window.soundEngine.speak(targetChar.char);
    }, 300);
  }

  renderListeningUI() {
    if (!this.container) return;
    const target = this.currentQuestion.target;
    const options = this.currentQuestion.options;

    this.container.innerHTML = `
      <div class="game-container game-listen-wrap">
        <div class="game-header">
          <div class="game-stat-pill">得分: <span class="score-num">${this.score}</span></div>
          <div class="game-stat-pill streak-pill">连对: <span class="streak-num">🔥 ${this.streak}</span></div>
        </div>

        <div class="listening-prompt-card">
          <button class="sound-bubble-btn" id="replaySoundBtn" title="再听一次">
            <span class="icon-speaker">🔊</span>
            <span class="bubble-ripple"></span>
          </button>
          <div class="prompt-text">仔细听声音，选出对应的汉字哦！</div>
          <div class="prompt-subtext">点击上方大喇叭可重复收听</div>
        </div>

        <div class="listen-options-grid">
          ${options.map((opt, idx) => `
            <button class="listen-char-card" data-char="${opt.char}">
              <div class="char-tianzige-inner">
                <span class="char-display">${opt.char}</span>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // 绑定重复收听
    document.getElementById('replaySoundBtn').onclick = () => {
      window.soundEngine.speak(target.char);
    };

    // 绑定选项点击
    this.container.querySelectorAll('.listen-char-card').forEach(btn => {
      btn.onclick = (e) => {
        const selectedChar = btn.getAttribute('data-char');
        this.handleListeningAnswer(btn, selectedChar === target.char);
      };
    });
  }

  handleListeningAnswer(buttonElement, isCorrect) {
    const target = this.currentQuestion.target;
    const allBtns = this.container.querySelectorAll('.listen-char-card');
    allBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
      this.score += 10;
      this.streak += 1;
      buttonElement.classList.add('correct-glow');
      window.soundEngine.playCorrect();
      window.soundEngine.playStar();
      window.storageManager.markMastered(target.char);

      // 显示成功提示并进入下一题
      setTimeout(() => {
        window.soundEngine.speakCard(target);
      }, 350);

      setTimeout(() => {
        this.nextListeningQuestion();
      }, 1600);
    } else {
      this.streak = 0;
      buttonElement.classList.add('wrong-shake');
      window.soundEngine.playEncourage();
      window.storageManager.markNeedReview(target.char);

      // 高亮标出正确答案
      allBtns.forEach(b => {
        if (b.getAttribute('data-char') === target.char) {
          b.classList.add('correct-glow');
        }
      });

      setTimeout(() => {
        const hintWord = target.words && target.words.length > 0 ? target.words[0] : target.char;
        window.soundEngine.speak(`这是“${target.char}”。${hintWord}的“${target.char}”。`);
      }, 400);

      setTimeout(() => {
        this.nextListeningQuestion();
      }, 2200);
    }
  }

  // 2. 初始化【看字组词 / 连连看】游戏
  startPairGame(characters, containerElement) {
    this.currentMode = 'pair';
    this.container = containerElement;
    this.selectedPairCard = null;
    this.pool = characters && characters.length >= 6 ? characters : getAllCharacters();

    // 挑选含有2字词组的生字配对
    // 例如：大-山, 日-月, 水-果, 上-下, 朋-友, 天-空, 书-包, 白-云
    const pairDefinitions = [
      { a: "日", b: "月", word: "日月" },
      { a: "大", b: "小", word: "大小" },
      { a: "上", b: "下", word: "上下" },
      { a: "山", b: "水", word: "山水" },
      { a: "天", b: "地", word: "天地" },
      { a: "朋", b: "友", word: "朋友" },
      { a: "书", b: "包", word: "书包" },
      { a: "白", b: "云", word: "白云" },
      { a: "春", b: "风", word: "春风" },
      { a: "草", b: "地", word: "草地" },
      { a: "读", b: "书", word: "读书" },
      { a: "写", b: "字", word: "写字" }
    ];

    // 随机抽选 4 对（共8张卡片）
    const chosenPairs = pairDefinitions.sort(() => Math.random() - 0.5).slice(0, 4);
    
    const cards = [];
    chosenPairs.forEach((p, pairId) => {
      cards.push({ id: `c-${pairId}-a`, char: p.a, pairId: pairId, word: p.word });
      cards.push({ id: `c-${pairId}-b`, char: p.b, pairId: pairId, word: p.word });
    });

    this.pairCards = cards.sort(() => Math.random() - 0.5);
    this.matchedPairsCount = 0;
    this.totalPairsToMatch = chosenPairs.length;

    this.renderPairUI();
  }

  renderPairUI() {
    this.container.innerHTML = `
      <div class="game-container game-pair-wrap">
        <div class="game-prompt-bar">
          <span>🧩 点选两个汉字，拼成一个词语或反义词对！</span>
        </div>
        <div class="pair-grid">
          ${this.pairCards.map(c => `
            <button class="pair-card-item" id="${c.id}" data-pairid="${c.pairId}" data-char="${c.char}">
              <div class="pair-card-tianzige">
                <span class="pair-char">${c.char}</span>
              </div>
            </button>
          `).join('')}
        </div>
        <div class="pair-success-message" id="pairSuccessBanner" style="display:none;"></div>
      </div>
    `;

    this.container.querySelectorAll('.pair-card-item').forEach(btn => {
      btn.onclick = () => this.handlePairClick(btn);
    });
  }

  handlePairClick(btn) {
    if (btn.classList.contains('matched') || btn.classList.contains('selected')) return;

    window.soundEngine.playPop();
    const char = btn.getAttribute('data-char');
    window.soundEngine.speak(char);

    if (!this.selectedPairCard) {
      // 第一次点击
      this.selectedPairCard = btn;
      btn.classList.add('selected');
    } else {
      // 第二次点击
      const firstBtn = this.selectedPairCard;
      const pairId1 = firstBtn.getAttribute('data-pairid');
      const pairId2 = btn.getAttribute('data-pairid');

      if (pairId1 === pairId2) {
        // 配对成功！
        btn.classList.add('selected');
        window.soundEngine.playCorrect();
        window.soundEngine.playStar();

        firstBtn.classList.remove('selected');
        firstBtn.classList.add('matched');
        btn.classList.remove('selected');
        btn.classList.add('matched');

        const cardData = this.pairCards.find(c => c.id === btn.id);
        if (cardData) {
          setTimeout(() => {
            window.soundEngine.speak(`组词：${cardData.word}`);
          }, 300);
        }

        this.matchedPairsCount++;
        this.selectedPairCard = null;

        if (this.matchedPairsCount >= this.totalPairsToMatch) {
          // 全部完成！
          setTimeout(() => {
            window.soundEngine.playVictory();
            const banner = document.getElementById('pairSuccessBanner');
            if (banner) {
              banner.style.display = 'block';
              banner.innerHTML = `
                <div class="victory-modal">
                  <div class="victory-icon">🎉 🌟 🏆</div>
                  <h3>太棒啦！全部配对成功！</h3>
                  <button class="btn btn-primary btn-round" id="replayPairBtn">再玩一局</button>
                </div>
              `;
              document.getElementById('replayPairBtn').onclick = () => {
                this.startPairGame(this.pool, this.container);
              };
            }
          }, 800);
        }
      } else {
        // 配对失败
        btn.classList.add('selected');
        window.soundEngine.playEncourage();
        setTimeout(() => {
          firstBtn.classList.remove('selected');
          btn.classList.remove('selected');
          this.selectedPairCard = null;
        }, 500);
      }
    }
  }

  // 3. 初始化【识字10题闯关大挑战】
  startQuizChallenge(characters, containerElement) {
    this.currentMode = 'quiz';
    this.container = containerElement;
    this.pool = characters && characters.length >= 10 ? characters : getAllCharacters();
    this.currentQuestionIndex = 0;
    this.totalQuestions = 10;
    this.score = 0;
    this.wrongAnswers = [];

    // 生成10道不同类型的生字题目
    this.quizQuestions = this.generateQuizQuestions();
    this.renderQuizQuestion();
  }

  generateQuizQuestions() {
    const list = [...this.pool].sort(() => Math.random() - 0.5).slice(0, 10);
    return list.map((item, idx) => {
      // 随机题型: 1. 拼音找汉字, 2. 词语填空, 3. 听音辨字
      const types = ['pinyin', 'word', 'audio'];
      const qType = types[idx % types.length];

      // 生成3个干扰字
      const distractors = [];
      while (distractors.length < 3) {
        const rand = this.pool[Math.floor(Math.random() * this.pool.length)];
        if (rand.char !== item.char && !distractors.find(d => d.char === rand.char)) {
          distractors.push(rand);
        }
      }
      const options = [item, ...distractors].sort(() => Math.random() - 0.5);

      return {
        type: qType,
        target: item,
        options: options
      };
    });
  }

  renderQuizQuestion() {
    if (this.currentQuestionIndex >= this.totalQuestions) {
      this.renderQuizResult();
      return;
    }

    const q = this.quizQuestions[this.currentQuestionIndex];
    const target = q.target;
    let promptHtml = '';

    if (q.type === 'pinyin') {
      promptHtml = `
        <div class="quiz-prompt-type">看拼音选汉字</div>
        <div class="quiz-big-pinyin">${target.pinyin}</div>
        <div class="quiz-hint-text">哪一个是读作“${target.pinyin}”的汉字？</div>
      `;
    } else if (q.type === 'word') {
      const sampleWord = target.words[0] || `${target.char}子`;
      const maskedWord = sampleWord.replace(target.char, ' ( ? ) ');
      promptHtml = `
        <div class="quiz-prompt-type">词语选字填空</div>
        <div class="quiz-big-sentence">${maskedWord}</div>
        <div class="quiz-hint-text">请选出括号中缺失的汉字</div>
      `;
    } else {
      promptHtml = `
        <div class="quiz-prompt-type">听音辨字闯关</div>
        <button class="sound-bubble-btn" id="quizPlayAudioBtn">
          <span class="icon-speaker">🔊</span>
        </button>
        <div class="quiz-hint-text">点击喇叭收听发音并选字</div>
      `;
    }

    this.container.innerHTML = `
      <div class="game-container game-quiz-wrap">
        <div class="quiz-progress-bar-wrap">
          <div class="quiz-progress-text">第 ${this.currentQuestionIndex + 1} / ${this.totalQuestions} 题</div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${(this.currentQuestionIndex / this.totalQuestions) * 100}%"></div>
          </div>
        </div>

        <div class="quiz-card-prompt">
          ${promptHtml}
        </div>

        <div class="quiz-options-grid">
          ${q.options.map(opt => `
            <button class="quiz-option-btn" data-char="${opt.char}">
              <span class="quiz-opt-char">${opt.char}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    if (q.type === 'audio') {
      setTimeout(() => window.soundEngine.speak(target.char), 250);
      document.getElementById('quizPlayAudioBtn').onclick = () => window.soundEngine.speak(target.char);
    }

    this.container.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.onclick = () => {
        const isRight = btn.getAttribute('data-char') === target.char;
        this.handleQuizAnswer(btn, isRight, target);
      };
    });
  }

  handleQuizAnswer(btn, isRight, target) {
    this.container.querySelectorAll('.quiz-option-btn').forEach(b => b.disabled = true);

    if (isRight) {
      btn.classList.add('correct');
      window.soundEngine.playCorrect();
      this.score += 10;
      window.storageManager.markMastered(target.char);
    } else {
      btn.classList.add('wrong');
      window.soundEngine.playEncourage();
      this.wrongAnswers.push(target);
      window.storageManager.markNeedReview(target.char);

      // 标出正确答案
      this.container.querySelectorAll('.quiz-option-btn').forEach(b => {
        if (b.getAttribute('data-char') === target.char) {
          b.classList.add('correct');
        }
      });
    }

    setTimeout(() => {
      this.currentQuestionIndex++;
      this.renderQuizQuestion();
    }, 1200);
  }

  renderQuizResult() {
    window.soundEngine.playVictory();
    const starCount = this.score >= 90 ? 3 : this.score >= 60 ? 2 : 1;
    const starsHtml = '⭐'.repeat(starCount);

    this.container.innerHTML = `
      <div class="game-container game-result-wrap">
        <div class="result-trophy">🏆</div>
        <h2 class="result-title">闯关挑战完成！</h2>
        <div class="result-stars">${starsHtml}</div>
        <div class="result-score-badge">最终得分：<span>${this.score}</span> 分</div>
        
        <p class="result-comment">
          ${this.score === 100 ? '太了不起啦！全部答对，真是识字小达人！👑' :
            this.score >= 80 ? '非常棒！绝大多数生字都已经牢牢掌握！👏' :
            '继续加油哦，多读多看很快就能学会！💪'}
        </p>

        ${this.wrongAnswers.length > 0 ? `
          <div class="wrong-review-box">
            <div class="wrong-review-title">建议多复习的生字：</div>
            <div class="wrong-chips">
              ${this.wrongAnswers.map(c => `<span class="wrong-chip" onclick="window.soundEngine.speak('${c.char}')">${c.char} (${c.pinyin})</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="result-actions">
          <button class="btn btn-primary btn-round" id="restartQuizBtn">再挑战一次</button>
        </div>
      </div>
    `;

    document.getElementById('restartQuizBtn').onclick = () => {
      this.startQuizChallenge(this.pool, this.container);
    };
  }
}

window.gameEngine = new GameEngine();
