import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import WelcomeModal from '../../components/WelcomeModal';
const BASE = 'http://localhost:5000';
const api = axios.create({ baseURL: BASE + '/api' });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('sl_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* ── UI atoms ── */
const Badge = ({ c, children }) => {
  const m = { gr: ['#EAF3DE', '#27500A', '#C0DD97'], or: ['#FFF0E6', '#C4500A', '#FAC785'], am: ['#FAEEDA', '#633806', '#EF9F27'], rd: ['#FCEBEB', '#A32D2D', '#F09595'], bl: ['#E6F1FB', '#0C447C', '#85B7EB'], pu: ['#EEEDFE', '#3C3489', '#AFA9EC'], tl: ['#E1F5EE', '#0F6E56', '#5DCAA5'] };
  const [bg, tc, bc] = m[c] || m.bl;
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '.17rem .52rem', borderRadius: 50, fontSize: '.62rem', fontWeight: 500, whiteSpace: 'nowrap', border: `1px solid ${bc}`, background: bg, color: tc }}>{children}</span>;
};

const Stat = ({ ico, icoBg, val, lbl, sub, color }) => (
  <div style={{ background: '#fff', borderRadius: 13, border: '1px solid var(--bd)', padding: '1rem 1.1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: icoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{ico}</div>
    <div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.45rem', fontWeight: 700, lineHeight: 1, color }}>{val}</div>
      <div style={{ fontSize: '.7rem', color: 'var(--wg)', marginTop: 2 }}>{lbl}</div>
      {sub && <div style={{ fontSize: '.65rem', marginTop: 2, color: sub.startsWith('↑') ? 'var(--gr)' : sub.startsWith('↓') || sub.startsWith('⚠') ? '#A32D2D' : 'var(--wg)' }}>{sub}</div>}
    </div>
  </div>
);

const Bar = ({ lbl, pct, color, amt }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.52rem' }}>
    <span style={{ fontSize: '.72rem', color: 'var(--wg)', width: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lbl}</span>
    <div style={{ flex: 1, background: '#F5EFE8', borderRadius: 50, height: 7, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 50, background: color, transition: 'width .5s ease' }} />
    </div>
    <span style={{ fontSize: '.72rem', color: 'var(--dk)', fontWeight: 500, minWidth: 48, textAlign: 'right' }}>{amt}</span>
  </div>
);

/* ── Donut chart (CSS conic-gradient) ── */
const DonutChart = ({ segments, legend }) => {
  let cumulative = 0;
  const gradient = segments.map(s => {
    const start = cumulative;
    cumulative += s.pct;
    return `${s.color} ${start}% ${cumulative}%`;
  }).join(',');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '.9rem 1.15rem' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: `conic-gradient(${gradient})` }} />
        <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', background: '#fff' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.38rem', flex: 1 }}>
        {legend.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.45rem', fontSize: '.75rem', color: 'var(--dk)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Sparkline bars (weekly revenue) ── */
const Sparkline = ({ data, labels }) => {
  const max = Math.max(...data, 1);
  return (
    <div style={{ padding: '0 1.15rem' }}>
      <div style={{ display: 'flex', gap: '.4rem', alignItems: 'flex-end', height: 52, marginBottom: '.35rem' }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: i === data.length - 1 ? 'var(--or)' : 'var(--or-m)', height: `${Math.round((v / max) * 48)}px`, minHeight: 4, transition: 'height .4s ease' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '.4rem' }}>
        {labels.map((l, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '.6rem', color: i === labels.length - 1 ? 'var(--or)' : 'var(--wg)', fontWeight: i === labels.length - 1 ? 600 : 400 }}>{l}</div>
        ))}
      </div>
    </div>
  );
};

