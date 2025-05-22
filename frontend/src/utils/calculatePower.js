// frontend/src/utils/calculatePower.js
import potentialTemplates from "@/data/potentialOptions.json";
import { jobStatMap } from "./jobStatMap";

const applyPotentialOptions = (item, stat) => {
  const optionFields = [
    "potential_option_1", "potential_option_2", "potential_option_3",
    "additional_potential_option_1", "additional_potential_option_2", "additional_potential_option_3"
  ];

  const parseOption = (text) => {
    for (const template of potentialTemplates) {
      const regex = template.template
        .replace(/\{value\}/g, "(\\d+)")
        .replace(/\{percent\}/g, "(\\d+)")
        .replace(/\{level\}/g, "(\\d+)");
      const match = new RegExp("^" + regex + "$").exec(text);
      if (match) {
        const value = parseInt(match[1]);
        if (template.label.includes("STR")) {
          const key = template.type === "percent" ? "STR%" : "STR";
          stat[key] = (stat[key] || 0) + value;
        } else if (template.label.includes("DEX")) {
          const key = template.type === "percent" ? "DEX%" : "DEX";
          stat[key] = (stat[key] || 0) + value;
        } else if (template.label.includes("INT")) {
          const key = template.type === "percent" ? "INT%" : "INT";
          stat[key] = (stat[key] || 0) + value;
        } else if (template.label.includes("LUK")) {
          const key = template.type === "percent" ? "LUK%" : "LUK";
          stat[key] = (stat[key] || 0) + value;
        } else if (template.label.includes("공격력")) {
          const key = template.type === "percent" ? "공격력%" : "공격력";
          stat[key] = (stat[key] || 0) + value;
        } else if (template.label.includes("보스 몬스터 데미지")) {
          stat["보스 데미지%"] = (stat["보스 데미지%"] || 0) + value;
        } else if (template.label.includes("데미지 % 증가")) {
          stat["데미지%"] = (stat["데미지%"] || 0) + value;
        } else if (template.label.includes("크리티컬 데미지")) {
          stat["크리티컬 데미지%"] = (stat["크리티컬 데미지%"] || 0) + value;
        } else if (template.label.includes("올스탯")) {
          const keys = template.type === "percent" ? ["STR%", "DEX%", "INT%", "LUK%"] : ["STR", "DEX", "INT", "LUK"];
          keys.forEach((k) => stat[k] = (stat[k] || 0) + value);
        }
        break;
      }
    }
  };

  optionFields.forEach((field) => {
    if (item[field]) parseOption(item[field]);
  });
};

export const calculatePower = (
  items,
  job,
  extraStat = { main: 0, sub: 0 }, // 심볼, 유니온 등 %미적용 스탯
  isGenesisFn = (item) => false
) => {
  const stat = {
    STR: 0, DEX: 0, INT: 0, LUK: 0,
    "STR%": 0, "DEX%": 0, "INT%": 0, "LUK%": 0,
    공격력: 0, "공격력%": 0,
    마력: 0,
    "보스 데미지%": 0,
    "데미지%": 0,
    "크리티컬 데미지%": 0,
  };

  const optionKeys = [
    "item_total_option",
    "item_starforce_option",
    "item_add_option",
    "item_etc_option",
    "item_base_option",
    "item_exceptional_option"
  ];

  items.forEach((item) => {
    optionKeys.forEach((key) => {
      const opt = item[key] || {};
      for (const [k, v] of Object.entries(opt)) {
        const value = Math.floor(parseFloat(v || "0"));
        const upperK = k.toUpperCase();

        if (["str", "dex", "int", "luk"].includes(k)) stat[upperK] += value;
        if (["str", "dex", "int", "luk"].includes(k.replace("_percent", "")) && k.endsWith("_percent"))
          stat[upperK.replace("%", "") + "%"] += value;

        if (k === "attack_power") stat["공격력"] += value;
        if (k === "attack_power_percent") stat["공격력%"] += value;

        if (k === "damage") stat["데미지%"] += value;
        if (k === "boss_damage") stat["보스 데미지%"] += value;
        if (k === "critical_damage") stat["크리티컬 데미지%"] += value;

        if (k === "all_stat") {
          ["STR", "DEX", "INT", "LUK"].forEach((s) => stat[s] += value);
        }
        if (k === "all_stat_percent") {
          ["STR%", "DEX%", "INT%", "LUK%"].forEach((s) => stat[s] += value);
        }
      }
    });

    // 🔥 잠재옵션 반영
    applyPotentialOptions(item, stat);
  });

  const mainStat = jobStatMap[job]?.주스탯 || "STR";
  const subStat = jobStatMap[job]?.부스탯 || "DEX";

  const main = Math.floor(
    stat[mainStat] * (1 + (stat[mainStat + "%"] || 0) / 100) + (extraStat.main || 0)
  );
  const sub = Math.floor(
    stat[subStat] * (1 + (stat[subStat + "%"] || 0) / 100) + (extraStat.sub || 0)
  );

  const baseStatScore = Math.floor((main * 4 + sub) / 100);
  const atk = Math.floor(stat["공격력"] * (1 + stat["공격력%"] / 100));
  const dmg = 100 + stat["데미지%"] + stat["보스 데미지%"];
  const crit = 135 + stat["크리티컬 데미지%"];
  const final = items.some(isGenesisFn) ? 110 : 100;

  const power = Math.floor((baseStatScore * atk * dmg * crit * final) / 1000000);
  return isNaN(power) ? 0 : power;
};
