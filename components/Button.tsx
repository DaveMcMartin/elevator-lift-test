import { StyleSheet, TouchableOpacity, Text } from "react-native";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
}
const Button = ({ title, onPress }: ButtonProps) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: 4,
  },
  text: {
    fontSize: 16,
  },
});

export default Button;
