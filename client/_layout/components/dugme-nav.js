Template.dugmeNav.events({
  'click .yardim': function(e,t) {
    e.preventDefault();
    Session.set('yardimGoster', true);
    Session.set('yardimCtx', t.data.ctx);
  },
  'click .cikis': function(e,t) {
    Meteor.logout();
  }
});
