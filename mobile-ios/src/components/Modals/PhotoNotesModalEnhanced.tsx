// src/components/Modals/PhotoNotesModalEnhanced.tsx - ENHANCED VERSION WITH THUMBNAIL BATCH & BLUR DETECTION
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
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { ICONS, ICON_MICROPHONE } from "../../assets/Images/icons";
import COLORS from "../../utils/styleConstant/Color";
import { BLUE_MD_TB } from "../../styles/gradient";
import Button from "../Button";
import QuickCapture from "../camera/QuickCapture";
import { photoService, PhotoRecord } from "../../api/photo.service";
import { useProjectContext } from "../../hooks/useProjectContext";
import { checkPhotoQuality, QualityResult } from "../../utils/imageQualityAnalysis";
import { getVideoThumbnailInfo, extractVideoMetadata } from "../../utils/videoThumbnailSimple";
import BrandedAlert, { useBrandedAlert } from "../BrandedAlert";

/* ---------------- Logging ---------------- */
const LOG = (...a: any[]) => console.log("[PhotoNotesModalEnhanced]", ...a);
const WARN = (...a: any[]) => console.warn("[PhotoNotesModalEnhanced]", ...a);

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

/* ---------------- Types ---------------- */
export type TagOption = { label: string; value: string };

interface CapturedPhoto {
  id: string;
  uri: string;
  thumbnailUri?: string;
  selected: boolean;
  type: 'photo' | 'video';
  metadata: {
    fileName: string;
    mimeType: string;
    fileSize?: number;
    width?: number;
    height?: number;
    durationMs?: number; // for videos
  };
  timestamp: Date;
  qualityAnalysis?: QualityResult; // Added for blur detection
}

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

