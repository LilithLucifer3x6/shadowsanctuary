import React, { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import VoiceInput from '../components/VoiceInput.jsx';
import Icon from '../components/Icon.jsx';
import { useDialog } from '../components/Dialogs.jsx';
import { invokeImageProxy } from '../lib/ai-engine.js';

// ── PHYSICAL BASE (hardcoded per user spec) ──────────────────────────────────
const BASE_DESCRIPTION =
  'A full-figured Black femme, 5\'8", approximately 250 lbs, with a warm medium espresso skin tone, an ample full-figured frame with a beautiful bust, and long pointy stiletto nails painted to match their robe color. Gold jewelry or accessories are permitted sparingly. Silver, black, or dark metals are preferred.';

// ── HAIRSTYLE / LOC STYLES ───────────────────────────────────────────────────
const HAIRSTYLES = [
  { id: 'microlocs_loose',      label: 'Microlocs — Loose & Free',         img: 'hair_microlocs_loose_1786057466910.jpg', desc: 'Shoulder-length, ultra-skinny microlocs worn completely free, framing the face' },
  { id: 'microlocs_halfup',     label: 'Microlocs — Half-Up Crown',        img: 'hair_microlocs_halfup_1786057476435.jpg', desc: 'Top half swept up in a crown, rest cascading freely at shoulder length' },
  { id: 'microlocs_highbun',    label: 'Microlocs — Dramatic High Bun',    img: 'hair_microlocs_highbun_1786057483707.jpg', desc: 'All locs swept into a large dramatic high bun with silver pins' },
  { id: 'microlocs_ponytail',   label: 'Microlocs — High Ponytail',        img: 'hair_microlocs_ponytail_1786057490323.jpg', desc: 'Locs gathered into a sleek high ponytail' },
  { id: 'microlocs_sideover',   label: 'Microlocs — Side Swept',           img: 'hair_microlocs_sideover_1786057497184.jpg', desc: 'All locs swept dramatically over one shoulder' },
  { id: 'microlocs_ceremonial', label: 'Microlocs — Ceremonial Updo',      img: 'hair_microlocs_ceremonial_1786057504791.jpg', desc: 'Elaborate updo with locs pinned in an artistic ceremonial arrangement' },
  { id: 'microlocs_wrapped',    label: 'Microlocs — Wrapped Sections',     img: 'hair_microlocs_wrapped_1786057512068.jpg', desc: 'Select locs wrapped with dark thread and silver wire at intervals' },
  { id: 'microlocs_twinbuns',   label: 'Microlocs — Twin Space Buns',      img: 'hair_microlocs_twinbuns_1786057518739.jpg', desc: 'Locs divided into two full high buns' },
  { id: 'microlocs_upbraid',    label: 'Microlocs — Braided Back Sections',img: 'hair_microlocs_upbraid_1786057526367.jpg', desc: 'Front sections braided back, remaining locs hanging freely' },
];

// ── ROBE DESIGNS ─────────────────────────────────────────────────────────────
const ROBE_DESIGNS = [
  { id: 'flowing_ceremonial', label: 'Flowing Ceremonial Robe',    desc: 'Full-length flowing robe with wide sleeves and embroidered magical trim', img: 'flowing_ceremonial_mahogany_v4.jpg' },
  { id: 'structured_coat',    label: 'Sorceress Coat',             desc: 'Structured long coat with a cinched waist belt and high dramatic collar', img: 'robe_structured_coat_v4.jpg' },
  { id: 'kimono_wrap',        label: 'Kimono-Style Wrap Robe',     desc: 'Elegant wrap robe with a wide obi-style sash belt', img: 'robe_kimono_wrap_v4.jpg' },
  { id: 'asymmetric',         label: 'Asymmetric Ritual Robe',     desc: 'Dramatic asymmetric hem with layered fabric and one exposed shoulder', img: 'robe_asymmetric_v4.jpg' },
  { id: 'layered_scholar',    label: "Scholar's Layered Robes",    desc: 'Multiple layered robes with intricate detail and overlapping panels', img: 'robe_layered_scholar_v4.jpg' },
  { id: 'cape_gown',          label: 'Cape & Gown Ensemble',       desc: 'Elegant fitted gown with a sweeping dramatic floor-length cape', img: 'robe_cape_gown_v4.jpg' },
  { id: 'embroidered_gown',   label: 'Embroidered Ritual Gown',    desc: 'Form-flattering gown covered in glowing magical embroidery patterns', img: 'robe_embroidered_gown_v4.jpg' },
  { id: 'brocade_robe',       label: 'Brocade Wrap Robe',          desc: 'Luxurious brocade robe with plush dark fur trim and deep side pockets', img: 'robe_brocade_wrap_v4.jpg' },
  { id: 'off_shoulder',       label: 'Off-Shoulder Sorceress Gown',desc: 'Dramatic off-shoulder gown with puffed sleeves and layered skirt', img: 'robe_off_shoulder_v4.jpg' },
  { id: 'hooded_cloak',       label: 'Hooded Ritual Cloak',        desc: 'Long hooded cloak with a fitted inner robe visible at the hem', img: 'robe_hooded_cloak_v4.jpg' },
];

// ── HAIR COLORS (natural + unnatural; no pink, no blue, no gold, no yellow, no blonde) ────
const HAIR_COLORS = [
  // Natural
  { id: 'jet_black',      label: 'Jet Black',         hex: '#0d0d0d',  type: 'natural'   },
  { id: 'dark_brown',     label: 'Dark Brown',         hex: '#2c1810',  type: 'natural'   },
  { id: 'warm_brown',     label: 'Warm Brown',         hex: '#5c3317',  type: 'natural'   },
  { id: 'auburn',         label: 'Auburn',             hex: '#6b2d1a',  type: 'natural'   },
  { id: 'chestnut',       label: 'Chestnut',           hex: '#5c2a1a',  type: 'natural'   },
  { id: 'dark_ginger',    label: 'Dark Ginger',        hex: '#8b3a00',  type: 'natural'   },
  { id: 'dark_gray',      label: 'Dark Gray',          hex: '#404040',  type: 'natural'   },
  { id: 'silver',         label: 'Silver / White',     hex: '#c0c0c0',  type: 'natural'   },
  { id: 'salt_pepper',    label: 'Salt & Pepper',      hex: '#707070',  type: 'natural'   },
  // Unnatural
  { id: 'cherry_red',     label: 'Cherry Red',         hex: '#c41230',  type: 'unnatural' },
  { id: 'deep_wine',      label: 'Deep Wine Red',      hex: '#6b0a2a',  type: 'unnatural' },
  { id: 'burgundy_hair',  label: 'Burgundy',           hex: '#4a0a1a',  type: 'unnatural' },
  { id: 'scarlet',        label: 'Scarlet',            hex: '#8b0a0a',  type: 'unnatural' },
  { id: 'deep_purple',    label: 'Deep Purple',        hex: '#2a0a4a',  type: 'unnatural' },
  { id: 'violet_hair',    label: 'Violet',             hex: '#4a0a6a',  type: 'unnatural' },
  { id: 'amethyst_hair',  label: 'Amethyst',           hex: '#7a3a9a',  type: 'unnatural' },
  { id: 'forest_green',   label: 'Forest Green',       hex: '#0a3a0a',  type: 'unnatural' },
  { id: 'emerald_green',  label: 'Emerald Green',      hex: '#0a6a2a',  type: 'unnatural' },
  { id: 'copper_red',     label: 'Copper Red',         hex: '#8b3a20',  type: 'unnatural' },
  { id: 'dark_teal_grn',  label: 'Dark Teal Green',    hex: '#0a3a3a',  type: 'unnatural' },
  { id: 'black_red_tips', label: 'Black w/ Red Tips',  hex: '#2a0000',  type: 'unnatural' },
  { id: 'dark_ombre_red', label: 'Dark Red Ombré',     hex: '#3a0a00',  type: 'unnatural' },
];

// ── ROBE COLORS (absolute ban: robes may never be predominantly green, blue, or pink; no gold anywhere on the robe, no yellow) ─────────────────────
const ROBE_COLORS = [
  // Blacks & Grays
  { id: 'obsidian',       label: 'Obsidian',           hex: '#0d0d0d' },
  { id: 'charcoal',       label: 'Charcoal',           hex: '#2a2a35' },
  { id: 'storm',          label: 'Storm Gray',         hex: '#3a3a4a' },
  { id: 'gunmetal',       label: 'Gunmetal',           hex: '#404050' },
  { id: 'pewter',         label: 'Pewter',             hex: '#5a5a6a' },
  // Reds
  { id: 'blood_red',      label: 'Blood Crimson',      hex: '#4a0000' },
  { id: 'deep_crimson',   label: 'Deep Crimson',       hex: '#6b0000' },
  { id: 'scarlet_robe',   label: 'Scarlet',            hex: '#a30000' },
  { id: 'ruby',           label: 'Ruby',               hex: '#9b111e' },
  { id: 'wine',           label: 'Wine / Merlot',      hex: '#4a1022' },
  { id: 'brick',          label: 'Brick Red',          hex: '#8b3323' },
  // Browns & Earth
  { id: 'rust_robe',      label: 'Rust / Sienna',      hex: '#8b3a00' },
  { id: 'copper_robe',    label: 'Dark Copper',        hex: '#7a3a1a' },
  { id: 'mahogany',       label: 'Mahogany',           hex: '#4a1a00' },
  { id: 'chocolate',      label: 'Dark Chocolate',     hex: '#2a1a0a' },
  { id: 'terracotta',     label: 'Terracotta',         hex: '#8b4a2a' },
  { id: 'deep_orange',    label: 'Deep Orange',        hex: '#8b4a00' },
  // Purples & Violets
  { id: 'midnight_v',     label: 'Midnight Violet',    hex: '#1e0a2e' },
  { id: 'deep_plum',      label: 'Deep Plum',          hex: '#2a0a2a' },
  { id: 'amethyst_robe',  label: 'Amethyst',           hex: '#4a1a6a' },
  { id: 'burgundy_robe',  label: 'Burgundy',           hex: '#3d0015' },
  { id: 'eggplant',       label: 'Eggplant',           hex: '#1a0a1a' },
];

// ── HAIR ACCESSORIES (no gold, no pink, no blue) ─────────────────────────────
const HAIR_ACCESSORIES = [
  { id: 'silver_cuffs',   label: 'Silver Loc Cuffs',        desc: 'Delicate silver cuffs placed at intervals along the locs', img: 'acc_silver_cuffs_1785991545863.jpg' },
  { id: 'black_iron',     label: 'Black Iron Wraps',         desc: 'Dark iron spiral wraps threaded through the locs', img: 'acc_black_iron_1785991560822.jpg' },
  { id: 'amethyst_cuffs', label: 'Amethyst Crystal Cuffs',  desc: 'Silver cuffs set with deep purple amethyst stones', img: 'acc_amethyst_1785991571987.jpg' },
  { id: 'obsidian_beads', label: 'Obsidian Beads',           desc: 'Polished obsidian beads woven throughout the locs', img: 'acc_obsidian_1785991579981.jpg' },
  { id: 'silver_moons',   label: 'Silver Moon Charms',       desc: 'Crescent moon and star charms dangling from the locs', img: 'acc_moons_1785991588255.jpg' },
  { id: 'bone_wood',      label: 'Bone & Wood Wraps',        desc: 'Organic carved bone and wood wraps for an earthy look', img: 'acc_bone_wood_1785991603327.jpg' },
  { id: 'copper_spiral',  label: 'Copper Spiral Cuffs',      desc: 'Warm copper spiral wraps coiled along the locs', img: 'acc_copper_spiral_1785991609908.jpg' },
  { id: 'garnet_pins',    label: 'Garnet-Set Silver Pins',   desc: 'Silver pins topped with deep red garnet stones pinned throughout', img: 'acc_garnet_pins_1785991616405.jpg' },
  { id: 'wire_wrapped',   label: 'Silver Wire Wrapped Tips', desc: 'Loc tips wrapped in delicate silver wire with crystal beads', img: 'acc_wire_wrapped_1785991623704.jpg' },
  { id: 'none',           label: 'No Accessories',           desc: 'Natural locs without any additional adornment' },
];

// ── JEWELRY STYLE (no gold anywhere on the avatar) ───────────────────────────────────────────────────
const JEWELRY = [
  { id: 'silver_amethyst', label: 'Silver & Amethyst',       desc: 'Silver chains, amethyst pendant and stacking rings' },
  { id: 'silver_onyx',     label: 'Silver & Black Onyx',     desc: 'Bold silver settings with black onyx stones, multiple rings' },
  { id: 'silver_emerald',  label: 'Silver & Emerald',        desc: 'Delicate silver with deep green emerald accent stones' },
  { id: 'silver_garnet',   label: 'Silver & Garnet',         desc: 'Rich silver bezels with deep red garnet stones' },
  { id: 'moonstone',       label: 'Dark Iron & Moonstone',   desc: 'Dark iron settings with glowing moonstone pendants' },
  { id: 'bronze_obsidian', label: 'Antique Bronze & Obsidian',desc: 'Antique bronze settings with obsidian, layered pieces' },
  { id: 'layered_silver',  label: 'Layered Silver Chains',   desc: 'Multiple layered silver chains of varying lengths and weights' },
  { id: 'crystal_mix',     label: 'Mixed Crystal Collection',desc: 'An eclectic collection of various crystal and silver pieces' },
  { id: 'silver_ruby',     label: 'Silver & Ruby',           desc: 'Silver with deep red ruby stones, dramatic statement pieces' },
  { id: 'minimal_silver',  label: 'Minimal Silver',          desc: 'Simple, elegant minimal silver pieces — a few rings and a delicate chain' },
];

// ── FAMILIARS ─────────────────────────────────────────────────────────────────
const FAMILIARS = [
  { id: 'cat',   label: 'Midnight Cat',    img: 'fam_cat.jpg'   },
  { id: 'raven', label: 'Shadow Raven',    img: 'fam_raven.jpg' },
  { id: 'bat',   label: 'Cave Bat',        img: 'fam_bat.jpg'   },
  { id: 'owl',   label: 'Barn Owl',        img: 'fam_owl.jpg'   },
  { id: 'snake', label: 'Emerald Serpent', img: 'fam_snake.jpg' },
];

// ── ROOM DEFINITIONS for background generation ────────────────────────────────
export const ROOM_PROMPTS = {
  rites:  (cfg) => `Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading (soft-edged shading transitions, not hard vector lines, not photographic smoothness or skin-pore detail) — combined with dramatic gothic chiaroscuro lighting (strong contrast between deep shadow and warm highlight), richly ornamental Victorian detail work, and moody saturated dark-fantasy color grading, anime-influenced expressive linework, illustrated depiction of a mystical Keeper. Plus size, full figure body type. Dark rich umber skin, and ${cfg.locStyle} interlocked microlocs — deliberately palm-rolled and interlocked, ultra-thin, each individual loc clearly visible and separated, NOT two-strand twists, NOT braids, NOT loose curly or wavy hair adorned with ${cfg.hairAccessory}. Wearing an extravagantly opulent deep ${cfg.robeColor} robe of ${cfg.robeDesign} design — the wardrobe of a Victorian-era vampiric noble, dripping in opulence as though an entire country's treasury were behind it: dense silver embroidery, intricate beadwork, jeweled clasps, high structured collars, dramatic fitted sleeves, ornate brooches and cameos, dark romantic elegance, rich brocade and heavy embellished trim, sumptuous and expensive-looking in every detail, adorned with ${cfg.jewelry} jewelry. Standing in a grand candlelit chamber of an ornate forest manor, a roaring fireplace and cauldron before them, brewing a skincare potion. Their ${cfg.familiar} familiar watches nearby. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.`,
  grim:   (cfg) => `Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading (soft-edged shading transitions, not hard vector lines, not photographic smoothness or skin-pore detail) — combined with dramatic gothic chiaroscuro lighting (strong contrast between deep shadow and warm highlight), richly ornamental Victorian detail work, and moody saturated dark-fantasy color grading, anime-influenced expressive linework, illustrated depiction of a mystical Keeper. Plus size, full figure body type. Dark rich umber skin, and ${cfg.locStyle} interlocked microlocs — deliberately palm-rolled and interlocked, ultra-thin, each individual loc clearly visible and separated, NOT two-strand twists, NOT braids, NOT loose curly or wavy hair adorned with ${cfg.hairAccessory}. Wearing an extravagantly opulent deep ${cfg.robeColor} robe of ${cfg.robeDesign} design — the wardrobe of a Victorian-era vampiric noble, dripping in opulence as though an entire country's treasury were behind it: dense silver embroidery, intricate beadwork, jeweled clasps, high structured collars, dramatic fitted sleeves, ornate brooches and cameos, dark romantic elegance, rich brocade and heavy embellished trim, sumptuous and expensive-looking in every detail. Standing before towering shelves of glowing potion bottles in a dark magical library, examining a product label. Their ${cfg.familiar} familiar perches nearby. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.`,
  altars: (cfg) => `Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading (soft-edged shading transitions, not hard vector lines, not photographic smoothness or skin-pore detail) — combined with dramatic gothic chiaroscuro lighting (strong contrast between deep shadow and warm highlight), richly ornamental Victorian detail work, and moody saturated dark-fantasy color grading, anime-influenced expressive linework, illustrated depiction of a mystical Keeper. Plus size, full figure body type. Dark rich umber skin, and ${cfg.locStyle} interlocked microlocs — deliberately palm-rolled and interlocked, ultra-thin, each individual loc clearly visible and separated, NOT two-strand twists, NOT braids, NOT loose curly or wavy hair adorned with ${cfg.hairAccessory}. Wearing an extravagantly opulent deep ${cfg.robeColor} robe of ${cfg.robeDesign} design — the wardrobe of a Victorian-era vampiric noble, dripping in opulence as though an entire country's treasury were behind it: dense silver embroidery, intricate beadwork, jeweled clasps, high structured collars, dramatic fitted sleeves, ornate brooches and cameos, dark romantic elegance, rich brocade and heavy embellished trim, sumptuous and expensive-looking in every detail. Sitting at a beautifully arranged altar with crystals, candles, and offerings, with hands raised in ritual gesture. Their ${cfg.familiar} familiar rests on the altar. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.`,
  root:   (cfg) => `Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading (soft-edged shading transitions, not hard vector lines, not photographic smoothness or skin-pore detail) — combined with dramatic gothic chiaroscuro lighting (strong contrast between deep shadow and warm highlight), richly ornamental Victorian detail work, and moody saturated dark-fantasy color grading, anime-influenced expressive linework, illustrated depiction of a mystical Keeper. Plus size, full figure body type. Dark rich umber skin, and ${cfg.locStyle} interlocked microlocs — deliberately palm-rolled and interlocked, ultra-thin, each individual loc clearly visible and separated, NOT two-strand twists, NOT braids, NOT loose curly or wavy hair adorned with ${cfg.hairAccessory}. Wearing an extravagantly opulent deep ${cfg.robeColor} robe of ${cfg.robeDesign} design — the wardrobe of a Victorian-era vampiric noble, dripping in opulence as though an entire country's treasury were behind it: dense silver embroidery, intricate beadwork, jeweled clasps, high structured collars, dramatic fitted sleeves, ornate brooches and cameos, dark romantic elegance, rich brocade and heavy embellished trim, sumptuous and expensive-looking in every detail. Casting spells over a large bubbling cauldron, magical glowing symbols forming in the air. Their ${cfg.familiar} familiar watches from a wooden beam above. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.`,
  pool:   (cfg) => `Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading (soft-edged shading transitions, not hard vector lines, not photographic smoothness or skin-pore detail) — combined with dramatic gothic chiaroscuro lighting (strong contrast between deep shadow and warm highlight), richly ornamental Victorian detail work, and moody saturated dark-fantasy color grading, anime-influenced expressive linework, illustrated depiction of a mystical Keeper. Plus size, full figure body type. Dark rich umber skin, and ${cfg.locStyle} interlocked microlocs — deliberately palm-rolled and interlocked, ultra-thin, each individual loc clearly visible and separated, NOT two-strand twists, NOT braids, NOT loose curly or wavy hair adorned with ${cfg.hairAccessory}. Wearing an extravagantly opulent deep ${cfg.robeColor} robe of ${cfg.robeDesign} design — the wardrobe of a Victorian-era vampiric noble, dripping in opulence as though an entire country's treasury were behind it: dense silver embroidery, intricate beadwork, jeweled clasps, high structured collars, dramatic fitted sleeves, ornate brooches and cameos, dark romantic elegance, rich brocade and heavy embellished trim, sumptuous and expensive-looking in every detail. Gazing into a glowing scrying pool with swirling visions of wisdom in the water. Their ${cfg.familiar} familiar is reflected in the water. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.`,
  tome:   (cfg) => `Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading (soft-edged shading transitions, not hard vector lines, not photographic smoothness or skin-pore detail) — combined with dramatic gothic chiaroscuro lighting (strong contrast between deep shadow and warm highlight), richly ornamental Victorian detail work, and moody saturated dark-fantasy color grading, anime-influenced expressive linework, illustrated depiction of a mystical Keeper. Plus size, full figure body type. Dark rich umber skin, and ${cfg.locStyle} interlocked microlocs — deliberately palm-rolled and interlocked, ultra-thin, each individual loc clearly visible and separated, NOT two-strand twists, NOT braids, NOT loose curly or wavy hair adorned with ${cfg.hairAccessory}. Wearing an extravagantly opulent deep ${cfg.robeColor} robe of ${cfg.robeDesign} design — the wardrobe of a Victorian-era vampiric noble, dripping in opulence as though an entire country's treasury were behind it: dense silver embroidery, intricate beadwork, jeweled clasps, high structured collars, dramatic fitted sleeves, ornate brooches and cameos, dark romantic elegance, rich brocade and heavy embellished trim, sumptuous and expensive-looking in every detail. Writing in a large leather-bound shadow tome by candlelight, surrounded by drying herbs and honey jars with a warm cup of herbal tea. Their ${cfg.familiar} familiar curls up beside the tome. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.`,
};

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
            src={`/assets/${item.img}`}
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
        {item.desc && (
          <div style={{ fontSize: '0.7rem', color: 'var(--dim)', marginTop: '0.3rem', lineHeight: 1.3 }}>
            {item.desc}
          </div>
        )}
      </div>
    </div>
  );
}

