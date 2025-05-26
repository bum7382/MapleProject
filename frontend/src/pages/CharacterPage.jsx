// src/pages/CharacterPage.jsx
import React, { useEffect, useState } from "react";
import CharacterSelect from "../components/CharacterSelect";
import axios from "axios";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useToast } from "../utils/toastContext.jsx";

const API_BASE = import.meta.env.VITE_BACKEND_URL;  // 백엔드 주소 (.env)

export default function CharacterPage({ user: mongoUser }) {
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase 인증 유저
  const [characters, setCharacters] = useState([]); // MongoDB에서 가져온 캐릭터 목록
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 캐릭터 조회 함수 (Firebase 토큰 기반)
  const fetchCharacters = async (fbUser) => {
    try {
      const token = await fbUser.getIdToken();

      const res = await axios.get(`${API_BASE}/api/character`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (Array.isArray(res.data)) {
        setCharacters(res.data);
      } else {
        throw new Error("서버 응답 형식 오류");
      }
    } catch (err) {
      console.error("❌ 캐릭터 불러오기 실패:", err);
      showToast("❌ 인증 실패 또는 서버 오류", "error");
      setCharacters([]); // 실패 시 초기화
    }
  };

  // Firebase 로그인 감지 및 캐릭터 조회
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        console.warn("❗ Firebase 유저 없음. 리디렉션");
        navigate("/");
        return;
      }

      setFirebaseUser(fbUser);
      fetchCharacters(fbUser);
    });

    return () => unsubscribe();
  }, [navigate]);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");
      localStorage.removeItem("selectedCharacter");
      navigate("/");
    } catch (err) {
      console.error("❌ 로그아웃 실패:", err);
      showToast("❌ 로그아웃 실패", "error");
    }
  };

  return (
    <div
      className="relative w-screen h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/images/background.png)' }}
    >
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 px-4 font-morris py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded shadow-md"
      >
        로그아웃
      </button>

      {firebaseUser && (
        <CharacterSelect
          characters={characters}
          setCharacters={setCharacters}
          userId={mongoUser?._id} // MongoDB 유저 ID
          user={firebaseUser} // Firebase 유저 (getIdToken() 가능)
        />
      )}
    </div>
  );
}
