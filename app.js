'use strict';

// ===== CONSTANTS =====
const STORAGE_KEY = 'bblearn_v1';

const DEFAULT_STATE = {
  module1: { words_mastered: [], key_earned: false, story_page: 0 },
  module2: {
    room_stars: { ballroom: 0, dining: 0, library: 0, westwing: 0 },
    rooms_unlocked: ['ballroom'],
    task_progress: {},
  },
  settings: { bgmVol: 0.5, seVol: 0.7 },
};

// ===== NOTE FREQUENCY =====
const NOTE_FREQ = (() => {
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  return function(n) {
    if (n === 'R') return 0;
    const m = n.match(/^([A-G])(#|b)?(\d)$/);
    if (!m) return 261.63;
    const semi = (parseInt(m[3]) - 4) * 12 + base[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 261.63 * Math.pow(2, semi / 12);
  };
})();

// ===== BGM DEFINITIONS =====
const BGM_DEFS = {
  castle: {
    bpm: 72, type: 'sine',
    notes: [
      ['C4',1.0],['E4',1.0],['G4',1.0],['C5',2.0],['R',0.5],
      ['B4',1.0],['G4',1.0],['E4',1.0],['G4',2.0],['R',0.5],
      ['A4',1.0],['C5',1.0],['E5',1.0],['A4',2.0],['R',0.5],
      ['G4',1.5],['F4',0.5],['E4',1.0],['D4',1.0],['C4',2.0],
    ],
  },
  story: {
    bpm: 60, type: 'triangle',
    notes: [
      ['E4',1.5],['G4',0.5],['A4',1.0],['G4',1.0],['E4',2.0],['R',1.0],
      ['F4',1.5],['A4',0.5],['C5',1.0],['A4',1.0],['F4',2.0],['R',1.0],
      ['G4',1.5],['B4',0.5],['D5',1.0],['B4',1.0],['G4',2.0],['R',1.0],
      ['E4',1.0],['F4',1.0],['G4',1.0],['A4',1.0],['C5',2.0],['R',1.0],
    ],
  },
  room: {
    bpm: 116, type: 'square',
    notes: [
      ['C5',0.5],['E5',0.5],['G5',0.5],['E5',0.5],
      ['C5',1.0],['R',0.5],['G4',0.5],
      ['A4',0.5],['C5',0.5],['E5',0.5],['C5',0.5],
      ['A4',1.0],['R',1.0],
      ['F4',0.5],['A4',0.5],['C5',0.5],['A4',0.5],
      ['F4',1.0],['R',0.5],['C5',0.5],
      ['G4',0.5],['B4',0.5],['D5',0.5],['B4',0.5],
      ['G4',2.0],
    ],
  },
};

// ===== STORY WORDS =====
const STORY_WORDS = [
  { id: 'beast',    kata: 'ビースト',     en: 'Beast',    audio: 'kata_beast',    emoji: '👹' },
  { id: 'bell',     kata: 'ベル',         en: 'Belle',    audio: 'kata_bell',     emoji: '👸' },
  { id: 'ballroom', kata: 'ボールルーム', en: 'Ballroom', audio: 'kata_ballroom', emoji: '💃' },
  { id: 'dance',    kata: 'ダンス',       en: 'Dance',    audio: 'kata_dance',    emoji: '🎶' },
  { id: 'party',    kata: 'パーティー',   en: 'Party',    audio: 'kata_party',    emoji: '🎉' },
  { id: 'rose',     kata: 'ローズ',       en: 'Rose',     audio: 'kata_rose',     emoji: '🌹' },
];

// ===== STORY PAGES =====
// Words wrapped in [word_id:表示テキスト] syntax
const STORY_PAGES = [
  {
    char: '👹',
    text: 'むかしむかし、ふしぎなおしろに\n[beast:ビースト] が すんでいました。',
    bg: '#2D1B69',
  },
  {
    char: '👸',
    text: '[bell:ベル] という むすめが\nそのおしろに やってきました。',
    bg: '#1A2D69',
  },
  {
    char: '🏰',
    text: 'ビーストは ベルを\nきれいな [ballroom:ボールルーム] へ\nあんないしました。',
    bg: '#1A3D29',
  },
  {
    char: '🎶',
    text: 'ふたりは いっしょに\n[dance:ダンス] を おどりました！',
    bg: '#3D2D1A',
  },
  {
    char: '🌹',
    text: '[party:パーティー] のあとで\nベルは すてきな [rose:ローズ] を\nもらいました。',
    bg: '#2D1A3D',
  },
];

// ===== ROOM DEFINITIONS =====
const ROOM_DEFS = [
  {
    id: 'ballroom',
    name: 'ボールルーム',
    icon: '💃',
    desc: 'ビーストと いっしょに おどろう！',
    color: '#2D1B69',
    tasks: [
      {
        type: 'tap_count',
        label: 'おどる！を タップ',
        title: 'ダンス',
        question: 'ビーストと ベルが おどっているよ！\n「おどる！」を 8かい タップしよう！',
        targetCount: 8,
        btnLabel: 'おどる！',
        emoji: '🎶',
      },
      {
        type: 'kata_choice',
        label: 'ドレスの なまえは？',
        title: 'カタカナもんだい',
        question: 'ベルの ドレスを えらんでね！',
        image: '👗',
        correct: 'レッドドレス',
        choices: ['レッドドレス', 'ブルードレス', 'ローズ'],
        audioKey: 'kata_red_dress',
      },
      {
        type: 'math_add',
        label: '足し算：3 ＋ 2',
        title: 'さんすう',
        question: 'パーティーに おきゃくさんが きたよ！',
        a: 3, b: 2,
        emoji: '🧑',
        answerChoices: [3, 4, 5, 6],
      },
    ],
  },
  {
    id: 'dining',
    name: 'ダイニング',
    icon: '🍽️',
    desc: 'おりょうりを かぞえよう！',
    color: '#2D1B50',
    tasks: [
      {
        type: 'count',
        label: 'おさらを かぞえよう',
        title: 'かずのべんきょう',
        question: 'テーブルの おさらを かぞえてね！',
        items: '🍽️🍽️🍽️🍽️🍽️🍽️',
        count: 6,
        answerChoices: [4, 5, 6, 7],
      },
      {
        type: 'math_add',
        label: '足し算：4 ＋ 1',
        title: 'さんすう',
        question: 'ケーキを わけるよ！\nいくつに なるかな？',
        a: 4, b: 1,
        emoji: '🎂',
        answerChoices: [3, 4, 5, 6],
      },
      {
        type: 'count',
        label: 'ろうそくを かぞえよう',
        title: 'かずのべんきょう',
        question: 'ケーキの ろうそくを かぞえてね！',
        items: '🕯️🕯️🕯️🕯️🕯️🕯️🕯️',
        count: 7,
        answerChoices: [5, 6, 7, 8],
      },
    ],
  },
  {
    id: 'library',
    name: 'としょしつ',
    icon: '📚',
    desc: 'カタカナを よもう！',
    color: '#1A3050',
    tasks: [
      {
        type: 'kata_choice',
        label: 'カタカナを えらぼう',
        title: 'カタカナもんだい',
        question: '「ダンス」という ことばは\nどれかな？',
        image: '🎶',
        correct: 'ダンス',
        choices: ['ダンス', 'ローズ', 'ベル'],
        audioKey: 'kata_dance',
      },
      {
        type: 'kata_choice',
        label: 'カタカナを えらぼう',
        title: 'カタカナもんだい',
        question: 'バラのはなを あらわす\nカタカナは？',
        image: '🌹',
        correct: 'ローズ',
        choices: ['パーティー', 'ローズ', 'ビースト'],
        audioKey: 'kata_rose',
      },
      {
        type: 'kata_choice',
        label: 'カタカナを よもう',
        title: 'カタカナよみもの',
        question: 'おしろで おどる へやの なまえは？',
        image: '💃',
        correct: 'ボールルーム',
        choices: ['ボールルーム', 'ダンス', 'パーティー'],
        audioKey: 'kata_ballroom',
      },
    ],
  },
  {
    id: 'westwing',
    name: 'ひみつのにし',
    icon: '🌹',
    desc: 'かくれた バラをさがそう！',
    color: '#3D1A2D',
    tasks: [
      {
        type: 'find_hidden',
        label: 'バラを 3つ さがそう！',
        title: 'かくれんぼ',
        question: 'ひみつのにしに かくれている\nバラを 3つ さがしてね！',
        totalItems: 3,
        emoji: '🌹',
      },
      {
        type: 'math_add',
        label: '足し算：10 ＋ 5',
        title: 'さんすう',
        question: 'バラが へやの あちこちに！\nあわせて いくつ？',
        a: 10, b: 5,
        emoji: '🌹',
        answerChoices: [13, 14, 15, 16],
      },
      {
        type: 'kata_choice',
        label: 'カタカナを あわせよう',
        title: 'カタカナまとめ',
        question: 'おしろの ぬしの なまえは？',
        image: '👹',
        correct: 'ビースト',
        choices: ['ビースト', 'ローズ', 'パーティー'],
        audioKey: 'kata_beast',
      },
    ],
  },
];

// ===== KATAKANA STROKE REFERENCES =====
// Simplified normalized coordinates [x, y] in 0.0-1.0 range
// These capture the essential shape of each character
const KATA_STROKE_REFS = {
  'ー': { strokes: [ [[0.12,0.5],[0.88,0.5]] ] },
  'ビ': { strokes: [
    [[0.15,0.22],[0.85,0.22]],
    [[0.38,0.12],[0.38,0.88]],
  ]},
  'ス': { strokes: [
    [[0.12,0.18],[0.88,0.18]],
    [[0.62,0.18],[0.35,0.55],[0.7,0.88]],
  ]},
  'ト': { strokes: [
    [[0.38,0.10],[0.38,0.90]],
    [[0.38,0.42],[0.82,0.55]],
  ]},
  'ベ': { strokes: [
    [[0.12,0.22],[0.82,0.22]],
    [[0.5,0.22],[0.18,0.75],[0.82,0.75]],
  ]},
  'ル': { strokes: [
    [[0.28,0.12],[0.28,0.62],[0.48,0.88]],
    [[0.72,0.12],[0.72,0.72],[0.50,0.90]],
  ]},
  'ボ': { strokes: [
    [[0.12,0.38],[0.88,0.38]],
    [[0.5,0.10],[0.5,0.90]],
  ]},
  'ム': { strokes: [
    [[0.5,0.12],[0.18,0.48],[0.5,0.85],[0.82,0.48],[0.5,0.12]],
  ]},
  'ダ': { strokes: [
    [[0.12,0.28],[0.88,0.28]],
    [[0.5,0.12],[0.22,0.60]],
    [[0.52,0.45],[0.82,0.88]],
  ]},
  'ン': { strokes: [
    [[0.22,0.22],[0.35,0.45],[0.5,0.75],[0.72,0.42],[0.60,0.18]],
  ]},
  'パ': { strokes: [
    [[0.28,0.22],[0.28,0.88]],
    [[0.72,0.22],[0.72,0.88]],
    [[0.28,0.45],[0.72,0.45]],
  ]},
  'テ': { strokes: [
    [[0.12,0.22],[0.88,0.22]],
    [[0.5,0.22],[0.5,0.55]],
    [[0.12,0.68],[0.88,0.68]],
  ]},
  'ィ': { strokes: [
    [[0.32,0.20],[0.52,0.78]],
    [[0.68,0.20],[0.52,0.78]],
  ]},
  'ロ': { strokes: [
    [[0.20,0.18],[0.80,0.18],[0.80,0.82],[0.20,0.82],[0.20,0.18]],
  ]},
  'ズ': { strokes: [
    [[0.12,0.18],[0.88,0.18]],
    [[0.62,0.18],[0.35,0.55],[0.72,0.88]],
  ]},
};

// Characters that appear in which words (for trace lessons)
const WORD_CHARS = {
  beast:    ['ビ','ー','ス','ト'],
  bell:     ['ベ','ル'],
  ballroom: ['ボ','ー','ル','ル','ー','ム'],
  dance:    ['ダ','ン','ス'],
  party:    ['パ','ー','テ','ィ','ー'],
  rose:     ['ロ','ー','ズ'],
};

// ===== STROKE RECOGNIZER =====
class StrokeRecognizer {
  resample(points, n = 32) {
    if (points.length < 2) return points;
    let totalLen = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i][0] - points[i-1][0];
      const dy = points[i][1] - points[i-1][1];
      totalLen += Math.sqrt(dx*dx + dy*dy);
    }
    const interval = totalLen / (n - 1);
    const result = [points[0]];
    let carry = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i][0] - points[i-1][0];
      const dy = points[i][1] - points[i-1][1];
      const segLen = Math.sqrt(dx*dx + dy*dy);
      let d = carry + segLen;
      while (d >= interval) {
        const t = (d - carry) / segLen;
        const x = points[i-1][0] + t * dx;
        const y = points[i-1][1] + t * dy;
        result.push([x, y]);
        d -= interval;
        carry = 0;
        if (result.length >= n) return result;
      }
      carry = d;
    }
    while (result.length < n) result.push(points[points.length - 1]);
    return result;
  }

  normalize(points) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of points) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    return points.map(([x, y]) => [(x - minX) / w, (y - minY) / h]);
  }

  compareStrokes(a, b) {
    // Both arrays of [x,y] with same length
    let total = 0;
    for (let i = 0; i < a.length; i++) {
      const dx = a[i][0] - b[i][0];
      const dy = a[i][1] - b[i][1];
      total += Math.sqrt(dx*dx + dy*dy);
    }
    return 1 - Math.min(1, total / a.length);
  }

  recognize(userStrokes, refStrokes) {
    if (!userStrokes.length || !refStrokes.length) return 0;
    // Try to match each user stroke to the closest ref stroke
    const N = 32;
    const refNorm = refStrokes.map(s => this.normalize(this.resample(s, N)));
    const userNorm = userStrokes.map(s => this.normalize(this.resample(s, N)));

    // If stroke counts differ, merge all points and compare as one blob
    if (Math.abs(userNorm.length - refNorm.length) > 1) {
      const allUser = userNorm.flat();
      const allRef  = refNorm.flat();
      const bigN = Math.max(allUser.length, allRef.length);
      const u = this.normalize(this.resample(allUser, bigN));
      const r = this.normalize(this.resample(allRef,  bigN));
      return this.compareStrokes(u, r);
    }

    // Match stroke by stroke
    let totalScore = 0;
    const matched = new Set();
    for (const us of userNorm) {
      let best = -1, bestIdx = -1;
      for (let j = 0; j < refNorm.length; j++) {
        if (matched.has(j)) continue;
        const s = this.compareStrokes(us, refNorm[j]);
        if (s > best) { best = s; bestIdx = j; }
      }
      if (bestIdx >= 0) { matched.add(bestIdx); totalScore += best; }
    }
    return totalScore / Math.max(userNorm.length, refNorm.length);
  }
}

