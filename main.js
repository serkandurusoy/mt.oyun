Meteor.startup(function() {
  if (Meteor.isClient) {
    console.log("======================================");
    console.log("Meteor client for " + Meteor.settings.public.APP + " started.");
    console.log("======================================");

    document.title = 'Mitolojix' + ( Meteor.settings.public.ENV === 'PRODUCTION' ? '' : (' ' + Meteor.settings.public.ENV) );

  }
});
