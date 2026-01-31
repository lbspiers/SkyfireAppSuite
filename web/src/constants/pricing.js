/**
 * Pricing Constants for Project Credits
 * Defines all pricing tiers and credit usage
 */

export const PROJECT_PRICING = {
  SINGLE: {
    id: 'single',
    name: 'Single Project',
    projects: 1,
    price: 150,
    pricePerProject: 150,
    savings: 0,
    savingsPercent: 0,
    badge: null,
    description: 'No commitment required',
  },
  STARTER: {
    id: 'starter',
    name: 'Starter Pack',
    projects: 10,
    price: 1250,
    pricePerProject: 125,
    savings: 0,
    savingsPercent: 0,
    badge: 'Standard Rate',
    description: 'Great for getting started',
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    projects: 25,
    price: 2875,
    pricePerProject: 115,
    savings: 375,
    savingsPercent: 8,
    badge: 'Most Popular',
    featured: true,
    description: 'Best for growing teams',
  },
  BUSINESS: {
    id: 'business',
    name: 'Business',
    projects: 50,
    price: 5250,
    pricePerProject: 105,
    savings: 1250,
    savingsPercent: 16,
    badge: 'Best Value',
    description: 'Scale your operations',
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    projects: 100,
    price: 9500,
    pricePerProject: 95,
    savings: 3000,
    savingsPercent: 24,
    badge: 'Maximum Savings',
    description: 'For high-volume installers',
  },
};

export const PROJECT_CREDITS = {
  STANDARD_RESIDENTIAL: { credits: 1, label: 'Standard Residential Design' },
  STORAGE_ADDON: { credits: 1, label: 'Storage System Add-on' },
  MULTI_INVERTER: { credits: 1, label: 'Multi-Inverter System' },
  COMMERCIAL: { credits: 3, label: 'Commercial Design' },
  PERMIT_PACKAGE: { credits: 0.5, label: 'Permit Package Add-on' },
  REVISION_PACKAGE: { credits: 0.5, label: 'Major Revision Package' },
};

// Helper to get all tiers as array
export const getAllTiers = () => Object.values(PROJECT_PRICING);

// Helper to format price
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};
