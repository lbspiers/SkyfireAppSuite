// src/components/camera/QuickCapture.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  PermissionsAndroid,
  Platform,
} from "react-native";
import {
  launchCamera,
  CameraOptions,
  Asset,
  ImagePickerResponse,
  request,
  PERMISSIONS,
  RESULTS,
  check,
} from "react-native-image-picker";
import { Linking, Alert } from "react-native";

interface PhotoMetadata {
  fileName?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  fileSize?: number | null;
}

interface VideoFile {
  uri: string;
  durationMs?: number | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
}

type Mode = "photo" | "video";

type Props = {
  visible: boolean;
  mode: Mode;
  onClose: () => void;
  onPhoto?: (localUri: string, meta?: PhotoMetadata) => void;
  onVideo?: (file: VideoFile) => void;
};

const VIDEO_DURATION_LIMIT = 5; // seconds
const log = (...a: any[]) => console.log("[QuickCapture]", ...a);

export default function QuickCapture({
  visible,
  mode,
  onClose,
  onPhoto,
  onVideo,
}: Props) {
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLaunched, setHasLaunched] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  /* ---------------- lifecycle ---------------- */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      log("closed → reset internal state");
      setLaunching(false);
      setError(null);
      setHasLaunched(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    // auto-launch shortly after render so the modal paints first
    if (!hasLaunched && !launching) {
      timeoutRef.current = setTimeout(async () => {
        if (mountedRef.current && visible) await handleLaunchCamera();
      }, 100);
    }
  }, [visible, hasLaunched, launching]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (visible) {
        log("Android back → closing");
        handleClose();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [visible]);

  /* ---------------- helpers ---------------- */
  const handleClose = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onClose();
  }, [onClose]);

  const requestCameraPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === "android") {
        // Android: Use PermissionsAndroid
        const permissions = [
          PermissionsAndroid.PERMISSIONS.CAMERA,
          ...(mode === "video" ? [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] : [])
        ];

        const results = await PermissionsAndroid.requestMultiple(permissions);

        const cameraStatus = results[PermissionsAndroid.PERMISSIONS.CAMERA];
        const cameraGranted = cameraStatus === PermissionsAndroid.RESULTS.GRANTED;

        // Check if user selected "Never ask again"
        if (cameraStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          log("Camera permission permanently denied");
          Alert.alert(
            "Permission Required",
            "Camera permission is required to take photos. Please enable it in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }

        if (mode === "video") {
          const audioStatus = results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
          const audioGranted = audioStatus === PermissionsAndroid.RESULTS.GRANTED;

          if (audioStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            log("Microphone permission permanently denied");
            Alert.alert(
              "Permission Required",
              "Microphone permission is required to record video. Please enable it in your device settings.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() }
              ]
            );
            return false;
          }

          return cameraGranted && audioGranted;
        }

        return cameraGranted;
      } else {
        // iOS: Check camera permission using react-native-image-picker
        // Note: react-native-image-picker handles iOS permissions automatically,
        // but we can check current status to provide better UX
        log("iOS: Camera permissions will be requested by system");
        return true; // Let react-native-image-picker handle iOS permissions
      }
    } catch (err) {
      log("Permission request error:", err);
      return false;
    }
  };

  // Keep literal types for mediaType/videoQuality so TS doesn't widen to string
  const buildCameraOptions = useCallback((): CameraOptions => {
    const common: Pick<
      CameraOptions,
      | "includeBase64"
      | "includeExtra"
      | "quality"
      | "saveToPhotos"
      | "presentationStyle"
    > = {
      includeBase64: false,
      includeExtra: true,
      quality: 1,
      saveToPhotos: false,
      presentationStyle: "fullScreen",
    };

    if (mode === "video") {
      const opts: CameraOptions = {
        ...common,
        mediaType: "video",
        videoQuality: "high", // literal union OK
        durationLimit: VIDEO_DURATION_LIMIT,
      };
      log("options(video)", opts);
      return opts;
    }

    const opts: CameraOptions = {
      ...common,
      mediaType: "photo",
      maxWidth: 1920,
      maxHeight: 1920,
    };
    log("options(photo)", opts);
    return opts;
  }, [mode]);

  const validateAsset = (asset?: Asset): string | null => {
    if (!asset) return "No media data received from camera";
    if (!asset.uri) return "Invalid media file: missing uri";
    if (asset.fileSize === 0) return "Empty media file";
    return null;
  };

  const processPhoto = (asset: Asset) => {
    const meta: PhotoMetadata = {
      fileName: asset.fileName ?? null,
      width: asset.width ?? null,
      height: asset.height ?? null,
      mimeType: asset.type ?? null,
      fileSize: asset.fileSize ?? null,
    };
    log("PHOTO", { uri: asset.uri, ...meta });
    onPhoto?.(asset.uri!, meta);
  };

  const processVideo = (asset: Asset) => {
    const durationMs =
      typeof asset.duration === "number"
        ? Math.round(asset.duration * 1000)
        : null;
    const file: VideoFile = {
      uri: asset.uri!,
      durationMs,
      fileName: asset.fileName ?? null,
      mimeType: asset.type ?? null,
      fileSize: asset.fileSize ?? null,
    };
    log("VIDEO", file);
    onVideo?.(file);
  };

  const handleCameraResponse = (response: ImagePickerResponse) => {
    if (!mountedRef.current) return;

    setLaunching(false);
    log("response keys", Object.keys(response || {}));

    if (response.didCancel) {
      log("user cancelled");
      handleClose();
      return;
    }

    if (response.errorCode || response.errorMessage) {
      log("ERROR", response.errorCode, response.errorMessage);
      let msg = response.errorMessage || `Camera error: ${response.errorCode}`;
      if (response.errorCode === "permission") {
        msg =
          "Camera permission is required. Enable it in Settings and try again.";
      } else if (response.errorCode === "camera_unavailable") {
        msg = "Camera is not available on this device.";
      }
      setError(msg);
      return;
    }

    if (!response.assets?.length) {
      setError("No media captured. Please try again.");
      return;
    }

    const asset = response.assets[0];
    const v = validateAsset(asset);
    if (v) {
      setError(v);
      return;
    }

    if (mode === "photo") processPhoto(asset);
    else processVideo(asset);

    handleClose();
  };

  const handleLaunchCamera = async () => {
    if (!mountedRef.current) return;
    log(`launching camera → ${mode}`);
    setLaunching(true);
    setError(null);
    setHasLaunched(true);

    try {
      // Request permissions first
      const hasPermissions = await requestCameraPermissions();
      
      if (!hasPermissions) {
        log("Permissions denied");
        setLaunching(false);
        setError("Camera permission is required. Please grant permission in your device settings.");
        return;
      }
      
      const options = buildCameraOptions();
      launchCamera(options, (resp) => {
        // tiny delay so state & modal transitions never race
        setTimeout(() => handleCameraResponse(resp), 50);
      });
    } catch (e: any) {
      log("FAILED to launch camera", e?.message || e);
      setLaunching(false);
      setError(e?.message || "Failed to open camera. Please try again.");
    }
  };

  const handleRetry = () => {
    log("retry");
    setError(null);
    setHasLaunched(false);
    setTimeout(async () => {
      if (mountedRef.current && visible) await handleLaunchCamera();
    }, 250);
  };

  /* ---------------- UI ---------------- */
  const Content = () => {
    if (launching) {
      return (
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.status}>Opening camera…</Text>
          <Text style={styles.subtle}>
            {mode === "video"
              ? `Recording limited to ${VIDEO_DURATION_LIMIT}s`
              : "Position your shot and use the capture button"}
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.content}>
          <Text style={styles.error}>{error}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, styles.retry]}
              onPress={handleRetry}
            >
              <Text style={styles.btnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.cancel]}
              onPress={handleClose}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        <Text style={styles.status}>Camera should open automatically</Text>
        <Text style={styles.subtle}>If not, use the button below</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, styles.retry]}
            onPress={handleLaunchCamera}
          >
            <Text style={styles.btnText}>
              {mode === "photo" ? "Open Camera" : "Start Recording"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.cancel]}
            onPress={handleClose}
          >
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      supportedOrientations={["portrait"]}
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {mode === "photo"
              ? "Take Photo"
              : `Record Video (${VIDEO_DURATION_LIMIT}s max)`}
          </Text>
          <Content />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#0C1F3F",
    borderRadius: 16,
    padding: 24,
    elevation: 8,
  },
  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  content: { alignItems: "center", gap: 14 },
  status: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  subtle: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center" },
  error: {
    color: "#FFD3CF",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 12, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  retry: { backgroundColor: "#2F3E5F" },
  cancel: { backgroundColor: "#B92011" },
});
