// frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// 페이지 라우트
import IntroPage from "./pages/IntroPage";
import CharacterPage from "./pages/CharacterPage";
import MainPage from "./pages/MainPage";

// Firebase 인증
import { auth } from "./firebase";  
import { onAuthStateChanged } from "firebase/auth";

import axios from "axios";

import { ToastProvider } from "./utils/toastContext.jsx";  // 전역 토스트 컨텍스트
import Loading from "./components/Loading";  // 로딩 컴포넌트

function App() {
  const [user, setUser] = useState(null); // Firebase 인증된 유저 정보
  const [loading, setLoading] = useState(true); // 초기 로딩 상태
  const [showLoading, setShowLoading] = useState(true); // 로딩 화면 표시 여부

  // 앱 최초 로딩 시 → Firebase 로그인 상태 감지

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // 토큰 발급 및 사용자 정보 복원
          const token = await firebaseUser.getIdToken();
          const res = await axios.get(`/api/user/firebase/${firebaseUser.uid}`,{
              headers: {
                Authorization: `Bearer ${token}`, // 백엔드 인증 토큰 포함
              },
          });
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data)); // 웹 스토리지 저장
        } else {
          // ❌ 로그아웃 처리
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch (err) {
        console.error("❌ 자동 로그인 유저 복원 실패", err);
        setUser(null);
      } finally {
        setLoading(false);
        setTimeout(() => setShowLoading(false), 500); // 로딩 화면 0.5초 후 사라짐
      }
    });
    return () => unsubscribe(); // cleanup
  }, []);


  const selectedChar = localStorage.getItem("selectedCharacter");

  // 로딩 중에는 로딩화면 출력
  if (showLoading) return <Loading visible={loading} />;

  return (
    <>
      <ToastProvider>
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
          </Routes>
        </Router>
      </ToastProvider>
      {<Loading visible={loading} />}
    </>
  );
}

export default App;
