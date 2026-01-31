import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native"; // Import DrawerActions to ensure compatibility with TypeScript
import { HeaderLogoComponent } from "../components/Header";

const UnderConstructionScreen = () => {
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <HeaderLogoComponent
          isTitle={false}
          back={false}
          applogo={true}
          onIconPress={() => openDrawer()}
        />
        <View
          style={{ alignItems: "center", justifyContent: "center", flex: 0.8 }}
        >
          <Image
            source={require("../assets/Images/construction-img.jpg")} // Replace with your image URL or local asset
            style={styles.image}
          />
          <Text style={styles.title}>Site Under Construction</Text>
          <Text style={styles.subtitle}>
            We're working hard to bring you the best experience. Stay tuned!
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default UnderConstructionScreen;
