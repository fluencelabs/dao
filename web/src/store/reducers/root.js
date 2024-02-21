import { combineReducers } from "redux"
import { walletReducer } from "./wallet"
import { governanceReducer } from "./governance"
import { userReducer } from "./user"
import { errorReducer } from "./error"
import { routesReducer } from "./routes"
import { distributorReducer } from './distributor'

export default combineReducers({
    wallet: walletReducer,
    governance: governanceReducer,
    user: userReducer,
    error: errorReducer,
    routes: routesReducer,
    distributor: distributorReducer
})