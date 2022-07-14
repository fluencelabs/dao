import { SET_KEY, WEB2_LOGIN, WEB2_LOGOUT, USER_CLEANUP, SET_USERNAME } from "../actions/types"

export const initialState = {
    name: null,
    nickname: null,
    picture: null,
    sub: null,
    email: null,
    email_verfified: null,
    updated_at: null,
    username: null,
    key: null
}

export const userReducer = (state=initialState, action) => {
    switch (action.type) {
        case USER_CLEANUP: {
            return initialState
        }

        case SET_USERNAME: {
            return {
                ...state,
                username: action.payload
            }
        }

        case WEB2_LOGIN:
            return {
                ...state,
                ...action.payload
            }

        case WEB2_LOGOUT:
            return {
                ...state,
                ...action.payload
            }

        case SET_KEY:
            return {
                ...state,
                key: action.payload
            }
    
        default:
            return state
    }
}