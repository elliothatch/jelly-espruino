function lerp(a, b, t) {
	return (b-a)*t + a;
}

function lerpHsv(h1, s1, v1, h2, s2, v2, t) {
		// Hue interpolation
		var h;
		var t2 = t;
		var d = h2 - h1;
		if (h1 > h2)
		{
			// Swap (h1, h2)
			var h3 = h2;
			h2 = h1;
			h1 = h3;

			d = -d;
			t2 = 1 - t;
		}

		if (d > 0.5) // 180deg
		{
			h1 = h1 + 1; // 360deg
			h = ( h1 + t2 * (h2 - h1) ) % 1; // 360deg
		}
		if (d <= 0.5) // 180deg
		{
			h = h1 + t2 * d;
		}

		// Interpolates the rest
		return {
			h: h,
			s: s1 + t * (s2-s1),
			v: v1 + t * (v2-v1)
		};
	}

/** lerp across an HSV gradient
* @param stops: {color: {h, s, v}, t: number}
*/
function lerpGradientHsv(stops, t) {
	if(t > 1) {
		t = 1;
	}
	var s2Index = stops.findIndex(function(s) { return s.t > t; });
	if(s2Index === -1) {
		s2Index = stops.length-1;
	}
	var s1 = stops[s2Index-1];
	var s2 = stops[s2Index];
	var t2 = (t - s1.t)/(s2.t - s1.t);
	return lerpHsv(s1.h, s1.s, s1.v, s2.h, s2.s, s2.v, t2);
}

function HSVtoRGB(h, s, v) {
	var r, g, b, i, f, p, q, t;
	if (h && s === undefined && v === undefined) {
		s = h.s; v = h.v; h = h.h;
	}
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
		case 0: r = v; g = t; b = p; break;
		case 1: r = q; g = v; b = p; break;
		case 2: r = p; g = v; b = t; break;
		case 3: r = p; g = q; b = v; break;
		case 4: r = t; g = p; b = v; break;
		case 5: r = v; g = p; b = q; break;
	}
	return {
		r: Math.floor(r * 255),
		g: Math.floor(g * 255),
		b: Math.floor(b * 255)
	};
}

function RGBtoHSV(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;

  var d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return {
		h: h,
		s: s,
		v:v
  	};
}

exports = {
	lerp: lerp,
	lerpHsv: lerpHsv,
	lerpGradientHsv: lerpGradientHsv,
	HSVtoRGB: HSVtoRGB,
	RGBtoHSV: RGBtoHSV,
};
