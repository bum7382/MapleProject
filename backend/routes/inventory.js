// backend/routes/inventory.js
import express from "express";
import Inventory from "../models/Inventory.js";

const router = express.Router();

// 유저 인벤토리에 아이템 저장
router.post("/:userId", async (req, res) => {
  const { userId } = req.params;
  const item = req.body;

  // ✅ 기본 유효성 검사
  if (!item || !item.item_name || !item.uuid) {
    return res.status(400).json({ message: "필수 정보가 누락되었습니다." });
  }

  try {
    // DB에 새 아이템 저장
    const newItem = await Inventory.create({ userId, ...item });
    res.status(201).json(newItem);
  } catch (error) {
    console.error("❌ 인벤토리 저장 실패:", error);
    res.status(500).json({ message: "서버 오류로 저장에 실패했습니다." }); // 내부 서버 에러
  }
});

// 유저 인벤토리 불러오기
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    // 해당 유저의 아이템 전체 조회
    const items = await Inventory.find({ userId });
    res.json(items);
  } catch (error) {
    console.error("❌ 인벤토리 불러오기 실패:", error);
    res.status(500).json({ message: "서버 오류로 불러오기에 실패했습니다." });
  }
});

// 인벤토리에서 특정 아이템 삭제
router.delete("/:userId/:uuid", async (req, res) => {
  const { userId, uuid } = req.params;

  try {
    const result = await Inventory.deleteOne({ userId, uuid });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "해당 아이템을 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "삭제 완료" });
  } catch (error) {
    console.error("❌ 인벤토리 삭제 실패:", error.message);
    res.status(500).json({ message: "서버 오류로 삭제에 실패했습니다." });
  }
});

export default router;
