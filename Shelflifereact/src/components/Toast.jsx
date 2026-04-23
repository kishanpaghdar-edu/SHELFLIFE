import React from 'react';

export default function Toast({ toast }) {
  if (!toast.visible) return null;
  return (
    <div style={{
      position:'fixed', bottom:18, right:18,
      background:'#1C1209', color:'#fff',
      padding:'.65rem 1.1rem', borderRadius:10,
      fontSize:'.82rem', fontWeight:500,
      zIndex:9999,
      borderLeft: `3px solid ${toast.type==='success'?'var(--gr-m)':toast.type==='warn'?'var(--am-m)':toast.type==='error'?'var(--rd-m)':'var(--or-m)'}`,
      maxWidth:280,
      animation:'fadeInUp .3s ease',
    }}>
      {toast.msg}
    </div>
  );
}
