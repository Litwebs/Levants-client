import { useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Check, Mail, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Input, Select, Textarea } from "@/components/common/FormControls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Category = "Foundations" | "Forms" | "Actions" | "Display" | "Surfaces";

type Entry = {
  id: string;
  title: string;
  category: Category;
  description: string;
  component: () => JSX.Element;
};

function StoryFrame({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-background p-5 sm:p-7">{children}</div>;
}

function InputStory() {
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("Email address");
  const [type, setType] = useState("email");
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [disabled, setDisabled] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showIcon, setShowIcon] = useState(true);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
      <StoryFrame>
        <div className="max-w-md space-y-5">
          <Input
            label={label || undefined}
            type={type}
            size={size}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="name@example.com"
            hint="Used for order and account updates."
            error={showError ? "Enter a valid email address." : undefined}
            leftIcon={showIcon ? <Mail /> : undefined}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">The input uses native attributes, a linked label, and an accessible hint or error.</p>
        </div>
      </StoryFrame>
      <div className="space-y-3 text-sm">
        <Input label="Label" value={label} onChange={(event) => setLabel(event.target.value)} size="sm" />
        <Select label="Type" value={type} onChange={setType} options={["text", "email", "password", "search"].map((item) => ({ value: item, label: item }))} />
        <Select label="Size" value={size} onChange={(next) => setSize(next as typeof size)} options={["sm", "md", "lg"].map((item) => ({ value: item, label: item }))} />
        <label className="flex items-center gap-2"><Checkbox checked={showIcon} onCheckedChange={(next) => setShowIcon(next === true)} /> Leading icon</label>
        <label className="flex items-center gap-2"><Checkbox checked={showError} onCheckedChange={(next) => setShowError(next === true)} /> Error</label>
        <label className="flex items-center gap-2"><Checkbox checked={disabled} onCheckedChange={(next) => setDisabled(next === true)} /> Disabled</label>
      </div>
    </div>
  );
}

function SelectStory() {
  const [value, setValue] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [showError, setShowError] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
      <StoryFrame>
        <div className="max-w-md">
          <Select
            label="Delivery day"
            value={value}
            onChange={setValue}
            placeholder="Choose a day"
            options={[{ value: "sunday", label: "Sunday" }, { value: "wednesday", label: "Wednesday" }]}
            hint="Choose the day that suits you."
            error={showError ? "Select a delivery day." : undefined}
            disabled={disabled}
          />
        </div>
      </StoryFrame>
      <div className="space-y-3 text-sm">
        <Select label="Value" value={value} onChange={setValue} options={[{ value: "", label: "None" }, { value: "sunday", label: "Sunday" }, { value: "wednesday", label: "Wednesday" }]} />
        <label className="flex items-center gap-2"><Checkbox checked={showError} onCheckedChange={(next) => setShowError(next === true)} /> Error</label>
        <label className="flex items-center gap-2"><Checkbox checked={disabled} onCheckedChange={(next) => setDisabled(next === true)} /> Disabled</label>
      </div>
    </div>
  );
}

function TextareaStory() {
  const [value, setValue] = useState("");
  const [showError, setShowError] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
      <StoryFrame>
        <div className="max-w-md">
          <Textarea
            label="Delivery instructions"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="For example, leave by the side gate"
            hint="Optional. Add anything that helps us find you."
            error={showError ? "Please shorten these instructions." : undefined}
            rows={4}
          />
        </div>
      </StoryFrame>
      <div className="space-y-3 text-sm">
        <label className="flex items-center gap-2"><Checkbox checked={showError} onCheckedChange={(next) => setShowError(next === true)} /> Error</label>
        <p className="text-muted-foreground">Textarea uses the same border, radius, label, focus, and validation rules as Input.</p>
      </div>
    </div>
  );
}

function SelectionStory() {
  const [checked, setChecked] = useState(true);
  const [enabled, setEnabled] = useState(false);
  return (
    <StoryFrame>
      <div className="flex flex-wrap gap-x-10 gap-y-5">
        <label className="flex items-center gap-3 text-sm font-medium"><Checkbox checked={checked} onCheckedChange={(next) => setChecked(next === true)} /> Send me updates</label>
        <label className="flex items-center gap-3 text-sm font-medium"><Switch checked={enabled} onCheckedChange={setEnabled} /> Weekly delivery</label>
      </div>
    </StoryFrame>
  );
}

function ButtonStory() {
  const [loading, setLoading] = useState(false);
  return (
    <StoryFrame>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => { setLoading(true); window.setTimeout(() => setLoading(false), 1000); }} disabled={loading}>{loading ? "Working…" : "Primary action"}</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button><Button>Default</Button><Button size="lg">Large</Button>
      </div>
    </StoryFrame>
  );
}

function DisplayStory() {
  return (
    <StoryFrame>
      <div className="flex flex-wrap gap-3"><Badge>Fresh</Badge><Badge variant="secondary">Scheduled</Badge><Badge variant="outline">Pending</Badge><Badge variant="destructive">Attention</Badge></div>
      <div className="mt-7 max-w-xs space-y-3"><Skeleton className="h-24 w-full rounded-lg" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-2/3" /></div>
    </StoryFrame>
  );
}

