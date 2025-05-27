// serverless/tests/characterSearch.test.js
import handler from '../api/characterSearch.js';

// fetch mock
global.fetch = jest.fn();

describe('characterSearch handler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('정상 케이스: 닉네임으로 캐릭터 정보/스탯 받아오기', async () => {
    // 1. ID 조회 mock
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ocid: 'ocid-123' })
      })
      // 2. 캐릭터 기본 정보 조회 mock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ character_name: '메이플짱' })
      })
      // 3. 스탯 정보 조회 mock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ final_stat: [{ stat_name: 'STR', value: 999 }] })
      });

    const req = { query: { name: '메이플짱' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        character_name: '메이플짱',
        final_stat: expect.any(Array),
        character_id: 'ocid-123'
      })
    );
  });

  it('실패 케이스: 닉네임이 없거나 ocid 조회 실패', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'NOT_FOUND' })
    });

    const req = { query: { name: '없는캐릭' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });
});
