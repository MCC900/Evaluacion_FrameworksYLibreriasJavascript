


//Función de easing personalizada para la desaparición de los dulces
//Info obtenida de http://brianwald.com/journal/creating-custom-jquery-easing-animations
//Me di cuenta de que existía el efecto "pulsate" después -.-
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

function contarDulcesColumna(columna){
  return columna.children().length;
}

function todasLasColumnasRellenas(){
  var todasRellenas = true;
  for(var i = 0; i < 7; i++){
    todasRellenas &= estaColumnaRellena[i];
  }
  return todasRellenas;
}

function dulceXYesDelTipo(x, y, tipo){
  var columna = $(".col-" + (x+1));
  var dulce = columna.find("img:nth-child(" + (y+1) +")");
  return dulce.attr('src') == tipo;
}

function getXYdeDulce(dulce){
  var col = dulce.parent();
  var dx = parseInt(col.attr('class').substring(4,5)) - 1;
  var dy = col.children().index(dulce);
  return {x:dx, y:dy};
}

function getDulceEnXY(x, y){
  var columna = $(".col-" + (x+1));
  return columna.find("img:nth-child(" + (y+1) +")");
}
//-------------------[/ FUNCIONES DE UTILIDAD ]------------------------

//Algunas variables de ajuste
var milisParpadeoTitulo = 500;
var maxDulcesPorColumna = 7;
var tiempoCaida = 800;
var esperaSpawnDulce = 200;
var esperaDesaparicionDulce = 500;
var milisFadeInOpacidad = 300;
var distArrastreAjustePx = 10;
var milisAnimIntercambio = 300; //También determina lo que tarda un dulce en volver a su posición original en un intento de movimiento inválido

//Datos del Juego
var estaColumnaRellena; //Vector de 7 bools que indican si cada columna esta completa
var puntos;
var movimientos;
var juegoIniciado; //Bool que indica si se ha hecho click en "Iniciar"
var iniciadoTimer; //El timer se inicia cuando se termina el llenado del tablero por primera vez
var timerTermino; //Bool que indica si el timer llegó a cero.
var estaTodoQuieto; //Bool que es falso mientras se estén generando reacciones en cadena
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
  dulce.draggable({
    start:comienzoArrastreDulce,
    drag:arrastrandoDulce,
    disabled:true,//Dragging desactivado por defecto
    revert:true, //Devuelve el objeto a su posición original al dropearlo
    revertDuration:0, //Se revierte inmediatamente para evitar problemas con las animaciones
    zIndex:1000,
    opacity:0.85
  })
  return dulce;
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

    //Verificamos que la columna no esté llena
    if(cantDulces < maxDulcesPorColumna){
      //Si le faltan dulces, añadimos un dulce y volvemos a llamar a rellenarColumna recursivamente
      anadirDulceAColumna(numeroColumna);
      window.setTimeout(function(){ rellenarColumna(numeroColumna); }, esperaSpawnDulce);
    } else {
      //De lo contrario, la columna está llena
      estaColumnaRellena[numeroColumna - 1] = true; //La marcamos como llena
      if(todasLasColumnasRellenas()){ //Si el resto de columnas también están llenas

        //Verificamos si se han generado nuevas lineas de dulces para eliminar
        window.setTimeout(
          function(){
            verificarDulcesEnLinea(false);
          }, tiempoCaida);

        if(!iniciadoTimer){
           //Iniciamos el timer si es el caso, luego del tiempo que tarde en caer el último dulce
          window.setTimeout(function(){
            Cronometro.arrancar();
            iniciadoTimer = true;
          }, tiempoCaida);
        }
      }
    }
}

function rellenarTablero(){
  for(var i = 1; i <= 7; i++){
    rellenarColumna(i);
  }
}

function limpiarTablero(){
  estaColumnaRellena =  [false, false, false, false, false, false, false]; //Marcamos todas las columnas como vacías
  for(var i = 1; i <= 7; i++){
    var columna = $(".col-" + i);
    columna.empty();
  }
}


