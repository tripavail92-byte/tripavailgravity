// Uploads Routes - Stub
// TODO: Implement file upload to Supabase Storage

import { Hono } from 'npm:hono@4';

const app = new Hono();

// Placeholder routes
app.post('/property-image', (c) => c.json({ success: true, message: 'Upload property image - coming soon' }));
app.post('/avatar', (c) => c.json({ success: true, message: 'Upload avatar - coming soon' }));

export default app;
