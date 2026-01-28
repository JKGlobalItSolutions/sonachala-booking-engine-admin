import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { toast } from 'react-toastify';
import paymentImage from '../assets/Payment.jpg';

const PaymentPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const q = query(collection(db, 'Homestays', user.uid, 'Guest Details'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const paymentsData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(payment =>
            payment.Status !== 'Cancelled' &&
            payment['Payment Status'] === 'Pending'
          )
          .sort((a, b) => b['Check-In Date'].toDate() - a['Check-In Date'].toDate());

        setPayments(paymentsData);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching payments:', error);
        toast.error('Failed to fetch payment details');
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const handleStatusChange = async (paymentId, newStatus) => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('You must be logged in to update payment status');
      return;
    }

    try {
      const paymentDocRef = doc(db, 'Homestays', user.uid, 'Guest Details', paymentId);
      await updateDoc(paymentDocRef, {
        'Payment Status': newStatus
      });
      toast.success(`Payment status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !(timestamp instanceof Timestamp)) {
      return 'No Date';
    }
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  const showConfirmationDialog = (paymentId, newStatus) => {
    if (window.confirm(`Are you sure you want to update the payment status to ${newStatus}?`)) {
      handleStatusChange(paymentId, newStatus);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="payment-page-container p-lg-3">
      <style>
        {`
          .payment-page-container {
            
          }
          
          .payment-container {
            width: 100%;
          }
          
          .payment-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 1rem;
          }
          
          .payment-header {
            padding: 1rem;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
          }
          
          .payment-content {
            padding: 1.5rem;
          }
          
          .payment-field {
            margin-bottom: 1rem;
          }
          
          .payment-label {
            font-weight: 500;
            margin-bottom: 0.5rem;
            display: block;
          }
          
          .payment-value {
            font-size: 1.1rem;
          }
          
          .save-button {
            background: #003B94;
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
            transition: background-color 0.2s;
          }
          
          .save-button:hover {
            background: #e60000;
          }
          
          .status-select {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 1rem;
          }
          
          @media (max-width: 768px) {
            .payment-page-container {
              margin-left: 0;
              margin-top: 0;
              max-width: 100%;
              padding: 1rem;
            }
            
            .payment-card {
              border-radius: 0;
            }
          }
            .card-divider {
            border: 0;
            border-top: 1px solid #ccc;
            margin: 0;
          }
        `}
      </style>

      <div className="container-fluid p-0">
        <div className="row g-0">
          <div className="col-12">
            <h2 className="mb-4">Payment Details</h2>
            {payments.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-3 shadow-sm p-5">
                <div className="mb-4 d-inline-block" style={{ width: '300px', maxWidth: '100%' }}>
                  <img
                    src={paymentImage}
                    alt="No Payments"
                    style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                  />
                </div>
                <h4 className="fw-bold text-dark mb-3">No Pending Payments</h4>
                <p className="text-muted">All payments have been processed successfully.</p>
              </div>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="payment-card card">
                  <div className="payment-header card-body">
                    <h3 className="mb-0">Guest Name: {payment['Full Name']}</h3>
                  </div>
                  {/* Horizontal line between header and body */}
                  <hr className="card-divider" />
                  <div className="payment-content">
                    <div className="payment-field">
                      <span className="payment-label">Reservation Date:</span>
                      <span className="payment-value">{formatDate(payment['Check-In Date'])}</span>
                    </div>
                    <div className="payment-field">
                      <span className="payment-label">Contact Details:</span>
                      <span className="payment-value">{payment['Phone Number']}</span>
                    </div>
                    <div className="payment-field">
                      <span className="payment-label">Total Price:</span>
                      <span className="payment-value">{payment['Total Price']}</span>
                    </div>
                    <div className="payment-field">
                      <span className="payment-label">Payment Method:</span>
                      <span className="payment-value">{payment['Payment Method']}</span>
                    </div>
                    <div className="payment-field">
                      <span className="payment-label">Payment Status:</span>
                      <select
                        className="status-select"
                        value={payment['Payment Status']}
                        onChange={(e) => showConfirmationDialog(payment.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    <button
                      className="save-button mt-3"
                      onClick={() => showConfirmationDialog(payment.id, payment['Payment Status'])}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

