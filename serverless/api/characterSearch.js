//serverless/api/characterSearch.js
export default async function handler(req, res) {
  const { name } = req.query;

  const API_URL = process.env.NEXON_OPEN_API_URL;
  const API_KEY = process.env.NEXON_OPEN_API;


  try {
    // 1. 닉네임으로 ocid 조회
    const idRes = await fetch(`${API_URL}/maplestory/v1/id?character_name=${encodeURIComponent(name)}`, {
      headers: { "x-nxopen-api-key": `${API_KEY}` },
    });


    const idResBody = await idRes.json();

    if (!idRes.ok || idResBody.error || !idResBody.ocid) {
      throw new Error(`ID 조회 실패: ${JSON.stringify(idResBody)}`);
    }

    const ocid = idResBody.ocid;


    // 2. ocid로 캐릭터 기본 정보 조회
    const infoRes = await fetch(`${API_URL}/maplestory/v1/character/basic?ocid=${ocid}`, {
      headers: { "x-nxopen-api-key": `${API_KEY}` },
    });

    const infoBody = await infoRes.json();

    if (!infoRes.ok || infoBody.error) {
      throw new Error(`캐릭터 정보 조회 실패: ${JSON.stringify(infoBody)}`);
    }
    
    // 3. 스탯 정보 조회
    const statRes = await fetch(`${API_URL}/maplestory/v1/character/stat?ocid=${ocid}`, {
      headers: { "x-nxopen-api-key": API_KEY },
    });
    const stat = await statRes.json();
    if (!Array.isArray(stat.final_stat)) throw new Error("스탯 정보 실패");

    // 최종 응답 반환
    res.status(200).json({
      ...infoBody,
      ...stat,
      character_id: ocid, // ✅ character_id 포함!
    });

  } catch (err) {
    console.error("❌ API ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
