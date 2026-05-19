import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Always load backend/.env even if npm is run from another folder */
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// When Gemini is selected, ignore OpenAI keys from system environment (prevents wrong provider/errors)
if ((process.env.AI_PROVIDER || '').toLowerCase().trim() === 'gemini') {
  delete process.env.OPENAI_API_KEY;
}
