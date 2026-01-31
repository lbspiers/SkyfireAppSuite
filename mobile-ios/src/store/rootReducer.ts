// src/store/rootReducer.ts
import { combineReducers } from "@reduxjs/toolkit";
import projectReducer from "./slices/projectSlice";

const rootReducer = combineReducers({
  project: projectReducer,
  // Add other slices here as needed
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
