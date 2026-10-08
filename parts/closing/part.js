(function () {
  // The figure is shown with bullets 1-3 and removed from bullet 4 on.
  Deck.widget("closing-statements", {
    steps: 6,
    enter: function (slide) {},
    leave: function (slide) {},
    step: function (slide, k, dir) {
      document.getElementById("closing-fig")
        .classList.toggle("closing-shown", k >= 1 && k <= 3);
    }
  });
})();
