/**
 * use jQuery upload v1.2
 * http://www.ponxu.com
 * Changed by SkinnyGuang on 2016/9/22.
 * http://phpcollege.org
 *
 * @author xwz
 * @author SkinnyGuang
 */

(function ($) {
    var noop = function () {
        return true;
    };
    var frameCount = 0;

    $.uploadDefault = {
        url: '',
        fileName: 'filedata',
        dataType: 'json',
        params: {},
        onSend: noop,
        onSubmit: noop,
        onComplete: noop,
        onError: noop
    };

    $.imageUpload = function (options) {
        var opts = $.extend(jQuery.uploadDefault, options);
        if (opts.url == '') {
            return;
        }

        var canSend = opts.onSend();
        if (!canSend) {
            return;
        }

        var frameName = 'upload_frame_' + (frameCount++);
        var iframe = $('<iframe style="position:absolute;top:-9999px" />').attr('name', frameName);
        var form = $('<form method="post" style="display:none;" enctype="multipart/form-data" />').attr('name', 'form_' + frameName);
        form.attr("target", frameName).attr('action', opts.url);

        // form中增加数据域
        var formHtml = '<input type="file" name="' + opts.fileName + '" onchange="_chooseImageUpload(this)">';
        for (var key in opts.params) {
            formHtml += '<input type="hidden" name="' + key + '" value="' + opts.params[key] + '">';
        }
        form.append(formHtml);

        iframe.appendTo("body");
        form.appendTo("body");

        form.submit(opts.onSubmit(frameName));

        // iframe 在提交完成之后
        iframe.load(function () {
            var contents = $(this).contents().get(0);
            var title = $(contents).find('title').text();
            var data = $(contents).find('body').text();
            //console.log(title, data);

            if (title === '404 Not Found') {
                data = {error: title, message: data};
                opts.onError(data, frameName);
            }
            if ('json' == opts.dataType) {
                data = window.eval('(' + data + ')');
            }
            opts.onComplete(data, frameName);
            setTimeout(function () {
                iframe.remove();
                form.remove();
            }, 5000);
        });

        $('._imageUploadBtnBox button').live('click', function () {
            if ($(this).attr('action') === 'cancel') {
                $(this).closest('._imageUploadMasterBox').remove();
            }
        });
        $('._imageUploadTxtBox textarea').live('click', function () {
            $(this).select();
        });
        $('._imageUploadImgBox img').live('click', function () {
            _previewWithPrettyPhoto($(this));
        });

        // 文件框
        var fileInput = $('input[type=file][name=' + opts.fileName + ']', form);
        fileInput.click();
    };
})(jQuery);

// 选中文件, 提交表单(开始上传)
var _chooseImageUpload = function (fileInputDOM) {
    var form = $(fileInputDOM).parent();
    form.submit();
    _imageToBase64(fileInputDOM, _base64Callback);
};

function _imageToBase64(fileInputDOM, callback) {
    if (fileInputDOM.files && fileInputDOM.files[0]) {
        var oFReader = new FileReader();
        oFReader.readAsDataURL(fileInputDOM.files[0]);
        oFReader.onload = function (oFREvent) {
            //alert(oFREvent.target.result);
            callback(fileInputDOM, oFREvent.target.result);
        };
    } else {
        callback(fileInputDOM, $(fileInputDOM).val());
    }
}

var _base64Callback = function (fileInputDOM, imagePath) {
    var frameName = $(fileInputDOM).parent().attr('target');
    var isBase64 = imagePath.indexOf('data:image') === 0;//imagePath是base64图片？

    if (!isBase64) console.log('请在支持HTML5的浏览器上预览图片');

    var html = '<div id="image_' + frameName + '" class="_imageUploadMasterBox">' +
        '<div class="_imageUploadImgBox"><img src="' + imagePath + '" class="_imageUploadImg"></div>' +
            //'<div class="_imageUploadBtnBox"><button type="button" action="upload">上传</button><button type="button" action="cancel">删除</button></div>' +
        '<div class="_imageUploadBtnBox"><img src="images/loading.gif" class="_loadingImg"></div>' +
            //'<div class="_imageUploadTxtBox"><textarea readonly>images/loading.gif</textarea></div>' +
        '</div>';

    if (!$("#_imageUploadContent").is('div')) {
        $('body').append('<div id="_imageUploadContent"></div>');
    }
    if ($("#_imageUploadContent").find('._imageUploadItem').length == 0) {
        $("#_imageUploadContent").append('<div class="_imageUploadItem"></div>');
    }

    $('._imageUploadItem').append(html);
};

var _imageUploadComplete = function (data, frameName) {
    if (data.error) {
        $('#image_' + frameName).find('._imageUploadBtnBox').html('<button type="button" action="cancel">删除</button>');
        $('#image_' + frameName).append('<div class="_imageUploadTxtBox"><textarea readonly>' + data.error + '</textarea></div>');
    } else {
        if (data.message) {
            //alert(data.message);
        }
        if (data.url) {
            _changeImageSrc(data, frameName);
            $('#image_' + frameName).find('._imageUploadBtnBox').hide();
            $('#image_' + frameName).append('<div class="_imageUploadTxtBox"><textarea readonly>' + data.url + '</textarea></div>');
        }
    }
};

var _imageUploadSubmit = function (frameName) {
    setTimeout(function () {
        if ($('#image_' + frameName).find('._imageUploadBtnBox').css('display')  !== 'none')
            $('#image_' + frameName).append('<div class="_imageUploadBtnBox"><button type="button" action="cancel">删除</button></div>');
    }, 20000);

};

var _imageUploadError = function (data, frameName) {
    if (data.error) {
        $('#image_' + frameName).find('._imageUploadBtnBox').html('<button type="button" action="cancel">删除</button>');
        $('#image_' + frameName).append('<div class="_imageUploadTxtBox"><textarea readonly>' + data.error + '</textarea></div>');
    }
};

function _changeImageSrc(data, frameName) {
    var imageNode = $('#image_' + frameName).find('._imageUploadImgBox img');

    if (imageNode.attr('src').indexOf('data:image') !== 0) {
        imageNode.attr('src', data.thumbnail || data.url);//imagePath不是base64图片
    }
}

var _previewWithPrettyPhoto = function (imgJqNode) {
    var previewNode = $('<a href="'+imgJqNode.attr('src')+'"><img src="'+imgJqNode.attr('src')+'"/></a>');
    //previewNode.prettyPhoto({social_tools:false});
    //previewNode.click();//prettyPhoto对base64图片兼容不好。不开预览
};