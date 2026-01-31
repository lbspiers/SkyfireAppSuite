import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootState } from "../store/store";
import { setTokens } from "../store/slices/authSlice";
import { jwtDecode } from "jwt-decode";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo: string;
}

interface DecodedToken {
  exp: number;
  // Add other properties if needed
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, redirectTo }) => {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const navigation: any = useNavigation();
  const dispatch: any = useDispatch();

  useEffect(() => {
    const checkToken = async () => {
      let token = accessToken;
      console.log("token1", token);

      if (!token) {
        token = await AsyncStorage.getItem("accessToken");
        console.log("token2", token);
        if (token) {
          dispatch(
            setTokens({
              accessToken: token,
              refreshToken: "",
              checkbox: true,
              isAuthenticated: true,
            })
          );
        }
      }

      if (!token) {
        // Ensure navigation is ready before navigating
        if (navigation && navigation.navigate) {
          navigation.navigate(redirectTo);
        } else {
          console.warn("Navigation not ready for redirect, deferring");
          setTimeout(() => {
            if (navigation && navigation.navigate) {
              navigation.navigate(redirectTo);
            }
          }, 0);
        }
        return;
      }

      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        const currentTime = Date.now() / 1000;

        // Check if the token is expired
        if (decodedToken.exp < currentTime) {
          // Ensure navigation is ready before navigating
          if (navigation && navigation.navigate) {
            navigation.navigate(redirectTo);
          } else {
            console.warn("Navigation not ready, deferring redirect");
            // Use setTimeout to defer navigation until next tick
            setTimeout(() => {
              if (navigation && navigation.navigate) {
                navigation.navigate(redirectTo);
              }
            }, 0);
          }
        }
      } catch (error) {
        console.error("Token decoding error:", error);
        // Ensure navigation is ready before navigating
        if (navigation && navigation.navigate) {
          navigation.navigate(redirectTo);
        } else {
          console.warn("Navigation not ready after token error, deferring redirect");
          // Use setTimeout to defer navigation until next tick
          setTimeout(() => {
            if (navigation && navigation.navigate) {
              navigation.navigate(redirectTo);
            }
          }, 0);
        }
      }
    };

    checkToken();
  }, [accessToken, navigation, redirectTo, dispatch]);

  return <>{children}</>;
};

export default AuthGuard;
