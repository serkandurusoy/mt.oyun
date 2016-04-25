Template.coverModalPrompt.events({
  'click': function(e,t) {
    e.preventDefault();
    Blaze.remove(Blaze.currentView);
  }
});
