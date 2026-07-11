# Barangay Resident Mobile App

React Native (Expo) mobile app for **residents only**. Officials, tanods, and staff use the web portal.

## Resident Features

### 📄 Blotter & Documents
- Raise a new blotter request (as complainant)
- View your blotter records and status
- View scheduled summon hearings
- Request barangay certificates (clearance, residency, etc.)
- Apply for a business permit

### 🚨 Calamity & Emergency
- Submit emergency assistance requests (rescue, medical, evacuation, food, water)
- View nearest evacuation centers with available space and contact numbers
- View relief distribution records
- Report electricity issues (power outage, damaged lines, etc.)
- View active electricity issues in the barangay

### 🌿 SK Programs (View Only)
- Browse upcoming and ongoing SK events & programs
- Track SK project updates and progress
- View available SK scholarships

## Access Control
- Residents log in by searching their name (no password needed — linked to the residents database)
- No admin/staff functions are accessible from this app
- Admin, officials, tanods, and staff must use the **web portal** — access is granted by the admin

## Setup

```bash
cd mobile_app
npm install
npm start
```

Then scan the QR code with **Expo Go** (iOS/Android).

## Requirements
- Node.js 18+
- Expo Go app on your phone
- Same Supabase project as the web app (credentials are pre-configured)

## Tech Stack
- **Expo** (React Native) with Expo Router
- **Supabase** (same database as web app)
- **TypeScript**
