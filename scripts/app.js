const COLS=[
  {key:"Pendiente",          cls:"col-pendiente"},
  {key:"Asignada",           cls:"col-asignada"},
  {key:"En proceso",         cls:"col-proceso"},
  {key:"En espera",          cls:"col-espera"},
  {key:"Pendiente revisión", cls:"col-revision"},
  {key:"Validación",         cls:"col-validacion"},
  {key:"Terminado",          cls:"col-terminado"},
  {key:"Cancelada",          cls:"col-cancelada"},
];

const API_BASE = '/api';
let users=[], tasks=[], currentUser=null, nextTaskId=20, dragId=null;

// Helper global para validar si el usuario tiene permisos de administración
function verificarSiEsGerente(user) {
  if (!user) return false;
  return user.rol === 'Gerente' || user.rol === 'Administrador' || user.rol === 'Admin';
}

function ocultarUsuarioAdmin(u) {
  if (!u) return false;
  const nombre = String(u.nombre || '').trim().toLowerCase();
  const usuario = String(u.usuario || '').trim().toLowerCase();
  const code = String(u.code || '').trim().toUpperCase();
  return nombre.includes('administrador') || usuario.includes('admin') || code === 'ADMIN001';
}

async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (currentUser) {
    headers['x-usuario'] = currentUser.usuario;
  }

  if (method === 'GET' || method === 'HEAD') {
    const response = await fetch(API_BASE + path, {
      headers,
      method: method
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Error ${response.status}`);
    }
     return data;
  }

  let body = {};
  if (options.body) {
    body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
  }
  if (currentUser) {
    body.usuario = currentUser.usuario;
  }

  const response = await fetch(API_BASE + path, {
    headers,
    method,
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}`);
  }
  return data;
}

/* ══════════ INIT ══════════ */
async function init(){
  try {
    users = await apiRequest('/users');
  } catch (error) {
    users = [];
  }
  tasks = [];
  nextTaskId = 10;
  populateSelects();
  showLogin();
}
function saveUsers(){/* Usuarios se actualizan por endpoints específicos */}
function saveTasks(){/* Tareas se actualizan por endpoints específicos */}

