// src/context/PhotoCaptureContext.tsx - STEP 1: TEST VERSION
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { View, Text, TouchableOpacity } from "react-native";

export type TagOption = { label: string; value: string };

export type OpenCaptureConfig = {
  projectId: string;
  companyId: string;
  section?: string;
  tagOptions?: TagOption[];
  tagValue?: string | null;
  initialNote?: string;
  onMediaAdded?: (t: "photo" | "video") => void;
  onOpenGallery?: (section?: string) => void;
  onSaveNote?: (note: string) => void;
};

type Ctx = {
  openCapture: (cfg: OpenCaptureConfig) => void;
  closeCapture: () => void;
};

const PhotoCaptureContext = createContext<Ctx | null>(null);

export function PhotoCaptureProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [cfg, setCfg] = useState<OpenCaptureConfig | null>(null);
  const [tagValue, setTagValue] = useState<string | null>(null);
  const [note, setNote] = useState<string>("");

  const openCapture = useCallback((incoming: OpenCaptureConfig) => {
    console.log("[PhotoCaptureContext] TEST: openCapture called", incoming);
    setCfg(incoming);
    setTagValue(incoming.tagValue ?? null);
    setNote(incoming.initialNote ?? "");
    setVisible(true);
  }, []);

  const closeCapture = useCallback(() => {
    console.log("[PhotoCaptureContext] TEST: closeCapture called");
    setVisible(false);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ openCapture, closeCapture }),
    [openCapture, closeCapture]
  );

  const section = (cfg?.section || "").trim();
  const title = section ? `${section} Photos & Notes` : "Photos & Notes";

  if (__DEV__) {
    console.log(
      "[PhotoCaptureContext] TEST VERSION - PhotoNotesModal disabled"
    );
  }

  return (
    <PhotoCaptureContext.Provider value={value}>
      {children}

      {cfg && visible && (
        <View
          style={{
            position: "absolute",
            top: 200,
            left: 50,
            right: 50,
            backgroundColor: "rgba(0,0,0,0.9)",
            padding: 20,
            borderRadius: 10,
            zIndex: 9999,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
            }}
          >
            TEST MODE: Camera Disabled
          </Text>
          <Text style={{ color: "white", marginBottom: 5 }}>
            Title: {title}
          </Text>
          <Text style={{ color: "white", marginBottom: 15 }}>
            Section: {section}
          </Text>
          <TouchableOpacity
            onPress={closeCapture}
            style={{ backgroundColor: "#FD7332", padding: 10, borderRadius: 5 }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </PhotoCaptureContext.Provider>
  );
}

export function usePhotoCapture(): Ctx {
  const ctx = useContext(PhotoCaptureContext);
  if (!ctx) {
    throw new Error(
      "usePhotoCapture must be used within a <PhotoCaptureProvider>"
    );
  }
  return ctx;
}

export function usePhotoCaptureOptional(): Ctx | null {
  return useContext(PhotoCaptureContext);
}

export function useOpenPhotoCapture() {
  return usePhotoCapture().openCapture;
}

export default PhotoCaptureProvider;
