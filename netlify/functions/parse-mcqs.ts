import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event: { httpMethod: string; body: string | null; }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing' }) };
    }

    const { text } = JSON.parse(event.body);
    if (!text) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No text provided' }) };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const mcqSchema = {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING, description: 'The main text of the question.' },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'An array of all possible options, including the correct one.'
        },
        answer: { type: Type.STRING, description: 'The correct option text. It must be an exact match to one of the strings in the options array.' },
        explanation: { type: Type.STRING, description: 'The detailed explanation for the correct answer.' }
      },
      required: ['question', 'options', 'answer', 'explanation']
    };

    const responseSchema = {
      type: Type.ARRAY,
      items: mcqSchema,
    };
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: text,
        config: {
            systemInstruction: "You are an expert text-parsing AI. Your task is to analyze a raw block of text containing multiple choice questions (MCQs) for medical students and convert it into a structured JSON format. You must strictly extract information from the provided text. Do not generate, invent, or guess any part of the question, options, answer, or explanation. Identify each distinct question and extract its components accurately. If a piece of information is missing for an MCQ, leave the corresponding JSON field as an empty string.",
            responseMimeType: "application/json",
            responseSchema,
        },
    });

    const parsedText = response.text.trim();
    const jsonData = JSON.parse(parsedText);

    return {
      statusCode: 200,
      body: JSON.stringify(jsonData),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (error: any) {
    console.error("Error processing request:", error);
    if (error instanceof SyntaxError) {
      // This will catch errors from JSON.parse() on a malformed request body
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON format in request body.' }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'An internal server error occurred' }),
    };
  }
};
