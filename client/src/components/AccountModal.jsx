import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AccountModal({ onClose }) {
  const { user, token, refreshMe, logout } = useAuth();
  const [name, setName] = useState(user.name || '');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function request(path, body) {
    const response = await fetch(`${API_URL}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Unable to update account.');
    return data;
  }

  async function updateName(event) {
    event.preventDefault(); setMessage(''); setError('');
    try { await request('/api/auth/profile', { name }); await refreshMe(); setMessage('Name updated successfully.'); } catch (requestError) { setError(requestError.message); }
  }

  async function updatePassword(event) {
    event.preventDefault(); setMessage(''); setError('');
    if (passwords.newPassword !== passwords.confirmPassword) { setError('New passwords do not match.'); return; }
    try { const data = await request('/api/auth/password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); setMessage(data.message); } catch (requestError) { setError(requestError.message); }
  }

  return <div className="modal-overlay active-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card account-modal-full" role="dialog" aria-modal="true" aria-labelledby="account-modal-title"><button className="modal-close" type="button" aria-label="Close account dialog" onClick={onClose}>×</button><p className="eyebrow">Account</p><h2 id="account-modal-title">{user.name}</h2><p className="account-email">{user.email}</p><p className="account-role">{user.role === 'admin' ? 'Administrator' : 'Candidate'}</p>{message && <p className="success-message">{message}</p>}{error && <p className="form-error">{error}</p>}<form className="account-form" onSubmit={updateName}><label>Display name<input value={name} onChange={(event) => setName(event.target.value)} /></label><button className="btn btn-primary" type="submit">Update Name</button></form><form className="account-form" onSubmit={updatePassword}><h3>Change Password</h3><label>Current password<input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} /></label><label>New password<input type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} /></label><label>Confirm new password<input type="password" value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} /></label><button className="btn btn-secondary" type="submit">Change Password</button></form><button className="btn btn-secondary account-logout" type="button" onClick={logout}>Log out</button></section></div>;
}

export default AccountModal;
