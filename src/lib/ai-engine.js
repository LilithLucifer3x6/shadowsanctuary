import { supabase } from './supabase.js';


export const ANTHROPIC_MODEL = 'claude-sonnet-5';

export async function invokeAnthropicProxy(body, retries = 1) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      
      const { data, error } = await supabase.functions.invoke('anthropic-proxy', {
        body: { model: ANTHROPIC_MODEL, ...body },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (error) throw error;
      if (!data) throw new Error("No data returned from Anthropic proxy.");
      // claude-sonnet-5 with extended thinking returns a "thinking" block as
      // content[0] before the actual text block. Strip non-text blocks so all
      // callers can safely use content[0].text without thinking-awareness.
      if (data.content && Array.isArray(data.content)) {
        data.content = data.content.filter(b => b.type === 'text' || b.type === 'tool_use');
      }
      return { data, error: null };
    } catch (err) {
      if (i === retries) return { data: null, error: err };
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

export async function invokeImageProxy(body, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const { data, error } = await supabase.functions.invoke('image-proxy', {
        body,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (error) throw error;
      if (!data) throw new Error("No data returned from Image proxy.");
      return { data, error: null };
    } catch (err) {
      if (i === retries) return { data: null, error: err };
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}


/**
 * Conducts the intake conversation and extracts answers when ready.
 * @param {Array<{role: string, content: string}>} messageHistory 
 * @returns {Promise<{ reply: string, extractedData: Object|null }>}
 */
export async function conductIntake(messageHistory) {
  if (!navigator.onLine) {
    throw new Error("No Connection: The oracle is sleeping. Please connect to the internet.");
  }
  const userTurnCount = messageHistory.filter(h => h.role === 'user').length;
  // Same lesson learned in converseReading: a soft "call finalize_intake when
  // you feel ready" instruction has no real enforcement and can be ignored
  // indefinitely. Intake gathers safety-critical data (prescriptions,
  // allergies), so an unbounded conversation here is worse than elsewhere.
  // Force conclusion explicitly once we're clearly past a reasonable length.
  const mustConclude = userTurnCount >= 8;

  const systemPrompt = `You are the keeper of Shadow and Sanctuary, an entity guiding a user through The First Inscription (an onboarding ritual).
Speak in a respectful, slightly mystical, cottagecore-goth tone ("ritual voice"). Do not be overly verbose. Be direct but atmospheric.
Do not use gendered language for the user. Do not assume their gender or use pronouns.

Your goal is to gather the following:
1. Concerns: What weighs on them? (e.g. acne, scarring, dryness, etc.)
2. Conditions: What must the lounge protect? (e.g. ADHD, chronic pain, arthritis, etc.)
3. Prescriptions (Master Invocations): Do they have topical prescriptions? Need name, strength, application zone, and frequency.
4. Oral Medications: Anything that passes through the body that affects skin.
5. Allergies/Sensitivities: Ingredients to never touch.
6. Traditions: Preferred approaches to care (K-beauty, Ayurvedic, Hoodoo, Western Clinical, etc.)

Proceed conversationally. Ask one or two questions at a time.
If the user's reply goes off-topic, gently and atmospherically redirect them back to whichever of the six categories above is still incomplete, rather than following the tangent or ignoring it silently.
${mustConclude
  ? `You have gathered enough across this conversation regardless of remaining gaps. You MUST call the 'finalize_intake' tool now, using "unspecified" or an empty array for any category you were unable to complete. Do not ask another question.`
  : `When you believe you have gathered enough information across these categories (or the user says they have nothing else to add), you must call the 'finalize_intake' tool with the structured data.`
}
`;

  const tools = [
    {
      name: "finalize_intake",
      description: "Call this tool ONLY when you have gathered all necessary information from the user regarding their concerns, conditions, prescriptions, oral meds, allergies, and traditions.",
      input_schema: {
        type: "object",
        properties: {
          concerns: { type: "array", items: { type: "string" } },
          conditions: { type: "array", items: { type: "string" } },
          rxList: { 
            type: "array", 
            items: { 
              type: "object",
              properties: {
                name: { type: "string" },
                strength: { type: "string" },
                zone: { type: "string" },
                frequency: { type: "string" }
              }
            } 
          },
          oralList: { type: "array", items: { type: "string" } },
          algList: { type: "array", items: { type: "string" } },
          traditions: { type: "array", items: { type: "string" } }
        },
        required: ["concerns", "conditions", "rxList", "oralList", "algList", "traditions"]
      }
    }
  ];

  const apiMessages = [...messageHistory];
  if (apiMessages.length > 0 && apiMessages[0].role === 'assistant') {
    apiMessages.unshift({ role: 'user', content: "I am ready to begin." });
  }

  const { data, error } = await invokeAnthropicProxy({
      max_tokens: 1000,
      system: systemPrompt,
      messages: apiMessages,
      tools: tools
  });
  if (error) throw error;
  const response = data;

  let replyText = '';
  let extractedData = null;

  for (const block of response.content) {
    if (block.type === 'text') {
      replyText += block.text;
    } else if (block.type === 'tool_use' && block.name === 'finalize_intake') {
      extractedData = block.input;
    }
  }

  return { reply: replyText, extractedData };
}

/**
 * Parses a product image using Claude Vision and extracts details.
 * @param {string} base64Image - The base64 string of the image (without the data prefix)
 * @param {string} mediaType - e.g. "image/jpeg"
 * @returns {Promise<Object>}
 */
export async function parseProductImage(base64Image, mediaType) {
  

  const tools = [
    {
      name: 'extract_product_details',
      description: 'Extract product details from the image',
      input_schema: {
        type: 'object',
        properties: {
          brand: { type: 'string', description: 'Brand or manufacturer name' },
          name: { type: 'string', description: 'Product name' },
          ingredients: { type: 'array', items: { type: 'string' }, description: 'List of ingredients' },
          category: { type: 'string', description: 'Product category (e.g., Cleanser, Moisturizer)' },
          form: { type: 'string', enum: ['liquid', 'cream', 'gel', 'powder', 'solid'], description: 'Physical form of the product' },
          container_size: { type: 'string', description: 'Volume or weight (e.g. 50ml, 1.7oz, 30g)' },
          texture: { type: 'string', enum: ['liquid', 'gel', 'serum', 'lotion', 'mousse', 'cream', 'oil', 'balm', 'ointment', 'solid', 'powder'], description: 'Physical texture of the product' },
          application_zones: { type: 'array', items: { type: 'string' }, description: 'Body zones where this is applied (e.g., Visage, Vessel, Crown, Grin, oral)' },
          period_after_opening_months: { type: 'number', description: 'PAO from the open jar icon (in months), if present' },
          unopened_shelf_life_months: { type: 'number', description: 'Unopened shelf life (in months), if explicitly stated' },
          manufacture_date: { type: 'string', description: 'Manufacture date (YYYY-MM-DD), if present' },
          purchase_date: { type: 'string', description: 'Purchase date or received date (YYYY-MM-DD), if handwritten or printed' },
          is_prescription: { type: 'boolean', description: 'True if this is a prescription medication from a pharmacy' },
          prescription_details: { type: 'string', description: 'Prescription name, strength, and instructions if is_prescription is true' },
          item_type: { type: 'string', enum: ['consumable', 'arsenal'], description: 'Whether this is a consumable product (creams, pills) or an arsenal tool (roller, brush, device)' }
        },
        required: ['brand', 'name', 'ingredients', 'category', 'form', 'application_zones', 'is_prescription', 'item_type']
      }
    }
  ];

  const { data, error } = await invokeAnthropicProxy({
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image
              }
            },
            {
              type: 'text',
              text: 'Extract the brand, product name, ingredients list, category (e.g. Cleanser, Moisturizer, Toner), and physical form of this product. Crucially, infer the application_zones (e.g. Visage, Vessel, Crown, Grin, or oral for pills), read the PAO (Period After Opening) jar icon if present, look for any printed manufacture/expiration dates, check if it is a pharmacy prescription (is_prescription), and classify its item_type (consumable for products, arsenal for physical tools/devices).'
            }
          ]
        }
      ],
      tools: tools,
      tool_choice: { type: 'tool', name: 'extract_product_details' }
  });
  if (error) throw error;
  const response = data;

  // Extract from tool use block
  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'extract_product_details') {
      return block.input;
    }
  }

  throw new Error("Failed to extract product details from image");
}

