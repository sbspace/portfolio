import { useState, useEffect } from 'react';
import { get, set, del } from 'idb-keyval';

const IDB_KEY = 'portfolio_history_dir_handle';

// File System Access API 권한 관련 타입 (TS DOM lib에 아직 미포함)
interface FileSystemHandleWithPermission extends FileSystemDirectoryHandle {
  queryPermission(desc: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission(desc: { mode: 'readwrite' }): Promise<PermissionState>;
}

declare global {
  interface Window {
    showDirectoryPicker?: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemHandleWithPermission>;
  }
}

function isApiSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

export interface HistoryFolder {
  folderName: string | null;
  isSupported: boolean;
  pickFolder: () => Promise<boolean>;
  clearFolder: () => Promise<void>;
  saveToFolder: (filename: string, content: Blob | string, mimeType?: string) => Promise<boolean>;
}

export function useHistoryFolder(): HistoryFolder {
  const [handle, setHandle] = useState<FileSystemHandleWithPermission | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiSupported()) return;
    get<FileSystemHandleWithPermission>(IDB_KEY).then(async (h) => {
      if (!h) return;
      try {
        const perm = await h.queryPermission({ mode: 'readwrite' });
        setHandle(h);
        setFolderName(h.name + (perm !== 'granted' ? ' (재승인 필요)' : ''));
      } catch {
        await del(IDB_KEY);
      }
    });
  }, []);

  const pickFolder = async (): Promise<boolean> => {
    if (!isApiSupported() || !window.showDirectoryPicker) return false;
    try {
      const h = await window.showDirectoryPicker({ mode: 'readwrite' });
      await set(IDB_KEY, h);
      setHandle(h);
      setFolderName(h.name);
      return true;
    } catch {
      return false;
    }
  };

  const clearFolder = async (): Promise<void> => {
    await del(IDB_KEY);
    setHandle(null);
    setFolderName(null);
  };

  const saveToFolder = async (
    filename: string,
    content: Blob | string,
    mimeType = 'text/csv;charset=utf-8;'
  ): Promise<boolean> => {
    if (!handle) return false;
    try {
      const perm = await handle.requestPermission({ mode: 'readwrite' });
      if (perm !== 'granted') return false;
      const blob =
        typeof content === 'string'
          ? new Blob([content], { type: mimeType })
          : content;
      const fileHandle = await handle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (e) {
      console.error('[useHistoryFolder] saveToFolder 실패:', e);
      return false;
    }
  };

  return { folderName, isSupported: isApiSupported(), pickFolder, clearFolder, saveToFolder };
}