function SurfaceStory() {
  return (
    <StoryFrame>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Fresh delivery</CardTitle><CardDescription>Shared card surface and type styles.</CardDescription></CardHeader><CardContent className="text-sm">Order once or set a weekly schedule.</CardContent></Card>
        <div className="space-y-4"><Alert><Check className="size-4" /><AlertTitle>Ready to go</AlertTitle><AlertDescription>Your order is ready for delivery.</AlertDescription></Alert><Alert variant="destructive"><AlertCircle className="size-4" /><AlertTitle>Needs attention</AlertTitle><AlertDescription>Check the details and try again.</AlertDescription></Alert></div>
      </div>
    </StoryFrame>
  );
}

function TabsStory() {
  return (
    <StoryFrame>
      <Tabs defaultValue="one" className="max-w-md"><TabsList><TabsTrigger value="one">One-time order</TabsTrigger><TabsTrigger value="weekly">Weekly delivery</TabsTrigger></TabsList><TabsContent value="one" className="pt-3 text-sm">Choose products for your next delivery.</TabsContent><TabsContent value="weekly" className="pt-3 text-sm">Build a flexible weekly subscription.</TabsContent></Tabs>
    </StoryFrame>
  );
}

const entries: Entry[] = [
  { id: "input", title: "Input", category: "Forms", description: "Labeled text entry with size, icons, hints, errors, and native input behavior.", component: InputStory },
  { id: "select", title: "Select", category: "Forms", description: "Native select with the same field treatment and value-based change callback.", component: SelectStory },
  { id: "textarea", title: "Textarea", category: "Forms", description: "Multiline field with shared labels, hints, errors, and focus state.", component: TextareaStory },
  { id: "selection", title: "Checkbox & Switch", category: "Forms", description: "Real storefront selection controls and checked states.", component: SelectionStory },
  { id: "buttons", title: "Buttons", category: "Actions", description: "Action variants, sizes, loading, and disabled state.", component: ButtonStory },
  { id: "badges", title: "Badges & Skeletons", category: "Display", description: "Compact status treatments and loading placeholders.", component: DisplayStory },
  { id: "surfaces", title: "Cards & Alerts", category: "Surfaces", description: "Composable content and feedback surfaces.", component: SurfaceStory },
  { id: "tabs", title: "Tabs", category: "Surfaces", description: "Keyboard-accessible Radix tab navigation.", component: TabsStory },
];

const categories: Category[] = ["Foundations", "Forms", "Actions", "Display", "Surfaces"];

function Foundations() {
  const colors = [
    { name: "Primary", value: "--primary" },
    { name: "Accent", value: "--accent" },
    { name: "Gold", value: "--gold" },
    { name: "Background", value: "--background" },
    { name: "Card", value: "--card" },
    { name: "Destructive", value: "--destructive" },
  ];
  return (
    <section id="foundations" className="scroll-mt-8 space-y-5">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Foundations</p><h2 className="mt-1 font-heading text-3xl font-semibold">Storefront tokens</h2><p className="mt-2 text-sm text-muted-foreground">Live values from the storefront theme. The field surface reads these same tokens.</p></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{colors.map((color) => <div key={color.name} className="overflow-hidden rounded-xl border border-border bg-card"><div className="h-20" style={{ backgroundColor: `hsl(var(${color.value}))` }} /><div className="p-3"><p className="text-sm font-medium">{color.name}</p><code className="text-[11px] text-muted-foreground">{color.value}</code></div></div>)}</div>
    </section>
  );
}

export default function ComponentCatalogPage() {
  const [query, setQuery] = useState("");
  const visibleEntries = useMemo(() => entries.filter((entry) => `${entry.title} ${entry.category} ${entry.description}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  const showFoundations = !query || "foundations tokens colours colors".includes(query.trim().toLowerCase());

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card"><div className="container-custom py-8 sm:py-10"><Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Back to storefront</Link><div className="mt-6 flex flex-wrap items-start justify-between gap-6"><div><div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary"><Sparkles className="size-4" /> Levants component lab</div><h1 className="mt-2 font-heading text-4xl font-semibold sm:text-5xl">Storefront components</h1><p className="mt-3 max-w-2xl text-muted-foreground">An adaptation of the server repo's component catalog, using the real storefront controls. Change the props to inspect live states.</p></div><Badge variant="secondary" className="self-start">Development preview</Badge></div></div></div>
      <div className="container-custom grid gap-8 py-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
        <aside className="lg:sticky lg:top-5 lg:self-start"><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search components" className="form-control pl-10" placeholder="Search components" value={query} onChange={(event) => setQuery(event.target.value)} /></div><nav aria-label="Catalog sections" className="mt-5 flex flex-wrap gap-2 lg:flex-col">{categories.map((category) => <a key={category} href={`#${category.toLowerCase()}`} className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">{category}</a>)}</nav></aside>
        <div className="min-w-0 space-y-12">
          {showFoundations && <Foundations />}
          {categories.filter((category) => category !== "Foundations").map((category) => {
            const items = visibleEntries.filter((entry) => entry.category === category);
            if (!items.length) return null;
            return <section key={category} id={category.toLowerCase()} className="scroll-mt-8 space-y-5"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{category}</p><h2 className="mt-1 font-heading text-3xl font-semibold">{category === "Forms" ? "Form controls" : category}</h2></div>{items.map((entry) => <article key={entry.id} id={entry.id} className="scroll-mt-8 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7"><div className="mb-5"><h3 className="font-heading text-2xl font-semibold">{entry.title}</h3><p className="mt-1 text-sm text-muted-foreground">{entry.description}</p></div><entry.component /></article>)}</section>;
          })}
          {!showFoundations && visibleEntries.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No components match “{query}”.</div>}
        </div>
      </div>
    </main>
  );
}
