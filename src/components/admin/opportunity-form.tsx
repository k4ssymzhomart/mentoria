'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveOpportunityAction } from '@/lib/admin/actions';
import { tl } from '@/lib/data/types';
import type { Opportunity, OpportunityFormat, OpportunityType, Tag } from '@/lib/data/types';
import { AdminForm } from './form-shell';
import { LocalizedField } from './localized-field';

const types: OpportunityType[] = [
  'olympiad',
  'hackathon',
  'scholarship',
  'internship',
  'summer_school',
  'research',
  'volunteering',
  'competition',
  'conference',
];
const formats: OpportunityFormat[] = ['online', 'offline', 'hybrid'];

export function OpportunityForm({ opportunity, tags }: { opportunity?: Opportunity | null; tags: Tag[] }) {
  const t = useTranslations('admin');
  const to = useTranslations('opportunities');
  const locale = useLocale();
  const selected = new Set(opportunity?.tags ?? []);
  const grouped = {
    direction: tags.filter((tag) => tag.kind === 'direction'),
    subject: tags.filter((tag) => tag.kind === 'subject'),
  };

  return (
    <AdminForm action={saveOpportunityAction}>
      {opportunity?.id ? <input type="hidden" name="id" value={opportunity.id} /> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <LocalizedField name="title" label={t('fields.title')} value={opportunity?.title} />
        <LocalizedField name="summary" label={t('fields.summary')} value={opportunity?.summary} />
      </div>
      <LocalizedField name="description" label={t('fields.description')} value={opportunity?.description} multiline rows={5} />
      <LocalizedField name="requirements" label={t('fields.requirements')} value={opportunity?.requirements} multiline rows={4} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="opp-type">{t('fields.type')}</Label>
          <select id="opp-type" name="type" defaultValue={opportunity?.type ?? 'olympiad'} className="h-8 w-full rounded-lg border bg-background px-2 text-sm">
            {types.map((type) => (
              <option key={type} value={type}>
                {to(`types.${type}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="opp-format">{t('fields.format')}</Label>
          <select id="opp-format" name="format" defaultValue={opportunity?.format ?? 'online'} className="h-8 w-full rounded-lg border bg-background px-2 text-sm">
            {formats.map((format) => (
              <option key={format} value={format}>
                {to(`formats.${format}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="grade-min">{t('fields.gradeMin')}</Label>
          <Input id="grade-min" name="grade_min" type="number" min={1} max={12} defaultValue={opportunity?.grade_min ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="grade-max">{t('fields.gradeMax')}</Label>
          <Input id="grade-max" name="grade_max" type="number" min={1} max={12} defaultValue={opportunity?.grade_max ?? ''} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="deadline">{t('fields.deadline')}</Label>
          <Input id="deadline" name="deadline" type="date" defaultValue={opportunity?.deadline ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organizer">{t('fields.organizer')}</Label>
          <Input id="organizer" name="organizer" defaultValue={opportunity?.organizer ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">{t('fields.location')}</Label>
          <Input id="location" name="location" defaultValue={opportunity?.location ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apply-url">{t('fields.applyUrl')}</Label>
          <Input id="apply-url" name="apply_url" type="url" defaultValue={opportunity?.apply_url ?? ''} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image-url">{t('fields.imageUrl')}</Label>
        <Input id="image-url" name="image_url" type="url" defaultValue={opportunity?.image_url ?? ''} />
      </div>

      <fieldset className="space-y-3 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">{t('fields.tags')}</legend>
        {(['direction', 'subject'] as const).map((kind) => (
          <div key={kind} className="space-y-2">
            <p className="text-xs text-muted-foreground">{t(`tagKind.${kind}`)}</p>
            <div className="flex flex-wrap gap-2">
              {grouped[kind].map((tag) => (
                <label key={tag.slug} className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
                  <input type="checkbox" name="tags" value={tag.slug} defaultChecked={selected.has(tag.slug)} />
                  {tl(tag.label, locale)}
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={opportunity?.featured ?? false} />
          {t('fields.featured')}
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={opportunity?.is_published ?? false} />
          {t('fields.published')}
        </label>
      </div>
    </AdminForm>
  );
}
