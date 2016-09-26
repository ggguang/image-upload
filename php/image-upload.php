<?php

if ($_FILES["image"]["error"] > 0) {
    exit(json_encode(['url' => '图片有误'], JSON_UNESCAPED_UNICODE));
}

exit(json_encode(['url' => 'images/test.jpg']));