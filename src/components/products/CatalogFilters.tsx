import { useId } from 'react';
import { CatalogCheckbox } from '@/components/common/CatalogCheckbox';
import { CatalogSelect } from '@/components/common/CatalogSelect';

const catalogSortOptions = [
  { value: 'featured', label: 'Category order' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
];
export function CatalogSortSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <CatalogSelect aria-label="Sort by" value={value} onChange={onChange} options={catalogSortOptions} />;
}
export function CategoryFilterOptions({ categories, selected, onToggle }: {
  categories: Array<{ slug: string; name: string }>;
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  const id = useId();
  return <div className="space-y-0.5">{categories.map(category => <label key={category.slug} htmlFor={`${id}-${category.slug}`} className="flex min-h-9 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:bg-secondary/70">
    <CatalogCheckbox id={`${id}-${category.slug}`} checked={selected.includes(category.slug)} onChange={() => onToggle(category.slug)} />
    <span className="min-w-0 break-words capitalize">{category.name}</span>
  </label>)}</div>;
}
