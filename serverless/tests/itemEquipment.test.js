// serverless/tests/itemEqipment.test.js
import { describe, it, expect, vi, afterEach } from 'vitest';
import handler from '../api/itemEquipment.js';

global.fetch = vi.fn();

describe('itemEquipment handler', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('정상적으로 장비 정보 반환', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ equipment: [/* ... */] })
    });

    const req = { query: { ocid: 'ocid-123' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ equipment: expect.any(Array) })
    );
  });

  it('ocid 없이 호출 시 400 반환', async () => {
    const req = { query: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it('API 호출 실패 시 500 반환', async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    const req = { query: { ocid: 'ocid-123' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });
});
