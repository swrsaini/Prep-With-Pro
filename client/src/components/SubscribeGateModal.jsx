import React, { useState } from 'react';

function SubscribeGateModal({ onContinue }) {
  const [youtube, setYoutube] = useState(false);
  const [telegram, setTelegram] = useState(false);
  return <div className="modal-overlay active-modal subscribe-gate-overlay"><section className="modal-card subscribe-gate-modal" role="dialog" aria-modal="true" aria-labelledby="subscribe-gate-title"><div className="subscribe-gate-title" id="subscribe-gate-title"><span aria-hidden="true">🔒</span> Unlock Prep With Pro</div><p className="subscribe-copy">This portal is free for our community. Please subscribe on YouTube and join our Telegram channel to unlock full access.</p><div className="subscribe-check-row"><label><input type="checkbox" checked={youtube} onChange={(event) => setYoutube(event.target.checked)} /> <span>I&apos;ve subscribed on<br />YouTube</span></label><a className="subscribe-action subscribe-youtube-action" href="https://www.youtube.com/@PrepWithPro" target="_blank" rel="noreferrer" onClick={() => setYoutube(true)}><span aria-hidden="true">▶</span> Subscribe</a></div><div className="subscribe-check-row"><label><input type="checkbox" checked={telegram} onChange={(event) => setTelegram(event.target.checked)} /> <span>I&apos;ve joined the Telegram<br />channel</span></label><a className="subscribe-action subscribe-telegram-action" href="https://t.me/prepwithprochat" target="_blank" rel="noreferrer" onClick={() => setTelegram(true)}><span aria-hidden="true">✈</span> Join</a></div><button className="btn btn-primary subscribe-continue" type="button" disabled={!youtube || !telegram} onClick={onContinue}>Continue to Portal</button><p className="subscribe-note">Click each button, then confirm the checkbox once done.</p></section></div>;
}

export default SubscribeGateModal;
