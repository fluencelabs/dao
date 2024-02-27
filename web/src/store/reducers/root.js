import { combineReducers } from "redux";
import { governanceReducer } from "./governance";
import { userReducer } from "./user";
import { errorReducer } from "./error";
import { routesReducer } from "./routes";
import { distributorReducer } from "./distributor";

export default combineReducers({
  governance: governanceReducer,
  user: userReducer,
  error: errorReducer,
  routes: routesReducer,
  distributor: distributorReducer,
});
