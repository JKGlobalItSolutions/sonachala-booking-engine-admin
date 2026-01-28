import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { adminDB as db } from '../firebase.admin';

const PropertyApprovals = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingProperties();
    }, []);

    const fetchPendingProperties = async () => {
        try {
            // Assuming 'properties' collection is shared. 
            // Note: 'db' import needs to be verified. admin app seems to use filtered exports.
            const q = query(
                collection(db, 'properties'),
                where('status', '==', 'pending')
            );

            const querySnapshot = await getDocs(q);
            const props = [];
            querySnapshot.forEach((doc) => {
                props.push({ id: doc.id, ...doc.data() });
            });
            setProperties(props);
        } catch (error) {
            console.error("Error fetching properties:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (propertyId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this property?`)) return;

        try {
            const propertyRef = doc(db, 'properties', propertyId);
            await updateDoc(propertyRef, {
                status: action === 'approve' ? 'approved' : 'rejected',
                reviewedAt: new Date()
            });

            // Refresh list
            setProperties(prev => prev.filter(p => p.id !== propertyId));
            alert(`Property ${action}d successfully`);
        } catch (error) {
            console.error(`Error ${action}ing property:`, error);
            alert(`Failed to ${action} property`);
        }
    };

    if (loading) return <div className="p-4 text-center">Loading pending approvals...</div>;

    return (
        <div className="container-fluid p-4">
            <h2 className="mb-4">Pending Approvals</h2>

            {properties.length === 0 ? (
                <div className="alert alert-info">No pending property approvals found.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover shadow-sm bg-white rounded">
                        <thead className="table-light">
                            <tr>
                                <th>Property Name</th>
                                <th>Type</th>
                                <th>Location</th>
                                <th>Owner</th>
                                <th>Submitted On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {properties.map(property => (
                                <tr key={property.id}>
                                    <td>
                                        <strong>{property.name}</strong>
                                        {property.images && property.images.length > 0 && (
                                            <div className="small text-muted">
                                                <i className="fas fa-image"></i> {property.images.length} photos
                                            </div>
                                        )}
                                    </td>
                                    <td><span className="badge bg-secondary">{property.type}</span></td>
                                    <td>{property.location?.city || 'N/A'}</td>
                                    <td>{property.ownerId}</td>
                                    <td>{property.createdAt?.toDate().toLocaleDateString() || 'N/A'}</td>
                                    <td>
                                        <div className="btn-group btn-group-sm">
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleAction(property.id, 'approve')}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() => handleAction(property.id, 'reject')}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PropertyApprovals;
