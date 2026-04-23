// =====================================================
//  SHELFLIFE+ — Shared Data
// =====================================================

export const FOOD_ITEMS = [
  { id:1,  shop:'Spice Route',   city:'Thane',  type:'food',    veg:true,  emoji:'🍱', name:'Paneer Biryani Box',  cat:'Meals',    orig:220, disc:120, qty:6,  wt:.25, expiry:'today'    },
  { id:2,  shop:'Spice Route',   city:'Thane',  type:'food',    veg:true,  emoji:'🥗', name:'Veg Thali Set',       cat:'Meals',    orig:149, disc:89,  qty:10, wt:.2,  expiry:'today'    },
  { id:3,  shop:'Spice Route',   city:'Thane',  type:'food',    veg:false, emoji:'🍗', name:'Chicken Wrap Combo',  cat:'Snacks',   orig:180, disc:110, qty:4,  wt:.2,  expiry:'today'    },
  { id:4,  shop:'Spice Route',   city:'Thane',  type:'food',    veg:true,  emoji:'🍛', name:'Dal Makhani',         cat:'Meals',    orig:140, disc:95,  qty:9,  wt:.22, expiry:'tomorrow' },
  { id:5,  shop:'Spice Route',   city:'Thane',  type:'beverage',veg:true,  emoji:'🥤', name:'Mango Lassi 500ml',   cat:'Beverages',orig:80,  disc:50,  qty:12, wt:.5,  expiry:'tomorrow' },
  { id:6,  shop:'FreshMart',     city:'Thane',  type:'grocery', veg:true,  emoji:'🥦', name:'Fresh Veg Combo',     cat:'Grocery',  orig:140, disc:85,  qty:10, wt:.5,  expiry:'today'    },
  { id:7,  shop:'FreshMart',     city:'Thane',  type:'grocery', veg:true,  emoji:'🌾', name:'Rice & Dal 2kg',      cat:'Grocery',  orig:195, disc:120, qty:7,  wt:2,   expiry:'tomorrow' },
  { id:8,  shop:'FreshMart',     city:'Thane',  type:'beverage',veg:true,  emoji:'🧃', name:'Juice 6-pack',        cat:'Beverages',orig:160, disc:95,  qty:5,  wt:.6,  expiry:'tomorrow' },
  { id:9,  shop:'Dairy Farm',    city:'Thane',  type:'dairy',   veg:true,  emoji:'🥛', name:'Full Cream Milk 2L',  cat:'Dairy',    orig:95,  disc:60,  qty:15, wt:2,   expiry:'today'    },
  { id:10, shop:'Dairy Farm',    city:'Thane',  type:'dairy',   veg:true,  emoji:'🧀', name:'Paneer 500g',         cat:'Dairy',    orig:155, disc:90,  qty:8,  wt:.5,  expiry:'tomorrow' },
  { id:11, shop:'Dairy Farm',    city:'Thane',  type:'dairy',   veg:false, emoji:'🥚', name:'Egg Tray 30pcs',      cat:'Dairy',    orig:150, disc:90,  qty:6,  wt:.9,  expiry:'tomorrow' },
  { id:12, shop:'Sweet Spot',    city:'Mumbai', type:'bakery',  veg:true,  emoji:'🍮', name:'Dessert Box 4pcs',    cat:'Bakery',   orig:130, disc:75,  qty:5,  wt:.3,  expiry:'today'    },
  { id:13, shop:'Sweet Spot',    city:'Mumbai', type:'bakery',  veg:true,  emoji:'🍞', name:'Multigrain Bread',    cat:'Bakery',   orig:60,  disc:35,  qty:14, wt:.4,  expiry:'tomorrow' },
  { id:14, shop:'Annapurna',     city:'Mumbai', type:'food',    veg:true,  emoji:'🥙', name:'Stuffed Paratha',     cat:'Snacks',   orig:90,  disc:55,  qty:8,  wt:.15, expiry:'today'    },
  { id:15, shop:'Annapurna',     city:'Mumbai', type:'food',    veg:false, emoji:'🍖', name:'Mutton Biryani',      cat:'Meals',    orig:280, disc:170, qty:3,  wt:.35, expiry:'today'    },
];

