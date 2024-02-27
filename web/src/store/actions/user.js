import { SET_USERNAME, STORE_KEY } from "./types";

export const setUsername = (username) => ({
  type: SET_USERNAME,
  payload: username,
});

export const storeKey = (key) => ({
  type: STORE_KEY,
  payload: key,
});
