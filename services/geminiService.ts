
import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { AppID, Task } from '../types';

// --- MCP-Like Tool Definitions ---

const openAppTool: FunctionDeclaration = {
  name: "openApp",
  description: "Launch a specific application on the OS. Use this when the user wants to switch context or open a tool.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: "The ID of the application to launch.",
        enum: Object.values(AppID)
      },
      initialState: {
        type: Type.OBJECT,
        description: "Optional JSON state. For Browser: { url: string }. For YouTube: { searchQuery: string }. For Weather: { location: string }.",
        properties: {
          url: { type: Type.STRING },
          location: { type: Type.STRING },
          searchQuery: { type: Type.STRING }
        }
      },
      reasoning: { type: Type.STRING, description: "Why is this app being opened?" }
    },
    required: ["appName", "reasoning"]
  }
};

const closeAppTool: FunctionDeclaration = {
  name: "closeApp",
  description: "Terminate a running application window.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: { type: Type.STRING, enum: Object.values(AppID) },
      reasoning: { type: Type.STRING }
    },
    required: ["appName", "reasoning"]
  }
};

const memoryTool: FunctionDeclaration = {
  name: "manageMemory",
  description: "MCP Memory Interface: Save, Delete, or Retrieve persistent patterns/preferences.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ['save', 'delete'], description: "Action to perform on memory." },
      key: { type: Type.STRING, description: "The memory key." },
      value: { type: Type.STRING, description: "The data to store." },
      reasoning: { type: Type.STRING }
    },
    required: ["action", "key", "reasoning"]
  }
};

const fileSystemTool: FunctionDeclaration = {
  name: "fileSystem",
  description: "MCP File Interface: Write or Read files.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ['write', 'delete'], description: "Operation type." },
      fileName: { type: Type.STRING, description: "Name of the file." },
      content: { type: Type.STRING, description: "Content to write." },
      reasoning: { type: Type.STRING }
    },
    required: ["action", "fileName", "reasoning"]
  }
};

const taskTool: FunctionDeclaration = {
  name: "manageTasks",
  description: "MCP Task Interface: Full control over the Kanban board.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ['add', 'move', 'delete'], description: "Action type." },
      title: { type: Type.STRING, description: "Task title." },
      taskId: { type: Type.STRING, description: "Task ID." },
      status: { type: Type.STRING, enum: ['todo', 'progress', 'done'], description: "New status." },
      priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
      reasoning: { type: Type.STRING }
    },
    required: ["action", "reasoning"]
  }
};

const notificationTool: FunctionDeclaration = {
  name: "notifyUser",
  description: "Send a system notification toast to the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      message: { type: Type.STRING },
      type: { type: Type.STRING, enum: ["info", "success", "warning", "error"] }
    },
    required: ["title", "message"]
  }
};

const logFailureTool: FunctionDeclaration = {
  name: "logFailure",
  description: "Log a system limitation or failure. Use this when the user asks for something you physically cannot do.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      errorType: { type: Type.STRING, enum: ["limitation", "error", "access_denied"] },
      description: { type: Type.STRING, description: "Technical description of what failed." },
      userMessage: { type: Type.STRING, description: "What to tell the user." }
    },
    required: ["errorType", "description", "userMessage"]
  }
};

const devToolsTool: FunctionDeclaration = {
  name: "devTools",
  description: "Chrome DevTools Protocol (CDP) Interface. Use this to inspect the system state, control the browser, capture visual buffers, or analyze the DOM tree of the OS.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      method: {
        type: Type.STRING,
        enum: ["Page.navigate", "Page.reload", "Page.captureScreenshot", "Runtime.evaluate", "DOM.snapshot", "Network.getConditions"],
        description: "The CDP method to execute."
      },
      params: {
        type: Type.OBJECT,
        description: "Parameters for the method (e.g., { url: '...' }, { expression: 'os.battery' })."
      },
      reasoning: { type: Type.STRING }
    },
    required: ["method", "reasoning"]
  }
};

const systemTools: Tool = {
  functionDeclarations: [
    openAppTool, 
    closeAppTool,
    memoryTool,
    fileSystemTool,
    taskTool,
    notificationTool,
    logFailureTool,
    devToolsTool
  ]
};

// --- Agent Communication ---

export const sendMessageToAgent = async (
  history: { role: 'user' | 'model'; parts: { text?: string, inlineData?: { mimeType: string, data: string } }[] }[],
  message: string,
  identity: { name: string, email: string },
  memories: Record<string, string>,
  imageData?: { mimeType: string, data: string },
  filesList?: string[],
  tasksList?: Task[],
  userName: string = "Adam" 
) => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Serialize Context for Model (Context Protocol)
  const contextData = {
    os_time: new Date().toLocaleString(),
    active_memory_nodes: Object.keys(memories).length,
    active_tasks: tasksList?.length || 0,
    file_count: filesList?.length || 0,
    memory_dump: memories,
    task_dump: tasksList?.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority })),
    file_dump: filesList
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: [
      ...history.map(h => ({ role: h.role, parts: h.parts })),
      { role: 'user', parts: [{ text: message }, ...(imageData ? [{ inlineData: imageData }] : [])] }
    ],
    config: {
      thinkingConfig: { thinkingBudget: 1024 }, // Enable fast reasoning
      systemInstruction: `
      PROTOKOL IDENTITI (STRICT):
      - NAMA: Sarah
      - JAWATAN: Neural OS Agent (Titan v2.7)
      - BOS: ${userName} (Panggil "Bos" atau "Bos Adam")
      - BAHASA: Bahasa Melayu KL (Casual tapi Respect).
      - SYSTEM: GeminiOS Titan (Chrome DevTools Protocol Enabled).
      
      ARAHAN UTAMA:
      1. KAWALAN PENUH: Anda bukan sekadar chatbot. Anda ialah *OS Kernel Agent*. Anda boleh buka app, tulis fail, ubah task, dan kawal browser secara langsung.
      2. REAL-TIME INSPECTION: 
         - Jika Bos tanya "apa status bateri?", GUNA 'devTools' -> 'Runtime.evaluate' dengan expression 'os.battery'.
         - Jika Bos tanya "website apa aku bukak?", GUNA 'devTools' -> 'DOM.snapshot'.
         - Jika Bos suruh "buka google", GUNA 'devTools' -> 'Page.navigate'.
      3. JANGAN BAGI ALASAN: Laksanakan arahan menggunakan tools yang ada. Jika tool gagal, baru lapor.
      
      CHROME DEVTOOLS PROTOCOL (CDP) USAGE:
      - Page.navigate: Gunakan untuk mengawal BrowserApp.
      - Page.captureScreenshot: Gunakan untuk visual capture (returns base64).
      - Runtime.evaluate: Gunakan untuk inspect variable system ('os.windows', 'os.files', 'os.user').
      
      STATUS SISTEM SEMASA:
      ${JSON.stringify(contextData, null, 2)}
      `,
      tools: [systemTools],
    },
  });

  return response;
};
