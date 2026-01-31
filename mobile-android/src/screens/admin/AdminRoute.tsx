import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { adminAPI } from '../../services/adminAPI';
import { useResponsive } from '../../utils/responsive';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await adminAPI.verifyAdminAccess();
        setIsAdmin(true);
      } catch (error: any) {
        console.log('[AdminRoute] Access verification failed:', error.message);
        setIsAdmin(false);
        setError(error.message || 'Access denied');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdminAccess();
  }, []);

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#2E4161", "#1D2A4F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FD7332" />
          <Text style={styles.loadingText}>Verifying admin access...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!isAdmin) {
    return (
      <LinearGradient
        colors={["#2E4161", "#1D2A4F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedTitle}>🔒 Access Restricted</Text>
          <Text style={styles.accessDeniedMessage}>
            This admin panel is only accessible to authorized super administrators.
          </Text>
          <Text style={styles.contactMessage}>
            {error || 'Contact support if you believe you should have access.'}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return <>{children}</>;
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
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: moderateScale(40),
    },
    loadingText: {
      fontSize: font(16),
      color: '#FFF',
      marginTop: verticalScale(20),
      textAlign: 'center',
    },
    accessDeniedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: moderateScale(40),
    },
    accessDeniedTitle: {
      fontSize: font(24),
      fontWeight: '700',
      color: '#FFF',
      marginBottom: verticalScale(20),
      textAlign: 'center',
    },
    accessDeniedMessage: {
      fontSize: font(16),
      color: '#FFF',
      opacity: 0.8,
      textAlign: 'center',
      marginBottom: verticalScale(20),
      lineHeight: font(22),
    },
    contactMessage: {
      fontSize: font(14),
      color: '#FD7332',
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

export default AdminRoute;