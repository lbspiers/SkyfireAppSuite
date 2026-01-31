// Password Strength Indicator Component
// Visual strength meter with animated progress and detailed requirements

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text as RNText,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {
  PasswordStrength,
  PasswordRequirement,
} from '../utils/passwordResetTypes';
import {
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
} from '../utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  strength: PasswordStrength;
  animated?: boolean;
  showRequirements?: boolean;
  showFeedback?: boolean;
  style?: ViewStyle;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  strength,
  animated = true,
  showRequirements = true,
  showFeedback = true,
  style,
}) => {
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const requirementAnims = useRef<{ [key: string]: Animated.Value }>({});

  // Initialize requirement animations
  useEffect(() => {
    strength.requirements.forEach((req) => {
      if (!requirementAnims.current[req.id]) {
        requirementAnims.current[req.id] = new Animated.Value(0);
      }
    });
  }, [strength.requirements]);

  // Animate progress bar
  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: strength.score / 4, // Normalize to 0-1
        duration: 500,
        useNativeDriver: false,
      }).start();

      // Fade in the whole component
      Animated.timing(fadeAnim, {
        toValue: password.length > 0 ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      progressAnim.setValue(strength.score / 4);
      fadeAnim.setValue(password.length > 0 ? 1 : 0);
    }
  }, [strength.score, password.length, animated]);

  // Animate requirements
  useEffect(() => {
    if (animated) {
      strength.requirements.forEach((req) => {
        const anim = requirementAnims.current[req.id];
        if (anim) {
          Animated.timing(anim, {
            toValue: req.isMet ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }
      });
    } else {
      strength.requirements.forEach((req) => {
        const anim = requirementAnims.current[req.id];
        if (anim) {
          anim.setValue(req.isMet ? 1 : 0);
        }
      });
    }
  }, [strength.requirements, animated]);

  // Get strength colors
  const getStrengthColors = (score: number): string[] => {
    switch (score) {
      case 0:
        return ['#FF4444', '#CC3333'];
      case 1:
        return ['#FF8800', '#CC6600'];
      case 2:
        return ['#FFCC00', '#CC9900'];
      case 3:
        return ['#88CC00', '#66AA00'];
      case 4:
        return ['#00AA00', '#008800'];
      default:
        return ['#CCCCCC', '#999999'];
    }
  };

  // Render progress bar
  const renderProgressBar = () => {
    const strengthColors = getStrengthColors(strength.score);

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={strengthColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <View style={styles.strengthLabelContainer}>
          <RNText style={[styles.strengthLabel, { color: getPasswordStrengthColor(strength.score) }]}>
            {getPasswordStrengthLabel(strength.score)}
          </RNText>
        </View>
      </View>
    );
  };

  // Render requirements list
  const renderRequirements = () => {
    if (!showRequirements) return null;

    return (
      <View style={styles.requirementsContainer}>
        <RNText style={styles.requirementsTitle}>Password Requirements:</RNText>
        {strength.requirements.map((req) => {
          const anim = requirementAnims.current[req.id] || new Animated.Value(0);

          return (
            <Animated.View
              key={req.id}
              style={[
                styles.requirementItem,
                {
                  backgroundColor: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(255, 255, 255, 0.05)', 'rgba(76, 175, 80, 0.1)'],
                  }),
                  borderColor: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(76, 175, 80, 0.3)'],
                  }),
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.requirementIcon,
                  {
                    backgroundColor: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(255, 255, 255, 0.1)', '#4CAF50'],
                    }),
                    transform: [
                      {
                        scale: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Animated.Text
                  style={[
                    styles.requirementIconText,
                    {
                      opacity: anim,
                    },
                  ]}
                >
                  ✓
                </Animated.Text>
              </Animated.View>

              <View style={styles.requirementTextContainer}>
                <RNText
                  style={[
                    styles.requirementText,
                    req.isMet && styles.requirementTextMet,
                    req.isRequired && !req.isMet && styles.requirementTextRequired,
                  ]}
                >
                  {req.description}
                </RNText>
                {req.isRequired && (
                  <RNText style={styles.requiredLabel}>Required</RNText>
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  // Render feedback messages
  const renderFeedback = () => {
    if (!showFeedback || strength.feedback.length === 0) return null;

    return (
      <View style={styles.feedbackContainer}>
        <RNText style={styles.feedbackTitle}>💡 Tips:</RNText>
        {strength.feedback.map((message, index) => (
          <View key={index} style={styles.feedbackItem}>
            <RNText style={styles.feedbackText}>• {message}</RNText>
          </View>
        ))}
      </View>
    );
  };

  if (password.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {renderProgressBar()}
      {renderRequirements()}
      {renderFeedback()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  strengthLabelContainer: {
    alignItems: 'center',
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  requirementsContainer: {
    marginBottom: 16,
  },
  requirementsTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  requirementIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requirementIconText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requirementTextContainer: {
    flex: 1,
  },
  requirementText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    lineHeight: 18,
  },
  requirementTextMet: {
    color: '#4CAF50',
    textDecorationLine: 'line-through',
    opacity: 0.8,
  },
  requirementTextRequired: {
    color: '#FFF',
    fontWeight: '500',
  },
  requiredLabel: {
    color: '#FD7332',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  feedbackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  feedbackTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  feedbackItem: {
    marginBottom: 4,
  },
  feedbackText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default PasswordStrengthIndicator;