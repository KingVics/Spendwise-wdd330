/* ═══════════════════════════════════════════════
   SpendWise — storage.js
   All localStorage read / write operations
   ═══════════════════════════════════════════════ */

const STORAGE_KEY = 'spendwise_v2';

function saveState() {
  try {
    const toSave = {
      trips:         state.trips,
      activeTrip:    state.activeTrip,
      homeCurrency:  state.homeCurrency,
      rates:         state.rates,
      rateBase:      state.rateBase,
      rateTimestamp: state.rateTimestamp,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    showToast('Storage full — export your data!', 'error');
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.assign(state, saved);
  } catch (e) {
    console.warn('State load error:', e);
  }
}
