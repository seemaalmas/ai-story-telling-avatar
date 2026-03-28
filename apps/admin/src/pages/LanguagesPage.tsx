import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';

const LANG_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi (हिन्दी)', ta: 'Tamil (தமிழ்)', te: 'Telugu (తెలుగు)',
  bn: 'Bengali (বাংলা)', mr: 'Marathi (मराठी)', kn: 'Kannada (ಕನ್ನಡ)',
  gu: 'Gujarati (ગુજરાતી)', ml: 'Malayalam (മലയാളം)', pa: 'Punjabi (ਪੰਜਾਬੀ)',
};

export function LanguagesPage() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery<Array<{ code: string; enabled: boolean }>>({
    queryKey: ['admin', 'languages'],
    queryFn: () => adminApi.get('/admin/languages').then((r) => r.data),
  });

  const toggle = useMutation({
    mutationFn: ({ code, enabled }: { code: string; enabled: boolean }) =>
      adminApi.post('/admin/languages/toggle', { languageCode: code, enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'languages'] }),
  });

  return (
    <div>
      <h1 style={styles.heading}>Language Pack Management</h1>
      <p style={styles.desc}>Enable or disable language packs. Disabled languages won't appear in the mobile app.</p>

      {isLoading ? <p>Loading...</p> : (
        <div style={styles.grid}>
          {data.map((lang) => (
            <div key={lang.code} style={styles.card}>
              <div>
                <div style={styles.langCode}>{lang.code.toUpperCase()}</div>
                <div style={styles.langName}>{LANG_NAMES[lang.code] ?? lang.code}</div>
              </div>
              <button
                onClick={() => toggle.mutate({ code: lang.code, enabled: !lang.enabled })}
                style={lang.enabled ? styles.enabledBtn : styles.disabledBtn}
              >
                {lang.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 8, marginTop: 0 },
  desc: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 },
  card: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 16 },
  langCode: { fontSize: 14, fontWeight: 700, color: '#FF6B35' },
  langName: { fontSize: 14, color: '#1A1A2E', marginTop: 2 },
  enabledBtn: { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  disabledBtn: { backgroundColor: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
};
