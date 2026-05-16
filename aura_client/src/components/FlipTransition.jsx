"use client";

import { motion } from "framer-motion";

const FlipTransition = ({ children, direction = "right" }) => {
  // Define animation variants based on direction
  // "right" = coming from the right (Signup)
  // "left" = coming from the left (Login)
  
  const variants = {
    initial: { 
      rotateY: direction === "right" ? 90 : -90, 
      opacity: 0 
    },
    animate: { 
      rotateY: 0, 
      opacity: 1 
    },
    exit: { 
      rotateY: direction === "right" ? -90 : 90, 
      opacity: 0 
    }
  };

  return (
    <div className="w-full h-full perspective-2000 overflow-hidden bg-[#050505]">
      <motion.div
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ 
          duration: 0.6, 
          ease: "easeInOut", // Smoother for flips than spring
        }}
        className="w-full h-full transform-style-3d origin-center"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default FlipTransition;