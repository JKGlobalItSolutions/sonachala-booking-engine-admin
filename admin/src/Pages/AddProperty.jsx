import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase/config";
import { ChevronLeft, Save, Upload, Check, FileText, Info, Trash2, Plus } from "lucide-react";

// Constants
const ROOM_TYPES = ["Standard", "Deluxe", "Suite", "Family", "Studio", "Villa", "Dormitory"];
const BED_TYPES = ["Single", "Double", "Queen", "King", "Twin", "Bunk Beds"];

const AddProperty = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isEditMode = location.state?.isEdit || false;
    const propertyId = location.state?.propertyId || auth.currentUser?.uid;

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        propertyType: "Hotel",
        propertyName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        latitude: "",
        longitude: "",
        description: "",
        amenities: {
            wifi: false, parking: false, ac: false, restaurant: false, pool: false, gym: false
        },
        bankName: "",
        accountName: "",
        accountNumber: "",
        ifscCode: "",

        // Enhanced Room Management
        roomTypes: [], // Array of { id, name, count, bedType, price, photos: [] }

        // Legacy/Top-level fields (calculated or distinct)
        totalRooms: 0,

        // Files (URLs or File Objects)
        propertyDocuments: [],
        paymentQr: null,
        exteriorPhotos: [],
    });

    useEffect(() => {
        const fetchProperty = async () => {
            if (isEditMode && propertyId) {
                setLoading(true);
                try {
                    // Try to finding document in Hotels or Homestays
                    let docRef = doc(db, "Hotels", propertyId);
                    let docSnap = await getDoc(docRef);
                    let type = "Hotel";

                    if (!docSnap.exists()) {
                        docRef = doc(db, "Homestays", propertyId);
                        docSnap = await getDoc(docRef);
                        type = "Homestay";
                    }

                    if (docSnap.exists()) {
                        const data = docSnap.data();

                        // Parse Room Types (Migration Logic)
                        let loadedRoomTypes = [];
                        if (Array.isArray(data.roomTypes) && data.roomTypes.length > 0) {
                            loadedRoomTypes = data.roomTypes;
                        } else {
                            // Legacy fallback
                            // Create a default room type from old fields if they exist
                            if (data.roomType || data.totalRooms) {
                                loadedRoomTypes.push({
                                    id: Date.now(),
                                    name: data.roomType || "Standard", // Default if missing
                                    count: Number(data.totalRooms) || 1,
                                    bedType: data.bedArrangements || "Double",
                                    price: "", // Legacy might not have this
                                    photos: Array.isArray(data.roomPhotos) ? data.roomPhotos.filter(Boolean) : []
                                });
                            }
                        }

                        setFormData({
                            propertyType: type,
                            propertyName: data.hotelName || data.homestayName || data['Property Name'] || "",
                            email: data.email || "",
                            phone: data.phone || data['Property contact'] || "",
                            address: data.address || data['Property Address'] || "",
                            city: data.city || "",
                            state: data.state || "",
                            zipCode: data.zipCode || "",
                            latitude: data.latitude || "",
                            longitude: data.longitude || "",
                            description: data.description || data.About || "",
                            amenities: data.amenities || {
                                wifi: false, parking: false, ac: false, restaurant: false, pool: false, gym: false
                            },
                            bankName: data.bankName || "",
                            accountName: data.accountName || "",
                            accountNumber: data.accountNumber || "",
                            ifscCode: data.ifscCode || "",

                            // Enhanced Rooms
                            roomTypes: loadedRoomTypes,
                            totalRooms: data.totalRooms ? Number(data.totalRooms) : 0,

                            propertyDocuments: Array.isArray(data.propertyDocuments) ? data.propertyDocuments.filter(Boolean) : [],
                            paymentQr: data.paymentQr || null,
                            exteriorPhotos: Array.isArray(data.exteriorPhotos) ? data.exteriorPhotos.filter(Boolean) : [],
                        });
                    }
                } catch (err) {
                    console.error("Error fetching property:", err);
                    alert("Failed to load property details.");
                } finally {
                    setLoading(false);
                }
            } else {
                // Initialize with one empty room type for new properties
                setFormData(prev => ({
                    ...prev,
                    roomTypes: [{
                        id: Date.now(),
                        name: "Standard",
                        customName: "",
                        count: 1,
                        bedType: "Double",
                        price: "",
                        perAdultPrice: "",
                        perChildPrice: "",
                        discount: "",
                        maxguestAllowed: 2,
                        roomSize: "",
                        availability: "Yes",
                        facilities: [],
                        photos: []
                    }]
                }));
            }
        };

        fetchProperty();
    }, [isEditMode, propertyId]);

    // Recalculate Total Rooms whenever roomTypes change
    useEffect(() => {
        const total = formData.roomTypes.reduce((sum, rt) => sum + (Number(rt.count) || 0), 0);
        setFormData(prev => ({ ...prev, totalRooms: total }));
    }, [formData.roomTypes]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox' && name.startsWith('amenity_')) {
            const amenityName = name.replace('amenity_', '');
            setFormData(prev => ({
                ...prev,
                amenities: { ...prev.amenities, [amenityName]: checked }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e, fieldName) => {
        const files = Array.from(e.target.files);
        if (fieldName === 'paymentQr') {
            setFormData(prev => ({ ...prev, [fieldName]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [fieldName]: [...prev[fieldName], ...files] }));
        }
    };

    const removeFile = (fieldName, index) => {
        if (fieldName === 'paymentQr') {
            setFormData(prev => ({ ...prev, paymentQr: null }));
            return;
        }
        setFormData(prev => ({
            ...prev,
            [fieldName]: prev[fieldName].filter((_, i) => i !== index)
        }));
    };

    // --- Room Type Handlers ---

    const addRoomType = () => {
        setFormData(prev => ({
            ...prev,
            roomTypes: [...prev.roomTypes, {
                id: Date.now(),
                name: "Standard",
                customName: "",
                count: 1,
                bedType: "Double",
                price: "",
                perAdultPrice: "",
                perChildPrice: "",
                discount: "",
                maxguestAllowed: 2,
                roomSize: "",
                availability: "Yes",
                facilities: [],
                photos: []
            }]
        }));
    };

    const removeRoomType = (index) => {
        setFormData(prev => ({
            ...prev,
            roomTypes: prev.roomTypes.filter((_, i) => i !== index)
        }));
    };

    const updateRoomType = (index, field, value) => {
        setFormData(prev => {
            const updated = [...prev.roomTypes];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, roomTypes: updated };
        });
    };

    const handleRoomPhotoUpload = (e, index) => {
        const files = Array.from(e.target.files);
        setFormData(prev => {
            const updated = [...prev.roomTypes];
            updated[index] = { ...updated[index], photos: [...updated[index].photos, ...files] };
            return { ...prev, roomTypes: updated };
        });
    };

    const removeRoomPhoto = (typeIndex, photoIndex) => {
        setFormData(prev => {
            const updated = [...prev.roomTypes];
            updated[typeIndex] = {
                ...updated[typeIndex],
                photos: updated[typeIndex].photos.filter((_, i) => i !== photoIndex)
            };
            return { ...prev, roomTypes: updated };
        });
    };

    // --- Upload ---

    const uploadFiles = async (files, folder) => {
        const urls = [];
        for (const file of files) {
            if (typeof file === 'string') {
                urls.push(file); // Already a URL
                continue;
            }
            if (!file) continue;

            const storageRef = ref(storage, `${folder}/${propertyId}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            urls.push(url);
        }
        return urls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Strict Validation
        if (!formData.propertyName || !formData.phone || !formData.address) {
            alert("Please fill in basic mandatory fields.");
            return;
        }

        if (formData.roomTypes.length === 0) {
            alert("Please add at least one Room Type.");
            return;
        }

        // Validate each room type
        for (let i = 0; i < formData.roomTypes.length; i++) {
            const rt = formData.roomTypes[i];
            if (!rt.count || Number(rt.count) < 1) {
                alert(`Room Type #${i + 1} must have at least 1 room.`);
                return;
            }
            if (rt.photos.length === 0) {
                alert(`Room Type #${i + 1} (${rt.name}) must have at least one photo.`);
                return;
            }
        }

        // File Validation

        if (!formData.paymentQr) {
            alert("Payment QR is MANDATORY.");
            return;
        }
        if (formData.exteriorPhotos.length === 0) {
            alert("At least one Exterior Photo is MANDATORY.");
            return;
        }

        setUploading(true);
        try {
            const user = auth.currentUser;
            if (!user && !isEditMode) {
                alert("You must be logged in.");
                return;
            }

            const targetId = propertyId || user.uid;

            // Upload Main Files
            const docUrls = await uploadFiles(formData.propertyDocuments, "property_docs");
            const extUrls = await uploadFiles(formData.exteriorPhotos, "exterior_photos");

            let qrUrl = formData.paymentQr;
            if (typeof qrUrl !== 'string' && qrUrl) {
                const qrRef = ref(storage, `payment_qr/${targetId}/${Date.now()}_${qrUrl.name}`);
                await uploadBytes(qrRef, qrUrl);
                qrUrl = await getDownloadURL(qrRef);
            }

            // Upload nested Room Photos
            const processedRoomTypes = await Promise.all(formData.roomTypes.map(async (rt) => {
                const photoUrls = await uploadFiles(rt.photos, `room_photos/${rt.id}`);
                return {
                    id: rt.id,
                    name: rt.name,
                    customName: rt.customName || "",
                    count: Number(rt.count),
                    bedType: rt.bedType,
                    price: rt.price || "",
                    perAdultPrice: rt.perAdultPrice || "",
                    perChildPrice: rt.perChildPrice || "",
                    discount: rt.discount || "",
                    maxguestAllowed: rt.maxguestAllowed || 2,
                    roomSize: rt.roomSize || "",
                    availability: rt.availability || "Yes",
                    facilities: rt.facilities || [],
                    photos: photoUrls
                };
            }));

            // Aggregate legacy room data (e.g. combine all room photos for legacy view)
            const allRoomPhotos = processedRoomTypes.flatMap(rt => rt.photos);
            const legacyRoomTypeString = processedRoomTypes.map(rt => `${rt.name} (${rt.count})`).join(', ');
            const legacyBedString = processedRoomTypes.map(rt => `${rt.bedType}`).join('; ');

            const collectionName = formData.propertyType === "Hotel" ? "Hotels" : "Homestays";

            // Sync Room Types to Subcollection for Rate/Calendar Management
            // This ensures RateManagement.jsx and CalendarAvailability.jsx can find the rooms
            const roomsCollectionRef = collection(db, collectionName, targetId, "Rooms");

            // Sync Room Types to Subcollection
            try {
                const roomsCollectionRef = collection(db, collectionName, targetId, "Rooms");
                console.log("Syncing rooms to:", collectionName, targetId);

                await Promise.all(processedRoomTypes.map(async (rt) => {
                    const roomDocRef = doc(roomsCollectionRef, String(rt.id));
                    await setDoc(roomDocRef, {
                        ...rt,
                        roomType: rt.name,
                        customName: rt.customName,
                        totalRooms: Number(rt.count),
                        // Defaults for detailed fields to prevent missing data in sidebar
                        roomPrice: rt.price || "0",
                        perAdultPrice: rt.perAdultPrice || "0",
                        perChildPrice: rt.perChildPrice || "0",
                        discount: rt.discount || "0",
                        maxguestAllowed: rt.maxguestAllowed || "2",
                        roomSize: rt.roomSize || "0",
                        availability: rt.availability || "Yes",
                        facilities: rt.facilities || [],

                        updatedAt: new Date()
                    }, { merge: true });
                }));
                console.log("Rooms synced successfully");
            } catch (syncErr) {
                console.error("FAILED to sync rooms subcollection:", syncErr);
                alert("Main property saved, BUT Room Details failed to sync. Please try saving again. Warning: " + syncErr.message);
            }

            const docData = {
                ...formData,
                roomTypes: processedRoomTypes, // New Structure

                // Legacy / Flattened Fields
                totalRooms: Number(formData.totalRooms),
                roomType: legacyRoomTypeString,
                bedArrangements: legacyBedString,
                roomPhotos: allRoomPhotos,

                // Location
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude),
                map: `${formData.latitude},${formData.longitude}`, // Legacy format

                ownerId: targetId,
                status: "Pending",
                updatedAt: new Date(),

                propertyDocuments: docUrls,
                exteriorPhotos: extUrls,
                // Legacy Image Field for User Site
                hotelImages: extUrls,
                paymentQr: qrUrl
            };

            // Mapping names for legacy compatibility
            if (formData.propertyType === "Hotel") {
                docData.hotelName = formData.propertyName;
                docData['Property Name'] = formData.propertyName;
                docData['Property Address'] = formData.address;
                docData['Property contact'] = formData.phone;
            } else {
                docData.homestayName = formData.propertyName;
                docData['Property Name'] = formData.propertyName;
                // Homestays often used 'images' instead of hotelImages
                docData.images = extUrls;
                docData.address = formData.address;
                docData.phone = formData.phone;
            }

            await setDoc(doc(db, collectionName, targetId), docData, { merge: true });

            if (!isEditMode) {
                localStorage.setItem("adminType", formData.propertyType.toLowerCase());
                localStorage.setItem("isLoggedIn", "true");
            }

            alert("Property details saved successfully!");
            navigate(isEditMode ? -1 : "/admin/listings");
        } catch (error) {
            console.error("Error saving property:", error);
            if (error.code === 'storage/unauthorized' || error.message.includes('storage/unauthorized')) {
                alert("PERMISSION DENIED: Your Firebase Storage Rules are blocking file uploads.\n\nTO FIX THIS:\n1. Go to Firebase Console > Storage > Rules\n2. Change rules to: allow read, write: if request.auth != null;");
            } else {
                alert("Failed to save property. " + error.message);
            }
        } finally {
            setUploading(false);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-5 text-center">Loading...</div>;

    return (
        <div className="container-fluid p-4">
            <div className="d-flex align-items-center mb-4">
                <button onClick={() => navigate(-1)} className="btn btn-light me-3 rounded-circle p-2">
                    <ChevronLeft />
                </button>
                <h2 className="fw-bold text-primary mb-0">{isEditMode ? 'Edit Property' : 'Add New Property'}</h2>
            </div>

            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-5">
                            <form onSubmit={handleSubmit}>
                                {/* Basic Info */}
                                <h5 className="fw-bold mb-4 text-secondary">Basic Information</h5>
                                <div className="row g-3 mb-4">
                                    {!isEditMode && (
                                        <div className="col-md-12">
                                            <label className="form-label fw-bold">Property Type</label>
                                            <div className="d-flex gap-4">
                                                <div className="form-check">
                                                    <input className="form-check-input" type="radio" name="propertyType" value="Hotel" checked={formData.propertyType === "Hotel"} onChange={handleChange} id="typeHotel" />
                                                    <label className="form-check-label" htmlFor="typeHotel">Hotel</label>
                                                </div>
                                                <div className="form-check">
                                                    <input className="form-check-input" type="radio" name="propertyType" value="Homestay" checked={formData.propertyType === "Homestay"} onChange={handleChange} id="typeHomestay" />
                                                    <label className="form-check-label" htmlFor="typeHomestay">Homestay</label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-md-12">
                                        <label className="form-label">Property Name <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control bg-light border-0" name="propertyName" value={formData.propertyName} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                                        <input type="tel" className="form-control bg-light border-0" name="phone" value={formData.phone} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Email Address</label>
                                        <input type="email" className="form-control bg-light border-0" name="email" value={formData.email} onChange={handleChange} required />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Description</label>
                                        <textarea className="form-control bg-light border-0" rows="3" name="description" value={formData.description} onChange={handleChange}></textarea>
                                    </div>
                                </div>

                                <hr className="my-5 opacity-10" />

                                {/* Property Details - Enhanced Room Management */}
                                <h5 className="fw-bold mb-4 text-secondary">Room Details</h5>
                                <div className="alert alert-info py-2 px-3 small mb-4">
                                    <Info className="me-2" size={16} /> Add details for each room type. Photos are required for every type.
                                </div>

                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <label className="fw-bold">Room Specifics</label>
                                        <div className="badge bg-primary fs-6">Total Rooms: {formData.totalRooms}</div>
                                    </div>

                                    {formData.roomTypes.map((rt, index) => (
                                        <div key={rt.id} className="card border p-3 mb-3 bg-light">
                                            <div className="row g-3">
                                                {/* Top Row: Type, Custom Name, Count */}
                                                <div className="col-md-4">
                                                    <label className="small fw-bold mb-1">Room Type <span className="text-danger">*</span></label>
                                                    <select className="form-select border-0 shadow-sm" value={rt.name} onChange={(e) => updateRoomType(index, 'name', e.target.value)}>
                                                        {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="small fw-bold mb-1">Custom Name (Optional)</label>
                                                    <input type="text" className="form-control border-0 shadow-sm" value={rt.customName} placeholder="e.g. Hilltop View" onChange={(e) => updateRoomType(index, 'customName', e.target.value)} />
                                                    <small className="text-muted" style={{ fontSize: '10px' }}>Displayed to guests</small>
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="small fw-bold mb-1">Total Rooms</label>
                                                    <input type="number" className="form-control border-0 shadow-sm" value={rt.count} min="1" onChange={(e) => updateRoomType(index, 'count', e.target.value)} />
                                                </div>
                                                <div className="col-md-2 d-flex align-items-end justify-content-end">
                                                    <button type="button" onClick={() => removeRoomType(index)} className="btn btn-outline-danger btn-sm p-2 rounded-circle" disabled={formData.roomTypes.length === 1}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                {/* Price & Occupancy */}
                                                <div className="col-md-3">
                                                    <label className="small fw-bold mb-1">Room Price <span className="text-danger">*</span></label>
                                                    <input type="number" className="form-control border-0 shadow-sm" value={rt.price} min="0" placeholder="0" onChange={(e) => updateRoomType(index, 'price', e.target.value)} />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="small fw-bold mb-1">Bed Type</label>
                                                    <select className="form-select border-0 shadow-sm" value={rt.bedType} onChange={(e) => updateRoomType(index, 'bedType', e.target.value)}>
                                                        {BED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="small fw-bold mb-1">Max Guests</label>
                                                    <input type="number" className="form-control border-0 shadow-sm" value={rt.maxguestAllowed} min="1" onChange={(e) => updateRoomType(index, 'maxguestAllowed', e.target.value)} />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="small fw-bold mb-1">Room Size (sq ft)</label>
                                                    <input type="number" className="form-control border-0 shadow-sm" value={rt.roomSize} min="0" onChange={(e) => updateRoomType(index, 'roomSize', e.target.value)} />
                                                </div>

                                                {/* Extra Prices */}
                                                <div className="col-md-3">
                                                    <label className="small fw-bold mb-1">Per Adult Price</label>
                                                    <input type="number" className="form-control border-0 shadow-sm" value={rt.perAdultPrice} min="0" onChange={(e) => updateRoomType(index, 'perAdultPrice', e.target.value)} />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="small fw-bold mb-1">Per Child Price</label>
                                                    <input type="number" className="form-control border-0 shadow-sm" value={rt.perChildPrice} min="0" onChange={(e) => updateRoomType(index, 'perChildPrice', e.target.value)} />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="small fw-bold mb-1">Discount (%)</label>
                                                    <input type="number" className="form-control border-0 shadow-sm" value={rt.discount} min="0" max="100" onChange={(e) => updateRoomType(index, 'discount', e.target.value)} />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="small fw-bold mb-1">Availability</label>
                                                    <select className="form-select border-0 shadow-sm" value={rt.availability} onChange={(e) => updateRoomType(index, 'availability', e.target.value)}>
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>

                                                {/* Photos */}
                                                <div className="col-12">
                                                    <label className="small fw-bold mb-1">Photos (Required)</label>
                                                    <input type="file" multiple accept="image/*" className="form-control form-control-sm" onChange={(e) => handleRoomPhotoUpload(e, index)} />
                                                </div>

                                                {/* Preview Photos */}
                                                {rt.photos.length > 0 && (
                                                    <div className="col-12 d-flex flex-wrap gap-2 mt-2">
                                                        {rt.photos.map((img, i) => (
                                                            <div key={i} className="position-relative">
                                                                <img src={typeof img === 'string' ? img : (img instanceof Blob || img instanceof File ? URL.createObjectURL(img) : '')} className="rounded" style={{ width: 50, height: 50, objectFit: 'cover' }} alt="rm" />
                                                                <button type="button" onClick={() => removeRoomPhoto(index, i)} className="position-absolute top-0 end-0 btn btn-sm btn-danger py-0 px-1" style={{ fontSize: '8px', lineHeight: 1 }}>×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <button type="button" onClick={addRoomType} className="btn btn-outline-primary btn-sm fw-bold">
                                        <Plus size={16} className="me-1" /> Add Another Room Type
                                    </button>
                                </div>

                                <hr className="my-5 opacity-10" />

                                {/* Location */}
                                <h5 className="fw-bold mb-4 text-secondary">Location</h5>
                                <div className="row g-3 mb-4">
                                    <div className="col-12">
                                        <label className="form-label">Address Line <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control bg-light border-0" name="address" value={formData.address} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">City</label>
                                        <input type="text" className="form-control bg-light border-0" name="city" value={formData.city} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">State</label>
                                        <input type="text" className="form-control bg-light border-0" name="state" value={formData.state} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Zip Code</label>
                                        <input type="text" className="form-control bg-light border-0" name="zipCode" value={formData.zipCode} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Latitude <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control bg-light border-0" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="e.g. 12.9716" required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Longitude <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control bg-light border-0" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="e.g. 77.5946" required />
                                    </div>
                                    <div className="col-12">
                                        <small className="text-muted d-block mt-1">
                                            <Info size={14} className="me-1" />
                                            Tip: Right-click a place on Google Maps and select the coordinates to copy them here.
                                        </small>
                                    </div>
                                </div>

                                <hr className="my-5 opacity-10" />

                                {/* Photos & Docs */}
                                <h5 className="fw-bold mb-4 text-secondary">Documents & Media <span className="text-danger">*</span></h5>



                                <div className="row mb-4">
                                    <div className="col-md-12">
                                        <label className="form-label fw-bold">Exterior Photos (At least 1)</label>
                                        <div className="card p-3 bg-light border-0 border-dashed">
                                            <input type="file" multiple accept="image/*" onChange={(e) => handleFileChange(e, 'exteriorPhotos')} className="form-control mb-2" />
                                            <div className="d-flex flex-wrap gap-2">
                                                {formData.exteriorPhotos.map((img, i) => (
                                                    <div key={i} className="position-relative">
                                                        <img src={typeof img === 'string' ? img : (img instanceof Blob || img instanceof File ? URL.createObjectURL(img) : '')} alt="thumb" className="rounded" style={{ width: 60, height: 60, objectFit: 'cover' }} />
                                                        <button type="button" onClick={() => removeFile('exteriorPhotos', i)} className="position-absolute top-0 end-0 btn btn-sm btn-danger py-0 px-1" style={{ fontSize: '10px' }}>×</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Removed Global Room Photos section as it's now per-room-type */}
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-bold">Payment QR Code</label>
                                    <div className="card p-3 bg-light border-0 border-dashed d-flex flex-row align-items-center gap-3">
                                        <div style={{ width: 100, height: 100, border: '1px dashed #ccc' }} className="d-flex align-items-center justify-content-center bg-white rounded">
                                            {formData.paymentQr ? (
                                                <img src={typeof formData.paymentQr === 'string' ? formData.paymentQr : (formData.paymentQr instanceof Blob || formData.paymentQr instanceof File ? URL.createObjectURL(formData.paymentQr) : '')} alt="QR" className="w-100 h-100 object-fit-contain p-1" />
                                            ) : <span className="text-muted small">No QR</span>}
                                        </div>
                                        <div>
                                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'paymentQr')} className="form-control mb-2" />
                                            {formData.paymentQr && <button type="button" onClick={() => removeFile('paymentQr')} className="btn btn-sm btn-outline-danger">Remove QR</button>}
                                        </div>
                                    </div>
                                </div>

                                <hr className="my-5 opacity-10" />

                                <div className="d-flex justify-content-end">
                                    <button type="button" onClick={() => navigate(-1)} className="btn btn-light me-3 px-4">Cancel</button>
                                    <button type="submit" className="btn btn-primary px-5 py-2 fw-bold" disabled={uploading || loading}>
                                        {uploading ? 'Uploading & Saving...' : 'Save Property Details'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProperty;
