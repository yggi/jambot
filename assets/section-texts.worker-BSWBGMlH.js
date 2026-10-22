(function(){function e(e,t){let n=e.heights.length;return e.cycle*Math.floor(t/n)+e.heights[u(t,n)]}function t(e,t){let{cycle:n,heights:r}=e,i=Math.floor((t-r[0])/n),a=t-i*n;return r.length*i+r.filter(e=>e<=a).length-1}function n(e,n){return t(e,n-1)+1}function r(r,i){let a=t(r,i),o=n(r,i);return i-e(r,a)<=e(r,o)-i?a:o}function i(e,t){return u(e,t)}function a(e,t,n){let r=n-u(n-e,t);return n-r<=r+t-n?r:r+t}function o(e){return e.heights.map(t=>i(t,e.cycle)).sort((e,t)=>e-t)}function s(e,t){return{cycle:e.cycle,heights:e.heights.map(e=>e+t)}}function c(t){return t.heights.map((n,r)=>e(t,r+1)-e(t,r))}function l(t,n){if(t.cycle!==n.heights.length)throw Error(`compose: the inner helix has cycle ${t.cycle}, but the outer has ${n.heights.length} degrees`);return{cycle:n.cycle,heights:t.heights.map(t=>e(n,t))}}function u(e,t){return(e%t+t)%t}function d(e,t,n=0){let r=[];for(let n=0;n<t;n++)n*e%t<e&&r.push(n);return s({cycle:t,heights:r},n)}function f(e,t){for(let n=0;n<t;n++)if(u(n*e,t)===u(1,t))return n;throw Error(`generator: ${e} and ${t} are not coprime, so ${e} of ${t} has no generator`)}let p={"2nd":`second`,"3rd":`third`,"4th":`fourth`,"5th":`fifth`,"6th":`sixth`,"7th":`seventh`,"9th":`ninth`,"11th":`eleventh`,"13th":`thirteenth`},m={maj:`major`,min:`minor`,dim:`diminished`,aug:`augmented`,dom:`dominant`,sus:`suspended`,alt:`altered`,pent:`pentatonic`,harm:`harmonic`,mel:`melodic`,phryg:`phrygian`,mixolyd:`mixolydian`},h=/(?:^| )(♭|flat|♯|sharp|♮|natural) ?(?=\d)/g,g={"♭":`b`,flat:`b`,"♯":`#`,sharp:`#`,"♮":`n`,natural:`n`};function _(e){return e.toLowerCase().replace(/\./g,` `).replace(/[\s_-]+/g,` `).trim().replace(h,(e,t)=>e.startsWith(` `)?` ${g[t]}`:g[t]).split(` `).map(e=>p[e]??m[e]??e).join(` `)}function v(t,n){return[...new Set(t.heights.map((r,i)=>e(t,i+n)-e(t,i)))].sort((e,t)=>e-t)}let y=d(7,12);v(y,0),v(y,1),v(y,2),v(y,3),v(y,4),v(y,5);function b(e){return Math.round(12*Math.log2(e))}let x=(e,t,n)=>({stack:e,symbols:t,words:n}),S={major:x([0,4,7],[``,`maj`,`M`],[`major`,`major triad`]),minor:x([0,3,7],[`m`,`min`,`-`],[`minor`,`minor triad`]),diminished:x([0,3,6],[`dim`,`°`,`o`],[`diminished`,`diminished triad`]),augmented:x([0,4,8],[`aug`,`+`],[`augmented`,`augmented triad`]),sus2:x([0,2,7],[`sus2`],[`suspended second`]),sus4:x([0,5,7],[`sus4`,`sus`],[`suspended fourth`,`suspended`]),5:x([0,7],[`5`],[`power chord`,`power`]),6:x([0,4,7,9],[`6`,`maj6`],[`sixth`,`major sixth`]),m6:x([0,3,7,9],[`m6`,`min6`,`-6`],[`minor sixth`]),7:x([0,4,7,10],[`7`,`dom7`,`Mm7`],[`seventh`,`dominant seventh`,`dominant`]),maj7:x([0,4,7,11],[`maj7`,`M7`,`Δ`,`Δ7`,`ma7`,`MM7`],[`major seventh`]),m7:x([0,3,7,10],[`m7`,`min7`,`-7`,`mm7`],[`minor seventh`]),mMaj7:x([0,3,7,11],[`mMaj7`,`m(maj7)`,`mM7`,`minMaj7`],[`minor major seventh`]),m7b5:x([0,3,6,10],[`m7b5`,`m7♭5`,`ø`,`ø7`,`min7b5`,`-7b5`],[`half diminished`,`half diminished seventh`]),dim7:x([0,3,6,9],[`dim7`,`°7`,`o7`],[`diminished seventh`]),9:x([0,4,7,10,14],[`9`,`dom9`],[`ninth`,`dominant ninth`]),maj9:x([0,4,7,11,14],[`maj9`,`M9`,`Δ9`],[`major ninth`]),m9:x([0,3,7,10,14],[`m9`,`min9`,`-9`],[`minor ninth`]),add9:x([0,4,7,14],[`add9`],[`add nine`,`added ninth`]),harmonics:x([1,2,3,4,5].map(b),[],[`harmonics`,`harmonic series`])};function C(e,t=12){if(e.length===0||e.some((t,n)=>n>0&&t<=e[n-1]))return;let n=e[0]+t;return{helix:{cycle:t,heights:e.filter(e=>e<n)},tensions:e.filter(e=>e>=n)}}function w(e){return[...e.helix.heights,...e.tensions]}let T=/* @__PURE__ */ new Map,E=/* @__PURE__ */ new Map,D=/* @__PURE__ */ new Map,O=(e,t,n)=>{e.has(t)||e.set(t,n)};for(let[e,t]of Object.entries(S)){for(let n of t.symbols)O(T,n,e),O(D,n.toLowerCase(),e);for(let n of t.words)O(E,_(n),e)}function k(e){let t=e.join();return Object.entries(S).find(([,e])=>e.stack.join()===t)?.[0]}function A(e){return u(e*f(7,12),12)}function j(t,n){return{cycle:t.cycle,heights:t.heights.map((r,i)=>e(t,i+n))}}function M(e){return e.heights.map((t,n)=>j(e,n))}function N(e){let t=e.heights[0];return e.heights.reduce((e,n)=>e+n-t,0)}let P=[`lydian`,`ionian`,`mixolydian`,`dorian`,`aeolian`,`phrygian`,`locrian`],ee=M(d(7,12)).map(t=>s(t,-e(t,0))).sort((e,t)=>N(t)-N(e));function F(e){return ee[P.indexOf(e)]}let I=[`C`,`D`,`E`,`F`,`G`,`A`,`B`],te=[0,1,1,2,2,3,4,4,5,5,6,6],ne=[0,1,1,1,3,3,3,4,5,5,6,6],re=F(`ionian`).heights;function ie(e){let t=e.map(t=>t-e[0]),n=t.slice(1).map((e,n)=>e-t[n]);if(n.length>0&&n.every(e=>e===3||e===4))return t.map((e,t)=>2*t);if(t.length===7&&t.every((e,t)=>Math.abs(e-re[t])<=2))return t.map((e,t)=>t);let r=ae(new Set(t.map(e=>u(e,12))));return t.map(e=>r.get(u(e,12))+7*Math.floor(e/12))}function ae(e){let t=e.has(4)?4:e.has(3)?3:void 0,n=e.has(7)?7:t===4&&e.has(8)?8:e.has(6)?6:void 0,r=/* @__PURE__ */ new Map([[0,0]]);t!==void 0&&r.set(t,2),n!==void 0&&r.set(n,4);let i=/* @__PURE__ */ new Set;for(let t of[...e].sort((e,t)=>e-t)){if(r.has(t))continue;let e=ne[t];i.has(e)&&(e=te[t]),r.set(t,e),i.add(e)}return r}function oe(e,t,n=ie(t)){let r=I.indexOf(e.letter);return t.map((i,a)=>{let o=r+n[a],s=u(e.pitchClass+i-t[0],12),c=re[u(o,7)],l=u(s-c,12);return l>6&&(l-=12),{letter:I[u(o,7)],alteration:l,pitchClass:s}})}function L(e,t){return s(t,e.heights[0]-t.heights[0])}function se(e,t){let{cycle:n}=e,r=e.heights[0],s=new Set(o(e)),c=e.heights.length,l=de(c,n)?f(c,n):1,u=i(r,n),d=-1/0;for(let e=0;e<n;e++){let a=o(L({cycle:n,heights:[e]},t)).filter(e=>s.has(e)).length,c=fe(e-r,l,n),f=a*4*n*n-c*2-(e===i(r,n)?0:1);f>d&&(d=f,u=e)}return L({cycle:n,heights:[a(u,n,r)]},t)}function ce(e){let t=i(e.heights[0],12),n=I.flatMap((e,n)=>[0,-1,1].filter(e=>i(le[n]+e,12)===t).map(n=>({letter:e,alteration:n,pitchClass:t}))),r=(e,t)=>oe(e,t).reduce((e,t)=>e+Math.abs(t.alteration),0),a=[...P.map(F),ue.harmonic,ue.melodic],o=n.map(t=>({tonic:t,inKey:r(t,e.heights),around:a.reduce((e,n)=>e+r(t,n.heights),0)}));return o.sort((e,t)=>e.inKey-t.inKey||e.around-t.around),o[0].tonic}let le=F(`ionian`).heights,ue={harmonic:{cycle:12,heights:[0,2,3,5,7,8,11]},melodic:{cycle:12,heights:[0,2,3,5,7,9,11]}};function de(e,t){return t===0?e===1:de(t,e%t)}function fe(e,t,n){for(let r=0;r<=n;r++)if(i(r*t-e,n)===0||i(-r*t-e,n)===0)return r;return n}let R={"3/4":d(3,6),"4/4":d(4,8),"5/4":d(5,10),"5/8":d(2,5),"6/8":d(2,6),"7/8":d(3,7),"9/8":d(3,9),"10/8":d(4,10),"12/8":d(4,12)};function pe(e){return e.heights.length}function me(e){let t=new Set(e.heights);return Array.from({length:e.cycle},(e,n)=>n===0?`downbeat`:t.has(n)?`pulse`:`subdivision`)}function z(e,t=2){return e.cycle*t}function B(e,t=2){return l(e,d(e.cycle,t*e.cycle))}let he=[`downbeat`,`half`,`pulse`,`between`];function ge(e,t){let n=Array(e).fill(1/0),r=(e,i,a)=>{n[e]=Math.min(n[e],a);let o=i-e;if(o<=3){for(let t=e;t<i;t++)n[t]=Math.min(n[t],a+1);return}let s=d(2,o).heights[1],c=e+(t?o-s:s);r(e,c,a+1),r(c,i,a+1)};return r(0,e,1),n}function _e(e,t=!1){let n=ge(e.heights.length,t),r=me(e).map(()=>`between`);return e.heights.forEach((e,t)=>{r[e]=he[Math.min(n[t],he.length)-1]}),r}function ve(e){return{cycle:e.cycle,heights:e.onsets}}function ye(e,t){let{cycle:n,onsets:r,degrees:i,accidentals:a,accents:o}=t,s=r.map((t,s)=>{let c=r[s+1]??r[0]+n,l=i[s];return{onset:u(e.rev?e.late-c:e.late+t,n),degree:l===null?null:e.strans+(e.mirror?-l:l),accidental:e.mirror?0-a[s]:a[s],accent:o?.[s]??0}});return s.sort((e,t)=>e.onset-t.onset),be({cycle:n,onsets:s.map(e=>e.onset),degrees:s.map(e=>e.degree),accidentals:s.map(e=>e.accidental)},o&&s.map(e=>e.accent))}function be(e,t){return t?.some(e=>e!==0)?{...e,accents:t}:e}function xe(e,t){let n=t.mirror?-1:1,r=t.rev?-1:1;return{strans:t.strans+n*e.strans,mirror:e.mirror!==t.mirror,late:t.late+r*e.late,rev:e.rev!==t.rev}}function Se(e,t){let n=[],r=e=>`${e.degrees.filter(e=>e===null).length}|${[...c(ve(e))].sort((e,t)=>e-t)}`;if(e.cycle!==t.cycle||e.onsets.length!==t.onsets.length||r(e)!==r(t))return n;let i=e=>`${e.onsets}|${e.degrees.map(e=>e!==null)}|${e.accidentals}|${e.accents??``}`,a=i(t),o=t.degrees.findIndex(e=>e!==null);for(let r of[!1,!0])for(let s of[!1,!0]){let c=ye({strans:0,mirror:s,late:0,rev:r},e).onsets,l=[...new Set(c.map(n=>u(t.onsets[0]-n,e.cycle)))];for(let c of l.sort((e,t)=>e-t)){let l=ye({strans:0,mirror:s,late:c,rev:r},e);if(i(l)!==a)continue;let u=t.degrees[o]-l.degrees[o];l.degrees.every((e,n)=>e===null||e+u===t.degrees[n])&&n.push({strans:u,mirror:s,late:c,rev:r})}}return n}function Ce(e){return Se(e,e)}function we(e,t,n=Ce(t)){let r=e=>(Number(e.rev)*2+Number(e.mirror))*t.cycle+e.late,i;for(let a of n){let n=xe(a,e),o={...n,late:u(n.late,t.cycle)};(!i||r(o)<r(i))&&(i=o)}return i}function Te(e){let{cycle:t,onsets:n,degrees:r,accidentals:i}=e;return{cycle:t,onsets:n,degrees:r,accidentals:i}}function Ee(e,t){let n=Te(t),[r]=Se(n,Te(e));return r===void 0?null:we(r,n)}let De=[`I`,`II`,`III`,`IV`,`V`,`VI`,`VII`],Oe={major:[!0,``],minor:[!1,``],diminished:[!1,`°`],augmented:[!0,`+`],sus2:[!0,`sus2`],sus4:[!0,`sus4`],5:[!0,`5`],6:[!0,`6`],m6:[!1,`6`],7:[!0,`7`],maj7:[!0,`maj7`],m7:[!1,`7`],mMaj7:[!1,`maj7`],m7b5:[!1,`ø7`],dim7:[!1,`°7`],9:[!0,`9`],maj9:[!0,`maj9`],m9:[!1,`9`],add9:[!0,`add9`]},ke=new Map(Object.entries(Oe).map(([e,[t,n]])=>[`${t}${n}`,e])),Ae={b:-1,"":0,"#":1},je=e=>e<0?`b`:e>0?`#`:``;function Me(e){let t=e===e.toUpperCase();if(!t&&e!==e.toLowerCase())return;let n=De.indexOf(e.toUpperCase());return n<0?void 0:{degree:n,upper:t}}function Ne(e){let t=/^([b#]?)([IViv]+)(.*?)(?:\/([b#]?)([IViv]+))?$/u.exec(e);if(!t)return;let[,n,r,i,a,o]=t,s=Me(r),c=s&&ke.get(`${s.upper}${i}`);if(!s||!c)return;let l={degree:s.degree,accidental:Ae[n],quality:c};if(o===void 0)return l;let u=Me(o);if(u)return l.of={degree:u.degree,accidental:Ae[a],minor:!u.upper},l}function Pe(e){let[t,n]=Oe[e.quality],r=De[e.degree],i=je(e.accidental)+(t?r:r.toLowerCase())+n;if(!e.of)return i;let a=De[e.of.degree];return`${i}/${je(e.of.accidental)}${e.of.minor?a.toLowerCase():a}`}function Fe(e){let t=c(e);return Math.max(...t)-Math.min(...t)}let Ie={ionian:`LLsLLLs`,aeolian:`LsLLsLL`};function Le(e,t,n){let r=c(e),i=Math.max(...r),a=r.map(e=>e===i?`L`:`s`).join(``),o=j(e,[0,1,2,3,4,5,6].find(e=>a.slice(e)+a.slice(0,e)===Ie[t]));return s(o,n-o.heights[0])}function Re(e,t){return t?Le(e,t.minor?`aeolian`:`ionian`,Be(e,t.degree,t.accidental)):e}function ze(e,t){let n=Re(e,t.of);return{root:i(Be(n,t.degree,t.accidental,Fe(e)),n.cycle),quality:t.quality}}function Be(t,n,r,i=Fe(t)){return e(t,n)+r*i}function Ve(t,n){if(t.heights.length!==7)return;let r=Le(t,`ionian`,t.heights[0]),a=Fe(t),o=(t,n)=>i(e(t,n),t.cycle),s=i(n,t.cycle),c=(e,n)=>i(o(t,e)+n*a,t.cycle)===s,l=[0,1,2,3,4,5,6],u=(r,i)=>({degree:r+7*((n-i*a-e(t,r))/t.cycle),accidental:i}),d=l.find(e=>c(e,0));if(d!==void 0)return u(d,0);let f=l.find(e=>o(r,e)===s);if(f!==void 0){for(let e of[-1,1])if(c(f,e))return u(f,e)}let p=l.find(e=>c(e,-1));if(p!==void 0)return u(p,-1);let m=l.find(e=>c(e,1));return m===void 0?void 0:u(m,1)}function He(e,t,n){if(!(t.quality in Oe)||e.heights.length!==7)return;let r=Ve(Re(e,n),t.root);if(r)return{degree:i(r.degree,7),accidental:r.accidental,quality:t.quality,...n&&{of:n}}}d(3,8),d(5,8,6),d(5,16,6),d(4,16),d(2,16,4),d(7,16);let Ue=(t,n)=>s(j(t,n),-e(t,n)),We=e=>({cycle:12,heights:e}),Ge={ionian:[`major`,`ION`],dorian:[`DOR`],phrygian:[`PHR`],lydian:[`LYD`],mixolydian:[`MIX`],aeolian:[`minor`,`natural minor`,`AEO`],locrian:[`LOC`]},Ke=Object.fromEntries(P.map(e=>[e,{helix:F(e),aliases:Ge[e]??[]}]));function qe(e,t){return Object.fromEntries(t.map(([t,n],r)=>[t,{helix:Ue(e,r),aliases:n}]))}let Je=Ue(d(5,12),3),Ye=d(8,12),Xe={...Ke,...qe(Je,[[`major pentatonic`,[`pentatonic`,`pentatonic major`,`PENT`]],[`suspended pentatonic`,[`suspended`,`egyptian`]],[`man gong`,[`malkos raga`,`MGNG`]],[`ritsusen`,[`ritusen`,`RITS`]],[`minor pentatonic`,[`pentatonic minor`,`vietnamese 2`,`MPEN`]]]),"whole tone":{helix:d(6,12),aliases:[`wholetone`,`messiaen's mode #1`,`WTON`]},chromatic:{helix:d(12,12),aliases:[`CHR`]},diminished:{helix:Ye,aliases:[`whole half`,`whole half diminished`]},"half whole diminished":{helix:Ue(Ye,1),aliases:[`half whole`,`dominant diminished`,`octatonic`,`messiaen's mode #2`,`HWD`]},...qe(We([0,3,5,6,7,10]),[[`blues`,[`minor blues`,`BLUE`]],[`major blues`,[`MBLU`]]]),...qe(We([0,2,3,5,7,8,11]),[[`harmonic minor`,[`HMIN`]],[`locrian natural 6`,[`locrian 6`,`locrian #6`,`LOC6`]],[`ionian #5`,[`ionian augmented`,`major augmented`,`major #5`,`ION5`]],[`dorian #4`,[`ukrainian dorian`,`romanian minor`,`altered dorian`,`DOR4`]],[`phrygian dominant`,[`spanish phrygian`,`spanish`,`phrygian major`,`PDOM`]],[`lydian #2`,[`lydian #9`,`LYD2`]],[`ultralocrian`,[`altered diminished`,`superlocrian bb7`,`superlocrian diminished`,`ULOC`]]]),...qe(We([0,2,3,5,7,9,11]),[[`melodic minor`,[`jazz minor`,`MMIN`]],[`dorian b2`,[`phrygian natural 6`,`phrygian #6`,`melodic minor second mode`,`DOR2`]],[`lydian augmented`,[`lydian #5`,`LYD+`]],[`lydian dominant`,[`acoustic`,`overtone`,`lydian b7`,`LDOM`]],[`mixolydian b6`,[`aeolian dominant`,`hindu`,`melodic minor fifth mode`,`MIX6`]],[`locrian natural 2`,[`aeolian b5`,`locrian #2`,`LOC2`]],[`altered`,[`super locrian`,`superlocrian`,`altered dominant`,`diminished whole tone`,`pomeroy`,`ALT`]]]),augmented:{helix:We([0,3,4,7,8,11]),aliases:[]}},Ze=/* @__PURE__ */ new Map;for(let[e,t]of Object.entries(Xe))for(let n of[e,...t.aliases]){let t=_(n);Ze.has(t)||Ze.set(t,e)}let Qe=[`kick`,`closedHat`,`openHat`,`pedalHat`,`ride`,`rim`],$e={kick:`bd`,closedHat:`hh`,openHat:`oh`,pedalHat:`ph`,ride:`rd`,rim:`rim`},et=R[`4/4`];B(et).cycle;let tt=e=>s(F(e.mode),e.tonic);function nt(e,t){let{root:n,quality:r}=ze(tt(e),t),a=e.tonic+i(n-e.tonic,12);return C(S[r].stack.map(e=>a+e))}let rt=[`bar`,`style`,`harm`],it=Qe.map(e=>$e[e]),at=[`frame`,`bass`,`pad`,`stab`,`next`];[...rt,...at,...it];let ot=[`aeolian`,`dorian`,`ionian`,`mixolydian`],st=[`plain`,`pentatonic`,`blues`],ct={tonic:9,mode:`aeolian`};function lt(e){return s(F(e.mode),e.tonic)}let ut={minor:{plain:[0,1,2,3,4,5,6].map(e=>[e,0]),pentatonic:[[0,0],[2,0],[3,0],[4,0],[6,0]],blues:[[0,0],[2,0],[3,0],[4,-1],[4,0],[6,0]]},major:{plain:[0,1,2,3,4,5,6].map(e=>[e,0]),pentatonic:[[0,0],[1,0],[2,0],[4,0],[5,0]],blues:[[0,0],[1,0],[2,-1],[2,0],[4,0],[5,0]]}};function dt(e,t){let n=lt(e);if(t===`plain`)return n;let r=n.heights[2]-n.heights[0]===3?`minor`:`major`;return{cycle:n.cycle,heights:ut[r][t].map(([e,t])=>Be(n,e,t))}}function ft(e,t){return t.tonic===null?t.mode===e.mode?e:{tonic:i(se(lt(e),F(t.mode)).heights[0],12),mode:t.mode}:t.tonic===e.tonic&&t.mode===e.mode?e:{tonic:t.tonic,mode:t.mode}}function pt(e){let t=e;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function mt(e,...t){let n=e>>>0;for(let e of t)n=Math.imul(n^(e|0),2654435761)>>>0;return pt(n)}function ht(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function gt(e,...t){return mt(e,...t)()}let _t={form:1,drumHit:2,drumVariation:3,drumVelocity:4,drumEuclid:5,theme:6,themeRenewal:7,chordColor:8,bassHit:9,bassVariation:10,bassNote:11,compHit:12,compVariation:13,leadRhythm:14,leadShape:15,leadVariation:16,bassVelocity:17,padVelocity:18,stabVelocity:19,leadVelocity:20,drumLength:21,bassLength:22,padLength:23,stabLength:24,leadLength:25,keyJump:26,ownAccent:27,offerVariation:28,radio:29,grooveVariation:30,lineVariation:31};function V(e,t,...n){return gt(e,0,_t[t],...n)}function vt(e,[t,n],r,i,a,o,s){let c=V(e,t,r,i,o);return a%2==1&&(c+=(V(e,n,r,a,o)-.5)*(.12+.4*s)),Math.min(.9999,Math.max(1e-4,c))}let yt=2**-16;function bt(e){return Math.round(e/yt)*yt}function H(e,t){if(!(e>=0&&e<1))throw Error(`chance: draw ${e} is outside [0, 1)`);if(!Number.isFinite(t))throw Error(`chance: probability ${t} is not a finite number`);return e<bt(t)}function xt(e,t){if(!(e>=0&&e<1))throw Error(`pick: draw ${e} is outside [0, 1)`);let n=t.map(e=>{if(!(e>=0&&Number.isFinite(e)))throw Error(`pick: weight ${e} is negative or not finite`);return Math.round(e/yt)}),r=n.reduce((e,t)=>e+t,0);if(r===0)throw Error(`pick: the weights give nothing to pick`);let i=Math.floor(e*r);for(let e=0;e<n.length-1;e++)if(i-=n[e],i<0)return e;return n.length-1}let St=e=>Math.max(0,Math.min(1,e)),Ct=e=>{let t=St(e);return t*t*(3-2*t)};function wt({seed:t,barInSection:n,key:r,theme:a,harm:o}){let s=lt(r),c=a.bars[n],u=Ct((o-.25)/.5),d=St((o-.75)/.25)*.7,f=(e,r)=>V(t,`chordColor`,a.index,n,e,r);return c.map((t,p)=>{let m=H(f(p,1),d);if(`dominantOf`in t){let n=e(s,t.dominantOf),r=s.heights[0]+i(n+7-s.heights[0],12);return{slot:t,raised:!1,chord:{helix:{cycle:12,heights:[r,r+4,r+7,r+10]},tensions:m?[r+14]:[]}}}let h=t.degree,g=H(f(p,0),u)?4:3,_=l({cycle:7,heights:[h,h+2,h+4,h+6].slice(0,g)},s).heights,v=_[0],y=p+1<c.length?c[p+1]:a.bars[n+1]?.[0],b=y===void 0?0:`degree`in y?y.degree:null;if((r.mode===`aeolian`||r.mode===`dorian`)&&h===4&&b===0&&o>.4)return{slot:t,raised:!0,chord:{helix:{cycle:12,heights:[v,v+4,v+7,v+10].slice(0,g)},tensions:[]}};let x=e(s,h+8),S=g===4&&m&&x-v===14?[x]:[];return{slot:t,raised:!1,chord:{helix:{cycle:12,heights:_},tensions:S}}})}function Tt(e,t){let n=Math.floor(t*z(e)/16);return n%2==t%2?n:n-1}function Et(e,t){return e.map(e=>({...e,slot:{...e.slot,step:Tt(t,e.slot.step)}}))}function Dt(e,t){return e.findLast(e=>e.slot.step<=t)??e[0]}function Ot(e){let t=w(e),n=t.map(e=>e-t[0]),r=k(n);if(!r)throw Error(`chords: no quality for ${n.join(` `)}`);return{root:t[0],stack:n,quality:r}}function kt({slot:t,chord:n},r){let a=lt(r),{root:o,quality:s}=Ot(n),c=`dominantOf`in t?{degree:t.dominantOf,accidental:0,minor:e(a,t.dominantOf+2)-e(a,t.dominantOf)===3}:void 0,l=He(a,{root:i(o,12),quality:s},c);if(!l)throw Error(`chordNumeral: no numeral for ${s} on ${o}`);return Pe(l)}let At={intro:[`groove`],groove:[`groove`,`bridge`,`build`],bridge:[`groove`,`build`,`breakdown`],build:[`drop`],drop:[`drop`,`breakdown`,`groove`],breakdown:[`build`,`groove`]},jt=(e,t,n)=>{switch(e){case`intro`:return 0;case`groove`:return .3*(1-n)+.05;case`bridge`:return .35+.2*n;case`build`:return .1+.45*t;case`drop`:return .3*t;case`breakdown`:return .35-.15*t}};function Mt(e,t,n){return At[e].map(e=>[e,jt(e,t,n)])}let Nt={initial:null,advance({seed:e,index:t,style:n},r){let i=`intro`;if(t>0){let a=Mt(r?.type??`intro`,n.energy,n.entropy),o=a.length===1?[1]:a.map(([,e])=>e);i=a[xt(V(e,`form`,t),o)][0]}let a={type:i,index:t};return{carried:a,output:a}}},Pt={intro:-.3,groove:0,bridge:-.1,build:0,drop:.3,breakdown:-.45};function Ft(e,t,n){let r=t===`build`?-.15+.45*n/7:Pt[t];return Math.max(0,Math.min(1,e+r))}let It=[`sync`,`harm`,`artic`,`energy`],Lt=e=>Object.fromEntries(It.map(t=>[t,e[t]]));function Rt(e,t,n,r,i=[],a){let{miss:o,hold:s}=e.margins??{miss:.3,hold:.02},c=a===void 0?e.query(Lt(t),r,...i.length?[i]:[]):e.query(Lt(t),r,i,a),l=c[0];if(!l||l.distance>o)return null;let u=n===null?void 0:c.find(e=>e.id===n),d=u&&u.distance<=o&&u.distance-l.distance<=s?u.id:l.id;return e.fragments.get(d)}let zt=[],Bt=e=>bt(.2*Math.min(1,Math.max(0,1-e))),Vt=[`fill`],Ht=e=>Math.floor(e/3),Ut={},Wt=(e,{rhythmFragment:t,claveFragment:n})=>t===void 0||n===void 0||n in e?e:{...e,[n]:t};function Gt(e,t=Ut){let n=e.filter(e=>e.rejected).flatMap(e=>e.grooves);return[...n,...Object.keys(t).filter(e=>n.includes(t[e]))]}function Kt(e,t){let n=t=>{let n=e.filed.find(e=>e.fragment.id===t)?.meta.varies;return typeof n==`string`?n:void 0},r=e=>{let t=/* @__PURE__ */ new Set([e]),r=e;for(let e=n(r);e!==void 0&&!t.has(e);e=n(r))t.add(e),r=e;return r},i=r(t),a=e.filed.map(e=>e.fragment.id).filter(e=>r(e)===i),o=a.includes(i)?a:[i,...a];return o.includes(t)?o:[t]}function qt(e,t){let n=e.find(e=>e.grooves.some(e=>t.includes(e)));return n?{...n,grooves:[...n.grooves,...t.filter(e=>!n.grooves.includes(e))]}:{grooves:[...t],boredom:0,rejected:!1}}function Jt({grooves:e,boredom:t}){let n=Ht(t);return n>=1&&n<2&&e.length-1<n}function Yt(e,t,n){let r=bt(n),i=e=>t.some(t=>e.grooves.some(e=>t.grooves.includes(e)));return[...e.filter(e=>!i(e)).map(e=>({...e,boredom:e.boredom-r})).filter(e=>e.boredom>0),...t.map(({grooves:e,boredom:t})=>{let n=t+r;return{grooves:e,boredom:n,rejected:Ht(n)>=2}})]}let Xt={miss:.3,hold:.02},Zt=e=>e.margins??Xt;function Qt(e,t,n,r,i=0){let a=e[0],o=t===void 0?void 0:e.find(e=>e.id===t);return o&&o.distance<=n+i&&o.distance-a.distance<=r?o.id:a&&a.distance<=n?a.id:void 0}function $t(e,t,n,r,i,a,o=[],s=[],c){let{miss:l,hold:u}=Zt(e);return Qt(e.query(t,n,a,o,l,c).filter(e=>e.distance<=l&&!s.includes(e.id)).filter(t=>i(e.read(t.id,n.meter,a))),r,l,u)}let en=(e,t,n)=>e.filed.filter(e=>e.fragment.association.some(e=>e.facet===t)).findIndex(e=>e.fragment.id===n);function tn(e,t,n,r,i,a,o,s){if(!e||o===void 0)return{id:o,layer:i,playing:null};let c=i.filed.some(e=>e.fragment.id===o);if(!c&&!e.file)return{id:o,layer:i,playing:null};let l=qt(a,Kt(i,o)),u=Jt(l)&&e.file&&e.vary?e.read(o,s.meter,i):null;if(!u||u.bars!==1)return{id:o,layer:i,playing:l};let d=c?en(i,t,o):-1,f=d===-1?ht(o):d,p=e.vary(o,s,V(r.seed,n,f),i);if(!p)return{id:o,layer:i,playing:l};let{by:m,...h}=p,g=e.file(i,{...h,bench:s,point:r.point,source:`composer`,created:`song ${r.seed}, bar ${r.index*8}`,tags:r.tags,varies:o,by:m}),_=l.grooves.includes(g.id)?l.grooves:[...l.grooves,g.id];return{id:g.id,layer:g.layer,playing:{...l,grooves:_}}}function nn(e,t,n,r,i,a){if(!e?.file)return{layer:a,ids:[]};let o=a,s=[];for(let{source:a,bars:c}of t){let t=n(c);if(!t)continue;let l=e.file(o,{...t,bench:r,point:i.point,source:a,created:`song ${i.seed}, bar ${i.index*8}`,tags:i.tags});o=l.layer,s.includes(l.id)||s.push(l.id)}return{layer:o,ids:s}}function rn(e,t,n,r,i){let a=n.filter(e=>e!==void 0);return a.length&&e?.used?e.used(t,a,r,i===void 0?[]:[i]):t}let an=[`drums`,`bass`,`pad`,`stab`,`lead`],on=[`kick`,`backbeat`,`fill`,`ghost`,`hat`,`pedal`,`euclid`,`clave`],sn=R[`4/4`],cn=B(sn).cycle,ln=e=>2*Math.floor(e/4),un=e=>2*Math.floor(e*3/8),dn=(e,t)=>e.cycle===t.cycle&&e.heights.length===t.heights.length&&e.heights.every((e,n)=>e===t.heights[n]);function fn(n){if(n.length===0)throw Error(`clockOf: a song needs a meter`);let r=[];for(let{bar:e,meter:t}of[...n].sort((e,t)=>e.bar-t.bar)){if(t.heights[0]!==0)throw Error(`clockOf: a meter starts on its downbeat`);let n=B(t),i=r.at(-1),a=i?e-i.bar:e;r.push({bar:e,step:i?i.step+a*i.helix.cycle:a*n.cycle,beat:i?i.beat+a*i.beats:a*n.heights.length,helix:n,beats:n.heights.length})}let i=(e,t)=>r.findLast(n=>e(n)<=t)??r[0],a=e=>{let t=i(e=>e.bar,e);return t.step+(e-t.bar)*t.helix.cycle},o=e=>{let n=i(e=>e.step,e);return n.bar+Math.floor(t(n.helix,e-n.step)/n.beats)},s=e=>{let n=i(e=>e.step,e);return n.beat+t(n.helix,e-n.step)},c=t=>{let n=i(e=>e.beat,t);return n.step+e(n.helix,t-n.beat)};return{barAt:o,barStart:a,barSteps:e=>i(e=>e.bar,e).helix.cycle,stepInBar:e=>e-a(o(e)),beatAt:s,beatStart:c,beatInBar:e=>{let n=i(e=>e.step,e);return u(t(n.helix,e-n.step),n.beats)},onBeat:e=>c(s(e))===e}}let{barAt:pn,barStart:mn,stepInBar:hn,beatAt:gn,beatStart:_n,beatInBar:vn,onBeat:yn}=fn([{bar:0,meter:sn}]),bn={min:0,max:1,space:`linear`},xn={sync:bn,harm:bn,artic:bn,energy:bn,entropy:bn,bpm:{min:60,max:180,space:`log`}},Sn=Object.keys(xn),Cn=(e,t,[n,r,i,a,o])=>({name:e,mode:t,style:{sync:n,harm:r,artic:i,energy:a,bpm:o}}),wn=[Cn(`Synth-pop`,`aeolian`,[.3,.45,.55,.55,108]),Cn(`Techno`,`aeolian`,[.12,0,1,.8,130]),Cn(`Deep house`,`dorian`,[.35,.55,.65,.65,122]),Cn(`Ambient`,`ionian`,[.05,.3,0,.2,72]),Cn(`Lo-fi hip hop`,`aeolian`,[.5,.75,.35,.5,84]),Cn(`Funk`,`dorian`,[1,.12,.85,.75,104]),Cn(`Bossa nova`,`ionian`,[.75,.85,.45,.45,132]),Cn(`Swing jazz`,`ionian`,[.35,1,.3,.6,148])];mn(8),mn(1),{...wn[0].style};function Tn(e){let t=1e3;return Object.fromEntries(Sn.map(n=>[n,Math.round(e[n]*t)/t]))}function En(e,t){return{played:n=>t.played(e.played(n)),written:n=>e.written(t.written(n))}}let Dn=e=>Math.max(0,Math.min(1,e)),On=1.5,kn=e=>.5+e/6,An=e=>(e-.5)*6,jn=e=>Math.max(-1.5,Math.min(On,e));function Mn({sixteenth:e,eighth:t},n=R[`4/4`]){return En(Bn(2,jn(e)),Vn(B(n),jn(t)))}let Nn=[`8n`,`16n`],Pn={level:`16n`,share:.5};kn(On);function Fn({level:e,share:t}){let n=An(t);return e===`8n`?{sixteenth:0,eighth:n}:{sixteenth:n,eighth:0}}let In=e=>Dn(Fn(e).eighth),Ln=e=>Dn(An(e.share)*(e.level===`8n`?1:.5));function Rn({level:e,share:t}){return{level:e,share:{from:t,to:t,start:0,length:0,slope:0,brake:0}}}function zn(e,t,n,r){return e<t?e*n/t:n+(e-t)*(r-n)/(r-t)}function Bn(e,t){let n=e/2,r=n+t*e/6,i=(t,n,r)=>{let i=Math.floor(t/e)*e;return i+zn(t-i,n,r,e)};return{played:e=>i(e,n,r),written:e=>i(e,r,n)}}function Vn(n,r){let i=2+r*4/6,a=(r,i,a)=>{let o=t(n,r),s=e(n,o),c=e(n,o+1)-s;return c===4?s+zn(r-s,i,a,c):r};return{played:e=>a(e,2,i),written:e=>a(e,i,2)}}let Hn=`bass`;function Un(e,t,n){let r=B(t).heights;for(let t=0;t<e.bars;t++)if([...new Set(e.notes.filter(e=>e.step>=t*n&&e.step<(t+1)*n).map(e=>e.step-t*n))].sort((e,t)=>e-t).join()!==r.join())return!1;return!0}function Wn(e,t,n,r,i,a,o,s=[],c=[],l){let u=In(r)>0;return $t(e,Lt(t),n,a,e=>e!==null&&(u||!Un(e,n.meter,i)),o,s,c,l)}function Gn(e,t,n,r,i,a){let o=t===void 0?null:e.read(t,n,a);if(!o)return[];let s=r%o.bars;return o.notes.filter(e=>Math.floor(e.step/i)===s).map(e=>({...e,step:e.step-s*i}))}function Kn(t,n,r,i){let a=Dt(n,t.step),o=[...n.filter(e=>e.slot.step>a.slot.step),...r],s=w((t.chord===0?a:o[t.chord-1]??o.at(-1)??a).chord),c=Math.floor(t.index/s.length),l=s[t.index-c*s.length]+12*c;if(t.alter===0)return l+t.shift;let u=lt(i),d=Ve(u,l);return(d?e(u,d.degree+t.alter)+d.accidental*1:l+t.alter)+t.shift}function qn(e,t,n=`cycle`,r=0){let i=t.heights.length,a=c(t),o=Array.from({length:z(t)},()=>0),s=(n,r)=>{let i=Math.floor(n%4/2),s=t.heights[r]*2+i%a[r]*2+n%2;o[s]=Math.max(o[s],e[n])};for(let t=0;t<e.length;t++){if(e[t]===0)continue;let a=Math.floor(t/4);if(n===`fold`)s(t,a%i);else for(let e=0;e<i;e++)a===(e===0?0:(r*i+e)%4)&&s(t,e)}return o}let Jn=[33,57],Yn=[33,52],Xn=[1,0,0,.7,0,0,.8,.4,0,0,.7,.5,0,.3,.8,0],Zn=[`root`,`pump`,`eight`,`funk`,`walk`];function Qn(e,t=0){let n=z(e),r=B(e).heights,i=_e(e),a=e=>r.length>=4&&e%2==0&&i[e/2]===`half`,o=e=>Array.from({length:n},(t,n)=>e(n)),s=new Set(r.map(e=>e+2)),c=new Set(r);return{root:o(e=>e===0?1:a(e)?.6:0),pump:o(e=>+!!s.has(e)),eight:o(e=>e%2==0?e===0?1:a(e)?.9:.8:0),funk:qn(Xn,e,`cycle`,t),walk:o(e=>+!!c.has(e))}}let $n=[`bassHit`,`bassVariation`],er={hit:0,anticipate:1},tr={approach:0,walkTone:1,ornament:2},nr=e=>Math.max(0,Math.min(1,e));function rr(e,t,n){let r=In(t),i=r*nr(e.harm*1.5),a=e.sync*(1-i);return{root:.35,pump:(1-e.harm)*e.artic*(1-r)*(1-e.sync),eight:n*.6*(1-i)*(1-a),funk:a,walk:i}}let ir=e=>e.helix.heights[0],ar=e=>e.helix.heights.map(t=>t-ir(e));function or(e,t){let n=40,r=1/0;for(let a=Yn[0];a<=Yn[1];a++)i(a,12)===i(e,12)&&Math.abs(a-t)<r&&(r=Math.abs(a-t),n=a);return n}function sr(e,t,n=[]){let{seed:r,bar:a,plan:o,style:s,barEnergy:c,next:l,meter:u}=e,d=o.section.index,f=[],p=z(u),m=B(u).heights,h=e=>m.includes(e),g=Et(e.chords,u),_=e=>g.some(t=>t.slot.step===e),v=e=>g.find(t=>t.slot.step>e)??l[0]??Dt(g,e);if(o.section.type===`breakdown`)return g.forEach((e,n)=>{let r=g[n+1]?.slot.step??p;t=or(ir(e.chord),t),f.push({part:`bass`,step:e.slot.step,note:t,length:r-e.slot.step})}),{carried:t,output:f};let y=rr(s,e.swing,c),b=Object.values(y).reduce((e,t)=>e+t,0),x=.55+.6*c,S=(e,t)=>vt(r,$n,e,d,a,t,s.entropy),C=Qn(u,a),w=[],T=[],E=/* @__PURE__ */ new Set;for(let e=0;e<p;e++){let t=0;for(let n of Zn)t+=y[n]*C[n][e];t/=b,T.push(t);let n=_(e)&&y.pump<.45||y.walk>.5&&h(e);n&&E.add(e),(n||H(S(er.hit,e),t*x))&&w.push(e)}w.length===0&&w.push(0);let D=cr(w,n,E,T);return D.forEach(({step:e,from:n},c)=>{let u=Dt(g,e).chord,b=D[c+1]?.step??p,x=y.walk>.5&&h(e),C=ir(u),w=!1;if(n){if(C=Kn(n,g,l,o.key),!x&&!_(e)){let t=V(r,`bassNote`,tr.ornament,d,e);w=t>=.55&&t<.8}}else if(x){let t=m.find(t=>t>e)??p,n=t>=p,i=n||_(t),o=n?l[0]?.chord??u:Dt(g,t).chord;if(_(e))C=ir(u);else if(i)C=ir(o)+(H(V(r,`bassNote`,tr.approach,a,e),.5)?-1:1);else{let[,t,n,i]=ar(u),o=[t,n,i??n];C=ir(u)+o[Math.floor(V(r,`bassNote`,tr.walkTone,a,e)*3)]}}else if(!_(e)){let t=v(e).chord;if(e>=p-3&&i(ir(t)-ir(u),12)!==0&&H(S(er.anticipate,e),s.sync*.9))C=ir(t);else{let t=V(r,`bassNote`,tr.ornament,d,e);t>=.55&&t<.8?w=!0:t>=.8&&(C=ir(u)+ar(u)[2])}}t=or(C,t),f.push({part:`bass`,step:e,note:w&&t+12<=Jn[1]?t+12:t,length:b-e})}),{carried:t,output:f}}function cr(e,t,n,r){if(!t.length)return e.map(e=>({step:e,from:null}));let i=[...t].sort((e,t)=>e.step-t.step),a=i.filter((e,t)=>i.findIndex(t=>t.step===e.step)===t).slice(0,e.length).map(e=>({step:e.step,from:e})),o=new Set(a.map(e=>e.step)),s=e.filter(e=>!o.has(e)).sort((e,t)=>Number(n.has(t))-Number(n.has(e))||r[t]-r[e]||e-t).slice(0,e.length-a.length).map(e=>({step:e,from:null}));return[...a,...s].sort((e,t)=>e.step-t.step)}let lr={initial:40,advance:(e,t)=>sr(e,t)},ur=[50,79],dr=[50,63],fr=[0,0,.9,0,0,0,.9,.3,0,0,.9,0,.3,0,.9,.3],pr=[`compHit`,`compVariation`],mr={pad:0,stab:1},hr=(e,t,n)=>e+(t-e)*n;function gr(e,t){let n=(e,t)=>Math.min(...t.map(t=>Math.abs(e-t)));return t.reduce((t,r)=>t+n(r,e),0)+.5*e.reduce((e,r)=>e+n(r,t),0)}function _r(e,t){let n=w(e),r=(n.length>=5?n.filter((e,t)=>t!==2):n).map(e=>i(e,12)),a=e=>e.reduce((e,t)=>e+t,0)/e.length,o=null,s=1/0;for(let e=0;e<r.length;e++){let n=[...r.slice(e),...r.slice(0,e)];for(let e=dr[0];e<=dr[1];e++){if(i(e,12)!==n[0])continue;let r=[e];for(let e of n.slice(1)){let t=r.at(-1)+1;for(;i(t,12)!==e;)t++;r.push(t)}if(r.at(-1)>ur[1])continue;let c=t?gr(t,r):Math.abs(a(r)-62);c<s&&(s=c,o=r)}}return o??r.map(e=>60+e)}let vr=(e,t)=>w(e).join()===w(t).join(),yr={initial:null,advance(e,t){let{seed:n,bar:r,plan:i,style:a,barEnergy:o,next:s,meter:c}=e,l=In(e.swing),u=z(c),d=B(c).heights,f=_e(c),p=Et(e.chords,c),m=Array.from({length:u},(e,t)=>t===0?1:d.includes(t)?f[t/2]===`half`&&d.length>=4?.9:.5:0),h=qn(fr,c,`cycle`,r),g=i.section.type===`breakdown`||o<.3,_=g?Math.max(.85,1-a.artic):1-a.artic,v=g?0:(.35+.65*o)*(1-.45*l)*a.artic*1.4,y=(e,t)=>vt(n,pr,e,i.section.index,r,t,a.entropy),b=t,x=p.map(e=>b=_r(e.chord,b)),S=[],C=/* @__PURE__ */ new Set;p.forEach((e,t)=>{let n=e.slot.step;if(!H(y(mr.pad,n),_*1.15))return;C.add(n);let r=p[t+1]?.slot.step??u;for(let e of x[t])S.push({part:`pad`,step:n,note:e,length:r-n})});for(let e=0;e<u;e++){if(C.has(e))continue;let t=hr(m[e],h[e],a.sync)*v;if(!H(y(mr.stab,e),t))continue;let n=p.indexOf(Dt(p,e)),r=x[n],i=s[0];e>=u-2&&a.sync>.5&&i&&!vr(i.chord,p[n].chord)&&(r=_r(i.chord,b));for(let t of r)S.push({part:`stab`,step:e,note:t,length:1})}return{carried:b,output:S}}},br=[60,86];function xr(e,t,n,r,i){let a=e[0]>0;return{cycle:i,onsets:a?[0,...e]:[...e],degrees:a?[null,...t]:[...t],accidentals:[...a?[0]:[],...e.map(()=>0)],sync:n,energy:r}}function Sr(e){let t=e.degrees.flatMap((e,t)=>e===null?[]:[t]);return{steps:t.map(t=>e.onsets[t]),degrees:t.map(t=>e.degrees[t])}}function Cr(e,t,n){let{cycle:r,onsets:i,degrees:a,accidentals:o,accents:s}=e,c=n*t%r,l=[];for(let e=0;e*r<c+t;e++)i.forEach((n,i)=>{let a=e*r+n-c;a>=0&&a<t&&l.push({at:a,i})});let u=l.length>0&&l[0].at>0;return{cycle:t,onsets:[...u?[0]:[],...l.map(e=>e.at)],degrees:[...u?[null]:[],...l.map(e=>a[e.i])],accidentals:[...u?[0]:[],...l.map(e=>o[e.i])],...s?{accents:[...u?[0]:[],...l.map(e=>s[e.i])]}:{}}}let wr=[.5,.2,.4,.8,.2,.4,.8,.5,.3,.2,.8,.6,.2,.4,.9,.4];function Tr(e){let t=new Set(B(e).heights),n=_e(e);return Array.from({length:z(e)},(e,r)=>r%2==0?r===0?1:t.has(r)?n[r/2]===`half`&&t.size>=4?.9:.8:.4:t.has(r-1)?.1:.15)}let Er=[e=>Math.sin(Math.PI*e),e=>-e,e=>e,e=>Math.sin(2*Math.PI*e)*.6],Dr=(e,t,n)=>e+(t-e)*n;function Or(e,t){return e<.25?B(t).heights:e<.6?[0,ln(z(t))]:[0]}function kr({style:e,swing:t,barEnergy:n,chords:r,plan:i,meter:a}){let s=z(a),c=new Set(B(a).heights),l=Et(r,a);return{density:.25+.5*n,grooveMix:e.sync,pickups:Array.from({length:s},(e,n)=>n%2==0&&!c.has(n)?.3*Ln(t):0),pulse:o(d(Math.round(3+5*n),s,Math.round(e.sync*3))),scale:dt(i.key,i.melodic),span:2+Math.round((n+e.entropy)*3),contours:[1+(1-e.harm)*(1-e.entropy),1,1,.25+1.5*e.harm],turn:.2+.3*e.entropy,leap:e.entropy>.5?e.entropy-.5:0,variations:[.3,.25,.25,.2],nudge:e.entropy*.5,snap:Array.from({length:s},(e,t)=>t).filter(t=>Or(e.harm,a).includes(t)||l.some(e=>e.slot.step===t)),range:br}}function Ar(e){let{seed:t,plan:n,style:r,barEnergy:i,barInSection:a,meter:o,bar:s}=e,{density:c,grooveMix:l,pickups:u,pulse:d,span:f,contours:p,turn:m,leap:h}=kr(e),g=z(o),_=Tr(o),v=qn(wr,o,`cycle`,s),y=n.section.index,b=a>>2,x=0,S=()=>V(t,`leadShape`,y,b,x++),C=new Set(d),w=[];for(let e=0;e<g;e++){let n=Math.min(1,Dr(_[e],v[e],l)*c+u[e]),r=Dr(n,C.has(e)?.9:0,.5);H(V(t,`leadRhythm`,y,b,e),r)&&w.push(e)}for(let e of[0,ln(g),...B(o).heights,2,4,6]){if(w.length>=3)break;!w.includes(e)&&e<g&&w.push(e)}w.sort((e,t)=>e-t);let T=Er[xt(S(),p)],E=[0],D=0;for(let e=1;e<w.length;e++){let t=Math.round(bt(T(e/Math.max(1,w.length-1))*f)),n=E[e-1],r=Math.sign(t-n)*(Math.abs(t-n)>2?2:1);Math.abs(D)>=3?r=-Math.sign(D):H(S(),m)&&(r+=H(S(),.5)?-1:1),h>0&&H(S(),h)&&(r+=H(S(),.5)?-3:3),E.push(n+r),D=r}return xr(w,E,r.sync,i,g)}function jr(e,t){let{seed:n,bar:r}=t,{variations:i,nudge:a}=kr(t),o=0,s=()=>V(n,`leadVariation`,r,o++),c=Sr(e),l=c.degrees,u=c.steps,d=xt(s(),i);if(d===0)l=l.map(e=>-e);else if(d===1)l=l.map(e=>e+2);else if(d===2){let e=l.length-1;e>0&&(l[e]=l[e-1]+(H(s(),.5)?-1:1)*(1+xt(s(),[1,1])))}else u.length>2&&(u.pop(),l.pop());if(H(s(),a)&&u.length>1){let e=1+xt(s(),u.slice(1).map(()=>1));l[e]+=H(s(),.5)?-1:1}return xr(u,l,e.sync,e.energy,e.cycle)}let Mr=(e,t)=>Nr(w(e).map(e=>i(e,12)),t);function Nr(e,t){for(let n=0;n<=6;n++)for(let r of[t-n,t+n])if(e.includes(i(r,12)))return r;return t}function Pr(e,[t,n]){let r=r=>e.filter(e=>e+r>=t&&e+r<=n).length,i=0;for(let e=-4;e<=4;e++){let t=12*e,n=r(t)-r(i);(n>0||n===0&&Math.abs(t)<Math.abs(i))&&(i=t)}return e.map(e=>{let r=e+i;for(;r>n;)r-=12;for(;r<t;)r+=12;return r})}function Fr(e,t){return t<.4||e===`breakdown`||e===`intro`}function Ir(e,t,n,r){if(r!==1&&r!==3)return e;let a=w(Dt(n,t).chord),o=r===3?[a[0]]:[a[1],a[2]];return[...e.slice(0,-1),Nr(o.map(e=>i(e,12)),e.at(-1))]}function Lr(e,t,n,i){let{plan:a,barInSection:o,meter:s,bar:c}=t,l=Et(t.chords,s),u=z(s),d=kr(t),{snap:f,range:p}=d,{onsets:m,degrees:h,accidentals:g,accents:_}=Cr(e,u,c),v=i?d.scale:lt(a.key),y=m.flatMap((e,t)=>h[t]===null?[]:[{step:e,i:t}]);if(y.length===0)return{written:[],last:n};let b=r(v,Mr(Dt(l,y[0].step).chord,n)),x=y.map(({step:e,i:t})=>{let n=Be(v,b+h[t],g[t]);return i&&f.includes(e)?Mr(Dt(l,e).chord,n):n});return x=Pr(Ir(x,y.at(-1).step,l,o%4),p),{written:y.map(({step:e,i:t},n)=>({part:`lead`,step:e,note:x[n],length:(m[t+1]??u)-e,...i?{}:{accent:_?.[t]??0}})),last:x.at(-1)}}let Rr={initial:{last:69,phrase:null,melodies:{},offered:null},advance(e,t){let{plan:n,style:r,barEnergy:i,barInSection:a,offer:o}=e;if(o){let{written:n,last:r}=Lr(o.motif,e,t.last,!1);return{carried:{...t,last:r,phrase:null,offered:o.bar},output:n}}let{section:s,theme:c}=n;if(Fr(s.type,i))return{carried:{...t,phrase:null,offered:null},output:[]};let l=a%4,{phrase:u,melodies:d}=t,f;if(l===0||!u){let t=d[c.kind];t&&t.theme===c.index&&Math.abs(t.shape.sync-r.sync)<.25&&Math.abs(t.shape.energy-i)<.3?f=t.shape:(f=Ar(e),d={...d,[c.kind]:{theme:c.index,shape:f}}),u=f}else f=l===2?u:jr(u,e);let{written:p,last:m}=Lr(f,e,t.last,!0);return{carried:{last:m,phrase:u,melodies:d,offered:null},output:p}}},U={kick:36,rim:37,snare:38,closedHat:42,pedalHat:44,openHat:46,ride:51},zr=[`drumHit`,`drumVariation`],Br={kick:0,backbeat:1,ghost:2,hat:3,ride:4,open:5,pedal:6,fill:7,euclid:8},Vr=[1,0,0,.7,0,0,.6,0,0,0,.8,.35,0,0,.45,0],Hr=[0,.3,0,.4,0,.2,0,.6,0,.5,0,.3,0,.2,0,.5],Ur=e=>Math.max(0,Math.min(1,e)),Wr=(e,t,n)=>e+(t-e)*n,Gr=e=>{let t=Ur(e);return t*t*(3-2*t)};function Kr(e){let t=e.heights.length;return Array.from({length:t},(e,t)=>t).filter(e=>t<=3?e>0:e%2==1)}function qr(e,t=`cycle`){let{seed:n,bar:r,barInSection:i,style:a,barEnergy:s,meter:c}=e,{section:l}=e.plan,{sync:u,artic:f,harm:p,entropy:m}=a,h=In(e.swing),g=i===7,_=Gr((s-.05)/.5),v=(e,t,i)=>H(vt(n,zr,Br[e],l.index,r,t,m),i),y=z(c),b=B(c).heights,x=new Set(b),S=_e(c),C=new Set(Kr(c).map(e=>b[e])),w=e=>new Set(b.filter(e).map(e=>e+2)),T=w(e=>C.has(e)),E=w(e=>!C.has(e)),D=ln(y),O=qn(Vr,c,t,r),k=qn(Hr,c,t,r),A=/* @__PURE__ */ new Map,j=(e,t,n)=>{let r=e*128+t,i=A.get(r);(!i||on.indexOf(n)<on.indexOf(i.role))&&A.set(r,{part:`drums`,role:n,step:e,note:t,length:1})},M=()=>[...A.entries()].sort(([e],[t])=>e-t).map(([,e])=>e);if(l.type===`breakdown`){if(s>.2)for(let e of b)j(e+2,h>.5?U.ride:U.closedHat,`hat`);if(g)for(let e=D;e<y;e++)j(e,U.snare,`fill`);return M()}let N=Ur((s-.45)*3)*(1-h)*(1-u*.7),P=Ur(f*(1-h)*(1-p)*1.3-.25)*_,ee=N,F=Array.from({length:y},(e,t)=>t===0?1:x.has(t)?S[t/2]===`half`&&b.length>=4?.9:ee:0);for(let e=0;e<y;e++){let t=Wr(F[e],O[e],u)*(e===0?1:_)*(1-.55*h);v(`kick`,e,t)&&j(e,U.kick,`kick`),C.has(e)?s>.25&&v(`backbeat`,e,1-.8*h)&&j(e,U.snare,`backbeat`):v(`ghost`,e,k[e]*u*_*.9+h*.12*_)&&j(e,U.snare,`ghost`);let n=e%2==0?Ur(.15+s*1.1):Ur((s-.55)*2.5)*(1-h);if(h>0&&(x.has(e)&&(n=Math.max(n,h)),T.has(e)&&(n=Math.max(n,h*.95)),E.has(e)&&(n*=1-.7*h)),n*=Math.max(_,h*.8),v(`hat`,e,n)){let t=e%2==0&&!x.has(e)&&v(`open`,e,P)?U.openHat:v(`ride`,e,h)?U.ride:U.closedHat;j(e,t,`hat`)}h>.3&&C.has(e)&&v(`pedal`,e,h)&&j(e,U.pedalHat,`pedal`)}if(v(`euclid`,0,u*_*(1-.7*h)*1.3)){let e=[3,5,7][Math.min(2,Math.floor(s*3))],t=Math.floor(V(n,`drumEuclid`,l.index)*4*u);for(let n of o(d(e,y,t)))j(n,U.rim,`euclid`)}if(g&&(l.type===`build`||v(`fill`,0,.35+.3*u))){let e=l.type===`build`?D:un(y);for(let t=e;t<y;t++)j(t,U.snare,`fill`)}return M()}function Jr(e,t=sn){return 60*pe(t)/(e*z(t))}_n(2);function Yr(e,t,n){let r=e.map(e=>e*t);for(let[e,t]of n)r[e]+=t;return r}function Xr(e,t){let n=Math.max(...e);return n>0?e.map(e=>(e/n)**t):e.map(()=>1)}let Zr=Array(12).fill(0);function Qr(e,t){return Yr(e,.85,$r(t))}function*$r(e){for(let[t,{slot:n,chord:r}]of e.entries()){let i=((e[t+1]?.slot.step??cn)-n.step)/cn;for(let e of new Set(w(r).map(e=>u(e,12))))yield[e,i]}}let ei=new Map(ot.map(e=>[e,o(F(e))]));function ti(e,t){let n=0;for(let r of ei.get(t.mode))n+=e[(r+t.tonic)%12];return n}let ni=(e,t,n)=>Math.max(t,Math.min(n,e)),ri=(e,t,n)=>e+(t-e)*n;function ii(e,t,n){let{type:r}=e.plan.section,i=z(e.meter),a=ln(i);if(r===`breakdown`)return t===`fill`?45+(n-a)*9:55;switch(t){case`kick`:return n===0||n===a?112:92;case`backbeat`:return n===B(e.meter).heights[Kr(e.meter).at(-1)]?106:100;case`ghost`:return 32+14*e.style.sync;case`hat`:return ai(e,n)?78:n%2==0?66:50;case`pedal`:return 58;case`euclid`:case`clave`:return 72;case`fill`:{let e=r===`build`?a:un(i);return 50+(n-e)*(60/(i-e))}}}let ai=(e,t)=>B(e.meter).heights.includes(t);function oi(e,t){let{style:n,barEnergy:r,plan:i}=e,{step:a}=t;switch(t.part){case`drums`:return ii(e,t.role,a)*(.65+.35*r);case`bass`:return i.section.type===`breakdown`?70:(ai(e,a)?100:84)*(.75+.25*r);case`stab`:return 70+20*r;case`pad`:{let e=i.section.type===`breakdown`||r<.3?Math.max(.85,1-n.artic):1-n.artic;return 48+30*r*(.5+e/2)}case`lead`:return ai(e,a)?100:82}}function si(e,t){let{artic:n}=e.style,{part:r,length:i}=t;switch(r){case`drums`:return i;case`bass`:return e.plan.section.type===`breakdown`?i-.3:Math.max(.3,i*ni(1.02-.7*n,.3,1));case`pad`:return i;case`stab`:return i*ri(2.5,.45,n);case`lead`:return Math.max(.3,i*ni(1.05-.75*n,.25,1))}}let ci=on.filter(e=>e!==`clave`),li=e=>e.hits.every(e=>!ci.includes(e.role));function ui(e,t,n,r,i,a=[],o=[],s){let c=Lt(t),{hold:l,layer:u}=e.margins??{hold:.02,layer:.1},d=$t(e,c,n,r?.rhythmFragment,e=>e===null||!li(e),i,a,o,s);if(d===void 0)return{};let f=Qt(e.layered(c,n,d,i,u+l,a,s).filter(e=>e.distance<=u+l&&!o.includes(e.id)).filter(t=>{let r=e.read(t.id,n.meter,i);return r!==null&&li(r)}),r?.claveFragment,u,l,l);return f===void 0?{rhythmFragment:d}:{rhythmFragment:d,claveFragment:f}}function di(e,t,n,r,i,a){return[t.rhythmFragment,t.claveFragment].flatMap(t=>{let o=t===void 0?null:e.read(t,n,a);if(!o)return[];let s=r%o.bars;return o.hits.filter(e=>Math.floor(e.step/i)===s).map(e=>({...e,step:e.step-s*i}))})}let fi=e=>e.step*128+e.note;function pi(e){let t=/* @__PURE__ */ new Map;for(let n of e){let e=t.get(fi(n));(!e||on.indexOf(n.role)<on.indexOf(e.role))&&t.set(fi(n),n)}return[...t.values()].sort((e,t)=>e.step-t.step||e.note-t.note)}let mi=(e,t)=>({part:`drums`,role:e,step:t.step,note:t.note,length:1});function hi(e,t,n){if(!n.length)return[...t];let r=z(e.meter),i=n.filter(e=>e.step>=0&&e.step<r),a=(e,t)=>t.velocity-e.velocity||e.step-t.step,o=(t,n)=>oi(e,n)-oi(e,t)||t.step-n.step,s=new Set(t.map(e=>e.role)),c=ci.filter(e=>e!==`fill`&&s.has(e)).flatMap(e=>{let n=t.filter(t=>t.role===e),r=i.filter(t=>t.role===e).sort(a).slice(0,n.length).map(t=>mi(e,t)),s=new Set(r.map(fi)),c=n.filter(e=>!s.has(fi(e))).sort(o);return[...r,...c.slice(0,n.length-r.length)]}),l=t.filter(e=>e.role===`fill`),u=i.filter(e=>e.role===`clave`).map(e=>mi(`clave`,e));return pi([...c,...l,...u])}cn-1;let gi={mashing:12,fewest:3,widest:19,forgetAfter:16};new Set(Object.values(R).map(e=>z(e)));function _i(e,t=/* @__PURE__ */ new Set){let n=e=>e.degrees.filter(e=>e!==null).length,r=e=>e.confidence??1,i=e=>+!!t.has(e),a=null;for(let t of e)t.kind===`motif`&&(a===null||i(t)>i(a)||i(t)===i(a)&&(r(t)>r(a)||r(t)===r(a)&&n(t.motif)>n(a.motif)))&&(a=t);return a}let vi=.85,yi=vi**(gi.forgetAfter+.5);function bi(e,t,n){let r=Yr(e.map(e=>e.weight),vi,[]),i=e.map((e,t)=>({...e,weight:r[t]})).filter(e=>e.weight>=yi),a=[...i],o=[],s=[],c=/* @__PURE__ */ new Set;for(let e of t){if(e.kind!==`motif`)continue;let t=-1,r=null;for(;r===null&&++t<i.length;)r=Ee(e.motif,i[t].motif);if(r!==null){let{source:n,bar:a}=i[t];s.push({source:e.source,of:{source:n,bar:a},op:r}),c.add(e)}else t=a.findIndex((t,n)=>n>=i.length&&Ee(e.motif,t.motif)),t===-1&&(t=a.push({motif:e.motif,source:e.source,bar:n,weight:0,heard:0})-1);o.some(([e])=>e===t)||o.push([t,1])}let l=Yr(a.map(e=>e.weight),1,o),u=new Set(o.map(([e])=>e));return{memory:a.map((e,t)=>({...e,weight:l[t],heard:e.heard+ +!!u.has(t)})),recognised:s,confirmed:c}}let xi={initial:{offer:null,lastPlayed:null,memory:[]},advance({bar:e},t,{judgements:n,forget:r}){let{offer:i,lastPlayed:a}=t,o=null;r&&i&&(i=null,o=`asked`);let{memory:s,recognised:c,confirmed:l}=bi(t.memory,n,e);if(n.length>0){a=e;let t=_i(n,l),r=i!==null&&s.some(e=>e.heard>=2&&Ee(i.motif,e.motif)!==null);t&&(l.has(t)||!r)&&(i={motif:t.motif,source:t.source,bar:e,level:t.level})}else i&&a!==null&&e-a>gi.forgetAfter&&(i=null,o=`silence`);return{carried:{offer:i,lastPlayed:a,memory:s},output:{bar:e,judgements:n,offer:i,forgot:o,recognised:c}}}};function Si(e,t,n){let r=/* @__PURE__ */ new Map;for(let{step:t,note:n}of e)(!r.has(t)||n<r.get(t))&&r.set(t,n);return[...r.entries()].sort(([e],[t])=>e-t).map(([e,r])=>{let a=Dt(t,e),o=w(a.chord),s=i(r,12),c=o.findIndex(e=>i(e,12)===s);if(c>=0)return{step:e,chord:0,index:c,alter:0,shift:0};let l=t.find(e=>e.slot.step>a.slot.step)??n[0],u=l&&i(w(l.chord)[0],12);if(u!==void 0){let t=i(s-u+6,12)-6;if(Math.abs(t)<=1)return{step:e,chord:1,index:0,alter:0,shift:t}}return{step:e,chord:0,index:0,alter:0,shift:i(s-o[0]+6,12)-6}})}let Ci=e=>e.map(e=>`${e.step}:${e.chord}:${e.index}:${e.alter}:${e.shift}`).join(` `);function wi(e){let t=/* @__PURE__ */ new Map;for(let n of e){if(n.length<2)continue;let e=Ci(n),r=t.get(e);r?r.count++:t.set(e,{count:1,first:n})}let n=null;for(let e of t.values())(!n||e.count>n.count)&&(n=e);return n?n.first:null}let Ti={plain:0,pentatonic:1/3,blues:2/3};function Ei(e){return st.filter(t=>e.harm>=Ti[t])}function Di(e){return Ei(e)[0]}function Oi(e){return Math.round(6*e.harm)}function ki(e,t){return .5*Ln(t)+.3*e.entropy+.2*(1-e.artic)}function Ai(e){return{tempo:ji(e),keyReach:Math.max(1,Oi(e)),melodic:Ei(e)}}function ji(e){let t=.08333333333333333+e.entropy*.25;return{low:Math.max(-t,Math.log2(xn.bpm.min/e.bpm)),high:Math.min(t,Math.log2(xn.bpm.max/e.bpm))}}let Mi=(e,t,n)=>e*(1-n)+t*n;function Ni(e,t,n,r){let{artic:i}=t;switch(e){case`lead`:return{triangle:1.8*(1-i),square:i,cutoff:1400+2200*r,attack:Mi(.04,.006,i)};case`bass`:{let e=In(n);return{saw:1-e,triangle:1.6*e,cutoff:.6+.6*i,resonance:6-4*e}}case`pad`:case`stab`:return{attack:Mi(.3,.01,i),release:Mi(.7,.12,i)};case`drums`:return{}}}let Pi=e=>Math.max(1,Math.min(127,Math.round(e)));function Fi(e){let t=Math.round(e);return t>=1&&t<=127?e:e-t+Pi(t)}function Ii(e,t,n,...r){return(V(e,t,...r)-.5)*n*24}function Li(e,t,n,...r){return 1-V(e,t,...r)*n*.15}function Ri(e,t,n,r,i,...a){let o=V(e,`ownAccent`,an.indexOf(t),r,i,...a);return i%2==1?-o*14*n:i%4==2?o*10*n:(o-.5)*2*4*n}let zi={bass:`bassVelocity`,stab:`stabVelocity`,pad:`padVelocity`,lead:`leadVelocity`},Bi={bass:`bassLength`,stab:`stabLength`,pad:`padLength`,lead:`leadLength`};function Vi(e,t){let{accent:n}=t;return t.part===`lead`?Fi(n===void 0?oi(e,t):91+n):Fi(oi(e,t)+(n??0))}function Hi(e,{part:t,step:n,note:r},i,a){let{seed:o,bar:s}=e;return Pi(t===`drums`?i+Ii(o,`drumVelocity`,a,s,n,r)+Ri(o,`drums`,a,s,n,r):i+(Ii(o,zi[t],a,s,n)+Ri(o,t,a,s,n)))}function Ui(e,{part:t,step:n,note:r},i){let{seed:a,bar:o}=e;return t===`drums`?Li(a,`drumLength`,i,o,n,r):Li(a,Bi[t],i,o,n)}function Wi(e,{part:t,step:n,note:r,role:i},a,o){return{part:t,step:n,note:r,length:o,velocity:a,gain:a/127,...Ni(t,e.style,e.swing,e.barEnergy),...i!==void 0&&{role:i}}}function Gi(e,t){let n=ki(e.style,e.swing);return{...Wi(e,t,Hi(e,t,Vi(e,t),n),si(e,t)*Ui(e,t,n)),...t.accent!==void 0&&{accent:t.accent}}}let W=(e,t,n,r,i)=>({section:e,form:t,means:n,examples:r,doc:i}),Ki={bpm:{times:1,per:60,syntax:W(`rate`,`nbpm`,`n a minute: beats on a meter (a scan’s entries; meter(…)’s beats: 6/8 two, 7/8 three unequal; beat= says another count).`,[`&bar scan(4 4 4 4) step=84bpm`],`time.md`)},hz:{times:1,per:1,syntax:W(`rate`,`nhz`,`n a second (a plain number says the same).`,[`&a loop=440hz`],`time.md`)},min:{times:1,per:60,syntax:W(`rate`,`nmin`,`n a minute (wall-clock time: loop=1min turns once a minute).`,[`&tick scan(1!60) loop=1min`],`time.md`)},h:{times:1,per:3600,syntax:W(`rate`,`nh`,`n an hour.`,[`&hour scan(1!60) loop=1h`],`time.md`)},d:{times:1,per:86400,syntax:W(`rate`,`nd`,`n a day: a day meter, loop=1d (anchor= where it stands when play starts).`,[`&day scan(1!24) loop=1d anchor=11.55`],`time.md`)},wk:{times:1,per:604800,syntax:W(`rate`,`nwk`,`n a week.`,[`&week scan(1!7) loop=1wk`],`time.md`)},k:{times:1e3,per:1,syntax:W(`rate`,`nk`,`n thousand a second: a sample rate.`,[`&out loop=44.1k map=sample &mix`],`mix.md`)}},qi=new RegExp(Object.keys(Ki).sort((e,t)=>t.length-e.length).join(`|`),`y`),Ji=(e,t)=>{let n=t?Ki[t]:void 0;return n?e*n.times/n.per:e},Yi={largo:[40,60],larghetto:[60,66],adagio:[66,76],andante:[76,108],moderato:[108,120],allegro:[120,156],vivace:[156,176],presto:[168,200]};`${Object.entries(Yi).map(([e,[t,n]])=>`${e} ${t}–${n}`).join(`, `)}`;let Xi=`free(0 2 4 ~ …), a braid left to the performer, is a cell's whole braid: &riff over=&key free(0 2 4 ~), with nothing else as its braid`;function Zi(e,t,n){let r=e.i;if(e.match(/free\(/y)===null&&e.fail(`free(…)`),e.skipSpace(),e.peek()===`"`){let t=e.match(/"[^"]*"/y);e.skipSpace(),e.expect(`)`,`')' to close free("…")`);let n={key:`text`,value:0,unit:``,lo:0,hi:0,span:e.place(r),text:t.slice(1,-1)};return e.frees.push(n),n}(/(?:~|\[|-?[0-9.]+[#b]*(?:[@!*][0-9]+)?\s+[^\s,])/y.test(e.text.slice(e.i))||/^-?[0-9.]+[#b]*\)/.test(e.text.slice(e.i)))&&e.fail(Xi,r,e.i-r);let i=e.i,a=t===`shift`||t===`tonic`?e.noteName():null;a!==null&&/[0-9]/.test(e.text.slice(i,e.i))&&e.warn(`free(${e.text.slice(i,e.i)}): a key is a pitch class — the octave is left out: free(${e.text.slice(i,e.i).replace(/-?[0-9]+$/,``)})`,i,e.i-i);let o=a===null?e.match(/[a-z]+/y):null,s,c=``,l,u,d;if(a!==null)s=(a%12+12)%12,[l,u]=[0,11],d=[`C`,`C#`,`D`,`Eb`,`E`,`F`,`F#`,`G`,`Ab`,`A`,`Bb`,`B`];else if(o!==null){let n=Yi[o];(!n||t===`shift`||t===`stride`||t===`gain`||t===`tonic`)&&e.fail(`free(${o}): a tempo marking (${Object.keys(Yi).join(`, `)}) — for a rate`,r,e.i-r),[l,u]=n,s=Math.round((l+u)/2),c=`bpm`}else{let t=e.match(/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y);t===null&&e.fail(`free(default, lo..hi), like free(90bpm, 60..240) or free(.8, 0..1)`),s=parseFloat(t),n&&(c=e.match(qi)??``),e.skipSpace(),e.expect(`,`,`',' then the range, like free(${t}${c}, 60..240)`),e.skipSpace();let i=e.match(/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y);e.match(/\.\./y)===null&&e.fail(`a range lo..hi, like 60..240`);let a=e.match(/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y);(i===null||a===null)&&e.fail(`a range lo..hi, like 60..240`),l=parseFloat(i),u=parseFloat(a),l<u||e.fail(`free(…): the range runs low to high (${l}..${u})`,r,e.i-r),(s<l||s>u)&&e.fail(`free(…): ${s} is outside ${l}..${u}`,r,e.i-r)}e.skipSpace();let f;if(e.peek()===`,`){e.i++,e.skipSpace();let t=e.match(/"[^"]*"/y);t===null&&e.fail(`names for the choices, in quotes: free(0, 0..3, "a b c d")`),f=t.slice(1,-1).trim().split(/\s+/).filter(Boolean);let n=f.length>1?(u-l)/(f.length-1):0;if(a!==null){let n=e.text.lastIndexOf(`,`,e.i-t.length);e.warn(`free(${e.text.slice(i,n).trim()}, ${t}): a key by name has the twelve pitch names as its choices, so these names are ignored (names of your own go on a range: free(3, 0..11, "…"))`,n,e.i-n),f=void 0}else(!Number.isInteger(l)||!Number.isInteger(u)||f.length<2||!Number.isInteger(n)||n<1)&&e.fail(`free(…, "${f.join(` `)}"): the names spread evenly over ${l}..${u} — ${f.length} names need ${f.length-1} equal whole steps (${l}..${l+f.length-1}, or every 2nd: ${l}..${l+2*(f.length-1)})`,r,e.i-r);e.skipSpace()}e.expect(`)`,`')' to close free(…)`),f??=d;let p={key:t,value:s,unit:c,lo:l,hi:u,span:e.place(r),...f?{labels:f}:{},...a===null?{}:{byName:!0}};return e.frees.push(p),p}let Qi=(e,t)=>(e%t+t)%t,$i=[{name:`Locrian`,intervals:[0,1,3,5,6,8,10]},{name:`Phrygian`,intervals:[0,1,3,5,7,8,10]},{name:`Aeolian`,intervals:[0,2,3,5,7,8,10]},{name:`Dorian`,intervals:[0,2,3,5,7,9,10]},{name:`Mixolydian`,intervals:[0,2,4,5,7,9,10]},{name:`Ionian`,intervals:[0,2,4,5,7,9,11]},{name:`Lydian`,intervals:[0,2,4,6,7,9,11]}],ea={major:{steps:[2,2,1,2,2,2,1],name:`Ionian`},minor:{steps:[2,1,2,2,1,2,2],name:`Aeolian`},ionian:{steps:[2,2,1,2,2,2,1],name:`Ionian`},dorian:{steps:[2,1,2,2,2,1,2],name:`Dorian`},phrygian:{steps:[1,2,2,2,1,2,2],name:`Phrygian`},lydian:{steps:[2,2,2,1,2,2,1],name:`Lydian`},mixolydian:{steps:[2,2,1,2,2,1,2],name:`Mixolydian`},aeolian:{steps:[2,1,2,2,1,2,2],name:`Aeolian`},locrian:{steps:[1,2,2,1,2,2,2],name:`Locrian`},harmonic:{steps:[2,1,2,2,1,3,1],name:`Harmonic minor`},melodic:{steps:[2,1,2,2,2,2,1],name:`Melodic minor`},pentatonic:{steps:[2,2,3,2,3],name:`Pentatonic`},minorpentatonic:{steps:[3,2,2,3,2],name:`Minor pentatonic`},blues:{steps:[3,2,1,1,3,2],name:`Blues`},wholetone:{steps:[2,2,2,2,2,2],name:`Whole tone`}};function ta(e){let t=$i[e]?.name.toLowerCase()??`major`;return t===`ionian`?`major`:t===`aeolian`?`minor`:t}function na(e,t,n=0,r){let i=r=>Math.floor((r*t+n)/e);return r===void 0?Array.from({length:e},(e,t)=>i(t)):[i(r)]}let ra={"4/4":[0,3.24,6,9.12],"3/4":[0,3.36,7.8]};function ia(e,t){return[...ra[`${e}/${t}`]??Array.from({length:e},(t,n)=>n*12/e)]}function aa(e,t){return e.map((n,r)=>+((r+1<e.length?e[r+1]:e[0]+t)-n).toFixed(6))}function oa(e){let t=[],n=0;for(let r of e)t.push(+n.toFixed(6)),n+=r;return{positions:t,lap:+n.toFixed(6)}}function sa(e){let t=/^([A-G])(#|b)?(-?[0-9]+)?$/.exec(e);return t?{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[t[1]]+(t[2]===`#`?1:t[2]===`b`?-1:0)+12*((t[3]===void 0?4:parseInt(t[3],10))-4):null}let ca=[[`1P 2M 3M 5P 6M`,`major pentatonic`,`pentatonic`],[`1P 2M 3M 4P 5P 6M 7M`,`major`,`ionian`],[`1P 2M 3m 4P 5P 6m 7m`,`minor`,`aeolian`],[`1P 2M 3m 3M 5P 6M`,`major blues`],[`1P 3m 4P 5d 5P 7m`,`minor blues`,`blues`],[`1P 2M 3m 4P 5P 6M 7M`,`melodic minor`],[`1P 2M 3m 4P 5P 6m 7M`,`harmonic minor`],[`1P 2M 3M 4P 5P 6M 7m 7M`,`bebop`],[`1P 2M 3m 4P 5d 6m 6M 7M`,`diminished`,`whole-half diminished`],[`1P 2M 3m 4P 5P 6M 7m`,`dorian`],[`1P 2M 3M 4A 5P 6M 7M`,`lydian`],[`1P 2M 3M 4P 5P 6M 7m`,`mixolydian`,`dominant`],[`1P 2m 3m 4P 5P 6m 7m`,`phrygian`],[`1P 2m 3m 4P 5d 6m 7m`,`locrian`],[`1P 3M 4P 5P 7M`,`ionian pentatonic`],[`1P 3M 4P 5P 7m`,`mixolydian pentatonic`,`indian`],[`1P 2M 4P 5P 6M`,`ritusen`],[`1P 2M 4P 5P 7m`,`egyptian`],[`1P 3M 4P 5d 7m`,`neapolitan major pentatonic`],[`1P 3m 4P 5P 6m`,`vietnamese 1`],[`1P 2m 3m 5P 6m`,`pelog`],[`1P 2m 4P 5P 6m`,`kumoijoshi`],[`1P 2M 3m 5P 6m`,`hirajoshi`],[`1P 2m 4P 5d 7m`,`iwato`],[`1P 2m 4P 5P 7m`,`in-sen`],[`1P 3M 4A 5P 7M`,`lydian pentatonic`,`chinese`],[`1P 3m 4P 6m 7m`,`malkos raga`],[`1P 3m 4P 5d 7m`,`locrian pentatonic`,`minor seven flat five pentatonic`],[`1P 3m 4P 5P 7m`,`minor pentatonic`,`vietnamese 2`],[`1P 3m 4P 5P 6M`,`minor six pentatonic`],[`1P 2M 3m 5P 6M`,`flat three pentatonic`,`kumoi`],[`1P 2M 3M 5P 6m`,`flat six pentatonic`],[`1P 2m 3M 5P 6M`,`scriabin`],[`1P 3M 5d 6m 7m`,`whole tone pentatonic`],[`1P 3M 4A 5A 7M`,`lydian #5p pentatonic`],[`1P 3M 4A 5P 7m`,`lydian dominant pentatonic`],[`1P 3m 4P 5P 7M`,`minor #7m pentatonic`],[`1P 3m 4d 5d 7m`,`super locrian pentatonic`],[`1P 2M 3m 4P 5P 7M`,`minor hexatonic`],[`1P 2A 3M 5P 5A 7M`,`augmented`],[`1P 2M 4P 5P 6M 7m`,`piongio`],[`1P 2m 3M 4A 6M 7m`,`prometheus neapolitan`],[`1P 2M 3M 4A 6M 7m`,`prometheus`],[`1P 2m 3M 5d 6m 7m`,`mystery #1`],[`1P 2m 3M 4P 5A 6M`,`six tone symmetric`],[`1P 2M 3M 4A 5A 6A`,`whole tone`,`messiaen's mode #1`],[`1P 2m 4P 4A 5P 7M`,`messiaen's mode #5`],[`1P 2M 3M 4P 5d 6m 7m`,`locrian major`,`arabian`],[`1P 2m 3M 4A 5P 6m 7M`,`double harmonic lydian`],[`1P 2m 2A 3M 4A 6m 7m`,`altered`,`super locrian`,`diminished whole tone`,`pomeroy`],[`1P 2M 3m 4P 5d 6m 7m`,`locrian #2`,`half-diminished`,`aeolian b5`],[`1P 2M 3M 4P 5P 6m 7m`,`mixolydian b6`,`melodic minor fifth mode`,`hindu`],[`1P 2M 3M 4A 5P 6M 7m`,`lydian dominant`,`lydian b7`,`overtone`],[`1P 2M 3M 4A 5A 6M 7M`,`lydian augmented`],[`1P 2m 3m 4P 5P 6M 7m`,`dorian b2`,`phrygian #6`,`melodic minor second mode`],[`1P 2m 3m 4d 5d 6m 7d`,`ultralocrian`,`superlocrian bb7`,`superlocrian diminished`],[`1P 2m 3m 4P 5d 6M 7m`,`locrian 6`,`locrian natural 6`,`locrian sharp 6`],[`1P 2A 3M 4P 5P 5A 7M`,`augmented heptatonic`],[`1P 2M 3m 4A 5P 6M 7m`,`dorian #4`,`ukrainian dorian`,`romanian minor`,`altered dorian`],[`1P 2M 3m 4A 5P 6M 7M`,`lydian diminished`],[`1P 2M 3M 4A 5A 7m 7M`,`leading whole tone`],[`1P 2M 3M 4A 5P 6m 7m`,`lydian minor`],[`1P 2m 3M 4P 5P 6m 7m`,`phrygian dominant`,`spanish`,`phrygian major`],[`1P 2m 3m 4P 5P 6m 7M`,`balinese`],[`1P 2m 3m 4P 5P 6M 7M`,`neapolitan major`],[`1P 2M 3M 4P 5P 6m 7M`,`harmonic major`],[`1P 2m 3M 4P 5P 6m 7M`,`double harmonic major`,`gypsy`],[`1P 2M 3m 4A 5P 6m 7M`,`hungarian minor`],[`1P 2A 3M 4A 5P 6M 7m`,`hungarian major`],[`1P 2m 3M 4P 5d 6M 7m`,`oriental`],[`1P 2m 3m 3M 4A 5P 7m`,`flamenco`],[`1P 2m 3m 4A 5P 6m 7M`,`todi raga`],[`1P 2m 3M 4P 5d 6m 7M`,`persian`],[`1P 2m 3M 5d 6m 7m 7M`,`enigmatic`],[`1P 2M 3M 4P 5A 6M 7M`,`major augmented`,`major #5`,`ionian augmented`,`ionian #5`],[`1P 2A 3M 4A 5P 6M 7M`,`lydian #9`],[`1P 2m 2M 4P 4A 5P 6m 7M`,`messiaen's mode #4`],[`1P 2m 3M 4P 4A 5P 6m 7M`,`purvi raga`],[`1P 2m 3m 3M 4P 5P 6m 7m`,`spanish heptatonic`],[`1P 2M 3m 3M 4P 5P 6M 7m`,`bebop minor`],[`1P 2M 3M 4P 5P 5A 6M 7M`,`bebop major`],[`1P 2m 3m 4P 5d 5P 6m 7m`,`bebop locrian`],[`1P 2M 3m 4P 5P 6m 7m 7M`,`minor bebop`],[`1P 2M 3M 4P 5d 5P 6M 7M`,`ichikosucho`],[`1P 2M 3m 4P 5P 6m 6M 7M`,`minor six diminished`],[`1P 2m 3m 3M 4A 5P 6M 7m`,`half-whole diminished`,`dominant diminished`,`messiaen's mode #2`],[`1P 3m 3M 4P 5P 6M 7m 7M`,`kafi raga`],[`1P 2M 3M 4P 4A 5A 6A 7M`,`messiaen's mode #6`],[`1P 2M 3m 3M 4P 5d 5P 6M 7m`,`composite blues`],[`1P 2M 3m 3M 4A 5P 6m 7m 7M`,`messiaen's mode #3`],[`1P 2m 2M 3m 4P 4A 5P 6m 6M 7M`,`messiaen's mode #7`],[`1P 2m 2M 3m 3M 4P 5d 5P 6m 6M 7m 7M`,`chromatic`]];function la(e){let t=/^([1-7])([PMmAd])$/.exec(e);if(!t)throw Error(`not an interval: ${e}`);let n=Number(t[1]);return[0,2,4,5,7,9,11][n-1]+{P:0,M:0,m:-1,A:1,d:n===1||n===4||n===5?-1:-2}[t[2]]}let ua=Object.fromEntries(ca.flatMap(([e,...t])=>{let n=e.split(` `).map(la),r=n.map((e,t)=>(n[t+1]??12)-e);return t.map(e=>[e,r])}));function da(e,t){e.i++;let n=[];for(;e.skipSpace(),e.peek()!==`)`;){let t=e.i;if(e.text.startsWith(`geo(`,e.i)){e.i+=4,e.skipSpace();let r=e.num(`a ratio, like geo(5, 25, 0 10 5)`).value;e.skipSpace(),e.expect(`,`,`',' then the steps per ratio: geo(${r}, 25, 0 10 5)`),e.skipSpace();let i=e.int(`the steps per ratio`);e.skipSpace(),e.expect(`,`,`',' then the exponents: geo(${r}, ${i}, 0 10 5)`);let a=[];for(;e.skipSpace(),e.peek()!==`)`;)a.push(e.num(`an exponent`).value);e.i++,(!(r>0)||i<1||a.length===0)&&e.fail(`geo(r, n, k …): r above 0, n ≥ 1, at least one k`,t,e.i-t);for(let e of a)n.push(+(r**+(e/i)).toFixed(9));continue}if(e.text.startsWith(`free(`,e.i)){let r=Zi(e,`interval`,!1);r.lo>0||e.fail(`A scan interval stays positive: give free(…) a range above 0`,t,e.i-t),n.push(r.value)}else{let r=e.match(/[0-9]+(?:\.[0-9]+)?|\.[0-9]+/y);(r===null||!(parseFloat(r)>0))&&e.fail(`scan(…) takes positive intervals, like scan(2 2 1 2 2 2 1)`,t);let i=1;if(e.peek()===`!`){e.i++;let n=e.match(/[0-9]+/y);(n===null||!(parseInt(n,10)>=1))&&e.fail(`x!n repeats an interval n times: scan(1!4 2)`,t,e.i-t),i=parseInt(n,10)}for(let e=0;e<i;e++)n.push(parseFloat(r))}e.skipSpace(),e.peek()===`,`&&e.i++}e.expect(`)`,`')' to close scan(…)`),n.length===0&&e.fail(`scan(…) needs at least one interval`,t,e.i-t);let r=e.span(t);return e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`),{kind:`scan`,steps:n,span:r}}function fa(e,t){if(e<=0)return Array(t).fill(!1);let n=Array.from({length:e},()=>[!0]),r=Array.from({length:t-e},()=>[!1]);for(;r.length>1;){let e=Math.min(n.length,r.length),t=Array.from({length:e},(e,t)=>[...n[t],...r[t]]),i=n.length>e?n.slice(e):r.slice(e);n=t,r=i}return[...n,...r].flat()}function pa(e,t){e.i++,e.skipSpace();let n;if(e.peek()===`f`)n=Zi(e,`text`,!1).text??``;else{let t=e.match(/"[^"]*"/y);t===null&&e.fail(`spell(text, &table, "names"): the text first — "867 5309" or free("867 5309")`),n=t.slice(1,-1)}e.skipSpace(),e.expect(`,`,`',' then the table, like spell("867", &keys, "1 2 3 …")`),e.skipSpace();let r=e.cellRef(`the table its characters pick from, like &keys`,`in spell(…)`);e.skipSpace(),e.expect(`,`,`',' then the names of the table's entries, in quotes`),e.skipSpace();let i=e.match(/"[^"]*"/y);i===null&&e.fail(`the names of the table’s entries, in quotes: "1 2 3 A 4 5 6 B …"`);let a=i.slice(1,-1).trim().split(/\s+/).filter(Boolean);e.skipSpace(),e.expect(`)`,`')' to close spell(…)`);let o=e.span(t);e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);let s={atom:{kind:`rest`},repeat:1,subdivide:1,elongate:1,span:o},c=[...n].flatMap(e=>{let t=a.indexOf(e);return t<0?[s,s]:[{atom:{kind:`ref`,name:r.name,pick:{kind:`at`,i:t,abs:!0},shift:0},repeat:1,subdivide:1,elongate:1,span:o},s]});return c.length||c.push(s),{kind:`list`,tokens:c,span:o}}let ma={"2/4":[1,1],"3/4":[1,1,1],"4/4":[1,1,1,1],"5/4":[1,1,1,1,1],"6/8":[3,3],"7/8":[3,2,2],"9/8":[3,3,3],"10/8":[3,2,3,2],"12/8":[3,3,3,3],"5/8":[3,2]};function ha(e,t){let[n,r]=e.split(`/`).map(e=>parseInt(e,10)),i=ma[e]??[];return{pulses:n,unit:r,beats:e.endsWith(`/8`)?i:i.map(()=>1),sub:t}}function ga(e,t){if(/^[*+\-.,]+$/.test(e))return e;let n=ma[e];if(!n)return``;let r=e.endsWith(`/8`),i=``;return n.forEach((e,n)=>{if(r)for(let r=0;r<e;r++){i+=r===0?n===0?`*`:`+`:`.`;for(let e=1;e<t;e++)i+=`,`}else{i+=n===0?`*`:`+`;for(let e=1;e<t;e++)i+=t%2==0&&e===t/2||t===3?`.`:`,`}}),i}function _a(e,t){e.i++,e.skipSpace();let n=t=>{if(e.peek()===`"`)return e.match(/"[^"]*"/y).slice(1,-1);if(e.peek()===`f`){let t=Zi(e,`choice`,!1);return t.key===`text`||t.text!==void 0?t.text??``:t.labels?t.labels[Math.round((t.value-t.lo)/((t.hi-t.lo)/Math.max(1,t.labels.length-1)||1))]??``:String(t.value)}let n=e.match(/[0-9]+/y);return n===null&&e.fail(`${t}: in quotes ("4/4"), a number, or free(…)`),n},r=n(`the time signature`);e.skipSpace();let i=1;e.peek()===`,`&&(e.i++,e.skipSpace(),i=Math.max(1,Math.min(8,parseInt(n(`steps a pulse`),10)||1)),e.skipSpace()),e.expect(`)`,`')' to close meter(…)`);let a=e.span(t);e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);let o=ga(r,i);o||e.fail(`meter("${r}"): a time signature (${Object.keys(ma).join(` `)}) or levels like "*.+.+.+." (* bar, + beat, . subdivision, , finer)`,t,a.len);let s=e=>Math.max(0,`*+-.,`.indexOf(e)),c=[...o].map(e=>({atom:{kind:`note`,value:s(e),alter:0},repeat:1,subdivide:1,elongate:1,span:a})),l=[...o].filter(e=>e===`*`||e===`+`).length||1;return{kind:`list`,tokens:c,span:a,perBeat:o.length/l,...ma[r]?{signature:ha(r,i)}:{}}}function va(e,t,n){e.i++;let r=[];for(;e.skipSpace(),r.push(e.int(`a number in ${t}(…)`)),e.skipSpace(),e.peek()===`,`;)e.i++;e.expect(`)`,`')' to close ${t}(…)`);let i=e.span(n);return e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`),{args:r,span:i}}function ya(e,t){let{args:n,span:r}=va(e,`euclid`,t),[i,a,o=0]=n;(n.length<2||n.length>3||!(a>=1)||!(i>=0&&i<=a))&&e.fail(`euclid(k, n): k hits spread evenly over n steps (0 ≤ k ≤ n), euclid(k, n, shift) turned`,t,r.len);let s=fa(i,a);return{kind:`list`,tokens:Array.from({length:a},(e,t)=>{let n=((t-o)%a+a)%a;return{atom:s[n]?{kind:`note`,value:0,alter:0}:{kind:`rest`},repeat:1,subdivide:1,elongate:1,span:r}}),span:r}}let ba={sin:`a sine`,saw:`a saw`,tri:`a triangle`,square:`a square`},xa=e=>(t,n)=>{let{args:r,span:i}=va(t,e,n),[a]=r;return(r.length!==1||a<2)&&t.fail(`${e}(n): one cycle of ${ba[e]} in n steps, n ≥ 2`,n,i.len),{kind:`wave`,shape:e,n:a,span:i}};function Sa(e,t){let n=t=>e===`sin`?Math.sin(2*Math.PI*t):e===`saw`?2*t-1:e===`tri`?t<.5?4*t-1:3-4*t:Math.floor(2*t)%2?1:-1;return Array.from({length:t},(e,r)=>+n(r/t).toFixed(6)+0)}let Ca={C:0,D:2,E:4,F:5,G:7,A:9,B:11},wa=e=>[`C`,`C#`,`D`,`Eb`,`E`,`F`,`F#`,`G`,`Ab`,`A`,`Bb`,`B`][(e%12+12)%12];function Ta(e,t){e.i++,e.skipSpace();let n,r=0,i=`0`,a=e.match(/-?[0-9]+/y),o=a===null?e.match(/"[^"]*"/y):null;if(o!==null){let a=/^"([A-G](?:#|b)?)([0-9]*)((?::[a-z0-9#'-]+)+)"$/.exec(o);a||e.fail(`scale("tonic:name"): a tonic and a scale's name, as in Strudel — scale("D:minor"), scale("F#:harmonic:minor")`,t,e.i-t),a[2]&&e.fail(`scale("${a[1]}${a[2]}:…"): the octave is the voice's (loop=), not the scale's: scale("${a[1]}${a[3]}")`,t,e.i-t);let s=a[3].slice(1).split(`:`),[c,l]=[s.join(` `),s.join(``)],u=Object.hasOwn(ua,c)?ua[c]:Object.hasOwn(ea,l)?ea[l].steps:void 0;u||e.fail(`scale("…${a[3]}"): a scale by name — ours (${Object.keys(ea).join(` `)}) or tonal's, as Strudel reads them (harmonic:minor, minor:pentatonic, whole:tone, diminished, chromatic, bebop … listed in tables.md)`,t,e.i-t),n=[...u];let d=a[1];r=((Ca[d[0]]+(d[1]===`#`?1:d[1]===`b`?-1:0))%12+12)%12,i=String(r),e.skipSpace(),e.expect(`)`,`')' to close scale(…)`)}else if(a!==null){e.skipSpace(),e.expect(`,`,`',' then the mode — better by name: scale(minor, A)`),e.skipSpace();let o=e.i,s=e.int(`the mode, 0 (the darkest) to 6`);s>6&&e.fail(`scale(tonic, phase): the phase is a mode, 0 (the darkest, Locrian) to 6 (the brightest, Lydian) — not ${s}`,o,String(s).length),r=parseInt(a,10),i=a,n=aa(na(7,12,s),12),e.skipSpace(),e.expect(`)`,`')' to close scale(…)`),e.warn(`scale(${r}, ${s}) is written scale(${ta(s)}, ${wa(r)}): the mode by name, then the tonic`,t,e.i-t)}else{let t=e.i,a=e.match(/[a-z]+/y),o=a?ea[a]:void 0;if(o||e.fail(`scale(name, tonic): a scale by name — ${Object.keys(ea).join(` `)}`,t,Math.max(1,(a??``).length)),n=[...o.steps],e.skipSpace(),e.peek()===`,`){e.i++,e.skipSpace();let t=e.i,n=e.match(/[A-G](?:#|b)?(?![A-Za-z0-9])/y);n===null?e.text.startsWith(`free(`,e.i)?(r=Math.round(Zi(e,`tonic`,!1).value),i=e.text.slice(t,e.i)):(r=e.int(`the tonic: a note name (D, F#, Bb), a number or free(…)`),i=String(r),Math.abs(r)>11&&e.warn(`scale(…, ${r}): the tonic is a pitch class, 0 (C) to 11 (B)`,t,e.i-t)):(r=((Ca[n[0]]+(n[1]===`#`?1:n[1]===`b`?-1:0))%12+12)%12,i=String(r)),e.skipSpace()}e.expect(`)`,`')' to close scale(…)`)}let s=e.span(t),c=`key:λ${e.line}_${t+e.offset}`;return e.lambdas.push({name:c,span:s,lambda:`shift=${i}`,over:null,shift:r,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:{kind:`blank`}}),{steps:n,key:{name:c,pick:null,shift:0,span:s},span:s}}function Ea(e,t){e.i++,e.skipSpace();let n=0;if(e.peek()!==`)`){let t=e.i,r=e.noteName();if(n=r===null?e.int(`how many fifths round it starts (fifths(1): on G), or the note it starts on: fifths(G)`):(r%12+12)%12*7%12,r===null&&Math.abs(n)>11){let r=Math.trunc(n/12),i=n%12,a=`C G D A E B F# C# Ab Eb Bb F`.split(` `)[(i+12)%12];e.warn(`fifths(${n}): the circle comes round after 12, and a turn past a lap climbs one, as every shift does: fifths(${i}) ${r>0?`up`:`down`} ${Math.abs(r)} octave${Math.abs(r)===1?``:`s`}${i?` (fifths(${a}) names the note, no octave)`:``}`,t,e.i-t)}e.skipSpace()}e.expect(`)`,`')' to close fifths(…)`);let r=e.span(t);return{braid:{kind:`list`,tokens:Array.from({length:12},(e,t)=>({atom:{kind:`note`,value:t*7%12,alter:0},repeat:1,subdivide:1,elongate:1,span:r})),span:r},shift:n}}let Da=W(`generator`,`sin(n) · saw(n) · tri(n) · square(n)`,`One cycle of a waveform in n steps, from −1 to 1, as Strudel's bipolar signals (sine2, saw2, tri2, square2) at each step: a sine from 0, a saw rising from −1, a triangle rising from −1 to 1 at the half and falling back, a square −1 then 1. A waveform, or a slow swell.`,[`&sine loop=220 sin(12)`,`&ramp loop=220 saw(8)`,`&swell map=lin loop=.25 tri(4)`,`&pulse loop=110 square(2)`],`braid.md`),Oa={scan:{parse:da,syntax:W(`generator`,`scan(i …)`,"Running totals of intervals: a scale or a meter. An interval can repeat (`1!4`), be geometric (`geo(r, n, k …)`: r^(k/n) for each k) or be `free(…)`.",[`&major scan(2 2 1 2 2 2 1)`,`&bar scan(27 23 26 24) step=84bpm`,`&tempo scan(1!4 .5!2)`,`&series scan(geo(5, 25, 0 10 5))`,`&swing scan(free(2, 1..3) 1)`],`braid.md`)},euclid:{parse:ya,syntax:W(`generator`,`euclid(k, n) · euclid(k, n, shift)`,`k hits spread as evenly as they go over n steps (the Euclidean rhythms), turned right by shift steps, as Strudel's (k, n, r).`,[`&tresillo euclid(3, 8)`,`&clave euclid(5, 16, 2)`],`braid.md`)},sin:{parse:xa(`sin`),syntax:Da},saw:{parse:xa(`saw`),syntax:Da},tri:{parse:xa(`tri`),syntax:Da},square:{parse:xa(`square`),syntax:Da},scale:{parse:(e,t)=>e.fail(`scale(…) is read by its cell`,t,5),syntax:W(`generator`,`scale(name) · scale(name, tonic) · scale("tonic:name")`,`A scale by name over the 12, turned to its tonic (a note name, a number or free(…); C if left out): the scan of its steps over a key of its own. Its shift= walks its modes; the tonic transposes. The names: ${Object.keys(ea).join(` `)}. Strudel's spelling reads the same: scale("D:minor"), its words after colons (scale("F#:harmonic:minor")), with every scale tonal knows (${Object.keys(ua).length} names: whole:tone, diminished, bebop:major, chromatic …); the octave is the voice's, not the scale's.`,[`&scale scale(minor, D)`,`&blues scale(blues)`,`&scale scale(dorian, free(2, 0..11))`,`&scale scale("F#:harmonic:minor")`],`tables.md`)},fifths:{parse:(e,t)=>e.fail(`fifths(…) is read by its cell`,t,6),syntax:W(`generator`,`fifths() · fifths(n) · fifths(note)`,`The circle of fifths: the twelve pitch classes a fifth apart, C G D A E B F# C# Ab Eb Bb F, as written from C; turned n fifths round, or to start on a note (its shift=: [0] is where it starts, [$0] is C). Drawn round its wheel in its own order.`,[`&circle fifths()`,`&circleG fifths(1)`,`&circleG fifths(G)`],`tables.md`)},meter:{parse:_a,syntax:W(`generator`,`meter("sig") · meter("sig", sub) · meter("levels")`,`A bar as levels, one per step: 0 the downbeat, 1 a beat, then finer. A time signature (${Object.keys(ma).join(` `)}) with sub steps a pulse, or levels written out (* bar, + beat, - half, . subdivision, , finer). Its bpm counts beats. Each argument can be free(…).`,[`&bar meter("4/4", 2) step=100bpm`,`&bar meter("6/8") step=60bpm`,`&bar meter("*.+.+..") step=90bpm`],`time.md`)},spell:{parse:pa,syntax:W(`generator`,`spell("text", &table, "names")`,`A text spelled through a table: each character that is one of the names plays that entry of the table, then a pause; anything else rests as long. The text can be free("…"), a field to type in.`,[`&dial spell("867 5309", &keys, "1 2 3 A 4 5 6 B 7 8 9 C * 0 # D")`,`&dial spell(free("867 5309"), &keys, "1 2 3 A 4 5 6 B 7 8 9 C * 0 # D")`],`braid.md`)}};function ka(e,t,n){let r=new Set(na(e,t,n).map(e=>(e%t+t)%t)),i=fa(e,t);for(let n=0;n<t;n++)if(i.every((e,a)=>i[((a-n)%t+t)%t]===r.has(a)))return`euclid(${e}, ${t}${n?`, ${n}`:``})`;return Array.from({length:t},(e,t)=>r.has(t)?`0`:`~`).join(` `)}let Aa={even:(e,t)=>{let{args:n,span:r}=va(e,`even`,t),[i,a=12,o=0]=n,s=i>=1&&a>=i?aa(na(i,a,o),a):null;return e.fail(s?`even(…) is gone: for a scale write scan(${s.join(` `)}); for a rhythm, ${ka(i,a,o)}`:`even(…) is gone: write the intervals, scan(2 2 1 2 2 2 1), or a rhythm, euclid(3, 8)`,t,r.len)},agogic:(e,t)=>{let{args:n,span:r}=va(e,`agogic`,t),[i,a]=n,o=ia(i,a).map(e=>Math.round(e/12*100));return e.fail(`agogic(…) is gone: write the beats as a scan, scan(${aa(o,100).join(` `)})`,t,r.len)}},ja=e=>e in Oa||e in Aa;function Ma(e,t,n){return(Oa[t]?.parse??Aa[t])(e,n)}let Na={kick:`bd`,rim:`rim`,snare:`sd`,closedHat:`hh`,pedalHat:`ph`,openHat:`oh`,ride:`rd`},Pa=new Map([...Object.keys(Na).map(e=>[U[e],Na[e]]),[75,`claves`]]);function Fa(e){if(e>=127)return`1`;let t=e/127;return(t*t).toFixed(6).replace(/0+$/,``).replace(/^0/,``)}function Ia(e,t=cn){let n=e.length;if(n===0||n>=t)return null;let r=[...e].sort((e,t)=>e-t).join(),i=fa(n,t).flatMap((e,t)=>e?[t]:[]);for(let e=0;e<t;e++)if(i.map(n=>(n+e)%t).sort((e,t)=>e-t).join()===r)return{k:n,r:e};return null}let La=e=>[...e].sort((e,t)=>e.step-t.step||e.note-t.note),Ra=e=>e>=127?``:`:0:${Fa(e)}`,za=(e,t)=>Array.from({length:e},(e,n)=>t(n)).join(` `);function Ba(e,t){let{role:n}=e[0],r=new Set(e.map(e=>e.note)),i=n===`euclid`&&r.size===1?Ia(e.map(e=>e.step),t):null;if(i){let r=Pa.get(e[0].note),a=t=>e.find(e=>e.step===t)?.velocity;return{lines:[`&${n} step=1m &${r}(${i.k},${t},${i.r})`,`&${n}Level map=amp step=16n ${za(t,e=>a(e)?Fa(a(e)):`0`)}`],term:`&${n} * &${n}Level`}}return{lines:[`&${n} step=16n ${za(t,t=>{let n=e.filter(e=>e.step===t).map(e=>`&${Pa.get(e.note)}${Ra(e.velocity)}`);return n.length===0?`~`:n.length===1?n[0]:`[${n.join(`,`)}]`})}`],term:`&${n}`}}function Va(e,t){let n=La(e),r=n.find(e=>!Pa.has(e.note));if(r)throw Error(`grooveText: note ${r.note} is none of the kit's`);let i=on.filter(e=>n.some(t=>t.role===e)).map(e=>Ba(n.filter(t=>t.role===e),t)),a=[...new Set(n.map(e=>Pa.get(e.note)))];return[...i.flatMap(e=>e.lines),`&drums map=midi(10) ${i.length?`[${i.map(e=>e.term).join(`, `)}]`:`~`}`,...a.map(e=>`&${e} s=white`)].join(`
`)}let Ha=e=>La(e).map(e=>`${e.role}:${e.note}:${e.step}`).join(` `);function Ua(e){let t=/* @__PURE__ */ new Map;for(let n of e){if(n.length<3)continue;let e=Ha(n),r=t.get(e);r?r.count++:t.set(e,{count:1,first:n})}let n=null;for(let e of t.values())(!n||e.count>n.count)&&(n=e);return n?La(n.first):null}let Wa=[];function Ga(e,t,n=.5){let r=[...e.map(e=>e.id)];for(let e of t)r.includes(e)||r.push(e);let i=Yr(r.map(t=>e.find(e=>e.id===t)?.weight??0),n,t.map(e=>[r.indexOf(e),1]));return r.map((e,t)=>({id:e,weight:i[t]})).filter(e=>e.weight>=.25)}let Ka=e=>e.map(e=>e.id);function qa(e){return e===`bridge`||e===`breakdown`?`B`:e===`build`?`build`:`A`}let Ja={aeolian:{0:{5:3,3:3,6:2,4:1,2:1},1:{4:3,6:1},2:{5:2,6:2,3:2,0:1},3:{0:2,4:2,6:2,5:1},4:{0:4,5:1},5:{6:3,2:2,3:2,4:1},6:{0:3,2:3,5:1}},dorian:{0:{3:4,6:2,4:1,2:1},1:{0:2,3:1},2:{3:2,0:1},3:{0:4,6:1},4:{0:2,3:1},5:{0:1,3:1},6:{0:3,3:1}},ionian:{0:{3:3,4:3,5:3,1:1},1:{4:4,6:1},2:{5:3,3:2},3:{4:3,0:2,1:2},4:{0:4,5:2},5:{3:3,1:2,4:1},6:{0:3}},mixolydian:{0:{6:4,3:3,4:1},1:{0:1,6:1},2:{3:1},3:{0:3,6:1},4:{0:2},5:{6:1,3:1},6:{0:3,3:2}}},Ya={aeolian:[[0],[0,6],[0,3],[0,5]],dorian:[[0,3],[0],[0,6]],ionian:[[0,3],[0,4],[0,5]],mixolydian:[[0,6],[0,3]]},Xa=e=>Math.max(0,Math.min(1,e)),Za=(e,t)=>[0,1,2,3,4,5,6].map(n=>(e[n]??1e-4)**(1-.7*t)+t*.35),Qa=(e,t)=>l({cycle:7,heights:[t,t+2,t+4]},lt(e)).heights;function $a({seed:t,index:n,kind:r,key:a,harm:o,entropy:s,a:c}){let l=0,u=()=>V(t,`theme`,n,l++),{mode:d}=a,f=e=>[{step:0,degree:e}];if(o<.33){let e=Ya[d],t=Math.floor(u()*e.length);r!==`A`&&c?.mode===d&&c.vamp===t&&(t=(t+1)%e.length);let i=e[t],a=o<.15?4:2,s=[0,1,2,3].map(e=>f(i[Math.floor(e/a)%i.length])),l=a===4?[0,1,2,3].map(()=>f(i[1%i.length])):s;return{kind:r,index:n,mode:d,harm:o,vamp:t,bars:[...s,...l]}}let p=Ja[d],m=r===`B`?u()<.5?5:3:r===`build`?3:0,h=Xa((o-.4)*1.6),g=[m];for(let e=1;e<4;e++){if(e===3&&H(u(),o*(1-s*.5)))m=d===`mixolydian`?6:4;else if(H(u(),h))m=(m+3)%7,m===6&&d===`ionian`&&o<.85&&(m=4);else{let e=Za(p[m]??{0:1},s);e[m]*=.2,m=xt(u(),e)}m===g[e-1]&&(m=(m+3)%7),g.push(m)}let _=g.map(f),v=Xa((o-.7)/.3)*.7;for(let t=0;t<4;t++){let n=g[t],r=t<3?g[t+1]:0;if(!H(u(),v))continue;if(t===3&&n===4){_[t]=[{step:0,degree:1},{step:8,degree:4}];continue}let[o,,s]=Qa(a,r),c=s-o===6,l=i(o+7,12)===i(e(lt(a),n),12);r!==n&&!c&&!l&&(_[t]=[..._[t],{step:8,dominantOf:r}])}let y=_.map(e=>[...e]);if(H(u(),.25+s*.5)){let e=g[2];y[3]=f(xt(u(),Za(p[e]??{0:1},s)))}return{kind:r,index:n,mode:d,harm:o,vamp:null,bars:[..._,...y]}}function eo({seed:e,index:t,style:n,history:r},i){let a=Oi(n);if(a===0||!H(V(e,`keyJump`,t),n.entropy*.6))return null;let o=A(i.tonic),s=[...Array(12).keys()].filter(e=>{let t=Math.abs(u(A(e)-o+6,12)-6);return t>0&&t<=a}).map(e=>({tonic:e,mode:i.mode})),c=s.map(e=>ti(r,e));return s[xt(V(e,`keyJump`,t,1),Xr(c,4))]}function to({meter:e,swing:t=`16n`,repository:n,style:r,layer:i},a,o){if(e)return{meter:{meter:e,swing:t},found:null};let s=n?Rt(n,r,a?.meterFragment??null,i,o,Bt(r.entropy)):null;if(s)return{meter:{meter:s.meter,swing:s.swing.level,share:s.swing.share,meterFragment:s.id},found:s};if(n&&a){let{meter:e,swing:t,share:n,meterFragment:r}=a;return{meter:{meter:e,swing:t,...n===void 0?{}:{share:n},...r===void 0?{}:{meterFragment:r}},found:null}}return{meter:{meter:sn,swing:t},found:null}}function no({repository:e,style:t},n,r){return r&&e?.used?e.used(n,r.id,Lt(t)):n}function ro({rhythms:e,style:t,layer:n},r,i,a=[],o=[]){return e?ui(e,t,{meter:r.meter,meterFragment:r.meterFragment},i,n,a,o,Bt(t.entropy)):{}}let io=({seed:e,index:t,session:n},r,i=`groove`)=>({seed:e,index:t,point:r,tags:[i,...n===void 0?[]:[n]]}),ao=`bass line`;function oo(e,t,n,r,i){let a=tn(e.rhythms,`rhythm`,`grooveVariation`,io(e,Lt(e.style)),t,n,r.rhythmFragment,i);return{rhythm:a.id===r.rhythmFragment?r:{...r,rhythmFragment:a.id},layer:a.layer,playing:a.playing}}function so(e,t,n,r){return nn(e.rhythms,e.heard??[],e=>{let t=Ua(e);return t&&{hits:t}},{meter:n.meter,meterFragment:n.meterFragment},io({...e,index:e.index-1},r),t)}function co(e,t,n,r){return nn(e.bassLines,e.bassHeard??[],e=>{let t=wi(e);return t&&{notes:t}},{meter:n.meter,meterFragment:n.meterFragment},io({...e,index:e.index-1},r,ao),t)}function lo({bassLines:e,style:t,layer:n,share:r},i,a,o=[],s=[]){return e?Wn(e,t,{meter:i.meter,meterFragment:i.meterFragment},{level:i.swing,share:i.share??r??.5},z(i.meter),a,n,o,s,Bt(t.entropy)):void 0}let uo={initial:{before:null,themes:{A:null,B:null},layer:null,shortTerm:Wa,asked:null,boredom:zt,claveOwners:Ut,bassFragment:null},advance(e,{before:t,themes:n,layer:r,shortTerm:i,asked:a,boredom:o,claveOwners:s,bassFragment:c}){let l=r??e.layer,u=l&&t&&a?so(e,l,t,a):{layer:l,ids:[]},d=u.layer&&t&&a?co(e,u.layer,t,a):{layer:u.layer,ids:[]},f=d.layer,p=Ga(i,[...u.ids,...d.ids]),m=Ka(p),h={...e,layer:f},{seed:g,index:_,style:v,wish:y}=h,b=Nt.advance({seed:g,index:_,style:v},t?.section??null,null).output,x=t?.key??ct,S=ft(x,(t&&y.tonic===null&&y.mode===x.mode?eo(h,x):null)??y),C=y.melodic!==null&&Ai(v).melodic.includes(y.melodic)?y.melodic:Di(v),w=qa(b.type),T=w===`build`?null:n[w],E=T&&T.mode===S.mode&&Math.abs(T.harm-v.harm)<=.2&&!H(V(g,`themeRenewal`,_),v.entropy*.3)?T:$a({seed:g,index:_,kind:w,key:S,harm:v.harm,entropy:v.entropy,a:n.A}),D=to(h,t,m),{meterFragment:O}=D.meter,k=ro(h,D.meter,t,[...m,...O===void 0?[]:[O]],Gt(o,s)),A=f?oo(h,f,o,k,{meter:D.meter.meter,meterFragment:O}):{rhythm:k,layer:f,playing:null},{rhythm:j}=A,M=lo(h,D.meter,c??void 0,[...m,...O===void 0?[]:[O]],Gt(o,s)),N=A.layer?tn(h.bassLines,Hn,`lineVariation`,io(h,Lt(v),ao),A.layer,o,M,{meter:D.meter.meter,meterFragment:O}):{id:M,layer:A.layer,playing:null},P=N.id,ee={section:b,key:S,...D.meter,...j,melodic:C,theme:E},F=[O,j.rhythmFragment,j.claveFragment,P].filter(e=>e!==void 0);return{carried:{before:ee,themes:w===`build`?n:{...n,[w]:E},layer:N.layer?rn(h.bassLines,rn(h.rhythms,no(h,N.layer,D.found),[j.rhythmFragment,j.claveFragment],Lt(v),O),[P],Lt(v),O):null,shortTerm:Ga(p,F,1),asked:Lt(v),boredom:Yt(o,[A.playing,N.playing].filter(e=>e!==null),v.entropy),claveOwners:A.playing?Wt(s,k):s,bassFragment:P??null},output:ee}}},fo={own:[],players:[]},po={plans:uo.initial,next:null,history:Zr,parts:{bass:lr.initial,comp:yr.initial,lead:Rr.initial},ear:null};function mo({seed:e,style:t,wish:n,meter:r,swing:i=Pn,repository:a,layer:o,rhythms:s,session:c,bassLines:l},u,d,f,p=null){let m=u%8,h=m===0?uo.advance({seed:e,index:u/8,style:t,wish:n,history:f,meter:r,swing:i.level,repository:a,layer:o,rhythms:s,heard:p&&p.section===u/8-1?_o(p.drums,`drummer`):[],session:c,share:i.share,bassLines:l,bassHeard:p&&p.section===u/8-1?_o(p.bass,`bassist`):[]},d,null).carried:d,g=h.before,{key:_,theme:v}=g,y=wt({seed:e,barInSection:m,key:_,theme:v,harm:t.harm});return{plans:h,decided:{bar:u,plan:g,chords:y},history:Qr(f,y)}}let ho=({swing:e=Pn},t)=>({level:t.swing,share:t.share??e.share});function go(e,t,n){let r=e.bar%8;return{seed:e.seed,bar:e.bar,meter:t.plan.meter,plan:t.plan,barInSection:r,style:e.style,swing:ho(e,t.plan),barEnergy:Ft(e.style.energy,t.plan.section.type,r),chords:t.chords,next:n,offer:e.offer}}let _o=(e,t)=>[...e.own.length?[{source:t,bars:e.own}]:[],...e.players];function vo(e,t,n){let r=[...e.players],i=r.findIndex(e=>e.source===t);return i===-1?r.push({source:t,bars:[n]}):r[i]={source:t,bars:[...r[i].bars,n]},{...e,players:r}}function yo(e,t,n,r){if(!e.rhythms&&!e.bassLines||n.layer===null)return null;let i=Math.floor(t.bar/8),a=r?.section===i?r:{section:i,drums:fo,bass:fo,unheard:null};if(a.unheard){let e={...a.unheard,next:t.chords},n=sr(e,lr.initial).output,r=Si(n,Et(e.chords,e.meter),Et(e.next,e.meter));a={...a,bass:{...a.bass,own:[...a.bass.own,r]},unheard:null}}if(e.rhythms&&t.plan.rhythmFragment===void 0){let n=go(e,t,[]),r=qr(n).map(e=>({role:e.role,note:e.note,step:e.step,velocity:Gi(n,e).velocity}));a={...a,drums:{...a.drums,own:[...a.drums.own,r]}}}e.bassLines&&n.bassFragment===null&&(a={...a,unheard:go(e,t,[])});for(let{source:t,bar:n,hits:r}of e.drumsHeard??[])Math.floor(n/8)===i&&(a={...a,drums:vo(a.drums,t,r)});for(let{source:t,bar:n,notes:r}of e.bassHeard??[])Math.floor(n/8)===i&&(a={...a,bass:vo(a.bass,t,r)});return a}let bo=e=>({...e,style:Tn(e.style)});function xo(e,t){let{plans:n,history:r}=t,i=t.next;if(!i){if(e.bar!==0)throw Error(`band: bar ${e.bar}, but the song starts at bar 0`);({plans:n,decided:i,history:r}=mo(e,0,n,r))}else if(i.bar!==e.bar)throw Error(`band: bar ${e.bar}, but the band decided bar ${i.bar} next`);let a=yo(e,i,n,t.ear),o=mo(e,e.bar+1,n,r,a);return{here:i,at:n,carried:{...t,plans:o.plans,next:o.decided,history:o.history,ear:a}}}let So={initial:po,advance(e,t){let n=bo(e),{here:r,at:i,carried:a}=xo(n,t),o=go(n,r,a.next.chords),{barInSection:s}=o,c=n.bassLines?Gn(n.bassLines,i.bassFragment??void 0,o.meter,s,z(o.meter),a.plans.layer??void 0):[],l=sr(o,t.parts.bass,c),u=yr.advance(o,t.parts.comp,null),d=Rr.advance(o,t.parts.lead,null),f={bass:l.carried,comp:u.carried,lead:d.carried},p=n.rhythms?di(n.rhythms,r.plan,o.meter,s,z(o.meter),a.plans.layer??void 0):[],m=[...hi(o,qr(o),p),...l.output,...u.output,...d.output];return{carried:{...a,parts:f},output:Co(o,m)}}};function Co(e,t){return{...e,written:t,dough:t.map(t=>Gi(e,t))}}function G(e){return e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>G(e.atom))):[e]}function wo(e){return e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>[e,...wo(e.atom)])):[]}function To(e,t){return e.kind===`seq`?{...e,layers:e.layers.map(e=>e.map(e=>({...e,atom:To(e.atom,t)})))}:t(e)}function Eo(e,t){let n=e.atom,r=n.kind===`seq`?n.layers.reduce((e,n)=>e+n.reduce((e,n)=>e+Eo(n,t),0),0)*(n.euclid?.k??1):t(n);return e.repeat*e.subdivide*r}let Do=1e-9,Oo=e=>Math.floor(e+Do),ko=(e,t)=>(e%t+t)%t,Ao=(e,t)=>t===0?e:Ao(t,e%t),jo=(e,t)=>e/Ao(e,t)*t;function Mo(e,t){let[n,r,i,a]=[ko(e,t),t,1,0];for(;r!==0;){let e=Math.floor(n/r);[n,r,i,a]=[r,n-e*r,a,i-e*a]}return ko(i,t)}let No=e=>e.reduce((e,t)=>e+t.elongate*t.repeat,0);function Po(e){if(e.kind!==`seq`)return 1;let t=t=>t.reduce((e,t)=>jo(e,Po(t.atom)),1)*(e.mode===`alt`?No(t):1);return e.layers.reduce((e,n)=>jo(e,t(n)),1)*(e.slow??1)}let Fo=(e,t,n)=>[{atom:e,at:t,dur:n,of:1,is:0,chances:[],picks:[]}];function Io(e,t,n,r){return e.map(e=>{let i=t*(e.is+(e.at-n)/r),a=Oo(i),o=e.of*t;return{...e,at:n+Math.max(0,i-a)*r,dur:e.dur*t,of:o,is:ko(a,o),picks:e.picks.map(i=>{let o=t*(e.is+i.lap+(i.at-n)/r)-a,s=Oo(o);return{...i,lap:s,at:n+Math.max(0,o-s)*r}})}})}function Lo(e,t,n,r){let i=[];for(let a of t.hits){let o=a/t.n;for(let a of e){let e=(a.at-n)/r,s=a.dur/r;for(let c=0;c<e+s;c++)e<=c+o+Do&&c+o<e+s-Do&&i.push({...a,at:n+o*r,dur:r/t.n,is:ko(a.is+c,a.of),picks:a.picks.map(e=>({...e,lap:e.lap-c}))})}}return i}function Ro(e,t,n,r,i,a){if(e.kind!==`seq`)return a(e,t,n).map(e=>({...e,chances:[...i.chances,...e.chances],...zo(i.level,e.level)}));let o=e.layers.flatMap((o,s)=>{let c=No(o),l=[],u=0;return o.forEach((e,o)=>{l.push(...Bo(e,t+u*n/c,e.elongate*n/c,`${r}/${s}.${o}`,i,a)),u+=e.elongate*e.repeat}),e.mode===`alt`?Io(l,c,t,n):e.mode===`choose`?l.map(n=>({...n,picks:[...n.picks,{id:r,of:e.layers.length,is:s,lap:0,at:t}]})):l});return e.euclid&&(o=Lo(o,e.euclid,t,n)),e.slow&&e.slow>1&&(o=Io(o,e.slow,t,n)),o}let zo=(e,t)=>{let n=t===void 0?e:e===void 0?t:t*e;return n===void 0?{}:{level:n}};function Bo(e,t,n,r,i,a){let o={chances:e.chance===void 0?i.chances:[...i.chances,e.chance],level:e.level===void 0?i.level:e.level*(i.level??1)},s=e.subdivide,c=n/s,l=[];for(let i=0;i<e.repeat;i++)for(let u=0;u<s;u++){let d=t+i*n+u*c;for(let t of Ro(e.atom,d,c,r,o,a)){if(s===1||t.of===1&&!t.picks.length){l.push(t);continue}let e=Ao(s,t.of);if(ko(t.is-u,e)!==0)continue;let n=t.of/e,r=n===1?0:ko((t.is-u)/e*Mo(s/e,n),n);l.push({...t,of:n,is:r,picks:t.picks.map(e=>{let t=u+e.lap;return{...e,lap:Math.floor(t/s),at:e.at+(ko(t,s)-u)*c}})})}}return l}function Vo(e,t){if(e.kind!==`seq`)return t(e);if(!e.bare)return 1;let n=e.layers[0][0];return Vo(n.atom,t)*n.elongate}function Ho(e,t,n,r=``){let i=[],a=0;return e.forEach((e,o)=>{let s=Vo(e.atom,t)*e.elongate;for(let t of Bo(e,a,s,`${r}${o}`,{chances:[],level:void 0},n))i.push({atom:t.atom,at:t.at,dur:t.dur,chances:t.chances,top:o,...t.level===void 0?{}:{level:t.level},...t.of>1?{laps:{of:t.of,is:t.is}}:{},...t.picks.length?{chosen:t.picks}:{}});a+=s*e.repeat}),i}let Uo=(e,t)=>Ho(e,t,Fo),Wo=[`over`,`shift`,`step`,`map`,`stride`,`cycle`,`env`,`pitch`,`show`,`chance`,`seed`,`size`],Go=e=>e.flatMap(e=>e.repeat>1?Array.from({length:e.repeat},()=>({...e,repeat:1})):[e]);function Ko(e,t){let n=t.transpose??0,r=t.degree??0;if(!n&&!r)return e;let i=n+r;switch(e.kind){case`seq`:return To(e,e=>Ko(e,t));case`note`:return{...e,value:e.value+i};case`chord`:return{...e,notes:e.notes.map(e=>e+i)};case`choice`:return{...e,values:e.values.map(e=>e+i)};case`ref`:return n?{...e,transpose:(e.transpose??0)+n}:{...e,values:{mul:e.values?.mul??1,add:(e.values?.add??0)+r*(e.values?.mul??1)}};default:return e}}function qo(e){if(!e.cells.some(e=>e.base||Yo(e)||Jo(e)))return e;let t=new Map(e.cells.map(e=>[e.name,e])),n=[...e.diagnostics],r=/* @__PURE__ */ new Map,i=/* @__PURE__ */ new Set,a=(e,t)=>n.push({severity:`error`,message:t,span:e.base?.span??e.span}),o=e=>{let s=r.get(e.name);if(s)return s;let c=e;if(e.base){let n=t.get(e.base.name);n?i.has(e.name)?a(e,`base=&${e.base.name} comes round to &${e.name} itself`):(i.add(e.name),c=Xo(e,o(n),e.base,t=>a(e,t)),i.delete(e.name)):c=e}else Yo(e)&&n.push({severity:`error`,message:`= keeps a step of the base: only in a cell with base= (&${e.name} base=&other = 4 =)`,span:e.span});return Jo(e)&&n.push({severity:`error`,message:`= keeps a whole step of the base, not part of one: write it outside brackets (&${e.name} base=&other = [0 2])`,span:e.span}),r.set(e.name,c),c};return{...e,cells:e.cells.map(o),diagnostics:n}}let Jo=e=>e.braid.kind===`list`&&e.braid.tokens.some(e=>wo(e.atom).some(e=>e.atom.kind===`rest`&&e.atom.keep)),Yo=e=>e.braid.kind===`list`&&e.braid.tokens.some(e=>e.atom.kind===`rest`&&e.atom.keep);function Xo(e,t,n,r){let i={};for(let n of Wo)e[n]==null&&t[n]!=null&&(i[n]=t[n]);let a={...t.params,...e.params},o={...t.paramSpans,...e.paramSpans},s=t.paramCells||e.paramCells?{...t.paramCells,...e.paramCells}:void 0,c=t.paramClocks||e.paramClocks?{...t.paramClocks,...e.paramClocks}:void 0;n.transpose&&(e.over??t.over)&&r(`base=&${n.name}^$${n.transpose}: a cell that reads a table moves by its degrees (^n), not yet by grid steps`);let l=e.braid;if(t.braid.kind===`list`){let i=Go(t.braid.tokens),a=e.braid.kind===`list`?Go(e.braid.tokens):[],o=[];for(let e=0;e<Math.max(i.length,a.length);e++){let s=i[e],c=a[e];if(!(!c||c.atom.kind===`rest`&&c.atom.keep)){o.push(c);continue}if(!s){r(`= past the end of &${t.name} (${i.length} steps): nothing to keep`);continue}let l=Ko(s.atom,n);o.push(c&&c.elongate!==1?{...s,atom:l,elongate:c.elongate}:{...s,atom:l})}l={kind:`list`,tokens:o}}else e.braid.kind===`blank`?l=t.braid:Yo(e)&&r(`&${t.name} is a ${t.braid.kind}(…), not a braid: = keeps steps of a braid`);return{...e,...i,params:a,paramSpans:o,...s?{paramCells:s}:{},...c?{paramClocks:c}:{},braid:l}}let Zo=e=>{if(!e)return``;let t=e.abs?`$`:``;return e.kind===`at`?`[${t}${e.i}]`:`[${t}${e.from??``}:${e.to??``}${e.step?`:${e.step}`:``}]`},Qo=e=>!!(e.label||e.title)&&e.braid.kind===`blank`&&e.over===null&&e.step===null&&e.map===null&&e.cycle===null&&e.shift===null&&e.stride===null&&!e.off&&!e.frees?.length&&!e.env&&!e.pitch&&Object.keys(e.params).length===0,$o=/^(`{3,})([^`]*)$/;function es(e,t){let n=[],r=[],i=[],a=[],o=t;for(;o<e.length;){let t=e[o],s=$o.exec(t),c=s?e.findIndex((e,t)=>t>o&&/^`{3,}\s*$/.test(e)&&e.trim().length>=s[1].length):-1;if(s&&s[2].trim()===`cells`){if(c<0)return{problems:[{line:o+1,message:"the ```cells block is never closed (a line ```)"}]};a.push(t),r.push(a),a=[];let s=e.slice(o+1,c);s.forEach((e,t)=>i.push({block:n.length,line:o+2+t})),n.push(s),a.push(e[c]),o=c+1}else if(s){let t=c<0?e.length-1:c;a.push(...e.slice(o,t+1)),o=t+1}else a.push(t),o++}if(!n.length)return{problems:[{line:Math.max(t,1),message:"no ```cells block after the frontmatter"}]};let s=a.slice(1);r.push(a.slice(0,1));let c=s.join(`
`).replace(/^\s*\n/,``).trimEnd();return{text:n.flat().join(`
`),map:i,layout:{blocks:n,gaps:r},head:e.slice(0,t),tail:s,prose:c,raw:!1}}var K=class extends Error{line;constructor(e,t){super(t),this.line=e}};let ts=/^[-+]?(\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE][-+]?[0-9]+)?$/,ns=/^([-+]?0x[0-9a-fA-F]+|[-+]?0o[0-7]+|[-+]?\.(inf|Inf|INF)|\.(nan|NaN|NAN))$/,rs=/^(null|Null|NULL|~)$/,is=/^(true|True|TRUE)$/,as=/^(false|False|FALSE)$/,os=/^[-?:,[\]{}#&*!|>'"%@`]/,ss=e=>e!==``&&!os.test(e)&&!/: |:$| #|^\s|\s$/.test(e)&&!/^[0-9]+$/.test(e)&&!/[\n\r\t]/.test(e);function cs(e,t,n){let[r]=e;if(r===`&`||r===`*`)throw new K(t,`an ${r===`&`?`anchor`:`alias`} (${e}): the subset has none; write the value out`);if(r===`!`)throw new K(t,`a tag (${e}): the subset has none`);if(r===`|`||r===`>`)throw new K(t,`a block scalar (${r}): write the text on one line, quoted, with \\n`);if(r===`{`||r===`[`)throw new K(t,`flow style beyond [a, b] (${e}): write the map or the list as a block`);if(/^([-?:]( |$)|[%@`,\]}])/.test(e))throw new K(t,`${r} can't start a plain value: quote it`);if(r===`#`||e.includes(` #`))throw new K(t,`a comment: the subset has none; say it in the prose or under a key`);if(/: |:$/.test(e))throw new K(t,`a colon and a space in a plain value (${e}): quote it`);if(n&&/[[\]{},]/.test(e))throw new K(t,`flow style beyond [a, b] (${e}): quote an item that holds , [ ] { }`);if(rs.test(e))return null;if(is.test(e))return!0;if(as.test(e))return!1;if(ts.test(e))return Number(e);if(ns.test(e))throw new K(t,`a number the subset doesn't read (${e}): write it in decimal, or quote it`);return e}function ls(e,t){if(e[0]===`'`){let t=``;for(let n=1;n<e.length;n++)if(e[n]!==`'`)t+=e[n];else if(e[n+1]===`'`)t+=e[n++];else return{value:t,length:n+1}}else for(let n=1;n<e.length;n++)if(e[n]===`\\`)n++;else if(e[n]===`"`)try{return{value:JSON.parse(e.slice(0,n+1)),length:n+1}}catch{throw new K(t,`an escape the subset doesn't read in ${e.slice(0,n+1)}: it reads JSON's (\\" \\\\ \\n \\t \\uXXXX …)`)}throw new K(t,`a quoted string that isn't closed on its line (${e})`)}function us(e,t){if(e===`{}`)return{kind:`map`,line:t,entries:[]};if(e[0]===`"`||e[0]===`'`){let{value:n,length:r}=ls(e,t);if(e.slice(r).trim())throw new K(t,`text after a quoted string (${e.slice(r).trim()})`);return{kind:`scalar`,line:t,value:n}}if(e[0]===`[`&&e.endsWith(`]`)){let n=[],r=e.slice(1,-1).trim();for(;r;){let i;if(r[0]===`"`||r[0]===`'`){let e=ls(r,t);i=e.value,r=r.slice(e.length).trim()}else{let n=r.indexOf(`,`),a=(n<0?r:r.slice(0,n)).trim();if(!a)throw new K(t,`an empty item in ${e}`);i=cs(a,t,!0),r=n<0?``:r.slice(n)}if(n.push({kind:`scalar`,line:t,value:i}),r&&r[0]!==`,`)throw new K(t,`a list item followed by ${r[0]}, not a comma`);if(r=r.slice(1).trim(),!r&&e.slice(1,-1).trim().endsWith(`,`))throw new K(t,`an empty item at the end of ${e}`)}return{kind:`list`,line:t,items:n}}return{kind:`scalar`,line:t,value:cs(e,t,!1)}}function ds(e,t=1){let n=[];try{if(e.split(`
`).forEach((e,r)=>{let i=t+r;if(!e.trim())return;let a=e.length-e.trimStart().length;if(e.slice(0,a).includes(`	`))throw new K(i,`a tab in an indent: indent with spaces`);let o=e.trim();if(/^(---|\.\.\.)(\s|$)/.test(o))throw new K(i,`a second document (${o}): the frontmatter is one`);if(o[0]===`%`)throw new K(i,`a directive (${o}): the subset has none`);if(o[0]===`#`)throw new K(i,`a comment: the subset has none; say it in the prose or under a key`);n.push({line:i,indent:a,text:o})}),!n.length)return{node:{kind:`map`,line:t,entries:[]}};let r=0,i=e=>e.text===`-`||e.text.startsWith(`- `),a=e=>i(n[r])?s(e):c(e),o=(e,t,o,c)=>{let l=n[r];if(e){if(l&&l.indent>o)throw new K(l.line,`a value over two lines, or indented under a value: the subset reads a value on one line`);return us(e,t)}return l&&l.indent>o?a(l.indent):l&&c&&l.indent===o&&i(l)?s(o):{kind:`scalar`,line:t,value:null}},s=e=>{let t=[],s=n[r].line;for(;r<n.length&&n[r].indent===e&&i(n[r]);){let i=n[r],s=i.text.slice(1).trimStart(),c=e+i.text.length-s.length;s&&(/^-( |$)/.test(s)||/^[^"'[{][^]*?(: |:$)/.test(s))?(n[r]={line:i.line,indent:c,text:s},t.push(a(c))):(r++,t.push(o(s,i.line,e,!1)))}return{kind:`list`,line:s,items:t}},c=e=>{let t=[],a=n[r].line;for(;r<n.length&&n[r].indent===e;){let{line:a,text:s}=n[r];if(i(n[r]))throw new K(a,`a list item where a key was expected`);if(s[0]===`?`)throw new K(a,`a complex key (?): keys are plain words`);let c=s.search(/: |:$/);if(c<0)throw new K(a,`no key: a line in a map is \`key: value\` (${s})`);let l=s.slice(0,c);if(l[0]===`"`||l[0]===`'`)throw new K(a,`a quoted key (${l}): keys are plain words`);if(/^[0-9]+$/.test(l))throw new K(a,`a key that is a number (${l}): keys are words`);if(!ss(l))throw new K(a,`a key the subset doesn't read (${l}): keys are plain words`);if(t.some(e=>e.key===l))throw new K(a,`the key ${l} is given twice`);r++,t.push({key:l,line:a,value:o(s.slice(c+1).trim(),a,e,!0)})}return{kind:`map`,line:a,entries:t}},l=a(n[0].indent);if(r<n.length)throw new K(n[r].line,`indented as no key above it is`);return{node:l}}catch(e){if(e instanceof K)return{problems:[{line:e.line,message:e.message}]};throw e}}function fs(e){return e.kind===`scalar`?e.value:e.kind===`list`?e.items.map(fs):Object.fromEntries(e.entries.map(e=>[e.key,fs(e.value)]))}function ps(e){if(/^\s*use(?![A-Za-z0-9_])/.test(e))return/^\s*use\s+"([^"]*\S[^"]*)"\s*$/.exec(e)?.[1]??null}let ms=`A use line names a fragment by its id, in double quotes, on a line of its own: use "core kit"`;function q(e){let t=!1;for(let n=0;n<e.length;n++){let r=e[n];if(r===`"`)t=!t;else if(!t&&(r===`/`&&e[n+1]===`/`||r===`#`&&(n===0||/\s/.test(e[n-1]))))return[e.slice(0,n),e.slice(n)]}return[e,``]}let hs=e=>RegExp(`^(\\s*&${e})(?=\\s|$)`);function gs(e,t){let n=hs(t);return e.split(`
`).findIndex(e=>n.test(q(e)[0]))}function _s(e,t){return e.findIndex(e=>{let n=bs(q(e)[0]);if(!/^&\w+$/.test(n[0]??``)||!n.some(e=>e.startsWith(`step=`)))return!1;let r=n.slice(1).filter(e=>!xs(e));return r.length>0&&r.every(e=>/^&\w+$/.test(e))&&r.includes(`&${t}`)})}function vs(e,t,n){let r=e.split(`
`),i=gs(e,t),a=_s(r,t);if(i<0){if(a<0)return e;r.splice(a+1,0,`&${t}${r[a].endsWith(`\r`)?`\r`:``}`),i=a+1}let o=r[i].endsWith(`\r`)?`\r`:``,[s,c]=q(o?r[i].slice(0,-1):r[i]),l=n(s,hs(t));if(a>=0&&!c&&l.trim()===`&${t}`)return r.splice(i,1),r.join(`
`);if(c){let e=s.length,t=l.replace(/\s+$/,``);l=t+` `.repeat(Math.max(1,e-t.length))}return r[i]=l+c+o,r.join(`
`)}function ys(e,t,n,r){return vs(e,t,(e,t)=>{let i=`(?:"[^"]*"|[^\\s(]*\\([^)]*\\)[^\\s]*|\\S+)`,a=RegExp(`(\\s)${n}=${i}`);return a.test(e)?r===null?e.replace(RegExp(`\\s${n}=${i}`),``):e.replace(a,`$1${n}=${r}`):r===null?e:e.replace(t,`$1 ${n}=${r}`)})}function bs(e){let t=[],n=0,r=0,i=!1,a=``;for(let o of e)o===`"`&&(i=!i),!i&&(o===`[`||o===`(`)&&n++,!i&&(o===`]`||o===`)`)&&(n=Math.max(0,n-1)),!i&&n===0&&o===`<`&&r++,!i&&n===0&&o===`>`&&(r=Math.max(0,r-1)),/\s/.test(o)&&n===0&&r===0&&!i?(a&&t.push(a),a=``):a+=o;return a&&t.push(a),t}let xs=e=>/^[a-z][a-zA-Z]*=/.test(e)||e===`off`;function Ss(e,t){let n=gs(e,t);return n>=0&&/[+*,[]\s*$/.test(q(e.split(`
`)[n])[0])}function Cs(e,t){let n=gs(e,t);if(n<0)return null;let r=bs(q(e.split(`
`)[n])[0]),i=r.slice(0,1),a=r.slice(i.length);return{head:i,attrs:a.filter(xs),braid:a.filter(e=>!xs(e))}}function ws(e,t,n){let r=Cs(e,t);if(!r||Ss(e,t))return e;let i=r.braid.length===1&&/^free\(\s*[^"\s]/.test(r.braid[0])&&n.length>0;return vs(e,t,e=>/^\s*/.exec(e)[0]+[...r.head,...r.attrs,...i?[`free(${n.join(` `)})`]:n].join(` `))}function Ts(e,t,n,r){return ys(ys(e,t,n===`step`?`loop`:`step`,null),t,n,r)}function Es(e,t,n){return/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)?t!==n&&gs(e,t)>=0?`&${t} already exists`:null:`Letters, digits and _ only, starting with a letter`}function Ds(e,t,n){if(t===n||Es(e,n,t))return e;let r=RegExp(`&${t}(?![A-Za-z0-9_])`,`g`);return e.split(`
`).map(e=>{let[t,i]=q(e);return t.replace(r,`&${n}`)+i}).join(`
`)}let Os=/^`{3,}\s*cells\s*$/m;function ks(e){let t=[];for(let{key:n,line:r,value:i}of e.entries){let e=fs(i);n===`title`&&(typeof e!=`string`||!e.trim())&&t.push({line:r,message:`the title is ${JSON.stringify(e)}, not a text: title: "A name"`}),n===`description`&&typeof e!=`string`&&t.push({line:r,message:`the description is ${JSON.stringify(e)}, not a text: description: "What it is"`}),n===`tags`&&!(Array.isArray(e)&&e.every(e=>typeof e==`string`&&e.trim()))&&t.push({line:r,message:`the tags are ${JSON.stringify(e)}, not a list of names: tags: [genre:jazz, rhythm]`}),n===`tier`&&!(typeof e==`number`&&Number.isInteger(e)&&e>=1&&e<=9999)&&t.push({line:r,message:`the tier is ${JSON.stringify(e)}: a tier of the tutorial is a whole number, 1 to 9999`}),n===`uses`&&!(Array.isArray(e)&&e.every(js))&&t.push({line:r,message:`the uses are ${JSON.stringify(e)}, not a lockfile: uses: a list of - id: gm kit, hash: e1:…`})}return t}function As(e){let t=e.split(/\r?\n/);if(t[0]!==`---`){if(!Os.test(e))return{problems:[{line:1,message:"no frontmatter: a piece file starts with a line `---`, or holds a ```cells block"}]};let n=es(t,0);return`problems`in n?n:{frontmatter:{},text:n.text,prose:n.prose,map:n.map,layout:n.layout,bare:!0}}let n=t.indexOf(`---`,1);if(n<0)return{problems:[{line:1,message:"the frontmatter is never closed: no second line `---`"}]};let r=ds(t.slice(1,n).join(`
`),2);if(`problems`in r)return r;let i=r.node;if(i.kind!==`map`)return{problems:[{line:i.line,message:"the frontmatter is a map (`title: …`, `tags: […]`)"}]};let a=es(t,n+1),o=[...ks(i),...`problems`in a?a.problems:[]];return`problems`in a||o.length?{problems:o.sort((e,t)=>e.line-t.line)}:{frontmatter:fs(i),text:a.text,prose:a.prose,map:a.map,layout:a.layout}}function js(e){if(typeof e!=`object`||!e||Array.isArray(e))return!1;let t=e;return Object.keys(t).sort().join()===`hash,id`&&typeof t.id==`string`&&typeof t.hash==`string`}let Ms=/[A-Za-z_][A-Za-z0-9_]*/y,Ns=/-?[0-9]+/y,Ps=/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y,Fs=4096;var Is=class extends Error{col;len;constructor(e,t,n=1){super(e),this.col=t,this.len=n}},Ls=class e{text;line;offset;lambdas;parts;warnings;depth;body;i=0;frees=[];constructor(e,t,n=0,r=[],i=[{line:t,start:0}],a=[],o=0,s){this.text=e,this.line=t,this.offset=n,this.lambdas=r,this.parts=i,this.warnings=a,this.depth=o,this.body=s}within(t,n,r=this.depth){return new e(t,this.line,this.offset+n,this.lambdas,this.parts,this.warnings,r,this.body)}warn(e,t,n){this.warnings.push({severity:`warning`,message:e,span:{...this.place(t),len:n}})}place(e){let t=e+this.offset,n=this.parts[0];for(let e of this.parts)e.start<=t&&(n=e);return{line:n.line,col:t-n.start+1,len:Math.max(1,this.i-e)}}skipSpace(){for(;this.i<this.text.length&&/\s/.test(this.text[this.i]);)this.i++}done(){return this.skipSpace(),this.i>=this.text.length}peek(){return this.text[this.i]??``}span(e){return{line:this.line,col:e+1+this.offset,len:Math.max(1,this.i-e)}}fail(e,t=this.i,n=1){throw new Is(e,t+this.offset,n)}match(e){e.lastIndex=this.i;let t=e.exec(this.text);return t?(this.i+=t[0].length,t[0]):null}ident(e){let t=this.match(Ms);return t===null&&this.fail(`Expected ${e}`),t}int(e){let t=this.match(Ns);return t===null&&this.fail(`Expected ${e}`),parseInt(t,10)}num(e){let t=this.match(Ps);t===null&&this.fail(`Expected ${e}`);let n=parseFloat(t);if(this.peek()===`/`&&/[0-9.]/.test(this.text[this.i+1]??``)){this.i++;let e=this.match(Ps);(e===null||parseFloat(e)===0)&&this.fail(`a fraction needs a denominator, like 9/8`),n/=parseFloat(e)}let r=0;for(;this.peek()===`#`||this.peek()===`b`;)r+=this.text[this.i++]===`#`?1:-1;return{value:n,alter:r}}noteName(){let e=this.match(/[A-G](?:#|b)?(?:-?[0-9]+)?(?![A-Za-z0-9_])/y);return e===null?null:sa(e)}expect(e,t){this.peek()!==e&&this.fail(`Expected ${t}`),this.i++}lambda(){let e=this.i;this.depth>=32&&this.fail(`Unnamed cells &( … ) nest 32 deep at most: name the inner ones (&env …) and refer to them`,e-1,2);let t=0,n=-1;for(let r=e;r<this.text.length;r++)if(this.text[r]===`(`)t++;else if(this.text[r]===`)`&&--t===0){n=r;break}n<0&&this.fail(`')' to close &( … )`,e);let r=`λ${this.line}_${e+this.offset}`;this.body||this.fail(`An unnamed cell &( … ) here has no parser for its body`,e-1,2);let i=this.within(this.text.slice(e+1,n),e+1,this.depth+1),a=this.body(i,{name:r,pick:null,shift:0,span:{line:this.line,col:e+this.offset,len:n-e+2}});return this.lambdas.push({...a,lambda:this.text.slice(e+1,n).trim()}),this.i=n+1,r}ref(e){let t=this.i;this.expect(`&`,e);let n=this.peek()===`(`?this.lambda():this.ident(`a name after &`),r=null,i=0;if(this.peek()===`[`){this.i++,this.skipSpace();let e=this.match(/<<|>>/y);if(e){this.skipSpace();let a=this.match(/[0-9]+/y);return i=(e===`<<`?-1:1)*(a===null?1:parseInt(a,10)),this.skipSpace(),this.expect(`]`,`']' to close &${n}[${e}…]`),{name:n,pick:r,shift:i,...this.transposition(n),span:this.span(t)}}this.text.startsWith(`free(`,this.i)&&this.fail(`&${n}[…] picks by a number written in place: free(…) is a cell's whole braid (free(0 2 4 ~)), or a number in an attribute`,this.i,5);let a=this.peek()===`$`&&(this.i++,this.skipSpace(),1)?{abs:!0}:{},o=this.match(Ns);if(this.skipSpace(),this.peek()===`:`){this.i++,this.skipSpace();let e=this.match(Ns);this.skipSpace();let t=null;if(this.peek()===`:`){this.i++,this.skipSpace();let e=this.i,n=this.match(Ns);n!==null&&parseInt(n,10)===0&&this.fail(`A slice step of 0 never moves`,e,n.length),t=n===null?null:parseInt(n,10),this.skipSpace()}r={kind:`slice`,from:o===null?null:parseInt(o,10),to:e===null?null:parseInt(e,10),...t===null?{}:{step:t},...a}}else o===null&&this.fail(`Expected an index like &${n}[0] (&${n}[$0] as written), or a slice like &${n}[1:]`),r={kind:`at`,i:parseInt(o,10),...a};this.expect(`]`,`']' to close &${n}[…]`)}else if((this.peek()===`+`||this.peek()===`-`)&&/[0-9]/.test(this.text[this.i+1]??``)){let e=this.peek(),r=/[0-9]+/.exec(this.text.slice(this.i+1))[0];this.fail(`&${n}${e}${r}: write &${n}^${e===`-`?`-`:``}${r} to move it by its table's steps (in a braid; ^$${e===`-`?`-`:``}${r}: by semitones), &${n} ${e} ${r} to add pitch (in a mix), &${n}[${e===`-`?`<<`:`>>`}${r===`1`?``:r}] to shift it, or &${n}[…] to pick from it`,t,this.i-t+1+r.length)}return{name:n,pick:r,shift:i,...this.transposition(n),span:this.span(t)}}rejectTap(e){if(this.peek()!==`:`)return;let t=/^(?:(?:pulse|beat)(?:\*\d+)?|\d+[nt]\.?|\d*m)(?![\w.])/.exec(this.text.slice(this.i+1));if(!t)return;let n=this.text.slice(e,this.i+1+t[0].length);this.fail(`${n} is a meter's tap, which only step= reads (step=${n}): here it names no cell`,e,n.length)}cellRef(e,t,n=!1){let r=this.i,i=this.ref(e);n||this.rejectTap(r);let a=this.text.lastIndexOf(`^`,this.i-1);return a>=r&&a>this.text.lastIndexOf(`)`,this.i-1)&&this.warn(`${this.text.slice(r,this.i)} ${t}: ^ and ^$ move a cell a braid plays (and base=&cell^n, a copy); here it is the cell itself, so the move is ignored`,a,this.i-a),i}transposition(e){if(this.peek()!==`^`)return{};let t=this.i;this.i++;let n=this.peek()===`$`;n&&this.i++;let r=this.match(/-?[0-9]+/y);r===null&&this.fail(`&${e}^n moves it n steps of its table (&${e}^1, a degree up), &${e}^$n n semitones (&${e}^$7, &${e}^$-12)`,t,1),this.peek()===`.`&&/[0-9]/.test(this.text[this.i+1]??``)&&this.fail(`&${e}${this.text.slice(t,this.i)}…: ^ takes a whole number of steps (&${e}^1, &${e}^$-12)`,t,this.i-t+1+/^[0-9]+/.exec(this.text.slice(this.i+1))[0].length),this.peek()===`^`&&this.fail(`&${e}${this.text.slice(t,this.i)}^…: one ^ per reference; nest with degree(…): degree(&${e}${this.text.slice(t,this.i)}, n)`,this.i,1);let i=parseInt(r,10);return i?n?{transpose:i}:{degree:i}:{}}atBoundary(){let e=this.peek();return e===``||/\s/.test(e)}};function Rs(e){let t=!1;for(let n=0;n<e.length;n++){let r=e[n];if(r===`"`)t=!t;else if(!t&&r===`/`&&e[n+1]===`/`)return e.slice(0,n);else if(!t&&r===`#`&&(n===0||/\s/.test(e[n-1])))return e.slice(0,n)}return e}let J=(e,t,n)=>({help:e,doc:t,value:`syntax`,...n?{on:n}:{}}),Y=(e,t={})=>({help:e,doc:`sound.md`,value:`number`,on:[`voice`],voice:!0,...t}),X=(e,t,n={})=>({help:e,doc:`physics.md`,value:`number`,on:t,...n}),zs={over:J(`the table its numbers read`,`tables.md`),base:J(`the cell it is a copy of, changed where it says: its braid step by step over the base’s (= keeps a step), its attributes where it sets none`,`braid.md`),step:J(`what moves it, step by step`,`time.md`),loop:J(`what moves it, the whole braid at a time`,`time.md`),shift:J(`how far it is turned`,`tables.md`),stride:J(`how far each step turns it`,`time.md`),map:J(`how its values sound`,`sound.md`),show:J(`how it’s shown: notes, do, scale, pattern … (and everything below it)`,`display.md`),label:J(`a name to show, in quotes — alone on a cell, a note in the graph`,`display.md`),env:J(`a voice’s own volume on every note: an envelope`,`sound.md`,[`voice`]),pitch:{...J(`a voice’s own pitch on every note: a vibrato, or a shape in semitones (pitch=0..30 * &(map=adsr 0 .04 0 0): a drop)`,`sound.md`,[`voice`]),moves:!0},cycle:J(`where it wraps: turning past this many steps starts again (a grid’s size is map=edo)`,`tables.md`),size:J(`how large it’s drawn, against the others: 2 twice, .5 half`,`display.md`),laps:J(`how many laps it plays, then it ends`,`time.md`),chance:J(`what a bare x? means here: the probability it is dropped, or free() for a slider`,`cell.md`),seed:J(`a different sequence of chance`,`cell.md`),title:{...J(`on a note: the piece’s title (its card), the old spelling: its file’s frontmatter holds it`,`display.md`,[`note`]),old:`title: in the frontmatter`},tags:J(`on a cell: its clusters in the graph, comma-separated (on the piece’s card, the old spelling of its tags: its file’s frontmatter holds them)`,`display.md`),about:J(`on a note: the cells it explains`,`display.md`,[`note`]),tier:{...J(`on a piece’s card: its tier of the tutorial (1 the first), the old spelling: its file’s frontmatter holds it`,`display.md`,[`note`]),old:`tier: in the frontmatter`}},Bs={s:Y(`sound source: sine tri saw square pulse white pink brown`,{value:`word`}),lpf:Y(`low-pass cutoff, Hz`,{moves:!0,hz:!0}),lpq:Y(`low-pass resonance`,{moves:!0}),hpf:Y(`high-pass cutoff, Hz`,{moves:!0,hz:!0}),hpq:Y(`high-pass resonance`,{moves:!0}),room:Y(`reverb send 0–1`,{moves:!0}),delay:Y(`delay send 0–1`,{moves:!0}),delaytime:Y(`echo time, seconds — or a clock: &bar*2 (an eighth at the tempo) — or a tap: 8n, 4n.`,{clock:!0}),delayfeedback:Y(`echo feedback 0–1`),glide:{help:`tied notes (each starting as the one before ends) play as one: its envelope once, each next a slide there over this many seconds (dough’s glide; 0 or none: each note its own)`,doc:`sound.md`,value:`number`,on:[`voice`]},legato:{help:`on a line: each note sounds its written length (@n, _) times this share, its end swung as its onset is, Strudel’s legato (.5 staccato, 1 as written, 1.5 into the next): a number, free(), or a cell of shares read at each onset (legato=&artic); nothing cuts a note at the bar line`,doc:`sound.md`,value:`number`,on:[`clock`,`driven`],moves:!0,form:`legato=n · legato=free(n, lo..hi) · legato=&x · legato=lo..hi * &a * &b · on a meter, its lines’ default by level: legato=16n:r,4n:r`},pan:Y(`where it sits in stereo: 0 left, .5 centre (as without it), 1 right — the far side fades`),distort:Y(`distortion: 0 clean, .3 gritty, 1 and more harsh`),crush:Y(`bit depth: 16 clean, 8 grainy, 3 and fewer: rubble`),fm:Y(`frequency modulation: the voice that modulates this one (fm=&op); it may have its own fm=`,{doc:`physics.md`,value:`cell`}),ratio:Y(`as a modulator: its frequency against its carrier’s (1 the same, 3.5 a bell)`,{doc:`physics.md`,on:[`modulator`]}),index:Y(`FM depth: how far the modulator swings the frequency (0 none … 10 bright); it can move`,{doc:`physics.md`,on:[`carrier`],moves:!0}),body:Y(`a resonator: what its exciters are — fork, bell, bar, plate, box, tine, pipe, wire, spring; its braid lists them (semitones; the twelve by default), a note plucks the nearest`,{doc:`physics.md`,value:`word`}),ring:Y(`a resonator: how long it rings, in seconds`,{doc:`physics.md`}),hard:Y(`a resonator: the mallet — 0 felt (dark), 1 steel (bright)`,{doc:`physics.md`}),board:X(`a resonator: the body its exciters share (box by default, an octave below; none: no board)`,[`resonator`],{value:`word`}),couple:X(`a resonator: another it shares a table with (couple=&other) — each sets the other ringing`,[`resonator`],{value:`cell`}),coupling:X(`a resonator: how strongly it is coupled (.01 faint, .05 strong)`,[`resonator`]),excite:X(`a resonator: sound that drives it (excite=&mix) — it answers where the sound meets its modes`,[`resonator`],{value:`cell`}),postgain:{help:`on the sound card: its master, a linear gain after everything (Strudel’s postgain: 1 as it is, .5 half, a negative one inverts the phase; free(.8, 0..1) a slider)`,doc:`mix.md`,value:`number`,on:[`card`]},beat:{help:`on a meter: how many beats it counts, equal (meter("4/4") beat=2: alla breve) — its bpm counts beats`,doc:`time.md`,value:`number`,on:[`clock`]},pulse:{help:`on a scan: the note value of its entries (pulse=16n: sixteenths) — its beats then count quarters, and its taps read note values by it`,doc:`time.md`,value:`word`,on:[`clock`,`driven`]},swing:{help:`on a meter: a level of its bar leans, named by note value — of each pair of its eighths (swing=8n:.67), the second comes this far through their beat (.5 straight, .67 triplet swing), a group of three leaning, or straight with :pairs (swing=8n:.67:pairs); every beat and bar line stays. Bare (swing=.6), on a list: pairs of its steps`,doc:`time.md`,value:`number`,on:[`clock`],form:`swing=8n:r · swing=8n:r:pairs · swing=8n:r,16n:r · swing=8n:free(r, lo..hi) · swing=r`},motor:X(`on a meter: it turns physically — a motor this strong pulls it to its tempo (from rest)`,[`clock`]),mass:X(`physics: how heavy it turns (inertia); on a cell a meter drives, load`,[`clock`,`driven`]),friction:X(`physics: drag — the meter sags below its tempo, more with more load`,[`clock`,`driven`]),wind:X(`on a meter with a motor: its spring runs down over this many seconds, and it coasts to a stop`,[`motor`]),wow:X(`on a meter with a motor: its speed swings slowly by this fraction (.01: a tape machine’s wow)`,[`motor`]),varispeed:X(`on a clock: its notes’ pitch follows its speed, as tape does (1 fully, 0 not)`,[`clock`,`driven`]),belt:X(`on a driven cell (step=&x): it follows through a belt this stiff (200 taut, 20 slack) — it lags, swings, catches up`,[`driven`]),damping:X(`a belt’s damping: how soon its swinging dies (0 rings on, high creeps)`,[`driven`]),slip:X(`a belt’s grip: past this pull it slips, and the cell falls behind for good`,[`driven`]),write:X(`a tape: what its write head records (write=&melody); it moves with its step=`,[`tape`],{value:`cell`}),length:X(`a tape: how long its loop is, in seconds of tape (or a clock: length=&bar/4, or a tap: length=1m); none, an open reel`,[`tape`],{clock:!0}),erase:X(`a tape: how much of what was there each pass under the write head wipes (1 all, .3 leaves ghosts)`,[`tape`]),tone:X(`a sound tape: its loss — each pass through the loop darker (Hz: 7000 bright, 1500 worn)`,[`tape`],{hz:!0}),drive:X(`a sound tape: how hard it saturates each pass (0 clean, .5 warm, 1 crushed)`,[`tape`]),hiss:X(`a sound tape: its noise floor (0 none, .02 a cassette)`,[`tape`]),print:X(`a sound tape: print-through — a faint pre-echo before each head (.03 a whisper)`,[`tape`]),printgap:X(`a sound tape: how far before each head the print-through sits (tape-seconds, .6)`,[`tape`]),dropout:X(`a sound tape: brief gaps in the playback, about this many a second`,[`tape`],{hz:!0}),play:X(`a read head: the tape it reads (play=&tape), at= tape-seconds after the write head; a gate: the notes it plays on the voices in its braid (play=&tune)`,[`head`,`gate`],{value:`cell`}),at:X(`a read head: how far after the write head it sits, in seconds of tape (or a clock: at=&bar, or a tap: at=4n)`,[`head`],{clock:!0}),wander:X(`a read head: how far it wanders either way (tape-seconds) — a flying head`,[`head`]),wanderhz:X(`a read head: how fast it wanders (times a second)`,[`head`],{hz:!0}),level:{help:`on a gate: how loud, a product of level cells and a gain (level=&accent*&duck*.4)`,doc:`mix.md`,value:`number`,on:[`gate`]},trigger:{help:`a gate, the old spelling of play=: the notes it plays (trigger=&tune)`,doc:`mix.md`,value:`cell`,on:[`gate`],old:`play=`},gate:{help:`a gate, the old spelling: a level over time, one factor of level= (gate=&duck)`,doc:`mix.md`,value:`cell`,on:[`gate`],old:`level=`},velocity:{help:`a gate, the old spelling: a level, one factor of level= (velocity=&accent)`,doc:`mix.md`,value:`cell`,on:[`gate`],old:`level=`},gain:{help:`on a voice: its own gain, dough’s, times every gain it is played at (1 by default, a negative one inverts the phase; a kit member’s balance); on a gate written the old way (trigger=): the number in level=`,doc:`sound.md`,value:`number`,on:[`voice`,`gate`]},scope:{help:`a scope: stack, split, xy (in time) — spectrum, waterfall (in frequency, or value); its braid lists its channels`,doc:`display.md`,value:`word`,on:[`scope`]},fold:{help:`a spectrum or waterfall: pitches folded by this stride into as many bins (12: by pitch class, the default)`,doc:`display.md`,value:`number`,on:[`scope`]},bins:{help:`a spectrum or waterfall without a fold: this many bands, low to high (1 a meter, 3 low-mid-high, 20 an equaliser)`,doc:`display.md`,value:`number`,on:[`scope`]},channels:{help:`a spectrum or waterfall: sum (one, the default) or split (each channel its own)`,doc:`display.md`,value:`word`,on:[`scope`]},restart:{help:`what switching a part on does to its time (on a selector: for all its sections) — restart (from its top, the default), resume (where it stopped), free (its time runs on, only its sound is switched)`,doc:`time.md`,value:`word`,on:[`section`,`selector`],stub:!0},law:{help:`a law that computes the notes (law=fiveto12: the 5 to 12 cycle, a day of music)`,doc:`time.md`,value:`word`,on:[`law`]},anchor:{help:`a clock (a day meter, loop=1d): the time of day it stands at when play starts (hours.minutes — 11.55); play begins where the clock stands`,doc:`time.md`,value:`number`,on:[`clock`]}},Vs={sound:`s`,cutoff:`lpf`,ctf:`lpf`,lp:`lpf`,resonance:`lpq`,hcutoff:`hpf`,hp:`hpf`,hresonance:`hpq`,verb:`room`,reverb:`room`,delayt:`delaytime`,dt:`delaytime`,delayfb:`delayfeedback`,dfb:`delayfeedback`,clip:`legato`},Hs={...zs,...Bs},Us=new Set(Object.keys(Bs).filter(e=>Bs[e].value===`cell`)),Ws=new Set(Object.keys(Bs).filter(e=>Bs[e].clock)),Gs=new Set(Object.keys(Hs).filter(e=>Hs[e].moves)),Ks=new Set(Object.keys(Bs).filter(e=>Bs[e].voice));function qs(e){let t={voice:`a voice`,clock:`a meter (step= a rate)`,driven:`a driven cell (step=&x)`,motor:`a meter with a motor=`,tape:`a tape (write=)`,head:`a read head (play=)`,resonator:`a resonator (body=)`,scope:`a scope (scope=)`,law:`a law (law=)`,card:`the sound card (map=sample)`,note:`a note (a label= and nothing else)`,carrier:`a voice with fm=`,modulator:`a voice another’s fm= names`,gate:`a gate (play= with a braid)`,section:`a section (a name a stepped table of names declares)`,selector:`a selector (over= a table of sections)`},n=e.map(e=>t[e]);return n.length<2?n[0]??``:`${n.slice(0,-1).join(`, `)} or ${n[n.length-1]}`}function Js(e){let t=null,n=e.length<5?2:3;for(let r of Object.keys(Hs)){let i=Ys(e,r);i<n&&([t,n]=[r,i])}return t}function Ys(e,t){let n=Array.from({length:e.length+1},(e,n)=>[n,...Array(t.length).fill(0)]);for(let e=1;e<=t.length;e++)n[0][e]=e;for(let r=1;r<=e.length;r++)for(let i=1;i<=t.length;i++)n[r][i]=Math.min(n[r-1][i]+1,n[r][i-1]+1,n[r-1][i-1]+(e[r-1]===t[i-1]?0:1)),r>1&&i>1&&e[r-1]===t[i-2]&&e[r-2]===t[i-1]&&(n[r][i]=Math.min(n[r][i],n[r-2][i-2]+1));return n[e.length][t.length]}Object.fromEntries(Object.entries(Bs).map(([e,t])=>[e,t.help]));let Xs={sine:`sine`,tri:`triangle`,triangle:`triangle`,saw:`sawtooth`,sawtooth:`sawtooth`,square:`square`,pulse:`square`,white:`white`,pink:`pink`,brown:`brown`},Zs=e=>`${e}= is gone: an envelope is a cell — in the mix, &theme * &(map=adsr .01 .3 .5 .4) * &lead, or an instrument, &lead [&(map=adsr .01 .3 .5 .4) * &saw]`,Qs=e=>`${e}= is gone: a pitch drop is a pitch shape, an envelope in semitones — penv=30 pdec=.04 is pitch=0..30 * &(map=adsr 0 .04 0 0)`,$s={attack:Zs(`attack`),decay:Zs(`decay`),sustain:Zs(`sustain`),release:Zs(`release`),penv:Qs(`penv`),pdec:Qs(`pdec`)},ec=`fifths12TET`,tc=`key:main`,nc=5e4,rc=2e3,ic=[`name`,`notes`,`tonic`,`mode`,`steps`,`tempo`,`shift`],ac={fork:[[1,1,1],[6.27,.03,.35]],bell:[[.5,1,.5],[1,.8,1],[1.2,.6,.7],[1.5,.5,.45],[2,.45,.6],[2.5,.3,.35],[2.67,.28,.3],[3,.22,.25]],bar:[[1,1,1],[2.756,.45,.5],[5.404,.22,.3],[8.933,.12,.18]],plate:[[1,1,.8],[1.58,.8,.7],[2.24,.7,.6],[2.92,.55,.55],[3.15,.5,.5],[3.88,.4,.4],[4.47,.35,.35],[5,.3,.3]],box:[[1,1,1],[1.42,.7,.6],[1.91,.5,.45],[2.53,.35,.3]],tine:[[1,1,1],[5.93,.12,.35],[17.6,.03,.12]],pipe:[1,3,5,7,9,11,13].map(e=>[e,1/Math.sqrt(e),1/e]),wire:Array.from({length:12},(e,t)=>t+1).map(e=>[e*Math.sqrt(1+6e-4*e*e),1/(.6+.4*e),1/e]),spring:[[1,1,1]]};function oc(e){if(typeof e!=`number`)return[1,1];let t=Math.min(1,Math.max(0,e));return[Math.min(1,2*(1-t)),Math.min(1,2*t)]}let sc=e=>e?.map?.kind===`midi`,cc=e=>t=>e.cells.get(t)?.shift??0,lc={SAMPLE_RATE:48e3,A4:440},uc={C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2};function dc(e,t=440){let n=/^([A-G])([#b]?)(-?\d+)$/.exec(e);return n?t*2**((uc[n[1]]+(n[2]===`#`?1:n[2]===`b`?-1:0)+12*(parseInt(n[3],10)-4))/12):null}function fc(e,t){if(!t)return Array.from({length:e},(e,t)=>t);if(t.kind===`at`){let n=t.i<0?e+t.i:t.i;return n>=0&&n<e?[n]:null}let n=t.step??1,r=t=>t<0?e+t:t,i=[];if(n>0){let a=t.from===null?0:Math.max(0,Math.min(e,r(t.from))),o=t.to===null?e:Math.max(0,Math.min(e,r(t.to)));for(let e=a;e<o;e+=n)i.push(e)}else{let a=t.from===null?e-1:Math.max(-1,Math.min(e-1,r(t.from))),o=t.to===null?-1:Math.max(-1,Math.min(e-1,r(t.to)));for(let e=a;e>o;e+=n)i.push(e)}return i.length?i:null}function pc(e,t,n){let r=fc(e,t);return!r||!t||t.abs||!e?r:r.map(t=>((t+n)%e+e)%e)}function mc(e,t){if(!t)return e.steps;let n=pc(e.units.length,t,e.shift);return n?n.reduce((t,n)=>t+e.unitSteps[n],0):null}function hc(e,t,n){let r=`&${e}${Zo(t)}`,i=`&${e} has ${n} step${n===1?``:`s`}`;if(!t||t.kind===`at`)return`${r} picks nothing: ${t&&t.i<0?`before the start`:`past the end`}, ${i}`;let a=t.step??1;return a>0&&t.from!==null&&(e=>e<0?n+e:e)(t.from)>=n?`${r} picks nothing: it starts past the end, ${i}`:`${r} picks nothing: ${a>0?`it ends before it starts (a slice runs forwards unless its step is negative: [::-1])`:`it ends after it starts (a negative step runs backwards)`}, ${i}`}function gc(e){if(e.map?.kind!==`adsr`)return null;let t=e.units.map(e=>e.atom.kind===`note`?e.atom.value:NaN);return t.length!==4||t.some(e=>!(e>=0))?null:{attack:t[0],decay:t[1],sustain:Math.min(1,t[2]),release:t[3]}}function _c(e){return e.root||e.scan!==null}function vc(e){if(e.peek()!==`:`)return;e.rejectTap(e.text.slice(0,e.i).search(/&[^\s:,[\]()*+&]*$/)),e.i++;let t=e.i,n=e.match(/[0-9]+/y);if(n===null)return e.fail(`A hit is &bd:n:gain, its number first: &bd:0:.3`,t,1);if(parseInt(n,10)!==0&&e.fail(`&bd:${n} would be a pitched hit, ${n} up its table: not yet (write &bd:0:gain)`,t,n.length),e.peek()!==`:`)return;e.i++;let r=e.i,i=e.match(/[0-9]*\.[0-9]+|[0-9]+/y);return i===null?e.fail(`A hit’s gain: a number, &bd:0:.3 (1 as it is)`,r,1):parseFloat(i)}function yc(e,t){let n=0,r=!1,i=[[]],a=``,o=()=>{a&&i[i.length-1].push(a),a=``};for(let s=t;s<e.length;s++){let t=e[s];if(t===`&`&&(r=!0),t===`[`||t===`(`){if(n++===0)continue}else if(t===`]`||t===`)`){if(--n===0)break}else if(n===1&&t===`,`){o(),i.push([]);continue}else if(n===1&&/\s/.test(t)){o();continue}a+=t}if(o(),!r)return!1;let s=e=>/^[*+(-]|[*+-]$/.test(e);return!i.some(e=>e.length>1&&!e.some(s)||e.length===1&&e[0].startsWith(`[`))}function bc(e){e.i++;let t=[];for(;;){if(t.push(xc(e,0)),e.skipSpace(),e.peek()===`,`){e.i++;continue}let n=e.peek();return n===`|`&&e.fail(`',' or ']' in the mix: a mix lists its terms with commas ([&a, &b]); a choice [a|b] picks between numbers in a braid (&x [0|2]), not between cells`,e.i,1),(n===`[`||n===`&`)&&e.fail(`',' or ']' in the mix: a mix lists its terms with commas ([&a, &b]); one term is a product or a sum, its parts joined by * or +`,e.i,1),e.expect(`]`,`',' or ']' in the mix`),{kind:`mix`,exprs:t}}}function xc(e,t){let n=e.i,r=[{e:Sc(e,t),sign:1}];for(;;){e.skipSpace();let n=e.peek();if(n!==`+`&&n!==`-`)break;e.i++,r.push({e:Sc(e,t),sign:n===`-`?-1:1})}return r.length===1?r[0].e:{k:`sum`,items:r,span:e.span(n)}}function Sc(e,t){e.skipSpace();let n=e.i,r=[Cc(e,t)];for(;e.skipSpace(),e.peek()===`*`;)e.i++,r.push(Cc(e,t));return r.length===1?r[0]:{k:`prod`,factors:r,span:e.span(n)}}function Cc(e,t){e.skipSpace();let n=e.i;if(e.peek()===`(`){t>=32&&e.fail(`Parentheses in a mix nest 32 deep at most: name a part (&part [ … ]) and use it`,n),e.i++;let r=xc(e,t+1);return e.skipSpace(),e.expect(`)`,`')' to close the group`),r}if(e.peek()===`&`){let t=e.ref(`a cell, like &theme`),n=vc(e);return n===void 0?{k:`ref`,ref:t}:{k:`ref`,ref:t,level:n}}if(e.text.startsWith(`free(`,e.i))return{k:`num`,value:Zi(e,`gain`,!1).value,span:e.span(n)};let r=e.match(Ps);return r===null?(e.match(/gate\(/y)&&e.fail(`gate(…) is planned but not built yet: for now a step= term articulates, loop= terms bend`,n,5),e.fail(`Expected a cell, a number or '(' here`)):{k:`num`,value:parseFloat(r),span:e.span(n)}}let wc=[`degree`,`inverse`],Tc=/(degree|inverse)\(/y;function Ec(e){let t=e.match(Tc);if(t===null){let t=e.ref(`a cell like &motif`);return{kind:`ref`,name:t.name,pick:t.pick,shift:t.shift,...t.transpose?{transpose:t.transpose}:{},...t.degree?{values:{mul:1,add:t.degree}}:{}}}let n=t.slice(0,-1);e.skipSpace(),e.peek()!==`&`&&!e.text.startsWith(`degree(`,e.i)&&!e.text.startsWith(`inverse(`,e.i)&&e.fail(n===`degree`?`degree(&cell, n): a cell, then how many steps of its table up (−n down)`:`inverse(&cell): a cell, mirrored round 0`,e.i);let r=Ec(e);e.skipSpace();let i=r.values??{mul:1,add:0},a;if(n===`degree`){e.expect(`,`,`',' then the steps: degree(&${r.name}, 1)`),e.skipSpace();let t=e.match(/[-+]?\s*[0-9]+(?![0-9.])/y);t===null&&e.fail(`degree(&${r.name}, n) moves it n whole steps of its table, a whole number: degree(&${r.name}, 1), degree(&${r.name}, -2)`,e.i),a={mul:i.mul,add:i.add+parseInt(t.replace(/\s+/g,``),10)}}else a={mul:i.mul===1?-1:1,add:-i.add};return e.skipSpace(),e.expect(`)`,`')' to close ${n}(…)`),{kind:`ref`,name:r.name,pick:r.pick,shift:r.shift,...r.transpose?{transpose:r.transpose}:{},...a.mul===1&&a.add===0?{}:{values:a}}}function Dc(e,t){let n=e.peek();if(n===`&`||e.text.startsWith(`degree(`,e.i)||e.text.startsWith(`inverse(`,e.i))return Ec(e);if(n===`~`)return e.i++,{kind:`rest`};if(n===`=`)return e.i++,{kind:`rest`,keep:!0};if(n===`_`)return e.i++,{kind:`rest`,hold:!0};if(n===`[`)return yc(e.text,e.i)?bc(e):Oc(e,t);if(n===`<`)return kc(e,t);if(n===`-`||n===`.`||n>=`0`&&n<=`9`){let t=e.num(`a number`),n=e.match(/[#bsf]+(?![A-Za-z0-9_])/y)??``,r=t.alter+[...n].reduce((e,t)=>e+(t===`#`||t===`s`?1:-1),0);return{kind:`note`,value:t.value,alter:r}}let r=e.noteName();return r===null?e.fail(`Unexpected '${n}' — expected a number, a note name (C, F#), ~, [chord], &cell or key=value`):{kind:`note`,value:r,alter:0,pitched:!0}}function Oc(e,t){let n=e.i;t>=32&&e.fail(`Brackets nest 32 deep at most: name the inner steps (&inner 0 2) and splice them`,n,1),e.i++;let r=[[]],i=null;for(;;){e.skipSpace();let a=e.peek();if(a===`]`)break;if(a===``&&e.fail(i===`|`?`']' to close the choice: [0|4|7]`:`']' to close the bracket: [0 2] · [0, 4]`,n,e.i-n),a===`,`||a===`|`){i!==null&&i!==a&&e.fail(`A bracket is a chord or a stack (commas) or a choice (bars), not both: [0, 4] · [0|4]`,e.i,1),r[r.length-1].length||e.fail(a===`,`?`A step before the comma: [0, 4]`:`A step before the bar: [0|4] · [0 2|4]`,e.i,1),i=a,r.push([]),e.i++;continue}Mc(e,r[r.length-1],Pc(e,t+1))}e.i++,r[r.length-1].length||e.fail(i===null?`Empty brackets: [0 2] is a subsequence, [0, 2] a chord`:i===`,`?`A step after the comma: [0, 4]`:`A step after the bar: [0|4] · [0 2|4]`,n,e.i-n);let a=e=>e.repeat===1&&e.subdivide===1&&e.elongate===1&&e.chance===void 0,o=r.every(e=>e.length===1&&a(e[0])&&e[0].atom.kind===`note`),s=r.map(e=>e[0].atom);if(i===`|`)return o&&!s.some(e=>e.pitched)?{kind:`choice`,values:s.map(e=>e.value),alters:s.map(e=>e.alter)}:{kind:`seq`,layers:r,mode:`choose`};if(o){let e=s.map(e=>!!e.pitched);return{kind:`chord`,notes:s.map(e=>e.value),alters:s.map(e=>e.alter),...e.some(Boolean)?{pitched:e}:{}}}return{kind:`seq`,layers:r}}function kc(e,t){let n=e.i;t>=32&&e.fail(`Brackets nest 32 deep at most: name the inner steps (&inner 0 2) and splice them`,n,1),e.i++;let r=[[]];for(;;){e.skipSpace();let i=e.peek();if(i===`>`)break;if(i===``&&e.fail(`'>' to close the alternation: <0 2 4>`,n,e.i-n),i===`|`&&e.fail(`An alternation takes steps, stacked with commas (<0 2, 4 5>); a choice goes in square brackets: [0 2|4]`,e.i,1),i===`,`){r[r.length-1].length||e.fail(`A step before the comma: <0 2, 4 5>`,e.i,1),r.push([]),e.i++;continue}Mc(e,r[r.length-1],Pc(e,t+1))}return e.i++,r[r.length-1].length||e.fail(r.length>1?`A step after the comma: <0 2, 4 5>`:`An empty alternation: <0 2 4> plays one of its steps a lap`,n,e.i-n),{kind:`seq`,layers:r,mode:`alt`}}function Ac(e){let t=e.i;e.i++;let n=[];for(;e.skipSpace(),n.push(e.int(`a whole number in x(k, n, r)`)),e.skipSpace(),e.peek()===`,`;)e.i++;e.expect(`)`,`')' to close x(k, n, r)`);let[r,i,a=0]=n;(n.length<2||n.length>3||!(i>=1&&i<=4096)||!(r>=0&&r<=i))&&e.fail(`x(k, n, r): k hits spread evenly over n parts of the step (0 ≤ k ≤ n), turned right by r: 0(3,8), &bd(3,8,2)`,t,e.i-t);let o=fa(r,i);return{k:r,n:i,r:a,hits:Array.from({length:i},(e,t)=>t).filter(e=>o[((e-a)%i+i)%i])}}let jc=1e4;function Mc(e,t,n){if(!(n.atom.kind===`rest`&&n.atom.hold)){t.push(n);return}let r=n.span.col-1-e.offset,i=t[t.length-1];(n.repeat!==1||n.subdivide!==1||n.elongate!==1||n.chance!==void 0)&&e.fail(`_ lengthens the step before it by one, and takes no modifiers: 0 _ _ is 0@3`,r,n.span.len),i||e.fail(`_ lengthens the step before it: 0 _ _ is 0@3 (in a cell with base=, = keeps a step of the base)`,r,n.span.len),i.repeat!==1&&e.fail(`_ after x!n would lengthen only the last copy: write the copies out, or x@n`,r,n.span.len),t[t.length-1]={...i,elongate:i.elongate+1,span:{...i.span,len:n.span.col-i.span.col+n.span.len}}}let Nc={"!":{field:`repeat`,syntax:W(`modifier`,`x!n`,`Repeat: n copies of the step, each as long as one.`,[`&beat step=4 0!4 2!2`],`cell.md`)},"*":{field:`subdivide`,syntax:W(`modifier`,`x*n`,`Ratchet: the step played n times within its own length.`,[`&hats step=2 0 0*2 0 0*3`],`cell.md`)},"@":{field:`elongate`,syntax:W(`modifier`,`x@n`,`Hold: the step lasts n steps.`,[`&tune step=2 0@2 2 4@3`],`cell.md`)}};function Pc(e,t=0){let n=e.i,r=Dc(e,t),i=e.span(n),a={repeat:1,subdivide:1,elongate:1},o,s,c,l=/* @__PURE__ */ new Set;r.kind===`ref`&&(s=vc(e));let u=e.peek()===`(`?Ac(e):void 0;for(;e.peek()in Nc||e.peek()===`?`||e.peek()===`/`;){if(e.peek()===`/`){c!==void 0&&e.fail(`'/' can only appear once per step`),e.i++;let t=e.i,n=e.int(`a count after /`);(n<1||n>4096)&&e.fail(`Count must be between 1 and ${Fs}`,t,e.i-t),c=n;continue}if(e.peek()===`?`){o!==void 0&&e.fail(`'?' can only appear once per step`),e.i++;let t=e.i,n=e.match(/(?:0?\.[0-9]+|0|1(?:\.0+)?)(?![0-9])/y);o=n===null?null:parseFloat(n),n===null&&/[0-9]/.test(e.peek()??``)&&e.fail(`A probability is from 0 to 1: x?.3`,t,1);continue}let t=e.peek();l.has(t)&&e.fail(`'${t}' can only appear once per step`),l.add(t),e.i++;let n=e.i,r=e.int(`a count after ${t}`);(r<1||r>4096)&&e.fail(`Count must be between 1 and ${Fs}`,n,e.i-n),a[Nc[t].field]=r}if(e.peek()===`(`&&e.fail(`A euclid goes straight after its step, before its other modifiers: 0(3,8)*2`),!e.atBoundary()&&!(t>0&&/[\],|>]/.test(e.peek()))&&e.fail(`Unexpected '${e.peek()}' — separate steps with spaces`),u||c!==void 0){r.kind===`rest`&&(r.hold||r.keep)&&e.fail(`${r.hold?`_`:`=`} takes no euclid and no /n: put them on the step it stands for`,n,e.i-n);let t={...u?{euclid:u}:{},...c===void 0?{}:{slow:c}};r=r.kind===`seq`&&!r.bare?{...r,...t}:{kind:`seq`,layers:[[{atom:r,repeat:1,subdivide:1,elongate:1,span:i}]],...t,bare:!0}}return Po(r)>jc&&e.fail(`A step comes round after ${jc.toLocaleString(`en`)} laps at most: its <…> and /n multiplied out`,n,e.i-n),{atom:r,...a,...o===void 0?{}:{chance:o},...s===void 0?{}:{level:s},span:e.span(n)}}let Fc=e=>/^(?:pulse|beat|1m|(?:1|2|4|8|16|32|64)(?:n\.?|t))(?![A-Za-z0-9_.])/.test(e.text.slice(e.i));function Ic(e){let t=e.match(/(?:pulse|beat|1m|(?:1|2|4|8|16|32|64)(?:n\.?|t))(?![A-Za-z0-9_.])/y);if(t===null)return null;if(t===`pulse`||t===`beat`)return{written:t,kind:t};if(t===`1m`)return{written:t,kind:`bar`};let n=parseInt(t,10);return{written:t,kind:`note`,whole:t.endsWith(`.`)?3/(2*n):t.endsWith(`t`)?2/(3*n):1/n}}function Lc(e){let t=1,n=[];for(;e.peek()===`*`||e.peek()===`/`;){let r=e.text[e.i++],i=e.i,a=e.match(/[0-9]+(?:\.[0-9]+)?|\.[0-9]+/y);(a===null||!(parseFloat(a)>0))&&e.fail(`a positive number after ${r}`,i),t=r===`*`?t*parseFloat(a):t/parseFloat(a),n.push({op:r===`*`?`×`:`÷`,n:parseFloat(a)})}return{ratio:t,chain:n}}function Rc(e,t){let n=e.i,r=t?`loop`:`step`,i=t?null:Ic(e);if(i)return{whole:t,kind:`tap`,meter:null,tap:i,...Lc(e),span:e.span(n)};if(e.text.startsWith(`free(`,e.i)){let r=Zi(e,t?`loop`:`step`,!0),i=Ji(r.value,r.unit);return i>0||e.fail(`A rate must be positive`,n,e.i-n),{whole:t,kind:`rate`,perSecond:i,span:e.span(n),free:r}}let a=e.match(/[0-9]+(?:\.[0-9]+)?|\.[0-9]+/y);if(a!==null){let i=Ji(parseFloat(a),e.match(qi));if(i>0||e.fail(`A rate must be positive`,n,e.i-n),/[A-Za-z.]/.test(e.peek())){let i=/^[^\s,\])]+/.exec(e.text.slice(n))[0];e.fail(t?`${r}=${i} is no rate: a number with its unit (loop=100bpm, loop=2hz)`:`${r}=${i} is no rate or tap: a tap reads a note value (1n 2n 4n 8n 16n 32n), a triplet (4t 8t 16t), a dotted one (2n. 4n. 8n.), 1m, pulse, beat, or another meter's (&bar2:16n)`,n,i.length)}return{whole:t,kind:`rate`,perSecond:i,span:e.span(n)}}let o=e.match(/[A-Z](?:[#b]?-?[0-9]+|[A-Z0-9_]*)(?![A-Za-z0-9_#])/y);if(o!==null)return{whole:t,kind:`env`,name:o,span:e.span(n)};e.peek()===`{`&&e.fail(`{&x} is now written cycle(&x)`);let s=e.match(/cycle\(/y)!==null,c=e.cellRef(s?`a cell inside cycle( ), like cycle(&theme)`:`a cell or a rate after ${r}=, like ${r}=&meter`,`in ${r}=`,!0);if((c.pick||c.shift)&&e.fail(`${r}= takes a whole cell`,c.span.col-1,c.span.len),s&&e.expect(`)`,`')' to close cycle(&${c.name})`),!s&&!t&&e.peek()===`:`){e.i++;let r=Ic(e);return r||e.fail(`&${c.name}: taps a meter by pulse, beat or a note value (&${c.name}:pulse, &${c.name}:beat, &${c.name}:16n, &${c.name}:1m)`),{whole:t,kind:`tap`,meter:c,tap:r,...Lc(e),span:e.span(n)}}return{whole:t,kind:`driven`,driver:c,cycle:s,...Lc(e),span:e.span(n)}}let zc={amp:W(`map`,`map=amp`,`A volume: its values multiply the level (on a voice, the braid as a waveform, its range onto −1…1; the default).`,[`&accent map=amp step=&bar*4 1 .4 .8 .4`],`sound.md`),lin:W(`map`,`map=lin`,`As amp, ramping from each value to the next: a glide, a triangle. In a mix it is plain: a volume in a product, a pitch in a sum.`,[`&swell map=lin loop=&bar/8 .2 1`],`sound.md`),db:W(`map`,`map=db`,`A volume in decibels (0 as it is, −6 about half).`,[`&fade map=db step=&bar 0 -6 -12`],`sound.md`),adsr:W(`map`,`map=adsr a d s r`,`An envelope: attack, decay, release in seconds, sustain a level; one per note.`,[`&pluck map=adsr .01 .3 .5 .4`],`sound.md`),sample:W(`map`,`map=sample`,`The sound card: its entries are channels, one (mono) or two (left, right).`,[`&out loop=SAMPLE_RATE map=sample &left &right`],`mix.md`),midi:W(`map`,`map=midi`,`A MIDI card: its entries are MIDI channels, in order (~ skips one); a voice only here is sent, not heard.`,[`&synth map=midi [&theme * &reed] [&bass * &sub] ~!7 &groove`],`midi.md`),edo:W(`map`,`map=edo`,`A grid: cycle= equal steps to the octave.`,[`&edo19 cycle=19 map=edo`],`tuning.md`),ratios:W(`map`,`map=ratios`,`A grid of ratios: one period's tones, then the period (the last).`,[`&just map=ratios 1 9/8 5/4 4/3 3/2 5/3 15/8 2`],`tuning.md`)},Bc=new RegExp(Object.keys(zc).sort((e,t)=>t.length-e.length).join(`|`),`y`);function Vc(e){let t=e.i;if(e.peek()===`&`){let n=e.cellRef(`a table cell, like map=&curve`,`after map=`);return(n.pick||n.shift)&&e.fail(`map= takes a whole table`,n.span.col-1,n.span.len),{kind:`table`,table:n,span:e.span(t)}}if(e.match(/sin\b/y)&&e.fail(`map=sin is gone: write the sine as the braid, sin(12) — or map=&table`,t,3),e.match(/ed\(/y)){let n=e.i,r=e.match(/[0-9]+(?:\.[0-9]+)?(?:\/[0-9]+(?:\.[0-9]+)?)?/y),[i,a=`1`]=(r??``).split(`/`),o=parseFloat(i)/parseFloat(a);return(r===null||!(o>1))&&e.fail(`ed(r) divides a ratio above 1: ed(2) is the octave, ed(3/2) the fifth, ed(5)`,n),e.expect(`)`,`')' to close ed(…)`),{kind:`edo`,period:o,span:e.span(t)}}let n=e.match(Bc);return n===null&&e.fail(`map= takes ${Object.keys(zc).join(`, `)}, ed(r), midi(c, p) or a table cell (&curve)`),n===`edo`?{kind:`edo`,period:2,span:e.span(t)}:n===`midi`?Hc(e,t):{kind:n,span:e.span(t)}}function Hc(e,t){if(e.peek()!==`(`)return{kind:`midi`,channel:null,port:1,span:e.span(t)};e.i++;let n=(t,n)=>{let r=e.i,i=e.match(/[0-9]+(?:\.[0-9]+)?/y),a=i===null?NaN:parseFloat(i);return Number.isInteger(a)&&a>=1&&a<=16||e.fail(`${t} is a whole number from 1 to 16: ${n}`,r,Math.max(1,i?.length??1)),a},r=n(`A MIDI channel`,`map=midi(10)`),i=1;return e.match(/\s*,\s*/y)!==null&&(i=n(`A MIDI output slot`,`map=midi(10, 2)`)),e.expect(`)`,`')' to close midi(…)`),{kind:`midi`,channel:r,port:i,span:e.span(t)}}let Uc=[`braid`,`pattern`,`equal`,`notes`,`midi`,`do`,`degrees`,`table`,`scale`,`mode`,`key`,`grid`,`meter`,`spectrum`,`wave`,`levels`,`adsr`,`mix`,`note`,`petal`,`off`,`matrix`,`lfo`,`brightness`],Wc={notes:[`flats`,`sharps`,`german`],do:[`fixed`,`movable`]},Gc=e=>(t,n,r,i)=>{n[e]=t.text.startsWith(`free(`,t.i)?Math.round(Zi(t,e,!1).value):t.int(`a whole number after ${e}=`),n.paramSpans[e]=t.place(i)},Kc=(e,t)=>(n,r,i,a)=>{let o=n.i,s=n.match(/"([^"]*)"/y);if(s===null&&n.fail(`${e}= takes a text in quotes: ${t}`),r[e]=s.slice(1,-1),e!==`label`&&(r.paramSpans[e]=n.place(a)),e===`label`)for(let e of s.matchAll(/\{(?:&[A-Za-z_][A-Za-z0-9_]*:)?([A-Za-z_][A-Za-z0-9_]*)\}/g))ic.includes(e[1])||n.warn(`{${e[1]}} isn't a label field: it shows as written (the fields: ${ic.map(e=>`{${e}}`).join(` `)})`,o+e.index,e[0].length)},qc=e=>(t,n)=>{n[e]=t.cellRef(`a cell after ${e}=, like ${e}=&pluck or ${e}=&(map=adsr .01 .3 .5 .4)`,`after ${e}=`)},Jc=(e,t,n)=>{t.step=Rc(e,n===`loop`)},Yc={over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{}},Xc={over:{form:`over=&table · over=&table[<<n] · over=scale(name, tonic) · over=key`,examples:[`&tune over=&major step=2 0 2 4`,`&mode over=&major[<<2] 0 2 4`,`&tune over=scale(minor, A) step=2 0 2 4`,`&bass over=key step=16n 0 4 7`],read:(e,t)=>{let n=/key(?![A-Za-z0-9_])/y;if(n.lastIndex=e.i,n.test(e.text)){let n=e.i;e.i+=3,e.peek()===`[`&&e.fail(`over=key reads the main key whole: to turn it, name it (over=&key[<<2])`,e.i,1),t.over={name:tc,pick:null,shift:0,span:e.place(n)}}else if(e.text.startsWith(`scale(`,e.i)){let n=e.i;e.i+=5;let r=Ta(e,n),i=`scale:λ${e.line}_${n+e.offset}`;e.lambdas.push({...Yc,name:i,span:r.span,lambda:e.text.slice(n,e.i),over:r.key,braid:{kind:`scan`,steps:r.steps,span:r.span}}),t.over={name:i,pick:null,shift:0,span:r.span}}else t.over=e.cellRef(`a cell, scale(name, tonic) or key after over=, like over=&scale, over=scale(minor, A) or over=key`,`after over=`);t.over.pick&&e.fail(`over= takes a whole table (shifting it is fine: over=&scale[<<])`,t.over.span.col-1,t.over.span.len)}},base:{form:`base=&cell · base=&cell^$n · base=&cell^n`,examples:[`&answer base=&subject^$7 =!3 12@2`,`&last base=&subject =!21 3@2`],read:(e,t)=>{t.base=e.ref(`a cell after base=, like base=&subject or base=&subject^$7`),t.base.pick&&e.fail(`base= takes a whole cell (transposing it is fine: base=&subject^$7)`,t.base.span.col-1,t.base.span.len)}},step:{form:`step=…`,examples:[`&tune step=4n 0 2 4`,`&tune step=&clock 0 2 4`],read:Jc},loop:{form:`loop=…`,examples:[`&lead s=saw loop=C4`],read:Jc},shift:{form:`shift=n · shift=free(n, lo..hi)`,examples:[`&mode over=&major shift=5 0 2 4`,`&key shift=free(0, 0..11)`],read:Gc(`shift`)},stride:{form:`stride=n · stride=free(n, lo..hi)`,examples:[`&key step=cycle(&theme) stride=7`],read:Gc(`stride`)},map:{form:`map=…`,examples:[`&accent map=amp step=&bar 1 .5`],read:(e,t)=>t.map=Vc(e)},show:{form:`show=kind · show=notes:convention · show=do:convention · show=mix:&grid`,examples:[`&tune show=notes step=2 0 2 4`,`&tune show=notes:german step=2 0 2 4`,`&tune show=do:movable step=2 0 2 4`,`&band show=mix:&edo19 [&a, &b]`],read:(e,t)=>{let n=e.i,r=e.match(/[a-z]+/y);r===null&&e.fail(`show= takes one of: ${Uc.join(` `)}, or a plugin of the piece`,n,1);let i=``;if(r===`mix`&&e.peek()===`:`&&!e.text.startsWith(`:&`,e.i)&&e.fail(`show=mix:&grid: the grid whose colours the mix wears, like show=mix:&edo19 (no space after the colon)`,n,e.i+1-n),r===`mix`&&e.text.startsWith(`:&`,e.i)){e.i+=2;let r=e.match(Ms);r===null&&e.fail(`show=mix:&grid: the grid whose colours the mix wears, like show=mix:&edo19`,n,e.i-n),t.show=`mix:&${r}`,t.paramSpans.show=e.span(n);return}if(e.peek()===`:`){e.i++;let t=e.match(/[a-z]+/y)??``;Wc[r]?.includes(t)||e.fail(`show=${r}: takes ${r===`notes`?`flats, sharps or german`:r===`do`?`fixed or movable`:`no convention`}`,n,e.i-n),i=`:${t}`}t.show=r+i,t.paramSpans.show=e.span(n)}},label:{form:`label="text"`,examples:[`&theme label="the King's theme" step=2 0 2 4`,`&note label="A note in the graph: alone on its cell."`],read:Kc(`label`,`label="the King's theme"`)},env:{form:`env=&envelope`,examples:[`&lead s=saw loop=C4 env=&(map=adsr .01 .3 .5 .4)`],read:qc(`env`)},pitch:{form:`pitch=&vibrato · pitch=lo..hi * &shape`,examples:[`&lead s=saw loop=C4 pitch=&(loop=5 0 .1 -.1)`,`&bd s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0)`],read:(e,t,n,r)=>/^[0-9.]+\.\./.test(e.text.slice(e.i))?el(e,t,n):qc(`pitch`)(e,t,n,r)},cycle:{form:`cycle=n`,examples:[`&key step=cycle(&theme) stride=7 cycle=12`,`&edo19 cycle=19 map=edo`],read:(e,t)=>{let n=e.i;t.cycle=e.int(`a whole number after cycle=`),t.cycle<1&&e.fail(`cycle must be at least 1`,n,e.i-n),t.cycle>5e4&&e.fail(`cycle=${t.cycle}: at most ${nc.toLocaleString(`en`)}, the most steps a cell can hold (a grid's to its period, a table's turns before it comes round)`,n,e.i-n)}},size:{form:`size=x`,examples:[`&theme size=2 step=2 0 2 4`],read:(e,t)=>{let n=e.i,r=e.match(/[0-9]*\.?[0-9]+/y);(r===null||!(+r>=.25&&+r<=4))&&e.fail(`size= is how large it is drawn, from .25 to 4: size=2`,n,Math.max(1,(r??``).length)),t.size=+r}},laps:{form:`laps=n`,examples:[`&bar scan(4 4 4 4) step=84bpm laps=30`],read:(e,t,n,r)=>{let i=e.match(/[0-9]+/y);(i===null||!(parseInt(i,10)>=1))&&e.fail(`laps= takes a count of laps, 1 or more: laps=1`,r,n.length+1),t.laps=parseInt(i,10)}},chance:{form:`chance=p · chance=free(p, 0..1)`,examples:[`&ghost chance=.8 step=4 0? 0? 0? 0?`,`&ghost chance=free(.7, 0..1) step=4 0? 0?`],read:(e,t)=>{if(e.text.startsWith(`free(`,e.i))t.chance=Zi(e,`chance`,!1).value;else{let n=e.i,r=e.match(/(?:0?\.[0-9]+|0|1(?:\.0+)?)(?![0-9])/y);r===null&&e.fail(`chance= is a probability from 0 to 1: chance=.3, or chance=free(.3, 0..1)`,n,1),t.chance=parseFloat(r)}}},seed:{form:`seed=n`,examples:[`&ghost seed=7 step=4 0? 0? 0? 0?`],read:(e,t)=>t.seed=e.int(`a whole number after seed=`)},title:{form:`title="text"`,examples:[`&piece title="Swing blues" tags="genre:jazz, rhythm" label="A blues in F."`],read:Kc(`title`,`title="Swing blues"`)},tags:{form:`tags="tag, tag"`,examples:[`&lead tags="melody" s=saw loop=C4`,`&beam tags="metal" map=ratios 1 2.756 5.404`],read:Kc(`tags`,`tags="jazz, blues"`)},tier:{form:`tier=n`,examples:[`&piece title="Steps: a tune on one line" tags="tutorial" tier=1 label="Numbers, rests, holds and repeats."`],read:(e,t,n,r)=>{let i=e.match(/[0-9]+(?![0-9.])/y);(i===null||!(parseInt(i,10)>=1&&parseInt(i,10)<=9999))&&e.fail(`tier= is a tier of the tutorial, 1 to 9999: tier=1`,r,n.length+1),t.tier=parseInt(i,10),t.paramSpans.tier=e.place(r)}},about:{form:`about=&cell · about=(&a &b …)`,examples:[`&fenvNote label="The filter opens on every note." about=&fenv`,`&why label="Two cells at once." about=(&fenv &accent)`],read:(e,t,n,r)=>{let i=`a cell after about=, like about=&fenv or about=(&fenv &accent)`,a=[];if(t.about=a,e.peek()===`(`){for(e.i++,e.skipSpace();e.peek()!==`)`;)e.done()&&e.fail(`')' to close about=(…)`),a.push(e.cellRef(i,`in about=`)),e.skipSpace();e.i++,a.length===0&&e.fail(i,r,n.length+1)}else a.push(e.cellRef(i,`in about=`))}}},Zc={fm:`a voice after fm=, like fm=&op`,write:`what the tape records, like write=&melody`,play:`the tape it reads, like play=&tape, or the notes a gate plays, like play=&tune`,couple:`the resonator it shares a table with, like couple=&fork`,excite:`what drives it, like excite=&mix`,trigger:`the melody whose notes it plays with, like trigger=&tune`,velocity:`a level cell, like velocity=&accent`,gate:`a level cell, like gate=&duck`},Qc=(e,t,n)=>{let r=e.cellRef(Zc[n],`after ${n}=`);t.params[n]=r.name,t.paramSpans[n]=r.span},$c=(e,t,n)=>{if(!/^[1-9][0-9]*(?:n\.?|t):/.test(e.text.slice(e.i)))return el(e,t,n);let r=e.i,i=[];for(;;){let t=e.match(/[1-9][0-9]*(?:n\.?|t)(?=:)/y);t===null&&e.fail(`a level after the comma, a note value and a share: ${n}=8n:.6,16n:.55`),e.i++;let a,o=e.text.startsWith(`free(`,e.i);if(o){let t=Zi(e,`param`,!1);t.param=n,a=t.value,(i.length||e.peek()===`,`)&&e.fail(`a share left free(…) is one level alone: ${n}=8n:free(.5, .5..75)`,r,e.i-r)}else if(n===`legato`){let n=e.match(/(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?![0-9.])/y);n===null&&e.fail(`a share after ${t}:, of each note's held length (.5 staccato, 1 as written): legato=${t}:.5`),a=parseFloat(n)}else{let n=e.i,r=e.match(/[0-9]+\/[0-9]+(?![0-9.])/y);if(r!==null){let[i,o]=r.split(`/`).map(Number);o===0&&e.fail(`a share's denominator can't be 0: swing=${t}:2/3`,n,r.length),i>o&&e.fail(`a share is from 0 to 1, and ${r} is above it: swing=${t}:2/3`,n,r.length),a=i/o}else{let n=e.match(/(?:0?\.[0-9]+|0|1(?:\.0+)?)(?![0-9])/y);n===null&&e.fail(`a share after ${t}:, from 0 to 1, a decimal or a fraction (.5 straight, .67 or 2/3 the triplet swing): swing=${t}:2/3`),a=parseFloat(n)}}let s=!1;if(e.peek()===`:`){let i=e.i;e.i++;let a=e.match(/[a-z]+/y);a!==`pairs`&&e.fail(`after a share, :pairs leans a level's pairs alone and keeps its groups of three straight: swing=${t}:2/3:pairs`,i,1+(a?.length??0)),n===`legato`&&e.fail(`:pairs is swing='s, a level's pairs leaning alone; a legato= share holds every note of its level: legato=${t}:.5`,i,6),s=!0,o&&e.peek()===`,`&&e.fail(`a share left free(…) is one level alone: ${n}=8n:free(.5, .5..75)`,r,e.i-r)}if(i.push({level:t,share:a,...s?{pairs:s}:{}}),e.peek()!==`,`)break;e.i++}n===`legato`?t.legato=i:(t.swing=i,t.params[n]=i[0].share),t.paramSpans[n]=e.span(r)};function el(e,t,n){let r=e.i;if(n===`level`&&(e.peek()===`&`||/^(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)\s*\*/.test(e.text.slice(e.i)))){let i=[],a=1;for(let t=!0;;t=!1){let n=e.i;if(!t){if(e.skipSpace(),e.peek()!==`*`){e.i=n;break}e.i++,e.skipSpace()}let r=e.match(/(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y);r===null?i.push(e.cellRef(`a level cell or a number, like level=&accent*&duck*.4`,`in level=`)):a*=parseFloat(r)}t.paramCells[n]={range:null,factors:i,span:e.span(r)},a!==1&&(t.params[n]=a),t.paramSpans[n]=e.span(r);return}if((e.peek()===`&`||Fc(e))&&Ws.has(n)){let i=Rc(e,!1);i.kind!==`driven`&&i.kind!==`tap`&&e.fail(`${n}= takes seconds, a clock or a tap: ${n}=&bar*2, ${n}=8n`,r,e.i-r),t.paramClocks[n]=i,t.paramSpans[n]=e.span(r);return}if(e.text.startsWith(`free(`,e.i)){let i=Zi(e,`param`,!1);i.param=n,t.params[n]=i.value,t.paramSpans[n]=e.span(r);return}let i=e.text.slice(e.i).match(/^([0-9]+(?:\.[0-9]+)?|\.[0-9]+)\.\.([0-9]+(?:\.[0-9]+)?|\.[0-9]+)/);if(e.peek()===`&`||i){i&&(e.i+=i[0].length);let a=[];for(i||a.push(e.cellRef(`a cell after ${n}=`,`in ${n}=`));;){let t=e.i;if(e.skipSpace(),e.peek()!==`*`){e.i=t;break}e.i++,e.skipSpace(),a.push(e.cellRef(`a cell after *, like ${n}=200..3000 * &fenv`,`in ${n}=`))}i&&a.length===0&&e.fail(`${n}=${i[0]}: a range is scaled by cells — ${n}=${i[0]} * &fenv`,r,e.i-r),!i&&a.length>1&&e.fail(`${n}=: several cells multiply a range — ${n}=200..3000 * &a * &b`,r,e.i-r),t.paramCells[n]={range:i?[parseFloat(i[1]),parseFloat(i[2])]:null,factors:a,span:e.span(r)},t.paramSpans[n]=e.span(r);return}let a=e.match(/-?[A-Za-z0-9_.]+/y);a===null&&e.fail(`Expected a value after ${n}=`),t.params[n]=/^-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/.test(a)?parseFloat(a):a,t.paramSpans[n]=e.span(r)}let tl={init:`init= is now shift=`,out:`out= is now a command: out(voice, &cell) / step(&meter, bpm=…)`,time:`time= is now a command: out(voice, &cell) / step(&meter, bpm=…)`,rung:`rung= is now tier= (decision 020): the tutorial is in tiers, tier=1 to tier=9`,...$s};function nl(e){let t=e.i;e.i+=5,e.peek()===`"`&&e.fail(`free("…") is a text, for spell(…): a braid left free is steps, free(0 2 4 ~)`,t,6);let n=e.text.indexOf(`)`,e.i);n<0&&e.fail(`')' to close free(…)`,t,e.i-t);let r=e.within(e.text.slice(e.i,n),e.i),i=[];for(;r.skipSpace(),!r.done();){let e=r.i,t=Pc(r);G(t.atom).some(e=>e.kind!==`note`&&e.kind!==`rest`&&e.kind!==`chord`)&&r.fail(`A braid left free holds steps: numbers, rests (~), chords ([0,4]) and subsequences of them ([0 2]), held (@n) or repeated (!n)`,e,r.i-e),Mc(r,i,t)}i.length||e.fail(`free(…) around a braid needs steps: free(0 2 4 ~)`,t,n-t+1),e.i=n+1;let a=i.reduce((e,t)=>e+t.repeat*t.elongate,0);return e.frees.push({key:`braid`,value:0,unit:``,lo:0,hi:a,span:e.place(t),braid:r.text.trim().replace(/\s+/g,` `)}),{kind:`list`,tokens:i}}function rl(e,t){let n={over:null,base:null,shift:null,cycle:null,step:null,map:null,stride:null,env:null,pitch:null,show:null,label:null,laps:null,title:null,tags:null,tier:null,about:null,chance:null,seed:null,size:null,swing:null,legato:null,params:{},paramSpans:{},paramCells:{},paramClocks:{}},r=/* @__PURE__ */ new Map,i=!1,a=!1,o=[],s=null,c=null,l=null,u=!1,d=-1,f=``;for(;!e.done();){let t=e.i,p=e.match(Ms);if(p!==null&&e.peek()===`=`){e.i++;let i=p in Xc||p in Bs?p:Vs[p]??null;if(i===null){p in tl&&e.fail(tl[p],t,p.length);let n=Js(p);e.fail(`Unknown attribute ${p}=${n?` — did you mean ${n}=?`:``} (a cell: ${Object.keys(zs).join(` `)}; a sound or a physical cell: ${Object.keys(Bs).join(` `)})`,t,p.length)}let a=i===`loop`?`step`:i;if(r.has(a)){let o=r.get(a);e.fail(a===`step`&&n.step.whole!==(p===`loop`)?`step= and loop= say the same thing two ways — pick one`:o===p?`${p}= is given twice`:`${p}= and ${o}= are one parameter, ${i}= — given twice`,t,p.length)}r.set(a,p),p===`clip`&&e.warn(`clip= is Strudel's name for legato= — write legato= (Normalise rewrites it)`,t,p.length),(Xc[i]?.read??(i===`swing`||i===`legato`?$c:Us.has(i)?Qc:el))(e,n,i,t),e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);continue}if(p===`free`&&e.peek()===`(`){(s||o.length)&&e.fail(Xi,t,p.length),e.i=t,s=nl(e),u=!0,d=e.i,f=e.text.slice(t+5,e.i-1).trim();continue}if(p!==null&&ja(p)&&e.peek()===`(`){if((s||o.length)&&e.fail(u?Xi:`A cell has one braid: a generator or a list of steps`,t,p.length),p===`fifths`){let n=Ea(e,t);s=n.braid,l=n.shift}else if(p===`scale`){let n=Ta(e,t);s={kind:`scan`,steps:n.steps,span:n.span},c=n.key}else s=Ma(e,p,t);continue}if(p!==null&&wc.includes(p)&&e.peek()===`(`){s&&e.fail(u?Xi:`A cell has one braid: a generator or a list of steps`),e.i=t,Mc(e,o,Pc(e));continue}if(p===`off`&&e.atBoundary()){i&&e.fail(`off is given twice`,t,p.length),i=!0;continue}if(p===`oneshot`&&e.atBoundary()){a&&e.fail(`oneshot is given twice`,t,p.length),a=!0;continue}if(p!==null&&(/^[A-G](?:b?-?[0-9]*)$/.test(p)||p===`_`)?e.i=t:p!==null&&e.fail(`Unexpected '${p}'`,t,p.length),s&&u&&e.peek()===`)`&&e.fail(`A ')' with nothing to close: free(${f}) ends at its first ')'`,t,1),s&&t===d&&/[@!*/?:]/.test(e.peek())){let n=/^\S+/.exec(e.text.slice(t))[0];e.fail(`free(${f})${n}: a modifier goes on its steps, inside the parentheses: free([${f}]${n})`,t,n.length)}s&&e.fail(u?Xi:`A cell has one braid: a generator or a list of steps`,t,1),Mc(e,o,Pc(e))}let p=s??(o.length?{kind:`list`,tokens:o}:{kind:`blank`});if(a&&typeof n.params.glide==`number`&&n.params.glide>0){let t=n.paramSpans.glide;e.fail(`oneshot or glide=: a voice plays each note through, or ties them as one`,t?t.col-1:0,5)}l!==null&&l!==0&&(n.shift!==null&&e.fail(`fifths(n) turns it already: write fifths() and shift=, or fifths(n) alone`),n.shift=l),c&&(n.over&&e.fail(`scale(…) reads through a key of its own: drop over=, or write the key as a cell (&mode over=&key scan(…))`,n.over.span.col-1,n.over.span.len),n.over=c);let{over:m,base:h,shift:g,step:_,map:v,stride:y,cycle:b,env:x,pitch:S,show:C,label:w,title:T,tags:E,tier:D,about:O,laps:k,chance:A,seed:j,size:M,swing:N,legato:P,params:ee,paramSpans:F,paramCells:I,paramClocks:te}=n;return{name:t.name,span:t.span,over:m,...h?{base:h}:{},shift:g,off:i,...a?{oneshot:a}:{},step:_,map:v,stride:y,cycle:b,env:x,pitch:S,show:C,label:w,title:T,tags:E,tier:D,about:O??void 0,laps:k,chance:A,seed:j,size:M,...N?{swing:N}:{},...P?{legato:P}:{},params:ee,paramSpans:F,paramCells:I,paramClocks:te,braid:p,frees:[...e.frees]}}function il(e){e.skipSpace(),e.text.startsWith(`&(`,e.i)&&e.fail(`An unnamed cell &( … ) goes where a cell is used; a line declares a named one: &name …`);let t=e.cellRef(`a cell name like &theme`,`names the line`);return(t.pick||t.shift)&&e.fail(`Brackets go where a cell is used (&x[0], &x[<<]), not where it is named — use shift= here`,t.span.col-1,t.span.len),e.peek()===`(`&&e.fail(`&name(…) is gone — write over=&…`),rl(e,t)}let al=/^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20}|(?:rgb|rgba|hsl|hsla)\(\s*[-0-9.%\s,/]{1,40}\)|var\(--[a-z0-9-]{1,40}\))$/,ol=/^=== plugin ([a-z]+) ===\s*$/,sl=/^=== end ===\s*$/,cl=`=== plugin name === … === end ===`,ll=/^=== plugin /m;function ul(e,t=[],n=!1){if(!ll.test(e))return{text:e,plugins:[],diagnostics:[]};let r=e.split(`
`),i=[],a=[],o=(e,t,n=`error`)=>a.push({severity:n,message:t,span:{line:e,col:1,len:Math.max(1,r[e-1]?.length??1)}});for(let e=0;e<r.length;e++){let a=ol.exec(r[e]);if(!a){sl.test(r[e])&&o(e+1,`=== end === without a plugin block before it (${cl})`);continue}let s=e,c=s+1;for(;c<r.length&&!sl.test(r[c]);)c++;let l=r.slice(s+1,c).join(`
`);c<r.length||o(s+1,`plugin ${a[1]} has no === end === line`);let u=a[1];if(t.includes(u))o(s+1,`${u} is a show of its own: a plugin needs another name`);else if(i.some(e=>e.name===u))o(s+1,`plugin ${u} is written twice`);else{let e=fl(u,l,s+1,n);typeof e==`string`?o(s+1,`plugin ${u}: ${e}`):i.push(e)}for(let e=s;e<=Math.min(c,r.length-1);e++)r[e]=``;e=c}return{text:r.join(`
`),plugins:i,diagnostics:a}}function dl(e){let t=e.indexOf(`{`);if(t<0||e.slice(0,t).trim())return null;let n=0,r=!1;for(let i=t;i<e.length;i++){let a=e[i];if(r)a===`\\`?i++:a===`"`&&(r=!1);else if(a===`"`)r=!0;else if(a===`{`)n++;else if(a===`}`&&--n===0)return{json:e.slice(t,i+1),rest:e.slice(i+1)}}return null}function fl(e,t,n,r){let i=dl(t);if(!i)return`starts with its manifest, a { … } of JSON: { "fits": ["meter"], "size": 200 }`;let a;try{a=JSON.parse(i.json)}catch(e){return`its manifest is not JSON (${e.message})`}if(typeof a!=`object`||!a||Array.isArray(a))return`its manifest is an object`;let o=a,s=[`fits`,`size`,`rim`,`meaning`,`dial`,`tokens`],c=Object.keys(o).find(e=>!s.includes(e));if(c)return`its manifest has no "${c}" (it has: ${s.join(`, `)})`;if(!Array.isArray(o.fits)||!o.fits.length||!o.fits.every(e=>typeof e==`string`))return`"fits" lists the kinds of cell it shows: ["meter"]`;let l=o.size??200;if(typeof l!=`number`||!(l>=60&&l<=400))return`"size" is a number from 60 to 400`;if(o.rim!==void 0&&typeof o.rim!=`boolean`)return`"rim" is true or false`;if(o.meaning!==void 0&&typeof o.meaning!=`string`)return`"meaning" is a text`;let u=null;if(o.dial!==void 0){let e=o.dial;if(!(e&&typeof e==`object`&&typeof e.label==`string`&&typeof e.turn==`number`&&e.turn>0&&typeof e.key==`number`&&e.key>0))return`"dial" is { "label": "The day", "turn": 86400, "key": 3600 }: a name, seconds for a turn, seconds for a key press`;u={label:e.label,turn:e.turn,key:e.key}}let d={};if(o.tokens!==void 0){let e=o.tokens;if(!e||typeof e!=`object`||Object.values(e).some(e=>typeof e!=`string`||!al.test(e)))return`"tokens" maps names to colours (#rgb, rgb(…), hsl(…), a name, var(--x)): { "sun": "#ffd84a" }`;if(Object.keys(e).includes(`__proto__`))return`"tokens": a token can't be called __proto__`;Object.assign(d,e)}return{name:e,fits:o.fits,size:l,rim:o.rim!==!1,meaning:o.meaning??``,dial:u,tokens:d,code:i.rest.replace(/^\n+|\s+$/g,``),builtin:r,line:n}}let pl=String.raw`
=== plugin sun ===
{
  "fits": ["meter"],
  "size": 220,
  "rim": false,
  "meaning": "a day meter as the sun: a 24-hour dial, noon at the top",
  "dial": { "label": "The day", "turn": 86400, "key": 3600 },
  "tokens": {
    "sky-day": "#3d6fa8",
    "sky-dusk": "#e3a25a",
    "sky-dusk-night": "#2a1c3a",
    "sky-night": "#070912",
    "ink": "#fff",
    "ink-halo": "rgb(0 0 0 / 0.6)",
    "mark": "rgb(255 255 255 / 0.85)",
    "tick": "rgb(255 255 255 / 0.55)",
    "horizon": "rgb(255 255 255 / 0.35)",
    "sun": "#ffd84a",
    "sun-edge": "#fff3b0",
    "sun-glow": "#ffcf3a",
    "sun-night": "#8a7a40",
    "sun-night-edge": "#b8aa70"
  }
}
// The sun: a day of 24 hours as the sky turns it. Noon (S) at the top, midnight (N) at the bottom, sunrise (E) on the
// left, sunset (W) on the right, the horizon through the middle. Round the rim, the law's twelve blocks, each as
// bright as its mode. The sun stands where the piece is in its day. Stopped, turning it moves where play starts.
const mod = (a, n) => ((a % n) + n) % n;
// anchor=11.55 is 11:55
const clock = (hh) => Math.floor(hh) * 3600 + Math.round((hh % 1) * 100) * 60;
function where(view) {
  const { law } = view;
  const anchor = typeof view.params.anchor === 'number' ? clock(view.params.anchor) : 0;
  const ofDay = mod(anchor + view.time.seconds, 86400);
  const hhmm = Math.floor(ofDay / 3600) + ':' + String(Math.floor((ofDay % 3600) / 60)).padStart(2, '0');
  if (!law) return { ofDay, hhmm, block: null, mode: null, tonic: null };
  const d = mod(anchor - law.start + view.time.seconds, 86400);
  const block = Math.floor(d / law.blockSeconds);
  const key = Math.floor((d % law.blockSeconds) / law.keySeconds);
  return { ofDay, hhmm, block, mode: law.blocks[block].mode, tonic: law.tonics[block][key] };
}
function describe(view) {
  const w = where(view);
  const law = view.law;
  return {
    text: w.hhmm + (law ? ', ' + law.modeNames[w.mode] + ', key of ' + law.noteNames[w.tonic] : ''),
    now: Math.floor(w.ofDay / 60),
    min: 0,
    max: 1439,
  };
}
function draw(view, h, g) {
  const { law, tokens: T, size: S } = view;
  const R = S / 2;
  const w = where(view);
  // a time of day, in turns: noon at the top, turning clockwise (east, south, west)
  const turns = (sec) => (sec / 3600 - 12) / 24;
  const at = (sec, r) => g.polar(R, R, r, turns(sec));
  const ink = 'fill:' + T.ink + ';paint-order:stroke;stroke:' + T['ink-halo'] + ';stroke-width:3px;text-anchor:middle;';
  const sky = view.uid + 'sky';
  const blocks = law
    ? law.blocks.map((b, i) =>
        h('path', {
          d: g.ringSegment(R, R, R * 0.82, R - 3, turns(law.start + i * law.blockSeconds), turns(law.start + (i + 1) * law.blockSeconds)),
          fill: g.blockColour(b.brightness),
          stroke: 'rgba(0,0,0,.45)',
          'stroke-width': 1,
        }, h('title', null, law.modeNames[b.mode] + ' · ' + law.blockNames[i])),
      )
    : [];
  const ticks = Array.from({ length: 24 }, (_, hr) => {
    const [x1, y1] = at(hr * 3600, R * 0.82);
    const [x2, y2] = at(hr * 3600, R * (hr % 6 === 0 ? 0.72 : 0.77));
    return h('line', { x1, y1, x2, y2, stroke: T.tick, 'stroke-width': 1.4 });
  });
  const cardinal = (letter, x, y) => h('text', { x, y, style: 'fill:' + T.mark + ';font:800 13px var(--font-ui);text-anchor:middle' }, letter);
  const [sx, sy] = at(w.ofDay, R * 0.62);
  const up = w.ofDay > 6 * 3600 && w.ofDay < 18 * 3600;
  return [
    h('defs', null,
      h('linearGradient', { id: sky, x1: 0, y1: 0, x2: 0, y2: 1 },
        h('stop', { offset: 0, 'stop-color': T['sky-day'] }),
        h('stop', { offset: 0.48, 'stop-color': T['sky-dusk'] }),
        h('stop', { offset: 0.52, 'stop-color': T['sky-dusk-night'] }),
        h('stop', { offset: 1, 'stop-color': T['sky-night'] }))),
    h('circle', { cx: R, cy: R, r: R - 2, fill: 'url(#' + sky + ')', style: 'filter:drop-shadow(0 8px 11px rgba(0,0,0,.5))' }),
    ...blocks,
    ...ticks,
    h('line', { x1: 10, y1: R, x2: S - 10, y2: R, stroke: T.horizon, 'stroke-dasharray': '3 4' }),
    cardinal('S', R, 40),
    cardinal('N', R, S - 30),
    cardinal('E', 32, R + 4),
    cardinal('W', S - 32, R + 4),
    // the sun (below the horizon: the night's sun, dimmed)
    h('circle', up
      ? { cx: sx, cy: sy, r: 11, fill: T.sun, stroke: T['sun-edge'], 'stroke-width': 2, style: 'filter:drop-shadow(0 0 8px ' + T['sun-glow'] + ')' }
      : { cx: sx, cy: sy, r: 11, fill: T['sun-night'], stroke: T['sun-night-edge'], 'stroke-width': 2, opacity: 0.7 }),
    h('text', { x: R, y: R - 8, style: ink + 'font:800 17px var(--font-code)' }, w.hhmm),
    law && h('text', { x: R, y: R + 10, style: ink + 'font:700 10px var(--font-ui)' }, law.modeNames[w.mode] + ' · ' + law.noteNames[w.tonic]),
    law && h('text', { x: R, y: R + 24, style: ink + 'font:italic 500 10px var(--font-ui)' }, law.blockNames[w.block]),
  ];
}
=== end ===
`,ml=Object.freeze(ul(pl,[],!0).plugins.map(e=>Object.freeze({...e,tokens:Object.freeze({...e.tokens})})));function hl(e){let t=[],n=[],{text:r,plugins:i,diagnostics:a}=ul(e,[...Uc,...ml.map(e=>e.name)]),o=[...a],s=[],c=[],l=null;return r.split(`
`).forEach((e,t)=>{let n=Rs(e);l?(l.text+=` `,l.parts.push({line:t+1,start:l.text.length}),l.text+=n):l={text:n,line:t+1,parts:[{line:t+1,start:0}]},/[+*,[]\s*$/.test(l.text)||(c.push(l),l=null)}),l&&c.push(l),c.forEach(({text:e,line:r,parts:i})=>{let a=new Ls(e,r,0,[],i,o,0,rl);if(a.done())return;let c=ps(e);if(c!==void 0){let t=e.search(/\S/),i={line:r,col:t+1,len:e.trimEnd().length-t};c===null?o.push({severity:`error`,message:ms,span:i}):n.push({id:c,span:i});return}try{let e=a.i,n=a.match(Ms);if(n===`step`&&a.peek()===`(`)a.fail(`step(…) is now a rate on the meter: &meter scan(27 23 26 24) step=84bpm`,e,4);else if(n===`out`&&/^\s*[(=]/.test(a.text.slice(a.i)))a.fail(`out is a cell now: &mix [&theme * &lead, …] and &out loop=SAMPLE_RATE map=sample &mix &mix`,e,3);else if(n===`cell`)a.fail(`The cell keyword is gone: a line starting with &name declares a cell`,e,4);else if(n===null){a.i=e;let n=il(a);t.push(n,...a.lambdas)}else a.fail(`A line declares a cell: &name …`,e,n.length)}catch(t){if(!(t instanceof Is))throw t;o.push({severity:`error`,message:t.message,span:{line:r,col:t.col+1,len:t.len}});let n=/^\s*&([A-Za-z_][A-Za-z0-9_]*)/.exec(e)?.[1];n&&s.push(n)}}),qo({cells:t,diagnostics:o,broken:s,plugins:i,...n.length?{uses:n}:{}})}function gl(e,t){let n=[...e.diagnostics],r=(e,t)=>n.push({severity:`error`,message:e,span:t}),i=(e,t)=>n.push({severity:`warning`,message:e,span:t}),a=new Set(e.broken),o=(e,t)=>{a.has(e)||r(`Unknown cell &${e}`,t)},s=/* @__PURE__ */ new Set;return{parsed:e,env:t,diagnostics:n,error:r,warn:i,broken:a,unknownCell:o,rateOf:e=>{if(!e)return null;if(e.kind===`rate`)return e.perSecond;if(e.kind===`env`){let n=t[e.name]??dc(e.name,t.A4??440)??void 0;return typeof n==`number`&&n>0?n:(s.has(e)||r(`Unknown environment value ${e.name} (known: ${Object.keys(t).join(`, `)}, and note names like C4, F#3, Bb2)`,e.span),s.add(e),null)}return null}}}let _l={line:1,col:1,len:1},vl=e=>e.over===null&&(e.braid.kind===`blank`&&(e.name===`fifths12TET`||e.map?.kind===`edo`)||e.map?.kind===`ratios`),yl=e=>vl(e)?null:e.over?.name??`fifths12TET`,bl=e=>e.map?.kind===`ratios`&&e.braid.kind===`list`?Math.max(1,e.braid.tokens.length-1):e.cycle??12,xl=(e,t,n=0)=>{let r=e.get(t);if(!r||n>64)return 12;if(yl(r)===null)return bl(r);let i=r.braid;return i.kind===`scan`?i.steps.length:i.kind===`wave`?i.n:i.kind===`list`?i.tokens.reduce((e,t)=>e+G(t.atom).reduce((e,t)=>e+(t.kind===`note`?1:t.kind===`chord`?t.notes.length:0),0),0):xl(e,yl(r),n+1)},Sl=(e,t)=>{let n=e=>({atom:e,repeat:1,subdivide:1,elongate:1}),r=e=>n({kind:`note`,value:e,alter:0}),i=t.braid,a=yl(t);return a===null?Array.from({length:bl(t)},(e,t)=>r(t)):i.kind===`list`?i.tokens.map(({atom:e,repeat:t,subdivide:n,elongate:r,chance:i,level:a})=>({atom:e,repeat:t,subdivide:n,elongate:r,...i===void 0?{}:{chance:i},...a===void 0?{}:{level:a}})):i.kind===`scan`?oa(i.steps).positions.map(r):i.kind===`wave`?Sa(i.shape,i.n).map(r):Array.from({length:xl(e,a)},(e,t)=>r(t))};function Cl(e){let{parsed:t,error:n,unknownCell:r}=e,i=/* @__PURE__ */ new Map,a=/* @__PURE__ */ new Set;for(let e of t.cells)i.has(e.name)?n(`&${e.name} is already defined on line ${i.get(e.name).span.line}`,e.span):i.set(e.name,e);let o=wl(e,i),s=kl(i,n);Dl(i,a,n),Ol(e,i);let c=!i.has(ec);for(let e of i.keys())(e.startsWith(`key:`)||e.startsWith(`scale:`))&&a.add(e);let l=El(i);if(l){i.set(Tl,{name:Tl,span:l.voices[0].span,over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:{kind:`list`,tokens:l.voices.map(e=>({atom:{kind:`ref`,name:e.name,pick:null,shift:0},repeat:1,subdivide:1,elongate:1,span:e.span}))}});for(let[e,t]of l.cells)i.set(e,{...i.get(e),over:{name:Tl,pick:null,shift:0,span:i.get(e).span},braid:{kind:`list`,tokens:t}});a.add(Tl)}c&&i.set(ec,{name:ec,span:_l,over:null,shift:null,off:!1,step:null,map:{kind:`edo`,period:2,span:_l},stride:null,cycle:12,params:{},paramSpans:{},braid:{kind:`blank`}});let u=i.get(ec);vl(u)||n(`&${ec} is the default grid: give it only cycle= and shift=`,u.span);let d=/* @__PURE__ */ new Map,f=(e,t)=>{if(d.has(e))return d.get(e);let a=i.get(e),o=yl(a),s=!0;return o!==null&&(i.has(o)?t.includes(o)?(n(`over= loops: ${[...t.slice(t.indexOf(o)),e,o].map(e=>`&`+e).join(` → `)}`,a.over?.span??a.span),s=!1):s=f(o,[...t,e]):(r(o,a.over.span),s=!1)),d.set(e,s),s};for(let e of i.keys())f(e,[]);return{decls:i,implicit:a,implicitRoot:c,overOk:d,sections:s,...o?{mainKey:o}:{}}}function wl(e,t){let n=[...t.values()].find(e=>!e.lambda&&!e.base&&e.over?.name.startsWith(`key:λ`))?.name??null;for(let r of[...t.values()])r.over?.name===`key:main`&&(n?t.set(r.name,{...r,over:{...r.over,name:n}}):(e.error(`over=key reads the piece's main key, the first scale(…) in the text, and the piece has no main key: write one (&key scale(major, C))`,r.over.span),e.broken.add(tc)));return n}let Tl=`kit:voices`;function El(e){let t=e=>Object.keys(e?.params??{}).some(e=>Ks.has(e)),n=n=>t(e.get(n)),r=e=>!e.pick&&!e.shift&&!e.transpose&&!e.degree&&!e.values,i=new Set([...e.values()].flatMap(e=>e.over?[e.over.name]:[])),a=(e,i)=>{if(!e||e.over||e.map||t(e)||e.braid.kind!==`list`||e.braid.tokens.length===0||i.length>256||i.includes(e.name))return!1;let a=!1;for(let t of e.braid.tokens.flatMap(e=>G(e.atom)))if(t.kind!==`rest`){if(t.kind===`ref`&&n(t.name)&&r(t))a=!0;else if(t.kind===`ref`&&!t.shift&&!t.transpose&&!t.values&&s(t.name,[...i,e.name]))a=!0;else if(t.kind===`mix`&&t.exprs.every(e=>e.k===`ref`&&n(e.ref.name)&&r(e.ref)))a=!0;else return!1}return a},o=/* @__PURE__ */ new Map,s=(t,n)=>{if(o.has(t))return o.get(t);let r=e.get(t),s=r?.braid.kind===`list`&&r.braid.tokens.length===1&&r.braid.tokens[0].atom.kind===`mix`,c=!!r&&!r.step&&!s&&!i.has(t)&&a(r,n);return(n.length===0||c)&&o.set(t,c),c},c=[...e.values()].filter(e=>e.step&&a(e,[]));if(!c.length)return null;let l=[],u=(e,t)=>{let n=l.findIndex(t=>t.name===e);return n>=0?n:l.push({name:e,pick:null,shift:0,span:t})-1},d=/* @__PURE__ */ new Map,f=t=>{if(d.has(t.name)||t.braid.kind!==`list`)return;d.set(t.name,[]);let r=t=>{let i=t.atom,a=i;if(i.kind===`ref`&&n(i.name))a={kind:`note`,value:u(i.name,t.span),alter:0};else if(i.kind===`ref`)f(e.get(i.name));else if(i.kind===`mix`){let e=i.exprs,n=e.map(e=>u(e.ref.name,t.span)),r=e.some(e=>e.level!==void 0)?e.map(e=>e.level??1):void 0;a={kind:`chord`,notes:n,alters:n.map(()=>0),...r?{levels:r}:{}}}else i.kind===`seq`&&(a={...i,layers:i.layers.map(e=>e.map(r))});return{...t,atom:a}},i=t.braid.tokens.map(r);d.set(t.name,i)};for(let t of[...e.values()])c.includes(t)&&f(t);return{voices:l,cells:d}}function Dl(e,t,n){let r=(e,t)=>({k:`ref`,ref:{name:e,pick:null,shift:0,span:t}});for(let i of[...e.values()]){let a=i.params,o=i.braid.kind===`list`?i.braid.tokens:[],s=typeof a.trigger==`string`,c=s?a.trigger:typeof a.play==`string`&&o.length?a.play:null;if(c===null)continue;let l=s?`trigger`:`play`,u=i.paramSpans[l]??i.span,d=e=>e.kind===`ref`&&!e.pick&&!e.shift&&!e.transpose&&!e.values,f=o.length===1&&o[0].atom.kind===`mix`&&o[0].atom.exprs.every(e=>e.k===`ref`&&!e.ref.pick)?o[0].atom.exprs:null,p=o.every(e=>d(e.atom)&&e.repeat===1&&e.subdivide===1&&e.elongate===1);if(!f&&!p){n(`&${i.name} is a gate (${l}=): its braid is what it plays: a voice, a kit, a chord of voices [&lead, &bell], or voices to pick from (&${i.name} ${l}=&${c} &lead)`,i.span);continue}let m=f?f.flatMap(e=>e.k===`ref`?[{name:e.ref.name,span:e.ref.span}]:[]):o.flatMap(e=>e.atom.kind===`ref`?[{name:e.atom.name,span:e.span}]:[]),h=m;if(!f&&!s&&m.length>1){let n=`${i.name}:kit`;e.set(n,{name:n,span:i.span,over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:i.braid}),t.add(n),h=[{name:n,span:i.span}]}let g=s?[`velocity`,`gate`].flatMap(e=>typeof a[e]==`string`?[{name:a[e],port:e,span:i.paramSpans[e]??i.span}]:[]):(i.paramCells?.level?.factors??[]).map(e=>({name:e.name,port:`level`,span:e.span})),_=s?a.gain:a.level,v=typeof _==`number`?_:1,y=i.paramSpans[s?`gain`:`level`]??i.span,b=h.map(t=>({k:`prod`,span:t.span,factors:[r(c,u),...g.map(e=>r(e.name,e.span)),...e.get(c)?.over?.name===t.name?[]:[r(t.name,t.span)],...v===1?[]:[{k:`num`,value:v,span:y}]]})),x=Object.fromEntries(Object.entries(a).filter(([e])=>![`play`,`trigger`,`velocity`,`gate`,`gain`,`level`].includes(e))),S=Object.fromEntries(Object.entries(i.paramCells??{}).filter(([e])=>e!==`level`));e.set(i.name,{...i,params:x,paramCells:S,gate:{notes:c,port:l,levels:g.map(({name:e,port:t})=>({name:e,port:t})),gain:v,receivers:m.map(e=>e.name)},braid:{kind:`list`,tokens:[{atom:{kind:`mix`,exprs:b,gate:i.name},repeat:1,subdivide:1,elongate:1,span:i.span}]}})}}function Ol(e,t){let n=e=>!!e&&e.map?.kind!==`sample`&&e.map?.kind!==`midi`&&e.braid.kind===`list`&&e.braid.tokens.length===1&&e.braid.tokens[0].atom.kind===`mix`;for(let r of t.values()){let i=r.over?t.get(r.over.name):void 0;i&&i.braid.kind===`list`&&i.braid.tokens.length&&i.braid.tokens.every(e=>e.atom.kind===`ref`&&n(t.get(e.atom.name)))&&(e.error(`A selector switches sections (decision 016): &${r.name} over=&${i.name} reads mixes. Write &${i.name} step=4n with a section per part (&${i.name} step=4n &keysBar &drumBar), step each part's cells by its section (step=&keysBar), and play the parts straight into the sound card`,r.over.span),e.broken.add(r.name))}}function kl(e,t){let n=/* @__PURE__ */ new Map,r=new Set([...e.values()].flatMap(e=>e.step?.kind===`driven`?[e.step.driver.name]:[])),i=e=>!!e&&!e.step&&!e.over&&!e.map&&(e.braid.kind===`blank`||e.braid.kind===`list`&&!e.braid.tokens.length);for(let a of[...e.values()]){if(!a.step||a.over||a.map||a.braid.kind!==`list`||!a.braid.tokens.length)continue;let o=[];for(let s of a.braid.tokens){let c=s.atom;if(c.kind!==`ref`||c.pick||c.shift||c.transpose||c.values||s.repeat!==1||s.subdivide!==1||s.elongate!==1)break;let l=e.get(c.name);if(l&&!i(l)&&(!l.step||n.has(c.name))){let n=a.braid.tokens.map(e=>e.atom.kind===`ref`?e.atom.name:``).filter(e=>e!==c.name);if(l.step||!n.some(t=>t&&!e.has(t)&&r.has(t)))break;t(`&${c.name} is a section of &${a.name}, so its line can carry attributes only (off, label=, tags=, show=, size=, shift=, restart=), not steps or a table of its own`,l.span),e.set(c.name,{...l,over:null,map:null,braid:{kind:`blank`}})}o.push(c.name)}if(o.length===a.braid.tokens.length&&!o.every(t=>e.has(t)&&!i(e.get(t)))&&o.some(e=>r.has(e))){for(let[t,r]of o.entries()){n.set(r,a.name);let o=e.get(r);if(o&&!i(o))continue;let s=a.braid.tokens[t].span,c={kind:`list`,tokens:[{atom:{kind:`note`,value:0,alter:0},repeat:1,subdivide:1,elongate:1,span:s}]};e.set(r,o?{...o,step:a.step,braid:c}:{name:r,span:s,over:null,shift:null,off:!1,step:a.step,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:c})}e.set(a.name,{...a,step:null})}}return n}let Al=(e,t,n)=>e.k===`ref`?n.includes(t(e.ref.name)):e.k===`num`?!1:e.k===`prod`?e.factors.some(e=>Al(e,t,n)):e.items.some(e=>Al(e.e,t,n));var jl=class extends Error{span;constructor(e,t){super(e),this.span=t}};let Ml=e=>e.k===`ref`?e.ref.span:e.span,Nl={k:`act`,terms:[],plain:[],offset:0,gain:1},Pl=e=>({ref:e,sign:1,inSum:!1}),Fl=(e,t)=>e(t.ref.name)===`volume`||e(t.ref.name)===`plain`&&!t.inSum;function Il(e,t,n){let r=Ll(e,t);if(r.k===`signal`)return[...r.bindings];if(r.k===`num`)throw new jl(`A number is a gain or a pitch: it needs a voice (&theme * &lead * 0.8)`,Ml(e));let i=[...r.terms.map(e=>e.ref.name),...r.plain.map(e=>e.name)],a=n?.(i);throw new jl(`${i.map(e=>`&`+e).join(` * `)} has no voice: a product needs one sound (a voice, a mix, a pattern read through a kit) — &theme * &lead${a?`. ${a}`:``}`,Ml(e))}function Ll(e,t,n=`auto`){if(e.k===`num`)return{k:`num`,value:e.value};if(e.k===`ref`){if(e.level!==void 0)throw new jl(`&${e.ref.name}:0:${+e.level.toFixed(3)} is a hit's gain, in a groove: in a mix, a gain is a number (&${e.ref.name} * ${+e.level.toFixed(3)})`,e.ref.span);let r=t(e.ref.name);return r===`signal`||r===`wave`&&n===`auto`?{k:`signal`,bindings:[{voice:e.ref,pitches:[],offset:0,gain:1}]}:r===`plain`?{...Nl,plain:[e.ref]}:{...Nl,terms:[{ref:e.ref,sign:1,inSum:!1}]}}if(e.k===`prod`){let r=n===`pitch`||Al(e,t,[`signal`])?`pitch`:`auto`;return e.factors.map(e=>Ll(e,t,r)).reduce((t,n,r)=>Rl(t,n,Ml(e.factors[r])))}return zl(e,t,n)}function Rl(e,t,n){if(e.k===`num`&&t.k===`num`)return{k:`num`,value:e.value*t.value};if(e.k===`signal`&&t.k===`signal`)throw new jl(`Two sounds can't multiply (&${e.bindings[0].voice.name} * &${t.bindings[0].voice.name}): mix them with + or ,`,n);if(e.k===`signal`||t.k===`signal`){let[n,r,i]=e.k===`signal`?[e,t,!1]:[t,e,!0],a=r.k===`num`?{...Nl,gain:r.value}:r,o=[...a.terms,...a.plain.map(Pl)];return{k:`signal`,bindings:n.bindings.map(e=>({...e,pitches:i?[...o,...e.pitches]:[...e.pitches,...o],offset:e.offset+a.offset,gain:e.gain*a.gain}))}}let r=e.k===`num`?{...Nl,gain:e.value}:e,i=t.k===`num`?{...Nl,gain:t.value}:t;return{k:`act`,terms:[...r.terms,...r.plain.map(Pl),...i.terms,...i.plain.map(Pl)],plain:[],offset:r.offset+i.offset,gain:r.gain*i.gain}}function zl(e,t,n){let r=n===`pitch`||!Al(e,t,[`signal`])&&Al(e,t,[`pitch`,`plain`])?`pitch`:`auto`,i=e.items.map(e=>({t:Ll(e.e,t,r),sign:e.sign,span:Ml(e.e)}));if(i.every(e=>e.t.k===`num`))return{k:`num`,value:i.reduce((e,t)=>e+t.sign*t.t.value,0)};if(i.some(e=>e.t.k===`signal`)){let e=[];for(let t of i){if(t.t.k===`num`)throw new jl(`A number is a gain or a pitch: it needs a voice (&theme * &lead * 0.8)`,t.span);if(t.t.k===`act`)throw new jl(`A pitch or a volume can't be added to a sound: it acts on one (&theme * &lead)`,t.span);if(t.sign<0)throw new jl(`Sounds mix with +; there's no subtracting a voice`,t.span);e.push(...t.t.bindings)}return{k:`signal`,bindings:e}}let a=[],o=0;for(let{t:e,sign:n,span:r}of i){if(e.k===`num`){o+=n*e.value;continue}let i=e;if(i.gain!==1)throw new jl(`A gain inside a pitch sum: gains multiply the sound — (&theme + 12) * &lead * 0.8`,r);for(let e of i.terms){if(e.inSum===!1&&!Bl(e,t))throw new jl(`&${e.ref.name} is a volume: it multiplies, it can't be added — &theme * &${e.ref.name} * &lead`,e.ref.span);a.push({...e,sign:e.sign*n,inSum:!0})}for(let e of i.plain)a.push({ref:e,sign:n,inSum:!0});o+=n*i.offset}return{k:`act`,terms:a,plain:[],offset:o,gain:1}}let Bl=(e,t)=>!Fl(t,e),Vl=e=>!!e&&e.map?.kind!==`sample`&&e.map?.kind!==`midi`&&e.braid.kind===`list`&&e.braid.tokens.length===1&&e.braid.tokens[0].atom.kind===`mix`,Hl=(e,{decls:t})=>!!e&&!Object.keys(e.params).some(e=>Ks.has(e))&&e.braid.kind===`list`&&e.braid.tokens.length>0&&e.braid.tokens.every(e=>e.atom.kind===`ref`&&Object.keys(t.get(e.atom.name)?.params??{}).length>0),Ul=(e,{rateOf:t})=>{if(!e.step||e.step.kind===`driven`||e.step.kind===`tap`)return null;let n=t(e.step),r=e.braid,i=r.kind===`list`?r.tokens.length:r.kind===`scan`?r.steps.length:r.kind===`wave`?r.n:1;return n===null?null:e.step.whole?n:n/Math.max(1,i)},Wl=(e,{decls:t})=>e.over?t.get(e.over.name):void 0,Gl=[{sort:`signal`,is:`A sound parameter (s=, lpf= …): a voice.`,example:[`&lead s=saw loop=C4`],holds:e=>Object.keys(e.params).some(e=>Ks.has(e))},{sort:`signal`,is:`A mix: an instrument.`,example:[`&a s=saw loop=C4`,`&b s=sine loop=C3`,`&organ [&a, &b]`],holds:e=>Vl(e)},{sort:`signal`,is:`A pattern read through a kit (a table of voices).`,example:[`&bd s=sine loop=A1`,`&hh s=white`,`&kit &bd &hh`,`&drums over=&kit step=4 0 1 0 1`],holds:(e,t)=>Hl(Wl(e,t),t)},{sort:`signal`,is:`A read head of a sound tape (a tape that records a mix).`,example:[`&lead s=saw loop=C4`,`&mix [&lead]`,`&tape write=&mix step=1 length=4`,`&head play=&tape at=1`],holds:(e,{decls:t})=>{let n=typeof e.params.play==`string`?t.get(e.params.play):void 0;return!!n&&typeof n.params.write==`string`&&Vl(t.get(n.params.write))}},{sort:`wave`,is:`A braid turning at an audio rate (20 Hz and up) with no sound of its own. Alone in a product it is the sound (a waveform); in a pitch sum, or beside a sound, a pitch that moves at audio rate (FM). One that plays as a voice in the piece is a sound everywhere.`,example:[`&square loop=220 0 1`],holds:(e,t)=>(Ul(e,t)??0)>=20},{sort:`volume`,is:`map=amp, map=db or map=adsr (an envelope).`,example:[`&accent map=amp step=2 1 .5`],holds:e=>e.map?.kind===`amp`||e.map?.kind===`db`||e.map?.kind===`adsr`},{sort:`plain`,is:`map=lin: as a number, it takes its operator's sort — a volume in a product, a pitch in a sum.`,example:[`&swell map=lin loop=.25 .2 1`],holds:e=>e.map?.kind===`lin`},{sort:`pitch`,is:`Anything else: a melody, a cell reading a table, a loop below hearing (a vibrato). In semitones.`,example:[`&vibrato loop=5 0 .1 -.1`],holds:()=>!0}];Gl.map(e=>W(`sort`,e.sort,e.is,[e.example[e.example.length-1]],`mix.md`));let Kl=e=>e.k===`ref`?[e.ref]:e.k===`sum`?e.items.flatMap(e=>Kl(e.e)):e.k===`prod`?e.factors.flatMap(Kl):[],ql=e=>Kl(e).map(e=>e.name);function Jl(e,t){let n={decls:t,rateOf:e.rateOf};return e=>{let r=t.get(e);return r?Gl.find(e=>e.holds(r,n)).sort:`pitch`}}function Yl(e,t){let{error:n}=e,r={decls:t,rateOf:e.rateOf},i=Jl(e,t),a=e=>{let n=e[e.length-1],i=t.get(n);if(!i)return null;if(i.braid.kind===`list`){let e=e=>e.atom.kind===`ref`&&Object.keys(t.get(e.atom.name)?.params??{}).some(e=>Ks.has(e)),r=t=>t.atom.kind===`note`||t.atom.kind===`ref`&&e(t)&&(t.atom.pick||t.atom.shift||t.atom.transpose||t.atom.values),a=i.braid.tokens.flatMap(e=>G(e.atom).map(e=>({atom:e})));if(a.some(e)&&a.some(r))return`&${n} mixes voices with numbers or picks: a groove holds only voices, rests and chords of voices (&bd &hh ~ [&bd, &hh]); to play numbers through voices, read them with over= a kit`}if(i.map?.kind===`midi`)return`&${n} is a MIDI card: it sends what it names to a device, and is no sound to mix or play`;if(Hl(i,r))return`&${n} is a kit, a table of voices: read a pattern through it (&drums over=&${n}) and mix that`;let a=Ul(i,r);return a!==null&&a<20?`&${n} loops at ${+a.toFixed(2)} Hz, below hearing: a pitch. A voice loops at an audio rate (loop=C4) or has a sound (s=saw)`:i.step?null:`&${n} has no loop=: a voice loops at an audio rate (loop=C4) or has a sound (s=saw)`},o=/* @__PURE__ */ new WeakMap;return s=>{let c=o.get(s);if(c)return c;c=[];let l=s.gate?e=>Hl(t.get(e),r)?`signal`:i(e):i,u=s.gate?t.get(s.gate)?.gate:void 0,d=e=>s.exprs.flatMap(Kl).find(t=>t.name===e),f=e=>{let n=t.get(e);return!!n&&(!!n.gate||Vl(n)||Object.keys(n.params).some(e=>Ks.has(e)))},p=u&&[{name:u.notes,port:u.port},...u.levels].find(e=>f(e.name));if(u&&p){let e=p.name===u.notes?`the notes it plays (a melody, &tune)`:`a level (a volume: a cell with map=amp, map=db or map=lin)`;return n(`${p.port}=&${p.name}: a gate's ${p.port}= takes ${e}, and &${p.name} is a sound (${t.get(p.name)?.gate?`a gate`:Vl(t.get(p.name))?`a mix`:`a voice`})`,d(p.name)?.span??t.get(s.gate).span),o.set(s,c),c}for(let i of s.exprs)try{let o=Kl(i).filter(e=>!t.has(e.name));if(o.length){for(let t of o)e.unknownCell(t.name,t.span);continue}let s=Il(i,l,a),u=s.flatMap(e=>e.pitches).find(e=>Hl(t.get(e.ref.name),r));u?n(`&${u.ref.name} is a kit, a table of voices: a pattern read through it is the sound — mix the pattern alone`,u.ref.span):c.push(...s)}catch(t){if(!(t instanceof jl))throw t;ql(i).some(t=>e.broken.has(t))||n(t.message,t.span)}return o.set(s,c),c}}let Xl=`card:builtin`,Zl=e=>e.k===`ref`?[e.ref.name]:e.k===`sum`?e.items.flatMap(e=>Zl(e.e)):e.k===`prod`?e.factors.flatMap(Zl):[],Ql=e=>e.kind===`ref`?[e.name]:e.kind===`mix`?e.exprs.flatMap(Zl):e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>Ql(e.atom))):[],$l=e=>e.braid.kind===`list`?e.braid.tokens.flatMap(e=>Ql(e.atom)):[];function eu(e){let t=[];for(let n of[e.over,e.base,e.env,e.pitch,e.map?.kind===`table`?e.map.table:null,e.step?.kind===`driven`?e.step.driver:e.step?.kind===`tap`?e.step.meter:null])n&&t.push(n.name);for(let n of Object.values(e.paramCells??{}))t.push(...n.factors.map(e=>e.name));for(let n of Object.values(e.paramClocks??{}))n.kind===`driven`&&t.push(n.driver.name);for(let[n,r]of Object.entries(e.params))typeof r==`string`&&Hs[n]?.value===`cell`&&t.push(r);return e.gate&&t.push(e.gate.notes,...e.gate.levels.map(e=>e.name),...e.gate.receivers),t}let tu=e=>[...$l(e),...eu(e)];function nu(e,t,n=/* @__PURE__ */ new Set){let{decls:r,implicit:i}=t,a={...t,builtin:null};if([...r.values()].some(e=>e.map?.kind===`sample`||e.map?.kind===`midi`))return a;let o=/* @__PURE__ */ new Set;for(let e of r.values())for(let t of tu(e))t!==e.name&&o.add(t);let s=Jl(e,r),c=[...r.values()].filter(t=>!i.has(t.name)&&!n.has(t.name)&&!t.lambda&&!o.has(t.name)&&!e.broken.has(t.name)&&(s(t.name)===`signal`||s(t.name)===`wave`));if(!c.length)return a;let l=_l,u=c.map(e=>({k:`ref`,ref:{name:e.name,pick:null,shift:0,span:e.span}})),d={name:Xl,span:l,over:null,shift:null,off:!1,step:null,map:{kind:`sample`,span:l},stride:null,cycle:null,params:{postgain:.8},paramSpans:{},braid:{kind:`list`,tokens:[{atom:{kind:`mix`,exprs:u},repeat:1,subdivide:1,elongate:1,span:l}]}};return{...t,decls:new Map([...r,[Xl,d]]),implicit:/* @__PURE__ */ new Set([...i,Xl]),overOk:new Map([...t.overOk,[Xl,!0]]),builtin:Xl}}let ru=e=>e.levels.length/Math.max(1,e.pulses);function iu(e){let t=/^([1-9][0-9]*)(n\.?|t)$/.exec(e);if(!t)return null;let n=parseInt(t[1],10);return t[2]===`n.`?3/(2*n):t[2]===`t`?2/(3*n):1/n}function au(e,t){let n=1/t,r=n/4;if(!(r>1))return{...e,unit:n};let i=[];for(let t=0;t<e.pulses-1e-9;t+=r)i.push(Math.min(r,e.pulses-t));return{...e,unit:n,beats:i,counted:e.pulses/r}}let ou=e=>e.counted??Math.max(1,e.beats.length);function su(e,t){let n=Math.max(1,Math.round(t)),{counted:r,...i}=e;return{...i,beats:Array.from({length:n},()=>e.pulses/n)}}function cu(e,t){let n=t.filter(e=>e.share!==.5);return n.length?{...e,swing:n}:e}function lu(e){let t=e=>Math.abs(e-Math.round(e))<1e-9&&Math.round(e)>=1&&Number.isInteger(Math.log2(Math.round(e)));return t(1/e)?`${Math.round(1/e)}n`:t(2/(3*e))?`${Math.round(2/(3*e))}t`:t(3/(2*e))?`${Math.round(3/(2*e))}n.`:null}let uu=e=>lu(1/(e.unit*ru(e)));function du(e,t){let n=t*e.unit;return e.beats.some(e=>{let t=e/n;return Math.abs(t-Math.round(t))<1e-9&&Math.round(t)>=2})?null:`no beat of this meter divides into two or more of ${lu(t)??`them`} (its beats: ${e.beats.map(t=>lu(t/e.unit)??t).join(` `)}), and swing never moves a beat`}function fu(e,t){let n=t*e.unit,r={...e,swing:[{level:lu(t)??``,whole:t,share:.6,pairs:!0}]};for(let t=0;t*n<e.pulses-1e-9;t++)if(Math.abs(gu(r,t*n)-t*n)>1e-9)return null;return`every group of ${lu(t)??`them`} in it is three, and :pairs keeps those straight`}let pu=e=>{for(let t=0,n=e;t<=6;t++,n*=2)if(Math.abs(n-Math.round(n))<1e-9)return!0;return!1};function mu(e,t){let n=Array.from({length:e+1},(t,n)=>n/e);if(t===null||e!==2&&e!==3||e===3&&t.pairs)return n;let{share:r}=t;if(e===2)return[0,Math.min(.95,Math.max(.05,r)),1];let i=Math.min(.95,Math.max(.05,r-1/6));return[0,i,(i+1)/2,1]}function hu(e,t,n){let r=Math.min(...n.map(e=>e.len)),i=0,a=t,o=0,s=t;for(let t=0;t<16;t++){let t=a/r,c=Math.round(t);if(Math.abs(t-c)>1e-9||c<2)break;let l=c===2||c===3?c:c%3==0?3:c%2==0?2:c,u=a/l,d=(e-i)/a*l;if(!pu(d))break;let f=mu(l,n.find(e=>Math.abs(e.len-u)<1e-9)??null),p=Math.min(l-1,Math.max(0,Math.floor(d+1e-9)));i+=p*u,a=u,o+=f[p]*s,s*=f[p+1]-f[p]}return o+(e-i)/a*s}function gu(e,t){if(!e.swing?.length)return t;let n=e.swing.map(t=>({len:t.whole*e.unit,share:t.share,...t.pairs?{pairs:!0}:{}})),r=e.pulses,i=Math.floor(t/r+1e-9),a=t-i*r,o=0,s=0;for(;s<e.beats.length-1&&o+e.beats[s]<=a+1e-9;)o+=e.beats[s++];let c=e.beats[s]??r;return i*r+o+hu(a-o,c,n)}function _u(e){let t=ru(e),n=e.levels.map((n,r)=>gu(e,r/t)*t);return n.some((e,t)=>Math.abs(e-t)>1e-12)?n:null}function vu(e,t){let n=e.length,r={level:0,from:0,to:n,groups:[]},i=[r];for(let t=1;t<n;t++){let r=Math.max(1,e[t]);for(;i.length>1&&i[i.length-1].level>=r;)i.pop();let a={level:r,from:t,to:n,groups:[]};for(let i=t+1;i<n;i++)Math.max(1,e[i])<=r&&(a.to=i,i=n);i[i.length-1].groups.push(a),i.push(a)}let a=t??yu(e);return{tree:r,levels:e,positions:e.map((e,t)=>t),lap:n,written:`meter`,pulses:a.pulses,unit:a.unit,beats:a.beats}}function yu(e){let t=e.flatMap((e,t)=>t===0||e<=1?[t]:[]),n=t.map((n,r)=>(t[r+1]??e.length)-n),r=e.length/Math.max(1,n.length),i=Number.isInteger(Math.log2(r))?4*r:8;return{pulses:e.length,unit:i,beats:n,sub:1}}function bu(e){let{positions:t,lap:n}=oa(e),r=t.map((e,t)=>({level:1,from:t,to:t+1,groups:[]})),i=t.length;return{tree:{level:0,from:0,to:i,groups:r},levels:t.map(()=>1),positions:t,lap:n,written:`scan`,pulses:i,unit:4,beats:t.map(()=>1)}}function xu(e,t,n=1){let r=[],i=e.pulses,a=i*Math.max(1,n);if(t.kind===`note`){let n=t.whole*e.unit;for(let e=0;e*n<a-1e-9;e++)r.push(e*n);return r}for(let a=0;a<Math.max(1,n);a++)if(t.kind===`bar`)r.push(a*i);else if(t.kind===`pulse`)for(let e=0;e<i;e++)r.push(a*i+e);else{let t=0;for(let n of e.beats)r.push(a*i+t),t+=n}return r}function Su(e,t,n){let r=(t===`pulse`?1:t===`beat`?Math.max(...e.beats):t===`1m`?e.pulses:(iu(t)??0)*e.unit)/e.unit/n;return(e.legato??[]).filter(e=>e.whole>=r-1e-9).sort((e,t)=>e.whole-t.whole)[0]?.share??1}var Cu=class extends Error{};function wu(e){let{braid:t,params:n}=e,{beat:r,pulse:i}=n,a=t.kind===`scan`?bu(t.steps):t.kind===`list`&&t.perBeat!==void 0?vu(t.tokens.map(e=>e.atom.kind===`note`?e.atom.value:0),t.signature):null,o=t.kind===`scan`&&typeof i==`string`?iu(i):null,s=a&&o?au(a,o):a,c=s&&typeof r==`number`&&r>0?su(s,r):s,l=c&&e.legato?{...c,legato:e.legato.flatMap(e=>iu(e.level)===null?[]:[{...e,whole:iu(e.level)}])}:c;return!l||typeof n.swing!=`number`?l:cu(l,(e.swing??[{level:uu(l)??``,share:n.swing}]).flatMap(e=>{let t=iu(e.level);return t===null?[]:[{level:e.level,whole:t,share:e.share,...e.pairs?{pairs:!0}:{}}]}))}let Tu=e=>e?ru(e)*e.pulses/ou(e):1;function Eu(e,{decls:t,implicit:n,implicitRoot:r,overOk:i},a){let{rateOf:o,error:s,warn:c,broken:l,unknownCell:u}=e,d=/* @__PURE__ */ new Map,f=e=>xl(t,e),p=e=>Sl(t,e),m=[],h=/* @__PURE__ */ new Set,g=(e,i)=>{let c=d.get(e);if(c)return c;if(h.has(e)){for(let e of m)h.add(e),l.add(e);throw new Cu}let _=t.get(e);if(m.length>=256){h.size||s(`&${m[0]} splices cells into each other more than 256 deep (&${m[0]} → &${m[1]} → … → &${e}): write a long chain as one braid`,i);for(let t of[...m,e])h.add(t),l.add(t);throw new Cu}if(m.includes(e))throw s(`Circular reference: ${[...m.slice(m.indexOf(e)),e].map(e=>`&`+e).join(` → `)}`,i),new Cu;m.push(e);let v=p(_),y=/* @__PURE__ */ new Map,b=[],x=_.braid.kind===`list`?_.braid.tokens:[],S=(e,n,r)=>{let i=e.name;if(!t.has(i)){if(l.has(i))for(let e of m)l.add(e);throw u(i,n),new Cu}let a=g(i,n),o=mc(a,e.pick);if(o===null)throw s(hc(i,e.pick,a.units.length),n),new Cu;return y.set(i,(y.get(i)??0)+r),o};v.forEach((e,t)=>{let n=1,r=x[t]?.span??_.span;e.atom.kind===`ref`&&(n=S(e.atom,r,e.repeat*e.subdivide));let i=/* @__PURE__ */ new Map;for(let t of wo(e.atom))t.atom.kind===`ref`&&i.set(t.atom,S(t.atom,t.span??r,t.repeat*t.subdivide));e.atom.kind===`seq`&&(n=Vo(e.atom,e=>i.get(e)||1)),b.push(n*e.elongate*e.repeat)});let C=b.reduce((e,t)=>e+t,0);m.pop();let w=yl(_),T=_.braid,E={name:e,span:_.span,root:w===null,implicit:e===`fifths12TET`&&r||n.has(e),over:w===null?null:_.over?.name??null,overShift:_.over?.shift??0,context:w??e,cycle:w===null?bl(_):f(e),wrap:_.cycle??null,lambda:_.lambda??null,frees:_.frees??[],show:_.show??null,..._.paramSpans?.show?{showSpan:_.paramSpans.show}:{},laps:_.laps??null,loops:!!_.step?.whole,chance:_.chance??.5,seed:_.seed??0,size:_.size??1,tags:(_.tags??``).split(`,`).map(e=>e.trim()).filter(Boolean),about:(_.about??[]).map(e=>e.name),..._.base?{base:{name:_.base.name,..._.base.transpose?{transpose:_.base.transpose}:{},..._.base.degree?{degree:_.base.degree}:{}}}:{},beat:Tu(wu(_)),meter:wu(_),label:_.label??null,note:Qo(_),env:_.env?.name??null,pitch:_.pitch?.name??null,braid:w===null?`blank`:T.kind,units:v,scan:T.kind===`scan`?{lap:oa(T.steps).lap,steps:T.steps}:null,shift:_.shift??0,off:_.off,oneshot:!!_.oneshot,glide:typeof _.params.glide==`number`&&_.params.glide>0?_.params.glide:0,children:y,steps:C,unitSteps:b,hasValues:v.some(e=>G(e.atom).some(e=>e.kind===`note`||e.kind===`chord`)),step:_.step?.kind===`driven`?{driver:_.step.driver.name,cycle:_.step.cycle,whole:_.step.whole,chain:_.step.chain}:null,paramClocks:Object.fromEntries(Object.entries(_.paramClocks??{}).flatMap(([e,t])=>t.kind===`driven`?[[e,{driver:t.driver.name,cycle:t.cycle,whole:t.whole,chain:t.chain}]]:[])),map:_.map?_.map.kind===`table`?{kind:`table`,table:_.map.table.name}:_.map.kind===`edo`?{kind:`edo`,period:_.map.period}:_.map.kind===`ratios`?{kind:`ratios`,ratios:_.braid.kind===`list`?_.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[]}:_.map.kind===`midi`?{kind:`midi`,channel:_.map.channel,port:_.map.port}:{kind:_.map.kind}:null,mix:v.length>0&&v.every(e=>e.atom.kind===`mix`)&&(v.length===1||_.map?.kind===`sample`)&&_.map?.kind!==`midi`?v.flatMap(e=>e.atom.kind===`mix`?a(e.atom):[]):null,sink:_.map?.kind===`sample`,..._.map?.kind===`midi`?{chords:v.map(e=>e.atom.kind===`mix`?a(e.atom):null)}:{},clock:null,rate:0,stride:_.stride??1,params:_.params,paramCells:Object.fromEntries(Object.entries(_.paramCells??{}).map(([e,t])=>[e,{range:t.range,factors:t.factors.map(e=>e.name)}])),voice:Object.keys(_.params).some(e=>Ks.has(e)),freq:_.step?.kind===`rate`||_.step?.kind===`env`?_.step.whole?o(_.step)??261.63:(o(_.step)??261.63)/Math.max(1,C):261.63,kit:!1,..._.gate?{gate:_.gate}:{}};return d.set(e,E),E};for(let[e,n]of t)if(i.get(e))try{g(e,n.span)}catch(e){if(!(e instanceof Cu))throw e;m.length=0}for(let[e,n]of t){let t=d.get(e);if(!t||t.root)continue;let r=t.over??`fifths12TET`;!d.get(r)?.root&&n.braid.kind===`list`&&n.braid.tokens.some(e=>e.atom.kind===`note`&&!Number.isInteger(e.atom.value))&&c(`&${r} is a table, so decimal indexes are rounded down`,n.span)}return d}let Du=`tutorial`,Ou={genre:[`classical`,`jazz`,`electronic`,`experimental`,`world`,`folk`,`ambient`,`dance`,`industrial`,`blues`,`minimal`,`8-bit`],artist:[`Bach`,`Wendy Carlos`,`Stockhausen`,`Neubauten`,`Aphex Twin`,`Brahms`,`Coltrane`,`Pachelbel`,`Kraftwerk`,`Scooter`,`Daft Punk`,`Chemical Brothers`,`Nine Inch Nails`,`Steve Reich`],tutorial:[Du],topic:[`sound`,`rhythm`,`harmony`,`diatonic`,`tonal`,`modal`,`chromatic`,`microtonal`,`tuning`,`arrangement`,`canon`,`counterpoint`,`motifs`,`pentatonic`,`stereo`,`FM`,`MIDI`,`physics`,`tape`]};function ku(e){if(e.toLowerCase()===`tutorial`)return{kind:`tutorial`,name:Du};let t=/^(genre|artist|topic):\s*(.*)$/i.exec(e);return t?{kind:t[1].toLowerCase(),name:t[2]}:{kind:`topic`,name:e}}function Au(e){if(/^(topic:\s*)?basics$/i.test(e.trim()))return Du;let{kind:t,name:n}=ku(e.trim());if(t===`tutorial`)return Du;let r=e=>Ou[e].find(e=>e.toLowerCase()===n.toLowerCase());if(t===`topic`){let t=/^topic:/i.test(e.trim()),i=t?void 0:r(`genre`);if(i)return`genre:${i}`;let a=t?void 0:r(`artist`);return a?`artist:${a}`:n}return`${t}:${r(t)??n}`}function ju(e,t,n,r){let{error:i,warn:a,unknownCell:o}=e,s=new Map(n),c=e=>Object.keys(t.get(e)?.params??{}).length>0,l=e=>e.units.length>0&&e.units.every(e=>e.atom.kind===`ref`&&c(e.atom.name));for(let e of[...s.values()])!e.voice&&!e.root&&l(e)&&s.set(e.name,{...e,kit:!0});let u=[...s.values()].filter(e=>e.sink);for(let[e,n]of t){let t=s.get(e);t&&!t.mix&&!sc(t)&&t.units.some(e=>e.atom.kind===`mix`)&&i(t.sink?`A sound card's channels are all mixes: [left …] [right …], or &left &right`:`A mix is one chord of sounds: &${e} [&a * &v, &b * &w]`,n.span)}let d=(e,t=[])=>{let n=s.get(e.voice.name);return!n?.mix||n.sink?[{b:e,through:t}]:t.includes(n.name)||t.length>16?(i(`&${n.name} plays itself through its mixes`,n.span),[]):n.mix.flatMap(r=>d({voice:r.voice,pitches:[...e.pitches,...r.pitches],offset:e.offset+r.offset,gain:e.gain*r.gain},[...t,n.name]))},f=/* @__PURE__ */ new Map,p=e=>[e.voice.name,e.offset,...e.pitches.map(e=>`${e.sign}${e.ref.name}${JSON.stringify(e.ref.pick)}${e.ref.shift}`)].join(`|`);for(let n of u){let a=t.get(n.name),o=n.units;if(o.length===0||o.length>2){i(`The sound card takes one channel (mono) or two (left, right): &${n.name} map=sample &left &right`,a.span);continue}o.forEach((t,c)=>{let l=t.atom.kind===`mix`?r(t.atom):null,u=t.atom.kind===`ref`?s.get(t.atom.name):l?n:void 0,m=l??(t.atom.kind===`ref`&&u?.mix&&!u.sink?u.mix:null);if(!u||!m){if(t.atom.kind===`ref`&&e.broken.has(t.atom.name))return;i(`A channel of the sound card is a mix: &mix, or [&theme * &lead] written in place`,a.span);return}for(let{b:e,through:t,top:r}of m.flatMap(e=>d(e).map(t=>({...t,top:e})))){let i=p(e),a=f.get(i),s=n.implicit?r.voice.span:u.span;a||f.set(i,a={b:e,span:s,gains:[0,0],via:/* @__PURE__ */ new Set,parts:[],through:/* @__PURE__ */ new Set});for(let e of t)a.through.add(e);let l=o.length===1?[e.gain,e.gain]:c===0?[e.gain,0]:[0,e.gain];a.gains[0]+=l[0],a.gains[1]+=l[1],a.parts.push({mix:u.name,sink:n.name,gains:l}),a.via.add(u.name).add(n.name)}})}let m=e=>{let n=t.get(e)?.over?.name;return n&&s.get(n)?.kit?n:null};{let e=new Set([...f.values()].flatMap(e=>e.parts.map(e=>e.mix))),n=/* @__PURE__ */ new Set;for(let r of t.values())for(let t of[`excite`,`write`]){let i=r.params[t];typeof i==`string`&&s.get(i)?.mix&&!e.has(i)&&n.add(i)}for(let e of n){let t=s.get(e);for(let{b:n,through:r}of t.mix.flatMap(e=>d(e))){if(typeof s.get(n.voice.name)?.params.play==`string`)continue;let i=`send:`+p(n);f.has(i)||[...f.values()].some(e=>p(e.b)===p(n))||f.set(i,{b:n,span:t.span,gains:[n.gain,n.gain],via:/* @__PURE__ */ new Set([e]),parts:[],through:new Set(r),silent:!0})}}}let h=[...s.values()].filter(e=>sc(e));for(let e of h){let n=t.get(e.name),r=e.map;n.step&&i(`A MIDI card doesn't turn: leave out ${n.step.whole?`loop`:`step`}= (&${e.name} map=midi …)`,n.step.span);let o=n.braid.kind===`list`?n.braid.tokens:[],c=e.units.findIndex(e=>e.subdivide!==1||e.elongate!==1);if(c>=0){i(`A MIDI card's entries are channels: x!n repeats one on n channels, but * and @ mean nothing here`,o[c]?.span??n.span);continue}let l=e.units.reduce((e,t)=>e+t.repeat,0);if(r.channel===null&&l>16){i(`A MIDI card has 16 channels, and &${e.name} names ${l}: ~ skips one, map=midi(10) puts them all on one`,n.span);continue}l===0&&a(`&${e.name} is a MIDI card with no channels: write what goes on each, map=midi [&theme * &reed] ~ &groove`,n.map.span);let u=0;e.units.forEach((t,a)=>{let c=o[a]?.span??n.span,l=u;if(u+=t.repeat,t.atom.kind===`rest`)return;let h;if(t.atom.kind===`mix`)h={bindings:e.chords?.[a]??[],mix:null};else if(t.atom.kind===`ref`){let e=t.atom.name,n=s.get(e);if(!n)return;let r={voice:{name:e,pick:t.atom.pick,shift:t.atom.shift,span:c},pitches:[],offset:0,gain:1};if(n.mix&&!n.sink)h={bindings:n.mix,mix:e};else if(m(e)||n.voice||n.kit)h={bindings:[r],mix:null};else{i(sc(n)?`&${e} is a MIDI card: a card's entries are what it sends (a mix, a mix cell, a pattern read through a kit), not another card — name &${e}'s entries here`:`&${e} is a melody without a voice: a MIDI channel plays notes on a voice, [&${e} * &voice]`,c);return}}else{i(`A MIDI card's entries are channels: a mix ([&theme * &reed]), a mix cell, a pattern read through a kit, or ~ to skip one`,c);return}let{bindings:g,mix:_}=h;for(let n=0;n<t.repeat;n++){let t=r.channel??l+n+1;for(let{b:n,through:i}of g.flatMap(e=>d(e))){let a=p(n),o=f.get(a)??[...f.values()].find(e=>p(e.b)===a);o||f.set(a,o={b:n,span:e.span,gains:[0,0],via:/* @__PURE__ */ new Set,parts:[],through:/* @__PURE__ */ new Set});for(let e of i)o.through.add(e);(o.midi??=[]).push({card:e.name,mix:_,channel:t,port:r.port,gain:n.gain}),o.via.add(e.name),_&&o.via.add(_)}}})}let g=[...f.values()].map(e=>{let t=m(e.b.voice.name);return t?{...e,b:{...e.b,voice:{name:t,pick:null,shift:0,span:e.b.voice.span},pitches:[{ref:e.b.voice,sign:1},...e.b.pitches]}}:e}),_=e=>{let t=s.get(e),n=t&&typeof t.params.play==`string`?s.get(t.params.play):void 0,r=n&&typeof n.params.write==`string`?s.get(n.params.write):void 0;return!!r?.mix&&!r.sink};for(let{b:e}of g){let t=s.get(e.voice.name);t&&!t.root&&!t.kit&&!_(t.name)&&!e.pitches.some(e=>e.ref.name===t.name)&&s.set(t.name,{...t,voice:!0})}let v=[...t].find(([,e])=>e.title)?.[0];for(let[e,n]of t){let r=s.get(e);if(!r)continue;if(r.map?.kind===`table`&&!t.has(r.map.table)&&o(r.map.table,n.map.span),n.base&&!t.has(n.base.name)&&o(n.base.name,n.base.span),n.about){r.note||i(`about= belongs on a note: a cell with a label= (or title=) and nothing else`,n.about[0].span);for(let e of n.about)t.has(e.name)||o(e.name,e.span)}if(n.tier!=null&&n.title&&!(n.tags??``).split(`,`).some(e=>Au(e.trim())===`tutorial`)&&a(`tier= puts a piece in a tier of the tutorial; without tags="tutorial" it is ignored`,n.paramSpans.tier??n.span),n.tier!=null&&!n.title&&i(`tier= belongs on a piece’s card: the note with its title=`,n.paramSpans.tier??n.span),e===v&&r.note){let e=[`title`,`tags`,`tier`].filter(e=>n[e]!=null),t=e=>e.length>1?`${e.slice(0,-1).join(`, `)} and ${e.at(-1)}`:e[0],r=e.length>1;a(`${t(e.map(e=>`${e}=`))} on the piece’s card ${r?`go`:`goes`} in its file’s frontmatter now (${e.map(e=>`${e}:`).join(` `)}): Shorten moves ${r?`them`:`it`} there (decision 047)`,n.paramSpans.title??n.span)}if(!r.voice)continue;let c=n.params.s;c!==void 0&&!(String(c)in Xs)&&i(`Unknown sound '${c}' (${Object.keys(Xs).join(`, `)})`,n.paramSpans.s??n.span),c!==void 0&&n.braid.kind!==`blank`&&a(`s=${c} plays a built-in waveform; the braid is ignored`,n.paramSpans.s);for(let[e,t]of Object.entries(n.params))Hs[e]?.value===`number`&&typeof t!=`number`&&i(`${e}= takes a number`,n.paramSpans[e]);let l=Object.keys(n.params).find(e=>Ks.has(e)),u=l?` (${l}= makes &${e} a voice; a meter takes none)`:``;n.step?.kind===`driven`||n.step?.kind===`tap`?i(`A voice moves at a rate — its pitch, like loop=C4${u}`,n.step.span):n.step&&!n.step.whole&&i(`A voice's pitch is loop= (one turn of its braid per cycle): loop=C4${u}`,n.step.span)}return{cells:s,sinks:u,cards:h,bindings:g,soundHead:_}}let Mu=(e,t,n)=>`${e}:${t.written}${n>1?`:${n}`:``}`;function Nu(e,t,n,r){let i=r*e/Math.max(1,t),a=i*t,o=e=>Math.abs(e-Math.round(e))<1e-9&&Math.round(e)>0,s=e=>o(e)&&Number.isInteger(Math.log2(Math.round(e)))&&Math.round(e)<=64;if(o(1/a))return Math.round(1/a)===1?`1m`:`1m/${Math.round(1/a)}`;if(o(a)){if(s(i*n)&&Math.round(i*n)>1)return`${Math.round(i*n)}n`;if(s(2*i*n/3))return`${Math.round(2*i*n/3)}t`}return`pulse${Pu(i)}`}function Pu(e){if(Math.abs(e-1)<1e-9)return``;let t=Iu(e);return t?t[1]===1?`*${t[0]}`:t[0]===1?`/${t[1]}`:`*${t[0]}/${t[1]}`:`*${+e.toFixed(6)}`}let Fu=e=>e.map(e=>`${e.op===`×`?`*`:`/`}${e.n}`).join(``);function Iu(e){for(let t=1;t<=64;t++){let n=Math.round(e*t);if(n>0&&Math.abs(n/t-e)<1e-9)return[n,t]}return null}function Lu(e,t,n){let{rateOf:r,error:i,warn:a,unknownCell:o,broken:s}=e,c=new Map(n),l=/* @__PURE__ */ new Map;for(let[e,n]of t){let t=c.get(e);if(!t||t.voice||t.kit||n.step?.kind!==`rate`&&n.step?.kind!==`env`)continue;let i=r(n.step);if(i===null)continue;typeof n.params.beat==`number`&&!t.meter&&a(`beat= says how many beats a meter(…) or scan(…) counts (alla breve: meter("4/4") beat=2); on &${e}, a list, it does nothing`,n.paramSpans?.beat??n.span),n.params.pulse!==void 0&&(n.braid.kind!==`scan`||typeof n.params.pulse!=`string`||iu(n.params.pulse)===null)&&a(`pulse= says the note value of a scan's entries (pulse=16n: sixteenths, its bpm counting quarters); ${n.braid.kind===`scan`?`${n.params.pulse} is not one (16n, 8t, 4n.)`:`on &${e}, not a scan, it does nothing`}`,n.paramSpans?.pulse??n.span);let o=(n.step.whole?i*Math.max(1,t.steps):i)*(n.step.whole?1:t.beat),s=n.paramSpans?.swing??n.span,u,d=null,f=e=>String(e).replace(/^0\./,`.`);if(typeof n.params.swing==`number`&&t.meter){let r=t.meter;if(!n.swing){let e=uu(r),t=e===null?null:iu(e);a(t!==null&&du(r,t)===null?`swing=${f(n.params.swing)} leans the meter cell's own steps: name the level it leans, swing=${e}:${f(n.params.swing)}`:`swing=${f(n.params.swing)} leans the meter cell's own steps, and they are its beats, which swing never moves: name the level it leans, swing=8n:${f(n.params.swing)}`,s)}for(let t of n.swing??[]){let n=iu(t.level),i=n===null?`${t.level} is not a note value (8n, 16n, 8t)`:du(r,n)??(t.pairs?fu(r,n):null);i&&a(`swing=${t.level}:${f(t.share)}${t.pairs?`:pairs`:``} leans nothing on &${e}: ${i}`,s)}d=_u(r)}else typeof n.params.swing==`number`&&n.swing?a(`swing=${n.swing.map(e=>`${e.level}:${f(e.share)}${e.pairs?`:pairs`:``}`).join(`,`)} leans levels of a meter, and &${e} is not one: write swing=${f(n.params.swing)} (pairs of its steps)`,s):typeof n.params.swing==`number`&&n.params.swing!==.5&&(u=n.params.swing);l.set(e,{cell:e,perSecond:o,positional:_c(t),...u===void 0?{}:{swing:u},...d?{swung:d}:{}})}let u=new Set([...t.values()].flatMap(e=>e.step?.kind===`driven`?[e.step.driver.name]:e.step?.kind===`tap`&&e.step.meter?[e.step.meter.name]:[])),d=/* @__PURE__ */ new Map,f=[],p,m=/* @__PURE__ */ new Map,h=()=>{if(p!==void 0)return p;let e=[...t.values()].filter(e=>l.has(e.name)&&c.get(e.name)?.meter);return p=(e.find(e=>!e.step?.whole)??e[0])?.name??null,p},g=(e,n,r)=>{let a=e.meter?.name??h();if(!a)return i(`${n} taps the piece's main meter, and it has none: write one (&bar meter("4/4") step=100bpm)`,e.span),r(),null;if(!t.has(a))return o(a,e.meter.span),r(),null;if(f.includes(a))return i(`step= loops back: ${[...f.slice(f.indexOf(a)),a].map(e=>`&`+e).join(` → `)}`,e.span),null;let s=v(a);return!c.get(a)?.meter||!s||s.clock!==a?(i(`${n}: &${a} is not a meter that keeps time — a tap reads a meter(…) or scan(…) with a tempo (&${a} meter("4/4") step=100bpm)`,e.meter?.span??e.span),r(),null):a},_=(e,n)=>{let r=`step=${n.meter?`&${n.meter.name}:`:``}${n.tap.written}`,i=g(n,r,()=>s.add(e));if(!i)return null;let a=c.get(i).meter;m.set(e,i);let o=Math.max(1,Math.round(t.get(e)?.cycle??1)),d=a.swing&&Number.isInteger(n.ratio)&&n.ratio>1?n.ratio:1,f=Mu(i,n.tap,o)+(d>1?`*${d}`:``);if(!l.has(f)){let e=ru(a),t=xu(a,n.tap,o),r=a.pulses*o,s=t.flatMap((e,n)=>Array.from({length:d},(i,a)=>e+a*((t[n+1]??r)-e)/d)).map(t=>gu(a,t)*e),c=a.levels.length*o;l.set(f,{cell:i,perSecond:l.get(i).perSecond*s.length/c,positional:!1,tap:{meter:i,positions:s,lap:c}})}let p=n.ratio/d,h=c.get(e);return h?.scan&&u.has(e)?(l.set(e,{cell:e,perSecond:l.get(f).perSecond*p,positional:!0}),{clock:e,rate:1}):h&&typeof t.get(e)?.params.belt==`number`?(l.set(e,{cell:e,perSecond:l.get(f).perSecond*p,positional:!1,belt:{driver:f,rate:p}}),{clock:e,rate:1}):{clock:f,rate:p}},v=e=>{if(d.has(e))return d.get(e);if(l.has(e))return d.set(e,{clock:e,rate:1}),d.get(e);let n=t.get(e)?.step;if(n?.kind===`tap`&&!c.get(e)?.voice){f.push(e);let t=_(e,n);return f.pop(),d.set(e,t),t}if(!n||n.kind!==`driven`||c.get(e)?.voice)return d.set(e,null),null;let r=n.driver.name,s=n.whole?`loop=`:`step=`,p=null;if(!t.has(r))o(r,n.driver.span);else if(f.includes(r)||r===e)i(`${s} loops back: ${[...f.slice(f.indexOf(r)),e,r].map(e=>`&`+e).join(` → `)}`,n.span);else if(c.get(r)?.voice)i(`&${r} is a voice: it moves at audio rate`,n.driver.span);else{f.push(e);let o=v(r);f.pop();let d=c.get(r)?.steps??0,m=c.get(e)?.steps??0;if(o&&!n.whole&&!n.cycle&&c.get(r)?.meter&&l.has(r)){let e=c.get(r).meter,i=Nu(e.levels.length,e.pulses,t.get(r)?.step?.kind===`rate`?e.unit:0,n.ratio);a(`step=&${r}${Fu(n.chain)} steps by the meter cell's own steps: tap the meter by pulse, beat or a note value (step=${h()===r?``:`&${r}:`}${i})`,n.span)}if(!o)a(`&${r} never moves, so &${e} stands still — give &${r} a rate (step=84bpm) or ${s}&cell`,n.driver.span);else if(n.cycle&&d===0)i(`&${r} has no cycle to count`,n.driver.span);else if(n.whole&&m===0)i(`&${e} has no steps to loop`,n.span);else{p={clock:o.clock,rate:o.rate*n.ratio*(n.whole?m:1)/(n.cycle?d:1)};let r=c.get(e);r&&r.scan&&u.has(e)&&!n.whole?(l.set(e,{cell:e,perSecond:l.get(o.clock).perSecond*p.rate,positional:!0}),p={clock:e,rate:1}):r&&typeof t.get(e)?.params.belt==`number`&&!n.whole&&(l.set(e,{cell:e,perSecond:l.get(o.clock).perSecond*p.rate,positional:!1,belt:{driver:o.clock,rate:p.rate}}),p={clock:e,rate:1})}}return d.set(e,p),p};for(let e of[...c.values()]){let n=v(e.name),r=t.get(e.name)?.step,i=m.get(e.name),a=r?.kind===`tap`?n&&i?{driver:i,cycle:!1,whole:!1,chain:r.chain,tap:r.tap.written}:null:e.step;n?c.set(e.name,{...e,clock:n.clock,rate:n.rate,step:a}):a!==e.step&&c.set(e.name,{...e,step:a})}for(let e of t.values())for(let[t,n]of Object.entries(e.paramClocks??{})){if(n.kind===`tap`){let r=c.get(e.name),i=g(n,`${t}=${n.meter?`&${n.meter.name}:`:``}${n.tap.written}`,()=>{});if(!i||!r)continue;let a=c.get(i).meter,o=a.levels.length/l.get(i).perSecond,s=n.tap.kind===`note`?n.tap.whole*a.unit*o/a.pulses:o/xu(a,n.tap,1).length,u=n.ratio/s;c.set(e.name,{...r,params:{...r.params,[t]:+(1/u).toFixed(6)},paramClocks:{...r.paramClocks,[t]:{driver:i,cycle:!1,whole:!1,chain:n.chain,tap:n.tap.written}}});continue}if(n.kind!==`driven`)continue;let r=v(n.driver.name),a=c.get(e.name);if(!r||!a){i(`${t}=&${n.driver.name}: that cell keeps no time`,n.span);continue}let o=l.get(r.clock).perSecond*r.rate*n.ratio;c.set(e.name,{...a,params:{...a.params,[t]:+(1/o).toFixed(6)}})}return{cells:c,clocks:l,mainMeter:h()}}function Ru(e){return(e?.units??[]).flatMap(e=>G(e.atom).flatMap(e=>e.kind===`ref`?[e.name]:[]))}function zu(e,t,n,r=/* @__PURE__ */ new Map){let{error:i,warn:a,unknownCell:o}=e;for(let e of n.values()){let r=n=>t.get(e.name)?.paramSpans?.[n]??t.get(e.name).span;if(typeof e.params.body==`string`&&!(e.params.body in ac)&&i(`body=${e.params.body}: one of ${Object.keys(ac).join(`, `)}`,r(`body`)),typeof e.params.board==`string`&&e.params.board!==`none`&&!(e.params.board in ac)&&i(`board=${e.params.board}: none, or one of ${Object.keys(ac).join(`, `)}`,r(`board`)),typeof e.params.couple==`string`){let t=n.get(e.params.couple);t?typeof t.params.body!=`string`&&i(`couple=&${t.name}: it couples to another resonator (a cell with body=)`,r(`couple`)):o(e.params.couple,r(`couple`))}typeof e.params.excite==`string`&&!n.get(e.params.excite)?.mix&&i(`excite=&${e.params.excite}: a resonator is driven by sound — a mix`,r(`excite`))}for(let e of n.values()){let r=e.show?.startsWith(`mix:&`)?e.show.slice(5):null;if(r===null)continue;let i=t.get(e.name)?.paramSpans?.show??t.get(e.name).span,s=n.get(r);e.mix?s?s.root||a(`show=mix:&${r}: a mix's colours follow a grid (a cell with cycle= or map=edo), not &${r}`,i):o(r,i):a(`show=mix:&${r} does nothing on &${e.name}: it names the grid a mix's colours follow, and &${e.name} isn't a mix`,i)}for(let e of n.values()){let r=n=>t.get(e.name)?.paramSpans?.[n]??t.get(e.name).span;if(typeof e.params.write==`string`){let t=n.get(e.params.write);t?t.voice&&i(`write=&${t.name}: a tape records what plays — a melody, not a voice`,r(`write`)):o(e.params.write,r(`write`))}if(typeof e.params.play==`string`){let t=n.get(e.params.play);t?typeof t.params.write!=`string`&&i(`play=&${t.name}: a read head plays a tape — a cell with write= (what it records)`,r(`play`)):o(e.params.play,r(`play`))}}for(let e of n.values()){let r=e.params.fm;if(typeof r!=`string`)continue;let a=t.get(e.name)?.paramSpans?.fm??t.get(e.name).span,s=n.get(r);if(!s)o(r,a);else if(!s.voice)i(`fm=&${r}: a modulator is a voice (s=sine ratio=…)`,a);else{let t=/* @__PURE__ */ new Set([e.name]);for(let e=r;e;e=typeof n.get(e)?.params.fm==`string`?n.get(e).params.fm:void 0){if(t.has(e)){i(`fm=&${r}: the modulators come back round to &${e} — FM chains can't loop`,a);break}t.add(e)}}}for(let e of t.values())for(let[t,r]of Object.entries(e.paramCells??{})){Gs.has(t)||i(`${t}= can't move: it takes a number (these can: ${[...Gs].join(` `)})`,r.span),r.range&&!(r.range[0]>=0&&r.range[1]>=0)&&i(`${t}=: a range of positive values, low..high`,r.span);let e=0;for(let t of r.factors){let r=n.get(t.name);r?r.map?.kind===`adsr`&&e++:o(t.name,t.span)}e>1&&i(`${t}=: one envelope (map=adsr) at most — the other factors scale it`,r.span),e&&!r.range&&i(`${t}=&env: an envelope runs 0 to 1 — give it a range: ${t}=200..3000 * &env`,r.span)}for(let e of t.values()){let r=e.params.legato,o=e.paramSpans.legato??e.span,s=e.frees?.find(e=>e.key===`param`&&e.param===`legato`),c=e=>i(`legato=${e}: a share of each note's held length is above 0 (.5 staccato, 1 as written, 1.5 into the next)`,o);typeof r==`string`?i(`legato=${r}: a share (.5), free(.5, .25..2.5) or a cell of shares (&artic)`,o):typeof r==`number`&&!(r>0)?c(String(r)):s&&!(s.lo>0)&&c(`free(${s.value}, ${s.lo}..${s.hi})`);let l=e.legato?.find(e=>!(e.share>0));l&&c(`${l.level}:${l.share}`),e.legato&&!n.get(e.name)?.meter&&a(`legato=${e.legato.map(e=>`${e.level}:${e.share}`).join(`,`)} gives the lines tapping a meter their share: &${e.name} is not a meter, so it does nothing`,o);let u=e.paramCells?.legato;u?.range&&!(u.range[0]>0)&&c(`${u.range[0]}..${u.range[1]}`);for(let e of u&&!u.range?u.factors:[]){let n=t.get(e.name),r=(n?.braid.kind===`list`?n.braid.tokens.flatMap(e=>G(e.atom)).flatMap(e=>e.kind===`note`?[e.value+e.alter]:e.kind===`chord`?e.notes:[]):[]).find(e=>!(e>0));r!==void 0&&c(`&${e.name}: its ${r}`)}}for(let e of t.values())e.stride!==null&&e.step?.kind!==`driven`&&e.step?.kind!==`tap`&&a(`stride= only matters with step=&cell or a tap (step=1m)`,e.paramSpans?.stride??e.span);for(let e of t.values())for(let[t,r]of[[`env`,e.env],[`pitch`,e.pitch]]){if(!r)continue;let e=n.get(r.name);e?t===`env`&&e.map?.kind!==`adsr`&&e.map?.kind!==`amp`&&e.map?.kind!==`lin`&&e.map?.kind!==`db`?i(`env= takes a volume: a cell with map=adsr (an envelope), map=amp, map=db or map=lin`,r.span):t===`pitch`&&(e.map?.kind===`adsr`||e.map?.kind===`amp`||e.map?.kind===`db`)&&i(`pitch= takes a pitch (a vibrato, map=lin to glide), not a volume`,r.span):o(r.name,r.span)}for(let e of t.values()){if(e.map?.kind!==`adsr`)continue;let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];(t.length!==4||t.some(e=>!(e>=0))||t[2]>1)&&i(`map=adsr takes four numbers: attack decay sustain release — seconds, and sustain a level 0…1 (map=adsr .01 .3 .5 .4)`,e.map.span)}for(let e of t.values()){if(e.map?.kind!==`ratios`)continue;let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];e.over===null?(t.length<2||t.some((e,n)=>!(e>0)||n>0&&!(e>t[n-1])))&&i(`map=ratios lists one period's tones as rising ratios, the last the period: map=ratios 1 9/8 5/4 4/3 3/2 5/3 15/8 2`,e.map.span):i(`A grid (map=ratios) reads nothing: its braid is its tones`,e.map.span)}for(let e of t.values())e.map?.kind===`edo`&&(e.over!==null||e.braid.kind!==`blank`)&&i(`A grid (map=edo, map=ed(r)) reads nothing and has no braid: &${e.name} cycle=19 map=edo`,e.map.span);for(let i of t.values()){let t=i.over?n.get(i.over.name):void 0;if(!t||t.kit)continue;let o=Ru(t);if(!o.length||o.every(e=>r.get(e)===t.name)||e.broken.has(i.name))continue;let s=[...new Set(o)].map(e=>`&`+e).join(` `);a(`&${t.name} is read as a table, but its cells (${s}) aren't entries: a table is its numbers. To play cells one after another, splice them into a braid (&${i.name} ${s}); choosing a melody per step isn't built yet (#29)`,i.over.span)}for(let[e,i]of r)[...n.values()].some(t=>t.step?.driver===e||Object.values(t.paramClocks).some(t=>t.driver===e))||a(`&${e} is a section of &${i}, but nothing is stepped by it: step=&${e} on what it should play (or a name mistyped)`,t.get(e).span);for(let e of t.values()){let t=e.map?.kind===`table`?n.get(e.map.table.name):void 0;t&&(t.mix||t.sink||sc(t))&&a(`map=&${t.name}: a map reads a table's numbers, and &${t.name} is ${sc(t)?`a MIDI card`:t.sink?`the sound card`:`a mix`}, which has none: nothing is mapped`,e.map.span)}for(let e of n.values()){let n=e.map?.kind===`midi`?e.map.channel:null;if(n===null)continue;let r=t.get(e.name);(r?.braid.kind===`list`?r.braid.tokens:[]).forEach(e=>{e.repeat>1&&e.atom.kind!==`rest`&&a(`!${e.repeat} on a card with one channel (map=midi(${n})): each note goes out ${e.repeat.toLocaleString(`en`)} times on it, at once — leave out the !${e.repeat}`,e.span)})}for(let e of new Set(r.values()))if(![...t.values()].some(t=>t.over?.name===e)){let n=[...r].filter(([,t])=>t===e).map(([e])=>e),i=t.get(n[0])?.step,o=i?.kind===`driven`?i.driver.name:`bar`;a(`&${e} declares sections (${n.map(e=>`&`+e).join(` `)}), and nothing selects them: every part plays all the time. A selector reads the table and switches them, a step of the form at a time: &song over=&${e} step=&${o}/16 0 [0,1]`,t.get(e).span)}let s=Math.max(12,...[...n.values()].filter(e=>e.root).map(e=>e.cycle))*Bu;for(let e of n.values()){let r=t.get(e.name);if(!r||e.implicit)continue;let i=r.braid.kind===`list`?r.braid.tokens:[];e.units.forEach((t,r)=>{let o=t.atom;if(o.kind!==`ref`||!o.values||Math.abs(o.values.add)<=s)return;let c=n.get(o.name);a(`degree(${c?.lambda?`&( … )`:`&`+o.name}, ${o.values.add}) moves it ${Math.abs(o.values.add).toLocaleString(`en`)} steps, over a hundred octaves: ${o.values.add>0?`its notes land above 20 kHz and are dropped`:`its notes fall below hearing`}, nothing plays`,i[r]?.span??e.span)});let o=Math.abs(e.shift)/Math.max(1,e.units.length);o>Vu&&a(`shift=${e.shift} turns ${e.lambda?`an unnamed cell &( … )`:`&`+e.name} about ${Math.round(o).toLocaleString(`en`)} laps, and every lap climbs a lap of the grid: its notes leave hearing`,r.paramSpans?.shift??r.span)}}let Bu=100,Vu=20;function Hu(e,t,n,r,{sinks:i,cards:a,bindings:o,soundHead:s}){let{parsed:c,error:l,warn:u,unknownCell:d}=e,f=[],p=[],m=[],h=e=>!!e.clock&&t.get(e.name)?.step?.whole===!1,g=e=>(r.get(e.clock)?.perSecond??0)*e.rate,_=e=>{let t=[...e].sort((e,t)=>g(t.c)-g(e.c)),[n,r]=[g(t[0].c),g(t[1].c)];return n-r>1e-9*Math.max(n,r)?t[0]:null};for(let{b:r,span:i,gains:a,via:c,parts:g,through:v,silent:y,midi:b}of o){let o=e=>t.has(e.name)?!0:(d(e.name,e.span),!1);if(![r.voice,...r.pitches.map(e=>e.ref)].every(o)||[r.voice,...r.pitches.map(e=>e.ref)].some(t=>e.broken.has(t.name)))continue;if(s(r.voice.name)&&r.pitches.length===0){p.push({head:r.voice.name,tape:n.get(r.voice.name).params.play,gains:[a[0],a[1]],parts:g,through:[...v]});continue}let x=n.get(r.voice.name);if(!x)continue;if(typeof x.params.body==`string`&&r.pitches.length===0){let[e,t]=oc(x.params.pan);m.push({cell:x.name,gains:[a[0]*e,a[1]*t],parts:g.map(n=>({...n,gains:[n.gains[0]*e,n.gains[1]*t]})),through:[...v]});continue}let S=[...c,...v].map(e=>n.get(e)?.gate?.notes).find(e=>!!e&&r.pitches.some(t=>t.ref.name===e)),C=x.kit?r.pitches.find(e=>t.get(e.ref.name)?.over?.name===x.name||e.ref.name===S):void 0;if(x.kit&&!C){l(`A kit is a table of voices: read the pattern through it, &drums over=&${x.name}, and mix &drums`,r.voice.span);continue}if(x.root){l(`&${x.name} is a grid, not a voice`,r.voice.span);continue}if(r.voice.pick||r.voice.shift){l(`Pick or shift the melody, not the voice: &theme[0] * &${x.name}`,r.voice.span);continue}if(t.get(x.name)?.step?.kind===`driven`||t.get(x.name)?.step?.kind===`tap`){l(`&${x.name} moves with step=&…, so it can't be a voice: a voice moves at a rate, its pitch (loop=C4)`,r.voice.span);continue}!x.params.s&&x.freq<20&&u(`&${x.name} loops at ${+x.freq.toFixed(2)} Hz, below hearing — is it a pitch? Then leave out its sound parameters: (&theme + &${x.name}) * &lead`,r.voice.span);let w=[...x.env?[{ref:t.get(x.name).env,sign:1,inSum:!1}]:[],...x.pitch?[{ref:t.get(x.name).pitch,sign:1,inSum:!0}]:[]],T=r.pitches.find(e=>e.ref.transpose||e.ref.degree);T?.ref.transpose?l(`&${T.ref.name}^$${T.ref.transpose}: transposing (^$) is for braids — in a mix, add pitch: &${T.ref.name} + ${T.ref.transpose}`,T.ref.span):T&&l(`&${T.ref.name}^${T.ref.degree}: moving by degrees (^) is for braids — in a mix, write a cell that plays it: &u step=&bar &${T.ref.name}^${T.ref.degree}`,T.ref.span);let E=/* @__PURE__ */ new Map,D=[...r.pitches,...w].map(e=>{let t=n.get(e.ref.name),r=t&&typeof t.params.play==`string`?n.get(t.params.play):void 0,i=r&&typeof r.params.write==`string`?n.get(r.params.write):void 0;return t&&r&&i&&(E.set(e,{head:t.name,tape:r.name,at:typeof t.params.at==`number`?t.params.at:0,length:typeof r.params.length==`number`?r.params.length:0,erase:typeof r.params.erase==`number`?Math.min(1,Math.max(0,r.params.erase)):1}),t=i),{t:e,c:t}}).filter(e=>e.c),O=D.filter(e=>e.c.voice);if(O.length){l(`Two sounds can't multiply (&${O[0].c.name} * &${x.name}): &${O[0].c.name} plays as a voice — mix them with + or ,`,O[0].t.ref.span);continue}let k=e=>e.c.map?.kind===`adsr`,A=e=>e.c.map?.kind===`amp`||e.c.map?.kind===`db`||e.c.map?.kind===`lin`&&!e.t.inSum,j=D.filter(k),M=D.filter(e=>!A(e)&&!k(e)),N=D.filter(e=>A(e));if(j.length>1){l(`One envelope per note: &${j[0].c.name} and &${j[1].c.name} both shape &${x.name}`,j[1].t.ref.span);continue}let P=j.find(e=>e.t.inSum||e.t.sign<0);if(P){l(`&${P.c.name} is an envelope (map=adsr): a volume, it multiplies — keep it out of pitch sums`,P.t.ref.span);continue}let ee=j[0]?gc(j[0].c):null,F=N.find(e=>e.t.sign<0);if(F){l(`&${F.c.name} is a volume (map=amp): it multiplies, it can't be subtracted`,F.t.ref.span);continue}let I=M.filter(e=>h(e.c)),te=I.length===0;te&&(I=N.filter(e=>h(e.c)));let[ne,re]=x.kit?[1,1]:oc(x.params.pan),ie=e=>({cell:e.c.name,pick:e.t.ref.pick,shift:e.t.ref.shift,sign:e.t.sign,...e.t===C?{picks:!0}:{}}),ae={voice:x.name,kit:x.kit,offset:r.offset,gains:[a[0]*ne,a[1]*re],parts:g.map(e=>({...e,gains:[e.gains[0]*ne,e.gains[1]*re]})),select:[],...y?{silent:!0}:{},...b?.length?{midi:b}:{},through:[...v],envelope:ee,envelopeCell:j[0]?.c.name??null,via:[...c],span:i},oe=new Set(w);if(I.length===0&&!x.kit&&M.every(e=>oe.has(e.t))){f.push({id:`${x.name}:${x.name}:${r.voice.span.line}:${r.voice.span.col}`,...ae,cell:x.name,pick:null,shift:0,sign:1,gate:!1,drone:!0,mods:M.map(ie),levels:N.map(ie)});continue}if(I.length===0){l(D.length?`Nothing starts notes on &${x.name}: give a pitch or a volume (map=amp) step= timing (step=4n); loop= terms only bend`:`&${x.name} has nothing to play: a melody goes before it, like &melody * &${x.name}`,i);continue}if(I.length>1){let e=_(I);if(!e){l(`Both &${I[0].c.name} and &${I[1].c.name} would start notes on &${x.name}, at the same rate — make one coarser (it then holds under the other) or loop= (it then bends or shapes them)`,I[1].t.ref.span);continue}I=[e]}let{t:L,c:se}=I[0],ce=D.find(e=>mc(e.c,e.t.ref.pick)===null);if(ce){l(hc(ce.c.name,ce.t.ref.pick,ce.c.units.length),ce.t.ref.span);continue}if(mc(se,L.ref.pick)===0){l(`&${se.name} has no steps to play`,L.ref.span);continue}!E.has(L)&&Uu(n,se,L.ref.pick)&&u(`&${se.name}${L.ref.pick?Zo(L.ref.pick):``} plays only rests (~): nothing sounds on &${x.name}`,L.ref.span),f.push({id:`${x.name}:${se.name}:${L.ref.span.line}:${L.ref.span.col}`,...ae,cell:se.name,pick:L.ref.pick,shift:L.ref.shift,sign:L.sign,gate:te,mods:M.filter(e=>e!==I[0]).map(ie),levels:N.filter(e=>e!==I[0]).map(ie),...E.has(L)?{tape:E.get(L)}:{}})}let v=e=>f.some(t=>t.voice===e&&(t.parts.length||t.silent)),y=f.find(e=>e.midi&&!e.parts.length&&!e.silent&&!e.kit&&!v(e.voice)&&Object.keys(t.get(e.voice)?.params??{}).some(e=>Ks.has(e)));if(y){let e=t.get(y.voice),n=Object.keys(e.params).filter(e=>Ks.has(e));u(`&${y.voice} is only on a MIDI card: its sound (${n.map(e=>`${e}=`).join(` `)}) isn't sent — MIDI carries its notes, velocity and bends; the device makes the sound`,e.paramSpans[n[0]]??e.span)}return i.length===0&&a.length===0&&c.cells.length>0&&!c.broken?.length&&u(`Nothing plays yet — write a sound: a voice alone plays its own pitch (&a loop=A4), a melody plays on one ([&melody * &a])`,_l),{outputs:f,returns:p,resonances:m}}function Uu(e,t,n,r=[]){if(r.includes(t.name)||t.frees.some(e=>e.key===`braid`))return!1;let i=pc(t.units.length,n,t.shift);if(!i?.length)return!1;let a=n=>{if(n.kind===`rest`)return!0;if(n.kind===`seq`)return G(n).every(a);let i=n.kind===`ref`?e.get(n.name):void 0;return!!i&&n.kind===`ref`&&Uu(e,i,n.pick,[...r,t.name])};return i.every(e=>a(t.units[e].atom))}function Wu(e){let t=new Map(e),n=/* @__PURE__ */ new Map;for(let e of t.values())(e.root||e.over)&&n.set(e.name,e.root?e.name:e.over);for(let e=!0,r=0;e&&r<64;r++){e=!1;for(let r of t.values()){let t=n.get(r.name);if(t)for(let i of r.children.keys())n.has(i)||(n.set(i,t),e=!0)}}for(let e of t.values())t.set(e.name,{...e,context:n.get(e.name)??`fifths12TET`});for(let e of t.values()){if(typeof e.params.body!=`string`)continue;let n=[];for(let r of e.units.flatMap(e=>G(e.atom)))if(r.kind===`note`)n.push({shift:r.value+r.alter,params:{}});else if(r.kind===`ref`){let e=t.get(r.name);if(e)for(let t of e.units)t.atom.kind===`note`&&n.push({shift:t.atom.value+t.atom.alter,params:e.params})}else if(r.kind===`chord`)for(let[e,t]of r.notes.entries())n.push({shift:t+r.alters[e],params:{}});t.set(e.name,{...e,exciters:n.length?n:Array.from({length:12},(e,t)=>({shift:t,params:{}}))})}return t}let Gu=[`restart`,`resume`,`free`];function Ku(e,{decls:t,implicit:n,sections:r},i,a,o){let{warn:s}=e,c=new Set([...i.values()].flatMap(e=>typeof e.params.fm==`string`?[e.params.fm]:[])),l=e=>{let t=/* @__PURE__ */ new Set;return e.voice&&t.add(`voice`),a.get(e.name)&&!a.get(e.name).belt&&t.add(`clock`),e.step&&t.add(`driven`),typeof e.params.motor==`number`&&t.add(`motor`),typeof e.params.write==`string`&&t.add(`tape`),typeof e.params.play==`string`&&t.add(`head`),typeof e.params.body==`string`&&t.add(`resonator`),typeof e.params.scope==`string`&&t.add(`scope`),typeof e.params.law==`string`&&t.add(`law`),e.gate&&t.add(`gate`),e.sink&&t.add(`card`),e.note&&t.add(`note`),typeof e.params.fm==`string`&&t.add(`carrier`),c.has(e.name)&&t.add(`modulator`),r.has(e.name)&&t.add(`section`),e.over&&[...r.values()].includes(e.over)&&t.add(`selector`),t};for(let r of t.values()){let t=i.get(r.name);if(!t||n.has(r.name))continue;let a=r.show?.split(`:`)[0];a&&!Uc.includes(a)&&!o.has(a)&&e.error(`show=${a}: not a show (${Uc.join(` `)}), not one of the built-in plugins (${[...o.values()].filter(e=>e.builtin).map(e=>e.name).join(` `)}), and the piece carries no plugin of that name (${cl})`,r.span);let c=l(t),u=[...Object.keys(r.params).map(e=>[e,r.paramSpans[e]??r.span]),...Object.entries(r.paramCells??{}).map(([e,t])=>[e,t.span]),...Object.entries(r.paramClocks??{}).map(([e,t])=>[e,t.span]),...[`env`,`pitch`,`title`].filter(e=>r[e]).map(e=>[e,e===`title`?r.span:r[e].span])];for(let[e,n]of u){let i=Hs[e];e===`anchor`&&c.has(`law`)?s(`anchor= sets the clock a law reads, not the law: write it on ${t.over?`&${t.over}`:`its day (over=&day, a clock loop=1d)`} — the law on &${r.name} doesn't read it`,n):e===`pan`&&(t.mix||t.sink||sc(t))?s(`pan= places a voice: on ${t.sink?`the sound card`:sc(t)?`a MIDI card`:`the mix &${r.name}`} it does nothing — put it on the voice (&voice pan=${r.params.pan})`,n):e===`pan`&&typeof r.params.pan==`number`&&(r.params.pan<0||r.params.pan>1)?s(`pan=${r.params.pan}: pan runs from 0 (left) to 1 (right); ${r.params.pan<0?`this plays hard left`:`this plays hard right`}`,n):i?.on&&!i.on.some(e=>c.has(e))?s(`${e}= acts on ${qs(i.on)}: on &${r.name} it does nothing`,n):e===`restart`&&!Gu.includes(r.params.restart)?s(`restart=${r.params.restart}: what switching a part on does to its time is restart, resume or free — this plays as restart`,n):i?.value===`number`&&!t.voice&&typeof r.params[e]==`string`&&s(`${e}= takes a number: '${r.params[e]}' does nothing`,n)}if(r.gate){let e=r.step?r.step.whole?`loop`:`step`:null;for(let[t,n]of[[`over`,r.over?.span],[e,r.step?.span],[`shift`,r.shift===null?void 0:r.paramSpans.shift],[`stride`,r.stride===null?void 0:r.paramSpans.stride],[`map`,r.map?.span],[`cycle`,r.cycle===null?void 0:r.span]])t&&n&&s(`${t}= on a gate does nothing: a gate plays with each note of play=&${r.gate.notes}, so it times and reads nothing itself — put it on &${r.gate.notes}`,n);r.gate.gain<0&&s(`${r.gate.port===`trigger`?`gain`:`level`}=${r.gate.gain}: a level is 0 or more, and a negative one doesn't play softer — write ${-r.gate.gain}`,r.paramSpans[r.gate.port===`trigger`?`gain`:`level`]??r.span)}}let u=new Set([...t.values()].flatMap(e=>e.show?[e.show.split(`:`)[0]]:[]));for(let e of o.values())!e.builtin&&!u.has(e.name)&&s(`the piece carries the plugin "${e.name}", but no cell says show=${e.name}`,{line:e.line,col:1,len:`=== plugin ${e.name} ===`.length})}let qu=e=>Number.isFinite(e)?Math.round(e).toLocaleString(`en`):`unboundedly many`,Ju=e=>e.lambda?`An unnamed cell &( … )`:`&${e.name}`;function Yu(e,t,n,r,i){let{error:a,warn:o}=e,s=/* @__PURE__ */ new Map,c=/* @__PURE__ */ new Set,l=e=>{let t=s.get(e);if(t)return t;if(c.has(e))return[];c.add(e);let r=(n.get(e)?.units??[]).map(e=>Eo(e,e=>e.kind===`note`||e.kind===`choice`?1:e.kind===`chord`?e.notes.length:e.kind===`ref`?u(e.name,e.pick):0));return c.delete(e),s.set(e,r),r},u=(e,t=null)=>{let n=l(e);return(fc(n.length,t)??[]).reduce((e,t)=>e+n[t],0)},d=/* @__PURE__ */ new Set;for(let e of n.values()){if(e.implicit)continue;let n=l(e.name),r=n.reduce((e,t)=>e+t,0);if(r<=5e4||(d.add(e.name),e.units.some(e=>e.atom.kind===`ref`&&u(e.atom.name,e.atom.pick)>5e4)))continue;let i=t.get(e.name),o=i?.braid.kind===`list`?i.braid.tokens:[],s=0,c=o[n.findIndex(e=>(s+=e)>5e4)]?.span??e.span;a(`${Ju(e)} expands to ${qu(r)} notes: more than ${qu(nc)}, the most a cell can hold — repeat less (!n), or let a clock repeat it`,c)}let f=/* @__PURE__ */ new Set,p=/* @__PURE__ */ new Map;for(let e of i){let i=n.get(e.cell);if(!i?.clock||d.has(i.name)||f.has(i.name)||i.params.law!==void 0)continue;let o=r.get(i.clock);if(!o)continue;let s=Math.max(1,i.steps),c=o.perSecond*i.rate*u(i.name)/s,l=o.tap?.meter??i.clock;if(c>(p.get(l)??0)&&p.set(l,c),!(c>2e3))continue;f.add(i.name);let m=t.get(i.name)?.step?.span??t.get(i.clock)?.step?.span??i.span;a(`${Ju(i)} would start ${qu(c)} notes a second: more than ${qu(rc)}, the most a cell can play — slow its step= or loop=`,m)}let m=/* @__PURE__ */ new Set;for(let e of n.values()){let t=r.get(e.name);t&&!p.has(e.name)&&e.frees.some(e=>e.key===`step`||e.key===`loop`)&&(p.set(e.name,t.perSecond*u(e.name)/Math.max(1,e.steps)),m.add(e.name))}for(let[e,t]of p){let r=n.get(e);if(!r||!(t>0)||!Number.isFinite(t))continue;let i=e=>Math.floor(e.value*rc/t),a=r.frees.filter(e=>(e.key===`step`||e.key===`loop`)&&e.value>0&&e.hi>i(e)&&i(e)>=e.value);if(a.length){r.frees=r.frees.map(e=>a.includes(e)?{...e,hi:i(e)}:e);for(let t of a)o(m.has(e)?`${t.key}=free(…): moved up to ${qu(t.hi)}, &${e} would move what it moves more than ${qu(rc)} times a second, the most a cell can play: the slider stops at ${qu(i(t))}`:`${t.key}=free(…): moved up to ${qu(t.hi)}, a cell &${e} clocks would start more than ${qu(rc)} notes a second, the most a cell can play: the slider stops at ${qu(i(t))}`,t.span)}}}function Xu(e,t,n){if(!n.size)return[...e];let r=e=>[...t.values()].filter(t=>t.over===e&&t.clock);return e.map(e=>{let i=t.get(e.cell);for(let a=0;i?.step&&a<32;a++){let a=i.step.driver,o=n.get(a);if(o){let n=t.get(o).units.findIndex(e=>e.atom.kind===`ref`&&e.atom.name===a),i=r(o).map(e=>({cell:e.name,entry:n,part:a})),s=[.../* @__PURE__ */ new Set([...e.via,...i.map(e=>e.cell),o,a])];return i.length?{...e,via:s,select:[...e.select,...i]}:e}i=t.get(a)}return e})}let Zu=e=>new Map([...ml,...e.plugins??[]].map(e=>[e.name,e]));function Qu(e,t,n=/* @__PURE__ */ new Set){let r=gl(e,t),i=nu(r,Cl(r),n),{decls:a,builtin:o}=i,s=Yl(r,a),c=ju(r,a,Eu(r,i,s),s),l=Lu(r,a,c.cells),{clocks:u}=l;zu(r,a,l.cells,i.sections);let d=Hu(r,a,l.cells,u,c),{returns:f,resonances:p}=d,m=Xu(d.outputs,l.cells,i.sections);Yu(r,a,l.cells,u,m);let h=Wu(l.cells);Ku(r,i,h,u,Zu(e));let{diagnostics:g}=r,_=!g.some(e=>e.severity===`error`);g.sort((e,t)=>e.span.line-t.span.line||e.span.col-t.span.col);let v=new Set([...h.values()].filter(e=>e.off).map(e=>`cell:${e.name}`)),y=(e,t,n)=>typeof e.params[t]==`number`?e.params[t]:n;return{ok:_,cells:h,clocks:u,outputs:m,off:v,diagnostics:g,tapes:[...h.values()].filter(e=>typeof e.params.write==`string`&&!!h.get(e.params.write)?.mix).map(e=>({name:e.name,source:e.params.write,length:y(e,`length`,0),erase:Math.min(1,Math.max(0,y(e,`erase`,1))),tone:y(e,`tone`,7e3),drive:y(e,`drive`,.15),hiss:y(e,`hiss`,0),print:y(e,`print`,0),printgap:y(e,`printgap`,.6),dropout:y(e,`dropout`,0),heads:[...h.values()].filter(t=>t.params.play===e.name).map(e=>({head:e.name,at:y(e,`at`,0),wander:y(e,`wander`,0),wanderhz:y(e,`wanderhz`,.2)}))})),returns:f,resonances:p,plugins:Zu(e),sections:i.sections,...l.mainMeter?{mainMeter:l.mainMeter}:{},...i.mainKey?{mainKey:i.mainKey}:{},...o?{builtinCard:o}:{}}}let $u=/^&([A-Za-z_][A-Za-z0-9_]*)(?=\s|$)/,ed=/[+*,[]\s*$/;function td(e){let t=[],n=null;return e.split(`
`).forEach((e,r)=>{let i=q(e)[0];if(n??={written:[],code:[],line:r+1},n.written.push(e),n.code.push(i),ed.test(i))return;let a=n.code.join(` `).trim().split(/\s+/).join(` `);a&&t.push({name:$u.exec(a)?.[1]??null,use:ps(a),written:n.written.join(`
`),code:a,line:n.line}),n=null}),t}let nd=e=>/^\s*use(?![A-Za-z0-9_])/m.test(e);function rd(e){let t=2166136261,n=1523705862;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,16777619),n=Math.imul(n^i,16777619)^n>>>15}return(t>>>0).toString(16).padStart(8,`0`)+(n>>>0).toString(16).padStart(8,`0`)}let id=e=>`e1:${rd(td(e).map(e=>e.code).join(`
`))}`,ad=e=>JSON.stringify(e),od=e=>e.map(ad).join(` → `);function sd(e,t,n){let r=new Set(e.flatMap(e=>e.name?[e.name]:[])),i=/* @__PURE__ */ new Map,a=e.filter(e=>e.name);return{lines:a,per:t.map(({id:e,lines:t},o)=>{let s=/* @__PURE__ */ new Set,c=/* @__PURE__ */ new Set;for(let l of t){if(!l.name)continue;if(r.has(l.name)){c.add(`&${l.name}`);continue}let t=i.get(l.name);if(t&&t.id!==e){t.code===l.code?s.add(`&${l.name}`):n(o,`&${l.name} is defined by ${ad(t.id)} and by ${ad(e)}, by different lines: write it in the piece, or drop one use`);continue}i.set(l.name,{id:e,code:l.code}),s.add(`&${l.name}`),a.push(l)}return{gave:[...s],overrode:[...c]}})}}function cd(e,t,n,r){let i=td(t),a=` (in ${od(e)})`,o=/* @__PURE__ */ new Set;return sd(i,i.flatMap(t=>{if(t.use===void 0)return[];if(t.use===null)return r(`${ms}${a}`),[];let i=t.use;if(o.has(i))return[];o.add(i);let s=[...e,i];if(e.includes(i))r(`use ${ad(i)} is a cycle: ${od(s)}`);else if(s.length>8)r(`use ${ad(i)} nests past 8 deep: ${od(s)}`);else{let e=n(i);if(e===null)r(`No fragment ${ad(i)} to use${a}`);else return[{id:i,lines:cd(s,e,n,r)}]}return[{id:i,lines:[]}]}),(e,t)=>r(`${t}${a}`)).lines}function ld(e,{resolve:t,locked:n=[]}={}){let r=td(e),i=r.filter(e=>typeof e.use==`string`),a=[],o=e=>{let t=e.written.split(`
`)[0]??``,n=t.search(/\S/);return{line:e.line,col:n+1,len:t.trimEnd().length-n}},s=[],c=/* @__PURE__ */ new Map,l=i.map((e,r)=>{let l=o(e),u=c.get(e.use);if(u!==void 0)return a.push({severity:`warning`,message:`use ${ad(e.use)} is written already, on line ${i[u].line}: this one adds nothing`,span:l}),s.push(s[u]??null),{id:e.use,lines:[]};c.set(e.use,r);let d=e=>a.push({severity:`error`,message:e,span:l}),f=n.find(t=>t.id===e.use)?.hash,p=t?t(e.use,...f?[f]:[]):null;if(p===null)return d(t?`No fragment ${ad(e.use)} to use`:`No library to use ${ad(e.use)} from: compileSource(text, env, { resolve })`),s.push(null),{id:e.use,lines:[]};let m=id(p);return s.push(m),f&&f!==m&&a.push({severity:`warning`,message:`${ad(e.use)} has changed since this piece was saved: its current version plays`,span:l}),{id:e.use,lines:cd([e.use],p,t,d)}}),u=sd(r,l,(e,t)=>a.push({severity:`error`,message:t,span:o(i[e])})),d=e.split(`
`).length,f=new Map(l.flatMap((e,t)=>e.lines.map(e=>[e,t]))),p=u.lines.filter(e=>f.has(e)),m=[];for(let e of p)for(let t=e.written.split(`
`).length;t>0;t--)m.push(o(i[f.get(e)]));return{text:p.length?[e,...p.map(e=>e.written)].join(`
`):e,uses:i.map((e,t)=>({id:e.use,span:o(e),hash:s[t]??null,gave:u.per[t].gave,overrode:u.per[t].overrode})),given:new Set(p.flatMap(e=>e.name?[e.name]:[])),diagnostics:a,through:e=>e>d?m[e-d-1]??null:null}}function ud(e,t=lc){return Qu(e,t)}function dd(e,t=lc,n={}){if(!nd(e))return ud(hl(e),t);let r=ld(e,n),i=Qu(hl(r.text),t,r.given),a=[...r.diagnostics,...i.diagnostics.map(e=>({...e,span:r.through(e.span.line)??e.span}))].sort((e,t)=>e.span.line-t.span.line||e.span.col-t.span.col);return{...i,ok:!a.some(e=>e.severity===`error`),diagnostics:a,uses:r.uses}}let fd=10080,pd=60/84,md=[2,2,1,2,2,2,1],hd=[0,4,1,5,2,6,2,5,1,4,0,3],gd=(e,t)=>(e%t+t)%t;[5,3,1,6,4,2,0].map(e=>e/6);function _d(e){let t=[0];for(let n=0;n<6;n++)t.push(t[n]+md[(n+e)%7]);return t}function vd(e){let t=gd(Math.floor(e),120960),n=Math.floor(t/fd),r=Math.floor(t%fd/840);return{block:n,key:r,bar:Math.floor(t%840/12),inBar:t%12,mode:hd[n],tonic:yd(n,r)}}function yd(e,t){return gd((e<6?7:5)*t,12)}function bd(e,t){let n=[0,4,1,5,2,6,3],r=hd[e];return n.map((e,i)=>gd(n[(i+t)%7]+r,7))}function xd(e){return _d(e)}function Sd(e,t,n){let r=Math.floor(n/7),i=n%7,a=e.map((t,n)=>e[(n+i)%7]),o=xd(t);r===1&&(o=o.map((e,t)=>gd(o[(t+i)%7]-o[i],12)).sort((e,t)=>e-t));let s=[];for(let e=0;e<7;e++){let t=a[e],n=a[(e+2)%7]+1,c=a[(e+4)%7],l=a[(e+6)%7];r===0&&(t=gd(t+i+1,7)),r===2&&(n=8-n),r===3&&(c=a[(6-e+4)%7]),r===4&&(l=gd(l*5,7));let u=o[e],d=e<6?o[e+1]:12;s.push({at:u,dur:d-u,degree:t,density:n,dynamic:c,space:l})}return s}function Cd(e,t,n){let r=bd(e,t),i=hd[e];return n<35?Sd(r,i,n):Sd(r,i,69-n).map(e=>({...e,at:12-(e.at+e.dur),degree:gd(-e.degree,7)})).sort((e,t)=>e.at-t.at)}function wd(e,t){let n=[],r=Math.floor(e/12);for(let i=r;i*12<t;i++){let r=i*12,a=vd(r),o=_d(a.mode);for(let i of Cd(a.block,a.key,a.bar)){let s=r+i.at;if(!(s<e||s>=t))for(let e=0;e<i.density;e++){let t=i.degree+2*e;n.push({step:s,dur:i.dur,semis:a.tonic+o[gd(t,7)]+12*Math.floor(t/7),level:.18+i.dynamic*.11,pan:i.space/3-1})}}}return n}function Td(e,t,n){let r=e.cells.get(t);return r?r.root?r.cycle:r.scan?r.scan.lap:e.cells.get(r.over??n??r.context)?.cycle??12:12}function Ed(e,t,n,r){return Dd(e.cells.get(t).units,n,()=>Td(e,t,r))}function Dd(e,t,n){let r=e.length;if(r===0||t===0)return[...e];let i=n(),a=Math.floor(t/r),o=t-a*r;return Array.from({length:r},(t,n)=>{let s=e[(n+o)%r],c=i*(a+ +(n+o>=r));if(c===0)return s;let l=To(s.atom,e=>e.kind===`note`?{...e,value:e.value+c}:e.kind===`choice`?{...e,values:e.values.map(e=>e+c)}:e.kind===`chord`?{...e,notes:e.notes.map(e=>e+c)}:e);return l===s.atom?s:{...s,atom:l}})}let Od=/* @__PURE__ */ new WeakMap;function kd(e,t){let n=e.cells.get(t);if(!n.units.some(e=>e.atom.kind===`seq`))return n.units;let r=Od.get(e);r||Od.set(e,r=/* @__PURE__ */ new Map);let i=r.get(t);return i||r.set(t,i=n.units.flatMap(e=>e.atom.kind===`seq`?G(e.atom).map(e=>({atom:e,repeat:1,subdivide:1,elongate:1})):[e])),i}let Ad=(e,t)=>{let n=kd(e,t);return n.length>0&&n.every(e=>e.atom.kind===`chord`)},jd=/* @__PURE__ */ new WeakMap;function Md(e,t,n,r=!1){let i=jd.get(e);i||jd.set(e,i=/* @__PURE__ */ new Map);let a=r&&Ad(e,t),o=`${t}|${n}${a?`|in force`:``}`,s=i.get(o);if(s)return s;let c=[],l=Dd(kd(e,t),n,()=>Td(e,t));for(let e of(a?l.slice(0,1):l).flatMap(e=>G(e.atom)))e.kind===`note`?c.push({value:e.value,alter:e.alter}):e.kind===`chord`&&e.notes.forEach((t,n)=>c.push({value:t,alter:e.alters[n]}));return i.size>=256&&i.delete(i.keys().next().value),i.set(o,c),c}function Nd(e,t,n,r,i=0){if(e.cells.get(t).root)return{value:n+r(t)+i,alter:0};let a=Md(e,t,r(t)+i,!0);if(a.length===0)return{value:0,alter:0};let o=Math.floor(n),s=Math.floor(o/a.length),c=a[o-s*a.length];return{value:c.value+s*Td(e,t),alter:c.alter}}function Pd(e,t,n,r,i,a){let o=[],s=t,c=n,l=r,u=i;for(let t=0;t<64;t++){let t=e.cells.get(s);if(t.root){let e=l+u+a(s)+c;return o.push({cell:s,index:Math.round(e)}),{root:s,position:e,path:o}}o.push({cell:s,index:Math.floor(l+c)});let n=Nd(e,s,l,a,c);l=n.value+u,u=n.alter,c=t.over?t.overShift:0,s=t.over??t.context}return{root:s,position:l,path:o}}function Fd(e,t,n){let r=e.cells.get(t);if(r?.map?.kind===`ratios`){let e=r.map.ratios,t=e.length-1,i=e[t]/e[0],a=Math.floor(n/t),o=n-a*t,s=Math.floor(o),c=o-s,l=(e[s]/e[0])**(1-c)*(e[s+1]/e[0])**+c;return 12*Math.log2(i**+a*l)}let i=r?.map?.kind===`edo`?r.map.period:2;return n*12*Math.log2(i)/(r?.cycle??12)}function Id(e,t,n){let r=e.cells.get(t),i=2**(n/12);if(r?.map?.kind===`ratios`){let e=r.map.ratios,t=e.map(t=>t/e[0]),n=t.length-1,a=Math.floor(Math.log(i)/Math.log(t[n])+1e-9),o=i/t[n]**+a,s=0;for(;s<n-1&&t[s+1]<=o+1e-12;)s++;let c=Math.log(o/t[s])/Math.log(t[s+1]/t[s]);return a*n+s+c}let a=r?.map?.kind===`edo`?r.map.period:2;return n*(r?.cycle??12)/(12*Math.log2(a))}function Ld(e,t){let n=[],r=t;for(let t=0;r!==null&&t<64;t++){n.push(r);let t=e.cells.get(r);r=!t||t.root?null:t.over??t.context}return n}let Rd=(e,t,n)=>!!n&&!n.abs&&zd(e,t,n),zd=(e,t,n)=>!!n&&e.cells.get(t).units.every(e=>e.atom.kind===`note`&&e.repeat===1&&e.subdivide===1&&e.chance===void 0);function Bd(e,t){let n=t;for(let t=0;t<64;t++){let t=e.cells.get(n);if(!t||t.root)return n;n=t.over??t.context}return n}let Vd=.15,Hd=(e,t)=>{let n=null;for(let r of e)r.t<=t&&(n=r);return n&&n.speed!==null&&t<=n.t+.35?n.speed:null},Ud=/* @__PURE__ */ new WeakMap,Wd=(e,t)=>{let n=Ud.get(e);return n||Ud.set(e,n=/* @__PURE__ */ new Set),n.add(t),t},Gd=[],Kd=e=>Gd.push(e),Z=.002,qd=3600,Jd=/* @__PURE__ */ new WeakMap;function Yd(e,t){let n=Jd.get(e);return n||Jd.set(e,n=/* @__PURE__ */ new Map),n.has(t)||n.set(t,Xd(e,t)),n.get(t)}function Xd(e,t){let n=e.cells.get(t),r=(e,t)=>typeof n?.params[e]==`number`?n.params[e]:t;if(!n||typeof n.params.motor!=`number`)return null;let i=Math.max(1e-6,r(`motor`,1)),a=Math.max(1e-6,r(`mass`,1)),o=Math.max(0,r(`friction`,0));for(let n of e.cells.values())n.name!==t&&n.step?.driver===t&&(typeof n.params.mass==`number`&&(a+=n.params.mass),typeof n.params.friction==`number`&&(o+=n.params.friction));let s=r(`wind`,1/0),c=r(`wow`,0),l=[0],u=[0],d=0,f=!1,p=[],m=e=>{for(;!f&&(l.length-1)*Z<Math.min(e,qd);){let e=(l.length-1)*Z,t=Number.isFinite(s)?Math.max(0,1-(e/s)**4):1,n=1+c*Math.sin(2*Math.PI*.55*e),r=Hd(p,e);d+=(i*(n-d)*t-o*d)/a*Z,r!==null&&(d+=(r-d)*Vd),Number.isFinite(d)||(d=0),d<0&&r===null&&(d=0),l.push(l[l.length-1]+d*Z),u.push(d),t===0&&r===null&&d<.02&&(f=!0)}},h=e=>{let t=Math.max(1,Math.floor(e/Z));t>=l.length||(l.length=t+1,u.length=t+1,d=u[t],f=!1)},g=()=>({t:(l.length-1)*Z,s:l[l.length-1]});return Wd(e,{grab(e,t){h(e),p.push({t:e,speed:t})},cut:h,speed(e){let t=.01;return Math.max(0,(this.nominal(e+t)-this.nominal(Math.max(0,e-t)))/(e+t-Math.max(0,e-t)))},stopsAt(){return Number.isFinite(s)?(m(qd),f?(l.length-1)*Z:null):null},nominal(e){if(e<=0)return 0;m(e+Z);let t=e/Z;if(t>=l.length-1){let t=g();return f?t.s:t.s+(e-t.t)*d}let n=Math.floor(t);return l[n]+(l[n+1]-l[n])*(t-n)},real(e){if(e<=0)return 0;let t=(l.length-1)*Z+60;for(;!f&&l[l.length-1]<e&&(l.length-1)*Z<Math.min(qd,t);)m((l.length-1)*Z+10);if(l[l.length-1]<e){if(f||d<=1e-9)return 1/0;let t=g();return t.t+(e-t.s)/d}let n=0,r=l.length-1;for(;r-n>1;){let t=n+r>>1;l[t]<e?n=t:r=t}let i=l[r]-l[n];return(n+(i>0?(e-l[n])/i:0))*Z}})}function Zd(e,t,n,r,i,a){let o=[0],s=[{y:0,v:0,off:0,px:0,stretch:0,slipping:!1}],c=0,l=!1,u=[],d=e=>{for(;!l&&(o.length-1)*Z<Math.min(e,qd);){let e=(o.length-1)*Z,d=s[s.length-1],{y:f,v:p,off:m}=d,h=a(e+Z),g=(h-d.px)/Z,_=h-m-f,v=!1;if(t*Math.abs(_)>i){let e=Math.sign(_)*i/t;m+=_-e,_=e,v=!0}let y=Hd(u,e);p+=(t*_+r*(g-p))/n*Z,y!==null&&(p+=(y-p)*Vd),Number.isFinite(p)||(p=0),f+=p*Z,o.push(Math.max(o[o.length-1],f)),s.push({y:f,v:p,off:m,px:h,stretch:_,slipping:v}),c=Math.abs(g)<1e-6&&Math.abs(p)<1e-4&&Math.abs(_)<1e-4&&y===null?c+Z:0,c>.5&&(l=!0)}},f=e=>{let t=Math.max(1,Math.floor(e/Z));t>=o.length||(o.length=t+1,s.length=t+1,c=0,l=!1)},p=e=>{if(e<=0)return 0;d(e+Z);let t=Math.min(e/Z,o.length-1),n=Math.floor(t);return n>=o.length-1?o[o.length-1]:o[n]+(o[n+1]-o[n])*(t-n)},m={nominal:p,real(e){if(e<=0)return 0;let t=(o.length-1)*Z+60;for(;!l&&o[o.length-1]<e&&(o.length-1)*Z<Math.min(qd,t);)d((o.length-1)*Z+10);if(o[o.length-1]<e)return 1/0;let n=0,r=o.length-1;for(;r-n>1;){let t=n+r>>1;o[t]<e?n=t:r=t}let i=o[r]-o[n];return(n+(i>0?(e-o[n])/i:0))*Z},stopsAt:()=>null,speed(e){let t=.01;return Math.max(0,(p(e+t)-p(Math.max(0,e-t)))/(e+t-Math.max(0,e-t)))},grab(e,t){f(e),u.push({t:e,speed:t})},cut:f,state(e){if(e<=0)return{stretch:0,slipping:!1};d(e+Z);let t=Math.min(Math.floor(e/Z),s.length-1),n=!1;for(let e=Math.max(0,t-50);e<=t;e++)s[e].slipping&&(n=!0);return{stretch:s[t].stretch,slipping:n}}};return e?Wd(e,m):m}let Qd=1e-9;function $d(e,t,n){if(t.tap)return nf(t.tap,tf(e,e.clocks.get(t.tap.meter),n));let r=tf(e,t,n);return t.swung?ef(t.swung,r):r}function ef(e,t){let n=Math.max(1,e.length),r=t=>t<n?e[t]:n,i=e=>{let t=Math.floor(e),i=Math.floor(t/n),a=t-i*n;return i*n+r(a)+(e-t)*(r(a+1)-r(a))},a=e=>{let t=Math.floor(e/n),i=e-t*n,a=0;for(;a+1<n&&r(a+1)<=i;)a++;let o=r(a+1)-r(a);return t*n+a+(o>0?(i-r(a))/o:0)};return{beats:t.beats,q:e=>t.q(i(e)),stepAt:e=>a(t.stepAt(e)),...t.speed?{speed:t.speed}:{}}}function tf(e,t,n){if(!t.positional&&t.swing!==void 0){let e=Math.min(.95,Math.max(.05,t.swing)),n=t.perSecond;return{beats:1,q:t=>{let r=Math.floor(t/2),i=t/2-r;return(2*r+2*(i<.5?i/.5*e:e+(i-.5)/.5*(1-e)))/n},stepAt:t=>{let r=t*n/2,i=Math.floor(r),a=r-i;return 2*(i+(a<e?a/e*.5:.5+(a-e)/(1-e)*.5))}}}if(!t.positional)return{beats:1,q:e=>e/t.perSecond,stepAt:e=>e*t.perSecond};let r=t.cell,i=Ed(e,r,n(r)).flatMap(e=>e.atom.kind===`note`?[e.atom.value+e.atom.alter]:[]),a=Math.max(1,i.length),o=Td(e,r),s=a/t.perSecond,c=e=>i[Qi(e,a)]+o*Math.floor(e/a),l=e=>{let t=Math.floor(e),n=c(t);return(n+(e-t)*(c(t+1)-n))/o*s},u=l(0),d=e=>l(e)-u;return{beats:a,q:d,stepAt:e=>{let t=Math.floor(e/s)*a;for(;d(t+1)<=e;)t++;for(;t>0&&d(t)>e;)t--;let n=d(t),r=d(t+1);return t+(r>n?(e-n)/(r-n):0)}}}function nf(e,t){let{positions:n,lap:r}=e,i=Math.max(1,n.length);if(n.every((e,t)=>Math.abs(e-t*r/i)<1e-9))return{beats:i,q:e=>t.q(e*r/i),stepAt:e=>t.stepAt(e)*i/r,...t.speed?{speed:t.speed}:{}};let a=e=>e<i?n[e]:r,o=e=>{let t=Math.floor(e),n=Math.floor(t/i),o=t-n*i;return n*r+a(o)+(e-t)*(a(o+1)-a(o))};return{beats:i,q:e=>t.q(o(e)),stepAt:e=>{let n=t.stepAt(e),o=Math.floor(n/r),s=n-o*r,c=0;for(;c+1<i&&a(c+1)<=s;)c++;let l=a(c+1)-a(c);return o*i+c+(l>0?(s-a(c))/l:0)},...t.speed?{speed:t.speed}:{}}}function rf(e){let t=af.get(e);if(t)return t;af.set(e,t=/* @__PURE__ */ new Set);let n=r=>{if(t.has(r))return;t.add(r);let i=e.cells.get(r);for(let t of i?.children.keys()??[]){let r=i.units.flatMap(e=>e.atom.kind===`ref`&&e.atom.name===t?[e.atom]:[]);(!r.length||!r.every(n=>zd(e,t,n.pick)))&&n(t)}};for(let t of e.outputs)for(let e of[...t.drone?[]:[t],...t.mods,...t.levels])n(e.cell);return t}let af=/* @__PURE__ */ new WeakMap,of=/* @__PURE__ */ new WeakMap;function sf(e){let t=of.get(e);if(t)return t;of.set(e,t=/* @__PURE__ */ new Set);for(let n of e.cells.values()){n.root&&t.add(n.name),n.over&&t.add(n.over),n.root||t.add(n.context);for(let r of n.units)r.atom.kind===`ref`&&Rd(e,r.atom.name,r.atom.pick)&&t.add(r.atom.name)}return t}let cf=/* @__PURE__ */ new WeakMap,lf=/* @__PURE__ */ new WeakMap;Kd(e=>{cf.delete(e),lf.delete(e)});function uf(e,t){let n=e.cells.get(e.clocks.get(t)?.cell??``)?.params.varispeed;return typeof n==`number`?n:0}function Q(e,t,n=0){let r=lf.get(e);r||lf.set(e,r=/* @__PURE__ */ new WeakMap);let i=r.get(t)??/* @__PURE__ */ new Map;r.set(t,i);let a=t=>{let n=i.get(t);if(!n){let r=e.clocks.get(t);n=r.tap?nf(r.tap,o(r.tap.meter)):r.swung?ef(r.swung,o(t)):o(t),i.set(t,n)}return n},o=n=>{let r=i.get(`${n}\0plain`);if(!r){let o=e.clocks.get(n);if(o.belt){let i=$d(e,e.clocks.get(o.belt.driver),t),s=a(o.belt.driver),c=e.cells.get(o.cell),l=(e,t)=>typeof c.params[e]==`number`?c.params[e]:t,u=Math.max(.001,l(`belt`,200)),d=Math.max(.001,l(`mass`,1)),f=l(`damping`,.6*Math.sqrt(u*d)),p=cf.get(e);p||cf.set(e,p=/* @__PURE__ */ new Map);let m=p.get(n);m||p.set(n,m=Zd(e,u,d,f,l(`slip`,1/0),e=>i.q(s.stepAt(e))));let h=m,g=o.belt.rate;r={beats:1,q:e=>h.real(i.q(e/g)),stepAt:e=>i.stepAt(h.nominal(e))*g,speed:e=>h.speed(e)}}else{let n=tf(e,o,t),i=Yd(e,o.cell);r=i?{beats:n.beats,q:e=>i.real(n.q(e)),stepAt:e=>n.stepAt(i.nominal(e)),speed:e=>i.speed(e)}:n}i.set(`${n}\0plain`,r)}return r};return{map:a,stepOf:e=>a(e).stepAt(Math.max(0,n))}}function df(e,t,n){let r=Q(e,t,n),i=rf(e),a=sf(e),o=/* @__PURE__ */ new Map;return n=>{let s=t(n),c=e.cells.get(n);if(!c||!c.step||!c.clock||e.clocks.has(n)||gf(e,n)||c.loops||i.has(n)&&!a.has(n))return s;let l=o.get(c.clock);l===void 0&&o.set(c.clock,l=r.stepOf(c.clock));let u=Math.floor(c.rate*l+Qd),d=u*c.stride,f=hf(e,n);if(!f){let t=c.wrap??pf(e,n);return s+(t>0?Qi(d,t):d)}let p=d+Math.min(.999999999,Math.max(0,c.rate*l-u)),m=c.wrap??f.length,h=m>0?Qi(p,m):p,g=Math.floor(h/f.length);return s+g*f.entries+f.inForce(h-g*f.length,Math.floor(p/f.length))}}let ff=(e,t,n)=>r=>r===n?t(r):e(r),pf=(e,t)=>{let n=e.cells.get(t);return hf(e,t)?.length??(n.units.length||n.cycle)},mf=/* @__PURE__ */ new WeakMap;function hf(e,t){let n=mf.get(e);if(n||mf.set(e,n=/* @__PURE__ */ new Map),n.has(t))return n.get(t);let r=e.cells.get(t).units,i=null;if(r.some(e=>e.repeat!==1||e.elongate!==1||e.atom.kind===`seq`)){let n=[],a=0;for(let e of r)n.push(a),a+=e.atom.kind===`seq`?G(e.atom).length:1;let o=Uo(r,()=>1).filter(e=>!e.chosen||e.chosen.every(e=>e.is===0)).map(e=>{let t=r[e.top],i=n[e.top]+(t.atom.kind===`seq`?G(t.atom).indexOf(e.atom):0);return{at:e.at,index:i,...e.laps?{laps:e.laps}:{}}}).sort((e,t)=>e.at-t.at),s=r.reduce((e,t)=>e+Vo(t.atom,()=>1)*t.elongate*t.repeat,0),c=(e,t)=>!e.laps||Qi(t,e.laps.of)===e.laps.is,l=kd(e,t).length;i={length:s,entries:l,inForce(e,t){let n;for(let r of o)r.at<=e+1e-9&&c(r,t)&&(!n||r.at>n.at+1e-9)&&(n=r);if(n)return n.index;for(let e of o)c(e,t-1)&&(!n||e.at>n.at+1e-9)&&(n=e);return n?n.index-l:0}}}return n.set(t,i),i}function gf(e,t){let n=e.cells.get(t)?.over??``,r=e.cells.get(n);return!!r&&r.units.length>0&&r.units.every(t=>t.atom.kind===`ref`&&e.sections?.get(t.atom.name)===n)}function _f(e,t,n){let r=e.cells.get(n),i=r?.clock?e.clocks.get(r.clock):void 0,a=r?.clock&&i?t.map(r.clock):null,o=i?i.perSecond:1,s=e=>a?a.stepAt(Math.max(0,e))/o:e;return{pos:s,real:e=>e<=0?0:a?a.q(e*o):e,speed:e=>Math.max(.001,(s(e+.01)-s(Math.max(0,e-.01)))/(e+.01-Math.max(0,e-.01))),moving:a}}function vf(e,t,n,r,i,a=0){if(!r)return Ed(e,t,n(t)+a,i);let o=Ed(e,t,r.abs?0:n(t),i);return(fc(o.length,r)??[]).map(e=>o[e])}let yf=(e,t,n)=>mc(e.cells.get(t),n)??0,bf=(e,t=0)=>e?Zo(e):`>${t}`;var xf=class extends Error{};function Sf(e,t,n,r=null,i=()=>!1,a=0,o=ec){let s=/* @__PURE__ */ new Map,c=(t,r,a,o,l)=>{let u=e.cells.get(t),d=u.root?t:u.over??o,f=u.root?0:u.over?u.overShift:l,p=`${t}|${bf(r,a)}|${d}|${f}`,m=s.get(p);if(m)return m;let h=[];if(!i(t)){let i=Rd(e,t,r)?fc(e.cells.get(t).units.length,r):null,o=vf(e,t,n,r,d,a),s=t=>t.kind===`ref`&&yf(e,t.name,t.pick)||1,l=(e,t,n)=>{if(e.kind!==`ref`)return Fo(e,t,n);let r=n/s(e);return c(e.name,e.pick,e.shift,d,f).map(n=>({atom:{kind:`spliced`,e:n,ref:e},at:t+n.step*r,dur:n.duration*r,of:n.laps?.of??1,is:n.laps?.is??0,chances:[],picks:(n.chosen??[]).map(e=>({...e,at:t+e.at*r}))}))};for(let{atom:n,at:r,dur:a,chances:c,top:p,level:m,laps:g,chosen:_}of Ho(o,s,l,`${t}:`)){let o={step:r,duration:a,cell:t,table:d,tableShift:f,...i?{via:{cell:t,index:i[p],ctx:d,mul:1,add:0}}:{},...g?{laps:g}:{},..._?{chosen:_}:{}},s=c.map(e=>e===null?u.chance??.5:e),l={...s.length?{chance:s.length===1?s[0]:1-s.reduce((e,t)=>e*(1-t),1)}:{},...m===void 0?{}:{level:m}},v=t=>({...o,table:Bd(e,d),tableShift:0,value:Math.round(Id(e,Bd(e,d),t)*1e6)/1e6,alter:0});if(n.kind===`note`)h.push(n.pitched?{...v(n.value),...l}:{...o,value:n.value,alter:n.alter,...l});else if(n.kind===`chord`)n.notes.forEach((e,t)=>{let r=n.levels?.[t],i=r===void 0?{}:{level:r*(m??1)};h.push(n.pitched?.[t]?{...v(e),...l,...i}:{...o,value:e,alter:n.alters[t],...l,...i})});else if(n.kind===`choice`)h.push({...o,value:n.values[0],alter:n.alters[0],...l,options:n.values.map((e,t)=>({value:e,alter:n.alters[t]}))});else if(n.kind===`spliced`){let{e,ref:t}=n,i=t.transpose??0,o=t.values,{laps:s,chosen:c,...l}=e;h.push({...l,...o?{value:o.mul*e.value+o.add,alter:o.mul*e.alter,...e.options?{options:e.options.map(e=>({value:o.mul*e.value+o.add,alter:o.mul*e.alter}))}:{},...e.via?{via:{...e.via,mul:o.mul*e.via.mul,add:o.mul*e.via.add+o.add}}:{}}:{},step:r,duration:a,...g?{laps:g}:{},..._?{chosen:_}:{},...i||e.transpose?{transpose:(e.transpose??0)+i}:{},...m===void 0?{}:{level:(e.level??1)*m}})}if(h.length>5e4)throw new xf(t)}}return s.set(p,h),h};return[...c(t,r,a,o,0)].sort((e,t)=>e.step-t.step||e.value-t.value)}function Cf(e,t,n){if(!t.via)return{value:t.value,alter:t.alter};let r=Ed(e,t.via.cell,n(t.via.cell),t.via.ctx)[t.via.index];return r?.atom.kind===`note`?{value:t.via.mul*r.atom.value+t.via.add,alter:t.via.mul*r.atom.alter}:{value:t.value,alter:t.alter}}let $=e=>`cell:${e}`;function wf(e,t,n,r){let i=e.voiceParams.get(t);if(!i||Object.keys(i).length===0)return;let a={};for(let[t,o]of Object.entries(i)){let i=o.series.map(t=>Af(e,t,n,n+r)),s=e=>i.reduce((t,n)=>t*jf(n,e,e=>e.level),1),c=e=>o.range?o.range[0]+(o.range[1]-o.range[0])*e:e;if(o.env&&o.range)a[t]={kind:`env`,from:o.range[0],peak:c(s(n)),...o.env};else{let e=[...new Set(i.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t);a[t]={kind:`points`,points:(e.length?e:[n]).map(e=>({at:e,value:c(s(e)),...i.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9))?{ramp:!0}:{}}))}}}return a}function Tf(e,t,n){let r=df(e.result,e.statics,n+Qd),i=e.played.has(t.cell)?ff(r,e.statics,t.cell):r,a=Cf(e.result,t,i),o=Pd(e.result,t.table,t.tableShift,a.value,a.alter,i),s=t.transpose?{...o,position:o.position+t.transpose}:o;return Fd(e.result,s.root,s.position)}function Ef(e,t,n,r){if(t.events.length===0)return[{at:n,semis:0}];if(!t.clock)return[{at:n,semis:t.sign*Tf(e,t.events[0],n)}];if(t.lin)return kf(e,t,n,r,(n,r)=>t.sign*Tf(e,n,r)).map(e=>({at:e.at,semis:e.v,ramp:e.ramp}));let i=Q(e.result,e.statics).map(t.clock),a=i.stepAt(Math.max(0,n))*t.rate,o=i.stepAt(Math.max(0,r))*t.rate;Number.isFinite(a)||(a=0),Number.isFinite(o)||(o=a);let s=[],c=Math.floor(a/t.period),l=Df(t,a);s.push({at:n,semis:l?t.sign*Tf(e,l,n):0});for(let n=c;n*t.period<o;n++)for(let r of t.events){let c=n*t.period+r.step;if(c<=a+1e-9||c>=o-1e-9)continue;let l=i.q(c/t.rate);s.push({at:l,semis:t.sign*Tf(e,r,l)})}return s}function Df(e,t){let n=Math.floor(t/e.period),r=null;for(let i of[n,n-1]){for(let n of e.events)i*e.period+n.step<=t+1e-9&&(r=n);if(r)break}return r}function Of(e,t,n){if(t.events.length===0)return null;if(!t.clock)return t.events[0];let r=Q(e.result,e.statics).map(t.clock).stepAt(Math.max(0,n))*t.rate;return Df(t,Number.isFinite(r)?r:0)}function kf(e,t,n,r,i){let a=Q(e.result,e.statics).map(t.clock),o=[...new Map(t.events.map(e=>[e.step,e])).values()].sort((e,t)=>e.step-t.step),s=e=>a.q(e/t.rate),c=e=>{let n=Math.floor(e/t.period),r=e-n*t.period,a=o.length-1;for(let e=0;e<o.length;e++)o[e].step<=r+1e-9&&(a=e);let c=o[a],l=c.step>r+1e-9?c.step-t.period:c.step,u=i(c,s(n*t.period+l));if(a===o.length-1||l<0)return u;let d=o[a+1];return u+(i(d,s(n*t.period+d.step))-u)*(r-l)/Math.max(Qd,d.step-l)},l=a.stepAt(Math.max(0,n))*t.rate,u=a.stepAt(Math.max(0,r))*t.rate;Number.isFinite(l)||(l=0),Number.isFinite(u)||(u=l);let d=[{at:n,v:c(l),ramp:!1}];for(let e=Math.floor(l/t.period);e*t.period<u;e++)for(let n of o){let r=e*t.period+n.step;r>l+1e-9&&r<u-1e-9&&d.push({at:s(r),v:i(n,s(r)),ramp:n!==o[0]})}return d.push({at:r,v:c(u-1e-6),ramp:!0}),d}function Af(e,t,n,r){let i=e=>t.db?10**((e.value+e.alter)/20):Math.max(0,e.value+e.alter);if(t.events.length===0)return[{at:n,level:0}];if(!t.clock)return[{at:n,level:i(t.events[0])}];if(t.lin)return kf(e,t,n,r,e=>i(e)).map(e=>({at:e.at,level:Math.max(0,e.v),ramp:e.ramp}));let a=Q(e.result,e.statics).map(t.clock),o=a.stepAt(Math.max(0,n))*t.rate,s=a.stepAt(Math.max(0,r))*t.rate;Number.isFinite(o)||(o=0),Number.isFinite(s)||(s=o);let c=e=>{let n=e-Math.floor(e/t.period)*t.period,r=-1;for(let e of t.events)n>=e.step-1e-9&&n<e.step+e.duration-1e-9&&(r=Math.max(r,i(e)));return r<0?0:r},l=[{at:n,level:c(o)}],u=/* @__PURE__ */ new Set;for(let e=Math.floor(o/t.period);e*t.period<s;e++)for(let n of t.events)for(let r of[e*t.period+n.step,e*t.period+n.step+n.duration])r>o+1e-9&&r<s-1e-9&&u.add(r);for(let e of[...u].sort((e,t)=>e-t)){let n=c(e+Qd*10);n!==l[l.length-1].level&&l.push({at:a.q(e/t.rate),level:n})}return l}function jf(e,t,n){let r=0;for(let n=0;n<e.length;n++)e[n].at<=t+1e-9&&(r=n);let i=e[r+1];return!i?.ramp||Math.abs(e[r].at-t)<1e-9?n(e[r]):n(e[r])+(n(i)-n(e[r]))*(t-e[r].at)/Math.max(Qd,i.at-e[r].at)}function Mf(e,t,n){let r=Q(e,t),i=/* @__PURE__ */ new Set,a=[],o=t=>{for(let n=0;t&&!i.has(t)&&n<32;n++){i.add(t);let n=e.cells.get(t);if(!n)return;n.laps&&n.clock&&a.push(r.map(n.clock).q(n.laps*Math.max(1,yf(e,t,null))/n.rate)),n.clock&&n.clock!==t&&o(n.clock),t=n.step?.driver}};o(n.cell);for(let e of n.select)o(e.cell);return a.length?Math.min(...a):1/0}function Nf(e){let t=3735928559,n=1103547991;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,2654435761),n=Math.imul(n^i,1597334677)}return t=Math.imul(t^t>>>16,2246822507)^Math.imul(n^n>>>13,3266489909),n=Math.imul(n^n>>>16,2246822507)^Math.imul(t^t>>>13,3266489909),((n>>>0)*2**21+(t>>>11))/2**53}function Pf(e,t,n,r){if(n.laps&&Qi(r,n.laps.of)!==n.laps.is)return null;if(n.chance===void 0&&!n.options&&!n.chosen)return n;let i=`${e.cells.get(t.output.cell)?.seed??0}|${t.output.cell}`;for(let e of n.chosen??[])if(Math.floor(Nf(`${i}|${r+e.lap}|${e.at.toFixed(6)}|${e.id}|picks`)*e.of)!==e.is)return null;if(n.chance===void 0&&!n.options)return n;let a=`${i}|${r}|${n.step.toFixed(6)}`;if(n.chance!==void 0&&Nf(`${a}|sounds`)>=1-n.chance)return null;if(!n.options)return n;let o=n.options[Math.floor(Nf(`${a}|picks`)*n.options.length)];return{...n,value:o.value,alter:o.alter}}function Ff(e,t){for(let n of t){let t=e.cells.get(n.part)?.params.restart??e.cells.get(n.cell)?.params.restart;if(t===`resume`||t===`free`)return t}return`restart`}function If(e,t,n,r){let i=t.series;if(!i.clock||i.events.length===0)return[];let a=Q(e.result,e.statics).map(i.clock),o=a.stepAt(Math.max(0,n))*i.rate,s=a.stepAt(Math.max(0,r))*i.rate;Number.isFinite(o)||(o=0),Number.isFinite(s)||(s=o);let c=[];for(let e=Math.floor(o/i.period)-1;e*i.period<s;e++)for(let n of i.events){if(Qi(Math.round(n.value+n.alter),t.entries)!==t.entry)continue;let r=e*i.period+n.step,l=r+n.duration;l<=o+1e-9||r>=s-1e-9||c.push({a:a.q(r/i.rate),b:a.q(l/i.rate)})}return c.sort((e,t)=>e.a-t.a)}let Lf=(e,t,n)=>Ld(e,t).some(e=>n.has($(e))),Rf=(e,t,n)=>{let r=e.cells.get(t);for(let t=0;r?.step&&t<32;t++){if(n.has($(r.step.driver)))return!0;r=e.cells.get(r.step.driver)}return!1};function zf(e,t){let n=e.cells.get(t),r=n?.voice?n.params.gain:void 0;return typeof r==`number`&&Number.isFinite(r)?r:1}function Bf(e,t){return e.silent?e.via.some(n=>t.has($(n))&&!e.midi?.some(e=>e.card===n))?[0,0]:[e.gains[0],e.gains[1]]:Vf(e.parts,t)}function Vf(e,t){let n=[0,0];for(let r of e)!t.has($(r.mix))&&!t.has($(r.sink))&&(n[0]+=r.gains[0],n[1]+=r.gains[1]);return n}let Hf=e=>e[0]!==0||e[1]!==0;function Uf(e,t,n){if(!Kf(e,t,n))return!1;let r=Bf(t,n);return Hf(r)||Gf(t,n)}function Wf(e,t){return(e.midi??[]).filter(e=>!t.has($(e.card))&&!(e.mix&&t.has($(e.mix))))}let Gf=(e,t)=>Wf(e,t).length>0;function Kf(e,t,n){if(n.has($(t.voice))||n.has($(t.cell)))return!1;if(t.drone)return!t.through.some(e=>n.has($(e)))&&!(t.envelopeCell&&n.has($(t.envelopeCell)));let r=e.cells.get(t.cell);return!(!r?.clock||Lf(e,r.clock,n)||Rf(e,t.cell,n)||t.through.some(e=>n.has($(e)))||t.envelopeCell&&n.has($(t.envelopeCell))||t.select.some(t=>n.has($(t.cell))||n.has($(t.part))||n.has($(e.cells.get(t.cell).over)))||t.select.some(t=>[...e.cells.get(t.cell).children.keys()].some(e=>n.has($(e)))))}function qf(e,t,n=/* @__PURE__ */ new Set){if(!e.ok)return{result:e,statics:t,muted:n,tracks:[],drones:[],played:/* @__PURE__ */ new Set,voiceParams:/* @__PURE__ */ new Map,end:1/0};let r=[],i=[],a=/* @__PURE__ */ new Map;for(let o of e.outputs){if(!Uf(e,o,n))continue;let s=e.cells.get(o.cell),c=(r,i,a,o)=>{let s=e.cells.get(r),c=n.has($(r))?[]:Sf(e,r,t,i,e=>n.has($(e)),a).filter(t=>!Lf(e,t.table,n));return{sign:o,lin:s.map?.kind===`lin`,db:s.map?.kind===`db`,clock:s.clock,rate:s.rate,period:Math.max(1,yf(e,r,i)),events:c}};try{for(let t of o.kit?Ru(e.cells.get(o.voice)):[o.voice]){if(a.has(t))continue;let n=e.cells.get(t),r={};for(let[t,i]of Object.entries(n?.paramCells??{})){let n=i.factors.find(t=>e.cells.get(t)?.map?.kind===`adsr`);r[t]={range:i.range,series:i.factors.filter(e=>e!==n).map(e=>c(e,null,0,1)),env:n?gc(e.cells.get(n)):null}}a.set(t,r)}if(o.drone){i.push({output:o,mods:o.mods.map(e=>c(e.cell,e.pick,e.shift,e.sign)).filter(e=>e.events.length>0),levels:o.levels.map(e=>c(e.cell,e.pick,e.shift,e.sign))});continue}let n=c(o.cell,o.pick,o.shift,o.sign),l=o.mods.filter(e=>!e.picks).map(e=>c(e.cell,e.pick,e.shift,e.sign)).filter(e=>e.events.length>0),u=o.mods.find(e=>e.picks),d=u?c(u.cell,u.pick,u.shift,1):void 0,f=o.levels.map(e=>c(e.cell,e.pick,e.shift,e.sign)),p=o.select.map(t=>({series:c(t.cell,null,0,1),entry:t.entry,entries:e.cells.get(e.cells.get(t.cell).over).units.length})),m=s.paramCells.legato,h=s.step?.tap?e.cells.get(s.step.driver)?.meter:null,g=s.step?.chain.reduce((e,t)=>t.op===`×`?e*t.n:e/t.n,1)??1,_=m?{range:m.range,series:m.factors.map(e=>c(e,null,0,1))}:typeof s.params.legato==`number`?s.params.legato:h?Su(h,s.step.tap,g):1;n.events.length&&r.push({...n,output:o,clock:s.clock,mods:l,...d?{picker:d}:{},levels:f,selects:p,end:Mf(e,t,o),share:_})}catch(e){if(!(e instanceof xf))throw e}}let o=r.map(e=>e.end),s=-1/0;for(let t of e.clocks.values()){let n=Yd(e,t.cell)?.stopsAt();n!=null&&(s=Math.max(s,n))}let c=o.length?Math.max(...o):1/0;return{result:e,statics:t,muted:n,tracks:r,drones:i,played:rf(e),voiceParams:a,end:Math.min(c,s>-1/0?s:1/0)}}function Jf(e,t){let n=e.cells.get(t)?.env,r=n?e.cells.get(n):void 0;return r?.map?.kind===`adsr`?gc(r):null}function Yf(e,t,n){if(!t.kit)return{voice:t.voice,freq:e.cells.get(t.voice).freq};let r=e.cells.get(t.voice),i=r.units[Qi(Math.round(n),r.units.length)];return i?.atom.kind===`ref`?{voice:i.atom.name,freq:e.cells.get(i.atom.name).freq}:null}function Xf(e,t){let n=e.cells.get(e.cells.get(t)?.over??``)?.params.anchor;return typeof n==`number`?Math.round((((e=>Math.floor(e)*3600+Math.round(e%1*100)*60)(n)-42900)%86400+86400)%86400/pd):0}function Zf(e,t,n,r=!1,i={}){let a=t=>e.result.cells.get(t.output.cell)?.params.law!==void 0,o=e.tracks.filter(e=>!e.output.tape&&!a(e)),s=e.tracks.filter(e=>e.output.tape),c=Qf({...e,tracks:o},t,n,r);e.drones.length&&(c.push(...ep(e,t,n,r,i)),c.sort((e,t)=>e.at-t.at));for(let i of e.result.outputs){if(e.result.cells.get(i.cell)?.params.law!==`fiveto12`)continue;let a=Bf(i,e.muted),o=i.midi?Wf(i,e.muted):[],s=Hf(a);if(!s&&!o.length)continue;let l=e.result.cells.get(i.voice)?.freq||261.63,u=Xf(e.result,i.cell);for(let d of wd(Math.ceil(t/pd-1e-9)+u,Math.ceil(n/pd-1e-9)+u)){let t=(d.step-u)*pd;c.push({at:t,dur:d.dur*pd,voice:i.voice,freq:l*2**(d.semis/12),bends:[],gains:[a[0]*Math.min(1,1-d.pan)*zf(e.result,i.voice),a[1]*Math.min(1,1+d.pan)*zf(e.result,i.voice)],levels:[{at:t,level:d.level}],...s?{}:{unheard:!0},...o.length?{midi:o}:{},...r?{output:i.id}:{}})}}if(!s.length)return c;let l=Q(e.result,e.statics);for(let i of s){let a=i.output.tape,o=e.result.cells.get(a.tape),{pos:s,real:u,speed:d,moving:f}=_f(e.result,l,a.tape),p=typeof o?.params.varispeed==`number`?o.params.varispeed:0,m=1-a.erase,h=a.length>0?Math.min(40,m>0?Math.ceil(Math.log(.02)/Math.log(m)):1):1,g={...i,output:{...i.output,tape:void 0}};for(let i=0;i<h;i++){let o=a.at+i*a.length,l=m**+i,h=u(s(t)-o),_=u(s(n)-o);if(!(_>0)||!Number.isFinite(_))continue;let v=e=>u(s(e)+o);for(let i of Qf({...e,tracks:[g]},Math.max(0,h),_,r)){let e=v(i.at);if(!(e>=t&&e<n)||!Number.isFinite(e))continue;let r=v(i.at+i.dur);if(f&&d(i.at)<.05)continue;let a=p?Math.min(4,Math.max(.25,(d(e)/d(i.at))**+p)):1;c.push({...i,at:e,dur:Math.max(.01,(Number.isFinite(r)?r:e+i.dur)-e),freq:i.freq*a,bends:i.bends.map(e=>({...e,at:v(e.at)})),levels:i.levels.map(e=>({...e,at:v(e.at)})),gains:[i.gains[0]*l,i.gains[1]*l],...i.params?{params:Object.fromEntries(Object.entries(i.params).map(([e,t])=>[e,t.kind===`points`?{...t,points:t.points.map(e=>({...e,at:v(e.at)}))}:t]))}:{}})}}}return c.sort((e,t)=>e.at-t.at)}function Qf(e,t,n,r){let i=[],{result:a,statics:o}=e,s=Q(a,o);for(let o of e.tracks){let c=s.map(o.clock),l=Math.min(n,o.end);if(l<=t)continue;let u=c.stepAt(Math.max(0,t))*o.rate,d=c.stepAt(Math.max(0,l))*o.rate;if(!Number.isFinite(u)||!Number.isFinite(d)||d<=u)continue;let f=t=>{let n=o.share;if(typeof n==`number`)return n;let r=c.q(t/o.rate),i=n.series.reduce((t,n)=>{let i=Of(e,n,r);return t*(i?i.value+i.alter:1)},1);return n.range?n.range[0]+(n.range[1]-n.range[0])*i:i},p=(t,n,i,s=1/0)=>{let l=c.q(t/o.rate);if(!Number.isFinite(l)||l>=o.end-1e-9)return null;let u=f(t),d=Math.min(c.q((u===1?i:t+u*(i-t))/o.rate),s<1/0?c.q(s/o.rate):1/0,o.end),p=o.picker?Of(e,o.picker,l):n,m=p&&Yf(a,o.output,p.value);if(!m||e.muted.has($(m.voice)))return null;let h=a.cells.get(m.voice)?.oneshot?o.output.envelope??Jf(a,m.voice):null,g=h?h.attack+h.decay:Number.isFinite(d)?d-l:8,_=o.output.kit&&!o.picker||o.output.gate?o.output.offset:o.sign*Tf(e,n,l)+o.output.offset,v=[];if(o.mods.length){let t=o.mods.map(t=>Ef(e,t,l,l+g)),n=t.reduce((e,t)=>e+t[0].semis,0);_+=n;let r=[...new Set(t.flatMap(e=>e.slice(1).map(e=>e.at)))].sort((e,t)=>e-t);for(let e of r){let r=t.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9)),i=t.reduce((t,n)=>t+jf(n,e,e=>e.semis),0);v.push({at:e,cents:100*(i-n),...r?{ramp:r}:{}})}}let y=uf(a,o.clock);if(y&&c.speed&&!o.output.gate){let e=e=>Math.max(.001,c.speed(e)),t=e(l);if(t<.05)return null;if(_+=12*y*Math.log2(t),!v.length)for(let n=l+.04,r=0;n<l+g&&r<400;n+=.04,r++){let r=1200*y*Math.log2(e(n)/t);Math.abs(r)>1&&v.push({at:n,cents:r,ramp:!0})}}let b=o.db?10**((n.value+n.alter)/20):Math.max(0,n.value+n.alter),x=[{at:l,level:(o.output.gate?b:1)*(n.level??1)}];if(o.levels.length){let t=o.levels.map(t=>Af(e,t,l,l+g)),n=[...new Set(t.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t),r=x[0].level;x.length=0;for(let e of n)x.push({at:e,level:r*t.reduce((t,n)=>t*jf(n,e,e=>e.level),1),...t.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9))?{ramp:!0}:{}})}let S=m.freq*2**(_/12),C=wf(e,m.voice,l,g),w=o.output.envelope??(o.output.kit?Jf(a,m.voice):null),T=(e=>{let t=zf(a,m.voice);if(!o.output.kit)return[e[0]*t,e[1]*t];let[n,r]=oc(a.cells.get(m.voice)?.params.pan);return[e[0]*n*t,e[1]*r*t]})(Bf(o.output,e.muted)),E=o.output.midi?Wf(o.output,e.muted):[];return S>0&&S<2e4&&x.some(e=>e.level>0)?{at:l,dur:g,voice:m.voice,freq:S,bends:v,value:n.value+n.alter,gains:T,levels:x,...!o.output.silent&&!Hf(T)?{unheard:!0}:{},...E.length?{midi:E}:{},...w?{env:w}:{},...o.output.through.length?{instrument:o.output.through[0]}:{},...C?{params:C}:{},...r?{output:o.output.id}:{}}:null},m=o.output.kit||o.output.gate?0:a.cells.get(o.output.voice)?.glide??0,h=m>0,g=o.events.length,_=e=>(e===0||o.events[e-1].step!==o.events[e].step)&&(e===g-1||o.events[e+1].step!==o.events[e].step),v=(e,t)=>e>0?[e-1,t]:[g-1,t-1],y=(e,t,n,r,i)=>{if(!h||!_(e)||Qi(t*g+e,256)===0)return!1;let[s,c]=v(e,t),l=c*o.period+o.events[s].step+o.events[s].duration,u=t*o.period+o.events[e].step;return _(s)&&c>=n&&r+c*o.period+o.events[s].step>=i-1e-9&&Math.abs(l-u)<1e-9&&f(r+c*o.period+o.events[s].step)>=1-1e-9&&!!Pf(a,o,o.events[s],c)},b=(e,t,n,r=-1,s=0,c=0,l=0,u=1/0,d=-1/0)=>{if(r>=0&&y(r,s,l,c,d))return;let f=p(e,t,n,u);if(!f)return;if(r<0||!h||!_(r))return void i.push(f);let v=f,b=[{at:f.at,dur:f.dur,freq:f.freq,bends:f.bends}],[x,S]=[r,s];for(let e=0;e<256;e++){[x,S]=x<g-1?[x+1,S]:[0,S+1];let e=c+S*o.period+o.events[x].step;if(e>=u-1e-9||!y(x,S,l,c,d))break;let t=Pf(a,o,o.events[x],S),n=t&&p(e,t,e+o.events[x].duration,u);if(!n)break;let r=1200*Math.log2(n.freq/v.freq),i=v.bends.length?v.bends[v.bends.length-1].cents:0,s=Math.min(m,n.dur);v={...v,dur:n.at+n.dur-v.at,bends:[...v.bends,{at:n.at,cents:i},{at:n.at+s,cents:r,ramp:!0},...n.bends.map(e=>({...e,at:Math.max(e.at,n.at+s),cents:e.cents+r}))],levels:[...v.levels,...n.levels.filter(e=>e.at>=n.at)]},b.push({at:n.at,dur:n.dur,freq:n.freq,bends:n.bends})}i.push(b.length>1?{...v,legato:{glide:m,notes:b}}:v)};if(o.selects.length===0){for(let e=Math.floor(u/o.period)-1;e*o.period<d;e++)for(let[t,n]of o.events.entries()){let r=e*o.period+n.step;if(r<u-1e-9||r>=d-1e-9)continue;let i=Pf(a,o,n,e);i&&b(r,i,r+n.duration,t,e)}continue}let x=Ff(a,o.output.select),S=(t=>{let n=If(e,o.selects[0],t,l);for(let r of o.selects.slice(1)){let i=If(e,r,t,l);n=n.flatMap(e=>i.flatMap(t=>Math.max(e.a,t.a)<Math.min(e.b,t.b)?[{a:Math.max(e.a,t.a),b:Math.min(e.b,t.b)}]:[]))}return x===`restart`?n:n.reduce((e,t)=>{let n=e[e.length-1];return n&&Math.abs(t.a-n.b)<1e-9?e[e.length-1]={a:n.a,b:t.b}:e.push(t),e},[])})(x===`resume`?0:t),C=0;for(let e of S){let t=c.stepAt(e.a)*o.rate,n=c.stepAt(e.b)*o.rate,r=x===`free`?0:x===`resume`?t-C:t;C+=n-t;let i=Math.max(u,t),s=Math.min(d,n);if(!(s<=i))for(let e=Math.floor((i-r)/o.period)-1;r+e*o.period<s;e++)for(let[c,l]of o.events.entries()){let u=r+e*o.period+l.step;if(e<0||u<i-1e-9||u>=s-1e-9)continue;let d=Pf(a,o,l,e);d&&b(u,d,u+l.duration,c,e,r,0,n,t)}}}return i.sort((e,t)=>e.at-t.at)}function $f(e,t,n,r){let i=[...new Set(e.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t),a=e.map(()=>0),o=[];for(let s of i){let i=r,c=!1;e.forEach((e,r)=>{let o=a[r];for(;o+1<e.length&&e[o+1].at<=s+1e-9;)o++;a[r]=o;let l=e[o],u=e[o+1],d=!u?.ramp||Math.abs(l.at-s)<1e-9?t(l):t(l)+(t(u)-t(l))*(s-l.at)/Math.max(Qd,u.at-l.at);i=n(i,d),l.ramp&&Math.abs(l.at-s)<1e-9&&(c=!0)}),o.push({at:s,value:i,...c?{ramp:c}:{}})}return o}function ep(e,t,n,r,i){let a=Math.max(0,i.begins??0),o=Math.min(e.end,i.until??1/0),s=[];for(let i=Math.max(0,Math.floor((t-a)/600));a+i*600<Math.min(n,o);i++){let n=a+i*600;if(n<t-1e-9)continue;let c=Math.min(600,o-n);if(c>0)for(let t of e.drones){let i=t.output,a=e.result.cells.get(i.voice);if(!a)continue;let o=$f(t.mods.map(t=>Ef(e,t,n,n+c)),e=>e.semis,(e,t)=>e+t,0),l=o[0]?.value??0,u=o.slice(1).map(e=>({at:e.at,cents:100*(e.value-l),...e.ramp?{ramp:!0}:{}})),d=t.levels.length?$f(t.levels.map(t=>Af(e,t,n,n+c)),e=>e.level,(e,t)=>e*t,1).map(e=>({at:e.at,level:e.value,...e.ramp?{ramp:!0}:{}})):[{at:n,level:1}],f=a.freq*2**((i.offset+l)/12);if(!(f>0&&f<2e4)||!d.some(e=>e.level>0))continue;let p=Bf(i,e.muted),m=i.midi?Wf(i,e.muted):[],h=wf(e,i.voice,n,c);s.push({at:n,dur:c,voice:i.voice,freq:f,bends:u,gains:p,levels:d,held:!0,...!i.silent&&!Hf(p)?{unheard:!0}:{},...m.length?{midi:m}:{},...i.envelope?{env:i.envelope}:{},...i.through.length?{instrument:i.through[0]}:{},...h?{params:h}:{},...r?{output:i.id}:{}})}}return s}let tp=/* @__PURE__ */ new WeakMap;function np(e){if(tp.has(e))return tp.get(e);let t=null,n=e.ok?e.outputs.map(t=>e.cells.get(t.cell)?.clock).find(e=>!!e):void 0,r=n&&e.clocks.get(n)?.tap?e.clocks.get(n).tap.meter:n;for(let t=0;r&&t<16;t++){let t=e.cells.get(r)?.step?.driver;if(!t||!e.clocks.has(t))break;r=t}let i=r?e.clocks.get(r):void 0,a=r?e.cells.get(r):void 0;if(i&&a&&!i.belt){let n=[...e.cells.values()].some(e=>e.name!==a.name&&e.step?.driver===a.name);(i.positional||a.meter||i.swing!==void 0||i.swung||a.beat!==1||n)&&(t={cell:a.name,beat:a.beat>0?a.beat:1})}return tp.set(e,t),t}function rp(e,t,n){let r=np(e.result);if(!r||!(n>t))return null;let i=Q(e.result,e.statics).map(r.cell),a=r.beat/24,o=Math.min(n,e.end),s=e=>e<0?-1/0:i.q(e*a),c=i.stepAt(Math.max(0,t)),l=Number.isFinite(c)?Math.max(0,Math.floor(c/a-Qd)-1):0;for(;s(l)<t&&Number.isFinite(s(l));)l++;for(;l>0&&s(l-1)>=t;)l--;let u=[];for(let e=l;u.length<1e5;e++){let t=s(e);if(!(t<o))break;u.push(t)}return u.length?{first:l,at:u,before:s(l-1)}:null}function ip(e,t,n){if(!e.result.tapes.length)return[];let r=Q(e.result,e.statics),i=[];for(let a of e.result.tapes){let o=_f(e.result,r,a.name);if(!o.moving&&!a.dropout&&!a.heads.some(e=>e.wander>0))continue;let s=[];for(let e=t;e<=n;e+=.05)s.push({at:e,speed:o.speed(e)});i.push({tape:a.name,points:s})}return i}function ap(e,t,n,r={}){return{from:t,to:t+n,events:Zf(e,t,t+n,!0,r),tapes:ip(e,t,t+n+1e-9),clock:rp(e,t,t+n)}}function op(e,t){let n=dd(e,t);return qf(n,cc(n),n.off)}let sp=[`&bar`,`key`,`&harm`],cp=/^Unknown cell &([A-Za-z_][A-Za-z0-9_]*)$/,lp=e=>Math.abs(e-Math.round(e))<1e-9,up=(e,t)=>e.steps>0&&lp(t*e.rate/e.steps);function dp(e){for(let t=1;t<=4096;t++)if(up(e,t*e.bars))return t;return 0}let fp=(e,t,n)=>up(e,xu(t,n,e.bars).length);function pp(e,t,n,r){let i=hl(e).cells,a=r??new Set(i.map(e=>e.name)),o=t.mainMeter!==void 0&&a.has(t.mainMeter);return i.flatMap(e=>{let r=e.step;if(r?.kind!==`tap`||n&&!n.has(e.name)||(r.meter?a.has(r.meter.name):o))return[];let i=t.cells.get(e.name);if(!i||i.voice||i.steps<=0)return[];let s=Math.max(1,Math.round(e.cycle??1)),c={cell:`&${e.name}`,meter:r.meter?`&${r.meter.name}`:null,tap:r.tap.written,bars:s,steps:i.steps,rate:r.ratio};return[{need:{...c,bar:dp(c)},tap:r.tap}]})}function mp(e){let t=new Set(e.flatMap(e=>$l(e)).map(e=>`&${e}`)),n=new Set(e.flatMap(e=>eu(e)).map(e=>`&${e}`));return e=>t.has(e)&&!n.has(e)}let hp=(e,t)=>t&&nd(e)?ld(e,{resolve:t}).text:e;function gp(e,t,n){let r=hp(e,n),i=hl(r).cells,a=i.filter(e=>!e.lambda),o=t(e),s=o.diagnostics.flatMap(e=>{let t=cp.exec(e.message);return t?[`&${t[1]}`]:[]}),c=a.some(e=>e.over?.name===`key:main`)&&!o.mainKey,l=[.../* @__PURE__ */ new Set([...s,...c?[`key`]:[]])].sort(),u=mp(i);return{uses:l,sounds:l.filter(u),defines:[.../* @__PURE__ */ new Set([...a.map(e=>`&${e.name}`),...(o.uses??[]).flatMap(e=>e.gave)])],clock:pp(r,o).map(e=>e.need)}}let _p=new Set(sp.map(e=>e.replace(/^&/,``))),vp=/^\s*&([A-Za-z_][A-Za-z0-9_]*)(?=\s|$)/,yp=/^use\s/,bp=/[+*,[]\s*$/;function xp(e){let t=[],n=null;for(let r of e.split(`
`)){let e=q(r)[0];if(n??={written:[],code:[]},n.written.push(r),n.code.push(e),bp.test(e))continue;let i=n.code.join(` `).trim().split(/\s+/).join(` `),a=vp.exec(i)?.[1];a&&t.push({name:a,written:n.written.join(`
`),code:i}),n=null}return t}let Sp=e=>new Set(e.split(`
`).flatMap(e=>[...q(e)[0].matchAll(/&([A-Za-z_][A-Za-z0-9_]*)/g)]).map(e=>e[1]??``)),Cp=e=>e.split(`
`).map(e=>q(e)[0].trim().split(/\s+/).join(` `)).filter(e=>yp.test(e));function wp(e,t){let n=new Map(xp(t).map(e=>[e.name,e])),r=/* @__PURE__ */ new Set([...Sp(t),...Sp(e)]),i=/* @__PURE__ */ new Map;for(;;){let a=e;for(let[e,t]of i)a=Ds(a,e,t);let o=xp(a),s=[],c=[],l=[];for(let e of o){let t=n.get(e.name);t&&(t.code===e.code?s.push(e.name):_p.has(e.name)?c.push(e.name):l.push(e.name))}if(!l.length){let n=new Set(Cp(t)),r=[...Cp(e).filter(e=>!n.has(e)),...o.filter(e=>!s.includes(e.name)).map(e=>e.written)],a=t.replace(/\s+$/,``),l=e=>e.map(e=>`&${e}`);return{text:[...a?[a]:[],...r].join(`
`),renamed:new Map([...i].map(([e,t])=>[`&${e}`,`&${t}`])),shared:l(s),twice:l([...new Set(c)]),names:l([...new Set(o.map(e=>e.name))])}}for(let e of l){let t=2;for(;r.has(`${e}${t}`);)t++;r.add(`${e}${t}`),i.set(e,`${e}${t}`)}}}function Tp(e,{need:t,tap:n}){let r=t.meter?t.meter.slice(1):e.mainMeter,i=r===void 0?null:e.cells.get(r)?.meter;return!!i&&fp(t,i,n)}let Ep=e=>e.diagnostics.flatMap(e=>/^Unknown cell (&[A-Za-z_][A-Za-z0-9_]*)$/.exec(e.message)?.[1]??[]),Dp=(e,t)=>e.severity===t.severity&&e.message===t.message&&e.span.line===t.span.line&&e.span.col===t.span.col;function Op(e,t,n,r){let i=n??(e=>dd(e,void 0,r?{resolve:r}:{})),a=gp(e,i,r),o=i(t),s=/* @__PURE__ */ new Set([...xp(t).map(e=>`&${e.name}`),...(o.uses??[]).flatMap(e=>e.gave)]),c=a.uses.filter(e=>e===`key`?!o.mainKey:!s.has(e)),l=c.filter(e=>a.sounds.includes(e)),u=c.filter(e=>!l.includes(e)),d=hp(e,r),f=mp(hl(d).cells),p=wp(e,t),m=pp(d,i(e)).filter(e=>!Tp(o,e)).map(e=>e.need),h={fits:!1,union:p,missing:u,sounds:l,unmet:m};if(u.length||p.twice.length||m.length)return h;let g=()=>[p.text,...l.map(e=>`${e} s=white`)].join(`
`),_=i(g());for(;;){let e=Ep(_).filter(e=>f(e)&&!l.includes(e)&&!s.has(e)&&!p.names.includes(e));if(!e.length)break;l.push(...e),_=i(g())}l.sort();let v=[...o.diagnostics],y=_.diagnostics.filter(e=>{let t=v.findIndex(t=>Dp(t,e));return t<0||(v.splice(t,1),!1)}),b=e=>new Set(e.map(e=>e.slice(1))),x=b(p.names.filter(e=>!p.shared.includes(e))),S=pp(g(),_,b(p.names),x).filter(e=>!Tp(_,e)).map(e=>e.need);return{fits:!y.length&&!S.length,union:p,missing:u,sounds:l,unmet:S,diagnostics:y}}function kp(e,t){let n=/* @__PURE__ */ new Map;return r=>{if(n.has(r)){let e=n.get(r);return n.delete(r),n.set(r,e),e}let i=t(r);return n.set(r,i),n.size>e&&n.delete(n.keys().next().value),i}}let Ap=(e=512)=>kp(e,e=>dd(e));function jp(e=512){let t=Ap(e),n=kp(e,e=>{let n=e.indexOf(`:`),r=n+1+Number(e.slice(0,n));return Op(e.slice(r),e.slice(n+1,r),t)});return(e,t)=>n(`${t.length}:${t}${e}`)}let Mp=8192,Np=.02,Pp=.5;function Fp(e,t=440){let n=69+12*Math.log2(e/t),r=Math.round(n);return{note:r,cents:(n-r)*100}}function Ip(e,t=2){if(!Number.isFinite(e))return Mp;let n=Math.round(Mp+e/(100*t)*Mp);return Math.max(0,Math.min(16383,n))}function Lp(e,t=Math.max(Math.abs(e.gains[0]),Math.abs(e.gains[1]))){let n=e.levels[0]?.level??1,r=Math.max(0,n*Math.abs(t)),i=Math.round(127*Math.sqrt(Math.min(1,r)));return Math.max(1,Math.min(127,Number.isFinite(i)?i:1))}let Rp=[{note:35,name:`acousticbassdrum`,aliases:[]},{note:36,name:`bd`,aliases:[`kick`,`kd`,`bassdrum`]},{note:37,name:`rim`,aliases:[`rs`,`sidestick`]},{note:38,name:`sd`,aliases:[`snare`,`acousticsnare`]},{note:39,name:`cp`,aliases:[`clap`,`handclap`]},{note:40,name:`electricsnare`,aliases:[]},{note:41,name:`lt`,aliases:[`lo`,`lowfloortom`]},{note:42,name:`hh`,aliases:[`ch`,`closedhihat`]},{note:43,name:`highfloortom`,aliases:[]},{note:44,name:`ph`,aliases:[`pedalhihat`]},{note:45,name:`mt`,aliases:[`tom`,`mid`,`lowtom`]},{note:46,name:`oh`,aliases:[`openhihat`]},{note:47,name:`lowmidtom`,aliases:[]},{note:48,name:`ht`,aliases:[`hi`,`himidtom`]},{note:49,name:`cr`,aliases:[`crash`,`crashcymbal`]},{note:50,name:`hightom`,aliases:[]},{note:51,name:`rd`,aliases:[`ride`,`ridecymbal`]},{note:52,name:`chinesecymbal`,aliases:[]},{note:53,name:`ridebell`,aliases:[]},{note:54,name:`tb`,aliases:[`tambourine`]},{note:55,name:`splashcymbal`,aliases:[]},{note:56,name:`cb`,aliases:[`cowbell`]},{note:57,name:`crashcymbaltwo`,aliases:[]},{note:58,name:`vibraslap`,aliases:[]},{note:59,name:`ridecymbaltwo`,aliases:[]},{note:60,name:`hibongo`,aliases:[]},{note:61,name:`lowbongo`,aliases:[]},{note:62,name:`mutehiconga`,aliases:[]},{note:63,name:`openhiconga`,aliases:[]},{note:64,name:`lowconga`,aliases:[]},{note:65,name:`hightimbale`,aliases:[]},{note:66,name:`lowtimbale`,aliases:[]},{note:67,name:`highagogo`,aliases:[]},{note:68,name:`lowagogo`,aliases:[]},{note:69,name:`cabasa`,aliases:[]},{note:70,name:`sh`,aliases:[`maracas`]},{note:71,name:`shortwhistle`,aliases:[]},{note:72,name:`longwhistle`,aliases:[]},{note:73,name:`shortguiro`,aliases:[]},{note:74,name:`longguiro`,aliases:[]},{note:75,name:`claves`,aliases:[`clave`]},{note:76,name:`hiwoodblock`,aliases:[]},{note:77,name:`lowwoodblock`,aliases:[]},{note:78,name:`mutecuica`,aliases:[]},{note:79,name:`opencuica`,aliases:[]},{note:80,name:`mutetriangle`,aliases:[]},{note:81,name:`opentriangle`,aliases:[]}],zp=new Map(Rp.flatMap(({note:e,name:t,aliases:n})=>[t,...n].map(t=>[t,e])));function Bp(e){return zp.get(e.toLowerCase().replace(/\d+$/,``))??null}function Vp(e){let t=/* @__PURE__ */ new Map;for(let n of e){let e=Bp(n);e!==null&&t.set(n,e)}let n=new Set(t.values()),r=36;for(let i of e)if(!t.has(i)){for(;r<=127&&n.has(r);)r++;if(r>127)break;t.set(i,r),n.add(r)}return t}let Hp=e=>[...e.cells.values()].some(e=>sc(e)),Up=e=>(t,n)=>{let r=e.cells.get(t)?.span,i=e.cells.get(n)?.span;return(r?.line??1/0)-(i?.line??1/0)||(r?.col??0)-(i?.col??0)},Wp=(e,t=10)=>{let n=e%15;return n<t-1?n+1:n+2},Gp=(e,t)=>Ru(e.cells.get(t.voice)),Kp=(e,t)=>[...t.through,...t.via].find(t=>!!e.cells.get(t)?.gate),qp=(e,t)=>Kp(e,t)??t.voice,Jp=e=>e.kit&&(e.mods.length>0||e.offset!==0),Yp=e=>e.kit&&!Jp(e);function Xp(e){let t=/* @__PURE__ */ new Set,n=/* @__PURE__ */ new Set;for(let r of e.outputs)if(!r.silent){if(Yp(r))for(let t of Gp(e,r))n.add(t);else if(r.kit)for(let n of Gp(e,r))t.add(Kp(e,r)??n);else t.add(qp(e,r))}let r=Up(e);return{voices:[...t].sort(r),members:[...n].sort(r)}}function Zp(e,t=[{}]){if(Hp(e))return Qp(e);let{voices:n,members:r}=Xp(e),i=Vp(r),a=[],o=[];(t.length?t:[{}]).forEach((e,t)=>{let r=t===0,s=$p(e.kit)??(r?10:0);s&&i.size&&o.push({port:t+1,channel:s}),n.forEach((n,i)=>{let o=$p(e.voices?.[n])??(r?Wp(i,s||10):0);o&&a.push({voice:n,channel:o,port:t+1})})});let s=Up(e);return{voices:a.sort((e,t)=>s(e.voice,t.voice)||e.port-t.port),kit:[...i].map(([e,t])=>({member:e,note:t})),kits:o}}function Qp(e){let t=Up(e),n=/* @__PURE__ */ new Map,r=/* @__PURE__ */ new Set,i=/* @__PURE__ */ new Map,a=/* @__PURE__ */ new Set;for(let t of e.outputs)for(let o of t.midi??[])if(a.add(o.port),Yp(t)){for(let n of Gp(e,t))r.add(n);i.set(`${o.port}|${o.channel}`,{port:o.port,channel:o.channel})}else for(let r of t.kit?Gp(e,t):[t.voice])n.set(`${r}|${o.channel}|${o.port}`,{voice:r,channel:o.channel,port:o.port});for(let t of e.cells.values())t.map?.kind===`midi`&&a.add(t.map.port);let o=Vp([...r].sort(t));return{voices:[...n.values()].sort((e,n)=>t(e.voice,n.voice)||e.port-n.port||e.channel-n.channel),kit:[...o].map(([e,t])=>({member:e,note:t})),kits:o.size?[...i.values()].sort((e,t)=>e.port-t.port||e.channel-t.channel):[],byPiece:!0,ports:[...a].sort((e,t)=>e-t)}}let $p=e=>e===0?0:em(e),em=e=>typeof e==`number`&&Number.isInteger(e)&&e>=1&&e<=16?e:null,tm=e=>e===null?[]:Array.isArray(e)?e:[e];function nm(e,t){let n=new Map(e.outputs.map(e=>[e.id,e])),r=/* @__PURE__ */ new Map;for(let e of t.voices)r.set(e.voice,[...r.get(e.voice)??[],{channel:e.channel,port:e.port}]);let i=new Map(t.kit.map(e=>[e.member,e.note]));return t.byPiece?e=>{if(!e.midi?.length)return null;let t=e.output===void 0?void 0:n.get(e.output),r=t&&Yp(t)?i.get(e.voice):null;return r===void 0?null:e.midi.map(e=>({channel:e.channel,drum:r,port:e.port,gain:e.gain}))}:a=>{let o=a.output===void 0?void 0:n.get(a.output);if(o?.silent)return null;if(o&&Yp(o)){let e=i.get(a.voice);return e===void 0?null:t.kits.map(t=>({channel:t.channel,drum:e,port:t.port}))}let s=o?o.kit?Kp(e,o)??a.voice:qp(e,o):a.voice;return(r.get(s)??[]).map(e=>({channel:e.channel,drum:null,port:e.port}))}}function rm(e,t,n=2,r=440){let i=Lp(e,t.gain),a=e.at+Math.max(0,e.dur);if(t.drum!==null)return{channel:t.channel,note:t.drum,velocity:i,at:e.at,end:a,bend:Mp,bends:[]};if(!(e.freq>0)||!Number.isFinite(e.freq))return null;let{note:o,cents:s}=Fp(e.freq,r);if(o<0||o>127)return null;let c=Math.abs(s)<Pp?0:s,l=e=>Math.abs(c+e)<Pp?Mp:Ip(c+e,n),u=[],d={at:e.at,cents:0},f=(e,t)=>{t!==(u.at(-1)?.value??l(0))&&u.push({at:e,value:t})};for(let t of e.bends){if(t.at>=a)break;if(t.ramp&&t.at>d.at)for(let e=d.at+Np;e<t.at-1e-9;e+=Np)f(e,l(d.cents+(t.cents-d.cents)*(e-d.at)/(t.at-d.at)));let n=Math.max(e.at,t.at);f(n,l(t.cents)),d={at:n,cents:t.cents}}return{channel:t.channel,note:o,velocity:i,at:e.at,end:a,bend:l(0),bends:u}}let im=(e,t,n)=>({...e,sign:e.sign*t,by:e.by*t+n}),am=e=>`${e.table}:${e.sign*e.value+e.by}:${e.sign*e.alter}:${e.transpose}`;function om(e){if(typeof e.written==`number`)return String(e.sign*e.written+e.by);let t=e.sign===-1?`inverse(${e.written})`:e.written;return e.by===0?t:/^&[A-Za-z_][A-Za-z0-9_]*$/.test(t)?`${t}^${e.by}`:`degree(${t}, ${e.by})`}let sm=e=>Bp(e.slice(1))??128,cm=/^~(?:!(\d+))?$/,lm=/^&([A-Za-z_][A-Za-z0-9_]*)(?::0(?::([0-9]*\.?[0-9]+))?)?(?:!(\d+))?$/,um=/^\[([^[\]]*,[^[\]]*)\]$/,dm=/^\[([^[\],]*)\]$/,fm=/^&([A-Za-z_][A-Za-z0-9_]*)\((\d+),\s*(\d+)(?:,\s*(-?\d+))?\)$/,pm=/^([0-9]*\.?[0-9]+)(?:!(\d+))?$/,mm=/^(-?\d+)(?:!(\d+))?$/,hm=String.raw`&[A-Za-z_][A-Za-z0-9_]*(?:\^\$?-?\d+)?`,gm=new RegExp(String.raw`^(?:${hm}|inverse\(${hm}\)|degree\((?:${hm}|inverse\(${hm}\)),\s*-?\d+\))$`);function _m(e){let t=lm.exec(e);return t&&!t[3]?{voice:`&${t[1]}`,own:t[2]??null}:null}function vm(e){let t=[];for(let n of e){let e=cm.exec(n),r=lm.exec(n),i=um.exec(n);if(e)for(let n=0;n<Number(e[1]??1);n++)t.push([]);else if(r)for(let e=0;e<Number(r[3]??1);e++)t.push([{voice:`&${r[1]}`,own:r[2]??null}]);else if(i){let e=i[1].split(`,`).map(e=>_m(e.trim()));if(e.some(e=>!e))return null;t.push(e)}else return null}return t}function ym(e){let t=[];for(let n of e){let e=pm.exec(n);if(!e)return null;for(let n=0;n<Number(e[2]??1);n++)t.push(e[1])}return t}let bm=(e,t,n)=>{let r=fa(e,t);return Array.from({length:t},(e,t)=>t).filter(e=>r[((e-n)%t+t)%t])};function xm(e,t){if(!e||!t)return null;let n=t.pulses/t.unit;return e===`1m`?n:e===`pulse`?1/t.unit:iu(e)}function Sm(e,t){let n=Cs(e,t)?.braid??[];return n.length!==1||!/^\[.*\]$/.test(n[0])?[]:n[0].slice(1,-1).split(`,`).map(e=>e.trim())}function Cm(e,t){let n=[...t.cells.values()].filter(e=>(e.map?.kind===`midi`||e.sink)&&!e.implicit),r=[];for(let i of n){let n=Sm(e,i.name);for(let a of n){let o=a.split(`*`).map(e=>e.trim()),s=o.filter(e=>e.startsWith(`&`));if(o.some(e=>!/^&[A-Za-z_][A-Za-z0-9_]*$/.test(e)&&!pm.test(e)))continue;let c=s.map(e=>t.cells.get(e.slice(1)));if(c.some(e=>!e))continue;let l=c.filter(e=>e.map?.kind===`amp`),u=c.filter(e=>e.map?.kind!==`amp`),d=u.filter(e=>e.voice),f={name:i.name,entries:n,entry:a};if(u.length===2&&d.length===1&&!l.length){let n=Tm(e,t,u.find(e=>!e.voice).name,d[0].name,f);n&&r.push(n);continue}if(u.length!==1||l.length>1)continue;let p=wm(e,t,u[0].name,l[0]?.name,f);p&&r.push(p)}}return r}function wm(e,t,n,r,i){let a=Cs(e,n),o=t.cells.get(n);if(!a||!o.step)return null;let s=t.cells.get(o.step.driver)?.meter??null,c=xm(o.step.tap,s),l=e=>!!t.cells.get(e.slice(1))?.voice,u=`steps`,d,f;if(a.braid.length===1&&fm.test(a.braid[0])){let[,e,t,n,r]=fm.exec(a.braid[0]);u=`euclid`,f={voice:`&${e}`,k:Number(t),n:Number(n),r:Number(r??0)};let i=new Set(bm(f.k,f.n,f.r));d=Array.from({length:f.n},(e,t)=>i.has(t)?[{voice:f.voice,own:null}]:[])}else a.braid.length===1&&dm.test(a.braid[0])?(u=`seq`,d=vm(bs(dm.exec(a.braid[0])[1]))):d=vm(a.braid);if(!d?.length||d.some(e=>e.some(e=>!l(e.voice)))||u===`steps`&&d.length!==o.steps)return null;let p;if(r){let t=ym(Cs(e,r)?.braid??[]);if(!t||t.length!==d.length)return null;p={cell:r,tokens:t}}let m=d.flatMap((e,t)=>e.map(e=>({step:t,voice:e.voice,own:e.own,level:Number(e.own??1)*Number(p?.tokens[t]??1)}))).filter(e=>e.level>0).sort((e,t)=>e.step-t.step||sm(e.voice)-sm(t.voice));return{name:`&${n}`,trigger:n,card:i,form:u,...f?{euclid:f}:{},...p?{levels:p}:{},steps:d.length,notes:m,stepWhole:c===null?null:u===`steps`?c:c/d.length,meter:s}}function Tm(e,t,n,r,i){let a=Cs(e,n),o=t.cells.get(n);if(!a||!o.step)return null;let s=t.cells.get(o.step.driver)?.meter??null,c=[];for(let e of a.braid){let t=cm.exec(e),n=mm.exec(e);if(t)for(let e=0;e<Number(t[1]??1);e++)c.push(null);else if(n)for(let e=0;e<Number(n[2]??1);e++)c.push(Number(n[1]));else if(gm.test(e))c.push(e);else return null}if(!c.length||c.length!==o.steps)return null;let l=Sf(t,n,cc(t)),u=[];for(let[e,t]of c.entries()){let n=l.filter(t=>Math.abs(t.step-e)<1e-9);if(t===null?n.length:n.length!==1||Math.abs(n[0].duration-1)>1e-9)return null;if(t===null)continue;let i=n[0],a={written:t,sign:1,by:0,table:`${i.table}:${i.tableShift}`,value:i.value,alter:i.alter,transpose:i.transpose??0};u.push({step:e,voice:`&${r}`,own:null,level:1,pitch:a})}return l.length===u.length?{name:`&${n}`,trigger:n,card:i,form:`steps`,steps:c.length,notes:u,stepWhole:xm(o.step.tap,s),meter:s,pitched:{table:o.over,voice:`&${r}`}}:null}let Em=e=>e.own===null?e.voice:`${e.voice}:0:${e.own}`;function Dm(e,t,n,r=!1){let i=/* @__PURE__ */ new Map;if(!t.length){let t=e.card.entries.filter(t=>t!==e.card.entry);if(!t.length)return null;i.set(e.card.name,[`[${t.join(`, `)}]`])}if(e.euclid&&r){let{voice:t,k:n,n:r,r:a}=e.euclid;i.set(e.trigger,[`${t}(${n},${r},${(a+1)%r})`])}else{let n=Array.from({length:e.steps},(e,n)=>{let r=t.filter(e=>e.step===n).map(e=>e.pitch?om(e.pitch):Em(e));return r.length===0?`~`:r.length===1?r[0]:`[${r.join(`,`)}]`});i.set(e.trigger,e.form===`steps`?n:[`[${n.join(` `)}]`])}return e.levels&&n&&i.set(e.levels.cell,[...n]),i}function Om(e){let t=e.beats.length;return e.beats.map((t,n)=>e.beats.slice(0,n).reduce((e,t)=>e+t,0)/e.unit).filter((e,n)=>t<=3?n>0:n%2==1)}let km=(e,t)=>Math.abs(e-t)<1e-9;function Am(e){if(!e.meter||e.stepWhole===null)return!1;let t=e.meter.pulses/e.meter.unit,n=Om(e.meter);return e.notes.every(r=>{let i=r.step*e.stepWhole%t;return n.some(e=>km(i,e)||km(i,e+t))})}let jm=(e,t)=>e.notes.length>0&&e.notes.every(e=>Bp(e.voice.slice(1))===t);function Mm(e,t){let n=e.cells.get(t);if(!n?.step)return null;let r=xm(n.step.tap,e.cells.get(n.step.driver)?.meter??null);if(r===null)return null;let i=/* @__PURE__ */ new Map;for(let n of Sf(e,t,cc(e)))i.set(n.step,[...i.get(n.step)??[],n.value+n.alter]);if(![...i.values()].some(e=>e.length>1))return null;let a=[...i.keys()].sort((e,t)=>e-t),o=e=>[...e].sort((e,t)=>e-t).join(`,`),s=a.filter((e,t)=>t===0||o(i.get(e))!==o(i.get(a[t-1]))).map(e=>({at:e*r,size:i.get(e).length}));return{lap:n.steps*r,changes:s}}function Nm(e,t){if(!e.pitched?.table||e.stepWhole===null)return[];let n=Mm(t,e.pitched.table);if(!n)return[];let r=e.steps*e.stepWhole,i=e=>km(e%n.lap,0)||km(e%n.lap,n.lap),a=1;for(;a<64&&!i(a*r);)a++;return e.notes.flatMap(t=>{let i=t.pitch;if(typeof i.written!=`number`||i.table!==`${e.pitched.table}:0`||i.alter||i.transpose)return[];let o=Array.from({length:a},(i,a)=>(t.step*e.stepWhole+a*r)%n.lap).flatMap(e=>n.changes.filter(t=>km(t.at,e)||km(t.at+n.lap,e))),s=e=>(i.value%e+e)%e===0;return o.length&&o.every(e=>s(e.size))?[{line:e.name,step:t.step,reason:`root`}]:[]})}function Pm(e,t){return e.flatMap(e=>e.pitched?Nm(e,t):jm(e,36)?[{line:e.name,reason:`kick`}]:jm(e,38)&&Am(e)?[{line:e.name,reason:`backbeat`}]:[])}let Fm=[`rotate`,`drop`,`add`],Im=[`transpose`,`invert`,`reverse`],Lm=[-2,-1,1,2];function Rm(e,t=``){let n=new Set(xp(e).map(e=>e.name)),r=[...xp(t).filter(e=>!n.has(e.name)).map(e=>e.written),e].join(`
`),i=dd(r);if(!i.ok)return{lines:[],anchors:[],result:null,own:n};let a=Cm(r,i);return{lines:a,anchors:Pm(a,i),result:i,own:n}}let zm=e=>e.startsWith(`&`)?e:`&${e}`,Bm=(e,t)=>Vm(e,t).variations.map(e=>e.variation);function Vm(e,t={}){let{workbench:n,operators:r=Fm,keep:i=[],fewest:a=1,degrees:o=Lm}=t,{lines:s,anchors:c,result:l,own:u}=Rm(e,n);if(!l)return{notes:null,span:null,bar:null,variations:[]};let d=/* @__PURE__ */ new Set([...c.filter(e=>e.step===void 0).map(e=>e.line),...i.map(zm)]),f=(e,t)=>c.some(n=>n.line===e.name&&n.step===t.step),p=(e,t)=>{let n=s[e].stepWhole;return n===null?`${e}@${t}`:(t*n).toFixed(9)},m=e=>String(Bp(e.slice(1))??e),h=e=>e.pitch?` ${am(e.pitch)}`:``,g=(e,t)=>t.map(t=>`${p(e,t.step)} ${s[e].stepWhole??e} ${t.voice}${h(t)}`),_=(e,t)=>t.map(t=>`${p(e,t.step)} ${m(t.voice)}${h(t)}`),v=new Map([...new Set(s.flatMap(e=>e.pitched?[e.pitched.voice]:[]))].map((e,t)=>[e,`voice#${t}`])),y=(e,t)=>{let{stepWhole:n,name:r}=s[e];return t.map(e=>{let t=`${n??r} ${e.pitch?`${v.get(e.voice)} ${am(e.pitch)}`:m(e.voice)}`;return n===null?{at:null,key:`${r}@${e.step} ${t}`}:{at:e.step*n,key:t}})},b=s.map((e,t)=>y(t,e.notes)),x=Um(l,u,s),S=[...s.map(e=>e.stepWhole===null?null:e.steps*e.stepWhole),...x.map(e=>e.lap)],C=s.find(e=>e.meter)?.meter??x.find(e=>e.meter)?.meter??null,w=S.length&&S.every(e=>e!==null)?S.reduce((e,t)=>Hm(e,t)):null,T=C?C.pulses/C.unit:null,E=x.flatMap(e=>e.notes),D=s.map((e,t)=>g(t,e.notes)),O=s.map((e,t)=>_(t,e.notes)),k=s.reduce((e,t)=>e+t.notes.length,0),A=(e,t)=>s.flatMap((n,r)=>r===e?g(e,t):D[r]).sort().join(`|`),j=/* @__PURE__ */ new Set([A(-1,[])]),M=[],N=/* @__PURE__ */ new Map,P=(t,n,r,i,o,c)=>{if(!o||k-s[t].notes.length+r.length<a)return;let l=s.flatMap((e,n)=>n===t?_(t,r):O[n]);if(new Set(l).size<l.length)return;let u=A(t,r);if(j.has(u))return;j.add(u);let d=s[t].name,f=(t,n)=>{N.has(t)||N.set(t,Cs(e,t));let r=N.get(t);return r?[...r.head,...r.attrs,...n??r.braid].join(` `):``},p={id:`vary:${n}:${d}${i===null?``:`:${i}`}:${M.length}`,tool:`vary`,rule:n,title:`${d}: ${c}`,before:[...o.keys()].map(e=>f(e)).join(`
`),after:[...o].map(([e,t])=>f(e,t)).join(`
`),apply:e=>[...o].reduce((e,[t,n])=>ws(e,t,n),e),line:d,by:`${n} ${d}${i===null?``:` ${i}`}`};M.push({variation:p,notes:[...s.flatMap((e,n)=>n===t?y(t,r):b[n]),...E]})},ee=e=>e.sort((e,t)=>e.step-t.step||sm(e.voice)-sm(t.voice)),F=e=>{let t=s[e].notes[0];return[t.step*(s[e].stepWhole??1),sm(t.voice)]},I=s.map((e,t)=>t).filter(e=>s[e].notes.length>0&&!d.has(s[e].name)).sort((e,t)=>F(e)[0]-F(t)[0]||F(e)[1]-F(t)[1]);for(let e of I){let t=s[e],n=t.levels?.tokens;for(let i of r)if(Im.includes(i)===!!t.pitched){if(i===`transpose`)for(let n of o){let r=t.notes.map(e=>f(t,e)?e:{...e,pitch:im(e.pitch,1,n)});P(e,i,r,n,Dm(t,r),`every note ${n>0?`up`:`down`} ${Math.abs(n)} degree${Math.abs(n)===1?``:`s`}`)}else if(i===`invert`){let n=t.notes[0].pitch.written;if(typeof n!=`number`)continue;let r=t.notes.map(e=>f(t,e)?e:{...e,pitch:im(e.pitch,-1,2*n)});P(e,i,r,null,Dm(t,r),`every note mirrored about its first`)}else if(i===`reverse`){let n=ee(Wm(t,e=>f(t,e)));P(e,i,n,null,Dm(t,n),`its notes in reverse order between its anchors`)}else if(i===`rotate`){let r=ee(t.notes.map(e=>({...e,step:(e.step+1)%t.steps})));P(e,i,r,null,Dm(t,r,n&&[n.at(-1),...n.slice(0,-1)],!0),`every note a step later, the last to the first`)}else if(i===`drop`)for(let n of t.notes){let r=t.notes.filter(e=>e!==n);P(e,i,r,n.step,Dm(t,r),`its ${n.voice} on step ${n.step} left out`)}else{let r=t.notes[0].voice,a=t.notes.reduce((e,t)=>t.level>e.level?t:e);for(let o=0;o<t.steps;o++){if(t.notes.some(e=>e.step===o&&m(e.voice)===m(r)))continue;let s=ee([...t.notes,{step:o,voice:r,own:a.own,level:a.level}]),c=n&&n.map((e,t)=>t===o?n[a.step]:e);P(e,i,s,o,Dm(t,s,c),`a ${r} on step ${o}, as loud as its loudest`)}}}}return{notes:[...b.flat(),...E],span:w,bar:T,variations:M}}function Hm(e,t){let n=(e,t)=>t?n(t,e%t):e,[r,i]=[Math.round(e*3840),Math.round(t*3840)];return r&&i?r/n(r,i)*i/3840:Math.max(e,t)}function Um(e,t,n){let r=new Set(n.flatMap(e=>[e.trigger,e.card.name,...e.levels?[e.levels.cell]:[]])),i=[];for(let n of t){let t=e.cells.get(n);if(!t?.step||r.has(n)||t.voice)continue;let a=e.cells.get(t.step.driver)?.meter??null,o=xm(t.step.tap,a);if(o===null)continue;let s=Sf(e,n,cc(e)),c=/* @__PURE__ */ new Map;for(let e of s)c.set(e.step,(c.get(e.step)??0)+1);if(![...c.values()].some(e=>e>1))continue;let l=i.length,u=s.map(e=>({at:e.step*o,key:`${o*e.duration} chords#${l} ${e.table}:${e.tableShift}:${e.value}:${e.alter}:${e.transpose??0}`}));i.push({notes:u,lap:t.steps*o,meter:a})}return i}function Wm(e,t){let n=new Map(e.notes.map(e=>[e.step,e])),r=e.notes.filter(t).map(e=>e.step),i=[];if(!r.length)i.push(Array.from({length:e.steps},(e,t)=>t));else for(let[t,n]of r.entries()){let a=r[(t+1)%r.length]+(t+1===r.length?e.steps:0);i.push(Array.from({length:a-n-1},(t,r)=>(n+1+r)%e.steps))}let a=e.notes.filter(t);for(let e of i)for(let[t,r]of e.entries()){let i=n.get(e[e.length-1-t]);i&&a.push({...i,step:r})}return a}function Gm(e,t){if(!(e>=0&&e<1))throw Error(`varied: draw ${e} is outside [0, 1)`);return Math.floor(e*t)}Object.freeze({filed:Object.freeze([]),points:Object.freeze([]),together:Object.freeze([])});let Km=.1,qm=(e,t,n=Km)=>t>0&&n>0?e-n*.1*Math.log1p(Math.min(t,10))/Math.log1p(10):e,Jm=e=>typeof e==`number`&&Number.isFinite(e);function Ym(e,t){if(typeof e!=`object`||!e)return[`${t}: not a style point`];let n=Object.entries(e);return n.length?n.flatMap(([e,n])=>Jm(n)?[]:[`${t}: ${e} is ${String(n)}, not a number`]):[`${t}: an empty point (no axes)`]}function Xm(e){let t=[],{id:n,text:r,association:i}=e;(typeof n!=`string`||!n.trim())&&t.push(`no id`);let a=typeof n==`string`&&n.trim()?n:`(no id)`;return(typeof r!=`string`||!r.trim())&&t.push(`${a}: no text`),!Array.isArray(i)||!i.length?t.push(`${a}: no style point in its association`):i.forEach((e,n)=>t.push(...Zm(e,`${a}: point ${n+1}`))),t}function Zm(e,t){let n=[];(!e||!Jm(e.weight)||e.weight<=0)&&n.push(`${t}: weight ${String(e?.weight)}, not a number > 0`);let r=e?.facet;return r!==void 0&&(typeof r!=`string`||!r.trim())&&n.push(`${t}: facet ${String(r)}, not a name`),n.push(...Ym(e?.point,t)),n}function Qm(e){let{filed:t,points:n,together:r}=e,i=[];if(!Array.isArray(t))i.push(`the layer: filed is not a list`);else{let e=/* @__PURE__ */ new Set;t.forEach((t,n)=>{let r=`filed ${n+1}`;if(!t?.fragment)return void i.push(`${r}: no fragment`);i.push(...Xm(t.fragment).map(e=>`${r}: ${e}`)),(typeof t.meta!=`object`||t.meta===null||Array.isArray(t.meta))&&i.push(`${r}: its meta is not a map`),typeof t.prose!=`string`&&i.push(`${r}: its prose is not a string`),e.has(t.fragment.id)&&i.push(`${r}: the id ${t.fragment.id} is filed twice`),e.add(t.fragment.id)})}if(Array.isArray(n)?n.forEach((e,t)=>{let n=`learned point ${t+1}`;(typeof e?.id!=`string`||!e.id.trim())&&i.push(`${n}: no id`),i.push(...Zm(e,n))}):i.push(`the layer: points is not a list`),!Array.isArray(r))i.push(`the layer: together is not a list`);else{let e=/* @__PURE__ */ new Set;r.forEach((t,n)=>{let r=`pair ${n+1}`,a=t?.ids,[o,s]=Array.isArray(a)?a:[];if(!Array.isArray(a)||a.length!==2||typeof o!=`string`||typeof s!=`string`||!o.trim()||!s.trim())return void i.push(`${r}: its ids are not two names`);o<s||i.push(`${r}: its ids ${o} and ${s} are not two, in order`),Number.isInteger(t?.count)&&t.count>0||i.push(`${r}: its count ${String(t?.count)} is not a whole number > 0`);let c=JSON.stringify([o,s]);e.has(c)&&i.push(`${r}: ${o} and ${s} are counted twice`),e.add(c)})}return i}function $m(e,t,n={}){let r=0,i=0;for(let a of Object.keys(e)){if(!Object.hasOwn(t,a))continue;let o=n[a]??1;r+=o*(e[a]-t[a])**2,i+=o}return i>0?Math.sqrt(r/i):1/0}let eh=(e,t)=>t===void 0?e.association:e.association.filter(e=>e.facet===void 0||e.facet===t);function th(e,t,n={},r){return Math.min(...eh(e,r).map(e=>$m(e.point,t,n)/e.weight))}let nh=(e,t)=>e<t?-1:+(e>t);function rh(e){let t=e.flatMap(Xm),n=/* @__PURE__ */ new Set;for(let{id:r}of e)n.has(r)&&t.push(`${r}: the id is given twice`),n.add(r);if(t.length)throw Error(`A malformed repository: ${t.join(`; `)}`);let r=[...e],i=jp(),a={fragments:r,filed:/* @__PURE__ */ new Set,together:/* @__PURE__ */ new Map,unheld:[]};function o(e){let t=Qm(e);for(let{fragment:r}of Array.isArray(e.filed)?e.filed:[])n.has(r?.id)&&t.push(`the layer files ${r.id}, a seed fragment's id`);if(t.length)throw Error(`A malformed learned layer: ${t.join(`; `)}`);if(!e.filed.length&&!e.points.length&&!e.together.length)return a;let i=new Set(e.filed.map(e=>e.fragment.id)),o=e=>n.has(e)||i.has(e),s=/* @__PURE__ */ new Map,c=/* @__PURE__ */ new Set;for(let{id:t,point:n,weight:r,facet:i}of e.points){if(!o(t)){c.add(t);continue}let e=s.get(t)??[];e.push({point:n,weight:r,...i===void 0?{}:{facet:i}}),s.set(t,e)}let l=e=>{let t=s.get(e.id);return t?{...e,association:[...e.association,...t]}:e},u=/* @__PURE__ */ new Map,d=(e,t,n)=>{let r=u.get(e)??/* @__PURE__ */ new Map;r.set(t,(r.get(t)??0)+n),u.set(e,r)};for(let{ids:t,count:n}of e.together){let[e,r]=t;for(let e of t)o(e)||c.add(e);o(e)&&o(r)&&(d(e,r,n),d(r,e,n))}return{fragments:[...r.map(l),...e.filed.map(e=>l(e.fragment))],filed:i,together:u,unheld:[...c].sort(nh)}}return{fragments:r,merge:o,query(e,t,n={},{facet:r,chosen:s=[],workbench:c,layer:l,pull:u=Km}={}){if(!(Number.isInteger(t)&&t>=0))throw Error(`query: k is ${t}, not a whole number ≥ 0`);if(!(Jm(u)&&u>=0))throw Error(`query: pull is ${String(u)}, not a number ≥ 0`);let d=[...Object.entries(e).flatMap(([e,t])=>Jm(t)?[]:[`${e} is ${String(t)}`]),...Object.entries(n).flatMap(([e,t])=>Jm(t)&&t>0?[]:[`${e}'s weight is ${String(t)}`])];if(d.length)throw Error(`query: ${d.join(`, `)}`);let{fragments:f,filed:p,together:m}=l?o(l):a,h=[...new Set(s)],g=e=>{let t=m.get(e),n=0;if(t)for(let e of h)n+=t.get(e)??0;return n},_=f.filter(e=>eh(e,r).length>0).map(t=>{let i=th(t,e,n,r);return{fragment:t,distance:i,score:qm(i,g(t.id),u)}}).sort((e,t)=>e.score-t.score||Number(p.has(t.fragment.id))-Number(p.has(e.fragment.id))||nh(e.fragment.id,t.fragment.id));if(c===void 0)return _.slice(0,t);let v=[];for(let e of _){if(v.length>=t)break;i(e.fragment.text,c).fits&&v.push(e)}return v}}}let ih=[`id`,`association`],ah=[`point`,`weight`,`facet`],oh=(e,t)=>e.entries.find(e=>e.key===t);function sh(e,t){return e.kind===`list`?e.items.map((e,n)=>{let r=`point ${n+1}`;if(e.kind!==`map`)return t.push({line:e.line,message:`${r} is a map (point, weight, facet)`}),{point:{},weight:0};for(let n of e.entries)ah.includes(n.key)||t.push({line:n.line,message:`${r}: ${n.key} is none of point, weight, facet`});let i={},a=oh(e,`point`);if(!a)t.push({line:e.line,message:`${r} has no point`});else if(a.value.kind!==`map`||!a.value.entries.length)t.push({line:a.line,message:`${r}: its point is a map of axes to numbers`});else for(let e of a.value.entries)e.value.kind===`scalar`&&typeof e.value.value==`number`?i[e.key]=e.value.value:t.push({line:e.line,message:`${r}: ${e.key} is ${JSON.stringify(fs(e.value))}, not a number`});let o=oh(e,`weight`),s=o?.value.kind===`scalar`?o.value.value:void 0;typeof s!=`number`&&t.push({line:o?.line??e.line,message:`${r}: ${o?`its weight is ${JSON.stringify(fs(o.value))}, not a number`:`no weight`}`});let c=oh(e,`facet`),l=c?.value.kind===`scalar`?c.value.value:void 0;return c&&typeof l!=`string`&&t.push({line:c.line,message:`${r}: its facet is ${JSON.stringify(fs(c.value))}, not a name`}),{point:i,weight:typeof s==`number`?s:0,...typeof l==`string`?{facet:l}:{}}}):(t.push({line:e.line,message:"the association is a list of points (`- point: …`)"}),[])}function ch(e){let t=e.split(/\r?\n/);if(t[0]!==`---`)return{problems:[{line:1,message:"no frontmatter: a fragment file starts with a line `---`"}]};let n=t.indexOf(`---`,1);if(n<0)return{problems:[{line:1,message:"the frontmatter is never closed: no second line `---`"}]};let r=ds(t.slice(1,n).join(`
`),2);if(`problems`in r)return r;let i=r.node;if(i.kind!==`map`)return{problems:[{line:i.line,message:"the frontmatter is a map (`id: …`, `association: …`)"}]};let a=[],o=es(t,n+1);`problems`in o&&a.push(...o.problems);let s=oh(i,`id`),c=s?.value.kind===`scalar`?s.value.value:void 0;s?typeof c!=`string`&&a.push({line:s.line,message:`the id is ${JSON.stringify(fs(s.value))}, not a string: quote it`}):a.push({line:1,message:`no id in the frontmatter`});let l=oh(i,`association`);l||a.push({line:1,message:`no association in the frontmatter`});let u=l?sh(l.value,a):[];if(a.length||`problems`in o)return{problems:a.sort((e,t)=>e.line-t.line)};let d={id:c,text:o.text,association:u},f=Xm(d);return f.length?{problems:f.map(e=>{let t=/point (\d+)/.exec(e);return{line:t?l.value.items[Number(t[1])-1].line:/no text/.test(e)?(o.map[0]?.line??n+2)-1:s.line,message:e}})}:{fragment:d,meta:Object.fromEntries(i.entries.filter(e=>!ih.includes(e.key)).map(e=>[e.key,fs(e.value)])),prose:o.prose,layout:o.layout}}function lh(e){let t=[],n=[],r=/* @__PURE__ */ new Map;for(let[i,a]of Object.entries(e)){let e=ch(a);if(`problems`in e){n.push(...e.problems.map(e=>`${i}:${e.line}: ${e.message}`));continue}let{id:o}=e.fragment,s=r.get(o);s===void 0?r.set(o,i):n.push(`${i}:${a.split(`
`).findIndex(e=>/^id:/.test(e))+1}: the id ${o} is given twice (first in ${s})`),t.push({path:i,...e})}return n.length?{problems:n}:{files:t}}let uh={"bass/01-root-bass":`---
id: root bass
association:
  - point:
      sync: 0
      harm: 0.3
      artic: 0
      energy: 0
    weight: 1
    facet: bass
  - point:
      sync: 0.3
      harm: 0.45
      artic: 0.55
      energy: 0.55
    weight: 1
    facet: bass
  - point:
      sync: 0.35
      harm: 0.55
      artic: 0.65
      energy: 0.65
    weight: 1
    facet: bass
  - point:
      sync: 0.05
      harm: 0.3
      artic: 0
      energy: 0.2
    weight: 1
    facet: bass
source: seed
lifted: yggi/jambot packages/engine/src/bass.ts @ 1037a80
---

\`\`\`cells
&bass over=&harm step=2n 0 0
&bassV loop=C2
&bassOut map=midi(2) [&bass * &bassV]
\`\`\`

Jambot's bass pattern \`root\`: the root of the chord in force on one and on three, the bar's downbeat and its half (\`bass.ts\` weighs them 1 and 0.6).
Its own lines read the host's \`&harm\` (\`over=&harm\`: each index a tone of the chord sounding) and tap the host's main meter, so it fits any workbench whose \`&bar\` and \`&harm\` are written first; its card sends it on Jambot's bass channel, 2.

At the point where the root is all \`bass.ts\` plays: there its blend weighs the pump, the eighths and the funk line 0 (no sync, no energy, legato), so the root's share is 1.
Of the points where it is 1, this is the nearest to Ambient's, the preset where the root's share is greatest (0.68): Ambient's harmony, its sync and energy at 0.
It is also at the three presets where the root is what \`bass.ts\` plays most, as the meters are at theirs (#209): Synth-pop's (0.32, the funk line 0.27), Deep house's (0.31, tied with the funk line, which the root takes as first in \`bass.ts\`'s order) and Ambient's (0.68). A preset plays a blend, and its nearest pattern's point needn't be the pattern it plays most.

What \`bass.ts\` adds that a fixed line doesn't: on three it plays the fifth one section in five and an octave up one in four, by a draw per section and step; it thins the line by the energy (each step sounds when a held draw falls under its weight times 0.55 + 0.6 × energy); the octave, the voice leading and the velocity are the performer's.
`,"bass/02-pumping-bass":`---
id: pumping bass
association:
  - point:
      sync: 0
      harm: 0
      artic: 1
      energy: 0
    weight: 1
    facet: bass
  - point:
      sync: 0.12
      harm: 0
      artic: 1
      energy: 0.8
    weight: 1
    facet: bass
source: seed
lifted: yggi/jambot packages/engine/src/bass.ts @ 1037a80
---

\`\`\`cells
&bass over=&harm step=8n ~ 0 ~ 0 ~ 0 ~ 0
&bassV loop=C2
&bassOut map=midi(2) [&bass * &bassV]
\`\`\`

Jambot's bass pattern \`pump\`: the root of the chord in force on the eighth after each beat, and nothing on the beat, not even on a chord change (\`bass.ts\` plays the new root on a change only while the pump weighs under 0.45).
Its own lines read the host's \`&harm\` and tap the host's main meter; its card sends it on Jambot's bass channel, 2.

At the one point where the pump's share of \`bass.ts\`'s blend is greatest, 0.74: a static vamp, staccato, no sync (each a factor of the pump: \`(1 − harm) × artic × (1 − sync)\`), and no energy, which would bring in the eighths.
That is Techno's harmony and articulation, its sync and energy at 0.
It is also at Techno's, the preset where the pump is what \`bass.ts\` plays most (0.50), as the meters are at theirs (#209).

What \`bass.ts\` adds that a fixed line doesn't: the fifth one step in five and an octave up one in four, by a draw per section and step; the thinning by the energy (here 0.55: each offbeat sounds about one section in two); the octave, the voice leading and the velocity, the performer's.
`,"bass/03-eighths-bass":`---
id: eighths bass
association:
  - point:
      sync: 0
      harm: 0.3
      artic: 0
      energy: 1
    weight: 1
    facet: bass
source: seed
lifted: yggi/jambot packages/engine/src/bass.ts @ 1037a80
---

\`\`\`cells
&bass over=&harm step=8n 0!8
&bassV loop=C2
&bassOut map=midi(2) [&bass * &bassV]
\`\`\`

Jambot's bass pattern \`eight\`: the root of the chord in force on every eighth (\`bass.ts\` weighs the downbeat 1, the bar's half 0.9, the others 0.8).
Its own lines read the host's \`&harm\` and tap the host's main meter; its card sends it on Jambot's bass channel, 2.

At a point where the eighths' share of \`bass.ts\`'s blend is greatest, 0.63: full energy and no sync (the eighths weigh \`0.6 × energy × (1 − funk)\`, the funk line weighs the sync), and no pump (legato, or a harmony that moves fully).
The eighths are what \`bass.ts\` plays most at no preset, so unlike the others they sit at no preset's point (#209).
Techno, the preset where their share is greatest (0.24), is as near two of those points (Techno legato, and Techno with its harmony moving), so it sits at the root bass's point with the energy at 1: there \`bass.ts\` moves from the root alone to the eighths by the energy alone.

What \`bass.ts\` adds that a fixed line doesn't: the fifth one step in five and an octave up one in four, off the downbeat; the thinning by the energy (here 1.15: each eighth sounds but about one in twelve); the octave, the voice leading and the velocity, the performer's.
`,"bass/04-funk-bass":`---
id: funk bass
association:
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: bass
  - point:
      sync: 0.5
      harm: 0.75
      artic: 0.35
      energy: 0.5
    weight: 1
    facet: bass
  - point:
      sync: 0.75
      harm: 0.85
      artic: 0.45
      energy: 0.45
    weight: 1
    facet: bass
source: seed
lifted: yggi/jambot packages/engine/src/bass.ts @ 1037a80
---

\`\`\`cells
&bass over=&harm step=16n 0 ~ ~ 0 ~ ~ 0 0 ~ ~ 0 0 ~ &bassNext &bassNext ~
&bassNext over=&harm[>>] 0
&bassV loop=C2
&bassOut map=midi(2) [&bass * &bassV]
\`\`\`

Jambot's bass pattern \`funk\`, its line on 4/4's sixteen steps, every step it weighs (\`bass.ts\`'s \`FUNK\`: 1, 0.7, 0.8, 0.4, 0.7, 0.5, 0.3, 0.8): the root of the chord in force, and on the bar's last two sixteenths the next chord's root, anticipated (\`&bassNext\`, over \`&harm[>>]\`).
Its own lines read the host's \`&harm\` and tap the host's main meter; its card sends it on Jambot's bass channel, 2.

At Funk's point: there the funk line's share of \`bass.ts\`'s blend is the greatest it gets, 0.74 (full sync weighs it 1 and the pump and the eighths 0), and Funk is the preset where its share is greatest.
It is also at the two other presets where the funk line is what \`bass.ts\` plays most, as the meters are at theirs (#209): Lo-fi hip hop's (0.48) and Bossa nova's (0.63).
At full sync \`bass.ts\` anticipates the next chord nine times in ten on a step of the bar's last three that isn't a change (\`0.9 × sync\`), so this line plays the anticipation.

What \`bass.ts\` adds that a fixed line doesn't: the tenth time, the root or the fifth there; the fifth one step in five and an octave up one in four elsewhere off the downbeat; the thinning by each step's weight and the energy (here 1: the 0.3 and the 0.4 sound about one section in three); the octave, the voice leading and the velocity, the performer's.
`,"bass/05-walking-bass":"---\nid: walking bass\nassociation:\n  - point:\n      sync: 0.35\n      harm: 1\n      artic: 0.3\n      energy: 0.6\n    weight: 1\n    facet: bass\nsource: seed\nlifted: yggi/jambot packages/engine/src/bass.ts @ 1037a80\n---\n\n```cells\n&bass over=&harm step=4n 0 1 2 &bassNext^$-1\n&bassNext over=&harm[>>] 0\n&bassV loop=C2\n&bassOut map=midi(2) [&bass * &bassV]\n```\n\nJambot's bass pattern `walk`, a note on every beat: the root of the chord in force on one, its third and its fifth, and on the last beat the next chord's root a semitone below (`&bassNext^$-1`: the next chord's root, `over=&harm[>>]`, moved a step of the grid, a semitone).\nThe semitone can't be an index: over the chord in force an accidental moves a degree of the key, so `0b` over `&harm[>>]` is a semitone only where the key's degree below the next root is one.\nIts own lines read the host's `&harm` and tap the host's main meter; its card sends it on Jambot's bass channel, 2.\n\nAt Swing jazz's point, under its meter swung on `8n` (`4/4 swung on 8n`): `bass.ts` walks only where the meter swings its eighths (`eighthSwing`) and the harmony moves (`harm ≥ 2/3`), and there the walk's share of its blend is the greatest it gets, 0.74, the funk line, the pump and the eighths all 0.\nThe swing is the meter's, not a style axis, so the point says only the harmony.\nSwing jazz is the only preset where the walk is what `bass.ts` plays most, and this point is Swing jazz's (#209); at the presets whose harmony moves but whose meter doesn't swing, the pattern played most is associated there and is found before the walk.\n\nWhat `bass.ts` draws that a fixed line chooses: the second and third beats each the third, the fifth or the seventh (the fifth twice over where the chord has none), a third each, so this line is one walk it plays, up through the chord; the approach from below or above, half each, so this one from below. Under a harmony that changes on the bar's half it leads into that change too. The octave, the voice leading and the velocity are the performer's.\n","harmony/01-tonic-vamp":"---\nid: tonic vamp\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.75\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm over=key step=1m cycle=8 [0,2,4]!8\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for all eight bars: the vamp `[0]`, a stack of degrees `key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `aeolian`, `dorian`.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: aeolian at Techno's point; dorian at Funk's point. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n","harmony/02-vamp-to-the-seventh":"---\nid: vamp to the seventh\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.75\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm over=key step=1m cycle=8 [0,2,4]!4 [6,8,10]!4\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its seventh (degree 6) for four: the vamp `[0, 6]`, a stack of degrees `key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `aeolian`, `dorian`, `mixolydian`. No preset of Jambot's is mixolydian, so mixolydian gives it no point of its own.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: aeolian at Techno's point; dorian at Funk's point. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n","harmony/03-vamp-to-the-fourth":`---
id: vamp to the fourth
association:
  - point:
      sync: 0.12
      harm: 0
      artic: 1
      energy: 0.8
    weight: 1
    facet: harmony
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: harmony
  - point:
      sync: 0.05
      harm: 0.12
      artic: 0
      energy: 0.2
    weight: 1
    facet: harmony
source: seed
lifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9
---

\`\`\`cells
&harm over=key step=1m cycle=8 [0,2,4]!4 [3,5,7]!4
\`\`\`

A vamp of Jambot's themes (\`themes.ts\`, \`VAMPS\`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its fourth (degree 3) for four: the vamp \`[0, 3]\`, a stack of degrees \`key\` reads (the chord in force a bass or a comp reads, \`over=&harm\`).
It defines \`&harm\` and uses the host's \`key\` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.
The mode is the host key's, so one text is every mode's vamp that has these degrees: \`aeolian\`, \`dorian\`, \`ionian\`, \`mixolydian\`. No preset of Jambot's is mixolydian, so mixolydian gives it no point of its own.

The layout is \`buildTheme\`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (\`chords[1 % n]\`, the first again for a vamp of one).
From 0.15 to 0.33 it lays the same chords two bars each, twice over (\`[0, 0, c, c]\`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.

At the points where \`buildTheme\` plays it: aeolian at Techno's point; dorian at Funk's point; ionian at Ambient's point with its harmony at 0.12. A mode's vamps are drawn alike (\`next() · vamps.length\`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.
`,"harmony/04-vamp-to-the-sixth":"---\nid: vamp to the sixth\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 0.05\n      harm: 0.12\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm over=key step=1m cycle=8 [0,2,4]!4 [5,7,9]!4\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its sixth (degree 5) for four: the vamp `[0, 5]`, a stack of degrees `key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `aeolian`, `ionian`.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: aeolian at Techno's point; ionian at Ambient's point with its harmony at 0.12. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n","harmony/05-vamp-to-the-fifth":"---\nid: vamp to the fifth\nassociation:\n  - point:\n      sync: 0.05\n      harm: 0.12\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm over=key step=1m cycle=8 [0,2,4]!4 [4,6,8]!4\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its fifth (degree 4) for four: the vamp `[0, 4]`, a stack of degrees `key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `ionian`.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: ionian at Ambient's point with its harmony at 0.12. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n","instruments/01-gm-kit":`---
id: gm kit
association:
  - point:
      sync: 0.5
      harm: 0.5
      artic: 0.5
      energy: 0.5
    weight: 0.5
    facet: instrument
source: seed
---

\`\`\`cells
&acousticbassdrum s=sine loop=G1 pitch=0..24 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .4 0 .05)
&bd s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0) env=&(map=adsr 0 .3 0 .05)
&rim s=sine loop=E5 env=&(map=adsr 0 .03 0 .02)
&sd s=white hpf=1500 env=&(map=adsr 0 .12 0 .05)
&cp s=white hpf=1000 env=&(map=adsr 0 .08 0 .05)
&electricsnare s=white hpf=2500 env=&(map=adsr 0 .09 0 .04)
&lt s=sine loop=G2 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .25 0 .05)
&hh s=white hpf=8000 env=&(map=adsr 0 .04 0 .02)
&highfloortom s=sine loop=A2 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .23 0 .05)
&ph s=white hpf=9000 env=&(map=adsr 0 .03 0 .01)
&mt s=sine loop=C3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .2 0 .05)
&oh s=white hpf=7000 env=&(map=adsr 0 .25 0 .1)
&lowmidtom s=sine loop=D3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .18 0 .05)
&ht s=sine loop=F3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .15 0 .05)
&cr s=white hpf=5000 env=&(map=adsr 0 .8 0 .3)
&hightom s=sine loop=A3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .13 0 .05)
&rd s=white hpf=9000 env=&(map=adsr 0 .4 0 .2)
&chinesecymbal s=white hpf=3000 distort=.3 env=&(map=adsr 0 .6 0 .2)
&ridebell s=tri loop=E6 env=&(map=adsr 0 .5 0 .2)
&tb s=white hpf=6000 env=&(map=adsr 0 .15 0 .05)
&splashcymbal s=white hpf=6000 env=&(map=adsr 0 .35 0 .1)
&cb s=square loop=G5 lpf=2500 env=&(map=adsr 0 .1 0 .03)
&crashcymbaltwo s=white hpf=4000 env=&(map=adsr 0 .9 0 .3)
&vibraslap s=white hpf=2000 crush=6 env=&(map=adsr 0 .6 0 .2)
&ridecymbaltwo s=white hpf=8000 env=&(map=adsr 0 .5 0 .2)
&hibongo s=sine loop=E4 pitch=0..7 * &(map=adsr 0 .02 0 0) env=&(map=adsr 0 .1 0 .03)
&lowbongo s=sine loop=A3 pitch=0..7 * &(map=adsr 0 .02 0 0) env=&(map=adsr 0 .12 0 .03)
&mutehiconga s=sine loop=C4 env=&(map=adsr 0 .05 0 .02)
&openhiconga s=sine loop=C4 pitch=0..5 * &(map=adsr 0 .03 0 0) env=&(map=adsr 0 .2 0 .05)
&lowconga s=sine loop=G3 pitch=0..5 * &(map=adsr 0 .03 0 0) env=&(map=adsr 0 .25 0 .05)
&hightimbale s=tri loop=D5 env=&(map=adsr 0 .15 0 .05)
&lowtimbale s=tri loop=A4 env=&(map=adsr 0 .18 0 .05)
&highagogo s=tri loop=A5 env=&(map=adsr 0 .2 0 .05)
&lowagogo s=tri loop=E5 env=&(map=adsr 0 .2 0 .05)
&cabasa s=white hpf=5000 env=&(map=adsr 0 .06 0 .03)
&sh s=white hpf=4000 env=&(map=adsr 0 .04 0 .03)
&shortwhistle s=sine loop=B6 env=&(map=adsr .01 .08 0 .03)
&longwhistle s=sine loop=B6 env=&(map=adsr .01 .1 .8 .1)
&shortguiro s=white hpf=2500 lpf=5000 crush=4 env=&(map=adsr 0 .08 0 .02)
&longguiro s=white hpf=2500 lpf=5000 crush=4 env=&(map=adsr 0 .3 0 .05)
&claves s=sine loop=D7 env=&(map=adsr 0 .06 0 .03)
&hiwoodblock s=sine loop=G5 env=&(map=adsr 0 .04 0 .02)
&lowwoodblock s=sine loop=C5 env=&(map=adsr 0 .05 0 .02)
&mutecuica s=sine loop=A4 pitch=0..7 * &(map=adsr 0 .08 0 0) env=&(map=adsr 0 .1 0 .03)
&opencuica s=sine loop=A4 pitch=0..12 * &(map=adsr .05 .2 0 0) env=&(map=adsr 0 .3 0 .05)
&mutetriangle s=sine loop=A6 env=&(map=adsr 0 .08 0 .03)
&opentriangle s=sine loop=A6 env=&(map=adsr 0 1.2 0 .4)
\`\`\`

General MIDI's drum kit (decision 054, #225): a voice for each of its 47 percussion notes, 35 to 81, in General MIDI's order, each under its kit name (\`GM_KIT\` in \`src/engine/midi.ts\`), so MIDI out sends each on its own note.
The names are Strudel's short names where Strudel has one (\`&bd\`, \`&sd\`, \`&hh\`, \`&oh\`, \`&cp\`, \`&rim\`, \`&lt\`, \`&mt\`, \`&ht\`, \`&cr\`, \`&rd\`, \`&cb\`, \`&tb\`, \`&sh\`), else General MIDI's, spelled as one word (\`&lowmidtom\`, \`&crashcymbaltwo\`); General MIDI's names for the first are aliases (\`kick\`, \`cowbell\`), which name the same note.

It defines voices and uses nothing, so it fills the holes a groove leaves (\`&bd &sd &hh\`), fits any workbench, and sounds only what a piece plays through it. Each sound is a first pass in cells' own parameters: a sine dropping in pitch for the drums and toms, filtered noise for the snares, hats and cymbals, a tuned sine or triangle for the hand percussion; the voices the core kit holds are its lines word for word.

A kit is style-neutral: it is associated once, as the facet \`instrument\`, at the centre of style space (every axis at 0.5), the point nearest the farthest preset, at half the core kit's weight, so a query for an instrument finds the core kit first and this one beside it.
`,"instruments/02-core-kit":`---
id: core kit
association:
  - point:
      sync: 0.5
      harm: 0.5
      artic: 0.5
      energy: 0.5
    weight: 1
    facet: instrument
source: seed
---

\`\`\`cells
&bd s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0) env=&(map=adsr 0 .3 0 .05)
&rim s=sine loop=E5 env=&(map=adsr 0 .03 0 .02)
&sd s=white hpf=1500 env=&(map=adsr 0 .12 0 .05)
&cp s=white hpf=1000 env=&(map=adsr 0 .08 0 .05)
&lt s=sine loop=G2 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .25 0 .05)
&hh s=white hpf=8000 env=&(map=adsr 0 .04 0 .02)
&ph s=white hpf=9000 env=&(map=adsr 0 .03 0 .01)
&mt s=sine loop=C3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .2 0 .05)
&oh s=white hpf=7000 env=&(map=adsr 0 .25 0 .1)
&ht s=sine loop=F3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .15 0 .05)
&cr s=white hpf=5000 env=&(map=adsr 0 .8 0 .3)
&rd s=white hpf=9000 env=&(map=adsr 0 .4 0 .2)
&claves s=sine loop=D7 env=&(map=adsr 0 .06 0 .03)
\`\`\`

The core of General MIDI's drum kit (decision 054, #225): the 13 voices a groove needs, the kick, the side stick, the snare, the clap, three toms, the closed, pedal and open hats, the crash, the ride and the claves, under the same names and with the same lines as the General MIDI kit, so a groove need not bring in 47 voices.
Its claves line is the son and bossa claves' own, word for word, so a clave and the kit side by side share it.

Associated as the General MIDI kit is, once as the facet \`instrument\` at the centre of style space, at twice its weight: the kit a query for an instrument finds first.
`,"meters/01-4-4":`---
id: 4/4
association:
  - point:
      sync: 0.3
      harm: 0.45
      artic: 0.55
      energy: 0.55
    weight: 1
    facet: meter
  - point:
      sync: 0.12
      harm: 0
      artic: 1
      energy: 0.8
    weight: 1
    facet: meter
  - point:
      sync: 0.75
      harm: 0.85
      artic: 0.45
      energy: 0.45
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("4/4")
\`\`\`

Straight 4/4, at the points of the three presets that play straight: Synth-pop's, Techno's and Bossa nova's (yggi/jambot#360).
`,"meters/02-4-4-swung-on-8n":`---
id: 4/4 swung on 8n
association:
  - point:
      sync: 0.35
      harm: 1
      artic: 0.3
      energy: 0.6
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("4/4") swing=8n:2/3
\`\`\`

Jambot's swing 1: the triplet swing, 2/3, on the eighths; the sixteenths straight. At Swing jazz's point. A meter swung on \`8n\` brings in Jambot's jazz kit (yggi/jambot#360).
`,"meters/03-4-4-leaning-on-16n":`---
id: 4/4 leaning on 16n
association:
  - point:
      sync: 0.5
      harm: 0.75
      artic: 0.35
      energy: 0.5
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("4/4") swing=16n:.65
\`\`\`

Jambot's swing .45: the sixteenths' heaviest lean of the presets. At Lo-fi hip hop's point.
`,"meters/04-4-4-leaning-lightly-on-16n":`---
id: 4/4 leaning lightly on 16n
association:
  - point:
      sync: 0.35
      harm: 0.55
      artic: 0.65
      energy: 0.65
    weight: 1
    facet: meter
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("4/4") swing=16n:.6
\`\`\`

Jambot's swing .3. At Deep house's and Funk's points, whose swing is the same.
`,"meters/05-4-4-leaning-faintly-on-16n":`---
id: 4/4 leaning faintly on 16n
association:
  - point:
      sync: 0.05
      harm: 0.3
      artic: 0
      energy: 0.2
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("4/4") swing=16n:31/60
\`\`\`

Jambot's swing .05: 31/60, an onset a thirtieth of a sixteenth late. At Ambient's point.
`,"meters/06-4-4-alla-breve":`---
id: 4/4 alla breve
association:
  - point:
      sync: 0.2
      harm: 0.6
      artic: 0.9
      energy: 1
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("4/4") beat=2
\`\`\`

Alla breve: the bpm counts half notes; fast, bright, marching.
`,"meters/07-2-4":`---
id: 2/4
association:
  - point:
      sync: 0
      harm: 0.1
      artic: 0.6
      energy: 1
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("2/4")
\`\`\`

A march, a polka: on the beat, plain, short and dense.
`,"meters/08-3-4":`---
id: 3/4
association:
  - point:
      sync: 0
      harm: 0.7
      artic: 0.3
      energy: 0
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("3/4")
\`\`\`

A waltz, a ballad: on the beat, rich, sparse.
`,"meters/09-6-8":`---
id: 6/8
association:
  - point:
      sync: 0.3
      harm: 0.2
      artic: 0.2
      energy: 0
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("6/8")
\`\`\`

A lilt: plain and sparse.
`,"meters/10-12-8":`---
id: 12/8
association:
  - point:
      sync: 0.7
      harm: 0.6
      artic: 0
      energy: 0.2
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("12/8")
\`\`\`

A slow blues, a soul ballad: legato, off the beat.
`,"meters/11-5-4":`---
id: 5/4
association:
  - point:
      sync: 0.4
      harm: 0.9
      artic: 0.5
      energy: 0.3
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("5/4")
\`\`\`

Cool jazz: rich, unhurried.
`,"meters/12-7-8":`---
id: 7/8
association:
  - point:
      sync: 0.8
      harm: 0.6
      artic: 1
      energy: 1
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("7/8")
\`\`\`

3+2+2, a Balkan dance: off the beat, short and dense.
`,"meters/13-10-8":`---
id: 10/8
association:
  - point:
      sync: 0.6
      harm: 0.9
      artic: 0.8
      energy: 0.9
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar meter("10/8")
\`\`\`

3+2+3+2.
`,"modes/01-aeolian":`---
id: aeolian
association:
  - point:
      sync: 0.3
      harm: 0.45
      artic: 0.55
      energy: 0.55
    weight: 1
    facet: mode
  - point:
      sync: 0.12
      harm: 0
      artic: 1
      energy: 0.8
    weight: 1
    facet: mode
  - point:
      sync: 0.5
      harm: 0.75
      artic: 0.35
      energy: 0.5
    weight: 1
    facet: mode
source: seed
---

\`\`\`cells
&key scale(aeolian, free(C))
\`\`\`

The natural minor: the key Jambot's composer plays at Synth-pop's, Techno's and Lo-fi hip hop's points (\`PRESETS\`' \`mode\`, yggi/jambot packages/engine/src/style.ts), and the mode it opens in (\`INITIAL_KEY\`, A aeolian).
It defines \`key\`, the piece's main key (decision 047's interface name, decision 056), and uses nothing, so it fits any workbench that has no key yet; the harmonies and the bass lines read it (\`over=key\`, then \`over=&harm\`).
The tonic is left to the host, \`free(C)\`: a number left to the performer, which Jambot's key plan sets as it moves; C is \`scale(…)\`'s own default.

At the point of each preset that plays it, weight 1, so a query for the mode at one of them finds aeolian first, at distance 0.
`,"modes/02-dorian":`---
id: dorian
association:
  - point:
      sync: 0.35
      harm: 0.55
      artic: 0.65
      energy: 0.65
    weight: 1
    facet: mode
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: mode
source: seed
---

\`\`\`cells
&key scale(dorian, free(C))
\`\`\`

The minor with a major sixth: the key Jambot's composer plays at Deep house's and Funk's points (\`PRESETS\`' \`mode\`, yggi/jambot packages/engine/src/style.ts).
It defines \`key\`, the piece's main key (decision 047's interface name, decision 056), and uses nothing, so it fits any workbench that has no key yet; the harmonies and the bass lines read it (\`over=key\`, then \`over=&harm\`).
The tonic is left to the host, \`free(C)\`: a number left to the performer, which Jambot's key plan sets as it moves; C is \`scale(…)\`'s own default.

At the point of each preset that plays it, weight 1, so a query for the mode at one of them finds dorian first, at distance 0.
`,"modes/03-ionian":`---
id: ionian
association:
  - point:
      sync: 0.05
      harm: 0.3
      artic: 0
      energy: 0.2
    weight: 1
    facet: mode
  - point:
      sync: 0.75
      harm: 0.85
      artic: 0.45
      energy: 0.45
    weight: 1
    facet: mode
  - point:
      sync: 0.35
      harm: 1
      artic: 0.3
      energy: 0.6
    weight: 1
    facet: mode
source: seed
---

\`\`\`cells
&key scale(ionian, free(C))
\`\`\`

The major: the key Jambot's composer plays at Ambient's, Bossa nova's and Swing jazz's points (\`PRESETS\`' \`mode\`, yggi/jambot packages/engine/src/style.ts).
It defines \`key\`, the piece's main key (decision 047's interface name, decision 056), and uses nothing, so it fits any workbench that has no key yet; the harmonies and the bass lines read it (\`over=key\`, then \`over=&harm\`).
The tonic is left to the host, \`free(C)\`: a number left to the performer, which Jambot's key plan sets as it moves; C is \`scale(…)\`'s own default.

At the point of each preset that plays it, weight 1, so a query for the mode at one of them finds ionian first, at distance 0.
The bell and scale (\`05-bell-and-scale.md\`) is ionian too, elsewhere.
`,"modes/04-mixolydian":`---
id: mixolydian
association:
  - point:
      sync: 0.875
      harm: 0.485
      artic: 0.65
      energy: 0.6
    weight: 1
    facet: mode
source: seed
---

\`\`\`cells
&key scale(mixolydian, free(C))
\`\`\`

The major with a minor seventh: the fourth of the composer's modes (\`COMPOSER_MODES\`, yggi/jambot packages/engine/src/key.ts), which no preset plays.
It defines \`key\`, the piece's main key (decision 047's interface name, decision 056), and uses nothing, so it fits any workbench that has no key yet; the harmonies and the bass lines read it (\`over=key\`, then \`over=&harm\`).
The tonic is left to the host, \`free(C)\`: a number left to the performer, which Jambot's key plan sets as it moves; C is \`scale(…)\`'s own default.

Between the major and the dorian minor (it shares the major's third and the dorian's seventh), it sits halfway between Funk's point (dorian) and Bossa nova's (ionian), where the son clave 3-2 sits too: the funk and rock of a major key with a flat seventh. It is the nearest mode there only, since each preset's own mode is at distance 0 at its point.
`,"modes/05-bell-and-scale":`---
id: bell and scale
association:
  - point:
      sync: 0.383
      harm: 0.717
      artic: 0.25
      energy: 0.417
    weight: 1
    facet: mode
  - point:
      sync: 0.8
      harm: 0.1
      artic: 0.9
      energy: 0.6
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&key scale(ionian, free(C)) step=1m*7
&bell step=&key:pulse &highagogo &highagogo:0:.5 &highagogo:0:.7 &highagogo:0:.5 &highagogo:0:.6 &highagogo:0:.5 &highagogo:0:.7
&agogo map=midi(10) [&bell * .5]
&highagogo s=tri loop=A5 env=&(map=adsr 0 .2 0 .05)
\`\`\`

The West African standard bell pattern, x.x.xx.x.x.x, seven strokes over twelve pulses, has the major scale's intervals, 2 2 1 2 2 2 1 (the example \`bell and scale\`).
So one cell is both: \`&key\` is the major scale, the piece's main key, and stepped seven times a bar, each step as long as its interval, it is the bell's timeline, which \`&bell\` strikes (\`step=&key:pulse\`).
The repository's first fragment of two facets, a \`mode\`, ionian, and a \`rhythm\`, the bell, each at a place of its own: "the bell is a world-music associated rhythm-facet and a western music associated harmony / scale-facet" (the owner, decision 046).

A stepped key that nothing plays doesn't turn, so a line over it (\`over=key\`) reads the major scale as \`&key scale(ionian, free(C))\` does, note for note; the tonic is left to the host as the mode fragments leave it.
\`step=1m*7\` lays the bell over the bar of any meter, as twelve twelfths: over 12/8 they are its pulses, the bell as it is played.

Seven strokes of a high agogô (\`&highagogo\`, General MIDI's 67, the General MIDI kit's line word for word), the example's accents, at half the level; its card, \`&agogo\`, is none of the drum bars' or the claves', so it layers on any of them.
As a rhythm its point is a timeline's: off the beat (sync 0.8), over one static chord (harm 0.1), struck (artic 0.9), steady and fairly dense (energy 0.6), where no preset is.
As a mode it is where the major is played: the centroid of the three presets that play ionian, Ambient's, Bossa nova's and Swing jazz's (each axis their mean, to three decimals), where no preset is, so at each of them the plain \`ionian\` is found first, at distance 0.
`,"rhythms/01-synth-pop-drums":`---
id: Synth-pop drums
association:
  - point:
      sync: 0.3
      harm: 0.45
      artic: 0.55
      energy: 0.55
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8
---

\`\`\`cells
&kick step=16n &bd:0:.547833 ~ ~ ~ ~ ~ ~ ~ &bd:0:.536239 ~ ~ ~ ~ ~ ~ ~
&backbeat step=16n ~ ~ ~ ~ &sd:0:.458553 ~ ~ ~ ~ ~ ~ ~ &sd:0:.469279 ~ ~ ~
&fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.161262 &sd:0:.303801 &sd:0:.386943
&ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.048608 ~ ~ ~ ~ ~ ~ ~ ~
&hat step=16n ~ ~ ~ ~ &hh:0:.278319 ~ ~ ~ &hh:0:.270073 ~ ~ ~ &hh:0:.253953 ~ &hh:0:.201438 ~
&drums map=midi(10) [&kick, &backbeat, &fill, &ghost, &hat]
&bd s=white
&sd s=white
&hh s=white
\`\`\`

Jambot's E31 bar for Synth-pop (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line, so the host's \`&bar\`, written first, sets its meter and tempo. At Synth-pop's point.
`,"rhythms/02-techno-drums":`---
id: Techno drums
association:
  - point:
      sync: 0.12
      harm: 0
      artic: 1
      energy: 0.8
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8
---

\`\`\`cells
&kick step=16n &bd:0:.763904 ~ ~ ~ &bd:0:.536239 ~ ~ ~ ~ ~ ~ ~ &bd:0:.524769 ~ ~ ~
&backbeat step=16n ~ ~ ~ ~ &sd:0:.607663 ~ ~ ~ ~ ~ ~ ~ &sd:0:.696633 ~ ~ ~
&fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.155 &sd:0:.201438 &sd:0:.261951 &sd:0:.321409 ~ &sd:0:.469279 &sd:0:.571393 &sd:0:.632463
&hat step=16n &hh:0:.367599 &hh:0:.148862 &oh:0:.270073 &hh:0:.148862 &hh:0:.377209 &hh:0:.148862 &oh:0:.278319 &hh:0:.155 &hh:0:.367599 &hh:0:.148862 &oh:0:.278319 &hh:0:.148862 &hh:0:.377209 &hh:0:.148862 &oh:0:.270073 &hh:0:.148862
&drums map=midi(10) [&kick, &backbeat, &fill, &hat]
&bd s=white
&hh s=white
&oh s=white
&sd s=white
\`\`\`

Jambot's E31 bar for Techno (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line, so the host's \`&bar\`, written first, sets its meter and tempo. At Techno's point.
`,"rhythms/03-deep-house-drums":`---
id: Deep house drums
association:
  - point:
      sync: 0.35
      harm: 0.55
      artic: 0.65
      energy: 0.65
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8
---

\`\`\`cells
&kick step=16n &bd:0:.595449 ~ ~ ~ ~ ~ ~ ~ &bd:0:.571393 ~ ~ ~ ~ ~ ~ ~
&backbeat step=16n ~ ~ ~ ~ &sd:0:.502201 ~ ~ ~ ~ ~ ~ ~ &sd:0:.491103 ~ ~ ~
&fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.161262 &sd:0:.339513 &sd:0:.406783
&ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.048608 ~ ~ ~ ~ ~ ~ ~ ~
&hat step=16n &hh:0:.321409 ~ &hh:0:.253953 ~ &hh:0:.303801 ~ ~ ~ &hh:0:.286689 ~ ~ ~ &hh:0:.261951 &hh:0:.094302 &hh:0:.230702 ~
&drums map=midi(10) [&kick, &backbeat, &fill, &ghost, &hat]
&bd s=white
&hh s=white
&sd s=white
\`\`\`

Jambot's E31 bar for Deep house (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line, so the host's \`&bar\`, written first, sets its meter and tempo. At Deep house's point.
`,"rhythms/04-ambient-drums":`---
id: Ambient drums
association:
  - point:
      sync: 0.05
      harm: 0.3
      artic: 0
      energy: 0.2
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8
---

\`\`\`cells
&kick step=16n &bd:0:.513423 ~ ~ ~ ~ ~ ~ ~ &bd:0:.502201 ~ ~ ~ ~ ~ ~ ~
&backbeat step=16n ~ ~ ~ ~ &sd:0:.386943 ~ ~ ~ ~ ~ ~ ~ &sd:0:.458553 ~ ~ ~
&fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.0992 &sd:0:.136958 &sd:0:.167648 &sd:0:.194432 ~ &sd:0:.303801 &sd:0:.416889 &sd:0:.396801
&hat step=16n &hh:0:.238328 ~ &hh:0:.174158 ~ &hh:0:.261951 ~ ~ ~ &hh:0:.230702 ~ &hh:0:.201438 ~ &hh:0:.261951 ~ &hh:0:.2232 ~
&drums map=midi(10) [&kick, &backbeat, &fill, &hat]
&bd s=white
&hh s=white
&sd s=white
\`\`\`

Jambot's E31 bar for Ambient (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line, so the host's \`&bar\`, written first, sets its meter and tempo. At Ambient's point.
`,"rhythms/05-lo-fi-hip-hop-drums":`---
id: Lo-fi hip hop drums
association:
  - point:
      sync: 0.5
      harm: 0.75
      artic: 0.35
      energy: 0.5
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8
---

\`\`\`cells
&kick step=16n &bd:0:.524769 ~ ~ &bd:0:.286689 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
&backbeat step=16n ~ ~ ~ ~ &sd:0:.458553 ~ ~ ~ ~ ~ ~ ~ &sd:0:.416889 ~ ~ ~
&fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.12555 &sd:0:.321409 &sd:0:.358113
&ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.041912 ~ ~ ~ ~ ~ ~ ~ ~
&hat step=16n ~ ~ ~ ~ &hh:0:.278319 ~ ~ ~ &hh:0:.253953 ~ ~ ~ &hh:0:.2232 ~ &hh:0:.215822 ~
&euclid step=1m &rim(5,16,4)
&euclidLevel map=amp step=16n .201438 0 0 0 .215822 0 0 .161262 0 0 .230702 0 0 .194432 0 0
&drums map=midi(10) [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]
&bd s=white
&rim s=white
&sd s=white
&hh s=white
\`\`\`

Jambot's E31 bar for Lo-fi hip hop (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line, so the host's \`&bar\`, written first, sets its meter and tempo. At Lo-fi hip hop's point. The rim's Euclid taps \`1m\`, so it stays straight under a swung meter (#121).
`,"rhythms/06-funk-drums":`---
id: Funk drums
association:
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8
---

\`\`\`cells
&kick step=16n &bd:0:.645049 ~ ~ &bd:0:.386943 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
&backbeat step=16n ~ ~ ~ ~ &sd:0:.536239 ~ ~ ~ ~ ~ ~ ~ &sd:0:.536239 ~ ~ ~
&fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.180792 &sd:0:.367599 &sd:0:.447951
&ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.089528 ~ ~ ~ ~ ~ ~ ~ ~
&hat step=16n &hh:0:.348751 ~ &oh:0:.253953 ~ &hh:0:.330399 &hh:0:.114638 &oh:0:.230702 ~ &hh:0:.312543 ~ ~ ~ &hh:0:.286689 &hh:0:.104222 &oh:0:.215822 ~
&euclid step=1m &rim(7,16,0)
&euclidLevel map=amp step=16n .253953 0 0 .270073 0 .270073 0 .230702 0 0 .278319 0 .270073 0 .295183 0
&drums map=midi(10) [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]
&bd s=white
&rim s=white
&hh s=white
&oh s=white
&sd s=white
\`\`\`

Jambot's E31 bar for Funk (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line, so the host's \`&bar\`, written first, sets its meter and tempo. At Funk's point. The rim's Euclid taps \`1m\`, so it stays straight under a swung meter (#121).
`,"rhythms/07-bossa-nova-drums":`---
id: Bossa nova drums
association:
  - point:
      sync: 0.75
      harm: 0.85
      artic: 0.45
      energy: 0.45
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8
---

\`\`\`cells
&kick step=16n &bd:0:.502201 ~ ~ &bd:0:.312543 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
&backbeat step=16n ~ ~ ~ ~ &sd:0:.416889 ~ ~ ~ ~ ~ ~ ~ &sd:0:.427119 ~ ~ ~
&fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.148862 &sd:0:.278319 &sd:0:.348751
&ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.063488 ~ ~ ~ ~ ~ ~ ~ ~
&hat step=16n ~ ~ ~ ~ ~ ~ ~ ~ &hh:0:.246078 ~ ~ ~ &hh:0:.230702 ~ &hh:0:.18755 ~
&euclid step=1m &rim(5,16,4)
&euclidLevel map=amp step=16n .201438 0 0 0 .208568 0 0 .180792 0 0 .215822 0 0 .201438 0 0
&drums map=midi(10) [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]
&bd s=white
&rim s=white
&sd s=white
&hh s=white
\`\`\`

Jambot's E31 bar for Bossa nova (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line, so the host's \`&bar\`, written first, sets its meter and tempo. At Bossa nova's point.
`,"rhythms/08-swing-jazz-drums":`---
id: Swing jazz drums
association:
  - point:
      sync: 0.35
      harm: 1
      artic: 0.3
      energy: 0.6
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8
---

\`\`\`cells
&kick step=16n &bd:0:.559551 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
&backbeat step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.416889 ~ ~ ~
&fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.109368 &sd:0:.386943 &sd:0:.367599
&ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.030008 &sd:0:.0558 ~ ~ ~ ~ ~ ~ ~
&hat step=16n &rd:0:.295183 ~ ~ ~ &rd:0:.278319 ~ ~ ~ &rd:0:.230702 ~ ~ ~ &rd:0:.253953 ~ &rd:0:.215822 ~
&pedal step=16n ~ ~ ~ ~ &ph:0:.161262 ~ ~ ~ ~ ~ ~ ~ &ph:0:.201438 ~ ~ ~
&drums map=midi(10) [&kick, &backbeat, &fill, &ghost, &hat, &pedal]
&bd s=white
&rd s=white
&ph s=white
&sd s=white
\`\`\`

Jambot's E31 bar for Swing jazz (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line, so the host's \`&bar\`, written first, sets its meter and tempo. At Swing jazz's point.
`,"rhythms/09-son-clave-3-2":`---
id: son clave 3-2
association:
  - point:
      sync: 0.875
      harm: 0.485
      artic: 0.65
      energy: 0.6
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&clave step=16n cycle=2 &claves ~!5 &claves ~!5 &claves ~!7 &claves ~!3 &claves ~!7
&percussion map=midi(10) [&clave * .5]
&claves s=sine loop=D7 env=&(map=adsr 0 .06 0 .03)
\`\`\`

The son clave, 3-2: x..x..x. ..x.x... over two bars of eighths. It is where the bossa nova clave and Funk's Bo Diddley beat come from, and sits halfway between Bossa nova and Funk.

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). Its names (\`&clave\`, \`&percussion\`, \`&claves\`) are none of the drum bars', so it layers on any of them in one text.
`,"rhythms/10-son-clave-2-3":`---
id: son clave 2-3
association:
  - point:
      sync: 0.95
      harm: 0.35
      artic: 0.75
      energy: 0.65
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&clave step=16n cycle=2 ~!4 &claves ~!3 &claves ~!7 &claves ~!5 &claves ~!5 &claves ~!3
&percussion map=midi(10) [&clave * .5]
&claves s=sine loop=D7 env=&(map=adsr 0 .06 0 .03)
\`\`\`

The son clave from its other bar, 2-3: it starts off the downbeat, so it sits a step from 3-2 toward Funk, more off the beat and plainer.

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). Its names (\`&clave\`, \`&percussion\`, \`&claves\`) are none of the drum bars', so it layers on any of them in one text.
`,"rhythms/11-rumba-clave-3-2":`---
id: rumba clave 3-2
association:
  - point:
      sync: 1
      harm: 0.2
      artic: 0.75
      energy: 0.8
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&clave step=16n cycle=2 &claves ~!5 &claves ~!7 &claves ~!5 &claves ~!3 &claves ~!7
&percussion map=midi(10) [&clave * .5]
&claves s=sine loop=D7 env=&(map=adsr 0 .06 0 .03)
\`\`\`

The rumba clave, 3-2: the son's third stroke an eighth later, off the beat; drums and voices over a static harmony, short and dense: near Funk.

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). Its names (\`&clave\`, \`&percussion\`, \`&claves\`) are none of the drum bars', so it layers on any of them in one text.
`,"rhythms/12-bossa-nova-clave":`---
id: bossa nova clave
association:
  - point:
      sync: 0.8
      harm: 0.85
      artic: 0.45
      energy: 0.35
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&clave step=16n cycle=2 &claves ~!5 &claves ~!5 &claves ~!7 &claves ~!5 &claves ~!5
&percussion map=midi(10) [&clave * .5]
&claves s=sine loop=D7 env=&(map=adsr 0 .06 0 .03)
\`\`\`

The bossa nova clave: the son's last stroke an eighth later. Bossa nova's harmony and articulation, a little more off the beat and sparser than its drum bar: five strokes in two bars.

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). Its names (\`&clave\`, \`&percussion\`, \`&claves\`) are none of the drum bars', so it layers on any of them in one text.
`,"rhythms/13-bossa-nova-clave-one-bar":`---
id: bossa nova clave (one bar)
association:
  - point:
      sync: 0.8
      harm: 0.85
      artic: 0.45
      energy: 0.45
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&clave step=16n &claves ~!2 &claves ~!2 &claves ~!3 &claves ~!2 &claves ~!2
&percussion map=midi(10) [&clave * .5]
&claves s=sine loop=D7 env=&(map=adsr 0 .06 0 .03)
\`\`\`

The bossa nova clave in one bar of sixteenths, x..x..x...x..x..: as dense as Bossa nova's drum bar, written in the same sixteenths, so at Bossa nova's energy; off the beat as the two-bar one. Which of the two fits a composition is the fit's to choose (#144), not the association's.

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). Its names (\`&clave\`, \`&percussion\`, \`&claves\`) are none of the drum bars', so it layers on any of them in one text.
`};function dh(){let e=lh(uh);if(`problems`in e)throw Error(`The seed library doesn't read: ${e.problems.join(`; `)}`);return e.files}let fh=dh(),ph=e=>fh.filter(t=>t.path.startsWith(`${e}/`)).map(e=>e.fragment),mh=ph(`instruments`);Object.fromEntries(Rp.map(e=>[e.note,e.name]));let hh=Object.fromEntries(mh.find(e=>e.id===`gm kit`).text.split(`
`).flatMap(e=>{let t=/^&(\w+) (.*)$/.exec(e);return t?[[t[1],t[2]]]:[]}));[...Object.keys(hh)];let gh=/* @__PURE__ */ `oscillator.tone.rests.semitones.twovoices.steps.clock.voice.effects.transpose.twinkle.chords.rhythm.drums.swing.canon.mirrors.variations.chance.fifths.arrangement.stereo.waveforms.moving.grids.metronome.fm.musicbox.automaton.kalimba.sympathy.harmonograph.echotape.worn.dtmf.daytime.gate.play-in.midi-out.lullaby.jazz.five.waltz.sailor.royal.pertonos.ricercar.korobeiniki.coltrane.bossa.bell.prelude.pachelbel.pop.idm.alpha.studie.just.bwv847.acid.zell.cellscape.cellscape2.baustelle.focus.hypercell.onemore.brothers.ghosts.tines.phase.in-c.tape.soundtape.testtones.forks.resonanz.fiveto12`.split(`.`),_h={acid:`---
title: "Acid-Cell: everybody needs a 303"
tags: [genre:electronic, chromatic, sound]
description: "Acid-Cell — everybody needs a 303: a saw through a resonant filter that opens on every note."
---

\`\`\`cells
# Acid-Cell — everybody needs a 303. An original acid line: a saw through a resonant
# low-pass whose envelope opens on every note — further on the accents — while a hand
# turns the cutoff and the resonance, slowly (all of it lpf=… * &cells). Echo: a dotted eighth.
&filterNote label="Every note opens the filter (&fenv); accents open it further, and play louder (&accent)." about=(&fenv &accent)
&knobsNote label="Two knobs turn slowly, the cutoff and the resonance: listen to the squeal as they meet." about=(&knob &res)
&bar scan(1 1 1 1) step=free(126bpm, 100..150)
&minor scan(2 1 2 2 1 2 2)                                   # A minor (the voices sit on A)

&riff 0 0 7 0 ~ 0 4 0 6 ~ 0 7 0 2 3 4                      # a bar of sixteenths
&turn 0 0 7 0 ~ 7 6 4 2 ~ 0 4 6 7 9 7                      # … and its answer
&line over=&minor step=16n &riff &turn &riff &riff^$-2      # the last bar a whole tone down
&accent map=amp step=16n 1 .4 .8 .4 0 .4 1 .4 .6 0 .4 1 .4 .5 .4 .4
&fenv map=adsr .003 .18 .1 .06 label="filter envelope"
&knob map=lin loop=&bar/16 .2 1 .35 .2 label="cutoff knob"
&res map=lin loop=&bar/32 6 19 6 label="resonance knob"

&b1 [&bd,&hh:0:.3] &hh:0:.2 [&hh:0:.5,&oh:0:.5] &hh:0:.2                    # a beat: the kick, the closed hat's accents, the open hat on the and
&b2 [&bd,&cp,&hh:0:.3] &hh:0:.2 [&hh:0:.5,&oh:0:.5] &hh:0:.2                # … with the clap
&beat step=16n &b1 &b2 &b1 &b2

&tb303 s=saw loop=A2 lpf=110..3800 * &fenv * &accent * &knob lpq=&res delaytime=&bar*4/3 delay=.22 delayfeedback=.35 env=&(map=adsr .002 .15 .6 .05)
&bd gain=.8 oneshot s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0) env=&(map=adsr 0 .3 0 .05)
&cp gain=.35 oneshot s=white hpf=1500 env=&(map=adsr 0 .12 0 .06) room=.2
&hh gain=.25 s=white hpf=8000 env=&(map=adsr 0 .03 0 .02)
&oh gain=.2 oneshot s=white hpf=7000 env=&(map=adsr 0 .2 0 .1)

&mix postgain=1.06 map=sample [&line * &accent * &tb303 * .45, &beat]
\`\`\`
`,alpha:`---
title: "Alpha: Carlos' scale without octaves"
tags: [genre:experimental, artist:Wendy Carlos, microtonal, tuning]
description: "Wendy Carlos' alpha scale: nine equal steps to a pure fifth, and no octave at all."
---

\`\`\`cells
# Wendy Carlos' alpha scale: equal steps of about 78 cents, nine to a pure fifth —
# and no octave at all. Five steps make a near-pure major third (5:4), four a minor
# third (6:5), so triads ring true: 0 5 9 is major, 0 4 9 minor.
&bar scan(1 1 1 1) step=free(84bpm, 50..120)
&alpha cycle=9 map=ed(3/2)                          # nine equal steps to 3:2

&chords over=&alpha step=1m [0,5,9] [4,8,13] [9,14,18] [5,9,14]       # major · minor · major · minor
&tune over=&alpha step=8n 9 14 18 14 13 8 4 8 18 23 27 23 22 18 14 9 14 18 23 18 14 13 9@2 5 9 14 18 14 9@3

&brass s=saw loop=C4 lpf=2200 lpq=3 env=&(map=adsr .04 .2 .7 .3) pitch=&(map=lin loop=5 0 .08 0 -.08 0)
&pad s=tri loop=C3 env=&(map=adsr .4 .3 .8 .8)

&mix postgain=2.37 map=sample [&tune * &brass * .35, &chords * &pad * .3]
\`\`\`
`,arrangement:`---
title: "Arrangement: parts and a song"
tags: [tutorial, arrangement]
tier: 5
description: "Three parts, and a song that picks which of them play: an intro, a verse, a chorus, an end."
---

\`\`\`cells
&partsNote label="A part is a section stepped by the bar: &sections names them (step=4n), and what a section steps plays while &song picks it, four bars a step, from its top: a number picks one section, a chord several." about=(&sections &song)
&lapsNote label="laps=1: the song plays once, then ends. off switches a cell off, and everything that plays it: take it from &click to hear the beat." about=&song
&bar scan(1 1 1 1) step=free(moderato)
&major scale(major)

&chords over=&major step=&keysBar/4 [0,2,4] [3,5,7] [4,6,8] [0,2,4]
&tune over=&major step=&tuneBar*2 4 4 5 7 7 5 4 2 0 0 2 4 4@2 2@2
&kick step=&drumBar &bd ~ &bd ~
&click off step=&drumBar 12 0!3                       # a click on the beat, switched off

&keys s=tri loop=C4 env=&(map=adsr .01 .5 .3 .3)
&lead s=square loop=C5 lpf=2500 env=&(map=adsr .01 .2 .5 .2)
&rim s=sine loop=E5 env=&(map=adsr 0 .03 0 .02)
&bd gain=.6 s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .04 0 0) env=&(map=adsr 0 .3 0 .05)

&sections step=4n &keysBar &tuneBar &drumBar
&song over=&sections step=1m/4 laps=1 label="intro · verse · chorus · end" 0 [0,2] [0,1,2] 0
&out map=sample postgain=2 [&chords * &keys * .15, &tune * &lead * .2,
                         &kick, &click * &rim * .1]   # a long line can go on: it ends with a comma
\`\`\`
`,automaton:`---
title: Automaton
tags: [tutorial, genre:experimental, rhythm, sound, stereo]
tier: 7
description: "A mechanical band on belts, all turned by one drum: bells, a drummer and a woodblock, each on a belt of different give."
---

\`\`\`cells
&drumMotorNote label="The drum (the meter, a motor) turns them all." about=&bar
&bellsNote label="The bells on a taut belt, exact." about=&bells
&drummerNote label="The drummer's arm on a slack belt, lagging and swinging." about=&drums
&woodNote label="The woodblock's arm slips when the drum jerks, a step behind for good." about=&wood
&shoveNote label="Grab the big drum and shove it: watch the belts stretch, hear the arms drag and the woodblock slip." about=&bar
# Automaton — one motor, belts of different give. belt= stiffness (taut 3000, slack 25),
# mass= the arm, damping= how soon it stops swinging (3 is what it is anyway: a little bounce), slip= its grip: past it the belt slips and the arm falls behind for good.
&bar scan(1 1 1 1) step=104bpm motor=4 mass=1 friction=.2
&major scan(2 2 1 2 2 2 1) label="{mode} on {tonic}"
&bells over=&major step=8n belt=3000 label="the bells: a taut belt" 0 4 7 4 9 7 4 2 0 4 7 9 11 9 7 4
&drums step=16n belt=25 mass=1 damping=3 label="the drummer" &bd ~ &sd &bd ~ &bd &sd ~ &bd ~ &sd &bd ~ &bd &sd &sd
&wood step=8n belt=400 mass=1.5 slip=.4 label="the woodblock: it slips" 0 0 ~ 0 0 ~ 0 ~

&bell pan=.36 s=sine loop=C5 fm=&bm index=.3..2 * &(map=adsr .001 .1 .1 .1) room=.3 env=&(map=adsr .002 .9 0 .6)
&bm s=sine ratio=3.5
&bd s=sine loop=A1 pitch=0..20 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .25 0 .05)
&sd s=white hpf=1200 env=&(map=adsr 0 .08 0 .04)
&blk pan=.64 s=square loop=C6 hpf=900 lpf=3000 env=&(map=adsr 0 .03 0 .02)

&out postgain=.944 map=sample [&bells * &bell * .14, &drums * .6, &wood * &blk * .07]
\`\`\`
`,baustelle:`---
title: Baustelle
tags: [genre:experimental, genre:electronic, genre:industrial, artist:Neubauten, microtonal, arrangement]
description: "An original in the manner of Einstürzende Neubauten: struck metal and a scream; it builds, breaks, comes back harder, and collapses."
---

\`\`\`cells
&metalsNote label="Beams, pipes and plates struck and tuned to their own partials." about=(&beams &pipes &plates)
&springNote label="A giant bass spring." about=(&feder &bassfeder)
&toolsNote label="A grinder and a drill." about=(&grind &drill)
&screamNote label="A scream." about=&schrei
&lowEndNote label="Sub-bass under a gritty riff." about=(&sub &riff)
# Baustelle — a building site, played. Metal is inharmonic: a free steel beam rings at
# 1 : 2.76 : 5.40 : 8.93, so each metal gets a grid of its own partials (map=ratios), and
# a hit is a chord of them. Some hits fall only sometimes (?), some choose ([a|b]):
# the percussionist's hand. Under it: a sub-bass kick, a crushed riff, the Bassfeder.
&bar scan(1 1 1 1) step=free(118bpm, 90..150)

# ---- the metals: their partials (the last number is just where each grid repeats)
&beam tags="metal" map=ratios 1 2.756 5.404 8.933 16 label="beam: 1 : 2.76 : 5.40 : 8.93"
&pipe tags="metal" map=ratios 1 2.42 4.37 6.71 8 label="pipe"
&plate tags="metal" map=ratios 1 1.59 2.14 2.30 2.65 2.92 4 label="plate"
&beams tags="metal" over=&beam step=&metalBar*4 [0,1,2,3] ~!2 [0,1,2,3]? ~!2 [0,1,2,3] ~!3 [0,1,2,3] ~ [0,2]? ~ [0,1,2,3] [1,3]?.7
&pipes tags="metal" over=&pipe step=&metalBar*4 ~ ~ [0,1,2,3] ~ [1|2]? [0,1,2,3] ~ [0,1,2,3]? ~ ~ [0,1,2,3] ~ ~ [1,2,3]? [0,1,2,3] ~
&plates tags="metal" over=&plate step=&plateBar ~ [0,1,2,3,4,5] ~ [0,1,2,3,4,5]

# ---- the low end: a sub-bass kick, four on the floor; a crushed riff on E; the Bassfeder
&kick tags="low" step=&subBar 0!4
&riff tags="low" step=&riffBar*4 0 0 1 0 ~ 0 7 0 6 ~ 0 1 0 ~ 3 -2
&accent tags="low" map=amp step=16n 1 .5 .8 .5 0 .6 1 .5 .9 0 .6 .8 .5 0 1 .7
&feder tags="low" step=&federBar*2 0 ~ ~ 0? 0 ~ [0|-5] ~

# ---- tools: the grinder (noise that swells, now it can), the drill (a whine that wobbles)
&grind tags="tools" step=&grindBar/2 0 0?.4
&swell tags="tools" map=amp step=8n .2 .5 1 .7
&drill tags="tools" step=&drillBar 0? ~!3 0?.7 ~ 7? ~
&edge tags="tools" map=lin loop=.37 .2 1 .4
# ---- the scream: a saw sliding, and breath, through filters moving between vowels
&schrei tags="scream" step=&schreiBar/2 0 ~ 0?.5 ~
&slide tags="scream" map=lin loop=&bar/2 0 7 12 9 -2 0
&vowel tags="scream" map=lin loop=.83 .3 1 .55 .8 .3

# ---- the last crash
&fall tags="metal" over=&beam step=&einsturzBar/4 [0,1,2,3]
&crashPlate tags="metal" over=&plate step=&einsturzBar/4 [0,1,2,3,4,5]
&rubble step=&einsturzBar/4 0

&beamv tags="metal" s=sine loop=110 room=.3 env=&(map=adsr 0 .5 0 .9)
&pipev tags="metal" s=sine loop=233 room=.25 env=&(map=adsr 0 .3 0 .6)
&platev tags="metal" s=sine loop=415 room=.4 distort=.2 env=&(map=adsr 0 .25 0 1.4)
&sub tags="low" s=sine loop=E1 pitch=0..14 * &(map=adsr 0 .07 0 0) distort=.15 env=&(map=adsr .002 .45 .5 .15)
&grit tags="low" s=saw loop=E1 distort=.85 crush=6 lpf=90..2200 * &(map=adsr .003 .18 .15 .08) * &accent lpq=7 env=&(map=adsr .002 .12 .5 .05)
&bassfeder tags="low" s=saw loop=A1 pitch=0..9 * &(map=adsr 0 .09 0 0) distort=.6 lpf=160..1300 * &(map=adsr .002 .3 .1 .3) lpq=9 delaytime=.019 delay=.55 delayfeedback=.84 env=&(map=adsr .002 .6 .2 .5)
&grinder tags="tools" s=white distort=.7 lpf=900..7000 * &edge hpf=500 lpq=3 env=&(map=adsr .05 .4 .8 .3)
&drillv tags="tools" s=saw loop=E4 distort=1 crush=8 lpf=4000 env=&(map=adsr .02 .1 .9 .1) pitch=&(map=lin loop=23 0 .7 0 -.7 0)
&voice tags="scream" s=saw loop=A3 distort=1.2 crush=7 lpf=500..2600 * &vowel lpq=11 hpf=300 env=&(map=adsr .08 .3 .9 .6)
&breath tags="scream" s=white distort=.9 lpf=600..3000 * &vowel lpq=8 hpf=900 env=&(map=adsr .05 .3 .8 .5)
&crash s=white distort=.5 lpf=9000 room=.6 env=&(map=adsr 0 3 0 4)

# ---- the parts, and the site's day: four bars a step; laps=1: it ends
&metalPart [&beams * &beamv * .09, &pipes * &pipev * .07]
&einsturz [&fall * &beamv * .14, &crashPlate * &platev * .08, &rubble * &crash * .25, &rubble * &sub * .6]
&teile step=4n &metalBar &plateBar &subBar &riffBar &federBar &grindBar &drillBar &schreiBar &einsturzBar
&tag over=&teile step=1m/4 laps=1 label="metal · grinder · spring · groove · drill · scream · break · spring · groove · all · all · collapse · Einsturz" [0] [
     0,5] [0,2,4] [0,1,2,3,4] [0,1,2,3,4,6] [0,1,2,3,4,5,7] [4,5,7] [4] [0,1,2,3,4,5] [0,1,2,3,4,5,6,7]!2 [5,7] 8

&out postgain=.282 map=sample [&metalPart, &plates * &platev * .05, &kick * &sub * .55,
                           &riff * &accent * &grit * .2, &feder * &bassfeder * .3,
                           &grind * &swell * &grinder * .14, &drill * &drillv * .06,
                           (&schrei + &slide) * &voice * .1, &schrei * &breath * .06, &einsturz]
\`\`\`
`,bell:`---
title: "Bell and scale: 12/8, one scan for both"
tags: [genre:world, diatonic, rhythm]
description: "The bell, x.x.xx.x.x.x, has the major scale's intervals: 2 2 1 2 2 2 1."
---

\`\`\`cells
# The West African standard bell pattern — seven strokes over twelve pulses,
# x.x.xx.x.x.x — has the same intervals as the major scale: 2 2 1 2 2 2 1.
# So one cell is both: the melody steps with the bell, and reads it as its scale.
&oneScanNote label="One scan is both — the melody steps with it, and reads it as its scale." about=(&bell &song)
&beat scan(1 1 1 1) step=free(100bpm, 70..140)       # four dotted-quarter beats: 12/8
&bell label="{mode} · x.x.xx.x.x.x" scan(2 2 1 2 2 2 1) step=pulse*7/4             # seven strokes a bar, over the twelve pulses

&strokes step=&bell:pulse &gankogui &gankogui:0:.5 &gankogui:0:.7 &gankogui:0:.5 &gankogui:0:.6 &gankogui:0:.5 &gankogui:0:.7 # the bell, as a rhythm
&song over=&bell step=&bell:pulse 4 4 5 4 2 1 0 2 2 1 2 0 ~ ~ # … and as a scale: C major
&drums step=8t [&dundun,&shekere:0:.5] &shekere:0:.2 &shekere:0:.3 [&dundun:0:.5,&shekere:0:.5] &shekere:0:.2 &shekere:0:.3 [
       &dundun:0:.8,&shekere:0:.5] &shekere:0:.2 &shekere:0:.3 [&dundun:0:.5,&shekere:0:.5] &shekere:0:.2 &shekere:0:.3   # the twelve pulses, the low drum on the beats

&gankogui gain=.25 s=square loop=C6 lpf=4000 env=&(map=adsr 0 .08 0 .05)
&voice s=tri loop=C4 env=&(map=adsr .02 .2 .6 .2)
&dundun gain=.7 oneshot s=sine loop=C2 pitch=0..12 * &(map=adsr 0 .04 0 0) env=&(map=adsr 0 .25 0 .1)
&shekere gain=.15 s=white hpf=6000 env=&(map=adsr 0 .03 0 .02)

&mix postgain=1.26 map=sample [&strokes, &song * &voice * .45, &drums]
\`\`\`
`,bossa:`---
title: "Bossa nova: the clave"
tags: [genre:world, genre:jazz, tonal, rhythm]
description: A bossa nova whose guitar strums on the clave's five strokes, over Dm9 and G13.
---

\`\`\`cells
# Bossa nova. The clave is a meter: five strokes over a bar of sixteenths,
# scan(3 3 4 3 3) — x..x..x...x..x.. — and the guitar strums on its strokes.
&bar scan(1 1 1 1) step=free(128bpm, 90..170)
&clave scan(3 3 4 3 3) step=pulse*5/4                 # five strokes a bar
&dorian scan(2 1 2 2 2 1 2)                            # D Dorian (the voices sit on D)

&rim step=&clave:pulse &click &click:0:.8 &click:0:.9 &click &click:0:.8
&strum step=&clave:pulse [3,7,10,14]!3 [3,9,14]!2                          # Dm9 · G13, on the clave
&bassline step=4n 0 7 -7 0                             # root and fifth: D A under Dm9, G D under G13
&shaker step=16n &shh:0:.5 &shh:0:.2 &shh:0:.3 &shh:0:.2
&melody over=&dorian step=8n 4@3 3 2@2 ~@2 0 1 2@3 ~@3

&guitar s=tri loop=D3 lpf=2200 env=&(map=adsr .003 .5 .15 .3)
&bass s=sine loop=D2 env=&(map=adsr .01 .4 .5 .2)
&flute glide=.08 s=sine loop=D4 env=&(map=adsr .06 .2 .7 .4) pitch=&(map=lin loop=5 0 .1 0 -.1 0)
&click gain=.3 s=white hpf=2500 env=&(map=adsr 0 .03 0 .02)
&shh gain=.12 s=white hpf=6000 env=&(map=adsr 0 .03 0 .02)

&mix postgain=1.58 map=sample [&strum * &guitar * .25, &bassline * &bass * .7, &melody * &flute * .4,
                                  &rim, &shaker]
\`\`\`
`,brothers:`---
title: Cellular Brothers
tags: [genre:electronic, genre:dance, artist:Chemical Brothers, modal, arrangement]
description: "Big beat, an original in the manner of the Chemical Brothers: gritty and crushed, about two and a half minutes, then it ends."
---

\`\`\`cells
&breakNote label="A gritty, crushed breakbeat." about=&break
&acidNote label="An acid line." about=&acid
&riffNote label="A distorted stab riff in E minor." about=(&riff &stab)
&sirenNote label="A siren." about=&siren
&buildsNote label="Builds with snare rolls and a riser." about=(&roll &riser)
# Cellular Brothers — the break is a bar of voices in sixteenths; the acid line opens its filter
# on every note, further on the accents. Everything in semitones from E.
&bar scan(1 1 1 1) step=free(112bpm, 96..132)
&b1 tags="break" &bd ~ &hh ~ &sd ~ &hh &bd ~ &bd &sd ~ &hh &bd &sd &hh
&b2 tags="break" &bd ~ &hh &bd &sd ~ &hh ~ &bd &bd ~ &hh &sd ~ &sd*2 &hh
&break tags="break" step=&breakBar*4 label="the break" &b1 &b2
&acid tags="acid" step=&acidBar*4 label="the acid" 0 0 12 0 3 0 ~ 0 7 0 10 ~ 0 12 3 5
&accent tags="acid" map=amp step=16n 1 .5 .9 .5 .8 .5 0 .5 1 .5 .8 0 .5 1 .7 .9
&riff tags="riff" step=&riffBar*2 label="the riff" [0,7] ~ [0,7] [3,10] ~ [5,12] ~ [3,10]
&siren tags="siren" step=&sirenBar/8 0
&wail tags="siren" map=lin loop=&bar 0 12 0
&sub tags="sub" step=&subBar 0 ~ 0 [-2|0]
&roll tags="build" step=&buildBar 0!4 0*2!4 0*4!4 0*8!4
&lift tags="build" step=&buildBar/32 0
&up tags="build" map=lin loop=&bar/32 0 .3 1 0

&bd tags="break" oneshot s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .06 0 0) distort=.5 env=&(map=adsr 0 .3 0 .05)
&sd tags="break" s=white hpf=900 distort=.6 crush=7 env=&(map=adsr 0 .12 0 .05)
&hh tags="break" s=white hpf=7000 crush=6 env=&(map=adsr 0 .03 0 .02)
&tb tags="acid" s=saw loop=E2 lpf=120..3600 * &(map=adsr .003 .17 .1 .06) * &accent lpq=14 distort=.3 env=&(map=adsr .002 .14 .6 .05)
&stab tags="riff" s=square loop=E3 distort=.9 lpf=2600 room=.2 env=&(map=adsr .003 .2 .3 .1)
&siren1 tags="siren" s=sine loop=E5 delaytime=&bar*4/3 delay=.3 delayfeedback=.35 env=&(map=adsr .3 .5 .9 .6)
&subv tags="sub" s=sine loop=E1 env=&(map=adsr .005 .4 .6 .1)
&sn tags="build" s=white hpf=1000 distort=.4 env=&(map=adsr 0 .06 0 .03)
&riser tags="build" s=white lpf=400..8000 * &up lpq=5 crush=8 env=&(map=adsr 1 .5 .9 .5)

&sections step=4n &acidBar &riffBar &breakBar &sirenBar &buildBar &subBar
&song over=&sections step=1m/8 laps=1 label="break · bass · acid · build · riff · all · siren · build · all" [2] [2,5] [0,2,5] 4 [0,1,2,5] [0,1,2,3,5] [0,3] 4 [0,1,2,3,5]

&out postgain=.708 map=sample [&break * .7,
                          &acid * &accent * &tb * .3,
                          &riff * &stab * .1,
                          (&siren + &wail) * &siren1 * .08,
                          &roll * &sn * .3, &lift * &riser * .14,
                          &sub * &subv * .5]
&tracker scope=waterfall label="the break, as a tracker" &break
\`\`\`
`,bwv847:`---
title: "Bach, Prelude and Fugue in C minor: for Wendy"
tags: [genre:classical, genre:electronic, artist:Bach, artist:Wendy Carlos, tonal, counterpoint, stereo]
description: "Prelude and Fugue in C minor, BWV 847 — in full: a prelude of one figure, then a fugue in three voices."
---

\`\`\`cells
# J. S. Bach, Prelude and Fugue in C minor, BWV 847 (The Well-Tempered Clavier I),
# in full — on an old-school synthesizer, after Wendy Carlos' Switched-On Bach.
# The notes: the CCARH Humdrum encoding (Bach-Gesellschaft edition, vol. xiv), as semitones from C4, a sixteenth a
# step; tools/bwv847.reference.json holds them, and a test plays this text against them, note for note.
# Written by hand as its structure (#177): the form a selector over its voices, each entry a copy of the subject.
&preludeFigureNote label="The prelude: one figure, twice a bar in both hands, through 24 bars of changing chords." about=(&rhFigure &lhFigure)
&preludeBreaksNote label="Then it breaks free — *Presto*, *Adagio*, *Allegro*." about=(&rhPresto &rhAdagio &rhAllegro)
&formNote label="The form: a voice plays while the selector has it on — the prelude's two hands, then the fugue's three voices, one by one." about=&form
&fugueEntriesNote label="The fugue, in three voices: the subject enters in the alto, is answered by the soprano, then the bass — and returns, in every voice, through the keys." about=(&alto &soprano &bass)

# one tempo map for both: a sixteenth a step, each section at its pace; laps=1 — the piece ends with the fugue
&tempo scan(1!432 .72!96 2!17 .86!64 1.6!15 1.5!496) pulse=16n step=free(89bpm, 60..120) laps=1 label="tempo map: ♩=108 · *Presto* · *Adagio* · *Allegro* · fugue ♩=72"

# ---- the prelude
&figure tags="figuration" 0 1 2 1 3 1 2 1                          # the figure: top, middle, low, middle, bottom, middle, low, middle
&rhShapes tags="figuration" step=pulse/16 show=notes label="right hand: four notes a bar" [12,3,2,0] [8,5,4,0] [11,5,3,2] [12,7,5,3] [15,8,7,3] [14,6,4,2] [
          14,7,6,2] [12,4,2,0] [12,5,4,0] [10,5,3,2] [10,7,5,3] [8,7,5,3] [8,2,0,-2] [7,-2,-4,3] [5,0,-2,-3] [5,2,0,-1] [5,2,0,-1] [3,0,-1,-5] [-7,3,2,5] [
          -6,0,-1,3] [3,0,-1,-5] [6,0,-1,-3] [7,0,-1,2] [8,0,-1,2]
&lhShapes tags="figuration" step=pulse/16 show=notes label="left hand: four notes a bar" [-12,-5,-7,-9] [-12,-4,-5,-7] [-12,-4,-5,-7] [-12,-9,-10,-5] [
          -12,0,-2,-4] [-12,-3,-5,-6] [-14,-2,-3,-5] [-14,-5,-7,-8] [-16,-4,-5,-7] [-16,-10,-12,-7] [-17,-9,-10,-5] [-12,-9,-10,-4] [-10,-7,-9,-4] [
          -9,-5,-7,-4] [-9,-3,-5,-7] [-10,-7,-9,-4] [-12,-7,-8,-4] [-12,-9,-10,-7] [-16,-12,-13,-10] [-15,-9,-10,-12] [-17,-9,-10,-7] [-17,-9,-10,-12] [
          -17,-9,-10,-7] [-17,-9,-10,-7]
&rhFigure tags="right hand" over=&rhShapes label="bars 1–24, right hand: the figure, twice a bar" &figure!48
&lhFigure tags="left hand" over=&lhShapes label="bars 1–24, left hand" &figure!48
# the *Presto*'s runs and the broken chords of bars 25–27, each played twice
&presto1 label="the *Presto*: a run of the figure down, the left hand following a bar later, an octave down" 14 12 14 15 12 11 12 9 12 11 12 14 11 9 11 7 11 9 11 12
&presto2 label="… and again from a sixth higher" 19 17 19 20 17 15 17 14 17 15 17 19 15 14 15 12 15 14 15 17 14 12 14
&arpeggio label="bars 25–27: the left hand alone, a broken chord, a fifth higher in the third bar" -7 -4 -7 -8 -7 -1 -7 2 -1 -4 -7 -8 -7
&rhPresto tags="right hand" label="right hand · *Presto*" ~ &presto1 9 7 9 6 9 7 9 11 7 6 7 2 &presto2 11 14 12 14 15 12 11 12 7 12 11 12 8 17 15 17 7 15 14 15 5 14 12 14 3 12 11 12 8 5 3 5 7 3 2 3 5 2 0 2
&rhAdagio tags="right hand" label="right hand · *Adagio*" -8 1 -2 -5 0 -4 -7 -4 -5 -2 -5 -8 -4 -7 -10 -7 ~
&rhAllegro tags="right hand" label="right hand · *Allegro*, to the end" ~ -24@15 ~@24 -24@24
&lhBars tags="left hand" label="left hand · bars 25–27" -17 -13 -10 &arpeggio -17 -12 -9 -5 0 -5 -6 -5 3 0 7 3 0 -4 -5 -4 -17 -15 -6 &arpeggio^$7
&lhPresto tags="left hand" label="left hand · *Presto*" -17@17 &presto1^$-12 -4 -5 -4 -7 -3 -5 -3 -1 -5 -7 -5 -9 &presto2^$-12 3 0 -1 0 2 -1 -3 -1 0 3 2 3 -7 2 0 2 -9 0 -1 0 -10 -1 -3 -1
&lhAdagio tags="left hand" label="left hand · *Adagio*" -12@4 ~@4 -12@4 ~@5
&rh tags="right hand" step=&rhTime label="prelude · right hand" &rhFigure &rhPresto &rhAdagio &rhAllegro
&lh tags="left hand" step=&lhTime label="prelude · left hand" &lhFigure &lhBars &lhPresto &lhAdagio

# ---- the fugue: its subject and countersubject (as the alto first has them), and each entry a copy of one of them,
#      transposed (^$n: semitones) and bent where Bach bends it (base=: = keeps a step, a value changes it);
#      exact entries in place (&answer^$-12: the answer, an octave down, in the alto at bar 15)
&subject tags="subject" show=notes label="the subject" 12 11 12@2 7@2 8@2 12 11 12@2 14@2 7@2 12 11 12@2 14@2 5 7 8@4 7 5 3
&counter tags="subject" show=notes label="the countersubject" 11 9 7 5 3 2 0@2 15@2 14@2 12@2 10@2 9@2 10@2 12@2 6@2 7@2
&answer base=&subject^$7 tags="soprano" label="bar 3 · **answer**\\nsoprano, a fifth up: its fourth note C, not D (a tonal answer), its last held" =!3 12@2 =!15 10@2
&counter2 base=&counter^$5 tags="soprano" label="bar 7 · **countersubject**\\nsoprano, a fourth up, its first note a semitone lower" 15
&inEflat base=&subject^$3 tags="soprano" label="bar 11 · **subject**\\nsoprano, in E♭ major (three notes bent to the key)" =!4 12@2 =!11 12@4 =!2 7
&returns base=&subject tags="soprano" label="bar 20 · **subject**\\nsoprano, as first heard, its last held" =!19 3@2
&inBass base=&subject^$-24 tags="bass" label="bar 26 · **subject**\\nbass, two octaves down, its last held" =!19 =@4
&last base=&subject tags="soprano" label="bar 29 · **subject**\\nsoprano, the last time: its ninth note a chord, its last E♮ (a Picardy third), held to the end" =!8 [11,14]@2 =!10 4@8
#      the episodes: what the free voices play more than once, in turn and transposed
&scales tags="episode" label="a run up, three times, each from a step higher" 2 4 6 7 9 10@3 4 5 7 9 10 12@3 6 7 9 10@2
&head tags="episode" label="the subject's head, then a step lower" 12 11 12@2 7@2 8@4 ~@2 9@2 10@2 10 9 10@2 5@2 7@4
&climb tags="episode" label="the head's turn, climbing a step at a time" 3 2 3@2 -5@2 -4@2 5 3 5@2 -3@2 -2@2 7 5 7@2 -1@2
&walk tags="episode" label="the bass walking down" -10 -9 -10 &down -2 -4 &down^$7 -14 -12 -10 &down -21 -4
&fall tags="episode" label="the bass falling by steps" -12@2 -14@2 -15@2 ~@2 -9@2 -10@2 -12@2 -10@2 -12 -14 -12@2 -10@2
&turn tags="episode" label="a line falling, then turning" 17@2 15@2 14@2 ~@2 8@2 7@2 5@2 7@2 5 3 5@2 2@2
&sigh tags="episode" label="a sigh, three times a step higher, twice" 0 -2 0@2 ~@4
&down tags="episode" label="five notes down the scale" -12 -14 -16 -17 -19
&soprano1 tags="soprano" label="soprano · free, bars 5–7" &climb^$12 12@2 14 15 17@6
&soprano2 tags="soprano" label="soprano · free, bars 8–11" 14@2 11@2 12@2 &head^$7 ~@2 14@2 15@2
&soprano3 tags="soprano" label="soprano · free, bars 13–15" 3 5 7 8 10 12 14 15 14 12 14 15 17 19 21 22 5 7 8 10 12 14 16 17 15 14 15 17 19 21 23 24@2
&soprano4 tags="soprano" label="soprano · free, bars 15–20" 23 21 19 17 15 14 12@2 15@2 14@2 12@2 10@2 9@2 10@2 12@2 6@2 7@2 9@2 6@2 7@2 &sigh^$14 &sigh^$16 &sigh^$18 &sigh^$7 &sigh^$9 &sigh^$11
&soprano5 tags="soprano" label="soprano · free, bars 22–26" &head ~@2 7@4 8 10 12 11 12 8 5@10 14 12 14@2 5@2 3@2 15 14 15@2 7@2 5@2 17 15 17@2 8@2 7 17
&soprano6 tags="soprano" label="soprano · free, bars 26–29" 15 14 12 11 9 7 12@2 &turn 8@2 7@2 ~@2 9@2 11@2 12@2 5 3 2 0 0@2
&alto2 tags="alto" label="alto · free, bars 4–7" 9@2 6@2 7@4 ~ 0 2 3 5 7 8@3 2 3 5 7 9 10@3 3 5 7 8 7 5 3 2@2 12 11 12@4
&alto3 tags="alto" label="alto · free, bars 7–11" ~@6 &turn 7@4 ~@2 11@2 12@2 &head
&alto4 tags="alto" label="alto · free, bars 11–15" ~@2 7@2 8@2!2 7@2 5@2 ~@2 -4@2 -2@2 0@2 ~@2 -4 -5 -4@2 -7@2 -2@2 0@2 -2@2 -4@2 -2@2 -5@2 -7@2 -9@2 -7@2 1@2 0@2 -2@2 0@2 -4@2 -5@2 -7@2 -5@2
&alto5 tags="alto" label="alto · free, bars 17–20" ~@3 &scales &climb 0 5
&alto6 tags="alto" label="alto · free, bars 21–26" 2@2 -1@2 0@4 ~@2 4@2 5@2 5 4 5@2 0@2 2@4 ~@2 2@2 3@2 3 2 3@2 -2@2 0@10 2 3 5 3 5 2 -1@2 ~@4 -1@2 0@2 ~@4 3@2 2@2 ~@4 5@4
&alto7 tags="alto" label="alto · free, bars 26–29" ~@4 5@2 3@2 8@2 7@2 5@2 3@2 2@2 3@2 5@2 -1@2 0@2 2@2 -1@2!2 0@2 ~@2 0@2 5 2 3 0@3 -1@2 0@4
&alto8 tags="alto" label="alto · free, bars 29–31" ~@2 4@2 5@4 ~@2 [5,8]@2 5@2 3 2 3@2 [5,8]@2 [-1,2]@2 ~@2 [-1,2]@2 ~@2 [-5,0]@8
&bass1 tags="bass" label="bass · free, bars 9–11" 0 -1 -3 &down^$7 &walk
&bass2 tags="bass" label="bass · free, bars 11–15" -5 &down^$5 -16@2 0@2 -2@2 -4@2 -5@2 -7@2 -5@2 -4@2 -10@2 -9@2 -7@2 -10@2 -9@2 -4@2 -5@2 -7@2 -5@2 -9@2 -10@2 -12@2 -10@2 -2@2 -4@2 -5@2 -4@2 -7@2 -9@2 -10@2 -9@2
&bass3 tags="bass" label="bass · free, bars 15–20" ~@8 &fall -17@2 &climb^$-5 -5@4 ~ &scales^$-19
&bass4 tags="bass" label="bass · free, bars 20–26" ~@4 -8@2 -7@2 &fall^$-7 -12 &walk &down^$7 -14 -16 -14 &down -21 -22 &down^$7 -13 -15 -17@4 ~@5 -17 -15 -13 -12 -10 -9 -7 -5 -7 -4 &down^$7 -13@2
&bass5 tags="bass" label="bass · free, bars 28–31" ~@2 -9@2 -10@2 -12@2 -5@2 -17@2 [-24,-12]@40
&soprano tags="soprano" step=&sopranoTime label="fugue · soprano" &answer &soprano1 &counter2 &soprano2 &inEflat &soprano3 &soprano4 &returns &soprano5 &soprano6 &last
&alto tags="alto" step=&altoTime label="fugue · alto" &subject 12 &counter &alto2 &alto3 &alto4 &answer^$-12 &alto5 &counter2^$-12 &alto6 &alto7 &alto8
&bass tags="bass" step=&bassTime label="fugue · bass" &subject^$-12 &bass1 &bass2 &bass3 &bass4 &inBass &bass5

# the synthesizer: a voice for each line, as Carlos gave each its own patch
&saw pan=.2 s=saw loop=C4 lpf=2600 lpq=6 env=&(map=adsr .002 .15 .45 .12)
&pulse pan=.8 loop=C4 lpf=1800 env=&(map=adsr .002 .15 .5 .1) 0 0 0 1
&reed pan=.2 s=square loop=C4 lpf=2000 env=&(map=adsr .01 .2 .6 .15) pitch=&(map=lin loop=5 0 .1 0 -.1 0)
&brass pan=.73 s=saw loop=C4 lpf=1500 lpq=4 env=&(map=adsr .02 .2 .7 .15)
&moog pan=.67 s=saw loop=C4 lpf=700 lpq=10 env=&(map=adsr .005 .25 .5 .1)

# the form: who plays when. Each voice is a section (decision 016) and each step of the selector a section of the
# piece: the figuration, bars 25–27 (the left hand alone), *Presto*, *Adagio*, *Allegro* (the right hand alone), a
# breath, then the fugue's voices entering one by one. restart=resume: a voice switched off waits, and goes on where
# it stopped — no voice counts rests while the others play.
&sections step=pulse &rhTime &lhTime &sopranoTime &altoTime &bassTime
&form over=&sections step=pulse laps=1 restart=resume label="figuration · bars 25–27 · *Presto* · *Adagio* · *Allegro* · a breath · alto · soprano · bass" [0,1]@384 1@48 [0,1]@96 [0,1]@17 0@64 ~@15 ~@2 3@32 [2,3]@64 [2,3,4]@398

&out postgain=3.16 map=sample [&rh * &saw * .3, &lh * &pulse * .3, &soprano * &reed * .25, &alto * &brass * .22, &bass * &moog * .3]
\`\`\`
`,canon:`---
title: "Canon: Frère Jacques"
tags: [tutorial, genre:classical, genre:folk, diatonic, canon, stereo]
tier: 5
description: "Frère Jacques as a round: four voices, each a bar behind the last."
---

\`\`\`cells
# "Are you sleeping, Brother John?" as a round. One theme made of four
# two-bar units; each voice reads it one unit later: &john[<<] is the theme
# shifted back one unit, two bars behind.
&bar scan(1 1 1 1) step=120bpm
&a 0@2 1@2 2@2 0@2                     # are you sleep-ing
&b 2@2 3@2 4@4                         # bro-ther John
&c 4 5 4 3 2@2 0@2                     # morn-ing bells are ring-ing
&d 0@2 -3@2 0@4                        # ding, dang, dong
&john over=scale(major) step=8n &a!2 &b!2 &c!2 &d!2          # C Ionian

&v1 s=tri loop=C5 env=&(map=adsr .005 .3 .5 .2)
&v2 s=square loop=C4 lpf=1800 env=&(map=adsr .005 .3 .4 .1)
&v3 s=saw loop=C4 lpf=1200 env=&(map=adsr .005 .3 .4 .1)
&v4 s=sine loop=C3 env=&(map=adsr .005 .4 .6 .1)

&left  [&john * &v1 * 0.6, &john[<<] * &v2 * 0.4, &john[<<2] * &v3 * 0.1, &john[<<3] * &v4 * 0.8]
&right [&john * &v1 * 0.6, &john[<<] * &v2 * 0.1, &john[<<2] * &v3 * 0.4, &john[<<3] * &v4 * 0.8]
&out postgain=1.33 map=sample &left &right
\`\`\`
`,cellscape:`---
title: Cellscape
tags: [genre:electronic, genre:ambient, modal, canon, arrangement, stereo]
description: A cycle of twelve scenes, each a fifth from the last, and home.
---

\`\`\`cells
&droneNote label="A drone that breathes through its filter." about=(&pad &breath)
&sequenceNote label="A sequenced arpeggio under a slow sweep." about=(&arp &sweep)
&canonNote label="A canon at the octave." about=(&melody &canon)
&bellsNote label="Bells drifting out of tune." about=&bells
&pulseNote label="A pulse." about=&pulse
&glassNote label="A glass shimmer." about=&shimmer
&earsNote label="One score of twelve scenes; each layer has its place in stereo." about=&scenes
# Cellscape — an ambient cycle of twelve, after Bach (the canon, the circle of keys)
# and Kraftwerk (the sequence, the filters). Every layer reads one Lydian scale, and
# the scale's key turns a fifth with each scene: C G D A E B F# C# G# D# A# F, and home.
&bar scan(1 1 1 1) step=free(72bpm, 50..96)
&key step=1m/8 stride=7 label="**{tonic}**, a fifth each scene"
&lydian over=&key scan(2 2 2 1 2 2 1) label="{mode} on {tonic}"

# slow hands on the filters
&breath tags="drone" map=lin loop=&bar/24 .1 1 .3 .1
&sweep tags="sequence" map=lin loop=&bar/16 .1 .9 .2

# the layers
&pad tags="drone" over=&lydian step=&droneBar/8 label="drone: an open ninth" [0,4,6,9]
&arp tags="sequence" over=&lydian step=&sequenceBar*4 label="the sequence" 0 4 6 9 7 4 2 4
&m1 tags="canon" 0@2 2@2 4@3 6
&m2 tags="canon" 7@2 4@2 6@3 4                           # against &m1: octaves and thirds only (they stay consonant turned upside down)
&melody tags="canon" over=&lydian step=&leaderBar label="canon: the leader" &m1 &m2
&canon tags="canon" over=&lydian step=&followerBar label="canon: the follower, an octave down, two bars behind" &melody[<<]^$-12
&bells tags="bells" over=&lydian step=&chimesBar label="bells" ~@3 11 ~@4 9 ~@3 13 ~@5 11 ~@4 6 ~@6 ~@2
&pulse tags="pulse" over=&lydian step=&pulsesBar*2 label="pulse" 0 ~ 0 0 ~ 0 0 ~
&shimmer tags="glass" over=&lydian step=&shineBar/16 label="glass" [11,13]

&padv tags="drone" s=saw loop=C3 lpf=280..2400 * &breath lpq=3 room=.45 env=&(map=adsr 2 1 .8 3) pitch=&(map=lin loop=.13 0 .08 0 -.08 0)
&arpv tags="sequence" pan=.18 s=square loop=C4 lpf=240..3400 * &sweep lpq=7 delaytime=&bar*4/3 delay=.35 delayfeedback=.45 env=&(map=adsr .002 .12 .2 .08)
&voiceA tags="canon" pan=.18 s=tri loop=C5 lpf=2600 room=.35 env=&(map=adsr .05 .3 .7 .6)
&voiceB tags="canon" pan=.82 s=saw loop=C5 lpf=1500 room=.4 env=&(map=adsr .08 .3 .7 .8)
&bell tags="bells" pan=.83 s=sine loop=C5 room=.6 delaytime=&bar*2/3 delay=.4 delayfeedback=.5 env=&(map=adsr .005 1.2 0 2.5) pitch=&(map=lin loop=.07 0 .3 0 -.3 0)
&bass tags="pulse" s=tri loop=C2 lpf=400..1400 * &breath env=&(map=adsr .005 .2 .4 .1)
&glass tags="glass" pan=.21 s=sine loop=C5 room=.7 env=&(map=adsr 3 1 .7 4) pitch=&(map=lin loop=.11 0 .25 0 -.25 0)

# the score: which layers play in each of the twelve scenes (0 drone 1 sequence 2 leader
# 3 follower 4 bells 5 pulse 6 glass), a barrel turning a scene each 32 bars
&layers step=4n &droneBar &sequenceBar &leaderBar &followerBar &chimesBar &pulsesBar &shineBar
&scenes over=&layers step=1m/8 label="the scenes" [0] [0,4] [0,1,4] [0,1,2] [0,1,2,3] [0,1,2,3,5] [0,2,3,4,5,6] [0,1,2,3,4,5,6] [0,3,4,6] [0,1,5,6] [0,4,6] [0,6]

&out postgain=2.51 map=sample [&pad * &padv * .14,
                         &arp * &arpv * .14,
                         &melody * &voiceA * .2,
                         &canon * &voiceB * .2,
                         &bells * &bell * .09,
                         &pulse * &bass * .25,
                         &shimmer * &glass * .07]
\`\`\`
`,cellscape2:`---
title: Cellscape II feat. Stockhausen
tags: [genre:experimental, genre:electronic, genre:ambient, artist:Stockhausen, microtonal, stereo]
description: "No octaves, no beat, no instruments: sines and noise on Stockhausen's 25 steps to 5:1."
---

\`\`\`cells
&ownTimeNote label="Every layer keeps its own time and a prime number of steps." about=(&constellations &glints &ripples)
&chanceNote label="Chance thins and chooses, a little differently every time round, the same every time you play it." about=(&constellations &glints &ripples)
&glintSliderNote label="The glints' chance is a slider." about=&glints
# Cellscape II, after Stockhausen's Studie II: the scale is 25 equal steps to 5:1 from
# 100 Hz, and never meets an octave. Nothing keeps a beat: each layer has a clock of its
# own (step= in steps a second) and a prime number of steps — 11, 7, 13 — and the slow
# movements are primes in seconds — 17, 19, 23, 29. They meet again only after ages.
&steps cycle=25 map=ed(5) label="25 steps to 5:1, no octave"

# mixtures, Stockhausen's sound: five sines a few steps apart, held long — some, by chance
&constellations over=&steps step=0.11 label="constellations: 11 mixtures, nine seconds each" [0,1,2,3,4]?.2 ~ [8,10,12,14,16]? [3,6,9,12,15]?.4 ~ [20,25,30,35,40]?.3 [5,7,9,11,13] ~ [12,15,18,21,24]? ~ [1,5,9,13,17]?.4
&mirror over=&steps step=0.11 label="its retrograde, 8 steps higher" &constellations[::-1]^$8
# high glints: few, chosen — how few is yours (chance=)
&glints over=&steps step=1.7 chance=free(.82, 0.4..1) label="glints: 7 steps" [50|53|57|61|66]? ~ [44|48|52]? ~ ~ [58|63|70]? ~
# ripples: 13 steps, some chosen, some by chance
&ripples over=&steps step=2.3 label="ripples: 13 steps" 26 [29|31] 33? 27 [35|38]? 30 ~ 32? [28|36] 34 ~ 31? 37?
# two low sines a step apart, beating; each slides on a prime of its own
&lowA over=&steps step=0.029 -8
&lowB over=&steps step=0.029 -7
# a band of noise, its two edges drifting on primes (19 s, 29 s)
&surf step=0.019 0
&tideA map=lin loop=.0526 .1 1 .3 .1
&tideB map=lin loop=.0345 .2 .1 .8 .2

&sine s=sine loop=100 room=.6 env=&(map=adsr 3 2 .6 6)
&glint s=sine loop=100 room=.7 delaytime=.73 delay=.4 delayfeedback=.55 env=&(map=adsr .003 .4 0 1.2) pitch=&(map=lin loop=.09 0 .4 0 -.4 0)
&ripple s=sine loop=100 room=.5 delaytime=.41 delay=.3 delayfeedback=.4 env=&(map=adsr .01 .25 .2 .3)
&droneA s=sine loop=100 env=&(map=adsr 8 1 1 8) pitch=&(map=lin loop=.0588 0 .3 0 -.3 0)
&droneB s=sine loop=100 env=&(map=adsr 8 1 1 8) pitch=&(map=lin loop=.0435 0 -.3 0 .3 0)
&noise s=white lpf=300..3000 * &tideA hpf=150..1500 * &tideB lpq=4 env=&(map=adsr 12 4 .8 12)

&out postgain=5.62 map=sample [&constellations * &sine * .05, &glints * &glint * .05, &ripples * &ripple * .03, &lowA * &droneA * .12, &surf * &noise * .03] [
                                  &mirror * &sine * .05, &glints * &glint * .03, &ripples * &ripple * .05, &lowB * &droneB * .12, &surf * &noise * .03]
\`\`\`
`,chance:`---
title: Chance and choice
tags: [tutorial, rhythm]
tier: 5
description: "A line that is never quite the same twice round: steps that may not sound, and choices between notes."
---

\`\`\`cells
&chanceNote label="0?.7 is dropped seven times in ten; a bare 0? takes the cell's chance=. It is the same every time you play the piece; seed= picks another sequence." about=(&ghosts &hats)
&choiceNote label="[4|5|7]: one of them, chosen afresh each time round." about=&tune
&bar scan(1 1 1 1) step=free(moderato)
&major scale(major)

&tune over=&major step=8n 0 2 [4|5|7] 4 [2|7] 0 [4|9] ~
&hats step=16n 0 0? 0 0?.7 0 0? 0 0?.2
&ghosts chance=.75 seed=3 step=16n 0?!8

&lead s=tri loop=C5 env=&(map=adsr .005 .2 .3 .2)
&hh s=white hpf=8000 env=&(map=adsr 0 .03 0 .02)
&sd s=white hpf=1500 env=&(map=adsr 0 .08 0 .04)
&out map=sample postgain=1.58 [&tune * &lead * .3, &hats * &hh * .1, &ghosts * &sd * .1]
\`\`\`
`,chords:`---
title: Chords and a progression
tags: [tutorial, harmony, diatonic]
tier: 3
description: Four chords in A minor, struck on the beat, and the bass that follows them.
---

\`\`\`cells
&chordNote label="[0,2,4] is a chord: three steps at once, in the scale the cell reads. 6# raises the seventh a semitone: the dominant E major." about=&chords
&sumNote label="&chords + &strike: a sum of pitches. The finer one, &strike, starts the notes; the chords hold under it and move it." about=&strike
&bar scan(1 1 1 1) step=free(andante)
&minor scale(minor, A) label="{mode} on {tonic}"     # A minor

&chords over=&minor step=1m [0,2,4] [3,5,7] [4,6#,8] [0,2,4]         # i – iv – V – i
&strike step=4n 0 0 12 0                                           # on the beat, an octave up on three
&roots over=&minor step=1m 0 3 4 0

&keys s=tri loop=A3 env=&(map=adsr .01 .5 .3 .3)
&bass s=sine loop=A3 env=&(map=adsr .01 .6 .6 .2)
&out map=sample postgain=2.99 [(&chords + &strike) * &keys * .15, (&roots - 24) * &bass * .5]
\`\`\`
`,clock:`---
title: "A clock: one bar drives every part"
tags: [tutorial, rhythm]
tier: 2
description: "A bar sets the tempo, and every part steps with it: on the beat, twice as fast, or once every two beats."
---

\`\`\`cells
&barNote label="&bar is the clock: scan(1 1 1 1) is four even beats; step=free(andante) a tempo marking, a slider from 76 to 108 beats a minute." about=&bar
&ratesNote label="Each part taps the bar by a note value: step=4n a step a beat (a quarter), 8n two steps a beat, 2n a step every two beats." about=(&tune &eighths &bass)
&bar scan(1 1 1 1) step=free(andante)          # four beats, andante

&tune step=4n 0 4 7 4 5 9 7@2 4 7 5 2 0@4       # a step a beat
&eighths step=8n 12 7 16 7 12 7 16 7 12 9 17 9 14 7 12 ~       # two steps a beat
&bass step=2n -12 -7 -12 -5                   # a step every two beats

&high s=sine loop=C5
&low s=sine loop=C3
&out map=sample postgain=1.41 [&tune * &high * .35, &eighths * &high * .12, &bass * &low * .6]
\`\`\`
`,coltrane:`---
title: "Coltrane changes: keys a major third apart"
tags: [genre:jazz, artist:Coltrane, chromatic, tonal, harmony]
description: "The changes of Giant Steps: three keys a major third apart, B, G and E♭, with a line of our own over them."
---

\`\`\`cells
# The changes of Giant Steps: three keys a major third apart — B, G, Eb — round
# the octave. The key turns down a major third each bar (stride=-4); the line plays
# 1-2-3-5 in it, then the dominant of the next key. The line is our own.
&bar scan(1 1 1 1) step=free(220bpm, 140..320)
&swing scan(free(2, 1..3) 1) step=8n
&key shift=-1 step=1m stride=-4                          # B, then G, then Eb, then B …

&line over=&key step=&swing:pulse 0 2 4 7 3 7 10 13     # 1 2 3 5 · the next key's V7: 1 3 5 b7
&walk over=&key step=4n 0 4 3 10                         # root, third · the V7's root, its fifth
&comp over=&key step=2n [4,11] [7,13]                    # the maj7 shell · the V7 shell
&ride step=&swing:pulse &cym:0:.9 ~ &cym:0:.6 &cym:0:.5 &cym:0:.9 ~ &cym:0:.6 &cym:0:.5

&sax s=saw loop=C4 lpf=1800 room=.25 env=&(map=adsr .02 .12 .6 .1)
&bass s=tri loop=C2 env=&(map=adsr .005 .25 .5 .1)
&keys s=sine loop=C4 env=&(map=adsr .005 .3 .3 .2)
&cym gain=.22 s=white hpf=8000 env=&(map=adsr 0 .12 0 .05)

&mix postgain=1.5 map=sample [&line * &sax * .4, &walk * &bass * .8, &comp * &keys * .3, &ride]
\`\`\`
`,daytime:`---
title: "Clock time: a minute, an hour, a day"
tags: [tutorial, modal, stereo]
tier: 8
description: "Music on the clock on the wall: a tick each second, a chime each minute, a day of music anchored to the time."
---

\`\`\`cells
&unitsNote label="Rates in clock time: loop=1min turns once a minute, 1h an hour, 1d a day, 1wk a week." about=(&minute &hour &day &week)
&anchorNote label="anchor=11.55: where the day stands when play starts, at 11:55 (hours.minutes); then it keeps the time." about=&day
&lawNote label="law=fiveto12: notes computed by a law, not written: the 5 to 12 cycle, a day of music read through the day." about=&cycle
&minute scan(1!60) loop=1min label="a minute: sixty seconds"
&hour scan(1!60) loop=1h label="an hour: sixty minutes"
&day scan(1!24) loop=1d anchor=11.55 show=sun label="the day"
&week scan(1!7) loop=1wk label="a week: seven days"

&tick step=4n 0                                     # each second
&chime step=&hour:4n 12                             # each minute
&daily over=scale(major) step=&week:4n 0 1 2 3 4 5 6    # the chime a step higher each day
&cycle law=fiveto12 over=&day step=84bpm label="the law: a day"

&click s=sine loop=C6 env=&(map=adsr 0 .01 0 .01)
&bell s=sine loop=C5 env=&(map=adsr .002 2 0 1.5)
&glass s=tri loop=C4 lpf=3200 env=&(map=adsr .004 .9 .25 1.2)
&out map=sample postgain=2.99 [&cycle * &glass * .3, &tick * &click * .05, (&chime + &daily) * &bell * .2]
\`\`\`
`,drums:`---
title: "Drums: a groove of voices"
tags: [tutorial, rhythm]
tier: 4
description: "A drum part written with the drums' names: a beat, a fill with ratchets and a subsequence, a Euclidean rhythm and a kit."
---

\`\`\`cells
&grooveNote label="A stepped braid of voices plays them: &bd ~ &hh is kick, rest, hat. &beat and &fill are drum motifs, spliced into &groove like any other." about=&groove
&levelNote label="&hh:0:.5 plays that hit at a gain of its own, here half: the hats between the kick and the snare lean back. &hh:0:1.5 would be louder." about=&beat
&ratchetNote label="&sd*3 plays the snare three times in one step: a ratchet. [&sd &sd] squeezes two steps into one: a subsequence." about=&fill
&euclidNote label="euclid(5, 16): five hits spread as evenly as they go over sixteen steps." about=&clave
&hitNote label="oneshot: the hat plays its envelope through, whatever its step: a hit, as on a drum machine." about=&hh
&kitNote label="A braid of voices read with over= is a kit: its numbers pick the voices, 0 the first." about=(&kit &toms)
&bar scan(1 1 1 1) step=free(moderato)

&beat &bd ~ &hh:0:.5 ~ &sd ~ &hh:0:.5 [&bd,&hh]
&fill &sd [&sd &sd] &sd &sd*3
&groove step=8n &beat!3 &bd ~ &hh ~ &fill
&clave step=16n euclid(5, 16)
&kit &lo &mid &hi
&toms over=&kit step=16n ~!12 0 1 2 1

&bd s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0) env=&(map=adsr 0 .3 0 .05)
&sd s=white hpf=1500 env=&(map=adsr 0 .12 0 .05)
&hh oneshot s=white hpf=8000 env=&(map=adsr 0 .04 0 .02)
&rim s=sine loop=E5 env=&(map=adsr 0 .03 0 .02)
&lo s=sine loop=G2 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .25 0 .05)
&mid s=sine loop=C3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .2 0 .05)
&hi s=sine loop=F3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .15 0 .05)
&out map=sample postgain=.944 [&groove * .6, &clave * &rim * .15, &toms * .4]
\`\`\`
`,dtmf:`---
title: "DTMF: a telephone keypad"
tags: [tutorial, genre:electronic, sound]
tier: 8
description: "Every touch-tone phone: a key is two sines at once, its row's and its column's."
---

\`\`\`cells
&dialNote label="Type a number and it's dialled — a key, a pause; a space (or anything not on the keypad) a rest — over and over." about=&dial
# DTMF — dual-tone multi-frequency. Rows 697 770 852 941 Hz, columns 1209 1336 1477 1633 Hz:
# eight frequencies (&dtmf, as ratios to 697), sixteen keys a row and a column each (&keys).
# The number is text (free("…"): a field to type in); spell(…) dials it — each character that's a
# key plays &keys[k] (its row and column), then a pause; a space is a rest.
&dtmf map=ratios 1 1.1047 1.2224 1.3501 1.7346 1.9168 2.1191 2.3429 4 label="rows 697 770 852 941 · columns 1209 1336 1477 1633 Hz"
&keys over=&dtmf label="the keypad: a row and a column a key" [0,4] [0,5] [0,6] [0,7] [1,4] [1,5] [1,6] [1,7] [2,4] [2,5] [2,6] [2,7] [3,4] [3,5] [3,6] [3,7]
&dial step=7 label="the number, dialled" spell(free("867 5309 ABCD .#"), &keys, "1 2 3 A 4 5 6 B 7 8 9 C * 0 # D")
&tone s=sine loop=697 env=&(map=adsr .004 .05 1 .008)
&out postgain=3.76 map=sample [&dial * &tone * .3]
\`\`\`
`,echotape:`---
title: Echo Tape
tags: [tutorial, genre:experimental, genre:electronic, sound, stereo, tape]
tier: 8
description: "A tape loop of notes: a write head records the tune and read heads play it back, echoing."
---

\`\`\`cells
&headsNote label="Three read heads play it back .375, .75 and 1.5 tape-seconds on." about=(&near &mid &far)
&ghostNote label="Every pass under the write head erases a little less than half — ghosts of older phrases fade round the loop." about=&tape
&reelNote label="The reel wows; hold it, and the echoes slow and sag in pitch." about=&reel
# Echo Tape — &tape records &tune (write=) onto a loop of 6 tape-seconds (length=); the tape
# moves with &reel, a physical motor (wow, and your hand). The read heads (play=, at=) are cells:
# play them like any melody. erase=.45: each pass keeps 55% — the ghosts.
&reel step=84bpm motor=1.5 mass=1 friction=.1 wow=.015 0
&bar scan(1 1 1 1) step=84bpm
&major scan(2 2 1 2 2 2 1) label="{mode} on {tonic}"
&tune over=&major step=8n label="the tune" 0 ~ 4 ~ 7 ~!3 11 ~ 9 ~ 7 ~!3 4 ~ 5 ~ 4 2 ~!2 0 ~!7
&tape step=&reel write=&tune length=6 erase=.45 varispeed=1 label="the tape: 6 s, a loop"
&near play=&tape at=.375 label="head 1"
&mid play=&tape at=.75 label="head 2"
&far play=&tape at=1.5 label="head 3"

&m s=sine ratio=3
&bell s=sine loop=G4 fm=&m index=.2..1.4 * &(map=adsr .001 .15 .1 .1) room=.3 env=&(map=adsr .002 1.2 0 .8)
&soft s=tri loop=G4 lpf=1800 room=.5 env=&(map=adsr .004 .9 0 .6)

&out postgain=7.08 map=sample [&tune * &bell * .22, &near * &soft * .12, &far * &soft * .08] [
                                  &tune * &bell * .22, &mid * &soft * .12, &far * &soft * .08]
\`\`\`
`,effects:`---
title: "Filters and effects: shaping a voice"
tags: [tutorial, sound]
tier: 2
description: "What shapes a voice after its source: filters, a reverb and an echo, grit, and a vibrato."
---

\`\`\`cells
&filterNote label="lpf= lets the lows through (a cutoff in Hz) and lpq= rings at the cutoff; hpf= and hpq= the same from above." about=(&warm &thin)
&effectsNote label="room= sends to a reverb, delay= to an echo: delaytime= apart, delayfeedback= how long it repeats. distort= and crush= add grit." about=(&glass &grit)
&vibratoNote label="pitch= is a voice's own pitch on every note: here a vibrato, a cell that turns three times a beat, in semitones." about=&warm
&bar scan(1 1 1 1) step=free(moderato)

&tune step=8n 0 4 7 12 7 4 0 ~ 2 5 9 14 9 5 2 ~
&line step=2n 7 9 5 7
&bass step=4n 0 0 7 0 2 2 9 2
&sparkle step=1m 12 14

&warm s=saw loop=C4 lpf=1400 lpq=6 env=&(map=adsr .08 .2 .7 .4) pitch=&(loop=&bar*3 0 .15 0 -.15)
&thin s=saw loop=C4 hpf=2500 hpq=3 env=&(map=adsr .005 .2 .2 .2)
&glass s=sine loop=C5 room=.6 delay=.4 delaytime=.33 delayfeedback=.5 env=&(map=adsr .01 .8 0 .8)
&grit s=square loop=C2 lpf=900 distort=.3 crush=8 env=&(map=adsr .005 .2 .6 .1)
&out map=sample postgain=1.68 [&tune * &thin * .2, &line * &warm * .15, &sparkle * &glass * .2, &bass * &grit * .3]
\`\`\`
`,fifths:`---
title: "A table that turns: the circle of fifths"
tags: [tutorial, genre:classical, tonal, chromatic, harmony]
tier: 5
description: "A key that turns a fifth each pass: round the circle of fifths and home."
---

\`\`\`cells
# &key turns once per pass of &tune, a fifth at a time (stride=7): C G D A E …
# After twelve fifths it is home: a table that turns comes round after its own length.
&bar scan(27 23 26 24) step=110bpm
&key label="key: **{tonic}** — a fifth up each pass" step=cycle(&tune) stride=7
&circle label="the circle, as a table: {notes}" fifths()     # the same twelve in one line; fifths(1) would start on G
&tune over=&key step=4n 0 4 7 12 7 4 0@2       # chromatic numbers: a major arpeggio

&pluck s=tri loop=C4 env=&(map=adsr .01 .4 .3 .3)
&mix postgain=2.37 map=sample [&tune * &pluck]
\`\`\`
`,five:`---
title: "Five: an original tune in 5/4"
tags: [genre:jazz, modal, rhythm]
description: An original tune in 5/4, felt as 3 + 2, after the groove of Take Five.
---

\`\`\`cells
# Five: an original tune in 5/4, the bar felt as 3 + 2 — after the groove of Take Five.
# It builds on the blues: the same swing meter, the minor pentatonic (here on Eb).
&bar scan(1 1 1 1 1) step=free(172bpm, 120..220)    # five beats
&swing scan(free(2, 1..3) 1) step=8n               # swung eighths, as in the blues: ratio free
&penta scan(3 2 2 3 2)                             # Eb Gb Ab Bb Db (the voices sit on Eb)
&harmony step=4n 0!3 -5!2                          # 3 + 2: the minor chord for three beats, the minor fifth for two

&call 4 3 2@2 0 ~ 1 2 ~@2                          # one bar of swung eighths
&tune over=&penta step=&swing:pulse &call &call^1 &call 4 ~ 3 2 0@6 # the call, answered a step up the scale

&walk step=4n 0 3 7 -5 -2                          # a bass that walks the 3 + 2
&comp step=&swing:pulse [0,3,7]@3!2 [0,3,10]@3 [0,3,10]
&ride step=&swing:pulse &cym:0:.9 ~ &cym:0:.6 &cym:0:.5 [&cym:0:.9,&click:0:.7] ~ &cym:0:.6 &cym:0:.5 [&cym:0:.8,&click:0:.5] &cym:0:.4 # the ride, and a click on 3 and 5: the seams of 3 + 2

&horn s=saw loop=Eb4 lpf=1400 room=.3 env=&(map=adsr .02 .15 .6 .15)
&piano s=tri loop=Eb4 env=&(map=adsr .005 .35 .15 .2)
&bass s=tri loop=Eb2 env=&(map=adsr .005 .3 .5 .1)
&cym gain=.22 s=white hpf=8000 env=&(map=adsr 0 .12 0 .05)
&click gain=.3 oneshot s=white hpf=3000 env=&(map=adsr 0 .03 0 .02)

&mix postgain=1.58 map=sample [&tune * &horn * .45,
                                  &walk * &bass * .8,
                                  (&comp + &harmony) * &piano * .3,
                                  &ride]
\`\`\`
`,fiveto12:`---
title: 5 to 12
tags: [genre:experimental, artist:Stockhausen, modal, sound, stereo, physics, tape]
description: "A day of music, anchored to the clock: it begins at 11:55 and plays where the day stands."
---

\`\`\`cells
&blocksNote label="Twelve blocks of two hours, a mode each — down from Ionian to the Locrian nadir, up again to the Lydian zenith." about=&cycle
&keysNote label="Twelve keys of ten minutes, by fifths going down, by fourths coming up (a new dawn: strange, full of hope)." about=&cycle
&barNote label="Every bar sounds all seven notes, on its mode's 12/8 bell." about=(&cycle &glass)
&dimensionsNote label="Five dimensions in counterpoint — melody, rhythm, harmony, dynamics, space." about=&cycle
# 5 to 12 — law=fiveto12 computes every note of the day: 84 steps a minute, 70 bars of 12/8 to a
# key, each key's row derived from it. Phrase by phrase, the five operations — translation,
# rotation, inversion, retrograde, multiplication (the Apple: ×5 mod 7) — each move their own
# dimension; the second half of every key mirrors the first. &day is the day it reads (over=&day): a
# meter of 24 hours, turning once a day (loop=1d), standing at 11:55 when play starts from the top
# (anchor=11.55: else where the clock stands; Reset: back to 11:55). Drawn as the sun (show=sun):
# stopped, turn it to choose the moment.
&day scan(1!24) loop=1d anchor=11.55 show=sun label="the sun: noon above, midnight below — east, west"
&cycle law=fiveto12 over=&day step=84bpm label="the law: a day"
&glass s=tri loop=C4 lpf=3200 env=&(map=adsr .004 .9 .25 1.2) label="the voice"
&present [&cycle * &glass * .3]

# memories and messages: a tape of the last two minutes — a head a minute back (seven bars,
# exactly), a head twelve bars back, wandering
&reel step=84bpm 0
&memory step=&reel write=&present length=120 erase=.3 tone=2200 drive=.3 hiss=.003 label="the tape: memories and messages"
&recall play=&memory at=60 label="a memory: a minute ago"
&message play=&memory at=102.857 wander=.04 wanderhz=.07 label="a message: twelve bars ago"

# reflection and inspiration: strings on every semitone, on one board — the music rings them
# (whatever the key), a hand plays them
&strings body=wire loop=C2 ring=5 hard=.4 board=none excite=&present label="the strings: reflection (tap them: inspiration)"
&light scope=spectrum label="the tonal spectrum: the mode, the key, the harmony" &glass

&out postgain=2 map=sample [&present, &recall * .35, &strings * .3] [&present, &message * .35, &strings * .3]
\`\`\`
`,fm:`---
title: "FM: one voice bends another"
tags: [tutorial, sound, FM]
tier: 7
description: A bell and an electric piano, each a sine whose frequency another sine swings.
---

\`\`\`cells
&fmNote label="fm=&bm: &bm swings the bell's frequency. ratio= is the modulator's frequency against the carrier's (3.5: a bell, not a harmonic); index= how far it swings, 0 a plain sine." about=(&bell &bm)
&moveNote label="index= can move: on the piano it falls on every note, bright when struck and a sine as it rings." about=&epiano
&bar scan(1 1 1 1) step=free(andante)
&major scale(major)

&tune over=&major step=4n 7 4 5 2 4 0 2@2 7 9 8 7 4@4
&chords over=&major step=1m [0,2,4] [3,5,7] [1,3,5] [0,2,4]

&bm s=sine ratio=3.5
&bell s=sine loop=C5 fm=&bm index=3 env=&(map=adsr .001 1.6 0 1.2)
&em s=sine ratio=1
&epiano s=sine loop=C4 fm=&em index=.2..3 * &(map=adsr .001 .4 .1 .3) env=&(map=adsr .002 1 .3 .5)
&out map=sample postgain=7.94 [&tune * &bell * .15, &chords * &epiano * .1]
\`\`\`
`,focus:`---
title: Cell in Focus
tags: [genre:electronic, genre:ambient, artist:Aphex Twin, diatonic, stereo]
description: "Slow, serene and looping: four soft chords with bells drifting above; nothing hurries."
---

\`\`\`cells
&chordsNote label="Four soft chords breathe through a filter." about=(&chords &pad &breath)
&bellsNote label="A bell arpeggio drifts above them, thinning by chance." about=(&arp &bell)
&rootsNote label="A low root under each." about=(&roots &low)
# Cell in Focus — in the spirit of a slow, glowing Aphex Twin loop: an original. D major,
# four chords of four bars: Dmaj7, Bm9, Gmaj7, A6. The arpeggio reads each chord's
# tones an octave up; a few notes rest by chance, differently every time round.
&bar scan(1 1 1 1) step=free(62bpm, 48..80)
&major scan(2 2 1 2 2 2 1) label="{mode} on {tonic}"
&chords over=&major step=1m/4 label="Dmaj7 · Bm9 · Gmaj7 · A6" [0,2,4,6] [-2,0,2,4,8] [-4,-2,0,2] [-3,-1,1,2]
&roots over=&major step=1m/4 -7 -9 -11 -10
&a1 7 9? 11 13?.4
&a2 5 7? 9 11?.4
&a3 3 5? 7 9?.4
&a4 4 6? 8 9?.4
&arp over=&major step=8n label="the bells" &a1!8 &a2!8 &a3!8 &a4!8
&breath map=lin loop=&bar/24 .15 .8 .35 .15

&pad s=saw loop=D3 lpf=300..1800 * &breath room=.6 env=&(map=adsr 2.5 1 .8 4) pitch=&(map=lin loop=.11 0 .06 0 -.06 0)
&bell pan=.31 s=sine loop=D4 room=.7 delaytime=&bar*4/3 delay=.35 delayfeedback=.45 env=&(map=adsr .004 1.4 0 2.2)
&low s=tri loop=D3 lpf=500 env=&(map=adsr 1.5 1 .9 3)

&out postgain=3.35 map=sample [&chords * &pad * .08, &arp * &bell * .16, &roots * &low * .3]
\`\`\`
`,forks:`---
title: Two Tuning Forks
tags: [genre:experimental, sound, stereo, physics]
description: Two tuning forks on one table, one struck now and then, the other set singing by the table.
---

\`\`\`cells
&tableNote label="The second fork, tuned the same, is never struck — but the table carries the vibration, and it begins to sing." about=&forkB
&detuneNote label="Detune it with its slider and they beat." about=&forkB
&touchNote label="Tap a fork to strike it (where you tap is how it rings), hold to damp it, drag across it to bow." about=(&forkA &forkB)
# Two Tuning Forks — resonators (body=): persistent objects with their modes (a fork: its tone, and
# a clang 6.27× higher that dies at once). Notes strike them; a note's value is where (0 … 7).
# couple= sets one ringing from the other, both ways, through the table (coupling= how much).
&bar scan(1 1 1 1) step=60bpm
&hits step=1m/2 label="a strike, every eight seconds" 4
&forkA pan=.35 body=fork loop=A4 ring=10 hard=.35 board=none couple=&forkB coupling=.1 label="fork A: struck" 0
&forkB pan=.65 body=fork loop=free(440hz, 434..446) ring=10 hard=.35 board=none label="fork B: only the table rings it" 0

&out postgain=.398 map=sample [&hits * &forkA * .5, &forkB * .5]
\`\`\`
`,gate:`---
title: "A gate: a product with a name"
tags: [tutorial, diatonic]
tier: 9
description: "Where notes become sound, named: a gate plays its voices with each note of what it plays."
---

\`\`\`cells
&gateNote label="&leadOut is a gate: it plays each note of &tune on the voices in its braid, both of them ([&lead, &bell], a chord), as loud as level= says: &accent per note times .4. It is read as [&tune * &accent * &lead * .4, …]." about=&leadOut
&drumNote label="&drumOut plays a kit: each number of &beat picks the drum, 0 the kick, 1 the snare, 2 the hat, as &beat over=&kit would." about=&drumOut
&productNote label="The bass is the same thing unnamed: a product in the sound card." about=&bass
&bar scan(1 1 1 1) step=free(96bpm, 60..140)
&major scale(major)

&tune over=&major step=8n 0 2 4 2 5 4 2@2 4 5 7 5 4 2 0@2
&accent map=amp step=8n 1 .5 .8 .5
&roots over=&major step=2n 0 3 4 0

&lead s=tri loop=C5 env=&(map=adsr .01 .2 .4 .2)
&bell s=sine loop=C6 env=&(map=adsr 0 .6 0 .3)
&bass s=square loop=C2 lpf=500 env=&(map=adsr .005 .15 .5 .05)
&bd s=sine loop=A1 env=&(map=adsr 0 .3 0 .1)
&sd s=white env=&(map=adsr 0 .15 0 .05)
&hh s=white hpf=7000 env=&(map=adsr 0 .04 0 .02)
&kit &bd &sd &hh
&beat step=8n 0 2 1 2

&leadOut play=&tune level=&accent*.4 [&lead, &bell]
&drumOut play=&beat level=.5 &kit
&out map=sample [&leadOut, &drumOut, &roots * &bass * .5]
\`\`\`
`,ghosts:`---
title: Ghost-Cells
tags: [genre:experimental, genre:electronic, genre:ambient, genre:industrial, artist:Nine Inch Nails, modal, stereo]
description: Dark and looping, in the manner of an instrumental Nine Inch Nails record.
---

\`\`\`cells
&pianoNote label="A prepared-piano phrase of seven eighths over a bar of eight, drifting a step each time round." about=(&phrase &piano)
&droneNote label="A distorted drone." about=(&drone &low)
&noiseNote label="Crushed noise drifting on prime periods." about=(&hiss &noise &grit &haze)
&percNote label="Heavy, sparse percussion and glitches, by chance." about=(&kick &metal &glitch)
# Ghost-Cells — D minor. The piano phrase is seven eighths long and the bar eight: it comes
# back a step later every bar, and lines up again only after seven bars.
&bar scan(1 1 1 1) step=free(76bpm, 60..96)
&minor scan(2 1 2 2 1 2 2) label="{mode} on {tonic}"
&phrase over=&minor step=8n label="the piano: seven against eight" 0 4 3 ~ 7 5 ~
&answer over=&minor step=1m/2 label="its shadow, low" -7@2 -5 -4 -7@2 -9 -10
&drone step=1m/4 [0,7]
&grit map=lin loop=.0435 .15 .7 .3 .15                       # 23 s
&haze map=lin loop=.0345 .1 .5 .9 .1                         # 29 s
&hiss step=1m/4 0
&kick step=8n 0 ~ ~ 0? ~ ~ 0?.7 ~
&metal step=16n ~!2 0?.75 ~!4 0?.6 ~!3 0?.8 ~ 0?.7 ~!2
&glitch step=32n [0|7|12]?.94

&piano pan=.36 s=tri loop=D4 lpf=3000 room=.45 delaytime=&bar*4/3 delay=.2 delayfeedback=.35 env=&(map=adsr .002 1.6 0 1.8) pitch=&(map=lin loop=.19 0 .05 0 -.05 0)
&cello pan=.62 s=saw loop=D3 lpf=700 room=.5 env=&(map=adsr .6 1 .8 2)
&low s=saw loop=D1 distort=.8 lpf=120..600 * &grit lpq=3 env=&(map=adsr 4 2 .9 6)
&noise s=brown crush=5 lpf=200..2400 * &haze hpf=80 room=.4 env=&(map=adsr 6 2 .8 8)
&bd s=sine loop=D1 pitch=0..20 * &(map=adsr 0 .08 0 0) distort=.9 env=&(map=adsr 0 .5 0 .1)
&tick pan=.7 s=square loop=D6 hpf=4000 crush=4 env=&(map=adsr 0 .03 0 .02)
&blip pan=.64 s=sine loop=D6 crush=3 env=&(map=adsr 0 .05 0 .03)

&out postgain=.891 map=sample [&phrase * &piano * .22, &answer * &cello * .16, &drone * &low * .18, &hiss * &noise * .25, &kick * &bd * .55, &metal * &tick * .1, &glitch * &blip * .07]
\`\`\`
`,grids:`---
title: "Tuning: three grids"
tags: [tutorial, tuning, microtonal]
tier: 6
description: "One tune on three grids in turn: nineteen equal steps to the octave, a pure fifth cut in seven, and pure ratios."
---

\`\`\`cells
&edoNote label="map=edo with cycle=19: nineteen equal steps to the octave. map=ed(3/2): equal steps to a pure fifth instead." about=(&edo19 &fifths)
&ratiosNote label="map=ratios: the tones as ratios, one period's worth, the last the period: 1 9/8 5/4 … 2." about=&just
&bar scan(1 1 1 1) step=free(andante)
&edo19 cycle=19 map=edo
&fifths cycle=7 map=ed(3/2)
&just map=ratios 1 9/8 5/4 4/3 3/2 5/3 15/8 2

&a over=&edo19 step=&edoBar*2 0 3 6 8 11 8 6 3 0@4 ~@4
&b over=&fifths step=&fifthsBar*2 0 1 2 3 4 3 2 1 0@4 ~@4
&c over=&just step=&justBar*2 0 2 4 5 4 2 1 0 0@4 ~@4

&pluck s=tri loop=C4 env=&(map=adsr .01 .4 .3 .3)
&grids step=4n &edoBar &fifthsBar &justBar
&turns over=&grids step=2n 0 1 2                      # a grid every two bars, in turn
&out map=sample postgain=6.31 [&a * &pluck * .3,
                          &b * &pluck * .3,
                          &c * &pluck * .3]
\`\`\`
`,harmonograph:`---
title: Harmonograph
tags: [tutorial, genre:experimental, sound, stereo, physics]
tier: 7
description: "Two tuning forks, struck together, each draw one axis of an oscilloscope: a Lissajous curve."
---

\`\`\`cells
&forksNote label="A tonic and its fifth (0 and 7), struck together; the tonic sounds left, the fifth right." about=(&tonic &fifth)
&scopesNote label="A spectrum folds pitches into twelve classes (fold=12), each fork its own (channels=split); a waterfall shows bands (bins=24) as they ring away." about=(&classes &bands)
&figureNote label="Each fork drives one axis of an oscilloscope, x and y, and the figure they draw is a Lissajous curve — 3 : 2, slowly turning (the fifth is tempered), shrinking as they ring away." about=&screen
# Harmonograph — two resonators (forks), struck together every six seconds. &screen is an
# oscilloscope (scope=xy): its first channel across, its second up. A fifth draws a 3 : 2 figure.
&bar scan(1 1 1 1) step=60bpm
&strike step=pulse/6 label="struck together" 0
&tonic body=fork loop=A3 ring=7 hard=.3 board=none label="the tonic" 0
&fifth body=fork loop=A3 ring=7 hard=.3 board=none label="its fifth" 7
&screen scope=xy label="x: the tonic · y: its fifth" &tonic &fifth
&classes scope=spectrum fold=12 channels=split label="their pitch classes, a ring each" &tonic &fifth
&bands scope=waterfall bins=24 label="their sound, in 24 bands, over time" &tonic &fifth

&out postgain=.708 map=sample [&strike * &tonic * .5] [&strike * &fifth * .5]
\`\`\`
`,hypercell:`---
title: Hypercell
tags: [genre:electronic, genre:dance, artist:Scooter, diatonic, arrangement]
description: "90s happy hardcore and eurodance, an original: three minutes of euphoric drops, then it ends."
---

\`\`\`cells
&fourFloorNote label="Four-on-the-floor at 160." about=&beat
&offbeatBassNote label="Offbeat octave bass." about=(&off &bass)
&stabsNote label="Rave stabs." about=(&stabs &stab)
&hookNote label="A euphoric hook on two detuned saws." about=(&hook &sawA &sawB)
&dropsNote label="Risers and snare rolls into every drop." about=(&roll &riser)
&songNote label="Fifteen sections of eight bars: three minutes, then it ends." about=&song
# Hypercell — Am F C G, a bar each; everything in semitones from C. The hook is our own.
&bar scan(1 1 1 1) step=free(160bpm, 140..180)
&prog step=1m tags="bass" 9 5 0 7                                        # A F C G: the bass moves with it
&off tags="bass" step=&bassBar*2 ~ 0 ~ 0 ~ 0 ~ 0                             # the eurodance bass: on the offbeats
&sAm tags="synths" ~ [9,12,16]
&sF tags="synths" ~ [5,9,12]
&sC tags="synths" ~ [0,4,7]
&sG tags="synths" ~ [7,11,14]
&stabs tags="synths" step=&stabBar*2 label="rave stabs" &sAm!4 &sF!4 &sC!4 &sG!4
&hook tags="synths" step=&hookBar*2 label="the hook" 16!2 19 16 14 12 14@2 12!2 16 12 11 9 11@2 12!2 16 19 21 19 16@2 14 12 11 12 14@4
&held tags="synths" step=&padBar/4 [9,12,16] [5,9,12] [0,4,7] [7,11,14]
&beat tags="drums" step=&beatBar*2 &bd &hh [&bd,&cp] &hh &bd &hh [&bd,&cp] &hh   # the kick, the clap on two and four, the hats between
&roll tags="drums" step=&rollBar &sn!8 &sn*2!4 &sn*4!6 &sn*8!13 ~
&lift tags="rise" step=&riseBar/32 0
&up tags="rise" map=lin loop=&bar/32 0 .2 .45 1 0

&bd tags="drums" gain=.8 oneshot s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .05 0 0) distort=.2 env=&(map=adsr 0 .28 0 .05)
&hh tags="drums" gain=.2 s=white hpf=8000 env=&(map=adsr 0 .04 0 .02)
&cp tags="drums" gain=.35 oneshot s=white hpf=1400 room=.2 env=&(map=adsr 0 .12 0 .06)
&sn tags="drums" gain=.25 s=white hpf=900 env=&(map=adsr 0 .07 0 .03)
&bass tags="bass" s=saw loop=C2 lpf=900 lpq=4 env=&(map=adsr .003 .12 .6 .05)
&stab tags="synths" s=square loop=C4 lpf=2800 room=.25 env=&(map=adsr .002 .14 .1 .1)
&sawA tags="synths" s=saw loop=C5 lpf=5200 room=.3 delaytime=&bar*8/3 delay=.2 delayfeedback=.3 env=&(map=adsr .01 .2 .7 .2)
&sawB tags="synths" s=saw loop=527.4 lpf=5200 room=.3 env=&(map=adsr .01 .2 .7 .2)
&padv tags="synths" s=saw loop=C4 lpf=1600 room=.5 env=&(map=adsr .8 .5 .8 1.5)
&riser tags="rise" s=white lpf=300..9000 * &up lpq=6 env=&(map=adsr 1 .5 .9 .5)

# the three mixes the spectrum (&eq) reads; the other parts go straight into the card
&bassPart [(&off + &prog) * &bass * .35]
&hookPart [&hook * &sawA * .13, &hook * &sawB * .13]
&padPart [&held * &padv * .08]
&sections step=4n &bassBar &stabBar &hookBar &padBar &beatBar &rollBar &riseBar
&song over=&sections step=1m/8 laps=1 label="intro · groove · build · drop · drop · break · build · drop · drop · bass · break · build · drop · drop · out" [
      4] [0,4] [0,4,5,6] [0,1,2,4]!2 [2,3] [3,5,6] [0,1,2,4]!2 [0,4] 3 [3,5,6] [0,1,2,4]!2 4

&out postgain=1.41 map=sample [&beat, &bassPart, &stabs * &stab * .1, &hookPart,
                         &lift * &riser * .12, &padPart, &roll]
&eq scope=spectrum bins=20 label="the whole track, in 20 bands" &beat &bassPart &hookPart &padPart
\`\`\`
`,idm:`---
title: "IDM: drill, after Aphex Twin"
tags: [genre:electronic, artist:Aphex Twin, chromatic, rhythm]
description: A breakbeat backwards every other bar, with ratchets and hats.
---

\`\`\`cells
&hatsNote label="The hats run seven against four." about=&hats
&harmonyNote label="One harmony and one breath for pad, acid and lead." about=(&lydian &breath)
# Intelligent dance music, in the manner of Aphex Twin — an original. A breakbeat
# of voices, every other bar its retrograde ([::-1]); ratchets (&hh*3: a
# sixteenth split in three); hats seven against four. One harmony for all: the
# Lydian scale turns a step every two bars, and pad, acid and lead all read it;
# one breath: a slow filter sweep moves the pad and the lead together.
&bar scan(1 1 1 1) step=free(160bpm, 110..200)
&lydian scan(2 2 2 1 2 2 1) step=1m/2 stride=1 cycle=2 label="the harmony: {mode} on {tonic}"     # C, then D: a step every two bars

&pat &bd ~ &hh &hh*2 &sd ~ &bd &hh ~ &bd &sd &hh*3 ~ &bd &sd*4!2   # a bar of sixteenths
&break step=16n &pat &pat[::-1]                            # … then the same bar backwards
&hats step=pulse*7/4 &tick:0:.6 &tick:0:.3 &tick:0:.4 &tick:0:.3 &tick:0:.5 &tick:0:.3 &tick:0:.4  # seven to the bar
&pad over=&lydian step=1m/2 [0,2,4,6]                      # the chord, as the scale turns
&bleeps over=&lydian step=8t 7 ~ 9 11 ~ 13 ~ 11 ~ ~ 9 ~     # the lead: the chord's own tones, in triplets
&acid over=&lydian step=16n 0 0 7 0 ~ 0 14 ~ 0 3 0 ~ 7 0 ~ 10
&accent map=amp step=16n 1 .5 .8 .5 0 .5 1 0 .6 .5 .9 0 .7 .5 0 1      # louder, and brighter

&breath map=lin loop=&bar/8 .15 1 .15                       # one breath, for pad and lead

&bd oneshot s=sine loop=A1 pitch=0..36 * &(map=adsr 0 .03 0 0) env=&(map=adsr 0 .2 0 .05)
&sd s=white hpf=900 env=&(map=adsr 0 .1 0 .04)
&hh s=white hpf=9000 env=&(map=adsr 0 .025 0 .01)
&tick gain=.2 s=white hpf=11000 env=&(map=adsr 0 .015 0 .01)
&bleep s=tri loop=C5 lpf=800..5000 * &breath delaytime=&bar*4/3 delay=.3 delayfeedback=.4 room=.25 env=&(map=adsr .003 .12 .3 .1)
&saw303 s=saw loop=C2 lpf=150..2600 * &(map=adsr .002 .16 .12 .06) * &accent lpq=12 env=&(map=adsr .002 .12 .4 .05)
&pad1 s=saw loop=C4 lpf=500..2200 * &breath env=&(map=adsr 1.2 .5 .7 2) pitch=&(map=lin loop=.3 0 .15 0 -.15 0)

&mix postgain=.944 map=sample [&break * .7, &hats, &bleeps * &bleep * .3,
                                  &acid * &accent * &saw303 * .4, &pad * &pad1 * .14]
\`\`\`
`,"in-c":`---
title: In C, a sketch
tags: [genre:minimal, genre:experimental, arrangement, motifs, rhythm]
description: "After Terry Riley's In C: four of its fifty-three cells, each player repeating a cell until moving on, and a player who sits out comes back where they left off."
---

\`\`\`cells
&resumeNote label="restart=resume: a player switched off is not rewound. Take restart=resume off &song (the default, restart) to hear each come back at the top of their score." about=&song
&bar meter("4/4") step=free(104bpm, 60..140)
&major scale(major)

# the cells (after the score's first four, simplified), in eighths
&c1 0 2 0 2 0 2
&c2 0 2 3 2
&c3 ~ 2 3 2
&c4 ~ 2 3 4

# a player's score: each cell repeated, then on to the next. Each player is a section of &sections and moves at their own pace
&alice over=&major step=&aliceBar*2 &c1!8 &c2!6 &c3!4 &c4!4
&bob over=&major step=&bobBar*2 &c1!6 &c2!6 &c3!6 &c4!2
&carol over=&major step=&carolBar*2 &c2!6 &c3!8 &c4!6

&sections step=4n &aliceBar &bobBar &carolBar
# who plays, a bar a step: Alice from the start, Bob in and out, Carol late, then everyone
&song over=&sections restart=resume step=1m laps=1 0 [0,1] [0,1] 0 [0,2] [0,1,2] [0,1,2] [1,2] [0,1,2] [0,1,2] [0,2] [0,1,2]

&pulse s=sine loop=C6 env=&(map=adsr 0 .04 0 .03)
&marimba s=tri loop=C4 env=&(map=adsr .005 .25 0 .15)
&vibes s=sine loop=C5 env=&(map=adsr .005 .5 .1 .3)
&bell s=sine loop=C3 env=&(map=adsr .005 .8 0 .4)
&out map=sample postgain=2 [&alice * &marimba * .35, &bob * &vibes * .3, &carol * &bell * .35]
\`\`\`
`,jazz:`---
title: "Swing blues: 12 bars in C"
tags: [genre:jazz, genre:blues, rhythm]
description: "A 12-bar blues with swung eighths: the blues scale and the minor pentatonic as scans."
---

\`\`\`cells
&swingNote label="The swing is a slider." about=&swing
# A 12-bar blues in C, swung. The eighths are a meter of their own: long, short —
# their ratio is free (1 straight, 2 the triplet swing, 3 hard). Two scales, both scans:
# the blues scale for the riff, the minor pentatonic for the turnaround.
&bar scan(1 1 1 1) step=free(132bpm, 80..220)
&swing scan(free(2, 1..3) 1) step=8n                   # two eighths a beat: long : short

&blues scan(3 2 1 1 3 2)                               # C Eb F F# G Bb
&penta scan(3 2 2 3 2)                                 # C Eb F G Bb
&changes step=1m 0!4 5!2 0!2 7 5 0 7                   # I I I I · IV IV I I · V IV I V, a bar each

&riff 0 1 2 3 4 ~ 5 4 ~ ~ 2 1 0 ~@3                    # two bars — it stays put over the IV, as a blues riff does
&turn over=&penta 3 ~ 4 3 2 1 0 ~ 2 ~@3 1 0 ~ ~ 0 ~ 1 2 3 ~ 5 ~ 4 3 2 1 0@4
&lick over=&blues step=&swing:pulse &riff!4 &turn

&walk step=4n 0 4 7 10                                 # root, 3rd, 5th, flat 7th — moved by the changes
&comp step=&swing:pulse ~@3 [4,10] ~@3 [4,10]          # shells (3rd and 7th) on the and of 2 and 4
&ride step=&swing:pulse &cym:0:.9 ~ &cym:0:.6 &cym:0:.5 &cym:0:.9 ~ &cym:0:.6 &cym:0:.5 # ding, ding-a ding, ding-a

&horn s=saw loop=C4 lpf=1600 room=.3 env=&(map=adsr .02 .15 .6 .12)
&bass s=tri loop=C2 env=&(map=adsr .005 .25 .5 .1)
&keys s=sine loop=C4 env=&(map=adsr .005 .3 .2 .2)
&cym gain=.25 s=white hpf=8000 env=&(map=adsr 0 .12 0 .05)

&mix postgain=1.78 map=sample [&lick * &horn * .5,
                                  (&walk + &changes) * &bass * .8,
                                  (&comp + &changes) * &keys * .35,
                                  &ride]
\`\`\`
`,just:`---
title: "Just intonation: pure and tempered"
tags: [genre:experimental, microtonal, tuning, harmony, stereo]
description: "Just intonation: the same four chords twice, pure on the left and tempered on the right."
---

\`\`\`cells
# Just intonation: a grid of ratios. The same chords twice — on the left in just
# intonation (thirds 5/4, fifths 3/2: pure), on the right in equal temperament.
# Listen to the right one beat. And ii (D F A): its fifth, 40/27, is out of tune —
# the price of purity.
&justPureNote label="Left: just — thirds 5/4, fifths 3/2." about=(&just &pure)
&temperedBeatsNote label="Right: tempered — listen to it beat." about=(&equal &tempered)
&justFifthNote label="In ii (D F A) the just fifth is 40/27: out of tune." about=&chords
&bar scan(1 1 1 1) step=free(48bpm, 30..90)
&just label="just: {notes}" map=ratios 1 9/8 5/4 4/3 3/2 5/3 15/8 2        # C major, pure: one octave's tones, then the octave
&equal label="tempered: {notes}" scan(2 2 1 2 2 2 1)                            # C major, in equal steps

&chords [0,2,4] [3,5,7] [1,3,5] [4,6,8]               # I IV ii V, as scale degrees
&pure over=&just step=1m &chords
&tempered over=&equal step=1m &chords

&organ s=saw loop=C3 lpf=1800 env=&(map=adsr .3 .3 .9 .8)
&out postgain=2 map=sample [&pure * &organ * .3] [&tempered * &organ * .3]
\`\`\`
`,kalimba:`---
title: Kalimba
tags: [tutorial, genre:world, sound, physics]
tier: 7
description: "The smallest tuned instrument: one resonator, its braid its tines, eight of them on a shared board."
---

\`\`\`cells
&pluckNote label="A tune reads the tines and plucks them: each note a tine, by its place." about=(&tune &kalimba)
&boardNote label="The board carries every one to the others, which answer faintly." about=&kalimba
&padNote label="Tap the pads round it to play along; hold it to stop it ringing." about=&kalimba
# Kalimba — a resonator's braid is its exciters: 0 2 4 7 9 12 14 16, semitones from its fundamental
# (none written: the twelve). body=tine is what each is; they share a board (board=box: a box, an octave down, as without it)
# and each rings the others through it. The tune reads through the kalimba (over=&kalimba): its tines are
# its table, and a note plucks the tine at its place.
&bar scan(1 1 1 1) step=92bpm
&tune over=&kalimba step=8n label="the tune" 0 2 4 ~ 3 4 5 ~ 4 2 1 ~ 0 ~!3 5 ~ 4 3 2 ~ 1 2 0 ~!3 7 6 5 ~
&kalimba body=tine loop=C4 ring=3 hard=.3 board=box coupling=.06 label="the kalimba: eight tines on one board" 0 2 4 7 9 12 14 16

&out postgain=.168 map=sample [&tune * &kalimba * .5]
\`\`\`
`,korobeiniki:`---
title: "8-bit: Korobeiniki, in Tetris form"
tags: [genre:world, genre:electronic, genre:folk, genre:8-bit, tonal, arrangement]
description: "Korobeiniki, in the form of the puzzle game's music: A · A · B · B · A, and round again."
---

\`\`\`cells
# Korobeiniki — the Russian folk song a famous puzzle game made its own — as a
# 1980s console would play it: pulse waves are braids, the bass a stepped triangle,
# chords are arpeggios too fast to hear apart. In the game's form: the song (A),
# then a slower middle section (B, our own), then the song again — and round.
&formNote label="&tetris picks the parts, eight bars a step." about=&tetris
&sectionsNote label="A is the folk song; B, slower, in half notes, is our own." about=(&tune &chorale)
&bar scan(1 1 1 1) step=free(144bpm, 100..200)

&a tags="lead" 7@2 2 3 5@2 3 2 0@2 0 3 7@2 5 3                 # in A minor (A = 0); two bars
&b tags="lead" 2@3 3 5@2 7@2
&end tags="lead" 3@2 0@2!2 ~@2                                 # … closes both halves
&c tags="lead" ~ 5@2 8 12@2 10 8 7@3 3 7@2 5 3
&d tags="lead" 2@2 2 3 5@2 7@2
&tune tags="lead" step=&leadABar*2 &a &b &end &c &d &end
&changes tags="harmony" loop=&bar/32 0 0 -5 0 5 0 -5 0             # Am Am E Am Dm Am E Am — a bar each

&octaves tags="bass" 0 12 0 12 0 12 0 12           # the bass jumps octaves, as they did
&bassAOctaves tags="bass" step=&bassABar*2 &octaves
&bassBOctaves tags="bass" step=&bassBBar*2 &octaves
&hold tags="harmony" 0                                # one chord a bar …
&chordsAHold tags="harmony" step=&chordsABar/4 &hold
&chordsBHold tags="harmony" step=&chordsBBar/4 &hold
&hats tags="drums" step=&drumsBar*2 &noise:0:.5 &noise:0:.15 &noise &noise:0:.15 &noise:0:.5 &noise:0:.15 &noise &noise:0:.15

&pulse tags="lead" loop=A4 0 0 0 1 env=&(map=adsr .002 .05 .8 .05)              # a 25% pulse: the lead
&tri tags="bass" loop=A2 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1 0   # a stepped triangle
&square tags="harmony" loop=A3 0 1 pitch=&(loop=20 0 3 7) env=&(map=adsr .002 .1 .7 .1)   # … arpeggiated, 60 notes a second
&noise tags="drums" gain=.2 s=white hpf=5000 env=&(map=adsr 0 .05 0 .02)

# B: half notes over Am and Em — our own (the game's middle section is its composer's)
&chorale tags="lead" step=&leadBBar/2 3 2 0 -2 0 2 3 2 0 3 7 5 3 2 0@2
&changesB tags="harmony" loop=&bar/32 0 -5 0 -5 0 -5 0 0                  # Am Em Am Em Am Em Am Am
&pulse50 tags="lead" loop=A4 0 1 env=&(map=adsr .01 .1 .8 .2)              # a 50% pulse, softer: for B

# the sections &tetris switches: eight bars a step, A A B B A, round again
&sections step=4n &leadABar &leadBBar &bassABar &bassBBar &chordsABar &chordsBBar &drumsBar
&tetris over=&sections step=1m/8 label="A · A · B · B · A" [0,2] [0,2,4,6] [1,3,5] [1,3,5,6] [0,2,4,6]

&out postgain=1.78 map=sample [&tune * &pulse * .3,
                         &chorale * &pulse50 * .28,
                         (&bassAOctaves + &changes) * &tri * .6,
                         (&bassBOctaves + &changesB) * &tri * .6,
                         (&chordsAHold + &changes) * &square * .12,
                         (&chordsBHold + &changesB) * &square * .12,
                         &hats]
\`\`\`
`,lullaby:`---
title: "Lullaby: Brahms, Wiegenlied"
tags: [genre:classical, artist:Brahms, tonal, diatonic]
description: Brahms' lullaby on a music box, its notes ringing on.
---

\`\`\`cells
# Brahms, Wiegenlied (1868). A music box over a slow 3/4. The second phrase is
# the first a step lower (&rock^-1): a sequence, as Brahms wrote it.
&bar scan(28 37 35) step=free(56bpm, 40..72)
&scale scale(major)                       # C major

&rock 4@3 2 2@2 4@3 2 4@2                    # lul-la-by and good night
&rise 7@2 6@3 5 5@2 4@2 1 2                  # with ro-ses be-dight
&turn 6@2 5 4@2 6 7@4 0 0
&high 7@3 5 3@2 4@3 2 0@2                    # sung twice
&home 3@2 2@2 1@2 0@4 2 2                    # … and the next pickup
&song over=&scale step=8n &rock &rise &rock^-1 &turn &high 3@2 4@2 5@2 4@4 0 0 &high &home

&roots over=&scale step=1m 0!3 4!4 0 3 0 4 0 3 0 4 0

&ring map=lin loop=&song 1 .35 .1           # each note rings and fades away: a ramped volume
&box s=sine loop=C5 room=.5 env=&(map=adsr .005 .1 1 .9)
&low s=tri loop=C3 env=&(map=adsr .05 .6 .4 .6)
&mix postgain=2.37 map=sample [&song * &ring * &box, &roots * &low * 0.5]
&roll scope=waterfall label="a piano roll: the tune above, its roots below" &song &roots
\`\`\`
`,metronome:`---
title: "Metronome: any meter"
tags: [tutorial, genre:electronic, rhythm]
tier: 6
description: A bar and the clicks it plays, in a meter you choose.
---

\`\`\`cells
&chooseNote label="Choose the time signature and the grid — a click on every beat, eighth, sixteenth or triplet — the tempo and the swing." about=&bar
&levelsNote label="The bar's own steps carry their levels (the downbeat, the beats, the subdivisions): the clicks read them through a kit." about=(&bar &clicks)
# The bar is a meter: meter(signature, steps a pulse) writes it as levels — 0 the downbeat (*),
# 1 a beat (+), 2 a half (-), 3 a subdivision (.), 4 finer (,). Its bpm counts beats, however fine
# its steps. Read through &clicks (a kit), each level has its own click: a tonal tick, no noise —
# the downbeat the highest and longest, each finer division lower and shorter.
&bar meter(free(2, 0..7, "2/4 3/4 4/4 5/4 6/8 7/8 9/8 12/8"), free(0, 0..3, "1 2 3 4")) step=free(100bpm, 40..208) swing=8n:free(.5, .5...75) over=&clicks label="**{tempo}** beats a minute"
&clicks &down &beatc &half &sub &fine
&down s=sine loop=G6 pitch=0..7 * &(map=adsr 0 .008 0 0) env=&(map=adsr 0 .07 0 .03)
&beatc s=sine loop=D6 pitch=0..5 * &(map=adsr 0 .006 0 0) env=&(map=adsr 0 .05 0 .025)
&half s=sine loop=A5 pitch=0..3 * &(map=adsr 0 .005 0 0) env=&(map=adsr 0 .035 0 .02)
&sub s=sine loop=E5 env=&(map=adsr 0 .025 0 .015)
&fine s=sine loop=B4 env=&(map=adsr 0 .018 0 .01)
&mix postgain=1.58 map=sample [&bar * free(.8, 0..1)]
\`\`\`
`,"midi-out":`---
title: "MIDI out: a band on a synth"
tags: [tutorial, genre:electronic, MIDI]
tier: 9
description: "The piece names where its notes go: a melody and a bass on a synth's channels 1 and 2, the drums on 10. The bass is sent, not heard."
---

\`\`\`cells
&cardNote label="map=midi makes a MIDI card: its entries are channels, in order: the theme on the reed goes out on 1, the bass on the sub on 2; ~ would skip one. &sub is on no sound card: it plays only on MIDI." about=&synth
&drumNote label="map=midi(10): the whole card on channel 10, the drums by General MIDI note (bd 36, sd 38, hh 42). map=midi(10, 2) would send it to output slot 2, a device chosen in the MIDI page." about=&drums
&bar scan(1 1 1 1) step=104bpm

&theme over=scale(minor, A) step=4n 0 2 4 2 3 1 0 ~
&bass over=scale(minor, A) step=2n 0 5 3 4
&groove step=8n &bd ~ &hh ~ &sd ~ &hh &hh

&reed s=square loop=C4 lpf=1800 env=&(map=adsr .01 .2 .5 .3)
&sub loop=C2
&bd s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0) env=&(map=adsr 0 .3 0 .05)
&sd s=white hpf=1500 env=&(map=adsr 0 .12 0 .05)
&hh s=white hpf=8000 env=&(map=adsr 0 .04 0 .02)

&out map=sample postgain=.891 [&theme * &reed * .5, &groove * .6]
&synth map=midi [&theme * &reed] [&bass * &sub]
&drums map=midi(10) &groove
\`\`\`
`,mirrors:`---
title: "Mirrors: backwards, upside down, in pieces"
tags: [tutorial, motifs, counterpoint]
tier: 5
description: One motif heard forwards, backwards, higher, upside down, and taken apart.
---

\`\`\`cells
&sliceNote label="&m[::-1] is the motif backwards (its retrograde); &m[0:4] its first four steps; &m[-1] its last; &m^$7 all of it seven steps of the grid up (on the twelve, a fifth)." about=&tune
&inverseNote label="inverse(&m) mirrors it within the scale, round its first degree: up becomes down. Played against the tune from the start: a mirror for the motif, and degree(…, 4) for its reverse." about=&answer
&bar scan(1 1 1 1) step=free(andante)
&dorian scale(dorian, D) label="{mode} on {tonic}"

&m 0 1 2 4 3 1 2@2
&tune over=&dorian step=8n &m &m[::-1] &m^$7 &m[0:4]!2 &m[-1]@4
&answer over=&dorian step=8n inverse(&m) degree(inverse(&m), 4) inverse(&m) degree(inverse(&m), 4) 0@8

&flute s=tri loop=D4 env=&(map=adsr .02 .3 .5 .3)
&cello s=saw loop=D3 lpf=1200 env=&(map=adsr .03 .3 .6 .3)
&out map=sample postgain=4.22 [&tune * &flute * .35, &answer * &cello * .25]
\`\`\`
`,moving:`---
title: "Moving parameters: a filter that opens"
tags: [tutorial, sound]
tier: 6
description: A bass line whose filter opens on every note and swells over four bars, with accents and a fade.
---

\`\`\`cells
&rangeNote label="lpf=150..2800 * &fenv * &swell: the cutoff moves in that range, scaled by an envelope on every note and a slow swell." about=&acid
&dbNote label="map=db: a volume in decibels, 0 as it is, −6 about half." about=&fade
&bar scan(1 1 1 1) step=free(moderato)

&line step=16n 0 0 12 0 ~ 0 10 0 0 3 0 ~ 7 0 12 ~
&accent map=amp step=16n 1 .5 .9 .5 0 .6 1 .5 .8 .5 .7 0 1 .5 .9 0
&swell map=lin loop=&bar/4 .2 1 .2
&fade map=db step=1m 0 -3 -6 -3

&acid s=saw loop=C2 lpf=150..2800 * &(map=adsr .002 .15 .1 .05) * &swell lpq=10 env=&(map=adsr .002 .12 .4 .05)
&out map=sample postgain=6.31 [&line * &acid * &accent * &fade * .4]
\`\`\`
`,musicbox:`---
title: Music Box
tags: [tutorial, genre:classical, sound, stereo]
tier: 7
description: "A clockwork music box: wound, it spins up from rest, plays its tune, and as the spring runs down it slows and stops."
---

\`\`\`cells
&springNote label="As the spring runs down it slows, and slows, and stops. Physics, not a ritardando." about=&bar
&drumNote label="Turn the drum forward with your finger to push the tune on; hold it, and the box stops under your hand." about=&bar
# Music Box — the meter is a body that turns: a motor (its spring) pulls it to 96 bpm, its
# mass resists, friction drags; over 36 s the spring runs down, and it coasts to a stop.
# Everything it drives slows with it — the tune, the bass, the tick of the escapement.
&bar scan(1 1 1) step=96bpm motor=6 mass=1.2 friction=.4 wind=36
&major scan(2 2 1 2 2 2 1) label="{mode} on {tonic}"
&tune over=&major step=8n label="the comb" 4 2 0 2 4 4 4@2 3 2 1 2 3 1 -1 1 3 3 3@2 2 1 0@2
&low over=&major step=4n label="the bass" -14 -12 -10 -14 -12 -10!2 -8 -6 -10 -8 -6
&tick step=4n label="the escapement" 0!3

&m s=sine ratio=7.1
&comb oneshot pan=.36 s=sine loop=C5 fm=&m index=.2..1.6 * &(map=adsr .001 .06 .1 .1) room=.35 env=&(map=adsr .001 1.1 0 1)
&combLow oneshot pan=.61 s=sine loop=C5 fm=&m index=.1...8 * &(map=adsr .001 .06 .1 .1) env=&(map=adsr .001 1.4 0 1.2)
&tickv s=white hpf=6500 env=&(map=adsr 0 .012 0 .01)

&out postgain=2.24 map=sample [&tune * &comb * .22, &low * &combLow * .18, &tick * &tickv * .05]
\`\`\`
`,onemore:`---
title: One more Cell
tags: [genre:electronic, genre:dance, artist:Daft Punk, diatonic]
description: "French filter house, an original: maj7 chords chopped in a funky rhythm under one long filter sweep."
---

\`\`\`cells
&chordsNote label="Parallel maj7 chords chopped in a funky sixteenth rhythm, F G A B♭." about=(&chop &prog)
&sweepNote label="One long filter sweep, pumping on every beat." about=(&filt &pump)
&discoNote label="Disco octaves and a robotic lead." about=(&disco &robot)
&fourFloorNote label="Four-on-the-floor." about=&beat
&loopNote label="A loop: open it up and let it ride." about=&song
# One more Cell — the chords are one shape (maj7) moved F G A B♭ (&prog): parallel, as the
# filter-house records did. The pump: the chords duck on every beat (a volume stream).
&bar scan(1 1 1 1) step=free(122bpm, 110..130)
&prog step=1m/2 tags="chords" 0 2 4 5                                        # F G A B♭, two bars each
&c tags="chords" [0,4,7,11]
&chop tags="chords" step=&choppyBar*4 label="the chop" &c ~ &c!2 ~ &c ~ &c ~ &c!2 ~ &c ~ &c!2
&pump tags="chords" map=amp step=4n .35 .55 .75 .95
&disco tags="bass" step=&discBar*2 0 12 0 12 0 12 0 12
&robot tags="robot" step=&robBar*2 label="the robot" ~ 12 14 16 ~ 16 14 12 ~ 14 16 17 ~ 16 14 ~ ~ 12 14 16 ~ 19 17 16 14@2 12@2 9@4
&filt tags="chords" map=lin loop=&bar/32 .06 .3 1 .7 .06
&beat tags="groove" step=&grooveBar*2 &bd &oh [&bd,&cp] &oh &bd &oh [&bd,&cp] &oh   # four on the floor, the clap on two and four, the open hat between
&shake tags="groove" step=&grooveBar*4 0? 0?.7 0? 0?.7

&keys tags="chords" s=square loop=F3 lpf=200..6500 * &filt lpq=5 env=&(map=adsr .003 .12 .5 .06)
&bass tags="bass" s=square loop=F1 lpf=700 env=&(map=adsr .004 .15 .6 .05)
&lead tags="robot" s=square loop=F4 lpf=1400 lpq=9 delaytime=&bar*4/3 delay=.25 delayfeedback=.3 env=&(map=adsr .02 .2 .7 .15) pitch=&(map=lin loop=6 0 .08 0 -.08 0)
&bd tags="groove" gain=.8 oneshot s=sine loop=A1 pitch=0..26 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .3 0 .05)
&cp tags="groove" gain=.3 oneshot s=white hpf=1300 room=.25 env=&(map=adsr 0 .14 0 .06)
&oh tags="groove" gain=.15 s=white hpf=7000 env=&(map=adsr 0 .18 0 .08)
&sh tags="groove" s=white hpf=10000 env=&(map=adsr 0 .03 0 .02)

&sections step=4n &grooveBar &choppyBar &discBar &robBar
&song over=&sections step=1m/8 label="filtered · groove · lead · breakdown" [0,1] [0,1,2] [0,1,2,3] [1,3]

&out postgain=.944 map=sample [&beat, &shake * &sh * .1,
                            (&chop + &prog) * &pump * &keys * .07,
                            (&disco + &prog) * &bass * .35,
                            &robot * &lead * .1]
\`\`\`
`,oscillator:`---
title: An oscillator
tags: [tutorial, sound]
tier: 1
description: "The smallest piece that sounds: one cell turning its braid 440 times a second, held, heard through the built-in card."
---

\`\`\`cells
&a loop=A4
\`\`\`
`,pachelbel:`---
title: "Pachelbel, Canon in D: a ground and three violins"
tags: [genre:classical, artist:Pachelbel, tonal, diatonic, canon, stereo]
description: Eight bass notes, over and over; three violins play one line, each entering a ground later.
---

\`\`\`cells
# Johann Pachelbel, Canon in D. Eight bass notes, over and over (the ground);
# three violins play one line, each entering two bars after the last.
&bar scan(1 1 1 1) step=free(66bpm, 40..100)
&ground step=4n 0 -5 -3 -8 -7 -12 -7 -5                   # D A B F# G D G A — two bars, forever

# the line: three variations of two bars each (D = 0)
&line step=8n show=notes &(16@2 14@2 12@2 11@2 9@2 7@2 9@2 11@2) &(12@2 11@2 9@2 7@2 5@2 4@2 5@2 2@2) &(0 4 7 5 4 0 4 2 0 -3 0 7 5 9 7 5)

&cello s=saw loop=D3 lpf=900 env=&(map=adsr .03 .3 .7 .3)
&violin s=saw loop=D4 lpf=2600 env=&(map=adsr .08 .2 .8 .4) pitch=&(map=lin loop=5 0 .12 0 -.12 0)

# the canon: each violin is the line a variation later ([<<]); each enters a ground later
&out postgain=2.51 map=sample [&ground * &cello * .6,
                                  &line[<<] * &(map=amp step=cycle(&ground) 0 1!11) * &violin * .35,
                                  &line[<<2] * &(map=amp step=cycle(&ground) 0 0 1!10) * &violin * .25] [
                                  &ground * &cello * .6,
                                  &line[<<2] * &(map=amp step=cycle(&ground) 0 0 1!10) * &violin * .25,
                                  &line * &(map=amp step=cycle(&ground) 0 0 0 1!9) * &violin * .35]
&parts scope=spectrum channels=split label="the ground and the canon, each its own" &ground &line
\`\`\`
`,pertonos:`---
title: "Canon per tonos: rising a tone a pass"
tags: [genre:classical, artist:Bach, tonal, canon, stereo]
description: A canon on the royal theme that rises a whole tone each pass, as in the Musical Offering.
---

\`\`\`cells
# After Bach, Musical Offering: "Ascendenteque Modulatione ascendat Gloria Regis".
# The royal theme on top; below it a canon at the fifth, one bar apart;
# and every pass the whole piece rises a whole tone: C D E F# G# A# …
# (Bach's design; the inner voices here are written for this example.)
&bar scan(27 23 26 24) step=free(72bpm, 56..92)
&key step=cycle(&theme) stride=2 cycle=24      # a whole tone per pass: up two octaves, then round
&scale over=&key scan(2 1 2 2 1 2 2)                  # C minor (Aeolian); 6# is the leading tone

&theme over=&scale step=4n 0@2 2@2 4@2 5@2 6#@2 ~ 7 6# 6 5# 5 4@2 ~@2

# the canon: five one-bar motifs, written in place; the cello reads them a bar later (&alto[<<])
&alto over=&scale step=4n &(4 4 7 7) &(7!4) &(8 4 7 5) &(8 7 5# 3) &(8 4 8 8)

&reed pan=.28 s=saw loop=C4 lpf=2600 lpq=1 room=.35 env=&(map=adsr .03 .4 .6 .3) pitch=&(map=lin loop=5 0 .12 0 -.12 0)
&viola pan=.2 loop=C3 lpf=1400 room=.3 env=&(map=adsr .02 .3 .5 .25) 0 1
&cello pan=.81 s=tri loop=C2 env=&(map=adsr .01 .5 .6 .3)

# stereo: each voice placed with its own pan= (the reed and the viola left, the cello right)
&out postgain=1.33 map=sample [&theme * &reed * 0.45, &alto * &viola * 0.3, (&alto[<<] - 7) * &cello * 0.9]   # the cello a bar behind, a fifth below
\`\`\`
`,phase:`---
title: Cell Phase
tags: [genre:experimental, genre:minimal, artist:Steve Reich, modal, rhythm, stereo]
description: "After Steve Reich's Piano Phase, an original: two pianos, one pattern of twelve, slowly slipping apart."
---

\`\`\`cells
&driftNote label="The right one plays 81 notes in the time of the left one's 80 — it slips a note ahead every 81, through all twelve alignments, back to unison after 81 rounds." about=(&left &right)
&woodNote label="A quiet euclid(5, 12) on low wood marks the left player's twelve." about=(&wood &left)
# Cell Phase — no tempo is nudged: the drift is a ratio of clocks. &left steps in sixteenths
# (step=16n); &right in pulse*81/20 — a sixteenth times 80/81. Every 81 of its notes, it's one ahead.
&bar scan(1 1 1) step=free(144bpm, 100..180)
&minor scan(2 1 2 2 1 2 2) label="{mode} on {tonic}"
&pattern 0 2 4 5 7 5 4 2 1 4 7 9
&left over=&minor step=16n label="left: in time" &pattern
&right over=&minor step=pulse*81/20 label="right: 81 notes to the left's 80" &pattern
&wood step=16n label="euclid(5, 12): the left player's twelve" euclid(5, 12)

&mL s=sine ratio=1
&mR s=sine ratio=1
&pianoL pan=.15 s=sine loop=E4 fm=&mL index=.2..1.6 * &(map=adsr .001 .3 .1 .2) room=.25 env=&(map=adsr .002 .6 .2 .2)
&pianoR pan=.85 s=sine loop=E4 fm=&mR index=.2..1.6 * &(map=adsr .001 .3 .1 .2) room=.25 env=&(map=adsr .002 .6 .2 .2)
&woodv s=sine loop=E2 pitch=0..12 * &(map=adsr 0 .03 0 0) env=&(map=adsr 0 .09 0 .04)

&out postgain=1.41 map=sample [&left * &pianoL * .2, &right * &pianoR * .2, &wood * &woodv * .1]
\`\`\`
`,"play-in":`---
title: "Play in: a braid left to the performer"
tags: [tutorial, diatonic]
tier: 9
description: "A riff left to the performer: free(…) around a braid. It plays as written until you play in."
---

\`\`\`cells
&recordNote label="Press ● (record) and play one pass of the riff on the keys: a MIDI keyboard, the computer's (a setting) or the on-screen ones. The take is held in its place; Save writes it into the code, Revert goes back." about=&riff
&lengthNote label="Its length is the frame a take fills: sixteen steps here, a bar of sixteenths." about=&riff
&key scan(2 2 1 2 2 2 1)
&bar scan(1 1 1 1) step=96bpm

&riff over=&key step=16n free(0 2 4 ~ 4 2 0 ~ 0 2 4 ~ 7@2 ~ ~)
&bassline over=&key step=4n 0 3 4 0

&lead s=tri loop=C4 env=&(map=adsr .01 .2 .4 .15)
&bass s=sine loop=C2 env=&(map=adsr .01 .3 .6 .2)
&out map=sample postgain=2.51 [&riff * &lead * .5, &bassline * &bass * .6]
\`\`\`
`,pop:`---
title: "Pop song: four chords, arranged"
tags: [genre:electronic, diatonic, harmony, arrangement]
description: "I – V – vi – IV, arranged by a selector: intro, verses, choruses, a break, an outro, an end."
---

\`\`\`cells
# The four chords: I – V – vi – IV, a bar each, in C. Written as scale degrees
# over the major scale, each chord comes out the right kind: C, G, Am, F.
# Arranged: each part is a section stepped by the bar, and &song switches the sections,
# four bars a step — intro, verses, choruses, a break, an outro and an end.
&bar scan(1 1 1 1) step=free(100bpm, 70..140)
&major scan(2 2 1 2 2 2 1)
&chords tags="keys" over=&major step=&keysBar*2 [0,2,4]!8 [4,6,8]!8 [5,7,9]!8 [3,5,7]!8
&roots tags="bass" over=&major step=&bassBar*2 0!8 4!8 5!8 3!8

&hook tags="hook" 4 4 5 4                                             # the hook …
&tune tags="hook" over=&major step=&hookBar*2 &hook 2@2 0@2 &hook 2@2 ~@2 &hook^1 4@2 2@2 3 3 2 1 0@4           # … a step up in bar 3

&beat tags="drums" step=&beatBar &bd &sd &bd &sd
&hats tags="drums" step=&hatsBar*2 &hh:0:.5 &hh:0:.25 &hh:0:.5 &hh:0:.25 &hh:0:.5 &hh:0:.25 &hh:0:.5 &hh:0:.3

&lead tags="hook" s=square loop=C5 lpf=3000 env=&(map=adsr .01 .2 .6 .2) pitch=&(map=lin loop=5 0 .1 0 -.1 0)
&keys tags="keys" s=tri loop=C4 env=&(map=adsr .005 .3 .3 .2)
&bass tags="bass" s=square loop=C2 lpf=500 env=&(map=adsr .005 .15 .5 .05)
&bd tags="drums" gain=.8 s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .04 0 0) env=&(map=adsr 0 .3 0 .05)
&sd tags="drums" gain=.4 s=white hpf=1200 env=&(map=adsr 0 .15 0 .05)
&hh tags="drums" gain=.2 s=white hpf=8000 env=&(map=adsr 0 .04 0 .02)

&final tags="keys" over=&major step=&endBar [0,2,4,7]@4                  # the last chord: C

# the sections the song switches: four bars a step — a section
# picked starts from its top; a chord of sections plays them together; laps=1: it ends
&sections step=4n &bassBar &keysBar &hookBar &hatsBar &beatBar &endBar
&song over=&sections step=1m/4 laps=1 label="intro · verse · verse · chorus · chorus · break · chorus · chorus · outro · end" [1,3] [0,1,3,4]!2 [0,1,2,3,4]!2 [1,2] [0,1,2,3,4]!2 [1] 5

&out postgain=1.78 map=sample [&hats,
                         &beat,
                         &roots * &bass * .5,
                         &chords * &keys * .15,
                         &tune * &lead * .35,
                         &final * &keys * .2]
\`\`\`
`,prelude:`---
title: "Bach, Prelude in C: for Wendy"
tags: [genre:classical, genre:electronic, artist:Bach, artist:Wendy Carlos, tonal]
description: Bach's Prelude in C (bars 1–19) as one figure reading a table of chords, on an old-school synthesizer.
---

\`\`\`cells
# J. S. Bach, Prelude in C major (Well-Tempered Clavier I), bars 1–19 — on an
# old-school synthesizer, in homage to Wendy Carlos. The whole prelude is one
# figure reading a braid of chords, one a bar, five notes each.
&bar scan(1 1 1 1) step=free(66bpm, 40..100)
&chords step=1m [0,4,7,12,16] [0,2,9,14,17] [-1,2,7,14,17] [0,4,7,12,16] [0,4,9,16,21] [0,2,6,9,14] [-1,2,7,14,19] [-1,0,4,7,12] [-3,0,4,7,12] [-10,-3,2,6,12] [
        -5,-1,2,7,11] [-5,-2,4,7,13] [-7,-3,2,9,14] [-7,-4,2,5,11] [-8,-5,0,7,12] [-8,-7,-3,0,5] [-10,-7,-3,0,5] [-17,-10,-5,-1,5] [-12,-8,-5,0,4]
&figure over=&chords step=16n 0 1 2 3 4 2 3 4         # the figure: twice a bar, in sixteenths

&saw s=saw loop=C4 lpf=1600 lpq=7 env=&(map=adsr .002 .3 .4 .25)    # a resonant sawtooth …
&sub s=square loop=C3 lpf=900 env=&(map=adsr .002 .3 .4 .25)       # … and a square an octave down
&moog [&saw, &sub * .35]

&mix postgain=2.11 map=sample [&figure * &moog * .5]
\`\`\`
`,resonanz:`---
title: "Baustelle II: Resonanz"
tags: [genre:experimental, genre:electronic, genre:industrial, artist:Neubauten, sound, physics, tape]
description: "The building site again, now the metal itself rings: struck plate, beam, wire and spring, and pipes driven by a tape of the site."
---

\`\`\`cells
&strikeNote label="A plate is hammered where the pattern says, a beam struck, a low wire plucked, a spring kicked on the accents." about=(&hammer &plate &beam &girder &pluck &wire &kick &spring)
&siteTapeNote label="A tape loop records the site, and its heads drive two pipes — the site resonating with itself." about=(&tape &pipeA &pipeB)
&touchNote label="Tap the metal to strike it, hold to damp, drag across it to bow." about=(&plate &girder &spring &wire)
# Baustelle II: Resonanz — resonators (body=) struck by notes: a note's value is where (0 … 7).
# &site goes onto a tape (write=); its heads, mixed into &echo, drive the pipes (excite=) —
# sound into bodies. The pipes aren't recorded: no loop through the tape and back.
&bar scan(1 1 1 1) step=104bpm
&reel step=104bpm motor=1.4 mass=1 friction=.1 wow=.02 0
&hammer step=8n label="the hammer: where on the plate" 1 ~ 5 ~ ~ 3 7 ~ 1 ~ ~ 6 ~ 2 ~ 4
&beam step=4n label="the beam" 4 ~ ~ 0 ~ 4 ~ ~
&kick step=2n label="the spring, kicked" 3 ~ ~ 3?
&pluck step=4n label="the wire" 2 ~ 2 2 ~ ~ 6 ~
&plate body=plate loop=D3 ring=3 hard=.85 board=none 0
&girder body=bar loop=G2 ring=2.5 hard=.9 board=none 0
&spring body=spring loop=100 ring=2.5 hard=.7 board=none 0
&wire body=wire loop=D1 ring=3 hard=.6 board=none 0
&site [&hammer * &plate * .35, &beam * &girder * .4, &kick * &spring * .3, &pluck * &wire * .4]

&tape step=&reel write=&site length=5 erase=.3 tone=2400 drive=.4 hiss=.008 label="the tape: five seconds of the site"
&h1 play=&tape at=1.15 label="head 1"
&h2 play=&tape at=2.3 wander=.05 wanderhz=.11 label="head 2, wandering"
&echo [&h1 * .5, &h2 * .5]
&pipeA body=pipe loop=D2 ring=4 board=none excite=&echo label="a pipe, driven by the tape" 0
&pipeB body=pipe loop=A2 ring=4 board=none excite=&echo label="another" 0

&out postgain=.355 map=sample [&site, &pipeA * .4, &h1 * .2] [&site, &pipeB * .4, &h2 * .2]
\`\`\`
`,rests:`---
title: "Rests, holds and repeats: a rhythm on one note"
tags: [tutorial, rhythm]
tier: 1
description: "One note, played as a rhythm: some steps rest, some are held, some are played twice."
---

\`\`\`cells
&restsNote label="~ is a rest, @2 holds a step for two, _ holds the one before it a step longer (0 _ _ is 0@3), !2 plays it twice. step=4 moves four steps a second." about=&rhythm

&rhythm step=4 0 ~ 0 ~ 0!2 ~ 0@2 ~ ~ 0 0 ~ 0 _ _   # one note, in time
&voice s=tri loop=C3
&out map=sample postgain=2 [&rhythm * &voice * .5]
\`\`\`
`,rhythm:`---
title: "Meter and rhythm: the tresillo"
tags: [tutorial, genre:world, rhythm]
tier: 4
description: The tresillo over a meter of its own, with hats, triplets and chords on the beat.
---

\`\`\`cells
# A meter is a scan: the intervals between its beats, adding up to the bar.
# scan(27 23 26 24): beats at 0 27 50 76 % — the first long, the third leaning.
&bar scan(27 23 26 24) step=100bpm             # 4/4, bent
&tresillo label="tresillo: **x..x..x.**" scan(3 3 2) step=2t                # x..x..x. — three strokes a bar: its lap (8) is the bar

# volumes (map=amp) as gates: their steps start the notes, their values set the level
&kick map=amp step=&tresillo:pulse 1
&hats map=amp step=8n 1 .3 .6 .3                    # eighths, accented on the beat
&shake label="triplets: three against two" map=amp step=4t .5 .2 .2                     # triplets: three per two beats
&chord label="chords: {notes}" over=scale(minor) step=2n [0,2,4] [-2,0,2]

# each voice with its envelope (env=, map=adsr: attack decay sustain release)
&bd s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .3 0 .05)
&hh s=white hpf=7000 env=&(map=adsr 0 .04 0 .02)
&sh s=white hpf=4000 env=&(map=adsr 0 .02 0 .02)
&keys s=saw loop=C4 lpf=900 env=&(map=adsr .02 .4 .3 .3)
&mix postgain=1.41 map=sample [&kick * &bd, &hats * &hh * 0.4, &shake * &sh * 0.3, &chord * &keys * 0.5]
\`\`\`
`,ricercar:`---
title: "Ricercar: a study in counterpoint"
tags: [genre:classical, artist:Bach, tonal, counterpoint, stereo]
description: A study in counterpoint on the King's theme, from strict to free, in six passes.
---

\`\`\`cells
&passesNote label="A pass each: 1 the theme alone · 2 note against note, above · 3 note against note, below · 4 two against one · 5 four against one · 6 free, in three voices." about=(&upper &lower)
&consonanceNote label="On every note of the theme the voices agree (consonances only); between, a dissonance only passes, by step." about=(&theme &upper &lower)

&bar scan(27 23 26 24) step=free(66bpm, 40..96) laps=30          # thirty bars: six passes of the theme, then it ends
&theme over=&scale step=4n label="the King's theme" 0@2 2@2 4@2 5@2 6#@2 ~ 7 6# 6 5# 5 4@2 ~@2
&scale over=&key scan(2 1 2 2 1 2 2)                   # … read in C minor,
&key step=cycle(&theme) stride=free(0, 0..7) cycle=24 label="per tonos · in **{tonic}**"   # raise stride: a key higher each pass

# the counterpoints, in semitones over the key (they transpose with the theme), in eighths
&first over=&key label="1 : 1 above — *first species*" 24@4 22@4 19@4 17@4 20@4 ~@2 19@2 20@2 22@2 24@2 20@2 22@4 ~@4
&under over=&key label="1 : 1 below — the bass" -12@4 -13@4 -12@4 -19@4 -17@4 ~@2 -19@2 -16@2 -17@2 -15@2 -13@2 -12@4 ~@4
&second over=&key label="2 : 1 — *second species*" 19@2 17@2 19@2 20@2 19@2 17@2 15@2 17@2 19@2 21@2 ~@2 19@2 20@2 19@2 21@2 17@2 15@2 14@2 ~@4
&third over=&key label="4 : 1 — *third species*" 19 17 19 20 19 17 19 21 19 20 19 21 23 21 22 24 23 21 22 20 ~@2 19 21 23 21 19 17 21 24 23 21 22 20 22 19 ~@4
&florid over=&key label="free, over the bass" 19 17 19 20 19 17 19 20 19 21 22 24 17 20 22 24 23 24 26 23 ~@2 21 24 23 21 19 22 24 22 20 22 24 22 20 19 ~@4

&upper step=8n ~@40 &first ~@40 &second &third &florid        # a pass each: alone · above · (below) · 2:1 · 4:1 · free
&lower step=8n ~@80 &under ~@80 &under                         # the bass: in pass 3, and again under the free line

&organ loop=C4 map=lin 0 1 env=&(map=adsr .03 .25 .7 .6)        # one pipe, one breath: the theme
&flute pan=.28 s=sine loop=C4 env=&(map=adsr .03 .1 .8 .2) pitch=&(map=lin loop=5 0 .08 0 -.08 0)
&bourdon pan=.7 s=tri loop=C4 lpf=900 env=&(map=adsr .02 .15 .8 .3)

&out postgain=3.16 map=sample [&theme * &organ * .5, &upper * &flute * .45, &lower * &bourdon * .5]
\`\`\`
`,royal:`---
title: "Royal theme: all keys and modes"
tags: [genre:classical, artist:Bach, modal, chromatic, harmony]
description: Bach's royal theme through every key in fifths, then every mode.
---

\`\`\`cells
# Bach's royal theme. Every pass of &theme moves &key a fifth (C G D A …);
# every full circle of &key (12 passes) moves &scale one degree.
&bar scan(27 23 26 24) step=free(84bpm, 60..120)               # the clock: 4/4, bent * . + .
&key step=cycle(&theme) stride=7            # the 12, a fifth per pass, round the circle
&scale over=&key scan(2 1 2 2 1 2 2) step=cycle(&key)           # Aeolian, a degree per circle, all seven

&theme over=&scale step=4n 0@2 2@2 4@2 5@2 6#@2 ~ 7 6# 6 5# 5 4@2 ~@2
&pedal over=&scale step=2n 0                  # one note every two beats

# voices: loop= is pitch 0 (turns per second); sound in dough notation
&lead s=saw loop=C4 lpf=2200 lpq=2 room=.3 env=&(map=adsr .01 .3 .4 .4) pitch=&(map=lin loop=5 0 .15 0 -.15 0)
&bass s=tri loop=C2 env=&(map=adsr .01 .5 .5 .3)

&mix postgain=2.51 map=sample [&theme * &lead * 0.6, &pedal * &bass * 0.7]                          # the sound card: two channels, the same mix
\`\`\`
`,sailor:`---
title: "Drunken Sailor: D Dorian, with a kit"
tags: [genre:world, genre:folk, modal, rhythm]
description: Drunken Sailor in D Dorian, with a fiddle, a bass and a drum kit.
---

\`\`\`cells
# D Dorian. The second line is the first, a step lower: &A^-1.
&bar scan(1 1 1 1) step=free(112bpm, 90..140)
&dorian scale(dorian, D)

&m1 4!4
&m2 4 4 0 2
&m3 3 2 0 0
&m4 0@2!2
&A &m1 &m2
&C &m3 &m4
&tune over=&dorian step=8n &A &A^-1 &A &C

&bassline over=&dorian step=4n 4!4 3!4
&drums step=8n &bd &hh &sd &hh!4           # kick, hat, snare, hat

&fiddle s=saw loop=C5 lpf=3000 env=&(map=adsr .01 .15 .5 .1)
&bass s=square loop=C2 lpf=600 env=&(map=adsr .005 .25 0 .05)
&bd s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .3 0 .05)
&sd s=white hpf=1500 env=&(map=adsr 0 .12 0 .04)
&hh s=white hpf=7000 env=&(map=adsr 0 .04 0 .02)
&mix postgain=1.78 map=sample [&tune * &fiddle * 0.6, &bassline * &bass * 0.8, &drums * 0.6]
\`\`\`
`,semitones:`---
title: "Semitones: a scale up and down"
tags: [tutorial, diatonic]
tier: 1
description: "A number is a note: so many semitones above the voice's own. Up the C major scale and back."
---

\`\`\`cells
&semitonesNote label="0 is the voice's note, 1 a semitone above it, 12 an octave; a minus goes below. The scale skips the semitones between E and F and between B and C." about=&climb

&climb step=6 0 2 4 5 7 9 11 12 11 9 7 5 4 2 0 -5 0@2   # the scale, then the fifth below C and home
&voice s=sine loop=C4
&out map=sample postgain=2 [&climb * &voice * .5]
\`\`\`
`,soundtape:`---
title: Sound on Tape
tags: [genre:experimental, genre:electronic, genre:ambient, sound, tape]
description: "Sound, on a tape loop: a plucked tune and a soft pad go to the speakers and onto a wowing reel of tape."
---

\`\`\`cells
&lengthNote label="The tape holds 4 seconds; every lap it comes round darker and warmer, a little hiss under it." about=&tape
&headsNote label="Three heads play the tape back, left, right and between." about=(&left &right &far)
&reelNote label="Hold the reel: the whole tape bends down." about=&reel
# Sound on Tape — &tape records a mix (write=&dry): sound, not notes. Its loop (length=) feeds
# back into itself, keeping 1 − erase each lap, through its loss (tone=, Hz) and saturation
# (drive=), with a little hiss=. The read heads are readers; in a mix they return to the speakers.
# The tape moves with &reel: when the reel slows, the heads' delays stretch and the pitch drops.
&reel step=72bpm motor=1.2 mass=1 friction=.05 wow=.02 0
&bar scan(1 1 1 1) step=72bpm
&minor scan(2 1 2 2 1 2 2) label="{mode} on {tonic}"
&tune over=&minor step=8n label="the tune" 0 ~ 7 ~!2 4 ~!2 2 ~!7 9 ~ 7 ~ 4 ~!3 2 ~ 0 ~!5
&pad over=&minor step=1m/2 label="the pad" [0,2,4] [-2,0,2]
&pluck s=tri loop=D4 lpf=2600 env=&(map=adsr .003 .5 0 .4)
&soft s=saw loop=D3 lpf=700 env=&(map=adsr 1.5 1 .8 3)
&dry [&tune * &pluck * .25, &pad * &soft * .05]
&tape step=&reel write=&dry length=4 erase=.35 tone=3200 drive=.35 hiss=.006 label="the tape: 4 s"
&left play=&tape at=.75 label="head 1"
&right play=&tape at=1.5 label="head 2"
&far play=&tape at=2.75 label="head 3"

&out postgain=12.6 map=sample [&dry, &left * .5, &far * .35] [&dry, &right * .5, &far * .35]
\`\`\`
`,steps:`---
title: "Steps: a tune on one line"
tags: [tutorial, genre:folk]
tier: 1
description: "Frère Jacques written as steps: numbers, rests, holds and repeats, four steps a second."
---

\`\`\`cells
&stepsNote label="A number is a step: so many semitones above the voice's note. ~ is a rest, @2 holds a step for two, !2 plays it twice." about=&tune
&outNote label="The sound card: map=sample turns what it plays into samples, at the rate the computer plays them (loop=SAMPLE_RATE). One chord in its brackets: one channel, mono." about=&out
# &tune moves at step=4: four steps a second. Its numbers are semitones above the voice's C.
&tune step=4 0 2 4 0 0 2 4 0 4 5 7@2 4 5 7@2 7 9 7 5 4 ~ 0 ~ 7 9 7 5 4 ~ 0 ~ 0!2 -5 0@2 0!2 -5 0@2

&voice s=sine loop=C4                           # a voice: a sine, on C4
&out loop=SAMPLE_RATE map=sample postgain=2 [&tune * &voice * .5]
\`\`\`
`,stereo:`---
title: "Stereo: Mary Had a Little Lamb"
tags: [tutorial, genre:world, genre:folk, pentatonic, stereo]
tier: 6
description: "Mary Had a Little Lamb across two channels: the bell on the left, the cello on the right."
---

\`\`\`cells
&glideNote label="glide=.12: the cello bows its line, each note sliding on from the last in .12 s, its envelope once (no new attack). A rest or a chord would end the run." about=&cello
# pan= places a voice between the sound card's two channels: 0 left, .5 the centre (as
# without it), 1 right; the far side fades. .15: the left full, the right at .3.
&bar scan(27 23 26 24) step=92bpm
&high label="*Mary had a little lamb*" over=scale(major) step=4n 2 1 0 1 2 2 2@2
&low over=scale(major) step=2n 0 3 4 0

&bell s=sine loop=C5 pan=.15 env=&(map=adsr .01 .6 .2 .6)
&cello glide=.12 s=saw loop=C3 lpf=900 pan=.85 env=&(map=adsr .03 .4 .6 .4)
&out postgain=1.19 map=sample [&high * &bell, &low * &cello]
\`\`\`
`,studie:`---
title: "Study after Studie II: 25 steps to 5:1"
tags: [genre:experimental, genre:electronic, artist:Stockhausen, microtonal, tuning, stereo]
description: Sine mixtures on Stockhausen's scale of 25 equal steps to 5:1, with durations from the same series.
---

\`\`\`cells
# An original study in the system of Stockhausen's Studie II (1954): sine tones on
# a scale of 25 equal steps to 5:1 from 100 Hz — not octaves — sounding as tone
# mixtures, five sines a fixed number of steps apart. The durations come from the
# same series (geo: 5^(k/25), k = 0 10 5 20 15), the intensities in decibels.
# One player goes forward, swelling; the other plays it backwards, eight steps higher, fading.
&time scan(geo(5, 25, 0 10 5 20 15)) step=free(24bpm, 12..48)  # five durations: 5^(k/25)
&dyn map=db step=4n 0 -10 -4 -16 -8                              # their intensities, in decibels
&steps cycle=25 map=ed(5)                                        # 25 steps to 5:1

# the five mixtures: five sines, 1 to 5 steps apart …
&m1 label="mixture: 1 step apart" [0,1,2,3,4]
&m2 label="mixture: 2 steps apart" [0,2,4,6,8]
&m3 label="mixture: 3 steps apart" [0,3,6,9,12]
&m4 label="mixture: 4 steps apart" [0,4,8,12,16]
&m5 label="mixture: 5 steps apart" [0,5,10,15,20]
&mixtures &m1 &m2^$30 &m3^$12 &m4^$50 &m5^$20                       # … each on its step of the scale
&forward over=&steps step=4n &mixtures
&backward over=&steps step=4n &mixtures[::-1]^$8                 # retrograde, eight steps higher

&swell pan=.14 s=sine loop=100 env=&(map=adsr 1.5 .5 .8 1.5)            # 100 Hz: the scale's first tone
&fade pan=.86 s=sine loop=100 env=&(map=adsr .01 1.5 .3 1.5)

&out postgain=5.62 map=sample [&forward * &dyn * &swell * .07, &backward * &fade * .07]
\`\`\`
`,swing:`---
title: "Swing: the long and the short"
tags: [tutorial, rhythm]
tier: 4
description: "Eighths played long and short: a swing clock, and the same feel from swing= on the bar."
---

\`\`\`cells
&clockNote label="&swing is a clock of its own: scan(2 1), a long step and a short, two to a beat. What steps with it swings." about=&swing
&swingNote label="swing=8n:.67 on a bar says the same: its eighths lean, the second of each pair two thirds of the way through its beat, and every beat stays where it is. &comp taps it by the eighth, &bar2:8n." about=&bar2
&bar scan(1 1 1 1) step=free(moderato)
&swing scan(2 1) step=4n                         # long, short: a pair a beat
&bar2 meter("4/4", 2) step=free(moderato) swing=8n:.67   # the same, written on the bar: its eighths

&walk over=scale(major, G) step=4n 0 2 4 5 7 5 4 2
&ride step=&swing:pulse 12!3 ~ 12!3 ~
&comp over=scale(major, G) step=&bar2:8n ~ [2,4,6] ~!3 [2,4,6] ~ [2,4,6]

&bass s=sine loop=G2 env=&(map=adsr .01 .4 .5 .1)
&cym s=white hpf=7000 env=&(map=adsr 0 .2 0 .1)
&piano s=tri loop=G3 env=&(map=adsr .005 .4 .2 .2)
&out map=sample postgain=1.88 [&walk * &bass * .5, &ride * &cym * .1, &comp * &piano * .15]
\`\`\`
`,sympathy:`---
title: "Sympathy: resonators that answer"
tags: [tutorial, sound, physics]
tier: 7
description: A struck fork sets its twin singing, and a harp's strings answer a flute they are never plucked by.
---

\`\`\`cells
&coupleNote label="couple=&forkB: the two forks share a table, and coupling= says how strongly; only &forkA is struck." about=(&forkA &forkB)
&exciteNote label="excite=&played: the flute's sound drives the strings, which ring where it meets their notes." about=&strings
&bar scan(1 1 1 1) step=72bpm
&minor scale(minor, A)

&hits step=1m/2 0
&tune over=&minor step=4n 4 ~ 2 ~ 0@2 ~@2 2 4 7 ~ 4@4

&forkA body=fork loop=A4 ring=8 hard=.35 board=none couple=&forkB coupling=.08 0
&forkB body=fork loop=A4 ring=8 hard=.35 board=none 0
&flute s=tri loop=A4 env=&(map=adsr .05 .3 .6 .4)
&played [&tune * &flute * .2]
&strings body=wire loop=A2 ring=4 board=none excite=&played 0 7 12 19

&out map=sample postgain=.422 [&hits * &forkA * .4, &forkB * .4, &played, &strings * .3]
\`\`\`
`,tape:`---
title: Tape Machine
tags: [genre:electronic, genre:ambient, sound, stereo, tape]
description: "A tape loop on a machine that turns: it spins up from rest, the pitch gliding up with it, and wows gently."
---

\`\`\`cells
&capstanNote label="Hold the capstan with your finger: a tape stop, the pitch diving; let go and it spins back up." about=&bar
&slackNote label="The hats ride a slack belt, dragging behind." about=&hats
&springEndNote label="At the end the spring gives out and the tape stops for good." about=&bar
# Tape Machine — the meter is the capstan: a motor (spinning up from rest), a little wow (its
# speed swings 0.55 times a second), varispeed=1 (pitch follows speed, as on tape), and a spring
# that holds for 40 s, then gives out: a tape stop. The hats ride a slack belt: they lag, then swing.
&bar scan(1 1 1 1) step=78bpm motor=1.4 mass=1 friction=.3 wow=.012 wind=40 varispeed=1
&minor scan(2 1 2 2 1 2 2) label="{mode} on {tonic}"
&loop over=&minor step=8n label="the loop" 4 ~ 2 0 ~ 2 4 7@2 ~ 6 4 2 ~ 4@2 -1 ~
&chords over=&minor step=1m label="i · VI" [0,2,4,6] [-2,0,2,4]
&hats step=8n belt=30 mass=1.5 label="the hats, on a slack belt" ~ 0 ~ 0 ~ 0 ~ 0
&kick step=4n 0 ~ 0 ~

&keys pan=.375 s=tri loop=D4 lpf=2200 room=.4 delaytime=&bar*4/3 delay=.3 delayfeedback=.4 env=&(map=adsr .004 .5 .3 .4)
&pad s=saw loop=D3 lpf=700 room=.6 env=&(map=adsr 1 1 .8 2)
&hh pan=.6 s=white hpf=7000 env=&(map=adsr 0 .04 0 .02)
&bd s=sine loop=D1 pitch=0..16 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .3 0 .05)

&out postgain=2.24 map=sample [&loop * &keys * .16, &chords * &pad * .05, &hats * &hh * .1, &kick * &bd * .5]
\`\`\`
`,testtones:`---
title: Test Tones on Tape
tags: [genre:experimental, genre:electronic, genre:ambient, sound, tape]
description: "For the test bench, in the spirit of Hainbach: old sine generators, a beeping oscillator and a noise sweep, all onto worn tape."
---

\`\`\`cells
&generatorNote label="Old sine generators holding drifting tones on a harmonic dial." about=(&drones &dial &drift)
&beepNote label="A beeping test oscillator." about=&beeps
&swellNote label="Swells from a noise sweep." about=&swells
&wornNote label="Seven seconds of worn tape that hardly erases; hiss, print-through, dropouts. Everything piles up into ghosts." about=&loop
&wanderNote label="Three heads, two of them wandering." about=(&first &second &third)
&reelNote label="Hold the reel to bend it all; at the end the motor dies, and the tape stops." about=&reel
# Test Tones on Tape — an original. The tape (&loop) records the bench (&bench, a mix): 7 tape-
# seconds that keep 84% each lap (erase=.16), worn (tone=), driven, hissing, printing through,
# dropping out. Two heads wander (flying heads). The reel is a motor with wow; its spring
# (wind=) gives out after two and a half minutes: the tape stop is the ending. &scope, the test
# bench's oscilloscope, shows what goes on the tape and what two of its heads read back.
&reel step=60bpm motor=1 mass=1.4 friction=.2 wow=.025 wind=150 0
&bar scan(1 1 1 1) step=60bpm
&dial map=ratios 1 1.5 2 2.25 3 3.75 4.5 6 8 label="the dial: a harmonic series, on 110 Hz"
&drones over=&dial step=1m label="the sine generator: long tones" 0 ~ [1,4] ~ 2 [0,5] ~ 3 ~ [2,6] ~ ~
&drift map=lin loop=.031 0 .08 0 -.11 0
&beeps over=&dial step=8n label="the test oscillator" 7? ~!3 8?.7 ~!4 6? ~!6
&swells step=1m/2 label="the noise sweep" 0 ~ ~ 0
&sweep map=lin loop=.0625 .05 1 .2 .05

&gen s=sine loop=110 env=&(map=adsr 2 1 .9 3)
&osc s=sine loop=110 env=&(map=adsr .005 .18 0 .1)
&noise s=pink lpf=200..3000 * &sweep lpq=8 env=&(map=adsr 3 2 .7 4)
&bench [(&drones + &drift) * &gen * .16, &beeps * &osc * .06, &swells * &noise * .12]

&loop step=&reel write=&bench length=7 erase=.22 tone=1900 drive=.55 hiss=.004 print=.03 printgap=.7 dropout=.25 label="the tape: seven seconds, worn"
&scope scope=split label="the oscilloscope: the bench, the first head, the far one" &bench &first &third
&first play=&loop at=1.1 label="head 1"
&second play=&loop at=2.9 wander=.06 wanderhz=.13 label="head 2, wandering"
&third play=&loop at=5.3 wander=.15 wanderhz=.07 label="head 3, wandering further"

&out postgain=20 map=sample [&bench * .35, &first * .5, &third * .45] [
                                  &bench * .35, &second * .5, &third * .45]
\`\`\`
`,tines:`---
title: Cell Tines
tags: [genre:electronic, diatonic, FM, sound, stereo]
description: "FM, after the DX7: an electric piano, bells and a punchy bass, all made by frequency modulation."
---

\`\`\`cells
&pianoNote label="An electric piano of two pairs: a body at 1:1, a tine at 14:1 that barks on the attack." about=(&body &tine)
&bellNote label="Bells at 3.5:1." about=(&tune &bell)
&bassNote label="A punchy FM bass." about=(&fmbass &low)
&indexNote label="Each brightness is an index under an envelope: bright on the attack, mellowing as it rings." about=(&body &tine &bell &fmbass)
&chordNote label="Fmaj7 · Em7 · Dm7 · Cmaj7." about=&comp
# Cell Tines — frequency modulation: a modulator (a voice with ratio=) swings its carrier's
# frequency (fm=&op) by index × its own frequency. Whole-number ratios sound harmonic
# (pianos, basses), others not (bells). The index moves: index=lo..hi * &envelope.
&bar scan(1 1 1 1) step=free(84bpm, 60..110)
&major scan(2 2 1 2 2 2 1)
&chord [0,2,4,6]@3 [0,2,4,6] ~@2 [0,2,4,6]@2                    # a seventh chord, in its rhythm
&comp over=&major step=8n label="the piano: Fmaj7 · Em7 · Dm7 · Cmaj7" &chord^3 &chord^2 &chord^1 &chord
&tune over=&major step=8n label="the bells" ~@2 9 11 12@4 ~@2 11 9 8@4 ~@2 7 8 9 8 7 5 4@4 ~@4
&low over=&major step=4n -11 ~ -11 -10 -12 ~ -12 -11 -13 ~ -13 -12 -14 ~ -14 -10

&m1 s=sine ratio=1
&m2 s=sine ratio=14
&m3 s=sine ratio=3.5
&m4 s=sine ratio=1
&body s=sine loop=C4 fm=&m1 index=.3..2.6 * &(map=adsr .002 .9 .3 .6) room=.3 env=&(map=adsr .002 1.6 .35 .8)
&tine pan=.33 s=sine loop=C4 fm=&m2 index=0..2.2 * &(map=adsr .001 .1 0 .1) env=&(map=adsr .001 .45 0 .3)
&bell oneshot pan=.38 s=sine loop=C5 fm=&m3 index=.8..6 * &(map=adsr .001 1.4 .15 1.2) room=.5 delaytime=&bar*4/3 delay=.3 delayfeedback=.35 env=&(map=adsr .002 3 0 2.5)
&fmbass s=sine loop=C2 fm=&m4 index=.6..5 * &(map=adsr .001 .18 .15 .1) env=&(map=adsr .003 .4 .5 .1)

&out postgain=4.47 map=sample [&comp * &body * .055, &comp * &tine * .03, &tune * &bell * .12, &low * &fmbass * .35]
\`\`\`
`,tone:`---
title: "A tone: one note, one voice"
tags: [tutorial, sound]
tier: 1
description: "The smallest piece that sounds: a note every second, played by a sine on A4."
---

\`\`\`cells
&toneNote label="Three cells make a sound. A melody (&note: step=1, a step a second, its 0 the voice's own note), a voice (&voice: a sine, on A4) and the sound card (&out), which plays the melody through the voice." about=(&note &voice &out)

&note step=1 0
&voice s=sine loop=A4
&out map=sample postgain=2 [&note * &voice]
\`\`\`
`,transpose:`---
title: "Key and mode: one theme, two wheels"
tags: [tutorial, genre:classical, modal, diatonic, harmony]
tier: 3
description: One theme, read through a mode and a key.
---

\`\`\`cells
&turnNote label="Turn either, and the theme follows." about=(&key &mode)
# The mechanism on its own: a theme read through two wheels.
# Change shift= on &key or &mode — the theme follows.
&bar scan(1 1 1 1) step=96bpm

&key label="key: **{tonic}**" shift=2 size=1.5                # the 12, turned two: D. Turning it transposes
&mode label="{mode} on {tonic}\\n{notes}" over=&key scan(2 2 1 2 2 2 1) shift=1   # turned one: it walks the modes
&fixed label="fixed for a piece, in one line: {mode} on {tonic}" scale(dorian, E)   # the same seven notes: a key and a mode in one, the tonic its argument
&theme label="the theme: {notes}" show=notes over=&mode step=4n 0 2 4 7 4 2 0@2

&flute s=tri loop=C4 room=.3 env=&(map=adsr .02 .3 .5 .3)
&mix postgain=2.11 map=sample [&theme * &flute]
\`\`\`
`,twinkle:`---
title: "Motifs and reuse: Twinkle Twinkle"
tags: [tutorial, genre:classical, genre:folk, diatonic, motifs]
tier: 3
description: Twinkle Twinkle from three motifs, one of them read a step up the scale, in solfège.
---

\`\`\`cells
# Three motifs make the whole tune. The middle line is &down again,
# a step up the scale: &down^1.
&bar scan(1 1 1 1) step=96bpm
&scale label="{mode} on {tonic}" scale(major)                 # C major

&up label="*twinkle twinkle, little star*" 0 0 4 4 5 5 4@2                    # twin-kle twin-kle lit-tle star
&down label="*how I wonder what you are*" 3 3 2 2 1 1 0@2                  # how I won-der what you are
&mid label="*up above the world so high*" &down^1                # up a-bove the world so high
&tune over=&scale step=4n show=do &up &down &mid!2 &up &down         # show=do: in solfège, motifs and all

&bu 0 0 3 0
&bd 3 0 4 0
&roots over=&scale step=2n &bu &bd &bu^1!2 &bu &bd       # the bass moves the same way

&lead s=tri loop=C5 env=&(map=adsr .01 .3 .4 .3)
&bass s=sine loop=C3 env=&(map=adsr .005 .5 .5 .1)
&mix postgain=1.58 map=sample [&tune * &lead, &roots * &bass * 0.8]
\`\`\`
`,twovoices:`---
title: "Two voices: a mix"
tags: [tutorial, sound]
tier: 1
description: "One tune, played by two voices at once: a sine on top and a saw three octaves below it, quieter."
---

\`\`\`cells
&twovoicesNote label="A chord in the brackets is a mix: the sound card plays what is in it at once. * .5 and * .25 are gains: how loud each voice is in the mix." about=&out

&tune step=3 0 4 7 4 0 4 7@2 5 9 12 9 5 9 12@2   # a tune
&lead s=sine loop=C5
&bass s=saw loop=C2
&out map=sample postgain=2 [&tune * &lead * .5, &tune * &bass * .25]
\`\`\`
`,variations:`---
title: "Variations: a subject and its copies"
tags: [tutorial, motifs, counterpoint]
tier: 5
description: "One subject entered three times, as a fugue begins: as it is, a fifth up with its leap bent (a tonal answer), and an octave down with its last note held. Each entry after the first is a copy of the subject, written as what changes."
---

\`\`\`cells
&copyNote label="base=&subject makes a cell a copy of &subject. = keeps a step as it is there, a value changes it, =!n keeps n of them and =@n keeps one held n; base=&subject^$7 is the copy a fifth up." about=(&answer &low)
&bar scan(1 1 1 1) step=free(andante)

&subject 0 -1 0@2 -5@2 -4@2 0 -1 0 2 -5@4
&answer base=&subject^$7 =!3 0@2
&low base=&subject^$-12 =!9 =@8

&alto step=16n &subject ~@36
&soprano step=16n ~@16 &answer ~@20
&bass step=16n ~@32 &low

&flute s=tri loop=C5 env=&(map=adsr .02 .3 .5 .3)
&reed s=tri loop=C4 env=&(map=adsr .02 .3 .5 .3)
&cello s=saw loop=C3 lpf=1200 env=&(map=adsr .03 .3 .6 .3)
&out map=sample postgain=3.98 [&soprano * &flute * .3, &alto * &reed * .3, &bass * &cello * .25]
\`\`\`
`,voice:`---
title: "A voice: a source and an envelope"
tags: [tutorial, sound]
tier: 2
description: "Four voices, each a source and an envelope: a pluck, a swell, a bass and a breath."
---

\`\`\`cells
&sourceNote label="s= is the source: sine, tri, saw, square, pulse, or a noise (white, pink, brown); loop=C4 is its note." about=(&pluck &pad &low &air)
&envNote label="env= is its volume on every note: map=adsr, attack, decay and release in seconds, sustain a level. Written where it is used, &( … ) is a cell without a name." about=&pluck
&bar scan(1 1 1 1) step=free(moderato)

&tune step=8n 0 4 7 12 7 4 0 ~ 2 5 9 14 9 5 2 ~
&line step=2n 7 9 5 7
&bass step=4n 0 0 7 0 2 2 9 2

&pluck s=tri loop=C4 env=&(map=adsr .005 .3 .1 .2)        # quick to start, quick to fade: a pluck
&pad s=saw loop=C4 env=&(map=adsr .5 .3 .6 .8)            # slow in, held, slow out: a swell
&low s=square loop=C2 env=&(map=adsr .005 .2 .6 .1)
&air s=pink env=&(map=adsr .3 .2 .5 .6)                   # a noise: no note of its own
&out map=sample postgain=6.31 [&tune * &pluck * .3, &line * &pad * .06, &bass * &low * .12, &line * &air * .04]
\`\`\`
`,waltz:`---
title: "Viennese waltz: oom-pah-pah"
tags: [genre:classical, tonal, rhythm]
description: "A waltz in G: oom on one, pah-pah on two and three, a flute above."
---

\`\`\`cells
# scan(28 37 35) pulls beat 2 early: short – long – long
&bar scan(28 37 35) step=free(168bpm, 140..200)
&tune over=scale(major, G) step=4n 2 4 7 7@2 6 5@2 4 1@3 1 4 6 6@2 5 4@2 1 0@3      # G major

# oom-pah-pah: motifs with no over= read through whoever plays them
&I 0 ~ ~
&V -3 ~ ~
&oom over=scale(major, G) step=4n &I!3 &V!4 &I
&i ~ [0,2,4]!2
&v ~ [-3,-1,1]!2
&pah over=scale(major, G) step=4n &i!3 &v!4 &i

&flute s=tri loop=C4 room=.4 env=&(map=adsr .03 .2 .6 .3)
&tuba s=sine loop=C2 env=&(map=adsr .005 .4 0 .1)
&strings s=square loop=C4 lpf=1200 room=.5 env=&(map=adsr .02 .15 .3 .2)
&mix postgain=1.26 map=sample [&tune * &flute, &oom * &tuba, &pah * &strings * free(.4, 0..1)]
&oompah scope=spectrum label="oom-pah: the bass and the chords, one tonal spectrum" &oom &pah
\`\`\`
`,waveforms:`---
title: "Sound: voices, waveforms, envelopes"
tags: [tutorial, genre:electronic, sound]
tier: 6
description: "Voices made of braids: square, triangle, saw and sine, with envelopes and a vibrato."
---

\`\`\`cells
# A voice is a cell looped at audio rate: one turn of its braid is one cycle
# of its waveform. Its pitch and its volume are cells too.
&bar scan(1 1 1 1) step=100bpm
&tune over=scale(major) step=8n 0 2 4 7 4 2 0 ~ 4 5 7 9 7 5 4 ~
&roots over=scale(major) step=1m 0 3 4 0

&square label="square: two values, held" loop=C4 0 1                          # held, lerped to −1…1: a square
&tri label="triangle: the same, ramped" loop=C4 map=lin 0 1                     # the same two values, ramped: a triangle
&sine label="sine: sin(12)" loop=C4 sin(12)                        # one cycle of a sine in 12 steps
&saw label="saw: 0…11, ramped" loop=C2 map=lin env=&(map=adsr .04 .3 .6 .5)   # no braid: 0…11 of the grid, ramped: a saw — with its envelope

&curve 0 1 .3 -1
&shaped label="map=&curve: each value looked up in &curve" loop=262hz map=&curve 0 1 2 3   # 262 times a second: a C
&chip label="step=8k: a braid as samples, eight thousand a second" step=8k 1!2 -1!2    # 2000 Hz, square

&vibrato label="vibrato: ±0.3, gliding" map=lin loop=5 0 .3 0 -.3 0         # a pitch, added, gliding
&pluck label="a volume, per note" map=lin loop=&tune 1 .4 0             # a volume, one shape per note of &tune

# an instrument: a mix used like a voice — the saw, and a sine an octave below
&bass [&saw, &(loop=C1 sin(12)) * 0.6]

&mix postgain=1.06 map=sample [(&tune + &vibrato) * &pluck * &square,                    # try &tri or &sine
                                  &roots * &bass]
\`\`\`
`,worn:`---
title: Sound on a worn tape
tags: [tutorial, sound, tape]
tier: 8
description: A flute recorded onto a worn tape loop and played back by two heads, one of them wandering.
---

\`\`\`cells
&wornNote label="A tape that records a mix records its sound: tone= darkens it each pass, drive= saturates it, hiss= is its noise; print= a faint pre-echo printgap= ahead; dropout= brief gaps." about=&tape
&wanderNote label="wander= lets a head drift either way along the tape, wanderhz= times a second: a flying head." about=&far
&reel step=72bpm motor=1 mass=1 friction=.1 wow=.02 0
&bar scan(1 1 1 1) step=72bpm
&minor scale(minor, D)

&tune over=&minor step=8n 0 ~ 4 ~ 7 ~!3 6 ~ 4 ~ 2 ~!3 0 ~ 1 2 4 ~!3

&flute s=tri loop=D4 env=&(map=adsr .02 .4 .3 .4)
&dry [&tune * &flute * .3]
&tape step=&reel write=&dry length=4 erase=.35 tone=2600 drive=.4 hiss=.005 print=.03 printgap=.6 dropout=.2
&near play=&tape at=1
&far play=&tape at=2.5 wander=.08 wanderhz=.15

&out map=sample postgain=10 [&dry, &near * .5] [&dry, &far * .5]
\`\`\`
`,zell:`---
title: Zelluläre Aktivität
tags: [genre:electronic, artist:Kraftwerk, diatonic, arrangement]
description: Zelluläre Aktivität — it builds, layer by layer, and ends.
---

\`\`\`cells
# Zelluläre Aktivität — in the manner of Kraftwerk, an original. Am – F – C – G, two
# bars each. The bass's octaves move through the chords by transposing (&oct^$-4: four
# semitones down, F); the arpeggio by moving its shape up the scale (&shape^5:
# the same shape on its sixth step) — chromatic and diatonic, side by side. A slow filter
# sweep over the arpeggio; a plain melody with echoes in time.
&aufbauNote label="It builds, layer by layer: &lied reads the parts, eight bars a step." about=&lied
&progressionNote label="Am – F – C – G." about=(&bassline &arp)
&bassNote label="Bass: octaves, transposed (^n)." about=&bassline
&arpNote label="Arpeggio: one shape, read on the chord's step of the scale." about=(&shape &arp)
&melodyNote label="Melody: plain, with echoes in time (delaytime=&bar)." about=(&melody &lead)
&bar scan(1 1 1 1) step=free(112bpm, 90..140)
&minor scan(2 1 2 2 1 2 2)                                   # A minor (the voices sit on A)

&oct tags="bass" 0 12 0 12 0 12 0 12                                     # Oktaven: a bar of eighths
&bassline tags="bass" step=&bassBar*2 label="Bass: Oktaven" &oct!2 &oct^$-4!2 &oct^$3!2 &oct^$-2!2   # A · F · C · G

&shape tags="arpeggio" 0 2 4 7                                               # a chord's tones, up (degrees)
&arp tags="arpeggio" over=&minor step=&arpBar*4 label="Arpeggio" &shape!8 &shape^5!8 &shape^2!8 &shape^6!8   # on A, F, C, G
&sweep tags="arpeggio" map=lin loop=&bar/16 .1 1 .1

&melody tags="melody" over=&minor step=&melodyBar label="Melodie" 4@2 2 1 0@4 5@2 4 2 4@4 2@2 1 0 1@4 6@2 4 3 4@4

&beat tags="beat" step=&beatBar &bd &sd &bd &sd
&ticks tags="beat" map=amp step=&ticksBar*4 .5 .2 .3 .2 .5 .2 .3 .6

&bass tags="bass" s=square loop=A1 lpf=600 env=&(map=adsr .005 .12 .5 .05)
&arpeggio tags="arpeggio" s=square loop=A3 lpf=300..4000 * &sweep lpq=4 env=&(map=adsr .002 .1 .2 .05)
&lead tags="melody" s=saw loop=A4 lpf=2200 delaytime=&bar delay=.3 delayfeedback=.3 room=.2 env=&(map=adsr .03 .2 .7 .2)
&bd tags="beat" gain=.8 s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .25 0 .05)
&sd tags="beat" gain=.35 s=white hpf=1200 env=&(map=adsr 0 .14 0 .05)
&metal tags="beat" s=square loop=A7 hpf=5000 env=&(map=adsr 0 .03 0 .02)

# Aufbau: the sections the song stacks — eight bars (the progression) a step
&teile step=4n &beatBar &ticksBar &bassBar &arpBar &melodyBar
&lied over=&teile step=1m/8 laps=1 label="Aufbau: Klick · Bass · Takt · Arpeggio · Melodie · Pause · alles · Klick" 1 [1,2] [0,1,2] [0,1,2,3] [0,1,2,3,4] [2,3] [0,1,2,3,4] 1

&out postgain=1.78 map=sample [&ticks * &metal * .12,
                         &beat,
                         &bassline * &bass * .5,
                         &arp * &arpeggio * .18,
                         &melody * &lead * .3]
\`\`\`
`};Object.fromEntries(gh.map(e=>{let t=_h[e];if(t===void 0)throw Error(`examples/${e}.md is missing`);let n=As(t);if(`problems`in n)throw Error(`examples/${e}.md: ${n.problems.map(e=>`line ${e.line}: ${e.message}`).join(`; `)}`);return[e,{source:n.text,file:t}]}));let vh=.1,yh=new Set(sp.map(e=>e.replace(/^&/,``))),bh=/&([A-Za-z_][A-Za-z0-9_]*)/g,xh=e=>[...new Set(xp(e).map(e=>e.name))].filter(e=>!yh.has(e));function Sh(e){let t=new Map(xh(e).map((e,t)=>[e,t+1]));return xp(e).map(e=>e.code.replace(bh,(e,n)=>t.has(n)?`&#${t.get(n)}`:e)).join(`
`)}function Ch(e,t){if(Sh(e)!==Sh(t))return null;let n=xh(t);return new Map(xh(e).flatMap((e,t)=>e===n[t]?[]:[[`&${e}`,`&${n[t]}`]]))}let wh=e=>Math.round(e*1e9)/1e9;function Th(e,t,n,r,i){let a=t.filed.find(e=>e.fragment.id===n),o=a?a.fragment.association:e.fragments.find(e=>e.id===n).association,s=o.map((e,t)=>({wp:e,own:t}));t.points.forEach((e,t)=>{e.id===n&&s.push({wp:e,row:t})});let c=new Set(eh({id:n,text:`-`,association:s.map(e=>e.wp)},i)),l,u=1/0;for(let e of s){let t=c.has(e.wp)?$m(e.wp.point,r)/e.wp.weight:1/0;t<=u&&t<1/0&&([l,u]=[e,t])}if(!l)return Eh(t,n,a,{point:{...r},weight:vh,...i===void 0?{}:{facet:i}});let{wp:d}=l;if(d.weight>=1.2)return t;let f=wh(Math.min(1.2,d.weight+.1));if(l.row!==void 0)return{...t,points:t.points.map((e,t)=>t===l.row?{...e,weight:f}:e)};if(!a)return Eh(t,n,a,{...d,weight:f});let p=o.map((e,t)=>t===l.own?{...e,weight:f}:e);return{...t,filed:t.filed.map(e=>e===a?{...e,fragment:{...e.fragment,association:p}}:e)}}function Eh(e,t,n,r){if(!n)return{...e,points:[...e.points,{id:t,...r}]};let i={...n.fragment,association:[...n.fragment.association,r]};return{...e,filed:e.filed.map(e=>e===n?{...e,fragment:i}:e)}}function Dh(e,t){let n=[...new Set(t)].sort(nh);if(n.length<2)return e;let r=[...e.together],i=new Map(r.map((e,t)=>[JSON.stringify(e.ids),t]));for(let e=0;e<n.length;e++)for(let t=e+1;t<n.length;t++){let a=[n[e],n[t]],o=JSON.stringify(a),s=i.get(o);s===void 0?(i.set(o,r.length),r.push({ids:a,count:1})):r[s]={ids:a,count:r[s].count+1}}return{...e,together:r}}function Oh(e,t,n){let r=new Set(e.merge(t).fragments.map(e=>e.id)),i=n.filter(e=>!r.has(e.id)).map(e=>`'${e.id}'`);if(i.length)throw Error(`useFragments: no fragment ${i.join(`, `)}`);let a=Dh(t,n.map(e=>e.id));for(let{id:t,point:r,facet:i}of n)r&&(a=Th(e,a,t,r,i));return a}function kh(e,t,n){let{text:r,point:i,facet:a,source:o,created:s,meta:c={},prose:l=``}=n,u=[];(typeof o!=`string`||!o.trim())&&u.push(`no source`),(typeof s!=`string`||!s.trim())&&u.push(`no created`);let d=[`id`,`association`,`source`,`created`].filter(e=>Object.hasOwn(c,e));d.length&&u.push(`its meta names ${d.join(`, `)}, which filing writes itself`);let f=[{point:{...i},weight:vh,...a===void 0?{}:{facet:a}}];if(u.push(...Xm({id:n.id??`filed`,text:r,association:f})),u.length)throw Error(`fileFragment: ${u.join(`; `)}`);let p=e.merge(t);for(let n of p.fragments){let o=Ch(r,n.text);if(o)return{layer:Th(e,t,n.id,i,a),id:n.id,file:null,renamed:o}}let m=/* @__PURE__ */ new Set([...p.fragments.map(e=>e.id),...p.unheld]);if(n.id!==void 0&&m.has(n.id))throw Error(`fileFragment: the id ${n.id} is taken`);let h=n.id??`${o} ${s}`;for(let e=2;m.has(h);e++)h=`${o} ${s} ${e}`;let g={fragment:{id:h,text:r,association:f},meta:{source:o,created:s,...c},prose:l};return{layer:{...t,filed:[...t.filed,g]},id:h,file:g,renamed:/* @__PURE__ */ new Map}}let Ah=ph(`meters`),jh=ph(`rhythms`),Mh=ph(`bass`),Nh=ph(`harmony`),Ph=ph(`modes`),Fh=[...Ah,...jh,...Mh,...Nh,...mh,...Ph];new Map(Fh.map(e=>[e.id,e.text])),[...Fm,...Im];function Ih(e){let t=0;for(let n of e){let e=n.codePointAt(0);t+=e<128?1:e<2048?2:e<65536?3:4}return t}let Lh=e=>Ih(JSON.stringify(e));function Rh(e,t=16e3){if(Lh(e)<=t)return e;let{filed:n,points:r,together:i}=e,a=()=>Lh({filed:n,points:r,together:i});for(;r.length>0&&a()>t;)r=r.slice(1);for(;i.length>0&&a()>t;)i=i.slice(1);for(;n.length>0&&a()>t;)n=n.slice(1);return{filed:n,points:r,together:i}}let zh=e=>8/e;function Bh(e){let t=dd(Ts(e.text,`bar`,`step`,`120bpm`)),n=t.diagnostics.filter(e=>e.severity===`error`);if(n.length)return`it doesn't compile: ${n.map(e=>e.message).join(`; `)}`;let r=t.cells.get(`bar`)?.meter;if(!r)return`it has no meter named &bar`;if(r.legato?.length)return`it articulates by level (legato=), which the band does not read`;let i=zh(r.unit),a=r.beats.reduce((e,t,n)=>[...e,n===0?0:e[n-1]+r.beats[n-1]*i],[]),o={cycle:r.pulses*i,heights:a},s=Object.values(R).find(e=>dn(e,o));if(!s)return`its meter, ${a.length} beats in ${o.cycle} eighths at ${a.join(` `)}, is none of the band's`;let c=r.swing??[];if(c.length>1)return`it swings on more than one level`;let[l]=c;return l?Nn.includes(l.level)?{id:e.id,meter:s,swing:{level:l.level,share:l.share}}:`it swings on ${l.level}, which the band does not`:{id:e.id,meter:s,swing:Pn}}Ah.map(e=>({id:e.id,read:Bh(e)}));function Vh(e=Ah){let t=/* @__PURE__ */ new Map;for(let n of e){let e=Bh(n);typeof e!=`string`&&t.set(n.id,e)}let n=rh([...e.filter(e=>t.has(e.id)),...jh]),r=t.size+jh.length;return{fragments:t,query:(e,i,a=[],o)=>(i?n.query(e,r+i.filed.length,{},{facet:`meter`,layer:i,...a.length?{chosen:a}:{},...o===void 0?{}:{pull:o}}).filter(e=>t.has(e.fragment.id)):n.query(e,t.size,{},{facet:`meter`})).map(e=>({id:e.fragment.id,distance:e.distance})),used:(e,t,r)=>Rh(Oh(n,e,[{id:t,point:r,facet:`meter`}]))}}let Hh=Vh();[...Ah,...jh,...Mh];let Uh=e=>Object.keys(R).find(t=>dn(R[t],e))??null,Wh=e=>`&bar meter("${e}") step=120bpm`;function Gh({meter:e,meterFragment:t}){let n=Ah.find(e=>e.id===t);if(n)return Ts(n.text,`bar`,`step`,`120bpm`);let r=Uh(e);return r?Wh(r):null}function Kh(e){let t=/^&\w+ map=midi\(10\) \[(.*)\]$/m.exec(e);return t?{line:t[0],terms:t[1].split(`, `)}:null}let qh=e=>Math.abs(e-Math.round(e))<1e-6?Math.round(e):e;function Jh(e,t){return!Uh(t)||!Kh(e)?null:Yh(e,t,Math.max(1,...gp(e,dd).clock.map(e=>e.bars)))}function Yh(e,t,n,r){let i=Uh(t),a=Kh(e);if(!i||!a)return null;let o=Jr(120,t),s=z(t)*n,c=[];for(let t of a.terms){let n=/^&(\w+)/.exec(t)[1];if(r!==void 0&&n!==r)continue;let l=op(wp(e.replace(a.line,a.line.replace(/\[.*\]$/,`[${t}]`)),Wh(i)).text),u=nm(l.result,Zp(l.result));for(let e of ap(l,0,s*o).events)for(let t of tm(u(e))){let r=rm(e,t);if(!r||r.channel!==10)continue;let i=qh(r.at/o);if(!Number.isInteger(i)||i>=s)return null;c.push({role:n,note:r.note,step:i,velocity:r.velocity})}}return{bars:n,hits:Xh(c)}}let Xh=e=>[...e].sort((e,t)=>e.step-t.step||e.note-t.note),Zh=e=>`${e.cycle}:${e.heights.join(` `)}`;function Qh(){let e=Ap(2048);return(t,n)=>Op(t,n,e).fits}let $h=({fragment:e})=>e.association.some(e=>e.facet===`rhythm`);function eg(e=jh,t=Qh(),n=Jh){let r=rh([...e,...Ah]),i=new Map(e.map(e=>[e.id,e.text])),a=(e,t)=>i.get(e)??t?.filed.find(t=>t.fragment.id===e)?.fragment.text,o=/* @__PURE__ */ new Map,s=/* @__PURE__ */ new Map,c=/* @__PURE__ */ new Map,l=/* @__PURE__ */ new Map,u=/* @__PURE__ */ new Map,d=/* @__PURE__ */ new Set,f=/* @__PURE__ */ new Map,p=(e,n)=>{let r=`${n.length}:${n}${e}`;return o.has(r)||o.set(r,t(e,n)),o.get(r)},m=e=>`${e.meterFragment??``}\n${Zh(e.meter)}`,h=e=>{let t=m(e);return c.has(t)||c.set(t,Gh(e)),c.get(t)},g=(e,t)=>{let n=`${e}\n${t}`;return l.has(n)||l.set(n,wp(e,t).text),l.get(n)},_=(e,t,n)=>{let r=`${e}\n${t}\n${n}`;if(!u.has(r)){let a=i.get(e);u.set(r,a!==void 0&&a!==t&&wp(a,g(t,n)).renamed.size===0)}return u.get(r)},v=(t,n,a,o,s)=>r.query(t,e.length+Ah.length+(n?.filed.length??0),{},{facet:`rhythm`,...n?{layer:n}:{},...a.length?{chosen:a}:{},...s===void 0?{}:{pull:s}}).filter(e=>i.has(e.fragment.id)||e.distance<=o).map(e=>({id:e.fragment.id,text:e.fragment.text,distance:e.distance})),y=(e,t)=>{let r=`${e}\n${Zh(t)}`;return s.has(r)||s.set(r,n(e,t)),s.get(r)},b=(e,t)=>{let n=`${t.length}:${t}${e}`;return f.has(n)||f.set(n,Bm(e,{workbench:t,keep:Vt,fewest:3})),f.get(n)};return{query(e,t,n,r=[],i=1/0,a){let o=h(t);return o===null?[]:v(e,n,r,i,a).filter(e=>p(e.text,o)).map(({id:e,distance:t})=>({id:e,distance:t}))},layered(e,t,n,r,i=1/0,o=[],s){let c=h(t),l=a(n,r);return c===null||l===void 0?[]:v(e,r,[n,...o],i,s).filter(e=>e.distance<=i&&_(e.id,l,c)&&p(e.text,g(l,c))).map(({id:e,distance:t})=>({id:e,distance:t}))},used:(e,t,n,i=[])=>Rh(Oh(r,e,[...t.map(e=>({id:e,point:n,facet:`rhythm`})),...i.map(e=>({id:e}))])),file(e,{hits:t,bench:n,point:i,source:a,created:c,tags:l,varies:u,by:d}){let f=Va(t,z(n.meter)),p=kh(r,e,{text:f,point:i,facet:`rhythm`,source:a,created:c,meta:{tags:[...l],...u===void 0?{}:{varies:u},...d===void 0?{}:{by:d}}}),{meterFragment:m}=n,g=m===void 0?p.layer:Oh(r,p.layer,[{id:p.id},{id:m}]),_=`${f}\n${Zh(n.meter)}`;p.file&&!s.has(_)&&s.set(_,{bars:1,hits:Xh(t)});let v=h(n);return p.file&&v!==null&&o.set(`${v.length}:${v}${f}`,!0),{layer:Rh(g),id:p.id,held:p.file===null}},read(e,t,n){let r=a(e,n);return r===void 0?null:y(r,t)},vary(e,t,n,r){let i=a(e,r),o=h(t),s=i===void 0?null:y(i,t.meter);if(i===void 0||o===null||s===null)return null;let c=b(i,o);if(!c.length)return null;let l=c[Gm(n,c.length)],u=l.line.slice(1),d=Yh(l.apply(i),t.meter,s.bars,u);return d===null?null:{hits:Xh([...s.hits.filter(e=>e.role!==u),...d.hits]),by:l.by}},*warm(t,n){let r=[...(n?.filed??[]).filter($h).map(e=>e.fragment.text).reverse(),...e.map(e=>e.text)];for(let n of t){let t=c.has(m(n)),i=h(n);if(t||(yield),i!==null)for(let t of r){let r=`${i.length}:${i}${t}`;if(d.has(r))continue;if(d.add(r),!p(t,i)){yield;continue}let a=y(t,n.meter);yield,a!==null&&a.bars===1&&!li(a)&&(b(t,i),yield);let o=g(t,i);yield;for(let r of e)_(r.id,t,i)&&(p(r.text,o),y(r.text,n.meter)),yield}}}}}[...[...Hh.fragments.values()].map(e=>({meter:e.meter,meterFragment:e.id})),...Object.values(R).map(e=>({meter:e}))],eg();let tg=[`&bassV loop=C2`,`&bassOut map=midi(2) [&bass * &bassV]`],ng=e=>Object.keys(R).find(t=>dn(R[t],e))??null,rg=e=>[`&bar meter("${e}") step=120bpm`,`&key scale(ionian, C)`,`&harm over=key step=1m [0,2,4]`].join(`
`),ig=e=>Math.abs(e-Math.round(e))<1e-6?Math.round(e):e,ag=(e,t)=>t===0?e:ag(t,e%t);function og(e,t){let n=ng(t);if(!n)return null;let r=wp(e,rg(n)).text,i=dd(r);if(!i.ok)return null;let a=Cm(r,i).filter(e=>e.pitched);if(a.length!==1)return null;let[o]=a;if(o.pitched.table!==`harm`||o.stepWhole===null||!o.meter)return null;let s=Sf(i,o.trigger,cc(i)),c=[];for(let e of o.notes){let t=s.find(t=>Math.abs(t.step-e.step)<1e-9);if(!t||t.table!==`harm`||t.via||t.tableShift<0||t.tableShift>1)return null;c.push({chord:t.tableShift,index:t.value+0,alter:t.alter+0,shift:(t.transpose??0)+0})}if(!c.length)return null;let l=o.meter.pulses/o.meter.unit,u=Math.ceil(l/o.stepWhole-1e-9),d=o.steps/ag(o.steps,u),f=z(t),p=Jr(120,t),m=op(r),h=nm(m.result,Zp(m.result)),g=[];for(let e of ap(m,0,d*f*p).events)for(let t of tm(h(e))){let n=rm(e,t);if(!n)continue;let r=ig(n.at/p);if(!Number.isInteger(r)||r>=d*f)return null;g.push(r)}return g.sort((e,t)=>e-t),{bars:d,notes:g.map((e,t)=>({step:e,...c[t%c.length]}))}}function sg(e,t){return[{tap:`1m`,length:t},{tap:`2n`,length:8},{tap:`4n`,length:4},{tap:`8n`,length:2}].find(n=>t%n.length===0&&e.every(e=>e%n.length===0))??{tap:`16n`,length:1}}function cg(e){if(e.alter!==0)throw Error(`lineText: an accidental (${JSON.stringify(e)})`);if(e.chord===0&&e.shift===0)return String(e.index);let t=e.chord===1?`&bassNext`:`&bassRoot`,n=e.shift===0?t:`${t}^$${e.shift}`;return e.index===0?n:e.shift===0?`${t}^${e.index}`:`degree(${n}, ${e.index})`}function lg(e,t){let n=[...e].sort((e,t)=>e.step-t.step),r=sg(n.map(e=>e.step),t),i=Array.from({length:t/r.length},(e,t)=>{let i=n.find(e=>e.step===t*r.length);return i?cg(i):`~`}),a=e=>n.some(t=>cg(t).includes(e));return[`&bass over=&harm step=${r.tap} ${i.join(` `)}`,...a(`&bassNext`)?[`&bassNext over=&harm[>>] 0`]:[],...a(`&bassRoot`)?[`&bassRoot over=&harm 0`]:[],...tg].join(`
`)}let ug=({fragment:e})=>e.association.some(e=>e.facet===Hn),dg=e=>`${e.cycle}:${e.heights.join(` `)}`;function fg(e=Mh,t=og){let n=rh([...e,...Ah]),r=new Map(e.map(e=>[e.id,e.text])),i=(e,t)=>r.get(e)??t?.filed.find(t=>t.fragment.id===e)?.fragment.text,a=/* @__PURE__ */ new Map,o=/* @__PURE__ */ new Map,s=(e,n)=>{let r=`${e}\n${dg(n)}`;return a.has(r)||a.set(r,t(e,n)),a.get(r)},c=(e,t)=>{let n=`${t}\n${e}`;return o.has(n)||o.set(n,Bm(e,{workbench:rg(t),operators:Im})),o.get(n)},l=(t,i,a,o,s)=>n.query(t,e.length+Ah.length+(i?.filed.length??0),{},{facet:Hn,...i?{layer:i}:{},...a.length?{chosen:a}:{},...s===void 0?{}:{pull:s}}).filter(e=>r.has(e.fragment.id)||e.distance<=o);return{query(e,t,n,r=[],i=1/0,a){return l(e,n,r,i,a).filter(e=>s(e.fragment.text,t.meter)!==null).map(e=>({id:e.fragment.id,distance:e.distance}))},used:(e,t,r,i=[])=>Rh(Oh(n,e,[...t.map(e=>({id:e,point:r,facet:Hn})),...i.map(e=>({id:e}))])),file(e,{notes:t,bench:r,point:i,source:o,created:s,tags:c,varies:l,by:u}){let d=lg(t,z(r.meter)),f=kh(n,e,{text:d,point:i,facet:Hn,source:o,created:s,meta:{tags:[...c],...l===void 0?{}:{varies:l},...u===void 0?{}:{by:u}}}),{meterFragment:p}=r,m=p===void 0?f.layer:Oh(n,f.layer,[{id:f.id},{id:p}]),h=`${d}\n${dg(r.meter)}`;return f.file&&!a.has(h)&&a.set(h,{bars:1,notes:[...t].sort((e,t)=>e.step-t.step)}),{layer:Rh(m),id:f.id,held:f.file===null}},read(e,t,n){let r=i(e,n);return r===void 0?null:s(r,t)},vary(e,n,r,a){let o=i(e,a),l=ng(n.meter);if(o===void 0||l===null||s(o,n.meter)===null)return null;let u=c(o,l);if(!u.length)return null;let d=u[Gm(r,u.length)],f=t(d.apply(o),n.meter);return f&&{notes:f.notes,by:d.by}},*warm(t,n){let r=[...(n?.filed??[]).filter(ug).map(e=>e.fragment.text).reverse(),...e.map(e=>e.text)],i=t.filter((e,n)=>t.findIndex(t=>dn(t.meter,e.meter))===n);for(let{meter:e}of i){let t=ng(e);if(t!==null)for(let n of r){if(a.has(`${n}\n${dg(e)}`))continue;let r=s(n,e);yield,r!==null&&r.bars===1&&!o.has(`${t}\n${n}`)&&(c(n,t),yield)}}}}}fg(),Object.entries(S).filter(([e])=>e!==`harmonics`).map(([e,{stack:t}])=>({name:e,tones:new Set(t.map(e=>e%12)),size:t.length}));function pg(e){let{min:t,max:n}=xn.bpm;return(Math.log(e)-Math.log(t))/(Math.log(n)-Math.log(t))}wn.map(e=>({name:e.name,at:{...e.style,bpm:pg(e.style.bpm)}})),So.initial,xi.initial,Rn(Pn);let mg=e=>s(F(e.mode),e.tonic);function hg(e){let t=ce(mg(e));return t.letter+(t.alteration<0?`b`:`#`).repeat(Math.abs(t.alteration))}let gg=e=>`scale(${e.mode}, ${hg(e)})`,_g=(e,t)=>`${e}${(t<0?`b`:`#`).repeat(Math.abs(t))}`,vg={major:[0,2,4],minor:[0,2,4],diminished:[0,2,4],augmented:[0,2,4],sus2:[0,1,4],sus4:[0,3,4],5:[0,4],6:[0,2,4,5],m6:[0,2,4,5],7:[0,2,4,6],maj7:[0,2,4,6],m7:[0,2,4,6],mMaj7:[0,2,4,6],m7b5:[0,2,4,6],dim7:[0,2,4,6],9:[0,2,4,6,8],maj9:[0,2,4,6,8],m9:[0,2,4,6,8],add9:[0,2,4,8]};function yg(t,n){let r=F(t.mode),i=w(n).map(e=>e-t.tonic),a=k(i.map(e=>e-i[0])),o=a&&vg[a],s=Ve(r,i[0]);if(!o||!s)throw Error(`chordTones: no degrees for ${i.join(` `)}`);return i.map((t,n)=>{let i=s.degree+o[n];return{degree:i,accidental:t-e(r,i)}})}let bg=e=>`[${e.map(e=>_g(e.degree,e.accidental)).join(`,`)}]`,xg={16:`1m`,12:`2n.`,8:`2n`,6:`4n.`,4:`4n`,3:`8n.`,2:`8n`,1:`16n`},Sg=(e,t)=>t===0?e:Sg(t,e%t);function Cg(e,t,n=cn,r=n){let i=e.map(e=>e.step),a=[...i[0]>0?[{text:`~`,length:i[0]}]:[],...i.map((e,r)=>({text:t(r),length:(i[r+1]??n)-e}))],o=a.reduce((e,t)=>Sg(e,t.length),n),s=o===r?`1m`:xg[o],c=s?o:1,l=a.map(({text:e,length:t})=>t===c?e:`${e}@${t/c}`);return`step=${s??`16n`} ${l.join(` `)}`}let wg={comp:`C3`,bass:`C1`,lead:`C4`},Tg={comp:48,bass:24,lead:60};function Eg(e,t,n){let r=t-Tg[n]-e.tonic,i=Ve(F(e.mode),r);return{degree:i.degree,accidental:i.accidental}}let Dg=(t,n,r)=>Tg[r]+t.tonic+e(F(t.mode),n.degree)+n.accidental;function Og(e,t){let n=t.map(e=>e-60),r=C(n),a=k(n.map(e=>e-n[0]));if(r&&a)return He(mg(e),{root:i(n[0],12),quality:a})}function kg(e){return Object.keys(R).find(t=>dn(R[t],e.meter))}function Ag(e){return e.chords.map(t=>({step:Tt(e.meter,t.slot.step),numeral:Pe(Ne(kt(t,e.plan.key)))}))}function jg(e){let t=String(e).replace(/^0/,``);for(let n=2;n<=100;n++){let r=Math.round(e*n);if(r/n===e)return`${r}/${n}`.length<t.length?`${r}/${n}`:t}return t}let Mg=e=>e.heights.map((t,n)=>(e.heights[n+1]??e.cycle)-t),Ng=(e,t)=>t!==`8n`||Mg(e).includes(2);function Pg(e,t){if(t.share===Pn.share||!Ng(e,t.level))return``;let n=t.level===`8n`&&Mg(e).some(e=>e!==2);return` swing=${t.level}:${jg(t.share)}${n?`:pairs`:``}`}function Fg(e,t,n){let r=Math.floor(n.n/t.length),i=t[n.n-r*t.length],a=F(e.mode).heights.length;return{degree:i.degree+r*a+n.alter,accidental:i.accidental}}let Ig=[0,1,-1,2,-2],Lg=Array.from({length:41},(e,t)=>t%2?(t+1)/2:t&&-t/2);function Rg(e,t,n,r){for(let i of Ig)for(let a of Lg)if(Dg(e,Fg(e,t,{n:a,alter:i}),r)===n)return{n:a,alter:i};return null}let zg=(e,t)=>e.part.localeCompare(t.part)||(Math.abs(e.step-t.step)<1e-6?0:e.step-t.step)||e.note-t.note,Bg=e=>[...e].sort(zg);function Vg(e){return Bg(e.written.map(t=>({part:t.part===`pad`||t.part===`stab`?`comp`:t.part,line:t.part,...t.role?{role:t.role}:{},step:t.step,note:t.note,velocity:Math.round(Vi(e,t)),written:t.length,length:si(e,t)})))}let Hg=e=>e.lines.map(e=>e.text).join(`
`),Ug=(e,t)=>t===1?e:`${e}@${t}`,Wg=e=>String(Number(e.toPrecision(12))).replace(/^0\./,`.`);function Gg(e,{tempo:t=`held`}={}){let n=e.map(e=>({meter:kg(e),bpm:e.style.bpm,swing:Pg(e.meter,e.swing),key:gg(e.plan.key),melodic:e.plan.melodic})),r=t===`held`?[`meter`,`bpm`,`swing`,`key`,`melodic`]:[`meter`,`swing`,`key`,`melodic`];for(let[e,t]of n.entries())for(let i of r)if(t[i]!==n[0][i])throw Error(`a section's ${i} changes at its bar ${e} (${n[0][i]} to ${t[i]}): one text holds one`);return n[0]}function Kg(e,t){let n=lt(e).heights[0];return dt(e,t).heights.map(t=>{let r=Ve(F(e.mode),t-n);return{degree:r.degree,accidental:r.accidental}})}function qg(e,t){return e.flatMap((e,n)=>Ag(e).map(e=>({step:n*t+e.step,numeral:e.numeral})))}let Jg=(e,t)=>Array.from({length:e},(e,n)=>t(n)).join(` `),Yg=e=>e>=127?``:`:0:${Fa(e)}`;function Xg(e,t,n,r){let i=[],a=[];for(let o of on){let s=e.filter(e=>e.role===o);if(s.length===0)continue;let c=e=>s.filter(t=>Math.floor(t.at/n)===e),l=r&&o===`euclid`?Array.from({length:t},(e,t)=>{let r=c(t);if(r.length===0)return`~`;if(new Set(r.map(e=>e.note)).size!==1)return null;let i=Ia(r.map(e=>e.step),n);return i&&`&${Pa.get(r[0].note)}(${i.k},${n},${i.r})`}):null;if(l&&l.every(e=>e!==null)){i.push(`&${o} step=1m ${l.join(` `)}`);let e=new Set(s.map(e=>e.velocity)),r=Array.from({length:t},(e,t)=>[...new Set(c(t).map(e=>e.velocity))]);if(e.size===1){let e=s[0].velocity;a.push(e>=127?`&${o}`:`&${o} * ${Fa(e)}`)}else if(r.every(e=>e.length<=1))i.push(`&${o}Level map=amp step=1m ${r.map(e=>e.length?Fa(e[0]):`0`).join(` `)}`),a.push(`&${o} * &${o}Level`);else{let e=e=>s.find(t=>t.at===e)?.velocity;i.push(`&${o}Level map=amp step=16n ${Jg(t*n,t=>e(t)?Fa(e(t)):`0`)}`),a.push(`&${o} * &${o}Level`)}continue}let u=Jg(t*n,e=>{let t=s.filter(t=>t.at===e).map(e=>`&${Pa.get(e.note)}${Yg(e.velocity)}`);return t.length===0?`~`:t.length===1?t[0]:`[${t.join(`,`)}]`});i.push(`&${o} step=16n ${u}`),a.push(`&${o}`)}return{lines:i,terms:a,voices:[...new Set(e.map(e=>Pa.get(e.note)))]}}function Zg(e,t,n,r,i,a,o,s){let c=[...new Set(t.map(e=>e.at))].sort((e,t)=>e-t),l=[],u=[],d=[],f=[],p=[],m=0,h=0,g=e=>{for(let t of[l,u,d,f])t.push(Ug(`~`,e))};for(let[_,v]of c.entries()){v>h&&g(v-h);let y=t.filter(e=>e.at===v),b=Math.max(...y.map(e=>e.written)),x=Math.min(b,(c[_+1]??r)-v);x<b&&s.push({line:e,step:v,written:b,stated:x});let S=e=>Ug(e.length===1?e[0]:`[${e.join(`,`)}]`,x);l.push(S(y.map(e=>{let t=Eg(n,e.note,i);return _g(t.degree,t.accidental)})));let C=o===`key`?null:a(v);u.push(S(y.map(e=>{let t=C&&Rg(n,C,e.note,i);return t?(t.alter!==0&&m++,_g(t.n,t.alter)):(o!==`key`&&p.push({step:v,note:e.note}),`?`)}))),d.push(Ug(Fa(y[0].velocity),x)),f.push(Ug(Wg(y[0].length/y[0].written),x)),h=v+x}h<r&&g(r-h);let _=o!==`key`&&p.length===0?o:`key`,v=new Set(t.map(e=>e.velocity)).size===1,y=[...new Set(t.map(e=>Wg(e.length/e.written)))],b=y.length>1?` legato=&${e}Share`:y[0]===`1`?``:` legato=${y[0]}`;return{lines:[`&${e} over=${_===`key`?`key`:`&${_}`} step=16n${b} ${(_===`key`?l:u).join(` `)}`,...y.length>1?[`&${e}Share step=16n ${f.join(` `)}`]:[],...v?[]:[`&${e}Level map=amp step=16n ${d.join(` `)}`]],level:v?Fa(t[0].velocity):`&${e}Level`,pitched:{part:e,table:_,accidentals:_===`key`?0:m,unreached:p,shares:y.length}}}function Qg(e,{euclid:t=e[0].swing.share===Pn.share,table:n=`harm`,lead:r=`melo`,tempo:i=`held`}={}){let a=Gg(e,{tempo:i}),o=e[0].plan.key,s=z(e[0].meter),c=e.length*s,l=e.flatMap((e,t)=>Vg(e).map(e=>({...e,at:t*s+e.step}))),u=[],d=[],f=qg(e,s),p=e=>yg(o,nt(o,Ne(e))),m=[{part:`meter`,text:`&bar meter("${a.meter}") step=${a.bpm}bpm${a.swing}`},{part:`key`,text:`&key ${a.key}`},{part:`harmony`,text:`&harm over=key ${Cg(f,e=>bg(p(f[e].numeral)),c,s)}`}],h=e=>{let t=f.findLast(t=>t.step<=e);return t?p(t.numeral):null},g=Xg(l.filter(e=>e.part===`drums`),e.length,s,t);m.push(...g.lines.map(e=>({part:`drums`,text:e})),...g.terms.length?[{part:`drums`,text:`&drums [${g.terms.join(`, `)}]`}]:[],...g.voices.map(e=>({part:`drums`,text:`&${e} s=white`})));let _={},v=(e,t,n,r,i,a)=>{let s=l.filter(t=>t.line===e);if(s.length===0)return;let f=Zg(e,s,o,c,n,r,i,u);d.push(f.pitched),_[e]=!0,m.push(...f.lines.map(e=>({part:t,text:e})),{part:t,text:`&${e}Out play=&${e} level=${f.level} &${a}`})};v(`bass`,`bass`,`bass`,h,n,`bassV`),_.bass&&m.push({part:`bass`,text:`&bassV loop=${wg.bass}`}),v(`pad`,`comp`,`comp`,h,n,`compV`),v(`stab`,`comp`,`comp`,h,n,`compV`),(_.pad||_.stab)&&m.push({part:`comp`,text:`&compV loop=${wg.comp}`});let y=a.melodic,b=y===`plain`||r===`key`,x=Kg(o,y);if(!b&&l.some(e=>e.line===`lead`)&&m.push({part:`lead`,text:`&melo over=key step=1m ${bg(x)}`}),v(`lead`,`lead`,`lead`,()=>x,b?`key`:`melo`,`leadV`),_.lead){m.push({part:`lead`,text:`&leadV loop=${wg.lead}`});let e=m.findIndex(e=>e.text.startsWith(`&melo `));e>=0&&d.find(e=>e.part===`lead`).table===`key`&&m.splice(e,1)}let S=[`pad`,`stab`].filter(e=>_[e]),C=S.length===0?`~`:S.length===1?`&${S[0]}Out`:`[${S.map(e=>`&${e}Out`).join(`, `)}]`;return m.push({part:`card`,text:`&out map=midi ${_.lead?`&leadOut`:`~`} ${_.bass?`&bassOut`:`~`} ${C} ~!6 ${g.terms.length?`&drums`:`~`}`}),{lines:m,pitched:d,cuts:u}}let $g={lead:1,bass:2,comp:3,drums:10},e_=e=>[...new Set(e.map(e=>(e%12+12)%12))].sort((e,t)=>e-t),t_=[`&lap step=1m 0`,`&readV loop=C4`,`&read map=midi ~!14 [&lap * &readV] [&harm * &readV]`].join(`
`);function n_(e,t,n){let r=e.tracks.find(e=>e.output.id===t);if(!r)return 1;let i=r.share;if(typeof i==`number`)return i;let a=i.series.reduce((t,r)=>{let i=Of(e,r,n);return t*(i?i.value+i.alter:1)},1);return i.range?i.range[0]+(i.range[1]-i.range[0])*a:a}function r_(e){let[t,n,r]=(e??``).split(`:`);return t===`kit`?{line:`drums`,role:r}:{line:n}}let i_=e=>op(`${e}\n${t_}`);function a_(e,t,n=i_(e)){let r=z(t[0].meter),i=t.length*r*Jr(t[0].style.bpm,t[0].meter),a=nm(n.result,Zp(n.result)),o=ap(n,0,i*1.25).events.flatMap(e=>tm(a(e)).flatMap(t=>{let r=rm(e,t);return r?[{...r,share:n_(n,e.output,e.at),...r_(e.output)}]:[]})),s=[...new Set(o.filter(e=>e.channel===15).map(e=>e.at))].sort((e,t)=>e-t).slice(0,t.length+1),c=s[t.length],l=e=>s.findLastIndex(t=>t<=e+1e-9),u=t.map(()=>({timed:[]})),d=t.map(()=>/* @__PURE__ */ new Map);for(let e of o){if(e.at>=c-1e-9)continue;let n=l(e.at),i=t[n],a=s[n],o=(s[n+1]-a)/r,f=Mn(Fn(i.swing),i.meter),p=e=>f.written((e-a)/o);if(e.channel===16){let t=Math.round(p(e.at));d[n].set(t,[...d[n].get(t)??[],e.note]);continue}let m=Object.keys($g).find(t=>$g[t]===e.channel);if(!m)continue;let h=p(e.at);u[n].timed.push({at:e.at,share:e.share,onset:(e.at-a)/o,end:(e.end-a)/o,line:e.line,role:e.role,note:{part:m,step:h,note:e.note,velocity:e.velocity,written:(p(e.end)-h)/e.share,length:p(e.end)-h}})}return{bars:u.map(({timed:e})=>(e.sort((e,t)=>zg(e.note,t.note)),{notes:e.map(e=>e.note),at:e.map(e=>e.at),shares:e.map(e=>e.share),onsets:e.map(e=>e.onset),ends:e.map(e=>e.end),lines:e.map(e=>e.line),roles:e.map(e=>e.role)})),chords:d.map((e,n)=>[...e].sort(([e],[t])=>e-t).map(([e,r])=>{let i=Og(t[n].plan.key,r.sort((e,t)=>e-t));return{step:e,numeral:i?Pe(i):`?`,pitchClasses:e_(r)}})),laps:s,diagnostics:n.result.diagnostics.map(e=>e.message)}}function o_(e){let t=3735928559,n=1103547991;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,2654435761),n=Math.imul(n^i,1597334677)}return t=Math.imul(t^t>>>16,2246822507),t^=Math.imul(n^n>>>13,3266489909),n=Math.imul(n^n>>>16,2246822507),n^=Math.imul(t^t>>>13,3266489909),(4294967296*(2097151&n)+(t>>>0)).toString(16)}let s_=e=>o_(JSON.stringify([Vg(e),Ag(e),gg(e.plan.key),e.plan.melodic,kg(e),Pg(e.meter,e.swing)])),c_=e=>({meter:e.meter,swing:e.swing,bpm:e.style.bpm,key:e.plan.key}),l_=({meter:e,swing:t,bpm:n,key:r},i)=>Array.from({length:i},()=>({meter:e,swing:t,style:{bpm:n},plan:{key:r}}));function u_(e,t=e=>e,n=()=>performance.now()){let r=n(),i=e.map(s_),a=c_(e[0]),o,s;try{let n=Qg(e,{tempo:`first`});o=t(Hg(n));let r=z(e[0].meter);s=[...new Set(n.cuts.map(e=>Math.floor(e.step/r)))]}catch(e){return{source:``,frame:a,foreseen:i,played:null,cut:[],error:null,unstated:String(e instanceof Error?e.message:e).replace(/^a section's (\w+) changes at its bar.*$/,`the section's $1 moves between its bars: one text states one`),cost:{build:n()-r,compile:0,play:0}}}let c=n()-r,l=d_({bar:e[0].bar,step:0,text:o,unstated:null,frame:a,foreseen:i,cut:s},n);return{...l,cost:{...l.cost,build:c}}}function d_(e,t=()=>performance.now()){let{text:n,frame:r,foreseen:i,cut:a,unstated:o}=e,s={source:n,frame:r,foreseen:i,unstated:o,played:null,cut:a,error:null};if(o!==null)return{...s,cost:{build:0,compile:0,play:0}};let c=t();try{let e=i_(n),a=t(),o=a_(n,l_(r,i.length),e),l=t();return{...s,played:o,cost:{build:0,compile:a-c,play:l-a}}}catch(e){return{...s,error:String(e),cost:{build:0,compile:t()-c,play:0}}}}let f_=[`&bar meter("4/4") step=120bpm`,`&key scale(aeolian, A)`,`&harm over=key step=1m [0,2,4] [5,7,9]`,`&kick step=16n &bd:0:.4 ~ ~ ~`,`&drums [&kick]`,`&bd s=white`,`&bass over=&harm step=16n legato=.6 0@4 3@4`,`&bassLevel map=amp step=16n .4@8`,`&bassOut play=&bass level=&bassLevel &bassV`,`&bassV loop=C1`,`&out map=midi ~ &bassOut ~!7 &drums`].join(`
`);function p_(){return i_(f_).result.diagnostics}function m_(e){return`warm`in e?(p_(),{id:e.id,stated:null}):{id:e.id,stated:`given`in e?d_(e.given):u_(e.bars)}}let h_=self;h_.onmessage=({data:e})=>h_.postMessage(m_(e))})();