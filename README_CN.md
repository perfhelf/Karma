
<div align="center">
  <img src="public/logo.svg" width="120" height="120" alt="Kunhou Karma Logo" />
  <h1>鲲侯·Karma</h1>
  <p>
    <b>掌控财富命运的记账系统 | The Ledger of Destiny</b>
  </p>
  <p>
    <a href="README.md">English</a> | <b>简体中文</b>
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
> **🔴 在线体验 (Live Demo)**: [https://karma.xuebz.com/](https://karma.xuebz.com/)
>
> 点击登录页的 **"👋 访客试用 (Guest Demo)"** 按钮，即可进入拥有 2 年模拟数据的完整演示环境。
> *注：访客数据仅保存在您的浏览器内存中，刷新页面即重置，安全无痕，不会影响主数据库。*

## 📖 序言：清洁算法与命运账本

**鲲侯·Karma** 不仅仅是一个记账工具，它是 **"清洁算法" (Clean Algorithm)** 哲学的终极实践。

在数字时代，数据即命运。混乱的账目导致混乱的人生，而在删除时留下的"数据残渣"，更是对系统洁癖的亵渎。**Karma** 专为那些对数据主权、隐私和系统完整性有着极致追求的 "开源隐士" 打磨。

> "凡是不能被彻底删除的，都是负债。" —— *清洁算法哲学*

---

## ✨ 核心特性

### 1. 🧹 清洁算法 (The Clean Algorithm)
这是 Karma 的灵魂所在。我们实现了一套严格的 **原子化删除协议 (Atomic Deletion Protocol)**。
*   **斩草除根**: 当您删除一笔交易时，系统不仅是擦除数据库记录，而是触发同步销毁机制。
*   **全链路净化**: 系统会首先定位并从 Cloudflare R2 对象存储中物理粉碎所有关联附件（发票、合同、凭证），确认无误后，才会允许数据库执行记录移除。
*   **零残留**: 拒绝 "软删除"，拒绝 "孤儿文件"，确保存储空间的绝对纯净。

### 2. 🗄️ 许可式插槽系统 (Permission Slot System)
我们重新发明了附件管理交互，拒绝平庸的拖拽区。
*   **10个独立像限**: 提供最多 10 个独立的附件插槽，每个插槽都是一个独立的数据像限。
*   **双因交互模式**:
    *   **点击图标**: 优雅地唤起文件选择器。
    *   **点击空白**: 将焦点汇聚于此，直接 `Ctrl+V` 粘贴剪贴板中的图片或文件，如手术刀般精准。
*   **动态扩展**: 始于极简，按需增加，从不因为未使用的功能占用您的视觉带宽。

### 3. ☁️ 现代分布式解耦架构 (Decoupled Storage)
遵循最先进的分布式系统设计原则，实现元数据与重资产的物理隔离。
*   **Supabase (PostgreSQL)**: 负责高并发的元数据读写、实时订阅与金融级的数据强一致性。
*   **Cloudflare R2**: 承担重资产（文件）的托管，利用其遍布全球的边缘网络提供零出口费用的极速访问。
*   **安全屏障**: 数据库仅通过加密键值索引文件，即便数据库泄露，源文件依然处于隔离保护之中。

---

## 🛠️ 技术栈演练

本项目采用 2026 年现代 Web 开发的黄金标准构建：

*   **前端核心**: [Vue 3](https://vuejs.org/) (Composition API) + [Vite](https://vitejs.dev/)
*   **类型系统**: [TypeScript](https://www.typescriptlang.org/) (全链路类型安全)
*   **视觉语言**: [TailwindCSS](https://tailwindcss.com/) (原子化设计)
*   **后端即服务 (BaaS)**: [Supabase](https://supabase.com/)
*   **对象存储**: [Cloudflare R2](https://www.cloudflare.com/products/r2/) (基于 AWS S3 SDK)
*   **部署托管**: [Vercel](https://vercel.com/)

---

## 🚀 部署与安装

如果您也是一位极客，想要私有化部署这套系统：

### 1. 克隆命运之书
```bash
git clone https://github.com/perfhelf/Karma.git
cd Karma
```

### 2. 注入能量（安装依赖）
```bash
npm install
```

### 3. 配置秘钥环境
在根目录创建 `.env` 文件，填入您的云端凭证：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
R2_ACCOUNT_ID=your_r2_id
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=your_bucket_name
```

### 4. 启动观测站
```bash
npm run dev
```

---

<p align="center">
  Built with obsession by <b>perfhelf</b>
</p>
