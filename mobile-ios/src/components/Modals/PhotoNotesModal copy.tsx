// src/components/Modals/PhotoNotesModal.tsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
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
  ScrollView,
  ImageSourcePropType,
  PermissionsAndroid,
  Alert,
  StatusBar,
  Linking,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import {
  ICONS,
  ICON_GALLERY,
  ICON_X,
  ICON_CAMERA,
  ICON_VIDEO,
} from "../../assets/Images/icons";

import DropdownComponent from "../Dropdown";
import Button from "../Button";
import COLORS from "../../utils/styleConstant/Color";
import { BLUE_MD_TB } from "../../styles/gradient";

import QuickCapture from "../camera/QuickCapture";

/* ---------------- Logging ---------------- */
const LOG = (...a: any[]) => console.log("[PhotoNotesModal]", ...a);
const WARN = (...a: any[]) => console.warn("[PhotoNotesModal]", ...a);
console.log("[icons] loaded", ICONS);

/* ---------------- STT hook: safe loader + fallback ---------------- */
type STTHook = () => {
  listening: boolean;
  partial: string;
  finalText: string;
  start: (ms?: number) => void;
  stop: () => void;
  reset: () => void;
};

let useSTT: STTHook;

// Try to load the real hook. If not found, provide a no-op hook so UI never crashes.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sttPath = "../../hooks/useSpeechToText";
  const mod = require(sttPath); // Static string prevents require(undefined)

  // Handle both named and default exports
  useSTT = mod?.default || mod?.useSpeechToText || mod;

  // Validate it's actually a function
  if (typeof useSTT !== "function") {
    throw new Error(
      `useSpeechToText export is not a function: ${typeof useSTT}`
    );
  }

  LOG("useSpeechToText: loaded OK");
} catch (e: any) {
  WARN(
    "useSpeechToText: not available → using no-op fallback. Error:",
    e?.message || String(e)
  );
  useSTT = () => ({
    listening: false,
    partial: "",
    finalText: "",
    start: () => {},
    stop: () => {},
    reset: () => {},
  });
}

/* ---------------- galleryService safe loader (require) ---------------- */
type GallerySvc = {
  uploadCapturedPhoto: (params: any) => Promise<any>;
  uploadCapturedVideo: (params: any) => Promise<any>;
  saveSectionNotes: (params: any) => Promise<void>;
  clearSectionNotes: (params: any) => Promise<void>;
};

let _gallerySvc: GallerySvc | null = null;

function getGalleryService(): GallerySvc {
  if (_gallerySvc) return _gallerySvc;

  LOG("getGalleryService(): requiring module …");
  try {
    // Static path prevents require(undefined)
    const galleryPath = "../../screens/Project/Photos/services/galleryService";
    const mod = require(galleryPath);

    // Handle both named and default exports
    const service = mod?.default || mod;

    if (!service || typeof service !== "object") {
      throw new Error(`galleryService is not an object: ${typeof service}`);
    }

    // Sanity-check expected functions:
    const needed = [
      "uploadCapturedPhoto",
      "uploadCapturedVideo",
      "saveSectionNotes",
      "clearSectionNotes",
    ] as const;

    const missing = needed.filter((k) => typeof service[k] !== "function");

    if (missing.length) {
      throw new Error(
        `galleryService missing functions: ${missing.join(", ")}`
      );
    }

    _gallerySvc = service as GallerySvc;
    LOG("getGalleryService(): loaded OK. Functions:", Object.keys(service));
    return _gallerySvc;
  } catch (e: any) {
    const errorMsg = e?.message || String(e);
    WARN(
      "getGalleryService(): FAILED to require galleryService.",
      "Error:",
      errorMsg
    );

    // Return a no-op service that won't crash the app but will show errors
    const noOpService: GallerySvc = {
      uploadCapturedPhoto: async () => {
        throw new Error("Gallery service not available");
      },
      uploadCapturedVideo: async () => {
        throw new Error("Gallery service not available");
      },
      saveSectionNotes: async () => {
        throw new Error("Gallery service not available");
      },
      clearSectionNotes: async () => {
        throw new Error("Gallery service not available");
      },
    };

    _gallerySvc = noOpService;
    return noOpService;
  }
}

