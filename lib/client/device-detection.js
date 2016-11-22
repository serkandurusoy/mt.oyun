import { Template } from 'meteor/templating';

import { bowser } from 'meteor/flowkey:bowser';

Template.registerHelper('desktopDevice', function() {
  return !(bowser.mobile || bowser.tablet);
});
