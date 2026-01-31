// src/hooks/useAhjPolling.ts
import { useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { GetProjectDetails } from "../api/project.service";
import { setProject } from "../store/slices/projectSlice";

export interface AhjStatus {
  loading: boolean;
  found: boolean;
  name?: string;
  error?: string;
}

interface UseAhjPollingReturn {
  ahjStatus: AhjStatus;
  startAhjPolling: (
    projectUuid: string,
    options?: PollingOptions
  ) => Promise<boolean>;
  stopAhjPolling: () => void;
  resetAhjStatus: () => void;
}

interface PollingOptions {
  maxAttempts?: number;
  intervalMs?: number;
  showToasts?: boolean;
  onSuccess?: (ahjName: string) => void;
  onTimeout?: () => void;
  onError?: (error: string) => void;
}

export const useAhjPolling = (): UseAhjPollingReturn => {
  const dispatch = useDispatch();
  const companyProfile = useSelector((s: any) => s.profile.profile);

  const [ahjStatus, setAhjStatus] = useState<AhjStatus>({
    loading: false,
    found: false,
  });

  // Use number for React Native timer IDs
  const pollingRef = useRef<{
    isPolling: boolean;
    timeoutId?: number;
  }>({ isPolling: false });

  const stopAhjPolling = useCallback(() => {
    pollingRef.current.isPolling = false;
    if (pollingRef.current.timeoutId) {
      clearTimeout(pollingRef.current.timeoutId);
      pollingRef.current.timeoutId = undefined;
    }
  }, []);

  const resetAhjStatus = useCallback(() => {
    stopAhjPolling();
    setAhjStatus({ loading: false, found: false });
  }, [stopAhjPolling]);

  const startAhjPolling = useCallback(
    async (
      projectUuid: string,
      options: PollingOptions = {}
    ): Promise<boolean> => {
      const {
        maxAttempts = 15,
        intervalMs = 2000,
        showToasts = true,
        onSuccess,
        onTimeout,
        onError,
      } = options;

      // Stop any existing polling
      stopAhjPolling();

      // Reset status and start loading
      setAhjStatus({ loading: true, found: false });
      pollingRef.current.isPolling = true;

      let attempts = 0;

      const poll = async (): Promise<boolean> => {
        // Check if polling was stopped
        if (!pollingRef.current.isPolling) {
          return false;
        }

        try {
          console.log(
            `AHJ polling attempt ${
              attempts + 1
            }/${maxAttempts} for project ${projectUuid}`
          );

          const response = await GetProjectDetails(
            projectUuid,
            companyProfile.company.uuid
          );

          if (response.status === 200 && response.data.data) {
            const project = response.data.data;

            // Check if AHJ information has been populated
            if (project.site?.ahj && project.site.ahj.trim() !== "") {
              const ahjName = project.site.ahj.trim();

              setAhjStatus({
                loading: false,
                found: true,
                name: ahjName,
              });

              // Update the project in Redux store
              dispatch(setProject(project));

              if (showToasts) {
                Toast.show({
                  text1: `AHJ Found: ${ahjName}`,
                  type: "success",
                  visibilityTime: 4000,
                });
              }

              // Call success callback
              if (onSuccess) {
                onSuccess(ahjName);
              }

              pollingRef.current.isPolling = false;
              return true; // Success
            }
          }

          attempts++;

          // Check if we've exceeded max attempts
          if (attempts >= maxAttempts) {
            const errorMsg = "AHJ lookup timed out";

            setAhjStatus({
              loading: false,
              found: false,
              error: errorMsg,
            });

            if (showToasts) {
              Toast.show({
                text1: "AHJ lookup is taking longer than expected",
                text2: "You can check back later or proceed without AHJ info",
                type: "info",
                visibilityTime: 5000,
              });
            }

            if (onTimeout) {
              onTimeout();
            }

            pollingRef.current.isPolling = false;
            return false;
          }

          // Schedule next attempt using React Native's setTimeout
          if (pollingRef.current.isPolling) {
            pollingRef.current.timeoutId = setTimeout(() => {
              if (pollingRef.current.isPolling) {
                poll();
              }
            }, intervalMs) as any;
          }

          return false; // Continue polling
        } catch (error) {
          console.error("Error polling for AHJ results:", error);
          attempts++;

          if (attempts >= maxAttempts || !pollingRef.current.isPolling) {
            const errorMsg = "Failed to check AHJ status";

            setAhjStatus({
              loading: false,
              found: false,
              error: errorMsg,
            });

            if (onError) {
              onError(errorMsg);
            }

            pollingRef.current.isPolling = false;
            return false;
          }

          // Schedule retry
          if (pollingRef.current.isPolling) {
            pollingRef.current.timeoutId = setTimeout(() => {
              if (pollingRef.current.isPolling) {
                poll();
              }
            }, intervalMs) as any;
          }

          return false;
        }
      };

      // Start polling
      return poll();
    },
    [dispatch, companyProfile.company.uuid, stopAhjPolling]
  );

  return {
    ahjStatus,
    startAhjPolling,
    stopAhjPolling,
    resetAhjStatus,
  };
};
