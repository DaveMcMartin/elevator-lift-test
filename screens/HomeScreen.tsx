import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Accelerometer } from "expo-sensors";
import { useEffect, useState } from "react";
import Button from "../components/Button";

const HomeScreen = () => {
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [data, setData] = useState({
    acceleration: [],
    velocity: [],
    jerk: [],
    timestamps: [],
  });
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    // every 100ms
    Accelerometer.setUpdateInterval(100);
    return () => {
      _unsubscribe();
    };
  }, []);

  const _subscribe = () => {
    setData({ acceleration: [], velocity: [], jerk: [], timestamps: [] });
    const startTime = Date.now();

    const sub = Accelerometer.addListener((accelerometerData) => {
      const { x, y, z } = accelerometerData;
      const currentTime = Date.now();
      const timeElapsed = (currentTime - startTime) / 1000; // Convert to seconds

      // magnitude of acceleration
      const acceleration = Math.sqrt(x * x + y * y + z * z);

      setData((prevData) => {
        const newAcceleration = [...prevData.acceleration, acceleration];
        const newTimestamps = [...prevData.timestamps, timeElapsed];

        // velocity (numerical integration of acceleration)
        const velocity = calculateVelocity(newAcceleration, newTimestamps);

        // jerk (derivative of acceleration)
        const jerk = calculateJerk(newAcceleration, newTimestamps);

        return {
          acceleration: newAcceleration,
          velocity,
          jerk,
          timestamps: newTimestamps,
        };
      });
    });
    setSubscription(sub);
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  const calculateVelocity = (acceleration, timestamps) => {
    const velocity = [0];

    for (let i = 1; i < acceleration.length; i++) {
      const dt = timestamps[i] - timestamps[i - 1];
      const v = velocity[i - 1] + acceleration[i - 1] * dt;
      velocity.push(v);
    }
    return velocity;
  };

  const calculateJerk = (acceleration, timestamps) => {
    const jerk = [0];
    for (let i = 1; i < acceleration.length; i++) {
      const dt = timestamps[i] - timestamps[i - 1];
      const j = (acceleration[i] - acceleration[i - 1]) / dt;
      jerk.push(j);
    }
    return jerk;
  };

  const startMeasuring = () => {
    setIsMeasuring(true);
    _subscribe();
  };

  const stopMeasuring = () => {
    setIsMeasuring(false);
    _unsubscribe();
  };
  return (
    <SafeAreaView style={styles.container}>
      <Text>Elevator Lift Test</Text>
      <Text>
        Tap the button below to start measuring when the elevator is in motion.
      </Text>
      {isMeasuring && (
        <View>
          <Text>Recording measurement...</Text>
          <View>
            <Text>Velocity</Text>
            <Text>0,00 m/s</Text>
          </View>
        </View>
      )}
      <Button
        title={isMeasuring ? "Stop" : "Start"}
        onPress={isMeasuring ? stopMeasuring : startMeasuring}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default HomeScreen;
