# Error 402 - Mapbox Boundaries Access

## 🚨 Problem

You're seeing **402 errors** for:
- `mapbox.boundaries-adm1-v3` (State boundaries)
- `mapbox.boundaries-adm2-v3` (City boundaries)

**Error:** `Failed to load resource: the server responded with a status of 402`

## 💡 What This Means

**402 = Payment Required**

Your Mapbox token doesn't have access to adm1/adm2 boundaries. These require:
- Paid Mapbox account
- Specific access enabled by Mapbox

**Free tier only includes:**
- ✅ `mapbox.country-boundaries-v1` (adm0 - Countries)
- ❌ adm1/adm2 require paid access

---

## ✅ Solutions

### Option 1: Use GADM Data (Free Alternative)
- Download GADM GeoJSON files
- Host locally or convert
- Use as custom sources

### Option 2: Upgrade Mapbox Account
- Enable Boundaries dataset access
- Contact Mapbox sales

### Option 3: Work with Country Only (Current)
- Use country boundaries only
- Implement your own state/city data if needed

---

## 🔧 Current Status

- ✅ **Country boundaries work** (adm0)
- ❌ **State boundaries blocked** (adm1 - 402)
- ❌ **City boundaries blocked** (adm2 - 402)

**The app will automatically handle this and only use what's accessible.**


