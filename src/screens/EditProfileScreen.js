// src/screens/EditProfileScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme, useThemedStyles, spacing, radius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { PrimaryButton, Notice, Divider } from '../components/common';

export default function EditProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { user, refreshProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [nik, setNik] = useState(user?.nik || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [avatar, setAvatar] = useState(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const hasPassword = user?.has_password !== false;

  const cleanNik = (v) => v.replace(/\D/g, '').slice(0, 16);
  const cleanPhone = (v) => v.replace(/[^\d+]/g, '').slice(0, 20);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Izin diperlukan', 'Izinkan akses galeri untuk ganti foto profil.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets?.[0]) {
      setAvatar(res.assets[0]);
    }
  };

  const saveProfile = async () => {
    setProfileError('');

    // Validasi
    if (!name.trim()) return setProfileError('Nama wajib diisi.');
    if (nik && nik.length !== 16) return setProfileError('NIK harus 16 digit.');

    setSavingProfile(true);
    try {
      let res;

      // Base payload
      const basePayload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        nik: nik.trim() || null,
        gender: gender || null,
      };

      if (avatar) {
        // Upload avatar via multipart
        const fd = new FormData();
        fd.append('_method', 'PUT');
        Object.entries(basePayload).forEach(([k, v]) => {
          if (v !== null && v !== undefined) fd.append(k, v);
        });
        fd.append('avatar', {
          uri: avatar.uri,
          type: avatar.mimeType || 'image/jpeg',
          name: `avatar-${Date.now()}.jpg`,
        });

        console.log('[EditProfile] Uploading avatar...');
        res = await authApi.updateProfileWithAvatar(fd);
        console.log('[EditProfile] Upload response:', JSON.stringify(res));
      } else {
        res = await authApi.updateProfile(basePayload);
        console.log('[EditProfile] Update response:', JSON.stringify(res));
      }

      await refreshProfile();
      setAvatar(null);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.error('[EditProfile] Save error:', e);
      setProfileError(e.message || 'Gagal menyimpan profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 8) {
      return setPasswordError('Password baru minimal 8 karakter.');
    }
    if (newPassword !== confirmPassword) {
      return setPasswordError('Konfirmasi password tidak sama.');
    }
    if (hasPassword && !currentPassword) {
      return setPasswordError('Password lama wajib diisi.');
    }

    setSavingPassword(true);
    try {
      const payload = {
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      };
      if (hasPassword) payload.current_password = currentPassword;

      await authApi.changePassword(payload);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Berhasil', 'Password berhasil diganti.');
    } catch (e) {
      setPasswordError(e.message || 'Gagal mengganti password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const avatarUri = (() => {
    if (avatar?.uri) return avatar.uri;
    const url = user?.avatar_url;
    if (!url) return null;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}t=${Date.now()}`;
  })();

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={s.avatarSection}>
          <Pressable onPress={pickAvatar} style={s.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={s.avatarImg} />
            ) : (
              <View style={[s.avatarImg, s.avatarPlaceholder]}>
                <Text style={s.avatarInitial}>
                  {(name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={s.avatarEdit}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </Pressable>
          <Text style={s.avatarHint}>Tap untuk ganti foto</Text>
        </View>

        {/* Form Profile */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Data Diri</Text>
          <Divider style={{ marginVertical: spacing.md }} />

          {profileError ? (
            <Notice text={profileError} tone="primary" icon="alert-circle-outline" />
          ) : null}

          <View style={s.field}>
            <Text style={s.label}>Nama Lengkap</Text>
            <View style={s.inputBox}>
              <Ionicons name="person-outline" size={17} color={colors.textFaint} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nama lengkap"
                placeholderTextColor={colors.textFaint}
                style={s.input}
              />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <View style={s.inputBox}>
              <Ionicons name="mail-outline" size={17} color={colors.textFaint} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={colors.textFaint}
                keyboardType="email-address"
                autoCapitalize="none"
                style={s.input}
              />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Nomor HP</Text>
            <View style={s.inputBox}>
              <Ionicons name="call-outline" size={17} color={colors.textFaint} />
              <TextInput
                value={phone}
                onChangeText={(v) => setPhone(cleanPhone(v))}
                placeholder="081234567890"
                placeholderTextColor={colors.textFaint}
                keyboardType="phone-pad"
                style={s.input}
              />
            </View>
          </View>

          {/* NIK */}
          <View style={s.field}>
            <Text style={s.label}>NIK (16 digit)</Text>
            <View style={s.inputBox}>
              <Ionicons name="card-outline" size={17} color={colors.textFaint} />
              <TextInput
                value={nik}
                onChangeText={(v) => setNik(cleanNik(v))}
                placeholder="16 digit NIK KTP"
                placeholderTextColor={colors.textFaint}
                keyboardType="number-pad"
                maxLength={16}
                style={s.input}
              />
            </View>
            <Text style={s.hint}>{nik.length}/16 digit</Text>
          </View>

          {/* Gender */}
          <View style={s.field}>
            <Text style={s.label}>Jenis Kelamin</Text>
            <View style={s.genderRow}>
              {[
                { v: 'L', l: 'Laki-laki', icon: 'male' },
                { v: 'P', l: 'Perempuan', icon: 'female' },
              ].map((g) => {
                const active = gender === g.v;
                return (
                  <Pressable
                    key={g.v}
                    onPress={() => setGender(g.v)}
                    style={[s.genderChip, active && s.genderChipActive]}
                  >
                    <Ionicons
                      name={g.icon}
                      size={16}
                      color={active ? colors.onPrimary : colors.textMuted}
                    />
                    <Text style={[s.genderText, active && s.genderTextActive]}>
                      {g.l}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <PrimaryButton
            label={savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
            icon="checkmark-circle-outline"
            loading={savingProfile}
            onPress={saveProfile}
            style={{ marginTop: spacing.lg }}
          />
        </View>

        {/* Form Password */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Ganti Password</Text>
          <Divider style={{ marginVertical: spacing.md }} />

          {passwordError ? (
            <Notice text={passwordError} tone="primary" icon="alert-circle-outline" />
          ) : null}

          {!hasPassword ? (
            <Notice
              text="Akun Google Anda belum punya password. Buat password baru di bawah."
              tone="primary"
              icon="information-circle-outline"
            />
          ) : null}

          {hasPassword ? (
            <View style={s.field}>
              <Text style={s.label}>Password Lama</Text>
              <View style={s.inputBox}>
                <Ionicons name="lock-closed-outline" size={17} color={colors.textFaint} />
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="••••••"
                  placeholderTextColor={colors.textFaint}
                  secureTextEntry={!showPass}
                  style={s.input}
                />
              </View>
            </View>
          ) : null}

          <View style={s.field}>
            <Text style={s.label}>Password Baru</Text>
            <View style={s.inputBox}>
              <Ionicons name="lock-closed-outline" size={17} color={colors.textFaint} />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Minimal 8 karakter"
                placeholderTextColor={colors.textFaint}
                secureTextEntry={!showPass}
                style={s.input}
              />
              <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={17}
                  color={colors.textFaint}
                />
              </Pressable>
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Konfirmasi Password</Text>
            <View style={s.inputBox}>
              <Ionicons name="lock-closed-outline" size={17} color={colors.textFaint} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Ulangi password baru"
                placeholderTextColor={colors.textFaint}
                secureTextEntry={!showPass}
                style={s.input}
              />
            </View>
          </View>

          <PrimaryButton
            label={savingPassword ? 'Menyimpan...' : 'Ganti Password'}
            icon="key-outline"
            loading={savingPassword}
            onPress={changePassword}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c, t) => ({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md },

  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  avatarWrap: { position: 'relative' },
  avatarImg: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: c.surfaceAlt,
  },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: c.primary, fontSize: 36, fontWeight: '900' },
  avatarEdit: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: c.base,
  },
  avatarHint: { ...t.small, fontSize: 11 },

  card: {
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line, padding: spacing.lg,
  },
  sectionTitle: { ...t.subtitle, fontSize: 15, fontWeight: '900' },

  field: { gap: 6, marginTop: spacing.md },
  label: { ...t.small, fontSize: 12, color: c.textMuted, fontWeight: '700' },
  hint: { ...t.small, fontSize: 10, textAlign: 'right', marginTop: 2 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    height: 50, paddingHorizontal: spacing.lg,
    backgroundColor: c.base, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.line,
  },
  input: { flex: 1, color: c.text, fontSize: 14, padding: 0 },

  genderRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.base,
  },
  genderChipActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  genderText: { color: c.textMuted, fontSize: 13, fontWeight: '700' },
  genderTextActive: { color: c.onPrimary },
});