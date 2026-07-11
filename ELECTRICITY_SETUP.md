# Electricity Dashboard Setup

## Database Migration

### Step 1: Run the migration
Run the following SQL migration in your Supabase SQL editor:

```sql
-- Copy and paste the contents of electricity-migration.sql
```

### Step 2: Add dummy data (optional)
To test the dashboard with sample data:

```sql
-- Copy and paste the contents of electricity-dummy-data.sql
```

Or run directly:
```bash
# If using Supabase CLI
supabase db reset --linked
# Then run your existing migrations plus:
# 1. electricity-migration.sql
# 2. electricity-dummy-data.sql
```

## Features Added

### 1. Electricity Issues Dashboard (`/calamity/electricity`)
- **Report Issues**: Walk-in residents can report power outages and electrical problems
- **Track Status**: Monitor issue resolution progress (Reported → Investigating → In Progress → Resolved)
- **Location Mapping**: Record specific locations for future mobile GPS integration
- **Priority Management**: Categorize issues by urgency (Low, Medium, High, Critical)
- **Contact Information**: Store reporter details for follow-up

### 2. Main Dashboard Integration
- Added electricity issues counter to main calamity dashboard
- Quick access link to electricity dashboard
- Real-time stats display

### 3. Database Tables
- `cal_electricity_issues`: Main issues tracking
- `cal_electricity_areas`: Service area management (for future use)

### 4. Mobile-Ready Structure
The database schema includes:
- `coordinates` field for GPS location data
- Contact information storage
- Status tracking for mobile app integration

## Usage

### With Dummy Data
The dummy data includes:
- **5 Active Issues**: Various types (Power Outage, Damaged Lines, Street Light, Transformer)
- **3 Resolved Issues**: Recently completed cases
- **2 Older Issues**: For historical data testing
- **2 Walk-in Reports**: Cases without contact information
- **Different Priorities**: Critical, High, Medium, Low examples
- **Various Locations**: Spread across all 4 zones
- **Realistic Scenarios**: School outages, market issues, safety concerns

### Dashboard Testing
1. **Walk-in Reporting**: Staff can help residents report issues using the "Report Issue" button
2. **Status Updates**: Update issue status as work progresses
3. **Tracking**: Monitor all active issues and resolution times
4. **Future Mobile**: Structure ready for mobile app integration

## Next Steps for Mobile Integration

When you add mobile features, you can:
- Use the `coordinates` field to store GPS data
- Add photo upload capability
- Implement push notifications for status updates
- Add resident self-service reporting