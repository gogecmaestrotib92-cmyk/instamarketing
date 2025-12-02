import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiCalendar, 
  FiChevronLeft, 
  FiChevronRight, 
  FiPlus,
  FiClock,
  FiImage,
  FiVideo,
  FiGrid,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiAlertCircle
} from 'react-icons/fi';
import './ContentCalendar.css';

const ContentCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledContent, setScheduledContent] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  // Get calendar data
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const getWeekDays = (date) => {
    const days = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push({
        date: day,
        isCurrentMonth: day.getMonth() === date.getMonth()
      });
    }
    
    return days;
  };

  // Mock fetch scheduled content
  const fetchScheduledContent = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await api.get('/api/scheduled-content');
      // setScheduledContent(response.data);
      
      // Mock data for demo
      const mockContent = [
        {
          id: 1,
          title: 'Morning Motivation Video',
          type: 'video',
          scheduledAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 9, 0),
          status: 'scheduled',
          thumbnail: null
        },
        {
          id: 2,
          title: 'Product Showcase Carousel',
          type: 'carousel',
          scheduledAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 14, 30),
          status: 'scheduled',
          thumbnail: null
        },
        {
          id: 3,
          title: 'Behind the Scenes',
          type: 'image',
          scheduledAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18, 12, 0),
          status: 'scheduled',
          thumbnail: null
        },
        {
          id: 4,
          title: 'Weekly Tips Video',
          type: 'video',
          scheduledAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20, 10, 0),
          status: 'published',
          thumbnail: null
        },
        {
          id: 5,
          title: 'Flash Sale Announcement',
          type: 'image',
          scheduledAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 22, 16, 0),
          status: 'failed',
          thumbnail: null
        }
      ];
      
      setScheduledContent(mockContent);
    } catch (error) {
      console.error('Error fetching scheduled content:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchScheduledContent();
  }, [fetchScheduledContent]);

  // Navigation
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get content for a specific day
  const getContentForDay = (date) => {
    return scheduledContent.filter(content => {
      const contentDate = new Date(content.scheduledAt);
      return (
        contentDate.getDate() === date.getDate() &&
        contentDate.getMonth() === date.getMonth() &&
        contentDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <FiVideo />;
      case 'carousel':
        return <FiGrid />;
      case 'image':
      default:
        return <FiImage />;
    }
  };

  // Get status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'published':
        return 'status-published';
      case 'failed':
        return 'status-failed';
      case 'scheduled':
      default:
        return 'status-scheduled';
    }
  };

  // Handle content click
  const handleContentClick = (content) => {
    setSelectedContent(content);
    setShowScheduleModal(true);
  };

  // Handle delete
  const handleDelete = async (contentId) => {
    if (window.confirm('Are you sure you want to delete this scheduled content?')) {
      try {
        // TODO: API call to delete
        setScheduledContent(prev => prev.filter(c => c.id !== contentId));
        setShowScheduleModal(false);
        setSelectedContent(null);
      } catch (error) {
        console.error('Error deleting content:', error);
      }
    }
  };

  // Days of week header
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get days to display
  const days = viewMode === 'month' ? getDaysInMonth(currentDate) : getWeekDays(currentDate);
  
  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Get stats
  const stats = {
    scheduled: scheduledContent.filter(c => c.status === 'scheduled').length,
    published: scheduledContent.filter(c => c.status === 'published').length,
    failed: scheduledContent.filter(c => c.status === 'failed').length
  };

  return (
    <div className="content-calendar-page">
      <div className="calendar-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1>
              <FiCalendar className="header-icon" />
              Content Calendar
            </h1>
            <p>View and manage your scheduled content</p>
          </div>
          <div className="header-stats">
            <div className="stat-item scheduled">
              <FiClock />
              <span>{stats.scheduled} Scheduled</span>
            </div>
            <div className="stat-item published">
              <FiCheck />
              <span>{stats.published} Published</span>
            </div>
            {stats.failed > 0 && (
              <div className="stat-item failed">
                <FiAlertCircle />
                <span>{stats.failed} Failed</span>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="calendar-controls">
          <div className="nav-controls">
            <button className="btn-nav" onClick={navigatePrevious}>
              <FiChevronLeft />
            </button>
            <h2 className="current-period">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            <button className="btn-nav" onClick={navigateNext}>
              <FiChevronRight />
            </button>
            <button className="btn-today" onClick={goToToday}>
              Today
            </button>
          </div>
          
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button 
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={`calendar-grid ${viewMode}`}>
          {/* Week day headers */}
          <div className="calendar-header">
            {weekDays.map(day => (
              <div key={day} className="day-header">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="calendar-body">
            {loading ? (
              <div className="calendar-loading">
                <div className="spinner"></div>
                <span>Loading calendar...</span>
              </div>
            ) : (
              days.map((day, index) => {
                const dayContent = getContentForDay(day.date);
                const hasMore = dayContent.length > 3;
                
                return (
                  <div
                    key={index}
                    className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday(day.date) ? 'today' : ''} ${selectedDate?.getTime() === day.date.getTime() ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <div className="day-number">
                      {day.date.getDate()}
                    </div>
                    
                    <div className="day-content">
                      {dayContent.slice(0, 3).map(content => (
                        <div
                          key={content.id}
                          className={`content-item ${getStatusClass(content.status)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContentClick(content);
                          }}
                        >
                          <span className="content-icon">
                            {getTypeIcon(content.type)}
                          </span>
                          <span className="content-time">
                            {formatTime(content.scheduledAt)}
                          </span>
                          <span className="content-title">
                            {content.title}
                          </span>
                        </div>
                      ))}
                      {hasMore && (
                        <div className="more-content">
                          +{dayContent.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-dot scheduled"></span>
            Scheduled
          </div>
          <div className="legend-item">
            <span className="legend-dot published"></span>
            Published
          </div>
          <div className="legend-item">
            <span className="legend-dot failed"></span>
            Failed
          </div>
        </div>
      </div>

      {/* Content Detail Modal */}
      {showScheduleModal && selectedContent && (
        <div className="content-modal" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowScheduleModal(false)}
            >
              <FiX />
            </button>

            <div className="modal-header">
              <div className={`content-type-badge ${selectedContent.type}`}>
                {getTypeIcon(selectedContent.type)}
                <span>{selectedContent.type}</span>
              </div>
              <div className={`content-status ${getStatusClass(selectedContent.status)}`}>
                {selectedContent.status === 'published' && <FiCheck />}
                {selectedContent.status === 'failed' && <FiAlertCircle />}
                {selectedContent.status === 'scheduled' && <FiClock />}
                <span>{selectedContent.status}</span>
              </div>
            </div>

            <h3>{selectedContent.title}</h3>

            <div className="modal-meta">
              <div className="meta-item">
                <FiCalendar />
                <span>
                  {new Date(selectedContent.scheduledAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="meta-item">
                <FiClock />
                <span>{formatTime(selectedContent.scheduledAt)}</span>
              </div>
            </div>

            {selectedContent.thumbnail && (
              <div className="modal-thumbnail">
                {selectedContent.type === 'video' ? (
                  <video src={selectedContent.thumbnail} controls />
                ) : (
                  <img src={selectedContent.thumbnail} alt={selectedContent.title} />
                )}
              </div>
            )}

            <div className="modal-actions">
              {selectedContent.status === 'scheduled' && (
                <button className="btn-action edit">
                  <FiEdit2 />
                  Edit Schedule
                </button>
              )}
              <button 
                className="btn-action delete"
                onClick={() => handleDelete(selectedContent.id)}
              >
                <FiTrash2 />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCalendar;
