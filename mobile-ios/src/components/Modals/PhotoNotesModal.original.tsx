// src/components/Modals/PhotoNotesModal.tsx - COMPLETE FULL-FEATURED VERSION
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { ICONS, ICON_MICROPHONE } from "../../assets/Images/icons";
import COLORS from "../../utils/styleConstant/Color";
import { BLUE_MD_TB } from "../../styles/gradient";
import Button from "../Button";
import QuickCapture from "../camera/QuickCapture";
import { photoService, PhotoRecord } from "../../api/photo.service";
import { useProjectContext } from "../../hooks/useProjectContext";

/* ---------------- Logging ---------------- */
const LOG = (...a: any[]) => console.log("[PhotoNotesModal]", ...a);
const WARN = (...a: any[]) => console.warn("[PhotoNotesModal]", ...a);

/* ---------------- Safe Component Loading ---------------- */
let DropdownComponent: React.ComponentType<any>;

try {
  const DropdownModule = require("../Dropdown");
  DropdownComponent = DropdownModule?.default || DropdownModule;
  LOG("DropdownComponent: loaded successfully");
} catch (error: any) {
  WARN("DropdownComponent: failed to load:", error?.message || String(error));
  DropdownComponent = ({ label, data, value, onChange }: any) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: "#FFFFFF", fontSize: 14, marginBottom: 8 }}>
        {label}
      </Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.4)",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <Text style={{ color: "#FFFFFF" }}>
          {value || "Dropdown not available"}
        </Text>
      </View>
    </View>
  );
}

let useSTT: () => {
  listening: boolean;
  partial: string;
  finalText: string;
  start: (ms?: number) => void;
  stop: () => void;
  reset: () => void;
};

try {
  const sttModule = require("../../hooks/useSpeechToText");
  useSTT = sttModule?.default || sttModule?.useSpeechToText || sttModule;
  LOG("STT hook: loaded successfully");
} catch (error: any) {
  WARN("STT hook: failed to load:", error?.message || String(error));
  useSTT = () => ({
    listening: false,
    partial: "",
    finalText: "",
    start: () => LOG("STT: start() called (no-op)"),
    stop: () => LOG("STT: stop() called (no-op)"),
    reset: () => LOG("STT: reset() called (no-op)"),
  });
}

/* ---------------- Constants ---------------- */
const NOTE_MAX = 750;
const GRADIENT_FALLBACK = {
  colors: ["#2E4161", "#0C1F3F"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};
const SAFE_GRADIENT =
  BLUE_MD_TB && Array.isArray((BLUE_MD_TB as any).colors)
    ? BLUE_MD_TB
    : GRADIENT_FALLBACK;
const SAFE_ICONS = {
  close: (ICONS as any)?.close || 1,
  camera: (ICONS as any)?.camera || 2,
  video: (ICONS as any)?.video || 3,
  gallery: (ICONS as any)?.gallery || 4,
  microphone: (ICONS as any)?.microphone || ICON_MICROPHONE || 5,
};

export type TagOption = { label: string; value: string };

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  tagOptions: TagOption[];
  tagValue?: string | null;
  onChangeTag: (value: string) => void;
  onOpenGallery?: (initialSection?: string) => void;
  initialNote?: string;
  onSaveNote?: (note: string) => void;
  onMediaAdded?: (type: "photo" | "video") => void;
  projectId: string;
  companyId: string;
  section?: string;
  galleryIconSize?: number; // Optional prop to adjust gallery icon size independently
}

type ViewMode = "main" | "camera" | "video";

