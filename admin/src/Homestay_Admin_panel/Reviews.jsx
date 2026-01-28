import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Filter, Minus } from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Dropdown } from 'react-bootstrap';
import reviewsImage from '../assets/Reviews.jpg';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      return;
    }

    const reviewsRef = collection(db, 'Homestays', user.uid, 'Reviews');
    const q = query(reviewsRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(reviewsData);
    });

    return () => unsubscribe();
  }, []);

  const calculateOverallRating = (review) => {
    const { amenities, luxury, price, staffReview } = review;
    return ((amenities + luxury + price + staffReview) / 4) * 2;
  };

  const getFilteredReviews = () => {
    switch (filterType) {
      case 'Good':
        return reviews.filter(review => calculateOverallRating(review) >= 7);
      case 'Average':
        return reviews.filter(review => calculateOverallRating(review) === 6);
      case 'Bad':
        return reviews.filter(review => calculateOverallRating(review) <= 4);
      default:
        return reviews;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No Date';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-GB'); // Format as dd/mm/yyyy
  };

  const filteredReviews = getFilteredReviews();

  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <button
      className="btn btn-outline-danger d-flex align-items-center"
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
    >
      <Filter size={24} className="me-2" />
      {children}
    </button>
  ));

  return (
    <div className="guest-details-container p-lg-3">
      <style>
        {`
          .reviews-container {
            width: 100%;
          }
          

          .review-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 1.5rem;
            margin-bottom: 1rem;
          }

          .review-type {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1.2rem;
            margin-bottom: 1rem;
          }

          .review-type.good { color: #4CAF50; }
          .review-type.average { color: #FFA500; }
          .review-type.bad { color: #f44336; }

          .review-info {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .review-field {
            background: #f5f5f5;
            padding: 0.5rem 1rem;
            border-radius: 5px;
          }

          .review-label {
            font-weight: 500;
            margin-bottom: 0.25rem;
            display: block;
          }

          .review-value {
            font-size: 1rem;
          }

          .review-comments {
            margin-top: 1rem;
          }
          
          .dropdown-item.active, .dropdown-item:active {
            background-color: #003B94;
            color: white;
          }
          
          @media (max-width: 1024px) {
            .guest-details-container {
              margin-left: 0;
              max-width: 100%;
              padding: 60px 1rem 1rem;
            }
            
            .reviews-header {
              margin: 0;
            }
          }
          
          @media (max-width: 768px) {
            .review-card {
              border-radius: 0;
            }
            
            .review-info {
              grid-template-columns: 1fr;
            }
          }
          .reviews-header {
            margin: 0;
          }
        `}
      </style>

      <div className="container-fluid p-0">
        <div className="row g-0">
          <div className="col-12">
            {reviews.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-3 shadow-sm p-5">
                <div className="mb-4 d-inline-block" style={{ width: '300px', maxWidth: '100%' }}>
                  <img
                    src={reviewsImage}
                    alt="No Reviews"
                    style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                  />
                </div>
                <h4 className="fw-bold text-dark mb-3">No Reviews Yet</h4>
                <p className="text-muted">Your guests haven't left any reviews yet.</p>
              </div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center">
                    <img src={reviewsImage} alt="Reviews" style={{ width: '40px', height: '40px', marginRight: '10px' }} />
                    <h3 className="reviews-header">All Reviews</h3>
                  </div>
                  <Dropdown align="end">
                    <Dropdown.Toggle as={CustomToggle} id="dropdown-filter">
                      Filter
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      {['All', 'Good', 'Average', 'Bad'].map(type => (
                        <Dropdown.Item
                          key={type}
                          onClick={() => setFilterType(type)}
                          active={filterType === type}
                        >
                          {type}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                {filteredReviews.map(review => {
                  const overallRating = calculateOverallRating(review);
                  let reviewType, ReviewIcon;
                  if (overallRating >= 7) {
                    reviewType = 'good';
                    ReviewIcon = ThumbsUp;
                  } else if (overallRating === 6) {
                    reviewType = 'average';
                    ReviewIcon = Minus;
                  } else {
                    reviewType = 'bad';
                    ReviewIcon = ThumbsDown;
                  }

                  return (
                    <div key={review.id} className="review-card">
                      <div className={`review-type ${reviewType}`}>
                        <ReviewIcon size={24} />
                        <span>{reviewType.charAt(0).toUpperCase() + reviewType.slice(1)}</span>
                      </div>

                      <div className="review-info">
                        <div className="review-field">
                          <span className="review-label">Guest Name</span>
                          <div className="review-value">{review.username || 'Anonymous'}</div>
                        </div>

                        <div className="review-field">
                          <span className="review-label">Review Date</span>
                          <div className="review-value">{formatDate(review.timestamp)}</div>
                        </div>

                        <div className="review-field">
                          <span className="review-label">Rating</span>
                          <div className="review-value">{overallRating.toFixed(1)}</div>
                        </div>
                      </div>

                      <div className="review-comments">
                        <span className="review-label">Comments</span>
                        <div className="review-field">
                          {review.comments || 'No comments'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;

