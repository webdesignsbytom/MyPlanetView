// Names read as a sentence: "Sarah", "Sarah and Tom", "Sarah, Tom and Lily"
export function joinNames(names) {
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
