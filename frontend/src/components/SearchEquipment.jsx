import React from "react";

export default function SearchEquipment({ slot, onClose, onSelectItem }) {
  return (
    <div className="absolute top-10 left-10 bg-white p-4 rounded shadow z-50">
      <h2 className="text-lg font-bold mb-2">🔍 {slot} 검색 모달</h2>
      <p className="text-sm text-gray-600">여기에 장비 검색 UI가 들어갈 예정입니다.</p>
      <button onClick={onClose} className="mt-4 bg-gray-300 px-3 py-1 rounded">닫기</button>
    </div>
  );
}
