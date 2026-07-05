import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useContext, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import { insertUserIntoDB, isUserExists } from "../../services/database";
import Header from "../components/Header";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { setUsername: setAuthUsername } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both username and password.");
      return;
    }

    try {
      const key = `login.${username}`;

      // Check if username exists and password matches
      const storedPassword = await SecureStore.getItemAsync(key);

      if (!storedPassword || storedPassword !== password) {
        // Log which one is incorrect for debugging (server-side only)
        if (!storedPassword) {
          console.log("Username incorrect:", username);
        } else {
          console.log("Password incorrect for username:", username);
        }

        // Show generic error to user
        Alert.alert("Login Failed", "Invalid username or password.");
        return;
      }

      // Login successful - ensure user exists in database
      console.log("Login successful:", { username });
      try {
        if (!isUserExists(username)) {
          insertUserIntoDB(username);
        }
      } catch (dbError) {
        console.error("Error creating user in database:", dbError);
      }
      setAuthUsername(username);
      router.push("/(memories)/allmemories");
    } catch (error) {
      console.error("Error during login:", error);
      Alert.alert("Login Failed", "An error occurred. Please try again.");
    }
  };

  const handleRegister = () => {
    router.push("/(welcome)/register");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="" />

      {/* Centered Login Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          editable={true}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRegister}>
          <Text style={styles.registerLink}>Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerLink: {
    color: "#007AFF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
