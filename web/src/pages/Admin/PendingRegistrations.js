import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  verifyAdminAccess
} from '../../services/adminService';
import { showSuccessToast, showErrorToast } from '../../utils/errorHandling';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import styles from './PendingRegistrations.module.css';

const PendingRegistrations = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, user: null });
  const [rejectReason, setRejectReason] = useState('');

  // Verify admin access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        await verifyAdminAccess();
      } catch (error) {
        showErrorToast(error, 'You do not have admin access');
        navigate('/dashboard');
      }
    };
    checkAccess();
  }, [navigate]);

  // Fetch pending users
  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPendingRegistrations();
      setPendingUsers(response.data || response || []);
    } catch (error) {
      showErrorToast(error, 'Failed to fetch pending registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  // Handle approve
  const handleApprove = async (userId) => {
    try {
      setActionLoading(userId);
      const result = await approveRegistration(userId);
      showSuccessToast(result.message || 'User approved successfully');
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      showErrorToast(error, 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!rejectModal.user) return;

    try {
      setActionLoading(rejectModal.user.id);
      const result = await rejectRegistration(rejectModal.user.id, rejectReason);
      showSuccessToast(result.message || 'User rejected');
      setPendingUsers(prev => prev.filter(u => u.id !== rejectModal.user.id));
      setRejectModal({ open: false, user: null });
      setRejectReason('');
    } catch (error) {
      showErrorToast(error, 'Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Pending Registrations</h1>
        <p className={styles.subtitle}>
          {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} awaiting approval
        </p>
      </div>

      {pendingUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✅</div>
          <h2>All caught up!</h2>
          <p>No pending registrations to review.</p>
        </div>
      ) : (
        <div className={styles.userList}>
          {pendingUsers.map(user => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.userInfo}>
                <div className={styles.userName}>
                  {user.first_name} {user.last_name}
                </div>
                <div className={styles.companyName}>
                  {user.company_name || 'No company'}
                </div>
                <div className={styles.userDetails}>
                  <span>📧 {user.email}</span>
                  {user.phone_no && <span>📞 {user.phone_no}</span>}
                </div>
                <div className={styles.registeredAt}>
                  Registered: {formatDate(user.created_at)}
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.approveBtn}
                  onClick={() => handleApprove(user.id)}
                  disabled={actionLoading === user.id}
                >
                  {actionLoading === user.id ? (
                    <span className={styles.spinner} />
                  ) : (
                    <>✓ Approve</>
                  )}
                </button>
                <button
                  className={styles.rejectBtn}
                  onClick={() => setRejectModal({ open: true, user })}
                  disabled={actionLoading === user.id}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <Modal
          isOpen={rejectModal.open}
          onClose={() => {
            setRejectModal({ open: false, user: null });
            setRejectReason('');
          }}
          title="Reject Registration"
        >
          <div className={styles.rejectModal}>
            <p>
              Are you sure you want to reject{' '}
              <strong>{rejectModal.user?.first_name} {rejectModal.user?.last_name}</strong>
              {rejectModal.user?.company_name && ` from ${rejectModal.user.company_name}`}?
            </p>
            <textarea
              className={styles.rejectReason}
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.secondaryBtn}
                onClick={() => {
                  setRejectModal({ open: false, user: null });
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
              <button
                className={styles.rejectBtn}
                onClick={handleReject}
                disabled={actionLoading === rejectModal.user?.id}
              >
                {actionLoading === rejectModal.user?.id ? (
                  <span className={styles.spinner} />
                ) : (
                  'Confirm Reject'
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PendingRegistrations;
