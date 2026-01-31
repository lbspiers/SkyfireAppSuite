import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  profile: any;
  companyAddress: any;
}

const initialState: AuthState = {
 profile:{},
 companyAddress:{}
};

const authSlice = createSlice({
  name: 'Profile',
  initialState,
  reducers: {
    setProfileOrCompanyData(state, action: PayloadAction<any>) {
      state.profile = action.payload;
    },
    setCompanyAddress(state, action: PayloadAction<any>) {
      state.companyAddress = action.payload;
    },
 
    // Add more reducers as needed for other data you want to manage in your Redux store.
 
    
  },
});

export const { setProfileOrCompanyData,setCompanyAddress } = authSlice.actions;
export default authSlice.reducer;