import { useLocales } from "expo-localization";
import { useCallback } from "react";
import enUS from "./en-US.json";
import ptBR from "./pt-BR.json";

type Translations = {
  [key: string]: string;
};

export const useI18n = () => {
  const [locale] = useLocales();
  const currentLocal = locale.languageTag || "pt-BR";

  const getLocale = useCallback((): "pt-BR" | "en-US" => {
    if (currentLocal.startsWith("pt")) return "pt-BR";
    return "en-US";
  }, [currentLocal]);

  const getString = useCallback(
    (key: string): string => {
      const lcl = getLocale();
      const strings: Translations = lcl === "pt-BR" ? ptBR : enUS;
      return strings[key] || key;
    },
    [getLocale],
  );

  return {
    L: getString,
  };
};
