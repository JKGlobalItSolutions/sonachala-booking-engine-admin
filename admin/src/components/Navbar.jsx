import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"

const Navbar = ({ toggleSidebar }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [adminType, setAdminType] = useState("")
  const [profileImage, setProfileImage] = useState(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    const checkAdminType = () => {
      const storedAdminType = localStorage.getItem("adminType")
      const isLoggedIn = localStorage.getItem("isLoggedIn")
      if (isLoggedIn === "true" && storedAdminType) {
        setAdminType(storedAdminType)
      } else {
        setAdminType("")
      }
    }

    const fetchProfileImage = async () => {
      if (user) {
        const docRef = doc(db, "admin profile", user.uid)
        try {
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = docSnap.data()
            setProfileImage(data["ProfilePicture"] || null)
          }
        } catch (error) {
          console.error("Error fetching profile image:", error)
        }
      }
    }

    checkAdminType()
    fetchProfileImage()

    window.addEventListener("storage", checkAdminType)
    return () => {
      window.removeEventListener("storage", checkAdminType)
    }
  }, [user])

  const toggleDropdown = () => setShowDropdown(!showDropdown)

  const [hasNotifications, setHasNotifications] = useState(true)

  const handleGuestDetails = () => {
    setHasNotifications(false) // Optional: Reset notification after clicking the icon
    if (adminType === "hotel") {
      navigate("/hotel-GuestDetails")
    } else if (adminType === "homestay") {
      navigate("/homestay-GuestDetails")
    }
  }

  const handleLogout = () => {
    setShowDropdown(false)
    setShowLogoutModal(true)
  }

  const confirmLogout = async () => {
    await logout()
    setShowLogoutModal(false)
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("adminType")
    setAdminType("")
    navigate("/login")
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  const navbarStyle = `
    .navbar {
      position: fixed;
      left: 0;
      right: 0;
      top: 0;
      height: 60px;
      background-color: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      z-index: 999;
    }

    .navbar-left {
      display: flex;
      align-items: center;
    }

    .menu-toggle {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      font-size: 24px;
      cursor: pointer;
      background-color: #038A5E;
      color: white;
      border: none;
      border-radius: 4px;
    }

    .navbar-right {
      display: flex;
      align-items: center;
    }

    .navbar-item {
      margin-left: 20px;
      cursor: pointer;
    }

    .navbar-item i {
      font-size: 20px;
      color: #333;
    }

    .profile-info {
      display: flex;
      align-items: center;
      position: relative;
    }

    .profile-name {
      margin-right: 10px;
      font-weight: bold;
      color: #333;
    }

    .profile-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background-color: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      display: none;
    }

    .profile-dropdown.show {
      display: block;
    }

    .profile-dropdown-item {
      padding: 5px 15px;
      cursor: pointer;
    }

    .profile-dropdown-item:hover {
      background-color: #038A5E;
      color: #ffffff;
      font:bold;
    }

    .logout-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1001;
    }

    .logout-modal-content {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }

    .logout-modal-buttons {
      margin-top: 20px;
    }

    .logout-modal-buttons button {
      margin: 0 10px;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .logout-modal-buttons button:first-child {
      background-color: #038A5E;
      color: white;
    }

    .logout-modal-buttons button:last-child {
      background-color: #ccc;
    }

    @media (max-width: 768px) {
      .navbar {
        left: 0;
      }
    }
  `

  return (
    <>
      <style>{navbarStyle}</style>
      <div className="navbar">
        <div className="navbar-left">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 6H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 18H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="navbar-right">
          <div className="navbar-item position-relative">
            <i
              className="bi bi-bell"
              onClick={handleGuestDetails}
              style={{ cursor: "pointer", fontSize: "24px" }}
              title="Guest Details"
            ></i>
            {hasNotifications && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ width: "10px", height: "10px", padding: 0, borderRadius: "50%" }}
              ></span>
            )}
          </div>
          <div className="navbar-item profile-info">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  cursor: "pointer",
                }}
                onClick={toggleDropdown}
              />
            ) : (
              <div
                onClick={toggleDropdown}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#038A5E",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "18px",
                  cursor: "pointer",
                  textTransform: "uppercase"
                }}
              >
                {user?.email?.charAt(0) || "U"}
              </div>
            )}
            <div className={`profile-dropdown ${showDropdown ? "show" : ""}`}>
              <div className="profile-dropdown-item" onClick={handleLogout}>
                Logout
              </div>
            </div>
          </div>
        </div>
      </div>
      {showLogoutModal && (
        <div className="logout-modal">
          <div className="logout-modal-content">
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to logout?</p>
            <div className="logout-modal-buttons">
              <button onClick={confirmLogout}>Yes</button>
              <button onClick={cancelLogout}>No</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar

