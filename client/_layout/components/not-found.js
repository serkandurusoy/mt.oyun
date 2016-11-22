import { Template } from 'meteor/templating';

import { FlowRouter } from 'meteor/kadira:flow-router';

import './not-found.html';

Template.notFound.events({
  'click'() {
    FlowRouter.go('anaEkran');
  }
});
