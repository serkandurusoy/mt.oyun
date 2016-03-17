Template.yardimEkrani.helpers({
  ctx: function() {
    return Session.get('yardimCtx');
  }
});

Template.yardimEkrani.events({
  'click': function() {
    M.L.clearSessionVariable('yardimCtx');
    M.L.clearSessionVariable('yardimGoster');
  }
});
