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

      const mongoUser = res.data;
      console.log("✅ Mongo 유저 정보:", mongoUser);

      // ✅ 3. 로컬 스토리지에 저장
      localStorage.setItem("user", JSON.stringify(mongoUser));

      // ✅ 4. 부모 컴포넌트에 유저 정보 전달
      if (onLoginSuccess) onLoginSuccess(mongoUser);

    } catch (err) {
      console.error("🔥 전체 에러 객체:", err);
      console.error("❌ 로그인 후 처리 실패:", err);

      const firebaseError = err.code?.startsWith("auth/");
      const hasResponse = err.response !== undefined;

      if (firebaseError) {
        const msg = getFirebaseErrorMessage(err);
        showToast("❌ " + msg, "error");
      } else if (hasResponse) {
        const msg = err.response.data?.message || "서버 오류가 발생했습니다.";
        showToast("❌ " + msg, "error");
      } else {
        // ✅ 로그인 자체는 성공했는데, 후처리 실패인 경우도 있으니 메시지 바꾸자
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
