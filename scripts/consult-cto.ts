#!/usr/bin/env tsx
/**
 * The Neural Link - CTO Consultation Bridge
 *
 * Allows developers to consult the AI CTO using the current architecture snapshot.
 * Powered by Google Gemini with full project context.
 *
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// =============================================================================
// CONFIGURATION
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ANSI color codes
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// =============================================================================
// HELPERS
// =============================================================================

function getLatestSnapshot(): string | null {
  const docsDir = path.join(PROJECT_ROOT, 'docs');

  if (!fs.existsSync(docsDir)) {
    return null;
  }

  // Find all ARCH_SNAPSHOT files
  const files = fs.readdirSync(docsDir);
  const snapshotFiles = files.filter((f) =>
    f.startsWith('ARCH_SNAPSHOT') && f.endsWith('.md')
  );

  if (snapshotFiles.length === 0) {
    return null;
  }

  // Sort by modification time (most recent first)
  const sortedFiles = snapshotFiles
    .map((name) => ({
      name,
      path: path.join(docsDir, name),
      mtime: fs.statSync(path.join(docsDir, name)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (sortedFiles.length === 0) {
    throw new Error('No architecture snapshots found in docs/ directory');
  }

  return sortedFiles[0].path;
}

function readSnapshot(snapshotPath: string): string {
  try {
    return fs.readFileSync(snapshotPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read snapshot: ${error}`);
  }
}

// =============================================================================
// CTO CONSULTATION
// =============================================================================

async function consultCTO(query: string): Promise<void> {
  // Validate API key
  if (!GEMINI_API_KEY) {
    console.error(`${RED}❌ Error: GEMINI_API_KEY not found in .env.local${RESET}`);
    console.error(`${YELLOW}Please add your Gemini API key to .env.local${RESET}\n`);
    process.exit(1);
  }

  // Find latest snapshot
  const snapshotPath = getLatestSnapshot();

  if (!snapshotPath) {
    console.error(`${RED}❌ Error: No architecture snapshot found${RESET}`);
    console.error(`${YELLOW}Run 'npm run report:arch' to generate one${RESET}\n`);
    process.exit(1);
  }

  console.log(`${CYAN}🧠 THE NEURAL LINK${RESET} - Consulting CTO...\n`);
  console.log(`${BOLD}Query:${RESET} ${query}\n`);
  console.log(`${YELLOW}Loading context from: ${path.basename(snapshotPath)}${RESET}\n`);

  // Read snapshot
  const snapshotContent = readSnapshot(snapshotPath);

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp', // Fast and efficient
  });

  // System prompt
  const systemPrompt = `You are the CTO of this software project. You have deep knowledge of the codebase architecture.

Your role:
- Answer questions based ONLY on the provided Architecture Snapshot
- Be concise, technical, and specific
- Reference file paths and line numbers when relevant (format: filename:line)
- If the snapshot doesn't contain the answer, say so clearly
- Focus on facts from the snapshot, not assumptions

Architecture Snapshot:
${snapshotContent}`;

  // Generate response
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt + '\n\nDeveloper Question: ' + query }],
        },
      ],
      generationConfig: {
        temperature: 0.3, // Lower temperature for more factual responses
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const response = result.response;
    const answer = response.text();

    console.log(`${GREEN}${BOLD}CTO Response:${RESET}\n`);
    console.log(answer);
    console.log('');
  } catch (error) {
    console.error(`${RED}❌ Error calling Gemini API:${RESET}`, error);
    process.exit(1);
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  // Get query from command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`${CYAN}🧠 THE NEURAL LINK${RESET} - CTO Consultation Tool\n`);
    console.log('Usage: npm run ask:cto "your question here"\n');
    console.log('Examples:');
    console.log('  npm run ask:cto "What is our current database schema?"');
    console.log('  npm run ask:cto "How does the director router work?"');
    console.log('  npm run ask:cto "What dependencies do we use?"\n');
    process.exit(0);
  }

  const query = args.join(' ');
  await consultCTO(query);
}

main().catch((error) => {
  console.error(`${RED}❌ Fatal error:${RESET}`, error);
  process.exit(1);
});
