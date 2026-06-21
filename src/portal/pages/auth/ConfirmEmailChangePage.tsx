import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/api/client";
import { portalAuthApi } from "@/api/portalAuth";

const ConfirmEmailChangePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("Confirming your new email...");

  useEffect(() => {
    const userId = (searchParams.get("userId") || "").trim();
    const token = (searchParams.get("token") || "").trim();

    if (!userId || !token) {
      setLoading(false);
      setSuccess(false);
      setMessage("This confirmation link is invalid.");
      return;
    }

    (async () => {
      try {
        const res = await portalAuthApi.confirmEmailChange({ userId, token });
        setSuccess(true);
        setMessage(res.message || "Email address updated successfully.");
      } catch (err) {
        setSuccess(false);
        if (err instanceof ApiError) {
          setMessage(err.message);
        } else {
          setMessage("Unable to confirm email change right now.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-md text-center">
        {loading ? (
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-forest" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <CheckCircle2 className="h-10 w-10 mx-auto text-forest" />
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Email Confirmed
            </h1>
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link to="/portal/account">Go to Account</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <XCircle className="h-10 w-10 mx-auto text-destructive" />
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Confirmation Failed
            </h1>
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="w-full">
              <Link to="/portal/account">Back to Account</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmailChangePage;
