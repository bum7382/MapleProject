// MainPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import SearchEquipment from "../components/SearchEquipment.jsx";
import EquipmentInfo from "../components/EquipmentInfo.jsx";
import { calculatePower } from "@/utils/calculatePower";
import useMapleStore from "../store/useMapleStore";

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
  
//  const [slotPowerDiffs, setSlotPowerDiffs] = useState({});

  // const totalPowerDiff = useMemo(() => {
  //   return Object.values(slotPowerDiffs)
  //     .filter((val) => typeof val === "number") // 숫자인 것만 더함
  //     .reduce((acc, cur) => acc + cur, 0);
  // }, [slotPowerDiffs]);

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
    if (!character?.character_id) return;
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
        setEquipment(equipmentMap);
        setOriginalEquipment(equipmentMap);
        const basePower = calculatePower(Object.values(equipmentMap), character.character_class);
        setOriginalPower(basePower);
      } catch (e) {
        console.error("❌ 장비 불러오기 실패:", e);
      }
    };
    fetchEquipments();
  }, [character]);

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
      {/* <div className="bg-[#1F2735] bg-opacity-90 absolute top-10 left-1/2 -translate-x-1/2 z-50 text-white text-xl font-kohi">
        전투력 변화량: {totalPowerDiff >= 0 ? `+${totalPowerDiff.toLocaleString()}` : totalPowerDiff.toLocaleString()}
      </div> */}

      <div className="relative w-[420px] aspect-[420/509]">
        <img src="/images/inventory/equipment_bg.png" className="absolute inset-0 w-full h-full" />
        <img src="/images/inventory/equipmentUI.png" className="absolute top-[70px] left-[17px] w-[390px]" />
        <img src="/images/inventory/equipment_info.png" className="absolute bottom-[454px] left-[14px] w-[172px] h-[22px]" />
        <div className="absolute top-[150px] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
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
        <button className="absolute bottom-[4px] right-[15px] w-[35px] h-[35px]">
          <img src="/images/icons/chat_normal.png" />
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
          onSave={(newItem) => {
            const updated = { ...equipment, [hoveredSlot]: newItem };
            const newPower = calculatePower(Object.values(updated), character.character_class);
            //const diff = newPower - originalPower;
            setEquipment((prev) => ({ ...prev, [hoveredSlot]: newItem }));
            setSavedSlots((prev) => ({ ...prev, [hoveredSlot]: true }));
            //setSlotPowerDiffs((prev) => ({ ...prev, [hoveredSlot]: diff }));
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
          //slotPowerDiffs={slotPowerDiffs}
          //setSlotPowerDiffs={setSlotPowerDiffs}
        />
      )}
    </div>
  );
}
