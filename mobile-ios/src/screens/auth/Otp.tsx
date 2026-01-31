import React, { useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";

import { Image, SafeAreaView, View, Keyboard } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient"; // Import LinearGradient
import Text from "../../components/Text";
import { styles } from "../../styles/otpStyle";
import TextInputField from "../../components/TextInput";
import OTPTextView from "react-native-otp-textinput";
import Clipboard from "@react-native-clipboard/clipboard";
import COLORS from "../../utils/styleConstant/Color";
import Button from "../../components/Button";
import { VerifyOTP } from "../../api/auth.service";
import { OTPPAYLOAD } from "../../utils/models";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import { useDispatch } from "react-redux";
import { setResetToken } from "../../store/slices/authSlice";
const OtpScreen = (props: any) => {
  const navigation: any = useNavigation();
  const dispatch = useDispatch();
  const input = useRef<OTPTextView>(null);
  const [otpInput, setOtpInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const { params } = props.route;
  const handleCellTextChange = async (text: string, i: number) => {
    if (i === 0) {
      const clippedText = await Clipboard.getString();
      if (clippedText.slice(0, 1) === text) {
        input.current?.setValue(clippedText, true);
      }
    }
  };
  const handleVerifyOTP = async (data: any) => {
    console.log(data);
    setLoading(true);
    setErrorMessage(""); // Reset any previous error messages
    try {
      const response = await VerifyOTP({
        otpCode: parseInt(data),
        email: params?.email,
      });
      if (response.status === "SUCCESS") {
        dispatch(setResetToken({ resetToken: response.resetToken }));
        navigation.navigate("ChangePassword");
      } else {
        setErrorMessage("Failed to verify OTP. Please try again."); // Handle non-success responses
      }
      console.log("otp", response);
    } catch (error: any) {
      if (error.response) {
        // Server responded with a status other than 200 range
        setErrorMessage(`Error: ${error.response.data.message}`);
      } else if (error.request) {
        // Request was made but no response received
        setErrorMessage(
          "No response from server. Please check your internet connection."
        );
      } else {
        // Something else happened
        setErrorMessage(`Error: ${error.message}`);
      }
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true); // or some other action
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false); // or some other action
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);
  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={"handled"}
          showsVerticalScrollIndicator={false}
          enableAutomaticScroll
          extraScrollHeight={0}
          enableOnAndroid
          contentContainerStyle={{ flex: 1 }}
        >
          <View style={{ flex: isKeyboardVisible ? 0.6 : 0.4 }}>
            <View style={styles.logoContainer}>
              <Image
                style={{ height: 212, width: 255 }}
                source={require("./../../assets/Images/applogo.png")}
              />
            </View>
            <View style={styles.forgotpassView}>
              <Text children={"Enter OTP"} style={styles.enterOtp}></Text>
            </View>
          </View>

          <View style={styles.otpInputView}>
            <OTPTextView
              ref={input}
              containerStyle={styles.textInputContainer}
              handleTextChange={setOtpInput}
              handleCellTextChange={handleCellTextChange}
              inputCount={6}
              keyboardType="numeric"
              tintColor={COLORS.orange}
              textInputStyle={styles.textInput}
            />
          </View>
          <View>
            {errorMessage.trim() !== "" && (
              <Text children={errorMessage} style={styles.errorview}></Text>
            )}
          </View>
          <View
            style={[styles.buttonView, { flex: isKeyboardVisible ? 0.2 : 0.4 }]}
          >
            <Button
              color1={"#FD7332"}
              color2={"#EF3826"}
              children={loading ? <ActivityIndicator /> : "Submit"}
              style={[
                styles.createAcc,
                { height: isKeyboardVisible ? "40%" : "18%" },
              ]}
              onPress={() => handleVerifyOTP(otpInput)}
              labelStyle={styles.buttonText}
            />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default OtpScreen;
