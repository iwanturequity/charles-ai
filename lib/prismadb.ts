import {PrismaClient} from "@prisma/client";

declare global{
    var prisma:PrismaClient | undefined;
}

var prismadb= globalThis.prisma ||  new PrismaClient();
if(process.env.NODE_ENV !== "production") globalThis.prisma=prismadb;

export default prismadb;