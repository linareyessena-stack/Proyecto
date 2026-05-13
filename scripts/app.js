/* ══════════ DATOS INICIALES ══════════ */
const DEFAULT_USERS = [
  {id:1, usuario:"admin",  nombre:"Augusto Melo",pass:"admin123",  rol:"Gerente",   code:"000000"},
  {id:2, usuario:"ana", nombre:"Ana Rodríguez", pass:"ana123", rol:"Ingeniero", code:"100001"},
  {id:3, usuario:"carlos",nombre:"Carlos Martínez", pass:"carlos123", rol:"Ingeniero", code:"100002"},
  {id:4, usuario:"laura",nombre:"Laura Pérez",  pass:"laura123",  rol:"Ingeniero", code:"100003"},
  {id:5, usuario:"andrés",nombre:"Andrés Ramírez",  pass:"andres123", rol:"Ingeniero", code:"100004"},
  {id:6, usuario:"maría",nombre:"María Torres",   pass:"maria123",  rol:"Ingeniero", code:"100005"},
  {id:7, usuario:"felipe", nombre:"Felipe Gómez",  pass:"felipe123", rol:"Ingeniero", code:"100006"},
  {id:8, usuario:"sofía",nombre:"Sofía Vargas",  pass:"sofia123",  rol:"Ingeniero", code:"100007"},
  {id:9, usuario:"diego",nombre:"Diego Castillo",pass:"diego123",  rol:"Ingeniero", code:"100008"},
  {id:10,usuario:"valentina",nombre:"Valentina Cruz", pass:"vale123",   rol:"Ingeniero", code:"100009"},
  {id:11,usuario:"sebastián",nombre:"Sebastián Mora", pass:"sebas123",  rol:"Ingeniero", code:"100010"},
  {id:12,usuario:"camila",nombre:"Camila Herrera",  pass:"cami123",   rol:"Ingeniero", code:"100011"},
  {id:13,usuario:"juan",nombre:"Juan Salcedo",  pass:"juan123",   rol:"Ingeniero", code:"100012"},
  {id:14,usuario:"natalia",nombre:"Natalia Ospina",  pass:"nata123",   rol:"Ingeniero", code:"100013"},
  {id:15,usuario:"mateo",nombre:"Mateo Jiménez",  pass:"mateo123",  rol:"Ingeniero", code:"100014"},
  {id:16,usuario:"isabella",nombre:"Isabella Sánchez", pass:"isa123",    rol:"Ingeniero", code:"100015"},
  {id:17,usuario:"alejandro",nombre:"Alejandro Ríos",  pass:"alex123",   rol:"Ingeniero", code:"100016"},
  {id:18,usuario:"daniela",nombre:"Daniela Mendoza",  pass:"dani123",   rol:"Ingeniero", code:"100017"},
  {id:19,usuario:"nicolás",nombre:"Nicolás Guerrero",   pass:"nico123",   rol:"Ingeniero", code:"100018"},
  {id:20,usuario:"paula",nombre:"Paula Montoya",   pass:"paula123",  rol:"Ingeniero", code:"100019"},
  {id:21,usuario:"ricardo",nombre:"Ricardo Parra", pass:"ricardo123",rol:"Ingeniero", code:"100020"},
  {id:22,usuario:"manuela",nombre:"Manuela Cardona",  pass:"manu123",   rol:"Ingeniero", code:"100021"},
  {id:23,usuario:"esteban",nombre:"Esteban Aguilar",  pass:"este123",   rol:"Ingeniero", code:"100022"},
  {id:24,usuario:"lina",nombre:"Lina Rincón",  pass:"lina123",   rol:"Ingeniero", code:"100023"},
  {id:25,usuario:"julián",nombre:"Julián Cárdenas", pass:"julian123", rol:"Ingeniero", code:"100024"},
  {id:26,usuario:"sara",nombre:"Sara Pineda",  pass:"sara123",   rol:"Ingeniero", code:"100025"},
  {id:27,usuario:"tomás",nombre:"Tomás Velásquez",pass:"tomas123",  rol:"Ingeniero", code:"100026"},
];

