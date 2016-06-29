/* 
    Author     : Tomaz Dragar
    Mail       : <tomaz@dragar.net>
    Homepage   : http://www.dragar.net
*/

(function ($) {

    $.fn.simpleCropper = function (onComplete) {

        var image_dimension_x = 600;
        var image_dimension_y = 600;
        var scaled_width = 0;
        var scaled_height = 0;
        var x1 = 0;
        var y1 = 0;
        var x2 = 0;
        var y2 = 0;
        var current_image = null;
        var image_filename = null;
        var aspX = 1;
        var aspY = 1;
        var file_display_area = null;
        var ias = null;
        var original_data = null;
        var jcrop_api;
        var deg2Rad = Math.PI / 180;
        var bottom_html = "<input type='file' id='fileInput' name='files[]'/ accept='image/*'>" +
            "<canvas id='myCanvas' style='display:none;'></canvas><div id='modal'></div><div id='preview'>" +
            "<div class='buttons'><div class='rotate-left'>left</div><div class='rotate-right'>right</div>" +
            "<div class='cancel'></div><div class='ok'></div></div></div>";
        $('body').append(bottom_html);

        //add click to element
        this.click(function () {
            aspX = $(this).width();
            aspY = $(this).height();
            file_display_area = $(this);
            $('#fileInput').click();
        });

        $(document).ready(function () {
            //capture selected filename
            $('#fileInput').change(function (click) {
                imageUpload($('#preview').get(0));
                // Reset input value
                $(this).val("");
            });

            //ok listener
            $('.ok').click(function () {
                preview();
                $('#preview').delay(100).hide();
                $('#modal').hide();
                jcrop_api.destroy();
                reset();
            });

            //cancel listener
            $('.cancel').click(function (event) {
                $('#preview').delay(100).hide();
                $('#modal').hide();
                jcrop_api.destroy();
                reset();
            });

            $('.rotate-left').click(function () {
               console.error("rotate-left");
                rotate();
            });

            $('.rotate-right').click(function () {
                console.error("rotate-right");
                rotate();
            });
        });

        function reset() {
            scaled_width = 0;
            scaled_height = 0;
            x1 = 0;
            y1 = 0;
            x2 = 0;
            y2 = 0;
            current_image = null;
            image_filename = null;
            original_data = null;
            aspX = 1;
            aspY = 1;
            file_display_area = null;
        }

        function rotate(){
            var canvas = document.getElementById('myCanvas');
            var context = canvas.getContext('2d');
            var w = current_image.width, h = current_image.height;
            console.error(current_image,w,h);
            canvas.width = w;
            canvas.height = h;
            context.width = w;
            context.height = h;
            var cx = w / 2;
            var cy = h / 2;
            context.clearRect(0, 0, w, h);
            context.fillStyle = "rgba(216,216,150,1.0)";
            context.translate(cx, cy);
            context.rotate(10 * deg2Rad);
            //context.translate(0, 0);
            context.drawImage(current_image, -cx,-cy,w,h);
            current_image.src = canvas.toDataURL('image/png');
            console.error(current_image,-w,-h);
        }
        function imageUpload(dropbox) {
            var file = $("#fileInput").get(0).files[0];

            var imageType = /image.*/;

            if (file.type.match(imageType)) {
                var reader = new FileReader();
                image_filename = file.name;

                reader.onload = function (e) {
                    // Clear the current image.
                    console.error("reader.onload")
                    $('#photo').remove();

                    original_data = reader.result;

                    // Create a new image with image crop functionality
                    current_image = new Image();
                    current_image.src = reader.result;
                    current_image.id = "photo";
                    current_image.style['maxWidth'] = image_dimension_x + 'px';
                    current_image.style['maxHeight'] = image_dimension_y + 'px';
                    current_image.onload = function () {
                        console.error("current_image.onload")
                        // Calculate scaled image dimensions
                        if (current_image.width > image_dimension_x || current_image.height > image_dimension_y) {
                            if (current_image.width > current_image.height) {
                                scaled_width = image_dimension_x;
                                scaled_height = image_dimension_x * current_image.height / current_image.width;
                            }
                            if (current_image.width < current_image.height) {
                                scaled_height = image_dimension_y;
                                scaled_width = image_dimension_y * current_image.width / current_image.height;
                            }
                            if (current_image.width === current_image.height) {
                                scaled_width = image_dimension_x;
                                scaled_height = image_dimension_y;
                            }
                        } else {
                            scaled_width = current_image.width;
                            scaled_height = current_image.height;
                        }

                        // set the image size to the scaled proportions which is required for at least IE11
                        current_image.style['width'] = scaled_width + 'px';
                        current_image.style['height'] = scaled_height + 'px';

                        // Position the modal div to the center of the screen
                        $('#modal').css('display', 'block');
                        var window_width = $(window).width() / 2 - scaled_width / 2 + "px";
                        var window_height = $(window).height() / 2 - scaled_height / 2 + "px";

                        // Show image in modal view
                        $("#preview").css("top", window_height);
                        $("#preview").css("left", window_width);
                        $('#preview').show(500);


                        // Calculate selection rect
                        var selection_width = 0;
                        var selection_height = 0;

                        var max_x = Math.floor(scaled_height * aspX / aspY);
                        var max_y = Math.floor(scaled_width * aspY / aspX);


                        if (max_x > scaled_width) {
                            selection_width = scaled_width;
                            selection_height = max_y;
                        }
                        else {
                            selection_width = max_x;
                            selection_height = scaled_height;
                        }

                        ias = $(this).Jcrop({
                            onSelect: showCoords,
                            onChange: showCoords,
                            bgColor: '#747474',
                            bgOpacity: 0.4,
                            aspectRatio: aspX / aspY,
                            setSelect: [0, 0, selection_width, selection_height]
                        }, function () {
                            jcrop_api = this;
                        });
                    }

                    // Add image to dropbox element
                    console.error("current_image",current_image)
                    dropbox.appendChild(current_image);
                }

                reader.readAsDataURL(file);
            } else {
                dropbox.innerHTML = "File not supported!";
            }
        }

        function showCoords(c) {
            x1 = c.x;
            y1 = c.y;
            x2 = c.x2;
            y2 = c.y2;
        }

        function preview() {
            // Set canvas
            var canvas = document.getElementById('myCanvas');
            var context = canvas.getContext('2d');

            // Delete previous image on canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Set selection width and height
            var sw = x2 - x1;
            var sh = y2 - y1;


            // Set image original width and height
            var imgWidth = current_image.naturalWidth;
            var imgHeight = current_image.naturalHeight;

            // Set selection koeficient
            var kw = imgWidth / $("#preview").width();
            var kh = imgHeight / $("#preview").height();

            // Set canvas width and height and draw selection on it
            canvas.width = aspX;
            canvas.height = aspY;
            //context.rotate(45 * deg2Rad);
            context.drawImage(current_image, (x1 * kw), (y1 * kh), (sw * kw), (sh * kh), 0, 0, aspX, aspY);

            // Convert canvas image to normal img
            var dataUrl = canvas.toDataURL();
            var imageFoo = document.createElement('img');
            imageFoo.src = dataUrl;

            // Append it to the body element
            $('#preview').delay(100).hide();
            $('#modal').hide();
            file_display_area.html('');
            file_display_area.append(imageFoo);

            if (onComplete) onComplete(
                {                    
                    "original": { "filename": image_filename, "base64": original_data, "width": current_image.width, "height": current_image.height },
                    "crop": { "x": (x1 * kw), "y": (y1 * kh), "width": (sw * kw), "height": (sh * kh) }
                }
               );
        }

        $(window).resize(function () {
            // Position the modal div to the center of the screen
            var window_width = $(window).width() / 2 - scaled_width / 2 + "px";
            var window_height = $(window).height() / 2 - scaled_height / 2 + "px";

            // Show image in modal view
            $("#preview").css("top", window_height);
            $("#preview").css("left", window_width);
        });
    }
}(jQuery));
