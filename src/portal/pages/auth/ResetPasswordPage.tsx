import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/api/client";
import { portalAuthApi } from "@/api/portalAuth";
import { useBusinessInfo } from "@/context/BusinessInfoContext";

const ResetPasswordPage: React.FC = () => {
  const businessInfo = useBusinessInfo();
  const [searchParams] = useSearchParams();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const token = (searchParams.get("token") || "").trim();
    if (!token) {
      setError("Reset token is missing. Please use the link from your email.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please complete both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await portalAuthApi.resetPassword({
        token,
        password: newPassword,
        confirmPassword,
      });

      setLoading(false);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to reset password right now. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
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

        <div className="bg-card border border-border rounded-2xl p-8 shadow-md">
          {!done ? (
            <>
              <div className="mb-6">
                <h2 className="font-heading text-2xl font-semibold text-foreground">
                  Set new password
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      placeholder="Create a new password"
                      autoComplete="new-password"
                      className="pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNew((v) => !v)}
                      tabIndex={-1}
                    >
                      {showNew ? (
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
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your new password"
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Set New Password"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-forest/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-forest" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                Password updated
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your password has been successfully reset. You can now sign in
                with your new password.
              </p>
              <Button asChild className="w-full">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
