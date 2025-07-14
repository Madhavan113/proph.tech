# Prophet Betting Platform - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Environment Setup
Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration (for AI arbitration)
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 2: Database Setup
1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run:
   - `supabase/schema_complete.sql` (complete database schema)
   - `supabase/rpc_functions.sql` (stored procedures)

### Step 3: Authentication Configuration
In your Supabase Dashboard:
1. Go to Authentication → Settings
2. Set **Site URL**: `http://localhost:3000`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/confirm`

### Step 4: Install Dependencies & Run
```bash
npm install
npm run dev
```

### Step 5: Test the Application
1. Go to `http://localhost:3000`
2. **Test forms first**: Visit `http://localhost:3000/test-forms` to verify all inputs work
3. Sign up for a new account
4. Create a test bet with AI arbitrator
5. Test the AI arbitration functionality

## ✅ Testing Forms (Fixed!)

### Verify Form Inputs Work
Go to `http://localhost:3000/test-forms` and test:
- ✅ Text inputs accept typing (white text on black background)
- ✅ Email/password fields work with proper styling
- ✅ Number and date inputs functional
- ✅ Textareas and dropdowns working
- ✅ Form submission works
- ✅ Real-time value updates visible
- ✅ Error states and disabled states styled correctly
- ✅ Hover and focus effects work properly

### Test Across All Pages
Forms should now work on:
- ✅ `/signup` - Create new account
- ✅ `/login` - Sign in to account  
- ✅ `/create` - Create new bets
- ✅ All other form pages

### New Form Design System
All forms now use a cohesive design system:
- **Input styling**: White text on black background with green accent borders
- **Typography**: Crimson Text serif font for consistency
- **States**: Proper hover, focus, error, and disabled states
- **Layout**: Consistent spacing and form groups
- **Integration**: Seamlessly blends with site's black/white aesthetic

## 🤖 Testing AI Agent

### Quick Test (No Auth Required)
```bash
node scripts/test-api.js
```

### Manual Test via API
```bash
# Test AI arbitration endpoint
curl -X POST http://localhost:3000/api/ai-arbitrate \
  -H "Content-Type: application/json" \
  -d '{"bet_id": "your-bet-id"}'
```

### Web Interface Test
1. Create account and login
2. Go to `/create` and make a bet with:
   - **Title**: "Test AI Arbitration"
   - **Description**: "This bet tests AI functionality"
   - **Deadline**: 1 minute from now
   - **Arbitrator**: AI Agent
3. Wait for deadline to pass
4. Manually trigger AI arbitration

## 🔧 Fixed Issues

### ✅ Form Interaction Problems
- **Issue**: Form inputs couldn't be typed in across all pages (signup, create, markets)
- **Root Cause 1**: Missing `pointer-events: none` on `.dither-heavy::before` CSS pseudo-element
- **Root Cause 2**: Forms using generic Tailwind classes instead of custom design system
- **Fix 1**: Added `pointer-events: none` to prevent invisible overlay from blocking interactions
- **Fix 2**: Updated all forms to use Prophet design system classes
- **Now**: All form inputs work perfectly with consistent white-on-black styling that matches the site aesthetic

### ✅ Authentication Flow
- **Issue**: Login/signup forms not functional
- **Fix**: Simplified components with proper error handling
- **Now**: Full authentication flow working

### ✅ API Endpoints
- **Issue**: Backend API calls not working
- **Fix**: Comprehensive error handling and validation
- **Now**: All endpoints tested and functional

## 📊 Backend API Status

All endpoints are working correctly:

### ✅ Public Endpoints
- `GET /api/bets` - List all bets
- `GET /api/markets` - List markets
- `POST /api/ai-arbitrate` - AI arbitration (no auth needed)

### ✅ Protected Endpoints
- `POST /api/create-market` - Create new bets
- `POST /api/place-bet` - Place bets
- `POST /api/resolve-bet` - Manual resolution
- `GET /api/user/balance` - User balance

### ✅ AI Agent Features
- **Development Mode**: Random decisions for testing
- **Production Mode**: GPT-4 powered decisions
- **Error Handling**: Graceful fallbacks
- **Appeals System**: User can contest AI decisions

## 🎯 Next Steps

1. **Set up environment variables** (Step 1 above)
2. **Configure Supabase** (Steps 2-3 above)
3. **Test authentication** by creating an account
4. **Create test bet** with AI arbitrator
5. **Test AI arbitration** functionality
6. **Explore appeals system** if needed

## 🆘 Troubleshooting

### Forms Not Working
- Clear browser cache
- Check console for errors
- Ensure environment variables are set

### Authentication Issues
- Verify Supabase URL and keys
- Check redirect URLs in Supabase dashboard
- Ensure email confirmation is working

### AI Agent Not Working
- Check OpenAI API key
- Verify bet has `arbitrator_type: 'ai'`
- Ensure deadline has passed

### Database Errors
- Run the schema SQL files
- Check RLS policies are enabled
- Verify database connection

## 🎉 Success!

If everything is working, you should be able to:
- Create accounts and login
- Create bets with AI arbitrators
- Have the AI automatically resolve bets
- See money distributed to winners
- Appeal AI decisions if needed

**Your AI agent is fully functional and ready to use!** 