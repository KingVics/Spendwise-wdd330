/* ═══════════════════════════════════════════════
   SpendWise — location.js
   Foursquare Places API — venue autocomplete
   ═══════════════════════════════════════════════ */

let autocompleteTimer = null;

async function searchVenues(query) {
  // Demo mode
  if (FOURSQUARE_KEY === 'YOUR_FOURSQUARE_KEY') {
    const demo = [
      { name: 'Local Restaurant', address: '123 Main St',          cat: 'Food & Drink' },
      { name: 'City Hotel',       address: 'Hotel Plaza, Downtown', cat: 'Hotel'        },
      { name: 'Central Station',  address: 'Station Road',          cat: 'Transport'    },
    ];
    return demo.filter(v =>
      v.name.toLowerCase().includes(query.toLowerCase()) || query.length < 2
    );
  }

  // Live Foursquare
  try {
    const res  = await fetch(
      `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(query)}&limit=5`,
      { headers: { Authorization: FOURSQUARE_KEY, Accept: 'application/json' } }
    );
    const data = await res.json();
    return (data.results || []).map(p => ({
      name:    p.name,
      address: [p.location?.address, p.location?.locality].filter(Boolean).join(', '),
      cat:     p.categories?.[0]?.name || '',
    }));
  } catch {
    return [];
  }
}

function initLocationAutocomplete() {
  const locationInput = document.getElementById('locationInput');
  const dropdown      = document.getElementById('autocompleteDropdown');

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
          locationInput.value    = item.dataset.name + (item.dataset.addr ? ` — ${item.dataset.addr}` : '');
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
