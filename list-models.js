import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("No API key found in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // The SDK doesn't have a direct listModels method on genAI,
    // it's usually on the generative-language service,
    // but we can try to hit the endpoint directly or use the SDK's internals if possible.
    // Actually, let's just use a simple fetch to the endpoint.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.models) {
      console.log("Available Models:");
      data.models.forEach((m) => console.log(`- ${m.name} (${m.displayName})`));
    } else {
      console.error("Could not list models:", data);
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
