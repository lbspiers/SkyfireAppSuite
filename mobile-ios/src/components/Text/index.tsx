// src/components/Text/index.tsx
// RESPONSIVE TEXT COMPONENT - Automatically scales fonts across devices

import React from 'react';
import { Text as RNText, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useResponsive } from '../../utils/responsive-v2';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'bodyLarge' | 'label' | 'caption';

export interface ResponsiveTextProps extends TextProps {
  /**
   * Text variant (h1, h2, h3, body, bodyLarge, label, caption)
   * Determines base font size and styling
   */
  variant?: TextVariant;

  /**
   * Whether to scale font size responsively (default: true)
   * Set to false to use exact font size from style prop
   */
  scaleFontSize?: boolean;

  /**
   * Children (text content)
   */
  children?: React.ReactNode;
}

/**
 * Responsive Text Component
 *
 * Automatically scales font sizes across different device sizes while maintaining
 * readability and proper hierarchy.
 *
 * Usage:
 *   <Text variant="h1">Heading</Text>
 *   <Text variant="body">Body text</Text>
 *   <Text variant="caption">Small text</Text>
 *   <Text style={{fontSize: 20}}>Custom size (scaled)</Text>
 *   <Text scaleFontSize={false} style={{fontSize: 20}}>Exact 20px</Text>
 */
export default function Text({
  variant = 'body',
  scaleFontSize = true,
  style,
  children,
  ...props
}: ResponsiveTextProps) {
  const { fontSize: responsiveFontSize, deviceClass } = useResponsive();

  // Default font sizes per variant (at baseline 375x667)
  const variantFontSizes: Record<TextVariant, number> = {
    h1: 28,
    h2: 22,
    h3: 18,
    body: 16,
    bodyLarge: 18,
    label: 14,
    caption: 12,
  };

  // Default font weights per variant
  const variantFontWeights: Record<TextVariant, TextStyle['fontWeight']> = {
    h1: '700',
    h2: '700',
    h3: '700',
    body: '400',
    bodyLarge: '400',
    label: '600',
    caption: '400',
  };

  // Extract fontSize from style if provided
  const flatStyle = StyleSheet.flatten(style);
  const customFontSize = flatStyle?.fontSize as number | undefined;
  const customFontWeight = flatStyle?.fontWeight;

  // Determine final font size
  const baseSize = customFontSize ?? variantFontSizes[variant];
  const computedFontSize = scaleFontSize
    ? responsiveFontSize(baseSize)
    : baseSize;

  // Determine final font weight
  const computedFontWeight = customFontWeight ?? variantFontWeights[variant];

  return (
    <RNText
      {...props}
      style={[
        {
          fontSize: computedFontSize,
          fontWeight: computedFontWeight,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

// Named exports for convenience
export { Text };
export const H1 = (props: Omit<ResponsiveTextProps, 'variant'>) => <Text variant="h1" {...props} />;
export const H2 = (props: Omit<ResponsiveTextProps, 'variant'>) => <Text variant="h2" {...props} />;
export const H3 = (props: Omit<ResponsiveTextProps, 'variant'>) => <Text variant="h3" {...props} />;
export const Body = (props: Omit<ResponsiveTextProps, 'variant'>) => <Text variant="body" {...props} />;
export const BodyLarge = (props: Omit<ResponsiveTextProps, 'variant'>) => <Text variant="bodyLarge" {...props} />;
export const Label = (props: Omit<ResponsiveTextProps, 'variant'>) => <Text variant="label" {...props} />;
export const Caption = (props: Omit<ResponsiveTextProps, 'variant'>) => <Text variant="caption" {...props} />;

/**
 * MIGRATION GUIDE:
 *
 * OLD (simple passthrough - no scaling):
 * import Text from './components/Text';
 * <Text style={{fontSize: 24}}>Hello</Text>  // Always 24px
 *
 * NEW (responsive by default):
 * import Text from './components/Text';
 * <Text variant="h1">Hello</Text>  // Scales based on device
 * <Text style={{fontSize: 24}}>Hello</Text>  // Scales 24px responsively
 * <Text scaleFontSize={false} style={{fontSize: 24}}>Hello</Text>  // Exact 24px
 *
 * VARIANTS:
 * <Text variant="h1">Large heading</Text>         // 28px base
 * <Text variant="h2">Medium heading</Text>        // 22px base
 * <Text variant="h3">Small heading</Text>         // 18px base
 * <Text variant="body">Normal text</Text>         // 16px base (default)
 * <Text variant="bodyLarge">Large body</Text>     // 18px base
 * <Text variant="label">Label/button text</Text>  // 14px base
 * <Text variant="caption">Small text</Text>       // 12px base
 *
 * CONVENIENCE COMPONENTS:
 * import { H1, H2, Body, Caption } from './components/Text';
 * <H1>Heading</H1>
 * <Body>Body text</Body>
 * <Caption>Small text</Caption>
 */
