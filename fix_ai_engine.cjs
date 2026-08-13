const fs = require('fs');
let code = fs.readFileSync('src/lib/ai-engine.js', 'utf8');

const badComment = `/**
 * Parses a tea image (loose leaf or box) using Claude Vision and extracts details.
 * @param {string} base64Image - The base64 string of the image
 * @param {string} mediaType - e.g. "image/jpeg"
 * @returns {Promise<Object>}
/**
 * Parses one or more tea images (loose leaf or box) using Claude Vision and extracts details.`;

const goodComment = `/**
 * Parses one or more tea images (loose leaf or box) using Claude Vision and extracts details.`;

code = code.replace(badComment, goodComment);

const startIdx = code.lastIndexOf('export async function analyzeProduct');
const endIdx = code.indexOf('export async function searchOpenBeautyFacts');

if (startIdx > -1 && endIdx > -1 && startIdx > code.indexOf('export async function analyzeProduct') + 10) {
    code = code.substring(0, startIdx) + '\n\n' + code.substring(endIdx);
}

fs.writeFileSync('src/lib/ai-engine.js', code);
console.log('Fixed ai-engine.js');
