/** Equipment canon v1. Signature issue is authored, never ordinary random stock. */
import type { Item, RegionId, WeaponSpec } from './types';
export type Acquisition='found'|'gifted'|'authorized'|'looted'|'surrendered';
export interface CanonEquipment extends WeaponSpec {name:string;kind:Item['kind'];rarity:Item['rarity'];effect:string;lore:string;value:number;sourceRegion:RegionId;damage?:string;owner:string;load:number;storyOnly:true}
const gun=(name:string,owner:string,sourceRegion:RegionId,weaponFamily:NonNullable<WeaponSpec['weaponFamily']>,ammoType:WeaponSpec['ammoType'],magSize:number,damage:string,ap:number,rangeBand:NonNullable<WeaponSpec['rangeBand']>,lore:string,load=2):CanonEquipment=>({name,owner,sourceRegion,weaponFamily,ammoType,magSize,mag:magSize,damage,ap,rangeBand,accuracy:rangeBand==='long'?2:1,recoil:weaponFamily==='energy'?0:2,kind:'weapon',rarity:'Legendary',effect:`${damage} · AP ${ap}. ${ammoType??'Mechanical close defense'}.`,lore,load,value:4200,storyOnly:true});
const key=(name:string,owner:string,sourceRegion:RegionId,lore:string,load=0):CanonEquipment=>({name,owner,sourceRegion,lore,effect:lore,kind:'special',rarity:'Legendary',value:0,load,storyOnly:true});
export const CANON_EQUIPMENT:CanonEquipment[]=[
 gun('Last Receipt','travis','ironclad','rifle','.45-70',4,'1d12+1',2,'mid','Travis rebuilt a manual .45-70 hunting action. Brass loops, peep sight, no remote permission.',3),
 gun("Hound's Tooth",'gravenor','ironclad','sniper','.50',3,'2d8',3,'long','Gravenor’s convoy-defense rifle. The Ashen Pack range cards and living witness matter as much as its serial.',4),
 gun('True North','thessaly','blackspire','sniper','survey',4,'1d12',2,'long','Thessaly’s survey rifle exposes structural weaknesses. Her original report warned against extraction.',3),
 gun('The Balance','valdris','slagtown','melee',undefined,0,'2d6',2,'close','An industrial thermal maul. Valdris is a human survivor of the furnace disaster, not a revenant.',3),
 gun('Gate Spear','warden','veyra','melee',undefined,0,'1d10+1',2,'close','Captain Mara Thorne’s electromagnetic boundary-defense polearm. The Warden is a human pilot.',3),
 gun('Ridge Glass','lyra','veyra','sniper','.338',4,'1d12+1',3,'long','LYRA-4: suppressed .338 Lapua, four rounds. A recovered optic cannot replace Lyra’s testimony.',3),
 gun('Mast Knife','lyra','veyra','melee',undefined,0,'1d6',0,'close','Lyra’s flat-black cable knife.',1),
 gun('Manifest','vera','veyra','rifle','6.8',30,'1d10+1',1,'mid','VERA-3: 6.8x51, thirty rounds, mechanical counter. Controlled Vesper supply.'),
 gun('Warrant Spike','vera','veyra','melee',undefined,0,'1d8',1,'close','A physical authorization interface. Possession alone does not confer Vera’s lawful authority.',1),
 gun('Bulkhead Twelve','drake','veyra','shotgun','12g-magnum',5,'2d6',2,'close','DRAKE-6: five-round boxes of 12-gauge 3-inch magnum. Ordinary pump shells are incompatible.',3),
 gun('Second Knock','drake','veyra','melee',undefined,0,'1d10+1',2,'close','Drake’s powered breaching maul. Loud entry can close a diplomatic route.',3),
 gun('Halo Lance','orion','veyra','energy','violet-plasma',6,'2d8',2,'mid','ORION-7: six-shot violet plasma. Laser capacitors do not fit.'),
 gun("Seven's Cestus",'orion','veyra','melee',undefined,0,'1d10+1',1,'close','Orion’s powered gauntlet. Hardware does not confer its owner’s judgment.',1),
 gun('Clause','kane','veyra','pistol','10mm',8,'1d8',1,'close','Kane’s executive sidearm. Her Black Key carries greater power.',1),
 gun('Redaction','reeve','veyra','smg','5.7',20,'1d8',1,'close','Reeve’s suppressed compact intelligence PDW.'),
 gun('Pale Horse','vale','veyra','rifle','8.6',10,'1d12+1',2,'mid','Marshal Iona Vale’s coil-assisted battle rifle still fires a physical projectile.',3),
 gun('Command Pike','vale','veyra','melee',undefined,0,'1d10',2,'close','Vale’s collapsible electro-mechanical command polearm.',3),
 key('Deadman Key','travis','ironclad','T-0880 maintenance access preserved by Travis. Required for the rebuild.'),
 key('Black Key','kane','veyra','Emergency Vesper authority made physical. Its power is settled at convergence.'),
 key('Bottom Key','sink','brasswater','Recovered CIVITAS navigation data. Its use depends on the archive containment decision.'),
 key('Tithe Keys','valdris','slagtown','Physical furnace gate, conveyor and coolant authorization.'),
 key('Grey Credentials','reeve','veyra','Recovery warrants linking black-tag routes to Reeve’s authority.'),
 key('Violet Crown','orion','veyra','Orion’s predictive logs and command authentication. Living cooperation remains necessary.'),
 key('Black-tag Ledger','gravenor','ironclad','Aid routes reused to identify resistant settlements. Reeve’s codes repeat.'),
 key('T-0880 Shutdown Order','travis','ironclad','Recall, wipe and disposal orders. Travis signed for scrap that did not exist.'),
 key('Original Survey','thessaly','blackspire','Thessaly’s STOP EXTRACTION report beside Reeve’s altered version.'),
 key('Continuity Charter','sink','brasswater','The original limits on emergency authority. Humans granted CIVITAS sovereign override.'),
 key('Grey Guitar Recording','tyrone','ironclad','A bad recording Tyrone refused to delete. A memory, a person, a continuity test.'),
 key('AEGIS Servo Ring','lyra','ironclad','Recovered regional hardware reserved for Bay 13.',4),
 key('Helios Thermal Regulator','valdris','slagtown','Furnace thermal regulator for Tyrone’s rebuild.',4),
 key('Blackglass Cognition Lattice','thessaly','blackspire','Memory-routing hardware, never a personality replacement.',4),
];
export const canonEquipment=(name:string)=>CANON_EQUIPMENT.find(row=>row.name===name);
export function canonItem(name:string,id:string,acquisition:Acquisition,day:number):Item{
 const row=canonEquipment(name);if(!row)throw Error(`Unknown canonical item: ${name}`);
 return {...row,id,condition:acquisition==='looted'?'Damaged':'Worn',slot:row.kind==='weapon'?'weapon':undefined,discoveredDay:day,tags:['canon:v3','unique',`owner:${row.owner}`,`acquisition:${acquisition}`,`load:${row.load}`]};
}
