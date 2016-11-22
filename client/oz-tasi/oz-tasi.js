import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

import { M } from 'meteor/m:lib-core';

import './oz-tasi.html';

Template.ozTasi.onCreated(function() {
  if (M.C.Karakterler.find().count() > 0) {
    let karakterArray = [];
    Tracker.nonreactive(() => {
      karakterArray = M.C.Karakterler.find({id_: {$ne: Meteor.user().karakter}, cinsiyet: Meteor.user().cinsiyet }, {reactive: false})
        .map(karakter => karakter._id);
      if (Meteor.user().karakter && Meteor.user().karakter !== 'default') {
        karakterArray.unshift(Meteor.user().karakter);
      }
    });
    this.karakterIterator = M.L.cyclicIterator(karakterArray);
  }
});

Template.ozTasi.events({
  'click .sol'(e,t) {
    e.preventDefault();
    Meteor.call('setKarakter', t.karakterIterator.getNext());
  },
  'click .sag'(e,t) {
    e.preventDefault();
    Meteor.call('setKarakter', t.karakterIterator.getPrevious());
  }
});

Template.ozTasi.helpers({
  sonMuhur() {
    return ReactiveMethod.call('sonMuhur');
  },
  birUstRutbePuani() {
    const userPuan = Meteor.user() && Meteor.user().puan ? Meteor.user().puan : 0;

    if (userPuan >= 95) {
      return 100;
    }

    if (userPuan >= 90) {
      return 95;
    }

    if (userPuan >= 86) {
      return 90;
    }

    if (userPuan >= 82) {
      return 86;
    }

    if (userPuan >= 78) {
      return 82;
    }

    if (userPuan >= 74) {
      return 78;
    }

    if (userPuan >= 70) {
      return 74;
    }

    if (userPuan >= 50) {
      return 70;
    }

    return 50;

  }
});
