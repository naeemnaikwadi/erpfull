import React from 'react';

const AnimatedCard = ({ 
  children, 
  className = '', 
  hoverEffect = true, 
  staggerDelay = 0,
  onClick 
}) => {
  const baseClasses = `
    bg-white dark:bg-gray-800 
    rounded-lg 
    shadow-md 
    border border-gray-200 dark:border-gray-700
    transition-all duration-300 ease-out
    ${hoverEffect ? 'card-hover cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const handleClick = (e) => {
    if (onClick) {
      // Add ripple effect
      const button = e.currentTarget;
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        pointer-events: none;
      `;
      
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
      
      onClick(e);
    }
  };

  return (
    <div 
      className={baseClasses}
      onClick={handleClick}
      style={{ 
        animationDelay: `${staggerDelay}s`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
