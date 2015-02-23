/*
 * PLATINO APPLICATIONWINDOW.JS
 */

var platino = require('co.lanica.platino');


function ApplicationWindow() {
	
	
	var closing = false;                                                      // closing is a flag that ensures closing event is executed only once (Android)
	
	
	/*
	 * CREATE WINDOW INSTANCE
	 */
	
	var win = Ti.UI.createWindow({
		backgroundColor:'black',
		orientationModes: [Ti.UI.LANDSCAPE_LEFT, Ti.UI.LANDSCAPE_RIGHT,/*Ti.UI.PORTRAIT, Ti.UI.UPSIDE_PORTRAIT*/],
		fullscreen:true,
		navBarHidden : true,
		keepScreenOn:true
	});
	
	win.addEventListener('android:back', androidBackButtonPressed);           // Show exit dialog when Android back button is pressed
	win.addEventListener('close', closeWindow);                               // Listener when ApplicationWindow is closed
	
	
	
	/*
	 * CREATE GAME INSTANCE
	 * Only one GameView instance is allowed in your app. This is required for every Platino app. All Scene instances are added to the GameView to be displayed.
	 */
	
	var game = platino.createGameView({
		fps:60,                                                 // Game frame rate. Set 30fps for Iphone4, iPad1 and old android devices
		debug:false,                                            // Enable debug logs
		enableOnDrawFrameEvent: true,                           // Disable / enable 'enterframe' event
		enableOnLoadSpriteEvent:false,                          // Enable/Disable onloadsprite event
		enableOnLoadTextureEvent:false,                         // Enable/Disable onloadtexture event
		textureFilter : platino.OPENGL_LINEAR,                  // update game view texture settings for smooth rendering
		TARGET_SCREEN : {width:2048, height:1536},              // set screen size for the game (in this case, iPad resolution)
		touchScaleX:1,                                          // TouchScaleX. Property to detect touches correctly on different resolutions (updateScreenSize) 
		touchScaleY:1,                                          // TouchScaleY. Property to detect touches correctly on different resolutions (updateScreenSize) 
		usePerspective:true,                                    // Sets/gets viewpoint type of the GameView (perspective or orthogonal).
		timerType: platino.ENGINE_TIMER_NSTIMER,                // iOS-only. Gets/sets timer type for drawing
		setupSpriteSize : function(sprite) {                    // Adjust the size of sprite for different resolutions
			var width = sprite.width / game.screenScale;
			var height = sprite.height / game.screenScale;
			sprite.width = (width < 1) ? 1 : width;
			sprite.height = (height < 1) ? 1 : height;
		}
	
	});
	
	game.color(0, 0, 0);                                     // set initial background color to black
	
	game.addEventListener('onload', onGameActivated);
	game.addEventListener('onsurfacechanged',onSurfaceChanged);
	game.addEventListener('onfps', showFPS);
	
	
	/*
	 * FUNCTIONS
	 */
	
	function updateScreenSize() {
	 	
		// Your game screen size is set here if you did not specifiy game width and height using screen property.
		// Note: game.size.width and height may be changed due to the parent layout so check them here.
		
		var screenScale = game.size.height / game.TARGET_SCREEN.height;
		   
		Ti.API.info("view size: " + game.size.width + "x" + game.size.height);
		Ti.API.info("game screen size: " + game.screen.width + "x" + game.screen.height);
		 
		game.screen = {width:game.size.width / screenScale, height:game.size.height / screenScale};
		    
		    
		if(Ti.Platform.osname==='android'){
		
			game.touchScaleX = game.screen.width  / Titanium.Platform.displayCaps.platformWidth;
			game.touchScaleY = game.screen.height / Titanium.Platform.displayCaps.platformHeight;
			
		}else{
			
			game.touchScaleX = game.screen.width  / game.size.width;
			game.touchScaleY = game.screen.height / game.size.height;
			
		};

		game.screenScale = game.screen.height / game.TARGET_SCREEN.height;
		
		game.STAGE_START = { x:0, y:0 };
		game.STAGE_END   = { x:game.TARGET_SCREEN.width, y:game.screen.height };
	
	
	};
	
	
	
	/*
	 * LISTENERS
	 */
		
	function onGameActivated(e){
	 
		updateScreenSize();                                 // Set game screen size
		
		var MainScene  = require("MainScene");              // Import the MainScene module into the current scope
		game.currentScene = new MainScene(win, game);       // Set MainScene as the current scene
		
		game.pushScene(game.currentScene);                  // Pushes the specified Scene instance into the scene stack (places it at the very top). The scene (now at the top) will then become the currently shown (active) scene.
		game.start();                                       // Starts the game
		
		
	};
	
	function onSurfaceChanged(e){
		
		game.orientation = e.orientation;
		updateScreenSize();
	
	};
	
	function showFPS(e){
		
		Ti.API.info(e.fps.toFixed(2) + " fps");
		
	};
	
	function androidBackButtonPressed(e){
		
		if (closing) return;
		
		closing = true;
		
		var dlg = Ti.UI.createAlertDialog({ message : 'Exit?', buttonNames : ['OK','Cancel']});
		
		dlg.addEventListener("click", function(e) {
					
			if (e.index === 0) {
							
				game.currentScene = null;
				game.cleanupGarbage();
			
				win.remove(game);
				
				dlg.hide();
				win.close();
			 
			} else {
				closing = false;
			};
		            
		});
		
		dlg.show();
		 	
	};
		    
	function closeWindow(){
		
		Ti.API.info("ApplicationWindow is closed");
		
		game= null;
		win = null;
	
	};
	
	platino.addEventListener('onlowmemory', function(e) {
	
		Ti.API.warn("Low Memory");
			
	});
	
	win.add(game);
	    
	     
	return win;
};

// Make constructor function the public component interface
module.exports = ApplicationWindow;
