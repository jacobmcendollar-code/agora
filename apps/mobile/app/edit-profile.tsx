import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenScroll } from "@/components/Screen";
import { updateProfile, uploadImage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fetchPublicProfile } from "@/lib/profile";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

const BIO_MAX = 500;

export default function EditProfileScreen() {
  const { user, ready, updateUser } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [bio, setBio] = useState("");
  const [image, setImage] = useState<string | null>(user?.image ?? null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchPublicProfile(user.username)
      .then((profile) => {
        if (cancelled) return;
        setBio(profile.bio || "");
        setImage(profile.image);
      })
      .catch(() => {
        if (cancelled) return;
        setBio("");
        setImage(user.image ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setError("Could not read that image");
      return;
    }
    if ((asset.fileSize || 0) > 4 * 1024 * 1024) {
      setError("Image must be under 4MB");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const data = await uploadImage({
        fileName: asset.fileName || "avatar.jpg",
        fileType: asset.mimeType || "image/jpeg",
        fileData: asset.base64,
      });
      setImage(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (!user || saving || uploading) return;
    setSaving(true);
    setError(null);
    try {
      const next = await updateProfile({
        bio: bio.trim() || null,
        image: image || null,
      });
      updateUser({ image: next.image });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  if (!ready || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.emerald} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.need}>You need an account to edit your profile.</Text>
        <Pressable style={styles.save} onPress={() => router.push("/login")}>
          <Text style={styles.saveText}>Log in</Text>
        </Pressable>
      </View>
    );
  }

  const initial = user.username[0]?.toUpperCase() || "?";

  return (
    <ScreenScroll includeTabs={false}>
      <Text style={styles.heading}>Edit profile</Text>
      <Text style={styles.lede}>Photo and a short bio. Same fields as the site.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Profile photo</Text>
      <View style={styles.photoRow}>
        {image ? (
          <Image source={{ uri: image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 8 }}>
          <Pressable onPress={pickImage} disabled={uploading || saving} style={styles.secondary}>
            <Text style={styles.secondaryText}>{uploading ? "Uploading…" : "Change photo"}</Text>
          </Pressable>
          {image ? (
            <Pressable onPress={() => setImage(null)} disabled={uploading || saving}>
              <Text style={styles.remove}>Remove photo</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.bioHead}>
        <Text style={styles.label}>About me</Text>
        <Text style={styles.count}>
          {bio.length}/{BIO_MAX}
        </Text>
      </View>
      <TextInput
        value={bio}
        onChangeText={(value) => setBio(value.slice(0, BIO_MAX))}
        placeholder="A short intro (optional)"
        placeholderTextColor={colors.faint}
        style={styles.field}
        multiline
        maxLength={BIO_MAX}
        editable={!saving}
      />

      <Pressable
        onPress={onSave}
        disabled={saving || uploading}
        style={[styles.save, (saving || uploading) && styles.saveDisabled]}
      >
        <Text style={styles.saveText}>{saving ? "Saving…" : "Save"}</Text>
      </Pressable>
    </ScreenScroll>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
      paddingHorizontal: 24,
      gap: 16,
    },
    need: { color: colors.muted, fontSize: 16, textAlign: "center" },
    heading: { color: colors.text, fontSize: 24, fontWeight: "700" },
    lede: { color: colors.muted, marginTop: 6, marginBottom: 18, fontSize: 14 },
    error: { color: colors.rose, marginBottom: 14, fontSize: 14 },
    label: { color: colors.muted, fontSize: 13, fontWeight: "600", marginBottom: 8 },
    photoRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
    avatar: { width: 72, height: 72, borderRadius: 36 },
    avatarFallback: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.emeraldDark,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLetter: { color: colors.white, fontSize: 26, fontWeight: "700" },
    secondary: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: "center",
    },
    secondaryText: { color: colors.text, fontSize: 14, fontWeight: "600" },
    remove: { color: colors.rose, fontSize: 13, fontWeight: "600" },
    bioHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    count: { color: colors.faint, fontSize: 12 },
    field: {
      backgroundColor: colors.field,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      minHeight: 110,
      textAlignVertical: "top",
      marginBottom: 18,
    },
    save: {
      backgroundColor: colors.emeraldDark,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
    },
    saveDisabled: { opacity: 0.5 },
    saveText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  });
}
