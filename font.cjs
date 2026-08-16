const fs = require('fs');
let css = fs.readFileSync('src/design-tokens.css', 'utf8');
const fontFace = `@font-face {
  font-family: 'Elsie';
  font-style: normal;
  font-weight: 400;
  src: url('/assets/Elsie-Regular.ttf') format('truetype');
}
@font-face {
  font-family: 'Elsie';
  font-style: normal;
  font-weight: 900;
  src: url('/assets/Elsie-Black.ttf') format('truetype');
}

`;
if (!css.includes('Elsie-Regular.ttf')) {
  fs.writeFileSync('src/design-tokens.css', fontFace + css);
}

// Remove Elsie from index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/&family=Elsie:wght@400;900/g, '');
fs.writeFileSync('index.html', html);
