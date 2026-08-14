Object.defineProperty(global, 'navigator', { value: { onLine: true }, writable: true });
import { readFileSync } from 'fs';
import { parseBatchProductImages } from './src/lib/ai-engine.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
    try {
        console.log('Testing Batch AI Pipeline with real product photo...');
        const imgBuffer = readFileSync('real_product.jpg');
        const b64 = imgBuffer.toString('base64');
        const images = [{ base64: b64, mediaType: 'image/jpeg', filename: 'real_product.jpg' }];
        
        console.log('Invoking AI...');
        const result = await parseBatchProductImages(images);
        console.log('Batch Upload Extraction Result:');
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Test Failed:', e.message);
        if (e.context) {
            const text = await e.context.text();
            console.error('Response Body:', text);
        }
    }
})();
