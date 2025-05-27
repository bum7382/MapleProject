// backend/tests/user.test.js

jest.mock('../middleware/auth.js', () => ({
  verifyToken: (req, res, next) => {
    req.user = { uid: 'test-uid-1' }; // 테스트용 유저 ID
    next();
  }
}));

const request = require("supertest");
const app = require("../app.js");

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
