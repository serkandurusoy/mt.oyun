import { Template } from 'meteor/templating';

import './full-screen.html';

Template.fullScreen.events({
  'click'(e,t) {
    if (screenfull.enabled) {
      screenfull.request();
    } else {
      console.log('Fullscreen API is not enabled for this browser!');
    }
  }
});
