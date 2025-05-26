// frontend/src/components/EquipmentInfo.jsx
// 장비 정보를 표시하는 컴포넌트
import React, { useState, useEffect } from "react";
import { isItemChanged } from "@/utils/equipmentUtils";
import { calculatePower } from "@/utils/calculatePower";
import OptionGroupEditor from "@/components/OptionGroupEditor";
import useSoulOptions from "@/utils/useSoulOptions";
import SoulOptionEditor from "@/components/SoulOptionEditor";

// 등급별 색상
const gradeColor = {
  "레전드리": "text-[#CCFF00]",
  "유니크": "text-[#FFCC00]",
  "에픽": "text-[#B473F5]",
  "레어": "text-[#66FFFF]",
  "없음": "text-[#B7BFC5]"
};

// 등급별 아이콘
const gradeIcon = {
  "레전드리": "/images/info/potential_legendary.png",
  "유니크": "/images/info/potential_unique.png",
  "에픽": "/images/info/potential_epic.png",
  "레어": "/images/info/potential_rare.png",
  "없음": "/images/info/potential_normal.png"
};

// 공통 옵션
const commonStats = [
  "str", "dex", "int", "luk",
  "max_hp", "max_mp",
  "armor", "attack_power", "magic_power",
  "all_stat"
];
// 무기 전용 옵션
const weaponOnly = ["boss_damage", "ignore_monster_armor"];
// 방어구 전용 옵션
const armorOnly = ["speed", "jump"];

