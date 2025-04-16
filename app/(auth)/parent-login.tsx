import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, 
  SafeAreaView, // Import SafeAreaView
  KeyboardAvoidingView, // Import KeyboardAvoidingView
  Platform, // Import Platform
  ActivityIndicator // Import ActivityIndicator
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/contexts/authStore'; // Remove AuthState type import
import { shallow } from 'zustand/shallow'; // Import shallow
import { Colors } from '@/constants/Colors'; // Use alias for constants
import { useColorScheme } from '@/hooks/useColorScheme'; // Import hook

const ParentLoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Select state slices individually
  const parentLogin = useAuthStore((state) => state.parentLogin);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  
  const router = useRouter();
  const colorScheme = useColorScheme(); // Get current color scheme
  const colors = Colors[colorScheme ?? 'light']; // Get colors for the scheme

  useEffect(() => {
    clearError();
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleLogin = async () => {
    clearError();

    if (!email.trim() || !password) {
        return;
    }

    console.log(`Attempting Parent Login with Email: ${email}`);
    
    const success = await parentLogin({ email, password });

    if (success) {
      console.log('Parent login successful via API.');
      // Navigate to the parent's main screen
      router.replace('/(parent)/');
    } else {
      console.log('Parent login failed.');
      // Optionally, display the error message if it's not already shown
      Alert.alert('Login Failed', error || 'An unknown error occurred.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.innerContainer}> 
          <Text style={[styles.title, { color: colors.text }]}>Parent Portal</Text>

          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          )}

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
            editable={!isLoading}
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
            secureTextEntry
            placeholderTextColor={colors.placeholder}
            editable={!isLoading}
          />

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: isLoading ? colors.placeholder : colors.primary }]} 
            onPress={handleLogin} 
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.backgroundStrong} />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/parent-sign-up" asChild>
            <TouchableOpacity style={styles.linkButton} disabled={isLoading}>
              <Text style={[styles.linkText, { color: isLoading ? colors.placeholder : colors.primary }]}>Don't have an account? Sign Up</Text>
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  errorText: {
      marginBottom: 15,
      fontSize: 15,
      textAlign: 'center',
      fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
    fontSize: 17,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  buttonText: {
    color: Colors.light.backgroundStrong,
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 30,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ParentLoginScreen;
