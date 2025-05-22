import React, { useState } from "react";
import { fetchCharacterByName } from "../utils/fetchCharacterByName";
import { useToast } from "../utils/toastContext.jsx"; // ✅ 전역 토스트 사용

export default function SearchModal({ onClose, onSearch, userId }) {
  const [inputValue, setInputValue] = useState("");
  const { showToast } = useToast(); // ✅ 훅 사용

  const handleSearch = async () => {
    if (!inputValue.trim()) {
      showToast("❌ 캐릭터 이름을 입력하세요.", "error");
      return;
    }

    const result = await fetchCharacterByName(inputValue.trim());
    if (!result || result?.error) {
      showToast("❌ 캐릭터를 찾을 수 없습니다.", "error");
      return;
    }

    const mappedChar = {
      name: result.character_name,
      level: parseInt(result.character_level, 10),
      image: result.character_image,
      character_id: result.character_id,
      userId: userId || null,
    };


    const success = await onSearch(mappedChar); // ✅ 성공 여부 반환
    if (success) {
      onClose(); // ✅ 성공일 때만 모달 닫기
    }
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-[20px] w-[600px] p-10 relative shadow-lg">
        <div className="absolute -top-[36px] left-[25px] bg-[#44B7CF] font-morris text-white px-6 py-2 rounded-t-lg text-sm shadow-md z-20">
          캐릭터 검색
        </div>

        <div className="flex flex-col items-center mb-10">
          <img
            src="/images/logo.png"
            alt="메이플 스펙업 효율 계산기"
            className="w-70 h-auto mb-4 drop-shadow-xl"
          />
        </div>

        <div className="flex rounded-full bg-gray-100 overflow-hidden font-morris shadow-inner">
          <input
            type="text"
            placeholder="캐릭터 이름을 입력하세요."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 px-4 py-2 outline-none bg-gray-100 text-sm"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="bg-[#44B7CF] text-white px-6 text-sm font-morris hover:bg-[#369EBC]"
          >
            검색
          </button>
        </div>

        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
