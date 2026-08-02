import React, { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/api/client";
import { PageHeader, ConfirmationModal } from "@/portal/components/PortalUI";
import { useNavigate } from "react-router-dom";
import { clearPortalAuth } from "@/lib/portalAuth";
import { portalAuthApi } from "@/api/portalAuth";
import { usePortalCustomer } from "@/portal/context/CustomerContext";
import { useTheme } from "@/portal/context/ThemeContext";

const AccountSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { customer, loading, updateCustomerProfile } = usePortalCustomer();
  const { setThemePreference } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [themePreference, setThemePreferenceState] = useState<"light" | "dark">(
    "light",
  );

  useEffect(() => {
    if (!customer) return;
    setFirstName(customer.firstName || "");
    setLastName(customer.lastName || "");
    setEmail(customer.email || "");
    setPhone(customer.phone || "");
    setThemePreferenceState(customer.themePreference || "light");
  }, [customer]);

  const pendingEmailChangeNotice = useMemo(() => {
    if (!customer?.pendingEmail) return null;
    return `Email change pending: confirm the link sent to ${customer.pendingEmail} to apply it.`;
  }, [customer]);

  const handleSave = async () => {
    setSaveError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setSaveError("First name and last name are required.");
      return;
    }

    if (!email.trim()) {
      setSaveError("Email address is required.");
      return;
    }

    setSaving(true);
    try {
      await updateCustomerProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        themePreference,
      });
      setThemePreference(themePreference);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      } else {
        setSaveError("Unable to save profile right now. Please try again.");
      }
      setSaving(false);
    }
  };

  const handleAccountExit = async () => {
    try {
      await portalAuthApi.logout();
    } catch {
      // Local state should still be cleared when server logout fails.
    }
    clearPortalAuth();
    navigate("/login");
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordChanged(false);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("Please complete all password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      await portalAuthApi.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      setPasswordChanged(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // Backend clears auth cookies after password change, so force re-login.
      clearPortalAuth();
      navigate("/login");
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordError(err.message);
      } else {
        setPasswordError(
          "Unable to change password right now. Please try again.",
        );
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Account Settings"
        description="Manage your profile and security"
      />

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {saved && (
          <Alert className="border-forest/30 bg-forest/5">
            <AlertDescription className="text-forest">
              Profile updated successfully.
            </AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert variant="destructive">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {pendingEmailChangeNotice && (
          <Alert>
            <AlertDescription>{pendingEmailChangeNotice}</AlertDescription>
          </Alert>
        )}

        <div>
          <h3 className="font-semibold text-foreground mb-3">Profile</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="themePreference">Theme preference</Label>
              <select
                id="themePreference"
                value={themePreference}
                onChange={(e) =>
                  setThemePreferenceState(e.target.value as "light" | "dark")
                }
                disabled={loading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="mt-4">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-foreground mb-2">
            Change Password
          </h3>

          {passwordChanged && (
            <Alert className="border-forest/30 bg-forest/5">
              <AlertDescription className="text-forest">
                Password changed successfully.
              </AlertDescription>
            </Alert>
          )}

          {passwordError && (
            <Alert variant="destructive">
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label>Current password</Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                className="pr-10"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowCurrent((v) => !v)}
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                placeholder="Create new password"
                className="pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Confirm new password</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat new password"
                className="pr-10"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword}>
            {changingPassword ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Changing…
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/30 rounded-2xl p-5 mt-4">
        <h3 className="font-semibold text-foreground mb-3">Account Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Modals */}
      <ConfirmationModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Sign out?"
        description="You will be signed out of your account."
        confirmLabel="Sign out"
        onConfirm={handleAccountExit}
      />
    </div>
  );
};

export default AccountSettingsPage;
