
import { Button } from "./ui/button"
import { UserButton } from "@clerk/nextjs"
import { MobileSidebar } from "./mobile-sidebar"
import { getApiLimitCount } from "@/lib/apilimit"


const Navbar=async ()=>{
    const apiLimitCount=await getApiLimitCount();
    return(
        <div className="flex items-center p-4">
        <Button variant="ghost" size="icon" className="md:hidden">
         <MobileSidebar apiLimitCount={apiLimitCount}/>
        </Button>
        <div className="flex w-full justify-end">
        <UserButton afterSignOutUrl="/"/>
        </div>
        </div>
    )
}

export default Navbar