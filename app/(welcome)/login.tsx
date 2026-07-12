import { useEffect } from "react";
import { Image, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/Button";
import Header from "@/components/Header";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useLogin } from "@/hooks/welcome/useLogin";
import { useUserSession } from "@/hooks/welcome/useUserSession";

export default function LoginScreen() {
  const {
    setUsername,
    password,
    setPassword,
    handleLogin,
    loginWithBiometrics,
    isBiometricLoginExhausted,
  } = useLogin();
  const { username, profileImagePath, preferredLoginMethod } = useUserSession();

  useEffect(() => {
    if (username) setUsername(username);
  }, [username, setUsername]);

  const showBiometricLogin =
    preferredLoginMethod === "BIOMETRIC" && !isBiometricLoginExhausted;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="" />

      <View style={styles.content}>
        <View style={styles.polaroidFrame}>
          {profileImagePath ? (
            <Image
              source={{ uri: profileImagePath }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.profileImage}>
              <LoadingIndicator message="Loading..." />
            </View>
          )}

          {username && <Text style={styles.username}>{username}</Text>}
        </View>

        {showBiometricLogin ? (
          <View style={styles.buttonWrapper}>
            <Button
              text="Login"
              onPress={loginWithBiometrics}
              backgroundColor="#007AFF"
            />
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <View style={styles.buttonWrapper}>
              <Button
                text="Login"
                onPress={handleLogin}
                backgroundColor="#007AFF"
              />
            </View>
          </>
        )}
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
    paddingHorizontal: 20,
    gap: 16,
  },
  polaroidFrame: {
    backgroundColor: "#fff",
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 16,
    marginBottom: 8,
    transform: [{ rotate: "-2deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  profileImage: {
    width: 160,
    height: 160,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginTop: 12,
  },
  buttonWrapper: {
    width: "100%",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
});
