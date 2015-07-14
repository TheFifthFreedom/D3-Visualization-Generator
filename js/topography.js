demo = {};

var _scene          = new THREE.Scene(),
    _categoryHolders = {},
    _categoryTitlesOn =  true;

demo.Treemap3d = function() {

    "use strict";

    var _width          = $(document).width() - 10,
        _height         = $(document).height() - 75,
        _renderer       = null,
        _controls       = null,
        _camera         = new THREE.PerspectiveCamera(45, _width/_height , 1, 100000),
        _zmetric        = "social",
        _colors         = ['rgb(0,90,50)', 'rgb(35,132,67)', 'rgb(65,171,93)', 'rgb(120,198,121)', 'rgb(173,221,142)', 'rgb(217,240,163)', 'rgb(247,252,185)', 'rgb(255,255,229)'],
        _zscaleSocial   = d3.scale.linear().range([0,1000]),
        _zscaleCompetition = d3.scale.linear().range([0,1000]),
        _zmetricScale   = d3.scale.ordinal().range([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]),
        _buttonBarDiv   = null,
        _elements       = null,
        _boxMap         = {};

    var _colorScale = d3.scale.quantile()
        .domain([0, 1]) // competition
        .range(_colors);

    function Treemap3d(selection) {
        _camera.setLens(100);
        _camera.position.set((Math.sin( 1/1000) * (-2000)) , -4000, 7000);

        _renderer = Modernizr.webgl ? new THREE.WebGLRenderer({antialias: true}) : new THREE.CanvasRenderer();
        _renderer.setSize(_width, _height);
        _renderer.setClearColor(0xFFFFFF);
        _renderer.domElement.style.position = 'absolute';
        _renderer.shadowMapEnabled = true;
        _renderer.shadowMapSoft = true;
        _renderer.shadowMapType = THREE.PCFShadowMap;
        _renderer.shadowMapAutoUpdate = true;

        selection.node().appendChild(_renderer.domElement);

        _buttonBarDiv = selection.append("div")
            .attr("class", "controls");
        _buttonBarDiv.append("button")
            .text("ZScale: 0")
            .on("click", function() {
                _zmetric = "base";
                transform();
            });
        _buttonBarDiv.append("button")
            .text("ZScale: Social")
            .on("click", function() {
                _zmetric = "social";
                transform();
            });
        // _buttonBarDiv.append("button")
        //     .text("ZScale: Competition")
        //     .on("click", function() {
        //         _zmetric = "competition";
        //         transform();
        //     });
        _buttonBarDiv.append("button")
            .text("Toggle Titles")
            .on("click", function() {
                _categoryTitlesOn = !_categoryTitlesOn;
                transform();
            });

        function enterHandler(d) {
            var boxGeometry = new THREE.BoxGeometry(1,1,1);
            var boxMaterial = new THREE.MeshLambertMaterial({color: _colorScale(d.competition)});
            var box = new THREE.Mesh(boxGeometry, boxMaterial);
            box.castShadow = true;
            _boxMap[d.id] = box;
            _scene.add(box);
        }

        function updateHandler(d) {
            var duration = 1000;
            var zvalue = (_zmetric === "social" ? _zscaleSocial(d.social) : (_zmetric === "competition" ? _zscaleCompetition(d.competition) : _zmetricScale(d.group)));
            if (d.name == 'Keyword'){zvalue = NaN;}
            var box = _boxMap[d.id];
            box.material.color.set(_colorScale(d.competition));
            var newMetrics = {
                x: d.x + (d.dx / 2) - _width / 2,
                y: d.y + (d.dy / 2) - _height / 2,
                z: zvalue / 2,
                w: Math.max(0, d.dx-1),
                h: Math.max(0, d.dy-1),
                d: zvalue
            };
            var coords = new TWEEN.Tween(box.position)
                .to({x: newMetrics.x, y: newMetrics.y, z: newMetrics.z}, duration)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .start();

            var dims = new TWEEN.Tween(box.scale)
                .to({x: newMetrics.w, y: newMetrics.h, z: newMetrics.d}, duration)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .start();

            var newRot = box.rotation;
            var rotate = new TWEEN.Tween(box.rotation)
                .to({x: newRot.x, y: newRot.y, z: newRot.z}, duration)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .start();

            var update = new TWEEN.Tween(this)
                .to({}, duration)
                .onUpdate(_.bind(render, this))
                .start();

            box.remove(box.label);
            if (!_categoryTitlesOn){
                var label = makeTextSprite(d.name);
                box.label = label;
                box.label.position.setZ(0.5);
                box.add(label);
            }
            else{
                if (d.id in _categoryHolders){
                    var label = makeTextSprite(_categoryHolders[d.id]);
                    box.label = label;
                    box.label.position.setZ(0.5);
                    box.add(label);
                }
            }
        }

        function exitHandler(d) {
            var box = _boxMap[d.id];
            _scene.remove(box);
            delete _boxMap[d.id];
        }

        function transform() {
            TWEEN.removeAll();
            _elements.each(updateHandler);
        }

        function render() {
            _renderer.render(_scene, _camera);
        }

        function animate() {
            requestAnimationFrame(animate);
            TWEEN.update();
            _controls.update();
        }

        function makeTextSprite(message, parameters) {
            if (parameters === undefined) {
                parameters = {};
            }
            var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "arial";
            var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 20;
            var borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 2;
            var borderColor = parameters.hasOwnProperty("borderColor") ? parameters["borderColor"] : {r: 0, g: 0, b: 0, a: 1.0};
            var backgroundColor = parameters.hasOwnProperty("backgroundColor") ? parameters["backgroundColor"] : {r: 255, g: 255, b: 255, a: 1.0};
            var textColor = parameters.hasOwnProperty("textColor") ? parameters["textColor"] : {r: 0, g: 0, b: 0, a: 1.0};
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            context.font = "Bold " + fontsize + "px " + fontface;
            var metrics = context.measureText(message);
            var textWidth = metrics.width;
            context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
            context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";
            context.lineWidth = borderThickness;
            roundRect(context, borderThickness / 2, borderThickness / 2, (textWidth + borderThickness) * 1.1, fontsize * 1.4 + borderThickness, 8);
            context.fillStyle = "rgba(" + textColor.r + ", " + textColor.g + ", " + textColor.b + ", 1.0)";
            context.fillText(message, borderThickness, fontsize + borderThickness);
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            var spriteMaterial = new THREE.SpriteMaterial({map: texture, useScreenCoordinates: false});
            var sprite = new THREE.Sprite(spriteMaterial);
            //sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);
            sprite.scale.set(5 * fontsize, 3 * fontsize, 2 * fontsize);
            return sprite;
        }

        function roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        Treemap3d.load = function(data, groups) {
            var treemap = d3.layout.treemap()
                .size([_width, _height])
                .sticky(true)
                .value(function(d) {
                    return d.volume;
                })
                .sort(function(a, b) {
                    return a.group.localeCompare(b.group);
                });
            _zscaleSocial.domain(d3.extent(data.children, function(d) { return d.social;}));
            _zscaleCompetition.domain(d3.extent(data.children, function(d) { return d.competition;}));

            _elements = selection.datum(data).selectAll(".node")
                .data(treemap.nodes);

            _elements.enter().append("div")
                .attr("class", "node")
                .each(enterHandler);

            _elements.exit().each(exitHandler).remove();

            render();
            animate();
            transform();
        };

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        directionalLight.position.set(-1000, -2000, 4000);
        _scene.add(directionalLight);

        // add subtle ambient lighting
        var ambientLight = new THREE.AmbientLight(0x313131);
        _scene.add(ambientLight);

        //_controls = new THREE.OrbitControls(_camera, _renderer.domElement);
        _controls = new THREE.TrackballControls(_camera, _renderer.domElement);
        _controls.staticMoving  = true;
        _controls.minDistance = 1000;
        _controls.maxDistance = 10000;
        _controls.rotateSpeed = 1.5;
        _controls.zoomSpeed = 1.5;
        _controls.panSpeed = 0.5;
        _controls.addEventListener('change', render);
    }

    return Treemap3d;
};

