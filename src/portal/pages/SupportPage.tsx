import React, { useState } from "react";
import {
  HeadphonesIcon,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  mockSupportRequests,
  mockFAQs,
  mockOrders,
  mockSubscriptions,
} from "@/portal/data/mockData";
import { SupportStatusBadge } from "@/portal/components/StatusBadges";
import { EmptyState, PageHeader } from "@/portal/components/PortalUI";

const FAQAccordion: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {mockFAQs.map((faq) => (
        <div
          key={faq.id}
          className="border border-border rounded-xl overflow-hidden"
        >
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
          >
            <span className="text-sm font-medium text-foreground">
              {faq.question}
            </span>
            {openId === faq.id ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
            )}
          </button>
          {openId === faq.id && (
            <div className="px-4 pb-3 text-sm text-muted-foreground border-t border-border bg-muted/20">
              <p className="pt-3">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const SupportPage: React.FC = () => {
  const [issueType, setIssueType] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const allRefs = [
    ...mockOrders.map((o) => ({
      value: o.orderNumber,
      label: `Order: ${o.orderNumber}`,
    })),
    ...mockSubscriptions.map((s) => ({
      value: s.id,
      label: `Subscription: ${s.name}`,
    })),
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Support"
        description="Get help with your orders, deliveries, and subscriptions"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Contact form + FAQ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Form */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-forest" />
              Contact Support
            </h3>
            {submitted ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-forest/10 mb-3">
                  <HeadphonesIcon className="h-7 w-7 text-forest" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">
                  Request submitted!
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Our team will review your request and get back to you soon.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSubmitted(false)}
                >
                  Submit another request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Issue type</Label>
                  <Select value={issueType} onValueChange={setIssueType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order">Order Issue</SelectItem>
                      <SelectItem value="delivery">Delivery Issue</SelectItem>
                      <SelectItem value="subscription">
                        Subscription Issue
                      </SelectItem>
                      <SelectItem value="payment">Payment Issue</SelectItem>
                      <SelectItem value="product">Product Quality</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Related order or subscription</Label>
                  <Select value={orderRef} onValueChange={setOrderRef}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reference (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {allRefs.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Describe your issue in detail…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Attachment (optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-4 text-center text-sm text-muted-foreground hover:border-forest/40 transition-colors cursor-pointer">
                    Click to upload or drag a file here
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Submit Support Request
                </Button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4">
              Frequently Asked Questions
            </h3>
            <FAQAccordion />
          </div>
        </div>

        {/* Right: My requests */}
        <div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4">My Requests</h3>
            {mockSupportRequests.length === 0 ? (
              <EmptyState
                icon={<HeadphonesIcon className="h-10 w-10" />}
                title="No requests yet"
                description="Submit a request to get help."
              />
            ) : (
              <div className="space-y-3">
                {mockSupportRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 border border-border rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {req.requestId}
                      </p>
                      <SupportStatusBadge status={req.status} />
                    </div>
                    <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                      {req.subject}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {req.date}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs w-full"
                    >
                      View details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
