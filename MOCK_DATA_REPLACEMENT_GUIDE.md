# Mock Data Replacement Guide

This guide explains how to replace all mock data with real database data in the Tripzy-inspired redesign.

## Overview

The Tripzy-inspired redesign includes several mock data sections that are clearly marked with TODO comments. All mock data can be easily replaced with real database data by following the patterns established in the existing codebase.

## Mock Data Locations & Replacement Instructions

### 1. Marketplace Component (`src/components/Marketplace.tsx`)

#### Stats Cards Section (Lines ~339-388)
**Current:** Static mock data for success notifications, featured briefs, and time statistics
**Replacement:** 
```typescript
// Add to component state
const [userNotifications, setUserNotifications] = useState([]);
const [featuredBrief, setFeaturedBrief] = useState(null);
const [platformStats, setPlatformStats] = useState(null);

// Add useEffect to fetch data
useEffect(() => {
  const fetchStatsData = async () => {
    try {
      // Fetch user notifications
      const notificationsResponse = await fetch('/api/notifications/user');
      setUserNotifications(await notificationsResponse.json());
      
      // Fetch featured brief
      const featuredResponse = await fetch('/api/briefs/featured');
      setFeaturedBrief(await featuredResponse.json());
      
      // Fetch platform statistics
      const statsResponse = await fetch('/api/stats/platform');
      setPlatformStats(await statsResponse.json());
    } catch (error) {
      console.error('Error fetching stats data:', error);
    }
  };
  
  fetchStatsData();
}, []);
```

### 2. Community Page (`src/components/CommunityPage.tsx`)

#### Trending Discussions (Lines ~156-161)
**Current:** Static array of discussion objects
**Replacement:**
```typescript
// Add to component state
const [trendingDiscussions, setTrendingDiscussions] = useState([]);

// Add useEffect
useEffect(() => {
  const fetchTrendingDiscussions = async () => {
    try {
      const response = await fetch('/api/community/discussions/trending');
      setTrendingDiscussions(await response.json());
    } catch (error) {
      console.error('Error fetching trending discussions:', error);
    }
  };
  
  fetchTrendingDiscussions();
}, []);

// Replace the static array with: trendingDiscussions.map((discussion, index) => (
```

#### Live Community Session (Lines ~188-198)
**Current:** Static mock clip with hardcoded participant count and duration
**Replacement:**
```typescript
// Add to component state
const [liveSession, setLiveSession] = useState(null);

// Add useEffect
useEffect(() => {
  const fetchLiveSession = async () => {
    try {
      const response = await fetch('/api/community/sessions/live');
      setLiveSession(await response.json());
    } catch (error) {
      console.error('Error fetching live session:', error);
    }
  };
  
  fetchLiveSession();
}, []);

// Replace static values with: liveSession?.participantCount, liveSession?.duration
```

### 3. Events Page (`src/components/EventsPage.tsx`)

#### Featured Event (Lines ~142-152)
**Current:** Static mock clip with hardcoded event data
**Replacement:**
```typescript
// Add to component state
const [featuredEvent, setFeaturedEvent] = useState(null);

// Add useEffect
useEffect(() => {
  const fetchFeaturedEvent = async () => {
    try {
      const response = await fetch('/api/events/featured');
      setFeaturedEvent(await response.json());
    } catch (error) {
      console.error('Error fetching featured event:', error);
    }
  };
  
  fetchFeaturedEvent();
}, []);
```

#### Upcoming Events List (Lines ~162-166)
**Current:** Static array of event objects
**Replacement:**
```typescript
// Add to component state
const [upcomingEvents, setUpcomingEvents] = useState([]);

// Add useEffect
useEffect(() => {
  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch('/api/events/upcoming');
      setUpcomingEvents(await response.json());
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };
  
  fetchUpcomingEvents();
}, []);

// Replace the static array with: upcomingEvents.map((event, index) => (
```

### 4. Success Stories Page (`src/components/SuccessStoriesPage.tsx`)

#### Featured Success Stories (Lines ~140+)
**Current:** Static success story cards
**Replacement:**
```typescript
// Add to component state
const [featuredStories, setFeaturedStories] = useState([]);

// Add useEffect
useEffect(() => {
  const fetchFeaturedStories = async () => {
    try {
      const response = await fetch('/api/success-stories/featured');
      setFeaturedStories(await response.json());
    } catch (error) {
      console.error('Error fetching featured stories:', error);
    }
  };
  
  fetchFeaturedStories();
}, []);
```

## MockClip Component Integration

The `MockClip` component is designed to be easily replaced with real media:

```typescript
// Instead of MockClip, use real media when available:
{featuredEvent?.videoUrl ? (
  <video 
    src={featuredEvent.videoUrl} 
    className="w-full h-48 rounded-xl object-cover"
    controls
  />
) : (
  <MockClip 
    type="video" 
    aspectRatio="16/9"
    label={featuredEvent?.title || "Event Preview"}
    className="w-full h-48"
  />
)}
```

## API Endpoints to Implement

Based on the mock data, you'll need these API endpoints:

### Notifications
- `GET /api/notifications/user` - User's recent notifications
- `GET /api/notifications/recent` - Recent platform notifications

### Briefs
- `GET /api/briefs/featured` - Featured brief information
- `GET /api/briefs/trending` - Trending briefs

### Community
- `GET /api/community/discussions/trending` - Trending forum discussions
- `GET /api/community/sessions/live` - Current live community session

### Events
- `GET /api/events/featured` - Featured event with video/thumbnail
- `GET /api/events/upcoming` - List of upcoming events
- `GET /api/events/categories` - Event categories with counts

### Success Stories
- `GET /api/success-stories/featured` - Featured success stories
- `GET /api/success-stories/categories` - Stories by category

### Platform Statistics
- `GET /api/stats/platform` - Platform-wide statistics
- `GET /api/stats/user` - User-specific statistics

## Database Schema Considerations

Ensure your database supports:

1. **Notifications table** with user_id, type, message, created_at
2. **Featured content flags** on existing tables (briefs, events, stories)
3. **Community discussions** with engagement metrics
4. **Event sessions** with live status and participant tracking
5. **Success story media** with video/image URLs

## Testing Strategy

1. **Fallback Handling:** All components should gracefully handle empty data arrays
2. **Loading States:** Add loading indicators while fetching real data
3. **Error Handling:** Implement proper error boundaries for failed API calls
4. **Progressive Enhancement:** Mock data serves as fallback when APIs are unavailable

## Migration Checklist

- [ ] Implement all required API endpoints
- [ ] Update component state management
- [ ] Add proper loading and error states
- [ ] Test with real data
- [ ] Remove TODO comments after implementation
- [ ] Update documentation

## Benefits of This Approach

1. **Visual Consistency:** Mock data maintains the Tripzy aesthetic during development
2. **Easy Migration:** Clear separation between mock and real data
3. **Progressive Enhancement:** Components work with or without real data
4. **Developer Experience:** Clear TODO markers for implementation
5. **User Experience:** Beautiful visual design while data loads

This approach ensures that the Tripzy-inspired design can be fully implemented with mock data, then seamlessly transitioned to real database content without losing the visual appeal.







