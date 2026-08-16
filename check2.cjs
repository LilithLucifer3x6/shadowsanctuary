const fs = require('fs');
const content = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8').split('\n');
let stack = [];
for(let i=0; i<content.length; i++) {
  let line = content[i];
  let opens = (line.match(/<([a-z0-9]+)(?![^>]*\/>)[^>]*>/gi) || []).filter(m => !m.includes('/>') && !m.startsWith('</'));
  let closes = (line.match(/<\/[a-z0-9]+>/gi) || []);
  for(let o of opens) {
    let tag = o.match(/<([a-z0-9]+)/i)[1];
    if(!['input', 'img', 'br', 'hr', 'source', 'Icon', 'VoiceInput', 'SpeakerButton'].includes(tag)) stack.push({tag, line: i+1});
  }
  for(let c of closes) {
    let tag = c.match(/<\/([a-z0-9]+)>/i)[1];
    if(stack.length === 0) {
      console.log('Extra close tag ' + tag + ' at line ' + (i+1));
    } else {
      let last = stack.pop();
      if(last.tag !== tag) {
        console.log('Mismatch at line ' + (i+1) + ': expected </' + last.tag + '> but got </' + tag + '>. Open was at ' + last.line);
      }
    }
  }
}
if(stack.length > 0) console.log('Unclosed tags:', stack.map(s => s.tag + '@' + s.line));