/**
 * Parses multiple product images using Claude Vision, groups them by product, and resolves conflicts.
 * @param {Array<{base64: string, mediaType: string, filename: string}>} images
 * @returns {Promise<Array>}
 */
export async function parseBatchProductImages(images) {
  if (!navigator.onLine) {
    throw new Error("No Connection: The oracle is sleeping. Please connect to the internet.");
  }
  if (!images || images.length === 0) return [];

  const tools = [
    {
      name: 'group_and_extract_products',
      description: 'Groups multiple product images into distinct products and extracts their details',
      input_schema: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                filenames: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'The filenames of the images that belong to this product'
                },
                brand: { type: 'string' },
                name: { type: 'string' },
                domain: { type: 'string', enum: ['Crown', 'Visage', 'Vessel', 'Grin', 'Gaze', 'Veil'] },
                category: { type: 'string' },
                price: { type: 'number' },
                ingredients: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'The definitive ingredients list'
                },
                form: { type: 'string', enum: ['liquid', 'cream', 'gel', 'powder', 'solid'], description: 'Physical form of the product' },
                container_size: { type: 'string', description: 'Volume or weight (e.g. 50ml, 1.7oz, 30g)' },
                texture: { type: 'string', enum: ['liquid', 'gel', 'serum', 'lotion', 'mousse', 'cream', 'oil', 'balm', 'ointment', 'solid', 'powder'], description: 'Physical texture of the product' },
                application_zones: { type: 'array', items: { type: 'string' }, description: 'Body zones where this is applied (e.g., Visage, Vessel, Crown, Grin, oral)' },
                period_after_opening_months: { type: 'number', description: 'PAO from the open jar icon (in months), if present' },
                unopened_shelf_life_months: { type: 'number', description: 'Unopened shelf life (in months), if explicitly stated' },
                manufacture_date: { type: 'string', description: 'Manufacture date (YYYY-MM-DD), if present' },
                purchase_date: { type: 'string', description: 'Purchase date or received date (YYYY-MM-DD), if handwritten or printed' },
                is_prescription: { type: 'boolean', description: 'True if this is a prescription medication from a pharmacy' },
                prescription_details: { type: 'string', description: 'Prescription name, strength, and instructions if is_prescription is true' },
                item_type: { type: 'string', enum: ['consumable', 'arsenal'], description: 'Whether this is a consumable product (creams, pills) or an arsenal tool (roller, brush, device)' },
                ingredient_conflicts: {
                  type: 'boolean',
                  description: 'True if there is ambiguity or disagreement across photos regarding ingredients/risk flags'
                },
                ingredient_conflict_details: {
                  type: 'string',
                  description: 'If ingredient_conflicts is true, explain the disagreement so the user can resolve it.'
                }
              },
              required: ['filenames', 'brand', 'name', 'domain', 'ingredients', 'form', 'application_zones', 'is_prescription', 'item_type', 'ingredient_conflicts']
            }
          }
        },
        required: ['products']
      }
    }
  ];

  const contentBlocks = images.map(img => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: img.mediaType,
      data: img.base64
    }
  }));

  contentBlocks.push({
    type: 'text',
    text: `I have uploaded ${images.length} images. They have the following filenames in order: ${images.map(i => i.filename).join(', ')}.
Your task is to analyze all images simultaneously and GROUP them into distinct products (e.g. front label, back label, and price tag of the SAME product belong in one group).
For each distinct product you identify:
1. List the filenames of the images that belong to it.
2. Extract brand, name, domain (Crown=Hair, Visage=Face, Form=Body, Grin=Mouth), and price.
3. For non-safety fields (like name or price), if photos disagree, use Source Precedence (Physical container > Packaging > Retailer Listing > AI Knowledge) and output only the winner.
4. For ingredients or risk flags, if photos disagree (e.g. front says "fragrance free" but back lists "parfum", or one photo cuts off the list), set 'ingredient_conflicts' to true and explain the conflict in 'ingredient_conflict_details' so the user must make an explicit choice. If they agree, set it to false.
5. IMPORTANT: Teas, loose herbs, and ingestible tinctures belong ONLY in the Shadow Tome. If an image is clearly a tea or edible infusion, IGNORE it completely. Do not include it in the products array.`
  });

  const { data, error } = await invokeAnthropicProxy({
      max_tokens: 4096,
      messages: [{ role: 'user', content: contentBlocks }],
      tools: tools,
      tool_choice: { type: 'tool', name: 'group_and_extract_products' }
  });

  if (error) throw error;

  for (const block of data.content) {
    if (block.type === 'tool_use' && block.name === 'group_and_extract_products') {
      return block.input.products || [];
    }
  }

  return [];
}

