// src/styles/gradient.tsx

import { LinearGradientProps } from "react-native-linear-gradient";

export interface GradientConfig
  extends Pick<LinearGradientProps, "colors" | "start" | "end"> {}

/** Orange Gradients */
export const ORANGE_TB: GradientConfig = {
  colors: ["#FD7332", "#B92011"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};
export const ORANGE_BT: GradientConfig = {
  colors: ["#FD7332", "#B92011"],
  start: { x: 0.5, y: 1 },
  end: { x: 0.5, y: 0 },
};
export const ORANGE_LR: GradientConfig = {
  colors: ["#FD7332", "#B92011"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};
export const LTORANGE: GradientConfig = {
  colors: ["#FD7332", "#FD7332"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};

/** Blue Gradients (horizontal) */
export const BLUE_LM: GradientConfig = {
  colors: ["#2E4161", "#213454"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};
export const BLUE_MD: GradientConfig = {
  colors: ["#213454", "#0C1F3F"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};
export const BLUE_TC: GradientConfig = {
  colors: ["#2E4161", "#213454", "#0C1F3F"],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};

/** Blue Gradients (vertical) */
export const BLUE_LM_TB: GradientConfig = {
  colors: ["#2E4161", "#213454"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};
export const BLUE_MD_TB: GradientConfig = {
  colors: ["#2E4161", "#0C1F3F"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};
export const BLUE_TC_TB: GradientConfig = {
  colors: ["#2E4161", "#213454", "#0C1F3F"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

export const BLUE_2C_BT: GradientConfig = {
  colors: ["#0C1F3F", "#2E4161"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

export const BLUE_LIGHT_MD_TB: GradientConfig = {
  colors: ["#2E4161", "#213454"], // light to mid (mid is average of light/dark)
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

export const BLUE_DASHBOARD_TB: GradientConfig = {
  colors: ["#213454", "#0C1F3F"], // continues from SmallHeader end to dark blue
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

/** Aggregate lookup and type */
export const Gradients = {
  ORANGE_TB,
  ORANGE_LR,
  ORANGE_BT,
  BLUE_LM,
  BLUE_MD,
  BLUE_TC,
  BLUE_LM_TB,
  BLUE_MD_TB,
  BLUE_TC_TB,
  BLUE_2C_BT,
  BLUE_LIGHT_MD_TB,
  BLUE_DASHBOARD_TB,
} as const;

export type GradientName = keyof typeof Gradients;

/** Optional helper for dynamic gradient selection */
export function getGradient(name: GradientName): GradientConfig {
  return Gradients[name];
}
