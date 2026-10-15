export type Rect = { top: number; left: number; width: number; height: number; bottom: number; right: number };
export type Viewport = { width: number; height: number; top: number; left: number };

export function placeTourCard(target: Rect, view: Viewport, cardHeight: number) {
  const margin = 12;
  if (view.width <= 640) {
    // Content-sized phone card: leave most of the page visible, with no fixed sheet height.
    const limit = Math.min(view.height - margin * 2, view.height * (view.height < 480 ? 0.65 : 0.44));
    const height = Math.min(cardHeight, limit);
    return { left: view.left + margin, top: view.top + view.height - height - margin, width: view.width - margin * 2, maxHeight: height };
  }
  const width = Math.min(360, view.width - margin * 2);
  const height = Math.min(cardHeight, view.height - margin * 2);
  const largeSection = target.width >= view.width * 0.65 || target.height >= view.height * 0.55;
  const left = largeSection ? view.left + (view.width - width) / 2 : Math.max(view.left + margin, Math.min(target.left, view.left + view.width - width - margin));
  const bottomEdge = view.top + view.height;
  let top: number;
  if (largeSection) top = view.top + (view.height - height) / 2;
  else if (bottomEdge - target.bottom - margin * 2 >= height) top = target.bottom + margin;
  else if (target.top - view.top - margin * 2 >= height) top = target.top - height - margin;
  else top = view.top + (view.height - height) / 2;
  const safeTop = Math.max(view.top + margin, Math.min(top, bottomEdge - height - margin));
  return { left, top: safeTop, width, maxHeight: bottomEdge - safeTop - margin };
}
