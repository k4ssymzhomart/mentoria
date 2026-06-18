// Deterministic personalization helpers (no AI — that's Phase 5). The interest
// vector is the union of profile interests (directions) and subjects, both slugs
// from the same tag dictionary, which is exactly why Phase 1 modeled them as arrays.

import type { Profile, Tag } from '@/lib/data/types';
import { tl } from '@/lib/data/types';

export function interestVector(
  profile: Pick<Profile, 'interests' | 'subjects'> | null,
): string[] {
  if (!profile) return [];
  return [...new Set([...(profile.interests ?? []), ...(profile.subjects ?? [])])];
}

/**
 * Localized tag labels an item shares with the interest vector — the basis for
 * the plain-language "why". Returns [] when there's no overlap (caller hides it).
 */
export function overlapLabels(
  itemTags: string[],
  vector: string[],
  tagMap: Map<string, Tag>,
  locale: string,
  max = 2,
): string[] {
  const set = new Set(vector);
  return itemTags
    .filter((t) => set.has(t))
    .slice(0, max)
    .map((slug) => {
      const tag = tagMap.get(slug);
      return tag ? tl(tag.label, locale) : slug;
    });
}
