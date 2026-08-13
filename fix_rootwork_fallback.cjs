const fs = require('fs');
let code = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');

// The field is labeled "Divine by Visage" inside the manual entry modal.
const fieldStart = '<label style={{color: \'var(--plum)\'}}>Divine by Visage</label>';
// Wait, in my output it's "Divine by Visage (Optional)" but my previous script stripped "(Optional)" and "(Required)"
code = code.replace(
  /<div className="field">\s*<label style=\{\{color: 'var\(--plum\)'\}\}>Divine by Visage<\/label>[\s\S]*?<\/div>\s*<\/div>/,
  ''
);

// Wait, doing regex like this might be greedy. 
// Let's match the exact block:
const blockRegex = /<div className="field">\s*<label style=\{\{color: 'var\(--plum\)'\}\}>Divine by Visage<\/label>\s*<div style=\{\{position: 'relative'[^>]*>\s*<Icon name=\{G\.tabPool\} \/>\s*<span[^>]*>\{photoStatus\}<\/span>\s*<input[^>]*onChange=\{handlePhotoUpload\} \/>\s*<\/div>\s*<\/div>/;

code = code.replace(blockRegex, '');

fs.writeFileSync('src/screens/Rootwork.jsx', code);
console.log('Fixed rootwork image fallback');
