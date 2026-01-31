import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { adminAPI } from '../../services/adminAPI';
import { useResponsive } from '../../utils/responsive';

interface UserApprovalProps {
  refreshing?: boolean;
}

interface PendingUser {
  id: string;
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  company_name: string;
  created_at: string;
  status?: number;
}

interface ApprovalModalState {
  visible: boolean;
  status: 'approving' | 'sending_email' | 'success' | 'error';
  userName: string;
  userEmail: string;
  emailSent?: boolean;
  emailError?: string | null;
  errorMessage?: string;
}

const UserApproval: React.FC<UserApprovalProps> = ({ refreshing }) => {
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [approvalModal, setApprovalModal] = useState<ApprovalModalState>({
    visible: false,
    status: 'approving',
    userName: '',
    userEmail: '',
  });

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      console.log('👥 [USER APPROVAL] Fetching pending users...');
      const result = await adminAPI.getPendingUsers();
      
      console.log('👥 [USER APPROVAL] API Response:', result);
      console.log('👥 [USER APPROVAL] Users data:', JSON.stringify(result.data, null, 2));
      
      if (result.status === 'SUCCESS') {
        const users = result.data || [];
        console.log('👥 [USER APPROVAL] Setting users:', users);
        console.log('👥 [USER APPROVAL] First user structure:', users[0] ? JSON.stringify(users[0], null, 2) : 'No users');
        setUsers(users);
      } else {
        console.error('👥 [USER APPROVAL] API returned error:', result.message);
        Alert.alert('Error', result.message || 'Failed to load pending users');
      }
    } catch (error: any) {
      console.error('👥 [USER APPROVAL] Error fetching pending users:', error);
      Alert.alert('Error', 'Failed to load pending users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  useEffect(() => {
    if (refreshing) {
      fetchPendingUsers();
    }
  }, [refreshing]);

  const handleApproveUser = async (userId: string, userName: string, userEmail: string) => {
    Alert.alert(
      'Approve User',
      `Are you sure you want to approve ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            // Show modal immediately
            setApprovalModal({
              visible: true,
              status: 'approving',
              userName,
              userEmail,
            });

            setProcessingUsers(prev => new Set(prev).add(userId));

            try {
              // Update modal to sending email status
              setApprovalModal(prev => ({ ...prev, status: 'sending_email' }));

              const result = await adminAPI.approveUser(userId);

              if (result.status === 'SUCCESS') {
                // Show success with email status
                setApprovalModal(prev => ({
                  ...prev,
                  status: 'success',
                  emailSent: result.data?.emailSent || false,
                  emailError: result.data?.emailError || null,
                }));

                // Remove user from list after a delay
                setTimeout(() => {
                  setUsers(prev => prev.filter(user => user.id !== userId));
                }, 2000);
              } else {
                setApprovalModal(prev => ({
                  ...prev,
                  status: 'error',
                  errorMessage: result.message || 'Failed to approve user',
                }));
              }
            } catch (error: any) {
              console.error('Error approving user:', error);
              setApprovalModal(prev => ({
                ...prev,
                status: 'error',
                errorMessage: error.message || 'Failed to approve user. Please try again.',
              }));
            } finally {
              setProcessingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const handleRejectUser = async (userId: string, userUuid: string, userName: string) => {
    Alert.alert(
      'Reject User',
      `Are you sure you want to reject ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingUsers(prev => new Set(prev).add(userId));

            try {
              const result = await adminAPI.rejectUser(userUuid);

              if (result.status === 'SUCCESS') {
                Alert.alert('User Rejected', `${userName} has been rejected`);
                // Remove user from list
                setUsers(prev => prev.filter(user => user.id !== userId));
              } else {
                Alert.alert('Error', result.message || 'Failed to reject user');
              }
            } catch (error: any) {
              console.error('Error rejecting user:', error);
              Alert.alert('Error', 'Failed to reject user. Please try again.');
            } finally {
              setProcessingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter(user =>
    (user.first_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (user.last_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (user.company_name || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const UserCard = ({ user }: { user: PendingUser }) => {
    const isProcessing = processingUsers.has(user.id);
    const fullName = `${user.first_name || 'Unknown'} ${user.last_name || 'User'}`;

    return (
      <View style={styles.userCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.cardGradient}
        >
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userEmail}>{user.email || 'No email'}</Text>
            <Text style={styles.userCompany}>{user.company_name || 'No company'}</Text>
            {user.phone_no && (
              <Text style={styles.userPhone}>📞 {user.phone_no}</Text>
            )}
            <Text style={styles.registrationDate}>
              Registered: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown date'}
            </Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.approveButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleApproveUser(user.id, fullName, user.email)}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                style={styles.actionButtonGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.actionButtonText}>✓ Approve</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleRejectUser(user.id, user.uuid, fullName)}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={['#FF6B6B', '#E53E3E']}
                style={styles.actionButtonGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.actionButtonText}>✗ Reject</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FD7332" />
        <Text style={styles.loadingText}>Loading pending users...</Text>
      </View>
    );
  }

  const ApprovalModal = () => {
    const getModalContent = () => {
      switch (approvalModal.status) {
        case 'approving':
          return {
            icon: '⏳',
            title: 'Approving User...',
            message: `Processing approval for ${approvalModal.userName}`,
            color: '#FD7332',
          };
        case 'sending_email':
          return {
            icon: '📧',
            title: 'Sending Approval Email...',
            message: `Sending notification to ${approvalModal.userEmail}`,
            color: '#FD7332',
          };
        case 'success':
          return {
            icon: approvalModal.emailSent ? '✅' : '⚠️',
            title: approvalModal.emailSent ? 'User Approved!' : 'User Approved (Email Failed)',
            message: approvalModal.emailSent
              ? `${approvalModal.userName} has been approved and notified via email.`
              : `${approvalModal.userName} has been approved, but the email notification failed: ${approvalModal.emailError}`,
            color: approvalModal.emailSent ? '#4CAF50' : '#FFC107',
          };
        case 'error':
          return {
            icon: '❌',
            title: 'Approval Failed',
            message: approvalModal.errorMessage || 'An error occurred',
            color: '#FF6B6B',
          };
      }
    };

    const content = getModalContent();
    const isProcessing = approvalModal.status === 'approving' || approvalModal.status === 'sending_email';

    return (
      <Modal
        visible={approvalModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isProcessing) {
            setApprovalModal(prev => ({ ...prev, visible: false }));
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.modalGradient}
            >
              <Text style={styles.modalIcon}>{content.icon}</Text>
              <Text style={styles.modalTitle}>{content.title}</Text>
              <Text style={styles.modalMessage}>{content.message}</Text>

              {isProcessing && (
                <ActivityIndicator
                  size="large"
                  color={content.color}
                  style={styles.modalSpinner}
                />
              )}

              {!isProcessing && (
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setApprovalModal(prev => ({ ...prev, visible: false }))}
                >
                  <LinearGradient
                    colors={[content.color, content.color]}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>OK</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Approval Modal */}
      <ApprovalModal />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* User Count */}
      <Text style={styles.userCount}>
        {filteredUsers.length} pending user{filteredUsers.length !== 1 ? 's' : ''} 
        {searchText ? ` (filtered)` : ''}
      </Text>

      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchText ? 'No users match your search' : 'No pending users'}
          </Text>
          {!searchText && (
            <Text style={styles.emptySubtext}>
              All users have been processed!
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserCard user={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchPendingUsers}
        />
      )}
    </View>
  );
};

const makeStyles = ({
  moderateScale,
  verticalScale,
  font,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
  font: (n: number) => number;
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: moderateScale(20),
    },
    searchContainer: {
      marginBottom: verticalScale(15),
    },
    searchInput: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(8),
      paddingHorizontal: moderateScale(15),
      paddingVertical: verticalScale(10),
      fontSize: font(14),
      color: '#FFF',
      borderWidth: 1,
      borderColor: 'rgba(253, 115, 50, 0.3)',
    },
    userCount: {
      fontSize: font(14),
      color: '#FFF',
      opacity: 0.8,
      marginBottom: verticalScale(15),
      textAlign: 'center',
    },
    listContainer: {
      paddingBottom: verticalScale(20),
    },
    userCard: {
      marginBottom: verticalScale(12),
    },
    cardGradient: {
      borderRadius: moderateScale(12),
      padding: moderateScale(16),
      borderWidth: 1,
      borderColor: 'rgba(253, 115, 50, 0.2)',
    },
    userInfo: {
      marginBottom: verticalScale(12),
    },
    userName: {
      fontSize: font(16),
      fontWeight: '600',
      color: '#FFF',
      marginBottom: verticalScale(4),
    },
    userEmail: {
      fontSize: font(14),
      color: '#FD7332',
      marginBottom: verticalScale(4),
    },
    userCompany: {
      fontSize: font(14),
      color: '#FFF',
      opacity: 0.8,
      marginBottom: verticalScale(4),
    },
    userPhone: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.7,
      marginBottom: verticalScale(4),
    },
    registrationDate: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.6,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: moderateScale(10),
    },
    approveButton: {
      flex: 1,
    },
    rejectButton: {
      flex: 1,
    },
    actionButtonGradient: {
      paddingVertical: verticalScale(8),
      borderRadius: moderateScale(6),
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: verticalScale(32),
    },
    actionButtonText: {
      fontSize: font(14),
      fontWeight: '600',
      color: '#FFF',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: verticalScale(40),
    },
    loadingText: {
      fontSize: font(16),
      color: '#FFF',
      opacity: 0.7,
      marginTop: verticalScale(10),
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: verticalScale(40),
    },
    emptyText: {
      fontSize: font(16),
      color: '#FFF',
      opacity: 0.8,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: font(14),
      color: '#4CAF50',
      opacity: 0.8,
      textAlign: 'center',
      marginTop: verticalScale(10),
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '85%',
      maxWidth: moderateScale(400),
    },
    modalGradient: {
      borderRadius: moderateScale(16),
      padding: moderateScale(30),
      borderWidth: 1,
      borderColor: 'rgba(253, 115, 50, 0.3)',
      alignItems: 'center',
    },
    modalIcon: {
      fontSize: font(64),
      marginBottom: verticalScale(15),
    },
    modalTitle: {
      fontSize: font(20),
      fontWeight: '700',
      color: '#FFF',
      textAlign: 'center',
      marginBottom: verticalScale(10),
    },
    modalMessage: {
      fontSize: font(14),
      color: '#FFF',
      opacity: 0.9,
      textAlign: 'center',
      lineHeight: font(20),
      marginBottom: verticalScale(20),
    },
    modalSpinner: {
      marginTop: verticalScale(10),
    },
    modalButton: {
      width: '100%',
      marginTop: verticalScale(10),
    },
    modalButtonGradient: {
      paddingVertical: verticalScale(12),
      borderRadius: moderateScale(8),
      alignItems: 'center',
    },
    modalButtonText: {
      fontSize: font(16),
      fontWeight: '600',
      color: '#FFF',
    },
  });

export default UserApproval;