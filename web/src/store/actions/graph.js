import { SET_FLUENCE_SUBGRAPH, SET_DISTRIBUTOR_SUBGRAPH } from "./types"

export const setFluenceSubgraph = (subgraph) => ({
    type: SET_FLUENCE_SUBGRAPH,
    payload: subgraph
})

export const setDistributorSubgraph = (subgraph) => ({
    type: SET_DISTRIBUTOR_SUBGRAPH,
    payload: subgraph
})