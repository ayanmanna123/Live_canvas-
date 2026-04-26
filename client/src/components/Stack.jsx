import { motion, useMotionValue, useTransform } from 'framer-motion';
import React, { useState, useEffect, useMemo } from 'react';

function CardRotate({ children, onSendToBack, sensitivity, disableDrag = false }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(_, info) {
    const horizontalDrag = Math.abs(info.offset.x) > sensitivity;
    const verticalDrag = Math.abs(info.offset.y) > sensitivity;
    
    if (horizontalDrag || verticalDrag) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  if (disableDrag) {
    return (
      <motion.div className="absolute inset-0 cursor-pointer" style={{ x: 0, y: 0 }}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}>
      {children}
    </motion.div>
  );
}

export default function Stack({
  randomRotation = false,
  sensitivity = 80,
  cards = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  const shouldDisableDrag = mobileClickOnly && isMobile;
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;

  // Use a ref to track if cards have actually changed to avoid reset loops
  const [stack, setStack] = useState([]);

  useEffect(() => {
    if (cards && cards.length > 0) {
      setStack(cards.map((content, index) => ({ 
        id: `card-${index}-${Date.now()}`, // Unique ID
        content 
      })));
    }
  }, [cards]);

  const sendToBack = id => {
    setStack(prev => {
      const newStack = [...prev];
      const index = newStack.findIndex(card => card.id === id);
      if (index === -1) return prev;
      const [card] = newStack.splice(index, 1);
      newStack.unshift(card);
      return newStack;
    });
  };

  useEffect(() => {
    if (autoplay && stack.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        const topCardId = stack[stack.length - 1].id;
        sendToBack(topCardId);
      }, autoplayDelay);

      return () => clearInterval(interval);
    }
  }, [autoplay, autoplayDelay, stack, isPaused]);

  if (stack.length === 0) return null;

  return (
    <div
      className="relative w-full h-full"
      style={{
        perspective: 600
      }}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}>
      {stack.map((card, index) => {
        const isTop = index === stack.length - 1;
        const offset = stack.length - index - 1;
        const rotateZ = isTop ? 0 : offset * 4 + (randomRotation ? (Math.sin(index) * 4) : 0);
        
        return (
          <CardRotate
            key={card.id}
            onSendToBack={() => sendToBack(card.id)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}>
            <motion.div
              className="rounded-2xl overflow-hidden w-full h-full bg-white shadow-xl border border-rose-100"
              onClick={() => shouldEnableClick && sendToBack(card.id)}
              animate={{
                rotateZ,
                scale: isTop ? 1 : 1 - offset * 0.05,
                x: isTop ? 0 : offset * 12,
                y: isTop ? 0 : offset * -6,
                zIndex: index,
                transformOrigin: 'center'
              }}
              initial={false}
              transition={{
                type: 'spring',
                stiffness: animationConfig.stiffness,
                damping: animationConfig.damping
              }}>
              {card.content}
            </motion.div>
          </CardRotate>
        );
      })}
    </div>
  );
}
