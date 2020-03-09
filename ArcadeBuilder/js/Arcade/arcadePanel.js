        params = {          //List of all adjustable parameters and their default values
					SizeX: 500,
					SizeY: 185.6,
					SizeZ: 19,
          KeepGrouped: true,
          Radius: 7,
          Color: 0x6d5d41,
          P1Buttons: 6,
          ButtonType: 0,
          P1GroupX: 105,
          P1GroupY: 70,
          P1GroupR: 0,
          Players: 2,
          SixButtonLayout: 1,
          EightButtonLayout: 1,
          MatchP1: true,
          P2XOffset: 250,
          Rot: 5*Math.PI/3,
          ShowButtons: true,
          P1ButtonColor: 0x65212d,
          P2ButtonColor: 0x363062,
          ShowArtwork: false,
          ShowBounds: false,
          JoystickType: 0
				};

			var lastSize = new THREE.Vector3(params.SizeX,params.SizeY,params.SizeZ);
      var lastP1Buttons = params.P1Buttons;

			var camera, scene, renderer, controls, light, ambient, effect;
      var texture, panelShape, panelExtrudeSettings, panelGeometry, textureMaterial, panelMaterial, panel; 
      var circleRadius;
			var gui, panelFolder, params, test;
      var panelBB = new THREE.Box3();
      var line, player1BoundGeometry;

      var loader;
      var buttonGroup = new THREE.Group();
      var joyGroup = new THREE.Group();
      var dotGroup = new THREE.Group();
      var lineGroup = new THREE.Group();
      var boundGroup = new THREE.Group();
      
      var P1ButtonMaterial = new THREE.MeshLambertMaterial( { color: params.P1ButtonColor, side: THREE.DoubleSide } );
      var P2ButtonMaterial = new THREE.MeshLambertMaterial( { color: params.P2ButtonColor, side: THREE.DoubleSide } );
      
      function deg2rad(d){
        r = d * (Math.PI/180)
        return r;
      }
      function disposeAll(){                   //Function to dispose of geometry, used between frames
        scene.remove(panel);
        for (var i = buttonGroup.children.length - 1; i >= 0; i--) {
            buttonGroup.remove(buttonGroup.children[i]);
        }
        for (var i = joyGroup.children.length - 1; i >= 0; i--) {
            joyGroup.remove(joyGroup.children[i]);
        }
        for (var i = dotGroup.children.length - 1; i >= 0; i--) {
            dotGroup.remove(dotGroup.children[i]);
        }
        for (var i = boundGroup.children.length - 1; i >= 0; i--) {
            boundGroup.remove(boundGroup.children[i]);
        }
        panelGeometry.dispose();
        //player1BoundGeometry.dispose();
      }
      function dRot(x,y,theta){                //Function to calculate change in x and y based on rotation theta
          var change = new THREE.Vector2();
          change.x = (x)*Math.cos(theta) - (y)*Math.sin(theta);
          change.y = (x)*Math.sin(theta) + (y)*Math.cos(theta);
          return change;
      }
      function addDot(x,y,z,size){             //Adds graphic dot to display
          var dotGeometry = new THREE.Geometry();
          //dotGeometry.vertices.push(new THREE.Vector3( 250, 185.6/2, 8.5)); Old Center
          dotGeometry.vertices.push(new THREE.Vector3(x,y,z)); 
          var dotMaterial = new THREE.PointsMaterial( { size: size, sizeAttenuation: false, color: 0x000000 } );
          var dot = new THREE.Points( dotGeometry, dotMaterial );
          dotGroup.add( dot );
          scene.add(dotGroup);
      }
      function addControls(object, type) {     //W.I.P. Transform controller (With arrows)
        var transformControl = new THREE.TransformControls( camera,    renderer.domElement );
        //transformControl.addEventListener( 'change', render );
        transformControl.addEventListener( 'dragging-changed', function ( event ) {

          controls.enabled = ! event.value;

        });
        transformControl.attach( object );
        transformControl.setMode( type );
        transformControl.setSpace( "local" );
        scene.add( transformControl );
      }
      init();
			animate();
			function init() {          //Scene initializtion
        
				scene = new THREE.Scene();
				camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 3000 );
				renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true});
				renderer.setSize( window.innerWidth, window.innerHeight );
        effect = new THREE.OutlineEffect( renderer );

        light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1, 1 ).normalize();
        scene.add(light);

        ambient = new THREE.AmbientLight( 0xeeeeee);
				scene.add( ambient );
        controls = new THREE.OrbitControls( camera, renderer.domElement);
				document.body.appendChild( renderer.domElement );
				camera.position.set( 400, 300, 500 );
        controls.update();
        drawPanel(params);
        panelBB.getCenter(controls.target);
        createGUI();
			}
			function drawPanel(params){
        height = params.SizeY;
        width = params.SizeX;
        depth = params.SizeZ;
        radius = params.Radius;

        panelShape = new THREE.Shape()
          .moveTo( 0, 0 + radius )
					.lineTo( 0, 0 + height - radius )
					.quadraticCurveTo( 0, 0 + height, 0 + radius, 0 + height )
					.lineTo( 0 + width - radius, 0 + height )
					.quadraticCurveTo( 0 + width, 0 + height, 0 + width, 0 + height - radius )
					.lineTo( 0 + width, 0 + radius )
					.quadraticCurveTo( 0 + width, 0, 0 + width - radius, 0 )
					.lineTo( 0 + radius, 0 )
					.quadraticCurveTo( 0, 0, 0, 0 + radius );
      function getButtonProp(holeType,prop){  //List of hole properties 
        switch(holeType){
          case 0: //Sanwa OBSN 30-RG
            holeRadius = 14.85; 
            nutRadius = 18;
          break;    
          case 1: //Test
            holeRadius = 10; 
          break;          
        }
        switch(prop){
          case 0: return holeRadius; break;
          case 1: return nutRadius; break;
        }  
      }
      function getMax(array,direction){
        var max = [];
        var store = 0;
        switch(direction){
          case "col":
          for (var j = 0; j < array[0].length; j++){
            for (var i = 0; i < array.length; i++){
              if (array[i][j] > store){
                store = array[i][j];
              }
            }
            max.push(store);
            store = 0;
          }
          break;
          case "row": 
          break;
        }
        return max;
      }
      function getMin(array,direction){
        var min = [];
        var store = 300;
        switch(direction){  
          case "col":
          for (var j = 0; j < array[0].length; j++){
            for (var i = 0; i < array.length; i++){
              if (array[i][j] < store){
                store = array[i][j];
              }
            }
            min.push(store);
            store = 300;
          }
          break;
          case "row": 
          break;
        }
        return min;
      }
      function holeOffset(x,y){   //Function for translating hole based on user defined offset
        var off = new THREE.Vector2(0,0);
        off = dRot(x,y,deg2rad(params.P1GroupR));
        off.x = off.x + params.P1GroupX;
        off.y = off.y + params.P1GroupY;
        return off;
      }
      function pushHole(x,y,radius){
        newHole = new THREE.Shape()
				  .moveTo( 0, 0 )
			    .absarc( x, y, radius, 0, Math.PI * 2, false ); 
        panelShape.holes.push( newHole );
      }
      function buttonModel(x,y,z, material){
        loader = new THREE.GLTFLoader();  
        var asset = new THREE.Object3D();
        loader.load( 'ArcadeBuilder/models/Button/SANWA Deep Button.glb', function ( object ) {
          change = dRot(y, z, params.Rot);
          let asset = object.scene;
          asset.traverse(function (node) {
            if (node.isMesh){
              node.material = material;
            } 
          });
          asset.rotation.set(params.Rot - 3/2 * Math.PI,0,0);
          asset.scale.set(1,1,1);
          asset.position.set(x,change.x,change.y);
          //addDot(x,change.x,change.y,20);
          buttonGroup.add(asset);
        });
        scene.add(buttonGroup);
      }
      function addButton(x,y){      //Adds holes for buttons accounting for user defined offset and properties
        coords = holeOffset(x,y);
        xn = coords.x;
        yn = coords.y; 
        var offset = 17.5;
        circleRadius = getButtonProp(parseInt(params.ButtonType,10),0);
				pushHole(xn, yn, circleRadius);
        var size = new THREE.Vector3(circleRadius+2,circleRadius+2,40);
        var location = new THREE.Vector3(xn,yn,10);
        drawBounding(size,location,"button");
        if(params.ShowButtons == 1) buttonModel(xn, yn, params.SizeZ - offset, P1ButtonMaterial);
        if(params.Players == 2){
          if(params.MatchP1 == 0){
            yn = coords.y + params.P2YOffset; 
          }
          xn = coords.x + params.P2XOffset;
          location = new THREE.Vector3(xn,yn,10);
          pushHole(xn, yn, circleRadius);
          drawBounding(size,location,"button");
          if(params.ShowButtons == 1) buttonModel(xn, yn, params.SizeZ - offset, P2ButtonMaterial);
        }
      }
      function joystickModel(x,y,z,material){
        topLoader = new THREE.GLTFLoader();
        shaftLoader = new THREE.GLTFLoader(); 
        washerLoader = new THREE.GLTFLoader();       
        var asset = new THREE.Object3D();
        var modelTop, modelShaft, topOFf, shaftOff;
        switch(parseInt(params.JoystickType)){
          case 0: 
            modelTop = "ArcadeBuilder/models/Joystick/Test/BallTop.glb"; 
            modelShaft = "ArcadeBuilder/models/Joystick/Test/TallShaft.glb";
            topOff = 0;
            shaftOff = -45;
          break;
          case 1: 
            modelTop = "ArcadeBuilder/models/Joystick/Test/BatTop.glb"; 
            modelShaft = "ArcadeBuilder/models/Joystick/Test/BatShaft.glb"; 
            topOff = 20;
            shaftOff = -25;
          break;
        }
        topLoader.load(modelTop , function ( object ) {
          change = dRot(y, z + topOff, params.Rot);  //0 10
          let asset = object.scene;
          asset.traverse(function (node) {
            if (node.isMesh){
              node.material = material;
            } 
          });
          asset.rotation.set(params.Rot - 3/2 * Math.PI,0,0);
          asset.scale.set(1,1,1);
          asset.position.set(x,change.x,change.y);
          //addDot(x,change.x,change.y,20);
          joyGroup.add(asset);
        });
        shaftLoader.load( modelShaft, function ( object ) {
          change = dRot(y, z+shaftOff, params.Rot);  //-45 -35
          let asset = object.scene;
          asset.traverse(function (node) {
            if (node.isMesh){
              node.material = new THREE.MeshLambertMaterial({ color: 0x888a89, side: THREE.DoubleSide });
            } 
          });
          asset.rotation.set(params.Rot - 3/2 * Math.PI,0,0);
          asset.scale.set(1,1,1);
          asset.position.set(x,change.x,change.y);
          //addDot(x,change.x,change.y,20);
          joyGroup.add(asset);
        });
        shaftLoader.load( 'ArcadeBuilder/models/Joystick/Test/Washer.glb', function ( object ) {
          change = dRot(y, params.SizeZ+z-61.5, params.Rot);
          let asset = object.scene;
          asset.traverse(function (node) {
            if (node.isMesh){
              node.material = new THREE.MeshLambertMaterial({ color: 0x292929, side: THREE.DoubleSide });
            } 
          });
          asset.rotation.set(params.Rot - 3/2 * Math.PI,0,0);
          asset.scale.set(1,1,1);
          asset.position.set(x,change.x,change.y);
          //addDot(x,change.x,change.y,20);
          joyGroup.add(asset);
        });
        scene.add(joyGroup);
      }
      function drawBounding(size,location,shape){
        var geometry;
        switch(shape){
          case "box": geometry = new THREE.BoxGeometry(size.x,size.y,size.z); break;
          case "button": geometry = new THREE.CylinderGeometry(size.x,size.y,size.z, 20); break;
        }
        change = dRot(location.y, location.z, params.Rot);

        material = new THREE.MeshBasicMaterial({ color: 0xFFFFFFF, wireframe: true});
        
        var bound = new THREE.Mesh( geometry, material);
        if(!params.ShowBounds){
          bound.visible = false;
        }
        bound.position.set(location.x,change.x,change.y);
        bound.rotation.set(Math.PI / 2 + params.Rot,0,0);
        
        boundGroup.add( bound );
      }
      function addJoystick(x,y){   //Adds holes for Joystick(s)
        coords = holeOffset(x,y);
        xn = coords.x;
        yn = coords.y; 
        middleRadius = 28.575/2;
        screwRadius = 2.5;
        //circleRadius = getButtonProp(parseInt(params.ButtonType,10));
        pushHole(xn, yn, middleRadius);
        pushHole(xn + 20, yn - 40, screwRadius);
        pushHole(xn + 20, yn + 40, screwRadius);
        pushHole(xn - 20, yn - 40, screwRadius);
        pushHole(xn - 20, yn + 40, screwRadius);

        var size = new THREE.Vector3(40,150,80);
        var location = new THREE.Vector3(xn,yn,10);

        drawBounding(size,location,"box");

        joystickModel(xn,yn,62,P1ButtonMaterial);
        if(params.Players == 2){
          if(params.MatchP1 == 0){
            yn = coords.y + params.P2YOffset; 
          }
            xn = coords.x + params.P2XOffset; 
            location = new THREE.Vector3(xn,yn,10);
            pushHole(xn, yn, middleRadius);
            pushHole(xn + 20, yn - 40, screwRadius);
            pushHole(xn + 20, yn + 40, screwRadius);
            pushHole(xn - 20, yn - 40, screwRadius);
            pushHole(xn - 20, yn + 40, screwRadius);

            drawBounding(size,location,"box");

            joystickModel(xn,yn,62,P2ButtonMaterial);
          }
        }
        switch(parseInt(params.P1Buttons,10)){                 //Preset button Layouts
          case 1: buttonCoords=[[0,0]]; break;
          case 2: buttonCoords=[[0,0],[36,0]];break;
          case 6: switch(parseInt(params.SixButtonLayout,10)){

            case 0: buttonCoords=[[0,34.925],[38.1,34.925],[76.2,34.925],[0,0],[38.1,0],[76.2,0]];
            
            break;

            case 1: buttonCoords=[[0,39],[31.25,57],[67.25,57],[0,0],[31.25,18],[67.25,18]];
            
            break;

            case 2:buttonCoords=[[0,39],[31.25,57],[62.5,75],[0,0],[31.25,18],[62.5,36]];
            break;

            case 3:buttonCoords=[[18,31.25],[56.1,31.25],[94.2,31.25],[0,0],[38.1,0],[76.2,0]];
            break;
            }
          break;
          case 8: switch(parseInt(params.EightButtonLayout,10)){
            default: console.log('Error: ' + params.EightButtonLayout);break; 
            case 0: 
              buttonCoords = [[0,34.925],[38.1,34.925],[76.2,34.925],[114.3,34.925],[0,0],[38.1,0],[76.2,0],[114.3,0]];
            break;
            case 1: 
              buttonCoords = [[0,36],[33,50],[66,64],[102,64],[0,0],[33,14],[66,28],[102,28]];
            break;
            case 2: 
              buttonCoords = [[0,36],[31.25,54],[66.25,63],[102.25,63],[0,0],[31.25,18],[66.25,27],[102.25,27]];     
            break;
            case 3:
              
              buttonCoords = [[7,38.5],[40,52.5],[75.5,46.5],[109.5,31.5],[0,0],[33,14],[69,8],[103,-7]];
            break;
            case 4: 
              buttonCoords = [[0,39],[30.5,59],[66.5,59],[102,50],[0,0],[30.5,20],[66.5,20],[102.5,11]];
            break;
            case 5:
              buttonCoords = [[0,36],[33,50],[69,50],[104.25,43],[0,0],[33,14],[69,14],[105,7]];
            break;
            case 6: 
              buttonCoords = [[0,36],[31.25,54],[67.25,54],[101.25,45],[0,0],[31.25,18],[67.25,18],[102.25,9]];
            break;
            case 7: 
              buttonCoords = [[0,0],[31.25,18],[67.25,9],[102.25,0],[0,36],[31.25,54],[67.25,45],[102.25,36]];
            break;
            case 8: 
              buttonCoords = [[7,38],[40,52],[76,52],[112,52],[0,0],[33,13],[69,13],[105,13]];
            break;
            case 9: 
              buttonCoords = [[18,31.25],[56.1,31.25],[94.2,31.25],[132.3,31.25],[0,0],[38.1,0],[76.2,0],[114.3,0]];
            break;
            }
          break;
        }
        //addJoystick(joyCoords[i][0], joyCoords[i][1]);
        addJoystick(-59,20);
        //drawHoleBounds(buttonCoords,1);
        for (var i = 0; i < parseInt(params.P1Buttons); i++){
          
          addButton(buttonCoords[i][0],buttonCoords[i][1]);
        }
        panelExtrudeSettings = { depth: depth, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };

        panelGeometry = new THREE.ExtrudeBufferGeometry( panelShape, panelExtrudeSettings );
        stepSize = 0.1;

        panelMaterial = new THREE.MeshLambertMaterial( { color: params.Color, side: THREE.DoubleSide });
        if(params.ShowArtwork == 1){
          texture = new THREE.TextureLoader().load( "ArcadeBuilder/textures/UVTestHR.png" );
          textureMaterial = new THREE.MeshBasicMaterial( { map: texture } );
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          texture.repeat.set( 0.002, 0.002 );
        }else{
          textureMaterial = panelMaterial;
        }
        materials = [textureMaterial, panelMaterial];
				panel = new THREE.Mesh( panelGeometry, materials);

        //var axesHelper = new THREE.AxesHelper( 500 );
        //scene.add( axesHelper );
				panel.position.set(0,0,0);
				panel.rotation.set(params.Rot, 0, 0);        
        //addDot(250, dRot(8.5,92.8,panelAngle).y, -dRot(8.5,92.8,panelAngle).x,20);
        //controls.target.set(250, dRot(8.5,92.8,params.Rot).y, -dRot(8.5,92.8,params.Rot).x);
        var size = new THREE.Vector3(100,100,100);
        var location = new THREE.Vector3(0,100,0);
        panelBB.setFromObject(panel);
        //panelBB.getCenter(controls.target);
        panel.scale.set(1,1,1);
        scene.add(boundGroup);
        scene.add(panel);
        //addControls(panel, "translate");
      }
      
			function createGUI(){
				gui = new dat.GUI();
        panelFolder = gui.addFolder('Panel');
        buttonFolder = gui.addFolder('Buttons');
        artworkFolder = panelFolder.addFolder('Artwork');
        player1Folder = buttonFolder.addFolder('Player1');
        joyFolder1 = player1Folder.addFolder('P1Joystick');
        player2Folder = buttonFolder.addFolder('Player2');
        joyFolder2 = player1Folder.addFolder('P2Joystick');
				layoutList6 ={
          StreetFighter: 0, 
          HalfIncline: 1, 
          FullIncline: 2,
          Staggered: 3
        };
        layoutList8 ={
          Cluster: 0, 
          Incline: 1, 
          Hori: 2,
          SegaAstroCity: 3,
          SegaP2: 4,
          SegaP1P2Mix: 5,
          JapanStandard: 6,
          Slanted: 7,
          TaitoVewlix: 8,
          Staggered: 9
        };
        joyTypeList={
          Ball: 0,
          Bat: 1
        };
        buttonTypeList ={
          SanwaOBSN30RG: 0,
          Test: 1
        };
        panelFolder.add( params, 'Rot',6*Math.PI/4,2*Math.PI,0.1).onChange(function rotPanelX(){
            panel.rotation.set(params.Rot, 0, 0);
            disposeAll();
            //addDot(250, dRot(8.5,92.8,panelAngle).y, -dRot(8.5,92.8,panelAngle).x,20);
            panelBB.setFromObject(panel);
            panelBB.getCenter(controls.target);
            drawPanel(params);
          });
					panelFolder.add( params, 'SizeX',400,600,0.1).onChange(function scalePanelX(){
            disposeAll();
            lastPosition = camera.position;
            camera.position.set( lastPosition.x + (params.SizeX - lastSize.x)/2, lastPosition.y, lastPosition.z );
            lastSize.x = params.SizeX;
            drawPanel(params); 
            panelBB.setFromObject(panel);
            panelBB.getCenter(controls.target);
            //controls.target.set(250, dRot(8.5,92.8,params.Rot).y, -dRot(8.5,92.8,params.Rot).x);
            //controls.target.set(params.SizeX/2,params.SizeY/2,params.SizeZ/2); 
          });
					panelFolder.add( params, 'SizeY',150,225,0.1).onChange(function scalePanelY(){
            disposeAll();
            lastPosition = camera.position; 
            camera.position.set( lastPosition.x, lastPosition.y + (params.SizeY - lastSize.y)/2, lastPosition.z );
            lastSize.y = params.SizeY;
            drawPanel(params);
            panelBB.setFromObject(panel);
            panelBB.getCenter(controls.target);
            //controls.target.set(250, dRot(8.5,92.8,params.Rot).y, -dRot(8.5,92.8,params.Rot).x);
            //controls.target.set(params.SizeX/2,params.SizeY/2,params.SizeZ/2); 
          });
					panelFolder.add( params, 'SizeZ',10,30,0.1).onChange(function scalePanelZ(){
            disposeAll();
            lastPosition = camera.position;
            camera.position.set( lastPosition.x, lastPosition.y, lastPosition.z + (params.SizeZ - lastSize.z)/2);
            lastSize.z = params.SizeZ;
            drawPanel(params);
            panelBB.setFromObject(panel);
            panelBB.getCenter(controls.target);
            //controls.target.set(250, dRot(8.5,92.8,params.Rot).y, -dRot(8.5,92.8,params.Rot).x);
            //controls.target.set(params.SizeX/2,params.SizeY/2,params.SizeZ/2);   
          });
					panelFolder.add( params, 'Radius',1,50,0.1).onChange(function panelFillet(){
            disposeAll();
            drawPanel(params);
            //controls.target.set(params.SizeX/2,params.SizeY/2,params.SizeZ/2); 
            //lastRadius = params.Radius;
          });
          panelFolder.addColor( params, 'Color').onChange(function colorCube(){
            panelMaterial.color.set(params.Color);
          });
          artworkFolder.add( params, 'ShowArtwork').onChange(function showArtwork(){
            disposeAll();
            drawPanel(params);
          });
          buttonFolder.add(params, 'Players',[1,2]).onChange(function playerTabs(){
            disposeAll();
            drawPanel(params);
            if(params.Players == 2){
              player2Folder.show();
            }else{
              player2Folder.hide();
            }

          });
          buttonFolder.add(params, 'ShowButtons').onChange(function ShowButtons(){
            disposeAll();
            drawPanel(params);
          });
          buttonFolder.add(params, 'ShowBounds').onChange(function ShowBounds(){
            disposeAll();
            drawPanel(params);
          });
          buttonFolder.addColor( params, 'P1ButtonColor').onChange(function P1ButtonColor(){
            P1ButtonMaterial.color.set(params.P1ButtonColor);
          });
          buttonFolder.addColor( params, 'P2ButtonColor').onChange(function P2ButtonColor(){
            P2ButtonMaterial.color.set(params.P2ButtonColor);
          });
          function removeLayoutUI(){
            switch(lastP1Buttons){
                default: console.log('Error'); break;
                case 1: break;
                case 6: player1Folder.remove(SixButtonLayoutUI); break;
                case 8: player1Folder.remove(EightButtonLayoutUI); break;
            }
          }  
          player1Folder.add(params, 'P1Buttons',[1,2,6,8]).onChange(function changeButtons(){
            disposeAll();
            drawPanel(params);
            switch(parseInt(params.P1Buttons, 10)){
              default: removeLayoutUI(); break;
              case 1: removeLayoutUI(params); break;
              case 6:
                removeLayoutUI();
                SixButtonLayoutUI = player1Folder.add(params, 'SixButtonLayout', layoutList6).onChange(function layoutSelect(){
                  disposeAll();
                  drawPanel(params);
                  lastLayout = parseInt(params.SixButtonLayout, 10);
                }); break;
              case 8:
                removeLayoutUI();
                EightButtonLayoutUI = player1Folder.add(params, 'EightButtonLayout', layoutList8).onChange(function layoutSelect(){
                  disposeAll();
                  drawPanel(params);
                  lastLayout = parseInt(params.EightButtonLayout, 10);
                }); break;
            }
            lastP1Buttons = parseInt(params.P1Buttons, 10);
          });
          player1Folder.add(params, 'ButtonType', buttonTypeList).onChange(function layoutSelect(){
            disposeAll();
            drawPanel(params);
            lastButtonType = parseInt(params.ButtonType, 10);
            }); 
          player1Folder.add( params, 'P1GroupX',20,params.SizeX-87.25,0.1).onChange(function transButtonX(){
            disposeAll();
            //lastP1Group.x = params.P1GroupX;
            drawPanel(params);
            window.clearInterval();
            window.setTimeout(function redraw(){disposeAll();drawPanel(params);},500)
          });
          player1Folder.add( params, 'P1GroupY',20,params.SizeY-77,0.1).onChange(function transButtonY(){
            disposeAll();
            //lastP1Group.y = params.P1GroupY;
            drawPanel(params);
          });
          player1Folder.add( params, 'P1GroupR',0,359,5).onChange(function transButtonR(){
            disposeAll();

            //lastP1GroupR = params.P1GroupR;
            drawPanel(params);
          });

          player1Folder.add(params, 'KeepGrouped').onChange(function keepGrouped(){
            if(params.KeepGrouped){
              
            }  
          });
          SixButtonLayoutUI = player1Folder.add(params, 'SixButtonLayout', layoutList6).onChange(function layoutSelect(){
            disposeAll();
            drawPanel(params);
            lastLayout = parseInt(params.SixButtonLayout, 10);
          }); 
          joyFolder1.add(params, 'JoystickType', joyTypeList).onChange(function joySelect(){
            disposeAll();
            drawPanel(params);
          });
          player2Folder.add(params, 'MatchP1').onChange(function matchP1(){
            if(params.MatchP1){
              
            }else{
            
            }
            lastMatchP1 = params.MatchP1;
            });
          player2Folder.add(params, 'P2XOffset', 31.25,params.SizeX,0.1).onChange(function offsetP2(){
            disposeAll();
            drawPanel(params);
            
            //lastP2XOffset = params.P2XOffset;
            });
          panelFolder.open();
          buttonFolder.open();
				}
      
			function animate() {
				requestAnimationFrame( animate );
        controls.update();
				renderer.render( scene, camera );
        effect.render( scene, camera );
			}