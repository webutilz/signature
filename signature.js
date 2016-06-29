/**
 * Created by lalittanwar on 29/06/16.
 */


(function(win) {
    function orderedArray(array) {
        var lastVal = 0
        return array.map(function(value, index) {
            return { range: index, value: value}
        }).sort(function(a, b) {
            return a.value > b.value ? -1 : 1;
        }).filter(function(val) {
            return !!val;
        });
    }

    function white2transparent(img) {
        var c = document.createElement('canvas'),
            threshold = 150;

        var w = img.width, h = img.height;

        c.width = w;
        c.height = h;

        var ctx = c.getContext('2d');

        ctx.width = w;
        ctx.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        var imageData = ctx.getImageData(0, 0, w, h);
        var pixel = imageData.data;

        var r = 0, g = 1, b = 2, a = 3;
        var gap = 20;
        var factor = 1.0 //CHANGE THIS;

        function getRedNess(pixel, p) {
            return (pixel[p + r] * .8 + pixel[p + g] * .1 + pixel[p + b] * .1)
        }

        function getBlueNess(pixel, p) {
            return (pixel[p + r] * .1 + pixel[p + g] * .1 + pixel[p + b] * .8)
        }

        function getBlackNess(pixel, p) {
            return (pixel[p + r] * .33 + pixel[p + g] * .33 + pixel[p + b] * .33)
        }

        function colorBand(value) {
            return Math.round(value / gap) * gap;
        }

        function darken(value) {
            return value * factor;
        }

        function contrast(value) {
            return colorBand(value > 128 ? (255 - (255 - value) * factor) : value * factor);
        }

        var bandsRed = [], bandsBlue = [], bandsBlack = [], bandIndex = 0, redness = 0, blueness = 0, blackness = 0;
        for (var p = 0; p < pixel.length; p += 4) {
            pixel[p + r] = darken(pixel[p + r]);
            pixel[p + g] = darken(pixel[p + g]);
            pixel[p + b] = darken(pixel[p + b]);
            redness = getRedNess(pixel, p);
            blueness = getBlueNess(pixel, p);
            blackness = getBlackNess(pixel, p);

            bandIndex = Math.round(redness / gap);
            bandsRed[bandIndex] = bandsRed[bandIndex] > 0 ? (++bandsRed[bandIndex]) : 1;

            bandIndex = Math.round(blueness / gap);
            bandsBlue[bandIndex] = bandsBlue[bandIndex] > 0 ? (++bandsBlue[bandIndex]) : 1;

            bandIndex = Math.round(blackness / gap);
            bandsBlack[bandIndex] = bandsBlack[bandIndex] > 0 ? (++bandsBlack[bandIndex]) : 1;
        }

        bandsRed = orderedArray(bandsRed);
        bandsBlue = orderedArray(bandsBlue);
        bandsBlack = orderedArray(bandsBlack);

        console.error(bandsRed, bandsBlue, bandsBlue.length, bandsBlack);
        var isBlue = false, isRed = false, isBlack = false, isWhite = false;
        var cutoff = 4;//CHNAGE THIS

//        var lastGap = 0,cutoff=0;
//        for(var i=1; i<bandsBlack.length/2;i++){
//            var _lastGap = bandsBlack[i-1].value - bandsBlack[i].value;
//            if(_lastGap>lastGap){
//                cutoff = i;
//            }
//            lastGap = _lastGap;
//        }

        factor *= factor;
        for (var p = 0; p < pixel.length; p += 4) {
            redness = Math.round(getRedNess(pixel, p) / gap);
            blueness = Math.round(getBlueNess(pixel, p) / gap);
            blackness = Math.round(getBlackNess(pixel, p) / gap);

            isBlue = (blueness == bandsBlue[bandsBlue.length - 1].range);
            isRed = (redness == bandsRed[0].range);
            isWhite = (blackness > bandsBlack[Math.round(bandsBlack.length / 3)].range);

            var isCommon = false, isRare = false;
            for (var i = 0; i < cutoff; i++) {
                if (blackness == bandsBlack[i].range) {
                    isCommon = true;
                } else if (blackness == bandsBlack[bandsBlack.length - 1 - i].range) {
                    isRare = true;
                }
            }
            if (isCommon && !isBlue) {
                pixel[p + a] = 0;
            } else if (isRare && isBlue) {
                pixel[p + r] = contrast(pixel[p + r]);
                pixel[p + g] = contrast(pixel[p + g]);
                pixel[p + b] = contrast(pixel[p + b]);
            } else if (isRed && !isBlue) {
                pixel[p + a] = 0;
            } else if (isWhite) {
                pixel[p + a] = 0;
            }
        }

//        var d = 255 * factor / 2, Y0 = Y / pixel.length, Y1 = Y0 - d, Y2 = Y0 + d;
//        for (var p = 0; p < pixel.length; p += 4) {
//            // Y = (pixel[p+r]*.1 + pixel[p+g]*.3 + pixel[p+b]*.6);
//            //var inRange = (Y1 > Y ||  Y>Y2)
//            var retainBlue = (pixel[p + r] < blueRange || pixel[p + g] < blueRange ) && pixel[p + b] > blackRange;
//            var retainBlack = pixel[p + r] < blackRange && pixel[p + g] < blackRange && pixel[p + b] < blackRange;
//            if (!(retainBlue || retainBlack)) {
//                pixel[p + a] = 0;
//            }
//        }

        ctx.putImageData(imageData, 0, 0);
        return c.toDataURL('image/png');
    }

    win.signature = function($dom) {
        var $self = $dom, $img = $self.find('img');
        $dom.simpleCropper();
        return {
            clear: function() {
                $img = $self.find('img');
                $img[0].src = white2transparent($img[0]);
                this.source = $img[0].src;
            },
            rotate: function(angle) {

            }
        };
    };
})(this);
