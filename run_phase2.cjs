const fs = require('fs');
const glob = require('fs').readdirSync('src/screens').map(f => 'src/screens/' + f);
glob.push('src/App.jsx');
glob.push('src/design-tokens.css');

for (const file of glob) {
  if (!file.endsWith('.jsx') && !file.endsWith('.css')) continue;
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (file.endsWith('design-tokens.css')) {
    // reduce card height, center h3 subtitles
    // .card { padding: 1.35rem 1.4rem }
    // h3 + .mt { text-align: center }
    if (!code.includes('h3 + div { text-align: center; }')) {
      code += '\n.card h3 + div { text-align: center; }\n';
      code = code.replace(/padding:1\.35rem 1\.4rem;/g, 'padding:1rem 1.4rem;'); // reduce padding to reduce height
      changed = true;
    }
  }

  if (file.includes('Grimoire.jsx')) {
    // Gap and dead space
    code = code.replace(
      /<div className="mt mb-4">Rhythms and cycles\.<\/div>/g,
      '<div className="mb-2" style={{ marginTop: \'-0.2rem\', textAlign: \'center\' }}>Rhythms and cycles.</div>'
    );
    code = code.replace(
      /<div className="mt mb-4">The long count\.<\/div>/g,
      '<div className="mb-2" style={{ marginTop: \'-0.2rem\', textAlign: \'center\' }}>The long count.</div>'
    );
    
    // "every 8 weeks" -> "Every 8 cycles."
    code = code.replace(/Every 8 weeks\./g, 'Every 8 cycles.');
    code = code.replace(/Every 2 weeks\./g, 'Every 2 cycles.');
    code = code.replace(/'Flesh Scrying: '/g, "'Visage Divination: '");
    changed = true;
  }

  if (file.includes('Scrying.jsx')) {
    // Rename "The Flesh Scrying"
    code = code.replace(/The Flesh Scrying/g, 'The Visage Divination');
    code = code.replace(/Capture Visage/g, 'Offer Visage');
    code = code.replace(/Offer a visage\. Capture a reading\. The Keeper will observe but will not name it\./g, 'Offer a reflection to the pool. The Keeper will observe your aura without judgment.');
    code = code.replace(/Skip\/Past and Silence/g, 'Past and Silence');
    code = code.replace(/Reply/g, 'Commune');
    
    // center modal title
    code = code.replace(/<h3 style={{color: 'var\(--plum\)'}}>The Visage Divination<\/h3>/g, '<h3 style={{color: \'var(--plum)\', textAlign: \'center\'}}>The Visage Divination</h3>');
    code = code.replace(/<h3>The Visage Divination<\/h3>/g, '<h3 style={{textAlign: \'center\'}}>The Visage Divination</h3>');
    
    // Check for modal titles in general
    code = code.replace(/<h3>/g, '<h3 style={{textAlign: \'center\'}}>');

    changed = true;
  }

  if (file.includes('Rootwork.jsx')) {
    code = code.replace(/\(Optional\)/gi, '');
    code = code.replace(/\(Required\)/gi, '');
    // Restore Inscribe
    code = code.replace(/<button className="btn plum" onClick=\{\(\) => setAddModalState\('options'\)\}>\s*<Icon name="ph-plus" \/>\s*<\/button>/, 
      '<button className="btn plum" onClick={() => setAddModalState(\'options\')}><Icon name="ph-plus" /> Inscribe</button>');
    code = code.replace(/Application Zones/g, 'Sacred Domains');
    code = code.replace(/Anatomical Realm/g, 'Sacred Domains');
    
    // Photo upload fallback removal for "Summon by Hand"
    // In "Summon by Hand" it shows the form. The photo upload shouldn't be inside the manual entry modal.
    // I need to look closer at Rootwork to do this safely.
    changed = true;
  }

  if (file.includes('Altars.jsx')) {
    // Altar buttons: Emoji icon alignment
    // Typically `<button><Icon/> Text</button>` or similar.
    code = code.replace(/style=\{\{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' \}\}/g,
      "style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, code);
    console.log('Fixed', file);
  }
}
