import React from 'react';

const CONFETTI_COUNT = 50;

const Confetti: React.FC = () => {
  const confetti = Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
    const style = {
      left: `${Math.random() * 100}vw`,
      animationDuration: `${Math.random() * 3 + 2}s`,
      animationDelay: `${Math.random() * 2}s`,
      backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
    };
    return <div key={i} className="confetti-piece" style={style} />;
  });

  return <div className="confetti-container">{confetti}</div>;
};

export default Confetti;
