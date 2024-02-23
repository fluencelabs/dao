import { ERROR_CLEANUP, SET_ERROR } from "../actions/types";

const initialState = {
  error: null,
};

export const errorReducer = (state = initialState, action) => {
  switch (action.type) {
    case ERROR_CLEANUP: {
      return initialState;
    }

    case SET_ERROR: {
      return {
        ...state,
        error: action.payload,
      };
    }

    default:
      return state;
  }
};
