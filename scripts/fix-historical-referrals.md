# Historical Referral Data Analysis & Fix

## Understanding the Referral System

### How Referrals Are Counted:

1. **Signup Phase**: When a user signs up with a referral link, the `referred_by` field is stored in the `users` table
2. **Profile Creation Phase**: When a talent creates/updates their profile, if they have `referred_by`, their user_id is added to `referrals.talents` array
3. **Approval Phase**: When a talent is approved, if they have a referral_code, their user_id is added to `referrals.approved_talents` array

### What Was Broken:

- ✅ **Email/Password Signup**: WAS working - stored `referred_by` correctly
- ❌ **Wallet Signup (thirdweb-login)**: WAS NOT working - didn't capture referral codes
- ❌ **OTP Signup (verify-otp)**: WAS NOT working - didn't capture referral codes

### What's Fixed Now:

- ✅ All signup methods now capture and validate referral codes
- ✅ Referral codes are stored in `users.referred_by` for all signup methods

## Impact on Historical Data

### Users Who Are Counted:
- Users who signed up via **email/password** with referral links → They have `referred_by` set → They're counted when they create their profile

### Users Who Are NOT Counted:
- Users who signed up via **wallet/OTP** with referral links → They DON'T have `referred_by` set → They're NOT counted
- These users are "lost" referrals that cannot be retroactively recovered unless you have external tracking

## SQL Queries to Analyze Historical Data

### 1. Check users with referral codes (email/password signups)
```sql
SELECT 
  userid, 
  email, 
  referred_by, 
  created_at,
  auth_method
FROM goodhive.users 
WHERE referred_by IS NOT NULL 
ORDER BY created_at DESC;
```

### 2. Check users who signed up via wallet/OTP (potential lost referrals)
```sql
SELECT 
  userid, 
  email, 
  wallet_address,
  thirdweb_wallet_address,
  referred_by,
  created_at,
  auth_method
FROM goodhive.users 
WHERE (auth_method = 'wallet' OR auth_method = 'hybrid')
  AND referred_by IS NULL
  AND created_at < '2024-12-XX' -- Replace with date before fixes
ORDER BY created_at DESC;
```

### 3. Check which users are already counted in referrals
```sql
SELECT 
  r.referral_code,
  r.user_id as referrer_id,
  r.talents,
  r.approved_talents,
  COUNT(DISTINCT u.userid) as users_with_referral_code
FROM goodhive.referrals r
LEFT JOIN goodhive.users u ON u.referred_by = r.referral_code
GROUP BY r.referral_code, r.user_id, r.talents, r.approved_talents;
```

### 4. Find users who have referred_by but aren't in referrals.talents yet
```sql
SELECT 
  u.userid,
  u.email,
  u.referred_by,
  t.user_id as has_talent_profile
FROM goodhive.users u
LEFT JOIN goodhive.talents t ON t.user_id = u.userid
WHERE u.referred_by IS NOT NULL
  AND t.user_id IS NULL; -- Users who haven't created talent profile yet
```

## Options for Handling Historical Data

### Option 1: Do Nothing (Recommended)
- Accept that historical wallet/OTP signups with referral links are lost
- All new signups going forward will be properly tracked
- No risk of data corruption

### Option 2: Manual Review (If you have external tracking)
- If you have logs/analytics showing which users came from referral links
- Manually update `users.referred_by` for those specific users
- Then they'll be counted when they create/update their profile

### Option 3: Retroactive Fix Script (Advanced)
- Only if you have reliable external data about referral sources
- Create a script to update `users.referred_by` based on external data
- **Warning**: Only do this if you're 100% certain about the referral source

## Recommendation

**Accept the loss of historical wallet/OTP referrals** and focus on:
1. All future signups are now properly tracked
2. Users who signed up via email/password with referrals are already counted
3. The system is now working correctly for all signup methods

The counting happens when users create their profiles, so even if they signed up with a referral code, they won't be counted until they create a talent/company profile.

