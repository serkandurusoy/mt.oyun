Template.boyTasi.onCreated(function() {
  var template = this;
  template.filtreSube = new ReactiveVar('sube');
  template.filtreRutbe = new ReactiveVar({min: -1});
  template.autorun(function() {
    var userId = Meteor.userId();
    if (userId) {
      template.subscribe('sinifArkadaslarim', function() {
        Tracker.afterFlush(function() {
          var scrollPos = 0;
          var $userCard = $('#'+userId);
          if (!!$userCard.length) {
            scrollPos = parseInt($userCard.position().top) - 216;
          }
          template.$('.boyTasiWrapper').animate({
            scrollTop: scrollPos
          }, 0);
        })
      });
    }
  })
});

Template.boyTasi.helpers({
  filtreSube: function() {
    var filtreSube = Template.instance().filtreSube.get();
    var user = Meteor.user();
    if (user) {
      var sinif = _.findWhere(M.E.SinifObjects, {name: user.sinif}).kisa;
      if (filtreSube === 'sube') {
        return sinif + ' ' + user.sube;
      } else {
        return sinif;
      }
    }
    return false;
  },
  sinifArkadaslari: function() {
    var user = Meteor.user();
    var sinifArkadaslariCursor =  user && M.C.Users.find({sinif: user.sinif, puan: {$gte: 70}}, {sort: {puan: -1, dogumTarihi: -1, nameCollate: 1, lastNameCollate: 1, cinsiyet: -1}});
    return sinifArkadaslariCursor && sinifArkadaslariCursor.count() && sinifArkadaslariCursor;
  },
  sakla: function(userId) {
    var user = Meteor.user();
    var filtreSube = Template.instance().filtreSube.get();
    var filtreRutbe = Template.instance().filtreRutbe.get();
    var saklanacaklar = [];

    if (filtreSube === 'sube') {
      M.C.Users.find({
        $or: [
          {sinif: {$ne: user.sinif}},
          {sube: {$ne: user.sube}}
        ]
      }).forEach(function(u) {
        saklanacaklar.push(u._id);
      })
    }

    if (filtreRutbe.min > -1) {
      M.C.Users.find({
        $or: [
          {puan: {$lt: filtreRutbe.min}},
          {puan: {$gte: filtreRutbe.max}}
        ]
      }).forEach(function(u) {
        saklanacaklar.push(u._id);
      })
    }

    return _.contains(saklanacaklar, userId);

  }
});

Template.boyTasi.events({
  'click .filtreleSube': function(e,t) {
    e.preventDefault();
    var filtreSube = t.filtreSube.get();
    if (filtreSube === 'sinif') {
      t.filtreSube.set('sube');
    } else {
      t.filtreSube.set('sinif');
    }
    Tracker.afterFlush(function() {
      var $container = $('.boyTasiWrapper');
      var $userCard = $('#'+Meteor.userId());
      $container.animate({
        scrollTop: 0
      }, 0);
      if (!!$userCard.length && parseInt($userCard.position().top) > 216) {
        $container.animate({
          scrollTop: parseInt($userCard.position().top) - 216
        }, 0);
      }
    })
  },
  'click .filtreleRutbe': function(e,t) {
    e.preventDefault();
    var filtreRutbe = t.filtreRutbe.get();

    var rutbeArray = [
      {min: -1},
      //{min: 0, max: 50},
      //{min: 50, max: 70},
      {min: 70, max: 74},
      {min: 74, max: 78},
      {min: 78, max: 82},
      {min: 82, max: 86},
      {min: 86, max: 90},
      {min: 90, max: 95},
      {min: 95, max: 101}
    ];

    var startAt = rutbeArray.findIndex(function(rutbe) {return rutbe.min === filtreRutbe.min});

    t.filtreRutbe.set(M.L.cyclicIterator(rutbeArray, startAt).getNext());

    Tracker.afterFlush(function() {
      var $container = $('.boyTasiWrapper');
      var $userCard = $('#'+Meteor.userId());
      $container.animate({
        scrollTop: 0
      }, 0);
      if (!!$userCard.length && parseInt($userCard.position().top) > 216) {
        $container.animate({
          scrollTop: parseInt($userCard.position().top) - 216
        }, 0);
      }
    })
  },
  'click .yukariya': function(e,t) {
    t.$('.boyTasiWrapper').animate({
      scrollTop: '-=216'
    }, 0);
  },
  'click .asagiya': function(e,t) {
    t.$('.boyTasiWrapper').animate({
      scrollTop: '+=216'
    }, 0);
  }
});