/**
 * Scry a prospective product against the user's profile and inventory.
 * @param {string} productInfo - Name and/or ingredients of the prospective product.
 * @param {Object} userProfile - The user's intake profile (concerns, allergies, conditions).
 * @param {Array} inventory - Current items in the Rootwork.
 * @returns {Promise<string>} - The AI's evaluation in the ritual voice.
 */
export async function evaluateScryingPool(productInfo, userProfile, inventory, reactions = {}) {
  if (!navigator.onLine) {
    throw new Error("No Connection: The oracle is sleeping. Please connect to the internet.");
  }
  
  const banished = inventory.filter(i => i.lifecycle_state === 'banished');
  const banishedStr = banished.map(i => {
    let base = `${i.name} (Ingredients: ${i.ingredients})`;
    if (i.item_type === 'composite' && i.composite_components && i.composite_components.length > 0) {
      const components = i.composite_components.map(cc => cc.items?.name).filter(Boolean).join(', ');
      base += ` [Blend containing: ${components}]`;
    }
    return base;
  }).join('\n');

  const systemPrompt = `You are the Scrying Pool, an oracle within Shadow and Sanctuary.
The user seeks your wisdom on a prospective new product or formula (The Echo).
Perform a strict Safety Check against their known allergies (The Codex), medical conditions, and past Somatic Reactions. 
If they have banished items or reacted poorly (peeling, redness, burning), deduce the common denominator ingredients and explicitly warn them if the prospective item contains them.
Perform a Redundancy Guard: compare the prospective item's primary actives against their current inventory. If they already own a formula that serves the exact same purpose or uses the same actives, explicitly warn them to guard against redundant spending. For composite blends, check redundancy against both the blend as a whole AND its individual components — if the prospective item shares a primary active with a blend's component even though the blend itself serves a different purpose, that's still worth flagging.
If you detect a safety conflict or redundancy, you MUST suggest valid alternative replacements. STRICT CONSTRAINT: You must suggest replacements from their *owned* Current Inventory first. Do not suggest new real-world purchases unless they literally own nothing that serves the same purpose.
Speak in a mystical, cottagecore-goth tone ("ritual voice"). Be concise but insightful.
Do not use gendered language or pronouns.

User Profile:
${JSON.stringify(userProfile, null, 2)}

Somatic Reactions (Ledger of Afflictions):
${JSON.stringify(reactions, null, 2)}

Banished Items (The Crypt of Ashes) [Max 40]:
${banishedStr ? banishedStr.substring(0, 4000) + (banishedStr.length > 4000 ? '\n...[TRUNCATED]' : '') : 'None'}

Current Inventory [Max 40 items]:
${JSON.stringify(inventory.slice(0, 40).map(i => i.name + ' (' + i.category + ')'), null, 2)}
${inventory.length > 40 ? '...[TRUNCATED - Showing 40 of ' + inventory.length + ' items]' : ''}

Composite Blends — Component Breakdown (per section 9, composites are evaluated at both levels: the blend as a ritual, AND its components individually):
${(() => {
  const composites = inventory.filter(i => Array.isArray(i.composite_components) && i.composite_components.length > 0);
  if (composites.length === 0) return 'None in current inventory.';
  return composites.map(c => {
    const componentNames = c.composite_components
      .map(cc => cc.items?.name)
      .filter(Boolean)
      .join(', ');
    return `${c.name} (blend) — components: ${componentNames || 'unknown'}`;
  }).join('\n');
})()}
`;

  const { data, error } = await invokeAnthropicProxy({
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Please scry this prospective addition to my chamber: ${productInfo}` }
      ]
  });
  if (error) throw error;
  const response = data;
  return response.content[0].text;
}

/**
 * Perform a comprehensive evaluation of the user's entire routine ecosystem.
 * @param {Array} inventory - Current items in the Rootwork.
 * @param {Array} banishedItems - Items in the Crypt of Ashes.
 * @param {Array} ledgerEntries - Somatic reactions with zones and severities.
 * @param {Object} intakeAnswers - The user's intake profile goals and allergies.
 * @returns {Promise<string>} - The AI's holistic evaluation in the ritual voice (Markdown).
 */
export async function generateScryingEvaluation(inventory, banishedItems, ledgerEntries, intakeAnswers) {
  if (!navigator.onLine) {
    throw new Error("No Connection: The oracle is sleeping. Please connect to the internet.");
  }
  
  const systemPrompt = `You are the Scrying Pool, an oracle within Shadow and Sanctuary.
The user seeks a holistic divination of their entire routine ecosystem.
Analyze their active inventory, banished products, somatic reactions, and intake goals.
Output a comprehensive report formatted in Markdown that covers the following areas:

### Ingredient Patterns
Deduce exactly what common denominator ingredients are causing their reactions across banished products and the Ledger of Afflictions. Name the suspected offending ingredients directly. Composite blends are annotated with a blend_components field listing their individual components — when two different blends share a component and reactions follow the shared component rather than either blend as a whole, that is a strong attribution signal worth naming explicitly.

### Goal Trajectory
Assess if their current routine is actively moving them toward their stated intake goals. Highlight any counterproductive habits.

### Routine Optimization
Recommend removing steps or products they do not actually need (e.g. "you are using too many acids", or "you have overlapping moisturizers"). Identify any redundant steps.

### Replacement & Synergy Mapping
When a product is banished or ebbing, you MUST suggest replacements first from their *owned* Active Inventory. STRICT CONSTRAINT: Do not suggest new outside products to buy unless their owned inventory is completely devoid of a viable alternative. Only suggest unowned product categories if it solves a critical routine gap.

### Correlations
Point out behavioral or systemic correlations (e.g., reacting to something due to applying it too frequently, or overlapping conflicts).

Speak in a mystical, cottagecore-goth tone ("ritual voice"). Be insightful, highly analytical, and direct.
Do not use gendered language or pronouns.`;

  const userContent = `Here is the current state of my ecosystem:

Intake Profile (Goals & Allergies):
${JSON.stringify(intakeAnswers, null, 2)}

Active Inventory (Truncated to Top 50):
${JSON.stringify(inventory.slice(0, 50).map(i => {
  const ret = { name: i.name, category: i.category, ingredients: i.ingredients, state: i.lifecycle_state };
  if (i.item_type === 'composite' && i.composite_components && i.composite_components.length > 0) {
    ret.blend_components = i.composite_components.map(cc => cc.items?.name).filter(Boolean);
  }
  return ret;
}), null, 2)}
${inventory.length > 50 ? '...[TRUNCATED - Showing 50 of ' + inventory.length + ' items]' : ''}

Banished Items (Crypt of Ashes, Truncated to Top 30):
${JSON.stringify(banishedItems.slice(0, 30).map(i => {
  const isCostOrAvail = i.banish_reason?.includes('Material Toll') || i.banish_reason?.includes('Elusive');
  const ret = { 
    name: i.name, 
    ingredients: isCostOrAvail ? '[EXCLUDED FROM ANALYSIS DUE TO COST/AVAILABILITY]' : i.ingredients, 
    reason: i.banish_reason 
  };
  if (i.item_type === 'composite' && i.composite_components && i.composite_components.length > 0 && !isCostOrAvail) {
    ret.blend_components = i.composite_components.map(cc => cc.items?.name).filter(Boolean);
  }
  return ret;
}), null, 2)}
${banishedItems.length > 30 ? '...[TRUNCATED - Showing 30 of ' + banishedItems.length + ' banished items]' : ''}

Ledger of Afflictions (Reactions):
${JSON.stringify(ledgerEntries, null, 2)}
Please divine the truth in the water.`;

  const { data, error } = await invokeAnthropicProxy({
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userContent }
      ]
  });
  if (error) throw error;
  const response = data;
  return response.content[0].text;
}

/**
 * Analyzes a product and determines its glyph and flags.
 * @param {string} name 
 * @param {string} category 
 * @param {Array<string>} ingredients 
 */
export async function analyzeProduct(name, category, ingredients) {
  

  const tools = [{
    name: 'save_product_analysis',
    description: 'Save the analyzed details of the product.',
    input_schema: {
      type: 'object',
      properties: {
        glyph: { type: 'string', description: 'Phosphor icon name without the ph- prefix (e.g. flask, test-tube, spray-bottle, drop). MUST BE a valid Phosphor icon name that best represents the physical nature of the object.' },
        risk_flags: {
          type: 'object',
          properties: {
            acid: { type: 'boolean' },
            retinoid: { type: 'boolean' },
            vitamin_c: { type: 'boolean' },
            exfoliant: { type: 'boolean' }
          }
        },
        behavior_flags: {
          type: 'object',
          properties: {
            requires_rinse: { type: 'boolean' },
            layering_weight: { type: 'integer', description: '1 (watery) to 10 (heavy balm/oil)' },
            uses_per_week: { type: 'number', description: 'Recommended frequency of use per week. Default to 7 for daily items, 1-3 for masks/exfoliants.' }
          }
        }
      },
      required: ['glyph', 'risk_flags', 'behavior_flags']
    }
  }];

  const { data, error } = await invokeAnthropicProxy({
      max_tokens: 500,
      tools: tools,
      tool_choice: { type: 'tool', name: 'save_product_analysis' },
      messages: [
        { role: 'user', content: `Analyze this cosmetic product:
Name: ${name}
Category: ${category}
Ingredients: ${ingredients.join(', ')}` }
      ]
  });
  if (error) throw error;
  const response = data;

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'save_product_analysis') {
      return block.input;
    }
  }
  
  throw new Error("Failed to extract product analysis.");
}

/**
 * Parses a tea image (loose leaf or box) using Claude Vision and extracts details.
 * @param {string} base64Image - The base64 string of the image
 * @param {string} mediaType - e.g. "image/jpeg"
 * @returns {Promise<Object>}
/**
 * Parses one or more tea images (loose leaf or box) using Claude Vision and extracts details.
 * @param {Array<{base64: string, mediaType: string}>} images
 * @returns {Promise<Object>}
 */
export async function parseTeaImage(images) {
  

  const tools = [
    {
      name: 'extract_tea_details',
      description: 'Extract herbal elixir/tea details from the image(s)',
      input_schema: {
        type: 'object',
        properties: {
          brand: { type: 'string', description: 'Brand or maker (if identifiable)' },
          name: { type: 'string', description: 'Name of the blend' },
          ingredients: { type: 'array', items: { type: 'string' }, description: 'List of herbs/ingredients identified from shapes/colors or read from the box label' },
          caffeine_content: { type: 'string', enum: ['High', 'Medium', 'Low', 'None'], description: 'Estimated caffeine content based on ingredients' },
          steep_time: { type: 'string', description: 'Recommended steeping time and temperature (e.g. "5 mins at 212°F")' },
          circadian_alignment: { type: 'string', enum: ['Daytime', 'Nighttime', 'Anytime'], description: 'Best time of day to consume based on ingredients' }
        },
        required: ['name', 'ingredients', 'caffeine_content', 'steep_time', 'circadian_alignment']
      }
    }
  ];

  const contentBlocks = images.map(img => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: img.mediaType,
      data: img.base64
    }
  }));

  contentBlocks.push({
    type: 'text',
    text: 'You are analyzing images of a tea or herbal elixir. It might be photos of loose leaf herbs, or photos of the front and back of a tea box/label. If it is loose leaf, analyze the shapes, sizes, and colors of the leaves, flowers, and bits to divine the ingredients. If it is a box, read the label (e.g. use the front for the name and the back for the ingredients). Extract the brand, blend name, ingredients list, estimated caffeine content, recommended steeping parameters, and circadian alignment (daytime vs nighttime use).'
  });

  const { data, error } = await invokeAnthropicProxy({
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: contentBlocks
        }
      ],
      tools: tools,
      tool_choice: { type: 'tool', name: 'extract_tea_details' }
  });
  if (error) throw error;
  const response = data;

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'extract_tea_details') {
      return block.input;
    }
  }

  throw new Error("Failed to extract tea details from image");
}

export async function searchOpenBeautyFacts(query) {
  if (!query) return [];
  try {
    const res = await fetch(`https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`);
    if (!res.ok) throw new Error("Failed to fetch from Open Beauty Facts");
    const data = await res.json();
    
    if (data.products && data.products.length > 0) {
      return data.products.slice(0, 10).map(p => ({
        id: p._id,
        brand: p.brands || p.brand_owner || 'Unknown Brand',
        name: p.product_name || 'Unknown Product',
        ingredients: p.ingredients_text ? p.ingredients_text : '',
        category: p.categories ? p.categories.split(',')[0] : '',
        image: p.image_url || ''
      }));
    }
    return [];
  } catch (err) {
    console.error("Open Beauty Facts search error:", err);
    return [];
  }
}

export async function searchOpenFoodFacts(query) {
  if (!query) return [];
  try {
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`);
    if (!res.ok) throw new Error("Failed to fetch from Open Food Facts");
    const data = await res.json();
    
    if (data.products && data.products.length > 0) {
      return data.products.slice(0, 10).map(p => ({
        id: p._id,
        brand: p.brands || p.brand_owner || 'Unknown Brand',
        name: p.product_name || 'Unknown Product',
        ingredients: p.ingredients_text ? p.ingredients_text : '',
        category: p.categories ? p.categories.split(',')[0] : '',
        image: p.image_url || ''
      }));
    }
    return [];
  } catch (err) {
    console.error("Open Food Facts search error:", err);
    return [];
  }
}

