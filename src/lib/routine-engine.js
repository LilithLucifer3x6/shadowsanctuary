/**
 * Routine Engine
 * Sorts items by time of day and layering weight.
 * Enforces the Deterministic Safety Layer (Codex, Melanin Ward, 4C Hair, Zonal Rules).
 */

import { supabase } from './supabase.js';

let cachedCodex = [];
let cachedConflicts = [];

export async function initEngineRules() {
  try {
    const { data: c1 } = await supabase.from('codex_entries').select('*');
    const { data: c2 } = await supabase.from('conflict_rules').select('*');
    cachedCodex = c1 || [];
    cachedConflicts = c2 || [];
  } catch (e) {
    console.error('Failed to initialize engine rules:', e);
  }
}

// Risk Ward checks (presence-based triggers)
const MELANIN_TRIGGERS = ['hydroquinone', 'citrus', 'lemon', 'lime', 'grapefruit'];

export async function fetchHydratedItems(filterStates = null) {
  let query = supabase.from('items').select(`*, composite_components(component_id, items(*))`);
  if (filterStates && filterStates.length > 0) {
    query = query.in('lifecycle_state', filterStates);
  }
  
  const { data: items } = await query;
  if (!items) return [];

  return items.map(item => {
    if (item.item_type === 'composite' && item.composite_components) {
      const components = item.composite_components.map(cc => cc.items).filter(Boolean);
      
      const allIngs = new Set(typeof item.ingredients === 'string' ? JSON.parse(item.ingredients) : (item.ingredients || []));
      let baseFlags = typeof item.risk_flags === 'string' ? JSON.parse(item.risk_flags) : (item.risk_flags || {});
      
      components.forEach(c => {
        const cIng = typeof c.ingredients === 'string' ? JSON.parse(c.ingredients) : (c.ingredients || []);
        cIng.forEach(i => allIngs.add(i));
        
        const cFlags = typeof c.risk_flags === 'string' ? JSON.parse(c.risk_flags) : (c.risk_flags || {});
        baseFlags = { ...baseFlags, ...cFlags };
      });
      
      item.ingredients = Array.from(allIngs);
      item.risk_flags = baseFlags;
    }
    return item;
  });
}
const HAIR_4C_BUILDUP = ['beeswax', 'petrolatum', 'mineral oil', 'dimethicone']; // Heavy waxes/silicones
const INTIMATE_DISRUPTORS = ['fragrance', 'parfum', 'baking soda', 'sodium bicarbonate'];
const DEPILATORY_CAUTIONS = ['thioglycolate', 'calcium hydroxide', 'potassium hydroxide'];

// Helper to check if any ingredient contains any of the bad words
function checkIngredients(ingredients, badList) {
  if (!ingredients || !Array.isArray(ingredients)) return false;
  return ingredients.some(ing => {
    const lower = ing.toLowerCase();
    return badList.some(bad => lower.includes(bad));
  });
}

function parseFlags(item) {
  let rf = item.risk_flags;
  let bf = item.behavior_flags;
  let ing = item.ingredients;
  
  if (typeof rf === 'string') try { rf = JSON.parse(rf); } catch(e) { rf = {}; }
  if (typeof bf === 'string') try { bf = JSON.parse(bf); } catch(e) { bf = {}; }
  if (typeof ing === 'string') try { ing = JSON.parse(ing); } catch(e) { ing = []; }
  
  item.risk_flags = rf || {};
  item.behavior_flags = bf || {};
  item.ingredients = Array.isArray(ing) ? ing : [];
  return item;
}

import { generateAdaptiveSuggestions } from './ai-service.js';