d3.csv('user_data/uploadedFile.csv', function(rows){
    var tree = new TreeModel(),
        root,
        count = 0,
        groups = [];

    rows.forEach(function(row) {
        // That's the root
        if (row.Name == 'Keyword') {
            root = tree.parse({ name: row.Name });
        }
        // That's a leaf
        else if (row.Social == '') {
            newNode = tree.parse({ id: count, name: row.Name, group: row.Parent, volume: parseInt(row.Primary), competition: parseFloat(row.Secondary) });
            root.addChild(newNode);
        }
        // That's a category
        else {
            groups.push(row.Name);
            root.walk(function(node){
                if (node.model.group == row.Name){
                    node.model.social = parseInt(row.Social);
                }
            });
        }
        count = count + 1;
    });

    for (var i = 0; i < groups.length; i++){
        var allNodesOfThatGroup = root.all(function (node){
            return node.model.group == groups[i];
        });
        var nodeWithBiggestVolume = allNodesOfThatGroup[0];
        for (var j = 1; j < allNodesOfThatGroup.length; j++){
            if (allNodesOfThatGroup[j].model.volume > nodeWithBiggestVolume.model.volume){
                nodeWithBiggestVolume = allNodesOfThatGroup[j];
            }
        }
        _categoryHolders[nodeWithBiggestVolume.model.id] = groups[i];
    }

    var treemap3d = demo.Treemap3d();
  	d3.select("#container_pehomu").append("div")
      	.style("position", "relative")
      	.call(treemap3d);
    treemap3d.load(root.model, groups);
});

