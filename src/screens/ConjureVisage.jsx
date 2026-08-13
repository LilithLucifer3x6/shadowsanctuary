import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import VoiceInput from '../components/VoiceInput.jsx';
import Icon from '../components/Icon.jsx';
import { useDialog } from '../components/Dialogs.jsx';

// ── HAIRSTYLE STYLES ─────────────────────────────────────────────────────────
const HAIRSTYLES = [
  { id: 'hair_braids_crown', label: 'Braided Crown', img: 'swatch_hair_braids_crown.jpg', layer: 'swatch_hair_braids_crown_transparent.png' },
  { id: 'hair_halfup', label: 'Half-Up', img: 'swatch_hair_halfup.jpg', layer: 'swatch_hair_halfup_transparent.png' },
  { id: 'hair_high_ponytail', label: 'High Ponytail', img: 'swatch_hair_high_ponytail.jpg', layer: 'swatch_hair_high_ponytail_transparent.png' },
  { id: 'hair_mohawk_undercut', label: 'Mohawk Undercut', img: 'swatch_hair_mohawk_undercut.jpg', layer: 'swatch_hair_mohawk_undercut_transparent.png' },
  { id: 'hair_updo', label: 'Updo', img: 'swatch_hair_updo.jpg', layer: 'swatch_hair_updo_transparent.png' },
  { id: 'hair_pulledback', label: 'Pulled Back', img: 'swatch_hair_pulledback.png', layer: 'swatch_hair_pulledback_transparent.png' },
  { id: 'hair_sideswept', label: 'Side-Swept', img: 'swatch_hair_sideswept.png', layer: 'swatch_hair_sideswept_transparent.png' },
  { id: 'hair_spacebuns', label: 'Space Buns', img: 'swatch_hair_spacebuns.png', layer: 'swatch_hair_spacebuns_transparent.png' },
  { id: 'hair_bantu_knots', label: 'Bantu Knots', img: 'swatch_hair_bantu_knots.png', layer: 'swatch_hair_bantu_knots_transparent.png' },
  { id: 'hair_long_braid', label: 'Long Braid', img: 'swatch_hair_long_braid.png', layer: 'swatch_hair_long_braid_transparent.png' },
];

// ── ROBE DESIGNS ─────────────────────────────────────────────────────────────
const ROBE_DESIGNS = [
  { id: 'robe_forest_green', label: 'Forest Green Velvet', img: 'swatch_robe_forest_green_velvet.jpg', layer: 'swatch_robe_forest_green_velvet_transparent.png' },
  { id: 'robe_ivory_lace', label: 'Ivory Lace', img: 'swatch_robe_ivory_lace.jpg', layer: 'swatch_robe_ivory_lace_transparent.png' },
  { id: 'robe_kimono_ceremonial', label: 'Ceremonial Kimono', img: 'swatch_robe_kimono_ceremonial.jpg', layer: 'swatch_robe_kimono_ceremonial_transparent.png' },
  { id: 'robe_kimono_red', label: 'Red Kimono', img: 'swatch_robe_kimono_red.png', layer: 'swatch_robe_kimono_red_transparent.png' },
  { id: 'robe_obsidian_heavy', label: 'Obsidian Heavy', img: 'swatch_robe_obsidian_heavy.png', layer: 'swatch_robe_obsidian_heavy_transparent.png' },
  { id: 'robe_purple', label: 'Purple Robe', img: 'swatch_robe_purple.png', layer: 'swatch_robe_purple_transparent.png' },
  { id: 'robe_red', label: 'Red Robe', img: 'swatch_robe_red.png', layer: 'swatch_robe_red_transparent.png' },
  { id: 'robe_brocade_split', label: 'Brocade Split', img: 'swatch_robe_brocade_split.png', layer: 'swatch_robe_brocade_split_transparent.png' },
  { id: 'robe_corset_red', label: 'Red Corset', img: 'swatch_robe_corset_red.png', layer: 'swatch_robe_corset_red_transparent.png' },
  { id: 'robe_harness_purple', label: 'Purple Harness', img: 'swatch_robe_harness_purple.png', layer: 'swatch_robe_harness_purple_transparent.png' },
];

