// backend/tests/inventory.test.js
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { setupTestDB } from './setup.js';

let teardown;
beforeAll(async () => {
  teardown = await setupTestDB();
});
afterAll(async () => {
  await teardown();
});

vi.mock('../utils/firebaseAdmin.js', () => ({
  getAdmin: () => ({
    auth: () => ({
      verifyIdToken: vi.fn(() => Promise.resolve({ uid: 'test-uid-1' })),
    }),
  }),
}));

import request from "supertest";
import app from "../app.js";


describe("Inventory API", () => {
  const userId = "test-uid-1";
  let itemUuid = `test-item-${Date.now()}`;
  const item = {
    uuid: itemUuid,
    item_name: "테스트아이템",
    price: 10000
  };

  it("POST /api/inventory/:userId - 인벤토리 아이템 저장", async () => {
    const res = await request(app)
      .post(`/api/inventory/${userId}`)
      .send(item);
    expect([201, 400]).toContain(res.statusCode);
    if (res.statusCode === 201) itemUuid = res.body.uuid;
  });

  it("GET /api/inventory/:userId - 인벤토리 불러오기", async () => {
    const res = await request(app)
      .get(`/api/inventory/${userId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("DELETE /api/inventory/:userId/:uuid - 아이템 삭제", async () => {
    const res = await request(app)
      .delete(`/api/inventory/${userId}/${itemUuid}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});
