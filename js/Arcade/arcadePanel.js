        params = {          //List of all adjustable parameters and their default values
					SizeX: 500,
					SizeY: 185.6,
					SizeZ: 19,
          KeepGrouped: true,
          Radius: 7,
          Color: 0x6d5d41,
          P1Buttons: 6,
          ButtonType: 0,
          P1GroupX: 115,
          P1GroupY: 70,
          P1GroupR: 0,
          Players: 2,
          SixButtonLayout: 1,
          EightButtonLayout: 1,
          MatchP1: true,
          P2XOffset: 240,
          Rot: 5*Math.PI/3
				};

			var lastSize = new THREE.Vector3(params.SizeX,params.SizeY,params.SizeZ);
      var lastP1Buttons = params.P1Buttons;

			var camera, scene, renderer, controls, light, ambient, effect;
      var texture, panelShape, panelExtrudeSettings, panelGeometry, textureMaterial, panelMaterial, panel; 
      var circleRadius;
			var gui, sizeFolder, params, test;
      var bb = new THREE.Box3();
      var line, player1BoundGeometry;
      
      function drawStars(){                              //Unusued function to add stars to background
        var geometry = new THREE.BufferGeometry();
				var vertices = [];
				for ( var i = 0; i < 10000; i ++ ) {
					vertices.push( THREE.Math.randFloatSpread( 2000 ) ); // x
					vertices.push( THREE.Math.randFloatSpread( 2000 ) ); // y
					vertices.push( THREE.Math.randFloatSpread( 2000 ) ); // z
				}
				geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
				var particles = new THREE.Points( geometry, new THREE.PointsMaterial( { color: 0x888888 } ) );
				scene.add( particles );
      }
      function deg2rad(d){
        r = d * (Math.PI/180)
        return r;
      }
      function disposeAll(){                   //Function to dispose of geometry, used between frames
        scene.remove(panel);
        panelGeometry.dispose();
        scene.remove(line);
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
          //scene.add( dot );
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
        //drawStars();
        controls = new THREE.OrbitControls( camera, renderer.domElement);
        //controls.target = new THREE.Vector3( 250, 92.8, 9.5 );
				document.body.appendChild( renderer.domElement );
				camera.position.set( 400, 300, 500 );

        controls.update();
        drawPanel(params);
        bb.getCenter(controls.target);
        createGUI();
			}
			function drawPanel(params){
        height = params.SizeY;
        width = params.SizeX;
        depth = params.SizeZ;
        radius = params.Radius;
        x = 0;
        y = 0;

        panelShape = new THREE.Shape()
          .moveTo( x, y + radius )
					.lineTo( x, y + height - radius )
					.quadraticCurveTo( x, y + height, x + radius, y + height )
					.lineTo( x + width - radius, y + height )
					.quadraticCurveTo( x + width, y + height, x + width, y + height - radius )
					.lineTo( x + width, y + radius )
					.quadraticCurveTo( x + width, y, x + width - radius, y )
					.lineTo( x + radius, y )
					.quadraticCurveTo( x, y, x, y + radius );
      function getButtonProp(holeType,prop){  //List of hole properties 
        switch(holeType){
          case 0: //Sanwa OBSN 30-RG
          holeRadius = 14.85; 
          nutRadius = 18;
          break;    
          case 1: holeRadius = 10; break;          //Test
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
      function getBoundPoints(comx,comy,p1x,p1y,p2x,p2y,length,point){  //W.I.P Boundary detection from hole array
        com = new THREE.Vector2(comx,comy);
        p1 = new THREE.Vector2(p1x,p1y);
        p2 = new THREE.Vector2(p2x,p2y);
        point1 = new THREE.Vector2();
        point2 = new THREE.Vector2();
        bothPoints = new Array(2);
        dP1x = p1.x - com.x;
        dP1y = p1.y - com.y;
        dP2x = p2.x - com.x;
        dP2y = p2.y - com.y;
        if(dP1x == 0 && dP1y > 0){
          p1Angle = deg2rad(90);
        }else if(dP1x == 0 && dP1y < 0){
          p1Angle = deg2rad(270);
        }else if(dP1x < 0 && dP1y > 0){      //Quad 2
          p1Angle = Math.atan(dP1y/dP1x) + deg2rad(90);
        }else if(dP1x < 0 && dP1y < 0){      //Quad 3
          p1Angle = Math.atan(dP1y/dP1x) + deg2rad(180);
        }else if(dP1x > 0 && dP1y < 0){      //Quad 4
          p1Angle = Math.atan(dP1y/dP1x) + deg2rad(270);
        }else{
          p1Angle = Math.atan(dP1y/dP1x);
        }
        if(dP2x == 0 && dP2y > 0){
          p2Angle = deg2rad(90);
        }else if(dP2x == 0 && dP2y < 0){
          p2Angle = deg2rad(270);
        }else if(dP2x < 0 && dP2y > 0){      //Quad 2
          p2Angle = Math.atan(dP2y/dP2x) + deg2rad(90);
        }else if(dP2x < 0 && dP2y < 0){      //Quad 3
          p2Angle = Math.atan(dP2y/dP2x) + deg2rad(180);
        }else if(dP2x > 0 && dP2y < 0){      //Quad 4
          p2Angle = Math.atan(dP2y/dP2x) + deg2rad(270);
        }else{
          p2Angle = Math.atan(dP2y/dP2x);
        }
        diffAngle = deg2rad(90) - (p1Angle-p2Angle);
        //console.log((diffAngle * 180) / Math.PI);
        p1Angle = p1Angle + diffAngle;
        p2Angle = p2Angle - diffAngle;
        point1.x = length * Math.cos(p1Angle);
        point1.y = length * Math.sin(p1Angle);
        point2.x = length * Math.cos(p2Angle);
        point2.y = length * Math.sin(p2Angle);


        bothPoints[0] = point1;
        bothPoints[1] = point2;
        return bothPoints;
      }
      function boundOffset(){
        res = getBoundPoints(holeCoords[0][0], holeCoords[0][1],holeCoords[1][0], holeCoords[1][1],holeCoords[2][0], holeCoords[2][1],nutRadius);
        addDot(-1*res[0].x+115+holeCoords[0][0],-1*res[0].y + 70 + holeCoords[0][1],21,20);
        addDot(-1*res[1].x+115+holeCoords[0][0],-1*res[1].y + 70 + holeCoords[0][1],21,20);
        res = getBoundPoints(holeCoords[2][0], holeCoords[2][1],holeCoords[4][0], holeCoords[4][1],holeCoords[0][0], holeCoords[0][1],nutRadius);
        addDot(res[0].x+115+holeCoords[2][0],res[0].y + 70 + holeCoords[2][1],21,20);
        addDot(res[1].x+115+holeCoords[2][0],res[1].y + 70 + holeCoords[2][1],21,20);

        res = getBoundPoints(holeCoords[1][0], holeCoords[1][1],holeCoords[0][0], holeCoords[0][1],holeCoords[3][0], holeCoords[3][1],nutRadius);
        addDot(res[0].x+115+holeCoords[1][0],res[0].y + 70 + holeCoords[1][1],21,20);
        addDot(res[1].x+115+holeCoords[1][0],res[1].y + 70 + holeCoords[1][1],21,20);
      }
      function drawHoleBounds(holeCoords, playerBounds){
        var boundStyle = 2;
        holeRadius = getButtonProp(parseInt(params.ButtonType,10),0);
        nutRadius = getButtonProp(parseInt(params.ButtonType,10),1);
        switch(boundStyle){
          case 0:
            max = getMax(holeCoords,"col");
            min = getMin(holeCoords,"col");
            max.x = max[0] + nutRadius;
            max.y = max[1] + nutRadius;
            min.x = min[0] - nutRadius;
            min.y = min[1] - nutRadius;
            boundShape = new THREE.Shape()
              .moveTo( min.x, min.y )
              .lineTo( min.x, max.y )
              .lineTo( max.x, max.y )
              .lineTo( max.x, min.y )
              .lineTo( min.x, min.y );
          break;
          case 1:
            max = getMax(holeCoords,"col");
            min = getMin(holeCoords,"col");
            console.log(holeCoords.length)
            max.x = max[0] + 2 * nutRadius;
            max.y = max[1] + 2 * nutRadius;
            min.x = min[0] - nutRadius;
            min.y = min[1] - nutRadius;
            boundShape = new THREE.Shape()
              .moveTo( min.x, min.y + nutRadius )
              .lineTo( min.x, min.y + max.y - nutRadius)
              .quadraticCurveTo( min.x, min.y + max.y, min.x + nutRadius, min.y + max.y )
              .lineTo( min.x + max.x - nutRadius, min.y + max.y )
              .quadraticCurveTo( min.x + max.x, min.y + max.y, min.x + max.x, min.y + max.y - nutRadius )
              .lineTo( min.x + max.x, min.y + nutRadius )
              .quadraticCurveTo( min.x + max.x, min.y, min.x + max.x - nutRadius, min.y )
              .lineTo( min.x + nutRadius, min.y )
              .quadraticCurveTo( min.x, min.y, min.x, min.y + nutRadius );
          break;
          case 2:
            //testHoleCoords=[[0,39],[31.25,57],[67.25,57],[0,0],[31.25,18],[67.25,18]];
            holeCoords = holeCoords.sort();
            boundShape = new THREE.Shape()
              /*.moveTo( holeCoords[0][0] - nutRadius, holeCoords[0][1])
              .lineTo( holeCoords[1][0] - nutRadius, holeCoords[1][1])
              .lineTo( holeCoords[3][0], holeCoords[3][1] + nutRadius)
              .lineTo( holeCoords[5][0] + nutRadius, holeCoords[5][1] + nutRadius)
              .lineTo( holeCoords[4][0] + nutRadius, holeCoords[4][1] - nutRadius)
              .lineTo( holeCoords[2][0], holeCoords[2][1] - nutRadius)
              .lineTo( holeCoords[0][0] - nutRadius, holeCoords[0][1])*/

              .moveTo( holeCoords[0][0], holeCoords[0][1])
              .lineTo( holeCoords[1][0], holeCoords[1][1])
              .lineTo( holeCoords[3][0], holeCoords[3][1])
              .lineTo( holeCoords[5][0], holeCoords[5][1])
              .lineTo( holeCoords[4][0], holeCoords[4][1])
              .lineTo( holeCoords[2][0], holeCoords[2][1])
              .lineTo( holeCoords[0][0], holeCoords[0][1]);
              boundOffset();
              //addDot(-1*res.x+115+holeCoords[2][0],-1*res.y + 70 + holeCoords[2][1],21,20);
              addDot(115,70,1,20);
          break;
          case 3:
            max = getMax(holeCoords,"col");
            min = getMin(holeCoords,"col");
            max.x = max[0] + 2 * nutRadius;
            max.y = max[1] + 2 * nutRadius;
            min.x = min[0] - nutRadius;
            min.y = min[1] - nutRadius;
            boundShape = new THREE.Shape()
              .moveTo( min.x, min.y + nutRadius )
              .lineTo( min.x, min.y + max.y - nutRadius)
              .quadraticCurveTo( min.x, min.y + max.y, min.x + nutRadius, min.y + max.y )
              .lineTo( min.x + max.x - nutRadius, min.y + max.y )
              .quadraticCurveTo( min.x + max.x, min.y + max.y, min.x + max.x, min.y + max.y - nutRadius )
              .lineTo( min.x + max.x, min.y + nutRadius )
              .quadraticCurveTo( min.x + max.x, min.y, min.x + max.x - nutRadius, min.y )
              .lineTo( min.x + nutRadius, min.y )
              .quadraticCurveTo( min.x, min.y, min.x, min.y + nutRadius );
            break;
        }
        var boundExtrudeSettings = { depth: 20, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        switch(playerBounds){
          case 1: 
          player1BoundGeometry = new THREE.ExtrudeBufferGeometry( boundShape, boundExtrudeSettings );
          var wireframe = new THREE.WireframeGeometry( player1BoundGeometry );
          break;
          case 2:
          player2BoundGeometry = new THREE.ExtrudeBufferGeometry( boundShape, boundExtrudeSettings );
          var wireframe = new THREE.WireframeGeometry( player2BoundGeometry );
          break;
        }

        line = new THREE.LineSegments( wireframe );
        line.material.depthTest = false;
        line.material.opacity = 0.25;
        line.material.transparent = true;
        
        off = dRot(0.01,params.P1GroupY,params.Rot);
        //console.log(off)
        //line.position.set(off.x,off.y,0);
        line.position.set(params.P1GroupX,off.y,-off.x);
        //console.log(off.y)
				line.rotation.set(params.Rot, 0, deg2rad(params.P1GroupR));        
        line.scale.set(1,1,2);

        scene.add(line);
      }
      function holeOffset(xo,yo){   //Function for translating hole based on user defined offset
        var off = new THREE.Vector2(0,0);
        off = dRot(xo,yo,deg2rad(params.P1GroupR));
        off.x = off.x + params.P1GroupX;
        off.y = off.y + params.P1GroupY;
        return off;
      }
      function addHole(xi,yi){      //Adds holes for buttons accounting for user defined offset and properties
        
        coords = holeOffset(xi,yi);
        xn = coords.x;
        yn = coords.y; 
        circleRadius = getButtonProp(parseInt(params.ButtonType,10),0);
        buttonHole = new THREE.Shape()
					.moveTo( 0, 0 )
					.absarc( xn, yn, circleRadius, 0, Math.PI * 2, false );
        panelShape.holes.push( buttonHole );
        if(params.Players == 2){
          if(params.MatchP1){
            xn = coords.x + params.P2XOffset; 
            buttonHole2 = new THREE.Shape()
					    .moveTo( 0, 0 )
					    .absarc( xn, yn, circleRadius, 0, Math.PI * 2, false );
              panelShape.holes.push( buttonHole2 );
          }else{
            xn = coords.x + params.P2XOffset; 
            yn = coords.y + params.P2YOffset; 
            buttonHole2 = new THREE.Shape()
					    .moveTo( 0, 0 )
					    .absarc( xn, yn, circleRadius, 0, Math.PI * 2, false );
            panelShape.holes.push( buttonHole2 );
          }
        }
      }
      function addJHole(xi,yi){   //Adds holes for Joystick(s)
        coords = holeOffset(xi,yi);
        xn = coords.x;
        yn = coords.y; 
        circleRadius = 28.575/2;
        //circleRadius = getButtonProp(parseInt(params.ButtonType,10));
        joyMiddleHole = new THREE.Shape()
					.moveTo( 0, 0 )
					.absarc( xn, yn, circleRadius, 0, Math.PI * 2, false ); 
        panelShape.holes.push( joyMiddleHole );
        if(params.Players == 2){
          if(params.MatchP1){
            xn = coords.x + params.P2XOffset; 
            joyMiddleHole2 = new THREE.Shape()
					    .moveTo( 0, 0 )
					    .absarc( xn, yn, circleRadius, 0, Math.PI * 2, false );
              panelShape.holes.push( joyMiddleHole2 );
          }else{
            xn = coords.x + params.P2XOffset; 
            yn = coords.y + params.P2YOffset; 
            joyMiddleHole2 = new THREE.Shape()
					    .moveTo( 0, 0 )
					    .absarc( xn, yn, circleRadius, 0, Math.PI * 2, false );
              panelShape.holes.push( joyMiddleHole2 );
            }
          }
        }
        switch(parseInt(params.P1Buttons,10)){                 //Preset button Layouts
          case 1: addJHole(-50,0); addHole(0,0); break;
          case 2: addHole(0,0); addHole(36,0); break;
          case 6: switch(parseInt(params.SixButtonLayout,10)){
          //default: console.log('Error: ' + buttonLayout);break; 
            default: holeCoords=[[18,31.25],[56.1,31.25],[94.2,31.25],[0,0],[38.1,0],[76.2,0]];
            
            break;

            case 0: holeCoords=[[0,34.925],[38.1,34.925],[76.2,34.925],[0,0],[38.1,0],[76.2,0]];
            
            break;

            case 1: holeCoords=[[0,39],[31.25,57],[67.25,57],[0,0],[31.25,18],[67.25,18]];
            
            break;

            case 2:holeCoords=[[0,39],[31.25,57],[62.5,75],[0,0],[31.25,18],[62.5,36]];
            break;

            case 3:holeCoords=[[18,31.25],[56.1,31.25],[94.2,31.25],[0,0],[38.1,0],[76.2,0]];
            break;
            }
          break;
          case 8: switch(parseInt(params.EightButtonLayout,10)){
            default: console.log('Error: ' + params.EightButtonLayout);break; 
            case 0: 
              holeCoords = [[0,34.925],[38.1,34.925],[76.2,34.925],[114.3,34.925],[0,0],[38.1,0],[76.2,0],[114.3,0]];
            break;
            case 1: 
              holeCoords = [[0,36],[33,50],[66,64],[102,64],[0,0],[33,14],[66,28],[102,28]];
            break;
            case 2: 
            holeCoords = [[0,36],[31.25,54],[66.25,63],[102.25,63],[0,0],[31.25,18],[66.25,27],[102.25,27]];     
            break;
            case 3:
              addJHole(-59,20)
              holeCoords = [[7,38.5],[40,52.5],[75.5,46.5],[109.5,31.5],[0,0],[33,14],[69,8],[103,-7]];
            break;
            case 4: 
              holeCoords = [[0,39],[30.5,59],[66.5,59],[102,50],[0,0],[30.5,20],[66.5,20],[102.5,11]];
            break;
            case 5:
              holeCoords = [[0,36],[33,50],[69,50],[104.25,43],[0,0],[33,14],[69,14],[105,7]];
            break;
            case 6: 
              holeCoords = [[0,36],[31.25,54],[67.25,54],[101.25,45],[0,0],[31.25,18],[67.25,18],[102.25,9]];
            break;
            case 7: 
              holeCoords = [[0,0],[31.25,18],[67.25,9],[102.25,0],[0,36],[31.25,54],[67.25,45],[102.25,36]];
            break;
            case 8: 
              holeCoords = [[7,38],[40,52],[76,52],[112,52],[0,0],[33,13],[69,13],[105,13]];
            break;
            case 9: 
              holeCoords = [[18,31.25],[56.1,31.25],[94.2,31.25],[132.3,31.25],[0,0],[38.1,0],[76.2,0],[114.3,0]];
            break;
            }
          break;
        }
        //drawHoleBounds(holeCoords,1);
        for (var i = 0; i < parseInt(params.P1Buttons); i++){
          addHole(holeCoords[i][0],holeCoords[i][1]);
        }
        panelExtrudeSettings = { depth: depth, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };

        panelGeometry = new THREE.ExtrudeBufferGeometry( panelShape, panelExtrudeSettings );
        stepSize = 0.1;

        texture = new THREE.TextureLoader().load( "textures/UVTest.png" );
        textureMaterial = new THREE.MeshBasicMaterial( { map: texture } );
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set( 0.002, 0.002 );

        panelMaterial = new THREE.MeshLambertMaterial( { color: params.Color, side: THREE.DoubleSide } ); 
        materials = [textureMaterial, panelMaterial]
				panel = new THREE.Mesh( panelGeometry, materials);
        console.log(panel.faces)

        //var axesHelper = new THREE.AxesHelper( 500 );
        //scene.add( axesHelper );
				panel.position.set(0,0,0);
				panel.rotation.set(params.Rot, 0, 0);        
        //addDot(250, dRot(8.5,92.8,panelAngle).y, -dRot(8.5,92.8,panelAngle).x,20);
        //controls.target.set(250, dRot(8.5,92.8,params.Rot).y, -dRot(8.5,92.8,params.Rot).x);
        
        bb.setFromObject(panel);
        //bb.getCenter(controls.target);
        panel.scale.set(1,1,1);
        scene.add(panel);
        //addControls(panel, "translate");
      }
      
			function createGUI(){
			
				gui = new dat.GUI();
        sizeFolder = gui.addFolder('Size');
        buttonFolder = gui.addFolder('Buttons');
        	
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
        buttonTypeList ={
          SanwaOBSN30RG: 0,
          Test: 1
        };
        sizeFolder.add( params, 'Rot',6*Math.PI/4,2*Math.PI,0.1).onChange(function rotPanelX(){
            panel.rotation.set(params.Rot, 0, 0);
            disposeAll();
            //addDot(250, dRot(8.5,92.8,panelAngle).y, -dRot(8.5,92.8,panelAngle).x,20);
            bb.setFromObject(panel);
            bb.getCenter(controls.target);
            drawPanel(params);
          });
					sizeFolder.add( params, 'SizeX',400,600,0.1).onChange(function scalePanelX(){
              disposeAll();
              lastPosition = camera.position;
              camera.position.set( lastPosition.x + (params.SizeX - lastSize.x)/2, lastPosition.y, lastPosition.z );
              lastSize.x = params.SizeX;
              drawPanel(params);
              
              bb.setFromObject(panel);
              bb.getCenter(controls.target);
              
              //controls.target.set(250, dRot(8.5,92.8,params.Rot).y, -dRot(8.5,92.8,params.Rot).x);
              //controls.target.set(params.SizeX/2,params.SizeY/2,params.SizeZ/2); 

          });
					sizeFolder.add( params, 'SizeY',150,225,0.1).onChange(function scalePanelY(){
              disposeAll();
              lastPosition = camera.position; 
              camera.position.set( lastPosition.x, lastPosition.y + (params.SizeY - lastSize.y)/2, lastPosition.z );
              lastSize.y = params.SizeY;
              drawPanel(params);
              bb.setFromObject(panel);
              bb.getCenter(controls.target);
              //controls.target.set(250, dRot(8.5,92.8,params.Rot).y, -dRot(8.5,92.8,params.Rot).x);
              //controls.target.set(params.SizeX/2,params.SizeY/2,params.SizeZ/2); 
          });
					sizeFolder.add( params, 'SizeZ',10,30,0.1).onChange(function scalePanelZ(){
              disposeAll();
              lastPosition = camera.position;
              camera.position.set( lastPosition.x, lastPosition.y, lastPosition.z + (params.SizeZ - lastSize.z)/2);
              lastSize.z = params.SizeZ;
              drawPanel(params);
              bb.setFromObject(panel);
              bb.getCenter(controls.target);
              //controls.target.set(250, dRot(8.5,92.8,params.Rot).y, -dRot(8.5,92.8,params.Rot).x);
              //controls.target.set(params.SizeX/2,params.SizeY/2,params.SizeZ/2); 
              
          });
					sizeFolder.add( params, 'Radius',1,50,0.1).onChange(function panelFillet(){
              disposeAll();
              drawPanel(params);
              //controls.target.set(params.SizeX/2,params.SizeY/2,params.SizeZ/2); 
              //lastRadius = params.Radius;
          });
          gui.addColor( params, 'Color').onChange(function colorCube(){
              panelMaterial.color.set(params.Color);
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
          function removeLayoutUI(){
            switch(lastP1Buttons){
                default: console.log('Error'); break;
                case 1: break;
                case 6: player1Folder.remove(SixButtonLayoutUI); break;
                case 8: player1Folder.remove(EightButtonLayoutUI); break;
                
            }
          }
          player1Folder = buttonFolder.addFolder('Player1');
          player2Folder = buttonFolder.addFolder('Player2');
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
          sizeFolder.open();
          buttonFolder.open();
				}
      
			function animate() {
				
				requestAnimationFrame( animate );
        controls.update();
				renderer.render( scene, camera );
        effect.render( scene, camera );
			}