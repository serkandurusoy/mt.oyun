import { Template } from 'meteor/templating';

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import './not-found.html';

Template.notFound.events({
  'click'() {
    FlowRouter.go('anaEkran');
  }
});