const SAMPLE_TASKS = [
  {id:1,tarea:"Diseño de base de datos",desc:"Modelado ER para módulo de usuarios",asig:"Carlos Martínez",estado:"En proceso",fa:"05/05/2026",fc:"",esp:"",obs:"Revisar normalización",link:""},
  {id:2,tarea:"API de autenticación",desc:"Endpoints JWT y refresh tokens",asig:"Laura Pérez",estado:"Pendiente revisión",fa:"07/05/2026",fc:"",esp:"",obs:"Pendiente code review",link:""},
  {id:3,tarea:"Migración de datos",desc:"Script de migración a producción",asig:"Andrés Ramírez",estado:"En espera",fa:"03/05/2026",fc:"",esp:"Esperando credenciales del cliente",obs:"",link:""},
  {id:4,tarea:"Dashboard de reportes",desc:"Gráficas de actividad mensual",asig:"María Torres",estado:"Terminado",fa:"01/05/2026",fc:"08/05/2026",esp:"",obs:"Aprobado por gerencia",link:""},
  {id:5,tarea:"Pruebas de integración",desc:"Suite de tests para módulo de pagos",asig:"Carlos Martínez",estado:"Pendiente",fa:"10/05/2026",fc:"",esp:"",obs:"",link:""},
];

const COLS=[
  {key:"Tarea",          cls:"col-pendiente"},
  {key:"Descripción",         cls:"col-proceso"},
  {key:"Asignado",          cls:"En proceso"},
  {key:"Pendiente revisión", cls:"col-revision"},
  {key:"Terminado",          cls:"col-terminado"},
];

const UK="ctrl_users_v1", TK="ctrl_tasks_v2";
let users=[], tasks=[], currentUser=null, nextTaskId=20, dragId=null;

/* ══════════ INIT ══════════ */
function init(){
  const su=localStorage.getItem(UK);
  users=su?JSON.parse(su):[...DEFAULT_USERS.map(u=>({...u}))];
  const st=localStorage.getItem(TK);
  tasks=st?JSON.parse(st):[...SAMPLE_TASKS.map(t=>({...t}))];
  nextTaskId=tasks.length?Math.max(...tasks.map(t=>t.id))+1:10;
  populateSelects();

  //Mostrar login al iniciar
  showLogin();
}
function saveUsers(){localStorage.setItem(UK,JSON.stringify(users))}
function saveTasks(){localStorage.setItem(TK,JSON.stringify(tasks))}

function populateSelects(){

  const fu=document.getElementById('forgot-user');

  const sorted=[...users].sort((a,b)=>
    a.nombre.localeCompare(b.nombre)
  );

  fu.innerHTML =
    '<option value="">— Selecciona tu nombre —</option>' +
    sorted.map(u=>
      `<option value="${u.usuario}">${u.nombre}</option>`
    ).join('');

  const fa=document.getElementById('fa');

  fa.innerHTML =
    '<option value="">— Sin asignar —</option>' +
    sorted.map(u=>
      `<option value="${u.nombre}">${u.nombre}</option>`
    ).join('');
}

/* ══════════ PANTALLAS ══════════ */

function showForgot(){
  document.getElementById('screen-login').style.display='none';
  document.getElementById('screen-forgot').style.display='flex';
  document.getElementById('forgot-msg').style.display='none';
  document.getElementById('forgot-newpass-row').style.display='none';
  document.getElementById('forgot-code').value='';
  document.getElementById('forgot-newpass').value='';
}




function showLogin(){
  document.getElementById('screen-login').style.display='flex';
  document.getElementById('screen-forgot').style.display='none';
  document.getElementById('login-err').style.display='none';
  document.getElementById('login-user').value='';
  document.getElementById('login-pass').value='';
}


/* ══════════ LOGIN ══════════ */

function doLogout(){
  currentUser = null;
  document.getElementById('login-user').value='';
  document.getElementById('login-pass').value='';
  showLogin();
}




function doLogin(){
  const usuario = document.getElementById('login-user').value.trim().toLowerCase();
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-err');

  if(!usuario){
    err.textContent='Ingresa tu usuario.';
    err.style.display='block';
    return;
  }

  const u = users.find(x => x.usuario.toLowerCase() === usuario && x.pass === pass);

  if(!u){
    err.textContent='Usuario o contraseña incorrectos.';
    err.style.display='block';
    return;
  }

  err.style.display='none';
  currentUser=u;

  document.getElementById('screen-login').style.display='none';
  document.getElementById('screen-app').style.display='flex';
  document.getElementById('hdr-user').textContent = u.nombre + ' (' + u.rol + ')';


  document.getElementById('add-btn').style.display = u.rol==='Ingeniero'?'flex':'none';
  document.getElementById('btn-users').style.display = u.rol==='Gerente'?'inline-block':'none';
  document.getElementById('sbox').style.display = u.rol==='Gerente'?'inline-block':'none';


  renderBoard();
}

