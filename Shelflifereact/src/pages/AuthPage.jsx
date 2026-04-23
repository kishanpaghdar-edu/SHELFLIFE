import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

const ROLE_CFG = {
  owner: {
    alClass:'#1C1209', logoColor:'var(--or)', logoSpan:'var(--gr-m)',
    badgeBg:'rgba(232,97,10,.2)', badgeColor:'var(--or-m)', badgeBorder:'rgba(232,97,10,.3)',
    badge:'🍽️  Restaurant / Shop Owner',
    hdg:'Sell surplus.\nStop the waste.',
    feats:['Upload near-expiry items with photos & pricing','Live inventory & sales dashboard','Route unsold stock to NGO partners','Manage orders in real time'],
    fdBg:'rgba(232,97,10,.25)', fdColor:'var(--or-m)',
    foot:'Connects to: users + restaurants tables',
    lTitle:'Owner Login', lSub:'Sign in to your dashboard',
    rTitle:'Register Your Shop', rSub:'Create your free owner account',
    tabColor:'var(--or)', tabClass:'or',
  },
  user: {
    alClass:'#0E1F06', logoColor:'var(--gr-m)', logoSpan:'var(--or-m)',
    badgeBg:'rgba(59,109,17,.25)', badgeColor:'var(--gr-m)', badgeBorder:'rgba(59,109,17,.3)',
    badge:'🌿  Conscious Consumer',
    hdg:'Eat well.\nSpend less.\nSave the planet.',
    feats:['Browse restaurants & grocery deals near you','Live CO₂ savings and money saved per order','Pay via UPI, card, net banking or COD','Track your full order history and impact'],
    fdBg:'rgba(59,109,17,.25)', fdColor:'var(--gr-m)',
    foot:'Connects to: users + user_addresses tables',
    lTitle:'Consumer Login', lSub:'Sign in to browse food deals',
    rTitle:'Create Your Account', rSub:'Join thousands saving money daily',
    tabColor:'var(--gr)', tabClass:'u',
  },
  ngo: {
    alClass:'#0D0B1F', logoColor:'var(--pu-m)', logoSpan:'var(--gr-m)',
    badgeBg:'rgba(83,74,183,.25)', badgeColor:'var(--pu-m)', badgeBorder:'rgba(83,74,183,.3)',
    badge:'💜  NGO Partner',
    hdg:'Rescue food.\nFeed communities.',
    feats:['Receive donation offers from restaurants in your city','Accept or decline with notes — one click','Track pending pickups and completed donations','Zero cost — all surplus food donated free'],
    fdBg:'rgba(83,74,183,.25)', fdColor:'var(--pu-m)',
    foot:'Connects to: users + user_addresses tables',
    lTitle:'NGO Login', lSub:'Sign in to view donation offers',
    rTitle:'Register Your NGO', rSub:'Start receiving surplus food donations today',
    tabColor:'var(--pu)', tabClass:'n',
  },
};

