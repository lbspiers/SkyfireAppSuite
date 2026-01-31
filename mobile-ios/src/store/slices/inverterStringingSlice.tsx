import { createSlice } from "@reduxjs/toolkit";
// Removed unused Alert import that could cause issues

const initialState:any = {
    mttp1:{
        id:1,
        mttpvalue:1,
        panels:""
    },
    mttp2:{
        id:2,
        mttpvalue:1,
        panels:""
    },
    mttp3:{
        id:3,
        mttpvalue:1,
        panels:""
    },
    mttp4:{
        id:4,
        mttpvalue:1,
        panels:""
    },
    mttp5:{
        id:5,
        mttpvalue:1,
        panels:""
    },
    mttp6:{
        id:6,
        mttpvalue:1,
        panels:""
    },
};

const stringingSlice = createSlice({
  name: "InverterStringing",
  initialState,
  reducers: {
    setMttp1: (state:any, action) => {
      state.mttp1 = action.payload;
    },
    setMttp2: (state:any, action) => {
        state.mttp2 = action.payload;
    },
    setMttp3: (state:any, action) => {
        state.mttp3 = action.payload;
    },
    setMttp4: (state:any, action) => {
        state.mttp4 = action.payload;
    },
    setMttp5: (state:any, action) => {
        state.mttp5 = action.payload;
    },
    setMttp6: (state:any, action) => {
        state.mttp6 = action.payload;
    },
    resetInverterString: (state:any) =>{
        Object.assign(state, initialState);
        // Alternatively:
        // return { ...initialState };  
    }
 

  },
});

export const { 
    setMttp1,
    setMttp2,
    setMttp3,
    setMttp4,
    setMttp5,
    setMttp6,
    resetInverterString
  } = stringingSlice.actions;
export default stringingSlice.reducer;