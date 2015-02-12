(function () {
    'use strict';

    function documentInit() {
        $("#header-div").load("header.html", function () {
            headerBar.init();
        });
    }

    $(document).ready(documentInit);
})();