function TextCard({ item, selected, onSelect }) {
  const isSelected = selected === item.id;
  return (
    <div
      onClick={() => onSelect(item.id)}
      style={{
        border: isSelected ? '2px solid var(--plum)' : '1px solid rgba(176,132,148,0.2)',
        background: isSelected ? 'rgba(176,132,148,0.12)' : 'rgba(5,3,10,0.6)',
        borderRadius: '8px',
        cursor: 'pointer',
        padding: '0.9rem 1rem',
        boxShadow: isSelected ? '0 0 14px rgba(176,132,148,0.35)' : 'none',
        transition: 'all 0.2s ease',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? 'var(--plum)' : 'var(--silver)', marginBottom: '0.3rem' }}>
        {item.label}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--dim)', lineHeight: 1.4 }}>
        {item.desc}
      </div>
    </div>
  );
}

function ColorSwatch({ color, selected, onSelect }) {
  const isSelected = selected === color.id;
  return (
    <div onClick={() => onSelect(color.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
      <div style={{
        width: '52px', height: '52px',
        borderRadius: '50%',
        background: color.hex,
        border: isSelected ? '3px solid var(--plum)' : '2px solid rgba(176,132,148,0.25)',
        boxShadow: isSelected ? `0 0 16px ${color.hex}, 0 0 4px rgba(176,132,148,0.4)` : 'none',
        transition: 'all 0.2s ease',
      }} />
      <div style={{ fontSize: '0.72rem', color: isSelected ? 'var(--plum)' : 'var(--dim)', textAlign: 'center', maxWidth: '60px', lineHeight: 1.2 }}>
        {color.label}
      </div>
    </div>
  );
}

export default function ConjureVisage({ onFinish }) {
  const { alert } = useDialog();
  const [name, setName] = useState('');
  const [locStyle,       setLocStyle]       = useState('');
  const [hairColor,      setHairColor]      = useState('');
  const [robeDesign,     setRobeDesign]     = useState('');
  const [robeColor,      setRobeColor]      = useState('');
  const [hairAccessory,  setHairAccessory]  = useState('');
  const [jewelry,        setJewelry]        = useState('');
  const [familiar,       setFamiliar]       = useState('');

  const [generating, setGenerating] = useState(false);
  const [genPhase,   setGenPhase]   = useState('');
  const [genStep,    setGenStep]    = useState(0);

  const [previewImage, setPreviewImage] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  const isComplete = name && locStyle && hairColor && robeDesign && robeColor && hairAccessory && jewelry && familiar;

  const buildKeeperDescription = () => {
    const hair    = HAIRSTYLES.find(h => h.id === locStyle);
    const design  = ROBE_DESIGNS.find(d => d.id === robeDesign);
    const color   = ROBE_COLORS.find(c => c.id === robeColor);
    const acc     = HAIR_ACCESSORIES.find(a => a.id === hairAccessory);
    const jewels  = JEWELRY.find(j => j.id === jewelry);
    const fam     = FAMILIARS.find(f => f.id === familiar);
    return {
      name,
      locStyle:      hair?.desc    || locStyle,
      hairColor:     HAIR_COLORS.find(c => c.id === hairColor)?.label || hairColor,
      hairColorHex:  HAIR_COLORS.find(c => c.id === hairColor)?.hex   || '#0d0d0d',
      robeDesign:    design?.desc  || robeDesign,
      robeColor:     color?.label  || robeColor,
      hairAccessory: acc?.desc     || hairAccessory,
      jewelry:       jewels?.desc  || jewelry,
      familiar:      fam?.label    || familiar,
      familiarId:    familiar,
      robeColorHex:  color?.hex    || '#1e0a2e',
      base:          BASE_DESCRIPTION,
    };
  };

  const handleGeneratePreview = async () => {
    if (!isComplete) return;
    setGeneratingPreview(true);
    setPreviewImage(null);
    const config = buildKeeperDescription();
    const portraitPrompt = `Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading (soft-edged shading transitions, not hard vector lines, not photographic smoothness or skin-pore detail) — combined with dramatic gothic chiaroscuro lighting (strong contrast between deep shadow and warm highlight), richly ornamental Victorian detail work, and moody saturated dark-fantasy color grading, anime-influenced expressive linework, illustrated portrait of a mystical Keeper. Plus size, full figure body type. Dark rich umber skin, and ${config.locStyle || 'long'} interlocked microlocs — deliberately palm-rolled and interlocked, ultra-thin, each individual loc clearly visible and separated, NOT two-strand twists, NOT braids, NOT loose curly or wavy hair adorned with ${config.hairAccessory || 'nothing'}. Wearing an extravagantly opulent deep ${config.robeColor || 'black'} robe of ${config.robeDesign || 'simple'} design — the wardrobe of a Victorian-era vampiric noble, dripping in opulence as though an entire country's treasury were behind it: dense silver embroidery, intricate beadwork, jeweled clasps, high structured collars, dramatic fitted sleeves, ornate brooches and cameos, dark romantic elegance, rich brocade and heavy embellished trim, sumptuous and expensive-looking in every detail, adorned with ${config.jewelry || 'no'} jewelry. Plain neutral gray background. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.`;
    
    try {
      const { data, error } = await invokeImageProxy({
        version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // sdxl fallback
        input: { prompt: portraitPrompt, width: 1024, height: 1024 }
      });
      if (data && data.output && data.output[0]) {
        setPreviewImage(data.output[0]);
      } else {
        console.error('Preview generation failed:', error);
        const isQuota = error?.message?.toLowerCase().includes('429') || error?.message?.toLowerCase().includes('rate limit') || error?.message?.toLowerCase().includes('too many requests');
        await alert(isQuota
          ? "The image quota is still exhausted for now — try again once it resets."
          : `The Scrying Pool clouded over: ${error?.message || 'unknown error, check console for details'}`
        );
      }
    } catch (e) {
      console.error('Preview generation threw:', e);
      await alert(`A disruption in the weave: ${e?.message || 'unknown error, check console for details'}`);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleFinish = async () => {
    if (!isComplete) return;

    const config = buildKeeperDescription();
    setGenerating(true);
    setGenPhase('The Sanctuary awakens...');
    setGenStep(6);
    
    // Simulate a brief, satisfying pause
    await new Promise(r => setTimeout(r, 600));

    // Save initial config immediately
    localStorage.setItem('avatar_config', JSON.stringify(config));
    
    // Fire off background generation pipeline
    import('../lib/ai-engine.js').then(({ startBackgroundRoomGeneration }) => {
      startBackgroundRoomGeneration(config);
    });

    if (onFinish) onFinish(config);
  };

  if (generating) {
    const progress = 100; // Instantly jump to 100% because generation is now detached
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
            Your Keeper is being painted into every room of the Sanctuary...
          </p>
        </div>
      </div>
    );
  }

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
        
        {/* LIVE AVATAR PREVIEW */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            position: 'relative', width: '220px', height: '300px',
            background: 'rgba(5,3,10,0.6)', borderRadius: '16px',
            border: '1px solid rgba(176,132,148,0.3)',
            boxShadow: '0 0 25px rgba(176,132,148,0.1)', overflow: 'hidden'
          }}>
            {previewImage ? (
              <img src={previewImage} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : generatingPreview ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem', animation: 'spin 2s linear infinite' }}>✧</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--plum)' }}>Divining your image...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', color: 'rgba(176,132,148,0.2)', marginBottom: '1rem' }}>✦</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--silver)', opacity: 0.8 }}>
                  {isComplete ? 'Design complete. Ready to preview.' : 'Awaiting your design selections...'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PREVIEW BUTTON */}
        {isComplete && !previewImage && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <button
              onClick={handleGeneratePreview}
              disabled={generatingPreview}
              style={{
                padding: '0.8rem 1.5rem',
                fontSize: '1rem',
                background: 'rgba(176,132,148,0.15)',
                border: '1px solid var(--plum)',
                color: 'var(--plum)',
                borderRadius: '8px', cursor: generatingPreview ? 'wait' : 'pointer',
                boxShadow: '0 0 15px rgba(176,132,148,0.2)',
                transition: 'all 0.2s ease',
              }}
            >
              {generatingPreview ? 'Conjuring...' : '✧ Generate My Preview ✧'}
            </button>
          </div>
        )}

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

        {/* HAIR COLOR */}
        <Section title="Loc Color">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
            {HAIR_COLORS.map(c => (
              <ColorSwatch key={c.id} color={c} selected={hairColor} onSelect={setHairColor} />
            ))}
          </div>
        </Section>

        {/* ROBE DESIGN */}
        <Section title="Robe Design">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.2rem' }}>
            {ROBE_DESIGNS.map(d => <ImgCard key={d.id} item={d} selected={robeDesign} onSelect={setRobeDesign} width="180px" />)}
          </div>
        </Section>

        {/* ROBE COLOR */}
        <Section title="Robe Color">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
            {ROBE_COLORS.map(c => (
              <ColorSwatch key={c.id} color={c} selected={robeColor} onSelect={setRobeColor} />
            ))}
          </div>
        </Section>

        {/* HAIR ACCESSORIES */}
        <Section title="Hair Accessories">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.2rem' }}>
            {HAIR_ACCESSORIES.map(a => <ImgCard key={a.id} item={a} selected={hairAccessory} onSelect={setHairAccessory} />)}
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
          }}
        >
          {isComplete ? '✦ Bind Keeper to the Sanctuary ✦' : 'Complete all selections above to continue'}
        </button>
      </div>
    </div>
  );
}
