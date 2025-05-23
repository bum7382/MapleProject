// frontend/src/components/EquipmentInfo.jsx
import React, { useState, useEffect } from "react";
import { isItemChanged } from "@/utils/equipmentUtils";
import { calculatePower } from "@/utils/calculatePower";
import OptionGroupEditor from "@/components/OptionGroupEditor";
import useSoulOptions from "@/utils/useSoulOptions";
import SoulOptionEditor from "@/components/SoulOptionEditor";

const gradeColor = {
  "레전드리": "text-[#CCFF00]",
  "유니크": "text-[#FFCC00]",
  "에픽": "text-[#B473F5]",
  "레어": "text-[#66FFFF]",
  "없음": "text-[#B7BFC5]"
};

const gradeIcon = {
  "레전드리": "/images/info/potential_legendary.png",
  "유니크": "/images/info/potential_unique.png",
  "에픽": "/images/info/potential_epic.png",
  "레어": "/images/info/potential_rare.png",
  "없음": "/images/info/potential_normal.png"
};

const commonStats = [
  "str", "dex", "int", "luk",
  "max_hp", "max_mp",
  "armor", "attack_power", "magic_power",
  "all_stat"
];
const weaponOnly = ["boss_damage", "ignore_monster_armor"];
const armorOnly = ["speed", "jump"];

