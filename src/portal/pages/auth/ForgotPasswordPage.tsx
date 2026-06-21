import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/api/client";
import { portalAuthApi } from "@/api/portalAuth";

const ForgotPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await portalAuthApi.forgotPassword({ email: email.trim().toLowerCase() });
      setLoading(false);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to send reset email right now. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
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

        <div className="bg-card border border-border rounded-2xl p-8 shadow-md">
          {!sent ? (
            <>
              <div className="mb-6">
                <h2 className="font-heading text-2xl font-semibold text-foreground">
                  Reset your password
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-forest/10 mb-4">
                <Mail className="h-8 w-8 text-forest" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                Check your email
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                We've sent a password reset link to your email address. Please
                check your inbox (and spam folder).
              </p>
              <Alert className="text-left mb-4">
                <AlertDescription>
                  Didn't receive the email?{" "}
                  <button
                    className="text-forest font-medium hover:underline"
                    onClick={() => setSent(false)}
                  >
                    Try again
                  </button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
