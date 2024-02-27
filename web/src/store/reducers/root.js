import { combineReducers } from "redux";
import { governanceReducer } from "./governance";
import { errorReducer } from "./error";
import { distributorReducer } from "./distributor";

export default combineReducers({
  governance: governanceReducer,
  error: errorReducer,
  distributor: distributorReducer,
});
