//-------------------[ FUNCIONES DE UTILIDAD ]-------------------------
function intRandom(minimo, maximo){
  return minimo + Math.floor(Math.random() * (1 + maximo - minimo));
}
//-------------------[/ FUNCIONES DE UTILIDAD ]------------------------

//Algunas variables de ajuste
var milisParpadeoTitulo = 600;
var maxDulcesPorColumna = 7;
var tiempoCaida = 1000;
var esperaSpawnDulce = 300;
var milisFadeInOpacidad = 300;
//--------------------[ ANIMACIÓN DEL TÍTULO ]-------------------------


function tituloABlanco(){
  $(".main-titulo").css("color","white");
  window.setTimeout(tituloAAmarillo, milisParpadeoTitulo);
}

function tituloAAmarillo(){
  $(".main-titulo").css("color","yellow");
  window.setTimeout(tituloABlanco, milisParpadeoTitulo);
}
//--------------------[/ ANIMACIÓN DEL TÍTULO]-------------------------

//----------------------------[ JUEGO ]--------------------------------

function nuevoDulce(){
  var r = intRandom(1, 4);
  var srcImagen = "image/" + r + ".png";

  var dulce = $(document.createElement("img"));
  dulce.attr('src', srcImagen);
  return dulce;
}

function contarDulcesColumna(columna){
  return columna.children().length;
}

function anadirDulceAColumna(numeroColumna){
  var dulce = nuevoDulce();
  var columna = $(".col-" + numeroColumna);
  var cantDulces = contarDulcesColumna(columna);

  columna.prepend(dulce);
  //Primero establecemos el ancho para que el tamaño de la imagen se ajuste,
  // para luego poder obtener la altura del dulce correctamente en la línea siguiente.
  dulce.css({ "width":"100%" });
  //Calculamos la distancia entre la posición dulce y el borde superior del tablero
  var offsetBordeSuperior = -(columna.height() - cantDulces * dulce.height());
  //Establecemos la posición relativa para que comienze en el borde superior
  dulce.css({
    "position":"relative",
    "top":offsetBordeSuperior + "px",
    "opacity":"0"
  });
  //Animamos la caída
  dulce.animate({
    "top":"0px"
  }, tiempoCaida, "swing");

  dulce.animate({
    "opacity":"1"
  }, {
    duration:milisFadeInOpacidad,
    queue:false
  });
}

function rellenarColumna(numeroColumna){
    var columna = $(".col-" + numeroColumna);
    var cantDulces = contarDulcesColumna(columna);
    if(cantDulces < maxDulcesPorColumna){
      anadirDulceAColumna(numeroColumna);
      window.setTimeout(function(){ rellenarColumna(numeroColumna); }, esperaSpawnDulce);
    }
}

function llenarTablero(){
  for(var i = 1; i <= 7; i++){
    rellenarColumna(i);
  }
}

//----------------------------[/ JUEGO ]-------------------------------



//-----------------------[  INICIALIZACIÓN  ]--------------------------
$(function(){

  //Comenzamos la animación del título
  window.setTimeout(tituloABlanco, milisParpadeoTitulo);
  //maxDulcesPorColumna = Math.floor( $(".col-1").height() / $(".col-1").width());

  llenarTablero();
});
//-----------------------[/ INICIALIZACIÓN  ]--------------------------
