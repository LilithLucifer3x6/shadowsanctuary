import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import MultiPhotoReview from '../components/MultiPhotoReview.jsx';
import { G } from '../lib/icons.jsx';
import Icon from '../components/Icon.jsx';
import VoiceInput from '../components/VoiceInput.jsx';
import { useDialog } from '../components/Dialogs.jsx';
import { attachVoice } from '../lib/voice.js';
import { buildBaseRoutines } from '../lib/routine-engine.js';
import SpeakerButton from '../components/SpeakerButton.jsx';

export default function Rootwork({ pose }) {
  const { alert, confirm } = useDialog();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    brand: '',
    name: '',
    domain: 'Crown',
    category: '',
    ingredients: '',
    weight: '5',
    expiration: '',
    price: '',
    is_essential: false,
    is_composite: false,
    selectedComponents: []
  });
  const [isAutoWeight, setIsAutoWeight] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [pendingImports, setPendingImports] = useState([]);
  const [photoStatus, setPhotoStatus] = useState('Offer or Scry Photo');
  const [modalState, setModalState] = useState('photo');
  const [banishState, setBanishState] = useState(null);
  const [isSearchingOBF, setIsSearchingOBF] = useState(false);
  const [obfResults, setObfResults] = useState([]);
  
  const [profile, setProfile] = useState(null);
  const [echoInput, setEchoInput] = useState('');
  const [echoStatus, setEchoStatus] = useState('');
  const [echoResult, setEchoResult] = useState('');

  const handleSearchOBF = async () => {
    if (!addForm.name) return;
    setIsSearchingOBF(true);
    setObfResults([]);
    try {
      const { searchOpenBeautyFacts } = await import('../lib/ai-engine.js');
      const results = await searchOpenBeautyFacts(addForm.name);
      setObfResults(results);
      if (results.length === 0) {
        await alert("No relics found by that name in the global index.");
      }
    } catch (err) {
      console.error(err);
    }
    setIsSearchingOBF(false);
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('items').select('*').order('name');
    const { data: ebbingIds } = await supabase.rpc('get_ebbing_items');
    
    if (data) {
      const ebbingIdSet = new Set(ebbingIds?.map(e => e.item_id) || []);
      for (const item of data) {
        if (item.lifecycle_state === 'stocked' && ebbingIdSet.has(item.id)) {
          await supabase.from('items').update({ lifecycle_state: 'ebbing' }).eq('id', item.id);
          item.lifecycle_state = 'ebbing';
        }
      }
    }
    
    setItems(data || []);
    
    const { data: userProfile } = await supabase.from('user_profile').select('*').maybeSingle();
    setProfile(userProfile);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const waning = items.filter(i => i.lifecycle_state === 'waning');
  const ebbing = items.filter(i => i.lifecycle_state === 'ebbing' || i.lifecycle_state === 'hollow');
  const banished = items.filter(i => i.lifecycle_state === 'banished');
  const enrichedApothecary = items
    .filter(i => (i.item_type === 'consumable' || i.item_type === 'composite') && !['ebbing', 'hollow', 'banished'].includes(i.lifecycle_state))
    .map(i => {
      let expiryPAO = null;
      let expiryShelf = null;

      if (i.period_after_opening_months && i.opened_date) {
        const start = new Date(i.opened_date);
        expiryPAO = new Date(start.setMonth(start.getMonth() + parseInt(i.period_after_opening_months, 10)));
      }

      if (i.unopened_shelf_life_months && (i.manufacture_date || i.purchase_date || i.created_at)) {
        const startShelf = new Date(i.manufacture_date || i.purchase_date || i.created_at);
        expiryShelf = new Date(startShelf.setMonth(startShelf.getMonth() + parseInt(i.unopened_shelf_life_months, 10)));
      }

      const trueExpiry = (expiryPAO && expiryShelf) 
        ? (expiryPAO < expiryShelf ? expiryPAO : expiryShelf) 
        : (expiryPAO || expiryShelf);
        
      let monthsLeft = null;
      if (trueExpiry) {
        monthsLeft = (trueExpiry - new Date()) / (1000 * 60 * 60 * 24 * 30);
      }
      
      return {
        ...i,
        is_expired: monthsLeft !== null && monthsLeft <= 0,
        is_waning: monthsLeft !== null && monthsLeft > 0 && monthsLeft <= 1
      };
    });

  const apothecaryActive = enrichedApothecary.filter(i => !i.is_waning && !i.is_expired);
  const waningItems = enrichedApothecary.filter(i => i.is_waning || i.is_expired);

  const arsenal = items.filter(i => i.item_type === 'tool' && !['ebbing', 'hollow', 'banished'].includes(i.lifecycle_state));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setPhotoStatus('Divining image...');
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(',')[1];
      const mime = dataUrl.split(';')[0].split(':')[1];
      
      try {
                const { parseProductImage } = await import('../lib/ai-engine.js');
        const details = await parseProductImage(base64, mime);
        
        setAddForm(prev => ({
          ...prev,
          brand: details.brand || prev.brand,
          name: details.name || prev.name,
          category: details.category || prev.category,
          ingredients: details.ingredients ? details.ingredients.join(', ') : prev.ingredients,
          application_zones: details.application_zones || prev.application_zones,
          item_type: details.item_type || prev.item_type,
          container_size: details.container_size || prev.container_size,
          texture: details.texture || prev.texture,
          period_after_opening_months: details.period_after_opening_months ? String(details.period_after_opening_months) : prev.period_after_opening_months,

          unopened_shelf_life_months: details.unopened_shelf_life_months ? String(details.unopened_shelf_life_months) : prev.unopened_shelf_life_months,
          manufacture_date: details.manufacture_date || prev.manufacture_date,
          purchase_date: details.purchase_date || prev.purchase_date,
          is_prescription: details.is_prescription !== undefined ? details.is_prescription : prev.is_prescription,
          prescription_details: details.prescription_details || prev.prescription_details
        }));
        
        setPhotoStatus('Vision extracted.');
        setModalState('confirm');
      } catch (err) {
        console.error(err);
        setPhotoStatus('The vision was clouded. Offer image anew.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEchoScry = async (inputStr = echoInput) => {
    const query = (typeof inputStr === 'string' ? inputStr : echoInput).trim();
    if (!query) return;
    
    // LAVENDER BAN
    if (/(lavender|lavandula|lavandin)/i.test(query)) {
      setEchoStatus(<span><Icon name="warning" /> WARNING: Lavender detected. This formula is sealed in the Crypt of Ashes.</span>);
      setEchoResult('Lavender is strictly forbidden from your routine. It has been sealed in the Crypt of Ashes.');
      
      const isAlreadyBanished = items.some(i => i.name === 'Lavender Formula (Banished)');
      if (!isAlreadyBanished) {
        await supabase.from('items').insert([{
          brand: 'Unknown',
          name: 'Lavender Formula (Banished)',
          domain: 'Vessel',
          item_type: 'consumable',
          lifecycle_state: 'banished'
        }]);
        fetchItems();
      }
      return;
    }

    setEchoStatus('The Echo stirs...');
    setEchoResult('');
    
    try {
      const { evaluateScryingPool } = await import('../lib/ai-engine.js');
      // Pass empty reactions object since Echo checks prospective items, not current reactions
      const reply = await evaluateScryingPool(query, profile?.intake_answers || {}, items, {});
      setEchoStatus('');
      setEchoResult(reply);
    } catch (err) {
      console.error(err);
      setEchoStatus('The Echo is clouded. ' + err.message);
    }
  };

  const handleEchoPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setEchoStatus('Divining image...');
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(',')[1];
      const mime = dataUrl.split(';')[0].split(':')[1];
      
      try {
        const { parseProductImage } = await import('../lib/ai-engine.js');
        const details = await parseProductImage(base64, mime);
        const formulaStr = `${details.brand || ''} ${details.name || ''} ${details.category || ''}`;
        setEchoInput(formulaStr.trim());
        setEchoStatus('Vision extracted. Divining...');
        await handleEchoScry(formulaStr.trim());
      } catch (err) {
        console.error(err);
        setEchoStatus('The vision was clouded. Offer image anew.');
      }
    };
    reader.readAsDataURL(file);
  };


  const validateItemForSave = async (item) => {
    // 0. Type Check
    if (!item.item_type || !['consumable', 'arsenal', 'composite'].includes(item.item_type)) {
      await alert(`Safety Block: ${item.name || 'An item'} is missing its Item Type.`);
      return false;
    }

    // 1. Universal Check: Must have a Zone
    if (!item.application_zones || item.application_zones.length === 0) {
      await alert(`Safety Block: ${item.name || 'An item'} is missing its application zone (e.g. 'oral' for pills, 'visage' for creams).`);
      return false;
    }

    // 2. Consumable/Composite Check: Must have Ingredients
    if (item.item_type === 'consumable' || item.item_type === 'composite') {
      const isMissingIngredients = Array.isArray(item.ingredients) 
        ? item.ingredients.length === 0 
        : (!item.ingredients || item.ingredients.trim() === '');

      if (isMissingIngredients) {
        await alert(`Safety Block: ${item.name || 'A consumable'} must have its ingredients listed to pass the Codex.`);
        return false;
      }
    }

    // 2b. Composite Check
    if (item.item_type === 'composite') {
      if (!item.composite_form) {
        await alert(`Safety Block: ${item.name || 'A composite'} is missing its composite_form.`);
        return false;
      }
      if (!item.selectedComponents || item.selectedComponents.length === 0) {
        await alert(`Safety Block: ${item.name || 'A composite'} must select its base components.`);
        return false;
      }
    }

    // 3. Prescription Check
    if (item.is_prescription && (!item.prescription_details || item.prescription_details.trim() === '')) {
      await alert(`Safety Block: You must provide prescription details for ${item.name || 'the Rx item'}.`);
      return false;
    }

    // 4. Expiry Check (Non-Arsenal Only)
    if (item.item_type === 'consumable') {
      const hasOpenedClock = !!item.period_after_opening_months && !!item.is_opened; 
      const hasUnopenedClock = !!item.unopened_shelf_life_months && (!!item.manufacture_date || !!item.purchase_date);
      
      if (!hasOpenedClock && !hasUnopenedClock) {
        await alert(`Safety Block: ${item.name || 'A consumable'} must provide either an opened PAO clock, or an unopened manufacture shelf-life clock.`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!addForm.name) return;
    
    // Part B: Shared Validation
    const isValid = await validateItemForSave({
      ...addForm,
      item_type: addForm.item_type || (addForm.is_composite ? 'composite' : 'consumable'),
      composite_form: addForm.is_composite ? 'other' : null
    });
    if (!isValid) return;

    // Block save if composite and any selected component is missing a proportion
    if (addForm.is_composite && addForm.selectedComponents?.length > 0) {
      const missingProportions = addForm.selectedComponents.some(c => !c.proportion || c.proportion.trim() === '');
      if (missingProportions) {
        await alert("Please specify a proportion for all selected base elements.");
        return;
      }
    }

    setIsSaving(true);
    
    const manualWeight = isAutoWeight ? null : parseInt(addForm.weight);
    
    try {
      const { analyzeProduct } = await import('../lib/ai-engine.js');
      const ingArray = addForm.ingredients.split(',').map(s => s.trim()).filter(Boolean);
      
      const aiResult = await analyzeProduct(addForm.name, addForm.category, ingArray);
      
      let bFlags = aiResult.behavior_flags || {};
      if (manualWeight) {
        bFlags.layering_weight = manualWeight;
      }
      const bFlagsStr = JSON.stringify(bFlags);
      const riskFlagsStr = JSON.stringify(aiResult.risk_flags || {});
      const ingStr = JSON.stringify(ingArray);
      
      let savedItemId = addForm.id;
      if (addForm.id) {
        await supabase.from('items').update({
          brand: addForm.brand,
          name: addForm.name,
          domain: addForm.domain,
          category: addForm.category,
          ingredients: ingStr,
          application_zones: addForm.application_zones || [],
          is_prescription: !!addForm.is_prescription,
          prescription_details: addForm.prescription_details || null,
          risk_flags: riskFlagsStr,
          behavior_flags: bFlagsStr,
          glyph: aiResult.glyph,
          item_type: addForm.item_type || (addForm.is_composite ? 'composite' : 'consumable'),
          measured_potency_mg_ml: addForm.measured_potency_mg_ml || null,
          inferred_potency_mg_ml: addForm.inferred_potency_mg_ml || null,
          potency_source: addForm.potency_source || null,
          levo_material_qty: addForm.levo_material_qty || null,
          levo_temperature: addForm.levo_temperature || null,
          levo_duration: addForm.levo_duration || null,
          levo_carrier_oil: addForm.levo_carrier_oil || null,
          lifecycle_state: addForm.lifecycle_state || 'stocked',
          is_essential: !!addForm.is_essential,
          period_after_opening_months: addForm.period_after_opening_months ? parseInt(addForm.period_after_opening_months, 10) : null,
          unopened_shelf_life_months: addForm.unopened_shelf_life_months ? parseInt(addForm.unopened_shelf_life_months, 10) : null,
          manufacture_date: addForm.manufacture_date || null,
          purchase_date: addForm.purchase_date || null,
          price: addForm.price ? parseFloat(addForm.price) : null,
          composite_form: addForm.is_composite ? 'other' : null,
          is_opened: addForm.is_opened || false,
          opened_date: addForm.is_opened ? (addForm.opened_date || new Date().toISOString()) : null
        }).eq('id', addForm.id);
      } else {
        const { data: inserted } = await supabase.from('items').insert([{
          brand: addForm.brand,
          name: addForm.name,
          domain: addForm.domain,
          category: addForm.category,
          container_size: addForm.container_size || null,
          texture: addForm.texture || null,
          ingredients: ingStr,
          application_zones: addForm.application_zones || [],
          is_prescription: !!addForm.is_prescription,
          prescription_details: addForm.prescription_details || null,
          risk_flags: riskFlagsStr,
          behavior_flags: bFlagsStr,
          item_type: addForm.item_type || (addForm.is_composite ? 'composite' : 'consumable'), 
          lifecycle_state: 'stocked',
          measured_potency_mg_ml: addForm.measured_potency_mg_ml || null,
          inferred_potency_mg_ml: addForm.inferred_potency_mg_ml || null,
          potency_source: addForm.potency_source || null,
          levo_material_qty: addForm.levo_material_qty || null,
          levo_temperature: addForm.levo_temperature || null,
          levo_duration: addForm.levo_duration || null,
          levo_carrier_oil: addForm.levo_carrier_oil || null,
          is_essential: addForm.is_essential || false,
          period_after_opening_months: addForm.period_after_opening_months ? parseInt(addForm.period_after_opening_months, 10) : null,
          unopened_shelf_life_months: addForm.unopened_shelf_life_months ? parseInt(addForm.unopened_shelf_life_months, 10) : null,
          manufacture_date: addForm.manufacture_date || null,
          purchase_date: addForm.purchase_date || null,
          price: addForm.price ? parseFloat(addForm.price) : null,
          composite_form: addForm.is_composite ? 'other' : null,
          is_opened: addForm.is_opened || false,
          opened_date: addForm.is_opened ? (addForm.opened_date || new Date().toISOString()) : null
        }]).select();
        if (inserted && inserted.length > 0) savedItemId = inserted[0].id;
      }
      
      if (savedItemId && addForm.is_composite) {
        await supabase.from('composite_components').delete().eq('composite_id', savedItemId);
        if (addForm.selectedComponents?.length > 0) {
          const links = addForm.selectedComponents.map(comp => ({
            composite_id: savedItemId,
            component_id: comp.id,
            proportion: comp.proportion.trim()
          }));
          await supabase.from('composite_components').insert(links);
        }
      }
    } catch (err) {
      console.error("AI Analysis failed", err);
      // Fallback
      let savedItemId = addForm.id;
      if (addForm.id) {
        await supabase.from('items').update({
          brand: addForm.brand,
          name: addForm.name,
          domain: addForm.domain,
          category: addForm.category,
          application_zones: addForm.application_zones || [],
          is_prescription: !!addForm.is_prescription,
          prescription_details: addForm.prescription_details || null,
          item_type: addForm.item_type || (addForm.is_composite ? 'composite' : 'consumable'),
          lifecycle_state: addForm.lifecycle_state || 'stocked',
          is_essential: !!addForm.is_essential,
          container_size: addForm.container_size || null,
          texture: addForm.texture || null,
          period_after_opening_months: addForm.period_after_opening_months ? parseInt(addForm.period_after_opening_months, 10) : null,
          unopened_shelf_life_months: addForm.unopened_shelf_life_months ? parseInt(addForm.unopened_shelf_life_months, 10) : null,
          manufacture_date: addForm.manufacture_date || null,
          purchase_date: addForm.purchase_date || null,
          price: addForm.price ? parseFloat(addForm.price) : null,
          composite_form: addForm.is_composite ? 'other' : null,
          is_opened: addForm.is_opened || false,
          opened_date: addForm.is_opened ? (addForm.opened_date || new Date().toISOString()) : null
        }).eq('id', addForm.id);
      } else {
        const { data: inserted } = await supabase.from('items').insert([{
          brand: addForm.brand, 
          name: addForm.name, 
          domain: addForm.domain, 
          category: addForm.category, 
          item_type: addForm.item_type || (addForm.is_composite ? 'composite' : 'consumable'),  
          lifecycle_state: 'stocked',
          container_size: addForm.container_size || null,
          texture: addForm.texture || null,
          application_zones: addForm.application_zones || [],
          is_prescription: !!addForm.is_prescription,
          prescription_details: addForm.prescription_details || null,
          is_essential: addForm.is_essential || false,
          measured_potency_mg_ml: addForm.measured_potency_mg_ml || null,
          inferred_potency_mg_ml: addForm.inferred_potency_mg_ml || null,
          potency_source: addForm.potency_source || null,
          levo_material_qty: addForm.levo_material_qty || null,
          levo_temperature: addForm.levo_temperature || null,
          levo_duration: addForm.levo_duration || null,
          levo_carrier_oil: addForm.levo_carrier_oil || null,
          period_after_opening_months: addForm.period_after_opening_months ? parseInt(addForm.period_after_opening_months, 10) : null,
          unopened_shelf_life_months: addForm.unopened_shelf_life_months ? parseInt(addForm.unopened_shelf_life_months, 10) : null,
          price: addForm.price ? parseFloat(addForm.price) : null,
          composite_form: addForm.is_composite ? 'other' : null,
          is_opened: addForm.is_opened || false,
          opened_date: addForm.is_opened ? (addForm.opened_date || new Date().toISOString()) : null
        }]).select();
        if (inserted && inserted.length > 0) savedItemId = inserted[0].id;
      }
      
      // MAPPING COMPONENTS FOR MANUAL SAVE (FALLBACK)
      if (savedItemId && addForm.is_composite) {
        await supabase.from('composite_components').delete().eq('composite_id', savedItemId);
        if (addForm.selectedComponents?.length > 0) {
          const links = addForm.selectedComponents.map(comp => ({
            composite_id: savedItemId,
            component_id: comp.id,
            proportion: comp.proportion?.trim() || 'equal'
          }));
          await supabase.from('composite_components').insert(links);
        }
      }
    }
    
    setIsSaving(false);
    setShowAddModal(false);
    setAddForm({ brand: '', name: '', domain: 'Crown', category: '', ingredients: '', weight: '5', period_after_opening_months: '', price: '', is_composite: false, is_opened: false, opened_date: '', application_zones: [], is_prescription: false, prescription_details: '', selectedComponents: [], measured_potency_mg_ml: '', inferred_potency_mg_ml: '', potency_source: '', levo_material_qty: '', levo_temperature: '', levo_duration: '', levo_carrier_oil: '' });
    setIsAutoWeight(true);
    setPhotoStatus('Offer or Scry Photo');
    setModalState('photo');
    fetchItems();
  };

  const handleBanishItem = (id, name) => {
    setBanishState({ id, name, reason: '', history: [], input: '', isTyping: false });
    handleBanishChatStart(name);
  };

  const handleBanishChatStart = async (name) => {
    setBanishState(prev => ({ ...prev, isTyping: true }));
    const { converseBanish } = await import('../lib/ai-service.js');
    const reply = await converseBanish({ name }, []);
    setBanishState(prev => {
      if (!prev) return null;
      return { ...prev, isTyping: false, history: [{ role: 'assistant', text: reply }] };
    });
  };

  const handleSendBanish = async () => {
    if (!banishState || !banishState.input.trim()) return;
    const userText = banishState.input.trim();
    
    setBanishState(prev => {
      const newHist = [...prev.history, { role: 'user', text: userText }];
      return { ...prev, history: newHist, input: '', isTyping: true };
    });
    
    const { converseBanish } = await import('../lib/ai-service.js');
    const currentHist = [...banishState.history, { role: 'user', text: userText }];
    const reply = await converseBanish({ name: banishState.name }, currentHist);
    
    const match = reply.match(/\[BANISH_REASON:\s*(.*?)\]/);
    if (match) {
      const extractedReason = match[1];
      setBanishState(prev => ({
        ...prev, 
        isTyping: false,
        reason: extractedReason,
        history: [...prev.history, { role: 'assistant', text: reply.replace(/\[BANISH_REASON:.*?\]/, '').trim() }]
      }));
    } else {
      setBanishState(prev => ({
        ...prev, 
        isTyping: false,
        history: [...prev.history, { role: 'assistant', text: reply }]
      }));
    }
  };

  const submitBanish = async () => {
    if (!banishState.reason) return;
    await supabase.from('items').update({
      lifecycle_state: 'banished',
      banish_reason: banishState.reason
    }).eq('id', banishState.id);
    setBanishState(null);
    fetchItems();
  };

  // --- MULTI-PHOTO AI IMPORT LOGIC ---
  const [reviewProducts, setReviewProducts] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);

  const handleMultiPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;
    
    setImportStatus('Divining batch of images...');
    setPendingImports([]);
    
    try {
      // Read all files as base64
      const imagePromises = files.map(file => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          resolve({
            name: file.name,
            dataUrl: dataUrl,
            base64: dataUrl.split(',')[1],
            mediaType: dataUrl.split(';')[0].split(':')[1]
          });
        };
        reader.readAsDataURL(file);
      }));
      
      const loadedImages = await Promise.all(imagePromises);
      setUploadedImages(loadedImages);
      
      const { parseBatchProductImages } = await import('../lib/ai-engine.js');
      
      // Pass to Claude Vision
      const aiProducts = await parseBatchProductImages(loadedImages.map(img => ({
        base64: img.base64,
        mediaType: img.mediaType,
        filename: img.name
      })));
      
      if (aiProducts.length > 0) {
        setReviewProducts(aiProducts);
        setImportStatus(''); // Clear status, show review modal
        setShowAddModal(false); // We show our own Review Modal now
      } else {
        setImportStatus('The Oracle found no items in these images.');
      }
      
    } catch (err) {
      console.error(err);
      setImportStatus('Error interpreting images: ' + err.message);
    }
  };

  const handleConfirmBatchImport = async (readyProducts, isComplete) => {
    // Validate the entire batch before attempting insert
    for (const p of readyProducts) {
      const isValid = await validateItemForSave(p);
      if (!isValid) return false; // Halt batch insert, return false to keep modal open
    }

    setImportStatus(`Summoning ${readyProducts.length} ready items to the Rootwork...`);
    
    if (isComplete) {
      setReviewProducts(null); // Hide modal entirely
    }
    
    const toImport = readyProducts.map(p => ({
      name: p.name || 'Unknown',
      brand: p.brand || 'Unknown',
      domain: p.domain || 'Visage',
      primary_category: p.category || null,
      item_type: p.item_type,
      lifecycle_state: 'stocked',
      price: p.price || null,
      ingredients: JSON.stringify(p.ingredients || []),
      container_size: p.container_size || null,
      texture: p.texture || null,
      application_zones: p.application_zones || [],
      period_after_opening_months: p.period_after_opening_months ? parseInt(p.period_after_opening_months, 10) : null,
      unopened_shelf_life_months: p.unopened_shelf_life_months ? parseInt(p.unopened_shelf_life_months, 10) : null,
      manufacture_date: p.manufacture_date || null,
      measured_potency_mg_ml: p.measured_potency_mg_ml || '',
      inferred_potency_mg_ml: p.inferred_potency_mg_ml || '',
      potency_source: p.potency_source || '',
      levo_material_qty: p.levo_material_qty || '',
      levo_temperature: p.levo_temperature || '',
      levo_duration: p.levo_duration || '',
      levo_carrier_oil: p.levo_carrier_oil || '',
      purchase_date: p.purchase_date || null,
      is_prescription: !!p.is_prescription,
      prescription_details: p.prescription_details || null,
      is_opened: !!p.is_opened,
      opened_date: p.is_opened ? (p.opened_date || new Date().toISOString()) : null
    }));
    
    const { error } = await supabase.from('items').insert(toImport);
    if (error) {
      setImportStatus('Error during import: ' + error.message);
    } else {
      setImportStatus(`Successfully imported ${toImport.length} items from visions!`);
      fetchItems();
      setTimeout(() => { setImportStatus(''); }, 3000);
    }
  };

  const handleAmendItem = async (item) => {
    let ingStr = '';
    try {
      if (item.ingredients) {
        const parsed = typeof item.ingredients === 'string' ? JSON.parse(item.ingredients) : item.ingredients;
        ingStr = Array.isArray(parsed) ? parsed.join(', ') : '';
      }
    } catch (e) { ingStr = ''; }
    
    let wStr = '5';
    let isAuto = true;
    try {
      if (item.behavior_flags) {
        const b = typeof item.behavior_flags === 'string' ? JSON.parse(item.behavior_flags) : item.behavior_flags;
        if (b.layering_weight) {
          wStr = String(b.layering_weight);
          isAuto = false;
        }
      }
    } catch (e) {}

    let selectedComponents = [];
    if (item.composite_form || item.item_type === 'composite') {
      const { data } = await supabase.from('composite_components').select('component_id, proportion').eq('composite_id', item.id);
      if (data) selectedComponents = data.map(d => ({ id: d.component_id, proportion: d.proportion }));
    }

    setAddForm({
      id: item.id,
      brand: item.brand || '',
      name: item.name || '',
      domain: item.domain || 'Crown',
      category: item.category || '',
      ingredients: ingStr,
      weight: wStr,
      expiration: item.period_after_opening_months ? String(item.period_after_opening_months) : '',
      price: item.price ? String(item.price) : '',
      is_essential: !!item.is_essential,
      is_composite: !!item.composite_form,
      item_type: item.item_type || 'consumable',
      selectedComponents,
      unopened_shelf_life_months: item.unopened_shelf_life_months || '',
      manufacture_date: item.manufacture_date ? item.manufacture_date.substring(0, 10) : '',
      purchase_date: item.purchase_date ? item.purchase_date.substring(0, 10) : '',
      is_opened: !!item.is_opened,
      opened_date: item.opened_date ? item.opened_date.substring(0, 10) : '',
      period_after_opening_months: item.period_after_opening_months ? String(item.period_after_opening_months) : '',
      application_zones: item.application_zones || [],
      is_prescription: !!item.is_prescription,
      prescription_details: item.prescription_details || '',
      measured_potency_mg_ml: item.measured_potency_mg_ml || '',
      inferred_potency_mg_ml: item.inferred_potency_mg_ml || '',
      potency_source: item.potency_source || '',
      levo_material_qty: item.levo_material_qty || '',
      levo_temperature: item.levo_temperature || '',
      levo_duration: item.levo_duration || '',
      levo_carrier_oil: item.levo_carrier_oil || ''
    });
    setIsAutoWeight(isAuto);
    setModalState('manual');
    setShowAddModal(true);
  };

  const renderRow = (item) => {
    let statusPill = null;
    if (item.is_expired) {
      statusPill = <span className="pill" style={{background: 'var(--alert)', color: 'white', border: 'none'}}>Expired</span>;
    } else if (item.is_waning) {
      statusPill = <span className="pill eb" style={{borderColor: 'var(--plum)', color: 'var(--plum)'}}>Waning</span>;
    } else if (item.lifecycle_state === 'ebbing') {
      statusPill = <span className="pill eb">Ebbing</span>;
    } else if (item.lifecycle_state === 'hollow') {
      statusPill = <span className="pill ho">Hollow</span>;
    }
    
    return (
      <div className="row" key={item.id || item.name}>
        <div className="tg">
          <Icon name={item.glyph || G.tabRoot} />
        </div>
        <div style={{flex: 1}}>
          <div className="nm">
            {item.name} <SpeakerButton text={`${item.name}. ${item.brand || ''}. ${item.category || ''}`} /> {statusPill}
          </div>
          <div className="mt">{item.brand} &bull; {item.category}</div>
        </div>
        <div className="acts">
          <button className="btn sm" onClick={() => handleAmendItem(item)}>Transmute</button>
          <button className="btn sm g" onClick={() => handleBanishItem(item.id, item.name)}>Banish</button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="card"><div className="empty">Unearthing roots...</div></div>;
  }

  return (
    <div style={{padding: '1rem', maxWidth: '900px', margin: '0 auto'}}>
      <div className="card mb-4">
        <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>The Apothecary <SpeakerButton text="The Apothecary" /></h3>
          <div style={{ position: 'absolute', right: 0, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn plum"  onClick={() => {
              setAddForm({ brand: '', name: '', domain: 'Crown', category: '', ingredients: '', weight: '5', period_after_opening_months: '', unopened_shelf_life_months: '', manufacture_date: '', purchase_date: '', price: '', is_essential: false, is_composite: false, item_type: 'consumable', is_opened: false, opened_date: '', application_zones: [], is_prescription: false, prescription_details: '', selectedComponents: [], measured_potency_mg_ml: '', inferred_potency_mg_ml: '', potency_source: '', levo_material_qty: '', levo_temperature: '', levo_duration: '', levo_carrier_oil: '' });
              setPhotoStatus('Offer or Scry Photo');
              setModalState('photo');
              setShowAddModal(true);
            }}>+</button>
          </div>
        </div>
        <div className="mt mb-4" style={{ textAlign: 'center' }}>Your sacred elixirs and treatments.</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem'}}>
          {apothecaryActive.length > 0 ? apothecaryActive.map(renderRow) : <div className="empty">The shelves of your Apothecary stand empty.</div>}
        </div>
      </div>

      <div className="card mb-4">
        <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
        <h3 style={{ justifyContent: 'center' }}>The Reliquary <SpeakerButton text="The Reliquary" /></h3>
        <div className="mt mb-4" style={{ textAlign: 'center' }}>Your instruments of ritual and restorative tools.</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem'}}>
          {arsenal.length > 0 ? arsenal.map(renderRow) : <div className="empty">Your Reliquary contains no instruments.</div>}
        </div>
      </div>

      <div className="tome-grid mt-4" style={{ width: '100%' }}>
        <div className="tome-main-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card mb-4" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ justifyContent: 'center' }}>The Summoning Scroll <SpeakerButton text="The Summoning Scroll" /></h3>
            <div className="mt mb-4" style={{ textAlign: 'center' }}>Items needing replenishment. Non-essential items wait for batches of 5.</div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(() => {
                if (ebbing.length === 0) return <div className="mt" style={{ textAlign: 'center' }}>No active summons.</div>;
                
                const essential = ebbing.filter(i => i.is_essential);
                const nonEssential = ebbing.filter(i => !i.is_essential);
                const readyNonEssential = nonEssential.length >= 5 ? nonEssential : [];
                const pendingCount = nonEssential.length < 5 ? nonEssential.length : 0;
                
                const itemsToRender = [...essential, ...readyNonEssential];
                
                return (
                  <>
                    {itemsToRender.map(renderRow)}
                    {pendingCount > 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--dim)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '1rem', padding: '1rem', borderTop: '1px dashed var(--border)' }}>
                        {pendingCount} non-essential item{pendingCount > 1 ? 's are' : ' is'} ebbing and silently waiting for a batch of 5.
                      </div>
                    )}
                    {itemsToRender.length === 0 && pendingCount === 0 && (
                      <div className="mt" style={{ textAlign: 'center' }}>No active summons.</div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="card mb-4" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ justifyContent: 'center' }}>The Waning <SpeakerButton text="The Waning" /></h3>
            <div className="mt mb-4" style={{ textAlign: 'center' }}>Relics nearing the end of their mortal potency.</div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {waningItems.length === 0 ? <div className="mt" style={{ textAlign: 'center' }}>All relics remain potent.</div> : waningItems.map(renderRow)}
            </div>
          </div>

          <div className="card mb-4" style={{ marginBottom: 0, alignSelf: 'start', width: '100%' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ justifyContent: 'center' }}>The Silver Toll <SpeakerButton text="The Silver Toll" /></h3>
            <div className="mt mb-4" style={{ textAlign: 'center' }}>The material cost of your active rituals, tied to frequency of devotion.</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', color: 'var(--plum)' }}>
                ${(() => {
                  const { amItems, pmItems } = buildBaseRoutines(items, {}, {});
                  const activeIds = new Set([...amItems.map(i=>i.id), ...pmItems.map(i=>i.id)]);
                  const activeItems = items.filter(i => activeIds.has(i.id));
                  
                  let totalMonthly = 0;
                  activeItems.forEach(item => {
                    if (item.price && item.period_after_opening_months) {
                      const price = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
                      const months = parseInt(item.period_after_opening_months, 10) || 1;
                      let usesPerWeek = 7;
                      try {
                        if (item.behavior_flags) {
                          const b = typeof item.behavior_flags === 'string' ? JSON.parse(item.behavior_flags) : item.behavior_flags;
                          if (typeof b.uses_per_week === 'number') {
                            usesPerWeek = b.uses_per_week;
                          } else {
                             usesPerWeek = item.category?.toLowerCase().includes('mask') ? (item.category?.toLowerCase().includes('rinse') ? 2 : 5) : 7;
                          }
                        } else {
                           usesPerWeek = item.category?.toLowerCase().includes('mask') ? (item.category?.toLowerCase().includes('rinse') ? 2 : 5) : 7;
                        }
                      } catch(e) {
                        usesPerWeek = item.category?.toLowerCase().includes('mask') ? (item.category?.toLowerCase().includes('rinse') ? 2 : 5) : 7;
                      }
                      const usageFactor = usesPerWeek / 7;
                      totalMonthly += (price / months) * usageFactor;
                    }
                  });
                  return totalMonthly.toFixed(2);
                })()}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card mb-4" style={{ marginBottom: 0, width: '100%' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ justifyContent: 'center' }}>The Echo <SpeakerButton text="The Echo" /></h3>
            <div className="mt mb-4" style={{ textAlign: 'center' }}>Reveal the hidden nature of a formula.</div>
            
            <div className="field" style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label>Divine by Visage</label>
              <div style={{position: 'relative', overflow: 'hidden', background: 'var(--card2)', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.8rem', color: 'var(--plum)', cursor: 'pointer', borderRadius: '8px', width: '200px'}}>
                <Icon name={G.tabPool} /> 
                <span style={{marginTop: '0.5rem', textAlign: 'center', fontSize: '0.9rem'}}>Offer an image</span>
                <input type="file" accept="image/*" capture="environment" style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'}} onChange={handleEchoPhotoUpload} />
              </div>
            </div>

            <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ width: '100%' }}>
                <VoiceInput 
                  isTextArea={true}
                  placeholder="Or provide the formula's true name..."
                  value={echoInput}
                  onChange={(e) => setEchoInput(e.target.value)}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--plum)', fontSize: '1.1rem' }}
                />
              </div>
              <button className="btn plum" onClick={handleEchoScry} style={{ minWidth: '120px' }}>Divine</button>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '1rem', color: 'var(--plum)', minHeight: '1rem', textAlign: 'center' }}>
              {echoStatus}
            </div>
            <div style={{ marginTop: '1rem', fontSize: '1.1rem', lineHeight: 1.5, color: 'var(--plum)', whiteSpace: 'pre-wrap' }}>
              {echoResult}
            </div>
          </div>
        </div>
      </div>


      {showAddModal && (
        <div className="modal" style={{display: 'block'}}>
          <div className="modal-content card" style={{maxWidth: '500px'}}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div>
                <h3 style={{color: 'var(--plum)'}}>The Relic Inscription</h3>
                <div className="mt mb-4" style={{color: 'var(--plum)'}}>Summon a new artifact to your Reliquary or vessel to the Apothecary.</div>
              </div>
              {modalState !== 'manual' && (
                <button className="btn sm" style={{whiteSpace: 'nowrap', flexShrink: 0}} onClick={() => setModalState('manual')} title="Manual Inscription">
                  Summon by Hand
                </button>
              )}
            </div>

            {modalState === 'photo' && (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div style={{position: 'relative', overflow: 'hidden', background: 'var(--card2)', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: 'var(--plum)', cursor: 'pointer', borderRadius: '8px'}}>
                  <Icon name="ph-images" />
                  <span style={{marginTop: '1rem', textAlign: 'center'}}>Summon Multiple Visions</span>
                  <input type="file" accept="image/*" multiple style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'}} onChange={handleMultiPhotoUpload} />
                </div>

                {importStatus && (
                  <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '4px', textAlign: 'center', color: 'var(--plum)' }}>
                    {importStatus}
                  </div>
                )}

                <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '1rem'}}>
                  <button className="btn" onClick={() => setShowAddModal(false)}>Abandon</button>
                </div>
              </div>
            )}

            {modalState === 'confirm' && (
              <div style={{textAlign: 'center', padding: '1rem'}}>
                <div style={{color: 'var(--plum)', marginBottom: '1rem'}}>I divined:</div>
                <h2 style={{color: 'var(--plum)', marginBottom: '0.5rem'}}>
                  {addForm.brand ? `${addForm.brand} ` : ''}{addForm.name}
                </h2>
                <div style={{color: 'var(--dim)', marginBottom: '2rem'}}>{addForm.category}</div>
                
                <div style={{display: 'flex', justifyContent: 'center', gap: '1rem'}}>
                  <button className="btn" onClick={() => setModalState('photo')}>Reject Vision</button>
                  <button className="btn plum" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Summoning...' : 'Summon'}
                  </button>
                </div>
              </div>
            )}

            {modalState === 'manual' && (
              <>
                <div className="field">
                  <label style={{color: 'var(--plum)'}}>Divine by Visage (Optional)</label>
                  <div style={{position: 'relative', overflow: 'hidden', background: 'var(--card2)', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', color: 'var(--plum)', cursor: 'pointer'}}>
                    <Icon name={G.tabPool} /> 
                    <span style={{marginTop: '0.5rem', textAlign: 'center'}}>{photoStatus}</span>
                    <input type="file" accept="image/*" capture="environment" style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'}} onChange={handlePhotoUpload} />
                  </div>
                </div>

                <div className="field">
                  <label style={{color: 'var(--plum)'}}>Lineage or House (Optional)</label>
                  <VoiceInput value={addForm.brand} onChange={e => setAddForm({...addForm, brand: e.target.value})} />
                </div>
                
                <div className="field">
                  <label style={{color: 'var(--plum)'}}>Name of the Relic</label>
                  <VoiceInput value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} />
                </div>

                <div className="field">
                  <label style={{color: 'var(--plum)'}}>Item Type</label>
                  <select value={addForm.item_type || (addForm.is_composite ? 'composite' : 'consumable')} onChange={e => setAddForm({...addForm, item_type: e.target.value, is_composite: e.target.value === 'composite'})} style={{color: 'var(--plum)'}}>
                    <option value="consumable">Consumable (Product)</option>
                    <option value="arsenal">Arsenal (Tool/Device)</option>
                    <option value="composite">Composite (Custom Mix)</option>
                  </select>
                </div>

                <div className="field">
                  <label style={{color: 'var(--plum)'}}>Period After Opening (Months)</label>
                  <input type="number" min="1" placeholder="e.g. 12" value={addForm.period_after_opening_months} onChange={e => setAddForm({...addForm, period_after_opening_months: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                </div>
                
                <div className="field">
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--plum)', cursor: 'pointer'}}>
                    <input type="checkbox" checked={addForm.is_opened} onChange={e => setAddForm({...addForm, is_opened: e.target.checked})} style={{accentColor: 'var(--plum)'}} />
                    Break the Seal (Item is Opened)
                  </label>
                  {addForm.is_opened && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <label style={{color: 'var(--dim)', fontSize: '0.9rem'}}>Date Opened (Backdatable)</label>
                      <input type="date" value={addForm.opened_date} onChange={e => setAddForm({...addForm, opened_date: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px', marginTop: '0.3rem' }} />
                    </div>
                  )}
                </div>

                <div className="field">
                  <label style={{color: 'var(--plum)'}}>Anatomical Realm</label>
                  <select value={addForm.domain} onChange={e => setAddForm({...addForm, domain: e.target.value})} style={{color: 'var(--plum)'}}>
                    <option value="Crown">Crown (Hair & Scalp)</option>
                    <option value="Visage">Visage (Face)</option>
                    <option value="Gaze">Gaze (Eyes)</option>
                    <option value="Grin">Grin (Mouth & Teeth)</option>
                    <option value="Vessel">Vessel (Body)</option>
                    <option value="Veil">Veil (Makeup & Color Cosmetics)</option>
                    <option value="Steeping">Steeping (Infusion & Decarb)</option>
                  </select>
                </div>

                {addForm.domain !== 'Steeping' && (
                  <div className="field">
                    <label style={{color: 'var(--plum)'}}>Application Zones (Required)</label>
                    <VoiceInput placeholder="e.g. oral, visage, entire body" value={(addForm.application_zones || []).join(', ')} onChange={e => setAddForm({...addForm, application_zones: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
                  </div>
                )}

                <div className="field" style={{background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--plum)', cursor: 'pointer', marginBottom: addForm.is_prescription ? '1rem' : '0'}}>
                    <input type="checkbox" checked={addForm.is_prescription} onChange={e => setAddForm({...addForm, is_prescription: e.target.checked})} style={{accentColor: 'var(--plum)'}} />
                    Pharmacy Prescription (Rx)
                  </label>
                  {addForm.is_prescription && (
                    <VoiceInput isTextArea={true} placeholder="Prescription details, strength, and instructions..." value={addForm.prescription_details} onChange={e => setAddForm({...addForm, prescription_details: e.target.value})} />
                  )}
                </div>

                {addForm.domain === 'Steeping' && (
                  <>
                    <div className="field">
                      <label style={{color: 'var(--plum)'}}>Measured Potency (mg/ml, tCheck)</label>
                      <input type="number" step="0.01" value={addForm.measured_potency_mg_ml} onChange={e => setAddForm({...addForm, measured_potency_mg_ml: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                    </div>
                    <div className="field">
                      <label style={{color: 'var(--plum)'}}>Inferred Potency (mg/ml, Calculated)</label>
                      <input type="number" step="0.01" value={addForm.inferred_potency_mg_ml} onChange={e => setAddForm({...addForm, inferred_potency_mg_ml: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                    </div>
                    <div className="field">
                      <label style={{color: 'var(--plum)'}}>Potency Source</label>
                      <select value={addForm.potency_source} onChange={e => setAddForm({...addForm, potency_source: e.target.value})} style={{color: 'var(--plum)'}}>
                        <option value="">None</option>
                        <option value="measured">Measured</option>
                        <option value="inferred">Inferred</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div className="field" style={{ flex: 1 }}>
                        <label style={{color: 'var(--plum)'}}>LEVO Material (g)</label>
                        <input type="number" step="0.1" value={addForm.levo_material_qty} onChange={e => setAddForm({...addForm, levo_material_qty: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label style={{color: 'var(--plum)'}}>LEVO Temp (°F)</label>
                        <input type="number" step="1" value={addForm.levo_temperature} onChange={e => setAddForm({...addForm, levo_temperature: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label style={{color: 'var(--plum)'}}>LEVO Duration (m)</label>
                        <input type="number" step="1" value={addForm.levo_duration} onChange={e => setAddForm({...addForm, levo_duration: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <div className="field">
                      <label style={{color: 'var(--plum)'}}>LEVO Carrier Oil</label>
                      <input type="text" placeholder="e.g. MCT, Olive, Ghee" value={addForm.levo_carrier_oil} onChange={e => setAddForm({...addForm, levo_carrier_oil: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                    </div>
                  </>
                )}
                
                <div className="field">
                  <label style={{color: 'var(--plum)'}}>Elixir Classification</label>
                  <VoiceInput placeholder="e.g. Purifier, Tincture, Veil" value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})} />
                </div>

                <div className="field">
                  <label style={{color: 'var(--plum)'}}>Botanical Components & Herbs</label>
                  <VoiceInput isTextArea={true} placeholder="Transcribe the sacred components..." value={addForm.ingredients} onChange={e => setAddForm({...addForm, ingredients: e.target.value})} />
                </div>

                <div className="field">
                  <label style={{color: 'var(--plum)'}}>Material Offering (For The Silver Toll)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={addForm.price} onChange={e => setAddForm({...addForm, price: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label style={{color: 'var(--plum)'}}>Manufacture Date</label>
                    <input type="date" value={addForm.manufacture_date} onChange={e => setAddForm({...addForm, manufacture_date: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label style={{color: 'var(--plum)'}}>Purchase Date</label>
                    <input type="date" value={addForm.purchase_date} onChange={e => setAddForm({...addForm, purchase_date: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                  </div>
                </div>

                <div className="field">
                  <label style={{color: 'var(--plum)'}}>Unopened Shelf Life (Months)</label>
                  <input type="number" placeholder="e.g. 36" value={addForm.unopened_shelf_life_months} onChange={e => setAddForm({...addForm, unopened_shelf_life_months: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                </div>

                <div className="field">
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--plum)', cursor: 'pointer'}}>
                    <input type="checkbox" checked={addForm.is_essential} onChange={e => setAddForm({...addForm, is_essential: e.target.checked})} style={{accentColor: 'var(--plum)'}} />
                    Mark as Essential (Alert immediately when ebbing)
                  </label>
                </div>

                <div className="field">
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--plum)', cursor: 'pointer'}}>
                    <input type="checkbox" checked={addForm.is_composite} onChange={e => setAddForm({...addForm, is_composite: e.target.checked})} style={{accentColor: 'var(--plum)'}} />
                    This is a Composite Brew / Handmade Alchemy
                  </label>
                </div>

                {addForm.is_composite && (
                  <div className="field">
                    <label style={{color: 'var(--plum)'}}>Base Elements & Proportions</label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(0,0,0,0.2)' }}>
                      {items.filter(i => i.id !== addForm.id && i.item_type !== 'tool').map(i => {
                        const isChecked = addForm.selectedComponents?.some(c => c.id === i.id);
                        const compData = addForm.selectedComponents?.find(c => c.id === i.id) || { id: i.id, proportion: '' };
                        return (
                          <div key={i.id} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--plum)', cursor: 'pointer', flex: 1}}>
                              <input 
                                type="checkbox" 
                                style={{accentColor: 'var(--plum)'}}
                                checked={isChecked}
                                onChange={(e) => {
                                   let newComps = [...(addForm.selectedComponents || [])];
                                   if (e.target.checked) {
                                     newComps.push({ id: i.id, proportion: '' });
                                   } else {
                                     newComps = newComps.filter(c => c.id !== i.id);
                                   }
                                   setAddForm({...addForm, selectedComponents: newComps});
                                }}
                              />
                              {i.name}
                            </label>
                            {isChecked && (
                              <input 
                                type="text" 
                                placeholder="e.g. 2 parts, 50%, 10ml" 
                                value={compData.proportion}
                                onChange={(e) => {
                                  const newComps = addForm.selectedComponents.map(c => 
                                    c.id === i.id ? { ...c, proportion: e.target.value } : c
                                  );
                                  setAddForm({...addForm, selectedComponents: newComps});
                                }}
                                style={{ width: '120px', padding: '0.2rem 0.5rem', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px', fontSize: '0.8rem' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {addForm.domain !== 'Steeping' && (
                  <div className="field">
                    <label style={{color: 'var(--plum)'}}>Aetheric Density (1=Fleeting, 10=Anchoring) - Override</label>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--plum)'}}>
                      <input type="range" min="1" max="10" step="1" style={{flex: 1}} value={addForm.weight} onChange={e => { setAddForm({...addForm, weight: e.target.value}); setIsAutoWeight(false); }} />
                      <span style={{width: '20px', textAlign: 'center'}}>{isAutoWeight ? 'Auto' : addForm.weight}</span>
                    </div>
                  </div>
                )}
                
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem'}}>
                  <button className="btn" onClick={() => setShowAddModal(false)}>Abandon</button>
                  <button className="btn plum" onClick={handleSave} disabled={isSaving || !addForm.name}>
                    {isSaving ? 'Summoning...' : 'Summon'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {banishState && (
        <div className="modal" style={{display: 'block'}}>
          <div className="modal-content card" style={{maxWidth: '500px'}}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{color: 'var(--plum)'}}>The Banishment of {banishState.name} <SpeakerButton text={`The Banishment of ${banishState.name}`} /></h3>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', marginTop: '1rem', paddingRight: '0.5rem' }}>
              {banishState.history.map((msg, idx) => (
                <div key={idx} style={{ 
                  textAlign: msg.role === 'user' ? 'right' : 'left', 
                  marginBottom: '1rem',
                  color: msg.role === 'user' ? 'var(--text)' : 'var(--plum)'
                }}>
                  <div style={{ display: 'inline-block', background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'transparent', padding: msg.role === 'user' ? '0.5rem 1rem' : '0', borderRadius: '8px' }}>
                    {msg.text} {msg.role === 'assistant' && <SpeakerButton text={msg.text} style={{marginLeft: '0.4rem'}} />}
                  </div>
                </div>
              ))}
              {banishState.isTyping && <div style={{ color: 'var(--dim)', fontStyle: 'italic' }}>The Keeper is listening...</div>}
            </div>

            {!banishState.reason ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <VoiceInput 
                    isTextArea={true}
                    placeholder="Speak your reason..."
                    value={banishState.input}
                    onChange={(e) => setBanishState({...banishState, input: e.target.value})}
                    style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--plum)', fontSize: '1rem', minHeight: '60px' }}
                  />
                </div>
                <button className="btn plum" onClick={handleSendBanish} disabled={banishState.isTyping || !banishState.input.trim()}>Reply</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--plum)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                  Reason sealed: <strong>{banishState.reason}</strong>
                </div>
                <button className="btn plum" onClick={submitBanish} style={{ width: '100%' }}>Seal in the Crypt</button>
              </div>
            )}

            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem'}}>
              <button className="btn" onClick={() => setBanishState(null)}>Abandon Banishment</button>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-PHOTO REVIEW MODAL */}
      {reviewProducts && (
        <MultiPhotoReview 
          initialProducts={reviewProducts}
          imageFiles={uploadedImages}
          onConfirm={handleConfirmBatchImport}
          onCancel={() => { setReviewProducts(null); setUploadedImages([]); }}
        />
      )}
      
      {/* GLOBAL TOAST/STATUS for Import — shown if the user closes the modal while processing continues */}
      {!showAddModal && importStatus && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--card)', border: '1px solid var(--plum)', padding: '1rem', borderRadius: '8px', zIndex: 1000, color: 'var(--plum)' }}>
          {importStatus}
        </div>
      )}
    </div>
  );
}
