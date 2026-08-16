import { supabase } from './supabase.js';
import { invokeAnthropicProxy } from './ai-engine.js';


export async function generateConcerns() {
  try {
    const { data } = await invokeAnthropicProxy({
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Generate exactly 15 highly varied and recognizable skin, body, or wellness concerns. IMPORTANT: Draw from global dermatological knowledge, not just Eurocentric sources. Explicitly include conditions presenting in melanated skin (e.g. Post-Inflammatory Hyperpigmentation, keloiding tendency). The first two items in your array MUST be hyperpigmentation or dark-spot related. Return ONLY a valid JSON array of strings.' }]
    });
    if (data?.content?.[0]?.text) {
      const text = data.content[0].text;
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));
      return parsed.map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]/g, '-'), label }));
    }
  } catch (err) { console.error("AI concerns failed", err); }

  return [
    { id: 'acne', label: 'Acne & Breakouts' },
    { id: 'dryness', label: 'Barrier Damage & Flaking' },
    { id: 'hyperpigmentation', label: 'Hyperpigmentation & Dark Spots' },
    { id: 'aging', label: 'Fine Lines & Wrinkles' },
    { id: 'rosacea', label: 'Rosacea & Redness' },
    { id: 'texture', label: 'Uneven Texture' },
    { id: 'pores', label: 'Enlarged Pores' },
    { id: 'oiliness', label: 'Excess Oil Production' },
    { id: 'sensitivity', label: 'Extreme Sensitivity' },
    { id: 'dullness', label: 'Dullness & Lack of Glow' },
    { id: 'eczema', label: 'Eczema / Atopic Dermatitis' },
    { id: 'melasma', label: 'Melasma' }
  ];
}

export async function generateConditions() {
  try {
    const { data } = await invokeAnthropicProxy({
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Generate exactly 15 highly varied underlying health or neurodivergent conditions that shape self-care (e.g. ADHD, PCOS, Rheumatoid Arthritis, Keloids, Sickle Cell). Do not assume Eurocentric beauty or health standards. Return ONLY a valid JSON array of strings.' }]
    });
    if (data?.content?.[0]?.text) {
      const text = data.content[0].text;
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));
      return parsed.map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]/g, '-'), label }));
    }
  } catch (err) { console.error("AI conditions failed", err); }

  return [
    { id: 'adhd', label: 'ADHD (Executive Function)' },
    { id: 'autism', label: 'Autism Spectrum' },
    { id: 'arthritis', label: 'Rheumatoid Arthritis' },
    { id: 'eds', label: 'Ehlers-Danlos / Hypermobility' },
    { id: 'fibro', label: 'Fibromyalgia' },
    { id: 'cfs', label: 'Chronic Fatigue Syndrome' },
    { id: 'endo', label: 'Endometriosis / PCOS' },
    { id: 'pots', label: 'POTS / Dysautonomia' },
    { id: 'depression', label: 'Depression / Low Energy Days' },
    { id: 'anxiety', label: 'Severe Anxiety / OCD' },
    { id: 'migraines', label: 'Chronic Migraines' },
    { id: 'diabetes', label: 'Diabetes' }
  ];
}

export async function generateTraditions() {
  try {
    const { data } = await invokeAnthropicProxy({
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Generate exactly 15 highly varied cosmetic product philosophies or traditions (e.g., "Western Clinical", "K-Beauty", "Ayurvedic Principles"). Return ONLY a valid JSON array of strings.' }]
    });
    if (data?.content?.[0]?.text) {
      const text = data.content[0].text;
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));
      return parsed.map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]/g, '-'), label }));
    }
  } catch (err) { console.error("AI traditions failed", err); }

  return [
    { id: 'western', label: 'Western Clinical / Dermatological' },
    { id: 'kbeauty', label: 'K-Beauty / Korean Heritage' },
    { id: 'jbeauty', label: 'J-Beauty / Japanese Heritage' },
    { id: 'ayurveda', label: 'Ayurvedic Principles' },
    { id: 'tcm', label: 'Traditional Chinese Medicine' },
    { id: 'holistic', label: 'Holistic / Plant-Based' },
    { id: 'minimalist', label: 'Skinimalism / Minimalist' },
    { id: 'french', label: 'French Pharmacy' }
  ];
}

