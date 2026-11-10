import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { SVGRenderer } from './vendor/SVGRenderer.js';
import { makeRoomModel } from './room-model.js';
import { ITEMS, COLORS, PRESETS, ROOMS, DEFAULT, sanitize, totalFor, money } from './catalog.js';
import { productShot } from './products.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const storageKey = 'dorm-drop-room-lab-v1';
const embedded = new URLSearchParams(location.search).get('embedded') === '1';
const poster = new URLSearchParams(location.search).get('poster') === '1';
let embeddedInitialized = false;
let state = sanitize(poster ? {room:'cerro',color:'forest',items:['bedding','towels','lamp','rug','laundry']} : embedded ? { room:'cerro', color:'forest', items:[] } : DEFAULT);
if (!embedded && !poster) { try { const stored = localStorage.getItem(storageKey); if (stored) state = sanitize(JSON.parse(stored)); } catch {} }
if (poster) document.documentElement.classList.add('room-poster');
function tellParent(type, extra = {}) { if (embedded) window.parent.postMessage({type, ...extra}, location.origin); }
if (embedded) {
  document.documentElement.classList.add('room-embedded');
  $('#review-button').innerHTML = 'Continue with my kit <span aria-hidden="true">↗</span>';
  $('.color-section .section-heading > span').textContent = '01';
  $('.items-section .section-heading > span').textContent = '02';
}
let category = 'essentials';
let room3d;
const icons = {
  bed: '<path d="M3 18V8m18 10V8M3 13h18v5H3m2-5V6h14v7M7 9h4v3H7m6-3h4v3h-4"/>',
  towel: '<path d="M6 3h12v17H6zM6 15h12M3 5h3m12 0h3M9 18h6"/>',
  bottle: '<path d="M9 3h6v4l2 3v11H7V10l2-3Zm0 4h6M8 14h8"/>',
  charging: '<path d="M6 3v4m5-4v4M4 7h9v5l-4 3v5m0-5H6l-2-3m9 6h5a3 3 0 0 0 0-6h-2m0-2v4"/>',
  shower: '<path d="M4 11h16l-2 10H6Zm4 0V7a4 4 0 0 1 8 0v4M9 15v3m3-3v3m3-3v3"/>',
  lamp: '<path d="M5 21h11m-5 0V11l5-6M11 11 5 6m7-3 8 5-3 4-8-5Z"/>',
  basket: '<path d="M4 7h16l-2 14H6ZM3 7h18M8 4h8M8 10l1 8m3-8v8m4-8-1 8"/>',
  hanger: '<path d="M10 5a2 2 0 1 1 3 2v2l8 7v2H3v-2l9-7"/>',
  fan: '<circle cx="12" cy="10" r="7"/><circle cx="12" cy="10" r="2"/><path d="m12 3 2 5m5 2-5 2m-3 5-1-5M5 7l5 2m2 8v4m-4 0h8"/>',
  rug: '<path d="M4 5h16v14H4ZM7 8h10v8H7M4 3v2m4-2v2m4-2v2m4-2v2m4-2v2M4 19v2m4-2v2m4-2v2m4-2v2m4-2v2"/>',
  box: '<path d="m3 7 9-4 9 4v13H3Zm0 0 9 4 9-4M12 11v9M8 15h8"/>'
};

