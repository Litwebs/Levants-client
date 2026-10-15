import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CircleHelp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portalTours, type PortalTour, type TourStep } from "./definitions";
import { hasSeenTour, rememberTour, tourProgressKey } from "./progress";

type VisibleStep = TourStep & { element: HTMLElement };
type Snapshot = { id: string; root: HTMLElement; definition: PortalTour; steps: VisibleStep[] };
import { placeTourCard, type Rect, type Viewport } from "./position";
const TourContext = createContext<{ ready: boolean; start: () => void } | null>(null);

function visible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && !element.closest("[hidden]");
}

function snapshot(): Snapshot | null {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-tour-page][data-tour-ready="true"]')).filter(visible);
  // Dialogs are portalled after the page. Their own tour takes precedence.
  const root = roots.at(-1);
  const id = root?.dataset.tourPage;
  const definition = id ? portalTours[id] : null;
  if (!root || !id || !definition) return null;
  const steps = definition.steps.flatMap(step => {
    const element = step.target === "page" ? root : Array.from(root.querySelectorAll<HTMLElement>('[data-tour="' + step.target + '"]')).find(visible);
    return element ? [{ ...step, element }] : [];
  });
  return steps.length ? { root, id, definition, steps } : null;
}

function viewport(): Viewport {
  const visual = window.visualViewport;
  return { width: visual?.width || window.innerWidth, height: visual?.height || window.innerHeight, top: visual?.offsetTop || 0, left: visual?.offsetLeft || 0 };
}

export function PortalTourButton() {
  const tour = useContext(TourContext);
  if (!tour) return null;
  return <Button data-portal-tour-launcher type="button" variant="outline" size="sm" disabled={!tour.ready} onClick={tour.start}
    title={tour.ready ? "Replay the walkthrough for this page or form" : "The tour will be available when this page finishes loading"}>
    <CircleHelp className="h-4 w-4" aria-hidden="true" />Take a tour
  </Button>;
}