export async function generateMoods() {
  return [
    { id: 'drained', label: 'Drained of Essence' },
    { id: 'vibrant', label: 'Vibrant & Luminous' },
    { id: 'clouded', label: 'Clouded & Heavy' },
    { id: 'restless', label: 'Restless Spirit' },
    { id: 'serene', label: 'Serene as Moonlight' },
    { id: 'fierce', label: 'Fierce & Emboldened' },
    { id: 'hollow', label: 'Hollow & Void' },
    { id: 'agitated', label: 'Feverish & Agitated' },
    { id: 'grounded', label: 'Rooted in Earth' },
    { id: 'melancholy', label: 'Sweet Melancholy' },
    { id: 'ethereal', label: 'Drifting & Ethereal' },
    { id: 'fragile', label: 'Brittle & Fragile' },
    { id: 'ravenous', label: 'Ravenous for Change' },
    { id: 'stagnant', label: 'Mired in Stagnation' },
    { id: 'radiant', label: 'Burning with Radiance' },
    { id: 'withdrawn', label: 'Withdrawn to the Shadows' },
    { id: 'overwhelmed', label: 'Drowning in the Tide' },
    { id: 'focused', label: 'Piercing Clarity' },
    { id: 'numb', label: 'Cold & Unfeeling' },
    { id: 'chaotic', label: 'Swirling Chaos' }
  ];
}

export async function generateSkinTypes() {
  try {
    const { data } = await invokeAnthropicProxy({
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Generate exactly 10 descriptive skin types. The first 5 MUST be the standard Baumann clinical axes: Oily, Dry, Combination, Sensitive, Normal. The remaining 5 should be nuanced clinical subtypes (e.g. Dehydration-Prone Combination, Extremely Oily & Acneic). Return ONLY a valid JSON array of strings.' }]
    });
    if (data?.content?.[0]?.text) {
      const text = data.content[0].text;
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));
      return parsed.map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]/g, '-'), label }));
    }
  } catch (err) { console.error("AI skin types failed", err); }
  return [
    { id: 'oily', label: 'Oily' },
    { id: 'dry', label: 'Dry' },
    { id: 'combo', label: 'Combination' },
    { id: 'sensitive', label: 'Sensitive' },
    { id: 'normal', label: 'Normal' }
  ];
}

export async function generateScalpTypes() {
  try {
    const { data } = await invokeAnthropicProxy({
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Generate exactly 4 scalp types: Oily, Dry, Balanced, Sensitive. Return ONLY a valid JSON array of strings.' }]
    });
    if (data?.content?.[0]?.text) {
      const text = data.content[0].text;
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));
      return parsed.map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]/g, '-'), label }));
    }
  } catch (err) { console.error("AI scalp types failed", err); }
  return [
    { id: 'oily', label: 'Oily' },
    { id: 'dry', label: 'Dry' },
    { id: 'balanced', label: 'Balanced' },
    { id: 'sensitive', label: 'Sensitive' }
  ];
}

export async function generatePorosity() {
  try {
    const { data } = await invokeAnthropicProxy({
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Generate exactly 3 hair porosity levels: Low Porosity, Medium Porosity, High Porosity. Return ONLY a valid JSON array of strings.' }]
    });
    if (data?.content?.[0]?.text) {
      const text = data.content[0].text;
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));
      return parsed.map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]/g, '-'), label }));
    }
  } catch (err) { console.error("AI porosity failed", err); }
  return [
    { id: 'low', label: 'Low Porosity' },
    { id: 'medium', label: 'Medium Porosity' },
    { id: 'high', label: 'High Porosity' }
  ];
}

