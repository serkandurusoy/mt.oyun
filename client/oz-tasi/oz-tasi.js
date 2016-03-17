var cyclicIterator = function (array) {
  var index = 0;
  var copy = array.slice(0);

  return {
    getCurrent: function () {
      return copy[index];
    },

    getNext: function () {
      index = ++index % copy.length;
      return this.getCurrent();
    },

    getPrevious: function () {
      if(--index < 0) {
        index += copy.length;
      }
      return this.getCurrent();
    }
  };
};

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
    this.karakterIterator = cyclicIterator(karakterArray);
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
  }
});
