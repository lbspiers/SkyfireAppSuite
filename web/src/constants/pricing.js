// src/constants/pricing.js
// Project pricing tiers and billing constants

export const PROJECT_PRICING = {
  SINGLE: {
    label: 'Single Project',
    pricePerProject: 150,
    minProjects: 1,
    maxProjects: 1,
  },
  TIERS: [
    { id: 'tier_1', label: '1-10 Projects', pricePerProject: 150, minProjects: 1, maxProjects: 10 },
    { id: 'tier_2', label: '11-25 Projects', pricePerProject: 135, minProjects: 11, maxProjects: 25 },
    { id: 'tier_3', label: '26-50 Projects', pricePerProject: 120, minProjects: 26, maxProjects: 50 },
    { id: 'tier_4', label: '51-100 Projects', pricePerProject: 110, minProjects: 51, maxProjects: 100 },
    { id: 'tier_5', label: '100+ Projects', pricePerProject: 95, minProjects: 101, maxProjects: Infinity },
  ],
};

export const DEFAULT_PRICE = PROJECT_PRICING.SINGLE.pricePerProject;

export const getTierPrice = (projectCount) => {
  const tier = PROJECT_PRICING.TIERS.find(
    (t) => projectCount >= t.minProjects && projectCount <= t.maxProjects
  );
  return tier ? tier.pricePerProject : DEFAULT_PRICE;
};

export const formatPrice = (amount) => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatPriceCompact = (amount) => {
  if (amount === null || amount === undefined) return '$0';
  if (Number.isInteger(amount)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  }
  return formatPrice(amount);
};
