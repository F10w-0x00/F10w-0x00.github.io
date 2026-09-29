document.addEventListener('DOMContentLoaded', function () {
  var wrapper = document.querySelector('.post-layout-wrapper');
  var panel = document.getElementById('accompany-panel');
  var panelTitle = document.getElementById('accompany-panel-title');
  var panelBody = document.getElementById('accompany-panel-body');
  var closeBtn = document.getElementById('accompany-close-btn');
  var backdrop = document.getElementById('accompany-backdrop');

  if (!wrapper || !panel || !panelBody) return;

  function closePanel() {
    panel.classList.remove('open');
    wrapper.classList.remove('split-view-active');
    if (backdrop) backdrop.classList.remove('active');
  }

  function openPanel(url, titleText) {
    if (panelTitle) panelTitle.innerText = titleText || '伴随笔记';
    panelBody.innerHTML = '<div style="color:#64748b; padding:2rem 0; text-align:center;">正在加载伴随笔记...</div>';
    
    panel.classList.add('open');
    wrapper.classList.add('split-view-active');
    if (backdrop) backdrop.classList.add('active');

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('网络请求失败');
        return res.text();
      })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var content = doc.querySelector('.accompany-raw-content') || doc.querySelector('.post-content') || doc.body;

        panelBody.innerHTML = content.innerHTML;

        // 如果包含数学公式，自动执行 MathJax 渲染
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise([panelBody]);
        }

        // 如果包含代码块，自动挂载复制按钮
        if (typeof window.setupCopyCode === 'function') {
          window.setupCopyCode(panelBody);
        }
      })
      .catch(function (err) {
        panelBody.innerHTML = '<div style="color:#dc2626; padding:1.5rem 0;">⚠️ 伴随文件加载失败，请检查路径。</div>';
      });
  }

  // 监听全页面点击，自动捕获伴随链接
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href) return;

    // 方案 A：包含 /accompany/ 或以 .md 结尾或带 class="accompany-link"
    var isAccompany = href.indexOf('/accompany/') !== -1 ||
                      href.endsWith('.md') ||
                      link.classList.contains('accompany-link');

    if (isAccompany) {
      e.preventDefault();
      openPanel(href, link.innerText.trim());
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closePanel);
  if (backdrop) backdrop.addEventListener('click', closePanel);

  // 按 Esc 键也可便捷关闭分屏
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      closePanel();
    }
  });
});
