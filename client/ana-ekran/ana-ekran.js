Template.anaEkran.onCreated(function() {
  var template = this;
  template.autorun(function() {
    template.subscribe('girilmemisSinavVar', moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate());
  })
});
