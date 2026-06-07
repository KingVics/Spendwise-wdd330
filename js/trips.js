/* ═══════════════════════════════════════════════
   SpendWise — trips.js
   Trip creation, switching, and selector rendering
   ═══════════════════════════════════════════════ */

function getActiveTrip() {
  return state.trips.find(t => t.id === state.activeTrip) || null;
}

function getActiveExpenses() {
  const trip = getActiveTrip();
  return trip ? trip.expenses : [];
}

function createTrip(name) {
  const trip = {
    id:       `trip_${Date.now()}`,
    name,
    expenses: [],
    created:  new Date().toISOString(),
  };
  state.trips.push(trip);
  state.activeTrip = trip.id;
  saveState();
  renderTripSelector();
  renderAll();
}

function renderTripSelector() {
  const sel = document.getElementById('tripSelect');
  sel.innerHTML = state.trips.length === 0
    ? '<option value="">No trips yet</option>'
    : state.trips
        .map(t => `<option value="${t.id}" ${t.id === state.activeTrip ? 'selected' : ''}>${t.name}</option>`)
        .join('');
}

function initTripControls() {
  document.getElementById('newTripBtn').addEventListener('click', () => {
    document.getElementById('tripModal').classList.add('open');
    document.getElementById('tripNameInput').focus();
  });

  document.getElementById('cancelTripBtn').addEventListener('click', () => {
    document.getElementById('tripModal').classList.remove('open');
  });

  document.getElementById('saveTripBtn').addEventListener('click', () => {
    const name = document.getElementById('tripNameInput').value.trim();
    if (!name) { showToast('Enter a trip name', 'error'); return; }
    createTrip(name);
    document.getElementById('tripNameInput').value = '';
    document.getElementById('tripModal').classList.remove('open');
    showToast(`Trip "${name}" created ✓`, 'success');
  });

  document.getElementById('tripSelect').addEventListener('change', function () {
    state.activeTrip = this.value;
    saveState();
    renderAll();
  });
}
