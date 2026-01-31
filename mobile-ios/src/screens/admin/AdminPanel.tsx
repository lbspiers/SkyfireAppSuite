import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import SmallHeader from '../../components/Header/SmallHeader';
import AdminRoute from './AdminRoute';
import MetricsDashboard from './MetricsDashboard';
import UserApproval from './UserApproval';
import DemoRequests from './DemoRequests';
import DemoExceptions from './DemoExceptions';
import RegisterUserModal from './RegisterUserModal';
import EmailTemplatesScreen from './EmailTemplatesScreen';
import SupportTicketsAdmin from './SupportTicketsAdmin';
import { useResponsive } from '../../utils/responsive';
import { ORANGE_TB, BLUE_2C_BT } from '../../styles/gradient';

type AdminTab = 'dashboard' | 'users' | 'demos' | 'exceptions' | 'emails' | 'support';

const LIGHT = "#2E4161";
const MID = "#1D2A4F";

const AdminPanel: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

  const handleDrawerPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Trigger refresh for active component
    setTimeout(() => setRefreshing(false), 1000);
  };

  const TabButton = ({
    tab,
    label
  }: {
    tab: AdminTab;
    label: string;
  }) => (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={() => setActiveTab(tab)}
    >
      <LinearGradient
        colors={activeTab === tab ? ORANGE_TB.colors : BLUE_2C_BT.colors}
        start={activeTab === tab ? ORANGE_TB.start : BLUE_2C_BT.start}
        end={activeTab === tab ? ORANGE_TB.end : BLUE_2C_BT.end}
        style={styles.tabGradient}
      >
        <Text style={styles.tabText}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <MetricsDashboard refreshing={refreshing} />;
      case 'users':
        return <UserApproval refreshing={refreshing} />;
      case 'demos':
        return <DemoRequests refreshing={refreshing} />;
      case 'exceptions':
        return <DemoExceptions refreshing={refreshing} />;
      case 'emails':
        return <EmailTemplatesScreen refreshing={refreshing} />;
      case 'support':
        return <SupportTicketsAdmin refreshing={refreshing} />;
      default:
        return <MetricsDashboard refreshing={refreshing} />;
    }
  };

  return (
    <AdminRoute>
      <LinearGradient
        colors={[LIGHT, MID]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        <SmallHeader title="Admin Panel" onDrawerPress={handleDrawerPress} />
        
        {/* Tab Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
          contentContainerStyle={styles.tabContainer}
        >
          <TabButton tab="dashboard" label="Dashboard" />
          <TabButton tab="users" label="Users" />
          <TabButton tab="demos" label="Demos" />
          <TabButton tab="exceptions" label="Exceptions" />
          <TabButton tab="emails" label="Emails" />
          <TabButton tab="support" label="Support" />
        </ScrollView>

        {/* Register User Button */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => setRegisterModalVisible(true)}
          >
            <LinearGradient
              colors={["#FD7332", "#EF3826"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerButtonGradient}
            >
              <Text style={styles.registerButtonText}>+ Register New User</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.contentContainer}>
          {renderTabContent()}
        </View>

        {/* Register User Modal */}
        <RegisterUserModal
          visible={registerModalVisible}
          onClose={() => setRegisterModalVisible(false)}
          onUserRegistered={() => {
            setRegisterModalVisible(false);
            onRefresh(); // Refresh data after registration
          }}
        />
      </LinearGradient>
    </AdminRoute>
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
    gradient: {
      flex: 1,
    },
    tabScrollView: {
      flexGrow: 0,
      marginVertical: 8,
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 6,
    },
    tabButton: {
      minWidth: 90,
      borderRadius: 8,
      overflow: 'hidden',
    },
    tabGradient: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 40,
    },
    tabText: {
      fontSize: 13,
      color: '#FFF',
      fontWeight: '600',
      textAlign: 'center',
    },
    actionButtonContainer: {
      paddingHorizontal: 20,
      marginBottom: 30,
      marginTop: 16,
    },
    registerButton: {
      alignSelf: 'center',
    },
    registerButtonGradient: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 18,
    },
    registerButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFF',
    },
    contentContainer: {
      flex: 1,
    },
  });

export default AdminPanel;