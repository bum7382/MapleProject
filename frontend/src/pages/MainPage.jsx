// MainPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import SearchEquipment from "../components/SearchEquipment.jsx";
import EquipmentInfo from "../components/EquipmentInfo.jsx";
import { calculatePower } from "@/utils/calculatePower";
import useMapleStore from "../store/useMapleStore";
import BasicStatModal from "@/components/BasicStatModal";
import jobStat from "@/data/jobStat.json"; // 캐릭터별 주/부스탯 정보

export default function MainPage() {
  const [loading, setLoading] = useState(true);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [isInfoLocked, setInfoLocked] = useState(false);
  const [equipment, setEquipment] = useState({});
  const [savedSlots, setSavedSlots] = useState({});
  const [slotColors, setSlotColors] = useState({});
  const [originalPower, setOriginalPower] = useState(0);
  const { character, setCharacter } = useMapleStore();
  const { selectedSlot, setSelectedSlot } = useMapleStore();
  const { showSearch, setShowSearch } = useMapleStore();
  const { showInfo, setShowInfo } = useMapleStore();
  const { inventory, setInventory } = useMapleStore();
  const [originalEquipment, setOriginalEquipment] = useState({});
  const [equipmentLoaded, setEquipmentLoaded] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [baseStats, setBaseStats] = useState(null); // 입력된 기본값 저장

  const [powerDiff, setPowerDiff] = useState(0);

  const [isGenesis, setIsGenesis] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("selectedCharacter");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) setCharacter(parsed);
      } catch (e) {
        console.error("❌ 캐릭터 데이터 파싱 실패", e);
      }
    }
    setLoading(false);
  }, []);
  
  useEffect(() => {
    if (!character?.class) return;
    const saved = JSON.parse(localStorage.getItem("baseStatMap") || "{}");
    const stored = saved[character.class];
    if (stored) {
      setBaseStats(stored);
    }
  }, [character?.class]);

  useEffect(() => {
    if (!character?.character_id || equipmentLoaded) return;
    const fetchEquipments = async () => {
      try {
        const res = await fetch(`/api/itemEquipment?ocid=${character.character_id}`);
        const data = await res.json();
        const equipmentMap = {};
        const countMap = {};
        for (const item of data.item_equipment) {
          let raw = item.item_equipment_slot || item.item_equipment_part;
          if (!raw) continue;
          if (raw === "펜던트") {
            countMap["펜던트"] = (countMap["펜던트"] || 0) + 1;
            raw = countMap["펜던트"] === 1 ? "펜던트" : "펜던트2";
          } else if (raw === "반지") {
            countMap["반지"] = (countMap["반지"] || 1);
            raw = `반지${countMap["반지"]}`;
            countMap["반지"] += 1;
          }
          equipmentMap[raw] = item;
        }
        // ✅ 여기서 제네시스 여부 판단
        const weapon = data.item_equipment.find(item => item.item_equipment_slot === "무기");
        const weaponIsGenesis = weapon?.item_name?.includes("제네시스") || false;
        setIsGenesis(weaponIsGenesis);

        // ✅ character 상태에 weapon_is_genesis 추가
        if (character.weapon_is_genesis !== isGenesis) {
          setCharacter({
            ...character,
            weapon_is_genesis: isGenesis,
          });
        }

        setOriginalEquipment(equipmentMap);
        setEquipment(equipmentMap);
        setEquipmentLoaded(true);

      } catch (e) {
        console.error("❌ 장비 불러오기 실패:", e);
      }
    };
    fetchEquipments();
  }, [character?.character_id, equipmentLoaded]);

  useEffect(() => {
    if (!character?.class || isGenesis === null || !equipmentLoaded || !baseStats) return;

    const basePower = calculatePower(
      Object.values(equipment),
      character.class,
      parseFloat(character.finalDamage),
      isGenesis,
      baseStats,
      character.level
    );

    setOriginalPower(basePower);
  }, [character?.class, isGenesis, equipmentLoaded, baseStats]);

  const handleSaveBaseStats = (newBaseStats) => {
    setBaseStats(newBaseStats);
    setShowModal(false);

    const basePower = calculatePower(
      Object.values(equipment),
      character.class,
      parseFloat(character.finalDamage),
      character.weapon_is_genesis,
      newBaseStats
    );

    setOriginalPower(basePower);
  };

  const handleSlotClick = (slotName) => {
    setSelectedSlot(slotName);
    setInfoLocked(true);
    if (equipment[slotName]) {
      setShowInfo(true);
      setShowSearch(false);
    } else {
      setShowSearch(true);
      setShowInfo(false);
    }
  };
  function formatKoreanNumber(num) {
    const abs = Math.abs(num);
    const eok = Math.floor(abs / 100000000);
    const man = Math.floor((abs % 100000000) / 10000);
    const rest = abs % 10000;

    const parts = [];
    if (eok > 0) parts.push(`${eok}억`);
    if (man > 0) parts.push(`${man}만`);
    if (rest > 0 || parts.length === 0) parts.push(`${rest}`);

    return parts.join(" ");
  }
  const slotStyle = "absolute w-[48px] h-[48px] bg-black bg-opacity-0 rounded active:bg-opacity-20 hover:bg-opacity-10";
  const slots = [
    ...["반지1", "반지2", "반지3", "반지4", "벨트", "포켓 아이템"].map((name, i) => ({ name, top: 115 + i * 51, left: 34 })),
    ...["눈장식", "귀고리", "펜던트", "펜던트2", "얼굴장식"].map((name, i) => ({ name, top: 115 + i * 51, left: 85 })),
    ...["모자", "상의", "하의", "어깨장식"].map((name, i) => ({ name, top: 115 + i * 51, left: 291 })),
    ...["망토", "장갑", "신발", "훈장", "기계 심장", "뱃지"].map((name, i) => ({ name, top: 115 + i * 51, left: 342 })),
    { name: "무기", top: 320, left: 137 },
    { name: "보조무기", top: 320, left: 188 },
    { name: "엠블렘", top: 320, left: 239 },
  ];

  if (loading) return <div className="text-center mt-20">⏳ 로딩 중...</div>;
  if (!character) return <div className="text-center mt-20">❌ 선택된 캐릭터가 없습니다.</div>;

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
         style={{ backgroundImage: "url(/images/background_blur.png)" }}>
      {!baseStats && (
        <div className="absolute top-[173px] left-1/2 transform -translate-x-1/2 z-30 bg-red-600 text-white font-morris px-4 py-2 rounded shadow">
          ⚠️ 캐릭터를 클릭하여 기본 능력치를 먼저 입력해주세요.
        </div>
      )}
      {showModal && character && (() => {
        const jobInfo = jobStat.find(j => j.class === character.class);
        if (!jobInfo) return null;
        return (
          <BasicStatModal
            jobClass={character.class}
            mainStat={jobInfo.main_stat}
            subStat={jobInfo.sub_stat}
            isMagicClass={jobInfo.main_stat === "INT"}
            onSave={handleSaveBaseStats}
            onClose={() => setShowModal(false)}
          />
        );
      })()}
      <div className="relative w-[420px] aspect-[420/509]">
        <img src="/images/inventory/equipment_bg.png" className="absolute inset-0 w-full h-full" />
        <img src="/images/inventory/equipmentUI.png" className="absolute top-[70px] left-[17px] w-[390px]" />
        <div className="absolute -translate-y-[100px] left-1/2 -translate-x-1/2 z-20">
          <div className="w-[600px] h-[50px] flex items-center justify-center text-center text-white bg-[#1F2735] bg-opacity-60 px-4 py-1 rounded">
            <span className="font-morris absolute left-4 text-[14px] text-[#E0E8F2]">
              전투력 증가량:
            </span>
            <span
              className={`font-kohi text-[23px] ${
                powerDiff < 0 ? "text-[#F20068]" : "text-white"
              }`}
            >
              {powerDiff === 0
                ? "0"
                : `${powerDiff > 0 ? "+" : "-"}${formatKoreanNumber(powerDiff)}`}
            </span>
          </div>
        </div>
        <img src="/images/inventory/equipment_info.png" className="absolute bottom-[454px] left-[14px] w-[172px] h-[22px]" />
        <div className="absolute top-[150px] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
          onClick={() => setShowModal(true)}>
          <img src={character?.image || "/images/default_character.png"} className="w-[130px]" />
          <span className="mt-1 px-3 py-0.5 rounded-full bg-[#44B7CF] text-white text-sm font-morris relative -top-[5px]">
            {character?.name || "이름없음"}
          </span>
        </div>

        {slots.map(({ name, top, left }) => (
          <div key={name} style={{ top: `${top}px`, left: `${left}px` }} className="absolute w-[48px] h-[48px] flex items-center justify-center"
               onMouseEnter={() => { if (!isInfoLocked && equipment[name]) { setHoveredSlot(name); setShowInfo(true); } }}
               onMouseLeave={() => { if (!isInfoLocked) { setShowInfo(false); setHoveredSlot(null); } }}>
            <div className="absolute inset-0 rounded" style={{ backgroundColor: slotColors[name] || "transparent", zIndex: 5 }} />
            {equipment[name]?.item_icon && (
              <img src={equipment[name].item_icon} alt={equipment[name].item_name}
                   className="w-[36px] object-contain p-1 z-10 pointer-events-none" />
            )}
            <button className={`${slotStyle} z-20`} style={{ backgroundColor: "transparent" }}
                    onClick={() => handleSlotClick(name)} />
          </div>
        ))}
        <button className="absolute bottom-[4px] left-[15px] w-[35px] h-[35px]">
          <img src="/images/icons/back_normal.png" />
        </button>
      </div>

      {showSearch && (
        <SearchEquipment
          slot={selectedSlot}
          onClose={() => setShowSearch(false)}
          onSelectItem={(item) => {
            setEquipment((prev) => ({ ...prev, [selectedSlot]: item }));
            setShowSearch(false);
          }}
        />
      )}

      {showInfo && hoveredSlot && equipment[hoveredSlot] && (
        <EquipmentInfo
          key={`${hoveredSlot}-${equipment[hoveredSlot]?.item_name}`}
          item={equipment[hoveredSlot]}
          slot={hoveredSlot}
          editable={isInfoLocked && !showSearch}
          onClose={() => {
            setShowInfo(false);
            setInfoLocked(false);
          }}
          onSave={(newItem, diff) => {
            const updated = { ...equipment, [hoveredSlot]: newItem };
            setPowerDiff(diff); // ✅ 이 줄만 남기고 밑에 diff 계산은 전부 삭제
            setEquipment(updated);
            setSavedSlots((prev) => ({ ...prev, [hoveredSlot]: true }));
            setInfoLocked(false);
          }}
          originalEquipment={originalEquipment}
          setOriginalEquipment={setOriginalEquipment}
          currentEquipment={equipment}
          equippedItems={Object.values(equipment)}
          character={character}
          originalPower={originalPower}
          setInventory={setInventory}
          slotColors={slotColors}
          setSlotColors={setSlotColors}
          setPowerDiff={setPowerDiff}
          setEquipment={setEquipment}
          equipment={equipment}
          baseStats={baseStats}
        />
      )}
    </div>
  );
}
