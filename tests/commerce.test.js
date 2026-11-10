import test from 'node:test';
import assert from 'node:assert/strict';
import {PACKAGES,makeInitial,normalizeState,baseItems,orderItems,totalFor,createOrder,importPlan,sharedSnapshot,validDate} from '../commerce.js';

test('the three fixed kits remain independent from a saved custom room', () => {
  const state=makeInitial({items:['bottle'],color:'blue',room:'dorm'});
  state.mode='package';
  assert.deepEqual(PACKAGES.map(p=>p.id),['night','week','all']);
  for (const [id,total] of [['night',132],['week',183],['all',239]]) {
    state.packageId=id;
    assert.equal(totalFor(orderItems(state)),total);
  }
  state.mode='custom';
  assert.deepEqual(baseItems(state),['bottle']);
  assert.equal(state.custom.color,'blue');
});

test('a shared plan only removes a selected fan or rug when applied', () => {
  const state=makeInitial();state.mode='package';state.packageId='all';
  state.planner.assignments={fan:'roommate',rug:'have',cleaning:'mine',dishes:'mine',snacks:'mine'};
  assert.equal(totalFor(orderItems(state)),239);
  assert.equal(totalFor(orderItems(state,true)),197);
  state.planner.applied=true;
  assert.equal(totalFor(orderItems(state)),197);
  assert.deepEqual(orderItems(state).filter(id=>!['fan','rug'].includes(id)),baseItems(state).filter(id=>!['fan','rug'].includes(id)));
  state.planner.applied=false;
  assert.equal(totalFor(orderItems(state)),239);
});

test('confirmed orders keep their own items, price, pickup and plan', () => {
  const state=makeInitial();state.mode='custom';state.custom={room:'dorm',color:'blue',items:['bedding','towels']};
  state.name='Moritz';state.planner.names=['Linnea'];state.pickup={room:'dorm',point:'halls',date:'2027-09-14',window:'15'};
  const order=createOrder(state);
  assert.match(order.id,/^DD-\d{6}$/);assert.equal(order.total,87);
  state.custom.items.push('fan');state.planner.names.push('Emil');state.pickup.date='2027-09-15';state.name='Other';
  assert.deepEqual(order.items,['bedding','towels']);assert.deepEqual(order.plan.names,['Linnea']);assert.equal(order.pickup.date,'2027-09-14');assert.equal(order.name,'Moritz');
  const restored=normalizeState({...state,order:{...order,total:9999}});
  assert.equal(restored.order.total,87);
});

test('new accent colors and storage extras survive checkout and saved-order reload', () => {
  for(const color of ['purple','pink']) {
    const state=normalizeState({...makeInitial(),mode:'custom',custom:{room:'dorm',color,items:['shoe-rack','closet-organizer']}});
    assert.equal(state.custom.color,color);
    assert.deepEqual(baseItems(state),['shoe-rack','closet-organizer']);
    const order=createOrder(state);
    assert.equal(order.total,42);
    assert.equal(order.color,color);
    const restored=normalizeState({...state,order});
    assert.deepEqual(restored.order.items,['shoe-rack','closet-organizer']);
    assert.equal(restored.order.color,color);
    assert.equal(restored.order.total,42);
  }
});

test('empty kits and invalid pickup dates cannot create demo orders', () => {
  const state=makeInitial();state.mode='custom';
  assert.throws(()=>createOrder(state),/at least one item/);
  state.custom.items=['bedding'];state.pickup.date='2027-02-30';
  assert.equal(validDate(state.pickup.date),false);assert.throws(()=>createOrder(state),/pickup details/);
});

test('restoring malformed state drops unknown products and unsafe values', () => {
  const state=normalizeState({mode:'custom',custom:{items:['bedding','bedding','unknown'],color:'invalid',room:'shared'},planner:{names:['\u0000Linnea'],assignments:{fan:'invalid',rug:'roommate',unknown:'mine'},applied:true},pickup:{date:'invalid',point:'invalid',window:'invalid'}});
  assert.deepEqual(baseItems(state),['bedding']);assert.equal(state.custom.room,'dorm');assert.equal(state.custom.color,'forest');
  assert.deepEqual(state.planner.names,['Linnea']);assert.equal(state.planner.assignments.fan,'undecided');
  assert.equal(state.planner.assignments.unknown,undefined);assert.equal(validDate(state.pickup.date),true);
});

test('shared planner snapshots exclude the checkout name and order details', () => {
  const state=makeInitial();state.name='Private checkout name';state.order={id:'DD-123456'};state.planner.names=['Linnea'];
  const shared=JSON.parse(JSON.stringify(sharedSnapshot(state)));
  assert.deepEqual(Object.keys(shared).sort(),['assignments','names']);
  const imported=importPlan({...shared,applied:true,name:'Ignore this'});
  assert.deepEqual(imported.names,['Linnea']);assert.equal(imported.applied,false);assert.equal(imported.name,undefined);
});
