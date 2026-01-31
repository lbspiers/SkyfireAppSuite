// src/components/AhjStatusIndicator.tsx
import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { moderateScale, verticalScale } from "../utils/responsive";

export interface AhjStatus {
  loading: boolean;
  found: boolean;
  name?: string;
  error?: string;
}

interface AhjStatusIndicatorProps {
  status: AhjStatus;
  onRetry?: () => void;
  showRetryButton?: boolean;
  style?: any;
}

export const AhjStatusIndicator: React.FC<AhjStatusIndicatorProps> = ({
  status,
  onRetry,
  showRetryButton = false,
  style,
}) => {
  if (!status.loading && !status.found && !status.error) {
    return null; // Don't show anything if no status
  }

  return (
    <View style={[styles.container, style]}>
      {/* Loading State */}
      {status.loading && (
        <View style={styles.row}>
          <ActivityIndicator size="small" color="#FFA500" />
          <Text style={styles.loadingText}>Looking up AHJ information...</Text>
        </View>
      )}

      {/* Success State */}
      {status.found && status.name && (
        <View style={styles.row}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successText}>AHJ: {status.name}</Text>
        </View>
      )}

      {/* Error State */}
      {status.error && (
        <View style={styles.errorContainer}>
          <View style={styles.row}>
            <Text style={styles.errorIcon}>⚠</Text>
            <Text style={styles.errorText}>{status.error}</Text>
          </View>
          {showRetryButton && onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Retry AHJ Lookup</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: verticalScale(12),
    padding: moderateScale(12),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: moderateScale(8),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFA500",
    fontSize: moderateScale(13),
    marginLeft: moderateScale(8),
  },
  successIcon: {
    color: "#4CAF50",
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  successText: {
    color: "#4CAF50",
    fontSize: moderateScale(13),
    fontWeight: "600",
    marginLeft: moderateScale(8),
  },
  errorContainer: {
    alignItems: "flex-start",
  },
  errorIcon: {
    color: "#FF9800",
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  errorText: {
    color: "#FF9800",
    fontSize: moderateScale(13),
    marginLeft: moderateScale(8),
    flex: 1,
  },
  retryButton: {
    marginTop: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    backgroundColor: "rgba(255, 152, 0, 0.2)",
    borderRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: "#FF9800",
  },
  retryButtonText: {
    color: "#FF9800",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
});

export default AhjStatusIndicator;
