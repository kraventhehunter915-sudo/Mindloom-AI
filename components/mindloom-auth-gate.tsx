import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export function MindloomAuthGate({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });
  const register = trpc.auth.register.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });
  const login = trpc.auth.login.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const busy = register.isPending || login.isPending;
  const mutationError = register.error?.message || login.error?.message || "";
  const errorText = formError || mutationError;
  const title = useMemo(
    () => (mode === "login" ? "Welcome back" : "Create your space"),
    [mode],
  );

  if (meQuery.isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          Opening your private space…
        </Text>
      </View>
    );
  }
  if (meQuery.data) return <>{children}</>;

  const submit = () => {
    setFormError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@"))
      return setFormError("Enter a valid email address.");
    if (mode === "register" && !name.trim())
      return setFormError("Add your name so Mindloom can greet you.");
    if (password.length < 8)
      return setFormError("Use at least 8 characters for your password.");
    if (mode === "register")
      register.mutate({ email: normalizedEmail, password, name: name.trim() });
    else login.mutate({ email: normalizedEmail, password });
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <View
        style={[styles.ambient, { backgroundColor: `${colors.primary}10` }]}
      />
      <View style={[styles.authLayout, compact && styles.compactAuthLayout]}>
        <View
          style={[styles.brandColumn, compact && styles.compactBrandColumn]}
        >
          <View
            style={[
              styles.brandMark,
              { backgroundColor: colors.surface, borderColor: colors.border },
              compact && styles.compactBrandMark,
            ]}
          >
            <Image
              source={require("../assets/images/mindloom-logo-cropped.png")}
              style={styles.brandMarkImage}
              resizeMode="contain"
            />
          </View>
          <Text
            style={[
              styles.brandName,
              { color: colors.foreground },
              compact && styles.compactBrandName,
            ]}
          >
            Mindloom
          </Text>
          <Text
            style={[
              styles.brandTagline,
              { color: colors.muted },
              compact && styles.compactBrandTagline,
            ]}
          >
            A quieter way to collect, connect, and understand your thinking.
          </Text>
          <View
            style={[styles.promiseList, compact && styles.compactPromiseList]}
          >
            {[
              ["01", "Your notes stay yours"],
              ["02", "Ideas become a living map"],
              ["03", "AI works from your sources"],
            ].map(([number, label]) => (
              <View key={number} style={styles.promiseRow}>
                <Text style={[styles.promiseNumber, { color: colors.primary }]}>
                  {number}
                </Text>
                <Text
                  style={[styles.promiseText, { color: colors.foreground }]}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            compact && styles.compactCard,
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            PRIVATE KNOWLEDGE SPACE
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {mode === "login"
              ? "Sign in to continue your connected thinking."
              : "One email. One private space for everything you are learning."}
          </Text>
          {mode === "register" && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Your name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="What should we call you?"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                autoComplete="name"
              />
            </View>
          )}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              secureTextEntry
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              onSubmitEditing={submit}
            />
          </View>
          {!!errorText && (
            <Text style={[styles.error, { color: colors.error }]}>
              {errorText}
            </Text>
          )}
          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [
              styles.submit,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
              busy && styles.disabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                {mode === "login" ? "Enter Mindloom" : "Create my space"}
              </Text>
            )}
          </Pressable>
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: colors.muted }]}>
              {mode === "login" ? "New to Mindloom?" : "Already have a space?"}
            </Text>
            <Pressable
              onPress={() => {
                setMode(mode === "login" ? "register" : "login");
                setFormError("");
              }}
            >
              <Text style={[styles.switchAction, { color: colors.primary }]}>
                {mode === "login" ? "Create an account" : "Sign in"}
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.privacy, { color: colors.muted }]}>
            Mindloom uses your email only for your account. No Google,
            Microsoft, or social sign-in.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13 },
  page: {
    flex: 1,
    minHeight: "100%",
    justifyContent: "center",
    overflow: "hidden",
  },
  ambient: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 260,
    top: -240,
    right: -130,
  },
  authLayout: {
    width: "100%",
    maxWidth: 1050,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingVertical: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 70,
  },
  compactAuthLayout: {
    maxWidth: 460,
    paddingHorizontal: 20,
    paddingVertical: 26,
    flexDirection: "column",
    alignItems: "stretch",
    gap: 22,
  },
  brandColumn: { flex: 1, maxWidth: 440 },
  compactBrandColumn: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    height: 96,
    minHeight: 96,
    maxWidth: 390,
    alignSelf: "center",
    alignItems: "center",
  },
  brandMark: {
    width: 50,
    height: 50,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
    overflow: "hidden",
  },
  brandMarkText: { color: "#FFFFFF", fontSize: 27, fontWeight: "800" },
  brandMarkImage: { width: 44, height: 32 },
  compactBrandMark: { marginBottom: 0 },
  brandName: {
    fontSize: 46,
    lineHeight: 52,
    fontWeight: "800",
    letterSpacing: -1.6,
  },
  compactBrandName: { display: "none" },
  brandTagline: { maxWidth: 360, fontSize: 17, lineHeight: 25, marginTop: 13 },
  compactBrandTagline: { display: "none" },
  promiseList: { gap: 15, marginTop: 36 },
  compactPromiseList: { display: "none" },
  promiseRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  promiseNumber: { fontSize: 10, letterSpacing: 1, fontWeight: "800" },
  promiseText: { fontSize: 13, fontWeight: "700" },
  card: {
    width: 390,
    borderWidth: 1,
    borderRadius: 25,
    padding: 27,
    shadowColor: "#0F291D",
    shadowOpacity: 0.09,
    shadowRadius: 30,
    elevation: 5,
  },
  compactCard: { width: "100%", padding: 22, borderRadius: 21 },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: "800",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 22 },
  field: { gap: 7, marginBottom: 14 },
  label: { fontSize: 11, fontWeight: "800" },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    fontSize: 14,
  },
  error: { fontSize: 12, lineHeight: 17, marginBottom: 12 },
  submit: {
    minHeight: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
  submitText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.65 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 19,
  },
  switchText: { fontSize: 12 },
  switchAction: { fontSize: 12, fontWeight: "800" },
  privacy: { fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 22 },
});
