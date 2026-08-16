import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import MultiPhotoReview from '../components/MultiPhotoReview.jsx';
import { G } from '../lib/icons.jsx';
import Icon from '../components/Icon.jsx';
import VoiceInput from '../components/VoiceInput.jsx';
import { useDialog } from '../components/Dialogs.jsx';
import { attachVoice } from '../lib/voice.js';
import { buildBaseRoutines, isShadowTomeItem } from '../lib/routine-engine.js';
import SpeakerButton from '../components/SpeakerButton.jsx';

export default function Rootwork({ pose }) {
  const { alert, confirm, confirmDestructive } = useDialog();
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
  // Phase 4 wizard state
  const [manualStep, setManualStep] = useState('seed'); // 'seed' | 'searching' | 'candidates' | 'confirm'
  const [aiCandidates, setAiCandidates] = useState([]);
  const [seedForm, setSeedForm] = useState({ brand: '', name: '', domain: 'Crown' });
  const [showAIReview, setShowAIReview] = useState(false);

  const [profile, setProfile] = useState(null);
  const [echoInput, setEchoInput] = useState('');
  const [echoStatus, setEchoStatus] = useState('');
  const [echoResult, setEchoResult] = useState('');
  const [echoMode, setEchoMode] = useState('photo');

  const handleAILookup = async () => {
    if (!seedForm.name.trim()) return;
    setManualStep('searching');
    try {
      const { lookupProductDetails } = await import('../lib/ai-engine.js');
      const candidates = await lookupProductDetails(seedForm.brand, seedForm.name, seedForm.domain);
      setAiCandidates(candidates);
      if (candidates.length > 0) {
        setManualStep('candidates');
      } else {
        // No results at all (both OBF and Claude failed) — drop to manual confirm
        setAddForm(prev => ({ ...prev, brand: seedForm.brand, name: seedForm.name, domain: seedForm.domain }));
        setManualStep('confirm');
      }
    } catch (err) {
      console.error('AI lookup failed:', err);
      setAddForm(prev => ({ ...prev, brand: seedForm.brand, name: seedForm.name, domain: seedForm.domain }));
      setManualStep('confirm');
    }
  };

  const handleCandidateSelect = (candidate) => {
    setAddForm(prev => ({
      ...prev,
      brand: candidate.brand || seedForm.brand,
      name: candidate.name || seedForm.name,
      domain: candidate.domain || seedForm.domain, // always user's selection
      category: candidate.category || '',
      ingredients: candidate.ingredients || '',
      application_zones: candidate.application_zones || [],
      period_after_opening_months: candidate.period_after_opening_months ? String(candidate.period_after_opening_months) : '',
      unopened_shelf_life_months: candidate.unopened_shelf_life_months ? String(candidate.unopened_shelf_life_months) : '',
      item_type: candidate.item_type || 'consumable',
      is_composite: candidate.item_type === 'composite',
    }));
    setManualStep('confirm');
    setShowAIReview(false);
  };

  const resetManualWizard = () => {
    setManualStep('seed');
    setAiCandidates([]);
    setSeedForm({ brand: '', name: '', domain: 'Crown' });
    setShowAIReview(false);
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('items')
      .select('*')
      .not('domain', 'in', '("Herbal Elixirs","Measure","ShadowTome","Steeping")')
      .order('name');
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
    .filter(i => (i.item_type === 'consumable' || i.item_type === 'composite') && !['ebbing', 'hollow', 'banished'].includes(i.lifecycle_state) && !isShadowTomeItem(i))
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
  const arsenal = items.filter(i => i.item_type === 'tool' && !['ebbing', 'hollow', 'banished'].includes(i.lifecycle_state) && !isShadowTomeItem(i));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setPhotoStatus('Divining image...');
    
    try {
      const { parseProductImage, compressImage } = await import('../lib/ai-engine.js');
      const dataUrl = await compressImage(file, 2048, 0.95);
      const base64 = dataUrl.split(',')[1];
      const mime = dataUrl.split(';')[0].split(':')[1];
      
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
          domain: 'Form',
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
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;
    
    setEchoStatus(`Divining ${files.length} image(s)...`);
    setEchoResult('');
    
    try {
      const { parseProductImage, compressImage, evaluateScryingPool } = await import('../lib/ai-engine.js');
      let combinedResults = '';
      
      for (let i = 0; i < files.length; i++) {
        setEchoStatus(`Divining image ${i + 1} of ${files.length}...`);
        const file = files[i];
        const dataUrl = await compressImage(file, 2048, 0.95);
        const base64 = dataUrl.split(',')[1];
        const mime = dataUrl.split(';')[0].split(':')[1];
        
        const details = await parseProductImage(base64, mime);
        const formulaStr = `${details.brand || ''} ${details.name || ''} ${details.category || ''}`.trim();
        
        setEchoStatus(`Vision extracted for ${formulaStr}. Divining resonance...`);
        const reply = await evaluateScryingPool(formulaStr, profile?.intake_answers || {}, items, {});
        
        combinedResults += `**${formulaStr}**\n${reply}\n\n`;
        setEchoResult(combinedResults);
      }
      setEchoStatus('');
    } catch (err) {
      console.error(err);
      setEchoStatus('The vision was clouded. Offer images anew.');
    }
  };


  const validateItemForSave = async (item) => {

    // Lavender Ban Check
    const allText = `${item.name || ''} ${item.brand || ''} ${Array.isArray(item.ingredients) ? item.ingredients.join(' ') : (item.ingredients || '')}`;
    if (/(lavender|lavandula|lavandin)/i.test(allText)) {
      await alert("LAVENDER DETECTED: This item contains Lavender (or a derivative) and is permanently banned from your routine. It must be sealed in the Crypt of Ashes.");
      return false;
    }
    // 0. Type Check
    if (!item.item_type || !['consumable', 'arsenal', 'composite'].includes(item.item_type)) {
      await alert(`Safety Block: ${item.name || 'An item'} is missing its Item Type.`);
      return false;
    }

    // 1. Universal Check: Must have a Zone
    if (!item.application_zones || item.application_zones.length === 0) {
      await alert(`Safety Block: ${item.name || 'An item'} is missing its application zone.`);
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
    setBanishState({ id, name, reason: '' });
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
      const { parseBatchProductImages, compressImage } = await import('../lib/ai-engine.js');
      // Read all files as base64 using compressImage
      const imagePromises = files.map(async file => {
        const dataUrl = await compressImage(file, 1280, 0.8);
        return {
          name: file.name,
          dataUrl: dataUrl,
          base64: dataUrl.split(',')[1],
          mediaType: dataUrl.split(';')[0].split(':')[1]
        };
      });
      
      const loadedImages = await Promise.all(imagePromises);
      setUploadedImages(loadedImages);
      
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
      category: p.category || null,
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
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icon name="apothecary" /> The Apothecary <SpeakerButton text="The Apothecary" /></h3>
          <div style={{ position: 'absolute', right: 0, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn plum" onClick={() => {
              setAddForm({ brand: '', name: '', domain: 'Crown', category: '', ingredients: '', weight: '5', period_after_opening_months: '', unopened_shelf_life_months: '', manufacture_date: '', purchase_date: '', price: '', is_essential: false, is_composite: false, item_type: 'consumable', is_opened: false, opened_date: '', application_zones: [], is_prescription: false, prescription_details: '', selectedComponents: [], measured_potency_mg_ml: '', inferred_potency_mg_ml: '', potency_source: '', levo_material_qty: '', levo_temperature: '', levo_duration: '', levo_carrier_oil: '' });
              setModalState('photo');
              setShowAddModal(true);
            }}>Offer Image</button>
            <button className="btn plum" onClick={() => {
              setAddForm({ brand: '', name: '', domain: 'Crown', category: '', ingredients: '', weight: '5', period_after_opening_months: '', unopened_shelf_life_months: '', manufacture_date: '', purchase_date: '', price: '', is_essential: false, is_composite: false, item_type: 'consumable', is_opened: false, opened_date: '', application_zones: [], is_prescription: false, prescription_details: '', selectedComponents: [], measured_potency_mg_ml: '', inferred_potency_mg_ml: '', potency_source: '', levo_material_qty: '', levo_temperature: '', levo_duration: '', levo_carrier_oil: '' });
              setModalState('manual');
              setManualStep('seed');
              setShowAddModal(true);
            }}>Inscribe</button>
          </div>
        </div>
        <div className="mt mb-4" style={{ textAlign: 'center' }}>Your sacred elixirs and treatments.</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem'}}>
          {apothecaryActive.length > 0 ? apothecaryActive.map(renderRow) : <div className="empty">The shelves of your Apothecary stand empty.</div>}
        </div>
      </div>

      <div className="card mb-4">
        <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
        <h3 style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icon name="arsenal" /> The Reliquary <SpeakerButton text="The Reliquary" /></h3>
        <div className="mt mb-4" style={{ textAlign: 'center' }}>Your instruments of ritual and restorative tools.</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem'}}>
          {arsenal.length > 0 ? arsenal.map(renderRow) : <div className="empty">Your Reliquary contains no instruments.</div>}
        </div>
      </div>

      <div className="rootwork-grid mt-4" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div className="card mb-4" style={{ marginBottom: 0, width: '100%', gridColumn: '1', height: 'fit-content' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div>
                <h3 style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: 0 }}>The Echo <SpeakerButton text="The Echo" /></h3>
                <div className="mt mb-4" style={{ marginTop: '0.5rem' }}>Unveil the hidden resonance of the relic.</div>
              </div>
              <button className="btn sm" style={{whiteSpace: 'nowrap', flexShrink: 0}} onClick={() => setEchoMode(echoMode === 'photo' ? 'manual' : 'photo')} title="Toggle Method">
                {echoMode === 'photo' ? 'Summon by Hand' : 'Offer Image(s)'}
              </button>
            </div>
            
            {echoMode === 'photo' && (
              <div className="field" style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{position: 'relative', overflow: 'hidden', background: 'var(--card2)', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', color: 'var(--plum)', cursor: 'pointer', borderRadius: '8px', width: '100%', maxWidth: '300px'}}>
                  <Icon name={G.tabPool} /> 
                  <span style={{marginTop: '0.5rem', textAlign: 'center', fontSize: '0.9rem'}}>Offer Image(s)</span>
                  <input type="file" multiple accept="image/*" style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'}} onChange={handleEchoPhotoUpload} />
                </div>
              </div>
            )}

            {echoMode === 'manual' && (
              <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ width: '100%' }}>
                  <VoiceInput 
                    isTextArea={true}
                    placeholder="Speak the relic's true name..."
                    value={echoInput}
                    onChange={(e) => setEchoInput(e.target.value)}
                    style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--plum)', fontSize: '1.1rem' }}
                  />
                </div>
                <button className="btn plum" style={{ width: '100%' }} onClick={() => handleEchoScry(echoInput)} disabled={!echoInput}>
                  Divine Resonance
                </button>
              </div>
            )}
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button className="btn sm" onClick={() => setEchoMode(m => m === 'photo' ? 'manual' : 'photo')}>
                {echoMode === 'photo' ? 'Divine by Hand' : 'Offer Image'}
              </button>
            </div>

            {echoStatus && <div className="mt-2" style={{ color: 'var(--dim)', textAlign: 'center', fontStyle: 'italic' }}>{echoStatus}</div>}
            {echoResult && (
              <div style={{ marginTop: '1rem', fontSize: '1.1rem', lineHeight: 1.5, color: 'var(--plum)', whiteSpace: 'pre-wrap' }}>
                {echoResult}
              </div>
            )}
          </div>
        <div className="card mb-4" style={{ marginBottom: 0, alignSelf: 'start', width: '100%', gridColumn: '2', gridRow: '1' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ textAlign: 'center', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}><Icon name="silver-coin" /> The Silver Toll <SpeakerButton text="The Silver Toll" /></h3>
            <div className="mt mb-4" style={{ textAlign: 'center' }}>The material cost of your active rituals, tied to frequency of devotion.</div>
            {(() => {
              const DOMAINS = ['Crown', 'Visage', 'Gaze', 'Grin', 'Vessel', 'Veil'];
              const { amItems, pmItems } = buildBaseRoutines(items, profile || {}, {});
              const activeIds = new Set([...amItems.map(i => i.id), ...pmItems.map(i => i.id)]);
              const activeItems = items.filter(i => activeIds.has(i.id));

              const calcMonthly = (item) => {
                if (!item.price || !item.period_after_opening_months) return 0;
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
                return (price / months) * (usesPerWeek / 7);
              };

              const domainTotals = DOMAINS.map(domain => ({
                domain,
                total: activeItems.filter(i => i.domain === domain).reduce((sum, i) => sum + calcMonthly(i), 0)
              }));
              const grandTotal = domainTotals.reduce((sum, d) => sum + d.total, 0);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0 0.5rem' }}>
                  {domainTotals.map(({ domain, total }) => (
                    <div key={domain} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', borderRadius: '6px', background: total > 0 ? 'rgba(140,80,180,0.08)' : 'transparent' }}>
                      <span style={{ color: 'var(--dim)', fontSize: '0.9rem' }}>{domain}</span>
                      <span style={{ color: total > 0 ? 'var(--plum)' : 'var(--dim)', fontWeight: total > 0 ? 'bold' : 'normal', fontSize: '0.95rem' }}>
                        {total > 0 ? `$${total.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', color: 'var(--plum)' }}>Total / month</span>
                    <span style={{ fontSize: '1.8rem', color: 'var(--plum)', fontWeight: 'bold' }}>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="card mb-4" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', maxHeight: '500px', gridColumn: '1 / span 2', order: 99 }}>
              <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
              <h3 style={{ justifyContent: 'center', color: 'var(--alert)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icon name="ph-trash" style={{color: 'var(--alert)'}} /> The Crypt of Ashes <SpeakerButton text="The Crypt of Ashes" /></h3>
            <div className="mt mb-4" style={{ textAlign: 'center' }}>Banished Relics (The Forgotten-Word Path).</div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {banished.length === 0 ? <div className="mt" style={{ textAlign: 'center' }}>The crypt is empty.</div> : banished.map(item => (
                <div className="row" key={item.id || item.name}>
                  <div className="tg"><Icon name={item.glyph || G.tabRoot} /></div>
                  <div style={{flex: 1}}>
                    <div className="nm" style={{ color: 'var(--dim)' }}>{item.name}</div>
                    <div className="mt" style={{ fontStyle: 'italic' }}>Banished: {item.banish_reason || 'Unknown'}</div>
                  </div>
                  <div className="acts">
                    <button className="btn sm plum" onClick={async () => {
                      await supabase.from('items').update({ lifecycle_state: 'stocked', banish_reason: null }).eq('id', item.id);
                      fetchItems();
                    }}>Restore</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        <div className="card mb-4" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', maxHeight: '500px', gridColumn: '1', gridRow: '2' }}>
              <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
              <h3 style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icon name="ph-scroll" /> The Summoning Scroll <SpeakerButton text="The Summoning Scroll" /></h3>
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
        <div className="card mb-4" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', maxHeight: '500px', gridColumn: '2', gridRow: '2' }}>
              <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
              <h3 style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icon name="waning" /> The Waning <SpeakerButton text="The Waning" /></h3>
            <div className="mt mb-4" style={{ textAlign: 'center' }}>Relics nearing the end of their mortal potency.</div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {waningItems.length === 0 ? <div className="mt" style={{ textAlign: 'center' }}>All relics remain potent.</div> : waningItems.map(renderRow)}
            </div>
          </div>
      </div>

      {showAddModal && (
        <div className="modal">
          <div className="modal-content card" style={{maxWidth: '500px'}}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div>
                <h3 style={{color: 'var(--plum)'}}>The Relic Inscription</h3>
                <div className="mt mb-4" style={{color: 'var(--plum)'}}>Summon a new artifact to your Reliquary or potion to the Apothecary.</div>
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
                {/* ── STEP 1: Seed ──────────────────────────────────────────── */}
                {manualStep === 'seed' && (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--dim)', marginTop: '-0.5rem' }}>
                        Name your relic and the Codex will divine the rest.
                      </div>
                    </div>

                    <div className="field">
                      <label style={{color: 'var(--plum)'}}>Sacred Domain</label>
                      <select
                        value={seedForm.domain}
                        onChange={e => setSeedForm({...seedForm, domain: e.target.value})}
                        style={{color: 'var(--plum)'}}
                      >
                        <option value="Crown">Crown (Hair &amp; Scalp)</option>
                        <option value="Visage">Visage (Face)</option>
                        <option value="Gaze">Gaze (Eyes)</option>
                        <option value="Grin">Grin (Mouth &amp; Teeth)</option>
                        <option value="Form">Form (Body)</option>
                        <option value="Veil">Veil (Makeup &amp; Color Cosmetics)</option>
                        <option value="Steeping">Steeping (Infusion &amp; Decarb Oils)</option>
                      </select>
                    </div>

                    <div className="field">
                      <label style={{color: 'var(--plum)'}}>Lineage or House (Brand)</label>
                      <VoiceInput
                        placeholder=""
                        value={seedForm.brand}
                        onChange={e => setSeedForm({...seedForm, brand: e.target.value})}
                      />
                    </div>

                    <div className="field">
                      <label style={{color: 'var(--plum)'}}>Name of the Relic</label>
                      <VoiceInput
                        placeholder=""
                        value={seedForm.name}
                        onChange={e => setSeedForm({...seedForm, name: e.target.value})}
                      />
                    </div>

                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem'}}>
                      <button className="btn" onClick={() => { setShowAddModal(false); resetManualWizard(); }}>Abandon</button>
                      <button
                        className="btn plum"
                        onClick={handleAILookup}
                        disabled={!seedForm.name.trim()}
                      >
                        <Icon name="ph-sparkle" /> Seek in the Codex
                      </button>
                    </div>
                  </>
                )}

                {/* ── SEARCHING spinner ─────────────────────────────────────── */}
                {manualStep === 'searching' && (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--plum)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>✦</div>
                    <div>Consulting the Codex…</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--dim)', marginTop: '0.5rem' }}>Searching Open Beauty Facts and divining with Claude</div>
                  </div>
                )}

                {/* ── STEP 2: Candidates ────────────────────────────────────── */}
                {manualStep === 'candidates' && (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--dim)' }}>
                        The Codex found {aiCandidates.length} match{aiCandidates.length !== 1 ? 'es' : ''} — select the true relic.
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.3rem' }}>
                      {aiCandidates.map((candidate, idx) => (
                        <div key={candidate.id || idx} style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          padding: '0.9rem',
                          display: 'flex',
                          gap: '0.8rem',
                          alignItems: 'flex-start'
                        }}>
                          {/* Thumbnail */}
                          {candidate.image ? (
                            <img
                              src={candidate.image}
                              alt={candidate.name}
                              style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, background: 'rgba(0,0,0,0.3)' }}
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{ width: '56px', height: '56px', borderRadius: '6px', background: 'rgba(176,136,204,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Icon name="ph-flask" />
                            </div>
                          )}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--plum)' }}>{candidate.name}</span>
                              <span style={{
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                background: candidate.source === 'ai' ? 'rgba(176,136,204,0.2)' : 'rgba(100,200,150,0.15)',
                                color: candidate.source === 'ai' ? 'var(--plum)' : '#7ec8a0',
                                border: `1px solid ${candidate.source === 'ai' ? 'var(--plum)' : '#7ec8a0'}`,
                                flexShrink: 0
                              }}>
                                {candidate.source === 'ai' ? '✦ AI' : 'OBF'}
                              </span>
                            </div>
                            {candidate.brand && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--dim)', marginBottom: '0.3rem' }}>{candidate.brand}</div>
                            )}
                            {candidate.ingredients && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--dim)', lineHeight: 1.4 }}>
                                {candidate.ingredients.substring(0, 100)}{candidate.ingredients.length > 100 ? '…' : ''}
                              </div>
                            )}
                          </div>

                          <button
                            className="btn plum"
                            style={{ flexShrink: 0, padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                            onClick={() => handleCandidateSelect(candidate)}
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                      <button className="btn" onClick={() => setManualStep('seed')}>← Back</button>
                      <button
                        className="btn"
                        style={{ fontSize: '0.8rem', borderColor: 'var(--dim)', color: 'var(--dim)' }}
                        onClick={() => {
                          setAddForm(prev => ({ ...prev, brand: seedForm.brand, name: seedForm.name, domain: seedForm.domain }));
                          setManualStep('confirm');
                          setShowAIReview(false);
                        }}
                      >
                        None match — fill manually
                      </button>
                    </div>
                  </>
                )}

                {/* ── STEP 3: Confirm ───────────────────────────────────────── */}
                {manualStep === 'confirm' && (
                  <>
                    {/* USER-ONLY FIELDS — always visible */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--dim)', textAlign: 'center', marginBottom: '1rem' }}>
                        The Codex has filled what it knows. Complete the rest, then summon.
                      </div>
                    </div>

                    <div className="field">
                      <label style={{color: 'var(--plum)'}}>Material Offering (Price)</label>
                      <input type="number" step="0.01" placeholder="0.00" value={addForm.price}
                        onChange={e => setAddForm({...addForm, price: e.target.value})}
                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div className="field" style={{ flex: 1 }}>
                        <label style={{color: 'var(--plum)'}}>Purchase Date</label>
                        <input type="date" value={addForm.purchase_date}
                          onChange={e => setAddForm({...addForm, purchase_date: e.target.value})}
                          style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label style={{color: 'var(--plum)'}}>Manufacture Date</label>
                        <input type="date" value={addForm.manufacture_date}
                          onChange={e => setAddForm({...addForm, manufacture_date: e.target.value})}
                          style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                      </div>
                    </div>

                    <div className="field">
                      <label style={{color: 'var(--plum)'}}>Period After Opening (Months)</label>
                      <input type="number" min="1"
                        placeholder={addForm.period_after_opening_months ? `AI suggests: ${addForm.period_after_opening_months}` : '12'}
                        value={addForm.period_after_opening_months}
                        onChange={e => setAddForm({...addForm, period_after_opening_months: e.target.value})}
                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                    </div>

                    <div className="field">
                      <label style={{color: 'var(--plum)'}}>Unopened Shelf Life (Months)</label>
                      <input type="number"
                        placeholder={addForm.unopened_shelf_life_months ? `AI suggests: ${addForm.unopened_shelf_life_months}` : '36'}
                        value={addForm.unopened_shelf_life_months}
                        onChange={e => setAddForm({...addForm, unopened_shelf_life_months: e.target.value})}
                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                    </div>

                    <div className="field">
                      <label style={{display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--plum)', cursor: 'pointer'}}>
                        <input type="checkbox" checked={addForm.is_opened} style={{ marginTop: '0.2rem', accentColor: 'var(--plum)' }}
                          onChange={e => setAddForm({...addForm, is_opened: e.target.checked})} />
                        <span>Break the Seal (Item is Opened)</span>
                      </label>
                      {addForm.is_opened && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <input type="date" value={addForm.opened_date}
                            onChange={e => setAddForm({...addForm, opened_date: e.target.value})}
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px', marginTop: '0.3rem' }} />
                        </div>
                      )}
                    </div>

                    <div className="field">
                      <label style={{display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--plum)', cursor: 'pointer'}}>
                        <input type="checkbox" checked={addForm.is_essential} style={{ marginTop: '0.2rem', accentColor: 'var(--plum)' }}
                          onChange={e => setAddForm({...addForm, is_essential: e.target.checked})} />
                        <span>Mark as Essential (Alert immediately when ebbing)</span>
                      </label>
                    </div>

                    <div className="field">
                      <label style={{display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--plum)', cursor: 'pointer'}}>
                        <input type="checkbox" checked={addForm.is_composite} style={{ marginTop: '0.2rem', accentColor: 'var(--plum)' }}
                          onChange={e => setAddForm({...addForm, is_composite: e.target.checked, item_type: e.target.checked ? 'composite' : 'consumable'})} />
                        <span>This is a Composite Brew / Handmade Alchemy</span>
                      </label>
                    </div>

                    {addForm.is_composite && (
                      <div className="field">
                        <label style={{color: 'var(--plum)'}}>Base Elements &amp; Proportions</label>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(0,0,0,0.2)' }}>
                          {items.filter(i => i.id !== addForm.id && i.item_type !== 'tool').map(i => {
                            const isChecked = addForm.selectedComponents?.some(c => c.id === i.id);
                            const compData = addForm.selectedComponents?.find(c => c.id === i.id) || { id: i.id, proportion: '' };
                            return (
                              <div key={i.id} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--plum)', cursor: 'pointer', flex: 1}}>
                                  <input type="checkbox" style={{accentColor: 'var(--plum)'}} checked={isChecked}
                                    onChange={(e) => {
                                      let newComps = [...(addForm.selectedComponents || [])];
                                      if (e.target.checked) { newComps.push({ id: i.id, proportion: '' }); }
                                      else { newComps = newComps.filter(c => c.id !== i.id); }
                                      setAddForm({...addForm, selectedComponents: newComps});
                                    }}
                                  />
                                  {i.name}
                                </label>
                                {isChecked && (
                                  <input type="text" placeholder="" value={compData.proportion}
                                    onChange={(e) => {
                                      const newComps = addForm.selectedComponents.map(c => c.id === i.id ? { ...c, proportion: e.target.value } : c);
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

                    {/* Steeping-specific LEVO fields */}
                    {addForm.domain === 'Steeping' && (
                      <>
                        <div className="field">
                          <label style={{color: 'var(--plum)'}}>Measured Potency (mg/ml, tCheck)</label>
                          <input type="number" step="0.01" value={addForm.measured_potency_mg_ml}
                            onChange={e => setAddForm({...addForm, measured_potency_mg_ml: e.target.value})}
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div className="field" style={{ flex: 1 }}>
                            <label style={{color: 'var(--plum)'}}>LEVO Material (g)</label>
                            <input type="number" step="0.1" value={addForm.levo_material_qty}
                              onChange={e => setAddForm({...addForm, levo_material_qty: e.target.value})}
                              style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                          </div>
                          <div className="field" style={{ flex: 1 }}>
                            <label style={{color: 'var(--plum)'}}>LEVO Temp (°F)</label>
                            <input type="number" step="1" value={addForm.levo_temperature}
                              onChange={e => setAddForm({...addForm, levo_temperature: e.target.value})}
                              style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                          </div>
                          <div className="field" style={{ flex: 1 }}>
                            <label style={{color: 'var(--plum)'}}>LEVO Duration (m)</label>
                            <input type="number" step="1" value={addForm.levo_duration}
                              onChange={e => setAddForm({...addForm, levo_duration: e.target.value})}
                              style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                          </div>
                        </div>
                        <div className="field">
                          <label style={{color: 'var(--plum)'}}>LEVO Carrier Oil</label>
                          <input type="text" placeholder="" value={addForm.levo_carrier_oil}
                            onChange={e => setAddForm({...addForm, levo_carrier_oil: e.target.value})}
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', borderRadius: '4px' }} />
                        </div>
                      </>
                    )}

                    <div className="field" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <label style={{display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--plum)', cursor: 'pointer', marginBottom: addForm.is_prescription ? '1rem' : '0'}}>
                        <input type="checkbox" checked={addForm.is_prescription} style={{ marginTop: '0.2rem', accentColor: 'var(--plum)' }}
                          onChange={e => setAddForm({...addForm, is_prescription: e.target.checked})} />
                        <span>Pharmacy Prescription (Rx)</span>
                      </label>
                      {addForm.is_prescription && (
                        <VoiceInput isTextArea={true} placeholder="Prescription details, strength, and instructions..."
                          value={addForm.prescription_details}
                          onChange={e => setAddForm({...addForm, prescription_details: e.target.value})} />
                      )}
                    </div>

                    {/* COLLAPSIBLE: Review AI-filled fields */}
                    <div style={{ marginTop: '1.5rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                      <button
                        className="btn"
                        style={{ width: '100%', borderRadius: '0', border: 'none', background: 'rgba(176,136,204,0.08)', justifyContent: 'space-between', padding: '0.8rem 1rem' }}
                        onClick={() => setShowAIReview(v => !v)}
                      >
                        <span>✦ Review the Codex's Fills</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--dim)' }}>{showAIReview ? '▲ collapse' : '▼ expand'}</span>
                      </button>

                      {showAIReview && (
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                          <div className="field" style={{ margin: 0 }}>
                            <label style={{color: 'var(--plum)'}}>Lineage or House (Brand)</label>
                            <VoiceInput value={addForm.brand} onChange={e => setAddForm({...addForm, brand: e.target.value})} />
                          </div>
                          <div className="field" style={{ margin: 0 }}>
                            <label style={{color: 'var(--plum)'}}>Name of the Relic</label>
                            <VoiceInput value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} />
                          </div>
                          <div className="field" style={{ margin: 0 }}>
                            <label style={{color: 'var(--plum)'}}>Sacred Domain</label>
                            <select value={addForm.domain} onChange={e => setAddForm({...addForm, domain: e.target.value})} style={{color: 'var(--plum)'}}>
                              <option value="Crown">Crown (Hair &amp; Scalp)</option>
                              <option value="Visage">Visage (Face)</option>
                              <option value="Gaze">Gaze (Eyes)</option>
                              <option value="Grin">Grin (Mouth &amp; Teeth)</option>
                              <option value="Form">Form (Body)</option>
                              <option value="Veil">Veil (Makeup &amp; Color Cosmetics)</option>
                              <option value="Steeping">Steeping (Infusion &amp; Decarb Oils)</option>
                            </select>
                          </div>
                          <div className="field" style={{ margin: 0 }}>
                            <label style={{color: 'var(--plum)'}}>Item Type</label>
                            <select value={addForm.item_type || 'consumable'} onChange={e => setAddForm({...addForm, item_type: e.target.value, is_composite: e.target.value === 'composite'})} style={{color: 'var(--plum)'}}>
                              <option value="consumable">Consumable (Product)</option>
                              <option value="arsenal">Arsenal (Tool/Device)</option>
                              <option value="composite">Composite (Custom Mix)</option>
                            </select>
                          </div>
                          <div className="field" style={{ margin: 0 }}>
                            <label style={{color: 'var(--plum)'}}>Item Classification</label>
                            <VoiceInput placeholder="" value={addForm.category}
                              onChange={e => setAddForm({...addForm, category: e.target.value})} />
                          </div>
                          <div className="field" style={{ margin: 0 }}>
                            <label style={{color: 'var(--plum)'}}>Application Zones</label>
                            <VoiceInput placeholder=""
                              value={(addForm.application_zones || []).join(', ')}
                              onChange={e => setAddForm({...addForm, application_zones: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} />
                          </div>
                          {/* Sacred Constituents — scoped: hidden for Steeping or arsenal */}
                          {addForm.domain !== 'Steeping' && addForm.item_type !== 'arsenal' && (
                            <div className="field" style={{ margin: 0 }}>
                              <label style={{color: 'var(--plum)'}}>Sacred Constituents</label>
                              <VoiceInput isTextArea={true}
                                placeholder=""
                                value={addForm.ingredients}
                                onChange={e => setAddForm({...addForm, ingredients: e.target.value})} />
                            </div>
                          )}
                          {addForm.domain !== 'Steeping' && (
                            <div className="field" style={{ margin: 0 }}>
                              <label style={{color: 'var(--plum)'}}>Aetheric Density (1=Fleeting, 10=Anchoring) — Override</label>
                              <div style={{display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--plum)'}}>
                                <input type="range" min="1" max="10" step="1" style={{flex: 1}} value={addForm.weight}
                                  onChange={e => { setAddForm({...addForm, weight: e.target.value}); setIsAutoWeight(false); }} />
                                <span style={{width: '20px', textAlign: 'center'}}>{isAutoWeight ? 'Auto' : addForm.weight}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{display: 'flex', justifyContent: 'space-between', gap: '0.8rem', marginTop: '2rem', flexWrap: 'wrap'}}>
                      <button className="btn" onClick={() => setManualStep(aiCandidates.length > 0 ? 'candidates' : 'seed')}>
                        ← {aiCandidates.length > 0 ? 'Back to Matches' : 'Back'}
                      </button>
                      <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button className="btn" onClick={() => { setShowAddModal(false); resetManualWizard(); }}>Abandon</button>
                        <button className="btn plum" onClick={handleSave} disabled={isSaving || !addForm.name}>
                          {isSaving ? 'Summoning…' : 'Summon'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}


          </div>
        </div>
      )}

      {banishState && (
        <div className="modal">
          <div className="modal-content card" style={{maxWidth: '500px'}}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{color: 'var(--plum)'}}>The Banishment of {banishState.name} <SpeakerButton text={`The Banishment of ${banishState.name}`} /></h3>
            
            <div style={{ padding: '1rem 0' }}>
              <p style={{ color: 'var(--silver)', marginBottom: '1rem' }}>Why are you consigning this relic to the crypt?</p>
              <select 
                value={banishState.reason} 
                onChange={(e) => setBanishState({ ...banishState, reason: e.target.value })}
                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg)', color: 'var(--silver)', border: '1px solid var(--border)', borderRadius: '4px', marginBottom: '1.5rem' }}
              >
                <option value="">Select a reason...</option>
                <option value="Negative Somatic Reaction (Burning, Breakout, etc.)">Negative Somatic Reaction (Burning, Breakout, etc.)</option>
                <option value="Unpleasant Texture or Weight">Unpleasant Texture or Weight</option>
                <option value="Unpleasant Odor">Unpleasant Odor</option>
                <option value="No Observable Effect">No Observable Effect</option>
                <option value="Expired or Degraded">Expired or Degraded</option>
                <option value="Replaced by Superior Formula">Replaced by Superior Formula</option>
                <option value="Other">Other</option>
              </select>
              
              <button 
                className="btn plum" 
                onClick={submitBanish} 
                disabled={!banishState.reason}
                style={{ width: '100%' }}
              >
                Seal in the Crypt
              </button>
            </div>

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
