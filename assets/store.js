
const Store = {
  get(key, fallback){
    try{ const val = JSON.parse(localStorage.getItem(key)); return (val===null?fallback:val); }
    catch(e){ return fallback; }
  },
  set(key, value){ localStorage.setItem(key, JSON.stringify(value)); },
  uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
};

// Seed initial data if first time
(function seed(){
  if(!localStorage.getItem('seed_v5')){
    const services=[
      {id:Store.uid(), name:'Masaż klasyczny 60 min', durationMin:60, price:180},
      {id:Store.uid(), name:'Masaż relaksacyjny 90 min', durationMin:90, price:250}
    ];
    const pin='2505';
    const settings={contactEmail:'massage.n.spa@gmail.com', contactTel:'729 979 396', rodoText:'Wyrażam zgodę na przetwarzanie danych osobowych w celu realizacji rezerwacji.'};
    const slots=[ // available slots timestamps (ISO)
    ];
    const bookings=[];
    const clients=[];
    Store.set('services', services);
    Store.set('pin', pin);
    Store.set('settings', settings);
    Store.set('slots', slots);
    Store.set('bookings', bookings);
    Store.set('clients', clients);
    localStorage.setItem('seed_v5','1');
  }
})();
