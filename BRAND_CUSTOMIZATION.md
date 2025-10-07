# Brand Customization

## Logo
**File**: `client/src/assets/fvs-logo.svg`  
Replace with your own 120×120px SVG logo.

## Brand Colors
**Gradient**: `from-primary to-purple-600` in:
- `client/src/pages/Login.tsx` (line ~39)
- `client/src/pages/Signup.tsx` (line ~39)

**Primary color**: Update CSS variables `--primary` in `client/src/index.css`

## Company Name
Search and replace "Flying Venture System" in:
- `client/src/pages/Login.tsx`
- `client/src/pages/Signup.tsx`

Update tagline: "Smart Billing • GST Compliance • Insights"

## Files Changed
✅ `client/src/pages/Login.tsx` - Premium split-screen login  
✅ `client/src/pages/Signup.tsx` - Premium split-screen signup  
✅ `client/src/assets/fvs-logo.svg` - FVS logo (new)  

*Auth logic, routes, and backend unchanged.*
