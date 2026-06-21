import React, { useState } from "react";
import { Eye, EyeOff, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { mockCustomer } from "@/portal/data/mockData";
import { PageHeader, ConfirmationModal } from "@/portal/components/PortalUI";
import { useNavigate } from "react-router-dom";
import { clearPortalAuth } from "@/lib/portalAuth";

const AccountSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [whatsappNotifs, setWhatsappNotifs] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1200);
  };

  const handleAccountExit = () => {
    clearPortalAuth();
    navigate("/login");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Account Settings"
        description="Manage your profile, security, and preferences"
      />

      <Tabs defaultValue="profile">
        <TabsList className="mb-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            {saved && (
              <Alert className="border-forest/30 bg-forest/5">
                <AlertDescription className="text-forest">
                  Profile updated successfully.
                </AlertDescription>
              </Alert>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-forest/15 flex items-center justify-center text-forest text-xl font-bold flex-shrink-0">
                {mockCustomer.avatarInitials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {mockCustomer.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Member since {mockCustomer.memberSince}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1.5 h-7 text-xs"
                >
                  Change photo
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" defaultValue={mockCustomer.name} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={mockCustomer.email}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  defaultValue={mockCustomer.phone}
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving}>
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

          {/* Danger Zone */}
          <div className="bg-card border border-destructive/30 rounded-2xl p-5 mt-4">
            <h3 className="font-semibold text-foreground mb-3">
              Account Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogoutOpen(true)}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setDeactivateOpen(true)}
              >
                Deactivate account
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground mb-2">
              Change Password
            </h3>
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  className="pr-10"
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
            <Button>Change Password</Button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h3 className="font-semibold text-foreground mb-1">
              Notification Preferences
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Choose how you'd like to receive updates about your orders and
              deliveries.
            </p>

            {[
              {
                id: "email",
                label: "Email notifications",
                desc: "Order confirmations, delivery updates, and account alerts",
                value: emailNotifs,
                set: setEmailNotifs,
              },
              {
                id: "sms",
                label: "SMS notifications",
                desc: "Delivery reminders and urgent account notifications",
                value: smsNotifs,
                set: setSmsNotifs,
              },
              {
                id: "whatsapp",
                label: "WhatsApp notifications",
                desc: "Coming soon — order and delivery updates via WhatsApp",
                value: whatsappNotifs,
                set: setWhatsappNotifs,
                disabled: true,
              },
              {
                id: "push",
                label: "Push notifications",
                desc: "Coming soon — in-app push notifications for the mobile app",
                value: pushNotifs,
                set: setPushNotifs,
                disabled: true,
              },
            ].map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {n.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch
                  checked={n.value}
                  onCheckedChange={n.set}
                  disabled={n.disabled}
                />
              </div>
            ))}

            <Separator />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ConfirmationModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Sign out?"
        description="You will be signed out of your account."
        confirmLabel="Sign out"
        onConfirm={handleAccountExit}
      />
      <ConfirmationModal
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate Account?"
        description="This will deactivate your account. You can reactivate by contacting support."
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={handleAccountExit}
      />
    </div>
  );
};

export default AccountSettingsPage;
