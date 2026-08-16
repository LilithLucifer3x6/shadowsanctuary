const fs = require('fs');
let jsx = fs.readFileSync('src/screens/Intake.jsx', 'utf8');

// 1. Remove AI path toggle buttons
const toggleRegex = /<div id="path-toggle"[\s\S]*?<\/button>\s*<\/div>/;
jsx = jsx.replace(toggleRegex, '');

// 2. Remove AI path div completely
const aiPathRegex = /\{path === 'ai' && \([\s\S]*?<div id="ai-status"[\s\S]*?<\/div>\s*<\/div>\s*\)}/;
jsx = jsx.replace(aiPathRegex, '');

// 3. Remove path === 'fast' condition wrapper
jsx = jsx.replace(/\{path === 'fast' && \(\s*<div id="fast-path"/, '<div id="fast-path"');

// Replace the matching closing )} for the fast path
// It's the last )} before </div>\s*</div>\s*\);
const lastClosingIndex = jsx.lastIndexOf(')}');
if (lastClosingIndex > -1) {
    jsx = jsx.substring(0, lastClosingIndex) + jsx.substring(lastClosingIndex + 2);
}

// 4. Change "The First Inscription" to "The Rite of Naming"
jsx = jsx.replace(/> The First Inscription/, '> The Rite of Naming');
jsx = jsx.replace(/'The First Inscription is consecrated'/, "'The Rite of Naming is consecrated'");

fs.writeFileSync('src/screens/Intake.jsx', jsx);
