import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/api/client";
import { portalAuthApi } from "@/api/portalAuth";
import { setPortalLoggedIn } from "@/lib/portalAuth";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const redirectParam = searchParams.get("redirect");
  const redirectTarget =
    typeof redirectParam === "string" && redirectParam.startsWith("/")
      ? redirectParam
      : "/";
  const registerLink = `/register?redirect=${encodeURIComponent(
    redirectTarget,
  )}`;

  const normalizedEmail = email.trim().toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await portalAuthApi.login({
        email: normalizedEmail,
        password,
      });

      setPortalLoggedIn(true);
      navigate(redirectTarget);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as
          | { data?: { requiresEmailVerification?: boolean } }
          | undefined;
        if (body?.data?.requiresEmailVerification) {
          setRequiresVerification(true);
        }
        setError(err.message);
      } else {
        setError("Unable to sign in right now. Please try again.");
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
      await portalAuthApi.login({ email: normalizedEmail, password });
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
    if (!normalizedEmail) {
      setError("Please enter your email first.");
      return;
    }

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
          <Link to="/" className="inline-block">
            <h1 className="font-heading text-3xl font-bold text-forest">
              Levants Dairy
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
              {requiresVerification ? "Verify your email" : "Welcome back"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {requiresVerification
                ? "Enter the 6-digit code sent to your email to complete sign in."
                : "Sign in to manage your orders and subscriptions"}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={requiresVerification ? handleVerifyCode : handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={requiresVerification}
              />
            </div>

            {!requiresVerification ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-forest hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
              </div>
            ) : (
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
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || verificationLoading}
            >
              {loading || verificationLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {requiresVerification ? "Verifying…" : "Signing in…"}
                </>
              ) : requiresVerification ? (
                "Verify Email"
              ) : (
                "Sign In"
              )}
            </Button>

            {requiresVerification && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendCode}
                disabled={resendLoading}
              >
                {resendLoading ? "Resending…" : "Resend Code"}
              </Button>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to={registerLink}
              className="text-forest font-medium hover:underline"
            >
              Create account
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in you agree to our{" "}
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

export default LoginPage;
