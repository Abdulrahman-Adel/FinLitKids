import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, 
  SafeAreaView, // Import SafeAreaView
  KeyboardAvoidingView, // Import KeyboardAvoidingView
  Platform // Import Platform
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/contexts/authStore';
import { Colors } from '@/constants/Colors'; // Use alias for constants
import { useColorScheme } from '@/hooks/useColorScheme'; // Import hook

const ParentLoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const colorScheme = useColorScheme(); // Get current color scheme
  const colors = Colors[colorScheme ?? 'light']; // Get colors for the scheme

  const handleLogin = () => {
    // Basic Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email or username.');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password.');
      return;
    }

    console.log(`Attempting Parent Login with Email: ${email}`);
    // --- MOCK Authentication --- 
    // In a real app, you'd get the parent's ID from the backend upon successful login.
    // For now, we'll use a mock ID.
    const MOCK_PARENT_ID = 'parent-001'; 

    // Simulate successful login for any input for now
    // TODO: Replace with actual API call and response check
    if (email && password) { // Simple check that fields are not empty
        console.log(`Parent ${email} authenticated (mock).`);
        login('parent', MOCK_PARENT_ID); // Pass type and mock ID
    } else {
         Alert.alert('Login Failed', 'Mock login requires non-empty fields.');
    }
    // ---------------------------
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.innerContainer}> 
          <Text style={[styles.title, { color: colors.text }]}>Parent Portal</Text>

          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.backgroundStrong, 
              color: colors.text, 
              borderColor: colors.placeholder 
            }]}
            placeholder="Email or Username"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.placeholder}
          />
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.backgroundStrong, 
              color: colors.text, 
              borderColor: colors.placeholder 
            }]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry // Hides password
            placeholderTextColor={colors.placeholder}
          />

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          <Link href="/(auth)/parent-sign-up" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
          </Link>
           {/* Optional: Add Forgot Password Link */}
           {/* <Link href="/(auth)/forgot-password" asChild>
             <TouchableOpacity style={styles.linkButton_forgot}>
               <Text style={styles.linkText}>Forgot Password?</Text>
             </TouchableOpacity>
           </Link> */}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Updated Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Center content vertically
  },
  innerContainer: {
    paddingHorizontal: 30, // Horizontal padding
    alignItems: 'center', // Center items horizontally
  },
  title: {
    fontSize: 32, // Slightly larger title
    fontWeight: 'bold',
    marginBottom: 50, // Increased space
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 55, // Slightly taller input
    borderWidth: 1,
    borderRadius: 10, // More rounded corners
    marginBottom: 20,
    paddingHorizontal: 20,
    fontSize: 17,
  },
  button: {
    width: '100%',
    paddingVertical: 18, // Increased padding
    borderRadius: 10, // Match input radius
    alignItems: 'center',
    marginTop: 15, // Increased space
    shadowColor: "#000", // Adding subtle shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  buttonText: {
    color: Colors.light.backgroundStrong, // Use white from palette
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 30, // Increased space
  },
  // linkButton_forgot: {
  //   marginTop: 15,
  // },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ParentLoginScreen; 