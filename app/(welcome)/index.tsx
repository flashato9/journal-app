import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useWelcomeRouting } from "@/hooks/welcome/useWelcomeRouting";

export default function WelcomeIndexScreen() {
  useWelcomeRouting();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <LoadingIndicator message="Loading..." />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
