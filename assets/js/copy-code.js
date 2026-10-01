function setupCodeBlocks(root) {
  var container = root || document;
  var codeBlocks = container.querySelectorAll('div.highlighter-rouge');

  codeBlocks.forEach(function (block) {
    if (block.querySelector('.code-header')) return; // 避免重复注入

    // 1. 提取语言标识（例如 language-scss -> SCSS）
    var lang = 'CODE';
    block.classList.forEach(function (cls) {
      if (cls.startsWith('language-')) {
        lang = cls.replace('language-', '').toUpperCase();
      }
    });

    // 2. 创建顶部工具栏
    var header = document.createElement('div');
    header.className = 'code-header';

    // 语言标签 (左侧)
    var langBadge = document.createElement('span');
    langBadge.className = 'code-lang';
    langBadge.innerText = lang;
    header.appendChild(langBadge);

    // 复制按钮 (右侧纯复制图标，无 @ 按钮)
    var copyBtn = document.createElement('button');
    copyBtn.className = 'copy-code-button';
    copyBtn.type = 'button';
    copyBtn.title = 'Copy code';
    copyBtn.setAttribute('aria-label', 'Copy code');
    copyBtn.innerHTML = `
      <svg class="copy-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <svg class="check-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    copyBtn.addEventListener('click', function () {
      var code = block.querySelector('code');
      var text = code ? code.innerText : block.innerText;

      navigator.clipboard.writeText(text).then(function () {
        var copyIcon = copyBtn.querySelector('.copy-icon');
        var checkIcon = copyBtn.querySelector('.check-icon');
        copyIcon.style.display = 'none';
        checkIcon.style.display = 'block';
        copyBtn.classList.add('copied');

        setTimeout(function () {
          copyIcon.style.display = 'block';
          checkIcon.style.display = 'none';
          copyBtn.classList.remove('copied');
        }, 2000);
      });
    });

    header.appendChild(copyBtn);

    // 将顶栏插入到代码块的最前面
    block.insertBefore(header, block.firstChild);
  });
}

window.setupCopyCode = setupCodeBlocks;

document.addEventListener('DOMContentLoaded', function () {
  setupCodeBlocks(document);
});