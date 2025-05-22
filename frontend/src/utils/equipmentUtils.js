export const isOptionEqual = (a = {}, b = {}) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const va = (a[key] ?? "").toString();
    const vb = (b[key] ?? "").toString();
    if (va !== vb) return false;
  }
  return true;
};

export const isItemChanged = (originalItem, currentItem) => {
  if (!originalItem || !currentItem) return false;

  const fieldsToCompare = [
    "item_add_option",
    "item_etc_option",
    "item_starforce_option",
  ];

  for (const field of fieldsToCompare) {
    if (!isOptionEqual(originalItem[field], currentItem[field])) {
      return true;
    }
  }

  const forceStringCompare = (key) => {
    const o = (originalItem[key] ?? "").toString();
    const c = (currentItem[key] ?? "").toString();
    return o !== c;
  };

  const simpleKeys = [
    "starforce",
    "potential_option_grade",
    "additional_potential_option_grade",
    "potential_option_1",
    "potential_option_2",
    "potential_option_3",
    "additional_potential_option_1",
    "additional_potential_option_2",
    "additional_potential_option_3",
    "soul_option"
  ];

  for (const key of simpleKeys) {
    if (forceStringCompare(key)) return true;
  }

  return false;
};
