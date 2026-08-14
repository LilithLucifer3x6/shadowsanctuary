const fs = require('fs');

const file = 'src/screens/Rootwork.jsx';
let src = fs.readFileSync(file, 'utf8');

// The block to replace — lines 848-887 (the entire Silver Toll card)
const OLD = `          <div className="card mb-4" style={{ marginBottom: 0, alignSelf: 'start', width: '100%' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ justifyContent: 'center' }}>The Silver Toll <SpeakerButton text="The Silver Toll" /></h3>
            <div className="mt mb-4" style={{ textAlign: 'center' }}>The material cost of your active rituals, tied to frequency of devotion.</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', color: 'var(--plum)' }}>
                \${(() => {
                  const { amItems, pmItems } = buildBaseRoutines(items, {}, {});
                  const activeIds = new Set([...amItems.map(i=>i.id), ...pmItems.map(i=>i.id)]);
                  const activeItems = items.filter(i => activeIds.has(i.id));
                  
                  let totalMonthly = 0;
                  activeItems.forEach(item => {
                    if (item.price && item.period_after_opening_months) {
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
                      const usageFactor = usesPerWeek / 7;
                      totalMonthly += (price / months) * usageFactor;
                    }
                  });
                  return totalMonthly.toFixed(2);
                })()}
              </div>
            </div>
          </div>`;

const NEW = `          <div className="card mb-4" style={{ marginBottom: 0, alignSelf: 'start', width: '100%' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ textAlign: 'center' }}>The Silver Toll <SpeakerButton text="The Silver Toll" /></h3>
            <div className="mt mb-4" style={{ textAlign: 'center' }}>The material cost of your active rituals, tied to frequency of devotion.</div>
            {(() => {
              const DOMAINS = ['Crown', 'Visage', 'Gaze', 'Grin', 'Vessel', 'Veil'];
              const { amItems, pmItems } = buildBaseRoutines(items, {}, {});
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

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0 0.5rem' }}>
                  {domainTotals.map(({ domain, total }) => (
                    <div key={domain} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', borderRadius: '6px', background: total > 0 ? 'rgba(140,80,180,0.08)' : 'transparent' }}>
                      <span style={{ color: 'var(--dim)', fontSize: '0.9rem' }}>{domain}</span>
                      <span style={{ color: total > 0 ? 'var(--plum)' : 'var(--dim)', fontWeight: total > 0 ? 'bold' : 'normal', fontSize: '0.95rem' }}>
                        {total > 0 ? \`\$\${total.toFixed(2)}\` : '—'}
                      </span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', color: 'var(--plum)' }}>Total / month</span>
                    <span style={{ fontSize: '1.8rem', color: 'var(--plum)', fontWeight: 'bold' }}>\$\${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}
          </div>`;

// Normalize CRLF to LF for matching, then restore
const srcLF = src.replace(/\r\n/g, '\n');
const oldLF = OLD.replace(/\r\n/g, '\n');
const newLF = NEW.replace(/\r\n/g, '\n');

if (!srcLF.includes(oldLF)) {
  console.error('ERROR: Target block not found. Check for whitespace differences.');
  process.exit(1);
}

const result = srcLF.replace(oldLF, newLF);
// Restore CRLF
fs.writeFileSync(file, result.replace(/\n/g, '\r\n'), 'utf8');
console.log('Silver Toll 6-domain breakdown applied successfully.');
