import React, { useEffect, useState } from 'react';
import UserAvatar from './UserAvatar';
import styles from '../../styles/Chatter.module.css';

/**
 * MentionDropdown - Autocomplete for @mentions with grouping
 *
 * @param {string} searchTerm - Search query for filtering users
 * @param {function} onSelect - Callback when user is selected
 * @param {function} onClose - Callback to close dropdown
 * @param {array} users - List of users to display (pre-sorted with current user first)
 */
const MentionDropdown = ({ searchTerm, onSelect, onClose, users = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [groupedUsers, setGroupedUsers] = useState({ self: null, skyfire: [], team: [] });

  useEffect(() => {
    // Filter users by search term
    const filtered = users.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });

    // Group users for display
    const grouped = {
      self: filtered.find(u => u.isSelf) || null,
      skyfire: filtered.filter(u => !u.isSelf && u.isSkyfireAdmin),
      team: filtered.filter(u => !u.isSelf && !u.isSkyfireAdmin)
    };

    setGroupedUsers(grouped);
    setFilteredUsers(filtered);
    setSelectedIndex(0);
  }, [searchTerm, users]);

  useEffect(() => {
    // Handle keyboard navigation
    const handleKeyDown = (e) => {
      if (filteredUsers.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredUsers.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            onSelect(filteredUsers[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredUsers, selectedIndex, onSelect, onClose]);

  if (filteredUsers.length === 0) {
    return (
      <div className={styles.mentionDropdown}>
        <div className={styles.mentionNoResults}>
          {users.length === 0
            ? 'Loading users...'
            : `No users matching "${searchTerm}"`}
        </div>
      </div>
    );
  }

  const renderUserItem = (user, index) => (
    <div
      key={user.uuid}
      className={`${styles.mentionItem} ${index === selectedIndex ? styles.mentionItemActive : ''}`}
      onClick={() => onSelect(user)}
      onMouseEnter={() => setSelectedIndex(index)}
    >
      <UserAvatar user={user} size="sm" />
      <div className={styles.mentionItemInfo}>
        <div className={styles.mentionItemName}>
          {user.firstName} {user.lastName}
          {user.isSelf && <span className={styles.mentionBadgeSelf}>(You)</span>}
          {user.isSkyfireAdmin && !user.isSelf && (
            <span className={styles.mentionBadgeSkyfire}>Skyfire Support</span>
          )}
        </div>
        {user.role && (
          <div className={styles.mentionItemRole}>{user.role}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.mentionDropdown}>
      {/* Self */}
      {groupedUsers.self && (
        <>
          <div className={styles.mentionGroupHeader}>You</div>
          {renderUserItem(groupedUsers.self, 0)}
        </>
      )}

      {/* Skyfire Support */}
      {groupedUsers.skyfire.length > 0 && (
        <>
          <div className={styles.mentionGroupHeader}>Skyfire Support</div>
          {groupedUsers.skyfire.map((user, idx) => {
            const globalIndex = (groupedUsers.self ? 1 : 0) + idx;
            return renderUserItem(user, globalIndex);
          })}
        </>
      )}

      {/* Team Members */}
      {groupedUsers.team.length > 0 && (
        <>
          <div className={styles.mentionGroupHeader}>Team Members</div>
          {groupedUsers.team.map((user, idx) => {
            const globalIndex =
              (groupedUsers.self ? 1 : 0) +
              groupedUsers.skyfire.length +
              idx;
            return renderUserItem(user, globalIndex);
          })}
        </>
      )}
    </div>
  );
};

export default MentionDropdown;
