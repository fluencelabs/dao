const { REACT_APP_INFURA_KEY } = process.env;

export const hideString = (str) => {
  return typeof str === "string" ? `${str.slice(0, 11)}..${str.slice(-3)}` : "";
};

export const infuraUrlFactory = (network) => {
  switch (network) {
    case "mainnet":
      return `https://mainnet.infura.io/v3/${REACT_APP_INFURA_KEY}`;

    default:
      return `https://mainnet.infura.io/v3/${REACT_APP_INFURA_KEY}`;
  }
};

export const roundNumber = (num) => {
  if (num >= 1000) {
    return String(`${num / 1000} K`);
  }

  return num;
};
