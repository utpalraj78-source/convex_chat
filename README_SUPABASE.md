
# Supabase Migration Guide

Your project has been migrated from MongoDB to Supabase (PostgreSQL). Follow these steps to run it locally.

## 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign up.
2. Create a new project.
3. Once created, go to **Project Settings** -> **API**.
4. Copy the **Project URL** and **anon / public** Key.

## 2. Configure Environment Variables
1. Open `backend/.env` (create it if it doesn't exist).
2. Add the following lines:

```env
SUPABASE_URL=your_project_url_here
SUPABASE_KEY=your_anon_key_here
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 3. Run Database Migration
1. In your Supabase Dashboard, go to **SQL Editor**.
2. Click **New Query**.
3. Open the file `backend/schema.sql` in this project.
4. Copy the entire content and paste it into the Supabase SQL Editor.
5. Click **Run**.

## 4. Run the Project
Now you can run the project locally:

```bash
npm run dev
```

The backend will connect to Supabase automatically.
