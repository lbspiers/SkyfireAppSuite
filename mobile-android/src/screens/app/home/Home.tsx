import React from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import login from "../../../store/slices/authSlice";
import { setTokens } from "../../../store/slices/authSlice";

import SpeechText from "../../../components/SpeechText";
import Text from "../../../components/Text";
import Button from "../../../components/Button";
import { HeaderLogoComponent } from "../../../components/Header";

const Home = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const name = useSelector((store: any) => store?.auth?.user?.username);

  const handleLogin = () => {
    dispatch(
      setTokens({
        accessToken: "demo-token",
        refreshToken: "refresh-token",
        checkbox: true,
      })
    );
  };

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <View style={styles.safe}>
        {/* 🔥 Custom App Header */}
        <HeaderLogoComponent
          isTitle={true}
          title="Tools"
          applogo={true}
          back={false}
          onIconPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />

        {/* 🗣️ Voice to Text */}
        <View style={styles.speechContainer}>
          <SpeechText />
        </View>

        {/* 🛠️ Tool Buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            children="📸 Camera Tool"
            onPress={() => navigation.navigate("Camera" as never)}
            color1="#FD7332"
            color2="#EF3826"
            style={styles.toolButton}
          />

          <Button
            children="📐 Measurement Tool"
            onPress={() => navigation.navigate("MeasurementComp" as never)}
            color1="#FD7332"
            color2="#EF3826"
            style={styles.toolButton}
          />

          <Button
            children={`👤 ${name ?? "Login Debug"}`}
            onPress={handleLogin}
            color1="#555"
            color2="#333"
            style={styles.toolButton}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

export default Home;

const styles = StyleSheet.create({
  gradientView: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  speechContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  buttonsContainer: {
    marginTop: 30,
    gap: 15,
  },
  toolButton: {
    height: 48,
    borderRadius: 8,
    width: "100%",
    alignSelf: "center",
  },
});
