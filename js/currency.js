/* ═══════════════════════════════════════════════
   SpendWise — currency.js
   ExchangeRate-API integration and conversion logic
   ═══════════════════════════════════════════════ */

async function fetchRates(base) {
  // Demo mode — no real API key provided
  if (EXCHANGERATE_KEY === 'YOUR_REAL_API_KEY_HERE') {
    const demo = {
      USD: 1,    EUR: 0.92, GBP: 0.79,  NGN: 1580, CAD: 1.36,
      AUD: 1.54, JPY: 157,  CHF: 0.9,   CNY: 7.24, INR: 83.5,
      BRL: 5.1,  MXN: 17.2, ZAR: 18.7,  GHS: 15.3, KES: 132,
      EGP: 47.8, AED: 3.67, SGD: 1.34,  NZD: 1.64, SEK: 10.5,
      NOK: 10.6, DKK: 6.9,  PLN: 4.0,   TRY: 32.2, THB: 36.4,
      PHP: 58.1, IDR: 16200,MYR: 4.7,   HKD: 7.83, TWD: 32.1,
    };
    const baseVal = demo[base] || 1;
    const rates = {};
    Object.keys(demo).forEach(k => { rates[k] = demo[k] / baseVal; });
    state.rates         = rates;
    state.rateBase      = base;
    state.rateTimestamp = 'Demo mode (not live)';
    document.getElementById('rateTimestamp').textContent = state.rateTimestamp;
    return true;
  }

  // Live API
  try {
    const res  = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGERATE_KEY}/latest/${base}`);
        const data = await res.json();
    if (data.result !== 'success') throw new Error(data['error-type']);
    state.rates         = data.conversion_rates;
    state.rateBase      = data.base_code;
    state.rateTimestamp = new Date(data.time_last_update_utc).toLocaleString();
    document.getElementById('rateTimestamp').textContent = state.rateTimestamp;
    saveState();
    return true;
  } catch (e) {
    showToast('Could not fetch exchange rates: ' + e.message, 'error');
    return false;
  }
}

function convertAmount(amount, fromCurrency) {
  if (fromCurrency === state.homeCurrency) return amount;
  if (!state.rates || !state.rates[fromCurrency]) return null;
  if (state.rateBase === state.homeCurrency) {
    return amount / state.rates[fromCurrency] * state.rates[state.homeCurrency];
  }
  // Fallback cross-rate
  const fromRate = state.rates[fromCurrency];
  const toRate   = state.rates[state.homeCurrency];
  return toRate ? (amount / fromRate) * toRate : null;
}

function formatCurrency(amount, code) {
  try {
    return new Intl.NumberFormat('en-US', {
      style:              'currency',
      currency:           code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${parseFloat(amount).toFixed(2)}`;
  }
}

// ── Live conversion preview (debounced) ──
let convTimer = null;

function updateConversionPreview() {
  clearTimeout(convTimer);
  convTimer = setTimeout(async () => {
    const amount   = parseFloat(document.getElementById('amount').value);
    const currency = document.getElementById('currency').value;
    const preview  = document.getElementById('convertedPreview');

    if (!amount || amount <= 0 || !currency) {
      preview.innerHTML = '<span style="font-size:13px;color:var(--muted);">Enter amount to see conversion</span>';
      return;
    }

    if (!state.rates[currency]) {
      preview.innerHTML = '<div class="spinner"></div><span style="font-size:13px;color:var(--muted);">Fetching rates…</span>';
      await fetchRates(state.homeCurrency);
    }

    const converted = convertAmount(amount, currency);
    if (converted == null) {
      preview.innerHTML = '<span style="font-size:13px;color:var(--red);">Rate unavailable</span>';
      return;
    }

    preview.innerHTML = `
      <span class="converted-amount">${formatCurrency(converted, state.homeCurrency)}</span>
      <span class="rate-info">1 ${state.homeCurrency} = ${state.rates[currency]?.toFixed(4) || '?'} ${currency}</span>
    `;
  }, 350);
}
