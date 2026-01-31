// src/context/PhotoCaptureContext.tsx - WITH SECTION SUPPORT
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { FEATURE_FLAGS } from "../utils/constants";
import PhotoNotesModal from "../components/Modals/PhotoNotesModal";
import PhotoNotesModalEnhanced from "../components/Modals/PhotoNotesModalEnhanced";

// Select modal based on feature flag
const PhotoModal = FEATURE_FLAGS.USE_ENHANCED_PHOTO_MODAL ? PhotoNotesModalEnhanced : PhotoNotesModal;

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
  isOpen: boolean;
  currentSection?: string;
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
    console.log("[PhotoCaptureContext] Opening capture modal:", {
      section: incoming.section,
      projectId: incoming.projectId,
      companyId: incoming.companyId,
    });

    // Validate required fields
    if (!incoming.projectId) {
      console.warn(
        "[PhotoCaptureContext] Missing projectId - modal may not function properly"
      );
    }
    if (!incoming.companyId) {
      console.warn(
        "[PhotoCaptureContext] Missing companyId - modal may not function properly"
      );
    }

    setCfg(incoming);
    setTagValue(incoming.tagValue ?? null);
    setNote(incoming.initialNote ?? "");
    setVisible(true);
  }, []);

  const closeCapture = useCallback(() => {
    console.log("[PhotoCaptureContext] Closing modal");
    setVisible(false);
    // Clear state after a delay to allow modal close animation
    setTimeout(() => {
      setCfg(null);
      setTagValue(null);
      setNote("");
    }, 300);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      openCapture,
      closeCapture,
      isOpen: visible,
      currentSection: cfg?.section,
    }),
    [openCapture, closeCapture, visible, cfg?.section]
  );

  const section = (cfg?.section || "").trim();
  const title = section ? `${section} Photos & Notes` : "Photos & Notes";

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log("[PhotoCaptureContext] Rendering with config:", {
      visible,
      section,
      projectId: cfg?.projectId,
      companyId: cfg?.companyId,
    });
  }

  return (
    <PhotoCaptureContext.Provider value={value}>
      {children}

      {cfg && (
        <PhotoModal
          visible={visible}
          title={title} // ✨ Pass the constructed title
          onClose={closeCapture}
          tagOptions={cfg.tagOptions ?? []}
          tagValue={tagValue}
          onChangeTag={(value: string) => {
            console.log("[PhotoCaptureContext] Tag changed:", value);
            setTagValue(value);
          }}
          onOpenGallery={
            cfg.onOpenGallery ? () => cfg.onOpenGallery?.(section) : undefined
          }
          initialNote={note}
          onSaveNote={(n: string) => {
            console.log("[PhotoCaptureContext] Note saved:", {
              section,
              noteLength: n.length,
            });
            setNote(n);
            cfg.onSaveNote?.(n);
          }}
          onMediaAdded={cfg.onMediaAdded}
          projectId={cfg.projectId}
          companyId={cfg.companyId}
          section={section} // ✨ Pass section to modal
          galleryIconSize={36} // Set gallery icon size
        />
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

// Convenience hook for common usage patterns
export function usePhotoCaptureModal() {
  const { openCapture, closeCapture, isOpen, currentSection } =
    usePhotoCapture();

  const openForSection = useCallback(
    (
      projectId: string,
      companyId: string,
      section: string,
      options?: {
        tagOptions?: TagOption[];
        tagValue?: string;
        initialNote?: string;
        onSaveNote?: (note: string) => void;
        onMediaAdded?: (type: "photo" | "video") => void;
      }
    ) => {
      openCapture({
        projectId,
        companyId,
        section,
        tagOptions: options?.tagOptions ?? [],
        tagValue: options?.tagValue ?? null,
        initialNote: options?.initialNote ?? "",
        onSaveNote: options?.onSaveNote,
        onMediaAdded: options?.onMediaAdded,
      });
    },
    [openCapture]
  );

  return {
    openCapture,
    closeCapture,
    openForSection,
    isOpen,
    currentSection,
  };
}

export default PhotoCaptureProvider;