function refreshApp(){
  const su = localStorage.getItem(UK);
  users = su ? JSON.parse(su) : [...DEFAULT_USERS.map(u=>({...u}))];

  const st = localStorage.getItem(TK);
  tasks = st ? JSON.parse(st) : [...SAMPLE_TASKS.map(t=>({...t}))];

  nextTaskId = tasks.length ? Math.max(...tasks.map(t=>t.id))+1 : 10;
  populateSelects();

  if(currentUser){
    document.getElementById('hdr-user').textContent = currentUser.nombre + ' (' + currentUser.rol + ')';
    renderBoard();
  }
}







let forgotVerified = false;

function doForgot(){
  const usuario = document.getElementById('forgot-user').value.trim().toLowerCase();
  const code=document.getElementById('forgot-code').value.trim();
  const msg=document.getElementById('forgot-msg');

  if(!usuario){
    showMsg(msg,'err','Ingresa tu usuario.');
    return;
}

const u = users.find(x => x.usuario.toLowerCase() === usuario);

if(!u){
  showMsg(msg,'err','Usuario no encontrado.');
  return;
}

if(!forgotVerified){
  if(String(u.code).trim() !== String(code).trim()){
    showMsg(msg,'err','Código incorrecto.Consulta con el administrador.');
    return;
}
forgotVerified =true;
document.getElementById('forgot-newpass-row').style.display='block';
showMsg(msg,'ok','Código correcto. Escribe tu nueva contraseña y presiona "Cambiar".');
return;
}

const np =document.getElementById('forgot-newpass').value;
if(np.length < 4){
  showMsg(msg,'err','La contraseña debe tener al menos 4 caracteres.');
  return;
}
  //Actualizar contraseña
  users = users.map(x => x.usuario.toLowerCase() === usuario ? {...x, pass: np} : x)
  saveUsers();

  forgotVerified =false;
  showMsg(msg,'ok','¡Contraseña actualizada! Ya puedes inicar sesión.');

  setTimeout(()=>{
    document.getElementById('forgot-newpass-row').style.display='none';
    showLogin();
  },2000);
}

/* ══════════ CHANGE PASSWORD ══════════ */
function showChangePwd(){
  document.getElementById('cp-actual').value='';
  document.getElementById('cp-nueva').value='';
  document.getElementById('cp-confirm').value='';
  const m=document.getElementById('chpwd-msg');
  m.style.display='none';
  document.getElementById('mbg-changepwd').classList.add('open');
}
function doChangePwd(){
  const actual=document.getElementById('cp-actual').value;
  const nueva=document.getElementById('cp-nueva').value;
  const confirm=document.getElementById('cp-confirm').value;
  const msg=document.getElementById('chpwd-msg');
  if(actual!==currentUser.pass){showMsg(msg,'err','La contraseña actual es incorrecta.');return}
  if(nueva.length<4){showMsg(msg,'err','La nueva contraseña debe tener al menos 4 caracteres.');return}
  if(nueva!==confirm){showMsg(msg,'err','Las contraseñas no coinciden.');return}
  users=users.map(u=>u.id===currentUser.id?{...u,pass:nueva}:u);
  currentUser={...currentUser,pass:nueva};
  saveUsers();
  showMsg(msg,'ok','¡Contraseña cambiada exitosamente!');
  setTimeout(()=>document.getElementById('mbg-changepwd').classList.remove('open'),1800);
}

