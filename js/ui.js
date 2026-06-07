/* ═══════════════════════════════════════════════
   SpendWise — ui.js
   Toast notifications, currency dropdowns,
   home-currency handler, and shared helpers
   ═══════════════════════════════════════════════ */

// ── TOAST ─────────────────────────────────────

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast     = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${escHtml(msg)}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 3200);
}

// ── HELPERS ───────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

// ── CURRENCY DROPDOWNS ────────────────────────

function populateCurrencyDropdowns() {
  const currencySelect = document.getElementById('currency');
  const homeSelect     = document.getElementById('homeCurrency');
  const opts           = CURRENCIES.map(c =>
    `<option value="${c.code}">${c.code} — ${c.name}</option>`
  ).join('');

  currencySelect.innerHTML = opts;
  homeSelect.innerHTML     = opts;
  currencySelect.value     = 'USD';
  homeSelect.value         = state.homeCurrency;
}

// ── HOME CURRENCY CHANGE ──────────────────────

function initHomeCurrencyControl() {
  document.getElementById('homeCurrency').addEventListener('change', async function () {
    state.homeCurrency = this.value;
    await fetchRates(state.homeCurrency);

    // Recalculate converted amount for every expense across all trips
    state.trips.forEach(trip => {
      trip.expenses = trip.expenses.map(e => ({
        ...e,
        converted: (() => {
          const c = convertAmount(e.amount, e.currency);
          return c != null ? parseFloat(c.toFixed(2)) : null;
        })(),
      }));
    });

    saveState();
    renderAll();
    showToast(`Home currency updated to ${this.value}`, 'info');
  });
}
