import React from "react";
import styles from "./TextArea.module.css";

const TextArea = ({ name, rows = "1", disabled = false, onChange }) => {
  const handleChange = onChange;

  return (
    <textarea
      className={styles.area}
      name={name}
      onChange={handleChange}
      rows={rows}
      disabled={disabled}
    />
  );
};

export default TextArea;
