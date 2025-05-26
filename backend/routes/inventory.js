import express from "express";
import Inventory from "../models/Inventory.js"; // 반드시 .js 확장자 필요

const router = express.Router();

// POST: 장비 저장
router.post("/:userId", async (req, res) => {
  const { userId } = req.params;
  const item = req.body;

  try {
    const newItem = await Inventory.create({ userId, ...item });
    res.status(201).json(newItem);
  } catch (error) {
    console.error("❌ 인벤토리 저장 실패:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// GET: 유저 인벤토리 불러오기
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const items = await Inventory.find({ userId });
    res.json(items);
  } catch (error) {
    console.error("❌ 인벤토리 불러오기 실패:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// DELETE: 인벤토리에서 아이템 삭제
router.delete("/:userId/:uuid", async (req, res) => {
  const { userId, uuid } = req.params;
  try {
    await Inventory.deleteOne({ userId, uuid });
    res.json({ message: "삭제 완료" });
  } catch (error) {
    console.error("❌ 인벤토리 삭제 실패:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
