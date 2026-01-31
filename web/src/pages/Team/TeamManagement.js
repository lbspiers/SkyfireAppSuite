/**
 * Team Management Screen
 * Unified view of active members and pending invites
 * With inline role editing and real-time socket notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getCompanyUsers,
  deleteCompanyUser,
  resendInviteCode,
  updateUserRole,
} from '../../services/teamService';
import useTeamSocket from '../../hooks/useTeamSocket';
import useTeamSuggestions from '../../hooks/useTeamSuggestions';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Dropdown from '../../components/ui/Dropdown';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AddUserModal from '../../components/Team/AddUserModal';
import TeamSuggestionCard from '../../components/Team/TeamSuggestionCard';
import styles from './TeamManagement.module.css';

// Available roles - matches backend role table
const ROLES = [
  { id: 1, name: 'Admin', icon: 'ri-shield-star-line' },
  { id: 2, name: 'Designer', icon: 'ri-layout-line' },
  { id: 3, name: 'Surveyor', icon: 'ri-map-pin-line' },
  { id: 4, name: 'Drafter', icon: 'ri-draft-line' },
  { id: 5, name: 'Installer', icon: 'ri-tools-line' },
  { id: 6, name: 'Sales', icon: 'ri-money-dollar-circle-line' },
  { id: 7, name: 'Viewer', icon: 'ri-eye-line' },
];

const TeamManagement = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]); // Optional: load from API for project-aware suggestions
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentCompanyId, setCurrentCompanyId] = useState(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);

  // Debug: Log modal state changes
  useEffect(() => {
    console.log('[TeamManagement] showAddModal state changed to:', showAddModal);
  }, [showAddModal]);
  const [preselectedRole, setPreselectedRole] = useState(null); // For suggestion clicks
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  // Get current user info on mount
  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    setCurrentUserId(userData.uuid || userData.id);
    setCurrentCompanyId(userData.companyId || userData.company_id);

    // Check if current user is admin
    const isAdmin =
      userData.isSuperAdmin === true ||
      userData.isSuperUser === true ||
      userData.is_super_user === true ||
      userData.is_company_admin === true ||
      userData.isCompanyAdmin === true;

    setIsCurrentUserAdmin(isAdmin);

    // Check if current user is super admin
    const isSuperAdminUser = userData.isSuperAdmin === true;
    setIsSuperAdmin(isSuperAdminUser);

    if (!isAdmin) {
      toast.error('You do not have permission to manage team members');
      navigate('/dashboard');
      return;
    }

    loadMembers();
  }, [navigate]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCompanyUsers();
      if (result.status === 'SUCCESS' && result.data) {
        // Sort: current user first, then by name
        const sorted = [...result.data].sort((a, b) => {
          if (a.uuid === currentUserId) return -1;
          if (b.uuid === currentUserId) return 1;
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        });
        setMembers(sorted);
      }
    } catch (error) {
      console.error('[TeamManagement] Error:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Real-time socket events
  const { isConnected } = useTeamSocket({
    companyId: currentCompanyId,
    currentUserId: currentUserId,
    showToasts: true,

    onMemberJoined: useCallback((data) => {
      console.log('[TeamManagement] Socket: Member joined', data);
      // Add new member to list or update status to active
      setMembers(prev => {
        // Check if already exists (was pending invite)
        const existingIndex = prev.findIndex(m =>
          m.uuid === data.uuid || m.email === data.email
        );

        if (existingIndex !== -1) {
          // Update existing (change status to active)
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            uuid: data.uuid,
            status: 2,
            role_name: data.role,
            role_id: data.roleId,
          };
          return updated;
        }

        // Add new member
        return [...prev, {
          uuid: data.uuid,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          role_name: data.role,
          role_id: data.roleId,
          status: 2,
          created_at: new Date().toISOString(),
        }];
      });
    }, []),

    onMemberRemoved: useCallback((data) => {
      console.log('[TeamManagement] Socket: Member removed', data);
      // Remove from list
      setMembers(prev => prev.filter(m => m.uuid !== data.uuid));
    }, []),

    onRoleChanged: useCallback((data) => {
      console.log('[TeamManagement] Socket: Role changed', data);
      // Update role in list
      setMembers(prev => prev.map(m =>
        m.uuid === data.uuid
          ? { ...m, role_name: data.newRole, role_id: data.newRoleId }
          : m
      ));
    }, []),

    onInviteSent: useCallback((data) => {
      console.log('[TeamManagement] Socket: Invite sent', data);
      // Add pending invite to list
      setMembers(prev => {
        // Check if already exists
        if (prev.some(m => m.email === data.email)) {
          return prev;
        }

        return [...prev, {
          uuid: data.uuid || `pending-${Date.now()}`,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          role_name: data.role,
          role_id: data.roleId,
          status: 1, // Pending
          created_at: new Date().toISOString(),
        }];
      });
    }, []),
  });

  // Smart suggestions
  const {
    suggestions,
    dismissSuggestion,
    hasSuggestions,
  } = useTeamSuggestions({
    members,
    projects, // Pass projects if available
    enabled: isCurrentUserAdmin,
  });

  // Handle suggestion action - open modal with preselected role
  const handleSuggestionAction = (role) => {
    // Find role ID
    const roleObj = ROLES.find(r => r.name === role);
    setPreselectedRole(roleObj?.id || null);
    setShowAddModal(true);
  };

  const handleRoleChange = async (member, newRoleId) => {
    // Optimistic update
    const previousMembers = [...members];
    const newRole = ROLES.find(r => r.id === newRoleId);

    setMembers(prev => prev.map(m =>
      m.uuid === member.uuid
        ? { ...m, role_id: newRoleId, role_name: newRole?.name || 'Team Member' }
        : m
    ));

    try {
      const result = await updateUserRole(member.uuid, newRoleId);
      if (result.status === 'SUCCESS') {
        toast.success(`${member.first_name}'s role updated to ${newRole?.name}`);
      } else {
        // Revert on failure
        setMembers(previousMembers);
        toast.error(result.message || 'Failed to update role');
      }
    } catch (error) {
      // Revert on error
      setMembers(previousMembers);
      toast.error(error?.message || 'Failed to update role');
    }
  };

  const handleResendInvite = async (member) => {
    try {
      const result = await resendInviteCode(member.email);
      if (result.status === 'SUCCESS') {
        toast.success(`Invite sent to ${member.email}`);
      } else {
        toast.error(result.message || 'Failed to resend invite');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to resend invite');
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setRemoving(true);
    try {
      const result = await deleteCompanyUser(memberToRemove.uuid);
      if (result.status === 'SUCCESS') {
        toast.success('Team member removed');
        setShowRemoveModal(false);
        setMemberToRemove(null);
        // Remove from local state (socket will notify others)
        setMembers(prev => prev.filter(m => m.uuid !== memberToRemove.uuid));
      } else {
        toast.error(result.message || 'Failed to remove member');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to remove member');
    } finally {
      setRemoving(false);
    }
  };

  const openRemoveModal = (member) => {
    setMemberToRemove(member);
    setShowRemoveModal(true);
  };

  // Separate active vs pending
  const activeMembers = members.filter(m => m.status === 2);
  const pendingMembers = members.filter(m => m.status !== 2);

  // Stats
  const stats = {
    total: members.length,
    active: activeMembers.length,
    pending: pendingMembers.length,
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Team</h1>
          <p className={styles.subtitle}>
            {stats.total} {stats.total === 1 ? 'member' : 'members'}
            {stats.pending > 0 && ` · ${stats.pending} pending`}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            console.log('[TeamManagement] Add Member clicked');
            setPreselectedRole(null);
            setShowAddModal(true);
            console.log('[TeamManagement] showAddModal set to true');
          }}
        >
          <i className="ri-user-add-line" /> Add Member
        </Button>
      </div>

      {/* Smart Suggestions */}
      {hasSuggestions && (
        <div className={styles.suggestionsSection}>
          {suggestions.map(suggestion => (
            <TeamSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAction={handleSuggestionAction}
              onDismiss={dismissSuggestion}
            />
          ))}
        </div>
      )}

      {/* Live indicator */}
      {isConnected && currentCompanyId && (
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          <span>Live updates enabled</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="lg" label="Loading team..." />
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No team members yet"
          description="Invite people to collaborate on projects"
          action={
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <i className="ri-user-add-line" /> Add First Member
            </Button>
          }
        />
      ) : (
        <div className={styles.memberList}>
          {/* Active Members */}
          {activeMembers.map((member) => (
            <MemberRow
              key={member.uuid}
              member={member}
              isCurrentUser={member.uuid === currentUserId}
              canEditRole={isCurrentUserAdmin && member.uuid !== currentUserId}
              onRoleChange={handleRoleChange}
              onResendInvite={handleResendInvite}
              onRemove={openRemoveModal}
            />
          ))}

          {/* Pending Section */}
          {pendingMembers.length > 0 && (
            <>
              <div className={styles.sectionDivider}>
                <span>Pending Invites ({pendingMembers.length})</span>
              </div>
              {pendingMembers.map((member) => (
                <MemberRow
                  key={member.uuid}
                  member={member}
                  isPending
                  canEditRole={isCurrentUserAdmin}
                  onRoleChange={handleRoleChange}
                  onResendInvite={handleResendInvite}
                  onRemove={openRemoveModal}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setPreselectedRole(null);
        }}
        onUserAdded={() => {
          setShowAddModal(false);
          setPreselectedRole(null);
          loadMembers();
        }}
        preselectedRole={preselectedRole}
        isSuperAdmin={isSuperAdmin}
        currentCompanyId={currentCompanyId}
      />

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        title="Remove Team Member"
        size="sm"
        footer={
          <div className={styles.modalFooter}>
            <Button
              variant="ghost"
              onClick={() => setShowRemoveModal(false)}
              disabled={removing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRemoveMember}
              loading={removing}
            >
              Remove
            </Button>
          </div>
        }
      >
        {memberToRemove && (
          <div className={styles.removeConfirm}>
            <p>
              Are you sure you want to remove{' '}
              <strong>{memberToRemove.first_name} {memberToRemove.last_name}</strong>?
            </p>
            <p className={styles.removeWarning}>
              They will lose access to all company projects and data.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

/**
 * MemberRow Component
 * Displays a single team member with inline role editing
 */
const MemberRow = ({
  member,
  isCurrentUser = false,
  isPending = false,
  canEditRole = false,
  onRoleChange,
  onResendInvite,
  onRemove
}) => {
  const fullName = `${member.first_name} ${member.last_name}`;

  // Find current role
  const currentRole = ROLES.find(r => r.id === member.role_id) ||
                      ROLES.find(r => r.name === member.role_name) ||
                      { id: 0, name: member.role_name || 'Team Member', icon: 'ri-user-line' };

  const getStatusVariant = () => {
    if (member.status === 2) return 'active';
    if (member.status === 1) return 'pending';
    if (member.status === 0) return 'inactive';
    return 'pending';
  };

  const getStatusLabel = () => {
    if (member.status === 2) return 'Active';
    if (member.status === 1) return 'Invite Sent';
    if (member.status === 0) return 'Deactivated';
    return 'Pending';
  };

  return (
    <div className={`${styles.memberRow} ${isPending ? styles.pendingRow : ''}`}>
      {/* Avatar + Identity */}
      <div className={styles.memberIdentity}>
        <Avatar
          name={fullName}
          size="md"
          status={member.status === 2 ? 'online' : undefined}
        />
        <div className={styles.memberInfo}>
          <span className={styles.memberName}>
            {fullName}
            {isCurrentUser && <span className={styles.youBadge}>(you)</span>}
          </span>
          <span className={styles.memberEmail}>{member.email}</span>
        </div>
      </div>

      {/* Role - Editable or Static */}
      <div className={styles.memberRole}>
        {canEditRole ? (
          <RoleSelector
            currentRole={currentRole}
            onSelect={(roleId) => onRoleChange(member, roleId)}
          />
        ) : (
          <span className={styles.roleLabel}>
            <i className={currentRole.icon} />
            {currentRole.name}
          </span>
        )}
      </div>

      {/* Status */}
      <div className={styles.memberStatus}>
        <StatusBadge
          status={getStatusVariant()}
          label={getStatusLabel()}
          size="sm"
        />
      </div>

      {/* Actions */}
      <div className={styles.memberActions}>
        {!isCurrentUser && (
          <Dropdown
            trigger={
              <button className={styles.actionButton}>
                <i className="ri-more-2-fill" />
              </button>
            }
            align="right"
          >
            {isPending && (
              <Dropdown.Item
                icon={<i className="ri-mail-send-line" />}
                onClick={() => onResendInvite(member)}
              >
                Resend Invite
              </Dropdown.Item>
            )}
            <Dropdown.Item
              icon={<i className="ri-user-unfollow-line" />}
              danger
              onClick={() => onRemove(member)}
            >
              Remove
            </Dropdown.Item>
          </Dropdown>
        )}
      </div>
    </div>
  );
};

/**
 * RoleSelector Component
 * Inline dropdown for changing user roles
 */
const RoleSelector = ({ currentRole, onSelect }) => {
  return (
    <Dropdown
      trigger={
        <button className={styles.roleSelectorTrigger}>
          <i className={currentRole.icon} />
          <span>{currentRole.name}</span>
          <i className="ri-arrow-down-s-line" />
        </button>
      }
      align="left"
      closeOnClick={true}
    >
      <Dropdown.Label>Change Role</Dropdown.Label>
      {ROLES.map((role) => (
        <Dropdown.Item
          key={role.id}
          icon={<i className={role.icon} />}
          onClick={() => onSelect(role.id)}
          className={role.id === currentRole.id ? styles.roleItemActive : ''}
        >
          {role.name}
          {role.id === currentRole.id && (
            <i className={`ri-check-line ${styles.roleCheckmark}`} />
          )}
        </Dropdown.Item>
      ))}
    </Dropdown>
  );
};

export default TeamManagement;
