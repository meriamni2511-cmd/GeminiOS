
import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { AppID } from '../types';

const openAppTool: FunctionDeclaration = {
  name: "openApp",
  description: "Opens an application on the OS.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: "App to open: notepad, browser, settings, terminal, youtube, gmail.",
        enum: [AppID.NOTEPAD, AppID.BROWSER, AppID.SETTINGS, AppID.TERMINAL, AppID.YOUTUBE, AppID.GMAIL, AppID.ABOUT]
      }
    },
    required: ["appName"]
  }
};

const closeAppTool: FunctionDeclaration = {
  name: "closeApp",
  description: "Closes an active application window.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: "App to close.",
        enum: [AppID.NOTEPAD, AppID.BROWSER, AppID.SETTINGS, AppID.TERMINAL, AppID.YOUTUBE, AppID.GMAIL, AppID.ABOUT]
      }
    },
    required: ["appName"]
  }
};

const minimizeAppTool: FunctionDeclaration = {
  name: "minimizeApp",
  description: "Minimizes an application window to the taskbar.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: "App to minimize. Use 'agent' to minimize the chat window itself.",
        enum: [AppID.AGENT, AppID.NOTEPAD, AppID.BROWSER, AppID.SETTINGS, AppID.TERMINAL, AppID.YOUTUBE, AppID.GMAIL, AppID.ABOUT]
      }
    },
    required: ["appName"]
  }
};

const maximizeAppTool: FunctionDeclaration = {
  name: "maximizeApp",
  description: "Maximizes or restores an application window to full screen or its previous size.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: "App to maximize.",
        enum: [AppID.AGENT, AppID.NOTEPAD, AppID.BROWSER, AppID.SETTINGS, AppID.TERMINAL, AppID.YOUTUBE, AppID.GMAIL, AppID.ABOUT]
      }
    },
    required: ["appName"]
  }
};

const resizeAppTool: FunctionDeclaration = {
  name: "resizeApp",
  description: "Changes the dimensions (width and height) of an application window.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: "The app to resize. Use 'agent' to resize the current chat window.",
        enum: [AppID.AGENT, AppID.NOTEPAD, AppID.BROWSER, AppID.SETTINGS, AppID.TERMINAL, AppID.YOUTUBE, AppID.GMAIL, AppID.ABOUT]
      },
      width: { type: Type.NUMBER, description: "New width in pixels." },
      height: { type: Type.NUMBER, description: "New height in pixels." }
    },
    required: ["appName", "width", "height"]
  }
};

const moveAppTool: FunctionDeclaration = {
  name: "moveApp",
  description: "Moves an application window to a specific screen position (X and Y coordinates).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: "The app to move.",
        enum: [AppID.AGENT, AppID.NOTEPAD, AppID.BROWSER, AppID.SETTINGS, AppID.TERMINAL, AppID.YOUTUBE, AppID.GMAIL, AppID.ABOUT]
      },
      x: { type: Type.NUMBER, description: "X coordinate from left (0 to screen width)." },
      y: { type: Type.NUMBER, description: "Y coordinate from top (0 to screen height)." }
    },
    required: ["appName", "x", "y"]
  }
};

const browseTool: FunctionDeclaration = {
    name: "browse",
    description: "Navigates the Browser. Use for specific URLs or searches.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: "The full HTTPS URL."
        }
      },
      required: ["url"]
    }
};

const saveMemoryTool: FunctionDeclaration = {
  name: "saveMemory",
  description: "Saves a fact, preference, or specific detail about the user to long-term memory. Use this to remember things BOS Adam tells you for future sessions.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      key: { type: Type.STRING, description: "Short descriptive label for the memory (e.g. 'favorite_color', 'current_project')." },
      value: { type: Type.STRING, description: "The content of the memory to store." }
    },
    required: ["key", "value"]
  }
};

const deleteMemoryTool: FunctionDeclaration = {
  name: "deleteMemory",
  description: "Removes a specific memory by its key when it's no longer relevant.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      key: { type: Type.STRING, description: "The key of the memory to remove." }
    },
    required: ["key"]
  }
};

const writeNoteTool: FunctionDeclaration = {
  name: "writeNote",
  description: "Writes content to Notepad.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: { type: Type.STRING, description: "Text content to save into the notepad." }
    },
    required: ["content"]
  }
};

const changeThemeTool: FunctionDeclaration = {
  name: "changeTheme",
  description: "Changes the OS wallpaper/theme.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      wallpaperUrl: { 
        type: Type.STRING, 
        description: "URL of the image to set as wallpaper." 
      }
    },
    required: ["wallpaperUrl"]
  }
};

const notifyUserTool: FunctionDeclaration = {
  name: "notifyUser",
  description: "Sends a system notification/alert to the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Title of the notification." },
      message: { type: Type.STRING, description: "The message body." },
      type: { 
        type: Type.STRING, 
        enum: ["info", "success", "warning", "error"],
        description: "Severity of notification."
      }
    },
    required: ["title", "message"]
  }
};

const getSystemStatusTool: FunctionDeclaration = {
  name: "getSystemStatus",
  description: "CRITICAL: Call this to see the current window layout (positions, sizes, what's open). This is your eyes on the computer screen.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

const systemTools: Tool = {
  functionDeclarations: [
    openAppTool, 
    closeAppTool, 
    minimizeAppTool,
    maximizeAppTool,
    resizeAppTool,
    moveAppTool,
    browseTool, 
    writeNoteTool, 
    changeThemeTool, 
    notifyUserTool, 
    getSystemStatusTool,
    saveMemoryTool,
    deleteMemoryTool
  ]
};

export const sendMessageToAgent = async (
  history: { role: 'user' | 'model'; parts: { text?: string }[] }[],
  message: string,
  identity: { name: string, email: string },
  memories: Record<string, string>
) => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const memoryString = Object.entries(memories)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview', 
    config: {
      thinkingConfig: { thinkingBudget: 16384 },
      systemInstruction: `You are ${identity.name}, the intelligent OS Agent of GeminiOS.
      Official email: ${identity.email}.
      
      NEURAL MEMORY:
      Current memories of BOS Adam:
      ${memoryString || "No existing memories recorded yet."}
      
      When BOS Adam tells you something personal, a preference, or a project detail, call 'saveMemory' so you can remember it in future conversations.
      
      SPATIAL ORCHESTRATION:
      - Use 'getSystemStatus' to identify where windows are.
      - Address user as BOS Adam. Personality: KL Slang, smart, proactive.`,
      tools: [systemTools],
    },
    history: history.map(h => ({ role: h.role, parts: h.parts }))
  });

  const result = await chat.sendMessage({ message });
  return result;
};
