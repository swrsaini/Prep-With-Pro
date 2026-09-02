import React, { useEffect, useMemo, useState } from 'react';
import EditQuestionModal from '../components/EditQuestionModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Reports() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const reportCounts = useMemo(() => reports.reduce((counts, report) => ({ ...counts, [report.status]: counts[report.status] + 1 }), { open: 0, resolved: 0, dismissed: 0 }), [reports]);
  const orderedReports = useMemo(() => [...reports].sort((first, second) => {
    const rank = { open: 0, dismissed: 1, resolved: 2 };
    return (rank[first.status] ?? 1) - (rank[second.status] ?? 1) || new Date(second.createdAt) - new Date(first.createdAt);
  }), [reports]);
  const visibleReports = useMemo(() => statusFilter === 'all' ? orderedReports : orderedReports.filter((report) => report.status === statusFilter), [orderedReports, statusFilter]);

  async function loadReports() {
    try {
      const response = await fetch(`${API_URL}/api/reports`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load reports.');
      setReports(data);
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadReports(); }, [token]);

  async function updateReport(report, event) {
    const status = event.target.value;
    try {
      const response = await fetch(`${API_URL}/api/reports/${report._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status, adminNote: report.adminNote || '' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update report.');
      setReports((current) => current.map((item) => item._id === data._id ? data : item));
      showToast('Report status updated.', 'success');
    } catch (updateError) { showToast(updateError.message, 'error'); }
  }

  if (loading) return <section className="view-pane active"><div className="glass-card">Loading question reports...</div></section>;
  if (error) return <section className="view-pane active"><div className="glass-card form-error">{error}</div></section>;

  return <section className="view-pane active reports-page"><div className="reports-header"><div><h3>Reported Questions</h3><p>Review question issues submitted by users and update the underlying question.</p></div><label className="reports-filter">Show <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All Reports</option><option value="open">Open</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></label></div><div className="report-counter-row"><span className="report-counter counter-all">All <strong>{reports.length}</strong></span><span className="report-counter counter-open">Open <strong>{reportCounts.open}</strong></span><span className="report-counter counter-resolved">Resolved <strong>{reportCounts.resolved}</strong></span><span className="report-counter counter-dismissed">Dismissed <strong>{reportCounts.dismissed}</strong></span></div>{!reports.length && <div className="glass-card reports-empty">No question reports have been submitted.</div>}{reports.length > 0 && !visibleReports.length && <div className="glass-card reports-empty">No {statusFilter} reports found.</div>}<div className="reports-list">{visibleReports.map((report) => <article className={`glass-card report-card report-${report.status}`} key={report._id}><div className="report-card-header"><div><span className="meta-tag category">{report.question?.category || 'Unknown category'}</span><h4>Question #{report.question?.question_number || report.question?.legacy_id || 'Unknown'}</h4></div><select value={report.status} onChange={(event) => updateReport(report, event)} aria-label={`Status for report ${report._id}`}><option value="open">Open</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></div><p className="reported-question-text">{report.question?.question || 'The linked question no longer exists.'}</p><div className="report-reason"><strong>Reported by {report.reportedBy?.name || 'Unknown user'}</strong><span>{report.reportedBy?.email || ''}</span><p>{report.reason}</p></div><div className="report-card-actions">{report.question && <button className="btn btn-primary" type="button" onClick={() => setEditingQuestion(report.question)}>Edit Question</button>}<span>{new Date(report.createdAt).toLocaleString()}</span></div></article>)}</div>{editingQuestion && <EditQuestionModal question={editingQuestion} onClose={() => { setEditingQuestion(null); loadReports(); }} />}</section>;
}

export default Reports;
