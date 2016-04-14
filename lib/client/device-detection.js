Template.registerHelper('desktopDevice', function() {
  return !(bowser.mobile || bowser.tablet);
});
