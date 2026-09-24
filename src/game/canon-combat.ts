import {canonItem,canonEquipment} from './canon-equipment';
import {addJournal,ensureNarrative} from './narrative-state';
import type {GameState,Item,Operative} from './types';
const BOSSES:Record<string,{scene:string;grants:string[]}>= {
 gravenor:{scene:'hound',grants:["Hound's Tooth",'Black-tag Ledger','AEGIS Servo Ring']},valdris:{scene:'furnace',grants:['The Balance','Tithe Keys','Helios Thermal Regulator']},thessaly:{scene:'survey',grants:['True North','Original Survey','Blackglass Cognition Lattice']},sink:{scene:'archive',grants:['Continuity Charter']},warden:{scene:'boundary',grants:['Gate Spear']},
};
export function recordCanonBossDefeat(state:GameState,boss:string){
 const row=BOSSES[boss];if(!row)return;const n=ensureNarrative(state);const id=`canon_${row.scene}`;if(n.beats[id]?.status==='done')return;
 n.beats[id]={id,status:'done',choiceId:boss==='sink'?'destroy':'killed',day:state.day};
 for(const name of row.grants)if(![state.vault,...state.operatives.map(op=>op.inventory??[])].some(bag=>bag.some(i=>i.name===name)))state.vault.push(canonItem(name,`canon-boss-${boss}-${name}`,'looted',state.day));
 addJournal(state,{id:`canon-death-${boss}`,act:n.act,title:'Hardware without a witness',body:boss==='sink'?'The flood-control shard is destroyed. Its records survive, its bounded navigation model does not.':'Damaged equipment was recovered. Repair restores hardware, never the person. This owner cannot testify or join your coalition.',tags:['canon','consequence',boss]});
}
export const tyroneRebuilt=(s:GameState)=>s.narrative?.beats.canon_rebuild?.choiceId==='consent';
export function bossIntent(s:GameState){const c=s.combat;if(!c)return '';if(c.reckoning)return 'The fight has reached its final words.';return c.bossId?(c.turn%3===0?'Prepared attack: the firing solution is ready. Guard now to disrupt it.':'The enemy is preparing a firing solution. Every third round, guard against the telegraphed attack.'):'Check range and ammunition. Aim trades a turn for accuracy and armor penetration.';}
export function itemLoad(item:Item){const canon=canonEquipment(item.name);if(canon)return canon.load;if(item.kind==='special')return 0;if(item.kind==='weapon')return item.weaponFamily==='sniper'||item.weaponFamily==='heavy'?3:item.weaponFamily==='pistol'||item.weaponFamily==='melee'?1:2;if(item.kind==='armor')return(item.defense??0)>=5?3:2;return item.ammoType?2:1;}
export function fieldLoad(op:Operative){const load=op.inventory.reduce((n,i)=>n+itemLoad(i),0);return{load,capacity:12,penalty:Math.min(4,Math.ceil(Math.max(0,load-12)/2))};}
export function trackSupplies<T>(s:GameState,op:Operative,action:()=>T):T{const before=op.inventory.filter(i=>i.ammoType);const result=action();s.combatSupplies??={};for(const i of before){const live=op.inventory.find(x=>x.id===i.id);s.combatSupplies[i.id]=live?{mag:live.mag,ammoCount:live.ammoCount,loadAp:live.loadAp,loadDamage:live.loadDamage,loadAccuracy:live.loadAccuracy}:{ammoCount:0};}return result;}
export const restoreSupplies=(s:GameState,item:Item):Item=>({...item,...s.combatSupplies?.[item.id]});
