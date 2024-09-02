
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {GoogleGenerativeAI} from "@google/generative-ai"
import { checkApiLimit, increaseApiLimit } from "@/lib/apilimit";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    console.log("started")
  try {
    const { userId } = auth();
    const body = await req.json();
    const { messages } = body;
    console.log("messages",messages);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return new NextResponse("OpenAI API Key not configured.", { status: 500 });
    }

    if (!messages) {
      return new NextResponse("Messages are required", { status: 400 });
    }
     
    const isAllowed = await checkApiLimit();
   // const isPro = await checkSubscription();

    if (!isAllowed) {
      return new NextResponse("API Limit Exceeded", { status: 403 });
    }
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    const result = await model.generateContent(messages.content);
    const response = result.response;
    const text = response.text();
    console.log(text);
    await increaseApiLimit();
    return NextResponse.json(text);
  } 
  catch (error) {
    console.log('[CONVERSATION_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};
