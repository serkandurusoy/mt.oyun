var sinavSureCounterInterval;

Template.sinavEkrani.onCreated(function() {
  var template = this;

  template.renderDate = new ReactiveVar(new Date());
  template.sinavUyari = new ReactiveVar(false);
  template.sinavYardim = new ReactiveVar(false);
  template.seciliSoruIndex = new ReactiveVar(0);
  template.isaretliSorular = new ReactiveArray([]);
  template.kalanSure = new ReactiveVar('');
  template.eslestirme = new ReactiveDict();
  template.sinavKagidi = new ReactiveVar(null);
  template.sinav = new ReactiveVar(null);

  template.autorun(function() {
    var aktifEgitimYili = M.C.AktifEgitimYili.findOne();
    var user = Meteor.user();
    var sinavKagidi = M.C.SinavKagitlari.findOne({
      ogrenci: Meteor.userId(),
      kurum: user && user.kurum,
      sinif: user && user.sinif,
      egitimYili: aktifEgitimYili && aktifEgitimYili.egitimYili,
      baslamaZamani: {$lte: template.renderDate.get()},
      bitirmeZamani: {$exists: false},
      ogrenciSinavaGirdi: true
    });

    if (sinavKagidi) {
      template.subscribe('fssorugorsel');
      template.subscribe('sinavKagidi', sinavKagidi._id, function() {
        sinavKagidi = M.C.SinavKagitlari.findOne({
          ogrenci: Meteor.userId(),
          kurum: user && user.kurum,
          sinif: user && user.sinif,
          egitimYili: aktifEgitimYili && aktifEgitimYili.egitimYili,
          baslamaZamani: {$lte: template.renderDate.get()},
          bitirmeZamani: {$exists: false},
          'yanitlar.yanitlandi': {$gte: 0},
          ogrenciSinavaGirdi: true
        });
        template.sinavKagidi.set(sinavKagidi);

        var sinav = M.C.Sinavlar.findOne({
          _id: sinavKagidi.sinav,
          iptal: false,
          kapanisZamani: {$gt: moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate()}
        });
        if (sinav) {

          template.sinav.set(sinav);

          if (sinav.iptal === true || (sinav.tip === 'canli' && sinav.canliStatus === 'completed')) {
            Meteor.call('sinaviBitir', {sinavKagidiId: sinavKagidi._id});
          } else {
            if (sinav.tip === 'canli') {
              template.kalanSure.set('Canlı ' + sinav.sure.toString() + 'dk');
            } else {
              var t;
              if ( ( sinavKagidi.baslamaZamani.getTime() + sinav.sure * 60 * 1000 ) < sinav.kapanisZamani.getTime() ) {
                t = sinavKagidi.baslamaZamani.getTime() + sinav.sure * 60 * 1000 - TimeSync.serverTime(null, 5 * 60 * 1000);
              } else {
                t = sinav.kapanisZamani.getTime() - TimeSync.serverTime(null, 5 * 60 * 1000);
              }
              if (t) {
                sinavSureCounterInterval = Meteor.setInterval(function() {
                  if (t < 1000) {
                    Meteor.call('sinaviBitir', {sinavKagidiId: sinavKagidi._id});
                  } else {
                    t = t - 1000;
                    template.kalanSure.set(M.L.FormatSinavSuresi(t));
                  }
                }, 1000);
              }
            }
          }

          Tracker.afterFlush(function() {
            var seciliSoruIndex = template.seciliSoruIndex.get() ? template.seciliSoruIndex.get() : 0;
            var yanitSayisi = sinavKagidi.yanitlar[seciliSoruIndex].yanitlandi;
            if (sinavKagidi && sinavKagidi.yanitlar[seciliSoruIndex].tip === 'siralama' && yanitSayisi >= 0) {
              var el = document.getElementById('siralama-'+sinavKagidi.yanitlar[seciliSoruIndex].soruId+'-'+yanitSayisi);
              if (el) {
                if (typeof siralamaSortable !== 'undefined') {
                  siralamaSortable.destroy()
                }
                siralamaSortable = new Sortable(el, {
                  forceFallback: true,
                  onEnd: function() {
                    $('#cozumAlani').animate({
                      scrollTop: '-=500'
                    }, 0)
                  }
                });
                siralamaSortable.sort(_.map(sinavKagidi.yanitlar[seciliSoruIndex].yanit.secenekler, function(secenek) {return JSON.stringify(secenek).toString().toHashCode();}));
              }
            }
            if (sinavKagidi && sinavKagidi.yanitlar[seciliSoruIndex].tip === 'boslukDoldurma') {
              _.map(sinavKagidi.yanitlar[seciliSoruIndex].yanit.cevaplar, function(cevap,cIx) {
                $('input[type="text"]#'+cIx).val(cevap);
              })
            }
            if (sinavKagidi && sinavKagidi.yanitlar[seciliSoruIndex].tip === 'eslestirme') {
              var eslestirLength = sinavKagidi.yanitlar[seciliSoruIndex].yanit.sol.length;
              for(var sol=0;sol<eslestirLength;sol++) {
                for(var sag=0;sag<eslestirLength;sag++) {
                  M.L.CizgiSil(sol,sag,'eslestirme');
                }
              }
              _.each(sinavKagidi.yanitlar[seciliSoruIndex].yanit.eslestirme, function(eslesme) {
                template.eslestirme.set('eslestirme'+seciliSoruIndex,[null,null]);
                if (sinavKagidi.yanitlar[seciliSoruIndex].yanitlandi > 0) {
                  M.L.CizgiCiz(eslesme[0],eslesme[1],'eslestirme');
                }
              })
            }
          });

        } else {
          Session.set('sinavGoster',false);
        }
      });
    } else {
      Session.set('sinavGoster',false);
    }

  });

});