export async function generateTextures() {
  try {
    const { data } = await invokeAnthropicProxy({
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Generate exactly 12 descriptive cosmetic product textures or format preferences (e.g. "Water-light gels", "Heavy occlusives", "Silicone-free serums", "Powder cleansers"). Return ONLY a valid JSON array of strings.' }]
    });
    if (data?.content?.[0]?.text) {
      const text = data.content[0].text;
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));
      return parsed.map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]/g, '-'), label }));
    }
  } catch (err) { console.error("AI textures failed", err); }
  return [
    { id: 'gels', label: 'Water-light gels' },
    { id: 'creams', label: 'Heavy creams/occlusives' },
    { id: 'oils', label: 'Rich botanical oils' }
  ];
}

export async function extractIngredients(text) {
  const apiKey = localStorage.getItem('al_anthropic_key') || '';
  try {
    const { data, error } = await invokeAnthropicProxy({
        max_tokens: 1024,
        messages: [{ role: 'user', content: `Extract the skincare ingredients from the following text and return them as a JSON array of strings. Text: "${text}"` }]
    });
    if (error) throw error;
    const jsonMatch = data.content[0].text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error(err);
  }
  return text.split(',').map(i => i.trim()).filter(Boolean);
}

export async function evaluateTolerance(history) {
  const apiKey = localStorage.getItem('al_anthropic_key') || '';
  try {
    const { data, error } = await invokeAnthropicProxy({
        max_tokens: 1024,
        messages: [{ role: 'user', content: `Evaluate the user's tolerance based on this history: ${JSON.stringify(history)}. Return a JSON object with "status" (tolerated, irritated, escalating) and "suggestion" (string).` }]
    });
    if (error) throw error;
    const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error(err);
  }
  return { status: 'tolerated', suggestion: 'Maintain current cadence.' };
}

export async function generateAdaptiveSuggestions(wearables, availableItems) {
  const { sleepDuration, heavySweat } = wearables;
  if (sleepDuration >= 6 && !heavySweat) return []; // No special needs

  const apiKey = localStorage.getItem('al_anthropic_key') || '';
  try {
    const promptText = `
You are the Keeper of the Sanctuary, powering a cosmetic wellness app.
Health Data:
- Sleep: ${sleepDuration} hours
- Heavy Sweat: ${heavySweat ? 'Yes' : 'No'}

Available Items:
${JSON.stringify(availableItems.map(i => ({id: i.id, name: i.name, category: i.category, risk_flags: i.risk_flags})))}

Based on this, suggest any items that should be explicitly added to the morning routine (e.g. de-puffing eye products for poor sleep, gentle body washes for heavy sweat).
Return ONLY a JSON array of item IDs that you recommend adding to the AM routine. No other text.
`;
    const { data, error } = await invokeAnthropicProxy({
        max_tokens: 1024,
        messages: [{ role: 'user', content: promptText }]
    });
    
    if (error) throw error;
    
    const responseText = data.content[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('Failed to get adaptive suggestions:', err);
  }
  return [];
}

export async function converseBanish(item, history) {
  const apiKey = localStorage.getItem('al_anthropic_key') || '';
  try {
    const promptText = `
You are the Keeper of the Sanctuary. The user is banishing "${item.name}" from their apothecary.
Goal: Have a brief conversation to discover exactly WHY they are banishing it (adverse reaction, cost, availability, ineffectiveness, etc.) and extract any ingredient patterns if it's an adverse reaction.
If the user's reply goes off-topic, gently and atmospherically redirect them back to the question of why this item is being banished, in-voice, rather than answering the tangent or ignoring it silently.
If you have determined the reason, your final response must end with exactly this phrase: "[BANISH_REASON: <the reason>]".
Otherwise, reply sympathetically and ask a clarifying question. Keep responses to 1-2 short sentences.
`;
    // Format history for Anthropic
    const msgs = history.map(h => ({ role: h.role, content: h.text }));

    const { data, error } = await invokeAnthropicProxy({
        max_tokens: 1024,
        system: promptText,
        messages: msgs.length > 0 ? msgs : [{ role: 'user', content: 'I am ready to proceed.' }]
    });
    
    if (error) throw error;
    
    return data.content[0].text;
  } catch (err) {
    console.error('Failed to converse about banish:', err);
    return "I sense a disturbance. Tell me plainly, why must we banish this? (Type your reason to proceed)";
  }
}

