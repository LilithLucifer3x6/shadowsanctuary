const fs = require('fs');
let css = fs.readFileSync('src/design-tokens.css', 'utf8');
css = css.replace(/@font-face\s*\{[^}]+\}\s*@font-face\s*\{[^}]+\}/, `@font-face {
  font-family: 'Elsie';
  src: url('/assets/Elsie-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Elsie';
  src: url('/assets/Elsie-Black.woff2') format('woff2');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}`);
fs.writeFileSync('src/design-tokens.css', css);
