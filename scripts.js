jQuery.noConflict();

(function($) {
	$(document).ready(function() {

	/*********/
	
		
	//alert("Le code Jquery a bien été lu et chargé dans la page");
	
	/*********/
        
        
        
       $("body").fadeTo(500,1).delay(150); 
        
        $("nav").fadeTo(1200,1).delay(2000);   
         $("h2").fadeTo(600,1).delay(200); 
         $("h3").fadeTo(300,1).delay(100); 
        
        if ($('body').height() <= ($(window).height() + $(window).scrollTop())) {
           $("#flecheId").fadeOut();
    } else {
       $("#flecheId").fadeIn();
 }
            

 /***$(document).scroll(function() {
  var y = $(this).scrollTop();          
  if (y < 800) {
    $(".fleche").fadeIn();
  } else {
    $(".fleche").fadeOut();
  }
}); **/
        
 
        
        
    /**	******/
});

	
	
}(jQuery));
