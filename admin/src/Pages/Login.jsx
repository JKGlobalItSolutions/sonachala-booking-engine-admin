import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { adminAuth, adminDB } from "../firebase.admin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/auth.css";
import { BsEyeFill, BsEyeSlashFill } from "react-icons/bs";
import { useAuth } from "../auth/AuthContext";
import { FcGoogle } from "react-icons/fc";
import logo from "../Images/Logo/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

function Login() {
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
      const userCredential = await signInWithEmailAndPassword(
        adminAuth,
        email,
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        toast.error("Please verify your email before logging in.");
        await signOut(adminAuth);
        return;
      }

      // Check if user has a hotel or homestay property
      const homestayDocRef = doc(adminDB, "Homestays", user.uid);
      const hotelDocRef = doc(adminDB, "Hotels", user.uid);

      const [homestayDocSnap, hotelDocSnap] = await Promise.all([
        getDoc(homestayDocRef),
        getDoc(hotelDocRef),
      ]);

      if (homestayDocSnap.exists()) {
        localStorage.setItem('adminType', 'homestay');
        localStorage.setItem('isLoggedIn', 'true');
        navigate("/homestay-RoomStatus");
        toast.success("Login successful!");
      } else if (hotelDocSnap.exists()) {
        localStorage.setItem('adminType', 'hotel');
        localStorage.setItem('isLoggedIn', 'true');
        navigate("/hotel-RoomStatus");
        toast.success("Login successful!");
      } else {
        await signOut(adminAuth);
        toast.error("No property found. Please register your property first.");
        return;
      }
    } catch (error) {
      console.error("Failed to sign in with email and password:", error);
      if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Invalid password. Please try again.");
      } else if (error.code === "auth/user-disabled") {
        toast.error("Account disabled. Contact support.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email format.");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many failed attempts. Try again later.");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(adminAuth, email);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email.");
      } else {
        toast.error("Failed to send reset email. Try again.");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const adminType = await signInWithGoogle();
      if (adminType === 'homestay') {
        localStorage.setItem('adminType', 'homestay');
        localStorage.setItem('isLoggedIn', 'true');
        navigate("/homestay-RoomStatus");
      } else if (adminType === 'hotel') {
        localStorage.setItem('adminType', 'hotel');
        localStorage.setItem('isLoggedIn', 'true');
        navigate("/hotel-RoomStatus");
      }
      toast.success("Google sign-in successful!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <section className="containerr forms">

      <div className="position-absolute top-0 start-0 m-3">
        <Link to="https://sonachala-user.netlify.app/" className="btn bg-white text-dark">
          <i className="fas fa-arrow-left me-2"></i> Back to Home
        </Link>
      </div>

      <div className="logo-container">
        <img src={logo} alt="sonachla Logo" className="logo" />
      </div>
      <div className="form login">
        <div className="form-content">
          <header>Login</header>
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

            <button type="button" onClick={handleForgotPassword}>
              Forgot Password?
            </button>


            <div className="field button-field  bg-success">
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          <div className="line"></div>
          <div className="media-options">
            <button onClick={handleGoogleSignIn} className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center" style={{ borderColor: "#198754", color: "#198754", backgroundColor: "#198754" }}>
              <FcGoogle className="me-2 m-1" />
              <span style={{ color: "white" }}>Login with Google</span>
            </button>
          </div>


          <div className="form-link">
            <span>
              List Your Property <Link to="/register">Register Now</Link>
            </span>
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

export default Login;
