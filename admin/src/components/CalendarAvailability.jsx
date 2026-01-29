import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, writeBatch, Timestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { ChevronLeft, ChevronRight, Ban, CheckCircle } from 'lucide-react';

const CalendarAvailability = ({ propertyId, collectionName }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [rooms, setRooms] = useState([]);
    const [blockedDates, setBlockedDates] = useState({}); // { '2025-02-14': ['roomId1', 'roomId2'] }
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [modalAction, setModalAction] = useState('block'); // 'block' or 'unblock'

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    useEffect(() => {
        fetchData();
    }, [propertyId, collectionName, currentDate]);

    const fetchData = async () => {
        if (!propertyId) return;
        setLoading(true);
        try {
            // 1. Fetch Rooms
            const roomsRef = collection(db, collectionName || 'Hotels', propertyId, 'Rooms');
            const roomsSnap = await getDocs(roomsRef);
            const roomsList = roomsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setRooms(roomsList);

            // 2. Fetch Blocked Dates for this month
            // Note: Optimally we would query by date range, but simpler to fetch all blocked dates for these rooms for now or just iterate
            // For MVP, let's just fetch ALL blocked dates for these rooms. 
            // Better: Store blocked dates in a root collection? No, per room.
            // Let's iterate rooms and fetch their 'BlockedDates' subcollection.

            const newBlockedMap = {};
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

            // This parallel fetch might be heavy if many rooms. 
            // Ideally, we'd have a 'BlockedIn' collection or similar.
            // For now, let's just fetch for the visualized month.

            await Promise.all(roomsList.map(async (room) => {
                if (!room.id) return;
                try {
                    // Ensure all path segments are strings to prevent 'indexOf' crash
                    const cName = String(collectionName || 'Hotels');
                    const pId = String(propertyId);
                    const rId = String(room.id);

                    const blockedRef = collection(db, cName, pId, 'Rooms', rId, 'BlockedDates');
                    const q = query(blockedRef, where('date', '>=', startOfMonth), where('date', '<=', endOfMonth));
                    const snap = await getDocs(q);

                    snap.forEach(doc => {
                        const d = doc.data();
                        if (d.isBlocked) {
                            if (!newBlockedMap[d.date]) newBlockedMap[d.date] = [];
                            newBlockedMap[d.date].push(rId);
                        }
                    });
                } catch (err) {
                    console.warn(`Skipping room ${room.id} due to error:`, err);
                }
            }));

            setBlockedDates(newBlockedMap);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load calendar data");
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
        setShowModal(true);
    };

    const handleBlockAction = async () => {
        if (!selectedDate) return;

        try {
            const batch = writeBatch(db);

            rooms.forEach(room => {
                // If action is block, set isBlocked=true. If unblock, delete doc or set false.
                const docRef = doc(db, collectionName || 'Hotels', propertyId, 'Rooms', String(room.id), 'BlockedDates', selectedDate);

                if (modalAction === 'block') {
                    batch.set(docRef, { date: selectedDate, isBlocked: true, updatedAt: Timestamp.now() }, { merge: true });
                } else {
                    batch.delete(docRef);
                }
            });

            await batch.commit();
            toast.success(`Date ${modalAction}ed successfully`);
            setShowModal(false);
            fetchData(); // Reload
        } catch (error) {
            console.error(error);
            toast.error("Failed to update availability");
        }
    };

    const renderCalendar = () => {
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);
        const days = [];

        // Empty slots
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty bg-light"></div>);
        }

        // Days
        for (let i = 1; i <= totalDays; i++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const blockedRooms = blockedDates[dateStr] || [];
            const isFullBlock = rooms.length > 0 && blockedRooms.length === rooms.length;
            const isPartialBlock = blockedRooms.length > 0 && blockedRooms.length < rooms.length;

            days.push(
                <div
                    key={i}
                    className={`calendar-day p-2 border ${isFullBlock ? 'bg-danger text-white' : isPartialBlock ? 'bg-warning' : 'bg-white'}`}
                    style={{ minHeight: '100px', cursor: 'pointer' }}
                    onClick={() => handleDateClick(i)}
                >
                    <div className="d-flex justify-content-between">
                        <span className="fw-bold">{i}</span>
                        {isFullBlock && <Ban size={16} />}
                        {!isFullBlock && !isPartialBlock && <CheckCircle size={16} className="text-success" />}
                    </div>
                    <div className="mt-2 small">
                        {isFullBlock ? 'Fully Blocked' : isPartialBlock ? `${blockedRooms.length}/${rooms.length} Blocked` : 'Available'}
                    </div>
                </div>
            );
        }
        return days;
    };

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <Button variant="outline-secondary" onClick={() => changeMonth(-1)}><ChevronLeft /></Button>
                    <h4 className="mb-0 mx-3">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                    <Button variant="outline-secondary" onClick={() => changeMonth(1)}><ChevronRight /></Button>
                </div>
                <div>
                    <span className="badge bg-success me-2">Available</span>
                    <span className="badge bg-warning text-dark me-2">Partially Blocked</span>
                    <span className="badge bg-danger">Blocked</span>
                </div>
            </div>

            <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center fw-bold py-2 bg-light rounded">{d}</div>
                ))}
                {loading ? <div className="p-5 text-center col-span-7">Loading Calendar...</div> : renderCalendar()}
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Manage Action for {selectedDate}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Select an action for all rooms on this date:</p>
                    <div className="d-flex gap-3">
                        <Button
                            variant={modalAction === 'block' ? 'danger' : 'outline-danger'}
                            className="flex-fill"
                            onClick={() => setModalAction('block')}
                        >
                            <Ban size={18} className="me-2" /> Block All Rooms
                        </Button>
                        <Button
                            variant={modalAction === 'unblock' ? 'success' : 'outline-success'}
                            className="flex-fill"
                            onClick={() => setModalAction('unblock')}
                        >
                            <CheckCircle size={18} className="me-2" /> Make Available
                        </Button>
                    </div>
                    <div className="mt-3 text-muted small">
                        *Granular room selection coming soon via advanced modal.
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleBlockAction}>Save Changes</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CalendarAvailability;
