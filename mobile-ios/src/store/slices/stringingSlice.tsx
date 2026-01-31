import { createSlice } from "@reduxjs/toolkit";

const initialState:any = {
 circuit1:'',
 circuit2:'',
 circuit3:'',
 circuit4:'',
 circuit5:'',
 circuit6:'',
 circuit7:'',
 circuit8:'',
 circuit9:'',

};

const stringingSlice = createSlice({
  name: "stringing",
  initialState,
  reducers: {
    setCircuit1: (state:any, action) => {
      state.circuit1 = action.payload;
    },
    setCircuit2: (state:any, action) => {
        state.circuit2 = action.payload;
    },
    setCircuit3: (state:any, action) => {
        state.circuit3 = action.payload;
      },
      setCircuit4: (state:any, action) => {
          state.circuit4 = action.payload;
      },
      setCircuit5: (state:any, action) => {
        state.circuit5 = action.payload;
      },
      setCircuit6: (state:any, action) => {
          state.circuit6 = action.payload;
      },
      setCircuit7: (state:any, action) => {
          state.circuit7 = action.payload;
        },
        setCircuit8: (state:any, action) => {
            state.circuit8 = action.payload;
        },
        setCircuit9: (state:any, action) => {
            state.circuit9 = action.payload;
        },
        resetStringData: (state:any) => {
          Object.assign(state, initialState);
        },
      
    

  },
});

export const { 
    setCircuit1,
    setCircuit2,
    setCircuit3,
    setCircuit4,
    setCircuit5,
    setCircuit6,
    setCircuit7,
    setCircuit8,
    setCircuit9,
    resetStringData,
  } = stringingSlice.actions;
export default stringingSlice.reducer;