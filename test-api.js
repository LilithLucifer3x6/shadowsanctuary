import { invokeAnthropicProxy } from './src/lib/ai-engine.js';

(async () => {
  try {
    const promptText = "You are the Keeper of the Sanctuary.";
    const msgs = [{ role: 'user', content: 'I am ready for the reading.' }];
    
    console.log("Calling proxy...");
    const { data, error } = await invokeAnthropicProxy({
      max_tokens: 300,
      system: promptText,
      messages: msgs
    });
    
    console.log("DATA:", JSON.stringify(data, null, 2));
    console.log("ERROR:", error);
  } catch(e) {
    console.log("CATCH:", e);
  }
})();
