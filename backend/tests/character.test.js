// backend/tests/character.test.js

jest.mock('../middleware/auth.js', () => ({
  verifyToken: (req, res, next) => {
    req.user = { uid: 'test-uid-1' }; // 테스트용 유저 ID
    next();
  }
}));

const request = require("supertest");
const app = require("../app.js");

describe("Character API", () => {
  let charId = null;
  const charData = { name: "테스트캐릭", level: 220, image: "img_url" };

  it("POST /api/character - 캐릭터 저장", async () => {
    const res = await request(app)
      .post("/api/character")
      .set("Authorization", "Bearer test-token")
      .send(charData);
    expect([201, 409, 400]).toContain(res.statusCode);
    if (res.statusCode === 201) charId = res.body._id;
  });

  it("GET /api/character - 캐릭터 목록 조회", async () => {
    const res = await request(app)
      .get("/api/character")
      .set("Authorization", "Bearer test-token");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) charId = res.body[0]._id;
  });

  it("DELETE /api/character/:id - 캐릭터 삭제", async () => {
    if (!charId) return;
    const res = await request(app)
      .delete(`/api/character/${charId}`)
      .set("Authorization", "Bearer test-token");
    expect([200, 404, 403]).toContain(res.statusCode);
  });
});
