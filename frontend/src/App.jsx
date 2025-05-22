// frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import IntroPage from "./pages/IntroPage";
import CharacterPage from "./pages/CharacterPage";
import MainPage from "./pages/MainPage";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { ToastProvider } from "./utils/toastContext.jsx"; // ✅ ToastProvider 추가
import EquipmentTest from "./pages/EquipmentTest";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          const res = await axios.get(`/api/user/firebase/${firebaseUser.uid}`,{
              headers: {
                Authorization: `Bearer ${token}`,
              },
          });
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch (err) {
        console.error("❌ 자동 로그인 유저 복원 실패", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const selectedChar = localStorage.getItem("selectedCharacter");

  if (loading) return null;

  return (
    <ToastProvider> {/* ✅ 전역 ToastContext 적용 */}
      <Router>
        <Routes>
          <Route path="/" element={<IntroPage setUser={setUser} />} />
          <Route
            path="/character"
            element={user ? <CharacterPage user={user} /> : <Navigate to="/" replace />}
          />
          <Route path="/main" element={<MainPage />} />
          <Route
            path="/start"
            element={selectedChar ? <Navigate to="/main" replace /> : <Navigate to="/character" replace />}
          />
          <Route path="/equipment-test" element={<EquipmentTest />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
