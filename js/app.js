/* ═══════════════════════════════════════════════
   SpendWise — app.js
   Global state object and app initialisation.

   ═══════════════════════════════════════════════ */

// ── GLOBAL STATE ──────────────────────────────
let state = {
  trips:          [],
  activeTrip:     null,
  homeCurrency:   'USD',
  rates:          {},
  rateBase:       '',
  rateTimestamp:  '',
  editingId:      null,
  sortField:      'date',
  sortDir:        'desc',
  filterCategory: '',
};

// ── CURRENCY LIST ─────────────────────────────
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar'          },
  { code: 'EUR', name: 'Euro'               },
  { code: 'GBP', name: 'British Pound'      },
  { code: 'NGN', name: 'Nigerian Naira'     },
  { code: 'CAD', name: 'Canadian Dollar'    },
  { code: 'AUD', name: 'Australian Dollar'  },
  { code: 'JPY', name: 'Japanese Yen'       },
  { code: 'CHF', name: 'Swiss Franc'        },
  { code: 'CNY', name: 'Chinese Yuan'       },
  { code: 'INR', name: 'Indian Rupee'       },
  { code: 'BRL', name: 'Brazilian Real'     },
  { code: 'MXN', name: 'Mexican Peso'       },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'GHS', name: 'Ghanaian Cedi'      },
  { code: 'KES', name: 'Kenyan Shilling'    },
  { code: 'EGP', name: 'Egyptian Pound'     },
  { code: 'AED', name: 'UAE Dirham'         },
  { code: 'SGD', name: 'Singapore Dollar'   },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'SEK', name: 'Swedish Krona'      },
  { code: 'NOK', name: 'Norwegian Krone'    },
  { code: 'DKK', name: 'Danish Krone'       },
  { code: 'PLN', name: 'Polish Zloty'       },
  { code: 'TRY', name: 'Turkish Lira'       },
  { code: 'THB', name: 'Thai Baht'          },
  { code: 'PHP', name: 'Philippine Peso'    },
  { code: 'IDR', name: 'Indonesian Rupiah'  },
  { code: 'MYR', name: 'Malaysian Ringgit'  },
  { code: 'HKD', name: 'Hong Kong Dollar'   },
  { code: 'TWD', name: 'New Taiwan Dollar'  },
];

// ── INIT ──────────────────────────────────────
async function init() {
  loadState();
  populateCurrencyDropdowns();
  document.getElementById('expDate').value        = todayStr();
  document.getElementById('homeCurrency').value   = state.homeCurrency;

  // Wire up all modules
  initTripControls();
  initExpenseForm();
  initSorting();
  initFilter();
  initExport();
  initHomeCurrencyControl();
  initLocationAutocomplete();

  // Bootstrap trips
  if (state.trips.length === 0) {
    createTrip('My First Trip');
  } else {
    renderTripSelector();
    renderAll();
  }

 
  if (EXCHANGERATE_KEY !== 'YOUR_REAL_API_KEY_HERE') {
    const apiNoticeEl = document.getElementById('apiNotice');
    if (apiNoticeEl) apiNoticeEl.style.display = 'none';
  }

  // Fetch or restore exchange rates. If stored rates are demo-mode and
  const hasRates = state.rates && Object.keys(state.rates).length > 0;
  const savedIsDemo = typeof state.rateTimestamp === 'string' && state.rateTimestamp.toLowerCase().includes('demo');

  if (!hasRates || (savedIsDemo && EXCHANGERATE_KEY !== 'YOUR_REAL_API_KEY_HERE')) {
    await fetchRates(state.homeCurrency);
  } else {
    document.getElementById('rateTimestamp').textContent = state.rateTimestamp || 'Cached';
  }
}

init();