// ── JEWELRY STYLE ────────────────────────────────────────────────────────────
const JEWELRY = [
  { id: 'none', label: 'No Jewelry' },
  { id: 'jewelry_crescent_moon', label: 'Crescent Moon', img: 'swatch_jewelry_crescent_moon.jpg', layer: 'swatch_jewelry_crescent_moon_transparent.png' },
  { id: 'jewelry_gothic_cross', label: 'Gothic Cross', img: 'swatch_jewelry_gothic_cross.jpg', layer: 'swatch_jewelry_gothic_cross_transparent.png' },
  { id: 'jewelry_hair_cuffs', label: 'Hair Cuffs', img: 'swatch_jewelry_hair_cuffs.jpg', layer: 'swatch_jewelry_hair_cuffs_transparent.png' },
  { id: 'jewelry_hand_harness', label: 'Hand Harness', img: 'swatch_jewelry_hand_harness.jpg', layer: 'swatch_jewelry_hand_harness_transparent.png' },
  { id: 'jewelry_silver_chains', label: 'Silver Chains', img: 'swatch_jewelry_silver_chains.jpg', layer: 'swatch_jewelry_silver_chains_transparent.png' },
  { id: 'jewelry_snake_armband', label: 'Snake Armband', img: 'swatch_jewelry_snake_armband.jpg', layer: 'swatch_jewelry_snake_armband_transparent.png' },
  { id: 'jewelry_spider_brooch', label: 'Spider Brooch', img: 'swatch_jewelry_spider_brooch.jpg', layer: 'swatch_jewelry_spider_brooch_transparent.png' },
  { id: 'jewelry_choker', label: 'Choker', img: 'swatch_jewelry_choker.png', layer: 'swatch_jewelry_choker_transparent.png' },
  { id: 'jewelry_ruby_teardrop', label: 'Ruby Teardrop', img: 'swatch_jewelry_ruby_teardrop.png', layer: 'swatch_jewelry_ruby_teardrop_transparent.png' },
  { id: 'jewelry_thick_collar', label: 'Thick Collar', img: 'swatch_jewelry_thick_collar.png', layer: 'swatch_jewelry_thick_collar_transparent.png' },
];

// ── FAMILIARS ─────────────────────────────────────────────────────────────────
const FAMILIARS = [
  { id: 'cat',   label: 'Midnight Cat',    img: 'fam_cat.jpg'   },
  { id: 'raven', label: 'Shadow Raven',    img: 'fam_raven.jpg' },
  { id: 'bat',   label: 'Cave Bat',        img: 'fam_bat.jpg'   },
  { id: 'owl',   label: 'Barn Owl',        img: 'fam_owl.jpg'   },
  { id: 'snake', label: 'Emerald Serpent', img: 'fam_snake.jpg' },
];

// ── SECTION COMPONENT ────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h3 style={{ color: 'var(--plum)', borderBottom: '1px solid rgba(176,132,148,0.2)', paddingBottom: '0.5rem', marginBottom: '1.2rem' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── IMAGE CARD ───────────────────────────────────────────────────────────────
function ImgCard({ item, selected, onSelect, width = '160px' }) {
  const isSelected = selected === item.id;
  return (
    <div
      onClick={() => onSelect(item.id)}
      style={{
        width,
        border: isSelected ? '2px solid var(--plum)' : '1px solid rgba(176,132,148,0.2)',
        background: isSelected ? 'rgba(176,132,148,0.12)' : 'rgba(5,3,10,0.6)',
        borderRadius: '8px',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isSelected ? '0 0 18px rgba(176,132,148,0.4)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      {item.img ? (
        <div style={{ width: '100%', aspectRatio: '4/5', background: '#000', overflow: 'hidden' }}>
          <img
            src={`/assets/avatar-tests/${item.img}`}
            alt={item.label}
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isSelected ? 1 : 0.65, transition: 'opacity 0.2s' }}
          />
          <div style={{
            display: 'none',
            width: '100%', height: '100%',
            background: 'rgba(176,132,148,0.05)',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', color: isSelected ? 'var(--plum)' : 'rgba(176,132,148,0.3)'
          }}>✦</div>
        </div>
      ) : (
        <div style={{
          width: '100%', aspectRatio: '4/5',
          background: 'rgba(176,132,148,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', color: isSelected ? 'var(--plum)' : 'rgba(176,132,148,0.3)'
        }}>✦</div>
      )}
      <div style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? 'var(--plum)' : 'var(--silver)' }}>
          {item.label}
        </div>
      </div>
    </div>
  );
}

