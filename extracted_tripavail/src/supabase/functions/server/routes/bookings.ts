// Bookings Routes - Stub
// TODO: Implement booking creation, listing, and management

import { Hono } from 'npm:hono@4';

const app = new Hono();

// Placeholder routes
app.get('/', (c) => c.json({ success: true, data: [], message: 'Bookings endpoint - coming soon' }));
app.post('/', (c) => c.json({ success: true, message: 'Create booking - coming soon' }));
app.get('/:id', (c) => c.json({ success: true, message: 'Get booking - coming soon' }));

export default app;
