import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Blaze } from 'meteor/blaze';
import { Tracker } from 'meteor/tracker';
import { _ } from 'meteor/underscore';

import { moment } from 'meteor/momentjs:moment';
import { TimeSync } from 'meteor/mizzao:timesync';

import { M } from 'meteor/m:lib-core';

import './sinav-ekrani.html';

let sinavSureCounterInterval;

Template.sinavEkrani.onCreated(function() {

  this.renderDate = new ReactiveVar(new Date());
  this.sinavUyari = new ReactiveVar(false);
  this.sinavEkraniCikisUyari = new ReactiveVar(false);
  this.sinavYardim = new ReactiveVar(false);
  this.renderComponent = new ReactiveVar(true);
  this.seciliSoruIndex = new ReactiveVar(0);
  this.kalanSure = new ReactiveVar('');
  this.kalanSureBitiyor = new ReactiveVar(false);
  this.sinavKagidi = new ReactiveVar(null);
  this.sinav = new ReactiveVar(null);

  this.autorun(() => {
    const aktifEgitimYili = M.C.AktifEgitimYili.findOne();
    const user = Meteor.user();
    let sinavKagidi = M.C.SinavKagitlari.findOne({
      ogrenci: Meteor.userId(),
      kurum: user && user.kurum,
      sinif: user && user.sinif,
      egitimYili: aktifEgitimYili && aktifEgitimYili.egitimYili,
      baslamaZamani: {$lte: this.renderDate.get()},
      bitirmeZamani: {$exists: false},
      ogrenciSinavaGirdi: true
    });

    if (sinavKagidi) {
      this.subscribe('fssorugorsel');
      this.subscribe('sinavKagidi', sinavKagidi._id, () => {

        this.autorun(() => {
          sinavKagidi = M.C.SinavKagitlari.findOne({
            ogrenci: Meteor.userId(),
            kurum: user && user.kurum,
            sinif: user && user.sinif,
            egitimYili: aktifEgitimYili && aktifEgitimYili.egitimYili,
            baslamaZamani: {$lte: this.renderDate.get()},
            bitirmeZamani: {$exists: false},
            'yanitlar.yanitlandi': {$gte: 0},
            ogrenciSinavaGirdi: true
          });
          this.sinavKagidi.set(sinavKagidi);

          const sinav = sinavKagidi && M.C.Sinavlar.findOne({
            _id: sinavKagidi.sinav,
            iptal: false,
            kapanisZamani: {$gt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
          });
          if (sinav) {

            this.sinav.set(sinav);

            if (sinav.iptal === true || (sinav.tip === 'canli' && sinav.canliStatus === 'completed')) {
              Meteor.call('sinaviBitir', {sinavKagidiId: sinavKagidi._id}, (error, result) => {
                if (error && error.error === '403' ) {
                  Meteor.clearInterval(sinavSureCounterInterval);
                }
              });
            } else {
              if (sinav.tip === 'canli') {
                this.kalanSure.set('Canlı ' + sinav.sure.toString() + 'dk');
              } else {
                let t;
                if ( ( sinavKagidi.baslamaZamani.getTime() + sinav.sure * 60 * 1000 ) < sinav.kapanisZamani.getTime() ) {
                  t = sinavKagidi.baslamaZamani.getTime() + sinav.sure * 60 * 1000 - TimeSync.serverTime(null, 5 * 60 * 1000);
                } else {
                  t = sinav.kapanisZamani.getTime() - TimeSync.serverTime(null, 5 * 60 * 1000);
                }
                if (t) {
                  sinavSureCounterInterval = Meteor.setInterval(() => {
                    if (t < 1000) {
                      if (sinavKagidi) {
                        Meteor.call('sinaviBitir', {sinavKagidiId: sinavKagidi._id}, (error, result) => {
                          if (error && error.error === '403' ) {
                            Meteor.clearInterval(sinavSureCounterInterval);
                          }
                        });
                      }
                      Meteor.clearInterval(sinavSureCounterInterval);
                    } else {
                      if (t > 3 * 60 * 1000 - 1000 && t <= 3 * 60 * 1000) {
                        toastr.error('Son 3 dakika!');
                      } else if (t > 2 * 60 * 1000 - 1000 && t <= 2 * 60 * 1000) {
                        toastr.error('Son 2 dakika!');
                      } else if (t > 60 * 1000 - 1000 && t <= 60 * 1000) {
                        toastr.error('Son 1 dakika!');
                      } else if (t > 30 * 1000 - 1000 && t <= 30 * 1000) {
                        this.kalanSureBitiyor.set(true);
                      }
                      t = t - 1000;
                      this.kalanSure.set(M.L.FormatSinavSuresi(t));
                    }
                  }, 1000);
                }
              }
            }

          } else {
            Session.set('sinavGoster',false);
          }
        })

      });
    } else {
      Session.set('sinavGoster',false);
    }

  });

});

Template.sinavEkrani.onDestroyed(function() {
  Meteor.clearInterval(sinavSureCounterInterval);
});

Template.sinavUyariModal.helpers({
  yanitlanmamisSoruAdedi() {
    const sinavKagidi = Template.instance().parent().sinavKagidi.get();
    return _.countBy(sinavKagidi.yanitlar, yanit => yanit.yanitlandi===0).true;
  },
  alistirmaSinavindanHalenAlinabilecekPuan() {
    const sinavKagidi = Template.instance().parent().sinavKagidi.get();
    if (sinavKagidi.tip === 'alistirma') {
      const adet = _.countBy(sinavKagidi.yanitlar, yanit => yanit.dogru===false).true;
      if (adet > 0) {
        const kalanPuan = _.reduce(_.where(sinavKagidi.yanitlar, {dogru: false}), (memo,yanit) => {
          return math.chain(memo).add(math.chain(yanit.puan).divide(parseInt(yanit.yanitlandi)+1).round().done()).done()
        }, 0);
        return {adet, puan: kalanPuan};
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
});

Template.sinavEkrani.helpers({
  sinavYardim() {
    return Template.instance().sinavYardim.get();
  },
  sinavUyari() {
    return Template.instance().sinavUyari.get();
  },
  sinavEkraniCikisUyari() {
    return Template.instance().sinavEkraniCikisUyari.get();
  },
  sinavKagidi() {
    return Template.instance().sinavKagidi.get();
  },
  sinav() {
    return Template.instance().sinav.get();
  },
  kalanSure() {
    return Template.instance().kalanSure.get();
  },
  renderComponent() {
    return Template.instance().renderComponent.get();
  },
  seciliSoruIndex() {
    return Template.instance().seciliSoruIndex.get();
  },
  soruPuani() {
    const seciliSoruIndex = Template.instance().seciliSoruIndex.get();
    const sinavKagidi = Template.instance().sinavKagidi.get();
    if (sinavKagidi) {
      let soruPuani = sinavKagidi.yanitlar[seciliSoruIndex].puan;
      if (sinavKagidi.tip === 'alistirma') {
        const dogru = sinavKagidi.yanitlar[seciliSoruIndex].dogru;
        const yanitlandi = parseInt(sinavKagidi.yanitlar[seciliSoruIndex].yanitlandi);
        if (dogru === true) {
          soruPuani = math.chain(soruPuani).divide(yanitlandi).round().done()
        } else {
          soruPuani = math.chain(soruPuani).divide(yanitlandi+1).round().done()
        }
      }
      return soruPuani;
    } else {
      return false;
    }
  },
  seciliSoru() {
    const seciliSoruIndex = Template.instance().seciliSoruIndex.get();
    const sinavKagidi = Template.instance().sinavKagidi.get();
    return sinavKagidi && sinavKagidi.yanitlar[seciliSoruIndex];
  },
  renderComponent() {
    return Template.instance().renderComponent.get();
  },
  soruKomponent() {
    const seciliSoruIndex = Template.instance().seciliSoruIndex.get();
    const sinavKagidi = Template.instance().sinavKagidi.get();
    const seciliSoru = sinavKagidi && sinavKagidi.yanitlar[seciliSoruIndex];

    if (seciliSoru) {
      let template=null;
      const data={
        sinav: true,
        sinavKagidiId: sinavKagidi._id,
        seciliSoruIndex,
      };

      switch (seciliSoru.tip) {
        case 'dogruYanlis':
          template = 'sorudogruYanlis';
          break;
        case 'coktanTekSecmeli':
          template = 'sorucoktanTekSecmeli';
          break;
        case 'coktanCokSecmeli':
          template = 'sorucoktanCokSecmeli';
          break;
        case 'siralama':
          template = 'sorusiralama';
          break;
        case 'eslestirme':
          template = 'sorueslestirme';
          break;
        case 'boslukDoldurma':
          template = 'soruboslukDoldurma';
          break;
        default:
          template = null;
          break;
      }

      return {
        template,
        data,
      }
    }
  }
});

Template.sinavEkrani.events({
  'click .dugmeNav.yardim'(e,t) {
    t.sinavYardim.set(true);
  },
  'click .dugmeNav.anaEkran'(e,t) {
    e.preventDefault();
    t.sinavEkraniCikisUyari.set(true);
  },
  'click .ekrandanCikmaktanVazgec'(e,t){
    t.sinavEkraniCikisUyari.set(false);
  },
  'click .ekrandanCikmayiOnayla'(e,t){
    e.preventDefault();
    t.sinavEkraniCikisUyari.set(false);
    Session.set('sinavGoster',false);
  },
  'click .sinavYardim'(e,t) {
    t.sinavYardim.set(false);
  },
  'click .dugmeNav.kapat'(e,t) {
    e.preventDefault();
    t.sinavUyari.set(true);
  },
  'click .kapatmaktanVazgec'(e,t) {
    t.sinavUyari.set(false);
  },
  'click .kapatmayiOnayla'(e,t) {
    e.preventDefault();
    const sinavKagidi = t.sinavKagidi.get();
    if (sinavKagidi) {
      Meteor.call('sinaviBitir', {sinavKagidiId: sinavKagidi._id}, (error, result) => {
        if (error && error.error === '403' ) {
          Meteor.clearInterval(sinavSureCounterInterval);
        }
      });
    }
    t.sinavUyari.set(false);
    Session.set('sinavGoster',false);
    toastr.success('Tebrikler! Testi başarıyla bitirdin. Sonuçları mühür bilgi ekranından görebilirsin.');
  },
  'click .soruYanitla'(e,t) {
    let eslestirmeEksik = false, dogruYanlisSecilmemis = false, coktanTekSecilmemis = false, coktanCokSecilmemis = false, boslukDoldurulmamis = false;
    const seciliSoruIndex = t.seciliSoruIndex.get();
    const ix = parseInt(seciliSoruIndex);
    const aktifEgitimYili = M.C.AktifEgitimYili.findOne();
    const user = Meteor.user();
    const sinavKagidi = t.sinavKagidi.get();
    const tip = sinavKagidi && sinavKagidi.yanitlar[ix].tip;
    const ixLast = sinavKagidi && sinavKagidi.yanitlar.length - 1;

    let yanit = {};

    if (tip === 'dogruYanlis') {
      if (t.$('input[type="radio"][name="dogruYanlis"]:checked').length === 1) {
        yanit = {
          cevap: t.$('input[type="radio"][name="dogruYanlis"]:checked').val() === 'true'
        };
      } else {
        dogruYanlisSecilmemis = true;
      }
    }

    if (tip === 'coktanTekSecmeli') {
      if (t.$('input[type="radio"][name="coktanTekSecmeli"]:checked').length === 1) {
        yanit = {
          secenekler: []
        };
        for (let i=0; i < sinavKagidi.yanitlar[ix].yanit.secenekler.length ; i++) {
          yanit.secenekler.push({
            secenekMetin: sinavKagidi.yanitlar[ix].yanit.secenekler[i].secenekMetin,
            secenekGorsel: sinavKagidi.yanitlar[ix].yanit.secenekler[i].secenekGorsel,
            dogru: t.$('input[type="radio"][name="coktanTekSecmeli"]:checked#'+[i]).length > 0
          });
        }
      } else {
        coktanTekSecilmemis = true;
      }
    }

    if (tip === 'coktanCokSecmeli') {
      if (t.$('input[type="checkbox"]:checked').length >= 1) {
        yanit = {
          secenekler: []
        };
        for (let i=0; i < sinavKagidi.yanitlar[ix].yanit.secenekler.length ; i++) {
          yanit.secenekler.push({
            secenekMetin: sinavKagidi.yanitlar[ix].yanit.secenekler[i].secenekMetin,
            secenekGorsel: sinavKagidi.yanitlar[ix].yanit.secenekler[i].secenekGorsel,
            dogru: t.$('input[type="checkbox"]:checked#'+[i]).length > 0
          });
        }
      } else {
        coktanCokSecilmemis = true;
      }
    }

    if (tip === 'siralama') {
      yanit = {
        secenekler: []
      };
      for (let i=0; i < sinavKagidi.yanitlar[ix].yanit.secenekler.length ; i++) {
        yanit.secenekler.push({
          metin: sinavKagidi.yanitlar[ix].yanit.secenekler[parseInt(t.$('.sirala').eq(i).attr('id'))].metin,
          gorsel: sinavKagidi.yanitlar[ix].yanit.secenekler[parseInt(t.$('.sirala').eq(i).attr('id'))].gorsel
        });
      }
    }

    if (tip === 'eslestirme') {
      if (t.$('.cizgi').length === sinavKagidi.yanitlar[ix].yanit.eslestirme.length) {
        yanit = {
          eslestirme: []
        };
        t.$('.cizgi').each(function() {
          const id = $(this).attr('id');
          const sol = parseInt(id.substr(4,1));
          const sag = parseInt(id.substr(10,1));
          yanit.eslestirme.push([sol,sag]);
        });
      } else {
        eslestirmeEksik = true;
      }
    }

    if (tip === 'boslukDoldurma') {
      const bosBirakilanAdet = t.$('input[type="text"]').filter(function() {
        return M.L.Trim($(this).val()).length === 0
      }).length;
      if (bosBirakilanAdet === 0) {
        yanit = {
          cevaplar: []
        };
        for (let i=0; i < sinavKagidi.yanitlar[ix].yanit.cevaplar.length ; i++) {
          const bosluk = !!t.$('input[type="text"]#'+[i]).val() ? t.$('input[type="text"]#'+[i]).val() : '';
          yanit.cevaplar.push(bosluk);
        }
      } else {
        boslukDoldurulmamis = true;
      }
    }

    if (eslestirmeEksik) {
      toastr.error('Soruyu yanıtlamak için eşleştirmeleri tamamlamalısın.');
    } else if (dogruYanlisSecilmemis) {
      toastr.error('Soruyu yanıtlamak için doğru veya yanlış olarak işaretlemelisin.');
    } else if (coktanTekSecilmemis) {
      toastr.error('Soruyu yanıtlamak için bir seçenek işaretlemelisin.');
    } else if (coktanCokSecilmemis) {
      toastr.error('Soruyu yanıtlamak için en az bir seçenek işaretlemelisin.');
    } else  if (boslukDoldurulmamis) {
      toastr.error('Soruyu yanıtlamak için boşlukların hepsini doldurmalısın.');
    } else {
      Meteor.call('soruYanitla', sinavKagidi._id,ix,yanit, (err, res) => {
        if (err) {
          toastr.error('Soruya verdiğin yanıt kaydedilemedi. Lütfen daha sonra tekrar dene.');
        }
        if (res) {
          t.renderDate.set(new Date());
          Tracker.flush();
          const sinavKagidiGuncel = M.C.SinavKagitlari.findOne({
            ogrenci: Meteor.userId(),
            kurum: user && user.kurum,
            sinif: user && user.sinif,
            egitimYili: aktifEgitimYili && aktifEgitimYili.egitimYili,
            baslamaZamani: {$lte: t.renderDate.get()},
            bitirmeZamani: {$exists: false},
            'yanitlar.yanitlandi': {$gte: 0},
            ogrenciSinavaGirdi: true
          });
          if (sinavKagidiGuncel && sinavKagidiGuncel.tip === 'alistirma' && sinavKagidiGuncel.yanitlar[ix].dogru === false) {
            t.renderComponent.set(false);
            Tracker.flush();
            t.seciliSoruIndex.set(ix);
            t.renderComponent.set(true);
            toastr.error('Soruya verdiğin yanıt yanlış. Düzeltip tekrar yanıtlayabilirsin.');
          } else {
            const newIx = ix === ixLast ? 0 : ix+1;
            if (newIx > 0) {
              t.renderComponent.set(false);
              Tracker.flush();
              t.seciliSoruIndex.set(newIx);
              t.renderComponent.set(true);
              toastr.success('Soruya verdiğin yanıt kaydedildi.');
              if (ix+1 >= 14 && $('[data-soruIndex="'+newIx.toString()+'"]').position().left === 896) {
                t.$('.soruCubugu').animate({
                  scrollLeft: '+=64'
                }, 0);
              }
            } else {
              t.renderComponent.set(false);
              Tracker.flush();
              t.seciliSoruIndex.set(ix);
              t.renderComponent.set(true);
              toastr.success('Soruya verdiğin yanıt kaydedildi ve bu testin son sorusuydu.');
            }
          }
        }
      });
    }

  }
});
