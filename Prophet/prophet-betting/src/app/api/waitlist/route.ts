import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    console.log('Waitlist submission attempt for:', email)

    // Validate email
    if (!email || typeof email !== 'string') {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if email already exists
    const { data: existingEmail, error: checkError } = await supabase
      .from('Waitlists')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is what we want
      console.error('Error checking existing email:', checkError)
      return Response.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    if (existingEmail) {
      return Response.json(
        { error: 'This email is already on the waitlist' },
        { status: 400 }
      )
    }

    // Insert email into waitlist
    const { data, error } = await supabase
      .from('Waitlists')
      .insert([
        {
          email: email.toLowerCase().trim()
        }
      ])
      .select()

    if (error) {
      console.error('Error inserting email:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return Response.json(
        { error: 'Failed to join waitlist. Please try again.' },
        { status: 500 }
      )
    }

    console.log('Successfully added email to waitlist:', email)
    return Response.json(
      { 
        message: 'Successfully joined the waitlist!',
        data: data?.[0]
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Waitlist API error:', error)
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
} 