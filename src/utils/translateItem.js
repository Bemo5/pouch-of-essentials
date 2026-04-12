// Bidirectional grocery-item dictionary for share-time translation.
// Only common household / grocery items — not meant to be exhaustive.
// Lookup is case-insensitive. Items not found are returned as-is.

const EN_TO_AR = {
  milk: 'حليب',
  bread: 'خبز',
  eggs: 'بيض',
  cheese: 'جبنة',
  butter: 'زبدة',
  yogurt: 'زبادي',
  rice: 'أرز',
  pasta: 'مكرونة',
  sugar: 'سكر',
  salt: 'ملح',
  oil: 'زيت',
  flour: 'دقيق',
  chicken: 'فراخ',
  meat: 'لحمة',
  fish: 'سمك',
  onions: 'بصل',
  onion: 'بصل',
  garlic: 'ثوم',
  tomatoes: 'طماطم',
  tomato: 'طماطم',
  potatoes: 'بطاطس',
  potato: 'بطاطس',
  cucumber: 'خيار',
  cucumbers: 'خيار',
  lemon: 'ليمون',
  lemons: 'ليمون',
  banana: 'موز',
  bananas: 'موز',
  apple: 'تفاح',
  apples: 'تفاح',
  orange: 'برتقال',
  oranges: 'برتقال',
  watermelon: 'بطيخ',
  grapes: 'عنب',
  mango: 'مانجو',
  mangoes: 'مانجو',
  strawberry: 'فراولة',
  strawberries: 'فراولة',
  pepper: 'فلفل',
  peppers: 'فلفل',
  carrots: 'جزر',
  carrot: 'جزر',
  beans: 'فاصوليا',
  lentils: 'عدس',
  tea: 'شاي',
  coffee: 'قهوة',
  juice: 'عصير',
  water: 'مياه',
  soap: 'صابون',
  shampoo: 'شامبو',
  tissues: 'مناديل',
  tissue: 'مناديل',
  detergent: 'منظف',
  vinegar: 'خل',
  honey: 'عسل',
  jam: 'مربى',
  tuna: 'تونة',
  cream: 'قشطة',
  corn: 'ذرة',
  peas: 'بسلة',
  spinach: 'سبانخ',
  parsley: 'بقدونس',
  mint: 'نعناع',
  dill: 'شبت',
  coriander: 'كزبرة',
  thyme: 'زعتر',
  cumin: 'كمون',
  chips: 'شيبسي',
  biscuits: 'بسكويت',
  chocolate: 'شوكولاتة',
  nuts: 'مكسرات',
  dates: 'بلح',
  olives: 'زيتون',
  pickles: 'مخلل',
  ketchup: 'كاتشب',
  mayonnaise: 'مايونيز',
  sausage: 'سجق',
  sausages: 'سجق',
  noodles: 'نودلز',
  cereal: 'كورن فليكس',
  oats: 'شوفان',
  towels: 'فوط',
  'paper towels': 'مناديل مطبخ',
  'toilet paper': 'ورق تواليت',
  diapers: 'حفاضات',
  batteries: 'بطاريات',
  candles: 'شموع',
  foil: 'فويل',
  bags: 'أكياس',
  cinnamon: 'قرفة',
  ginger: 'زنجبيل',
  mushrooms: 'مشروم',
  zucchini: 'كوسة',
  eggplant: 'باذنجان',
  cabbage: 'كرنب',
  lettuce: 'خس',
  okra: 'بامية',
  molokhia: 'ملوخية',
  fava: 'فول',
  'fava beans': 'فول',
  falafel: 'فلافل',
  tahini: 'طحينة',
  halva: 'حلاوة',
  ghee: 'سمنة',
  vermicelli: 'شعرية',
  semolina: 'سميد',
  starch: 'نشا',
  yeast: 'خميرة',
  'baking powder': 'بيكنج بودر',
  vanilla: 'فانيليا',
  'tomato paste': 'صلصة',
  'soy sauce': 'صويا صوص',
};

// Build reverse map (ar → en)
const AR_TO_EN = {};
for (const [en, ar] of Object.entries(EN_TO_AR)) {
  // Keep first English word per Arabic value (shortest / most natural)
  if (!AR_TO_EN[ar]) AR_TO_EN[ar] = en;
}

// Returns true if the string is predominantly Arabic script.
function isArabic(s) {
  const arabic = s.replace(/[\s\d\p{P}]/gu, '');
  if (!arabic) return false;
  const arChars = [...arabic].filter(
    (c) => /\p{Script=Arabic}/u.test(c)
  ).length;
  return arChars / [...arabic].length > 0.5;
}

/**
 * Translate an item name for export.
 * - toAr: true  → English names become Arabic, Arabic stays.
 * - toAr: false → Arabic names become English, English stays.
 * Items not in the dictionary are returned unchanged.
 */
export function translateForShare(name, toAr) {
  if (!name) return name;
  const trimmed = name.trim();
  if (toAr) {
    if (isArabic(trimmed)) return trimmed;
    const key = trimmed.toLowerCase();
    return EN_TO_AR[key] || trimmed;
  } else {
    if (!isArabic(trimmed)) return trimmed;
    const match = AR_TO_EN[trimmed];
    if (match) return match.charAt(0).toUpperCase() + match.slice(1);
    return trimmed;
  }
}
