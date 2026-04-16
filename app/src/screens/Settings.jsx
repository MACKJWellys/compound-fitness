import { useRef, useState } from 'react';
import { exportAllData, importAllData } from '../data/storage';

export default function Settings() {
  const fileRef = useRef(null);
  const [status, setStatus] = useState(null);

  function handleExport() {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compound-fitness-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ type: 'ok', msg: 'Backup downloaded' });
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importAllData(reader.result);
        setStatus({ type: 'ok', msg: 'Data restored — reloading...' });
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        setStatus({ type: 'err', msg: err.message });
      }
    };
    reader.readAsText(file);
    // Reset so same file can be selected again
    e.target.value = '';
  }

  return (
    <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 24 }}>
        SETTINGS
      </div>

      {/* Data section */}
      <div style={{
        background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: 12, padding: 16, marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em', marginBottom: 14 }}>
          DATA
        </div>

        <button
          onClick={handleExport}
          style={{
            width: '100%', background: '#222', border: '1px solid #2a2a2a',
            borderRadius: 8, padding: '12px 16px', color: '#e8e8e8',
            fontSize: 13, fontFamily: 'var(--font)', fontWeight: 600,
            letterSpacing: '0.06em', cursor: 'pointer', marginBottom: 10,
            textAlign: 'left',
          }}
        >
          EXPORT BACKUP
          <div style={{ fontSize: 10, color: '#555', fontWeight: 400, marginTop: 4 }}>
            Download all workout data as JSON
          </div>
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: '100%', background: '#222', border: '1px solid #2a2a2a',
            borderRadius: 8, padding: '12px 16px', color: '#e8e8e8',
            fontSize: 13, fontFamily: 'var(--font)', fontWeight: 600,
            letterSpacing: '0.06em', cursor: 'pointer', textAlign: 'left',
          }}
        >
          IMPORT BACKUP
          <div style={{ fontSize: 10, color: '#555', fontWeight: 400, marginTop: 4 }}>
            Restore from a backup file (overwrites current data)
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>

      {status && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 16,
          background: status.type === 'ok' ? '#5BBD7218' : '#E8634A18',
          border: `1px solid ${status.type === 'ok' ? '#5BBD7244' : '#E8634A44'}`,
          color: status.type === 'ok' ? '#5BBD72' : '#E8634A',
          fontSize: 12,
        }}>
          {status.msg}
        </div>
      )}

      <div style={{ fontSize: 10, color: '#333', textAlign: 'center', marginTop: 24 }}>
        Compound Fitness v1.0
      </div>
    </div>
  );
}
