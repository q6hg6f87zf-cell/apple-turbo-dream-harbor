import {createFileRoute} from '@tanstack/react-router';
import {randomBytes} from 'node:crypto';
import {getSql} from '@/lib/db';
import {hollowVerifiedUser} from '@/lib/hollow-identity.server';
import {defaultState,forgeOperative} from '@/game/engine';
import {restoreNarrative} from '@/game/narrative-state';
import {authorityTemplateByKey,itemFromAuthorityTemplate} from '@/game/authority-items';
import {resolveScenarioApproach} from '@/game/scenario';
import {CANON_SCENARIOS} from '@/game/canon-campaign';
import {recordCanonBossDefeat} from '@/game/canon-combat';
import {commitCanonDecision} from '@/game/canon-commit';
import {REGION_LOCATION} from '@/game/arsenal';
import type {ClassName,Condition,RegionId} from '@/game/types';
const CAMPAIGN='moon-squad';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function load(userId:string){
 const sql=await getSql();const member=await sql`select 1 from hollow_campaign_member where campaign_id=${CAMPAIGN} and user_id=${userId}`;if(!member.length)return null;
 await sql`insert into hollow_canon_campaign(user_id) values(${userId}) on conflict do nothing`;
 let record=(await sql<{narrative:unknown;trust:number;revision:number}>`select narrative,trust,revision from hollow_canon_campaign where user_id=${userId}`)[0]!;
 // Reconcile authoritative casualties, never client-supplied victory claims.
 const victories=await sql<{region:RegionId}>`select distinct region from hollow_mission_ticket where campaign_id=${CAMPAIGN} and mission_kind='boss' and settled_at is not null and reward->>'kind'='boss'`;
 const state=defaultState();state.narrative=restoreNarrative(record.narrative);state.vault=[];state.operatives=[];
 const bosses:Record<RegionId,string>={ironclad:'gravenor',slagtown:'valdris',blackspire:'thessaly',brasswater:'sink',veyra:'warden'};
 for(const victory of victories)recordCanonBossDefeat(state,bosses[victory.region]);
 if(state.vault.length){const owner=(await sql<{resident_id:string}>`select resident_id from hollow_resident_progress where campaign_id=${CAMPAIGN} and created_by_user_id=${userId} order by created_at limit 1`)[0];if(owner){
  await commitCanonDecision(sql,{userId,residentId:owner.resident_id,revision:Number(record.revision),serialized:JSON.stringify(state.narrative),trust:record.trust,region:'',rewardJson:JSON.stringify(state.vault.map(i=>({id:randomBytes(16).toString('hex'),key:`${i.kind}:${i.name.toLowerCase()}`,condition:'Damaged',source:`canon:${userId}:casualty:${i.name}`,day:state.day})))});
  record=(await sql<typeof record>`select narrative,trust,revision from hollow_canon_campaign where user_id=${userId}`)[0]!;
 }}return record;
}
export const Route=createFileRoute('/api/hollow/canon')({server:{handlers:{
 GET:async({request})=>{const identity=hollowVerifiedUser(request);if(identity.response)return identity.response;const r=await load(identity.userId);return r?json({narrative:restoreNarrative(r.narrative),trust:r.trust,revision:Number(r.revision)}):json({error:'Link your campaign first.'},404);},
 POST:async({request})=>{
  const identity=hollowVerifiedUser(request);if(identity.response)return identity.response;const userId=identity.userId;
  let body:Record<string,unknown>;try{body=await request.json();if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{return json({error:'Invalid JSON.'},400);}
  const scenarioId=String(body.scenarioId??''),approachId=String(body.approachId??'');const scene=CANON_SCENARIOS.find(s=>s.id===scenarioId);const approach=scene?.approaches.find(a=>a.id===approachId);if(!scene||!approach)return json({error:'Unknown campaign choice.'},400);
  const record=await load(userId);if(!record)return json({error:'Link your campaign first.'},404);const sql=await getSql();
  const resident=(await sql<{resident_id:string;display_name:string;class_key:ClassName}>`select resident_id,display_name,class_key from hollow_resident_progress where campaign_id=${CAMPAIGN} and created_by_user_id=${userId} order by created_at limit 1`)[0];if(!resident)return json({error:'Create your resident first.'},409);
  const open=await sql`select 1 from hollow_mission_ticket where campaign_id=${CAMPAIGN} and user_id=${userId} and settled_at is null and expires_at>now()`;if(open.length)return json({error:'Finish or extract from your current mission first.'},409);
  const campaign=(await sql<{campaign_day:number;region_intel:Partial<Record<RegionId,number>>}>`select campaign_day,region_intel from hollow_campaign_state where campaign_id=${CAMPAIGN}`)[0];
  const state=defaultState();state.started=true;state.day=campaign?.campaign_day??1;state.narrative=restoreNarrative(record.narrative);state.tyrone.relationship.trust=record.trust;
  const op=forgeOperative({name:resident.display_name,cls:resident.class_key,race:'Human',lineage:'',origin:'Ironclad',day:state.day});op.id=resident.resident_id;op.inventory=[];state.operatives=[op];state.vault=[];
  for(const [region,loc] of Object.entries(REGION_LOCATION))state.locations[loc].intel=campaign?.region_intel?.[region as RegionId]??0;
  const items=await sql<{instance_id:string;template_key:string;condition:Condition;discovered_day:number}>`select instance_id,template_key,condition,discovered_day from hollow_item_instance where campaign_id=${CAMPAIGN} and (owner_user_id=${userId} or (owner_type='vault' and source_event like ${`canon:${userId}:%`})) and destroyed_at is null`;
  for(const row of items){const t=authorityTemplateByKey(row.template_key);if(t)op.inventory.push(itemFromAuthorityTemplate(t,row.instance_id,{condition:row.condition,discoveredDay:row.discovered_day}));}
  const prior=state.narrative.beats[scenarioId];if(prior?.status==='done')return prior.choiceId===approachId?json({narrative:state.narrative,trust:record.trust,revision:Number(record.revision),duplicate:true}):json({error:'That decision is already recorded.'},409);
  const result=resolveScenarioApproach(state,scenarioId,approachId);if(!result)return json({error:'Required evidence, field Intel or earlier decisions are missing.'},409);
  const region=Object.entries(REGION_LOCATION).find(([,loc])=>loc===approach.clearRegion)?.[0]??'';
  const committed=await commitCanonDecision(sql,{userId,residentId:resident.resident_id,revision:Number(record.revision),serialized:JSON.stringify(state.narrative),trust:state.tyrone.relationship.trust,region,rewardJson:JSON.stringify(state.vault.map(i=>({id:randomBytes(16).toString('hex'),key:`${i.kind}:${i.name.toLowerCase()}`,condition:i.condition,source:`canon:${userId}:${scenarioId}:${i.name}`,day:state.day})))});
  if(!committed.length)return json({error:'Another session changed this campaign. Reopen the situation before choosing.'},409);
  return json({narrative:state.narrative,trust:state.tyrone.relationship.trust,revision:Number(committed[0].revision),toast:result.toast});
 }
}}});
