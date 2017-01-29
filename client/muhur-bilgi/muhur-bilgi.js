import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';

import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { moment } from 'meteor/momentjs:moment';
import { TimeSync } from 'meteor/mizzao:timesync';

import { M } from 'meteor/m:lib-core'

import './muhur-bilgi.html';

Template.muhurBilgi.onCreated(function() {

  this.autorun(() =>{
    const devamEdenSinavVar = Session.get('devamEdenSinavVar');
    const sinavId = FlowRouter.getParam('_id');

    if (devamEdenSinavVar !== sinavId) {
      this.subscribe('sinav', sinavId, moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate());
    }
  })

});

Template.muhurBilgi.helpers({
  sinav() {
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
  kapanisZamaniFormat() {
    const sinav = M.C.Sinavlar.findOne({
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
    } else {
      return 'DD MMMM YYYY HH:mm';
    }
  },
  yanitGorulebilir() {
    const devamEdenSinavVar = Session.get('devamEdenSinavVar');
    const sinavId = FlowRouter.getParam('_id');
    const user = Meteor.user();

    if (devamEdenSinavVar) {
      return false;
    }

    if (!user) {
      return false;
    }

    const sinav = M.C.Sinavlar.findOne({
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


    const {
      _id: ogrenci,
      kurum,
      sinif,
    } = user;

    const buSinavAlinmis = user && M.C.SinavKagitlari.findOne({
        ogrenci,
        kurum,
        sinif,
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
  sinavaBaslanabilir() {
    const devamEdenSinavVar = Session.get('devamEdenSinavVar');
    const sinavId = FlowRouter.getParam('_id');
    const user = Meteor.user();

    if (devamEdenSinavVar) {
      return false;
    }

    if (!user) {
      return false;
    }

    const sinav = M.C.Sinavlar.findOne({
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

    const {
      _id: ogrenci,
      kurum,
      sinif,
    } = user;

    const buSinavAlinmis = user && M.C.SinavKagitlari.findOne({
        ogrenci,
        kurum,
        sinif,
        egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
        sinav: sinavId
      });

    if (buSinavAlinmis) {
      return false;
    }

    return true;

  },
  sinavDevamEdiyor() {
    const devamEdenSinavVar = Session.get('devamEdenSinavVar');
    const sinavId = FlowRouter.getParam('_id');
    return devamEdenSinavVar === sinavId;
  },
  baskaSinavDevamEdiyor() {
    const devamEdenSinavVar = Session.get('devamEdenSinavVar');
    const sinavId = FlowRouter.getParam('_id');
    return devamEdenSinavVar && devamEdenSinavVar !== sinavId && M.C.Muhurler.findOne({_id: M.C.Sinavlar.findOne({_id: devamEdenSinavVar}).muhur}).isim;
  },
  sinavAlinmamisAmaBaskaSinavDevamEdiyor() {
    const devamEdenSinavVar = Session.get('devamEdenSinavVar');
    const sinavId = FlowRouter.getParam('_id');
    const user = Meteor.user();

    if (!user) {
      return false;
    }

    const {
      _id: ogrenci,
      kurum,
      sinif,
    } = user;

    const buSinavAlinmis = user && M.C.SinavKagitlari.findOne({
        ogrenci,
        kurum,
        sinif,
        egitimYili: M.C.AktifEgitimYili.findOne().egitimYili,
        sinav: sinavId
      });

    if (buSinavAlinmis) {
      return false;
    }

    if (devamEdenSinavVar) {
      const sinav = M.C.Sinavlar.findOne({
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
  'click [data-trigger="geriDon"]'(e,t) {
    Session.set('detayindanDonulenSinavId', FlowRouter.getParam('_id'));
    FlowRouter.go('muhurTasi');
  },
  'click [data-trigger="sinavaBasla"]'(e,t) {
    BlazeLayout.render('layout', { main: 'sinavaBasla' });
  },
  'click [data-trigger="sinavaDevam"]'(e,t) {
    Session.set('sinavGoster', true);
  },
  'click [data-trigger="sinavYanitGoster"]'(e,t) {
    Session.set('sinavYanitGoster', FlowRouter.getParam('_id'));
  }
});

Template.sinavaBasla.onCreated(function() {
  this.autorun(() => {
    const sinavId = FlowRouter.getParam('_id');
    this.subscribe('sinav', sinavId, moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate());
  })

});

Template.sinavaBasla.helpers({
  sinav() {
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
  'click .baslamaktanVazgec'() {
    BlazeLayout.render('layout', { main: 'muhurBilgi' });
  },
  'click .baslamayiOnayla'() {
    BlazeLayout.render('layout', { main: 'muhurBilgi' });
    const sinavId = FlowRouter.getParam('_id');
    if (sinavId) {
      Meteor.call('sinavaBasla', {sinavId}, (err,res) => {
        if (res) {
          Session.set('sinavGoster',true);
        }
      });
    }
  }
});
