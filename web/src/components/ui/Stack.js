import React from 'react';
import styles from './Stack.module.css';

const Stack = ({
  children,
  gap = 'md',          // xs, sm, md, lg, xl, none
  align = 'stretch',   // start, center, end, stretch
  justify = 'start',   // start, center, end, between, around
  wrap = false,
  dividers = false,
  className = '',
  as: Component = 'div',
  ...props
}) => {
  const childArray = React.Children.toArray(children).filter(Boolean);

  return (
    <Component
      className={`
        ${styles.stack}
        ${styles[`gap-${gap}`]}
        ${styles[`align-${align}`]}
        ${styles[`justify-${justify}`]}
        ${wrap ? styles.wrap : ''}
        ${className}
      `.trim()}
      {...props}
    >
      {dividers ? (
        childArray.map((child, index) => (
          <React.Fragment key={index}>
            {index > 0 && <div className={styles.divider} />}
            {child}
          </React.Fragment>
        ))
      ) : (
        children
      )}
    </Component>
  );
};

export default Stack;
