import { useUser } from "@clerk/nextjs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";



export const UserAvatar = () => {
  const  {user}= useUser();
  console.log("user ",user);
  const profileImageUrl = user?.imageUrl || '';
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={profileImageUrl} alt="Profile" /> 
      <AvatarFallback>
        {user?.firstName?.charAt(0)}
        {user?.lastName?.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
};