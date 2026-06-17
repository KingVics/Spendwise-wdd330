

// ── CRUD ──────────────────────────────────────

function addExpense(expense) {
  const trip = getActiveTrip();
  if (!trip) { showToast('Create a trip first!', 'error'); return; }
  trip.expenses.push(expense);
  saveState();
  renderAll();
  showToast('Expense added ✓', 'success');
}

function updateExpense(id, updated) {
  const trip = getActiveTrip();
  if (!trip) return;
  const idx = trip.expenses.findIndex(e => e.id === id);
  if (idx === -1) return;
  trip.expenses[idx] = { ...trip.expenses[idx], ...updated };
  saveState();
  renderAll();
  showToast('Expense updated ✓', 'success');
}

function deleteExpense(id) {
  const trip = getActiveTrip();
  if (!trip) return;
  trip.expenses = trip.expenses.filter(e => e.id !== id);
  saveState();
  renderAll();
  showToast('Expense deleted', 'info');
}

function confirmDelete(id) {
  if (confirm('Delete this expense?')) deleteExpense(id);
}

// ── RENDER ALL ────────────────────────────────

function renderAll() {
  renderSummary();
  renderTable();
}

// ── SUMMARY PANEL ─────────────────────────────

function renderSummary() {
  const expenses = getActiveExpenses();
  const totals   = { Food: 0, Transport: 0, Lodging: 0, Entertainment: 0, Other: 0 };
  let grand = 0;

  expenses.forEach(e => {
    const amt = e.converted ?? 0;
    grand += amt;
    if (totals.hasOwnProperty(e.category)) totals[e.category] += amt;
  });

  document.getElementById('totalSpent').textContent       = formatCurrency(grand, state.homeCurrency);
  document.getElementById('totalCount').textContent       = `${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`;
  document.getElementById('catFood').textContent          = formatCurrency(totals.Food,          state.homeCurrency);
  document.getElementById('catTransport').textContent     = formatCurrency(totals.Transport,     state.homeCurrency);
  document.getElementById('catLodging').textContent       = formatCurrency(totals.Lodging,       state.homeCurrency);
  document.getElementById('catEntertainment').textContent = formatCurrency(totals.Entertainment, state.homeCurrency);
  document.getElementById('catOther').textContent         = formatCurrency(totals.Other,         state.homeCurrency);
}

// ── EXPENSE TABLE ─────────────────────────────

