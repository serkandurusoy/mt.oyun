Template.yardimEkrani.helpers({
  ctx() {
    return Session.get('yardimCtx');
  }
});

Template.yardimEkrani.events({
  'click'() {
    M.L.clearSessionVariable('yardimCtx');
    M.L.clearSessionVariable('yardimGoster');
  }
});
