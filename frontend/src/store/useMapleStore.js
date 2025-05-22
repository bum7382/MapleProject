import { create } from 'zustand';

const useMapleStore = create((set) => ({
  character: null,
  selectedSlot: null,
  showSearch: false,
  showInfo: false,
  powerDiff: 0,
  originalPower: 0,
  inventory: [],
  slotColors: {},

  setCharacter: (character) => set({ character }),
  setInventory: (inventory) => set({ inventory }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setShowSearch: (val) => set({ showSearch: val }),
  setShowInfo: (val) => set({ showInfo: val }),
  setSlotColors: (colors) => set({ slotColors: colors }),
  setPowerDiff: (diff) => set({ powerDiff: diff }),
  setOriginalPower: (power) => set({ originalPower: power }),
}));

export default useMapleStore;
