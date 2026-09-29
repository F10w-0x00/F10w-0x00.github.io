function setupCopyCode(root) {
  var container = root || document;
  var codeBlocks = container.querySelectorAll('div.highlighter-rouge');
  codeBlocks.forEach(function (block) {
    if (block.querySelector('.copy-code-button')) return; // 避免重复添加

    var button = document.createElement('button');
    button.className = 'copy-code-button';
    button.type = 'button';
    button.innerText = 'Copy';

    button.addEventListener('click', function () {
      var code = block.querySelector('code');
      var text = code ? code.innerText : block.innerText;

      navigator.clipboard.writeText(text).then(function () {
        button.innerText = 'Copied!';
        button.classList.add('copied');
        setTimeout(function () {
          button.innerText = 'Copy';
          button.classList.remove('copied');
        }, 2000);
      });
    });

    block.appendChild(button);
  });
}

window.setupCopyCode = setupCopyCode;

document.addEventListener('DOMContentLoaded', function () {
  setupCopyCode(document);
});
