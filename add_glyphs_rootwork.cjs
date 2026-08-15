const fs = require('fs');

let content = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');

const replacements = [
  { search: '<h3>The Apothecary', replace: '<h3><Icon name={G.apothecary} /> The Apothecary' },
  { search: '<h3 style={{ margin: 0 }}>The Apothecary', replace: '<h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}><Icon name={G.apothecary} /> The Apothecary' },
  { search: '<h3 style={{ justifyContent: \'center\' }}>The Reliquary', replace: '<h3 style={{ justifyContent: \'center\', display: "flex", alignItems: "center", gap: "0.5rem" }}><Icon name={G.arsenal} /> The Reliquary' },
  { search: '<h3 style={{ justifyContent: \'center\' }}>The Summoning Scroll', replace: '<h3 style={{ justifyContent: \'center\', display: "flex", alignItems: "center", gap: "0.5rem" }}><Icon name={G.scroll} /> The Summoning Scroll' },
  { search: '<h3 style={{ textAlign: \'center\' }}>The Silver Toll', replace: '<h3 style={{ textAlign: \'center\', display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}><Icon name="ph-coins" /> The Silver Toll' },
  { search: '<h3 style={{ justifyContent: \'center\' }}>The Waning', replace: '<h3 style={{ justifyContent: \'center\', display: "flex", alignItems: "center", gap: "0.5rem" }}><Icon name={G.waning} /> The Waning' },
  { search: '<h3 style={{ justifyContent: \'center\' }}>The Echo', replace: '<h3 style={{ justifyContent: \'center\', display: "flex", alignItems: "center", gap: "0.5rem" }}><Icon name={G.tabPool} /> The Echo' },
];

replacements.forEach(r => {
  content = content.replace(r.search, r.replace);
});

fs.writeFileSync('src/screens/Rootwork.jsx', content);
console.log("Rootwork.jsx headers updated with glyphs.");
