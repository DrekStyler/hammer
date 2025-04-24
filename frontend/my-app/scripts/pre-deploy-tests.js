#!/usr/bin/env node

/**
 * Pre-deployment test script that runs all tests before allowing deployment
 * This script will:
 * 1. Run linting
 * 2. Run Cypress tests
 * 3. Generate a report
 * 4. Exit with appropriate code based on test results
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '../cypress/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const reportFile = path.join(reportsDir, `pre-deploy-report-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Log function that writes to console and report file
function log(message, color = '') {
  const coloredMessage = `${color}${message}${colors.reset}`;
  const plainMessage = message;
  
  console.log(coloredMessage);
  fs.appendFileSync(reportFile, plainMessage + '\n');
}

// Start the report
log(`🚀 Starting pre-deployment tests at ${new Date().toISOString()}`, colors.bright + colors.blue);
log('='.repeat(80), colors.blue);

let exitCode = 0;
let testResults = {
  linting: false,
  tests: false,
  links: 0,
  buttons: 0,
  errors: []
};

// Run the tests and capture results
try {
  // Step 1: Run linting
  log('\n📝 Running code linting...', colors.cyan);
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    log('✅ Linting passed!', colors.green);
    testResults.linting = true;
  } catch (error) {
    log('❌ Linting failed!', colors.red);
    log(error.toString(), colors.red);
    testResults.errors.push('Linting errors');
    exitCode = 1;
  }

  // Step 2: Start development server and run tests
  log('\n🧪 Running Cypress tests...', colors.cyan);
  try {
    execSync('npm run test:ci', { stdio: 'inherit' });
    log('✅ All tests passed!', colors.green);
    testResults.tests = true;
  } catch (error) {
    log('❌ Some tests failed!', colors.red);
    log(error.toString(), colors.red);
    testResults.errors.push('Test failures');
    exitCode = 1;
  }

  // Parse test results to get more details
  if (fs.existsSync('cypress/results.json')) {
    try {
      const testData = JSON.parse(fs.readFileSync('cypress/results.json', 'utf8'));
      // Count links and buttons tested
      testData.runs.forEach(run => {
        run.tests.forEach(test => {
          if (test.title.includes('link')) testResults.links++;
          if (test.title.includes('button')) testResults.buttons++;
        });
      });
    } catch (e) {
      log('⚠️ Could not parse test results data', colors.yellow);
    }
  }

  // Generate summary
  log('\n📊 Pre-deployment Test Summary:', colors.bright + colors.blue);
  log('='.repeat(80), colors.blue);
  log(`Linting: ${testResults.linting ? '✅ Passed' : '❌ Failed'}`, testResults.linting ? colors.green : colors.red);
  log(`Tests: ${testResults.tests ? '✅ Passed' : '❌ Failed'}`, testResults.tests ? colors.green : colors.red);
  log(`Links tested: ${testResults.links}`, colors.blue);
  log(`Buttons tested: ${testResults.buttons}`, colors.blue);
  
  if (testResults.errors.length > 0) {
    log('\n⚠️ Errors encountered:', colors.yellow);
    testResults.errors.forEach(err => log(`- ${err}`, colors.yellow));
  }

  // Final result
  if (exitCode === 0) {
    log('\n✅ All pre-deployment tests passed! Ready to deploy.', colors.bright + colors.green);
  } else {
    log('\n❌ Pre-deployment tests failed! Fix issues before deploying.', colors.bright + colors.red);
  }

} catch (error) {
  log(`\n💥 Fatal error running tests: ${error}`, colors.red);
  exitCode = 1;
}

log(`\n🏁 Tests completed at ${new Date().toISOString()}`, colors.bright + colors.blue);
log('='.repeat(80), colors.blue);

// Exit with appropriate code
process.exit(exitCode); 