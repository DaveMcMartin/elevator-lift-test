import React from "react";
import { render } from "@testing-library/react-native";
import MeasurementItem from "./MeasurementItem";
import { colors } from "../constants/colors";

describe("components/MeasurementItem", () => {
  it("renders the label and value correctly", () => {
    const label = "Weight";
    const value = "70 kg";
    const { getByText } = render(
      <MeasurementItem label={label} value={value} />,
    );
    expect(getByText(label)).toBeTruthy();
    expect(getByText(value)).toBeTruthy();
  });

  it("applies the correct styles to the container, label, and value", () => {
    const { getByTestId, getByText } = render(
      <MeasurementItem label="Weight" value="70 kg" />,
    );

    const container = getByTestId("measurement-container");
    const label = getByText("Weight");
    const value = getByText("70 kg");

    expect(container.props.style).toMatchObject({
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    });

    expect(label.props.style).toMatchObject({
      fontSize: 16,
      color: colors.white,
      marginRight: 10,
    });

    expect(value.props.style).toMatchObject({
      fontSize: 16,
      color: colors.white,
      flexGrow: 1,
      textAlign: "right",
    });
  });
});
