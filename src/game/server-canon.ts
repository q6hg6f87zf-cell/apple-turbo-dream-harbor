import {getBearerToken} from '@/lib/auth/client';
import type {NarrativeState} from './narrative-state';
export interface CanonSnapshot{narrative:NarrativeState;trust:number;revision:number;toast?:string;error?:string}
export async function fetchCanon(scenarioId?:string,approachId?:string):Promise<CanonSnapshot|null>{
 const headers=new Headers({'content-type':'application/json'});const token=getBearerToken();if(token)headers.set('Authorization',`Bearer ${token}`);
 const response=await fetch('/api/hollow/canon',{method:scenarioId?'POST':'GET',credentials:'same-origin',headers,...(scenarioId?{body:JSON.stringify({scenarioId,approachId})}:{})});
 if(!scenarioId&&[401,404].includes(response.status))return null;const body=await response.json() as CanonSnapshot;if(!response.ok)throw Error(body.error??'Campaign could not be saved.');return body;
}
