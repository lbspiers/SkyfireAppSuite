// src/styles/gradient.js
// Web-compatible gradient definitions ported from mobile app

import logger from '../services/devLogger';

/**
 * Converts React Native gradient config to CSS linear-gradient string
 * @param {Object} config - Gradient configuration
 * @param {string[]} config.colors - Array of color strings
 * @param {Object} config.start - Start coordinates {x, y}
 * @param {Object} config.end - End coordinates {x, y}
 * @returns {string} CSS linear-gradient string
 */
export const toCSSGradient = (config) => {
  const { colors, start, end } = config;

  // Calculate angle from start/end coordinates
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

  return `linear-gradient(${angle}deg, ${colors.join(', ')})`;
};

/** Orange Gradients */
export const ORANGE_TB = {
  colors: ["#FD7332", "#B92011"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};
export const ORANGE_BT = {
  colors: ["#FD7332", "#B92011"],
  start: { x: 0.5, y: 1 },
  end: { x: 0.5, y: 0 },
};
export const ORANGE_LR = {
  colors: ["#FD7332", "#B92011"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};
export const LTORANGE = {
  colors: ["#FD7332", "#FD7332"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};
export const RED_TO_ORANGE_LR = {
  colors: ["#B92011", "#FD7332"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};
export const ORANGE_TO_RED_LR = {
  colors: ["#FD7332", "#B92011"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};

/** Blue Gradients (horizontal) */
export const BLUE_LM = {
  colors: ["#2E4161", "#213454"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};
export const BLUE_MD = {
  colors: ["#213454", "#0C1F3F"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};
export const BLUE_TC = {
  colors: ["#2E4161", "#213454", "#0C1F3F"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};

/** Blue Gradients (vertical) */
export const BLUE_LM_TB = {
  colors: ["#2E4161", "#213454"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};
export const BLUE_MD_TB = {
  colors: ["#2E4161", "#0C1F3F"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};
export const BLUE_TC_TB = {
  colors: ["#2E4161", "#213454", "#0C1F3F"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

export const BLUE_2C_BT = {
  colors: ["#0C1F3F", "#2E4161"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

export const BLUE_LIGHT_MD_TB = {
  colors: ["#2E4161", "#213454"], // light to mid (mid is average of light/dark)
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

export const BLUE_DASHBOARD_TB = {
  colors: ["#213454", "#0C1F3F"], // continues from SmallHeader end to dark blue
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

/** Blue to Orange Gradients */
export const BLUE_TO_ORANGE_LR = {
  colors: ["#2E4161", "#FD7332", "#B92011"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};

export const BLUE_TO_ORANGE_TB = {
  colors: ["#0C1F3F", "#2E4161", "#FD7332", "#B92011"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

/** Aggregate lookup */
export const Gradients = {
  ORANGE_TB,
  ORANGE_LR,
  ORANGE_BT,
  LTORANGE,
  RED_TO_ORANGE_LR,
  ORANGE_TO_RED_LR,
  BLUE_LM,
  BLUE_MD,
  BLUE_TC,
  BLUE_LM_TB,
  BLUE_MD_TB,
  BLUE_TC_TB,
  BLUE_2C_BT,
  BLUE_LIGHT_MD_TB,
  BLUE_DASHBOARD_TB,
  BLUE_TO_ORANGE_LR,
  BLUE_TO_ORANGE_TB,
};

/**
 * Get gradient by name and convert to CSS
 * @param {string} name - Gradient name from Gradients object
 * @returns {string} CSS linear-gradient string
 */
export const getGradient = (name) => {
  const config = Gradients[name];
  if (!config) {
    logger.warn('General', `Gradient "${name}" not found. Falling back to ORANGE_LR.`);
    return toCSSGradient(ORANGE_LR);
  }
  return toCSSGradient(config);
};

// Pre-computed CSS gradients for convenience
export const CSS_GRADIENTS = {
  ORANGE_TB: toCSSGradient(ORANGE_TB),
  ORANGE_BT: toCSSGradient(ORANGE_BT),
  ORANGE_LR: toCSSGradient(ORANGE_LR),
  LTORANGE: toCSSGradient(LTORANGE),
  RED_TO_ORANGE_LR: toCSSGradient(RED_TO_ORANGE_LR),
  ORANGE_TO_RED_LR: toCSSGradient(ORANGE_TO_RED_LR),
  BLUE_LM: toCSSGradient(BLUE_LM),
  BLUE_MD: toCSSGradient(BLUE_MD),
  BLUE_TC: toCSSGradient(BLUE_TC),
  BLUE_LM_TB: toCSSGradient(BLUE_LM_TB),
  BLUE_MD_TB: toCSSGradient(BLUE_MD_TB),
  BLUE_TC_TB: toCSSGradient(BLUE_TC_TB),
  BLUE_2C_BT: toCSSGradient(BLUE_2C_BT),
  BLUE_LIGHT_MD_TB: toCSSGradient(BLUE_LIGHT_MD_TB),
  BLUE_DASHBOARD_TB: toCSSGradient(BLUE_DASHBOARD_TB),
  BLUE_TO_ORANGE_LR: toCSSGradient(BLUE_TO_ORANGE_LR),
  BLUE_TO_ORANGE_TB: toCSSGradient(BLUE_TO_ORANGE_TB),
};
