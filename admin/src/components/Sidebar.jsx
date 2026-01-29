import React, { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import usericon from "../Images/Sidebar-icons/person.png"
import roomsicon from "../Images/Sidebar-icons/meeting_room.png"
import locationicon from "../Images/Sidebar-icons/location_home.png"
import rupees from "../Images/Sidebar-icons/currency_rupee.png"
import Reviewicon from "../Images/Sidebar-icons/stars.png"
import RoomstatusIcon from "../Images/Sidebar-icons/concierge.png"
import logo from "../Images/Logo/logo.png"
import logoutIcon from "../Images/Sidebar-icons/logout.png"
/* ... imports ... */
import { X, Building2 } from "lucide-react"

const Sidebar = ({ isOpen, toggle }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { user, logout } = useAuth()
  const [adminType, setAdminType] = useState("")

  const checkAdminType = () => {
    if (user?.adminType) {
      setAdminType(user.adminType)
      return
    }

    const storedAdminType = localStorage.getItem("adminType")
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    if (isLoggedIn === "true" && storedAdminType) {
      setAdminType(storedAdminType)
    } else {
      setAdminType("")
    }
  }

  useEffect(() => {
    checkAdminType()
    window.addEventListener("storage", checkAdminType)
    return () => {
      window.removeEventListener("storage", checkAdminType)
    }
  }, [user]) // Re-run when user changes

  useEffect(() => {
    checkAdminType()
  })

  /* Restoring sidebarStyle */
  const sidebarStyle = `
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 250px;
      background-color: #038A5E;
      color: white;
      padding: 20px;
      overflow-y: auto;
      transition: transform 0.3s ease;
      z-index: 1000;
      /* box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1); removed to match exact original if needed, but original had it in global? No, Step 342 has it blank? wait, Step 342 has explicit CSS */
    }

    .logo img {
      height: 30px;
      margin-right: 10px;
    }

    .sidebar-menu {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .menu-item {
      margin-bottom: 15px;
    }

    .menu-link {
      display: flex;
      align-items: center;
      color: white;
      text-decoration: none;
      padding: 12px 15px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .menu-link:hover {
      background-color: rgba(0, 0, 0, 0.3);
      transform: translateX(5px);
    }

    .menu-link.active {
      background-color: #000000;
      transform: translateX(5px);
    }

    .menu-link img,
    .menu-link i,
    .menu-link svg {
      width: 20px;
      height: 20px;
      margin-right: 15px;
      opacity: 0.9;
    }

    .menu-text {
      white-space: nowrap;
      font-size: 15px;
      letter-spacing: 0.3px;
    }

    .close-button {
      display: none;
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
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
      background-color: #003B94;
      color: white;
    }

    .logout-modal-buttons button:last-child {
      background-color: #ccc;
    }

    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(${isOpen ? "0" : "-100%"});
      }

      .close-button {
        display: block;
      }
    }
  `

  const handleLinkClick = () => {
    if (window.innerWidth <= 1024) {
      toggle()
    }
  }

  const handleLogout = () => {
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

  // Common Listings Item
  const listingsItem = { to: "/admin/listings", text: "My Listings", icon: <Building2 /> };

  const menuItems = adminType === 'hotel' ? [
    { to: "/hotel-RoomStatus", text: "Dashboard", icon: RoomstatusIcon },
    listingsItem,
    { to: "/hotel-Rooms", text: "Rooms", icon: roomsicon },
    { to: "/hotel-GuestDetails", text: "Guests", icon: usericon },
    { to: "/hotel-Page", text: "Property Details", icon: locationicon },
    { to: "/hotel-Payments", text: "Payments", icon: rupees },
    { to: "/hotel-Reviews", text: "Reviews", icon: Reviewicon },
    { to: "/hotel", text: "Profile", icon: usericon },
  ] : adminType === 'homestay' ? [
    { to: "/homestay-RoomStatus", text: "Dashboard", icon: RoomstatusIcon },
    listingsItem,
    { to: "/homestay-Rooms", text: "Rooms", icon: roomsicon },
    { to: "/homestay-GuestDetails", text: "Guests", icon: usericon },
    { to: "/homestay-Page", text: "Property Details", icon: locationicon },
    { to: "/homestay-Payment", text: "Payments", icon: rupees },
    { to: "/homestay-Reviews", text: "Reviews", icon: Reviewicon },
    { to: "/homestay", text: "Profile", icon: usericon },
  ] : [
    listingsItem,
    { to: "/profile", text: "Profile", icon: usericon },
  ];

  return (
    <>
      <style>{sidebarStyle}</style>
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <button className="close-button" onClick={toggle}>
          <X size={24} />
        </button>
        <div className="logo text-center justify-content-center">
          <img className="text-center mb-5" style={{ height: "160px", marginTop: "20px" }} src={logo || "/placeholder.svg"} alt="" />
        </div>
        <ul className="sidebar-menu">
          {menuItems.map((item, index) => (
            <li className="menu-item" key={index}>
              <Link
                to={item.to}
                className={`menu-link ${location.pathname === item.to ? "active" : ""}`}
                onClick={handleLinkClick}
              >
                {typeof item.icon === 'string' ? (
                  <img src={item.icon} alt="" />
                ) : (
                  item.icon
                )}
                <span className="menu-text">{item.text}</span>
              </Link>
            </li>
          ))}

          <li className="menu-item">
            <div className="menu-link" onClick={handleLogout} style={{ cursor: "pointer" }}>
              <img src={logoutIcon || "/placeholder.svg"} alt="" />
              <span className="menu-text">Logout</span>
            </div>
          </li>
        </ul>
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

export default Sidebar
