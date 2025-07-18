export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bets: {
        Row: {
          id: string
          title: string
          description: string | null
          creator_id: string
          arbitrator_type: 'friend' | 'ai'
          arbitrator_contact: string | null
          deadline: string
          status: 'active' | 'pending_resolution' | 'resolved' | 'cancelled'
          total_pool: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          creator_id: string
          arbitrator_type: 'friend' | 'ai'
          arbitrator_contact?: string | null
          deadline: string
          status?: 'active' | 'pending_resolution' | 'resolved' | 'cancelled'
          total_pool?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          creator_id?: string
          arbitrator_type?: 'friend' | 'ai'
          arbitrator_contact?: string | null
          deadline?: string
          status?: 'active' | 'pending_resolution' | 'resolved' | 'cancelled'
          total_pool?: number
          created_at?: string
          updated_at?: string
        }
      }
      bet_participants: {
        Row: {
          id: string
          bet_id: string
          user_id: string
          prediction: 'yes' | 'no'
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          bet_id: string
          user_id: string
          prediction: 'yes' | 'no'
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          bet_id?: string
          user_id?: string
          prediction?: 'yes' | 'no'
          amount?: number
          created_at?: string
        }
      }
      arbitrator_decisions: {
        Row: {
          id: string
          bet_id: string
          arbitrator_id: string | null
          decision: 'yes' | 'no' | 'tie'
          reasoning: string | null
          is_ai_decision: boolean
          appeal_count: number
          created_at: string
        }
        Insert: {
          id?: string
          bet_id: string
          arbitrator_id?: string | null
          decision: 'yes' | 'no' | 'tie'
          reasoning?: string | null
          is_ai_decision?: boolean
          appeal_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          bet_id?: string
          arbitrator_id?: string | null
          decision?: 'yes' | 'no' | 'tie'
          reasoning?: string | null
          is_ai_decision?: boolean
          appeal_count?: number
          created_at?: string
        }
      }
      Waitlists: {
        Row: {
          id: string
          created_at: string
          email: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Bet = Database['public']['Tables']['bets']['Row']
export type BetParticipant = Database['public']['Tables']['bet_participants']['Row']
export type ArbitratorDecision = Database['public']['Tables']['arbitrator_decisions']['Row']
export type Waitlist = Database['public']['Tables']['Waitlists']['Row']
