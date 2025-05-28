import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors } from "../constants/colors";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}
const Button = ({ title, onPress, style, textStyle }: ButtonProps) => {
  return (
    <TouchableOpacity
      testID="button"
      style={[styles.button, style]}
      onPress={onPress}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  button: {
    borderRadius: 24,
    backgroundColor: colors.blue,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 180,
  },
  text: {
    fontSize: 21,
    textAlign: "center",
    color: colors.white,
  },
});

export default Button;
