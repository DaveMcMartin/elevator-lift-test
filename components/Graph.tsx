import { Dimensions, View, Text } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { MovingDataFrame } from "../screens/HomeScreen";
import { colors } from "../constants/colors";
import { formatDuration } from "../utils/number";

const MAX_POINTS_TO_DISPLAY = 75;
const NUM_X_AXIS_LABELS = 5;

type Props = {
  data: MovingDataFrame[];
};

const Graph = ({ data }: Props) => {
  if (!data || data.length === 0) {
    return (
      <View
        style={{
          marginTop: 20,
          alignItems: "center",
          justifyContent: "center",
          height: 220,
        }}
      >
        <Text style={{ color: "#666" }}>No data to display.</Text>
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

  const chartData = {
    labels: chartXTickLabels,
    datasets: [
      {
        data: processedData.map((d) => d.acceleration),
        strokeWidth: 2,
        color: () => colors.deepBlue,
      },
      {
        data: processedData.map((d) => d.velocity),
        strokeWidth: 2,
        color: () => colors.blue,
      },
      {
        data: processedData.map((d) => d.jerk),
        strokeWidth: 2,
        color: () => colors.green,
      },
      {
        data: processedData.map((d) => d.ambientNoise ?? 0),
        strokeWidth: 2,
        color: () => colors.pink,
      },
    ],
    legend: ["Acceleration", "Velocity", "Jerk", "Amb. Noise"],
  };

  return (
    <View style={{ marginTop: 20, alignItems: "center" }}>
      <LineChart
        data={chartData}
        width={Dimensions.get("window").width - 40}
        height={240}
        yAxisSuffix=""
        yAxisInterval={1}
        chartConfig={{
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
        }}
        bezier
        style={{ borderRadius: 8, marginVertical: 10 }}
        segments={4}
        fromZero={false}
        withShadow={false}
      />
    </View>
  );
};

export default Graph;
