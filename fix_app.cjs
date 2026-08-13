const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

const outLines = [];
let glossaryButtonLines = [];
let insideGlossary = false;

let glossaryStart = -1;
let glossaryEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("alert('Glossary:\\nAppSpeak Translation")) {
    glossaryStart = i - 1; // <button onClick={() => {
    glossaryEnd = i + 1; // }} className="btn" ...>Glossary of AppSpeak</button>
    break;
  }
}

if (glossaryStart !== -1) {
    glossaryButtonLines = lines.slice(glossaryStart, glossaryEnd + 1);
}

const newLines = [];
let i = 0;
while (i < lines.length) {
    if (i === glossaryStart) {
        i = glossaryEnd + 1;
        continue;
    }
    
    // Add alignItems: 'center'
    if (lines[i].includes("display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem'")) {
        newLines.push(lines[i].replace("marginTop: '0.5rem'", "marginTop: '0.5rem', alignItems: 'center'"));
        i++;
        continue;
    }
    
    newLines.push(lines[i]);
    
    // Insert glossary button after Ancient Script block
    if (lines[i].includes('Mortal Script (System)')) {
        // the next line is </select> and then </div>
        newLines.push(lines[i+1]); // </select>
        newLines.push(lines[i+2]); // </div>
        newLines.push('');
        // Add indentation for glossary button
        for (const line of glossaryButtonLines) {
            newLines.push(line);
        }
        i += 3; // Skip the lines we just manually pushed
        continue;
    }
    
    i++;
}

fs.writeFileSync('src/App.jsx', newLines.join('\n'));
console.log('App.jsx updated.');
