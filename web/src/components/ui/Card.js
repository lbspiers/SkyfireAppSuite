import React from 'react';
import styles from './Card.module.css';

const Card = ({
  children,
  variant = 'default',  // default, elevated, outlined, glass
  padding = 'md',       // none, sm, md, lg
  hover = false,        // Enable hover effect
  onClick,
  className = '',
  ...props
}) => {
  const isClickable = !!onClick;

  return (
    <div
      className={`
        ${styles.card}
        ${styles[variant]}
        ${styles[`padding-${padding}`]}
        ${hover || isClickable ? styles.hoverable : ''}
        ${isClickable ? styles.clickable : ''}
        ${className}
      `.trim()}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick(e) : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`${styles.header} ${className}`}>{children}</div>
);

const CardBody = ({ children, className = '' }) => (
  <div className={`${styles.body} ${className}`}>{children}</div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`${styles.footer} ${className}`}>{children}</div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
