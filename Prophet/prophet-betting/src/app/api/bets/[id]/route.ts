import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Temporary response for individual bet/market details
  // TODO: Implement proper market detail API with new schema
  
  return NextResponse.json({
    error: 'Individual market details are not available yet. Please browse markets from the main feed.'
  }, { status: 501 }) // 501 Not Implemented
}
