import { Template } from 'meteor/templating';

import { moment } from 'meteor/momentjs:moment';
import { TimeSync } from 'meteor/mizzao:timesync';

import './ana-ekran.html';

Template.anaEkran.onCreated(function() {
  this.autorun(() => {
    this.subscribe('girilmemisSinavVar', moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate());
  })
});
