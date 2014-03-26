// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 
// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

// Beginning of code

var fps = 60;
var scale = 100;

var aGrav = -9.81; // m/s^2
var dFluid = 1.22; // kg/m^3

var ball = {
	p: {x: 50, y: 600},
	v: {x: -0, y: 0.00001},
	m: 1.5, // kg
	r: 0.25, // m
	restitution: -0.9,
	cDrag: 0.47
};

var equation = {
	a: 1,
	b: 1,
	c: 1
};

var gridScale = 60;

var a = Math.PI * Math.pow(ball.r, 2);
var Fg = ball.m * aGrav;
var ctx = null;
var ctxStatic = null;
var width = window.innerWidth;
var height = window.innerHeight;

var count = null;

function setup() {
	var canvas = document.getElementById("canvas");
	var canvasStatic = document.getElementById("static");
	ctx = canvas.getContext("2d");
	ctxStatic = canvasStatic.getContext("2d");
	
	ctx.canvas.width = width;
    ctx.canvas.height = height;
	ctxStatic.canvas.width = width;
    ctxStatic.canvas.height = height;
	
	ctx.fillStyle = 'red';
	ctx.strokeStyle = '#000000';
	ctxStatic.translate(0,height);
	
	draw();
	drawStatic();
};

function drawStatic() {
	ctxStatic.clearRect(0,0,width,-height);
	ctxStatic.strokeStyle = '#D1D1D1';
	ctxStatic.lineJoin = 'round';
	ctxStatic.lineWidth = '1';
	
	for (var i = 0; i <= width; i += gridScale){
		ctxStatic.beginPath();
		for(var p =0; p >= -height; p += -1) {
			ctxStatic.lineTo(i, p  );
		}
		ctxStatic.stroke();
	}
	
    for (var i = 0; i >= -height; i += -gridScale){
		ctxStatic.beginPath();
		for(var p =0; p <= width; p += 1) {
			ctxStatic.lineTo(p, i  );
		}
		ctxStatic.stroke();
	} 
	
	ctxStatic.strokeStyle = '#000000';
	ctxStatic.beginPath();
	for(var p =0; p <= width; p += 1) {
		ctxStatic.lineTo(p, -equat(p));
	}
	ctxStatic.lineJoin = 'round';
	ctxStatic.lineWidth = '4';
	ctxStatic.stroke();
}
		
function equat(x){
	return equation.a / gridScale * Math.pow(x,2) + equation.b * x + gridScale * equation.c;
}

function circDist(x){
	return Math.sqrt(Math.pow(x - ball.p.x,2) + Math.pow(equat(x) - ball.p.y,2));
}

function equatDer(x){
	return 2 * equation.a * x / gridScale + equation.b;
}

function bounce(m,dist){
	return m * dist;
}

