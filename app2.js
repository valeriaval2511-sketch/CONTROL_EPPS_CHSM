const URL = "https://script.google.com/macros/s/AKfycbxIXHPVtpzXkauN83tHZfX8jV2BiyH2Zlv4lmYfPL2pIvo41MCHvMuVDFkTGyRSIfkw/exec";

let persona = null;

let pedidosPendientes = [];

/* =========================
   NAVEGACIÓN
========================= */
function toggle(id){
  document.querySelectorAll(".card").forEach(x=>x.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function volver(){
  toggle("menu");
}

/* =========================
   PEDIDO
========================= */
function verPedido(){

  toggle("pedido");

  if(persona){
    paso1.classList.add("hidden");
    paso2.classList.remove("hidden");

    infoConfirmado.innerHTML =
      `${persona.nombres} ${persona.apellidos}<br>
       ${persona.area} | Guardia ${persona.guardia}`;
  }else{
    limpiarPedido();
  }
}

function limpiarPedido(){
  dni.value = "";
  info.innerHTML = "";
  res.innerHTML = "";
  paso1.classList.remove("hidden");
  paso2.classList.add("hidden");
}

/* =========================
   DNI
========================= */
async function verificarDNI(){

  if(dni.value.trim().length < 6){
    alert("Ingrese DNI válido");
    return;
  }

  const r = await fetch(URL,{
    method:"POST",
    body:JSON.stringify({
      tipo:"buscar",
      dni:dni.value
    })
  });

  const d = await r.json();

  if(!d.ok){
    info.innerHTML = `<span class="error">DNI no encontrado</span>`;
    return;
  }

  persona = {
    ...d,
    dni:dni.value
  };

  info.innerHTML = `
    <b>${d.nombres} ${d.apellidos}</b><br>
    Área: ${d.area}<br>
    Guardia: ${d.guardia}<br><br>
    <button onclick="continuarPedido()">Continuar</button>
  `;
}

function continuarPedido(){

  paso1.classList.add("hidden");
  paso2.classList.remove("hidden");

  infoConfirmado.innerHTML =
    `${persona.nombres} ${persona.apellidos}<br>
     ${persona.area} | Guardia ${persona.guardia}`;
}

function toggleItem(id){

  const chk = document.getElementById(id);

  chk.checked = !chk.checked;

  pintarSeleccion(id);
}

function pintarSeleccion(id){

  const box = document.getElementById("box_"+id);
  const chk = document.getElementById(id);

  if(chk.checked){
    box.style.background = "#e8f5e9";
    box.style.borderColor = "#1b7f5f";
  }else{
    box.style.background = "#fff";
    box.style.borderColor = "#e0e0e0";
  }
}

/* =========================
   EPP
========================= */
async function cargarEPP(){

  const r = await fetch(URL,{
    method:"POST",
    body:JSON.stringify({tipo:"epps"})
  });

  const data = await r.json();

  let grupos = {};

  data.forEach(x=>{

    if(!grupos[x.categoria]){
      grupos[x.categoria]=[];
    }

    grupos[x.categoria].push(x.nombre);
  });

  let html = "";

  for(let cat in grupos){

    html += `
    <div class="grupoTitulo">
      ${cat}
    </div>`;

    html += `<div class="grupoEPP">`;

    grupos[cat].forEach(epp=>{

      html += `
      <div class="epp-item"
           onclick="toggleItem('${epp}')"
           id="box_${epp}">

        <input type="checkbox"
               id="${epp}"
               onclick="event.stopPropagation()">

        <span>${epp}</span>

      </div>`;
    });

    html += `</div>`;
  }

  listaEPP.innerHTML = html;
}

/* =========================
   FILTRO
========================= */
function filtrarEPP(){

  const texto = buscarEPP.value.toLowerCase();

  document.querySelectorAll(".epp-item").forEach(x=>{

    const nombre = x.innerText.toLowerCase();

    x.style.display =
      nombre.includes(texto) ? "flex" : "none";
  });
}

/* =========================
   ENVIAR
========================= */
async function enviar(){

  let epps = [];

  document.querySelectorAll("#listaEPP input[type=checkbox]").forEach(chk=>{

    if(chk.checked){

      epps.push({
        nombre:chk.id,
        cantidad:1
      });
    }

  });

  if(epps.length === 0){
    alert("Seleccione al menos un EPP");
    return;
  }

  await fetch(URL,{
    method:"POST",
    body:JSON.stringify({
      tipo:"pedido",
      dni:persona.dni,
      epps:epps
    })
  });

  res.innerHTML =
    `<span class="ok">✔ Pedido enviado</span>`;
}

/* =========================
   MIS PEDIDOS
========================= */
function verMisPedidosUsuario(){

  if(!persona){
    alert("Primero verifica DNI");
    return;
  }

  toggle("misPedidosUsuario");

  tituloPedidos.innerHTML =
    `${persona.nombres} ${persona.apellidos}`;

  cargarMisPedidos();
}

async function cargarMisPedidos(){

  const r = await fetch(URL,{
    method:"POST",
    body:JSON.stringify({
      tipo:"mis_pedidos",
      dni:persona.dni
    })
  });

  const data = await r.json();

  let html = "";

  if(data.length === 0){
    html = "No tiene pedidos";
  }else{

    data.forEach(x=>{

      let clase = "";

      if(x.estado==="Pendiente") clase="pendiente";
      if(x.estado==="Entregado") clase="ok";
      if(x.estado==="Rechazado") clase="error";

      html += `
      <div class="item-admin">
        <div class="nombre">${x.epp}</div>
        <div class="detalle">
          Cantidad: ${x.cantidad}<br>
          Fecha: ${x.fecha}
        </div>
        <div class="estado ${clase}">
          ${x.estado}
        </div>
      </div>`;
    });
  }

  resultadoPedidos.innerHTML = html;
}

/* =========================
   LOGIN
========================= */
function verLogin(){
  toggle("login");
}

async function login(){

  const r = await fetch(URL,{
    method:"POST",
    body:JSON.stringify({
      tipo:"login",
      usuario:user.value,
      clave:pass.value
    })
  });

  const d = await r.json();

  if(!d.ok){
    alert("Usuario incorrecto");
    return;
  }

  toggle("admin");

  let hoy = new Date();
  let y = hoy.getFullYear();
  let m = String(hoy.getMonth()+1).padStart(2,"0");
  let dia = String(hoy.getDate()).padStart(2,"0");

  pdfHasta.value = `${y}-${m}-${dia}`;
  pdfDesde.value = `${y}-${m}-01`;

  cargarFiltros();
  cargarPendientes();
}

/* =========================
   ADMIN
========================= */

async function cargarFiltros(){

  const r = await fetch(URL,{
    method:"POST",
    body:JSON.stringify({
      tipo:"filtros"
    })
  });

  const d = await r.json();

  let htmlArea =
    `<option value="">Todas las áreas</option>`;

  d.areas.forEach(x=>{
    htmlArea += `<option value="${x}">${x}</option>`;
  });

  fArea.innerHTML = htmlArea;

  let htmlGuardia =
    `<option value="">Todas las guardias</option>`;

  d.guardias.forEach(x=>{
    htmlGuardia += `<option value="${x}">${x}</option>`;
  });

  fGuardia.innerHTML = htmlGuardia;
  pdfArea.innerHTML = fArea.innerHTML;
  pdfGuardia.innerHTML = fGuardia.innerHTML;
}

async function cargarPendientes(){

  const r = await fetch(URL,{
    method:"POST",
    body:JSON.stringify({tipo:"listar"})
  });

  pedidosPendientes = await r.json();

  renderPendientes(pedidosPendientes);
}

function renderPendientes(data){

  let html = "";

  if(data.length===0){
    html = "No hay pedidos pendientes";
  }else{

    data.forEach(x=>{

      let items = "";

      x.items.forEach(it=>{

        items += `
        <label style="display:block;margin:6px 0">
          <input type="checkbox"
          class="chk_${x.id}"
          value="${it.epp}">
          ${it.epp}
        </label>`;
      });

      let fechaBonita = formatearFecha(x.fecha);

      html += `
      <div class="item-admin">

        <div class="nombre">${x.nombre}</div>

        <div class="detalle">
          DNI: ${x.dni}<br>
          Fecha: ${fechaBonita}<br>
          Área: ${x.area}<br>
          Guardia: ${x.guardia}
        </div>

        ${items}

        <button onclick="entregarMarcados('${x.id}')">
          ✔ Entregar Marcados
        </button>

        <button onclick="entregarTodo('${x.id}')">
          ✔ Entregar Todo
        </button>

        <button onclick="rechazarTodo('${x.id}')">
          ❌ Rechazar Todo
        </button>

      </div>`;
    });
  }

  lista.innerHTML = html;
}


function aplicarFiltros(){

  let fecha = fFecha.value.trim();
  let area = fArea.value.trim().toLowerCase();
  let guardia = fGuardia.value.trim().toLowerCase();
  let dni = fDni.value.trim();

  let filtrado = pedidosPendientes.filter(x=>{

    let ok = true;

    let fechaPedido = normalizarFecha(x.fecha);

    if(fecha && fechaPedido !== fecha)
      ok = false;

    if(area &&
      String(x.area).toLowerCase() !== area)
      ok = false;

    if(guardia &&
      String(x.guardia).toLowerCase() !== guardia)
      ok = false;

    if(dni &&
      String(x.dni).indexOf(dni) === -1)
      ok = false;

    return ok;
  });

  renderPendientes(filtrado);
}



function limpiarFiltros(){

  fFecha.value="";
  fArea.value="";
  fGuardia.value="";
  fDni.value="";

  renderPendientes(pedidosPendientes);
}

function formatearFecha(fecha){

  if(!fecha) return "";

  let f = normalizarFecha(fecha);

  return f.substring(8,10)+"/"+
         f.substring(5,7)+"/"+
         f.substring(0,4);
}

function normalizarFecha(fecha){

  if(!fecha) return "";

  return String(fecha).substring(0,10);
}

async function entregarMarcados(id){

  let items = [];

  document
   .querySelectorAll(".chk_"+id+":checked")
   .forEach(x=>items.push(x.value));

  if(items.length===0){
    alert("Seleccione ítems");
    return;
  }

  await fetch(URL,{
    method:"POST",
    body:JSON.stringify({
      tipo:"estado_items",
      id:id,
      items:items,
      estado:"Entregado",
      usuario:user.value
    })
  });

  cargarPendientes();
}

async function rechazarTodo(id){

  await fetch(URL,{
    method:"POST",
    body:JSON.stringify({
      tipo:"estado_grupo",
      id:id,
      estado:"Rechazado",
      usuario:user.value
    })
  });

  cargarPendientes();
}

async function entregarTodo(id){

  const r = await fetch(URL,{
    method:"POST",
    body:JSON.stringify({
      tipo:"estado_grupo",
      id:id,
      estado:"Entregado",
      usuario:user.value
    })
  });

  cargarPendientes();
}

async function generarPDF(){

  if(!pdfDesde.value || !pdfHasta.value){
    alert("Seleccione fechas");
    return;
  }

  const r = await fetch(URL,{
    method:"POST",
    body:JSON.stringify({
      tipo:"pdf",
      desde:pdfDesde.value,
      hasta:pdfHasta.value,
      area:pdfArea.value,
      guardia:pdfGuardia.value
    })
  });

  const d = await r.json();

  if(d.ok){
    window.open(d.url,"_blank");
  }else{
    alert(d.error || "No se pudo generar PDF");
  }
}

/* =========================
   INICIO
========================= */
cargarEPP();