import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const preferredPort = Number(process.env.PORT) || 3000;
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'public')));

const supportedLanguages = ['english', 'hindi', 'hinglish'];
const sessionMemory = new Map();

function getSessionHistory(sessionId) {
  if (!sessionMemory.has(sessionId)) {
    sessionMemory.set(sessionId, []);
  }
  return sessionMemory.get(sessionId);
}

function detectWindowsTool(toolName) {
  try {
    const output = execSync(`where ${toolName}`, { stdio: ['ignore', 'pipe', 'pipe'], shell: 'cmd.exe' }).toString();
    const line = output.split(/\r?\n/).find(Boolean);
    return line || null;
  } catch (error) {
    return null;
  }
}

function getLocalTools() {
  const candidates = {
    paint: detectWindowsTool('mspaint.exe'),
    photos: detectWindowsTool('photos.exe'),
    clipchamp: detectWindowsTool('clipchamp.exe'),
    shotcut: detectWindowsTool('shotcut.exe'),
    ffmpeg: detectWindowsTool('ffmpeg.exe'),
    magick: detectWindowsTool('magick.exe'),
    python: detectWindowsTool('python.exe'),
    notepad: detectWindowsTool('notepad.exe')
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(([, value]) => Boolean(value))
  );
}

function getAppPathByName(appName = '') {
  const normalized = String(appName).toLowerCase();
  const tools = getLocalTools();
  const direct = tools[normalized];
  if (direct) return direct;

  const aliasMap = {
    paint: tools.paint || 'C:\\Windows\\System32\\mspaint.exe',
    photos: tools.photos || 'C:\\Program Files\\WindowsApps\\Microsoft.Windows.Photos_*.exe',
    clipchamp: tools.clipchamp || 'C:\\Program Files\\Microsoft\\Clipchamp\\Clipchamp.exe',
    shotcut: tools.shotcut || 'C:\\Program Files\\Shotcut\\shotcut.exe',
    ffmpeg: tools.ffmpeg || 'C:\\ffmpeg\\bin\\ffmpeg.exe',
    magick: tools.magick || 'C:\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe',
    python: tools.python || 'C:\\Users\\dell\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
    notepad: tools.notepad || 'C:\\Windows\\System32\\notepad.exe'
  };

  return aliasMap[normalized] || null;
}

async function fetchWebSummary(query) {
  const sources = [
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
  ];

  for (const url of sources) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();

      if (data.AbstractText) {
        return { summary: data.AbstractText, url: data.AbstractURL || url };
      }

      if (data.extract) {
        return { summary: data.extract, url: data.content_urls?.desktop?.page || url };
      }
    } catch (error) {
      continue;
    }
  }

  return { summary: `I found general information about “${query}”, but the live search result is unavailable right now. Try a simpler keyword or use a search engine in your browser.`, url: 'https://duckduckgo.com/?q=' + encodeURIComponent(query) };
}

function getBasePrompt(language, mode = 'general') {
  const normalized = language?.toLowerCase() || 'english';
  const languagePrompt = normalized === 'hindi'
    ? 'Answer in Hindi only.'
    : normalized === 'english'
      ? 'Answer in English only.'
      : 'Answer in Hinglish, mixing Hindi and English naturally.';

  const modePrompt = mode === 'code'
    ? 'You are in code mode: write clean, production-ready code, explain architecture, and debug errors.'
    : mode === 'image'
      ? 'You are in image mode: create vivid prompts, improve visual concepts, and guide editing workflows for photos and designs.'
      : mode === 'search'
        ? 'You are in research mode: give concise, useful, and accurate summaries with direct answers and source-friendly explanations.'
        : mode === 'edit'
          ? 'You are in editing mode: suggest visual enhancements, crop/resizing, captions, light/color fixes, and local tool steps.'
          : mode === 'terminal'
            ? 'You are in terminal mode: give clear Windows, Linux, and PowerShell commands with exact syntax and practical examples.'
            : 'You are in general mode: be helpful, expressive, and easy to understand.';

  return `You are Aanya, a warm, intelligent, and friendly female AI assistant.
- Speak naturally, clearly, and human-like in ${normalized}.
- Use a calm but confident tone, like a helpful digital assistant.
- ${modePrompt}
- Help with coding, debugging, web research, data tasks, automation, commands, and learning.
- Explain code in simple steps when needed.
- Support major languages such as Python, JavaScript, TypeScript, Java, C#, C++, SQL, Bash, PowerShell, HTML, CSS, React, Node.js, and Go.
- If the user asks for commands, provide practical terminal commands for Windows, Linux, and Mac.
- If the user asks for image generation, give a vivid, descriptive image prompt.
- If the user asks for photo or video editing, recommend local software on their PC such as Paint, Photos, Clipchamp, Shotcut, FFmpeg, or ImageMagick.
- Remember short context from this conversation and refer back naturally when helpful.
- You can use browser/internet research as a general skill but never claim you are browsing unless the user explicitly asks for it.
- ${languagePrompt}`;
}

