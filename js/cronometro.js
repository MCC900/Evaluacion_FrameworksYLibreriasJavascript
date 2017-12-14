

var Cronometro = (function(){
  var momentoInicio;
  var tiempoDisponible;

  var display;
  function formatearNumero(numero, cantDigitos){
    var str = numero.toString();
    while(str.length < cantDigitos){
      str = "0" + str;
    }
    return str;
  }

  function actualizarDisplay(){
    var ahora = Date.now();
    var tiempo = new Date(tiempoDisponible - (ahora - momentoInicio));

    if(tiempo <= 0){
      window.clearInterval(actualizarDisplay);
    }
    var minutos = tiempo.getMinutes();
    var segundos = formatearNumero(tiempo.getSeconds(), 2);
    var centesimas = formatearNumero(Math.floor(tiempo.getMilliseconds() / 10), 2);
    display.text(minutos + ":" + segundos + ":" + centesimas);
  }

  function reiniciarCronometro(tiempo){
    tiempoDisponible = tiempo;
  }

  function arrancarCronometro(){
    window.setInterval(actualizarDisplay, 10);
    momentoInicio = Date.now();
  }

  function setDisplayCronometro(elemDisplay){
    display = elemDisplay;
    display.html("2:00:00");
  }

  return {
    setDisplay:setDisplayCronometro,
    reiniciar:reiniciarCronometro,
    arrancar:arrancarCronometro,
  }
})();
