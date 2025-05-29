import React from "react";
import { render } from "@testing-library/react-native";
import Graph from "./Graph";

type PartialNodeData = { type: string; props: { content?: string | null } };

describe("components/Graph", () => {
  const mockData = [
    { timestamp: 1000, acceleration: 1, velocity: 2, jerk: 3, ambientNoise: 4 },
    { timestamp: 2000, acceleration: 2, velocity: 3, jerk: 4, ambientNoise: 5 },
    { timestamp: 3000, acceleration: 3, velocity: 4, jerk: 5, ambientNoise: 6 },
  ];

  it("renders a message when no data is provided", () => {
    const { getByTestId } = render(<Graph data={[]} />);
    expect(getByTestId("no-data-container")).toBeTruthy();
  });

  it("renders the LineChart when data is provided", () => {
    const { getByTestId } = render(<Graph data={mockData} />);
    expect(getByTestId("chart-container")).toBeTruthy();
  });

  it("reduces data points when exceeding MAX_POINTS_TO_DISPLAY", () => {
    const largeData = Array.from({ length: 100 }, (_, i) => ({
      timestamp: i * 1000,
      acceleration: i,
      velocity: i + 1,
      jerk: i + 2,
      ambientNoise: i + 3,
    }));
    const { getByTestId } = render(<Graph data={largeData} />);

    const chartContainer = getByTestId("chart-container");
    const labels = chartContainer.findAll(
      (node: PartialNodeData) =>
        node.type === "RNSVGTSpan" && node.props.content !== null,
    );

    const spanCountExpected = 14;
    expect(labels.length).toBeLessThanOrEqual(spanCountExpected);
  });

  it("handles a single data point", () => {
    const singleData = [
      {
        timestamp: 1000,
        acceleration: 1,
        velocity: 2,
        jerk: 3,
        ambientNoise: 4,
      },
    ];
    const { getByTestId } = render(<Graph data={singleData} />);
    const chartContainer = getByTestId("chart-container");
    const timeLabels = chartContainer.findAll(
      (node: PartialNodeData) =>
        node.type === "RNSVGTSpan" && node.props.content?.includes("0s"),
    );

    expect(timeLabels.length).toBe(1);
  });
});
