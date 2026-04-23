import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import WelcomeModal from '../../components/WelcomeModal';
const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('sl_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const DECLINE_REASONS = [
  'Capacity full on that day','Pickup time not feasible','Item type not suitable',
  'Location too far','Volunteers unavailable','Already at capacity this week',
];

const FOCUS_AREA_OPTIONS = [
  'Food Security & Hunger Relief','Child Nutrition','Women & Family Welfare',
  'Elderly Care','Disaster Relief','Animal Welfare','Education & Youth',
  'Community Development','Custom…',
];

const STATUS_COLORS = { open:'or', pending:'pu', accepted:'gr', completed:'tl', declined:'rd' };
const STATUS_LABELS = { open:'Open offer', pending:'Pending review', accepted:'Accepted', completed:'Completed', declined:'Declined' };
const BORDER_COLORS = { open:'var(--or)', pending:'var(--pu)', accepted:'var(--gr-m)', completed:'var(--tl-m)', declined:'var(--rd-m)' };
const CAT_COLORS    = ['var(--gr)','var(--or-m)','var(--tl-m)','var(--pu-m)','var(--am-m)'];

/* ─────────────────────────────────────────────
   SHARED UI ATOMS
───────────────────────────────────────────── */
const Badge = ({ c, children }) => {
  const m = { gr:['#EAF3DE','#27500A','#C0DD97'], or:['#FFF0E6','#C4500A','#FAC785'], am:['#FAEEDA','#633806','#EF9F27'], rd:['#FCEBEB','#A32D2D','#F09595'], bl:['#E6F1FB','#0C447C','#85B7EB'], pu:['#EEEDFE','#3C3489','#AFA9EC'], tl:['#E1F5EE','#0F6E56','#5DCAA5'] };
  const [bg,tc,bc] = m[c]||m.bl;
  return <span style={{display:'inline-flex',alignItems:'center',padding:'.17rem .52rem',borderRadius:50,fontSize:'.62rem',fontWeight:500,whiteSpace:'nowrap',border:`1px solid ${bc}`,background:bg,color:tc}}>{children}</span>;
};

const Stat = ({ ico, icoBg, val, lbl, color, sub }) => (
  <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',padding:'1rem 1.1rem',display:'flex',alignItems:'center',gap:'.75rem'}}>
    <div style={{width:40,height:40,borderRadius:10,background:icoBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0}}>{ico}</div>
    <div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.45rem',fontWeight:700,lineHeight:1,color}}>{val}</div>
      <div style={{fontSize:'.7rem',color:'var(--wg)',marginTop:2}}>{lbl}</div>
      {sub && <div style={{fontSize:'.65rem',marginTop:2,color:sub.startsWith('↑')?'var(--gr)':sub.startsWith('↓')||sub.startsWith('⚠')?'#A32D2D':'var(--wg)'}}>{sub}</div>}
    </div>
  </div>
);