export default function EquipmentInfo({
  item,
  editable,
  slot,
  onClose,
  onSave,
  originalEquipment,
  currentEquipment,
  character,
  originalPower,
  setSlotColors,
  setPowerDiff,
  setEquipment,
  equipment,
  baseStats,
}) {
  
  const [price, setPrice] = useState(item.price?.toString() || "0");  // 가격
  const [starforce, setStarforce] = useState(Number(item.starforce || 0));  // 스타포스

  const [starforceOption, setStarforceOption] = useState({ ...item.item_starforce_option });  // 스타포스작
  const [addOptions, setAddOptions] = useState({ ...item.item_add_option });  // 추가옵션
  const [etcOptions, setEtcOptions] = useState({ ...item.item_etc_option });  // 주문서작


  const [potentialGroup, setPotentialGroup] = useState({ grade: item.potential_option_grade || "없음", options: [] });  // 잠재옵션 그룹
  const [additionalGroup, setAdditionalGroup] = useState({ grade: item.additional_potential_option_grade || "없음", options: [] }); // 에디셔널 잠재옵션 그룹

  const noPotentialSlots = ["뱃지", "훈장", "포켓 아이템"]; // 잠재옵션 불가 슬롯
  const isSeedRing = item.special_ring_level && item.special_ring_level !== 0;  // 시드링 여부
  const cannotHavePotential = noPotentialSlots.includes(item.item_equipment_slot) || isSeedRing;  // 잠재옵션 불가
  
  // 소울 옵션 초기화
  const soulOptions = useSoulOptions();
  const [soulTemplate, setSoulTemplate] = useState(() => {
    const match = soulOptions.find(opt => item.soul_option?.startsWith(opt.label));
    return match || null;
  });
  const [soulValue, setSoulValue] = useState(() => {
    const valueMatch = item.soul_option?.match(/([0-9]+)/);
    return valueMatch ? valueMatch[1] : "";
  });


  // 장비 바뀌면 초기화
  useEffect(() => {
    if (!item) return;
    
    setStarforce(Number(item.starforce || 0));
    setStarforceOption({ ...item.item_starforce_option });

    setAddOptions({ ...item.item_add_option });  // 추가옵션
    setEtcOptions({ ...item.item_etc_option });  // 주문서작

    // 소울
    const match = soulOptions.find(opt => item.soul_option?.startsWith(opt.label));
    const valueMatch = item.soul_option?.match(/([0-9]+)/);

    setSoulTemplate(match || null);
    setSoulValue(valueMatch ? valueMatch[1].replace(/^0+(?!$)/, "") : "");

  }, [item, soulOptions]);

  useEffect(() => {
    if (!item || !originalEquipment || !character) return;

  }, [item, originalEquipment, character]);


  // 퍼센트를 사용하는 옵션 목록
  const percentKeys = ["boss_damage", "ignore_monster_armor", "all_stat", "damage"];

  // 장비 레벨에 따른 최대 스타포스 반환
  const getMaxStarforce = (level) => {
    if (level <= 94) return 5;
    if (level <= 107) return 8;
    if (level <= 117) return 10;
    if (level <= 127) return 15;
    if (level <= 137) return 20;
    return 30;
  };

  // 스타포스 UI 렌더링
  const renderStarforceGrid = (current, level) => {
    const max = getMaxStarforce(level);
    const stars = [];
    for (let i = 0; i < max; i++) {
      const filled = i < current;
      stars.push(
        <img
          key={i}
          src={filled ? "/images/info/starforce.png" : "/images/info/starforce_empty.png"}
          alt="★"
          className="w-3 h-3 cursor-pointer"
          onClick={() => {
            if (!editable) return;
            const next = i + 1 === current ? i : i + 1;
            setStarforce(next);
          }}
        />
      );
    }

    const rows = [];
    for (let i = 0; i < stars.length; i += 15) {
      const chunk = stars.slice(i, i + 15);
      const lines = [];
      for (let j = 0; j < chunk.length; j += 5) {
        lines.push(<div key={`row-${i + j}`} className="flex gap-[3px]">{chunk.slice(j, j + 5)}</div>);
      }
      rows.push(<div key={`block-${i}`} className="flex gap-[10px] justify-center">{lines}</div>);
    }

    return <div className="flex flex-col items-center space-y-[8px] mt-1 mb-2">{rows}</div>;
  };

  // 옵션 표시
  const renderStatLine = (label, key) => {
    const base = +item.item_base_option?.[key] || 0;  // 기본 옵션
    const isPercent = percentKeys.includes(key);  // 퍼센트 옵션 여부
    const slot = item.item_equipment_slot;  // 장비 슬롯

    const allowBySlot =
      commonStats.includes(key) ||
      (weaponOnly.includes(key) && slot === "무기") ||
      (armorOnly.includes(key) && slot !== "무기");

    if (!allowBySlot) return null;

    const parseValue = (val) => {
      if (typeof val === "string" && val.includes("%")) {
        return parseFloat(val.replace("%", "")) || 0;
      }
      return parseFloat(val) || 0;
    };


    const etcVal = parseValue(etcOptions[key] || 0);  // 주문서작
    const starVal = parseValue(starforceOption[key] || 0);  // 스타포스작
    const addVal = parseValue(addOptions[key] || 0);  // 추가옵션
    const total = base + etcVal + starVal + addVal;

    if (!editable && total === 0) return null;  // 읽기 전용이면서 총합이 0인 경우 표시하지 않음

    const handleChange = (type, value) => {
      const allowEtcPercent = isPercent && type === "etc";
      const allowAddPercent = isPercent && type === "add";
      const allowPercent = allowEtcPercent || allowAddPercent;

      // 숫자와 %만 허용
      let clean = value.replace(/[^\d%]/g, "");

      // % 포함된 경우 처리
      if (clean.includes("%")) {
        const parts = clean.split("%");
        let digits = parts[0].replace(/^0+(?!$)/, "").slice(0, 3); // 앞자리 0 제거 + 3자리 제한
        clean = allowPercent ? `${digits}%` : digits; // % 허용되면 붙이고, 아니면 제거
      } else {
        clean = clean.replace(/^0+(?!$)/, "").slice(0, 3); // 숫자만 있을 경우 처리
      }

      // 상태 및 객체 반영
      if (type === "etc") {
        setEtcOptions((prev) => ({
          ...prev,
          [key]: clean
        }));
      } else if (type === "star") {
        setStarforceOption((prev) => ({
          ...prev,
          [key]: clean
        }));
      } else if (type === "add") {
        setAddOptions((prev) => ({
          ...prev,
          [key]: clean
        }));
      }
    };



    return (
      <div className="font-morris flex justify-between text-sm text-white items-center gap-2">
        <span>{label}</span>
        <span className="flex items-center gap-1">
          +{total}{isPercent ? "%" : ""}
          {(editable || etcVal > 0 || starVal > 0 || addVal > 0) && (
            <>
              <span className="text-s ml-1">(</span>
              <span className="text-s">{base}{isPercent ? "%" : ""}</span>
              {editable ? (
                <>
                  {/* 🟣 주문서작 */}
                  <span className="text-[#AFADFF] text-s"> +</span>
                  <input
                    className="w-[30px] text-s bg-transparent border-b border-[#AFADFF] text-[#AFADFF] text-right"
                    value={etcOptions[key] || ""}
                    onChange={(e) => handleChange("etc", e.target.value)}
                  />
                  {isPercent && <span className="text-[#AFADFF] text-s">%</span>}
                  {/* ⭐ 스타포스작*/}
                  {!isPercent && (
                    <>
                      <span className="text-[#FFCC00] text-s"> +</span>
                      <input
                        className="w-[30px] text-s bg-transparent border-b border-[#FFCC00] text-[#FFCC00] text-right"
                        value={starforceOption[key] || ""}
                        onChange={(e) => handleChange("star", e.target.value)}
                      />
                    </>
                  )}
                  {/* 🟢 추가옵션 */}
                  <span className="text-[#0AE3AD] text-s"> +</span>
                  <input
                    className="w-[30px] text-s bg-transparent border-b border-[#0AE3AD] text-[#0AE3AD] text-right"
                    value={addOptions[key] || ""}
                    onChange={(e) => handleChange("add", e.target.value)}
                  />
                  {isPercent && <span className="text-[#0AE3AD] text-s">%</span>}
                </>
              ) : (
                <>
                  {etcVal > 0 && <span className="text-[#AFADFF]"> +{etcVal}{isPercent ? "%" : ""}</span>}
                  {starVal > 0 && !isPercent && <span className="text-[#FFCC00]"> +{starVal}</span>}
                  {addVal > 0 && <span className="text-[#0AE3AD]"> +{addVal}{isPercent ? "%" : ""}</span>}
                </>
              )}
              <span className="text-xs">)</span>
            </>
          )}
        </span>
      </div>
    );
  };

  // 잠재옵션, 에디셔널 잠재옵션 표시
  const renderOptionGroup = (title, grade, opts) => {
    const displayGrade = grade || "없음";
    const color = gradeColor[displayGrade] || "text-gray-300";
    const icon = gradeIcon[displayGrade];

    // 어떤 옵션이 퍼센트 타입인지 판별
    const isPercentOption = (label) => {
      const percentKeywords = ["올스탯", "보스", "크리티컬", "데미지", "STR", "DEX", "INT", "LUK"];
      return percentKeywords.some((k) => label?.includes(k)) && !label?.includes("고정");
    };

    // 수치값 키
    const valueKeys = title.includes("에디셔널")
      ? ["additional_potential_option_1_value", "additional_potential_option_2_value", "additional_potential_option_3_value"]
      : ["potential_option_1_value", "potential_option_2_value", "potential_option_3_value"];

    return (
      <div className="mt-3 border-t border-gray-600 pt-2">
        <div className="flex items-center mb-1">
          {icon && <img src={icon} alt="등급 아이콘" className="w-3 mr-2" />}
          <p className={`${color}`}>{title} : {displayGrade}</p>
        </div>

        {opts.map((line, i) => {
          const value = item[valueKeys[i]];
          const hasValue = value !== undefined && value !== "" && value !== null;

          return (
            <p key={i} className="text-sm text-white ml-2">
              {line && line !== "" 
                ? `▪ ${line}${hasValue ? `+${value}${isPercentOption(line)} ? "%" : ""}` : ""}`
                : "▪ 없음"}
            </p>
          );
        })}
      </div>
    );
  };

  // 착용 시 레벨 감소
  const getReducedLevel = () => {
    const base = +item.required_level || +item.item_base_option?.base_equipment_level || 0;
    const decrease = +item.equipment_level_decrease || 0;
    const actual = base - decrease;
    if (base === 0) return null;
    if (decrease > 0) {
      return (
        <>
          <span className="text-white">Lv.{actual} </span>
          <span className="text-xs text-[#B7BFC5]">({base}</span>
          <span className="text-xs text-[#0FCD9F]"> -{decrease}</span>
          <span className="text-xs text-[#B7BFC5]">)</span>
        </>
      );
    }
    return <span className="text-white">Lv.{base}</span>;
  };

  const formatTemplate = (templateObj, values) => {
    if (!templateObj) return "";
    if (typeof templateObj === "string") return templateObj;
    if (typeof templateObj.template !== "string") return "";
    let str = templateObj.template;
    if (str.includes("{value}")) str = str.replace("{value}", values?.value ?? "");
    if (str.includes("{percent}")) str = str.replace("{percent}", values?.percent ?? "");
    if (str.includes("{level}")) str = str.replace("{level}", values?.level ?? "");
    return str;
  };


  // 저장 버튼 클릭
  const handleSaveClick = () => {
    const original = originalEquipment[slot];

    // 수정한 장비로 업데이트
    const updated = {
      ...equipment[slot],
      price: Number(price),
      soul_option: soulTemplate
        ? soulTemplate.template.replace("{value}", soulValue)
        : null,
      starforce: starforce.toString(),
      item_starforce_option: starforceOption,
      item_add_option: addOptions,
      item_etc_option: etcOptions,
      potential_option_grade: potentialGroup.grade,
      additional_potential_option_grade: additionalGroup.grade,
      potential_option_1: formatTemplate(potentialGroup.options[0]?.template, potentialGroup.options[0]?.values),
      potential_option_2: formatTemplate(potentialGroup.options[1]?.template, potentialGroup.options[1]?.values),
      potential_option_3: formatTemplate(potentialGroup.options[2]?.template, potentialGroup.options[2]?.values),
      additional_potential_option_1: formatTemplate(additionalGroup.options[0]?.template, additionalGroup.options[0]?.values),
      additional_potential_option_2: formatTemplate(additionalGroup.options[1]?.template, additionalGroup.options[1]?.values),
      additional_potential_option_3: formatTemplate(additionalGroup.options[2]?.template, additionalGroup.options[2]?.values),
    };

    const updatedEquipments = { ...currentEquipment, [slot]: updated };
    const hasChanged = isItemChanged(original, updated);

    if (!hasChanged) {
      setEquipment(updatedEquipments);
      onClose();
      return;
    }

    // 장비가 바뀌었을 시 슬롯 색상 변경
    setSlotColors((prev) => {
      const newColor = hasChanged ? "#44B7CF" : "transparent";
      return { ...prev, [slot]: newColor };
    });

    // 착용 장비 갱신
    setEquipment(updatedEquipments);

    // 착용한 장비의 전투력 계산
    const newPower = calculatePower(
      Object.values(updatedEquipments),
      character.class,
      parseFloat(character.finalDamage || "100"),
      character.weapon_is_genesis,
      baseStats,
      character.level
    );

    const scaledDiff = newPower - originalPower;
    setPowerDiff(scaledDiff);

    onSave?.(updated, scaledDiff);
    onClose();
  };

  // 장비에 hover 했을 때 각 장비의 전투력 증감 표시
  const original = originalEquipment[slot];
  const current = item;

  const hasChanged = isItemChanged(original, current);

  const currentEquipMap = { ...equipment, [slot]: current };
  const originalEquipMap = { ...equipment, [slot]: original };

  // 슬롯 외 장비 유지하면서 해당 슬롯만 각각 current / original 로 계산
  const currentPower = calculatePower(
    Object.values(currentEquipMap),
    character.class,
    parseFloat(character.finalDamage || "100"),
    character.weapon_is_genesis,
    baseStats,
    character.level
  );

  const originalPowerForSlot = calculatePower(
    Object.values(originalEquipMap),
    character.class,
    parseFloat(character.finalDamage || "100"),
    character.weapon_is_genesis,
    baseStats,
    character.level
  );

  const diff = Math.floor(currentPower - originalPowerForSlot);

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



  return (
    <div className="absolute left-[180px] top-[30px] w-[450px] bg-[#1f2735] text-white rounded-xl shadow-lg p-4 z-50 font-morris
                    overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-[#4f5768] scrollbar-track-[#2e3542]">
      <button className="absolute top-2 right-2 text-gray-300 hover:text-white" onClick={onClose}>✕</button>

      <div className="mb-2 text-center">
        {Number(starforce) > 0 && !["칭호", "뱃지", "엠블렘", "보조무기"].includes(item.item_equipment_slot) && !isSeedRing &&
         renderStarforceGrid(starforce, +item.item_base_option.base_equipment_level)}
        <p className="text-lg">{item.item_name}</p>
      </div>

      <div className="flex items-start">
        <div className="relative w-[85px] h-[85px]">
          <img src="/images/info/tooltip_itemicon.png" className="absolute inset-0 w-full h-full object-contain" />
          <img src={item.item_icon} className="absolute p-3 inset-0 w-full h-full object-contain" />
        </div>
        <div className="text-sm text-right w-[320px]">
          <p className="mt-2 text-[#85919F] text-[15px]">전투력 증가량</p>
          <p
            className={`mt-3 text-[27px] font-kohi whitespace-nowrap ${
              diff >= 0 ? "text-white" : "text-[#F20068]"
            }`}
          >
            {!hasChanged
              ? "현재 장착 중인 장비"
              : `${diff === 0 ? "" : diff > 0 ? "+" : "-"}${formatKoreanNumber(Math.abs(diff))}`}
          </p>
          {diff > 0 && price !== "0" && Number(price) !== 0 && (
          <div className="mt-3 text-s text-white font-morris text-right">
            1억 메소당 전투력 +{((diff / Number(price)) * 100000000).toFixed(2)}
          </div>
        )}

        </div>
      </div>

      <div className="mt-2 text-xs text-[#B7BFC5]">
        요구 레벨: <span className="text-white">{getReducedLevel()}</span>
      </div>

      <div className="mt-2 space-y-1">
        {renderStatLine("STR", "str")}
        {renderStatLine("DEX", "dex")}
        {renderStatLine("INT", "int")}
        {renderStatLine("LUK", "luk")}
        {renderStatLine("최대 HP", "max_hp")}
        {renderStatLine("최대 MP", "max_mp")}
        {renderStatLine("공격력", "attack_power")}
        {renderStatLine("마력", "magic_power")}
        {renderStatLine("방어력", "armor")}
        {renderStatLine("이동속도", "speed")}
        {renderStatLine("점프력", "jump")}
        {renderStatLine("보스 몬스터 데미지", "boss_damage")}
        {renderStatLine("몬스터 방어율 무시", "ignore_monster_armor")}
        {renderStatLine("올스탯", "all_stat")}
        {renderStatLine("데미지", "damage")}
      </div>

        {!cannotHavePotential && (
          editable ? (
            <OptionGroupEditor key={`잠재-${item._id || item.slot}`} item={item} type="잠재" 
              onChange={({ grade, options }) => {
                setPotentialGroup({ grade, options });
              }}/>
          ) : (
            renderOptionGroup("잠재옵션", item.potential_option_grade, [
              item.potential_option_1,
              item.potential_option_2,
              item.potential_option_3
            ])
          )
        )}

        {!cannotHavePotential && (
          editable ? (
            <OptionGroupEditor key={`에디셔널-${item._id || item.slot}`} item={item} type="에디셔널" 
              onChange={({ grade, options }) => {
                setAdditionalGroup({ grade, options });
              }}/>
          ) : (
            renderOptionGroup("에디셔널 잠재옵션", item.additional_potential_option_grade, [
              item.additional_potential_option_1,
              item.additional_potential_option_2,
              item.additional_potential_option_3
            ])
          )
        )}


      {item.item_equipment_slot === "무기" && editable && (
        <SoulOptionEditor
          value={{ template: soulTemplate, value: soulValue }}
          onChange={({ template, value }) => {
            setSoulTemplate(template);
            setSoulValue(value);
          }}
        />
      )}

      {item.item_equipment_slot === "무기" && !editable && (
        <div className="mt-3 border-t border-gray-600 pt-2">
          <div className="flex items-center mb-1">
            <img src="/images/info/soul_weapon.png" alt="소울" className="w-3 mr-2" />
            <p className="text-white">소울</p>
          </div>
          <p className="text-sm text-white ml-6">
            {item.soul_option ? `▪ ${item.soul_option}` : "▪ 없음"}
          </p>
        </div>
      )}


      {editable && (
        <div className="mt-4">
          <div className="text-sm text-yellow-500 flex items-center mb-1">
            <img src="/images/icons/meso.png" alt="메소" className="w-3 mr-2" />
            가격 (메소)
          </div>
          <input
            type="text"
            value={price}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, ""); // 숫자만 추출
              const trimmed = raw.replace(/^0+(?!$)/, "");   // 앞자리 0 제거 (단, 0 하나는 유지)
              setPrice(trimmed);
            }}
            className="w-full border px-2 py-1 rounded text-sm mt-1 text-black"
          />
          <button onClick={handleSaveClick} className="mt-3 w-full py-2 bg-blue-500 hover:bg-blue-600 rounded text-sm text-white">
            저장
          </button>
        </div>
      )}
    </div>
  );
}