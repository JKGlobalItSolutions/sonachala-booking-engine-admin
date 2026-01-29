import React, { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, Filter, ChevronLeft, ChevronRight, Users, Bed, Calendar, Clock } from 'lucide-react';
import { collection, query, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { adminAuth, adminDB } from '../firebase.admin';
import dashboardVideo from '../assets/Dashboard.mp4';
import EnhancedCalendar from '../components/EnhancedCalendar';

const RoomStatus = () => {
  const [rooms, setRooms] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState({});
  const [profileScore, setProfileScore] = useState(0);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetchRoomData();
    calculateProfileScore();
  }, []);

  const calculateProfileScore = async () => {
    const user = adminAuth.currentUser;
    if (!user) return;
    try {
      let snap = await getDoc(doc(adminDB, 'Hotels', user.uid));
      if (!snap.exists()) {
        snap = await getDoc(doc(adminDB, 'Homestays', user.uid));
      }

      if (snap.exists()) {
        const data = snap.data();
        let score = 0;
        let total = 6;
        if (data.hotelName || data.homestayName) score++;
        if (data.hotelAddress || data.address) score++;
        if (data.hotelContact || data.phone) score++;
        if (data.about || data.description) score++;
        if ((data.hotelImages && data.hotelImages.length > 0) || (data.exteriorPhotos && data.exteriorPhotos.length > 0)) score++;
        if (String(data.totalRooms) > "0" || data.roomTypes?.length > 0) score++;

        setProfileScore(Math.round((score / total) * 100));
      }
    } catch (e) { console.error("Score Error:", e); }
  };

  const fetchRoomData = async () => {
    try {
      const user = adminAuth.currentUser;
      if (!user) {
        console.error('No user logged in');
        setLoading(false);
        return;
      }

      const roomsSnapshot = await getDocs(collection(adminDB, 'Hotels', user.uid, 'Rooms'));
      const guestsSnapshot = await getDocs(collection(adminDB, 'Hotels', user.uid, 'Guest Details'));

      const roomsData = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        occupiedRooms: 0,
        upcomingRooms: 0,
        availableRooms: 0,
        bookedDates: []
      }));

      const eventsData = {};

      guestsSnapshot.docs.forEach(guestDoc => {
        const guestData = guestDoc.data();
        if (guestData.Rooms && Array.isArray(guestData.Rooms)) {
          guestData.Rooms.forEach(roomData => {
            const room = roomsData.find(r => r.roomType === roomData.roomType);
            if (room) {
              const checkInDate = guestData['Check-In Date'].toDate();
              const checkOutDate = guestData['Check-Out Date'].toDate();
              const roomCount = roomData.roomsCount;

              if (checkInDate <= new Date() && checkOutDate > new Date()) {
                room.occupiedRooms += roomCount;
              } else if (checkInDate > new Date()) {
                room.upcomingRooms += roomCount;
              }

              for (let date = new Date(checkInDate); date < checkOutDate; date.setDate(date.getDate() + 1)) {
                const dateString = date.toISOString().split('T')[0];
                if (!eventsData[dateString]) {
                  eventsData[dateString] = [];
                }
                eventsData[dateString].push({
                  roomType: roomData.roomType,
                  count: roomCount
                });
                room.bookedDates.push(new Date(date));
              }
            }
          });
        }
      });

      roomsData.forEach(room => {
        room.availableRooms = room.totalRooms - room.occupiedRooms - room.upcomingRooms;
      });

      setRooms(roomsData);
      setEvents(eventsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching room data:', error);
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

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
      const totalRooms = rooms.reduce((sum, room) => sum + parseInt(room.totalRooms), 0);
      const bookedRooms = events[dateString].reduce((sum, event) => sum + event.count, 0);
      if (bookedRooms >= totalRooms) {
        return 'fully-booked';
      } else {
        return 'partially-booked';
      }
    }
    return '';
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold">Dashboard</h2>
          <div className="text-secondary">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div className="d-flex align-items-center gap-3 bg-white p-2 px-3 rounded shadow-sm">
          <div className="d-flex flex-column align-items-end">
            <span className="fw-bold text-dark small">Profile Health</span>
            <span className={`fw-bold h5 mb-0 ${profileScore === 100 ? 'text-success' : 'text-primary'}`}>{profileScore}%</span>
          </div>
          <div style={{ width: 45, height: 45, borderRadius: '50%', background: `conic-gradient(${profileScore === 100 ? '#198754' : '#0d6efd'} ${profileScore}%, #e9ecef 0)` }} className="d-flex align-items-center justify-content-center p-1">
            <div className="bg-white rounded-circle w-100 h-100"></div>
          </div>
        </div>
      </div>



      <div className="quick-stats mb-5">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={32} />
          </div>
          <div className="stat-info">
            <h2>Total Guests</h2>
            <p className="stat-value">{rooms.reduce((sum, room) => sum + room.occupiedRooms, 0)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Bed size={32} />
          </div>
          <div className="stat-info">
            <h2>Rooms Occupied</h2>
            <p className="stat-value">{rooms.reduce((sum, room) => sum + room.occupiedRooms, 0)} / {rooms.reduce((sum, room) => sum + parseInt(room.totalRooms || 0), 0)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={32} />
          </div>
          <div className="stat-info">
            <h2>Reservations Today</h2>
            <p className="stat-value">{events[new Date().toISOString().split('T')[0]]?.length || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={32} />
          </div>
          <div className="stat-info">
            <h2>Upcoming Bookings</h2>
            <p className="stat-value">{rooms.reduce((sum, room) => sum + room.upcomingRooms, 0)}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 w-100">
        <video
          src={dashboardVideo}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: '600px', objectFit: 'cover', borderRadius: '12px' }}
        />
      </div>

      <div className="animated-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>

      <div className="micro-interactions">
        <div className="pulse-ring"></div>
        <div className="floating-badge">
          <span>Live Updates</span>
        </div>
      </div>

      <div className="room-status-grid">
        <div className="calendar-container">
          <EnhancedCalendar
            events={events}
            rooms={rooms}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            className="w-100"
          />
        </div>

        <div className="room-cards-container">
          {rooms.map(room => (
            <div key={room.id} className="card h-100">
              <div className="card-header">
                <h5 className="card-title mb-0">{room.roomType}</h5>
                <small className="text-muted">Bed Type: {room.bedType}</small>
              </div>
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Occupied:</span>
                      <span className="badge bg-danger">{room.occupiedRooms}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Available:</span>
                      <span className="badge bg-secondary">{room.availableRooms}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Upcoming:</span>
                      <span className="badge bg-dark">{room.upcomingRooms}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <div className="d-flex justify-content-between align-items-center">
                  <strong>Total:</strong>
                  <span>{room.totalRooms}</span>
                </div>
              </div>
            </div>
          ))}

          <div className="upcoming-events">
            <h3>Upcoming Events</h3>
            <div className="event-list">
              {Object.entries(events).slice(0, 3).map(([date, bookings]) => (
                <div key={date} className="event-item">
                  <div className="event-icon">
                    <Users size={20} />
                  </div>
                  <div className="event-info">
                    <h4>New Guest Check-in</h4>
                    <p>{new Date(date).toLocaleDateString()} - {bookings.map(b => `${b.roomType} (${b.count})`).join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RoomStatus;
