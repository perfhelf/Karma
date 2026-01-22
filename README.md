
<div align="center">
  <img src="public/logo.svg" width="120" height="120" alt="Kunhou Karma Logo" />
  <h1>鲲侯·Karma</h1>
  <p>
    <b>The Ledger of Destiny. / 掌控财富命运的记账系统。</b>
  </p>
  <p>
    <b>English</b> | <a href="README_CN.md">简体中文</a>
  </p>
  <p>
    <a href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js" alt="Vue 3" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" /></a>
    <a href="https://www.cloudflare.com/products/r2/"><img src="https://img.shields.io/badge/Cloudflare-R2_Storage-F38020?style=flat-square&logo=cloudflare" alt="Cloudflare R2" /></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT" /></a>
  </p>
</div>

---

> [!IMPORTANT]
> **🔴 Live Demo**: [https://karma.xuebz.com/](https://karma.xuebz.com/)
>
> Experience the **"Guest Demo"** mode with pre-populated data (2024-2026).
> No signup required. Just click **"👋 Guest Demo"** on the login page.
> *Note: Guest data is stored locally in your browser memory and resets on refresh. It does not touch the real database.*

## 📖 Introduction (简介)

**Kunhou Karma** is not just a bookkeeping tool; it is a **"Personal Micro-SaaS Financial System"** designed for the modern era.

Most finance apps are either too simple (manual input only) or too complex (requiring Docker/Servers). Karma strikes the perfect balance by leveraging a **Serverless + Edge** architecture. It delivers enterprise-grade security, infinite scalability, and zero maintenance cost for individual users.

**鲲侯·Karma** 不仅仅是一个记账工具，它是一套现代化的 **"个人微型金融 SaaS 系统"**。
大多数记账软件要么太简单（只是个 Excel），要么太重（需要自己维护服务器 docker）。Karma 通过 **Serverless + Edge** 架构实现了完美的平衡：企业级的安全与高可用，同时保持**零运维成本**。

## 🌟 Why Karma? (核心亮点)

### 1. Zero Maintenance Architecture (零运维架构)
Karma runs entirely on the Edge. No servers to patch. No disks to fill up.
- **Compute**: Vercel Edge Functions (Global CDN Distribution)
- **Database**: Supabase (PostgreSQL with RLS Security)
- **Assets**: Cloudflare R2 (AWS S3 Compatible, Zero Egress Fees)

### 2. The Cleaning Algorithm (清洁算法) ✨
We take "Data Ownership" seriously. Deleting an account isn't just a flag update.
- **Physical Destruction**: When you delete a transaction or account, Karma recursively calls Cloudflare R2 to physically destroy every attached receipt image.
- **No Residuals**: We ensure no "Orphan Data" is ever left behind in your storage buckets.

### 3. Advanced Security & Isolation (分布式风控) 🛡️
- **Dual-Factor Zombie Check**:
  Your account activity is tracked via a distributed "Heartbeat" system. Even if you don't login to the main dashboard, your activity in Karma sends survival signals to prevent your account from being flagged as inactive. (Karma ↔ Sub-App Heartbeat Sync).
- **Scope Lockdown**:
  We distinguish between `Local Logout` (clear current session) and `Global Logout` (destroy all sessions), preventing accidental cross-app session termination.

### 4. Decoupled Authorization (权限解耦) 🔐
Karma operates on a strictly isolated authorization table (`karma_authorized_users`). Your status in Karma is completely independent of other apps in the ecosystem (like user matrix), ensuring true multi-tenant isolation even within a shared database architecture.

## ⚡ Functional Features (功能特性)

*   **Multi-Currency Engine**: Supports CNY, USD, EUR, GBP, JPY, HKD, AUD, MYR, THB, SGD with auto-updating exchange rates.
*   **50-Year Visualization**: Dashboard supports a timeline from 2020 to 2070.
*   **Permission Slot System**: A reimagined, 10-slot dedicated attachment interface for power users.
*   **Admin God View**: Built-in specialized administration panel for user management.

## 🛠️ Tech Stack (技术栈)

This project is a textbook example of the "Golden Triangle" stack:

- **Frontend**: Vue 3 (Composition API), Vite, TailwindCSS v4
- **Language**: TypeScript (Strict Mode)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Storage**: Cloudflare R2 (S3 Protocol)
- **Deployment**: Vercel

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/perfhelf/Karma.git
   cd Karma
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   R2_ACCOUNT_ID=your_r2_id
   R2_ACCESS_KEY_ID=your_r2_key
   R2_SECRET_ACCESS_KEY=your_r2_secret
   R2_BUCKET_NAME=your_bucket_name
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <b>perfhelf</b> (Xuebz Design)
</p>
