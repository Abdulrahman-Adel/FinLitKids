import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../src/contexts/authStore';
import { Colors } from '@/constants/Colors'; 
import { useColorScheme } from '@/hooks/useColorScheme'; 

const ParentSignUpScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Select state slices individually
  const parentSignup = useAuthStore((state) => state.parentSignup);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  
  const colorScheme = useColorScheme(); 
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    // Clear error when the component mounts or unmounts
    clearError();
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSignUp = async () => {
    clearError();
    // Basic Email Validation Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validation Checks (Keep)
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.'); // Keep immediate validation alerts
      return;
    }
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match!");
      return;
    }

    // Call the actual parentSignup function
    console.log(`Attempting Parent Sign Up with Email: ${email}`);
    const success = await parentSignup({ email, password }); // Add name later if needed

    if (success) {
      Alert.alert('Success', 'Account created! Please log in.');
      router.replace('/(auth)/parent-login' as any); // Navigate to login screen
    } else {
      // Error state is set by the store, no need for Alert here unless desired
      console.log('Parent signup failed.');
      // Error message will be displayed via the error state variable
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
       <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.innerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Create Parent Account</Text>
          
          {/* Display Error Message */}
          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          )}
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.backgroundStrong, 
              color: colors.text, 
              borderColor: colors.placeholder 
            }]}
            placeholder="Email"
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
            placeholder="Password (min. 6 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={colors.placeholder}
            editable={!isLoading}
          />
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.backgroundStrong, 
              color: colors.text, 
              borderColor: colors.placeholder 
            }]}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor={colors.placeholder}
            editable={!isLoading}
          />
          
          <TouchableOpacity 
             style={[styles.button, { backgroundColor: isLoading ? colors.placeholder : colors.primary }]} 
             onPress={handleSignUp}
             disabled={isLoading}
           >
             {isLoading ? (
               <ActivityIndicator size="small" color={colors.backgroundStrong} />
             ) : (
               <Text style={styles.buttonText}>Sign Up</Text>
             )}
          </TouchableOpacity>
          
          <Link href="/(auth)/parent-login" asChild>
            <TouchableOpacity style={styles.linkButton} disabled={isLoading}>
              <Text style={[styles.linkText, { color: isLoading ? colors.placeholder : colors.primary }]}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  innerContainer: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30, // Adjusted spacing
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
    color: Colors.light.backgroundStrong, // White
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

export default ParentSignUpScreen;
