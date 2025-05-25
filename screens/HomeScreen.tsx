import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { DeviceMotion, DeviceMotionMeasurement } from "expo-sensors";
import { colors } from "../constants/colors";
import Button from "../components/Button";
import MeasurementItem from "../components/MeasurementItem";
import { avg, formatDuration } from "../utils/number";
import Graph from "../components/Graph";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";

export type MovingDataFrame = {
  acceleration: number;
  velocity: number;
  jerk: number;
  timestamp: number;
};
export type MeasurementSummary = {
  avgAcceleration: number;
  avgVelocity: number;
  avgJerk: number;
  elapsedTime: number;
};

const HomeScreen = () => {
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [subscription, setSubscription] = useState<ReturnType<
    typeof DeviceMotion.addListener
  > | null>(null);
  const historyRef = useRef<MovingDataFrame[]>([]);
  const [summary, setSummary] = useState<MeasurementSummary | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastCalculatedFrameRef = useRef<{
    acceleration: number;
    velocity: number;
    timestamp: number;
  } | null>(null);
  const isMeasuringRef = useRef(isMeasuring);
  const lastSummaryUpdateTimeRef = useRef<number>(0);
  const [showButtons, setShowButtons] = useState(true);
  const viewShotRef = useRef<ViewShot>(null);
  const gravityOffsetRef = useRef<number>(0);

  const calculateSummaryFromHistory = (
    history: MovingDataFrame[],
    startTime: number,
    currentTimeForElapsed: number,
  ): MeasurementSummary => {
    const elapsedTime = (currentTimeForElapsed - startTime) / 1000;

    if (history.length === 0) {
      return {
        avgAcceleration: 0,
        avgVelocity: 0,
        avgJerk: 0,
        elapsedTime: elapsedTime,
      };
    }

    const accValues = history.map((d) => d.acceleration);
    const velValues = history.map((d) => d.velocity);
    const jerkValues = history.map((d) => d.jerk);

    const filterValidNumbers = (arr: number[]) =>
      arr.filter((v) => !isNaN(v) && isFinite(v));

    const validAcc = filterValidNumbers(accValues);
    const validVel = filterValidNumbers(velValues);
    const validJerk = filterValidNumbers(jerkValues);

    return {
      avgAcceleration: validAcc.length > 0 ? avg(validAcc) : 0,
      avgVelocity: validVel.length > 0 ? avg(validVel) : 0,
      avgJerk: validJerk.length > 0 ? avg(validJerk) : 0,
      elapsedTime: elapsedTime,
    };
  };

  useEffect(() => {
    isMeasuringRef.current = isMeasuring;
  }, [isMeasuring]);

  const handleDeviceMotion = useCallback((motion: DeviceMotionMeasurement) => {
    if (!isMeasuringRef.current || !lastCalculatedFrameRef.current) {
      return;
    }

    const currentTime = Date.now();
    const dt = (currentTime - lastCalculatedFrameRef.current.timestamp) / 1000;

    if (dt <= 0) {
      lastCalculatedFrameRef.current.timestamp = currentTime;
      return;
    }
    if (!motion.acceleration) {
      return;
    }

    const { x, y, z } = motion.acceleration;
    const gravity = 9.81; // gravity in m/s²
    const adjustedZ = z - gravity - gravityOffsetRef.current;
    const currentAcceleration = Math.sqrt(
      x * x + y * y + adjustedZ * adjustedZ,
    );

    const prevAcceleration = lastCalculatedFrameRef.current.acceleration;
    const prevVelocity = lastCalculatedFrameRef.current.velocity;

    const isStationary = currentAcceleration < 0.1;
    const currentVelocity = isStationary
      ? 0
      : prevVelocity + prevAcceleration * dt;
    const currentJerk = (currentAcceleration - prevAcceleration) / dt;

    const newFrame: MovingDataFrame = {
      acceleration: currentAcceleration,
      velocity: currentVelocity,
      jerk: currentJerk,
      timestamp: currentTime,
    };
    historyRef.current.push(newFrame);

    lastCalculatedFrameRef.current = {
      acceleration: currentAcceleration,
      velocity: currentVelocity,
      timestamp: currentTime,
    };

    const shouldUpdateSummaryNow = historyRef.current.length === 1;
    const timeForScheduledUpdatePassed =
      currentTime - lastSummaryUpdateTimeRef.current >= 1000;

    if (
      (timeForScheduledUpdatePassed && historyRef.current.length > 0) ||
      shouldUpdateSummaryNow
    ) {
      const currentRealTimeSummary = calculateSummaryFromHistory(
        historyRef.current,
        startTimeRef.current,
        currentTime,
      );
      setSummary(currentRealTimeSummary);
      lastSummaryUpdateTimeRef.current = currentTime;
    }
  }, []);

  const subscribe = () => {
    DeviceMotion.setUpdateInterval(100);
    const sub = DeviceMotion.addListener(handleDeviceMotion);
    setSubscription(sub);
  };

  const unsubscribe = () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
  };

  const startMeasuring = async () => {
    const isDeviceMotionAvailable = await DeviceMotion.isAvailableAsync();
    if (!isDeviceMotionAvailable) {
      Alert.alert("Device Motion sensor is not available on this device.");
      return;
    }

    // calibrate z-axis to account for sensor bias
    let zSum = 0;
    let count = 0;
    const calibrationListener = DeviceMotion.addListener((motion) => {
      if (motion.acceleration) {
        zSum += motion.acceleration.z;
        count += 1;
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    calibrationListener.remove();
    gravityOffsetRef.current = count > 0 ? zSum / count - 9.81 : 0;

    historyRef.current = [];
    setSummary(null);
    setIsMeasuring(true);

    const initialTimestamp = Date.now();
    startTimeRef.current = initialTimestamp;
    lastCalculatedFrameRef.current = {
      acceleration: 0,
      velocity: 0,
      timestamp: initialTimestamp,
    };
    lastSummaryUpdateTimeRef.current = initialTimestamp;

    subscribe();
  };

  const stopMeasuring = () => {
    unsubscribe();
    setIsMeasuring(false);

    const endTime = Date.now();
    const finalSummary = calculateSummaryFromHistory(
      historyRef.current,
      startTimeRef.current,
      endTime,
    );
    setSummary(finalSummary);
  };

  useEffect(() => {
    return () => unsubscribe();
  }, []);

  const onPressShare = async () => {
    if (!viewShotRef.current) {
      Alert.alert("Error", "Unable to capture screenshot.");
      return;
    }

    try {
      setShowButtons(false);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const uri = await viewShotRef.current.capture();

      setShowButtons(true);

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Error", "Sharing is not available on this device.");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/jpg",
        dialogTitle: "Share Elevator Lift Test Summary",
      });
    } catch (error) {
      console.error("Error capturing or sharing screenshot:", error);
      Alert.alert("Error", "Failed to capture or share screenshot.");
      setShowButtons(true);
    }
  };

  const helpMarginTop = useMemo(() => {
    return Dimensions.get("screen").height / 3 - 200;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Elevator Lift Test</Text>

      <ViewShot
        ref={viewShotRef}
        options={{ format: "jpg", result: "tmpfile" }}
        style={styles.viewShot}
      >
        <ScrollView
          style={{ width: "100%" }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.helpContainer,
              { marginTop: !isMeasuring && summary ? 0 : helpMarginTop },
            ]}
          >
            <Image
              source={require("../assets/images/adaptive-icon.png")}
              style={styles.helpImage}
            />
            {!isMeasuring && !summary && (
              <Text style={styles.helpInfoText}>
                Place the device flat on the elevator floor. Tap the button
                below to start measuring when the elevator begins motion.
              </Text>
            )}
          </View>

          {summary && (
            <View style={styles.averages}>
              <Text style={styles.avgLabel}>Summary:</Text>
              <MeasurementItem
                label="Elapsed Time"
                value={formatDuration(summary.elapsedTime)}
              />
              <MeasurementItem
                label="Avg. Acceleration"
                value={`${summary.avgAcceleration.toFixed(4)} m/s²`}
              />
              <MeasurementItem
                label="Avg. Velocity"
                value={`${summary.avgVelocity.toFixed(4)} m/s`}
              />
              <MeasurementItem
                label="Avg. Jerk"
                value={`${summary.avgJerk.toFixed(4)} m/s³`}
              />
              <MeasurementItem
                label="Data Points"
                value={`${historyRef.current.length}`}
              />
              {!isMeasuring && <Graph data={historyRef.current} />}
            </View>
          )}
        </ScrollView>
      </ViewShot>

      {showButtons && (
        <View style={styles.buttonContainer}>
          <Button
            title={isMeasuring ? "Stop" : "Start"}
            onPress={isMeasuring ? stopMeasuring : startMeasuring}
          />
          {summary && historyRef.current.length > 0 && !isMeasuring && (
            <Button title="Share Summary" onPress={onPressShare} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.deepBlue,
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "android" ? 40 : 20,
  },
  title: {
    fontSize: 28,
    color: colors.white,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  scroll: {
    alignItems: "center",
    paddingBottom: 30,
  },
  helpContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  helpInfoText: {
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
    paddingHorizontal: 15,
  },
  helpImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  averages: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: "stretch",
    width: "90%",
  },
  avgLabel: {
    fontSize: 20,
    color: colors.white,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 20,
    marginBottom: 20,
  },
  viewShot: {
    width: "100%",
    flex: 1,
  },
});

export default HomeScreen;
