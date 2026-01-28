import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { toast } from 'react-toastify';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../auth/AuthContext';
import ProfilePlaceholder from '../assets/Profile(1).jpg';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    propertyName: '',
    propertyWebsite: '',
    email: '',
    mobile: '',
    documents: null,
    profileImage: null
  });
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchProfileData = useCallback(async (uid) => {
    try {
      const docRef = doc(db, 'admin profile', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData(prevData => ({
          ...prevData,
          fullName: data['Full Name'] || '',
          propertyName: data['Property Name'] || '',
          propertyWebsite: data['Property Website'] || '',
          email: data['Email Address'] || user?.email || '',
          mobile: data['Mobile Number'] || '',
          profileImage: data['ProfilePicture'] || null
        }));
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data. Please try again.');
    }
  }, [user]);

  const loadAllDocuments = useCallback(async (uid) => {
    const storageRef = ref(storage, `HotelDocuments/${uid}/`);
    try {
      const result = await listAll(storageRef);
      const documentPromises = result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return { name: itemRef.name, url };
      });
      const documentList = await Promise.all(documentPromises);
      setDocuments(documentList);
    } catch (error) {
      console.error('Error listing documents:', error);
      toast.error('Failed to load documents. Please try again.');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setIsLoading(true);
        await fetchProfileData(user.uid);
        await loadAllDocuments(user.uid);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, fetchProfileData, loadAllDocuments]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    if (files[0] && user) {
      setIsUploading(true);
      if (name === 'profileImage') {
        const storageRef = ref(storage, `ProfilePicture/${user.uid}`);
        try {
          await uploadBytes(storageRef, files[0]);
          const downloadURL = await getDownloadURL(storageRef);
          setFormData(prev => ({ ...prev, [name]: downloadURL }));
          await updateProfile(user, { photoURL: downloadURL });
          toast.success('Profile image updated successfully!');
        } catch (error) {
          console.error('Error uploading profile image:', error);
          toast.error('Failed to upload profile image. Please try again.');
        }
      } else if (name === 'documents') {
        const storageRef = ref(storage, `HotelDocuments/${user.uid}/${files[0].name}`);
        try {
          await uploadBytes(storageRef, files[0]);
          const downloadURL = await getDownloadURL(storageRef);
          await setDoc(doc(db, 'admin profile', user.uid), {
            'Hotel Document': {
              url: downloadURL,
              name: files[0].name,
            }
          }, { merge: true });
          await loadAllDocuments(user.uid);
          toast.success('Document uploaded successfully!');
        } catch (error) {
          console.error('Error uploading document:', error);
          toast.error('Failed to upload document. Please try again.');
        }
      }
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user) {
      setIsUploading(true);
      try {
        await setDoc(doc(db, 'admin profile', user.uid), {
          'Full Name': formData.fullName,
          'Property Name': formData.propertyName,
          'Property Website': formData.propertyWebsite,
          'Email Address': formData.email,
          'Mobile Number': formData.mobile,
          'ProfilePicture': formData.profileImage
        }, { merge: true });
        await updateProfile(user, {
          displayName: formData.fullName,
        });
        toast.success('Profile updated successfully!');
      } catch (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile. Please try again.');
      }
      setIsUploading(false);
    }
  };

  const deleteDocument = async (documentName) => {
    if (window.confirm('Are you sure you want to delete this document?') && user) {
      setIsUploading(true);
      const documentRef = ref(storage, `HotelDocuments/${user.uid}/${documentName}`);
      try {
        await deleteObject(documentRef);
        await loadAllDocuments(user.uid);
        toast.success('Document deleted successfully!');
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document. Please try again.');
      }
      setIsUploading(false);
    }
  };

  const removeProfilePicture = async () => {
    if (window.confirm('Are you sure you want to remove your profile picture?') && user) {
      setIsUploading(true);
      try {
        await updateProfile(user, { photoURL: null });
        await setDoc(doc(db, 'admin profile', user.uid), {
          'ProfilePicture': null
        }, { merge: true });
        setFormData(prev => ({ ...prev, profileImage: null }));
        toast.success('Profile picture removed successfully!');
      } catch (error) {
        console.error('Error removing profile picture:', error);
        toast.error('Failed to remove profile picture. Please try again.');
      }
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="user-profile-container">
      <style>
        {`
          .user-profile-container {
            width: 100%;
          }
          .profile-image-container {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            overflow: hidden;
            margin-bottom: 15px;
            border: 2px solid #003B94;
            cursor: pointer;
            position: relative;
          }
          .profile-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .profile-image-actions {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.5);
            padding: 5px;
          }
          .profile-image-action {
            color: white;
            margin: 0 5px;
            cursor: pointer;
          }
        `}
      </style>
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-12">
            <h2 className="mb-4 font-bold text-gray-800">User Profile</h2>
            <div className="card shadow-sm p-lg-3">
              <div className="card-body">
                <div className="text-center mb-4">
                  {/* Decorative Profile Image similar to Rooms page */}
                  <div className="mb-4 d-inline-block" style={{ width: '600px', maxWidth: '100%' }}>
                    <img
                      src={ProfilePlaceholder}
                      alt="Profile Illustration"
                      style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                    />
                  </div>

                  <div className="profile-image-container mx-auto">
                    <img
                      src={formData.profileImage || "https://placehold.co/150x150?text=Profile"}
                      alt="Profile"
                      className="profile-image"
                    />
                    <div className="profile-image-actions">
                      <label className="profile-image-action">
                        <input
                          type="file"
                          name="profileImage"
                          onChange={handleFileChange}
                          className="d-none"
                          accept="image/*"
                        />
                        📷
                      </label>
                      {formData.profileImage && (
                        <span className="profile-image-action" onClick={removeProfilePicture}>
                          🗑️
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label htmlFor="fullName" className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="propertyName" className="form-label">Property Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="propertyName"
                        name="propertyName"
                        value={formData.propertyName}
                        onChange={handleInputChange}
                        placeholder="Enter property name"
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="propertyWebsite" className="form-label">Property Website</label>
                      <input
                        type="url"
                        className="form-control"
                        id="propertyWebsite"
                        name="propertyWebsite"
                        value={formData.propertyWebsite}
                        onChange={handleInputChange}
                        placeholder="https://samplepropertywebsite.com"
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="email" className="form-label">Email address</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="mobile" className="form-label">Mobile number</label>
                      <input
                        type="tel"
                        className="form-control"
                        id="mobile"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        placeholder="000-000-0000"
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="documents" className="form-label">Submit your Property documents</label>
                      <input
                        type="file"
                        className="form-control"
                        id="documents"
                        name="documents"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                      />
                      <ul className="list-unstyled mt-2">
                        {documents.map((doc, index) => (
                          <li key={index} className="d-flex justify-content-between align-items-center mb-2">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                            <button type="button" className="btn btn-danger btn-sm ml-2" onClick={() => deleteDocument(doc.name)}>Delete</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <button type="submit" className="btn btn-primary px-5 me-2" disabled={isUploading}>
                      {isUploading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isUploading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999 }}>
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
