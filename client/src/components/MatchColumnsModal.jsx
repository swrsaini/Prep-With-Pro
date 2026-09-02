import React, { useState } from 'react';

const romanLabels = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'];

function MatchColumnsModal({ onInsert, onClose }) {
  const [headers, setHeaders] = useState(['Column-I', 'Column-II']);
  const [rows, setRows] = useState([['', ''], ['', '']]);

  function updateRow(rowIndex, columnIndex, value) {
    setRows((current) => current.map((row, index) => index === rowIndex ? row.map((item, itemIndex) => itemIndex === columnIndex ? value : item) : row));
  }

  function insert() {
    if (rows.some((row) => !row[0].trim() || !row[1].trim())) return;
    const left = rows.map((row, index) => `${String.fromCharCode(97 + index)}) ${row[0].trim()}`).join(' ');
    const right = rows.map((row, index) => `${romanLabels[index] || `r${index + 1}`}) ${row[1].trim()}`).join(' ');
    onInsert(`\n${headers[0].trim() || 'Column-I'}: ${left} ${headers[1].trim() || 'Column-II'}: ${right}\n`);
  }

  return <div className="modal-overlay active-modal" role="presentation"><section className="modal-card match-columns-modal" role="dialog" aria-modal="true" aria-labelledby="match-columns-title"><button className="modal-close" type="button" aria-label="Close match columns dialog" onClick={onClose}>×</button><div className="modal-title" id="match-columns-title">🔗 Insert Match the Columns</div><p className="editor-help">Build a two-column matching layout. Items are labelled a, b, c and i, ii, iii automatically.</p><div className="editor-metadata-grid"><label className="editor-field"><span>Column A Header</span><input value={headers[0]} onChange={(event) => setHeaders([event.target.value, headers[1]])} /></label><label className="editor-field"><span>Column B Header</span><input value={headers[1]} onChange={(event) => setHeaders([headers[0], event.target.value])} /></label></div><div className="match-modal-rows">{rows.map((row, index) => <div className="match-builder-row" key={index}><input value={row[0]} onChange={(event) => updateRow(index, 0, event.target.value)} placeholder={`${String.fromCharCode(97 + index)}) Column A item`} /><input value={row[1]} onChange={(event) => updateRow(index, 1, event.target.value)} placeholder={`${romanLabels[index] || 'x'}) Column B item`} /></div>)}</div><button className="btn btn-secondary" type="button" onClick={() => setRows((current) => [...current, ['', '']])}>+ Add Row</button><div className="editor-actions"><button className="btn btn-primary" type="button" onClick={insert}>Insert Into Question</button><button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button></div></section></div>;
}

export default MatchColumnsModal;
