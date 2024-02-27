import { FETCH_CURRENT_AWARD, FETCH_MERKLE_ROOT, FETCH_NEXT_HALVE_PERIOD } from "../actions/types";

const initialState = {
  merkleRoot: null,
  currentAward: null,
  nextHalvePeriod: null,
};

export const distributorReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_MERKLE_ROOT:
      return {
        ...state,
        merkleRoot: action.payload,
      };

    case FETCH_CURRENT_AWARD:
      return {
        ...state,
        currentAward: action.payload,
      };

    case FETCH_NEXT_HALVE_PERIOD:
      return {
        ...state,
        nextHalvePeriod: action.payload,
      };

    default:
      return state;
  }
};
