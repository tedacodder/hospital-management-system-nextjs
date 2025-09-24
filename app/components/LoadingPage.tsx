// components/LoadingPage.tsx
"use client";
import { motion } from "framer-motion";
import { FaHospital } from "react-icons/fa";

export default function LoadingPage() {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light dark-mode-bg">
      <motion.div
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <FaHospital size={80} className="text-primary mb-4" />
      </motion.div>
      <motion.div
        className="d-flex"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
      >
        <span className="dot bg-primary mx-1 rounded-circle"></span>
        <span className="dot bg-primary mx-1 rounded-circle"></span>
        <span className="dot bg-primary mx-1 rounded-circle"></span>
      </motion.div>

      <style jsx>{`
        .dot {
          width: 12px;
          height: 12px;
        }
        .dark-mode-bg {
          background-color: #121212;
          color: #e0e0e0;
        }
      `}</style>
    </div>
  );
}
