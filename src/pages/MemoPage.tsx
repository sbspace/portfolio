import { useCallback, useEffect, useRef } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';

interface Props {
  memo: string;
  onUpdate: (memo: string) => void;
}

const RICH_TEXT_PREFIX = '<!-- portfolio-rich-text -->';
const ALLOWED_TAGS = new Set([
  'B', 'BR', 'DIV', 'EM', 'FONT', 'I', 'LI', 'OL', 'P', 'S', 'SPAN', 'STRIKE', 'STRONG', 'U', 'UL',
]);

function escapePlainText(value: string): string {
  const container = document.createElement('div');
  container.textContent = value;
  return container.innerHTML.replace(/\r?\n/g, '<br>');
}

function sanitizeMemoHtml(value: string): string {
  const parsed = new DOMParser().parseFromString(value, 'text/html');

  parsed.body.querySelectorAll('*').forEach((element) => {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const attributeValue = attribute.value.trim();
      const validFontSize = element.tagName === 'FONT' && name === 'size' && /^[1-7]$/.test(attributeValue);
      const validFontColor = element.tagName === 'FONT' && name === 'color' && /^#[0-9a-f]{6}$/i.test(attributeValue);
      const validAlignment =
        (element.tagName === 'DIV' || element.tagName === 'P') &&
        name === 'style' &&
        /^text-align:\s*(left|center|right|justify);?$/i.test(attributeValue);

      if (!validFontSize && !validFontColor && !validAlignment) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return parsed.body.innerHTML;
}

function decodeMemo(value: string): string {
  if (value.startsWith(RICH_TEXT_PREFIX)) {
    return sanitizeMemoHtml(value.slice(RICH_TEXT_PREFIX.length));
  }
  return escapePlainText(value);
}

const TOOLBAR_BUTTONS: { command: string; label: string; Icon: LucideIcon }[] = [
  { command: 'bold', label: '굵게', Icon: Bold },
  { command: 'italic', label: '기울임', Icon: Italic },
  { command: 'underline', label: '밑줄', Icon: Underline },
  { command: 'strikeThrough', label: '취소선', Icon: Strikethrough },
  { command: 'insertUnorderedList', label: '글머리 기호', Icon: List },
  { command: 'insertOrderedList', label: '번호 매기기', Icon: ListOrdered },
  { command: 'justifyLeft', label: '왼쪽 정렬', Icon: AlignLeft },
  { command: 'justifyCenter', label: '가운데 정렬', Icon: AlignCenter },
  { command: 'justifyRight', label: '오른쪽 정렬', Icon: AlignRight },
];

export function MemoPage({ memo, onUpdate }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && document.activeElement !== editor) {
      editor.innerHTML = decodeMemo(memo);
    }
  }, [memo]);

  useEffect(() => {
    const rememberSelection = () => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (editor && selection?.rangeCount && editor.contains(selection.anchorNode)) {
        selectionRef.current = selection.getRangeAt(0).cloneRange();
      }
    };

    document.addEventListener('selectionchange', rememberSelection);
    return () => document.removeEventListener('selectionchange', rememberSelection);
  }, []);

  const persistContent = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const sanitized = sanitizeMemoHtml(editor.innerHTML);
    const textOnly = sanitized
      .replace(/<br\s*\/?>/gi, '')
      .replace(/<div><\/div>/gi, '')
      .replace(/&nbsp;/gi, '')
      .trim();
    onUpdate(textOnly ? `${RICH_TEXT_PREFIX}${sanitized}` : '');
  }, [onUpdate]);

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    if (selectionRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(selectionRef.current);
    }
  };

  const applyCommand = (command: string, value?: string) => {
    restoreSelection();
    document.execCommand(command, false, value);
    persistContent();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    persistContent();
  };

  return (
    <div>
      <PageHeader
        title="메모"
        description="자유롭게 작성하고 필요한 부분을 선택해 서식을 적용하세요. 내용은 자동으로 저장됩니다."
      />

      <SectionCard noPadding>
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/70 p-2.5">
          <select
            aria-label="글자 크기"
            title="글자 크기"
            defaultValue="3"
            onChange={(event) => applyCommand('fontSize', event.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-indigo-400"
          >
            <option value="2">작게</option>
            <option value="3">보통</option>
            <option value="4">크게</option>
            <option value="5">더 크게</option>
            <option value="6">매우 크게</option>
          </select>

          <label
            title="글자색"
            className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-sm font-bold text-slate-500 hover:bg-slate-200"
          >
            A
            <span className="absolute bottom-1.5 h-0.5 w-3 bg-current" />
            <input
              type="color"
              aria-label="글자색"
              defaultValue="#334155"
              onChange={(event) => applyCommand('foreColor', event.target.value)}
              className="sr-only"
            />
          </label>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          {TOOLBAR_BUTTONS.map(({ command, label, Icon }) => (
            <button
              key={command}
              type="button"
              title={label}
              aria-label={label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyCommand(command)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
            >
              <Icon size={16} />
            </button>
          ))}

          <span className="mx-1 h-5 w-px bg-slate-200" />

          <button
            type="button"
            title="서식 지우기"
            aria-label="서식 지우기"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand('removeFormat')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
          >
            <RemoveFormatting size={16} />
          </button>
          <button
            type="button"
            title="실행 취소"
            aria-label="실행 취소"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand('undo')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            title="다시 실행"
            aria-label="다시 실행"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand('redo')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
          >
            <Redo2 size={16} />
          </button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label="메모 내용"
          aria-multiline="true"
          data-placeholder="메모를 입력하세요..."
          onInput={persistContent}
          onPaste={handlePaste}
          className="min-h-[60vh] w-full overflow-y-auto p-5 text-sm leading-7 text-slate-700 outline-none empty:before:pointer-events-none empty:before:text-slate-300 empty:before:content-[attr(data-placeholder)] focus:ring-2 focus:ring-inset focus:ring-indigo-500 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
        />
      </SectionCard>
    </div>
  );
}
