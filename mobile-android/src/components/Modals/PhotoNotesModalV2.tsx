// src/components/Modals/PhotoNotesModalV2.tsx - Enhanced Batch Photo Capture Modal
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
  FlatList,
  Animated,
  ActivityIndicator,
  Dimensions,
  Vibration,
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
const LOG = (...a: any[]) => console.log("[PhotoNotesModalV2]", ...a);
const WARN = (...a: any[]) => console.warn("[PhotoNotesModalV2]", ...a);

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
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const THUMBNAIL_SIZE = 80;
const THUMBNAIL_MARGIN = 8;

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
  microphone: ICON_MICROPHONE || 5,
};

/* ---------------- Types ---------------- */
interface PhotoSessionMetadata {
  section: string;
  tag?: string;
  note?: string;
  projectId: string;
  companyId: string;
}

interface CapturedPhoto {
  id: string;
  uri: string;
  thumbnailUri?: string;
  selected: boolean;
  status: 'loading' | 'ready' | 'saving' | 'saved' | 'error';
  metadata?: {
    mimeType?: string;
    fileSize?: number;
    width?: number;
    height?: number;
  };
  timestamp: Date;
}

interface CapturedVideo {
  id: string;
  uri: string;
  thumbnailUri?: string;
  selected: boolean;
  status: 'loading' | 'ready' | 'saving' | 'saved' | 'error';
  metadata?: {
    mimeType?: string;
    fileSize?: number;
    durationMs?: number;
  };
  timestamp: Date;
}

interface PhotoSession {
  id: string;
  metadata: PhotoSessionMetadata;
  photos: CapturedPhoto[];
  videos: CapturedVideo[];
  status: 'idle' | 'capturing' | 'processing' | 'saving';
  createdAt: Date;
  lastUpdated: Date;
}

/* ---------------- PhotoNotesModalV2 Component ---------------- */
interface PhotoNotesModalV2Props {
  visible: boolean;
  onClose: () => void;
  projectId: string;
  companyId: string;
  refreshGallery?: number;
  setRefreshGallery?: React.Dispatch<React.SetStateAction<number>>;
  enableVideo?: boolean;
  sectionOptions?: Array<{ label: string; value: string }>;
  currentSection?: string;
  section?: string;
  title?: string;
  tagOptions?: Array<{ label: string; value: string }>;
  tagValue?: string | null;
  onChangeTag?: (value: string) => void;
  onOpenGallery?: () => void;
  initialNote?: string;
  onSaveNote?: (note: string) => void;
  onMediaAdded?: (type: "photo" | "video") => void;
  galleryIconSize?: number;
}

