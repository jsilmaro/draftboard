import React, { useState, useEffect, useCallback } from 'react';

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'webinar' | 'workshop' | 'networking' | 'conference';
  category: 'education' | 'networking' | 'business' | 'creative' | 'technical';
  host: {
    id: string;
    name: string;
    type: 'brand' | 'creator' | 'platform';
    avatar?: string;
    bio?: string;
  };
  date: string;
  time: string;
  duration: string;
  timezone: string;
  maxAttendees: number;
  currentAttendees: number;
  price: number;
  currency: string;
  isFree: boolean;
  isLive: boolean;
  isRecorded: boolean;
  recordingUrl?: string;
  meetingUrl?: string;
  tags: string[];
  requirements: string[];
  learningOutcomes: string[];
  agenda: {
    time: string;
    topic: string;
    speaker?: string;
  }[];
  featured: boolean;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  createdAt: string;
}

interface EventsWebinarsProps {
  isOpen: boolean;
  onClose: () => void;
}

const EventsWebinars: React.FC<EventsWebinarsProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'webinar' | 'workshop' | 'networking'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'education' | 'networking' | 'business' | 'creative' | 'technical'>('all');
  const [showRegistration, setShowRegistration] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      
      const response = await fetch(`/api/events?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // API returns { events: [], pagination: {} }
        const eventsArray = Array.isArray(data) ? data : (data.events || []);
        setEvents(eventsArray);
      } else {
        setError('Failed to load events. Please try again.');
        setEvents([]);
      }
    } catch (error) {
      // Error fetching events
      setError('Unable to connect to the server. Please check your connection.');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter, categoryFilter]);

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen, filter, categoryFilter, fetchEvents]);

  useEffect(() => {
    if (selectedEvent) {
      checkRegistration(selectedEvent.id);
    }
  }, [selectedEvent]);

  const checkRegistration = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/registration`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsRegistered(data.isRegistered);
      }
    } catch (error) {
      // Error checking registration - could implement proper error handling here
    }
  };

  const registerForEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsRegistered(true);
        setShowRegistration(false);
        fetchEvents(); // Update attendee count
      }
    } catch (error) {
      // Error registering for event - could implement proper error handling here
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'webinar': return '/icons/Green_icons/Video1.png';
      case 'workshop': return '/icons/Green_icons/Task1.png';
      case 'networking': return '/icons/Green_icons/UserProfile1.png';
      case 'conference': return '/icons/Green_icons/Dashboard1.png';
      default: return '/icons/Green_icons/NotificationBell.png';
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-900/20 text-blue-400';
      case 'live': return 'bg-red-900/20 text-red-400';
      case 'completed': return 'bg-gray-900/20 text-gray-400';
      case 'cancelled': return 'bg-red-900/20 text-red-400';
      default: return 'bg-gray-900/20 text-gray-400';
    }
  };

  const isEventUpcoming = (event: Event) => {
    const eventDateTime = new Date(`${event.date}T${event.time}`);
    return eventDateTime > new Date();
  };

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.type === filter || event.status === filter;
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
    return matchesFilter && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Events & Webinars</h1>
              <p className="text-gray-400 mt-1">Join educational sessions and networking events</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All Events' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'live', label: 'Live Now' },
                { key: 'webinar', label: 'Webinars' },
                { key: 'workshop', label: 'Workshops' },
                { key: 'networking', label: 'Networking' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as 'all' | 'upcoming' | 'live' | 'webinar' | 'workshop' | 'networking')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    filter === key
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All Categories' },
                { key: 'education', label: 'Education' },
                { key: 'networking', label: 'Networking' },
                { key: 'business', label: 'Business' },
                { key: 'creative', label: 'Creative' },
                { key: 'technical', label: 'Technical' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key as 'all' | 'education' | 'networking' | 'business' | 'creative' | 'technical')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    categoryFilter === key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-400">Loading events...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-xl text-center mb-2">{error}</p>
              <button
                onClick={fetchEvents}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-xl text-center mb-2">No events found</p>
              <p className="text-sm text-center text-gray-500">Check back soon for upcoming events and webinars</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer group"
                >
                  {/* Event Header */}
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={getEventIcon(event.type)} 
                          alt={event.type}
                          className="w-5 h-5"
                        />
                        <span className="text-gray-400 text-sm capitalize">{event.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {event.featured && (
                          <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                            ⭐ Featured
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-green-400 transition-colors">
                      {event.title}
                    </h3>

                    <p className="text-gray-400 text-sm line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  {/* Event Details */}
                  <div className="p-4">
                    {/* Host */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {event.host.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-300 text-sm">{event.host.name}</span>
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-400">📅</span>
                        <span className="text-white">{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-400">🕐</span>
                        <span className="text-white">{formatTime(event.time)} ({event.timezone})</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-400">⏱️</span>
                        <span className="text-white">{event.duration}</span>
                      </div>
                    </div>

                    {/* Price & Attendees */}
                    <div className="flex justify-between items-center mb-3">
                      <span className={`font-bold ${event.isFree ? 'text-green-400' : 'text-yellow-400'}`}>
                        {event.isFree ? 'FREE' : `${event.currency} ${event.price}`}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {event.currentAttendees}/{event.maxAttendees} attendees
                      </span>
                    </div>

                    {/* Tags */}
                    {event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        {event.tags.length > 3 && (
                          <span className="text-gray-500 text-xs">+{event.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <img 
                      src={getEventIcon(selectedEvent.type)} 
                      alt={selectedEvent.type}
                      className="w-8 h-8"
                    />
                    <h1 className="text-2xl font-bold text-white">{selectedEvent.title}</h1>
                    {selectedEvent.featured && (
                      <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Hosted by {selectedEvent.host.name}</span>
                    <span>•</span>
                    <span>{formatDate(selectedEvent.date)} at {formatTime(selectedEvent.time)}</span>
                    <span>•</span>
                    <span>{selectedEvent.duration}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">About This Event</h3>
                <p className="text-gray-300">{selectedEvent.description}</p>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Event Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white capitalize">{selectedEvent.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="text-white capitalize">{selectedEvent.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price:</span>
                      <span className={`font-bold ${selectedEvent.isFree ? 'text-green-400' : 'text-yellow-400'}`}>
                        {selectedEvent.isFree ? 'FREE' : `${selectedEvent.currency} ${selectedEvent.price}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Attendees:</span>
                      <span className="text-white">{selectedEvent.currentAttendees}/{selectedEvent.maxAttendees}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedEvent.status)}`}>
                        {selectedEvent.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Host Information</h3>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedEvent.host.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{selectedEvent.host.name}</h4>
                      <p className="text-gray-400 text-sm capitalize">{selectedEvent.host.type}</p>
                    </div>
                  </div>
                  {selectedEvent.host.bio && (
                    <p className="text-gray-300 text-sm">{selectedEvent.host.bio}</p>
                  )}
                </div>
              </div>

              {/* Learning Outcomes */}
              {selectedEvent.learningOutcomes.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">What You&apos;ll Learn</h3>
                  <ul className="space-y-2">
                    {selectedEvent.learningOutcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span className="text-gray-300">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Agenda */}
              {selectedEvent.agenda.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Agenda</h3>
                  <div className="space-y-3">
                    {selectedEvent.agenda.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className="text-blue-400 font-medium min-w-[60px]">{item.time}</span>
                        <div>
                          <p className="text-white">{item.topic}</p>
                          {item.speaker && (
                            <p className="text-gray-400 text-sm">by {item.speaker}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {selectedEvent.requirements.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Requirements</h3>
                  <ul className="space-y-2">
                    {selectedEvent.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span className="text-gray-300">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                {isEventUpcoming(selectedEvent) && (
                  <button
                    onClick={() => setShowRegistration(true)}
                    disabled={isRegistered || selectedEvent.currentAttendees >= selectedEvent.maxAttendees}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      isRegistered
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : selectedEvent.currentAttendees >= selectedEvent.maxAttendees
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700'
                    }`}
                  >
                    {isRegistered ? '✓ Registered' : 
                     selectedEvent.currentAttendees >= selectedEvent.maxAttendees ? 'Event Full' :
                     'Register Now'}
                  </button>
                )}
                
                {selectedEvent.isRecorded && selectedEvent.recordingUrl && (
                  <a
                    href={selectedEvent.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    📹 Watch Recording
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Confirmation Modal */}
      {showRegistration && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-70">
          <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Registration</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to register for &quot;{selectedEvent.title}&quot;?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRegistration(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => registerForEvent(selectedEvent.id)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all"
              >
                Confirm Registration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsWebinars;
