// custom.js

// 2. Navbar Scroll Logic (Header Fix)
$(document).ready((function() {
    $(window).scroll((function() {
        // console.log($(window).scrollTop()); // Keeping this line is fine for development, but remove it for production.
        
        if ($(window).scrollTop() > 620) {
            $(".navbar_top").addClass("navbar-fixed-top");
        } else {
            $(".navbar_top").removeClass("navbar-fixed-top");
        }
    }));
}));

$(document).ready((function() {
    $(window).scroll((function() {
        // console.log($(window).scrollTop()); // Keeping this line is fine for development, but remove it for production.
        
        if ($(window).scrollTop() > 20) {
            $(".innerheader").addClass("innerheader-fixed-top");
        } else {
            $(".innerheader").removeClass("innerheader-fixed-top");
        }
    }));
}));

// 3. Side Navigation Open Click
$(".navbartoggler").click((function() {
    $(".sidenav").addClass("open");
}));

// 4. Side Navigation Close Click
$(".closebtn").click((function() {
    $(".sidenav").removeClass("open");
}));

var cmenuId = "." + $("#MenuId").text();
$(cmenuId).parent().addClass('active');