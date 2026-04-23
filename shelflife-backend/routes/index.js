const express  = require('express');
const router   = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');

const auth     = require('../controllers/authController');
const food     = require('../controllers/foodController');
const order    = require('../controllers/orderController');
const donation = require('../controllers/donationController');
const payment  = require('../controllers/paymentController');
const ngo      = require('../controllers/ngoController');
const owner    = require('../controllers/ownerController');

/* ══════════════════════════════════════════════
   AUTH — public routes
══════════════════════════════════════════════ */
router.post('/auth/register/owner', auth.registerOwner);
router.post('/auth/register/user',  auth.registerUser);
router.post('/auth/register/ngo',   auth.registerNgo);
router.post('/auth/login',          auth.login);

// Change password — all logged-in roles
router.put('/auth/change-password', authMiddleware, auth.changePassword);

/* ══════════════════════════════════════════════
   PUBLIC FOOD BROWSE
══════════════════════════════════════════════ */
router.get('/items',     food.getAllItems);
router.get('/items/:id', food.getItemById);

/* ══════════════════════════════════════════════
   PUBLIC RESTAURANT SEARCH (for NGO partner add)
══════════════════════════════════════════════ */
router.get('/restaurants/search', authMiddleware, requireRole('ngo'), ngo.searchRestaurants);

/* ══════════════════════════════════════════════
   OWNER — FOOD / INVENTORY
══════════════════════════════════════════════ */
router.get   ('/owner/inventory',  authMiddleware, requireRole('owner'), food.getOwnerInventory);
router.get   ('/owner/dashboard',  authMiddleware, requireRole('owner'), food.getOwnerDashboard);
router.post  ('/owner/items',      authMiddleware, requireRole('owner'), food.upload.single('image'), food.createItem);
router.put   ('/owner/items/:id',  authMiddleware, requireRole('owner'), food.updateItem);
router.delete('/owner/items/:id',  authMiddleware, requireRole('owner'), food.deleteItem);

/* ══════════════════════════════════════════════
   OWNER — PROFILE
══════════════════════════════════════════════ */
router.get('/owner/profile',         authMiddleware, requireRole('owner'), food.getOwnerProfile);
// Image upload handled by food controller (multer)
router.put('/owner/profile',         authMiddleware, requireRole('owner'), food.upload.single('image'), food.updateOwnerProfile);
// Text-only profile details (name, email, restaurant name)
router.put('/owner/profile/details', authMiddleware, requireRole('owner'), owner.updateOwnerDetails);

/* ══════════════════════════════════════════════
   OWNER — EXPIRY MANAGEMENT
══════════════════════════════════════════════ */
router.get('/owner/expiry-alerts',   authMiddleware, requireRole('owner'), food.getExpiryAlerts);
router.post('/owner/expire-items',   authMiddleware, requireRole('owner'), food.processExpiredItems);

/* ══════════════════════════════════════════════
   OWNER — SETTINGS
══════════════════════════════════════════════ */
router.get('/owner/settings', authMiddleware, requireRole('owner'), owner.getOwnerSettings);
router.put('/owner/settings', authMiddleware, requireRole('owner'), owner.updateOwnerSettings);

/* ══════════════════════════════════════════════
   OWNER — ORDERS & PAYMENTS
══════════════════════════════════════════════ */
router.get('/owner/orders',       authMiddleware, requireRole('owner'), order.getOwnerOrders);
router.get('/owner/transactions', authMiddleware, requireRole('owner'), payment.getOwnerTransactions);
router.put('/orders/:id/status',  authMiddleware, requireRole('owner'), order.updateOrderStatus);

/* ══════════════════════════════════════════════
   OWNER — DONATIONS
══════════════════════════════════════════════ */
router.post('/donations',       authMiddleware, requireRole('owner'), donation.createOffer);
router.get ('/donations/owner', authMiddleware, requireRole('owner'), donation.getOwnerOffers);

/* ══════════════════════════════════════════════
   USER — PROFILE & ADDRESS
══════════════════════════════════════════════ */
router.get('/user/profile', authMiddleware, requireRole('user'), auth.getUserProfile);
router.put('/user/profile', authMiddleware, requireRole('user'), auth.updateUserProfile);

/* ══════════════════════════════════════════════
   USER — ORDERS
══════════════════════════════════════════════ */
router.post('/orders',        authMiddleware, requireRole('user'), order.placeOrder);
router.get ('/orders/my',     authMiddleware, requireRole('user'), order.getUserOrders);
router.get ('/orders/impact', authMiddleware, requireRole('user'), order.getUserImpact);

/* ══════════════════════════════════════════════
   USER — PAYMENTS
══════════════════════════════════════════════ */
router.post('/payment/create-order', authMiddleware, requireRole('user'), payment.createRazorpayOrder);
router.post('/payment/verify',       authMiddleware, requireRole('user'), payment.verifyPayment);
router.post('/payment/cod-confirm',  authMiddleware, requireRole('user'), payment.confirmCOD);

/* ══════════════════════════════════════════════
   NGO — DONATIONS
══════════════════════════════════════════════ */
router.get('/donations/ngo',           authMiddleware, requireRole('ngo'), donation.getNgoOffers);
router.get('/donations/ngo/dashboard', authMiddleware, requireRole('ngo'), donation.getNgoDashboard);
router.put('/donations/:id/respond',   authMiddleware, requireRole('ngo'), donation.respondToOffer);
router.put('/donations/:id/complete',  authMiddleware, requireRole('ngo'), donation.completeOffer);

/* ══════════════════════════════════════════════
   NGO — PROFILE
══════════════════════════════════════════════ */
router.get('/ngo/profile', authMiddleware, requireRole('ngo'), ngo.getNgoProfile);
router.put('/ngo/profile', authMiddleware, requireRole('ngo'), ngo.updateNgoProfile);

/* ══════════════════════════════════════════════
   NGO — SETTINGS
══════════════════════════════════════════════ */
router.get('/ngo/settings', authMiddleware, requireRole('ngo'), ngo.getNgoSettings);
router.put('/ngo/settings', authMiddleware, requireRole('ngo'), ngo.updateNgoSettings);

/* ══════════════════════════════════════════════
   NGO — RESTAURANT PARTNERS
══════════════════════════════════════════════ */
router.get   ('/ngo/partners',                  authMiddleware, requireRole('ngo'), ngo.getNgoPartners);
router.post  ('/ngo/partners',                  authMiddleware, requireRole('ngo'), ngo.addNgoPartner);
router.delete('/ngo/partners/:restaurantId',    authMiddleware, requireRole('ngo'), ngo.removeNgoPartner);

module.exports = router;
