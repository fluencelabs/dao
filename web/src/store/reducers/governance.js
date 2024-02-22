import {
    PROPOSAL_CREATED,
    DELEGATE_STATUS,
    SET_DELEGATEE,
    SET_PROPOSAL_COUNT,
    CLAIM_STATUS,
    SET_ALEGIBILITY,
    SET_LOCAL_PROOF,
    SET_OWNERSHIP,
    SET_CLAIM_STATUS,
    STORE_PROOF,
    STORE_KEY,
    STORE_DELEGATEE,
    GOV_CLEANUP
} from "../actions/types"

const initialState = {
    degelationStatus: null,
    delegatee: null,
    error: null,
    proposalCount: null,
    claimStatus: null,
    proofStatus: null,
    proof: '',
    alegibility: {
        isAlegible: false,
        checked: false
    },
    githubOwnership: {
        isOwner: false,
        checked: false
    },
    hasClaimed: {
        checked: false,
        hasClaimed: null
    },
    values: {
        proof: null,
        delegatee: null,
        key: null
    }
}

export function governanceReducer(state = initialState, action) {
    switch (action.type) {
        case GOV_CLEANUP: {
            return initialState
        }

        case PROPOSAL_CREATED:
            return {
                ...state,
                proposals: [...state.proposals, action.payload]
            }
        case DELEGATE_STATUS: {
            return {
                ...state,
                delegationStatus: action.payload
            }
        }
        case SET_DELEGATEE: {
            return {
                ...state,
                delegatee: action.payload
            }
        }
        case SET_PROPOSAL_COUNT: {
            return {
                ...state,
                proposalCount: action.payload 
            }
        }
        case CLAIM_STATUS: {
            return {
                ...state,
                claimStatus: action.payload
            }
        }
        case SET_ALEGIBILITY: {
            return {
                ...state,
                alegibility: action.payload
            }
        }
        case SET_LOCAL_PROOF: {
            return {
                ...state,
                proof: action.payload
            }
        }
        case SET_OWNERSHIP: {
            return {
                ...state,
                githubOwnership: action.payload
            }
        }
        case SET_CLAIM_STATUS: {
            return {
                ...state,
                hasClaimed: action.payload
            }
        }
        case STORE_PROOF: {
            return {
                ...state,
                values: {
                    ...state.values,
                    proof: action.payload
                }
            }
        }
        case STORE_KEY: {
            return {
                ...state,
                values: {
                    ...state.values,
                    key: action.payload
                }
            }
        }
        case STORE_DELEGATEE: {
            return {
                ...state,
                values: {
                    ...state.values,
                    delegatee: action.payload
                }
            }
        }
        default:
            return state
    }
}