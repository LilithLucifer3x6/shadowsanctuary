const fs = require('fs');
const content = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8');
let stack = [];
for (let i = 0; i < content.length; i++) {
  let char = content[i];
  if (char === '{' || char === '(' || char === '[') stack.push({char, line: content.substring(0, i).split('\n').length});
  if (char === '}' || char === ')' || char === ']') {
    let last = stack.pop();
    // simple check
  }
}
console.log(stack.length);
