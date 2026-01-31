import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ProjectInfo from '../ProjectInfo';
import * as projectService from '../../../api/project.service';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import useProjectContext from '../../../hooks/useProjectContext';

// Mock dependencies
jest.mock('../../../api/project.service');
jest.mock('react-native-toast-message');
jest.mock('@react-navigation/native');
jest.mock('../../../hooks/useProjectContext');
jest.mock('lodash', () => ({
  debounce: (fn: any) => {
    fn.cancel = jest.fn();
    return fn;
  },
}));

describe('ProjectInfo Component', () => {
  const mockNavigation = { navigate: jest.fn() };
  const mockProjectContext = {
    projectId: 'test-project-123',
    companyId: 'test-company-456',
    project: {
      details: {
        company_name: 'Test Company',
        installer_project_id: 'PROJ-001',
        customer_first_name: 'John',
        customer_last_name: 'Doe',
        project_notes: 'Test notes',
        site_survey_date: '2025-01-15',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue(mockNavigation);
    (useProjectContext as jest.Mock).mockReturnValue(mockProjectContext);
  });

  describe('Data Persistence', () => {
    it('should save project info when form is submitted', async () => {
      const mockResponse = { status: 200, data: { success: true } };
      (projectService.SaveProjectInfo as jest.Mock).mockResolvedValue(mockResponse);
      (projectService.UpdateProjectStatus as jest.Mock).mockResolvedValue(mockResponse);

      const { getByText, getByDisplayValue } = render(<ProjectInfo />);
      
      // Find and click submit button
      const submitButton = getByText('Submit');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        // Verify SaveProjectInfo was called with correct data
        expect(projectService.SaveProjectInfo).toHaveBeenCalledWith(
          'test-project-123',
          'test-company-456',
          expect.objectContaining({
            company_name: 'Test Company',
            installer_project_id: 'PROJ-001',
            customer_first_name: 'John',
            customer_last_name: 'Doe',
          })
        );
        
        // Verify status update was called
        expect(projectService.UpdateProjectStatus).toHaveBeenCalledWith(
          'test-project-123',
          'test-company-456',
          1
        );
        
        // Verify success toast was shown
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            text1: 'Success',
            text2: 'Project information saved successfully',
            type: 'success',
          })
        );
        
        // Verify navigation occurred
        expect(mockNavigation.navigate).toHaveBeenCalledWith('SiteScreens');
      });
    });

    it('should handle save errors gracefully', async () => {
      const errorMessage = 'Network error occurred';
      (projectService.SaveProjectInfo as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { getByText } = render(<ProjectInfo />);
      
      const submitButton = getByText('Submit');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        // Verify error toast was shown
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            text1: 'Error',
            text2: expect.stringContaining('Failed to save'),
            type: 'error',
          })
        );
        
        // Verify navigation did NOT occur
        expect(mockNavigation.navigate).not.toHaveBeenCalled();
      });
    });

    it('should show error when no project is selected', async () => {
      (useProjectContext as jest.Mock).mockReturnValue({
        projectId: null,
        companyId: 'test-company-456',
        project: null,
      });

      const { getByText } = render(<ProjectInfo />);
      
      const submitButton = getByText('Submit');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        // Verify error toast for no project
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            text1: 'Error',
            text2: 'No project selected. Please select a project first.',
            type: 'error',
          })
        );
        
        // Verify SaveProjectInfo was NOT called
        expect(projectService.SaveProjectInfo).not.toHaveBeenCalled();
      });
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should trigger auto-save when form values change', async () => {
      jest.useFakeTimers();
      
      const mockResponse = { status: 200, data: { success: true } };
      (projectService.SaveProjectInfo as jest.Mock).mockResolvedValue(mockResponse);

      const { getByDisplayValue } = render(<ProjectInfo />);
      
      // Find an input field and change its value
      const companyNameInput = getByDisplayValue('Test Company');
      
      await act(async () => {
        fireEvent.changeText(companyNameInput, 'Updated Company Name');
      });
      
      // Fast-forward time to trigger debounced auto-save
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        // Verify auto-save was triggered with updated data
        expect(projectService.SaveProjectInfo).toHaveBeenCalledWith(
          'test-project-123',
          'test-company-456',
          expect.objectContaining({
            company_name: 'Updated Company Name',
          })
        );
        
        // Verify auto-save toast was shown
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            text1: 'Auto-saved',
            text2: 'Changes saved automatically',
            type: 'success',
            position: 'bottom',
          })
        );
      });
      
      jest.useRealTimers();
    });

    it('should not auto-save on first render', async () => {
      jest.useFakeTimers();
      
      render(<ProjectInfo />);
      
      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Verify SaveProjectInfo was NOT called on initial render
      expect(projectService.SaveProjectInfo).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should not auto-save if values have not changed', async () => {
      jest.useFakeTimers();
      
      const { rerender } = render(<ProjectInfo />);
      
      // Re-render without changing values
      rerender(<ProjectInfo />);
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Verify SaveProjectInfo was NOT called
      expect(projectService.SaveProjectInfo).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator during save', async () => {
      let resolvePromise: any;
      const savePromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (projectService.SaveProjectInfo as jest.Mock).mockReturnValue(savePromise);

      const { getByText, queryByText } = render(<ProjectInfo />);
      
      const submitButton = getByText('Submit');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Check that button text changes to "Saving..."
      expect(queryByText('Saving...')).toBeTruthy();
      expect(queryByText('Submit')).toBeFalsy();

      // Resolve the save promise
      await act(async () => {
        resolvePromise({ status: 200, data: { success: true } });
      });

      await waitFor(() => {
        // Button should return to normal state
        expect(queryByText('Submit')).toBeTruthy();
        expect(queryByText('Saving...')).toBeFalsy();
      });
    });

    it('should show auto-saving indicator during auto-save', async () => {
      jest.useFakeTimers();
      
      let resolvePromise: any;
      const savePromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (projectService.SaveProjectInfo as jest.Mock).mockReturnValue(savePromise);

      const { getByDisplayValue, queryByText } = render(<ProjectInfo />);
      
      const companyNameInput = getByDisplayValue('Test Company');
      
      await act(async () => {
        fireEvent.changeText(companyNameInput, 'Updated Company');
      });
      
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Check for auto-saving indicator
      await waitFor(() => {
        expect(queryByText('Auto-saving...')).toBeTruthy();
      });

      // Resolve the save promise
      await act(async () => {
        resolvePromise({ status: 200, data: { success: true } });
      });

      await waitFor(() => {
        // Auto-saving indicator should disappear
        expect(queryByText('Auto-saving...')).toBeFalsy();
      });
      
      jest.useRealTimers();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields before submission', async () => {
      // Set up with empty project details
      (useProjectContext as jest.Mock).mockReturnValue({
        projectId: 'test-project-123',
        companyId: 'test-company-456',
        project: { details: {} },
      });

      const { getByText, getByLabelText } = render(<ProjectInfo />);
      
      const submitButton = getByText('Submit');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        // SaveProjectInfo should not be called if validation fails
        expect(projectService.SaveProjectInfo).not.toHaveBeenCalled();
      });
    });
  });
});