const fs = require('fs');

const content = fs.readFileSync('CLAUDE.md', 'utf8');

const newRule = `
===================================================================
HAIR LANGUAGE - ABSOLUTE RULE
===================================================================
Never describe locs, locked hair, or any Black hairstyle using "matted," "matting," or any variation of that word, in any prompt, any code comment, any UI text, anywhere in this project, regardless of framing (even as a "neutral technical description" of how locs form). This language carries a real history of being used to demean and dismiss Black hairstyles as unkempt or unhygienic, and it is never acceptable here. Use respectful, accurate terms instead: "locked," "loc'd," "interlocked," "coiled," "sectioned," "palm-rolled," "grown and maintained." If you are ever unsure whether a word describing hair could carry this kind of weight, do not use it - ask first.
`;

fs.writeFileSync('CLAUDE.md', content + newRule);
console.log("Appended rule.");
