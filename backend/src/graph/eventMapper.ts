import { CalendarEvent, GraphColumnMapping } from '../../../shared/types';
import { ListItemRecord } from './sharePointLists';

function stringField(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

function dateField(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function mapListItemsToEvents(
  items: ListItemRecord[],
  mapping: GraphColumnMapping
): CalendarEvent[] {
  const mapped = items.map((item) => ({
    id: item.id,
    title: stringField(item.fields[mapping.title]),
    start: dateField(item.fields[mapping.start]),
    end: dateField(item.fields[mapping.end]),
    location: stringField(item.fields[mapping.location]),
    description: stringField(item.fields[mapping.description]),
  }));

  return mapped
    .filter((event): event is typeof event & { title: string } => Boolean(event.title))
    .filter((event) => !event.end || new Date(event.end).getTime() >= Date.now())
    .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));
}
