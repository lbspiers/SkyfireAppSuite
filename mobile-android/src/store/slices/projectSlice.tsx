import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// 🧠 Async thunk for generating a project with proper error handling
export const generateProject = createAsyncThunk(
  "project/generateProject",
  async (projectId: string) => {
    try {
      // Validate projectId before making request
      if (!projectId || typeof projectId !== 'string') {
        throw new Error('Invalid project ID provided');
      }
      
      const baseUrl = process.env.API_BASE_URL || "https://api.skyfireapp.io";
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(
        `${baseUrl}/automation/generateAutomation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ project_id: projectId }),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);

      // Grab raw response in case it's HTML or not valid JSON
      const text = await response.text();

      try {
        const data = JSON.parse(text);

        if (!response.ok) {
          throw new Error(data?.error || `Failed to generate project (${response.status})`);
        }

        return data;
      } catch (parseErr) {
        // ⛔ This catches HTML, 404 pages, and server crash responses
        console.error('Failed to parse server response:', parseErr);
        throw new Error("Invalid server response: " + text.slice(0, 80));
      }
    } catch (err: any) {
      // Handle network errors, timeouts, and other issues
      if (err.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond');
      }
      // Re-throw the error with proper message
      throw new Error(err.message || 'Failed to generate project');
    }
  }
);

// 🔧 Initial state
const initialState = {
  currentProject: null,
  siteInfo: null,
  projectDetails: null,
  updateProjectDetails: null,
  lastDataRefresh: 0, // Timestamp to trigger data reloads in hooks
};

// 📦 Slice definition
const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProject: (state, action) => {
      state.currentProject = action.payload;
    },
    setProjectDetails: (state, action) => {
      state.projectDetails = action.payload;
    },
    clearProject: (state) => {
      state.currentProject = null;
    },
    projectSiteInfo: (state, action) => {
      state.siteInfo = action.payload;
    },
    setUpdateProjectDetails: (state, action) => {
      state.updateProjectDetails = action.payload;
    },
    triggerDataRefresh: (state) => {
      state.lastDataRefresh = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder.addCase(generateProject.fulfilled, (state, action) => {
      console.log("✅ Project generated successfully:", action.payload);
    });
    builder.addCase(generateProject.rejected, (_, action) => {
      console.error("❌ Project generation failed:", action.error.message);
    });
  },
});

// 🔎 Utility Selector with defensive checks
export const getEquipmentSetByType = (state: any, title: any) => {
  try {
    // Add multiple defensive checks to prevent crashes
    if (!state || !state.project) return null;
    if (!state.project.updateProjectDetails) return null;
    if (!state.project.updateProjectDetails.equipment_sets) return null;
    if (!Array.isArray(state.project.updateProjectDetails.equipment_sets)) return null;
    
    return state.project.updateProjectDetails.equipment_sets.find(
      (equipmentSet: any) => equipmentSet && equipmentSet.label === title
    );
  } catch (error) {
    console.warn('Error in getEquipmentSetByType selector:', error);
    return null;
  }
};

// 🎯 Export actions and reducer
export const {
  setProject,
  clearProject,
  projectSiteInfo,
  setProjectDetails,
  setUpdateProjectDetails,
  triggerDataRefresh,
} = projectSlice.actions;

export default projectSlice.reducer;
