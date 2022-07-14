//////----------- WALLET -----------//////
export const SET_WEB3_PROVIDER = 'wallet/SET_WEB3_PROVIDER'
export const SET_ADDRESS = 'wallet/SET_ADDRESS'
export const SET_CHAIN_ID = 'wallet/SET_CHAIN_ID'
export const RESET_WEB3_PROVIDER = 'wallet/RESET_WEB3_PROVIDER'
export const SET_NETWORK_NAME = 'wallet/SET_NETWORK_NAME'
export const SET_PREV_ADDRESS = 'wallet/SET_PREV_ADDRESS'

//////----------- GOVERNANCE -----------//////
export const PROPOSAL_CREATED = 'gov/PROPOSAL_CREATED'
export const DELEGATE_STATUS = 'gov/DELEGATE_STATUS'
export const SET_DELEGATEE = 'gov/SET_DELEGATEE'
export const SET_PROPOSAL_COUNT = 'gov/SET_PROPOSAL_COUNT'
export const CLAIM_STATUS = 'gov/CLAIM_STATUS'
export const SET_ALEGIBILITY = 'gov/SET_ALEGIBILITY'
export const SET_LOCAL_PROOF = 'gov/SET_LOCAL_PROOF'
export const SET_OWNERSHIP = 'gov/SET_OWNERSHIP'
export const SET_CLAIM_STATUS = 'gov/SET_CLAIM_STATUS'

//////----------- ERRORS -----------//////
export const SET_ERROR = 'errors/SET_ERROR'

//////----------- GOV STORAGE -----------//////
export const STORE_PROOF = 'govstore/STORE_PROOF'
export const STORE_DELEGATEE = 'govstore/STORE_DELEGATEE'
export const STORE_KEY = 'govstore/STORE_KEY'

//////----------- USER -----------//////
export const WEB2_LOGIN = 'user/WEB2_LOGIN'
export const WEB2_LOGOUT = 'user/WEB2_LOGOUT'
export const FETCH_KEY = 'user/FETCH_KEY'
export const SET_KEY = 'user/SET_KEY'
export const USER_ERROR = 'user/SET_ERROR'
export const SET_USERNAME = 'user/SET_USERNAME'

/////------------ THE GRAPH -----------//////
export const SET_FLUENCE_SUBGRAPH = 'graph/SET_FLUENCE_SUBGRAPH'
export const SET_DISTRIBUTOR_SUBGRAPH = 'graph/SET_DISTRIBUTOR_SUBGRAPH'

/////------------ UTILS -----------//////
export const GOV_CLEANUP = 'utils/GOV_CLEANUP'
export const GRAPH_CLEANUP = 'utils/GRAPH_CLEANUP'
export const USER_CLEANUP = 'utils/USER_CLEANUP'
export const WALLET_CLEANUP = 'uitls/WALLET_CLEANUP'
export const ERROR_CLEANUP = 'uitls/ERROR_CLEANUP'
export const ROUTE_CLEANUP = 'uitls/ROUTE_CLEANUP'

/////------------ ROUTES -----------//////
export const SET_CURRENT_ROUTE = 'routes/SET_CURRENT_ROUTE'

/////------------ DISTRIBUTOR -----------//////
export const FETCH_MERKLE_ROOT = 'distributor/FETCH_MERKLE_ROOT'
export const FETCH_CURRENT_AWARD = 'distributor/FETCH_CURRENT_AWARD'
export const FETCH_NEXT_HALVE_PERIOD = 'distributor/FETCH_NEXT_HALVE_PERIOD'
export const CHECK_IS_CLAIMED = 'distributor/CHECK_IS_CLAIMED'