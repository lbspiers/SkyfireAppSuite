import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: any = {
  address: "",
  city: "",
  state: "",
  zip: "",
};

const authSlice = createSlice({
  name: "SiteInfo",
  initialState,
  reducers: {
    setSiteAddress(state, action: PayloadAction<any>) {
      state.address = action.payload;
    },
    setSiteCity(state, action: PayloadAction<any>) {
      state.city = action.payload;
    },
    setSiteState(state, action: PayloadAction<any>) {
      state.state = action.payload; // Fixed: was incorrectly setting city instead of state
    },
    setSiteZip(state, action: PayloadAction<any>) {
      state.zip = action.payload;
    },
    // Add more reducers as needed for other data you want to manage in your Redux store.
  },
});

export const {
  setSiteAddress,
  setSiteCity,
  setSiteState,
  setSiteZip,
  // Add more action creators as needed for other data you want to manage in your Redux store.
} = authSlice.actions;
export default authSlice.reducer;
