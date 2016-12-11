import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Reload } from 'meteor/reload';
import { bowser } from 'meteor/flowkey:bowser';

import { M } from 'meteor/m:lib-core';

import './layout.html';

window.M = M;

BlazeLayout.setRoot('body');

Reload.delay = 4000;
Reload.beforeHook = () => {
  if (Meteor.userId()) {
    toastr.error('Birkaç saniye içinde Mitolojix uygulamasının güncel sürümüne yükseltileceksiniz.');
  }
};

Meteor.startup(() => {
  Session.setDefault('sinavGoster',false);
  Session.setDefault('sinavYanitGoster',null);
  Session.setDefault('devamEdenSinavVar',false);
});

Template.layout.onCreated(function() {

  this.autorun(() => {
    const user = Meteor.user();
    const aktifEgitimYili = M.C.AktifEgitimYili.findOne();

    const sinavKagidi = user && aktifEgitimYili && M.C.SinavKagitlari.findOne({
      ogrenci: user._id,
      kurum: user.kurum,
      sinif: user.sinif,
      egitimYili: aktifEgitimYili.egitimYili,
      bitirmeZamani: {$exists: false},
      ogrenciSinavaGirdi: true
    });
    const sinavAktif = sinavKagidi && M.C.Sinavlar.findOne({
      _id: sinavKagidi.sinav,
      iptal: false
    });
    if (sinavAktif) {
      Session.set('devamEdenSinavVar',sinavAktif._id);
    } else {
      Session.set('devamEdenSinavVar',false);
      Session.set('sinavGoster',false);
    }
  });

});

Template.layout.onRendered(() => {
  if (Reload.didHotReload) {
    if (Meteor.userId()) {
      toastr.success('Mitolojix uygulamasının güncel sürümüne başarıyla yükseltildiniz.', null, {onHidden: () => Reload.didHotReload = false});
    }
  }
});

Template.layout.helpers({
  env() {
    return Meteor.settings.public.ENV === 'PRODUCTION' ? false : Meteor.settings.public.ENV
  },
  yardimGoster() {
    return Session.get('yardimGoster');
  },
  deviceOK() {
    return bowser.a && (
        (window.screen.height >= 768 && window.screen.width >= 1024) ||
        (window.screen.width >= 768 && window.screen.height >= 1024) ||
        (window.matchMedia( '(min-device-height: 768px)' ).matches && window.matchMedia( '(min-device-width: 1024px)' ).matches) ||
        (window.matchMedia( '(min-device-width: 768px)' ).matches && window.matchMedia( '(min-device-height: 1024px)' ).matches)
      );
  },
  notSafari() {
    return !bowser.safari;
  }
});

Template.registerHelper('isHotReloading', () => {
  return Reload.isHotReloading;
});

Template.registerHelper('sinavGoster', () => {
  return Session.get('sinavGoster');
});

Template.registerHelper('sinavYanitGoster', () => {
  return Session.get('sinavYanitGoster');
});

Template.registerHelper('devamEdenSinavVar', () => {
  return Session.get('devamEdenSinavVar');
});

Template.body.onRendered(() => {
//  prevent rubber band overscroll behavior on mobile browsers
//  allows native default behavior for elements inside body, but not
//  for the scrolling the page itself

  $(() => {
    let onScroll = true;
    $('html').on('touchstart', event => {
      let target = event.target;
      while (target && target.style) {
        //  must be scrollable and have room to
        //  scroll to allow native scrolling
        let scrolling = false;
        if ($(target).css('overflow-y') == 'scroll' &&  target.scrollHeight > $(target).height()) {
          const max = target.scrollHeight - $(target).height() - 1;
          const min = 1;
          $(target).scrollTop(Math.min(max, Math.max(min, $(target).scrollTop())))
          scrolling = true;
        }
        if ($(target).css('overflow-x') == 'scroll' &&  target.scrollWidth > $(target).width()) {
          const max = target.scrollWidth - $(target).width() - 1;
          const min = 1;
          $(target).scrollLeft(Math.min(max, Math.max(min, $(target).scrollLeft())))
          scrolling = true;
        }
        if (scrolling) return;
        target = target.parentNode;
      }
      onScroll = false;
    });

    $('html').on('touchend', event => onScroll = true);

    $('html').on('touchmove', event => {
      if (onScroll) {}
      else {
        event.preventDefault();
      }
    });
  });
});
