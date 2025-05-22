import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useToast } from "../utils/toastContext.jsx"; // ✅ Toast 훅 추가

export default function LogoutButton({ onLogout }) {
  const { showToast } = useToast(); // ✅ 전역 토스트 사용

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");

      showToast("✅ 로그아웃 완료", "success"); // ✅ 토스트로 대체

      if (onLogout) onLogout();
    } catch (err) {
      showToast("❌ 로그아웃 실패\n" + err.message, "error"); // ✅ 에러 토스트
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white font-morris 
                 py-2 px-6 rounded mt-2"
    >
      로그아웃
    </button>
  );
}
