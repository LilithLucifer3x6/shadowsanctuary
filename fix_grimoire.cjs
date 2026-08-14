const fs = require('fs');

const p = 'src/screens/Grimoire.jsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Fix the chat bubbles
c = c.replace(
  /className={msg.role === 'assistant' \? 'msg-bot' : 'msg-user'} style={{\s*textAlign: 'center',\s*marginBottom: '1rem',\s*color: msg.role === 'user' \? 'var\(--text\)' : 'var\(--plum\)'\s*}}/g,
  `className={msg.role === 'assistant' ? 'msg-bot' : 'msg-user'} style={{ 
                  textAlign: msg.role === 'user' ? 'right' : 'left', 
                  marginBottom: '1rem',
                  color: msg.role === 'user' ? 'var(--text)' : 'var(--plum)'
                }}`
);

// 2. Fix the grid
c = c.replace(
  /<div style={{ display: 'flex', flexDirection: 'column' }}>\s*<div className="card" style={{ marginTop: 0, marginBottom: '1.5rem' }}>/g,
  `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>\n        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>`
);

c = c.replace(
  /<div className="card" style={{ marginTop: 0 }}>\s*<div className="corner tl"><\/div><div className="corner tr"><\/div>\s*<div className="corner bl"><\/div><div className="corner br"><\/div>\s*<h3>\s*The Ephemeris/g,
  `<div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>\n        <div className="corner tl"></div><div className="corner tr"></div>\n        <div className="corner bl"></div><div className="corner br"></div>\n        <h3>\n          The Ephemeris`
);

fs.writeFileSync(p, c);
console.log("Fixed Grimoire");
