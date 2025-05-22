import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { getFirebaseErrorMessage } from "../utils/firebaseErrors";
import axios from "axios";
import { useToast } from "../utils/toastContext.jsx"; // ✅ Toast 훅 추가

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { showToast } = useToast(); // ✅ 훅 사용

  const API_BASE = import.meta.env.VITE_BACKEND_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("🧨 로그인 버튼 눌림");

    try {
      // ✅ 1. Firebase Auth로 로그인
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log("✅ Firebase 로그인 성공:", firebaseUser);

      // ✅ 2. MongoDB 유저 정보 등록 또는 조회
      const res = await axios.post(`${API_BASE}/api/user`, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        nickname: firebaseUser.displayName || "익명",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ 인증 헤더 추가
        },
      }
    );

      const mongoUser = res.data;
      console.log("✅ Mongo 유저 정보:", mongoUser);

      // ✅ 3. 로컬 스토리지에 저장
      localStorage.setItem("user", JSON.stringify(mongoUser));

      // ✅ 4. 부모 컴포넌트에 유저 정보 전달
      if (onLoginSuccess) onLoginSuccess(mongoUser);

    } catch (err) {
      if (err.code?.startsWith("auth/")) {
        // Firebase 인증 에러
        const msg = getFirebaseErrorMessage(err);
        showToast("❌ " + msg, "error");
      } else if (err.response) {
        // 서버 응답 에러 (예: 400, 500)
        const msg = err.response.data?.message || "서버 오류가 발생했습니다.";
        showToast("❌ " + msg, "error");
      } else {
        // 기타 오류 (네트워크, 알 수 없는 경우)
        showToast("❌ 네트워크 오류가 발생했습니다.", "error");
      }
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="flex flex-col gap-4 w-full items-center text-center"
    >
      <h2 className="text-2xl font-morris text-black">로그인</h2>

      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-3/4 px-4 py-2 border border-gray-300 rounded 
                   focus:outline-none focus:ring-2 focus:ring-blue-400 font-morris"
      />

      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-3/4 px-4 py-2 border border-gray-300 rounded 
                   focus:outline-none focus:ring-2 focus:ring-blue-400 font-morris"
      />

      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white font-morris 
                   py-2 px-6 rounded mt-2"
      >
        로그인하기
      </button>
    </form>
  );
}
