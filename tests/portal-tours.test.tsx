import { afterEach, expect, test, vi } from "vitest";
import { hasSeenTour, rememberTour, tourProgressKey } from "@/portal/tours/progress";
import { placeTourCard } from "@/portal/tours/position";
import { portalTours } from "@/portal/tours/definitions";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

test("tour history is isolated by customer, page and content version", () => {
  const key = tourProgressKey("customer-a", "dashboard");
  expect(hasSeenTour(key)).toBe(false);
  rememberTour(key);
  expect(hasSeenTour(key)).toBe(true);
  expect(localStorage.getItem(key)).toBe("seen");
  expect(hasSeenTour(tourProgressKey("customer-b", "dashboard"))).toBe(false);
  expect(hasSeenTour(tourProgressKey("customer-a", "orders"))).toBe(false);
  expect(key).toContain(":v1:");
});

test("blocked browser storage still remembers dismissed tours for the session", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  const key = tourProgressKey("private-browser", "payments");
  expect(hasSeenTour(key)).toBe(false);
  expect(() => rememberTour(key)).not.toThrow();
  expect(hasSeenTour(key)).toBe(true);
});

for (const width of [320, 390, 768, 1440]) {
  test(`tour card stays within a ${width}px viewport with zoom/keyboard offsets`, () => {
    for (const height of [240, 600, 1000]) for (const offset of [0, 70]) {
      const view = { width, height, left: offset, top: offset };
      for (const top of [-100, 0, height / 2, height + 100]) {
        const position = placeTourCard({ top, bottom: top + 50, left: width - 20, right: width + 50, width: 70, height: 50 }, view, 320);
        expect(position.left).toBeGreaterThanOrEqual(offset + 12);
        expect(position.left + position.width).toBeLessThanOrEqual(offset + width - 12);
        expect(position.top).toBeGreaterThanOrEqual(offset + 12);
        expect(position.top + position.maxHeight).toBeLessThanOrEqual(offset + height - 12);
        expect(position.top + Math.min(320, position.maxHeight)).toBeLessThanOrEqual(offset + height - 12);
      }
    }
  });
}

test("the builder shares visit history while every stage has its own replay content", () => {
  const stages = ["new-days", "new-frequency", "new-products", "new-address", "new-review"];
  expect(stages.every(id => portalTours[id].group === "new-subscription")).toBe(true);
  expect(new Set(stages.map(id => portalTours[id].title)).size).toBe(5);
});
test("delivery-only help respects existing subscription tour dismissal and explains every live state", () => {
  const tour = portalTours["delivery-reduction"];
  expect(tour.group).toBe("subscription-detail");
  expect(tour.steps.map(step => step.target)).toEqual(expect.arrayContaining([
    "reduction-deadline", "reduction-quantities", "reduction-preview", "reduction-review", "reduction-confirm",
    "reduction-pending", "reduction-check", "reduction-error", "reduction-reload", "reduction-success", "reduction-credit",
  ]));
  expect(tour.steps.find(step => step.target === "reduction-confirm")!.description).toContain("never confirm");
  expect(tour.steps.find(step => step.target === "reduction-check")!.description).toContain("same credit twice");
  expect(tour.steps.find(step => step.target === "reduction-review")!.description).toContain("not a card refund");
  expect(portalTours["subscription-detail"].steps.some(step => step.target === "delivery-reduction-history")).toBe(true);
});

test("every tour has unique explicit targets and task-specific accessible text", () => {
  for (const tour of Object.values(portalTours)) {
    expect(tour.steps.length).toBeGreaterThan(0);
    expect(new Set(tour.steps.map(step => step.target)).size).toBe(tour.steps.length);
    for (const step of tour.steps) {
      expect(step.title.length).toBeGreaterThan(5);
      expect(step.description.length).toBeGreaterThan(30);
    }
  }
});

test("phone cards size to content and occupy at most 40% of a portrait screen", () => {
  const view = { width: 320, height: 568, left: 0, top: 0 };
  const target = { top: 100, bottom: 144, left: 250, right: 294, width: 44, height: 44 };
  const position = placeTourCard(target, view, 600);
  expect(position.width).toBe(296);
  expect(position.maxHeight).toBeLessThanOrEqual(view.height * 0.4);
  expect(position.top + position.maxHeight).toBeCloseTo(556, 6);
  expect(placeTourCard(target, view, 180).maxHeight).toBe(180);
});

test("large desktop sections use a centred compact card", () => {
  const position = placeTourCard({ top: 20, bottom: 880, left: 200, right: 1400, width: 1200, height: 860 }, { width: 1440, height: 900, left: 0, top: 0 }, 220);
  expect(position.width).toBe(360);
  expect(position.left).toBe(540);
  expect(position.top).toBe(340);
});

test("wider phone and landscape cards remain narrow and centred", () => {
  const target = { top: 100, bottom: 144, left: 20, right: 64, width: 44, height: 44 };
  for (const width of [360, 390, 640]) {
    const position = placeTourCard(target, { width, height: 640, top: 0, left: 20 }, 600);
    expect(position.width).toBe(320);
    expect(position.left + position.width / 2).toBe(20 + width / 2);
    expect(position.maxHeight).toBeLessThanOrEqual(240);
  }
});
