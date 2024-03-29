import { useEffect } from "react";

export const useVh = () => {
  useEffect(() => {
    document
      .querySelector(":root")
      .style.setProperty("--vh", window.innerHeight / 100 + "px");

    window.addEventListener("resize", () => {
      document
        .querySelector(":root")
        .style.setProperty("--vh", window.innerHeight / 100 + "px");
    });
  }, []);
};
