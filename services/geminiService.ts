import { GoogleGenAI, Type } from "@google/genai";
import { OrderData } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

const schema = {
    type: Type.OBJECT,
    properties: {
        issueDate: {
            type: Type.STRING,
            description: "The main issue date from the top of the document, formatted as 'DAY DD MMM'. This might only be present on a main list."
        },
        orders: {
            type: Type.ARRAY,
            description: "A list of all orders. This may contain one or many orders depending on the document type.",
            items: {
                type: Type.OBJECT,
                properties: {
                    route: {
                        type: Type.STRING,
                        description: "The name of the route or location (e.g., ATHLONE, FINNERTY)."
                    },
                    product: {
                        type: Type.STRING,
                        description: "The full product name (e.g., B441 4\" Regular Tray 60 or '4 Reg')."
                    },
                    trays: {
                        type: Type.INTEGER,
                        description: "The quantity of trays for that specific product and route."
                    }
                },
                required: ["route", "product", "trays"]
            }
        }
    },
    required: ["issueDate", "orders"]
};


export const extractOrderDataFromFile = async (file: File): Promise<OrderData> => {
    if (file.name.toLowerCase().endsWith('.accdb')) {
        throw new Error("Microsoft Access (.accdb) files are not supported for analysis.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const base64Data = await fileToBase64(file);
    const filePart = {
        inlineData: {
            mimeType: file.type,
            data: base64Data,
        },
    };

    const textPart = {
        text: `Analyze the provided document (which could be an image, PDF, or Word document) of a bakery order. The document can be one of two types:
        1. A main "Slice Order" list with multiple routes/locations in a table.
        2. An individual production slip for a single route (e.g., a page with "FINNERTY" at the top).

        First, find and extract the 'Issue Date' if it's present (usually at the top right of the main list).

        If the document is the main list: for each location, extract the route name, the full product description from the table, and the number from the 'Trays' column.

        If the document is an individual production slip:
        - The route name is the main title on the page (e.g., "FINNERTY").
        - Extract the "Product name".
        - Extract the "Quantity" and map it to the 'trays' field.

        Ignore any handwritten checkmarks or circles.
        Provide the output as a single JSON object according to the provided schema. If it's a single slip, the 'orders' array will contain just one item.
        If a value like 'issueDate' is not present on a slip, return an empty string for it.`
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [filePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        },
    });
    
    const jsonString = response.text;
    if (!jsonString) {
        throw new Error("API returned an empty response.");
    }

    try {
        const parsedData: OrderData = JSON.parse(jsonString);
        // If date is missing but there are orders, provide a default.
        if (!parsedData.issueDate && parsedData.orders?.length > 0) {
            parsedData.issueDate = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
        }
        return parsedData;
    } catch (e) {
        console.error("Failed to parse JSON response:", jsonString);
        throw new Error("Failed to parse the data from the AI. Please try again with a clearer document.");
    }
};