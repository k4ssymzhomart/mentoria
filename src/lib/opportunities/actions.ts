'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/data/provider';
import { getAuthUserId } from '@/lib/auth';

export type ActionResult = { ok: true } | { ok: false; reason: 'auth' | 'error' };

function revalidateCatalog() {
  revalidatePath('/[locale]/opportunities', 'page');
  revalidatePath('/[locale]/opportunities/[id]', 'page');
}

export async function saveOpportunityAction(opportunityId: string): Promise<ActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'auth' };
  try {
    await db.saveOpportunity(userId, opportunityId);
    revalidateCatalog();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function unsaveOpportunityAction(opportunityId: string): Promise<ActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'auth' };
  try {
    await db.unsaveOpportunity(userId, opportunityId);
    revalidateCatalog();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function setAppliedAction(opportunityId: string): Promise<ActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'auth' };
  try {
    await db.setOpportunityStatus(userId, opportunityId, 'applied');
    revalidateCatalog();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
