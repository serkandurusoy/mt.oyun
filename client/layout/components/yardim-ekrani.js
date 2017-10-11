import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import { M } from 'meteor/m:lib-core';

import './yardim-ekrani.html';

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
