const fs = require('fs');

const data = JSON.parse(fs.readFileSync('replicate_raw_response.json', 'utf8'));
const input = data.input;

const base64_1 = input.image.split(',')[1];
const base64_2 = input.image_2.split(',')[1];

fs.mkdirSync('public/assets/avatar-tests/sent-references', { recursive: true });

fs.writeFileSync('public/assets/avatar-tests/sent-references/sent_anchor_reference.png', Buffer.from(base64_1, 'base64'));
fs.writeFileSync('public/assets/avatar-tests/sent-references/sent_final_avatar.jpg', Buffer.from(base64_2, 'base64'));

console.log("Extracted images to public/assets/avatar-tests/sent-references/");
