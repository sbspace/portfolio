import { Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';

interface Props {
  memo: string;
  onUpdate: (memo: string) => void;
}

export function MemoPage({ memo, onUpdate }: Props) {
  return (
    <div>
      <PageHeader
        title="메모"
        description="자유롭게 메모를 작성해 보세요. 입력한 내용은 자동으로 저장됩니다."
        action={(
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 md:mt-1">
            <Check size={14} strokeWidth={2.5} />
            자동 저장됨
          </span>
        )}
      />

      <SectionCard noPadding>
        <textarea
          value={memo}
          onChange={(event) => onUpdate(event.target.value)}
          placeholder="메모를 입력하세요..."
          aria-label="메모 내용"
          spellCheck={false}
          className="block min-h-[60vh] w-full resize-y rounded-xl bg-transparent p-5 text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        />
      </SectionCard>
    </div>
  );
}