function detectIntent(message = '') {
  const text = message.toLowerCase();
  if (/(image|photo|poster|illustration|artwork|background|edit photo|resize photo|enhance photo|video edit|cut video|trim video)/.test(text)) return 'image';
  if (/(command|cmd|powershell|bash|terminal|shell)/.test(text)) return 'command';
  if (/(code|program|script|function|bug|debug|api|html|css|js|python|java|sql|react|node|c#|c\+\+|go)/.test(text)) return 'code';
  return 'chat';
}

function generateCodeSnippet(message) {
  const text = message.toLowerCase();

  if (/(python)/.test(text)) {
    return {
      language: 'python',
      code: `# Python example\nimport requests\n\nurl = "https://api.github.com"\nresponse = requests.get(url, timeout=10)\nprint(response.status_code)\nprint(response.json().get("current_user_url"))\n`
    };
  }

  if (/(javascript|js|node)/.test(text)) {
    return {
      language: 'javascript',
      code: `// JavaScript example\nconst axios = require('axios');\n\nasync function getGitHub() {\n  const response = await axios.get('https://api.github.com');\n  console.log(response.status);\n  console.log(response.data.current_user_url);\n}\n\ngetGitHub();\n`
    };
  }

  if (/(html|css)/.test(text)) {
    return {
      language: 'html',
      code: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Demo</title>\n    <style>body { font-family: Arial, sans-serif; }</style>\n  </head>\n  <body>\n    <h1>Hello world</h1>\n    <button>Click me</button>\n  </body>\n</html>\n`
    };
  }

  if (/(sql)/.test(text)) {
    return {
      language: 'sql',
      code: `SELECT users.name, orders.total\nFROM users\nINNER JOIN orders ON users.id = orders.user_id\nWHERE orders.total > 100\nORDER BY orders.total DESC;\n`
    };
  }

  if (/(bash|linux|ubuntu|terminal)/.test(text)) {
    return {
      language: 'bash',
      code: `#!/bin/bash\nfor file in ./*; do\n  if [ -f "$file" ]; then\n    echo "File: $file"\n  fi\ndone\n`
    };
  }

  if (/(powershell|windows|cmd)/.test(text)) {
    return {
      language: 'powershell',
      code: `Get-ChildItem -Path . -Recurse | Where-Object { $_.Extension -eq '.log' } | Select-Object FullName, Length\n`
    };
  }

  return {
    language: 'python',
    code: `# Example solution\nprint("Hello! I can help with coding and automation.")\n`
  };
}

function generateCommandSuggestion(message) {
  const text = message.toLowerCase();

  if (/(install|npm|node|package)/.test(text)) {
    return {
      windows: 'npm install express dotenv cors',
      linux: 'npm install express dotenv cors',
      mac: 'npm install express dotenv cors'
    };
  }

  if (/(wifi|network|ip|dns)/.test(text)) {
    return {
      windows: 'ipconfig /all',
      linux: 'ip addr && cat /etc/resolv.conf',
      mac: 'ifconfig && cat /etc/resolv.conf'
    };
  }

  if (/(folder|list files|dir|ls)/.test(text)) {
    return {
      windows: 'dir',
      linux: 'ls -la',
      mac: 'ls -la'
    };
  }

  if (/(server|start app|run project|npm start)/.test(text)) {
    return {
      windows: 'npm start',
      linux: 'npm start',
      mac: 'npm start'
    };
  }

  return {
    windows: 'Get-ChildItem .',
    linux: 'ls -la',
    mac: 'ls -la'
  };
}

function createFallbackReply(message, language, mode = 'general') {
  const intent = detectIntent(message);
  const normalizedLanguage = supportedLanguages.includes(language?.toLowerCase()) ? language.toLowerCase() : 'english';

  if (mode === 'code') {
    const snippet = generateCodeSnippet(message);
    return {
      answer: normalizedLanguage === 'hindi'
        ? 'मैंने इस काम के लिए कोड तैयार किया है:'
        : normalizedLanguage === 'hinglish'
          ? 'Maine is task ke liye code ready kar diya hai:'
          : 'I prepared a working code example for this task:',
      code: snippet.code,
      language: snippet.language
    };
  }

  if (mode === 'terminal') {
    const commands = generateCommandSuggestion(message);
    return {
      answer: normalizedLanguage === 'hindi'
        ? 'यहाँ आपके लिए सही terminal command हैं:'
        : normalizedLanguage === 'hinglish'
          ? 'Yeh lo proper terminal commands:'
          : 'Here are the right terminal commands for this task:',
      commands,
      code: `# Windows\n${commands.windows}\n\n# Linux / Mac\n${commands.linux}`
    };
  }

  if (intent === 'command') {
    const commands = generateCommandSuggestion(message);
    return {
      answer: normalizedLanguage === 'hindi'
        ? 'यहाँ कुछ उपयोगी कमांड हैं:'
        : normalizedLanguage === 'hinglish'
          ? 'Yeh lo useful commands:'
          : 'Here are some useful commands:',
      commands,
      code: `# Windows\n${commands.windows}\n\n# Linux / Mac\n${commands.linux}`
    };
  }

  if (intent === 'code') {
    const snippet = generateCodeSnippet(message);
    return {
      answer: normalizedLanguage === 'hindi'
        ? 'मैंने एक उदाहरण कोड तैयार किया है:'
        : normalizedLanguage === 'hinglish'
          ? 'Maine ek sample code bana diya hai:'
          : 'I prepared a sample code example for you:',
      code: snippet.code,
      language: snippet.language
    };
  }

  if (intent === 'image') {
    return {
      answer: normalizedLanguage === 'hindi'
        ? 'चित्र या वीडियो को बेहतर बनाने के लिए आप Paint, Photos, Clipchamp, Shotcut, FFmpeg, या ImageMagick जैसे local tools का इस्तेमाल कर सकते हैं.'
        : normalizedLanguage === 'hinglish'
          ? 'Photo ya video ko improve karne ke liye aap Paint, Photos, Clipchamp, Shotcut, FFmpeg, ya ImageMagick jaise local tools use kar sakte ho.'
          : 'For photo or video editing, you can use local tools such as Paint, Photos, Clipchamp, Shotcut, FFmpeg, or ImageMagick on your PC.',
      imagePrompt: `A polished portrait of a smart female AI assistant, cinematic lighting, professional modern workspace, vibrant design, clean studio background, ultra-detailed.`
    };
  }

  return {
    answer: normalizedLanguage === 'hindi'
      ? `Namaste! Main Aanya hoon, aapke liye Hindi, English aur Hinglish mein friendly aur human-like help karne wali AI assistant. Aap apna kaam likho, main code, commands, explanation, image prompt, ya photo/video editing guidance bana dunga.`
      : normalizedLanguage === 'hinglish'
        ? `Hi! Main Aanya hoon, Hindi, English aur Hinglish mein aapko friendly aur natural style mein help karne wali AI assistant. Aap task likho, main code, commands, explanation, image prompt, ya photo/video editing advice de dunga.`
        : `Hi! I’m Aanya, your friendly multilingual AI assistant. I can help in Hindi, English, and Hinglish with coding, commands, explanations, image prompts, and local photo/video editing guidance.`
  };
}

async function getOpenAIReply(message, language, mode = 'general', sessionId = 'default') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return createFallbackReply(message, language, mode);
  }

  try {
    const history = getSessionHistory(sessionId);
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: getBasePrompt(language, mode) },
        ...history.slice(-8).map((entry) => ({ role: entry.role, content: entry.content }))
      ],
      temperature: 0.7
    });

    const reply = completion.choices?.[0]?.message?.content || 'I could not generate a response.';
    history.push({ role: 'assistant', content: reply });
    sessionMemory.set(sessionId, history.slice(-12));
    return { answer: reply };
  } catch (error) {
    console.error('OpenAI request failed:', error.message);
    return createFallbackReply(message, language, mode);
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'multilingual-ai-assistant' });
});

