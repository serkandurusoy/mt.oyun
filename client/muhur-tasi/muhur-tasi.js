Template.muhurTasi.onCreated(function() {
  const scrollToSinav = sinavId => {
    if (!!sinavId) {
      Meteor.defer(() => {
        const $muhur = $('#'+sinavId);
        if (!!$muhur.length) {
          $('.muhurlerWrapper').animate({
            scrollTop: parseInt($muhur.position().top)
          }, 500, () => {
            const shakeImg = () => {
              let $muhurImg = $('#'+sinavId+' > img');
              const interval = 100;
              const distance = 10;
              const times = 4;
              $muhurImg.css('position','relative');
              for(let iter=0;iter<(times+1);iter++){
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

  this.aktifDers = new ReactiveVar();

  this.subscribe('mufredatlar');

  this.autorun(() => {
    this.subscribe('sinavlar', moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate(), () => {
      Tracker.afterFlush(() => {
        const user = Meteor.user();
        const devamEdenSinavId = Session.get('devamEdenSinavVar');
        const detayindanDonulenSinavId = Session.get('detayindanDonulenSinavId');
        if (detayindanDonulenSinavId) {
          const detayindanDonulenSinavinDersiId = M.C.Sinavlar.findOne({_id: detayindanDonulenSinavId}).ders;
          this.aktifDers.set(detayindanDonulenSinavinDersiId);
          scrollToSinav(detayindanDonulenSinavId);
          M.L.clearSessionVariable('detayindanDonulenSinavId');
        } else {
          if (devamEdenSinavId) {
            this.aktifDers.set(M.C.Sinavlar.findOne({_id: devamEdenSinavId}).ders);
            scrollToSinav(devamEdenSinavId);
          } else {
            const {
              _id: ogrenci,
              kurum,
              sinif,
              sube: subeler,
            } = user;
            const girilenSinavlar = M.C.SinavKagitlari.find({
              ogrenci,
              kurum,
              sinif,
              egitimYili: M.C.AktifEgitimYili.findOne().egitimYili
            }, {fields: {sinav: 1}}).map(sinavKagidi => sinavKagidi.sinav);
            const sonSinav = M.C.Sinavlar.findOne({
              $and: [
                {
                  _id: {$nin: girilenSinavlar},
                  kurum,
                  taslak: false,
                  aktif: true,
                  iptal: false,
                  muhur: {$exists: true},
                  sinif,
                  subeler,
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
              this.aktifDers.set(sonSinav.ders);
              scrollToSinav(sonSinav._id);
            } else {
              const sonGirilenSinavinKagidi = M.C.SinavKagitlari.findOne({ogrenciSinavaGirdi: true}, {sort: {bitirmeZamani: -1}});
              if (sonGirilenSinavinKagidi) {
                this.aktifDers.set(M.C.Sinavlar.findOne({_id: sonGirilenSinavinKagidi.sinav}).ders);
                scrollToSinav(sonGirilenSinavinKagidi.sinav);
              } else {
                const ilkDers = M.C.Dersler.findOne({}, {sort: {createdAt: 1}});
                this.aktifDers.set(ilkDers._id);
              }
            }
          }
        }
      })
    });
  })

});

Template.muhurTasi.helpers({
  dersler() {
    const derslerCursor = M.C.Dersler.find({}, {sort: {createdAt: 1}});
    return derslerCursor.count() && derslerCursor;
  },
  dersKaydirGerekli() {
    return M.C.Dersler.find().count() > 6;
  },
  sinavlar() {
    const aktifDers = Template.instance().aktifDers.get();
    const user = Meteor.user();
    if (aktifDers && user) {
      const {
        kurum,
        sinif,
        sube: subeler,
      } = user;
      const sinavlarCursor = M.C.Sinavlar.find({
        kurum,
        taslak: false,
        aktif: true,
        iptal: false,
        ders: aktifDers,
        muhur: {$exists: true},
        sinif,
        subeler,
        egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
        acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
      }, {sort: {acilisZamani: 1}});
      return sinavlarCursor.count() && sinavlarCursor;
    } else {
      return false;
    }
  },
  icindeGirilebilirSinavVar(dersId) {
    const user = Meteor.user();
    const {
      _id: ogrenci,
      kurum,
      sinif,
      sube: subeler,
    } = user;
    const girilenSinavlar = M.C.SinavKagitlari.find({
      ogrenci,
      kurum,
      sinif,
      egitimYili: M.C.AktifEgitimYili.findOne().egitimYili
    }, {fields: {sinav: 1}}).map(sinavKagidi => sinavKagidi.sinav);
    return M.C.Sinavlar.find({
      $and: [
        {
          ders: dersId,
          _id: {$nin: girilenSinavlar},
          kurum,
          taslak: false,
          aktif: true,
          iptal: false,
          muhur: {$exists: true},
          sinif,
          subeler,
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
  muhurKaydirGerekli() {
    const aktifDers = Template.instance().aktifDers.get();
    const user = Meteor.user();
    if (aktifDers && user) {
      const {
        kurum,
        sinif,
        sube: subeler,
      } = user;
      return M.C.Sinavlar.find({
        kurum,
        taslak: false,
        aktif: true,
        iptal: false,
        ders: aktifDers,
        muhur: {$exists: true},
        sinif,
        subeler,
        egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
        acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
      }).count() > 8;
    } else {
      return false;
    }
  },
  barOranli(puan) {
    return math.chain(puan).divide(100).multiply(152).round().done()
  }
});

Template.muhurTasi.events({
  'click .muhurGrup'(e,t) {
    t.aktifDers.set(this._id);
  },
  'click .sol'(e,t) {
    t.$('.muhurGruplariWrapper').animate({
      scrollLeft: '-=128'
    }, 300);
  },
  'click .sag'(e,t) {
    t.$('.muhurGruplariWrapper').animate({
      scrollLeft: '+=128'
    }, 300);
  },
  'click .yukari'(e,t) {
    t.$('.muhurlerWrapper').animate({
      scrollTop: '-=240'
    }, 300);
  },
  'click .asagi'(e,t) {
    t.$('.muhurlerWrapper').animate({
      scrollTop: '+=240'
    }, 300);
  },
  'click [data-trigger="muhurDetay"]'(e,t) {
    const data = Blaze.getData(e.currentTarget);
    if (data) {
      FlowRouter.go('muhurBilgi', {_id: data._id});
    }
  }
});
