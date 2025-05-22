import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// ✅ POST /api/user → 유저 등록
router.post("/", async (req, res) => {
  try {
    const { uid, nickname, email } = req.body;

    let user = await User.findOne({ uid });
    if (user) {
      return res.status(200).json(user);
    }

    user = new User({ uid, nickname, email });
    await user.save();

    res.status(201).json(user);
  } catch (err) {
    console.error("❌ 유저 저장 실패:", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

// ✅ GET /api/user/firebase/:uid → 자동 로그인 복원용

router.get("/firebase/:uid", verifyToken, async (req, res) => {
  const { uid } = req.params;

  // 🔐 토큰의 uid와 요청 uid가 일치하는지 확인
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

// ✅ 닉네임 중복 확인
router.get("/check-user", async (req, res) => {
  const { email, nickname } = req.query;
  if (!email || !nickname) return res.status(400).json({ error: "email and nickname required" });

  const userByEmail = await User.findOne({ email });
  const userByNickname = await User.findOne({ nickname });
  console.log("nickname check result:", userByNickname);

  return res.json({
    emailExists: !!userByEmail,
    nicknameExists: !!userByNickname,
  });
});

export default router;
