import React, { useState } from 'react';
import { 
  DndContext, 
  TouchSensor, 
  MouseSensor, 
  useSensor, 
  useSensors, 
  closestCenter 
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import Icon from './Icon.jsx';
import { useDialog } from './Dialogs.jsx';
import VoiceInput from './VoiceInput.jsx';

function DraggableImage({ id, filename, src }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { filename }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '2px solid var(--plum)',
    margin: '4px',
    cursor: 'grab'
  };

  return (
    <img 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      src={src} 
      alt="product preview" 
    />
  );
}

function DroppableGroup({ product, onUpdateField, imagesData }) {
  const { isOver, setNodeRef } = useDroppable({
    id: product.id
  });

  const style = {
    background: isOver ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
    border: isOver ? '1px solid var(--plum)' : '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    transition: 'all 0.2s ease'
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <VoiceInput 
                value={product.brand || ''} 
                onChange={e => onUpdateField(product.id, 'brand', e.target.value)} 
                placeholder="Brand"
              />
            </div>
            <div style={{ flex: 2 }}>
              <VoiceInput 
                value={product.name || ''} 
                onChange={e => onUpdateField(product.id, 'name', e.target.value)} 
                placeholder="Name"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <select 
              value={product.domain || 'Visage'} 
              onChange={e => onUpdateField(product.id, 'domain', e.target.value)}
              style={{ flex: 1, padding: '0.5rem' }}
            >
              <option value="Crown">Crown (Hair)</option>
              <option value="Visage">Visage (Face)</option>
              <option value="Vessel">Vessel (Body)</option>
              <option value="Grin">Grin (Mouth)</option>
            </select>
            <input 
              type="number" 
              value={product.price || ''} 
              onChange={e => onUpdateField(product.id, 'price', e.target.value ? parseFloat(e.target.value) : null)} 
              placeholder="Price"
              style={{ flex: 1, padding: '0.5rem' }}
            />
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            {product.ingredient_conflicts && (
              <div style={{ background: 'rgba(200,50,50,0.2)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--crimson)', marginBottom: '0.5rem' }}>
                <Icon name="warning" style={{ color: 'var(--crimson)' }} /> <strong>Safety Disagreement!</strong>
                <p style={{ fontSize: '0.8rem', margin: '0.5rem 0' }}>{product.ingredient_conflict_details}</p>
                <div style={{ fontSize: '0.8rem', color: 'var(--plum)' }}>You MUST manually review and edit The Consecrated Elements below to resolve this.</div>
              </div>
            )}
            <textarea 
              value={(product.ingredients || []).join(', ')} 
              onChange={e => onUpdateField(product.id, 'ingredients', e.target.value.split(',').map(s=>s.trim()))} 
              placeholder="The Consecrated Elements (comma separated)"
              style={{ width: '100%', padding: '0.5rem', minHeight: '60px' }}
            />
          </div>

          <details style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
            <summary style={{ cursor: 'pointer', color: 'var(--plum)', fontSize: '0.9rem' }}>Advanced Details (AI Extracted)</summary>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{color: 'var(--dim)', fontSize: '0.8rem', width: '100px'}}>Item Type</label>
                <select value={product.item_type || ''} onChange={e => onUpdateField(product.id, 'item_type', e.target.value)} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--plum)', flex: 1, borderRadius: '4px' }}>
                  <option value="" disabled>Select Type...</option>
                  <option value="consumable">Consumable</option>
                  <option value="arsenal">Arsenal</option>
                </select>
              </div>

              <VoiceInput 
                value={(product.application_zones || []).join(', ')} 
                onChange={e => onUpdateField(product.id, 'application_zones', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} 
                placeholder="Application Zones (Required, comma separated)"
              />

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', width: '100px'}}>
                  <input type="checkbox" checked={!!product.is_prescription} onChange={e => onUpdateField(product.id, 'is_prescription', e.target.checked)} />
                  Rx
                </label>
                {product.is_prescription && (
                  <div style={{ flex: 1 }}>
                    <VoiceInput 
                      isTextArea={true}
                      value={product.prescription_details || ''} 
                      onChange={e => onUpdateField(product.id, 'prescription_details', e.target.value)} 
                      placeholder="Prescription Details"
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" min="1" placeholder="PAO (Months)" value={product.period_after_opening_months || ''} onChange={e => onUpdateField(product.id, 'period_after_opening_months', e.target.value)} style={{ flex: 1, padding: '0.5rem' }} />
                <input type="number" min="1" placeholder="Shelf Life (Months)" value={product.unopened_shelf_life_months || ''} onChange={e => onUpdateField(product.id, 'unopened_shelf_life_months', e.target.value)} style={{ flex: 1, padding: '0.5rem' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{flex: 1}}>
                  <label style={{fontSize: '0.7rem', color: 'var(--dim)'}}>Mfg Date</label>
                  <input type="date" value={product.manufacture_date || ''} onChange={e => onUpdateField(product.id, 'manufacture_date', e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                </div>
                <div style={{flex: 1}}>
                  <label style={{fontSize: '0.7rem', color: 'var(--dim)'}}>Purchased</label>
                  <input type="date" value={product.purchase_date || ''} onChange={e => onUpdateField(product.id, 'purchase_date', e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                </div>
              </div>

              <div>
                <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem'}}>
                  <input type="checkbox" checked={!!product.is_opened} onChange={e => onUpdateField(product.id, 'is_opened', e.target.checked)} />
                  Break the Seal (Item is Opened)
                </label>
                {product.is_opened && (
                  <div style={{marginTop: '0.2rem'}}>
                    <label style={{fontSize: '0.7rem', color: 'var(--dim)'}}>Date Opened</label>
                    <input type="date" value={product.opened_date || ''} onChange={e => onUpdateField(product.id, 'opened_date', e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                  </div>
                )}
              </div>
            </div>
          </details>
        </div>
        
        <div style={{ flex: '0 0 200px', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', minHeight: '120px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--dim)', marginBottom: '0.5rem' }}>Images (Drag to re-group):</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {product.filenames.map((fname, i) => (
              <DraggableImage 
                key={`${product.id}-${fname}-${i}`} 
                id={`${product.id}-${fname}`} 
                filename={fname} 
                src={imagesData[fname]} 
              />
            ))}
            {product.filenames.length === 0 && (
              <div style={{ color: 'var(--dim)', fontSize: '0.8rem', fontStyle: 'italic', padding: '1rem' }}>Drop images here</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MultiPhotoReview({ initialProducts, imageFiles, onConfirm, onCancel }) {
  const { alert } = useDialog();
  // Generate stable IDs for products
  const [products, setProducts] = useState(() => 
    initialProducts.map((p, i) => ({ ...p, id: `group-${i}` }))
  );
  
  // Build a map of filename -> base64 data url for previewing
  const imagesData = {};
  for (const file of imageFiles) {
    imagesData[file.name] = file.dataUrl;
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return; // Dropped outside

    const sourceGroupId = active.id.split('-')[0] + '-' + active.id.split('-')[1]; // e.g. group-0
    const targetGroupId = over.id;
    const filename = active.data.current.filename;

    if (sourceGroupId !== targetGroupId) {
      setProducts(prev => prev.map(p => {
        if (p.id === sourceGroupId) {
          return { ...p, filenames: p.filenames.filter(f => f !== filename) };
        }
        if (p.id === targetGroupId) {
          return { ...p, filenames: [...p.filenames, filename] };
        }
        return p;
      }));
    }
  };

  const updateField = (id, field, value) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        // If they edit ingredients, we can assume they resolved the conflict.
        if (field === 'ingredients') {
          updated.ingredient_conflicts = false;
        }
        return updated;
      }
      return p;
    }));
  };

  const handleAddNewGroup = () => {
    setProducts(prev => [
      ...prev, 
      { id: `group-${Date.now()}`, filenames: [], brand: '', name: 'New Item', domain: 'Visage', ingredients: [] }
    ]);
  };

  const submit = async () => {
    const readyProducts = products.filter(p => !p.ingredient_conflicts && (p.filenames.length > 0 || p.name));
    const conflictedProducts = products.filter(p => p.ingredient_conflicts && (p.filenames.length > 0 || p.name));
    
    if (readyProducts.length === 0) {
      if (conflictedProducts.length > 0) {
        await alert("Please resolve the Safety Disagreements before saving these items.");
      } else {
        onCancel(); // Nothing left
      }
      return;
    }

    // Call onConfirm with the ready products and a flag indicating if we're done
    const isComplete = conflictedProducts.length === 0;
    const success = await onConfirm(readyProducts, isComplete);
    
    if (success === false) return; // Validation failed, keep modal open

    
    if (!isComplete) {
      // Keep modal open, but remove the products we just saved
      setProducts(conflictedProducts);
    }
  };

  const hasConflicts = products.some(p => p.ingredient_conflicts);

  return (
    <div className="modal-backdrop">
      <div className="card" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
        <h2 style={{ color: 'var(--plum)', marginBottom: '0.5rem' }}>Review Divine Groupings</h2>
        <p style={{ color: 'var(--dim)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          The Oracle has grouped your photos. You may drag and drop images between groups if a mistake was made.
          Please review any flagged Safety Disagreements.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {products.map(p => (
            <DroppableGroup 
              key={p.id} 
              product={p} 
              onUpdateField={updateField} 
              imagesData={imagesData}
            />
          ))}
        </DndContext>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button className="btn outline" onClick={handleAddNewGroup}>+ Add Empty Group</button>
          <div style={{ flex: 1 }}></div>
          <button className="btn outline" onClick={onCancel}>Cancel Ritual</button>
          <button className="btn plum" onClick={submit}>
            {hasConflicts ? `Summon Ready Items & Retain Unresolved` : `Summon to the Rootwork`}
          </button>
        </div>
      </div>
    </div>
  );
}