export default function PhotoNotesModal({
  visible,
  title,
  onClose,
  tagOptions,
  tagValue,
  onChangeTag,
  onOpenGallery,
  initialNote = "",
  onSaveNote,
  projectId: propProjectId,
  companyId: propCompanyId,
  section = "",
  galleryIconSize = 36, // Default size, can be adjusted via prop
}: Props) {
  // Safe navigation hook that handles missing NavigationContainer
  let navigation: any = null;
  try {
    const { useNavigation } = require("@react-navigation/native");
    navigation = useNavigation();
  } catch (error) {
    WARN("[PhotoNotesModal] Navigation not available:", error);
  }

  const { projectId: contextProjectId, companyId: contextCompanyId } =
    useProjectContext();
  const projectId = propProjectId || contextProjectId;
  const companyId = propCompanyId || contextCompanyId;

  const [note, setNote] = useState(initialNote);
  const [summary, setSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [refreshGallery, setRefreshGallery] = useState(0);

  // STT integration
  const rawSTT = useSTT();
  const stt = useMemo(
    () => ({
      listening: rawSTT?.listening ?? false,
      partial: rawSTT?.partial ?? "",
      finalText: rawSTT?.finalText ?? "",
      start:
        typeof rawSTT?.start === "function"
          ? rawSTT.start
          : () => LOG("STT: start() not available"),
      stop:
        typeof rawSTT?.stop === "function"
          ? rawSTT.stop
          : () => LOG("STT: stop() not available"),
      reset:
        typeof rawSTT?.reset === "function"
          ? rawSTT.reset
          : () => LOG("STT: reset() not available"),
    }),
    [rawSTT]
  );

  useEffect(() => setNote(initialNote), [initialNote]);

  useEffect(() => {
    if (stt.finalText) {
      setNote((prevNote) => {
        const separator = prevNote && !prevNote.endsWith(" ") ? " " : "";
        const combined = (prevNote + separator + stt.finalText).slice(
          0,
          NOTE_MAX
        );
        return combined;
      });
    }
  }, [stt.finalText]);

  const remainingChars = Math.max(0, NOTE_MAX - note.length);

  const generateFileName = useCallback(
    (type: "photo" | "video", extension: string) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      return `${section}-${type}-${timestamp}.${extension}`;
    },
    [section]
  );

  const handleNoteChange = useCallback((text: string) => {
    setNote(text.slice(0, NOTE_MAX));
  }, []);

  const handleSaveNote = useCallback(async () => {
    const cleanNote = note.trim();
    if (!cleanNote) {
      Alert.alert("No content", "Please enter a note to save.");
      return;
    }

    setIsSaving(true);
    try {
      onSaveNote?.(cleanNote);
      Alert.alert("Saved", "Your note has been saved.");
      LOG("Note saved:", {
        noteLength: cleanNote.length,
        section,
        projectId,
        companyId,
      });
    } catch (error) {
      LOG("Failed to save note:", error);
      Alert.alert("Error", "Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [note, onSaveNote, section, projectId, companyId]);

  const handleClearNote = useCallback(() => {
    if (!note.trim()) return;

    Alert.alert("Clear note", "Remove your note for this section?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          setNote("");
          setSummary("");
          onSaveNote?.("");
        },
      },
    ]);
  }, [note, onSaveNote]);

  // Media handlers with full database integration
  const handlePhotoCapture = useCallback(
    async (localUri: string, meta?: any) => {
      LOG("handlePhotoCapture called with:", {
        projectId,
        companyId,
        section,
        localUri,
        meta,
        tagValue,
        noteLength: note?.length,
      });

      if (!projectId || !companyId || !section) {
        Alert.alert("Error", "Missing project information");
        return;
      }

      try {
        const fileName = generateFileName("photo", "jpg");

        await photoService.createPhoto(projectId, companyId, localUri, {
          section,
          tag: tagValue || undefined,
          note: note.trim() || undefined,
          media_type: "photo",
          file_name: fileName,
          mime_type: meta?.mimeType || "image/jpeg",
          file_size: meta?.fileSize,
        });

        setRefreshGallery((prev) => prev + 1);
        Alert.alert("Success", "Photo saved successfully!");
        LOG("Photo saved to database:", { section, projectId });
      } catch (error: any) {
        LOG("Failed to save photo - Full error:", {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          stack: error?.stack,
        });
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           "Failed to save photo. Please try again.";
        Alert.alert("Error", errorMessage);
      }
    },
    [projectId, companyId, section, tagValue, note, generateFileName]
  );

  const handleVideoCapture = useCallback(
    async (file: any) => {
      if (!projectId || !companyId || !section) {
        Alert.alert("Error", "Missing project information");
        return;
      }

      try {
        const fileName = generateFileName("video", "mp4");

        await photoService.createPhoto(projectId, companyId, file.uri, {
          section,
          tag: tagValue || undefined,
          note: note.trim() || undefined,
          media_type: "video",
          file_name: fileName,
          mime_type: file.mimeType || "video/mp4",
          file_size: file.fileSize,
          duration_ms: file.durationMs,
        });

        setRefreshGallery((prev) => prev + 1);
        Alert.alert("Success", "Video saved successfully!");
        LOG("Video saved to database:", { section, projectId });
      } catch (error) {
        LOG("Failed to save video:", error);
        Alert.alert("Error", "Failed to save video. Please try again.");
      }
    },
    [projectId, companyId, section, tagValue, note, generateFileName]
  );

  // Button handlers
  const handleGallery = useCallback(() => {
    LOG("Photo Gallery tapped", {
      hasOnOpenGallery: !!onOpenGallery,
      hasNavigation: !!navigation,
      projectId,
      section,
      tagValue,
    });

    // Validate required data
    if (!projectId) {
      Alert.alert("Error", "Project information is missing");
      return;
    }

    // Option 1: Use PhotoCaptureContext callback (preferred if provided)
    if (onOpenGallery) {
      LOG("Using PhotoCaptureContext callback");
      onOpenGallery(section);
      return;
    }

    // Option 2: Use direct navigation if available
    if (navigation) {
      LOG("Using direct navigation to PhotoGalleryScreen");
      
      // Close modal first for smooth transition
      onClose();

      // Navigate after a short delay to allow modal close animation
      setTimeout(() => {
        try {
          navigation.navigate("PhotoGallery", {
            projectId,
            initialSection: section || "",
            fromScreen: "PhotoNotesModal",
            initialTag: tagValue || "",
          });
          LOG("Navigation to PhotoGallery initiated successfully");
        } catch (error) {
          LOG("Navigation error:", error);
          Alert.alert(
            "Navigation Error",
            "Unable to open the photo gallery. Please try again.",
            [{ text: "OK" }]
          );
        }
      }, 300);
      return;
    }

    // Option 3: Fallback - Show alert if no navigation method available
    LOG("No gallery navigation method available");
    Alert.alert(
      "Gallery Not Available",
      "Photo gallery navigation is not available in this context.",
      [{ text: "OK" }]
    );
  }, [onOpenGallery, navigation, projectId, section, tagValue, onClose]);

  const handleCamera = useCallback(() => {
    if (!projectId || !companyId) {
      Alert.alert("Error", "Missing project or company information");
      return;
    }
    setViewMode("camera");
  }, [projectId, companyId]);

  const handleVideo = useCallback(() => {
    if (!projectId || !companyId) {
      Alert.alert("Error", "Missing project or company information");
      return;
    }
    setViewMode("video");
  }, [projectId, companyId]);

  const handleVoice = useCallback(() => {
    if (stt.listening) {
      stt.stop();
    } else {
      stt.start(60_000);
    }
  }, [stt]);

  const handleCloseSubView = useCallback(() => {
    setViewMode("main");
  }, []);

  // Render different views based on mode
  const renderContent = () => {
    switch (viewMode) {
      case "camera":
        return (
          <QuickCapture
            visible={true}
            mode="photo"
            onClose={handleCloseSubView}
            onPhoto={handlePhotoCapture}
          />
        );
      case "video":
        return (
          <QuickCapture
            visible={true}
            mode="video"
            onClose={handleCloseSubView}
            onVideo={handleVideoCapture}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.55)" barStyle="light-content" />

      {viewMode !== "main" ? (
        renderContent()
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={styles.backdrop}
        >
          <LinearGradient {...SAFE_GRADIENT} style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Image
                  source={SAFE_ICONS.close}
                  style={styles.closeIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Tag Dropdown */}
            <View style={styles.section}>
              <DropdownComponent
                label="Tag*"
                data={tagOptions}
                value={tagValue}
                onChange={onChangeTag}
                valueField="value"
                labelField="label"
              />
            </View>

            {/* Action Buttons - 4 BUTTONS */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleGallery}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <Image
                    source={SAFE_ICONS.gallery}
                    style={[
                      styles.actionIcon,
                      {
                        tintColor: "#FD7332",
                        width: galleryIconSize,
                        height: galleryIconSize,
                      },
                    ]}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.actionText}>Gallery</Text>
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCamera}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <Image
                    source={SAFE_ICONS.camera}
                    style={[styles.actionIcon, { tintColor: "#FD7332" }]}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.actionText}>Photo</Text>
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleVideo}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <Image
                    source={SAFE_ICONS.video}
                    style={[styles.actionIcon, { tintColor: "#FD7332" }]}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.actionText}>Video</Text>
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleVoice}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, styles.voiceIconContainer]}>
                  <Image
                    source={SAFE_ICONS.microphone}
                    style={[
                      styles.actionIcon,
                      { tintColor: stt.listening ? "#B92011" : "#FD7332" },
                    ]}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  style={[styles.actionText, styles.voiceTextLabel]}
                  numberOfLines={2}
                >
                  {stt.listening ? "Stop Voice" : "Voice to Text"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notes Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>

              {/* STT Partial Preview */}
              {!!stt.partial && (
                <Text style={styles.sttPartial}>Speaking: "{stt.partial}"</Text>
              )}

              <TextInput
                value={note}
                onChangeText={handleNoteChange}
                placeholder="Write a note about this section..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={styles.noteInput}
                multiline
                maxLength={NOTE_MAX}
                textAlignVertical="top"
              />

              <Text style={styles.characterCounter}>
                {remainingChars} characters remaining
              </Text>
            </View>

            {/* AI Summary Section */}
            {summary && (
              <View style={styles.summarySection}>
                <Text style={styles.summaryLabel}>AI Summary</Text>
                <View style={styles.summaryContainer}>
                  <ScrollView
                    style={styles.summaryScroll}
                    contentContainerStyle={styles.summaryContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={styles.summaryText}>{summary}</Text>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Save/Clear Buttons */}
            <View style={styles.buttonRow}>
              <Button
                title={isSaving ? "Clearing..." : "Clear Note"}
                onPress={handleClearNote}
                disabled={!note.trim() || isSaving}
                width="48%"
                height={48}
                selected={false}
                rounded={24}
                style={{ opacity: 1 }}
              />

              <Button
                title={isSaving ? "Saving..." : "Save Note"}
                onPress={handleSaveNote}
                disabled={!note.trim() || isSaving}
                width="48%"
                height={48}
                selected={true}
                rounded={24}
                style={{ opacity: 1 }}
              />
            </View>
          </LinearGradient>
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 520, // Larger modal
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    maxHeight: "92%", // More space
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
    marginRight: 16,
  },
  closeButton: { padding: 6 },
  closeIcon: { width: 20, height: 20 },

  section: { marginBottom: 10 },

  // Four Action Buttons
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
    marginBottom: 0,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 12,
  },
  iconContainer: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  voiceIconContainer: {
    justifyContent: "flex-start",
    paddingTop: 20,
  },
  voiceTextLabel: {
    paddingTop: 20, // Adjust this value to move the Voice to Text label up or down
  },
  actionIcon: { width: 48, height: 48 },
  actionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  actionDivider: {
    width: 1,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 4,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  // STT Partial Preview
  sttPartial: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  // Larger Note Input
  noteInput: {
    minHeight: 200, // Much bigger - about 1/4 of modal
    maxHeight: 250,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
  },
  characterCounter: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    alignSelf: "flex-end",
    marginTop: 6,
    marginBottom: 12,
  },

  // AI Summary Section
  summarySection: { marginBottom: 16 },
  summaryLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  summaryContainer: {
    minHeight: 80,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 12,
    padding: 12,
  },
  summaryScroll: { flex: 1 },
  summaryContent: { flexGrow: 1, justifyContent: "center" },
  summaryText: { color: "#FFFFFF", fontSize: 14, lineHeight: 20 },

  // Button Row Styling
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
});
