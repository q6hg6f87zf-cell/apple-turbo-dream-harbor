# Canon v3 campaign and equipment restoration

Base: `ef95da0`, the exact source snapshot audited by the supplied Arsenal / Inventory / Equipment Canon v1. The Historical Canon v3 and the prior implementation record guide this reconstructed branch. This is a new implementation commit, not the unavailable original `1ddaba5`.

## Assessment and changes

The source had strong maps, art, character presentation, server-owned inventory and weapon-condition helpers. The main gaps were duplicated weapon models, fantasy loot, obsolete T-0888 identity copy, combat that did not spend ammunition, scenario rewards before success and automatic dawn endings.

- Fifteen authored encounters connect Bay 13, the courier delivery, Gravenor, Lyra, Valdris, Thessaly, Tyrone’s rebuild, the Sink, Vera, Orion, the boundary, Drake, Vale, Soren and convergence. Regional Intel gates require fieldwork between acts.
- Six earned endings: Directorate, Civic Restoration, Free Hollow Coalition, Quiet Earth, Porchlight Accord and CIVITAS Return. Living witnesses, evidence, regional decisions and consent determine availability.
- T-0888 is the same one-wheeled Tyrone after a consensual rebuild, not a second robot or the casino. The Deadman Key, servo ring, thermal regulator and cognition lattice gate the rebuild. The guitar recording tests memory continuity.
- Signature weapons have canonical owners, chambering and magazines. Plasma, laser capacitors and magnum shotgun shells remain incompatible. Ordinary guns use one base model rather than regional clones; active field/treasure pools exclude retired fantasy equipment.
- A read-only equipment archive preserves previously issued server-owned items without returning them to random loot.
- Strikes spend ammunition; broken weapons cannot fire. Aim costs a turn and grants +3 accuracy/+1 AP. Deliberate reloads cost a turn; emergency reloads incur the existing rushed penalty. Tyrone’s support heals and disrupts sensors once per fight after the rebuild.
- Boss attacks telegraph every third round; guard disrupts their accuracy advantage. Tithe Keys mitigate Valdris’ prepared pressure. BB boss damage is capped. Healing cannot consume ammunition boxes.
- A 12-point load budget penalizes excess equipment. Combat displays load and accuracy penalty. Local ammunition expenditure survives ownership-cache refreshes.
- Killed witnesses remain dead and yield damaged equipment. Failed checks award no success flags; repeat approaches cannot farm rewards; combat approaches award success only after victory.
- The opening Kane speech is a manually advanced canonical transcript pending new recording. Existing audio/video assets, map art and shell remain in place. Dossiers reflect human AEGIS pilots, postwar couriers and the CIVITAS/SHEPHERD distinction.

## Persistence

Migration `0018_canon_campaign.sql` stores signed-in personal narrative, trust and revision. The authenticated campaign endpoint uses server-owned Intel, registered residents and inventory. It accepts choice IDs, never client reward lists or flags. One compare-and-swap SQL statement commits the decision, regional access and equipment together. Concurrent attempts cannot duplicate rewards. Settled server boss victories reconcile permanent casualties on campaign reads/choices. Stale responses cannot replace newer story revisions.

Combat and ammunition remain per-client saved simulation state. Personal story choices coexist with shared regional access, matching the existing architecture; coordinated multiplayer story arbitration is not implemented.

## Verification and release limits

The branch includes full-route tests for all six endings, serialization, evidence/casualty/replay gates, load, ammunition, aim, support and healing selection. An embedded PostgreSQL test applies all migrations and exercises the production transaction under concurrent requests and failed grants.

Browser verification remains blocked in this environment: Chromium downloads are truncated and the all-interface dev server fails while enumerating network interfaces. No desktop/mobile visual pass is claimed. Production has not been deployed and its database has not been migrated.

This restores the substantive campaign/gameplay pass, not every paragraph of the PDFs. Multi-stage signature upgrade trees, new weapon artwork, complete Reeve/Kane acquisition paths, rig-specific load bonuses, a fully revised crafting economy and fresh voice recording remain follow-up work. Legacy class names and some incidental dialogue remain for compatibility.
