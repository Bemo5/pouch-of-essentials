const RAW = [
  {
    id: 'frozen',
    label: 'Frozen',
    emoji: '🧊',
    keywords: [
      'frozen', 'ice cream', 'ice-cream', 'gelato', 'sorbet', 'popsicle',
      'مجمد', 'آيسكريم', 'مثلجات',
    ],
  },
  {
    id: 'beverages',
    label: 'Beverages',
    emoji: '🧃',
    keywords: [
      'juice', 'water', 'coffee', 'tea', 'soda', 'cola', 'pepsi', 'sprite',
      'fanta', 'energy drink', 'smoothie', 'lemonade', 'sparkling', 'nescafe',
      'espresso', 'cappuccino', 'latte', 'matcha', 'kombucha',
      // Arabic
      'عصير', 'ماء', 'مياه', 'قهوة', 'شاي', 'كولا', 'نسكافيه', 'كوكا', 'مشروب',
    ],
  },
  {
    id: 'produce',
    label: 'Produce',
    emoji: '🥦',
    keywords: [
      'apple', 'apples', 'banana', 'bananas', 'tomato', 'tomatoes',
      'potato', 'potatoes', 'onion', 'onions', 'garlic', 'lettuce',
      'carrot', 'carrots', 'cucumber', 'cucumbers', 'pepper', 'peppers',
      'lemon', 'lemons', 'orange', 'oranges', 'grape', 'grapes',
      'watermelon', 'mango', 'mangoes', 'avocado', 'avocados', 'spinach',
      'broccoli', 'ginger', 'celery', 'zucchini', 'courgette',
      'eggplant', 'aubergine', 'mushroom', 'mushrooms',
      'pear', 'pears', 'peach', 'peaches', 'strawberry', 'strawberries',
      'berry', 'berries', 'kiwi', 'pineapple', 'cherry', 'cherries',
      'cabbage', 'cauliflower', 'artichoke', 'asparagus', 'leek', 'radish',
      'beetroot', 'beet', 'turnip', 'squash', 'pumpkin', 'okra',
      'sweet potato', 'plum', 'plums', 'apricot', 'apricots',
      'fig', 'figs', 'pomegranate', 'lime', 'limes', 'melon', 'salad',
      'mint', 'basil', 'parsley', 'coriander', 'cilantro', 'dill', 'chive',
      'scallion', 'spring onion', 'vegetable', 'vegetables', 'fruit', 'fruits',
      // Arabic
      'تفاح', 'موز', 'طماطم', 'بطاطس', 'بصل', 'ثوم', 'خس', 'جزر', 'خيار',
      'فلفل', 'ليمون', 'برتقال', 'عنب', 'بطيخ', 'مانجو', 'سبانخ', 'قرنبيط',
      'فراولة', 'كوسة', 'باذنجان', 'فطر', 'خضار', 'فاكهة', 'نعناع', 'بقدونس',
      'كزبرة', 'رمان', 'تين', 'مشمش', 'خوخ', 'كرز', 'توت', 'كرفس', 'قرع', 'بامية',
    ],
  },
  {
    id: 'meat',
    label: 'Meat & Fish',
    emoji: '🥩',
    keywords: [
      'beef', 'chicken', 'lamb', 'fish', 'shrimp', 'turkey', 'sausage', 'mince',
      'minced', 'steak', 'fillet', 'prawn', 'salmon', 'tuna', 'pork', 'veal',
      'duck', 'kofta', 'kebab', 'burger', 'meatball', 'liver', 'kidney', 'ham',
      'bacon', 'sardine', 'cod', 'tilapia', 'crab', 'lobster', 'squid', 'anchovy',
      // Arabic
      'دجاج', 'لحم', 'سمك', 'جمبري', 'ضأن', 'كفتة', 'سجق', 'كباب',
      'تونة', 'سلمون', 'روبيان', 'حوت', 'ديك رومي',
    ],
  },
  {
    id: 'dairy',
    label: 'Dairy & Eggs',
    emoji: '🥛',
    keywords: [
      'milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'labneh',
      'halloumi', 'kashkaval', 'egg', 'kefir', 'whey', 'cheddar', 'mozzarella',
      'feta', 'parmesan', 'ricotta', 'brie', 'gouda', 'cottage', 'ghee', 'creamer',
      // Arabic
      'حليب', 'لبن', 'جبن', 'جبنة', 'زبدة', 'قشطة', 'لبنة', 'بيض', 'سمنة',
    ],
  },
  {
    id: 'bakery',
    label: 'Bakery',
    emoji: '🍞',
    keywords: [
      'bread', 'bun', 'roll', 'cake', 'croissant', 'pita', 'bagel', 'muffin',
      'pastry', 'toast', 'loaf', 'baguette', 'tortilla', 'wrap', 'brioche',
      'sourdough', 'brownie', 'donut', 'doughnut', 'waffle', 'pancake',
      // Arabic
      'خبز', 'عيش', 'كعك', 'كرواسون', 'فطير', 'رغيف', 'توست',
    ],
  },
  {
    id: 'snacks',
    label: 'Snacks',
    emoji: '🍫',
    keywords: [
      'chips', 'chocolate', 'biscuit', 'candy', 'nuts', 'popcorn', 'pretzel',
      'crackers', 'gummy', 'marshmallow', 'toffee', 'caramel', 'granola',
      'raisin', 'dried fruit', 'protein bar',
      // Arabic
      'شيبس', 'شوكولاتة', 'بسكويت', 'حلوى', 'مكسرات', 'فشار',
    ],
  },
  {
    id: 'pantry',
    label: 'Pantry',
    emoji: '🥫',
    keywords: [
      'rice', 'pasta', 'flour', 'sugar', 'salt', 'vinegar', 'sauce', 'canned',
      'beans', 'lentil', 'chickpea', 'ketchup', 'mayo', 'mayonnaise', 'mustard',
      'cereal', 'oats', 'honey', 'jam', 'peanut butter', 'syrup', 'noodle',
      'spaghetti', 'macaroni', 'couscous', 'quinoa', 'tahini', 'hummus', 'olive',
      'pickle', 'spice', 'cumin', 'paprika', 'cinnamon', 'turmeric', 'oregano',
      'thyme', 'yeast', 'baking soda', 'baking powder', 'cornstarch', 'vanilla',
      'tomato paste', 'stock', 'broth', 'coconut milk', 'soy sauce', 'oil',
      // Arabic
      'رز', 'معكرونة', 'دقيق', 'سكر', 'ملح', 'زيت', 'خل', 'صلصة', 'فول',
      'عدس', 'حمص', 'طحينة', 'عسل', 'مربى', 'كيتشاب', 'مايونيز', 'شوفان',
      'بهارات', 'كمون', 'قرفة', 'كركم',
    ],
  },
  {
    id: 'personal',
    label: 'Personal Care',
    emoji: '🧴',
    keywords: [
      'shampoo', 'soap', 'toothpaste', 'deodorant', 'lotion', 'razor',
      'conditioner', 'body wash', 'moisturizer', 'sunscreen', 'perfume',
      'cologne', 'mouthwash', 'dental floss', 'toothbrush', 'cotton',
      'bandage', 'band-aid', 'vitamin', 'medicine', 'paracetamol',
      'ibuprofen', 'aspirin', 'pad', 'tampon',
      // Arabic
      'شامبو', 'صابون', 'معجون أسنان', 'مزيل عرق', 'كريم', 'غسول', 'فيتامين', 'دواء',
    ],
  },
  {
    id: 'household',
    label: 'Household',
    emoji: '🧹',
    keywords: [
      'detergent', 'bleach', 'tissue', 'napkin', 'trash bag', 'garbage bag',
      'sponge', 'mop', 'cleaner', 'cleaning', 'laundry', 'dishwasher', 'broom',
      'paper towel', 'toilet paper', 'diaper', 'wipes', 'foil', 'plastic bag',
      'zip bag', 'candle', 'lighter', 'battery', 'light bulb', 'gloves',
      // Arabic
      'منظف', 'كلور', 'مناديل', 'حفاضات', 'إسفنجة', 'مسحوق غسيل', 'شمعة', 'بطارية',
    ],
  },
];

// Pre-compile ASCII keywords as word-boundary regexes; keep Arabic as plain strings.
const CATEGORIES = RAW.map((cat) => ({
  ...cat,
  patterns: cat.keywords.map((kw) =>
    /^[\x00-\x7F]+$/.test(kw)
      ? new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      : kw
  ),
}));

const OTHER = { id: 'other', label: 'Other', emoji: '🛒' };

export function getCategory(name) {
  const lower = name.toLowerCase();
  for (const cat of CATEGORIES) {
    for (const p of cat.patterns) {
      if (typeof p === 'string' ? lower.includes(p) : p.test(lower)) return cat;
    }
  }
  return OTHER;
}