function toast(message) {
  $('#global-message').textContent = message;
  $('#global-message').classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('#global-message').classList.remove('show'), 2300);
}
function sceneMessage(message) {
  $('#scene-message').textContent = message;
  $('#scene-message').classList.add('show');
  clearTimeout(sceneMessage.timer);
  sceneMessage.timer = setTimeout(() => $('#scene-message').classList.remove('show'), 1700);
}
function persist() { if(poster)return true;try { localStorage.setItem(storageKey, JSON.stringify(state)); return true; } catch { return false; } }
function currentColor() { return COLORS.find(c => c.id === state.color); }
function drawUI() {
  const focusId = document.activeElement?.dataset?.toggle;
  $('#swatches').innerHTML = COLORS.map(color => `<button class="swatch" style="--swatch:${color.hex}" data-color="${color.id}" aria-label="${color.name}" title="${color.name}" aria-pressed="${state.color === color.id}"></button>`).join('');
  $('#color-name').textContent = currentColor().name;
  $('#color-note').textContent = state.items.includes('bedding') ? 'Your bedding and towel accents update together.' : 'Add a bedding set to see this color on your bed.';
  $('#count-pill').textContent = `${state.items.length} ${state.items.length === 1 ? 'item' : 'items'}`;
  $('#selection-count').textContent = `${state.items.length} ${state.items.length === 1 ? 'item' : 'items'} selected`;
  $('#kit-total').textContent = money(totalFor(state.items));
  $('#items-list').innerHTML = ITEMS.filter(item => item.category === category).map(item => {
    const selected = state.items.includes(item.id);
    return `<div class="item-row ${selected ? 'selected' : ''}" data-item="${item.id}"><div class="item-thumb" aria-hidden="true">${productShot(item.id)}</div><div class="item-info" data-focus-item="${item.id}"><strong>${item.name}</strong><small>${item.detail}</small></div><div class="item-action"><span class="item-price">${money(item.price)}</span><button class="item-toggle" data-toggle="${item.id}" aria-pressed="${selected}" aria-label="${selected ? 'Remove' : 'Add'} ${item.name}">${selected ? '✓' : '+'}</button></div></div>`;
  }).join('');
  $$('[data-preset]').forEach(button => {
    const items = PRESETS[button.dataset.preset];
    button.setAttribute('aria-pressed', String(items.length === state.items.length && items.every(id => state.items.includes(id))));
  });
  $$('[data-room]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.room === state.room)));
  $$('[data-category]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.category === category));
    const count=button.querySelector('span');
    if(count)count.textContent=ITEMS.filter(item=>item.category===button.dataset.category).length;
  });
  $('#room-subtitle').textContent = ROOMS[state.room].subtitle;
  $('#room-caption-title').textContent = ROOMS[state.room].title;
  $('#housing-description').textContent = ROOMS[state.room].note;
  if (focusId) $(`[data-toggle="${focusId}"]`)?.focus({ preventScroll: true });
  $('#room-canvas').dataset.selectedItems = state.items.join(',');
  $('#room-canvas').dataset.beddingColor = state.color;
  $('#room-canvas').dataset.roomLayout = state.room;
  if (embeddedInitialized) tellParent('dormdrop:change', {payload:state});
}
function update(message) { drawUI(); room3d?.update(); persist(); if (message) sceneMessage(message); }
function toggleItem(id) {
  const item = ITEMS.find(i => i.id === id);
  if (!item) return;
  const has = state.items.includes(id);
  state.items = has ? state.items.filter(i => i !== id) : [...state.items, id];
  update(`${item.name} ${has ? 'removed' : 'added to your room'}`);
}
function focusItem(id) {
  const item = ITEMS.find(i => i.id === id);
  if (!item) return;
  category = item.category;
  drawUI();
  const row = $(`[data-item="${id}"]`);
  row?.classList.add('highlight');
  if (window.innerWidth < 801) row?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
  setTimeout(() => row?.classList.remove('highlight'), 1000);
  sceneMessage(id === 'bedding' ? 'Try a different bedding color →' : item.name + ' is in your kit');
}

