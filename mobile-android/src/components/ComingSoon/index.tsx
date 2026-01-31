import React, { useState } from "react";
import Text from "../Text";
import { View } from "react-native";
import fontFamily from "../../utils/styleConstant/FontFamily";
import LinearGradient from "react-native-linear-gradient";
import COLORS from "../../utils/styleConstant/Color";
import { HeaderLogoComponent } from "../Header";
import { useNavigation } from "@react-navigation/native";

const ComingSoon = () => {
  const navigation = useNavigation();
  return (
    <LinearGradient
      colors={["#2E4161", "#0C1F3F"]}
      style={{
        flex: 1,
      }}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flex: 0.1, paddingTop: 50 }}>
          <HeaderLogoComponent
            title="Equipment"
            isTitle={false}
            back={true}
            applogo={false}
            onIconPress={() => {}}
            onBackButtonPress={() => navigation.goBack()}
          />
        </View>

        <View
          style={{
            flex: 0.8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 40,
              textAlign: "center",
              fontFamily: fontFamily.lato,
              color: COLORS.textOrange,
            }}
          >
            Coming Soon ...
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

export default ComingSoon;
