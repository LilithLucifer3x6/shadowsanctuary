export { CUSTOM, ic } from '../../custom-icons.jsx';

export const G = {
  tabRites:'clock', tabGrim:'calendar', tabAltars:'flower-lotus', tabRoot:'plant', tabPool:'scrying-bowl', tabTome:'grimoire',
  morning:'sun-horizon', evening:'moon', cleanser:'cleanser-tube', toner:'toner-bottle', serum:'eyedropper',
  moisturiser:'cream-jar', spf:'sunscreen', tretinoin:'rx-tube', tacrolimus:'ointment-tube', drysol:'roll-on',
  drops:'eye-drops', lenses:'contact-lens', oral:'toothbrush', shower:'shower', dryoff:'towel',
  extractions:'tweezers', eyemask:'eye-mask', bodylotion:'body-lotion', oil:'oil-dropper', bonnet:'bonnet',
  maskSheet:'sheet-mask', maskRinse:'mask-jar', patch:'spot-patch', water:'water-glass', ride:'person-simple-bike',
  rope:'jump-rope', crown:'crown', gaze:'eyes', grin:'tooth', visage:'visage-face', vessel:'body-vessel', veil:'hand-mirror',
  rootWeave:'locs', talon:'talon', soak:'bathtub', depilate:'depilatory', shave:'razor', scroll:'scroll',
  apothecary:'flask', arsenal:'toolbox', waning:'hourglass', revair: 'hair-dryer', steamer: 'steamer', warmer: 'fire', steeping: 'leaf'
};

export function verifyGlyphs() {
  const seen = new Set();
  for (const [key, val] of Object.entries(G)) {
    if (seen.has(val)) {
      console.warn(`[Icons] Duplicate glyph value in G: '${val}' (used by ${key})`);
    }
    seen.add(val);
  }
}

export const cor = `<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>`;

export function div(sym) {
  return `<div class="divider"><span>${sym}</span></div>`;
}

