import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import WelcomeModal from '../../components/WelcomeModal';
const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('sl_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const Badge = ({ c, children }) => {
  const m = { gr:['#EAF3DE','#27500A','#C0DD97'], or:['#FFF0E6','#C4500A','#FAC785'], am:['#FAEEDA','#633806','#EF9F27'], rd:['#FCEBEB','#A32D2D','#F09595'], bl:['#E6F1FB','#0C447C','#85B7EB'], pu:['#EEEDFE','#3C3489','#AFA9EC'], tl:['#E1F5EE','#0F6E56','#5DCAA5'] };
  const [bg,tc,bc] = m[c]||m.bl;
  return <span style={{display:'inline-flex',alignItems:'center',padding:'.17rem .52rem',borderRadius:50,fontSize:'.62rem',fontWeight:500,whiteSpace:'nowrap',border:`1px solid ${bc}`,background:bg,color:tc}}>{children}</span>;
};

const normalize = (item) => ({
  id: item.id, shop: item.restaurant_name, city: item.city||'',
  type: (item.category||'').toLowerCase().includes('dairy')?'dairy':(item.category||'').toLowerCase().includes('bread')?'bakery':(item.category||'').toLowerCase().includes('bev')?'beverage':(item.category||'').toLowerCase().includes('groc')?'grocery':'food',
  veg: item.is_veg===1||item.is_veg===true, emoji:'🍽️',
  name: item.name, description: item.description||'', cat: item.category||'Food',
  orig: parseFloat(item.original_price), disc: parseFloat(item.discount_price),
  qty: item.quantity, wt: parseFloat(item.weight_kg)||0.25,
  image_url: item.image_url||null, restaurant_id: item.restaurant_id,
  restaurant_image_url: item.restaurant_image_url||null,
  discount_pct: item.discount_pct||Math.round((item.original_price-item.discount_price)/item.original_price*100),
  expiry_date: item.expiry_date||null,
  expiry_time: item.expiry_time||null,
});

// Returns true if item is still valid (not expired)
const localDateStr = (d = new Date()) =>
  [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');

const isNotExpired = (item) => {
  if (!item.expiry_date) return true;
  const now      = new Date();
  const todayStr = localDateStr(now);   // LOCAL date — not UTC
  const expStr   = item.expiry_date.slice(0, 10);
  if (expStr < todayStr) return false;  // already past
  if (expStr > todayStr) return true;   // future date
  // Same day — check time if present
  if (!item.expiry_time) return true;
  const [h, m] = item.expiry_time.split(':').map(Number);
  const expTime = new Date(now);
  expTime.setHours(h, m, 0, 0);
  return now < expTime;
};

// Returns minutes left until expiry (null if no expiry)
const minsLeft = (item) => {
  if (!item.expiry_date) return null;
  // Use explicit date parts to avoid UTC parsing of YYYY-MM-DD strings
  const [y, mo, day] = item.expiry_date.slice(0,10).split('-').map(Number);
  const [h, m, s]    = (item.expiry_time || '23:59:59').split(':').map(Number);
  const expTime = new Date(y, mo - 1, day, h, m, s || 0);
  const diff    = expTime - new Date();
  return Math.floor(diff / 60000);
};

const formatTimeLeft = (mins) => {
  if (mins === null) return null;
  if (mins <= 0) return 'Expired';
  if (mins < 60) return `${mins}m left`;
  if (mins < 1440) return `${Math.floor(mins/60)}h ${mins%60}m left`;
  return `${Math.floor(mins/1440)}d left`;
};

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) { resolve(true); return; }
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload  = () => resolve(true);
  s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

const PAY_METHODS = [
  { k:'razorpay', ico:'💳', lbl:'Pay Online (Razorpay)', sub:'UPI · Cards · Net Banking · Wallets' },
  { k:'cod',      ico:'💵', lbl:'Cash on Delivery',      sub:'Pay in cash at doorstep' },
];

/* ── Shared input style ── */
const INP = { padding:'.6rem .85rem', border:'1.5px solid var(--bd)', borderRadius:9, fontSize:'.88rem', fontFamily:"'DM Sans',sans-serif", color:'var(--dk)', background:'#fff', width:'100%', outline:'none' };

