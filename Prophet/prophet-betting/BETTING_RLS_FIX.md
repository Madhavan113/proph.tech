# Betting RLS Fix Guide

## Issue Summary

The betting functionality was failing with the error:
```
new row violates row-level security policy for table "bets_nah"
```

This occurred because the API code was trying to insert into a `bets_nah` table that either:
1. Didn't have proper Row Level Security (RLS) policies configured
2. Had conflicting/incorrect RLS policies
3. The authentication context wasn't properly passed to the database

## Root Cause Analysis

1. **Table Mismatch**: The main schema defines a `bets` table, but the API code uses `bets_nah`
2. **Missing RLS Policies**: The `bets_nah` table existed but lacked proper RLS policies
3. **Authentication Context**: The `auth.uid()` function was returning `null` in the database context
4. **Missing Helper Functions**: Debug functions like `debug_auth_context` were missing

## Solution

### Step 1: Apply the Database Fix

Run the SQL script `supabase/fix_bets_nah_rls.sql` in your Supabase SQL editor:

```bash
# In Supabase dashboard:
# 1. Go to SQL Editor
# 2. Copy and paste the contents of supabase/fix_bets_nah_rls.sql
# 3. Run the script
```

This script will:
- Create the `bets_nah` table with proper structure
- Enable Row Level Security
- Create correct RLS policies for INSERT, SELECT, UPDATE operations
- Add helper functions for debugging
- Set up proper indexes and triggers

### Step 2: Verify the Fix

Test the fix using the test script:

```bash
# Start your development server
npm run dev

# In another terminal, run the test script
node scripts/test-betting-fix.js
```

### Step 3: Alternative Testing Methods

You can also test manually using the existing API endpoints:

1. **Test authentication context**:
   ```bash
   curl -X POST http://localhost:3000/api/auth-context-test
   ```

2. **Test RLS debugging**:
   ```bash
   curl -X POST http://localhost:3000/api/rls-debug
   ```

3. **Test minimal insert**:
   ```bash
   curl -X POST http://localhost:3000/api/insert-minimal-test
   ```

4. **Test bet placement**:
   ```bash
   curl -X POST http://localhost:3000/api/place-bet-authenticated \
     -H "Content-Type: application/json" \
     -d '{"market_id": "test-market-id", "position": "yes", "bet_amount": 10}'
   ```

## What the Fix Does

### 1. Table Structure
Creates a properly structured `bets_nah` table with:
- Correct column types and constraints
- Foreign key relationships
- Proper defaults and checks

### 2. RLS Policies
Implements four key policies:

```sql
-- Anyone can view bets (public read)
CREATE POLICY "Anyone can view bets" ON public.bets_nah
    FOR SELECT USING (true);

-- Authenticated users can create bets they own
CREATE POLICY "Users can create bets" ON public.bets_nah
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid() = creator_id
    );

-- Users can update their own bets
CREATE POLICY "Users can update own bets" ON public.bets_nah
    FOR UPDATE USING (auth.uid() = creator_id);

-- Admins can manage all bets
CREATE POLICY "Admins can manage bets" ON public.bets_nah
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'super_admin'))
    );
```

### 3. Debug Functions
Adds helpful functions for troubleshooting:
- `debug_auth_context()` - Shows current authentication state
- `get_current_user_id()` - Returns current user ID

### 4. Performance Optimizations
- Indexes on commonly queried columns
- Triggers for timestamp management
- Proper grants for authenticated users

## Common Issues and Solutions

### Issue: "auth.uid() is null"
**Solution**: Ensure you're using the server-side Supabase client with proper cookie handling. The middleware should be passing authentication correctly.

### Issue: "function debug_auth_context does not exist"
**Solution**: Run the fix script which creates these missing functions.

### Issue: "User not found in users table"
**Solution**: Ensure the user exists in the `public.users` table. The `handle_new_user()` trigger should create this automatically on signup.

### Issue: "Insufficient permissions"
**Solution**: The fix script grants proper permissions to authenticated users.

## Prevention

To prevent similar issues in the future:

1. **Consistent Naming**: Use either `bets` or `bets_nah` consistently across your codebase
2. **Test RLS Policies**: Always test RLS policies in isolation before deploying
3. **Authentication Testing**: Verify `auth.uid()` works in your database context
4. **Migration Scripts**: Use proper migration scripts for schema changes

## Verification Checklist

After applying the fix, verify:

- [ ] Authentication context returns valid user ID
- [ ] RLS policies allow authorized operations
- [ ] RLS policies block unauthorized operations
- [ ] Bet insertion works for authenticated users
- [ ] Debug functions are available
- [ ] Performance indexes are created

## Next Steps

1. **Apply the Fix**: Run the SQL script in Supabase
2. **Test Thoroughly**: Use the test script to verify functionality
3. **Monitor Logs**: Check for any remaining authentication issues
4. **Update Documentation**: Keep this guide updated for future reference

## Files Changed

- `supabase/fix_bets_nah_rls.sql` - Main fix script
- `scripts/test-betting-fix.js` - Test verification script
- `BETTING_RLS_FIX.md` - This documentation

## Support

If you encounter issues after applying this fix:

1. Check the Supabase logs for detailed error messages
2. Run the debug functions to check authentication state
3. Verify your environment variables are correctly set
4. Ensure your Supabase client is properly configured

The fix addresses the core authentication and RLS issues that were preventing bet placement from working correctly. 