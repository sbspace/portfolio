import { useCallback, useEffect, useRef, useState } from 'react';
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
  Trash2,
  Plus,
  NotebookPen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MemoEntry } from '@/types';
import { formatMemoDate } from '@/utils/memos';
import { isMemoImageSource, prepareMemoImage } from '@/utils/memoImages';
import { checkMemoImageCapacity } from '@/services/storage';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/Button';

interface Props {
  memos: MemoEntry[];
  onAdd: () => string;
  onUpdate: (id: string, patch: { title?: string; content?: string }) => void;
  onDelete: (id: string) => void;
}

export function MemoPage({ memos, onAdd, onUpdate, onDelete }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = memos.find((memo) => memo.id === selectedId) ?? memos[0];
  const titleRef = useRef<HTMLInputElement>(null);
  const focusNewTitle = useRef(false);

  useEffect(() => {
    if (focusNewTitle.current && selected) {
      titleRef.current?.focus();
      focusNewTitle.current = false;
    }
  }, [selected?.id]);

  const handleAdd = () => {
    focusNewTitle.current = true;
    setSelectedId(onAdd());
  };
  const updateContent = useCallback((content: string) => {
    if (selected) onUpdate(selected.id, { content });
  }, [selected?.id, onUpdate]);
  const handleDelete = () => {
    if (!selected || !window.confirm(`“${selected.title.trim() || '제목 없는 메모'}”를 삭제할까요? 제목과 내용이 삭제되며 되돌릴 수 없습니다.`)) return;
    const index = memos.findIndex((memo) => memo.id === selected.id);
    setSelectedId(memos[index + 1]?.id ?? memos[index - 1]?.id ?? null);
    onDelete(selected.id);
  };

  return (
    <div>
      <PageHeader title="메모" description="계획과 생각을 자유롭게 기록하세요. 제목과 내용은 자동으로 저장됩니다."
        action={<Button onClick={handleAdd}><Plus size={16} />메모 추가</Button>} />
      {memos.length === 0 ? (
        <SectionCard>
          <div className="py-12 text-center">
            <NotebookPen size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-700">아직 메모가 없습니다</p>
            <p className="mt-1 mb-5 text-sm text-slate-500">새 메모를 만들어 자유롭게 작성해 보세요.</p>
            <Button onClick={handleAdd}><Plus size={16} />첫 메모 작성</Button>
          </div>
        </SectionCard>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <SectionCard noPadding>
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              저장된 메모 <span className="ml-1 text-slate-400">{memos.length}</span>
            </div>
            <div className="max-h-60 overflow-y-auto p-2 lg:max-h-[70vh]" aria-label="저장된 메모">
              {memos.map((memo) => (
                <button key={memo.id} type="button" onClick={() => setSelectedId(memo.id)}
                  aria-pressed={selected?.id === memo.id}
                  className={`mb-1 block w-full rounded-lg px-3 py-3 text-left transition-colors ${selected?.id === memo.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <span className="block break-words text-sm font-medium">{memo.title.trim() || '제목 없는 메모'}</span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {memo.updatedAt ? '수정' : '작성'} {formatMemoDate(memo.updatedAt ?? memo.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>
          {selected && (
            <div className="min-w-0">
              <SectionCard className="mb-4">
                <div className="flex items-start gap-3">
                  <label className="min-w-0 flex-1 text-xs font-medium text-slate-500">
                    메모 제목
                    <input ref={titleRef} type="text" aria-label="메모 제목" value={selected.title}
                      placeholder="제목을 입력하세요"
                      onChange={(event) => onUpdate(selected.id, { title: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-800 outline-none focus:border-indigo-400" />
                  </label>
                  <Button variant="danger" size="sm" onClick={handleDelete} className="mt-5 flex-shrink-0">
                    <Trash2 size={16} />삭제
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>작성: {formatMemoDate(selected.createdAt)}</span>
                  <span>최근 수정: {formatMemoDate(selected.updatedAt)}</span>
                </div>
              </SectionCard>
              <MemoEditor key={selected.id} memo={selected.content} onUpdate={updateContent} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const RICH_TEXT_PREFIX = '<!-- portfolio-rich-text -->';
const ALLOWED_TAGS = new Set([
  'B', 'BR', 'DIV', 'EM', 'FONT', 'I', 'LI', 'OL', 'P', 'S', 'SPAN', 'STRIKE', 'STRONG', 'U', 'UL',
  'IMG',
]);

function escapePlainText(value: string): string {
  const container = document.createElement('div');
  container.textContent = value;
  return container.innerHTML.replace(/\r?\n/g, '<br>');
}

function sanitizeMemoHtml(value: string): string {
  const parsed = new DOMParser().parseFromString(value, 'text/html');

  parsed.body.querySelectorAll('*').forEach((element) => {
    if (element.tagName === 'IMG' && !isMemoImageSource(element.getAttribute('src') ?? '')) {
      element.remove();
      return;
    }
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const attributeValue = attribute.value.trim();
      const validFontSize = element.tagName === 'FONT' && name === 'size' && /^[1-7]$/.test(attributeValue);
      const validImageAttribute = element.tagName === 'IMG' && (name === 'src' || name === 'alt');
      const validFontColor = element.tagName === 'FONT' && name === 'color' && /^#[0-9a-f]{6}$/i.test(attributeValue);
      const validAlignment =
        (element.tagName === 'DIV' || element.tagName === 'P') &&
        name === 'style' &&
        /^text-align:\s*(left|center|right|justify);?$/i.test(attributeValue);

      if (!validFontSize && !validFontColor && !validAlignment && !validImageAttribute) {
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

function MemoEditor({ memo, onUpdate }: { memo: string; onUpdate: (content: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const pastingRef = useRef(false);
  const [pastingImage, setPastingImage] = useState(false);
  const [pasteError, setPasteError] = useState('');

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

  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (pastingRef.current) return;
    setPasteError('');
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    if (!files.length) {
      document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
      persistContent();
      return;
    }
    const editor = editorRef.current;
    if (!editor) return;
    const before = editor.innerHTML;
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
    pastingRef.current = true;
    setPastingImage(true);
    try {
      if (files.length > 4) throw new Error('이미지는 한 번에 4장까지 붙여넣을 수 있습니다.');
      const images: string[] = [];
      for (const file of files) images.push(await prepareMemoImage(file));
      // Do not insert into another memo or overwrite edits made while decoding.
      if (editorRef.current !== editor || !editor.isConnected) return;
      if (editor.innerHTML !== before) throw new Error('메모 내용이 변경되었습니다. 원하는 위치에 다시 붙여넣어 주세요.');
      const html = images.map((src) => `<img src="${src}" alt="붙여넣은 이미지"><br>`).join('');
      checkMemoImageCapacity(html);
      editor.focus();
      const target = window.getSelection();
      const insertion = range && editor.contains(range.commonAncestorContainer) ? range : document.createRange();
      if (insertion !== range) {
        insertion.selectNodeContents(editor);
        insertion.collapse(false);
      }
      target?.removeAllRanges();
      target?.addRange(insertion);
      if (!document.execCommand('insertHTML', false, html)) throw new Error('이미지를 붙여넣지 못했습니다. 다시 시도해 주세요.');
      persistContent();
    } catch (error) {
      if (editorRef.current === editor && editor.isConnected) {
        setPasteError(error instanceof Error ? error.message : '이미지를 읽지 못했습니다. 다시 캡처해 주세요.');
      }
    } finally {
      pastingRef.current = false;
      if (editorRef.current === editor && editor.isConnected) setPastingImage(false);
    }
  };

  return (
    <div>
      <SectionCard noPadding>
        <p className="px-4 pt-3 text-xs text-slate-400">캡처 이미지를 복사한 뒤 본문에서 Ctrl+V로 붙여넣을 수 있습니다.</p>
        {pastingImage && <p role="status" className="px-4 pt-2 text-xs text-indigo-600">이미지 처리 중…</p>}
        {pasteError && <p role="alert" className="px-4 pt-2 text-xs text-rose-600">{pasteError}</p>}
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
          className="min-h-[60vh] w-full overflow-y-auto p-5 text-sm leading-7 text-slate-700 outline-none empty:before:pointer-events-none empty:before:text-slate-300 empty:before:content-[attr(data-placeholder)] focus:ring-2 focus:ring-inset focus:ring-indigo-500 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
        />
      </SectionCard>
    </div>
  );
}
