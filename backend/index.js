// backend/index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path"; // 경로 조작용
import { fileURLToPath } from "url"; // ESM에서 __dirname 대체용

// 각 API 라우터 불러오기
import userRoutes from "./routes/user.js";
import characterRoutes from "./routes/character.js";
import inventoryRouter from "./routes/inventory.js";

dotenv.config();  // .env 파일 로드

const app = express();

// ESM 환경에서 __dirname 대체 처리
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// 미들웨어
app.use(cors());  // CORS 허용
app.use(express.json());  // JSON 요청 파싱

// 라우터 연결
app.use("/api/user", userRoutes); // 회원 관련 API
app.use("/api/character", characterRoutes); // 캐릭터 API
app.use("/api/inventory", inventoryRouter); // 인벤토리 API


// 정적 파일 제공 (Vite 빌드 폴더 경로)
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// 프론트 라우팅 지원을 위한 fallback - 항상 index.html 반환
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// MongoDB 연결
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ MongoDB 연결 성공");
} catch (err) {
  console.error("❌ MongoDB 연결 실패:", err);
  process.exit(1); // 실패 시 종료
}

// 서버 실행
const PORT = 3030;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중`);
});