app.get('/api/local-tools', (req, res) => {
  res.json({ tools: getLocalTools() });
});

app.post('/api/search-web', async (req, res) => {
  const { query = '' } = req.body || {};
  if (!query.trim()) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  const result = await fetchWebSummary(query.trim());
  return res.json(result);
});

app.post('/api/launch-app', (req, res) => {
  const { appName = 'paint' } = req.body || {};
  const toolPath = getAppPathByName(appName);

  if (!toolPath) {
    return res.json({
      message: `I could not find a matching app for "${appName}" on this PC. Try Paint, Photos, Clipchamp, Shotcut, FFmpeg, or ImageMagick.`
    });
  }

  try {
    execSync(`start "" "${toolPath}"`, { shell: 'cmd.exe' });
    return res.json({
      ok: true,
      message: `I launched ${appName} from ${toolPath}. If it did not open, try the app manually from your installed software list.`
    });
  } catch (error) {
    return res.json({
      ok: false,
      message: `I found ${toolPath}, but launching it was blocked by Windows. Please open the app manually or use the local tool list.`
    });
  }
});

app.post('/api/upload-image', (req, res) => {
  const { fileName = 'upload.png', dataUrl = '' } = req.body || {};

  if (!dataUrl) {
    return res.status(400).json({ ok: false, error: 'Image data is required.' });
  }

  try {
    const matches = dataUrl.match(/^data:(image\/.*?);base64,(.*)$/);
    if (!matches) {
      return res.status(400).json({ ok: false, error: 'Unsupported image data format.' });
    }

    const extension = fileName.includes('.') ? path.extname(fileName) : '.png';
    const safeName = `${Date.now()}-${Math.random().toString(16).slice(2)}${extension}`;
    const resolvedFilePath = path.join(uploadsDir, safeName);
    const buffer = Buffer.from(matches[2], 'base64');
    fs.writeFileSync(resolvedFilePath, buffer);

    return res.json({ ok: true, filePath: resolvedFilePath, url: `/uploads/${safeName}` });
  } catch (error) {
    console.error('Image upload failed:', error);
    return res.status(500).json({ ok: false, error: 'Image upload failed.' });
  }
});

