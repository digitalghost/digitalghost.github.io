/* ============================================================
   DigitalGhost 站点共享脚本
   主题切换 · 通用工具
   ============================================================ */

/** 切换明暗主题，并写入 localStorage */
function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

/** 恢复用户上次选择的主题 */
(function restoreTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

/** 页面加载时给当前导航项加高亮 */
(function markActiveNav() {
  const path = window.location.pathname.replace(/\/$/, '/index.html');
  const links = document.querySelectorAll('.nav-link');
  links.forEach(function (link) {
    const href = link.getAttribute('href');
    if (!href) return;
    const target = new URL(href, window.location.href).pathname.replace(/\/$/, '/index.html');
    if (target === path) link.classList.add('active');
  });
})();
