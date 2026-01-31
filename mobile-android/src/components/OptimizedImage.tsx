// src/components/OptimizedImage.tsx
// Progressive image loading component with fade-in effect and error handling

import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  ImageStyle,
  ViewStyle,
  StyleProp,
  Animated,
} from 'react-native';

interface Props {
  uri: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  fadeDuration?: number;
  showLoader?: boolean;
  loaderColor?: string;
  placeholderColor?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  uri,
  style,
  containerStyle,
  resizeMode = 'cover',
  fadeDuration = 300,
  showLoader = true,
  loaderColor = '#FFB02E',
  placeholderColor = 'rgba(255, 255, 255, 0.05)',
  onLoad,
  onError,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [opacity] = useState(new Animated.Value(0));

  const handleLoad = useCallback(() => {
    setLoading(false);

    // Fade in animation
    Animated.timing(opacity, {
      toValue: 1,
      duration: fadeDuration,
      useNativeDriver: true,
    }).start();

    onLoad?.();
  }, [opacity, fadeDuration, onLoad]);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
    onError?.();
  }, [onError]);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Placeholder background */}
      <View style={[styles.placeholder, { backgroundColor: placeholderColor }]} />

      {/* Loading indicator */}
      {loading && showLoader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={loaderColor} />
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <View style={styles.errorIconInner} />
          </View>
        </View>
      )}

      {/* Actual image */}
      {!error && (
        <Animated.Image
          source={{ uri }}
          style={[style, { opacity }]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
