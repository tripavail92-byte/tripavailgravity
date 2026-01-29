// Search Routes - Stub
// TODO: Implement property search with filters

import { Hono } from 'npm:hono@4';

const app = new Hono();

// Placeholder routes
app.get('/', (c) => c.json({ success: true, data: [], message: 'Search endpoint - coming soon' }));

export default app;
