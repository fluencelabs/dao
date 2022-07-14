import { SET_FLUENCE_SUBGRAPH, SET_DISTRIBUTOR_SUBGRAPH, GRAPH_CLEANUP } from "../actions/types"

const initialState = {
    fluence: null,
    distributor: null
}

export const graphReducer = (state = initialState, action) => {
    switch (action.type) {
        case GRAPH_CLEANUP: {
            return initialState
        }

        case SET_FLUENCE_SUBGRAPH:
            return {
                ...state,
                fluence: action.payload
            }

        case SET_DISTRIBUTOR_SUBGRAPH:
            return {
                ...state,
                distributor: action.payload
            }
    
        default:
            return state
    }
}