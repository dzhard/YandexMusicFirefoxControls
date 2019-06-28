$(document).on('click', '.fa-play', function(e){
	$(e.target).addClass("fa-pause");
	$(e.target).removeClass("fa-play");
});

$(document).on('click', '.fa-pause', function(e){
	$(e.target).addClass("fa-play");
	$(e.target).removeClass("fa-pause");
});

document.addEventListener("DOMContentLoaded", handleDomLoaded);