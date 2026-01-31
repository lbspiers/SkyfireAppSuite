/**
 * useTeamSocket Hook
 * Handles real-time team event subscriptions via Socket.io
 * Extends the base useSocket hook with team-specific events
 */

import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import useSocket from './useSocket';

/**
 * Hook for subscribing to team events
 * @param {Object} options
 * @param {string} options.companyId - Company ID to filter events
 * @param {string} options.currentUserId - Current user UUID (to prevent duplicate toasts)
 * @param {Function} options.onMemberJoined - Callback when member joins
 * @param {Function} options.onMemberRemoved - Callback when member removed
 * @param {Function} options.onRoleChanged - Callback when role changes
 * @param {Function} options.onInviteSent - Callback when invite sent
 * @param {boolean} options.showToasts - Show toast notifications (default: true)
 */
const useTeamSocket = ({
  companyId,
  currentUserId,
  onMemberJoined,
  onMemberRemoved,
  onRoleChanged,
  onInviteSent,
  showToasts = true,
} = {}) => {
  const { socket, isConnected } = useSocket();
  const handlersRef = useRef({
    onMemberJoined,
    onMemberRemoved,
    onRoleChanged,
    onInviteSent,
  });

  // Keep handlers ref updated
  useEffect(() => {
    handlersRef.current = {
      onMemberJoined,
      onMemberRemoved,
      onRoleChanged,
      onInviteSent,
    };
  }, [onMemberJoined, onMemberRemoved, onRoleChanged, onInviteSent]);

  useEffect(() => {
    if (!socket || !isConnected || !companyId) return;

    // Join company room for team events
    socket.emit('join:company', { companyId });
    console.log('[TeamSocket] Joined company room:', companyId);

    // Member joined (accepted invite)
    const handleMemberJoined = (data) => {
      console.log('[TeamSocket] Member joined:', data);

      if (data.companyId !== companyId) return;

      // Don't show toast for own actions
      if (showToasts && data.triggeredBy !== currentUserId) {
        toast.success(
          `🎉 ${data.firstName} ${data.lastName} joined the team!`,
          { autoClose: 5000 }
        );
      }

      handlersRef.current.onMemberJoined?.(data);
    };

    // Member removed
    const handleMemberRemoved = (data) => {
      console.log('[TeamSocket] Member removed:', data);

      if (data.companyId !== companyId) return;

      // Don't show toast for own actions
      if (showToasts && data.triggeredBy !== currentUserId) {
        toast.info(
          `${data.firstName} ${data.lastName} was removed from the team`,
          { autoClose: 4000 }
        );
      }

      handlersRef.current.onMemberRemoved?.(data);
    };

    // Role changed
    const handleRoleChanged = (data) => {
      console.log('[TeamSocket] Role changed:', data);

      if (data.companyId !== companyId) return;

      // Don't show toast for own actions
      if (showToasts && data.triggeredBy !== currentUserId) {
        toast.info(
          `${data.firstName}'s role changed to ${data.newRole}`,
          { autoClose: 4000 }
        );
      }

      handlersRef.current.onRoleChanged?.(data);
    };

    // Invite sent (by another admin)
    const handleInviteSent = (data) => {
      console.log('[TeamSocket] Invite sent:', data);

      if (data.companyId !== companyId) return;

      // Don't show toast for own actions
      if (showToasts && data.triggeredBy !== currentUserId) {
        toast.info(
          `Invite sent to ${data.firstName} ${data.lastName}`,
          { autoClose: 3000 }
        );
      }

      handlersRef.current.onInviteSent?.(data);
    };

    // Subscribe to events
    socket.on('team:memberJoined', handleMemberJoined);
    socket.on('team:memberRemoved', handleMemberRemoved);
    socket.on('team:roleChanged', handleRoleChanged);
    socket.on('team:inviteSent', handleInviteSent);

    // Cleanup
    return () => {
      socket.off('team:memberJoined', handleMemberJoined);
      socket.off('team:memberRemoved', handleMemberRemoved);
      socket.off('team:roleChanged', handleRoleChanged);
      socket.off('team:inviteSent', handleInviteSent);
      socket.emit('leave:company', { companyId });
      console.log('[TeamSocket] Left company room:', companyId);
    };
  }, [socket, isConnected, companyId, currentUserId, showToasts]);

  return {
    socket,
    isConnected,
  };
};

export default useTeamSocket;
