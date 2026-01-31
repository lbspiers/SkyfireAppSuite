// src/components/StreetViewAnalyticsTest.tsx
// Test component for validating Street View Analytics integration

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useStreetViewCapture } from '../hooks/useStreetViewCapture';

interface Props {
  projectId?: string;
  companyId?: string;
}

export const StreetViewAnalyticsTest: React.FC<Props> = ({
  projectId = 'test-project-id',
  companyId = 'test-company-id',
}) => {
  const {
    captureStreetViewAnalytics,
    isCapturing,
    progress,
    error,
    lastCapturedData,
    clearError,
  } = useStreetViewCapture();

  const [testAddress, setTestAddress] = useState('27913 N. 23rd Dr, Phoenix, AZ 85085');

  const handleTestCapture = async () => {
    clearError();

    try {
      const result = await captureStreetViewAnalytics({
        projectId,
        companyId,
        address: testAddress,
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85085',
      });

      console.log('Street View Analytics Test Result:', result);
    } catch (error) {
      console.error('Test capture error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Street View Analytics Test</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Configuration</Text>
        <Text style={styles.label}>Test Address:</Text>
        <Text style={styles.value}>{testAddress}</Text>
        <Text style={styles.label}>Project ID:</Text>
        <Text style={styles.value}>{projectId}</Text>
        <Text style={styles.label}>Company ID:</Text>
        <Text style={styles.value}>{companyId}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isCapturing && styles.buttonDisabled]}
        onPress={handleTestCapture}
        disabled={isCapturing}
      >
        {isCapturing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Test Analytics Capture</Text>
        )}
      </TouchableOpacity>

      {progress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <Text style={styles.progressText}>
            Stage: {progress.stage}
          </Text>
          <Text style={styles.progressText}>
            Progress: {progress.progress}%
          </Text>
          <Text style={styles.progressText}>
            Message: {progress.message}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorSection}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearError}>
            <Text style={styles.clearButtonText}>Clear Error</Text>
          </TouchableOpacity>
        </View>
      )}

      {lastCapturedData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Captured Data</Text>

          <Text style={styles.subsectionTitle}>Geocoding:</Text>
          <Text style={styles.dataText}>
            Address: {lastCapturedData.geocoding.formattedAddress}
          </Text>
          <Text style={styles.dataText}>
            Location: {lastCapturedData.geocoding.location.lat.toFixed(6)}, {lastCapturedData.geocoding.location.lng.toFixed(6)}
          </Text>
          <Text style={styles.dataText}>
            Accuracy: {lastCapturedData.geocoding.locationType}
          </Text>

          <Text style={styles.subsectionTitle}>Street View:</Text>
          <Text style={styles.dataText}>
            Status: {lastCapturedData.streetView.status}
          </Text>
          {lastCapturedData.streetView.pano_id && (
            <>
              <Text style={styles.dataText}>
                Panorama ID: {lastCapturedData.streetView.pano_id}
              </Text>
              <Text style={styles.dataText}>
                Date: {lastCapturedData.streetView.date || 'Unknown'}
              </Text>
              {lastCapturedData.streetView.location && (
                <Text style={styles.dataText}>
                  Camera: {lastCapturedData.streetView.location.lat.toFixed(6)}, {lastCapturedData.streetView.location.lng.toFixed(6)}
                </Text>
              )}
            </>
          )}

          <Text style={styles.subsectionTitle}>Analytics:</Text>
          <Text style={styles.dataText}>
            Optimal Heading: {lastCapturedData.analytics.optimalHeading}°
          </Text>
          <Text style={styles.dataText}>
            Calculated Bearing: {lastCapturedData.analytics.calculatedBearing.toFixed(2)}°
          </Text>
          <Text style={styles.dataText}>
            Data Quality Score: {lastCapturedData.analytics.dataQualityScore}/10
          </Text>
          <Text style={styles.dataText}>
            Heading Confidence: {lastCapturedData.analytics.headingConfidence}
          </Text>
          <Text style={styles.dataText}>
            Street View Available: {lastCapturedData.analytics.streetViewAvailable ? 'Yes' : 'No'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#555',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  dataText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    paddingLeft: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  errorSection: {
    backgroundColor: '#ffebee',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderColor: '#f44336',
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});