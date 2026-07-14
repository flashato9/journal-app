import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import Header from "@/components/Header";
import { useDebugLlm } from "@/hooks/options/useDebugLlm";

const ACTIVATE_BUTTON_LABEL: Record<string, string> = {
  idle: "Activate Model",
  loading: "Loading model...",
  ready: "Deactivate Model",
  error: "Retry Activation",
};

export default function DebugLlmScreen() {
  const {
    downloadState,
    downloadProgress,
    handleStartDownload,
    handlePauseDownload,
    handleDeleteDownload,
    isVerifying,
    handleCheckDownload,
    activationStatus,
    handleActivateModel,
    handleDeactivateModel,
    question,
    setQuestion,
    answer,
    isAsking,
    handleAskQuestion,
    imageUri,
    pickImage,
    imageDescription,
    isDescribing,
    handleDescribeImage,
  } = useDebugLlm();

  const isReady = activationStatus === "ready";
  const isDownloading = downloadState === "downloading";

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Debug LLM" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Download</Text>
          <View style={styles.buttonRow}>
            <View style={styles.rowButton}>
              <Button
                text="Start Download"
                onPress={handleStartDownload}
                backgroundColor="#007AFF"
                disabled={
                  downloadState === "checking" ||
                  isDownloading ||
                  downloadState === "downloaded"
                }
              />
            </View>
            <View style={styles.rowButton}>
              <Button
                text="Pause Download"
                onPress={handlePauseDownload}
                backgroundColor="#FF9500"
                disabled={!isDownloading}
              />
            </View>
          </View>
          <Text style={styles.progressText}>
            {Math.round(downloadProgress * 100)}%
          </Text>
          <View style={styles.buttonRow}>
            <View style={styles.rowButton}>
              <Button
                text={isVerifying ? "Checking..." : "Check Download"}
                onPress={handleCheckDownload}
                backgroundColor="#007AFF"
                disabled={isVerifying || isDownloading}
              />
            </View>
            <View style={styles.rowButton}>
              <Button
                text="Delete Download"
                onPress={handleDeleteDownload}
                backgroundColor="#FF3B30"
                disabled={
                  downloadState === "checking" ||
                  downloadState === "not_started" ||
                  isDownloading
                }
              />
            </View>
          </View>
        </View>

        {downloadState === "downloaded" && (
          <View style={styles.buttonWrapper}>
            <Button
              text={ACTIVATE_BUTTON_LABEL[activationStatus]}
              onPress={isReady ? handleDeactivateModel : handleActivateModel}
              backgroundColor={isReady ? "#FF3B30" : "#007AFF"}
              disabled={activationStatus === "loading"}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ask a Question</Text>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Type a question..."
            placeholderTextColor="#999"
            multiline
          />
          <View style={styles.buttonWrapper}>
            <Button
              text="Ask"
              onPress={handleAskQuestion}
              backgroundColor="#007AFF"
              disabled={!isReady || isAsking || !question.trim()}
            />
          </View>
          {answer ? <Text style={styles.responseText}>{answer}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe an Image</Text>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          )}
          <View style={styles.buttonRow}>
            <View style={styles.rowButton}>
              <Button
                text="Pick Image"
                onPress={pickImage}
                backgroundColor="#34C759"
                disabled={!isReady}
              />
            </View>
            <View style={styles.rowButton}>
              <Button
                text="Describe Image"
                onPress={handleDescribeImage}
                backgroundColor="#007AFF"
                disabled={!isReady || !imageUri || isDescribing}
              />
            </View>
          </View>
          {imageDescription ? (
            <Text style={styles.responseText}>{imageDescription}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 20,
  },
  buttonWrapper: {
    width: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  // Used instead of buttonWrapper for buttons inside a buttonRow — flex: 1
  // splits the row evenly, whereas width: "100%" would make each button
  // claim the row's *entire* width and overflow off-screen.
  rowButton: {
    flex: 1,
  },
  progressText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
    minHeight: 80,
    textAlignVertical: "top",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  responseText: {
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
  },
});
