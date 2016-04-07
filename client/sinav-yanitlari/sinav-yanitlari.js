Template.sinavYanitlari.onCreated(function() {
  var template = this;

  template.sinavYardim = new ReactiveVar(false);
  template.renderComponent = new ReactiveVar(true);
  template.seciliSoruIndex = new ReactiveVar(0);
  template.sinav = new ReactiveVar(null);

  template.autorun(function() {
    template.subscribe('fssorugorsel');
    template.subscribe('sinavYanitlari', Session.get('sinavYanitGoster'), moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate(), function() {
      template.sinav.set(M.C.Sinavlar.findOne({
        _id: Session.get('sinavYanitGoster'),
        aktif: true,
        iptal: false,
        kilitli: true,
        muhur: {$exists: true},
        egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
        acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
      }));
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
    return Template.instance().sinav.get();
  },
  renderComponent: function() {
    return Template.instance().renderComponent.get();
  },
  seciliSoruIndex: function() {
    return Template.instance().seciliSoruIndex.get();
  },
  alinanPuan: function() {
    var alinanPuan;

    var seciliSoruIndex = Template.instance().seciliSoruIndex.get();

    var sinav = Template.instance().sinav.get();
    var sinavKagidi = sinav && M.C.SinavKagitlari.findOne({sinav: sinav._id, ogrenciSinavaGirdi: true});

    var soruPuani = sinav && sinav.sorular[seciliSoruIndex].puan;

    var verilenYanit = sinavKagidi && _.findWhere(sinavKagidi.yanitlar, {soruId: sinav.sorular[seciliSoruIndex].soruId});

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

    return alinanPuan.toString() + "/" + soruPuani.toString() ;
  },
  seciliSoru: function() {
    var seciliSoruIndex = Template.instance().seciliSoruIndex.get();
    var sinav = Template.instance().sinav.get();
    return sinav && M.C.Sorular.findOne({_id: sinav.sorular[seciliSoruIndex].soruId});
  },
  soruKomponent: function() {
    var seciliSoruIndex = Template.instance().seciliSoruIndex.get();
    var sinav = Template.instance().sinav.get();
    var seciliSoru = sinav && M.C.Sorular.findOne({_id: sinav.sorular[seciliSoruIndex].soruId});
    return M.L.komponentSec(seciliSoru);
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
    t.sinavYardim.set(false);
  }
});
