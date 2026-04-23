import React from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Shared sub-components ── */
function StepCard({ n, ico, icoBg, title, text }) {
  return (
    <div style={{ background:'var(--cr)',borderRadius:16,padding:'1.4rem 1.1rem',border:'1px solid var(--bd)',position:'relative',overflow:'hidden' }}>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:'3.5rem',fontWeight:900,color:'#F5EFE8',position:'absolute',top:-6,right:10,lineHeight:1 }}>{n}</div>
      <div style={{ position:'relative',zIndex:1 }}>
        <div style={{ width:36,height:36,borderRadius:9,background:icoBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,marginBottom:'.75rem' }}>{ico}</div>
        <h3 style={{ fontSize:'.88rem',fontWeight:500,color:'var(--dk)',marginBottom:'.35rem' }}>{title}</h3>
        <p style={{ fontSize:'.78rem',color:'var(--wg)',lineHeight:1.55,fontWeight:300 }}>{text}</p>
      </div>
    </div>
  );
}
function FeatCard({ ico, icoBg, title, text, tag, tagBg, tagColor, tagBorder }) {
  return (
    <div style={{ background:'var(--cr)',borderRadius:16,padding:'1.5rem',border:'1px solid var(--bd)' }}>
      <div style={{ width:40,height:40,borderRadius:10,background:icoBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,marginBottom:'.85rem' }}>{ico}</div>
      <h3 style={{ fontSize:'.9rem',fontWeight:500,color:'var(--dk)',marginBottom:'.4rem' }}>{title}</h3>
      <p style={{ fontSize:'.78rem',color:'var(--wg)',lineHeight:1.55,fontWeight:300 }}>{text}</p>
      <span style={{ display:'inline-flex',marginTop:'.72rem',fontSize:'.68rem',fontWeight:500,padding:'.18rem .55rem',borderRadius:50,background:tagBg,color:tagColor,border:`1px solid ${tagBorder}` }}>{tag}</span>
    </div>
  );
}
function TestiCard({ stars, starColor, quote, initials, avBg, avColor, avBorder, name, sub, badge, badgeBg, badgeColor, badgeBorder }) {
  return (
    <div style={{ background:'#fff',borderRadius:16,padding:'1.5rem',border:'1px solid var(--bd)' }}>
      <div style={{ fontSize:'.72rem',color:starColor,marginBottom:'.45rem' }}>{stars}</div>
      <p style={{ fontSize:'.85rem',color:'var(--dk)',lineHeight:1.65,fontWeight:300,marginBottom:'1.1rem',fontStyle:'italic' }}>&ldquo;{quote}&rdquo;</p>
      <div style={{ display:'flex',alignItems:'center',gap:'.55rem' }}>
        <div style={{ width:34,height:34,borderRadius:'50%',background:avBg,color:avColor,border:`1.5px solid ${avBorder}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.72rem',fontWeight:700 }}>{initials}</div>
        <div><div style={{ fontSize:'.78rem',fontWeight:500,color:'var(--dk)' }}>{name}</div><div style={{ fontSize:'.68rem',color:'var(--wg)' }}>{sub}</div>
          {badge && <span style={{ display:'inline-flex',marginTop:3,fontSize:'.65rem',fontWeight:500,padding:'.12rem .45rem',borderRadius:50,background:badgeBg,color:badgeColor,border:`1px solid ${badgeBorder}` }}>{badge}</span>}
        </div>
      </div>
    </div>
  );
}
function RoleLandingNav({ logoColor, logoSpan, tagText, tagBg, tagColor, tagBorder, navBg, onBack, onLogin, onRegister, loginLabel, registerLabel }) {
  const nav = useNavigate();
  return (
    <nav style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 5%',background:navBg,borderBottom:'1px solid rgba(255,255,255,.08)',position:'sticky',top:0,zIndex:99 }}>
      <div>
        <span onClick={()=>nav('/')} style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.5rem',fontWeight:900,color:logoColor,cursor:'pointer' }}>SHELF<span style={{color:logoSpan}}>LIFE</span>+</span>
        <span style={{ fontSize:'.7rem',padding:'.18rem .6rem',borderRadius:50,marginLeft:'.5rem',verticalAlign:'middle',background:tagBg,color:tagColor,border:`1px solid ${tagBorder}` }}>{tagText}</span>
      </div>
      <div style={{ display:'flex',gap:'.65rem' }}>
        <button onClick={onBack} style={{ padding:'.42rem 1.1rem',border:'1px solid rgba(255,255,255,.18)',color:'rgba(255,255,255,.65)',borderRadius:50,fontSize:'.82rem',fontWeight:500,background:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>← All Roles</button>
        <button onClick={onLogin} style={{ padding:'.42rem 1.1rem',border:'1px solid rgba(255,255,255,.18)',color:'rgba(255,255,255,.65)',borderRadius:50,fontSize:'.82rem',fontWeight:500,background:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>{loginLabel}</button>
        <button onClick={onRegister} style={{ padding:'.42rem 1.2rem',background:'var(--or)',color:'#fff',border:'none',borderRadius:50,fontSize:'.82rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>{registerLabel}</button>
      </div>
    </nav>
  );
}

/* ══ OWNER LANDING ══ */
export function OwnerLanding() {
  const nav = useNavigate();
  const accentBg = 'var(--or-l)'; const accentC = 'var(--or)'; const accentBorder = 'var(--or-m)';
  return (
    <div>
      <RoleLandingNav logoColor="var(--or)" logoSpan="var(--gr-m)" tagText="For Owners" tagBg="rgba(232,97,10,.2)" tagColor="var(--or-m)" tagBorder="rgba(232,97,10,.3)" navBg="rgba(28,18,9,.97)" onBack={()=>nav('/pick-role')} onLogin={()=>nav('/login/owner')} onRegister={()=>nav('/register/owner')} loginLabel="Login" registerLabel="Register shop" />
      {/* Hero */}
      <div style={{ background:'#1C1209',padding:'5rem 5% 4rem' }}>
        <div style={{ display:'inline-flex',alignItems:'center',gap:'.5rem',background:'rgba(232,97,10,.15)',color:'var(--or-m)',padding:'.4rem 1rem',borderRadius:50,fontSize:'.8rem',fontWeight:500,marginBottom:'1.5rem',border:'1px solid rgba(232,97,10,.3)' }}><span className="pulse-dot" style={{background:'var(--or)'}}></span>For restaurant &amp; shop owners</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(2.4rem,4vw,3.6rem)',fontWeight:900,lineHeight:1.1,color:'#fff',marginBottom:'1.5rem' }}>Stop the loss.<br/><span style={{color:'var(--or)'}}>Start selling</span><br/>the <span style={{color:'var(--gr-m)'}}>smart way.</span></h1>
        <p style={{ fontSize:'.95rem',color:'rgba(255,255,255,.46)',lineHeight:1.8,maxWidth:480,marginBottom:'2.5rem',fontWeight:300 }}>SHELFLIFE+ helps you sell near-expiry inventory at a discount — recovering value, emptying stock, and connecting surplus food to NGOs who need it.</p>
        <div style={{ display:'flex',gap:'.85rem',flexWrap:'wrap' }}>
          <button onClick={()=>nav('/register/owner')} style={{ padding:'.82rem 2rem',background:'var(--or)',color:'#fff',border:'none',borderRadius:50,fontSize:'.92rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 20px rgba(232,97,10,.3)' }}>Register your shop — free</button>
          <button onClick={()=>nav('/login/owner')} style={{ padding:'.82rem 2rem',background:'rgba(255,255,255,.07)',color:'#fff',border:'1px solid rgba(255,255,255,.18)',borderRadius:50,fontSize:'.92rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Login to dashboard</button>
        </div>
        <div style={{ display:'flex',gap:'2rem',marginTop:'2.5rem',paddingTop:'2rem',borderTop:'1px solid rgba(255,255,255,.08)' }}>
          {[['₹0','to get started'],['45%','avg. discount set'],['3 min','to list first item']].map(([n,l])=>(
            <div key={l}><div style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.6rem',fontWeight:700,color:'var(--or-m)' }}>{n}</div><div style={{ fontSize:'.72rem',color:'rgba(255,255,255,.38)',marginTop:2 }}>{l}</div></div>
          ))}
        </div>
      </div>
      {/* Steps */}
      <div style={{ padding:'5rem 5%',background:'#fff' }}>
        <div style={{ fontSize:'.78rem',textTransform:'uppercase',letterSpacing:2,fontWeight:500,color:'var(--or)',marginBottom:'.65rem' }}>How it works</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(2rem,3.5vw,2.8rem)',fontWeight:700,color:'#1C1209',marginBottom:'1rem' }}>List, sell, and donate — in minutes.</h2>
        <p style={{ fontSize:'.95rem',color:'var(--wg)',lineHeight:1.72,maxWidth:540,fontWeight:300,marginBottom:'3rem' }}>Four simple steps from near-expiry inventory to recovered revenue.</p>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1.1rem' }}>
          <StepCard n="01" ico="🏪" icoBg="var(--or-l)" title="Register your shop" text="Create a free account, verify your details, and go live in under 3 minutes." />
          <StepCard n="02" ico="📸" icoBg="var(--or-l)" title="Upload items" text="Add near-expiry food with photos, quantities, expiry times, and your discounted price." />
          <StepCard n="03" ico="💰" icoBg="var(--gr-l)" title="Customers order" text="Consumers browse and pay via UPI, card, or COD. You get notified in real time." />
          <StepCard n="04" ico="🤝" icoBg="var(--gr-l)" title="Donate surplus" text="Route remaining stock to a partner NGO — one click, zero cost, full impact." />
        </div>
      </div>
      {/* Features */}
      <div style={{ padding:'5rem 5%' }}>
        <div style={{ fontSize:'.78rem',textTransform:'uppercase',letterSpacing:2,fontWeight:500,color:'var(--or)',marginBottom:'.65rem' }}>Features</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(2rem,3.5vw,2.8rem)',fontWeight:700,color:'#1C1209',marginBottom:'1rem' }}>Built for how owners work.</h2>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.1rem',marginTop:'2.5rem' }}>
          <FeatCard ico="📦" icoBg="var(--or-l)" title="Live inventory dashboard" text="See all items, quantities, expiry dates, and sales in one place." tag="Real-time" tagBg="var(--or-l)" tagColor="var(--or-d)" tagBorder="var(--or-m)" />
          <FeatCard ico="📸" icoBg="var(--or-l)" title="Upload with photos" text="Add item photos, set your own discount, mark expiry. Live in 60 seconds." tag="60 seconds" tagBg="var(--or-l)" tagColor="var(--or-d)" tagBorder="var(--or-m)" />
          <FeatCard ico="📊" icoBg="var(--gr-l)" title="Today's sales snapshot" text="Track revenue earned today and which items are performing best." tag="Daily" tagBg="var(--gr-l)" tagColor="var(--gr-d)" tagBorder="#C0DD97" />
          <FeatCard ico="🧾" icoBg="var(--gr-l)" title="Order management" text="See incoming orders and update status from confirmed through to delivered." tag="Status tracking" tagBg="var(--gr-l)" tagColor="var(--gr-d)" tagBorder="#C0DD97" />
          <FeatCard ico="🤝" icoBg="var(--am-l)" title="NGO donation portal" text="Send unsold items directly to registered NGOs. They review, accept, and pick up." tag="Zero waste" tagBg="var(--am-l)" tagColor="#633806" tagBorder="var(--am-m)" />
          <FeatCard ico="⚠️" icoBg="var(--am-l)" title="Expiry alerts" text="Get alerted when items are expiring today or tomorrow so you can act fast." tag="Smart nudges" tagBg="var(--am-l)" tagColor="#633806" tagBorder="var(--am-m)" />
        </div>
      </div>
      {/* Testimonials */}
      <div style={{ padding:'5rem 5%',background:'#fff' }}>
        <div style={{ fontSize:'.78rem',textTransform:'uppercase',letterSpacing:2,fontWeight:500,color:'var(--or)',marginBottom:'.65rem' }}>Owner stories</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(2rem,3.5vw,2.8rem)',fontWeight:700,color:'#1C1209',marginBottom:'1rem' }}>What restaurant owners say.</h2>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.1rem',marginTop:'2.5rem' }}>
          <TestiCard stars="★★★★★" starColor="var(--or)" quote="We used to throw out ₹4,000 worth of food every week. Now we recover most of it by 7 pm and donate the rest." initials="RK" avBg="var(--or-l)" avColor="var(--or-d)" avBorder="var(--or-m)" name="Ramesh Kadam" sub="Annapurna Kitchen, Thane" badge="💰 ₹18K recovered" badgeBg="var(--or-l)" badgeColor="var(--or-d)" badgeBorder="var(--or-m)" />
          <TestiCard stars="★★★★★" starColor="var(--or)" quote="The dashboard is so simple. I see what's expiring, mark the price down, and customers show up within the hour." initials="SP" avBg="var(--or-l)" avColor="var(--or-d)" avBorder="var(--or-m)" name="Sonal Patil" sub="FreshMart Grocers, Pune" badge="💰 ₹22K recovered" badgeBg="var(--or-l)" badgeColor="var(--or-d)" badgeBorder="var(--or-m)" />
          <TestiCard stars="★★★★★" starColor="var(--or)" quote="The NGO donation feature is incredible. I contact Roti Bank from the app and they pick up within 2 hours." initials="AJ" avBg="var(--or-l)" avColor="var(--or-d)" avBorder="var(--or-m)" name="Anjali Joshi" sub="Spice Route, Mumbai" badge="🤝 34 donations made" badgeBg="var(--or-l)" badgeColor="var(--or-d)" badgeBorder="var(--or-m)" />
        </div>
      </div>
      {/* CTA */}
      <div style={{ padding:'4rem 5%',background:'#1C1209',textAlign:'center' }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.8rem,3vw,2.4rem)',fontWeight:700,color:'#fff',marginBottom:'.75rem' }}>List your first item in 3 minutes.</h2>
        <p style={{ fontSize:'.95rem',color:'rgba(255,255,255,.45)',maxWidth:460,margin:'0 auto 2rem',lineHeight:1.72,fontWeight:300 }}>Join hundreds of owners recovering revenue and reducing food waste — for free.</p>
        <div style={{ display:'flex',gap:'.85rem',justifyContent:'center',flexWrap:'wrap' }}>
          <button onClick={()=>nav('/register/owner')} style={{ padding:'.8rem 1.75rem',background:'#fff',color:'var(--or-d)',border:'none',borderRadius:50,fontSize:'.9rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Register your shop — free</button>
          <button onClick={()=>nav('/login/owner')} style={{ padding:'.8rem 1.75rem',background:'rgba(255,255,255,.07)',color:'#fff',border:'1px solid rgba(255,255,255,.18)',borderRadius:50,fontSize:'.9rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Already registered? Login →</button>
        </div>
      </div>
    </div>
  );
}

/* ══ USER LANDING ══ */
export function UserLanding() {
  const nav = useNavigate();
  return (
    <div>
      <RoleLandingNav logoColor="var(--gr-m)" logoSpan="var(--or-m)" tagText="For Consumers" tagBg="rgba(59,109,17,.22)" tagColor="var(--gr-m)" tagBorder="rgba(59,109,17,.28)" navBg="rgba(14,31,6,.97)" onBack={()=>nav('/pick-role')} onLogin={()=>nav('/login/user')} onRegister={()=>nav('/register/user')} loginLabel="Login" registerLabel="Start saving today" />
      <div style={{ background:'#0E1F06',padding:'5rem 5% 4rem' }}>
        <div style={{ display:'inline-flex',alignItems:'center',gap:'.5rem',background:'rgba(59,109,17,.2)',color:'var(--gr-m)',padding:'.4rem 1rem',borderRadius:50,fontSize:'.8rem',fontWeight:500,marginBottom:'1.5rem',border:'1px solid rgba(59,109,17,.3)' }}><span className="pulse-dot" style={{background:'var(--gr-m)'}}></span>For conscious food lovers</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(2.4rem,4vw,3.6rem)',fontWeight:900,lineHeight:1.1,color:'#fff',marginBottom:'1.5rem' }}>Eat well.<br/><span style={{color:'var(--gr-m)'}}>Spend less.</span><br/>Save the <span style={{color:'var(--or-m)'}}>planet.</span></h1>
        <p style={{ fontSize:'.95rem',color:'rgba(255,255,255,.45)',lineHeight:1.8,maxWidth:480,marginBottom:'2.5rem',fontWeight:300 }}>Browse near-expiry food from restaurants and shops near you — at up to 45% off — while tracking your carbon footprint and money saved in real time.</p>
        <div style={{ display:'flex',gap:'.85rem',flexWrap:'wrap' }}>
          <button onClick={()=>nav('/register/user')} style={{ padding:'.82rem 2rem',background:'var(--gr)',color:'#fff',border:'none',borderRadius:50,fontSize:'.92rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 20px rgba(59,109,17,.3)' }}>Browse food deals — free</button>
          <button onClick={()=>nav('/login/user')} style={{ padding:'.82rem 2rem',background:'rgba(255,255,255,.07)',color:'#fff',border:'1px solid rgba(255,255,255,.18)',borderRadius:50,fontSize:'.92rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Already a member? Login</button>
        </div>
        <div style={{ display:'flex',gap:'2rem',marginTop:'2.5rem',paddingTop:'2rem',borderTop:'1px solid rgba(255,255,255,.08)' }}>
          {[['45%','max discount'],['2.5 kg','CO₂ saved/order'],['₹0','to sign up']].map(([n,l])=>(
            <div key={l}><div style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.6rem',fontWeight:700,color:'var(--gr-m)' }}>{n}</div><div style={{ fontSize:'.72rem',color:'rgba(255,255,255,.38)',marginTop:2 }}>{l}</div></div>
          ))}
        </div>
      </div>
      <div style={{ padding:'5rem 5%',background:'#fff' }}>
        <div style={{ fontSize:'.78rem',textTransform:'uppercase',letterSpacing:2,fontWeight:500,color:'var(--gr)',marginBottom:'.65rem' }}>How it works</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(2rem,3.5vw,2.8rem)',fontWeight:700,color:'#1C1209',marginBottom:'1rem' }}>Four steps to your next great deal.</h2>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1.1rem',marginTop:'2rem' }}>
          <StepCard n="01" ico="🌿" icoBg="var(--gr-l)" title="Create account" text="Sign up in under 2 minutes. Add your address and start browsing deals near you." />
          <StepCard n="02" ico="🔍" icoBg="var(--or-l)" title="Browse & filter" text="Toggle Veg/Non-Veg, filter by category, price, discount. Find restaurants expiring soon." />
          <StepCard n="03" ico="🛒" icoBg="var(--gr-l)" title="Add to cart & checkout" text="See your money saved and CO₂ update live. Pay with UPI, card, or COD." />
          <StepCard n="04" ico="🌍" icoBg="var(--tl-l)" title="Track your impact" text="Every order adds to your personal savings and carbon impact score." />
        </div>
      </div>
      <div style={{ padding:'5rem 5%',background:'#fff' }}>
        <div style={{ fontSize:'.78rem',textTransform:'uppercase',letterSpacing:2,fontWeight:500,color:'var(--gr)',marginBottom:'.65rem' }}>User stories</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(2rem,3.5vw,2.8rem)',fontWeight:700,color:'#1C1209',marginBottom:'1rem' }}>What conscious consumers say.</h2>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.1rem',marginTop:'2.5rem' }}>
          <TestiCard stars="★★★★★" starColor="var(--gr)" quote="I ordered dinner for ₹95 that would have cost ₹220. The food was perfect — nothing wrong with it!" initials="PR" avBg="var(--gr-l)" avColor="var(--gr-d)" avBorder="#C0DD97" name="Priya Rao" sub="Mumbai · 38 orders" badge="💰 ₹4,200 saved" badgeBg="var(--gr-l)" badgeColor="var(--gr-d)" badgeBorder="#C0DD97" />
          <TestiCard stars="★★★★★" starColor="var(--gr)" quote="My monthly grocery bill dropped by ₹1,500 and I feel good about the planet. Best app I've used this year." initials="AK" avBg="var(--gr-l)" avColor="var(--gr-d)" avBorder="#C0DD97" name="Arjun Kulkarni" sub="Pune · 62 orders" badge="💰 ₹7,800 saved" badgeBg="var(--gr-l)" badgeColor="var(--gr-d)" badgeBorder="#C0DD97" />
          <TestiCard stars="★★★★★" starColor="var(--gr)" quote="I've saved 84 kg of CO₂ in 3 months — it's like a game but you're actually helping the environment." initials="NM" avBg="var(--gr-l)" avColor="var(--gr-d)" avBorder="#C0DD97" name="Neha Mehta" sub="Thane · 51 orders" badge="🌱 84 kg CO₂ saved" badgeBg="var(--gr-l)" badgeColor="var(--gr-d)" badgeBorder="#C0DD97" />
        </div>
      </div>
      <div style={{ padding:'4rem 5%',background:'#0E1F06',textAlign:'center' }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.8rem,3vw,2.4rem)',fontWeight:700,color:'#fff',marginBottom:'.75rem' }}>Your first deal is waiting.</h2>
        <p style={{ fontSize:'.95rem',color:'rgba(255,255,255,.45)',maxWidth:460,margin:'0 auto 2rem',lineHeight:1.72,fontWeight:300 }}>Join thousands saving money and reducing food waste — one order at a time.</p>
        <div style={{ display:'flex',gap:'.85rem',justifyContent:'center',flexWrap:'wrap' }}>
          <button onClick={()=>nav('/register/user')} style={{ padding:'.8rem 1.75rem',background:'#fff',color:'var(--gr-d)',border:'none',borderRadius:50,fontSize:'.9rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Create free account</button>
          <button onClick={()=>nav('/login/user')} style={{ padding:'.8rem 1.75rem',background:'rgba(255,255,255,.07)',color:'#fff',border:'1px solid rgba(255,255,255,.18)',borderRadius:50,fontSize:'.9rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Already a member? Login →</button>
        </div>
      </div>
    </div>
  );
}

/* ══ NGO LANDING ══ */
export function NgoLanding() {
  const nav = useNavigate();
  return (
    <div>
      <RoleLandingNav logoColor="var(--pu-m)" logoSpan="var(--gr-m)" tagText="For NGOs" tagBg="rgba(83,74,183,.22)" tagColor="var(--pu-m)" tagBorder="rgba(83,74,183,.28)" navBg="rgba(13,11,31,.97)" onBack={()=>nav('/pick-role')} onLogin={()=>nav('/login/ngo')} onRegister={()=>nav('/register/ngo')} loginLabel="Login" registerLabel="Register NGO" />
      <div style={{ background:'#0D0B1F',padding:'5rem 5% 4rem' }}>
        <div style={{ display:'inline-flex',alignItems:'center',gap:'.5rem',background:'rgba(83,74,183,.2)',color:'var(--pu-m)',padding:'.4rem 1rem',borderRadius:50,fontSize:'.8rem',fontWeight:500,marginBottom:'1.5rem',border:'1px solid rgba(83,74,183,.3)' }}><span className="pulse-dot" style={{background:'var(--pu-m)'}}></span>For verified NGO partners</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(2.4rem,4vw,3.6rem)',fontWeight:900,lineHeight:1.1,color:'#fff',marginBottom:'1.5rem' }}>Rescue food.<br/><span style={{color:'var(--pu-m)'}}>Feed people.</span><br/>Track your <span style={{color:'var(--gr-m)'}}>impact.</span></h1>
        <p style={{ fontSize:'.95rem',color:'rgba(255,255,255,.45)',lineHeight:1.8,maxWidth:480,marginBottom:'2.5rem',fontWeight:300 }}>SHELFLIFE+ connects your NGO directly with restaurants with surplus near-expiry food — at zero cost. Review offers, coordinate pickups, and track your real-world impact.</p>
        <div style={{ display:'flex',gap:'.85rem',flexWrap:'wrap' }}>
          <button onClick={()=>nav('/register/ngo')} style={{ padding:'.82rem 2rem',background:'var(--pu)',color:'#fff',border:'none',borderRadius:50,fontSize:'.92rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 20px rgba(83,74,183,.35)' }}>Register your NGO — free</button>
          <button onClick={()=>nav('/login/ngo')} style={{ padding:'.82rem 2rem',background:'rgba(255,255,255,.07)',color:'#fff',border:'1px solid rgba(255,255,255,.18)',borderRadius:50,fontSize:'.92rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Login to dashboard</button>
        </div>
        <div style={{ display:'flex',gap:'2rem',marginTop:'2.5rem',paddingTop:'2rem',borderTop:'1px solid rgba(255,255,255,.08)' }}>
          {[['₹0','cost to register'],['48+','NGOs partnered'],['12K+','meals rescued']].map(([n,l])=>(
            <div key={l}><div style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.6rem',fontWeight:700,color:'var(--pu-m)' }}>{n}</div><div style={{ fontSize:'.72rem',color:'rgba(255,255,255,.38)',marginTop:2 }}>{l}</div></div>
          ))}
        </div>
      </div>
      <div style={{ padding:'5rem 5%',background:'#fff' }}>
        <div style={{ fontSize:'.78rem',textTransform:'uppercase',letterSpacing:2,fontWeight:500,color:'var(--pu)',marginBottom:'.65rem' }}>How it works for NGOs</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(2rem,3.5vw,2.8rem)',fontWeight:700,color:'#1C1209',marginBottom:'1rem' }}>From surplus to your community — in hours.</h2>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1.1rem',marginTop:'2rem' }}>
          <StepCard n="01" ico="📋" icoBg="var(--pu-l)" title="Register & get verified" text="Create a free NGO account, submit your registration number. Verified within 24 hours." />
          <StepCard n="02" ico="📬" icoBg="var(--pu-l)" title="Receive donation offers" text="Restaurants in your city send donation offers for near-expiry surplus directly to your inbox." />
          <StepCard n="03" ico="✅" icoBg="var(--gr-l)" title="Accept or decline" text="Review items, quantities, and pickup time. Accept or decline with a reason." />
          <StepCard n="04" ico="🏁" icoBg="var(--tl-l)" title="Pickup & complete" text="Coordinate pickup and mark the donation completed. Impact logs instantly." />
        </div>
      </div>
      <div style={{ padding:'5rem 5%',background:'#fff' }}>
        <div style={{ fontSize:'.78rem',textTransform:'uppercase',letterSpacing:2,fontWeight:500,color:'var(--pu)',marginBottom:'.65rem' }}>NGO partner stories</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(2rem,3.5vw,2.8rem)',fontWeight:700,color:'#1C1209',marginBottom:'1rem' }}>What NGO partners say.</h2>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.1rem',marginTop:'2.5rem' }}>
          <TestiCard stars="★★★★★" starColor="var(--pu)" quote="We used to spend hours calling restaurants. Now offers come directly to our dashboard — we accepted 14 this month alone." initials="SB" avBg="var(--pu-l)" avColor="var(--pu-d)" avBorder="var(--pu-m)" name="Sunita Bhosale" sub="Roti Bank Mumbai" badge="🌿 480 kg rescued" badgeBg="var(--pu-l)" badgeColor="var(--pu-d)" badgeBorder="var(--pu-m)" />
          <TestiCard stars="★★★★★" starColor="var(--pu)" quote="The accept/decline flow is incredibly simple. Our volunteers manage everything from their phone." initials="KN" avBg="var(--pu-l)" avColor="var(--pu-d)" avBorder="var(--pu-m)" name="Karan Nair" sub="Feeding India, Pune" badge="🌿 620 kg rescued" badgeBg="var(--pu-l)" badgeColor="var(--pu-d)" badgeBorder="var(--pu-m)" />
          <TestiCard stars="★★★★★" starColor="var(--pu)" quote="Being verified on SHELFLIFE+ gave us access to restaurants we had never worked with. Our network doubled in two months." initials="AS" avBg="var(--pu-l)" avColor="var(--pu-d)" avBorder="var(--pu-m)" name="Ananya Sharma" sub="Robin Hood Army, Thane" badge="🌿 390 kg rescued" badgeBg="var(--pu-l)" badgeColor="var(--pu-d)" badgeBorder="var(--pu-m)" />
        </div>
      </div>
      <div style={{ padding:'4rem 5%',background:'var(--pu-d)',textAlign:'center' }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.8rem,3vw,2.4rem)',fontWeight:700,color:'#fff',marginBottom:'.75rem' }}>Your first donation offer is waiting.</h2>
        <p style={{ fontSize:'.95rem',color:'rgba(255,255,255,.45)',maxWidth:460,margin:'0 auto 2rem',lineHeight:1.72,fontWeight:300 }}>Join 48 verified NGO partners already receiving surplus food — completely free.</p>
        <div style={{ display:'flex',gap:'.85rem',justifyContent:'center',flexWrap:'wrap' }}>
          <button onClick={()=>nav('/register/ngo')} style={{ padding:'.8rem 1.75rem',background:'#fff',color:'var(--pu-d)',border:'none',borderRadius:50,fontSize:'.9rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Register your NGO — free</button>
          <button onClick={()=>nav('/login/ngo')} style={{ padding:'.8rem 1.75rem',background:'rgba(255,255,255,.07)',color:'#fff',border:'1px solid rgba(255,255,255,.18)',borderRadius:50,fontSize:'.9rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>Already registered? Login →</button>
        </div>
      </div>
    </div>
  );
}