export default function AuthPage({ tab: initTab }) {
  const { role } = useParams();
  const nav = useNavigate();
  const { login } = useAuth();
  const c = ROLE_CFG[role] || ROLE_CFG.user;

  const [tab, setTab]   = useState(initTab || 'login');
  const [lEmail,setLE]  = useState('');
  const [lPass,setLP]   = useState('');
  const [lErr,setLErr]  = useState('');
  const [rName,setRN]   = useState('');
  const [rEmail,setRE]  = useState('');
  const [rPhone,setRPh] = useState('');
  const [rRest,setRR]   = useState('');
  const [rLoc,setRL]    = useState('');
  const [rContact,setRC]= useState('');
  const [rAddr,setRA]   = useState('');
  const [rCity,setRCt]  = useState('');
  const [rPin,setRPin]  = useState('');
  const [rNgoName,setRNG]=useState('');
  const [rNgoCity,setRNC]=useState('');
  const [rPass,setRP]   = useState('');
  const [rConf,setRCf]  = useState('');
  const [rErr,setRErr]  = useState('');
  const [loading,setLoading]=useState(false);

  const goBack = () => {
    const map = { owner:'/for/owner', user:'/for/user', ngo:'/for/ngo' };
    nav(map[role] || '/pick-role');
  };

 const handleLogin = async () => {
  setLErr('');
  if (!lEmail || !lPass) { setLErr('Please enter your email and password.'); return; }
  setLoading(true);
  try {
    const res = await api.post('/auth/login', {
      email: lEmail,
      password: lPass,
      role,
    });
    localStorage.setItem('sl_token', res.data.token);
    login({ ...res.data.user, role });
    // Store greeting info in sessionStorage — picked up by dashboard on mount
    sessionStorage.setItem('sl_greeting', JSON.stringify({
      is_first_login: res.data.is_first_login  || false,
      login_count:    res.data.login_count     || 1,
      last_login:     res.data.last_login      || null,
    }));
    nav(`/dashboard/${role}`);
  } catch (err) {
    setLErr(err.response?.data?.message || 'Login failed. Check your details.');
  } finally {
    setLoading(false);
  }
};

const handleRegister = async () => {
  setRErr('');
  if (!rName || !rEmail || !rPass) { setRErr('Please fill all required fields (*).'); return; }
  if (rPass !== rConf)             { setRErr('Passwords do not match.'); return; }
  if (rPass.length < 6)            { setRErr('Password must be at least 6 characters.'); return; }
  if (role === 'owner' && !rRest)  { setRErr('Restaurant name is required.'); return; }
  if (role === 'ngo' && !rNgoName) { setRErr('NGO name is required.'); return; }
  setLoading(true);
  try {
    const res = await api.post(`/auth/register/${role}`, {
      name:            role === 'ngo' ? rNgoName : rName,
      email:           rEmail,
      phone:           rPhone,
      password:        rPass,
      restaurant_name: rRest,
      location:        rLoc,
      contact_number:  rContact,
      address:         rAddr,
      city:            role === 'user' ? rCity : rNgoCity,
      pincode:         rPin,
    });
    localStorage.setItem('sl_token', res.data.token);
    login({ ...res.data.user, role });
    // Store greeting info in sessionStorage — picked up by dashboard on mount
    sessionStorage.setItem('sl_greeting', JSON.stringify({
      is_first_login: res.data.is_first_login  || false,
      login_count:    res.data.login_count     || 1,
      last_login:     res.data.last_login      || null,
    }));
    nav(`/dashboard/${role}`);
  } catch (err) {
    setRErr(err.response?.data?.message || 'Registration failed. Try again.');
  } finally {
    setLoading(false);
  }
};

  const inSt = { padding:'.6rem .85rem',border:'1.5px solid var(--bd)',borderRadius:9,fontSize:'.88rem',fontFamily:"'DM Sans',sans-serif",color:'#1C1209',background:'#fff',width:'100%',outline:'none' };
  const tabSt = (active) => ({ flex:1,padding:'.5rem',borderRadius:50,border:'none',background: active ? c.tabColor : 'none',color: active ? '#fff' : 'var(--wg)',fontSize:'.82rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all .2s' });
  const subBtn = { width:'100%',padding:'.75rem',border:'none',borderRadius:50,fontSize:'.9rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",background:c.tabColor,color:'#fff',marginTop:'.4rem' };

  return (
    <div>
      {/* Top nav */}
      <nav style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 5%',background:'rgba(253,250,246,.97)',borderBottom:'1px solid var(--bd)',position:'sticky',top:0,zIndex:99 }}>
        <div onClick={()=>nav('/')} style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.5rem',fontWeight:900,color:'var(--or)',cursor:'pointer' }}>SHELF<span style={{color:'var(--gr)'}}>LIFE</span>+</div>
        <button onClick={goBack} style={{ padding:'.42rem 1rem',border:'1.5px solid var(--bd)',borderRadius:50,fontSize:'.82rem',color:'var(--wg)',cursor:'pointer',background:'none',fontFamily:"'DM Sans',sans-serif" }}>← Back</button>
      </nav>

      <div style={{ display:'grid',gridTemplateColumns:'340px 1fr',minHeight:'calc(100vh - 64px)' }}>
        {/* LEFT */}
        <div style={{ background:c.alClass,padding:'2.25rem 1.75rem',display:'flex',flexDirection:'column' }}>
          <div onClick={()=>nav('/')} style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.35rem',fontWeight:900,color:c.logoColor,cursor:'pointer',marginBottom:'1.75rem' }}>
            SHELF<span style={{color:c.logoSpan}}>LIFE</span>+
          </div>
          <div style={{ flex:1,display:'flex',flexDirection:'column',justifyContent:'center' }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:'.45rem',padding:'.3rem .8rem',borderRadius:50,fontSize:'.72rem',fontWeight:500,marginBottom:'1rem',width:'fit-content',background:c.badgeBg,color:c.badgeColor,border:`1px solid ${c.badgeBorder}` }}>
              {c.badge}
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.6rem',fontWeight:700,color:'#fff',lineHeight:1.25,marginBottom:'1.25rem',whiteSpace:'pre-line' }}>{c.hdg}</div>
            <ul style={{ listStyle:'none',display:'flex',flexDirection:'column',gap:'.75rem' }}>
              {c.feats.map((f,i)=>(
                <li key={i} style={{ display:'flex',alignItems:'flex-start',gap:'.55rem',fontSize:'.82rem',color:'#C4A98A',lineHeight:1.5,fontWeight:300 }}>
                  <span style={{ width:18,height:18,borderRadius:'50%',background:c.fdBg,color:c.fdColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.6rem',flexShrink:0,marginTop:1 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop:'auto',paddingTop:'1.25rem',borderTop:'1px solid rgba(255,255,255,.07)',fontSize:'.72rem',color:'#7A6652' }}>{c.foot}</div>
        </div>

        {/* RIGHT */}
        <div style={{ background:'#F7F3EE',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.75rem',overflowY:'auto' }}>
          <div style={{ background:'#fff',borderRadius:18,border:'1px solid var(--bd)',padding:'2rem',width:'100%',maxWidth:430,boxShadow:'0 4px 20px rgba(28,18,9,.06)' }}>
            {/* Tabs */}
            <div style={{ display:'flex',background:'#F5EFE8',borderRadius:50,padding:3,marginBottom:'1.5rem' }}>
              <button style={tabSt(tab==='login')}  onClick={()=>setTab('login')}>Login</button>
              <button style={tabSt(tab==='register')} onClick={()=>setTab('register')}>Register</button>
            </div>

            {/* LOGIN FORM */}
            {tab==='login' && (
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,color:'#1C1209',marginBottom:'.25rem' }}>{c.lTitle}</h2>
                <p style={{ fontSize:'.8rem',color:'var(--wg)',marginBottom:'1.25rem',fontWeight:300 }}>{c.lSub}</p>
                {lErr && <div style={{ background:'#FCEBEB',border:'1px solid #F7C1C1',borderRadius:8,padding:'.5rem .8rem',fontSize:'.78rem',color:'#A32D2D',marginBottom:'.75rem' }}>{lErr}</div>}
                <div style={{ marginBottom:'.85rem' }}>
                  <label style={{ fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:'.3rem' }}>Email address</label>
                  <input style={inSt} type="email" placeholder="you@email.com" value={lEmail} onChange={e=>setLE(e.target.value)} />
                </div>
                <div style={{ marginBottom:'.85rem' }}>
                  <label style={{ fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:'.3rem' }}>Password</label>
                  <input style={inSt} type="password" placeholder="Your password" value={lPass} onChange={e=>setLP(e.target.value)} />
                </div>
                {role==='owner' && (
                  <div style={{ marginBottom:'.85rem' }}>
                    <label style={{ fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:'.3rem' }}>Restaurant name <span style={{color:'#C4B8A8',fontWeight:300}}>(optional)</span></label>
                    <input style={inSt} type="text" placeholder="Helps us find your account faster" />
                    <span style={{ fontSize:'.68rem',color:'var(--wg)',marginTop:2,display:'block',fontWeight:300 }}>→ restaurants.restaurant_name</span>
                  </div>
                )}
                <button style={subBtn} onClick={handleLogin} disabled={loading}>{loading?'Signing in…':'Login to Dashboard'}</button>
                <div style={{ textAlign:'center',fontSize:'.78rem',color:'var(--wg)',marginTop:'.85rem' }}>
                  No account? <span style={{ fontWeight:500,cursor:'pointer',textDecoration:'underline',color:c.tabColor }} onClick={()=>setTab('register')}>Register here</span>
                </div>
              </div>
            )}

            {/* REGISTER FORM */}
            {tab==='register' && (
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,color:'#1C1209',marginBottom:'.25rem' }}>{c.rTitle}</h2>
                <p style={{ fontSize:'.8rem',color:'var(--wg)',marginBottom:'1.25rem',fontWeight:300 }}>{c.rSub}</p>
                {rErr && <div style={{ background:'#FCEBEB',border:'1px solid #F7C1C1',borderRadius:8,padding:'.5rem .8rem',fontSize:'.78rem',color:'#A32D2D',marginBottom:'.75rem' }}>{rErr}</div>}

                {[['Full name *','text',rName,setRN,'→ users.name'],['Email address *','email',rEmail,setRE,'→ users.email (unique)'],['Phone','tel',rPhone,setRPh,'→ users.phone']].map(([lbl,type,val,set,note])=>(
                  <div key={lbl} style={{ marginBottom:'.85rem' }}>
                    <label style={{ fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:'.3rem' }}>{lbl}</label>
                    <input style={inSt} type={type} placeholder={lbl.replace(' *','')} value={val} onChange={e=>set(e.target.value)} />
                    <span style={{ fontSize:'.68rem',color:'var(--wg)',marginTop:2,display:'block',fontWeight:300 }}>{note}</span>
                  </div>
                ))}

                {/* Owner fields */}
                {role==='owner' && (
                  <>
                    <div style={{ display:'flex',alignItems:'center',gap:'.65rem',margin:'.65rem 0',fontSize:'.72rem',color:'#C4B8A8' }}><span style={{flex:1,height:1,background:'var(--bd)'}}></span>Restaurant Details<span style={{flex:1,height:1,background:'var(--bd)'}}></span></div>
                    {[['Restaurant name *','text',rRest,setRR,'→ restaurants.restaurant_name'],['Location','text',rLoc,setRL,'→ restaurants.location'],['Contact number','tel',rContact,setRC,'→ restaurants.contact_number']].map(([lbl,type,val,set,note])=>(
                      <div key={lbl} style={{ marginBottom:'.85rem' }}>
                        <label style={{ fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:'.3rem' }}>{lbl}</label>
                        <input style={inSt} type={type} placeholder={lbl.replace(' *','')} value={val} onChange={e=>set(e.target.value)} />
                        <span style={{ fontSize:'.68rem',color:'var(--wg)',marginTop:2,display:'block',fontWeight:300 }}>{note}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* User fields */}
                {role==='user' && (
                  <>
                    <div style={{ display:'flex',alignItems:'center',gap:'.65rem',margin:'.65rem 0',fontSize:'.72rem',color:'#C4B8A8' }}><span style={{flex:1,height:1,background:'var(--bd)'}}></span>Delivery Address<span style={{flex:1,height:1,background:'var(--bd)'}}></span></div>
                    <div style={{ marginBottom:'.85rem' }}>
                      <label style={{ fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:'.3rem' }}>Street address</label>
                      <input style={inSt} type="text" placeholder="Flat / Building, Street" value={rAddr} onChange={e=>setRA(e.target.value)} />
                      <span style={{ fontSize:'.68rem',color:'var(--wg)',marginTop:2,display:'block',fontWeight:300 }}>→ user_addresses.address</span>
                    </div>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.65rem',marginBottom:'.85rem' }}>
                      <div><label style={{ fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:'.3rem' }}>City</label><input style={inSt} type="text" placeholder="Mumbai" value={rCity} onChange={e=>setRCt(e.target.value)} /></div>
                      <div><label style={{ fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:'.3rem' }}>Pincode</label><input style={inSt} type="text" placeholder="400001" value={rPin} onChange={e=>setRPin(e.target.value)} /></div>
                    </div>
                  </>
                )}

                {/* NGO fields */}
                {role==='ngo' && (
                  <>
                    <div style={{ display:'flex',alignItems:'center',gap:'.65rem',margin:'.65rem 0',fontSize:'.72rem',color:'#C4B8A8' }}><span style={{flex:1,height:1,background:'var(--bd)'}}></span>NGO Details<span style={{flex:1,height:1,background:'var(--bd)'}}></span></div>
                    {[['NGO name *','text',rNgoName,setRNG,'→ users.name'],['City of operation','text',rNgoCity,setRNC,'→ user_addresses.city']].map(([lbl,type,val,set,note])=>(
                      <div key={lbl} style={{ marginBottom:'.85rem' }}>
                        <label style={{ fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:'.3rem' }}>{lbl}</label>
                        <input style={inSt} type={type} placeholder={lbl.replace(' *','')} value={val} onChange={e=>set(e.target.value)} />
                        <span style={{ fontSize:'.68rem',color:'var(--wg)',marginTop:2,display:'block',fontWeight:300 }}>{note}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Password */}
                <div style={{ display:'flex',alignItems:'center',gap:'.65rem',margin:'.65rem 0',fontSize:'.72rem',color:'#C4B8A8' }}><span style={{flex:1,height:1,background:'var(--bd)'}}></span>Security<span style={{flex:1,height:1,background:'var(--bd)'}}></span></div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.65rem',marginBottom:'.85rem' }}>
                  <div><label style={{ fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:'.3rem' }}>Password *</label><input style={inSt} type="password" placeholder="Min. 6 chars" value={rPass} onChange={e=>setRP(e.target.value)} /></div>
                  <div><label style={{ fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:'.3rem' }}>Confirm *</label><input style={inSt} type="password" placeholder="Repeat" value={rConf} onChange={e=>setRCf(e.target.value)} /></div>
                </div>
                <button style={subBtn} onClick={handleRegister} disabled={loading}>{loading?'Creating account…':'Create Account'}</button>
                <div style={{ textAlign:'center',fontSize:'.78rem',color:'var(--wg)',marginTop:'.85rem' }}>
                  Have account? <span style={{ fontWeight:500,cursor:'pointer',textDecoration:'underline',color:c.tabColor }} onClick={()=>setTab('login')}>Login here</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
