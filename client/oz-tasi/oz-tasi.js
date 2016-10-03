Template.ozTasi.onCreated(function() {
  if (M.C.Karakterler.find().count() > 0) {
    var karakterArray = [];
    Tracker.nonreactive(function() {
      karakterArray = M.C.Karakterler.find({id_: {$ne: Meteor.user().karakter}, cinsiyet: Meteor.user().cinsiyet }, {reactive: false})
        .map(function(karakter) {
          return karakter._id;
        });
      if (Meteor.user().karakter && Meteor.user().karakter !== 'default') {
        karakterArray.unshift(Meteor.user().karakter);
      }
    });
    this.karakterIterator = M.L.cyclicIterator(karakterArray);
  }
});

Template.ozTasi.events({
  'click .sol': function(e,t) {
    e.preventDefault();
    Meteor.call('setKarakter', t.karakterIterator.getNext());
  },
  'click .sag': function(e,t) {
    e.preventDefault();
    Meteor.call('setKarakter', t.karakterIterator.getPrevious());
  }
});

Template.ozTasi.helpers({
  sonMuhur: function() {
    return ReactiveMethod.call('sonMuhur');
  },
  birUstRutbePuani: function() {
    var userPuan = Meteor.user() && Meteor.user().puan ? Meteor.user().puan : 0;

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
