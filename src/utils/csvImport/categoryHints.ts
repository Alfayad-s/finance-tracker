import type { Category, ImportRule, TransactionType } from '@/types'

const HINTS: { keywords: string[]; categoryId: string }[] = [
  {
    categoryId: 'cat-food',
    keywords: [
      'swiggy',
      'zomato',
      'blinkit',
      'zepto',
      'dunzo',
      'instamart',
      'bigbasket',
      'dominos',
      "domino's",
      'mcdonald',
      'burger king',
      'kfc',
      'subway',
      'starbucks',
      'barista',
      'cafe coffee',
      'eatclub',
    ],
  },
  {
    categoryId: 'cat-transport',
    keywords: [
      'uber',
      'olacabs',
      'ola cabs',
      'ola',
      'rapido',
      'irctc',
      'indian railway',
      'fastag',
      'redbus',
      'red bus',
      'metro',
      'bpcl',
      'hpcl',
      'iocl',
      'indian oil',
      'bharat petroleum',
      'hindustan petroleum',
      'petrol',
      'diesel',
      'parking',
      'indigo',
      'air india',
      'spicejet',
      'vistara',
    ],
  },
  {
    categoryId: 'cat-shopping',
    keywords: [
      'amazon',
      'flipkart',
      'myntra',
      'ajio',
      'nykaa',
      'meesho',
      'croma',
      'reliance digital',
      'dmart',
      'ikea',
      'uniqlo',
    ],
  },
  {
    categoryId: 'cat-bills',
    keywords: [
      'electricity',
      'bescom',
      'msedcl',
      'tata power',
      'adani electricity',
      'airtel',
      'jio',
      'bsnl',
      'vodafone',
      'broadband',
      'hathway',
      'act fibernet',
      'recharge',
      'indane',
      'hp gas',
      'water bill',
      'gas bill',
    ],
  },
  {
    categoryId: 'cat-housing',
    keywords: ['landlord', 'society maint', 'maintenance', 'house rent', 'rent'],
  },
  {
    categoryId: 'cat-health',
    keywords: [
      'pharmeasy',
      'netmeds',
      'medplus',
      'apollo',
      '1mg',
      'pharmacy',
      'hospital',
      'clinic',
      'practo',
      'diagnostic',
    ],
  },
  {
    categoryId: 'cat-entertainment',
    keywords: [
      'bookmyshow',
      'netflix',
      'spotify',
      'hotstar',
      'disney',
      'sony liv',
      'zee5',
      'prime video',
      'youtube',
      'pvr',
      'inox',
      'gaana',
    ],
  },
  {
    categoryId: 'cat-education',
    keywords: ['unacademy', 'coursera', 'skillshare', 'udemy', 'byju'],
  },
  {
    categoryId: 'cat-personal',
    keywords: ['cult.fit', 'cultfit', 'salon', 'spa', 'gym'],
  },
  {
    categoryId: 'cat-salary',
    keywords: ['payroll', 'salary', 'wages', 'stipend'],
  },
  {
    categoryId: 'cat-income-other',
    keywords: ['cashback', 'cash back', 'dividend', 'interest', 'refund', 'reversal'],
  },
  {
    categoryId: 'cat-freelance',
    keywords: ['freelance', 'consulting'],
  },
  {
    categoryId: 'cat-gift',
    keywords: ['gift'],
  },
]

const SORTED_HINTS = HINTS.flatMap((group) =>
  group.keywords.map((keyword) => ({ keyword, categoryId: group.categoryId })),
).toSorted((left, right) => right.keyword.length - left.keyword.length)

export function merchantKey(note: string): string {
  const cleaned = note
    .toUpperCase()
    .replace(/\b(UPI|IMPS|NEFT|RTGS|NACH|ACH|IFT|TFR|TO|FROM|BY|VIA)\b/g, ' ')
    .replace(/[0-9X*]{4,}/g, ' ')
    .replace(/[^A-Z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const tokens = cleaned.split(' ').filter((token) => token.length > 2).slice(0, 3)
  return tokens.join(' ') || cleaned.slice(0, 40)
}

export function suggestCategoryId(
  note: string,
  type: TransactionType,
  categories: Category[],
  rules: ImportRule[],
  categoryName?: string,
): string {
  const byName = categoryName ? categoryByName(categories, categoryName, type) : undefined
  if (byName) return byName

  const key = merchantKey(note)
  const haystack = note.toLowerCase()
  const fromRule = rules.find(
    (rule) =>
      (key && rule.keyword === key) ||
      (rule.keyword.length >= 3 && includesKeyword(haystack, rule.keyword)),
  )
  if (fromRule && categoryFits(categories, fromRule.categoryId, type)) {
    return fromRule.categoryId
  }

  const hint = SORTED_HINTS.find((item) => includesKeyword(haystack, item.keyword))
  if (hint && categoryFits(categories, hint.categoryId, type)) {
    return hint.categoryId
  }

  return fallbackCategoryId(categories, type)
}

export function fallbackCategoryId(categories: Category[], type: TransactionType): string {
  const preferred = type === 'income' ? 'cat-income-other' : 'cat-expense-other'
  if (categories.some((category) => category.id === preferred)) return preferred
  return (
    categories.find((category) => category.type === type || category.type === 'both')?.id ??
    categories[0]?.id ??
    ''
  )
}

function categoryByName(
  categories: Category[],
  name: string,
  type: TransactionType,
): string | undefined {
  const needle = name.trim().toLowerCase()
  if (!needle) return undefined
  return categories.find(
    (category) =>
      category.name.toLowerCase() === needle &&
      (category.type === type || category.type === 'both'),
  )?.id
}

function includesKeyword(haystack: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(haystack)
}

function categoryFits(categories: Category[], categoryId: string, type: TransactionType): boolean {
  const category = categories.find((item) => item.id === categoryId)
  if (!category) return false
  return category.type === type || category.type === 'both'
}
