import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { check } from 'meteor/check';
import { Blaze } from 'meteor/blaze';
import { Accounts } from 'meteor/accounts-base';
import { Tracker } from 'meteor/tracker';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';

import { FlowRouter } from 'meteor/kadira:flow-router';

import { M } from 'meteor/m:lib-core';

import './accounts-template.html';

Template.accountsTemplate.helpers({
  resetFlow() {
    return Session.get('resetToken');
  }
});

Template.resetForm.helpers({
  accountButtonsDisabled() {
    return Session.get('accountButtonsDisabled');
  }
});

Template.resetForm.events({
  'click [data-trigger="cancel"]'(e,t) {
    e.preventDefault();
    M.L.clearSessionVariable('resetToken');
    if (M.L.VerificationDoneCallback) {
      M.L.VerificationDoneCallback();
    }
  },
  'submit form'(e,t) {
    e.preventDefault();
    const password = M.L.Trim(t.$('[name="password"]').val());
    const confirm = M.L.Trim(t.$('[name="confirm"]').val());
    check(password, String);
    check(confirm, String);

    if (password!== confirm) {
      toastr.error('Şifre ile tekrarı aynı olmalı.');
    } else {
      Session.set('accountButtonsDisabled', 'disabled');
      Meteor.call('getSifreZorlukFromToken', Session.get('resetToken'), (error, result) => {
        if (error) {
          M.L.clearSessionVariable('accountButtonsDisabled');
          Blaze.renderWithData(Template.coverModalPromptPersistent, {message: 'Geçersiz bağlantı. Yeniden istek oluşturmalı ve en son gelen e-posta mesajındaki bağlantıya tıklamalısın.'}, document.body);
        } else {
          const {
            userId,
            sifreZorluk,
          } = result;
          if ( !M.L.validatePasswordStrength(userId, password, sifreZorluk) ) {
            M.L.clearSessionVariable('accountButtonsDisabled');
            toastr.error(_.findWhere(M.E.SifreObjects, {name: sifreZorluk}).detail);
          } else {
            Accounts.resetPassword(
              Session.get('resetToken'),
              password,
              (err) => {
                M.L.clearSessionVariable('accountButtonsDisabled');
                if (err) {
                  if (err.error && err.error === 403) {
                    Blaze.renderWithData(Template.coverModalPromptPersistent, {message: 'Geçersiz bağlantı. Yeniden istek oluşturmalı ve en son gelen e-posta mesajındaki bağlantıya tıklamalısın.'}, document.body);
                  } else {
                    Blaze.renderWithData(Template.coverModalPromptPersistent, {message: M.E.BilinmeyenHataMessage}, document.body);
                  }
                } else {
                  M.L.clearSessionVariable('resetToken');
                  if (M.L.VerificationDoneCallback) {
                    M.L.VerificationDoneCallback();
                  }
                  FlowRouter.go('anaEkran');
                }
              }
            );
          }
        }
      });
    }
  }
});

Template.loginForm.helpers({
  accountButtonsDisabled() {
    return Session.get('accountButtonsDisabled');
  }
});

Template.loginForm.events({
  'click [data-trigger="forgotPassword"]'(e,t) {
    e.preventDefault();
    const kullanici = M.L.LatinizeLower(M.L.Trim(t.$('[name="kullanici"]').val()));
    check(kullanici, String);
    M.L.clearSessionVariable('resetToken');

    if (kullanici.length < 1) {
      toastr.error('E-posta adresi girmelisin.');
    } else {
      if (!M.L.TestEmail(kullanici)) {
        toastr.error('E-posta adresi girmelisin.');
      } else {
        Session.set('accountButtonsDisabled', 'disabled');
        Accounts.forgotPassword(
          {email: kullanici},
          (err) => {
            M.L.clearSessionVariable('accountButtonsDisabled');
            Blaze.renderWithData(Template.coverModalPromptPersistent, {message: '<span style="font-size: 16px;">Lütfen <strong>' + kullanici + '</strong> adresine ait e-posta kutunu kontrol et. Yeni bir şifre tanımlayabilmen için gerekli adımı içeren bir mesaj birkaç dakika içinde e-posta adresine iletilecek. Eğer birden fazla talep yaptıysan ya da e-posta kutunda bu konuda birden fazla mesaj görürsen, <strong>en son gelen mesajı</strong> dikkate almalısın.</span>'}, document.body);
          }
        )
      }
    }

  },
  'submit form'(e,t) {
    e.preventDefault();
    const kullanici = M.L.LatinizeLower(M.L.Trim(t.$('[name="kullanici"]').val()));
    const password = M.L.Trim(t.$('[name="password"]').val());
    check(kullanici, String);
    check(password, String);

    M.L.clearSessionVariable('resetToken');

    if (!M.L.TestEmail(kullanici)) {
      toastr.error('E-posta adresi girmelisin.');
    } else {
      Session.set('accountButtonsDisabled', 'disabled');
      Meteor.loginWithPassword(
        {email: kullanici},
        password,
        (err) => {
          M.L.clearSessionVariable('accountButtonsDisabled');
          if (err) {
            Tracker.afterFlush(() => {
              Meteor.defer(() => {
                let $kullanici = $('[name="kullanici"]');
                let $password = $('[name="password"]');
                if (!!$kullanici.length && !!$password.length ) {
                  $kullanici.val(kullanici);
                  $password.val(password);
                }
              })
            });
            if (err.error && err.error === 403) {
              toastr.error('E-posta adresi veya şifre hatalı.');
            } else {
              Blaze.renderWithData(Template.coverModalPromptPersistent, {message: M.E.BilinmeyenHataMessage}, document.body);
            }
          } else {
            Meteor.logoutOtherClients();
          }
        }
      );
    }

  }
});