window.addEventListener("resize", function() {
    var newWidth  = window.innerWidth,
        newHeight = window.innerHeight;
    _renderer.setSize(newWidth, newHeight);
    _camera.aspect = newWidth / newHeight;
    _camera.updateProjectionMatrix();
});

// Save to STL logic
THREE.STLExporter = function () {};
THREE.STLExporter.prototype = {

	constructor: THREE.STLExporter,

	parse: ( function () {

		var vector = new THREE.Vector3();
		var normalMatrixWorld = new THREE.Matrix3();

		return function ( scene ) {

			var output = '';

			output += 'solid exported\n';

			scene.traverse( function ( object ) {

				if ( object instanceof THREE.Mesh ) {

					var geometry = object.geometry;
					var matrixWorld = object.matrixWorld;
					var mesh = object;

					if ( geometry instanceof THREE.Geometry ) {

						var vertices = geometry.vertices;
						var faces = geometry.faces;

						normalMatrixWorld.getNormalMatrix( matrixWorld );

						for ( var i = 0, l = faces.length; i < l; i ++ ) {
							var face = faces[ i ];

							vector.copy( face.normal ).applyMatrix3( normalMatrixWorld ).normalize();

							output += '\tfacet normal ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';
							output += '\t\touter loop\n';

							var indices = [ face.a, face.b, face.c ];

							for ( var j = 0; j < 3; j ++ ) {
								var vertexIndex = indices[ j ];
								if (mesh.geometry.skinIndices.length == 0) {
									vector.copy( vertices[ vertexIndex ] ).applyMatrix4( matrixWorld );
									output += '\t\t\tvertex ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';
								} else {
									vector.copy( vertices[ vertexIndex ] ); //.applyMatrix4( matrixWorld );

									// see https://github.com/mrdoob/three.js/issues/3187
									boneIndices = [];
									boneIndices[0] = mesh.geometry.skinIndices[vertexIndex].x;
									boneIndices[1] = mesh.geometry.skinIndices[vertexIndex].y;
									boneIndices[2] = mesh.geometry.skinIndices[vertexIndex].z;
									boneIndices[3] = mesh.geometry.skinIndices[vertexIndex].w;

									weights = [];
									weights[0] = mesh.geometry.skinWeights[vertexIndex].x;
									weights[1] = mesh.geometry.skinWeights[vertexIndex].y;
									weights[2] = mesh.geometry.skinWeights[vertexIndex].z;
									weights[3] = mesh.geometry.skinWeights[vertexIndex].w;

									inverses = [];
									inverses[0] = mesh.skeleton.boneInverses[ boneIndices[0] ];
									inverses[1] = mesh.skeleton.boneInverses[ boneIndices[1] ];
									inverses[2] = mesh.skeleton.boneInverses[ boneIndices[2] ];
									inverses[3] = mesh.skeleton.boneInverses[ boneIndices[3] ];

									skinMatrices = [];
									skinMatrices[0] = mesh.skeleton.bones[ boneIndices[0] ].matrixWorld;
									skinMatrices[1] = mesh.skeleton.bones[ boneIndices[1] ].matrixWorld;
									skinMatrices[2] = mesh.skeleton.bones[ boneIndices[2] ].matrixWorld;
									skinMatrices[3] = mesh.skeleton.bones[ boneIndices[3] ].matrixWorld;

									var finalVector = new THREE.Vector4();
									for(var k = 0; k<4; k++) {
										var tempVector = new THREE.Vector4(vector.x, vector.y, vector.z);
										tempVector.multiplyScalar(weights[k]);
										//the inverse takes the vector into local bone space
										tempVector.applyMatrix4(inverses[k])
										//which is then transformed to the appropriate world space
										.applyMatrix4(skinMatrices[k]);
										finalVector.add(tempVector);
									}
									output += '\t\t\tvertex ' + finalVector.x + ' ' + finalVector.y + ' ' + finalVector.z + '\n';
								}
							}
							output += '\t\tendloop\n';
							output += '\tendfacet\n';
						}
					}
				}

			} );

			output += 'endsolid exported\n';

			return output;
		};
	}() )
};

// Save to STL button
$('#btn-download').on('click', function(){
    var exporter = new THREE.STLExporter();
    var stlString = exporter.parse(_scene);
    var blob = new Blob([stlString], {type: 'text/plain'});
    saveAs(blob, 'scene.stl');
});