document.addEventListener('click', event => {
  const toggle = event.target.closest('[data-toggle]');
  if (toggle) return toggleItem(toggle.dataset.toggle);
  const color = event.target.closest('[data-color]');
  if (color) { state.color = color.dataset.color; update(currentColor().name + ' selected'); $(`[data-color="${state.color}"]`)?.focus({ preventScroll: true }); return; }
  const preset = event.target.closest('[data-preset]');
  if (preset) { state.items = [...PRESETS[preset.dataset.preset]]; update(preset.dataset.preset === 'empty' ? 'A blank canvas. Make it yours.' : preset.textContent.trim() + ' kit selected'); return; }
  const cat = event.target.closest('[data-category]');
  if (cat) { category = cat.dataset.category; drawUI(); return; }
  const room = event.target.closest('[data-room]');
  if (room && room.dataset.room !== state.room) { state.room = room.dataset.room; room3d?.rebuild(); update(ROOMS[state.room].name + ' selected'); return; }
  const view = event.target.closest('[data-view]');
  if (view) { room3d?.view(view.dataset.view); $$('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b === view))); return; }
  const focus = event.target.closest('[data-focus-item]');
  if (focus) { focusItem(focus.dataset.focusItem); }
});

$('#reset-button').addEventListener('click', () => {
  const layoutChanged = state.room !== DEFAULT.room;
  state = sanitize(DEFAULT); category = 'essentials';
  if (layoutChanged) room3d?.rebuild();
  room3d?.view('room');
  $$('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === 'room')));
  update('Back to your first-night essentials');
});
$('#review-button').addEventListener('click', () => {
  if (embedded) {
    if (!state.items.length) { toast('Add at least one item to your custom kit.'); return; }
    tellParent('dormdrop:continue', {payload:state});
    return;
  }
  const selected = ITEMS.filter(item => state.items.includes(item.id));
  $('#review-description').textContent = `${ROOMS[state.room].name} · ${currentColor().name} · ${selected.length} ${selected.length === 1 ? 'item' : 'items'}`;
  $('#review-list').innerHTML = selected.map(item => `<div class="review-item"><span>${item.name}${item.id === 'bedding' ? '<br><small>' + currentColor().name + '</small>' : ''}</span><span>${money(item.price)}</span></div>`).join('');
  $('#review-empty').hidden = selected.length > 0;
  $('#review-total').textContent = money(totalFor(state.items));
  $('#save-message').textContent = '';
  $('#copy-fallback').hidden = true;
  $('#review-dialog').showModal();
});
$('#close-review').addEventListener('click', () => $('#review-dialog').close());
$('#review-dialog').addEventListener('click', event => { if (event.target === $('#review-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
$('#save-kit').addEventListener('click', () => { $('#save-message').textContent = persist() ? 'Saved on this device. Your setup will be here when you return.' : 'This browser cannot save locally. You can still copy your kit list.'; });
$('#copy-kit').addEventListener('click', async () => {
  const text = ['Dorm Drop SLO — My kit', `${ROOMS[state.room].name} | ${currentColor().name}`, ...ITEMS.filter(i => state.items.includes(i.id)).map(i => `${i.name}: ${money(i.price)}`), `Estimated total: ${money(totalFor(state.items))}`, 'Concept prices only, before tax or delivery.'].join('\n');
  try { await navigator.clipboard.writeText(text); $('#save-message').textContent = 'Kit list copied. Ready to share with your team.'; }
  catch { const area=$('#copy-fallback');area.value=text;area.hidden=false;area.focus();area.select();let copied=false;try{copied=document.execCommand('copy');}catch{}if(copied){area.hidden=true;$('#copy-kit').focus();}$('#save-message').textContent=copied?'Kit list copied. Ready to share with your team.':'Your kit list is selected below. Copy it with your usual keyboard or touch controls.'; }
});
drawUI();

function createRoom() {
  const canvas = $('#room-canvas');
  const host = $('#scene-wrap');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, .1, 80);
  const context = canvas.getContext('webgl2', { antialias: true, alpha: true });
  const vectorMode = !context;
  const renderer = context ? new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: true }) : new SVGRenderer();
  if (vectorMode) {
    Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.insertBefore(renderer.domElement, canvas);
    canvas.style.position = 'relative';
    renderer.setQuality('high');
    renderer.setPrecision(2);
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8));
  if (!vectorMode) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  scene.add(vectorMode ? new THREE.AmbientLight('#b0b0b0') : new THREE.HemisphereLight(0xfff9ee, 0x79766f, 2.5));
  const sun = new THREE.DirectionalLight(0xfff5df, vectorMode ? .82 : 3.6);
  sun.position.set(3, 8, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .5, far: 22 });
  sun.shadow.normalBias = .035; sun.shadow.bias = -.0002;
  sun.shadow.radius = 4; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xe8f0fc, vectorMode ? .22 : .9); fill.position.set(-4, 4, -1); scene.add(fill);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.ShadowMaterial({ color: 0x506042, opacity: .13 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.19; shadow.receiveShadow = true; if (!vectorMode) scene.add(shadow);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .09; controls.enablePan = false;
  controls.minDistance = 5.8; controls.maxDistance = 14;
  controls.minPolarAngle = .05; controls.maxPolarAngle = Math.PI / 2.17;
  controls.target.set(0, .65, 0);
  camera.position.set(7.6, 6.5, 8.1);
  let model, root, backWall, leftWall, groups = {}, accentMaterials = [], activeView = 'room', transition = null, needsRender = true;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rebuild() {
    if (root) {
      scene.remove(root);
      const materials = new Set();
      root.traverse(object => { object.geometry?.dispose(); if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material)); });
      materials.forEach(material => material.dispose());
    }
    model = makeRoomModel({ kind: state.room, color: currentColor().hex, vectorMode });
    ({ root, backWall, leftWall, groups, accentMaterials } = model);
    scene.add(root);
    controls.minDistance = model.minDistance;
    controls.maxDistance = model.maxDistance;
    update();
    view(activeView);
  }
  function update() {
    for (const [id, group] of Object.entries(groups)) group.visible = state.items.includes(id);
    for (const material of accentMaterials) material.color.set(currentColor().hex);
    model?.setSelection(state.items);
    needsRender = true;
  }
  function view(name) {
    activeView = name;
    const view = model.views[name] ?? model.views.room;
    if (reducedMotion) { camera.position.set(...view.pos); controls.target.set(...view.target); controls.update(); needsRender = true; return; }
    transition = { from: camera.position.clone(), to: new THREE.Vector3(...view.pos), fromTarget: controls.target.clone(), toTarget: new THREE.Vector3(...view.target), start: performance.now() };
    needsRender = true;
  }
  controls.addEventListener('start',()=>{transition=null;});
  controls.addEventListener('change',()=>{needsRender=true;});
  function rotate(amount){transition=null;const delta=camera.position.clone().sub(controls.target);delta.applyAxisAngle(new THREE.Vector3(0,1,0),amount);camera.position.copy(controls.target).add(delta);controls.update();}
  function zoom(factor){transition=null;const delta=camera.position.clone().sub(controls.target);delta.multiplyScalar(factor);delta.clampLength(controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(delta);controls.update();}
  $('#rotate-left').addEventListener('click',()=>rotate(-.28)); $('#rotate-right').addEventListener('click',()=>rotate(.28));
  $('#zoom-in').addEventListener('click',()=>zoom(.85)); $('#zoom-out').addEventListener('click',()=>zoom(1.17));
  $('#reset-view').addEventListener('click',()=>{view('room');$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='room')));});
  canvas.addEventListener('keydown',event=>{const actions={ArrowLeft:()=>rotate(-.15),ArrowRight:()=>rotate(.15),'+':()=>zoom(.9),'=':()=>zoom(.9),'-':()=>zoom(1.1),Home:()=>view('room')};if(actions[event.key]){event.preventDefault();actions[event.key]();}});
  const raycaster=new THREE.Raycaster();let pointerStart;
  canvas.addEventListener('pointerdown',event=>{pointerStart=[event.clientX,event.clientY];});
  canvas.addEventListener('pointerup',event=>{
    if(!pointerStart||Math.hypot(event.clientX-pointerStart[0],event.clientY-pointerStart[1])>6)return;
    const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1),camera);
    const visible=Object.values(groups).filter(g=>g.visible);const hit=raycaster.intersectObjects(visible,true)[0];if(hit){let object=hit.object;while(object&&!object.userData.item)object=object.parent;if(object)focusItem(object.userData.item);}
  });
  const observer=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.zoom=camera.aspect<1?.82:1;camera.updateProjectionMatrix();needsRender=true;});observer.observe(host);
  rebuild();controls.update();
  let lastFrame=0;
  let frameHandle;
  function renderFrame(time){
    frameHandle=requestAnimationFrame(renderFrame);
    if(document.hidden)return;
    if(time-lastFrame<(vectorMode?45:25))return;lastFrame=time;
    if(transition){const t=Math.min(1,(time-transition.start)/600),ease=1-Math.pow(1-t,3);camera.position.lerpVectors(transition.from,transition.to,ease);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,ease);if(t===1)transition=null;}
    const changed=controls.update();
    // Hide walls from the outside so the room remains a usable 360-degree cutaway.
    backWall.visible=camera.position.z>-.8;leftWall.visible=camera.position.x>-.8;
    if(changed||transition||needsRender){renderer.render(scene,camera);if(vectorMode)renderer.domElement.style.backgroundColor='transparent';needsRender=false;}
  }
  frameHandle=requestAnimationFrame(renderFrame);
  canvas.dataset.renderStatus='ready';$('#scene-loading').classList.add('loaded');$('#scene-loading').setAttribute('aria-hidden','true');
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frameHandle);observer.disconnect();controls.dispose();renderer.dispose?.();},{once:true});
  return {update,rebuild,view};
}

try { room3d=createRoom(); }
catch(error){ console.error('Room preview failed:',error);$('#room-canvas').dataset.renderStatus='error';$('#scene-loading').textContent='The 3D preview needs WebGL. Try another browser; you can still build your kit below.'; }

if (embedded) {
  const reportHeight = () => tellParent('dormdrop:height', {height:Math.ceil($('main').getBoundingClientRect().height)});
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'dormdrop:init') return;
    const next = sanitize(event.data.payload);
    const layoutChanged = next.room !== state.room;
    state = next;
    embeddedInitialized = true;
    if (layoutChanged) room3d?.rebuild();
    update();
    reportHeight();
  });
  const layoutObserver = new ResizeObserver(reportHeight);
  layoutObserver.observe($('main'));
  window.addEventListener('pagehide', () => layoutObserver.disconnect(), {once:true});
  tellParent('dormdrop:ready');
}
