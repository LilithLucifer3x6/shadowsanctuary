const fs = require('fs');
let code = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8');

const target = `            const dataUrl = await compressImage(file, 1024, 0.8);
            const base64 = dataUrl.split(',')[1];
            const details = await parseTeaImage([{ base64, mediaType: file.type }]);
            
            await supabase.from('items').insert([{`;

const replacement = `            const dataUrl = await compressImage(file, 1024, 0.8);
            const base64 = dataUrl.split(',')[1];
            const details = await parseTeaImage([{ base64, mediaType: file.type }]);
            
            // Lavender check
            const allText = \`\${details.name || ''} \${details.brand || ''} \${Array.isArray(details.ingredients) ? details.ingredients.join(', ') : (details.ingredients || '')}\`;
            if (/(lavender|lavandula|lavandin)/i.test(allText)) {
              await alert(\`LAVENDER DETECTED: \${details.name || 'An item'} contains Lavender (or a derivative) and is permanently banned. It will not be stocked.\`);
              continue;
            }

            await supabase.from('items').insert([{`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/screens/ShadowTome.jsx', code);
  console.log('Injected into ShadowTome');
} else {
  console.log('Target not found in ShadowTome');
}
