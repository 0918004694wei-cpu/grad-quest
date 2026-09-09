'use client';

import { useRef, useState } from 'react';
import { Download, FileJson, RotateCcw, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CURRENT_SCHEMA_VERSION } from '@/lib/study-storage';

type Status = { kind: 'success' | 'error'; message: string } | null;

export function DataManagement({ exportData, importData, clearData }: {
  exportData: () => string;
  importData: (raw: string) => void;
  clearData: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);

  const downloadBackup = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `grad-quest-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus({ kind: 'success', message: 'JSON 備份已匯出。' });
  };

  const restoreBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      importData(await file.text());
      setStatus({ kind: 'success', message: '備份已還原並寫入本機。' });
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : '無法匯入這份備份。' });
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clearAll = () => {
    clearData();
    setStatus({ kind: 'success', message: '本機資料已清除，並恢復初始課表。' });
  };

  return (
    <section className="panel page-panel data-management">
      <div className="data-heading">
        <div><span className="eyebrow">LOCAL DATA</span><h2>資料與備份</h2></div>
        <span className="schema-badge">SCHEMA v{CURRENT_SCHEMA_VERSION}</span>
      </div>
      <p className="data-note">所有進度只保存在這個瀏覽器。定期匯出 JSON，可在清除瀏覽器資料或更換裝置時還原。</p>
      <div className="data-actions">
        <button className="secondary" onClick={downloadBackup}><Download size={16}/>匯出 JSON</button>
        <button className="secondary" onClick={() => inputRef.current?.click()}><Upload size={16}/>從 JSON 匯入</button>
        <input ref={inputRef} className="file-input" type="file" accept="application/json,.json" onChange={event => void restoreBackup(event.target.files?.[0])}/>
      </div>
      {status && <div className={`data-status ${status.kind}`}><FileJson size={15}/>{status.message}</div>}
      <div className="danger-zone data-danger">
        <div><RotateCcw size={18}/><span><b>清除所有本機資料</b><small>刪除目前進度並回到 2026/09/08 的初始任務與課表。</small></span></div>
        <AlertDialog>
          <AlertDialogTrigger render={<button className="danger" />}>清除資料</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確定要清除所有本機資料？</AlertDialogTitle>
              <AlertDialogDescription>任務完成狀態、EXP、設定與自訂任務都會被刪除。建議先匯出 JSON 備份。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction className="danger" onClick={clearAll}>確定清除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
