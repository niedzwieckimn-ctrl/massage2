
function el(s,r=document){return r.querySelector(s)}
function els(s,r=document){return [...r.querySelectorAll(s)]}
function fmtMoney(v){return new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(v);}
function fmtDate(d){return new Date(d).toLocaleString('pl-PL',{dateStyle:'medium', timeStyle:'short'})}

const Session = {
  isAuthed(){ return sessionStorage.getItem('adminAuthed')==='1'; },
  login(){ sessionStorage.setItem('adminAuthed','1'); },
  logout(){ sessionStorage.removeItem('adminAuthed'); }
};

function requireAuth(){
  if(!Session.isAuthed()){
    el('#loginView').style.display='block';
    el('#appView').style.display='none';
  }else{
    el('#loginView').style.display='none';
    el('#appView').style.display='block';
    renderAll();
  }
}

function login(){
  const pinInput = el('#pin').value.trim();
  const pin = Store.get('pin','2505');
  if(pinInput===pin){ Session.login(); requireAuth(); }
  else { alert('Błędny PIN'); }
}
function logout(){ Session.logout(); requireAuth(); }

function renderAll(){
  renderUpcoming();
  renderSlots();
  renderServices();
  renderClients();
  renderSettings();
}

function renderUpcoming(){
  const bookings = Store.get('bookings',[]);
  const slots = Store.get('slots',[]);
  const services = Store.get('services',[]);
  const clients = Store.get('clients',[]);
  // join data
  const items = bookings.map(b=>{
    const slot = slots.find(s=>s.id===b.slotId) || {when:b.createdAt};
    const service = services.find(s=>s.id===b.serviceId) || {name:'(usługa)'};
    const client = clients.find(c=>c.id===b.clientId) || {name:'(klient)'};
    return {...b, when:slot.when, serviceName:service.name, clientName:client.name};
  }).sort((a,b)=> new Date(a.when)-new Date(b.when));
  const wrap = el('#upcoming');
  wrap.innerHTML = items.length? '' : '<div class="notice">Brak rezerwacji.</div>';
  for(const it of items){
    const card = document.createElement('div');
    card.className='listItem';
    card.innerHTML = `<div class='inline' style='justify-content:space-between'>
      <div><b>${fmtDate(it.when)}</b> • ${it.serviceName} <span class='meta'>(${it.clientName})</span></div>
      <div class='inline'>
        <span class='badge ${it.status==='Potwierdzona'?'green':'red'}'>${it.status}</span>
        <button class='btn success' data-act='confirm' data-id='${it.id}'>Potwierdź</button>
        <button class='btn danger' data-act='delBooking' data-id='${it.id}'>Usuń</button>
      </div>
    </div>`;
    wrap.appendChild(card);
  }
  wrap.onclick = (e)=>{
    const id = e.target.dataset.id;
    const act = e.target.dataset.act;
    if(!id) return;
    let bookings = Store.get('bookings',[]);
    if(act==='delBooking'){
      bookings = bookings.filter(b=>b.id!==id);
      Store.set('bookings',bookings);
      renderAll();
    }
    if(act==='confirm'){
      bookings = bookings.map(b=> b.id===id? {...b, status:'Potwierdzona'} : b );
      Store.set('bookings',bookings);
      renderAll();
    }
  };
}

function renderSlots(){
  const list = el('#slotsList');
  const slots = Store.get('slots',[]).sort((a,b)=> new Date(a.when)-new Date(b.when));
  list.innerHTML = slots.length? '' : '<div class="notice">Brak dodanych terminów.</div>';
  for(const s of slots){
    const row = document.createElement('div');
    row.className='listItem inline';
    row.style.justifyContent='space-between';
    row.innerHTML = `<div><b>${fmtDate(s.when)}</b></div>
      <div class='inline'><button class='btn danger' data-id='${s.id}'>Usuń</button></div>`;
    list.appendChild(row);
  }
  list.onclick = (e)=>{
    const id=e.target.dataset.id; if(!id) return;
    let slots = Store.get('slots',[]).filter(s=>s.id!==id);
    Store.set('slots',slots);
    renderSlots();
  }

  el('#addSlot').onclick = ()=>{
    const d = el('#slotDate').value;
    const t = el('#slotTime').value;
    if(!d||!t) { alert('Wybierz datę i godzinę'); return;}
    const iso = new Date(`${d}T${t}:00`).toISOString();
    const slots = Store.get('slots',[]);
    slots.push({id:Store.uid(), when:iso});
    Store.set('slots',slots);
    renderSlots();
  }
}

