// TripAvail API Server - Main Entry Point
// Supabase Edge Function with Hono
// Created: 2025-01-03

import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { prettyJSON } from 'npm:hono/pretty-json';

// Import routes
import propertiesRouter from './routes/properties.ts';
import discountsRouter from './routes/discounts.ts';
import amenitiesRouter from './routes/amenities.ts';
import bookingsRouter from './routes/bookings.ts';
import authRouter from './routes/auth.ts';
import usersRouter from './routes/users.ts';
import reviewsRouter from './routes/reviews.ts';
import uploadsRouter from './routes/uploads.ts';
import searchRouter from './routes/search.ts';

// Initialize Hono app
const app = new Hono();

// =====================================================
// MIDDLEWARE
// =====================================================

// CORS - Allow requests from your frontend
app.use('*', cors({
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Alternative dev server
    'https://tripavail.com', // Production domain (update with your actual domain)
    'https://www.tripavail.com',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Logger - Log all requests
app.use('*', logger(console.log));

// Pretty JSON responses in development
app.use('*', prettyJSON());

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'TripAvail API Server',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Welcome to TripAvail API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      properties: '/api/properties',
      discounts: '/api/properties/:id/discount',
      amenities: '/api/amenities',
      bookings: '/api/bookings',
      auth: '/api/auth',
      users: '/api/users',
      reviews: '/api/reviews',
      search: '/api/search',
      uploads: '/api/uploads'
    },
    documentation: 'https://docs.tripavail.com'
  });
});

// =====================================================
// API ROUTES
// =====================================================

// Mount all route handlers
app.route('/api/properties', propertiesRouter);
app.route('/api/discounts', discountsRouter);
app.route('/api/amenities', amenitiesRouter);
app.route('/api/bookings', bookingsRouter);
app.route('/api/auth', authRouter);
app.route('/api/users', usersRouter);
app.route('/api/reviews', reviewsRouter);
app.route('/api/uploads', uploadsRouter);
app.route('/api/search', searchRouter);

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    message: `Route ${c.req.path} not found`,
    timestamp: new Date().toISOString()
  }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  
  // Check if it's a known error type
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  return c.json({
    success: false,
    error: err.name || 'Error',
    message: message,
    timestamp: new Date().toISOString(),
    // Include stack trace in development only
    ...(Deno.env.get('DENO_ENV') === 'development' && {
      stack: err.stack
    })
  }, statusCode);
});

// =====================================================
// START SERVER
// =====================================================

console.log('🚀 TripAvail API Server starting...');
console.log('📍 Environment:', Deno.env.get('DENO_ENV') || 'production');
console.log('🔐 CORS enabled for:', 'localhost:5173, tripavail.com');
console.log('✅ Server ready!');

Deno.serve(app.fetch);
