// serverless/api/itemEqipment.js
export default async function handler(req, res) {
  const { ocid } = req.query;
  const API_URL = process.env.NEXON_OPEN_API_URL;
  const API_KEY = process.env.NEXON_OPEN_API;
  

  if (!ocid) {
    return res.status(400).json({ error: "❌ ocid는 필수입니다." });
  }

  try {
    const response = await fetch(`${API_URL}/maplestory/v1/character/item-equipment?ocid=${ocid}`,
      {
        headers: { "x-nxopen-api-key": `${API_KEY}` },
      }
    );

    if (!response.ok) {
      throw new Error("Nexon API 호출 실패");
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("❌ itemEquipment API 에러:", error);
    res.status(500).json({ error: "장비 정보를 불러오지 못했습니다." });
  }
}
