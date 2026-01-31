import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

interface CollapsibleSectionProps {
  title: string;
  initiallyExpanded?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  initiallyExpanded = true,
  children,
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <LinearGradient
      colors={["#334A66", "#223347"]}
      style={styles.gradientContainer}
    >
      <TouchableOpacity style={styles.header} onPress={toggleExpand}>
        <Text style={styles.title}>{title}</Text>
        <Image
          source={
            expanded
              ? require("../../assets/Images/icons/icon_collapse.png")
              : require("../../assets/Images/icons/icon_expand.png")
          }
          style={styles.icon}
        />
      </TouchableOpacity>

      {expanded && <View style={styles.content}>{children}</View>}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    borderRadius: 10,
    marginBottom: 16,
    borderColor: "#445066",
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  icon: {
    width: 18,
    height: 18,
    tintColor: "#FD7332",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default CollapsibleSection;
