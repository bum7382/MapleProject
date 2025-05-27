// frontend/src/pages/MainPage.jsx
import React, { useEffect, useState} from "react";
import EquipmentInfo from "../components/EquipmentInfo.jsx";
import { calculatePower } from "@/utils/calculatePower";
import BasicStatModal from "@/components/BasicStatModal";
import jobStat from "@/data/jobStat.json";
import InventoryPanel from "../components/InventoryPanel.jsx";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { isItemChanged } from "@/utils/equipmentUtils";
import { useToast } from "../utils/toastContext";
import { v4 as uuidv4 } from 'uuid';



export default function MainPage() {
  const [loading, setLoading] = useState(true); // 로딩 상태
  // 슬롯
  const [hoveredSlot, setHoveredSlot] = useState(null); // 슬롯 호버 상태
  const [isInfoLocked, setInfoLocked] = useState(false);  // 슬롯 클릭 상태
  const [savedSlots, setSavedSlots] = useState({}); // 슬롯 저장 상태
  const [slotColors, setSlotColors] = useState({}); // 슬롯 색상 상태
  const [selectedSlot, setSelectedSlot] = useState(null); // 선택한 슬롯

  // 장비
  const [equipment, setEquipment] = useState({}); // 장비 정보
  const [originalEquipment, setOriginalEquipment] = useState({}); // 원본 장비 정보
  const [equipmentLoaded, setEquipmentLoaded] = useState(false);  // 장비 데이터 로딩 상태
  const [showInfo, setShowInfo] = useState(false);  // 장비 정보 표시 여부
  const [isGenesis, setIsGenesis] = useState(null); // 제네시스 무기 여부

  // 전투력
  const [showModal, setShowModal] = useState(false);  // 기본 능력치 입력창
  const [baseStats, setBaseStats] = useState(null); // 입력된 기본 능력치
  const [powerDiff, setPowerDiff] = useState(0);  // 전투력
  const [originalPower, setOriginalPower] = useState(0);  // 원본 전투력
  
  // 인벤토리
  const [inventory, setInventory] = useState([]); // 인벤토리
  const [showInventory, setShowInventory] = useState(false);  // 인벤토리 표시 여부
  const [hoveredInventoryItem, setHoveredInventoryItem] = useState(null); // 인벤토리 아이템 호버 상태
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 캐릭터 정보
  const [character, setCharacter] = useState(null);
  const [userId, setUserId] = useState(null); // user ID


  // Firebase 인증 상태 감지
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);


  // 캐릭터가 바뀔 때마다 장비/전투력/슬롯 초기화
  useEffect(() => {
    setEquipment({});
    setOriginalEquipment({});
    setEquipmentLoaded(false);
    setPowerDiff(0);
    setSlotColors({});
    setSavedSlots({});
  }, [character?.character_id]);


  // 로컬 스토리지에서 캐릭터 정보 불러오기
  useEffect(() => {
    if (!character) {
      // 이전에 선택한 캐릭터 불러오기
      const saved = localStorage.getItem("selectedCharacter");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCharacter(parsed);
        } catch (e) {
          console.error("❌ 캐릭터 데이터 파싱 실패", e);
        }
      }
    }
    setLoading(false);
  }, []);
  
  // 기본 능력치 불러오기
  useEffect(() => {
    if (!character?.class) return;
    // 로컬 스토리지에서 기본 능력치 불러오기
    const saved = JSON.parse(localStorage.getItem("baseStatMap") || "{}");
    const stored = saved[character.class];
    if (stored) {
      setBaseStats(stored);
    }
  }, [character?.class]);


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
        // 제네시스 여부 판단
        const weapon = data.item_equipment.find(item => item.item_equipment_slot === "무기");
        const weaponIsGenesis = weapon?.item_name?.includes("제네시스") || false;
        setIsGenesis(weaponIsGenesis);

        setOriginalEquipment(equipmentMap);
        setEquipment(equipmentMap);
        setEquipmentLoaded(true);

      } catch (e) {
        console.error("❌ 장비 불러오기 실패:", e);
      }
    };
    fetchEquipments();
  }, [character?.character_id]);

  useEffect(() => {
    if (!userId) return;
    const fetchInventory = async () => {
      try {
        const res = await fetch(`/api/inventory/${userId}`);
        const data = await res.json();
        setInventory(data);
      } catch (err) {
        console.error("❌ 인벤토리 불러오기 실패:", err);
      }
    };

    fetchInventory();
  }, [userId]);

  // API로 처음 장비를 불러왔을 때 계산
  useEffect(() => {
      if (
        !character?.class ||
        isGenesis === null ||
        !equipmentLoaded ||
        !baseStats ||
        !Object.keys(equipment).length
      ) return;

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

  // 기본 능력치 입력되었을 시 계산
  const handleSaveBaseStats = (newBaseStats) => {
    setBaseStats(newBaseStats);
    setShowModal(false);

    const basePower = calculatePower(
      Object.values(equipment),
      character.class,
      parseFloat(character.finalDamage),
      isGenesis,
      newBaseStats
    );
    setOriginalPower(basePower);
  };

  const handleSlotClick = (slotName) => {
    setSelectedSlot(slotName);
    setHoveredSlot(slotName);
    setInfoLocked(true);
    if (equipment[slotName]) {
      setShowInfo(true);
    } else {
      setShowSearch(true);
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
        {/* 전체 화면 기준 오른쪽 하단 캐릭터 선택 버튼 */}
        <button
          className="absolute top-[380px] left-[150px] px-4 py-2 bg-[#44B7CF] text-white text-sm font-morris rounded hover:bg-[#60DCF6] active:bg-[#2b7f94] z-50"
          onClick={() => navigate("/character")}
        >
          캐릭터 선택으로
        </button>
        {slots.map(({ name, top, left }) => (
          <div
            key={name}
            style={{ top: `${top}px`, left: `${left}px` }}
            className={`absolute w-[48px] h-[48px] flex items-center justify-center transition-all duration-150
              ${selectedSlot === name ? "ring-2 ring-[#44B7CF] ring-offset-2 shadow-md rounded" : ""}`}
            onMouseEnter={() => {
              if (!isInfoLocked && equipment[name]) {
                setHoveredSlot(name);
                setShowInfo(true);
              }
            }}
            onMouseLeave={() => {
              if (!isInfoLocked) {
                setShowInfo(false);
                setHoveredSlot(null);
              }
            }}
          >
            {/* 배경 색 (슬롯 저장 상태에 따라 표시됨) */}
            <div
              className="absolute inset-0 rounded"
              style={{ backgroundColor: slotColors[name] || "transparent", zIndex: 5 }}
            />

            {/* 아이템 아이콘 */}
            {equipment[name]?.item_icon && (
              <img
                src={equipment[name].item_icon}
                alt={equipment[name].item_name}
                className="w-[36px] object-contain p-1 z-10 pointer-events-none"
              />
            )}

            {/* 클릭 가능한 버튼 */}
            <button
              className={`${slotStyle} z-20`}
              style={{ backgroundColor: "transparent" }}
              onClick={() => handleSlotClick(name)}
            />
          </div>
        ))}
        {selectedSlot && equipment[selectedSlot] && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            {/* 초기화 버튼 */}
            <button
              onClick={() => {
                if (!originalEquipment[selectedSlot]) return;
                setEquipment((prev) => ({
                  ...prev,
                  [selectedSlot]: originalEquipment[selectedSlot]
                }));
                setSavedSlots((prev) => ({
                  ...prev,
                  [selectedSlot]: false
                }));
                setSlotColors((prev) => ({
                  ...prev,
                  [selectedSlot]: "transparent"
                }));

                // 전투력 재계산
                const newPower = calculatePower(
                  Object.values({ ...equipment, [selectedSlot]: originalEquipment[selectedSlot] }),
                  character.class,
                  parseFloat(character.finalDamage || "100"),
                  isGenesis,
                  baseStats,
                  character.level
                );
                setPowerDiff(newPower - originalPower);

                setShowInfo(false);
                setInfoLocked(false);
              }}
              className="bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-morris px-4 py-1 rounded text-sm"
            >
              초기화
            </button>

            {/* 인벤토리 저장 버튼 */}
            <button
              onClick={async () => {
                const item = equipment[selectedSlot];

                const isDuplicate = inventory.some((inv) =>
                  JSON.stringify({ ...inv, price: undefined, uuid: undefined }) ===
                  JSON.stringify({ ...item, price: undefined, uuid: undefined })
                );

                if (!isDuplicate) {
                  const newItem = { ...item, uuid: uuidv4() };
                  // 1. 로컬 인벤토리에 추가
                  setInventory((prev) => [...prev, newItem]);

                  try {
                    await fetch(`/api/inventory/${userId}`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(newItem),
                    });
                  } catch (err) {
                    console.error("❌ 서버 저장 실패:", err);
                  }
                }
              }}
              className="bg-[#44B7CF] hover:bg-[#60DCF6] active:bg-[#2b7f94] font-morris text-white px-4 py-1 rounded text-sm"
            >
              인벤토리에 저장
            </button>
          </div>
        )}


        <button className="absolute bottom-[4px] left-[15px] w-[35px] h-[35px] active:brightness-75 hover:brightness-125 transition"
          onClick={() => setShowInventory((prev) => !prev)}>
          <img src="/images/icons/back_normal.png" />
        </button>
        
        {showInventory && (
          <div className="absolute -bottom-[220px] left-[50%] translate-x-[-50%]">
            <InventoryPanel
              items={inventory}
              onSlotClick={(item, index) => {
                if (!selectedSlot) return;
                  if (item.item_equipment_slot !== selectedSlot) {
                    showToast("선택한 슬롯에 장착할 수 없는 아이템입니다.", "error");
                    return;
                  }

                // 장비 장착
                setEquipment((prev) => ({
                  ...prev,
                  [selectedSlot]: item
                }));
                // 전투력 계산
                const newPower = calculatePower(
                  Object.values({ ...equipment, [selectedSlot]: item }),
                  character.class,
                  parseFloat(character.finalDamage || "100"),
                  character.weapon_is_genesis,
                  baseStats,
                  character.level
                );
                setPowerDiff(newPower - originalPower);
                // slotColors 갱신
                const original = originalEquipment[selectedSlot];
                const isChanged = isItemChanged(item, original);
                setSlotColors((prev) => ({
                  ...prev,
                  [selectedSlot]: isChanged ? '#44B7CF' : 'transparent'
                }));
                // 착용 후 info창 닫기
                setShowInfo(false);
                setInfoLocked(false);
              }}
              onDeleteClick={async (itemToDelete) => {
                // 1. 로컬 인벤토리에서 제거
                setInventory((prev) => prev.filter(i => i.uuid !== itemToDelete.uuid));

                // 2. DB에서도 삭제
                try {
                  await fetch(`/api/inventory/${userId}/${itemToDelete.uuid}`, {
                    method: "DELETE",
                  });
                } catch (err) {
                  console.error("❌ 인벤토리 삭제 실패:", err);
                }
              }}
              onHoverItem={(item) => setHoveredInventoryItem(item)}
              onHoverOut={() => setHoveredInventoryItem(null)}
            />
          </div>
        )}
      </div>
        

      {showInfo && hoveredSlot && equipment[hoveredSlot] && (
        <EquipmentInfo
          key={`${hoveredSlot}-${equipment[hoveredSlot]?.item_name}`}
          item={equipment[hoveredSlot]}
          slot={hoveredSlot}
          editable={isInfoLocked}
          onClose={() => {
            setShowInfo(false);
            setInfoLocked(false);
          }}
          onSave={(newItem, diff) => {
            const updated = { ...equipment, [hoveredSlot]: newItem };
            setPowerDiff(diff);
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
          inventory={inventory}
          setInventory={setInventory}
          slotColors={slotColors}
          setSlotColors={setSlotColors}
          setPowerDiff={setPowerDiff}
          setEquipment={setEquipment}
          equipment={equipment}
          baseStats={baseStats}
        />
      )}
      
      {hoveredInventoryItem && !isInfoLocked && (
      <EquipmentInfo
        key={`inv-${hoveredInventoryItem.uuid || hoveredInventoryItem.item_name}`}
        item={hoveredInventoryItem}
        slot={hoveredInventoryItem.item_equipment_slot}
        editable={false}
        onClose={() => setHoveredInventoryItem(null)}
        originalEquipment={originalEquipment} // 원본 장비 정보 전달
        currentEquipment={equipment} // 현재 장비 상태
        equippedItems={Object.values(equipment)}
        character={character}
        originalPower={originalPower}
        inventory={inventory}
        setInventory={setInventory}
        slotColors={{}}
        setSlotColors={() => {}}
        setPowerDiff={setPowerDiff}
        setEquipment={setEquipment}
        equipment={equipment}
        baseStats={baseStats}
      />
    )}
    </div>
  );
}