#!/usr/bin/env tsx
/**
 * Architecture Snapshot Generator
 *
 * Generates a comprehensive architectural report for context packing.
 * Output: docs/ARCH_SNAPSHOT.md
 *
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// =============================================================================
// CONFIGURATION
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Generate date-based filename (DDMMYY format)
const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const year = String(now.getFullYear()).slice(-2);
const dateStr = `${day}${month}${year}`;

const OUTPUT_FILE = path.join(PROJECT_ROOT, 'docs', `ARCH_SNAPSHOT_${dateStr}.md`);

const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.claude',
  'coverage',
];

const FILES_TO_INCLUDE = [
  'package.json',
  'drizzle.config.ts',
  'tsconfig.json',
  'src/types/schema.ts',
  'FINAL-DEV_SPEC_v2.md',
  '.env.example',
];

// =============================================================================
// UTILITIES
// =============================================================================

function readFileContent(filePath: string): string {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  try {
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
    return `[File not found: ${filePath}]`;
  } catch (error) {
    return `[Error reading ${filePath}: ${error}]`;
  }
}

function generateProjectTree(dir: string, prefix: string = '', isLast: boolean = true): string[] {
  const lines: string[] = [];
  const dirName = path.basename(dir);

  // Skip excluded directories
  if (EXCLUDED_DIRS.includes(dirName)) {
    return lines;
  }

  const connector = isLast ? '└── ' : '├── ';
  const relativePath = path.relative(PROJECT_ROOT, dir);
  // Use full project name for root, basename for subdirectories
  const displayName = relativePath === '' ? path.basename(PROJECT_ROOT) : dirName;

  lines.push(prefix + connector + displayName);

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const filtered = entries.filter(entry => !EXCLUDED_DIRS.includes(entry.name));

    // Sort: directories first, then files
    const sorted = filtered.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    sorted.forEach((entry, index) => {
      const isLastEntry = index === sorted.length - 1;
      const entryPath = path.join(dir, entry.name);
      const newPrefix = prefix + (isLast ? '    ' : '│   ');

      if (entry.isDirectory()) {
        lines.push(...generateProjectTree(entryPath, newPrefix, isLastEntry));
      } else {
        const entryConnector = isLastEntry ? '└── ' : '├── ';
        lines.push(newPrefix + entryConnector + entry.name);
      }
    });
  } catch (error) {
    lines.push(prefix + '    [Error reading directory]');
  }

  return lines;
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

async function generateReport(): Promise<string> {
  const timestamp = new Date().toISOString();

  let report = '';

  // Header
  report += '# Architecture Snapshot\n\n';
  report += `**Generated**: ${timestamp}\n`;
  report += `**Project**: Longevity Valley Brand Content Factory\n`;
  report += `**Phase**: 3B + 3C (Brand Analysis + Video Director Mode)\n\n`;
  report += '---\n\n';

  // Table of Contents
  report += '## Table of Contents\n\n';
  report += '1. [Project Structure](#project-structure)\n';
  report += '2. [Core Configuration Files](#core-configuration-files)\n';
  report += '3. [Type System](#type-system)\n';
  report += '4. [Development Specification](#development-specification)\n';
  report += '5. [Environment Template](#environment-template)\n\n';
  report += '---\n\n';

  // Section 1: Project Structure
  report += '## 1. Project Structure\n\n';
  report += '```\n';
  const tree = generateProjectTree(PROJECT_ROOT);
  report += tree.join('\n');
  report += '\n```\n\n';
  report += '---\n\n';

  // Section 2: Core Configuration Files
  report += '## 2. Core Configuration Files\n\n';

  const configFiles = ['package.json', 'drizzle.config.ts', 'tsconfig.json'];

  for (const file of configFiles) {
    const content = readFileContent(file);
    const ext = path.extname(file).slice(1) || 'json';

    report += `### ${file}\n\n`;
    report += '```' + ext + '\n';
    report += content;
    report += '\n```\n\n';
  }

  report += '---\n\n';

  // Section 3: Type System
  report += '## 3. Type System\n\n';
  report += '### src/types/schema.ts\n\n';
  report += '```typescript\n';
  report += readFileContent('src/types/schema.ts');
  report += '\n```\n\n';
  report += '---\n\n';

  // Section 4: Development Specification
  report += '## 4. Development Specification\n\n';
  report += '### FINAL-DEV_SPEC_v2.md\n\n';
  report += '```markdown\n';
  report += readFileContent('FINAL-DEV_SPEC_v2.md');
  report += '\n```\n\n';
  report += '---\n\n';

  // Section 5: Environment Template
  report += '## 5. Environment Template\n\n';
  report += '### .env.example\n\n';
  report += '```bash\n';
  report += readFileContent('.env.example');
  report += '\n```\n\n';
  report += '---\n\n';

  // Footer
  report += '## Generation Notes\n\n';
  report += '- This snapshot excludes: `' + EXCLUDED_DIRS.join('`, `') + '`\n';
  report += '- Tree structure shows directories first, then files alphabetically\n';
  report += '- All file contents are captured as-is at generation time\n';
  report += '- This report is auto-generated via `npm run report:arch`\n\n';
  report += '**End of Architecture Snapshot**\n';

  return report;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('🏗️  Generating Architecture Snapshot...\n');

  // Ensure docs directory exists
  const docsDir = path.join(PROJECT_ROOT, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
    console.log('✓ Created docs/ directory');
  }

  // Generate report
  const report = await generateReport();

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, report, 'utf-8');

  const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2);

  console.log('✓ Report generated successfully!');
  console.log(`  Location: ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`);
  console.log(`  Size: ${fileSize} KB`);
  console.log(`  Sections: 5`);
  console.log(`  Files included: ${FILES_TO_INCLUDE.length}`);
  console.log('\n✅ Architecture snapshot ready for context packing\n');
}

main().catch((error) => {
  console.error('❌ Error generating report:', error);
  process.exit(1);
});
