Template.dugmeNav.events({
  'click .yardim'(e,t) {
    e.preventDefault();
    Session.set('yardimGoster', true);
    Session.set('yardimCtx', t.data.ctx);
  },
  'click .cikis'(e,t) {
    Meteor.logout();
  }
});
