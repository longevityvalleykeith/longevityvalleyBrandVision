import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Global test settings
    globals: true,
    environment: 'node',
    
    // Test file patterns
    include: [
      'supabase/functions/tests/**/*.ts',
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.supabase',
    ],
    
    // Coverage settings
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/types/**',
      ],
    },
    
    // Timeout for async tests
    testTimeout: 30000,
    
    // Retry failed tests
    retry: 0,
    
    // Reporter
    reporter: ['verbose'],
    
    // Setup files (if needed)
    // setupFiles: ['./test/setup.ts'],
  },
});