var draw = function() {
    setTimeout(function() {
        requestAnimationFrame(draw);
		
		// Update variables
		
		a = Math.PI * Math.pow(ball.r, 2);
		Fg = ball.m * aGrav;
		
		// Adapt canvas size to window size
		
		if(width != window.innerWidth){
			width = window.innerWidth;
			ctx.canvas.width = width;
			ctx.fillStyle = 'red';
			ctx.strokeStyle = '#000000';
			ctxStatic.canvas.width = width;
			drawStatic();
		}
		if(height != window.innerHeight){
			height = window.innerHeight;
			ctx.canvas.height = height;
			ctx.fillStyle = 'red';
			ctx.strokeStyle = '#000000';
			ctxStatic.canvas.height = height;
			drawStatic();
		}
		
        // Animation
		
		var FyDrag = -0.5 * ball.cDrag * a * dFluid * Math.pow(ball.v.y,2) * (ball.v.y / Math.abs(ball.v.y));
		var FxDrag = -0.5 * ball.cDrag * a * dFluid * Math.pow(ball.v.x,2) * (ball.v.x / Math.abs(ball.v.x));
		var Fy = Fg + FyDrag;
		var Fx = FxDrag;
		
		Fx = (isNaN(Fx) ? 0 : Fx);
		Fy = (isNaN(Fy) ? 0 : Fy);
		
		var ay = Fy / ball.m;
		var ax = Fx / ball.m;
		
		ball.v.x += ax / fps;
		ball.v.y += ay / fps;
		
		ball.p.x += ball.v.x / fps * gridScale;
		ball.p.y += ball.v.y / fps * gridScale;
		
	    if (ball.p.y < 0 + ball.r * gridScale) {
        ball.v.y *= ball.restitution;
        ball.p.y = 0 + ball.r * gridScale;
		}
		if (ball.p.x > width - ball.r * gridScale) {
        ball.v.x *= ball.restitution;
        ball.p.x = width - ball.r * gridScale;
    	}
		if (ball.p.x < 0 + ball.r * gridScale) {
        ball.v.x *= ball.restitution;
        ball.p.x = 0 + ball.r * gridScale;
    	}
		
		// Graph collision detection
		if (count >= 0) {
			count += -1;
		}
        for (var i = ball.p.x - ball.r * gridScale; i <= ball.p.x + ball.r * gridScale; i++){
            if (circDist(i) < ball.r * gridScale && count < 0){
                collision(i);
				count = 3;
				break;
            }
			var test = circDist(i);
		}
		
		// Graph collision
		
		function collision(point){
			var ballAngle = null;
			var surface = {
				angle: Math.atan(equatDer(point)),
				normal: Math.atan(-1 / equatDer(point))
			};
			var object = {
				angle: Math.atan(ball.v.y/ball.v.x),
				speed: -Math.sqrt(Math.pow(ball.v.x,2) + Math. pow(ball.v.y,2)) * ball.restitution
			};
			if (ball.v.x <= 0 && ball.v.y >= 0){
				ballAngle = Math.PI + object.angle;
			} else if (ball.v.x >= 0 && ball.v.y >= 0){
			    ballAngle = object.angle;
			} else if (ball.v.y <= 0 && ball.v.x >= 0){
				ballAngle = 2 * Math.PI + object.angle;
			} else if (ball.v.y <= 0 && ball.v.x <= 0){
				ballAngle = Math.PI + object.angle;
			}
			var reflectionAngle = Math.PI - ((ballAngle - Math.PI) - surface.angle) + surface.angle;
			if (reflectionAngle >= Math.PI){
				//ball.v.y = -(Math.abs(Math.tan(reflectionAngle)) / (Math.abs(Math.tan(reflectionAngle)) + 1)) * object.speed;
				ball.v.y = -Math.abs(Math.atan(reflectionAngle)) * Math.sqrt(Math.pow(object.speed,2) / (Math.pow(Math.atan(reflectionAngle),2) + 1));
			} else if (reflectionAngle < Math.PI){
				//ball.v.y = (Math.abs(Math.tan(reflectionAngle)) / (Math.abs(Math.tan(reflectionAngle)) + 1)) * object.speed;
				ball.v.y = Math.abs(Math.atan(reflectionAngle)) * Math.sqrt(Math.pow(object.speed,2) / (Math.pow(Math.atan(reflectionAngle),2) + 1));
			}
			if (reflectionAngle >= Math.PI / 2 && reflectionAngle <= 3 / 2 * Math.PI){
				//ball.v.x = -(1 / (Math.abs(Math.tan(reflectionAngle)) + 1) * object.speed);
				ball.v.x = -Math.sqrt(Math.pow(object.speed,2) / (Math.pow(Math.atan(reflectionAngle),2) + 1));
			} else if (reflectionAngle < Math.PI / 2 || reflectionAngle > 3 / 2 * Math.PI){
				//ball.v.x = (1 / (Math.abs(Math.tan(reflectionAngle)) + 1) * object.speed);
				ball.v.x = Math.abs(Math.atan(reflectionAngle)) * Math.sqrt(Math.pow(object.speed,2) / (Math.pow(Math.atan(reflectionAngle),2) + 1));
			}
			
			// Place ball above surface
			
			/* var pointSlope = (ball.p.y - equat(point))/(ball.p.x - point);
			if (ball.p.x <= point) {
				ball.p.x = -Math.sqrt(Math.pow(ball.r * gridScale,2) / (Math.pow(pointSlope,2) + 1)) + point;
			} else if (ball.p.x > point) {
				ball.p.x = Math.sqrt(Math.pow(ball.r * gridScale,2) / (Math.pow(pointSlope,2) + 1)) + point;
			}
			if (ball.p.y <= equat(point)) {
				ball.p.y = -pointSlope * Math.sqrt(Math.pow(ball.r * gridScale,2) / (Math.pow(pointSlope,2) + 1)) + equat(point);
			} else if (ball.p.y > equat(point)) {
				ball.p.y = pointSlope * Math.sqrt(Math.pow(ball.r * gridScale,2) / (Math.pow(pointSlope,2) + 1)) + equat(point);
			} */
		}
		
		// Drawing the ball
		ctx.clearRect(0,0,width,height);
		
		ctx.beginPath();
		ctx.arc(ball.p.x, height - ball.p.y, ball.r * gridScale, 0, Math.PI * 2, true);
		ctx.fill();
		ctx.closePath();
    }, 1000 / fps);
};
canvas.addEventListener("mousedown", getPosition, false);
function getPosition(event)
{
  var x = event.x;

  x -= canvas.offsetLeft;
	ball.v.x = -5;
	ball.v.y = 0.000001;
	ball.p.x = x;
	ball.p.y = height - event.y;
}
/* $(document).ready(function (){
    $('input').change(function() {
            this.form.submit();
    });
}); */

function getValues() {
	equation = {
		a: document.getElementById('inpA').value,
		b: document.getElementById('inpB').value,
		c: document.getElementById('inpC').value 
	};
	drawStatic();
	return false;
}

function reset() {
    equation = {
        a: 1,
        b: 1,
        c: 1
    };
    document.getElementById('inpA').value = 1;
    document.getElementById('inpB').value = 1;
    document.getElementById('inpC').value = 1;
    drawStatic();
}
setup();