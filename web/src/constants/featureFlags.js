export const FEATURE_FLAGS = {
  CANVAS_SITE_PLAN: 'ff_canvas_site_plan',
};

export const isFeatureEnabled = (flag) => localStorage.getItem(flag) === 'true';

export const toggleFeature = (flag) => {
  const current = isFeatureEnabled(flag);
  localStorage.setItem(flag, String(!current));
  return !current;
};

export const setFeature = (flag, enabled) => {
  localStorage.setItem(flag, String(enabled));
};

export const getAllFlags = () => {
  return Object.entries(FEATURE_FLAGS).reduce((acc, [, value]) => {
    acc[value] = isFeatureEnabled(value);
    return acc;
  }, {});
};

export const initFeatureFlags = () => {
  if (process.env.NODE_ENV === 'development') {
    Object.values(FEATURE_FLAGS).forEach(flag => {
      if (localStorage.getItem(flag) === null) {
        localStorage.setItem(flag, 'true');
      }
    });
  }
};

initFeatureFlags();
