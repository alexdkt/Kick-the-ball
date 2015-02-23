/*
 * MAINSCENE.JS
 */

var platino = require('co.lanica.platino');
var ALmixer = platino.require('co.lanica.almixer');
var chipmunk = co_lanica_chipmunk2d;
var v = chipmunk.cpv;


function MainScene(window, game) {

	/*
	 * DECLARING THE SCENE
	 */
	
	var self = platino.createScene();
	self.addEventListener('activated', onSceneActivated);
	self.addEventListener('deactivated', onSceneDeactivated);	
	
	/*
	 * PHYSICS & CHIPMUNK WALLS
	 */
	
	var space = null;
	var gravity = -3000;
	
	var TICKS_PER_SECOND = 180;						//game.fps*3;
	var _accumulator = 0.0;
	
	var arrayWalls = [];
	
	/*
	 * SPRITE VARIABLE DECLARATIONS.
	 * null FOR SINGLE SPRITES & CHIPMUNK INSTANCES, 
	 * [] FOR GROUP OF SPRITES (FOR THOSE THAT SHARE A COMMON CHARACTERISTICS)
	 */
		
	// 4 INSTANCES NEEDED FOR A DYNAMIC BODY BODY: 
	
	var ballSprite = null;							//SPRITE
	var ballBody = null;							//BODY
	var ballMoment = null;							//MOMENT
	var ballShape = null;							//SHAPE
	
	
	//NORMAL SPRITES
	
	var backgroundBack = null;
	var backgroundTop = null;
	var whiteBackground = null;
	
	var windmill = null;
	var helix = null;
	var propellant = null;
	var earth = null;
	
	var shadow = null;	
	
	
	/*
	 * TRANSFORMS
	 */
	
	var arrayTransforms = [];
	
	/*
	 * FLAGS
	 */
	
	var firstTouch = true;
	var resetting = false;
	var timeFactor = 12;
	var counter = 0;
	
	/*
	 * SOUNDS
	 */
	
	var hitSound = ALmixer.LoadAll('sounds/hit.mp3');
	var music = ALmixer.LoadAll('sounds/Opening.mp3');
	
	/*
	 * OTHER
	 */
	
	var iRandom =function(min, max){return parseInt(Math.random() * (max - min) + min);};
	
	var cpY = function(y) {
		return (game.screen.height - y);
	};
	
	var cpX = function(x) {
		return (game.screen.width - x);
	};
	
	var cpAngle = function(angle) {
		return -(angle) * (180/Math.PI);
	};



	/*
	 * SCENE ACTIVATED LISTENER
	 */
	
	function onSceneActivated(e) {
		
		// WHEN SCENE IS ACTIVATED, STARTS THE CREATION OF ALL OBJECTS
	
		Ti.API.info("Kick the ball. Main scene is activated");
		
		createWorld();
		createWalls();
		createBackground();
		createTransforms();
		createBall();
		createShadow();
		
		game.addEventListener('touchstart', onTouchStartBall);
				
		game.startCurrentScene();			
			
	};


	/*
	 * CREATE SPACE AND WALLS.
	 */
	
	function createWorld(){
		
		space = chipmunk.cpSpaceNew();                             // Allocates and initializes a cpSpace struct
		chipmunk.cpSpaceSetGravity(space, v(0, gravity));          // Global gravity applied to the space
		chipmunk.cpSpaceSetSleepTimeThreshold(space, 0.5);         // Time a group of bodies must remain idle in order to fall asleep
		chipmunk.cpSpaceSetCollisionSlop(space, 0.5);              // Amount of overlap between shapes that is allowed
		chipmunk.cpSpaceSetDamping(space,0.5);                     // Amount of simple damping to apply to the space
		
		
	};

	function createWalls(){
	
		/*
		 *  Params: cpSegmentShapeNew(cpBody, cpVect a, cpVect b, cpFloat radius)
		 *  cpBody is the body to attach the segment to,
		 *  a and b are the endpoints,
		 *  radius is the thickness of the segment.
		 *
		 *  In Chipmunk, these are the four corners of screen.
		 * 
		 *     (0,game.screen.height)|---------floor---------|  (game.screen.width, game.screen.height)
		 *                           |                       |
		 *                           |                       |
		 *                           |                       |
		 *                       left wall                right wall
		 *                           |                       |		 
		 *                           |                       |
		 *                           |                       |
		 *                      (0,0)|--------ground---------|	(game.screen.width,0)
		 * 
		 * 
		 * cpX(0) = game.screen.width;
		 * cpY(0) = game.screen.height; 
		 */
	
		var walls = [{start:{x:0,y:cpY(0)},end:{x:0,y:0}},                    // Left wall
					{start:{x:cpX(0),y:cpY(0)},end:{x:cpX(0),y:0}},           // Right wall
					{start:{x:0,y:cpY(0)},end:{x:cpX(0),y:cpY(0)}},           // Floor 
					{start:{x:0,y:100},end:{x:cpX(0),y:100}}];                // Ground (100px above ground)
		
		
		
		for(var i=0; i< walls.length; i++){
			
		var wall = chipmunk.cpSegmentShapeNew(space.staticBody, v(walls[i].start.x, walls[i].start.y), v(walls[i].end.x, walls[i].end.y), 0);		
			
			chipmunk.cpShapeSetElasticity(wall, 1);            // Elasticity of the shape. A value of 0.0 gives no bounce, while a value of 1.0 will give a “perfect” bounce
			chipmunk.cpShapeSetFriction(wall, 1);              // Friction coefficient, a value of 0.0 is frictionless
			chipmunk.cpSpaceAddShape(space, wall);             // Add this shape to space
					
			arrayWalls.push(wall);
				
		};	
			
		
	};
	
	function createBackground(){
		
		// SKY BACKGROUND:
		
		backgroundBack = platino.createSprite({image:'graphics/backgroundBack.png', z:0, alpha:1});
		
		// The backgrounds are resized to fill the screen, we need to know this scale factor to use it later with the windmill and get the same proportional size:
		
		var scaleFactorX= cpX(0) / backgroundBack.width; 												// cpX(0) = game.screen.width;
		var scaleFactorY= cpY(0) / backgroundBack.height;												// cpY(0) = game.screen.height;

		backgroundBack.width = cpX(0);																	// Fill the screen with the backgrouns
		backgroundBack.height = cpY(0);
		
		self.add(backgroundBack);
		
		// WHITE BACKGROUND
		
		whiteBackground = platino.createSprite({image:'graphics/white.png', width:cpX(0),height:cpY(0), z:2, alpha:1,x:0,y:0});
		self.add(whiteBackground);
		
		// PICTURE BACKGROUND
		
		backgroundTop = platino.createSprite({image:'graphics/backgroundTop.png', width:cpX(0),height:cpY(0), z:3, alpha:0});
		self.add(backgroundTop);
		
		// WINDMILL
		
		windmill = platino.createSpriteSheet({
			asset : 'graphics/ball.xml',
			z:1
		});
		
		windmill.selectFrame('windmill');
		windmill.scaleBy(scaleFactorX,scaleFactorY);
		windmill.move(game.screen.width*0.55,game.screen.height*0.30);

		self.add(windmill);
		
		// HELIX WINDMILL
		
		helix = platino.createSpriteSheet({
			asset : 'graphics/ball.xml',
			anchorPoint:{x:0.5,y:0.5},
		
		});
		
		helix.selectFrame('helix');
		helix.move(-15,0);

		windmill.addChildNode(helix);
		
		var trRotateHelix = platino.createTransform({duration:2000,angle:360,repeat:-1});
		helix.transform(trRotateHelix); 
		
		// PROPELLANT 
		
		propellant = platino.createSpriteSheet({
			asset : 'graphics/ball.xml',
			followParentAlpha:false,
			alpha:0
		});
		
		propellant.selectFrame('propeller01');
		propellant.move(10,windmill.height -5);
		
		propellant.animate(propellant.frame,4,60,-1);
		
		windmill.addChildNode(propellant);
		
		// SKY PARTICLES
		
		particlesBackground =  platino.createParticles({image:'graphics/particle.pex',z:-1, y:-100});
	
		particlesBackground.restart();
 		self.add(particlesBackground);

	};
	
	
	function createTransforms(){
		
		/*
		 * 'COMPLETE' LISTENERS FOR TRANSFORMS
		 */
		
		var transform1Complete = function(e){
			
			backgroundBack.transform(arrayTransforms[1]);
			
		};
		
		var transform2Complete = function(e){
			
			propellant.show();
			var tr = platino.createTransform({duration:2000*timeFactor,y:-100});
			windmill.transform(tr);
			backgroundTop.transform(arrayTransforms[2]);
			
		};
		
		var transform3Complete = function(e){

			earth.transform(arrayTransforms[3]);
	
		};
		
		var transform4Complete = function(e){
		
			whiteBackground.transform(arrayTransforms[4]);
			var tr = platino.createTransform({duration:3000*timeFactor, alpha:0});
			earth.transform(tr);
			
		};
		
		var transform5Complete = function(e){

			resetObjects();

		};
		
		/*
		 * CREATE SOME TRANSFORMS DEFINED OUTSIDE THIS LOCAL SCOPE (ARRAYTRANSFORMS)
		 * IN ORDER TO AVOID GARBAGE COLLECTOR 
		 */
		
		
		var transforms = [{duration:4000*timeFactor,y:-whiteBackground.height,onComplete:transform1Complete},
						  {duration:1000*timeFactor,alpha:0,onComplete:transform2Complete},
						  {duration:2000*timeFactor,alpha:0, y:game.screen.height,scaleX:1.5,scaleY:1.5,onComplete:transform3Complete},
						  {duration:500*timeFactor,alpha:1,onComplete:transform4Complete},
						  {duration:2000*timeFactor,y:0,onComplete:transform5Complete}
						  ];
		
		
		for (var i=0;i<transforms.length;i++){
			
			var transform = platino.createTransform(transforms[i]);
			transform.addEventListener('complete', transforms[i].onComplete);
			
			arrayTransforms.push(transform);
		};
		


		
	};
	
	
	function createBall(){
		
		// BALL SPRITE AND CHILDRENS
		
		ballSprite = platino.createSpriteSheet({
			asset : 'graphics/ball.xml',
			anchorPoint:{x:0.5,y:0.5},
			z:4
		});
		
		ballSprite.selectFrame('ball01');
		
		ballSprite.center = {x:game.screen.width*0.5,y:700};
		
		// To convert the Sprite into a dynamic body, we need to create a shape, a body and a moment. 
		
		var radius = ballSprite.width * 0.5 - 1;
		var mass=1;
		
		// WE CREATE A MOMENT OF INERTIA FOR A CIRCLE:
		// cpMomentForCircle (MASS OF BODY, INNER DIAMETER, OUTER DIAMETER, OFFSET)
		
		ballMoment = chipmunk.cpMomentForCircle(mass, 0, radius, v(0, 0));
   
		ballBody = chipmunk.cpBodyNew(mass, ballMoment);
		chipmunk.cpSpaceAddBody(space, ballBody);
		chipmunk.cpBodySetPos(ballBody, v(ballSprite.center.x, cpY(ballSprite.center.y)));
		
		ballShape = chipmunk.cpCircleShapeNew(ballBody, radius, v(0, 0));
		chipmunk.cpSpaceAddShape(space, ballShape);
		chipmunk.cpShapeSetElasticity(ballShape, 0);
		chipmunk.cpShapeSetFriction(ballShape, 1);
		
		// Animation to achieve the pencil sketch effect:
				
		ballSprite.animate(0,4,40,-1);
		
		// EARTH, BALLSPRITE CHILDNODE 
		
		earth = platino.createSpriteSheet({
			asset : 'graphics/ball.xml',
			followParentAlpha:false,
			alpha:0
		});
		
		earth.selectFrame('earth01');
		
		earth.animate(earth.frame,4,40,-1);

		ballSprite.addChildNode(earth);		
		
		self.add(ballSprite);
		
	};
	
	function createShadow(){
		
		shadow = platino.createSpriteSheet({asset:'graphics/ball.xml', frame:4, z:3});
		shadow.selectFrame('shadow');
	
		shadow.move(ballSprite.x,cpY(100) - shadow.height);
		self.add(shadow);
	
	};

	
	/*
	 * ENTERFRAME SYNCHRONIZE THE SPRITE WITH ITS BODY AND 
	 * MAKE THE STEP PHYSICS CALCULATIONS
	 */
	
	function enterFrame(e){

		// Synchronize sprite and body (position and angle):
		
		ballSprite.center = {x:chipmunk.cpBodyGetPos(ballBody).x,y:cpY(chipmunk.cpBodyGetPos(ballBody).y)};
		ballSprite.angle = cpAngle(chipmunk.cpBodyGetAngle(ballBody));
		
		// Move and scale the shadow:
		
		shadow.x = ballSprite.x;
		shadow.scale(ballSprite.y/shadow.y);
	        
	    // Collision between the ball and the ground (shadow): 
	    // This could be done with a physic collision handler, but for this situation sprite collision is easier. 
	    
	    if(ballSprite.collidesWith(shadow) && !resetting){
	    	
	    	ALmixer.PlayChannel(hitSound);
	    	resetScreen();
	    	
	    };
	    
	    //The following code corresponds to stepPhysics(e.delta): 
	    
	    var fixed_dt = 1.0/TICKS_PER_SECOND;
	    _accumulator += e.delta*0.001;
	
	    while(_accumulator > fixed_dt) {
	    	chipmunk.cpSpaceStep(space, fixed_dt);
	    	_accumulator -= fixed_dt;
	    };
        
        
	};
	
	/*
	 * RESETSCREEN. 
	 */
	
	function resetObjects(){
		
		whiteBackground.clearTransforms();
		whiteBackground.y=0;
		
		backgroundTop.clearTransforms();
		backgroundTop.alpha=0;
		backgroundTop.y=0;
		backgroundTop.scale(1,1);
		
		backgroundBack.clearTransforms();
		var softShow = platino.createTransform({duration:500,alpha:1});
		backgroundBack.transform(softShow);
		
		earth.clearTransforms();
		earth.hide();
		
		propellant.hide();
		
		windmill.clearTransforms();
		windmill.move(game.screen.width*0.55,game.screen.height*0.30);
		
		counter = 0;
		
		
	};
	
	function resetScreen(){
		
		resetting = true;                                              // Ensures resetScreen() is executed only once
		
		game.removeEventListener('touchstart', onTouchStartBall);      // Avoid ball touches while resetting

		resetObjects();                                                // Put everything in origin
		
		setTimeout(function() {
			
			game.removeEventListener('enterframe', enterFrame);
	
			ballSprite.center = {x:game.screen.width*0.5,y:700};
			shadow.x = ballSprite.x;
			chipmunk.cpBodySetPos(ballBody, v(ballSprite.center.x, cpY(ballSprite.center.y)));
			game.addEventListener('touchstart', onTouchStartBall);
			
			firstTouch = true;
			
			resetting = false;
			
		}, 1500);	
		
		
		
	};
	
	/*
	 * LISTENERS
	 */
	
	function onTouchStartBall(e){
		
		if(ballSprite.contains(e.x*game.touchScaleX, e.y*game.touchScaleY)){
			
			var iX = (ballSprite.center.x - e.x*game.touchScaleX)*10;         // Detect touch position on ball
			
			chipmunk.cpBodyApplyImpulse(ballBody, v(iX,3000), v(0,0)); 

			counter++;                                                        // Flag with number of ball touches

			if(firstTouch){                                                   // If true, the ball is stopped and enterFrame is not running
				firstTouch=false;
				game.addEventListener('enterframe', enterFrame);              // Starts the enterframe at the first touch
				
			};
			
			if(counter === 5){                                                // Starts animation on the fifth touch
				
				whiteBackground.transform(arrayTransforms[0]);
				var tr = platino.createTransform({duration:5000*timeFactor, alpha:1});
				backgroundTop.transform(tr);
				ALmixer.PlayChannel(music,0);
				
			};
			
			ALmixer.PlayChannel(hitSound);

		};
		
	};	
	
	
	
	
	// ---- END ---- //



    function onSceneDeactivated(e) {
    	
    	// WHEN SCENE IS DEACTIVATED, ALL INSTANCES AND TEXTURES ARE REMOVED.
    	// IN THIS EXAMPLE, THIS FUNCTION IS NEVER REACHED, SO THERE IS NO WAY TO EXIT FROM THE SCREEN. 
    	// IS AN EXAMPLE THAT SHOWS HOW THIS WOULD BE DONE
    	
        Ti.API.info("Kick the ball main scene is deactivated");
	
		if (!resetting){
			game.removeEventListener('touchstart', onTouchStartBall);
		};
        
        // IF FIRSTTOUCH IS FALSE, THE BALL IS MOVING AND ENTERFRAME LOOP IS ACTIVE
        
        if(!firstTouch){ 
        	game.removeEventListener('enterframe', enterFrame);
        };
        
        /*
         * REMOVING WALLS (STATIC BODIES) 
         */
        
		for (var i = 0; i< arrayWalls.length; i++){
			
			chipmunk.cpSpaceRemoveShape(space, arrayWalls[i]);
			chipmunk.cpShapeFree(arrayWalls[i]);
			arrayWalls[i] = null;
		
		};
        
        arrayWalls.length = 0;
        arrayWalls = null;
		
		/*
		 * REMOVING THE BALL (DYNAMIC BODY) 
		 */
		
		chipmunk.cpSpaceRemoveShape(space, ballShape);
		chipmunk.cpShapeFree(ballShape);
		ballShape = null;
		
		// remove shape from space first, then free it
		chipmunk.cpSpaceRemoveBody(space, ballBody);
		chipmunk.cpBodyFree(ballBody);
		ballBody = null;
		
		ballMoment = null;
		
		/*
		 * REMOVING SPRITES FROM SCENE
		 */
		
		earth.clearTransforms();
		ballSprite.removeChildNode(earth);
		earth.dispose();
		earth=null;
		
		self.remove(ballSprite);
		ballSprite.dispose();
		ballSprite=null;
		
		backgroundTop.clearTransforms();
		self.remove(backgroundTop);
		backgroundTop.dispose();
		backgroundTop =null;
		
		backgroundBack.clearTransforms();
		self.remove(backgroundBack);
		backgroundBack.dispose();
		backgroundBack =null;
		
		whiteBackground.clearTransforms();
		self.remove(whiteBackground);
		whiteBackground.dispose();
		whiteBackground =null;
		
		self.remove(shadow);
		shadow.dispose();
		shadow=null;
		
		helix.clearTransforms();
		windmill.removeChildNode(helix);
		helix.dispose();
		helix = null;
		
		windmill.removeChildNode(propellant);
		propellant.dispose();
		propellant = null;
		
		windmill.clearTransforms();
		self.remove(windmill);
		windmill.dispose();
		windmill =null;
		
		self.remove(particlesBackground);
		particlesBackground = null;
		
		/*
		 * CLEAR TRANSFORMS
		 */
		
		for(var i=0; i< arrayTransforms.length; i++){
			
			arrayTransforms[i] = null;
			
		};
		
		arrayTransforms.length = 0;
		arrayTransforms = null;
		
		
		/*
		 * REMOVING PHYSIC SPACE
		 */
		
		chipmunk.cpSpaceFree(space);
		space = null;
		
		/*
		 * RELEASING SOUND
		 */
		
		ALmixer.FreeData(hitSound);
		hitSound = null;
		ALmixer.FreeData(music);
		music = null;
		
		
		/*
		 * UNLOADING TEXTURES
		 */
		
		game.unloadTexture('graphics/ball.png');
		game.unloadTexture('graphics/backgroundTop.png');
		game.unloadTexture('graphics/backgroundBack.png');
		game.unloadTexture('graphics/texture.png');
		game.unloadTexture('graphics/white.png');
		
		/*
		 * REMOVING ENVENT LISTENERS
		 */
		
		self.removeEventListener('activated', onSceneActivated);
		self.removeEventListener('deactivated', onSceneDeactivated);
		
		/*
		 * DELETING THE SCENE
		 */
		
		self.dispose();
		self = null;

    };
	
    return self;
};


module.exports = MainScene;


