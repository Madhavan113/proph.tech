/**
 * Test script to verify the betting RLS fix
 * This script tests the bet placement functionality after fixing the bets_nah table
 */

const API_BASE = 'http://localhost:3000/api';

// Test functions
async function testAuthContext() {
  console.log('🧪 Testing authentication context...');
  try {
    const response = await fetch(`${API_BASE}/auth-context-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    console.log('Auth context test result:', result);
    return result;
  } catch (error) {
    console.error('❌ Auth context test failed:', error);
    return null;
  }
}

async function testRLSDebug() {
  console.log('🧪 Testing RLS debug...');
  try {
    const response = await fetch(`${API_BASE}/rls-debug`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    console.log('RLS debug test result:', result);
    return result;
  } catch (error) {
    console.error('❌ RLS debug test failed:', error);
    return null;
  }
}

async function testMinimalInsert() {
  console.log('🧪 Testing minimal insert...');
  try {
    const response = await fetch(`${API_BASE}/insert-minimal-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    console.log('Minimal insert test result:', result);
    return result;
  } catch (error) {
    console.error('❌ Minimal insert test failed:', error);
    return null;
  }
}

async function testBetPlacement() {
  console.log('🧪 Testing bet placement...');
  try {
    const testBet = {
      market_id: '00000000-0000-0000-0000-000000000001', // Test market ID
      position: 'yes',
      bet_amount: 10
    };
    
    const response = await fetch(`${API_BASE}/place-bet-authenticated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBet)
    });
    
    const result = await response.json();
    console.log('Bet placement test result:', result);
    return result;
  } catch (error) {
    console.error('❌ Bet placement test failed:', error);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting betting functionality tests...\n');
  
  // Test 1: Authentication context
  const authTest = await testAuthContext();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: RLS debug
  const rlsTest = await testRLSDebug();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Minimal insert
  const insertTest = await testMinimalInsert();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: Full bet placement
  const betTest = await testBetPlacement();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Summary
  console.log('📊 TEST SUMMARY:');
  console.log('Auth Context:', authTest?.authenticated ? '✅ PASS' : '❌ FAIL');
  console.log('RLS Debug:', rlsTest?.success !== false ? '✅ PASS' : '❌ FAIL');
  console.log('Minimal Insert:', insertTest?.success ? '✅ PASS' : '❌ FAIL');
  console.log('Bet Placement:', betTest?.success ? '✅ PASS' : '❌ FAIL');
  
  if (betTest?.success) {
    console.log('\n🎉 SUCCESS! Betting functionality is working correctly.');
    console.log('The RLS policies are properly configured and bet placement should work.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the individual test results above for details.');
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAuthContext,
  testRLSDebug,
  testMinimalInsert,
  testBetPlacement,
  runAllTests
}; 