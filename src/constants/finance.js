export const CURRENCIES = ['USD', 'ZAR', 'EUR', 'GBP', 'KES', 'NGN', 'BWP', 'GHS', 'TZS', 'UGX'];

export const EXPENSE_CATEGORIES = [
  { label: 'Food', icon: 'fast-food-outline' },
  { label: 'Transport', icon: 'car-outline' },
  { label: 'Rent', icon: 'home-outline' },
  { label: 'Airtime/Data', icon: 'phone-portrait-outline' },
  { label: 'Shopping', icon: 'bag-outline' },
  { label: 'Entertainment', icon: 'film-outline' },
  { label: 'Health', icon: 'medical-outline' },
  { label: 'Other', icon: 'pricetag-outline' },
];

export const PAYMENT_METHODS = ['Cash', 'Debit card', 'Credit card', 'Bank transfer', 'Mobile money'];

export const normalizeListValue = (value) => value.trim().replace(/\s+/g, ' ');

export const addUniqueValue = (values, value) => {
  const normalized = normalizeListValue(value);
  if (!normalized) return values;
  const exists = values.some((item) => item.toLowerCase() === normalized.toLowerCase());
  return exists ? values : [...values, normalized];
};
