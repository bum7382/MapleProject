import jobStat from "../data/jobStat.json";
import potentialOptions from "../data/potentialOptions.json";
import setEffect from "../data/setEffect.json";

export function calculatePower(equipments, jobClass) {
  const jobInfo = jobStat.find(j => j.class === jobClass);
  if (!jobInfo) return 0;

  // flat 값
  const baseStats = { STR: 0, DEX: 0, INT: 0, LUK: 0, HP: 0 };

  // percent 값
  const percentStats = { STR: 0, DEX: 0, INT: 0, LUK: 0, HP: 0 };

  // 공격력/마력
  let attack = 0, attackPercent = 0;
  let magic = 0, magicPercent = 0;


  // 보스 데미지, 최종 데미지, 크리티컬 데미지
  let bossDmg = 0, finalDmg = 0, critDmg = 135;
  
  // 세트 효과
  const setCountMap = {};

  // 제네시스 무기인지 확인 -> 제네시스 무기일 경우 최종 데미지 1.1배, 아닐 경우 1배
  // 기존에 제네시스 무기 -> 일반 무기로 변환 시 0.9배 되어야 함.
  const weapon = equipments.find(eq => eq.item_equipment_slot === "무기");
  const isGenesisWeapon = weapon?.item_name?.includes("제네시스");
  const finalDamageMultiplier = isGenesisWeapon ? 1.1 : 1.0;

  // 현재 장착 중인 장비의 전체 옵션 계산
  for (const eq of equipments) {
    const total = eq.item_total_option || {}; // 전체
    const add = eq.item_add_option || {}; // 추가 옵션
    const etc = eq.item_etc_option || {}; // 주문서작
    const star = eq.item_starforce_option || {};  // 스타포스작

    // flat 값 계산
    for (let stat of ["str", "dex", "int", "luk", "hp"]) {
      const key = stat.toUpperCase();
      baseStats[key] +=
        +(total[stat] || 0) + +(add[stat] || 0) + +(etc[stat] || 0) + +(star[stat] || 0);
    }

    // 공격력 계산
    attack += +(total.attack_power || 0) + +(add.attack_power || 0) + +(etc.attack_power || 0) + +(star.attack_power || 0);
    
    // 마력 계산  
    magic += +(total.magic_power || 0) + +(add.magic_power || 0) + +(etc.magic_power || 0) + +(star.magic_power || 0);

    // 보스 공격력 계산
    bossDmg += +(total.boss_damage || 0);

    // 소울 옵션이 있을 경우 계산
    if (eq.soul_option?.includes("보스 몬스터 데미지")) {
      const val = parseInt(eq.soul_option.replace(/[^0-9]/g, ""));
      if (!isNaN(val)) bossDmg += val;
    }

    // 잠재 능력 계산
    const allPotentials = [
      eq.potential_option_1, eq.potential_option_2, eq.potential_option_3,
      eq.additional_potential_option_1, eq.additional_potential_option_2, eq.additional_potential_option_3
    ];

    // 잠재 계산
    for (const pot of allPotentials) {
      const p = potentialOptions.find(p => pot?.includes(p.label));
      if (!p) continue;
      const match = pot.match(/([0-9]+)/);
      const val = match ? +match[1] : 0;
      const key = p.stat;

      if (p.type === "percent") {
        if (key === "damage") finalDmg += val;
        else if (key === "boss_damage") bossDmg += val;
        else if (key === "critical_damage") critDmg += val;
        else if (key === "올스탯") {
          for (let s of ["STR", "DEX", "INT", "LUK"]) {
            percentStats[s] += val;
          }
        }
        else if (percentStats[key?.toUpperCase()] !== undefined)
          percentStats[key.toUpperCase()] += val;
        else if (key === "attack_power") atkPercent += val;
      } else if (p.type === "flat") {
        if (["STR", "DEX", "INT", "LUK", "HP"].includes(key?.toUpperCase())) {
          baseStats[key.toUpperCase()] += val;
        } else if (key === "attack_power") {
          atk += val;
        }
      }
    }

    Object.entries(setEffect).forEach(([setName, data]) => {
      const items = data.setItems || [];
      const matchList = data.match || [];
      if (
        items.includes(eq.item_name) ||
        matchList.some(keyword => eq.item_name?.includes(keyword))
      ) {
        setCountMap[setName] = (setCountMap[setName] || 0) + 1;
      }
    });
  }

  for (const [setName, count] of Object.entries(setCountMap)) {
    const bonus = setEffect[setName].bonuses;
    for (let i = 1; i <= count; i++) {
      const entry = bonus?.[i];
      if (!entry) continue;
      for (const [k, v] of Object.entries(entry)) {
        const key = k.replace(/ /g, "");
        if (key === "공격력") atk += v;
        else if (key === "보스몬스터데미지") bossDmg += v;
        else if (key === "올스탯") {
          for (let s of ["STR", "DEX", "INT", "LUK"]) baseStats[s] += v;
        } else if (key === "최대HP") baseStats.HP += v;
        else if (key === "최대HP%") percentStats.HP += v;
        else if (key === "크리티컬데미지") critDmg += v;
      }
    }
  }

  // 주스탯, 부스탯 계산
  const mainStat = jobInfo.main_stat;
  const subStat = jobInfo.sub_stat;

  let finalStat = 0;
  if (mainStat === "HP") {
    finalStat = Math.floor(baseStats.HP * (1 + percentStats.HP / 100));
  } else {
    const main = baseStats[mainStat];
    const mainPercent = percentStats[mainStat];
    const sub = Array.isArray(subStat) ? subStat.reduce((a, s) => a + baseStats[s], 0) : baseStats[subStat];
    const subPercent = Array.isArray(subStat)
      ? subStat.reduce((a, s) => a + percentStats[s], 0) / subStat.length
      : percentStats[subStat];

    const finalMain = Math.floor(main * (1 + mainPercent / 100));
    const finalSub = Math.floor(sub * (1 + subPercent / 100));
    finalStat = Math.floor((finalMain * 4 + finalSub) / 100);
  }

  const finalAtk = Math.floor(atk * (1 + atkPercent / 100));
  const finalBoss = 100 + bossDmg;
  const finalCrit = critDmg;
  const finalDamage = finalDmg;

  const power = Math.floor(finalStat * finalAtk * finalBoss * finalCrit * finalDamage * finalDamageMultiplier / 100000000);
  return power;
}
