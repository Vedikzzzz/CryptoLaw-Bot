import { NextResponse } from "next/server";
import fs from "fs";
import fetch from "node-fetch";
import {
  FileState,
  GoogleAIFileManager,
  GoogleAICacheManager,
} from "@google/generative-ai/server";

// API Key from Environment Variables
const API_KEY = process.env.GEMINI_API_KEY || "";
const pdfUrl = process.env.PDF_URL || "";

// Download, Upload and Cache PDF
async function uploadAndCachePDF(pdfUrl: string, displayName: string) {
  const pdfPath = `./public/${displayName}.pdf`;
  const fileManager = new GoogleAIFileManager(API_KEY);
  const cacheManager = new GoogleAICacheManager(API_KEY);

  try {
    // Download the PDF from URL
    const pdfBuffer = await fetch(pdfUrl).then((response) =>
      response.arrayBuffer()
    );
    const binaryPdf = Buffer.from(pdfBuffer);
    console.log("PDF downloaded:", binaryPdf.length, "bytes");
    fs.writeFileSync(pdfPath, binaryPdf, "binary");
    console.log(`PDF saved at: ${pdfPath}`);

    // Upload the PDF to Gemini
    const fileResult = await fileManager.uploadFile(pdfPath, {
      displayName,
      mimeType: "application/pdf",
    });

    const { name } = fileResult.file;

    // Wait for PDF processing
    let file = await fileManager.getFile(name);
    while (file.state === FileState.PROCESSING) {
      console.log("Processing PDF...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await fileManager.getFile(name);
    }

    console.log(`PDF processing complete: ${file.uri} ${file.mimeType}`);

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
`;

    // Cache the PDF in Gemini
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

    console.log("Cache initialized with PDF:", cachedResult);
    return {
      success: true,
      cacheId: cachedResult,
      fileUri: file.uri,
    };
  } catch (error) {
    console.error("Error during PDF upload:", error);
    return {
      success: false,
      error: error,
    };
  }
}

// Automatically cache PDF when page loads
export async function GET() {
  const displayName = "The Founder's Guide to UK";
  const result = await uploadAndCachePDF(pdfUrl, displayName);
  return NextResponse.json(result);
}
