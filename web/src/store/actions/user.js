import {
    SET_KEY,
    WEB2_LOGIN,
    WEB2_LOGOUT,
    USER_ERROR,
    STORE_KEY,
    SET_USERNAME
} from './types'

import { initialState } from '../reducers/user'
import axios from 'axios'

export const setUsername = (username) => ({
    type: SET_USERNAME,
    payload: username
})

export const web2Login = (user) => ({
    type: WEB2_LOGIN,
    payload: user
})

export const web2Logout = () => ({
    type: WEB2_LOGOUT,
    payload: initialState
})

export const setKey = (key) => ({
    type: SET_KEY,
    payload: key
})

export const setError = (message) => {
    let msg
    alert(message)
    try {
        const isEthJs = /ethjs-query/.test(message)
        const parsedMessage = isEthJs 
            ? JSON.parse(
                    message
                    .replace('[ethjs-query] while formatting outputs from RPC ', '')
                    .slice(0, -1))
            : message
        
        const newMessage = isEthJs 
            ? `${parsedMessage.message} CODE:${parsedMessage.code}`
            : message

        msg = newMessage
    } catch (error) {
        msg = message
    }
    return {
        type: USER_ERROR,
        payload: msg
    }
}

export const storeKey = (key) => ({
    type: STORE_KEY,
    payload: key
})

export const fetchKeyFromGithub = (nickname) => {
    return async dispatch => {
        try {
            const res = await axios.get(`https://api.github.com/users/${nickname}/keys`)
            dispatch(setKey(res.data.length > 0 ? res.data[0].key : ''))
        } catch (error) {
            dispatch(setError(error.message))
        }
    }
}