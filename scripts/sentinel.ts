#!/usr/bin/env tsx
/**
 * The Sentinel - Active Architectural Policing
 *
 * Validates that the codebase adheres to PostgreSQL architecture.
 * Runs automatically before dev and build to prevent MySQL drift.
 *
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// =============================================================================
// CONFIGURATION
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// =============================================================================
// VALIDATION CHECKS
// =============================================================================

interface ValidationResult {
  passed: boolean;
  message: string;
  critical: boolean;
}

function checkDrizzleConfig(): ValidationResult {
  const configPath = path.join(PROJECT_ROOT, 'drizzle.config.ts');

  try {
    const content = fs.readFileSync(configPath, 'utf-8');

    // Check for postgresql dialect
    if (!content.includes("dialect: 'postgresql'")) {
      return {
        passed: false,
        message: 'drizzle.config.ts: dialect must be "postgresql"',
        critical: true,
      };
    }

    return {
      passed: true,
      message: 'drizzle.config.ts: PostgreSQL dialect verified',
      critical: false,
    };
  } catch (error) {
    return {
      passed: false,
      message: `drizzle.config.ts: Unable to read file - ${error}`,
      critical: true,
    };
  }
}

function checkSchema(): ValidationResult {
  const schemaPath = path.join(PROJECT_ROOT, 'src', 'types', 'schema.ts');

  try {
    const content = fs.readFileSync(schemaPath, 'utf-8');

    // Check for MySQL imports
    if (content.includes('drizzle-orm/mysql-core')) {
      return {
        passed: false,
        message: 'src/types/schema.ts: MySQL imports detected (drizzle-orm/mysql-core)',
        critical: true,
      };
    }

    // Check for mysqlTable usage
    if (content.includes('mysqlTable')) {
      return {
        passed: false,
        message: 'src/types/schema.ts: mysqlTable detected - must use pgTable',
        critical: true,
      };
    }

    // Check for PostgreSQL imports
    if (!content.includes('drizzle-orm/pg-core')) {
      return {
        passed: false,
        message: 'src/types/schema.ts: Missing PostgreSQL imports (drizzle-orm/pg-core)',
        critical: true,
      };
    }

    return {
      passed: true,
      message: 'src/types/schema.ts: PostgreSQL schema verified',
      critical: false,
    };
  } catch (error) {
    return {
      passed: false,
      message: `src/types/schema.ts: Unable to read file - ${error}`,
      critical: true,
    };
  }
}

function checkPackageJson(): ValidationResult {
  const packagePath = path.join(PROJECT_ROOT, 'package.json');

  try {
    const content = fs.readFileSync(packagePath, 'utf-8');
    const packageJson = JSON.parse(content);

    // Check for mysql2 in dependencies
    if (packageJson.dependencies?.mysql2 || packageJson.devDependencies?.mysql2) {
      return {
        passed: false,
        message: 'package.json: mysql2 package detected - must be removed',
        critical: true,
      };
    }

    return {
      passed: true,
      message: 'package.json: No MySQL dependencies found',
      critical: false,
    };
  } catch (error) {
    return {
      passed: false,
      message: `package.json: Unable to read file - ${error}`,
      critical: true,
    };
  }
}

function checkEnvConfig(): ValidationResult {
  const envPath = path.join(PROJECT_ROOT, '.env.local');

  try {
    if (!fs.existsSync(envPath)) {
      return {
        passed: false,
        message: '.env.local: File not found',
        critical: false,
      };
    }

    const content = fs.readFileSync(envPath, 'utf-8');

    // Check for SUPABASE_URL
    if (!content.includes('SUPABASE_URL=')) {
      return {
        passed: false,
        message: '.env.local: SUPABASE_URL is missing',
        critical: false,
      };
    }

    return {
      passed: true,
      message: '.env.local: SUPABASE_URL configured',
      critical: false,
    };
  } catch (error) {
    return {
      passed: false,
      message: `.env.local: Unable to read file - ${error}`,
      critical: false,
    };
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function runSentinel(): Promise<void> {
  console.log('🛡️  THE SENTINEL - Architectural Validation\n');

  const checks = [
    checkDrizzleConfig(),
    checkSchema(),
    checkPackageJson(),
    checkEnvConfig(),
  ];

  let hasErrors = false;
  let hasWarnings = false;

  for (const check of checks) {
    if (!check.passed) {
      if (check.critical) {
        console.log(`${RED}❌ VIOLATION${RESET}: ${check.message}`);
        hasErrors = true;
      } else {
        console.log(`${YELLOW}⚠️  WARNING${RESET}: ${check.message}`);
        hasWarnings = true;
      }
    } else {
      console.log(`${GREEN}✓${RESET} ${check.message}`);
    }
  }

  console.log('');

  if (hasErrors) {
    console.log(`${RED}❌ ARCHITECTURE VIOLATION DETECTED${RESET}`);
    console.log('Fix the errors above before proceeding.\n');
    process.exit(1);
  }

  if (hasWarnings) {
    console.log(`${YELLOW}⚠️  Warnings detected but build can proceed${RESET}\n`);
  }

  console.log(`${GREEN}✅ ARCHITECTURE SECURE${RESET}`);
  console.log('PostgreSQL configuration validated.\n');
}

// Run the sentinel
runSentinel().catch((error) => {
  console.error(`${RED}❌ Sentinel error:${RESET}`, error);
  process.exit(1);
});
