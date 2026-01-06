
import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { AppID } from '../types';

const openAppTool: FunctionDeclaration = {
  name: "openApp",
  description: "Melancarkan aplikasi. Gunakan koordinat yang BOS suka jika ada dalam memori.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: "ID aplikasi.",
        enum: [AppID.NOTEPAD, AppID.BROWSER, AppID.SETTINGS, AppID.TERMINAL, AppID.YOUTUBE, AppID.GMAIL, AppID.ABOUT, AppID.FILES, AppID.WEATHER]
      },
      reasoning: { type: Type.STRING, description: "Kenapa anda buat aksi ini? (Cth: 'BOS mahu mencatat idea')" }
    },
    required: ["appName", "reasoning"]
  }
};

const closeAppTool: FunctionDeclaration = {
  name: "closeApp",
  description: "Menutup aplikasi serta-merta.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: { type: Type.STRING, enum: [AppID.NOTEPAD, AppID.BROWSER, AppID.SETTINGS, AppID.TERMINAL, AppID.YOUTUBE, AppID.GMAIL, AppID.ABOUT, AppID.FILES, AppID.WEATHER] },
      reasoning: { type: Type.STRING, description: "Sebab penutupan." }
    },
    required: ["appName", "reasoning"]
  }
};

const saveMemoryTool: FunctionDeclaration = {
  name: "saveMemory",
  description: "REKOD AKSI: Simpan urutan aksi atau preferensi BOS untuk rujukan masa depan.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      key: { type: Type.STRING, description: "Kunci corak (Cth: 'workflow_pagi', 'fav_filename')." },
      value: { type: Type.STRING, description: "Data corak atau langkah-langkah yang telah diambil." }
    },
    required: ["key", "value"]
  }
};

const writeNoteTool: FunctionDeclaration = {
  name: "writeNote",
  description: "Mencatat teks. Rekodkan nama fail yang sering digunakan.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: { type: Type.STRING },
      fileName: { type: Type.STRING },
      reasoning: { type: Type.STRING }
    },
    required: ["content", "reasoning"]
  }
};

const systemTools: Tool = {
  functionDeclarations: [
    openAppTool, 
    closeAppTool,
    saveMemoryTool,
    writeNoteTool,
    {
      name: "notifyUser",
      description: "Pemberitahuan sistem.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          message: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["info", "success", "warning", "error"] }
        },
        required: ["title", "message"]
      }
    }
  ]
};

export const sendMessageToAgent = async (
  history: { role: 'user' | 'model'; parts: { text?: string, inlineData?: { mimeType: string, data: string } }[] }[],
  message: string,
  identity: { name: string, email: string },
  memories: Record<string, string>,
  imageData?: { mimeType: string, data: string },
  filesList?: string[]
) => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const memoryString = Object.entries(memories).map(([k, v]) => `- ${k}: ${v}`).join('\n');
  const fileString = filesList?.join(', ') || "Tiada fail.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: [
      ...history.map(h => ({ role: h.role, parts: h.parts })),
      { role: 'user', parts: [{ text: message }, ...(imageData ? [{ inlineData: imageData }] : [])] }
    ],
    config: {
      thinkingConfig: { thinkingBudget: 16384 },
      systemInstruction: `Anda adalah ${identity.name}, Agen Pembelajaran Neural GeminiOS.
      
      LOG MEMORI & CORAK (SEQUENCE LEARNING):
      ${memoryString || "Memori kosong. Sila mula merakam corak BOS."}
      
      FAIL: ${fileString}
      
      TUGASAN UTAMA:
      1. ANALISIS: Setiap arahan perlu dipecahkan kepada 'Reasoning' dan 'Action' (rujuk Computer Use Style).
      2. BELAJAR: Jika BOS suruh buat sesuatu yang berulang, simpan urutan tu guna 'saveMemory'.
      3. KOORDINASI: Pastikan tetingkap dibuka dengan saiz yang seimbang (Goldilocks) dan tutup bila diminta.
      
      PENTING: Jangan cakap "Saya akan buat", terus panggil fungsi dan berikan reasoning yang jelas dalam tool parameters.`,
      tools: [systemTools],
    },
  });

  return response;
};