/* ══════════ USERS PANEL (Gerente) ══════════ */
function openUsersPanel(){
  const sorted=[...users].sort((a,b)=>a.nombre.localeCompare(b.nombre));
  document.getElementById('users-table').innerHTML=`
    <tr><th>#</th><th>Nombre</th><th>Rol</th><th>Código rec.</th><th>Acción</th></tr>`+
    sorted.map((u,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${esc(u.nombre)}</td>
        <td><span class="up-badge ${u.rol==='Gerente'?'up-g':'up-i'}">${u.rol}</span></td>
        <td style="font-family:monospace">${u.code}</td>
        <td><button class="ca-btn" onclick="openEditUser(${u.id})">✏️ Editar</button></td>
      </tr>`).join('');
  document.getElementById('mbg-users').classList.add('open');
}
function openEditUser(id){
  const u=users.find(x=>x.id===id);
  if(!u)return;
  document.getElementById('eu-id').value=u.id;
  document.getElementById('eu-nombre').value=u.nombre;
  document.getElementById('eu-pass').value='';
  document.getElementById('eu-rol').value=u.rol;
  document.getElementById('eu-code').value=u.code;
  document.getElementById('eu-title').textContent='Editar: '+u.nombre;
  document.getElementById('mbg-edituser').classList.add('open');
}
function saveEditUser(){
  const id=parseInt(document.getElementById('eu-id').value);
  const nombre=document.getElementById('eu-nombre').value.trim();
  const pass=document.getElementById('eu-pass').value;
  const code=document.getElementById('eu-code').value.trim();
  if(!nombre){alert('El nombre no puede estar vacío.');return}
  users=users.map(u=>{
    if(u.id!==id)return u;
    return { ...u, nombre, code, pass: pass || u.pass };
  });
  saveUsers();populateSelects();
  document.getElementById('mbg-edituser').classList.remove('open');
  openUsersPanel();
}

/* ══════════ KANBAN ══════════ */
function today(){const d=new Date();return`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`}
function days(d1,d2){try{const p=s=>{const[a,b,c]=s.split('/');return new Date(`${c}-${b}-${a}`)};return Math.max(0,Math.floor((p(d2)-p(d1))/(864e5)))}catch{return 0}}
function dCls(n){return n<=3?'d-ok':n<=7?'d-warn':'d-alert'}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function renderBoard(){
  const q=document.getElementById('sbox').value.toLowerCase();
  const filtered=tasks.filter(t=>!q||t.tarea.toLowerCase().includes(q)||t.asig.toLowerCase().includes(q));
  document.getElementById('cinfo').textContent=`${filtered.length} tarea(s)`;
  const board=document.getElementById('board');
  board.innerHTML='';
  COLS.forEach(col=>{
    const cards=filtered.filter(t=>t.estado===col.key);
    const colEl=document.createElement('div');
    colEl.className=`col ${col.cls}`;
    colEl.innerHTML=`
      <div class="col-hdr">
        <span class="col-name">${col.key}</span>
        <span class="col-count">${cards.length}</span>
      </div>
      <div class="col-body" data-col="${col.key}"></div>`;
    const body=colEl.querySelector('.col-body');

    cards.forEach(t=>{
      
      const d = t.estado !== 'Terminado' ? days(t.fa, today()) : null;

      const diasHtml=d!==null?`<span class="chip ${dCls(d)}">${d}d</span>`:`<span class="chip d-ok">✓</span>`;
      const espHtml=t.esp?`<div class="espera-note">⏸ ${esc(t.esp)}</div>`:'';

      const delBtn=currentUser&&currentUser.rol==='Gerente'?`<button class="ca-btn del" onclick="delTask(${t.id})">🗑</button>`:'';

      const card=document.createElement('div');
      card.className='card';card.draggable=true;card.dataset.id=t.id;
      card.innerHTML=`
        <div class="card-title">${esc(t.tarea)}</div>
        ${t.desc?`<div class="card-desc">${esc(t.desc)}</div>`:''}
        <div class="card-meta">
          ${t.asig?`<span class="chip chip-asig">👤 ${esc(t.asig)}</span>`:''}
          ${diasHtml}
          ${t.fc?`<span class="chip" style="background:#f0f0f0;color:#666">🏁 ${t.fc}</span>`:''}
        </div>
        ${espHtml}
        <div class="card-actions">
        <div class="card-actions">

  <button class="ca-btn" onclick="cambiarEstado(${t.id}, 'En proceso')">
    En proceso
  </button>

  <button class="ca-btn" onclick="cambiarEstado(${t.id}, 'En espera')">
    En espera
  </button>

  <button class="ca-btn" onclick="cambiarEstado(${t.id}, 'Pendiente revisión')">
    Revisión
  </button>

  <button class="ca-btn" onclick="cambiarEstado(${t.id}, 'Terminado')">
    Terminado
  </button>

  <button class="ca-btn" onclick="openEdit(${t.id})">
    ✏️
  </button>

  ${delBtn}

</div>
 `;
      card.addEventListener('dragstart',e=>{dragId=t.id;setTimeout(()=>card.classList.add('dragging'),0);e.dataTransfer.effectAllowed='move'});
      card.addEventListener('dragend',()=>card.classList.remove('dragging'));
      body.appendChild(card);
    });
    body.addEventListener('dragover',e=>{e.preventDefault();body.classList.add('dragover')});
    body.addEventListener('dragleave',()=>body.classList.remove('dragover'));
    body.addEventListener('drop',e=>{
      e.preventDefault();body.classList.remove('dragover');
      if(dragId===null)return;
      const ne=body.dataset.col;
      tasks=tasks.map(t=>{
        if(t.id!==dragId)return t;
        let fc=t.fc;
        if(ne==='Terminado'&&!fc)fc=today();
        if(ne!=='Terminado')fc='';
        return{...t,estado:ne,fc};
      });
      saveTasks();renderBoard();dragId=null;
    });
    board.appendChild(colEl);
  });
}

function delTask(id){if(!confirm('¿Eliminar esta tarea?'))return;tasks=tasks.filter(t=>t.id!==id);saveTasks();renderBoard()}

function openModal(task){
  const e=!!task;
  document.getElementById('mtitle').textContent=e?'Editar tarea':'Nueva tarea';
  document.getElementById('mid').value=e?task.id:'';
  document.getElementById('ft').value=e?task.tarea:'';
  document.getElementById('fd').value=e?task.desc:'';
  document.getElementById('fa').value=e?task.asig:'';
  document.getElementById('fe').value=e?task.estado:'Pendiente';
  document.getElementById('fes').value=e?task.esp:'';
  document.getElementById('fo').value=e?task.obs:'';
  document.getElementById('fl').value=e?task.link:'';
  document.getElementById('row-est').style.display=currentUser&&currentUser.rol==='Gerente'?'block':'none';
  chkEspera();
  document.getElementById('mbg-task').classList.add('open');
}
function openEdit(id){openModal(tasks.find(t=>t.id===id))}
function closeTaskModal(){document.getElementById('mbg-task').classList.remove('open')}
function closeMbg(e){if(e.target===document.getElementById('mbg-task'))closeTaskModal()}
function chkEspera(){document.getElementById('row-esp').style.display=document.getElementById('fe').value==='En espera'?'block':'none'}

function saveTask(){
  const tarea=document.getElementById('ft').value.trim();
  if(!tarea){alert('Ingresa el nombre de la tarea');return}
  const id=document.getElementById('mid').value;
  const estado=currentUser&&currentUser.rol==='Gerente'?document.getElementById('fe').value:'Pendiente';
  const esp=document.getElementById('fes').value.trim();
  if(estado==='En espera'&&!esp){alert('Indica el motivo de espera');return}
  const f={tarea,desc:document.getElementById('fd').value.trim(),asig:document.getElementById('fa').value.trim(),estado,esp,obs:document.getElementById('fo').value.trim(),link:document.getElementById('fl').value.trim()};
  if(id){
    tasks=tasks.map(t=>{
      if(String(t.id)!==String(id))return t;
      let fc=t.fc;
      if(f.estado==='Terminado'&&!fc)fc=today();
      if(f.estado!=='Terminado')fc='';
      return{...t,...f,fc};
    });
  }else{
    tasks.push({...f,id:nextTaskId++,fa:today(),fc:''});
  }
  saveTasks();closeTaskModal();renderBoard();
}

function showMsg(el,type,text){
  el.textContent=text;
  el.className='pmsg '+type;
  el.style.display='block';
}

function cambiarEstado(id, nuevoEstado) {
  tasks = tasks.map(t => {
    if (t.id !== id) return t;
    let fc = t.fc;
    if (nuevoEstado === 'Terminado' && !fc) fc = today();
    if (nuevoEstado !== 'Terminado') fc = '';
    return { ...t, estado: nuevoEstado, fc };
  });
  saveTasks();
  renderBoard();
}

init();
showLogin();