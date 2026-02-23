# TripAvail Face Verification API

Open-source face matching microservice using **DeepFace + FaceNet-512**.  
Deployed on Railway — zero per-call API cost.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Liveness probe |
| POST | `/verify` | Bearer `FACE_API_SECRET` | Compare two face images |

## POST /verify

```json
{
  "id_url":     "https://…/id_card.jpg",
  "selfie_url": "https://…/selfie.jpg"
}
```

Response:
```json
{
  "match":    true,
  "score":    87,
  "distance": 0.21,
  "method":   "deepface-Facenet512",
  "reason":   "DeepFace (Facenet512) confirmed identity match with 87% similarity."
}
```

## Environment Variables (set in Railway dashboard)

| Variable | Description |
|----------|-------------|
| `FACE_API_SECRET` | Shared secret — set the same value in Supabase secrets |
| `DEEPFACE_MODEL` | Model to use (default: `Facenet512`) |
| `DEEPFACE_DETECTOR` | Face detector (default: `retinaface`) |
| `MATCH_THRESHOLD` | Cosine distance threshold (default: `0.40`) |
| `PORT` | Set automatically by Railway |

## Deploying to Railway

1. Create a new service in your Railway project → **Deploy from Git repo** → point to `services/face-api/`
2. Or use the CLI:
   ```bash
   cd services/face-api
   railway up
   ```
3. Set env var: `FACE_API_SECRET=<generate a strong random string>`
4. Copy the Railway public URL (e.g. `https://face-api-production-xxxx.up.railway.app`)
5. Set it in Supabase secrets:
   ```bash
   npx supabase secrets set FACE_API_URL="https://face-api-production-xxxx.up.railway.app"
   npx supabase secrets set FACE_API_SECRET="<same secret as Railway>"
   ```
6. Redeploy the `verify-identity` edge function:
   ```bash
   npx supabase functions deploy verify-identity
   ```

## Architecture

```
Browser → Supabase Edge Function (verify-identity)
              ↓
         Railway Face API  (DeepFace + FaceNet-512)
              ↓ fallback if Face API unreachable
         GPT-4o-mini visual comparison
```

## Model accuracy

| Model | Speed | Accuracy |
|-------|-------|----------|
| Facenet512 | Fast | ~99.6% LFW |
| ArcFace | Fast | ~99.8% LFW |
| VGG-Face | Slow | ~98.9% LFW |

Default is `Facenet512` — good balance of speed and accuracy for Railway CPU tier.