/* ── Bar chart row component ── */
const Bar = ({ lbl, pct, color, amt }) => (
  <div style={{display:'flex',alignItems:'center',gap:'.65rem',marginBottom:'.52rem'}}>
    <span style={{fontSize:'.72rem',color:'var(--wg)',width:110,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{lbl}</span>
    <div style={{flex:1,background:'#F5EFE8',borderRadius:50,height:7,overflow:'hidden'}}>
      <div style={{width:`${pct}%`,height:'100%',borderRadius:50,background:color,transition:'width .5s ease'}}/>
    </div>
    <span style={{fontSize:'.72rem',color:'var(--dk)',fontWeight:500,minWidth:48,textAlign:'right'}}>{amt}</span>
  </div>
);

/* ── Cart mini-bar floating above page (shown from browse) ── */
function CartMiniBar({ cart, t, onGo }) {
  if (!cart.length) return null;
  return (
    <div style={{position:'sticky',bottom:16,zIndex:50,display:'flex',justifyContent:'center',pointerEvents:'none',paddingBottom:4}}>
      <div style={{pointerEvents:'auto',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--dk)',borderRadius:50,padding:'.55rem .75rem .55rem 1rem',boxShadow:'0 4px 24px rgba(28,18,9,.28)',gap:'1rem',maxWidth:520,width:'92%'}}>
        <div style={{display:'flex',alignItems:'center',gap:'.55rem'}}>
          <span style={{background:'var(--gr)',color:'#fff',fontWeight:700,fontSize:'.7rem',minWidth:20,height:20,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>{cart.reduce((s,i)=>s+i.qty,0)}</span>
          <span style={{color:'rgba(255,255,255,.65)',fontSize:'.78rem'}}>{cart.length} item{cart.length!==1?'s':''} in cart</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'.65rem'}}>
          <div>
            <span style={{fontSize:'.68rem',color:'rgba(255,255,255,.4)',textDecoration:'line-through'}}>₹{t.orig}</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:'1rem',fontWeight:700,color:'var(--or-m)',marginLeft:'.4rem'}}>₹{t.total}</span>
          </div>
          <button onClick={onGo} style={{padding:'.42rem 1.1rem',background:'var(--gr)',color:'#fff',border:'none',borderRadius:50,fontSize:'.8rem',fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>
            View Cart →
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderSuccess({ order, onBrowse, onOrders }) {
  if (!order) return null;
  const trees = (parseFloat(order.co2_saved_kg||0)/21).toFixed(3);
  return (
    <div style={{padding:'1.5rem 4%',background:'#F5F0EA',minHeight:'calc(100vh - 115px)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',background:'#fff',borderRadius:16,border:'1px solid var(--bd)',padding:'2rem',maxWidth:480,width:'100%'}}>
        <div style={{fontSize:'3rem',marginBottom:'.75rem'}}>✅</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.6rem',fontWeight:700,color:'var(--dk)',marginBottom:'.35rem'}}>Order Placed!</div>
        <div style={{fontSize:'.82rem',color:'var(--or)',fontFamily:"'Playfair Display',serif",marginBottom:'.35rem'}}>Order #{order.order_id}</div>
        <div style={{display:'inline-flex',alignItems:'center',gap:'.4rem',background:'var(--gr-l)',color:'var(--gr-d)',border:'1px solid #C0DD97',borderRadius:50,padding:'.28rem .75rem',fontSize:'.75rem',fontWeight:500,marginBottom:'.65rem'}}>
          ✓ Payment {order.payment_method==='cod'?'COD — pay on delivery':'confirmed via Razorpay'}
        </div>
        <p style={{fontSize:'.82rem',color:'var(--wg)',marginBottom:'.4rem'}}>Track your order in My Orders.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.6rem',background:'var(--dk)',borderRadius:12,padding:'1rem',margin:'1rem 0'}}>
          {[[`₹${parseFloat(order.saved_amount||0).toFixed(0)}`,'Money saved'],[`${parseFloat(order.co2_saved_kg||0).toFixed(2)} kg`,'CO₂ saved'],[trees,'Tree-years']].map(([v,l])=>(
            <div key={l}><div style={{fontFamily:"'Playfair Display',serif",fontSize:'.95rem',fontWeight:700,color:'var(--or-m)'}}>{v}</div><div style={{fontSize:'.6rem',color:'rgba(255,255,255,.42)',marginTop:2}}>{l}</div></div>
          ))}
        </div>
        <div style={{display:'flex',gap:'.55rem',justifyContent:'center',marginTop:'1rem',flexWrap:'wrap'}}>
          <button onClick={onBrowse} style={{padding:'.6rem 1.4rem',borderRadius:50,fontSize:'.82rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",border:'none',background:'var(--gr)',color:'#fff'}}>Continue Shopping</button>
          <button onClick={onOrders} style={{padding:'.6rem 1.4rem',borderRadius:50,fontSize:'.82rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",border:'1.5px solid var(--bd)',background:'#fff',color:'var(--dk)'}}>View My Orders</button>
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { cart, addItem, removeItem, updateQty, clearCart, totals, itemCount } = useCart();

  const [tab, setTab]           = useState('browse');
  const [rawItems, setRawItems] = useState([]);
  const [localQtys, setLocalQtys] = useState({});
  const [orders, setOrders]     = useState([]);
  const [impact, setImpact]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);
  const [greeting, setGreeting] = useState(null);
  const [paying, setPaying]     = useState(false);

  // Filters
  const [vegFilter, setVegFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [maxPrice, setMaxPrice]   = useState(500);
  const [minDisc, setMinDisc]     = useState(0);
  const [sortBy, setSortBy]       = useState('default');
  const [search, setSearch]       = useState('');

  const [activePay, setActivePay] = useState('razorpay');
  const [success, setSuccess]     = useState(null);
  const [openOrder, setOpenOrder] = useState(null);

  // Delivery address — saved + editable
  const [savedAddr, setSavedAddr]   = useState('');   // persisted address
  const [editingAddr, setEditingAddr] = useState(false);
  const [addrDraft, setAddrDraft]   = useState('');
  const [delAddr, setDelAddr]       = useState('');   // used in checkout (= savedAddr)



  const showToast = (msg, type='info') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };
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

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/items');
      setRawItems(res.data);
      const qMap = {};
      res.data.forEach(i => { qMap[i.id] = i.quantity; });
      setLocalQtys(qMap);
    } catch(e) { showToast('Could not load items','error'); }
    finally { setLoading(false); }
  }, []);

  const fetchOrders = useCallback(async () => {
    try { const r = await api.get('/orders/my'); setOrders(r.data); } catch(e){}
  }, []);

  const fetchImpact = useCallback(async () => {
    try { const r = await api.get('/orders/impact'); setImpact(r.data); } catch(e){}
  }, []);

  // Load saved delivery address from API/profile
  const fetchProfile = useCallback(async () => {
    try {
      // Try /user/profile first, fall back to /auth/profile
      let r;
      try { r = await api.get('/user/profile'); }
      catch(e) { if (e.response?.status === 404) r = await api.get('/auth/profile'); else throw e; }
      if (r.data.delivery_address) {
        setSavedAddr(r.data.delivery_address);
        setDelAddr(r.data.delivery_address);
      }
    } catch(e) {
      // Profile endpoint may not exist yet — silently ignore
    }
  }, []);

  useEffect(() => { fetchItems(); fetchOrders(); fetchImpact(); fetchProfile(); }, []);
  useEffect(() => {
    if(tab==='orders')  fetchOrders();
    if(tab==='impact')  fetchImpact();
    if(tab==='browse')  fetchItems();
  }, [tab]);

  const displayItems = rawItems.map(raw => {
    const item = normalize(raw);
    item.qty = localQtys[raw.id] !== undefined ? localQtys[raw.id] : raw.quantity;
    return item;
  });

  const filtered = displayItems.filter(it => {
    const serverQty = rawItems.find(r=>r.id===it.id)?.quantity ?? it.qty;
    const inCart = cart.find(c=>c.id===it.id);
    if(serverQty<=0 && !inCart) return false;
    // Client-side expiry guard — removes items that expired since last fetch
    if(!isNotExpired(it) && !inCart) return false;
    if(catFilter!=='all'&&it.type!==catFilter) return false;
    if(vegFilter==='veg'&&!it.veg) return false;
    if(vegFilter==='nonveg'&&it.veg) return false;
    if(it.disc>maxPrice) return false;
    if(it.discount_pct<minDisc) return false;
    if(search&&!it.name.toLowerCase().includes(search)&&!it.shop.toLowerCase().includes(search)) return false;
    return true;
  }).sort((a,b) => {
    if(sortBy==='price-asc')  return a.disc-b.disc;
    if(sortBy==='price-desc') return b.disc-a.disc;
    if(sortBy==='discount')   return b.discount_pct-a.discount_pct;
    return 0;
  });

  const shops = [...new Set(filtered.map(i=>i.shop))];

  const handleAdd = (item) => {
    if((localQtys[item.id]||0)<=0) return;
    addItem(item);
    setLocalQtys(p=>({...p,[item.id]:(p[item.id]||0)-1}));
    showToast(`🛒 ${item.name} added!`);
  };

  const handleRemoveFromCart = (ci) => {
    setLocalQtys(p=>({...p,[ci.id]:(p[ci.id]||0)+ci.qty}));
    removeItem(ci.id);
  };

  const handleQtyChange = (ci, delta) => {
    if(delta>0&&(localQtys[ci.id]||0)<=0) return;
    setLocalQtys(p=>({...p,[ci.id]:(p[ci.id]||0)-delta}));
    updateQty(ci.id, delta);
  };

  const t = totals();

  /* ── Save delivery address ── */
  const saveAddress = async () => {
    if (!addrDraft.trim()) { showToast('Address cannot be empty','error'); return; }
    try {
      try { await api.put('/user/profile', { delivery_address: addrDraft }); }
      catch(e) { if (e.response?.status === 404) await api.put('/auth/profile', { delivery_address: addrDraft }); else throw e; }
      setSavedAddr(addrDraft);
      setDelAddr(addrDraft);
      setEditingAddr(false);
      showToast('Address saved! 📍','success');
    } catch(e) {
      // Backend route may not exist yet — save locally only so UI still works
      setSavedAddr(addrDraft);
      setDelAddr(addrDraft);
      setEditingAddr(false);
      showToast('Address saved locally 📍','success');
    }
  };



  /* ── PLACE ORDER ── */
  const handleCheckout = async () => {
    const addr = delAddr || savedAddr;
    if(!addr.trim()) { showToast('Please enter a delivery address','error'); return; }
    if(cart.length===0) { showToast('Your cart is empty','error'); return; }

    setPaying(true);
    try {
      const orderRes = await api.post('/orders', {
        items:            cart.map(c=>({ food_item_id:c.id, quantity:c.qty })),
        delivery_address: addr,
        payment_method:   activePay,
      });
      const { order_id, total_amount, saved_amount, co2_saved_kg } = orderRes.data;

      if (activePay === 'cod') {
        await api.post('/payment/cod-confirm', { order_id });
        clearCart();
        fetchItems();
        fetchOrders();
        fetchImpact();
        setSuccess({ order_id, saved_amount, co2_saved_kg, payment_method:'cod' });
        return;
      }

      const loaded = await loadRazorpay();
      if(!loaded) { showToast('Payment gateway failed to load. Please refresh.','error'); return; }

      const rzpRes = await api.post('/payment/create-order', {
        amount_paise: Math.round(parseFloat(total_amount) * 100),
        order_id,
      });

      const options = {
        key:         rzpRes.data.key_id,
        amount:      rzpRes.data.amount,
        currency:    'INR',
        name:        'SHELFLIFE+',
        description: `Order #${order_id} — Near-expiry food`,
        order_id:    rzpRes.data.razorpay_order_id,
        prefill: { name: user?.name||'', email: user?.email||'', contact: user?.phone||'' },
        theme: { color: '#3B6D11' },
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              order_id,
            });
            clearCart();
            fetchItems();
            fetchOrders();
            fetchImpact();
            setSuccess({ order_id, saved_amount, co2_saved_kg, payment_method:'razorpay' });
          } catch(err) {
            showToast('Payment received but verification failed. Contact support.','error');
          } finally { setPaying(false); }
        },
        modal: {
          ondismiss: () => { setPaying(false); showToast('Payment cancelled. Your order is reserved for 10 minutes.','warn'); },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => { showToast(`Payment failed: ${resp.error.description}`,'error'); setPaying(false); });
      rzp.open();

    } catch(err) {
      showToast(err.response?.data?.message||'Checkout failed. Try again.','error');
      setPaying(false);
    }
  };

  /* ── Impact derived data ── */
  // CO2 by category — derived from orders
  const co2ByCategory = (() => {
    const map = {};
    orders.forEach(o => {
      (o.items||[]).forEach(it => {
        const cat = it.category || 'Other';
        const co2 = parseFloat(it.co2_saved_kg || ((parseFloat(it.weight_kg||0.25) * it.quantity * 2.5)));
        map[cat] = (map[cat]||0) + co2;
      });
    });
    const entries = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const max = entries.length ? entries[0][1] : 1;
    const colors = ['var(--gr-m)','var(--or-m)','var(--tl-m)','var(--pu-m)','var(--am-m)'];
    return entries.map(([cat,val],i) => ({ lbl:cat, pct:Math.round(val/max*100), color:colors[i]||'var(--gr-m)', amt:`${val.toFixed(1)} kg` }));
  })();

  // Monthly savings — derived from orders
  const monthlySavings = (() => {
    const map = {};
    orders.forEach(o => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleString('en-IN',{month:'short',year:'numeric'});
      if (!map[key]) map[key] = { label, saved:0 };
      map[key].saved += parseFloat(o.saved_amount||0);
    });
    const sorted = Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).slice(-5);
    const max = sorted.length ? Math.max(...sorted.map(([,v])=>v.saved),1) : 1;
    return sorted.map(([,v]) => ({ lbl:v.label, pct:Math.round(v.saved/max*100), amt:`₹${v.saved.toFixed(0)}` }));
  })();

  // Milestones
  const totalOrders  = impact?.total_orders || orders.length || 0;
  const totalSaved   = parseFloat(impact?.total_saved||0);
  const totalCo2     = parseFloat(impact?.total_co2||0);
  const MILESTONES = [
    { ico:'🛒', lbl:'First order',    done: totalOrders >= 1,  val:1,    unit:'orders'  },
    { ico:'📦', lbl:'10 orders',      done: totalOrders >= 10, val:10,   unit:'orders'  },
    { ico:'🎯', lbl:'25 orders',      done: totalOrders >= 25, val:25,   unit:'orders'  },
    { ico:'💰', lbl:'₹500 saved',     done: totalSaved >= 500, val:500,  unit:'saved'   },
    { ico:'💸', lbl:'₹1,000 saved',   done: totalSaved >= 1000,val:1000, unit:'saved'   },
    { ico:'💵', lbl:'₹5,000 saved',   done: totalSaved >= 5000,val:5000, unit:'saved'   },
    { ico:'🌱', lbl:'5 kg CO₂',       done: totalCo2 >= 5,     val:5,    unit:'co2'     },
    { ico:'🌍', lbl:'20 kg CO₂',      done: totalCo2 >= 20,    val:20,   unit:'co2'     },
    { ico:'🌳', lbl:'1 tree-year',    done: totalCo2 >= 21,    val:21,   unit:'co2'     },
  ];

  const TABS = [['browse','🍽️ Browse'],['cart','🛒 Cart'],['orders','📦 Orders'],['impact','🌍 Impact'],['profile','👤 Profile']];

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif"}}>
      {greeting && (
        <WelcomeModal
          user={user}
          isFirstLogin={greeting.is_first_login}
          loginCount={greeting.login_count}
          lastLogin={greeting.last_login}
          onClose={() => setGreeting(null)}
        />
      )}
      {toast&&<div style={{position:'fixed',bottom:18,right:18,background:'#1C1209',color:'#fff',padding:'.65rem 1.1rem',borderRadius:10,fontSize:'.82rem',fontWeight:500,zIndex:10000,borderLeft:`3px solid ${toast.type==='success'?'var(--gr-m)':toast.type==='warn'?'var(--am-m)':toast.type==='error'?'var(--rd-m)':'var(--or-m)'}`,maxWidth:320}}>{toast.msg}</div>}

      {/* ── Topnav ── */}
      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.85rem 4%',background:'#0E1F06',borderBottom:'1px solid rgba(255,255,255,.07)',position:'sticky',top:0,zIndex:99,gap:'.75rem'}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',fontWeight:900,color:'var(--gr-m)',cursor:'pointer'}} onClick={()=>nav('/')}>SHELF<span style={{color:'var(--or-m)'}}>LIFE</span>+</div>
        <div style={{display:'flex',alignItems:'center',gap:'.5rem',background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',borderRadius:50,padding:'.4rem .9rem',flex:1,maxWidth:380}}>
          <span style={{fontSize:11,color:'rgba(255,255,255,.38)'}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value.toLowerCase())} placeholder="Search food, restaurants..." style={{border:'none',outline:'none',background:'transparent',fontSize:'.82rem',color:'#fff',fontFamily:"'DM Sans',sans-serif",width:'100%'}}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'.55rem'}}>
          <div onClick={()=>setTab('profile')} style={{width:30,height:30,borderRadius:'50%',background:'var(--gr-l)',color:'var(--gr-d)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.72rem',fontWeight:700,border:'1.5px solid var(--gr-m)',cursor:'pointer'}}>{(user?.name||'PR').substring(0,2).toUpperCase()}</div>
          <button onClick={()=>setTab('cart')} style={{display:'flex',alignItems:'center',gap:'.4rem',padding:'.4rem .9rem',background:'var(--gr)',color:'#fff',border:'none',borderRadius:50,fontSize:'.8rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>
            🛒 Cart <span style={{background:'var(--or)',color:'#fff',fontSize:'.6rem',fontWeight:700,minWidth:17,height:17,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{itemCount}</span>
          </button>
        </div>
      </nav>

      {/* ── Tab bar ── */}
      <div style={{display:'flex',background:'#0A1505',padding:'.45rem 4%',borderBottom:'1px solid rgba(255,255,255,.06)',overflowX:'auto'}}>
        {TABS.map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{padding:'.4rem 1rem',borderRadius:50,fontSize:'.8rem',fontWeight:500,cursor:'pointer',color:tab===key?'#fff':'rgba(255,255,255,.42)',background:tab===key?'var(--gr)':'none',border:'none',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap',transition:'all .2s',position:'relative'}}>
            {label}
            {key==='cart'&&itemCount>0&&<span style={{position:'absolute',top:2,right:4,width:7,height:7,borderRadius:'50%',background:'var(--or)'}}/>}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          BROWSE
      ══════════════════════════════════════════════ */}
      {tab==='browse'&&(
        <div style={{display:'grid',gridTemplateColumns:'200px 1fr',minHeight:'calc(100vh - 115px)'}}>
          {/* Filter sidebar */}
          <div style={{background:'#fff',borderRight:'1px solid var(--bd)',padding:'1rem .9rem',overflowY:'auto'}}>
            <div style={{fontSize:'.68rem',fontWeight:500,textTransform:'uppercase',letterSpacing:'.5px',color:'var(--wg)',marginBottom:'.5rem'}}>Veg / Non-Veg</div>
            <div style={{display:'flex',gap:'.35rem',marginBottom:'.75rem'}}>
              {[['all','All'],['veg','🟢 Veg'],['nonveg','🔴 Non-Veg']].map(([v,l])=>(
                <div key={v} onClick={()=>setVegFilter(v)} style={{flex:1,padding:'.32rem .45rem',borderRadius:50,fontSize:'.7rem',fontWeight:500,cursor:'pointer',border:`1.5px solid ${vegFilter===v?(v==='nonveg'?'var(--or-m)':'#C0DD97'):'var(--bd)'}`,background:vegFilter===v?(v==='nonveg'?'var(--or-l)':'var(--gr-l)'):'var(--cr)',color:vegFilter===v?(v==='nonveg'?'var(--or-d)':'var(--gr-d)'):'var(--wg)',textAlign:'center'}}>{l}</div>
              ))}
            </div>
            <div style={{fontSize:'.68rem',fontWeight:500,textTransform:'uppercase',letterSpacing:'.5px',color:'var(--wg)',marginBottom:'.5rem'}}>Category</div>
            {[['all','All items','var(--dk)'],['food','🍽️ Meals','var(--or)'],['grocery','🛒 Grocery','var(--gr)'],['dairy','🥛 Dairy','var(--tl)'],['bakery','🥐 Bakery','var(--am)'],['beverage','🧃 Beverages','var(--pu)']].map(([v,l,c])=>(
              <div key={v} onClick={()=>setCatFilter(v)} style={{display:'flex',alignItems:'center',gap:'.45rem',padding:'.35rem .55rem',borderRadius:7,fontSize:'.75rem',cursor:'pointer',background:catFilter===v?'var(--gr-l)':'transparent',color:catFilter===v?'var(--gr-d)':'var(--dk)',fontWeight:catFilter===v?500:400,marginBottom:2}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:c,flexShrink:0}}></span>{l}
              </div>
            ))}
            <div style={{fontSize:'.68rem',fontWeight:500,textTransform:'uppercase',letterSpacing:'.5px',color:'var(--wg)',margin:'.85rem 0 .4rem'}}>Max price (₹)</div>
            <input type="range" min={0} max={500} step={10} value={maxPrice} onChange={e=>setMaxPrice(+e.target.value)} style={{width:'100%',accentColor:'var(--gr)'}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.7rem',color:'var(--wg)'}}><span>₹0</span><span>₹{maxPrice}</span></div>
            <div style={{fontSize:'.68rem',fontWeight:500,textTransform:'uppercase',letterSpacing:'.5px',color:'var(--wg)',margin:'.85rem 0 .4rem'}}>Min discount (%)</div>
            <input type="range" min={0} max={60} step={5} value={minDisc} onChange={e=>setMinDisc(+e.target.value)} style={{width:'100%',accentColor:'var(--gr)'}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.7rem',color:'var(--wg)'}}><span>0%</span><span>{minDisc}%</span></div>
          </div>

          {/* Browse main */}
          <div style={{padding:'1.1rem 1.4rem',background:'#F5F0EA',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:'.5rem'}}>
              <span style={{fontSize:'.8rem',color:'var(--wg)'}}>{loading?'Loading…':`${filtered.length} item${filtered.length!==1?'s':''} from ${shops.length} restaurant${shops.length!==1?'s':''}`}</span>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:'.38rem .75rem',border:'1.5px solid var(--bd)',borderRadius:50,fontSize:'.75rem',fontFamily:"'DM Sans',sans-serif",color:'var(--dk)',background:'#fff',cursor:'pointer',outline:'none'}}>
                <option value="default">Newest first</option>
                <option value="price-asc">Lowest price</option>
                <option value="price-desc">Highest price</option>
                <option value="discount">Highest discount</option>
              </select>
            </div>
            {loading&&<div style={{textAlign:'center',padding:'3rem',color:'var(--wg)'}}>Loading food items…</div>}
            {!loading&&filtered.length===0&&<div style={{textAlign:'center',padding:'3rem',color:'var(--wg)'}}><div style={{fontSize:'2.5rem',marginBottom:'.75rem'}}>🔍</div><div style={{fontWeight:500,marginBottom:'.4rem'}}>No items found</div><div style={{fontSize:'.85rem'}}>Try adjusting filters, or check back when restaurants add items.</div></div>}
            {shops.map(shop=>{
              const si=filtered.filter(i=>i.shop===shop);
              const maxD=Math.max(...si.map(i=>i.discount_pct));
              return <div key={shop} style={{marginBottom:'1.6rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:'.6rem',marginBottom:'.7rem'}}>
                  {si[0]?.restaurant_image_url
                    ?<img src={si[0].restaurant_image_url} alt={shop} style={{width:36,height:36,borderRadius:9,objectFit:'cover',flexShrink:0,border:'1.5px solid var(--bd)'}}/>
                    :<div style={{width:36,height:36,borderRadius:9,background:'var(--or-l)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>🏪</div>}
                  <div><div style={{fontSize:'.9rem',fontWeight:500,color:'var(--dk)'}}>{shop}</div><div style={{fontSize:'.68rem',color:'var(--wg)',marginTop:1}}>{si[0]?.city} · {si.length} item{si.length!==1?'s':''}</div></div>
                  <span style={{fontSize:'.65rem',background:'var(--or-l)',color:'var(--or-d)',border:'1px solid var(--or-m)',padding:'.12rem .45rem',borderRadius:50,fontWeight:500,marginLeft:'auto'}}>Up to {maxD}% off</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:'.8rem'}}>
                  {si.map(it=>{
                    const inCart=cart.find(c=>c.id===it.id);
                    const co2=(it.wt*2.5).toFixed(2);
                    const cartReservedOut=(localQtys[it.id]||0)<=0&&!!inCart;
                    return <div key={it.id} style={{background:'#fff',borderRadius:13,border:`1px solid ${cartReservedOut?'var(--am-m)':'var(--bd)'}`,overflow:'hidden',opacity:cartReservedOut?0.85:1}}>
                      <div style={{height:96,background:it.veg?'var(--gr-l)':'var(--or-l)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.9rem',position:'relative',overflow:'hidden'}}>
                        {it.image_url?<img src={it.image_url} alt={it.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:it.emoji}
                        <span style={{position:'absolute',top:6,right:6,background:'var(--or)',color:'#fff',fontSize:'.58rem',fontWeight:700,padding:'.12rem .4rem',borderRadius:50}}>-{it.discount_pct}%</span>
                        <div style={{position:'absolute',bottom:6,right:6,width:11,height:11,borderRadius:3,border:'1.5px solid #fff',background:it.veg?'var(--gr)':'var(--or)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:4,height:4,borderRadius:'50%',background:'#fff'}}/></div>
                        {cartReservedOut&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.32)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <span style={{background:'var(--am)',color:'#fff',fontSize:'.6rem',fontWeight:700,padding:'.2rem .55rem',borderRadius:50}}>ALL IN CART</span>
                        </div>}
                        {/* Expiry countdown badge */}
                        {(()=>{
                          const mins=minsLeft(it);
                          if(mins===null) return null;
                          const urgent=mins<120; // under 2 hours
                          const soon=mins<1440;  // under 24 hours
                          if(!soon) return null;
                          return <div style={{position:'absolute',bottom:6,left:6,background:urgent?'var(--rd)':'var(--am)',color:'#fff',fontSize:'.55rem',fontWeight:700,padding:'.12rem .4rem',borderRadius:50,lineHeight:1.3}}>
                            ⏰ {formatTimeLeft(mins)}
                          </div>;
                        })()}
                      </div>
                      <div style={{padding:'.7rem .75rem'}}>
                        <div style={{fontWeight:500,fontSize:'.8rem',color:'var(--dk)',marginBottom:1}}>{it.name}</div>
                        <div style={{fontSize:'.62rem',color:'var(--wg)',marginBottom:'.45rem'}}>{it.cat}</div>
                        <div style={{display:'flex',alignItems:'baseline',gap:'.35rem',marginBottom:'.3rem'}}>
                          <span style={{fontFamily:"'Playfair Display',serif",fontSize:'.9rem',fontWeight:700,color:'var(--or)'}}>₹{it.disc}</span>
                          <span style={{fontSize:'.62rem',color:'#B0A090',textDecoration:'line-through'}}>₹{it.orig}</span>
                        </div>
                        <div style={{display:'flex',gap:'.25rem',marginBottom:'.5rem',flexWrap:'wrap'}}>
                          <span style={{fontSize:'.58rem',padding:'.1rem .4rem',borderRadius:50,border:'1px solid var(--or-m)',background:'var(--or-l)',color:'var(--or-d)'}}>💰 Save ₹{it.orig-it.disc}</span>
                          <span style={{fontSize:'.58rem',padding:'.1rem .4rem',borderRadius:50,border:'1px solid #C0DD97',background:'var(--gr-l)',color:'var(--gr-d)'}}>🌱 {co2}kg CO₂</span>
                        </div>
                        <div style={{fontSize:'.62rem',color:it.qty<=0?'var(--am)':it.qty<=3?'var(--rd)':'var(--wg)',fontWeight:it.qty<=3?500:400,marginBottom:'.55rem'}}>
                          {it.qty<=0?'⚠ All added to cart — 0 left':it.qty<=3?`⚠ Only ${it.qty} left`:`📦 ${it.qty} left`}
                        </div>
                        {inCart ? (
                          <div style={{display:'flex',alignItems:'center',gap:'.3rem'}}>
                            <button onClick={()=>{ if(inCart.qty===1){handleRemoveFromCart(inCart);}else{handleQtyChange(inCart,-1);} }} style={{width:28,height:28,border:'none',background:'var(--rd-l)',color:'var(--rd)',borderRadius:7,cursor:'pointer',fontSize:'1rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>−</button>
                            <div style={{flex:1,textAlign:'center',background:'var(--tl)',color:'#fff',borderRadius:7,padding:'.3rem 0',fontSize:'.75rem',fontWeight:600,cursor:'pointer'}} onClick={()=>setTab('cart')}>✓ {inCart.qty} · ₹{inCart.disc*inCart.qty}</div>
                            <button onClick={()=>{ if((localQtys[it.id]||0)>0) handleQtyChange(inCart,1); }} disabled={(localQtys[it.id]||0)<=0} style={{width:28,height:28,border:'none',background:(localQtys[it.id]||0)>0?'var(--gr-l)':'var(--cr)',color:(localQtys[it.id]||0)>0?'var(--gr-d)':'#ccc',borderRadius:7,cursor:(localQtys[it.id]||0)>0?'pointer':'not-allowed',fontSize:'1rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>+</button>
                          </div>
                        ) : (
                          <button onClick={()=>handleAdd(it)} style={{width:'100%',padding:'.42rem',background:'var(--gr)',color:'#fff',border:'none',borderRadius:7,fontSize:'.72rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>+ Add to Cart</button>
                        )}
                      </div>
                    </div>;
                  })}
                </div>
              </div>;
            })}

            {/* ── Sticky cart mini-bar at bottom of browse ── */}
            <CartMiniBar cart={cart} t={t} onGo={()=>setTab('cart')} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          CART
      ══════════════════════════════════════════════ */}
      {tab==='cart'&&(
        success
          ?<OrderSuccess order={success} onBrowse={()=>{setSuccess(null);setTab('browse');}} onOrders={()=>{setSuccess(null);setTab('orders');}}/>
          :cart.length===0
          ?<div style={{textAlign:'center',padding:'4rem 1rem',background:'#F5F0EA',minHeight:'calc(100vh - 115px)'}}>
            <div style={{fontSize:'2.8rem',marginBottom:'.85rem'}}>🛒</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',color:'var(--dk)',marginBottom:'.4rem'}}>Your cart is empty</div>
            <p style={{color:'var(--wg)',marginBottom:'1.25rem',fontSize:'.85rem'}}>Browse near-expiry deals and start saving!</p>
            <button onClick={()=>setTab('browse')} style={{padding:'.65rem 1.6rem',background:'var(--gr)',color:'#fff',border:'none',borderRadius:50,fontSize:'.85rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Browse Food Deals</button>
          </div>
          :<div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'1.25rem',padding:'1.25rem 4%',background:'#F5F0EA',minHeight:'calc(100vh - 115px)',alignItems:'start'}}>
            <div>
              {/* Cart header with back-to-browse button */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.85rem',flexWrap:'wrap',gap:'.5rem'}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,color:'var(--dk)'}}>Your Cart</div>
                <button onClick={()=>setTab('browse')} style={{padding:'.38rem .9rem',background:'#fff',border:'1.5px solid var(--bd)',borderRadius:50,fontSize:'.78rem',color:'var(--wg)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:'.35rem'}}>← Continue Shopping</button>
              </div>

              <div style={{display:'flex',alignItems:'flex-start',gap:'.65rem',background:'var(--gr-l)',border:'1px solid #C0DD97',borderRadius:11,padding:'.75rem .9rem',marginBottom:'1rem',fontSize:'.78rem',color:'var(--gr-d)',lineHeight:1.5}}>
                🌍&nbsp;<div>This order saves <strong>{t.co2} kg of CO₂</strong> — equal to <strong>{t.trees} tree-years</strong> of carbon absorption!</div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:'.65rem'}}>
                {cart.map(ci=>(
                  <div key={ci.id} style={{display:'flex',alignItems:'center',gap:'.75rem',background:'#fff',borderRadius:11,border:'1px solid var(--bd)',padding:'.8rem'}}>
                    <div style={{width:58,height:58,borderRadius:9,background:ci.veg?'var(--gr-l)':'var(--or-l)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.6rem',flexShrink:0,overflow:'hidden'}}>
                      {ci.image_url?<img src={ci.image_url} alt={ci.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:ci.emoji}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'.62rem',color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.3px'}}>{ci.shop}</div>
                      <div style={{fontSize:'.85rem',fontWeight:500,color:'var(--dk)'}}>{ci.name}</div>
                      <div style={{display:'flex',alignItems:'baseline',gap:'.3rem',marginTop:2}}>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:'.9rem',fontWeight:700,color:'var(--or)'}}>₹{ci.disc}</span>
                        <span style={{fontSize:'.65rem',color:'#B0A090',textDecoration:'line-through'}}>₹{ci.orig}</span>
                        <span style={{fontSize:'.65rem',color:'var(--gr)',marginLeft:'.3rem'}}>each</span>
                      </div>
                      <div style={{fontSize:'.65rem',color:'var(--gr)',marginTop:2}}>🌱 {(ci.wt*ci.qty*2.5).toFixed(2)} kg CO₂ saved</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'.4rem'}}>
                      <div style={{display:'flex',alignItems:'center',border:'1.5px solid var(--bd)',borderRadius:50,overflow:'hidden'}}>
                        <button onClick={()=>handleQtyChange(ci,-1)} style={{width:26,height:26,border:'none',background:'var(--cr)',fontSize:'.85rem',cursor:'pointer',color:'var(--dk)'}}>−</button>
                        <span style={{width:24,textAlign:'center',fontSize:'.8rem',fontWeight:500}}>{ci.qty}</span>
                        <button onClick={()=>handleQtyChange(ci,1)} style={{width:26,height:26,border:'none',background:'var(--cr)',fontSize:'.85rem',cursor:'pointer',color:'var(--dk)'}}>+</button>
                      </div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:'.9rem',fontWeight:700,color:'var(--dk)'}}>₹{ci.disc*ci.qty}</div>
                      <button onClick={()=>handleRemoveFromCart(ci)} style={{background:'none',border:'none',color:'#C4B8A8',fontSize:'.72rem',cursor:'pointer'}}>✕ Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
              {/* Savings */}
              <div style={{background:'var(--or-l)',border:'1px solid var(--or-m)',borderRadius:13,padding:'1rem 1.1rem'}}>
                <div style={{fontSize:'.72rem',fontWeight:500,color:'var(--or-d)',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:'.6rem'}}>🎉 Your savings</div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem',color:'var(--wg)',marginBottom:'.35rem'}}><span>Original total</span><span>₹{t.orig}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem',color:'var(--gr-d)',fontWeight:500}}><span>You save</span><span>−₹{t.saved}</span></div>
              </div>

              {/* Order summary */}
              <div style={{background:'#fff',border:'1px solid var(--bd)',borderRadius:13,padding:'1rem 1.1rem'}}>
                <div style={{fontSize:'.72rem',fontWeight:500,color:'var(--gr-d)',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:'.6rem'}}>Order summary</div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem',color:'var(--wg)',marginBottom:'.35rem'}}><span>Subtotal</span><span>₹{t.sub}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem',color:'var(--wg)',marginBottom:'.35rem'}}><span>Delivery</span><span>{t.del===0?<span style={{color:'var(--gr)',fontSize:'.72rem',fontWeight:500}}>FREE 🎉</span>:`₹${t.del}`}</span></div>
                {t.del>0&&<div style={{fontSize:'.65rem',color:'var(--wg)',marginBottom:'.35rem'}}>Add ₹{200-t.sub} more for free delivery</div>}
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'.92rem',fontWeight:600,color:'var(--dk)',marginTop:'.35rem',paddingTop:'.35rem',borderTop:'1px solid var(--bd)'}}><span>Total payable</span><span>₹{t.total}</span></div>
              </div>

              {/* Payment method */}
              <div style={{background:'#fff',border:'1px solid var(--bd)',borderRadius:13,padding:'1rem 1.1rem'}}>
                <div style={{fontSize:'.72rem',fontWeight:500,color:'var(--gr-d)',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:'.75rem'}}>Payment method</div>
                {PAY_METHODS.map(({k,ico,lbl,sub})=>(
                  <div key={k} onClick={()=>setActivePay(k)} style={{display:'flex',alignItems:'center',gap:'.75rem',padding:'.65rem .8rem',background:activePay===k?'var(--gr-l)':'var(--cr)',border:`1.5px solid ${activePay===k?'var(--gr)':'var(--bd)'}`,borderRadius:10,cursor:'pointer',marginBottom:'.5rem',transition:'all .2s'}}>
                    <span style={{fontSize:'1.3rem'}}>{ico}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'.82rem',fontWeight:500,color:activePay===k?'var(--gr-d)':'var(--dk)'}}>{lbl}</div>
                      <div style={{fontSize:'.68rem',color:'var(--wg)',marginTop:1}}>{sub}</div>
                    </div>
                    <div style={{width:16,height:16,borderRadius:'50%',border:`2px solid ${activePay===k?'var(--gr)':'var(--bd)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {activePay===k&&<div style={{width:8,height:8,borderRadius:'50%',background:'var(--gr)'}}/>}
                    </div>
                  </div>
                ))}
                {activePay==='razorpay'&&<div style={{background:'#F0FFF4',border:'1px solid #C0DD97',borderRadius:8,padding:'.52rem .72rem',fontSize:'.72rem',color:'var(--gr-d)',lineHeight:1.5}}>🔒 Secure payment via Razorpay — UPI, Credit/Debit Card, Net Banking, Wallets all supported</div>}
                {activePay==='cod'&&<div style={{background:'var(--am-l)',border:'1px solid var(--am-m)',borderRadius:8,padding:'.52rem .72rem',fontSize:'.72rem',color:'#633806',lineHeight:1.5}}>💵 Pay ₹{t.total} in cash when your order arrives. Please keep exact change ready.</div>}
              </div>

              {/* ── Delivery address ── */}
              <div style={{background:'#fff',border:'1px solid var(--bd)',borderRadius:13,padding:'1rem 1.1rem'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.5rem'}}>
                  <div style={{fontSize:'.72rem',fontWeight:500,color:'var(--gr-d)',textTransform:'uppercase',letterSpacing:'.4px'}}>📍 Delivery address</div>
                  {savedAddr&&!editingAddr&&(
                    <button onClick={()=>{ setAddrDraft(savedAddr); setEditingAddr(true); }} style={{fontSize:'.7rem',color:'var(--gr)',cursor:'pointer',background:'none',border:'none',fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>Change</button>
                  )}
                </div>
                {!editingAddr&&savedAddr ? (
                  <div style={{background:'var(--gr-l)',border:'1px solid #C0DD97',borderRadius:8,padding:'.6rem .8rem',fontSize:'.82rem',color:'var(--dk)',lineHeight:1.45}}>
                    {savedAddr}
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={editingAddr ? addrDraft : delAddr}
                      onChange={e=>{ if(editingAddr) setAddrDraft(e.target.value); else setDelAddr(e.target.value); }}
                      rows={2}
                      style={{width:'100%',border:'1.5px solid var(--bd)',borderRadius:8,padding:'.55rem .75rem',fontSize:'.78rem',fontFamily:"'DM Sans',sans-serif",color:'var(--dk)',resize:'none',outline:'none'}}
                      placeholder="Enter your full delivery address…"
                    />
                    {editingAddr && (
                      <div style={{display:'flex',gap:'.4rem',marginTop:'.35rem'}}>
                        <button onClick={saveAddress} style={{flex:1,padding:'.42rem',background:'var(--gr)',color:'#fff',border:'none',borderRadius:7,fontSize:'.75rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Save Address</button>
                        <button onClick={()=>setEditingAddr(false)} style={{padding:'.42rem .75rem',background:'none',border:'1.5px solid var(--bd)',borderRadius:7,fontSize:'.75rem',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",color:'var(--wg)'}}>Cancel</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button onClick={handleCheckout} disabled={paying} style={{width:'100%',padding:'.85rem',background:paying?'#aaa':'var(--gr)',color:'#fff',border:'none',borderRadius:50,fontSize:'.95rem',fontWeight:500,cursor:paying?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:'.5rem'}}>
                {paying?'Processing…':<>{activePay==='razorpay'?'💳 Pay':'💵 Place Order'} · ₹{t.total}</>}
              </button>
              <div style={{textAlign:'center',fontSize:'.65rem',color:'var(--wg)'}}>Near-expiry items are non-refundable once ordered</div>
            </div>
          </div>
      )}

      {/* ══════════════════════════════════════════════
          ORDERS
      ══════════════════════════════════════════════ */}
      {tab==='orders'&&(
        <div style={{padding:'1.25rem 4%',background:'#F5F0EA',minHeight:'calc(100vh - 115px)'}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',fontWeight:700,color:'var(--dk)',marginBottom:'1rem'}}>My Orders</div>
          {orders.length===0&&<div style={{textAlign:'center',padding:'3rem',color:'var(--wg)'}}><div style={{fontSize:'2rem',marginBottom:'.5rem'}}>📦</div><p>No orders yet. Browse food deals and place your first order!</p></div>}
          {orders.map((o,i)=>{
            const sc={delivered:'gr',preparing:'am',confirmed:'bl',pending:'or',cancelled:'rd',ready:'tl'};
            const pm={upi:'📱 UPI',card:'💳 Card',netbanking:'🏦 Net Banking',cod:'💵 COD',wallet:'👛 Wallet',razorpay:'💳 Razorpay'};
            return <div key={o.id} style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',marginBottom:'.75rem',overflow:'hidden'}}>
              <div onClick={()=>setOpenOrder(openOrder===i?null:i)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.8rem 1.1rem',cursor:'pointer',flexWrap:'wrap',gap:'.5rem'}}>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:'.78rem',color:'var(--or)'}}>Order #{o.id}</div>
                  <div style={{fontSize:'.82rem',fontWeight:500,color:'var(--dk)'}}>{o.restaurant_name}</div>
                  <div style={{display:'flex',gap:'.4rem',marginTop:'.2rem',flexWrap:'wrap'}}>
                    <span style={{fontSize:'.68rem',color:'var(--wg)'}}>{new Date(o.created_at).toLocaleString()}</span>
                    {o.payment_method&&<span style={{fontSize:'.68rem',background:'var(--bl)',color:'#0C447C',border:'1px solid #85B7EB',padding:'.08rem .38rem',borderRadius:50}}>{pm[o.payment_method]||o.payment_method}</span>}
                    {o.payment_status&&<span style={{fontSize:'.68rem',background:o.payment_status==='paid'?'var(--gr-l)':o.payment_status==='pending'?'var(--am-l)':'var(--rd-l)',color:o.payment_status==='paid'?'var(--gr-d)':o.payment_status==='pending'?'#633806':'var(--rd)',border:`1px solid ${o.payment_status==='paid'?'#C0DD97':o.payment_status==='pending'?'var(--am-m)':'var(--rd-m)'}`,padding:'.08rem .38rem',borderRadius:50}}>Payment: {o.payment_status}</span>}
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'.55rem'}}>
                  <Badge c={sc[o.status]||'bl'}>{o.status}</Badge>
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:'.9rem',fontWeight:700,color:'var(--dk)'}}>₹{o.total_amount}</span>
                  <span style={{fontSize:'.75rem',color:'var(--wg)',display:'inline-block',transform:openOrder===i?'rotate(180deg)':''}}>▼</span>
                </div>
              </div>
              {openOrder===i&&<div style={{borderTop:'1px solid var(--bd)',padding:'.8rem 1.1rem'}}>
                {o.items?.map(it=>(
                  <div key={it.id} style={{display:'flex',justifyContent:'space-between',fontSize:'.78rem',color:'var(--dk)',padding:'.28rem 0',borderBottom:'1px solid var(--bd)'}}>
                    <span>{it.name} × {it.quantity}</span><span>₹{(it.unit_price*it.quantity).toFixed(0)}</span>
                  </div>
                ))}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'.65rem',paddingTop:'.35rem'}}>
                  <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
                    <Badge c="or">💰 Saved ₹{parseFloat(o.saved_amount||0).toFixed(0)}</Badge>
                    <Badge c="gr">🌱 {parseFloat(o.co2_saved_kg||0).toFixed(2)} kg CO₂</Badge>
                    <Badge c="bl">🌳 {(parseFloat(o.co2_saved_kg||0)/21).toFixed(3)} trees</Badge>
                  </div>
                  <div style={{fontSize:'.82rem',fontWeight:600,color:'var(--dk)'}}>Total: ₹{o.total_amount}</div>
                </div>
                {o.delivery_address&&<div style={{fontSize:'.72rem',color:'var(--wg)',marginTop:'.4rem'}}>📍 {o.delivery_address}</div>}
                {o.razorpay_payment_id&&<div style={{fontSize:'.68rem',color:'var(--wg)',marginTop:'.25rem',fontFamily:'monospace'}}>Ref: {o.razorpay_payment_id}</div>}
              </div>}
            </div>;
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          IMPACT
      ══════════════════════════════════════════════ */}
      {tab==='impact'&&(
        <div style={{padding:'1.25rem 4%',background:'#F5F0EA',minHeight:'calc(100vh - 115px)'}}>

          {/* Hero card */}
          <div style={{background:'#0E1F06',borderRadius:16,padding:'1.75rem',marginBottom:'1.25rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',alignItems:'center'}}>
            <div>
              <div style={{fontSize:'.68rem',textTransform:'uppercase',letterSpacing:'1.5px',color:'rgba(151,196,89,.7)',marginBottom:'.4rem'}}>Your sustainability score</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,color:'#fff',marginBottom:'.5rem'}}>You're making a real difference 🌿</div>
              <div style={{fontSize:'.8rem',color:'rgba(255,255,255,.42)',lineHeight:1.6,fontWeight:300}}>Every near-expiry item you order prevents food from going to landfill — saving money and reducing carbon in real time.</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.55rem'}}>
              {[
                [impact?`${parseFloat(impact.total_co2||0).toFixed(1)} kg`:'—','gr','CO₂ saved'],
                [impact?`₹${parseFloat(impact.total_saved||0).toFixed(0)}`:'—','or','Money saved'],
                [impact?parseFloat(impact.tree_years||0).toFixed(3):'—','pu','Tree-years'],
                [impact?impact.total_orders||orders.length:'—','tl','Orders placed'],
              ].map(([v,c,l])=>{
                const cols={gr:'var(--gr-m)',or:'var(--or-m)',pu:'var(--pu-m)',tl:'var(--tl-m)'};
                return <div key={l} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.09)',borderRadius:11,padding:'.85rem',textAlign:'center'}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,color:cols[c]}}>{v}</div>
                  <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.38)',marginTop:3}}>{l}</div>
                </div>;
              })}
            </div>
          </div>

          {/* 3 stat cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.85rem',marginBottom:'1.1rem'}}>
            {[
              ['🌱','CO₂ saved',impact?`${parseFloat(impact.total_co2||0).toFixed(1)} kg`:'—','gr','Weight × 2.5 kg CO₂/kg (UN FAO)'],
              ['💰','Money saved',impact?`₹${parseFloat(impact.total_saved||0).toFixed(0)}`:'—','or','Original minus discounted price'],
              ['🌳','Tree-years',impact?parseFloat(impact.tree_years||0).toFixed(3):'—','pu','CO₂ saved ÷ 21 kg per tree per year'],
            ].map(([ico,lbl,val,c,sub])=>{
              const cols={gr:'var(--gr)',or:'var(--or)',pu:'var(--pu)'};
              return <div key={lbl} style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',padding:'1.1rem'}}>
                <div style={{fontSize:'1.4rem',marginBottom:'.5rem'}}>{ico}</div>
                <div style={{fontSize:'.65rem',color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:'.25rem'}}>{lbl}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,color:cols[c]}}>{val}</div>
                <div style={{fontSize:'.68rem',color:'var(--wg)',marginTop:3,lineHeight:1.35}}>{sub}</div>
              </div>;
            })}
          </div>

          {/* CO2 by category + Monthly savings */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.9rem',marginBottom:'1.1rem'}}>

            {/* CO2 by category */}
            <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',overflow:'hidden'}}>
              <div style={{padding:'.8rem 1.15rem',borderBottom:'1px solid var(--bd)',fontSize:'.85rem',fontWeight:500,color:'var(--dk)'}}>CO₂ by category</div>
              <div style={{padding:'.9rem 1.15rem'}}>
                {co2ByCategory.length > 0
                  ? co2ByCategory.map(b => <Bar key={b.lbl} lbl={b.lbl} pct={b.pct} color={b.color} amt={b.amt}/>)
                  : <div style={{textAlign:'center',padding:'1.5rem',color:'var(--wg)',fontSize:'.82rem'}}>Place orders to see your CO₂ breakdown by category.</div>
                }
              </div>
            </div>

            {/* Monthly savings */}
            <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',overflow:'hidden'}}>
              <div style={{padding:'.8rem 1.15rem',borderBottom:'1px solid var(--bd)',fontSize:'.85rem',fontWeight:500,color:'var(--dk)'}}>Monthly savings</div>
              <div style={{padding:'.9rem 1.15rem'}}>
                {monthlySavings.length > 0
                  ? monthlySavings.map(b => <Bar key={b.lbl} lbl={b.lbl} pct={b.pct} color="var(--or)" amt={b.amt}/>)
                  : <div style={{textAlign:'center',padding:'1.5rem',color:'var(--wg)',fontSize:'.82rem'}}>Place orders to track your monthly savings.</div>
                }
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',overflow:'hidden'}}>
            <div style={{padding:'.8rem 1.15rem',borderBottom:'1px solid var(--bd)',fontSize:'.85rem',fontWeight:500,color:'var(--dk)'}}>🏆 Milestones</div>
            <div style={{padding:'.9rem 1.15rem',display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
              {MILESTONES.map(m=>(
                <div key={m.lbl} style={{display:'inline-flex',alignItems:'center',gap:'.35rem',padding:'.28rem .7rem',borderRadius:50,fontSize:'.72rem',fontWeight:500,border:'1px solid',background:m.done?'var(--gr-l)':'var(--cr)',color:m.done?'var(--gr-d)':'var(--wg)',borderColor:m.done?'#C0DD97':'var(--bd)',opacity:m.done?1:.65}}>
                  <span>{m.ico}</span>
                  <span>{m.lbl}</span>
                  {m.done&&<span style={{color:'var(--gr)',fontSize:'.65rem'}}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          PROFILE
      ══════════════════════════════════════════════ */}
      {tab==='profile'&&(
        <div style={{padding:'1.25rem 4%',background:'#F5F0EA',minHeight:'calc(100vh - 115px)'}}>
          <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:'1.25rem',alignItems:'start'}}>

            {/* Left card */}
            <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',padding:'1.35rem',textAlign:'center'}}>
              <div style={{width:64,height:64,borderRadius:'50%',background:'var(--gr-l)',border:'2.5px solid var(--gr-m)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,color:'var(--gr-d)',margin:'0 auto .75rem'}}>{(user?.name||'PR').substring(0,2).toUpperCase()}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1rem',fontWeight:700,color:'var(--dk)'}}>{user?.name}</div>
              <div style={{fontSize:'.68rem',color:'var(--wg)',marginTop:2}}>{user?.email}</div>
              <div style={{marginTop:'.55rem'}}><Badge c="gr">Conscious Consumer ✓</Badge></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.42rem',marginTop:'.85rem'}}>
                {[
                  [impact?.total_orders||orders.length,'Orders'],
                  [`₹${parseFloat(impact?.total_saved||0).toFixed(0)}`,'Saved'],
                  [`${parseFloat(impact?.total_co2||0).toFixed(1)}`,'kg CO₂'],
                  [parseFloat(impact?.tree_years||0).toFixed(2),'Trees'],
                ].map(([v,l])=>(
                  <div key={l} style={{background:'var(--cr)',borderRadius:8,padding:'.55rem',textAlign:'center',border:'1px solid var(--bd)'}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:'.95rem',fontWeight:700,color:'var(--gr)'}}>{v}</div>
                    <div style={{fontSize:'.6rem',color:'var(--wg)',marginTop:1}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right panels */}
            <div>
              {/* Personal details */}
              <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',overflow:'hidden',marginBottom:'.9rem'}}>
                <div style={{padding:'.78rem 1.1rem',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:'.82rem',fontWeight:500,color:'var(--dk)'}}>Personal details</span>
                  <button onClick={()=>showToast('Profile saved!','success')} style={{fontSize:'.7rem',color:'var(--gr)',cursor:'pointer',background:'none',border:'none',fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>Save</button>
                </div>
                <div style={{padding:'.9rem 1.1rem'}}>
                  {[['Full name',user?.name||''],['Email',user?.email||''],['Phone','']].map(([lbl,val])=>(
                    <div key={lbl} style={{marginBottom:'.85rem'}}>
                      <label style={{fontSize:'.7rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.3px',display:'block',marginBottom:'.3rem'}}>{lbl}</label>
                      <input defaultValue={val} style={INP}/>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Delivery address ── */}
              <div style={{background:'#fff',borderRadius:13,border:'1px solid var(--bd)',overflow:'hidden',marginBottom:'.9rem'}}>
                <div style={{padding:'.78rem 1.1rem',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:'.82rem',fontWeight:500,color:'var(--dk)'}}>📍 Delivery address</span>
                  {savedAddr&&!editingAddr&&(
                    <button onClick={()=>{ setAddrDraft(savedAddr); setEditingAddr(true); }} style={{fontSize:'.7rem',color:'var(--gr)',cursor:'pointer',background:'none',border:'none',fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>Change</button>
                  )}
                </div>
                <div style={{padding:'.9rem 1.1rem'}}>
                  {!editingAddr&&savedAddr ? (
                    <div style={{background:'var(--gr-l)',border:'1px solid #C0DD97',borderRadius:9,padding:'.65rem .85rem',fontSize:'.85rem',color:'var(--dk)',lineHeight:1.5,marginBottom:'.5rem'}}>
                      {savedAddr}
                    </div>
                  ) : null}
                  {(!savedAddr||editingAddr) && (
                    <div>
                      <label style={{fontSize:'.7rem',fontWeight:500,color:'var(--wg)',textTransform:'uppercase',letterSpacing:'.3px',display:'block',marginBottom:'.3rem'}}>
                        {savedAddr ? 'New address' : 'Add delivery address'}
                      </label>
                      <textarea
                        value={editingAddr ? addrDraft : delAddr}
                        onChange={e=>{ if(editingAddr) setAddrDraft(e.target.value); else { setDelAddr(e.target.value); setAddrDraft(e.target.value); }}}
                        rows={3}
                        placeholder="e.g. Flat 402, Sunrise Apts, Station Rd, Thane 400601"
                        style={{...INP, resize:'none', minHeight:72}}
                      />
                    </div>
                  )}
                  <div style={{display:'flex',gap:'.5rem',marginTop:'.5rem'}}>
                    <button onClick={saveAddress} style={{padding:'.5rem 1.1rem',background:'var(--gr)',color:'#fff',border:'none',borderRadius:50,fontSize:'.8rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                      {savedAddr ? 'Update Address' : 'Save Address'}
                    </button>
                    {editingAddr&&<button onClick={()=>setEditingAddr(false)} style={{padding:'.5rem .85rem',background:'none',border:'1.5px solid var(--bd)',borderRadius:50,fontSize:'.8rem',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",color:'var(--wg)'}}>Cancel</button>}
                  </div>
                </div>
              </div>


              <button onClick={doLogout} style={{padding:'.6rem 1.4rem',background:'var(--rd-l)',color:'var(--rd)',border:'1px solid var(--rd-m)',borderRadius:50,fontSize:'.82rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>🚪 Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
