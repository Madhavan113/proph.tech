/**
 * Simple Server Check Script
 * Run this to verify the development server is running correctly
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function checkServer() {
  console.log('🔍 Checking Prophet Betting Platform Server...')
  console.log(`Testing server at: ${API_BASE_URL}`)
  console.log('='.repeat(50))

  try {
    // Test 1: Check if server is running
    console.log('\n1. Testing server connection...')
    const response = await fetch(API_BASE_URL)
    
    if (response.ok) {
      console.log('✅ Server is running and accessible')
    } else {
      console.log(`❌ Server responded with status: ${response.status}`)
      return false
    }

    // Test 2: Check content type
    const contentType = response.headers.get('content-type')
    console.log(`   Content-Type: ${contentType}`)

    // Test 3: Try a simple API endpoint
    console.log('\n2. Testing API endpoint...')
    try {
      const apiResponse = await fetch(`${API_BASE_URL}/api/test-db`)
      console.log(`   API Response Status: ${apiResponse.status}`)
      console.log(`   API Content-Type: ${apiResponse.headers.get('content-type')}`)
      
      if (apiResponse.headers.get('content-type')?.includes('application/json')) {
        console.log('✅ API is returning JSON responses')
      } else {
        console.log('❌ API is returning HTML instead of JSON')
        console.log('   This usually means the API routes are not properly configured')
      }
    } catch (apiError) {
      console.log(`❌ API test failed: ${apiError.message}`)
    }

    // Test 4: Environment check
    console.log('\n3. Environment Check...')
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'OPENAI_API_KEY'
    ]
    
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName]
      if (value) {
        console.log(`✅ ${varName}: Set`)
      } else {
        console.log(`❌ ${varName}: Missing`)
      }
    })

    console.log('\n='.repeat(50))
    console.log('✅ Server check complete!')
    
    return true

  } catch (error) {
    console.log(`❌ Cannot connect to server: ${error.message}`)
    console.log('\n💡 Solutions:')
    console.log('1. Make sure the development server is running: npm run dev')
    console.log('2. Check that the server is running on the correct port')
    console.log('3. Verify your .env.local file is properly configured')
    console.log('4. Try restarting the development server')
    
    return false
  }
}

// Run check
checkServer().catch(console.error) 