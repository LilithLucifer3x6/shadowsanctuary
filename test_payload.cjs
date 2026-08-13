const { createCanvas } = require('canvas');

async function main() {
  const numImages = 5;
  let totalBase64Length = 0;
  
  for (let i = 0; i < numImages; i++) {
    const canvas = createCanvas(2048, 2048);
    const ctx = canvas.getContext('20'); // typo, should be 2d
    // wait I will just use sharp if it's available, or just calculate roughly
  }
}
main();
