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
      days.push(<div key={`empty-${i}`} className="calendar-day empty" aria-hidden="true"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const items = calendar[dateStr] || [];
      const isToday = dateStr === today;
      const hasItems = items.length > 0;
      const isSelected = selectedDate === dateStr;

      days.push(
        <button
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${hasItems ? 'has-items' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedDate(dateStr)}
          aria-label={`${day}. ${monthName}, ${hasItems ? `${items.length} zakazanih stavki` : 'nema zakazanih stavki'}`}
          aria-pressed={isSelected}
          aria-current={isToday ? 'date' : undefined}
        >
          <span className="day-number">{day}</span>
          {hasItems && (
            <div className="day-items" aria-hidden="true">
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
        </button>
      );
    }

    return days;
  };

  const selectedItems = selectedDate ? (calendar[selectedDate] || []) : [];

  return (
    <main className="schedule-page">
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
      <header className="page-header">
        <div>
          <h1>Zakazivanje Sadržaja</h1>
          <p className="page-subtitle">Pregledajte i upravljajte zakazanim objavama i rilsovima</p>
        </div>
      </header>

      <div className="schedule-container">
        {/* Calendar */}
        <section className="card calendar-card" aria-label="Kalendar">
          <div className="calendar-header">
            <button className="btn btn-ghost btn-sm" onClick={() => navigateMonth(-1)} aria-label="Prethodni mesec">
              <FiChevronLeft aria-hidden="true" />
            </button>
            <h3 aria-live="polite">{currentDate.toLocaleString('sr-RS', { month: 'long', year: 'numeric' })}</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigateMonth(1)} aria-label="Sledeći mesec">
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>

          <div className="calendar-weekdays" aria-hidden="true">
            {['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          {loading ? (
            <div className="loading-container" aria-label="Učitavanje kalendara">
              <div className="spinner" aria-hidden="true"></div>
            </div>
          ) : (
            <div className="calendar-grid">
              {renderCalendarDays()}
            </div>
          )}
        </section>

        {/* Selected Date Details */}
        <aside className="card schedule-details" aria-label="Detalji za izabrani datum">
          <h3>
            <FiCalendar aria-hidden="true" />
            {selectedDate 
              ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('sr-RS', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })
              : 'Izaberite datum'
            }
          </h3>

          {selectedDate && (
            <div className="scheduled-items">
              {selectedItems.length > 0 ? (
                selectedItems.map((item, index) => (
                  <article key={index} className="scheduled-item">
                    <div className="item-icon" aria-hidden="true">
                      {item.contentType === 'post' ? <FiImage /> : <FiFilm />}
                    </div>
                    <div className="item-info">
                      <span className="item-type">{item.contentType}</span>
                      <span className="item-time">
                        <FiClock aria-hidden="true" />
                        <time dateTime={item.scheduledFor}>
                          {new Date(item.scheduledFor).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </time>
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
                          aria-label="Otkaži zakazivanje"
                        >
                          <FiX aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="no-items">
                  <p>Nema zakazanog sadržaja za ovaj datum</p>
                </div>
              )}
            </div>
          )}

          {!selectedDate && (
            <div className="no-items">
              <p>Kliknite na datum da biste videli zakazani sadržaj</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
};

export default Schedule;
