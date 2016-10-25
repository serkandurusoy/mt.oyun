Meteor.startup(() => {
	Template.connectionBanner.events({
		'click .connectionBanner'(event, template){
			event.preventDefault();
			Meteor.reconnect();
		}
	});

	Template.connectionBanner.helpers({
		'wasConnected'(event, template){
			return Session.equals('MeteorConnection-wasConnected', true);
		},
		'isDisconnected'(event, template){
			return Session.equals('MeteorConnection-isConnected', false);
		},
		'retryTimeSeconds'(event, template){
			return Session.get('MeteorConnection-retryTimeSeconds');
		},
		'failedReason'(event, template){
			return Session.get('MeteorConnection-failedReason');
		},
		'connectionLostTitle'(event, template){
			return 'Bağlantı Sorunu';
		},
		'connectionLostText'(event, template){
			return 'Sunucu ile bağlantı koptu.';
		},
		'tryReconnectText'(event, template){
			return 'Tekrar bağlanmayı denemek için buraya ' + ((bowser.mobile || bowser.tablet) ? 'dokunun': 'tıklayın') + '.';
		},
		'reconnectBeforeCountdownText'(event, template){
			return 'Bağlantıyı tekrar denemek için kalan süre ';
		},
		'reconnectAfterCountdownText'(event, template){
			return ' saniye.';
		}
	});

	Session.setDefault('MeteorConnection-isConnected', true);
	Session.setDefault('MeteorConnection-wasConnected', false);
	Session.setDefault('MeteorConnection-retryTimeSeconds', 0);
	Session.setDefault('MeteorConnection-failedReason', null);
	let connectionRetryUpdateInterval;

	Tracker.autorun(() => {
		const isConnected = Meteor.status().connected;
		if(isConnected){
			Session.set('MeteorConnection-wasConnected', true);
			Meteor.clearInterval(connectionRetryUpdateInterval);
			connectionRetryUpdateInterval = undefined;
			Session.set('MeteorConnection-retryTimeSeconds', 0);
			Session.set('MeteorConnection-failedReason', null);
		}else{
			if(Session.equals('MeteorConnection-wasConnected', true)){
				if(!connectionRetryUpdateInterval)
					connectionRetryUpdateInterval = Meteor.setInterval(() => {
						let retryIn = Math.round((Meteor.status().retryTime - (new Date()).getTime())/1000);
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