function verificarDulcesEnLinea(darTiempoAAnimIntercambio){
  //El parámetro es un booleano que indica si se debe esperar a terminar la
  //animación de intercambio de 2 dulces anter de proceder con la eliminación
  var dulcesAEliminar = [];

  for(var x = 0; x < 7; x++){
    var columna = $(".col-" + (x+1));
    //Recordar que y es cero para los dulces superiores y va aumentando segun bajamos
    for(var y = 0; y < maxDulcesPorColumna; y++){

      var dulce = columna.find("img:nth-child(" + (y+1) +")");
      var tipo = dulce.attr('src');

      //Un dulce eliminado genera:
      // 1 punto de base
      //+1 punto si además es uno de los 2 centros de una línea de 4
      //+2 puntos si además es el centro de una línea de 5
      //Los puntos verticales y horizontales se calculan por separado y se suman
      var puntosGenerados = 1;

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
         if(dosArribaIgual && arribaIgual && abajoIgual ||
            arribaIgual && abajoIgual && dosAbajoIgual){
           //Al menos 4 en línea vertical. +1 al punto por defecto = +2
           puntosGenerados += 1;
           if(dosArribaIgual && arribaIgual && abajoIgual && dosAbajoIgual){
             //Al menos 5 en línea vertical. +2 a los 2 puntos anteriores = +4
             puntosGenerados += 2;
           }
         }

         dulcesAEliminar[dulcesAEliminar.length] = {elDulce:dulce,
           posX:x, posY: y, puntos:puntosGenerados};
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
         if(dosIzquierdaIgual && izquierdaIgual && derechaIgual ||
            izquierdaIgual && derechaIgual && dosDerechaIgual){
           //Al menos 4 en línea horizontal. +1 al punto por defecto = +2
           puntosGenerados += 1;
           if(dosIzquierdaIgual && izquierdaIgual && derechaIgual && dosDerechaIgual){
             //Al menos 5 en línea horizontal. +2 a los 2 puntos anteriores = +4
             puntosGenerados += 2;
           }
         }

         dulcesAEliminar[dulcesAEliminar.length] = {elDulce:dulce,
           posX:x, posY: y, puntos:puntosGenerados};
         continue;
      }
    }
  }

  if(dulcesAEliminar.length > 0){
    estaTodoQuieto = false;

    //Comenzamos la animación de eliminación
    if(darTiempoAAnimIntercambio){
      window.setTimeout(
        function(){
          comenzarAnimacionEliminacion(dulcesAEliminar);
        }, milisAnimIntercambio);
    } else {
      comenzarAnimacionEliminacion(dulcesAEliminar);
    }
    //Esta función devuelve true porque hubo dulces alineados
    return true;
  } else {
    //No quedan dulces para eliminar. Cedemos el control al usuario
    if(darTiempoAAnimIntercambio){
      //Esto se da si el usuario hizo un movimiento inválido, se da tiempo a la animación
      //que devuelve la pieza arrastrada a su posición original antes de volver a dar el control
      window.setTimeout(cederControlAUsuario, milisAnimIntercambio);
    } else {
      estaTodoQuieto = true;
      if(timerTermino){
          //No cedemos el control si el timer ha acabado. En este caso termina el Juego
          finalizarJuego();
      } else {
          cederControlAUsuario();
      }
    }
    //Esta función devuelve false porque no hubo dulces alineados
    return false;
  }

}

function comenzarAnimacionEliminacion(dulcesAEliminar){
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
}

