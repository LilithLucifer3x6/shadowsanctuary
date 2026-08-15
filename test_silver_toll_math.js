function calcSilverToll(items, amItems, pmItems) {
  const DOMAINS = ['Crown', 'Visage', 'Gaze', 'Grin', 'Vessel', 'Veil'];
  const activeIds = new Set([...amItems.map(i => i.id), ...pmItems.map(i => i.id)]);
  const activeItems = items.filter(i => activeIds.has(i.id));

  const calcMonthly = (item) => {
    if (!item.price || !item.period_after_opening_months) return 0;
    const price = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
    const months = parseInt(item.period_after_opening_months, 10) || 1;
    let usesPerWeek = 7;
    try {
      if (item.behavior_flags) {
        const b = typeof item.behavior_flags === 'string' ? JSON.parse(item.behavior_flags) : item.behavior_flags;
        if (typeof b.uses_per_week === 'number') {
          usesPerWeek = b.uses_per_week;
        } else {
          usesPerWeek = item.category?.toLowerCase().includes('mask') ? (item.category?.toLowerCase().includes('rinse') ? 2 : 5) : 7;
        }
      } else {
        usesPerWeek = item.category?.toLowerCase().includes('mask') ? (item.category?.toLowerCase().includes('rinse') ? 2 : 5) : 7;
      }
    } catch(e) {
      usesPerWeek = item.category?.toLowerCase().includes('mask') ? (item.category?.toLowerCase().includes('rinse') ? 2 : 5) : 7;
    }
    return (price / months) * (usesPerWeek / 7);
  };

  const domainTotals = DOMAINS.map(domain => ({
    domain,
    total: activeItems.filter(i => i.domain === domain).reduce((sum, i) => sum + calcMonthly(i), 0)
  }));
  const grandTotal = domainTotals.reduce((sum, d) => sum + d.total, 0);
  return { domainTotals, grandTotal };
}

const mockItems = [
  { id: 1, domain: 'Crown', price: '$30.00', period_after_opening_months: 6, category: 'shampoo', behavior_flags: { uses_per_week: 3 } }, // 30 / 6 = $5/mo. (3/7) = $2.14
  { id: 2, domain: 'Visage', price: '120.00', period_after_opening_months: 12, category: 'serum' }, // 120 / 12 = $10/mo. (7/7) = $10.00
  { id: 3, domain: 'Gaze', price: '60', period_after_opening_months: 2, category: 'eye cream', behavior_flags: '{"uses_per_week": 7}' }, // 60 / 2 = $30/mo. (7/7) = $30.00
  { id: 4, domain: 'Grin', price: '10.50', period_after_opening_months: 1, category: 'floss' }, // 10.50 / 1 = $10.50/mo.
  { id: 5, domain: 'Vessel', price: '50.00', period_after_opening_months: 5, category: 'body wash' }, // 50 / 5 = $10.00/mo.
  { id: 6, domain: 'Veil', price: '45.00', period_after_opening_months: 3, category: 'perfume', behavior_flags: { uses_per_week: 2 } }, // 45 / 3 = $15/mo. (2/7) = $4.28
  { id: 7, domain: 'Steeping', price: '20.00', period_after_opening_months: 1, category: 'tea' } // Ignored because Steeping not in DOMAINS array!
];

const res = calcSilverToll(mockItems, [{id: 1}, {id: 2}, {id: 3}, {id: 4}], [{id: 5}, {id: 6}, {id: 7}]);
console.log(JSON.stringify(res, null, 2));
