Template.boyTasi.onCreated(function() {
  var template = this;
  template.filtre = new ReactiveVar('sube');
  template.ara = new ReactiveVar('');
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
  filtre: function() {
    var filtre = Template.instance().filtre.get();
    var user = Meteor.user();
    if (user) {
      var sinif = _.findWhere(M.E.SinifObjects, {name: user.sinif}).kisa;
      if (filtre === 'sube') {
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
    var filtre = Template.instance().filtre.get();
    var ara = Template.instance().ara.get();
    var saklanacaklar = [];
    var searchArray = [];

    if (filtre === 'sube') {
      M.C.Users.find({
        $or: [
          {sinif: {$ne: user.sinif}},
          {sube: {$ne: user.sube}}
        ]
      }).forEach(function(u) {
        saklanacaklar.push(u._id);
      })
    }

    if (ara !== '') {
      searchArray = _.flatten(_.map(M.L.LatinizeLower(M.L.Trim(ara)).split(' '), function(text) {
        var regexp = new RegExp(text.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&"),"i");
        return [{ 'searchSource.name': regexp },{ 'searchSource.lastName': regexp }];
      }));

      M.C.Users.find({
        _id: {$nin: M.C.Users.find({
            $or: searchArray
          }).map(function(u) {
            return u._id;
          })
        }
      }).forEach(function(u) {
        saklanacaklar.push(u._id);
      })

    }

    return _.contains(saklanacaklar, userId);

  }
});

Template.boyTasi.events({
  'click .filtrele': function(e,t) {
    e.preventDefault();
    var filtre = t.filtre.get();
    if (filtre === 'sinif') {
      t.filtre.set('sube');
    } else {
      t.filtre.set('sinif');
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
  'submit form, blur #ara, input #ara': function(e,t) {
    e.preventDefault();
    var ara = M.L.Trim(t.$('[name="ara"]').val());
    check(ara, String);
    t.ara.set(ara);
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
  'click .temizle': function(e,t) {
    e.preventDefault();
    t.$('[name="ara"]').val('');
    t.ara.set('');
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
