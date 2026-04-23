import React from 'react';
import { useNavigate } from 'react-router-dom';

const S = {
  // Nav
  nav: { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1.2rem 5%',background:'rgba(28,18,9,.97)',borderBottom:'1px solid rgba(255,255,255,.08)',position:'sticky',top:0,zIndex:99 },
  logo: { fontFamily:"'Playfair Display',serif",fontSize:'1.6rem',fontWeight:900,color:'var(--or)',cursor:'pointer',letterSpacing:'-0.5px' },
  navLinks: { display:'flex',gap:'2rem',listStyle:'none' },
  navLink: { textDecoration:'none',color:'rgba(255,255,255,.45)',fontSize:'.9rem',cursor:'pointer' },
  btnGhost: { padding:'.5rem 1.2rem',border:'1.5px solid rgba(255,255,255,.2)',color:'rgba(255,255,255,.75)',borderRadius:50,fontSize:'.85rem',fontWeight:500,cursor:'pointer',background:'none',fontFamily:"'DM Sans',sans-serif" },
  btnOr: { padding:'.5rem 1.2rem',background:'var(--or)',color:'#fff',border:'none',borderRadius:50,fontSize:'.85rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" },
  // Hero
  hero: { background:'#1C1209',padding:'5rem 5% 4rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3rem',alignItems:'center',minHeight:'88vh' },
  badge: { display:'inline-flex',alignItems:'center',gap:'.5rem',background:'rgba(59,109,17,.2)',color:'var(--gr-m)',padding:'.4rem 1rem',borderRadius:50,fontSize:'.8rem',fontWeight:500,marginBottom:'1.5rem',border:'1px solid rgba(59,109,17,.3)' },
  h1: { fontFamily:"'Playfair Display',serif",fontSize:'clamp(2.8rem,5vw,4.2rem)',fontWeight:900,lineHeight:1.1,color:'#fff',marginBottom:'1.5rem' },
  heroSub: { fontSize:'1.05rem',color:'rgba(255,255,255,.5)',lineHeight:1.8,maxWidth:480,marginBottom:'2.5rem',fontWeight:300 },
  heroActs: { display:'flex',gap:'1rem',flexWrap:'wrap' },
  btnHeroP: { padding:'.85rem 2rem',background:'var(--or)',color:'#fff',border:'none',borderRadius:50,fontSize:'1rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 20px rgba(232,97,10,.3)' },
  btnHeroS: { padding:'.85rem 2rem',background:'rgba(255,255,255,.07)',color:'#fff',border:'1px solid rgba(255,255,255,.18)',borderRadius:50,fontSize:'1rem',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" },
  heroStats: { display:'flex',gap:'2rem',marginTop:'3rem',paddingTop:'2rem',borderTop:'1px solid rgba(255,255,255,.08)' },
  statNum: { fontFamily:"'Playfair Display',serif",fontSize:'1.8rem',fontWeight:700,color:'var(--or-m)' },
  statLbl: { fontSize:'.78rem',color:'rgba(255,255,255,.38)',marginTop:3 },
  // Sections
  sec: { padding:'5rem 5%' },
  secWt: { padding:'5rem 5%',background:'#fff' },
  secLbl: { fontSize:'.78rem',textTransform:'uppercase',letterSpacing:2,fontWeight:500,marginBottom:'.65rem' },
  secH2: { fontFamily:"'Playfair Display',serif",fontSize:'clamp(2rem,3.5vw,2.8rem)',fontWeight:700,color:'#1C1209',marginBottom:'1rem' },
  secSub: { fontSize:'.95rem',color:'var(--wg)',lineHeight:1.72,maxWidth:540,fontWeight:300,marginBottom:'3rem' },
  // How grid
  howGrid: { display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'2rem' },
  hwCard: { background:'var(--cr)',borderRadius:20,padding:'2rem',border:'1px solid var(--bd)',position:'relative',overflow:'hidden' },
  // Role cards
  rolesGrid: { display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem',marginTop:'3rem' },
  // Impact
  impactSec: { padding:'5rem 5%',background:'#1C1209',textAlign:'center' },
  impGrid: { display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1.25rem',maxWidth:900,margin:'0 auto' },
  impBox: { background:'rgba(255,255,255,.05)',borderRadius:14,padding:'1.75rem 1rem',border:'1px solid rgba(255,255,255,.08)' },
  // Eco
  ecoSec: { padding:'5rem 5%',background:'var(--gr-l)' },
  ecoIn: { display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'center' },
  ecoF: { background:'#fff',borderRadius:20,padding:'2rem',border:'1px solid #C0DD97' },
  // Footer
  footer: { background:'#0A0703',color:'rgba(255,255,255,.3)',padding:'2.5rem 5%',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem' },
};

function HowCard({ n, ico, icoBg, title, text }) {
  return (
    <div style={S.hwCard}>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:'5rem',fontWeight:900,color:'#F5EFE8',position:'absolute',top:-10,right:14,lineHeight:1 }}>{n}</div>
      <div style={{ position:'relative',zIndex:1 }}>
        <div style={{ width:44,height:44,borderRadius:12,background:icoBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',marginBottom:'1.1rem' }}>{ico}</div>
        <h3 style={{ fontSize:'1rem',fontWeight:500,color:'var(--dk)',marginBottom:'.45rem' }}>{title}</h3>
        <p style={{ fontSize:'.88rem',color:'var(--wg)',lineHeight:1.65,fontWeight:300 }}>{text}</p>
      </div>
    </div>
  );
}

function RoleCard({ ico, title, desc, feats, ctaText, ctaColor, bg, borderColor, titleColor, featColor, onClick }) {
  return (
    <div style={{ borderRadius:24,padding:'2.5rem 2rem',border:`1.5px solid ${borderColor}`,background:bg,cursor:'pointer',transition:'transform .25s,box-shadow .25s' }}
      onClick={onClick}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='0 10px 32px rgba(28,18,9,.09)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
      <div style={{ fontSize:'2.6rem',marginBottom:'1.1rem' }}>{ico}</div>
      <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',fontWeight:700,marginBottom:'.6rem',color:titleColor }}>{title}</h3>
      <p style={{ fontSize:'.85rem',lineHeight:1.65,fontWeight:300,marginBottom:'1.25rem',color:featColor }}>{desc}</p>
      <ul style={{ listStyle:'none',display:'flex',flexDirection:'column',gap:'.42rem',marginBottom:'1.25rem' }}>
        {feats.map((f,i)=>(
          <li key={i} style={{ fontSize:'.78rem',display:'flex',alignItems:'center',gap:'.45rem',color:titleColor }}>
            <span style={{ width:5,height:5,borderRadius:'50%',background:ctaColor,flexShrink:0 }}></span>{f}
          </li>
        ))}
      </ul>
      <button style={{ display:'inline-flex',alignItems:'center',gap:'.4rem',fontSize:'.85rem',fontWeight:500,border:'none',background:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",color:ctaColor,padding:0 }}>{ctaText} →</button>
    </div>
  );
}

export default function LandingPage() {
  const nav = useNavigate();

  return (
    <div>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.logo} onClick={()=>nav('/')}>SHELF<span style={{color:'var(--gr-m)'}}>LIFE</span>+</div>
        <ul style={S.navLinks}>
          <li><a style={S.navLink}>How it works</a></li>
          <li><a style={S.navLink}>For Restaurants</a></li>
          <li><a style={S.navLink}>For NGOs</a></li>
        </ul>
        <div style={{ display:'flex',gap:'.75rem' }}>
          <button style={S.btnGhost} onClick={()=>nav('/pick-role')}>Login</button>
          <button style={S.btnOr}    onClick={()=>nav('/pick-role')}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={S.hero}>
        <div>
          <div style={S.badge}><span className="pulse-dot" style={{background:'var(--gr-m)'}}></span>Reducing food waste across India</div>
          <h1 style={S.h1}>Give food a<br/><span style={{color:'var(--or)'}}>second chance.</span><br/>Save the <span style={{color:'var(--gr-m)'}}>planet.</span></h1>
          <p style={S.heroSub}>SHELFLIFE+ connects restaurants &amp; shops with conscious buyers and NGOs — turning near-expiry inventory into savings, sustainability, and social impact.</p>
          <div style={S.heroActs}>
            <button style={S.btnHeroP} onClick={()=>nav('/for/user')}>Order Discounted Food</button>
            <button style={S.btnHeroS} onClick={()=>nav('/for/owner')}>List Your Inventory</button>
          </div>
          <div style={S.heroStats}>
            <div><div style={S.statNum}>40%</div><div style={S.statLbl}>avg. discount on items</div></div>
            <div><div style={S.statNum}>2.5kg</div><div style={S.statLbl}>CO₂ saved per order</div></div>
            <div><div style={S.statNum}>48+</div><div style={S.statLbl}>NGO partners</div></div>
          </div>
        </div>
        {/* Hero Visual */}
        <div style={{ position:'relative',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ position:'relative',width:360,height:400 }}>
            {[
              { cls:'s1', style:{width:190,top:78,left:-8,zIndex:2,transform:'rotate(-6deg)',opacity:.9}, emoji:'🥗', name:'Veg Thali Set', shop:'Annapurna Kitchen', price:'₹89', orig:'₹149', disc:'-40%' },
              { cls:'main', style:{width:260,top:28,left:'50%',transform:'translateX(-50%)',zIndex:3}, emoji:'🍱', name:'Paneer Biryani Box', shop:'Spice Route, Thane', price:'₹120', orig:'₹220', disc:'-45%' },
              { cls:'s2', style:{width:190,top:115,right:-8,zIndex:2,transform:'rotate(5deg)',opacity:.9}, emoji:'🥛', name:'Dairy Combo Pack', shop:'FreshMart Grocers', price:'₹55', orig:'₹90', disc:'-38%' },
            ].map((fc,i)=>(
              <div key={i} style={{ position:'absolute',background:'#fff',borderRadius:20,padding:'1.25rem',boxShadow:'0 8px 40px rgba(28,18,9,.15)',border:'1px solid var(--bd)',...fc.style }}>
                <div style={{ fontSize:'2.2rem',marginBottom:'.7rem' }}>{fc.emoji}</div>
                <div style={{ fontWeight:500,fontSize:'.9rem',color:'#1C1209' }}>{fc.name}</div>
                <div style={{ fontSize:'.72rem',color:'var(--wg)',marginTop:2 }}>{fc.shop}</div>
                <div style={{ display:'flex',alignItems:'center',gap:'.4rem',marginTop:'.6rem' }}>
                  <span style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.15rem',fontWeight:700,color:'var(--or)' }}>{fc.price}</span>
                  <span style={{ fontSize:'.8rem',color:'#B0A090',textDecoration:'line-through' }}>{fc.orig}</span>
                  <span style={{ background:'var(--gr-l)',color:'var(--gr-d)',fontSize:'.68rem',fontWeight:600,padding:'.18rem .48rem',borderRadius:50,border:'1px solid #C0DD97' }}>{fc.disc}</span>
                </div>
              </div>
            ))}
            <div style={{ position:'absolute',top:8,right:-18,background:'var(--or)',color:'#fff',borderRadius:13,padding:'.65rem .9rem',fontSize:'.78rem',fontWeight:500,zIndex:5,whiteSpace:'nowrap',boxShadow:'0 4px 14px rgba(232,97,10,.35)' }}>₹1,240 saved<span style={{ display:'block',fontSize:'.65rem',opacity:.82,fontWeight:300 }}>this week by users</span></div>
            <div style={{ position:'absolute',bottom:12,left:-18,background:'var(--gr)',color:'#fff',borderRadius:13,padding:'.65rem .9rem',fontSize:'.78rem',fontWeight:500,zIndex:5,whiteSpace:'nowrap',boxShadow:'0 4px 14px rgba(59,109,17,.35)' }}>🤝 NGO Pickup Ready<span style={{ display:'block',fontSize:'.65rem',opacity:.82,fontWeight:300 }}>3 donations pending</span></div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={S.sec}>
        <div style={{ ...S.secLbl,color:'var(--or)' }}>How it works</div>
        <h2 style={S.secH2}>Simple. Sustainable. Smart.</h2>
        <p style={S.secSub}>Three steps between near-expiry inventory and a happy customer — or a grateful NGO.</p>
        <div style={S.howGrid}>
          <HowCard n="01" ico="🏪" icoBg="var(--or-l)" title="Owner lists items" text="Restaurant & shop owners upload near-expiry food with photos, quantities, and discounted pricing. Items go live instantly." />
          <HowCard n="02" ico="🛒" icoBg="var(--gr-l)" title="User browses & orders" text="Customers browse, add to cart, and pay via UPI, card, or COD. They see money saved & CO₂ footprint reduced live." />
          <HowCard n="03" ico="🤝" icoBg="var(--or-l)" title="NGO receives donations" text="Owners route unsold surplus directly to registered NGOs. NGO admins review, accept or decline, and track all donations." />
        </div>
      </div>

      {/* ROLE CARDS */}
      <div style={S.secWt}>
        <div style={{ ...S.secLbl,color:'var(--or)' }}>Who is it for?</div>
        <h2 style={S.secH2}>Three portals. One mission.</h2>
        <p style={S.secSub}>Every role has its own tailored experience.</p>
        <div style={S.rolesGrid}>
          <RoleCard ico="🍽️" title="Restaurant / Shop Owner" desc="List near-expiry items at a discount, manage inventory live, and donate surplus to NGOs." feats={['Upload food with images & quantity','Set expiry dates & discounts','Live sales & inventory dashboard','Direct NGO donation portal']} ctaText="Owner Portal" ctaColor="var(--or)" bg="var(--or-l)" borderColor="var(--or-m)" titleColor="#7A3008" featColor="#9A5030" onClick={()=>nav('/for/owner')} />
          <RoleCard ico="🌿" title="Conscious Consumer" desc="Browse near-expiry deals, pay your way, and track your CO₂ savings and money saved in real time." feats={['Browse restaurants & grocery stores','Veg/Non-Veg toggle filter','Cart, checkout & multiple payments','CO₂ saved & money saved tracker']} ctaText="User Portal" ctaColor="var(--gr)" bg="var(--gr-l)" borderColor="#C0DD97" titleColor="var(--gr-d)" featColor="#4A6A20" onClick={()=>nav('/for/user')} />
          <RoleCard ico="💜" title="NGO Partner" desc="Review donation offers, accept pickups, and track your real-world impact with a clean admin dashboard." feats={['Register & get verified as NGO','Review incoming donation offers','Accept or decline with reason','Pending & completed donation log']} ctaText="NGO Portal" ctaColor="var(--pu)" bg="var(--pu-l)" borderColor="var(--pu-m)" titleColor="var(--pu-d)" featColor="var(--pu)" onClick={()=>nav('/for/ngo')} />
        </div>
      </div>

      {/* IMPACT */}
      <div style={S.impactSec}>
        <div style={{ ...S.secLbl,color:'var(--or-m)',textAlign:'center' }}>Our impact</div>
        <h2 style={{ ...S.secH2,color:'#fff',textAlign:'center',marginBottom:'.75rem' }}>Every order counts</h2>
        <p style={{ fontSize:'.95rem',color:'rgba(255,255,255,.45)',maxWidth:540,margin:'0 auto 3rem',fontWeight:300 }}>Real numbers. Real change.</p>
        <div style={S.impGrid}>
          {[['12K+','meals saved'],['3.1T','kg CO₂ avoided'],['₹8L+','saved by users'],['48','NGO partners']].map(([v,l],i)=>(
            <div key={i} style={S.impBox}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:'2rem',fontWeight:700,color:'var(--or-m)' }}>{v}</div>
              <div style={{ fontSize:'.78rem',color:'rgba(255,255,255,.38)',marginTop:5 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ECO FORMULA */}
      <div style={S.ecoSec}>
        <div style={S.ecoIn}>
          <div>
            <div style={{ ...S.secLbl,color:'var(--gr)' }}>Carbon impact formula</div>
            <h2 style={S.secH2}>How we calculate your CO₂ savings</h2>
            <p style={{ ...S.secSub,maxWidth:400 }}>Every near-expiry item you order prevents greenhouse gases from entering our atmosphere.</p>
          </div>
          <div style={S.ecoF}>
            <div style={{ fontSize:'.78rem',textTransform:'uppercase',letterSpacing:2,color:'var(--gr)',fontWeight:500,marginBottom:'1.1rem' }}>CO₂ Saved Formula</div>
            <div style={{ display:'flex',alignItems:'center',gap:'.7rem',flexWrap:'wrap',marginBottom:'1rem' }}>
              {['Weight of food (kg)','×','2.5 kg CO₂/kg','='].map((t,i)=>(
                ['×','='].includes(t) ? <span key={i} style={{ color:'var(--wg)',fontSize:'.95rem' }}>{t}</span>
                : <div key={i} style={{ background:'var(--gr-l)',border:'1px solid #C0DD97',borderRadius:10,padding:'.45rem .8rem',fontSize:'.8rem',fontWeight:500,color:'var(--gr-d)' }}>{t}</div>
              ))}
              <div style={{ background:'var(--gr)',color:'#fff',borderRadius:10,padding:'.45rem .8rem',fontSize:'.8rem',fontWeight:500 }}>CO₂ saved (kg)</div>
            </div>
            <ul style={{ listStyle:'none',display:'flex',flexDirection:'column',gap:'.65rem' }}>
              {['Average food waste emits ~2.5 kg CO₂ per kg (UN FAO estimate)','Includes methane from landfill decomposition','Includes water footprint & transport emissions avoided'].map((t,i)=>(
                <li key={i} style={{ display:'flex',alignItems:'flex-start',gap:'.55rem',fontSize:'.85rem',color:'var(--wg)',lineHeight:1.5 }}>
                  <span style={{ width:8,height:8,borderRadius:'50%',background:'var(--gr-m)',flexShrink:0,marginTop:4 }}></span>{t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',fontWeight:900,color:'var(--or)' }}>SHELF<span style={{color:'var(--gr-m)'}}>LIFE</span>+</div>
          <p style={{ marginTop:'.4rem',fontSize:'.75rem' }}>Saving food. Saving money. Saving the planet.</p>
        </div>
        <div style={{ display:'flex',gap:'1.5rem' }}>
          {[['Owner Login','/login/owner'],['User Login','/login/user'],['NGO Login','/login/ngo']].map(([t,p])=>(
            <span key={t} style={{ color:'rgba(255,255,255,.3)',textDecoration:'none',fontSize:'.78rem',cursor:'pointer' }} onClick={()=>nav(p)}>{t}</span>
          ))}
        </div>
        <p style={{ fontSize:'.75rem' }}>© 2025 SHELFLIFE+ · Made with 🧡 in India</p>
      </footer>
    </div>
  );
}
