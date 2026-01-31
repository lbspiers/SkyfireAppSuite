import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  SensorTypes,
  setUpdateIntervalForType,
  accelerometer,
  gyroscope,
} from "react-native-sensors";
import { map } from "rxjs/operators";
import { useNavigation } from "@react-navigation/native";

const SensorComponent = () => {
  const navigation = useNavigation();

  const [gyroscopeData, setGyroscopeData] = useState({ x: 0, y: 0, z: 0 });
  const [accelerometerData, setAccelerometerData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.accelerometer, 100); // 100ms
    setUpdateIntervalForType(SensorTypes.gyroscope, 100); // 100ms

    const gyroscopeSubscription = gyroscope
      .pipe(
        map(({ x, y, z }) => ({
          angularVelocityX: x,
          angularVelocityY: y,
          angularVelocityZ: z,
        }))
      )
      .subscribe((data) => {
        setGyroscopeData(data);
      });

    const accelerometerSubscription = accelerometer
      .pipe(
        map(({ x, y, z }) => ({
          accelerationX: x,
          accelerationY: y,
          accelerationZ: z,
        }))
      )
      .subscribe((data) => {
        setAccelerometerData(data);

        // Calculate pitch and roll
        const pitchCalc = Math.atan2(
          data.accelerationX,
          Math.sqrt(data.accelerationY ** 2 + data.accelerationZ ** 2)
        );
        const rollCalc = Math.atan2(
          data.accelerationY,
          Math.sqrt(data.accelerationX ** 2 + data.accelerationZ ** 2)
        );

        setPitch(pitchCalc);
        setRoll(rollCalc);
      });

    // Cleanup subscriptions on unmount
    return () => {
      gyroscopeSubscription.unsubscribe();
      accelerometerSubscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={
          {
            // height: '15%',
            // width: '20%',
            // justifyContent: 'center',
          }
        }
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: "black" }}> Back </Text>
      </TouchableOpacity>
      <Text style={styles.header}>Gyroscope Data:</Text>
      <Text>X: {gyroscopeData.angularVelocityX?.toFixed(2)}</Text>
      <Text>Y: {gyroscopeData.angularVelocityY?.toFixed(2)}</Text>
      <Text>Z: {gyroscopeData.angularVelocityZ?.toFixed(2)}</Text>

      <Text style={styles.header}>Accelerometer Data:</Text>
      <Text>X: {accelerometerData.accelerationX?.toFixed(2)}</Text>
      <Text>Y: {accelerometerData.accelerationY?.toFixed(2)}</Text>
      <Text>Z: {accelerometerData.accelerationZ?.toFixed(2)}</Text>

      <Text style={styles.header}>Slope Measurement:</Text>
      <Text>Pitch: {((pitch * 180) / Math.PI)?.toFixed(2)}°</Text>
      <Text>Roll: {((roll * 180) / Math.PI)?.toFixed(2)}°</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: "#F5FCFF",
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
});

export default SensorComponent;
