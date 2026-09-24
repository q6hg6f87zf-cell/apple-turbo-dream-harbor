import type {Sql} from '../lib/db';
export interface CanonCommit {userId:string;residentId:string;revision:number;serialized:string;trust:number;region:string;rewardJson:string}
/** One statement: a raced request cannot award an item without its decision. */
export async function commitCanonDecision(sql:Sql,input:CanonCommit){
 const {userId,residentId,revision,serialized,trust,region,rewardJson}=input;
 return sql<{revision:number}>`with saved as (
 update hollow_canon_campaign set narrative=${serialized}::jsonb,trust=${trust},revision=revision+1,updated_at=now() where user_id=${userId} and revision=${revision} returning revision
 ), progressed as (
 update hollow_campaign_state set boss_clears=jsonb_set(boss_clears,array[${region}]::text[],'true'::jsonb,true),revision=revision+1 where campaign_id='moon-squad' and ${region}<>'' and exists(select 1 from saved) returning campaign_id
 ), awarded as (
 insert into hollow_item_instance(instance_id,campaign_id,template_key,owner_type,owner_user_id,owner_resident_id,equipped,condition,source_event,discovered_day)
 select r.id,'moon-squad',r.key,'resident',${userId},${residentId},false,r.condition,r.source,r.day from jsonb_to_recordset(${rewardJson}::jsonb) as r(id text,key text,condition text,source text,day integer),saved
 on conflict(campaign_id,source_event) do nothing returning instance_id
 ) select revision from saved`;
}
