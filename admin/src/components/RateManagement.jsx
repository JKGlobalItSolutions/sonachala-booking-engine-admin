import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Calendar, DollarSign } from 'lucide-react';

const RateManagement = ({ propertyId, collectionName }) => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBulkModal, setShowBulkModal] = useState(false);

    // Bulk Update State
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [newPrice, setNewPrice] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchRooms = async () => {
            if (!propertyId) return;
            setLoading(true);
            try {
                // Determine collection path based on input or default
                // Assuming standard subcollection path: 'Hotels/{uid}/Rooms'
                // Note: collectionName usually 'Hotels' or 'Homestays'
                const roomsRef = collection(db, collectionName || 'Hotels', propertyId, 'Rooms');
                const snapshot = await getDocs(roomsRef);
                const roomData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setRooms(roomData);
            } catch (error) {
                console.error("Error fetching rooms:", error);
                toast.error("Failed to load rooms");
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, [propertyId, collectionName]);

    const handleBulkSave = async () => {
        if (selectedRooms.length === 0 || !dateRange.start || !dateRange.end || !newPrice) {
            toast.warning("Please select rooms, dates, and price.");
            return;
        }

        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);

            // Loop through dates
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateISO = d.toISOString().split('T')[0];

                selectedRooms.forEach(roomId => {
                    const rateRef = doc(db, collectionName || 'Hotels', propertyId, 'Rooms', roomId, 'DailyRates', dateISO);
                    batch.set(rateRef, {
                        date: dateISO,
                        price: parseFloat(newPrice),
                        updatedAt: Timestamp.now()
                    }, { merge: true });
                });
            }

            await batch.commit();
            toast.success("Rates updated successfully!");
            setShowBulkModal(false);
            setSelectedRooms([]);
            setNewPrice('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to update rates.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRoomSelection = (roomId) => {
        if (selectedRooms.includes(roomId)) {
            setSelectedRooms(selectedRooms.filter(id => id !== roomId));
        } else {
            setSelectedRooms([...selectedRooms, roomId]);
        }
    };

    const selectAllRooms = () => {
        if (selectedRooms.length === rooms.length) setSelectedRooms([]);
        else setSelectedRooms(rooms.map(r => r.id));
    };

    if (loading) return <div className="p-4 text-center">Loading Rooms...</div>;

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Rate Management</h4>
                <Button variant="primary" onClick={() => setShowBulkModal(true)}>
                    <Calendar size={18} className="me-2" /> Bulk Update Rates
                </Button>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <Table responsive hover className="mb-0 align-middle">
                    <thead className="bg-light">
                        <tr>
                            <th>Room Type</th>
                            <th>Default Price</th>
                            <th>Max Guests</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.length > 0 ? rooms.map(room => (
                            <tr key={room.id}>
                                <td className="fw-bold">{room.customName || room.roomType}</td>
                                <td>₹{room.roomPrice}</td>
                                <td>{room.maxguestAllowed}</td>
                                <td>
                                    <Button size="sm" variant="outline-primary" onClick={() => {
                                        setSelectedRooms([room.id]);
                                        setShowBulkModal(true);
                                    }}>
                                        Update Rates
                                    </Button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="text-center p-4">No rooms found. Add rooms in the 'Rooms' section first.</td></tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Bulk Update Modal */}
            <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Bulk Rate Update</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row g-4">
                        <div className="col-12">
                            <label className="fw-bold mb-2">1. Select Rooms</label>
                            <div className="d-flex flex-wrap gap-2">
                                <Button size="sm" variant={selectedRooms.length === rooms.length ? "dark" : "outline-dark"} onClick={selectAllRooms}>
                                    All Rooms
                                </Button>
                                {rooms.map(room => (
                                    <Button
                                        key={room.id}
                                        size="sm"
                                        variant={selectedRooms.includes(room.id) ? "success" : "outline-secondary"}
                                        onClick={() => toggleRoomSelection(room.id)}
                                    >
                                        {room.customName || room.roomType}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="col-md-6">
                            <label className="fw-bold mb-2">2. Select Date Range</label>
                            <div className="input-group mb-2">
                                <span className="input-group-text">Start</span>
                                <Form.Control type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <span className="input-group-text">End</span>
                                <Form.Control type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                            </div>
                        </div>

                        <div className="col-md-6">
                            <label className="fw-bold mb-2">3. New Rate (₹)</label>
                            <div className="input-group">
                                <span className="input-group-text"><DollarSign size={16} /></span>
                                <Form.Control
                                    type="number"
                                    placeholder="e.g. 2500"
                                    value={newPrice}
                                    onChange={e => setNewPrice(e.target.value)}
                                />
                            </div>
                            <div className="form-text mt-2">This will override the default price for the selected dates.</div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleBulkSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Apply Changes'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default RateManagement;
