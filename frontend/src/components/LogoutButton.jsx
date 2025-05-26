// frontend/src/components/LogoutButton.jsx
// 로그아웃 버튼 컴포넌트
import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useToast } from "../utils/toastContext.jsx";

export default function LogoutButton({ onLogout }) {
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      // Firebase 로그아웃
      await signOut(auth);
      // 로컬 스토리지에서 사용자 정보 제거
      localStorage.removeItem("user");

      showToast("✅ 로그아웃 완료", "success");

      if (onLogout) onLogout();
    } catch (err) {
      showToast("❌ 로그아웃 실패\n" + err.message, "error");
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
