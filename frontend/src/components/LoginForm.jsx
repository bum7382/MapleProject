// frontend/src/components/LoginForm.jsx
// 로그인 폼 컴포넌트
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { getFirebaseErrorMessage } from "../utils/firebaseErrors";
import axios from "axios";
import { useToast } from "../utils/toastContext.jsx";

export default function LoginForm({ onLoginSuccess }) {
  // 입력된 이메일, 비밀번호 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { showToast } = useToast();

  const API_BASE = import.meta.env.VITE_BACKEND_URL;  // 백엔드 주소 (환경변수)

  // 로그인 시도
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // 1. Firebase Auth로 로그인
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. 토큰 받아서 서버 인증 요청
      const token = await firebaseUser.getIdToken();
      const res = await axios.post(`${API_BASE}/api/user`,
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          nickname: firebaseUser.displayName || "익명",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const mongoUser = res.data; // 서버에서 받아온 유저 정보

      // 3. 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem("user", JSON.stringify(mongoUser));

      // 4. 부모 컴포넌트에 유저 정보 전달
      if (onLoginSuccess) onLoginSuccess(mongoUser);

    } catch (err) {
      console.error("❌ 로그인 후 처리 실패:", err);

      const firebaseError = err.code?.startsWith("auth/");
      const hasResponse = err.response !== undefined;

      if (firebaseError) {
        const msg = getFirebaseErrorMessage(err);
        showToast("❌ " + msg, "error");
      } 
      else if (hasResponse) {
        const msg = err.response.data?.message || "서버 오류가 발생했습니다.";
        showToast("❌ " + msg, "error");
      } 
      else {
        showToast("❌ 서버 통신에 실패했습니다. 로그인은 완료되었습니다.", "error");
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
