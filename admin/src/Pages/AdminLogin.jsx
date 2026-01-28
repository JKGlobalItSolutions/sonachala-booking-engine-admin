import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { adminAuth, adminDB } from "../firebase.admin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/auth.css";
import { BsEyeFill, BsEyeSlashFill } from "react-icons/bs";
import { useAuth } from "../auth/AdminAuthContext";
import { FcGoogle } from "react-icons/fc";

import logo from "../Images/Logo/logo.png";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(adminAuth, email, password);

      // Check if admin account exists
      const docRef = doc(adminDB, "admins", email);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        await signOut(adminAuth);
        toast.error("Not an Admin account");
        return;
      }

      const adminData = snap.data();
      navigate(`/admin/${adminData.propertyType}/dashboard`);
      toast.success("Login successful!");

    } catch (error) {
      console.error("Login failed:", error);
      if (error.code === "auth/user-not-found") {
        toast.error("Admin account not found");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Invalid password");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many failed attempts");
      } else if (error.code === "auth/user-disabled") {
        toast.error("Account disabled");
      } else {
        toast.error("Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }
    try {
      await sendPasswordResetEmail(adminAuth, email);
      toast.success("Reset email sent!");
    } catch (error) {
      console.error("Reset failed:", error);
      toast.error("Failed to send reset email");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const propertyType = await signInWithGoogle();
      navigate(`/admin/${propertyType}/dashboard`);
      toast.success("Google login successful!");
    } catch (error) {
      console.error("Google sign-in failed:", error);
      toast.error(error.message || "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="containerr forms">
      <div className="position-absolute top-0 start-0 m-3">
        <Link to="/" className="btn bg-white text-dark">
          <i className="fas fa-arrow-left me-2"></i> Back to Home
        </Link>
      </div>

      <div className="logo-container">
        <img src={logo} alt="Sonachala Logo" className="logo" />
      </div>
      <div className="form login">
        <div className="form-content">
          <header>Admin Login</header>
          <form id="login-form" onSubmit={handleSubmit}>
            <div className="field input-field">
              <input
                type="email"
                id="email"
                placeholder="Email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field input-field">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Password"
                className="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <i
                className="bx bx-hide eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <BsEyeSlashFill /> : <BsEyeFill />}
              </i>
            </div>

            <div className="form-link">
              <button type="button" onClick={handleForgotPassword} className="forgot-pass">
                Forgot Password?
              </button>
            </div>

            <div className="field button-field bg-success">
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          <div className="form-link">
            <span>
              Don't have an account? <Link to="/admin/register">Register</Link>
            </span>
          </div>

          <div className="line"></div>

          <div className="media-options">
            <button
              onClick={handleGoogleSignIn}
              className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center"
              style={{ borderColor: "#198754", color: "#198754", backgroundColor: "#198754" }}
              disabled={isLoading}
            >
              <FcGoogle className="me-2 m-1" />
              <span style={{color:"white"}}>Login with Google</span>
            </button>
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      <ToastContainer position="top-center" />
    </section>
  );
}

export default AdminLogin;
