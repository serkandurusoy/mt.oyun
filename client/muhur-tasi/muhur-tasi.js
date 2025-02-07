Template.muhurTasi.onCreated(function() {
  var template = this;
  var scrollToSinav = function(sinavId) {
    if (!!sinavId) {
      Meteor.defer(function() {
        var $muhur = $('#'+sinavId);
        if (!!$muhur.length) {
          $('.muhurlerWrapper').animate({
            scrollTop: parseInt($muhur.position().top)
          }, 500, function() {
            var shakeImg = function() {
              var $muhurImg = $('#'+sinavId+' > img');
              var interval = 100;
              var distance = 10;
              var times = 4;
              $muhurImg.css('position','relative');
              for(var iter=0;iter<(times+1);iter++){
                $muhurImg.animate({
                  left:((iter%2==0 ? distance : distance*-1))
                },interval);
              }
              $muhurImg.animate({ left: 0},interval);
            };
            Meteor.setTimeout(shakeImg, 500)
          });
        }
      });
    }
  };

  template.aktifDers = new ReactiveVar();

  template.subscribe('mufredatlar');

  template.autorun(function() {
    template.subscribe('sinavlar', moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate(), function() {
      Tracker.afterFlush(function() {
        var user = Meteor.user();
        var devamEdenSinavId = Session.get('devamEdenSinavVar');
        var detayindanDonulenSinavId = Session.get('detayindanDonulenSinavId');
        if (detayindanDonulenSinavId) {
          var detayindanDonulenSinavinDersiId = M.C.Sinavlar.findOne({_id: detayindanDonulenSinavId}).ders;
          template.aktifDers.set(detayindanDonulenSinavinDersiId);
          scrollToSinav(detayindanDonulenSinavId);
          M.L.clearSessionVariable('detayindanDonulenSinavId');
        } else {
          if (devamEdenSinavId) {
            template.aktifDers.set(M.C.Sinavlar.findOne({_id: devamEdenSinavId}).ders);
            scrollToSinav(devamEdenSinavId);
          } else {
            var girilenSinavlar = M.C.SinavKagitlari.find({
              ogrenci: user._id,
              kurum: user.kurum,
              sinif: user.sinif,
              egitimYili: M.C.AktifEgitimYili.findOne().egitimYili
            }, {fields: {sinav: 1}}).map(function(sinavKagidi) {return sinavKagidi.sinav});
            var sonSinav = M.C.Sinavlar.findOne({
              $and: [
                {
                  _id: {$nin: girilenSinavlar},
                  kurum: user.kurum,
                  taslak: false,
                  aktif: true,
                  iptal: false,
                  muhur: {$exists: true},
                  sinif: user.sinif,
                  subeler: user.sube,
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
            }, {sort: {acilisZamani: -1}});
            if (sonSinav) {
              template.aktifDers.set(sonSinav.ders);
              scrollToSinav(sonSinav._id);
            } else {
              var sonGirilenSinavinKagidi = M.C.SinavKagitlari.findOne({ogrenciSinavaGirdi: true}, {sort: {bitirmeZamani: -1}});
              if (sonGirilenSinavinKagidi) {
                template.aktifDers.set(M.C.Sinavlar.findOne({_id: sonGirilenSinavinKagidi.sinav}).ders);
                scrollToSinav(sonGirilenSinavinKagidi.sinav);
              } else {
                var ilkDers = M.C.Dersler.findOne({}, {sort: {createdAt: 1}});
                template.aktifDers.set(ilkDers._id);
              }
            }
          }
        }
      })
    });
  })

});

Template.muhurTasi.helpers({
  dersler: function() {
    var derslerCursor = M.C.Dersler.find({}, {sort: {createdAt: 1}});
    return derslerCursor.count() && derslerCursor;
  },
  dersKaydirGerekli: function() {
    return M.C.Dersler.find().count() > 6;
  },
  sinavlar: function() {
    var aktifDers = Template.instance().aktifDers.get();
    var user = Meteor.user();
    if (aktifDers && user) {
      var sinavlarCursor = M.C.Sinavlar.find({
        kurum: user.kurum,
        taslak: false,
        aktif: true,
        iptal: false,
        ders: aktifDers,
        muhur: {$exists: true},
        sinif: user.sinif,
        subeler: user.sube,
        egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
        acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
      }, {sort: {acilisZamani: 1}});
      return sinavlarCursor.count() && sinavlarCursor;
    } else {
      return false;
    }
  },
  icindeGirilebilirSinavVar: function(dersId) {
    var user = Meteor.user();
    var girilenSinavlar = M.C.SinavKagitlari.find({
      ogrenci: user._id,
      kurum: user.kurum,
      sinif: user.sinif,
      egitimYili: M.C.AktifEgitimYili.findOne().egitimYili
    }, {fields: {sinav: 1}}).map(function(sinavKagidi) {return sinavKagidi.sinav});
    return M.C.Sinavlar.find({
      $and: [
        {
          ders: dersId,
          _id: {$nin: girilenSinavlar},
          kurum: user.kurum,
          taslak: false,
          aktif: true,
          iptal: false,
          muhur: {$exists: true},
          sinif: user.sinif,
          subeler: user.sube,
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
    }).count();
  },
  muhurKaydirGerekli: function() {
    var aktifDers = Template.instance().aktifDers.get();
    var user = Meteor.user();
    if (aktifDers && user) {
      return M.C.Sinavlar.find({
        kurum: user.kurum,
        taslak: false,
        aktif: true,
        iptal: false,
        ders: aktifDers,
        muhur: {$exists: true},
        sinif: user.sinif,
        subeler: user.sube,
        egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
        acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
      }).count() > 8;
    } else {
      return false;
    }
  },
  barOranli: function(puan) {
    return math.chain(puan).divide(100).multiply(152).round().done()
  }
});

Template.muhurTasi.events({
  'click .muhurGrup': function(e,t) {
    t.aktifDers.set(this._id);
  },
  'click .sol': function(e,t) {
    t.$('.muhurGruplariWrapper').animate({
      scrollLeft: '-=128'
    }, 300);
  },
  'click .sag': function(e,t) {
    t.$('.muhurGruplariWrapper').animate({
      scrollLeft: '+=128'
    }, 300);
  },
  'click .yukari': function(e,t) {
    t.$('.muhurlerWrapper').animate({
      scrollTop: '-=240'
    }, 300);
  },
  'click .asagi': function(e,t) {
    t.$('.muhurlerWrapper').animate({
      scrollTop: '+=240'
    }, 300);
  },
  'click [data-trigger="muhurDetay"]': function(e,t) {
    var data = Blaze.getData(e.currentTarget);
    if (data) {
      FlowRouter.go('muhurBilgi', {_id: data._id});
    }
  }
});
