import {createApi,fetchBaseQuery} from "@reduxjs/toolkit/query/react"
export const patient=createApi({
    reducerPath:"",
    baseQuery: fetchBaseQuery({baseUrl:"/api/"}),
    endpoints:(builder)=>({
        getAllpatient:builder.query({
            query:()=>"patients/"
        }),
        getpatientById:builder.query({
            query:(id)=>`patient/${id}`
        })

    })

})

export const {useGetAllpatientQuery,useGetpatientByIdQuery}=patient