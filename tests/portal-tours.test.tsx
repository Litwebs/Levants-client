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
