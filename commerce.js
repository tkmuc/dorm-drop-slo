import { ITEMS, COLORS, ROOMS, PRESETS, sanitize, totalFor } from './catalog.js';

export const PACKAGES = [
  { id:'night', name:'First Night', eyebrow:'THE ARRIVAL ESSENTIALS', description:'Sleep, shower, recharge. The basics that make your first night feel a little more like home.', items:PRESETS.night, color:'forest', theme:'sand', highlights:['Twin XL bedding set','Bath & hand towels','Toiletries, charging & shower kit'], note:'5 essentials · Your first night, covered' },
  { id:'week', name:'First Week', eyebrow:'A LITTLE MORE SETTLED', description:'Your first-night essentials, with the useful extras that make the next few days easier.', items:PRESETS.week, color:'forest', theme:'sage', highlights:['Everything in First Night','Desk lamp & laundry basket','Wooden hangers & water bottle'], note:'9 essentials · A head start on week one' },
  { id:'all', name:'All Set', eyebrow:'THE WHOLE FRESH START', description:'A complete collection of essentials and comfort extras. Arrive ready to make yourself at home.', items:[...PRESETS.week,'fan','rug','storage'], color:'forest', theme:'clay', highlights:['Everything in First Week','Desk fan & soft rug','Under-bed storage box'], note:'12 essentials · Room to feel at home' }
];
export const SHARED_ITEMS = [
  {id:'fan',name:'Desk fan',detail:'One shared fan may be enough.'},
  {id:'rug',name:'Soft rug',detail:'Agree on a shared space and style.'},
  {id:'cleaning',name:'Cleaning supplies',detail:'A quick clean is a shared job.'},
  {id:'dishes',name:'Kitchen basics',detail:'Cups, plates and utensils for shared meals.'},
  {id:'snacks',name:'First-week snacks',detail:'Something small to share when you arrive.'}
];
export const PICKUPS = [
  {id:'cerro',name:'Cerro Vista meeting point',short:'Cerro Vista',hint:'Example meeting point near the apartment community.',room:'cerro',x:680,y:175},
  {id:'halls',name:'Residence halls meeting point',short:'Residence halls',hint:'Example meeting point for students in shared dorms.',room:'dorm',x:610,y:405},
  {id:'welcome',name:'Welcome meeting point',short:'Welcome point',hint:'An alternative example pickup point for this prototype.',room:'both',x:290,y:340}
];
export const WINDOWS = [
  {id:'09',label:'9–11 AM',long:'9:00–11:00 AM'},
  {id:'11',label:'11 AM–1 PM',long:'11:00 AM–1:00 PM'},
  {id:'13',label:'1–3 PM',long:'1:00–3:00 PM'},
  {id:'15',label:'3–5 PM',long:'3:00–5:00 PM'}
];
export const EMPTY_CUSTOM = {room:'cerro',color:'forest',items:[]};
const ids = new Set(ITEMS.map(i=>i.id));
export function safeName(value,fallback='') { return typeof value==='string' ? value.replace(/[\u0000-\u001f]/g,'').trim().slice(0,48) || fallback : fallback; }
export function safeAssignments(value) {
  const result={};for(const item of SHARED_ITEMS) result[item.id]=['mine','roommate','have','undecided'].includes(value?.[item.id])?value[item.id]:'undecided';return result;
}
export function makeInitial(legacy) {
  return {mode:null,packageId:'week',custom:sanitize(legacy??EMPTY_CUSTOM),planner:{names:[],assignments:safeAssignments({}),applied:false},pickup:{room:'cerro',point:'cerro',date:'2027-08-20',window:'13'},name:'Alex',order:null};
}
export function normalizeState(input,legacy) {
  const fallback=makeInitial(legacy);if(!input||typeof input!=='object')return fallback;
  fallback.mode=['package','custom'].includes(input.mode)?input.mode:null;
  fallback.packageId=PACKAGES.some(p=>p.id===input.packageId)?input.packageId:'week';
  fallback.custom=sanitize(input.custom??fallback.custom);
  fallback.planner={names:Array.isArray(input.planner?.names)?input.planner.names.map(n=>safeName(n)).filter(Boolean).slice(0,4):[],assignments:safeAssignments(input.planner?.assignments),applied:input.planner?.applied===true};
  fallback.pickup={room:input.pickup?.room==='dorm'?'dorm':'cerro',point:PICKUPS.some(p=>p.id===input.pickup?.point)?input.pickup.point:'cerro',date:validDate(input.pickup?.date)?input.pickup.date:'2027-08-20',window:WINDOWS.some(w=>w.id===input.pickup?.window)?input.pickup.window:'13'};
  fallback.name=safeName(input.name,'Alex');
  if(input.order&&Array.isArray(input.order.items)&&input.order.items.some(id=>ids.has(id))) {
    const o=input.order;
    const pickup={room:o.pickup?.room==='dorm'?'dorm':'cerro',point:PICKUPS.some(p=>p.id===o.pickup?.point)?o.pickup.point:'cerro',date:validDate(o.pickup?.date)?o.pickup.date:'2027-08-20',window:WINDOWS.some(w=>w.id===o.pickup?.window)?o.pickup.window:'13'};
    const items=[...new Set(o.items)].filter(id=>ids.has(id));
    fallback.order={id:typeof o.id==='string'&&/^DD-[0-9]{6}$/.test(o.id)?o.id:'DD-100001',name:safeName(o.name,'Alex'),label:safeName(o.label,'My custom kit'),mode:o.mode==='package'?'package':'custom',color:COLORS.some(c=>c.id===o.color)?o.color:'forest',items,total:totalFor(items),pickup,phase:['confirmed','arrived','collected'].includes(o.phase)?o.phase:'confirmed',plan:{names:Array.isArray(o.plan?.names)?o.plan.names.map(n=>safeName(n)).filter(Boolean).slice(0,4):[],assignments:safeAssignments(o.plan?.assignments),applied:o.plan?.applied===true}};
  }
  return fallback;
}
export function validDate(value) { if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return !Number.isNaN(+d)&&d.toISOString().slice(0,10)===value; }
export function packageFor(state) { return PACKAGES.find(p=>p.id===state.packageId)??PACKAGES[1]; }
export function baseItems(state) { if(state.mode==='package')return [...packageFor(state).items];if(state.mode==='custom')return [...sanitize(state.custom).items];return []; }
export function orderItems(state,preview=false) { const items=baseItems(state);if(!state.planner.applied&&!preview)return items;return items.filter(id=>!['fan','rug'].includes(id)||!['roommate','have'].includes(state.planner.assignments[id])); }
export function kitLabel(state) { return state.mode==='package'?packageFor(state).name:'My custom kit'; }
export function kitColor(state) { return state.mode==='package'?packageFor(state).color:state.custom.color; }
export function savings(state,preview=false) { return totalFor(baseItems(state))-totalFor(orderItems(state,preview)); }
export function pickupFor(id) { return PICKUPS.find(p=>p.id===id)??PICKUPS[0]; }
export function windowFor(id) { return WINDOWS.find(w=>w.id===id)??WINDOWS[2]; }
export function dateLabel(date,short=false) { if(!validDate(date))return 'Choose a date';return new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:short?'short':'long',day:'numeric',year:short?undefined:'numeric',timeZone:'UTC'}); }
export function createOrder(state) {
  const items=orderItems(state);if(!items.length)throw new Error('Add at least one item to your kit.');
  if(!validDate(state.pickup.date)||!PICKUPS.some(p=>p.id===state.pickup.point)||!WINDOWS.some(w=>w.id===state.pickup.window))throw new Error('Choose your pickup details first.');
  return {id:'DD-'+String(Math.floor(100000+Math.random()*900000)),name:safeName(state.name,'Alex'),label:kitLabel(state),mode:state.mode,color:kitColor(state),items:[...items],total:totalFor(items),pickup:{...state.pickup},phase:'confirmed',plan:JSON.parse(JSON.stringify(state.planner))};
}
export function sharedSnapshot(state) { return {names:state.planner.names,assignments:state.planner.assignments}; }
export function importPlan(value) {if(!value||typeof value!=='object')throw new Error('This plan could not be opened.');return {names:Array.isArray(value.names)?value.names.map(n=>safeName(n)).filter(Boolean).slice(0,4):[],assignments:safeAssignments(value.assignments),applied:false};}
export { ITEMS, COLORS, ROOMS, totalFor };
