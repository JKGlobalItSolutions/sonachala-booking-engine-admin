import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, Bed, Clock, Filter } from 'lucide-react';

const EnhancedCalendar = ({
  events = {},
  rooms = [],
  onDateSelect,
  selectedDate,
  className = ''
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    showAvailable: true,
    showOccupied: true,
    showUpcoming: true,
    showEvents: true
  });

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  const getDateStatus = (date) => {
    const dateString = date.toISOString().split('T')[0];
    if (events[dateString]) {
      const totalRooms = rooms.reduce((sum, room) => sum + parseInt(room.totalRooms || 0), 0);
      const bookedRooms = events[dateString].reduce((sum, event) => sum + event.count, 0);
      if (bookedRooms >= totalRooms) {
        return 'fully-booked';
      } else {
        return 'partially-booked';
      }
    }
    return '';
  };

  const getEventsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return events[dateString] || [];
  };

  const getRoomStatsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const totalRooms = rooms.reduce((sum, room) => sum + parseInt(room.totalRooms || 0), 0);
    const occupiedRooms = events[dateString]?.reduce((sum, event) => sum + event.count, 0) || 0;
    const availableRooms = totalRooms - occupiedRooms;

    return {
      total: totalRooms,
      occupied: occupiedRooms,
      available: availableRooms,
      occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
    };
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const toggleFilter = (filterKey) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`enhanced-calendar ${className}`}>
      <style>{`
        .enhanced-calendar {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          padding: 1.5rem;
          border: 1px solid rgba(255,255,255,0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .enhanced-calendar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(3, 138, 94, 0.05), rgba(255, 160, 0, 0.05));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .enhanced-calendar:hover::before {
          opacity: 1;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .calendar-title {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #038A5E 0%, #FFA000 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .calendar-nav {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255,255,255,0.6);
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.3);
        }

        .nav-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-button:hover {
          background: rgba(3, 138, 94, 0.1);
          transform: scale(1.05);
        }

        .month-display {
          font-size: 1.125rem;
          font-weight: 600;
          color: #333;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(255,255,255,0.5);
        }

        .view-controls {
          display: flex;
          gap: 0.5rem;
        }

        .view-button {
          background: none;
          border: 1px solid #e0e0e0;
          color: #666;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .view-button:hover {
          background: #f5f5f5;
          border-color: #038A5E;
          color: #038A5E;
        }

        .view-button.active {
          background: linear-gradient(135deg, #038A5E 0%, #FFA000 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 15px rgba(3, 138, 94, 0.3);
        }

        .filter-container {
          position: relative;
          display: flex;
          justify-content: flex-end;
          margin-bottom: 1rem;
        }

        .filter-button {
          background: linear-gradient(135deg, #038A5E 0%, #FFA000 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 15px rgba(3, 138, 94, 0.3);
          transition: all 0.3s ease;
          position: relative;
        }

        .filter-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(3, 138, 94, 0.4);
        }

        .filter-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 1rem;
          min-width: 200px;
          z-index: 1001;
          border: 1px solid rgba(0,0,0,0.1);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          cursor: pointer;
          border-radius: 8px;
          transition: background-color 0.2s ease;
          font-size: 0.875rem;
        }

        .filter-option:hover {
          background-color: #f5f5f5;
        }

        .filter-checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #038A5E;
          border-radius: 4px;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .filter-checkbox.checked {
          background: #038A5E;
          border-color: #038A5E;
        }

        .filter-checkbox.checked::after {
          content: '✓';
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .calendar-header-day {
          text-align: center;
          font-weight: 600;
          color: #666;
          font-size: 0.875rem;
          padding: 0.5rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.3);
        }

        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          font-size: 0.875rem;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          padding: 0.5rem;
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(255,255,255,0.5);
          min-height: 80px;
        }

        .calendar-day:hover {
          background: rgba(3, 138, 94, 0.05);
          border-color: rgba(3, 138, 94, 0.3);
          transform: translateY(-2px);
          z-index: 2;
        }

        .calendar-day.selected {
          background: linear-gradient(135deg, #038A5E 0%, #FFA000 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(3, 138, 94, 0.4);
          transform: scale(1.02);
          border: none;
        }

        .calendar-day.today {
          border: 2px solid #038A5E;
          background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
          color: #038A5E;
          font-weight: 700;
          box-shadow: 0 2px 10px rgba(3, 138, 94, 0.2);
        }

        .calendar-day.fully-booked {
          background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);
          animation: pulse-red 2s infinite;
        }

        .calendar-day.partially-booked {
          background: linear-gradient(135deg, #FFA000 0%, #f57c00 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 160, 0, 0.4);
          animation: pulse-orange 3s infinite;
        }

        .calendar-day:active {
          transform: scale(0.98);
        }

        .day-number {
          font-weight: 600;
          margin-bottom: 0.25rem;
          z-index: 1;
        }

        .day-stats {
          font-size: 0.75rem;
          text-align: center;
          margin-top: auto;
          z-index: 1;
        }

        .stat-value {
          font-weight: 700;
          font-size: 0.875rem;
        }

        .stat-label {
          font-size: 0.625rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
        }

        .events-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(255,255,255,0.9);
          color: #333;
          border-radius: 999px;
          padding: 2px 6px;
          font-size: 0.625rem;
          font-weight: 700;
          border: 1px solid rgba(0,0,0,0.1);
          z-index: 1;
        }

        .legend {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255,255,255,0.6);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.3);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #666;
          font-weight: 600;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-dot.available { background: #4CAF50; }
        .legend-dot.partially { background: #FFA000; }
        .legend-dot.fully { background: #f44336; }
        .legend-dot.today { border: 2px solid #038A5E; background: #e8f5e9; }

        @keyframes pulse-red {
          0% { transform: scale(1); box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(244, 67, 54, 0.6); }
          100% { transform: scale(1); box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4); }
        }

        @keyframes pulse-orange {
          0% { transform: scale(1); box-shadow: 0 4px 15px rgba(255, 160, 0, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(255, 160, 0, 0.6); }
          100% { transform: scale(1); box-shadow: 0 4px 15px rgba(255, 160, 0, 0.4); }
        }

        @media (max-width: 768px) {
          .calendar-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .calendar-nav {
            width: 100%;
            justify-content: space-between;
          }

          .calendar-day {
            min-height: 60px;
            padding: 0.25rem;
          }

          .day-number {
            font-size: 0.75rem;
          }

          .day-stats {
            font-size: 0.625rem;
          }

          .legend {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>

      <div className="calendar-header">
        <div className="calendar-title">
          <Calendar size={24} />
          Calendar View
        </div>
        <div className="calendar-nav">
          <button onClick={prevMonth} className="nav-button" aria-label="Previous month">
            <ChevronLeft size={20} />
          </button>
          <div className="month-display">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <button onClick={nextMonth} className="nav-button" aria-label="Next month">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="view-controls">
          <button
            className={`view-button ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button
            className={`view-button ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button
            className={`view-button ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
          >
            Day
          </button>
        </div>
      </div>

      <div className="filter-container">
        <button
          className="filter-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          Filters
        </button>
        {showFilters && (
          <div className="filter-dropdown">
            <div className="filter-option" onClick={() => toggleFilter('showAvailable')}>
              <div className={`filter-checkbox ${filters.showAvailable ? 'checked' : ''}`}></div>
              Show Available
            </div>
            <div className="filter-option" onClick={() => toggleFilter('showOccupied')}>
              <div className={`filter-checkbox ${filters.showOccupied ? 'checked' : ''}`}></div>
              Show Occupied
            </div>
            <div className="filter-option" onClick={() => toggleFilter('showUpcoming')}>
              <div className={`filter-checkbox ${filters.showUpcoming ? 'checked' : ''}`}></div>
              Show Upcoming
            </div>
            <div className="filter-option" onClick={() => toggleFilter('showEvents')}>
              <div className={`filter-checkbox ${filters.showEvents ? 'checked' : ''}`}></div>
              Show Events
            </div>
          </div>
        )}
      </div>

      <div className="calendar-grid">
        {dayNames.map(day => (
          <div key={day} className="calendar-header-day">{day}</div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="calendar-day"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), index + 1);
          const status = getDateStatus(date);
          const stats = getRoomStatsForDate(date);
          const eventsForDate = getEventsForDate(date);

          return (
            <div
              key={index}
              className={`calendar-day ${isSelected(date) ? 'selected' : ''} ${isToday(date) ? 'today' : ''} ${status}`}
              onClick={() => handleDateClick(date)}
            >
              <div className="day-number">{index + 1}</div>
              {eventsForDate.length > 0 && (
                <div className="events-badge">{eventsForDate.length}</div>
              )}
              <div className="day-stats">
                <div className="stat-value">{stats.occupancyRate}%</div>
                <div className="stat-label">Occupied</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-dot today"></div>
          Today
        </div>
        <div className="legend-item">
          <div className="legend-dot available"></div>
          Available
        </div>
        <div className="legend-item">
          <div className="legend-dot partially"></div>
          Partially Booked
        </div>
        <div className="legend-item">
          <div className="legend-dot fully"></div>
          Fully Booked
        </div>
      </div>
    </div>
  );
};

export default EnhancedCalendar;