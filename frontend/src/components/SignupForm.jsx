import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";
import { getFirebaseErrorMessage } from "../utils/firebaseErrors";
import axios from "axios";

export default function SignupForm({ onSignupSuccess, setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedNickname = nickname.trim();

      // ✅ 1. 중복 확인
      const checkRes = await axios.get(
        `/api/user/check-user?email=${trimmedEmail}&nickname=${trimmedNickname}`
      );
      const { emailExists, nicknameExists } = checkRes.data;

      if (nicknameExists) {
        onSignupSuccess?.("❌ 이미 존재하는 닉네임입니다.");
        return;
      }
      if (emailExists) {
        onSignupSuccess?.("❌ 이미 등록된 이메일입니다.");
        return;
      }

      // ✅ 2. Firebase 계정 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );
      const user = userCredential.user;

      // ✅ 3. Firebase 프로필에 닉네임 저장
      await updateProfile(user, { displayName: trimmedNickname });

      // ✅ 4. Firebase 토큰 받아서 MongoDB 등록
      const token = await user.getIdToken();

      const res = await axios.post(
        "/api/user",
        {
          uid: user.uid, // Firebase에서 발급받은 UID
          nickname: trimmedNickname,
          email: trimmedEmail
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ✅ 5. 결과 저장
      const mongoUser = res.data;
      localStorage.setItem("user", JSON.stringify(mongoUser));
      setUser?.(mongoUser);
      onSignupSuccess?.("✅ 회원가입 성공!");
    } catch (err) {
      const firebaseMsg = getFirebaseErrorMessage(err);
      const serverMsg = err.response?.data?.message;
      onSignupSuccess?.(`❌ ${serverMsg || firebaseMsg}`);
    }
  };


  return (
    <form
      onSubmit={handleSignup}
      className="flex flex-col gap-4 w-full items-center text-center"
    >
      <h2 className="text-2xl font-morris text-black">회원가입</h2>

      <input
        type="text"
        placeholder="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        required
        className="w-3/4 px-4 py-2 border border-gray-300 rounded 
                   focus:outline-none focus:ring-2 focus:ring-blue-400 font-morris"
      />

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
        가입하기
      </button>
    </form>
  );
}
