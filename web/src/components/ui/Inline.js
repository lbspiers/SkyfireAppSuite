import React from 'react';
import styles from './Inline.module.css';

const Inline = ({
  children,
  gap = 'md',          // xs, sm, md, lg, xl, none
  align = 'center',    // start, center, end, stretch, baseline
  justify = 'start',   // start, center, end, between, around
  wrap = true,
  className = '',
  as: Component = 'div',
  ...props
}) => {
  return (
    <Component
      className={`
        ${styles.inline}
        ${styles[`gap-${gap}`]}
        ${styles[`align-${align}`]}
        ${styles[`justify-${justify}`]}
        ${wrap ? styles.wrap : ''}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Inline;
