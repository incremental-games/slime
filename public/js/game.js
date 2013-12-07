var version = '0.1'; //version number
var canvas = { //the canvas element
	elem: null,
	width: 0,
	height: 0,
	content: null
}; 
var interval_draw;
var image_cache = new Array();
var assets_basic = ['world_map', 'sheet_slime1', 'ui_mockup', 'sheet_location1', 'sheet_location2'];
var player = {
	width: 48,
	height: 26,
	x: 50,
	y: 50,
	animation: {
		name: 'sheet_slime1',
		frames: 4,
		current_frame: 3,
		frame_speed: 500,
		current_tick: 0,
	}
};
var locations = [
	{
		width: 24,
		height: 24,
		x: 310,
		y: 110,
		animation: {
			name: 'sheet_location2',
			frames: 9,
			current_frame: 3,
			frame_speed: 200,
			current_tick: 0,
		}
	},
	{
		width: 24,
		height: 24,
		x: 420,
		y: 145,
		animation: {
			name: 'sheet_location2',
			frames: 9,
			current_frame: 3,
			frame_speed: 200,
			current_tick: 0,
		}
	},
	{
		width: 24,
		height: 24,
		x: 435,
		y: 230,
		animation: {
			name: 'sheet_location2',
			frames: 9,
			current_frame: 3,
			frame_speed: 200,
			current_tick: 0,
		}
	}
];
var game_frame_x;
var game_frame_y;
var frame_update_speed = 50;
var hover = false;
$(document).ready(function () {
	init_canvas();
	canvas.elem = document.getElementsByTagName('canvas')[0];
	canvas.context = canvas.elem.getContext("2d");
	load_basics(0);
	interval_draw = setInterval("draw_step()", frame_update_speed);
	$('body').on('click', function (e) {
		var mouse = {
			x: e.clientX,
			y: e.clientY
		};
		if (hover) {
			player.x = mouse.x - (player.width / 2);
			player.y = mouse.y - (player.height / 2);
		}
	});
	$('body').on('mousemove', function (e) {
		var mouse = {
			x: e.clientX,
			y: e.clientY
		};
		[].forEach.call(locations, function (location) {
			var dist = lineDistance(mouse, location);
			if (dist < 25) {
				location.animation.name = 'sheet_location1';
				hover = true;
				$('canvas').css('cursor', 'pointer');
			} else if (hover && location.animation.name == 'sheet_location1'){
				location.animation.name = 'sheet_location2';
				hover = false;
				$('canvas').css('cursor', 'default');
			}
		});
	});
});
function init_canvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	game_frame_x = (canvas.width - 960) / 2;
	game_frame_y = (canvas.height - 480) / 2;
	player.x = game_frame_x + 410;
	player.y = game_frame_y + 150;
	[].forEach.call(locations, function (location) {
		location.x += game_frame_x;
		location.y += game_frame_y;
	});
	$('canvas').attr('width', canvas.width).attr('height', canvas.height);
}
function load_image(name, callback) {
	image_cache[name] = new Image();
	image_cache[name].src = "img/" + name + ".png";
	image_cache[name].onload = function() {
		if (typeof callback == 'function') callback();
	};
}
function load_basics(index) {
	console.log('loading basic index ' + index);
	if (index < assets_basic.length) {
		load_image(assets_basic[index], function () {
			load_basics(index+1);
		});
	}
}
function draw_step() {
	canvas.context.clearRect(0, 0, canvas.width, canvas.height);
	canvas.context.drawImage(image_cache['world_map'], game_frame_x, game_frame_y, 960, 480);
	[].forEach.call(locations, function (location) {
		draw_object(location);
	});
	draw_object(player);
	draw_ui();
}
function draw_ui() {
	canvas.context.clearRect(0, 0, 246, 426);
	canvas.context.drawImage(image_cache['ui_mockup'], 0, 0);
}
function draw_object(obj) {
	if (typeof image_cache[obj.animation.name] != 'object' || !image_cache[obj.animation.name].complete || 
	typeof image_cache[obj.animation.name].naturalWidth == "undefined" ||
	image_cache[obj.animation.name].naturalWidth < 1
	) {
		console.log('error on ' + obj.animation.name);
		return;
	}
	canvas.context.drawImage(image_cache[obj.animation.name],
		srcX = obj.width * obj.animation.current_frame,
		srcY = 0,
		srcW = obj.width,
		srcH = obj.height,
		destX = obj.x,
		destY = obj.y,
		destW = obj.width,
		destH = obj.height
	);
	if (obj.animation.current_tick > obj.animation.frame_speed) {
		obj.animation.current_frame++;
		if (obj.animation.current_frame >= obj.animation.frames) obj.animation.current_frame = 0;
		obj.animation.current_tick = 0;
	} else {
		obj.animation.current_tick += obj.animation.frame_speed;
	}
}

/* misc helper functions */

function lineDistance( point1, point2 ) {
    var xs = 0;
    var ys = 0;
     
    xs = point2.x - point1.x;
    xs = xs * xs;
     
    ys = point2.y - point1.y;
    ys = ys * ys;
     
    return Math.sqrt( xs + ys );
}