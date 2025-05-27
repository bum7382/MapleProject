// backend/index.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";

dotenv.config();  // .env 파일 로드

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
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중`);
});
