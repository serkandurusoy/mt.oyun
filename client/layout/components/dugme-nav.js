import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import './dugme-nav.html';

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
