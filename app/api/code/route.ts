import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import { join } from "path";
import { checkApiLimit, increaseApiLimit } from "@/lib/apilimit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);



function fileToGenerativePart(filePath: string, mimeType: string) {
  return {
    inlineData: {
      data: fs.readFileSync(filePath).toString("base64"),
      mimeType,
    },
  };
}

const processImage = async (filePath: string, step: string, prevResults: any = {}) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
  const image = fileToGenerativePart(filePath, "image/png");

  let result;
  if (step === "description") {
    const descriptionPrompt = `Describe this UI in accurate details. When you reference a UI element put its name and bounding box in the format: [object name (y_min, x_min, y_max, x_max)]. Also Describe the color of the elements.`;
    const descriptionResponse = await model.generateContent([descriptionPrompt, image]);
    result = { description: descriptionResponse.response.text() };
  } else if (step === "refineDescription") {
    const refineDescriptionPrompt = `Compare the described UI elements with the provided image and identify any missing elements or inaccuracies. Also Describe the color of the elements. Provide a refined and accurate description of the UI elements based on this comparison. Here is the initial description: ${prevResults.description}`;
    const refineDescriptionResponse = await model.generateContent([refineDescriptionPrompt, image]);
    result = { refinedDescription: refineDescriptionResponse.response.text() };
  } else if (step === "initialHtml") {
    const htmlPrompt = `Create an HTML file based on the following UI description, using the UI elements described in the previous response. Include inline CSS within the HTML file to style the elements. Make sure the colors used are the same as the original UI. The UI needs to be responsive and mobile-first, matching the original UI as closely as possible. Do not include any explanations or comments. Avoid using \`\`\`html. and \`\`\` at the end. ONLY return the HTML code with inline CSS. Here is the refined description: ${prevResults.refinedDescription}`;
    const initialHtmlResponse = await model.generateContent([htmlPrompt, image]);
    result = { initialHtml: initialHtmlResponse.response.text() };
  } else if (step === "refinedHtml") {
    await increaseApiLimit();
    const refineHtmlPrompt = `Validate the following HTML code based on the UI description and image and provide a refined version of the HTML code with inline CSS that improves accuracy, responsiveness, and adherence to the original design. ONLY return the refined HTML code with inline CSS. Avoid using \`\`\`html. and \`\`\` at the end. Here is the initial HTML: ${prevResults.initialHtml}`;
    const refinedHtmlResponse = await model.generateContent([refineHtmlPrompt, image]);
    result = { refinedHtml: refinedHtmlResponse.response.text() };
  }

  console.log(`[STEP: ${step}]`, result); // Logging for debugging
  return result;
};

export async function POST(req: Request) {
  console.log("Started processing");

  const { userId } = auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return new NextResponse("Google Generative AI API Key not configured.", { status: 500 });
  }

  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    const step = data.get('step') as string;
    const prevResults = JSON.parse(data.get('prevResults') as string || "{}");
    console.log("Request with file", file);
    console.log("Current Step:", step);
    console.log("Previous Results:", prevResults);
   
    const isAllowed = await checkApiLimit();
    // const isPro = await checkSubscription();
 
     if (!isAllowed) {
       return new NextResponse("API Limit Exceeded", { status: 403 });
     }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join('/', 'tmp', file.name);

    await fs.promises.writeFile(filePath, buffer);
    console.log(`Saved file to ${filePath}`);

    const results = await processImage(filePath, step, prevResults);
    console.log("Processing results", results);

    // Clean up the temporary file
    await fs.promises.unlink(filePath);
    return NextResponse.json(results);
  } catch (error) {
    console.error('[CODE_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
