import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { Plus, Building, MapPin, Loader } from "lucide-react";
// Video import
import CheckListVideo from "../assets/Property-Checklist.mp4";

const Listings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    setLoading(false);
                    return;
                }

                const hotelDocRef = doc(db, "Hotels", user.uid);
                const homestayDocRef = doc(db, "Homestays", user.uid);

                const hotelSnap = await getDoc(hotelDocRef);
                const homestaySnap = await getDoc(homestayDocRef);

                const foundListings = [];

                if (hotelSnap.exists() && hotelSnap.data().hotelName) {
                    foundListings.push({ id: hotelSnap.id, type: "Hotel", ...hotelSnap.data() });
                }
                if (homestaySnap.exists() && homestaySnap.data().homestayName) {
                    foundListings.push({ id: homestaySnap.id, type: "Homestay", ...homestaySnap.data() });
                }

                setListings(foundListings);
            } catch (error) {
                console.error("Error fetching listings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Loader className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="fw-bold text-primary mb-1">My Listings</h2>
                    <p className="text-secondary mb-0">Manage your properties and settings</p>
                </div>
                <Link to="/admin/add-property" className="btn btn-primary d-flex align-items-center gap-2">
                    <Plus size={20} /> Add New Property
                </Link>
            </div>

            {listings.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-dashed">
                    <div className="mb-3 d-inline-block" style={{ width: '300px', maxWidth: '100%' }}>
                        <video
                            src={CheckListVideo}
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                        />
                    </div>
                    <h4 className="fw-bold text-dark mt-3">No Properties Listed Yet</h4>
                    <p className="text-muted mb-4 max-w-md mx-auto">
                        It looks empty here! Add your first property to start managing your bookings.
                    </p>
                    <Link to="/admin/add-property" className="btn btn-primary px-5 py-3 fw-bold rounded-pill shadow-sm transition-transform hover-scale">
                        <Plus size={20} className="me-2" />
                        List Your Property
                    </Link>
                </div>
            ) : (
                <div className="row g-4">
                    {listings.map((listing) => (
                        <div key={listing.id} className="col-md-6 col-lg-4">
                            <div className="card h-100 border-0 shadow-sm hover-shadow transition-all">
                                <div className="position-relative" style={{ height: "200px" }}>
                                    <img
                                        src={listing.exteriorPhotos?.[0] || listing.images?.[0] || listing.propertyImage || "https://placehold.co/600x400?text=Property"}
                                        alt={listing.hotelName || listing.homestayName}
                                        className="w-100 h-100 object-fit-cover rounded-top"
                                        style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
                                    />
                                    <span className="badge bg-white text-dark position-absolute top-0 end-0 m-3 shadow-sm">
                                        {listing.type}
                                    </span>
                                </div>
                                <div className="card-body p-4">
                                    <h5 className="fw-bold mb-2 text-dark">{listing.hotelName || listing.homestayName || "Untitled Property"}</h5>
                                    <div className="d-flex align-items-center text-secondary mb-3 small">
                                        <MapPin size={16} className="me-1" />
                                        {listing.address || listing.city || "No address provided"}
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mt-4">
                                        <span className={`badge ${listing.status === 'Approved' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                            {listing.status || "Pending"}
                                        </span>
                                        <div className="d-flex gap-2">
                                            <Link
                                                to="/admin/add-property"
                                                state={{ isEdit: true, propertyId: listing.id }}
                                                className="btn btn-light btn-sm"
                                            >
                                                Edit
                                            </Link>
                                            <Link to={listing.type === 'Hotel' ? '/hotel-RoomStatus' : '/homestay-RoomStatus'} className="btn btn-outline-primary btn-sm">
                                                Manage
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Listings;
