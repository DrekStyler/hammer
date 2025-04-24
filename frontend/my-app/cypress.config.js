import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
  
  retries: {
    runMode: 2,
    openMode: 0,
  },
  
  // Automatically captures screenshots on failure
  screenshotOnRunFailure: true,
  
  // Default timeout for commands
  defaultCommandTimeout: 6000,
  
  // Default timeout for page load
  pageLoadTimeout: 10000,
  
  // Video recording settings
  video: true,
  videoUploadOnPasses: false
}); 