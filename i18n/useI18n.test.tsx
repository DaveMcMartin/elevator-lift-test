import { useI18n } from "./useI18n";
import { renderHook } from "@testing-library/react-native";

describe("i18n/useI18n", () => {
  it("should get the app name", () => {
    const { result } = renderHook(() => useI18n());
    const appTitle = result.current.L("app_title");
    expect(appTitle).toBe("Teste Subida do Elevador");
  });
});
