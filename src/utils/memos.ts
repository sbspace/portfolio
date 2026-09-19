import type { AppState, MemoEntry } from '@/types';

// An existing array, including an empty one, means migration already happened.
export function migrateMemos(raw: Partial<AppState>): MemoEntry[] {
  if (Array.isArray(raw.memos)) return raw.memos;
  const titles = raw.memoTitles ?? {};
  const entries: MemoEntry[] = Object.entries(raw.datedMemos ?? {})
    .filter(([date, content]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && typeof content === 'string')
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, content]) => ({
      id: `dated-${date}`,
      title: typeof titles[date] === 'string' ? titles[date] : '',
      content,
      createdAt: date,
      updatedAt: null,
    }));
  if (raw.memo || titles.legacy) {
    entries.push({
      id: 'legacy',
      title: typeof titles.legacy === 'string' ? titles.legacy : '',
      content: typeof raw.memo === 'string' ? raw.memo : '',
      createdAt: null,
      updatedAt: null,
    });
  }
  return entries;
}

export function formatMemoDate(value: string | null): string {
  if (!value) return '기록 없음';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.replace(/-/g, '.');
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '기록 없음' : date.toLocaleString('ko-KR');
}
