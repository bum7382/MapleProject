// backend/app.js
import express from "express";
import cors from "cors";
import path from "path"; // 경로 조작용
import { fileURLToPath } from "url"; // ESM에서 __dirname 대체용

// 각 API 라우터 불러오기
import userRoutes from "./routes/user.js";
import characterRoutes from "./routes/character.js";
import inventoryRouter from "./routes/inventory.js";

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


export default app; // ESM 모듈로 내보내기
