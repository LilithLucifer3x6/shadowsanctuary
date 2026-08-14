const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, cb);
    else if (p.endsWith('.jsx')) cb(p);
  });
}

const dirs = ['src/screens', 'src/components'];
dirs.forEach(d => walk(d, p => {
  let c = fs.readFileSync(p, 'utf8');
  const orig = c;
  c = c.replace(/textAlign:\s*'left'/g, "textAlign: 'center'");
  c = c.replace(/textAlign:\s*'right'/g, "textAlign: 'center'");
  c = c.replace(/textAlign:\s*msg\.role\s*===\s*'user'\s*\?\s*'right'\s*:\s*'left'/g, "textAlign: 'center'");
  if (c !== orig) {
    fs.writeFileSync(p, c);
    console.log('Fixed', p);
  }
}));
