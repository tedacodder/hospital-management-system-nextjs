import React from "react";
import Navbar from "./Navbar";
const PatientNav = () => {
  const element = [
    { pathname: "Home", path: "/home" },
    { pathname: "Appointment", path: "/appointment" },
    { pathname: "Emergency", path: "/emergency" },
    { pathname: "About", path: "/about" },
  ];
  return <Navbar items={element}></Navbar>;
};
export default PatientNav;
