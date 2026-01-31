import React from 'react';
import styles from '../../styles/Chatter.module.css';

/**
 * UserAvatar - Display user avatar with gradient initials fallback
 *
 * @param {object} user - User object with firstName and lastName
 * @param {string} size - 'xs', 'sm', 'md', or 'lg' (20px, 28px, 36px, 48px)
 * @param {boolean} showTooltip - Show name on hover
 */
const UserAvatar = ({ user, size = 'md', showTooltip = false }) => {
  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`;
  };

  const getAvatarGradient = (name) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    ];

    // Simple hash based on name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const initials = getInitials(user.firstName, user.lastName);
  const gradient = getAvatarGradient(fullName || 'User');

  const sizeClass = size === 'xs' ? styles.avatarXs : size === 'sm' ? styles.avatarSm : size === 'lg' ? styles.avatarLg : styles.avatarMd;

  return (
    <div
      className={`${styles.avatar} ${sizeClass}`}
      style={{ background: gradient }}
      title={showTooltip ? fullName : undefined}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
