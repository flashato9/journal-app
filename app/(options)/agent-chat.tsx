import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CompanionChatSidebar from "@/components/CompanionChatSidebar";
import Header from "@/components/Header";
import { getColors } from "@/constants/colors";
import { useAgentChatScreen } from "@/hooks/companion/useAgentChatScreen";
import { CompanionMessage } from "@/services/companionApi";

const colors = getColors();

function renderMessage({ item }: { item: CompanionMessage }) {
  const isUserMessage = item.role === "user";
  const speaker = isUserMessage ? "You" : "Companion";
  const rowStyle = [
    styles.row,
    isUserMessage ? styles.rowUser : styles.rowCompanion,
  ];
  const bubbleStyle = [
    styles.bubble,
    isUserMessage ? styles.bubbleUser : styles.bubbleCompanion,
  ];
  const messageTextStyle = isUserMessage
    ? styles.messageTextUser
    : styles.messageTextCompanion;

  const content = (
    <View style={rowStyle}>
      <Text style={styles.author}>{speaker}</Text>
      <View style={bubbleStyle}>
        <Text style={messageTextStyle}>{item.text}</Text>
      </View>
    </View>
  );
  return content;
}

function getMessageKey(item: CompanionMessage): string {
  const key = `${item.createdAt}-${item.role}`;
  return key;
}

export default function AgentChatScreen() {
  const {
    status,
    activeThread,
    threads,
    inputText,
    setInputText,
    isSidebarOpen,
    onToggleSidebar,
    onSend,
    onSelectThread,
  } = useAgentChatScreen();
  const messageListRef = useRef<FlatList<CompanionMessage>>(null);

  useEffect(() => {
    messageListRef.current?.scrollToEnd({ animated: false });
  }, []);

  function scrollToLatestMessage(): void {
    messageListRef.current?.scrollToEnd({ animated: true });
  }

  if (!activeThread || status !== "ready") {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <Header title="Companion" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No active conversation.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sidebarToggleIconName = isSidebarOpen ? "chevron-left" : "menu";
  const sidebar = isSidebarOpen ? (
    <CompanionChatSidebar
      threads={threads}
      activeThreadKey={activeThread.threadKey}
      onSelectThread={onSelectThread}
    />
  ) : null;

  const sidebarToggle = (
    <Pressable onPress={onToggleSidebar} style={styles.sidebarToggle}>
      <MaterialIcons
        name={sidebarToggleIconName}
        size={22}
        color={colors.text}
      />
    </Pressable>
  );

  const content = (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Header title="Companion" actionIcons={sidebarToggle} />
      <View style={styles.body}>
        {sidebar}
        <View style={styles.mainColumn}>
          <FlatList
            ref={messageListRef}
            style={styles.messageList}
            data={activeThread.messages}
            keyExtractor={getMessageKey}
            renderItem={renderMessage}
            onContentSizeChange={scrollToLatestMessage}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={onSend}
              placeholder="Type a message"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable onPress={onSend} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>Send</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  sidebarToggle: {
    padding: 4,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  mainColumn: {
    flex: 1,
    flexDirection: "column",
  },
  messageList: {
    flex: 1,
    paddingRight: 8,
  },
  row: {
    marginBottom: 12,
  },
  rowCompanion: {
    alignItems: "flex-start",
  },
  rowUser: {
    alignItems: "flex-end",
  },
  author: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "80%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  bubbleCompanion: {
    backgroundColor: colors.background,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
  },
  messageTextCompanion: {
    fontSize: 14,
    color: colors.text,
  },
  messageTextUser: {
    fontSize: 14,
    color: colors.dayCardAccentText,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
    paddingBottom: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sendButtonText: {
    color: colors.dayCardAccentText,
    fontSize: 14,
  },
});