export async function fallbackTeaAnalysis(brand, name, ingredients) {
  const tools = [
    {
      name: "extract_tea_details",
      description: "Extract the inferred details of a tea/steeping item from its name and ingredients.",
      input_schema: {
        type: "object",
        properties: {
          caffeine: { type: "string", description: "Caffeine level, e.g. 'None', 'Low', 'High'" },
          circadian: { type: "string", description: "Circadian alignment: 'Morning', 'Afternoon', or 'Evening'" },
          character: { type: "string", description: "Character of the tea: 'Stimulating' or 'Calming'" },
          botanicals: { type: "string", description: "Comma separated list of primary botanical components." }
        },
        required: ["caffeine", "circadian", "character", "botanicals"]
      }
    }
  ];

  const payload = {
    messages: [
      {
        role: "user",
        content: `Analyze the following tea product:
Brand: ${brand}
Name: ${name}
Ingredients: ${ingredients || "Not provided. Infer based on name."}

Please extract the caffeine level, circadian alignment, character, and botanicals.`
      }
    ],
    tools: tools,
    tool_choice: { type: "tool", name: "extract_tea_details" },
    max_tokens: 300,
    system: "You are an expert herbalist and tea blender. Given a tea product, derive its properties accurately."
  };

  const { data, error } = await invokeAnthropicProxy(payload);
  if (error) throw error;

  for (const block of data.content) {
    if (block.type === 'tool_use' && block.name === 'extract_tea_details') {
      return block.input;
    }
  }

  throw new Error("Failed to infer tea details");
}

