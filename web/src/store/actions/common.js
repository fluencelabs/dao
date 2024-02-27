import { ERROR_CLEANUP, GOV_CLEANUP, GRAPH_CLEANUP } from "./types";

export const govCleanup = () => ({ type: GOV_CLEANUP });
export const graphCleanup = () => ({ type: GRAPH_CLEANUP });
export const errorCleanup = () => ({ type: ERROR_CLEANUP });

export const reduxCleanup = () => {
  return async (dispatch) => {
    dispatch(govCleanup());
    dispatch(graphCleanup());
    dispatch(errorCleanup());
  };
};
