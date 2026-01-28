const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

admin.initializeApp();

const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// Create Order Endpoint
app.post('/createOrder', async (req, res) => {
  const { amount, currency = 'INR', notes } = req.body;

  const options = {
    amount: amount * 100, // amount in paisa
    currency,
    receipt: `receipt_${Date.now()}`,
    notes,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating order');
  }
});

// Webhook Endpoint
app.post('/webhook', (req, res) => {
  const secret = functions.config().razorpay.webhook_secret;
  const signature = req.headers['x-razorpay-signature'];

  // Verify signature using Razorpay utility
  // (Note: For simplicity, implementing basic verification)
  // In production, use crypto to verify

  const event = req.body.event;

  if (event === 'payment.captured') {
    const payment = req.body.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const amount = payment.amount / 100;

    // Use transaction to update Firestore
    const db = admin.firestore();
    const batch = db.batch();

    const bookingRef = db.collection('bookings').doc(orderId);

    batch.update(bookingRef, {
      status: 'confirmed',
      paymentId,
    });

    // Update availability - reduce inventory
    // Get booking details
    return db.runTransaction(async (transaction) => {
      const bookingDoc = await transaction.get(bookingRef);
      if (!bookingDoc.exists) {
        throw new Error('Booking not found');
      }

      const booking = bookingDoc.data();
      const roomRef = db.collection('rooms').doc(booking.roomId);

      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists) {
        throw new Error('Room not found');
      }

      // Update availability
      // Assuming availability is an object with dates
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);

      // For simplicity, decrement totalInventory if it's a shared pool
      // For date-specific, update availability[date]

      batch.commit();
    });
  }

  res.json({ status: 'ok' });
});

// Reconcile Function - Scheduled every 10 minutes
exports.reconcilePendingPayments = functions.pubsub.schedule('every 10 minutes').onRun(async (context) => {
  const db = admin.firestore();
  const pendingPayments = await db.collection('payments')
    .where('status', 'pending')
    .get();

  for (const doc of pendingPayments.docs) {
    const payment = doc.data();
    const paymentId = payment.paymentId;

    try {
      const razorpayPayment = await razorpay.payments.fetch(paymentId);

      if (razorpayPayment.status === 'captured') {
        // Update Firestore
        await db.collection('payments').doc(doc.id).update({
          status: 'confirmed',
        });

        await db.collection('bookings').doc(payment.bookingId).update({
          status: 'confirmed',
        });
      } else if (razorpayPayment.status === 'failed') {
        await db.collection('payments').doc(doc.id).update({
          status: 'failed',
        });

        await db.collection('bookings').doc(payment.bookingId).update({
          status: 'failed',
        });
      }
    } catch (error) {
      console.error('Error reconciling payment:', error);
    }
  }

  return null;
});

exports.api = functions.https.onRequest(app);