// Domain → OBF category tag mapping (biases OBF search query without overriding user-selected domain)
const DOMAIN_OBF_TAG = {
  'Crown':    'en:hair-care',
  'Visage':   'en:face-care',
  'Gaze':     'en:eye-make-up',
  'Grin':     'en:oral-hygiene',
  'Form':     'en:body-care',
  'Veil':     'en:make-up',
  'Steeping': 'en:hair-care', // infused oils are typically hair/body — no tea products in Rootwork
};

/**
 * Two-phase product lookup for the Summon by Hand AI-autocomplete wizard.
 *
 * Phase 1: Open Beauty Facts — domain-biased search (domain tag filters irrelevant categories)
 * Phase 2: Claude fallback — if OBF returns 0 results, Claude generates a best-guess autofill
 *
 * The user-selected `domain` is ALWAYS authoritative and is never overridden by OBF or Claude.
 * OBF's own category tags only influence the search query, not the returned domain value.
 *
 * @param {string} brand
 * @param {string} name
 * @param {string} domain - User-selected domain (e.g. 'Crown', 'Visage', 'Vessel')
 * @returns {Promise<Array>} Normalized candidate array
 */
export async function lookupProductDetails(brand, name, domain) {
  if (!navigator.onLine) {
    throw new Error("No Connection: The oracle is sleeping. Please connect to the internet.");
  }
  const domainTag = DOMAIN_OBF_TAG[domain] || '';
  const searchQuery = [brand, name].filter(Boolean).join(' ');

  // ── Phase 1: Open Beauty Facts ────────────────────────────────────────────
  let candidates = [];
  try {
    // Build URL — include category tag filter when we have a mapping
    let url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&action=process&json=1&page_size=5&fields=product_name,brands,brand_owner,ingredients_text,categories,image_url,_id`;
    if (domainTag) {
      url += `&tagtype_0=categories&tag_0=${encodeURIComponent(domainTag)}`;
    }

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        candidates = data.products
          .filter(p => p.product_name) // discard nameless entries
          .slice(0, 5)
          .map(p => ({
            id: p._id || crypto.randomUUID(),
            source: 'obf',
            brand: p.brands || p.brand_owner || brand || '',
            name: p.product_name || name,
            ingredients: p.ingredients_text || '',
            // category → Elixir Classification text only, never used for domain
            category: p.categories ? p.categories.split(',')[0].trim() : '',
            image: p.image_url || null,
            // Domain is always the user's selection — never derived from OBF
            domain: domain,
            application_zones: [],
            period_after_opening_months: null,
            unopened_shelf_life_months: null,
            item_type: 'consumable',
          }));
      }
    }
  } catch (err) {
    console.warn('OBF lookup failed, proceeding to Claude fallback:', err.message);
  }

  // ── Phase 2: Claude fallback ──────────────────────────────────────────────
  // Runs when OBF has 0 results. Also runs as supplement when OBF has results
  // but no ingredients (common for niche/handmade products).
  const needsClaudeFallback = candidates.length === 0;
  const needsIngredientEnrich = candidates.length > 0 && candidates.every(c => !c.ingredients);

  if (needsClaudeFallback || needsIngredientEnrich) {
    try {
      const claudeTools = [{
        name: 'fill_product_details',
        description: 'Return your best-known data for this personal care or cosmetic product. If the product is handmade or generic (e.g. "DIY bath soak", "rosemary oil"), return reasonable ingredient defaults and typical shelf-life values.',
        input_schema: {
          type: 'object',
          properties: {
            brand:                       { type: 'string' },
            name:                        { type: 'string' },
            ingredients:                 { type: 'string', description: 'Comma-separated ingredient list' },
            category:                    { type: 'string', description: 'Human-readable product category, e.g. "Hair Oil", "Body Scrub", "Eye Serum"' },
            application_zones:           { type: 'array', items: { type: 'string' }, description: 'Body areas this product is applied to, e.g. ["scalp", "hair", "face"]' },
            period_after_opening_months: { type: 'number', description: 'Typical months until expiry after opening (PAO). Null if unknown.' },
            unopened_shelf_life_months:  { type: 'number', description: 'Typical unopened shelf life in months. Null if unknown.' },
            item_type:                   { type: 'string', enum: ['consumable', 'arsenal', 'composite'], description: '"consumable" for products, "arsenal" for tools/devices, "composite" for handmade mixes' },
          },
          required: ['brand', 'name', 'ingredients', 'category', 'application_zones', 'item_type'],
        }
      }];

      const { data: claudeData, error: claudeErr } = await invokeAnthropicProxy({
        max_tokens: 800,
        tools: claudeTools,
        tool_choice: { type: 'tool', name: 'fill_product_details' },
        messages: [{
          role: 'user',
          content: `You are a cosmetic product database. A user is adding this product to their personal care tracker.

Brand: ${brand || '(not specified)'}
Product name: ${name}
Product domain: ${domain} (Crown=hair/scalp, Visage=face, Gaze=eyes, Grin=oral, Form=body, Veil=makeup, Steeping=infused oils)

Return your best known data for this product. If it's a well-known commercial product, use real ingredient data. If it's handmade or generic, provide sensible defaults.`
        }]
      });

      if (!claudeErr && claudeData?.content) {
        const toolBlock = claudeData.content.find(b => b.type === 'tool_use' && b.name === 'fill_product_details');
        if (toolBlock?.input) {
          const ai = toolBlock.input;
          if (needsClaudeFallback) {
            // Add as sole candidate from Claude
            candidates.push({
              id: 'ai-generated',
              source: 'ai',
              brand: ai.brand || brand || '',
              name: ai.name || name,
              ingredients: ai.ingredients || '',
              category: ai.category || '',
              image: null,
              domain: domain, // always user's selection
              application_zones: ai.application_zones || [],
              period_after_opening_months: ai.period_after_opening_months || null,
              unopened_shelf_life_months: ai.unopened_shelf_life_months || null,
              item_type: ai.item_type || 'consumable',
            });
          } else if (needsIngredientEnrich) {
            // Enrich existing OBF candidates that had no ingredients
            candidates = candidates.map(c => ({
              ...c,
              ingredients: c.ingredients || ai.ingredients || '',
              application_zones: c.application_zones.length ? c.application_zones : (ai.application_zones || []),
              period_after_opening_months: c.period_after_opening_months ?? ai.period_after_opening_months ?? null,
              unopened_shelf_life_months: c.unopened_shelf_life_months ?? ai.unopened_shelf_life_months ?? null,
            }));
          }
        }
      }
    } catch (err) {
      console.warn('Claude product lookup fallback failed:', err.message);
    }
  }

  return candidates;
}


/**
 * Parses a tCheck measurement image using Claude Vision and extracts the reading.
 * @param {Array<{base64: string, mediaType: string}>} images
 * @returns {Promise<Object>}
 */
export async function parseTCheckImage(images) {
  const tools = [
    {
      name: 'extract_tcheck_reading',
      description: 'Extract the numeric potency reading and unit from a tCheck device screen',
      input_schema: {
        type: 'object',
        properties: {
          reading_raw: { type: 'number', description: 'The numeric potency value displayed on the screen (e.g. 15.2)' },
          reading_unit: { type: 'string', enum: ['mg/mL', 'mg/tsp', 'mg/Tbsp', 'mg/cup'], description: 'The unit displayed on the screen' }
        },
        required: ['reading_raw', 'reading_unit']
      }
    }
  ];

  const contentBlocks = images.map(img => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: img.mediaType,
      data: img.base64
    }
  }));

  contentBlocks.push({
    type: 'text',
    text: 'You are looking at a photo of a tCheck device screen. Extract the numeric potency reading and the exact unit displayed.'
  });

  const { data, error } = await invokeAnthropicProxy({
      max_tokens: 500,
      messages: [{ role: 'user', content: contentBlocks }],
      tools: tools,
      tool_choice: { type: 'tool', name: 'extract_tcheck_reading' }
  });
  if (error) throw error;

  for (const block of data.content) {
    if (block.type === 'tool_use' && block.name === 'extract_tcheck_reading') {
      return block.input;
    }
  }

  throw new Error("Failed to extract tCheck reading from image");
}


export function compressImage(file, maxWidth = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
}
