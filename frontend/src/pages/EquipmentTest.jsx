// src/pages/EquipmentTest.jsx
import React from "react";
import EquipmentInfo from "../components/EquipmentInfo";

export default function EquipmentTest() {
    const mockItem = {
    item_name: "여명의 가디언 엔젤 링",
    item_icon: "https://open.api.nexon.com/static/maplestory/item/icon/KEODIEPH",
    item_equipment_slot: "모자",
    required_jobs: "전사",
    required_level: 200,
    starforce: 17,
    price: 1000000,
    item_total_option: { str: "200", dex: "180", attack_power: "40" },
    item_base_option: { str: "100", dex: "80", attack_power: "10" },
    item_etc_option: { str: "10", dex: "10", attack_power: "5" },
    item_starforce_option: { str: "40", dex: "60", attack_power: "15" },
    item_add_option: { str: "50", dex: "30", attack_power: "10" },
    potential_option_grade: "레전드리",
    additional_potential_option_grade: "레어",
    potential_option_1: "STR +9%",
    potential_option_2: "DEX +6%",
    potential_option_3: "INT +6%",
    additional_potential_option_1: "공격력 +10",
    additional_potential_option_2: "",
    additional_potential_option_3: "",
    soul_option: "공격력 +3%"
    };


  return (
    <div className="overflow-y-auto relative w-screen h-screen bg-gray-100">
      <EquipmentInfo
        item={mockItem}
        editable={true}
        slot="반지1"
        onClose={() => console.log("❌ 닫힘")}
        onSave={(item) => console.log("✅ 저장됨:", item)}
      />
    </div>
  );
}