function populateSelects(){
  const fu=document.getElementById('forgot-user');
  const fa=document.getElementById('fa');

  const sorted=[...users]
    .filter(u => !ocultarUsuarioAdmin(u))
    .sort((a,b)=> a.nombre.localeCompare(b.nombre));

  fu.innerHTML =
    '<option value="">— Selecciona tu nombre —</option>' +
    sorted.map(u=>
      `<option value="${u.usuario}">${u.nombre}</option>`
    ).join('');

  fa.innerHTML =
    '<option value="">— Sin asignar —</option>' +
    sorted.map(u=>
      `<option value="${u.id}">${u.nombre}</option>`
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

async function doLogin(){
  const usuario = document.getElementById('login-user').value.trim().toLowerCase();
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-err');

  if(!usuario){
    err.textContent='Ingresa tu usuario.';
    err.style.display='block';
    return;
  }

  try {
    const { user } = await apiRequest('/login', {
      method:'POST',
      body:{usuario,pass}
    });

    err.style.display='none';
    currentUser = user;

    document.getElementById('screen-login').style.display='none';
    document.getElementById('screen-app').style.display='flex';
    document.getElementById('hdr-user').textContent = user.nombre + ' (' + user.rol + ')';

    // 🔄 CORREGIDO: Permisos flexibles al iniciar sesión
    const esGerente = verificarSiEsGerente(user);
    document.getElementById('add-btn').style.display = esGerente ? 'flex' : 'none';
    document.getElementById('btn-users').style.display = esGerente ? 'inline-block' : 'none';
    document.getElementById('sbox').style.display = 'inline-block';

    await refreshApp();
    if(pass ==='1234') {
      alert('Por seguridad debes cambiar tu contraseña inicial.');
      showChangePwd();
    }
  } catch (error) {
    console.error('Error de login:', error);
    err.textContent = error.message.includes('Usuario o contraseña') ? 'Usuario o contraseña incorrectos.' : 'Error de conexión con el servidor.';
    err.style.display='block';
  }
}

async function refreshApp(){
  try {
    users = await apiRequest('/users');
    tasks = await apiRequest('/tasks');
    nextTaskId = tasks.length ? Math.max(...tasks.map(t=>t.id))+1 : 10;
    populateSelects();

    if(currentUser){
      document.getElementById('hdr-user').textContent = currentUser.nombre + ' (' + currentUser.rol + ')';
      renderBoard();
    }
  } catch (error) {
    console.error(error);
    alert('No se pudo actualizar desde el servidor.');
  }
}

let forgotVerified = false;
async function doForgot(){
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
      showMsg(msg,'err','Código incorrecto. Consulta con el administrador.');
      return;
    }
    forgotVerified = true;
    document.getElementById('forgot-newpass-row').style.display='block';
    showMsg(msg,'ok','Código correcto. Escribe tu nueva contraseña y presiona "Cambiar".');
    return;
  }

  const np = document.getElementById('forgot-newpass').value;
  if(np.length < 4){
    showMsg(msg,'err','La contraseña debe tener al menos 4 caracteres.');
    return;
  }

  try {
    await apiRequest('/password/forgot', {
      method:'POST',
      body: JSON.stringify({ usuario, code, newPassword: np })
    });

    forgotVerified = false;
    showMsg(msg,'ok','¡Contraseña actualizada! Ya puedes iniciar sesión.');

    setTimeout(()=>{
      document.getElementById('forgot-newpass-row').style.display='none';
      showLogin();
    },2000);
  } catch (error) {
    showMsg(msg,'err', error.message || 'Error al cambiar la contraseña.');
  }
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
async function doChangePwd(){
  const actual=document.getElementById('cp-actual').value;
  const nueva=document.getElementById('cp-nueva').value;
  const confirm=document.getElementById('cp-confirm').value;
  const msg=document.getElementById('chpwd-msg');

  if(!actual){showMsg(msg,'err','Ingresa tu contraseña actual.');return}
  if(nueva.length<4){showMsg(msg,'err','La nueva contraseña debe tener al menos 4 caracteres.');return}
  if(nueva!==confirm){showMsg(msg,'err','Las contraseñas no coinciden.');return}

  try {
    await apiRequest('/password/change', {
      method:'POST',
      body: JSON.stringify({ 
        usuario: currentUser.usuario, 
        currentPassword: actual,
        newPassword: nueva 
      })
    });

    users = users.map(u=>u.id===currentUser.id?{...u,pass:nueva}:u);
    currentUser={...currentUser,pass:nueva};
    showMsg(msg,'ok','¡Contraseña cambiada exitosamente!');
    setTimeout(()=>document.getElementById('mbg-changepwd').classList.remove('open'),1800);
  } catch (error) {
    showMsg(msg,'err', error.message || 'Error al cambiar la contraseña.');
  }
}

/* ══════════ USERS PANEL (Gerente) ══════════ */
async function openUsersPanel(){
  try {
    users = await apiRequest('/users');
  } catch (error) {
    alert('No se pudo cargar la lista de usuarios.');
    return;
  }

  const sorted=[...users]
    .filter(u => !ocultarUsuarioAdmin(u))
    .sort((a,b)=>a.nombre.localeCompare(b.nombre));

  document.getElementById('mbg-users').innerHTML = `
    <div class="modal" style="width:600px; padding: 25px; background: #ffffff; border-radius: 8px; margin: 50px auto; position: relative; box-shadow: 0 5px 20px rgba(0,0,0,0.3); color: #333 !important;">
      
      <div style="display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 20px !important; border-bottom: 2px solid #eaeaea !important; padding-bottom: 10px !important;">
        <h3 style="margin: 0 !important; color: #222 !important; font-family: sans-serif !important; font-size: 20px !important;">👥 Gestión de Usuarios</h3>
        
        <button type="button" onclick="openCreateUser()" style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; background-color: #28a745 !important; color: white !important; padding: 8px 16px !important; font-size: 14px !important; font-weight: bold !important; border: none !important; border-radius: 4px !important; cursor: pointer !important; z-index: 99999 !important; box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;">
          ＋ Nuevo usuario
        </button>
      </div>
      
      <div style="max-height: 380px; overflow-y: auto;">
        <table class="up-table" id="users-table" style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #dee2e6;">#</th>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #dee2e6;">Nombre</th>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #dee2e6;">Rol</th>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #dee2e6;">Código</th>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #dee2e6;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map((u,i) => `
              <tr style="border-bottom: 1px solid #efefef;">
                <td style="padding: 10px;">${i+1}</td>
                <td style="padding: 10px; font-weight: 500;">${esc(u.nombre)}</td>
                <td style="padding: 10px;">
                  <select id="rol-select-${u.id}" onchange="asignarRol(${u.id}, '${esc(u.nombre)}', '${esc(u.code)}')" style="padding: 4px; border-radius: 4px;">
                    <option value="Gerente"   ${u.rol==='Gerente'   ?'selected':''}>Gerente</option>
                    <option value="Ingeniero" ${u.rol==='Ingeniero' ?'selected':''}>Ingeniero</option>
                    <option value="Planta"    ${u.rol==='Planta'    ?'selected':''}>Persona de planta</option>
                  </select>
                </td>
                <td style="padding: 10px; font-family: monospace; background: #fdfdfd;">${esc(u.code)}</td>
                <td style="padding: 10px;">
                  <button class="bs small" onclick="openEditUser(${u.id})" style="margin-right: 5px;">Editar</button>
                  <button class="bc small" onclick="deleteUser(${u.id})">Eliminar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="text-align: right; margin-top: 20px; border-top: 1px solid #eaeaea; padding-top: 10px;">
        <button type="button" class="bc" onclick="document.getElementById('mbg-users').classList.remove('open')" style="padding: 8px 16px; cursor: pointer; border-radius: 4px;">Cerrar</button>
      </div>
    </div>
  `;
  document.getElementById('mbg-users').classList.add('open');
}

async function asignarRol(id, nombre, code) {
  const nuevoRol = document.getElementById(`rol-select-${id}`).value;
  const u = users.find(x => x.id === id);
  if (!u) return;

  try {
    const updated = await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombre,
        pass: '',
        rol: nuevoRol,
        code
      })
    });
    users = users.map(x => x.id === id ? updated : x);

    if (currentUser && currentUser.id === id) {
      currentUser = { ...currentUser, rol: updated.rol };
      document.getElementById('hdr-user').textContent = currentUser.nombre + ' (' + currentUser.rol + ')';
    }

    alert(`Rol de ${nombre} actualizado a: ${nuevoRol}`);
  } catch (error) {
    alert('Error al asignar rol: ' + (error.message || ''));
    openUsersPanel();
  }
}

function openCreateUser(){
  // Corregido: document con minúscula
  const msg=document.getElementById('cu-msg');
  if(msg) { 
    msg.style.display='none'; 
    msg.textContent='';
  }

  document.getElementById('cu-usuario').value='';
  document.getElementById('cu-nombre').value='';
  document.getElementById('cu-pass').value='';
  document.getElementById('cu-rol').value='Ingeniero';
  document.getElementById('cu-code').value = '';

  document.getElementById('mbg-createuser').classList.add('open');
}

async function agregarUsuario() {
  const msg = document.getElementById('cu-msg');
  const usuario = document.getElementById('cu-usuario').value.trim();
  const nombre = document.getElementById('cu-nombre').value.trim();
  const pass = document.getElementById('cu-pass').value;
  const rol = document.getElementById('cu-rol').value;
  const code = document.getElementById('cu-code').value.trim();

  msg.style.display = 'none';
  msg.textContent = '';

  if (!usuario || !nombre || !pass || !rol || !code) {
    msg.textContent = 'Todos los campos son requeridos para un nuevo usuario.';
    msg.style.display = 'block';
    return;
  }

  if (pass.length < 4) {
    msg.textContent = 'La contraseña debe tener al menos 4 caracteres.';
    msg.style.display = 'block';
    return;
  }

  try {
    await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify({ usuario, nombre, pass, rol, code })
    });

    alert('¡Usuario creado con éxito!');
    document.getElementById('mbg-createuser').classList.remove('open');
    await refreshApp();
    openUsersPanel();
  } catch (error) {
    msg.textContent = error.message || 'Error al crear el usuario.';
    msg.style.display = 'block';
  }
}

const saveCreateUser = agregarUsuario;

function openEditUser(id){
  const u=users.find(x=>x.id===id);
  if(!u)return;
  
  document.getElementById('eu-id').value=u.id;
  document.getElementById('eu-usuario').value=u.usuario;
  document.getElementById('eu-nombre').value=u.nombre;
  document.getElementById('eu-pass').value='';
  document.getElementById('eu-rol').value=u.rol;
  document.getElementById('eu-code').value=u.code;
  document.getElementById('eu-title').textContent='Editar: '+u.nombre;
  document.getElementById('mbg-edituser').classList.add('open');
}

async function saveEditUser(){
  const idValue =document.getElementById('eu-id').value;
  const id= idValue ?parseInt(idValue,10): null;

  const nombre = document.getElementById('eu-nombre').value.trim();
  const pass = document.getElementById('eu-pass').value;
  const rol = document.getElementById('eu-rol').value;
  const code = document.getElementById('eu-code').value.trim();

  if(!id) return;
  if(!nombre || !rol || !code){
    alert('Los campos Nombre, Rol y Código son obligatorios.');
    return;
  }

  try {
    const updated = await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nombre, pass, rol, code })
    });

    users=users.map(u => u.id=== id? updated :u); 
    if(currentUser && currentUser.id === id){
      currentUser = { ...currentUser, nombre: updated.nombre, rol: updated.rol };
      document.getElementById('hdr-user').textContent = currentUser.nombre + ' (' + currentUser.rol + ')';
    }
    alert('¡Usuario actualizado con éxito!');
    populateSelects();
    document.getElementById('mbg-edituser').classList.remove('open');
    openUsersPanel();
  } catch (error) {
    alert(error.message || 'Error al guardar cambios del usuario.');
  }
}

async function deleteUser(id){
  if(!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.'))return;
  try{
    await apiRequest(`/users/${id}`, { method:'DELETE' });
    users = users.filter(u=>u.id!==id);
    if(currentUser && currentUser.id===id){
      doLogout();
      return;
    }
    openUsersPanel();
  } catch (error) {
    alert(error.message || 'Error al eliminar usuario.');
  }
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
      
      // 🔄 CORREGIDO: Permisos flexibles al renderizar botones de borrar
      const delBtn = verificarSiEsGerente(currentUser) ? `<button class="ca-btn del" onclick="delTask(${t.id})">🗑</button>` : '';
      
      const timestampsHtml = `
        <div class="timestamps">
          ${t.fecha_creacion ? `<small>Creada: ${new Date(t.fecha_creacion).toLocaleDateString()}</small>` : ''}
          ${t.fecha_asignacion ? `<small>Asignada: ${new Date(t.fecha_asignacion).toLocaleDateString()}</small>` : ''}
          ${t.fecha_cierre ? `<small>Cerrada: ${new Date(t.fecha_cierre).toLocaleDateString()}</small>` : ''}
          ${t.fecha_actualizacion ? `<small>Actualizada: ${new Date(t.fecha_actualizacion).toLocaleDateString()}</small>` : ''}
        </div>`;
      const editBtn=`<button class="ca-btn" onclick="openEdit(${t.id})">✏️</button>`;
      const commentBtn=`<button class="ca-btn" onclick="openComments(${t.id})">💬</button>`;
      const card = document.createElement('div');
      card.className = 'card';
      
      // 🔄 CORREGIDO: Permisos de arrastre flexibles
      const canDrag = verificarSiEsGerente(currentUser) || currentUser.id === t.asignado_a;
      card.setAttribute('draggable', canDrag ? 'true' : 'false');
      card.dataset.id = t.id;
      card.innerHTML = `
        <div class="card-title">${esc(t.tarea)}</div>
        <div class="card-desc">${esc(t.desc)}</div>
        <div class="card-meta">
          ${t.asig ? `<span>Asignado: ${esc(t.asig)}</span>` : ''}
          ${diasHtml}
          ${espHtml}
        </div>
        <div class="card-actions">
          ${editBtn} ${commentBtn} ${delBtn}
        </div>
        ${timestampsHtml}
      `;
      card.addEventListener('dragstart', e => {
        // 🔄 CORREGIDO: Permiso dragstart flexible
        if (!verificarSiEsGerente(currentUser)) {
          e.preventDefault();
          return;
        }
        dragId = t.id;
        setTimeout(() => card.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        dragId = null;
        card.classList.remove('dragging');
      });
      card.addEventListener('dragover', e => {
        const currentTask = tasks.find(task => task.id === dragId);
        // 🔄 CORREGIDO: Permiso dragover flexible
        const canDragOver = verificarSiEsGerente(currentUser) || (currentTask && currentUser.id === currentTask.asignado_a);
        if (!canDragOver) return;
        e.preventDefault();
        card.classList.add('dragover');
      });
      card.addEventListener('dragleave', () => card.classList.remove('dragover'));
      card.addEventListener('drop', async e => {
        const currentTask = tasks.find(task => task.id === dragId);
        // 🔄 CORREGIDO: Permiso drop flexible
        const canDropCard = verificarSiEsGerente(currentUser) || (currentTask && currentUser.id === currentTask.asignado_a);
        if (!canDropCard) return;
        e.preventDefault();
        card.classList.remove('dragover');
        if (dragId === null || dragId === t.id) return;
        const ne = body.dataset.col;
        const rect = card.getBoundingClientRect();
        const insertAfter = e.clientY > rect.top + rect.height / 2;
        const beforeId = insertAfter ? null : t.id;
        const afterId = insertAfter ? t.id : null;
        try {
          await moveTask(dragId, ne, beforeId, afterId);
          renderBoard();
        } catch (error) {
          alert('Error guardando cambio de posición.');
          console.error(error);
        }
      });

      body.appendChild(card);
    });

    body.addEventListener('dragover', e => {
      const currentTask = tasks.find(t => t.id === dragId);
      // 🔄 CORREGIDO: Permiso body dragover flexible
      const canDropBody = verificarSiEsGerente(currentUser) || (currentTask && currentUser.id === currentTask.asignado_a);
      if (!canDropBody) return;
      e.preventDefault();
      body.classList.add('dragover');
    });
    body.addEventListener('dragleave', () => body.classList.remove('dragover'));
    body.addEventListener('drop', async e => {
      const currentTask = tasks.find(t => t.id === dragId);
      // 🔄 CORREGIDO: Permiso body drop flexible
      const canDropBodyFinal = verificarSiEsGerente(currentUser) || (currentTask && currentUser.id === currentTask.asignado_a);
      if (!canDropBodyFinal) return;
      e.preventDefault();
      body.classList.remove('dragover');
      if (dragId === null) return;
      const ne = body.dataset.col;
      try {
        await moveTask(dragId, ne, null, null);
        renderBoard();
      } catch (error) {
        alert('Error guardando cambio de estado.');
        console.error(error);
      }
    });
    board.appendChild(colEl);
  });
}

function getColumnTasks(estado, excludeId) {
  return tasks
    .filter(t => t.estado === estado && t.id !== excludeId)
    .sort((a, b) => Number(a.orden) - Number(b.orden));
}

function calculateOrder(estado, beforeId, afterId, excludeId) {
  const columnTasks = getColumnTasks(estado, excludeId);
  if (beforeId) {
    const index = columnTasks.findIndex(t => t.id === beforeId);
    if (index === 0) {
      return Number(columnTasks[0]?.orden || 1000) / 2 || 500;
    }
    const prev = columnTasks[index - 1];
    const next = columnTasks[index];
    return (Number(prev.orden) + Number(next.orden)) / 2;
  }
  if (afterId) {
    const index = columnTasks.findIndex(t => t.id === afterId);
    if (index === columnTasks.length - 1) {
      return Number(columnTasks[index].orden || 0) + 1000;
    }
    const next = columnTasks[index + 1];
    return (Number(columnTasks[index].orden) + Number(next.orden)) / 2;
  }
  return columnTasks.length ? Number(columnTasks[columnTasks.length - 1].orden) + 1000 : 1000;
}

async function moveTask(id, newEstado, beforeId, afterId) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  const newOrden = calculateOrder(newEstado, beforeId, afterId, id);
  const updated = await apiRequest(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      tarea: task.tarea,
      desc: task.desc,
      asignado_a: task.asignado_a,
      estado: newEstado,
      fa: task.fa || '',
      fc: task.fc || '',
      esp: task.esp,
      obs: task.obs,
      link: task.link,
      orden: newOrden
    })
  });
  tasks = tasks.map(t => t.id === id ? updated : t);
}

async function delTask(id){
  if(!confirm('¿Eliminar esta tarea?'))return;
  try {
    await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
    tasks = tasks.filter(t=>t.id!==id);
    renderBoard();
  } catch (error) {
    alert('No se pudo eliminar la tarea. ' + (error.message || ''));
  }
}

function openModal(task){
  const e=!!task;
  document.getElementById('mtitle').textContent=e?'Editar tarea':'Nueva tarea';
  document.getElementById('mid').value=e?task.id:'';
  document.getElementById('ft').value=e?task.tarea:'';
  document.getElementById('fd').value=e?task.desc:'';
  document.getElementById('fa').value=e?task.asignado_a:'';
  document.getElementById('fe').value=e?task.estado:'Pendiente';
  document.getElementById('fes').value=e?task.esp:'';
  document.getElementById('fo').value=e?task.obs:'';
  document.getElementById('fl').value=e?task.link:'';
  
  // 🔄 CORREGIDO: Permisos flexibles en el Modal de tareas
  const esGerenteModal = verificarSiEsGerente(currentUser);
  document.getElementById('row-est').style.display = esGerenteModal ? 'block' : 'none';
  
  chkEspera();
  document.getElementById('mbg-task').classList.add('open');
}
function openEdit(id){openModal(tasks.find(t=>t.id===id))}
function closeTaskModal(){document.getElementById('mbg-task').classList.remove('open')}
function closeMbg(e){if(e.target===document.getElementById('mbg-task'))closeTaskModal()}
function chkEspera(){document.getElementById('row-esp').style.display=document.getElementById('fe').value==='En espera'?'block':'none'}

async function saveTask(){
  const tarea=document.getElementById('ft').value.trim();
  if(!tarea){alert('Ingresa el nombre de la tarea');return}
  const id=document.getElementById('mid').value;
  
  // 🔄 CORREGIDO: Uso de la validación flexible para el estado
  const estado=verificarSiEsGerente(currentUser)?document.getElementById('fe').value:'Pendiente';
  
  const esp=document.getElementById('fes').value.trim();
  if(estado==='En espera'&&!esp){alert('Indica el motivo de espera');return}
  const f={tarea,desc:document.getElementById('fd').value.trim(),asignado_a:document.getElementById('fa').value.trim() || null,estado,esp,obs:document.getElementById('fo').value.trim(),link:document.getElementById('fl').value.trim()};

  try {
    if(id){
      const original = tasks.find(t=>String(t.id)===String(id)) || {};
      const updated = await apiRequest(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...f,
          fa: original.fa || today(),
          fc: original.fc || ''
        })
      });
      tasks = tasks.map(t=>String(t.id)===String(id)?updated:t);
    } else {
      const created = await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...f,
          fa: today(),
          fc: ''
        })
      });
      tasks.push(created);
      nextTaskId = tasks.length ? Math.max(...tasks.map(t=>t.id))+1 : 10;
    }
    closeTaskModal();
    renderBoard();
  } catch (error) {
    alert('Error guardando la tarea. ' + (error.message || ''));
  }
}

function showMsg(el,type,text){
  el.textContent=text;
  el.className='pmsg '+type;
  el.style.display='block';
}

async function cambiarEstado(id, nuevoEstado) {
  try {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const fc = nuevoEstado === 'Terminado' && !task.fc ? today() : (nuevoEstado !== 'Terminado' ? '' : task.fc);
    const updated = await apiRequest(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        tarea: task.tarea,
        desc: task.desc,
        asignado_a: task.asignado_a,
        estado: nuevoEstado,
        fa: task.fa || today(),
        fc,
        esp: task.esp,
        obs: task.obs,
        link: task.link
      })
    });
    tasks = tasks.map(t => t.id === id ? updated : t);
    renderBoard();
  } catch (error) {
    alert('Error al cambiar el estado. ' + (error.message || ''));
  }
}

async function updateTaskStatus(id, nuevoEstado) {
  await moveTask(id, nuevoEstado, null, null);
}

function openComments(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('mbg-comments').dataset.taskId = taskId;
  document.getElementById('comments-list').innerHTML = '<p>Cargando comentarios...</p>';
  document.getElementById('new-comment').value = '';
  document.getElementById('comment-link').value = '';
  document.getElementById('mbg-comments').classList.add('open');

  loadComments(taskId);
}

async function loadComments(taskId) {
  try {
    const comments = await apiRequest(`/tasks/${taskId}/comments`);
    const list = document.getElementById('comments-list');
    if (comments.length === 0) {
      list.innerHTML = '<p>No hay comentarios aún.</p>';
    } else {
      list.innerHTML = comments.map(c => `
        <div class="comment">
          <strong>${esc(c.usuario)} (${c.rol})</strong> - ${new Date(c.fecha_creacion).toLocaleString()}
          <p>${esc(c.comentario)}</p>
          ${c.evidencia_link ? `<a href="${esc(c.evidencia_link)}" target="_blank">Ver evidencia</a>` : ''}
        </div>
      `).join('');
    }
  } catch (error) {
    document.getElementById('comments-list').innerHTML = '<p>Error cargando comentarios.</p>';
  }
}

async function addComment() {
  const taskId = document.getElementById('mbg-comments').dataset.taskId;
  const comentario = document.getElementById('new-comment').value.trim();
  const evidencia_link = document.getElementById('comment-link').value.trim();

  if (!comentario) {
    alert('Ingresa un comentario.');
    return;
  }

  try {
    await apiRequest(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comentario, evidencia_link })
    });
    loadComments(taskId);
    document.getElementById('new-comment').value = '';
    document.getElementById('comment-link').value = '';
  } catch (error) {
    alert('Error agregando comentario.');
  }
}

// Inicializar la app
init();