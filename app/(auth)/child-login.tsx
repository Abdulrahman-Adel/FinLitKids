import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../src/contexts/authStore';
import { Colors } from '@/constants/Colors'; 
import { useColorScheme } from '@/hooks/useColorScheme';

const ChildLoginScreen: React.FC = () => {
  const [parentId, setParentId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // Select state slices individually
  const childLogin = useAuthStore((state) => state.childLogin);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  
  const colorScheme = useColorScheme(); 
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    clearError();
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleLogin = async () => {
    clearError();
    if (!parentId.trim()) {
      Alert.alert('Error', 'Please ask your parent for their Parent ID.');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username.');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password/PIN.');
      return;
    }

    console.log(`Attempting Child Login with ParentID: ${parentId}, Username: ${username}`);
    
    const success = await childLogin({ parentId, username, password });

    if (success) {
      console.log('Child login successful via API.');
    } else {
      console.log('Child login failed.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
       <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.innerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Hi Kiddo!</Text>

          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          )}

          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.backgroundStrong, 
              color: colors.text, 
              borderColor: colors.placeholder 
            }]}
            placeholder="Parent ID (ask your parent)"
            value={parentId}
            onChangeText={setParentId}
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
            placeholder="Your Username"
            value={username}
            onChangeText={setUsername}
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
            placeholder="Password / PIN"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={colors.placeholder}
            editable={!isLoading}
          />
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: isLoading ? colors.placeholder : colors.secondary }]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
               <ActivityIndicator size="small" color={colors.backgroundStrong} />
             ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>
          
          <Link href="/(auth)/parent-login" asChild>
            <TouchableOpacity style={styles.linkButton} disabled={isLoading}>
              <Text style={[styles.linkText, { color: isLoading ? colors.placeholder : colors.primary }]}>Are you a Parent?</Text>
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

export default ChildLoginScreen;