export function PortalTourProvider({ children, customerId, routeKey }: { children: React.ReactNode; customerId?: string; routeKey: string }) {
  const [model, setModel] = useState<Snapshot | null>(null);
  const modelRef = useRef<Snapshot | null>(null);
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const [current, setCurrent] = useState("");
  const currentRef = useRef("");
  const [geometry, setGeometry] = useState<{ rect: Rect; view: Viewport } | null>(null);
  const [cardHeight, setCardHeight] = useState(280);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const savedScroll = useRef({ top: 0, left: 0 });
  const savedParents = useRef<Array<{ element: HTMLElement; top: number; left: number }>>([]);

  const select = useCallback((target: string) => { currentRef.current = target; setCurrent(target); }, []);
  const scan = useCallback(() => {
    const next = snapshot(), previous = modelRef.current;
    if (next?.root === previous?.root && next?.id === previous?.id &&
      next?.steps.length === previous?.steps.length && next?.steps.every((step, i) => step.element === previous?.steps[i].element && step.target === previous.steps[i].target)) return next;
    if (next?.root !== previous?.root || next?.id !== previous?.id) {
      openRef.current = false; setOpen(false);
    } else if (next && openRef.current && !next.steps.some(step => step.target === currentRef.current)) {
      const oldIndex = next.definition.steps.findIndex(step => step.target === currentRef.current);
      select((next.steps.find(step => next.definition.steps.findIndex(original => original.target === step.target) > oldIndex) || next.steps.at(-1))!.target);
    }
    modelRef.current = next; setModel(next);
    return next;
  }, [select]);

  useLayoutEffect(() => {
    openRef.current = false; setOpen(false);
    scan();
    const observer = new MutationObserver(records => {
      if (records.every(record => record.target instanceof Element && record.target.closest("[data-portal-tour-ui]"))) return;
      scan();
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-tour-page", "data-tour-ready", "data-tour", "hidden", "style", "class"] });
    window.addEventListener("resize", scan);
    return () => { observer.disconnect(); window.removeEventListener("resize", scan); };
  }, [routeKey, customerId, scan]);

  const begin = useCallback((next: Snapshot) => {
    returnFocus.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
      ? document.activeElement : Array.from(document.querySelectorAll<HTMLElement>("[data-portal-tour-launcher]")).filter(visible).at(-1) || null;
    savedScroll.current = { top: window.scrollY, left: window.scrollX };
    savedParents.current = [];
    for (let element: HTMLElement | null = next.root; element; element = element.parentElement) {
      savedParents.current.push({ element, top: element.scrollTop, left: element.scrollLeft });
    }
    select(next.steps[0].target); setGeometry(null); openRef.current = true; setOpen(true);
  }, [select]);
  const start = useCallback(() => { const next = scan(); if (next) begin(next); }, [begin, scan]);
  const key = customerId && model ? tourProgressKey(customerId, model.definition.group || model.id) : null;
  useEffect(() => {
    if (!model || !key || open || hasSeenTour(key)) return;
    // Let content/layout settle; never interrupt another account confirmation.
    const timer = window.setTimeout(() => {
      const activeDialog = document.querySelector('[role="alertdialog"], [role="dialog"][data-state="open"]');
      if (activeDialog && !activeDialog.contains(model.root)) return;
      begin(model);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [model, key, open, begin]);

  const close = useCallback(() => {
    if (key) rememberTour(key);
    openRef.current = false; setOpen(false);
    for (const saved of savedParents.current) {
      if (saved.element.isConnected) {
        saved.element.scrollTop = saved.top;
        saved.element.scrollLeft = saved.left;
      }
    }
    window.scrollTo({ ...savedScroll.current, behavior: "auto" });
  }, [key]);
  const index = model?.steps.findIndex(step => step.target === current) ?? -1;
  const active = model?.steps[index];

  useLayoutEffect(() => {
    if (!open || !active) return;
    const target = active.element;
    target.scrollIntoView?.({ block: "center", inline: "nearest", behavior: "auto" });
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = target.getBoundingClientRect(), view = viewport();
        const left = Math.max(view.left + 4, box.left - 5), top = Math.max(view.top + 4, box.top - 5);
        const right = Math.min(view.left + view.width - 4, box.right + 5), bottom = Math.min(view.top + view.height - 4, box.bottom + 5);
        setGeometry({ rect: { left, top, right, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }, view });
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure); window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, [open, active]);

  useLayoutEffect(() => {
    if (!open || !contentRef.current) return;
    const element = contentRef.current;
    const measure = () => setCardHeight(Math.max(element.scrollHeight + 2, element.getBoundingClientRect().height));
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [open]);

  const position = geometry ? placeTourCard(geometry.rect, geometry.view, cardHeight || 280) : { left: 12, top: 12, width: "calc(100% - 24px)", maxHeight: "calc(100dvh - 24px)" };
  const targetText = active?.readTarget ? (active.element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 1000) : "";
  return <TourContext.Provider value={{ ready: Boolean(model), start }}>
    {children}
    <Dialog.Root open={Boolean(open && active)} onOpenChange={value => { if (!value) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay data-portal-tour-ui className="fixed inset-0 z-[80] overflow-hidden" style={{ background: geometry ? "transparent" : "rgba(0,0,0,.65)" }}>
          {geometry && <div aria-hidden="true" data-tour-highlight className="pointer-events-none fixed rounded-xl border-2 border-emerald-400" style={{ left: geometry.rect.left, top: geometry.rect.top, width: geometry.rect.width, height: geometry.rect.height, boxShadow: "0 0 0 9999px rgba(0,0,0,.65)" }} />}
        </Dialog.Overlay>
        <Dialog.Content ref={contentRef} data-portal-tour-ui className="fixed z-[81] overflow-y-auto rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl outline-none"
          style={position} onPointerDownOutside={event => event.preventDefault()}
          onOpenAutoFocus={event => { event.preventDefault(); titleRef.current?.focus({ preventScroll: true }); }}
          onCloseAutoFocus={event => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true }); }}>
          <button type="button" onClick={close} className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Skip tour"><X className="h-4 w-4" /></button>
          <p className="mb-2 pr-8 text-xs font-medium text-muted-foreground">{model?.definition.title}</p>
          <Dialog.Title ref={titleRef} tabIndex={-1} className="pr-6 font-heading text-lg font-semibold outline-none">{active?.title}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">{active?.description}</Dialog.Description>
          {targetText && <p className="mt-3 rounded-lg bg-muted p-3 text-xs leading-relaxed">{targetText}</p>}
          <p role="status" aria-live="polite" aria-atomic="true" className="mt-4 text-xs text-muted-foreground">Step {index + 1} of {model?.steps.length}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={close}>Skip</Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={() => model && select(model.steps[index - 1].target)}>Back</Button>
              <Button type="button" size="sm" onClick={() => {
                if (!model || index === model.steps.length - 1) close();
                else select(model.steps[index + 1].target);
              }}>{model && index === model.steps.length - 1 ? "Finish" : "Next"}</Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </TourContext.Provider>;
}
