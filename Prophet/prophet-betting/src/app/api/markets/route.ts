import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface MarketListResponse {
  markets: Array<{
    id: string
    title: string
    description: string | null
    deadline: string
    arbitrator_type: string
    arbitrator_email: string | null
    minimum_stake: number
    creator_id: string
    status: string
    resolved: boolean
    resolved_at: string | null
    outcome: string | null
    total_pool_for: number
    total_pool_against: number
    total_pool: number
    created_at: string
  }>
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'
    
    const offset = (page - 1) * limit
    
    // Build query for new schema
    let query = supabase
      .from('markets')
      .select(`
        id,
        title,
        description,
        deadline,
        arbitrator_type,
        arbitrator_email,
        minimum_stake,
        creator_id,
        status,
        resolved,
        resolved_at,
        outcome,
        total_pool_for,
        total_pool_against,
        total_pool,
        created_at
      `, { count: 'exact' })
    
    // Apply filters
    const status = searchParams.get('status') || 'all'
    if (status !== 'all') {
      if (status === 'active') {
        query = query.eq('status', 'active').eq('resolved', false)
      } else if (status === 'resolved') {
        query = query.eq('resolved', true)
      }
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    // Apply sorting and pagination
    query = query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)
    
    const { data: markets, error, count } = await query
    
    if (error) {
      console.error('Markets query error:', error)
      return NextResponse.json({
        error: 'Failed to fetch markets'
      }, { status: 500 })
    }
    
    // Return markets data directly (no transformation needed for new schema)
    const transformedMarkets = markets || []
    
    const totalPages = Math.ceil((count || 0) / limit)
    
    const response: MarketListResponse = {
      markets: transformedMarkets,
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: totalPages
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Markets API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to create markets' 
      }, { status: 403 })
    }
    
    const body = await request.json()
    const { title, description, deadline, arbitrator_type, arbitrator_email, minimum_stake = 10 } = body
    
    // Validate required fields
    if (!title || !deadline || !arbitrator_type) {
      return NextResponse.json({
        error: 'Missing required fields: title, deadline, arbitrator_type'
      }, { status: 400 })
    }
    
    // Validate arbitrator type
    if (!['creator', 'friend', 'ai'].includes(arbitrator_type)) {
      return NextResponse.json({
        error: 'Invalid arbitrator type. Must be creator, friend, or ai'
      }, { status: 400 })
    }
    
    // Create market
    const { data: market, error } = await supabase
      .from('markets')
      .insert({
        title,
        description,
        deadline,
        arbitrator_type,
        arbitrator_email: arbitrator_type === 'friend' ? arbitrator_email : null,
        minimum_stake,
        creator_id: user.id,
        status: 'active',
        resolved: false,
        total_pool_for: 0,
        total_pool_against: 0,
        total_pool: 0
      })
      .select()
      .single()
    
    if (error) {
      console.error('Create market error:', error)
      
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          error: 'A market with this title already exists'
        }, { status: 400 })
      }
      
      return NextResponse.json({
        error: 'Failed to create market'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      market
    })
    
  } catch (error) {
    console.error('Create market API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
