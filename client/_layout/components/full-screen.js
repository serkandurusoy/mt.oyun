Template.fullScreen.events({
  'click': function(e,t) {
    if (BigScreen.enabled) {
      BigScreen.toggle();
    } else {
      console.log('Bigscreen is not enabled!');
    }
  }
});
