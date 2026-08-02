import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/api/client";
import { portalAuthApi } from "@/api/portalAuth";
import { setPortalLoggedIn } from "@/lib/portalAuth";
import { useBusinessInfo } from "@/context/BusinessInfoContext";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const businessInfo = useBusinessInfo();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const inviteToken = (searchParams.get("invite") || "").trim();
  const redirectParam = searchParams.get("redirect");
  const defaultRedirectTarget = inviteToken ? "/portal/subscriptions/new" : "/";
  const redirectTarget =
    typeof redirectParam === "string" && redirectParam.startsWith("/")
      ? redirectParam
      : defaultRedirectTarget;
  const loginLink = `/login?redirect=${encodeURIComponent(redirectTarget)}`;

  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => {
    if (!inviteToken) return;

    let mounted = true;
    setInviteLoading(true);
    setError(null);

    portalAuthApi
      .getRegisterInvite(inviteToken)
      .then((res) => {
        if (!mounted) return;
        const invite = res?.data?.invite;
        if (!invite) {
          setError("This onboarding link is invalid or expired.");
          return;
        }
        setFirstName(invite.firstName || "");
        setLastName(invite.lastName || "");
        setEmail(invite.email || "");
        setPhone(invite.phone || "");
        if (invite.subscriptionDraft) {
          try {
            sessionStorage.setItem(
              "levants_subscription_draft",
              JSON.stringify(invite.subscriptionDraft),
            );
          } catch {
            // Continue onboarding even when browser storage is unavailable.
          }
        }
      })
      .catch((err) => {
        if (!mounted) return;
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("This onboarding link is invalid or expired.");
        }
      })
      .finally(() => {
        if (mounted) setInviteLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await portalAuthApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password,
        confirmPassword,
        ...(inviteToken ? { inviteToken } : {}),
      });

      setVerificationStep(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to create your account right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setVerificationLoading(true);
    try {
      await portalAuthApi.verifyEmailCode({
        email: normalizedEmail,
        code: verificationCode.trim(),
      });

      await portalAuthApi.login({
        email: normalizedEmail,
        password,
      });
      setPortalLoggedIn(true);
      navigate(redirectTarget);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to verify code right now. Please try again.");
      }
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setResendLoading(true);
    try {
      await portalAuthApi.resendEmailCode({ email: normalizedEmail });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to resend code right now. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center">
            <img
              src={businessInfo.logoUrl}
              alt={`${businessInfo.companyName} logo`}
              className="mb-3 h-14 w-14 rounded-full object-cover"
            />
            <h1 className="font-heading text-3xl font-bold text-forest">
              {businessInfo.companyName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Farm fresh, delivered to your door
            </p>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-md">
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              {verificationStep ? "Verify your email" : "Create your account"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {verificationStep
                ? "Enter the 6-digit code we sent to your email address."
                : `Join ${businessInfo.companyName} and manage your deliveries online`}
            </p>
            {inviteToken && !verificationStep && (
              <p className="text-xs text-forest mt-2">
                Admin onboarding: verify your email, then add payment details to
                activate your subscription.
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!verificationStep ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Sarah"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Mitchell"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={Boolean(inviteToken)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+44 7700 900000"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    className="pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className="pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || inviteLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              {inviteLoading && (
                <p className="text-xs text-muted-foreground text-center">
                  Validating onboarding link...
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="verificationCode">Verification code</Label>
                <Input
                  id="verificationCode"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={verificationLoading}
              >
                {verificationLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendCode}
                disabled={resendLoading}
              >
                {resendLoading ? "Resending…" : "Resend Code"}
              </Button>
            </form>
          )}

          {!verificationStep && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to={loginLink}
                className="text-forest font-medium hover:underline"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account you agree to our{" "}
          <Link to="/" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/" className="underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
