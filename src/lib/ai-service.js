import { supabase } from './supabase.js';
import { invokeAnthropicProxy } from './ai-engine.js';


export async function generateConcerns() {
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
  try {
    const { data, error } = await invokeAnthropicProxy({
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: 'Generate exactly 18 highly evocative, poetic, and nuanced moods for a gothic self-care shadow-work journal (e.g., "Drained of Essence", "Sweetly Melancholic", "Fierce & Emboldened"). Do not use standard numeric scales or boring words like "Happy" or "Sad". Return ONLY a valid JSON array of strings, nothing else.'
        }
      ]
    });
    
    if (data?.content?.[0]?.text) {
      const text = data.content[0].text;
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));
      return parsed.map(label => ({ id: label.toLowerCase().replace(/[^a-z0-9]/g, '-'), label }));
    }
  } catch (err) {
    console.error("Failed to generate AI moods, falling back", err);
  }

  // Fallback if AI fails
  return [
    { id: 'drained', label: 'Drained of Essence' },
    { id: 'vibrant', label: 'Vibrant & Luminous' },
    { id: 'clouded', label: 'Clouded & Heavy' },
    { id: 'restless', label: 'Restless Spirit' },
    { id: 'serene', label: 'Serene as Moonlight' }
  ];
}

export async function extractIngredients(text) {
  const apiKey = localStorage.getItem('al_anthropic_key') || '';
  try {
    const { data, error } = await invokeAnthropicProxy({
        max_tokens: 512,
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
        max_tokens: 512,
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
        max_tokens: 512,
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
If you have determined the reason, your final response must end with exactly this phrase: "[BANISH_REASON: <the reason>]".
Otherwise, reply sympathetically and ask a clarifying question. Keep responses to 1-2 short sentences.
`;
    // Format history for Anthropic
    const msgs = history.map(h => ({ role: h.role, content: h.text }));

    const { data, error } = await invokeAnthropicProxy({
        max_tokens: 256,
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

export async function converseReading(history, userProfile) {
  const apiKey = localStorage.getItem('al_anthropic_key') || '';
  try {
    const userTurnCount = history.filter(h => h.role === 'user').length;
    // The model was only ever *asked* to conclude "after 2-3 exchanges" —
    // a soft suggestion it could ignore indefinitely, since it has no real
    // enforcement. Once we're clearly past a reasonable conversation length,
    // force conclusion explicitly on this specific call instead of hoping.
    const mustConclude = userTurnCount >= 3;

    const promptText = `
You are the Keeper of the Sanctuary, leading "The Reading", a monthly reflection on the user's wellness rituals.
Goal: Have a short conversation to check if they are experiencing any new skin concerns (dryness, breakouts), lifestyle changes (more stress, less sleep), or if any products are causing irritation.
Ask one question at a time. Be empathetic, poetic, and concise (1-2 sentences).
${mustConclude
  ? `This is your FINAL response, regardless of what has been discussed so far. You must end this response with exactly: "[READING_COMPLETE: <summary of changes or 'No changes'>]". Do not ask another question.`
  : `If you have gathered enough information (after 2-3 exchanges), conclude the reading by ending your final response with exactly: "[READING_COMPLETE: <summary of changes or 'No changes'>]".`
}
Current profile: ${JSON.stringify(userProfile?.intake_answers || {})}
`;
    const rawMsgs = history.map(h => ({ role: h.role, content: h.text }));
    // Anthropic's API requires the messages array to start with role 'user'.
    // The opening exchange always produces an assistant-first history once
    // the Keeper's first question is added, so every reply after the first
    // was sending an invalid assistant-first array and getting rejected.
    const msgs = rawMsgs.length === 0
      ? [{ role: 'user', content: 'I am ready for the reading.' }]
      : rawMsgs[0].role === 'user'
        ? rawMsgs
        : [{ role: 'user', content: 'I am ready for the reading.' }, ...rawMsgs];

    const { data, error } = await invokeAnthropicProxy({
        max_tokens: 300,
        system: promptText,
        messages: msgs
    });
    
    if (error) throw error;
    
    return data.content[0].text;
  } catch (err) {
    console.error('Failed to converse for reading:', err);
    return "The stars are obscured tonight. How has your flesh and spirit fared this past cycle?";
  }
}
