import { StyleSheet, View } from "react-native";
import ChevronPath from "@/components/welcome/ChevronPath";

const CHEVRON_TOP_TO_BOTTOM_INDICES = [3, 2, 1, 0];

interface ChevronSwipeLoginProps {
  failureTrigger: number;
}

function renderChevronPath(index: number, failureTrigger: number) {
  const content = (
    <ChevronPath key={index} index={index} failureTrigger={failureTrigger} />
  );
  return content;
}

export default function ChevronSwipeLogin({
  failureTrigger,
}: ChevronSwipeLoginProps) {
  const chevronRows = CHEVRON_TOP_TO_BOTTOM_INDICES.map((index) =>
    renderChevronPath(index, failureTrigger),
  );

  const content = <View style={styles.container}>{chevronRows}</View>;
  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
});
