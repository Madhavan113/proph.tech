import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { 
  validateFields, 
  validators, 
  createSuccessResponse, 
  createValidationErrorResponse,
  withErrorHandling,
  checkBetExists,
  APIError
} from '@/lib/api-utils'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  // This endpoint can be called by system/cron jobs or authorized users
  const supabase = await createClient()
  
  const body = await request.json()
  const { bet_id } = body

  // Validate input
  const validation = validateFields(body, {
    bet_id: [validators.required]
  })

  if (!validation.isValid) {
    return createValidationErrorResponse(validation.errors)
  }

  // Check if bet exists
  const bet = await checkBetExists(supabase, bet_id)

  if (bet.resolved) {
    throw new APIError('Bet is already resolved', 400, 'BET_RESOLVED')
  }

  if (bet.arbitrator_type !== 'ai') {
    throw new APIError('This bet is not set up for AI arbitration', 400, 'NOT_AI_BET')
  }

  // Check if deadline has passed
  if (new Date(bet.deadline) > new Date()) {
    throw new APIError('Cannot resolve bet before deadline', 400, 'DEADLINE_NOT_PASSED')
  }

  let aiDecision: boolean
  let reasoning: string

  // For now, make a simple decision (can be enhanced with real AI logic)
  if (process.env.NODE_ENV === 'development' || !process.env.OPENAI_API_KEY) {
    // Development: Random decision for testing
    aiDecision = Math.random() > 0.5
    reasoning = `AI Decision (Development Mode): Randomly determined outcome. This is a placeholder for actual AI arbitration logic.`
  } else {
    // Production: Use OpenAI to make decision
    try {
      const prompt = `
You are an AI arbitrator for a betting platform. You need to determine if the following bet should resolve as TRUE (yes) or FALSE (no).

Bet Title: ${bet.title}
Bet Description: ${bet.description}
Deadline: ${bet.deadline}

Based on publicly available information and the description provided, determine if this bet should resolve as TRUE or FALSE. 

Provide your decision as a JSON object with:
{
  "decision": true/false,
  "reasoning": "Brief explanation of your decision"
}

Be objective and base your decision on verifiable facts when possible.
`

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      })

      const aiResponse = JSON.parse(response.choices[0].message.content || '{"decision": false, "reasoning": "Unable to determine"}')
      aiDecision = aiResponse.decision
      reasoning = aiResponse.reasoning

    } catch (aiError) {
      console.error('OpenAI API error:', aiError)
      // Fallback to random for now
      aiDecision = Math.random() > 0.5
      reasoning = "AI arbitration failed, random decision made as fallback"
    }
  }

  // Create AI user for system decisions if it doesn't exist
  const aiUserId = '00000000-0000-0000-0000-000000000000' // System AI user ID

  // Resolve the bet using our RPC function
  const { data, error } = await supabase.rpc('resolve_bet', {
    p_bet_id: bet_id,
    p_outcome: aiDecision,
    p_arbitrator_id: aiUserId,
    p_reasoning: reasoning
  })

  if (error) {
    console.error('AI resolve bet error:', error)
    throw new APIError(error.message || 'Failed to resolve bet', 500)
  }

  return createSuccessResponse({ 
    ai_decision: aiDecision,
    reasoning: reasoning,
    decision_id: data?.decision_id,
    total_payout: data?.total_payout,
    winners_count: data?.winners_count
  })
})