export const OWNER_ITEMS_INIT = [
  { id:1, name:'Paneer Biryani Box', cat:'Meals',   emoji:'🍱', qty:6,  unit:'pieces',  orig:220, disc:120, exp:'2025-07-19', status:'active'         },
  { id:2, name:'Veg Thali Set',      cat:'Meals',   emoji:'🥗', qty:0,  unit:'pieces',  orig:149, disc:89,  exp:'2025-07-19', status:'out-of-stock'    },
  { id:3, name:'Dairy Combo Pack',   cat:'Dairy',   emoji:'🥛', qty:8,  unit:'pieces',  orig:90,  disc:55,  exp:'2025-07-19', status:'expiring-today'  },
  { id:4, name:'Multigrain Bread',   cat:'Breads',  emoji:'🍞', qty:14, unit:'pieces',  orig:60,  disc:35,  exp:'2025-07-20', status:'expiring-soon'   },
  { id:5, name:'Mango Lassi 500ml',  cat:'Bev',     emoji:'🥤', qty:12, unit:'bottles', orig:80,  disc:50,  exp:'2025-07-21', status:'active'          },
  { id:6, name:'Dessert Box 4pcs',   cat:'Desserts',emoji:'🍮', qty:5,  unit:'boxes',   orig:130, disc:75,  exp:'2025-07-20', status:'expiring-soon'   },
  { id:7, name:'Dal Makhani',        cat:'Meals',   emoji:'🍛', qty:9,  unit:'pieces',  orig:140, disc:95,  exp:'2025-07-21', status:'active'          },
  { id:8, name:'Paneer 500g',        cat:'Dairy',   emoji:'🧀', qty:3,  unit:'pieces',  orig:155, disc:90,  exp:'2025-07-20', status:'expiring-soon'   },
];

export const OWNER_ORDERS_INIT = [
  { num:'SL-K8X4', customer:'Priya Rao',    items:'Paneer Biryani ×2', amount:240, pay:'UPI',  status:'delivered', time:'9:14 am'  },
  { num:'SL-K9T2', customer:'Arjun Mehta',  items:'Veg Thali ×3',      amount:390, pay:'Card', status:'preparing', time:'10:02 am' },
  { num:'SL-KBM1', customer:'Neha Joshi',   items:'Dessert Box ×2',    amount:150, pay:'UPI',  status:'confirmed', time:'10:28 am' },
  { num:'SL-KC3P', customer:'Sanjay Kumar', items:'Dal Makhani ×1',    amount:95,  pay:'COD',  status:'pending',   time:'11:05 am' },
];

export const USER_ORDERS_INIT = [
  { num:'SL-K8X4-AB12', shop:'Spice Route, Thane',  date:'Today 9:14 am',     status:'delivered', pay:'UPI',
    items:[{n:'Paneer Biryani Box',q:2,p:120},{n:'Mango Lassi',q:1,p:50}], total:290, saved:130, co2:1.3 },
  { num:'SL-K7W3-CD89', shop:'FreshMart Grocers',   date:'Yesterday 6:20 pm', status:'delivered', pay:'Card',
    items:[{n:'Fresh Veg Combo',q:1,p:85},{n:'Juice 6-pack',q:1,p:95}],   total:180, saved:120, co2:.9  },
  { num:'SL-K6V2-EF45', shop:'Dairy Farm Direct',   date:'17 Jul 3:45 pm',    status:'preparing', pay:'UPI',
    items:[{n:'Full Cream Milk 2L',q:2,p:60},{n:'Paneer 500g',q:1,p:90}], total:210, saved:125, co2:1.6 },
];

