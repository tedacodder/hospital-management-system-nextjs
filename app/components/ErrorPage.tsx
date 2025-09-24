// components/ErrorPage.tsx
"use client";
import { motion } from "framer-motion";
import { FaExclamationTriangle } from "react-icons/fa";

export default function ErrorPage({
  message = "Something went wrong!",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light dark-mode-bg">
      <motion.div
        animate={{ rotate: [0, 10, -10, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <FaExclamationTriangle size={80} className="text-danger mb-4" />
      </motion.div>
      <h2 className="mb-3">{message}</h2>
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary"
          onClick={onRetry}
        >
          Retry
        </motion.button>
      )}

      <style jsx>{`
        .dark-mode-bg {
          background-color: #121212;
          color: #e0e0e0;
        }
      `}</style>
    </div>
  );
}
