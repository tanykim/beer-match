define(['jquery', 'd3'], function ($, d3) {

	var widths = {
		frequency: 8,
		calendar: 12
	};

	var heights = {
		frequency: 300,
		calendar: null
	};

	var margins = {
		frequency: { top: 100, right: 40, bottom: 50, left: 60},
		calendar: { top: 50, bottom: 40, left: 40, right: 30}
	}

   	var getWidth = function(div) {
   		console.log($('.vis').find('.container').width());
   		return $('.vis').find('.container').width() / 12 * widths[div]; // 15 is margin
   	};

   	function drawSVG(vis, div) {
   		console.log(vis, div);
		var svg = d3.select('#vis-' + div).append('svg')
			.attr('width', vis.dim.w + vis.margin.left + vis.margin.right)
			.attr('height', vis.dim.h + vis.margin.top + vis.margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + vis.margin.left + ', ' + vis.margin.top + ')');
		return svg;
   	};

   	var setVisNoSVG = function (div) {
   		var w = getWidth(div); // 15 is margin
   		return {
   			w: w,
   			margin: margins[div],
   			draw: drawSVG
   		};
   	};

   	var setVis = function(div, callback) {
		var vis = {
			dim: {
				w: getWidth(div) - margins[div].left - margins[div].right,
				h: heights[div] - margins[div].top - margins[div].bottom
			},
			margin: margins[div]
		}
		vis.svg = drawSVG(vis, div);
		callback(vis);
   	};

	return {
		setVisNoSVG: setVisNoSVG,
		setVis: setVis
	};

});