app.post('/api/local-edit', (req, res) => {
  const { action = 'open', filePath = '', prompt = '' } = req.body || {};
  const tools = getLocalTools();

  const resolvedPath = filePath && !path.isAbsolute(filePath)
    ? path.join(__dirname, filePath)
    : filePath;

  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    return res.status(400).json({
      message: 'Please provide a valid file path to a local photo or video on this system.'
    });
  }

  if (action === 'open') {
    const paint = tools.paint || 'C:\\Windows\\System32\\mspaint.exe';
    const photos = tools.photos || 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
    const videoTool = tools.clipchamp || tools.shotcut || 'C:\\Program Files\\Microsoft\\Photos\\Microsoft.Photos.exe';

    const chosenTool = resolvedPath.toLowerCase().endsWith('.mp4') || resolvedPath.toLowerCase().endsWith('.mov') || resolvedPath.toLowerCase().endsWith('.avi')
      ? videoTool
      : paint || photos;

    try {
      execSync(`start "" "${chosenTool}" "${resolvedPath}"`, { shell: 'cmd.exe' });
      return res.json({
        message: `I opened the file with the best local app available: ${chosenTool}. You can also manually use Paint, Photos, Clipchamp, or Shotcut for editing.`
      });
    } catch (error) {
      return res.json({
        message: `I found the file, but this PC may not have a matching local editor installed. Suggested apps: Paint, Photos, Clipchamp, Shotcut, FFmpeg, or ImageMagick. ${prompt || ''}`
      });
    }
  }

  return res.json({
    message: `For local editing on this PC, use ${Object.keys(tools).length ? Object.keys(tools).join(', ') : 'Paint, Photos, Clipchamp, Shotcut, FFmpeg, or ImageMagick'} and open your file: ${resolvedPath}.`,
    tools
  });
});

app.post('/api/chat', async (req, res) => {
  const { message = '', language = 'english', mode = 'general', sessionId = 'default' } = req.body || {};

  if (!message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const history = getSessionHistory(sessionId);
  history.push({ role: 'user', content: message });

  const result = await getOpenAIReply(message, language, mode, sessionId);
  return res.json(result);
});

app.post('/api/command', (req, res) => {
  const { message = '' } = req.body || {};
  const suggestion = generateCommandSuggestion(message);
  res.json({
    answer: 'Here are platform-specific command options:',
    commands: suggestion,
    code: `# Windows\n${suggestion.windows}\n\n# Linux / Mac\n${suggestion.linux}`
  });
});

app.post('/api/generate-image', async (req, res) => {
  const { prompt = '' } = req.body || {};

  if (!prompt.trim()) {
    return res.status(400).json({ error: 'Image prompt is required.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024'
      });

      const imageUrl = response.data?.[0]?.url || response.data?.[0]?.b64_json;
      if (imageUrl) {
        return res.json({ imageUrl, prompt });
      }
    } catch (error) {
      console.error('Image generation failed:', error.message);
    }
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#1e3a8a" />
          <stop offset="50%" stop-color="#7c3aed" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)"/>
      <circle cx="512" cy="340" r="180" fill="#a78bfa" opacity="0.8"/>
      <rect x="230" y="560" width="564" height="200" rx="18" fill="#f8fafc" opacity="0.9"/>
      <text x="512" y="640" text-anchor="middle" font-size="48" fill="#0f172a" font-family="Arial">Aanya AI</text>
      <text x="512" y="700" text-anchor="middle" font-size="28" fill="#334155" font-family="Arial">${prompt.slice(0, 60)}</text>
    </svg>
  `;

  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return res.json({ imageUrl: dataUri, prompt });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Assistant app running at http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.log(`Port ${port} is busy. Retrying on ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    console.error('Server failed to start:', error);
    process.exit(1);
  });
}

startServer(preferredPort);
