import type { Localized } from '@/lib/data/types';

export type AssistantContextKind = 'chat' | 'explain' | 'ask' | 'roadmap';

export interface AssistantContext {
  kind: AssistantContextKind;
  itemType?: 'opportunity' | 'course';
  itemId?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** A validated, real catalog item the assistant can surface as a clickable card. */
export interface RefItem {
  id: string;
  kind: 'opportunity' | 'course';
  title: Localized;
  label: string;
  href: string;
  grade: number;
}

/** One item in an AI-drafted roadmap preview (always a real, validated item). */
export interface DraftItem {
  kind: 'course' | 'opportunity';
  ref_id: string;
  title: Localized;
  label: string;
  grade: number;
  rationale: string;
}

/** Request body to the assistant endpoint. */
export interface AssistantRequest {
  locale: string;
  messages: ChatMessage[];
  context: AssistantContext;
}
