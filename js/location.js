/* ═══════════════════════════════════════════════
   SpendWise — location.js
   Foursquare Places API — venue autocomplete
   ═══════════════════════════════════════════════ */

let autocompleteTimer = null;

async function searchVenues(query) {
  const demo = [
    { name: 'Local Restaurant', address: '123 Main St', cat: 'Food & Drink' },
    { name: 'City Hotel', address: 'Hotel Plaza, Downtown', cat: 'Hotel' },
    { name: 'Central Station', address: 'Station Road', cat: 'Transport' },
  ];

  // Treat missing or placeholder keys as demo mode
  const isDemoKey = !FOURSQUARE_KEY || String(FOURSQUARE_KEY).toUpperCase().includes('YOUR') || String(FOURSQUARE_KEY).length < 20;
  if (isDemoKey) {
    return demo.filter(v => v.name.toLowerCase().includes(query.toLowerCase()) || query.length < 2);
  }

  // Live Foursquare — try fetching, but gracefully fall back to demo on errors
  try {
    // If a local proxy is configured, call it instead to avoid CORS.
    const useProxy = typeof PLACES_PROXY !== 'undefined' && PLACES_PROXY;

    const url = useProxy
      ? `${PLACES_PROXY.replace(/\/$/, '')}/places?query=${encodeURIComponent(query)}&limit=5`
      : `https://places-api.foursquare.com/autocomplete?query=${encodeURIComponent(query)}&limit=5`;

    const headers = useProxy ? { Accept: 'application/json' } : {
      Authorization: `Bearer ${FOURSQUARE_KEY}`,
      Accept: 'application/json',
      'X-Places-Api-Version': '2025-06-17',
    };

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const raw = data.results || data || [];
    const results = (raw || []).map(p => {
      const name = p.name || p.text?.primary || p.text || p?.label || '';
      const address = p.location?.address || p.location?.locality || p.geo?.name || p.text?.secondary || '';
      const cat = p.categories?.[0]?.name || p.category || p.cat || '';
      return { name, address, cat };
    });

    return results.length ? results : demo.filter(v => v.name.toLowerCase().includes(query.toLowerCase()) || query.length < 2);
  } catch (err) {
    console.warn('Foursquare search failed, falling back to demo venues:', err);
    return demo.filter(v => v.name.toLowerCase().includes(query.toLowerCase()) || query.length < 2);
  }
}

function initLocationAutocomplete() {
  const locationInput = document.getElementById('locationInput');
  const dropdown = document.getElementById('autocompleteDropdown');

  locationInput.addEventListener('input', function () {
    clearTimeout(autocompleteTimer);
    const q = this.value.trim();
    if (q.length < 2) { dropdown.style.display = 'none'; return; }

    autocompleteTimer = setTimeout(async () => {
      const venues = await searchVenues(q);
      if (!venues.length) { dropdown.style.display = 'none'; return; }

      dropdown.innerHTML = venues.map(v =>
        `<div class="autocomplete-item" data-name="${escHtml(v.name)}" data-addr="${escHtml(v.address)}">
          <span class="venue-name">${escHtml(v.name)}</span>
          <span class="venue-addr">${escHtml(v.address || v.cat)}</span>
        </div>`
      ).join('');
      dropdown.style.display = 'block';

      dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          locationInput.value = item.dataset.name + (item.dataset.addr ? ` — ${item.dataset.addr}` : '');
          dropdown.style.display = 'none';
        });
      });
    }, 300);
  });

  // Close dropdown on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.autocomplete-wrap')) dropdown.style.display = 'none';
  });
}
