// Settings screen — labeled rows replacing the old header tools (♯/♭ chip,
// ⇄ lefty chip, KO/EN lang chips). Same storage keys and events as before:
// gt.lang goes through i18n.setLang, gt.flat/gt.lefty through
// state.setSetting — so every existing listener (fretboard re-render,
// diagram mirror, data-i18n apply) keeps firing unchanged.
//
// Strings come from the shared i18n.js tables (settings.* keys), not a
// module-local STR — labels carry data-i18n so applyLang() re-translates
// them in place; we only re-sync the chip .sel states on lang change.

import { t, getLang, setLang, onLangChange } from '../i18n.js';
import { settings, setSetting, onSetting } from '../state.js';

let body = null;                     // #settingsBody
let gear = null;                     // #settingsBtn — its aria-label is translated too
let spellChips = null;               // { sharp, flat }
let leftyChips = null;               // { off, on }

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function i18nEl(tag, cls, key) {
  const e = el(tag, cls, t(key));
  e.dataset.i18n = key;              // applyLang() owns the text from now on
  return e;
}

function chip(key) {
  const c = i18nEl('button', 'chip', key);
  return c;
}

// row contract (.set-row in styles.css): .set-label (.set-name + optional
// .set-desc) on the left, a .chip-row control on the right
function row(nameKey, descKey, control) {
  const r = el('div', 'set-row');
  const lab = el('div', 'set-label');
  lab.append(i18nEl('span', 'set-name', nameKey));
  if (descKey) lab.append(i18nEl('p', 'hint set-desc', descKey));
  r.append(lab, control);
  return r;
}

function render() {
  if (!body) return;
  body.replaceChildren();
  body.append(i18nEl('h2', 'set-title', 'settings.title'));

  const list = el('div', 'set-list');

  // ---- language — chips carry data-lang so applyLang() syncs .sel for
  // us; they're rendered after initLang() ran, so clicks are wired here
  const langChips = el('div', 'chip-row');
  for (const [l, name] of [['ko', '한국어'], ['en', 'English']]) {
    const c = el('button', 'chip', name);   // endonyms stay untranslated
    c.dataset.lang = l;
    c.addEventListener('click', () => setLang(l));
    langChips.append(c);
  }
  list.append(row('settings.language', null, langChips));

  // ---- note spelling — same gt.flat key the old ♯/♭ header chip toggled
  const spellRow = el('div', 'chip-row');
  const sharp = chip('settings.sharp');
  const flat = chip('settings.flat');
  sharp.addEventListener('click', () => setSetting('flat', false));
  flat.addEventListener('click', () => setSetting('flat', true));
  spellRow.append(sharp, flat);
  spellChips = { sharp, flat };
  list.append(row('settings.spelling', 'settings.spellingDesc', spellRow));

  // ---- left-handed fretboard — same gt.lefty key as the old ⇄ chip
  const leftyRow = el('div', 'chip-row');
  const off = chip('settings.off');
  const on = chip('settings.on');
  off.addEventListener('click', () => setSetting('lefty', false));
  on.addEventListener('click', () => setSetting('lefty', true));
  leftyRow.append(off, on);
  leftyChips = { off, on };
  list.append(row('settings.lefty', 'settings.leftyDesc', leftyRow));

  body.append(list);
  sync();
}

// reflect settings/lang into chip .sel states — runs after render and on
// every change, whether it came from this screen or elsewhere
function sync() {
  if (spellChips) {
    spellChips.sharp.classList.toggle('sel', !settings.flat);
    spellChips.flat.classList.toggle('sel', settings.flat);
  }
  if (leftyChips) {
    leftyChips.off.classList.toggle('sel', !settings.lefty);
    leftyChips.on.classList.toggle('sel', settings.lefty);
  }
  body?.querySelectorAll('[data-lang]').forEach(c =>
    c.classList.toggle('sel', c.dataset.lang === getLang()));
}

// the gear button can't carry data-i18n (applyLang would wipe its SVG
// with textContent) — translate its accessible name ourselves
function syncGear() {
  if (!gear) return;
  const label = t('tab.settings');
  gear.setAttribute('aria-label', label);
  gear.title = label;
}

export function initSettings() {
  body = document.getElementById('settingsBody');
  gear = document.getElementById('settingsBtn');
  render();
  syncGear();
  onLangChange(() => { sync(); syncGear(); });
  onSetting(k => { if (k === 'flat' || k === 'lefty') sync(); });
}
