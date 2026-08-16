const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const { search, replace } of replacements) {
    if (typeof search === 'string') {
      content = content.replace(search, replace);
    } else {
      content = content.replace(search, replace);
    }
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const rootworkPath = path.join(__dirname, 'src/screens/Rootwork.jsx');
replaceInFile(rootworkPath, [
  // Apothecary glyph and Photo Upload Button
  {
    search: /<h3 style={{ margin: 0 }}>The Apothecary <SpeakerButton text="The Apothecary" \/><\/h3>\s*<div style={{ position: 'absolute', right: 0, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>\s*<button className="btn plum" onClick=\{\(\) => \{/g,
    replace: `<h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="ph-duotone ph-flask"></i> The Apothecary <SpeakerButton text="The Apothecary" /></h3>
          <div style={{ position: 'absolute', right: 0, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn plum" onClick={() => {
              setAddForm({ brand: '', name: '', domain: 'Crown', category: '', ingredients: '', weight: '5', period_after_opening_months: '', unopened_shelf_life_months: '', manufacture_date: '', purchase_date: '', price: '', is_essential: false, is_composite: false, item_type: 'consumable', is_opened: false, opened_date: '', application_zones: [], is_prescription: false, prescription_details: '', selectedComponents: [], measured_potency_mg_ml: '', inferred_potency_mg_ml: '', potency_source: '', levo_material_qty: '', levo_temperature: '', levo_duration: '', levo_carrier_oil: '' });
              setModalState('photo');
              setShowAddModal(true);
            }}>Offer Image</button>
            <button className="btn plum" onClick={() => {`
  },
  // The Reliquary Glyph
  {
    search: /<h3 style={{ justifyContent: 'center' }}>The Reliquary <SpeakerButton text="The Reliquary" \/><\/h3>/,
    replace: `<h3 style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="ph-duotone ph-toolbox"></i> The Reliquary <SpeakerButton text="The Reliquary" /></h3>`
  },
  // The Summoning Scroll Glyph
  {
    search: /<h3 style={{ justifyContent: 'center' }}>The Summoning Scroll <SpeakerButton text="The Summoning Scroll" \/><\/h3>/,
    replace: `<h3 style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="ph-duotone ph-scroll"></i> The Summoning Scroll <SpeakerButton text="The Summoning Scroll" /></h3>`
  },
  // The Waning Glyph
  {
    search: /<h3 style={{ justifyContent: 'center' }}>The Waning <SpeakerButton text="The Waning" \/><\/h3>/,
    replace: `<h3 style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="ph-duotone ph-hourglass"></i> The Waning <SpeakerButton text="The Waning" /></h3>`
  },
  // Echo layout fixes - remove any forced heights just in case
  {
    search: /gridRow: '1 \/ span 2'/g,
    replace: `gridRow: 'auto'`
  }
]);

const shadowTomePath = path.join(__dirname, 'src/screens/ShadowTome.jsx');
replaceInFile(shadowTomePath, [
  { search: /ph-brandy/g, replace: 'ph-coffee' },
  { search: /ph-door-open/g, replace: 'ph-book-open' },
  { search: /ph-faucet/g, replace: 'ph-plant' }
]);

const grimoirePath = path.join(__dirname, 'src/screens/Grimoire.jsx');
replaceInFile(grimoirePath, [
  // Add glyphs to Weekly Wheel, Ephemeris, Appointed Days, Appointed Times
  {
    search: /<h3>The Weekly Wheel <SpeakerButton text="The Weekly Wheel" \/><\/h3>/,
    replace: `<h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}><i className="ph-duotone ph-calendar-blank"></i> The Weekly Wheel <SpeakerButton text="The Weekly Wheel" /></h3>`
  },
  {
    search: /<h3>The Ephemeris <SpeakerButton text="The Ephemeris" \/><\/h3>/,
    replace: `<h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}><i className="ph-duotone ph-moon-stars"></i> The Ephemeris <SpeakerButton text="The Ephemeris" /></h3>`
  },
  {
    search: /<h3 style={{ margin: 0 }}>Appointed Days <SpeakerButton text="Appointed Days" \/><\/h3>/,
    replace: `<h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="ph-duotone ph-calendar-check"></i> Appointed Days <SpeakerButton text="Appointed Days" /></h3>`
  },
  {
    search: /<h3 style={{ margin: 0 }}>Appointed Times <SpeakerButton text="Appointed Times" \/><\/h3>/,
    replace: `<h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="ph-duotone ph-clock"></i> Appointed Times <SpeakerButton text="Appointed Times" /></h3>`
  },
  // Tighten spacing and shorten cards
  {
    search: /<div className="mt mb-4" style={{ textAlign: 'center' }}>The cycle of devotion.<\/div>/,
    replace: `<div className="mt" style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.9rem' }}>The cycle of devotion.</div>`
  },
  {
    search: /<div className="mt mb-4" style={{ textAlign: 'center' }}>Recent history and recorded rites.<\/div>/,
    replace: `<div className="mt" style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Recent history and recorded rites.</div>`
  },
  {
    search: /minHeight: '600px'/g,
    replace: `minHeight: '400px'`
  },
  {
    search: /minHeight: '400px'/g,
    replace: `minHeight: '300px'` // in case it was already 400
  }
]);

// Ignite New Alchemy Modal auto-size
// Finding the modal in ShadowTome and Rootwork or Intake
const files = [rootworkPath, shadowTomePath, grimoirePath];
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('Ignite New Alchemy')) {
    content = content.replace(/<div className="modal-content[^>]*>/g, (match) => {
      if (match.includes('Ignite New Alchemy') || match.includes('modal-content card')) {
         return match.replace(/maxHeight:[^,]+,/, 'maxHeight: "90vh", overflowY: "auto",');
      }
      return match;
    });
    fs.writeFileSync(f, content, 'utf8');
  }
}

console.log("UI fixes script completed.");
