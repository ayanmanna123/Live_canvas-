import React, { useEffect, useState } from 'react';

const FloatingHearts = () => {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    const createHeart = () => {
      const id = Math.random().toString(36).substr(2, 9);
      const size = Math.random() * 20 + 10;
      const left = Math.random() * 100;
      const duration = Math.random() * 10 + 10;
      const delay = Math.random() * 5;
      
      return { id, size, left, duration, delay };
    };

    const interval = setInterval(() => {
      setHearts(prev => {
        const newHeart = createHeart();
        if (prev.length > 20) return [...prev.slice(1), newHeart];
        return [...prev, newHeart];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden opacity-40">
      {hearts.map(h => (
        <div
          key={h.id}
          className="absolute bottom-[-50px] animate-float-up text-rose-300"
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  );
};

export default FloatingHearts;
