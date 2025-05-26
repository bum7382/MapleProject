// backend/routes/user.js
import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// 새 유저 등록 (최초 로그인 시)
router.post("/", async (req, res) => {
  try {
    const { uid, nickname, email } = req.body;

    // 필수 정보 누락 검사
    if (!uid || !nickname || !email) {
      return res.status(400).json({ error: "uid, nickname, email은 필수입니다." });
    }

    // 이미 등록된 유저라면 그대로 반환
    let user = await User.findOne({ uid });
    if (user) {
      return res.status(200).json(user);
    }

    // 새 유저 등록
    user = new User({ uid, nickname, email });
    await user.save();

    res.status(201).json(user);
  } catch (err) {
    console.error("❌ 유저 저장 실패:", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

// 자동 로그인 복원
router.get("/firebase/:uid", verifyToken, async (req, res) => {
  const { uid } = req.params;

  // 토큰의 uid와 요청 uid가 일치하는지 확인
  if (req.user.uid !== uid) {
    return res.status(403).json({ error: "권한이 없습니다." });
  }

  try {
    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ message: "유저 없음" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ 유저 조회 실패:", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

// 닉네임, 이메일 중복 확인
router.get("/check-user", async (req, res) => {
  const { email, nickname } = req.query;

  // 필수 정보 누락 검사
  if (!email || !nickname) {
    return res.status(400).json({ error: "이메일이나 닉네임은 필수입니다." });
  }

  try {
    const userByEmail = await User.findOne({ email });
    const userByNickname = await User.findOne({ nickname });

    res.json({
      emailExists: !!userByEmail,
      nicknameExists: !!userByNickname,
    });
  } catch (err) {
    console.error("❌ 중복 확인 실패:", err.message);
    res.status(500).json({ error: "서버 에러" });
  }
});

export default router;
