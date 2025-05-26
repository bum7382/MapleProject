// backend/middleware/auth.js
import admin from "../utils/firebaseAdmin.js";

// Firebase 인증 토큰 검사
export async function verifyToken(req, res, next) {
  // 클라이언트 요청의 Authorization 헤더 확인
  const authHeader = req.headers.authorization;

  // 헤더가 없거나 Bearer 형식이 아니면 인증 실패
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "인증 토큰이 없습니다." });
  }
  
  // 'Bearer [토큰]' 에서 실제 토큰 부분만 추출
  const token = authHeader.split(" ")[1];

  try {
    // Firebase Admin SDK로 토큰 검증
    const decoded = await admin.auth().verifyIdToken(token);
    // 검증된 유저 정보(req.user.uid 등)를 다음 라우터에서 사용 가능하게 설정
    req.user = decoded;
    next();
  } catch (err) {
    // 인증 실패 (토큰 만료, 위조 등)
    console.error("❌ 토큰 검증 실패:", err);
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
}
