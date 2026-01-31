// src/native/emitter.ts
import {
  NativeEventEmitter,
  NativeModules,
  DeviceEventEmitter,
} from "react-native";

// Example module:
const M = NativeModules?.SomeModule;

const hasEmitter =
  M &&
  typeof M.addListener === "function" &&
  typeof M.removeListeners === "function";

export const SomeEmitter = hasEmitter
  ? new NativeEventEmitter(M)
  : DeviceEventEmitter;
