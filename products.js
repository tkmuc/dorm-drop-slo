import {ITEMS} from './catalog.js';

export const KIT_IMAGES={night:'./assets/kit-night.png',week:'./assets/kit-week.png',all:'./assets/kit-all.png'};
export const PRODUCT_NOTES={
  bedding:'A Twin XL sheet, pillow and comforter. Your first night starts with a bed you can actually fall into.',
  towels:'A bath towel and hand towel for the shower, the sink, and the everyday in between.',
  toiletries:'The everyday basics for freshening up after a long travel day.',
  charging:'A wall charger and cable to recharge your devices while you recharge yourself.',
  shower:'A caddy and shower shoes to make the walk down the hall a little easier.',
  lamp:'A focused little light for late-night reading, studying and settling in.',
  laundry:'A place for your laundry that is not the chair. Or the floor.',
  hangers:'Five wooden hangers to help turn a suitcase into a wardrobe.',
  bottle:'A refillable water bottle for campus days and your first adventures in SLO.',
  fan:'A compact desk fan for a little extra airflow. A good item to coordinate with a roommate.',
  rug:'A soft accent for your space. Talk to your roommate about shared floor space before doubling up.',
  storage:'A low storage box to tuck the little things away under your bed.',
  'shoe-rack':'Two compact bamboo shelves to keep your everyday shoes together and off the floor.',
  'closet-organizer':'Six hanging fabric shelves for folded clothes and the small things. Select it in the room builder to see the wardrobe open.'
};

export function productShot(id,extra=''){
  const index=ITEMS.findIndex(i=>i.id===id);
  if(index<0)return '';
  if(['shoe-rack','closet-organizer'].includes(id))return `<span class="product-shot product-shot-${id} ${extra}" aria-hidden="true"></span>`;
  return `<span class="product-shot ${extra}" style="--product-x:${(index%4)/3*100}%;--product-y:${Math.floor(index/4)/2*100}%" aria-hidden="true"></span>`;
}
