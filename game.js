/**
 * SANRIO HELLO KITTY LAND-GRAB BATTLE GAME
 * Mode: Real-time Free-Claiming Speed Battle (No Turns)
 * Rules:
 *  1. Both Kitty and Kuromi claim cells freely and simultaneously in real-time.
 *  2. First to reach 60% of total land wins instantly!
 *  3. Countdown timer: 30 seconds default.
 *  4. When time expires: Player with higher occupancy wins.
 *  5. If tied when time expires: Overtime (+15s) is awarded until a winner is decided!
 */

(function () {
  'use strict';

  // --- SVG Assets Definition ---
  const SVG_KITTY = `
    <svg class="cell-content-svg" viewBox="0 0 100 100">
      <!-- Kitty Face -->
      <ellipse cx="50" cy="55" rx="36" ry="28" fill="#FFFFFF" stroke="#3D2630" stroke-width="4"/>
      <!-- Ears -->
      <path d="M 23 35 L 14 16 L 35 27 Z" fill="#FFFFFF" stroke="#3D2630" stroke-width="4" stroke-linejoin="round"/>
      <path d="M 77 35 L 86 16 L 65 27 Z" fill="#FFFFFF" stroke="#3D2630" stroke-width="4" stroke-linejoin="round"/>
      <!-- Ribbon -->
      <circle cx="28" cy="22" r="6" fill="#FF2E63" stroke="#3D2630" stroke-width="2.5"/>
      <ellipse cx="17" cy="18" rx="7" ry="5.5" fill="#FF5E89" stroke="#3D2630" stroke-width="2.5" transform="rotate(-15 17 18)"/>
      <ellipse cx="37" cy="19" rx="7" ry="5.5" fill="#FF5E89" stroke="#3D2630" stroke-width="2.5" transform="rotate(20 37 19)"/>
      <circle cx="28" cy="22" r="2.5" fill="#FFE247"/>
      <!-- Eyes -->
      <ellipse cx="36" cy="53" rx="3.2" ry="4.5" fill="#3D2630"/>
      <ellipse cx="64" cy="53" rx="3.2" ry="4.5" fill="#3D2630"/>
      <!-- Nose -->
      <ellipse cx="50" cy="59" rx="4" ry="3" fill="#FFD43B" stroke="#3D2630" stroke-width="2"/>
      <!-- Whiskers -->
      <line x1="14" y1="49" x2="27" y2="51" stroke="#3D2630" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="12" y1="57" x2="27" y2="56" stroke="#3D2630" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="86" y1="49" x2="73" y2="51" stroke="#3D2630" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="88" y1="57" x2="73" y2="56" stroke="#3D2630" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Blushes -->
      <ellipse cx="27" cy="61" rx="4" ry="2.5" fill="#FF99AF" opacity="0.8"/>
      <ellipse cx="73" cy="61" rx="4" ry="2.5" fill="#FF99AF" opacity="0.8"/>
    </svg>
  `;

  const SVG_KUROMI = `
    <svg class="cell-content-svg" viewBox="0 0 100 100">
      <!-- Kuromi Jester Ears -->
      <path d="M 28 42 C 15 28 8 8 18 4 C 30 2 35 22 40 38 Z" fill="#251C33" stroke="#181124" stroke-width="3" stroke-linejoin="round"/>
      <path d="M 72 42 C 85 28 92 8 82 4 C 70 2 65 22 60 38 Z" fill="#251C33" stroke="#181124" stroke-width="3" stroke-linejoin="round"/>
      <!-- Ear balls -->
      <circle cx="17" cy="5" r="4.5" fill="#FF69B4" stroke="#181124" stroke-width="2"/>
      <circle cx="83" cy="5" r="4.5" fill="#FF69B4" stroke="#181124" stroke-width="2"/>
      <!-- Jester Hood -->
      <path d="M 19 55 C 19 32 81 32 81 55 C 81 67 74 74 50 74 C 26 74 19 67 19 55 Z" fill="#251C33" stroke="#181124" stroke-width="3"/>
      <!-- White Face -->
      <ellipse cx="50" cy="61" rx="26" ry="20" fill="#FFFFFF" stroke="#181124" stroke-width="2.5"/>
      <!-- Skull on Hat -->
      <ellipse cx="50" cy="41" rx="6" ry="5" fill="#FF69B4"/>
      <circle cx="48" cy="40" r="1.2" fill="#251C33"/>
      <circle cx="52" cy="40" r="1.2" fill="#251C33"/>
      <!-- Eyes -->
      <ellipse cx="39" cy="59" rx="3" ry="5" fill="#181124" transform="rotate(-6 39 59)"/>
      <ellipse cx="61" cy="59" rx="3" ry="5" fill="#181124" transform="rotate(6 61 59)"/>
      <circle cx="38" cy="57" r="1.2" fill="#FFFFFF"/>
      <circle cx="60" cy="57" r="1.2" fill="#FFFFFF"/>
      <!-- Mouth -->
      <path d="M 47 67 Q 50 70 53 67 Z" fill="#FF69B4" stroke="#181124" stroke-width="1.2"/>
      <!-- Blushes -->
      <ellipse cx="32" cy="65" rx="3.5" ry="2" fill="#FFB6C1"/>
      <ellipse cx="68" cy="65" rx="3.5" ry="2" fill="#FFB6C1"/>
    </svg>
  `;

  // --- Web Audio Sound Synthesizer ---
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.soundEnabled = true;
      this.initStorage();
    }

    initStorage() {
      const saved = localStorage.getItem('kitty_game_sound');
      if (saved !== null) {
        this.soundEnabled = saved === 'true';
      }
    }

    getAudioContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    }

    toggle() {
      this.soundEnabled = !this.soundEnabled;
      localStorage.setItem('kitty_game_sound', this.soundEnabled.toString());
      if (this.soundEnabled) {
        this.playKittyMove();
      }
      return this.soundEnabled;
    }

    playKittyMove() {
      if (!this.soundEnabled) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.1); // D6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    }

    playKuromiMove() {
      if (!this.soundEnabled) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.13); // C4

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }

    playTick() {
      if (!this.soundEnabled) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    }

    playOvertimeAlarm() {
      if (!this.soundEnabled) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      // Two alert tones
      [659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.12;
        const dur = 0.2;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    }

    playWin() {
      if (!this.soundEnabled) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.12;
        const dur = 0.28;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    }

    playLose() {
      if (!this.soundEnabled) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [659.25, 587.33, 523.25, 493.88];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.15;
        const dur = 0.25;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    }

    playReset() {
      if (!this.soundEnabled) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    }
  }

  // --- Confetti Engine ---
  class ConfettiEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.animationId = null;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    launch() {
      this.stop();
      this.particles = [];
      const colors = ['#FF4D79', '#FF85A1', '#FFC2D1', '#9D4EDD', '#C77DFF', '#FFE066', '#70D6FF'];
      const shapes = ['circle', 'ribbon', 'rect'];

      for (let i = 0; i < 90; i++) {
        this.particles.push({
          x: this.canvas.width / 2 + (Math.random() - 0.5) * 150,
          y: this.canvas.height / 2 + (Math.random() - 0.5) * 50,
          vx: (Math.random() - 0.5) * 16,
          vy: Math.random() * -18 - 4,
          gravity: 0.45,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          size: Math.random() * 10 + 6,
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 12,
          opacity: 1
        });
      }

      this.animate();
    }

    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      let alive = 0;
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.vRot;
        p.vx *= 0.98;

        if (p.y > this.canvas.height * 0.7) {
          p.opacity -= 0.02;
        }

        if (p.opacity > 0 && p.y < this.canvas.height + 50) {
          alive++;
          this.ctx.save();
          this.ctx.globalAlpha = Math.max(0, p.opacity);
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rotation * Math.PI) / 180);
          this.ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
          } else if (p.shape === 'ribbon') {
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, p.size, p.size / 3, 0, 0, Math.PI * 2);
            this.ctx.fill();
          } else {
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
          }

          this.ctx.restore();
        }
      }

      if (alive > 0) {
        this.animationId = requestAnimationFrame(() => this.animate());
      } else {
        this.stop();
      }
    }

    stop() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // --- Real-time Speed Battle Game Class ---
  class LandGrabGame {
    constructor() {
      this.size = 5; // Default 5x5
      this.totalCells = 25;
      this.boardState = []; // Array of { index, owner: null | 'user' | 'comp' }
      this.isGameOver = false;

      // Real-time Timer & Rules
      this.initialDuration = 30; // 30 seconds
      this.timeRemaining = 30;
      this.isOvertime = false;
      this.overtimeCount = 0;
      this.timerInterval = null;
      this.aiTimeoutId = null;

      // 60% win rule
      this.winThresholdRate = 0.6; // 60%
      this.winTargetCount = Math.ceil(this.totalCells * 0.6);

      this.sound = new SoundManager();
      this.confetti = new ConfettiEngine(document.getElementById('confettiCanvas'));

      this.initDomElements();
      this.bindEvents();
      this.startNewGame();
    }

    initDomElements() {
      this.dom = {
        board: document.getElementById('gameBoard'),
        userScore: document.getElementById('userScore'),
        compScore: document.getElementById('computerScore'),
        userRateBadge: document.getElementById('userRateBadge'),
        compRateBadge: document.getElementById('compRateBadge'),
        remainingCount: document.getElementById('remainingCount'),
        timerBadge: document.getElementById('timerBadge'),
        timerTitle: document.getElementById('timerTitle'),
        timerDisplay: document.getElementById('timerDisplay'),
        targetCellsText: document.getElementById('targetCellsText'),
        userBarFill: document.getElementById('userBarFill'),
        compBarFill: document.getElementById('compBarFill'),
        emptyBarFill: document.getElementById('emptyBarFill'),
        userPercent: document.getElementById('userPercent'),
        compPercent: document.getElementById('compPercent'),
        statusBanner: document.getElementById('statusBanner'),
        bannerEmoji: document.getElementById('bannerEmoji'),
        bannerText: document.getElementById('bannerText'),
        playerKittyCard: document.getElementById('playerKittyCard'),
        computerKuromiCard: document.getElementById('computerKuromiCard'),
        resetBtn: document.getElementById('resetBtn'),
        sizeBtns: document.querySelectorAll('.size-btn'),
        soundToggleBtn: document.getElementById('soundToggleBtn'),
        soundIcon: document.getElementById('soundIcon'),
        soundText: document.getElementById('soundText'),
        resultModal: document.getElementById('resultModal'),
        modalReasonBadge: document.getElementById('modalReasonBadge'),
        modalTitle: document.getElementById('modalTitle'),
        modalSubtitle: document.getElementById('modalSubtitle'),
        modalAvatar: document.getElementById('modalAvatar'),
        modalKittyScore: document.getElementById('modalKittyScore'),
        modalKuromiScore: document.getElementById('modalKuromiScore'),
        modalKittyRate: document.getElementById('modalKittyRate'),
        modalKuromiRate: document.getElementById('modalKuromiRate'),
        modalReplayBtn: document.getElementById('modalReplayBtn')
      };

      this.updateSoundButtonUI();
    }

    bindEvents() {
      // Board Size Buttons
      this.dom.sizeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const newSize = parseInt(e.target.dataset.size, 10);
          if (newSize !== this.size) {
            this.dom.sizeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            this.size = newSize;
            this.totalCells = newSize * newSize;
            this.winTargetCount = Math.ceil(this.totalCells * this.winThresholdRate);
            this.startNewGame();
          }
        });
      });

      // Sound Toggle Button
      this.dom.soundToggleBtn.addEventListener('click', () => {
        const enabled = this.sound.toggle();
        this.updateSoundButtonUI();
      });

      // Reset Button
      this.dom.resetBtn.addEventListener('click', () => {
        this.sound.playReset();
        this.startNewGame();
      });

      // Modal Replay Button
      this.dom.modalReplayBtn.addEventListener('click', () => {
        this.closeModal();
        this.sound.playReset();
        this.startNewGame();
      });
    }

    updateSoundButtonUI() {
      if (this.sound.soundEnabled) {
        this.dom.soundToggleBtn.classList.remove('muted');
        this.dom.soundIcon.textContent = '🔔';
        this.dom.soundText.textContent = '소리 ON';
      } else {
        this.dom.soundToggleBtn.classList.add('muted');
        this.dom.soundIcon.textContent = '🔕';
        this.dom.soundText.textContent = '소리 OFF';
      }
    }

    startNewGame() {
      this.stopAllTimers();
      this.isGameOver = false;
      this.isOvertime = false;
      this.overtimeCount = 0;
      this.timeRemaining = this.initialDuration;
      this.winTargetCount = Math.ceil(this.totalCells * this.winThresholdRate);

      this.confetti.stop();
      this.closeModal();

      // Reset timer UI badges
      this.dom.timerBadge.className = 'timer-badge';
      this.dom.timerTitle.textContent = '⏱️ 남은 시간';
      this.dom.timerDisplay.textContent = `${this.timeRemaining}s`;

      // Reset status banner
      this.dom.statusBanner.className = 'status-banner';
      this.dom.bannerEmoji.textContent = '⚡';
      this.dom.bannerText.textContent = `스피드 대결! 빈 칸을 자유롭게 연속으로 터치하세요! (${this.winTargetCount}칸 선점 시 즉시 승리)`;

      // Active state on both players
      this.dom.playerKittyCard.classList.add('active-turn');
      this.dom.computerKuromiCard.classList.add('active-turn');

      // Reset Board state
      this.boardState = [];
      for (let i = 0; i < this.totalCells; i++) {
        this.boardState.push({
          index: i,
          owner: null // null, 'user', 'comp'
        });
      }

      // Update Board Grid class
      this.dom.board.className = `game-board grid-${this.size}`;
      this.dom.board.innerHTML = '';

      // Build DOM Cells
      for (let i = 0; i < this.totalCells; i++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'board-cell empty';
        cell.dataset.index = i.toString();
        cell.setAttribute('aria-label', `칸 ${i + 1}`);

        // Direct, non-blocking click handler for continuous free-claiming
        cell.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.handleUserCellClick(i);
        });

        this.dom.board.appendChild(cell);
      }

      this.updateUI();

      // Start Countdown Timer & Real-time AI loop
      this.startCountdownTimer();
      this.scheduleNextAiMove();
    }

    stopAllTimers() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      if (this.aiTimeoutId) {
        clearTimeout(this.aiTimeoutId);
        this.aiTimeoutId = null;
      }
    }

    startCountdownTimer() {
      this.timerInterval = setInterval(() => {
        if (this.isGameOver) {
          clearInterval(this.timerInterval);
          return;
        }

        this.timeRemaining--;

        // Update timer display
        this.dom.timerDisplay.textContent = `${this.timeRemaining}s`;

        // Urgent warning under 5s
        if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
          this.dom.timerBadge.classList.add('urgent');
          this.sound.playTick();
        } else if (this.timeRemaining > 5 && !this.isOvertime) {
          this.dom.timerBadge.classList.remove('urgent');
        }

        // Time Expired Check
        if (this.timeRemaining <= 0) {
          this.handleTimeExpired();
        }
      }, 1000);
    }

    /**
     * 사용자가 빈 칸을 자유롭게 연속 클릭
     */
    handleUserCellClick(index) {
      if (this.isGameOver) return;

      const cellData = this.boardState[index];
      // 이미 차지된 칸이면 무시
      if (cellData.owner !== null) return;

      // 즉시 점유
      this.claimCell(index, 'user');
      this.sound.playKittyMove();

      // 60% 즉시 승리 또는 빈 칸 소진 여부 체크
      this.checkImmediateWinCondition();
    }

    /**
     * 컴퓨터(쿠로미) AI의 독립적 실시간 착수 루프
     */
    scheduleNextAiMove() {
      if (this.isGameOver) return;

      // 판 크기 및 상황에 따라 400ms ~ 650ms 주기로 스스로 착수
      const aiSpeed = Math.floor(420 + Math.random() * 240);

      this.aiTimeoutId = setTimeout(() => {
        if (this.isGameOver) return;

        this.executeAiMove();
        this.scheduleNextAiMove();
      }, aiSpeed);
    }

    executeAiMove() {
      const emptyCells = this.boardState.filter(c => c.owner === null);
      if (emptyCells.length === 0) {
        this.checkImmediateWinCondition();
        return;
      }

      // 무작위 빈 칸 하나 선택하여 점유
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const chosen = emptyCells[randomIndex];

      this.claimCell(chosen.index, 'comp');
      this.sound.playKuromiMove();

      // 60% 즉시 승리 또는 빈 칸 소진 여부 체크
      this.checkImmediateWinCondition();
    }

    claimCell(index, owner) {
      this.boardState[index].owner = owner;

      const cellEl = this.dom.board.querySelector(`.board-cell[data-index="${index}"]`);
      if (cellEl) {
        cellEl.classList.remove('empty');
        if (owner === 'user') {
          cellEl.classList.add('taken-user');
          cellEl.innerHTML = SVG_KITTY;
          cellEl.setAttribute('aria-label', `헬로키티 영역`);
        } else {
          cellEl.classList.add('taken-comp');
          cellEl.innerHTML = SVG_KUROMI;
          cellEl.setAttribute('aria-label', `쿠로미 영역`);
        }
      }

      this.updateUI();
    }

    updateUI() {
      const userCount = this.boardState.filter(c => c.owner === 'user').length;
      const compCount = this.boardState.filter(c => c.owner === 'comp').length;
      const remaining = this.totalCells - (userCount + compCount);

      // Score Bump
      if (this.dom.userScore.textContent !== userCount.toString()) {
        this.dom.userScore.textContent = userCount;
        this.triggerBump(this.dom.userScore);
      }
      if (this.dom.compScore.textContent !== compCount.toString()) {
        this.dom.compScore.textContent = compCount;
        this.triggerBump(this.dom.compScore);
      }

      this.dom.remainingCount.textContent = remaining;

      // Real-time Total Occupancy Rates (%)
      const userRate = ((userCount / this.totalCells) * 100).toFixed(1);
      const compRate = ((compCount / this.totalCells) * 100).toFixed(1);
      const emptyRate = Math.max(0, (100 - parseFloat(userRate) - parseFloat(compRate)).toFixed(1));

      // Update Card Badges
      this.dom.userRateBadge.textContent = `${userRate}%`;
      this.dom.compRateBadge.textContent = `${compRate}%`;

      // Update Target Cells Text
      this.dom.targetCellsText.textContent = `목표: ${this.winTargetCount}칸 (60%)`;

      // Update Progress Bar
      this.dom.userBarFill.style.width = `${userRate}%`;
      this.dom.compBarFill.style.width = `${compRate}%`;
      this.dom.emptyBarFill.style.width = `${emptyRate}%`;

      this.dom.userPercent.textContent = userCount > 0 ? `${Math.round(userRate)}%` : '0%';
      this.dom.compPercent.textContent = compCount > 0 ? `${Math.round(compRate)}%` : '0%';
    }

    triggerBump(element) {
      element.classList.remove('bump');
      void element.offsetWidth; // Trigger reflow
      element.classList.add('bump');
    }

    /**
     * 60% 선점 즉시 승리 및 빈 칸 소진 승패 판정
     */
    checkImmediateWinCondition() {
      if (this.isGameOver) return;

      const userCount = this.boardState.filter(c => c.owner === 'user').length;
      const compCount = this.boardState.filter(c => c.owner === 'comp').length;
      const remaining = this.totalCells - (userCount + compCount);

      // 1. [전체 땅의 60% 이상 먼저 차지 시 즉시 승리]
      if (userCount >= this.winTargetCount) {
        this.triggerGameOver('user_instant_60');
        return;
      }
      if (compCount >= this.winTargetCount) {
        this.triggerGameOver('comp_instant_60');
        return;
      }

      // 2. [빈 칸이 모두 소진되었을 때]
      if (remaining === 0) {
        if (userCount > compCount) {
          this.triggerGameOver('user_full_board');
        } else if (compCount > userCount) {
          this.triggerGameOver('comp_full_board');
        } else {
          // 모든 칸 소진 후 완전 동점
          this.triggerGameOver('draw_full_board');
        }
      }
    }

    /**
     * 제한 시간 종료 시 처리 및 동점 연장전 로직
     */
    handleTimeExpired() {
      const userCount = this.boardState.filter(c => c.owner === 'user').length;
      const compCount = this.boardState.filter(c => c.owner === 'comp').length;

      if (userCount > compCount) {
        // 유저 시간 종료 판정승
        this.triggerGameOver(this.isOvertime ? 'user_overtime_win' : 'user_timeout_win');
      } else if (compCount > userCount) {
        // 컴퓨터 시간 종료 판정승
        this.triggerGameOver(this.isOvertime ? 'comp_overtime_win' : 'comp_timeout_win');
      } else {
        // 동점인 경우: 승부가 결정될 때까지 추가 시간 부여 (+15초 연장전 돌입!)
        this.triggerOvertime();
      }
    }

    /**
     * 연장전(Overtime) 돌입
     */
    triggerOvertime() {
      this.isOvertime = true;
      this.overtimeCount++;
      this.timeRemaining = 15; // 추가 시간 15초 부여

      this.sound.playOvertimeAlarm();

      // UI 연장전 테마 활성화
      this.dom.timerBadge.className = 'timer-badge overtime';
      this.dom.timerTitle.textContent = '🔥 연장전 추가시간';
      this.dom.timerDisplay.textContent = `${this.timeRemaining}s`;

      this.dom.statusBanner.className = 'status-banner overtime-active';
      this.dom.bannerEmoji.textContent = '🔥';
      this.dom.bannerText.textContent = `동점! 승부가 날 때까지 +15초 추가 시간 부여! 1칸이라도 더 차지하세요!`;
    }

    triggerGameOver(reason) {
      this.isGameOver = true;
      this.stopAllTimers();

      this.dom.board.classList.add('turn-locked');
      this.dom.playerKittyCard.classList.remove('active-turn');
      this.dom.computerKuromiCard.classList.remove('active-turn');

      setTimeout(() => {
        this.handleGameFinished(reason);
      }, 400);
    }

    handleGameFinished(reason) {
      const userScore = this.boardState.filter(c => c.owner === 'user').length;
      const compScore = this.boardState.filter(c => c.owner === 'comp').length;
      const userRate = ((userScore / this.totalCells) * 100).toFixed(1);
      const compRate = ((compScore / this.totalCells) * 100).toFixed(1);

      this.dom.modalKittyScore.textContent = `${userScore} 칸`;
      this.dom.modalKuromiScore.textContent = `${compScore} 칸`;
      this.dom.modalKittyRate.textContent = `점유율 ${userRate}%`;
      this.dom.modalKuromiRate.textContent = `점유율 ${compRate}%`;

      if (reason === 'user_instant_60') {
        // 60% 즉시 승리
        this.dom.modalReasonBadge.textContent = '🏆 60% 영토 선점 즉시 승리 (KO)!';
        this.dom.modalTitle.textContent = '🎉 헬로키티의 압도적 승리! 🎉';
        this.dom.modalSubtitle.textContent = `제한 시간 안에 전체 땅의 60%(${this.winTargetCount}칸)를 먼저 차지하여 대승리했습니다! 💖`;
        this.dom.modalAvatar.innerHTML = SVG_KITTY;
        this.sound.playWin();
        this.confetti.launch();
      } else if (reason === 'comp_instant_60') {
        // 컴퓨터 60% 즉시 승리
        this.dom.modalReasonBadge.textContent = '😈 쿠로미 60% 영토 선점 즉시 승리!';
        this.dom.modalTitle.textContent = '😈 쿠로미의 즉시 승리! 😈';
        this.dom.modalSubtitle.textContent = `쿠로미가 전체 땅의 60%(${this.winTargetCount}칸)를 먼저 차지했습니다. 다음 판에 빠르게 도전해보세요!`;
        this.dom.modalAvatar.innerHTML = SVG_KUROMI;
        this.sound.playLose();
      } else if (reason === 'user_timeout_win' || reason === 'user_overtime_win' || reason === 'user_full_board') {
        // 유저 점유율 우세 승리
        const badgeText = reason === 'user_overtime_win'
          ? '⚡ 연장전 혈투 끝 점유율 승리!'
          : (reason === 'user_timeout_win' ? '⏱️ 제한 시간 종료 - 점유율 우세 승리!' : '🏁 빈 칸 소진 - 최종 점유율 승리!');
        this.dom.modalReasonBadge.textContent = badgeText;
        this.dom.modalTitle.textContent = '🎀 헬로키티 승리! 🎀';
        this.dom.modalSubtitle.textContent = `점유율 ${userRate}%(${userScore}칸) vs ${compRate}%(${compScore}칸)로 키티가 더 많은 영토를 차지하여 승리했습니다! 💖`;
        this.dom.modalAvatar.innerHTML = SVG_KITTY;
        this.sound.playWin();
        this.confetti.launch();
      } else if (reason === 'comp_timeout_win' || reason === 'comp_overtime_win' || reason === 'comp_full_board') {
        // 컴퓨터 점유율 우세 승리
        const badgeText = reason === 'comp_overtime_win'
          ? '⚡ 연장전 혈투 끝 쿠로미 승리'
          : (reason === 'comp_timeout_win' ? '⏱️ 제한 시간 종료 - 쿠로미 점유율 우세' : '🏁 빈 칸 소진 - 쿠로미 점유율 우세');
        this.dom.modalReasonBadge.textContent = badgeText;
        this.dom.modalTitle.textContent = '😈 쿠로미의 승리! 😈';
        this.dom.modalSubtitle.textContent = `점유율 ${compRate}%(${compScore}칸) vs ${userRate}%(${userScore}칸)로 쿠로미가 더 많은 땅을 차지했습니다.`;
        this.dom.modalAvatar.innerHTML = SVG_KUROMI;
        this.sound.playLose();
      } else {
        // 완벽 동점 무승부
        this.dom.modalReasonBadge.textContent = '🤝 점유율 & 땅 수 완전 동일 - 무승부!';
        this.dom.modalTitle.textContent = '🤝 사이좋은 무승부! 🤝';
        this.dom.modalSubtitle.textContent = `두 플레이어의 점유율(${userRate}%)과 차지한 땅(${userScore}칸)이 모두 완벽히 같습니다!`;
        this.dom.modalAvatar.innerHTML = SVG_KITTY;
        this.sound.playWin();
      }

      this.openModal();
    }

    openModal() {
      this.dom.resultModal.classList.add('active');
    }

    closeModal() {
      this.dom.resultModal.classList.remove('active');
    }
  }

  // --- Initialize when DOM is ready ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new LandGrabGame());
  } else {
    new LandGrabGame();
  }
})();
