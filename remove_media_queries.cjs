const fs = require('fs');
let css = fs.readFileSync('src/design-tokens.css', 'utf8');
css = css.replace(/@media \(orientation: landscape\) \{ body \{ background-image: var\(--bg-landscape, none\); \} \} @media \(orientation: portrait\) \{ body \{ background-image: var\(--bg-portrait, none\); \} \}\r?\n?/, '');
css = css.replace(/@media \(orientation: landscape\) \{ \.land \{ background-image: var\(--land-bg-landscape, none\); \} \} @media \(orientation: portrait\) \{ \.land \{ background-image: var\(--land-bg-portrait, none\); \} \}\r?\n?/, '');
fs.writeFileSync('src/design-tokens.css', css);
