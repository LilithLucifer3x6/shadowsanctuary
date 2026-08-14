const fs = require('fs');

const p = 'src/screens/Grimoire.jsx';
let c = fs.readFileSync(p, 'utf8');

// Replace the right column wrapper
c = c.replace(
  /<div style={{ display: 'flex', flexDirection: 'column' }}>\s*<div className="card" style={{ marginTop: 0, marginBottom: '1.5rem' }}>/g,
  `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>\n        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>`
);

// Remove the inline margin on the Ephemeris card to let the grid gap handle it
c = c.replace(
  /<div className="card" style={{ marginTop: 0 }}>\s*<div className="corner tl"><\/div><div className="corner tr"><\/div>\s*<div className="corner bl"><\/div><div className="corner br"><\/div>\s*<h3>\s*The Ephemeris/g,
  `<div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>\n        <div className="corner tl"></div><div className="corner tr"></div>\n        <div className="corner bl"></div><div className="corner br"></div>\n        <h3>\n          The Ephemeris`
);

fs.writeFileSync(p, c);
console.log("Updated Grimoire grid");
