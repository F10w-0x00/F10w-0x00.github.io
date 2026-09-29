document.addEventListener('DOMContentLoaded', function () {
  var pills = document.querySelectorAll('.tag-pill');
  var cards = document.querySelectorAll('.blog-post-card');

  if (!pills.length || !cards.length) return;

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      var tag = this.getAttribute('data-tag');

      pills.forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');

      cards.forEach(function (card) {
        var cardTags = (card.getAttribute('data-tags') || '').split(',');
        // 去除空格
        cardTags = cardTags.map(function(t) { return t.trim(); });

        if (tag === 'all' || cardTags.indexOf(tag) !== -1) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
});
