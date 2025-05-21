import { SafeAreaView, StyleSheet, Text, View, Image } from "react-native";
import { Accelerometer } from "expo-sensors";
import { useEffect, useState } from "react";
import Button from "../components/Button";
import { colors } from "../constants/colors";
import MeasurementItem from "../components/MeasurementItem";

const HomeScreen = () => {
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [data, setData] = useState<{
    acceleration: number;
    velocity: number;
    jerk: number;
    lastUpdated: number | null;
  }>({
    acceleration: 0,
    velocity: 0,
    jerk: 0,
    lastUpdated: null,
  });
  const [history, setHistory] = useState([]);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    return () => {
      _unsubscribe();
    };
  }, []);

  const _subscribe = () => {
    const startTime = Date.now();
    let lastAcceleration = 0;
    let lastVelocity = 0;
    let lastTimestamp = 0;

    const sub = Accelerometer.addListener((accelerometerData) => {
      const { x, y, z } = accelerometerData;
      const currentTime = Date.now();
      const timeElapsed = (currentTime - startTime) / 1000;

      const currentAcceleration = Math.sqrt(x * x + y * y + z * z);
      const dt = timeElapsed - lastTimestamp;
      const currentVelocity = lastVelocity + lastAcceleration * dt;

      const currentJerk =
        dt > 0 ? (currentAcceleration - lastAcceleration) / dt : 0;

      setData({
        acceleration: currentAcceleration,
        velocity: currentVelocity,
        jerk: currentJerk,
        lastUpdated: currentTime,
      });

      lastAcceleration = currentAcceleration;
      lastVelocity = currentVelocity;
      lastTimestamp = timeElapsed;
    });
    setSubscription(sub);
  };

  const _unsubscribe = () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
    setHistory((prev) => [...prev, data]);
  };

  const startMeasuring = () => {
    setIsMeasuring(true);
    _subscribe();
  };

  const stopMeasuring = () => {
    setIsMeasuring(false);
    _unsubscribe();
  };

  const formatValue = (value) => {
    return value.toFixed(2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Elevator Lift Test</Text>
      <View style={styles.helpContainer}>
        <Image
          source={require("../assets/images/adaptive-icon.png")}
          style={styles.helpImage}
        />
        {!isMeasuring && history.length === 0 && (
          <Text style={styles.helpInfoText}>
            Tap the button below to start measuring when the elevator is in
            motion.
          </Text>
        )}
      </View>

      {(isMeasuring || history.length > 0) && (
        <View style={styles.measurementContainer}>
          {isMeasuring ? (
            <Text style={styles.measurementText}>Recording measurement...</Text>
          ) : (
            <Text style={styles.measurementText}>Last measurement</Text>
          )}
          <MeasurementItem
            label="Acceleration"
            value={`${formatValue(data.acceleration)} m/s²`}
          />
          <MeasurementItem
            label="Velocity"
            value={`${formatValue(data.velocity)} m/s`}
          />
          <MeasurementItem
            label="Jerk"
            value={`${formatValue(data.jerk)} m/s³`}
          />
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
    backgroundColor: colors.deepBlue,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: colors.white,
    fontWeight: "bold",
    marginBottom: 20,
  },
  helpContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  helpInfoText: {
    fontSize: 16,
    color: colors.white,
    marginBottom: 20,
    textAlign: "center",
  },
  helpImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  measurementContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 280,
    marginBottom: 20,
  },
  measurementText: {
    fontSize: 18,
    color: colors.white,
    marginBottom: 20,
  },
});

export default HomeScreen;
