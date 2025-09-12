
function el(sel,root=document){ return root.querySelector(sel); }
function els(sel,root=document){ return [...root.querySelectorAll(sel)]; }

const services = Store.get('services',[]);
const settings = Store.get('settings',{});

function fmtMoney(v){return new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(v);}
function fmtDate(d){return new Date(d).toLocaleString('pl-PL',{dateStyle:'medium', timeStyle:'short'});}
function sameDate(a,b){const da=new Date(a), db=new Date(b); return da.getFullYear()==db.getFullYear() && da.getMonth()==db.getMonth() && da.getDate()==db.getDate();}

function renderServices(){
  const select=el('#service');
  select.innerHTML = services.map(s=>`<option value="${s.id}">${s.name} — ${fmtMoney(s.price)}</option>`).join('');
}

function availableTimesFor(dateISO){
  const slots=Store.get('slots',[]);
  const bookings=Store.get('bookings',[]);
  const taken = new Set(bookings.map(b=>b.slotId));
  return slots.filter(s=> sameDate(s.when,dateISO) && !taken.has(s.id));
}

function renderTimeOptions(){
  const dateVal=el('#date').value;
  const timeSel=el('#time');
  if(!dateVal){ timeSel.innerHTML='<option value="">Wybierz datę…</option>'; return; }
  const opts=availableTimesFor(dateVal);
  if(opts.length===0){ timeSel.innerHTML='<option value="">Brak wolnych godzin</option>'; return; }
  timeSel.innerHTML=opts.map(s=>`<option value="${s.id}">${new Date(s.when).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}</option>`).join('');
}

function handleSubmit(e){
  e.preventDefault();
  const rodo = el('#rodo').checked;
  if(!rodo){ alert('Musisz wyrazić zgodę RODO.'); return; }
  const name = el('#name').value.trim();
  const email = el('#email').value.trim();
  const phone = el('#phone').value.trim();
  const address = el('#address').value.trim();
  const serviceId = el('#service').value;
  const slotId = el('#time').value;
  const notes = el('#notes').value.trim();
  if(!name || !email || !phone || !serviceId || !slotId){ alert('Uzupełnij wszystkie wymagane pola.'); return; }

  const bookings=Store.get('bookings',[]);
  if(bookings.find(b=>b.slotId===slotId)){ alert('Ten termin został już zajęty.'); renderTimeOptions(); return; }

  // Upsert client
  let clients = Store.get('clients',[]);
  let client = clients.find(c=>c.email===email || c.phone===phone);
  if(!client){
    client = {id:Store.uid(), name,email,phone,address, notesGeneral:'', preferences:{allergies:'',massage:'',health:'',mental:''}};
    clients.push(client);
    Store.set('clients',clients);
  }else{
    // update contact data
    client.name=name; client.phone=phone; client.address=address; Store.set('clients',clients);
  }

  const booking={
    id:Store.uid(), clientId:client.id, serviceId, slotId, notes, createdAt:new Date().toISOString(), status:'Oczekująca'
  };
  bookings.push(booking);
  Store.set('bookings',bookings);

  // Confirmation message
  const service=services.find(s=>s.id===serviceId);
  const slots=Store.get('slots',[]);
  const slot=slots.find(s=>s.id===slotId);
  const msg = [
    `Dziękujemy za rezerwację w Massage & SPA!`,
    `Termin: ${fmtDate(slot.when)}`,
    `Usługa: ${service.name} — ${fmtMoney(service.price)}`,
    ``,
    `Prosimy: zapisz termin w kalendarzu i zadbaj o higienę przed wizytą dla swojego komfortu i komfortu masażystki.`,
    `Do zobaczenia!`
  ].join('\n');

  alert(msg);
  // optional mailto
  const subject = encodeURIComponent('Potwierdzenie rezerwacji — Massage & SPA');
  const body = encodeURIComponent(msg);
  el('#mailto').href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;

  // reset
  el('#form').reset();
  renderTimeOptions();
}

document.addEventListener('DOMContentLoaded', ()=>{
  renderServices();
  el('#date').addEventListener('change', renderTimeOptions);
  el('#form').addEventListener('submit', handleSubmit);
  // set min date today
  const today = new Date().toISOString().slice(0,10);
  el('#date').setAttribute('min', today);
  // show contact in footer
  el('#contact').textContent = `${settings.contactEmail} • ${settings.contactTel}`;
});
