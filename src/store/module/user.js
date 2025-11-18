import { createSlice } from "@reduxjs/toolkit"
import request from "../../utils/request.ts"; 
import {loginApi} from '../../api/user.js'
const useStore = createSlice({
    name: 'user', 
    initialState: {
        token: localStorage.getItem('token_key')||'',
        user:[]
    },
    reducers: {
        setToken(state, action) {
            state.token = action.payload
        },
        getUserInfo(state,action){
            state.user=action.payload
        },
    }
})

const fetchLogin = (loginForm) => {
    return async (dispatch) => {
        const res = await loginApi(loginForm)
        //存token
        dispatch(setToken(res.data.token))
        localStorage.setItem('token_key',res.data.token)
        console.log(res.data.token);
        
    }
}
const fetchRegister=(registerForm)=>{
     return async (dispatch) => {
        const res = await request.post('/authorizations', registerForm) 
        dispatch(setToken(res.data.token))
        localStorage.setItem('token_key',res.data.token)
        console.log(res.data.token);
        
    }
}
const fetchUser=()=>{
    return async(dispatch)=>{
        const res = await request.get('http://localhost:8800/userInfo');
        dispatch(getUserInfo(res))
        console.log('res',res);
        
        
    }
}
const { setToken ,getUserInfo} = useStore.actions
const userReducer = useStore.reducer

export { setToken, fetchLogin,fetchRegister,fetchUser }
export default userReducer