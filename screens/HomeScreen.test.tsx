import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import HomeScreen from "./HomeScreen";
import { sleep } from "../utils/helper";

jest.mock("expo-sensors", () => ({
  DeviceMotion: {
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
    setUpdateInterval: jest.fn(),
    addListener: jest.fn((callback) => {
      setTimeout(() => {
        callback({ acceleration: { x: 0, y: 0, z: 0 } });
      }, 100);
      return { remove: jest.fn() };
    }),
  },
}));

jest.mock("expo-av", () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: "granted" }),
    ),
    setAudioModeAsync: jest.fn(),
    Recording: {
      createAsync: jest.fn(() =>
        Promise.resolve({ recording: { stopAndUnloadAsync: jest.fn() } }),
      ),
    },
  },
}));

describe("screens/HomeScreen", () => {
  it("renders without errors", () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText("Teste Subida do Elevador")).toBeTruthy();
    expect(getByText("Iniciar")).toBeTruthy();
  });

  it("toggles measuring state when start/stop buttons are pressed", async () => {
    const { getByText } = render(<HomeScreen />);

    await act(() => {
      fireEvent.press(getByText("Iniciar"));
    });
    await sleep(1000);

    await waitFor(() => {
      expect(getByText("Parar")).toBeTruthy();
    });

    await act(() => {
      fireEvent.press(getByText("Parar"));
    });
    await sleep(200);

    expect(getByText("Iniciar")).toBeTruthy();
    expect(getByText("Resumo:")).toBeTruthy();
  });
});
