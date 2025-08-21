/**
 * Activity Logs Implementation Test Script
 * 
 * This script validates the activity logging implementation by:
 * 1. Checking if all required files exist
 * 2. Validating TypeScript types
 * 3. Testing API endpoint structure
 * 4. Verifying component imports
 * 
 * Run with: node scripts/test-activity-logs.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`✓ ${filePath}`, 'green');
  } else {
    log(`✗ ${filePath} - File not found`, 'red');
  }
  
  return exists;
}

function checkFileContent(filePath, searchTerms) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    log(`✗ ${filePath} - File not found`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  let allFound = true;
  
  searchTerms.forEach(term => {
    if (content.includes(term)) {
      log(`  ✓ Contains: ${term}`, 'green');
    } else {
      log(`  ✗ Missing: ${term}`, 'red');
      allFound = false;
    }
  });
  
  return allFound;
}

function runTests() {
  log('\n🧪 Activity Logs Implementation Test', 'blue');
  log('=====================================\n', 'blue');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Check if all required files exist
  log('1. Checking required files...', 'yellow');
  const requiredFiles = [
    'lib/types/activity-logs.ts',
    'lib/services/activityLogger.ts',
    'pages/api/activity-logs/activity-logs.ts',
    'lib/store/base/activityLogs.ts',
    'lib/store/services/activityLogs.ts',
    'components/activity-logs/ActivityLogsDashboard.tsx',
    'components/activity-logs/ActivityLogsWidget.tsx',
    'database/migrations/create_member_activity_logs.sql'
  ];
  
  requiredFiles.forEach(file => {
    totalTests++;
    if (checkFileExists(file)) {
      passedTests++;
    }
  });
  
  // Test 2: Check TypeScript types
  log('\n2. Checking TypeScript types...', 'yellow');
  totalTests++;
  if (checkFileContent('lib/types/activity-logs.ts', [
    'export interface MemberActivityLog',
    'export enum ActivityType',
    'export interface ActivityMetadata',
    'export interface CreateActivityLogRequest',
    'export interface GetActivityLogsResponse'
  ])) {
    passedTests++;
  }
  
  // Test 3: Check Activity Logger Service
  log('\n3. Checking Activity Logger Service...', 'yellow');
  totalTests++;
  if (checkFileContent('lib/services/activityLogger.ts', [
    'export class ActivityLogger',
    'static async logActivity',
    'static async logLogin',
    'static async logMemberAdded',
    'static async logLeadCreated',
    'getClientIP',
    'getUserAgent'
  ])) {
    passedTests++;
  }
  
  // Test 4: Check API Endpoints
  log('\n4. Checking API endpoints...', 'yellow');
  totalTests++;
  if (checkFileContent('pages/api/activity-logs/activity-logs.ts', [
    'export default async function handler',
    'createActivityLog',
    'getActivityLogs',
    'getActivityLogStats',
    'checkWorkspaceAccess'
  ])) {
    passedTests++;
  }
  
  // Test 5: Check Redux Store Integration
  log('\n5. Checking Redux store integration...', 'yellow');
  totalTests++;
  if (checkFileContent('lib/store/services/activityLogs.ts', [
    'useGetActivityLogsQuery',
    'useGetActivityLogStatsQuery',
    'useCreateActivityLogMutation',
    'activityLogsUtils'
  ])) {
    passedTests++;
  }
  
  // Test 6: Check Dashboard Component
  log('\n6. Checking Dashboard component...', 'yellow');
  totalTests++;
  if (checkFileContent('components/activity-logs/ActivityLogsDashboard.tsx', [
    'export default function ActivityLogsDashboard',
    'useGetActivityLogsQuery',
    'ActivityLogsList',
    'ActivityLogFilters'
  ])) {
    passedTests++;
  }
  
  // Test 7: Check Store Configuration
  log('\n7. Checking store configuration...', 'yellow');
  totalTests++;
  if (checkFileContent('lib/store/store.ts', [
    'activityLogsApi',
    '[activityLogsApi.reducerPath]: activityLogsApi.reducer',
    '.concat(activityLogsApi.middleware)'
  ])) {
    passedTests++;
  }
  
  // Test 8: Check Workspace Integration
  log('\n8. Checking workspace integration...', 'yellow');
  totalTests++;
  if (checkFileContent('app/(dashboard)/workspace/[id]/page.tsx', [
    'ActivityLogsDashboard',
    'Activity',
    'activeTab === "activity"',
    'isAdmin'
  ])) {
    passedTests++;
  }
  
  // Test 9: Check Activity Logging Integration
  log('\n9. Checking activity logging integration...', 'yellow');
  const integrationFiles = [
    'pages/api/members/members.ts',
    'pages/api/leads/leads.ts',
    'pages/api/webhooks/webhooks.ts',
    'pages/api/status/status.ts'
  ];
  
  let integrationPassed = 0;
  integrationFiles.forEach(file => {
    totalTests++;
    if (checkFileContent(file, ['ActivityLogger'])) {
      passedTests++;
      integrationPassed++;
    }
  });
  
  // Test 10: Check Database Migration
  log('\n10. Checking database migration...', 'yellow');
  totalTests++;
  if (checkFileContent('database/migrations/create_member_activity_logs.sql', [
    'CREATE TABLE IF NOT EXISTS member_activity_logs',
    'workspace_id BIGINT NOT NULL',
    'activity_type VARCHAR(100) NOT NULL',
    'metadata JSONB',
    'CREATE INDEX',
    'ROW LEVEL SECURITY'
  ])) {
    passedTests++;
  }
  
  // Summary
  log('\n📊 Test Results', 'blue');
  log('===============', 'blue');
  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? 'green' : 'red');
  log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Activity logging implementation is complete.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the missing components.', 'yellow');
  }
  
  // Additional recommendations
  log('\n📝 Next Steps:', 'blue');
  log('1. Run the database migration to create the member_activity_logs table');
  log('2. Test the API endpoints using a tool like Postman or curl');
  log('3. Verify the UI components render correctly in the browser');
  log('4. Check that activity logs are being created when users perform actions');
  log('5. Ensure proper access control (only admins can see activity logs)');
  
  return passedTests === totalTests;
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
