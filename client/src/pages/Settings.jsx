import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const settingItems = [['darkMode', 'Dark Mode Override', 'Adjust palette contrast modes'], ['compactMode', 'Compact Cards Layout', 'Compress layout parameters for denser visibility'], ['audio', 'Enable Audio Responses', 'Triggers synthesized offline tones upon answer clicks'], ['autoNext', 'Auto Next Navigation', 'Auto-advances to subsequent questions on correct answers'], ['lockAnswers', 'Lock Correct Answers', 'Disallows changing options after submission click']];

function Settings() {
  const { token, user } = useAuth();
  const { progress, setProgress, questions, setQuestions } = useApp();
  const { showToast } = useToast();
  const [settings, setSettings] = useState({ darkMode: false, compactMode: false, audio: false, autoNext: false, lockAnswers: true, ...(progress.settings || {}) });
  const [file, setFile] = useState(null);
  const [previewCount, setPreviewCount] = useState(null);
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => { document.documentElement.dataset.theme = settings.darkMode ? 'dark' : 'light'; document.body.classList.toggle('compact-mode', settings.compactMode); }, [settings.darkMode, settings.compactMode]);
  useEffect(() => setSettings((current) => ({ ...current, ...(progress.settings || {}) })), [progress.settings]);

  async function saveSettings(next) {
    setSettings(next); setProgress((current) => ({ ...current, settings: next }));
    try { const response = await fetch(`${API_URL}/api/progress/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(next) }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Unable to save settings.'); setProgress(data); showToast('Settings saved successfully.', 'success'); } catch (error) { showToast(error.message, 'error'); }
  }

  async function reset() { if (!window.confirm('Reset your progress? This cannot be undone.')) return; try { const response = await fetch(`${API_URL}/api/progress/reset`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Unable to reset progress.'); setProgress(data); showToast('Your progress was reset.', 'success'); } catch (error) { showToast(error.message, 'error'); } }

  async function inspectFile(event) { const selected = event.target.files[0]; setFile(selected || null); if (!selected) return; try { const parsed = JSON.parse(await selected.text()); setPreviewCount(Array.isArray(parsed) ? parsed.length : parsed.questions?.length || 0); setImportStatus(''); } catch { setPreviewCount(null); setImportStatus('That file is not valid JSON.'); } }
  async function importFile() { if (!file) return; try { const parsed = JSON.parse(await file.text()); const response = await fetch(`${API_URL}/api/questions/bulk-import`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(parsed) }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Unable to import questions.'); setImportStatus(`Inserted ${data.inserted}, skipped ${data.skipped}.`); showToast('Question bank updated.', 'success'); const refreshed = await fetch(`${API_URL}/api/questions`, { headers: { Authorization: `Bearer ${token}` } }); if (refreshed.ok) setQuestions(await refreshed.json()); } catch (error) { setImportStatus(error.message); showToast(error.message, 'error'); } }

  return <section className="view-pane active settings-page" id="settings-pane"><h3 className="settings-page-title">Portal Configuration</h3><div className="glass-card"><div className="settings-grid"><div className="settings-card"><h4>Display &amp; Styling</h4>{settingItems.slice(0, 3).map(([key, label, description]) => <SettingRow key={key} setting={settings} setSetting={saveSettings} name={key} label={label} description={description} />)}</div><div className="settings-card"><h4>Exam Behavior</h4>{settingItems.slice(3).map(([key, label, description]) => <SettingRow key={key} setting={settings} setSetting={saveSettings} name={key} label={label} description={description} />)}<div className="setting-row"><button className="btn btn-secondary reset-button" type="button" onClick={reset}>🚨 Factory Reset Dashboard State</button></div></div>{user.role === 'admin' && <div className="settings-card settings-upload-card"><h4>Database &amp; Custom Questions</h4><p>Append more questions to your question bank from another JSON file.</p><input type="file" accept=".json,application/json" onChange={inspectFile} /><span>{previewCount === null ? 'Choose a JSON file to preview it.' : `${previewCount} questions detected.`}</span><button className="btn btn-primary" type="button" disabled={!file || previewCount === null} onClick={importFile}>Append / Upload JSON Questions</button>{importStatus && <p className={importStatus.startsWith('Inserted') ? 'success-message' : 'form-error'}>{importStatus}</p>}</div>}</div></div></section>;
}
function SettingRow({ setting, setSetting, name, label, description }) { return <div className="setting-row"><div><p>{label}</p><span>{description}</span></div><label className="toggle-switch"><input type="checkbox" checked={Boolean(setting[name])} onChange={(event) => setSetting({ ...setting, [name]: event.target.checked })} /><span className="slider" /></label></div>; }
export default Settings;
