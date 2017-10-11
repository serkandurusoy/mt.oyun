import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';

import './coverModalPrompt.html';

Template.coverModalPrompt.events({
  'click'(e,t) {
    e.preventDefault();
    Blaze.remove(Blaze.currentView);
  }
});
