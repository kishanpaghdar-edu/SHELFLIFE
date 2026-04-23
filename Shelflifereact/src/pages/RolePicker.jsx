import React from 'react';
import { useNavigate } from 'react-router-dom';

const ROLES = [
  { key:'owner', cls:'o', ico:'🍽️', title:'Restaurant / Shop Owner', desc:'Manage near-expiry inventory, track sales, and donate surplus to NGOs.',
    btnPrimary:{label:'See Owner Page', to:'/for/owner'}, btnLogin:{label:'Login as Owner', to:'/login/owner'}, btnReg:{label:'Register your shop', to:'/register/owner'},
    bg:'var(--or-l)', border:'var(--or-m)', tc:'#7A3008', dc:'#9A5030', ac:'var(--or)' },
  { key:'user',  cls:'u', ico:'🌿', title:'Conscious Consumer', desc:'Browse discounted near-expiry food, track your CO₂ savings, and order with ease.',
    btnPrimary:{label:'See User Page', to:'/for/user'}, btnLogin:{label:'Login as Consumer', to:'/login/user'}, btnReg:{label:'Create account', to:'/register/user'},
    bg:'var(--gr-l)', border:'#C0DD97', tc:'var(--gr-d)', dc:'#4A6A20', ac:'var(--gr)' },
  { key:'ngo',   cls:'n', ico:'💜', title:'NGO Partner', desc:'Review donation offers from restaurants, accept pickups, and track your impact.',
    btnPrimary:{label:'See NGO Page', to:'/for/ngo'}, btnLogin:{label:'Login as NGO', to:'/login/ngo'}, btnReg:{label:'Register NGO', to:'/register/ngo'},
    bg:'var(--pu-l)', border:'var(--pu-m)', tc:'var(--pu-d)', dc:'var(--pu)', ac:'var(--pu)' },
];

export default function RolePicker() {
  const nav = useNavigate();
  return (
    <div>
      {/* NAV */}
      <nav style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 5%',background:'rgba(253,250,246,.97)',borderBottom:'1px solid var(--bd)',position:'sticky',top:0,zIndex:99 }}>
        <div onClick={()=>nav('/')} style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.5rem',fontWeight:900,color:'var(--or)',cursor:'pointer' }}>SHELF<span style={{color:'var(--gr)'}}>LIFE</span>+</div>
        <button onClick={()=>nav('/')} style={{ padding:'.42rem 1rem',border:'1.5px solid var(--bd)',borderRadius:50,fontSize:'.82rem',color:'var(--wg)',cursor:'pointer',background:'none',fontFamily:"'DM Sans',sans-serif" }}>← Back to home</button>
      </nav>
      <div style={{ padding:'3rem 5%' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'2.2rem',fontWeight:900,color:'#1C1209',marginBottom:'.5rem' }}>Welcome to SHELFLIFE+</h1>
        <p style={{ color:'var(--wg)',fontSize:'.95rem',marginBottom:'2.5rem',fontWeight:300 }}>Choose your role to login or create an account</p>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.25rem',maxWidth:860 }}>
          {ROLES.map(r=>(
            <div key={r.key} style={{ borderRadius:22,padding:'2rem 1.75rem',border:`2px solid ${r.border}`,background:r.bg,transition:'transform .2s,box-shadow .2s' }}
              onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 36px rgba(28,18,9,.1)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              <div style={{ fontSize:'2.5rem',marginBottom:'.85rem' }}>{r.ico}</div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.15rem',fontWeight:700,marginBottom:'.35rem',color:r.tc }}>{r.title}</div>
              <div style={{ fontSize:'.78rem',fontWeight:300,lineHeight:1.55,marginBottom:'1.1rem',color:r.dc }}>{r.desc}</div>
              <div style={{ display:'flex',flexDirection:'column',gap:'.45rem' }}>
                {[r.btnPrimary, r.btnLogin, r.btnReg].map((b,i)=>(
                  <button key={i} onClick={()=>nav(b.to)} style={{
                    padding:'.5rem', borderRadius:50, fontSize:'.78rem', fontWeight:500, cursor:'pointer',
                    fontFamily:"'DM Sans',sans-serif", border:'none', width:'100%', transition:'all .2s', textAlign:'center',
                    ...(i===0 ? {background:r.ac,color:'#fff'} : {background:'#fff',color:r.tc,border:`1.5px solid ${r.border}`})
                  }}>{b.label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
