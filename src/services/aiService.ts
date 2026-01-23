import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
// Note: In a real app, this should be an env var, but for this demo/prototype ensure it's set
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""; 
const genAI = new GoogleGenerativeAI(API_KEY);

export interface ImageAnalysisResult {
    metadata: {
        iso?: string;
        fNumber?: string;
        shutterSpeed?: string;
        camera?: string;
        lens?: string;
        dimensions?: string;
        dateTime?: string;
    };
    analysis: {
        composition?: string;
        sentiment?: string;
    };
    tags: string[];
    title: string;
    description: string;
}

export const analyzeImageWithGemini = async (imageUrl: string): Promise<ImageAnalysisResult> => {
    if (!API_KEY) {
        console.error("Missing VITE_GEMINI_API_KEY");
        throw new Error("API Key missing");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Convert image URL to base64 or suitable format if strictly needed, 
        // but for now assuming we fetch the blob and convert.
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
        
        // Remove data:image/jpeg;base64, prefix
        const base64Image = base64Data.split(',')[1];

        const prompt = `
        Analyze this image and return a JSON object with the following structure:
        {
            "metadata": {
                "iso": "estimated ISO or explicit if visible",
                "fNumber": "estimated aperture",
                "shutterSpeed": "estimated shutter speed",
                "camera": "estimated camera logic",
                "lens": "estimated lens type",
                "dimensions": "dimensions if detectable",
                "dateTime": "estimated time of day/year"
            },
            "analysis": {
                "composition": "brief analysis of composition",
                "sentiment": "emotional tone of the image"
            },
            "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
            "title": "A creative title",
            "description": "A detailed accessible description"
        }
        Do not include markdown code blocks, just the raw JSON string.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: blob.type
                }
            }
        ]);

        const text = result.response.text();
        // Clean up markdown code blocks if present (Gemini sometimes adds them despite instructions)
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(jsonStr) as ImageAnalysisResult;

    } catch (error) {
        console.error("Error analyzing image:", error);
        throw error;
    }
};