/* ---------------- Thumbnail Row Component ---------------- */
const ThumbnailRow = ({ 
  photos, 
  onToggleSelection, 
  onDelete 
}: {
  photos: CapturedPhoto[];
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => void;
}) => (
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    style={styles.thumbnailContainer}
  >
    {photos.map(photo => (
      <View key={photo.id} style={styles.thumbnailWrapper}>
        <TouchableOpacity 
          onPress={() => onToggleSelection(photo.id)}
          activeOpacity={0.8}
        >
          <Image 
            source={{ uri: photo.uri }} 
            style={[
              styles.thumbnail,
              photo.selected && styles.thumbnailSelected
            ]} 
          />
          
          {/* Quality warning indicator */}
          {photo.qualityAnalysis && !photo.qualityAnalysis.isAcceptable && (
            <View style={styles.qualityWarning}>
              <Text style={{ color: '#FFA500', fontSize: 10, fontWeight: 'bold' }}>⚠</Text>
            </View>
          )}
          
          {/* Video indicator */}
          {photo.type === 'video' && (
            <View style={styles.videoIndicator}>
              <Image 
                source={SAFE_ICONS.video}
                style={styles.videoIcon}
                resizeMode="contain"
              />
            </View>
          )}
        </TouchableOpacity>
        
        {/* Selection indicator - TOP LEFT */}
        <TouchableOpacity 
          style={[styles.selectionButton, photo.selected && styles.selectionButtonActive]}
          onPress={() => onToggleSelection(photo.id)}
        >
          {photo.selected && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        
        {/* Delete button - TOP RIGHT */}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => onDelete(photo.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      </View>
    ))}
  </ScrollView>
);

/* ---------------- Main Component ---------------- */
export default function PhotoNotesModalEnhanced({
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
  galleryIconSize = 36,
}: Props) {
  // Safe navigation hook that handles missing NavigationContainer
  let navigation: any = null;
  try {
    const { useNavigation } = require("@react-navigation/native");
    navigation = useNavigation();
  } catch (error) {
    WARN("[PhotoNotesModalEnhanced] Navigation not available:", error);
  }

  const { projectId: contextProjectId, companyId: contextCompanyId } =
    useProjectContext();
  const projectId = propProjectId || contextProjectId;
  const companyId = propCompanyId || contextCompanyId;

  // All existing state preserved
  const [note, setNote] = useState(initialNote);
  const [summary, setSummary] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [refreshGallery, setRefreshGallery] = useState(0);
  
  // NEW: Thumbnail management state
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Branded alert state
  const { alertState, showAlert, hideAlert, AlertComponent } = useBrandedAlert();

  // Load existing photos for this section when modal opens
  useEffect(() => {
    if (visible && projectId && section) {
      LOG("Loading existing photos for section:", section);
      photoService.getPhotosBySection(projectId, section)
        .then(photos => {
          LOG(`Found ${photos.length} existing photos for section:`, section);
          // You could display these photos or show a count
          // For now, just log them
        })
        .catch(error => {
          WARN("Failed to load section photos:", error);
        });
    }
  }, [visible, projectId, section]);

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

  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleNoteChange = useCallback((text: string) => {
    setNote(text.slice(0, NOTE_MAX));
  }, []);

  // NEW: Enhanced save with branded alerts and complete reset
  const handleSaveNote = useCallback(async () => {
    const cleanNote = note.trim();
    const selectedPhotos = capturedPhotos.filter(p => p.selected);
    
    if (!cleanNote && selectedPhotos.length === 0) {
      showAlert("No Content", "Please enter a note or capture photos to save.", [
        { text: "OK", onPress: () => {} }
      ]);
      return;
    }

    setIsSaving(true);
    try {
      // Save note if provided
      if (cleanNote) {
        onSaveNote?.(cleanNote);
        LOG("Note saved:", {
          noteLength: cleanNote.length,
          section,
          projectId,
          companyId,
        });
      }
      
      // Batch save selected photos
      if (selectedPhotos.length > 0) {
        LOG("Saving photos with metadata:", {
          count: selectedPhotos.length,
          section,
          tag: tagValue,
          note: cleanNote,
        });

        const savePromises = selectedPhotos.map(photo => {
          const photoData: any = {
            section,
            tag: tagValue || undefined,
            note: cleanNote || undefined,
            media_type: photo.type,
            file_name: photo.metadata.fileName,
            mime_type: photo.metadata.mimeType,
            file_size: photo.metadata.fileSize,
            duration_ms: photo.metadata.durationMs,
          };

          // For videos, include thumbnail/poster URL if available
          if (photo.type === 'video' && photo.thumbnailUri) {
            photoData.poster_url = photo.thumbnailUri;
            photoData.thumb_url = photo.thumbnailUri;
          }

          LOG("Creating photo with data:", {
            uri: photo.uri,
            data: photoData,
            hasThumbnail: !!photoData.poster_url,
          });

          return photoService.createPhoto(projectId, companyId, photo.uri, photoData);
        });
        
        await Promise.all(savePromises);
        
        // Trigger gallery refresh
        setRefreshGallery(prev => prev + 1);
        
        LOG("Photos batch saved:", {
          count: selectedPhotos.length,
          section,
          projectId,
        });
      }
      
      // Create appropriate success message
      const message = cleanNote && selectedPhotos.length > 0 
        ? `Note and ${selectedPhotos.length} photo${selectedPhotos.length > 1 ? 's' : ''} saved successfully!`
        : cleanNote 
          ? "Note saved successfully!"
          : `${selectedPhotos.length} photo${selectedPhotos.length > 1 ? 's' : ''} saved successfully!`;
      
      // Complete form reset after successful save
      setNote("");                    // Clear notes
      onChangeTag("");               // Clear tags
      setCapturedPhotos(prev => prev.filter(p => !p.selected)); // Remove saved photos
      
      showAlert("Success", message, [
        { text: "OK", onPress: () => {} }
      ]);
      
    } catch (error) {
      LOG("Failed to save:", error);
      showAlert(
        "Save Error", 
        "Failed to save. Please check your connection and try again.",
        [{ text: "OK", onPress: () => {} }]
      );
    } finally {
      setIsSaving(false);
    }
  }, [note, capturedPhotos, onSaveNote, section, projectId, companyId, tagValue, onChangeTag, showAlert]);

  // NEW: Enhanced clear with branded alert
  const handleClearNote = useCallback(() => {
    const hasNote = note.trim().length > 0;
    const hasPhotos = capturedPhotos.length > 0;
    
    if (!hasNote && !hasPhotos) return;

    const message = hasNote && hasPhotos 
      ? "Clear your note and remove all captured photos?"
      : hasNote 
        ? "Remove your note for this section?"
        : "Remove all captured photos?";

    showAlert("Clear Content", message, [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Clear",
        onPress: () => {
          setNote("");
          setSummary("");
          setCapturedPhotos([]);
          onSaveNote?.("");
          onChangeTag(""); // Also clear tag
        },
        style: "destructive"
      },
    ]);
  }, [note, capturedPhotos, onSaveNote, onChangeTag, showAlert]);

  // NEW: Enhanced photo capture with blur detection
  const handlePhotoCapture = useCallback(
    async (localUri: string, meta?: any) => {
      LOG("handlePhotoCapture called - analyzing quality:", {
        projectId,
        companyId,
        section,
        localUri,
        meta,
      });

      if (!projectId || !companyId || !section) {
        showAlert("Error", "Missing project information", [
          { text: "OK", onPress: () => {} }
        ]);
        return;
      }

      try {
        // Start quality analysis
        setIsAnalyzing(true);
        setViewMode("main"); // Return to main view while analyzing
        
        // Analyze image quality
        const qualityResult = await checkPhotoQuality(localUri);
        LOG("Quality analysis result:", qualityResult);
        
        const fileName = generateFileName("photo", "jpg");
        
        // Create photo entry with quality analysis
        const newPhoto: CapturedPhoto = {
          id: generateId(),
          uri: localUri,
          thumbnailUri: localUri,
          selected: true,
          type: 'photo',
          metadata: {
            fileName,
            mimeType: meta?.mimeType || "image/jpeg",
            fileSize: meta?.fileSize,
            width: meta?.width,
            height: meta?.height,
          },
          timestamp: new Date(),
          qualityAnalysis: qualityResult,
        };
        
        // Check if quality is acceptable
        if (!qualityResult.isAcceptable) {
          // Show branded quality warning dialog
          showAlert(
            "Photo Quality Warning",
            qualityResult.recommendation,
            [
              {
                text: "Retake",
                onPress: () => setViewMode("camera"),
                style: "default"
              },
              {
                text: "Keep Anyway",
                onPress: () => {
                  setCapturedPhotos(prev => [...prev, newPhoto]);
                },
                style: "destructive"
              }
            ]
          );
        } else {
          // Quality is good, add to thumbnails
          setCapturedPhotos(prev => [...prev, newPhoto]);
        }
        
        LOG("Photo processed:", { fileName, section, quality: qualityResult.isAcceptable });
      } catch (error: any) {
        LOG("Failed to process photo:", error);
        showAlert("Error", "Failed to capture photo. Please try again.", [
          { text: "OK", onPress: () => {} }
        ]);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [projectId, companyId, section, generateFileName, generateId, showAlert]
  );

  // NEW: Enhanced video capture with thumbnail generation
  const handleVideoCapture = useCallback(
    async (file: any) => {
      if (!projectId || !companyId || !section) {
        Alert.alert("Error", "Missing project information");
        return;
      }

      try {
        LOG("handleVideoCapture called - generating thumbnail:", {
          projectId,
          companyId,
          section,
          videoUri: file.uri,
        });

        // Start analyzing
        setIsAnalyzing(true);
        setViewMode("main"); // Return to main view while processing

        // Extract video metadata and thumbnail info
        const [metadata, thumbnailInfo] = await Promise.all([
          extractVideoMetadata(file.uri),
          getVideoThumbnailInfo(file.uri),
        ]);

        LOG("Video metadata extracted:", metadata);
        LOG("Video thumbnail info:", thumbnailInfo);

        const fileName = generateFileName("video", metadata.extension);

        // Create thumbnail entry for video with generated thumbnail
        const newVideo: CapturedPhoto = {
          id: generateId(),
          uri: file.uri,
          thumbnailUri: thumbnailInfo.thumbnailUri || file.uri, // Use video URI as poster
          selected: true,
          type: 'video',
          metadata: {
            fileName,
            mimeType: metadata.mimeType,
            fileSize: thumbnailInfo.fileSize || file.fileSize,
            durationMs: thumbnailInfo.durationMs || file.durationMs,
          },
          timestamp: new Date(),
        };

        // Add to thumbnails instead of immediate save
        setCapturedPhotos(prev => [...prev, newVideo]);

        LOG("Video added to thumbnails:", {
          fileName,
          section,
          fileSize: thumbnailInfo.fileSize,
          hasThumbnail: !!thumbnailInfo.thumbnailUri,
        });
      } catch (error) {
        LOG("Failed to add video:", error);
        Alert.alert("Error", "Failed to capture video. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [projectId, companyId, section, generateFileName, generateId]
  );

  // NEW: Toggle photo selection
  const handleTogglePhoto = useCallback((id: string) => {
    setCapturedPhotos(prev => 
      prev.map(photo => 
        photo.id === id 
          ? { ...photo, selected: !photo.selected }
          : photo
      )
    );
  }, []);

  // NEW: Delete photo from thumbnails
  const handleDeletePhoto = useCallback((id: string) => {
    setCapturedPhotos(prev => prev.filter(photo => photo.id !== id));
  }, []);

  // Button handlers (preserved exactly from original)
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
            fromScreen: "PhotoNotesModalEnhanced",
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

  // Calculate selected count for display
  const selectedCount = capturedPhotos.filter(p => p.selected).length;
  const totalCount = capturedPhotos.length;

  // Update button text based on content with dynamic sizing
  const { saveButtonText, saveButtonTextStyle } = useMemo(() => {
    let text = "Save";
    if (isSaving) {
      text = "Saving...";
    } else {
      const hasNote = note.trim().length > 0;
      const hasSelectedPhotos = selectedCount > 0;
      
      if (hasNote && hasSelectedPhotos) {
        text = `Save Note & ${selectedCount} Photo${selectedCount > 1 ? 's' : ''}`;
      } else if (hasSelectedPhotos) {
        text = `Save ${selectedCount} Photo${selectedCount > 1 ? 's' : ''}`;
      } else if (hasNote) {
        text = "Save Note";
      }
    }
    
    // Dynamic text style based on length
    const textStyle = text.length > 20 
      ? { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 }
      : text.length > 15
      ? { fontSize: 14, fontWeight: '600' as const, lineHeight: 18 }
      : { fontSize: 16, fontWeight: '700' as const, lineHeight: 20 };
      
    return { saveButtonText: text, saveButtonTextStyle: textStyle };
  }, [isSaving, note, selectedCount]);

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
            {/* Header - EXACTLY THE SAME */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {section && (
                  <Text style={styles.sectionLabel} numberOfLines={1}>
                    Section: {section}
                  </Text>
                )}
              </View>
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

            {/* Tag Dropdown - EXACTLY THE SAME */}
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

            {/* Action Buttons - 4 BUTTONS - EXACTLY THE SAME */}
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
                      styles.galleryActionIcon,
                      {
                        tintColor: "#FD7332",
                        width: galleryIconSize || 46,
                        height: galleryIconSize || 46,
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

            {/* Notes Section - EXACTLY THE SAME */}
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

            {/* NEW: Thumbnail Row with quality indicators */}
            {capturedPhotos.length > 0 && (
              <View style={styles.thumbnailSection}>
                <Text style={styles.thumbnailTitle}>
                  Captured Media ({selectedCount} of {totalCount} selected)
                </Text>
                <ThumbnailRow 
                  photos={capturedPhotos}
                  onToggleSelection={handleTogglePhoto}
                  onDelete={handleDeletePhoto}
                />
              </View>
            )}
            
            {/* Quality Analysis Loading Indicator */}
            {isAnalyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="small" color="#FD7332" />
                <Text style={styles.analyzingText}>Analyzing photo quality...</Text>
              </View>
            )}

            {/* AI Summary Section - EXACTLY THE SAME */}
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

            {/* Save/Clear Buttons - Enhanced functionality, same look */}
            <View style={styles.buttonRow}>
              <Button
                title={isSaving ? "Clearing..." : "Clear All"}
                onPress={handleClearNote}
                disabled={(!note.trim() && capturedPhotos.length === 0) || isSaving}
                width="48%"
                height={48}
                selected={false}
                rounded={24}
                style={{ opacity: 1 }}
              />

              <Button
                title={saveButtonText}
                onPress={handleSaveNote}
                disabled={(!note.trim() && selectedCount === 0) || isSaving}
                width="48%"
                height={48}
                selected={true}
                rounded={24}
                style={{ opacity: 1 }}
                textStyle={saveButtonTextStyle}
              />
            </View>
            
            {/* Branded Alert Component */}
            {AlertComponent}
          </LinearGradient>
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  // Enhanced layout with larger modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 580,         // Increased for better content accommodation
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    maxHeight: "96%",      // More screen real estate
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  sectionLabel: {
    color: "#FD7332",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  closeButton: { padding: 6 },
  closeIcon: { width: 20, height: 20 },

  section: { 
    marginBottom: 16,      // Tighter spacing between sections
  },

  // Enhanced Action Buttons with tighter layout
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
    marginBottom: 14,      // Reduced gap to notes
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 12,
  },
  iconContainer: {
    height: 54,            // Larger icon container
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  voiceIconContainer: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceTextLabel: {
    marginTop: 4,          // Consistent spacing
  },
  actionIcon: { 
    width: 54,             // Larger icons
    height: 54, 
  },
  galleryActionIcon: {
    // Special handling for gallery icon
    width: 46,
    height: 46,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 4,
    marginTop: 4,          // Consistent spacing from icons
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

  // Enhanced Note Input for better usability
  noteInput: {
    minHeight: 160,        // Significantly larger
    maxHeight: 220,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 12,
    padding: 18,           // More comfortable padding
    color: "#FFFFFF",
    fontSize: 18,          // Larger, more readable font
    lineHeight: 26,        // Better line spacing
    fontWeight: "400",
    textAlignVertical: "top",
  },
  characterCounter: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    alignSelf: "flex-end",
    marginTop: 6,
    marginBottom: 12,
  },

  // AI Summary Section - Preserved exactly
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

  // Button Row Styling - Preserved exactly
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  // NEW: Thumbnail-specific styles
  thumbnailSection: {
    marginBottom: 16,
  },
  thumbnailTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  thumbnailContainer: {
    maxHeight: 120,       // Increased height to accommodate shifted thumbnails
    paddingVertical: 8,   // Add padding to prevent cutoff
  },
  thumbnailWrapper: {
    marginRight: 14,
    marginTop: 15,         // Increased top margin to prevent button cutoff
    marginBottom: 10,      // Increased bottom margin
    marginLeft: 10,        // Added left margin to prevent left cutoff
    position: 'relative',
  },
  thumbnail: {
    width: 95,             // Larger thumbnails
    height: 95,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderColor: COLORS.orange || '#FD7332',
  },
  selectionButton: {
    position: 'absolute',
    top: -5,               // Reduced negative offset
    left: -5,              // Reduced negative offset
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 12,
  },
  selectionButtonActive: {
    backgroundColor: '#FD7332',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    top: -5,               // Reduced negative offset
    right: -5,             // Reduced negative offset
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 12,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 4,
  },
  videoIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
  },
  
  // Quality analysis indicators
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(253, 115, 50, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
  },
  analyzingText: {
    color: '#FD7332',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  qualityWarning: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 4,
  },
});