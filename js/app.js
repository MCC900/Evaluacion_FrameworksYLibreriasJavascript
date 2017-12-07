//--------------------[ ANIMACIÓN DEL TÍTULO ]-------------------------
var milisParpadeoTitulo = 600;

function tituloABlanco(){
  $(".main-titulo").css("color","white");
  window.setTimeout(tituloAAmarillo, milisParpadeoTitulo);
}
function tituloAAmarillo(){
  $(".main-titulo").css("color","yellow");
  window.setTimeout(tituloABlanco, milisParpadeoTitulo);
}
//--------------------[/ ANIMACIÓN DEL TÍTULO]-------------------------

//------------INICIALIZACIÓN------------------
$(function(){

  //Comenzamos la animación del título
  window.setTimeout(tituloABlanco, milisParpadeoTitulo);
});
