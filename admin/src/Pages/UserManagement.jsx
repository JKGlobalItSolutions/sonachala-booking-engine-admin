import React, { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { adminDB } from "../firebase.admin";
import { Form, Modal, Button } from "react-bootstrap";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(adminDB, "Users"));
        const usersData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(adminDB, "Users", id));
      setUsers(users.filter((user) => user.id !== id));
      alert("User deleted successfully.");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  const handleEdit = (user) => {
    setCurrentUser(user);
    setEditForm(user);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "Users", currentUser.id), editForm);
      setUsers(users.map((user) =>
        user.id === currentUser.id ? editForm : user
      ));
      setShowEditModal(false);
      alert("User updated successfully.");
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user.");
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const filteredUsers = users.filter((user) =>
    `${user['Full Name']} ${user['Email Address']} ${user['Mobile Number']}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-4">Loading users...</div>;

  return (
    <div className="container my-4 mt-lg-5 user-management-container p-lg-3" style={{ marginLeft: "250px", marginTop: "60px", maxWidth: "calc(100% - 250px)" }}>
      <h3>📋 User Management</h3>
      <input
        type="text"
        placeholder="Search by name, email, or phone"
        className="form-control mb-3"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="row g-4">
        {filteredUsers.map((user) => (
          <div className="col-md-4" key={user.id}>
            <div className="card">
              <div className="card-body">
                <h5>{user['Full Name'] || 'No Name'}</h5>
                <p><strong>Email:</strong> {user['Email Address']}</p>
                <p><strong>Phone:</strong> {user['Mobile Number'] || 'N/A'}</p>
                <p><strong>Address:</strong> {user['Address'] || 'N/A'}</p>
                <div className="d-flex justify-content-between">
                  <button className="btn btn-warning btn-sm" onClick={() => handleEdit(user)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="Full Name"
                value={editForm['Full Name'] || ''}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="Email Address"
                value={editForm['Email Address'] || ''}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mobile Number</Form.Label>
              <Form.Control
                type="text"
                name="Mobile Number"
                value={editForm['Mobile Number'] || ''}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="Address"
                value={editForm['Address'] || ''}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>DOB</Form.Label>
              <Form.Control
                type="text"
                name="DOB"
                value={editForm['DOB'] || ''}
                onChange={handleEditChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveEdit}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement;
