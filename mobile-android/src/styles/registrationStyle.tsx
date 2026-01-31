import { StyleSheet } from "react-native";
import COLORS from "../utils/styleConstant/Color";
import fontFamily from "../utils/styleConstant/FontFamily";

export const styles = StyleSheet.create({
  // Existing styles
  gradientView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
  },
  errorText: {
    color: "#FF4444",
    textAlign: "center",
    fontSize: 14,
    marginBottom: 10,
  },
  imageSize: {
    width: 200,
    height: 100,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  gradient: {
    padding: 12,
    alignItems: "center",
  },
  button: {
    borderRadius: 30,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    height: 45,
    width: 145,
  },
  buttonTextContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  logoView: { flex: 1, paddingHorizontal: 30, marginTop: 0 },
  logoContainer: {
    flex: 0.7,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingRight: 80,
  },
  RegistrationView: {
    marginTop: 20,
  },
  RegistrationText: {
    fontFamily: fontFamily.lato,
    fontSize: 25,
    color: COLORS.white,
    fontWeight: "700",
  },
  textInputView: {
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  btnContainer: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  join: {
    height: "100%",
    width: "51%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: 5,
  },

  // New 3-Step Registration Flow Styles
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  backButtonText: {
    color: "#FD7332",
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 8,
  },
  backButtonLabel: {
    color: "#FD7332",
    fontSize: 18,
    fontWeight: "600",
  },
  logoImage: {
    width: 100,
    height: 35,
  },
  
  // Progress Indicator
  progressContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FD7332",
    borderRadius: 3,
  },
  progressText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    textAlign: "center",
  },
  
  // Title Section
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  
  // Form Styles
  formContainer: {
    paddingHorizontal: 20,
  },
  sectionContainer: {
    marginBottom: 15,
  },
  sectionTitle: {
    color: "#FD7332",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  
  // Error Container
  errorContainer: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
  },
  
  // Continue Button
  buttonContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  
  // Password Screen Specific
  requirementsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  requirementsTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  requirementsList: {
    gap: 5,
  },
  requirementItem: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    marginVertical: 2,
  },
  requirementMet: {
    color: "#36B509",
  },
  passwordFieldContainer: {
    position: "relative",
    marginBottom: 15,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 40,
    padding: 5,
  },
  eyeIconText: {
    fontSize: 20,
  },
  strengthContainer: {
    marginBottom: 20,
  },
  strengthContainerClose: {
    marginTop: -15,
    marginBottom: 8,
  },
  strengthLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginBottom: 5,
  },
  strengthBarBackground: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  
  // Demo Booking Screen
  noticeContainer: {
    backgroundColor: "rgba(255, 176, 46, 0.1)",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 176, 46, 0.2)",
  },
  noticeTitle: {
    color: "#FFB02E",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  noticeText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    lineHeight: 20,
  },
  timeSlotsHeader: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  timeSlotsTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  timeSlotsSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  noSlotsContainer: {
    padding: 40,
    alignItems: "center",
  },
  noSlotsText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  summaryContainer: {
    backgroundColor: "rgba(54, 181, 9, 0.1)",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(54, 181, 9, 0.3)",
  },
  summaryTitle: {
    color: "#36B509",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  summaryText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  
  // Confirmation Screen
  successIconContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#36B509",
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "bold",
  },
  confirmationTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  confirmationSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    textAlign: "center",
  },
  confirmationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 20,
    overflow: "hidden",
  },
  confirmationHeader: {
    padding: 15,
  },
  confirmationNumber: {
    color: "#0C1F3F",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  confirmationBody: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 15,
  },
  infoLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 20,
  },
  demoSection: {
    marginTop: 10,
  },
  demoTitle: {
    color: "#FD7332",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  demoTitleGradient: {
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  demoDateTime: {
    gap: 10,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dateIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  dateText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  nextStepsContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  nextStepsTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  nextStepsList: {
    gap: 12,
  },
  nextStepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  nextStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  nextStepNumberText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  nextStepText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  reminderContainer: {
    backgroundColor: "rgba(255, 176, 46, 0.05)",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 20,
  },
  reminderTitle: {
    color: "#FD7332",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  reminderTitleGradient: {
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  reminderText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    lineHeight: 20,
  },
  supportContainer: {
    alignItems: "center",
    marginTop: 30,
    paddingHorizontal: 20,
  },
  supportText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    marginBottom: 5,
  },
  supportEmail: {
    color: "#FD7332",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 3,
  },
  supportPhone: {
    color: "#FD7332",
    fontSize: 14,
    fontWeight: "600",
  },
  supportContactGradient: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginBottom: 3,
    alignSelf: "center",
  },
  floatingErrorContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 68, 68, 0.95)",
    borderRadius: 8,
    padding: 12,
    zIndex: 1000,
  },
  floatingErrorText: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
  },
  
  // Back Button Container
  backButtonContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 120,
    height: 45,
  },
});
