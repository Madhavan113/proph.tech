import { NextRequest, NextResponse } from 'next/server'
import { stripe, CREDIT_PACKAGES } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: any

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    
    try {
      // Extract metadata
      const { user_id, package_id, credits } = session.metadata
      const creditsToAdd = parseInt(credits)

      // Get admin supabase client (bypasses RLS)
      const supabase = createClient()

      // Record the payment transaction
      const { error: paymentError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user_id,
          stripe_payment_intent_id: session.payment_intent,
          stripe_checkout_session_id: session.id,
          amount: session.amount_total / 100, // Convert from cents
          currency: session.currency,
          credits_purchased: creditsToAdd,
          status: 'succeeded',
          metadata: {
            package_id: package_id,
            customer_email: session.customer_email
          },
          completed_at: new Date().toISOString()
        })

      if (paymentError) {
        console.error('Payment transaction insert error:', paymentError)
        throw paymentError
      }

      // Add credits to user balance
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user_id)
        .single()

      if (userError) {
        console.error('User fetch error:', userError)
        throw userError
      }

      const newBalance = Number(currentUser.balance || 0) + creditsToAdd

      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user_id)

      if (updateError) {
        console.error('Balance update error:', updateError)
        throw updateError
      }

      // Record credit transaction
      const { error: creditError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user_id,
          amount: creditsToAdd,
          transaction_type: 'purchase',
          description: `Purchased ${creditsToAdd} credits via Stripe`,
        })

      if (creditError) {
        console.error('Credit transaction error:', creditError)
        // Don't throw here - balance was updated successfully
      }

      console.log(`✅ Successfully added ${creditsToAdd} credits to user ${user_id}`)

    } catch (error) {
      console.error('Error processing payment:', error)
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
} 