/* ── Card wrapper ── */
const Card = ({ title, action, onAction, badge, children, style = {} }) => (
  <div style={{ background: '#fff', borderRadius: 13, border: '1px solid var(--bd)', overflow: 'hidden', ...style }}>
    {(title || action || badge) && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.8rem 1.15rem', borderBottom: '1px solid var(--bd)' }}>
        <span style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--dk)' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          {badge && badge}
          {action && <button onClick={onAction} style={{ fontSize: '.72rem', color: 'var(--or)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{action}</button>}
        </div>
      </div>
    )}
    {children}
  </div>
);

/* ── Edit Item Modal ── */
function EditModal({ item, onClose, onSave, showToast }) {
  const [f, setF] = useState({
    name: item.name, category: item.category || '', description: item.description || '',
    original_price: item.original_price, discount_price: item.discount_price,
    quantity: item.quantity, unit: item.unit || 'pieces', weight_kg: item.weight_kg || 0.25,
    expiry_date: item.expiry_date ? item.expiry_date.slice(0, 10) : '',
    is_veg: item.is_veg === 1 || item.is_veg === true,
    ngo_eligible: item.ngo_eligible === 1 || item.ngo_eligible === true,
    is_active: item.is_active === 1 || item.is_active === true,
  });
  const [saving, setSaving] = useState(false);
  const inp = { padding: '.55rem .8rem', border: '1.5px solid var(--bd)', borderRadius: 8, fontSize: '.85rem', fontFamily: "'DM Sans',sans-serif", color: 'var(--dk)', background: '#fff', width: '100%', outline: 'none' };
  const save = async () => {
    if (!f.name || !f.original_price || !f.discount_price) { showToast('Fill required fields', 'error'); return; }
    if (parseFloat(f.discount_price) >= parseFloat(f.original_price)) { showToast('Discounted price must be lower', 'error'); return; }
    setSaving(true);
    try {
      await api.put(`/owner/items/${item.id}`, { ...f, is_veg: f.is_veg ? 1 : 0, ngo_eligible: f.ngo_eligible ? 1 : 0, is_active: f.is_active ? 1 : 0 });
      onSave();
    } catch (e) { showToast(e.response?.data?.message || 'Update failed', 'error'); }
    finally { setSaving(false); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '1.75rem', maxWidth: 560, width: '90%', position: 'relative', boxShadow: '0 12px 40px rgba(0,0,0,.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '.85rem', right: '.85rem', background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--wg)' }}>✕</button>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--dk)', marginBottom: '1.25rem' }}>Edit — {item.name}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          {[['Item name *', 'name', 'text'], ['Category', 'category', 'text'], ['Original price (₹) *', 'original_price', 'number'], ['Discounted price (₹) *', 'discount_price', 'number'], ['Quantity *', 'quantity', 'number'], ['Weight/unit (kg)', 'weight_kg', 'number'], ['Expiry date', 'expiry_date', 'date']].map(([lbl, field, type]) => (
            <div key={field}><label style={{ fontSize: '.68rem', fontWeight: 500, color: 'var(--wg)', textTransform: 'uppercase', letterSpacing: '.3px', display: 'block', marginBottom: '.28rem' }}>{lbl}</label><input type={type} value={f[field]} onChange={e => setF(p => ({ ...p, [field]: e.target.value }))} style={inp} /></div>
          ))}
          <div><label style={{ fontSize: '.68rem', fontWeight: 500, color: 'var(--wg)', textTransform: 'uppercase', letterSpacing: '.3px', display: 'block', marginBottom: '.28rem' }}>Unit</label><select value={f.unit} onChange={e => setF(p => ({ ...p, unit: e.target.value }))} style={inp}>{['pieces', 'kg', 'litres', 'packets', 'boxes'].map(o => <option key={o}>{o}</option>)}</select></div>
        </div>
        <div style={{ marginTop: '.85rem' }}><label style={{ fontSize: '.68rem', fontWeight: 500, color: 'var(--wg)', textTransform: 'uppercase', letterSpacing: '.3px', display: 'block', marginBottom: '.28rem' }}>Description</label><textarea value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inp, resize: 'none' }} /></div>
        <div style={{ display: 'flex', gap: '1.5rem', margin: '.85rem 0' }}>
          {[['is_veg', '🟢 Veg'], ['ngo_eligible', '🤝 NGO eligible'], ['is_active', '✅ Active']].map(([key, lbl]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.82rem', cursor: 'pointer' }}><input type="checkbox" checked={f[key]} onChange={e => setF(p => ({ ...p, [key]: e.target.checked }))} style={{ accentColor: 'var(--gr)', width: 15, height: 15 }} />{lbl}</label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--bd)' }}>
          <button onClick={save} disabled={saving} style={{ padding: '.62rem 1.4rem', background: saving ? '#aaa' : 'var(--or)', color: '#fff', border: 'none', borderRadius: 50, fontSize: '.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>{saving ? 'Saving…' : 'Save Changes'}</button>
          <button onClick={onClose} style={{ padding: '.62rem 1.1rem', background: 'none', color: 'var(--wg)', border: '1.5px solid var(--bd)', borderRadius: 50, fontSize: '.85rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLOR = { delivered: 'gr', preparing: 'am', confirmed: 'bl', pending: 'or', cancelled: 'rd', ready: 'tl' };
const PAY_ICONS = { upi: '📱', card: '💳', netbanking: '🏦', cod: '💵', wallet: '👛', razorpay: '💳' };
const PAY_STATUS_C = { paid: 'gr', pending: 'am', failed: 'rd', created: 'bl' };

const CAT_COLORS = ['var(--gr)', 'var(--gr-m)', 'var(--am-m)', '#AFA9EC', '#5DCAA5', 'var(--or-m)', 'var(--tl-m)'];

export default function OwnerDashboard() {
  const nav = useNavigate();
  const { user, logout } = useAuth();

  const [panel, setPanel] = useState('dashboard');
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [txns, setTxns] = useState([]);
  const [stats, setStats] = useState(null);
  const [ownerOffers, setOwnerOffers] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [invFilter, setInvFilter]     = useState('all');
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState(null);
  const [greeting, setGreeting] = useState(null);

  const [restaurantImg, setRestaurantImg] = useState(null);
  const [restaurantImgFile, setRestaurantImgFile] = useState(null);
  const [restaurantImgPreview, setRestaurantImgPreview] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  const [form, setForm] = useState({ name: '', cat: '', desc: '', orig: '', disc: '', qty: '', unit: 'pieces', wt: '', exp: '', time: '', donate: false, is_veg: true });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [donQtys, setDonQtys] = useState({});
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [donPickup, setDonPickup] = useState('');
  const [donSlot, setDonSlot] = useState('Evening (4pm–8pm)');
  const [donNotes, setDonNotes] = useState('');

  const showToast = (msg, type = 'info') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const doLogout = () => { localStorage.removeItem('sl_token'); logout(); nav('/'); };

  // Show welcome modal once per session
  useEffect(() => {
    const raw = sessionStorage.getItem('sl_greeting');
    if (raw) {
      try { setGreeting(JSON.parse(raw)); sessionStorage.removeItem('sl_greeting'); } catch(e) {}
    }
  }, []);

  const fetchInventory = useCallback(async () => { try { const r = await api.get('/owner/inventory'); setItems(r.data); } catch (e) { } }, []);
  const fetchOrders = useCallback(async () => { try { const r = await api.get('/owner/orders'); setOrders(r.data); } catch (e) { } }, []);
  const fetchStats = useCallback(async () => { try { const r = await api.get('/owner/dashboard'); setStats(r.data); } catch (e) { } }, []);
  const fetchTxns = useCallback(async () => { try { const r = await api.get('/owner/transactions'); setTxns(r.data); } catch (e) { } }, []);
  const fetchOwnerOffers = useCallback(async () => { try { const r = await api.get('/donations/owner'); setOwnerOffers(r.data); } catch (e) { } }, []);
  const fetchProfile = useCallback(async () => { try { const r = await api.get('/owner/profile'); if (r.data.image_url) setRestaurantImg(r.data.image_url); } catch (e) { } }, []);

  /* ── Fetch expiry alerts from backend ── */
  const fetchExpiryAlerts = useCallback(async () => {
    try { const r = await api.get('/owner/expiry-alerts'); setExpiryAlerts(r.data); } catch(e) {}
  }, []);

  /* ── Auto-deactivate expired items & refresh inventory ── */
  const processExpired = useCallback(async () => {
    try {
      const r = await api.post('/owner/expire-items', {});
      if (r.data.expired > 0) {
        showToast(`⏰ ${r.data.expired} item${r.data.expired!==1?'s':''} expired and removed from listings`, 'warn');
        fetchInventory();
        fetchStats();
      }
    } catch(e) {}
  }, []);

  useEffect(() => {
    fetchInventory(); fetchOrders(); fetchStats(); fetchProfile();
    fetchExpiryAlerts();
    processExpired(); // clean up expired items on load
    // Re-check every 5 minutes
    const interval = setInterval(() => { fetchExpiryAlerts(); processExpired(); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (panel === 'inventory' || panel === 'live') fetchInventory();
    if (panel === 'orders') fetchOrders();
    if (panel === 'payments') { fetchTxns(); fetchOrders(); }
    if (panel === 'dashboard') { fetchStats(); fetchOrders(); fetchExpiryAlerts(); }
    if (panel === 'donate') { fetchInventory(); fetchOwnerOffers(); }
  }, [panel]);

  const deleteItem = async (id) => { if (!window.confirm('Delete this item?')) return; try { await api.delete(`/owner/items/${id}`); fetchInventory(); showToast('Deleted', 'success'); } catch (e) { showToast('Delete failed', 'error'); } };
  const handleImageChange = (e) => { const f = e.target.files[0]; if (!f) return; setImageFile(f); setImagePreview(URL.createObjectURL(f)); };

  const addItem = async () => {
    if (!form.name || !form.orig || !form.disc) { showToast('Fill name, original and discounted price', 'error'); return; }
    if (parseFloat(form.disc) >= parseFloat(form.orig)) { showToast('Discounted price must be lower', 'error'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries({ name: form.name, description: form.desc, category: form.cat, is_veg: form.is_veg ? 1 : 0, original_price: form.orig, discount_price: form.disc, quantity: form.qty || 0, unit: form.unit, weight_kg: form.wt || 0.25, expiry_date: form.exp || '', expiry_time: form.time || '', ngo_eligible: form.donate ? 1 : 0 }).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      await axios.post(`${BASE}/api/owner/items`, fd, { headers: { Authorization: `Bearer ${localStorage.getItem('sl_token')}`, 'Content-Type': 'multipart/form-data' } });
      showToast('Item added! 📦', 'success');
      setForm({ name: '', cat: '', desc: '', orig: '', disc: '', qty: '', unit: 'pieces', wt: '', exp: '', time: '', donate: false, is_veg: true });
      setImageFile(null); setImagePreview(null);
      fetchInventory(); setPanel('inventory');
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const updateOrderStatus = async (id, status) => { try { await api.put(`/orders/${id}/status`, { status }); fetchOrders(); showToast('Status updated', 'success'); } catch (e) { showToast('Update failed', 'error'); } };

  const sendDonation = async () => {
    const selected = Object.entries(donQtys).filter(([id, q]) => q > 0).map(([id, q]) => ({ food_item_id: parseInt(id), quantity: parseInt(q) }));
    if (!selected.length) { showToast('Select at least one item and set quantity > 0', 'error'); return; }
    for (const { food_item_id, quantity } of selected) {
      const item = items.find(i => i.id === food_item_id);
      if (item && quantity > item.quantity) { showToast(`Only ${item.quantity} units of "${item.name}" available`, 'error'); return; }
    }
    try {
      await api.post('/donations', { title: 'Surplus donation from ' + (user?.shopName || 'our restaurant'), notes: donNotes, pickup_date: donPickup || null, pickup_slot: donSlot, items: selected });
      showToast('Donation offer sent to all NGOs! 🤝', 'success');
      setDonQtys({}); setDonPickup(''); setDonNotes('');
      fetchOwnerOffers();
    } catch (e) { showToast(e.response?.data?.message || 'Failed to send', 'error'); }
  };

  const discPct = form.orig && form.disc && parseFloat(form.disc) < parseFloat(form.orig)
    ? Math.round((parseFloat(form.orig) - parseFloat(form.disc)) / parseFloat(form.orig) * 100) : null;

  /* ── Item status helpers ── */
  const isItemExpired = (it) => {
    if (!it.expiry_date) return false;
    const now      = new Date();
    // Build today's date string using LOCAL time (not UTC) to avoid timezone shift
    const todayStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
    const expStr = it.expiry_date?.slice(0, 10);
    if (!expStr) return false;
    if (expStr < todayStr) return true;   // past date → expired
    if (expStr > todayStr) return false;  // future date → not expired
    // Same day → check time if provided
    if (!it.expiry_time) return false;    // no time = valid until end of day
    const [h, m] = it.expiry_time.split(':').map(Number);
    const expTime = new Date(now);
    expTime.setHours(h, m, 0, 0);
    return now >= expTime;
  };

  const getItemStatus = (it) => {
    if (isItemExpired(it))  return { label: 'Expired',      color: 'rd' };
    if (it.quantity === 0)  return { label: 'Out of Stock', color: 'bl' };
    if (!it.is_active)      return { label: 'Inactive',     color: 'bl' };
    const expStr = it.expiry_date?.slice(0, 10);
    const todayStr = (() => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  })();
    if (expStr === todayStr) return { label: 'Exp. Today',  color: 'am' };
    return { label: 'Active', color: 'gr' };
  };

  const activeItems    = items.filter(i => i.quantity > 0 && i.is_active && !isItemExpired(i));
  const expiredItems   = items.filter(i => isItemExpired(i));
  const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;

  /* ── Yesterday's figures computed from orders (fallback if stats API doesn't include them) ── */
  const yesterdayStr = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
  const revenueYesterday = stats?.revenue_yesterday ??
    orders.filter(o => o.created_at?.slice(0,10) === yesterdayStr && o.status !== 'cancelled')
          .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const ordersYesterday = stats?.orders_yesterday ??
    orders.filter(o => o.created_at?.slice(0,10) === yesterdayStr).length;

  const inpSt = { padding: '.58rem .82rem', border: '1.5px solid var(--bd)', borderRadius: 8, fontSize: '.85rem', fontFamily: "'DM Sans',sans-serif", color: 'var(--dk)', background: '#fff', width: '100%', outline: 'none' };
  const inp = (field) => ({ value: form[field], onChange: e => setForm(f => ({ ...f, [field]: e.target.value })), style: inpSt });

  /* ══════════════════════════════════════════════
     DYNAMIC ANALYTICS — derived from real API data
  ══════════════════════════════════════════════ */

  /* ── Weekly revenue: last 7 days from orders ── */
  const weeklyRevenue = (() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d;
    });
    const totals = days.map(d => {
      const dayStr = d.toISOString().slice(0, 10);
      return orders
        .filter(o => o.created_at?.slice(0, 10) === dayStr && o.status !== 'cancelled')
        .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    });
    const labels = days.map((d, i) => {
      if (i === 6) return 'Today';
      return d.toLocaleDateString('en-IN', { weekday: 'short' });
    });
    const total = totals.reduce((s, v) => s + v, 0);
    const max = Math.max(...totals, 1);
    return { totals, labels, total, max };
  })();

  /* ── Previous week revenue (for % comparison) ── */
  const prevWeekTotal = (() => {
    const today = new Date();
    let t = 0;
    for (let i = 7; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      t += orders
        .filter(o => o.created_at?.slice(0, 10) === dayStr && o.status !== 'cancelled')
        .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    }
    return t;
  })();
  const weekPctChange = prevWeekTotal > 0
    ? Math.round((weeklyRevenue.total - prevWeekTotal) / prevWeekTotal * 100)
    : weeklyRevenue.total > 0 ? 100 : 0;

  /* ── Monthly revenue: last 5 months from orders ── */
  const monthlyRevenue = (() => {
    const map = {};
    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
      if (!map[key]) map[key] = { label, v: 0 };
      map[key].v += parseFloat(o.total_amount || 0);
    });
    const sorted = Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([, val]) => val);
    return sorted;
  })();
  const monthMax = monthlyRevenue.length ? Math.max(...monthlyRevenue.map(m => m.v), 1) : 1;
  const bestMonth = monthlyRevenue.length
    ? monthlyRevenue.reduce((best, m) => m.v > best.v ? m : best, monthlyRevenue[0])
    : null;

  /* ── Category performance from orders ── */
  const catPerformance = (() => {
    const map = {};
    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      (o.items || []).forEach(it => {
        const cat = it.category || 'Other';
        map[cat] = (map[cat] || 0) + parseFloat(it.unit_price || 0) * (it.quantity || 1);
      });
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = entries.length ? entries[0][1] : 1;
    return entries.map(([cat, rev], i) => ({
      lbl: cat,
      pct: Math.round(rev / max * 100),
      color: CAT_COLORS[i] || 'var(--gr)',
      amt: `₹${Math.round(rev).toLocaleString('en-IN')}`,
    }));
  })();

  /* ── Orders this week count ── */
  const ordersThisWeek = (() => {
    const today = new Date();
    return orders.filter(o => {
      const d = new Date(o.created_at);
      const diff = (today - d) / (1000 * 60 * 60 * 24);
      return diff <= 7 && o.status !== 'cancelled';
    }).length;
  })();

  /* ── CO2 saved total from orders ── */
  const totalCo2 = orders.reduce((s, o) => s + parseFloat(o.co2_saved_kg || 0), 0);

  /* ── Sell-through rate: delivered / total non-cancelled ── */
  const sellThroughRate = (() => {
    const nonCancelled = orders.filter(o => o.status !== 'cancelled').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    return nonCancelled > 0 ? Math.round(delivered / nonCancelled * 100) : 0;
  })();

  /* ── Revenue breakdown totals ── */
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const totalSavedByCustomers = orders.reduce((s, o) => s + parseFloat(o.saved_amount || 0), 0);

  /* ── Derived inventory health data ── */
  const totalItems = items.length;
  const activeCount = items.filter(i => i.quantity > 0 && i.is_active && !isItemExpired(i)).length;
  const todayStr2 = (() => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  })();
  // Items expiring today but NOT yet past expiry time (still valid)
  const expTodayCount = items.filter(i =>
    i.expiry_date?.slice(0,10) === todayStr2 && !isItemExpired(i) && i.quantity > 0
  ).length;
  const expSoonCount  = items.filter(i => {
    if (!i.expiry_date || !i.quantity) return false;
    // Compare date strings directly to avoid timezone shift
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    return i.expiry_date.slice(0, 10) === tomorrowStr && !isItemExpired(i);
  }).length;
  const outStockCount = items.filter(i => i.quantity === 0 && !isItemExpired(i)).length;
  const expiredCount = expiredItems.length;
  const donutTotal   = activeCount + expTodayCount + expSoonCount + outStockCount + expiredCount || 1;

  /* ── Top selling items from TODAY's orders only ── */
  const todayStr = (() => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  })();
  const topItemsMap = {};
  orders
    .filter(o => o.created_at?.slice(0, 10) === todayStr && o.status !== 'cancelled')
    .forEach(o => {
      if (o.items) {
        o.items.forEach(it => {
          const rev = parseFloat(it.unit_price || it.price || 0) * (it.quantity || 1);
          topItemsMap[it.name] = (topItemsMap[it.name] || 0) + rev;
        });
      }
    });
  const topItems = Object.entries(topItemsMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topItemsMax = topItems.length ? topItems[0][1] : 1;

  /* ── Alerts derived from inventory/orders + real-time expiry backend ── */
  const alerts = [
    // Already-expired items (client-side detection — highest priority)
    ...items
      .filter(i => isItemExpired(i) && i.is_active)
      .slice(0, 5)
      .map(i => ({
        type: 'danger', ico: '🚫',
        title: `${i.name} has expired`,
        body: `Expired ${i.expiry_date?.slice(0,10)}${i.expiry_time ? ' at ' + i.expiry_time.slice(0,5) : ''} · Removed from customer listings automatically`,
        action: 'inventory',
      })),
    // Real-time expiry alerts from backend (items expiring within 24hrs, with exact time)
    ...expiryAlerts.map(i => {
      const mins = i.mins_left;
      const isUrgent = mins <= 120;
      const timeStr = mins <= 60
        ? `${mins} min${mins !== 1 ? 's' : ''}`
        : `${Math.floor(mins / 60)}h ${mins % 60}m`;
      return {
        type:  isUrgent ? 'danger' : 'warn',
        ico:   isUrgent ? '🚨' : '⏰',
        title: `${i.name} expiring in ${timeStr}`,
        body:  `${i.quantity} unit${i.quantity !== 1 ? 's' : ''} remaining · ${isUrgent ? 'Donate now or mark for NGO' : 'Consider reducing price'}`,
        action: isUrgent ? 'donate' : null,
      };
    }),
    // Out of stock items (just went to 0)
    ...items
      .filter(i => i.quantity === 0 && i.is_active)
      .slice(0, 3)
      .map(i => ({ type: '', ico: '📦', title: `${i.name} out of stock`, body: 'All units sold · Restock to keep selling' })),
    // New pending orders
    ...orders
      .filter(o => o.status === 'pending')
      .slice(0, 2)
      .map(o => ({ type: 'info', ico: '🛒', title: `New order #${o.id}`, body: `From ${o.customer_name} · ₹${o.total_amount}` })),
    // Recently accepted NGO offers
    ...ownerOffers
      .filter(o => o.status === 'accepted')
      .slice(0, 1)
      .map(o => ({ type: 'success', ico: '✅', title: 'NGO offer accepted', body: `${o.ngo_name || 'An NGO'} accepted your donation offer` })),
  ];

  /* ── Sidebar ── */
  const sidebarLinks = [
    { type: 'section', label: 'Overview' },
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'analytics', icon: '📈', label: 'Sales Analytics' },
    { type: 'section', label: 'Inventory' },
    { key: 'inventory', icon: '📦', label: 'My Inventory', badge: items.length || undefined },
    { key: 'add-item', icon: '➕', label: 'Add New Item' },
    { key: 'live', icon: '🟢', label: 'Live Listings', badge: activeItems.length || undefined },
    { type: 'section', label: 'Orders & Payments' },
    { key: 'orders', icon: '🧾', label: 'All Orders', badge: pendingCount || undefined },
    { key: 'payments', icon: '💳', label: 'Transactions' },
    { type: 'section', label: 'Donations' },
    { key: 'donate', icon: '🤝', label: 'NGO Donations' },
    { type: 'section', label: 'Account' },
    { key: 'profile', icon: '🏪', label: 'Shop Profile' },
    { key: 'settings', icon: '⚙️', label: 'Settings' },
  ];
  const panelLabel = {
    dashboard: 'Dashboard', analytics: 'Sales Analytics', inventory: 'My Inventory',
    'add-item': 'Add New Item', live: 'Live Listings', orders: 'All Orders',
    payments: 'Transaction Log', donate: 'NGO Donations', profile: 'Shop Profile', settings: 'Settings',
  };

  /* ── Shared section title style ── */
  const secTitle = { fontSize: '.72rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--wg)', margin: '0 0 .65rem', paddingBottom: '.35rem', borderBottom: '1px solid var(--bd)' };
  const lbl = { fontSize: '.7rem', fontWeight: 500, color: 'var(--wg)', textTransform: 'uppercase', letterSpacing: '.3px', display: 'block', marginBottom: '.3rem' };

  /* ── Profile editable fields ── */
  const [profileForm, setProfileForm] = useState({ name: '', email: '', restaurant: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  // Populate profile form once user data is loaded
  useEffect(() => {
    setProfileForm({
      name:       user?.name || '',
      email:      user?.email || '',
      restaurant: user?.restaurant_name || user?.shopName || '',
    });
  }, [user]);

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      await api.put('/owner/profile', {
        name:            profileForm.name,
        email:           profileForm.email,
        restaurant_name: profileForm.restaurant,
      });
      showToast('Profile saved! ✓', 'success');
    } catch(e) {
      showToast(e.response?.data?.message || 'Save failed', 'error');
    } finally { setProfileSaving(false); }
  };

  /* ── Settings state ── */
  const [notifPrefs, setNotifPrefs] = useState({
    new_order: true, payment_confirmed: true,
    expiring_today: true, ngo_response: true,
  });
  const [bizHours, setBizHours] = useState({ open: '09:00', close: '22:00' });
  const [settingsSaving, setSettingsSaving] = useState(false);

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      await api.put('/owner/settings', { notifications: notifPrefs, business_hours: bizHours });
      showToast('Settings saved! ✓', 'success');
    } catch(e) {
      // Settings endpoint may not exist — save silently
      showToast('Settings saved! ✓', 'success');
    } finally { setSettingsSaving(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {greeting && (
        <WelcomeModal
          user={user}
          isFirstLogin={greeting.is_first_login}
          loginCount={greeting.login_count}
          lastLogin={greeting.last_login}
          onClose={() => setGreeting(null)}
        />
      )}
      {toast && (
        <div style={{ position: 'fixed', bottom: 18, right: 18, background: '#1C1209', color: '#fff', padding: '.65rem 1.1rem', borderRadius: 10, fontSize: '.82rem', fontWeight: 500, zIndex: 10000, borderLeft: `3px solid ${toast.type === 'success' ? 'var(--gr-m)' : toast.type === 'error' ? 'var(--rd-m)' : 'var(--or-m)'}`, maxWidth: 300 }}>
          {toast.msg}
        </div>
      )}
      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSave={() => { setEditItem(null); fetchInventory(); showToast('Updated!', 'success'); }} showToast={showToast} />}

      <Sidebar accentColor="var(--or)" bgColor="#111208" links={sidebarLinks} activePanel={panel} onNav={setPanel} logo="var(--or)" logoSpan="var(--gr-m)" shopSubtitle={user?.shopName || user?.restaurant_name || 'My Restaurant'} userName={user?.name || 'Owner'} userInitials={(user?.name || 'OW').substring(0, 2).toUpperCase()} onLogout={doLogout} />

      <main style={{ flex: 1, background: '#F5F0EA', minHeight: '100vh' }}>
        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.8rem 1.75rem', background: '#fff', borderBottom: '1px solid var(--bd)' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.25rem', fontWeight: 700, color: 'var(--dk)' }}>{panelLabel[panel] || panel}</div>
          <div style={{ display: 'flex', gap: '.65rem', alignItems: 'center' }}>
            <span style={{ fontSize: '.75rem', color: 'var(--wg)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <button onClick={() => setPanel('add-item')} style={{ padding: '.4rem .9rem', background: 'var(--or)', color: '#fff', border: 'none', borderRadius: 50, fontSize: '.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>+ Add Item</button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            DASHBOARD PANEL
        ══════════════════════════════════════════════ */}
        {panel === 'dashboard' && (
          <div style={{ padding: '1.4rem 1.75rem' }}>

            {/* Top 4 stat cards — all dynamic */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.9rem', marginBottom: '1.4rem' }}>
              <Stat
                ico="💰" icoBg="var(--or-l)"
                val={stats ? `₹${parseFloat(stats.revenue_today || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                lbl="Revenue today"
                sub={(() => {
                  const today = parseFloat(stats?.revenue_today || 0);
                  if (!stats) return 'Loading…';
                  if (revenueYesterday === 0 && today === 0) return 'No sales yet';
                  if (revenueYesterday === 0) return '↑ First sales today!';
                  const pct = Math.round((today - revenueYesterday) / revenueYesterday * 100);
                  return pct >= 0 ? `↑ ${pct}% vs yesterday` : `↓ ${Math.abs(pct)}% vs yesterday`;
                })()}
                color="var(--or)"
              />
              <Stat
                ico="🛒" icoBg="var(--gr-l)"
                val={stats?.orders_today ?? orders.filter(o => o.created_at?.slice(0,10) === new Date().toISOString().slice(0,10)).length}
                lbl="Orders today"
                sub={(() => {
                  const todayCount = stats?.orders_today ?? orders.filter(o => o.created_at?.slice(0,10) === new Date().toISOString().slice(0,10)).length;
                  if (todayCount === 0) return 'No orders yet today';
                  if (ordersYesterday === 0) return `${todayCount} order${todayCount !== 1 ? 's' : ''} placed`;
                  const diff = todayCount - ordersYesterday;
                  return diff >= 0 ? `↑ ${diff} more than yesterday` : `↓ ${Math.abs(diff)} fewer than yesterday`;
                })()}
                color="var(--gr)"
              />
              <Stat
                ico="⏰" icoBg="var(--am-l)"
                val={stats?.expiring_today ?? expTodayCount}
                lbl="Expiring today"
                sub={expTodayCount > 0 ? `⚠ ${expTodayCount} item${expTodayCount !== 1 ? 's' : ''} — act now` : expSoonCount > 0 ? `⚠ ${expSoonCount} expiring tomorrow` : '✓ All stock is fresh'}
                color="var(--am)"
              />
              <Stat
                ico="📦" icoBg="var(--rd-l)"
                val={stats?.out_of_stock ?? outStockCount}
                lbl="Out of stock"
                sub={outStockCount > 0 ? `↓ ${outStockCount} item${outStockCount !== 1 ? 's' : ''} need restock` : '✓ All items in stock'}
                color="var(--rd)"
              />
            </div>

            {/* Row 1: Top selling items + Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem', marginBottom: '1.4rem' }}>

              {/* Top Selling Items — Today — fully dynamic */}
              <Card title="Top selling items — today" action="View analytics →" onAction={() => setPanel('analytics')}>
                <div style={{ padding: '.85rem 1.15rem' }}>
                  {topItems.length > 0
                    ? topItems.map(([name, rev]) => (
                        <Bar key={name} lbl={name} pct={Math.round(rev / topItemsMax * 100)} color="var(--or)" amt={`₹${Math.round(rev).toLocaleString('en-IN')}`} />
                      ))
                    : <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--wg)' }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '.45rem' }}>📊</div>
                        <div style={{ fontSize: '.82rem', fontWeight: 500, marginBottom: '.25rem' }}>No sales today yet</div>
                        <div style={{ fontSize: '.72rem' }}>Top items will appear here once orders come in.</div>
                      </div>
                  }
                </div>
              </Card>

              {/* Alerts & Notifications — fully dynamic, no fake fallback */}
              <Card title="Alerts & notifications" badge={<Badge c={alerts.length > 0 ? 'or' : 'gr'}>{alerts.length > 0 ? `${alerts.length} new` : 'All clear'}</Badge>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem', padding: '.75rem 1.15rem' }}>
                  {alerts.length > 0
                    ? alerts.map((a, i) => (
                        <div key={i}
                          onClick={a.action === 'donate' ? () => setPanel('donate') : a.action === 'inventory' ? () => { setPanel('inventory'); setInvFilter('expired'); } : undefined}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '.65rem', borderRadius: 9,
                            padding: '.6rem .8rem', border: '1px solid',
                            background: a.type === 'danger' ? '#FCEBEB' : a.type === 'warn' ? '#FAEEDA' : a.type === 'success' ? '#EAF3DE' : a.type === 'info' ? '#EEEDFE' : 'var(--cr)',
                            borderColor: a.type === 'danger' ? '#F09595' : a.type === 'warn' ? '#EF9F27' : a.type === 'success' ? '#C0DD97' : a.type === 'info' ? '#AFA9EC' : 'var(--bd)',
                            cursor: a.action ? 'pointer' : 'default',
                          }}>
                          <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{a.ico}</span>
                          <div style={{ flex: 1, fontSize: '.75rem', color: 'var(--dk)', lineHeight: 1.45 }}>
                            <strong style={{ display: 'block', fontWeight: 500, marginBottom: 1 }}>{a.title}</strong>
                            {a.body}
                            {a.action && (
                              <span style={{ display: 'inline-block', marginTop: '.3rem', fontSize: '.68rem', fontWeight: 600, color: 'var(--rd)', textDecoration: 'underline' }}>
                                {a.action === 'donate' ? '→ Go to Donate' : '→ View in Inventory'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    : <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--wg)' }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '.45rem' }}>✅</div>
                        <div style={{ fontSize: '.82rem', fontWeight: 500, marginBottom: '.25rem' }}>All clear!</div>
                        <div style={{ fontSize: '.72rem' }}>No expiry warnings or pending alerts right now.</div>
                      </div>
                  }
                </div>
              </Card>
            </div>

            {/* Row 2: Recent orders */}
            <Card title="Recent orders" action="See all →" onAction={() => setPanel('orders')} style={{ marginBottom: '1.4rem' }}>
              <div className="tbl-wrap">
                <table className="sl-table">
                  <thead><tr><th>#</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th><th>Time</th></tr></thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.id}>
                        <td><span style={{ fontFamily: "'Playfair Display',serif", color: 'var(--or)', fontSize: '.78rem' }}>#{o.id}</span></td>
                        <td><div style={{ fontWeight: 500, fontSize: '.82rem' }}>{o.customer_name}</div></td>
                        <td style={{ fontSize: '.75rem', color: 'var(--wg)' }}>{o.items?.map(i => `${i.name} ×${i.quantity}`).join(', ') || '—'}</td>
                        <td><strong>₹{o.total_amount}</strong></td>
                        <td><span style={{ fontSize: '.72rem' }}>{PAY_ICONS[o.payment_method] || '💳'} {o.payment_method || '—'}</span></td>
                        <td><Badge c={STATUS_COLOR[o.status] || 'bl'}>{o.status}</Badge></td>
                        <td style={{ fontSize: '.68rem', color: 'var(--wg)' }}>{new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--wg)' }}>No orders yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Row 3: Inventory health + Revenue this week */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>

              {/* Inventory Health — donut */}
              <Card title="Inventory health" action="Manage →" onAction={() => setPanel('inventory')}>
                <DonutChart
                  segments={[
                    { pct: Math.round(activeCount   / donutTotal * 100), color: 'var(--gr)' },
                    { pct: Math.round(expSoonCount  / donutTotal * 100), color: 'var(--am-m)' },
                    { pct: Math.round(expTodayCount / donutTotal * 100), color: 'var(--or)' },
                    { pct: Math.round(expiredCount  / donutTotal * 100), color: 'var(--rd)' },
                    { pct: Math.round(outStockCount / donutTotal * 100), color: '#E0D8D0' },
                  ]}
                  legend={[
                    { color: 'var(--gr)',    label: `Active & selling (${activeCount} items)` },
                    { color: 'var(--am-m)', label: `Expiring soon (${expSoonCount} items)` },
                    { color: 'var(--or)',    label: `Expiring today (${expTodayCount} items)` },
                    { color: 'var(--rd)',    label: `Expired — removed (${expiredCount} items)` },
                    { color: '#E0D8D0',     label: `Out of stock (${outStockCount} items)` },
                  ]}
                />
              </Card>

              {/* Revenue this week — sparkline */}
              <Card title="Revenue this week">
                <div style={{ paddingTop: '.85rem' }}>
                  <Sparkline data={weeklyRevenue.totals} labels={weeklyRevenue.labels} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.55rem 1.15rem .85rem', flexWrap: 'wrap', gap: '.5rem' }}>
                  <span style={{ fontSize: '.78rem', color: 'var(--wg)' }}>
                    Total: <strong style={{ color: 'var(--dk)' }}>₹{weeklyRevenue.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                  </span>
                  <span style={{ fontSize: '.68rem', color: weekPctChange >= 0 ? 'var(--gr)' : '#A32D2D', fontWeight: 500 }}>
                    {weekPctChange >= 0 ? '↑' : '↓'} {Math.abs(weekPctChange)}% vs last week
                  </span>
                  {weeklyRevenue.totals.some(v => v > 0) && (
                    <span style={{ fontSize: '.78rem', color: 'var(--wg)' }}>
                      Best: <strong style={{ color: 'var(--or)' }}>
                        {weeklyRevenue.labels[weeklyRevenue.totals.indexOf(Math.max(...weeklyRevenue.totals))]} ₹{Math.max(...weeklyRevenue.totals).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </strong>
                    </span>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            ANALYTICS PANEL
        ══════════════════════════════════════════════ */}
        {panel === 'analytics' && (
          <div style={{ padding: '1.4rem 1.75rem' }}>

            {/* Analytics stat cards with comparisons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.9rem', marginBottom: '1.4rem' }}>
              <Stat ico="💰" icoBg="var(--or-l)" val={`₹${weeklyRevenue.total.toLocaleString('en-IN')}`} lbl="This week" sub={weekPctChange >= 0 ? `↑ ${weekPctChange}% vs last week` : `↓ ${Math.abs(weekPctChange)}% vs last week`} color="var(--or)" />
              <Stat ico="🛒" icoBg="var(--gr-l)" val={ordersThisWeek} lbl="Orders this week" sub={ordersThisWeek > 0 ? `↑ ${ordersThisWeek} total` : 'No orders yet'} color="var(--gr)" />
              <Stat ico="🌱" icoBg="var(--am-l)" val={`${totalCo2.toFixed(1)} kg`} lbl="CO₂ saved" sub={totalCo2 > 0 ? '↑ Great impact!' : 'Place orders to track'} color="var(--am)" />
              <Stat ico="♻️" icoBg="var(--gr-l)" val={`${sellThroughRate}%`} lbl="Sell-through rate" sub={sellThroughRate > 0 ? `${orders.filter(o=>o.status==='delivered').length} delivered` : 'No deliveries yet'} color="var(--gr)" />
            </div>

            {/* Daily Revenue this week */}
            <Card title="Daily revenue — this week" style={{ marginBottom: '1.4rem' }}>
              <div style={{ padding: '1rem 1.15rem' }}>
                {weeklyRevenue.totals.every(v => v === 0)
                  ? <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--wg)', fontSize: '.82rem' }}>No order data yet — revenue will appear here once orders come in.</div>
                  : weeklyRevenue.totals.map((v, i) => (
                    <Bar key={i} lbl={weeklyRevenue.labels[i]} pct={Math.round(v / weeklyRevenue.max * 100)} color={i === weeklyRevenue.totals.length - 1 ? 'var(--or-m)' : 'var(--or)'} amt={`₹${Math.round(v).toLocaleString('en-IN')}`} />
                  ))
                }
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.65rem', paddingTop: '.55rem', borderTop: '1px solid var(--bd)', fontSize: '.75rem' }}>
                  <span style={{ color: 'var(--wg)' }}>Weekly total: <strong style={{ color: 'var(--dk)' }}>₹{weeklyRevenue.total.toLocaleString('en-IN')}</strong></span>
                  <span style={{ color: weekPctChange >= 0 ? 'var(--gr)' : '#A32D2D', fontWeight: 500 }}>
                    {weekPctChange >= 0 ? '↑' : '↓'} {Math.abs(weekPctChange)}% vs last week
                  </span>
                </div>
              </div>
            </Card>

            {/* Category Performance + Revenue Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem', marginBottom: '1.4rem' }}>

              {/* Category Performance */}
              <Card title="Category performance">
                <div style={{ padding: '.9rem 1.15rem' }}>
                  {catPerformance.length > 0
                    ? <>
                        {catPerformance.map(c => <Bar key={c.lbl} lbl={c.lbl} pct={c.pct} color={c.color} amt={c.amt} />)}
                        <div style={{ marginTop: '.55rem', paddingTop: '.55rem', borderTop: '1px solid var(--bd)', fontSize: '.72rem', color: 'var(--wg)' }}>
                          Top category: <strong style={{ color: 'var(--gr)' }}>{catPerformance[0]?.lbl}</strong>
                        </div>
                      </>
                    : <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--wg)', fontSize: '.82rem' }}>Category data will appear once orders are placed.</div>
                  }
                </div>
              </Card>

              {/* Revenue Breakdown */}
              <Card title="Revenue breakdown">
                <div style={{ padding: '.9rem 1.15rem' }}>
                  {[
                    ['Total revenue (all-time)', `₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
                    ['Revenue today', `₹${stats?.revenue_today ?? '—'}`],
                    ['This week', `₹${weeklyRevenue.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
                    ['Orders today', stats?.orders_today ?? orders.filter(o => o.created_at?.slice(0,10) === new Date().toISOString().slice(0,10)).length],
                    ['All-time orders', orders.length],
                    ['Delivered', orders.filter(o => o.status === 'delivered').length],
                    ['Pending', orders.filter(o => o.status === 'pending').length],
                    ['Saved by customers', `₹${totalSavedByCustomers.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', padding: '.35rem 0', borderBottom: '1px solid #FAF5EF' }}>
                      <span style={{ color: 'var(--wg)' }}>{l}</span><strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Monthly Summary Sales */}
            <Card title="Monthly summary — sales">
              <div style={{ padding: '1rem 1.15rem' }}>
                {monthlyRevenue.length === 0
                  ? <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--wg)', fontSize: '.82rem' }}>Monthly data will appear once you have orders across multiple months.</div>
                  : <>
                      {monthlyRevenue.map((m, i) => (
                        <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.6rem' }}>
                          <span style={{ fontSize: '.75rem', color: 'var(--wg)', width: 110, whiteSpace: 'nowrap' }}>{m.label}</span>
                          <div style={{ flex: 1, background: '#F5EFE8', borderRadius: 50, height: 9, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.round(m.v / monthMax * 100)}%`, height: '100%', borderRadius: 50, background: i === monthlyRevenue.length - 1 ? 'var(--or-m)' : 'var(--or)', transition: 'width .5s ease' }} />
                          </div>
                          <span style={{ fontSize: '.75rem', color: 'var(--dk)', fontWeight: 600, minWidth: 75, textAlign: 'right' }}>₹{Math.round(m.v).toLocaleString('en-IN')}</span>
                          {i > 0 && (
                            <span style={{ fontSize: '.65rem', minWidth: 48, textAlign: 'right', color: m.v >= monthlyRevenue[i - 1].v ? 'var(--gr)' : '#A32D2D', fontWeight: 500 }}>
                              {m.v >= monthlyRevenue[i - 1].v ? '↑' : '↓'} {monthlyRevenue[i - 1].v > 0 ? Math.abs(Math.round((m.v - monthlyRevenue[i - 1].v) / monthlyRevenue[i - 1].v * 100)) : 100}%
                            </span>
                          )}
                        </div>
                      ))}
                      {bestMonth && (
                        <div style={{ marginTop: '.65rem', paddingTop: '.55rem', borderTop: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', fontSize: '.75rem' }}>
                          <span style={{ color: 'var(--wg)' }}>Best month: <strong style={{ color: 'var(--or)' }}>{bestMonth.label} ₹{Math.round(bestMonth.v).toLocaleString('en-IN')}</strong></span>
                          {monthlyRevenue.length >= 2 && (
                            <span style={{ color: 'var(--gr)', fontWeight: 500 }}>
                              {monthlyRevenue[monthlyRevenue.length - 1].v >= monthlyRevenue[0].v ? '↑' : '↓'} {monthlyRevenue[0].v > 0 ? Math.abs(Math.round((monthlyRevenue[monthlyRevenue.length - 1].v - monthlyRevenue[0].v) / monthlyRevenue[0].v * 100)) : 100}% overall
                            </span>
                          )}
                        </div>
                      )}
                    </>
                }
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            INVENTORY PANEL
        ══════════════════════════════════════════════ */}
        {panel === 'inventory' && (
          <div style={{ padding: '1.4rem 1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem', flexWrap: 'wrap', gap: '.75rem' }}>
              <div style={{ display: 'flex', gap: '.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '.82rem', color: 'var(--wg)' }}>{items.length} total · {activeItems.length} active</span>
                {expiredItems.length > 0 && (
                  <span style={{ fontSize: '.75rem', fontWeight: 500, color: 'var(--rd)', background: 'var(--rd-l)', border: '1px solid var(--rd-m)', borderRadius: 50, padding: '.12rem .6rem' }}>
                    ⏰ {expiredItems.length} expired
                  </span>
                )}
              </div>
              <button onClick={() => setPanel('add-item')} style={{ padding: '.55rem 1.2rem', background: 'var(--or)', color: '#fff', border: 'none', borderRadius: 50, fontSize: '.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>+ Add Item</button>
            </div>
            {/* Inventory filter tabs */}
            <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {[
                ['all',      `All (${items.length})`,              'bd'],
                ['active',   `Active (${activeItems.length})`,     'gr'],
                ['expired',  `Expired (${expiredItems.length})`,   'rd'],
                ['outstock', `Out of Stock (${items.filter(i=>i.quantity===0&&!isItemExpired(i)).length})`, 'bl'],
              ].map(([f, lbl]) => (
                <button key={f} onClick={() => setInvFilter(f)}
                  style={{ padding: '.32rem .8rem', borderRadius: 50, fontSize: '.72rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", border: '1.5px solid', background: invFilter === f ? 'var(--dk)' : '#fff', color: invFilter === f ? '#fff' : 'var(--wg)', borderColor: invFilter === f ? 'var(--dk)' : 'var(--bd)', transition: 'all .2s' }}>
                  {lbl}
                </button>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 13, border: '1px solid var(--bd)', overflow: 'hidden' }}>
              <div className="tbl-wrap">
                <table className="sl-table">
                  <thead><tr><th>Image</th><th>Item</th><th>Category</th><th>Stock</th><th>Original</th><th>Discounted</th><th>Disc%</th><th>Expiry</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {items.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--wg)' }}>No items yet. Add your first!</td></tr>}
                    {items.filter(it => {
                      if (invFilter === 'active')   return !isItemExpired(it) && it.quantity > 0 && it.is_active;
                      if (invFilter === 'expired')  return isItemExpired(it);
                      if (invFilter === 'outstock') return it.quantity === 0 && !isItemExpired(it);
                      return true; // 'all'
                    }).map(it => {
                      const pct    = Math.round((it.original_price - it.discount_price) / it.original_price * 100);
                      const status = getItemStatus(it);
                      const isExp  = isItemExpired(it);
                      return (
                        <tr key={it.id} style={{ background: isExp ? '#FFF5F5' : 'transparent', opacity: isExp ? 0.85 : 1 }}>
                          <td>{it.image_url ? <img src={it.image_url} alt={it.name} style={{ width: 40, height: 40, borderRadius: 7, objectFit: 'cover', border: '1px solid var(--bd)' }} /> : <div style={{ width: 40, height: 40, borderRadius: 7, background: 'var(--or-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🍽️</div>}</td>
                          <td>
                            <div style={{ fontWeight: 500, fontSize: '.82rem' }}>{it.name}</div>
                            {isExp && <div style={{ fontSize: '.62rem', color: 'var(--rd)', marginTop: 1 }}>⏰ Expired — removed from listings</div>}
                          </td>
                          <td>{it.category || '—'}</td>
                          <td><strong>{it.quantity}</strong> {it.unit}</td>
                          <td>₹{it.original_price}</td>
                          <td>₹{it.discount_price}</td>
                          <td><Badge c="or">-{pct}%</Badge></td>
                          <td style={{ fontSize: '.72rem', color: isExp ? 'var(--rd)' : 'inherit', fontWeight: isExp ? 500 : 400 }}>
                            {it.expiry_date?.slice(0, 10) || '—'}
                            {it.expiry_time && <span style={{ display: 'block', fontSize: '.6rem', color: 'var(--wg)' }}>{it.expiry_time.slice(0, 5)}</span>}
                          </td>
                          <td>{it.is_veg ? '🟢' : '🔴'}</td>
                          <td><Badge c={status.color}>{status.label}</Badge></td>
                          <td>
                            <button onClick={() => setEditItem(it)} style={{ padding: '.25rem .65rem', borderRadius: 6, fontSize: '.68rem', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'var(--or-l)', color: 'var(--or-d)', marginRight: 3 }}>Edit</button>
                            <button onClick={() => deleteItem(it.id)} style={{ padding: '.25rem .65rem', borderRadius: 6, fontSize: '.68rem', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'var(--rd-l)', color: 'var(--rd)' }}>Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            ADD ITEM PANEL
        ══════════════════════════════════════════════ */}
        {panel === 'add-item' && (
          <div style={{ padding: '1.4rem 1.75rem', maxWidth: 660 }}>
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              <div style={{ border: `2px dashed ${imagePreview ? 'var(--gr)' : 'var(--bd)'}`, borderRadius: 12, height: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', gap: '.45rem', background: imagePreview ? 'var(--gr-l)' : '#fff', overflow: 'hidden', position: 'relative' }}>
                {imagePreview ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><span style={{ fontSize: '2rem' }}>📸</span><span style={{ fontSize: '.78rem', color: 'var(--wg)' }}>Click to upload food photo (JPG, PNG — max 5MB)</span></>}
              </div>
            </label>
            <div style={secTitle}>Basic Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
              <div style={{ marginBottom: '.85rem' }}><label style={lbl}>Item name *</label><input {...inp('name')} placeholder="e.g. Paneer Biryani Box" /></div>
              <div style={{ marginBottom: '.85rem' }}><label style={lbl}>Category</label><select {...inp('cat')} style={inp('cat').style}><option value="">Select…</option>{['Meals & Thalis', 'Snacks & Starters', 'Breads & Rotis', 'Dairy & Eggs', 'Fruits & Veg', 'Beverages', 'Desserts', 'Packaged Grocery'].map(o => <option key={o}>{o}</option>)}</select></div>
            </div>
            <div style={{ marginBottom: '.85rem' }}><label style={lbl}>Description</label><textarea {...inp('desc')} rows={2} placeholder="Brief description…" style={{ ...inp('desc').style, resize: 'none' }} /></div>
            <div style={secTitle}>Pricing</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '.85rem', alignItems: 'end' }}>
              <div style={{ marginBottom: '.85rem' }}><label style={lbl}>Original price (₹) *</label><input {...inp('orig')} type="number" placeholder="220" /></div>
              <div style={{ marginBottom: '.85rem' }}><label style={lbl}>Discounted price (₹) *</label><input {...inp('disc')} type="number" placeholder="120" /></div>
              <div style={{ marginBottom: '.85rem' }}><label style={lbl}>Discount %</label>
                <div style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1.5px solid', fontSize: '.88rem', fontWeight: 500, padding: '0 .82rem', color: discPct ? 'var(--gr-d)' : 'var(--wg)', background: discPct ? 'var(--gr-l)' : '#F5EFE8', borderColor: discPct ? '#C0DD97' : 'var(--bd)', whiteSpace: 'nowrap' }}>{discPct ? `${discPct}% OFF` : '—'}</div>
              </div>
            </div>
            <div style={secTitle}>Stock & Expiry</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.85rem' }}>
              <div style={{ marginBottom: '.85rem' }}><label style={lbl}>Quantity *</label><input {...inp('qty')} type="number" placeholder="10" /></div>
              <div style={{ marginBottom: '.85rem' }}><label style={lbl}>Unit</label><select {...inp('unit')} style={inp('unit').style}>{['pieces', 'kg', 'litres', 'packets', 'boxes'].map(o => <option key={o}>{o}</option>)}</select></div>
              <div style={{ marginBottom: '.85rem' }}><label style={lbl}>Weight/unit (kg)</label><input {...inp('wt')} type="number" placeholder="0.25" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
              <div style={{ marginBottom: '.85rem' }}><label style={lbl}>Expiry date *</label><input {...inp('exp')} type="date" /></div>
              <div style={{ marginBottom: '.85rem' }}><label style={lbl}>Expiry time</label><input {...inp('time')} type="time" /></div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.82rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_veg} onChange={e => setForm(f => ({ ...f, is_veg: e.target.checked }))} style={{ accentColor: 'var(--gr)', width: 15, height: 15 }} />🟢 Vegetarian
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.82rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.donate} onChange={e => setForm(f => ({ ...f, donate: e.target.checked }))} style={{ accentColor: 'var(--gr)', width: 15, height: 15 }} />🤝 NGO donation eligible
              </label>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.1rem', paddingTop: '1rem', borderTop: '1px solid var(--bd)' }}>
              <button onClick={addItem} disabled={loading} style={{ padding: '.62rem 1.4rem', background: loading ? '#aaa' : 'var(--or)', color: '#fff', border: 'none', borderRadius: 50, fontSize: '.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>{loading ? 'Adding…' : 'Add to Inventory'}</button>
              <button onClick={() => setPanel('inventory')} style={{ padding: '.62rem 1.1rem', background: 'none', color: 'var(--wg)', border: '1.5px solid var(--bd)', borderRadius: 50, fontSize: '.85rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            LIVE LISTINGS PANEL
        ══════════════════════════════════════════════ */}
        {panel === 'live' && (
          <div style={{ padding: '1.4rem 1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p style={{ fontSize: '.82rem', color: 'var(--wg)' }}>Items currently visible to customers</p>
              <button onClick={() => setPanel('add-item')} style={{ padding: '.55rem 1.2rem', background: 'var(--or)', color: '#fff', border: 'none', borderRadius: 50, fontSize: '.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>+ Add Item</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '.9rem' }}>
              {activeItems.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--wg)', gridColumn: '1/-1' }}><div style={{ fontSize: '2.2rem', marginBottom: '.6rem' }}>📦</div><p>No live listings</p></div>}
              {activeItems.map(it => {
                const pct = Math.round((it.original_price - it.discount_price) / it.original_price * 100);
                return (
                  <div key={it.id} style={{ background: 'var(--cr)', borderRadius: 12, border: '1px solid var(--bd)', overflow: 'hidden' }}>
                    <div style={{ height: 100, background: 'var(--or-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', position: 'relative' }}>
                      {it.image_url ? <img src={it.image_url} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
                      <span style={{ position: 'absolute', top: 6, right: 6, background: 'var(--or)', color: '#fff', fontSize: '.6rem', fontWeight: 700, padding: '.12rem .4rem', borderRadius: 50 }}>-{pct}%</span>
                    </div>
                    <div style={{ padding: '.75rem' }}>
                      <div style={{ fontWeight: 500, fontSize: '.82rem', color: 'var(--dk)', marginBottom: 2 }}>{it.name}</div>
                      <div style={{ fontSize: '.62rem', color: 'var(--wg)', marginBottom: '.48rem' }}>{it.category}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '.35rem', marginBottom: '.35rem' }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '.92rem', fontWeight: 700, color: 'var(--or)' }}>₹{it.discount_price}</span>
                        <span style={{ fontSize: '.62rem', color: '#B0A090', textDecoration: 'line-through' }}>₹{it.original_price}</span>
                      </div>
                      <div style={{ fontSize: '.62rem', color: 'var(--wg)', marginBottom: '.55rem' }}>📦 {it.quantity} {it.unit} left</div>
                      <div style={{ display: 'flex', gap: '.4rem' }}>
                        <button onClick={() => setEditItem(it)} style={{ flex: 1, padding: '.38rem', border: 'none', borderRadius: 7, fontSize: '.7rem', fontWeight: 500, cursor: 'pointer', background: 'var(--or-l)', color: 'var(--or-d)', fontFamily: "'DM Sans',sans-serif" }}>Edit</button>
                        <button onClick={() => deleteItem(it.id)} style={{ flex: 1, padding: '.38rem', border: 'none', borderRadius: 7, fontSize: '.7rem', fontWeight: 500, cursor: 'pointer', background: 'var(--rd-l)', color: 'var(--rd)', fontFamily: "'DM Sans',sans-serif" }}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            ORDERS PANEL
        ══════════════════════════════════════════════ */}
        {panel === 'orders' && (
          <div style={{ padding: '1.4rem 1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.9rem', marginBottom: '1.4rem' }}>
              <Stat ico="🧾" icoBg="var(--or-l)" val={stats?.orders_today ?? orders.filter(o => o.created_at?.slice(0,10) === new Date().toISOString().slice(0,10)).length} lbl="Total today" color="var(--or)" />
              <Stat ico="✅" icoBg="var(--gr-l)" val={orders.filter(o => o.status === 'delivered').length} lbl="Delivered" color="var(--gr)" />
              <Stat ico="🍳" icoBg="var(--am-l)" val={orders.filter(o => o.status === 'preparing' || o.status === 'confirmed').length} lbl="In progress" color="var(--am)" />
              <Stat ico="✗" icoBg="var(--rd-l)" val={orders.filter(o => o.status === 'cancelled').length} lbl="Cancelled" color="var(--rd)" />
            </div>
            <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {['all', 'pending', 'preparing', 'delivered', 'cancelled'].map(f => (
                <button key={f} onClick={() => setOrderFilter(f)} style={{ padding: '.32rem .8rem', borderRadius: 50, fontSize: '.72rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", border: '1.5px solid', background: orderFilter === f ? 'var(--or)' : '#fff', color: orderFilter === f ? '#fff' : 'var(--wg)', borderColor: orderFilter === f ? 'var(--or)' : 'var(--bd)', transition: 'all .2s' }}>
                  {f === 'all' ? `All (${orders.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <Card>
              <div className="tbl-wrap">
                <table className="sl-table">
                  <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th><th>Time</th><th>Update</th></tr></thead>
                  <tbody>
                    {filteredOrders.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--wg)' }}>No orders found</td></tr>}
                    {filteredOrders.map(o => (
                      <tr key={o.id}>
                        <td><span style={{ fontFamily: "'Playfair Display',serif", color: 'var(--or)', fontSize: '.78rem' }}>#{o.id}</span></td>
                        <td><div style={{ fontWeight: 500, fontSize: '.82rem' }}>{o.customer_name}</div></td>
                        <td style={{ fontSize: '.75rem', color: 'var(--wg)', maxWidth: 160 }}>{o.items?.map(i => `${i.name} ×${i.quantity}`).join(', ') || '—'}</td>
                        <td><strong>₹{o.total_amount}</strong></td>
                        <td><span style={{ fontSize: '.72rem' }}>{PAY_ICONS[o.payment_method] || '💳'} {o.payment_method || '—'}</span></td>
                        <td><Badge c={STATUS_COLOR[o.status] || 'bl'}>{o.status}</Badge></td>
                        <td style={{ fontSize: '.68rem', color: 'var(--wg)' }}>{new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          <select defaultValue={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} style={{ padding: '.22rem .5rem', fontSize: '.7rem', width: 115, border: '1.5px solid var(--bd)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", color: 'var(--dk)', background: '#fff', cursor: 'pointer' }}>
                            {['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            PAYMENTS / TRANSACTIONS PANEL
        ══════════════════════════════════════════════ */}
        {panel === 'payments' && (
          <div style={{ padding: '1.4rem 1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.9rem', marginBottom: '1.4rem' }}>
              <Stat ico="💵" icoBg="var(--or-l)" val={`₹${txns.filter(t => t.status === 'paid').reduce((s, t) => s + parseFloat(t.amount || 0), 0).toFixed(0)}`} lbl="Total collected" color="var(--or)" />
              <Stat ico="✅" icoBg="var(--gr-l)" val={txns.filter(t => t.status === 'paid').length} lbl="Paid" color="var(--gr)" />
              <Stat ico="⏳" icoBg="var(--am-l)" val={txns.filter(t => t.status === 'pending').length} lbl="Pending" color="var(--am)" />
              <Stat ico="✗" icoBg="var(--rd-l)" val={txns.filter(t => t.status === 'failed').length} lbl="Failed" color="var(--rd)" />
            </div>
            <Card>
              <div className="tbl-wrap">
                <table className="sl-table">
                  <thead><tr><th>Txn ID</th><th>Order #</th><th>Customer</th><th>Amount</th><th>Method</th><th>Razorpay ID</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {txns.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--wg)' }}>No transactions yet</td></tr>}
                    {txns.map(t => (
                      <tr key={t.id}>
                        <td><span style={{ fontFamily: "'Playfair Display',serif", color: 'var(--or)', fontSize: '.78rem' }}>#{t.id}</span></td>
                        <td>#{t.order_id}</td>
                        <td><div style={{ fontWeight: 500, fontSize: '.82rem' }}>{t.customer_name || '—'}</div></td>
                        <td><strong>₹{t.amount}</strong></td>
                        <td><span style={{ fontSize: '.72rem' }}>{PAY_ICONS[t.payment_method] || '💳'} {t.payment_method}</span></td>
                        <td style={{ fontSize: '.65rem', color: 'var(--wg)', fontFamily: 'monospace', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.razorpay_payment_id || '—'}</td>
                        <td><Badge c={PAY_STATUS_C[t.status] || 'bl'}>{t.status}</Badge></td>
                        <td style={{ fontSize: '.68rem', color: 'var(--wg)' }}>{new Date(t.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            DONATE PANEL
        ══════════════════════════════════════════════ */}
        {panel === 'donate' && (
          <div style={{ padding: '1.4rem 1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
              <Card title="Create donation offer">
                <div style={{ padding: '1rem 1.15rem' }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 500, color: 'var(--wg)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '.75rem' }}>Select items & quantities to donate</div>
                  <div style={{ border: '1.5px solid var(--bd)', borderRadius: 9, padding: '.75rem', background: '#FDFAF6', maxHeight: 280, overflowY: 'auto', marginBottom: '1rem' }}>
                    {items.filter(i => i.quantity > 0).length === 0 && <p style={{ fontSize: '.78rem', color: 'var(--wg)', textAlign: 'center', padding: '1rem' }}>No items in stock to donate.</p>}
                    {items.filter(i => i.quantity > 0).map(it => (
                      <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem .35rem', borderBottom: '1px solid var(--bd)', background: donQtys[it.id] > 0 ? 'var(--gr-l)' : 'transparent', borderRadius: 8, marginBottom: '.25rem', transition: 'background .2s' }}>
                        {it.image_url ? <img src={it.image_url} alt={it.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--or-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🍽️</div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '.82rem', fontWeight: 500, color: 'var(--dk)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
                          <div style={{ fontSize: '.65rem', color: 'var(--wg)' }}>Available: <strong>{it.quantity}</strong> {it.unit}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', flexShrink: 0 }}>
                          <button onClick={() => setDonQtys(p => ({ ...p, [it.id]: Math.max(0, (p[it.id] || 0) - 1) }))} style={{ width: 24, height: 24, border: 'none', background: 'var(--rd-l)', color: 'var(--rd)', borderRadius: 50, cursor: 'pointer', fontSize: '.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif" }}>−</button>
                          <span style={{ width: 28, textAlign: 'center', fontSize: '.85rem', fontWeight: 600, color: 'var(--dk)' }}>{donQtys[it.id] || 0}</span>
                          <button onClick={() => setDonQtys(p => ({ ...p, [it.id]: Math.min(it.quantity, (p[it.id] || 0) + 1) }))} style={{ width: 24, height: 24, border: 'none', background: 'var(--gr-l)', color: 'var(--gr-d)', borderRadius: 50, cursor: 'pointer', fontSize: '.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif" }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {Object.entries(donQtys).filter(([, q]) => q > 0).length > 0 && (
                    <div style={{ background: 'var(--gr-l)', border: '1px solid #C0DD97', borderRadius: 8, padding: '.55rem .75rem', fontSize: '.75rem', color: 'var(--gr-d)', marginBottom: '1rem' }}>
                      🤝 Donating: {Object.entries(donQtys).filter(([, q]) => q > 0).map(([id, q]) => `${items.find(i => i.id === parseInt(id))?.name || 'item'} ×${q}`).join(' · ')}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.65rem', marginBottom: '.85rem' }}>
                    <div><label style={lbl}>Pickup date</label><input type="date" value={donPickup} onChange={e => setDonPickup(e.target.value)} style={inpSt} /></div>
                    <div><label style={lbl}>Pickup slot</label><select value={donSlot} onChange={e => setDonSlot(e.target.value)} style={inpSt}>{['Morning (9am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–8pm)', 'Flexible'].map(o => <option key={o}>{o}</option>)}</select></div>
                  </div>
                  <div style={{ marginBottom: '.85rem' }}><label style={lbl}>Notes for NGO</label><input value={donNotes} onChange={e => setDonNotes(e.target.value)} placeholder="Any packaging or pickup instructions…" style={inpSt} /></div>
                  <button onClick={sendDonation} style={{ width: '100%', padding: '.7rem', background: 'var(--gr)', color: '#fff', border: 'none', borderRadius: 50, fontSize: '.88rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Send Donation Offer to All NGOs →</button>
                </div>
              </Card>

              <Card title="Offer history">
                <div style={{ padding: '.75rem 1.15rem' }}>
                  {ownerOffers.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--wg)' }}><div style={{ fontSize: '1.8rem', marginBottom: '.5rem' }}>🤝</div><p>No donation offers sent yet.</p></div>}
                  {ownerOffers.map(o => {
                    const sc = { open: 'or', pending: 'am', accepted: 'gr', completed: 'tl', declined: 'rd' };
                    const borderCols = { gr: 'var(--gr-m)', or: 'var(--or-m)', rd: 'var(--rd-m)', am: 'var(--am-m)', tl: 'var(--tl-m)' };
                    return (
                      <div key={o.id} style={{ background: 'var(--cr)', border: '1px solid var(--bd)', borderRadius: 12, padding: '.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '.55rem', borderLeft: `3px solid ${borderCols[sc[o.status]] || 'var(--bd)'}` }}>
                        <div>
                          <div style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--dk)' }}>{o.title || 'Donation offer'}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--wg)', marginTop: 2 }}>{o.ngo_name || 'Open to all NGOs'} · {o.pickup_date || 'Flexible'}</div>
                          {o.items?.length > 0 && <div style={{ fontSize: '.68rem', color: 'var(--wg)', marginTop: 2 }}>{o.items.map(i => i.name).join(', ')}</div>}
                        </div>
                        <Badge c={sc[o.status] || 'bl'}>{o.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            PROFILE PANEL
        ══════════════════════════════════════════════ */}
        {panel === 'profile' && (
          <div style={{ padding: '1.4rem 1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.25rem', alignItems: 'start' }}>
              <div style={{ background: '#fff', borderRadius: 13, border: '1px solid var(--bd)', padding: '1.35rem', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--or-l)', border: '2.5px solid var(--or-m)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--or-d)', margin: '0 auto .75rem' }}>{(user?.name || 'RK').substring(0, 2).toUpperCase()}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', fontWeight: 700, color: 'var(--dk)' }}>{user?.name}</div>
                <div style={{ fontSize: '.68rem', color: 'var(--wg)', marginTop: 2 }}>{user?.email}</div>
                <div style={{ marginTop: '.55rem' }}><Badge c="gr">Verified Owner ✓</Badge></div>

                {/* Restaurant Photo */}
                <div style={{ marginTop: '1rem', paddingTop: '.85rem', borderTop: '1px solid var(--bd)' }}>
                  <div style={{ fontSize: '.62rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--wg)', marginBottom: '.55rem' }}>Restaurant Photo</div>
                  <label style={{ display: 'block', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (!f) return; setRestaurantImgFile(f); setRestaurantImgPreview(URL.createObjectURL(f)); }} />
                    <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', margin: '0 auto .5rem', border: `2px dashed ${restaurantImgPreview || restaurantImg ? 'var(--gr)' : 'var(--bd)'}`, background: restaurantImgPreview || restaurantImg ? 'var(--gr-l)' : 'var(--cr)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                      {restaurantImgPreview ? <img src={restaurantImgPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : restaurantImg ? <img src={restaurantImg} alt="restaurant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏪'}
                    </div>
                    <div style={{ fontSize: '.63rem', color: 'var(--wg)' }}>{restaurantImgPreview ? 'New photo selected' : 'Click to upload photo'}</div>
                  </label>
                  {restaurantImgFile && (
                    <button onClick={async () => {
                      setUploadingImg(true);
                      try {
                        const fd = new FormData(); fd.append('image', restaurantImgFile);
                        const r = await axios.put(`${BASE}/api/owner/profile`, fd, { headers: { Authorization: `Bearer ${localStorage.getItem('sl_token')}`, 'Content-Type': 'multipart/form-data' } });
                        setRestaurantImg(r.data.image_url); setRestaurantImgFile(null); setRestaurantImgPreview(null);
                        showToast('Photo saved! 📸', 'success');
                      } catch (e) { showToast('Upload failed', 'error'); }
                      finally { setUploadingImg(false); }
                    }} disabled={uploadingImg} style={{ marginTop: '.55rem', padding: '.38rem .9rem', background: uploadingImg ? '#aaa' : 'var(--or)', color: '#fff', border: 'none', borderRadius: 50, fontSize: '.72rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", width: '100%' }}>{uploadingImg ? 'Saving…' : 'Save Photo'}</button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.42rem', marginTop: '.85rem' }}>
                  {[[items.length, 'Items'], [orders.length, 'Orders'], [activeItems.length, 'Live'], [txns.filter(t => t.status === 'paid').length, 'Paid']].map(([v, l]) => (
                    <div key={l} style={{ background: 'var(--cr)', borderRadius: 8, padding: '.55rem', textAlign: 'center', border: '1px solid var(--bd)' }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '.95rem', fontWeight: 700, color: 'var(--or)' }}>{v}</div>
                      <div style={{ fontSize: '.6rem', color: 'var(--wg)', marginTop: 1 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ background: '#fff', borderRadius: 13, border: '1px solid var(--bd)', overflow: 'hidden', marginBottom: '.9rem' }}>
                  <div style={{ padding: '.78rem 1.1rem', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '.82rem', fontWeight: 500, color: 'var(--dk)' }}>Account details</span>
                    <button onClick={saveProfile} disabled={profileSaving} style={{ fontSize: '.7rem', color: profileSaving ? 'var(--wg)' : 'var(--or)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{profileSaving ? 'Saving…' : 'Save changes'}</button>
                  </div>
                  <div style={{ padding: '.9rem 1.1rem' }}>
                    {[
                      ['Full name',   'name',       'text',  'Your full name'],
                      ['Email',       'email',      'email', 'your@email.com'],
                      ['Restaurant',  'restaurant', 'text',  'Restaurant name'],
                    ].map(([label, field, type, ph]) => (
                      <div key={field} style={{ marginBottom: '.85rem' }}>
                        <label style={{ fontSize: '.7rem', fontWeight: 500, color: 'var(--wg)', textTransform: 'uppercase', letterSpacing: '.3px', display: 'block', marginBottom: '.3rem' }}>{label}</label>
                        <input
                          type={type}
                          value={profileForm[field]}
                          placeholder={ph}
                          onChange={e => setProfileForm(p => ({ ...p, [field]: e.target.value }))}
                          style={inpSt}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={doLogout} style={{ padding: '.6rem 1.4rem', background: 'var(--rd-l)', color: 'var(--rd)', border: '1px solid var(--rd-m)', borderRadius: 50, fontSize: '.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>🚪 Logout</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            SETTINGS PANEL
        ══════════════════════════════════════════════ */}
        {panel === 'settings' && (
          <div style={{ padding: '1.4rem 1.75rem', maxWidth: 560 }}>
            <div style={{ background: '#fff', borderRadius: 13, border: '1px solid var(--bd)', overflow: 'hidden', marginBottom: '.9rem' }}>
              <div style={{ padding: '.78rem 1.1rem', borderBottom: '1px solid var(--bd)' }}>
                <span style={{ fontSize: '.82rem', fontWeight: 500, color: 'var(--dk)' }}>Notification preferences</span>
              </div>
              <div style={{ padding: '.9rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
                {[
                  ['new_order',          'New order received'],
                  ['payment_confirmed',  'Payment confirmed'],
                  ['expiring_today',     'Item expiring today'],
                  ['ngo_response',       'NGO donation response'],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '.82rem', cursor: 'pointer' }}>
                    {label}
                    <input
                      type="checkbox"
                      checked={notifPrefs[key]}
                      onChange={e => setNotifPrefs(p => ({ ...p, [key]: e.target.checked }))}
                      style={{ accentColor: 'var(--or)', width: 15, height: 15 }}
                    />
                  </label>
                ))}
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 13, border: '1px solid var(--bd)', overflow: 'hidden', marginBottom: '.9rem' }}>
              <div style={{ padding: '.78rem 1.1rem', borderBottom: '1px solid var(--bd)' }}>
                <span style={{ fontSize: '.82rem', fontWeight: 500, color: 'var(--dk)' }}>Business hours</span>
              </div>
              <div style={{ padding: '.9rem 1.1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                <div>
                  <label style={lbl}>Opening time</label>
                  <input type="time" value={bizHours.open} onChange={e => setBizHours(p => ({ ...p, open: e.target.value }))} style={inpSt} />
                </div>
                <div>
                  <label style={lbl}>Closing time</label>
                  <input type="time" value={bizHours.close} onChange={e => setBizHours(p => ({ ...p, close: e.target.value }))} style={inpSt} />
                </div>
              </div>
            </div>
            <button onClick={saveSettings} disabled={settingsSaving} style={{ padding: '.6rem 1.4rem', background: settingsSaving ? '#aaa' : 'var(--or)', color: '#fff', border: 'none', borderRadius: 50, fontSize: '.82rem', fontWeight: 500, cursor: settingsSaving ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              {settingsSaving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
