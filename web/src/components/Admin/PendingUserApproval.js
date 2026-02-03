/**
 * PendingUserApproval Component
 * Displays list of pending users awaiting approval for super admins
 */

import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import { Button, LoadingSpinner, EmptyState, Alert } from '../ui';
import ApprovalModal from './ApprovalModal';
import styles from './PendingUserApproval.module.css';
import { toast } from 'react-toastify';

const PendingUserApproval = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvingUser, setApprovingUser] = useState(null);
  const [modalStatus, setModalStatus] = useState(null);

  // Fetch pending users on mount
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await adminAPI.getPendingUsers();
      // Filter for status = 1 (pending)
      const pending = Array.isArray(users) ? users.filter(u => u.status === 1) : [];
      setPendingUsers(pending);
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
      setError('Failed to load pending users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user) => {
    setApprovingUser(user);
    setModalStatus('approving');

    try {
      const response = await adminAPI.approveUser(user.id);

      setModalStatus('sending-email');

      // Check email status from response
      setTimeout(() => {
        if (response.data?.emailSent) {
          setModalStatus('success');
          toast.success(`${user.first_name} ${user.last_name} has been approved`);
        } else {
          setModalStatus('email-failed');
          console.warn('User approved but email failed:', response.data?.emailError);
        }

        // Remove user from list after a delay
        setTimeout(() => {
          setPendingUsers(prev => prev.filter(u => u.id !== user.id));
          handleCloseModal();
        }, 2000);
      }, 1000);

    } catch (err) {
      console.error('Failed to approve user:', err);
      setModalStatus('error');
      toast.error('Failed to approve user. Please try again.');
      setTimeout(() => handleCloseModal(), 2000);
    }
  };

  const handleReject = async (user) => {
    if (!window.confirm(`Are you sure you want to reject ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    try {
      await adminAPI.rejectUser(user.uuid);
      setPendingUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success(`${user.first_name} ${user.last_name} has been rejected`);
    } catch (err) {
      console.error('Failed to reject user:', err);
      toast.error('Failed to reject user. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setApprovingUser(null);
    setModalStatus(null);
  };

  // Filter users based on search query
  const filteredUsers = pendingUsers.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.company_name?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Pending User Approvals</h3>
        </div>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Pending User Approvals</h3>
          <p className={styles.subtitle}>
            Review and approve users who have registered and are awaiting access
          </p>
        </div>
        {pendingUsers.length > 0 && (
          <span className={styles.badge}>{pendingUsers.length} pending</span>
        )}
      </div>

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {pendingUsers.length > 0 && (
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <EmptyState
          icon="✓"
          title="No Pending Approvals"
          message="All users have been reviewed. New registrations will appear here."
        />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Results Found"
          message="Try a different search term"
        />
      ) : (
        <div className={styles.userList}>
          {filteredUsers.map(user => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}>
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <div className={styles.userDetails}>
                  <div className={styles.userName}>
                    {user.first_name} {user.last_name}
                  </div>
                  <div className={styles.userCompany}>{user.company_name}</div>
                  <div className={styles.userContact}>
                    <span>{user.email}</span>
                    {user.phone_no && <span> • {user.phone_no}</span>}
                  </div>
                  <div className={styles.userMeta}>
                    Registered {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className={styles.userActions}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(user)}
                >
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReject(user)}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approvingUser && (
        <ApprovalModal
          user={approvingUser}
          status={modalStatus}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default PendingUserApproval;
