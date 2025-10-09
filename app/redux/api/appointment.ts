import {createApi,fetchBaseQuery} from "@reduxjs/toolkit/query/react"
export const appointment=createApi({
    reducerPath:"appointment",
    baseQuery: fetchBaseQuery({baseUrl:"/api/"}),
    endpoints:(builder)=>({
        getAllAppointment:builder.query({
            query:()=>"appointments/"
        }),
        getAppointmentById:builder.query({
            query:(id)=>`appointment/${id}`
        })

    })

})

export const {useGetAllAppointmentQuery,useGetAppointmentByIdQuery}=appointment