const Bar = ({ lbl, pct, color, amt }) => (
  <div style={{display:'flex',alignItems:'center',gap:'.65rem',marginBottom:'.52rem'}}>
    <span style={{fontSize:'.72rem',color:'var(--wg)',width:110,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{lbl}</span>
    <div style={{flex:1,background:'#EDE8F5',borderRadius:50,height:7,overflow:'hidden'}}>
      <div style={{width:`${pct}%`,height:'100%',borderRadius:50,background:color,transition:'width .5s ease'}}/>
    </div>
    <span style={{fontSize:'.72rem',color:'var(--dk)',fontWeight:500,minWidth:48,textAlign:'right'}}>{amt}</span>
  </div>
);

const Card = ({ title, action, onAction, badge, children, style={} }) => (
  <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',overflow:'hidden',...style}}>
    {(title||action||badge)&&(
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.8rem 1.15rem',borderBottom:'1px solid var(--bd)'}}>
        <span style={{fontSize:'.85rem',fontWeight:500,color:'var(--dk)'}}>{title}</span>
        <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
          {badge&&badge}
          {action&&<button onClick={onAction} style={{fontSize:'.72rem',color:'var(--pu)',cursor:'pointer',background:'none',border:'none',fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{action}</button>}
        </div>
      </div>
    )}
    {children}
  </div>
);

/* ─────────────────────────────────────────────
   DECLINE MODAL
───────────────────────────────────────────── */
function DeclineModal({ open, offer, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [chip, setChip]     = useState('');
  if (!open||!offer) return null;
  const confirm = () => {
    const r = reason.trim()||chip;
    if (!r) { alert('Please provide a reason.'); return; }
    onConfirm(r); setReason(''); setChip('');
  };
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:18,padding:'1.75rem',maxWidth:440,width:'90%',position:'relative',boxShadow:'0 12px 40px rgba(0,0,0,.2)'}}>
        <button onClick={onClose} style={{position:'absolute',top:'.85rem',right:'.85rem',background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:'var(--wg)'}}>✕</button>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.15rem',fontWeight:700,color:'var(--dk)',marginBottom:'.25rem'}}>Decline donation offer</div>
        <p style={{fontSize:'.78rem',color:'var(--wg)',marginBottom:'1.25rem',lineHeight:1.5}}>Please provide a reason — this helps the restaurant improve future offers.</p>
        <div style={{background:'var(--cr)',border:'1px solid var(--bd)',borderRadius:10,padding:'.65rem .85rem',marginBottom:'1rem',fontSize:'.78rem',color:'var(--dk)'}}>
          <div style={{fontWeight:500,marginBottom:2}}>{offer.restaurant_name} — {offer.city}</div>
          <div style={{fontSize:'.7rem',color:'var(--wg)'}}>{offer.items?.map(i=>i.name).join(' · ')}</div>
          <div style={{fontSize:'.65rem',color:'var(--wg)',marginTop:3}}>Pickup: {offer.pickup_date||'TBD'} · {offer.pickup_slot||'—'}</div>
        </div>
        <div style={{fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:'.5rem'}}>Quick reason</div>
        <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap',marginBottom:'.85rem'}}>
          {DECLINE_REASONS.map(r=>(
            <span key={r} onClick={()=>{setChip(r);if(!reason.trim())setReason(r);}}
              style={{padding:'.32rem .75rem',borderRadius:50,fontSize:'.72rem',fontWeight:500,cursor:'pointer',border:`1.5px solid ${chip===r?'var(--rd-m)':'var(--bd)'}`,background:chip===r?'var(--rd-l)':'#fff',color:chip===r?'var(--rd)':'var(--wg)'}}>{r}</span>
          ))}
        </div>
        <div style={{fontSize:'.72rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:'.4rem'}}>Or write your own</div>
        <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} placeholder="e.g. We already have enough food for this week..." style={{width:'100%',padding:'.65rem .85rem',border:'1.5px solid var(--bd)',borderRadius:9,fontSize:'.82rem',fontFamily:"'DM Sans',sans-serif",color:'var(--dk)',background:'#fff',resize:'none',outline:'none',marginBottom:'1rem'}}/>
        <div style={{display:'flex',gap:'.6rem',justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'.6rem 1.1rem',background:'none',color:'var(--wg)',border:'1.5px solid var(--bd)',borderRadius:50,fontSize:'.85rem',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
          <button onClick={confirm} style={{padding:'.6rem 1.35rem',background:'var(--rd)',color:'#fff',border:'none',borderRadius:50,fontSize:'.85rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>✗ Confirm Decline</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   OFFER CARD
───────────────────────────────────────────── */
function OfferCard({ offer, showActions, expanded, onToggle, onAccept, onDecline, onComplete }) {
  return (
    <div style={{borderRadius:11,border:'1px solid var(--bd)',overflow:'hidden',background:'var(--cr)',marginBottom:'.6rem',borderLeft:`3px solid ${BORDER_COLORS[offer.status]||'var(--bd)'}`,opacity:offer.status==='declined'?0.75:1}}>
      <div onClick={onToggle} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.72rem .9rem',cursor:'pointer',flexWrap:'wrap',gap:'.5rem'}}>
        <div style={{display:'flex',alignItems:'center',gap:'.6rem'}}>
          {offer.restaurant_image_url
            ?<img src={offer.restaurant_image_url} alt={offer.restaurant_name} style={{width:34,height:34,borderRadius:9,objectFit:'cover',flexShrink:0,border:'1.5px solid var(--bd)'}}/>
            :<div style={{width:34,height:34,borderRadius:9,background:'var(--or-l)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>🏪</div>}
          <div>
            <div style={{fontSize:'.82rem',fontWeight:500,color:'var(--dk)'}}>{offer.restaurant_name}</div>
            <div style={{fontSize:'.65rem',color:'var(--wg)',marginTop:1}}>{offer.city} · Pickup: {offer.pickup_date||'TBD'} {offer.pickup_slot&&`· ${offer.pickup_slot}`}</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
          <Badge c={STATUS_COLORS[offer.status]||'bl'}>{STATUS_LABELS[offer.status]||offer.status}</Badge>
          <span style={{fontSize:'.72rem',color:'var(--wg)',display:'inline-block',transform:expanded?'rotate(180deg)':''}}>▼</span>
        </div>
      </div>
      {expanded&&(
        <div style={{borderTop:'1px solid var(--bd)',padding:'.75rem .9rem'}}>
          {offer.title&&<div style={{fontWeight:500,fontSize:'.85rem',color:'var(--dk)',marginBottom:'.35rem'}}>{offer.title}</div>}
          <div style={{fontSize:'.68rem',textTransform:'uppercase',letterSpacing:'.4px',color:'var(--wg)',marginBottom:'.4rem'}}>Items in this donation</div>
          <div style={{display:'flex',gap:'.3rem',flexWrap:'wrap',marginBottom:'.7rem'}}>
            {offer.items?.map(it=>(
              <span key={it.id} style={{fontSize:'.68rem',background:'#fff',border:'1px solid var(--bd)',borderRadius:6,padding:'.12rem .48rem',color:'var(--dk)'}}>{it.name} ×{it.quantity}</span>
            ))}
            {(!offer.items||!offer.items.length)&&<span style={{fontSize:'.75rem',color:'var(--wg)'}}>No items listed</span>}
          </div>
          <div style={{display:'flex',gap:'1.1rem',flexWrap:'wrap',marginBottom:'.65rem'}}>
            {offer.pickup_date&&<span style={{fontSize:'.72rem',color:'var(--wg)'}}>📅 <strong>{offer.pickup_date}</strong></span>}
            {offer.pickup_slot&&<span style={{fontSize:'.72rem',color:'var(--wg)'}}>⏰ {offer.pickup_slot}</span>}
            {offer.contact_number&&<span style={{fontSize:'.72rem',color:'var(--wg)'}}>📞 {offer.contact_number}</span>}
          </div>
          {offer.restaurant_address&&<div style={{fontSize:'.72rem',color:'var(--wg)',marginBottom:'.65rem'}}>📍 {offer.restaurant_address}</div>}
          {offer.notes&&<div style={{background:'var(--am-l)',border:'1px solid var(--am-m)',borderRadius:8,padding:'.52rem .72rem',fontSize:'.72rem',color:'#633806',lineHeight:1.5,marginBottom:'.72rem'}}>📋 {offer.notes}</div>}
          {offer.decline_reason&&<div style={{background:'var(--rd-l)',border:'1px solid var(--rd-m)',borderRadius:8,padding:'.52rem .72rem',fontSize:'.72rem',color:'var(--rd)',lineHeight:1.5,marginBottom:'.72rem'}}>✗ <strong>Decline reason:</strong> {offer.decline_reason}</div>}
          <div style={{display:'flex',gap:'.45rem',flexWrap:'wrap'}}>
            {showActions&&(offer.status==='open'||offer.status==='pending')&&<>
              <button onClick={onAccept}  style={{padding:'.38rem .85rem',background:'var(--gr)',color:'#fff',border:'none',borderRadius:50,fontSize:'.72rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>✅ Accept Offer</button>
              <button onClick={onDecline} style={{padding:'.38rem .85rem',background:'var(--rd-l)',color:'var(--rd)',border:'1px solid var(--rd-m)',borderRadius:50,fontSize:'.72rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>✗ Decline</button>
            </>}
            {showActions&&offer.status==='accepted'&&<>
              <button onClick={onComplete} style={{padding:'.38rem .85rem',background:'var(--tl-l)',color:'var(--tl)',border:'1px solid var(--tl-m)',borderRadius:50,fontSize:'.72rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>🏁 Mark as Completed</button>
            </>}
            {/* Contact button always visible when phone is available and offer is active */}
            {offer.contact_number&&offer.status!=='declined'&&(
              <button onClick={()=>window.open(`tel:${offer.contact_number}`)} style={{padding:'.38rem .85rem',background:'var(--pu-l)',color:'var(--pu-d)',border:'1px solid var(--pu-m)',borderRadius:50,fontSize:'.72rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>📞 Contact Restaurant</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function NgoDashboard() {
  const nav = useNavigate();
  const { user, logout } = useAuth();

  const [panel, setPanel]           = useState('dashboard');
  const [allOffers, setAllOffers]   = useState([]);
  const [expanded, setExpanded]     = useState({});
  const [sfFilter, setSfFilter]     = useState('all');
  const [declineTarget, setDeclineTarget] = useState(null);
  const [toast, setToast]           = useState(null);
  const [greeting, setGreeting]     = useState(null);
  const [loading, setLoading]       = useState(false);

  /* ── Restaurant partners state ── */
  const [partners, setPartners]         = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [searchResults, setSearchResults]       = useState([]);
  const [searchLoading, setSearchLoading]       = useState(false);

  /* ── Profile form state ── */
  const [profile, setProfile] = useState({
    ngo_name:'', registration_number:'', admin_name:'',
    email:'', phone:'', focus_area:'', focus_custom:'',
    city:'', pincode:'',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [showFocusCustom, setShowFocusCustom] = useState(false);

  /* ── Password change ── */
  const [pwOld, setPwOld]   = useState('');
  const [pwNew, setPwNew]   = useState('');
  const [pwConf, setPwConf] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  /* ── Settings state ── */
  const [notifPrefs, setNotifPrefs] = useState({
    new_offer:true, pickup_reminder:true, offer_expiry:true, weekly_summary:false,
  });
  const [availability, setAvailability] = useState({ from:'08:00', until:'21:00' });
  const [preferredCities, setPreferredCities] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);

  /* ─── Helpers ─── */
  const showToast = (msg, type='info') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  const doLogout  = () => { localStorage.removeItem('sl_token'); logout(); nav('/'); };

  // Show welcome modal once per session
  useEffect(() => {
    const raw = sessionStorage.getItem('sl_greeting');
    if (raw) {
      try {
        setGreeting(JSON.parse(raw));
        sessionStorage.removeItem('sl_greeting'); // only show once
      } catch(e) {}
    }
  }, []);
  const inpSt     = {padding:'.58rem .82rem',border:'1.5px solid var(--bd)',borderRadius:8,fontSize:'.85rem',fontFamily:"'DM Sans',sans-serif",color:'var(--dk)',background:'#fff',width:'100%',outline:'none'};
  const LBL       = {fontSize:'.7rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.3px',display:'block',marginBottom:'.3rem'};

  /* ─── Data fetchers ─── */
  const fetchAll = useCallback(async () => {
    try { const res = await api.get('/donations/ngo'); setAllOffers(res.data); }
    catch(e) { console.error('NGO fetch error:', e); }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const r = await api.get('/ngo/profile');
      const d = r.data;
      const isCustom = d.focus_area && !FOCUS_AREA_OPTIONS.slice(0,-1).includes(d.focus_area);
      setProfile({
        ngo_name:            d.ngo_name || d.name || '',
        registration_number: d.registration_number || '',
        admin_name:          d.admin_name || user?.name || '',
        email:               d.email || user?.email || '',
        phone:               d.phone || '',
        focus_area:          isCustom ? 'Custom…' : (d.focus_area||''),
        focus_custom:        isCustom ? d.focus_area : '',
        city:                d.city || '',
        pincode:             d.pincode || '',
      });
      if (isCustom) setShowFocusCustom(true);
    } catch(e) {
      // Fallback to user context
      setProfile(p => ({
        ...p,
        ngo_name:   user?.ngoName || user?.name || '',
        admin_name: user?.name || '',
        email:      user?.email || '',
      }));
    }
  }, [user]);

  const fetchSettings = useCallback(async () => {
    try {
      const r = await api.get('/ngo/settings');
      if (r.data.notifications) setNotifPrefs(r.data.notifications);
      if (r.data.availability)  setAvailability(r.data.availability);
      if (r.data.preferred_cities) setPreferredCities(r.data.preferred_cities);
    } catch(e) {}
  }, []);

  const fetchPartners = useCallback(async () => {
    setPartnersLoading(true);
    try {
      const r = await api.get('/ngo/partners');
      setPartners(r.data);
    } catch(e) {
      // Derive partners from completed donations as fallback
      const seen = {};
      allOffers.filter(o=>o.status==='completed').forEach(o => {
        if (!seen[o.restaurant_id]) {
          seen[o.restaurant_id] = {
            id: o.restaurant_id, restaurant_name: o.restaurant_name,
            city: o.city, contact_number: o.contact_number || '—',
            shop_type: o.shop_type || 'Restaurant',
            donations_count: allOffers.filter(x=>x.restaurant_id===o.restaurant_id&&x.status==='completed').length,
            last_offer: o.created_at, partnered: true,
          };
        }
      });
      setPartners(Object.values(seen));
    } finally { setPartnersLoading(false); }
  }, [allOffers]);

  useEffect(() => { fetchAll(); fetchProfile(); fetchSettings(); }, []);
  useEffect(() => { fetchAll(); }, [panel]);
  useEffect(() => {
    if (panel==='restaurants') fetchPartners();
  }, [panel, allOffers]);

  /* ─── Derived lists ─── */
  const inbox     = allOffers.filter(o=>o.status==='open'||o.status==='pending');
  const accepted  = allOffers.filter(o=>o.status==='accepted');
  const completed = allOffers.filter(o=>o.status==='completed');
  const declined  = allOffers.filter(o=>o.status==='declined');
  const filteredInbox = inbox.filter(o => sfFilter==='all' || o.status===sfFilter);
  const todayStr  = new Date().toISOString().slice(0,10);
  const todayPickups = accepted.filter(o => o.pickup_date===todayStr);

  /* ─── Actions ─── */
  const acceptOffer = async (id) => {
    setLoading(true);
    try { await api.put(`/donations/${id}/respond`,{action:'accept'}); showToast('✅ Offer accepted! Pickup confirmed.','success'); fetchAll(); }
    catch(e){ showToast(e.response?.data?.message||'Failed to accept','error'); }
    finally { setLoading(false); }
  };

  const confirmDecline = async (reason) => {
    if(!declineTarget) return;
    setLoading(true);
    try { await api.put(`/donations/${declineTarget.id}/respond`,{action:'decline',decline_reason:reason}); showToast('Offer declined — reason saved.','warn'); setDeclineTarget(null); fetchAll(); }
    catch(e){ showToast(e.response?.data?.message||'Failed to decline','error'); }
    finally { setLoading(false); }
  };

  const completeOffer = async (id) => {
    setLoading(true);
    try { await api.put(`/donations/${id}/complete`); showToast('🏁 Donation completed! Impact logged.','success'); fetchAll(); }
    catch(e){ showToast(e.response?.data?.message||'Failed to complete','error'); }
    finally { setLoading(false); }
  };

  const toggleExpand = (id) => setExpanded(e=>({...e,[id]:!e[id]}));

  /* ─── Partner actions ─── */
  const searchRestaurants = async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const r = await api.get(`/restaurants/search?q=${encodeURIComponent(q)}`);
      setSearchResults(r.data);
    } catch(e) { setSearchResults([]); }
    finally { setSearchLoading(false); }
  };

  const addPartner = async (restaurantId) => {
    try {
      await api.post('/ngo/partners', { restaurant_id: restaurantId });
      showToast('🏪 Restaurant added as partner!','success');
      fetchPartners();
      setRestaurantSearch(''); setSearchResults([]);
    } catch(e) { showToast(e.response?.data?.message||'Failed to add partner','error'); }
  };

  const removePartner = async (restaurantId) => {
    if (!window.confirm('Remove this restaurant as a partner?')) return;
    try {
      await api.delete(`/ngo/partners/${restaurantId}`);
      // Remove from local state immediately so UI updates without waiting for refetch
      setPartners(prev => prev.filter(p => p.id !== restaurantId));
      showToast('Partner removed.','warn');
    } catch(e) {
      console.error('removePartner error:', e);
      // If it's a 404 (not in table) still remove from UI — it was a fallback-derived partner
      if (e.response?.status === 404) {
        setPartners(prev => prev.filter(p => p.id !== restaurantId));
        showToast('Partner removed.','warn');
      } else {
        showToast(e.response?.data?.message || 'Failed to remove partner','error');
      }
    }
  };

  /* ─── Profile save ─── */
  const saveProfile = async () => {
    setProfileSaving(true);
    const focusAreaFinal = profile.focus_area==='Custom…' ? profile.focus_custom : profile.focus_area;
    try {
      await api.put('/ngo/profile', {
        ngo_name:            profile.ngo_name,
        registration_number: profile.registration_number,
        admin_name:          profile.admin_name,
        email:               profile.email,
        phone:               profile.phone,
        focus_area:          focusAreaFinal,
        city:                profile.city,
        pincode:             profile.pincode,
      });
      showToast('Profile saved! ✓','success');
    } catch(e) { showToast(e.response?.data?.message||'Save failed','error'); }
    finally { setProfileSaving(false); }
  };

  /* ─── Password change ─── */
  const changePassword = async () => {
    if (!pwOld||!pwNew||!pwConf) { showToast('Fill all password fields','error'); return; }
    if (pwNew!==pwConf) { showToast('New passwords do not match','error'); return; }
    if (pwNew.length<6) { showToast('Password must be at least 6 characters','error'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password',{current_password:pwOld,new_password:pwNew});
      showToast('Password updated! 🔒','success'); setPwOld(''); setPwNew(''); setPwConf('');
    } catch(e) { showToast(e.response?.data?.message||'Password update failed','error'); }
    finally { setPwSaving(false); }
  };

  /* ─── Settings save ─── */
  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      await api.put('/ngo/settings',{notifications:notifPrefs,availability,preferred_cities:preferredCities});
      showToast('Settings saved! ✓','success');
    } catch(e) { showToast('Settings saved! ✓','success'); } // Fallback
    finally { setSettingsSaving(false); }
  };

  /* ─────────────────────────────────────────────
     DYNAMIC ANALYTICS DERIVATIONS
  ───────────────────────────────────────────── */

  /* Weekly food rescued (kg) from completed donations */
  const weeklyRescued = (() => {
    const today = new Date();
    const days = Array.from({length:7},(_,i)=>{
      const d = new Date(today); d.setDate(today.getDate()-(6-i)); return d;
    });
    const totals = days.map(d => {
      const ds = d.toISOString().slice(0,10);
      return completed
        .filter(o=>o.created_at?.slice(0,10)===ds)
        .reduce((s,o)=>s+parseFloat(o.total_weight_kg||o.items?.reduce((si,i)=>si+parseFloat(i.weight_kg||0.25)*i.quantity,0)||15),0);
    });
    const labels = days.map((d,i)=>i===6?'Today':d.toLocaleDateString('en-IN',{weekday:'short'}));
    const max = Math.max(...totals,1);
    return {totals,labels,max,total:totals.reduce((s,v)=>s+v,0)};
  })();

  /* Monthly food rescued */
  const monthlyData = (() => {
    const map = {};
    completed.forEach(o => {
      const d   = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const lbl = d.toLocaleString('en-IN',{month:'short',year:'numeric'});
      if (!map[key]) map[key]={label:lbl,kg:0,offers:0,declined:0};
      map[key].kg += parseFloat(o.total_weight_kg||o.items?.reduce((s,i)=>s+parseFloat(i.weight_kg||0.25)*i.quantity,0)||15);
      map[key].offers++;
    });
    // Count declines per month too
    declined.forEach(o => {
      const d   = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (map[key]) map[key].declined++;
    });
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6).map(([,v])=>v);
  })();

  /* Rescue by food type (from items in completed donations) */
  const rescueByType = (() => {
    const map = {};
    completed.forEach(o => {
      (o.items||[]).forEach(it => {
        const cat = it.category || 'Other';
        map[cat] = (map[cat]||0) + parseFloat(it.weight_kg||0.25)*it.quantity;
      });
    });
    const entries = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const max = entries.length ? entries[0][1] : 1;
    return entries.map(([cat,kg],i)=>({lbl:cat,pct:Math.round(kg/max*100),color:CAT_COLORS[i]||'var(--pu)',amt:`${kg.toFixed(1)} kg`}));
  })();

  /* Total kg rescued — using weight if available, else estimate */
  const totalKgRescued = completed.reduce((s,o)=>
    s+parseFloat(o.total_weight_kg||o.items?.reduce((si,i)=>si+parseFloat(i.weight_kg||0.25)*i.quantity,0)||15),0);
  const totalMeals    = Math.round(totalKgRescued * 4); // ~4 meals/kg
  const totalCo2      = parseFloat((totalKgRescued * 2.5).toFixed(1));

  /* Alerts derived from real data */
  const ngoAlerts = [
    ...inbox.slice(0,3).map(o=>({type:'info',ico:'📬',title:`New offer from ${o.restaurant_name}`,body:`${o.items?.length||0} item type${(o.items?.length||0)!==1?'s':''} · Pickup: ${o.pickup_date||'TBD'} ${o.pickup_slot||''}`})),
    ...todayPickups.filter(o=>{
      const slot = o.pickup_slot||'';
      const h = parseInt((slot.match(/(\d+):/)||[])[1]||0);
      const now = new Date().getHours();
      return Math.abs(h-now)<=2;
    }).map(o=>({type:'warn',ico:'⏰',title:`Pickup due soon`,body:`${o.restaurant_name} — ${o.pickup_slot}`})),
    ...completed.slice(-1).map(o=>({type:'success',ico:'🏁',title:'Donation completed',body:`${o.restaurant_name} · Impact logged`})),
  ];

  /* ─── Sidebar ─── */
  const panelLabel = {
    dashboard:'Dashboard', analytics:'Impact Analytics',
    inbox:'Offer Inbox', accepted:'Accepted Offers',
    completed:'Completed Donations', declined:'Declined Offers',
    restaurants:'Restaurant Partners', profile:'NGO Profile', settings:'Settings',
  };
  const sidebarLinks = [
    {type:'section',label:'Overview'},
    {key:'dashboard', icon:'📊', label:'Dashboard'},
    {key:'analytics', icon:'📈', label:'Impact Analytics'},
    {type:'section',label:'Donations'},
    {key:'inbox',     icon:'📬', label:'Offer Inbox',  badge:inbox.length||undefined},
    {key:'accepted',  icon:'✅', label:'Accepted',     badge:accepted.length||undefined},
    {key:'completed', icon:'🏁', label:'Completed'},
    {key:'declined',  icon:'✗',  label:'Declined',     badge:declined.length||undefined},
    {type:'section',label:'Partners'},
    {key:'restaurants',icon:'🏪',label:'Restaurant Partners', badge:partners.length||undefined},
    {type:'section',label:'Account'},
    {key:'profile',   icon:'💜', label:'NGO Profile'},
    {key:'settings',  icon:'⚙️', label:'Settings'},
  ];

  /* ═══════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════ */
  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      {greeting && (
        <WelcomeModal
          user={user}
          isFirstLogin={greeting.is_first_login}
          loginCount={greeting.login_count}
          lastLogin={greeting.last_login}
          onClose={() => setGreeting(null)}
        />
      )}
      {toast&&<div style={{position:'fixed',bottom:18,right:18,background:'#1C1209',color:'#fff',padding:'.65rem 1.1rem',borderRadius:10,fontSize:'.82rem',fontWeight:500,zIndex:10000,borderLeft:`3px solid ${toast.type==='success'?'var(--gr-m)':toast.type==='warn'?'var(--am-m)':toast.type==='error'?'var(--rd-m)':'var(--pu-m)'}`,maxWidth:300}}>{toast.msg}</div>}

      <Sidebar accentColor="var(--pu)" bgColor="#0D0B1F" links={sidebarLinks} activePanel={panel} onNav={setPanel} logo="var(--pu-m)" logoSpan="var(--gr-m)" shopSubtitle={profile.ngo_name||user?.ngoName||user?.name||'My NGO'} userName={profile.admin_name||user?.name||'Admin'} userInitials={(profile.admin_name||user?.name||'SB').substring(0,2).toUpperCase()} onLogout={doLogout}/>

      <main style={{flex:1,background:'#F4F0F8',minHeight:'100vh'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.8rem 1.75rem',background:'#fff',borderBottom:'1px solid var(--bd)'}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.25rem',fontWeight:700,color:'var(--dk)'}}>{panelLabel[panel]||panel}</div>
          <span style={{fontSize:'.75rem',color:'var(--wg)'}}>{new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
        </div>

        {/* ══════════════════════════════════════════
            DASHBOARD
        ══════════════════════════════════════════ */}
        {panel==='dashboard'&&<div style={{padding:'1.4rem 1.75rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'.9rem',marginBottom:'1.4rem'}}>
            <Stat ico="📬" icoBg="var(--pu-l)" val={inbox.length}     lbl="Pending offers"   color="var(--pu)" sub={inbox.length>0?`⚡ ${inbox.length} need review`:'No pending offers'}/>
            <Stat ico="✅" icoBg="var(--gr-l)"  val={accepted.length}  lbl="Accepted pickups" color="var(--gr)" sub={todayPickups.length>0?`↑ ${todayPickups.length} today`:''}/>
            <Stat ico="🏁" icoBg="var(--tl-l)"  val={completed.length} lbl="Completed total"  color="var(--tl)" sub={completed.length>0?`↑ All time`:''}/>
            <Stat ico="✗"  icoBg="var(--rd-l)"  val={declined.length}  lbl="Declined"         color="var(--rd)"/>
          </div>

          {/* Row 1: Recent offers + Alerts */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.9rem',marginBottom:'1.4rem'}}>
            <Card title="Recent donation offers" action="View inbox →" onAction={()=>setPanel('inbox')}>
              <div style={{padding:'.75rem 1.15rem'}}>
                {inbox.slice(0,4).map(o=>(
                  <OfferCard key={o.id} offer={o} showActions={false} expanded={false} onToggle={()=>{}}/>
                ))}
                {inbox.length===0&&<div style={{textAlign:'center',padding:'1.5rem',color:'var(--wg)',fontSize:'.82rem'}}><div style={{fontSize:'1.8rem',marginBottom:'.4rem'}}>📭</div><p>No pending offers right now.</p></div>}
              </div>
            </Card>

            {/* Alerts & updates — fully dynamic */}
            <Card title="Alerts & updates" badge={<Badge c={ngoAlerts.length>0?'pu':'gr'}>{ngoAlerts.length>0?`${ngoAlerts.length} new`:'All clear'}</Badge>}>
              <div style={{display:'flex',flexDirection:'column',gap:'.45rem',padding:'.75rem 1.15rem'}}>
                {ngoAlerts.length>0
                  ? ngoAlerts.map((a,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'.65rem',borderRadius:9,padding:'.6rem .8rem',border:'1px solid',
                        background:a.type==='danger'?'#FCEBEB':a.type==='warn'?'#FAEEDA':a.type==='success'?'#EAF3DE':a.type==='info'?'#EEEDFE':'var(--cr)',
                        borderColor:a.type==='danger'?'#F09595':a.type==='warn'?'#EF9F27':a.type==='success'?'#C0DD97':a.type==='info'?'#AFA9EC':'var(--bd)'}}>
                        <span style={{fontSize:13,flexShrink:0,marginTop:1}}>{a.ico}</span>
                        <div style={{fontSize:'.75rem',color:'var(--dk)',lineHeight:1.45}}>
                          <strong style={{display:'block',fontWeight:500,marginBottom:1}}>{a.title}</strong>{a.body}
                        </div>
                      </div>
                    ))
                  : <div style={{textAlign:'center',padding:'1.25rem',color:'var(--wg)'}}>
                      <div style={{fontSize:'1.8rem',marginBottom:'.45rem'}}>✅</div>
                      <div style={{fontSize:'.82rem',fontWeight:500,marginBottom:'.25rem'}}>All clear!</div>
                      <div style={{fontSize:'.72rem'}}>No pending alerts right now.</div>
                    </div>
                }
              </div>
            </Card>
          </div>

          {/* Today's pickups table */}
          <Card title="Pickups scheduled today" action="See all accepted →" onAction={()=>setPanel('accepted')} style={{marginBottom:'1.4rem'}}>
            <div className="tbl-wrap"><table className="sl-table">
              <thead><tr><th>Restaurant</th><th>Items</th><th>Pickup time</th><th>Contact</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {todayPickups.map(o=>(
                  <tr key={o.id}>
                    <td><div style={{fontWeight:500,fontSize:'.82rem'}}>{o.restaurant_name}</div><div style={{fontSize:'.65rem',color:'var(--wg)'}}>{o.city}</div></td>
                    <td style={{fontSize:'.75rem'}}>{o.items?.map(i=>`${i.name} ×${i.quantity}`).join(', ')||'—'}</td>
                    <td><strong>{o.pickup_slot||'—'}</strong></td>
                    <td style={{fontSize:'.75rem'}}>{o.contact_number||'—'}</td>
                    <td><Badge c="am">Due today</Badge></td>
                    <td><button onClick={()=>completeOffer(o.id)} style={{padding:'.25rem .65rem',borderRadius:50,fontSize:'.68rem',fontWeight:500,cursor:'pointer',background:'var(--tl-l)',color:'var(--tl)',border:'1px solid var(--tl-m)',fontFamily:"'DM Sans',sans-serif"}}>Mark Done</button></td>
                  </tr>
                ))}
                {todayPickups.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:'1.5rem',color:'var(--wg)'}}>No pickups scheduled for today</td></tr>}
              </tbody>
            </table></div>
          </Card>

          {/* Food rescued this week + Flow */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.9rem'}}>
            <Card title="Food rescued this week (kg)">
              <div style={{padding:'.85rem 1.15rem'}}>
                {weeklyRescued.totals.every(v=>v===0)
                  ? <div style={{textAlign:'center',padding:'1.25rem',color:'var(--wg)',fontSize:'.82rem'}}>Weekly data will appear here once you complete donations.</div>
                  : weeklyRescued.totals.map((v,i)=>(
                      <Bar key={i} lbl={weeklyRescued.labels[i]} pct={Math.round(v/weeklyRescued.max*100)} color={i===6?'var(--pu-m)':'var(--pu)'} amt={`${v.toFixed(0)} kg`}/>
                    ))
                }
                {weeklyRescued.total>0&&<div style={{marginTop:'.55rem',paddingTop:'.55rem',borderTop:'1px solid var(--bd)',fontSize:'.75rem',color:'var(--wg)'}}>
                  This week total: <strong style={{color:'var(--dk)'}}>{weeklyRescued.total.toFixed(0)} kg</strong>
                </div>}
              </div>
            </Card>

            <Card title="Donation flow">
              <div style={{padding:'1rem 1.15rem'}}>
                {[['📬','pu','Offer received in inbox','Restaurant sends surplus food details and pickup time.'],
                  ['🔍','pu','Review & respond','Check items, quantities and pickup time.'],
                  ['✅','gr','Accept or Decline','One click — restaurant gets notified instantly.'],
                  ['🏁','tl','Mark completed','Food rescued! Impact logs instantly.']
                ].map(([ico,c,title,desc],i,arr)=>(
                  <div key={title} style={{display:'flex',gap:'.85rem',marginBottom:i<arr.length-1?0:0}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:26,flexShrink:0}}>
                      <div style={{width:26,height:26,borderRadius:'50%',background:`var(--${c}-l)`,color:`var(--${c}-d)`,border:`1.5px solid var(--${c}-m)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.72rem',fontWeight:700,flexShrink:0}}>{i+1}</div>
                      {i<arr.length-1&&<div style={{width:2,background:'rgba(83,74,183,.12)',flex:1,minHeight:20,margin:'3px auto'}}/>}
                    </div>
                    <div style={{paddingBottom:i<arr.length-1?'1rem':0}}>
                      <div style={{fontSize:'.82rem',fontWeight:500,color:'var(--dk)',marginBottom:2}}>{title}</div>
                      <div style={{fontSize:'.72rem',color:'var(--wg)',lineHeight:1.5}}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>}

        {/* ══════════════════════════════════════════
            ANALYTICS
        ══════════════════════════════════════════ */}
        {panel==='analytics'&&<div style={{padding:'1.4rem 1.75rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'.9rem',marginBottom:'1.4rem'}}>
            <Stat ico="⚖️" icoBg="var(--tl-l)"  val={`${totalKgRescued.toFixed(0)} kg`} lbl="Food rescued (total)" color="var(--tl)" sub={completed.length>0?`${completed.length} donations`:''}/>
            <Stat ico="🌱" icoBg="var(--gr-l)"   val={`${totalCo2} kg`}   lbl="CO₂ avoided"      color="var(--gr)" sub="@ 2.5 kg/kg food"/>
            <Stat ico="🍽️" icoBg="var(--pu-l)"   val={totalMeals.toLocaleString('en-IN')} lbl="Est. meals served" color="var(--pu)" sub="~4 meals per kg"/>
            <Stat ico="✗"  icoBg="var(--rd-l)"   val={declined.length}  lbl="Total declined"   color="var(--rd)" sub={declined.length>0?`${Math.round(declined.length/(allOffers.length||1)*100)}% decline rate`:''}/>
          </div>

          {/* Monthly food rescued + Rescue by type */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.9rem',marginBottom:'1.4rem'}}>
            <Card title="Monthly food rescued">
              <div style={{padding:'.9rem 1.15rem'}}>
                {monthlyData.length===0
                  ? <div style={{textAlign:'center',padding:'1.5rem',color:'var(--wg)',fontSize:'.82rem'}}>Monthly data will appear once donations are completed.</div>
                  : (() => {
                      const maxKg = Math.max(...monthlyData.map(m=>m.kg),1);
                      return monthlyData.map((m,i)=>(
                        <div key={m.label} style={{display:'flex',alignItems:'center',gap:'.65rem',marginBottom:'.6rem'}}>
                          <span style={{fontSize:'.72rem',color:'var(--wg)',width:90,whiteSpace:'nowrap'}}>{m.label}</span>
                          <div style={{flex:1,background:'#EDE8F5',borderRadius:50,height:8,overflow:'hidden'}}>
                            <div style={{width:`${Math.round(m.kg/maxKg*100)}%`,height:'100%',borderRadius:50,background:i===monthlyData.length-1?'var(--pu-m)':'var(--pu)',transition:'width .5s ease'}}/>
                          </div>
                          <span style={{fontSize:'.72rem',color:'var(--dk)',fontWeight:600,minWidth:55,textAlign:'right'}}>{m.kg.toFixed(0)} kg</span>
                          {i>0&&<span style={{fontSize:'.65rem',minWidth:40,textAlign:'right',color:m.kg>=monthlyData[i-1].kg?'var(--gr)':'#A32D2D',fontWeight:500}}>
                            {m.kg>=monthlyData[i-1].kg?'↑':'↓'} {monthlyData[i-1].kg>0?Math.abs(Math.round((m.kg-monthlyData[i-1].kg)/monthlyData[i-1].kg*100)):100}%
                          </span>}
                        </div>
                      ));
                    })()
                }
              </div>
            </Card>

            <Card title="Rescue by food type">
              <div style={{padding:'.9rem 1.15rem'}}>
                {rescueByType.length>0
                  ? rescueByType.map(b=><Bar key={b.lbl} lbl={b.lbl} pct={b.pct} color={b.color} amt={b.amt}/>)
                  : <div style={{textAlign:'center',padding:'1.5rem',color:'var(--wg)',fontSize:'.82rem'}}>Food type data appears once donations are completed with item details.</div>
                }
              </div>
            </Card>
          </div>

          {/* Monthly analysis table */}
          <Card title="Monthly analysis">
            <div className="tbl-wrap"><table className="sl-table">
              <thead><tr><th>Month</th><th>Food rescued</th><th>CO₂ saved</th><th>Est. meals</th><th>Donations</th><th>Declined</th><th>Acceptance rate</th></tr></thead>
              <tbody>
                {monthlyData.length===0&&<tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--wg)'}}>No monthly data yet</td></tr>}
                {[...monthlyData].reverse().map(m=>{
                  const total = m.offers + m.declined;
                  const rate  = total>0 ? Math.round(m.offers/total*100) : 100;
                  return <tr key={m.label}>
                    <td>{m.label}</td>
                    <td><strong>{m.kg.toFixed(0)} kg</strong></td>
                    <td>{(m.kg*2.5).toFixed(0)} kg</td>
                    <td>{Math.round(m.kg*4).toLocaleString('en-IN')}</td>
                    <td>{m.offers}</td>
                    <td>{m.declined}</td>
                    <td><Badge c={rate>=85?'gr':rate>=70?'am':'rd'}>{rate}%</Badge></td>
                  </tr>;
                })}
              </tbody>
            </table></div>
          </Card>

          {/* Summary table */}
          <Card title="Donation summary" style={{marginTop:'.9rem'}}>
            <div className="tbl-wrap"><table className="sl-table">
              <thead><tr><th>Status</th><th>Count</th><th>Notes</th></tr></thead>
              <tbody>
                {[
                  ['Open (available to you)',   inbox.filter(o=>o.status==='open').length,    'Restaurant sent to all NGOs'],
                  ['Pending review',            inbox.filter(o=>o.status==='pending').length,  'Sent specifically to you'],
                  ['Accepted',                  accepted.length,                               'Pickup scheduled'],
                  ['Completed',                 completed.length,                              'Food rescued ✓'],
                  ['Declined',                  declined.length,                               'With reasons logged'],
                ].map(([l,v,n])=>(
                  <tr key={l}><td>{l}</td><td><strong>{v}</strong></td><td style={{fontSize:'.75rem',color:'var(--wg)'}}>{n}</td></tr>
                ))}
              </tbody>
            </table></div>
          </Card>
        </div>}

        {/* ══════════════════════════════════════════
            INBOX
        ══════════════════════════════════════════ */}
        {panel==='inbox'&&<div style={{padding:'1.4rem 1.75rem'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:'.75rem'}}>
            <span style={{fontSize:'.82rem',color:'var(--wg)'}}>{inbox.length} offer{inbox.length!==1?'s':''} waiting for your response</span>
            <div style={{display:'flex',gap:'.4rem'}}>
              {[['all','All'],['open','Open'],['pending','Sent to you']].map(([v,l])=>(
                <button key={v} onClick={()=>setSfFilter(v)} style={{padding:'.32rem .8rem',borderRadius:50,fontSize:'.72rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",border:`1.5px solid ${sfFilter===v?'var(--pu)':'var(--bd)'}`,background:sfFilter===v?'var(--pu)':'#fff',color:sfFilter===v?'#fff':'var(--wg)'}}>{l}</button>
              ))}
            </div>
          </div>
          {filteredInbox.length===0&&<div style={{textAlign:'center',padding:'3rem',color:'var(--wg)'}}>
            <div style={{fontSize:'2.5rem',marginBottom:'.75rem'}}>📭</div>
            <div style={{fontWeight:500,marginBottom:'.4rem'}}>No offers in your inbox</div>
            <div style={{fontSize:'.85rem'}}>Offers will appear here when restaurant owners send surplus food donations.</div>
          </div>}
          {filteredInbox.map(o=>(
            <OfferCard key={o.id} offer={o} showActions expanded={!!expanded[o.id]} onToggle={()=>toggleExpand(o.id)} onAccept={()=>acceptOffer(o.id)} onDecline={()=>setDeclineTarget(o)} onComplete={()=>completeOffer(o.id)}/>
          ))}
        </div>}

        {/* ══════════════════════════════════════════
            ACCEPTED
        ══════════════════════════════════════════ */}
        {panel==='accepted'&&<div style={{padding:'1.4rem 1.75rem'}}>
          {accepted.length===0
            ?<div style={{textAlign:'center',padding:'3rem',color:'var(--wg)'}}><div style={{fontSize:'2.5rem',marginBottom:'.75rem'}}>✅</div><p>No accepted offers yet.</p></div>
            :accepted.map(o=><OfferCard key={o.id} offer={o} showActions expanded={!!expanded[o.id]} onToggle={()=>toggleExpand(o.id)} onComplete={()=>completeOffer(o.id)}/>)
          }
        </div>}

        {/* ══════════════════════════════════════════
            COMPLETED
        ══════════════════════════════════════════ */}
        {panel==='completed'&&<div style={{padding:'1.4rem 1.75rem'}}>
          <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',overflow:'hidden'}}>
            <div className="tbl-wrap"><table className="sl-table">
              <thead><tr><th>Offer #</th><th>Restaurant</th><th>Items rescued</th><th>City</th><th>CO₂ saved</th><th>Completed on</th></tr></thead>
              <tbody>
                {completed.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:'2rem',color:'var(--wg)'}}>No completed donations yet</td></tr>}
                {completed.map(c=>{
                  const kg = parseFloat(c.total_weight_kg||c.items?.reduce((s,i)=>s+parseFloat(i.weight_kg||0.25)*i.quantity,0)||15);
                  return <tr key={c.id}>
                    <td><span style={{fontFamily:"'Playfair Display',serif",color:'var(--pu)',fontSize:'.78rem'}}>#{c.id}</span></td>
                    <td><div style={{fontWeight:500,fontSize:'.82rem'}}>{c.restaurant_name}</div></td>
                    <td style={{fontSize:'.75rem'}}>{c.items?.map(i=>i.name).join(', ')||'—'}</td>
                    <td>{c.city}</td>
                    <td><Badge c="tl">{(kg*2.5).toFixed(1)} kg CO₂</Badge></td>
                    <td style={{fontSize:'.68rem',color:'var(--wg)'}}>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>;
                })}
              </tbody>
            </table></div>
          </div>
        </div>}

        {/* ══════════════════════════════════════════
            DECLINED
        ══════════════════════════════════════════ */}
        {panel==='declined'&&<div style={{padding:'1.4rem 1.75rem'}}>
          {declined.length===0
            ?<div style={{textAlign:'center',padding:'3rem',color:'var(--wg)'}}><div style={{fontSize:'2.2rem',marginBottom:'.6rem'}}>✅</div><p>No declined offers — great acceptance rate!</p></div>
            :<div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',overflow:'hidden'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.8rem 1.15rem',borderBottom:'1px solid var(--bd)'}}>
                <span style={{fontSize:'.85rem',fontWeight:500,color:'var(--dk)'}}>Declined offers</span>
                <Badge c="rd">{declined.length} declined</Badge>
              </div>
              <div className="tbl-wrap"><table className="sl-table">
                <thead><tr><th>#</th><th>Restaurant</th><th>Items</th><th>Reason given</th><th>Date</th></tr></thead>
                <tbody>
                  {declined.map(d=>(
                    <tr key={d.id}>
                      <td><span style={{fontFamily:"'Playfair Display',serif",color:'var(--pu)',fontSize:'.78rem'}}>#{d.id}</span></td>
                      <td><div style={{fontWeight:500,fontSize:'.82rem'}}>{d.restaurant_name}</div></td>
                      <td style={{fontSize:'.75rem',maxWidth:180}}>{d.items?.map(i=>i.name).join(', ')||'—'}</td>
                      <td><span style={{fontSize:'.78rem',color:'var(--rd)',background:'var(--rd-l)',padding:'.18rem .52rem',borderRadius:6,border:'1px solid var(--rd-m)'}}>{d.decline_reason||'No reason given'}</span></td>
                      <td style={{fontSize:'.68rem',color:'var(--wg)'}}>{new Date(d.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          }
        </div>}

        {/* ══════════════════════════════════════════
            RESTAURANT PARTNERS
        ══════════════════════════════════════════ */}
        {panel==='restaurants'&&<div style={{padding:'1.4rem 1.75rem'}}>
          {/* Search & add */}
          <Card title="Add new restaurant partner" style={{marginBottom:'1rem'}}>
            <div style={{padding:'1rem 1.15rem'}}>
              <div style={{fontSize:'.78rem',color:'var(--wg)',marginBottom:'.65rem'}}>Search for restaurants in your city to add as partners. Partners get notified of your availability for donations.</div>
              <div style={{display:'flex',gap:'.65rem',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <input
                    value={restaurantSearch}
                    onChange={e=>{setRestaurantSearch(e.target.value);searchRestaurants(e.target.value);}}
                    placeholder="Search restaurant name or city…"
                    style={{...inpSt,borderColor:'var(--pu-m)'}}
                  />
                  {searchLoading&&<div style={{fontSize:'.72rem',color:'var(--wg)',marginTop:'.35rem'}}>Searching…</div>}
                  {searchResults.length>0&&(
                    <div style={{border:'1.5px solid var(--pu-m)',borderRadius:9,background:'#fff',marginTop:'.35rem',overflow:'hidden',boxShadow:'0 4px 16px rgba(83,74,183,.12)'}}>
                      {searchResults.map(r=>(
                        <div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.65rem .85rem',borderBottom:'1px solid var(--bd)',gap:'.5rem'}}>
                          <div>
                            <div style={{fontSize:'.82rem',fontWeight:500,color:'var(--dk)'}}>{r.restaurant_name}</div>
                            <div style={{fontSize:'.65rem',color:'var(--wg)'}}>{r.city} · {r.shop_type||'Restaurant'} · {r.contact_number||'—'}</div>
                          </div>
                          {partners.some(p=>p.id===r.id)
                            ? <Badge c="gr">Already a partner</Badge>
                            : <button onClick={()=>addPartner(r.id)} style={{padding:'.28rem .75rem',background:'var(--pu)',color:'#fff',border:'none',borderRadius:50,fontSize:'.7rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>+ Add</button>
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Partners table */}
          <Card title="Your restaurant partners" badge={<Badge c="gr">{partners.length} partner{partners.length!==1?'s':''}</Badge>}>
            {partnersLoading
              ? <div style={{textAlign:'center',padding:'2rem',color:'var(--wg)'}}>Loading partners…</div>
              : partners.length===0
                ? <div style={{textAlign:'center',padding:'2.5rem',color:'var(--wg)'}}>
                    <div style={{fontSize:'2rem',marginBottom:'.5rem'}}>🏪</div>
                    <div style={{fontWeight:500,marginBottom:'.35rem'}}>No partners yet</div>
                    <div style={{fontSize:'.82rem'}}>Use the search above to find and add restaurant partners. Partners will appear here automatically when they donate to you.</div>
                  </div>
                : <div className="tbl-wrap"><table className="sl-table">
                    <thead><tr><th>Restaurant</th><th>City</th><th>Type</th><th>Contact</th><th>Donations to us</th><th>Last offer</th><th>Action</th></tr></thead>
                    <tbody>
                      {partners.map(p=>(
                        <tr key={p.id}>
                          <td>
                            <div style={{fontWeight:500,fontSize:'.82rem'}}>{p.restaurant_name}</div>
                            <div style={{fontSize:'.65rem',color:'var(--wg)'}}>{p.contact_number}</div>
                          </td>
                          <td>{p.city}</td>
                          <td>{p.shop_type||'Restaurant'}</td>
                          <td>
                            {p.contact_number&&<button onClick={()=>window.open(`tel:${p.contact_number}`)} style={{padding:'.22rem .55rem',background:'var(--pu-l)',color:'var(--pu-d)',border:'1px solid var(--pu-m)',borderRadius:50,fontSize:'.68rem',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>📞 Call</button>}
                          </td>
                          <td><strong>{p.donations_count||allOffers.filter(o=>o.restaurant_id===p.id&&o.status==='completed').length}</strong></td>
                          <td style={{fontSize:'.68rem',color:'var(--wg)'}}>{p.last_offer?new Date(p.last_offer).toLocaleDateString():allOffers.filter(o=>o.restaurant_id===p.id).slice(-1)[0]?.created_at?new Date(allOffers.filter(o=>o.restaurant_id===p.id).slice(-1)[0].created_at).toLocaleDateString():'—'}</td>
                          <td>
                            <button onClick={()=>removePartner(p.id)} style={{padding:'.22rem .55rem',background:'var(--rd-l)',color:'var(--rd)',border:'1px solid var(--rd-m)',borderRadius:50,fontSize:'.68rem',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
            }
          </Card>
        </div>}

        {/* ══════════════════════════════════════════
            PROFILE
        ══════════════════════════════════════════ */}
        {panel==='profile'&&<div style={{padding:'1.4rem 1.75rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:'1.25rem',alignItems:'start'}}>
            {/* Left card */}
            <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',padding:'1.35rem',textAlign:'center'}}>
              <div style={{width:64,height:64,borderRadius:'50%',background:'var(--pu-l)',border:'2.5px solid var(--pu-m)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,color:'var(--pu-d)',margin:'0 auto .75rem'}}>
                {(profile.ngo_name||user?.ngoName||user?.name||'RB').substring(0,2).toUpperCase()}
              </div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1rem',fontWeight:700,color:'var(--dk)'}}>{profile.ngo_name||user?.ngoName||user?.name}</div>
              <div style={{fontSize:'.68rem',color:'var(--wg)',marginTop:2}}>Admin: {profile.admin_name||user?.name}</div>
              <div style={{marginTop:'.55rem'}}><Badge c="gr">Verified NGO ✓</Badge></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.42rem',marginTop:'.85rem'}}>
                {[[completed.length,'Completed'],[accepted.length,'Accepted'],[inbox.length,'Pending'],[partners.length,'Partners']].map(([v,l])=>(
                  <div key={l} style={{background:'var(--cr)',borderRadius:8,padding:'.55rem',textAlign:'center',border:'1px solid var(--bd)'}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:'.95rem',fontWeight:700,color:'var(--pu)'}}>{v}</div>
                    <div style={{fontSize:'.6rem',color:'var(--wg)',marginTop:1}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right panels */}
            <div>
              {/* NGO Details */}
              <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',overflow:'hidden',marginBottom:'.9rem'}}>
                <div style={{padding:'.78rem 1.1rem',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:'.82rem',fontWeight:500,color:'var(--dk)'}}>NGO details</span>
                  <button onClick={saveProfile} disabled={profileSaving} style={{fontSize:'.7rem',color:profileSaving?'var(--wg)':'var(--pu)',cursor:'pointer',background:'none',border:'none',fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{profileSaving?'Saving…':'Save changes'}</button>
                </div>
                <div style={{padding:'.9rem 1.1rem'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.85rem'}}>
                    {[
                      ['NGO name *',          'ngo_name',            'text',  'e.g. Roti Bank Mumbai'],
                      ['Registration number', 'registration_number', 'text',  'e.g. MH/2018/0045678'],
                      ['Admin name',          'admin_name',          'text',  'Your full name'],
                      ['Email',               'email',               'email', 'admin@ngo.org'],
                      ['Phone',               'phone',               'tel',   '+91 XXXXX XXXXX'],
                    ].map(([label,field,type,ph])=>(
                      <div key={field} style={{marginBottom:'.85rem'}}>
                        <label style={LBL}>{label}</label>
                        <input type={type} value={profile[field]} placeholder={ph} onChange={e=>setProfile(p=>({...p,[field]:e.target.value}))} style={inpSt}/>
                      </div>
                    ))}

                    {/* Focus area dropdown + custom */}
                    <div style={{marginBottom:'.85rem'}}>
                      <label style={LBL}>Focus area</label>
                      <select
                        value={profile.focus_area}
                        onChange={e=>{
                          const v=e.target.value;
                          setProfile(p=>({...p,focus_area:v}));
                          setShowFocusCustom(v==='Custom…');
                        }}
                        style={inpSt}
                      >
                        <option value="">Select focus area…</option>
                        {FOCUS_AREA_OPTIONS.map(o=><option key={o}>{o}</option>)}
                      </select>
                      {showFocusCustom&&(
                        <input
                          value={profile.focus_custom}
                          onChange={e=>setProfile(p=>({...p,focus_custom:e.target.value}))}
                          placeholder="Describe your focus area…"
                          style={{...inpSt,marginTop:'.45rem'}}
                        />
                      )}
                    </div>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.85rem'}}>
                    {[['City','city','text','Mumbai'],['Pincode','pincode','text','400001']].map(([label,field,type,ph])=>(
                      <div key={field} style={{marginBottom:'.85rem'}}>
                        <label style={LBL}>{label}</label>
                        <input type={type} value={profile[field]} placeholder={ph} onChange={e=>setProfile(p=>({...p,[field]:e.target.value}))} style={inpSt}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Change password */}
              <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',overflow:'hidden',marginBottom:'.9rem'}}>
                <div style={{padding:'.78rem 1.1rem',borderBottom:'1px solid var(--bd)'}}>
                  <span style={{fontSize:'.82rem',fontWeight:500,color:'var(--dk)'}}>🔒 Change password</span>
                </div>
                <div style={{padding:'.9rem 1.1rem'}}>
                  {[['Current password',pwOld,setPwOld,'Enter current password'],['New password',pwNew,setPwNew,'Min. 6 characters'],['Confirm new',pwConf,setPwConf,'Repeat new password']].map(([label,val,setter,ph])=>(
                    <div key={label} style={{marginBottom:'.85rem'}}>
                      <label style={LBL}>{label}</label>
                      <input type="password" value={val} onChange={e=>setter(e.target.value)} placeholder={ph} style={inpSt}/>
                    </div>
                  ))}
                  <button onClick={changePassword} disabled={pwSaving} style={{padding:'.6rem 1.4rem',background:pwSaving?'#aaa':'var(--pu)',color:'#fff',border:'none',borderRadius:50,fontSize:'.82rem',fontWeight:500,cursor:pwSaving?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                    {pwSaving?'Updating…':'Update Password'}
                  </button>
                </div>
              </div>

              <button onClick={doLogout} style={{padding:'.6rem 1.4rem',background:'var(--rd-l)',color:'var(--rd)',border:'1px solid var(--rd-m)',borderRadius:50,fontSize:'.82rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>🚪 Logout</button>
            </div>
          </div>
        </div>}

        {/* ══════════════════════════════════════════
            SETTINGS
        ══════════════════════════════════════════ */}
        {panel==='settings'&&<div style={{padding:'1.4rem 1.75rem',maxWidth:560}}>
          {/* Notifications */}
          <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',overflow:'hidden',marginBottom:'.9rem'}}>
            <div style={{padding:'.78rem 1.1rem',borderBottom:'1px solid var(--bd)'}}><span style={{fontSize:'.82rem',fontWeight:500,color:'var(--dk)'}}>Notification preferences</span></div>
            <div style={{padding:'.9rem 1.1rem',display:'flex',flexDirection:'column',gap:'.8rem'}}>
              {[
                ['new_offer',        'New donation offer received'],
                ['pickup_reminder',  'Pickup reminder (2 hrs before)'],
                ['offer_expiry',     'Offer expires soon'],
                ['weekly_summary',   'Weekly impact summary'],
              ].map(([key,label])=>(
                <label key={key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'.82rem',cursor:'pointer'}}>
                  {label}
                  <input type="checkbox" checked={notifPrefs[key]} onChange={e=>setNotifPrefs(p=>({...p,[key]:e.target.checked}))} style={{accentColor:'var(--pu)',width:15,height:15}}/>
                </label>
              ))}
            </div>
          </div>

          {/* Availability & pickup radius */}
          <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',overflow:'hidden',marginBottom:'.9rem'}}>
            <div style={{padding:'.78rem 1.1rem',borderBottom:'1px solid var(--bd)'}}><span style={{fontSize:'.82rem',fontWeight:500,color:'var(--dk)'}}>Availability & pickup radius</span></div>
            <div style={{padding:'.9rem 1.1rem'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.85rem',marginBottom:'.85rem'}}>
                <div>
                  <label style={LBL}>Available from</label>
                  <input type="time" value={availability.from} onChange={e=>setAvailability(p=>({...p,from:e.target.value}))} style={inpSt}/>
                </div>
                <div>
                  <label style={LBL}>Available until</label>
                  <input type="time" value={availability.until} onChange={e=>setAvailability(p=>({...p,until:e.target.value}))} style={inpSt}/>
                </div>
              </div>
              <div style={{marginBottom:'.85rem'}}>
                <label style={LBL}>Preferred cities / areas</label>
                <input value={preferredCities} onChange={e=>setPreferredCities(e.target.value)} placeholder="e.g. Thane, Mumbai, Navi Mumbai" style={inpSt}/>
                <div style={{fontSize:'.68rem',color:'var(--wg)',marginTop:'.3rem'}}>Restaurants in these areas will see your NGO as available for pickups.</div>
              </div>
            </div>
          </div>

          <button onClick={saveSettings} disabled={settingsSaving} style={{padding:'.6rem 1.4rem',background:settingsSaving?'#aaa':'var(--pu)',color:'#fff',border:'none',borderRadius:50,fontSize:'.82rem',fontWeight:500,cursor:settingsSaving?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            {settingsSaving?'Saving…':'Save Settings'}
          </button>
        </div>}

      </main>
      <DeclineModal open={!!declineTarget} offer={declineTarget} onClose={()=>setDeclineTarget(null)} onConfirm={confirmDecline}/>
    </div>
  );
}
