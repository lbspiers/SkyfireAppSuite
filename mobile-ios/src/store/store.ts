import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import themeReducer from "./slices/themeSlice";
import profileReducer from "./slices/profileDataSlice";
import siteInfo from "./slices/googleMapSlice";
import projectReducer from "./slices/projectSlice";
import stringingReducer from './slices/stringingSlice'
import inverterstringingReducer from "./slices/inverterStringingSlice"
import passwordResetReducer from "./slices/passwordResetSlice"

const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    profile: profileReducer,
    project: projectReducer,
    site: siteInfo,
    stringing:stringingReducer,
    inverterStringing: inverterstringingReducer,  // add new slice here for inverter stringing feature  //
    passwordReset: passwordResetReducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Optimize middleware for better performance
      immutableCheck: {
        // Increase warning threshold to reduce middleware processing overhead
        warnAfter: 128,
        // Ignore paths with known large data structures
        ignoredPaths: [
          'project.updateProjectDetails',
          'project.systemDetails',
          'project.projectDetails.data.system_details'
        ]
      },
      serializableCheck: {
        // Increase warning threshold
        warnAfter: 128,
        // Ignore specific paths that might contain non-serializable data
        ignoredActions: ['project/setUpdateProjectDetails'],
        ignoredPaths: ['project.currentProject.system_details']
      }
    }),
  devTools: (typeof __DEV__ !== 'undefined' && __DEV__) ? {
    // Limit the amount of actions stored in DevTools for better performance
    actionSanitizer: (action: any) => ({
      ...action,
      // Truncate large payloads in DevTools
      payload: action.payload && JSON.stringify(action.payload).length > 10000
        ? '<<LARGE_PAYLOAD>>'
        : action.payload
    }),
    stateSanitizer: (state: any) => state
  } : false
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
