import { buildBaseRoutines } from './src/lib/routine-engine.js';

const mockIntake = {
  algList: ['almond', 'lavender']
};

const rawItems = [
  { id: '1', name: 'Safe Cream', ingredients: 'Water, Glycerin', domain: 'visage', category: 'moisturizer', texture: 'cream' },
  { id: '2', name: 'Almond Oil', ingredients: 'Sweet Almond Oil, Vitamin E', domain: 'visage', category: 'oil', texture: 'oil' },
  { id: '3', name: 'Lavender Mist', ingredients: 'Water, Lavender Extract', domain: 'visage', category: 'toner', texture: 'liquid' },
  { id: '4', name: 'Array Oil', ingredients: ['Jojoba', 'Almond Oil'], domain: 'visage', category: 'oil', texture: 'oil' },
  { id: '5', name: 'Array Safe', ingredients: ['Jojoba', 'Argan'], domain: 'visage', category: 'oil', texture: 'oil' }
];

const userProfile = { intake_answers: mockIntake };

console.log('Testing Allergen Exclusion...');
const { allItems } = buildBaseRoutines(rawItems, userProfile);

console.log('Original items:', rawItems.length);
console.log('Filtered items:', allItems.length);
console.log('Remaining item names:');
allItems.forEach(i => console.log(' - ' + i.name));

const hasAlmond = allItems.some(i => i.name.includes('Almond'));
const hasLavender = allItems.some(i => i.name.includes('Lavender'));

if (hasAlmond || hasLavender) {
  console.log('FAILED: Allergens were not excluded.');
} else if (allItems.length === 2) {
  console.log('SUCCESS: Allergen exclusion works for both string and array ingredients.');
} else {
  console.log('FAILED: Unexpected number of items excluded.');
}
