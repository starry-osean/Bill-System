import { configureStore } from '@reduxjs/toolkit'
import billReducer from './module/billStore'
import userReducer from './module/user'
import analyseReducer from './module/analyse'
const store=configureStore({
    reducer:{
        bill:billReducer,
        user:userReducer,
        analyse:analyseReducer
    }
})
export default store
