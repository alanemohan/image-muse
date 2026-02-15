import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import React, { useRef } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard = ({
  children,
  className,
  hoverEffect = true,
  ...props
}: GlassCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Motion values for 3D tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !hoverEffect) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;
    
    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    if (!hoverEffect) return;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md shadow-xl transition-all duration-200",
        className
      )}
      style={{
        rotateX: hoverEffect ? rotateX : 0,
        rotateY: hoverEffect ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      initial={hoverEffect ? { scale: 1 } : undefined}
      whileHover={
        hoverEffect
          ? {
              scale: 1.02,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              borderColor: "rgba(255, 255, 255, 0.2)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(6, 182, 212, 0.1)",
            }
          : undefined
      }
      transition={{ duration: 0.3, ease: "easeOut" }}
      {...props}
    >
      {/* 3D Depth Elements */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" 
        style={{ transform: "translateZ(20px)" }}
      />
      
      {/* Content */}
      <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>{children}</div>
    </motion.div>
  );
};
