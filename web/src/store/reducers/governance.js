import {
  CLAIM_STATUS,
  DELEGATE_STATUS,
  GOV_CLEANUP,
  SET_CLAIM_STATUS,
  SET_DELEGATEE,
  STORE_PROOF
} from "../actions/types";

const initialState = {
  degelationStatus: null,
  delegatee: null,
  error: null,
  proposalCount: null,
  claimStatus: null,
  proofStatus: null,
  proof: "",
  alegibility: {
    isAlegible: false,
    checked: false,
  },
  githubOwnership: {
    isOwner: false,
    checked: false,
  },
  hasClaimed: {
    checked: false,
    hasClaimed: null,
  },
  values: {
    proof: null,
    key: null,
  },
};

export function governanceReducer(state = initialState, action) {
  switch (action.type) {
    case GOV_CLEANUP: {
      return initialState;
    }
    case DELEGATE_STATUS: {
      return {
        ...state,
        delegationStatus: action.payload,
      };
    }
    case SET_DELEGATEE: {
      return {
        ...state,
        delegatee: action.payload,
      };
    }
    case CLAIM_STATUS: {
      return {
        ...state,
        claimStatus: action.payload,
      };
    }
    case SET_CLAIM_STATUS: {
      return {
        ...state,
        hasClaimed: action.payload,
      };
    }
    case STORE_PROOF: {
      return {
        ...state,
        values: {
          ...state.values,
          proof: action.payload,
        },
      };
    }
    default:
      return state;
  }
}
