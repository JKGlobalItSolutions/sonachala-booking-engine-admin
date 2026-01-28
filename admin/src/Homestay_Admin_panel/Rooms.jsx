import React, { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { toast } from 'react-toastify';
import { Modal, Button, Form } from 'react-bootstrap';
import RoomVideo from '../assets/Couple-takes-house-loan.mp4';

const RoomDetails = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  const facilityOptions = [
    { name: 'Wi-Fi', icon: 59111 },
    { name: 'Food', icon: 61513 },
    { name: 'Mini Fridge', icon: 57902 },
    { name: 'Telephone', icon: 58530 },
    { name: 'Flat-screen TV', icon: 59015 },
    { name: '24-hour Room Service', icon: 58685 },
    { name: 'Laundry', icon: 58264 },
    { name: 'Air Conditioning', icon: 57399 },
    { name: 'Attached Bathroom', icon: 61119 },
    { name: 'Public Bathroom', icon: 61119 },
    { name: 'Sofa', icon: 57677 },
    { name: 'Living Room', icon: 61808 },
    { name: 'Mountain view', icon: 62507 },
    { name: 'Balcony', icon: 57546 },
  ];

  const availabilityOptions = ['Room Availability', 'Yes', 'No'];

  const roomTypeOptions = [
    'Single Room', 'Double Room', 'Twin Room', 'Double-Double Room', 'Studio',
    'Mini-Suite', 'Suite', 'Presidential Suite', 'Apartments', 'Connecting Rooms',
    'Murphy Room', 'Accessible Room', 'Cabana', 'Adjoining Rooms', 'Villa',
    'Executive Floor', 'Deluxe Room', 'Super Deluxe Room', 'Luxury Room', 'Standard Room', 'Elite Room', 'Family Room'
  ];

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    if (auth.currentUser) {
      const homestayId = auth.currentUser.uid;
      const roomsCollection = collection(db, 'Homestays', homestayId, 'Rooms');
      const roomsSnapshot = await getDocs(roomsCollection);
      const roomsList = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(roomsList);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentRoom(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFacilitySelect = (facility) => {
    setCurrentRoom(prev => ({
      ...prev,
      facilities: [...(prev.facilities || []), facility]
    }));
  };

  const handleFacilityRemove = (facilityName) => {
    setCurrentRoom(prev => ({
      ...prev,
      facilities: prev.facilities.filter(f => f.name !== facilityName)
    }));
  };

  const validateRoomDetails = (room) => {
    const requiredFields = ['totalRooms', 'roomPrice', 'perAdultPrice', 'perChildPrice', 'discount', 'maxguestAllowed', 'roomType', 'roomSize', 'bedType', 'availability'];
    for (let field of requiredFields) {
      if (!room[field]) {
        toast.error(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
        return false;
      }
    }
    if (!room.facilities || room.facilities.length === 0) {
      toast.error('Please select at least one facility.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateRoomDetails(currentRoom)) return;

    setIsUploading(true);
    const homestayId = auth.currentUser.uid;
    const roomRef = doc(db, 'Homestays', homestayId, 'Rooms', currentRoom.id || doc(collection(db, 'Homestays', homestayId, 'Rooms')).id);

    try {
      await setDoc(roomRef, {
        ...currentRoom,
        customName: currentRoom.customName || '',
        totalRooms: currentRoom.totalRooms.toString(),
        roomPrice: currentRoom.roomPrice.toString(),
        perAdultPrice: currentRoom.perAdultPrice.toString(),
        perChildPrice: currentRoom.perChildPrice.toString(),
        discount: currentRoom.discount.toString(),
        maxguestAllowed: currentRoom.maxguestAllowed.toString(),
        roomSize: currentRoom.roomSize.toString(),
        facilities: currentRoom.facilities.map(facility => ({
          name: facility.name,
          icon: facility.icon
        }))
      }, { merge: true });

      await calculateAndStoreMaxGuests();

      toast.success('Room details saved successfully');
      setShowModal(false);
      fetchRooms();
    } catch (error) {
      console.error('Error saving room details:', error);
      toast.error('Failed to save room details');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (room) => {
    setCurrentRoom(room);
    setShowModal(true);
  };

  const handleAdd = () => {
    setCurrentRoom({
      totalRooms: '',
      roomPrice: '',
      bedType: '',
      roomType: roomTypeOptions[0],
      customName: '',
      perAdultPrice: '',
      perChildPrice: '',
      discount: '',
      maxguestAllowed: '',
      roomSize: '',
      availability: availabilityOptions[0],
      facilities: []
    });
    setShowModal(true);
  };

  const handleRemove = (roomId) => {
    setRoomToDelete(roomId);
    setShowDeleteModal(true);
  };

  const confirmRemoveRoom = async () => {
    if (roomToDelete) {
      const homestayId = auth.currentUser.uid;
      try {
        await deleteDoc(doc(db, 'Homestays', homestayId, 'Rooms', roomToDelete));
        toast.success('Room deleted successfully');
        fetchRooms();
        await calculateAndStoreMaxGuests();
      } catch (error) {
        console.error('Error deleting room:', error);
        toast.error('Failed to delete room');
      }
      setShowDeleteModal(false);
      setRoomToDelete(null);
    }
  };

  const calculateAndStoreMaxGuests = async () => {
    const homestayId = auth.currentUser.uid;
    let totalMaxGuests = 0;

    for (let room of rooms) {
      totalMaxGuests += parseInt(room.totalRooms) * parseInt(room.maxguestAllowed);
    }

    try {
      await updateDoc(doc(db, 'Homestays', homestayId), { totalMaxGuests: totalMaxGuests });
    } catch (error) {
      console.error('Error updating total max guests:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="room-details-container p-lg-3">
      <style jsx>{`
        .room-details-container {
          width: 100%;
        }
        .room-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 20px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .card-header {
          background-color: #f8f9fa;
          padding: 15px 20px;
          border-bottom: 1px solid #ddd;
        }
        .card-body {
          padding: 20px;
        }
        .card-footer {
          background-color: #f8f9fa;
          padding: 15px 20px;
          border-top: 1px solid #ddd;
        }
        .room-info {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }
        .room-info p {
          margin: 5px 0;
        }
        .facility-tag {
          display: inline-block;
          background-color: #f0f0f0;
          padding: 5px 10px;
          margin: 5px;
          border-radius: 20px;
          font-size: 0.9em;
        }
        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
        }
        .add-room-button-container {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
        .btn-custom-dark {
          background-color: #343a40;
          border-color: #343a40;
          color: #fff;
        }
        .btn-custom-dark:hover {
          background-color: #23272b;
          border-color: #23272b;
        }
        .delete-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .delete-modal-content {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          width: 400px;
          max-width: 90%;
        }
      `}</style>
      <h2 className="mb-4 font-bold text-gray-800">Room Details</h2>

      // ... inside render ...
      <h2 className="mb-4 font-bold text-gray-800">Room Details</h2>

      {rooms.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-3 shadow-sm p-5">
          <div className="mb-4 d-inline-block" style={{ width: '300px', maxWidth: '100%' }}>
            <video
              src={RoomVideo}
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
            />
          </div>
          <h4 className="fw-bold text-dark mb-3">No Rooms Added Yet</h4>
          <div className="add-room-button-container mb-4">
            <Button style={{ backgroundColor: '#003B94', borderColor: '#003B94', color: '#fff', padding: '10px 30px' }} onClick={handleAdd}>
              + Add Your First Room
            </Button>
          </div>
          <p className="text-muted small mt-4" style={{ fontSize: '0.8rem', maxWidth: '600px', margin: '0 auto' }}>
            Add an attribution link close to your content that uses these assets, whether it’s on a webpage, in a video, in an app, or on social media. <a href="https://iconscout.com/lottie-animations/couple" className="text-decoration-underline text-primary" target="_blank" rel="noreferrer">Couple takes house loan</a> by <a href="https://iconscout.com/contributors/vector-stall" className="text-decoration-underline text-primary" target="_blank" rel="noreferrer">Vector Stall</a> on <a href="https://iconscout.com" className="text-decoration-underline text-primary" target="_blank" rel="noreferrer">IconScout</a>
          </p>
        </div>
      ) : (
        <>
          {rooms.map((room) => (
            <div key={room.id} className="room-card">
              <div className="card-header">
                <h3 className="text-xl font-semibold mb-1">{room.customName || room.roomType}</h3>
                {room.customName && <small className="text-muted d-block">Type: {room.roomType}</small>}
              </div>
              <div className="card-body">
                <div className="room-info">
                  <p><strong>Total Rooms:</strong> {room.totalRooms}</p>
                  <p><strong>Price per Night:</strong> ₹{room.roomPrice}</p>
                  <p><strong>Bed Type:</strong> {room.bedType}</p>
                  <p><strong>Per Adult Price:</strong> ₹{room.perAdultPrice}</p>
                  <p><strong>Per Child Price:</strong> ₹{room.perChildPrice}</p>
                  <p><strong>Discount:</strong> {room.discount}%</p>
                  <p><strong>Max Guests:</strong> {room.maxguestAllowed}</p>
                  <p><strong>Room Size:</strong> {room.roomSize} sq ft</p>
                  <p><strong>Availability:</strong> {room.availability}</p>
                </div>
                <div className="mt-3">
                  <strong>Facilities:</strong>
                  {room.facilities.map((facility, index) => (
                    <span key={index} className="facility-tag">
                      {facility.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="card-footer">
                <div className="action-buttons">
                  <Button style={{ backgroundColor: '#003B94', borderColor: '#003B94', color: '#fff' }} onClick={() => handleEdit(room)}>Edit</Button>
                  <Button variant="dark" onClick={() => handleRemove(room.id)}>Remove Room</Button>
                </div>
              </div>
            </div>
          ))}
          <div className="add-room-button-container">
            <Button style={{ backgroundColor: '#003B94', borderColor: '#003B94', color: '#fff' }} onClick={handleAdd}>+ Add New Room</Button>
          </div>
        </>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="md">
        <Modal.Header closeButton>
          <Modal.Title>{currentRoom?.id ? 'Edit Room' : 'Add New Room'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Room Type <span className="text-danger">*</span></Form.Label>
              <Form.Select name="roomType" value={currentRoom?.roomType || ''} onChange={handleInputChange} required>
                <option value="">Select Room Type</option>
                {roomTypeOptions.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Custom Room Name (Optional)</Form.Label>
              <Form.Control type="text" name="customName" placeholder="e.g. Hilltop View Room" value={currentRoom?.customName || ''} onChange={handleInputChange} />
              <Form.Text className="text-muted">This name will be displayed to guests.</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Total Rooms</Form.Label>
              <Form.Control type="number" name="totalRooms" value={currentRoom?.totalRooms || ''} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Room Price</Form.Label>
              <Form.Control type="number" name="roomPrice" value={currentRoom?.roomPrice || ''} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Bed Type</Form.Label>
              <Form.Control type="text" name="bedType" value={currentRoom?.bedType || ''} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Per Adult Price</Form.Label>
              <Form.Control type="number" name="perAdultPrice" value={currentRoom?.perAdultPrice || ''} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Per Child Price</Form.Label>
              <Form.Control type="number" name="perChildPrice" value={currentRoom?.perChildPrice || ''} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Discount (%)</Form.Label>
              <Form.Control type="number" name="discount" value={currentRoom?.discount || ''} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Max Guests Allowed</Form.Label>
              <Form.Control type="number" name="maxguestAllowed" value={currentRoom?.maxguestAllowed || ''} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Room Size (sq ft)</Form.Label>
              <Form.Control type="number" name="roomSize" value={currentRoom?.roomSize || ''} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Availability</Form.Label>
              <Form.Select name="availability" value={currentRoom?.availability || ''} onChange={handleInputChange} required>
                {availabilityOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Facilities</Form.Label>
              <Form.Select onChange={(e) => {
                const selectedFacility = JSON.parse(e.target.value);
                if (!currentRoom.facilities.some(f => f.name === selectedFacility.name)) {
                  handleFacilitySelect(selectedFacility);
                }
              }}>
                <option value="">Select facility</option>
                {facilityOptions.map((facility, index) => (
                  <option key={index} value={JSON.stringify(facility)}>{facility.name}</option>
                ))}
              </Form.Select>
              <div className="mt-2">
                {currentRoom?.facilities?.map((facility, index) => (
                  <span key={index} className="facility-tag align-item-center">
                    {facility.name}
                    <Button variant="link text-dark text-decoration-none fw-bold" size="sm" onClick={() => handleFacilityRemove(facility.name)}>
                      x
                    </Button>
                  </span>
                ))}
              </div>
            </Form.Group>
            <Button style={{ backgroundColor: '#003B94', borderColor: '#003B94', color: '#fff' }} type="submit" disabled={isUploading}>
              {isUploading ? 'Saving...' : 'Save Room'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to remove this room?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            style={{ backgroundColor: '#003B94', borderColor: '#003B94', color: '#fff' }}
            onClick={confirmRemoveRoom}
          >
            Remove Room
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RoomDetails;

