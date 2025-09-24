import React from "react";
import Navbar from "./Navbar";
const DocNav = () => {
  const element = [
    { pathname: "Appointments", path: "#appointments" },
    { pathname: "Patients", path: "#Patients" },

    { pathname: "Lab reports", path: "lab" },
    { pathname: "About", path: "/about" },
  ];
  return <Navbar items={element} Role="Doctor"></Navbar>;
};

export default DocNav;