function eliminarDulces(dulcesAEliminar){

  var bufferDulcesSinSoporte = [];
  for(var i = 0; i < dulcesAEliminar.length; i++){

    var columna = $(".col-" + (dulcesAEliminar[i].posX + 1));
    //Ajustamos el valor "top" de los dulces que están sobre el que vamos a
    //eliminar para que no se teletransporten abruptamente a causa del hueco generado
    for(var y = 0; y < dulcesAEliminar[i].posY; y++){
      var dulceArriba = columna.find("img:nth-child(" + (y+1) +")");
      //Nótese que se suma la altura de un dulce por cada dulce eliminado en vertical,
      //ya que estamos en un bucle for.
      dulceArriba.css("top", "-=" + dulceArriba.height() + "px");

      //Guardamos los dulces sin soporte / en el aire para animar la caida luego
      if(!dulceArriba.hasClass("estaAlCaer")){
        bufferDulcesSinSoporte[bufferDulcesSinSoporte.length] = dulceArriba;
        //Usamos una clase temporal para marcar los dulces y evitar duplicados.
        dulceArriba.addClass("estaAlCaer");
      }
    }
  }
  //Ahora comenzamos las animaciones para que estos caigan
  for(var i = 0; i < bufferDulcesSinSoporte.length; i++){
    bufferDulcesSinSoporte[i].animate({
      "top":"0px"
    }, tiempoCaida, "swing");

    //Quitamos la clase temporal
    bufferDulcesSinSoporte[i].removeClass("estaAlCaer");
  }

  //Eliminamos los dulces, sumamos los puntos y marcamos las columnas para ser rellenadas
  for(var i = 0; i < dulcesAEliminar.length; i++){
    dulcesAEliminar[i].elDulce.remove();
    sumarPuntos(dulcesAEliminar[i].puntos);
    estaColumnaRellena[dulcesAEliminar[i].posX] = false;
  }

  //Rellenamos todo
  rellenarTablero();
}

function sumarPuntos(cantidad){
  puntos += cantidad;
  $("#score-text").html(puntos);
}

function nuevoJuego(){
  //Reiniciamos los puntos
  $("#score-text").html("0");
  puntos = 0;

  //Reiniciamos el cronometro
  Cronometro.reiniciar(120000); // 2 * 60 * 1000 = 2 minutos en milisegundos
  iniciadoTimer = false;
  timerTermino = false;

  //Reiniciamos el contador de Movimientos
  movimientos = 0;
  $("#movimientos-text").text("0");

  //Reiniciamos esta variable
  estaTodoQuieto = true;

  //Reiniciamos el tablero
  limpiarTablero();
  rellenarTablero();
}

function marcarFinTimer(){
  timerTermino = true;
  if(estaTodoQuieto){ //Si no hay partes moviéndose, finalizamos la partida
    finalizarJuego();
  }
}

function finalizarJuego(){
  quitarControlAUsuario();

  //Escondemos el tablero
  var tablero = $(".panel-tablero");
  var panelScore = $(".panel-score");

  //Ocultamos el tablero. El css del .panel-score deberia causar que este se agrande automáticamente
  tablero.animate({
    minWidth:0,
    width:0,
    opacity:0,
    borderWidth:0
  }, 2000);
}
//----------------------------[/ JUEGO ]-------------------------------


//---------------------[ EVENTOS E INTERACCIÓN ]-----------------------

var posStartArrastre;

function setDroppableDulceAdyacente(dulceAdy, dulce){
  //Solo permitimos intercambiar dulces distintos para evitar movimientos inútiles
  if(dulceAdy.attr('src') != dulce.attr('src')){

    dulceAdy.droppable({
      disabled:false,
      drop:function(event, ui){ //Al dropear, realizamos el movimiento en sí
        var posDrag = ui.position;
         //Creamos un span oculto en el lugar del primer dulce para marcar la posición
        var marcador = $("<span>");
        dulce.after(marcador);
        dulceAdy.after(dulce);
        marcador.replaceWith(dulceAdy);

        if(!verificarDulcesEnLinea(true)){ //Si no creamos dulces en línea, entonces deshacemos el movimiento
          marcador = $("<span>");
          dulce.after(marcador);
          dulceAdy.after(dulce);
          marcador.replaceWith(dulceAdy);
          //Creamos manualmente la animación para devolver el dulce arrastrado a su posición
          dulce.css({
            top:posDrag.top,
            left:posDrag.left
          });
          dulce.animate({
            top:0,
            left:0
          }, milisAnimIntercambio);

        } else {
          //Si el movimiento crea dulces en línea, lo permitimos,
          //y creamos la animación de intercambio

          //Ajustamos el dulce arrastrado a su nueva posición
          dulce.css({
            top:0,
            left:0
          })
          //Animamos al dulce adyacente tomando la posición del otro
          dulceAdy.css({
            top:posDrag.top,
            left:posDrag.left
          });
          dulceAdy.animate({
            top:0,
            left:0
          }, milisAnimIntercambio);

          //Agregamos +1 a la cantidad de movimientos
          movimientos++;
          $("#movimientos-text").text(movimientos);
        };

        //Quitamos el control al usuario luego del movimiento/intento
        quitarControlAUsuario();

      }
    })
  }
}

