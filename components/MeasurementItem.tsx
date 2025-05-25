import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

export interface MeasurementItemProps {
  label: string;
  value: string;
}

const MeasurementItem = ({ label, value }: MeasurementItemProps) => {
  return (
    <View style={styles.measurementDetails}>
      <Text style={styles.measurementLabel}>{label}</Text>
      <Text style={styles.measurementValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  measurementDetails: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  measurementLabel: {
    fontSize: 16,
    color: colors.white,
    marginRight: 10,
  },
  measurementValue: {
    fontSize: 16,
    color: colors.white,
    flexGrow: 1,
    textAlign: "right",
  },
});

export default MeasurementItem;
