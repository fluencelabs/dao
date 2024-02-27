import React from "react";

import styles from "./Dashboard.module.css";

const Dashboard = ({ children }) => {
  return <section className={styles.dashboard}>{children}</section>;
};

export default Dashboard;
