
<div align="center">
  <img src="public/logo.svg" width="120" height="120" alt="Kunhou Karma Logo" />
  <h1>鲲侯·Karma</h1>
  <p>
    <b>The Ledger of Destiny. / 掌控财富命运的记账系统。</b>
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

## 📖 Introduction (简介)

**鲲侯·Karma** (Kunhou Karma) represents a philosophical approach to personal finance management. It is not merely a tool for recording numbers, but a system designed with the **Clean Algorithm** philosophy—ensuring that your digital footprint is as precise and intentional as your financial decisions.

Built for those who demand **control**, **privacy**, and **integrity** in their data.

> "Data that cannot be cleanly deleted is a debt." — *The Philosophy of Clean Algorithms*

## ✨ Key Features (核心特性)

### 1. The Clean Algorithm (清洁算法)
Karma implements a strict **Atomic Deletion Protocol**. When a transaction is removed, the system ensures complete eradication of all associated assets across distributed systems.
- 🧹 **No Data Left Behind**: Deleting a record triggers a synchronous verify-and-destroy sequence for all attachments in Cloudflare R2.
- 🛡️ **Orphan Prevention**: Database records are only removed after successful verification of external asset deletion.

### 2. Decoupled Storage Architecture (数据解耦)
Following modern distributed system best practices, Karma separates metadata from heavy assets.
- **Supabase**: Handles relational data, real-time subscriptions, and authentication.
- **Cloudflare R2**: Provides high-performance, egress-free object storage for attachments (receipts, contracts, invoices).

### 3. Permission Slot System (精准归档)
A reimagined attachment interface designed for power users.
- **10 Independent Slots**: Unlike chaotic drag-and-drop zones, the Slot System offers 10 discrete, addressable units for attachments.
- **Dual-Mode Interaction**:
  - Click the **Icon** to browse files.
  - Click the **Space** to focus and `Ctrl+V` paste directly into a specific slot.

## 🛠️ Tech Stack (技术栈)

- **Frontend**: Vue 3, Vite, TailwindCSS
- **Language**: TypeScript
- **Backend (BaaS)**: Supabase
- **Storage**: Cloudflare R2 (via AWS S3 SDK)
- **Deployment**: Vercel

## 🚀 Getting Started

To run the Karma system locally:

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
   Create a `.env` file in the root directory with your credentials:
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
  Built with ❤️ by <b>perfhelf</b>
</p>