export const NGO_OFFERS_INIT = [
  { id:1, num:'DON-K8X1', shop:'Spice Route',       city:'Thane',  phone:'+91 98765 11111', address:'Shop 12, Station Rd, Thane',
    status:'open',    title:'End of day surplus',        desc:'Unsold meals — still fresh and packaged.',
    items:['🍱 Paneer Biryani ×12','🥗 Veg Thali ×8','🍮 Dessert Box ×6'],
    pickupDate:'Today',    pickupSlot:'7:00 pm – 8:00 pm', notes:'Please bring your own boxes.',    kg:13.5, ico:'or' },
  { id:2, num:'DON-K9T2', shop:'FreshMart Grocers', city:'Thane',  phone:'+91 98765 33333', address:'14, Market St, Thane',
    status:'pending', title:'Dairy & Vegetable surplus',  desc:'Near-expiry dairy and fresh vegetables.',
    items:['🥛 Dairy Combo ×20','🥦 Veg Box ×15','🧃 Juice 6-pack ×5'],
    pickupDate:'Tomorrow', pickupSlot:'9:00 am – 10:00 am',notes:'Cold chain — bring cooler bag.',  kg:22,   ico:'gr' },
  { id:3, num:'DON-KBM3', shop:'Annapurna Kitchen', city:'Thane',  phone:'+91 98765 22222', address:'Opp. Bus Stand, Thane',
    status:'pending', title:'Sunday surplus meals',       desc:'Full thali sets — all vegetarian.',
    items:['🥗 Veg Thali ×18','🍞 Bread ×24'],
    pickupDate:'Today',    pickupSlot:'6:00 pm – 7:00 pm', notes:'18 thalis packed in trays.',      kg:9.6,  ico:'tl' },
  { id:4, num:'DON-KC4P', shop:'Sweet Spot Bakery', city:'Mumbai', phone:'+91 98765 44444', address:'12, MG Road, Dadar',
    status:'open',    title:'Baked goods end of day',     desc:'Unsold breads and desserts.',
    items:['🍞 Multigrain Bread ×14','🍮 Dessert Box ×10'],
    pickupDate:'Today',    pickupSlot:'8:00 pm – 9:00 pm', notes:'',                                kg:9.6,  ico:'am' },
  { id:5, num:'DON-KD5Q', shop:'Dairy Farm Direct', city:'Thane',  phone:'+91 98765 55555', address:'Farm Road, Thane Rural',
    status:'pending', title:'Dairy surplus',               desc:'Milk and paneer near best-before date.',
    items:['🥛 Milk 2L ×10','🧀 Paneer 500g ×8'],
    pickupDate:'Tomorrow', pickupSlot:'8:00 am – 9:00 am', notes:'Refrigerated — act fast.',        kg:24,   ico:'pu' },
];

export const NGO_ACCEPTED_INIT = [
  { id:10, num:'DON-ACC01', shop:'Annapurna Kitchen', city:'Thane',  phone:'+91 98765 22222', address:'Opp. Bus Stand, Thane',
    status:'accepted', items:['🥗 Veg Thali ×18','🍞 Bread ×24'], pickupDate:'Today',    pickupSlot:'6:00 pm', kg:9.6, ico:'tl' },
  { id:11, num:'DON-ACC02', shop:'Sweet Spot Bakery', city:'Mumbai', phone:'+91 98765 44444', address:'12, MG Road, Dadar',
    status:'accepted', items:['🍞 Bread ×14','🍮 Dessert Box ×10'],  pickupDate:'Today',    pickupSlot:'8:00 pm', kg:9.6, ico:'am' },
  { id:12, num:'DON-ACC03', shop:'FreshMart Grocers', city:'Thane',  phone:'+91 98765 33333', address:'14, Market St, Thane',
    status:'accepted', items:['🥛 Dairy Combo ×20','🥦 Veg Box ×15'],pickupDate:'Tomorrow', pickupSlot:'9:00 am', kg:22,  ico:'gr' },
];

export const NGO_COMPLETED_INIT = [
  { num:'DON-C001', shop:'Spice Route',  items:'Biryani ×10, Thali ×8',    kg:9.2,  co2:23,   date:'18 Jul 2025' },
  { num:'DON-C002', shop:'Annapurna',   items:'Thali ×20, Bread ×15',      kg:11.5, co2:28.8, date:'17 Jul 2025' },
  { num:'DON-C003', shop:'FreshMart',   items:'Veg Box ×12, Dairy ×8',     kg:14.0, co2:35,   date:'16 Jul 2025' },
  { num:'DON-C004', shop:'Sweet Spot',  items:'Bread ×20, Dessert ×8',     kg:8.8,  co2:22,   date:'15 Jul 2025' },
];

export const DECLINE_REASONS = [
  'Capacity full on that day',
  'Pickup time not feasible',
  'Item type not suitable for us',
  'Location too far for pickup',
  'Volunteers unavailable',
  'Already at capacity this week',
];