export default function ConjureVisage({ onFinish, onCancel }) {
  const { alert } = useDialog();
  const [name, setName] = useState('');
  const [locStyle,       setLocStyle]       = useState('');
  const [robeDesign,     setRobeDesign]     = useState('');
  const [jewelry,        setJewelry]        = useState('');
  const [familiar,       setFamiliar]       = useState('');

  const [generating, setGenerating] = useState(false);
  const [genPhase,   setGenPhase]   = useState('');

  const isComplete = name && locStyle && robeDesign && jewelry && familiar;

  const buildKeeperDescription = () => {
    const hair    = HAIRSTYLES.find(h => h.id === locStyle);
    const design  = ROBE_DESIGNS.find(d => d.id === robeDesign);
    const jewels  = JEWELRY.find(j => j.id === jewelry);
    const fam     = FAMILIARS.find(f => f.id === familiar);
    return {
      name,
      locStyle:      hair?.label    || locStyle,
      robeDesign:    design?.label  || robeDesign,
      jewelry:       jewels?.label  || jewelry,
      familiar:      fam?.label    || familiar,
      familiarId:    familiar,
      layers: {
        hair: hair?.layer,
        robe: design?.layer,
        jewelry: jewels?.layer,
      }
    };
  };

  const handleFinish = async () => {
    if (!isComplete) return;

    const config = buildKeeperDescription();
    setGenerating(true);
    setGenPhase('The Sanctuary awakens...');
    
    await new Promise(r => setTimeout(r, 600));

    localStorage.setItem('avatar_config', JSON.stringify(config));
    
    // Background generation starts here using static layers in the engine if needed
    // or handled directly by the Room components pulling the config.
    
    if (onFinish) onFinish(config);
  };

  if (generating) {
    const progress = 100;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(5,3,10,0.95)', backdropFilter: 'blur(10px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: 100
      }}>
        <div style={{
          width: '80%', maxWidth: '400px', textAlign: 'center',
          background: 'rgba(176,132,148,0.05)', padding: '3rem 2rem',
          borderRadius: '16px', border: '1px solid rgba(176,132,148,0.2)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✦</div>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--plum)', fontSize: '1.3rem' }}>{genPhase}</h2>
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '99px', height: '6px', marginTop: '1.5rem', overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`, height: '100%',
              background: 'linear-gradient(90deg, var(--plum), var(--plum))',
              transition: 'width 0.6s ease', borderRadius: '99px'
            }} />
          </div>
          <p style={{ color: 'var(--dim)', fontSize: '0.8rem', marginTop: '1rem' }}>
            Your Keeper is being bound to the Sanctuary...
          </p>
        </div>
      </div>
    );
  }

  const selectedHair = HAIRSTYLES.find(h => h.id === locStyle);
  const selectedRobe = ROBE_DESIGNS.find(r => r.id === robeDesign);
  const selectedJewelry = JEWELRY.find(j => j.id === jewelry);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', color: 'var(--plum)',
      overflowY: 'auto', paddingBottom: '6rem',
      background: 'transparent',
    }}>
      <div style={{
        maxWidth: '900px', margin: '2rem auto', width: '94%',
        background: 'rgba(5,3,10,0.86)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(176,132,148,0.25)',
        borderRadius: '12px', padding: '2rem',
      }}>
        <h1 className="t" style={{ textAlign: 'center', marginBottom: '0.2rem', color: 'var(--plum)' }}>
          Conjure Your Visage
        </h1>
        <div style={{ textAlign: 'center', marginBottom: '1.2rem', color: 'var(--dim)', fontSize: '1.2rem' }}>✦ ✦ ✦</div>
        
        {/* LIVE AVATAR PREVIEW (STATIC COMPOSITING) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            position: 'relative', width: '280px', height: '380px',
            background: 'rgba(5,3,10,0.6)', borderRadius: '16px',
            border: '1px solid rgba(176,132,148,0.3)',
            boxShadow: '0 0 25px rgba(176,132,148,0.1)', overflow: 'hidden'
          }}>
            {/* Background */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, #1e1e24, #0a0a0c)' }} />
            
            {/* Base Body Anchor */}
            <img 
              src="/assets/avatar-tests/transparent/anchor_body_corrected_v5555_transparent.png" 
              alt="Base Body" 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} 
            />
            
            {/* Robe Layer */}
            {selectedRobe && selectedRobe.layer && (
              <img 
                src={`/assets/avatar-tests/transparent/${selectedRobe.layer}`}
                alt="Robe" 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }} 
              />
            )}

            {/* Hair Layer */}
            {selectedHair && selectedHair.layer && (
              <img 
                src={`/assets/avatar-tests/transparent/${selectedHair.layer}`}
                alt="Hair" 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 3 }} 
              />
            )}

            {/* Jewelry Layer */}
            {selectedJewelry && selectedJewelry.layer && (
              <img 
                src={`/assets/avatar-tests/transparent/${selectedJewelry.layer}`}
                alt="Jewelry" 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 4 }} 
              />
            )}
            
            {!isComplete && (
              <div style={{ 
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                background: 'rgba(0,0,0,0.5)', zIndex: 10,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' 
              }}>
                <div style={{ fontSize: '3rem', color: 'rgba(176,132,148,0.5)', marginBottom: '1rem' }}>✦</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--silver)', opacity: 0.9, textShadow: '0 2px 4px #000' }}>
                  Awaiting your design selections...
                </div>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--dim)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
          Shape your Keeper. Once bound, they will be painted into every room of the Sanctuary.
        </p>

        {/* NAME */}
        <Section title="The Keeper's Name">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 'fit-content', minWidth: '250px' }}>
              <VoiceInput 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="What shall I call you?"
              />
            </div>
          </div>
        </Section>

        {/* HAIRSTYLE */}
        <Section title="Hairstyle & Locs">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.2rem' }}>
            {HAIRSTYLES.map(h => <ImgCard key={h.id} item={h} selected={locStyle} onSelect={setLocStyle} />)}
          </div>
        </Section>

        {/* ROBE DESIGN */}
        <Section title="Robe Design">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.2rem' }}>
            {ROBE_DESIGNS.map(d => <ImgCard key={d.id} item={d} selected={robeDesign} onSelect={setRobeDesign} width="180px" />)}
          </div>
        </Section>

        {/* JEWELRY */}
        <Section title="Jewels & Adornments">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.2rem' }}>
            {JEWELRY.map(j => <ImgCard key={j.id} item={j} selected={jewelry} onSelect={setJewelry} />)}
          </div>
        </Section>

        {/* FAMILIAR */}
        <Section title="Your Familiar">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.2rem' }}>
            {FAMILIARS.map(f => <ImgCard key={f.id} item={f} selected={familiar} onSelect={setFamiliar} />)}
          </div>
        </Section>

        {/* GENERATE BUTTON */}
        <button
          onClick={handleFinish}
          disabled={!isComplete}
          style={{
            width: '100%', padding: '1.1rem',
            fontSize: '1.1rem', fontWeight: 'bold',
            background: isComplete ? 'rgba(176,132,148,0.2)' : 'rgba(0,0,0,0.3)',
            border: isComplete ? '1px solid var(--plum)' : '1px solid rgba(176,132,148,0.15)',
            color: isComplete ? 'var(--plum)' : 'var(--dim)',
            borderRadius: '8px', cursor: isComplete ? 'pointer' : 'not-allowed',
            boxShadow: isComplete ? '0 0 20px rgba(176,132,148,0.2)' : 'none',
            transition: 'all 0.2s ease',
            marginBottom: onCancel ? '1rem' : '0'
          }}
        >
          {isComplete ? '✨ Bind Keeper to the Sanctuary ✨' : 'Complete all selections above to continue'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="btn"
            style={{ width: '100%', padding: '0.8rem', color: 'var(--dim)', border: '1px solid var(--border)', background: 'transparent' }}
          >
            Cancel (Return to Sanctuary)
          </button>
        )}
      </div>
    </div>
  );
}
