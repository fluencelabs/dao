import { SET_USERNAME, USER_CLEANUP } from "../actions/types";

export const initialState = {
  name: null,
  nickname: null,
  picture: null,
  sub: null,
  email: null,
  email_verfified: null,
  updated_at: null,
  username: null,
  key: null,
};

export const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case USER_CLEANUP: {
      return initialState;
    }

    case SET_USERNAME: {
      return {
        ...state,
        username: action.payload,
      };
    }

    default:
      return state;
  }
};
