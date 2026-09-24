import React, { useEffect, useMemo, useRef } from "react";
import {
  ArrowRight,
  ChevronDown,
  Code2,
  Coffee,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  LayoutDashboard,
  Lock,
  Mail,
  Send,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

import { api } from "../services/api";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface AuthProps {
  onAuthSuccess: () => void;
}

type AuthMode = "signup" | "login";

interface SignupFormState {
  full_name: string;
  phone_number: string;
  email: string;
  password: string;
  confirmPassword: string;
  domain: string;
  organization_type: string;
}

interface LoginFormState {
  email: string;
  password: string;
}

interface AuthInputProps {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  required?: boolean;
  trailing?: React.ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
  error?: string;
  helperText?: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const getPasswordStrength = (
  password: string
): { label: string; score: number } => {
  if (!password) {
    return {
      label: "",
      score: 0,
    };
  }

  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];

  return {
    label: labels[score],
    score,
  };
};

const strengthStyles = [
  "bg-red-500",
  "bg-red-500",
  "bg-amber-400",
  "bg-yellow-400",
  "bg-emerald-400",
];

/* -------------------------------------------------------------------------- */
/*                                Main Auth                                   */
/* -------------------------------------------------------------------------- */

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = React.useState<AuthMode>("signup");

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    React.useState(false);

  const [rememberMe, setRememberMe] = React.useState(true);
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [touchedConfirm, setTouchedConfirm] = React.useState(false);

  const [signup, setSignup] = React.useState<SignupFormState>({
    full_name: "",
    phone_number: "",
    email: "",
    password: "",
    confirmPassword: "",
    domain: "",
    organization_type: "therapist",
  });

  const [login, setLogin] = React.useState<LoginFormState>({
    email: "",
    password: "",
  });

  const isSignup = mode === "signup";

  const passwordStrength = useMemo(
    () => getPasswordStrength(signup.password),
    [signup.password]
  );

  const passwordsMismatch =
    touchedConfirm &&
    signup.confirmPassword.length > 0 &&
    signup.password !== signup.confirmPassword;

  const passwordsMatch =
    touchedConfirm &&
    signup.confirmPassword.length > 0 &&
    signup.password === signup.confirmPassword;

  /* ------------------------------------------------------------------------ */
  /*                                  Signup                                  */
  /* ------------------------------------------------------------------------ */

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();

    setError("");

    if (signup.password !== signup.confirmPassword) {
      setTouchedConfirm(true);
      setError("Passwords do not match.");
      return;
    }

    if (!termsAccepted) {
      setError("Please accept the terms to create your account.");
      return;
    }

    setLoading(true);

    try {
      const result = await api.registerCrm({
        full_name: signup.full_name,
        phone_number: signup.phone_number,
        email: signup.email,
        password: signup.password,
        domain: signup.domain,
        organization_type: signup.organization_type,
      });

      if (result.access_token || result.token) {
        onAuthSuccess();
      } else {
        setMode("login");

        setLogin({
          email: signup.email,
          password: "",
        });

        setError(
          "Account created. Login with your new credentials to continue."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                   Login                                  */
  /* ------------------------------------------------------------------------ */

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await api.loginCrm(login.email, login.password);

      if (rememberMe) {
        localStorage.setItem(
          "CHAIBYTES_CRM_REMEMBER_ME",
          "true"
        );
      } else {
        localStorage.removeItem(
          "CHAIBYTES_CRM_REMEMBER_ME"
        );
      }

      onAuthSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setTouchedConfirm(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  /* ------------------------------------------------------------------------ */
  /*                                  Render                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090806] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#C8430A]/[0.08] blur-[120px]" />

        <div className="absolute -bottom-52 right-[-100px] h-[600px] w-[600px] rounded-full bg-[#E8722A]/[0.10] blur-[150px]" />

        <div
          className="
            absolute inset-0 opacity-[0.025]
            [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)]
            [background-size:60px_60px]
          "
        />
      </div>

      <section className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
        <div
          className="
            grid w-full max-w-[1180px]
            overflow-hidden
            rounded-[28px]
            border border-white/[0.08]
            bg-[#0D0B08]/95
            shadow-[0_30px_100px_rgba(0,0,0,0.55)]
            backdrop-blur-xl
            lg:grid-cols-[1.05fr_0.95fr]
          "
        >
          {/* Form */}
          <AuthForm
            key={mode}
            mode={mode}
            signup={signup}
            setSignup={setSignup}
            login={login}
            setLogin={setLogin}
            loading={loading}
            error={error}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            termsAccepted={termsAccepted}
            setTermsAccepted={setTermsAccepted}
            passwordStrength={passwordStrength}
            passwordsMismatch={passwordsMismatch}
            passwordsMatch={passwordsMatch}
            onConfirmBlur={() => setTouchedConfirm(true)}
            onSubmit={isSignup ? handleSignup : handleLogin}
            onSwitch={() =>
              switchMode(isSignup ? "login" : "signup")
            }
          />

          {/* Product preview */}
          <ProductPanel mode={mode} />
        </div>
      </section>
    </main>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Form                                      */
/* -------------------------------------------------------------------------- */

interface AuthFormProps {
  mode: AuthMode;

  signup: SignupFormState;
  setSignup: React.Dispatch<
    React.SetStateAction<SignupFormState>
  >;

  login: LoginFormState;
  setLogin: React.Dispatch<
    React.SetStateAction<LoginFormState>
  >;

  loading: boolean;
  error: string;

  showPassword: boolean;
  setShowPassword: (value: boolean) => void;

  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;

  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;

  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;

  passwordStrength: {
    label: string;
    score: number;
  };

  passwordsMismatch: boolean;
  passwordsMatch: boolean;

  onConfirmBlur: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onSwitch: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
  mode,

  signup,
  setSignup,

  login,
  setLogin,

  loading,
  error,

  showPassword,
  setShowPassword,

  showConfirmPassword,
  setShowConfirmPassword,

  rememberMe,
  setRememberMe,

  termsAccepted,
  setTermsAccepted,

  passwordStrength,
  passwordsMismatch,
  passwordsMatch,

  onConfirmBlur,
  onSubmit,
  onSwitch,
}) => {
  const isSignup = mode === "signup";

  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      firstFieldRef.current?.focus();
    }, 150);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-[680px] flex-col px-6 py-7 sm:px-10 sm:py-9 lg:px-14 lg:py-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-5">
        <ChaibytesLogo />

        <span
          className="
            rounded-full border border-white/[0.08]
            bg-white/[0.035]
            px-3 py-1.5
            text-[10px] font-semibold
            uppercase tracking-[0.16em]
            text-white/40
          "
        >
          Admin
        </span>
      </div>

      {/* Main form container */}
      <div className="flex flex-1 items-center">
        <form
          onSubmit={onSubmit}
          noValidate
          className="mx-auto w-full max-w-[440px] py-8"
        >
          {/* Heading */}
          <div className="mb-7">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#E8722A]" />

              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8722A]">
                {isSignup
                  ? "Create workspace"
                  : "Welcome back"}
              </span>
            </div>

            <h1 className="text-[32px] font-semibold tracking-[-0.035em] text-white sm:text-[36px]">
              {isSignup
                ? "Create your account"
                : "Sign in to Chaibytes"}
            </h1>

            <p className="mt-3 max-w-[390px] text-sm leading-6 text-white/45">
              {isSignup
                ? "Set up your workspace to manage your website, leads, content and communication."
                : "Access your workspace and continue managing your digital presence."}
            </p>
          </div>

          {/* Error / success */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className={`mb-5 rounded-xl border px-4 py-3 text-xs leading-5 ${
                error.includes("created")
                  ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
                  : "border-red-500/20 bg-red-500/[0.08] text-red-300"
              }`}
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isSignup ? (
              <>
                {/* Full name */}
                <AuthInput
                  id="signup-full-name"
                  label="Full name"
                  icon={User}
                  inputRef={firstFieldRef}
                  value={signup.full_name}
                  onChange={(value) =>
                    setSignup((prev) => ({
                      ...prev,
                      full_name: value,
                    }))
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />

                {/* Email */}
                <AuthInput
                  id="signup-email"
                  label="Work email"
                  icon={Mail}
                  type="email"
                  value={signup.email}
                  onChange={(value) =>
                    setSignup((prev) => ({
                      ...prev,
                      email: value,
                    }))
                  }
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />

                {/* Phone + Domain */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <AuthInput
                    id="signup-phone"
                    label="Phone number"
                    icon={Users}
                    type="tel"
                    inputMode="tel"
                    value={signup.phone_number}
                    onChange={(value) =>
                      setSignup((prev) => ({
                        ...prev,
                        phone_number: value,
                      }))
                    }
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    required
                  />

                  <AuthInput
                    id="signup-domain"
                    label="Website"
                    icon={Globe2}
                    value={signup.domain}
                    onChange={(value) =>
                      setSignup((prev) => ({
                        ...prev,
                        domain: value,
                      }))
                    }
                    placeholder="yourstudio.com"
                    required
                  />
                </div>

                {/* Organization */}
                <div className="space-y-2">
                  <label
                    htmlFor="signup-org-type"
                    className="block text-[12px] font-medium text-white/55"
                  >
                    Organization type
                  </label>

                  <div
                    className="
                      relative flex h-12 items-center
                      rounded-xl
                      border border-white/[0.08]
                      bg-white/[0.025]
                      px-3.5
                      transition-all duration-200
                      hover:border-white/[0.14]
                      focus-within:border-[#E8722A]/60
                      focus-within:bg-white/[0.04]
                      focus-within:ring-4
                      focus-within:ring-[#E8722A]/[0.06]
                    "
                  >
                    <Users className="mr-3 h-[18px] w-[18px] shrink-0 text-white/30" />

                    <select
                      id="signup-org-type"
                      value={signup.organization_type}
                      onChange={(event) =>
                        setSignup((prev) => ({
                          ...prev,
                          organization_type:
                            event.target.value,
                        }))
                      }
                      className="
                        h-full w-full
                        appearance-none
                        bg-transparent
                        pr-8
                        text-sm text-white/80
                        outline-none
                      "
                    >
                      <option
                        className="bg-[#15110D]"
                        value="therapist"
                      >
                        Therapist
                      </option>

                      <option
                        className="bg-[#15110D]"
                        value="service_business"
                      >
                        Service business
                      </option>

                      <option
                        className="bg-[#15110D]"
                        value="coach"
                      >
                        Coach
                      </option>

                      <option
                        className="bg-[#15110D]"
                        value="clinic"
                      >
                        Clinic
                      </option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-white/30" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <AuthInput
                    id="signup-password"
                    label="Password"
                    icon={Lock}
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={signup.password}
                    onChange={(value) =>
                      setSignup((prev) => ({
                        ...prev,
                        password: value,
                      }))
                    }
                    placeholder="Create a secure password"
                    autoComplete="new-password"
                    required
                    trailing={
                      <PasswordToggle
                        visible={showPassword}
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                      />
                    }
                  />

                  {/* Password strength */}
                  {signup.password.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-3 px-0.5">
                      <div className="flex flex-1 gap-1">
                        {[1, 2, 3, 4].map((item) => (
                          <div
                            key={item}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              item <=
                              Math.max(
                                passwordStrength.score,
                                1
                              )
                                ? strengthStyles[
                                    passwordStrength.score
                                  ]
                                : "bg-white/[0.07]"
                            }`}
                          />
                        ))}
                      </div>

                      <span className="min-w-[42px] text-right text-[10px] font-medium text-white/35">
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <AuthInput
                  id="signup-confirm-password"
                  label="Confirm password"
                  icon={Lock}
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={signup.confirmPassword}
                  onChange={(value) =>
                    setSignup((prev) => ({
                      ...prev,
                      confirmPassword: value,
                    }))
                  }
                  onBlur={onConfirmBlur}
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  required
                  trailing={
                    <PasswordToggle
                      visible={showConfirmPassword}
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                    />
                  }
                  error={
                    passwordsMismatch
                      ? "Passwords don't match"
                      : undefined
                  }
                  helperText={
                    passwordsMatch
                      ? "Passwords match"
                      : undefined
                  }
                />

                {/* Terms */}
                <label
                  htmlFor="signup-terms"
                  className="flex cursor-pointer items-start gap-3 pt-1 text-[11px] leading-5 text-white/40"
                >
                  <input
                    id="signup-terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) =>
                      setTermsAccepted(
                        event.target.checked
                      )
                    }
                    required
                    className="
                      mt-0.5 h-4 w-4
                      shrink-0
                      rounded
                      border-white/20
                      bg-white/5
                      accent-[#E8722A]
                    "
                  />

                  <span>
                    I agree to the{" "}
                    <span className="font-medium text-white/65 hover:text-[#E8722A]">
                      Terms of Service
                    </span>{" "}
                    and{" "}
                    <span className="font-medium text-white/65 hover:text-[#E8722A]">
                      Privacy Policy
                    </span>
                    .
                  </span>
                </label>
              </>
            ) : (
              <>
                {/* Login email */}
                <AuthInput
                  id="login-email"
                  label="Email address"
                  icon={Mail}
                  type="email"
                  inputRef={firstFieldRef}
                  value={login.email}
                  onChange={(value) =>
                    setLogin((prev) => ({
                      ...prev,
                      email: value,
                    }))
                  }
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />

                {/* Login password */}
                <AuthInput
                  id="login-password"
                  label="Password"
                  icon={Lock}
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={login.password}
                  onChange={(value) =>
                    setLogin((prev) => ({
                      ...prev,
                      password: value,
                    }))
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  trailing={
                    <PasswordToggle
                      visible={showPassword}
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                    />
                  }
                />

                {/* Remember / Forgot */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label
                    htmlFor="login-remember"
                    className="flex cursor-pointer items-center gap-2.5 text-white/45"
                  >
                    <input
                      id="login-remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) =>
                        setRememberMe(
                          event.target.checked
                        )
                      }
                      className="
                        h-4 w-4 rounded
                        border-white/20
                        bg-white/5
                        accent-[#E8722A]
                      "
                    />

                    Remember me
                  </label>

                  <button
                    type="button"
                    disabled
                    title="Password reset is coming soon"
                    className="font-medium text-white/25 cursor-not-allowed"
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="
              group mt-6
              flex h-12 w-full
              items-center justify-center gap-2
              rounded-xl
              bg-[#E8722A]
              text-sm font-semibold
              text-[#170B04]
              shadow-[0_8px_30px_rgba(232,114,42,0.16)]
              transition-all duration-200
              hover:bg-[#F07D32]
              hover:shadow-[0_10px_35px_rgba(232,114,42,0.25)]
              active:scale-[0.99]
              disabled:pointer-events-none
              disabled:opacity-60
            "
          >
            {loading ? (
              <>
                <span
                  className="
                    h-4 w-4 animate-spin
                    rounded-full
                    border-2 border-black/20
                    border-t-black/70
                  "
                />

                Please wait...
              </>
            ) : (
              <>
                {isSignup
                  ? "Create account"
                  : "Sign in"}

                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </button>

          {/* Switch auth mode */}
          <div className="mt-6 text-center text-xs text-white/35">
            {isSignup
              ? "Already have an account?"
              : "New to Chaibytes?"}

            <button
              type="button"
              onClick={onSwitch}
              className="
                ml-2
                font-semibold
                text-[#E8722A]
                transition-colors
                hover:text-[#F58B45]
                focus:outline-none
              "
            >
              {isSignup
                ? "Sign in"
                : "Create an account"}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.05] pt-5 text-[10px] text-white/20">
        <span>© 2026 Chaibytes</span>

        <span>Brew. Code. Connect.</span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Auth Input                                  */
/* -------------------------------------------------------------------------- */

const AuthInput: React.FC<AuthInputProps> = ({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  required,
  trailing,
  inputRef,
  error,
  helperText,
}) => {
  const messageId = `${id}-message`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-[12px] font-medium text-white/55"
      >
        {label}
      </label>

      <div
        className={`
          relative flex h-12 items-center
          rounded-xl
          border
          bg-white/[0.025]
          px-3.5
          transition-all duration-200

          ${
            error
              ? `
                border-red-500/50
                focus-within:border-red-500/70
                focus-within:ring-4
                focus-within:ring-red-500/[0.06]
              `
              : `
                border-white/[0.08]
                hover:border-white/[0.14]
                focus-within:border-[#E8722A]/60
                focus-within:bg-white/[0.04]
                focus-within:ring-4
                focus-within:ring-[#E8722A]/[0.06]
              `
          }
        `}
      >
        <Icon className="mr-3 h-[18px] w-[18px] shrink-0 text-white/30" />

        <input
          id={id}
          name={id}
          ref={inputRef}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error || helperText
              ? messageId
              : undefined
          }
          className="
            min-w-0
            flex-1
            bg-transparent
            text-sm
            text-white/85
            outline-none
            placeholder:text-white/20
          "
        />

        {trailing}
      </div>

      {(error || helperText) && (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={`px-1 text-[10px] ${
            error
              ? "text-red-400"
              : "text-emerald-400"
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                             Password Toggle                                */
/* -------------------------------------------------------------------------- */

const PasswordToggle: React.FC<{
  visible: boolean;
  onClick: () => void;
}> = ({ visible, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        visible
          ? "Hide password"
          : "Show password"
      }
      aria-pressed={visible}
      className="
        ml-2 flex h-8 w-8
        items-center justify-center
        rounded-lg
        text-white/30
        transition-colors
        hover:bg-white/[0.05]
        hover:text-white/70
        focus:outline-none
      "
    >
      {visible ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Chaibytes Logo                                */
/* -------------------------------------------------------------------------- */

const ChaibytesLogo = () => {
  return (
    <div className="flex items-center gap-3">
      <div
        className="
          relative flex h-10 w-10
          items-center justify-center
          rounded-xl
          border border-[#E8722A]/30
          bg-[#E8722A]/[0.08]
        "
      >
        <Coffee className="h-5 w-5 text-[#E8722A]" />

        <Code2 className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded bg-[#0D0B08] text-white" />
      </div>

      <div>
        <div className="text-[21px] font-bold leading-none tracking-[-0.04em]">
          <span className="text-[#E8722A]">
            chai
          </span>
          <span className="text-white">
            bytes
          </span>
        </div>

        <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.2em] text-white/25">
          Brew. Code. Connect.
        </p>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Product Panel                                 */
/* -------------------------------------------------------------------------- */

const ProductPanel: React.FC<{
  mode: AuthMode;
}> = ({ mode }) => {
  const isSignup = mode === "signup";

  return (
    <aside
      className="
        relative hidden
        overflow-hidden
        border-l border-white/[0.07]
        bg-[#110C08]
        lg:flex
        lg:min-h-[680px]
      "
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#E8722A]/[0.16] blur-[110px]" />

        <div className="absolute -bottom-40 left-0 h-[450px] w-[450px] rounded-full bg-[#C8430A]/[0.12] blur-[130px]" />

        <div
          className="
            absolute inset-0 opacity-[0.035]
            [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)]
            [background-size:40px_40px]
          "
        />
      </div>

      <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-12">
        {/* Top */}
        <div>
          <div
            className="
              inline-flex items-center gap-2
              rounded-full
              border border-[#E8722A]/20
              bg-[#E8722A]/[0.07]
              px-3 py-1.5
              text-[10px] font-semibold
              uppercase tracking-[0.15em]
              text-[#E8722A]
            "
          >
            <Sparkles className="h-3 w-3" />

            Chaibytes Admin
          </div>

          <h2 className="mt-7 max-w-[430px] text-[38px] font-semibold leading-[1.12] tracking-[-0.04em] text-white">
            {isSignup ? (
              <>
                Your business.
                <br />
                <span className="text-[#E8722A]">
                  One workspace.
                </span>
              </>
            ) : (
              <>
                Everything where
                <br />
                <span className="text-[#E8722A]">
                  you left it.
                </span>
              </>
            )}
          </h2>

          <p className="mt-4 max-w-[390px] text-sm leading-6 text-white/40">
            {isSignup
              ? "Manage your websites, leads, campaigns and content without jumping between multiple tools."
              : "Your websites, leads, campaigns and content are ready when you are."}
          </p>
        </div>

        {/* Dashboard preview */}
        <DashboardPreview />

        {/* Features */}
        <div className="grid grid-cols-4 gap-2">
          <MiniFeature
            icon={Globe2}
            label="Websites"
          />

          <MiniFeature
            icon={Users}
            label="Leads"
          />

          <MiniFeature
            icon={Send}
            label="Email"
          />

          <MiniFeature
            icon={FileText}
            label="Content"
          />
        </div>
      </div>
    </aside>
  );
};

/* -------------------------------------------------------------------------- */
/*                           Dashboard Preview                                */
/* -------------------------------------------------------------------------- */

const DashboardPreview = () => {
  return (
    <div className="my-9">
      <div
        className="
          overflow-hidden
          rounded-[20px]
          border border-white/[0.08]
          bg-[#0B0907]/90
          shadow-[0_30px_80px_rgba(0,0,0,0.4)]
          backdrop-blur-xl
        "
      >
        {/* Dashboard header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8722A]/10">
              <LayoutDashboard className="h-3.5 w-3.5 text-[#E8722A]" />
            </div>

            <div>
              <p className="text-[10px] font-medium text-white/75">
                Overview
              </p>

              <p className="text-[8px] text-white/25">
                Your workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="text-[8px] text-white/30">
              Live
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.05] border-b border-white/[0.06]">
          <DashboardStat
            label="Total leads"
            value="24"
            icon={Users}
            change="+12%"
          />

          <DashboardStat
            label="Campaigns"
            value="06"
            icon={Send}
            change="+3"
          />

          <DashboardStat
            label="Published"
            value="12"
            icon={FileText}
            change="+4"
          />
        </div>

        {/* Activity */}
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-medium text-white/60">
              Recent activity
            </p>

            <span className="text-[8px] text-[#E8722A]">
              View all
            </span>
          </div>

          <div className="space-y-3">
            <ActivityItem
              icon={User}
              title="New lead received"
              description="Website enquiry"
              time="2m"
            />

            <ActivityItem
              icon={Send}
              title="Campaign delivered"
              description="September Newsletter"
              time="18m"
            />

            <ActivityItem
              icon={FileText}
              title="Blog published"
              description="5 ways to manage anxiety"
              time="1h"
            />
          </div>
        </div>
      </div>

      {/* Floating card */}
      <div
        className="
          relative
          -mt-4 ml-auto mr-[-12px]
          flex w-[180px]
          items-center gap-3
          rounded-xl
          border border-white/[0.08]
          bg-[#16100B]
          px-4 py-3
          shadow-xl
        "
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        </div>

        <div>
          <p className="text-[9px] text-white/30">
            This month
          </p>

          <p className="text-xs font-semibold text-white/80">
            +18.4% growth
          </p>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                            Dashboard Stat                                  */
/* -------------------------------------------------------------------------- */

const DashboardStat: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  change: string;
}> = ({
  label,
  value,
  icon: Icon,
  change,
}) => {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <Icon className="h-3.5 w-3.5 text-white/25" />

        <span className="text-[8px] font-medium text-emerald-400">
          {change}
        </span>
      </div>

      <p className="text-xl font-semibold tracking-[-0.03em] text-white/90">
        {value}
      </p>

      <p className="mt-1 text-[8px] text-white/30">
        {label}
      </p>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Activity                                      */
/* -------------------------------------------------------------------------- */

const ActivityItem: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  time: string;
}> = ({
  icon: Icon,
  title,
  description,
  time,
}) => {
  return (
    <div className="flex items-center gap-3">
      <div
        className="
          flex h-8 w-8 shrink-0
          items-center justify-center
          rounded-lg
          border border-white/[0.05]
          bg-white/[0.025]
        "
      >
        <Icon className="h-3.5 w-3.5 text-[#E8722A]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[9px] font-medium text-white/65">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[8px] text-white/25">
          {description}
        </p>
      </div>

      <span className="text-[8px] text-white/20">
        {time}
      </span>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Mini Feature                                  */
/* -------------------------------------------------------------------------- */

const MiniFeature: React.FC<{
  icon: React.ElementType;
  label: string;
}> = ({
  icon: Icon,
  label,
}) => {
  return (
    <div
      className="
        group
        flex flex-col items-center justify-center
        gap-2
        rounded-xl
        border border-white/[0.06]
        bg-white/[0.02]
        px-2 py-3
        transition-all duration-200
        hover:border-[#E8722A]/20
        hover:bg-[#E8722A]/[0.04]
      "
    >
      <Icon className="h-4 w-4 text-white/25 transition-colors group-hover:text-[#E8722A]" />

      <span className="text-[8px] font-medium text-white/30 transition-colors group-hover:text-white/60">
        {label}
      </span>
    </div>
  );
};