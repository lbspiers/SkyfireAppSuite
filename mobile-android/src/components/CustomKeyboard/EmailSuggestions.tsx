// src/components/CustomKeyboard/EmailSuggestions.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, verticalScale } from '../../utils/responsive';
import { BLUE_2C_BT, ORANGE_TB } from '../../styles/gradient';

interface EmailSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  visible: boolean;
}

export default function EmailSuggestions({
  suggestions,
  onSelectSuggestion,
  visible,
}: EmailSuggestionsProps) {
  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {suggestions.slice(0, 6).map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onSelectSuggestion(suggestion)}
            style={styles.suggestionButton}
          >
            <LinearGradient
              colors={BLUE_2C_BT.colors}
              start={BLUE_2C_BT.start}
              end={BLUE_2C_BT.end}
              style={styles.suggestionGradient}
            >
              <Text style={styles.suggestionText} numberOfLines={1}>
                {suggestion}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: verticalScale(8),
    marginBottom: verticalScale(8),
  },
  scrollContainer: {
    paddingHorizontal: moderateScale(4),
  },
  suggestionButton: {
    marginHorizontal: moderateScale(4),
  },
  suggestionGradient: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#FD7332',
    minWidth: moderateScale(120),
    maxWidth: moderateScale(200),
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '500',
    textAlign: 'center',
  },
});