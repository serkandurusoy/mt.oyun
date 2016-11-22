import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { _ } from 'meteor/underscore';

import { moment } from 'meteor/momentjs:moment';
import { TimeSync } from 'meteor/mizzao:timesync';

import { M } from 'meteor/m:lib-core';

import './sinav-yanitlari.html';

Template.sinavYanitlari.onCreated(function() {

  this.sinavYardim = new ReactiveVar(false);
  this.renderComponent = new ReactiveVar(true);
  this.seciliSoruIndex = new ReactiveVar(0);
  this.sinav = new ReactiveVar(null);
  this.sinavKagidi = new ReactiveVar(null);
  this.ogrenciYanitiGoster = new ReactiveVar(false);

  this.autorun(() => {
    this.subscribe('fssorugorsel');
    this.subscribe('sinavYanitlari', Session.get('sinavYanitGoster'), moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate(), () => {
      this.sinav.set(M.C.Sinavlar.findOne({
        _id: Session.get('sinavYanitGoster'),
        aktif: true,
        iptal: false,
        kilitli: true,
        muhur: {$exists: true},
        egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
        acilisZamani: {$lt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
      }));
      this.sinavKagidi.set(M.C.SinavKagitlari.findOne({
        sinav: Session.get('sinavYanitGoster'),
        ogrenci: Meteor.userId(),
        ogrenciSinavaGirdi: true,
        egitimYili: M.C.AktifEgitimYili.findOne().egitimYili
      }));
    });
  });

});

Template.sinavYanitlari.helpers({
  formatliSinavSuresi(t) {
    return M.L.FormatSinavSuresi(t*60*1000);
  },
  sinavYardim() {
    return Template.instance().sinavYardim.get();
  },
  sinav() {
    return Template.instance().sinav.get();
  },
  sinavKagidi() {
    return Template.instance().sinavKagidi.get();
  },
  ogrenciYanitiGorulebilir() {
    const seciliSoruIndex = Template.instance().seciliSoruIndex.get();
    const sinav = Template.instance().sinav.get();
    const sinavKagidi = Template.instance().sinavKagidi.get();
    const verilenYanit = sinavKagidi && _.findWhere(sinavKagidi.yanitlar, {soruId: sinav.sorular[seciliSoruIndex].soruId});
    return verilenYanit && verilenYanit.yanitlandi > 0 && verilenYanit.dogru === false;
  },
  ogrenciYanitiGoster() {
    return Template.instance().ogrenciYanitiGoster.get();
  },
  renderComponent() {
    return Template.instance().renderComponent.get();
  },
  seciliSoruIndex() {
    return Template.instance().seciliSoruIndex.get();
  },
  alinanPuan() {
    let alinanPuan;

    const seciliSoruIndex = Template.instance().seciliSoruIndex.get();

    const sinav = Template.instance().sinav.get();
    const sinavKagidi = sinav && Template.instance().sinavKagidi.get();

    const soruPuani = sinav && sinav.sorular[seciliSoruIndex].puan;

    const verilenYanit = sinavKagidi && _.findWhere(sinavKagidi.yanitlar, {soruId: sinav.sorular[seciliSoruIndex].soruId});

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
  seciliSoru() {
    const seciliSoruIndex = Template.instance().seciliSoruIndex.get();
    const sinav = Template.instance().sinav.get();
    return sinav && M.C.Sorular.findOne({_id: sinav.sorular[seciliSoruIndex].soruId});
  },
  soruKomponent() {
    const seciliSoruIndex = Template.instance().seciliSoruIndex.get();
    const sinav = Template.instance().sinav.get();
    const seciliSoru = sinav && M.C.Sorular.findOne({_id: sinav.sorular[seciliSoruIndex].soruId});

    const ogrenciYanitiGoster = Template.instance().ogrenciYanitiGoster.get();
    if (ogrenciYanitiGoster) {
      return M.L.komponentSec(seciliSoru,true)
    } else {
      return M.L.komponentSec(seciliSoru,false);
    }
  }
});

Template.sinavYanitlari.events({
  'click .dugmeNav.yardim'(e,t) {
    e.preventDefault();
    t.sinavYardim.set(true);
  },
  'click .dugmeNav.anaEkran'(e,t) {
    e.preventDefault();
    Session.set('sinavYanitGoster',false);
  },
  'click .yardimEkrani'(e,t) {
    e.preventDefault();
    t.sinavYardim.set(false);
  },
  'click [data-trigger="yanitToggle"]'(e,t) {
    e.preventDefault();
    t.renderComponent.set(false);
    Tracker.flush();
    t.ogrenciYanitiGoster.set(!t.ogrenciYanitiGoster.get());
    t.renderComponent.set(true);
  }
});
