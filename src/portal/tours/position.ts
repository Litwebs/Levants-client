export type Rect = { top: number; left: number; width: number; height: number; bottom: number; right: number };
export type Viewport = { width: number; height: number; top: number; left: number };

export function placeTourCard(target: Rect, view: Viewport, cardHeight: number) {
  const margin = 12;
  const width = Math.min(370, view.width - margin * 2);
  const height = Math.min(cardHeight, view.height - margin * 2);
  const left = Math.max(view.left + margin, Math.min(target.left, view.left + view.width - width - margin));
  const bottomEdge = view.top + view.height;
  let top: number;
  if (bottomEdge - target.bottom - margin * 2 >= height) top = target.bottom + margin;
  else if (target.top - view.top - margin * 2 >= height) top = target.top - height - margin;
  else top = target.top < view.top + view.height / 2 ? bottomEdge - height - margin : view.top + margin;
  const safeTop = Math.max(view.top + margin, Math.min(top, bottomEdge - height - margin));
  // Constrain the card immediately, even before a longer new step is measured.
  return { left, top: safeTop, width, maxHeight: bottomEdge - safeTop - margin };
}

