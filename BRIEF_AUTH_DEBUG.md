# Brief Management Authentication Debug Guide

## Problem
Brief management actions (Draft, Archive, Delete) are failing with 403 (Forbidden) and 404 (Not Found) errors.

## Debugging Steps

### Step 1: Verify User Authentication
1. Open browser console
2. Run: `localStorage.getItem('token')`
3. Run: `JSON.parse(localStorage.getItem('user'))`
4. Check the user type and ID

### Step 2: Verify Token Contents
1. Restart the server to enable debug logs
2. Try any brief action (Draft, Archive, or Delete)
3. Check the browser console for:
   - `🔍 DELETE/DRAFT/ARCHIVE Brief - Token:` 
   - `🔍 DELETE/DRAFT/ARCHIVE Brief - User:`
   - `🔍 Auth Verification:`
4. Check the server console for:
   - `🔐 Authentication attempt:`
   - `✅ Token verified successfully for user:`
   - `🔍 User type check:`
   - `🔍 Ownership check:`

### Step 3: Check Brief Ownership
The error occurs when:
1. **User is not a brand** (`req.user.type !== 'brand'`) → Returns 403
2. **Brief doesn't exist** (`!brief`) → Returns 404
3. **User doesn't own the brief** (`brief.brandId !== req.user.id`) → Returns 403/404

### Step 4: Common Issues

#### Issue 1: Logged in as Creator instead of Brand
- **Symptom**: 403 Forbidden immediately
- **Solution**: Log out and log in with a brand account

#### Issue 2: Brief doesn't belong to logged-in brand
- **Symptom**: 403 Forbidden or 404 Not Found
- **Solution**: Ensure you're only managing briefs created by your brand account

#### Issue 3: Token expired or invalid
- **Symptom**: 401 Unauthorized
- **Solution**: Log out and log in again

### Step 5: Manual Database Check
Run this SQL query to verify brief ownership:
```sql
SELECT 
  b.id as brief_id,
  b.title,
  b.brandId,
  br.companyName,
  br.email
FROM "Brief" b
JOIN "Brand" br ON b.brandId = br.id
WHERE b.id = 'YOUR_BRIEF_ID';
```

## Expected Console Output

### Browser Console (Success):
```
🔍 DELETE Brief - Token: Present
🔍 DELETE Brief - User: {id: "...", email: "...", type: "brand"}
🔍 Auth Verification: {authenticated: true, user: {...}}
✅ Brief deleted successfully
```

### Server Console (Success):
```
🔐 Authentication attempt: {hasAuthHeader: true, hasToken: true, ...}
✅ Token verified successfully for user: {id: "...", type: "brand", email: "..."}
🔍 DELETE - User type check: {userType: "brand", userId: "..."}
🔍 DELETE - Ownership check: {briefBrandId: "...", userId: "...", match: true}
DELETE from "Brief" WHERE "id" = '...'
```

### Server Console (Failure - Wrong User Type):
```
✅ Token verified successfully for user: {id: "...", type: "creator", email: "..."}
🔍 User type check: {userType: "creator", userId: "..."}
❌ User is not a brand: creator
```

### Server Console (Failure - Wrong Ownership):
```
✅ Token verified successfully for user: {id: "brand123", type: "brand", email: "..."}
🔍 Ownership check: {briefBrandId: "brand456", userId: "brand123", match: false}
❌ Brief ownership mismatch: {briefBrandId: "brand456", userId: "brand123"}
```

## Fix Actions

1. **If logged in as creator**: Log out and log in as a brand
2. **If wrong brand**: Use a different brand account that owns the brief
3. **If token expired**: Log out and log in again
4. **If database mismatch**: Contact admin to fix brief ownership in database

