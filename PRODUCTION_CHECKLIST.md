# Convex Chat - Production Checklist

To successfully deploy Convex Chat to a production environment (like Azure, Heroku, or AWS), please follow these steps:

## 1. Supabase Storage Setup (IMPORTANT)
We have migrated file uploads to Supabase Storage to ensure they are not lost when the server restarts.
- **Log in to Supabase Dashboard.**
- Go to **Storage** in the sidebar.
- Create two new buckets:
  1. `messages` (Set to **Public**)
  2. `avatars` (Set to **Public**)
- Ensure the **Policies** allow authenticated users to upload and anyone to read (if you want public access).

## 2. Environment Variables
Ensure the following variables are set in your production hosting environment (e.g., Azure App Service Configuration):
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_KEY`: Your Supabase API key (service_role key is recommended for backend).
- `JWT_SECRET`: A long, random string for securing sessions.
- `EMAIL_USER`: Your Gmail/SMTP email address.
- `EMAIL_PASS`: Your Gmail App Password (not your regular password).
- `CLIENT_URL`: The URL where your frontend is hosted (e.g., `https://your-app.azurestaticapps.net`).
- `NODE_ENV`: Set to `production`.

## 3. WebRTC TURN Server
For video/voice calls to work across different networks (like office Wi-Fi or 4G/5G):
- Sign up for a TURN provider like [Twilio](https://www.twilio.com/stun-turn) or [Metered.ca](https://www.metered.ca/).
- Open `frontend/src/VideoCallManager.js`.
- Add your TURN server credentials to the `iceServers` array:
```javascript
iceServers: [
  { urls: "stun:stun.l.google.com:19302" },
  { 
    urls: "turn:your-turn-server.com", 
    username: "your-username", 
    credential: "your-password" 
  }
]
```

## 4. Socket.IO Scaling (Optional)
If you plan to run multiple server instances (horizontal scaling):
- Install `redis` and `@socket.io/redis-adapter`.
- Update `backend/socket.js` to use the Redis adapter.

## 5. Deployment
- **Frontend**: Build using `npm run build` and deploy the `dist` folder to a static hosting service (Azure Static Web Apps, Vercel, Netlify).
- **Backend**: Deploy the `backend` folder to a Node.js hosting service (Azure App Service, Heroku, Render).
