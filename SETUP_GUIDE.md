# 🚀 Derivix Production Setup Guide

This guide provides step-by-step instructions to deploy Derivix from the repository to a live production environment.

## 🏗️ 1. Backend Setup (Supabase)
Derivix uses **Supabase** for Authentication, Database (Postgres), and Real-time updates.

1. **Create Project**: Go to [supabase.com](https://supabase.com) and create a new project.
2. **Apply Schema**: 
   - Navigate to the **SQL Editor** in the Supabase dashboard.
   - Copy the contents of `DATABASE_SCHEMA.md` and execute them as a SQL script to create the tables, relationships, and RLS policies.
3. **Configure Auth**:
   - Go to **Authentication** $\rightarrow$ **Providers**.
   - Enable **Email** (Confirm email: On).
   - Configure **Google**, **Facebook**, and **X (Twitter)** by entering the Client IDs and Secrets obtained from their respective developer consoles.
4. **API Keys**:
   - Go to **Project Settings** $\rightarrow$ **API**.
   - Copy the `Project URL` and `anon public key`.

## 💻 2. Frontend Configuration
1. **Clone Repository**:
   ```bash
   git clone https://github.com/your-org/derivix.git
   cd derivix
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   - Copy `.env.example` to `.env`.
   - Fill in the Supabase keys:
     ```env
     VITE_SUPABASE_URL=your_project_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

## 🚢 3. Deployment
1. **Build Project**:
   ```bash
   npm run build
   ```
2. **Host**: Deploy the `dist/` folder to your preferred host (Vercel, Netlify, or AWS S3/CloudFront).
3. **Domain**: Configure your DNS settings to point to your hosting provider.

## 🛠️ Maintenance
- **Backups**: Supabase provides automatic daily backups.
- **Logs**: Monitor the **Authentication** and **Database** logs in the Supabase dashboard to track user activity and system health.
