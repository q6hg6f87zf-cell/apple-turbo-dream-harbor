import {useEffect} from 'react';
import {useGame,applyCanonSnapshot} from '@/game/store';
import {fetchCanon} from '@/game/server-canon';
import {isSnowflake} from '@/game/discord';
export function CanonCampaignRuntime(){const id=useGame(g=>g.s.discordId);useEffect(()=>{if(!id||!isSnowflake(id))return;let cancelled=false;void fetchCanon().then(s=>{if(s&&!cancelled)applyCanonSnapshot(s);}).catch(()=>{});return()=>{cancelled=true;};},[id]);return null;}
