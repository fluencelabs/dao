import { combineReducers } from "redux"
import { walletReducer } from "./wallet"
import { governanceReducer } from "./governance"
import { userReducer } from "./user"
import { graphReducer } from "./graph"
import { errorReducer } from "./error"
import { routesReducer } from "./routes"
import { distributorReducer } from './distributor'

export default combineReducers({
    wallet: walletReducer,
    governance: governanceReducer,
    user: userReducer,
    graph: graphReducer,
    error: errorReducer,
    routes: routesReducer,
    distributor: distributorReducer
})