export function buildBaseRoutines(items, userProfile = {}, wearables = {}) {
  const amItems = [];
  const pmItems = [];
  
  const d = new Date();
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  
  const { readiness = 100, sleepDuration = 8, heavySweat = false } = wearables;
  
  const intake = userProfile.intake_answers || {};
  const oralsList = intake.oralList || [];
  const rxList = intake.rxList || [];
  const orals = oralsList.map(o => (o.name || '').toLowerCase());
  const hasIsotretinoin = orals.some(m => m.includes('isotretinoin') || m.includes('accutane'));
  const isImmunosuppressed = orals.some(m => m.includes('methotrexate') || m.includes('etanercept') || m.includes('enbrel'));

  const virtualRxItems = rxList.map((rx, idx) => {
    const rxName = (rx.name || '').toLowerCase();
    
    return {
      id: `rx-${idx}`,
      name: rx.name,
      category: 'treatment',
      domain: rxName.includes('drysol') ? 'vessel' : 'visage',
      risk_flags: { retinoid: rxName.includes('tretinoin') || rxName.includes('retin') || rxName.includes('adapalene') || rxName.includes('tazarotene') || rxName.includes('trifarotene') },
      behavior_flags: { layering_weight: 9 }, // Default treatment weight
      ingredients: [],
      isInjected: false,
      isRx: true,
      application_zone: rx.zone || ''
    };
  });
  
  const allItems = [...items, ...virtualRxItems];

  allItems.forEach(rawItem => {
    const item = parseFlags(rawItem);
    
    // THE CODEX: Dynamic DB Ban
    const dynamicBans = cachedCodex.map(c => c.ingredient.toLowerCase());
    if (checkIngredients(item.ingredients, dynamicBans)) {
      return; // Stripped entirely
    }

    const name = (item.name || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    
    // HARD MEDICAL BLOCK: Isotretinoin (Oral) + Retinoid/Acid (Topical)
    if (hasIsotretinoin && (item.risk_flags.retinoid || item.risk_flags.acid || item.risk_flags.exfoliant)) {
      return; // Stripped entirely to prevent chemical burns
    }

    let isAm = true;
    let isPm = true;

    // Master Invocations & Time-of-day parsing
    if (cat.includes('sleeping mask') || (item.behavior_flags && item.behavior_flags.night_only)) {
      isAm = false; // Night-specific items
    }
    if (cat.includes('sunscreen') || cat.includes('spf') || (item.behavior_flags && item.behavior_flags.day_only)) {
      isPm = false; // Day-specific items
    }
    if (item.risk_flags && item.risk_flags.hyperhidrosis_treatment) {
      isAm = false; // Drysol at bedtime only
    }

    // Mask scheduling logic based on time availability
    if (cat.includes('mask')) {
      const requiresRinse = item.behavior_flags?.requires_rinse;
      if (requiresRinse) {
        // Rinse-off masks require more time, routed to weekends
        if (!isWeekend) {
          isAm = false;
          isPm = false;
        }
      } else {
        // Leave-on masks are scheduled for the rest of the week
        if (isWeekend) {
          isAm = false;
          isPm = false;
        }
      }
    }

    // Base AM/PM logic falls through to here.
    if (isAm) amItems.push(item);
    if (isPm) pmItems.push(item);
  });

  // AI-Driven Wearables Adaptation (moved to buildRoutines)

  // Zone-based Conflict Rescheduling
  // If Retinoid is in PM, move Vitamin C and Exfoliating Acids to AM
  const pmRetinoids = pmItems.filter(i => i.risk_flags?.retinoid);
  if (pmRetinoids.length > 0) {
    // Find all Vit C and Acids in PM that share a zone with the retinoid
    for (let i = pmItems.length - 1; i >= 0; i--) {
      const item = pmItems[i];
      const isVitC = item.risk_flags?.vitamin_c;
      const isAcid = item.risk_flags?.acid || item.risk_flags?.exfoliant;
      
      if (isVitC || isAcid) {
        // Check zone overlap
        const itemZone = (item.application_zone || 'full-face').toLowerCase();
        const overlaps = pmRetinoids.some(r => {
          const rZone = (r.application_zone || 'full-face').toLowerCase();
          return rZone === itemZone || rZone === 'full-face' || itemZone === 'full-face';
        });
        
        if (overlaps) {
          // Reschedule to AM
          pmItems.splice(i, 1);
          if (!amItems.find(a => a.id === item.id)) {
            amItems.push(item);
          }
        }
      }
    }
  }

  const getWeight = (item) => {
    // 1. Explicit user overrides
    if (item.behavior_flags && item.behavior_flags.layering_weight) {
      return item.behavior_flags.layering_weight;
    }
    
    const cat = (item.category || '').toLowerCase();
    
    // 2. Functional category overrides (must-be-first / must-be-last)
    if (cat.includes('cleanser') || cat.includes('wash')) return 1;
    if (cat.includes('sunscreen') || cat.includes('spf')) return 10;

    // 3. Texture-based physical layering (thinnest to thickest)
    if (item.texture) {
      const tex = item.texture.toLowerCase();
      if (tex === 'liquid' || tex === 'gel') return 2;
      if (tex === 'serum') return 3;
      if (tex === 'lotion' || tex === 'mousse') return 5;
      if (tex === 'cream') return 7;
      if (tex === 'oil') return 8;
      if (tex === 'balm' || tex === 'ointment' || tex === 'solid') return 9;
      if (tex === 'powder') return 10;
    }

    // 4. Fallback inference if texture is missing (legacy products)
    if (cat.includes('toner') || cat.includes('essence') || cat.includes('mist')) return 2;
    if (cat.includes('serum') || cat.includes('ampoule')) return 3;
    if (cat.includes('lotion') || cat.includes('emulsion')) return 5;
    if (cat.includes('cream') || cat.includes('moisturizer')) return 7;
    if (cat.includes('oil')) return 8;
    if (cat.includes('balm') || cat.includes('ointment')) return 9;
    
    return 5; // Default middle-weight
  };

  amItems.sort((a, b) => getWeight(a) - getWeight(b));
  pmItems.sort((a, b) => getWeight(a) - getWeight(b));
  
  // IMMUTABLE BASELINE ROUTINES (From Spec Section 21)
  const immutableGrinAM = [
    { id: 'grin-am-1', name: 'The Silk Thread', desc: 'Floss meticulously to remove stagnation.', category: 'immutable', domain: 'grin', weight: -0.4, isInjected: true },
    { id: 'grin-am-2', name: 'The Purifying Stream', desc: 'Water flosser to flush hidden impurities.', category: 'immutable', domain: 'grin', weight: -0.3, isInjected: true },
    { id: 'grin-am-3', name: 'The Minted Draught', desc: 'Mouthwash to cleanse the breath.', category: 'immutable', domain: 'grin', weight: -0.2, isInjected: true },
    { id: 'grin-am-4', name: 'The Bristled Cleanse', desc: 'Brush teeth with devotion.', category: 'immutable', domain: 'grin', weight: -0.1, isInjected: true }
  ];
  
  const immutableGrinPM = [
    { id: 'grin-pm-1', name: 'The Silk Thread', desc: 'Floss meticulously to remove stagnation.', category: 'immutable', domain: 'grin', weight: -0.4, isInjected: true },
    { id: 'grin-pm-2', name: 'The Purifying Stream', desc: 'Water flosser to flush hidden impurities.', category: 'immutable', domain: 'grin', weight: -0.3, isInjected: true },
    { id: 'grin-pm-3', name: 'The Minted Draught', desc: 'Mouthwash to cleanse the breath.', category: 'immutable', domain: 'grin', weight: -0.2, isInjected: true },
    { id: 'grin-pm-4', name: 'The Bristled Cleanse', desc: 'Brush teeth with devotion.', category: 'immutable', domain: 'grin', weight: -0.1, isInjected: true }
  ];

  const immutableWindDown = [
    { id: 'wd-1', name: 'The Cleansing Waters', category: 'immutable', domain: 'vessel', weight: 0.1, isInjected: true },
    { id: 'wd-2', name: 'The Drying', desc: 'With the aid of another', category: 'immutable', domain: 'vessel', weight: 0.2, isInjected: true }
  ];
  
  immutableWindDown.push({
    id: 'wd-3a',
    name: 'The Purging of Blemishes',
    desc: isImmunosuppressed ? 'A gentle reminder: extra care with sanitation is worth it while immunosuppressed.' : '',
    category: 'immutable',
    domain: 'visage',
    weight: 0.3,
    isInjected: true
  });
  immutableWindDown.push({ id: 'wd-3b', name: 'The Warm Gaze', desc: 'Warm compress and eye massage.', category: 'immutable', domain: 'visage', weight: 0.31, isInjected: true });
  
  if (isWeekend) {
    // Left intentionally blank. Rituals must be user-defined.
  }

  amItems.unshift(...immutableGrinAM);
  pmItems.unshift(...immutableWindDown);
  pmItems.push(...immutableGrinPM);

  return { amItems, pmItems, getWeight, allItems };
}

export async function buildRoutines(items, userProfile = {}, wearables = {}) {
  const { amItems, pmItems, getWeight, allItems } = buildBaseRoutines(items, userProfile);

  // AI-Driven Wearables Adaptation with caching to prevent load-time hang
  const cacheKey = `adaptive_suggestions_${new Date().toISOString().split('T')[0]}`;
  let adaptiveIds = [];
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      adaptiveIds = JSON.parse(cached);
    } else {
      adaptiveIds = await generateAdaptiveSuggestions(wearables, allItems);
      sessionStorage.setItem(cacheKey, JSON.stringify(adaptiveIds || []));
    }
  } catch(e) {}

  if (adaptiveIds && adaptiveIds.length > 0) {
    adaptiveIds.forEach(id => {
      const item = allItems.find(i => i.id === id);
      if (item && !amItems.some(a => a.id === id)) {
        // AI specifically requested this item for the AM routine due to health metrics
        amItems.push(item);
      }
    });
  }
  
  return { amItems, pmItems, getWeight };
}

