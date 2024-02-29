export const hideString = (str) => {
  return typeof str === "string" ? `${str.slice(0, 11)}..${str.slice(-3)}` : "";
};

export const roundNumber = (num) => {
  if (num >= 1000) {
    return String(`${num / 1000} K`);
  }

  return num;
};
