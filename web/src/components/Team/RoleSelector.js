import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import styles from './RoleSelector.module.css';

/**
 * RoleSelector - Multi-select dropdown grouped by category
 */
const RoleSelector = ({
  roles = { solar_ops: [], corporate: [], internal: [] },
  selectedRoleIds = [],
  onChange,
  disabled = false,
  hideInternal = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleRole = (roleId) => {
    if (disabled) return;
    const newSelection = selectedRoleIds.includes(roleId)
      ? selectedRoleIds.filter(id => id !== roleId)
      : [...selectedRoleIds, roleId];
    onChange(newSelection);
  };

  const removeRole = (roleId, e) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedRoleIds.filter(id => id !== roleId));
  };

  const getSelectedRoles = () => {
    const allRoles = [
      ...(roles.solar_ops || []),
      ...(roles.corporate || []),
      ...(!hideInternal ? (roles.internal || []) : [])
    ];
    return allRoles.filter(role => selectedRoleIds.includes(role.id));
  };

  const categoryLabels = {
    solar_ops: 'Solar Operations',
    corporate: 'Corporate',
    internal: 'Internal'
  };

  const categoryOrder = hideInternal
    ? ['solar_ops', 'corporate']
    : ['solar_ops', 'corporate', 'internal'];

  return (
    <div className={styles.container} ref={dropdownRef}>
      <div
        className={`${styles.trigger} ${disabled ? styles.disabled : ''} ${isOpen ? styles.open : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className={styles.selectedRoles}>
          {getSelectedRoles().length === 0 ? (
            <span className={styles.placeholder}>Select roles...</span>
          ) : (
            getSelectedRoles().map(role => (
              <span key={role.id} className={`${styles.tag} ${styles[role.category]}`}>
                {role.displayName}
                {!disabled && (
                  <button className={styles.tagRemove} onClick={(e) => removeRole(role.id, e)}>
                    <X size={12} />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {categoryOrder.map(category => {
            const categoryRoles = roles[category] || [];
            if (categoryRoles.length === 0) return null;

            return (
              <div key={category} className={styles.category}>
                <div className={styles.categoryHeader}>{categoryLabels[category]}</div>
                {categoryRoles.map(role => (
                  <div
                    key={role.id}
                    className={`${styles.option} ${selectedRoleIds.includes(role.id) ? styles.selected : ''}`}
                    onClick={() => toggleRole(role.id)}
                  >
                    <div className={styles.checkbox}>
                      {selectedRoleIds.includes(role.id) && <Check size={14} />}
                    </div>
                    <div className={styles.optionContent}>
                      <span className={styles.optionName}>{role.displayName}</span>
                      {role.description && <span className={styles.optionDesc}>{role.description}</span>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
