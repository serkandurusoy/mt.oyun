Template.sinavYanitlari.onCreated(function() {
  var template = this;

  template.sinavYardim = new ReactiveVar(false);
  template.seciliSoruIndex = new ReactiveVar(0);
  template.eslestirme = new ReactiveDict();

  template.autorun(function() {
    template.subscribe('fssorugorsel');
    template.subscribe('sinavYanitlari', Session.get('sinavYanitGoster'), moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate(), function() {
      var sinav = M.C.Sinavlar.findOne({_id: Session.get('sinavYanitGoster')});
      Tracker.afterFlush(function() {
        var seciliSoruIndex = template.seciliSoruIndex.get() ? template.seciliSoruIndex.get() : 0;
        var seciliSoru = M.C.Sorular.findOne({_id: sinav.sorular[seciliSoruIndex].soruId});
        if (seciliSoru && seciliSoru.tip === 'eslestirme') {
          var eslestirLength = seciliSoru.yanit.eslestirme.length;
          for(var sol=0;sol<eslestirLength;sol++) {
            for(var sag=0;sag<eslestirLength;sag++) {
              M.L.CizgiSil(sol,sag,'eslestirme');
            }
          }
          _.each(seciliSoru.yanit.eslestirme, function(eslesme, ix) {
            template.eslestirme.set('eslestirme'+seciliSoruIndex,[null,null]);
            M.L.CizgiCiz(ix,ix,'eslestirme');
          })
        }
      });


    });
  });

});

Template.sinavYanitlari.helpers({
  formatliSinavSuresi: function(t) {
    return M.L.FormatSinavSuresi(t*60*1000);
  },
  sinavYardim: function() {
    return Template.instance().sinavYardim.get();
  },
  sinav: function() {
    return M.C.Sinavlar.findOne({
      _id: Session.get('sinavYanitGoster'),
      aktif: true,
      iptal: false,
      kilitli: true,
      muhur: {$exists: true},
      egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
      acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
    });
  },
  seciliSoruIndex: function() {
    return Template.instance().seciliSoruIndex.get();
  },
  alinanPuan: function() {
    var alinanPuan,soruPuani,verilenYanit,seciliSoruIndex;
    var sinav = M.C.Sinavlar.findOne({_id: Session.get('sinavYanitGoster')});
    var sinavKagidi = M.C.SinavKagitlari.findOne({sinav: sinav._id, ogrenciSinavaGirdi: true});

    seciliSoruIndex = Template.instance().seciliSoruIndex.get();

    soruPuani = sinav && sinav.sorular[seciliSoruIndex].puan;

    verilenYanit = sinavKagidi && _.findWhere(sinavKagidi.yanitlar, {soruId: sinav.sorular[seciliSoruIndex].soruId});

    if (verilenYanit) {
      if (verilenYanit.dogru === false) {
        alinanPuan = 0;
      } else {
        if (sinavKagidi.tip === 'alistirma') {
          alinanPuan = math.chain(soruPuani).divide(parseInt(verilenYanit.yanitlandi)).round().done();
        } else {
          alinanPuan = soruPuani;
        }
      }
    } else {
      alinanPuan = 0;
    }

    return sinav && (alinanPuan.toString() + "/" + soruPuani.toString()) ;
  },
  soruSayisiCubugaSigmiyor: function() {
    var sinav = M.C.Sinavlar.findOne({_id: Session.get('sinavYanitGoster')});
    return sinav && sinav.sorular.length > 14;
  },
  seciliSoru: function() {
    var sinav = M.C.Sinavlar.findOne({_id: Session.get('sinavYanitGoster')});
    return sinav && M.C.Sorular.findOne({_id: sinav.sorular[Template.instance().seciliSoruIndex.get()].soruId});
  }
});

Template.sinavYanitlari.events({
  'click .dugmeNav.yardim': function(e,t) {
    t.sinavYardim.set(true);
  },
  'click .dugmeNav.anaEkran': function(e,t) {
    e.preventDefault();
    Session.set('sinavYanitGoster',false);
  },
  'click .yardimEkrani': function(e,t) {
    var ix = t.seciliSoruIndex.get();
    t.sinavYardim.set(false);
    Meteor.defer(function() {
      t.$('[data-soruIndex="'+ix.toString()+'"]').click();
      t.$('[data-soruIndex="'+ix.toString()+'"]').addClass('secili');
    });
  },
  'click [data-soruIndex]': function(e,t) {
    var ix = e.currentTarget.getAttribute('data-soruIndex');
    t.seciliSoruIndex.set(ix);
    t.$('[data-soruIndex]').removeClass('secili');
    t.$(e.currentTarget).addClass('secili');
    var sinav = M.C.Sinavlar.findOne({_id: Session.get('sinavYanitGoster')});
    var seciliSoru = sinav && M.C.Sorular.findOne({_id: sinav.sorular[ix].soruId});
    Tracker.afterFlush(function() {
      if (seciliSoru && seciliSoru.tip === 'eslestirme') {
        var eslestirLength = seciliSoru.yanit.eslestirme.length;
        for(var sol=0;sol<eslestirLength;sol++) {
          for(var sag=0;sag<eslestirLength;sag++) {
            M.L.CizgiSil(sol,sag,'eslestirme');
          }
        }
        _.each(seciliSoru.yanit.eslestirme, function(eslesme, ix) {
          t.eslestirme.set('eslestirme'+ t.seciliSoruIndex.get(),[null,null]);
          M.L.CizgiCiz(ix,ix,'eslestirme');
        })
      }
    })
  }
});
