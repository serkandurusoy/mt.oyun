import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';

import { M } from 'meteor/m:lib-core';

import './boy-tasi.html';

Template.boyTasi.onCreated(function() {
  this.filtreSube = new ReactiveVar('sube');
  this.filtreRutbe = new ReactiveVar({min: -1});
  this.autorun(() => {
    const userId = Meteor.userId();
    if (userId) {
      this.subscribe('sinifArkadaslarim', () => {
        Tracker.afterFlush(() => {
          let scrollPos = 0;
          const $userCard = $('#'+userId);
          if (!!$userCard.length) {
            scrollPos = parseInt($userCard.position().top) - 216;
          }
          this.$('.boyTasiWrapper').animate({
            scrollTop: scrollPos
          }, 0);
        })
      });
    }
  })
});

Template.boyTasi.helpers({
  filtreSube() {
    const filtreSube = Template.instance().filtreSube.get();
    const user = Meteor.user();
    if (user) {
      const sinif = _.findWhere(M.E.SinifObjects, {name: user.sinif}).kisa;
      if (filtreSube === 'sube') {
        return sinif + ' ' + user.sube;
      } else {
        return sinif;
      }
    }
    return false;
  },
  sinifArkadaslari() {
    const user = Meteor.user();
    const sinifArkadaslariCursor =  user && M.C.Users.find({sinif: user.sinif, puan: {$gte: 70}}, {sort: {puan: -1, dogumTarihi: -1, nameCollate: 1, lastNameCollate: 1, cinsiyet: -1}});
    return sinifArkadaslariCursor && sinifArkadaslariCursor.count() && sinifArkadaslariCursor;
  },
  sakla(userId) {
    const user = Meteor.user();
    const filtreSube = Template.instance().filtreSube.get();
    const filtreRutbe = Template.instance().filtreRutbe.get();
    let saklanacaklar = [];

    if (filtreSube === 'sube') {
      M.C.Users.find({
        $or: [
          {sinif: {$ne: user.sinif}},
          {sube: {$ne: user.sube}}
        ]
      }).forEach(u => {
        saklanacaklar.push(u._id);
      })
    }

    if (filtreRutbe.min > -1) {
      M.C.Users.find({
        $or: [
          {puan: {$lt: filtreRutbe.min}},
          {puan: {$gte: filtreRutbe.max}}
        ]
      }).forEach(u => {
        saklanacaklar.push(u._id);
      })
    }

    return _.contains(saklanacaklar, userId);

  }
});

Template.boyTasi.events({
  'click .filtreleSube'(e,t) {
    e.preventDefault();
    const filtreSube = t.filtreSube.get();
    if (filtreSube === 'sinif') {
      t.filtreSube.set('sube');
    } else {
      t.filtreSube.set('sinif');
    }
    Tracker.afterFlush(() => {
      const $container = $('.boyTasiWrapper');
      const $userCard = $('#'+Meteor.userId());
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
  'click .filtreleRutbe'(e,t) {
    e.preventDefault();
    const filtreRutbe = t.filtreRutbe.get();

    const rutbeArray = [
      {min: -1},
      //{min: 0, max: 50},
      //{min: 50, max: 70},
      {min: 70, max: 74},
      {min: 74, max: 78},
      {min: 78, max: 82},
      {min: 82, max: 86},
      {min: 86, max: 90},
      {min: 90, max: 95},
      {min: 95, max: 101}
    ];

    const startAt = rutbeArray.findIndex(rutbe => rutbe.min === filtreRutbe.min);

    t.filtreRutbe.set(M.L.cyclicIterator(rutbeArray, startAt).getNext());

    Tracker.afterFlush(() => {
      const $container = $('.boyTasiWrapper');
      const $userCard = $('#'+Meteor.userId());
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
  'click .yukariya'(e,t) {
    t.$('.boyTasiWrapper').animate({
      scrollTop: '-=216'
    }, 0);
  },
  'click .asagiya'(e,t) {
    t.$('.boyTasiWrapper').animate({
      scrollTop: '+=216'
    }, 0);
  }
});
