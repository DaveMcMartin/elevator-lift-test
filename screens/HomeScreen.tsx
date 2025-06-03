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
import { Audio } from "expo-av";
import { colors } from "../constants/colors";
import Button from "../components/Button";
import MeasurementItem from "../components/MeasurementItem";
import { avg, formatDuration } from "../utils/number";
import Graph from "../components/Graph";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { sleep } from "../utils/helper";
import { useI18n } from "../i18n/useI18n";

export type MovingDataFrame = {
  acceleration: number;
  velocity: number;
  jerk: number;
  timestamp: number;
  ambientNoise?: number;
};
export type MeasurementSummary = {
  avgAcceleration: number;
  avgVelocity: number;
  avgJerk: number;
  elapsedTime: number;
  avgAmbientNoise?: number;
};

const HomeScreen = () => {
  const screenHeight = Dimensions.get("screen").height;
  const { L } = useI18n();
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
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [decibels, setDecibels] = useState<number | null>(null);

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
        avgAmbientNoise: undefined,
      };
    }

    const accValues = history.map((d) => d.acceleration);
    const velValues = history.map((d) => d.velocity);
    const jerkValues = history.map((d) => d.jerk);
    const noiseValues = history
      .map((d) => d.ambientNoise)
      .filter((n) => typeof n === "number") as number[];

    const filterValidNumbers = (arr: number[]) =>
      arr.filter((v) => !isNaN(v) && isFinite(v));

    const validAcc = filterValidNumbers(accValues);
    const validVel = filterValidNumbers(velValues);
    const validJerk = filterValidNumbers(jerkValues);
    const validNoise = filterValidNumbers(noiseValues);

    return {
      avgAcceleration: validAcc.length > 0 ? avg(validAcc) : 0,
      avgVelocity: validVel.length > 0 ? avg(validVel) : 0,
      avgJerk: validJerk.length > 0 ? avg(validJerk) : 0,
      elapsedTime: elapsedTime,
      avgAmbientNoise: validNoise.length > 0 ? avg(validNoise) : undefined,
    };
  };

  useEffect(() => {
    isMeasuringRef.current = isMeasuring;
  }, [isMeasuring]);

  const handleDeviceMotion = useCallback(
    (motion: DeviceMotionMeasurement) => {
      if (!isMeasuringRef.current || !lastCalculatedFrameRef.current) {
        return;
      }

      const currentTime = Date.now();
      const dt =
        (currentTime - lastCalculatedFrameRef.current.timestamp) / 1000;

      if (dt <= 0) {
        lastCalculatedFrameRef.current.timestamp = currentTime;
        return;
      }
      if (!motion.acceleration) {
        return;
      }

      const { x, y, z } = motion.acceleration;
      const zCorrected = z - gravityOffsetRef.current;
      const currentAcceleration = Math.sqrt(
        x * x + y * y + zCorrected * zCorrected,
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
        ambientNoise: decibels === null ? undefined : decibels,
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
    },
    [decibels],
  );

  const subscribeToMotion = () => {
    DeviceMotion.setUpdateInterval(100);
    const sub = DeviceMotion.addListener(handleDeviceMotion);
    setSubscription(sub);
  };

  const unsubscribeFromMotion = () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
  };

  const requestAudioPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status === "granted") {
      return true;
    }
    Alert.alert(L("permission_required"), L("audio_permission_needed"));
    return false;
  };

  const startAudioMetering = async () => {
    const granted = await requestAudioPermissions();
    if (!granted) {
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions: Audio.RecordingOptions = {
        isMeteringEnabled: true,
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 32000,
          audioQuality: 0.6,
        },
        web: {},
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions,
        (status: Audio.RecordingStatus) => {
          if (status.isRecording && status.metering !== undefined) {
            setDecibels(status.metering);
          }
        },
        500,
      );
      setRecording(newRecording);
      await newRecording.startAsync();
    } catch (err) {
      console.error("Failed to start audio recording for metering", err);
      Alert.alert(L("audio_error"), L("audio_metering_failed"));
    }
  };

  const stopAudioMetering = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch (error) {
        console.error("Error stopping audio metering:", error);
      }
    }
    setRecording(null);
  };

  const calibrateGravity = async () => {
    let zSum = 0;
    let count = 0;
    const calibrationListener = DeviceMotion.addListener((motion) => {
      if (motion.acceleration) {
        zSum += motion.acceleration.z;
        count += 1;
      }
    });
    await sleep(1000);
    calibrationListener.remove();
    gravityOffsetRef.current = count > 0 ? zSum / count : 0;
  };

  const startMeasuring = async () => {
    const isMotionAvailable = await DeviceMotion.isAvailableAsync();
    if (!isMotionAvailable) {
      Alert.alert(L("device_motion_unavailable"));
      return;
    }
    await requestAudioPermissions();
    await calibrateGravity();

    historyRef.current = [];
    setSummary(null);
    setDecibels(null);
    setIsMeasuring(true);

    const initialTimestamp = Date.now();
    startTimeRef.current = initialTimestamp;
    lastCalculatedFrameRef.current = {
      acceleration: 0,
      velocity: 0,
      timestamp: initialTimestamp,
    };
    lastSummaryUpdateTimeRef.current = initialTimestamp;

    subscribeToMotion();
    startAudioMetering();
  };

  const stopMeasuring = async () => {
    unsubscribeFromMotion();
    await stopAudioMetering();
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
    return () => {
      unsubscribeFromMotion();
      if (recording) {
        recording
          .stopAndUnloadAsync()
          .catch((e) => console.error("Cleanup error on unmount", e));
      }
    };
  }, [recording]);

  const onPressShare = async () => {
    if (!viewShotRef.current) {
      Alert.alert(L("error"), L("screenshot_capture_failed"));
      return;
    }
    try {
      setShowButtons(false);
      await sleep(100);
      const uri = await viewShotRef.current.capture?.();
      setShowButtons(true);

      if (!uri) {
        Alert.alert(L("error"), L("screenshot_not_taken"));
        return;
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(L("error"), L("sharing_unavailable"));
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "image/jpg",
        dialogTitle: "Share Elevator Lift Test Summary",
      });
    } catch (error) {
      console.error("Error capturing or sharing screenshot:", error);
      Alert.alert(L("error"), L("screenshot_share_failed"));
      setShowButtons(true);
    }
  };

  const helpMarginTop = useMemo(() => {
    return screenHeight / 3 - 200;
  }, [screenHeight]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{L("app_title")}</Text>

      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <ViewShot
          ref={viewShotRef}
          options={{ format: "jpg", result: "tmpfile" }}
          style={styles.viewShot}
        >
          <View
            style={[
              styles.helpContainer,
              { marginTop: summary ? 0 : helpMarginTop },
            ]}
          >
            <Image
              source={require("../assets/images/adaptive-icon.png")}
              style={styles.helpImage}
            />
            {!isMeasuring && !summary && (
              <Text style={styles.helpInfoText}>{L("help_text")}</Text>
            )}
          </View>

          {summary && (
            <View style={styles.averages}>
              <Text style={styles.avgLabel}>{L("summary_label")}</Text>
              <MeasurementItem
                label={L("elapsed_time")}
                value={formatDuration(summary.elapsedTime)}
              />
              <MeasurementItem
                label={L("avg_acceleration")}
                value={`${summary.avgAcceleration.toFixed(4)} m/s²`}
              />
              <MeasurementItem
                label={L("avg_velocity")}
                value={`${summary.avgVelocity.toFixed(4)} m/s`}
              />
              <MeasurementItem
                label={L("avg_jerk")}
                value={`${summary.avgJerk.toFixed(4)} m/s³`}
              />
              {summary.avgAmbientNoise !== undefined && (
                <MeasurementItem
                  label={L("avg_ambient_noise")}
                  value={`${summary.avgAmbientNoise.toFixed(1)} dBFS`}
                />
              )}
              <MeasurementItem
                label={L("data_points")}
                value={`${historyRef.current.length}`}
              />
            </View>
          )}
          {summary && !isMeasuring && <Graph data={historyRef.current} />}
          {showButtons && (
            <View style={styles.buttonContainer}>
              <Button
                title={isMeasuring ? L("stop_button") : L("start_button")}
                onPress={isMeasuring ? stopMeasuring : startMeasuring}
              />
              {summary && historyRef.current.length > 0 && !isMeasuring && (
                <Button title={L("share_summary")} onPress={onPressShare} />
              )}
            </View>
          )}
        </ViewShot>
      </ScrollView>
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
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  viewShot: {
    width: "100%",
    flex: 1,
  },
});

export default HomeScreen;
