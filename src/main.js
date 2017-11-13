import environment from './environment';

//Configure Bluebird Promises.
//Note: You may want to use environment-specific configuration.
Promise.config({
  warnings: {
    wForgottenReturn: false
  }
});

		
export function configure(aurelia) {
  aurelia.use
    .standardConfiguration()
    .feature('resources')
/*    .plugin('aurelia-animator-velocity', instance => {
      instance.enterAnimation.options.duration = 350;
      instance.leaveAnimation.options.duration = 350;
    	})   */ 
    ;

  if (environment.debug) {
    aurelia.use.developmentLogging();
  }

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }

  aurelia.start().then(() => aurelia.setRoot());
}
