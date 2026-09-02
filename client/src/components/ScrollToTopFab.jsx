import React, { useEffect, useState } from 'react';

function ScrollToTopFab() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const onScroll = () => setVisible(window.scrollY > 280); window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll); }, []);
  return <button className={`fab scroll-top-fab${visible ? ' visible' : ''}`} type="button" title="Scroll to Top" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>;
}

export default ScrollToTopFab;
