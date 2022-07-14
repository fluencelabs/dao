import { SET_CURRENT_ROUTE } from "./types"

export const setCurrentRoute = (route) => ({
    type: SET_CURRENT_ROUTE,
    payload: route
})