/* ---------------- Constants & assets ---------------- */
const NOTE_MAX = 500;
const DEBOUNCE_DELAY = 300;

const GRADIENT_FALLBACK = {
  colors: ["#2E4161", "#0C1F3F"],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};
const SAFE_GRADIENT =
  BLUE_MD_TB && Array.isArray((BLUE_MD_TB as any).colors)
    ? BLUE_MD_TB
    : GRADIENT_FALLBACK;

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

  galleryIconSource?: ImageSourcePropType;

  projectId: string;
  companyId: string;
}

/* ---------------- Permissions (Android) ---------------- */
const PermissionManager = {
  async requestCamera(): Promise<boolean> {
    if (Platform.OS !== "android") return true;
    try {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Access Required",
          message:
            "We need access to your camera to take site photos and videos.",
          buttonPositive: "Grant",
          buttonNegative: "Deny",
        }
      );
      const ok = res === PermissionsAndroid.RESULTS.GRANTED;
      if (!ok) {
        Alert.alert(
          "Camera denied",
          "Enable camera in Settings to take photos/videos.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
      return ok;
    } catch (e) {
      WARN("CAMERA request failed:", e);
      return false;
    }
  },

  async requestMic(): Promise<boolean> {
    if (Platform.OS !== "android") return true;
    try {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Access Required",
          message:
            "We need access to your microphone to record audio with videos.",
          buttonPositive: "Grant",
          buttonNegative: "Deny",
        }
      );
      const ok = res === PermissionsAndroid.RESULTS.GRANTED;
      if (!ok) {
        Alert.alert(
          "Microphone denied",
          "Enable microphone in Settings to record audio.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
      return ok;
    } catch (e) {
      WARN("RECORD_AUDIO request failed:", e);
      return false;
    }
  },
};

