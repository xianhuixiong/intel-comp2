# Antitrust International Cooperation Database (Prototype v2)

A **deployable static web prototype** for the
“反垄断国际交流合作数据库模块” (International Exchange & Cooperation Database module).

This version aligns the information architecture to the 2026 construction plan:

- 国际合作法律文件库
- 域外法律法规库
- 执法机构信息库（含 OECD / APEC / UNCTAD / ICN 等国际组织概览）
- 政策动态监测
- 重大案例库（含案例对比）
- 数据统计与分析（基于数据集的图表/报表/导出）
- 专题研究与参考（含术语表）

The prototype is **front-end only** and requires no backend.
All sample records include **traceable public source links**.

---

## Deploy (Vercel)

1. Push this folder to GitHub.
2. In Vercel, choose **Framework: Other**.
3. Build Command: **None**
4. Output Directory: **./ (root)**
5. Deploy.

---

## Local Preview

Because ES modules are used, preview via a local web server:

```bash
python3 -m http.server 5173
```

Then open:

- `http://localhost:5173`

---

## Keyboard Shortcuts

- `Ctrl` + `K` : Focus global search
- `/` : Focus global search

---

## Data

All demo data lives in:

- `assets/data/data.js`

You can replace it with a real database/API later without changing the UX structure.

---

## Notes

- This prototype focuses on **IA/UE/UI**, routing, metadata standards, and cross-linking.
- Production delivery should add: authentication & RBAC, editorial workflow,全文检索引擎,
  automated monitoring pipelines, translation review workflow, and audit logs.
