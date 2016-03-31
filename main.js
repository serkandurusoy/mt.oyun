Meteor.startup(function() {
  if (Meteor.isClient) {
    console.log("======================================");
    console.log("Meteor client for " + Meteor.settings.public.APP + " started.");
    console.log("======================================");
  }
});
