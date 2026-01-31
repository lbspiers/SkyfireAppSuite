import React from 'react';
import styles from './Avatar.module.css';

const Avatar = ({
  src,
  alt = '',
  name,              // Fallback to initials
  size = 'md',       // xs, sm, md, lg, xl
  status,            // online, offline, busy, away
  shape = 'circle',  // circle, square
  className = '',
  onClick,
}) => {
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getColorFromName = (name) => {
    if (!name) return 0;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 5;
  };

  const colorIndex = getColorFromName(name);
  const isClickable = !!onClick;

  return (
    <div
      className={`
        ${styles.avatar}
        ${styles[size]}
        ${styles[shape]}
        ${styles[`color${colorIndex}`]}
        ${isClickable ? styles.clickable : ''}
        ${className}
      `.trim()}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {src ? (
        <img src={src} alt={alt || name || 'Avatar'} className={styles.image} />
      ) : (
        <span className={styles.initials}>{getInitials(name)}</span>
      )}

      {status && (
        <span className={`${styles.status} ${styles[`status-${status}`]}`} />
      )}
    </div>
  );
};

const AvatarGroup = ({ children, max = 4, size = 'md', className = '' }) => {
  const avatars = React.Children.toArray(children);
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={`${styles.group} ${className}`}>
      {visible.map((avatar, index) => (
        <div key={index} className={styles.groupItem} style={{ zIndex: max - index }}>
          {React.cloneElement(avatar, { size })}
        </div>
      ))}
      {remaining > 0 && (
        <div className={`${styles.avatar} ${styles[size]} ${styles.circle} ${styles.remaining}`}>
          <span className={styles.initials}>+{remaining}</span>
        </div>
      )}
    </div>
  );
};

Avatar.Group = AvatarGroup;
export default Avatar;
