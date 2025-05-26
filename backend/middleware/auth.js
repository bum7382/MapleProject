import admin from "../utils/firebaseAdmin.js";

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("🧪 Authorization Header:", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "인증 토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ 토큰 검증 실패:", err);
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
}