Template.sinavEkrani.onDestroyed(function() {
  Meteor.clearInterval(sinavSureCounterInterval);
});

Template.sinavEkrani.helpers({
  sinavYardim: function() {
    return Template.instance().sinavYardim.get();
  },
  sinavUyari: function() {
    return Template.instance().sinavUyari.get();
  },
  yanitlanmamisSoruAdedi: function() {
    var sinavKagidi = Template.instance().sinavKagidi.get();
    return _.countBy(sinavKagidi.yanitlar, function(yanit){return yanit.yanitlandi===0}).true;
  },
  alistirmaSinavindanHalenAlinabilecekPuan: function() {
    var sinavKagidi = Template.instance().sinavKagidi.get();
    if (sinavKagidi.tip === 'alistirma') {
      var adet = _.countBy(sinavKagidi.yanitlar, function(yanit){return yanit.dogru===false}).true;
      if (adet > 0) {
        var kalanPuan = _.reduce(_.where(sinavKagidi.yanitlar, {dogru: false}), function(memo,yanit) {
          return math.chain(memo).add(math.chain(yanit.puan).divide(parseInt(yanit.yanitlandi)+1).round().done()).done()
        }, 0);
        return {adet: adet, puan: kalanPuan};
      } else {
        return false;
      }
    } else {
      return false;
    }
  },
  sinavKagidi: function() {
    return Template.instance().sinavKagidi.get();
  },
  sinav: function() {
    return Template.instance().sinav.get();
  },
  kalanSure: function() {
    return Template.instance().kalanSure.get();
  },
  seciliSoruIndex: function() {
    return Template.instance().seciliSoruIndex.get();
  },
  soruPuani: function() {
    var seciliSoruIndex = Template.instance().seciliSoruIndex.get();
    var sinavKagidi = Template.instance().sinavKagidi.get();
    if (sinavKagidi) {
      var soruPuani = sinavKagidi.yanitlar[seciliSoruIndex].puan;
      if (sinavKagidi.tip === 'alistirma') {
        var dogru = sinavKagidi.yanitlar[seciliSoruIndex].dogru;
        var yanitlandi = parseInt(sinavKagidi.yanitlar[seciliSoruIndex].yanitlandi);
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
  seciliSoru: function() {
    var seciliSoruIndex = Template.instance().seciliSoruIndex.get();
    var sinavKagidi = Template.instance().sinavKagidi.get();
    return sinavKagidi && sinavKagidi.yanitlar[seciliSoruIndex];
  },
  eslemeIcinSeciliKutu: function(pos,ix) {
    var seciliSoruIndex = Template.instance().seciliSoruIndex.get();
    var eslestirme = Template.instance().eslestirme.get('eslestirme'+seciliSoruIndex);
    return eslestirme;
  }
});

Template.sinavEkrani.events({
  'click .dugmeNav.yardim': function(e,t) {
    t.sinavYardim.set(true);
  },
  'click .dugmeNav.anaEkran': function(e,t) {
    e.preventDefault();
    Session.set('sinavGoster',false);
    toastr.error('Dikkat! Sınav süresi işlemeye devam ediyor, istersen sınava tekrar dönebilirsin');
  },
  'click .sinavYardim': function(e,t) {
    t.sinavYardim.set(false);
  },
  'click .dugmeNav.kapat': function(e,t) {
    e.preventDefault();
    t.sinavUyari.set(true);
  },
  'click .kapatmaktanVazgec': function(e,t) {
    t.sinavUyari.set(false);
  },
  'click .kapatmayiOnayla': function(e,t) {
    e.preventDefault();
    var sinavKagidi = t.sinavKagidi.get();
    if (sinavKagidi) {
      Meteor.call('sinaviBitir', {sinavKagidiId: sinavKagidi._id});
    }
    t.sinavUyari.set(false);
    Session.set('sinavGoster',false);
    toastr.success('Tebrikler! Sınavı başarıyla bitirdin. Sonuçları mühür bilgi ekranından görebilirsin');
  },
  'click [data-soruIndex]': function(e,t) {
    var ix = e.currentTarget.getAttribute('data-soruIndex');
    t.seciliSoruIndex.set(ix);
    Tracker.afterFlush(function() {
      var seciliSoruIndex = t.seciliSoruIndex.get();
      var sinavKagidi = t.sinavKagidi.get();
      var yanitSayisi = sinavKagidi.yanitlar[seciliSoruIndex].yanitlandi;

      if (sinavKagidi && sinavKagidi.yanitlar[seciliSoruIndex].tip === 'siralama' && yanitSayisi >= 0) {
        var el = document.getElementById('siralama-'+sinavKagidi.yanitlar[seciliSoruIndex].soruId+'-'+yanitSayisi);
        if (el) {
          if (typeof siralamaSortable !== 'undefined') {
            siralamaSortable.destroy()
          }
          siralamaSortable = new Sortable(el, {
            forceFallback: true,
            onEnd: function() {
              $('#cozumAlani').animate({
                scrollTop: '-=500'
              }, 0)
            }
          });
          siralamaSortable.sort(_.map(sinavKagidi.yanitlar[seciliSoruIndex].yanit.secenekler, function(secenek) {return JSON.stringify(secenek).toString().toHashCode();}));
        }
      }
      if (sinavKagidi && sinavKagidi.yanitlar[seciliSoruIndex].tip === 'boslukDoldurma') {
        _.map(sinavKagidi.yanitlar[seciliSoruIndex].yanit.cevaplar, function(cevap,cIx) {
          t.$('input[type="text"]#'+cIx).val(cevap);
        })
      }
      if (sinavKagidi && sinavKagidi.yanitlar[seciliSoruIndex].tip === 'eslestirme') {
        var eslestirLength = sinavKagidi.yanitlar[seciliSoruIndex].yanit.sol.length;
        for(var sol=0;sol<eslestirLength;sol++) {
          for(var sag=0;sag<eslestirLength;sag++) {
            M.L.CizgiSil(sol,sag,'eslestirme');
          }
        }
        _.each(sinavKagidi.yanitlar[seciliSoruIndex].yanit.eslestirme, function(eslesme) {
          t.eslestirme.set('eslestirme'+ seciliSoruIndex,[null,null]);
          if (sinavKagidi.yanitlar[seciliSoruIndex].yanitlandi > 0) {
            M.L.CizgiCiz(eslesme[0],eslesme[1],'eslestirme');
          }
        })
      }
    })
  },
  'dblclick [data-soruIndex]': function(e,t) {
    var ix = e.currentTarget.getAttribute('data-soruIndex');
    var isaretliSorular = t.isaretliSorular.array();
    if (_.contains(isaretliSorular, ix)) {
      t.isaretliSorular.remove(ix);
    } else {
      t.isaretliSorular.push(ix);
    }
    t.$(e.currentTarget).toggleClass('isaretli');
  },
  'keydown .boslukDoldurSecenek, blur .boslukDoldurSecenek': function(e,t) {
    var len = t.$(e.currentTarget).val().length;
    if (len >= 7) {
      t.$(e.currentTarget).attr('size', len + 1);
    }
  },
  'click .eslestir': function(e,t) {
    //TODO: This is limited to 10 options
    var seciliSoruIndex = t.seciliSoruIndex.get();
    var sinavKagidi = t.sinavKagidi.get();
    var len = sinavKagidi ? sinavKagidi.yanitlar[seciliSoruIndex].yanit.eslestirme.length : 0;
    var id = e.currentTarget.getAttribute('id');
    var ix = parseInt(id.substr(4,1));
    if (id.substr(0,3) === 'sol') {
      for(var i=0;i<len;i++) {
        M.L.CizgiSil(ix,i,'eslestirme');
      }
      t.eslestirme.set('eslestirme'+ seciliSoruIndex,[ix,t.eslestirme.get('eslestirme'+ seciliSoruIndex)[1]]);
    } else {
      for(var i=0;i<len;i++) {
        M.L.CizgiSil(i,ix,'eslestirme');
      }
      t.eslestirme.set('eslestirme'+ seciliSoruIndex,[t.eslestirme.get('eslestirme'+ seciliSoruIndex)[0],ix]);
    }
    if (_.isNumber(t.eslestirme.get('eslestirme'+ seciliSoruIndex)[0]) && _.isNumber(t.eslestirme.get('eslestirme'+ seciliSoruIndex)[1])) {
      M.L.CizgiCiz(t.eslestirme.get('eslestirme'+ seciliSoruIndex)[0],t.eslestirme.get('eslestirme'+ seciliSoruIndex)[1],'eslestirme');
      t.eslestirme.set('eslestirme'+ seciliSoruIndex,[null,null]);
    }
  },
  'click .cizgi': function(e,t) {
    //TODO: This is limited to 10 options
    var seciliSoruIndex = t.seciliSoruIndex.get();
    var id = e.currentTarget.getAttribute('id');
    var sol = id.substr(4,1);
    var sag = id.substr(10,1);
    t.eslestirme.set('eslestirme'+ seciliSoruIndex,[null,null]);
    M.L.CizgiSil(sol,sag,'eslestirme');
  },
  'click .soruYanitla': function(e,t) {
    var eslestirmeEksik = false, dogruYanlisSecilmemis = false, coktanTekSecilmemis = false, coktanCokSecilmemis = false, boslukDoldurulmamis = false ;
    var seciliSoruIndex = t.seciliSoruIndex.get();
    var ix = parseInt(seciliSoruIndex);
    var aktifEgitimYili = M.C.AktifEgitimYili.findOne();
    var user = Meteor.user();
    var sinavKagidi = t.sinavKagidi.get();
    var tip = sinavKagidi && sinavKagidi.yanitlar[ix].tip;
    var ixLast = sinavKagidi && sinavKagidi.yanitlar.length - 1;

    var yanit = {};

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
        for (var i=0; i < sinavKagidi.yanitlar[ix].yanit.secenekler.length ; i++) {
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
        for (var i=0; i < sinavKagidi.yanitlar[ix].yanit.secenekler.length ; i++) {
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
      for (var i=0; i < sinavKagidi.yanitlar[ix].yanit.secenekler.length ; i++) {
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
          var id = $(this).attr('id');
          var sol = parseInt(id.substr(4,1));
          var sag = parseInt(id.substr(10,1));
          yanit.eslestirme.push([sol,sag]);
        });
      } else {
        eslestirmeEksik = true;
      }
    }

    if (tip === 'boslukDoldurma') {
      var bosBirakilanAdet = t.$('input[type="text"]').filter(function () {
        return M.L.Trim($(this).val()).length === 0
      }).length;
      if (bosBirakilanAdet === 0) {
        yanit = {
          cevaplar: []
        };
        for (var i=0; i < sinavKagidi.yanitlar[ix].yanit.cevaplar.length ; i++) {
          var bosluk = !!t.$('input[type="text"]#'+[i]).val() ? t.$('input[type="text"]#'+[i]).val() : '';
          yanit.cevaplar.push(bosluk);
        }
      } else {
        boslukDoldurulmamis = true;
      }
    }

    if (eslestirmeEksik) {
      toastr.error('Soruyu yanıtlamak için eşleştirmeleri tamamlamalısın');
    } else if (dogruYanlisSecilmemis) {
      toastr.error('Soruyu yanıtlamak için doğru veya yanlış olarak işaretlemelisin');
    } else if (coktanTekSecilmemis) {
      toastr.error('Soruyu yanıtlamak için bir seçenek işaretlemelisin');
    } else if (coktanCokSecilmemis) {
      toastr.error('Soruyu yanıtlamak için en az bir seçenek işaretlemelisin');
    } else  if (boslukDoldurulmamis) {
      toastr.error('Soruyu yanıtlamak için boşlukların hepsini doldurmalısın');
    } else {
      Meteor.call('soruYanitla', sinavKagidi._id,ix,yanit, function(err, res) {
        if (err) {
          toastr.error('Soruya verdiğin yanıt kaydedilemedi, lütfen daha sonra tekrar dene.');
        }
        if (res) {
          t.renderDate.set(new Date());
          Tracker.flush();
          var sinavKagidiGuncel = M.C.SinavKagitlari.findOne({
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
            // TODO: This is a hack. We should use the reactivevar setter but when we do, sortable does not initialize, so we should solve that one first
            t.$('[data-soruIndex="'+ix.toString()+'"]').click();
            toastr.error('Soruya verdiğin yanıt yanlış, düzeltip tekrar yanıtlayabilirsin.');
          } else {
            var newIx = ix === ixLast ? 0 : ix+1;
            if (newIx > 0) {
              // TODO: This is a hack. We should use the reactivevar setter but when we do, sortable does not initialize, so we should solve that one first
              t.$('[data-soruIndex="'+newIx.toString()+'"]').click();
              toastr.success('Soruya verdiğin yanıt kaydedildi.');
              if (ix+1 >= 14 && $('[data-soruIndex="'+newIx.toString()+'"]').position().left === 896) {
                t.$('.soruCubugu').animate({
                  scrollLeft: '+=64'
                }, 0);
              }
            } else {
              t.$('[data-soruIndex="'+ix.toString()+'"]').click();
              toastr.success('Soruya verdiğin yanıt kaydedildi ve bu sınavın son sorusuydu.');
            }
          }
        }
      });
    }

  }
});