// ===== MAIN GAME CLASS =====
class BBGame {
  constructor() {
    this.state = null;
    this.audioCtx = null;
    this.bgmGain = null;
    this.seGain = null;
    this.currentBgm = null;
    this._bgmTimeout = null;
    this._activeOscNodes = [];
    this.wordAudios = {};  // preloaded Audio elements
    this.currentScreen = null;
    this.currentPage = 0;
    this.currentRoom = null;
    this.currentTask = 0;
    // Trace canvas
    this.traceStrokes = [];
    this.currentStroke = null;
    this.isDrawing = false;
    this.traceChar = null;
    this.traceFailCount = 0;
    this.traceOnComplete = null;
    // Task state
    this.tapCount = 0;
    this.findCount = 0;
    // Recognizer
    this.recognizer = new StrokeRecognizer();
    this.isMobile = navigator.maxTouchPoints > 0;
    // 2D game
    this.gameLoop = null;
    this.lastTimestamp = 0;
    this.worldWidth = 1800;
    this.worldX = 0;
    this.belle = { x: 120, y: 0, vx: 0, facingRight: true, bobPhase: 0 };
    this.input = { left: false, right: false };
    this.nearDoor = null;
    this.torchPhase = 0;
    this.inGameOverlay = false;
    this._dpadBound = false;
    this.DOOR_POSITIONS = { ballroom:320, dining:680, library:1040, westwing:1400 };
    this.DOOR_ZONE_RADIUS = 80;
    this.BELLE_SPEED = 240;
    this.BELLE_HEIGHT = 80;
  }

  init() {
    this.loadState();
    this._setupEventListeners();
    this._showLoading();
  }

