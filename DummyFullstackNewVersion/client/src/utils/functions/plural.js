// "1 country", "3 countries"
export const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
