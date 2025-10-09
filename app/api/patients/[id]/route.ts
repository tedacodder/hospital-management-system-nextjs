import {NextRequest , NextResponse} from "next/server"
import { prisma } from "@/lib/prisma";
interface props{
    params:{id:string}
}
export async function GET(request:NextRequest,{params}:{ params:{ id:string }}){
    try{
const patient = await prisma.user.findUnique({
  where: {id: params?.id },
});
  return NextResponse.json(patient);
    }catch(e){
        return NextResponse.json({Error:"something went Wrong"})
    }
}