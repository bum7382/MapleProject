// backend/tests/user.test.js
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { setupTestDB } from './setup.js';

let teardown;
beforeAll(async () => {
  teardown = await setupTestDB();
});
afterAll(async () => {
  await teardown();
});


vi.mock('../middleware/auth.js', () => ({
  verifyToken: (req, res, next) => {
    req.user = { uid: 'test-uid-1' };
    next();
  }
}));

vi.mock('../utils/firebaseAdmin.js', () => ({
  getAdmin: () => ({
    auth: () => ({
      verifyIdToken: vi.fn(() => Promise.resolve({ uid: 'test-uid-1' })),
    }),
  }),
}));


import request from "supertest";
import app from "../app.js";

describe("User API", () => {
  const userData = {
    uid: "test-uid-1",
    nickname: "테스트유저",
    email: "test1@example.com"
  };

  it("POST /api/user - 새 유저 등록", async () => {
    const res = await request(app).post("/api/user").send(userData);
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.uid).toBe(userData.uid);
    expect(res.body.nickname).toBe(userData.nickname);
  });

  it("GET /api/user/check-user - 이메일, 닉네임 중복확인", async () => {
    const res = await request(app)
      .get("/api/user/check-user")
      .query({ email: userData.email, nickname: userData.nickname });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("emailExists");
    expect(res.body).toHaveProperty("nicknameExists");
  });

  it("GET /api/user/firebase/:uid - 유저 자동 로그인 복원", async () => {
    const res = await request(app)
      .get(`/api/user/firebase/${userData.uid}`)
      .set("Authorization", "Bearer test-token");
    expect([200, 403, 401, 404]).toContain(res.statusCode);
  });
});
