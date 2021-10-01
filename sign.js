/*
 * Signature Plugin
 * HTML5 Canvas Jquery plugin
 *
 * Examples and documentation at: http://tiendasdigitales.net
 *
 * Copyright (c) 2018 Lucas Gabriel Martinez
 *
 * Version: 1.0.0 - 2018/07/24
 * Edit: Nicolas Crittin - 2021/10/01
 *
 * Requires: jQuery v1.3+
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
jQuery(document).ready(function(e) {
  jQuery.fn.sign = function(options) {
    if (!options) options = {};
    var params = jQuery.fn.extend({
        reset: options.resetButton ? options.resetButton : null,
        input: options.destInput ? options.destInput : null,
        format: options.destFormat ? options.destFormat : 'json',  // svg or json
        image: options.destImage ? options.destImage : null,
        width: options.width ? options.width : 500,
        height: options.height ? options.height : 300,
        lineWidth: options.lineWidth ? options.lineWidth : 10,
    }, options);

    var canvas = jQuery(this);

    var lineWidth = params.lineWidth;

    var context = canvas.get(0).getContext('2d');
    context.lineJoin = context.lineCap = 'round';

    var fixFingerPosition = 0;

    canvas.attr("width",params.width);
    canvas.attr("height", params.height);

    var points = [];
    var last = { x:null, y:null };
    var holdClick = false;

    function touch(canvas, evt){
      let totalOffsetX = 0;
      let totalOffsetY = 0;

      do {
        totalOffsetX += canvas.offsetLeft;
        totalOffsetY += canvas.offsetTop;
      } while (canvas = canvas.offsetParent);

      let touch = null;
      if (evt.type !== 'click' && evt.type !== 'mousedown' && evt.type !== 'mousemove') {
        touch = evt.originalEvent.touches[0] || evt.originalEvent.changedTouches[0];
      } else {
        touch = evt;
      }

      return { x: Math.floor(touch.pageX - totalOffsetX),
               y: Math.floor(touch.pageY - totalOffsetY) }
    }

    var getMousePosition = function(canvas, evt) {
      var pos = touch(canvas.get(0), evt);

      return { x: pos.x - fixFingerPosition,
               y: pos.y - fixFingerPosition };
    }

    var draw = function(ctx, x, y) {
      points.push({ x: x,
                    y: y,
                    break: false });
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      var p1 = points[0];
      var p2 = points[1];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);

      for (var i = 1; i < points.length; i++) {
        var midPoint = calculateMiddlePoint(p1, p2);
        if (p1.break) {
          ctx.moveTo(p2.x, p2.y);
        } else {
          ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        }
        p1 = points[i];
        p2 = points[i+1];
      }

      ctx.lineWidth = lineWidth;
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    var svg = function(ctx, x, y) {
      var svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+params.width+' '+params.height+'">';
          svg += '<path style="fill:none;stroke:#000000;stroke-width:'+params.lineWidth+'px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="';

      var p1 = points[0];
      var p2 = points[1];
      var path = "M " + p1.x + " " + p1.y;

      for (var i = 1; i < points.length; i++) {
        var midPoint = calculateMiddlePoint(p1, p2);
        if (p1.break) {
          path += " M " + p2.x + " " + p2.y;
        } else {
          path += " Q " + p1.x + " " + p1.y + " " + midPoint.x + " " + midPoint.y;
        }
        p1 = points[i];
        p2 = points[i+1];
      }

      path += " L " + p1.x + " " + p1.y;

      svg += $.trim(path);
      svg += '"/></svg>';

      return svg;
    }

    var calculateMiddlePoint = function(pointStart, pointEnd) {
      return { x: pointStart.x + (pointEnd.x - pointStart.x) / 2 ,
               y: pointStart.y + (pointEnd.y - pointStart.y) / 2 }
    }

    // Mouse & touch events
    canvas.on('touchstart mousedown', function(e) {
      holdClick = true;
      var mousePosition = getMousePosition(canvas, e);
      points.push({x: mousePosition.x, y: mousePosition.y, break: false});
      return false;
    }).on('touchmove mousemove', function(e) {
      if (holdClick) {
        var mousePosition = getMousePosition(canvas, e);
        draw(context, mousePosition.x, mousePosition.y);
      }
      return false;
    }).on('touchend mouseup', function(e) {
      e.preventDefault();
      holdClick = false;
      points[points.length - 1].break = true;

      if (params.input != null && params.input.length > 0) {
        if (params.format == 'svg') {
          params.input.val(svg());
        } else {
          params.input.val(JSON.stringify(points));
        }
      }
      if (params.image != null && params.image.length > 0) {
        params.image.attr('src', $(this).get(0).toDataURL('image/png')).show();
      }
      return false;
    });

    // Reset canvas
    var reset = function() {
      context.clearRect(0, 0, canvas.width(), canvas.height());
      points.length = 0;
    }

    if (params.reset !== null) {
      params.reset.on('click touchend', function() {
        reset();
      });
    }
  };
});
