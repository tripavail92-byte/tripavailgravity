// Reviews Routes - Stub
// TODO: Implement review creation, listing

import { Hono } from 'npm:hono@4';

const app = new Hono();

// Placeholder routes
app.get('/', (c) => c.json({ success: true, data: [], message: 'Reviews endpoint - coming soon' }));
app.post('/', (c) => c.json({ success: true, message: 'Create review - coming soon' }));

export default app;
