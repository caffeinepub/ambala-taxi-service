# Ambala Local Taxi Service

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full-stack taxi booking app for a 12-car local taxi service in Ambala village area
- Three views: Rider App, Driver App, Admin Dashboard — all in a single-page tabbed layout
- Bilingual UI (Hindi + English labels)

**Rider App**
- Auto-detect current GPS location as pickup (uses browser Geolocation API; display as text address or lat/lng)
- Fixed list of 5 drop-off destinations: Ambala Cantt, Railway Station, Bus Stand, Mullana, Naggal
- Fare calculator: ₹20 base + ₹12/km based on estimated distance to drop
- Display all 12 registered drivers with name, car number, and a phone call button (tel: link)
- Book ride button that creates a ride request assigned to a selected driver
- Simulated live tracking: show a map-like view with a moving dot (OpenStreetMap via iframe or simple SVG canvas; no Google Maps API key required)
- Payment method: Cash only, clearly stated

**Driver App**
- List of pending ride requests (with rider name, pickup location, drop destination, fare)
- Accept / Reject buttons per request
- Once accepted: show pickup navigation link (Google Maps deep link), call rider button
- Driver online/offline toggle

**Admin Dashboard**
- Summary stats: total rides, active drivers (online/offline count)
- Full rides list with status (pending, accepted, completed, cancelled)
- Driver management: add new driver, edit name/car number/phone for each of the 12 drivers
- Toggle driver active status

**Backend (Motoko)**
- `Driver` record: id, name, carNumber, phone, isOnline, isActive
- `Ride` record: id, riderId (text), driverIdOpt, pickupLocation (text/lat+lng), dropLocation, estimatedFare, status (Pending/Accepted/Completed/Cancelled), createdAt
- CRUD for drivers (admin only by convention — no auth required for MVP)
- Ride booking: createRide, acceptRide, rejectRide, completeRide
- Queries: getAllRides, getAllDrivers, getOnlineDrivers, getRidesByStatus
- Seed 12 sample drivers with Ambala-area names/car numbers

### Modify
None (new project).

### Remove
None (new project).

## Implementation Plan
1. Select `authorization` component for admin route protection (optional, skip for MVP simplicity)
2. Generate Motoko backend with Driver and Ride data models, CRUD APIs, seed data
3. Build frontend with three tab views: Rider, Driver, Admin
4. Rider view: geolocation pickup, drop selector, fare display, driver list, book ride
5. Driver view: ride requests list, accept/reject, navigation + call links, online toggle
6. Admin view: stats, rides table, driver management table with add/edit
7. Use green/white theme, large touch-friendly buttons, Hindi+English labels throughout
8. Deploy draft
