BlazeLayout.setRoot('body');

Reload.delay = 4000;
Reload.beforeHook = function() {
  if (Meteor.userId()) {
    toastr.error('Birkaç saniye içinde Mitolojix uygulamasının güncel sürümüne yükseltileceksiniz.');
  }
};

Meteor.startup(function() {
  Session.setDefault('sinavGoster',false);
  Session.setDefault('sinavYanitGoster',null);
  Session.setDefault('devamEdenSinavVar',false);
});

Template.layout.onCreated(function() {
  var template = this;

  template.autorun(function() {
    var user = Meteor.user();
    var aktifEgitimYili = M.C.AktifEgitimYili.findOne();
    var sinavKagidi = user && aktifEgitimYili && M.C.SinavKagitlari.findOne({
      ogrenci: user._id,
      kurum: user.kurum,
      sinif: user.sinif,
      egitimYili: aktifEgitimYili.egitimYili,
      bitirmeZamani: {$exists: false},
      ogrenciSinavaGirdi: true
    });
    var sinavAktif = sinavKagidi && M.C.Sinavlar.findOne({
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

Template.layout.onRendered(function() {
  if (Reload.didHotReload) {
    if (Meteor.userId()) {
      toastr.success('Mitolojix uygulamasının güncel sürümüne başarıyla yükseltildiniz.', null, {onHidden: function() {Reload.didHotReload = false;}});
    }
  }
});

Template.layout.helpers({
  yardimGoster: function() {
    return Session.get('yardimGoster');
  },
  deviceOK: function() {
    return bowser.a && (
        (window.screen.height >= 768 && window.screen.width >= 1024) ||
        (window.screen.width >= 768 && window.screen.height >= 1024) ||
        (window.matchMedia( '(min-device-height: 768px)' ).matches && window.matchMedia( '(min-device-width: 1024px)' ).matches) ||
        (window.matchMedia( '(min-device-width: 768px)' ).matches && window.matchMedia( '(min-device-height: 1024px)' ).matches)
      );
  },
  fullScreenTest: function() {
    return {
      enabled: screenfull.enabled,
      active: M.L.reactiveFullScreenStatus.get()
    }
  }
});

Template.registerHelper('isHotReloading', function() {
  return Reload.isHotReloading;
});

Template.registerHelper('sinavGoster', function() {
  return Session.get('sinavGoster');
});

Template.registerHelper('sinavYanitGoster', function() {
  return Session.get('sinavYanitGoster');
});

Template.registerHelper('devamEdenSinavVar', function() {
  return Session.get('devamEdenSinavVar');
});

Template.body.onRendered(function() {
//  prevent rubber band overscroll behavior on mobile browsers
//  allows native default behavior for elements inside body, but not
//  for the scrolling the page itself

  $(function () {
    var onScroll = true;
    $('html').on('touchstart', function (event) {
      var target = event.target;
      while (target && target.style) {
        //  must be scrollable and have room to
        //  scroll to allow native scrolling
        var scrolling = false;
        if ($(target).css('overflow-y') == 'scroll' &&  target.scrollHeight > $(target).height()) {
          var max = target.scrollHeight - $(target).height() - 1;
          var min = 1;
          $(target).scrollTop(Math.min(max, Math.max(min, $(target).scrollTop())))
          scrolling = true;
        }
        if ($(target).css('overflow-x') == 'scroll' &&  target.scrollWidth > $(target).width()) {
          var max = target.scrollWidth - $(target).width() - 1;
          var min = 1;
          $(target).scrollLeft(Math.min(max, Math.max(min, $(target).scrollLeft())))
          scrolling = true;
        }
        if (scrolling) return;
        target = target.parentNode;
      }
      onScroll = false;
    });

    $('html').on('touchend', function (event) { onScroll = true; });

    $('html').on('touchmove', function (event) {
      if (onScroll) {}
      else {
        event.preventDefault();
      }
    });
  });
});
