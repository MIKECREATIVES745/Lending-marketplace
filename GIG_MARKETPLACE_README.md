# Smart Money Gig Marketplace - Implementation Guide

## 🎯 Overview

Smart Money is a fully functional gig marketplace with real-time geofencing, location-based search, and integrated payment management. Users can post gigs, search for opportunities in their area, and earn money through microwork tasks.

## ✨ New Features Implemented

### 1. **GigBoard Component** 
- **Real Map Integration**: Interactive map powered by Leaflet showing all available gigs
- **Geofencing**: Visual radius circle showing your search area (default 5km)
- **Live Markers**: Different colored markers for your location vs. available gigs
- **Location-Based Search**: Automatically uses device GPS location

### 2. **Advanced Gig Search**
- **Keyword Search**: Search by gig title or description
- **Category Filter**: Manual Labor, Academic, Design, Coding, Delivery, Other
- **Budget Range**: Set minimum and maximum budget for gigs
- **Distance Radius**: Search within 1-50km radius of your location
- **Pagination**: Load gigs efficiently with 20 items per page

### 3. **Post a Gig**
- **Simple Modal Form**: Easy-to-use interface for posting new tasks
- **Required Fields**: Title, Description, Budget
- **Optional Fields**: Category, Deadline
- **Auto-Location**: Posts automatically include user's current location
- **Real-time Notifications**: Gig posters get notified of new applications

### 4. **Enhanced Backend API**
- **Geospatial Search**: Haversine formula for accurate distance calculations
- **Efficient Filtering**: Combined search, category, and budget filters
- **User Authentication**: Secure endpoints with JWT tokens
- **Socket.io Notifications**: Real-time updates for gig applications and hiring

## 📱 User Interface

### Map View
```
┌─────────────────────────────────────┐
│  💰 Smart Money Gigs                │
│  Find opportunities in your area   │ + Post a Gig
├─────────────────────────────────────┤
│                                     │
│  [Map Container with:              │
│   - Your Location (Blue Marker)    │
│   - Available Gigs (Violet Markers)│
│   - Geofence Circle (5km radius)]  │
│                                     │
└─────────────────────────────────────┘
```

### Search Filters
```
┌─────────────────────────────────────┐
│ 🔍 Find Gigs                        │
├─────────────────────────────────────┤
│ Search:        [___________________]│
│ Category:      [All Categories   ▼]│
│ Min Budget:    [___________________]│
│ Max Budget:    [___________________]│
│ Radius (km):   [5                 ]│
│ [Search]                            │
└─────────────────────────────────────┘
```

### Gig Card
```
┌─────────────────────────────────────┐
│ Website Redesign      [Design      ]│
├─────────────────────────────────────┤
│ Need a modern WordPress site...     │
│ Budget: ZMW 500  Distance: 2.5 km  │
│ Applicants: 3                       │
├─────────────────────────────────────┤
│ 👤 Mike Mwenya                      │
│ [Apply Now]                         │
└─────────────────────────────────────┘
```

## 🚀 API Endpoints

### GET /api/gigs
**Search and list gigs with advanced filters**

Query Parameters:
- `search` (string): Search by title or description
- `category` (string): Filter by category
- `minBudget` (number): Minimum budget in ZMW
- `maxBudget` (number): Maximum budget in ZMW
- `lat` (number): User's latitude
- `lng` (number): User's longitude
- `radius` (number): Search radius in kilometers (default: 5)
- `page` (number): Page number for pagination
- `limit` (number): Items per page (default: 20)

Example:
```
GET /api/gigs?search=design&category=design&minBudget=100&lat=-15.3941&lng=28.3297&radius=10
```

Response:
```json
{
  "data": [
    {
      "_id": "...",
      "title": "Website Design",
      "description": "...",
      "budget": 500,
      "category": "design",
      "status": "open",
      "distance": 2.5,
      "location": { "lat": -15.3941, "lng": 28.3297 },
      "posterId": { "firstName": "Mike", "lastName": "Mwenya" },
      "applicants": []
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "pages": 3
}
```

### POST /api/gigs
**Create a new gig**

Headers: `Authorization: Bearer <token>`

Body:
```json
{
  "title": "Website Redesign",
  "description": "Need a modern WordPress website redesign...",
  "budget": 500,
  "category": "design",
  "deadline": "2026-05-31T18:00:00Z",
  "location": {
    "lat": -15.3941,
    "lng": 28.3297,
    "address": "UNZA Campus"
  }
}
```

