// Preset store suggestions shown in the "From where?" fields.
// Users can still type anything custom; these are just autocomplete hints.

export const STORES = [
  'Carrefour',
  'Metro',
  'Flamingo',
  'Oscar',
  'Sami Salama',
  'El Nargis',
  'Spinneys',
  'Mahmoud El Far',
  'Penny'
];

// Price units. null/empty = total (flat price for the item).
export const PRICE_UNITS = [
  { value: '', label: 'total' },
  { value: 'kg', label: '/kg' },
  { value: 'pc', label: '/pc' },
  { value: 'L', label: '/L' }
];

export function formatPriceUnit(unit) {
  if (!unit) return '';
  const match = PRICE_UNITS.find((u) => u.value === unit);
  return match ? match.label : `/${unit}`;
}
