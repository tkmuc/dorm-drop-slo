export const COLORS = [
  { id: 'forest', name: 'Mustang green', hex: '#355e49' },
  { id: 'sand', name: 'Warm sand', hex: '#c7ad83' },
  { id: 'clay', name: 'Terracotta', hex: '#b7765c' },
  { id: 'blue', name: 'Coastal blue', hex: '#6d91a4' },
  { id: 'purple', name: 'Soft purple', hex: '#9a7bb8' },
  { id: 'pink', name: 'Blush pink', hex: '#d895b0' }
];

export const ITEMS = [
  { id: 'bedding', name: 'Bedding set', detail: 'Sheet, pillow & comforter', price: 69, category: 'essentials', icon: 'bed' },
  { id: 'towels', name: 'Towel set', detail: 'Bath towel & hand towel', price: 18, category: 'essentials', icon: 'towel' },
  { id: 'toiletries', name: 'Toiletries', detail: 'The everyday basics', price: 16, category: 'essentials', icon: 'bottle' },
  { id: 'charging', name: 'Charging kit', detail: 'Wall charger & cable', price: 14, category: 'essentials', icon: 'charging' },
  { id: 'shower', name: 'Shower kit', detail: 'Caddy & shower shoes', price: 15, category: 'essentials', icon: 'shower' },
  { id: 'lamp', name: 'Desk lamp', detail: 'A little light for late nights', price: 22, category: 'extras', icon: 'lamp' },
  { id: 'laundry', name: 'Laundry basket', detail: 'A home for laundry day', price: 12, category: 'extras', icon: 'basket' },
  { id: 'hangers', name: 'Hanger set', detail: 'Five wooden hangers', price: 7, category: 'extras', icon: 'hanger' },
  { id: 'bottle', name: 'Water bottle', detail: 'Refill, repeat', price: 10, category: 'extras', icon: 'bottle' },
  { id: 'fan', name: 'Desk fan', detail: 'A little extra airflow', price: 18, category: 'extras', icon: 'fan' },
  { id: 'rug', name: 'Soft rug', detail: 'Make the room feel like yours', price: 24, category: 'extras', icon: 'rug' },
  { id: 'storage', name: 'Storage box', detail: 'Tucks away under the bed', price: 14, category: 'extras', icon: 'box' },
  { id: 'shoe-rack', name: 'Shoe rack', detail: 'Two bamboo shelves for your shoes', price: 24, category: 'extras', icon: 'box' },
  { id: 'closet-organizer', name: 'Closet organizer', detail: 'Six hanging shelves for folded clothes', price: 18, category: 'extras', icon: 'box' }
];
export const PRESETS = {
  night: ['bedding', 'towels', 'toiletries', 'charging', 'shower'],
  week: ['bedding', 'towels', 'toiletries', 'charging', 'shower', 'lamp', 'laundry', 'hangers', 'bottle'],
  empty: []
};
export const ROOMS = {
  cerro: { name: 'Cerro Vista apartment room', title: 'CERRO VISTA APARTMENTS', subtitle: 'Private apartment bedroom · Twin XL bed', note: 'Your own bedroom, with kitchen and bathrooms shared in the apartment.' },
  dorm: { name: 'Shared dorm room', title: 'SHARED RESIDENCE HALL ROOM', subtitle: 'Triple-room example · Customize the bed on the left', note: 'A shared bedroom with three study spaces and community bathrooms.' }
};
export const DEFAULT = { color: 'forest', room: 'cerro', items: PRESETS.night };
export function sanitize(input) {
  const value = input && typeof input === 'object' ? input : DEFAULT;
  return {
    color: COLORS.some(c => c.id === value.color) ? value.color : DEFAULT.color,
    room: value.room === 'dorm' || value.room === 'shared' ? 'dorm' : 'cerro',
    items: Array.isArray(value.items) ? [...new Set(value.items)].filter(id => ITEMS.some(i => i.id === id)) : [...PRESETS.night]
  };
}
export function totalFor(ids) { return ITEMS.reduce((sum, item) => sum + (ids.includes(item.id) ? item.price : 0), 0); }
export const money = value => '$' + value.toFixed(0);
