import { Dimensions, View, Text, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { MovingDataFrame } from "../screens/HomeScreen";
import { colors } from "../constants/colors";
import { formatDuration } from "../utils/number";
import { useI18n } from "../i18n/useI18n";
import { LineChartProps } from "react-native-chart-kit/dist/line-chart/LineChart";

const MAX_POINTS_TO_DISPLAY = 75;
const NUM_X_AXIS_LABELS = 5;

type Props = {
  data: MovingDataFrame[];
};

const Graph = ({ data }: Props) => {
  const { L } = useI18n();

  if (!data || data.length === 0) {
    return (
      <View
        testID="no-data-container"
        style={{
          marginTop: 20,
          alignItems: "center",
          justifyContent: "center",
          height: 220,
        }}
      >
        <Text style={{ color: "#666" }}>{L("no_data_to_display")}</Text>
      </View>
    );
  }

  let processedData = data;
  if (data.length > MAX_POINTS_TO_DISPLAY) {
    const k = Math.ceil(data.length / MAX_POINTS_TO_DISPLAY);
    processedData = data.filter((_, i) => i % k === 0);
  }

  if (processedData.length === 0 && data.length > 0) {
    processedData = [data[data.length - 1]];
  }

  const chartXTickLabels: string[] = [];
  if (processedData.length > 0) {
    const firstTimestamp = data[0].timestamp;
    const lastDisplayTimestamp =
      processedData[processedData.length - 1].timestamp;
    const totalDurationSeconds = (lastDisplayTimestamp - firstTimestamp) / 1000;

    if (processedData.length === 1) {
      chartXTickLabels.push("0s");
    } else {
      for (let i = 0; i < NUM_X_AXIS_LABELS; i++) {
        const relativeTime =
          (i / (NUM_X_AXIS_LABELS - 1)) * totalDurationSeconds;
        chartXTickLabels.push(formatDuration(relativeTime));
      }
    }
  } else {
    chartXTickLabels.push("0s");
  }

  const accelerationData = {
    labels: chartXTickLabels,
    datasets: [
      {
        data: processedData.map((d) => d.acceleration),
        strokeWidth: 2,
        color: () => colors.orange,
      },
    ],
    legend: [L("acceleration")],
  };

  const velocityData = {
    labels: chartXTickLabels,
    datasets: [
      {
        data: processedData.map((d) => d.velocity),
        strokeWidth: 2,
        color: () => colors.blue,
      },
    ],
    legend: [L("velocity")],
  };

  const jerkData = {
    labels: chartXTickLabels,
    datasets: [
      {
        data: processedData.map((d) => d.jerk),
        strokeWidth: 2,
        color: () => colors.green,
      },
    ],
    legend: [L("jerk")],
  };

  const hasNoiseData = processedData.some((d) => d.ambientNoise !== undefined);
  const noiseData = hasNoiseData
    ? {
        labels: chartXTickLabels,
        datasets: [
          {
            data: processedData.map((d) => d.ambientNoise ?? 0),
            strokeWidth: 2,
            color: () => colors.pink,
          },
        ],
        legend: [L("ambient_noise")],
      }
    : null;

  const chartConfig: LineChartProps["chartConfig"] = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    propsForDots: {
      r: processedData.length > 50 ? "0" : "2",
      strokeWidth: "1",
      stroke: "#000000",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "rgba(0,0,0,0.1)",
    },
    propsForVerticalLabels: {
      fontSize: "11",
    },
    propsForHorizontalLabels: {
      fontSize: "11",
    },
  };
  const chartWidth = Dimensions.get("window").width - 80;

  return (
    <View
      style={{ marginTop: 20, alignItems: "center" }}
      testID="chart-container"
    >
      <Text style={styles.chartTitleOrange}>{L("acceleration")} (m/s²)</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={accelerationData}
          width={chartWidth}
          height={120}
          yAxisSuffix=" m/s²"
          yAxisInterval={1}
          chartConfig={chartConfig}
          bezier
          style={styles.chartStyle}
          segments={4}
          fromZero={false}
          withShadow={false}
        />
      </View>

      <Text style={styles.chartTitleBlue}>{L("velocity")} (m/s)</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={velocityData}
          width={chartWidth}
          height={120}
          yAxisSuffix=" m/s"
          yAxisInterval={1}
          chartConfig={chartConfig}
          bezier
          style={styles.chartStyle}
          segments={4}
          fromZero={false}
          withShadow={false}
        />
      </View>

      <Text style={styles.chartTitleGreen}>{L("jerk")} (m/s³)</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={jerkData}
          width={chartWidth}
          height={120}
          yAxisSuffix=" m/s³"
          yAxisInterval={1}
          chartConfig={chartConfig}
          bezier
          style={styles.chartStyle}
          segments={4}
          fromZero={false}
          withShadow={false}
        />
      </View>

      {hasNoiseData && noiseData && (
        <>
          <Text style={styles.chartTitlePink}>{L("ambient_noise")} (dBFS)</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={noiseData}
              width={chartWidth}
              height={120}
              yAxisSuffix=" dBFS"
              yAxisInterval={1}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
              segments={4}
              fromZero={false}
              withShadow={false}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chartStyle: {
    borderRadius: 8,
  },
  chartContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  chartTitleOrange: {
    color: colors.orange,
    marginBottom: 5,
  },
  chartTitleBlue: {
    color: colors.blue,
    marginBottom: 5,
  },
  chartTitleGreen: {
    color: colors.green,
    marginBottom: 5,
  },
  chartTitlePink: {
    color: colors.pink,
    marginBottom: 5,
  },
});

export default Graph;
