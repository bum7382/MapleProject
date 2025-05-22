import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import SearchModal from "../components/SearchModal";
import axios from "axios";
import { useToast } from "../utils/toastContext"; // ✅ 전역 토스트

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export default function IntroPage({ setUser }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const { showToast } = useToast(); // ✅ 전역 토스트 훅 사용
  const navigate = useNavigate();

  const [mongoUser, setMongoUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser); // ✅ Firebase 유저 저장

        try {
          const token = await fbUser.getIdToken();
          const res = await axios.get(`${API_BASE}/api/user/firebase/${fbUser.uid}`,{
            headers: {
              Authorization: `Bearer ${token}`, // ✅ 인증 헤더 추가
            },
        });
          setMongoUser(res.data); // ✅ Mongo 유저 저장
          localStorage.setItem("user", JSON.stringify(res.data));
          navigate("/character", { replace: true });
        } catch (err) {
          console.error("❌ Mongo 유저 복원 실패", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);


  return (
    <div
      className="relative w-screen h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/images/background.png)' }}
    >
      <div className="flex flex-col items-center mb-10">
        <img
          src="/images/logo.png"
          alt="메이플 스펙업 효율 계산기"
          className="w-70 h-auto mb-4 drop-shadow-xl"
        />
      </div>

      <div className="flex gap-[100px]">
        <button
          onClick={() => {
            setShowLogin(true);
            setShowSignup(false);
          }}
          className="w-[130px] h-11 font-morris text-white text-lg rounded-full 
                     bg-[#44B7CF] hover:bg-[#369EBC] border-2 border-white shadow-md"
        >
          로그인
        </button>
        <button
          onClick={() => setShowSearchModal(true)}
          className="w-[130px] h-11 font-morris text-white text-lg rounded-full 
                     bg-[#44B7CF] hover:bg-[#369EBC] border-2 border-white shadow-md"
        >
          비로그인
        </button>
      </div>

      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white px-10 py-12 rounded-lg shadow-xl relative w-[500px] min-h-[400px]">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>
            <LoginForm
              onLoginSuccess={async (mongoUser) => {
                showToast("✅ 로그인 성공!", "success");
                setShowLogin(false);
                setUser({
                  mongoUser: res.data,
                  firebaseUser: fbUser,
                });
                localStorage.setItem("user", JSON.stringify(mongoUser));
                navigate("/character", { replace: true });
              }}
            />
            <div className="mt-6 text-center">
              <span className="text-m text-gray-500 font-morris">계정이 없으신가요? </span>
              <button
                onClick={() => {
                  setShowLogin(false);
                  setShowSignup(true);
                }}
                className="text-blue-600 hover:underline font-morris text-s"
              >
                회원가입
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white px-10 py-12 rounded-lg shadow-xl relative w-[500px] min-h-[400px]">
            <button
              onClick={() => setShowSignup(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>
            <SignupForm
              onSignupSuccess={(msg) => {
                const isSuccess = msg.includes("성공");
                showToast(msg, isSuccess ? "success" : "error");
                if (isSuccess) {
                  setShowSignup(false);
                }
              }}
            />
          </div>
        </div>
      )}

      {showSearchModal && (
        <SearchModal
          onClose={() => setShowSearchModal(false)}
          userId={null}
          onSearch={(char) => {
            localStorage.setItem("selectedCharacter", JSON.stringify(char));
            navigate("/main");
          }}
        />
      )}
    </div>
  );
}