  // ===== STATE =====
  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.state = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_STATE));
    } catch(e) {
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    // ensure structure
    this.state.module1 = this.state.module1 || {};
    this.state.module1.words_mastered = this.state.module1.words_mastered || [];
    this.state.module1.key_earned = this.state.module1.key_earned || false;
    this.state.module1.story_page = this.state.module1.story_page || 0;
    this.state.module2 = this.state.module2 || {};
    this.state.module2.room_stars = this.state.module2.room_stars || { ballroom:0, dining:0, library:0, westwing:0 };
    this.state.module2.rooms_unlocked = this.state.module2.rooms_unlocked || ['ballroom'];
    this.state.module2.task_progress = this.state.module2.task_progress || {};
    this.state.settings = this.state.settings || { bgmVol: 0.5, seVol: 0.7 };
  }

  saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch(e) {}
  }

  // ===== SCREEN MANAGEMENT =====
  showScreen(id) {
    const screens = ['loading-screen','title-screen','story-screen','badge-screen','map-screen','game-screen','room-screen','task-screen','trace-screen'];
    screens.forEach(s => {
      const el = document.getElementById(s);
      if (el) el.classList.toggle('hidden', s !== id);
    });
    this.currentScreen = id;
  }

  _showToast(msg, duration = 3000) {
    const container = document.getElementById('toast-container');
    const div = document.createElement('div');
    div.className = 'toast';
    div.textContent = msg;
    container.appendChild(div);
    setTimeout(() => {
      div.style.transition = 'opacity 0.4s';
      div.style.opacity = '0';
      setTimeout(() => div.remove(), 500);
    }, duration - 500);
  }

  _showPetals() {
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'petal';
        el.textContent = ['🌹','🌸','🌺'][Math.floor(Math.random()*3)];
        el.style.left = `${Math.random()*100}vw`;
        el.style.top = `-40px`;
        el.style.fontSize = `${16 + Math.random()*20}px`;
        el.style.animationDuration = `${2 + Math.random()*2}s`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4500);
      }, i * 120);
    }
  }

  // ===== AUDIO =====
  initAudio() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.bgmGain = this.audioCtx.createGain();
      this.bgmGain.gain.value = this.state.settings.bgmVol || 0.5;
      this.bgmGain.connect(this.audioCtx.destination);
      this.seGain = this.audioCtx.createGain();
      this.seGain.gain.value = this.state.settings.seVol || 0.7;
      this.seGain.connect(this.audioCtx.destination);
    } catch(e) {}
    // preload word MP3s
    STORY_WORDS.forEach(w => {
      const audio = new Audio(`./audio/${w.audio}.mp3`);
      audio.preload = 'none';
      this.wordAudios[w.id] = audio;
    });
    // extra words
    ['red_dress','blue_dress'].forEach(k => {
      const audio = new Audio(`./audio/kata_${k}.mp3`);
      audio.preload = 'none';
      this.wordAudios[k] = audio;
    });
  }

  playBgm(name) {
    if (this.currentBgm === name) return;
    this.stopBgm();
    this.currentBgm = name;
    const def = BGM_DEFS[name];
    if (!def || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().then(() => this._scheduleBgm(def));
    } else {
      this._scheduleBgm(def);
    }
  }

  _scheduleBgm(def) {
    const ac = this.audioCtx;
    const gain = this.bgmGain;
    if (!ac || !gain) return;
    const beatDur = 60 / def.bpm;
    let t = ac.currentTime + 0.05;
    const allOsc = [];
    for (const [note, beats] of def.notes) {
      const freq = NOTE_FREQ(note);
      if (freq > 0) {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = def.type || 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.18, t);
        g.gain.setTargetAtTime(0, t + beatDur * beats * 0.75, 0.05);
        osc.connect(g);
        g.connect(gain);
        osc.start(t);
        osc.stop(t + beatDur * beats);
        allOsc.push(osc);
      }
      t += beatDur * beats;
    }
    this._activeOscNodes.push(...allOsc);
    const totalDur = def.notes.reduce((s, [, b]) => s + b, 0) * beatDur * 1000;
    this._bgmTimeout = setTimeout(() => {
      if (this.currentBgm && BGM_DEFS[this.currentBgm] === def) {
        this._activeOscNodes = [];
        this._scheduleBgm(def);
      }
    }, totalDur - 100);
  }

  stopBgm() {
    if (this._bgmTimeout) clearTimeout(this._bgmTimeout);
    this._bgmTimeout = null;
    const t = this.audioCtx ? this.audioCtx.currentTime : 0;
    for (const osc of this._activeOscNodes) {
      try {
        osc.gain && osc.gain.setTargetAtTime(0, t, 0.1);
        osc.stop(t + 0.2);
      } catch(e) {}
    }
    this._activeOscNodes = [];
    this.currentBgm = null;
  }

  playSe(type) {
    const ac = this.audioCtx;
    if (!ac || !this.seGain) return;
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime;
    const seqs = {
      correct: [[NOTE_FREQ('C5'),0.1,0],[NOTE_FREQ('E5'),0.1,0.1],[NOTE_FREQ('G5'),0.15,0.2],[NOTE_FREQ('C6'),0.25,0.35]],
      wrong:   [[NOTE_FREQ('A3'),0.12,0],[NOTE_FREQ('F3'),0.12,0.12],[NOTE_FREQ('D3'),0.2,0.25]],
      badge:   [[NOTE_FREQ('C5'),0.08,0],[NOTE_FREQ('G5'),0.08,0.08],[NOTE_FREQ('C6'),0.08,0.16],[NOTE_FREQ('E6'),0.08,0.24],[NOTE_FREQ('G6'),0.3,0.32]],
      sparkle: [[NOTE_FREQ('F5'),0.06,0],[NOTE_FREQ('A5'),0.06,0.07],[NOTE_FREQ('C6'),0.06,0.14]],
      tap:     [[NOTE_FREQ('G5'),0.05,0]],
      unlock:  [[NOTE_FREQ('D5'),0.1,0],[NOTE_FREQ('F#5'),0.1,0.1],[NOTE_FREQ('A5'),0.1,0.2],[NOTE_FREQ('D6'),0.2,0.3]],
    };
    const seq = seqs[type] || seqs.tap;
    for (const [freq, dur, offset] of seq) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type === 'wrong' ? 'sawtooth' : 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.3, t + offset);
      g.gain.setTargetAtTime(0, t + offset + dur * 0.6, 0.04);
      osc.connect(g);
      g.connect(this.seGain);
      osc.start(t + offset);
      osc.stop(t + offset + dur + 0.1);
    }
  }

  playWord(wordId) {
    // Resume AudioContext first (iOS requirement)
    if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
    let audio = this.wordAudios[wordId];
    if (!audio) {
      // Try with kata_ prefix
      const w = STORY_WORDS.find(w => w.id === wordId);
      if (w) {
        audio = new Audio(`./audio/${w.audio}.mp3`);
        this.wordAudios[wordId] = audio;
      }
    }
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = Math.min(1, (this.state.settings.seVol || 0.7) * 1.3);
    audio.play().catch(() => {});
  }

  // ===== LOADING =====
  _showLoading() {
    this.showScreen('loading-screen');
    const bar = document.getElementById('loading-bar');
    const text = document.getElementById('loading-text');
    let pct = 0;
    const steps = [
      [300,  20, 'ながれぼし...✨'],
      [600,  50, 'まほうをかけてる...🌹'],
      [900,  80, 'おしろが あらわれてきた...🏰'],
      [1200, 100, 'できあがり！'],
    ];
    steps.forEach(([delay, val, msg]) => {
      setTimeout(() => {
        pct = val;
        bar.style.width = `${pct}%`;
        text.textContent = msg;
        if (val === 100) {
          setTimeout(() => this._showTitle(), 400);
        }
      }, delay);
    });
  }

  _showTitle() {
    this.showScreen('title-screen');
    const hasSave = this.state.module1.words_mastered.length > 0 || this.state.module2.room_stars.ballroom > 0;
    const cont = document.getElementById('btn-continue');
    if (hasSave) cont.classList.remove('hidden');
    else cont.classList.add('hidden');
  }

  // ===== SETUP EVENT LISTENERS =====
  _setupEventListeners() {
    // Title
    document.getElementById('btn-start').addEventListener('click', () => {
      this.initAudio();
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      this.saveState();
      this._startGame();
    });
    document.getElementById('btn-continue').addEventListener('click', () => {
      this.initAudio();
      if (this.state.module1.key_earned) this._showCastle();
      else this._showStory();
    });
    document.getElementById('btn-settings-title').addEventListener('click', () => {
      this.initAudio();
      this._openSettings();
    });

    // Story navigation
    document.getElementById('btn-story-next').addEventListener('click', () => this._storyNext());
    document.getElementById('btn-story-prev').addEventListener('click', () => this._storyPrev());

    // Badge
    document.getElementById('btn-badge-ok').addEventListener('click', () => {
      this.playSe('unlock');
      this._showCastle();
    });

    // Map
    document.getElementById('btn-map-story').addEventListener('click', () => {
      this.stopBgm();
      this._showStory();
    });
    document.querySelectorAll('.room-card').forEach(card => {
      card.addEventListener('click', () => {
        const roomId = card.dataset.room;
        if (!this.state.module2.rooms_unlocked.includes(roomId)) return;
        this.initAudio();
        this._showRoom(roomId);
      });
    });

    // Room back
    document.getElementById('btn-room-back').addEventListener('click', () => {
      this.stopBgm();
      this._showMap();
    });

    // Task back
    document.getElementById('btn-task-back').addEventListener('click', () => {
      this._showRoom(this.currentRoom);
    });

    // Trace back
    document.getElementById('btn-trace-back').addEventListener('click', () => {
      this._showRoom(this.currentRoom);
    });
    document.getElementById('btn-trace-clear').addEventListener('click', () => this._traceClear());
    document.getElementById('btn-trace-check').addEventListener('click', () => this._traceCheck());

    // Settings
    document.getElementById('btn-settings-close').addEventListener('click', () => {
      document.getElementById('settings-panel').classList.add('hidden');
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('さいしょから やりなおしますか？')) {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.saveState();
        this.stopBgm();
        this._showTitle();
        document.getElementById('settings-panel').classList.add('hidden');
      }
    });
    document.getElementById('settings-bgm').addEventListener('input', e => {
      const v = parseInt(e.target.value) / 100;
      this.state.settings.bgmVol = v;
      document.getElementById('settings-bgm-val').textContent = `${e.target.value}%`;
      if (this.bgmGain) this.bgmGain.gain.value = v;
      this.saveState();
    });
    document.getElementById('settings-se').addEventListener('input', e => {
      const v = parseInt(e.target.value) / 100;
      this.state.settings.seVol = v;
      document.getElementById('settings-se-val').textContent = `${e.target.value}%`;
      if (this.seGain) this.seGain.gain.value = v;
      this.saveState();
    });
  }

  _openSettings() {
    const panel = document.getElementById('settings-panel');
    const bgmVol = this.state.settings.bgmVol || 0.5;
    const seVol  = this.state.settings.seVol  || 0.7;
    document.getElementById('settings-bgm').value = Math.round(bgmVol * 100);
    document.getElementById('settings-bgm-val').textContent = `${Math.round(bgmVol * 100)}%`;
    document.getElementById('settings-se').value  = Math.round(seVol * 100);
    document.getElementById('settings-se-val').textContent  = `${Math.round(seVol  * 100)}%`;
    panel.classList.remove('hidden');
  }

  _startGame() {
    this.playBgm('story');
    this.currentPage = 0;
    this._showStory();
  }

  // ===== STORY MODULE =====
  _showStory() {
    this.showScreen('story-screen');
    if (!this.currentBgm || this.currentBgm !== 'story') this.playBgm('story');
    this.currentPage = this.state.module1.story_page || 0;
    this._renderStoryPage(this.currentPage);
    this._renderStoryWordRow();
  }

  _renderStoryPage(n) {
    const page = STORY_PAGES[n];
    if (!page) return;
    document.getElementById('story-page-num').textContent = `${n+1} / ${STORY_PAGES.length}`;

    // char area
    document.getElementById('story-char-area').textContent = page.char;

    // text with highlighted kata words
    const textEl = document.getElementById('story-text-area');
    textEl.innerHTML = this._parseStoryText(page.text);

    // attach click handlers to kata-word elements
    textEl.querySelectorAll('.kata-word').forEach(el => {
      el.addEventListener('click', () => this._onWordTap(el.dataset.wordId, el));
    });

    // progress dots
    const dots = document.getElementById('story-progress');
    dots.innerHTML = '';
    for (let i = 0; i < STORY_PAGES.length; i++) {
      const d = document.createElement('div');
      d.className = `progress-dot${i === n ? ' active' : ''}`;
      dots.appendChild(d);
    }

    // update background tint
    document.getElementById('story-screen').style.background =
      `linear-gradient(180deg, ${page.bg} 0%, #1A0A2E 100%)`;

    // nav button visibility
    document.getElementById('btn-story-prev').style.visibility = n > 0 ? 'visible' : 'hidden';
    const allMastered = STORY_WORDS.every(w => this.state.module1.words_mastered.includes(w.id));
    const isLast = n === STORY_PAGES.length - 1;
    document.getElementById('btn-story-next').textContent = (isLast && allMastered) ? '✨ つぎへ！' : 'つぎ ▶';

    this.state.module1.story_page = n;
    this.saveState();
  }

  _parseStoryText(text) {
    // Replace [word_id:表示テキスト] with spans
    return text.replace(/\[(\w+):([^\]]+)\]/g, (_, wordId, display) => {
      const alreadyMastered = this.state.module1.words_mastered.includes(wordId);
      return `<span class="kata-word${alreadyMastered ? ' glow' : ''}" data-word-id="${wordId}">${display}</span>`;
    }).replace(/\n/g, '<br>');
  }

  _renderStoryWordRow() {
    const row = document.getElementById('story-words-row');
    row.innerHTML = '';
    STORY_WORDS.forEach(w => {
      const chip = document.createElement('div');
      chip.className = `story-word-chip${this.state.module1.words_mastered.includes(w.id) ? ' mastered' : ''}`;
      const check = this.state.module1.words_mastered.includes(w.id) ? '✓' : '○';
      chip.innerHTML = `<span class="chip-check">${check}</span>${w.kata}`;
      chip.addEventListener('click', () => this._onWordTap(w.id, chip));
      row.appendChild(chip);
    });
  }

  _onWordTap(wordId, el) {
    this.initAudio();
    if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();

    // Play MP3
    this.playWord(wordId);
    this.playSe('sparkle');

    // Glow animation
    el.classList.add('glow');
    setTimeout(() => el.classList.remove('glow'), 700);

    // Show word pop
    const w = STORY_WORDS.find(w => w.id === wordId);
    if (w) {
      const pop = document.getElementById('word-pop');
      document.getElementById('word-pop-kata').textContent = w.kata;
      document.getElementById('word-pop-sub').textContent = w.emoji + ' ' + w.en;
      pop.classList.remove('hidden');
      setTimeout(() => pop.classList.add('hidden'), 1800);
    }

    // Mark as mastered
    if (!this.state.module1.words_mastered.includes(wordId)) {
      this.state.module1.words_mastered.push(wordId);
      this.saveState();
      this._renderStoryWordRow();
      // re-render text to show mastered state
      this._renderStoryPage(this.currentPage);
    }

    // Check if all mastered
    const allMastered = STORY_WORDS.every(wd => this.state.module1.words_mastered.includes(wd.id));
    if (allMastered) {
      const isLast = this.currentPage === STORY_PAGES.length - 1;
      document.getElementById('btn-story-next').textContent = isLast ? '✨ つぎへ！' : 'つぎ ▶';
    }
  }

  _storyNext() {
    if (this.currentPage < STORY_PAGES.length - 1) {
      this.currentPage++;
      this._renderStoryPage(this.currentPage);
    } else {
      // Last page → check if all words mastered
      const allMastered = STORY_WORDS.every(w => this.state.module1.words_mastered.includes(w.id));
      if (allMastered) {
        this._completeModule1();
      } else {
        // Prompt user to tap remaining words
        const remaining = STORY_WORDS.filter(w => !this.state.module1.words_mastered.includes(w.id));
        this._showToast(`まだ タップしていない ことばがあるよ！\n${remaining.map(w=>w.kata).join(' ')}`, 3000);
      }
    }
  }

  _storyPrev() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this._renderStoryPage(this.currentPage);
    }
  }

  _completeModule1() {
    this.state.module1.key_earned = true;
    this.saveState();
    this.stopBgm();
    this.playSe('badge');
    this._showPetals();

    // Render badge screen
    const wordsEl = document.getElementById('badge-words');
    wordsEl.innerHTML = '';
    STORY_WORDS.forEach(w => {
      const chip = document.createElement('div');
      chip.className = 'badge-word-chip';
      chip.textContent = `${w.emoji} ${w.kata}`;
      wordsEl.appendChild(chip);
    });

    this.showScreen('badge-screen');
  }

  // ===== MAP =====
  _showMap() {
    this.showScreen('map-screen');
    if (!this.currentBgm || this.currentBgm !== 'castle') this.playBgm('castle');
    this._updateMapUI();
  }

  _updateMapUI() {
    const rooms = ROOM_DEFS;
    rooms.forEach(r => {
      const stars = this.state.module2.room_stars[r.id] || 0;
      const el = document.getElementById(`room-${r.id}`);
      const starsEl = document.getElementById(`stars-${r.id}`);
      const lockEl = document.getElementById(`lock-${r.id}`);
      const unlocked = this.state.module2.rooms_unlocked.includes(r.id);

      const starStr = '⭐'.repeat(stars) + '☆'.repeat(Math.max(0, 1 - stars));
      starsEl.textContent = starStr;

      if (unlocked) {
        el.classList.remove('locked');
        lockEl.classList.add('hidden');
        if (stars >= 1) el.classList.add('cleared');
      } else {
        el.classList.add('locked');
        lockEl.classList.remove('hidden');
      }
    });

    // show mastered words on map
    const mapWords = document.getElementById('map-words');
    mapWords.innerHTML = '';
    STORY_WORDS.forEach(w => {
      const mastered = this.state.module1.words_mastered.includes(w.id);
      const chip = document.createElement('div');
      chip.className = `map-word-chip${mastered ? ' mastered' : ''}`;
      chip.textContent = `${w.emoji} ${w.kata}`;
      chip.addEventListener('click', () => {
        this.initAudio();
        this.playWord(w.id);
        this.playSe('sparkle');
        chip.style.transform = 'scale(1.2)';
        setTimeout(() => chip.style.transform = '', 300);
      });
      mapWords.appendChild(chip);
    });
  }

  // ===== ROOM =====
  _showRoom(roomId) {
    this.currentRoom = roomId;
    const roomDef = ROOM_DEFS.find(r => r.id === roomId);
    if (!roomDef) return;

    this.showScreen('room-screen');
    this.stopBgm();
    this.playBgm('room');

    document.getElementById('room-title-bar').textContent = `${roomDef.icon} ${roomDef.name}`;

    this._renderRoomContent(roomDef);
  }

  _renderRoomContent(roomDef) {
    const content = document.getElementById('room-content');
    content.innerHTML = '';

    // Intro
    const intro = document.createElement('div');
    intro.className = 'room-intro-area';
    intro.innerHTML = `<div class="room-intro-icon">${roomDef.icon}</div>
      <div class="room-intro-name">${roomDef.name}</div>
      <div class="room-intro-desc">${roomDef.desc}</div>`;
    content.appendChild(intro);

    // Task dots
    const dotsEl = document.getElementById('room-task-dots');
    dotsEl.innerHTML = '';
    roomDef.tasks.forEach((_, i) => {
      const key = `${roomDef.id}_${i}`;
      const done = !!this.state.module2.task_progress[key];
      const d = document.createElement('div');
      d.className = `task-dot${done ? ' done' : ''}`;
      dotsEl.appendChild(d);
    });

    // Task list
    const taskList = document.createElement('div');
    taskList.className = 'task-list';
    let prevDone = true;
    roomDef.tasks.forEach((task, i) => {
      const key = `${roomDef.id}_${i}`;
      const done = !!this.state.module2.task_progress[key];
      const locked = !prevDone;
      const item = document.createElement('div');
      item.className = `task-item${done ? ' completed' : ''}${locked ? ' locked' : ''}`;
      item.innerHTML = `
        <div class="task-num">${done ? '⭐' : i+1}</div>
        <div class="task-info"><div class="task-label">${task.label}</div></div>
        <div class="task-check">${done ? '✅' : '▶'}</div>
      `;
      if (!locked) {
        item.addEventListener('click', () => this._startTask(roomDef.id, i));
      }
      taskList.appendChild(item);
      prevDone = done;
    });
    content.appendChild(taskList);

    // Check if all tasks done → show clear
    const allDone = roomDef.tasks.every((_, i) => !!this.state.module2.task_progress[`${roomDef.id}_${i}`]);
    if (allDone && (this.state.module2.room_stars[roomDef.id] || 0) === 0) {
      this._completeRoom(roomDef.id);
    } else if (allDone) {
      const clearArea = document.createElement('div');
      clearArea.className = 'room-clear-banner';
      const stars = this.state.module2.room_stars[roomDef.id] || 0;
      clearArea.innerHTML = `
        <div class="room-clear-stars">${'⭐'.repeat(stars)}</div>
        <div class="room-clear-title">クリアずみ！</div>
        <button class="btn-room-back-map">🗺️ マップへ</button>
      `;
      clearArea.querySelector('.btn-room-back-map').addEventListener('click', () => this._showMap());
      content.appendChild(clearArea);
    }
  }

  _startTask(roomId, taskIdx) {
    this.currentRoom = roomId;
    this.currentTask = taskIdx;
    const roomDef = ROOM_DEFS.find(r => r.id === roomId);
    const task = roomDef.tasks[taskIdx];
    if (!task) return;

    this.showScreen('task-screen');
    document.getElementById('task-title').textContent = task.title;
    document.getElementById('task-feedback').classList.add('hidden');

    const content = document.getElementById('task-content');
    content.innerHTML = '';

    this.tapCount = 0;
    this.findCount = 0;

    switch(task.type) {
      case 'tap_count':   this._renderTapCountTask(task, content); break;
      case 'kata_choice': this._renderChoiceTask(task, content); break;
      case 'math_add':    this._renderMathTask(task, content); break;
      case 'count':       this._renderCountTask(task, content); break;
      case 'find_hidden': this._renderFindTask(task, content); break;
      default: this._renderChoiceTask(task, content);
    }
  }

  _renderTapCountTask(task, container) {
    const area = document.createElement('div');
    area.className = 'tap-count-area';
    area.innerHTML = `
      <div class="task-question">${task.question}</div>
      <div class="tap-count-display" id="tc-display">0</div>
      <div class="tap-count-progress"><div class="tap-count-bar" id="tc-bar"></div></div>
      <button class="btn-tap-dance" id="btn-tap-dance">
        ${task.emoji || '💃'}
        <div class="btn-tap-label">${task.btnLabel || 'タップ！'}</div>
      </button>
    `;
    container.appendChild(area);

    const display = container.querySelector('#tc-display');
    const bar = container.querySelector('#tc-bar');
    const btn = container.querySelector('#btn-tap-dance');
    const target = task.targetCount || 8;

    btn.addEventListener('click', () => {
      this.tapCount++;
      this.playSe('tap');
      display.textContent = this.tapCount;
      bar.style.width = `${(this.tapCount / target) * 100}%`;

      // bounce animation
      btn.style.transform = 'scale(0.9) translateY(6px)';
      setTimeout(() => btn.style.transform = '', 150);

      if (this.tapCount >= target) {
        btn.disabled = true;
        this.playSe('correct');
        setTimeout(() => this._completeTask(), 600);
      }
    });
  }

  _renderChoiceTask(task, container) {
    const area = document.createElement('div');
    area.className = 'choice-area';
    area.innerHTML = `
      <div class="task-question">${task.question}</div>
      <div class="choice-img">${task.image || '❓'}</div>
    `;
    container.appendChild(area);

    const shuffled = [...(task.choices || [])].sort(() => Math.random() - 0.5);
    shuffled.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'btn-choice';
      btn.textContent = choice;
      btn.addEventListener('click', () => {
        if (container.querySelector('.correct-ans')) return; // already answered
        const isCorrect = choice === task.correct;
        btn.classList.add(isCorrect ? 'correct-ans' : 'wrong-ans');
        if (isCorrect) {
          this.playSe('correct');
          // Play audio if available
          if (task.audioKey) this.playWord(task.audioKey);
          setTimeout(() => this._completeTask(), 900);
        } else {
          this.playSe('wrong');
          // Show correct answer
          setTimeout(() => {
            const allBtns = container.querySelectorAll('.btn-choice');
            allBtns.forEach(b => {
              if (b.textContent === task.correct) b.classList.add('correct-ans');
            });
            setTimeout(() => this._completeTask(), 1200);
          }, 500);
        }
      });
      area.appendChild(btn);
    });
  }

  _renderMathTask(task, container) {
    const area = document.createElement('div');
    area.className = 'math-area';

    // visual items
    const total = task.a + task.b;
    let visualHtml = '<div class="math-visual">';
    for (let i = 0; i < task.a; i++) visualHtml += `<span class="math-item">${task.emoji || '⭐'}</span>`;
    visualHtml += '</div>';
    visualHtml += '<div class="math-divider"></div>';
    let visual2Html = '<div class="math-visual">';
    for (let i = 0; i < task.b; i++) visual2Html += `<span class="math-item">${task.emoji || '⭐'}</span>`;
    visual2Html += '</div>';

    area.innerHTML = `
      <div class="task-question">${task.question}</div>
      ${visualHtml}${visual2Html}
      <div class="math-eq">
        <span class="eq-num">${task.a}</span> ＋ <span class="eq-num">${task.b}</span> ＝ ?
      </div>
      <div class="math-answer-row" id="math-ans-row"></div>
    `;
    container.appendChild(area);

    const ansRow = area.querySelector('#math-ans-row');
    const choices = task.answerChoices || [total - 2, total - 1, total, total + 1];
    choices.sort(() => Math.random() - 0.5);
    choices.forEach(n => {
      const btn = document.createElement('button');
      btn.className = 'btn-math-ans';
      btn.textContent = n;
      btn.addEventListener('click', () => {
        if (ansRow.querySelector('[disabled]')) return;
        ansRow.querySelectorAll('.btn-math-ans').forEach(b => b.disabled = true);
        const isCorrect = n === total;
        btn.style.background = isCorrect ? 'rgba(100,220,100,0.4)' : 'rgba(220,80,80,0.4)';
        this.playSe(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) {
          setTimeout(() => this._completeTask(), 900);
        } else {
          ansRow.querySelectorAll('.btn-math-ans').forEach(b => {
            if (parseInt(b.textContent) === total) b.style.background = 'rgba(100,220,100,0.4)';
          });
          setTimeout(() => this._completeTask(), 1500);
        }
      });
      ansRow.appendChild(btn);
    });
  }

  _renderCountTask(task, container) {
    const area = document.createElement('div');
    area.className = 'count-area';
    const emojis = task.items.split('');
    const items = emojis.map((e, i) => `<span class="count-item" data-idx="${i}">${e}</span>`).join('');
    area.innerHTML = `
      <div class="task-question">${task.question}</div>
      <div class="count-items">${items}</div>
      <div class="count-answer" id="count-val">0</div>
      <div class="count-btns" id="count-btns"></div>
    `;
    container.appendChild(area);

    // tappable items
    let tapped = 0;
    area.querySelectorAll('.count-item').forEach(el => {
      el.addEventListener('click', () => {
        if (el.classList.contains('tapped')) return;
        el.classList.add('tapped');
        tapped++;
        this.playSe('tap');
        area.querySelector('#count-val').textContent = tapped;
      });
    });

    // answer choices
    const btns = area.querySelector('#count-btns');
    const choices = task.answerChoices || [task.count - 1, task.count, task.count + 1, task.count + 2];
    choices.sort(() => Math.random() - 0.5);
    choices.forEach(n => {
      const btn = document.createElement('button');
      btn.className = 'btn-count-ans';
      btn.textContent = n;
      btn.addEventListener('click', () => {
        if (btns.querySelector('[disabled]')) return;
        btns.querySelectorAll('.btn-count-ans').forEach(b => b.disabled = true);
        const isCorrect = n === task.count;
        btn.style.background = isCorrect ? 'rgba(100,220,100,0.4)' : 'rgba(220,80,80,0.4)';
        this.playSe(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) {
          btns.querySelectorAll('.btn-count-ans').forEach(b => {
            if (parseInt(b.textContent) === task.count) b.style.background = 'rgba(100,220,100,0.4)';
          });
        }
        setTimeout(() => this._completeTask(), isCorrect ? 900 : 1500);
      });
      btns.appendChild(btn);
    });
  }

  _renderFindTask(task, container) {
    const area = document.createElement('div');
    area.className = 'find-area';
    container.appendChild(document.createElement('div')); // spacer
    const topArea = document.createElement('div');
    topArea.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;width:100%';
    const qDiv = document.createElement('div');
    qDiv.className = 'task-question';
    qDiv.textContent = task.question;
    const countDiv = document.createElement('div');
    countDiv.className = 'find-found-count';
    countDiv.id = 'find-count';
    countDiv.textContent = `みつけた： 0 / ${task.totalItems}`;
    topArea.appendChild(qDiv);
    topArea.appendChild(countDiv);
    container.appendChild(topArea);
    container.appendChild(area);

    // Place hidden objects at random positions
    const positions = [
      [15, 20], [60, 10], [30, 55], [75, 65], [10, 75], [50, 30], [80, 45]
    ].slice(0, task.totalItems + 4);

    // Shuffle and pick totalItems
    const shuffled = positions.sort(() => Math.random() - 0.5).slice(0, task.totalItems);

    let found = 0;
    shuffled.forEach((pos, i) => {
      const obj = document.createElement('div');
      obj.className = 'hidden-obj';
      obj.textContent = task.emoji || '🌹';
      obj.style.left = `${pos[0]}%`;
      obj.style.top  = `${pos[1]}%`;
      obj.addEventListener('click', () => {
        if (obj.classList.contains('found')) return;
        obj.classList.add('found');
        found++;
        this.playSe('sparkle');
        const countEl = document.getElementById('find-count');
        if (countEl) countEl.textContent = `みつけた： ${found} / ${task.totalItems}`;
        if (found >= task.totalItems) {
          this.playSe('correct');
          setTimeout(() => this._completeTask(), 800);
        }
      });
      area.appendChild(obj);
    });
  }

  _completeTask() {
    const roomDef = ROOM_DEFS.find(r => r.id === this.currentRoom);
    const key = `${this.currentRoom}_${this.currentTask}`;

    this.state.module2.task_progress[key] = true;
    this.saveState();

    this.playSe('correct');
    this._showToast('✨ すごい！できたね！', 1800);

    // Check if all tasks in room done
    const allDone = roomDef.tasks.every((_, i) => !!this.state.module2.task_progress[`${this.currentRoom}_${i}`]);
    const nextTaskIdx = this._getNextTaskIdx(roomDef);

    if (this.inGameOverlay) {
      // オーバーレイモード
      if (allDone) {
        setTimeout(() => this._completeRoomOverlay(this.currentRoom), 1200);
      } else {
        setTimeout(() => this._showTaskOverlay(this.currentRoom, nextTaskIdx), 1200);
      }
    } else {
      // 既存パス（task-screen）
      if (allDone) {
        setTimeout(() => {
          this._completeRoom(this.currentRoom);
        }, 1200);
      } else {
        const nextTask = this.currentTask + 1;
        if (nextTask < roomDef.tasks.length) {
          setTimeout(() => {
            this._startTask(this.currentRoom, nextTask);
          }, 1200);
        } else {
          setTimeout(() => this._showRoom(this.currentRoom), 1200);
        }
      }
    }
  }

  _completeRoom(roomId) {
    const roomDef = ROOM_DEFS.find(r => r.id === roomId);
    if (this.state.module2.room_stars[roomId] === 0) {
      this.state.module2.room_stars[roomId] = 1;
      // Unlock next room
      const roomIdx = ROOM_DEFS.findIndex(r => r.id === roomId);
      if (roomIdx >= 0 && roomIdx < ROOM_DEFS.length - 1) {
        const nextRoom = ROOM_DEFS[roomIdx + 1];
        if (!this.state.module2.rooms_unlocked.includes(nextRoom.id)) {
          this.state.module2.rooms_unlocked.push(nextRoom.id);
          this._showToast(`🔓 ${nextRoom.icon} ${nextRoom.name} が かいほうされた！`, 3000);
        }
      }
      this.saveState();
    }

    this.playSe('badge');
    this._showPetals();

    // Show clear banner in room screen
    this.showScreen('room-screen');
    document.getElementById('room-title-bar').textContent = `${roomDef.icon} ${roomDef.name}`;
    const content = document.getElementById('room-content');
    content.innerHTML = '';

    const banner = document.createElement('div');
    banner.className = 'room-clear-banner';
    banner.innerHTML = `
      <div style="font-size:80px">🎉</div>
      <div class="room-clear-stars">⭐</div>
      <div class="room-clear-title">${roomDef.name}クリア！</div>
      <div style="font-size:1rem;opacity:0.8;text-align:center;padding:0 20px;line-height:1.6">
        すごい！ よくできました！
      </div>
      <button class="btn-room-back-map">🗺️ マップへ もどる</button>
    `;
    banner.querySelector('.btn-room-back-map').addEventListener('click', () => {
      this.stopBgm();
      this._showMap();
    });
    content.appendChild(banner);
  }

  // ===== TRACE SCREEN =====
  _showTraceScreen(charCode, onComplete) {
    this.traceChar = charCode;
    this.traceOnComplete = onComplete;
    this.traceStrokes = [];
    this.currentStroke = null;
    this.isDrawing = false;
    this.traceFailCount = 0;

    this.showScreen('trace-screen');
    document.getElementById('trace-char-label').textContent = `なぞろう：${charCode}`;
    document.getElementById('trace-overlay').classList.add('hidden');
    document.getElementById('trace-fail-count').classList.add('hidden');

    const canvas = document.getElementById('trace-canvas');
    const wrap = document.getElementById('trace-canvas-wrap');
    // Set canvas resolution
    const size = wrap.offsetWidth || 280;
    canvas.width = size * (window.devicePixelRatio || 1);
    canvas.height = size * (window.devicePixelRatio || 1);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    this._traceDrawReference(canvas);
    this._traceBindEvents(canvas);
  }

  _traceDrawReference(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const char = this.traceChar;

    ctx.clearRect(0, 0, w, h);

    // Draw faint reference character
    ctx.font = `bold ${w * 0.72}px 'M PLUS Rounded 1c', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(200,152,10,0.18)';
    ctx.fillText(char, w / 2, h / 2);

    // Draw reference stroke guide
    const ref = KATA_STROKE_REFS[char];
    if (ref) {
      ctx.strokeStyle = 'rgba(200,152,10,0.25)';
      ctx.lineWidth = Math.max(2, w * 0.025);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const stroke of ref.strokes) {
        ctx.beginPath();
        stroke.forEach(([nx, ny], i) => {
          const px = nx * w;
          const py = ny * h;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.stroke();
      }
    }
  }

  _traceBindEvents(canvas) {
    // Remove old listeners by cloning
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    const c = newCanvas;

    const getPos = (e) => {
      const rect = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const src = e.touches ? e.touches[0] : e;
      return [
        (src.clientX - rect.left) * dpr,
        (src.clientY - rect.top)  * dpr,
      ];
    };

    c.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (document.getElementById('trace-overlay').classList.contains('hidden') === false) return;
      this.isDrawing = true;
      this.currentStroke = [getPos(e)];
    }, { passive: false });

    c.addEventListener('pointermove', e => {
      e.preventDefault();
      if (!this.isDrawing || !this.currentStroke) return;
      this.currentStroke.push(getPos(e));
      this._traceDrawStrokes(c);
    }, { passive: false });

    c.addEventListener('pointerup', e => {
      e.preventDefault();
      if (!this.isDrawing || !this.currentStroke) return;
      this.isDrawing = false;
      if (this.currentStroke.length > 2) {
        this.traceStrokes.push(this.currentStroke);
      }
      this.currentStroke = null;
    }, { passive: false });

    c.addEventListener('pointercancel', () => {
      this.isDrawing = false;
      this.currentStroke = null;
    });
  }

  _traceDrawStrokes(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    this._traceDrawReference(canvas);

    // Draw user strokes
    ctx.strokeStyle = 'rgba(200,80,200,0.85)';
    ctx.lineWidth = Math.max(4, w * 0.04);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const allStrokes = [...this.traceStrokes];
    if (this.currentStroke) allStrokes.push(this.currentStroke);

    for (const stroke of allStrokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i][0], stroke[i][1]);
      ctx.stroke();
    }
  }

  _traceClear() {
    this.traceStrokes = [];
    this.currentStroke = null;
    this.isDrawing = false;
    const canvas = document.getElementById('trace-canvas');
    this._traceDrawReference(canvas);
    document.getElementById('trace-overlay').classList.add('hidden');
    this.playSe('tap');
  }

  _traceCheck() {
    if (this.traceStrokes.length === 0) {
      this._showToast('まず ゆびで なぞってね！', 2000);
      return;
    }

    const ref = KATA_STROKE_REFS[this.traceChar];
    if (!ref) {
      // No reference → always pass
      this._traceSuccess();
      return;
    }

    const canvas = document.getElementById('trace-canvas');
    const w = canvas.width;
    const h = canvas.height;

    // Normalize user strokes to 0-1
    const userNorm = this.traceStrokes.map(s => s.map(([x, y]) => [x / w, y / h]));
    const score = this.recognizer.recognize(userNorm, ref.strokes);

    const overlay = document.getElementById('trace-overlay');
    overlay.classList.remove('hidden', 'correct', 'wrong');

    if (score >= 0.52) {
      overlay.classList.add('correct');
      overlay.innerHTML = '◯<br><span style="font-size:1.2rem">じょうず！</span>';
      this.playSe('correct');
      setTimeout(() => {
        overlay.classList.add('hidden');
        this._traceSuccess();
      }, 1500);
    } else {
      this.traceFailCount++;
      overlay.classList.add('wrong');
      overlay.innerHTML = `✕<br><span style="font-size:1rem">もういちど！</span>`;
      this.playSe('wrong');

      const failEl = document.getElementById('trace-fail-count');
      const remaining = Math.max(0, 3 - this.traceFailCount);
      if (this.traceFailCount >= 1) {
        failEl.classList.remove('hidden');
        document.getElementById('trace-fail-num').textContent = remaining;
      }

      setTimeout(() => {
        overlay.classList.add('hidden');
        this.traceStrokes = [];
        const c = document.getElementById('trace-canvas');
        this._traceDrawReference(c);
        // re-bind events
        this._traceBindEvents(c);

        if (this.traceFailCount >= 3) {
          // Show hint: animate the reference strokes
          this._traceShowAnimation();
          this.traceFailCount = 0;
          failEl.classList.add('hidden');
        }
      }, 1500);
    }
  }

  _traceShowAnimation() {
    this._showToast(`ヒント：\nうすい せんを なぞってね！`, 2500);
    // Flash the reference strokes brighter
    const canvas = document.getElementById('trace-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const ref = KATA_STROKE_REFS[this.traceChar];
    if (!ref) return;
    let alpha = 0;
    let dir = 1;
    let count = 0;
    const anim = setInterval(() => {
      ctx.clearRect(0, 0, w, h);
      ctx.font = `bold ${w * 0.72}px 'M PLUS Rounded 1c', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(200,152,10,${0.1 + alpha * 0.2})`;
      ctx.fillText(this.traceChar, w/2, h/2);
      ctx.strokeStyle = `rgba(255,220,80,${0.3 + alpha * 0.6})`;
      ctx.lineWidth = Math.max(4, w * 0.04);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const stroke of ref.strokes) {
        ctx.beginPath();
        stroke.forEach(([nx, ny], i) => {
          i === 0 ? ctx.moveTo(nx*w, ny*h) : ctx.lineTo(nx*w, ny*h);
        });
        ctx.stroke();
      }
      alpha += dir * 0.05;
      if (alpha >= 1) dir = -1;
      if (alpha <= 0) { dir = 1; count++; }
      if (count >= 3) { clearInterval(anim); this._traceDrawReference(canvas); }
    }, 40);
  }

  _traceSuccess() {
    if (this.traceOnComplete) {
      const cb = this.traceOnComplete;
      this.traceOnComplete = null;
      cb();
    } else {
      this._showRoom(this.currentRoom);
    }
  }

  // ===== 2D CASTLE GAME =====
  _showCastle() {
    this.showScreen('game-screen');
    if (!this.currentBgm || this.currentBgm !== 'castle') this.playBgm('castle');
    this._resizeCanvas();
    this._bindDpad();
    this._startGameLoop();
  }

  _resizeCanvas() {
    const canvas = document.getElementById('game-canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const floorY = window.innerHeight * 0.72;
    this.belle.y = floorY - this.BELLE_HEIGHT;
  }

  _startGameLoop() {
    if (this.gameLoop) return;
    this.lastTimestamp = 0;
    const loop = (ts) => {
      if (this.currentScreen !== 'game-screen') {
        this.gameLoop = null;
        return;
      }
      const dt = Math.min((ts - (this.lastTimestamp || ts)) / 1000, 0.05);
      this.lastTimestamp = ts;
      this._updateWorld(dt);
      this._renderWorld();
      this.gameLoop = requestAnimationFrame(loop);
    };
    this.gameLoop = requestAnimationFrame(loop);
  }

  _stopGameLoop() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }
  }

  _updateWorld(dt) {
    if (this.inGameOverlay) return;
    const W = window.innerWidth;
    if (this.input.left) {
      this.belle.x -= this.BELLE_SPEED * dt;
      this.belle.facingRight = false;
    }
    if (this.input.right) {
      this.belle.x += this.BELLE_SPEED * dt;
      this.belle.facingRight = true;
    }
    this.belle.x = Math.max(40, Math.min(this.worldWidth - 40, this.belle.x));
    if (this.input.left || this.input.right) {
      this.belle.bobPhase += dt * 8;
    }
    this.worldX = Math.max(0, Math.min(this.worldWidth - W, this.belle.x - W / 2));
    this.torchPhase += dt * 3;
    this._checkDoorProximity();
  }

  _renderWorld() {
    const canvas = document.getElementById('game-canvas');
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    this._drawBackground(ctx, W, H);
    this._drawFloor(ctx, W, H);
    this._drawTorches(ctx, W, H);
    this._drawDoors(ctx, W, H);
    this._drawBelle(ctx, W, H);
    ctx.restore();
  }

  _drawBackground(ctx, W, H) {
    const grd = ctx.createLinearGradient(0, 0, 0, H * 0.72);
    grd.addColorStop(0, '#0a0520');
    grd.addColorStop(0.5, '#1a0a3e');
    grd.addColorStop(1, '#2d1b69');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H * 0.72);
    const brickOffsetX = -(this.worldX * 0.3) % 60;
    ctx.strokeStyle = 'rgba(60,30,90,0.4)';
    ctx.lineWidth = 1;
    const brickW = 60;
    const brickH = 30;
    for (let row = 0; row < Math.ceil(H * 0.72 / brickH) + 1; row++) {
      const y = row * brickH;
      const offset = (row % 2 === 0) ? 0 : brickW / 2;
      for (let col = -1; col < Math.ceil(W / brickW) + 2; col++) {
        const x = col * brickW + offset + brickOffsetX;
        ctx.strokeRect(x, y, brickW, brickH);
      }
    }
  }

  _drawFloor(ctx, W, H) {
    const floorY = H * 0.72;
    const floorH = H - floorY;
    const grd = ctx.createLinearGradient(0, floorY, 0, H);
    grd.addColorStop(0, '#3d2f1a');
    grd.addColorStop(1, '#1a1208');
    ctx.fillStyle = grd;
    ctx.fillRect(0, floorY, W, floorH);
    const tileW = 80;
    const tileOffsetX = -(this.worldX) % tileW;
    ctx.strokeStyle = 'rgba(100,80,40,0.4)';
    ctx.lineWidth = 1.5;
    for (let col = -1; col < Math.ceil(W / tileW) + 2; col++) {
      const x = col * tileW + tileOffsetX;
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(200,152,10,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(W, floorY);
    ctx.stroke();
  }

  _drawTorches(ctx, W, H) {
    const floorY = H * 0.72;
    const torchWorldPositions = [180, 500, 860, 1220, 1620];
    torchWorldPositions.forEach(worldPos => {
      const screenX = worldPos - this.worldX;
      if (screenX < -60 || screenX > W + 60) return;
      const torchY = floorY * 0.45;
      const flicker = Math.sin(this.torchPhase + worldPos * 0.01) * 0.3 + 0.7;
      const glowRadius = 60 * flicker;
      const grd = ctx.createRadialGradient(screenX, torchY, 0, screenX, torchY, glowRadius);
      grd.addColorStop(0, `rgba(255,180,50,${0.25 * flicker})`);
      grd.addColorStop(1, 'rgba(255,180,50,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(screenX, torchY, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5a3a10';
      ctx.fillRect(screenX - 6, torchY + 5, 12, 18);
      ctx.font = `${24 * flicker}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔥', screenX, torchY);
    });
  }

  _drawDoors(ctx, W, H) {
    const floorY = H * 0.72;
    const doorW = 70;
    const doorH = 110;
    ROOM_DEFS.forEach(room => {
      const worldPos = this.DOOR_POSITIONS[room.id];
      if (!worldPos) return;
      const screenX = worldPos - this.worldX;
      if (screenX < -100 || screenX > W + 100) return;
      const x = screenX - doorW / 2;
      const y = floorY - doorH;
      const unlocked = this.state.module2.rooms_unlocked.includes(room.id);
      const isNear = this.nearDoor === room.id;
      ctx.fillStyle = isNear ? '#6b4510' : '#4a2f0a';
      ctx.fillRect(x - 5, y - 5, doorW + 10, doorH + 5);
      ctx.fillStyle = unlocked ? '#2a1a6a' : '#1a1a1a';
      ctx.fillRect(x, y, doorW, doorH);
      ctx.fillStyle = unlocked ? '#3a2a7a' : '#2a2a2a';
      ctx.beginPath();
      ctx.arc(screenX, y, doorW / 2, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = isNear ? 'rgba(240,208,96,0.9)' : 'rgba(200,152,10,0.5)';
      ctx.lineWidth = isNear ? 3 : 2;
      ctx.beginPath();
      ctx.arc(screenX, y, doorW / 2, Math.PI, 0);
      ctx.stroke();
      ctx.strokeRect(x, y, doorW, doorH);
      const stars = this.state.module2.room_stars[room.id] || 0;
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (!unlocked) {
        ctx.fillText('🔒', screenX, y + doorH / 2);
      } else if (stars >= 1) {
        ctx.fillText('⭐', screenX, y + doorH / 2);
      } else {
        ctx.fillText(room.icon, screenX, y + doorH / 2);
      }
      ctx.font = 'bold 12px "M PLUS Rounded 1c", sans-serif';
      ctx.fillStyle = isNear ? '#f0d060' : 'rgba(240,208,96,0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(room.name, screenX, floorY + 6);
      if (isNear) {
        ctx.strokeStyle = `rgba(240,208,96,${0.5 + 0.3 * Math.sin(this.torchPhase * 2)})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 3, y - 3, doorW + 6, doorH + 6);
      }
    });
  }

  _drawBelle(ctx, W, H) {
    const floorY = H * 0.72;
    const belleScreenX = this.belle.x - this.worldX;
    const bob = Math.sin(this.belle.bobPhase) * 4;
    const belleY = floorY - this.BELLE_HEIGHT / 2 + bob;
    ctx.save();
    if (!this.belle.facingRight) {
      ctx.translate(belleScreenX, belleY);
      ctx.scale(-1, 1);
      ctx.translate(-belleScreenX, -belleY);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(belleScreenX, floorY - 5, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${this.BELLE_HEIGHT * 0.8}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👸', belleScreenX, belleY);
    ctx.restore();
  }

  _checkDoorProximity() {
    let found = null;
    Object.entries(this.DOOR_POSITIONS).forEach(([roomId, worldPos]) => {
      if (Math.abs(this.belle.x - worldPos) <= this.DOOR_ZONE_RADIUS) {
        if (this.state.module2.rooms_unlocked.includes(roomId)) {
          found = roomId;
        }
      }
    });
    if (found !== this.nearDoor) {
      this.nearDoor = found;
      if (found) {
        this._showEnterBtn(found);
      } else {
        this._hideEnterBtn();
      }
    }
  }

  _showEnterBtn(roomId) {
    const btn = document.getElementById('enter-room-btn');
    btn.classList.remove('hidden');
    btn.onclick = () => this._enterRoom(roomId);
  }

  _hideEnterBtn() {
    const btn = document.getElementById('enter-room-btn');
    btn.classList.add('hidden');
    btn.onclick = null;
  }

  _enterRoom(roomId) {
    this._stopGameLoop();
    this._hideEnterBtn();
    this.inGameOverlay = true;
    this.currentRoom = roomId;
    this.currentTask = 0;
    const roomDef = ROOM_DEFS.find(r => r.id === roomId);
    const taskIdx = this._getNextTaskIdx(roomDef);
    this._showTaskOverlay(roomId, taskIdx);
  }

  _getNextTaskIdx(roomDef) {
    for (let i = 0; i < roomDef.tasks.length; i++) {
      const key = `${roomDef.id}_${i}`;
      if (!this.state.module2.task_progress[key]) return i;
    }
    return null;
  }

  _showTaskOverlay(roomId, taskIdx) {
    const roomDef = ROOM_DEFS.find(r => r.id === roomId);
    const overlay = document.getElementById('room-overlay');
    overlay.classList.remove('hidden');
    document.getElementById('room-overlay-title').textContent = `${roomDef.icon} ${roomDef.name}`;
    const dotsEl = document.getElementById('room-overlay-dots');
    dotsEl.innerHTML = '';
    roomDef.tasks.forEach((_, i) => {
      const key = `${roomDef.id}_${i}`;
      const done = !!this.state.module2.task_progress[key];
      const d = document.createElement('div');
      d.className = `task-dot${done ? ' done' : (i === taskIdx ? ' current' : '')}`;
      dotsEl.appendChild(d);
    });
    const content = document.getElementById('room-overlay-content');
    content.innerHTML = '';
    if (taskIdx === null) {
      this._renderOverlayClearBanner(roomId, content, roomDef);
      return;
    }
    const task = roomDef.tasks[taskIdx];
    this.currentTask = taskIdx;
    this.tapCount = 0;
    this.findCount = 0;
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'font-size:1rem;color:rgba(255,244,224,0.7);font-weight:700;text-align:center';
    titleDiv.textContent = task.title;
    content.appendChild(titleDiv);
    switch(task.type) {
      case 'tap_count':   this._renderTapCountTask(task, content); break;
      case 'kata_choice': this._renderChoiceTask(task, content); break;
      case 'math_add':    this._renderMathTask(task, content); break;
      case 'count':       this._renderCountTask(task, content); break;
      case 'find_hidden': this._renderFindTask(task, content); break;
      default: this._renderChoiceTask(task, content);
    }
    const feedbackEl = document.getElementById('room-overlay-feedback');
    feedbackEl.className = 'hidden';
  }

  _renderOverlayClearBanner(roomId, content, roomDef) {
    const stars = this.state.module2.room_stars[roomId] || 0;
    const bannerDiv = document.createElement('div');
    bannerDiv.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 0;width:100%';
    bannerDiv.innerHTML = `
      <div style="font-size:72px">🎉</div>
      <div style="font-size:2.5rem">${'⭐'.repeat(stars)}</div>
      <div style="font-size:1.6rem;font-weight:900;color:var(--gold-lt);text-shadow:0 0 20px var(--gold)">${roomDef.name}クリア！</div>
      <div style="font-size:1rem;opacity:0.8;text-align:center;line-height:1.6">すごい！よくできました！</div>
    `;
    const backBtn = document.createElement('button');
    backBtn.style.cssText = 'width:200px;height:64px;border:none;border-radius:var(--radius);font-family:inherit;font-weight:900;font-size:1.1rem;background:linear-gradient(180deg,var(--gold),#8B6500);box-shadow:0 4px 0 #5a3f00;color:#fff;cursor:pointer;margin-top:8px;';
    backBtn.textContent = '🏰 おしろにもどる';
    backBtn.addEventListener('click', () => this._closeTaskOverlay());
    bannerDiv.appendChild(backBtn);
    content.appendChild(bannerDiv);
  }

  _closeTaskOverlay() {
    this.inGameOverlay = false;
    document.getElementById('room-overlay').classList.add('hidden');
    this._startGameLoop();
  }

  _completeRoomOverlay(roomId) {
    const roomDef = ROOM_DEFS.find(r => r.id === roomId);
    if (this.state.module2.room_stars[roomId] === 0) {
      this.state.module2.room_stars[roomId] = 1;
      const roomIdx = ROOM_DEFS.findIndex(r => r.id === roomId);
      if (roomIdx >= 0 && roomIdx < ROOM_DEFS.length - 1) {
        const nextRoom = ROOM_DEFS[roomIdx + 1];
        if (!this.state.module2.rooms_unlocked.includes(nextRoom.id)) {
          this.state.module2.rooms_unlocked.push(nextRoom.id);
          this._showToast(`🔓 ${nextRoom.icon} ${nextRoom.name} が かいほうされた！`, 3000);
        }
      }
      this.saveState();
    }
    this.playSe('badge');
    this._showPetals();
    const content = document.getElementById('room-overlay-content');
    content.innerHTML = '';
    this._renderOverlayClearBanner(roomId, content, roomDef);
  }

  _bindDpad() {
    if (this._dpadBound) return;
    this._dpadBound = true;
    const btnLeft = document.getElementById('btn-dpad-left');
    const btnRight = document.getElementById('btn-dpad-right');
    const onDown = (dir) => (e) => {
      e.preventDefault();
      this.input[dir] = true;
      (dir === 'left' ? btnLeft : btnRight).classList.add('pressed');
    };
    const onUp = (dir) => (e) => {
      e.preventDefault();
      this.input[dir] = false;
      (dir === 'left' ? btnLeft : btnRight).classList.remove('pressed');
    };
    ['pointerdown', 'touchstart'].forEach(evt => {
      btnLeft.addEventListener(evt, onDown('left'), { passive: false });
      btnRight.addEventListener(evt, onDown('right'), { passive: false });
    });
    ['pointerup', 'pointercancel', 'touchend', 'touchcancel'].forEach(evt => {
      btnLeft.addEventListener(evt, onUp('left'), { passive: false });
      btnRight.addEventListener(evt, onUp('right'), { passive: false });
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.input.left = true;
      if (e.key === 'ArrowRight') this.input.right = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft') this.input.left = false;
      if (e.key === 'ArrowRight') this.input.right = false;
    });
  }
}

// ===== INIT =====
window.addEventListener('load', () => {
  const game = new BBGame();
  game.init();
});
