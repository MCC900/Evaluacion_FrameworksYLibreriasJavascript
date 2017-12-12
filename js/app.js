//Función de easing personalizada para la desaparición de los dulces (soy un mago)
//Info obtenida de http://brianwald.com/journal/creating-custom-jquery-easing-animations
$.easing.titilar = function(x, t, b, c, d){
  var tiempo01 = t / d;
  var repeticiones = 2; //Modificar para cambiar número de veces que titila
  var coso = Math.abs(Math.sin(tiempo01 * Math.PI * (repeticiones + 0.5)));
  return (c - b) * coso + b;
};


//-------------------[ FUNCIONES DE UTILIDAD ]-------------------------
function intRandom(minimo, maximo){
  return minimo + Math.floor(Math.random() * (1 + maximo - minimo));
}
//-------------------[/ FUNCIONES DE UTILIDAD ]------------------------

//Algunas variables de ajuste
var milisParpadeoTitulo = 600;
var maxDulcesPorColumna = 7;
var tiempoCaida = 800;
var esperaSpawnDulce = 200;
var esperaDesaparicionDulce = 500;
var milisFadeInOpacidad = 300;

//Datos del Juego
var estaColumnaRellena = [false, false, false, false, false, false, false]; //Vector de 7 bools que indican si cada columna esta completa
var puntos;
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
    } else {
      estaColumnaRellena[numeroColumna - 1] = true;
      if(todasLasColumnasRellenas()){
        window.setTimeout(verificarDulcesEnLinea, tiempoCaida);
      }
    }
}

function rellenarTablero(){
  for(var i = 1; i <= 7; i++){
    rellenarColumna(i);
  }
}

function todasLasColumnasRellenas(){
  var todasRellenas = true;
  for(var i = 0; i < 7; i++){
    todasRellenas &= estaColumnaRellena[i];
  }
  return todasRellenas;
}

function verificarDulcesEnLinea(){
  var dulcesAEliminar = [];

  for(var x = 0; x < 7; x++){
    var columna = $(".col-" + (x+1));
    //Recordar que y es cero para los dulces superiores y va aumentando segun bajamos
    for(var y = 0; y < maxDulcesPorColumna; y++){
     //:nth-child empieza en índice 1 según https://api.jquery.com/nth-child-selector/
      var dulce = columna.find("img:nth-child(" + (y+1) +")");
      var tipo = dulce.attr('src');

      var arribaIgual = false;
      var dosArribaIgual = false;
      var abajoIgual = false;
      var dosAbajoIgual = false;

      if(y > 0) { arribaIgual = dulceXYesDelTipo(x, y-1, tipo); }
      if(y > 1)  { dosArribaIgual = dulceXYesDelTipo(x, y-2, tipo); }
      if(y < maxDulcesPorColumna - 1) { abajoIgual = dulceXYesDelTipo(x, y+1, tipo); }
      if(y < maxDulcesPorColumna - 2) { dosAbajoIgual = dulceXYesDelTipo(x, y+2, tipo); }

      if(arribaIgual && dosArribaIgual ||
         arribaIgual && abajoIgual ||
         abajoIgual && dosAbajoIgual){
         //Al menos tres en línea vertical
         dulcesAEliminar[dulcesAEliminar.length] = {elDulce:dulce, posX:x, posY: y};
         continue;
      }

      var izquierdaIgual = false;
      var dosIzquierdaIgual = false;
      var derechaIgual = false;
      var dosDerechaIgual = false;

      if(x > 0){ izquierdaIgual = dulceXYesDelTipo(x - 1, y, tipo)}
      if(x > 1){ dosIzquierdaIgual = dulceXYesDelTipo(x - 2, y, tipo)}
      if(x < 7){ derechaIgual = dulceXYesDelTipo(x + 1, y, tipo)}
      if(x < 7){ dosDerechaIgual = dulceXYesDelTipo(x + 2, y, tipo)}

      if(izquierdaIgual && dosIzquierdaIgual ||
         izquierdaIgual && derechaIgual ||
         derechaIgual && dosDerechaIgual){
         //Al menos tres en línea horizontal
         dulcesAEliminar[dulcesAEliminar.length] = {elDulce:dulce, posX:x, posY: y};
         continue;
      }
    }
  }

  if(dulcesAEliminar.length > 0){
    //Comenzamos la animación de eliminación
    for(var i = 0; i < dulcesAEliminar.length; i++){
      dulcesAEliminar[i].elDulce.animate({
        "opacity":"0"
      },{
        duration:esperaDesaparicionDulce,
        queue:false,
        easing:"titilar"
      });
    }
    window.setTimeout(function(){
      eliminarDulces(dulcesAEliminar);
    }, esperaDesaparicionDulce);
  } else {
    //No quedan dulces para eliminar. Cedemos el control al usuario
    cederControlAUsuario();
  }

  //window.setTimeout(eliminarDulces(dulcesAEliminar), esperaDesaparicionDulce);
}

function eliminarDulces(dulcesAEliminar){

  var bufferDulcesSinSoporte = [];
  for(var i = 0; i < dulcesAEliminar.length; i++){
    var data = dulcesAEliminar[i];
    //Ajustamos el valor "top" de los dulces que están sobre el que vamos a
    //eliminar para que no se teletransporten abruptamente a causa del hueco
    var columna = $(".col-" + (data.posX+1));
    for(var y = 0; y < data.posY; y++){
      var dulceArriba = columna.find("img:nth-child(" + (y+1) +")");
      dulceArriba.css("top", "-=" + dulceArriba.height() + "px");
      bufferDulcesSinSoporte[bufferDulcesSinSoporte.length] = dulceArriba;
    }
  }
  //Ahora comenzamos las animaciones para que estos caigan
  for(var i = 0; i < bufferDulcesSinSoporte.length; i++){
    bufferDulcesSinSoporte[i].animate({
      "top":"0px"
    }, tiempoCaida, "swing");
  }

  //Eliminamos los dulces, sumamos los puntos y marcamos las columnas para ser rellenadas
  for(var i = 0; i < dulcesAEliminar.length; i++){
    dulcesAEliminar[i].elDulce.remove();
    sumarPunto();
    estaColumnaRellena[dulcesAEliminar[i].posX] = false;
  }

  //Rellenamos todo
  rellenarTablero();
}

function dulceXYesDelTipo(x, y, tipo){
  var columna = $(".col-" + (x+1));
  var dulce = columna.find("img:nth-child(" + (y+1) +")");
  return dulce.attr('src') == tipo;
}

function cederControlAUsuario(){
  //TO DO
}

function sumarPunto(){
  puntos++;
  $(".score .data-info").html(puntos);
}
//----------------------------[/ JUEGO ]-------------------------------



//-----------------------[  INICIALIZACIÓN  ]--------------------------
$(function(){

  //Comenzamos la animación del título
  window.setTimeout(tituloABlanco, milisParpadeoTitulo);

  //Reiniciamos los puntos
  puntos = 0;
  $(".score .data-info").html("0");

  //Rellenamos el tablero por primera vez
  rellenarTablero();
});
//-----------------------[/ INICIALIZACIÓN  ]--------------------------
