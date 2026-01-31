// src/screens/devtools/DebugLogsScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Clipboard,
  Alert,
} from "react-native";
import RNFS from "react-native-fs";
import { DEBUG_MODE } from "../../utils/debugTools";
import AppHeader from "../../components/Header/AppHeader"; // ✅

const LOG_DIR = RNFS.DocumentDirectoryPath + "/skyfire_debug";
const LOG_FILE = LOG_DIR + "/debug_log.txt";

const DebugLogsScreen = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState(""); // 🆕 Filter date

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const exists = await RNFS.exists(LOG_FILE);
      if (exists) {
        const content = await RNFS.readFile(LOG_FILE, "utf8");
        const logArray = content
          .split("\n")
          .filter((line) => line.trim() !== "");
        setLogs(logArray.reverse());
      } else {
        setLogs(["No logs found."]);
      }
    } catch (error) {
      console.error("Failed to load logs:", error);
      setLogs(["Failed to load logs."]);
    }
  };

  const clearLogs = async () => {
    try {
      await RNFS.unlink(LOG_FILE);
      await loadLogs();
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  };

  const copyLogs = () => {
    const joinedLogs = filteredLogs.join("\n");
    Clipboard.setString(joinedLogs);
    Alert.alert("Copied!", "Filtered logs have been copied to clipboard.");
  };

  const parseLogTimestamp = (line: string) => {
    const match = line.match(/\[(.*?)\]/);
    return match ? new Date(match[1]) : null;
  };

  const filteredLogs = logs.filter((line) => {
    const matchesSearch = line.toLowerCase().includes(searchText.toLowerCase());

    if (!filterDate) return matchesSearch;

    const logDate = parseLogTimestamp(line);
    const filter = new Date(filterDate);

    if (logDate && !isNaN(filter.getTime())) {
      return matchesSearch && logDate >= filter;
    }

    return matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* 🧠 Standard App Header with Back/Drawer */}
      <AppHeader title="Debug Logs" />

      {/* 🔍 Search + Date Filter + Buttons */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search logs..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
        <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateFilterContainer}>
        <TextInput
          placeholder="Filter from (YYYY-MM-DD HH:MM:SS)"
          placeholderTextColor="#888"
          value={filterDate}
          onChangeText={setFilterDate}
          style={styles.searchInput}
        />
        <TouchableOpacity onPress={copyLogs} style={styles.copyButton}>
          <Text style={styles.copyButtonText}>Copy</Text>
        </TouchableOpacity>
      </View>

      {/* 📋 Logs */}
      <ScrollView style={styles.logsContainer}>
        {filteredLogs.length > 0 ? (
          filteredLogs.map((item, index) => (
            <Text
              key={index}
              style={[
                styles.logLine,
                (item.includes("❌") || item.toLowerCase().includes("error")) &&
                  styles.errorLine,
              ]}
            >
              {item}
            </Text>
          ))
        ) : (
          <Text style={styles.noLogsText}>No matching logs found.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0C1F3F", paddingHorizontal: 16 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  dateFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#1E2128",
    padding: 10,
    borderRadius: 8,
    color: "white",
    marginRight: 8,
  },
  clearButton: {
    backgroundColor: "#EF3826",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  clearButtonText: { color: "white", fontWeight: "bold" },
  copyButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  copyButtonText: { color: "white", fontWeight: "bold" },
  logsContainer: { flex: 1 },
  logLine: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 6,
    fontFamily: "monospace",
  },
  errorLine: {
    color: "#FF4C4C",
    fontWeight: "bold",
  },
  noLogsText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  },
});

export default DebugLogsScreen;
