import fs from 'fs';

let content = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf-8');

const stateRep = fs.readFileSync('state.txt', 'utf-8');
const fnRep = fs.readFileSync('functions.txt', 'utf-8');
const uiRep = fs.readFileSync('ui.txt', 'utf-8');
const modalRep = fs.readFileSync('modal.txt', 'utf-8');

// 1. Replace states
content = content.replace(
  /const \[vessels, setVessels\] = useState\(\[\]\);\s*const \[showVesselModal, setShowVesselModal\] = useState\(false\);\s*const \[vesselForm, setVesselForm\] = useState\(\{ name: '', vessel_volume_ml: '' \}\);\s*const \[activeBatch, setActiveBatch\] = useState\(null\);/,
  stateRep
);

// 2. Replace init calls
content = content.replace('loadVessels();', 'loadDrams();');
content = content.replace('loadActiveBatch();', 'loadAlchemies();');

// 3. Replace functions (from loadVessels to handleSaveVessel)
const fnRegex = /const loadVessels = async \(\) => \{[\s\S]*?const handleSaveVessel = async \(\) => \{[\s\S]*?loadVessels\(\);\s*\};/m;
content = content.replace(fnRegex, fnRep);

// 4. Replace Ethereal Vapors / Honey Infusion UI block
const uiRegex = /<h3 style=\{\{ fontSize: '1\.5rem', justifyContent: 'center' \}\}>Ethereal Vapors[\s\S]*?<Icon name="plus" \/> Consecrate New Vessel\s*<\/button>\s*<\/div>/m;
content = content.replace(uiRegex, uiRep);

// 5. Replace Modal
const modalRegex = /<h3 style=\{\{color: 'var\(--plum\)', textAlign: 'center'\}\}>Register Vessel<\/h3>[\s\S]*?Register Vessel\s*<\/button>\s*<\/div>/m;
content = content.replace(modalRegex, modalRep);

// Replace remaining 'Vessel' usages with 'Dram' in JSX where appropriate
content = content.replace('showVesselModal', 'showDramModal');
content = content.replace('setShowVesselModal', 'setShowDramModal');

// Botanical Trove rename
content = content.replace('The Botanical Trove <SpeakerButton text="The Botanical Trove" />', 'The Herbarium <SpeakerButton text="The Herbarium" />');
content = content.replace('The botanical trove is bare.', 'The herbarium is bare.');

fs.writeFileSync('src/screens/ShadowTome.jsx', content);
console.log('Refactor completed successfully!');
