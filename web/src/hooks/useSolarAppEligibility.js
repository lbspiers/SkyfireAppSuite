import { useState, useEffect } from 'react';
import axios from '../config/axios';

/**
 * useSolarAppEligibility - Hook to check project eligibility for SolarAPP+ submission
 *
 * Connects to: GET /solarapp/project/${projectUuid}/eligibility
 *
 * @param {string} projectUuid - Project UUID to check eligibility for
 * @returns {Object} Eligibility data with loading/error states
 */
const useSolarAppEligibility = (projectUuid) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!projectUuid) {
      console.log('[useSolarAppEligibility] No projectUuid provided');
      setError('No project UUID provided');
      setLoading(false);
      return;
    }

    // Fetch eligibility data from API
    const fetchEligibility = async () => {
      console.log('[useSolarAppEligibility] Fetching eligibility for project:', projectUuid);
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`/solarapp/project/${projectUuid}/eligibility`);
        console.log('[useSolarAppEligibility] Response received:', response.data);

        // Response format: { status: "SUCCESS", data: { isEligible, percentComplete, sections, submission } }
        if (response.data.status === 'SUCCESS' && response.data.data) {
          setEligibilityData(response.data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('[useSolarAppEligibility] Error fetching eligibility:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch eligibility data');
      } finally {
        setLoading(false);
      }
    };

    fetchEligibility();
  }, [projectUuid, refreshTrigger]);

  // Calculate summary stats
  const getSummary = () => {
    if (!eligibilityData) {
      return {
        missingFields: [],
        completedFields: [],
        percentComplete: 0,
      };
    }

    const missingFields = [];
    const completedFields = [];

    Object.values(eligibilityData.sections).forEach(section => {
      section.fields.forEach(field => {
        if (field.status === 'complete') {
          completedFields.push(field.label);
        } else if (field.status === 'missing' || field.status === 'warning') {
          missingFields.push(field.label);
        }
      });
    });

    return {
      missingFields,
      completedFields,
      percentComplete: eligibilityData.percentComplete,
    };
  };

  return {
    isEligible: eligibilityData?.isEligible ?? false,
    sections: eligibilityData?.sections ?? {},
    ...getSummary(),
    loading,
    error,
    refetch: () => {
      console.log('[useSolarAppEligibility] Refetch triggered');
      // Trigger re-fetch by incrementing refresh trigger
      setRefreshTrigger(prev => prev + 1);
    },
  };
};

export default useSolarAppEligibility;