const PhotoNotesModalV2: React.FC<PhotoNotesModalV2Props> = ({
  visible,
  onClose,
  projectId,
  companyId,
  refreshGallery = 0,
  setRefreshGallery,
  enableVideo = false,
  sectionOptions = [],
  currentSection = "general",
  section: propSection,
  title: propTitle,
  tagOptions = [],
  tagValue: propTagValue,
  onChangeTag,
  onOpenGallery,
  initialNote = "",
  onSaveNote,
  onMediaAdded,
  galleryIconSize = 36,
}) => {
  /* ---------------- Core State ---------------- */
  const [viewMode, setViewMode] = useState<"main" | "camera" | "video">("main");
  const [cameraType, setCameraType] = useState<"photo" | "video">("photo");
  const [saving, setSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageText, setSuccessMessageText] = useState("");

  /* ---------------- Session Management ---------------- */
  const [session, setSession] = useState<PhotoSession>({
    id: `session_${Date.now()}`,
    metadata: {
      section: propSection || currentSection,
      tag: propTagValue || "",
      note: initialNote || "",
      projectId,
      companyId,
    },
    photos: [],
    videos: [],
    status: 'idle',
    createdAt: new Date(),
    lastUpdated: new Date(),
  });

  /* ---------------- Form State ---------------- */
  const [section, setSection] = useState(propSection || currentSection);
  const [tagValue, setTagValue] = useState(propTagValue || "");
  const [note, setNote] = useState(initialNote || "");
  const [noteLength, setNoteLength] = useState(initialNote?.length || 0);

  /* ---------------- STT Integration ---------------- */
  const { listening, partial, finalText, start, stop, reset } = useSTT();
  const scrollViewRef = useRef<ScrollView>(null);
  const thumbnailScrollRef = useRef<ScrollView>(null);

  /* ---------------- Animations ---------------- */
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  /* ---------------- Helper Functions ---------------- */
  const generateId = () => `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const generateFileName = (type: "photo" | "video", ext: string) => {
    const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const rnd = Math.random().toString(36).substring(2, 6);
    return `${projectId}_${section}_${type}_${ts}_${rnd}.${ext}`;
  };

  /* ---------------- Photo Session Management ---------------- */
  const addPhotoToSession = useCallback((uri: string, metadata?: any) => {
    const newPhoto: CapturedPhoto = {
      id: generateId(),
      uri,
      thumbnailUri: uri, // Use same URI initially for fast display
      selected: true,
      status: 'loading',
      metadata,
      timestamp: new Date(),
    };

    setSession(prev => ({
      ...prev,
      photos: [...prev.photos, newPhoto],
      lastUpdated: new Date(),
    }));

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Vibration.vibrate(50);
    }

    // Auto-scroll to show new thumbnail
    setTimeout(() => {
      thumbnailScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Process photo in background
    processPhotoAsync(newPhoto);

    LOG(`Added photo to session: ${newPhoto.id}`);
  }, []);

  const addVideoToSession = useCallback((uri: string, metadata?: any) => {
    const newVideo: CapturedVideo = {
      id: generateId(),
      uri,
      thumbnailUri: uri,
      selected: true,
      status: 'loading',
      metadata,
      timestamp: new Date(),
    };

    setSession(prev => ({
      ...prev,
      videos: [...prev.videos, newVideo],
      lastUpdated: new Date(),
    }));

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Vibration.vibrate(50);
    }

    LOG(`Added video to session: ${newVideo.id}`);
  }, []);

  const processPhotoAsync = async (photo: CapturedPhoto) => {
    // Simulate processing delay
    setTimeout(() => {
      setSession(prev => ({
        ...prev,
        photos: prev.photos.map(p =>
          p.id === photo.id ? { ...p, status: 'ready' } : p
        ),
      }));
    }, 1000);
  };

  const togglePhotoSelection = useCallback((photoId: string) => {
    setSession(prev => ({
      ...prev,
      photos: prev.photos.map(p =>
        p.id === photoId ? { ...p, selected: !p.selected } : p
      ),
    }));
    
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Vibration.vibrate(20);
    }
  }, []);

  const toggleVideoSelection = useCallback((videoId: string) => {
    setSession(prev => ({
      ...prev,
      videos: prev.videos.map(v =>
        v.id === videoId ? { ...v, selected: !v.selected } : v
      ),
    }));
    
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Vibration.vibrate(20);
    }
  }, []);

  const deletePhoto = useCallback((photoId: string) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setSession(prev => ({
              ...prev,
              photos: prev.photos.filter(p => p.id !== photoId),
              lastUpdated: new Date(),
            }));
          },
        },
      ]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSession(prev => ({
      ...prev,
      photos: prev.photos.map(p => ({ ...p, selected: true })),
      videos: prev.videos.map(v => ({ ...v, selected: true })),
    }));
  }, []);

  const deselectAll = useCallback(() => {
    setSession(prev => ({
      ...prev,
      photos: prev.photos.map(p => ({ ...p, selected: false })),
      videos: prev.videos.map(v => ({ ...v, selected: false })),
    }));
  }, []);

  /* ---------------- QuickCapture Handlers ---------------- */
  const handleQuickCapture = useCallback(
    async (localUri: string, meta?: any) => {
      LOG("QuickCapture returned:", { localUri, meta });

      // Immediately add to session and return to main view
      addPhotoToSession(localUri, meta);
      setViewMode("main");

      // Show quick feedback
      setSuccessMessageText("Photo added to session");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 1500);
    },
    [addPhotoToSession]
  );

  const handleQuickVideo = useCallback(
    async (file: any) => {
      LOG("QuickVideo captured:", file);

      // Immediately add to session and return to main view
      addVideoToSession(file.uri, {
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        durationMs: file.durationMs,
      });
      setViewMode("main");

      // Show quick feedback
      setSuccessMessageText("Video added to session");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 1500);
    },
    [addVideoToSession]
  );

  /* ---------------- Batch Save Operations ---------------- */
  const handleBatchSave = useCallback(async () => {
    const selectedPhotos = session.photos.filter(p => p.selected);
    const selectedVideos = session.videos.filter(v => v.selected);
    
    if (selectedPhotos.length === 0 && selectedVideos.length === 0) {
      Alert.alert("No Selection", "Please select at least one photo or video to save.");
      return;
    }

    setSaving(true);
    setSession(prev => ({ ...prev, status: 'saving' }));

    try {
      // Update metadata
      const sessionMetadata = {
        section,
        tag: tagValue || undefined,
        note: note.trim() || undefined,
      };

      // Save photos in parallel
      const photoPromises = selectedPhotos.map(async (photo) => {
        const fileName = generateFileName("photo", "jpg");
        
        await photoService.createPhoto(projectId, companyId, photo.uri, {
          ...sessionMetadata,
          media_type: "photo",
          file_name: fileName,
          mime_type: photo.metadata?.mimeType || "image/jpeg",
          file_size: photo.metadata?.fileSize,
        });

        // Mark as saved
        setSession(prev => ({
          ...prev,
          photos: prev.photos.map(p =>
            p.id === photo.id ? { ...p, status: 'saved' } : p
          ),
        }));
      });

      // Save videos in parallel
      const videoPromises = selectedVideos.map(async (video) => {
        const fileName = generateFileName("video", "mp4");
        
        await photoService.createPhoto(projectId, companyId, video.uri, {
          ...sessionMetadata,
          media_type: "video",
          file_name: fileName,
          mime_type: video.metadata?.mimeType || "video/mp4",
          file_size: video.metadata?.fileSize,
          duration_ms: video.metadata?.durationMs,
        });

        // Mark as saved
        setSession(prev => ({
          ...prev,
          videos: prev.videos.map(v =>
            v.id === video.id ? { ...v, status: 'saved' } : v
          ),
        }));
      });

      await Promise.all([...photoPromises, ...videoPromises]);

      // Success feedback
      const totalSaved = selectedPhotos.length + selectedVideos.length;
      setSuccessMessageText(`${totalSaved} item${totalSaved > 1 ? 's' : ''} saved successfully!`);
      setShowSuccessMessage(true);

      // Refresh gallery
      if (setRefreshGallery) {
        setRefreshGallery(prev => prev + 1);
      }

      // Clear saved items from session
      setTimeout(() => {
        setSession(prev => ({
          ...prev,
          photos: prev.photos.filter(p => p.status !== 'saved'),
          videos: prev.videos.filter(v => v.status !== 'saved'),
          status: 'idle',
        }));
        setShowSuccessMessage(false);
      }, 2000);

    } catch (error: any) {
      WARN("Batch save failed:", error);
      Alert.alert(
        "Save Failed",
        "Some items could not be saved. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSaving(false);
      setSession(prev => ({ ...prev, status: 'idle' }));
    }
  }, [session, section, tagValue, note, projectId, companyId, setRefreshGallery]);

  /* ---------------- UI Handlers ---------------- */
  const handleClose = useCallback(() => {
    const unsavedCount = session.photos.filter(p => p.status !== 'saved').length +
                         session.videos.filter(v => v.status !== 'saved').length;

    if (unsavedCount > 0) {
      Alert.alert(
        "Unsaved Items",
        `You have ${unsavedCount} unsaved item${unsavedCount > 1 ? 's' : ''}. Are you sure you want to close?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Close", style: "destructive", onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  }, [session, onClose]);

  /* ---------------- STT Handlers ---------------- */
  const handleStartSTT = useCallback(() => {
    LOG("Starting STT");
    reset();
    start(60000); // 60 second timeout
  }, [reset, start]);

  const handleStopSTT = useCallback(() => {
    LOG("Stopping STT");
    stop();
  }, [stop]);

  useEffect(() => {
    if (finalText && !listening) {
      const newNote = note ? `${note} ${finalText}` : finalText;
      setNote(newNote.slice(0, NOTE_MAX));
      setNoteLength(Math.min(newNote.length, NOTE_MAX));
    }
  }, [finalText, listening, note]);

  /* ---------------- Thumbnail Grid Component ---------------- */
  const ThumbnailItem = ({ item, type }: { item: CapturedPhoto | CapturedVideo; type: 'photo' | 'video' }) => (
    <TouchableOpacity
      style={[styles.thumbnailItem, item.selected && styles.thumbnailSelected]}
      onPress={() => type === 'photo' ? togglePhotoSelection(item.id) : toggleVideoSelection(item.id)}
      onLongPress={() => deletePhoto(item.id)}
    >
      <Image source={{ uri: item.thumbnailUri || item.uri }} style={styles.thumbnailImage} />
      
      {item.status === 'loading' && (
        <View style={styles.thumbnailOverlay}>
          <ActivityIndicator color="white" size="small" />
        </View>
      )}
      
      {item.selected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
      
      {type === 'video' && (
        <View style={styles.videoIndicator}>
          <Text style={styles.videoIndicatorText}>▶</Text>
        </View>
      )}
      
      {item.status === 'saved' && (
        <View style={styles.savedIndicator}>
          <Text style={styles.savedIndicatorText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const ThumbnailGrid = () => {
    const totalItems = session.photos.length + session.videos.length;
    const selectedCount = session.photos.filter(p => p.selected).length + 
                         session.videos.filter(v => v.selected).length;

    if (totalItems === 0) return null;

    return (
      <View style={styles.thumbnailSection}>
        <View style={styles.thumbnailHeader}>
          <Text style={styles.thumbnailTitle}>
            Session Photos ({totalItems})
          </Text>
          <View style={styles.selectionControls}>
            <TouchableOpacity onPress={selectAll} style={styles.selectionButton}>
              <Text style={styles.selectionButtonText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deselectAll} style={styles.selectionButton}>
              <Text style={styles.selectionButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView
          ref={thumbnailScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailScroll}
        >
          {session.photos.map(photo => (
            <ThumbnailItem key={photo.id} item={photo} type="photo" />
          ))}
          {session.videos.map(video => (
            <ThumbnailItem key={video.id} item={video} type="video" />
          ))}
        </ScrollView>
        
        {selectedCount > 0 && (
          <Text style={styles.selectedCount}>
            {selectedCount} selected
          </Text>
        )}
      </View>
    );
  };

  /* ---------------- Main Render ---------------- */
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {viewMode === "camera" && (
        <QuickCapture
          visible={true}
          onCapture={handleQuickCapture}
          onClose={() => setViewMode("main")}
          type="photo"
          metadata={{ projectId, section }}
        />
      )}

      {viewMode === "video" && enableVideo && (
        <QuickCapture
          visible={true}
          onCapture={handleQuickVideo}
          onClose={() => setViewMode("main")}
          type="video"
          metadata={{ projectId, section }}
        />
      )}

      {viewMode === "main" && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <LinearGradient {...(SAFE_GRADIENT as any)} style={styles.gradient}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" />
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Photos</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Image source={SAFE_ICONS.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Thumbnail Grid */}
              <ThumbnailGrid />

              {/* Capture Buttons */}
              <View style={styles.captureSection}>
                <TouchableOpacity
                  onPress={() => {
                    setCameraType("photo");
                    setViewMode("camera");
                  }}
                  style={styles.captureButton}
                >
                  <Image source={SAFE_ICONS.camera} style={styles.captureIcon} />
                  <Text style={styles.captureText}>Add Photo</Text>
                </TouchableOpacity>

                {enableVideo && (
                  <TouchableOpacity
                    onPress={() => {
                      setCameraType("video");
                      setViewMode("video");
                    }}
                    style={styles.captureButton}
                  >
                    <Image source={SAFE_ICONS.video} style={styles.captureIcon} />
                    <Text style={styles.captureText}>Add Video</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Metadata Form */}
              <View style={styles.formSection}>
                {/* Section Dropdown */}
                <DropdownComponent
                  label="Section *"
                  data={sectionOptions}
                  value={section}
                  onChange={(val: any) => setSection(val.value || val)}
                  labelField="label"
                  valueField="value"
                />

                {/* Tag Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tag</Text>
                  <TextInput
                    style={styles.textInput}
                    value={tagValue}
                    onChangeText={setTagValue}
                    placeholder="Enter tag (optional)"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                </View>

                {/* Notes Input with STT */}
                <View style={styles.inputContainer}>
                  <View style={styles.notesHeader}>
                    <Text style={styles.inputLabel}>Notes</Text>
                    <Text style={styles.charCount}>{noteLength}/{NOTE_MAX}</Text>
                  </View>
                  
                  <View style={styles.notesInputContainer}>
                    <TextInput
                      style={styles.notesInput}
                      value={note}
                      onChangeText={(text) => {
                        const trimmed = text.slice(0, NOTE_MAX);
                        setNote(trimmed);
                        setNoteLength(trimmed.length);
                      }}
                      placeholder="Add notes (optional)"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      multiline
                      maxLength={NOTE_MAX}
                    />
                    
                    <TouchableOpacity
                      onPress={listening ? handleStopSTT : handleStartSTT}
                      style={[styles.micButton, listening && styles.micButtonActive]}
                    >
                      <Image source={SAFE_ICONS.microphone} style={styles.micIcon} />
                    </TouchableOpacity>
                  </View>

                  {listening && (
                    <Text style={styles.sttStatus}>
                      Listening... {partial || "(speak now)"}
                    </Text>
                  )}
                </View>
              </View>

              {/* Save Button */}
              <Button
                color1="#3B82F6"
                color2="#1E40AF"
                style={styles.saveButton}
                labelStyle={styles.saveButtonLabel}
                onPress={handleBatchSave}
                disabled={saving || session.photos.length + session.videos.length === 0}
              >
                {saving ? "Saving..." : `Save Selected (${
                  session.photos.filter(p => p.selected).length + 
                  session.videos.filter(v => v.selected).length
                })`}
              </Button>
            </ScrollView>

            {/* Success Message */}
            {showSuccessMessage && (
              <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
                <Text style={styles.successText}>{successMessageText}</Text>
              </Animated.View>
            )}
          </LinearGradient>
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
};

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  thumbnailSection: {
    marginBottom: 20,
  },
  thumbnailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  thumbnailTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  selectionControls: {
    flexDirection: "row",
    gap: 12,
  },
  selectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 6,
  },
  selectionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  thumbnailScroll: {
    marginBottom: 8,
  },
  thumbnailItem: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    marginRight: THUMBNAIL_MARGIN,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailSelected: {
    borderColor: "#3B82F6",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  videoIndicator: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 4,
    padding: 2,
  },
  videoIndicatorText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  savedIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  savedIndicatorText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  selectedCount: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
  },
  captureSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  captureButton: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    minWidth: 100,
  },
  captureIcon: {
    width: 32,
    height: 32,
    tintColor: "#FFFFFF",
    marginBottom: 8,
  },
  captureText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  formSection: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 16,
  },
  notesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  notesInputContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  notesInput: {
    flex: 1,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  micButton: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  micButtonActive: {
    backgroundColor: "rgba(239,68,68,0.2)",
  },
  micIcon: {
    width: 24,
    height: 24,
    tintColor: "#FFFFFF",
  },
  sttStatus: {
    marginTop: 8,
    fontSize: 12,
    color: "#FCA5A5",
    fontStyle: "italic",
  },
  saveButton: {
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 16,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  successMessage: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  successText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default PhotoNotesModalV2;