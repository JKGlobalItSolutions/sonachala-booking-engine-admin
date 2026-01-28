



import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { Modal, Button, Badge, Form, InputGroup } from "react-bootstrap";
import { Search, Filter, Eye, X } from "lucide-react";
import guestsImage from '../assets/Guests.jpg';

const GuestDetails = () => {
  const [guests, setGuests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const guestRef = collection(db, "Hotels", user.uid, "Guest Details");
        const guestSnap = await getDocs(guestRef);

        const hotelGuests = [];
        guestSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const paymentProof = Array.isArray(data["Payment Proof"]) ? data["Payment Proof"] : [];
          const proofUrls = paymentProof.map((item) => item.url).filter(Boolean);

          if (data.latestProofUrl && !proofUrls.includes(data.latestProofUrl)) {
            proofUrls.push(data.latestProofUrl);
          }

          hotelGuests.push({
            id: docSnap.id,
            ...data,
            allProofUrls: proofUrls,
            checkInRaw: data["Check-In Date"]?.toDate ? data["Check-In Date"].toDate() : new Date(data["Check-In Date"]),
            checkOutRaw: data["Check-Out Date"]?.toDate ? data["Check-Out Date"].toDate() : new Date(data["Check-Out Date"]),
          });
        });

        // Sort by check-in date (newest first)
        hotelGuests.sort((a, b) => b.checkInRaw - a.checkInRaw);
        setGuests(hotelGuests);
      } catch (err) {
        console.error("Error fetching guests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active": return <Badge bg="success">Active</Badge>;
      case "checked-in": return <Badge bg="success">Checked In</Badge>;
      case "confirmed": return <Badge bg="primary">Confirmed</Badge>;
      case "checked-out": return <Badge bg="secondary">Checked Out</Badge>;
      case "cancelled": return <Badge bg="danger">Cancelled</Badge>;
      case "pending": return <Badge bg="warning" text="dark">Pending</Badge>;
      default: return <Badge bg="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status?.toLowerCase().trim()) {
      case "paid": return <Badge bg="success" pill>Paid</Badge>;
      case "partial": return <Badge bg="info" pill>Partial</Badge>;
      case "unpaid": case "pending": return <Badge bg="warning" text="dark" pill>Unpaid</Badge>;
      default: return <Badge bg="light" text="dark" pill>{status || "N/A"}</Badge>;
    }
  };

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = guest["Full Name"]?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" ||
      (statusFilter === "Active" && new Date(guest.checkOutRaw) > new Date() && guest["Status"] !== "Cancelled") ||
      (statusFilter === "Completed" && new Date(guest.checkOutRaw) <= new Date()) ||
      (statusFilter === "Cancelled" && guest["Status"] === "Cancelled");

    return matchesSearch && matchesStatus;
  });

  const handleShowDetails = (guest) => {
    setSelectedGuest(guest);
    setShowModal(true);
  };

  if (loading) return <div className="loading-overlay"><div className="loading-spinner"></div></div>;

  return (
    <div className="container-fluid">
      <div className="mb-4 w-100">
        <img
          src={guestsImage}
          alt="Guests Header"
          style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }}
        />
      </div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold mb-1">Reservations</h2>
          <p className="text-secondary mb-0">Manage your bookings and guest details</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" className="d-flex align-items-center gap-2">
            <Filter size={18} /> Filters
          </Button>
          <Button variant="primary" className="d-flex align-items-center gap-2">
            + New Reservation
          </Button>
        </div>
      </div>

      <div className="card border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-lg-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><Search size={18} className="text-muted" /></span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light"
                  placeholder="Search by guest name, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4 col-lg-3">
              <select
                className="form-select bg-light"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active / Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="py-3 ps-4 border-0">Guest Name</th>
                  <th className="py-3 border-0">Check In</th>
                  <th className="py-3 border-0">Check Out</th>
                  <th className="py-3 border-0">Status</th>
                  <th className="py-3 border-0">Payment</th>
                  <th className="py-3 border-0">Rooms</th>
                  <th className="py-3 pe-4 border-0 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.length > 0 ? (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id}>
                      <td className="ps-4">
                        <div className="fw-bold text-dark">{guest["Full Name"]}</div>
                        <div className="small text-muted">{guest["Phone Number"]}</div>
                      </td>
                      <td>{guest.checkInRaw.toLocaleDateString()}</td>
                      <td>{guest.checkOutRaw.toLocaleDateString()}</td>
                      <td>{getStatusBadge(guest["Status"])}</td>
                      <td>{getPaymentStatusBadge(guest["Payment Status"])}</td>
                      <td>{guest["Rooms"]?.length || 0} Rooms</td>
                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-light text-primary" onClick={() => handleShowDetails(guest)}>
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">No reservations found matching your criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold">Reservation Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 pb-4 px-4">
          {selectedGuest && (
            <div className="row g-4">
              <div className="col-12 d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h4 className="mb-0 fw-bold">{selectedGuest["Full Name"]}</h4>
                  <span className="text-muted">{selectedGuest.confirmationId || selectedGuest.id}</span>
                </div>
                <div className="text-end">
                  {getStatusBadge(selectedGuest["Status"])}
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 bg-light rounded-3 h-100">
                  <h6 className="fw-bold text-primary mb-3">Customer Info</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Email</span>
                    <span className="fw-medium">{selectedGuest["Email Address"] || "N/A"}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phone</span>
                    <span className="fw-medium">{selectedGuest["Phone Number"] || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 bg-light rounded-3 h-100">
                  <h6 className="fw-bold text-primary mb-3">Booking Info</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Check In</span>
                    <span className="fw-medium">{selectedGuest.checkInRaw.toLocaleDateString()}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Check Out</span>
                    <span className="fw-medium">{selectedGuest.checkOutRaw.toLocaleDateString()}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Payment</span>
                    <span>{getPaymentStatusBadge(selectedGuest["Payment Status"])}</span>
                  </div>
                </div>
              </div>

              <div className="col-12 mt-4">
                <h6 className="fw-bold text-primary mb-3">Room Details</h6>
                <div className="table-responsive border rounded-3">
                  <table className="table table-sm mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-3 border-0">Room Type</th>
                        <th className="border-0">Guests</th>
                        <th className="border-0">Price</th>
                        <th className="pe-3 border-0 text-end">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGuest["Rooms"]?.map((room, idx) => (
                        <tr key={idx}>
                          <td className="ps-3">{room.roomType}</td>
                          <td>{room.guestCount} Adults, {room.childrenCount} Kids</td>
                          <td>{room.price}</td>
                          <td className="pe-3 text-end">{room.roomsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedGuest.allProofUrls?.length > 0 && (
                <div className="col-12 mt-4">
                  <h6 className="fw-bold text-primary mb-3">Payment Proof</h6>
                  <div className="d-flex gap-3 overflow-auto pb-2">
                    {selectedGuest.allProofUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="Proof" className="rounded border" style={{ height: '100px', objectFit: 'cover' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          <Button variant="primary">Edit Reservation</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GuestDetails;