function comienzoArrastreDulce(event, ui){
  posStartArrastre = ui.position;

  //Establecemos los dulces adyacentes válidos como"droppables":

  var dulce = $(event.target);
  var posDulce = getXYdeDulce(dulce);
  var dulceIzq = null;
  var dulceDer = null;
  var dulceArr = null;
  var dulceAba = null;

  if(posDulce.x > 0) { dulceIzq = getDulceEnXY(posDulce.x - 1, posDulce.y    ); }
  if(posDulce.x < 6) { dulceDer = getDulceEnXY(posDulce.x + 1, posDulce.y    ); }
  if(posDulce.y > 0) { dulceArr = getDulceEnXY(posDulce.x    , posDulce.y - 1); }
  if(posDulce.y < 6) { dulceAba = getDulceEnXY(posDulce.x    , posDulce.y + 1); }

  if(dulceIzq != null){ setDroppableDulceAdyacente(dulceIzq, dulce); }
  if(dulceDer != null){ setDroppableDulceAdyacente(dulceDer, dulce); }
  if(dulceArr != null){ setDroppableDulceAdyacente(dulceArr, dulce); }
  if(dulceAba != null){ setDroppableDulceAdyacente(dulceAba, dulce); }
}

function arrastrandoDulce(event, ui){
  var difx = ui.position.left - posStartArrastre.left;
  var dify = ui.position.top - posStartArrastre.top;
  var absDifX = Math.abs(difx);
  var absDifY = Math.abs(dify);

  if(absDifX > distArrastreAjustePx || absDifY > distArrastreAjustePx){
    //Si se ha arrastrado el dulce lo suficientemente lejos, bloquearemos el movimiento en un eje

    var distDulces = $(".panel-tablero img:first-child").width(); //distancia entre dulces adyacentes

    if(absDifX > absDifY){ //Según la dirección tomada, bloqueamos uno u otro eje

      //Bloqueamos el movimiento para el eje x
      ui.position.top = 0;
      //Ponemos distDulces como el tope de distancia a la que podemos alejar el dulce
      if(difx > distDulces){ //Derecha
        ui.position.left = posStartArrastre.left + distDulces;
      } else if(difx < -distDulces) { //Izquierda
        ui.position.left = posStartArrastre.left - distDulces;
      }
    } else {
      //Bloqueamos el movimiento para el eje y
      ui.position.left = 0;
      //Ponemos distDulces como el tope de distancia a la que podemos alejar el dulce
      if(dify > distDulces){ //Abajo
        ui.position.top = posStartArrastre.top + distDulces;
      } else if(dify < -distDulces) { //Arriba
        ui.position.top = posStartArrastre.top - distDulces;
      }
    }
  }
}

function cederControlAUsuario(){
  var dulces = $(".panel-tablero img");
  dulces.draggable({ disabled:false });
}

function quitarControlAUsuario(){
  var dulces = $(".panel-tablero img");
  dulces.droppable({disabled:true});
  dulces.draggable({disabled:true});
}

//---------------------[/ EVENTOS E INTERACCIÓN ]----------------------

//-----------------------[  INICIALIZACIÓN  ]--------------------------
$(function(){
  //Comenzamos la animación del título
  window.setTimeout(tituloABlanco, milisParpadeoTitulo);

  //Indicamos al cronómetro donde se va a mostrar el tiempo, y la función a ejecutar al llegar a cero
  Cronometro.setDisplay($("#timer"));
  Cronometro.setFuncionFin(marcarFinTimer);

  juegoIniciado = false;

  $(".btn-reinicio").click(function(){
    if(juegoIniciado){
      location.reload();
    } else {
      juegoIniciado = true;
      $(this).html("Reiniciar");
      nuevoJuego();
    }
  });

});
//-----------------------[/ INICIALIZACIÓN  ]--------------------------
