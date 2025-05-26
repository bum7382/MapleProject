// backend/routes/character.js
import express from "express";
import Character from "../models/Character.js";
import mongoose from "mongoose";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// 🔐 캐릭터 저장 (인증 필요)
router.post("/", verifyToken, async (req, res) => {
  const userId = req.user.uid;
  const { name, level, image } = req.body;

  if (!name || !level || !image) {
    return res.status(400).json({ message: "필수 값 누락" });
  }

  try {
    const existing = await Character.findOne({ userId, name });
    if (existing) {
      return res.status(409).json({ message: "이미 존재하는 캐릭터입니다." });
    }

    const newChar = new Character({ userId, name, level, image });
    await newChar.save();
    res.status(201).json(newChar);
  } catch (err) {
    console.error("❌ 캐릭터 저장 실패:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🔐 캐릭터 불러오기 (인증 필요)
router.get("/", verifyToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    console.log("👉 요청된 userId:", userId);
    const characters = await Character.find({ userId });
    console.log("🔍 조회된 캐릭터:", characters);
    res.status(200).json(characters);
  } catch (err) {
    console.error("❌ 캐릭터 불러오기 실패:", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

// 🔐 캐릭터 삭제 (인증 필요)
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;

  try {
    const objectId = new mongoose.Types.ObjectId(id);
    const character = await Character.findById(objectId);

    if (!character) {
      return res.status(404).json({ message: "캐릭터를 찾을 수 없습니다." });
    }

    if (character.userId !== userId) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    await Character.findByIdAndDelete(objectId);
    res.status(200).json({ message: "삭제 성공" });
  } catch (err) {
    console.error("❌ 캐릭터 삭제 실패:", err);
    res.status(500).json({ message: "서버 에러" });
  }
});

export default router;
