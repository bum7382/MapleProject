import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path"; // ✅ 추가
import { fileURLToPath } from "url"; // ✅ ESM용 경로 처리

// 라우터 import
import userRoutes from "./routes/user.js";
import characterRoutes from "./routes/character.js";

dotenv.config();

const app = express();

// ✅ ESM에서 __dirname 대체 코드
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우터 연결
app.use("/api/user", userRoutes);
app.use("/api/character", characterRoutes);


// ✅ 정적 파일 제공 (Vite 빌드 폴더 경로)
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// ✅ 이게 핵심! SPA fallback: 존재하지 않는 경로는 index.html로
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// DB 연결
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB 연결 성공"))
.catch((err) => console.error("❌ MongoDB 연결 실패:", err));

const PORT = 3030;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
