import './config/env.js';
import app from './app.js';
import { connectDB } from './config/db.js';
import { getAiStatus } from './services/ai.service.js';

const port = Number(process.env.PORT || 5000);

async function main() {
  await connectDB();
  const ai = getAiStatus();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
    console.log(
      `AI: requested=${ai.requestedProvider} active=${ai.activeProvider || 'NONE'} geminiKey=${ai.geminiConfigured} openaiKey=${ai.openaiConfigured}`
    );
    if (!ai.activeProvider) {
      console.warn('⚠ Add GEMINI_API_KEY to backend/.env — https://aistudio.google.com/apikey');
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
