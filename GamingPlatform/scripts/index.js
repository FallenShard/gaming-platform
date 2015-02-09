(function () {
    'use strict';

    function documentInit() {
        $("#header-div").load("header.html", function () {
            headerBar.init();
        });

        console.log("Loading content!");

        if (headerBar.isLoggedIn())
            console.log("User is logged in!");
        else
            console.log("User is not logged in!");
    }
    



    $(document).ready(documentInit);
})();