Template.anaEkran.onCreated(function() {
  this.autorun(() => {
    this.subscribe('girilmemisSinavVar', moment(TimeSync.serverTime(null, 5 * 60 * 1000)).toDate());
  })
});