/* ---------------- Utils ---------------- */
function validateAssetId(name: string, asset: any): number {
  if (typeof asset !== "number") {
    WARN(`Invalid asset ${name}:`, typeof asset);
    return ICON_GALLERY;
  }
  return asset;
}

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/* ---------------- Component ---------------- */
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
  onMediaAdded,
  galleryIconSource,
  projectId,
  companyId,
}: Props) {
  const [captureMode, setCaptureMode] = useState<null | "photo" | "video">(
    null
  );
  const [note, setNote] = useState(initialNote);
  const [summary, setSummary] = useState("");
  const [working, setWorking] = useState(false);

  const stt = useSTT();

  /* ---------- lifecycle logs ---------- */
  useEffect(() => {
    LOG("mount");
    LOG("icons", {
      ICON_X,
      ICON_CAMERA,
      ICON_VIDEO,
      ICON_GALLERY,
      types: {
        x: typeof ICON_X,
        cam: typeof ICON_CAMERA,
        vid: typeof ICON_VIDEO,
        gal: typeof ICON_GALLERY,
      },
    });
    LOG("gradient", SAFE_GRADIENT);
  }, []);

  useEffect(() => {
    if (visible) setNote(initialNote);
  }, [visible, initialNote]);

  useEffect(() => {
    if (stt.finalText) {
      setNote((prev) => {
        const sep = prev && !prev.endsWith(" ") ? " " : "";
        const merged = (prev + sep + stt.finalText).slice(0, NOTE_MAX);
        LOG("STT final → appended", {
          prevLen: prev.length,
          newLen: merged.length,
        });
        return merged;
      });
    }
  }, [stt.finalText]);

  const remainingChars = Math.max(0, NOTE_MAX - note.length);
  const sectionName = useMemo(
    () => title.replace(/\s*Photos?\s*&?\s*Notes?\s*$/i, "").trim(),
    [title]
  );

  const assets = useMemo(
    () => ({
      close: ICONS.close,
      camera: ICONS.camera,
      video: ICONS.video,
      gallery:
        typeof galleryIconSource === "number"
          ? (galleryIconSource as number)
          : ICON_GALLERY,
    }),
    [galleryIconSource]
  );

  /* ---------------- Handlers ---------------- */
  const handleOpenGallery = useCallback(() => {
    LOG("Photo Gallery tapped → section:", sectionName);
    onOpenGallery?.(sectionName);
  }, [onOpenGallery, sectionName]);

  const handleTakePhoto = useCallback(async () => {
    LOG("Take Photo tapped");
    const cam = await PermissionManager.requestCamera();
    if (!cam) return;
    setCaptureMode("photo");
  }, []);

  const handleRecordVideo = useCallback(async () => {
    LOG("Record Video tapped");
    const [cam, mic] = await Promise.all([
      PermissionManager.requestCamera(),
      PermissionManager.requestMic(),
    ]);
    if (!cam || !mic) return;
    setCaptureMode("video");
  }, []);

  const doSaveNotes = useCallback(async () => {
    const cleanNote = note.trim();
    const cleanSummary = summary.trim();
    if (!cleanNote && !cleanSummary) return;

    setWorking(true);
    try {
      LOG("saveSectionNotes →", {
        projectId,
        section: sectionName,
        noteLen: cleanNote.length,
        hasSummary: !!cleanSummary,
      });
      const svc = getGalleryService();
      await svc.saveSectionNotes({
        projectId,
        section: sectionName,
        note: cleanNote || null,
        aiSummary: cleanSummary || null,
      });
      onSaveNote?.(cleanNote);
      LOG("saveSectionNotes ← OK");
      Alert.alert("Saved", "Your notes have been saved.");
    } catch (e) {
      WARN("saveSectionNotes ← ERROR", e);
      Alert.alert("Save failed", "Could not save notes. Try again.");
    } finally {
      setWorking(false);
    }
  }, [note, summary, projectId, sectionName, onSaveNote]);

  const handleClearNotes = useCallback(() => {
    Alert.alert("Clear notes", "Remove all notes for this section?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setWorking(true);
          try {
            LOG("clearSectionNotes →", { projectId, section: sectionName });
            const svc = getGalleryService();
            await svc.clearSectionNotes({ projectId, section: sectionName });
            setNote("");
            setSummary("");
            onSaveNote?.("");
            LOG("clearSectionNotes ← OK");
          } catch (e) {
            WARN("clearSectionNotes ← ERROR", e);
            Alert.alert("Failed", "Could not clear notes.");
          } finally {
            setWorking(false);
          }
        },
      },
    ]);
  }, [projectId, sectionName, onSaveNote]);

  const debouncedLog = useMemo(
    () =>
      debounce((len: number) => {
        LOG(`Note length → ${len}`);
      }, DEBOUNCE_DELAY),
    []
  );

  const onChangeNote = useCallback(
    (t: string) => {
      const clipped = t.slice(0, NOTE_MAX);
      setNote(clipped);
      debouncedLog(clipped.length);
    },
    [debouncedLog]
  );

  /* ---------------- Render ---------------- */
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.55)" barStyle="light-content" />

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
                source={assets.close}
                style={styles.closeIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Tag */}
          <View style={styles.section}>
            <DropdownComponent<TagOption>
              label="Tag*"
              data={tagOptions}
              value={tagValue}
              onChange={onChangeTag}
              valueField="value"
              labelField="label"
            />
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleOpenGallery}
              activeOpacity={0.8}
            >
              <Image
                source={assets.gallery}
                style={styles.actionIcon}
                resizeMode="contain"
              />
              <Text style={styles.actionText}>Photo Gallery</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleTakePhoto}
              activeOpacity={0.8}
            >
              <Image
                source={assets.camera}
                style={styles.actionIcon}
                resizeMode="contain"
              />
              <Text style={styles.actionText}>Take Photo</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRecordVideo}
              activeOpacity={0.8}
            >
              <Image
                source={assets.video}
                style={styles.actionIcon}
                resizeMode="contain"
              />
              <Text style={styles.actionText}>Record Video</Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <View style={styles.notesHeader}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <TouchableOpacity
                onPress={() => (stt.listening ? stt.stop() : stt.start(60_000))}
                style={[
                  styles.speechButton,
                  { backgroundColor: stt.listening ? "#B92011" : "#2F3E5F" },
                ]}
                activeOpacity={0.9}
              >
                <Text style={styles.speechButtonText}>
                  {stt.listening ? "Stop Mic" : "Voice to Text"}
                </Text>
              </TouchableOpacity>
            </View>

            {!!stt.partial && (
              <Text style={styles.speechPreview}>{stt.partial}</Text>
            )}

            <TextInput
              value={note}
              onChangeText={onChangeNote}
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

            {/* AI Summary (stub) */}
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>AI Summary</Text>
              <View style={styles.summaryContainer}>
                <ScrollView
                  style={styles.summaryScroll}
                  contentContainerStyle={styles.summaryContent}
                  showsVerticalScrollIndicator
                >
                  <Text style={styles.summaryText}>
                    {summary ||
                      "AI-generated summary will appear here once implemented."}
                  </Text>
                </ScrollView>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <Button
                label="Clear Notes"
                onPress={handleClearNotes}
                disabled={working || (!note.trim() && !summary.trim())}
                style={[styles.button, styles.secondaryButton]}
                labelStyle={styles.secondaryButtonText}
              />
              <Button
                label={working ? "Saving..." : "Save Notes"}
                onPress={doSaveNotes}
                disabled={working || (!note.trim() && !summary.trim())}
                style={[styles.button, styles.primaryButton]}
                labelStyle={styles.primaryButtonText}
              />
            </View>
          </View>

          {/* Capture modal */}
          <QuickCapture
            visible={!!captureMode}
            mode={captureMode ?? "photo"}
            onClose={() => setCaptureMode(null)}
            onPhoto={async (path) => {
              LOG("onPhoto() →", {
                companyId,
                projectId,
                section: sectionName,
                tag: tagValue ?? null,
                noteLen: (note || "").trim().length,
                localUri: path,
              });
              setWorking(true);
              try {
                const svc = getGalleryService();
                const item = await svc.uploadCapturedPhoto({
                  companyId,
                  projectId,
                  localUri: path,
                  section: sectionName,
                  tag: tagValue ?? null,
                  note: (note || "").trim() || null,
                });
                LOG("uploadCapturedPhoto ← OK", {
                  id: item?.id,
                  url: item?.url,
                });
                onMediaAdded?.("photo");
                setCaptureMode(null);
              } catch (e) {
                WARN("uploadCapturedPhoto ← ERROR", e);
                Alert.alert("Upload failed", "Could not upload photo.");
              } finally {
                setWorking(false);
              }
            }}
            onVideo={async (file) => {
              LOG("onVideo() →", {
                companyId,
                projectId,
                section: sectionName,
                tag: tagValue ?? null,
                durationMs: file?.durationMs,
                fileSize: file?.fileSize,
                localUri: file?.uri,
              });
              setWorking(true);
              try {
                const svc = getGalleryService();
                const item = await svc.uploadCapturedVideo({
                  companyId,
                  projectId,
                  localUri: file.uri,
                  section: sectionName,
                  tag: tagValue ?? null,
                  durationMs: file.durationMs ?? undefined,
                });
                LOG("uploadCapturedVideo ← OK", {
                  id: item?.id,
                  url: item?.url,
                });
                onMediaAdded?.("video");
                setCaptureMode(null);
              } catch (e) {
                WARN("uploadCapturedVideo ← ERROR", e);
                Alert.alert("Upload failed", "Could not upload video.");
              } finally {
                setWorking(false);
              }
            }}
          />
        </LinearGradient>
      </KeyboardAvoidingView>
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
    maxWidth: 500,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    maxHeight: "90%",
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  closeButton: { padding: 4 },
  closeIcon: { width: 18, height: 18 },

  section: { marginBottom: 16 },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  actionButton: { flex: 1, alignItems: "center", paddingVertical: 8, gap: 8 },
  actionIcon: { width: 56, height: 56, tintColor: "#FFFFFF" },
  actionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  actionDivider: {
    width: 1,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 4,
  },

  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  speechButton: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  speechButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  speechPreview: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  noteInput: {
    minHeight: 100,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 12,
    padding: 14,
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
  },
  characterCounter: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 12,
  },

  summarySection: { marginBottom: 16 },
  summaryLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  summaryContainer: {
    minHeight: 80,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 12,
    padding: 12,
  },
  summaryScroll: { flex: 1 },
  summaryContent: { flexGrow: 1, justifyContent: "center" },
  summaryText: { color: "#FFFFFF", fontSize: 14, lineHeight: 18 },

  buttonRow: { flexDirection: "row", gap: 12 },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: { backgroundColor: COLORS.orange },
  secondaryButton: { backgroundColor: "#2F66FF" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  secondaryButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
});
