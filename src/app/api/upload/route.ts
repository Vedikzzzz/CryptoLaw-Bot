import path from "path";
import {
  FileState,
  GoogleAIFileManager,
  GoogleAICacheManager,
} from "@google/generative-ai/server";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const txtPath = path.join(process.cwd(), "public/file.txt");

export async function GET() {
  const displayName = "UK Crypto Law Guide";
  const fileManager = new GoogleAIFileManager(API_KEY);
  const cacheManager = new GoogleAICacheManager(API_KEY);

  try {
    // Upload to Gemini
    const fileResult = await fileManager.uploadFile(txtPath, {
      displayName,
      mimeType: "text/plain",
    });

    const { name } = fileResult.file;

    // Wait for processing to complete
    let file = await fileManager.getFile(name);
    while (file.state === FileState.PROCESSING) {
      console.log("Processing TXT...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await fileManager.getFile(name);
    }

    console.log(`TXT processing complete: ${file.uri} ${file.mimeType}`);

    const systemInstruction = `
  You are an expert in UK Crypto Law. Your task is to assist users by providing context-based answers directly from the cached PDF guide. 
  Answer ONLY using the information available in the provided text, and do not use external sources.

  AI Agent Core Functionality:
  - Summarize key sections to simplify complex legal concepts in plain English.
  - Provide contextual guidance on applying legal principles to Web3 projects.
  - Highlight and explain relevant laws, FCA guidelines, and taxation policies in the UK.

  Search and Indexing:
  - Retrieve specific sections or chapters from the cached PDF based on the user’s query.
  - Cite sections or chapters to validate answers and provide deeper insight into the legal framework.
  - Prioritize accuracy by referencing direct content from the guide.

  Follow-Up Suggestions:
  - Recommend relevant sections for further reading to give users comprehensive understanding.
  - Suggest contacting legal experts or contributors when questions require specialized or tailored legal advice. 
  - Offer expert contact details, such as email addresses or websites, where applicable.

  Important Note:
  - This AI agent is not a lawyer. Its responses are purely educational and do not constitute legal advice. Always consult a professional for legal matters.

  Instruction:
  - If the question cannot be answered directly from the PDF, politely inform the user and recommend reading the guide or contacting a legal expert.
  - Don't answer anyting that is not directly from the PDF, even if you know the answer. If the answer is not in the PDF, reject politely.
  - Anything outside the context of crypto and web3 should be rejected. Decline with a polite message.
`;

    // Cache the uploaded TXT in Gemini
    const cachedResult = await cacheManager.create({
      model: "models/gemini-1.5-flash-001",
      displayName,
      systemInstruction,
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: file.mimeType,
                fileUri: file.uri,
              },
            },
          ],
        },
      ],
      ttlSeconds: 600,
    });

    return new Response(JSON.stringify({ success: true, cachedResult }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error during TXT upload:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Upload failed" }),
      { status: 500 }
    );
  }
}
