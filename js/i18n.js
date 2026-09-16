// KO/EN string tables + data-i18n binding, same pattern as Photomat.
// `lang` is module state; t() reads it; initLang() wires the header chips.

const STR = {
  ko: {
    'tab.library': '라이브러리',
    'tab.practice': '연습',
    'tab.tuner': '튜너',
    'tab.ear': '청음',
    'tab.strum': '스트럼',
    'tab.songs': '노래',
    'tab.stats': '기록',
    'lib.play': '▶ 듣기',
    'lib.addDeck': '덱에 추가',
    'lib.deckAdded': '덱에 추가됨',
    'lib.tones': '구성음',
    'lib.bass': '베이스',
    'qual.triads': '트라이어드',
    'qual.sus': '서스',
    'qual.sixths': '식스스',
    'qual.sevenths': '세븐스',
    'qual.extended': '확장 코드',
    'pr.mode': '모드',
    'pr.flash': '플래시카드',
    'pr.prog': '진행 연습',
    'pr.input': '입력',
    'pr.mic': '마이크',
    'pr.virtual': '가상 지판',
    'pr.deck': '덱',
    'pr.starter8': '입문 8',
    'pr.open15': '오픈 15',
    'pr.custom': '내 덱',
    'pr.weak': '취약 코드',
    'pr.progSel': '진행',
    'pr.progPresets': '진행 프리셋',
    'pr.standards': '재즈 스탠다드',
    'pr.myProgs': '내 진행',
    'pr.key': '키',
    'pr.start': '시작',
    'pr.end': '끝내기',
    'pr.hear': '소리 듣기',
    'pr.skip': '건너뛰기',
    'pr.check': '확인',
    'pr.results': '결과',
    'pr.again': '다시 하기',
    'pr.playIt': '이 코드를 연주하세요',
    'pr.correct': '정답!',
    'pr.wrong': '다시 한번',
    'pr.listening': '듣는 중…',
    'pr.accuracy': '정확도',
    'pr.avgTime': '평균 시간',
    'pr.weakChords': '취약 코드',
    'pr.deckEmpty': '덱이 비어 있습니다. 라이브러리에서 코드를 추가하세요.',
    'pr.tapFrets': '지판을 눌러 코드 모양을 만드세요',
    'tu.start': '마이크 시작',
    'tu.stop': '마이크 끄기',
    'tu.hint': '줄을 하나씩 튕기며 바늘을 가운데로 맞추세요.',
    'mic.denied': '마이크 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.',
    'mic.failed': '마이크를 열 수 없습니다.',
    'tab.settings': '설정',
    'settings.title': '설정',
    'settings.language': '언어',
    'settings.spelling': '음표 표기',
    'settings.spellingDesc': '코드 이름과 지판 라벨에 샤프(♯) 또는 플랫(♭) 표기를 사용합니다.',
    'settings.sharp': '♯ 샤프',
    'settings.flat': '♭ 플랫',
    'settings.lefty': '왼손잡이 지판',
    'settings.leftyDesc': '지판과 코드 다이어그램을 왼손 연주용으로 좌우 반전합니다.',
    'settings.off': '끔',
    'settings.on': '켬',
  },
  en: {
    'tab.library': 'Library',
    'tab.practice': 'Practice',
    'tab.tuner': 'Tuner',
    'tab.ear': 'Ear training',
    'tab.strum': 'Strum',
    'tab.songs': 'Songs',
    'tab.stats': 'Stats',
    'lib.play': '▶ Play',
    'lib.addDeck': 'Add to deck',
    'lib.deckAdded': 'Added',
    'lib.tones': 'Tones',
    'lib.bass': 'Bass',
    'qual.triads': 'Triads',
    'qual.sus': 'Suspended',
    'qual.sixths': '6ths',
    'qual.sevenths': '7ths',
    'qual.extended': 'Extended',
    'pr.mode': 'Mode',
    'pr.flash': 'Flashcards',
    'pr.prog': 'Progressions',
    'pr.input': 'Input',
    'pr.mic': 'Mic',
    'pr.virtual': 'Virtual board',
    'pr.deck': 'Deck',
    'pr.starter8': 'Starter 8',
    'pr.open15': 'Open 15',
    'pr.custom': 'My deck',
    'pr.weak': 'Weak chords',
    'pr.progSel': 'Progression',
    'pr.progPresets': 'Presets',
    'pr.standards': 'Jazz standards',
    'pr.myProgs': 'My progressions',
    'pr.key': 'Key',
    'pr.start': 'Start',
    'pr.end': 'End',
    'pr.hear': 'Hear it',
    'pr.skip': 'Skip',
    'pr.check': 'Check',
    'pr.results': 'Results',
    'pr.again': 'Again',
    'pr.playIt': 'Play this chord',
    'pr.correct': 'Correct!',
    'pr.wrong': 'Try again',
    'pr.listening': 'Listening…',
    'pr.accuracy': 'Accuracy',
    'pr.avgTime': 'Avg. time',
    'pr.weakChords': 'Weak chords',
    'pr.deckEmpty': 'Deck is empty. Add chords from the Library.',
    'pr.tapFrets': 'Tap the board to build the chord',
    'tu.start': 'Start mic',
    'tu.stop': 'Stop mic',
    'tu.hint': 'Pluck one string at a time and center the needle.',
    'mic.denied': 'Mic permission denied. Allow it in browser settings.',
    'mic.failed': 'Could not open the microphone.',
    'tab.settings': 'Settings',
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.spelling': 'Note spelling',
    'settings.spellingDesc': 'Chord names and fretboard labels are spelled with sharps (♯) or flats (♭).',
    'settings.sharp': '♯ sharps',
    'settings.flat': '♭ flats',
    'settings.lefty': 'Left-handed fretboard',
    'settings.leftyDesc': 'Mirrors the fretboard and chord diagrams for left-handed playing.',
    'settings.off': 'Off',
    'settings.on': 'On',
  },
};

let lang = localStorage.getItem('gt.lang') || 'en';   // default EN; a saved choice still wins
const listeners = [];

export function t(key) {
  return STR[lang][key] ?? STR.en[key] ?? key;
}

export function getLang() { return lang; }

export function onLangChange(fn) { listeners.push(fn); }

export function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.classList.toggle('sel', el.dataset.lang === lang);
  });
  listeners.forEach(fn => fn(lang));
}

export function setLang(l) {
  if (!STR[l] || l === lang) return;
  lang = l;
  localStorage.setItem('gt.lang', lang);
  applyLang();
}

export function initLang() {
  // static [data-lang] markup (none today — the settings screen renders
  // its chips later and calls setLang itself); kept for future markup
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.addEventListener('click', () => setLang(el.dataset.lang));
  });
  applyLang();
}
