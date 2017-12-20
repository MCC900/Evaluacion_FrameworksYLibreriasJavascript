

var Cronometro = (function(){
  var momentoInicio;
  var tiempoDisponible;
  var intervalActualizar;
  var funcionFin;

  var display;
  function formatearNumero(numero, cantDigitos){
    var str = numero.toString();
    while(str.length < cantDigitos){
      str = "0" + str;
    }
    return str;
  }

  function getMinsSegsCents(tiempo){
    var dateTiempo = new Date(tiempo);

    var tMinutos = dateTiempo.getMinutes();
    var tSegundos = formatearNumero(dateTiempo.getSeconds(), 2);
    var tCentesimas = formatearNumero(Math.floor(dateTiempo.getMilliseconds() / 10), 2);
    return {minutos:tMinutos, segundos:tSegundos, centesimas:tCentesimas};
  }

  function actualizarDisplay(){
    var ahora = Date.now();
    var tiempo = tiempoDisponible - (ahora - momentoInicio);
    if(tiempo <= 0){
      window.clearInterval(intervalActualizar);
      tiempo = 0;
      funcionFin();
    }
    var info = getMinsSegsCents(tiempo);
    display.text(info.minutos + ":" + info.segundos + ":" + info.centesimas);
  }

  function reiniciarCronometro(tiempo){
    tiempoDisponible = tiempo;
    window.clearInterval(intervalActualizar);
    var info = getMinsSegsCents(tiempo);
    display.text(info.minutos + ":" + info.segundos + ":" + info.centesimas);
  }

  function arrancarCronometro(){
    intervalActualizar = window.setInterval(actualizarDisplay, 10);
    momentoInicio = Date.now();
  }

  function setDisplayCronometro(elemDisplay){
    display = elemDisplay;
  }

  function setFuncionFin(funcion){
    funcionFin = funcion;
  }

  return {
    setDisplay:setDisplayCronometro,
    reiniciar:reiniciarCronometro,
    arrancar:arrancarCronometro,
    setFuncionFin:setFuncionFin
  }
})();
