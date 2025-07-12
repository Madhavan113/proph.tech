# Prophet Betting Platform - Incomplete Backend Features

## Overview
This document provides a comprehensive list of incomplete or missing backend features identified in the Prophet betting platform, along with implementation priorities and technical details.

## Missing Core Features (Priority 1)

### 1. Appeals System
**Description**: Allow users to appeal AI arbitration decisions
**Required Components**:
- Database table: `appeals` (user_id, bet_id, reason, status, resolution)
- API Endpoint: `POST /api/appeals`
- API Endpoint: `GET /api/appeals/{id}`
- API Endpoint: `PUT /api/appeals/{id}/resolve` (admin only)

### 2. User Profile Management
**Description**: Allow users to update their profiles
**Required Components**:
- API Endpoint: `GET /api/user/profile`
- API Endpoint: `PUT /api/user/profile`
- Fields: username, full_name, avatar_url, notification_preferences

### 3. Bet Cancellation
**Description**: Allow bet creators to cancel bets before deadline
**Required Components**:
- API Endpoint: `POST /api/bets/{id}/cancel`
- Business Rules: Only creator can cancel, must be before deadline, refund all participants

### 4. Social Features
**Description**: Comments and discussions on bets
**Required Components**:
- Database table: `bet_comments` (bet_id, user_id, content, parent_id)
- API Endpoint: `GET /api/bets/{id}/comments`
- API Endpoint: `POST /api/bets/{id}/comments`
- API Endpoint: `DELETE /api/comments/{id}`

## Payment Integration (Priority 3)

### 1. Stripe Integration
**Required Components**:
- API Endpoint: `POST /api/payments/create-checkout-session`
- API Endpoint: `POST /api/payments/webhook`
- API Endpoint: `GET /api/payments/history`
- Credit packages: Define pricing tiers

### 2. Withdrawal System
**Required Components**:
- API Endpoint: `POST /api/withdrawals/request`
- API Endpoint: `GET /api/withdrawals`
- Admin approval workflow
- Minimum withdrawal limits

## Admin Features (Priority 4)

### 1. User Management
**Required Endpoints**:
- `GET /api/admin/users` - List users with filters
- `PUT /api/admin/users/{id}` - Update user status/role
- `POST /api/admin/users/{id}/suspend` - Suspend user
- `POST /api/admin/users/{id}/credits` - Adjust credits

### 2. Bet Moderation
**Required Endpoints**:
- `GET /api/admin/bets` - List bets for moderation
- `PUT /api/admin/bets/{id}/moderate` - Approve/reject/flag
- `POST /api/admin/bets/{id}/force-resolve` - Force resolution

### 3. Market Management
**Required Endpoints**:
- `POST /api/admin/markets` - Create new market
- `PUT /api/admin/markets/{id}` - Update market
- `DELETE /api/admin/markets/{id}` - Deactivate market

### 4. Content Reports
**Required Endpoints**:
- `GET /api/admin/reports` - List content reports
- `PUT /api/admin/reports/{id}` - Review report
- `POST /api/reports` - Submit report (user endpoint)

### 5. System Settings
**Required Endpoints**:
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update settings
- Settings: welcome_bonus, min_bet, max_bet, commission_rate

## Infrastructure Features (Priority 5)

### 1. Real-time Updates
**Implementation**:
```typescript
// src/lib/realtime.ts
import { createClient } from '@/lib/supabase/client'

export function subscribeToBet(betId: string, callback: (payload: any) => void) {
  const supabase = createClient()
  
  return supabase
    .channel(`bet:${betId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'bet_participants',
      filter: `bet_id=eq.${betId}`
    }, callback)
    .subscribe()
}
```

### 2. Rate Limiting Middleware
**Implementation**:
```typescript
// src/middleware/rateLimit.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireRateLimit } from '@/lib/api-utils'

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: { maxRequests?: number; windowMs?: number }
) {
  return async (req: NextRequest) => {
    const identifier = req.headers.get('x-forwarded-for') || 'anonymous'
    
    try {
      requireRateLimit(identifier, options?.maxRequests, options?.windowMs)
      return await handler(req)
    } catch (error) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
  }
}
```

### 3. API Versioning
**Structure**:
```
src/app/api/
├── v1/
│   ├── bets/
│   ├── users/
│   └── ...
└── v2/
    └── ... (future versions)
```

### 4. Notification System
**Required Components**:
- Email service integration (SendGrid/Resend)
- Database table: `notifications` (user_id, type, data, read, sent_at)
- API Endpoint: `GET /api/notifications`
- API Endpoint: `PUT /api/notifications/{id}/read`
- Background job for sending notifications

## Security Enhancements (Priority 6)

### 1. Input Sanitization Middleware
```typescript
// src/middleware/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(input)
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  return input
}
```

### 2. CORS Configuration
```typescript
// src/middleware/cors.ts
export function corsMiddleware(req: NextRequest) {
  const response = NextResponse.next()
  
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}
```

## Testing Infrastructure (Priority 7)

### 1. Unit Tests
```typescript
// src/app/api/create-market/route.test.ts
import { POST } from './route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

describe('POST /api/create-market', () => {
  it('should create a market and bet', async () => {
    // Test implementation
  })
  
  it('should validate required fields', async () => {
    // Test implementation
  })
})
```

### 2. Integration Tests
```typescript
// tests/integration/bet-lifecycle.test.ts
describe('Bet Lifecycle', () => {
  it('should handle complete bet flow', async () => {
    // 1. Create bet
    // 2. Place bets
    // 3. Resolve bet
    // 4. Verify payouts
  })
})
```

## Implementation Roadmap

### Phase 1 (Week 1-2)
- [ ] Fix remaining schema mismatches
- [ ] Implement appeals system
- [ ] Add user profile management
- [ ] Implement bet cancellation

### Phase 2 (Week 3-4)
- [ ] Integrate Stripe payments
- [ ] Add withdrawal system
- [ ] Implement social features (comments)
- [ ] Set up real-time subscriptions

### Phase 3 (Week 5-6)
- [ ] Build admin dashboard API
- [ ] Implement content moderation
- [ ] Add notification system
- [ ] Set up email service

### Phase 4 (Week 7-8)
- [ ] Add comprehensive testing
- [ ] Implement security enhancements
- [ ] Set up monitoring/logging
- [ ] Performance optimization

## Database Migrations Needed

```sql
-- 1. Add appeals table
CREATE TABLE public.appeals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id)
);

-- 2. Add bet_comments table
CREATE TABLE public.bet_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.bet_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 3. Add notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add indexes
CREATE INDEX idx_appeals_bet ON public.appeals(bet_id);
CREATE INDEX idx_appeals_user ON public.appeals(user_id);
CREATE INDEX idx_comments_bet ON public.bet_comments(bet_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);
```

## Environment Variables Needed

```bash
# Payment Processing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email Service
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@prophet.bet

# Admin
ADMIN_SECRET_KEY=...

# Real-time
SUPABASE_REALTIME_URL=wss://...

# Monitoring
SENTRY_DSN=https://...
```

## Conclusion

The Prophet betting platform has a solid foundation but requires significant backend development to be production-ready. The priority should be on completing core features (appeals, profiles, cancellations) before moving to payment integration and admin features. Security and testing should be ongoing concerns throughout development.

Total estimated development time: 8-10 weeks for a single developer, 4-5 weeks with a team of 2-3 developers.
