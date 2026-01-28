import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { ChevronLeft, Save, Upload, Check } from "lucide-react";

const AddProperty = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        propertyType: "Hotel", // Hotel or Homestay
        propertyName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        description: "",
        amenities: {
            wifi: false,
            parking: false,
            ac: false,
            restaurant: false,
            pool: false,
            gym: false
        },
        bankName: "",
        accountName: "",
        accountNumber: "",
        ifscCode: ""
    });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("You must be logged in.");
                return;
            }

            const collectionName = formData.propertyType === "Hotel" ? "Hotels" : "Homestays";
            const docData = {
                ...formData,
                ownerId: user.uid,
                status: "Pending", // Needs admin approval likely
                createdAt: new Date(),
                updatedAt: new Date(),
                isAdmin: true, // Legacy flag
            };

            // Only add the relevant name field based on property type
            if (formData.propertyType === "Hotel") {
                docData.hotelName = formData.propertyName;
            } else if (formData.propertyType === "Homestay") {
                docData.homestayName = formData.propertyName;
            }

            // Create property document
            await setDoc(doc(db, collectionName, user.uid), docData);

            // Update local storage for immediate access logic (legacy support)
            localStorage.setItem("adminType", formData.propertyType.toLowerCase());
            localStorage.setItem("isLoggedIn", "true"); // Ensure this is set

            // Update admin profile if needed (separate collection often used)
            await setDoc(doc(db, "admin profile", user.uid), {
                ProfilePicture: "", // Placeholder
                email: user.email,
                uid: user.uid
            }, { merge: true });

            alert("Property registered successfully!");
            navigate("/admin/listings");
        } catch (error) {
            console.error("Error adding property:", error);
            alert("Failed to register property. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex align-items-center mb-4">
                <button onClick={() => navigate(-1)} className="btn btn-light me-3 rounded-circle p-2">
                    <ChevronLeft />
                </button>
                <h2 className="fw-bold text-primary mb-0">Add New Property</h2>
            </div>

            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-5">
                            <form onSubmit={handleSubmit}>
                                {/* Step 1: Basic Info */}
                                <h5 className="fw-bold mb-4 text-secondary">Basic Information</h5>
                                <div className="row g-3 mb-4">
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
                                    <div className="col-md-12">
                                        <label className="form-label">Property Name</label>
                                        <input type="text" className="form-control bg-light border-0" name="propertyName" value={formData.propertyName} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Phone Number</label>
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

                                {/* Step 2: Location */}
                                <h5 className="fw-bold mb-4 text-secondary">Location</h5>
                                <div className="row g-3 mb-4">
                                    <div className="col-12">
                                        <label className="form-label">Address Line</label>
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
                                </div>

                                <hr className="my-5 opacity-10" />

                                {/* Step 3: Amenities */}
                                <h5 className="fw-bold mb-4 text-secondary">Amenities</h5>
                                <div className="row g-3 mb-4">
                                    {Object.keys(formData.amenities).map(key => (
                                        <div className="col-6 col-md-4" key={key}>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    name={`amenity_${key}`}
                                                    checked={formData.amenities[key]}
                                                    onChange={handleChange}
                                                    id={`check_${key}`}
                                                />
                                                <label className="form-check-label text-capitalize" htmlFor={`check_${key}`}>
                                                    {key}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <hr className="my-5 opacity-10" />

                                {/* Step 4: Bank Details */}
                                <h5 className="fw-bold mb-4 text-secondary">Bank Details</h5>
                                <div className="row g-3 mb-5">
                                    <div className="col-md-6">
                                        <label className="form-label">Bank Name</label>
                                        <input type="text" className="form-control bg-light border-0" name="bankName" value={formData.bankName} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Account Holder Name</label>
                                        <input type="text" className="form-control bg-light border-0" name="accountName" value={formData.accountName} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Account Number</label>
                                        <input type="text" className="form-control bg-light border-0" name="accountNumber" value={formData.accountNumber} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">IFSC Code</label>
                                        <input type="text" className="form-control bg-light border-0" name="ifscCode" value={formData.ifscCode} onChange={handleChange} required />
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end">
                                    <button type="button" onClick={() => navigate(-1)} className="btn btn-light me-3 px-4">Cancel</button>
                                    <button type="submit" className="btn btn-primary px-5 py-2 fw-bold" disabled={loading}>
                                        {loading ? 'Registering...' : 'Register Property'}
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
