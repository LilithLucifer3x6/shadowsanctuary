/**
 * Zone-based conflict resolution mapping and utilities.
 */

export const ZONES = {
  'Crown': { adjacentTo: ['Visage-above'] },
  'Visage-above': { adjacentTo: ['Crown', 'Visage-midway', 'Gaze'] },
  'Visage-midway': { adjacentTo: ['Visage-above', 'Visage-below', 'Gaze', 'Grin'] },
  'Visage-below': { adjacentTo: ['Visage-midway', 'Grin', 'Vessel-chest/back', 'Vessel-general'] },
  'Gaze': { adjacentTo: ['Visage-above', 'Visage-midway'] },
  'Grin': { adjacentTo: ['Visage-midway', 'Visage-below'] },
  'Veil': { adjacentTo: [] }, // Veil is dual-tagged, never standalone
  'Vessel-underarm': { adjacentTo: ['Vessel-chest/back', 'Vessel-arms/legs'] },
  'Vessel-chest/back': { adjacentTo: ['Vessel-underarm', 'Vessel-arms/legs', 'Vessel-general', 'Visage-below'] },
  'Vessel-arms/legs': { adjacentTo: ['Vessel-chest/back', 'Vessel-hands/feet', 'Vessel-general'] },
  'Vessel-hands/feet': { adjacentTo: ['Vessel-arms/legs'] },
  'Vessel-general': { adjacentTo: ['Vessel-chest/back', 'Vessel-arms/legs', 'Visage-below'] }
};

/**
 * Checks if two zone arrays overlap.
 * 
 * @param {string[]} zonesA 
 * @param {string[]} zonesB 
 * @returns {boolean}
 */
export function zonesOverlap(zonesA, zonesB) {
  if (!zonesA || !zonesB || zonesA.length === 0 || zonesB.length === 0) return false;
  
  for (const a of zonesA) {
    if (zonesB.includes(a)) return true;
    // Veil acts as an overlapping layer for any face zone, if they share it, it overlaps.
    // Since it's dual-tagged, the primary tag will trigger overlap anyway.
  }
  
  return false;
}

/**
 * Checks if zones are adjacent based on the ZONES mapping.
 * 
 * @param {string[]} zonesA 
 * @param {string[]} zonesB 
 * @returns {boolean}
 */
export function zonesAdjacent(zonesA, zonesB) {
  if (!zonesA || !zonesB || zonesA.length === 0 || zonesB.length === 0) return false;
  
  for (const a of zonesA) {
    const zoneDef = ZONES[a];
    if (zoneDef && zoneDef.adjacentTo) {
      if (zonesB.some(b => zoneDef.adjacentTo.includes(b))) {
        return true;
      }
    }
  }
  
  return false;
}

