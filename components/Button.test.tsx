import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Button from "./Button";
import { colors } from "../constants/colors";

describe("components/Button", () => {
  it("renders the button with the correct title", () => {
    const title = "Click Me";
    const { getByText } = render(<Button title={title} />);
    expect(getByText(title)).toBeTruthy();
  });

  it("calls onPress when the button is pressed", () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPressMock} />,
    );
    fireEvent.press(getByText("Click Me"));
    expect(onPressMock).toHaveBeenCalled();
  });

  it("applies custom styles to the button and text", () => {
    const customButtonStyle = { backgroundColor: colors.pink };
    const customTextStyle = { color: colors.deepBlue };
    const { getByText, getByTestId } = render(
      <Button
        title="Styled Button"
        style={customButtonStyle}
        textStyle={customTextStyle}
      />,
    );

    const button = getByTestId("button");
    const text = getByText("Styled Button");

    expect(button.props.style).toMatchObject(customButtonStyle);
    expect(text.props.style[1]).toMatchObject(customTextStyle);
  });

  it("applies default styles to the button and text", () => {
    const { getByText, getByTestId } = render(
      <Button title="Default Button" />,
    );

    const button = getByTestId("button");
    const text = getByText("Default Button");

    expect(button.props.style).toMatchObject({
      borderRadius: 24,
      backgroundColor: colors.blue,
      paddingVertical: 12,
      paddingHorizontal: 24,
      minWidth: 180,
    });

    expect(text.props.style[0]).toMatchObject({
      fontSize: 21,
      textAlign: "center",
      color: colors.white,
    });
  });
});
