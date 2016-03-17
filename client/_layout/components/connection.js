Meteor.startup(function(){
	Template.connectionBanner.events({
		'click .connectionBanner': function(event, template){
			event.preventDefault();
			Meteor.reconnect();
		}
	});

	Template.connectionBanner.helpers({
		'wasConnected': function(event, template){
			return Session.equals('MeteorConnection-wasConnected', true);
		},
		'isDisconnected': function(event, template){
			return Session.equals('MeteorConnection-isConnected', false);
		},
		'retryTimeSeconds': function(event, template){
			return Session.get('MeteorConnection-retryTimeSeconds');
		},
		'failedReason': function(event, template){
			return Session.get('MeteorConnection-failedReason');
		},
		'connectionLostTitle': function(event, template){
			return 'Bağlantı Sorunu';
		},
		'connectionLostText': function(event, template){
			return 'Sunucu ile bağlantı koptu.';
		},
		'tryReconnectText': function(event, template){
			return 'Tekrar bağlanmayı denemek için buraya ' + (Darwin.device.type === 'desktop' ? 'tıklayın': 'dokunun') + '.';
		},
		'reconnectBeforeCountdownText': function(event, template){
			return 'Bağlantıyı tekrar denemek için kalan süre ';
		},
		'reconnectAfterCountdownText': function(event, template){
			return ' saniye.';
		}
	});

	Session.setDefault('MeteorConnection-isConnected', true);
	Session.setDefault('MeteorConnection-wasConnected', false);
	Session.setDefault('MeteorConnection-retryTimeSeconds', 0);
	Session.setDefault('MeteorConnection-failedReason', null);
	var connectionRetryUpdateInterval;

	Tracker.autorun(function(){
		var isConnected = Meteor.status().connected;
		if(isConnected){
			Session.set('MeteorConnection-wasConnected', true);
			Meteor.clearInterval(connectionRetryUpdateInterval);
			connectionRetryUpdateInterval = undefined;
			Session.set('MeteorConnection-retryTimeSeconds', 0);
			Session.set('MeteorConnection-failedReason', null);
		}else{
			if(Session.equals('MeteorConnection-wasConnected', true)){
				if(!connectionRetryUpdateInterval)
					connectionRetryUpdateInterval = Meteor.setInterval(function(){
						var retryIn = Math.round((Meteor.status().retryTime - (new Date()).getTime())/1000);
						if(isNaN(retryIn))
							retryIn = 0;
						Session.set('MeteorConnection-retryTimeSeconds', retryIn);
						Session.set('MeteorConnection-failedReason', Meteor.status().reason);
					},500);
			}
		}
		Session.set('MeteorConnection-isConnected', isConnected);
	});
});
