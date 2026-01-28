import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/auth.css";
import { BsEyeFill, BsEyeSlashFill } from "react-icons/bs";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const checkAdminExistsInOtherProperties = async (adminId) => {
    const propertyTypes = ["Hotels", "Homestays"];
    for (const property of propertyTypes) {
      if (property !== propertyType) {
        const q = query(
          collection(db, property),
          where("adminId", "==", adminId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          return true;
        }
      }
    }
    return false;
  };

  const saveSelection = async (user) => {
    try {
      await setDoc(doc(db, propertyType, user.uid), {
        adminId: email,
        propertyType: propertyType,
      });
      await setDoc(doc(db, 'admins', email), {
        role: 'admin',
        propertyType: propertyType,
      });
      console.log("Property and admin role saved for:", email);
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      throw error;
    }
  };

  const saveAdminRole = async () => {
    try {
      await setDoc(doc(db, 'admins', email), {
        role: 'admin',
        propertyType: propertyType,
      });
      console.log("Admin role saved for:", email);
    } catch (error) {
      console.error("Error saving admin role:", error);
      throw error;
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setIsLoading(true);

  //   try {
  //     const q = query(
  //       collection(db, propertyType),
  //       where("adminId", "==", email)
  //     );
  //     const querySnapshot = await getDocs(q);

  //     if (!querySnapshot.empty) {
  //       throw new Error("You already signed in with this property.");
  //     }

  //     const userCredential = await signInWithEmailAndPassword(
  //       auth,
  //       email,
  //       password
  //     );
  //     const user = userCredential.user;

  //     const adminExists = await checkAdminExistsInOtherProperties(email);
  //     if (adminExists) {
  //       throw new Error(
  //         "Admin already registered with a different property type."
  //       );
  //     }

  //     await saveSelection(user);

  //     toast.success("Registration successful!");
  //     navigate(
  //       propertyType === "Homestays" ? "/homestay-admin" : "/hotel-admin"
  //     );
  //   } catch (error) {
  //     if (error.code === "auth/user-not-found") {
  //       try {
  //         const userCredential = await createUserWithEmailAndPassword(
  //           auth,
  //           email,
  //           password
  //         );
  //         const user = userCredential.user;
  //         await saveSelection(user);
  //         toast.success("Registration successful!");
  //         navigate(
  //           propertyType === "Homestays" ? "/homestay-admin" : "/hotel-admin"
  //         );
  //       } catch (createError) {
  //         toast.error(createError.message);
  //       }
  //     } else {
  //       toast.error(error.message);
  //     }
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };




const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  if (!email || !password || !propertyType) {
    toast.error("Please fill all fields.");
    setIsLoading(false);
    return;
  }

  try {
    // Step 1: Check if this admin already exists in the selected property
    const q = query(collection(db, propertyType), where("adminId", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error("Admin already registered with this property.");
    }

    // Step 2: Check if admin exists in other property
    const adminExists = await checkAdminExistsInOtherProperties(email);
    if (adminExists) {
      throw new Error("Admin already exists in a different property.");
    }

    // Step 3: Create a new Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step 4: Save to Firestore
    await saveSelection(user);

    toast.success("Registration successful!");
    navigate(propertyType === "Homestays" ? "/homestay-admin" : "/hotel-admin");
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      toast.error("Email already exists. Please login instead.");
    } else {
      toast.error(error.message);
    }
  } finally {
    setIsLoading(false);
  }
};





  return (
    <section className="containerr forms mb-5">
      <div className="logo-container  pt-5">
        <img src="/Logo/logo.png" alt="Sonachala Logo" className="logo  " />
      </div>
      <div className="form login ">
        <div className="form-content">
          <header>Signup</header>
          <form onSubmit={handleSubmit}>
            <div className="field input-field">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select Your property type
                </option>
                <option value="Homestays">Homestay</option>
                <option value="Hotels">Hotel</option>
              </select>
            </div>

            <div className="field input-field">
              <input
                type="email"
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

            <div className="field button-field">
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Go to Admin Profile"}
              </button>
            </div>
          </form>

          <div className="form-link">
            <span>
              Already have an account? <Link to="/login">Login</Link>
            </span>
          </div>

          <div className="align-item-center">
            <p style={{ textAlign: "center", marginTop: "5px" }}>
              * Call Our Admin To Verify Your Property <br />
              After That We Provide Your AdminId And Password*
            </p>
          </div>

          <div className="fieldd button-fieldd">
            <a href="tel:8148911901">
              <button type="button">Contact Admin</button>
            </a>
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

export default Register;












// import React, { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
// } from "firebase/auth";
// import {
//   doc,
//   setDoc,
//   collection,
//   query,
//   where,
//   getDocs,
// } from "firebase/firestore";
// import { auth, db } from "../firebase/config";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import "../styles/auth.css";
// import { BsEyeFill, BsEyeSlashFill } from "react-icons/bs";

// function Register() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [propertyType, setPropertyType] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();

//   const checkAdminExistsInOtherProperties = async (adminId) => {
//     const propertyTypes = ["Hotels", "Homestays"];
//     for (const property of propertyTypes) {
//       if (property !== propertyType) {
//         const q = query(
//           collection(db, property),
//           where("adminId", "==", adminId)
//         );
//         const querySnapshot = await getDocs(q);
//         if (!querySnapshot.empty) {
//           return true;
//         }
//       }
//     }
//     return false;
//   };

//   const saveSelection = async (user) => {
//     await setDoc(doc(db, propertyType, user.uid), {
//       adminId: email,
//       propertyType: propertyType,
//     });
//     console.log("Property saved:", propertyType);
//   };

//   const getFriendlyError = (code) => {
//     switch (code) {
//       case "auth/user-not-found":
//         return "User not found. Creating new account...";
//       case "auth/invalid-email":
//         return "Invalid email format.";
//       case "auth/wrong-password":
//         return "Incorrect password.";
//       case "auth/email-already-in-use":
//         return "Email already registered.";
//       case "auth/weak-password":
//         return "Password should be at least 6 characters.";
//       default:
//         return "An unexpected error occurred.";
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!propertyType) {
//       toast.error("Please select your property type.");
//       return;
//     }

//     if (!email || !password) {
//       toast.error("Email and password are required.");
//       return;
//     }

//     if (!email.includes("@")) {
//       toast.error("Please enter a valid email address.");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const q = query(
//         collection(db, propertyType),
//         where("adminId", "==", email)
//       );
//       const querySnapshot = await getDocs(q);

//       if (!querySnapshot.empty) {
//         throw new Error("You already signed in with this property.");
//       }

//       const userCredential = await signInWithEmailAndPassword(
//         auth,
//         email,
//         password
//       );
//       const user = userCredential.user;

//       const adminExists = await checkAdminExistsInOtherProperties(email);
//       if (adminExists) {
//         throw new Error(
//           "Admin already registered with a different property type."
//         );
//       }

//       await saveSelection(user);

//       toast.success("Registration successful!");
//       navigate(
//         propertyType === "Homestays" ? "/homestay-admin" : "/hotel-admin"
//       );
//     } catch (error) {
//       if (error.code === "auth/user-not-found") {
//         try {
//           const userCredential = await createUserWithEmailAndPassword(
//             auth,
//             email,
//             password
//           );
//           const user = userCredential.user;
//           await saveSelection(user);
//           toast.success("Registration successful!");
//           navigate(
//             propertyType === "Homestays" ? "/homestay-admin" : "/hotel-admin"
//           );
//         } catch (createError) {
//           toast.error(getFriendlyError(createError.code));
//         }
//       } else {
//         toast.error(getFriendlyError(error.code || error.message));
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <section className="containerr forms mb-5">
//       <div className="logo-container pt-5">
//         <img src="/Logo/logo.png" alt="Y-spot Logo" className="logo" />
//       </div>

//       <div className="form login">
//         <div className="form-content">
//           <header>Signup</header>
//           <form onSubmit={handleSubmit}>
//             <div className="field input-field">
//               <select
//                 value={propertyType}
//                 onChange={(e) => setPropertyType(e.target.value)}
//                 required
//               >
//                 <option value="" disabled>
//                   Select Your Property Type
//                 </option>
//                 <option value="Homestays">Homestay</option>
//                 <option value="Hotels">Hotel</option>
//               </select>
//             </div>

//             <div className="field input-field">
//               <input
//                 type="email"
//                 placeholder="Email"
//                 className="input"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="field input-field">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 placeholder="Password"
//                 className="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//               <button
//                 type="button"
//                 className="eye-icon"
//                 onClick={() => setShowPassword(!showPassword)}
//                 aria-label="Toggle Password Visibility"
//               >
//                 {showPassword ? <BsEyeSlashFill /> : <BsEyeFill />}
//               </button>
//             </div>

//             <div className="field button-field">
//               <button type="submit" disabled={isLoading}>
//                 {isLoading ? "Processing..." : "Go to Admin Profile"}
//               </button>
//             </div>
//           </form>

//           <div className="form-link">
//             <span>
//               Already have an account? <Link to="/login">Login</Link>
//             </span>
//           </div>

//           <div className="align-item-center">
//             <p style={{ textAlign: "center", marginTop: "5px" }}>
//               * Call Our Admin To Verify Your Property <br />
//               After That We Provide Your AdminId And Password *
//             </p>
//           </div>

//           <div className="fieldd button-fieldd">
//             <button
//               type="button"
//               onClick={() => (window.location.href = "tel:8148911901")}
//             >
//               Contact Admin
//             </button>
//           </div>
//         </div>
//       </div>

//       {isLoading && (
//         <div className="loading-overlay">
//           <div className="loading-spinner"></div>
//         </div>
//       )}

//       <ToastContainer position="top-center" />
//     </section>
//   );
// }

// export default Register;
