import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

// Utils and Constants
import COLORS from '../../utils/styleConstant/Color';
import fontFamily from '../../utils/styleConstant/FontFamily';
import { supportTicketAPI, TicketDetailsResponse } from '../../services/supportTicketAPI';
import { BLUE_TC_TB } from '../../styles/gradient';

type RouteParams = {
  ticketNumber: string;
};

const TicketDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { ticketNumber } = route.params as RouteParams;

  // State
  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTicketDetails();
  }, [ticketNumber]);

  const loadTicketDetails = async () => {
    try {
      setIsLoading(true);
      const response = await supportTicketAPI.getTicketDetails(ticketNumber);

      if (response.success && response.data) {
        setTicket(response.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to load ticket details',
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load ticket details',
      });
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return '#17A2B8';
      case 'in_progress': return '#FFC107';
      case 'waiting_response': return '#FD7332';
      case 'resolved': return '#28A745';
      case 'closed': return '#6C757D';
      default: return '#17A2B8';
    }
  };

  const getPriorityColor = (priority: string) => {
    return supportTicketAPI.getPriorityColor(priority);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEmailSupport = () => {
    const subject = `Re: Support Ticket ${ticketNumber}`;
    const body = `Hello,\n\nI would like to follow up on my support ticket ${ticketNumber}: "${ticket?.subject}"\n\nAdditional information:\n\n\n\nThank you,`;
    const emailUrl = `mailto:logan@skyfiresd.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(emailUrl).catch(err => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not open email app',
      });
    });
  };

  const handleCallSupport = () => {
    const phoneUrl = 'tel:+14807593473';

    Linking.openURL(phoneUrl).catch(err => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not make phone call',
      });
    });
  };

  const renderInfoRow = (label: string, value: string | null, color?: string) => {
    if (!value) return null;

    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={[styles.infoValue, color ? { color } : {}]}>{value}</Text>
      </View>
    );
  };

  const renderBadge = (text: string, backgroundColor: string) => (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient
        colors={BLUE_TC_TB.colors}
        start={BLUE_TC_TB.start}
        end={BLUE_TC_TB.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backButton}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Ticket Details</Text>
              <View style={{ width: 30 }} />
            </View>
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primaryOrange} />
            <Text style={styles.loadingText}>Loading ticket details...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!ticket) {
    return (
      <LinearGradient
        colors={BLUE_TC_TB.colors}
        start={BLUE_TC_TB.start}
        end={BLUE_TC_TB.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backButton}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Ticket Not Found</Text>
              <View style={{ width: 30 }} />
            </View>
          </View>

          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Ticket not found or access denied</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={BLUE_TC_TB.colors}
      start={BLUE_TC_TB.start}
      end={BLUE_TC_TB.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ticket Details</Text>
            <View style={{ width: 30 }} />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
          <View style={styles.badgesContainer}>
            {renderBadge(
              supportTicketAPI.getStatusDisplayText(ticket.status),
              getStatusColor(ticket.status)
            )}
            {renderBadge(
              supportTicketAPI.getPriorityDisplayText(ticket.priority),
              getPriorityColor(ticket.priority)
            )}
          </View>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject</Text>
          <Text style={styles.subject}>{ticket.subject}</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.infoContainer}>
            {renderInfoRow('Category', supportTicketAPI.getCategoryDisplayText(ticket.category))}
            {renderInfoRow('Priority', supportTicketAPI.getPriorityDisplayText(ticket.priority))}
            {renderInfoRow('Status', supportTicketAPI.getStatusDisplayText(ticket.status))}
            {renderInfoRow('Created', formatDate(ticket.createdAt))}
            {ticket.updatedAt !== ticket.createdAt && renderInfoRow('Updated', formatDate(ticket.updatedAt))}
            {renderInfoRow('Resolved', ticket.resolvedAt ? formatDate(ticket.resolvedAt) : null)}
            {renderInfoRow('Closed', ticket.closedAt ? formatDate(ticket.closedAt) : null)}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{ticket.description}</Text>
          </View>
        </View>

        {/* Assignment Information */}
        {ticket.assignedTo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned To</Text>
            <View style={styles.infoContainer}>
              {renderInfoRow('Name', ticket.assignedTo.name)}
              {renderInfoRow('Email', ticket.assignedTo.email)}
            </View>
          </View>
        )}

        {/* Technical Information */}
        {(ticket.currentScreen || ticket.appVersion || ticket.deviceInfo) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Information</Text>
            <View style={styles.technicalContainer}>
              {renderInfoRow('Screen', ticket.currentScreen)}
              {renderInfoRow('App Version', ticket.appVersion)}
              {ticket.deviceInfo && (
                <View style={styles.deviceInfo}>
                  <Text style={styles.infoLabel}>Device Information:</Text>
                  <Text style={styles.deviceInfoText}>
                    {JSON.stringify(ticket.deviceInfo, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Screenshots */}
        {ticket.screenshots && ticket.screenshots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Screenshots</Text>
            <Text style={styles.screenshotsText}>
              {ticket.screenshots.length} screenshot(s) attached to this ticket
            </Text>
          </View>
        )}

        {/* Logs */}
        {ticket.logs && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Logs</Text>
            <View style={styles.logsContainer}>
              <Text style={styles.logsText}>{ticket.logs}</Text>
            </View>
          </View>
        )}

        {/* Resolution Notes */}
        {ticket.resolutionNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolution Notes</Text>
            <View style={styles.resolutionContainer}>
              <Text style={styles.resolutionText}>{ticket.resolutionNotes}</Text>
            </View>
          </View>
        )}

        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Additional Help?</Text>
          <View style={styles.contactContainer}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleEmailSupport}
            >
              <LinearGradient
                colors={[COLORS.primaryBlue, COLORS.mediumBlue]}
                style={styles.contactButtonGradient}
              >
                <Text style={styles.contactButtonText}>📧 Email Support</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleCallSupport}
            >
              <LinearGradient
                colors={[COLORS.primaryOrange, COLORS.secondaryOrange]}
                style={styles.contactButtonGradient}
              >
                <Text style={styles.contactButtonText}>📞 Call Support</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.supportInfo}>
            <Text style={styles.supportInfoText}>
              Email: logan@skyfiresd.com
            </Text>
            <Text style={styles.supportInfoText}>
              Phone: (480) 759-3473
            </Text>
            <Text style={styles.supportInfoNote}>
              Reference ticket #{ticket.ticketNumber} when contacting support
            </Text>
          </View>
        </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamily.Inter_16pt_Black,
    color: COLORS.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  ticketHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketNumber: {
    fontSize: 24,
    fontFamily: fontFamily.Inter_16pt_Black,
    color: COLORS.primaryBlue,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fontFamily.Inter_16pt_Black,
    color: COLORS.primaryBlue,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primaryOrange,
    paddingBottom: 6,
  },
  subject: {
    fontSize: 16,
    color: COLORS.darkGray,
    fontWeight: '600',
    lineHeight: 24,
  },
  infoContainer: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  descriptionContainer: {
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryOrange,
  },
  description: {
    fontSize: 16,
    color: COLORS.darkGray,
    lineHeight: 24,
  },
  technicalContainer: {
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderRadius: 8,
    padding: 16,
  },
  deviceInfo: {
    marginTop: 8,
  },
  deviceInfoText: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontFamily: 'monospace',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  screenshotsText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
  },
  logsContainer: {
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderRadius: 8,
    padding: 16,
  },
  logsText: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  resolutionContainer: {
    backgroundColor: 'rgba(232, 245, 232, 0.8)',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
  },
  resolutionText: {
    fontSize: 16,
    color: COLORS.darkGray,
    lineHeight: 24,
  },
  contactContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  contactButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  contactButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  supportInfo: {
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(233, 236, 239, 0.5)',
  },
  supportInfoText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  supportInfoNote: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default TicketDetailsScreen;