function renderTable() {
  let expenses = [...getActiveExpenses()];

  // Filter
  if (state.filterCategory) {
    expenses = expenses.filter(e => e.category === state.filterCategory);
  }

  // Sort
  expenses.sort((a, b) => {
    let va = a[state.sortField];
    let vb = b[state.sortField];
    if (state.sortField === 'amount' || state.sortField === 'converted') {
      va = parseFloat(va) || 0;
      vb = parseFloat(vb) || 0;
    } else {
      va = String(va || '').toLowerCase();
      vb = String(vb || '').toLowerCase();
    }
    if (va < vb) return state.sortDir === 'asc' ? -1 : 1;
    if (va > vb) return state.sortDir === 'asc' ? 1  : -1;
    return 0;
  });

  const tbody = document.getElementById('expenseTableBody');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('expenseCount');

  count.textContent = expenses.length;

  if (expenses.length === 0) {
    tbody.innerHTML       = '';
    empty.style.display   = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = expenses.map(e => {
    const convertedDisplay = e.converted != null
      ? formatCurrency(e.converted, state.homeCurrency)
      : '—';
    const catClass = CAT_CLASSES[e.category] || 'cat-other';
    const catIcon  = CAT_ICONS[e.category]   || '📦';

    return `<tr>
      <td class="td-date">${e.date}</td>
      <td class="td-desc">
        ${escHtml(e.description)}
        ${e.location ? `<div class="location">📍 ${escHtml(e.location)}</div>` : ''}
      </td>
      <td class="td-orig">${formatCurrency(e.amount, e.currency)}</td>
      <td class="td-home">${convertedDisplay}</td>
      <td><span class="category-pill ${catClass}">${catIcon} ${e.category}</span></td>
      <td class="td-actions">
        <button class="btn btn-ghost btn-sm" onclick="startEdit('${e.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('${e.id}')">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

// ── EDIT FLOW ─────────────────────────────────

function startEdit(id) {
  const trip = getActiveTrip();
  if (!trip) return;
  const e = trip.expenses.find(x => x.id === id);
  if (!e) return;

  state.editingId = id;
  document.getElementById('formTitle').textContent         = 'Edit Expense';
  document.getElementById('amount').value                  = e.amount;
  document.getElementById('currency').value                = e.currency;
  document.getElementById('category').value                = e.category;
  document.getElementById('expDate').value                 = e.date;
  document.getElementById('description').value             = e.description;
  document.getElementById('locationInput').value           = e.location || '';
  document.getElementById('submitBtn').textContent         = 'Save Changes';
  document.getElementById('cancelEditBtn').style.display   = 'inline-flex';

  updateConversionPreview();
  document.getElementById('expenseForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function cancelEdit() {
  state.editingId = null;
  document.getElementById('formTitle').textContent         = 'Log Expense';
  document.getElementById('expenseForm').reset();
  document.getElementById('expDate').value                 = todayStr();
  document.getElementById('submitBtn').textContent         = 'Add Expense';
  document.getElementById('cancelEditBtn').style.display   = 'none';
  document.getElementById('convertedPreview').innerHTML    =
    '<span style="font-size:13px;color:var(--muted);">Enter amount to see conversion</span>';
  clearErrors();
}

// ── VALIDATION ────────────────────────────────

function setError(fieldId) {
  document.getElementById(fieldId)?.classList.add('has-error');
}

function clearErrors() {
  document.querySelectorAll('.field.has-error').forEach(f => f.classList.remove('has-error'));
}

// ── FORM SUBMIT ───────────────────────────────

function initExpenseForm() {
  document.getElementById('expenseForm').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    clearErrors();

    const amount      = parseFloat(document.getElementById('amount').value);
    const currency    = document.getElementById('currency').value;
    const category    = document.getElementById('category').value;
    const date        = document.getElementById('expDate').value;
    const description = document.getElementById('description').value.trim();
    const location    = document.getElementById('locationInput').value.trim();

    let valid = true;
    if (!amount || amount <= 0) { setError('amountField'); valid = false; }
    if (!description)           { setError('descField');   valid = false; }
    if (!valid) return;

    if (!state.rates[currency]) await fetchRates(state.homeCurrency);

    const converted = convertAmount(amount, currency);
    const expense   = {
      id:          state.editingId || `exp_${Date.now()}`,
      amount, currency, category, date, description, location,
      converted:   converted != null ? parseFloat(converted.toFixed(2)) : null,
      createdAt:   new Date().toISOString(),
    };

    if (state.editingId) {
      updateExpense(state.editingId, expense);
      cancelEdit();
    } else {
      addExpense(expense);
      this.reset();
      document.getElementById('expDate').value          = todayStr();
      document.getElementById('convertedPreview').innerHTML =
        '<span style="font-size:13px;color:var(--muted);">Enter amount to see conversion</span>';
    }
  });

  document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);
  document.getElementById('amount').addEventListener('input', updateConversionPreview);
  document.getElementById('currency').addEventListener('change', updateConversionPreview);
}

// ── SORT ──────────────────────────────────────

function initSorting() {
  document.querySelectorAll('thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.sortField === field) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortField = field;
        state.sortDir   = 'desc';
      }
      document.querySelectorAll('thead th').forEach(h => h.classList.remove('sorted'));
      th.classList.add('sorted');
      th.querySelector('.sort-icon').textContent = state.sortDir === 'asc' ? '↑' : '↓';
      renderTable();
    });
  });
}

// ── FILTER ────────────────────────────────────

function initFilter() {
  document.getElementById('filterCategory').addEventListener('change', function () {
    state.filterCategory = this.value;
    renderTable();
  });
}
