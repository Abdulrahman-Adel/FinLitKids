import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  SafeAreaView, KeyboardAvoidingView, Platform
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../src/contexts/authStore';
import { useProfileStore } from '../../src/contexts/profileStore';
import { Colors } from '@/constants/Colors'; 
import { useColorScheme } from '@/hooks/useColorScheme';

const ChildLoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const children = useProfileStore((state) => state.children);
  const colorScheme = useColorScheme(); 
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogin = () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username.');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password/PIN.');
      return;
    }

    console.log(`Attempting Child Login with Username: ${username}`);
    
    const foundChild = children.find(
        (child) => child.name.toLowerCase() === username.trim().toLowerCase()
    );

    if (foundChild && foundChild.password_mock === password) {
        console.log(`Child ${username} authenticated (mock).`);
        login('child', foundChild.id);
    } else {
        console.log(`Child ${username} authentication failed (mock).`);
        Alert.alert('Login Failed', 'Incorrect username or password/PIN.');
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

          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.backgroundStrong, 
              color: colors.text, 
              borderColor: colors.placeholder 
            }]}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholderTextColor={colors.placeholder}
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
          />
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.secondary }]} 
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
          
          <Link href="/(auth)/parent-auth" asChild> 
            <TouchableOpacity style={styles.linkButton}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Not a Child? Go Back</Text>
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
    marginBottom: 50,
    textAlign: 'center',
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