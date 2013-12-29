(function() {
	"use strict";

	var canvas = document.getElementById("fireworkCanvas"),
		ctx,

		width = window.innerWidth,
		height = window.innerHeight;

	canvas.width = width;
	canvas.height = height;

	var gl;

	var pMatrix = mat4.create(),
		mvMatrix = mat4.create();

	var particleVertexPosBuffer,
		particleVertexColorBuffer,
		particleVertexSizeBuffer;

	var shaderProgram;

	function initGL(canvas) {
        try {
            gl = canvas.getContext("experimental-webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
    }

	function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    function initShaders() {
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
        gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

        shaderProgram.vertexSizeAttribute = gl.getAttribLocation(shaderProgram, "aVertexSize");
        gl.enableVertexAttribArray(shaderProgram.vertexSizeAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    }


    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    }

	function initBuffers() {
		particleVertexPosBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, particleVertexPosBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(), gl.DYNAMIC_DRAW);

		particleVertexColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, particleVertexColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(), gl.DYNAMIC_DRAW);

		particleVertexSizeBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, particleVertexSizeBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(), gl.DYNAMIC_DRAW);
	}


	function draw() {
		gl.viewport(0, 0, width, height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		mat4.perspective(pMatrix, Math.PI / 2, width / height, 0.1, 100.0);

		mat4.identity(mvMatrix);

		mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -2.0]);
		gl.bindBuffer(gl.ARRAY_BUFFER, particleVertexPosBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, particleVertexColorBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, particleVertexSizeBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexSizeAttribute, 1, gl.FLOAT, false, 0, 0);

		setMatrixUniforms();
		gl.drawArrays(gl.POINTS, 0, particleSystem.vertices.length / 3);
	}


	var gravityVector = new Vector(0, -9.87, 0);

	var particleSystem = new ParticleSystem();

	var rockets = [],
		rocketInterval = 1000,
		lastRocket = 0;

	var lastT, dt;
	function run(t) {
		dt = t - lastT;
		lastT = t;
		
		window.requestAnimationFrame(run);

		if (Date.now() > lastRocket + rocketInterval) {
			rockets.push(new Rocket(0, -3, 1, 3000, particleSystem));

			lastRocket = Date.now();
		}
		for (var i = 0; i < rockets.length; i++) {
			rockets[i].update(16);
		}

		particleSystem.update(16, ctx);
		gl.bindBuffer(gl.ARRAY_BUFFER, particleVertexPosBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particleSystem.vertices), gl.DYNAMIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, particleVertexColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particleSystem.colors), gl.DYNAMIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, particleVertexSizeBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particleSystem.sizes), gl.DYNAMIC_DRAW);

		draw();
	}


	function flushRockets() {
		this.rockets = this.rockets.filter(function(elem) {
			return elem.alive;
		});
	}

	window.setInterval(flushRockets, 1000);

	initGL(canvas);
	initShaders();
	initBuffers();

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	window.requestAnimationFrame(run);
})();