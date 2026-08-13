import fs from 'fs';
import { invokeAnthropicProxy } from './src/lib/ai-engine.js';

async function testIntake() {
  console.log("Testing Intake (First Inscription)...");
  try {
    const { conductIntake } = await import('./src/lib/ai-engine.js');
    const { reply, extractedData } = await conductIntake([{ role: 'user', content: "My name is John. I have dry skin." }]);
    console.log("Intake reply:", reply);
    console.log("Intake data:", extractedData);
  } catch (err) {
    console.error("Intake Error:", err);
  }
}

async function testMoods() {
  console.log("Testing Mood Picker (generateMoods)...");
  try {
    const { default: AI } = await import('./src/lib/ai-service.js');
    const moods = await AI.generateMoods();
    console.log("Generated Moods:", moods);
  } catch (err) {
    console.error("Moods Error:", err);
  }
}

async function main() {
  await testIntake();
  await testMoods();
}

main();
