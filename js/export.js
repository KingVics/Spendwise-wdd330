/* ═══════════════════════════════════════════════
   SpendWise — export.js
   CSV export for the active trip
   ═══════════════════════════════════════════════ */

function initExport() {
  document.getElementById('exportBtn').addEventListener('click', () => {
    const expenses = getActiveExpenses();
    if (!expenses.length) { showToast('No expenses to export', 'error'); return; }

    const headers = [
      'Date', 'Description', 'Location', 'Category',
      'Original Amount', 'Currency', 'Converted Amount', 'Home Currency',
    ];

    const rows = expenses.map(e => [
      e.date,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${(e.location    || '').replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      e.currency,
      e.converted ?? '',
      state.homeCurrency,
    ]);

    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `spendwise_${getActiveTrip()?.name || 'export'}_${todayStr()}.csv`;
    a.click();

    showToast('CSV downloaded ✓', 'success');
  });
}
