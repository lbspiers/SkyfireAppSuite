import { Alert } from "react-native";
import RNFS from "react-native-fs";
import Mailer from "react-native-mail";

export const DEBUG_MODE = true;

const LOG_PATH = RNFS.DocumentDirectoryPath + "/debug_log.txt";

export const getDebugLogPath = () => LOG_PATH;

export const showDebugPopup = (title: string, steps: string[], error?: any) => {
  if (!DEBUG_MODE) return;

  let message = steps.map((step, i) => `✅ Step ${i + 1}: ${step}`).join("\n");
  if (error) {
    message += `\n\n❌ Error: ${error.message || JSON.stringify(error)}`;
  }

  Alert.alert(title, message);
  writeDebugLogToFile(message); // Save log too
};

export const writeDebugLogToFile = async (log: string) => {
  try {
    const timestamp = new Date().toISOString();
    const entry = `\n\n--- [${timestamp}] ---\n${log}`;
    await RNFS.appendFile(LOG_PATH, entry, "utf8");
    console.log("📝 Debug log written to:", LOG_PATH);
  } catch (err) {
    console.error("❌ Failed to write log:", err);
  }
};

export const emailDebugLog = async () => {
  try {
    const filePath = LOG_PATH;
    const exists = await RNFS.exists(filePath);

    if (!exists) {
      Alert.alert("Log file not found", "No debug log available to send.");
      return;
    }

    Mailer.mail(
      {
        subject: "🪵 Debug Log - Skyfire App",
        recipients: ["logan@skyfiresd.com"],
        body: "Attached is the current debug log file from the app.",
        isHTML: false,
        attachments: [
          {
            path: filePath,
            type: "txt",
            name: "debug_log.txt",
          },
        ],
      },
      (error, event) => {
        if (error) {
          Alert.alert("Email Error", "Could not open email app.");
          console.error("Email failed:", error);
        }
      }
    );
  } catch (err) {
    console.error("❌ Failed to send debug log:", err);
    Alert.alert(
      "Error",
      "Something went wrong while trying to email the debug log."
    );
  }
};