export default function EquipmentInfo({
  item,
  editable,
  slot,
  onClose,
  onSave,
  originalEquipment,
  setOriginalEquipment,
  currentEquipment,
  equippedItems,
  character,
  originalPower,
  setInventory,
  setSlotColors,
}) {
  const [price, setPrice] = useState(item.price?.toString() || "0");  // 가격
  const [soulOption, setSoulOption] = useState(item.soul_option || "없음"); // 소울
  const [starforce, setStarforce] = useState(Number(item.starforce || 0));  // 스타포스

  const [starforceOption, setStarforceOption] = useState({ ...item.item_starforce_option });  // 스타포스작
  const [addOptions, setAddOptions] = useState({ ...item.item_add_option });  // 추가옵션
  const [etcOptions, setEtcOptions] = useState({ ...item.item_etc_option });  // 주문서작

  const [potentialOptions, setPotentialOptions] = useState([]); // 잠재옵션
  const [additionalOptions, setAdditionalOptions] = useState([]); // 에디셔널 잠재옵션
  const [potentialGroup, setPotentialGroup] = useState({ grade: item.potential_option_grade || "없음", options: [] });  // 잠재옵션 그룹
  const [additionalGroup, setAdditionalGroup] = useState({ grade: item.additional_potential_option_grade || "없음", options: [] }); // 에디셔널 잠재옵션 그룹

  const noPotentialSlots = ["뱃지", "훈장", "포켓 아이템"]; // 잠재옵션 불가 슬롯
  const isSeedRing = item.special_ring_level && item.special_ring_level !== 0;  // 시드링 여부
  const cannotHavePotential = noPotentialSlots.includes(item.item_equipment_slot) || isSeedRing;  // 잠재옵션 불가

  // 소울
  const soulOptions = useSoulOptions();

  const [soulTemplate, setSoulTemplate] = useState(() => {
    const match = soulOptions.find(opt => item.soul_option?.startsWith(opt.label));
    return match || null;
  });
  const [soulValue, setSoulValue] = useState(() => {
    const valueMatch = item.soul_option?.match(/([0-9]+)/);
    return valueMatch ? valueMatch[1] : "";
  });



  // 1️⃣ item 바뀌면 초기값으로 starforce와 옵션 모두 세팅
  useEffect(() => {
    if (!item) return;
    
    setPotentialOptions([
      {
        template: item.potential_option_1 || "",
        values: { value: item.potential_option_1_value || 0 }
      },
      {
        template: item.potential_option_2 || "",
        values: { value: item.potential_option_2_value || 0 }
      },
      {
        template: item.potential_option_3 || "",
        values: { value: item.potential_option_3_value || 0 }
      }
    ]);

    setAdditionalOptions([
      {
        template: item.additional_potential_option_1 || "",
        values: { value: item.additional_potential_option_1_value || 0 }
      },
      {
        template: item.additional_potential_option_2 || "",
        values: { value: item.additional_potential_option_2_value || 0 }
      },
      {
        template: item.additional_potential_option_3 || "",
        values: { value: item.additional_potential_option_3_value || 0 }
      }
    ]);
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

    const baseItem = originalEquipment[slot];
  }, [item, originalEquipment, character]);




  const percentKeys = ["boss_damage", "ignore_monster_armor", "all_stat", "damage"];

  const getMaxStarforce = (level) => {
    if (level <= 94) return 5;
    if (level <= 107) return 8;
    if (level <= 117) return 10;
    if (level <= 127) return 15;
    if (level <= 137) return 20;
    return 30;
  };

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

  const renderStatLine = (label, key) => {
    const base = +item.item_base_option[key] || 0;
    const isPercent = percentKeys.includes(key);
    const isPercentKey = percentKeys.includes(key);
    const slot = item.item_equipment_slot;

    const allowBySlot =
      commonStats.includes(key) ||
      (weaponOnly.includes(key) && slot === "무기") ||
      (armorOnly.includes(key) && slot !== "무기");

    if (!allowBySlot) return null;


    // ⭐ 상태로 각 항목 관리
    const [etc, setEtc] = useState(etcOptions[key] || "");
    const [star, setStar] = useState(starforceOption[key] || "");
    const [add, setAdd] = useState(addOptions[key] || "");

    const parseValue = (val) => {
      if (typeof val === "string" && val.includes("%")) {
        return parseFloat(val.replace("%", "")) || 0;
      }
      return parseFloat(val) || 0;
    };


    const etcVal = parseValue(etc);
    const starVal = parseValue(star);
    const addVal = parseValue(add);
    const total = base + etcVal + starVal + addVal;

    if (!editable && total === 0) return null;

    const handleChange = (type, value) => {
      const isPercentKey = ["boss_damage", "damage", "all_stat"].includes(key);
      const allowEtcPercent = isPercentKey && type === "etc";
      const allowAddPercent = isPercentKey && type === "add";
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
        setEtc(clean);
        setEtcOptions((prev) => ({
          ...prev,
          [key]: clean
        }));
      } else if (type === "star") {
        setStar(clean);
        setStarforceOption((prev) => ({
          ...prev,
          [key]: clean
        }));
      } else if (type === "add") {
        setAdd(clean);
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
                  {/* 🟣 보라색: etc */}
                  <span className="text-[#AFADFF] text-s"> +</span>
                  <input
                    className="w-[30px] text-s bg-transparent border-b border-[#AFADFF] text-[#AFADFF] text-right"
                    value={etc}
                    onChange={(e) => handleChange("etc", e.target.value)}
                  />
                  {isPercentKey && <span className="text-[#AFADFF] text-s">%</span>}
                  {/* ⭐ 노란색: starforce → % 불가 속성이면만 렌더링 */}
                  {!isPercentKey && (
                    <>
                      <span className="text-[#FFCC00] text-s"> +</span>
                      <input
                        className="w-[30px] text-s bg-transparent border-b border-[#FFCC00] text-[#FFCC00] text-right"
                        value={star}
                        onChange={(e) => handleChange("star", e.target.value)}
                      />
                    </>
                  )}
                  {/* 🟢 초록색: add */}
                  <span className="text-[#0AE3AD] text-s"> +</span>
                  <input
                    className="w-[30px] text-s bg-transparent border-b border-[#0AE3AD] text-[#0AE3AD] text-right"
                    value={add}
                    onChange={(e) => handleChange("add", e.target.value)}
                  />
                  {isPercentKey && <span className="text-[#0AE3AD] text-s">%</span>}
                </>
              ) : (
                <>
                  {etcVal > 0 && <span className="text-[#AFADFF]"> +{etcVal}{isPercentKey ? "%" : ""}</span>}
                  {starVal > 0 && !isPercentKey && <span className="text-[#FFCC00]"> +{starVal}</span>}
                  {addVal > 0 && <span className="text-[#0AE3AD]"> +{addVal}{isPercentKey ? "%" : ""}</span>}
                </>
              )}
              <span className="text-xs">)</span>
            </>
          )}
        </span>
      </div>
    );
  };




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




  const handleSaveClick = () => {
    const original = originalEquipment[slot];

    const updated = {
      ...item,
      price: Number(price),
      soul_option: soulTemplate
        ? soulTemplate.template.replace("{value}", soulValue)
        : null,
      starforce: starforce.toString(),
      item_starforce_option: { ...starforceOption },
      item_add_option: { ...addOptions },
      item_etc_option: { ...etcOptions },
      potential_option_grade: potentialGroup.grade,
      additional_potential_option_grade: additionalGroup.grade,
      potential_option_1: formatTemplate(potentialGroup.options[0]?.template, potentialGroup.options[0]?.values),
      potential_option_2: formatTemplate(potentialGroup.options[1]?.template, potentialGroup.options[1]?.values),
      potential_option_3: formatTemplate(potentialGroup.options[2]?.template, potentialGroup.options[2]?.values),
      additional_potential_option_1: formatTemplate(additionalGroup.options[0]?.template, additionalGroup.options[0]?.values),
      additional_potential_option_2: formatTemplate(additionalGroup.options[1]?.template, additionalGroup.options[1]?.values),
      additional_potential_option_3: formatTemplate(additionalGroup.options[2]?.template, additionalGroup.options[2]?.values),
    };

    const hasChanged = isItemChanged(original, updated);


    setSlotColors((prev) => {
      const newColor = hasChanged ? "#44B7CF" : "transparent";
      if (prev[slot] === newColor) return { ...prev };
      return { ...prev, [slot]: newColor };
    });

    if (!isItemChanged(original, updated)) {
      setOriginalEquipment((prev) => ({
        ...prev,
        [slot]: updated,
      }));
    }

    setInventory((prev) => [...prev, updated]);

    
    //const nowPower = calculatePower(Object.values(newEquip), character.character_class);
    //const diff = nowPower - originalPower;

    //setOriginalPower(nowPower); 
    //setSlotPowerDiffs((prev) => ({ ...prev, [slot]: diff }));

    onSave(updated);
    onClose();
  };



  return (
    <div className="absolute left-[180px] top-[30px] w-[450px] bg-[#1f2735] text-white rounded-xl shadow-lg p-4 z-50 font-morris
                    overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-[#4f5768] scrollbar-track-[#2e3542]">
      <button className="absolute top-2 right-2 text-gray-300 hover:text-white" onClick={onClose}>✕</button>

      <div className="mb-2 text-center">
        {item.starforce !== "0" && !["칭호", "뱃지", "엠블렘", "보조무기"].includes(item.item_equipment_slot) && !isSeedRing &&
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
          <p className="mt-3 text-white text-[27px] font-kohi whitespace-nowrap">
            현재 장착중인 장비
          </p>
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
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
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
