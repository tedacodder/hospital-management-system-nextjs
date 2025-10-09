import { configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"
import {appointment} from "./api/appointment"
import {patient} from "./api/patients"
export const store=configureStore({
    reducer:{
        [appointment.reducerPath]:appointment.reducer,
        [patient.reducerPath]:patient.reducer
    },
    middleware:(getDefaultMiddleWare)=>getDefaultMiddleWare().concat(patient.middleware)
})
setupListeners(store.dispatch)