### POST /api/gigs/:id/apply
**Apply for a gig**

Headers: `Authorization: Bearer <token>`

Body:
```json
{
  "message": "I have experience in website design"
}
```

### POST /api/gigs/:id/hire
**Hire a worker for a gig**

Headers: `Authorization: Bearer <token>`

Body:
```json
{
  "workerId": "user_id_here"
}
```

## 🔧 Technology Stack

### Frontend
- **React 18**: UI framework
- **Leaflet + react-leaflet**: Map integration
- **Axios**: HTTP client with JWT interceptor
- **Socket.io-client**: Real-time notifications

### Backend
- **Express.js**: REST API framework
- **MongoDB**: Database
- **Socket.io**: Real-time communication
- **JWT**: Authentication tokens
- **Haversine Formula**: Geospatial distance calculation

## 🎨 Styling

### Color Scheme
- **Primary**: Purple (#8B5CF6) - Main brand color
- **Secondary**: Cyan (#06B6D4) - Accents
- **Success**: Green (#10B981) - Confirmations
- **Background**: Light purple gradient (#f5f3ff)

### Responsive Design
- Desktop (1024px+): Full map and filter sidebar
- Tablet (768px-1023px): Stacked layout
- Mobile (< 768px): Single column with collapsible sections

## 📲 Mobile Features

1. **GPS Location**: Automatic detection of user location
2. **Touch-Friendly**: Large buttons and easy navigation
3. **Geofence Visualization**: Clear visual representation of search radius
4. **Quick Apply**: One-tap application to gigs
5. **Real-time Notifications**: Instant updates when hired or applied to

## 🔐 Security Features

1. **JWT Authentication**: All POST/PUT/DELETE endpoints require tokens
2. **Authorization**: Users can only confirm/hire on their own gigs
3. **Input Validation**: Server-side validation of all inputs
4. **Data Sanitization**: MongoDB queries use parameterized queries

## 💰 Payment Integration

The marketplace includes escrow functionality:
1. Employer deposits budget in escrow when hiring a worker
2. Worker completes task and marks as done
3. Employer verifies and confirms completion
4. Payment is released when both parties confirm

## 🔔 Real-Time Features

Using Socket.io:
- **Gig Application Notification**: Poster gets notified when someone applies
- **Hire Notification**: Worker gets notified when hired
- **Confirmation Updates**: Real-time status updates
- **In-App Messaging**: Live chat system

## 🚀 Getting Started

### 1. Install Dependencies
```bash
# Install all dependencies
npm run install-all
```

### 2. Configure Environment
Create `.env` file in backend directory:
```
MONGODB_URI=mongodb://localhost:27017/smart-money
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
```

### 3. Start the Application
```bash
# Development mode
npm start

# Frontend only
npm run frontend-only

# Backend only
npm run backend-only
```

### 4. Access the App
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 📊 Testing the Marketplace

### Create Sample Gigs (Manual)
1. Login to the app
2. Click "Gigs" in the bottom navigation
3. Click "+ Post a Gig"
4. Fill in the form and submit

### Search for Gigs
1. Use the search box to find specific gigs
2. Filter by category or budget range
3. Adjust the radius slider to change search area
4. Click on a gig marker on the map
5. Click "Apply Now" to submit your application

## 🐛 Troubleshooting

### Map not showing
- Ensure Leaflet CSS is imported in gig-board.css
- Check browser console for any errors
- Verify location permissions are granted

### Location not updating
- Allow browser permission for location access
- Check if GPS is enabled on your device
- Refresh the page to re-request location

### Gigs not appearing
- Ensure backend is running on port 5000
- Check network tab in browser dev tools
- Verify MongoDB is running with gigs collection

## 📈 Performance

- **Pagination**: Only loads 20 gigs at a time
- **Distance Filtering**: Client-side calculation after database query
- **Lazy Loading**: Components load on demand
- **Caching**: Location data cached in component state

## 🔄 Future Enhancements

- [ ] Payment gateway integration (Stripe/Paypal)
- [ ] Video verification for job completion
- [ ] Review and rating system
- [ ] Messaging between gig poster and worker
- [ ] Gig history and analytics
- [ ] Skill badges and certifications
- [ ] Automated dispute resolution
- [ ] Mobile app (React Native)

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure MongoDB is running
4. Check network requests in browser dev tools

---

**Created**: May 21, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
