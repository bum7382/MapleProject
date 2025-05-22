// frontend/src/components/CharacterSelect.jsx
import React, { useState } from "react";
import SearchModal from "./SearchModal";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../utils/toastContext.jsx";
import { fetchCharacterByName } from "../utils/fetchCharacterByName";

export default function CharacterSelect({ characters, setCharacters, userId, user }) {
  const MAX_SLOTS = 12;
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast(); // ✅ 훅 사용

  const handleSlotClick = (index) => {
    const char = characters[index];
    if (char) {
      setSelectedIndex(index);
    } else if (index === characters.length) {
      setShowModal(true);
    }
  };

  const handleConfirm = async () => {
    const char = characters[selectedIndex];
    const result = await fetchCharacterByName(char.name);

    const selectedCharacter = {
      name: char.name,
      level: char.level,
      image: char.image,
      character_id: result.character_id, // 여기만 추가되면 끝
    };

    localStorage.setItem("selectedCharacter", JSON.stringify(selectedCharacter));
    navigate("/main");
  };


  const handleAddCharacter = async (newChar) => {
    if (characters.some((char) => char.name === newChar.name)) {
      showToast("❌ 이미 추가된 캐릭터입니다.", "error");
      return false;
    }
    const data = {
      name: newChar.name,
      level: newChar.level,
      image: newChar.image,
    };

    const token = await user.getIdToken();

    axios
      .post(`${API_BASE}/api/character`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        if (res.status !== 201 || res.data?.message === "이미 존재하는 캐릭터입니다.") {
          showToast("❌ 이미 존재하는 캐릭터입니다.", "error");
          return false;
        }

        setCharacters([...characters, res.data]);
        setShowModal(false);
      })
      .catch((err) => {
        const serverMessage = err.response?.data?.message || "";
        const msg = serverMessage || err.message || "서버 오류";

        if (serverMessage === "이미 존재하는 캐릭터입니다.") {
          showToast("❌ 이미 존재하는 캐릭터입니다.", "error");
        } else {
          showToast("❌ 캐릭터 추가 실패\n" + msg, "error");
        }

        return false;
      });
  };

  const handleRemoveCharacter = async (indexToRemove) => {
    const target = characters[indexToRemove];
    if (!target || !target._id) {
      console.warn("삭제할 캐릭터 정보 없음:", target);
      return;
    }

    const confirmDelete = window.confirm(`'${target.name}' 캐릭터를 삭제할까요?`);
    if (!confirmDelete) return;

    const token = await user.getIdToken(); // ✅ 인증용 토큰 받아오기

    axios
      .delete(`${API_BASE}/api/character/${target._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        // ✅ 성공 시 상태 업데이트
        setCharacters((prev) => {
          const updated = prev.filter((_, idx) => idx !== indexToRemove);
          return updated;
        });

        if (selectedIndex === indexToRemove) {
          setSelectedIndex(null);
        } else if (selectedIndex > indexToRemove) {
          setSelectedIndex((prev) => prev - 1);
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || "서버 오류";
        showToast("❌ 캐릭터 삭제 실패\n" + msg, "error");
        return false;
      });
  };


  return (
    <div
      className="relative w-[934px] h-[553px]"
      style={{
        backgroundImage: 'url("/images/select_character.png")',
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute top-12 left-6 grid grid-cols-6 grid-rows-2 gap-4 z-10">
        {Array.from({ length: MAX_SLOTS }).map((_, index) => {
          const char = characters[index];
          const isSelected = index === selectedIndex;
          const isAddSlot = !char && index === characters.length;

          const col = index % 6;
          const row = Math.floor(index / 6);
          const left = 9 + col * 146;
          const top = 5 + row * 207;

          return (
            <div
              key={index}
              className={`absolute w-[135px] h-[198px] border-2 rounded-md flex flex-col items-center justify-center cursor-pointer
              ${isSelected ? "border-blue-400" : "border-transparent"}
              hover:border-blue-300 bg-black bg-opacity-30 group z-10`}
              onClick={() => handleSlotClick(index)}
              style={{ top: `${top}px`, left: `${left}px` }}
            >
              {char ? (
                <>
                  <button
                    type="button"
                    className="absolute top-2 right-2 z-20 w-5 h-5 group-hover:opacity-100 opacity-0 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCharacter(index);
                    }}
                  >
                    <img
                      src="/images/icons/delete_icon.png"
                      alt="삭제"
                      className="w-full h-full active:brightness-90 hover:brightness-110"
                    />
                  </button>

                  <img src={char.image} alt="char" className="w-[110px] rounded scale-x-[-1]" />
                  <p className="text-[#F6D5AF] text-s font-morris ">Lv. {char.level}</p>
                  <p className="text-white text-[18px] font-morris">{char.name}</p>
                </>
              ) : isAddSlot ? (
                <span className="text-white text-4xl font-maple">+</span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* ✅ 결정 버튼 */}
      <div className="absolute bottom-7 right-[415px]">
        <button
          className={`px-10 py-2 rounded-[20px] text-white text-l font-morris transition 
            ${selectedIndex != null ? "bg-[#44B7CF] hover:bg-[#369EBC]" : "bg-gray-500 cursor-not-allowed"}`}
          disabled={selectedIndex == null}
          onClick={handleConfirm}
        >
          결정
        </button>
      </div>

      {/* ✅ 모달 */}
      {showModal && (
        <SearchModal
          onClose={() => setShowModal(false)}
          onSearch={handleAddCharacter}
          userId={userId}
        />
      )}
    </div>
  );
}