function renderServices(){
  const services = Store.get('services',[]);
  const tbody=el('#servicesBody');
  tbody.innerHTML='';
  for(const s of services){
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${s.name}</td><td>${s.durationMin} min</td><td>${fmtMoney(s.price)}</td>
    <td class='inline'><button class='btn secondary' data-act='edit' data-id='${s.id}'>Edytuj</button>
    <button class='btn danger' data-act='del' data-id='${s.id}'>Usuń</button></td>`;
    tbody.appendChild(tr);
  }
  el('#addService').onclick=()=>{
    const name=prompt('Nazwa usługi:');
    if(!name) return;
    const duration=parseInt(prompt('Czas trwania (min):')||'60',10);
    const price=parseInt(prompt('Cena (PLN):')||'180',10);
    const list=Store.get('services',[]);
    list.push({id:Store.uid(), name, durationMin:duration, price});
    Store.set('services',list); renderServices();
  };
  tbody.onclick=(e)=>{
    const id=e.target.dataset.id, act=e.target.dataset.act;
    if(!id) return;
    let list=Store.get('services',[]);
    if(act==='del'){ list=list.filter(x=>x.id!==id); Store.set('services',list); renderServices(); }
    if(act==='edit'){
      const s=list.find(x=>x.id===id);
      const name=prompt('Nazwa',s.name)||s.name;
      const duration=parseInt(prompt('Czas (min)',s.durationMin)||s.durationMin,10);
      const price=parseInt(prompt('Cena (PLN)',s.price)||s.price,10);
      list=list.map(x=> x.id===id? {...x,name,durationMin:duration,price}:x);
      Store.set('services',list); renderServices();
    }
  };
}

function renderClients(){
  const wrap=el('#clientsList');
  const clients=Store.get('clients',[]);
  wrap.innerHTML = clients.length? '' : '<div class="notice">Brak klientów.</div>';
  for(const c of clients){
    const div=document.createElement('div'); div.className='listItem';
    div.innerHTML=`<div class='inline' style='justify-content:space-between'>
      <div><b>${c.name}</b> <span class='meta'>${c.email} • ${c.phone}</span></div>
      <button class='btn secondary' data-id='${c.id}'>Otwórz</button>
    </div>`;
    wrap.appendChild(div);
  }
  wrap.onclick=(e)=>{
    const id=e.target.dataset.id; if(!id) return;
    openClient(id);
  }
}

function openClient(id){
  const c = Store.get('clients',[]).find(x=>x.id===id);
  if(!c) return;
  el('#clientName').textContent=c.name;
  el('#cEmail').value=c.email||'';
  el('#cPhone').value=c.phone||'';
  el('#cAddress').value=c.address||'';
  el('#cNotes').value=c.notesGeneral||'';
  el('#cPrefAll').value=c?.preferences?.allergies||'';
  el('#cPrefMassage').value=c?.preferences?.massage||'';
  el('#cPrefHealth').value=c?.preferences?.health||'';
  el('#cPrefMental').value=c?.preferences?.mental||'';

  // History
  const histWrap=el('#historyBody'); histWrap.innerHTML='';
  const bookings = Store.get('bookings',[]).filter(b=>b.clientId===id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const services = Store.get('services',[]);
  for(const b of bookings){
    const srv=services.find(s=>s.id===b.serviceId)||{name:'(usługa)'};
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${fmtDate(b.createdAt)}</td><td>${srv.name}</td><td>${b.notes||''}</td><td>${b.status||''}</td>`;
    histWrap.appendChild(tr);
  }

  // Suggestion (simple: based on last note & preferences)
  const suggest = [];
  if(c?.preferences?.massage) suggest.push('Preferencje: '+c.preferences.massage);
  if(c?.preferences?.health) suggest.push('Stan zdrowia: '+c.preferences.health);
  const last = bookings[0]?.notes; if(last) suggest.push('Ostatnia notatka: '+last);
  const rec = 'Na kolejnym spotkaniu skoncentrować się na obszarach napięciowych, w szczególności: kark/plecy. Włączyć techniki rozluźniające i rozciąganie. Ocenić reakcję na bodźce i dobrać nacisk.';
  el('#clientSuggestion').textContent = (suggest.concat([rec])).join(' \n• ');

  el('#clientModal').style.display='block';
  el('#clientModal').dataset.id=id;
}

function saveClient(){
  const id=el('#clientModal').dataset.id;
  let list=Store.get('clients',[]);
  list=list.map(c=> c.id===id? {
    ...c,
    email:el('#cEmail').value.trim(),
    phone:el('#cPhone').value.trim(),
    address:el('#cAddress').value.trim(),
    notesGeneral:el('#cNotes').value.trim(),
    preferences:{
      allergies:el('#cPrefAll').value.trim(),
      massage:el('#cPrefMassage').value.trim(),
      health:el('#cPrefHealth').value.trim(),
      mental:el('#cPrefMental').value.trim(),
    }
  }:c);
  Store.set('clients',list);
  alert('Zapisano profil klienta');
  renderClients();
}

function renderSettings(){
  const s=Store.get('settings',{});
  el('#setEmail').value=s.contactEmail||'';
  el('#setTel').value=s.contactTel||'';
  el('#setRodo').value=s.rodoText||'';
  el('#setPIN').value=Store.get('pin','2505');
}

function saveSettings(){
  const s={
    contactEmail:el('#setEmail').value.trim(),
    contactTel:el('#setTel').value.trim(),
    rodoText:el('#setRodo').value.trim()
  };
  Store.set('settings',s);
  Store.set('pin', el('#setPIN').value.trim()||'2505');
  alert('Zapisano ustawienia');
}

document.addEventListener('DOMContentLoaded', ()=>{
  // Wire login
  el('#loginBtn').onclick=login;
  el('#logoutBtn').onclick=logout;
  // Save client/settings
  el('#saveClientBtn').onclick=saveClient;
  el('#closeClientBtn').onclick=()=> el('#clientModal').style.display='none';
  el('#saveSettingsBtn').onclick=saveSettings;
  // Min date for slot picker
  const today = new Date().toISOString().slice(0,10);
  el('#slotDate').setAttribute('min', today);
  requireAuth();
});