export function checkConflicts(items, userProfile = {}) {
  const conflicts = [];
  
  const intake = userProfile.intake_answers || {};
  const oralsList = intake.oralList || [];
  const orals = oralsList.map(o => (o.name || '').toLowerCase());
  const hasIsotretinoin = orals.some(m => m.includes('isotretinoin') || m.includes('accutane'));
  const hasMethotrexate = orals.some(m => m.includes('methotrexate'));
  
  // ZONAL MAPPING
  const zoneMap = {};
  items.forEach(rawItem => {
    const item = parseFlags(rawItem);
    const zone = (item.application_zone || 'full-face').toLowerCase();
    if (!zoneMap[zone]) zoneMap[zone] = [];
    zoneMap[zone].push(item);
  });

  // DYNAMIC CONFLICT RULES
  cachedConflicts.forEach(rule => {
    const ingA = rule.ingredient_a.toLowerCase();
    const ingB = rule.ingredient_b.toLowerCase();
    
    const hasA = (itemList) => itemList.some(i => (i.risk_flags && i.risk_flags[ingA]) || checkIngredients(i.ingredients, [ingA]) || i.name.toLowerCase().includes(ingA));
    const hasB = (itemList) => itemList.some(i => (i.risk_flags && i.risk_flags[ingB]) || checkIngredients(i.ingredients, [ingB]) || i.name.toLowerCase().includes(ingB));
    
    if (rule.zone_specific) {
      for (const [zone, zoneItems] of Object.entries(zoneMap)) {
        if (hasA(zoneItems) && hasB(zoneItems)) {
          conflicts.push(`Zonal Conflict [${zone}]: ${rule.description || 'Mixing these components is not advised.'}`);
        }
      }
    } else {
      if (hasA(items) && hasB(items)) {
        conflicts.push(`Conflict: ${rule.description || 'Mixing these components is not advised.'}`);
      }
    }
  });

  // ZONAL CONFLICT RESOLUTION (Melanin Ward only, acids/retinoids handled dynamically above)
  for (const [zone, zoneItems] of Object.entries(zoneMap)) {
    
    // MELANIN WARD (Methotrexate is heavily photosensitizing)
    const photosensitizers = zoneItems.filter(i => i.risk_flags.photosensitizer || checkIngredients(i.ingredients, MELANIN_TRIGGERS));
    if (hasMethotrexate || photosensitizers.length > 0) {
      if (!items.some(i => i.category.toLowerCase().includes('spf') || i.category.toLowerCase().includes('sunscreen'))) {
        let source = hasMethotrexate ? "Oral Methotrexate" : photosensitizers.map(i=>i.name).join(', ');
        conflicts.push(`Melanin Ward Warning: ${source} increases photosensitivity. Sun protection is load-bearing. Add SPF to your routine!`);
      }
    }
  }

  // HARD MEDICAL BLOCK: Isotretinoin + Retinoids/Acids
  const hasTopicalRetinoidOrAcid = items.some(i => i.risk_flags.retinoid || i.risk_flags.acid || i.risk_flags.exfoliant);
  if (hasIsotretinoin && hasTopicalRetinoidOrAcid) {
    conflicts.push("CRITICAL HAZARD: Oral Isotretinoin detected. Concomitant use of topical retinoids or exfoliating acids causes severe chemical burns and barrier damage. They have been suspended from all Rites.");
  }

  // 4C HAIR & INTIMATE WARDS
  const crownItems = items.filter(i => (i.domain || '').toLowerCase() === 'crown');
  if (crownItems.some(i => checkIngredients(i.ingredients, HAIR_4C_BUILDUP))) {
    conflicts.push("4C Crown Ward: Heavy waxes or non-soluble silicones detected. Risk of buildup in microlocs.");
  }

  const vesselItems = items.filter(i => (i.domain || '').toLowerCase() === 'vessel');
  if (vesselItems.some(i => i.application_zone === 'intimate' && checkIngredients(i.ingredients, INTIMATE_DISRUPTORS))) {
    conflicts.push("Intimate Care Ward: pH disruptors or fragrance detected. Risk to microbiome.");
  }
  
  // SENSITIVE SKIN (Depilatories)
  const depilatories = items.filter(i => checkIngredients(i.ingredients, DEPILATORY_CAUTIONS) || (i.category||'').toLowerCase().includes('depilatory'));
  if (depilatories.length > 0) {
    conflicts.push(`Sensitive Ward: Depilatory (${depilatories.map(i=>i.name).join(', ')}) requires a low-pH cleanse post-care to neutralize alkaline burns.`);
  }

  // DRYSOL HARD RULE
  const hasDrysol = items.some(i => i.risk_flags && i.risk_flags.hyperhidrosis_treatment);
  const hasBathRitual = items.some(i => (i.category || '').toLowerCase().includes('soak'));
  const hasWitchHazel = items.some(i => i.risk_flags && i.risk_flags.astringent);
  if (hasDrysol && (hasBathRitual || hasWitchHazel)) {
    conflicts.push("Drysol Hard Rule: Never apply aluminum chloride on the same day as the bath ritual or astringents to avoid chemical burning.");
  }

  // Immunosuppressants override accepted: Tool sanitization is handled by the user.

  return conflicts;
}

export function filterLesserRite(routineItems) {
  if (!routineItems) return [];
  return routineItems.filter(item => {
    // Keep immutable steps (like brushing teeth, showering)
    if (item.category === 'immutable' || item.isInjected) return true;
    // Keep true prescriptions
    if (item.is_prescription || item.isRx) return true;
    // Keep user-flagged load-bearing items
    if (item.behavior_flags?.load_bearing) return true;
    // Keep SPF, Sunscreen, Cleansers, and Moisturizers
    const cat = (item.category || '').toLowerCase();
    if (cat.includes('spf') || cat.includes('sunscreen')) return true;
    if (cat.includes('cleanser') || cat.includes('moisturizer') || cat.includes('moisturiser')) return true;
    // Everything else is dropped for the low-friction routine
    return false;
  });
}
