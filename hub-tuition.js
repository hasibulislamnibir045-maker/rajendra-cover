/* ===== HUB-TUITION :: Redirect layer =====
   Old in-site tuition modal replaced by the full Tuition Marketplace.
   Main-site tuition tile now opens tuition.html (new marketplace SPA). */
(function () {
  var TUITION_URL = 'tuition.html';

  /* Registry entry: main site (VW loader) tuition tile → redirect */
  if (window.VW) {
    VW.tuition = ['🎓 Tuition Hub', '<p class="hub-empty">টিউশন মার্কেটপ্লেসে যাচ্ছি…</p>', function () {
      location.href = TUITION_URL;
    }];
  }

  /* Legacy API back-compat: if anything still calls window.TU.*,
     send the user to the marketplace instead of crashing. */
  window.TU = {
    tab: function () { location.href = TUITION_URL; },
    form: function () { location.href = TUITION_URL + '#post'; },
    delT: function () { location.href = TUITION_URL + '#dashboard'; },
    delP: function () { location.href = TUITION_URL + '#dashboard'; }
  };
})();
