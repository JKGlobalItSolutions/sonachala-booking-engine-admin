import React, { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import { Loader } from '@googlemaps/js-api-loader';
import { Pencil, MapPin, Phone, Globe, Clock, Car, FileText, QrCode, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tab, Tabs, Form } from 'react-bootstrap';
import RateManagement from './RateManagement';
import CalendarAvailability from './CalendarAvailability';

const PropertyManagement = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    // State
    const [activeTab, setActiveTab] = useState('details');
    const [myListings, setMyListings] = useState([]);
    const [currentType, setCurrentType] = useState('Hotel'); // 'Hotel' or 'Homestay'

    const [formData, setFormData] = useState({
        hotelName: '', hotelAddress: '', hotelContact: '', about: '', map: '',
        parking: '', internet: '', checkInTime: '', checkOutTime: '',
        additionalNotes: '', nearbyPlaces: '', transportation: '',
        hotelImages: [], propertyDocuments: [], paymentQr: '',
        exteriorPhotos: [], totalRooms: '', roomType: '', bedArrangements: ''
    });

    const [selectedFacilities, setSelectedFacilities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const mapRef = useRef(null);
    const [selectedLocation, setSelectedLocation] = useState(null);

    // Fetch all user listings for the Switcher
    useEffect(() => {
        const fetchListings = async () => {
            if (!user) return;
            try {
                const hotelDoc = await getDoc(doc(db, "Hotels", user.uid));
                const homestayDoc = await getDoc(doc(db, "Homestays", user.uid));

                const listings = [];
                if (hotelDoc.exists()) {
                    listings.push({ id: user.uid, type: 'Hotel', name: hotelDoc.data()['Property Name'] || hotelDoc.data().hotelName || 'My Hotel' });
                }
                if (homestayDoc.exists()) {
                    listings.push({ id: user.uid, type: 'Homestay', name: homestayDoc.data()['Property Name'] || homestayDoc.data().homestayName || 'My Homestay' });
                }

                setMyListings(listings);

                // Set default property if exists
                if (listings.length > 0) {
                    // Default to Hotel if available, else first one
                    const hasHotel = listings.find(l => l.type === 'Hotel');
                    setCurrentType(hasHotel ? 'Hotel' : listings[0].type);
                }
            } catch (err) {
                console.error("Error fetching listings:", err);
            }
        };
        if (!loading) fetchListings();
    }, [user, loading]);

    // Fetch Details when Type Changes
    const fetchPropertyDetails = useCallback(async (type) => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const collectionName = type === 'Hotel' ? 'Hotels' : 'Homestays';
            const docRef = doc(db, collectionName, user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setFormData({
                    hotelName: data['Property Name'] || data.hotelName || data.homestayName || '',
                    hotelAddress: data['Property Address'] || data.address || '',
                    hotelContact: data['Property contact'] || data.phone || '',
                    about: data.About || data.description || '',
                    map: data.map || '',
                    parking: data.Parking || '',
                    internet: data.Internet || '',
                    checkInTime: data['Check-in Time'] || '',
                    checkOutTime: data['Check-out Time'] || '',
                    additionalNotes: data['Additional Notes'] || '',
                    nearbyPlaces: data['Nearby Iconic Places'] || '',
                    transportation: data.Transportation || '',
                    hotelImages: data['Property Images'] || [],
                    propertyDocuments: data.propertyDocuments || [],
                    paymentQr: data.paymentQr || '',
                    exteriorPhotos: data.exteriorPhotos || [],
                    totalRooms: data.totalRooms || '',
                    roomType: data.roomType || '',
                    bedArrangements: data.bedArrangements || '',
                    roomTypes: data.roomTypes || [],
                });
                setSelectedFacilities(data['Accommodation Facilities'] || []);
                if (data.latitude && data.longitude) {
                    setSelectedLocation({ lat: data.latitude, lng: data.longitude });
                }
            } else {
                // Handle empty state or not found
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load details.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (currentType) {
            fetchPropertyDetails(currentType);
        }
    }, [currentType, fetchPropertyDetails]);

    // Map Effect
    useEffect(() => {
        if (showMap && selectedLocation) {
            const loader = new Loader({
                apiKey: 'AIzaSyAba8Pvzm4uXVQs3VKdlqW-JqavRU1yIEs',
                version: 'weekly',
            });
            loader.load().then(() => {
                const mapInstance = new window.google.maps.Map(mapRef.current, {
                    center: selectedLocation, zoom: 15, disableDefaultUI: true,
                });
                new window.google.maps.Marker({ position: selectedLocation, map: mapInstance });
            });
        }
    }, [showMap, selectedLocation]);

    if (loading) return <div>Loading...</div>;

    const collectionName = currentType === 'Hotel' ? 'Hotels' : 'Homestays';

    return (
        <div className="container-fluid p-4">
            {/* Header & Switcher */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div>
                    <h2 className="fw-bold text-primary mb-1">Property Management</h2>
                    <p className="text-secondary mb-0">Manage details, rates, and availability</p>
                </div>

                <div className="d-flex align-items-center gap-3">
                    {myListings.length > 0 && (
                        <div className="d-flex align-items-center gap-2 bg-white p-2 rounded shadow-sm border">
                            <Home size={18} className="text-primary" />
                            <Form.Select
                                value={currentType}
                                onChange={(e) => setCurrentType(e.target.value)}
                                className="border-0 bg-transparent fw-bold text-dark shadow-none py-0"
                                style={{ width: 'auto', minWidth: '150px' }}
                            >
                                {myListings.map(l => (
                                    <option key={l.type} value={l.type}>{l.name} ({l.type})</option>
                                ))}
                            </Form.Select>
                        </div>
                    )}

                    {activeTab === 'details' && (
                        <button
                            className="btn btn-primary d-flex align-items-center gap-2"
                            onClick={() => navigate('/admin/add-property', { state: { isEdit: true, propertyId: user.uid } })}
                        >
                            <Pencil size={18} /> Edit Details
                        </button>
                    )}
                </div>
            </div>

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 border-bottom-0 custom-tabs">
                <Tab eventKey="details" title="Property Details">
                    {/* Existing Info View */}
                    {isLoading ? <div className="p-5 text-center">Loading Data...</div> : error ? <div className="alert alert-warning">{error}</div> : (
                        <div className="row g-4 animate-fade-in">
                            <div className="col-lg-8">
                                {/* General Info */}
                                <div className="card border-0 shadow-sm rounded-4 mb-4">
                                    <div className="card-body p-4">
                                        <h5 className="fw-bold text-secondary mb-3">General Information</h5>
                                        <div className="mb-4"><label className="text-muted small fw-bold uppercase">Property Name</label><div className="fs-5 fw-semibold">{formData.hotelName || '-'}</div></div>
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-6"><label className="text-muted small fw-bold">Contact</label><div className="d-flex align-items-center gap-2"><Phone size={16} className="text-primary" />{formData.hotelContact || '-'}</div></div>
                                            <div className="col-md-6"><label className="text-muted small fw-bold">Address</label><div className="d-flex align-items-center gap-2"><MapPin size={16} className="text-primary" />{formData.hotelAddress || '-'}</div></div>
                                        </div>
                                        <div className="mb-4"><label className="text-muted small fw-bold">About</label><p className="bg-light p-3 rounded">{formData.about}</p></div>

                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-end mb-2">
                                                <label className="text-muted small fw-bold">Room Configuration</label>
                                                <span className="badge bg-primary">Total: {formData.totalRooms || 0} Rooms</span>
                                            </div>

                                            {formData.roomTypes && formData.roomTypes.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-sm table-borderless bg-light rounded">
                                                        <thead>
                                                            <tr className="text-muted small">
                                                                <th>Type</th>
                                                                <th>Count</th>
                                                                <th>Bedding</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {formData.roomTypes.map((rt, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="fw-bold">{rt.name}</td>
                                                                    <td>{rt.count}</td>
                                                                    <td>{rt.bedType}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="row g-3">
                                                    <div className="col-md-6"><label className="text-muted small fw-bold">Room Type</label><div className="fs-5 fw-semibold">{formData.roomType || '-'}</div></div>
                                                    <div className="col-md-6"><label className="text-muted small fw-bold">Bed Arrangements</label><div className="fs-5 fw-semibold">{formData.bedArrangements || '-'}</div></div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-4"><label className="text-muted small fw-bold">Photos</label><div className="d-flex flex-wrap gap-2">{formData.hotelImages.map((img, i) => <img key={i} src={typeof img === 'string' ? img : URL.createObjectURL(img)} className="rounded object-fit-cover" style={{ width: 80, height: 80 }} alt="prop" />)}</div></div>
                                        <div className="mb-4"><label className="text-muted small fw-bold">Exterior Photos</label><div className="d-flex flex-wrap gap-2">{formData.exteriorPhotos.map((img, i) => <img key={i} src={typeof img === 'string' ? img : URL.createObjectURL(img)} className="rounded object-fit-cover" style={{ width: 80, height: 80 }} alt="ext" />)}</div></div>
                                    </div>
                                </div>

                                {/* Policies */}
                                <div className="card border-0 shadow-sm rounded-4 mb-4">
                                    <div className="card-body p-4">
                                        <h5 className="fw-bold text-secondary mb-3">Policies & Location</h5>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3"><label className="text-muted small fw-bold">Check-In / Out</label><div className="d-flex align-items-center gap-2"><Clock size={16} className="text-primary" /> {formData.checkInTime} / {formData.checkOutTime}</div></div>
                                                <div className="mb-3"><label className="text-muted small fw-bold">Parking</label><div className="d-flex align-items-center gap-2"><Car size={16} className="text-primary" /> {formData.parking}</div></div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="text-muted small fw-bold">Location Map</label>
                                                {selectedLocation ?
                                                    <div className="rounded border bg-light d-flex align-items-center justify-content-center text-muted" style={{ height: 120, cursor: 'pointer' }} onClick={() => setShowMap(true)}><MapPin className="me-2" /> View Map</div>
                                                    : <div className="text-muted fst-italic">Location not set</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Docs */}
                                <div className="card border-0 shadow-sm rounded-4 mb-4">
                                    <div className="card-body p-4">
                                        <h5 className="fw-bold text-secondary mb-3">Documents & Payment</h5>
                                        <div className="row">
                                            {/* Docs removed per user request */}
                                            <div className="col-md-6"><label className="text-muted small fw-bold">QR Code</label>{formData.paymentQr && <img src={formData.paymentQr} alt="QR" className="d-block border rounded mt-2" style={{ width: 100 }} />}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-4">
                                <div className="card border-0 shadow-sm rounded-4 mb-4">
                                    <div className="card-body p-4">
                                        <h5 className="fw-bold text-secondary mb-3">Facilities</h5>
                                        <div className="d-flex flex-wrap gap-2">
                                            {selectedFacilities.map((f, i) => <span key={i} className="badge bg-light text-dark border py-2 px-3 fw-normal">{f.name}</span>)}
                                        </div>
                                    </div>
                                </div>
                                <div className="card border-0 shadow-sm rounded-4 mb-4">
                                    <div className="card-body p-4">
                                        <h5 className="fw-bold text-secondary mb-3">Surroundings</h5>
                                        <div className="mb-3"><label className="text-muted small fw-bold">Nearby</label><p className="small">{formData.nearbyPlaces}</p></div>
                                        <div><label className="text-muted small fw-bold">Transport</label><p className="small">{formData.transportation}</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Tab>

                <Tab eventKey="rates" title="Rate Changes">
                    <RateManagement propertyId={user?.uid} collectionName={collectionName} />
                </Tab>

                <Tab eventKey="calendar" title="Calendar Reservations">
                    <CalendarAvailability propertyId={user?.uid} collectionName={collectionName} />
                </Tab>
            </Tabs>

            {/* Map Modal */}
            {showMap && (
                <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center" style={{ zIndex: 1050 }}>
                    <div className="bg-white p-3 rounded-4 shadow-lg" style={{ width: '80%', height: '80%' }}>
                        <div ref={mapRef} style={{ width: '100%', height: '90%', borderRadius: '12px' }}></div>
                        <div className="d-flex justify-content-end mt-3"><button className="btn btn-secondary" onClick={() => setShowMap(false)}>Close</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyManagement;
