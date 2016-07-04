/**
 * Created by lalittanwar on 29/06/16.
 */


(function(win) {
    var IMAGE_TYPE = "image/png", BOUNDARY = "lntboundary";
    var COUNTER = 0;
    var jq = win.jQuery;

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

    function white2transparent(img, method) {
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
        var factor = 0.5 //CHANGE THIS;

        function getRedNess(pixel, p) {
            return (pixel[p + r] * 0.8 + pixel[p + g] * 0.1 + pixel[p + b] * 0.1)
        }

        function getBlueNess(pixel, p) {
            return (pixel[p + r] * 0.1 + pixel[p + g] * 0.1 + pixel[p + b] * 0.8)
        }

        function getBlackNess(pixel, p) {
            return (pixel[p + r] * 0.33 + pixel[p + g] * 0.33 + pixel[p + b] * 0.33)
        }

        var blueRange = 150, blackRange = 100;

        function isRetainBlue(pixel, p) {
            return (pixel[p + r] < blueRange || pixel[p + g] < blueRange ) && pixel[p + b] > blackRange;
        }

        function isRetainBlack(pixel, p) {
            return pixel[p + r] < blackRange && pixel[p + g] < blackRange && pixel[p + b] < blackRange;
        }

        function colorBand(value) {
            return Math.round(value / gap) * gap;
        }

        function darken(value) {
            return value;// * factor;
        }

        function contrast(value) {
            return colorBand(value > 128 ? (255 - (255 - value) * factor) : value * factor);
        }


        var p;
        method = method || 1;

        var methodOne = function() {
            var bandsRed = [], bandsBlue = [], bandsBlack = [], bandIndex = 0, redness = 0, blueness = 0, blackness = 0;
            for (p = 0; p < pixel.length; p += 4) {
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

            var lastGap = 0;
            cutoff = 0;
            for (var i = 1; i < bandsBlack.length / 2; i++) {
                var _lastGap = bandsBlack[i - 1].value - bandsBlack[i].value;
                if (_lastGap > lastGap) {
                    cutoff = i;
                }
                lastGap = _lastGap;
            }

            factor *= factor;
            for (p = 0; p < pixel.length; p += 4) {
                redness = Math.round(getRedNess(pixel, p) / gap);
                blueness = Math.round(getBlueNess(pixel, p) / gap);
                blackness = Math.round(getBlackNess(pixel, p) / gap);

                isBlue = (blueness === bandsBlue[bandsBlue.length - 1].range) || isRetainBlue(pixel, p);
                isBlack = isRetainBlack(pixel, p);
                isRed = (redness === bandsRed[0].range);
                isWhite = (blackness > bandsBlack[Math.round(bandsBlack.length / 3)].range);
                retainBlue = isRetainBlue(pixel, p);
                retainBlack = isRetainBlack(pixel, p);

                var isCommon = false, isRare = false;
                for (i = 0; i < cutoff; i++) {
                    if (blackness === bandsBlack[i].range) {
                        isCommon = true;
                    } else if (blackness === bandsBlack[bandsBlack.length - 1 - i].range) {
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
                } else {
//                    pixel[p + r] = contrast(pixel[p + r]);
//                    pixel[p + g] = contrast(pixel[p + g]);
//                    pixel[p + b] = contrast(pixel[p + b]);
                }
            }
        }, methodTwo = function() {
            for (p = 0; p < pixel.length; p += 4) {
                // Y = (pixel[p+r]*.1 + pixel[p+g]*.3 + pixel[p+b]*.6);
                //var inRange = (Y1 > Y ||  Y>Y2)
                var retainBlue = isRetainBlue(pixel, p);
                var retainBlack = isRetainBlack(pixel, p);
                if (!(retainBlue || retainBlack)) {
                    pixel[p + a] = 0;
                } else {
                    pixel[p + r] = contrast(pixel[p + r]);
                    pixel[p + g] = contrast(pixel[p + g]);
                    pixel[p + b] = contrast(pixel[p + b]);
                }
            }
        };

        if (method === 1) {
            methodOne();
        } else if (method === 2) {
            methodTwo();
        } else {
            methodOne();
            var pixel1 = pixel;
            imageData = ctx.getImageData(0, 0, w, h);
            pixel = imageData.data;
            methodTwo();
            var pixel2 = pixel;
            for (p = 0; p < pixel1.length; p += 4) {
                pixel[p + r] = (pixel1[p + r] * 0.5 + pixel2[p + r] * 0.5);
                pixel[p + g] = (pixel1[p + g] * 0.5 + pixel2[p + g] * 0.5);
                pixel[p + b] = (pixel1[p + b] * 0.5 + pixel2[p + b] * 0.5);
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return c.toDataURL(IMAGE_TYPE);
    }

    win.signature = function($dom) {
        var $self = $dom, $img = $self.find('img');
        var deg2Rad = Math.PI / 180, current_image;
        return ({
            init: function() {
                var self = this;
                $dom.simpleCropper(function() {
                    self.angle = 0;
                    self.clear3();
                });
                return this;
            },
            checkOriginal: function(method) {
                if (this.method === undefined || !$img[0].getAttribute("original")) {
                    $img = $self.find('img');
                    this.originaSource = $img[0].src;
                    $img[0].setAttribute("original", "original");
                }
                if (this.method !== method) {
                    $img[0].src = this.originaSource;
                }
                this.method = method;
            },
            clear: function() {
                return this.clear2();
            },
            clear1: function() {
                this.checkOriginal(0);
                $img = $self.find('img');
                $img[0].src = white2transparent($img[0], 1);
                this.source = $img[0].src;
            },
            clear2: function() {
                this.checkOriginal(2);
                $img = $self.find('img');
                $img[0].src = white2transparent($img[0], 2);
                this.source = $img[0].src;
            },
            clear3: function() {
                this.checkOriginal(3);
                $img = $self.find('img');
                $img[0].src = white2transparent($img[0], 3);
                this.source = $img[0].src;
            },
            /**
             * Rotates image with given anagle.
             *
             * @param angle
             */
            rotate: function(angle) {
                this.angle = this.angle + angle;
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                var current_image = new win.Image();
                current_image.src = this.source;
                var w = current_image.width, h = current_image.height;
                console.error(current_image, w, h);
                canvas.width = w;
                canvas.height = h;
                context.width = w;
                context.height = h;
                var cx = w / 2;
                var cy = h / 2;
                context.clearRect(0, 0, w, h);
                context.fillStyle = "rgba(216,216,150,1.0)";
                context.translate(cx, cy);
                context.rotate(this.angle * deg2Rad);
                //context.translate(0, 0);
                context.drawImage(current_image, -cx, -cy, w, h);
                $img[0].src = canvas.toDataURL(IMAGE_TYPE);
            },
            getCanvasData: function(type) {
                return this.source.replace('data:' + (type || IMAGE_TYPE) + ';base64,', '');
            },
            /**
             * This function converts dataUri string to binary data string
             * dataUri is this.source
             *
             * @param _options { filename, fileparam, url }
             * @returns {ArrayBuffer}
             */
            convertToBinary: function(_options) {
                var options = _options || {};
                options.type = options.type || IMAGE_TYPE;
                options.fileparam = options.fileparam || "file";
                options.filename = options.filename || (new Date()).getTime() + "-" + (++COUNTER) + ".png";

                var canvasData = this.getCanvasData(options.type);

                var boundary = options.boundary || BOUNDARY;
                var dataList = [
                        '--' + boundary,
                        'Content-Disposition: form-data; name="' + options.fileparam + '"; filename="' + options.filename + '"',
                        'Content-Type: ' + options.type,
                    '',
                    win.atob(canvasData)
                ];

                options.data = options.data || {};

                options.data.filename = options.data.filename || options.filename;

                for (var i in options.data) {
                    dataList.push(
                            '--' + boundary,
                            'Content-Disposition: form-data; name="' + i + '"',
                        '',
                        options.data[i]
                    );
                }
                dataList.push('--' + boundary + '--');
                var bytes = Array.prototype.map.call(dataList.join('\r\n'), function(c) {
                    return c.charCodeAt(0) & 0xff;
                });
                return new win.Uint8Array(bytes).buffer;
            },
            /**
             * This function posts the image on provided url and returns promise, with done/then/notify
             * You can use notify to track progress.
             *
             * @param options { filename, fileparam, url }
             * @returns {*}
             */
            post: function(_options) {
                var options = _options || {};
                options.data = this.convertToBinary(options);
                options.url = options.url || '/app/upload';
                options.boundary = options.boundary || BOUNDARY;
                return this.send(options);
            },
            /**
             * This function posts the image on provided url and returns promise, with done/then/notify
             * You can use notify to track progress.
             *
             * @param options { data, url, boundary, filename, fileparam, url }
             * @returns {*}
             */
            send: function(options) {
                var $def = jq.Deferred();
                var xhr = new win.XMLHttpRequest();
                xhr.open("POST", options.url, true);
                xhr.setRequestHeader(
                    'Content-Type', 'multipart/form-data; boundary=' + options.boundary);
                xhr.addEventListener("load", function() {
                    switch (this.status) {
                        case 200: // request complete and successful
                            var data = JSON.parse(xhr.responseText);
                            $def.resolve(data, options);
                            break;
                        default: // request complete but with unexpected response
                            $def.reject({
                                type: "error", code: this.status,
                                msg: "File was not uploaded due to unknown errors"
                            }, options);
                    }
                }, false);
                xhr.onreadystatechange = function() {
                    if (this.readyState === 4 && this.status === 0) {
                        $def.reject({
                            type: "error",
                            msg: "File was not uploaded due to unknown errors"
                        }, options);
                    }
                };
                xhr.upload.addEventListener("progress", function(event) {
                    console.info(event);
                    $def.notify(event);
                }, false);

                xhr.send(options.data);
                return $def.promise();
            }
        }).init();
    };
})(this);
