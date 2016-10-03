Template.muhurBilgi.onCreated(function() {
  var template = this;

  template.autorun(function() {
    var devamEdenSinavVar = Session.get('devamEdenSinavVar');
    var sinavId = FlowRouter.getParam('_id');

    if (devamEdenSinavVar !== sinavId) {
      template.subscribe('sinav', sinavId, moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate());
    }
  })

});

Template.muhurBilgi.helpers({
  sinav: function() {
    return M.C.Sinavlar.findOne({
      _id: FlowRouter.getParam('_id'),
      aktif: true,
      iptal: false,
      kilitli: true,
      muhur: {$exists: true},
      egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
      acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
    });
  },
  kapanisZamaniFormat: function() {
    var sinav = M.C.Sinavlar.findOne({
      _id: FlowRouter.getParam('_id'),
      aktif: true,
      iptal: false,
      kilitli: true,
      muhur: {$exists: true},
      egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
      acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
    });
    if (moment().isAfter(sinav.kapanisZamani)) {
      return 'sinavKapandi'
    } else if (moment().add(24, 'hours').isAfter(sinav.kapanisZamani)) {
      return 'sinavYaklasti';
    } else {
      return 'DD MMMM YYYY HH:mm';
    }
  },
  yanitGorulebilir: function() {
    var devamEdenSinavVar = Session.get('devamEdenSinavVar');
    var sinavId = FlowRouter.getParam('_id');
    var user = Meteor.user();

    if (devamEdenSinavVar) {
      return false;
    }

    if (!user) {
      return false;
    }

    var sinav = M.C.Sinavlar.findOne({
      _id: sinavId,
      aktif: true,
      iptal: false,
      kilitli: true,
      muhur: {$exists: true},
      egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
      acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
    });

    if (!sinav) {
      return false;
    }

    var buSinavAlinmis = user && M.C.SinavKagitlari.findOne({
        ogrenci: user._id,
        kurum: user.kurum,
        sinif: user.sinif,
        egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
        sinav: sinavId,
        bitirmeZamani: {$exists: true},
        ogrenciSinavaGirdi: true
      });

    if (buSinavAlinmis) {
      if (_.contains(['alistirma','konuTarama'], sinav.tip)) {
        return true;
      } else {
        return moment(sinav.yanitlarAcilmaZamani).isBefore(TimeSync.serverTime(null, 5 * 60 * 1000));
      }
    } else {
      if (_.contains(['alistirma','konuTarama'], sinav.tip)) {
        return moment(sinav.kapanisZamani).isBefore(TimeSync.serverTime(null, 5 * 60 * 1000));
      } else {
        return moment(sinav.yanitlarAcilmaZamani).isBefore(TimeSync.serverTime(null, 5 * 60 * 1000));
      }
    }

  },
  sinavaBaslanabilir: function() {
    var devamEdenSinavVar = Session.get('devamEdenSinavVar');
    var sinavId = FlowRouter.getParam('_id');
    var user = Meteor.user();

    if (devamEdenSinavVar) {
      return false;
    }

    if (!user) {
      return false;
    }

    var sinav = M.C.Sinavlar.findOne({
      $and: [
        {
          _id: sinavId,
          aktif: true,
          iptal: false,
          kilitli: true,
          muhur: {$exists: true},
          egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
          acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
        },
        {
          $or: [
            {
              tip: {$ne: 'canli'},
              kapanisZamani: {$gt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
            },
            {
              tip: 'canli',
              kapanisZamani: {$gt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()},
              canliStatus: {$ne: 'completed'}
            }
          ]
        }
      ]
    });

    if (!sinav) {
      return false;
    }

    var buSinavAlinmis = user && M.C.SinavKagitlari.findOne({
        ogrenci: user._id,
        kurum: user.kurum,
        sinif: user.sinif,
        egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
        sinav: sinavId
      });

    if (buSinavAlinmis) {
      return false;
    }

    return true;

  },
  sinavDevamEdiyor: function() {
    var devamEdenSinavVar = Session.get('devamEdenSinavVar');
    var sinavId = FlowRouter.getParam('_id');
    return devamEdenSinavVar === sinavId;
  },
  baskaSinavDevamEdiyor: function() {
    var devamEdenSinavVar = Session.get('devamEdenSinavVar');
    var sinavId = FlowRouter.getParam('_id');
    return devamEdenSinavVar && devamEdenSinavVar !== sinavId && M.C.Muhurler.findOne({_id: M.C.Sinavlar.findOne({_id: devamEdenSinavVar}).muhur}).isim;
  },
  sinavAlinmamisAmaBaskaSinavDevamEdiyor: function() {
    var devamEdenSinavVar = Session.get('devamEdenSinavVar');
    var sinavId = FlowRouter.getParam('_id');
    var user = Meteor.user();

    if (!user) {
      return false;
    }

    var buSinavAlinmis = user && M.C.SinavKagitlari.findOne({
        ogrenci: user._id,
        kurum: user.kurum,
        sinif: user.sinif,
        egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
        sinav: sinavId
      });

    if (buSinavAlinmis) {
      return false;
    }

    if (devamEdenSinavVar) {
      var sinav = M.C.Sinavlar.findOne({
        $and: [
          {
            _id: sinavId,
            aktif: true,
            iptal: false,
            kilitli: true,
            muhur: {$exists: true},
            egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
            acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
          },
          {
            $or: [
              {
                tip: {$ne: 'canli'},
                kapanisZamani: {$gt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
              },
              {
                tip: 'canli',
                kapanisZamani: {$gt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()},
                canliStatus: {$ne: 'completed'}
              }
            ]
          }
        ]
      });

      if (!sinav) {
        return false;
      }

      if (sinav && sinavId === devamEdenSinavVar) {
        return false;
      }

      if (sinav && sinavId !== devamEdenSinavVar) {
        return M.C.Muhurler.findOne({_id: M.C.Sinavlar.findOne({_id: devamEdenSinavVar}).muhur}).isim;
      }

    } else {
      return false;
    }

  }
});

Template.muhurBilgi.events({
  'click [data-trigger="geriDon"]': function(e,t) {
    Session.set('detayindanDonulenSinavId', FlowRouter.getParam('_id'));
    FlowRouter.go('muhurTasi');
  },
  'click [data-trigger="sinavaBasla"]': function(e,t) {
    BlazeLayout.render('layout', { main: 'sinavaBasla' });
  },
  'click [data-trigger="sinavaDevam"]': function(e,t) {
    Session.set('sinavGoster', true);
  },
  'click [data-trigger="sinavYanitGoster"]': function(e,t) {
    Session.set('sinavYanitGoster', FlowRouter.getParam('_id'));
  }
});

Template.sinavaBasla.onCreated(function() {
  var template = this;
  template.autorun(function() {
    var sinavId = FlowRouter.getParam('_id');
    template.subscribe('sinav', sinavId, moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate());
  })

});

Template.sinavaBasla.helpers({
  sinav: function() {
    return M.C.Sinavlar.findOne({
      $and: [
        {
          _id: FlowRouter.getParam('_id'),
          aktif: true,
          iptal: false,
          kilitli: true,
          muhur: {$exists: true},
          egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
          acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
        },
        {
          $or: [
            {
              tip: {$ne: 'canli'},
              kapanisZamani: {$gt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
            },
            {
              tip: 'canli',
              kapanisZamani: {$gt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()},
              canliStatus: {$ne: 'completed'}
            }
          ]
        }
      ]
    });
  }
});

Template.sinavaBasla.events({
  'click .baslamaktanVazgec': function() {
    BlazeLayout.render('layout', { main: 'muhurBilgi' });
  },
  'click .baslamayiOnayla': function() {
    BlazeLayout.render('layout', { main: 'muhurBilgi' });
    var sinavId = FlowRouter.getParam('_id');
    if (sinavId) {
      Meteor.call('sinavaBasla', {sinavId: sinavId}, function(err,res) {
        if (res) {
          Session.set('sinavGoster',true);
        }
      });
    }
  }
});
