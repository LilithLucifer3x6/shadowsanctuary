const ROBE_DESIGNS = [
  { id: 'flowing_ceremonial', label: 'Flowing Ceremonial Robe', desc: 'Full-length flowing robe with wide sleeves and embroidered magical trim' },
  { id: 'structured_coat', label: 'Sorceress Coat', desc: 'Structured long coat with a cinched waist belt and high dramatic collar' },
  { id: 'kimono_wrap', label: 'Kimono-Style Wrap Robe', desc: 'Elegant wrap robe with a wide obi-style sash belt' },
  { id: 'asymmetric', label: 'Asymmetric Ritual Robe', desc: 'Dramatic asymmetric hem with layered fabric and one exposed shoulder' },
  { id: 'layered_scholar', label: 'Scholar\'s Layered Robes', desc: 'Multiple layered robes with intricate detail and overlapping panels' },
  { id: 'cape_gown', label: 'Cape & Gown Ensemble', desc: 'Elegant fitted gown with a sweeping dramatic floor-length cape' },
  { id: 'embroidered_gown', label: 'Embroidered Ritual Gown', desc: 'Form-flattering gown covered in glowing magical embroidery patterns' },
  { id: 'brocade_robe', label: 'Brocade Wrap Robe', desc: 'Luxurious brocade robe with plush dark fur trim and deep side pockets' },
  { id: 'off_shoulder', label: 'Off-Shoulder Sorceress Gown', desc: 'Dramatic off-shoulder gown with puffed sleeves and layered skirt' },
  { id: 'hooded_cloak', label: 'Hooded Ritual Cloak', desc: 'Long hooded cloak with a fitted inner robe visible at the hem' }
];

ROBE_DESIGNS.forEach(robe => {
  const config = {
    locStyle: 'shoulder-length',
    hairAccessory: 'nothing',
    robeColor: 'mahogany',
    robeDesign: robe.desc,
    jewelry: 'no'
  };
  const portraitPrompt = `Hand-painted 2D animated dark-fantasy illustration portrait of a mystical Keeper. Plus size, full figure body type. Androgynous, dark rich umber skin, and ${config.locStyle || 'long'} ultra-thin microlocs (thin as strands of yarn or embroidery thread, individually visible, not thick rope-like locs, 0.2cm thickness) adorned with ${config.hairAccessory || 'nothing'}. Wearing a deep ${config.robeColor || 'black'} gothic cottagecore robe of ${config.robeDesign || 'simple'} design, adorned with ${config.jewelry || 'no'} jewelry. Plain neutral gray background. Lush painterly rendering, expressive stylized character design, gothic dark-fantasy video-game aesthetic, moody atmospheric lighting with dramatic shadows. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.`;
  console.log('--- ' + robe.id + ' ---');
  console.log(portraitPrompt + '\n');
});