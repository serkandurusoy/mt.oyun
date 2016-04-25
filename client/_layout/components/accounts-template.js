Template.accountsTemplate.helpers({
  resetFlow: function() {
    return Session.get('resetToken');
  }
});

Template.resetForm.helpers({
  accountButtonsDisabled: function() {
    return Session.get('accountButtonsDisabled');
  }
});

Template.resetForm.events({
  'click [data-trigger="cancel"]' : function(e,t) {
    e.preventDefault();
    M.L.clearSessionVariable('resetToken');
    if (M.L.VerificationDoneCallback) {
      M.L.VerificationDoneCallback();
    }
  },
  'submit form': function(e,t) {
    e.preventDefault();
    var password = M.L.Trim(t.$('[name="password"]').val());
    var confirm = M.L.Trim(t.$('[name="confirm"]').val());
    check(password, String);
    check(confirm, String);

    if (password!== confirm) {
      toastr.error('Şifre ile tekrarı aynı olmalı.');
    } else {
      Session.set('accountButtonsDisabled', 'disabled');
      Meteor.call('getSifreZorlukFromToken', Session.get('resetToken'), function(error, result) {
        if (error) {
          M.L.clearSessionVariable('accountButtonsDisabled');
          Blaze.renderWithData(Template.coverModalPrompt, {message: 'Geçersiz bağlantı. Yeniden istek oluşturmalısın.'}, document.body);
        } else {
          var userId = result.userId;
          var sifreZorluk = result.sifreZorluk;
          if ( !M.L.validatePasswordStrength(userId, password, sifreZorluk) ) {
            M.L.clearSessionVariable('accountButtonsDisabled');
            toastr.error(_.findWhere(M.E.SifreObjects, {name: sifreZorluk}).detail);
          } else {
            Accounts.resetPassword(
              Session.get('resetToken'),
              password,
              function(err) {
                M.L.clearSessionVariable('accountButtonsDisabled');
                if (err) {
                  if (err.error && err.error === 403) {
                    Blaze.renderWithData(Template.coverModalPrompt, {message: 'Geçersiz bağlantı. Yeniden istek oluşturmalısın.'}, document.body);
                  } else {
                    Blaze.renderWithData(Template.coverModalPrompt, {message: M.E.BilinmeyenHataMessage}, document.body);
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
  accountButtonsDisabled: function() {
    return Session.get('accountButtonsDisabled');
  }
});

Template.loginForm.events({
  'click [data-trigger="forgotPassword"]' : function(e,t) {
    e.preventDefault();
    var kullanici = M.L.LatinizeLower(M.L.Trim(t.$('[name="kullanici"]').val()));
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
          function(err) {
            M.L.clearSessionVariable('accountButtonsDisabled');
            Blaze.renderWithData(Template.coverModalPrompt, {message: 'Lütfen e-posta kutunu kontrol et.<br/>Yeni bir şifre tanımlayabilmen için gerekli adımı içeren bir mesaj birkaç dakika içinde e-posta adresine iletilecek.'}, document.body);
          }
        )
      }
    }

  },
  'submit form': function(e,t) {
    e.preventDefault();
    var kullanici = M.L.LatinizeLower(M.L.Trim(t.$('[name="kullanici"]').val()));
    var password = M.L.Trim(t.$('[name="password"]').val());
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
        function (err) {
          M.L.clearSessionVariable('accountButtonsDisabled');
          if (err) {
            Tracker.afterFlush(function() {
              Meteor.defer(function() {
                var $kullanici = $('[name="kullanici"]');
                var $password = $('[name="password"]');
                if (!!$kullanici.length && !!$password.length ) {
                  $kullanici.val(kullanici);
                  $password.val(password);
                }
              })
            });
            if (err.error && err.error === 403) {
              toastr.error('E-posta adresi veya şifre hatalı.');
            } else {
              Blaze.renderWithData(Template.coverModalPrompt, {message: M.E.BilinmeyenHataMessage}, document.body);
            }
          } else {
            Meteor.logoutOtherClients();
          }
        }
      );
    }

  }
});
