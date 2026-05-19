import './config/env.js';
import app from './app.js';
import { connectDB } from './config/db.js';
import { getAiStatus } from './services/ai.service.js';

const port = Number(process.env.PORT || 5000);

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

async function main() {
  await connectDB();
  const ai = getAiStatus();
  const server = app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
    console.log(
      `AI: requested=${ai.requestedProvider} active=${ai.activeProvider || 'NONE'} geminiKey=${ai.geminiConfigured} openaiKey=${ai.openaiConfigured}`
    );
    if (!ai.activeProvider) {
      console.warn('⚠ Add GEMINI_API_KEY to backend/.env — https://aistudio.google.com/apikey');
    }
  });

  // Long-running receipt OCR / AI
  server.timeout = 300000;
  server.keepAliveTimeout = 300000;
  server.headersTimeout = 310000;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
