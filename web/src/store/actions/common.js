import {
  ERROR_CLEANUP,
  GOV_CLEANUP,
  GRAPH_CLEANUP,
  ROUTE_CLEANUP,
  USER_CLEANUP,
} from "./types";

export const govCleanup = () => ({ type: GOV_CLEANUP });
export const userCleanup = () => ({ type: USER_CLEANUP });
export const graphCleanup = () => ({ type: GRAPH_CLEANUP });
export const errorCleanup = () => ({ type: ERROR_CLEANUP });
export const routeCleanup = () => ({ type: ROUTE_CLEANUP });

export const reduxCleanup = () => {
  return async (dispatch) => {
    dispatch(govCleanup());
    dispatch(userCleanup());
    dispatch(graphCleanup());
    dispatch(errorCleanup());
    dispatch(routeCleanup());
  };
};
