import React, { useState, useEffect } from 'react';
import { scheduleAPI } from '../services/api';
import { 
  FiCalendar, 
  FiClock, 
  FiImage, 
  FiFilm,
  FiX,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import './Schedule.css';

const Schedule = () => {
  const [calendar, setCalendar] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const response = await scheduleAPI.getCalendar({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      });
      setCalendar(response.data.calendar);
    } catch (error) {
      toast.error('Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this scheduled item?')) return;
    
    try {
      await scheduleAPI.cancel(id);
      toast.success('Schedule cancelled');
      fetchCalendar();
    } catch (error) {
      toast.error('Failed to cancel');
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  // eslint-disable-next-line no-unused-vars
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date().toISOString().split('T')[0];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const items = calendar[dateStr] || [];
      const isToday = dateStr === today;
      const hasItems = items.length > 0;

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${hasItems ? 'has-items' : ''} ${selectedDate === dateStr ? 'selected' : ''}`}
          onClick={() => setSelectedDate(dateStr)}
        >
          <span className="day-number">{day}</span>
          {hasItems && (
            <div className="day-items">
              {items.slice(0, 3).map((item, idx) => (
                <div key={idx} className={`item-indicator ${item.contentType}`}>
                  {item.contentType === 'post' ? <FiImage /> : <FiFilm />}
                </div>
              ))}
              {items.length > 3 && (
                <span className="more-items">+{items.length - 3}</span>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const selectedItems = selectedDate ? (calendar[selectedDate] || []) : [];

  return (
    <div className="schedule-page">
      <SEO 
        title="Zakazivanje Objava"
        description="Zakazujte Instagram objave i rilsove unapred. Kalendarski prikaz, automatsko objavljivanje u optimalno vreme za maksimalan engagement."
        keywords="zakazivanje instagram objava, instagram scheduler, automatsko postovanje, planer sadržaja, content calendar"
        url="/scheduler"
        breadcrumbs={[
          { name: 'Početna', url: '/' },
          { name: 'Zakazivanje', url: '/scheduler' }
        ]}
        noindex={true}
      />
      <div className="page-header">
        <div>
          <h1>Zakazivanje Sadržaja</h1>
          <p className="page-subtitle">Pregledajte i upravljajte zakazanim objavama i rilsovima</p>
        </div>
      </div>

      <div className="schedule-container">
        {/* Calendar */}
        <div className="card calendar-card">
          <div className="calendar-header">
            <button className="btn btn-ghost btn-sm" onClick={() => navigateMonth(-1)}>
              <FiChevronLeft />
            </button>
            <h3>{currentDate.toLocaleString('sr-RS', { month: 'long', year: 'numeric' })}</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigateMonth(1)}>
              <FiChevronRight />
            </button>
          </div>

          <div className="calendar-weekdays">
            {['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="calendar-grid">
              {renderCalendarDays()}
            </div>
          )}
        </div>

        {/* Selected Date Details */}
        <div className="card schedule-details">
          <h3>
            <FiCalendar />
            {selectedDate 
              ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('default', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })
              : 'Select a date'
            }
          </h3>

          {selectedDate && (
            <div className="scheduled-items">
              {selectedItems.length > 0 ? (
                selectedItems.map((item, index) => (
                  <div key={index} className="scheduled-item">
                    <div className="item-icon">
                      {item.contentType === 'post' ? <FiImage /> : <FiFilm />}
                    </div>
                    <div className="item-info">
                      <span className="item-type">{item.contentType}</span>
                      <span className="item-time">
                        <FiClock />
                        {new Date(item.scheduledFor).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {item.content?.caption && (
                        <p className="item-caption">
                          {item.content.caption.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                    <div className="item-actions">
                      <span className={`badge ${item.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {item.status}
                      </span>
                      {item.status === 'pending' && (
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleCancel(item._id)}
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-items">
                  <p>No scheduled content for this date</p>
                </div>
              )}
            </div>
          )}

          {!selectedDate && (
            <div className="no-items">
              <p>Click on a date to view scheduled content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
