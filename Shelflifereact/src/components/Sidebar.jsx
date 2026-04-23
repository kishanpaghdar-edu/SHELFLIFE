import React from 'react';

export default function Sidebar({ accentColor, bgColor, links, activePanel, onNav, logo, logoSpan, shopSubtitle, userName, userInitials, onLogout }) {
  const isActive = (key) => activePanel === key;

  return (
    <aside style={{ width:'var(--sb-w)',background:bgColor,display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',flexShrink:0,zIndex:100 }}>
      {/* Logo */}
      <div style={{ padding:'1.3rem 1.4rem 1rem',borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',fontWeight:900,color:logo,cursor:'pointer' }}>
          SHELF<span style={{color:logoSpan}}>LIFE</span>+
        </div>
        <div style={{ fontSize:'.7rem',color:'rgba(255,255,255,.35)',marginTop:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{shopSubtitle}</div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1,padding:'.7rem .55rem',display:'flex',flexDirection:'column',gap:2,overflowY:'auto' }}>
        {links.map((item, i) => {
          if (item.type === 'section') return (
            <div key={i} style={{ fontSize:'.6rem',textTransform:'uppercase',letterSpacing:'1.5px',color:'rgba(255,255,255,.22)',padding:'.6rem .75rem .28rem',fontWeight:500 }}>{item.label}</div>
          );
          const active = isActive(item.key);
          return (
            <div key={item.key} onClick={() => onNav(item.key)}
              style={{ display:'flex',alignItems:'center',gap:'.65rem',padding:'.62rem .75rem',borderRadius:10,cursor:'pointer',transition:'all .2s',color: active ? '#fff' : 'rgba(255,255,255,.46)',fontSize:'.83rem',fontWeight: active ? 500 : 400,background: active ? accentColor : 'transparent' }}
              onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background='rgba(255,255,255,.06)'; e.currentTarget.style.color='rgba(255,255,255,.82)'; } }}
              onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background=''; e.currentTarget.style.color='rgba(255,255,255,.46)'; } }}>
              <span style={{ fontSize:13,width:17,textAlign:'center',flexShrink:0 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.badge != null && (
                <span style={{ background: active ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.12)', color: active ? '#fff' : 'rgba(255,255,255,.6)', fontSize:'.6rem', fontWeight:600, padding:'.1rem .42rem', borderRadius:50, minWidth:17, textAlign:'center' }}>{item.badge}</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding:'.9rem 1.4rem',borderTop:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'.55rem',marginBottom:'.55rem' }}>
          <div style={{ width:30,height:30,borderRadius:'50%',background:'rgba(255,255,255,.12)',color:'rgba(255,255,255,.8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.72rem',fontWeight:700,flexShrink:0 }}>{userInitials}</div>
          <div style={{ fontSize:'.75rem',color:'rgba(255,255,255,.6)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{userName}</div>
        </div>
        <button onClick={onLogout} style={{ width:'100%',padding:'.42rem',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,color:'rgba(255,255,255,.38)',fontSize:'.72rem',cursor:'pointer',fontFamily:"'DM Sans',sans-serif',transition:'all .2s",textAlign:'center' }}>🚪 Logout</button>
      </div>
    </aside>
  );
}
