import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert,
  TextInput, Image // Added TextInput and Image
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '../../src/contexts/authStore';
import { useProfileStore } from '../../src/contexts/profileStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Import image picker

const ChildProfileScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const loggedInUserId = useAuthStore((state) => state.loggedInUserId);
  const getChildById = useProfileStore((state) => state.getChildById);
  const updateChild = useProfileStore((state) => state.updateChild);

  const loggedInChild = loggedInUserId ? getChildById(loggedInUserId) : null;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleAvatarChange = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to choose an avatar.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 0.5, // Compress image slightly
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImageUri = result.assets[0].uri;
      console.log("Selected Avatar URI:", selectedImageUri);
      // Update the profile in the store
      if (loggedInChild) {
        const updatedProfile = { ...loggedInChild, avatarUrl: selectedImageUri };
        updateChild(updatedProfile);
        Alert.alert('Avatar Updated!', 'Your new avatar has been set (locally).');
        // In a real app, you would upload selectedImageUri to cloud storage 
        // and store the returned URL in avatarUrl.
      }
    } else {
        console.log("Avatar selection cancelled or failed.");
    }
  };

  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please enter and confirm the new password/PIN.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters long.');
      return;
    }

    if (loggedInChild) {
      // Update the password_mock in the store - Pass the whole updated object
      const updatedProfile = { ...loggedInChild, password_mock: newPassword };
      updateChild(updatedProfile);
      Alert.alert('Success', 'Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      Alert.alert('Error', 'Could not update password. User not found.');
    }
  };

  if (!loggedInChild) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.container}><Text style={{ color: colors.text }}>Loading profile...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>My Profile</Text>

        {/* Avatar Section - Updated */}
        <TouchableOpacity onPress={handleAvatarChange} style={styles.avatarContainer}>
          {
            loggedInChild.avatarUrl ? (
                <Image source={{ uri: loggedInChild.avatarUrl }} style={styles.avatarImage} />
            ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}>
                    <Ionicons name="person" size={60} color={colors.backgroundStrong} />
                </View>
            )
          }
          <Text style={[styles.avatarText, { color: colors.primary }]}>Change Avatar</Text>
        </TouchableOpacity>

        <Text style={[styles.username, { color: colors.text }]}>Username: {loggedInChild.name}</Text>

        {/* Change Password Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Password/PIN</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
            placeholder="New Password/PIN (min 4 chars)"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholderTextColor={colors.placeholder}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundStrong, color: colors.text, borderColor: colors.placeholder }]}
            placeholder="Confirm New Password/PIN"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor={colors.placeholder}
          />
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleChangePassword}>
            <Text style={styles.buttonText}>Update Password</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
  },
  avatarImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: Colors.light.placeholder, // Add a slight border
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '500',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 40,
  },
  section: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 20,
    fontSize: 17,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: Colors.light.backgroundStrong,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ChildProfileScreen; 