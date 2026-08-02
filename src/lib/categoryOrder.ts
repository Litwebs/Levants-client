const CATEGORY_PRIORITY = [
  ["milk unhomogenised", "unhomogenised milk", "unhomogenized milk", "whole milk", "milk"],
  ["milk semi skimmed", "semi skimmed milk", "semi-skimmed milk"],
  ["eggs", "egg"],
  ["cream"],
  ["butter"],
  ["milkshakes", "milkshake"],
  ["honey"],
  ["ghee"],
  ["cheese"],
  ["bakery", "bakary", "bread"],
  ["juices", "juice"],
] as const;

const normalizeCategory = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getCategoryPriority = (value: string) => {
  const normalized = normalizeCategory(value);
  const index = CATEGORY_PRIORITY.findIndex((aliases) =>
    aliases.some((alias) => alias === normalized),
  );
  return index === -1 ? CATEGORY_PRIORITY.length : index;
};

export const sortByStorefrontCategoryOrder = <T>(
  items: T[],
  getName: (item: T) => string,
) =>
  items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((a, b) => {
      const priorityDifference =
        getCategoryPriority(getName(a.item)) -
        getCategoryPriority(getName(b.item));

      return priorityDifference || a.originalIndex - b.originalIndex;
    })
    .map(({ item }) => item);
