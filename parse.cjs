const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');
const parser = acorn.Parser.extend(jsx());
try {
  parser.parse(fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8'), { sourceType: 'module', ecmaVersion: 2020 });
  console.log("Parsed successfully!");
} catch (e) {
  console.error("Syntax Error at line " + e.loc.line + " col " + e.loc.column + ": " + e.message);
}
