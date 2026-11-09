(function(){function e(e,t){let n=e.heights.length;return e.cycle*Math.floor(t/n)+e.heights[u(t,n)]}function t(e,t){let{cycle:n,heights:r}=e,i=Math.floor((t-r[0])/n),a=t-i*n;return r.length*i+r.filter(e=>e<=a).length-1}function n(e,n){return t(e,n-1)+1}function r(r,i){let a=t(r,i),o=n(r,i);return i-e(r,a)<=e(r,o)-i?a:o}function i(e,t){return u(e,t)}function a(e,t,n){let r=n-u(n-e,t);return n-r<=r+t-n?r:r+t}function o(e){return e.heights.map(t=>i(t,e.cycle)).sort((e,t)=>e-t)}function s(e,t){return{cycle:e.cycle,heights:e.heights.map(e=>e+t)}}function c(t){return t.heights.map((n,r)=>e(t,r+1)-e(t,r))}function l(t,n){if(t.cycle!==n.heights.length)throw Error(`compose: the inner helix has cycle ${t.cycle}, but the outer has ${n.heights.length} degrees`);return{cycle:n.cycle,heights:t.heights.map(t=>e(n,t))}}function u(e,t){return(e%t+t)%t}function d(e,t,n=0){let r=[];for(let n=0;n<t;n++)n*e%t<e&&r.push(n);return s({cycle:t,heights:r},n)}function f(e,t){for(let n=0;n<t;n++)if(u(n*e,t)===u(1,t))return n;throw Error(`generator: ${e} and ${t} are not coprime, so ${e} of ${t} has no generator`)}let p={"2nd":`second`,"3rd":`third`,"4th":`fourth`,"5th":`fifth`,"6th":`sixth`,"7th":`seventh`,"9th":`ninth`,"11th":`eleventh`,"13th":`thirteenth`},m={maj:`major`,min:`minor`,dim:`diminished`,aug:`augmented`,dom:`dominant`,sus:`suspended`,alt:`altered`,pent:`pentatonic`,harm:`harmonic`,mel:`melodic`,phryg:`phrygian`,mixolyd:`mixolydian`},h=/(?:^| )(♭|flat|♯|sharp|♮|natural) ?(?=\d)/g,g={"♭":`b`,flat:`b`,"♯":`#`,sharp:`#`,"♮":`n`,natural:`n`};function _(e){return e.toLowerCase().replace(/\./g,` `).replace(/[\s_-]+/g,` `).trim().replace(h,(e,t)=>e.startsWith(` `)?` ${g[t]}`:g[t]).split(` `).map(e=>p[e]??m[e]??e).join(` `)}function v(t,n){return[...new Set(t.heights.map((r,i)=>e(t,i+n)-e(t,i)))].sort((e,t)=>e-t)}let y=d(7,12);v(y,0),v(y,1),v(y,2),v(y,3),v(y,4),v(y,5);function b(e){return Math.round(12*Math.log2(e))}let x=(e,t,n)=>({stack:e,symbols:t,words:n}),S={major:x([0,4,7],[``,`maj`,`M`],[`major`,`major triad`]),minor:x([0,3,7],[`m`,`min`,`-`],[`minor`,`minor triad`]),diminished:x([0,3,6],[`dim`,`°`,`o`],[`diminished`,`diminished triad`]),augmented:x([0,4,8],[`aug`,`+`],[`augmented`,`augmented triad`]),sus2:x([0,2,7],[`sus2`],[`suspended second`]),sus4:x([0,5,7],[`sus4`,`sus`],[`suspended fourth`,`suspended`]),5:x([0,7],[`5`],[`power chord`,`power`]),6:x([0,4,7,9],[`6`,`maj6`],[`sixth`,`major sixth`]),m6:x([0,3,7,9],[`m6`,`min6`,`-6`],[`minor sixth`]),7:x([0,4,7,10],[`7`,`dom7`,`Mm7`],[`seventh`,`dominant seventh`,`dominant`]),maj7:x([0,4,7,11],[`maj7`,`M7`,`Δ`,`Δ7`,`ma7`,`MM7`],[`major seventh`]),m7:x([0,3,7,10],[`m7`,`min7`,`-7`,`mm7`],[`minor seventh`]),mMaj7:x([0,3,7,11],[`mMaj7`,`m(maj7)`,`mM7`,`minMaj7`],[`minor major seventh`]),m7b5:x([0,3,6,10],[`m7b5`,`m7♭5`,`ø`,`ø7`,`min7b5`,`-7b5`],[`half diminished`,`half diminished seventh`]),dim7:x([0,3,6,9],[`dim7`,`°7`,`o7`],[`diminished seventh`]),9:x([0,4,7,10,14],[`9`,`dom9`],[`ninth`,`dominant ninth`]),maj9:x([0,4,7,11,14],[`maj9`,`M9`,`Δ9`],[`major ninth`]),m9:x([0,3,7,10,14],[`m9`,`min9`,`-9`],[`minor ninth`]),add9:x([0,4,7,14],[`add9`],[`add nine`,`added ninth`]),harmonics:x([1,2,3,4,5].map(b),[],[`harmonics`,`harmonic series`])};function C(e,t=12){if(e.length===0||e.some((t,n)=>n>0&&t<=e[n-1]))return;let n=e[0]+t;return{helix:{cycle:t,heights:e.filter(e=>e<n)},tensions:e.filter(e=>e>=n)}}function w(e){return[...e.helix.heights,...e.tensions]}let T=/* @__PURE__ */ new Map,E=/* @__PURE__ */ new Map,D=/* @__PURE__ */ new Map,O=(e,t,n)=>{e.has(t)||e.set(t,n)};for(let[e,t]of Object.entries(S)){for(let n of t.symbols)O(T,n,e),O(D,n.toLowerCase(),e);for(let n of t.words)O(E,_(n),e)}function k(e){let t=e.join();return Object.entries(S).find(([,e])=>e.stack.join()===t)?.[0]}function A(e){return u(e*f(7,12),12)}function j(t,n){return{cycle:t.cycle,heights:t.heights.map((r,i)=>e(t,i+n))}}function M(e){return e.heights.map((t,n)=>j(e,n))}function ee(e){let t=e.heights[0];return e.heights.reduce((e,n)=>e+n-t,0)}let te=[`lydian`,`ionian`,`mixolydian`,`dorian`,`aeolian`,`phrygian`,`locrian`],ne=M(d(7,12)).map(t=>s(t,-e(t,0))).sort((e,t)=>ee(t)-ee(e));function N(e){return ne[te.indexOf(e)]}let re=[`C`,`D`,`E`,`F`,`G`,`A`,`B`],P=[0,1,1,2,2,3,4,4,5,5,6,6],ie=[0,1,1,1,3,3,3,4,5,5,6,6],ae=N(`ionian`).heights;function oe(e){let t=e.map(t=>t-e[0]),n=t.slice(1).map((e,n)=>e-t[n]);if(n.length>0&&n.every(e=>e===3||e===4))return t.map((e,t)=>2*t);if(t.length===7&&t.every((e,t)=>Math.abs(e-ae[t])<=2))return t.map((e,t)=>t);let r=se(new Set(t.map(e=>u(e,12))));return t.map(e=>r.get(u(e,12))+7*Math.floor(e/12))}function se(e){let t=e.has(4)?4:e.has(3)?3:void 0,n=e.has(7)?7:t===4&&e.has(8)?8:e.has(6)?6:void 0,r=/* @__PURE__ */ new Map([[0,0]]);t!==void 0&&r.set(t,2),n!==void 0&&r.set(n,4);let i=/* @__PURE__ */ new Set;for(let t of[...e].sort((e,t)=>e-t)){if(r.has(t))continue;let e=ie[t];i.has(e)&&(e=P[t]),r.set(t,e),i.add(e)}return r}function ce(e,t,n=oe(t)){let r=re.indexOf(e.letter);return t.map((i,a)=>{let o=r+n[a],s=u(e.pitchClass+i-t[0],12),c=ae[u(o,7)],l=u(s-c,12);return l>6&&(l-=12),{letter:re[u(o,7)],alteration:l,pitchClass:s}})}function le(e,t){return s(t,e.heights[0]-t.heights[0])}function ue(e,t){let{cycle:n}=e,r=e.heights[0],s=new Set(o(e)),c=e.heights.length,l=me(c,n)?f(c,n):1,u=i(r,n),d=-1/0;for(let e=0;e<n;e++){let a=o(le({cycle:n,heights:[e]},t)).filter(e=>s.has(e)).length,c=he(e-r,l,n),f=a*4*n*n-c*2-(e===i(r,n)?0:1);f>d&&(d=f,u=e)}return le({cycle:n,heights:[a(u,n,r)]},t)}function de(e){let t=i(e.heights[0],12),n=re.flatMap((e,n)=>[0,-1,1].filter(e=>i(fe[n]+e,12)===t).map(n=>({letter:e,alteration:n,pitchClass:t}))),r=(e,t)=>ce(e,t).reduce((e,t)=>e+Math.abs(t.alteration),0),a=[...te.map(N),pe.harmonic,pe.melodic],o=n.map(t=>({tonic:t,inKey:r(t,e.heights),around:a.reduce((e,n)=>e+r(t,n.heights),0)}));return o.sort((e,t)=>e.inKey-t.inKey||e.around-t.around),o[0].tonic}let fe=N(`ionian`).heights,pe={harmonic:{cycle:12,heights:[0,2,3,5,7,8,11]},melodic:{cycle:12,heights:[0,2,3,5,7,9,11]}};function me(e,t){return t===0?e===1:me(t,e%t)}function he(e,t,n){for(let r=0;r<=n;r++)if(i(r*t-e,n)===0||i(-r*t-e,n)===0)return r;return n}let ge={"3/4":d(3,6),"4/4":d(4,8),"5/4":d(5,10),"5/8":d(2,5),"6/8":d(2,6),"7/8":d(3,7),"9/8":d(3,9),"10/8":d(4,10),"12/8":d(4,12)};function _e(e){return e.heights.length}function ve(e){let t=new Set(e.heights);return Array.from({length:e.cycle},(e,n)=>n===0?`downbeat`:t.has(n)?`pulse`:`subdivision`)}function F(e,t=2){return e.cycle*t}function ye(e,t=2){return l(e,d(e.cycle,t*e.cycle))}let be=[`downbeat`,`half`,`pulse`,`between`];function xe(e,t){let n=Array(e).fill(1/0),r=(e,i,a)=>{n[e]=Math.min(n[e],a);let o=i-e;if(o<=3){for(let t=e;t<i;t++)n[t]=Math.min(n[t],a+1);return}let s=d(2,o).heights[1],c=e+(t?o-s:s);r(e,c,a+1),r(c,i,a+1)};return r(0,e,1),n}function Se(e,t=!1){let n=xe(e.heights.length,t),r=ve(e).map(()=>`between`);return e.heights.forEach((e,t)=>{r[e]=be[Math.min(n[t],be.length)-1]}),r}function Ce(e){return{cycle:e.cycle,heights:e.onsets}}function we(e,t){let{cycle:n,onsets:r,degrees:i,accidentals:a,accents:o}=t,s=r.map((t,s)=>{let c=r[s+1]??r[0]+n,l=i[s];return{onset:u(e.rev?e.late-c:e.late+t,n),degree:l===null?null:e.strans+(e.mirror?-l:l),accidental:e.mirror?0-a[s]:a[s],accent:o?.[s]??0}});return s.sort((e,t)=>e.onset-t.onset),Te({cycle:n,onsets:s.map(e=>e.onset),degrees:s.map(e=>e.degree),accidentals:s.map(e=>e.accidental)},o&&s.map(e=>e.accent))}function Te(e,t){return t?.some(e=>e!==0)?{...e,accents:t}:e}function Ee(e,t){let n=t.mirror?-1:1,r=t.rev?-1:1;return{strans:t.strans+n*e.strans,mirror:e.mirror!==t.mirror,late:t.late+r*e.late,rev:e.rev!==t.rev}}function De(e,t){let n=[],r=e=>`${e.degrees.filter(e=>e===null).length}|${[...c(Ce(e))].sort((e,t)=>e-t)}`;if(e.cycle!==t.cycle||e.onsets.length!==t.onsets.length||r(e)!==r(t))return n;let i=e=>`${e.onsets}|${e.degrees.map(e=>e!==null)}|${e.accidentals}|${e.accents??``}`,a=i(t),o=t.degrees.findIndex(e=>e!==null);for(let r of[!1,!0])for(let s of[!1,!0]){let c=we({strans:0,mirror:s,late:0,rev:r},e).onsets,l=[...new Set(c.map(n=>u(t.onsets[0]-n,e.cycle)))];for(let c of l.sort((e,t)=>e-t)){let l=we({strans:0,mirror:s,late:c,rev:r},e);if(i(l)!==a)continue;let u=t.degrees[o]-l.degrees[o];l.degrees.every((e,n)=>e===null||e+u===t.degrees[n])&&n.push({strans:u,mirror:s,late:c,rev:r})}}return n}function Oe(e){return De(e,e)}function ke(e,t,n=Oe(t)){let r=e=>(Number(e.rev)*2+Number(e.mirror))*t.cycle+e.late,i;for(let a of n){let n=Ee(a,e),o={...n,late:u(n.late,t.cycle)};(!i||r(o)<r(i))&&(i=o)}return i}function Ae(e){let{cycle:t,onsets:n,degrees:r,accidentals:i}=e;return{cycle:t,onsets:n,degrees:r,accidentals:i}}function je(e,t){let n=Ae(t),[r]=De(n,Ae(e));return r===void 0?null:ke(r,n)}let Me=[`I`,`II`,`III`,`IV`,`V`,`VI`,`VII`],Ne={major:[!0,``],minor:[!1,``],diminished:[!1,`°`],augmented:[!0,`+`],sus2:[!0,`sus2`],sus4:[!0,`sus4`],5:[!0,`5`],6:[!0,`6`],m6:[!1,`6`],7:[!0,`7`],maj7:[!0,`maj7`],m7:[!1,`7`],mMaj7:[!1,`maj7`],m7b5:[!1,`ø7`],dim7:[!1,`°7`],9:[!0,`9`],maj9:[!0,`maj9`],m9:[!1,`9`],add9:[!0,`add9`]},Pe=new Map(Object.entries(Ne).map(([e,[t,n]])=>[`${t}${n}`,e])),Fe={b:-1,"":0,"#":1},Ie=e=>e<0?`b`:e>0?`#`:``;function Le(e){let t=e===e.toUpperCase();if(!t&&e!==e.toLowerCase())return;let n=Me.indexOf(e.toUpperCase());return n<0?void 0:{degree:n,upper:t}}function Re(e){let t=/^([b#]?)([IViv]+)(.*?)(?:\/([b#]?)([IViv]+))?$/u.exec(e);if(!t)return;let[,n,r,i,a,o]=t,s=Le(r),c=s&&Pe.get(`${s.upper}${i}`);if(!s||!c)return;let l={degree:s.degree,accidental:Fe[n],quality:c};if(o===void 0)return l;let u=Le(o);if(u)return l.of={degree:u.degree,accidental:Fe[a],minor:!u.upper},l}function ze(e){let[t,n]=Ne[e.quality],r=Me[e.degree],i=Ie(e.accidental)+(t?r:r.toLowerCase())+n;if(!e.of)return i;let a=Me[e.of.degree];return`${i}/${Ie(e.of.accidental)}${e.of.minor?a.toLowerCase():a}`}function Be(e){let t=c(e);return Math.max(...t)-Math.min(...t)}let Ve={ionian:`LLsLLLs`,aeolian:`LsLLsLL`};function He(e,t,n){let r=c(e),i=Math.max(...r),a=r.map(e=>e===i?`L`:`s`).join(``),o=j(e,[0,1,2,3,4,5,6].find(e=>a.slice(e)+a.slice(0,e)===Ve[t]));return s(o,n-o.heights[0])}function Ue(e,t){return t?He(e,t.minor?`aeolian`:`ionian`,Ge(e,t.degree,t.accidental)):e}function We(e,t){let n=Ue(e,t.of);return{root:i(Ge(n,t.degree,t.accidental,Be(e)),n.cycle),quality:t.quality}}function Ge(t,n,r,i=Be(t)){return e(t,n)+r*i}function Ke(t,n){if(t.heights.length!==7)return;let r=He(t,`ionian`,t.heights[0]),a=Be(t),o=(t,n)=>i(e(t,n),t.cycle),s=i(n,t.cycle),c=(e,n)=>i(o(t,e)+n*a,t.cycle)===s,l=[0,1,2,3,4,5,6],u=(r,i)=>({degree:r+7*((n-i*a-e(t,r))/t.cycle),accidental:i}),d=l.find(e=>c(e,0));if(d!==void 0)return u(d,0);let f=l.find(e=>o(r,e)===s);if(f!==void 0){for(let e of[-1,1])if(c(f,e))return u(f,e)}let p=l.find(e=>c(e,-1));if(p!==void 0)return u(p,-1);let m=l.find(e=>c(e,1));return m===void 0?void 0:u(m,1)}function qe(e,t,n){if(!(t.quality in Ne)||e.heights.length!==7)return;let r=Ke(Ue(e,n),t.root);if(r)return{degree:i(r.degree,7),accidental:r.accidental,quality:t.quality,...n&&{of:n}}}d(3,8),d(5,8,6),d(5,16,6),d(4,16),d(2,16,4),d(7,16);let Je=(t,n)=>s(j(t,n),-e(t,n)),Ye=e=>({cycle:12,heights:e}),Xe={ionian:[`major`,`ION`],dorian:[`DOR`],phrygian:[`PHR`],lydian:[`LYD`],mixolydian:[`MIX`],aeolian:[`minor`,`natural minor`,`AEO`],locrian:[`LOC`]},Ze=Object.fromEntries(te.map(e=>[e,{helix:N(e),aliases:Xe[e]??[]}]));function Qe(e,t){return Object.fromEntries(t.map(([t,n],r)=>[t,{helix:Je(e,r),aliases:n}]))}let $e=Je(d(5,12),3),et=d(8,12),tt={...Ze,...Qe($e,[[`major pentatonic`,[`pentatonic`,`pentatonic major`,`PENT`]],[`suspended pentatonic`,[`suspended`,`egyptian`]],[`man gong`,[`malkos raga`,`MGNG`]],[`ritsusen`,[`ritusen`,`RITS`]],[`minor pentatonic`,[`pentatonic minor`,`vietnamese 2`,`MPEN`]]]),"whole tone":{helix:d(6,12),aliases:[`wholetone`,`messiaen's mode #1`,`WTON`]},chromatic:{helix:d(12,12),aliases:[`CHR`]},diminished:{helix:et,aliases:[`whole half`,`whole half diminished`]},"half whole diminished":{helix:Je(et,1),aliases:[`half whole`,`dominant diminished`,`octatonic`,`messiaen's mode #2`,`HWD`]},...Qe(Ye([0,3,5,6,7,10]),[[`blues`,[`minor blues`,`BLUE`]],[`major blues`,[`MBLU`]]]),...Qe(Ye([0,2,3,5,7,8,11]),[[`harmonic minor`,[`HMIN`]],[`locrian natural 6`,[`locrian 6`,`locrian #6`,`LOC6`]],[`ionian #5`,[`ionian augmented`,`major augmented`,`major #5`,`ION5`]],[`dorian #4`,[`ukrainian dorian`,`romanian minor`,`altered dorian`,`DOR4`]],[`phrygian dominant`,[`spanish phrygian`,`spanish`,`phrygian major`,`PDOM`]],[`lydian #2`,[`lydian #9`,`LYD2`]],[`ultralocrian`,[`altered diminished`,`superlocrian bb7`,`superlocrian diminished`,`ULOC`]]]),...Qe(Ye([0,2,3,5,7,9,11]),[[`melodic minor`,[`jazz minor`,`MMIN`]],[`dorian b2`,[`phrygian natural 6`,`phrygian #6`,`melodic minor second mode`,`DOR2`]],[`lydian augmented`,[`lydian #5`,`LYD+`]],[`lydian dominant`,[`acoustic`,`overtone`,`lydian b7`,`LDOM`]],[`mixolydian b6`,[`aeolian dominant`,`hindu`,`melodic minor fifth mode`,`MIX6`]],[`locrian natural 2`,[`aeolian b5`,`locrian #2`,`LOC2`]],[`altered`,[`super locrian`,`superlocrian`,`altered dominant`,`diminished whole tone`,`pomeroy`,`ALT`]]]),augmented:{helix:Ye([0,3,4,7,8,11]),aliases:[]}},nt=/* @__PURE__ */ new Map;for(let[e,t]of Object.entries(tt))for(let n of[e,...t.aliases]){let t=_(n);nt.has(t)||nt.set(t,e)}let rt=[`aeolian`,`dorian`,`ionian`,`mixolydian`,`phrygian`,`lydian`,`locrian`],it=[`plain`,`pentatonic`,`blues`],at={tonic:9,mode:`aeolian`};function ot(e){return s(N(e.mode),e.tonic)}let st={minor:{plain:[0,1,2,3,4,5,6].map(e=>[e,0]),pentatonic:[[0,0],[2,0],[3,0],[4,0],[6,0]],blues:[[0,0],[2,0],[3,0],[4,-1],[4,0],[6,0]]},major:{plain:[0,1,2,3,4,5,6].map(e=>[e,0]),pentatonic:[[0,0],[1,0],[2,0],[4,0],[5,0]],blues:[[0,0],[1,0],[2,-1],[2,0],[4,0],[5,0]]}};function ct(e,t){let n=ot(e);if(t===`plain`||n.heights[4]-n.heights[0]!==7)return n;let r=n.heights[2]-n.heights[0]===3?`minor`:`major`;return{cycle:n.cycle,heights:st[r][t].map(([e,t])=>Ge(n,e,t))}}function lt(e,t){return t.tonic===null?t.mode===e.mode?e:{tonic:i(ue(ot(e),N(t.mode)).heights[0],12),mode:t.mode}:t.tonic===e.tonic&&t.mode===e.mode?e:{tonic:t.tonic,mode:t.mode}}function ut(e){let t=e;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function dt(e,...t){let n=e>>>0;for(let e of t)n=Math.imul(n^(e|0),2654435761)>>>0;return ut(n)}function ft(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function pt(e,...t){return dt(e,...t)()}let mt={form:1,drumHit:2,drumVariation:3,drumVelocity:4,drumEuclid:5,theme:6,themeRenewal:7,chordColor:8,bassHit:9,bassVariation:10,bassNote:11,compHit:12,compVariation:13,leadRhythm:14,leadShape:15,leadVariation:16,bassVelocity:17,padVelocity:18,stabVelocity:19,leadVelocity:20,drumLength:21,bassLength:22,padLength:23,stabLength:24,leadLength:25,keyJump:26,ownAccent:27,offerVariation:28,radio:29,grooveVariation:30,lineVariation:31,leadLineVariation:32,harmonyVariation:33,restless:34};function I(e,t,...n){return pt(e,0,mt[t],...n)}function ht(e,[t,n],r,i,a,o,s,c=0){let l=I(e,t,r,i,o);return(a%2==1||c>0&&L(I(e,`restless`,mt[n],r,a),c))&&(l+=(I(e,n,r,a,o)-.5)*(.12+.4*s)),Math.min(.9999,Math.max(1e-4,l))}let gt=2**-16;function _t(e){return Math.round(e/gt)*gt}function L(e,t){if(!(e>=0&&e<1))throw Error(`chance: draw ${e} is outside [0, 1)`);if(!Number.isFinite(t))throw Error(`chance: probability ${t} is not a finite number`);return e<_t(t)}function vt(e,t){if(!(e>=0&&e<1))throw Error(`pick: draw ${e} is outside [0, 1)`);let n=t.map(e=>{if(!(e>=0&&Number.isFinite(e)))throw Error(`pick: weight ${e} is negative or not finite`);return Math.round(e/gt)}),r=n.reduce((e,t)=>e+t,0);if(r===0)throw Error(`pick: the weights give nothing to pick`);let i=Math.floor(e*r);for(let e=0;e<n.length-1;e++)if(i-=n[e],i<0)return e;return n.length-1}let yt=e=>Math.max(0,Math.min(1,e)),bt=e=>{let t=yt(e);return t*t*(3-2*t)};function xt(t,n){let r=n.map(n=>e(t,n.degree)+n.alter),a=k(r.map(e=>e-r[0]));return!a||!qe(t,{root:i(r[0],12),quality:a})?null:{helix:{cycle:12,heights:r},tensions:[]}}function St({seed:t,barInSection:n,key:r,theme:a,harm:o}){let s=ot(r),c=a.bars[n],u=bt((o-.25)/.5),d=yt((o-.75)/.25)*.7,f=(e,r)=>I(t,`chordColor`,a.index,n,e,r);return c.map((t,p)=>{let m=L(f(p,1),d);if(`dominantOf`in t){let n=e(s,t.dominantOf),r=s.heights[0]+i(n+7-s.heights[0],12);return{slot:t,raised:!1,chord:{helix:{cycle:12,heights:[r,r+4,r+7,r+10]},tensions:m?[r+14]:[]}}}let h=t.degree,g=t.stack&&xt(s,t.stack);if(g)return{slot:t,raised:!1,chord:g};let _=L(f(p,0),u)?4:3,v=l({cycle:7,heights:[h,h+2,h+4,h+6].slice(0,_)},s).heights,y=v[0],b=p+1<c.length?c[p+1]:a.bars[n+1]?.[0],x=b===void 0?0:`degree`in b?b.degree:null;if((r.mode===`aeolian`||r.mode===`dorian`)&&h===4&&x===0&&o>.4)return{slot:t,raised:!0,chord:{helix:{cycle:12,heights:[y,y+4,y+7,y+10].slice(0,_)},tensions:[]}};let S=e(s,h+8),C=_===4&&m&&S-y===14?[S]:[];return{slot:t,raised:!1,chord:{helix:{cycle:12,heights:v},tensions:C}}})}function Ct(e,t){let n=Math.floor(t*F(e)/16);return n%2==t%2?n:n-1}function wt(e,t){return e.map(e=>({...e,slot:{...e.slot,step:Ct(t,e.slot.step)}}))}function Tt(e,t){return e.findLast(e=>e.slot.step<=t)??e[0]}function Et(e){let t=w(e),n=t.map(e=>e-t[0]),r=k(n);if(!r)throw Error(`chords: no quality for ${n.join(` `)}`);return{root:t[0],stack:n,quality:r}}function Dt({slot:t,chord:n},r){let a=ot(r),{root:o,quality:s}=Et(n),c=`dominantOf`in t?{degree:t.dominantOf,accidental:0,minor:e(a,t.dominantOf+2)-e(a,t.dominantOf)===3}:void 0,l=qe(a,{root:i(o,12),quality:s},c);if(!l)throw Error(`chordNumeral: no numeral for ${s} on ${o}`);return ze(l)}let Ot={intro:[`groove`],groove:[`groove`,`bridge`,`build`],bridge:[`groove`,`build`,`breakdown`],build:[`drop`],drop:[`drop`,`breakdown`,`groove`],breakdown:[`build`,`groove`]},kt=(e,t,n)=>{switch(e){case`intro`:return 0;case`groove`:return .3*(1-n)+.05;case`bridge`:return .35+.2*n;case`build`:return .1+.45*t;case`drop`:return .3*t;case`breakdown`:return .35-.15*t}};function At(e,t,n){return Ot[e].map(e=>[e,kt(e,t,n)])}let jt={initial:null,advance({seed:e,index:t,style:n},r){let i=`intro`;if(t>0){let a=At(r?.type??`intro`,n.energy,n.entropy),o=a.length===1?[1]:a.map(([,e])=>e);i=a[vt(I(e,`form`,t),o)][0]}let a={type:i,index:t};return{carried:a,output:a}}},Mt={intro:-.3,groove:0,bridge:-.1,build:0,drop:.3,breakdown:-.45};function Nt(e,t,n){let r=t===`build`?-.15+.45*n/7:Mt[t];return Math.max(0,Math.min(1,e+r))}let Pt=(e,t,n,r)=>({name:e,range:t,label:n,ends:r,sentence:`${r[0][0].toUpperCase()}${r[0].slice(1)} (${t[0]}) to ${r[1]} (${t[1]}).`}),R=[Pt(`sync`,[0,1],`Syncopation`,[`on the beat`,`off the beat`]),Pt(`harm`,[0,1],`Harmony`,[`a static vamp`,`moving, rich harmony`]),Pt(`artic`,[0,1],`Articulation`,[`legato`,`staccato`]),Pt(`energy`,[0,1],`Energy`,[`sparse`,`dense`])],Ft=R.map(e=>e.name),It={adsr:[`attack`,`decay`,`sustain`,`release`],style:Ft},Lt=`style`,Rt=R.map(e=>(e.range[0]+e.range[1])/2);function z(e){return e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>z(e.atom))):[e]}function zt(e){return e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>[e,...zt(e.atom)])):[]}function Bt(e,t){return e.kind===`seq`?{...e,layers:e.layers.map(e=>e.map(e=>({...e,atom:Bt(e.atom,t)})))}:t(e)}function Vt(e,t){let n=e.atom,r=n.kind===`seq`?n.layers.reduce((e,n)=>e+n.reduce((e,n)=>e+Vt(n,t),0),0)*(n.euclid?.k??1):t(n);return e.repeat*e.subdivide*r}let Ht=1e-9,Ut=e=>Math.floor(e+Ht),Wt=(e,t)=>(e%t+t)%t,Gt=(e,t)=>t===0?e:Gt(t,e%t),Kt=(e,t)=>e/Gt(e,t)*t;function qt(e,t){let[n,r,i,a]=[Wt(e,t),t,1,0];for(;r!==0;){let e=Math.floor(n/r);[n,r,i,a]=[r,n-e*r,a,i-e*a]}return Wt(i,t)}let Jt=e=>e.reduce((e,t)=>e+t.elongate*t.repeat,0);function Yt(e){if(e.kind!==`seq`)return 1;let t=t=>t.reduce((e,t)=>Kt(e,Yt(t.atom)),1)*(e.mode===`alt`?Jt(t):1);return e.layers.reduce((e,n)=>Kt(e,t(n)),1)*(e.slow??1)}let Xt=(e,t,n)=>[{atom:e,at:t,dur:n,of:1,is:0,chances:[],picks:[]}];function Zt(e,t,n,r){return e.map(e=>{let i=t*(e.is+(e.at-n)/r),a=Ut(i),o=e.of*t;return{...e,at:n+Math.max(0,i-a)*r,dur:e.dur*t,of:o,is:Wt(a,o),picks:e.picks.map(i=>{let o=t*(e.is+i.lap+(i.at-n)/r)-a,s=Ut(o);return{...i,lap:s,at:n+Math.max(0,o-s)*r}})}})}function Qt(e,t,n,r){let i=[];for(let a of t.hits){let o=a/t.n;for(let a of e){let e=(a.at-n)/r,s=a.dur/r;for(let c=0;c<e+s;c++)e<=c+o+Ht&&c+o<e+s-Ht&&i.push({...a,at:n+o*r,dur:r/t.n,is:Wt(a.is+c,a.of),picks:a.picks.map(e=>({...e,lap:e.lap-c}))})}}return i}function $t(e,t,n,r,i,a){if(e.kind!==`seq`)return a(e,t,n).map(e=>({...e,chances:[...i.chances,...e.chances],...en(i.level,e.level)}));let o=e.layers.flatMap((o,s)=>{let c=Jt(o),l=[],u=0;return o.forEach((e,o)=>{l.push(...tn(e,t+u*n/c,e.elongate*n/c,`${r}/${s}.${o}`,i,a)),u+=e.elongate*e.repeat}),e.mode===`alt`?Zt(l,c,t,n):e.mode===`choose`?l.map(n=>({...n,picks:[...n.picks,{id:r,of:e.layers.length,is:s,lap:0,at:t}]})):l});return e.euclid&&(o=Qt(o,e.euclid,t,n)),e.slow&&e.slow>1&&(o=Zt(o,e.slow,t,n)),o}let en=(e,t)=>{let n=t===void 0?e:e===void 0?t:t*e;return n===void 0?{}:{level:n}};function tn(e,t,n,r,i,a){let o={chances:e.chance===void 0?i.chances:[...i.chances,e.chance],level:e.level===void 0?i.level:e.level*(i.level??1)},s=e.subdivide,c=n/s,l=[];for(let i=0;i<e.repeat;i++)for(let u=0;u<s;u++){let d=t+i*n+u*c;for(let t of $t(e.atom,d,c,r,o,a)){if(s===1||t.of===1&&!t.picks.length){l.push(t);continue}let e=Gt(s,t.of);if(Wt(t.is-u,e)!==0)continue;let n=t.of/e,r=n===1?0:Wt((t.is-u)/e*qt(s/e,n),n);l.push({...t,of:n,is:r,picks:t.picks.map(e=>{let t=u+e.lap;return{...e,lap:Math.floor(t/s),at:e.at+(Wt(t,s)-u)*c}})})}}return l}function nn(e,t){if(e.kind!==`seq`)return t(e);if(!e.bare)return 1;let n=e.layers[0][0];return nn(n.atom,t)*n.elongate}function rn(e,t,n,r=``){let i=[],a=0;return e.forEach((e,o)=>{let s=nn(e.atom,t)*e.elongate;for(let t of tn(e,a,s,`${r}${o}`,{chances:[],level:void 0},n))i.push({atom:t.atom,at:t.at,dur:t.dur,chances:t.chances,top:o,...t.level===void 0?{}:{level:t.level},...t.of>1?{laps:{of:t.of,is:t.is}}:{},...t.picks.length?{chosen:t.picks}:{}});a+=s*e.repeat}),i}let an=(e,t)=>rn(e,t,Xt),on=[`over`,`shift`,`step`,`map`,`stride`,`cycle`,`env`,`pitch`,`show`,`chance`,`seed`,`size`],sn=e=>e.flatMap(e=>e.repeat>1?Array.from({length:e.repeat},()=>({...e,repeat:1})):[e]);function cn(e,t){let n=t.transpose??0,r=t.degree??0;if(!n&&!r)return e;let i=n+r;switch(e.kind){case`seq`:return Bt(e,e=>cn(e,t));case`note`:return{...e,value:e.value+i};case`chord`:return{...e,notes:e.notes.map(e=>e+i)};case`choice`:return{...e,values:e.values.map(e=>e+i)};case`ref`:return n?{...e,transpose:(e.transpose??0)+n}:{...e,values:{mul:e.values?.mul??1,add:(e.values?.add??0)+r*(e.values?.mul??1)}};default:return e}}function ln(e){if(!e.cells.some(e=>e.base||dn(e)||un(e)))return e;let t=new Map(e.cells.map(e=>[e.name,e])),n=[...e.diagnostics],r=/* @__PURE__ */ new Map,i=/* @__PURE__ */ new Set,a=(e,t)=>n.push({severity:`error`,message:t,span:e.base?.span??e.span}),o=e=>{let s=r.get(e.name);if(s)return s;let c=e;if(e.base){let n=t.get(e.base.name);n?i.has(e.name)?a(e,`base=&${e.base.name} comes round to &${e.name} itself`):(i.add(e.name),c=fn(e,o(n),e.base,t=>a(e,t)),i.delete(e.name)):c=e}else dn(e)&&n.push({severity:`error`,message:`= keeps a step of the base: only in a cell with base= (&${e.name} base=&other = 4 =)`,span:e.span});return un(e)&&n.push({severity:`error`,message:`= keeps a whole step of the base, not part of one: write it outside brackets (&${e.name} base=&other = [0 2])`,span:e.span}),r.set(e.name,c),c};return{...e,cells:e.cells.map(o),diagnostics:n}}let un=e=>e.braid.kind===`list`&&e.braid.tokens.some(e=>zt(e.atom).some(e=>e.atom.kind===`rest`&&e.atom.keep)),dn=e=>e.braid.kind===`list`&&e.braid.tokens.some(e=>e.atom.kind===`rest`&&e.atom.keep);function fn(e,t,n,r){let i={};for(let n of on)e[n]==null&&t[n]!=null&&(i[n]=t[n]);let a={...t.params,...e.params},o={...t.paramSpans,...e.paramSpans},s=t.paramCells||e.paramCells?{...t.paramCells,...e.paramCells}:void 0,c=t.paramClocks||e.paramClocks?{...t.paramClocks,...e.paramClocks}:void 0;n.transpose&&(e.over??t.over)&&r(`base=&${n.name}^$${n.transpose}: a cell that reads a table moves by its degrees (^n), not yet by grid steps`);let l=e.braid;if(t.braid.kind===`list`){let i=sn(t.braid.tokens),a=e.braid.kind===`list`?sn(e.braid.tokens):[],o=[];for(let e=0;e<Math.max(i.length,a.length);e++){let s=i[e],c=a[e];if(!(!c||c.atom.kind===`rest`&&c.atom.keep)){o.push(c);continue}if(!s){r(`= past the end of &${t.name} (${i.length} steps): nothing to keep`);continue}let l=cn(s.atom,n);o.push(c&&c.elongate!==1?{...s,atom:l,elongate:c.elongate}:{...s,atom:l})}l={kind:`list`,tokens:o,...t.braid.perBeat!==void 0&&o.length===i.length?{perBeat:t.braid.perBeat,...t.braid.signature?{signature:t.braid.signature}:{}}:{}}}else e.braid.kind===`blank`?l=t.braid:dn(e)&&r(`&${t.name} is a ${t.braid.kind}(…), not a braid: = keeps steps of a braid`);return{...e,...i,params:a,paramSpans:o,...s?{paramCells:s}:{},...c?{paramClocks:c}:{},braid:l}}let pn=e=>{if(!e)return``;let t=e.abs?`$`:``;return e.kind===`at`?`[${t}${e.i}]`:`[${t}${e.from??``}:${e.to??``}${e.step?`:${e.step}`:``}]`},mn=e=>e===0?``:`[${e<0?`<<`:`>>`}${Math.abs(e)===1?``:Math.abs(e)}]`,hn=e=>(e.slot?`[${e.slot}]`:pn(e.pick)||mn(e.shift))+(e.degree?`^${e.degree}`:``)+(e.transpose?`^$${e.transpose}`:``),gn=e=>!!(e.label||e.title)&&e.braid.kind===`blank`&&e.over===null&&e.step===null&&e.map===null&&e.cycle===null&&e.shift===null&&e.stride===null&&!e.off&&!e.frees?.length&&!e.env&&!e.pitch&&Object.keys(e.params).length===0,_n=/^(`{3,})([^`]*)$/;function vn(e,t){let n=[],r=[],i=[],a=[],o=t;for(;o<e.length;){let t=e[o],s=_n.exec(t),c=s?e.findIndex((e,t)=>t>o&&/^`{3,}\s*$/.test(e)&&e.trim().length>=s[1].length):-1;if(s&&s[2].trim()===`cells`){if(c<0)return{problems:[{line:o+1,message:"the ```cells block is never closed (a line ```)"}]};a.push(t),r.push(a),a=[];let s=e.slice(o+1,c);s.forEach((e,t)=>i.push({block:n.length,line:o+2+t})),n.push(s),a.push(e[c]),o=c+1}else if(s){let t=c<0?e.length-1:c;a.push(...e.slice(o,t+1)),o=t+1}else a.push(t),o++}if(!n.length)return{problems:[{line:Math.max(t,1),message:"no ```cells block after the frontmatter"}]};let s=a.slice(1);r.push(a.slice(0,1));let c=s.join(`
`).replace(/^\s*\n/,``).trimEnd();return{text:n.flat().join(`
`),map:i,layout:{blocks:n,gaps:r},head:e.slice(0,t),tail:s,prose:c,raw:!1}}var B=class extends Error{line;constructor(e,t){super(t),this.line=e}};let yn=/^[-+]?(\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE][-+]?[0-9]+)?$/,bn=/^([-+]?0x[0-9a-fA-F]+|[-+]?0o[0-7]+|[-+]?\.(inf|Inf|INF)|\.(nan|NaN|NAN))$/,xn=/^(null|Null|NULL|~)$/,Sn=/^(true|True|TRUE)$/,Cn=/^(false|False|FALSE)$/,wn=/^[-?:,[\]{}#&*!|>'"%@`]/,Tn=e=>e!==``&&!wn.test(e)&&!/: |:$| #|^\s|\s$/.test(e)&&!/^[0-9]+$/.test(e)&&!/[\n\r\t]/.test(e);function En(e,t,n){let[r]=e;if(r===`&`||r===`*`)throw new B(t,`an ${r===`&`?`anchor`:`alias`} (${e}): the subset has none; write the value out`);if(r===`!`)throw new B(t,`a tag (${e}): the subset has none`);if(r===`|`||r===`>`)throw new B(t,`a block scalar (${r}): write the text on one line, quoted, with \\n`);if(r===`{`||r===`[`)throw new B(t,`flow style beyond [a, b] (${e}): write the map or the list as a block`);if(/^([-?:]( |$)|[%@`,\]}])/.test(e))throw new B(t,`${r} can't start a plain value: quote it`);if(r===`#`||e.includes(` #`))throw new B(t,`a comment: the subset has none; say it in the prose or under a key`);if(/: |:$/.test(e))throw new B(t,`a colon and a space in a plain value (${e}): quote it`);if(n&&/[[\]{},]/.test(e))throw new B(t,`flow style beyond [a, b] (${e}): quote an item that holds , [ ] { }`);if(xn.test(e))return null;if(Sn.test(e))return!0;if(Cn.test(e))return!1;if(yn.test(e))return Number(e);if(bn.test(e))throw new B(t,`a number the subset doesn't read (${e}): write it in decimal, or quote it`);return e}function Dn(e,t){if(e[0]===`'`){let t=``;for(let n=1;n<e.length;n++)if(e[n]!==`'`)t+=e[n];else if(e[n+1]===`'`)t+=e[n++];else return{value:t,length:n+1}}else for(let n=1;n<e.length;n++)if(e[n]===`\\`)n++;else if(e[n]===`"`)try{return{value:JSON.parse(e.slice(0,n+1)),length:n+1}}catch{throw new B(t,`an escape the subset doesn't read in ${e.slice(0,n+1)}: it reads JSON's (\\" \\\\ \\n \\t \\uXXXX …)`)}throw new B(t,`a quoted string that isn't closed on its line (${e})`)}function On(e,t){if(e===`{}`)return{kind:`map`,line:t,entries:[]};if(e[0]===`"`||e[0]===`'`){let{value:n,length:r}=Dn(e,t);if(e.slice(r).trim())throw new B(t,`text after a quoted string (${e.slice(r).trim()})`);return{kind:`scalar`,line:t,value:n}}if(e[0]===`[`&&e.endsWith(`]`)){let n=[],r=e.slice(1,-1).trim();for(;r;){let i;if(r[0]===`"`||r[0]===`'`){let e=Dn(r,t);i=e.value,r=r.slice(e.length).trim()}else{let n=r.indexOf(`,`),a=(n<0?r:r.slice(0,n)).trim();if(!a)throw new B(t,`an empty item in ${e}`);i=En(a,t,!0),r=n<0?``:r.slice(n)}if(n.push({kind:`scalar`,line:t,value:i}),r&&r[0]!==`,`)throw new B(t,`a list item followed by ${r[0]}, not a comma`);if(r=r.slice(1).trim(),!r&&e.slice(1,-1).trim().endsWith(`,`))throw new B(t,`an empty item at the end of ${e}`)}return{kind:`list`,line:t,items:n}}return{kind:`scalar`,line:t,value:En(e,t,!1)}}function kn(e,t=1){let n=[];try{if(e.split(`
`).forEach((e,r)=>{let i=t+r;if(!e.trim())return;let a=e.length-e.trimStart().length;if(e.slice(0,a).includes(`	`))throw new B(i,`a tab in an indent: indent with spaces`);let o=e.trim();if(/^(---|\.\.\.)(\s|$)/.test(o))throw new B(i,`a second document (${o}): the frontmatter is one`);if(o[0]===`%`)throw new B(i,`a directive (${o}): the subset has none`);if(o[0]===`#`)throw new B(i,`a comment: the subset has none; say it in the prose or under a key`);n.push({line:i,indent:a,text:o})}),!n.length)return{node:{kind:`map`,line:t,entries:[]}};let r=0,i=e=>e.text===`-`||e.text.startsWith(`- `),a=e=>i(n[r])?s(e):c(e),o=(e,t,o,c)=>{let l=n[r];if(e){if(l&&l.indent>o)throw new B(l.line,`a value over two lines, or indented under a value: the subset reads a value on one line`);return On(e,t)}return l&&l.indent>o?a(l.indent):l&&c&&l.indent===o&&i(l)?s(o):{kind:`scalar`,line:t,value:null}},s=e=>{let t=[],s=n[r].line;for(;r<n.length&&n[r].indent===e&&i(n[r]);){let i=n[r],s=i.text.slice(1).trimStart(),c=e+i.text.length-s.length;s&&(/^-( |$)/.test(s)||/^[^"'[{][^]*?(: |:$)/.test(s))?(n[r]={line:i.line,indent:c,text:s},t.push(a(c))):(r++,t.push(o(s,i.line,e,!1)))}return{kind:`list`,line:s,items:t}},c=e=>{let t=[],a=n[r].line;for(;r<n.length&&n[r].indent===e;){let{line:a,text:s}=n[r];if(i(n[r]))throw new B(a,`a list item where a key was expected`);if(s[0]===`?`)throw new B(a,`a complex key (?): keys are plain words`);let c=s.search(/: |:$/);if(c<0)throw new B(a,`no key: a line in a map is \`key: value\` (${s})`);let l=s.slice(0,c);if(l[0]===`"`||l[0]===`'`)throw new B(a,`a quoted key (${l}): keys are plain words`);if(/^[0-9]+$/.test(l))throw new B(a,`a key that is a number (${l}): keys are words`);if(!Tn(l))throw new B(a,`a key the subset doesn't read (${l}): keys are plain words`);if(t.some(e=>e.key===l))throw new B(a,`the key ${l} is given twice`);r++,t.push({key:l,line:a,value:o(s.slice(c+1).trim(),a,e,!0)})}return{kind:`map`,line:a,entries:t}},l=a(n[0].indent);if(r<n.length)throw new B(n[r].line,`indented as no key above it is`);return{node:l}}catch(e){if(e instanceof B)return{problems:[{line:e.line,message:e.message}]};throw e}}function An(e){return e.kind===`scalar`?e.value:e.kind===`list`?e.items.map(An):Object.fromEntries(e.entries.map(e=>[e.key,An(e.value)]))}let jn=`&[A-Za-z_][A-Za-z0-9_]*`,Mn=e=>e.startsWith(`"`)?e.slice(1,-1):e,Nn=e=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(e),Pn=e=>/^\s*use(?![A-Za-z0-9_])/.test(e);function Fn(e){let t=[],n=0,r=!1,i=-1;for(let a=0;a<=e.length;a++){let o=e[a];if(o===void 0||!r&&n===0&&/\s/.test(o)){i>=0&&t.push({text:e.slice(i,a),at:i}),i=-1;continue}i<0&&(i=a),o===`"`?r=!r:!r&&`([{`.includes(o)?n++:!r&&`)]}`.includes(o)&&(n=Math.max(0,n-1))}return t}function In(e){if(!e.startsWith(`(`)||!e.endsWith(`)`))return null;let t=e.slice(1,-1),n=[],r=0,i=!1,a=0;for(let e=0;e<=t.length;e++){let o=t[e];if(o===void 0||o===`,`&&!i&&r===0){n.push(t.slice(a,e).trim()),a=e+1;continue}o===`"`?i=!i:!i&&`([{`.includes(o)?r++:!i&&`)]}`.includes(o)&&r--}return n.length===1&&n[0]===``?[]:n}let Ln=`${jn}(?:=[A-Za-z_][A-Za-z0-9_]*)?`,Rn=RegExp(`^\\s*(\\*|${Ln}(?:\\s*,\\s*${Ln})*)(?=\\s|$)`),zn=RegExp(`^${jn}$`),Bn=/^[A-Za-z_][A-Za-z0-9_]*/,Vn=/^"[^"]*\S[^"]*"/,Hn=e=>/^[A-Za-z_][A-Za-z0-9_]*=/.test(e);function Un(e){let t=Rn.exec(e);if(!t)return;let n=Fn(e),r=t[0].length,i=n.findIndex(e=>e.at>=r&&e.text===`from`);if(i<0)return;let a=t[1]===`*`,o=a?null:t[1].split(`,`).map(e=>e.trim().split(`=`)),s=o?.map(([e,t])=>[e,t===void 0?e:`&${t}`])??null,c=e=>new Set(e).size===e.length;if(s&&o.some(([,e])=>e!==void 0)&&!(c(s.map(([e])=>e))&&c(s.map(([,e])=>e))))return null;let l=s?[...new Map(s)]:null,u=l?l.map(([e])=>e):null,d=l?l.map(([,e])=>e):null,f=n.filter((e,t)=>e.at>=r&&t<i).map(e=>e.text);if(f.some(e=>!Hn(e))||a&&f.length)return null;let p=e.slice(n[i].at+4).trim();if(p===``||p.startsWith(`(`)||p.startsWith(`&`)){if(!u||f.length||d.some((e,t)=>e!==u[t]))return null;let e=Fn(p),t=e[0]?.text.startsWith(`(`)?In(e[0].text):[];if(t===null||t.some(e=>!zn.test(e)))return null;let n=e.slice(+!!e[0]?.text.startsWith(`(`));return n.length>1||n[0]&&!zn.test(n[0].text)?null:{kind:`signature`,names:u,optional:[...new Set(t)],main:n[0]?.text??null}}let m=(Vn.exec(p)??Bn.exec(p))?.[0];if(!m)return null;let h=p.slice(m.length),g=null;if(/^\s*\(/.exec(h)){let e=Fn(h.trimStart())[0].text,t=In(e);if(!t)return null;g=[];for(let e of t){let t=/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(\S[\s\S]*)$/.exec(e);if(!t||g.some(e=>e.name===t[1]))return null;g.push({name:t[1],value:t[2].trim()})}h=h.trimStart().slice(e.length)}else if(h&&!/^\s/.test(h))return null;let _=h.trim();return{kind:`use`,id:Mn(m),names:u,takes:d,head:f,args:g,main:_||null}}let Wn=(e,t=e)=>e?e.map((e,n)=>t&&t[n]!==e?`${e}=${t[n].slice(1)}`:e).join(`, `):`*`,Gn=`A from line says where its cells come from: &key from harmonic_minor D, &bar from swung_4_4(swing=8n:.64) &tempo, &bd, &sd from gm_kit, &kick=bd from gm_kit (the piece’s &kick, the kit’s bd), * from gm_kit; the head’s attributes go before from (&key label="…" from …), the named arguments in parentheses; with no id, a fragment’s signature: &bar from (&swing) &tempo`;function V(e){let t=!1;for(let n=0;n<e.length;n++){let r=e[n];if(r===`"`)t=!t;else if(!t&&(r===`/`&&e[n+1]===`/`||r===`#`&&(n===0||/\s/.test(e[n-1]))))return[e.slice(0,n),e.slice(n)]}return[e,``]}let Kn=e=>RegExp(`^(\\s*&${e})(?=\\s|$)`);function H(e,t){let n=Kn(t);return e.split(`
`).findIndex(e=>n.test(V(e)[0])&&Un(V(e)[0].trim())===void 0)}function qn(e,t){return e.findIndex(e=>{let n=tr(V(e)[0]);if(!/^&\w+$/.test(n[0]??``)||!n.some(e=>e.startsWith(`step=`)))return!1;let r=n.slice(1).filter(e=>!nr(e));return r.length>0&&r.every(e=>/^&\w+$/.test(e))&&r.includes(`&${t}`)})}function Jn(e,t){for(let n=0;n<e.length;n++){let r=V(e[n].replace(/\r$/,``))[0],i=Un(r);if(!i||i.kind!==`use`||i.names?.length!==1||i.names[0]!==`&${t}`)continue;if(i.args===null&&i.main===null)return null;let a=0;for(let e of tr(r)){if(a=r.indexOf(e,a),e===`from`)return{line:n,from:a};a+=e.length}}return null}let Yn=(e,t)=>e.some(e=>{let n=Un(V(e)[0]);return n?.kind===`use`&&n.names?.includes(`&${t}`)===!0});function Xn(e,t,n,r=!1){let i=e.split(`
`),a=H(e,t);if(a<0&&r){let e=Jn(i,t);if(e){let r=i[e.line].endsWith(`\r`)?`\r`:``,a=r?i[e.line].slice(0,-1):i[e.line],o=a.slice(0,e.from).replace(/\s+$/,``);return i[e.line]=`${n(o,Kn(t))} ${a.slice(e.from)}${r}`,i.join(`
`)}}let o=a<0&&Yn(i,t)?-1:qn(i,t);if(a<0){if(o<0)return e;i.splice(o+1,0,`&${t}${i[o].endsWith(`\r`)?`\r`:``}`),a=o+1}let s=i[a].endsWith(`\r`)?`\r`:``,[c,l]=V(s?i[a].slice(0,-1):i[a]),u=n(c,Kn(t));if(o>=0&&!l&&u.trim()===`&${t}`)return i.splice(a,1),i.join(`
`);if(l){let e=c.length,t=u.replace(/\s+$/,``);u=t+` `.repeat(Math.max(1,e-t.length))}return i[a]=u+l+s,i.join(`
`)}function Zn(e,t){let n=0,r=!1,i=t;for(;i<e.length;i++){let t=e[i];if(t===`"`&&(r=!r),!r){if(t===`[`||t===`(`)n++;else if(t===`]`||t===`)`)n=Math.max(0,n-1);else if(/\s/.test(t)&&n===0)break}}return{text:e.slice(t,i),end:i}}function Qn(e,t){let n=RegExp(`(^|\\s)${t}=`).exec(e);if(!n)return null;let r=n.index+n[0].length,i=Zn(e,r),a=[],o=i.end;for(;;){let t=/^\s*\*\s*/.exec(e.slice(o));if(!t)break;let n=Zn(e,o+t[0].length);if(!n.text)break;a.push(n.text),o=n.end}return{base:i.text,factors:a,start:r,end:o}}function $n(e,t,n,r){return Xn(e,t,(e,t)=>{let i=Qn(e,n);if(!i)return r===null?e:e.replace(t,`$1 ${n}=${r}`);if(r!==null)return e.slice(0,i.start)+r+e.slice(i.end);let a=i.start-n.length-1,o=/\s/.test(e[a-1]??``)?a-1:a;return e.slice(0,o)+e.slice(i.end)},!0)}function er(e,t,n,r){return Xn(e,t,e=>e.replace(RegExp(`(\\s)${n}=`),`$1${r}=`))}function tr(e){let t=[],n=0,r=0,i=!1,a=``;for(let o of e)o===`"`&&(i=!i),!i&&(o===`[`||o===`(`)&&n++,!i&&(o===`]`||o===`)`)&&(n=Math.max(0,n-1)),!i&&n===0&&o===`<`&&r++,!i&&n===0&&o===`>`&&(r=Math.max(0,r-1)),/\s/.test(o)&&n===0&&r===0&&!i?(a&&t.push(a),a=``):a+=o;return a&&t.push(a),t}let nr=e=>/^[a-z][a-zA-Z]*=/.test(e)||e===`off`;function rr(e){let t=[];for(let n=0;n<e.length;n++){let r=e[n],i=t[t.length-1];if(i!==void 0&&nr(i)&&i.includes(`=`)&&(r===`*`||r.startsWith(`*`)||i.endsWith(`*`))){let a=r===`*`&&n+1<e.length?`${r} ${e[++n]}`:r;t[t.length-1]=`${i} ${a}`}else t.push(r)}return t}function ir(e,t){let n=H(e,t);return n>=0&&/[+*,[]\s*$/.test(V(e.split(`
`)[n])[0])}function ar(e,t){let n=H(e,t);if(n<0)return null;let r=rr(tr(V(e.split(`
`)[n])[0])),i=r.slice(0,1),a=r.slice(i.length);return{head:i,attrs:a.filter(nr),braid:a.filter(e=>!nr(e))}}function or(e,t){let n=ar(e,t),r=/* @__PURE__ */ new Map;for(let e of n?.attrs??[]){let t=e.indexOf(`=`);t<0?r.set(e,``):r.set(e.slice(0,t),e.slice(t+1))}return r}function sr(e,t,n){let r=ar(e,t);if(!r||ir(e,t))return e;let i=r.braid.length===1&&/^free\(\s*[^"\s]/.test(r.braid[0])&&n.length>0;return Xn(e,t,e=>/^\s*/.exec(e)[0]+[...r.head,...r.attrs,...i?[`free(${n.join(` `)})`]:n].join(` `))}function cr(e,t,n,r){return $n($n(e,t,n===`step`?`loop`:`step`,null),t,n,r)}function lr(e,t,n){return/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)?t!==n&&H(e,t)>=0?`&${t} already exists`:null:`Letters, digits and _ only, starting with a letter`}function ur(e,t,n){if(t===n||lr(e,n,t))return e;let r=RegExp(`&${t}(?![A-Za-z0-9_])`,`g`);return e.split(`
`).map(e=>{let[t,i]=V(e);return t.replace(r,`&${n}`)+i}).join(`
`)}let dr=/^`{3,}\s*cells\s*$/m;function fr(e){let t=[];for(let{key:n,line:r,value:i}of e.entries){let e=An(i);n===`title`&&(typeof e!=`string`||!e.trim())&&t.push({line:r,message:`the title is ${JSON.stringify(e)}, not a text: title: "A name"`}),n===`description`&&typeof e!=`string`&&t.push({line:r,message:`the description is ${JSON.stringify(e)}, not a text: description: "What it is"`}),n===`tags`&&!(Array.isArray(e)&&e.every(e=>typeof e==`string`&&e.trim()))&&t.push({line:r,message:`the tags are ${JSON.stringify(e)}, not a list of names: tags: [genre:jazz, rhythm]`}),n===`tier`&&!(typeof e==`number`&&Number.isInteger(e)&&e>=1&&e<=9999)&&t.push({line:r,message:`the tier is ${JSON.stringify(e)}: a tier of the tutorial is a whole number, 1 to 9999`}),n===`uses`&&!(Array.isArray(e)&&e.every(mr))&&t.push({line:r,message:`the uses are ${JSON.stringify(e)}, not a lockfile: uses: a list of - id: gm_kit, hash: e1:…`})}return t}function pr(e){let t=e.split(/\r?\n/);if(t[0]!==`---`){if(!dr.test(e))return{problems:[{line:1,message:"no frontmatter: a piece file starts with a line `---`, or holds a ```cells block"}]};let n=vn(t,0);return`problems`in n?n:{frontmatter:{},text:n.text,prose:n.prose,map:n.map,layout:n.layout,bare:!0}}let n=t.indexOf(`---`,1);if(n<0)return{problems:[{line:1,message:"the frontmatter is never closed: no second line `---`"}]};let r=kn(t.slice(1,n).join(`
`),2);if(`problems`in r)return r;let i=r.node;if(i.kind!==`map`)return{problems:[{line:i.line,message:"the frontmatter is a map (`title: …`, `tags: […]`)"}]};let a=vn(t,n+1),o=[...fr(i),...`problems`in a?a.problems:[]];return`problems`in a||o.length?{problems:o.sort((e,t)=>e.line-t.line)}:{frontmatter:An(i),text:a.text,prose:a.prose,map:a.map,layout:a.layout}}function mr(e){if(typeof e!=`object`||!e||Array.isArray(e))return!1;let t=e;return Object.keys(t).sort().join()===`hash,id`&&typeof t.id==`string`&&typeof t.hash==`string`}let U=(e,t,n,r,i)=>({section:e,form:t,means:n,examples:r,doc:i}),hr=(e,t)=>(e%t+t)%t,gr=[`Locrian`,`Phrygian`,`Aeolian`,`Dorian`,`Mixolydian`,`Ionian`,`Lydian`].map((e,t)=>({name:e,intervals:Sr(7,12,t)})),_r=(e,t,n)=>Tr(Sr(e,t,n),t),vr={major:{steps:_r(7,12,5),name:`Ionian`},minor:{steps:_r(7,12,2),name:`Aeolian`},ionian:{steps:_r(7,12,5),name:`Ionian`},dorian:{steps:_r(7,12,3),name:`Dorian`},phrygian:{steps:_r(7,12,1),name:`Phrygian`},lydian:{steps:_r(7,12,6),name:`Lydian`},mixolydian:{steps:_r(7,12,4),name:`Mixolydian`},aeolian:{steps:_r(7,12,2),name:`Aeolian`},locrian:{steps:_r(7,12,0),name:`Locrian`},harmonic:{steps:[2,1,2,2,1,3,1],name:`Harmonic minor`},melodic:{steps:[2,1,2,2,2,2,1],name:`Melodic minor`},pentatonic:{steps:_r(5,12,0),name:`Pentatonic`},minorpentatonic:{steps:_r(5,12,3),name:`Minor pentatonic`},blues:{steps:[3,2,1,1,3,2],name:`Blues`},wholetone:{steps:_r(6,12,0),name:`Whole tone`}},yr={locrian:0,phrygian:1,aeolian:2,minor:2,dorian:3,mixolydian:4,ionian:5,major:5,lydian:6},br=e=>Tr(Sr(7,12,e),12);function xr(e){let t=gr[e]?.name.toLowerCase()??`major`;return t===`ionian`?`major`:t===`aeolian`?`minor`:t}function Sr(e,t,n=0,r){let i=r=>Math.floor((r*t+n)/e);return r===void 0?Array.from({length:e},(e,t)=>i(t)):[i(r)]}let Cr={"4/4":[0,3.24,6,9.12],"3/4":[0,3.36,7.8]};function wr(e,t){return[...Cr[`${e}/${t}`]??Array.from({length:e},(t,n)=>n*12/e)]}function Tr(e,t){return e.map((n,r)=>+((r+1<e.length?e[r+1]:e[0]+t)-n).toFixed(6))}function Er(e){let t=[],n=0;for(let r of e)t.push(+n.toFixed(6)),n+=r;return{positions:t,lap:+n.toFixed(6)}}function Dr(e){let t=/^([A-G])(#|b)?(-?[0-9]+)?$/.exec(e);return t?{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[t[1]]+(t[2]===`#`?1:t[2]===`b`?-1:0)+12*((t[3]===void 0?4:parseInt(t[3],10))-4):null}let Or={bpm:{times:1,per:60,syntax:U(`rate`,`nbpm`,`n a minute: beats on a meter (a scan’s entries; meter(…)’s beats: 6/8 two, 7/8 three unequal; beat= says another count).`,[`&bar scan(4 4 4 4) step=84bpm`],`time.md`)},hz:{times:1,per:1,syntax:U(`rate`,`nhz`,`n a second (a plain number says the same).`,[`&a loop=440hz`],`time.md`)},min:{times:1,per:60,syntax:U(`rate`,`nmin`,`n a minute (wall-clock time: loop=1min turns once a minute).`,[`&tick scan(1!60) loop=1min`],`time.md`)},h:{times:1,per:3600,syntax:U(`rate`,`nh`,`n an hour.`,[`&hour scan(1!60) loop=1h`],`time.md`)},d:{times:1,per:86400,syntax:U(`rate`,`nd`,`n a day: a day meter, loop=1d (anchor= where it stands when play starts).`,[`&day scan(1!24) loop=1d anchor=11.55`],`time.md`)},wk:{times:1,per:604800,syntax:U(`rate`,`nwk`,`n a week.`,[`&week scan(1!7) loop=1wk`],`time.md`)},k:{times:1e3,per:1,syntax:U(`rate`,`nk`,`n thousand a second: a sample rate.`,[`&out loop=44.1k map=sample &mix`],`mix.md`)}},kr=new RegExp(Object.keys(Or).sort((e,t)=>t.length-e.length).join(`|`),`y`),Ar=(e,t)=>{let n=t?Or[t]:void 0;return n?e*n.times/n.per:e},jr={largo:[40,60],larghetto:[60,66],adagio:[66,76],andante:[76,108],moderato:[108,120],allegro:[120,156],vivace:[156,176],presto:[168,200]};`${Object.entries(jr).map(([e,[t,n]])=>`${e} ${t}–${n}`).join(`, `)}`;let Mr=`free(0 2 4 ~ …), a braid left to the performer, is a cell's whole braid: &riff over=&key free(0 2 4 ~), with nothing else as its braid`;function Nr(e,t,n,r={}){let i=e.i;if(e.match(/free\(/y)===null&&e.fail(`free(…)`),e.skipSpace(),e.peek()===`"`){let t=e.match(/"[^"]*"/y);e.skipSpace(),e.expect(`)`,`')' to close free("…")`);let n={key:`text`,value:0,unit:``,lo:0,hi:0,span:e.place(i),text:t.slice(1,-1)};return e.frees.push(n),n}(/(?:~|\[|-?[0-9.]+[#b]*(?:[@!*][0-9]+)?\s+[^\s,])/y.test(e.text.slice(e.i))||/^-?[0-9.]+[#b]*\)/.test(e.text.slice(e.i)))&&e.fail(Mr,i,e.i-i);let a=e.i,o=t===`shift`||t===`tonic`?e.noteName():null;o!==null&&/[0-9]/.test(e.text.slice(a,e.i))&&e.warn(`free(${e.text.slice(a,e.i)}): a key is a pitch class — the octave is left out: free(${e.text.slice(a,e.i).replace(/-?[0-9]+$/,``)})`,a,e.i-a);let s=o===null?e.match(/[a-z]+/y):null,c,l=``,u,d,f;if(o!==null)c=(o%12+12)%12,[u,d]=[0,11],f=[`C`,`C#`,`D`,`Eb`,`E`,`F`,`F#`,`G`,`Ab`,`A`,`Bb`,`B`];else if(s!==null){let n=jr[s];(!n||t===`shift`||t===`stride`||t===`gain`||t===`tonic`||r.whole)&&e.fail(`free(${s}): a tempo marking (${Object.keys(jr).join(`, `)}) — for a rate`,i,e.i-i),[u,d]=n,c=Math.round((u+d)/2),l=`bpm`}else{let t=e.match(/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y);t===null&&e.fail(`free(default, lo..hi), like free(90bpm, 60..240) or free(.8, 0..1)`),c=parseFloat(t),n&&(l=e.match(kr)??``),e.skipSpace(),e.expect(`,`,`',' then the range, like free(${t}${l}, 60..240)`),e.skipSpace();let r=e.match(/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y);e.match(/\.\./y)===null&&e.fail(`a range lo..hi, like 60..240`);let a=e.match(/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y);(r===null||a===null)&&e.fail(`a range lo..hi, like 60..240`),u=parseFloat(r),d=parseFloat(a),u<d||e.fail(`free(…): the range runs low to high (${u}..${d})`,i,e.i-i),(c<u||c>d)&&e.fail(`free(…): ${c} is outside ${u}..${d}`,i,e.i-i)}e.skipSpace();let p=()=>{if(!/,\s*unit=/y.test(e.text.slice(e.i)))return;let t=e.i;e.i++,e.skipSpace(),e.match(/unit=/y);let r=e.match(/[a-z]+/y)??``,i=r?Or[r]:void 0;(!n||!i)&&e.fail(n?`unit=${r}: a rate's unit (${Object.keys(Or).join(`, `)})`:`unit=: a unit is for a rate (step=, loop=)`,t,e.i-t),l&&e.fail(`free(…${l}, …, unit=${r}): the unit is given twice — written after the number, or as unit= with the numbers a second`,t,e.i-t);let a=e=>+(e*i.per/i.times).toPrecision(12);[c,u,d]=[a(c),a(u),a(d)],l=r,e.skipSpace()};p();let m;if(e.peek()===`,`&&!/,\s*unit=/y.test(e.text.slice(e.i))){e.i++,e.skipSpace();let t=e.match(/"[^"]*"/y);t===null&&e.fail(`names for the choices, in quotes: free(0, 0..3, "a b c d")`),m=t.slice(1,-1).trim().split(/\s+/).filter(Boolean);let n=m.length>1?(d-u)/(m.length-1):0;if(o!==null){let n=e.text.lastIndexOf(`,`,e.i-t.length);e.warn(`free(${e.text.slice(a,n).trim()}, ${t}): a key by name has the twelve pitch names as its choices, so these names are ignored (names of your own go on a range: free(3, 0..11, "…"))`,n,e.i-n),m=void 0}else(!Number.isInteger(u)||!Number.isInteger(d)||m.length<2||!Number.isInteger(n)||n<1)&&e.fail(`free(…, "${m.join(` `)}"): the names spread evenly over ${u}..${d} — ${m.length} names need ${m.length-1} equal whole steps (${u}..${u+m.length-1}, or every 2nd: ${u}..${u+2*(m.length-1)})`,i,e.i-i);e.skipSpace()}p(),e.expect(`)`,`')' to close free(…)`),m??=f;let h={key:t,value:c,unit:l,lo:u,hi:d,span:e.place(i),...r.param===void 0?{}:{param:r.param},...r.whole?{whole:!0}:{},...m?{labels:m}:{},...o===null?{}:{byName:!0}};return e.frees.push(h),h}let W=`no: read as the piece is built`,Pr=e=>`not yet: ${e}`,Fr="`&k`, `lo..hi * &k`",G=e=>e,K={param:G({form:`lpf=n, and every sound parameter`,name:`param`,cell:`${Fr}, on a parameter that moves (pan= and postgain= don't: the renderer's)`,moves:!0,example:`&lead s=saw loop=C4 lpf=free(1200, 200..5000)`}),level:G({form:`level=&a * n (a gate)`,name:`level`,cell:"`&a * &b * n`",moves:!0,example:`&out play=&tune level=&accent*free(.4, 0..1) &tune`}),slot:G({form:`attack=n (an envelope by name)`,name:`slot`,cell:`${Fr}: \`&k\` its values as the slot's (seconds; sustain a level), held at 0 until a note reads it`,moves:!0,example:`&env map=adsr attack=free(.01, 0..1) decay=.3 sustain=.5 release=.4`}),axis:G({form:`sync=n (a style by name)`,name:`axis`,cell:`${Fr}, within the axis (#576)`,moves:!0,example:`&mine map=style sync=free(.3, 0..1) harm=.45 artic=.55 energy=.55`}),end:G({form:`lo..hi * &k (a moving range’s ends) · c ± r`,name:`end`,cell:Pr(`a range’s end is a number or a slider; its cells move what lies between (decision 079)`),example:`&lead s=saw loop=C4 lpf=free(400, 200..800)..free(2400, 1200..4800) * &lfo`}),share:G({form:`swing=8n:n (a swing’s share)`,name:`share`,cell:`${Fr}, one level alone, read at each bar line and held through the bar (decision 081)`,moves:!0,example:`&bar meter("4/4") step=90bpm swing=8n:free(.6, .5...75)`}),depth:G({form:`bend=4n:&t:d (a bend’s depth)`,name:`depth`,cell:`${Fr}, read at each line of its table’s span, held through it (decision 081)`,moves:!0,example:`&bar meter("*.-.+.-.") step=90bpm bend=4n:&(27 23 26 24):free(1, -1..2)`}),legatoShare:G({form:`legato=8n:n (a legato’s share by level)`,name:`share`,cell:Pr(`a meter’s legato by level is its lines’ default; a line moves its own, legato=&artic`),example:`&bar meter("4/4") step=90bpm legato=8n:free(.5, .25..1)`}),gain:G({form:`[&x * n] (a gain in a mix)`,name:`gain`,key:`gain`,cell:"`&k`; a range moved by cells is a cell of its own, `&g [&k * .6 + .2]`, then `[&x * &g]` (decision 079)",moves:!0,example:`&out [&strings * free(.4, 0..1)]`}),hit:G({form:`&x:0:n (a hit’s gain)`,name:`hit`,min:0,cell:"no: a hit’s gain is a number; a moving one is `velocity=&accent`, or a gate’s `level=`",example:`&beat step=8 &bd &hh:0:free(.4, 0..1)`}),weight:G({form:`style=[&a * n, …] (a weight)`,name:`weight`,min:0,cell:"no: a weight is a number; a crossfade is `style=&a..&b * &curve`",example:`&s style=[&funk * free(.8, 0..1), &bossa * .2]`}),tonic:G({form:`scale(name, n) (a tonic)`,name:`tonic`,key:`tonic`,whole:!0,rounds:!0,cell:"`&k` (a note); a tonic is a pitch class, never a range",moves:!0,example:`&key scale(dorian, free(2, 0..11))`}),rate:G({form:`step=n · loop=n (a rate)`,name:`step`,key:`step`,units:!0,cell:"a clock (`step=&bar`): another meaning",moves:!0,example:`&bar scan(4 4 4 4) step=free(90bpm, 60..240)`}),by:G({form:`step=&bar*n · step=&bar/n`,name:`by`,min:0,cell:W,example:`&fast step=&bar*free(2, 1..4) 0 2`}),shift:G({form:`shift=n`,name:`shift`,key:`shift`,whole:!0,rounds:!0,cell:W,example:`&key step=cycle(&theme) shift=free(0, 0..11)`}),stride:G({form:`stride=n`,name:`stride`,key:`stride`,whole:!0,rounds:!0,cell:W,example:`&key step=cycle(&theme) stride=free(0, 0..7)`}),cycle:G({form:`cycle=n`,name:`cycle`,whole:!0,min:0,cell:W,example:`&wheel cycle=free(1, 0..4) 0 4 7`}),laps:G({form:`laps=n`,name:`laps`,whole:!0,min:1,cell:W,example:`&bar scan(4 4 4 4) step=84bpm laps=free(30, 1..60)`}),chance:G({form:`chance=p`,name:`chance`,key:`chance`,cell:W,example:`&ghost chance=free(.7, 0..1) step=4 0? 0?`}),seed:G({form:`seed=n`,name:`seed`,whole:!0,cell:W,example:`&ghost seed=free(7, 0..99) step=4 0? 0? 0? 0?`}),size:G({form:`size=x`,name:`size`,min:.25,max:4,cell:W,example:`&theme size=free(2, .25..4) step=2 0 2 4`}),interval:G({form:`scan(n …) (an interval)`,name:`interval`,key:`interval`,cell:W,example:`&swing scan(free(2, 1..3) 1) step=120bpm`}),intervals:G({form:`scan(n!k …) (an interval’s repeat)`,name:`repeat`,whole:!0,min:1,cell:W,example:`&map scan(1!free(4, 1..8) 2)`}),geo:G({form:`geo(r, n, k …)`,name:`geo`,cell:W,example:`&series scan(geo(free(5, 2..8), 25, 0 10 5))`}),args:G({form:`euclid(k, n, r) · even(k, n, r) · sin(n) …`,name:`arg`,whole:!0,cell:W,example:`&hits euclid(free(3, 0..8), 8) step=8`}),fifths:G({form:`fifths(n)`,name:`fifths`,whole:!0,cell:W,example:`&circle fifths(free(1, 0..11))`}),phase:G({form:`scale(t, phase) (retired)`,name:`phase`,whole:!0,min:0,max:6,cell:W,example:`&key scale(2, free(3, 0..6))`}),meter:G({form:`meter(n, n)`,name:`meter`,key:`choice`,cell:W,example:`&bar meter(free(2, 0..3, "2/4 3/4 4/4 6/8")) step=90bpm`}),grid:G({form:`map=edo(n) · map=ed(n, r) · map=midi(c, p)`,name:`grid`,whole:!0,min:1,cell:W,example:`&edo map=edo(free(19, 5..31))`}),ratio:G({form:`map=ed(r)`,name:`ratio`,cell:W,example:`&bp cycle=13 map=ed(free(3, 1.5..4))`}),step:G({form:`0 2 4 (a step of a braid)`,name:`value`,cell:"a cell plays there (`&k`, spliced)",moves:!0,example:`&tune step=2 0 free(2, 0..7) 4`}),modifier:G({form:`x!n · x@n · x*n · x/n`,name:`count`,whole:!0,min:1,max:4096,cell:W,example:`&beat step=4 0!free(4, 1..8) 2`}),drop:G({form:`x?p`,name:`drop`,min:0,max:1,cell:W,example:`&hats step=4 0 0?free(.3, 0..1)`}),euclidOn:G({form:`x(k, n, r)`,name:`euclid`,whole:!0,cell:W,example:`&groove step=1 0(free(3, 0..8),8)`}),pick:G({form:`&x[i] · &x[a:b:s] · &x[$i]`,name:`pick`,whole:!0,cell:`${W}: picking while it plays is a selector's (#51)`,example:`&tune step=2 &motif[free(0, 0..3)]`}),turn:G({form:`&x[<<n] · &x[>>n]`,name:`turn`,whole:!0,min:0,cell:W,example:`&canon step=2 &theme[>>free(4, 0..7)]`}),move:G({form:`&x^n · &x^$n`,name:`move`,whole:!0,cell:W,example:`&tune step=2 &motif &motif^free(1, -7..7)`}),tier:G({form:`tier=n`,name:`tier`,fixed:`the tutorial's order, not the piece's`,cell:W,example:`&piece title="Steps" tags="tutorial" tier=1`}),hitNumber:G({form:`&x:n (a hit’s number)`,name:`hit`,fixed:`a pitched hit is not yet: it is 0`,cell:W,example:`&beat step=8 &bd:0`})},Ir=/[A-Za-z_][A-Za-z0-9_]*/y,Lr=/-?[0-9]+/y,Rr=/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)\.\.-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)\s*\*\s*&/y,zr=/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y,Br=4096;var Vr=class extends Error{col;len;constructor(e,t,n=1){super(e),this.col=t,this.len=n}},Hr=class e{text;line;offset;lambdas;parts;warnings;depth;body;i=0;frees=[];constructor(e,t,n=0,r=[],i=[{line:t,start:0}],a=[],o=0,s){this.text=e,this.line=t,this.offset=n,this.lambdas=r,this.parts=i,this.warnings=a,this.depth=o,this.body=s}within(t,n,r=this.depth){return new e(t,this.line,this.offset+n,this.lambdas,this.parts,this.warnings,r,this.body)}warn(e,t,n){this.warnings.push({severity:`warning`,message:e,span:{...this.place(t),len:n}})}place(e){let t=e+this.offset,n=this.parts[0];for(let e of this.parts)e.start<=t&&(n=e);return{line:n.line,col:t-n.start+1,len:Math.max(1,this.i-e)}}skipSpace(){for(;this.i<this.text.length&&/\s/.test(this.text[this.i]);)this.i++}done(){return this.skipSpace(),this.i>=this.text.length}peek(){return this.text[this.i]??``}span(e){return{line:this.line,col:e+1+this.offset,len:Math.max(1,this.i-e)}}fail(e,t=this.i,n=1){throw new Vr(e,t+this.offset,n)}match(e){e.lastIndex=this.i;let t=e.exec(this.text);return t?(this.i+=t[0].length,t[0]):null}ident(e){let t=this.match(Ir);return t===null&&this.fail(`Expected ${e}`),t}free(e,t=e.name){if(!this.text.startsWith(`free(`,this.i))return this.refuseCell(e),null;let n=this.i;e.fixed&&this.fail(`${e.form}: a number, not free(…) — ${e.fixed}`,n,5);let r=e.key??`param`,i=Nr(this,r,!!e.units,{...r===`param`?{param:t}:{},...e.whole?{whole:!0}:{}}),a=this.i-n;return i.text!==void 0&&r!==`choice`&&this.fail(`free("…") is a text, for spell(…) and meter(…): ${e.form} takes free(v, lo..hi)`,n,a),e.whole&&!e.rounds&&![i.lo,i.hi].every(Number.isInteger)&&this.fail(`${e.form} takes a whole number: free(…)'s range whole — free(${Math.round(i.value)}, ${Math.floor(i.lo)}..${Math.ceil(i.hi)})`,n,a),(e.min!==void 0&&i.lo<e.min||e.max!==void 0&&i.hi>e.max)&&this.fail(`${e.form}: free(…) moves within ${e.min??`…`}..${e.max??`…`} — free(${i.value}, ${Math.max(i.lo,e.min??i.lo)}..${Math.min(i.hi,e.max??i.hi)})`,n,a),i}freeNumber(e,t){let n=this.free(e,t);return n===null?null:e.whole?Math.round(n.value):n.value}refuseCell(e){Rr.lastIndex=this.i;let t=Rr.test(this.text);if(!t&&(this.peek()!==`&`||e.moves))return;let n=Math.max(1,/^[^\s,)\]]*/.exec(this.text.slice(this.i))[0].length),r=t?`a range moved by cells`:`a cell`;this.fail(e.cell.startsWith(`no: read as the piece is built`)?`${e.form} is read as the piece is built: a number, or free(v, lo..hi), whose slider compiles it again — ${r} moves only a number read while the piece plays (decision 078)`:`${e.form} takes a number, or free(v, lo..hi), and ${r} isn't read here: ${e.cell.replace(/^no: /,``)} (decision 078)`,this.i,n)}int(e,t,n){let r=this.freeNumber(t,n);if(r!==null)return r;let i=this.match(Lr);return i===null&&this.fail(`Expected ${e}`),parseInt(i,10)}num(e,t,n){let r=this.freeNumber(t,n);if(r!==null)return{value:r,alter:0};let i=this.match(zr);i===null&&this.fail(`Expected ${e}`);let a=parseFloat(i);if(this.peek()===`/`&&/[0-9.]/.test(this.text[this.i+1]??``)){this.i++;let e=this.match(zr);(e===null||parseFloat(e)===0)&&this.fail(`a fraction needs a denominator, like 9/8`),a/=parseFloat(e)}let o=0;for(;this.peek()===`#`||this.peek()===`b`;)o+=this.text[this.i++]===`#`?1:-1;return{value:a,alter:o}}noteName(){let e=this.match(/[A-G](?:#|b)?(?:-?[0-9]+)?(?![A-Za-z0-9_])/y);return e===null?null:Dr(e)}expect(e,t){this.peek()!==e&&this.fail(`Expected ${t}`),this.i++}lambda(){let e=this.i;this.depth>=32&&this.fail(`Unnamed cells &( … ) nest 32 deep at most: name the inner ones (&env …) and refer to them`,e-1,2);let t=0,n=-1;for(let r=e;r<this.text.length;r++)if(this.text[r]===`(`)t++;else if(this.text[r]===`)`&&--t===0){n=r;break}n<0&&this.fail(`')' to close &( … )`,e);let r=`λ${this.line}_${e+this.offset}`;this.body||this.fail(`An unnamed cell &( … ) here has no parser for its body`,e-1,2);let i=this.within(this.text.slice(e+1,n),e+1,this.depth+1),a=this.body(i,{name:r,pick:null,shift:0,span:{line:this.line,col:e+this.offset,len:n-e+2}});return this.lambdas.push({...a,lambda:this.text.slice(e+1,n).trim()}),this.i=n+1,r}ref(e){let t=this.i;this.expect(`&`,e);let n=this.peek()===`(`?this.lambda():this.ident(`a name after &`),r=null,i=0;if(this.peek()===`[`){this.i++,this.skipSpace();let e=this.match(/<<|>>/y);if(e){this.skipSpace();let a=this.freeNumber(K.turn),o=a===null?this.match(/[0-9]+/y):String(a);return i=(e===`<<`?-1:1)*(o===null?1:parseInt(o,10)),this.skipSpace(),this.expect(`]`,`']' to close &${n}[${e}…]`),{name:n,pick:r,shift:i,...this.transposition(n),span:this.span(t)}}let a=this.match(/[a-z][A-Za-z]*(?=\s*\])/y);if(a!==null)return this.skipSpace(),this.expect(`]`,`']' to close &${n}[${a}]`),{name:n,pick:r,shift:i,slot:a,...this.transposition(n),span:this.span(t)};let o=this.peek()===`$`&&(this.i++,this.skipSpace(),1)?{abs:!0}:{},s=()=>{let e=this.freeNumber(K.pick);return e===null?this.match(Lr):String(e)},c=s();if(this.skipSpace(),this.peek()===`:`){this.i++,this.skipSpace();let e=s();this.skipSpace();let t=null;if(this.peek()===`:`){this.i++,this.skipSpace();let e=this.i,n=s();n!==null&&parseInt(n,10)===0&&this.fail(`A slice step of 0 never moves`,e,n.length),t=n===null?null:parseInt(n,10),this.skipSpace()}r={kind:`slice`,from:c===null?null:parseInt(c,10),to:e===null?null:parseInt(e,10),...t===null?{}:{step:t},...o}}else c===null&&this.fail(`Expected an index like &${n}[0] (&${n}[$0] as written), or a slice like &${n}[1:]`),r={kind:`at`,i:parseInt(c,10),...o};this.expect(`]`,`']' to close &${n}[…]`)}else if((this.peek()===`+`||this.peek()===`-`)&&/[0-9]/.test(this.text[this.i+1]??``)){let e=this.peek(),r=/[0-9]+/.exec(this.text.slice(this.i+1))[0];this.fail(`&${n}${e}${r}: write &${n}^${e===`-`?`-`:``}${r} to move it by its table's steps (in a braid; ^$${e===`-`?`-`:``}${r}: by semitones), &${n} ${e} ${r} to add pitch (in a mix), &${n}[${e===`-`?`<<`:`>>`}${r===`1`?``:r}] to shift it, or &${n}[…] to pick from it`,t,this.i-t+1+r.length)}return{name:n,pick:r,shift:i,...this.transposition(n),span:this.span(t)}}rejectTap(e){if(this.peek()!==`:`)return;let t=/^(?:(?:pulse|beat)(?:\*\d+)?|\d+[nt]\.?|\d*m)(?![\w.])/.exec(this.text.slice(this.i+1));if(!t)return;let n=this.text.slice(e,this.i+1+t[0].length);this.fail(`${n} is a meter's tap, which only step= reads (step=${n}): here it names no cell`,e,n.length)}cellRef(e,t,n=!1){let r=this.i,i=this.ref(e);n||this.rejectTap(r);let a=this.text.lastIndexOf(`^`,this.i-1);return a>=r&&a>this.text.lastIndexOf(`)`,this.i-1)&&this.warn(`${this.text.slice(r,this.i)} ${t}: ^ and ^$ move a cell a braid plays (and base=&cell^n, a copy, and a gate's play=&cell^n); here it is the cell itself, so the move is ignored`,a,this.i-a),i}transposition(e){if(this.peek()!==`^`)return{};let t=this.i;this.i++;let n=this.peek()===`$`;n&&this.i++;let r=this.freeNumber(K.move),i=r===null?this.match(/-?[0-9]+/y):String(r);i===null&&this.fail(`&${e}^n moves it n steps of its table (&${e}^1, a degree up), &${e}^$n n semitones (&${e}^$7, &${e}^$-12)`,t,1),this.peek()===`.`&&/[0-9]/.test(this.text[this.i+1]??``)&&this.fail(`&${e}${this.text.slice(t,this.i)}…: ^ takes a whole number of steps (&${e}^1, &${e}^$-12)`,t,this.i-t+1+/^[0-9]+/.exec(this.text.slice(this.i+1))[0].length),this.peek()===`^`&&this.fail(`&${e}${this.text.slice(t,this.i)}^…: one ^ per reference; nest with degree(…): degree(&${e}${this.text.slice(t,this.i)}, n)`,this.i,1);let a=parseInt(i,10);return a?n?{transpose:a}:{degree:a}:{}}atBoundary(){let e=this.peek();return e===``||/\s/.test(e)}};function Ur(e){let t=!1;for(let n=0;n<e.length;n++){let r=e[n];if(r===`"`)t=!t;else if(!t&&r===`/`&&e[n+1]===`/`)return e.slice(0,n);else if(!t&&r===`#`&&(n===0||/\s/.test(e[n-1])))return e.slice(0,n)}return e}let q=(e,t,n)=>({help:e,doc:t,value:`syntax`,...n?{on:n}:{}}),J=(e,t={})=>({help:e,doc:`sound.md`,value:`number`,on:[`voice`],voice:!0,...t}),Y=(e,t,n={})=>({help:e,doc:`physics.md`,value:`number`,on:t,...n}),Wr={over:q(`the table its numbers read`,`tables.md`),base:q(`the cell it is a copy of, changed where it says: its braid step by step over the base’s (= keeps a step), its attributes where it sets none`,`braid.md`),step:q(`what moves it, step by step`,`time.md`),loop:q(`what moves it, the whole braid at a time, read as a signal: each value held, no note started each step (a voice alone sounds as one held note, &a loop=A4)`,`time.md`),shift:q(`how far it is turned`,`tables.md`),stride:q(`how far each step turns it`,`time.md`),map:q(`how its values sound`,`sound.md`),show:q(`how it’s shown: notes, do, scale, pattern … (and everything below it)`,`display.md`),label:q(`a name to show, in quotes — alone on a cell, a note in the graph`,`display.md`),env:q(`a voice’s own volume on every note: an envelope`,`sound.md`,[`voice`]),pitch:{...q(`a voice’s own pitch on every note: a vibrato, or a shape in semitones (pitch=0..30 * &(map=adsr 0 .04 0 0): a drop)`,`sound.md`,[`voice`]),moves:!0},cycle:q(`laps before it comes round: a turning table’s, an index read through it, a tap’s bars; 0 holds the first entry (a grid’s size is its map’s, map=edo(19))`,`tables.md`),size:q(`how large it’s drawn, against the others: 2 twice, .5 half`,`display.md`),laps:q(`how many laps it plays, then it ends`,`time.md`),chance:q(`what a bare x? means here: the probability it is dropped, or free() for a slider`,`cell.md`),seed:q(`a different sequence of chance`,`cell.md`),title:{...q(`on a note: the piece’s title (its card), the old spelling: its file’s frontmatter holds it`,`display.md`,[`note`]),old:`title: in the frontmatter`},tags:q(`on a cell: its clusters in the graph, comma-separated (on the piece’s card, the old spelling of its tags: its file’s frontmatter holds them)`,`display.md`),about:q(`on a note: the cells it explains`,`display.md`,[`note`]),style:q(`its style: a map=style cell, &(map=style …), or a mix of them by weight; or a range from one to another over its scope (style=&funk..&bossa). On the note &style, the section’s, read by axis (&style[artic])`,`style.md`),tier:{...q(`on a piece’s card: its tier of the tutorial (1 the first), the old spelling: its file’s frontmatter holds it`,`display.md`,[`note`]),old:`tier: in the frontmatter`}},Gr={s:J(`sound source: sine tri saw square pulse white pink brown; or a blend of two waves, the share of the second moved by cells: s=tri..square * &style[artic]`,{value:`word`}),lpf:J(`low-pass cutoff, Hz`,{moves:!0,hz:!0}),lpq:J(`low-pass resonance`,{moves:!0}),hpf:J(`high-pass cutoff, Hz`,{moves:!0,hz:!0}),hpq:J(`high-pass resonance`,{moves:!0}),bpf:J(`band-pass centre, Hz (decision 074)`,{moves:!0,hz:!0}),bpq:J(`band-pass Q: the centre over the bandwidth, 1 unless given (decision 074)`,{moves:!0}),ftype:J(`its filters' model (decision 074): 12db (the default, one biquad each), 24db (two in series), ladder (its low-pass a ladder, lpq= its resonance, drive= its drive); or superdough's numbers 0, 2, 1`,{value:`word`}),room:J(`reverb send 0–1`,{moves:!0}),delay:J(`delay send 0–1`,{moves:!0}),delaytime:J(`echo time, seconds — or a clock: &bar*2 (an eighth at the tempo) — or a tap: 8n, 4n.`,{clock:!0}),delayfeedback:J(`echo feedback 0–1`),glide:{help:`tied notes (each starting as the one before ends) play as one: its envelope once, each next a slide there over this many seconds (dough’s glide; 0 or none: each note its own)`,doc:`sound.md`,value:`number`,on:[`voice`]},oneshot:{help:`on a voice: 1 plays each note’s envelope through (its attack and decay), whatever its step, a drum hit on any grid; 0, the default, as long as its step (decision 068: the bare word oneshot, the old way)`,doc:`sound.md`,value:`number`,on:[`voice`]},note:{help:"on a kit’s member: its MIDI note on the kit’s channel (36 a kick, 38 a snare, General MIDI’s drums: `gm_kit` writes each), a whole number 0–127; its name gives none (decision 075). A member with none takes the next free note from 36",doc:`midi.md`,value:`number`,on:[`voice`],form:`note=n (a whole number 0–127)`},legato:{help:`on a line: each note sounds its written length (@n, _) times this share, its end swung as its onset is, Strudel’s legato (.5 staccato, 1 as written, 1.5 into the next): a number, free(), or a cell of shares read at each onset (legato=&artic); nothing cuts a note at the bar line`,doc:`sound.md`,value:`number`,on:[`clock`,`driven`],moves:!0,form:`legato=n · legato=free(n, lo..hi) · legato=&x · legato=lo..hi * &a * &b · on a meter, its lines’ default by level: legato=16n:r,4n:r`},pan:J(`where it sits in stereo: 0 left, .5 centre (as without it), 1 right — the far side fades`),distort:J(`distortion: 0 clean, .3 gritty, 1 and more harsh`),crush:J(`bit depth: 16 clean, 8 grainy, 3 and fewer: rubble`),fm:J(`frequency modulation: the voice that modulates this one (fm=&op); it may have its own fm=`,{doc:`physics.md`,value:`cell`}),ratio:J(`as a modulator: its frequency against its carrier’s (1 the same, 3.5 a bell)`,{doc:`physics.md`,on:[`modulator`]}),index:J(`FM depth: how far the modulator swings the frequency (0 none … 10 bright); it can move`,{doc:`physics.md`,on:[`carrier`],moves:!0}),body:J(`a resonator: what its exciters are — fork, bell, bar, plate, box, tine, pipe, wire, spring; its braid lists them (semitones; the twelve by default), a note plucks the nearest`,{doc:`physics.md`,value:`word`}),ring:J(`a resonator: how long it rings, in seconds`,{doc:`physics.md`}),hard:J(`a resonator: the mallet — 0 felt (dark), 1 steel (bright)`,{doc:`physics.md`}),board:Y(`a resonator: the body its exciters share (box by default, an octave below; none: no board)`,[`resonator`],{value:`word`}),couple:Y(`a resonator: another it shares a table with (couple=&other) — each sets the other ringing`,[`resonator`],{value:`cell`}),coupling:Y(`a resonator: how strongly it is coupled (.01 faint, .05 strong)`,[`resonator`]),excite:Y(`a resonator: sound that drives it (excite=&mix) — it answers where the sound meets its modes`,[`resonator`],{value:`cell`}),postgain:{help:`on the sound card: its master, a linear gain after everything (Strudel’s postgain: 1 as it is, .5 half, a negative one inverts the phase; free(.8, 0..1) a slider)`,doc:`mix.md`,value:`number`,on:[`card`]},beat:{help:`on a meter, retired (#502): how many beats it counted, equal; a meter counts its beats by its signature or its levels (meter("2/2", 2): alla breve)`,doc:`time.md`,value:`number`,on:[`clock`],old:`the signature: meter("2/2", 2)`},pulse:{help:`on a scan: the note value of its entries (pulse=16n: sixteenths) — its beats then count quarters, and its taps read note values by it`,doc:`time.md`,value:`word`,on:[`clock`,`driven`]},swing:{help:`on a meter: a level of its bar leans, named by note value — of each pair of its eighths (swing=8n:.67), the second comes this far through their beat (.5 straight, .67 triplet swing), its pairs alone, a group of three straight (decision 071); every beat and bar line stays. Bare (swing=.6), on a list: pairs of its steps`,doc:`time.md`,value:`number`,on:[`clock`],form:`swing=8n:r · swing=8n:r,16n:r · swing=8n:free(r, lo..hi) · swing=r`},bend:{help:`on a meter: a level’s nodes played at the lengths a table gives, named by note value — bend=4n:&rubato with &rubato 27 23 26 24 plays the beats 27:23:26:24 of the bar (decision 080); finer levels within each, swung as they would be; a table longer than the bar spans as many bars as it takes, a tempo map. A scan(…) with a rate is its sugar`,doc:`time.md`,value:`cell`,on:[`clock`],form:`bend=4n:&table`},motor:Y(`on a meter: it turns physically — a motor this strong pulls it to its tempo (from rest)`,[`clock`]),mass:Y(`physics: how heavy it turns (inertia); on a cell a meter drives, load`,[`clock`,`driven`]),friction:Y(`physics: drag — the meter sags below its tempo, more with more load`,[`clock`,`driven`]),wind:Y(`on a meter with a motor: its spring runs down over this many seconds, and it coasts to a stop`,[`motor`]),wow:Y(`on a meter with a motor: its speed swings slowly by this fraction (.01: a tape machine’s wow)`,[`motor`]),varispeed:Y(`on a clock: its notes’ pitch follows its speed, as tape does (1 fully, 0 not)`,[`clock`,`driven`]),belt:Y(`on a driven cell (step=&x): it follows through a belt this stiff (200 taut, 20 slack) — it lags, swings, catches up`,[`driven`]),damping:Y(`a belt’s damping: how soon its swinging dies (0 rings on, high creeps)`,[`driven`]),slip:Y(`a belt’s grip: past this pull it slips, and the cell falls behind for good`,[`driven`]),write:Y(`a tape: what its write head records (write=&melody); it moves with its step=`,[`tape`],{value:`cell`}),length:Y(`a tape: how long its loop is, in seconds of tape (or a clock: length=&bar/4, or a tap: length=1m); none, an open reel`,[`tape`],{clock:!0}),erase:Y(`a tape: how much of what was there each pass under the write head wipes (1 all, .3 leaves ghosts)`,[`tape`]),tone:Y(`a sound tape: its loss — each pass through the loop darker (Hz: 7000 bright, 1500 worn)`,[`tape`],{hz:!0}),drive:Y(`how hard it saturates: a sound tape, each pass (0 clean, .5 warm, 1 crushed); a ladder (ftype=ladder, decision 074), its input pushed by e^drive into its stages, .69 unless given (superdough's)`,[`tape`,`voice`]),hiss:Y(`a sound tape: its noise floor (0 none, .02 a cassette)`,[`tape`]),print:Y(`a sound tape: print-through — a faint pre-echo before each head (.03 a whisper)`,[`tape`]),printgap:Y(`a sound tape: how far before each head the print-through sits (tape-seconds, .6)`,[`tape`]),dropout:Y(`a sound tape: brief gaps in the playback, about this many a second`,[`tape`],{hz:!0}),play:Y(`a read head: the tape it reads (play=&tape), at= tape-seconds after the write head; a gate: the notes it plays on the voices in its braid (play=&tune)`,[`head`,`gate`],{value:`cell`}),at:Y(`a read head: how far after the write head it sits, in seconds of tape (or a clock: at=&bar, or a tap: at=4n)`,[`head`],{clock:!0}),wander:Y(`a read head: how far it wanders either way (tape-seconds) — a flying head`,[`head`]),wanderhz:Y(`a read head: how fast it wanders (times a second)`,[`head`],{hz:!0}),level:{help:`on a gate: how loud, a product of level cells and a gain (level=&accent*&duck*.4)`,doc:`mix.md`,value:`number`,on:[`gate`]},licence:{help:`on a gate: its performer’s licence, how far it loosens velocity and length, a share of the feel’s (1 as the contract plays; 0 exactly as written)`,doc:`mix.md`,value:`number`,on:[`gate`]},accents:{help:`on a gate: its performer’s own accents, a share of the feel’s (1 as the contract plays; 0 none)`,doc:`mix.md`,value:`number`,on:[`gate`]},trigger:{help:`a gate, the old spelling of play=: the notes it plays (trigger=&tune)`,doc:`mix.md`,value:`cell`,on:[`gate`],old:`play=`},gate:{help:`a gate, the old spelling: a level over time, one factor of level= (gate=&duck)`,doc:`mix.md`,value:`cell`,on:[`gate`],old:`level=`},velocity:{help:`a gate, the old spelling: a level, one factor of level= (velocity=&accent)`,doc:`mix.md`,value:`cell`,on:[`gate`],old:`level=`},gain:{help:`on a voice: its own gain, dough’s, times every gain it is played at (1 by default, a negative one inverts the phase; a kit member’s balance); on a gate written the old way (trigger=): the number in level=`,doc:`sound.md`,value:`number`,on:[`voice`,`gate`]},scope:{help:`a scope: stack, split, xy (in time) — spectrum, waterfall (in frequency, or value); its braid lists its channels`,doc:`display.md`,value:`word`,on:[`scope`]},fold:{help:`a spectrum or waterfall: pitches folded by this stride into as many bins (12: by pitch class, the default)`,doc:`display.md`,value:`number`,on:[`scope`]},bins:{help:`a spectrum or waterfall without a fold: this many bands, low to high (1 a meter, 3 low-mid-high, 20 an equaliser)`,doc:`display.md`,value:`number`,on:[`scope`]},channels:{help:`a spectrum or waterfall: sum (one, the default) or split (each channel its own)`,doc:`display.md`,value:`word`,on:[`scope`]},restart:{help:`what switching a part on does to its time (on a selector: for all its sections) — restart (from its top, the default), resume (where it stopped), free (its time runs on, only its sound is switched; a performer’s default)`,doc:`time.md`,value:`word`,on:[`section`,`performer`,`selector`],stub:!0},law:{help:`a law that computes the notes (law=fiveto12: the 5 to 12 cycle, a day of music)`,doc:`time.md`,value:`word`,on:[`law`]},anchor:{help:`a clock (a day meter, loop=1d): the time of day it stands at when play starts (hours.minutes — 11.55); play begins where the clock stands`,doc:`time.md`,value:`number`,on:[`clock`]}},Kr={sound:`s`,cutoff:`lpf`,ctf:`lpf`,lp:`lpf`,resonance:`lpq`,hcutoff:`hpf`,hp:`hpf`,hresonance:`hpq`,bandf:`bpf`,bp:`bpf`,bandq:`bpq`,verb:`room`,reverb:`room`,delayt:`delaytime`,dt:`delaytime`,delayfb:`delayfeedback`,dfb:`delayfeedback`,clip:`legato`},qr={...Wr,...Gr},Jr=new Set(Object.keys(Gr).filter(e=>Gr[e].value===`cell`)),Yr=new Set(Object.keys(Gr).filter(e=>Gr[e].clock)),Xr=new Set(Object.keys(qr).filter(e=>qr[e].moves)),X=new Set(Object.keys(Gr).filter(e=>Gr[e].voice)),Zr=new Set(Object.keys(Gr).filter(e=>Gr[e].doc!==`physics.md`&&Gr[e].on?.every(e=>e===`clock`||e===`driven`))),Qr=e=>Object.keys(e).some(e=>!Zr.has(e));function $r(e){let t={voice:`a voice`,clock:`a meter (step= a rate)`,driven:`a driven cell (step=&x)`,motor:`a meter with a motor=`,tape:`a tape (write=)`,head:`a read head (play=)`,resonator:`a resonator (body=)`,scope:`a scope (scope=)`,law:`a law (law=)`,card:`the sound card (map=sample)`,note:`a note (a label= and nothing else)`,carrier:`a voice with fm=`,modulator:`a voice another’s fm= names`,gate:`a gate (play= with a braid)`,section:`a section (a name a stepped table of names declares)`,performer:`a performer (a gate or a role a band names)`,selector:`a selector (over= a table of sections, or a band)`},n=e.map(e=>t[e]);return n.length<2?n[0]??``:`${n.slice(0,-1).join(`, `)} or ${n[n.length-1]}`}function ei(e){let t=null,n=e.length<5?2:3;for(let r of Object.keys(qr)){let i=ti(e,r);i<n&&([t,n]=[r,i])}return t}function ti(e,t){let n=Array.from({length:e.length+1},(e,n)=>[n,...Array(t.length).fill(0)]);for(let e=1;e<=t.length;e++)n[0][e]=e;for(let r=1;r<=e.length;r++)for(let i=1;i<=t.length;i++)n[r][i]=Math.min(n[r-1][i]+1,n[r][i-1]+1,n[r-1][i-1]+(e[r-1]===t[i-1]?0:1)),r>1&&i>1&&e[r-1]===t[i-2]&&e[r-2]===t[i-1]&&(n[r][i]=Math.min(n[r][i],n[r-2][i-2]+1));return n[e.length][t.length]}let ni=[`12db`,`ladder`,`24db`];function ri(e){return e===void 0?`12db`:typeof e==`number`?Number.isInteger(e)&&e>=0&&e<ni.length?ni[e]:null:ni.includes(e)?e:null}Object.fromEntries(Object.entries(Gr).map(([e,t])=>[e,t.help]));let ii={sine:`sine`,tri:`triangle`,triangle:`triangle`,saw:`sawtooth`,sawtooth:`sawtooth`,square:`square`,pulse:`square`,white:`white`,pink:`pink`,brown:`brown`},ai=e=>`${e}= is gone: an envelope is a cell — in the mix, &theme * &(map=adsr .01 .3 .5 .4) * &lead, or an instrument, &lead [&(map=adsr .01 .3 .5 .4) * &saw]; on the envelope, its slots by name: &(map=adsr attack=.01 decay=.3 sustain=.5 release=.4)`,oi=e=>`${e}= is gone: a pitch drop is a pitch shape, an envelope in semitones — penv=30 pdec=.04 is pitch=0..30 * &(map=adsr 0 .04 0 0)`,si={attack:ai(`attack`),decay:ai(`decay`),sustain:ai(`sustain`),release:ai(`release`),penv:oi(`penv`),pdec:oi(`pdec`)},ci=`fifths12TET`,li=`key:main`,ui=5e4,di=2e3,fi=[`name`,`notes`,`tonic`,`mode`,`steps`,`tempo`,`shift`],pi={fork:[[1,1,1],[6.27,.03,.35]],bell:[[.5,1,.5],[1,.8,1],[1.2,.6,.7],[1.5,.5,.45],[2,.45,.6],[2.5,.3,.35],[2.67,.28,.3],[3,.22,.25]],bar:[[1,1,1],[2.756,.45,.5],[5.404,.22,.3],[8.933,.12,.18]],plate:[[1,1,.8],[1.58,.8,.7],[2.24,.7,.6],[2.92,.55,.55],[3.15,.5,.5],[3.88,.4,.4],[4.47,.35,.35],[5,.3,.3]],box:[[1,1,1],[1.42,.7,.6],[1.91,.5,.45],[2.53,.35,.3]],tine:[[1,1,1],[5.93,.12,.35],[17.6,.03,.12]],pipe:[1,3,5,7,9,11,13].map(e=>[e,1/Math.sqrt(e),1/e]),wire:Array.from({length:12},(e,t)=>t+1).map(e=>[e*Math.sqrt(1+6e-4*e*e),1/(.6+.4*e),1/e]),spring:[[1,1,1]]};function mi(e){if(typeof e!=`number`)return[1,1];let t=Math.min(1,Math.max(0,e));return[Math.min(1,2*(1-t)),Math.min(1,2*t)]}let hi=e=>e?.map?.kind===`midi`,gi=e=>t=>e.cells.get(t)?.shift??0,_i={SAMPLE_RATE:48e3,A4:440},vi={C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2};function yi(e,t=440){let n=/^([A-G])([#b]?)(-?\d+)$/.exec(e);return n?t*2**((vi[n[1]]+(n[2]===`#`?1:n[2]===`b`?-1:0)+12*(parseInt(n[3],10)-4))/12):null}function bi(e,t){if(!t)return Array.from({length:e},(e,t)=>t);if(t.kind===`at`){let n=t.i<0?e+t.i:t.i;return n>=0&&n<e?[n]:null}let n=t.step??1,r=t=>t<0?e+t:t,i=[];if(n>0){let a=t.from===null?0:Math.max(0,Math.min(e,r(t.from))),o=t.to===null?e:Math.max(0,Math.min(e,r(t.to)));for(let e=a;e<o;e+=n)i.push(e)}else{let a=t.from===null?e-1:Math.max(-1,Math.min(e-1,r(t.from))),o=t.to===null?-1:Math.max(-1,Math.min(e-1,r(t.to)));for(let e=a;e>o;e+=n)i.push(e)}return i.length?i:null}function xi(e,t,n){let r=bi(e,t);return!r||!t||t.abs||!e?r:r.map(t=>((t+n)%e+e)%e)}function Si(e,t){if(!t)return e.steps;let n=xi(e.units.length,t,e.shift);return n?n.reduce((t,n)=>t+e.unitSteps[n],0):null}function Ci(e,t,n){let r=`&${e}${pn(t)}`,i=`&${e} has ${n} step${n===1?``:`s`}`;if(!t||t.kind===`at`)return`${r} picks nothing: ${t&&t.i<0?`before the start`:`past the end`}, ${i}`;let a=t.step??1;return a>0&&t.from!==null&&(e=>e<0?n+e:e)(t.from)>=n?`${r} picks nothing: it starts past the end, ${i}`:`${r} picks nothing: ${a>0?`it ends before it starts (a slice runs forwards unless its step is negative: [::-1])`:`it ends after it starts (a negative step runs backwards)`}, ${i}`}function wi(e){if(e.map?.kind!==`adsr`)return null;let t=e.units.map(e=>e.atom.kind===`note`?e.atom.value:NaN);return t.length!==4||t.some(e=>!(e>=0))?null:{attack:t[0],decay:t[1],sustain:Math.min(1,t[2]),release:t[3]}}function Ti(e){return e.root||e.scan!==null||!!e.bend}let Ei=e=>e.levels.length/Math.max(1,e.pulses);function Di(e){let t=/^([1-9][0-9]*)(n\.?|t)$/.exec(e);if(!t)return null;let n=parseInt(t[1],10);return t[2]===`n.`?3/(2*n):t[2]===`t`?2/(3*n):1/n}function Oi(e,t){let n=1/t,r=n/4;if(!(r>1))return{...e,unit:n};let i=[];for(let t=0;t<e.pulses-1e-9;t+=r)i.push(Math.min(r,e.pulses-t));return{...e,unit:n,beats:i,counted:e.pulses/r}}let ki=e=>e.counted??Math.max(1,e.beats.length);function Ai(e,t){let n=Math.max(1,Math.round(t)),{counted:r,...i}=e;return{...i,beats:Array.from({length:n},()=>e.pulses/n)}}function ji(e,t,n,r,i=1){let a=[],o=0;for(let s=0;s<n*r;s++){let n=e[s%e.length],r=i===1?n:n**+i;for(let e=0;e<t;e++)a.push(o+e*r/t);o+=r}return{positions:a,lap:o}}function Mi(e,t){let n=t.filter(e=>e.share!==.5);return n.length?{...e,swing:n}:e}function Ni(e){let t=e=>Math.abs(e-Math.round(e))<1e-9&&Math.round(e)>=1&&Number.isInteger(Math.log2(Math.round(e)));return t(1/e)?`${Math.round(1/e)}n`:t(2/(3*e))?`${Math.round(2/(3*e))}t`:t(3/(2*e))?`${Math.round(3/(2*e))}n.`:null}let Pi=e=>Ni(1/(e.unit*Ei(e)));function Fi(e,t){let n=t*e.unit;if(!e.beats.some(e=>{let t=e/n;return Math.abs(t-Math.round(t))<1e-9&&Math.round(t)>=2}))return`no beat of this meter divides into two or more of ${Ni(t)??`them`} (its beats: ${e.beats.map(t=>Ni(t/e.unit)??t).join(` `)}), and swing never moves a beat`;let r={...e,swing:[{level:Ni(t)??``,whole:t,share:.6}]};for(let t=0;t*n<e.pulses-1e-9;t++)if(Math.abs(zi(r,t*n)-t*n)>1e-9)return null;return`every group of ${Ni(t)??`them`} in it is three, and a swing leans pairs alone, its groups of three straight`}let Ii=e=>{for(let t=0,n=e;t<=6;t++,n*=2)if(Math.abs(n-Math.round(n))<1e-9)return!0;return!1};function Li(e,t){return t!==null&&e===2?[0,Math.min(.95,Math.max(.05,t.share)),1]:Array.from({length:e+1},(t,n)=>n/e)}function Ri(e,t,n,r){let i=Math.min(...n.map(e=>e.len)),a=e=>Math.abs(e-Math.round(e))<1e-9&&Math.round(e)>=1,o=r!==void 0&&r>0&&a(t/r)?r:void 0,s=0,c=t,l=0,u=t;for(let t=0;t<16;t++){let t=c/i,r=Math.round(t);if(Math.abs(t-r)>1e-9||r<2)break;let d=r===2||r===3?r:r%3==0?3:r%2==0?2:r,f=c/d,p=(e-s)/c*d;if(o===void 0?!Ii(p):!a(f/o))break;let m=Li(d,n.find(e=>Math.abs(e.len-f)<1e-9)??null),h=Math.min(d-1,Math.max(0,Math.floor(p+1e-9)));s+=h*f,c=f,l+=m[h]*u,u*=m[h+1]-m[h]}return l+(e-s)/c*u}function zi(e,t,n){if(!e.swing?.length)return t;let r=e.swing.map(t=>({len:t.whole*e.unit,share:t.share})),i=e.pulses,a=Math.floor(t/i+1e-9),o=t-a*i,s=0,c=0;for(;c<e.beats.length-1&&s+e.beats[c]<=o+1e-9;)s+=e.beats[c++];let l=e.beats[c]??i;return a*i+s+Ri(o-s,l,r,n)}function Bi(e){if(!e.swing?.length)return null;let t=Math.min(...e.swing.map(t=>t.whole*e.unit));if(!(t>0))return null;let n=[],r=0;for(let i of e.beats.length?e.beats:[e.pulses]){for(let e=0;e<i-1e-9;e+=t)n.push(r+e);r+=i}return n.push(e.pulses),{written:n,swung:n.map(t=>t>=e.pulses-1e-9?e.pulses:zi(e,t))}}function Vi(e,t){return Wi(e,t,!1)}function Hi(e,t){return Wi(e,t,!0)}let Ui=/* @__PURE__ */ new WeakMap;function Wi(e,t,n){Ui.has(e)||Ui.set(e,Bi(e));let r=Ui.get(e);if(!r)return t;let[i,a]=n?[r.swung,r.written]:[r.written,r.swung],o=e.pulses,s=Math.floor(t/o+1e-12),c=t-s*o,l=0;for(;l+2<i.length&&i[l+1]<=c+1e-12;)l++;let u=i[l+1]-i[l];return s*o+a[l]+(u>0?(c-i[l])/u*(a[l+1]-a[l]):0)}function Gi(e){let t=Ei(e),n=e.levels.map((n,r)=>zi(e,r/t)*t);return n.some((e,t)=>Math.abs(e-t)>1e-12)?n:null}function Ki(e,t){let n=t??qi(e);return{levels:e,written:`meter`,pulses:n.pulses,unit:n.unit,beats:n.beats}}function qi(e){let t=e.flatMap((e,t)=>t===0||e<=2?[t]:[]),n=t.map((n,r)=>(t[r+1]??e.length)-n),r=e.length/Math.max(1,n.length),i=Number.isInteger(Math.log2(r))?4*r:8;return{pulses:e.length,unit:i,beats:n}}function Ji(e){let t=e.length;return{levels:e.map(()=>1),written:`scan`,pulses:t,unit:4,beats:e.map(()=>1)}}function Yi(e,t,n=1){let r=[],i=e.pulses,a=i*Math.max(1,n);if(t.kind===`note`){let n=t.whole*e.unit;for(let e=0;e*n<a-1e-9;e++)r.push(e*n);return r}for(let a=0;a<Math.max(1,n);a++)if(t.kind===`bar`)r.push(a*i);else if(t.kind===`pulse`)for(let e=0;e<i;e++)r.push(a*i+e);else{let t=0;for(let n of e.beats)r.push(a*i+t),t+=n}return r}function Xi(e,t,n){let r=(t===`pulse`?1:t===`beat`?Math.max(...e.beats):t===`1m`?e.pulses:(Di(t)??0)*e.unit)/e.unit/n;return(e.legato??[]).filter(e=>e.whole>=r-1e-9).sort((e,t)=>e.whole-t.whole)[0]?.share??1}let Zi=[[`1P 2M 3M 5P 6M`,`major pentatonic`,`pentatonic`],[`1P 2M 3M 4P 5P 6M 7M`,`major`,`ionian`],[`1P 2M 3m 4P 5P 6m 7m`,`minor`,`aeolian`],[`1P 2M 3m 3M 5P 6M`,`major blues`],[`1P 3m 4P 5d 5P 7m`,`minor blues`,`blues`],[`1P 2M 3m 4P 5P 6M 7M`,`melodic minor`],[`1P 2M 3m 4P 5P 6m 7M`,`harmonic minor`],[`1P 2M 3M 4P 5P 6M 7m 7M`,`bebop`],[`1P 2M 3m 4P 5d 6m 6M 7M`,`diminished`,`whole-half diminished`],[`1P 2M 3m 4P 5P 6M 7m`,`dorian`],[`1P 2M 3M 4A 5P 6M 7M`,`lydian`],[`1P 2M 3M 4P 5P 6M 7m`,`mixolydian`,`dominant`],[`1P 2m 3m 4P 5P 6m 7m`,`phrygian`],[`1P 2m 3m 4P 5d 6m 7m`,`locrian`],[`1P 3M 4P 5P 7M`,`ionian pentatonic`],[`1P 3M 4P 5P 7m`,`mixolydian pentatonic`,`indian`],[`1P 2M 4P 5P 6M`,`ritusen`],[`1P 2M 4P 5P 7m`,`egyptian`],[`1P 3M 4P 5d 7m`,`neapolitan major pentatonic`],[`1P 3m 4P 5P 6m`,`vietnamese 1`],[`1P 2m 3m 5P 6m`,`pelog`],[`1P 2m 4P 5P 6m`,`kumoijoshi`],[`1P 2M 3m 5P 6m`,`hirajoshi`],[`1P 2m 4P 5d 7m`,`iwato`],[`1P 2m 4P 5P 7m`,`in-sen`],[`1P 3M 4A 5P 7M`,`lydian pentatonic`,`chinese`],[`1P 3m 4P 6m 7m`,`malkos raga`],[`1P 3m 4P 5d 7m`,`locrian pentatonic`,`minor seven flat five pentatonic`],[`1P 3m 4P 5P 7m`,`minor pentatonic`,`vietnamese 2`],[`1P 3m 4P 5P 6M`,`minor six pentatonic`],[`1P 2M 3m 5P 6M`,`flat three pentatonic`,`kumoi`],[`1P 2M 3M 5P 6m`,`flat six pentatonic`],[`1P 2m 3M 5P 6M`,`scriabin`],[`1P 3M 5d 6m 7m`,`whole tone pentatonic`],[`1P 3M 4A 5A 7M`,`lydian #5p pentatonic`],[`1P 3M 4A 5P 7m`,`lydian dominant pentatonic`],[`1P 3m 4P 5P 7M`,`minor #7m pentatonic`],[`1P 3m 4d 5d 7m`,`super locrian pentatonic`],[`1P 2M 3m 4P 5P 7M`,`minor hexatonic`],[`1P 2A 3M 5P 5A 7M`,`augmented`],[`1P 2M 4P 5P 6M 7m`,`piongio`],[`1P 2m 3M 4A 6M 7m`,`prometheus neapolitan`],[`1P 2M 3M 4A 6M 7m`,`prometheus`],[`1P 2m 3M 5d 6m 7m`,`mystery #1`],[`1P 2m 3M 4P 5A 6M`,`six tone symmetric`],[`1P 2M 3M 4A 5A 6A`,`whole tone`,`messiaen's mode #1`],[`1P 2m 4P 4A 5P 7M`,`messiaen's mode #5`],[`1P 2M 3M 4P 5d 6m 7m`,`locrian major`,`arabian`],[`1P 2m 3M 4A 5P 6m 7M`,`double harmonic lydian`],[`1P 2m 2A 3M 4A 6m 7m`,`altered`,`super locrian`,`diminished whole tone`,`pomeroy`],[`1P 2M 3m 4P 5d 6m 7m`,`locrian #2`,`half-diminished`,`aeolian b5`],[`1P 2M 3M 4P 5P 6m 7m`,`mixolydian b6`,`melodic minor fifth mode`,`hindu`],[`1P 2M 3M 4A 5P 6M 7m`,`lydian dominant`,`lydian b7`,`overtone`],[`1P 2M 3M 4A 5A 6M 7M`,`lydian augmented`],[`1P 2m 3m 4P 5P 6M 7m`,`dorian b2`,`phrygian #6`,`melodic minor second mode`],[`1P 2m 3m 4d 5d 6m 7d`,`ultralocrian`,`superlocrian bb7`,`superlocrian diminished`],[`1P 2m 3m 4P 5d 6M 7m`,`locrian 6`,`locrian natural 6`,`locrian sharp 6`],[`1P 2A 3M 4P 5P 5A 7M`,`augmented heptatonic`],[`1P 2M 3m 4A 5P 6M 7m`,`dorian #4`,`ukrainian dorian`,`romanian minor`,`altered dorian`],[`1P 2M 3m 4A 5P 6M 7M`,`lydian diminished`],[`1P 2M 3M 4A 5A 7m 7M`,`leading whole tone`],[`1P 2M 3M 4A 5P 6m 7m`,`lydian minor`],[`1P 2m 3M 4P 5P 6m 7m`,`phrygian dominant`,`spanish`,`phrygian major`],[`1P 2m 3m 4P 5P 6m 7M`,`balinese`],[`1P 2m 3m 4P 5P 6M 7M`,`neapolitan major`],[`1P 2M 3M 4P 5P 6m 7M`,`harmonic major`],[`1P 2m 3M 4P 5P 6m 7M`,`double harmonic major`,`gypsy`],[`1P 2M 3m 4A 5P 6m 7M`,`hungarian minor`],[`1P 2A 3M 4A 5P 6M 7m`,`hungarian major`],[`1P 2m 3M 4P 5d 6M 7m`,`oriental`],[`1P 2m 3m 3M 4A 5P 7m`,`flamenco`],[`1P 2m 3m 4A 5P 6m 7M`,`todi raga`],[`1P 2m 3M 4P 5d 6m 7M`,`persian`],[`1P 2m 3M 5d 6m 7m 7M`,`enigmatic`],[`1P 2M 3M 4P 5A 6M 7M`,`major augmented`,`major #5`,`ionian augmented`,`ionian #5`],[`1P 2A 3M 4A 5P 6M 7M`,`lydian #9`],[`1P 2m 2M 4P 4A 5P 6m 7M`,`messiaen's mode #4`],[`1P 2m 3M 4P 4A 5P 6m 7M`,`purvi raga`],[`1P 2m 3m 3M 4P 5P 6m 7m`,`spanish heptatonic`],[`1P 2M 3m 3M 4P 5P 6M 7m`,`bebop minor`],[`1P 2M 3M 4P 5P 5A 6M 7M`,`bebop major`],[`1P 2m 3m 4P 5d 5P 6m 7m`,`bebop locrian`],[`1P 2M 3m 4P 5P 6m 7m 7M`,`minor bebop`],[`1P 2M 3M 4P 5d 5P 6M 7M`,`ichikosucho`],[`1P 2M 3m 4P 5P 6m 6M 7M`,`minor six diminished`],[`1P 2m 3m 3M 4A 5P 6M 7m`,`half-whole diminished`,`dominant diminished`,`messiaen's mode #2`],[`1P 3m 3M 4P 5P 6M 7m 7M`,`kafi raga`],[`1P 2M 3M 4P 4A 5A 6A 7M`,`messiaen's mode #6`],[`1P 2M 3m 3M 4P 5d 5P 6M 7m`,`composite blues`],[`1P 2M 3m 3M 4A 5P 6m 7m 7M`,`messiaen's mode #3`],[`1P 2m 2M 3m 4P 4A 5P 6m 6M 7M`,`messiaen's mode #7`],[`1P 2m 2M 3m 3M 4P 5d 5P 6m 6M 7m 7M`,`chromatic`]];function Qi(e){let t=/^([1-7])([PMmAd])$/.exec(e);if(!t)throw Error(`not an interval: ${e}`);let n=Number(t[1]);return[0,2,4,5,7,9,11][n-1]+{P:0,M:0,m:-1,A:1,d:n===1||n===4||n===5?-1:-2}[t[2]]}let $i=Object.fromEntries(Zi.flatMap(([e,...t])=>{let n=e.split(` `).map(Qi),r=n.map((e,t)=>(n[t+1]??12)-e);return t.map(e=>[e,r])}));function ea(e,t){e.i++;let n=[];for(;e.skipSpace(),e.peek()!==`)`;){let t=e.i;if(e.text.startsWith(`geo(`,e.i)){e.i+=4,e.skipSpace();let r=e.num(`a ratio, like geo(5, 25, 0 10 5)`,K.geo,`ratio`).value;e.skipSpace(),e.expect(`,`,`',' then the steps per ratio: geo(${r}, 25, 0 10 5)`),e.skipSpace();let i=e.int(`the steps per ratio`,{...K.geo,whole:!0,min:1},`steps`);e.skipSpace(),e.expect(`,`,`',' then the exponents: geo(${r}, ${i}, 0 10 5)`);let a=[];for(;e.skipSpace(),e.peek()!==`)`;)a.push(e.num(`an exponent`,K.geo,`exponent`).value);e.i++,(!(r>0)||i<1||a.length===0)&&e.fail(`geo(r, n, k …): r above 0, n ≥ 1, at least one k`,t,e.i-t);for(let e of a)n.push(+(r**+(e/i)).toFixed(9));continue}let r=e.free(K.interval);if(r!==null)r.lo>0||e.fail(`A scan interval stays positive: give free(…) a range above 0`,t,e.i-t),n.push(r.value);else{let r=e.match(/[0-9]+(?:\.[0-9]+)?|\.[0-9]+/y);(r===null||!(parseFloat(r)>0))&&e.fail(`scan(…) takes positive intervals, like scan(2 2 1 2 2 2 1)`,t);let i=1;if(e.peek()===`!`){e.i++;let n=e.freeNumber(K.intervals),r=n===null?e.match(/[0-9]+/y):String(n);(r===null||!(parseInt(r,10)>=1))&&e.fail(`x!n repeats an interval n times: scan(1!4 2)`,t,e.i-t),i=parseInt(r,10)}for(let e=0;e<i;e++)n.push(parseFloat(r))}e.skipSpace(),e.peek()===`,`&&e.i++}e.expect(`)`,`')' to close scan(…)`),n.length===0&&e.fail(`scan(…) needs at least one interval`,t,e.i-t);let r=e.span(t);return e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`),{kind:`scan`,steps:n,span:r}}function ta(e,t){if(e<=0)return Array(t).fill(!1);let n=Array.from({length:e},()=>[!0]),r=Array.from({length:t-e},()=>[!1]);for(;r.length>1;){let e=Math.min(n.length,r.length),t=Array.from({length:e},(e,t)=>[...n[t],...r[t]]),i=n.length>e?n.slice(e):r.slice(e);n=t,r=i}return[...n,...r].flat()}function na(e,t){e.i++,e.skipSpace();let n;if(e.peek()===`f`)n=Nr(e,`text`,!1).text??``;else{let t=e.match(/"[^"]*"/y);t===null&&e.fail(`spell(text, &table, "names"): the text first — "867 5309" or free("867 5309")`),n=t.slice(1,-1)}e.skipSpace(),e.expect(`,`,`',' then the table, like spell("867", &keys, "1 2 3 …")`),e.skipSpace();let r=e.cellRef(`the table its characters pick from, like &keys`,`in spell(…)`);e.skipSpace(),e.expect(`,`,`',' then the names of the table's entries, in quotes`),e.skipSpace();let i=e.match(/"[^"]*"/y);i===null&&e.fail(`the names of the table’s entries, in quotes: "1 2 3 A 4 5 6 B …"`);let a=i.slice(1,-1).trim().split(/\s+/).filter(Boolean);e.skipSpace(),e.expect(`)`,`')' to close spell(…)`);let o=e.span(t);e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);let s={atom:{kind:`rest`},repeat:1,subdivide:1,elongate:1,span:o},c=[...n].flatMap(e=>{let t=a.indexOf(e);return t<0?[s,s]:[{atom:{kind:`ref`,name:r.name,pick:{kind:`at`,i:t,abs:!0},shift:0},repeat:1,subdivide:1,elongate:1,span:o},s]});return c.length||c.push(s),{kind:`list`,tokens:c,span:o}}let ra=[2,3,4,6];function ia(e){let t=/^([1-9][0-9]*(?:\+[1-9][0-9]*)+)(?:\/(2|4|8|16|32))?$/.exec(e);if(t){let e=t[1].split(`+`).map(Number);return e.every(e=>ra.includes(e))?{pulses:e.reduce((e,t)=>e+t,0),unit:Number(t[2]??8),groups:e}:null}let n=/^([1-9][0-9]*)\/(2|4|8|16|32)$/.exec(e);if(!n)return null;let[r,i]=[Number(n[1]),Number(n[2])];if(r<2||r>32)return null;if(i>=8){let e=Sr(Math.ceil(r/3),r,Math.ceil(r/3)-1);return{pulses:r,unit:i,groups:e.map((t,n)=>(e[n+1]??r)-t)}}return{pulses:r,unit:i,groups:r%3==0&&r>=6?Array(r/3).fill(3):Array(r).fill(1)}}function aa(e){let t=ia(e);return{pulses:t?.pulses??0,unit:t?.unit??4,beats:t?.groups??[]}}function oa(e){let t=Array(e).fill(1/0),n=(e,r,i)=>{if(t[e]=Math.min(t[e],i),r-e<=3){for(let n=e+1;n<r;n++)t[n]=Math.min(t[n],i+1);return}let a=e+Sr(2,r-e,1)[1];n(e,a,i+1),n(a,r,i+1)};return n(0,e,0),t}function sa(e,t){let n=e.unit>=8?1:8/e.unit,r=e.groups.map(e=>e*n),i=oa(r.length),a=Math.max(0,...i),o=r.some(e=>e>=4)?a+1:null,s=(o??a)+1,c=s+1,l=/* @__PURE__ */ new Map;r.reduce((e,t,n)=>{if(l.set(e,i[n]),o!==null&&t>=4)for(let n=2;n<t;n+=2)l.set(e+n,o);return e+t},0);let u=e.unit>=8?t:t*e.unit/8,d=e.pulses*t;return{tiers:Array.from({length:d},(n,r)=>{let i=r/u,a=e=>Math.abs(e-Math.round(e))<1e-9;return a(i)?l.get(Math.round(i))??s:a(2*i)?c:e.unit<=4&&t===3?s:c}),eighth:s,step:c}}let ca=(e,t,n)=>e===0?`*`:e===n?`,`:e===t?`.`:`+-:;`[Math.min(e-1,3)],la=(e,t,n)=>e===0?0:e===n?4:e===t?3:Math.min(e,2),ua=e=>({"*":0,"+":1,"-":2,":":2,";":2,".":3,",":4})[e]??0,da=/^[*+\-:;.,]+$/;function fa(e,t){if(da.test(e))return e;let n=ia(e);if(!n)return``;let{tiers:r,eighth:i,step:a}=sa(n,t);return r.map(e=>ca(e,i,a)).join(``)}function pa(e,t){if(da.test(e))return[...e].map(ua);let n=ia(e);if(!n)return[];let{tiers:r,eighth:i,step:a}=sa(n,t);return r.map(e=>la(e,i,a))}function ma(e,t){e.i++,e.skipSpace();let n=t=>{if(e.peek()===`"`)return e.match(/"[^"]*"/y).slice(1,-1);let n=e.free(K.meter);if(n!==null)return n.key===`text`||n.text!==void 0?n.text??``:n.labels?n.labels[Math.round((n.value-n.lo)/((n.hi-n.lo)/Math.max(1,n.labels.length-1)||1))]??``:String(n.value);let r=e.match(/[1-9][0-9]*(?:n\.?|t)(?![0-9A-Za-z])|[0-9]+/y);return r===null&&e.fail(`${t}: in quotes ("4/4"), a number, a note value (16n) or free(…)`),r},r=n(`the time signature`),i=da.test(r)?null:ia(r);e.skipSpace();let a=1,o=null;if(e.peek()===`,`){e.i++,e.skipSpace();let t=e.i,s=n(`the step: steps a pulse, or its note value`),c=Di(s);if(c!==null){if(i){let n=1/i.unit/c;Math.abs(n-Math.round(n))<1e-9&&Math.round(n)>=1&&Math.round(n)<=8||e.fail(`meter("${r}", ${s}): the step divides the pulse, ${Ni(1/i.unit)??`a 1/${i.unit}`}, into 1 to 8 steps`,t,s.length),a=Math.round(n)}else o=c}else a=Math.max(1,Math.min(8,parseInt(s,10)||1));e.skipSpace()}e.expect(`)`,`')' to close meter(…)`);let s=e.span(t);e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);let c=pa(r,a);c.length||e.fail(`meter("${r}"): a time signature (x/2 x/4 x/8 x/16: 4/4, 6/8, 7/8, 2/2), groups as sizes ("2+2+3" of eighths, "2+2+3/4" of quarters; each 2, 3, 4 or 6), or levels like "*.-.+.-." (* the bar, + - : ; beats, the higher the stronger, . the eighth, , finer)`,t,s.len);let l=c.map(e=>({atom:{kind:`note`,value:e,alter:0},repeat:1,subdivide:1,elongate:1,span:s})),u=()=>{let e=[...r].flatMap((e,t)=>t===0||e!==`.`&&e!==`,`?[t]:[]);return e.map((t,n)=>(e[n+1]??r.length)-t)},d=i?aa(r):o===null?void 0:{pulses:r.length,unit:1/o,beats:u()},f=d?d.beats.length:u().length;return{kind:`list`,tokens:l,span:s,perBeat:c.length/Math.max(1,f),...d?{signature:d}:{}}}function ha(e,t,n){e.i++;let r=[];for(;e.skipSpace(),r.push(e.int(`a number in ${t}(…)`,K.args,t)),e.skipSpace(),e.peek()===`,`;)e.i++;e.expect(`)`,`')' to close ${t}(…)`);let i=e.span(n);return e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`),{args:r,span:i}}function ga(e,t){let{args:n,span:r}=ha(e,`euclid`,t),[i,a,o=0]=n;(n.length<2||n.length>3||!(a>=1)||!(i>=0&&i<=a))&&e.fail(`euclid(k, n): k hits spread evenly over n steps (0 ≤ k ≤ n), euclid(k, n, shift) turned`,t,r.len);let s=ta(i,a);return{kind:`list`,tokens:Array.from({length:a},(e,t)=>{let n=((t-o)%a+a)%a;return{atom:s[n]?{kind:`note`,value:0,alter:0}:{kind:`rest`},repeat:1,subdivide:1,elongate:1,span:r}}),span:r}}function _a(e,t){let{args:n,span:r}=ha(e,`even`,t),[i,a,o=0]=n;return(n.length<2||n.length>3||!(i>=1)||!(a>=i))&&e.fail(`even(k, n): k places spread as evenly as they go over n (1 ≤ k ≤ n), even(k, n, phase) its mode`,t,r.len),o>=0&&o<i||e.fail(`even(${i}, ${a}, phase): the phase is a mode, 0 to ${i-1}, each one place moved`,t,r.len),{kind:`scan`,steps:Tr(Sr(i,a,o),a),span:r}}let va={sin:`a sine`,saw:`a saw`,tri:`a triangle`,square:`a square`},ya=e=>(t,n)=>{let{args:r,span:i}=ha(t,e,n),[a]=r;return(r.length!==1||a<2)&&t.fail(`${e}(n): one cycle of ${va[e]} in n steps, n ≥ 2`,n,i.len),{kind:`wave`,shape:e,n:a,span:i}};function ba(e,t){let n=t=>e===`sin`?Math.sin(2*Math.PI*t):e===`saw`?2*t-1:e===`tri`?t<.5?4*t-1:3-4*t:Math.floor(2*t)%2?1:-1;return Array.from({length:t},(e,r)=>+n(r/t).toFixed(6)+0)}let xa={C:0,D:2,E:4,F:5,G:7,A:9,B:11},Sa=e=>[`C`,`C#`,`D`,`Eb`,`E`,`F`,`F#`,`G`,`Ab`,`A`,`Bb`,`B`][(e%12+12)%12];function Ca(e,t){e.i++,e.skipSpace();let n,r=0,i=`0`,a=null,o=null,s=e.match(/-?[0-9]+/y),c=s===null?e.match(/"[^"]*"/y):null;if(c!==null){let a=/^"([A-G](?:#|b)?)([0-9]*)((?::[a-z0-9#'-]+)+)"$/.exec(c);a||e.fail(`scale("tonic:name"): a tonic and a scale's name, as in Strudel — scale("D:minor"), scale("F#:harmonic:minor")`,t,e.i-t),a[2]&&e.fail(`scale("${a[1]}${a[2]}:…"): the octave is the voice's (loop=), not the scale's: scale("${a[1]}${a[3]}")`,t,e.i-t);let o=a[3].slice(1).split(`:`),[s,l]=[o.join(` `),o.join(``)],u=Object.hasOwn($i,s)?$i[s]:Object.hasOwn(vr,l)?vr[l].steps:void 0;u||e.fail(`scale("…${a[3]}"): a scale by name — ours (${Object.keys(vr).join(` `)}) or tonal's, as Strudel reads them (harmonic:minor, minor:pentatonic, whole:tone, diminished, chromatic, bebop … listed in tables.md)`,t,e.i-t),n=[...u];let d=a[1];r=((xa[d[0]]+(d[1]===`#`?1:d[1]===`b`?-1:0))%12+12)%12,i=String(r),e.skipSpace(),e.expect(`)`,`')' to close scale(…)`)}else if(s!==null){e.skipSpace(),e.expect(`,`,`',' then the mode — better by name: scale(minor, A)`),e.skipSpace();let a=e.i,o=e.int(`the mode, 0 (the darkest) to 6`,K.phase);o>6&&e.fail(`scale(tonic, phase): the phase is a mode, 0 (the darkest, Locrian) to 6 (the brightest, Lydian) — not ${o}`,a,String(o).length),r=parseInt(s,10),i=s,n=Tr(Sr(7,12,o),12),e.skipSpace(),e.expect(`)`,`')' to close scale(…)`),e.warn(`scale(${r}, ${o}) is written scale(${xr(o)}, ${Sa(r)}): the mode by name, then the tonic`,t,e.i-t)}else{let t=e.i;if(e.peek()===`&`)o=e.cellRef(`the cell that holds the mode, like scale(&mode, &tonic)`,`as the mode`),n=br(yr.major);else{let r=e.match(/[a-z]+/y),i=r?vr[r]:void 0;i||e.fail(`scale(name, tonic): a scale by name — ${Object.keys(vr).join(` `)}, or a cell holding a mode (&mode)`,t,Math.max(1,(r??``).length)),n=[...i.steps]}if(e.skipSpace(),e.peek()===`,`){e.i++,e.skipSpace();let t=e.i,n=e.match(/[A-G](?:#|b)?(?![A-Za-z0-9])/y);if(n!==null)r=((xa[n[0]]+(n[1]===`#`?1:n[1]===`b`?-1:0))%12+12)%12,i=String(r);else if(e.peek()===`&`)a=e.cellRef(`the cell that holds the tonic, like scale(dorian, &tonic)`,`as the tonic`),i=`&${a.name}`;else{let n=e.text.startsWith(`free(`,e.i);r=e.int(`the tonic: a note name (D, F#, Bb), a number, a cell (&tonic) or free(…)`,K.tonic),i=n?e.text.slice(t,e.i):String(r),Math.abs(r)>11&&e.warn(`scale(…, ${r}): the tonic is a pitch class, 0 (C) to 11 (B)`,t,e.i-t)}e.skipSpace()}e.expect(`)`,`')' to close scale(…)`)}let l=e.span(t),u=`key:λ${e.line}_${t+e.offset}`;return e.lambdas.push({name:u,span:l,lambda:`shift=${i}`,over:null,shift:r,...a?{tonic:a}:{},off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:{kind:`blank`}}),{steps:n,key:{name:u,pick:null,shift:0,span:l},span:l,...o?{mode:o}:{}}}function wa(e,t){e.i++,e.skipSpace();let n=0;if(e.peek()!==`)`){let t=e.i,r=e.noteName();if(n=r===null?e.int(`how many fifths round it starts (fifths(1): on G), or the note it starts on: fifths(G)`,K.fifths):(r%12+12)%12*7%12,r===null&&Math.abs(n)>11){let r=Math.trunc(n/12),i=n%12,a=`C G D A E B F# C# Ab Eb Bb F`.split(` `)[(i+12)%12];e.warn(`fifths(${n}): the circle comes round after 12, and a turn past a lap climbs one, as every shift does: fifths(${i}) ${r>0?`up`:`down`} ${Math.abs(r)} octave${Math.abs(r)===1?``:`s`}${i?` (fifths(${a}) names the note, no octave)`:``}`,t,e.i-t)}e.skipSpace()}e.expect(`)`,`')' to close fifths(…)`);let r=e.span(t);return{braid:{kind:`list`,tokens:Array.from({length:12},(e,t)=>({atom:{kind:`note`,value:t*7%12,alter:0},repeat:1,subdivide:1,elongate:1,span:r})),span:r},shift:n}}let Ta=U(`generator`,`sin(n) · saw(n) · tri(n) · square(n)`,`One cycle of a waveform in n steps, from −1 to 1, as Strudel's bipolar signals (sine2, saw2, tri2, square2) at each step: a sine from 0, a saw rising from −1, a triangle rising from −1 to 1 at the half and falling back, a square −1 then 1. A waveform, or a slow swell.`,[`&sine loop=220 sin(12)`,`&ramp loop=220 saw(8)`,`&swell map=lin loop=.25 tri(4)`,`&pulse loop=110 square(2)`],`braid.md`),Ea={scan:{parse:ea,syntax:U(`generator`,`scan(i …)`,"Running totals of intervals: a scale or a meter. An interval can repeat (`1!4`), be geometric (`geo(r, n, k …)`: r^(k/n) for each k) or be `free(…)`.",[`&major scan(2 2 1 2 2 2 1)`,`&bar scan(27 23 26 24) step=84bpm`,`&tempo scan(1!4 .5!2)`,`&series scan(geo(5, 25, 0 10 5))`,`&swing scan(free(2, 1..3) 1)`],`braid.md`)},euclid:{parse:ga,syntax:U(`generator`,`euclid(k, n) · euclid(k, n, shift)`,`k hits spread as evenly as they go over n steps (the Euclidean rhythms), turned right by shift steps, as Strudel's (k, n, r).`,[`&tresillo euclid(3, 8)`,`&clave euclid(5, 16, 2)`],`braid.md`)},even:{parse:_a,syntax:U(`generator`,`even(k, n) · even(k, n, phase)`,`k places spread as evenly as they go over n: a table (the scan of its intervals), its phase its mode, 0 to k − 1, each one place moved. The one generator under the diatonic (even(7, 12), its phases the seven modes), the pentatonic, the standard bell, the tresillo and a meter's groups (decision 072); euclid(k, n, r) is its places as a rhythm of n steps, turned as Strudel's.`,[`&ionian even(7, 12, 5)`,`&pentatonic even(5, 12)`,`&minorPentatonic even(5, 12, 3)`,`&tresillo even(3, 8, 2)`],`tables.md`)},sin:{parse:ya(`sin`),syntax:Ta},saw:{parse:ya(`saw`),syntax:Ta},tri:{parse:ya(`tri`),syntax:Ta},square:{parse:ya(`square`),syntax:Ta},scale:{parse:(e,t)=>e.fail(`scale(…) is read by its cell`,t,5),syntax:U(`generator`,`scale(name) · scale(name, tonic) · scale("tonic:name")`,`A scale by name over the 12, turned to its tonic (a note name, a number, a cell holding one, or free(…); C if left out): the scan of its steps over a key of its own. Its name may be a cell holding a diatonic mode (&mode dorian, its phase from the darkest: locrian 0 … lydian 6). Its shift= walks its modes; the tonic transposes. The names: ${Object.keys(vr).join(` `)}. Strudel's spelling reads the same: scale("D:minor"), its words after colons (scale("F#:harmonic:minor")), with every scale tonal knows (${Object.keys($i).length} names: whole:tone, diminished, bebop:major, chromatic …); the octave is the voice's, not the scale's.`,[`&scale scale(minor, D)`,`&blues scale(blues)`,`&scale scale(dorian, free(2, 0..11))`,`&key scale(dorian, &tonic)`,`&key scale(&mode, &tonic)`,`&scale scale("F#:harmonic:minor")`],`tables.md`)},fifths:{parse:(e,t)=>e.fail(`fifths(…) is read by its cell`,t,6),syntax:U(`generator`,`fifths() · fifths(n) · fifths(note)`,`The circle of fifths: the twelve pitch classes a fifth apart, C G D A E B F# C# Ab Eb Bb F, as written from C; turned n fifths round, or to start on a note (its shift=: [0] is where it starts, [$0] is C). Drawn round its wheel in its own order.`,[`&circle fifths()`,`&circleG fifths(1)`,`&circleG fifths(G)`],`tables.md`)},meter:{parse:ma,syntax:U(`generator`,`meter("sig") · meter("sig", step) · meter("2+2+3") · meter("2+2+3/4") · meter("levels")`,`A bar as levels, one per step, its numbers its tiers from the ends: 0 the downbeat, 1 a beat, 2 a half's beat (and any tier between), 3 the eighth, 4 finer. A time signature by rule (contracts/meter v2, decision 072): x/8 and x/16 grouped as the canonical even set of ⌈x/3⌉ groups (7/8 is 3+2+2, 8/8 3+3+2), x/4 and x/2 in beats of the denominator, or in threes where x is a multiple of 3 from 6 (6/4). Its step is a number a pulse or a note value (meter("6/8", 16n)). Groups written as sizes, of eighths or of the denominator after a slash (2+2+3, 2+2+3/4), each 2, 3, 4 or 6. Or levels written out (* the bar, + - : ; beats, . the eighth, , finer), with their step's note value. Of four groups or more, each half's start is the stronger: 4/4 is *.-.+.-. (#17). Its bpm counts beats, its groups. Each argument can be free(…).`,[`&bar meter("4/4", 2) step=100bpm`,`&bar meter("6/8") step=60bpm`,`&bar meter("2+2+3") step=90bpm`,`&bar meter("2/2", 2) step=60bpm`,`&bar meter("*.+.+..") step=90bpm`],`time.md`)},spell:{parse:na,syntax:U(`generator`,`spell("text", &table, "names")`,`A text spelled through a table: each character that is one of the names plays that entry of the table, then a pause; anything else rests as long. The text can be free("…"), a field to type in.`,[`&dial spell("867 5309", &keys, "1 2 3 A 4 5 6 B 7 8 9 C * 0 # D")`,`&dial spell(free("867 5309"), &keys, "1 2 3 A 4 5 6 B 7 8 9 C * 0 # D")`],`braid.md`)}},Da={agogic:(e,t)=>{let{args:n,span:r}=ha(e,`agogic`,t),[i,a]=n,o=wr(i,a).map(e=>Math.round(e/12*100));return e.fail(`agogic(…) is gone: write the beats as a scan, scan(${Tr(o,100).join(` `)})`,t,r.len)}},Oa=e=>e in Ea||e in Da;function ka(e,t,n){return(Ea[t]?.parse??Da[t])(e,n)}function Aa(e){if(e.peek()!==`:`)return;e.rejectTap(e.text.slice(0,e.i).search(/&[^\s:,[\]()*+&]*$/)),e.i++;let t=e.i;e.free(K.hitNumber);let n=e.match(/[0-9]+/y);if(n===null)return e.fail(`A hit is &bd:n:gain, its number first: &bd:0:.3`,t,1);if(parseInt(n,10)!==0&&e.fail(`&bd:${n} would be a pitched hit, ${n} up its table: not yet (write &bd:0:gain)`,t,n.length),e.peek()!==`:`)return;e.i++;let r=e.i,i=e.freeNumber(K.hit),a=i===null?e.match(/[0-9]*\.[0-9]+|[0-9]+/y):String(i);return a===null?e.fail(`A hit’s gain: a number, &bd:0:.3 (1 as it is)`,r,1):parseFloat(a)}function ja(e,t){let n=0,r=!1,i=[[]],a=``,o=()=>{a&&i[i.length-1].push(a),a=``};for(let s=t;s<e.length;s++){let t=e[s];if(t===`&`&&(r=!0),t===`[`||t===`(`){if(n++===0)continue}else if(t===`]`||t===`)`){if(--n===0)break}else if(n===1&&t===`,`){o(),i.push([]);continue}else if(n===1&&/\s/.test(t)){o();continue}a+=t}if(o(),!r)return!1;let s=e=>/^[*+(-]|[*+-]$/.test(e);return!i.some(e=>e.length>1&&!e.some(s)||e.length===1&&e[0].startsWith(`[`))}function Ma(e){e.i++;let t=[];for(;;){if(t.push(Na(e,0)),e.skipSpace(),e.peek()===`,`){e.i++;continue}let n=e.peek();return n===`|`&&e.fail(`',' or ']' in the mix: a mix lists its terms with commas ([&a, &b]); a choice [a|b] picks between numbers in a braid (&x [0|2]), not between cells`,e.i,1),(n===`[`||n===`&`)&&e.fail(`',' or ']' in the mix: a mix lists its terms with commas ([&a, &b]); one term is a product or a sum, its parts joined by * or +`,e.i,1),e.expect(`]`,`',' or ']' in the mix`),{kind:`mix`,exprs:t}}}function Na(e,t){let n=e.i,r=[{e:Pa(e,t),sign:1}];for(;;){e.skipSpace();let n=e.peek();if(n!==`+`&&n!==`-`)break;e.i++,r.push({e:Pa(e,t),sign:n===`-`?-1:1})}return r.length===1?r[0].e:{k:`sum`,items:r,span:e.span(n)}}function Pa(e,t){e.skipSpace();let n=e.i,r=[Fa(e,t)];for(;e.skipSpace(),e.peek()===`*`;)e.i++,r.push(Fa(e,t));return r.length===1?r[0]:{k:`prod`,factors:r,span:e.span(n)}}function Fa(e,t){e.skipSpace();let n=e.i;if(e.peek()===`(`){t>=32&&e.fail(`Parentheses in a mix nest 32 deep at most: name a part (&part [ … ]) and use it`,n),e.i++;let r=Na(e,t+1);return e.skipSpace(),e.expect(`)`,`')' to close the group`),r}if(e.peek()===`&`){let t=e.ref(`a cell, like &theme`),n=Aa(e);return n===void 0?{k:`ref`,ref:t}:{k:`ref`,ref:t,level:n}}let r=e.free(K.gain);if(r!==null)return{k:`num`,value:r.value,span:e.span(n)};let i=e.match(zr);return i===null?(e.match(/gate\(/y)&&e.fail(`gate(…) is planned but not built yet: for now a step= term articulates, loop= terms bend`,n,5),e.fail(`Expected a cell, a number or '(' here`)):{k:`num`,value:parseFloat(i),span:e.span(n)}}let Ia=RegExp(`(?:${Object.keys(yr).join(`|`)})(?![A-Za-z0-9_])`,`y`),La=[`degree`,`inverse`],Ra=/(degree|inverse)\(/y;function za(e){let t=e.match(Ra);if(t===null){let t=e.ref(`a cell like &motif`);return{kind:`ref`,name:t.name,pick:t.pick,shift:t.shift,...t.slot?{slot:t.slot}:{},...t.transpose?{transpose:t.transpose}:{},...t.degree?{values:{mul:1,add:t.degree}}:{}}}let n=t.slice(0,-1);e.skipSpace(),e.peek()!==`&`&&!e.text.startsWith(`degree(`,e.i)&&!e.text.startsWith(`inverse(`,e.i)&&e.fail(n===`degree`?`degree(&cell, n): a cell, then how many steps of its table up (−n down)`:`inverse(&cell): a cell, mirrored round 0`,e.i);let r=za(e);e.skipSpace();let i=r.values??{mul:1,add:0},a;if(n===`degree`){e.expect(`,`,`',' then the steps: degree(&${r.name}, 1)`),e.skipSpace();let t=e.match(/[-+]?\s*[0-9]+(?![0-9.])/y);t===null&&e.fail(`degree(&${r.name}, n) moves it n whole steps of its table, a whole number: degree(&${r.name}, 1), degree(&${r.name}, -2)`,e.i),a={mul:i.mul,add:i.add+parseInt(t.replace(/\s+/g,``),10)}}else a={mul:i.mul===1?-1:1,add:-i.add};return e.skipSpace(),e.expect(`)`,`')' to close ${n}(…)`),{kind:`ref`,name:r.name,pick:r.pick,shift:r.shift,...r.slot?{slot:r.slot}:{},...r.transpose?{transpose:r.transpose}:{},...a.mul===1&&a.add===0?{}:{values:a}}}function Ba(e,t){let n=e.peek();if(n===`&`||e.text.startsWith(`degree(`,e.i)||e.text.startsWith(`inverse(`,e.i))return za(e);if(n===`~`)return e.i++,{kind:`rest`};if(n===`=`)return e.i++,{kind:`rest`,keep:!0};if(n===`_`)return e.i++,{kind:`rest`,hold:!0};if(n===`[`)return ja(e.text,e.i)?Ma(e):Va(e,t);if(n===`<`)return Ha(e,t);if(n===`-`||n===`.`||n>=`0`&&n<=`9`||e.text.startsWith(`free(`,e.i)){let t=e.num(`a number`,K.step),n=e.match(/[#bsf]+(?![A-Za-z0-9_])/y)??``,r=t.alter+[...n].reduce((e,t)=>e+(t===`#`||t===`s`?1:-1),0);return{kind:`note`,value:t.value,alter:r}}let r=e.noteName();if(r!==null)return{kind:`note`,value:r,alter:0,pitched:!0};let i=e.match(Ia);return i===null?e.fail(`Unexpected '${n}' — expected a number, a note name (C, F#), ~, [chord], &cell or key=value`):{kind:`note`,value:yr[i],alter:0}}function Va(e,t){let n=e.i;t>=32&&e.fail(`Brackets nest 32 deep at most: name the inner steps (&inner 0 2) and splice them`,n,1),e.i++;let r=[[]],i=null;for(;;){e.skipSpace();let a=e.peek();if(a===`]`)break;if(a===``&&e.fail(i===`|`?`']' to close the choice: [0|4|7]`:`']' to close the bracket: [0 2] · [0, 4]`,n,e.i-n),a===`,`||a===`|`){i!==null&&i!==a&&e.fail(`A bracket is a chord or a stack (commas) or a choice (bars), not both: [0, 4] · [0|4]`,e.i,1),r[r.length-1].length||e.fail(a===`,`?`A step before the comma: [0, 4]`:`A step before the bar: [0|4] · [0 2|4]`,e.i,1),i=a,r.push([]),e.i++;continue}Ga(e,r[r.length-1],qa(e,t+1))}e.i++,r[r.length-1].length||e.fail(i===null?`Empty brackets: [0 2] is a subsequence, [0, 2] a chord`:i===`,`?`A step after the comma: [0, 4]`:`A step after the bar: [0|4] · [0 2|4]`,n,e.i-n);let a=e=>e.repeat===1&&e.subdivide===1&&e.elongate===1&&e.chance===void 0,o=r.every(e=>e.length===1&&a(e[0])&&e[0].atom.kind===`note`),s=r.map(e=>e[0].atom);if(i===`|`)return o&&!s.some(e=>e.pitched)?{kind:`choice`,values:s.map(e=>e.value),alters:s.map(e=>e.alter)}:{kind:`seq`,layers:r,mode:`choose`};if(o){let e=s.map(e=>!!e.pitched);return{kind:`chord`,notes:s.map(e=>e.value),alters:s.map(e=>e.alter),...e.some(Boolean)?{pitched:e}:{}}}return{kind:`seq`,layers:r}}function Ha(e,t){let n=e.i;t>=32&&e.fail(`Brackets nest 32 deep at most: name the inner steps (&inner 0 2) and splice them`,n,1),e.i++;let r=[[]];for(;;){e.skipSpace();let i=e.peek();if(i===`>`)break;if(i===``&&e.fail(`'>' to close the alternation: <0 2 4>`,n,e.i-n),i===`|`&&e.fail(`An alternation takes steps, stacked with commas (<0 2, 4 5>); a choice goes in square brackets: [0 2|4]`,e.i,1),i===`,`){r[r.length-1].length||e.fail(`A step before the comma: <0 2, 4 5>`,e.i,1),r.push([]),e.i++;continue}Ga(e,r[r.length-1],qa(e,t+1))}return e.i++,r[r.length-1].length||e.fail(r.length>1?`A step after the comma: <0 2, 4 5>`:`An empty alternation: <0 2 4> plays one of its steps a lap`,n,e.i-n),{kind:`seq`,layers:r,mode:`alt`}}function Ua(e){let t=e.i;e.i++;let n=[];for(;e.skipSpace(),n.push(e.int(`a whole number in x(k, n, r)`,K.euclidOn)),e.skipSpace(),e.peek()===`,`;)e.i++;e.expect(`)`,`')' to close x(k, n, r)`);let[r,i,a=0]=n;(n.length<2||n.length>3||!(i>=1&&i<=4096)||!(r>=0&&r<=i))&&e.fail(`x(k, n, r): k hits spread evenly over n parts of the step (0 ≤ k ≤ n), turned right by r: 0(3,8), &bd(3,8,2)`,t,e.i-t);let o=ta(r,i);return{k:r,n:i,r:a,hits:Array.from({length:i},(e,t)=>t).filter(e=>o[((e-a)%i+i)%i])}}let Wa=1e4;function Ga(e,t,n){if(!(n.atom.kind===`rest`&&n.atom.hold)){t.push(n);return}let r=n.span.col-1-e.offset,i=t[t.length-1];(n.repeat!==1||n.subdivide!==1||n.elongate!==1||n.chance!==void 0)&&e.fail(`_ lengthens the step before it by one, and takes no modifiers: 0 _ _ is 0@3`,r,n.span.len),i||e.fail(`_ lengthens the step before it: 0 _ _ is 0@3 (in a cell with base=, = keeps a step of the base)`,r,n.span.len),i.repeat!==1&&e.fail(`_ after x!n would lengthen only the last copy: write the copies out, or x@n`,r,n.span.len),t[t.length-1]={...i,elongate:i.elongate+1,span:{...i.span,len:n.span.col-i.span.col+n.span.len}}}let Ka={"!":{field:`repeat`,syntax:U(`modifier`,`x!n`,`Repeat: n copies of the step, each as long as one.`,[`&beat step=4 0!4 2!2`],`cell.md`)},"*":{field:`subdivide`,syntax:U(`modifier`,`x*n`,`Ratchet: the step played n times within its own length.`,[`&hats step=2 0 0*2 0 0*3`],`cell.md`)},"@":{field:`elongate`,syntax:U(`modifier`,`x@n`,`Hold: the step lasts n steps.`,[`&tune step=2 0@2 2 4@3`],`cell.md`)}};function qa(e,t=0){let n=e.i,r=Ba(e,t),i=e.span(n),a={repeat:1,subdivide:1,elongate:1},o,s,c,l=/* @__PURE__ */ new Set;r.kind===`ref`&&(s=Aa(e));let u=e.peek()===`(`?Ua(e):void 0;for(;e.peek()in Ka||e.peek()===`?`||e.peek()===`/`;){if(e.peek()===`/`){c!==void 0&&e.fail(`'/' can only appear once per step`),e.i++;let t=e.i,n=e.int(`a count after /`,K.modifier,`slow`);(n<1||n>4096)&&e.fail(`Count must be between 1 and ${Br}`,t,e.i-t),c=n;continue}if(e.peek()===`?`){o!==void 0&&e.fail(`'?' can only appear once per step`),e.i++;let t=e.i,n=e.freeNumber(K.drop),r=n===null?e.match(/(?:0?\.[0-9]+|0|1(?:\.0+)?)(?![0-9])/y):String(n);o=r===null?null:parseFloat(r),r===null&&/[0-9]/.test(e.peek()??``)&&e.fail(`A probability is from 0 to 1: x?.3`,t,1);continue}let t=e.peek();l.has(t)&&e.fail(`'${t}' can only appear once per step`),l.add(t),e.i++;let n=e.i,r=e.int(`a count after ${t}`,K.modifier,Ka[t].field);(r<1||r>4096)&&e.fail(`Count must be between 1 and ${Br}`,n,e.i-n),a[Ka[t].field]=r}if(e.peek()===`(`&&e.fail(`A euclid goes straight after its step, before its other modifiers: 0(3,8)*2`),!e.atBoundary()&&!(t>0&&/[\],|>]/.test(e.peek()))&&e.fail(`Unexpected '${e.peek()}' — separate steps with spaces`),u||c!==void 0){r.kind===`rest`&&(r.hold||r.keep)&&e.fail(`${r.hold?`_`:`=`} takes no euclid and no /n: put them on the step it stands for`,n,e.i-n);let t={...u?{euclid:u}:{},...c===void 0?{}:{slow:c}};r=r.kind===`seq`&&!r.bare?{...r,...t}:{kind:`seq`,layers:[[{atom:r,repeat:1,subdivide:1,elongate:1,span:i}]],...t,bare:!0}}return Yt(r)>Wa&&e.fail(`A step comes round after ${Wa.toLocaleString(`en`)} laps at most: its <…> and /n multiplied out`,n,e.i-n),{atom:r,...a,...o===void 0?{}:{chance:o},...s===void 0?{}:{level:s},span:e.span(n)}}let Ja=e=>/^(?:pulse|beat|1m|(?:1|2|4|8|16|32|64)(?:n\.?|t))(?![A-Za-z0-9_.])/.test(e.text.slice(e.i));function Ya(e){let t=e.match(/(?:pulse|beat|1m|(?:1|2|4|8|16|32|64)(?:n\.?|t))(?![A-Za-z0-9_.])/y);if(t===null)return null;if(t===`pulse`||t===`beat`)return{written:t,kind:t};if(t===`1m`)return{written:t,kind:`bar`};let n=parseInt(t,10);return{written:t,kind:`note`,whole:t.endsWith(`.`)?3/(2*n):t.endsWith(`t`)?2/(3*n):1/n}}function Xa(e){let t=1,n=[];for(;e.peek()===`*`||e.peek()===`/`;){let r=e.text[e.i++],i=e.i,a=e.freeNumber(K.by),o=a===null?e.match(/[0-9]+(?:\.[0-9]+)?|\.[0-9]+/y):String(a);(o===null||!(parseFloat(o)>0))&&e.fail(`a positive number after ${r}`,i),t=r===`*`?t*parseFloat(o):t/parseFloat(o),n.push({op:r===`*`?`×`:`÷`,n:parseFloat(o)})}return{ratio:t,chain:n}}function Za(e,t){let n=e.i,r=t?`loop`:`step`,i=t?null:Ya(e);if(i)return{whole:t,kind:`tap`,meter:null,tap:i,...Xa(e),span:e.span(n)};let a=e.free(t?{...K.rate,key:`loop`}:K.rate);if(a!==null){let r=Ar(a.value,a.unit);return r>0||e.fail(`A rate must be positive`,n,e.i-n),{whole:t,kind:`rate`,perSecond:r,span:e.span(n),free:a}}let o=e.match(/[0-9]+(?:\.[0-9]+)?|\.[0-9]+/y);if(o!==null){let i=Ar(parseFloat(o),e.match(kr));if(i>0||e.fail(`A rate must be positive`,n,e.i-n),/[A-Za-z.]/.test(e.peek())){let i=/^[^\s,\])]+/.exec(e.text.slice(n))[0];e.fail(t?`${r}=${i} is no rate: a number with its unit (loop=100bpm, loop=2hz)`:`${r}=${i} is no rate or tap: a tap reads a note value (1n 2n 4n 8n 16n 32n), a triplet (4t 8t 16t), a dotted one (2n. 4n. 8n.), 1m, pulse, beat, or another meter's (&bar2:16n)`,n,i.length)}return{whole:t,kind:`rate`,perSecond:i,span:e.span(n)}}let s=e.match(/[A-Z](?:[#b]?-?[0-9]+|[A-Z0-9_]*)(?![A-Za-z0-9_#])/y);if(s!==null)return{whole:t,kind:`env`,name:s,span:e.span(n)};e.peek()===`{`&&e.fail(`{&x} is now written cycle(&x)`);let c=e.match(/cycle\(/y)!==null,l=e.cellRef(c?`a cell inside cycle( ), like cycle(&theme)`:`a cell or a rate after ${r}=, like ${r}=&meter`,`in ${r}=`,!0);if((l.pick||l.shift)&&e.fail(`${r}= takes a whole cell`,l.span.col-1,l.span.len),c&&e.expect(`)`,`')' to close cycle(&${l.name})`),!c&&!t&&e.peek()===`:`){e.i++;let r=Ya(e);return r||e.fail(`&${l.name}: taps a meter by pulse, beat or a note value (&${l.name}:pulse, &${l.name}:beat, &${l.name}:16n, &${l.name}:1m)`),{whole:t,kind:`tap`,meter:l,tap:r,...Xa(e),span:e.span(n)}}return{whole:t,kind:`driven`,driver:l,cycle:c,...Xa(e),span:e.span(n)}}let Qa={amp:U(`map`,`map=amp`,`A volume: its values multiply the level (on a voice, the braid as a waveform, its range onto −1…1; the default).`,[`&accent map=amp step=16n 1 .4 .8 .4`],`sound.md`),lin:U(`map`,`map=lin`,`As amp, ramping from each value to the next: a glide, a triangle. In a mix it is plain: a volume in a product, a pitch in a sum.`,[`&swell map=lin loop=&bar/8 .2 1`],`sound.md`),db:U(`map`,`map=db`,`A volume in decibels (0 as it is, −6 about half).`,[`&fade map=db step=&bar 0 -6 -12`],`sound.md`),adsr:U(`map`,`map=adsr a d s r`,`An envelope: attack, decay, release in seconds, sustain a level; one per note.`,[`&pluck map=adsr .01 .3 .5 .4`],`sound.md`),sample:U(`map`,`map=sample`,`The sound card: its entries are channels, one (mono) or two (left, right).`,[`&out loop=SAMPLE_RATE map=sample &left &right`],`mix.md`),midi:U(`map`,`map=midi`,`A MIDI card: its entries are MIDI channels, in order (~ skips one); a voice only here is sent and heard, at its entry's gain.`,[`&synth map=midi [&theme * &reed] [&bass * &sub] ~!7 &groove`],`midi.md`),edo:U(`map`,`map=edo`,`A grid: cycle= equal steps to the octave.`,[`&edo19 cycle=19 map=edo`],`tuning.md`),ratios:U(`map`,`map=ratios`,`A grid of ratios: one period's tones, then the period (the last).`,[`&just map=ratios 1 9/8 5/4 4/3 3/2 5/3 15/8 2`],`tuning.md`),style:U(`map`,`map=style`,`A style: a point in style space, one value an axis in the table's order (sync harm artic energy, each 0 to 1), or each by its name (sync=.3); it doesn't sound. A pick reads an axis by name: &funk[artic].`,[`&funk map=style .3 .45 .55 .55`,`&funk map=style sync=.3 harm=.45 artic=.55 energy=.55`],`style.md`),role:U(`map`,`map=role`,`A role: its name is the role, its entries the gates that play it (two entries, two players); a gate no role names plays as written.`,[`&comp map=role &violin2 &viola`],`mix.md`)},$a=new RegExp(Object.keys(Qa).sort((e,t)=>t.length-e.length).join(`|`),`y`);function eo(e,t,n){return t>5e4&&e.fail(`${t} steps: at most ${ui.toLocaleString(`en`)}, the most a grid can hold to its period`,n,String(t).length),t}function to(e){let t=e.i;if(e.peek()===`&`){let n=e.cellRef(`a table cell, like map=&curve`,`after map=`);return(n.pick||n.shift)&&e.fail(`map= takes a whole table`,n.span.col-1,n.span.len),{kind:`table`,table:n,span:e.span(t)}}if(e.match(/sin\b/y)&&e.fail(`map=sin is gone: write the sine as the braid, sin(12) — or map=&table`,t,3),e.match(/ed\(/y)){let n=()=>{let t=e.i,n=e.freeNumber(K.ratio),r=n===null?e.match(/[0-9]+(?:\.[0-9]+)?(?:\/[0-9]+(?:\.[0-9]+)?)?/y):String(n),[i,a=`1`]=(r??``).split(`/`),o=parseFloat(i)/parseFloat(a);return(r===null||!(o>1))&&e.fail(`ed(r) divides a ratio above 1: ed(2) is the octave, ed(3/2) the fifth, ed(7, 3/2) seven steps to it`,t),o},r=e.i,i=/^(?:[0-9]+|free\([^()]*\))\s*,/.test(e.text.slice(e.i))?e.int(`the steps, ed(n, r)`,K.grid,`steps`):null;i!==null&&e.match(/\s*,\s*/y);let a=i===null?null:eo(e,i,r);a!==null&&a<1&&e.fail(`ed(n, r): n steps to the ratio, at least 1`,r);let o=n();return e.expect(`)`,`')' to close ed(…)`),{kind:`edo`,period:o,steps:a,span:e.span(t)}}let n=e.match($a);if(n===null&&e.fail(`map= takes ${Object.keys(Qa).join(`, `)}, ed(r), midi(c, p) or a table cell (&curve)`),n===`edo`){let n=null;if(e.peek()===`(`){e.i++;let t=e.i,r=e.freeNumber(K.grid,`steps`),i=r===null?e.match(/[0-9]+/y):String(r);(i===null||parseInt(i,10)<1)&&e.fail(`edo(n): n equal steps to the octave, edo(19)`,t),n=eo(e,parseInt(i,10),t),e.expect(`)`,`')' to close edo(…)`)}return{kind:`edo`,period:2,steps:n,span:e.span(t)}}return n===`midi`?no(e,t):{kind:n,span:e.span(t)}}function no(e,t){if(e.peek()!==`(`)return{kind:`midi`,channel:null,port:1,span:e.span(t)};e.i++;let n=(t,n)=>{let r=e.i,i=e.freeNumber({...K.grid,max:16},t===`A MIDI channel`?`channel`:`port`),a=i===null?e.match(/[0-9]+(?:\.[0-9]+)?/y):String(i),o=a===null?NaN:parseFloat(a);return Number.isInteger(o)&&o>=1&&o<=16||e.fail(`${t} is a whole number from 1 to 16: ${n}`,r,Math.max(1,a?.length??1)),o},r=n(`A MIDI channel`,`map=midi(10)`),i=1;return e.match(/\s*,\s*/y)!==null&&(i=n(`A MIDI output slot`,`map=midi(10, 2)`)),e.expect(`)`,`')' to close midi(…)`),{kind:`midi`,channel:r,port:i,span:e.span(t)}}let ro=It.adsr,io=[`braid`,`pattern`,`equal`,`notes`,`midi`,`do`,`degrees`,`table`,`scale`,`mode`,`key`,`grid`,`meter`,`spectrum`,`wave`,`levels`,`adsr`,`mix`,`note`,`petal`,`off`,`matrix`,`lfo`,`brightness`],ao={notes:[`flats`,`sharps`,`german`],do:[`fixed`,`movable`]},oo=e=>(t,n,r,i)=>{n[e]=t.int(`a whole number after ${e}=`,K[e]),n.paramSpans[e]=t.place(i)},so=(e,t)=>(n,r,i,a)=>{let o=n.i,s=n.match(/"([^"]*)"/y);if(s===null&&n.fail(`${e}= takes a text in quotes: ${t}`),r[e]=s.slice(1,-1),e!==`label`&&(r.paramSpans[e]=n.place(a)),e===`label`)for(let e of s.matchAll(/\{(?:&[A-Za-z_][A-Za-z0-9_]*:)?([A-Za-z_][A-Za-z0-9_]*)\}/g))fi.includes(e[1])||n.warn(`{${e[1]}} isn't a label field: it shows as written (the fields: ${fi.map(e=>`{${e}}`).join(` `)})`,o+e.index,e[0].length)},co=e=>(t,n)=>{n[e]=t.cellRef(`a cell after ${e}=, like ${e}=&pluck or ${e}=&(map=adsr .01 .3 .5 .4)`,`after ${e}=`)},lo=(e,t,n)=>{t.step=Za(e,n===`loop`)},uo={over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{}},fo={over:{form:`over=&table · over=&table[<<n] · over=scale(name, tonic)`,examples:[`&tune over=&major step=2 0 2 4`,`&mode over=&major[<<2] 0 2 4`,`&tune over=scale(minor, A) step=2 0 2 4`,`&bass over=&key step=16n 0 4 7`],read:(e,t)=>{let n=/key(?![A-Za-z0-9_])/y;if(n.lastIndex=e.i,n.test(e.text)){let n=e.i;e.i+=3,e.peek()===`[`&&e.fail(`over=key is the old way: name the key, and turn it there (over=&key[<<2])`,e.i,1),t.over={name:li,pick:null,shift:0,span:e.place(n)}}else if(e.text.startsWith(`scale(`,e.i)){let n=e.i;e.i+=5;let r=Ca(e,n),i=`scale:λ${e.line}_${n+e.offset}`;e.lambdas.push({...uo,name:i,span:r.span,lambda:e.text.slice(n,e.i),over:r.key,braid:{kind:`scan`,steps:r.steps,span:r.span,...r.mode?{mode:r.mode}:{}}}),t.over={name:i,pick:null,shift:0,span:r.span}}else t.over=e.cellRef(`a cell or scale(name, tonic) after over=, like over=&key or over=scale(minor, A)`,`after over=`);t.over.pick&&e.fail(`over= takes a whole table (shifting it is fine: over=&scale[<<])`,t.over.span.col-1,t.over.span.len)}},base:{form:`base=&cell · base=&cell^$n · base=&cell^n`,examples:[`&answer base=&subject^$7 =!3 12@2`,`&last base=&subject =!21 3@2`],read:(e,t)=>{t.base=e.ref(`a cell after base=, like base=&subject or base=&subject^$7`),t.base.pick&&e.fail(`base= takes a whole cell (transposing it is fine: base=&subject^$7)`,t.base.span.col-1,t.base.span.len)}},step:{form:`step=…`,examples:[`&tune step=4n 0 2 4`,`&tune step=&clock 0 2 4`],read:lo},loop:{form:`loop=…`,examples:[`&lead s=saw loop=C4`],read:lo},shift:{form:`shift=n · shift=free(n, lo..hi)`,examples:[`&mode over=&major shift=5 0 2 4`,`&key shift=free(0, 0..11)`],read:oo(`shift`)},stride:{form:`stride=n · stride=free(n, lo..hi)`,examples:[`&key step=cycle(&theme) stride=7`],read:oo(`stride`)},map:{form:`map=…`,examples:[`&accent map=amp step=&bar 1 .5`],read:(e,t)=>t.map=to(e)},show:{form:`show=kind · show=notes:convention · show=do:convention · show=mix:&grid`,examples:[`&tune show=notes step=2 0 2 4`,`&tune show=notes:german step=2 0 2 4`,`&tune show=do:movable step=2 0 2 4`,`&band show=mix:&edo19 [&a, &b]`],read:(e,t)=>{let n=e.i,r=e.match(/[a-z]+/y);r===null&&e.fail(`show= takes one of: ${io.join(` `)}, or a plugin of the piece`,n,1);let i=``;if(r===`mix`&&e.peek()===`:`&&!e.text.startsWith(`:&`,e.i)&&e.fail(`show=mix:&grid: the grid whose colours the mix wears, like show=mix:&edo19 (no space after the colon)`,n,e.i+1-n),r===`mix`&&e.text.startsWith(`:&`,e.i)){e.i+=2;let r=e.match(Ir);r===null&&e.fail(`show=mix:&grid: the grid whose colours the mix wears, like show=mix:&edo19`,n,e.i-n),t.show=`mix:&${r}`,t.paramSpans.show=e.span(n);return}if(e.peek()===`:`){e.i++;let t=e.match(/[a-z]+/y)??``;ao[r]?.includes(t)||e.fail(`show=${r}: takes ${r===`notes`?`flats, sharps or german`:r===`do`?`fixed or movable`:`no convention`}`,n,e.i-n),i=`:${t}`}t.show=r+i,t.paramSpans.show=e.span(n)}},label:{form:`label="text"`,examples:[`&theme label="the King's theme" step=2 0 2 4`,`&note label="A note in the graph: alone on its cell."`],read:so(`label`,`label="the King's theme"`)},env:{form:`env=&envelope`,examples:[`&lead s=saw loop=C4 env=&(map=adsr .01 .3 .5 .4)`],read:co(`env`)},pitch:{form:`pitch=&vibrato · pitch=lo..hi * &shape`,examples:[`&lead s=saw loop=C4 pitch=&(loop=5 0 .1 -.1)`,`&bd s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0)`],read:(e,t,n,r)=>/^[0-9.]+\.\./.test(e.text.slice(e.i))?So(e,t,n):co(`pitch`)(e,t,n,r)},cycle:{form:`cycle=n`,examples:[`&key step=cycle(&theme) stride=2 cycle=2`,`&wheel cycle=1 0 4 7`,`&drone cycle=0 0 4 7`],read:(e,t,n,r)=>{let i=e.i;t.cycle=e.int(`a whole number after cycle=`,K.cycle),t.cycle<0&&e.fail(`cycle= counts laps: 0 or more`,i,e.i-i),t.paramSpans.cycle=e.place(r),t.cycle>5e4&&e.fail(`cycle=${t.cycle}: at most ${ui.toLocaleString(`en`)}, the most steps a cell can hold (a grid's to its period, a table's turns before it comes round)`,i,e.i-i)}},size:{form:`size=x`,examples:[`&theme size=2 step=2 0 2 4`],read:(e,t)=>{let n=e.i,r=e.freeNumber(K.size),i=r===null?e.match(/[0-9]*\.?[0-9]+/y):String(r);(i===null||!(+i>=.25&&+i<=4))&&e.fail(`size= is how large it is drawn, from .25 to 4: size=2`,n,Math.max(1,(i??``).length)),t.size=+i}},laps:{form:`laps=n`,examples:[`&bar scan(4 4 4 4) step=84bpm laps=30`],read:(e,t,n,r)=>{let i=e.freeNumber(K.laps),a=i===null?e.match(/[0-9]+/y):String(i);(a===null||!(parseInt(a,10)>=1))&&e.fail(`laps= takes a count of laps, 1 or more: laps=1`,r,n.length+1),t.laps=parseInt(a,10)}},chance:{form:`chance=p · chance=free(p, 0..1)`,examples:[`&ghost chance=.8 step=4 0? 0? 0? 0?`,`&ghost chance=free(.7, 0..1) step=4 0? 0?`],read:(e,t)=>{let n=e.freeNumber(K.chance);if(n!==null)t.chance=n;else{let n=e.i,r=e.match(/(?:0?\.[0-9]+|0|1(?:\.0+)?)(?![0-9])/y);r===null&&e.fail(`chance= is a probability from 0 to 1: chance=.3, or chance=free(.3, 0..1)`,n,1),t.chance=parseFloat(r)}}},seed:{form:`seed=n`,examples:[`&ghost seed=7 step=4 0? 0? 0? 0?`],read:(e,t)=>t.seed=e.int(`a whole number after seed=`,K.seed)},title:{form:`title="text"`,examples:[`&piece title="Swing blues" tags="genre:jazz, rhythm" label="A blues in F."`],read:so(`title`,`title="Swing blues"`)},tags:{form:`tags="tag, tag"`,examples:[`&lead tags="melody" s=saw loop=C4`,`&beam tags="metal" map=ratios 1 2.756 5.404`],read:so(`tags`,`tags="jazz, blues"`)},tier:{form:`tier=n`,examples:[`&piece title="Steps: a tune on one line" tags="tutorial" tier=1 label="Numbers, rests, holds and repeats."`],read:(e,t,n,r)=>{e.free(K.tier);let i=e.match(/[0-9]+(?![0-9.])/y);(i===null||!(parseInt(i,10)>=1&&parseInt(i,10)<=9999))&&e.fail(`tier= is a tier of the tutorial, 1 to 9999: tier=1`,r,n.length+1),t.tier=parseInt(i,10),t.paramSpans.tier=e.place(r)}},style:{form:`style=&s · style=[&a * w, &b * w] · style=a..b · style=a..b * &curve`,examples:[`&style label="Funk" style=&funk`,`&style label="close to Funk, then Bossa nova" style=[&funk * .8, &bossa * .2]..&bossa`],read:(e,t,n,r)=>{let i=go(e),a=null,o=null;e.text.startsWith(`..`,e.i)&&(e.i+=2,a=go(e),/^\s*\*\s*&/.test(e.text.slice(e.i))&&(e.skipSpace(),e.i++,e.skipSpace(),o=e.cellRef(`a curve after style=a..b *, like * &rise`,`in style=`))),t.style={from:i,to:a,...o?{curve:o}:{},span:e.place(r)}}},about:{form:`about=&cell · about=(&a &b …)`,examples:[`&fenvNote label="The filter opens on every note." about=&fenv`,`&why label="Two cells at once." about=(&fenv &accent)`],read:(e,t,n,r)=>{let i=`a cell after about=, like about=&fenv or about=(&fenv &accent)`,a=[];if(t.about=a,e.peek()===`(`){for(e.i++,e.skipSpace();e.peek()!==`)`;)e.done()&&e.fail(`')' to close about=(…)`),a.push(e.cellRef(i,`in about=`)),e.skipSpace();e.i++,a.length===0&&e.fail(i,r,n.length+1)}else a.push(e.cellRef(i,`in about=`))}}},po=/^\(\s*(?:-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)[a-z]*\s*,)/;function mo(e,t){let n=e.i,r=e.frees.length,i=t=>{if(e.text.startsWith(`free(`,e.i))return e.free(K.end,t).value;let n=e.match(/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?![0-9])/y);return n===null?null:parseFloat(n)},a=()=>(e.i=n,e.frees.length=r,null),o=i(`${t} low`);if(o===null)return a();if(e.text.startsWith(`..`,e.i)){e.i+=2;let n=i(`${t} high`);return n===null&&e.fail(`${t}=: a range's other end, a number or a slider — ${t}=200..3000 * &a`),[o,n]}let s=/\s*(?:±|\+-)\s*/y;if(s.lastIndex=e.i,s.test(e.text)){e.i=s.lastIndex,e.frees.length>r&&(e.frees[r].param=t);let n=i(`${t} reach`);(n===null||n<0)&&e.fail(`${t}=c ± r: a reach, a number or a slider, 0 or more — ${t}=free(.6, 0..1) ± free(.2, 0..0.5) * &a`);let a=e=>Math.round(e*0xe8d4a51000)/0xe8d4a51000;return[Math.max(0,a(o-n)),a(o+n)]}return a()}function ho(e,t){let n=e.i,r=e.free(K.axis,t),[i,a]=R.find(e=>e.name===t).range;return(r.lo<i||r.hi>a)&&e.fail(`${t}=free(…) moves within the axis, ${i} to ${a}: ${t}=free(${r.value}, ${i}..${a})`,n,e.i-n),r}function go(e){let t=`a style after style=, like style=&funk, style=&(map=style .3 .45 .55 .55) or style=[&funk * .8, &bossa * .2]`;if(e.peek()!==`[`)return{kind:`cell`,ref:e.cellRef(t,`in style=`)};e.i++;let n=[];for(;;){e.skipSpace();let r=e.cellRef(t,`in style=[…]`);if(e.skipSpace(),e.expect(`*`,`'*' and a weight after &${r.name}: style=[&${r.name} * .8, …]`),e.skipSpace(),n.push({ref:r,weight:e.num(`a weight after &${r.name} *`,K.weight).value}),e.skipSpace(),e.peek()===`,`){e.i++;continue}return e.expect(`]`,`']' to close style=[…]`),{kind:`mix`,terms:n}}}let _o={fm:`a voice after fm=, like fm=&op`,write:`what the tape records, like write=&melody`,play:`the tape it reads, like play=&tape, or the notes a gate plays, like play=&tune`,couple:`the resonator it shares a table with, like couple=&fork`,excite:`what drives it, like excite=&mix`,trigger:`the melody whose notes it plays with, like trigger=&tune`,velocity:`a level cell, like velocity=&accent`,gate:`a level cell, like gate=&duck`},vo=(e,t,n)=>{if(n===`play`)return yo(e,t);let r=e.cellRef(_o[n],`after ${n}=`);t.params[n]=r.name,t.paramSpans[n]=r.span};function yo(e,t){let n=e.i,r=e.ref(_o.play);if(e.rejectTap(n),t.params.play=r.name,t.paramSpans.play=r.span,r.transpose||r.degree){let i=e.text.lastIndexOf(`^`,e.i-1);t.playMove={...r.transpose?{transpose:r.transpose}:{},...r.degree?{degree:r.degree}:{},at:i,len:e.i-i,as:e.text.slice(n,e.i)}}}let bo=(e,t)=>{let n=e.i,r=e.match(/[1-9][0-9]*(?:n\.?|t)(?=:)/y);r===null&&e.fail(`a level and a table after bend=, the lengths of its nodes: bend=4n:&rubato`),e.i++;let i=e.cellRef(`a table after bend=4n:, the lengths of its nodes: bend=4n:&rubato`,`after bend=4n:`),a,o=null;if(e.peek()===`:`){e.i++;let t=e.i;o=Co(e,`depth`,t),a=o?o.range?o.range[0]:1:e.num(`a depth after bend=${r}:&${i.name}:, how far its table applies (1 as written, 0 even, -1 inverted): bend=${r}:&${i.name}:.5`,K.depth).value}t.bend={level:r,table:i,...a===void 0?{}:{depth:a},...o?{depthMoves:o}:{}},t.paramSpans.bend=e.place(n)},xo=(e,t,n)=>{if(!/^[1-9][0-9]*(?:n\.?|t):/.test(e.text.slice(e.i)))return So(e,t,n);let r=e.i,i=[];for(;;){let a=e.match(/[1-9][0-9]*(?:n\.?|t)(?=:)/y);a===null&&e.fail(`a level after the comma, a note value and a share: ${n}=8n:.6,16n:.55`),e.i++;let o,s=n===`swing`?Co(e,`swing`,e.i):null;if(s){(i.length||e.peek()===`,`||e.peek()===`:`)&&e.fail(`a share moved by cells is one level alone: swing=8n:&lean, swing=8n:.5...75 * &k`,r,e.i-r),t.swingMoves={level:a,...s},i.push({level:a,share:s.range?s.range[0]:.5});break}let c=e.free(n===`swing`?K.share:K.legatoShare,n),l=c!==null;if(l)o=c.value,(i.length||e.peek()===`,`)&&e.fail(`a share left free(…) is one level alone: ${n}=8n:free(.5, .5..75)`,r,e.i-r);else if(n===`legato`){let t=e.match(/(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?![0-9.])/y);t===null&&e.fail(`a share after ${a}:, of each note's held length (.5 staccato, 1 as written): legato=${a}:.5`),o=parseFloat(t)}else{let t=e.i,n=e.match(/[0-9]+\/[0-9]+(?![0-9.])/y);if(n!==null){let[r,i]=n.split(`/`).map(Number);i===0&&e.fail(`a share's denominator can't be 0: swing=${a}:2/3`,t,n.length),r>i&&e.fail(`a share is from 0 to 1, and ${n} is above it: swing=${a}:2/3`,t,n.length),o=r/i}else{let t=e.match(/(?:0?\.[0-9]+|0|1(?:\.0+)?)(?![0-9])/y);t===null&&e.fail(`a share after ${a}:, from 0 to 1, a decimal or a fraction (.5 straight, .67 or 2/3 the triplet swing): swing=${a}:2/3`),o=parseFloat(t)}}if(e.peek()===`:`){let t=e.i;e.i++;let i=e.match(/[a-z]+/y);i!==`pairs`&&e.fail(`a share takes no word after it: a swing leans a level's pairs alone and keeps its groups of three straight (swing=${a}:2/3)`,t,1+(i?.length??0)),n===`legato`&&e.fail(`:pairs was swing='s word; a legato= share holds every note of its level: legato=${a}:.5`,t,6),l&&e.peek()===`,`&&e.fail(`a share left free(…) is one level alone: ${n}=8n:free(.5, .5..75)`,r,e.i-r),e.warn(`:pairs says nothing more: every swing leans a level's pairs alone and keeps its groups of three straight (decision 071); Migrate drops it`,t,6)}if(i.push({level:a,share:o}),e.peek()!==`,`)break;e.i++}n===`legato`?t.legato=i:(t.swing=i,t.params[n]=i[0].share),t.paramSpans[n]=e.span(r)};function So(e,t,n){let r=e.i;if(n===`level`&&(e.peek()===`&`||/^(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+|free\([^()]*\))\s*\*/.test(e.text.slice(e.i)))){let i=[],a=1;for(let t=!0;;t=!1){let n=e.i;if(!t){if(e.skipSpace(),e.peek()!==`*`){e.i=n;break}e.i++,e.skipSpace()}let r=e.freeNumber(K.level),o=r===null?e.match(/(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y):String(r);o===null?i.push(e.cellRef(`a level cell or a number, like level=&accent*&duck*.4`,`in level=`)):a*=parseFloat(o)}t.paramCells[n]={range:null,factors:i,span:e.span(r)},a!==1&&(t.params[n]=a),t.paramSpans[n]=e.span(r);return}if((e.peek()===`&`||Ja(e))&&Yr.has(n)){let i=Za(e,!1);i.kind!==`driven`&&i.kind!==`tap`&&e.fail(`${n}= takes seconds, a clock or a tap: ${n}=&bar*2, ${n}=8n`,r,e.i-r),t.paramClocks[n]=i,t.paramSpans[n]=e.span(r);return}let i=n===`s`?e.text.slice(e.i).match(/^([A-Za-z]+)\.\.([A-Za-z]+)/):null;if(i){e.i+=i[0].length;let n=[];for(;;){let t=e.i;if(e.skipSpace(),e.peek()!==`*`){e.i=t;break}e.i++,e.skipSpace(),n.push(e.cellRef(`a cell after *, like s=${i[0]} * &style[artic]`,`in s=`))}n.length===0&&e.fail(`s=${i[0]}: a blend of two waves is moved by cells, the share of the second: s=${i[0]} * &style[artic]`,r,e.i-r),t.params.s=i[1],t.paramCells.s={range:[0,1],factors:n,span:e.span(r),to:i[2]},t.paramSpans.s=e.span(r);return}let a=Co(e,n,r);if(a){t.paramCells[n]=a,t.paramSpans[n]=e.span(r);return}let o=e.free(K.param,n);if(o!==null){t.params[n]=o.value,t.paramSpans[n]=e.span(r);return}let s=e.match(/-?[A-Za-z0-9_.]+/y);s===null&&e.fail(`Expected a value after ${n}=`);let c=/^-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/.test(s)?parseFloat(s):s;t.params[n]=n===`ftype`&&typeof c==`number`?ri(c)??c:c,t.paramSpans[n]=e.span(r)}function Co(e,t,n){let r=mo(e,t);if(e.peek()!==`&`&&!r)return null;let i=[];for(r||i.push(e.cellRef(`a cell after ${t}=`,`in ${t}=`));;){let n=e.i;if(e.skipSpace(),e.peek()!==`*`){e.i=n;break}e.i++,e.skipSpace(),i.push(e.cellRef(`a cell after *, like ${t}=200..3000 * &fenv`,`in ${t}=`))}return r&&i.length===0&&e.fail(`${t}=${e.text.slice(n,e.i)}: a range is scaled by cells — ${t}=${e.text.slice(n,e.i)} * &fenv`,n,e.i-n),!r&&i.length>1&&e.fail(`${t}=: several cells multiply a range — ${t}=200..3000 * &a * &b`,n,e.i-n),{range:r,factors:i,span:e.span(n)}}let wo={init:`init= is now shift=`,out:`out= is now a command: out(voice, &cell) / step(&meter, bpm=…)`,time:`time= is now a command: out(voice, &cell) / step(&meter, bpm=…)`,rung:`rung= is now tier= (decision 020): the tutorial is in tiers, tier=1 to tier=9`,...si};function To(e){let t=e.i;e.i+=5,e.peek()===`"`&&e.fail(`free("…") is a text, for spell(…): a braid left free is steps, free(0 2 4 ~)`,t,6);let n=e.text.indexOf(`)`,e.i);n<0&&e.fail(`')' to close free(…)`,t,e.i-t);let r=e.within(e.text.slice(e.i,n),e.i),i=[];for(;r.skipSpace(),!r.done();){let e=r.i,t=qa(r);z(t.atom).some(e=>e.kind!==`note`&&e.kind!==`rest`&&e.kind!==`chord`)&&r.fail(`A braid left free holds steps: numbers, rests (~), chords ([0,4]) and subsequences of them ([0 2]), held (@n) or repeated (!n)`,e,r.i-e),Ga(r,i,t)}i.length||e.fail(`free(…) around a braid needs steps: free(0 2 4 ~)`,t,n-t+1),e.i=n+1;let a=i.reduce((e,t)=>e+t.repeat*t.elongate,0);return e.frees.push({key:`braid`,value:0,unit:``,lo:0,hi:a,span:e.place(t),braid:r.text.trim().replace(/\s+/g,` `)}),{kind:`list`,tokens:i}}function Eo(e,t){let n={over:null,base:null,shift:null,cycle:null,step:null,map:null,stride:null,env:null,pitch:null,show:null,label:null,laps:null,title:null,tags:null,tier:null,about:null,style:null,chance:null,seed:null,size:null,swing:null,bend:null,swingMoves:null,legato:null,params:{},paramSpans:{},paramCells:{},paramClocks:{},playMove:null},r=/* @__PURE__ */ new Map,i=!1,a=!1,o=[],s=null,c=null,l=null,u=!1,d=-1,f=``,p=/* @__PURE__ */ new Map,m=/* @__PURE__ */ new Map;for(;!e.done();){let t=e.i,h=e.match(Ir);if(h!==null&&e.peek()===`=`){e.i++;let i=h in fo||h in Gr?h:Kr[h]??null;if(i===null&&ro.includes(h)){m.has(h)&&e.fail(`${h}= is given twice`,t,h.length),m.set(h,t),So(e,n,h),e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);continue}if(i===null&&Ft.includes(h)){p.has(h)&&e.fail(`${h}= is given twice`,t,h.length);let r=e.i,i=/^(?:free\([^)]*\)|-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+))\s*(?:\.\.|±|\+-)/.test(e.text.slice(e.i));if(e.text.startsWith(`free(`,e.i)&&!i)p.set(h,{value:String(ho(e,h).value),at:t});else if(e.peek()===`&`||i){let i=e.frees.length;So(e,n,h);let a=n.paramCells[h];a||e.fail(`${h}=: a moving axis is a range within it and the cell that moves it, ${h}=0..1 * &walk`,r,e.i-r);let[o,s]=R.find(e=>e.name===h).range;for(let t of e.frees.slice(i))t.param!==`${h} reach`&&(t.lo<o||t.hi>s)&&e.fail(`${h}=: a window's end moves within the axis, ${o} to ${s}: free(${t.value}, ${Math.max(o,t.lo)}..${Math.min(s,t.hi)})`,r,e.i-r);let c=/±|\+-/.test(e.text.slice(r,e.i)),[l,u]=a.range??[o,s];c?[l,u]=[Math.min(s,Math.max(o,l)),Math.min(s,Math.max(o,u))]:l>=o&&l<=s&&u>=o&&u<=s||e.fail(`${h}= moves within the axis, ${o} to ${s}: ${h}=${o}..${s} * &walk`,r,e.i-r),a.range&&(n.paramCells[h]={...a,range:[l,u]}),p.set(h,{value:String(l),at:t})}else e.num(`a number after ${h}= (an axis of a style, 0 to 1), or a slider, ${h}=free(.3, 0..1)`,K.axis,h),p.set(h,{value:e.text.slice(r,e.i),at:t});e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);continue}if(i===null){h in wo&&e.fail(wo[h],t,h.length);let n=ei(h);e.fail(`Unknown attribute ${h}=${n?` — did you mean ${n}=?`:``} (a cell: ${Object.keys(Wr).join(` `)}; a sound or a physical cell: ${Object.keys(Gr).join(` `)})`,t,h.length)}let a=i===`loop`?`step`:i;if(r.has(a)){let o=r.get(a);e.fail(a===`step`&&n.step.whole!==(h===`loop`)?`step= and loop= say the same thing two ways — pick one`:o===h?`${h}= is given twice`:`${h}= and ${o}= are one parameter, ${i}= — given twice`,t,h.length)}r.set(a,h),h===`clip`&&e.warn(`clip= is Strudel's name for legato= — write legato= (Normalise rewrites it)`,t,h.length),(fo[i]?.read??(i===`swing`||i===`legato`?xo:i===`bend`?bo:Jr.has(i)?vo:So))(e,n,i,t),e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);continue}if(h===`free`&&e.peek()===`(`&&n.map?.kind===`style`&&/^\(\s*[^,()]*,/.test(e.text.slice(e.i))){let n=Ft[o.length];n===void 0&&e.fail(`A style has ${Ft.length} axes (${Ft.join(` `)}): this value is one more`,t,h.length),e.i=t;let r=e.within(String(ho(e,n).value),t);Ga(r,o,qa(r));continue}if(h===`free`&&e.peek()===`(`&&po.test(e.text.slice(e.i))){s&&e.fail(u?Mr:`A cell has one braid: a generator or a list of steps`,t,h.length),e.i=t,Ga(e,o,qa(e));continue}if(h===`free`&&e.peek()===`(`){(s||o.length)&&e.fail(Mr,t,h.length),e.i=t,s=To(e),u=!0,d=e.i,f=e.text.slice(t+5,e.i-1).trim();continue}if(h!==null&&Oa(h)&&e.peek()===`(`){if((s||o.length)&&e.fail(u?Mr:`A cell has one braid: a generator or a list of steps`,t,h.length),h===`fifths`){let n=wa(e,t);s=n.braid,l=n.shift}else if(h===`scale`){let n=Ca(e,t);s={kind:`scan`,steps:n.steps,span:n.span,...n.mode?{mode:n.mode}:{}},c=n.key}else s=ka(e,h,t);continue}if(h!==null&&La.includes(h)&&e.peek()===`(`){s&&e.fail(u?Mr:`A cell has one braid: a generator or a list of steps`),e.i=t,Ga(e,o,qa(e));continue}if(h===`off`&&e.atBoundary()){i&&e.fail(`off is given twice`,t,h.length),i=!0;continue}if(h===`oneshot`&&e.atBoundary()){a&&e.fail(`oneshot is given twice`,t,h.length),a=!0,e.warn(`oneshot is retired as a line word: a voice’s parameter, oneshot=1 (Migrate rewrites it, decision 068)`,t,h.length);continue}if(h!==null&&(/^[A-G](?:b?-?[0-9]*)$/.test(h)||h===`_`||Object.hasOwn(yr,h))?e.i=t:h!==null&&e.fail(`Unexpected '${h}'`,t,h.length),s&&u&&e.peek()===`)`&&e.fail(`A ')' with nothing to close: free(${f}) ends at its first ')'`,t,1),s&&t===d&&/[@!*/?:]/.test(e.peek())){let n=/^\S+/.exec(e.text.slice(t))[0];e.fail(`free(${f})${n}: a modifier goes on its steps, inside the parentheses: free([${f}]${n})`,t,n.length)}s&&e.fail(u?Mr:`A cell has one braid: a generator or a list of steps`,t,1),Ga(e,o,qa(e))}if(p.size){let[t,{at:r}]=[...p][0];n.map?.kind!==`style`&&e.fail(`${t}= is an axis of a style: it goes on a map=style cell (&funk map=style sync=.3 harm=.45 artic=.55 energy=.55)`,r,t.length),(s||o.length)&&e.fail(`A style writes its axes by name (sync=.3) or in order (.3 .45 .55 .55), not both`,r,t.length);let i=Ft.filter(e=>!p.has(e));i.length&&e.fail(`A style names every axis: ${i.map(e=>`${e}=`).join(` `)} ${i.length===1?`is`:`are`} missing (its axes: ${Ft.join(` `)})`,r,t.length);for(let t of Ft){let{value:n,at:r}=p.get(t),i=e.within(n,r+t.length+1);Ga(i,o,qa(i))}}if(m.size){let[t,r]=[...m][0];n.map?.kind!==`adsr`&&e.fail(wo[t]??`${t}= is a slot of an envelope: it goes on a map=adsr cell`,r,t.length),(s||o.length)&&e.fail(`An envelope writes its slots by name (attack=.01) or in order (.01 .3 .5 .4), not both`,r,t.length);let i=ro.filter(e=>!m.has(e));i.length&&e.fail(`An envelope names every slot: ${i.map(e=>`${e}=`).join(` `)} ${i.length===1?`is`:`are`} missing (its slots: ${ro.join(` `)})`,r,t.length);for(let t of ro){let r=m.get(t),i=n.paramCells[t],a=i?String(i.range?.[0]??0):n.params[t];typeof a!=`number`&&typeof a!=`string`&&e.fail(`${t}= takes a number, a range scaled by cells, or a cell`,r,t.length),delete n.params[t];let s=e.within(String(a),r+t.length+1);Ga(s,o,qa(s))}}let h=s??(o.length?{kind:`list`,tokens:o}:{kind:`blank`});if(n.params.oneshot!==void 0){let t=n.paramSpans.oneshot,r=n.params.oneshot;r!==0&&r!==1&&e.fail(`oneshot= is 1 (each note played through) or 0 (as its step, the default)`,t?t.col-1:0,7),a&&e.fail(`oneshot is given twice: write oneshot=1 alone`,t?t.col-1:0,7),a=r===1,delete n.params.oneshot,delete n.paramSpans.oneshot}let g;if(n.params.note!==void 0){let t=n.paramSpans.note,r=n.params.note;(typeof r!=`number`||!Number.isInteger(r)||r<0||r>127)&&e.fail(`note= is a MIDI note, a whole number from 0 to 127 (36 a kick, 38 a snare)`,t?t.col-1:0,4),g=r,delete n.params.note,delete n.paramSpans.note}if(a&&typeof n.params.glide==`number`&&n.params.glide>0){let t=n.paramSpans.glide;e.fail(`oneshot or glide=: a voice plays each note through, or ties them as one`,t?t.col-1:0,5)}l!==null&&l!==0&&(n.shift!==null&&e.fail(`fifths(n) turns it already: write fifths() and shift=, or fifths(n) alone`),n.shift=l),c&&(n.over&&e.fail(`scale(…) reads through a key of its own: drop over=, or write the key as a cell (&mode over=&key scan(…))`,n.over.span.col-1,n.over.span.len),n.over=c),n.playMove&&h.kind===`blank`&&e.warn(`${n.playMove.as} after play=: ^ and ^$ move what a gate plays (one with a braid: &out play=${n.playMove.as} &lead); a read head reads the tape itself, so the move is ignored`,n.playMove.at,n.playMove.len);let _=n.playMove&&h.kind!==`blank`?{...n.playMove.transpose?{transpose:n.playMove.transpose}:{},...n.playMove.degree?{degree:n.playMove.degree}:{}}:null,{over:v,base:y,shift:b,step:x,map:S,stride:C,cycle:w,env:T,pitch:E,show:D,label:O,title:k,tags:A,tier:j,about:M,style:ee,laps:te,chance:ne,seed:N,size:re,swing:P,bend:ie,swingMoves:ae,legato:oe,params:se,paramSpans:ce,paramCells:le,paramClocks:ue}=n;return{name:t.name,span:t.span,over:v,...y?{base:y}:{},shift:b,off:i,...a?{oneshot:a}:{},...g===void 0?{}:{drumNote:g},step:x,map:S,stride:C,cycle:w,env:T,pitch:E,show:D,label:O,title:k,tags:A,tier:j,about:M??void 0,...ee?{style:ee}:{},laps:te,chance:ne,seed:N,size:re,...P?{swing:P}:{},...ie?{bend:ie}:{},...ae?{swingMoves:ae}:{},...oe?{legato:oe}:{},params:se,paramSpans:ce,paramCells:le,paramClocks:ue,..._?{playMove:_}:{},braid:h,frees:[...e.frees]}}function Do(e){e.skipSpace(),e.text.startsWith(`&(`,e.i)&&e.fail(`An unnamed cell &( … ) goes where a cell is used; a line declares a named one: &name …`);let t=e.cellRef(`a cell name like &theme`,`names the line`);return(t.pick||t.shift)&&e.fail(`Brackets go where a cell is used (&x[0], &x[<<]), not where it is named — use shift= here`,t.span.col-1,t.span.len),e.peek()===`(`&&e.fail(`&name(…) is gone — write over=&…`),Eo(e,t)}let Oo=/^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20}|(?:rgb|rgba|hsl|hsla)\(\s*[-0-9.%\s,/]{1,40}\)|var\(--[a-z0-9-]{1,40}\))$/,ko=/^=== plugin ([a-z]+) ===\s*$/,Ao=/^=== end ===\s*$/,jo=`=== plugin name === … === end ===`,Mo=/^=== plugin /m;function No(e,t=[],n=!1){if(!Mo.test(e))return{text:e,plugins:[],diagnostics:[]};let r=e.split(`
`),i=[],a=[],o=(e,t,n=`error`)=>a.push({severity:n,message:t,span:{line:e,col:1,len:Math.max(1,r[e-1]?.length??1)}});for(let e=0;e<r.length;e++){let a=ko.exec(r[e]);if(!a){Ao.test(r[e])&&o(e+1,`=== end === without a plugin block before it (${jo})`);continue}let s=e,c=s+1;for(;c<r.length&&!Ao.test(r[c]);)c++;let l=r.slice(s+1,c).join(`
`);c<r.length||o(s+1,`plugin ${a[1]} has no === end === line`);let u=a[1];if(t.includes(u))o(s+1,`${u} is a show of its own: a plugin needs another name`);else if(i.some(e=>e.name===u))o(s+1,`plugin ${u} is written twice`);else{let e=Fo(u,l,s+1,n);typeof e==`string`?o(s+1,`plugin ${u}: ${e}`):i.push(e)}for(let e=s;e<=Math.min(c,r.length-1);e++)r[e]=``;e=c}return{text:r.join(`
`),plugins:i,diagnostics:a}}function Po(e){let t=e.indexOf(`{`);if(t<0||e.slice(0,t).trim())return null;let n=0,r=!1;for(let i=t;i<e.length;i++){let a=e[i];if(r)a===`\\`?i++:a===`"`&&(r=!1);else if(a===`"`)r=!0;else if(a===`{`)n++;else if(a===`}`&&--n===0)return{json:e.slice(t,i+1),rest:e.slice(i+1)}}return null}function Fo(e,t,n,r){let i=Po(t);if(!i)return`starts with its manifest, a { … } of JSON: { "fits": ["meter"], "size": 200 }`;let a;try{a=JSON.parse(i.json)}catch(e){return`its manifest is not JSON (${e.message})`}if(typeof a!=`object`||!a||Array.isArray(a))return`its manifest is an object`;let o=a,s=[`fits`,`size`,`rim`,`meaning`,`dial`,`tokens`],c=Object.keys(o).find(e=>!s.includes(e));if(c)return`its manifest has no "${c}" (it has: ${s.join(`, `)})`;if(!Array.isArray(o.fits)||!o.fits.length||!o.fits.every(e=>typeof e==`string`))return`"fits" lists the kinds of cell it shows: ["meter"]`;let l=o.size??200;if(typeof l!=`number`||!(l>=60&&l<=400))return`"size" is a number from 60 to 400`;if(o.rim!==void 0&&typeof o.rim!=`boolean`)return`"rim" is true or false`;if(o.meaning!==void 0&&typeof o.meaning!=`string`)return`"meaning" is a text`;let u=null;if(o.dial!==void 0){let e=o.dial;if(!(e&&typeof e==`object`&&typeof e.label==`string`&&typeof e.turn==`number`&&e.turn>0&&typeof e.key==`number`&&e.key>0))return`"dial" is { "label": "The day", "turn": 86400, "key": 3600 }: a name, seconds for a turn, seconds for a key press`;u={label:e.label,turn:e.turn,key:e.key}}let d={};if(o.tokens!==void 0){let e=o.tokens;if(!e||typeof e!=`object`||Object.values(e).some(e=>typeof e!=`string`||!Oo.test(e)))return`"tokens" maps names to colours (#rgb, rgb(…), hsl(…), a name, var(--x)): { "sun": "#ffd84a" }`;if(Object.keys(e).includes(`__proto__`))return`"tokens": a token can't be called __proto__`;Object.assign(d,e)}return{name:e,fits:o.fits,size:l,rim:o.rim!==!1,meaning:o.meaning??``,dial:u,tokens:d,code:i.rest.replace(/^\n+|\s+$/g,``),builtin:r,line:n}}let Io=String.raw`
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
`,Lo=Object.freeze(No(Io,[],!0).plugins.map(e=>Object.freeze({...e,tokens:Object.freeze({...e.tokens})})));function Ro(e,{old:t=!1}={}){let n=[],r=[],i=[],{text:a,plugins:o,diagnostics:s}=No(e,[...io,...Lo.map(e=>e.name)]),c=[...s],l=[],u=[],d=null;return a.split(`
`).forEach((e,t)=>{let n=Ur(e);d?(d.text+=` `,d.parts.push({line:t+1,start:d.text.length}),d.text+=n):d={text:n,line:t+1,parts:[{line:t+1,start:0}]},/[+*,[]\s*$/.test(d.text)||(u.push(d),d=null)}),d&&u.push(d),u.forEach(({text:e,line:a,parts:o})=>{let s=new Hr(e,a,0,[],o,c,0,Eo);if(s.done())return;if(Pn(e)){let t=e.search(/\S/);c.push({severity:`error`,message:`use is retired (decision 065): a line says where its cells come from, &bd, &sd from gm_kit (a collection, by name) or &key from diatonic(mode=dorian) D (a template, with its arguments)`,span:{line:a,col:t+1,len:e.trimEnd().length-t}});return}let u=Un(e);if(u!==void 0){let t=e.search(/\S/),n={line:a,col:t+1,len:e.trimEnd().length-t};u===null?c.push({severity:`error`,message:Gn,span:n}):u.kind===`use`?r.push({id:u.id,names:u.names,span:n}):i.push(...u.names.map(e=>e.slice(1)));return}try{let e=s.i,r=s.match(Ir);if(r===`step`&&s.peek()===`(`)s.fail(`step(…) is now a rate on the meter: &meter scan(27 23 26 24) step=84bpm`,e,4);else if(r===`out`&&/^\s*[(=]/.test(s.text.slice(s.i)))s.fail(`out is a cell now: &mix [&theme * &lead, …] and &out loop=SAMPLE_RATE map=sample &mix &mix`,e,3);else if(r===`cell`)s.fail(`The cell keyword is gone: a line starting with &name declares a cell`,e,4);else if(r===null){s.i=e;let r=Do(s);n.push(r,...s.lambdas),r.params.beat!==void 0&&c.push({severity:t?`warning`:`error`,message:`beat= is retired: a meter counts its beats by its signature or its levels (meter("4/4") beat=2 is meter("2/2", 2); a waltz in one, meter("*..", 4n)); Migrate rewrites it`,span:r.paramSpans?.beat??r.span})}else s.fail(`A line declares a cell: &name …`,e,r.length)}catch(t){if(!(t instanceof Vr))throw t;c.push({severity:`error`,message:t.message,span:{line:a,col:t.col+1,len:t.len}});let n=/^\s*&([A-Za-z_][A-Za-z0-9_]*)/.exec(e)?.[1];n&&l.push(n)}}),ln({cells:n,diagnostics:c,broken:l,plugins:o,...r.length?{uses:r}:{},...i.length?{offers:i}:{},...t?{old:t}:{}})}let zo=/* @__PURE__ */ new Map([[`creeping bass`,`creeping_bass`],[`walking bass`,`walking_bass`],[`eighths bass`,`eighths_bass`],[`funk bass`,`funk_bass`],[`pumping bass`,`pumping_bass`],[`root bass`,`root_bass`],[`tiptoe bass`,`tiptoe_bass`],[`lead performer`,`lead_performer`],[`stab performer`,`stab_performer`],[`pad performer`,`pad_performer`],[`drums performer`,`drums_performer`],[`bass performer`,`bass_performer`],[`Charleston stabs`,`charleston_stabs`],[`Synth-pop drums`,`synth_pop_drums`],[`Funk drums`,`funk_drums`],[`Spooky drums`,`spooky_drums`],[`Lo-fi hip hop drums`,`lo_fi_hip_hop_drums`],[`Ghost drums`,`ghost_drums`],[`rumba clave 3-2`,`rumba_clave_3_2`],[`bossa nova clave`,`bossa_nova_clave`],[`Techno drums`,`techno_drums`],[`Kinderlied drums`,`kinderlied_drums`],[`Bossa nova drums`,`bossa_nova_drums`],[`Deep house drums`,`deep_house_drums`],[`son clave 3-2`,`son_clave_3_2`],[`Swing jazz drums`,`swing_jazz_drums`],[`son clave 2-3`,`son_clave_2_3`],[`bossa nova clave (one bar)`,`bossa_nova_clave_one_bar`],[`Ambient drums`,`ambient_drums`],[`Electro swing drums`,`electro_swing_drums`],[`7/8`,`meter(grouping=meter("7/8"))`],[`4/4 leaning lightly on 16n`,`meter(swing=16n:.6)`],[`4/4 leaning faintly on 16n`,`meter(swing=16n:31/60)`],[`3/4`,`meter(grouping=meter("3/4"))`],[`6/8`,`meter(grouping=meter("6/8"))`],[`4/4 alla breve`,`meter(grouping=meter("2/2", 2))`],[`4/4 swung on 8n`,`meter(swing=8n:2/3)`],[`10/8`,`meter(grouping=meter("10/8"))`],[`2/4`,`meter(grouping=meter("2/4"))`],[`4/4`,`meter`],[`12/8`,`meter(grouping=meter("12/8"))`],[`5/4`,`meter(grouping=meter("5/4"))`],[`4/4 leaning on 16n`,`meter(swing=16n:.65)`],[`vamp to the seventh`,`vamp_to_the_seventh`],[`vamp to the fifth`,`vamp_to_the_fifth`],[`vamp to the sixth`,`vamp_to_the_sixth`],[`tonic vamp`,`tonic_vamp`],[`vamp to the fourth`,`vamp_to_the_fourth`],[`haunted progression`,`haunted_progression`],[`dark cadence`,`dark_cadence`],[`muted trumpet`,`muted_trumpet`],[`round bass`,`round_bass`],[`haunted pad`,`haunted_pad`],[`brass stab`,`brass_stab`],[`upright bass`,`upright_bass`],[`bell and scale`,`bell_and_scale`],[`harmonic minor`,`harmonic_minor`],[`rounded binary`,`rounded_binary`],[`call and answer`,`call_and_answer`],[`meter_7_8`,`meter(grouping=meter("7/8"))`],[`meter_4_4_leaning_lightly_on_16n`,`meter(swing=16n:.6)`],[`meter_4_4_leaning_faintly_on_16n`,`meter(swing=16n:31/60)`],[`meter_3_4`,`meter(grouping=meter("3/4"))`],[`meter_6_8`,`meter(grouping=meter("6/8"))`],[`meter_4_4_alla_breve`,`meter(grouping=meter("2/2", 2))`],[`meter_4_4_swung_on_8n`,`meter(swing=8n:2/3)`],[`meter_10_8`,`meter(grouping=meter("10/8"))`],[`meter_2_4`,`meter(grouping=meter("2/4"))`],[`meter_4_4`,`meter`],[`meter_12_8`,`meter(grouping=meter("12/8"))`],[`meter_5_4`,`meter(grouping=meter("5/4"))`],[`meter_4_4_leaning_on_16n`,`meter(swing=16n:.65)`],[`aeolian`,`diatonic(mode=aeolian)`],[`dorian`,`diatonic(mode=dorian)`],[`ionian`,`diatonic(mode=ionian)`],[`mixolydian`,`diatonic(mode=mixolydian)`],[`phrygian`,`diatonic(mode=phrygian)`],[`lydian`,`diatonic(mode=lydian)`],[`locrian`,`diatonic(mode=locrian)`]]),Bo=/^&([A-Za-z_][A-Za-z0-9_]*)(?=\s|$)/,Vo=/&([A-Za-z_][A-Za-z0-9_]*)/g,Ho=/[+*,[]\s*$/;function Uo(e){let t=[],n=null;return e.split(`
`).forEach((e,r)=>{let i=V(e)[0];if(n??={written:[],code:[],line:r+1},n.written.push(e),n.code.push(i),Ho.test(i))return;let a=n.code.join(` `).trim().split(/\s+/).join(` `);a&&t.push(Wo(a,n.written.join(`
`),n.line)),n=null}),t}function Wo(e,t=e,n=0){let r=Un(e);if(r!==void 0)return{name:null,from:r,reads:[],written:t,code:e,line:n};let i=Bo.exec(e),a=i?[...new Set([...e.slice(i[0].length).matchAll(Vo)].map(e=>e[1]))]:[];return{name:i?.[1]??null,reads:a,written:t,code:e,line:n}}let Go=e=>/^\s*(?:\*|&[A-Za-z_][A-Za-z0-9_]*)(?=[\s,=]).*\sfrom(?:\s|$)/m.test(e);function Ko(e){for(let t of Uo(e))if(t.from?.kind===`signature`)return t.from;return null}let qo=e=>e.split(`
`).filter(e=>Un(V(e)[0].trim())?.kind!==`signature`).join(`
`);function Jo(e){let t=2166136261,n=1523705862;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,16777619),n=Math.imul(n^i,16777619)^n>>>15}return(t>>>0).toString(16).padStart(8,`0`)+(n>>>0).toString(16).padStart(8,`0`)}let Yo=e=>`e1:${Jo(Uo(e).map(e=>e.code).join(`
`))}`,Z=e=>JSON.stringify(e),Xo=e=>e.map(Z).join(` → `);function Zo(e,t,n,r){let i=new Set(e.flatMap(e=>e.name?[e.name]:[])),a=new Set(e.flatMap(e=>e.reads)),o=/* @__PURE__ */ new Map,s=e.filter(e=>e.name);return{lines:s,per:t.map(({id:e,names:t,lines:c,resolved:l},u)=>{let d=/* @__PURE__ */ new Map;for(let e of c)e.name&&!d.has(e.name)&&d.set(e.name,e);if(t&&l){let r=[...t].filter(e=>!d.has(e));for(let t of r)n(u,`&${t} is not in ${Z(e)}: it defines ${[...d.keys()].map(e=>`&${e}`).join(`, `)}`)}let f=/* @__PURE__ */ new Set;if(!t)for(let e=!0;e;){e=!1;for(let t of d.keys()){if(i.has(t)||f.has(t)||a.has(t))continue;let n=c.filter(e=>e.name&&e.name!==t&&e.reads.includes(t));n.length&&n.every(e=>i.has(e.name)||f.has(e.name))&&(f.add(t),e=!0)}}let p=t??new Set([...d.keys()].filter(e=>!f.has(e))),m=[...p].filter(e=>d.has(e)&&i.has(e)).map(e=>`&${e}`),h=/* @__PURE__ */ new Set,g=/* @__PURE__ */ new Set,_=[...p].filter(e=>d.has(e)&&!i.has(e));for(let t=_.shift();t!==void 0;t=_.shift())if(!h.has(t)){h.add(t);for(let a of d.get(t).reads)if(!(!d.has(a)||h.has(a)||p.has(a)||g.has(a))){if(!i.has(a))_.push(a);else if(a===`style`)continue;else g.add(a),n(u,`&${a} is ${Z(e)}'s, read by its &${t}, and ${r}'s too: rename ${r}'s, or name &${a} in the use to override it`)}}d.has(`style`)&&n(u,`&${Lt} is the composer's, the section's style: ${Z(e)} defines it, where a fragment only reads it (the score writes &${Lt} style=…; a reader with none plays the centre)`);let v=/* @__PURE__ */ new Set;for(let t of c){if(!t.name||!h.has(t.name)||t.name===`style`)continue;let r=o.get(t.name);if(r){r.id!==e&&r.code===t.code?v.add(`&${t.name}`):r.id!==e&&n(u,`&${t.name} is defined by ${Z(r.id)} and by ${Z(e)}, by different lines: write it in the piece, or drop one use`);continue}o.set(t.name,{id:e,code:t.code}),v.add(`&${t.name}`),s.push(t)}let y=m.filter(e=>[...h].some(t=>d.get(t).reads.includes(e.slice(1))));return{gave:[...v],overrode:m,read:y}})}}let Qo=e=>e.names?new Set(e.names.map(e=>e.slice(1))):null,$o=e=>e.from?.kind===`use`?{id:e.from.id,names:e.from.names,from:e.from}:null,es=(e,t)=>e.replace(/"[^"]*"|&([A-Za-z_][A-Za-z0-9_]*)/g,(e,n)=>n&&t.has(n)?`&${t.get(n)}`:e),ts=e=>e.slice(0,e.indexOf(`=`));function ns(e,t){let n=new Set(t.map(ts)),[r,...i]=Fn(e).map(e=>e.text);return[r,...i.filter(e=>!(Hn(e)&&n.has(ts(e)))),...t].join(` `)}function rs(e,t,n){let r=new Set(Fn(n).flatMap(e=>Hn(e.text)?[ts(e.text)]:[])),i=Fn(t).slice(1).flatMap(e=>Hn(e.text)&&!r.has(ts(e.text))?[e.text]:[]);return[`&${e}`,...i,n].join(` `)}function is(e){let t=e.trim();if(!t.startsWith(`&(`)||!t.endsWith(`)`))return e;let n=0,r=!1;for(let i=1;i<t.length;i++){let a=t[i];if(a===`"`&&(r=!r),!r){if(a===`(`)n++;else if(a===`)`&&--n===0&&i<t.length-1)return e}}return t.slice(2,-1).trim()}let as=/* @__PURE__ */ new Set([`step`,`loop`,`swing`]);function os(e,t,n){if(Fn(e).some(e=>Hn(e.text)))return e;let r=/* @__PURE__ */ new Set,i=!1,a=RegExp(`&${t}(?![A-Za-z0-9_])`);for(let e of n)for(let n of Fn(e.code).slice(1)){if(!a.test(n.text))continue;let e=RegExp(`^([A-Za-z_][A-Za-z0-9_]*)=&${t}(?![A-Za-z0-9_])`).exec(n.text);e?r.add(e[1]):i=!0}let[o]=r;return r.size===1&&!i&&as.has(o)?`${o}=${e}`:e}function ss(e,t){let n=[],r=[!1],i=!1,a=!0;for(let o=0;o<e.length;o++){let s=e[o];if(s===`"`&&(i=!i),i||s===`"`)continue;let c=n.every(e=>e===`lambda`);if(/\s/.test(s)){c&&(r[r.length-1]=!1),a=!0;continue}if(a&&c&&/^[A-Za-z_][A-Za-z0-9_]*=/.test(e.slice(o))&&(r[r.length-1]=!0),a=!1,s===`(`){let t=e[o-1]??``,i=t===`&`?`lambda`:/[A-Za-z0-9_]/.test(t)?`call`:`group`;n.push(i),i===`lambda`&&(r.push(r.at(-1)),a=!0);continue}if(s===`)`){n.pop()===`lambda`&&r.pop();continue}if(s!==`&`)continue;let l=/^&([A-Za-z_][A-Za-z0-9_]*)/.exec(e.slice(o));if(l?.[1]!==t)continue;let u=e[o+l[0].length];if(r.some(Boolean)||n.includes(`call`)||u===`^`||u===`[`)return!0}return!1}function cs(e,t,n,r){if(!e.names||!e.takes||e.takes.every((t,n)=>t===e.names[n]))return null;let i=new Set(t.flatMap(e=>e.name?[e.name]:[])),a=/* @__PURE__ */ new Map,o=/* @__PURE__ */ new Set;return e.names.forEach((t,s)=>{let[c,l]=[t.slice(1),e.takes[s].slice(1)];i.has(l)?c!==l&&(i.has(c)&&!e.takes.includes(`&${c}`)&&r(`&${c}=${l}: ${Z(n)} defines &${c} too, by its own line: take &${l} under another name`),a.set(l,c)):(r(`&${l} is not in ${Z(n)}: it defines ${[...i].map(e=>`&${e}`).join(`, `)}`),o.add(c))}),{names:a,lacking:o}}let ls=e=>e.map(e=>e.shared?e:{...e,shared:!0});function us(e,t,n,r,i,a){let{id:o,from:s}=e,c=Uo(n).flatMap(e=>e.from?.kind===`signature`?[e.from]:[]);if(!c.length){(s.head.length||s.args||s.main!==null)&&i(`${Z(o)} has no signature, so it takes no arguments: a collection gives the cells it defines by name (${e.names?e.names.join(`, `):`*`} from ${s.id})`);let a=ls(fs(t,n,r,i)),c=cs(s,a,o,i);if(!c)return{taken:{id:o,names:Qo(e),lines:a,resolved:!0},copy:[]};let l=new Set(s.names.map(e=>e.slice(1)).filter(e=>!c.lacking.has(e))),u=e=>e.name!==null&&c.names.has(e.name)||e.reads.some(e=>c.names.has(e)),d=a.map(e=>u(e)?Wo(es(e.code,c.names),es(e.written,c.names),e.line):e);return{taken:{id:o,names:l,lines:ls(d),resolved:!0},copy:[]}}return c.length>1&&i(`${Z(o)} has ${c.length} signatures: a fragment has one (&head from (&optional) &main)`),ds(s,o,c[0],t,n,r,i,a)}function ds(e,t,n,r,i,a,o,s){let c=fs(r,i,a,o),l=c.filter(e=>!e.shared&&e.name),u=c.filter(e=>e.shared&&e.name),d=new Set(l.map(e=>e.name)),f=new Set(c.flatMap(e=>e.name?[e.name]:[])),p=e=>e.slice(1),m=n.names.map(p),h=n.optional.map(p),g=n.main?p(n.main):null;for(let e of m)d.has(e)||o(`${Z(t)}'s signature names &${e} its head, and it doesn't define it`);for(let e of h)d.has(e)||o(`${Z(t)}'s &${e} is an optional parameter: its line in the fragment is its default, and it has none`);g&&f.has(g)&&o(`${Z(t)}'s &${g} is its main parameter: it has no line, the argument is it`);let _=/* @__PURE__ */ new Map,v=e.takes?.map(p)??m,y=e.names?.map(p)??m;y.length===1&&m.length===1&&(v[0]===y[0]||v[0]===m[0])?_.set(m[0],y[0]):v.forEach((e,n)=>{m.includes(e)?_.set(e,y[n]):o(`&${e} is not a head of ${Z(t)}: its head${m.length>1?`s are`:` is`} ${m.map(e=>`&${e}`).join(`, `)}`)});let b=_.size===1,x=/* @__PURE__ */ new Set,S=new Map(c.flatMap(e=>e.name?[[e.name,e]]:[]));for(let e=[..._.keys()];e.length;){let t=e.shift();if(!x.has(t)){x.add(t);for(let n of S.get(t)?.reads??[])S.has(n)&&e.push(n)}}e.head.length&&!b&&o(`The attributes before from are the head's, and this line takes ${_.size} heads from ${Z(t)}: write them on each head's own line`);let C=new Map((e.args??[]).map(e=>[e.name,e.value]));for(let e of C.keys())h.includes(e)||o(`${Z(t)} takes no ${e}=: ${h.length?`its optional parameters are ${h.map(e=>`${e}=`).join(`, `)}`:`it has no optional parameters`}`);g&&e.main===null&&o(`${Z(t)} needs its main argument, &${g}, after its id: ${e.names?.[0]??`&${m[0]}`} from ${e.id} …`),!g&&e.main!==null&&o(`${Z(t)} takes no main argument: its signature has none (&${m[0]} from ${n.optional.length?`(${n.optional.join(`, `)})`:``})`);let w=/^&([A-Za-z_][A-Za-z0-9_]*)$/,T=/* @__PURE__ */ new Map;for(let[e,t]of C)h.includes(e)&&T.set(e,is(t));g&&e.main!==null&&T.set(g,is(e.main));let E=/* @__PURE__ */ new Set;for(let[e,t]of T){let n=w.exec(t);n&&(_.set(e,n[1]),E.add(e))}let D=_.get(m[0])??[..._.values()][0]??m[0];for(let e of[..._.values()])s.add(e);for(let e of[...d,...g?[g]:[]]){if(_.has(e))continue;let t=`${D}_${e}`;for(let n=2;s.has(t)||f.has(t);n++)t=`${D}${n}_${e}`;s.add(t),_.set(e,t)}let O=/* @__PURE__ */ new Set([...f,...g?[g]:[]]),k=/* @__PURE__ */ new Set;for(let e of l)for(let n of e.reads)!O.has(n)&&!k.has(n)&&ss(e.code,n)&&(k.add(n),o(`${Z(t)}'s &${e.name} reads &${n}, which it neither defines nor declares: name it in its signature (&${m[0]} from (&${n}) …), or define it`));let A=[];for(let t of l){let n=t.name;if(E.has(n)||!x.has(n))continue;let r=es(t.code,_);T.has(n)&&(r=rs(_.get(n),r,os(T.get(n),n,l))),m.includes(n)&&e.head.length&&b&&(r=ns(r,e.head)),A.push(Wo(r))}g&&e.main!==null&&!E.has(g)&&A.push(Wo(`&${_.get(g)} ${os(T.get(g),g,l)}`));let j=u.filter(e=>x.has(e.name));return{taken:{id:t,names:new Set(j.map(e=>e.name)),lines:j,resolved:!0},copy:A,args:Object.fromEntries(T)}}function fs(e,t,n,r){let i=Uo(t),a=` (in ${Xo(e)})`,o=e=>r(`${e}${a}`),s=new Set(i.flatMap(e=>e.name?[e.name]:[])),c=[],l=i.flatMap(t=>{if(t.from===null)return o(Gn),[];let i=$o(t);if(!i)return[];let{id:a}=i,l=Qo(i),u=[...e,a];if(e.includes(a))r(`use ${Z(a)} is a cycle: ${Xo(u)}`);else if(u.length>8)r(`use ${Z(a)} nests past 8 deep: ${Xo(u)}`);else{let e=n(a);if(e===null)o(`No fragment ${Z(a)} to use`);else{let t=us(i,u,e,n,r,s);return c.push(...t.copy),[t.taken]}}return[{id:a,names:l,lines:[],resolved:!1}]});return Zo([...i,...c],l,(e,t)=>o(t),Z(e.at(-1))).lines}let ps=(e,t)=>`${Z(e)} is renamed ${t}: write from ${t} (#387; Migrate rewrites it)`;function ms(e){let t=Uo(e),n=t.length===1?t[0].from:null;return n?.kind===`use`&&!n.head.length&&!n.args&&n.main===null?n.id:null}function hs(e,{resolve:t,locked:n=[]}={}){let r=Uo(e),i=r.flatMap(e=>{let t=$o(e);return t?[{line:e,...t}]:[]}),a=[],o=e=>{let t=e.written.split(`
`)[0]??``,n=t.search(/\S/);return{line:e.line,col:n+1,len:t.trimEnd().length-n}},s=[],c=[],l=[],u=new Set(r.flatMap(e=>e.name?[e.name]:[])),d=i.map(e=>{let{id:r}=e,i=Qo(e),d=o(e.line),f=e=>a.push({severity:`error`,message:e,span:d}),p=n.find(e=>e.id===r)?.hash,m=t?t(r,...p?[p]:[]):null;if(m===null)return f(t?`No fragment ${Z(r)} to use`:`No library to use ${Z(r)} from: compileSource(text, env, { resolve })`),s.push(null),c.push([]),l.push(void 0),{id:r,names:i,lines:[],resolved:!1};let h=Yo(m);s.push(h),p&&p!==h&&a.push({severity:`warning`,message:`${Z(r)} has changed since this piece was saved: its current version plays`,span:d});let g=zo.get(r);g!==void 0&&t(g)===m&&a.push({severity:`warning`,message:ps(r,g),span:d});let _=ms(m);_!==null&&a.push({severity:`warning`,message:`${Z(r)} only forwards to ${Z(_)}: take from it (Migrate rewrites it)`,span:d});let v=us(e,[r],m,t,f,u);return c.push(v.copy),l.push(v.args),v.taken}),f=Zo([...r,...c.flat()],d,(e,t)=>a.push({severity:`error`,message:t,span:o(i[e].line)}),`the piece`);i.forEach((e,t)=>{let{gave:n,overrode:r,read:s}=f.per[t];if(!d[t].resolved||l[t])return;let c=t=>a.push({severity:`warning`,message:t,span:o(e.line)}),{id:u,names:p}=e,m=i.findIndex(e=>e.id===u&&!l[i.indexOf(e)]);if(!n.length&&m<t)c(`${Z(u)} is used already, on line ${i[m].line.line}: this use adds nothing`);else if(p)for(let e of r.filter(e=>!s.includes(e)))c(`The piece defines ${e}, so taking it from ${Z(u)} adds nothing`);else!n.length&&r.length&&c(`The piece defines all ${Z(u)} gives (${r.join(`, `)}): this use adds nothing`)});let p=e.split(`
`).length,m=new Map([...c.flatMap((e,t)=>e.map(e=>[e,t])),...d.flatMap((e,t)=>e.lines.map(e=>[e,t]))]),h=f.lines.filter(e=>m.has(e)),g=[];for(let e of h)for(let t=e.written.split(`
`).length;t>0;t--)g.push(o(i[m.get(e)].line));return{text:h.length?[e,...h.map(e=>e.written)].join(`
`):e,uses:i.map((e,t)=>{let n=c[t].filter(e=>m.get(e)===t&&e.name).map(e=>`&${e.name}`),r=l[t]?(e.names??[]).filter(e=>n.includes(e)):[];return{id:e.id,names:e.names,span:o(e.line),hash:s[t]??null,gave:l[t]?[.../* @__PURE__ */ new Set([...r,...n,...f.per[t].gave])]:f.per[t].gave,overrode:f.per[t].overrode,...l[t]?{args:l[t]}:{}}}),given:new Set(h.flatMap(e=>e.name&&e.shared?[e.name]:[])),diagnostics:a,through:e=>e>p?g[e-p-1]??null:null}}let gs=(e,t)=>`${e}(${Object.entries(t).map(([e,t])=>`${e}=${t}`).join(`, `)})`;function _s(e,t){let n=Ko(e);if(!n)throw Error(`boundText: a template's arguments, but the text has no signature`);let r=Object.keys(t).map(e=>`&${e}`);for(let e of r)if(!n.optional.includes(e))throw Error(`boundText: ${e} is none of the signature's optional parameters (${n.optional.join(`, `)})`);let i=n.optional.filter(e=>!r.includes(e)),a=`${n.names.join(`, `)} from ${i.length?`(${i.join(`, `)}) `:``}${n.main??``}`.trimEnd(),o=new Set(r.filter(t=>RegExp(`base=${t}(?![A-Za-z0-9_])`).test(e))),s=!1;return e.split(`
`).flatMap(e=>{if(/^\s*(?:&[A-Za-z_]\w*\s*,\s*)*&[A-Za-z_]\w*\s+from(?:\s|$)/.test(e)&&!s&&Ko(e))return s=!0,[a];let n=r.find(t=>RegExp(`^\\s*${t}(?![A-Za-z0-9_])`).test(e));return n?o.has(n)?[`${n} ${t[n.slice(1)]}`]:[]:[Object.entries(t).reduce((e,[t,n])=>o.has(`&${t}`)?e:e.replace(RegExp(`&${t}(?![A-Za-z0-9_])`,`g`),n),e)]}).join(`
`)}function vs(e){if(!e.association.some(e=>e.args))return[e];let t=e.association.filter(e=>!e.args),n=/* @__PURE__ */ new Map;for(let t of e.association){if(!t.args)continue;let r=gs(e.id,t.args),{args:i,...a}=t;n.set(r,{args:t.args,points:[...n.get(r)?.points??[],a]})}return[...t.length?[{...e,association:t}]:[],...[...n].map(([t,{args:n,points:r}])=>({id:t,text:_s(e.text,n),association:r}))]}function ys(e,t){return e.association.find(n=>n.args&&gs(e.id,n.args)===t)?.args}let bs=(e,t)=>t===void 0?!e.args:!!e.args&&JSON.stringify(Object.entries(e.args))===JSON.stringify(Object.entries(t));function xs(e,t){let n=[...e.diagnostics],r=(e,t)=>n.push({severity:`error`,message:e,span:t}),i=(e,t)=>n.push({severity:`warning`,message:e,span:t}),a=(e,t)=>n.push({severity:`info`,message:e,span:t}),o=new Set(e.broken),s=/* @__PURE__ */ new Map,c=(e,t)=>{o.has(e)||(r(`Unknown cell &${e}`,t),s.set(e,[...s.get(e)??[],t]))},l=/* @__PURE__ */ new Set;return{parsed:e,env:t,diagnostics:n,error:r,warn:i,info:a,broken:o,unknown:s,unknownCell:c,rateOf:e=>{if(!e)return null;if(e.kind===`rate`)return e.perSecond;if(e.kind===`env`){let n=t[e.name]??yi(e.name,t.A4??440)??void 0;return typeof n==`number`&&n>0?n:(l.has(e)||r(`Unknown environment value ${e.name} (known: ${Object.keys(t).join(`, `)}, and note names like C4, F#3, Bb2)`,e.span),l.add(e),null)}return null}}}let Ss=e=>e&&!e.gate&&e.map?.kind!==`sample`&&e.map?.kind!==`midi`&&e.braid.kind===`list`&&e.braid.tokens.length===1&&e.braid.tokens[0].atom.kind===`mix`?e.braid.tokens[0].atom.exprs:null;function Cs(e,t){if(e.k===`num`)return{constant:t*e.value};if(e.k===`ref`)return e.ref.pick||e.level!==void 0?null:{term:{cell:e.ref.name,weight:t}};if(e.k===`prod`){let n=e.factors.filter(e=>e.k===`ref`);if(n.length!==1||n[0].k!==`ref`||n[0].ref.pick||!e.factors.every(e=>e.k===`ref`||e.k===`num`))return null;let r=e.factors.reduce((e,t)=>t.k===`num`?e*t.value:e,t);return{term:{cell:n[0].ref.name,weight:r}}}return null}let ws=e=>e.kind===`note`||e.kind===`rest`||e.kind===`choice`||e.kind===`seq`&&e.layers.every(e=>e.every(e=>ws(e.atom)));function Ts(e,t,n=/* @__PURE__ */ new Set){let r=t.get(e);return!r||r.gate||r.over||Object.keys(r.params).some(e=>X.has(e))?!1:Ss(r)?Es(e,t,n)!==null:r.map&&r.map.kind!==`lin`&&r.map.kind!==`amp`&&r.map.kind!==`db`?!1:r.braid.kind===`list`&&r.braid.tokens.length>0&&r.braid.tokens.every(e=>ws(e.atom))}function Es(e,t,n=/* @__PURE__ */ new Set){let r=Ss(t.get(e));if(!r||r.length!==1||n.has(e))return null;let i=r[0],a=i.k===`sum`?i.items:[{e:i,sign:1}],o=[],s=0;for(let e of a){let t=Cs(e.e,e.sign);if(!t)return null;`term`in t?o.push(t.term):s+=t.constant}if(!o.length||o.length===1&&o[0].weight===1&&s===0)return null;let c=/* @__PURE__ */ new Set([...n,e]);return o.every(e=>Ts(e.cell,t,c))?{terms:o,constant:s}:null}let Ds={line:1,col:1,len:1},Os=e=>e.over===null&&(e.braid.kind===`blank`&&(e.name===`fifths12TET`||e.map?.kind===`edo`)||e.map?.kind===`ratios`),ks=e=>Os(e)?null:e.over?.name??`fifths12TET`,As=e=>e.map?.kind===`ratios`&&e.braid.kind===`list`?Math.max(1,e.braid.tokens.length-1):(e.map?.kind===`edo`?e.map.steps:null)??e.cycle??12,js=(e,t,n=0)=>{let r=e.get(t);if(!r||n>64)return 12;if(ks(r)===null)return As(r);let i=r.braid;return i.kind===`scan`?i.steps.length:i.kind===`wave`?i.n:i.kind===`list`?i.tokens.reduce((e,t)=>e+z(t.atom).reduce((e,t)=>e+(t.kind===`note`?1:t.kind===`chord`?t.notes.length:0),0),0):js(e,ks(r),n+1)},Ms=(e,t)=>{let n=e=>({atom:e,repeat:1,subdivide:1,elongate:1}),r=e=>n({kind:`note`,value:e,alter:0}),i=t.braid,a=ks(t);return a===null?Array.from({length:As(t)},(e,t)=>r(t)):i.kind===`list`?i.tokens.map(({atom:e,repeat:t,subdivide:n,elongate:r,chance:i,level:a})=>({atom:e,repeat:t,subdivide:n,elongate:r,...i===void 0?{}:{chance:i},...a===void 0?{}:{level:a}})):i.kind===`scan`?Er(i.steps).positions.map(r):i.kind===`wave`?ba(i.shape,i.n).map(r):Array.from({length:js(e,a)},(e,t)=>r(t))};function Ns(e){let{parsed:t,error:n,unknownCell:r}=e,i=/* @__PURE__ */ new Map,a=/* @__PURE__ */ new Set;for(let e of t.cells)i.has(e.name)?n(`&${e.name} is already defined on line ${i.get(e.name).span.line}`,e.span):i.set(e.name,e);let o=Bs(e,i);Ps(e,i),Fs(e,i),Ls(e,i),Rs(e,i),zs(e,i);let s=Js(i,n),c=Us(i,a,n,e.warn);qs(e,i);let l=!i.has(ci);for(let e of i.keys())(e.startsWith(`key:`)||e.startsWith(`scale:`))&&a.add(e);let u=Hs(i);if(u){i.set(Vs,{name:Vs,span:u.voices[0].span,over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:{kind:`list`,tokens:u.voices.map(e=>({atom:{kind:`ref`,name:e.name,pick:null,shift:0},repeat:1,subdivide:1,elongate:1,span:e.span}))}});for(let[e,t]of u.cells)i.set(e,{...i.get(e),over:{name:Vs,pick:null,shift:0,span:i.get(e).span},braid:{kind:`list`,tokens:t}});a.add(Vs)}l&&i.set(ci,{name:ci,span:Ds,over:null,shift:null,off:!1,step:null,map:{kind:`edo`,period:2,steps:null,span:Ds},stride:null,cycle:12,params:{},paramSpans:{},braid:{kind:`blank`}});let d=i.get(ci);Os(d)||n(`&${ci} is the default grid: give it only cycle= and shift=`,d.span);let f=/* @__PURE__ */ new Map,p=(e,t)=>{if(f.has(e))return f.get(e);let a=i.get(e),o=ks(a),s=!0;return o!==null&&(i.has(o)?t.includes(o)?(n(`over= loops: ${[...t.slice(t.indexOf(o)),e,o].map(e=>`&`+e).join(` → `)}`,a.over?.span??a.span),s=!1):s=p(o,[...t,e]):(r(o,a.over.span),s=!1)),f.set(e,s),s};for(let e of i.keys())p(e,[]);return{decls:i,implicit:a,implicitRoot:l,overOk:f,sections:s,stacks:c,...o?{mainKey:o}:{}}}function Ps(e,t){for(let[n,r]of t){if(!r.tonic)continue;let i=t.get(r.tonic.name);if(!i){e.unknownCell(r.tonic.name,r.tonic.span);continue}let a=i.braid.kind===`list`?i.braid.tokens:[],o=a.every(e=>e.subdivide===1&&e.atom.kind===`note`&&Number.isInteger(e.atom.value))?a:[],s=o[0]?.atom;if(s?.kind!==`note`||!i.step&&(o.length!==1||o[0].repeat!==1)){e.error(i.step?`&${i.name} holds a key's tonic (scale(…, &${i.name})), stepped: write a note a step, a name or a pitch class (&${i.name} step=1m/8 D F)`:`&${i.name} holds a key's tonic (scale(…, &${i.name})): write one note, a name or a pitch class (&${i.name} D, &${i.name} 2), or step it (&${i.name} step=1m/8 D F)`,i.span);continue}t.set(n,{...r,shift:hr(s.value+s.alter,12)})}}function Fs(e,t){for(let[n,r]of t){if(r.braid.kind!==`scan`||!r.braid.mode)continue;let i=t.get(r.braid.mode.name);if(!i){e.unknownCell(r.braid.mode.name,r.braid.mode.span);continue}let a=i.step?null:Is(i);if(a){t.set(n,{...r,braid:{...r.braid,steps:a}});continue}let o=i.braid.kind===`list`?i.braid.tokens:[],s=o.length===1&&o[0].repeat===1&&o[0].subdivide===1?o[0].atom:null,c=s?.kind===`note`&&!s.pitched&&s.alter===0?s.value:null;if(i.step||c===null||!Number.isInteger(c)||c<0||c>6){e.error(i.step?`&${i.name} holds a scale's mode (scale(&${i.name}, …)): a stepped mode is not yet a form; write one (&${i.name} dorian)`:`&${i.name} holds a scale's mode (scale(&${i.name}, …)): write one, a name, its phase from the darkest or its table (&${i.name} major, &${i.name} 3, &${i.name} 0 2 3 5 7 8 10)`,i.span);continue}t.set(n,{...r,braid:{...r.braid,steps:br(c)}})}}function Is(e){if(e.braid.kind===`scan`&&!e.braid.mode)return e.braid.steps.every(e=>e>0)&&e.braid.steps.reduce((e,t)=>e+t,0)===12?[...e.braid.steps]:null;if(e.braid.kind!==`list`||e.braid.tokens.length<2)return null;let t=[];for(let n of e.braid.tokens){let e=n.atom;if(e.kind!==`note`||e.pitched||n.repeat!==1||n.subdivide!==1||n.elongate!==1)return null;t.push(e.value+e.alter)}return t[0]!==0||t.some((e,n)=>!Number.isInteger(e)||e>=12||n>0&&e<=t[n-1])?null:t.map((e,n)=>(t[n+1]??12)-e)}function Ls(e,t){for(let[n,r]of t){let i=r.paramCells?.swing;if(!i)continue;let[a]=i.factors,o=a&&t.get(a.name),{swing:s,...c}=r.paramCells,l=()=>t.set(n,{...r,paramCells:c});if(i.factors.length!==1||i.range||a.pick||a.shift){e.error(`swing= reads one cell, a swing alone: swing=&swing, with &swing swing=8n:2/3`,i.span),l();continue}if(!o){e.unknownCell(a.name,a.span),l();continue}if(o.braid.kind!==`blank`||o.step||o.over||o.map||typeof o.params.swing!=`number`||!Object.keys(o.params).every(e=>e===`swing`||e===`label`)){e.error(`&${o.name} holds a meter's swing (swing=&${o.name}): write a swing alone, &${o.name} swing=8n:2/3`,o.span),l();continue}t.set(n,{...r,params:{...r.params,swing:o.params.swing},paramSpans:{...r.paramSpans,swing:i.span},paramCells:c,...o.swing?{swing:o.swing}:{},...o.swingMoves?{swingMoves:o.swingMoves}:{},swingFrom:a})}}function Rs(e,t){for(let[n,r]of t){let i=r.swingMoves;if(!i)continue;for(let n of i.factors)t.has(n.name)||e.unknownCell(n.name,n.span);if(i.range){i.range.every(e=>e>=0&&e<=1)||e.error(`swing=${i.level}:${i.range[0]}..${i.range[1]}: a share's range lies within 0..1 — swing=${i.level}:.5...75 * &k`,i.span);continue}let a=t.get(i.factors[0].name),o=a?.braid.kind===`list`?a.braid.tokens.flatMap(e=>z(e.atom)).flatMap(e=>e.kind===`note`?[e.value+e.alter]:e.kind===`chord`?e.notes:[]):[],s=o.find(e=>!(e>=0&&e<=1));s!==void 0&&e.error(`swing=${i.level}:&${a.name}: a share is 0 to 1, and &${a.name} holds ${s}`,i.span);let c=o[0];c!==void 0&&s===void 0&&t.set(n,{...r,params:{...r.params,swing:c},swing:(r.swing??[]).map(e=>e.level===i.level?{...e,share:c}:e)})}}function zs(e,t){for(let[n,r]of t){let i=r.bend?.depthMoves;if(!i)continue;for(let n of i.factors)t.has(n.name)||e.unknownCell(n.name,n.span);if(i.range)continue;let a=t.get(i.factors[0].name),o=a?.braid.kind===`list`?a.braid.tokens.flatMap(e=>z(e.atom)).find(e=>e.kind===`note`):void 0;o?.kind===`note`&&t.set(n,{...r,bend:{...r.bend,depth:o.value+o.alter}})}}function Bs(e,t){let n=[...t.values()].find(e=>!e.lambda&&!e.base&&e.over?.name.startsWith(`key:λ`))?.name??null;for(let r of[...t.values()])r.over?.name===`key:main`&&(n?(e.warn(`over=key is the old way: name the key, over=&${n} (Migrate rewrites it)`,r.over.span),t.set(r.name,{...r,over:{...r.over,name:n}})):(e.error(`over=key is the old way, and the piece has no main key (the first scale(…) in the text) for it to read: name a key, over=&key, and write it (&key scale(major, C))`,r.over.span),e.broken.add(li)));return n}let Vs=`kit:voices`;function Hs(e){let t=e=>Object.keys(e?.params??{}).some(e=>X.has(e)),n=n=>t(e.get(n)),r=e=>!e.pick&&!e.shift&&!e.transpose&&!e.degree&&!e.values,i=new Set([...e.values()].flatMap(e=>e.over?[e.over.name]:[])),a=(e,i)=>{if(!e||e.over||e.map||t(e)||e.braid.kind!==`list`||e.braid.tokens.length===0||i.length>256||i.includes(e.name))return!1;let a=!1;for(let t of e.braid.tokens.flatMap(e=>z(e.atom)))if(t.kind!==`rest`){if(t.kind===`ref`&&n(t.name)&&r(t))a=!0;else if(t.kind===`ref`&&!t.shift&&!t.transpose&&!t.values&&s(t.name,[...i,e.name]))a=!0;else if(t.kind===`mix`&&t.exprs.every(e=>e.k===`ref`&&n(e.ref.name)&&r(e.ref)))a=!0;else return!1}return a},o=/* @__PURE__ */ new Map,s=(t,n)=>{if(o.has(t))return o.get(t);let r=e.get(t),s=r?.braid.kind===`list`&&r.braid.tokens.length===1&&r.braid.tokens[0].atom.kind===`mix`,c=!!r&&!r.step&&!s&&!i.has(t)&&a(r,n);return(n.length===0||c)&&o.set(t,c),c},c=[...e.values()].filter(e=>e.step&&a(e,[]));if(!c.length)return null;let l=[],u=(e,t)=>{let n=l.findIndex(t=>t.name===e);return n>=0?n:l.push({name:e,pick:null,shift:0,span:t})-1},d=/* @__PURE__ */ new Map,f=t=>{if(d.has(t.name)||t.braid.kind!==`list`)return;d.set(t.name,[]);let r=t=>{let i=t.atom,a=i;if(i.kind===`ref`&&n(i.name))a={kind:`note`,value:u(i.name,t.span),alter:0};else if(i.kind===`ref`)f(e.get(i.name));else if(i.kind===`mix`){let e=i.exprs,n=e.map(e=>u(e.ref.name,t.span)),r=e.some(e=>e.level!==void 0)?e.map(e=>e.level??1):void 0;a={kind:`chord`,notes:n,alters:n.map(()=>0),...r?{levels:r}:{}}}else i.kind===`seq`&&(a={...i,layers:i.layers.map(e=>e.map(r))});return{...t,atom:a}},i=t.braid.tokens.map(r);d.set(t.name,i)};for(let t of[...e.values()])c.includes(t)&&f(t);return{voices:l,cells:d}}function Us(e,t,n,r){let i=/* @__PURE__ */ new Set,a=(e,t)=>({k:`ref`,ref:{name:e,pick:null,shift:0,span:t}}),o=Hs(e);for(let s of[...e.values()]){let c=s.params,l=s.braid.kind===`list`?s.braid.tokens:[],u=typeof c.trigger==`string`,d=u?c.trigger:typeof c.play==`string`&&l.length?c.play:null;if(d===null)continue;let f=u?`trigger`:`play`,p=s.paramSpans[f]??s.span,m=u?void 0:s.playMove;u&&r(`&${s.name} is a gate written the old way: play= for trigger=, one level= for velocity=, gate= and gain=, the voices it plays all of as a chord (Migrate rewrites it, decision 023)`,p);let h=e=>e.kind===`ref`&&!e.pick&&!e.shift&&!e.transpose&&!e.values,g=l.length===1&&l[0].atom.kind===`mix`&&l[0].atom.exprs.every(e=>e.k===`ref`&&!e.ref.pick)?l[0].atom.exprs:null,_=l.every(e=>h(e.atom)&&e.repeat===1&&e.subdivide===1&&e.elongate===1);if(!g&&!_){n(`&${s.name} is a gate (${f}=): its braid is what it plays: a voice, a kit, a chord of voices [&lead, &bell], or voices to pick from (&${s.name} ${f}=&${d} &lead)`,s.span);continue}let v=g?g.flatMap(e=>e.k===`ref`?[{name:e.ref.name,span:e.ref.span}]:[]):l.flatMap(e=>e.atom.kind===`ref`?[{name:e.atom.name,span:e.span}]:[]),y=v;if(!g&&!u&&v.length>1){let n=`${s.name}:kit`;e.set(n,{name:n,span:s.span,over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:s.braid}),t.add(n),y=[{name:n,span:s.span}]}let b=u?[`velocity`,`gate`].flatMap(e=>typeof c[e]==`string`?[{name:c[e],port:e,span:s.paramSpans[e]??s.span}]:[]):(s.paramCells?.level?.factors??[]).map(e=>({name:e.name,port:`level`,span:e.span})),x=u?c.gain:c.level,S=typeof x==`number`?x:1,C=s.paramSpans[u?`gain`:`level`]??s.span,w=(r,i)=>{let a=e.get(r);if(!m||!a)return r;let o=`${r}${hn({pick:null,shift:0,...m})}`,c={name:o,span:s.span,over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:{kind:`blank`}},l={kind:`ref`,name:r,pick:null,shift:0,...m.transpose?{transpose:m.transpose}:{},...m.degree?{values:{mul:1,add:m.degree}}:{}};return e.has(o)||e.set(o,{...fn(c,a,{name:r,pick:null,shift:0,span:i},e=>n(e,i)),shift:null,laps:a.laps??null,braid:{kind:`list`,tokens:[{atom:l,repeat:1,subdivide:1,elongate:1,span:i}]}}),t.add(o),o},T=Ws(e,e.get(d),n);T&&i.add(d);let E=(T??[{line:{name:d,pick:null,shift:0,span:p},by:[]}]).map(({line:e,by:t})=>({line:e.name,plays:w(e.name,e.span),ref:e,by:t,span:e.span})),D=t=>o?.cells.has(t)?Ks(e,t):null,O=E.flatMap(t=>{let r=e.get(t.line),i=D(t.line);return y.map(o=>{let s=Gs(e.get(o.name)),c=i&&s?i.filter(e=>!s.includes(e)):[];return c.length&&n(`&${t.line} plays ${c.map(e=>`&`+e).join(`, `)}, which &${o.name} doesn't hold: a kit's lines play its own voices`,t.span),{k:`prod`,span:o.span,factors:[{k:`ref`,ref:{...t.ref,name:t.plays}},...t.by,...b.map(e=>a(e.name,e.span)),...r?.over?.name===o.name||i&&s?[]:[a(o.name,o.span)],...S===1?[]:[{k:`num`,value:S,span:C}]]}})}),k=Object.fromEntries(Object.entries(c).filter(([e])=>![`play`,`trigger`,`velocity`,`gate`,`gain`,`level`].includes(e))),A=Object.fromEntries(Object.entries(s.paramCells??{}).filter(([e])=>e!==`level`));e.set(s.name,{...s,params:k,paramCells:A,gate:{notes:d,...m?{move:m}:{},plays:E[0].plays,...T?{lines:E.map(({line:e,plays:t})=>({line:e,plays:t}))}:{},port:f,levels:b.map(({name:e,port:t})=>({name:e,port:t})),gain:S,receivers:v.map(e=>e.name)},braid:{kind:`list`,tokens:[{atom:{kind:`mix`,exprs:O,gate:s.name},repeat:1,subdivide:1,elongate:1,span:s.span}]}})}let s=new Map([...e.values()].flatMap(e=>e.gate?.lines?[[e.gate.notes,e.name]]:[])),c=e=>e.k===`ref`?[e.ref]:e.k===`sum`?e.items.flatMap(e=>c(e.e)):e.k===`prod`?e.factors.flatMap(c):[];for(let t of e.values())if(!(t.gate||t.braid.kind!==`list`))for(let e of t.braid.tokens.flatMap(e=>z(e.atom))){let r=e.kind===`ref`?[{name:e.name,span:t.span}]:e.kind===`mix`?e.exprs.flatMap(c):[];for(let e of r)s.has(e.name)&&n(`&${e.name} is the part &${s.get(e.name)} plays, a stack of lines and no sound: mix or send &${s.get(e.name)}`,e.span)}return i}function Ws(e,t,n){if(!t||t.map||t.gate||Object.keys(t.params).length||t.braid.kind!==`list`||t.braid.tokens.length!==1)return null;let r=t.braid.tokens[0].atom;if(r.kind!==`mix`||r.gate||!r.exprs.length)return null;let i=r.exprs.map(e=>e.k===`ref`?`level`in e&&e.level!==void 0?null:{line:e.ref,by:[]}:e.k!==`prod`||e.factors[0]?.k!==`ref`||!e.factors.slice(1).every(e=>e.k===`num`||e.k===`ref`&&!e.ref.pick&&!e.ref.shift)?null:{line:e.factors[0].ref,by:e.factors.slice(1)});if(!i.every(e=>e!==null))return null;let a=t=>{let n=e.get(t);return!!n&&(!!n.gate||Object.keys(n.params).some(e=>X.has(e))||n.braid.kind===`list`&&n.braid.tokens.length===1&&n.braid.tokens[0].atom.kind===`mix`)};return i.map(e=>({line:e.line,by:e.by.filter(e=>e.k!==`ref`||!a(e.ref.name)||(n(`&${t.name} is a stack of lines, each times its levels: &${e.ref.name} is a sound, not a level (a cell with map=amp, map=db or map=lin, or a number)`,e.ref.span),!1))}))}function Gs(e){if(!e||e.map||e.gate||e.braid.kind!==`list`||!e.braid.tokens.length)return null;let t=e.braid.tokens.flatMap(e=>e.atom.kind===`ref`?[e.atom.name]:[]);return t.length===e.braid.tokens.length?t:null}function Ks(e,t,n=[]){let r=e.get(t);if(!r||n.includes(t)||r.braid.kind!==`list`)return[];let i=t=>Object.keys(e.get(t)?.params??{}).some(e=>X.has(e)),a=/* @__PURE__ */ new Set;for(let o of r.braid.tokens.flatMap(e=>z(e.atom))){let r=o.kind===`ref`?[o.name]:o.kind===`mix`?o.exprs.flatMap(e=>e.k===`ref`?[e.ref.name]:[]):[];for(let o of r)for(let r of i(o)?[o]:Ks(e,o,[...n,t]))a.add(r)}return[...a]}function qs(e,t){let n=e=>!!e&&!e.gate&&e.map?.kind!==`sample`&&e.map?.kind!==`midi`&&e.braid.kind===`list`&&e.braid.tokens.length===1&&e.braid.tokens[0].atom.kind===`mix`&&Es(e.name,t)===null;for(let r of t.values()){let i=r.over?t.get(r.over.name):void 0;i&&i.braid.kind===`list`&&i.braid.tokens.length&&i.braid.tokens.every(e=>e.atom.kind===`ref`&&n(t.get(e.atom.name)))&&(e.error(`A selector switches sections (decision 016): &${r.name} over=&${i.name} reads mixes. Write &${i.name} step=4n with a section per part (&${i.name} step=4n &keysBar &drumBar), step each part's cells by its section (step=&keysBar), and play the parts straight into the sound card`,r.over.span),e.broken.add(r.name))}}function Js(e,t){let n=/* @__PURE__ */ new Map,r=new Set([...e.values()].flatMap(e=>e.step?.kind===`driven`?[e.step.driver.name]:[])),i=e=>!!e&&!e.step&&!e.over&&!e.map&&(e.braid.kind===`blank`||e.braid.kind===`list`&&!e.braid.tokens.length);for(let a of[...e.values()]){if(!a.step||a.over||a.map||a.braid.kind!==`list`||!a.braid.tokens.length)continue;let o=[];for(let s of a.braid.tokens){let c=s.atom;if(c.kind!==`ref`||c.pick||c.shift||c.transpose||c.values||s.repeat!==1||s.subdivide!==1||s.elongate!==1)break;let l=e.get(c.name);if(l&&!i(l)&&(!l.step||n.has(c.name))){let n=a.braid.tokens.map(e=>e.atom.kind===`ref`?e.atom.name:``).filter(e=>e!==c.name);if(l.step||!n.some(t=>t&&!e.has(t)&&r.has(t)))break;t(`&${c.name} is a section of &${a.name}, so its line can carry attributes only (off, label=, tags=, show=, size=, shift=, restart=), not steps or a table of its own`,l.span),e.set(c.name,{...l,over:null,map:null,braid:{kind:`blank`}})}o.push(c.name)}if(o.length===a.braid.tokens.length&&!o.every(t=>e.has(t)&&!i(e.get(t)))&&o.some(e=>r.has(e))){for(let[t,r]of o.entries()){n.set(r,a.name);let o=e.get(r);if(o&&!i(o))continue;let s=a.braid.tokens[t].span,c={kind:`list`,tokens:[{atom:{kind:`note`,value:0,alter:0},repeat:1,subdivide:1,elongate:1,span:s}]};e.set(r,o?{...o,step:a.step,braid:c}:{name:r,span:s,over:null,shift:null,off:!1,step:a.step,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:c})}e.set(a.name,{...a,step:null})}}return n}let Ys=(e,t,n)=>e.k===`ref`?n.includes(t(e.ref.name)):e.k===`num`?!1:e.k===`prod`?e.factors.some(e=>Ys(e,t,n)):e.items.some(e=>Ys(e.e,t,n));var Xs=class extends Error{span;constructor(e,t){super(e),this.span=t}};let Zs=e=>e.k===`ref`?e.ref.span:e.span,Qs={k:`act`,terms:[],plain:[],offset:0,gain:1},$s=e=>({ref:e,sign:1,inSum:!1}),ec=(e,t)=>e(t.ref.name)===`volume`||e(t.ref.name)===`plain`&&!t.inSum;function tc(e,t,n){let r=nc(e,t);if(r.k===`signal`)return[...r.bindings];if(r.k===`num`)throw new Xs(`A number is a gain or a pitch: it needs a voice (&theme * &lead * 0.8)`,Zs(e));let i=[...r.terms.map(e=>e.ref.name),...r.plain.map(e=>e.name)],a=n?.(i);throw new Xs(`${i.map(e=>`&`+e).join(` * `)} has no voice: a product needs one sound (a voice, a mix, a pattern read through a kit) — &theme * &lead${a?`. ${a}`:``}`,Zs(e))}function nc(e,t,n=`auto`){if(e.k===`num`)return{k:`num`,value:e.value};if(e.k===`ref`){if(e.level!==void 0)throw new Xs(`&${e.ref.name}:0:${+e.level.toFixed(3)} is a hit's gain, in a groove: in a mix, a gain is a number (&${e.ref.name} * ${+e.level.toFixed(3)})`,e.ref.span);let r=t(e.ref.name);return r===`signal`||r===`wave`&&n===`auto`?{k:`signal`,bindings:[{voice:e.ref,pitches:[],offset:0,gain:1}]}:r===`plain`?{...Qs,plain:[e.ref]}:{...Qs,terms:[{ref:e.ref,sign:1,inSum:!1}]}}if(e.k===`prod`){let r=n===`pitch`||Ys(e,t,[`signal`])?`pitch`:`auto`;return e.factors.map(e=>nc(e,t,r)).reduce((t,n,r)=>rc(t,n,Zs(e.factors[r])))}return ic(e,t,n)}function rc(e,t,n){if(e.k===`num`&&t.k===`num`)return{k:`num`,value:e.value*t.value};if(e.k===`signal`&&t.k===`signal`)throw new Xs(`Two sounds can't multiply (&${e.bindings[0].voice.name} * &${t.bindings[0].voice.name}): mix them with + or ,`,n);if(e.k===`signal`||t.k===`signal`){let[n,r,i]=e.k===`signal`?[e,t,!1]:[t,e,!0],a=r.k===`num`?{...Qs,gain:r.value}:r,o=[...a.terms,...a.plain.map($s)];return{k:`signal`,bindings:n.bindings.map(e=>({...e,pitches:i?[...o,...e.pitches]:[...e.pitches,...o],offset:e.offset+a.offset,gain:e.gain*a.gain}))}}let r=e.k===`num`?{...Qs,gain:e.value}:e,i=t.k===`num`?{...Qs,gain:t.value}:t;return{k:`act`,terms:[...r.terms,...r.plain.map($s),...i.terms,...i.plain.map($s)],plain:[],offset:r.offset+i.offset,gain:r.gain*i.gain}}function ic(e,t,n){let r=n===`pitch`||!Ys(e,t,[`signal`])&&Ys(e,t,[`pitch`,`plain`])?`pitch`:`auto`,i=e.items.map(e=>({t:nc(e.e,t,r),sign:e.sign,span:Zs(e.e)}));if(i.every(e=>e.t.k===`num`))return{k:`num`,value:i.reduce((e,t)=>e+t.sign*t.t.value,0)};if(i.some(e=>e.t.k===`signal`)){let e=[];for(let t of i){if(t.t.k===`num`)throw new Xs(`A number is a gain or a pitch: it needs a voice (&theme * &lead * 0.8)`,t.span);if(t.t.k===`act`)throw new Xs(`A pitch or a volume can't be added to a sound: it acts on one (&theme * &lead)`,t.span);if(t.sign<0)throw new Xs(`Sounds mix with +; there's no subtracting a voice`,t.span);e.push(...t.t.bindings)}return{k:`signal`,bindings:e}}let a=[],o=0;for(let{t:e,sign:n,span:r}of i){if(e.k===`num`){o+=n*e.value;continue}let i=e;if(i.gain!==1)throw new Xs(`A gain inside a pitch sum: gains multiply the sound — (&theme + 12) * &lead * 0.8`,r);for(let e of i.terms){if(e.inSum===!1&&!ac(e,t))throw new Xs(`&${e.ref.name} is a volume: it multiplies, it can't be added — &theme * &${e.ref.name} * &lead`,e.ref.span);a.push({...e,sign:e.sign*n,inSum:!0})}for(let e of i.plain)a.push({ref:e,sign:n,inSum:!0});o+=n*i.offset}return{k:`act`,terms:a,plain:[],offset:o,gain:1}}let ac=(e,t)=>!ec(t,e),oc=e=>`&${e} is a role: it names the gates that play it, and is no sound to mix, send or play (name its gates here)`;function sc(e,t,n){let{error:r}=e,i=/* @__PURE__ */ new Map;for(let e of t.values()){if(e.map?.kind!==`role`)continue;let n=e.braid.kind===`list`?e.braid.tokens:[];n.length===0&&r(`&${e.name} is a role: name the gates that play it (&${e.name} map=role &player)`,e.span);for(let a of n){let n=a.atom;if(n.kind!==`ref`){r(`a role's entries are the gates that play it, as written (&${e.name} map=role &player &player2)`,a.span);continue}let o=t.get(n.name);if(!o)continue;if(!o.gate||n.pick||n.shift||n.transpose!==void 0||n.values||a.repeat!==1||a.elongate!==1||a.subdivide!==1){r(`&${n.name}: a role's entries are gates, as written (&player play=&part &voice), and &${n.name} is not one`,a.span);continue}let s=i.get(n.name);s===void 0?i.set(n.name,e.name):s!==e.name&&r(`&${n.name} plays two roles, &${s} and &${e.name}: a gate plays one`,a.span)}}return[...t.values()].flatMap(e=>{if(!e.gate||n.has(e.name))return[];let t=i.get(e.name);return[{name:e.name,...t===void 0?{}:{role:t},part:e.gate.notes,...e.gate.move?{move:e.gate.move}:{},voices:e.gate.receivers}]})}let cc=(e,t)=>{let n=e.get(t);return!!n&&(!!n.gate||n.map?.kind===`role`)};function lc(e,t){let n=/* @__PURE__ */ new Map,r=new Set([...t.values()].flatMap(e=>e.over?[e.over.name]:[]));for(let i of r){let r=t.get(i);if(!r||r.map||r.braid.kind!==`list`||!r.braid.tokens.length)continue;let a=r.braid.tokens,o=e=>e.atom.kind===`ref`&&!e.atom.pick&&!e.atom.shift&&e.atom.transpose===void 0&&!e.atom.values&&e.repeat===1&&e.subdivide===1&&e.elongate===1;if(!a.every(e=>o(e)&&e.atom.kind===`ref`&&cc(t,e.atom.name)))continue;let s=a.map(e=>e.atom.kind===`ref`?e.atom.name:``);r.step&&e.warn(`&${i} is a band, a table of performers: it needs no step=, the selector reading it steps (their parts keep their time)`,r.step.span);let c=/* @__PURE__ */ new Map;for(let[n,r]of s.entries()){let o=t.get(r),s=o.gate?[r]:o.braid.kind===`list`?o.braid.tokens.flatMap(e=>e.atom.kind===`ref`&&t.get(e.atom.name)?.gate?[e.atom.name]:[]):[];for(let t of new Set(s)){let o=c.get(t);o!==void 0&&o!==r?e.error(`&${t} is in &${i} twice, as &${o} and as &${r}: a performer is one entry of a band`,a[n].span):c.set(t,r)}}n.set(i,s)}return n}function uc(e,t,n){if(!n.size)return[...e];let r=e=>[...t.values()].filter(t=>t.over===e&&t.clock).map(e=>e.name);return e.map(e=>{let i=[...e.through,...e.via].find(e=>t.get(e)?.gate);if(!i)return e;let a=[],o=[];for(let[e,s]of n){let n=s.findIndex(e=>e===i||t.get(e)?.map?.kind===`role`&&t.get(e).units.some(e=>e.atom.kind===`ref`&&e.atom.name===i));if(!(n<0)){for(let t of r(e))a.push({cell:t,entry:n,part:s[n],performer:!0});o.push(...r(e),e,s[n])}}return a.length?{...e,via:[.../* @__PURE__ */ new Set([...e.via,...o])],select:[...e.select,...a]}:e})}function dc(e,t,n,r){for(let[i,a]of r)for(let r of n.values()){if(r.over!==i||!r.clock)continue;let o=e=>n.get(e)?.params.restart??r.params.restart,s=a.find(e=>o(e)===`restart`||o(e)===`resume`),c=r.step?.tap===`1m`&&r.step.chain.every(e=>e.op===`÷`&&Number.isInteger(e.n)||e.n===1);s&&!c&&e.warn(`&${r.name} switches &${s} with restart=${o(s)} off the bar: its part starts where the switch falls, not on a bar line, so its notes move in the bar. Switch on whole bars (step=1m), or let it run on (restart=free, a performer's default)`,t.get(r.name).span)}}let fc=e=>!!e&&e.map?.kind!==`sample`&&e.map?.kind!==`midi`&&e.braid.kind===`list`&&e.braid.tokens.length===1&&e.braid.tokens[0].atom.kind===`mix`,pc=(e,{decls:t})=>!!e&&!Object.keys(e.params).some(e=>X.has(e))&&e.braid.kind===`list`&&e.braid.tokens.length>0&&e.braid.tokens.every(e=>e.atom.kind===`ref`&&Qr(t.get(e.atom.name)?.params??{})),mc=(e,{rateOf:t})=>{if(!e.step||e.step.kind===`driven`||e.step.kind===`tap`)return null;let n=t(e.step),r=e.braid,i=r.kind===`list`?r.tokens.length:r.kind===`scan`?r.steps.length:r.kind===`wave`?r.n:1;return n===null?null:e.step.whole?n:n/Math.max(1,i)},hc=(e,{decls:t})=>e.over?t.get(e.over.name):void 0,gc=[{sort:`signal`,is:`A sound parameter (s=, lpf= …): a voice.`,example:[`&lead s=saw loop=C4`],holds:e=>Object.keys(e.params).some(e=>X.has(e))},{sort:`signal`,is:`A mix: an instrument.`,example:[`&a s=saw loop=C4`,`&b s=sine loop=C3`,`&organ [&a, &b]`],holds:(e,{decls:t})=>fc(e)&&Es(e.name,t)===null},{sort:`signal`,is:`A pattern read through a kit (a table of voices).`,example:[`&bd s=sine loop=A1`,`&hh s=white`,`&kit &bd &hh`,`&drums over=&kit step=4 0 1 0 1`],holds:(e,t)=>pc(hc(e,t),t)},{sort:`signal`,is:`A read head of a sound tape (a tape that records a mix).`,example:[`&lead s=saw loop=C4`,`&mix [&lead]`,`&tape write=&mix step=1 length=4`,`&head play=&tape at=1`],holds:(e,{decls:t})=>{let n=typeof e.params.play==`string`?t.get(e.params.play):void 0;return!!n&&typeof n.params.write==`string`&&fc(t.get(n.params.write))}},{sort:`wave`,is:`A braid turning at an audio rate (20 Hz and up) with no sound of its own. Alone in a product it is the sound (a waveform); in a pitch sum, or beside a sound, a pitch that moves at audio rate (FM). One that plays as a voice in the piece is a sound everywhere.`,example:[`&square loop=220 0 1`],holds:(e,t)=>(mc(e,t)??0)>=20},{sort:`volume`,is:`map=amp, map=db or map=adsr (an envelope).`,example:[`&accent map=amp step=2 1 .5`],holds:e=>e.map?.kind===`amp`||e.map?.kind===`db`||e.map?.kind===`adsr`},{sort:`plain`,is:`map=lin: as a number, it takes its operator's sort — a volume in a product, a pitch in a sum.`,example:[`&swell map=lin loop=.25 .2 1`],holds:e=>e.map?.kind===`lin`},{sort:`pitch`,is:`Anything else: a melody, a cell reading a table, a loop below hearing (a vibrato). In semitones.`,example:[`&vibrato loop=5 0 .1 -.1`],holds:()=>!0}];gc.map(e=>U(`sort`,e.sort,e.is,[e.example[e.example.length-1]],`mix.md`));let _c=e=>e.k===`ref`?[e.ref]:e.k===`sum`?e.items.flatMap(e=>_c(e.e)):e.k===`prod`?e.factors.flatMap(_c):[],vc=e=>_c(e).map(e=>e.name);function yc(e,t){let n={decls:t,rateOf:e.rateOf};return e=>{let r=t.get(e);return r?gc.find(e=>e.holds(r,n)).sort:`pitch`}}function bc(e,t){let{error:n}=e,r={decls:t,rateOf:e.rateOf},i=yc(e,t),a=e=>{let n=e[e.length-1],i=t.get(n);if(!i)return null;if(i.braid.kind===`list`){let e=e=>e.atom.kind===`ref`&&Object.keys(t.get(e.atom.name)?.params??{}).some(e=>X.has(e)),r=t=>t.atom.kind===`note`||t.atom.kind===`ref`&&e(t)&&(t.atom.pick||t.atom.shift||t.atom.transpose||t.atom.values),a=i.braid.tokens.flatMap(e=>z(e.atom).map(e=>({atom:e})));if(a.some(e)&&a.some(r))return`&${n} mixes voices with numbers or picks: a groove holds only voices, rests and chords of voices (&bd &hh ~ [&bd, &hh]); to play numbers through voices, read them with over= a kit`}if(i.map?.kind===`midi`)return`&${n} is a MIDI card: it sends what it names to a device, and is no sound to mix or play`;if(pc(i,r))return`&${n} is a kit, a table of voices: read a pattern through it (&drums over=&${n}) and mix that`;let a=mc(i,r);return a!==null&&a<20?`&${n} loops at ${+a.toFixed(2)} Hz, below hearing: a pitch. A voice loops at an audio rate (loop=C4) or has a sound (s=saw)`:i.step?null:`&${n} has no loop=: a voice loops at an audio rate (loop=C4) or has a sound (s=saw)`},o=/* @__PURE__ */ new WeakMap;return s=>{let c=o.get(s);if(c)return c;c=[];let l=s.gate?e=>pc(t.get(e),r)?`signal`:i(e):i,u=s.gate?t.get(s.gate)?.gate:void 0,d=e=>s.exprs.flatMap(_c).find(t=>t.name===e),f=e=>{let n=t.get(e);return!!n&&(!!n.gate||fc(n)&&Es(e,t)===null||Object.keys(n.params).some(e=>X.has(e)))},p=u?(u.lines?.map(e=>e.line)??[u.notes]).map(e=>({name:e,port:u.port})):[],m=u&&[...p,...u.levels].find(e=>f(e.name));if(u&&m){let e=p.some(e=>e.name===m.name)?`the notes it plays (a melody, &tune)`:`a level (a volume: a cell with map=amp, map=db or map=lin)`;return n(`${m.port}=&${m.name}: a gate's ${m.port}= takes ${e}, and &${m.name} is a sound (${t.get(m.name)?.gate?`a gate`:fc(t.get(m.name))?`a mix`:`a voice`})`,d(m.name)?.span??t.get(s.gate).span),o.set(s,c),c}let h=e=>t.get(e)?.map?.kind===`role`,g=[...p.map(e=>e.name),...s.exprs.flatMap(vc)].find(h);if(g)return n(oc(g),d(g)?.span??t.get(s.gate??g).span),o.set(s,c),c;for(let i of s.exprs)try{let o=_c(i).filter(e=>!t.has(e.name));if(o.length){for(let t of o)e.unknownCell(t.name,t.span);continue}let s=tc(i,l,a),u=s.flatMap(e=>e.pitches).find(e=>pc(t.get(e.ref.name),r));u?n(`&${u.ref.name} is a kit, a table of voices: a pattern read through it is the sound — mix the pattern alone`,u.ref.span):c.push(...s)}catch(t){if(!(t instanceof Xs))throw t;vc(i).some(t=>e.broken.has(t))||n(t.message,t.span)}return o.set(s,c),c}}let xc=`card:builtin`,Sc=e=>e.k===`ref`?[e.ref.name]:e.k===`sum`?e.items.flatMap(e=>Sc(e.e)):e.k===`prod`?e.factors.flatMap(Sc):[],Cc=e=>e.kind===`ref`?[e.name]:e.kind===`mix`?e.exprs.flatMap(Sc):e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>Cc(e.atom))):[],wc=e=>e.braid.kind===`list`?e.braid.tokens.flatMap(e=>Cc(e.atom)):[];function Tc(e){let t=[];for(let n of[e.over,e.tonic,e.braid.kind===`scan`?e.braid.mode:null,e.swingFrom,e.base,e.env,e.pitch,e.map?.kind===`table`?e.map.table:null,e.step?.kind===`driven`?e.step.driver:e.step?.kind===`tap`?e.step.meter:null])n&&t.push(n.name);for(let n of Object.values(e.paramCells??{}))t.push(...n.factors.map(e=>e.name));for(let n of Object.values(e.paramClocks??{}))n.kind===`driven`&&t.push(n.driver.name);for(let[n,r]of Object.entries(e.params))typeof r==`string`&&qr[n]?.value===`cell`&&t.push(r);return e.gate&&t.push(e.gate.notes,...e.gate.levels.map(e=>e.name),...e.gate.receivers),t}let Ec=e=>[...wc(e),...Tc(e)];function Dc(e,t,n=/* @__PURE__ */ new Set){let{decls:r,implicit:i}=t,a={...t,builtin:null};if([...r.values()].some(e=>e.map?.kind===`sample`||e.map?.kind===`midi`))return a;let o=/* @__PURE__ */ new Set;for(let e of r.values())for(let t of Ec(e))t!==e.name&&o.add(t);let s=yc(e,r),c=[...r.values()].filter(t=>!i.has(t.name)&&!n.has(t.name)&&!t.lambda&&!o.has(t.name)&&!e.broken.has(t.name)&&(s(t.name)===`signal`||s(t.name)===`wave`));if(!c.length)return a;let l=Ds,u=c.map(e=>({k:`ref`,ref:{name:e.name,pick:null,shift:0,span:e.span}})),d={name:xc,span:l,over:null,shift:null,off:!1,step:null,map:{kind:`sample`,span:l},stride:null,cycle:null,params:{postgain:.8},paramSpans:{},braid:{kind:`list`,tokens:[{atom:{kind:`mix`,exprs:u},repeat:1,subdivide:1,elongate:1,span:l}]}};return{...t,decls:new Map([...r,[xc,d]]),implicit:/* @__PURE__ */ new Set([...i,xc]),overOk:new Map([...t.overOk,[xc,!0]]),builtin:xc}}function Oc(e){return(e?.units??[]).flatMap(e=>z(e.atom).flatMap(e=>e.kind===`ref`?[e.name]:[]))}function kc(e){return e.clock===e.name?1:e.rate}function Ac(e,t){let n=e.cells.get(t),r=n?.clock?e.clocks.get(n.clock):void 0;return n&&r?r.perSecond*kc(n):null}let jc=8192,Mc=.02,Nc=.5;function Pc(e,t=440){let n=69+12*Math.log2(e/t),r=Math.round(n);return{note:r,cents:(n-r)*100}}function Fc(e,t=2){if(!Number.isFinite(e))return jc;let n=Math.round(jc+e/(100*t)*jc);return Math.max(0,Math.min(16383,n))}function Ic(e,t=Math.max(Math.abs(e.gains[0]),Math.abs(e.gains[1]))){let n=e.levels[0]?.level??1,r=Math.max(0,n*Math.abs(t)),i=Math.round(127*Math.sqrt(Math.min(1,r)));return Math.max(1,Math.min(127,Number.isFinite(i)?i:1))}let Lc=[{note:35,name:`acousticbassdrum`,aliases:[]},{note:36,name:`bd`,aliases:[`kick`,`kd`,`bassdrum`]},{note:37,name:`rim`,aliases:[`rs`,`sidestick`]},{note:38,name:`sd`,aliases:[`snare`,`acousticsnare`]},{note:39,name:`cp`,aliases:[`clap`,`handclap`]},{note:40,name:`electricsnare`,aliases:[]},{note:41,name:`lt`,aliases:[`lo`,`lowfloortom`]},{note:42,name:`hh`,aliases:[`ch`,`closedhihat`]},{note:43,name:`highfloortom`,aliases:[]},{note:44,name:`ph`,aliases:[`pedalhihat`]},{note:45,name:`mt`,aliases:[`tom`,`mid`,`lowtom`]},{note:46,name:`oh`,aliases:[`openhihat`]},{note:47,name:`lowmidtom`,aliases:[]},{note:48,name:`ht`,aliases:[`hi`,`himidtom`]},{note:49,name:`cr`,aliases:[`crash`,`crashcymbal`]},{note:50,name:`hightom`,aliases:[]},{note:51,name:`rd`,aliases:[`ride`,`ridecymbal`]},{note:52,name:`chinesecymbal`,aliases:[]},{note:53,name:`ridebell`,aliases:[]},{note:54,name:`tb`,aliases:[`tambourine`]},{note:55,name:`splashcymbal`,aliases:[]},{note:56,name:`cb`,aliases:[`cowbell`]},{note:57,name:`crashcymbaltwo`,aliases:[]},{note:58,name:`vibraslap`,aliases:[]},{note:59,name:`ridecymbaltwo`,aliases:[]},{note:60,name:`hibongo`,aliases:[]},{note:61,name:`lowbongo`,aliases:[]},{note:62,name:`mutehiconga`,aliases:[]},{note:63,name:`openhiconga`,aliases:[]},{note:64,name:`lowconga`,aliases:[]},{note:65,name:`hightimbale`,aliases:[]},{note:66,name:`lowtimbale`,aliases:[]},{note:67,name:`highagogo`,aliases:[]},{note:68,name:`lowagogo`,aliases:[]},{note:69,name:`cabasa`,aliases:[]},{note:70,name:`sh`,aliases:[`maracas`]},{note:71,name:`shortwhistle`,aliases:[]},{note:72,name:`longwhistle`,aliases:[]},{note:73,name:`shortguiro`,aliases:[]},{note:74,name:`longguiro`,aliases:[]},{note:75,name:`claves`,aliases:[`clave`]},{note:76,name:`hiwoodblock`,aliases:[]},{note:77,name:`lowwoodblock`,aliases:[]},{note:78,name:`mutecuica`,aliases:[]},{note:79,name:`opencuica`,aliases:[]},{note:80,name:`mutetriangle`,aliases:[]},{note:81,name:`opentriangle`,aliases:[]}],Rc=new Map(Lc.flatMap(({note:e,name:t,aliases:n})=>[t,...n].map(t=>[t,e])));function zc(e){return Rc.get(e.toLowerCase().replace(/\d+$/,``))??null}function Bc(e,t){let n=/* @__PURE__ */ new Map;for(let r of e){let e=t(r);e!=null&&n.set(r,e)}let r=new Set(n.values()),i=36;for(let t of e)if(!n.has(t)){for(;i<=127&&r.has(i);)i++;if(i>127)break;n.set(t,i),r.add(i)}return n}let Vc=e=>[...e.cells.values()].some(e=>hi(e)),Hc=e=>(t,n)=>{let r=e.cells.get(t)?.span,i=e.cells.get(n)?.span;return(r?.line??1/0)-(i?.line??1/0)||(r?.col??0)-(i?.col??0)},Uc=(e,t=10)=>{let n=e%15;return n<t-1?n+1:n+2},Wc=(e,t)=>Oc(e.cells.get(t.voice)),Gc=(e,t)=>[...t.through,...t.via].find(t=>!!e.cells.get(t)?.gate),Kc=(e,t)=>Gc(e,t)??t.voice,qc=e=>e.kit&&(e.mods.length>0||e.offset!==0),Jc=e=>e.kit&&!qc(e);function Yc(e){let t=/* @__PURE__ */ new Set,n=/* @__PURE__ */ new Set;for(let r of e.outputs)if(!r.silent){if(Jc(r))for(let t of Wc(e,r))n.add(t);else if(r.kit)for(let n of Wc(e,r))t.add(Gc(e,r)??n);else t.add(Kc(e,r))}let r=Hc(e);return{voices:[...t].sort(r),members:[...n].sort(r)}}function Xc(e,t=[{}]){if(Vc(e))return Zc(e);let{voices:n,members:r}=Yc(e),i=Bc(r,t=>e.cells.get(t)?.drumNote),a=[],o=[];(t.length?t:[{}]).forEach((e,t)=>{let r=t===0,s=Qc(e.kit)??(r?10:0);s&&i.size&&o.push({port:t+1,channel:s}),n.forEach((n,i)=>{let o=Qc(e.voices?.[n])??(r?Uc(i,s||10):0);o&&a.push({voice:n,channel:o,port:t+1})})});let s=Hc(e);return{voices:a.sort((e,t)=>s(e.voice,t.voice)||e.port-t.port),kit:[...i].map(([e,t])=>({member:e,note:t})),kits:o}}function Zc(e){let t=Hc(e),n=/* @__PURE__ */ new Map,r=/* @__PURE__ */ new Set,i=/* @__PURE__ */ new Map,a=/* @__PURE__ */ new Set;for(let t of e.outputs)for(let o of t.midi??[])if(a.add(o.port),Jc(t)){for(let n of Wc(e,t))r.add(n);i.set(`${o.port}|${o.channel}`,{port:o.port,channel:o.channel})}else for(let r of t.kit?Wc(e,t):[t.voice])n.set(`${r}|${o.channel}|${o.port}`,{voice:r,channel:o.channel,port:o.port});for(let t of e.cells.values())t.map?.kind===`midi`&&a.add(t.map.port);let o=Bc([...r].sort(t),t=>e.cells.get(t)?.drumNote);return{voices:[...n.values()].sort((e,n)=>t(e.voice,n.voice)||e.port-n.port||e.channel-n.channel),kit:[...o].map(([e,t])=>({member:e,note:t})),kits:o.size?[...i.values()].sort((e,t)=>e.port-t.port||e.channel-t.channel):[],byPiece:!0,ports:[...a].sort((e,t)=>e-t)}}let Qc=e=>e===0?0:$c(e),$c=e=>typeof e==`number`&&Number.isInteger(e)&&e>=1&&e<=16?e:null,el=e=>e===null?[]:Array.isArray(e)?e:[e];function tl(e,t){let n=new Map(e.outputs.map(e=>[e.id,e])),r=/* @__PURE__ */ new Map;for(let e of t.voices)r.set(e.voice,[...r.get(e.voice)??[],{channel:e.channel,port:e.port}]);let i=new Map(t.kit.map(e=>[e.member,e.note]));return t.byPiece?e=>{if(!e.midi?.length)return null;let t=e.output===void 0?void 0:n.get(e.output),r=t&&Jc(t)?i.get(e.voice):null;return r===void 0?null:e.midi.map(e=>({channel:e.channel,drum:r,port:e.port,gain:e.gain}))}:a=>{let o=a.output===void 0?void 0:n.get(a.output);if(o?.silent)return null;if(o&&Jc(o)){let e=i.get(a.voice);return e===void 0?null:t.kits.map(t=>({channel:t.channel,drum:e,port:t.port}))}let s=o?o.kit?Gc(e,o)??a.voice:Kc(e,o):a.voice;return(r.get(s)??[]).map(e=>({channel:e.channel,drum:null,port:e.port}))}}function nl(e,t,n=2,r=440){let i=Ic(e,t.gain),a=e.at+Math.max(0,e.dur);if(t.drum!==null)return{channel:t.channel,note:t.drum,velocity:i,at:e.at,end:a,bend:jc,bends:[]};if(!(e.freq>0)||!Number.isFinite(e.freq))return null;let{note:o,cents:s}=Pc(e.freq,r);if(o<0||o>127)return null;let c=Math.abs(s)<Nc?0:s,l=e=>Math.abs(c+e)<Nc?jc:Fc(c+e,n),u=[],d={at:e.at,cents:0},f=(e,t)=>{t!==(u.at(-1)?.value??l(0))&&u.push({at:e,value:t})};for(let t of e.bends){if(t.at>=a)break;if(t.ramp&&t.at>d.at)for(let e=d.at+Mc;e<t.at-1e-9;e+=Mc)f(e,l(d.cents+(t.cents-d.cents)*(e-d.at)/(t.at-d.at)));let n=Math.max(e.at,t.at);f(n,l(t.cents)),d={at:n,cents:t.cents}}return{channel:t.channel,note:o,velocity:i,at:e.at,end:a,bend:l(0),bends:u}}var rl=class extends Error{};function il(e){let{braid:t,params:n}=e,{beat:r,pulse:i}=n,a=t.kind===`scan`?Ji(t.steps):t.kind===`list`&&t.perBeat!==void 0?Ki(t.tokens.map(e=>e.atom.kind===`note`?e.atom.value:0),t.signature):null,o=t.kind===`scan`&&typeof i==`string`?Di(i):null,s=a&&o?Oi(a,o):a,c=s&&typeof r==`number`&&r>0?Ai(s,r):s,l=c&&e.legato?{...c,legato:e.legato.flatMap(e=>Di(e.level)===null?[]:[{...e,whole:Di(e.level)}])}:c;if(!l||typeof n.swing!=`number`)return l;let u=(e.swing??[{level:Pi(l)??``,share:n.swing}]).flatMap(e=>{let t=Di(e.level);return t===null?[]:[{level:e.level,whole:t,share:e.share}]});return e.swingMoves&&u.length?{...l,swing:u}:Mi(l,u)}function al(e,t,n){let r=il(e),i=e.bend,a=e.paramSpans.bend??e.span;if(!r)return t(`bend= is on a meter: &${e.name} is none`,a),{};let o=Di(i.level),s=r.levels.length,c=o===null?NaN:s*o*r.unit/r.pulses;if(!(c>=1)||!Number.isInteger(c)||s%c!==0)return t(`bend=${i.level}: the bar of &${e.name} has no whole number of ${i.level} nodes to bend`,a),{};let l=n(i.table.name),u=l?.braid.kind===`list`?l.braid.tokens.flatMap(e=>e.atom.kind===`note`?Array.from({length:Math.max(1,e.repeat)},()=>e.atom.value):[NaN]):[];if(!u.length||u.some(e=>!(e>0)))return t(`bend=${i.level}:&${i.table.name}: a table of lengths, each above 0`,a),{};let d=s/c,f=(e,t)=>t?f(t,e%t):e,p=u.length/f(d,u.length),{positions:m,lap:h}=ji(u,c,d,p,i.depth??1),g=i.depthMoves;return{bend:{positions:m,lap:h,bars:p,...g?{depth:{range:g.range,factors:g.factors.map(e=>e.name),table:u,per:c,nodes:d}}:{}}}}let ol=e=>e?Ei(e)*e.pulses/ki(e):1;function sl(e,{decls:t,implicit:n,implicitRoot:r,overOk:i,stacks:a},o,s){let{rateOf:c,error:l,warn:u,broken:d,unknownCell:f}=e,p=/* @__PURE__ */ new Map,m=e=>js(t,e),h=e=>Ms(t,e),g=[],_=/* @__PURE__ */ new Set,v=(i,y)=>{let b=p.get(i);if(b)return b;if(_.has(i)){for(let e of g)_.add(e),d.add(e);throw new rl}let x=t.get(i),S=a.has(i)?null:Es(i,t);if(g.length>=256){_.size||l(`&${g[0]} splices cells into each other more than 256 deep (&${g[0]} → &${g[1]} → … → &${i}): write a long chain as one braid`,y);for(let e of[...g,i])_.add(e),d.add(e);throw new rl}if(g.includes(i))throw l(`Circular reference: ${[...g.slice(g.indexOf(i)),i].map(e=>`&`+e).join(` → `)}`,y),new rl;g.push(i);let C=h(x),w=/* @__PURE__ */ new Map,T=[],E=x.braid.kind===`list`?x.braid.tokens:[],D=(e,n,r)=>{let i=e.name;if(!t.has(i)){if(d.has(i))for(let e of g)d.add(e);throw f(i,n),new rl}let a=v(i,n),o=Si(a,e.pick);if(o===null)throw l(Ci(i,e.pick,a.units.length),n),new rl;return w.set(i,(w.get(i)??0)+r),o};C.forEach((e,t)=>{let n=1,r=E[t]?.span??x.span;e.atom.kind===`ref`&&(n=D(e.atom,r,e.repeat*e.subdivide));let i=/* @__PURE__ */ new Map;for(let t of zt(e.atom))t.atom.kind===`ref`&&i.set(t.atom,D(t.atom,t.span??r,t.repeat*t.subdivide));e.atom.kind===`seq`&&(n=nn(e.atom,e=>i.get(e)||1)),T.push(n*e.elongate*e.repeat)});let O=T.reduce((e,t)=>e+t,0);g.pop();let k=ks(x),A=x.braid,j={name:i,span:x.span,root:k===null,implicit:i===`fifths12TET`&&r||n.has(i),over:k===null?null:x.over?.name??null,overShift:x.over?.shift??0,context:k??i,cycle:k===null?As(x):m(i),wrap:x.cycle??null,lambda:x.lambda??null,frees:x.frees??[],show:x.show??null,...x.paramSpans?.show?{showSpan:x.paramSpans.show}:{},laps:x.laps??null,loops:!!x.step?.whole,chance:x.chance??.5,seed:x.seed??0,size:x.size??1,tags:(x.tags??``).split(`,`).map(e=>e.trim()).filter(Boolean),about:(x.about??[]).map(e=>e.name),...x.base?{base:{name:x.base.name,...x.base.transpose?{transpose:x.base.transpose}:{},...x.base.degree?{degree:x.base.degree}:{}}}:{},beat:ol(il(x)),meter:il(x),...x.swingMoves?{swingMoves:{level:x.swingMoves.level,range:x.swingMoves.range,factors:x.swingMoves.factors.map(e=>e.name)}}:{},label:x.label??null,note:gn(x),env:x.env?.name??null,pitch:x.pitch?.name??null,braid:k===null?`blank`:A.kind,units:C,scan:A.kind===`scan`?{lap:Er(A.steps).lap,steps:A.steps}:null,...x.bend?al(x,u,e=>t.get(e)):{},shift:x.shift??0,...x.tonic?{tonic:x.tonic.name}:{},off:x.off,oneshot:!!x.oneshot,...x.drumNote===void 0?e.parsed.old&&zc(x.name)!==null?{drumNote:zc(x.name)}:{}:{drumNote:x.drumNote},glide:typeof x.params.glide==`number`&&x.params.glide>0?x.params.glide:0,children:w,steps:O,unitSteps:T,hasValues:C.some(e=>z(e.atom).some(e=>e.kind===`note`||e.kind===`chord`)),step:x.step?.kind===`driven`?{driver:x.step.driver.name,cycle:x.step.cycle,whole:x.step.whole,chain:x.step.chain}:null,paramClocks:Object.fromEntries(Object.entries(x.paramClocks??{}).flatMap(([e,t])=>t.kind===`driven`?[[e,{driver:t.driver.name,cycle:t.cycle,whole:t.whole,chain:t.chain}]]:[])),map:x.map?x.map.kind===`table`?{kind:`table`,table:x.map.table.name}:x.map.kind===`edo`?{kind:`edo`,period:x.map.period}:x.map.kind===`ratios`?{kind:`ratios`,ratios:x.braid.kind===`list`?x.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[]}:x.map.kind===`midi`?{kind:`midi`,channel:x.map.channel,port:x.map.port}:{kind:x.map.kind}:null,mix:a.has(i)?[]:S?null:C.length>0&&C.every(e=>e.atom.kind===`mix`)&&(C.length===1||x.map?.kind===`sample`)&&x.map?.kind!==`midi`?C.flatMap(e=>e.atom.kind===`mix`?o(e.atom):[]):null,...S?{sum:S}:{},sink:x.map?.kind===`sample`,sort:s(i),...x.map?.kind===`midi`?{chords:C.map(e=>e.atom.kind===`mix`?o(e.atom):null)}:{},clock:null,rate:0,stride:x.stride??1,params:x.params,paramCells:Object.fromEntries(Object.entries(x.paramCells??{}).map(([e,t])=>[e,{range:t.range,factors:t.factors.map(e=>e.name),...t.to===void 0?{}:{to:t.to}}])),voice:Object.keys(x.params).some(e=>X.has(e)),freq:x.step?.kind===`rate`||x.step?.kind===`env`?x.step.whole?c(x.step)??261.63:(c(x.step)??261.63)/Math.max(1,O):261.63,kit:!1,...x.gate?{gate:x.gate}:{}};return p.set(i,j),j};for(let[e,n]of t)if(i.get(e))try{v(e,n.span)}catch(e){if(!(e instanceof rl))throw e;g.length=0}for(let[e,n]of t){let t=p.get(e);if(!t||t.root)continue;let r=t.over??`fifths12TET`;!p.get(r)?.root&&n.braid.kind===`list`&&n.braid.tokens.some(e=>e.atom.kind===`note`&&!Number.isInteger(e.atom.value))&&u(`&${r} is a table, so decimal indexes are rounded down`,n.span)}return p}let cl=`tutorial`,ll={genre:[`classical`,`jazz`,`electronic`,`experimental`,`world`,`folk`,`ambient`,`dance`,`industrial`,`blues`,`minimal`,`8-bit`],artist:[`Bach`,`Wendy Carlos`,`Stockhausen`,`Neubauten`,`Aphex Twin`,`Brahms`,`Coltrane`,`Pachelbel`,`Kraftwerk`,`Scooter`,`Daft Punk`,`Chemical Brothers`,`Nine Inch Nails`,`Steve Reich`],tutorial:[cl],topic:[`sound`,`rhythm`,`harmony`,`diatonic`,`tonal`,`modal`,`chromatic`,`microtonal`,`tuning`,`arrangement`,`canon`,`counterpoint`,`motifs`,`pentatonic`,`stereo`,`FM`,`MIDI`,`physics`,`tape`]};function ul(e){if(e.toLowerCase()===`tutorial`)return{kind:`tutorial`,name:cl};let t=/^(genre|artist|topic):\s*(.*)$/i.exec(e);return t?{kind:t[1].toLowerCase(),name:t[2]}:{kind:`topic`,name:e}}function dl(e){if(/^(topic:\s*)?basics$/i.test(e.trim()))return cl;let{kind:t,name:n}=ul(e.trim());if(t===`tutorial`)return cl;let r=e=>ll[e].find(e=>e.toLowerCase()===n.toLowerCase());if(t===`topic`){let t=/^topic:/i.test(e.trim()),i=t?void 0:r(`genre`);if(i)return`genre:${i}`;let a=t?void 0:r(`artist`);return a?`artist:${a}`:n}return`${t}:${r(t)??n}`}let fl=e=>[...e.pitches.map(e=>e.ref.name),e.voice.name].filter(e=>!e.startsWith(`λ`)).join(`*`)||e.voice.name;function pl(e,t,n,r){let{error:i,warn:a,unknownCell:o}=e,s=new Map(n),c=e=>Qr(t.get(e)?.params??{}),l=e=>e.units.length>0&&e.units.every(e=>e.atom.kind===`ref`&&c(e.atom.name));for(let e of[...s.values()])!e.voice&&!e.root&&l(e)&&s.set(e.name,{...e,kit:!0});let u=[...s.values()].filter(e=>e.sink);for(let[e,n]of t){let t=s.get(e);t&&!t.mix&&!t.sum&&!hi(t)&&t.map?.kind!==`role`&&t.units.some(e=>e.atom.kind===`mix`)&&i(t.sink?`A sound card's channels are all mixes: [left …] [right …], or &left &right`:`A mix is one chord of sounds: &${e} [&a * &v, &b * &w]`,n.span)}let d=(e,t=[])=>{let n=s.get(e.voice.name);return!n?.mix||n.sink?[{b:e,through:t}]:t.includes(n.name)||t.length>16?(i(`&${n.name} plays itself through its mixes`,n.span),[]):n.mix.flatMap(r=>d({voice:r.voice,pitches:[...e.pitches,...r.pitches],offset:e.offset+r.offset,gain:e.gain*r.gain},[...t,n.name]))},f=/* @__PURE__ */ new Map,p=/* @__PURE__ */ new Map,m=(e,t)=>{p.has(e)||p.set(e,[]),p.get(e).push(t)},h=e=>[e.voice.name,e.offset,...e.pitches.map(e=>`${e.sign}${e.ref.name}${JSON.stringify(e.ref.pick)}${e.ref.shift}`)].join(`|`),g=e=>{let n=[...e].filter(e=>{let n=t.get(e);return!!n&&[...Object.keys(n.params),...Object.keys(n.paramCells??{}),...Object.keys(n.paramClocks??{})].some(e=>X.has(e))});return n.length?`|through:${n.join(`,`)}`:``};for(let n of u){let a=t.get(n.name),o=n.units;if(o.length===0||o.length>2){i(`The sound card takes one channel (mono) or two (left, right): &${n.name} map=sample &left &right`,a.span);continue}o.forEach((t,c)=>{let l=t.atom.kind===`mix`?r(t.atom):null,u=t.atom.kind===`ref`?s.get(t.atom.name):l?n:void 0,p=l??(t.atom.kind===`ref`&&u?.mix&&!u.sink?u.mix:null);if(!u||!p){if(t.atom.kind===`ref`&&e.broken.has(t.atom.name))return;i(t.atom.kind===`ref`&&u?.map?.kind===`role`?oc(t.atom.name):`A channel of the sound card is a mix: &mix, or [&theme * &lead] written in place`,a.span);return}for(let{b:e,through:t,top:r,index:i}of p.flatMap((e,t)=>d(e).map(n=>({...n,top:e,index:t})))){let a=h(e)+g(t),s=f.get(a),l=n.implicit?r.voice.span:u.span;s||f.set(a,s={b:e,span:l,gains:[0,0],via:/* @__PURE__ */ new Set,parts:[],through:/* @__PURE__ */ new Set});for(let e of t)s.through.add(e);m(e.voice.name,t);let d=o.length===1?[e.gain,e.gain]:c===0?[e.gain,0]:[0,e.gain];s.gains[0]+=d[0],s.gains[1]+=d[1],s.parts.push({mix:u.name,sink:n.name,gains:d,entry:{channel:c,index:i,label:fl(r)}}),s.via.add(u.name).add(n.name)}})}let _=e=>{let n=t.get(e)?.over?.name;return n&&s.get(n)?.kit?n:null};{let e=new Set([...f.values()].flatMap(e=>e.parts.map(e=>e.mix))),n=/* @__PURE__ */ new Set;for(let r of t.values())for(let t of[`excite`,`write`]){let i=r.params[t];typeof i==`string`&&s.get(i)?.mix&&!e.has(i)&&n.add(i)}for(let e of n){let t=s.get(e);for(let{b:n,through:r}of t.mix.flatMap(e=>d(e))){if(typeof s.get(n.voice.name)?.params.play==`string`)continue;let i=`send:`+h(n)+g(r);f.has(i)||[...f.values()].some(e=>h(e.b)+g(e.through)===h(n)+g(r))||(f.set(i,{b:n,span:t.span,gains:[n.gain,n.gain],via:/* @__PURE__ */ new Set([e]),parts:[],through:new Set(r),silent:!0}),m(n.voice.name,r))}}}let v=[...s.values()].filter(e=>hi(e));for(let e of v){let n=t.get(e.name),r=e.map;n.step&&i(`A MIDI card doesn't turn: leave out ${n.step.whole?`loop`:`step`}= (&${e.name} map=midi …)`,n.step.span);let o=n.braid.kind===`list`?n.braid.tokens:[],c=e.units.findIndex(e=>e.subdivide!==1||e.elongate!==1);if(c>=0){i(`A MIDI card's entries are channels: x!n repeats one on n channels, but * and @ mean nothing here`,o[c]?.span??n.span);continue}let l=e.units.reduce((e,t)=>e+t.repeat,0);if(r.channel===null&&l>16){i(`A MIDI card has 16 channels, and &${e.name} names ${l}: ~ skips one, map=midi(10) puts them all on one`,n.span);continue}l===0&&a(`&${e.name} is a MIDI card with no channels: write what goes on each, map=midi [&theme * &reed] ~ &groove`,n.map.span);let u=0;e.units.forEach((t,a)=>{let c=o[a]?.span??n.span,l=u;if(u+=t.repeat,t.atom.kind===`rest`)return;let p;if(t.atom.kind===`mix`)p={bindings:e.chords?.[a]??[],mix:null};else if(t.atom.kind===`ref`){let e=t.atom.name,n=s.get(e);if(!n)return;let r={voice:{name:e,pick:t.atom.pick,shift:t.atom.shift,span:c},pitches:[],offset:0,gain:1};if(n.mix&&!n.sink)p={bindings:n.mix,mix:e};else if(_(e)||n.voice||n.kit)p={bindings:[r],mix:null};else{i(n.map?.kind===`role`?oc(e):hi(n)?`&${e} is a MIDI card: a card's entries are what it sends (a mix, a mix cell, a pattern read through a kit), not another card — name &${e}'s entries here`:`&${e} is a melody without a voice: a MIDI channel plays notes on a voice, [&${e} * &voice]`,c);return}}else{i(`A MIDI card's entries are channels: a mix ([&theme * &reed]), a mix cell, a pattern read through a kit, or ~ to skip one`,c);return}let{bindings:v,mix:y}=p;for(let n=0;n<t.repeat;n++){let t=r.channel??l+n+1;for(let{b:n,through:i}of v.flatMap(e=>d(e))){let a=h(n)+g(i),o=f.get(a)??[...f.values()].find(e=>h(e.b)===a);o||f.set(a,o={b:n,span:e.span,gains:[0,0],via:/* @__PURE__ */ new Set,parts:[],through:/* @__PURE__ */ new Set});for(let e of i)o.through.add(e);m(n.voice.name,i),(o.midi??=[]).push({card:e.name,mix:y,channel:t,port:r.port,gain:n.gain}),o.via.add(e.name),y&&o.via.add(y)}}})}let y=[...f.values()].map(e=>{let t=_(e.b.voice.name);return t?{...e,b:{...e.b,voice:{name:t,pick:null,shift:0,span:e.b.voice.span},pitches:[{ref:e.b.voice,sign:1},...e.b.pitches]}}:e}),b=e=>{let t=s.get(e),n=t&&typeof t.params.play==`string`?s.get(t.params.play):void 0,r=n&&typeof n.params.write==`string`?s.get(n.params.write):void 0;return!!r?.mix&&!r.sink};for(let{b:e}of y){let t=s.get(e.voice.name);t&&!t.root&&!t.kit&&!b(t.name)&&!e.pitches.some(e=>e.ref.name===t.name)&&s.set(t.name,{...t,voice:!0})}let x=[...t].find(([,e])=>e.title)?.[0];for(let[e,n]of t){let r=s.get(e);if(!r)continue;if(r.map?.kind===`table`&&!t.has(r.map.table)&&o(r.map.table,n.map.span),n.base&&!t.has(n.base.name)&&o(n.base.name,n.base.span),n.style)for(let e of ml(n.style))t.has(e.name)||o(e.name,e.span);if(n.about){r.note||i(`about= belongs on a note: a cell with a label= (or title=) and nothing else`,n.about[0].span);for(let e of n.about)t.has(e.name)||o(e.name,e.span)}if(n.tier!=null&&n.title&&!(n.tags??``).split(`,`).some(e=>dl(e.trim())===`tutorial`)&&a(`tier= puts a piece in a tier of the tutorial; without tags="tutorial" it is ignored`,n.paramSpans.tier??n.span),n.tier!=null&&!n.title&&i(`tier= belongs on a piece’s card: the note with its title=`,n.paramSpans.tier??n.span),e===x&&r.note){let e=[`title`,`tags`,`tier`].filter(e=>n[e]!=null),t=e=>e.length>1?`${e.slice(0,-1).join(`, `)} and ${e.at(-1)}`:e[0],r=e.length>1;a(`${t(e.map(e=>`${e}=`))} on the piece’s card ${r?`go`:`goes`} in its file’s frontmatter now (${e.map(e=>`${e}:`).join(` `)}): Shorten moves ${r?`them`:`it`} there (decision 047)`,n.paramSpans.title??n.span)}if(!r.voice)continue;let c=n.params.s;c!==void 0&&!(String(c)in ii)&&i(`Unknown sound '${c}' (${Object.keys(ii).join(`, `)})`,n.paramSpans.s??n.span),c!==void 0&&n.braid.kind!==`blank`&&a(`s=${c} plays a built-in waveform; the braid is ignored`,n.paramSpans.s);let l=Object.keys(n.params).find(e=>X.has(e)),u=c===void 0&&l?Oc(r).find(t=>t!==e&&(s.get(t)?.voice||s.get(t)?.kit)):void 0;u&&a(`&${e}'s braid names &${u}, a voice: a voice's braid is its waveform, and a voice is none, so &${u} isn't heard. To play it through &${e}'s ${l}=, write the mix: &${e} … [&${u}]`,n.span);for(let[e,t]of Object.entries(n.params))qr[e]?.value===`number`&&typeof t!=`number`&&i(`${e}= takes a number`,n.paramSpans[e]);let d=Object.keys(n.params).find(e=>X.has(e)),f=d?` (${d}= makes &${e} a voice; a meter takes none)`:``;n.step?.kind===`driven`||n.step?.kind===`tap`?i(`A voice moves at a rate — its pitch, like loop=C4${f}`,n.step.span):n.step&&!n.step.whole&&i(`A voice's pitch is loop= (one turn of its braid per cycle): loop=C4${f}`,n.step.span)}return{cells:s,sinks:u,cards:v,bindings:y,soundHead:b,playings:p}}function ml(e){let t=e=>e.kind===`cell`?[e.ref]:e.terms.map(e=>e.ref);return[...t(e.from),...e.to?t(e.to):[],...e.curve?[e.curve]:[]]}let hl=(e,t,n)=>`${e}:${t.written}${n>1?`:${n}`:``}`;function gl(e,t,n,r){let i=r*e/Math.max(1,t),a=i*t,o=e=>Math.abs(e-Math.round(e))<1e-9&&Math.round(e)>0,s=e=>o(e)&&Number.isInteger(Math.log2(Math.round(e)))&&Math.round(e)<=64;if(o(1/a))return Math.round(1/a)===1?`1m`:`1m/${Math.round(1/a)}`;if(o(a)){if(s(i*n)&&Math.round(i*n)>1)return`${Math.round(i*n)}n`;if(s(2*i*n/3))return`${Math.round(2*i*n/3)}t`}return`pulse${_l(i)}`}function _l(e){if(Math.abs(e-1)<1e-9)return``;let t=yl(e);return t?t[1]===1?`*${t[0]}`:t[0]===1?`/${t[1]}`:`*${t[0]}/${t[1]}`:`*${+e.toFixed(6)}`}let vl=e=>e.map(e=>`${e.op===`×`?`*`:`/`}${e.n}`).join(``);function yl(e){for(let t=1;t<=64;t++){let n=Math.round(e*t);if(n>0&&Math.abs(n/t-e)<1e-9)return[n,t]}return null}function bl(e,t,n){let{rateOf:r,error:i,warn:a,unknownCell:o,broken:s}=e,c=(t,n)=>(e.parsed.old?a:i)(t,n),l=new Map(n),u=/* @__PURE__ */ new Map,d=e=>{let n=e.step;if(n?.kind!==`driven`||n.whole||n.cycle||!l.get(e.name)?.meter)return null;let i=t.get(n.driver.name),a=l.get(n.driver.name);if(i?.step?.kind!==`rate`||i.step.whole||i.braid.kind!==`blank`||!a||a.voice||a.kit||a.meter)return null;let o=r(i.step);return o===null?null:o*n.ratio};for(let[e,n]of t){let t=l.get(e);if(!t||t.voice||t.kit)continue;let i=d(n);if(i===null&&n.step?.kind!==`rate`&&n.step?.kind!==`env`)continue;let o=i??r(n.step);if(o===null||!n.step)continue;n.params.pulse!==void 0&&(n.braid.kind!==`scan`||typeof n.params.pulse!=`string`||Di(n.params.pulse)===null)&&a(`pulse= says the note value of a scan's entries (pulse=16n: sixteenths, its bpm counting quarters); ${n.braid.kind===`scan`?`${n.params.pulse} is not one (16n, 8t, 4n.)`:`on &${e}, not a scan, it does nothing`}`,n.paramSpans?.pulse??n.span);let s=i===null&&n.step.whole,f=(s?o*Math.max(1,t.steps):o)*(s?1:t.beat),p=n.paramSpans?.swing??n.span,m,h=null,g=e=>String(e).replace(/^0\./,`.`);if(typeof n.params.swing==`number`&&t.meter){let r=t.meter;if(!n.swing){let e=Pi(r),t=e===null?null:Di(e);t!==null&&Fi(r,t)===null?c(`swing=${g(n.params.swing)} on a meter is retired: name the level it leans, swing=${e}:${g(n.params.swing)} (Migrate rewrites it)`,p):a(`swing=${g(n.params.swing)} leans the meter cell's own steps, and they are its beats, which swing never moves: name the level it leans, swing=8n:${g(n.params.swing)}`,p)}for(let t of(n.swing??[]).filter(e=>e.share!==.5)){let n=Di(t.level),i=n===null?`${t.level} is not a note value (8n, 16n, 8t)`:Fi(r,n);i&&a(`swing=${t.level}:${g(t.share)} leans nothing on &${e}: ${i}`,p)}h=Gi(r)}else typeof n.params.swing==`number`&&n.swing?a(`swing=${n.swing.map(e=>`${e.level}:${g(e.share)}`).join(`,`)} leans levels of a meter, and &${e} is not one: write swing=${g(n.params.swing)} (pairs of its steps)`,p):typeof n.params.swing==`number`&&n.params.swing!==.5&&(m=n.params.swing);u.set(e,{cell:e,perSecond:f,positional:Ti(t),...m===void 0?{}:{swing:m},...h?{swung:h}:{}})}let f=new Set([...t.values()].flatMap(e=>e.step?.kind===`driven`?[e.step.driver.name]:e.step?.kind===`tap`&&e.step.meter?[e.step.meter.name]:[])),p=/* @__PURE__ */ new Map,m=[],h,g=/* @__PURE__ */ new Map,_=()=>{if(h!==void 0)return h;let e=[...t.values()].filter(e=>u.has(e.name)&&l.get(e.name)?.meter);return h=(e.find(e=>!e.step?.whole)??e[0])?.name??null,h},v=(e,n,r)=>{let a=e.meter?.name??_();if(!a)return i(`${n} taps the piece's main meter, and it has none: write one (&bar meter("4/4") step=100bpm)`,e.span),r(),null;if(!t.has(a))return o(a,e.meter.span),r(),null;if(m.includes(a))return i(`step= loops back: ${[...m.slice(m.indexOf(a)),a].map(e=>`&`+e).join(` → `)}`,e.span),null;let s=b(a);return!l.get(a)?.meter||!s||s.clock!==a?(i(`${n}: &${a} is not a meter that keeps time — a tap reads a meter(…) or scan(…) with a tempo (&${a} meter("4/4") step=100bpm)`,e.meter?.span??e.span),r(),null):a},y=(e,n)=>{let r=`step=${n.meter?`&${n.meter.name}:`:``}${n.tap.written}`,i=v(n,r,()=>s.add(e));if(!i)return null;let a=l.get(i).meter;g.set(e,i);let o=Math.max(1,Math.round(t.get(e)?.cycle??1)),c=a.swing&&Number.isInteger(n.ratio)&&n.ratio>1?n.ratio:1,d=hl(i,n.tap,o)+(c>1?`*${c}`:``);if(!u.has(d)){let e=Ei(a),t=Yi(a,n.tap,o),r=a.pulses*o,s=t.flatMap((e,n)=>Array.from({length:c},()=>((t[n+1]??r)-e)/c)),f=t.flatMap((e,n)=>Array.from({length:c},(i,a)=>e+a*((t[n+1]??r)-e)/c)),p=f.map((t,n)=>zi(a,t,s[n])*e),m=f.map(t=>t*e),h=a.levels.length*o;u.set(d,{cell:i,perSecond:u.get(i).perSecond*p.length/h,positional:!1,tap:{meter:i,positions:p,lap:h,...l.get(i).swingMoves?{written:m,grids:s}:m.some((e,t)=>Math.abs(e-p[t])>1e-12)?{written:m}:{}}})}let p=n.ratio/c,m=l.get(e);return(m?.scan||m?.bend)&&f.has(e)?(u.set(e,{cell:e,perSecond:u.get(d).perSecond*p,positional:!0}),{clock:e,rate:1}):m&&typeof t.get(e)?.params.belt==`number`?(u.set(e,{cell:e,perSecond:u.get(d).perSecond*p,positional:!1,belt:{driver:d,rate:p}}),{clock:e,rate:1}):{clock:d,rate:p}},b=e=>{if(p.has(e))return p.get(e);if(u.has(e))return p.set(e,{clock:e,rate:1}),p.get(e);let n=t.get(e)?.step;if(n?.kind===`tap`&&!l.get(e)?.voice){m.push(e);let t=y(e,n);return m.pop(),p.set(e,t),t}if(!n||n.kind!==`driven`||l.get(e)?.voice)return p.set(e,null),null;let r=n.driver.name,s=n.whole?`loop=`:`step=`,d=null;if(!t.has(r))o(r,n.driver.span);else if(m.includes(r)||r===e)i(`${s} loops back: ${[...m.slice(m.indexOf(r)),e,r].map(e=>`&`+e).join(` → `)}`,n.span);else if(l.get(r)?.voice)i(`&${r} is a voice: it moves at audio rate`,n.driver.span);else{m.push(e);let o=b(r);m.pop();let p=l.get(r)?.steps??0,h=l.get(e)?.steps??0;if(o&&!n.whole&&!n.cycle&&l.get(r)?.meter&&u.has(r)){let e=l.get(r).meter,i=gl(e.levels.length,e.pulses,t.get(r)?.step?.kind===`rate`?e.unit:0,n.ratio);c(`step=&${r}${vl(n.chain)} is retired: a line taps the meter by pulse, beat or a note value, never its cell's own steps (step=${_()===r?``:`&${r}:`}${i}; Migrate rewrites it)`,n.span)}if(!o)a(`&${r} never moves, so &${e} stands still — give &${r} a rate (step=84bpm) or ${s}&cell`,n.driver.span);else if(n.cycle&&p===0)i(`&${r} has no cycle to count`,n.driver.span);else if(n.whole&&h===0)i(`&${e} has no steps to loop`,n.span);else{d={clock:o.clock,rate:o.rate*n.ratio*(n.whole?h:1)/(n.cycle?p:1)};let r=l.get(e);r&&(r.scan||r.bend)&&f.has(e)&&!n.whole?(u.set(e,{cell:e,perSecond:u.get(o.clock).perSecond*d.rate,positional:!0}),d={clock:e,rate:1}):r&&typeof t.get(e)?.params.belt==`number`&&!n.whole&&(u.set(e,{cell:e,perSecond:u.get(o.clock).perSecond*d.rate,positional:!1,belt:{driver:o.clock,rate:d.rate}}),d={clock:e,rate:1})}}return p.set(e,d),d};for(let e of[...l.values()]){let n=b(e.name),r=t.get(e.name)?.step,i=g.get(e.name),a=r?.kind===`tap`?n&&i?{driver:i,cycle:!1,whole:!1,chain:r.chain,tap:r.tap.written}:null:e.step;n?l.set(e.name,{...e,clock:n.clock,rate:n.rate,step:a}):a!==e.step&&l.set(e.name,{...e,step:a})}for(let e of t.values())for(let[t,n]of Object.entries(e.paramClocks??{})){if(n.kind===`tap`){let r=l.get(e.name),i=v(n,`${t}=${n.meter?`&${n.meter.name}:`:``}${n.tap.written}`,()=>{});if(!i||!r)continue;let a=l.get(i).meter,o=a.levels.length/u.get(i).perSecond,s=n.tap.kind===`note`?n.tap.whole*a.unit*o/a.pulses:o/Yi(a,n.tap,1).length,c=n.ratio/s;l.set(e.name,{...r,params:{...r.params,[t]:+(1/c).toFixed(6)},paramClocks:{...r.paramClocks,[t]:{driver:i,cycle:!1,whole:!1,chain:n.chain,tap:n.tap.written}}});continue}if(n.kind!==`driven`)continue;let r=b(n.driver.name),a=l.get(e.name);if(!r||!a){i(`${t}=&${n.driver.name}: that cell keeps no time`,n.span);continue}let o=u.get(r.clock).perSecond*r.rate*n.ratio;l.set(e.name,{...a,params:{...a.params,[t]:+(1/o).toFixed(6)}})}return{cells:l,clocks:u,mainMeter:_()}}function xl(e,t,n,r=/* @__PURE__ */ new Map,i=/* @__PURE__ */ new Map){let{error:a,warn:o,unknownCell:s}=e,c=/* @__PURE__ */ new Set;for(let e of n.values())if(e.kit)for(let r of e.units){let e=r.atom.kind===`ref`?r.atom.name:null,i=e===null?void 0:t.get(e),a=e===null?null:zc(e);i&&a!==null&&i.drumNote===void 0&&!c.has(e)&&n.get(e)?.voice&&(c.add(e),o(`&${e} is named as General MIDI's drum ${a}, and a name gives no note: write &${e} note=${a} (Migrate writes it, decision 075)`,i.span))}for(let e of n.values()){let r=n=>t.get(e.name)?.paramSpans?.[n]??t.get(e.name).span;if(typeof e.params.body==`string`&&!(e.params.body in pi)&&a(`body=${e.params.body}: one of ${Object.keys(pi).join(`, `)}`,r(`body`)),typeof e.params.board==`string`&&e.params.board!==`none`&&!(e.params.board in pi)&&a(`board=${e.params.board}: none, or one of ${Object.keys(pi).join(`, `)}`,r(`board`)),e.params.ftype!==void 0&&ri(e.params.ftype)===null&&a(`ftype=${e.params.ftype}: its filters' model is one of ${ni.join(`, `)} (or superdough's 0, 1, 2)`,r(`ftype`)),typeof e.params.couple==`string`){let t=n.get(e.params.couple);t?typeof t.params.body!=`string`&&a(`couple=&${t.name}: it couples to another resonator (a cell with body=)`,r(`couple`)):s(e.params.couple,r(`couple`))}typeof e.params.excite==`string`&&!n.get(e.params.excite)?.mix&&a(`excite=&${e.params.excite}: a resonator is driven by sound — a mix`,r(`excite`))}for(let e of n.values()){let r=e.show?.startsWith(`mix:&`)?e.show.slice(5):null;if(r===null)continue;let i=t.get(e.name)?.paramSpans?.show??t.get(e.name).span,a=n.get(r);e.mix?a?a.root||o(`show=mix:&${r}: a mix's colours follow a grid (a cell with map=edo), not &${r}`,i):s(r,i):o(`show=mix:&${r} does nothing on &${e.name}: it names the grid a mix's colours follow, and &${e.name} isn't a mix`,i)}for(let e of n.values()){let r=n=>t.get(e.name)?.paramSpans?.[n]??t.get(e.name).span;if(typeof e.params.write==`string`){let t=n.get(e.params.write);t?t.voice&&a(`write=&${t.name}: a tape records what plays — a melody, not a voice`,r(`write`)):s(e.params.write,r(`write`))}if(typeof e.params.play==`string`){let t=n.get(e.params.play);t?typeof t.params.write!=`string`&&a(`play=&${t.name}: a read head plays a tape — a cell with write= (what it records)`,r(`play`)):s(e.params.play,r(`play`))}}for(let e of n.values()){let r=e.params.fm;if(typeof r!=`string`)continue;let i=t.get(e.name)?.paramSpans?.fm??t.get(e.name).span,o=n.get(r);if(!o)s(r,i);else if(!o.voice)a(`fm=&${r}: a modulator is a voice (s=sine ratio=…)`,i);else{let t=/* @__PURE__ */ new Set([e.name]);for(let e=r;e;e=typeof n.get(e)?.params.fm==`string`?n.get(e).params.fm:void 0){if(t.has(e)){a(`fm=&${r}: the modulators come back round to &${e} — FM chains can't loop`,i);break}t.add(e)}}}let l=yc(e,t);for(let e of t.values())for(let[t,r]of Object.entries(e.paramCells??{})){let i=e.map?.kind===`adsr`&&It.adsr.includes(t)||e.map?.kind===`style`&&It.style.includes(t);t===`s`&&r.to!==void 0?[e.params.s,r.to].map(e=>typeof e==`string`?ii[e]:void 0).some(e=>e===void 0||e===`white`||e===`pink`||e===`brown`)&&a(`s=${e.params.s}..${r.to}: a blend is of two of the waves, sine tri saw square (or their other names)`,r.span):!Xr.has(t)&&!i&&a(`${t}= can't move: it takes a number (these can: ${[...Xr].join(` `)}; on a map=adsr cell, its slots; on a map=style cell, its axes; s= as a blend of two waves, s=tri..square * &x)`,r.span),r.range&&!(r.range[0]>=0&&r.range[1]>=0)&&a(`${t}=: a range of positive values, low..high`,r.span);let c=0;for(let e of r.factors){let r=n.get(e.name);r?r.map?.kind===`adsr`?c++:l(e.name)===`signal`?o(`${t}= * &${e.name}: &${e.name} is a sound, not a value that moves, and moves nothing here. A CV is a braid: &${e.name} loop=.5 sin(12)`,e.span):l(e.name)===`wave`&&o(`${t}= * &${e.name}: &${e.name} turns at an audio rate, and ${t}= follows a cell turning at most 20 times a second: it is read turning at that. A sound moved at an audio rate is FM's: fm= a voice`,e.span):s(e.name,e.span)}c>1&&a(`${t}=: one envelope (map=adsr) at most — the other factors scale it`,r.span),c&&!r.range&&a(`${t}=&env: an envelope runs 0 to 1 — give it a range: ${t}=200..3000 * &env`,r.span)}for(let e of t.values()){let r=e.params.legato,i=e.paramSpans.legato??e.span,s=e.frees?.find(e=>e.key===`param`&&e.param===`legato`),c=e=>a(`legato=${e}: a share of each note's held length is above 0 (.5 staccato, 1 as written, 1.5 into the next)`,i);typeof r==`string`?a(`legato=${r}: a share (.5), free(.5, .25..2.5) or a cell of shares (&artic)`,i):typeof r==`number`&&!(r>0)?c(String(r)):s&&!(s.lo>0)&&c(`free(${s.value}, ${s.lo}..${s.hi})`);let l=e.legato?.find(e=>!(e.share>0));l&&c(`${l.level}:${l.share}`),e.legato&&!n.get(e.name)?.meter&&o(`legato=${e.legato.map(e=>`${e.level}:${e.share}`).join(`,`)} gives the lines tapping a meter their share: &${e.name} is not a meter, so it does nothing`,i);let u=e.paramCells?.legato;u?.range&&!(u.range[0]>0)&&c(`${u.range[0]}..${u.range[1]}`);for(let e of u&&!u.range?u.factors:[]){let n=t.get(e.name),r=(n?.braid.kind===`list`?n.braid.tokens.flatMap(e=>z(e.atom)).flatMap(e=>e.kind===`note`?[e.value+e.alter]:e.kind===`chord`?e.notes:[]):[]).find(e=>!(e>0));r!==void 0&&c(`&${e.name}: its ${r}`)}}for(let e of t.values())if(e.map?.kind===`adsr`){for(let[n,r]of Object.entries(e.paramCells??{}))if(!r.range&&It.adsr.includes(n))for(let e of r.factors){let i=t.get(e.name),o=(i&&i.map?.kind!==`adsr`&&i.braid.kind===`list`?i.braid.tokens.flatMap(e=>z(e.atom)).flatMap(e=>e.kind===`note`?[e.value+e.alter]:e.kind===`chord`?e.notes:[]):[]).find(e=>n===`sustain`?!(e>=0&&e<=1):!(e>=0));o!==void 0&&a(n===`sustain`?`sustain=&${e.name}: a sustain is a level, 0 to 1, and &${e.name} holds ${o}`:`${n}=&${e.name}: ${n===`attack`?`an`:`a`} ${n} is seconds, 0 or more, and &${e.name} holds ${o}`,r.span)}}for(let e of t.values())e.stride!==null&&e.step?.kind!==`driven`&&e.step?.kind!==`tap`&&o(`stride= only matters with step=&cell or a tap (step=1m)`,e.paramSpans?.stride??e.span);for(let e of t.values())e.oneshot&&n.get(e.name)&&!n.get(e.name).voice&&o(`oneshot=1 is a voice's: &${e.name} is no voice, so it does nothing (put it on the voice that plays its notes)`,e.span);for(let e of t.values()){let t=n.get(e.name)?.cycle??0;e.step?.kind!==`driven`||e.cycle===null||e.map||t<2||e.cycle<t||e.cycle%t!==0||o(`cycle=${e.cycle} on &${e.name} counts laps: ${e.cycle} of its ${t} steps. Written before v0.16, when it counted steps, it says cycle=${e.cycle/t} (Migrate rewrites it, decision 040)`,e.paramSpans.cycle??e.span)}for(let e of t.values())for(let[t,r]of[[`env`,e.env],[`pitch`,e.pitch]]){if(!r)continue;let e=n.get(r.name);e?t===`env`&&e.map?.kind!==`adsr`&&e.map?.kind!==`amp`&&e.map?.kind!==`lin`&&e.map?.kind!==`db`?a(`env= takes a volume: a cell with map=adsr (an envelope), map=amp, map=db or map=lin`,r.span):t===`pitch`&&(e.map?.kind===`adsr`||e.map?.kind===`amp`||e.map?.kind===`db`)&&a(`pitch= takes a pitch (a vibrato, map=lin to glide), not a volume`,r.span):s(r.name,r.span)}for(let e of t.values()){if(e.map?.kind!==`adsr`)continue;let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];(t.length!==4||t.some(e=>!(e>=0))||t[2]>1)&&a(`map=adsr takes four numbers: attack decay sustain release — seconds, and sustain a level 0…1 (map=adsr .01 .3 .5 .4)`,e.map.span)}for(let e of t.values()){if(e.map?.kind!==`style`)continue;let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];(t.length!==R.length||t.some((e,t)=>!(e>=R[t].range[0]&&e<=R[t].range[1])))&&a(`map=style takes a value for each axis, in order: ${R.map(e=>`${e.name} (${e.range[0]} to ${e.range[1]})`).join(`, `)} (map=style .3 .45 .55 .55, or sync=.3 harm=.45 artic=.55 energy=.55)`,e.map.span)}for(let e of t.values()){if(e.map?.kind!==`ratios`)continue;let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];e.over===null?(t.length<2||t.some((e,n)=>!(e>0)||n>0&&!(e>t[n-1])))&&a(`map=ratios lists one period's tones as rising ratios, the last the period: map=ratios 1 9/8 5/4 4/3 3/2 5/3 15/8 2`,e.map.span):a(`A grid (map=ratios) reads nothing: its braid is its tones`,e.map.span)}for(let e of t.values())if(e.map?.kind===`edo`){if(e.over!==null||e.braid.kind!==`blank`)a(`A grid (map=edo, map=ed(r)) reads nothing and has no braid: &${e.name} map=edo(19)`,e.map.span);else if(e.cycle!==null&&e.name!==`fifths12TET`){let t=e.map.period===2?`edo(${e.cycle})`:`ed(${e.cycle}, ${wl(e.map.period)})`,n=e.paramSpans.cycle??e.span;e.cycle===0?a(`A grid has at least one step: its size is its map's, map=edo(19)`,n):e.map.steps===null?o(`cycle= on a grid is the old way: its size is its map's, map=${t} (Migrate rewrites it)`,n):o(`cycle=${e.cycle} does nothing on a grid whose map says its size (map=${e.map.period===2?`edo`:`ed`}(${e.map.steps}…)): leave it out`,n)}}for(let a of t.values()){let t=a.over?n.get(a.over.name):void 0;if(!t||t.kit||i.has(t.name))continue;let s=Oc(t);if(!s.length||s.every(e=>r.get(e)===t.name)||e.broken.has(a.name))continue;let c=[...new Set(s)].map(e=>`&`+e).join(` `);o(`&${t.name} is read as a table, but its cells (${c}) aren't entries: a table is its numbers. To play cells one after another, splice them into a braid (&${a.name} ${c}); choosing a melody per step isn't built yet (#29)`,a.over.span)}for(let[e,i]of r)[...n.values()].some(t=>t.step?.driver===e||Object.values(t.paramClocks).some(t=>t.driver===e))||o(`&${e} is a section of &${i}, but nothing is stepped by it: step=&${e} on what it should play (or a name mistyped)`,t.get(e).span);for(let e of t.values()){let t=e.map?.kind===`table`?n.get(e.map.table.name):void 0;t&&(t.mix||t.sink||hi(t))&&o(`map=&${t.name}: a map reads a table's numbers, and &${t.name} is ${hi(t)?`a MIDI card`:t.sink?`the sound card`:`a mix`}, which has none: nothing is mapped`,e.map.span)}for(let e of n.values()){let n=e.map?.kind===`midi`?e.map.channel:null;if(n===null)continue;let r=t.get(e.name);(r?.braid.kind===`list`?r.braid.tokens:[]).forEach(e=>{e.repeat>1&&e.atom.kind!==`rest`&&o(`!${e.repeat} on a card with one channel (map=midi(${n})): each note goes out ${e.repeat.toLocaleString(`en`)} times on it, at once — leave out the !${e.repeat}`,e.span)})}for(let e of new Set(r.values()))if(![...t.values()].some(t=>t.over?.name===e)){let n=[...r].filter(([,t])=>t===e).map(([e])=>e),i=t.get(n[0])?.step,a=i?.kind===`driven`?i.driver.name:`bar`;o(`&${e} declares sections (${n.map(e=>`&`+e).join(` `)}), and nothing selects them: every part plays all the time. A selector reads the table and switches them, a step of the form at a time: &song over=&${e} step=&${a}/16 0 [0,1]`,t.get(e).span)}let u=Math.max(12,...[...n.values()].filter(e=>e.root).map(e=>e.cycle))*Sl;for(let e of n.values()){let r=t.get(e.name);if(!r||e.implicit)continue;let i=r.braid.kind===`list`?r.braid.tokens:[];e.units.forEach((t,r)=>{let a=t.atom;if(a.kind!==`ref`||!a.values||Math.abs(a.values.add)<=u)return;let s=n.get(a.name);o(`degree(${s?.lambda?`&( … )`:`&`+a.name}, ${a.values.add}) moves it ${Math.abs(a.values.add).toLocaleString(`en`)} steps, over a hundred octaves: ${a.values.add>0?`its notes land above 20 kHz and are dropped`:`its notes fall below hearing`}, nothing plays`,i[r]?.span??e.span)});let a=Math.abs(e.shift)/Math.max(1,e.units.length);a>Cl&&o(`shift=${e.shift} turns ${e.lambda?`an unnamed cell &( … )`:`&`+e.name} about ${Math.round(a).toLocaleString(`en`)} laps, and every lap climbs a lap of the grid: its notes leave hearing`,r.paramSpans?.shift??r.span)}}let Sl=100,Cl=20;function wl(e){if(Number.isInteger(e))return String(e);for(let t=2;t<=1e3;t++){let n=Math.round(e*t);if(Math.abs(n/t-e)<1e-6)return`${n}/${t}`}return String(e)}function Tl(e,t,n,r,{sinks:i,cards:a,bindings:o,soundHead:s}){let{parsed:c,error:l,warn:u,unknownCell:d}=e,f=new Set([...t.values()].flatMap(e=>e.gate?[e.gate.notes,e.gate.plays,...(e.gate.lines??[]).flatMap(e=>[e.line,e.plays])]:[])),p=[],m=[],h=[],g=e=>!!e.clock&&t.get(e.name)?.step?.whole===!1,_=e=>(r.get(e.clock)?.perSecond??0)*e.rate,v=e=>{let t=[...e].sort((e,t)=>_(t.c)-_(e.c)),[n,r]=[_(t[0].c),_(t[1].c)];return n-r>1e-9*Math.max(n,r)?t[0]:null};for(let{b:r,span:i,gains:a,via:c,parts:_,through:y,silent:b,midi:x}of o){let o=e=>t.has(e.name)?!0:(d(e.name,e.span),!1);if(![r.voice,...r.pitches.map(e=>e.ref)].every(o)||[r.voice,...r.pitches.map(e=>e.ref)].some(t=>e.broken.has(t.name)))continue;if(s(r.voice.name)&&r.pitches.length===0){m.push({head:r.voice.name,tape:n.get(r.voice.name).params.play,gains:[a[0],a[1]],parts:_,through:[...y]});continue}let S=n.get(r.voice.name);if(!S)continue;if(typeof S.params.body==`string`&&r.pitches.length===0){let[e,t]=mi(S.params.pan);h.push({cell:S.name,gains:[a[0]*e,a[1]*t],parts:_.map(n=>({...n,gains:[n.gains[0]*e,n.gains[1]*t]})),through:[...y]});continue}let C=[...c,...y].flatMap(e=>{let t=n.get(e)?.gate;return t?t.lines?.map(e=>e.plays)??[t.plays]:[]}).find(e=>r.pitches.some(t=>t.ref.name===e)),w=S.kit?r.pitches.find(e=>t.get(e.ref.name)?.over?.name===S.name||e.ref.name===C):void 0;if(S.kit&&!w){l(`A kit is a table of voices: read the pattern through it, &drums over=&${S.name}, and mix &drums`,r.voice.span);continue}if(S.root){l(`&${S.name} is a grid, not a voice`,r.voice.span);continue}if(r.voice.pick||r.voice.shift){l(`Pick or shift the melody, not the voice: &theme[0] * &${S.name}`,r.voice.span);continue}if(t.get(S.name)?.step?.kind===`driven`||t.get(S.name)?.step?.kind===`tap`){l(`&${S.name} moves with step=&…, so it can't be a voice: a voice moves at a rate, its pitch (loop=C4)`,r.voice.span);continue}!S.params.s&&S.freq<20&&u(`&${S.name} loops at ${+S.freq.toFixed(2)} Hz, below hearing — is it a pitch? Then leave out its sound parameters: (&theme + &${S.name}) * &lead`,r.voice.span);let T=[...S.env?[{ref:t.get(S.name).env,sign:1,inSum:!1}]:[],...S.pitch?[{ref:t.get(S.name).pitch,sign:1,inSum:!0}]:[]],E=r.pitches.find(e=>e.ref.transpose||e.ref.degree);E?.ref.transpose?l(`&${E.ref.name}^$${E.ref.transpose}: transposing (^$) is for braids — in a mix, add pitch: &${E.ref.name} + ${E.ref.transpose}`,E.ref.span):E&&l(`&${E.ref.name}^${E.ref.degree}: moving by degrees (^) is for braids — in a mix, write a cell that plays it: &u step=&bar &${E.ref.name}^${E.ref.degree}`,E.ref.span);let D=/* @__PURE__ */ new Map,O=[...r.pitches,...T].map(e=>{let t=n.get(e.ref.name),r=t&&typeof t.params.play==`string`?n.get(t.params.play):void 0,i=r&&typeof r.params.write==`string`?n.get(r.params.write):void 0;return t&&r&&i&&(D.set(e,{head:t.name,tape:r.name,at:typeof t.params.at==`number`?t.params.at:0,length:typeof r.params.length==`number`?r.params.length:0,erase:typeof r.params.erase==`number`?Math.min(1,Math.max(0,r.params.erase)):1}),t=i),{t:e,c:t}}).filter(e=>e.c),k=O.filter(e=>e.c.voice);if(k.length){l(`Two sounds can't multiply (&${k[0].c.name} * &${S.name}): &${k[0].c.name} plays as a voice — mix them with + or ,`,k[0].t.ref.span);continue}let A=e=>e.c.map?.kind===`adsr`,j=e=>e.c.map?.kind===`amp`||e.c.map?.kind===`db`||e.c.map?.kind===`lin`&&!e.t.inSum,M=O.filter(A),ee=O.filter(e=>!j(e)&&!A(e)),te=O.filter(e=>j(e));if(M.length>1){l(`One envelope per note: &${M[0].c.name} and &${M[1].c.name} both shape &${S.name}`,M[1].t.ref.span);continue}let ne=M.find(e=>e.t.inSum||e.t.sign<0);if(ne){l(`&${ne.c.name} is an envelope (map=adsr): a volume, it multiplies — keep it out of pitch sums`,ne.t.ref.span);continue}let N=M[0]?wi(M[0].c):null,re=te.find(e=>e.t.sign<0);if(re){l(`&${re.c.name} is a volume (map=amp): it multiplies, it can't be subtracted`,re.t.ref.span);continue}let P=ee.filter(e=>g(e.c)),ie=P.length===0;ie&&(P=te.filter(e=>g(e.c)));let[ae,oe]=S.kit?[1,1]:mi(S.params.pan),[se,ce]=[...y].reduce(([e,t],r)=>{let[i,a]=mi(n.get(r)?.params.pan);return[e*i,t*a]},[ae,oe]),le=e=>({cell:e.c.name,pick:e.t.ref.pick,shift:e.t.ref.shift,sign:e.t.sign,...e.t===w?{picks:!0}:{}}),ue={voice:S.name,kit:S.kit,offset:r.offset,gains:[a[0]*se,a[1]*ce],parts:_.map(e=>({...e,gains:[e.gains[0]*se,e.gains[1]*ce]})),select:[],...b?{silent:!0}:{},...x?.length?{midi:x}:{},through:[...y],envelope:N,envelopeCell:M[0]?.c.name??null,via:[...c],span:i},de=new Set(T);if(P.length===0&&!S.kit&&ee.every(e=>de.has(e.t))){p.push({id:`${S.name}:${S.name}:${r.voice.span.line}:${r.voice.span.col}`,...ue,cell:S.name,pick:null,shift:0,sign:1,gate:!1,drone:!0,mods:ee.map(le),levels:te.map(le)});continue}if(P.length===0){l(O.length?`Nothing starts notes on &${S.name}: give a pitch or a volume (map=amp) step= timing (step=4n); loop= terms only bend`:`&${S.name} has nothing to play: a melody goes before it, like &melody * &${S.name}`,i);continue}if(P.length>1){let e=v(P);if(!e){l(`Both &${P[0].c.name} and &${P[1].c.name} would start notes on &${S.name}, at the same rate — make one coarser (it then holds under the other) or loop= (it then bends or shapes them)`,P[1].t.ref.span);continue}P=[e]}let{t:fe,c:pe}=P[0],me=O.find(e=>Si(e.c,e.t.ref.pick)===null);if(me){l(Ci(me.c.name,me.t.ref.pick,me.c.units.length),me.t.ref.span);continue}if(Si(pe,fe.ref.pick)===0){l(`&${pe.name} has no steps to play`,fe.ref.span);continue}!D.has(fe)&&!f.has(pe.name)&&El(n,pe,fe.ref.pick)&&u(`&${pe.name}${fe.ref.pick?pn(fe.ref.pick):``} plays only rests (~): nothing sounds on &${S.name}`,fe.ref.span),p.push({id:`${S.name}:${pe.name}:${fe.ref.span.line}:${fe.ref.span.col}`,...ue,cell:pe.name,pick:fe.ref.pick,shift:fe.ref.shift,sign:fe.sign,gate:ie,mods:ee.filter(e=>e!==P[0]).map(le),levels:te.filter(e=>e!==P[0]).map(le),...D.has(fe)?{tape:D.get(fe)}:{}})}let y=e=>p.some(t=>t.voice===e&&(t.parts.length||t.silent)),b=p.find(e=>e.midi&&!e.parts.length&&!e.silent&&!e.kit&&!y(e.voice)&&Object.keys(t.get(e.voice)?.params??{}).some(e=>X.has(e)));if(b){let e=t.get(b.voice),n=Object.keys(e.params).filter(e=>X.has(e));u(`&${b.voice} is only on a MIDI card: its sound (${n.map(e=>`${e}=`).join(` `)}) is heard here but isn't sent — MIDI carries its notes, velocity and bends; the device makes its own`,e.paramSpans[n[0]]??e.span)}return i.length===0&&a.length===0&&c.cells.length>0&&!c.broken?.length&&u(`Nothing plays yet — write a sound: a voice alone plays its own pitch (&a loop=A4), a melody plays on one ([&melody * &a])`,Ds),{outputs:p,returns:m,resonances:h}}function El(e,t,n,r=[]){if(r.includes(t.name)||t.frees.some(e=>e.key===`braid`))return!1;let i=xi(t.units.length,n,t.shift);if(!i?.length)return!1;let a=n=>{if(n.kind===`rest`)return!0;if(n.kind===`seq`)return z(n).every(a);let i=n.kind===`ref`?e.get(n.name):void 0;return!!i&&n.kind===`ref`&&El(e,i,n.pick,[...r,t.name])};return i.every(e=>a(t.units[e].atom))}function Dl(e){let t=new Map(e),n=/* @__PURE__ */ new Map;for(let e of t.values())(e.root||e.over)&&n.set(e.name,e.root?e.name:e.over);for(let e=!0,r=0;e&&r<64;r++){e=!1;for(let r of t.values()){let t=n.get(r.name);if(t)for(let i of r.children.keys())n.has(i)||(n.set(i,t),e=!0)}}for(let e of t.values())t.set(e.name,{...e,context:n.get(e.name)??`fifths12TET`});for(let e of t.values()){if(typeof e.params.body!=`string`)continue;let n=[];for(let r of e.units.flatMap(e=>z(e.atom)))if(r.kind===`note`)n.push({shift:r.value+r.alter,params:{}});else if(r.kind===`ref`){let e=t.get(r.name);if(e)for(let t of e.units)t.atom.kind===`note`&&n.push({shift:t.atom.value+t.atom.alter,params:e.params})}else if(r.kind===`chord`)for(let[e,t]of r.notes.entries())n.push({shift:t+r.alters[e],params:{}});t.set(e.name,{...e,exciters:n.length?n:Array.from({length:12},(e,t)=>({shift:t,params:{}}))})}return t}let Ol=[`restart`,`resume`,`free`];function kl(e,{decls:t,implicit:n,sections:r},i,a,o,s=/* @__PURE__ */ new Map,c=/* @__PURE__ */ new Set){let{warn:l}=e,u=new Set([...i.values()].flatMap(e=>typeof e.params.fm==`string`?[e.params.fm]:[])),d=e=>{let t=/* @__PURE__ */ new Set;return e.voice&&t.add(`voice`),a.get(e.name)&&!a.get(e.name).belt&&t.add(`clock`),e.step&&t.add(`driven`),typeof e.params.motor==`number`&&t.add(`motor`),typeof e.params.write==`string`&&t.add(`tape`),typeof e.params.play==`string`&&t.add(`head`),typeof e.params.body==`string`&&t.add(`resonator`),typeof e.params.scope==`string`&&t.add(`scope`),typeof e.params.law==`string`&&t.add(`law`),e.gate&&t.add(`gate`),e.sink&&t.add(`card`),e.note&&t.add(`note`),typeof e.params.fm==`string`&&t.add(`carrier`),u.has(e.name)&&t.add(`modulator`),r.has(e.name)&&t.add(`section`),e.over&&([...r.values()].includes(e.over)||s.has(e.over))&&t.add(`selector`),[...s.values()].some(t=>t.includes(e.name))&&t.add(`performer`),t},f=new Set([...t.values()].flatMap(e=>e.swingFrom?[e.swingFrom.name]:[]));for(let r of t.values()){let t=i.get(r.name);if(!t||n.has(r.name))continue;let a=r.show?.split(`:`)[0];a&&!io.includes(a)&&!o.has(a)&&e.error(`show=${a}: not a show (${io.join(` `)}), not one of the built-in plugins (${[...o.values()].filter(e=>e.builtin).map(e=>e.name).join(` `)}), and the piece carries no plugin of that name (${jo})`,r.span);let s=d(t),u=[...Object.keys(r.params).map(e=>[e,r.paramSpans[e]??r.span]),...Object.entries(r.paramCells??{}).map(([e,t])=>[e,t.span]),...Object.entries(r.paramClocks??{}).map(([e,t])=>[e,t.span]),...[`env`,`pitch`,`title`].filter(e=>r[e]).map(e=>[e,e===`title`?r.span:r[e].span])];for(let[e,n]of u){let i=qr[e];c.has(r.name)&&X.has(e)||(e===`anchor`&&s.has(`law`)?l(`anchor= sets the clock a law reads, not the law: write it on ${t.over?`&${t.over}`:`its day (over=&day, a clock loop=1d)`} — the law on &${r.name} doesn't read it`,n):e===`pan`&&(t.mix||t.sink||hi(t))?l(`pan= places a voice: on ${t.sink?`the sound card`:hi(t)?`a MIDI card`:`the mix &${r.name}`} it does nothing — put it on the voice (&voice pan=${r.params.pan})`,n):e===`pan`&&typeof r.params.pan==`number`&&(r.params.pan<0||r.params.pan>1)?l(`pan=${r.params.pan}: pan runs from 0 (left) to 1 (right); ${r.params.pan<0?`this plays hard left`:`this plays hard right`}`,n):i?.on&&!i.on.some(e=>s.has(e))&&!(e===`swing`&&f.has(r.name))?l(`${e}= acts on ${$r(i.on)}: on &${r.name} it does nothing`,n):e===`restart`&&!Ol.includes(r.params.restart)?l(`restart=${r.params.restart}: what switching a part on does to its time is restart, resume or free — this plays as restart`,n):i?.value===`number`&&!t.voice&&typeof r.params[e]==`string`&&l(`${e}= takes a number: '${r.params[e]}' does nothing`,n))}if(r.gate){let e=r.step?r.step.whole?`loop`:`step`:null;for(let[t,n]of[[`over`,r.over?.span],[e,r.step?.span],[`shift`,r.shift===null?void 0:r.paramSpans.shift],[`stride`,r.stride===null?void 0:r.paramSpans.stride],[`map`,r.map?.span],[`cycle`,r.cycle===null?void 0:r.span]])t&&n&&l(`${t}= on a gate does nothing: a gate plays with each note of play=&${r.gate.notes}, so it times and reads nothing itself — put it on &${r.gate.notes}`,n);r.gate.gain<0&&l(`${r.gate.port===`trigger`?`gain`:`level`}=${r.gate.gain}: a level is 0 or more, and a negative one doesn't play softer — write ${-r.gate.gain}`,r.paramSpans[r.gate.port===`trigger`?`gain`:`level`]??r.span)}}let p=new Set([...t.values()].flatMap(e=>e.show?[e.show.split(`:`)[0]]:[]));for(let e of o.values())!e.builtin&&!p.has(e.name)&&l(`the piece carries the plugin "${e.name}", but no cell says show=${e.name}`,{line:e.line,col:1,len:`=== plugin ${e.name} ===`.length})}let Al=e=>Number.isFinite(e)?Math.round(e).toLocaleString(`en`):`unboundedly many`,jl=e=>e.lambda?`An unnamed cell &( … )`:`&${e.name}`;function Ml(e,t,n,r,i){let{error:a,warn:o}=e,s=/* @__PURE__ */ new Map,c=/* @__PURE__ */ new Set,l=e=>{let t=s.get(e);if(t)return t;if(c.has(e))return[];c.add(e);let r=(n.get(e)?.units??[]).map(e=>Vt(e,e=>e.kind===`note`||e.kind===`choice`?1:e.kind===`chord`?e.notes.length:e.kind===`ref`?u(e.name,e.pick):0));return c.delete(e),s.set(e,r),r},u=(e,t=null)=>{let n=l(e);return(bi(n.length,t)??[]).reduce((e,t)=>e+n[t],0)},d=/* @__PURE__ */ new Set;for(let e of n.values()){if(e.implicit)continue;let n=l(e.name),r=n.reduce((e,t)=>e+t,0);if(r<=5e4||(d.add(e.name),e.units.some(e=>e.atom.kind===`ref`&&u(e.atom.name,e.atom.pick)>5e4)))continue;let i=t.get(e.name),o=i?.braid.kind===`list`?i.braid.tokens:[],s=0,c=o[n.findIndex(e=>(s+=e)>5e4)]?.span??e.span;a(`${jl(e)} expands to ${Al(r)} notes: more than ${Al(ui)}, the most a cell can hold — repeat less (!n), or let a clock repeat it`,c)}let f=/* @__PURE__ */ new Set,p=/* @__PURE__ */ new Map;for(let e of i){let i=n.get(e.cell);if(!i?.clock||d.has(i.name)||f.has(i.name)||i.params.law!==void 0)continue;let o=r.get(i.clock);if(!o)continue;let s=Math.max(1,i.steps),c=o.perSecond*i.rate*u(i.name)/s,l=o.tap?.meter??i.clock;if(c>(p.get(l)??0)&&p.set(l,c),!(c>2e3))continue;f.add(i.name);let m=t.get(i.name)?.step?.span??t.get(i.clock)?.step?.span??i.span;a(`${jl(i)} would start ${Al(c)} notes a second: more than ${Al(di)}, the most a cell can play — slow its step= or loop=`,m)}let m=/* @__PURE__ */ new Set;for(let e of n.values()){let t=r.get(e.name);t&&!p.has(e.name)&&e.frees.some(e=>e.key===`step`||e.key===`loop`)&&(p.set(e.name,t.perSecond*u(e.name)/Math.max(1,e.steps)),m.add(e.name))}for(let[e,t]of p){let r=n.get(e);if(!r||!(t>0)||!Number.isFinite(t))continue;let i=e=>Math.floor(e.value*di/t),a=r.frees.filter(e=>(e.key===`step`||e.key===`loop`)&&e.value>0&&e.hi>i(e)&&i(e)>=e.value);if(a.length){r.frees=r.frees.map(e=>a.includes(e)?{...e,hi:i(e)}:e);for(let t of a)o(m.has(e)?`${t.key}=free(…): moved up to ${Al(t.hi)}, &${e} would move what it moves more than ${Al(di)} times a second, the most a cell can play: the slider stops at ${Al(i(t))}`:`${t.key}=free(…): moved up to ${Al(t.hi)}, a cell &${e} clocks would start more than ${Al(di)} notes a second, the most a cell can play: the slider stops at ${Al(i(t))}`,t.span)}}}function Nl(e,t,n){if(!n.size)return[...e];let r=e=>[...t.values()].filter(t=>t.over===e&&t.clock);return e.map(e=>{let i=t.get(e.cell);for(let a=0;i?.step&&a<32;a++){let a=i.step.driver,o=n.get(a);if(o){let n=t.get(o).units.findIndex(e=>e.atom.kind===`ref`&&e.atom.name===a),i=r(o).map(e=>({cell:e.name,entry:n,part:a})),s=[.../* @__PURE__ */ new Set([...e.via,...i.map(e=>e.cell),o,a])];return i.length?{...e,via:s,select:[...e.select,...i]}:e}i=t.get(a)}return e})}function Pl(e){let t=new Map(e.cells.map(e=>[e.name,e.map?.kind??(e.style?`style`:null)]));t.has(`style`)||t.set(Lt,`style`);let n=[],r=(e,r)=>{let{slot:i,...a}=e,o=a.name,s=a.span??r.span;if(!t.has(o))return{...a,pick:null};let c=t.get(o),l=c?It[c]:void 0,u=l?.indexOf(i)??-1;return u>=0?{...a,pick:{kind:`at`,i:u,abs:!0}}:(n.push({severity:`error`,message:l?`&${o}[${i}]: &${o} (map=${c}) has no slot ${i}; its slots are ${l.join(`, `)}`:`&${o}[${i}]: &${o}'s map names no slots (${c?`map=${c}`:`it has no map=`}); pick by position (&${o}[$0]), name the slots with map=${Object.keys(It).join(` or map=`)}, or give it a style= (its axes)`,span:s}),{...a,pick:null})},i=(e,t)=>{if(Array.isArray(e)){let n=!1,r=e.map(e=>{let r=i(e,t);return r!==e&&(n=!0),r});return n?r:e}if(typeof e!=`object`||!e)return e;let n=e,a=null;for(let[e,r]of Object.entries(n)){let o=i(r,t);o!==r&&((a??={...n})[e]=o)}let o=a??n;return typeof o.slot==`string`&&typeof o.name==`string`?r(o,t):o},a=!1,o=e.cells.map(e=>{let t=i(e,e);return t!==e&&(a=!0),t});return a?{...e,cells:o,diagnostics:[...e.diagnostics,...n]}:e}function Fl(e){let t=new Set(e.cells.map(e=>e.name)),n=/* @__PURE__ */ new Map,r=[];for(let i of e.cells){let e=i.params.play??i.params.trigger;if(typeof e!=`string`||i.braid.kind===`blank`||t.has(e)||n.has(e))continue;let a=Ro(`&${e} step=1m ~`).cells[0];if(!a)continue;let o=i.paramSpans.play??i.paramSpans.trigger??i.span;n.set(e,{...a,span:o}),r.push({severity:`info`,message:`&${i.name} plays &${e}, which no line writes: it rests`,span:o})}return n.size?{parsed:{...e,cells:[...e.cells,...n.values()],diagnostics:[...e.diagnostics,...r]},rested:new Map([...n].map(([e,t])=>[e,t.span]))}:{parsed:e,rested:/* @__PURE__ */ new Map}}function Il(e,t,n,r,i,a=/* @__PURE__ */ new Set){if(![...t.values()].some(e=>e.gate))return;let o=/* @__PURE__ */ new Set,s=(e,t)=>{if(typeof e==`string`){o.add(e);return}if(e&&typeof e==`object`&&!t.has(e)){if(t.add(e),e instanceof Map)for(let[n,r]of e)s(n,t),s(r,t);else if(e instanceof Set)for(let n of e)s(n,t);else for(let n of Object.values(e))s(n,t)}};for(let e of n.values()){let{name:t,...n}=e;s(n,/* @__PURE__ */ new Set)}s(r,/* @__PURE__ */ new Set);for(let e of t.values())e.gate&&s(e.gate,/* @__PURE__ */ new Set);for(let t of n.values())t.clock&&t.units.length&&!o.has(t.name)&&!i.has(t.name)&&!e.broken.has(t.name)&&!a.has(t.name)&&e.info(`&${t.name} is written and nothing plays or reads it: it is silent (a part no performer plays)`,t.span)}let Ll=[`lpf`,`lpq`,`hpf`,`hpq`,`bpf`,`bpq`,`ftype`,`room`,`delay`,`delaytime`,`delayfeedback`],Rl=[...Ll,`pan`,`distort`,`crush`,`drive`],zl=(e,t)=>new Set(e.flatMap(e=>e.through).filter(e=>!!t.get(e)?.mix));function Bl(e){let t=/* @__PURE__ */ new Map;for(let n of Object.keys(e.params))X.has(n)&&t.set(n,e.paramSpans[n]??e.span);for(let[n,r]of Object.entries(e.paramCells??{}))X.has(n)&&t.set(n,r.span);for(let[n,r]of Object.entries(e.paramClocks??{}))X.has(n)&&t.set(n,r.span);return t}let Vl=(e,t)=>t in e.params||t in e.paramCells||t in e.paramClocks;function Hl(e,t,n,r,i){let{error:a}=e,o=zl(r,n),s=/* @__PURE__ */ new Map;for(let e of o){let n=t.get(e);if(!n)continue;let r=Bl(n);for(let[t,n]of r)Rl.includes(t)||a(`${t}= is a voice's: an instrument (&${e}) processes what its voices play, with ${Ll.slice(0,4).map(e=>`${e}=`).join(` `)} …; put ${t}= on a voice`,n);let i=[...r.keys()].filter(e=>Ll.includes(e));i.length&&s.set(e,i)}if(!s.size)return n;let c=e=>{let r=n.get(e),i=t.get(e)?.over?.name,a=r?.kit?r:i&&n.get(i)?.kit?n.get(i):null;return a?Oc(a):[e]},l=/* @__PURE__ */ new Map;for(let[e,t]of i)for(let r of t)for(let t of c(e)){let e=n.get(t);if(!e)continue;let i=/* @__PURE__ */ new Map;for(let t of[...r].reverse())for(let n of s.get(t)??[])!Vl(e,n)&&!i.has(n)&&i.set(n,t);l.has(t)||l.set(t,[]),l.get(t).push(i)}let u=(e,t)=>e.size===t.size&&[...e].every(([e,n])=>t.get(e)===n),d=new Map(n);for(let[e,t]of l){let r=t[0];if(!r.size||!t.every(e=>u(e,r)))continue;let i=n.get(e),a={...i.params},o={...i.paramCells},s={...i.paramClocks};for(let[e,t]of r){let r=n.get(t);e in r.params&&(a[e]=r.params[e]),e in r.paramCells&&(o[e]=r.paramCells[e]),e in r.paramClocks&&(s[e]=r.paramClocks[e])}d.set(e,{...i,params:a,paramCells:o,paramClocks:s,voice:!0,inherited:Object.fromEntries(r)})}return d}let Ul=e=>new Map([...Lo,...e.plugins??[]].map(e=>[e.name,e]));function Wl(e,t,n=/* @__PURE__ */ new Set){let{parsed:r,rested:i}=Fl(Pl(e)),a=xs(r,t);for(let[e,t]of i)a.unknown.set(e,[t]);let o=Dc(a,Ns(a),n),{decls:s,builtin:c}=o,l=bc(a,s),u=yc(a,s),d=lc(a,s),f=pl(a,s,sl(a,o,l,u),l),p=bl(a,s,f.cells),{clocks:m}=p;xl(a,s,p.cells,o.sections,d),dc(a,s,p.cells,d);let h=Tl(a,s,p.cells,m,f),{returns:g,resonances:_}=h,v=uc(Nl(h.outputs,p.cells,o.sections),p.cells,d);Ml(a,s,p.cells,m,v),Il(a,s,p.cells,v,m,new Set(r.offers??[]));let y=Dl(Hl(a,s,p.cells,v,f.playings));kl(a,o,y,m,Ul(r),d,zl(v,y));let b=sc(a,s,o.implicit),{diagnostics:x}=a,S=!x.some(e=>e.severity===`error`);x.sort((e,t)=>e.span.line-t.span.line||e.span.col-t.span.col);let C=(e,t)=>e.line-t.line||e.col-t.col,w=[...a.unknown].map(([e,t])=>({name:e,at:[...t].sort(C)})).sort((e,t)=>C(e.at[0],t.at[0])),T=new Set([...y.values()].filter(e=>e.off).map(e=>`cell:${e.name}`)),E=(e,t,n)=>typeof e.params[t]==`number`?e.params[t]:n;return{ok:S,cells:y,clocks:m,outputs:v,off:T,diagnostics:x,unknown:w,tapes:[...y.values()].filter(e=>typeof e.params.write==`string`&&!!y.get(e.params.write)?.mix).map(e=>({name:e.name,source:e.params.write,length:E(e,`length`,0),erase:Math.min(1,Math.max(0,E(e,`erase`,1))),tone:E(e,`tone`,7e3),drive:E(e,`drive`,.15),hiss:E(e,`hiss`,0),print:E(e,`print`,0),printgap:E(e,`printgap`,.6),dropout:E(e,`dropout`,0),heads:[...y.values()].filter(t=>t.params.play===e.name).map(e=>({head:e.name,at:E(e,`at`,0),wander:E(e,`wander`,0),wanderhz:E(e,`wanderhz`,.2)}))})),returns:g,resonances:_,plugins:Ul(r),performers:b,sections:o.sections,...p.mainMeter?{mainMeter:p.mainMeter}:{},...o.mainKey?{mainKey:o.mainKey}:{},...c?{builtinCard:c}:{}}}function Gl(e,t,n){let r=e.cells.get(t);return r?r.root?r.cycle:r.scan?r.scan.lap:e.cells.get(r.over??n??r.context)?.cycle??12:12}function Kl(e,t,n,r){return ql(e.cells.get(t).units,n,()=>Gl(e,t,r))}function ql(e,t,n){let r=e.length;if(r===0||t===0)return[...e];let i=n(),a=Math.floor(t/r),o=t-a*r;return Array.from({length:r},(t,n)=>{let s=e[(n+o)%r],c=i*(a+ +(n+o>=r));if(c===0)return s;let l=Bt(s.atom,e=>e.kind===`note`?{...e,value:e.value+c}:e.kind===`choice`?{...e,values:e.values.map(e=>e+c)}:e.kind===`chord`?{...e,notes:e.notes.map(e=>e+c)}:e);return l===s.atom?s:{...s,atom:l}})}let Jl=/* @__PURE__ */ new WeakMap;function Yl(e,t){let n=e.cells.get(t);if(!n.units.some(e=>e.atom.kind===`seq`))return n.units;let r=Jl.get(e);r||Jl.set(e,r=/* @__PURE__ */ new Map);let i=r.get(t);return i||r.set(t,i=n.units.flatMap(e=>e.atom.kind===`seq`?z(e.atom).map(e=>({atom:e,repeat:1,subdivide:1,elongate:1})):[e])),i}let Xl=(e,t)=>{let n=Yl(e,t);return n.length>0&&n.every(e=>e.atom.kind===`chord`)},Zl=/* @__PURE__ */ new WeakMap;function Ql(e,t,n,r=!1){let i=Zl.get(e);i||Zl.set(e,i=/* @__PURE__ */ new Map);let a=r&&Xl(e,t),o=`${t}|${n}${a?`|in force`:``}`,s=i.get(o);if(s)return s;let c=[],l=ql(Yl(e,t),n,()=>Gl(e,t));for(let e of(a?l.slice(0,1):l).flatMap(e=>z(e.atom)))e.kind===`note`?c.push({value:e.value,alter:e.alter}):e.kind===`chord`&&e.notes.forEach((t,n)=>c.push({value:t,alter:e.alters[n]}));return i.size>=256&&i.delete(i.keys().next().value),i.set(o,c),c}function $l(e,t,n,r,i=0){let a=e.cells.get(t);if(a.root)return{value:n+r(t)+i,alter:0};let o=Ql(e,t,r(t)+i,!0);if(o.length===0)return{value:0,alter:0};if(a.wrap===0)return o[0];let s=Math.floor(n),c=Math.floor(s/o.length),l=a.wrap===null||a.step?.tap?c:hr(c,a.wrap),u=o[s-c*o.length];return{value:u.value+l*Gl(e,t),alter:u.alter}}function eu(e,t,n,r,i,a){let o=[],s=t,c=n,l=r,u=i;for(let t=0;t<64;t++){let t=e.cells.get(s);if(!t)return{root:s,position:l,path:o};if(t.root){let e=l+u+a(s)+c;return o.push({cell:s,index:Math.round(e)}),{root:s,position:e,path:o}}o.push({cell:s,index:Math.floor(l+c)});let n=$l(e,s,l,a,c);l=n.value+u,u=n.alter,c=t.over?t.overShift:0,s=t.over??t.context}return{root:s,position:l,path:o}}function tu(e,t,n){let r=e.cells.get(t);if(r?.map?.kind===`ratios`){let e=r.map.ratios,t=e.length-1,i=e[t]/e[0],a=Math.floor(n/t),o=n-a*t,s=Math.floor(o),c=o-s,l=(e[s]/e[0])**(1-c)*(e[s+1]/e[0])**+c;return 12*Math.log2(i**+a*l)}let i=r?.map?.kind===`edo`?r.map.period:2;return n*12*Math.log2(i)/(r?.cycle??12)}function nu(e,t,n){let r=e.cells.get(t),i=2**(n/12);if(r?.map?.kind===`ratios`){let e=r.map.ratios,t=e.map(t=>t/e[0]),n=t.length-1,a=Math.floor(Math.log(i)/Math.log(t[n])+1e-9),o=i/t[n]**+a,s=0;for(;s<n-1&&t[s+1]<=o+1e-12;)s++;let c=Math.log(o/t[s])/Math.log(t[s+1]/t[s]);return a*n+s+c}let a=r?.map?.kind===`edo`?r.map.period:2;return n*(r?.cycle??12)/(12*Math.log2(a))}function ru(e,t){let n=[],r=t;for(let t=0;r!==null&&t<64;t++){n.push(r);let t=e.cells.get(r);r=!t||t.root?null:t.over??t.context}return n}let iu=(e,t,n)=>!!n&&!n.abs&&au(e,t,n),au=(e,t,n)=>!!n&&e.cells.get(t).units.every(e=>e.atom.kind===`note`&&e.repeat===1&&e.subdivide===1&&e.chance===void 0);function ou(e,t){let n=t;for(let t=0;t<64;t++){let t=e.cells.get(n);if(!t||t.root)return n;n=t.over??t.context}return n}let su=.15,cu=(e,t)=>{let n=null;for(let r of e)r.t<=t&&(n=r);return n&&n.speed!==null&&t<=n.t+.35?n.speed:null},lu=/* @__PURE__ */ new WeakMap,uu=(e,t)=>{let n=lu.get(e);return n||lu.set(e,n=/* @__PURE__ */ new Set),n.add(t),t},du=[],fu=e=>du.push(e),Q=.002,pu=3600,mu=/* @__PURE__ */ new WeakMap;function hu(e,t){let n=mu.get(e);return n||mu.set(e,n=/* @__PURE__ */ new Map),n.has(t)||n.set(t,gu(e,t)),n.get(t)}function gu(e,t){let n=e.cells.get(t),r=(e,t)=>typeof n?.params[e]==`number`?n.params[e]:t;if(!n||typeof n.params.motor!=`number`)return null;let i=Math.max(1e-6,r(`motor`,1)),a=Math.max(1e-6,r(`mass`,1)),o=Math.max(0,r(`friction`,0));for(let n of e.cells.values())n.name!==t&&n.step?.driver===t&&(typeof n.params.mass==`number`&&(a+=n.params.mass),typeof n.params.friction==`number`&&(o+=n.params.friction));let s=r(`wind`,1/0),c=r(`wow`,0),l=[0],u=[0],d=0,f=!1,p=[],m=e=>{for(;!f&&(l.length-1)*Q<Math.min(e,pu);){let e=(l.length-1)*Q,t=Number.isFinite(s)?Math.max(0,1-(e/s)**4):1,n=1+c*Math.sin(2*Math.PI*.55*e),r=cu(p,e);d+=(i*(n-d)*t-o*d)/a*Q,r!==null&&(d+=(r-d)*su),Number.isFinite(d)||(d=0),d<0&&r===null&&(d=0),l.push(l[l.length-1]+d*Q),u.push(d),t===0&&r===null&&d<.02&&(f=!0)}},h=e=>{let t=Math.max(1,Math.floor(e/Q));t>=l.length||(l.length=t+1,u.length=t+1,d=u[t],f=!1)},g=()=>({t:(l.length-1)*Q,s:l[l.length-1]});return uu(e,{grab(e,t){h(e),p.push({t:e,speed:t})},cut:h,speed(e){let t=.01;return Math.max(0,(this.nominal(e+t)-this.nominal(Math.max(0,e-t)))/(e+t-Math.max(0,e-t)))},stopsAt(){return Number.isFinite(s)?(m(pu),f?(l.length-1)*Q:null):null},nominal(e){if(e<=0)return 0;m(e+Q);let t=e/Q;if(t>=l.length-1){let t=g();return f?t.s:t.s+(e-t.t)*d}let n=Math.floor(t);return l[n]+(l[n+1]-l[n])*(t-n)},real(e){if(e<=0)return 0;let t=(l.length-1)*Q+60;for(;!f&&l[l.length-1]<e&&(l.length-1)*Q<Math.min(pu,t);)m((l.length-1)*Q+10);if(l[l.length-1]<e){if(f||d<=1e-9)return 1/0;let t=g();return t.t+(e-t.s)/d}let n=0,r=l.length-1;for(;r-n>1;){let t=n+r>>1;l[t]<e?n=t:r=t}let i=l[r]-l[n];return(n+(i>0?(e-l[n])/i:0))*Q}})}function _u(e,t,n,r,i,a){let o=[0],s=[{y:0,v:0,off:0,px:0,stretch:0,slipping:!1}],c=0,l=!1,u=[],d=e=>{for(;!l&&(o.length-1)*Q<Math.min(e,pu);){let e=(o.length-1)*Q,d=s[s.length-1],{y:f,v:p,off:m}=d,h=a(e+Q),g=(h-d.px)/Q,_=h-m-f,v=!1;if(t*Math.abs(_)>i){let e=Math.sign(_)*i/t;m+=_-e,_=e,v=!0}let y=cu(u,e);p+=(t*_+r*(g-p))/n*Q,y!==null&&(p+=(y-p)*su),Number.isFinite(p)||(p=0),f+=p*Q,o.push(Math.max(o[o.length-1],f)),s.push({y:f,v:p,off:m,px:h,stretch:_,slipping:v}),c=Math.abs(g)<1e-6&&Math.abs(p)<1e-4&&Math.abs(_)<1e-4&&y===null?c+Q:0,c>.5&&(l=!0)}},f=e=>{let t=Math.max(1,Math.floor(e/Q));t>=o.length||(o.length=t+1,s.length=t+1,c=0,l=!1)},p=e=>{if(e<=0)return 0;d(e+Q);let t=Math.min(e/Q,o.length-1),n=Math.floor(t);return n>=o.length-1?o[o.length-1]:o[n]+(o[n+1]-o[n])*(t-n)},m={nominal:p,real(e){if(e<=0)return 0;let t=(o.length-1)*Q+60;for(;!l&&o[o.length-1]<e&&(o.length-1)*Q<Math.min(pu,t);)d((o.length-1)*Q+10);if(o[o.length-1]<e)return 1/0;let n=0,r=o.length-1;for(;r-n>1;){let t=n+r>>1;o[t]<e?n=t:r=t}let i=o[r]-o[n];return(n+(i>0?(e-o[n])/i:0))*Q},stopsAt:()=>null,speed(e){let t=.01;return Math.max(0,(p(e+t)-p(Math.max(0,e-t)))/(e+t-Math.max(0,e-t)))},grab(e,t){f(e),u.push({t:e,speed:t})},cut:f,state(e){if(e<=0)return{stretch:0,slipping:!1};d(e+Q);let t=Math.min(Math.floor(e/Q),s.length-1),n=!1;for(let e=Math.max(0,t-50);e<=t;e++)s[e].slipping&&(n=!0);return{stretch:s[t].stretch,slipping:n}}};return e?uu(e,m):m}let vu=1e-9;function yu(e,t,n){if(t.tap)return Su(t.tap,xu(e,e.clocks.get(t.tap.meter),n),Cu(e,t.tap.meter));let r=xu(e,t,n);return t.swung?bu(t.swung,r):r}function bu(e,t,n){let r=Math.max(1,e.length),i=(t,i)=>t<r?(n?n(i):e)[t]:r,a=e=>{let t=Math.floor(e),n=Math.floor(t/r),a=t-n*r;return n*r+i(a,n)+(e-t)*(i(a+1,n)-i(a,n))},o=e=>{let t=Math.floor(e/r),n=e-t*r,a=0;for(;a+1<r&&i(a+1,t)<=n;)a++;let o=i(a+1,t)-i(a,t);return t*r+a+(o>0?(n-i(a,t))/o:0)};return{beats:t.beats,q:e=>t.q(a(e)),stepAt:e=>o(t.stepAt(e)),...t.speed?{speed:t.speed}:{}}}function xu(e,t,n,r){if(!t.positional&&t.swing!==void 0){let e=Math.min(.95,Math.max(.05,t.swing)),n=t.perSecond;return{beats:1,q:t=>{let r=Math.floor(t/2),i=t/2-r;return(2*r+2*(i<.5?i/.5*e:e+(i-.5)/.5*(1-e)))/n},stepAt:t=>{let r=t*n/2,i=Math.floor(r),a=r-i;return 2*(i+(a<e?a/e*.5:.5+(a-e)/(1-e)*.5))}}}if(!t.positional)return{beats:1,q:e=>e/t.perSecond,stepAt:e=>e*t.perSecond};let i=t.cell,a=e.cells.get(i)?.bend,o=a?[...a.positions]:Kl(e,i,n(i)).flatMap(e=>e.atom.kind===`note`?[e.atom.value+e.atom.alter]:[]),s=Math.max(1,o.length),c=a?a.lap:Gl(e,i),l=s/t.perSecond;if(a&&r){let e=e=>{let t=Math.floor(e/s),n=r(t,t*l);return t+n.positions[e-t*s]/n.lap},t=t=>{let n=Math.floor(t),r=e(n);return(r+(t-n)*(e(n+1)-r))*l};return{beats:s,q:t,stepAt:e=>{let n=Math.floor(e/l)*s;for(;t(n+1)<=e;)n++;for(;n>0&&t(n)>e;)n--;let r=t(n),i=t(n+1);return n+(i>r?(e-r)/(i-r):0)}}}let u=e=>o[hr(e,s)]+c*Math.floor(e/s),d=e=>{let t=Math.floor(e),n=u(t);return(n+(e-t)*(u(t+1)-n))/c*l},f=d(0),p=e=>d(e)-f;return{beats:s,q:p,stepAt:e=>{let t=Math.floor(e/l)*s;for(;p(t+1)<=e;)t++;for(;t>0&&p(t)>e;)t--;let n=p(t),r=p(t+1);return t+(r>n?(e-n)/(r-n):0)}}}function Su(e,t,n=null){let r=n?ju(e,t,n):null;if(r)return r;let{positions:i,lap:a}=e,o=Math.max(1,i.length);if(i.every((e,t)=>Math.abs(e-t*a/o)<1e-9))return{beats:o,q:e=>t.q(e*a/o),stepAt:e=>t.stepAt(e)*o/a,...t.speed?{speed:t.speed}:{}};let s=e=>e<o?i[e]:a,c=e=>{let t=Math.floor(e),n=Math.floor(t/o),r=t-n*o;return n*a+s(r)+(e-t)*(s(r+1)-s(r))};return{beats:o,q:e=>t.q(c(e)),stepAt:e=>{let n=t.stepAt(e),r=Math.floor(n/a),i=n-r*a,c=0;for(;c+1<o&&s(c+1)<=i;)c++;let l=s(c+1)-s(c);return r*o+c+(l>0?(i-s(c))/l:0)},...t.speed?{speed:t.speed}:{}}}function Cu(e,t,n){let r=e.cells.get(t)?.meter??void 0,i=r?Bi(r):null;if(!r||!i)return null;let a=Ei(r),o=Math.max(1,r.levels.length),s=e=>n?n(Math.floor(e/o+1e-9)):r,c=e=>Vi(s(e),e/a)*a,l=e=>Hi(s(e),e/a)*a,u=Math.min(...r.swing.map(e=>e.whole*r.unit)),d=e=>{let t=Math.log2(e/a/u);return Math.abs(t-Math.round(t))<1e-9};return{S:c,W:l,at:(e,t)=>d(t)?c(e):zi(s(e),e/a,t/a)*a,grain:u*a}}function wu(e,t,{S:n,at:r},i){let{positions:a,lap:o}=e,s=e.written??a,c=e.grids??[],l=Math.max(1,a.length),u=e=>e<l?s[e]:o,d=(e,t)=>t<l?i(e*o+u(t),c[t]??0)-e*o:o,f=(e,t)=>{let i=Math.floor(e),a=Math.floor(i/l),s=i-a*l;if(e===i)return a*o+d(a,s);let c=a*o+u(s)+(e-i)*(u(s+1)-u(s));return t!==void 0&&t>0?r(c,t*(u(s+1)-u(s))):n(c)};return{beats:l,q:(e,n)=>t.q(f(e,n)),stepAt:e=>{let r=t.stepAt(e),i=Math.floor(r/o),a=r-i*o,s=0;for(;s+1<l&&d(i,s+1)<=a;)s++;let c=i*o+u(s),f=i*o+u(s+1);if(f<=c||a<=d(i,s))return i*l+s;let p=0,m=1;for(let e=0;e<52;e++){let e=(p+m)/2;n(c+e*(f-c))-i*o<=a?p=e:m=e}return i*l+s+p},...t.speed?{speed:t.speed}:{}}}let Tu=/* @__PURE__ */ new WeakMap,Eu=/* @__PURE__ */ new WeakMap,Du=/* @__PURE__ */ new WeakMap,Ou=/* @__PURE__ */ new WeakMap,ku=!1;function Au(e,t,n){let r=Tu.get(e);r||Tu.set(e,r=/* @__PURE__ */ new WeakMap),r.set(t,n),Lu.get(e)?.delete(t),Eu.get(e)?.delete(t),Du.get(e)?.delete(t)}function ju(e,t,{S:n,at:r}){let{positions:i,lap:a}=e,o=e.written??i,s=Math.max(1,i.length);if(!i.every((e,t)=>Math.abs(n(o[t])-e)<1e-9))return null;let c=e=>e<s?o[e]:a,l=e=>e<s?i[e]:a,u=(e,t)=>{let i=Math.floor(e),o=Math.floor(i/s),u=i-o*s;if(e===i)return o*a+l(u);let d=c(u)+(e-i)*(c(u+1)-c(u));return o*a+(t!==void 0&&t>0?r(d,t*(c(u+1)-c(u))):n(d))};return{beats:s,q:(e,n)=>t.q(u(e,n)),stepAt:e=>{let r=t.stepAt(e),i=Math.floor(r/a),o=r-i*a,u=0;for(;u+1<s&&l(u+1)<=o;)u++;let d=c(u),f=c(u+1);if(f<=d||o<=l(u))return i*s+u;let p=0,m=1;for(let e=0;e<52;e++){let e=(p+m)/2;n(d+e*(f-d))<=o?p=e:m=e}return i*s+u+p},...t.speed?{speed:t.speed}:{}}}function Mu(e){let t=Nu.get(e);if(t)return t;Nu.set(e,t=/* @__PURE__ */ new Set);let n=r=>{if(t.has(r))return;t.add(r);let i=e.cells.get(r);for(let t of i?.children.keys()??[]){let r=i.units.flatMap(e=>e.atom.kind===`ref`&&e.atom.name===t?[e.atom]:[]);(!r.length||!r.every(n=>au(e,t,n.pick)))&&n(t)}};for(let t of e.outputs)for(let e of[...t.drone?[]:[t],...t.mods,...t.levels])n(e.cell);return t}let Nu=/* @__PURE__ */ new WeakMap,Pu=/* @__PURE__ */ new WeakMap;function Fu(e){let t=Pu.get(e);if(t)return t;Pu.set(e,t=/* @__PURE__ */ new Set);for(let n of e.cells.values()){n.root&&t.add(n.name),n.over&&t.add(n.over),n.root||t.add(n.context);for(let r of n.units)r.atom.kind===`ref`&&iu(e,r.atom.name,r.atom.pick)&&t.add(r.atom.name)}return t}let Iu=/* @__PURE__ */ new WeakMap,Lu=/* @__PURE__ */ new WeakMap;fu(e=>{Iu.delete(e),Lu.delete(e),Eu.delete(e)});function Ru(e,t){let n=e.cells.get(e.clocks.get(t)?.cell??``)?.params.varispeed;return typeof n==`number`?n:0}function zu(e,t,n=0){let r=Lu.get(e);r||Lu.set(e,r=/* @__PURE__ */ new WeakMap);let i=r.get(t)??/* @__PURE__ */ new Map;r.set(t,i);let a=Tu.get(e)?.get(t),o=(n,r)=>{let i=e.cells.get(n)?.bend,o=i?.depth;if(!i||!o||!a)return;let s=Du.get(e);s||Du.set(e,s=/* @__PURE__ */ new WeakMap);let c=s.get(t);c||s.set(t,c=/* @__PURE__ */ new Map);let l=c.get(n);l||c.set(n,l=/* @__PURE__ */ new Map);let u=l,d={positions:[...i.positions],lap:i.lap},f=/* @__PURE__ */ new Map;return(e,t)=>{let s=u.get(e);if(s)return s;if(e<0||ku)return d;ku=!0;let c;try{c=a(n,`depth`,r(t))}finally{ku=!1}let l=Number.isFinite(c)?Math.round(c*1e9)/1e9:null,p=l===null?d:f.get(l);return p||f.set(l,p=ji(o.table,o.per,o.nodes,i.bars,l)),u.set(e,p),p}},s=n=>{let r=e.cells.get(n),i=r?.swingMoves,o=r?.meter;if(!i||!o?.swing||!a)return;let s=Eu.get(e);s||Eu.set(e,s=/* @__PURE__ */ new WeakMap);let c=s.get(t);c||s.set(t,c=/* @__PURE__ */ new Map);let u=c.get(n);u||c.set(n,u=/* @__PURE__ */ new Map);let d=u,f=Ou.get(o);f||Ou.set(o,f=/* @__PURE__ */ new Map);let p=f,m=Math.max(1,o.levels.length);return e=>{let t=d.get(e);if(t)return t;if(e<0||ku)return o;let r=l(n).q(e*m);ku=!0;let s;try{s=a(n,`swing`,r)}finally{ku=!1}let c=Number.isFinite(s)?Math.min(.95,Math.max(.05,Math.round(s*1e9)/1e9)):null,u=c===null?o:p.get(c);return u||p.set(c,u={...o,swing:o.swing.map(e=>e.level===i.level?{...e,share:c}:e)}),d.set(e,u),u}},c=t=>{let n=i.get(t);if(!n){let r=e.clocks.get(t),a=s(r.tap?.meter??t);if(r.tap&&a){let t=e.cells.get(r.tap.meter).meter,i=Ei(t),o=Math.max(1,t.levels.length),s=(e,t)=>zi(a(Math.floor(e/o+1e-9)),e/i,t)*i,c=Cu(e,r.tap.meter,a);n=c?wu(r.tap,l(r.tap.meter),c,s):Su(r.tap,l(r.tap.meter),null)}else if(r.tap)n=Su(r.tap,l(r.tap.meter),Cu(e,r.tap.meter));else if(a){let r=e.cells.get(t).meter.levels.map((e,t)=>t);n=bu(r,l(t),e=>Gi(a(e))??r)}else n=r.swung?bu(r.swung,l(t)):l(t);i.set(t,n)}return n},l=n=>{let r=i.get(`${n}\0plain`);if(!r){let a=e.clocks.get(n);if(a.belt){let i=yu(e,e.clocks.get(a.belt.driver),t),o=c(a.belt.driver),s=e.cells.get(a.cell),l=(e,t)=>typeof s.params[e]==`number`?s.params[e]:t,u=Math.max(.001,l(`belt`,200)),d=Math.max(.001,l(`mass`,1)),f=l(`damping`,.6*Math.sqrt(u*d)),p=Iu.get(e);p||Iu.set(e,p=/* @__PURE__ */ new Map);let m=p.get(n);m||p.set(n,m=_u(e,u,d,f,l(`slip`,1/0),e=>i.q(o.stepAt(e))));let h=m,g=a.belt.rate;r={beats:1,q:e=>h.real(i.q(e/g)),stepAt:e=>i.stepAt(h.nominal(e))*g,speed:e=>h.speed(e)}}else{let n=hu(e,a.cell),i=xu(e,a,t,o(a.cell,e=>n?n.real(e):e)),s=hu(e,a.cell);r=s?{beats:i.beats,q:e=>s.real(i.q(e)),stepAt:e=>i.stepAt(s.nominal(e)),speed:e=>s.speed(e)}:i}i.set(`${n}\0plain`,r)}return r};return{map:c,written:t=>{let n=e.clocks.get(t)?.tap;if(!n?.written)return c(t);let r=i.get(`${t}\0written`);return r||i.set(`${t}\0written`,r=Su({...n,positions:n.written},l(n.meter))),r},played:t=>{let n=e.clocks.get(t)?.tap?null:Cu(e,t,s(t));if(!n)return c(t);let r=i.get(`${t}\0played`);if(!r){let e=l(t);r={beats:e.beats,q:t=>e.q(n.S(t)),stepAt:t=>n.W(e.stepAt(t)),...e.speed?{speed:e.speed}:{}},i.set(`${t}\0played`,r)}return{...r,q:r.q,stepAt:r.stepAt,grain:n.grain}},swingOf:(t,n)=>{let r=s(t);return(r?r(n):e.cells.get(t)?.meter)?.swing??null},stepOf:e=>c(e).stepAt(Math.max(0,n))}}function Bu(e,t,n){let r=zu(e,t,n),i=Mu(e),a=Fu(e),o=/* @__PURE__ */ new Map,s=n=>{let c=t(n),l=e.cells.get(n),u=l?.tonic?e.cells.get(l.tonic):void 0;if(l&&u?.step&&u.clock){let t=Kl(e,u.name,s(u.name))[0]?.atom;return t?.kind===`note`?c-l.shift+hr(t.value+t.alter,12):c}if(!l||!l.step||!l.clock||e.clocks.has(n)||Ku(e,n)||l.loops||i.has(n)&&!a.has(n))return c;let d=o.get(l.clock);if(d===void 0&&o.set(l.clock,d=r.stepOf(l.clock)),l.wrap===0)return c;let{per:f,laps:p}=Hu(e,l),m=(f?hr(Math.floor(l.rate*d+vu),f):Math.floor(l.rate*d+vu))*l.stride,h=Gu(e,n);if(!h){let t=p*Uu(e,n);return c+(t>0?hr(m,t):m)}let g=m+Math.min(.999999999,Math.max(0,l.rate*d-Math.floor(l.rate*d+vu))),_=p*h.length,v=_>0?hr(g,_):g,y=Math.floor(v/h.length);return c+y*h.entries+h.inForce(v-y*h.length,Math.floor(g/h.length))};return s}let Vu=(e,t,n)=>r=>r===n?t(r):e(r);function Hu(e,t){if(t.wrap===null)return{per:null,laps:1};let n=t.step?.tap&&t.clock?e.clocks.get(t.clock)?.tap:void 0;return n?{per:Math.max(1,Math.round(n.positions.length*t.rate)),laps:0}:{per:null,laps:t.wrap}}let Uu=(e,t)=>{let n=e.cells.get(t);return Gu(e,t)?.length??(n.units.length||n.cycle)},Wu=/* @__PURE__ */ new WeakMap;function Gu(e,t){let n=Wu.get(e);if(n||Wu.set(e,n=/* @__PURE__ */ new Map),n.has(t))return n.get(t);let r=e.cells.get(t).units,i=null;if(r.some(e=>e.repeat!==1||e.elongate!==1||e.atom.kind===`seq`)){let n=[],a=0;for(let e of r)n.push(a),a+=e.atom.kind===`seq`?z(e.atom).length:1;let o=an(r,()=>1).filter(e=>!e.chosen||e.chosen.every(e=>e.is===0)).map(e=>{let t=r[e.top],i=n[e.top]+(t.atom.kind===`seq`?z(t.atom).indexOf(e.atom):0);return{at:e.at,index:i,...e.laps?{laps:e.laps}:{}}}).sort((e,t)=>e.at-t.at),s=r.reduce((e,t)=>e+nn(t.atom,()=>1)*t.elongate*t.repeat,0),c=(e,t)=>!e.laps||hr(t,e.laps.of)===e.laps.is,l=Yl(e,t).length;i={length:s,entries:l,inForce(e,t){let n;for(let r of o)r.at<=e+1e-9&&c(r,t)&&(!n||r.at>n.at+1e-9)&&(n=r);if(n)return n.index;for(let e of o)c(e,t-1)&&(!n||e.at>n.at+1e-9)&&(n=e);return n?n.index-l:0}}}return n.set(t,i),i}function Ku(e,t){let n=e.cells.get(t)?.over??``,r=e.cells.get(n);return!!r&&r.units.length>0&&r.units.every(t=>t.atom.kind===`ref`&&e.sections?.get(t.atom.name)===n)}function qu(e,t,n){let r=e.cells.get(n),i=r?.clock?e.clocks.get(r.clock):void 0,a=r?.clock&&i?t.map(r.clock):null,o=i?i.perSecond:1,s=e=>a?a.stepAt(Math.max(0,e))/o:e;return{pos:s,real:e=>e<=0?0:a?a.q(e*o):e,speed:e=>Math.max(.001,(s(e+.01)-s(Math.max(0,e-.01)))/(e+.01-Math.max(0,e-.01))),moving:a}}let Ju=10080,Yu=60/84,Xu=[2,2,1,2,2,2,1],Zu=[0,4,1,5,2,6,2,5,1,4,0,3],Qu=(e,t)=>(e%t+t)%t;[5,3,1,6,4,2,0].map(e=>e/6);function $u(e){let t=[0];for(let n=0;n<6;n++)t.push(t[n]+Xu[(n+e)%7]);return t}function ed(e){let t=Qu(Math.floor(e),120960),n=Math.floor(t/Ju),r=Math.floor(t%Ju/840);return{block:n,key:r,bar:Math.floor(t%840/12),inBar:t%12,mode:Zu[n],tonic:td(n,r)}}function td(e,t){return Qu((e<6?7:5)*t,12)}function nd(e,t){let n=[0,4,1,5,2,6,3],r=Zu[e];return n.map((e,i)=>Qu(n[(i+t)%7]+r,7))}function rd(e){return $u(e)}function id(e,t,n){let r=Math.floor(n/7),i=n%7,a=e.map((t,n)=>e[(n+i)%7]),o=rd(t);r===1&&(o=o.map((e,t)=>Qu(o[(t+i)%7]-o[i],12)).sort((e,t)=>e-t));let s=[];for(let e=0;e<7;e++){let t=a[e],n=a[(e+2)%7]+1,c=a[(e+4)%7],l=a[(e+6)%7];r===0&&(t=Qu(t+i+1,7)),r===2&&(n=8-n),r===3&&(c=a[(6-e+4)%7]),r===4&&(l=Qu(l*5,7));let u=o[e],d=e<6?o[e+1]:12;s.push({at:u,dur:d-u,degree:t,density:n,dynamic:c,space:l})}return s}function ad(e,t,n){let r=nd(e,t),i=Zu[e];return n<35?id(r,i,n):id(r,i,69-n).map(e=>({...e,at:12-(e.at+e.dur),degree:Qu(-e.degree,7)})).sort((e,t)=>e.at-t.at)}function od(e,t){let n=[],r=Math.floor(e/12);for(let i=r;i*12<t;i++){let r=i*12,a=ed(r),o=$u(a.mode);for(let i of ad(a.block,a.key,a.bar)){let s=r+i.at;if(!(s<e||s>=t))for(let e=0;e<i.density;e++){let t=i.degree+2*e;n.push({step:s,dur:i.dur,semis:a.tonic+o[Qu(t,7)]+12*Math.floor(t/7),level:.18+i.dynamic*.11,pan:i.space/3-1})}}}return n}function sd(e,t,n,r,i,a=0){if(!r)return Kl(e,t,n(t)+a,i);let o=Kl(e,t,r.abs?0:n(t),i);return(bi(o.length,r)??[]).map(e=>o[e])}let cd=(e,t,n)=>Si(e.cells.get(t),n)??0,ld=(e,t=0)=>e?pn(e):`>${t}`;var ud=class extends Error{};function dd(e,t,n,r=null,i=()=>!1,a=0,o=ci){let s=/* @__PURE__ */ new Map,c=(t,r,a,o,l)=>{let u=e.cells.get(t),d=u.root?t:u.over??o,f=u.root?0:u.over?u.overShift:l,p=`${t}|${ld(r,a)}|${d}|${f}`,m=s.get(p);if(m)return m;let h=[];if(!i(t)){let i=iu(e,t,r)?bi(e.cells.get(t).units.length,r):null,o=sd(e,t,n,r,d,a),s=t=>t.kind===`ref`&&cd(e,t.name,t.pick)||1,l=(e,t,n)=>{if(e.kind!==`ref`)return Xt(e,t,n);let r=n/s(e);return c(e.name,e.pick,e.shift,d,f).map(n=>({atom:{kind:`spliced`,e:n,ref:e},at:t+n.step*r,dur:n.duration*r,of:n.laps?.of??1,is:n.laps?.is??0,chances:[],picks:(n.chosen??[]).map(e=>({...e,at:t+e.at*r}))}))};for(let{atom:n,at:r,dur:a,chances:c,top:p,level:m,laps:g,chosen:_}of rn(o,s,l,`${t}:`)){let o={step:r,duration:a,cell:t,table:d,tableShift:f,...i?{via:{cell:t,index:i[p],ctx:d,mul:1,add:0}}:{},...g?{laps:g}:{},..._?{chosen:_}:{}},s=c.map(e=>e===null?u.chance??.5:e),l={...s.length?{chance:s.length===1?s[0]:1-s.reduce((e,t)=>e*(1-t),1)}:{},...m===void 0?{}:{level:m}},v=t=>({...o,table:ou(e,d),tableShift:0,value:Math.round(nu(e,ou(e,d),t)*1e6)/1e6,alter:0});if(n.kind===`note`)h.push(n.pitched?{...v(n.value),...l}:{...o,value:n.value,alter:n.alter,...l});else if(n.kind===`chord`)n.notes.forEach((e,t)=>{let r=n.levels?.[t],i=r===void 0?{}:{level:r*(m??1)};h.push(n.pitched?.[t]?{...v(e),...l,...i}:{...o,value:e,alter:n.alters[t],...l,...i})});else if(n.kind===`choice`)h.push({...o,value:n.values[0],alter:n.alters[0],...l,options:n.values.map((e,t)=>({value:e,alter:n.alters[t]}))});else if(n.kind===`spliced`){let{e,ref:t}=n,i=t.transpose??0,o=t.values,{laps:s,chosen:c,...l}=e;h.push({...l,...o?{value:o.mul*e.value+o.add,alter:o.mul*e.alter,...e.options?{options:e.options.map(e=>({value:o.mul*e.value+o.add,alter:o.mul*e.alter}))}:{},...e.via?{via:{...e.via,mul:o.mul*e.via.mul,add:o.mul*e.via.add+o.add}}:{}}:{},step:r,duration:a,...g?{laps:g}:{},..._?{chosen:_}:{},...i||e.transpose?{transpose:(e.transpose??0)+i}:{},...m===void 0?{}:{level:(e.level??1)*m}})}if(h.length>5e4)throw new ud(t)}}return s.set(p,h),h};return[...c(t,r,a,o,0)].sort((e,t)=>e.step-t.step||e.value-t.value)}function fd(e,t,n){if(!t.via)return{value:t.value,alter:t.alter};let r=Kl(e,t.via.cell,n(t.via.cell),t.via.ctx)[t.via.index];return r?.atom.kind===`note`?{value:t.via.mul*r.atom.value+t.via.add,alter:t.via.mul*r.atom.alter}:{value:t.value,alter:t.alter}}let $=e=>`cell:${e}`;function pd(e){let t=3735928559,n=1103547991;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,2654435761),n=Math.imul(n^i,1597334677)}return t=Math.imul(t^t>>>16,2246822507)^Math.imul(n^n>>>13,3266489909),n=Math.imul(n^n>>>16,2246822507)^Math.imul(t^t>>>13,3266489909),((n>>>0)*2**21+(t>>>11)).toString(36)}let md=e=>+e.toPrecision(9),hd=/* @__PURE__ */ new WeakMap;function gd(e){let t=hd.get(e);if(t)return t;let n=gi(e),r=/* @__PURE__ */ new Map,i=(t,a)=>{let o=r.get(t);if(o!==void 0)return o;let s=e.cells.get(t);if(!s)return t;if(a.has(t))return`↺`;let c=/* @__PURE__ */ new Set([...a,t]),l=[];try{l=dd(e,t,n).map(e=>[md(e.step),md(e.duration),md(e.value+e.alter+(e.transpose??0)),e.chance??null,e.options?.map(e=>e.value+e.alter)??null,e.laps?[e.laps.of,e.laps.is]:null,e.chosen?.map(e=>[md(e.at),e.of,e.is,e.lap])??null])}catch{}let u=Object.entries(s.params).sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>[e,typeof t==`string`&&Jr.has(e)?i(t,c):t]),d=pd(JSON.stringify([s.seed,s.steps,l,u.filter(([e])=>e!==`chance`),s.env?i(s.env,c):null]));return a.size||r.set(t,d),d},a=e=>i(e,/* @__PURE__ */ new Set);return hd.set(e,a),a}let _d=(e,t,n)=>e.drawn?e.drawn(t,n):t;function vd(e,t,n){let r=t.series.reduce((t,r)=>t*Dd(Ed(e,r,n,n+1),n,e=>e.level),1);return t.range?t.range[0]+(t.range[1]-t.range[0])*r:r}function yd(e,t,n,r){let i=e.voiceParams.get(t);if(!i||Object.keys(i).length===0)return;let a={};for(let[t,o]of Object.entries(i)){let i=o.series.map(t=>Ed(e,t,n,n+r)),s=e=>i.reduce((t,n)=>t*Dd(n,e,e=>e.level),1),c=e=>o.range?o.range[0]+(o.range[1]-o.range[0])*e:e;if(o.env&&o.range)a[t]={kind:`env`,from:o.range[0],peak:c(s(n)),...o.env};else{let e=[...new Set(i.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t);a[t]={kind:`points`,points:(e.length?e:[n]).map(e=>({at:e,value:c(s(e)),...i.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9))?{ramp:!0}:{}}))}}}return a}function bd(e,t,n){let r=Bu(e.result,e.statics,n+vu),i=e.played.has(t.cell)?Vu(r,e.statics,t.cell):r,a=fd(e.result,t,i),o=eu(e.result,t.table,t.tableShift,a.value,a.alter,i),s=t.transpose?{...o,position:o.position+t.transpose}:o;return tu(e.result,s.root,s.position)}function xd(e,t,n,r){if(t.events.length===0)return[{at:n,semis:0}];if(!t.clock)return[{at:n,semis:t.sign*bd(e,t.events[0],n)}];if(t.lin)return Td(e,t,n,r,(n,r)=>t.sign*bd(e,n,r)).map(e=>({at:e.at,semis:e.v,ramp:e.ramp}));let i=zu(e.result,e.statics).map(t.clock),a=i.stepAt(Math.max(0,n))*t.rate,o=i.stepAt(Math.max(0,r))*t.rate;Number.isFinite(a)||(a=0),Number.isFinite(o)||(o=a);let s=[],c=Math.floor(a/t.period),l=Cd(t,a);s.push({at:n,semis:l?t.sign*bd(e,l,n):0});for(let n=c;n*t.period<o;n++)for(let r of t.events){let c=n*t.period+r.step;if(c<=a+1e-9||c>=o-1e-9)continue;let l=i.q(c/t.rate);s.push({at:l,semis:t.sign*bd(e,r,l)})}return s}function Sd(e,t){return Math.floor((e+vu)/t)}function Cd(e,t){let n=Sd(t,e.period),r=null;for(let i of[n,n-1]){for(let n of e.events)i*e.period+n.step<=t+1e-9&&(r=n);if(r)break}return r}function wd(e,t,n){if(t.events.length===0)return null;if(!t.clock)return t.events[0];let r=zu(e.result,e.statics).map(t.clock).stepAt(Math.max(0,n))*t.rate;return Cd(t,Number.isFinite(r)?r:0)}function Td(e,t,n,r,i){let a=zu(e.result,e.statics).map(t.clock),o=[...new Map(t.events.map(e=>[e.step,e])).values()].sort((e,t)=>e.step-t.step),s=e=>a.q(e/t.rate),c=(e,n,r)=>{let a=_d(t,e,n);return a?i(a,r):0},l=e=>{let n=Sd(e,t.period),r=e-n*t.period,i=o.length-1;for(let e=0;e<o.length;e++)o[e].step<=r+1e-9&&(i=e);let a=o[i],l=a.step>r+1e-9?a.step-t.period:a.step,u=c(a,l<0?n-1:n,s(n*t.period+l));if(i===o.length-1||l<0)return u;let d=o[i+1];return u+(c(d,n,s(n*t.period+d.step))-u)*(r-l)/Math.max(vu,d.step-l)},u=a.stepAt(Math.max(0,n))*t.rate,d=a.stepAt(Math.max(0,r))*t.rate;Number.isFinite(u)||(u=0),Number.isFinite(d)||(d=u);let f=[{at:n,v:l(u),ramp:!1}];for(let e=Math.floor(u/t.period);e*t.period<d;e++)for(let n of o){let r=e*t.period+n.step;r>u+1e-9&&r<d-1e-9&&f.push({at:s(r),v:c(n,e,s(r)),ramp:n!==o[0]})}return f.push({at:r,v:l(d-1e-6),ramp:!0}),f}function Ed(e,t,n,r,i){if(t.sum){let{terms:a,constant:o}=t.sum,s=a.map(t=>Ed(e,t.series,n,r,i)),c=[...new Set(s.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t);return(c.length?c:[n]).map(e=>({at:e,level:Math.min(1,Math.max(0,a.reduce((t,n,r)=>t+n.weight*Dd(s[r],e,e=>e.level),o))),...s.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9))?{ramp:!0}:{}}))}let a=e=>t.db?10**((e.value+e.alter)/20):t.bipolar?Math.max(0,(1+e.value+e.alter)/2):Math.max(0,e.value+e.alter);if(t.events.length===0)return[{at:n,level:0}];if(!t.clock)return[{at:n,level:a(t.events[0])}];if(t.lin)return Td(e,t,n,r,e=>a(e)).map(e=>({at:e.at,level:Math.max(0,e.v),ramp:e.ramp}));let o=zu(e.result,e.statics).map(t.clock),s=o.stepAt(Math.max(0,n))*t.rate,c=o.stepAt(Math.max(0,r))*t.rate;Number.isFinite(s)||(s=0),Number.isFinite(c)||(c=s);let l=e=>{let n=Sd(e,t.period),r=e-n*t.period,i=-1;for(let e of t.events){if(!(r>=e.step-1e-9&&r<e.step+e.duration-1e-9))continue;let o=_d(t,e,n);o&&(i=Math.max(i,a(o)))}return i<0?0:i},u=i===void 0?NaN:zu(e.result,e.statics).written(t.clock).stepAt(Math.max(0,i))*t.rate,d=[{at:n,level:l(Number.isFinite(u)?u:s)}],f=/* @__PURE__ */ new Set;for(let e=Math.floor(s/t.period);e*t.period<c;e++)for(let n of t.events)for(let r of[e*t.period+n.step,e*t.period+n.step+n.duration])r>s+1e-9&&r<c-1e-9&&f.add(r);for(let e of[...f].sort((e,t)=>e-t)){let n=l(e+vu*10);n!==d[d.length-1].level&&d.push({at:o.q(e/t.rate),level:n})}return d}function Dd(e,t,n){let r=0;for(let n=0;n<e.length;n++)e[n].at<=t+1e-9&&(r=n);let i=e[r+1];return!i?.ramp||Math.abs(e[r].at-t)<1e-9?n(e[r]):n(e[r])+(n(i)-n(e[r]))*(t-e[r].at)/Math.max(vu,i.at-e[r].at)}let Od={sign:1,lin:!1,db:!1,clock:null,rate:0,period:1,events:[]};function kd(e,t,n){let r=zu(e,t),i=/* @__PURE__ */ new Set,a=[],o=t=>{for(let n=0;t&&!i.has(t)&&n<32;n++){i.add(t);let n=e.cells.get(t);if(!n)return;n.laps&&n.clock&&a.push(r.map(n.clock).q(n.laps*Math.max(1,cd(e,t,null))/n.rate)),n.clock&&n.clock!==t&&o(n.clock),t=n.step?.driver}};o(n.cell);for(let e of n.select)o(e.cell);return a.length?Math.min(...a):1/0}function Ad(e){let t=3735928559,n=1103547991;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,2654435761),n=Math.imul(n^i,1597334677)}return t=Math.imul(t^t>>>16,2246822507)^Math.imul(n^n>>>13,3266489909),n=Math.imul(n^n>>>16,2246822507)^Math.imul(t^t>>>13,3266489909),((n>>>0)*2**21+(t>>>11))/2**53}function jd(e,t,n,r){return Md(e,t.output.cell,n,r)}function Md(e,t,n,r){if(n.laps&&hr(r,n.laps.of)!==n.laps.is)return null;if(n.chance===void 0&&!n.options&&!n.chosen)return n;let i=`${e.cells.get(t)?.seed??0}|${gd(e)(t)}`;for(let e of n.chosen??[])if(Math.floor(Ad(`${i}|${r+e.lap}|${e.at.toFixed(6)}|${e.id.replace(/^[^:/]*:/,``)}|picks`)*e.of)!==e.is)return null;if(n.chance===void 0&&!n.options)return n;let a=`${i}|${r}|${n.step.toFixed(6)}`;if(n.chance!==void 0&&Ad(`${a}|sounds`)>=1-n.chance)return null;if(!n.options)return n;let o=n.options[Math.floor(Ad(`${a}|picks`)*n.options.length)];return{...n,value:o.value,alter:o.alter}}function Nd(e,t){let n=!1;for(let r of t){let t=e.cells.get(r.part)?.params.restart??e.cells.get(r.cell)?.params.restart;if(t===`resume`||t===`free`)return t;(t===`restart`||!r.performer)&&(n=!0)}return n?`restart`:`free`}function Pd(e,t,n,r){let i=t.series;if(!i.clock||i.events.length===0)return[];let a=zu(e.result,e.statics).map(i.clock),o=a.stepAt(Math.max(0,n))*i.rate,s=a.stepAt(Math.max(0,r))*i.rate;Number.isFinite(o)||(o=0),Number.isFinite(s)||(s=o);let c=[];for(let e=Math.floor(o/i.period)-1;e*i.period<s;e++)for(let n of i.events){if(hr(Math.round(n.value+n.alter),t.entries)!==t.entry)continue;let r=e*i.period+n.step,l=r+n.duration;l<=o+1e-9||r>=s-1e-9||c.push({a:a.q(r/i.rate),b:a.q(l/i.rate)})}return c.sort((e,t)=>e.a-t.a)}let Fd=(e,t,n)=>ru(e,t).some(e=>n.has($(e))),Id=(e,t,n)=>{let r=e.cells.get(t);for(let t=0;r?.step&&t<32;t++){if(n.has($(r.step.driver)))return!0;r=e.cells.get(r.step.driver)}return!1};function Ld(e,t){let n=e.cells.get(t),r=n?.voice?n.params.gain:void 0;return typeof r==`number`&&Number.isFinite(r)?r:1}function Rd(e,t){return e.silent?e.via.some(n=>t.has($(n))&&!e.midi?.some(e=>e.card===n))?[0,0]:[e.gains[0],e.gains[1]]:Bd(e.parts,t)}function zd(e,t){let n=Rd(e,t);if(e.silent||Vd(n))return n;let r=Ud(e,t).reduce((e,t)=>Math.abs(t.gain)>Math.abs(e)?t.gain:e,0);return[r,r]}function Bd(e,t){let n=[0,0];for(let r of e)!t.has($(r.mix))&&!t.has($(r.sink))&&(n[0]+=r.gains[0],n[1]+=r.gains[1]);return n}let Vd=e=>e[0]!==0||e[1]!==0;function Hd(e,t,n){if(!Gd(e,t,n))return!1;let r=Rd(t,n);return Vd(r)||Wd(t,n)}function Ud(e,t){return(e.midi??[]).filter(e=>!t.has($(e.card))&&!(e.mix&&t.has($(e.mix))))}let Wd=(e,t)=>Ud(e,t).length>0;function Gd(e,t,n){if(n.has($(t.voice))||n.has($(t.cell)))return!1;if(t.drone)return!t.through.some(e=>n.has($(e)))&&!(t.envelopeCell&&n.has($(t.envelopeCell)));let r=e.cells.get(t.cell);return!(!r?.clock||Fd(e,r.clock,n)||Id(e,t.cell,n)||t.through.some(e=>n.has($(e)))||t.envelopeCell&&n.has($(t.envelopeCell))||t.select.some(t=>n.has($(t.cell))||n.has($(t.part))||n.has($(e.cells.get(t.cell).over)))||t.select.some(t=>[...e.cells.get(t.cell).children.keys()].some(e=>n.has($(e)))))}function Kd(e,t,n){if(Math.abs(t-n)<1e-9)return{period:t,events:[...e]};let r=[];for(let i=0;i*t<n-vu;i++)for(let a of e){let e=a.step+i*t;e>=n-1e-9||r.push({...a,step:e,duration:Math.min(a.duration,n-e)})}return{period:n,events:r}}function qd(e,t,n=/* @__PURE__ */ new Set){if(!e.ok)return{result:e,statics:t,muted:n,tracks:[],drones:[],played:/* @__PURE__ */ new Set,voiceParams:/* @__PURE__ */ new Map,envParams:/* @__PURE__ */ new Map,end:1/0,seriesOf:()=>Od};let r=[],i=[],a=/* @__PURE__ */ new Map,o=(r,i,a,s)=>{let c=e.cells.get(r);if(c.sum)return{sign:s,lin:!1,db:!1,clock:null,rate:0,period:1,events:[],sum:{terms:c.sum.terms.map(e=>({series:o(e.cell,null,0,1),weight:e.weight})),constant:c.sum.constant}};let l=n.has($(r))?[]:dd(e,r,t,i,e=>n.has($(e)),a).filter(t=>!Fd(e,t.table,n)),u=l.some(e=>e.laps||e.chance!==void 0||e.options||e.chosen)?(t,n)=>Md(e,r,t,n):void 0,d=c.map?.kind===`db`,f=!d&&l.some(e=>e.value+e.alter<0||(e.options??[]).some(e=>e.value+e.alter<0)),p=Math.max(1,cd(e,r,i)),m=Hu(e,c).per;return{sign:s,lin:c.map?.kind===`lin`,db:d,clock:c.clock,rate:c.rate,...m?Kd(l,p,m):{period:p,events:l},...u?{drawn:u}:{},...f?{bipolar:!0}:{}}},s=(t,n)=>{let r=(Ac(e,n)??0)/t.period;return r>20?{...t,rate:t.rate*20/r}:t},c=/* @__PURE__ */ new Map;for(let t of e.cells.values())if(t.map?.kind===`adsr`&&Object.keys(t.paramCells).length)try{c.set(t.name,Object.fromEntries(Object.entries(t.paramCells).map(([e,t])=>[e,{range:t.range,series:t.factors.map(e=>o(e,null,0,1)),env:null}])))}catch(e){if(!(e instanceof ud))throw e}for(let c of e.outputs){if(!Hd(e,c,n))continue;let l=e.cells.get(c.cell);try{for(let t of[...c.kit?Oc(e.cells.get(c.voice)):[c.voice],...c.through]){if(a.has(t))continue;let n=e.cells.get(t),r={};for(let[t,i]of Object.entries(n?.paramCells??{})){let n=i.factors.find(t=>e.cells.get(t)?.map?.kind===`adsr`);r[t]={range:i.range,series:i.factors.filter(e=>e!==n).map(e=>s(o(e,null,0,1),e)),env:n?wi(e.cells.get(n)):null}}a.set(t,r)}if(c.drone){i.push({output:c,mods:c.mods.map(e=>o(e.cell,e.pick,e.shift,e.sign)).filter(e=>e.events.length>0),levels:c.levels.map(e=>o(e.cell,e.pick,e.shift,e.sign))});continue}let n=o(c.cell,c.pick,c.shift,c.sign),u=c.mods.filter(e=>!e.picks).map(e=>o(e.cell,e.pick,e.shift,e.sign)).filter(e=>e.events.length>0),d=c.mods.find(e=>e.picks),f=d?o(d.cell,d.pick,d.shift,1):void 0,p=c.levels.map(e=>o(e.cell,e.pick,e.shift,e.sign)),m=c.select.map(t=>({series:o(t.cell,null,0,1),entry:t.entry,entries:e.cells.get(e.cells.get(t.cell).over).units.length})),h=l.paramCells.legato,g=l.step?.tap?e.cells.get(l.step.driver)?.meter:null,_=l.step?.chain.reduce((e,t)=>t.op===`×`?e*t.n:e/t.n,1)??1,v=h?{range:h.range,series:h.factors.map(e=>o(e,null,0,1))}:typeof l.params.legato==`number`?l.params.legato:g?Xi(g,l.step.tap,_):1;n.events.length&&r.push({...n,output:c,clock:l.clock,mods:u,...f?{picker:f}:{},levels:p,selects:m,end:kd(e,t,c),share:v})}catch(e){if(!(e instanceof ud))throw e}}let l=r.map(e=>e.end),u=-1/0;for(let t of e.clocks.values()){let n=hu(e,t.cell)?.stopsAt();n!=null&&(u=Math.max(u,n))}let d=l.length?Math.max(...l):1/0,f={result:e,statics:t,muted:n,tracks:r,drones:i,played:Mu(e),voiceParams:a,envParams:c,end:Math.min(d,u>-1/0?u:1/0),seriesOf:t=>e.cells.has(t)?o(t,null,0,1):Od},p={swing:/* @__PURE__ */ new Map,depth:/* @__PURE__ */ new Map};for(let t of e.cells.values()){let e=[[`swing`,t.meter?t.swingMoves:void 0],[`depth`,t.bend?.depth]];for(let[n,r]of e)if(r)try{p[n].set(t.name,{range:r.range,series:r.factors.map(e=>o(e,null,0,1)),env:null})}catch(e){if(!(e instanceof ud))throw e}}return(p.swing.size||p.depth.size)&&Au(e,t,(e,t,n)=>{let r=p[t].get(e);return r?vd(f,r,n):NaN}),f}function Jd(e,t,n,r){let i=n&&t?e.envParams.get(t):void 0;if(!i)return n;let a={...n};for(let[t,n]of Object.entries(i)){let i=vd(e,n,r);t===`attack`||t===`decay`||t===`release`?a[t]=Math.max(0,i):t===`sustain`&&(a.sustain=Math.min(1,Math.max(0,i)))}return a}function Yd(e,t){let n=e.cells.get(t)?.env,r=n?e.cells.get(n):void 0;return r?.map?.kind===`adsr`?wi(r):null}function Xd(e,t,n){if(!t.kit)return{voice:t.voice,freq:e.cells.get(t.voice).freq};let r=e.cells.get(t.voice),i=r.units[hr(Math.round(n),r.units.length)];return i?.atom.kind===`ref`?{voice:i.atom.name,freq:e.cells.get(i.atom.name).freq}:null}function Zd(e,t){let n=e.cells.get(e.cells.get(t)?.over??``)?.params.anchor;return typeof n==`number`?Math.round((((e=>Math.floor(e)*3600+Math.round(e%1*100)*60)(n)-42900)%86400+86400)%86400/Yu):0}function Qd(e,t,n,r=!1,i={}){let a=t=>e.result.cells.get(t.output.cell)?.params.law!==void 0,o=e.tracks.filter(e=>!e.output.tape&&!a(e)),s=e.tracks.filter(e=>e.output.tape),c=af({...e,tracks:o},t,n,r);e.drones.length&&(c.push(...sf(e,t,n,r,i)),c.sort((e,t)=>e.at-t.at));for(let i of e.result.outputs){if(e.result.cells.get(i.cell)?.params.law!==`fiveto12`)continue;let a=zd(i,e.muted),o=i.midi?Ud(i,e.muted):[],s=Vd(a);if(!s&&!o.length)continue;let l=e.result.cells.get(i.voice)?.freq||261.63,u=Zd(e.result,i.cell);for(let d of od(Math.ceil(t/Yu-1e-9)+u,Math.ceil(n/Yu-1e-9)+u)){let t=(d.step-u)*Yu;c.push({at:t,dur:d.dur*Yu,voice:i.voice,freq:l*2**(d.semis/12),bends:[],gains:[a[0]*Math.min(1,1-d.pan)*Ld(e.result,i.voice),a[1]*Math.min(1,1+d.pan)*Ld(e.result,i.voice)],levels:[{at:t,level:d.level}],...s?{}:{unheard:!0},...o.length?{midi:o}:{},...r?{output:i.id}:{}})}}if(!s.length)return c;let l=zu(e.result,e.statics);for(let i of s){let a=i.output.tape,o=e.result.cells.get(a.tape),{pos:s,real:u,speed:d,moving:f}=qu(e.result,l,a.tape),p=typeof o?.params.varispeed==`number`?o.params.varispeed:0,m=1-a.erase,h=a.length>0?Math.min(40,m>0?Math.ceil(Math.log(.02)/Math.log(m)):1):1,g={...i,output:{...i.output,tape:void 0}};for(let i=0;i<h;i++){let o=a.at+i*a.length,l=m**+i,h=u(s(t)-o),_=u(s(n)-o);if(!(_>0)||!Number.isFinite(_))continue;let v=e=>u(s(e)+o);for(let i of af({...e,tracks:[g]},Math.max(0,h),_,r)){let e=v(i.at);if(!(e>=t&&e<n)||!Number.isFinite(e))continue;let r=v(i.at+i.dur);if(f&&d(i.at)<.05)continue;let a=p?Math.min(4,Math.max(.25,(d(e)/d(i.at))**+p)):1;c.push({...i,at:e,dur:Math.max(.01,(Number.isFinite(r)?r:e+i.dur)-e),freq:i.freq*a,bends:i.bends.map(e=>({...e,at:v(e.at)})),levels:i.levels.map(e=>({...e,at:v(e.at)})),gains:[i.gains[0]*l,i.gains[1]*l],...i.params?{params:$d(i.params,v)}:{},...i.through?{through:i.through.map(e=>e.params?{...e,params:$d(e.params,v)}:e)}:{}})}}}return c.sort((e,t)=>e.at-t.at)}let $d=(e,t)=>Object.fromEntries(Object.entries(e).map(([e,n])=>[e,n.kind===`points`?{...n,points:n.points.map(e=>({...e,at:t(e.at)}))}:n]));function ef(e,t,n,r){let i=[...t.through].reverse().filter(t=>{let n=e.result.cells.get(t);return!!n&&[...Object.keys(n.params),...Object.keys(n.paramCells),...Object.keys(n.paramClocks)].some(e=>X.has(e))}).map(t=>{let i=yd(e,t,n,r);return{instrument:t,...i?{params:i}:{}}});return i.length?{through:i}:{}}function tf(e){let[t,n,r,i]=[0,1,1,0],a=e;for(let o=0;o<32;o++){let o=Math.floor(a+1e-12);if([t,n]=[n,o*n+t],[r,i]=[i,o*i+r],i>1e4)return[t,r];if(Math.abs(e-n/i)<1e-9)break;a=1/(a-o)}return[n,i]}let nf=(e,t)=>t===0?e:nf(t,e%t);function rf(e,t){let[n,r]=tf(e-Math.floor(e)),[i,a]=tf(Math.max(0,t-Math.floor(t))),o=r*a/nf(r,a);return nf(nf(o/r*n,o/a*i),o)/o}function af(e,t,n,r){let i=[],{result:a,statics:o}=e,s=zu(a,o);for(let o of e.tracks){let c=s.map(o.clock),l=Math.min(n,o.end);if(l<=t)continue;let u=c.stepAt(Math.max(0,t))*o.rate,d=c.stepAt(Math.max(0,l))*o.rate;if(!Number.isFinite(u)||!Number.isFinite(d)||d<=u)continue;let f=(t,n)=>{let r=o.share;if(typeof r==`number`)return r;let i=r.series.reduce((t,r)=>{let i=wd(e,r,n);return t*(i?i.value+i.alter:1)},1);return r.range?r.range[0]+(r.range[1]-r.range[0])*i:i},p=(t,n,i,l=1/0)=>{let u=rf(t,n.duration)/o.rate,d=c.q(t/o.rate,u);if(!Number.isFinite(d)||d>=o.end-1e-9)return null;let p=f(t,d),m=Math.min(c.q((p===1?i:t+p*(i-t))/o.rate,u),l<1/0?c.q(l/o.rate):1/0,o.end),h=o.picker?wd(e,o.picker,d):n,g=h&&Xd(a,o.output,h.value);if(!g||e.muted.has($(g.voice)))return null;let _=Jd(e,o.output.envelope?o.output.envelopeCell:o.output.kit?a.cells.get(g.voice)?.env:null,o.output.envelope??(o.output.kit?Yd(a,g.voice):null),d),v=a.cells.get(g.voice)?.oneshot?_??Yd(a,g.voice):null,y=v?v.attack+v.decay:Number.isFinite(m)?m-d:8,b=o.output.kit&&!o.picker||o.output.gate?o.output.offset:o.sign*bd(e,n,d)+o.output.offset,x=[];if(o.mods.length){let t=o.mods.map(t=>xd(e,t,d,d+y)),n=t.reduce((e,t)=>e+t[0].semis,0);b+=n;let r=[...new Set(t.flatMap(e=>e.slice(1).map(e=>e.at)))].sort((e,t)=>e-t);for(let e of r){let r=t.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9)),i=t.reduce((t,n)=>t+Dd(n,e,e=>e.semis),0);x.push({at:e,cents:100*(i-n),...r?{ramp:r}:{}})}}let S=Ru(a,o.clock);if(S&&c.speed&&!o.output.gate){let e=e=>Math.max(.001,c.speed(e)),t=e(d);if(t<.05)return null;if(b+=12*S*Math.log2(t),!x.length)for(let n=d+.04,r=0;n<d+y&&r<400;n+=.04,r++){let r=1200*S*Math.log2(e(n)/t);Math.abs(r)>1&&x.push({at:n,cents:r,ramp:!0})}}let C=o.db?10**((n.value+n.alter)/20):Math.max(0,n.value+n.alter),w=[{at:d,level:(o.output.gate?C:1)*(n.level??1)}];if(o.levels.length){let n=s.written(o.clock).q(t/o.rate),r=o.levels.map(t=>Ed(e,t,d,d+y,n)),i=[...new Set(r.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t),a=w[0].level;w.length=0;for(let e of i)w.push({at:e,level:a*r.reduce((t,n)=>t*Dd(n,e,e=>e.level),1),...r.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9))?{ramp:!0}:{}})}let T=g.freq*2**(b/12),E=yd(e,g.voice,d,y),D=_,O=(e=>{let t=Ld(a,g.voice);if(!o.output.kit)return[e[0]*t,e[1]*t];let[n,r]=mi(a.cells.get(g.voice)?.params.pan);return[e[0]*n*t,e[1]*r*t]})(zd(o.output,e.muted)),k=o.output.midi?Ud(o.output,e.muted):[];return T>0&&T<2e4&&w.some(e=>e.level>0)?{at:d,dur:y,voice:g.voice,freq:T,bends:x,value:n.value+n.alter,gains:O,levels:w,...!o.output.silent&&!Vd(O)?{unheard:!0}:{},...k.length?{midi:k}:{},...D?{env:D}:{},...o.output.through.length?{instrument:o.output.through[0]}:{},...E?{params:E}:{},...ef(e,o.output,d,y),...r?{output:o.output.id}:{}}:null},m=o.output.kit||o.output.gate?0:a.cells.get(o.output.voice)?.glide??0,h=m>0,g=o.events.length,_=e=>(e===0||o.events[e-1].step!==o.events[e].step)&&(e===g-1||o.events[e+1].step!==o.events[e].step),v=(e,t)=>e>0?[e-1,t]:[g-1,t-1],y=(e,t,n,r,i)=>{if(!h||!_(e)||hr(t*g+e,256)===0)return!1;let[s,l]=v(e,t),u=l*o.period+o.events[s].step+o.events[s].duration,d=t*o.period+o.events[e].step;return _(s)&&l>=n&&r+l*o.period+o.events[s].step>=i-1e-9&&Math.abs(u-d)<1e-9&&f(r+l*o.period+o.events[s].step,c.q((r+l*o.period+o.events[s].step)/o.rate,rf(r+l*o.period+o.events[s].step,o.events[s].duration)/o.rate))>=1-1e-9&&!!jd(a,o,o.events[s],l)},b=(e,t,n,r=-1,s=0,c=0,l=0,u=1/0,d=-1/0)=>{if(r>=0&&y(r,s,l,c,d))return;let f=p(e,t,n,u);if(!f)return;if(r<0||!h||!_(r))return void i.push(f);let v=f,b=[{at:f.at,dur:f.dur,freq:f.freq,bends:f.bends}],[x,S]=[r,s];for(let e=0;e<256;e++){[x,S]=x<g-1?[x+1,S]:[0,S+1];let e=c+S*o.period+o.events[x].step;if(e>=u-1e-9||!y(x,S,l,c,d))break;let t=jd(a,o,o.events[x],S),n=t&&p(e,t,e+o.events[x].duration,u);if(!n)break;let r=1200*Math.log2(n.freq/v.freq),i=v.bends.length?v.bends[v.bends.length-1].cents:0,s=Math.min(m,n.dur);v={...v,dur:n.at+n.dur-v.at,bends:[...v.bends,{at:n.at,cents:i},{at:n.at+s,cents:r,ramp:!0},...n.bends.map(e=>({...e,at:Math.max(e.at,n.at+s),cents:e.cents+r}))],levels:[...v.levels,...n.levels.filter(e=>e.at>=n.at)]},b.push({at:n.at,dur:n.dur,freq:n.freq,bends:n.bends})}i.push(b.length>1?{...v,legato:{glide:m,notes:b}}:v)};if(o.selects.length===0){for(let e=Math.floor(u/o.period)-1;e*o.period<d;e++)for(let[t,n]of o.events.entries()){let r=e*o.period+n.step;if(r<u-1e-9||r>=d-1e-9)continue;let i=jd(a,o,n,e);i&&b(r,i,r+n.duration,t,e)}continue}let x=Nd(a,o.output.select),S=e=>e.reduce((e,t)=>{let n=e[e.length-1];return n&&Math.abs(t.a-n.b)<1e-9?e[e.length-1]={a:n.a,b:t.b}:e.push(t),e},[]),C=(t,n)=>{let r=o.output.select[t],i=Pd(e,o.selects[t],n,l),s=a.cells.get(r.part)?.params.restart??a.cells.get(r.cell)?.params.restart;return r.performer&&s!==`restart`?S(i):i},w=(e=>{let t=C(0,e);for(let n of o.selects.keys()){if(n===0)continue;let r=C(n,e);t=t.flatMap(e=>r.flatMap(t=>Math.max(e.a,t.a)<Math.min(e.b,t.b)?[{a:Math.max(e.a,t.a),b:Math.min(e.b,t.b)}]:[]))}return x===`restart`?t:S(t)})(x===`resume`?0:t),T=0;for(let e of w){let t=c.stepAt(e.a)*o.rate,n=c.stepAt(e.b)*o.rate,r=x===`free`?0:x===`resume`?t-T:t;T+=n-t;let i=Math.max(u,t),s=Math.min(d,n);if(!(s<=i))for(let e=Math.floor((i-r)/o.period)-1;r+e*o.period<s;e++)for(let[c,l]of o.events.entries()){let u=r+e*o.period+l.step;if(e<0||u<i-1e-9||u>=s-1e-9)continue;let d=jd(a,o,l,e);d&&b(u,d,u+l.duration,c,e,r,0,n,t)}}}return i.sort((e,t)=>e.at-t.at)}function of(e,t,n,r){let i=[...new Set(e.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t),a=e.map(()=>0),o=[];for(let s of i){let i=r,c=!1;e.forEach((e,r)=>{let o=a[r];for(;o+1<e.length&&e[o+1].at<=s+1e-9;)o++;a[r]=o;let l=e[o],u=e[o+1],d=!u?.ramp||Math.abs(l.at-s)<1e-9?t(l):t(l)+(t(u)-t(l))*(s-l.at)/Math.max(vu,u.at-l.at);i=n(i,d),l.ramp&&Math.abs(l.at-s)<1e-9&&(c=!0)}),o.push({at:s,value:i,...c?{ramp:c}:{}})}return o}function sf(e,t,n,r,i){let a=Math.max(0,i.begins??0),o=Math.min(e.end,i.until??1/0),s=[];for(let i=Math.max(0,Math.floor((t-a)/600));a+i*600<Math.min(n,o);i++){let n=a+i*600;if(n<t-1e-9)continue;let c=Math.min(600,o-n);if(c>0)for(let t of e.drones){let i=t.output,a=e.result.cells.get(i.voice);if(!a)continue;let o=of(t.mods.map(t=>xd(e,t,n,n+c)),e=>e.semis,(e,t)=>e+t,0),l=o[0]?.value??0,u=o.slice(1).map(e=>({at:e.at,cents:100*(e.value-l),...e.ramp?{ramp:!0}:{}})),d=t.levels.length?of(t.levels.map(t=>Ed(e,t,n,n+c)),e=>e.level,(e,t)=>e*t,1).map(e=>({at:e.at,level:e.value,...e.ramp?{ramp:!0}:{}})):[{at:n,level:1}],f=a.freq*2**((i.offset+l)/12);if(!(f>0&&f<2e4)||!d.some(e=>e.level>0))continue;let p=zd(i,e.muted),m=i.midi?Ud(i,e.muted):[],h=yd(e,i.voice,n,c);s.push({at:n,dur:c,voice:i.voice,freq:f,bends:u,gains:p,levels:d,held:!0,...!i.silent&&!Vd(p)?{unheard:!0}:{},...m.length?{midi:m}:{},...i.envelope?{env:Jd(e,i.envelopeCell,i.envelope,n)}:{},...i.through.length?{instrument:i.through[0]}:{},...h?{params:h}:{},...ef(e,i,n,c),...r?{output:i.id}:{}})}}return s}function cf(e){return e.ends===null?e.cycle!==null&&Number.isFinite(e.cycle)&&e.cycle<=1800?e.cycle:e.longest:e.ends}function lf(e){let[t,n,r,i]=[0n,1n,1n,0n],a=e;for(let o=0;o<32;o++){let o=BigInt(Math.floor(a));if([t,n]=[n,o*n+t],[r,i]=[i,o*i+r],i>10000n)return[t,r];let s=a-Math.floor(a);if(s<1e-9||Math.abs(Number(n)/Number(i)-e)<1e-9*Math.max(1,e))break;a=1/s}return[n,i]}let uf=(e,t)=>t===0n?e:uf(t,e%t);function df(e,t){if([...e.cells.values()].some(e=>e.params.law===`fiveto12`))return{ends:86400,cycle:86400,chance:!1,longest:86400};let n=gi(e),r=qd(e,n),i=zu(e,n),a=(e,t)=>{if(!e)return null;let n=i.map(e),r=n.q(t)-n.q(0);return Number.isFinite(r)&&r>1e-6?r:null},o=[],s=!1,c=t=>{let n=e.clocks.get(t),r=n?.tap?.meter??n?.belt?.driver;return r&&r!==t?c(r):t},l=new Set(r.tracks.map(e=>c(e.clock))),u=e=>l.has(c(e));for(let e of r.tracks){let t=a(e.clock,e.period/e.rate),n=e.events.reduce((e,t)=>t.laps?Number(BigInt(e)*BigInt(t.laps.of)/uf(BigInt(e),BigInt(t.laps.of))):e,1);t&&o.push(t*n),e.events.some(e=>e.chance!==void 0||e.options||e.chosen)&&(s=!0);for(let t of[...e.mods.filter(e=>e.clock&&u(e.clock)),...e.levels,...e.selects.map(e=>e.series)]){let e=t.clock?a(t.clock,t.period/t.rate):null;e&&o.push(e)}}for(let e of r.voiceParams.values())for(let t of Object.values(e))for(let e of t.series){let t=e.clock&&u(e.clock)?a(e.clock,e.period/e.rate):null;t&&o.push(t)}let d=new Set([...e.cells.values()].flatMap(e=>e.over?[e.over]:[]));for(let t of e.cells.values()){if(!d.has(t.name)||!t.step||!t.clock||t.loops||e.clocks.has(t.name)||!t.cycle)continue;let n=a(t.clock,1/t.rate);if(!n)continue;let r=Math.max(1,Math.abs(Math.round(t.stride||1)));if(t.wrap===0)continue;let{per:i,laps:s}=Hu(e,t),c=Math.max(1,Math.round(s*Uu(e,t.name))),l=i??c/Number(uf(BigInt(c),BigInt(r)));o.push(n*l)}t?.push(...o);let f=Number.isFinite(r.end)?r.end:null,p=o.length?Math.max(...o):null;if(o.length===0)return{ends:f,cycle:null,chance:s,longest:p};let m=1n,h=0n;for(let e of o){let[t,n]=lf(e);t!==0n&&(m=m/uf(m,t)*t,h=h===0n?n:uf(h,n))}return{ends:f,cycle:h===0n?null:m/h>10n**18n?1/0:Number(m)/Number(h),chance:s,longest:p}}let ff=e=>{if(!e||e.braid.kind!==`list`)return null;let t=e.braid.tokens.map(e=>e.atom.kind===`note`&&e.repeat===1&&e.elongate===1&&e.subdivide===1?e.atom.value:NaN);return t.some(e=>Number.isNaN(e))?null:t};function pf(e,t){let n=e.atom;return n.kind===`note`?{...e,atom:{...n,value:t(n.value)}}:n.kind===`choice`?{...e,atom:{...n,values:n.values.map(t)}}:n.kind===`seq`?{...e,atom:{...n,layers:n.layers.map(e=>e.map(e=>pf(e,t)))}}:e}function mf(e,t,n,r,i){let a=e.braid.kind===`list`?{...e.braid,tokens:e.braid.tokens.map(e=>pf(e,e=>t+(n-t)*e))}:e.braid;return{...e,name:r,span:i,braid:a,label:null,about:void 0,...e.style?{style:void 0}:{}}}let hf=e=>String(Math.round(e*1e9)/1e9);function gf(e,t){let n=new Map(e.cells.map(e=>[e.name,e])),r=[],i=(e,t)=>r.push({severity:`error`,message:e,span:t}),a=e=>{let t=n.get(e.name);if(!t)return null;let r=ff(t);return t.map?.kind!==`style`||!r||r.length!==R.length?(i(`style=&${e.name}: a style is a map=style cell (&${e.name} map=style .3 .45 .55 .55), or a mix of them by weight`,e.span),null):r},o=e=>{if(e.kind===`cell`)return a(e.ref);let t=e.terms.map(e=>({v:a(e.ref),w:e.weight}));return t.some(e=>!e.v)?null:R.map((e,n)=>t.reduce((e,t)=>e+t.w*t.v[n],0))},s=/* @__PURE__ */ new Map;for(let t of e.cells){if(!t.style)continue;let e=o(t.style.from),r=t.style.to?o(t.style.to):null;if(!e||t.style.to&&!r)continue;let a=[e,...r?[r]:[]].flatMap(e=>R.filter((t,n)=>!(e[n]>=t.range[0]-1e-9&&e[n]<=t.range[1]+1e-9)));if(a.length){i(`&${t.name} style=: its style lies outside the axes on ${[...new Set(a.map(e=>e.name))].join(`, `)} (each ${R[0].range[0]} to ${R[0].range[1]}); a mix's weights sum its styles' points`,t.style.span);continue}let c=t.style.curve??null;if(c&&!n.has(c.name))continue;let l=c?n.get(c.name).braid:null;if(c&&!(l?.kind===`list`&&l.tokens.every(e=>e.atom.kind===`note`))){i(`style=a..b * &${c.name}: a curve is a line of numbers from 0 to 1 (&${c.name} map=lin step=1m 0 .5 1)`,c.span);continue}s.set(t.name,{from:e,to:r,curve:c})}let c=/* @__PURE__ */ new Map,l=!1,u=!1,d=e.cells.some(e=>typeof(e.params.play??e.params.trigger)==`string`&&e.braid.kind!==`blank`),f=e=>{if(!e.pick||e.pick.kind!==`at`||!e.pick.abs)return null;let a=e.pick.i,o=n.get(e.name),f=s.get(e.name),p=null,m=R[a]?.name,h=e=>{let t=n.get(e);return t?.map?.kind===`style`&&m?t.paramCells?.[m]:void 0},g=o?.style,_=g?[g.from,...g.to?[g.to]:[]].flatMap(e=>e.kind===`cell`?[e.ref]:e.terms.map(e=>e.ref)):[],v=o?.map?.kind===`style`?h(e.name):void 0;if(!v&&_.some(e=>h(e.name))&&(g.to||g.from.kind!==`cell`&&g.from.kind!==`mix`))return i(`&${e.name}[${m}]: a range of styles doesn't move with a moving one yet; name the moving style alone, style=&${_.find(e=>h(e.name)).name}`,e.span),null;let y=(t,r,i)=>{let a=e.span,o=(e,t)=>({e:{k:`prod`,factors:[{k:`ref`,ref:{name:e,pick:null,shift:0,span:a}},{k:`num`,value:t,span:a}],span:a},sign:1}),s=[{k:`sum`,items:[...r.map(e=>o(e.cell,e.weight)),...i===0?[]:[{e:{k:`num`,value:i,span:a},sign:1}]],span:a}];return c.set(t,{...c.get(r[0].cell)??n.get(r[0].cell),name:t,span:a,params:{},paramSpans:{},paramCells:void 0,paramClocks:void 0,map:null,step:null,label:null,about:void 0,style:void 0,braid:{kind:`list`,tokens:[{atom:{kind:`mix`,exprs:s},repeat:1,subdivide:1,elongate:1,span:a}]}}),t},b=(e,t,r,a,o)=>{if(c.has(a))return a;let s=Es(e,n);if(s){let e=s.terms.reduce((e,t)=>e+t.weight,0),n=s.terms.map((e,n)=>({cell:b(e.cell,t,r,`${a}_${n}`,o),weight:e.weight}));return n.some(e=>e.cell===null)?null:y(a,n,t*(1-e)+(r-t)*s.constant)}let l=n.get(e);return l?l.braid.kind===`list`?(c.set(a,mf(l,t,r,a,o)),a):(i(`${m}=… * &${l.name}: an axis moves by a line of numbers from 0 to 1, like &${l.name} step=1m*8 [0|.25|.5|.75|1], or a sum of them`,o),null):null},x=(e,t)=>{if(e.factors.length!==1||e.factors[0].pick)return i(`${m}=… * &x: an axis moves by one cell, a line of numbers or a sum of them, &drift [&a * .5 + &b * .5] (decision 079)`,e.span),null;let[n,r]=e.range??R[a].range;return b(e.factors[0].name,n,r,t,e.factors[0].span)};if(v)return x(v,`λ${e.name}_${a}`);if(g?.from.kind===`cell`&&!g.to){let e=h(g.from.ref.name);if(e)return x(e,`λ${g.from.ref.name}_${a}`)}if(g?.from.kind===`mix`&&!g.to&&_.some(e=>h(e.name))){let t=`λ${e.name}_${a}`;if(c.has(t))return t;let r=[],i=0;for(let e of g.from.terms){let t=h(e.ref.name);if(t){let n=x(t,`λ${e.ref.name}_${a}`);if(n===null)return null;r.push({cell:n,weight:e.weight})}else i+=e.weight*(ff(n.get(e.ref.name))?.[a]??0)}return y(t,r,i)}if(!o&&e.name===`style`)p=hf(Rt[a]),!u&&d&&r.push({severity:`info`,message:`no line writes &${Lt}: &${Lt}[${R[a].name}] reads the centre of style space, ${hf(Rt[a])} on each axis (a score names its style as the note &${Lt} style=…, decision 063)`,span:e.span}),u=!0;else if(f){let r=f.from[a],i=f.to?f.to[a]:r;f.to&&!f.curve&&(l=!0);let o=f.curve?n.get(f.curve.name):void 0;if(o&&r!==i){let t=`λ${e.name}_${a}`;return c.has(t)||c.set(t,mf(o,r,i,t,e.span)),t}if(r===i||!t)p=hf(r);else if(`bars`in t){let e=t.bars*16;p=`map=lin step=1m*16 ${Array.from({length:e},(t,n)=>hf(r+(i-r)*n/e)).join(` `)}`}else p=`map=lin step=${hf(1/t.seconds)}hz ${hf(r)} ${hf(i)}`}else if(o&&(o.map?.kind===`style`||o.map?.kind===`adsr`)){let e=ff(o)?.[a];e!==void 0&&(p=hf(e))}if(p===null)return null;let S=`λ${e.name}_${a}`;if(!c.has(S)){let t=Ro(`&styleRead lpf=0..1 * &(${p})`).cells.find(e=>e.name!==`styleRead`);t&&c.set(S,{...t,name:S,span:e.span})}return c.has(S)?S:null},p=!1,m=e.cells.map(e=>{if(!e.paramCells)return e;let t=null;for(let[n,r]of Object.entries(e.paramCells)){let i=r.factors.map(e=>{let t=f(e);return t?{name:t,pick:null,shift:0,span:e.span}:e});i.some((e,t)=>e!==r.factors[t])&&((t??={...e.paramCells})[n]={...r,factors:i})}return t?(p=!0,{...e,paramCells:t}):e});return!p&&!r.length?{parsed:e,glides:l}:{parsed:{...e,cells:[...m,...c.values()],diagnostics:[...e.diagnostics,...r]},glides:l}}function _f(e,t=_i,n){let r=Pl(e),i=gf(r,null),a=Wl(i.parsed,t,n);if(!i.glides)return a;let o=vf(a);return o?Wl(gf(r,o).parsed,t,n):a}function vf(e){let t=e.ok?cf(df(e)):null;if(!t||!Number.isFinite(t)||t<=0)return null;let n=e.mainMeter;if(!n||!e.clocks.has(n))return{seconds:t};let r=e.cells.get(n)?.units.length??0;if(!r)return{seconds:t};let i=zu(e,gi(e)).map(n).stepAt(t)/r;return Math.abs(i-Math.round(i))<1e-6&&Math.round(i)>0?{bars:Math.round(i)}:{seconds:t}}function yf(e,t=_i,n={}){if(!Go(e))return _f(Ro(e,{old:n.old??!1}),t);let r=hs(e,n),i=_f(Ro(r.text,{old:n.old??!1}),t,r.given),a=[...r.diagnostics,...i.diagnostics.map(e=>({...e,span:r.through(e.span.line)??e.span}))].sort((e,t)=>e.span.line-t.span.line||e.span.col-t.span.col);return{...i,ok:!a.some(e=>e.severity===`error`),diagnostics:a,uses:r.uses}}let bf=e=>Math.abs(e-Math.round(e))<1e-9,xf=(e,t)=>e.steps>0&&bf(t*e.rate/e.steps);function Sf(e){for(let t=1;t<=4096;t++)if(xf(e,t*e.bars))return t;return 0}let Cf=(e,t,n)=>xf(e,Yi(t,n,e.bars).length);function wf(e,t,n,r){let i=Ro(e).cells,a=r??new Set(i.map(e=>e.name)),o=t.mainMeter!==void 0&&a.has(t.mainMeter);return i.flatMap(e=>{let r=e.step;if(r?.kind!==`tap`||n&&!n.has(e.name)||(r.meter?a.has(r.meter.name):o))return[];let i=t.cells.get(e.name);if(!i||i.voice||i.steps<=0)return[];let s=Math.max(1,Math.round(e.cycle??1)),c={cell:`&${e.name}`,meter:r.meter?`&${r.meter.name}`:null,tap:r.tap.written,bars:s,steps:i.steps,rate:r.ratio};return[{need:{...c,bar:Sf(c)},tap:r.tap}]})}let Tf=e=>e.kind===`ref`?e.pick||e.shift||e.transpose||e.values?[e.name]:[]:e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>Tf(e.atom))):[],Ef=e=>new Set(e.flatMap(e=>e.braid.kind===`list`?e.braid.tokens.flatMap(e=>Tf(e.atom)):[]).map(e=>`&${e}`));function Df(e){let t=new Set(e.flatMap(e=>wc(e)).map(e=>`&${e}`)),n=/* @__PURE__ */ new Set([...e.flatMap(e=>Tc(e)).map(e=>`&${e}`),...Ef(e)]);return e=>t.has(e)&&!n.has(e)}let Of=(e,t)=>t&&Go(e)?hs(e,{resolve:t}).text:e,kf=e=>`${e} s=white`;function Af(e,t,n){let r=Of(e,n),i=Ro(r).cells,a=i.filter(e=>!e.lambda),o=t(e),s=o.unknown.map(e=>`&${e.name}`),c=a.some(e=>e.over?.name===`key:main`)&&!o.mainKey,l=Df(i),u=new Set(s.filter(l)),d=new Set(i.map(e=>`&${e.name}`));if(u.size)for(let e of new Set(a.flatMap(e=>wc(e)).map(e=>`&${e}`)))l(e)&&!d.has(e)&&u.add(e);let f=o;for(;u.size;){f=t(`${e}\n${[...u].map(kf).join(`
`)}`);let n=f.unknown.map(e=>`&${e.name}`).filter(e=>l(e)&&!u.has(e));if(!n.length)break;n.forEach(e=>u.add(e))}let p=[.../* @__PURE__ */ new Set([...s,...u,...c?[`key`]:[]])].sort(),m=p.filter(l),h=Ef(i),g=m.map(kf).join(`
`),_=g?`${r}\n${g}`:r,v=Ko(e);return{uses:p,sounds:m,lines:p.filter(e=>h.has(e)),defines:[.../* @__PURE__ */ new Set([...a.map(e=>`&${e.name}`),...(o.uses??[]).flatMap(e=>e.gave)])],clock:wf(_,g?f:o).map(e=>e.need),...v?{signature:{heads:v.names,optional:v.optional,main:v.main}}:{}}}let jf=/^\s*&([A-Za-z_][A-Za-z0-9_]*)(?=\s|$)/,Mf=/[+*,[]\s*$/;function Nf(e){let t=[],n=null;for(let r of e.split(`
`)){let e=V(r)[0];if(n??={written:[],code:[]},n.written.push(r),n.code.push(e),Mf.test(e))continue;let i=n.code.join(` `).trim().split(/\s+/).join(` `),a=jf.exec(i)?.[1];a&&Un(i)===void 0&&t.push({name:a,written:n.written.join(`
`),code:i}),n=null}return t}let Pf=e=>new Set(e.split(`
`).flatMap(e=>[...V(e)[0].matchAll(/&([A-Za-z_][A-Za-z0-9_]*)/g)]).map(e=>e[1]??``)),Ff=e=>e.split(`
`).map(e=>V(e)[0].trim().split(/\s+/).join(` `)).filter(e=>Un(e)?.kind===`use`);function If(e,t){let n=new Map(Nf(t).map(e=>[e.name,e])),r=/* @__PURE__ */ new Set([...Pf(t),...Pf(e)]),i=/* @__PURE__ */ new Map;for(;;){let a=e;for(let[e,t]of i)a=ur(a,e,t);let o=Nf(a),s=[],c=[];for(let e of o){let t=n.get(e.name);t&&(t.code===e.code?s.push(e.name):c.push(e.name))}if(!c.length){let n=new Set(Ff(t)),r=[...Ff(e).filter(e=>!n.has(e)),...o.filter(e=>!s.includes(e.name)).map(e=>e.written)],a=t.replace(/\s+$/,``),c=e=>e.map(e=>`&${e}`);return{text:[...a?[a]:[],...r].join(`
`),renamed:new Map([...i].map(([e,t])=>[`&${e}`,`&${t}`])),shared:c(s),names:c([...new Set(o.map(e=>e.name))])}}for(let e of c){let t=2;for(;r.has(`${e}${t}`);)t++;r.add(`${e}${t}`),i.set(e,`${e}${t}`)}}}function Lf(e,{need:t,tap:n}){let r=t.meter?t.meter.slice(1):e.mainMeter,i=r===void 0?null:e.cells.get(r)?.meter;return!!i&&Cf(t,i,n)}let Rf=e=>e.unknown.map(e=>`&${e.name}`),zf=/^(&\w+) (?:is only on a MIDI card: its sound|is named as General MIDI's drum)/,Bf=(e,t)=>e.severity===t.severity&&e.message===t.message&&e.span.line===t.span.line&&e.span.col===t.span.col;function Vf(e,t,n,r){let i=n??(e=>yf(e,void 0,r?{resolve:r}:{})),a=Af(e,i,r),o=i(t),s=/* @__PURE__ */ new Set([...Nf(t).map(e=>`&${e.name}`),...(o.uses??[]).flatMap(e=>e.gave)]),c=a.uses.filter(e=>e===`key`?!o.mainKey:!s.has(e)),l=c.filter(e=>a.sounds.includes(e)),u=c.filter(e=>!l.includes(e)),d=Of(e,r),f=Df(Ro(d).cells),p=If(e,t),m=a.sounds.map(kf),h=wf([d,...m].join(`
`),i([e,...m].join(`
`))).filter(e=>!Lf(o,e)).map(e=>e.need),g={fits:!1,union:p,missing:u,sounds:l,unmet:h};if(u.length||h.length)return g;let _=Ro(t).cells,v=Df(_),y=[...new Set(_.flatMap(e=>wc(e)).map(e=>`&${e}`))].filter(e=>!s.has(e)&&!p.names.includes(e)&&v(e)).map(kf),b=y.length?i([t,...y].join(`
`)):o,x=()=>[p.text,.../* @__PURE__ */ new Set([...l.map(kf),...y])].join(`
`),S=i(x());for(;;){let e=Rf(S).filter(e=>f(e)&&!l.includes(e)&&!s.has(e)&&!p.names.includes(e));if(!e.length)break;l.push(...e),S=i(x())}l.sort();let C=[...b.diagnostics],w=new Set([...l,...y.map(e=>e.split(` `)[0])].map(e=>e.startsWith(`&`)?e:`&${e}`)),T=S.diagnostics.filter(e=>{let t=zf.exec(e.message);if(t&&w.has(t[1]))return!1;let n=C.findIndex(t=>Bf(t,e));return n<0||(C.splice(n,1),!1)}),E=e=>new Set(e.map(e=>e.slice(1))),D=E(p.names.filter(e=>!p.shared.includes(e))),O=wf(x(),S,E(p.names),D).filter(e=>!Lf(S,e)).map(e=>e.need);return{fits:!T.length&&!O.length,union:p,missing:u,sounds:l,unmet:O,diagnostics:T}}function Hf(e,t){let n=/* @__PURE__ */ new Map;return r=>{if(n.has(r)){let e=n.get(r);return n.delete(r),n.set(r,e),e}let i=t(r);return n.set(r,i),n.size>e&&n.delete(n.keys().next().value),i}}function Uf(e,t=512){let n=/* @__PURE__ */ new Map,r=(t,r)=>n.get(t)??e(t,r),i=Hf(t,e=>yf(e,void 0,{resolve:r})),a=Hf(t,e=>{let{id:t,workbench:n,main:a}=JSON.parse(e);return Zf(t,n,{resolve:r,compiled:i,...a===null?{}:{main:a}})});return(e,t,r)=>{let i=`fit_${Yo(e).slice(3)}`;return n.set(i,e),a(JSON.stringify({id:i,workbench:t,main:r??null}))}}let Wf=/^([^(]*)\((.*)\)$/;function Gf(e,t,n,r){let i=Wf.exec(t),a=[...i?[i[2]]:[],...Object.entries(n??{}).map(([e,t])=>`${e}=${t}`)];return`${e.join(`, `)} from ${i?i[1]:t}${a.length?`(${a.join(`, `)})`:``}${r?` ${r}`:``}`}let Kf=(e,t)=>t??(t=>yf(t,void 0,{resolve:e}));function qf(e,t){let n=[...t];return e.diagnostics.filter(e=>{let t=n.findIndex(t=>Bf(t,e));return t<0||(n.splice(t,1),!1)})}function Jf(e,t,n,r,i,a){let o=i([e,...a].join(`
`)),s=new Set(a.map(e=>e.split(` `)[0])),c=c=>!qf(i([e,Gf(n,t,r,c),...a].join(`
`)),o.diagnostics).filter(e=>!s.has(zf.exec(e.message)?.[1]??``)).length,l=Ro(e).offers,u=l?.length?l.map(e=>`&${e}`):Nf(e).map(e=>`&${e.name}`),d=[];for(let e of u)if(!n.includes(e)&&c(e)&&d.push(e)>1)return null;return d[0]??null}function Yf(e,t){let n=Pf(e),r=t.replace(/^&/,``);if(!n.has(r))return`&${r}`;let i=2;for(;n.has(`${r}${i}`);)i++;return`&${r}${i}`}function Xf(e,t,n){let r=Kf(n.resolve,n.compiled),i=n.resolve(t),a=e.replace(/\s+$/,``),o=e=>[...a?[a]:[],e].join(`
`),s=e=>r(e).uses?.at(-1)??null,c=i===null?null:Ko(i);if(i===null||!c){let e=`* from ${t}`;return{text:o(e),line:e,heads:[],main:null,used:i===null?null:s(o(e))}}let l=c.names.length===1?[n.head??Yf(e,c.names[0])]:c.names,u=Af(i,r,n.resolve).sounds.filter(t=>!Pf(e).has(t.slice(1))).map(kf),d=n.main??(c.main?Jf(e,t,l,n.args,r,u):null),f=Gf(l,t,n.args,d);return{text:o(f),line:f,heads:l,main:d,used:s(o(f))}}function Zf(e,t,n){let r=Kf(n.resolve,n.compiled),i=n.resolve(e);if(i===null)return{fits:!1,text:t,use:null,missing:[],sounds:[],unmet:[]};let a=Ko(i);if(!a){let e=Vf(i,t,r,n.resolve);return{fits:e.fits,text:e.union.text,use:null,union:e.union,missing:e.missing,sounds:e.sounds,unmet:e.unmet,...e.diagnostics?{diagnostics:e.diagnostics}:{}}}let o=Xf(t,e,{...n,compiled:r});if(a.main&&o.main===null)return{fits:!1,text:o.text,use:o,missing:[a.main],sounds:[],unmet:[]};let s=new Set(Pf(t)),c=Af(i,r,n.resolve).sounds.filter(e=>!s.has(e.slice(1))).sort(),l=c.map(kf),u=[o.text,...l].join(`
`),d=r(u),f=new Set(c),p=qf(d,r([t,...l].join(`
`)).diagnostics).filter(e=>{let t=zf.exec(e.message);return!(t&&f.has(t[1]))}),m=new Set((o.used?.gave??[]).map(e=>e.slice(1))),h=wf(hs(u,{resolve:n.resolve}).text,d,m,m).filter(e=>!Lf(d,e)).map(e=>e.need);return{fits:!p.length&&!h.length,text:o.text,use:o,missing:[],sounds:c,unmet:h,diagnostics:p}}Object.freeze({filed:Object.freeze([]),points:Object.freeze([]),together:Object.freeze([])});let Qf=.1,$f=(e,t,n=Qf)=>t>0&&n>0?e-n*.1*Math.log1p(Math.min(t,10))/Math.log1p(10):e,ep=e=>typeof e==`number`&&Number.isFinite(e);function tp(e,t){if(typeof e!=`object`||!e)return[`${t}: not a style point`];let n=Object.entries(e);return n.length?n.flatMap(([e,n])=>ep(n)?[]:[`${t}: ${e} is ${String(n)}, not a number`]):[`${t}: an empty point (no axes)`]}function np(e){let t=[],{id:n,text:r,association:i}=e;(typeof n!=`string`||!n.trim())&&t.push(`no id`);let a=typeof n==`string`&&n.trim()?n:`(no id)`;return(typeof r!=`string`||!r.trim())&&t.push(`${a}: no text`),!Array.isArray(i)||!i.length?t.push(`${a}: no style point in its association`):i.forEach((e,n)=>t.push(...rp(e,`${a}: point ${n+1}`))),t}function rp(e,t){let n=[];(!e||!ep(e.weight)||e.weight<=0)&&n.push(`${t}: weight ${String(e?.weight)}, not a number > 0`);let r=e?.facet;return r!==void 0&&(typeof r!=`string`||!r.trim())&&n.push(`${t}: facet ${String(r)}, not a name`),n.push(...tp(e?.point,t)),n}function ip(e){let{filed:t,points:n,together:r}=e,i=[];if(!Array.isArray(t))i.push(`the layer: filed is not a list`);else{let e=/* @__PURE__ */ new Set;t.forEach((t,n)=>{let r=`filed ${n+1}`;if(!t?.fragment)return void i.push(`${r}: no fragment`);i.push(...np(t.fragment).map(e=>`${r}: ${e}`)),(typeof t.meta!=`object`||t.meta===null||Array.isArray(t.meta))&&i.push(`${r}: its meta is not a map`),typeof t.prose!=`string`&&i.push(`${r}: its prose is not a string`),e.has(t.fragment.id)&&i.push(`${r}: the id ${t.fragment.id} is filed twice`),e.add(t.fragment.id)})}if(Array.isArray(n)?n.forEach((e,t)=>{let n=`learned point ${t+1}`;(typeof e?.id!=`string`||!e.id.trim())&&i.push(`${n}: no id`),i.push(...rp(e,n))}):i.push(`the layer: points is not a list`),!Array.isArray(r))i.push(`the layer: together is not a list`);else{let e=/* @__PURE__ */ new Set;r.forEach((t,n)=>{let r=`pair ${n+1}`,a=t?.ids,[o,s]=Array.isArray(a)?a:[];if(!Array.isArray(a)||a.length!==2||typeof o!=`string`||typeof s!=`string`||!o.trim()||!s.trim())return void i.push(`${r}: its ids are not two names`);up(o,s)<0||i.push(`${r}: its ids ${o} and ${s} are not two, in order`),Number.isInteger(t?.count)&&t.count>0||i.push(`${r}: its count ${String(t?.count)} is not a whole number > 0`);let c=JSON.stringify([o,s]);e.has(c)&&i.push(`${r}: ${o} and ${s} are counted twice`),e.add(c)})}return i}function ap(e,t,n={}){let r=0,i=0;for(let a of Object.keys(e)){if(!Object.hasOwn(t,a))continue;let o=n[a]??1;r+=o*(e[a]-t[a])**2,i+=o}return i>0?Math.sqrt(r/i):1/0}let op=(e,t)=>t===void 0?e.association:e.association.filter(e=>e.facet===void 0||e.facet===t);function sp(e,t,n={},r){return Math.min(...op(e,r).map(e=>ap(e.point,t,n)/e.weight))}let cp=new Map([...zo].reverse().map(([e,t])=>[t,e])),lp=e=>cp.get(e)??e,up=(e,t)=>{let[n,r]=[lp(e),lp(t)];return n<r?-1:+(n>r)};function dp(e,t){try{return vs(e)}catch(n){return t.push(`${String(e?.id)}: ${n instanceof Error?n.message:String(n)}`),[]}}function fp(e){let t=[],n=e.flatMap(e=>dp(e,t));t.push(...n.flatMap(np));let r=/* @__PURE__ */ new Set;for(let{id:e}of n)r.has(e)&&t.push(`${e}: the id is given twice`),r.add(e);if(t.length)throw Error(`A malformed repository: ${t.join(`; `)}`);let i=[...n],a=t=>{let n=new Map([...e,...t].map(e=>[e.id,e.text]));return e=>n.get(e)??null},o=Uf(a(i)),s={fragments:i,filed:/* @__PURE__ */ new Set,together:/* @__PURE__ */ new Map,unheld:[]};function c(e){let t=ip(e);for(let{fragment:n}of Array.isArray(e.filed)?e.filed:[])r.has(n?.id)&&t.push(`the layer files ${n.id}, a seed fragment's id`);if(t.length)throw Error(`A malformed learned layer: ${t.join(`; `)}`);if(!e.filed.length&&!e.points.length&&!e.together.length)return s;let n=e.filed.flatMap(e=>dp(e.fragment,t));for(let{id:i}of n)r.has(i)&&!e.filed.some(e=>e.fragment.id===i)&&t.push(`the layer files ${i}, a seed fragment's id`);if(t.length)throw Error(`A malformed learned layer: ${t.join(`; `)}`);let a=new Set(n.map(e=>e.id)),o=e=>r.has(e)||a.has(e),c=/* @__PURE__ */ new Map,l=/* @__PURE__ */ new Set;for(let{id:t,point:n,weight:r,facet:i}of e.points){if(!o(t)){l.add(t);continue}let e=c.get(t)??[];e.push({point:n,weight:r,...i===void 0?{}:{facet:i}}),c.set(t,e)}let u=e=>{let t=c.get(e.id);return t?{...e,association:[...e.association,...t]}:e},d=/* @__PURE__ */ new Map,f=(e,t,n)=>{let r=d.get(e)??/* @__PURE__ */ new Map;r.set(t,(r.get(t)??0)+n),d.set(e,r)};for(let{ids:t,count:n}of e.together){let[e,r]=t;for(let e of t)o(e)||l.add(e);o(e)&&o(r)&&(f(e,r,n),f(r,e,n))}return{fragments:[...i.map(u),...n.map(u)],filed:a,together:d,unheld:[...l].sort(up)}}return{fragments:i,merge:c,query(e,t,n={},{facet:r,chosen:l=[],workbench:u,layer:d,pull:f=Qf,arguments:p={}}={}){if(!(Number.isInteger(t)&&t>=0))throw Error(`query: k is ${t}, not a whole number ≥ 0`);if(!(ep(f)&&f>=0))throw Error(`query: pull is ${String(f)}, not a number ≥ 0`);let m=[...Object.entries(e).flatMap(([e,t])=>ep(t)?[]:[`${e} is ${String(t)}`]),...Object.entries(n).flatMap(([e,t])=>ep(t)&&t>0?[]:[`${e}'s weight is ${String(t)}`])];if(m.length)throw Error(`query: ${m.join(`, `)}`);let{fragments:h,filed:g,together:_}=d?c(d):s,v=[...new Set(l)],y=e=>{let t=_.get(e),n=0;if(t)for(let e of v)n+=t.get(e)??0;return n},b=h.filter(e=>op(e,r).length>0).map(t=>{let i=sp(t,e,n,r);return{fragment:t,distance:i,score:$f(i,y(t.id),f)}}).sort((e,t)=>e.score-t.score||Number(g.has(t.fragment.id))-Number(g.has(e.fragment.id))||up(e.fragment.id,t.fragment.id));if(u===void 0)return b.slice(0,t);let x=d&&h!==i?Uf(a([...h,...d.filed.map(e=>e.fragment)])):o,S=e=>{if(r!==void 0)return p[r];for(let t of e.association)if(t.facet!==void 0&&p[t.facet]!==void 0)return p[t.facet]},C=[];for(let e of b){if(C.length>=t)break;x(e.fragment.text,u,S(e.fragment)).fits&&C.push(e)}return C}}}let pp=[`id`,`association`],mp=[`point`,`weight`,`facet`,`args`],hp=(e,t)=>e.entries.find(e=>e.key===t);function gp(e,t){return e.kind===`list`?e.items.map((e,n)=>{let r=`point ${n+1}`;if(e.kind!==`map`)return t.push({line:e.line,message:`${r} is a map (point, weight, facet)`}),{point:{},weight:0};for(let n of e.entries)mp.includes(n.key)||t.push({line:n.line,message:`${r}: ${n.key} is none of point, weight, facet, args`});let i={},a=hp(e,`point`);if(!a)t.push({line:e.line,message:`${r} has no point`});else if(a.value.kind!==`map`||!a.value.entries.length)t.push({line:a.line,message:`${r}: its point is a map of axes to numbers`});else for(let e of a.value.entries)e.value.kind===`scalar`&&typeof e.value.value==`number`?i[e.key]=e.value.value:t.push({line:e.line,message:`${r}: ${e.key} is ${JSON.stringify(An(e.value))}, not a number`});let o=hp(e,`weight`),s=o?.value.kind===`scalar`?o.value.value:void 0;typeof s!=`number`&&t.push({line:o?.line??e.line,message:`${r}: ${o?`its weight is ${JSON.stringify(An(o.value))}, not a number`:`no weight`}`});let c=hp(e,`facet`),l=c?.value.kind===`scalar`?c.value.value:void 0;c&&typeof l!=`string`&&t.push({line:c.line,message:`${r}: its facet is ${JSON.stringify(An(c.value))}, not a name`});let u=hp(e,`args`),d={};if(u&&(u.value.kind!==`map`||!u.value.entries.length))t.push({line:u.line,message:`${r}: its args are a map of parameters to values`});else if(u&&u.value.kind===`map`)for(let e of u.value.entries){let n=e.value.kind===`scalar`?e.value.value:void 0;typeof n==`string`&&/^[A-Za-z0-9_.#:/+*(),"' -]+$/.test(n)&&!/[&=]/.test(n)||typeof n==`number`?d[e.key]=String(n):t.push({line:e.line,message:`${r}: its arg ${e.key} is ${JSON.stringify(An(e.value))}, not a value (a word, a number, 8n:2/3, meter("7/8"))`})}return{point:i,weight:typeof s==`number`?s:0,...typeof l==`string`?{facet:l}:{},...Object.keys(d).length?{args:d}:{}}}):(t.push({line:e.line,message:"the association is a list of points (`- point: …`)"}),[])}function _p(e){let t=e.split(/\r?\n/);if(t[0]!==`---`)return{problems:[{line:1,message:"no frontmatter: a fragment file starts with a line `---`"}]};let n=pr(e);if(`problems`in n)return{problems:n.problems.map(e=>/^the frontmatter is a map/.test(e.message)?{...e,message:"the frontmatter is a map (`id: …`, `association: …`)"}:e)};let r=t.indexOf(`---`,1),i=kn(t.slice(1,r).join(`
`),2).node,a=[],o=hp(i,`id`),s=o?.value.kind===`scalar`?o.value.value:void 0;o?typeof s!=`string`&&a.push({line:o.line,message:`the id is ${JSON.stringify(An(o.value))}, not a string: quote it`}):a.push({line:1,message:`no id in the frontmatter`});let c=hp(i,`association`);c||a.push({line:1,message:`no association in the frontmatter`});let l=c?gp(c.value,a):[];if(a.length)return{problems:a.sort((e,t)=>e.line-t.line)};let u={id:s,text:n.text,association:l},d=np(u);return d.length?{problems:d.map(e=>{let t=/point (\d+)/.exec(e);return{line:t?c.value.items[Number(t[1])-1].line:/no text/.test(e)?(n.map?.[0]?.line??r+2)-1:o.line,message:e}})}:{fragment:u,meta:Object.fromEntries(Object.entries(n.frontmatter).filter(([e])=>!pp.includes(e))),prose:n.prose,layout:n.layout}}function vp(e){let t=[],n=[],r=/* @__PURE__ */ new Map;for(let[i,a]of Object.entries(e)){let e=_p(a);if(`problems`in e){n.push(...e.problems.map(e=>`${i}:${e.line}: ${e.message}`));continue}let{id:o}=e.fragment,s=r.get(o);s===void 0?r.set(o,i):n.push(`${i}:${a.split(`
`).findIndex(e=>/^id:/.test(e))+1}: the id ${o} is given twice (first in ${s})`),t.push({path:i,...e})}return n.length?{problems:n}:{files:t}}let yp={"bands/01-band":"---\nid: band\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: band\nsource: seed\n---\n\n```cells\n&band &drums &bass &pad &stab &lead\n&drums, &drumsOut from drums_performer &drumlines\n&bass, &bassOut from bass_performer(bassLevel=&bassLevel) &bassline\n&pad, &padOut from pad_performer(padLevel=&padLevel) &padline\n&stab, &stabOut from stab_performer(stabLevel=&stabLevel) &stabline\n&lead, &leadOut from lead_performer(leadLevel=&leadLevel) &leadline\n&bassLevel map=amp .8\n&padLevel map=amp .8\n&stabLevel map=amp .8\n&leadLevel map=amp .8\n&sound map=sample [&drumsOut, &bassOut * .8, &padOut * .35, &stabOut * .4, &leadOut * .45]\n&midi map=midi &leadOut &bassOut [&padOut, &stabOut] ~!6 &drumsOut\n```\n\nThe default band (decision 063 §1, #391): who plays a score, on what, and where it goes out. A score ends in `* from band`, the same line on every client, and each client's resolver answers `band` with its own; this is the one cells' library holds.\n\n**Its head, `&band`,** is decision 061's table of performers: the five role cells, `&drums`, `&bass`, `&pad`, `&stab` and `&lead`, so a score's selector over the band (`&form over=&band step=1m …`) reads the client's players. Who plays when is the score's; who they are, the band's.\n\n**The performers** are the seed library's five (decisions 058 and 061), each a copy taken by its signature (decision 065): its role and its gate, `&bass, &bassOut from bass_performer(bassLevel=&bassLevel) &bassline`. The part each plays is the score's, by its interface name (`&drumlines`, `&bassline`, `&padline`, `&stabline`, `&leadline`), and so are its levels (`&bassLevel` …). A level the score doesn't write is the band's own, one level of .8, the performers' default; the score's line wins over it, as a piece's line wins over what it takes (decision 054 §2). A part the score doesn't write rests, and cells says so (decision 063 §4); a conductor that rests a role writes it as a tacet (`&padline step=1m ~`), and nothing is said.\n\n**The instruments** are the performers' own (`bass`, `keys`, `pad`, `lead`, and 13 of `gm_kit`'s voices), each with a sound. They read the score's style, `&style` (decision 063 §3), where Jambot's `timbreOf` reads it (yggi/jambot `packages/engine/src/sound.ts` @ 227aa74): the bass's cutoff opens with articulation; the lead blends from a triangle to a square as articulation rises, its cutoff opening with energy; the chords' attack and release shorten as articulation rises (decision 066, #411). The band defines no `&style`: the section's style is the composer's, and the score writes it.\n\n**Which instrument a performer plays at a style** is the band's choice, made by a query at resolution, not by a line: `resolveBand(score)` answers `band` with this text, each pitched voice the first instrument the library ranks at the score's style that defines it, where that isn't the performer's own (`bandAt`, `src/repository/band.ts`; yggi/jambot#527's rule, moved here). At each of Jambot's eight presets that is the performer's own instrument, so the band plays as written; at Electro swing's point the upright bass, the brass stab and the clarinet, at Spooky's the round bass, the organ, the celesta and the theremin (#366). Each holds its default's register, so MIDI out sends the same notes. Each is voiced for its own point and reads no `&style`: where one plays, the style moves no cutoff of that voice, as it does the default bass's and lead's. The instruments are found at the score's style where it starts, so a section that glides into or out of Electro swing plays the instruments of its first end throughout. A line can't make that choice: a voice reads a style as a moving parameter, and a wave or a set of envelopes is no such parameter.\n\n**The cards:** a sound card that hears every gate, the drums at full, the bass at .8, the lead at .45 and the chords under it (the pad at .35, the stab at .4), as Jambot's synth balances its parts (`PEAK`, yggi/jambot `apps/web/src/audio/voices.ts` @ 227aa74, its chords' several notes each quieter), and a MIDI card on Jambot's channels: 1 the lead, 2 the bass, 3 the pad and the stab, 10 the drums. A person with a fifth synth gives the stab its own channel in their band.\n\nA score played on this band sends the MIDI Jambot's section text sends on its single card (channel, note, velocity, onset and end): its twenty sections at the ten presets, seeds 1 and 2, 0 mismatched (`band.slow.test.ts`).\n\nAssociated once as the facet `band` at the centre of style space, at weight 1: it plays every style, reading the style it is given.\n","bass/01-root-bass":`---
id: root_bass
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
&bassline from &harm
&bassline over=&harm step=2n 0 0
\`\`\`

Jambot's bass pattern \`root\`: the root of the chord in force on one and on three, the bar's downbeat and its half (\`bass.ts\` weighs them 1 and 0.6).
Its own lines read the host's \`&harm\` (\`over=&harm\`: each index a tone of the chord sounding) and tap the host's main meter, so it fits any workbench whose \`&bar\` and \`&harm\` are written first; it has no card (#291): it is the part the bass performer plays (\`&bassline\`, decision 058), and the workbench's card sends it.

At the point where the root is all \`bass.ts\` plays: there its blend weighs the pump, the eighths and the funk line 0 (no sync, no energy, legato), so the root's share is 1.
Of the points where it is 1, this is the nearest to Ambient's, the preset where the root's share is greatest (0.68): Ambient's harmony, its sync and energy at 0.
It is also at the three presets where the root is what \`bass.ts\` plays most, as the meters are at theirs (#209): Synth-pop's (0.32, the funk line 0.27), Deep house's (0.31, tied with the funk line, which the root takes as first in \`bass.ts\`'s order) and Ambient's (0.68). A preset plays a blend, and its nearest pattern's point needn't be the pattern it plays most.

What \`bass.ts\` adds that a fixed line doesn't: on three it plays the fifth one section in five and an octave up one in four, by a draw per section and step; it thins the line by the energy (each step sounds when a held draw falls under its weight times 0.55 + 0.6 × energy); the octave, the voice leading and the velocity are the performer's.

**Its signature** (decision 065): \`&bassline from &harm\`. \`&bassline from root_bass &harm\` takes a copy of it, \`&harm\` its main argument.
`,"bass/02-pumping-bass":`---
id: pumping_bass
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
&bassline from &harm
&bassline over=&harm step=8n ~ 0 ~ 0 ~ 0 ~ 0
\`\`\`

Jambot's bass pattern \`pump\`: the root of the chord in force on the eighth after each beat, and nothing on the beat, not even on a chord change (\`bass.ts\` plays the new root on a change only while the pump weighs under 0.45).
Its own lines read the host's \`&harm\` and tap the host's main meter; it has no card (#291): it is the part the bass performer plays (\`&bassline\`, decision 058), and the workbench's card sends it.

At the one point where the pump's share of \`bass.ts\`'s blend is greatest, 0.74: a static vamp, staccato, no sync (each a factor of the pump: \`(1 − harm) × artic × (1 − sync)\`), and no energy, which would bring in the eighths.
That is Techno's harmony and articulation, its sync and energy at 0.
It is also at Techno's, the preset where the pump is what \`bass.ts\` plays most (0.50), as the meters are at theirs (#209).

What \`bass.ts\` adds that a fixed line doesn't: the fifth one step in five and an octave up one in four, by a draw per section and step; the thinning by the energy (here 0.55: each offbeat sounds about one section in two); the octave, the voice leading and the velocity, the performer's.

**Its signature** (decision 065): \`&bassline from &harm\`. \`&bassline from pumping_bass &harm\` takes a copy of it, \`&harm\` its main argument.
`,"bass/03-eighths-bass":"---\nid: eighths_bass\nassociation:\n  - point:\n      sync: 0\n      harm: 0.3\n      artic: 0\n      energy: 1\n    weight: 1\n    facet: bass\nsource: seed\nlifted: yggi/jambot packages/engine/src/bass.ts @ 1037a80\n---\n\n```cells\n&bassline from &harm\n&bassline over=&harm step=8n 0!8\n```\n\nJambot's bass pattern `eight`: the root of the chord in force on every eighth (`bass.ts` weighs the downbeat 1, the bar's half 0.9, the others 0.8).\nIts own lines read the host's `&harm` and tap the host's main meter; it has no card (#291): it is the part the bass performer plays (`&bassline`, decision 058), and the workbench's card sends it.\n\nAt a point where the eighths' share of `bass.ts`'s blend is greatest, 0.63: full energy and no sync (the eighths weigh `0.6 × energy × (1 − funk)`, the funk line weighs the sync), and no pump (legato, or a harmony that moves fully).\nThe eighths are what `bass.ts` plays most at no preset, so unlike the others they sit at no preset's point (#209).\nTechno, the preset where their share is greatest (0.24), is as near two of those points (Techno legato, and Techno with its harmony moving), so it sits at the root bass's point with the energy at 1: there `bass.ts` moves from the root alone to the eighths by the energy alone.\n\nWhat `bass.ts` adds that a fixed line doesn't: the fifth one step in five and an octave up one in four, off the downbeat; the thinning by the energy (here 1.15: each eighth sounds but about one in twelve); the octave, the voice leading and the velocity, the performer's.\n\n**Its signature** (decision 065): `&bassline from &harm`. `&bassline from eighths_bass &harm` takes a copy of it, `&harm` its main argument.\n","bass/04-funk-bass":`---
id: funk_bass
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
&bassline from &harm
&bassline over=&harm step=16n 0 ~ ~ 0 ~ ~ 0 0 ~ ~ 0 0 ~ &bassNext &bassNext ~
&bassNext over=&harm[>>] 0
\`\`\`

Jambot's bass pattern \`funk\`, its line on 4/4's sixteen steps, every step it weighs (\`bass.ts\`'s \`FUNK\`: 1, 0.7, 0.8, 0.4, 0.7, 0.5, 0.3, 0.8): the root of the chord in force, and on the bar's last two sixteenths the next chord's root, anticipated (\`&bassNext\`, over \`&harm[>>]\`).
Its own lines read the host's \`&harm\` and tap the host's main meter; it has no card (#291): it is the part the bass performer plays (\`&bassline\`, decision 058), and the workbench's card sends it.

At Funk's point: there the funk line's share of \`bass.ts\`'s blend is the greatest it gets, 0.74 (full sync weighs it 1 and the pump and the eighths 0), and Funk is the preset where its share is greatest.
It is also at the two other presets where the funk line is what \`bass.ts\` plays most, as the meters are at theirs (#209): Lo-fi hip hop's (0.48) and Bossa nova's (0.63).
At full sync \`bass.ts\` anticipates the next chord nine times in ten on a step of the bar's last three that isn't a change (\`0.9 × sync\`), so this line plays the anticipation.

What \`bass.ts\` adds that a fixed line doesn't: the tenth time, the root or the fifth there; the fifth one step in five and an octave up one in four elsewhere off the downbeat; the thinning by each step's weight and the energy (here 1: the 0.3 and the 0.4 sound about one section in three); the octave, the voice leading and the velocity, the performer's.

**Its signature** (decision 065): \`&bassline from &harm\`. \`&bassline from funk_bass &harm\` takes a copy of it, \`&harm\` its main argument.
`,"bass/05-walking-bass":"---\nid: walking_bass\nassociation:\n  - point:\n      sync: 0.35\n      harm: 1\n      artic: 0.3\n      energy: 0.6\n    weight: 1\n    facet: bass\n  - point:\n      sync: 0.55\n      harm: 0.75\n      artic: 0.6\n      energy: 0.75\n    weight: 1\n    facet: bass\nsource: seed\nlifted: yggi/jambot packages/engine/src/bass.ts @ 1037a80\n---\n\n```cells\n&bassline from &harm\n&bassline over=&harm step=4n 0 1 2 &bassNext^$-1\n&bassNext over=&harm[>>] 0\n```\n\nJambot's bass pattern `walk`, a note on every beat: the root of the chord in force on one, its third and its fifth, and on the last beat the next chord's root a semitone below (`&bassNext^$-1`: the next chord's root, `over=&harm[>>]`, moved a step of the grid, a semitone).\nThe semitone can't be an index: over the chord in force an accidental moves a degree of the key, so `0b` over `&harm[>>]` is a semitone only where the key's degree below the next root is one.\nIts own lines read the host's `&harm` and tap the host's main meter; it has no card (#291): it is the part the bass performer plays (`&bassline`, decision 058), and the workbench's card sends it.\n\nAt Swing jazz's point, under its meter swung on `8n` (`meter(swing=8n:2/3)`): `bass.ts` walks only where the meter swings its eighths (`eighthSwing`) and the harmony moves (`harm ≥ 2/3`), and there the walk's share of its blend is the greatest it gets, 0.74, the funk line, the pump and the eighths all 0.\nThe swing is the meter's, not a style axis, so the point says only the harmony.\nSwing jazz is the only preset where the walk is what `bass.ts` plays most, and this point is Swing jazz's (#209); at the presets whose harmony moves but whose meter doesn't swing, the pattern played most is associated there and is found before the walk.\n\nWhat `bass.ts` draws that a fixed line chooses: the second and third beats each the third, the fifth or the seventh (the fifth twice over where the chord has none), a third each, so this line is one walk it plays, up through the chord; the approach from below or above, half each, so this one from below. Under a harmony that changes on the bar's half it leads into that change too. The octave, the voice leading and the velocity are the performer's.\nAlso at the point proposed for an Electro swing preset (#349), weight 1: the walk [Electro swing, in pieces](../../examples/electroswing.md) plays. It is placed by hand, not by `bass.ts`'s blend, which has no such preset.\n\n**Its signature** (decision 065): `&bassline from &harm`. `&bassline from walking_bass &harm` takes a copy of it, `&harm` its main argument.\n","bass/06-creeping-bass":`---
id: creeping_bass
association:
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.35
    weight: 1
    facet: bass
source: seed
---

\`\`\`cells
&bassline from &harm
&bassline over=&harm step=4n 0@2 &creep^$1 0
&creep over=&harm 0
\`\`\`

A bass that creeps: the root of the chord in force held two beats, then a semitone above it, and back (\`&creep^$1\`: the root moved a step of the grid, a semitone, as the walking bass's approach moves \`&bassNext\`), the shark's two notes slowed to a walk on tiptoe.
Its line reads the host's \`&harm\` and taps the host's main meter; it has no card (#291): it is the part the bass performer plays (\`&bassline\`, decision 058). It is four beats long, so in 5/4 it turns against the bar, the semitone landing a beat later each time round.
Written by hand for the point proposed for a Spooky preset (sync .2, harm .9, artic .3, energy .35; #349), weight 1, Jambot's to adopt (decision 041).

**Its signature** (decision 065): \`&bassline from &harm\`. \`&bassline from creeping_bass &harm\` takes a copy of it, \`&harm\` its main argument.
`,"bass/07-tiptoe-bass":`---
id: tiptoe_bass
association:
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.25
      energy: 0.3
    weight: 1
    facet: bass
source: seed
---

\`\`\`cells
&bassline from &harm
&bassline over=&harm step=4n 0 ~ -1 ~
\`\`\`

A bass on tiptoe: the root of the chord in force, a beat's silence, the fifth below it, and silence again, plucked short, as a cartoon villain sneaks down a corridor.
Its line reads the host's \`&harm\` and taps the host's main meter; it has no card (#291): it is the part the bass performer plays (\`&bassline\`, decision 058). It is four beats long, so in 5/4 it turns against the bar, the root landing on a different beat each time round, as \`creeping_bass\` does.
Near Spooky's point (sync .2, harm .9, artic .3, energy .35; yggi/jambot#517), 0.05 lower in artic and energy, weight 1, as the facet \`bass\`: what the bass plays when \`creeping_bass\` has tired.

**Its signature** (decision 065): \`&bassline from &harm\`. \`&bassline from tiptoe_bass &harm\` takes a copy of it, \`&harm\` its main argument.
`,"expression/01-vibrato":`---
id: vibrato
association:
  - point:
      sync: 0.5
      harm: 0.5
      artic: 0.5
      energy: 0.5
    weight: 0.25
    facet: expression
source: seed
---

\`\`\`cells
&vibrato map=lin loop=5 0 .1 0 -.1 0
\`\`\`

A singer's or a string player's vibrato (#196): the pitch rising a tenth of a semitone above the note and falling as far below, five times a second, a voice's \`pitch=\` (\`&lead s=saw loop=C4 pitch=&vibrato\`).
It is the vibrato the examples wrote out most, \`pitch=&(map=lin loop=5 0 .1 0 -.1 0)\` in bossa, BWV 847 and pop and near it in six more (five to six a second, eight to fifteen hundredths of a semitone), which take it from here.
A drift that takes seconds to come round, a flutter, or a vibrato wider or slower on purpose is a piece's own: it writes its own cell, as spooky, baustelle and electroswing do.

It defines a cell and uses nothing, so it fits any workbench. Associated once, as the facet \`expression\`, at the centre of style space, at a quarter weight: what a voice does to its notes is no style's, and a query for an expression finds it there.
`,"expression/02-envelopes":"---\nid: envelopes\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: expression\nsource: seed\n---\n\n```cells\n&click map=adsr 0 .03 0 .02\n&tap map=adsr 0 .08 0 .04\n&snap map=adsr 0 .12 0 .05\n&thump map=adsr 0 .3 0 .05\n&strike map=adsr .005 .15 .5 .05\n&pluck map=adsr .005 .25 .5 .1\n&swell map=adsr .02 .3 .5 .3\n```\n\nThe shapes a note's level takes, by name (#196): a voice's `env=` (`&hh s=white hpf=8000 env=&click`), each attack, decay, sustain and release in seconds and a level, as `map=adsr` reads them.\nThey are the seven the examples wrote out most, each from its most common spelling:\n- **Struck, nothing held:** `&click` (a hat, a rim, a tick, 30 ms), `&tap` (80 ms), `&snap` (a snare, 120 ms), `&thump` (a kick, 300 ms).\n- **Held:** `&strike` (a stab, struck and held at half), `&pluck` (a plucked string, a quarter second to half), `&swell` (a pad: a soft attack, a long release).\n\nAn envelope near one of them, each value within a fifth of it, became it in the examples (the owner, #196: \"collapse … minimal differences … as long as the 'spirit and style of the piece' is preserved\"); one that is a piece's own, slower, longer or shaped otherwise, stays as the piece writes it.\nThe names are no performer's (`&stab`, `&pad`, `&lead`, `&keys` are role cells, decision 061), so a piece that plays those parts takes these too.\n\nIt defines cells and uses nothing, so it fits any workbench. Associated once, as the facet `expression`, as `vibrato` is: at the centre of style space, at a quarter weight.\n","forms/01-call-and-answer":"---\nid: call_and_answer\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: form\nsource: seed\n---\n\n```cells\n&phrase from (&answer) &call\n&phrase step=8n &call &answer\n&answer step=8n &call^-2\n```\n\nThe call and its answer: the call, then the call two degrees down, as blues and West African music answer a call, and as Jambot's lead lifts a line (an operator on the call, decision 052). Its hole is `&call`; `&answer` is its helper, an operator on the call by default, which a piece overrides by naming it (`use &phrase, &answer from call_and_answer`, decision 059).\nWith a one-bar call it is 2 bars, with a two-bar call 4.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &phrase`), or a piece splices it where it likes.\nAt the centre of style space, as the facet `form`, weight 1: a form fits any style, and a query for one finds them in this order.\n\n**Its signature** (decision 065): `&phrase from (&answer) &call`. `&phrase from call_and_answer &motif` takes a copy of it, `&call` its main argument; `&answer` an optional parameter, its line its default (`\"call_and_answer\"(answer=…)`).\n","forms/02-sentence":"---\nid: sentence\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: form\nsource: seed\n---\n\n```cells\n&sentence from (&continuation) &call\n&sentence step=8n &call &call^1 &continuation\n&continuation step=8n inverse(&call) &call[::-1]\n```\n\nCaplin's sentence: a presentation, the idea and the idea moved a degree up, then a continuation as long, here the idea mirrored (`inverse(&call)`) and the idea backwards (`&call[::-1]`), the material broken up as a continuation does. Its hole is `&call`; `&continuation` is its helper, a piece's to override by naming it.\nWith a one-bar call it is 4 bars, with a two-bar call 8.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &sentence`), or a piece splices it where it likes.\nAt the centre of style space, as the facet `form`, weight 1: a form fits any style, and a query for one finds them in this order.\n\n**Its signature** (decision 065): `&sentence from (&continuation) &call`. `&sentence from sentence &motif` takes a copy of it, `&call` its main argument; `&continuation` an optional parameter, its line its default (`sentence(continuation=…)`).\n","forms/03-period":"---\nid: period\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: form\nsource: seed\n---\n\n```cells\n&period from (&antecedent, &consequent) &call\n&period step=8n &antecedent &consequent\n&antecedent step=8n &call &call^1\n&consequent step=8n &call &call^-1\n```\n\nA period: an antecedent and a consequent, the same start, a different end. The antecedent ends a degree above the call (open), the consequent a degree below (closed). Its hole is `&call`; `&antecedent` and `&consequent` are its helpers, a piece's to override by naming them.\nWith a one-bar call it is 4 bars, with a two-bar call 8.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &period`), or a piece splices it where it likes.\nAt the centre of style space, as the facet `form`, weight 1: a form fits any style, and a query for one finds them in this order.\n\n**Its signature** (decision 065): `&period from (&antecedent, &consequent) &call`. `&period from period &motif` takes a copy of it, `&call` its main argument; `&antecedent`, `&consequent` optional parameters, their lines their defaults (`period(antecedent=…)`).\n","forms/04-aaba":"---\nid: AABA\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: form\nsource: seed\n---\n\n```cells\n&chorus from (&b) &a\n&chorus step=8n &a &a &b &a\n&b step=8n &a^3\n```\n\nThe thirty-two-bar song form, AABA, in its letters: an A three times, the bridge before the last. Its holes are `&a`, not `&call`, because an A is often a phrase itself (`&a step=8n &phrase`, the call and answer), and the bridge `&b` is its helper, A moved a fourth up by default, a piece's to override by naming it (`use &chorus, &b from AABA`).\nWith a one-bar A it is 4 bars, with a two-bar A 8.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &chorus`), or a piece splices it where it likes.\nAt the centre of style space, as the facet `form`, weight 1: a form fits any style, and a query for one finds them in this order.\n\n**Its signature** (decision 065): `&chorus from (&b) &a`. `&chorus from AABA &motif` takes a copy of it, `&a` its main argument; `&b` an optional parameter, its line its default (`AABA(b=…)`).\n","forms/05-ternary":"---\nid: ternary\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.12\n      artic: 0.5\n      energy: 0.35\n    weight: 0.5\n    facet: form\nsource: seed\n---\n\n```cells\n&song from (&answer, &bridge) &call\n&song step=8n &call &answer &bridge &bridge &call &answer\n&answer step=8n &call^-2\n&bridge step=8n &answer^1\n```\n\nThe ternary song, A B A, as Twinkle has it: the call and its answer, the bridge twice, then the call and its answer again. Its hole is `&call`; `&answer` is its helper, the call two degrees down by default, and `&bridge` the answer a step up, as Twinkle's middle line is its second a step up. A piece names them to override them: `&song from ternary(answer=&wonder) &twinkle` is Twinkle whole, its bridge *up above the world so high*.\nWith a one-bar call it is 6 bars, with a two-bar call 12.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &song`), or a piece splices it where it likes.\nAt the tune's own point, not the centre of style space (#371): a children's song's form, as the facet `form`, at weight 0.5, so its distance counts double and it is found first only near the tune, not at a preset's point the centre's forms are nearer to (Techno, Ambient).\n\n**Its signature** (decision 065): `&song from (&answer, &bridge) &call`. `&song from ternary &motif` takes a copy of it, `&call` its main argument; &answer, &bridge optional parameters, their lines their defaults.\n","forms/06-rounded-binary":"---\nid: rounded_binary\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.12\n      artic: 0.6\n      energy: 0.45\n    weight: 0.5\n    facet: form\nsource: seed\n---\n\n```cells\n&song from (&answer, &close, &bridge) &call\n&song step=8n &call &answer &call &close &bridge &bridge^1 &call &close\n&answer step=8n &call^1\n&close step=8n &call^-2\n&bridge step=8n &call^-3\n```\n\nThe rounded binary song, A A′ B A′, as Hänschen klein has it: the call and its open answer, the call and its closing answer, a bridge and the bridge a step up, then the call and its close again. Its hole is `&call`; `&answer` (the call a step up), `&close` (two degrees down) and `&bridge` (three down) are its helpers. A piece names them to override them: `&song from rounded_binary(answer=&hinein, close=&heim, bridge=&weinet) &haenschen` is Hänschen klein whole.\nWith a one-bar call it is 8 bars, with a two-bar call 16.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &song`), or a piece splices it where it likes.\nAt the tune's own point, not the centre of style space (#371): a children's song's form, as the facet `form`, at weight 0.5, so its distance counts double and it is found first only near the tune, not at a preset's point the centre's forms are nearer to (Techno, Ambient).\n\n**Its signature** (decision 065): `&song from (&answer, &close, &bridge) &call`. `&song from rounded_binary &motif` takes a copy of it, `&call` its main argument; &answer, &close, &bridge optional parameters, their lines their defaults.\n","harmony/01-tonic-vamp":"---\nid: tonic_vamp\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.75\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4]!8\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for all eight bars: the vamp `[0]`, a stack of degrees `&key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `&key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `aeolian`, `dorian`.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: aeolian at Techno's point; dorian at Funk's point. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from tonic_vamp &key` takes a copy of it, `&key` its main argument.\n","harmony/02-vamp-to-the-seventh":"---\nid: vamp_to_the_seventh\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.75\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4]!4 [6,8,10]!4\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its seventh (degree 6) for four: the vamp `[0, 6]`, a stack of degrees `&key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `&key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `aeolian`, `dorian`, `mixolydian`. No preset of Jambot's is mixolydian, so mixolydian gives it no point of its own.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: aeolian at Techno's point; dorian at Funk's point. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from vamp_to_the_seventh &key` takes a copy of it, `&key` its main argument.\n","harmony/03-vamp-to-the-fourth":"---\nid: vamp_to_the_fourth\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.75\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 0.05\n      harm: 0.12\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4]!4 [3,5,7]!4\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its fourth (degree 3) for four: the vamp `[0, 3]`, a stack of degrees `&key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `&key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `aeolian`, `dorian`, `ionian`, `mixolydian`. No preset of Jambot's is mixolydian, so mixolydian gives it no point of its own.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: aeolian at Techno's point; dorian at Funk's point; ionian at Ambient's point with its harmony at 0.12. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from vamp_to_the_fourth &key` takes a copy of it, `&key` its main argument.\n","harmony/04-vamp-to-the-sixth":"---\nid: vamp_to_the_sixth\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 0.05\n      harm: 0.12\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4]!4 [5,7,9]!4\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its sixth (degree 5) for four: the vamp `[0, 5]`, a stack of degrees `&key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `&key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `aeolian`, `ionian`.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: aeolian at Techno's point; ionian at Ambient's point with its harmony at 0.12. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from vamp_to_the_sixth &key` takes a copy of it, `&key` its main argument.\n","harmony/05-vamp-to-the-fifth":"---\nid: vamp_to_the_fifth\nassociation:\n  - point:\n      sync: 0.05\n      harm: 0.12\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 0.1\n      harm: 0.12\n      artic: 0.5\n      energy: 0.35\n    weight: 0.5\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4]!4 [4,6,8]!4\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its fifth (degree 4) for four: the vamp `[0, 4]`, a stack of degrees `&key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `&key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `ionian`.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: ionian at Ambient's point with its harmony at 0.12. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\nAt `KINDERLIED` too (`styles`): the tonic and the dominant of a children's song, under Twinkle's and Hänschen klein's motifs, with ionian there (yggi/jambot#547, the owner, 2026-11-04). There at weight 0.5, so its distance counts double: at weight 1 Deep house's point would find it first within 0.3, which the fence of #404 (`library.test.ts`) forbids.\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from vamp_to_the_fifth &key` takes a copy of it, `&key` its main argument.\n","harmony/06-dark-cadence":`---
id: dark_cadence
association:
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.35
    weight: 0.4
    facet: harmony
source: seed
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=4 [0,2,4] [5,7,9] [3,5,7] [4,6,8]
\`\`\`

Four bars over the host's key, a chord a bar: the tonic, the sixth, the fourth, the fifth (i, ♭VI, iv, V in a minor key), then round again, the fifth pulling back to the tonic.
In harmonic minor, the key the point finds, the fifth is major (A C♯ E over D), a dominant, and the sixth (B♭ D F) sits a semitone above the fifth's root, so the bass falls B♭, G, A and the chords lean in by semitones.
It defines \`&harm\` and uses the host's \`&key\` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.
Its lap is four bars, not the vamps' eight: Jambot's composer reads only progressions of eight (yggi/jambot \`packages/engine/src/harmony-query.ts\`), so it doesn't take this one yet, and where no harmony is near one of its presets (Synth-pop, Deep house, Lo-fi hip hop, Bossa nova, Swing jazz) it generates its harmony as before: this is the nearest there, but beyond the miss distance.
Written by hand for the point proposed for a Spooky preset (sync .2, harm .9, artic .3, energy .35; #349), Jambot's to adopt (decision 041), at weight 0.4: at weight 1 it was the nearest harmony to five other presets, all within Jambot's miss distance (0.3), so a composer that read four-bar laps would play it there (#404); at 0.4 every other preset is beyond it.

**Its signature** (decision 065): \`&harm from &key\`. \`&harm from dark_cadence &key\` takes a copy of it, \`&key\` its main argument.
`,"harmony/07-haunted-progression":"---\nid: haunted_progression\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.3\n    weight: 0.4\n    facet: harmony\nsource: seed\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4] [2,4,6] [3,5,7] [4,6,8] [5,7,9] [1,3,5] [4,6,8] [0,2,4]\n```\n\nEight bars over the host's key, a chord a bar: the tonic, the third, the fourth, the fifth, the sixth, the second, the fifth again and home (i, III+, iv, V, ♭VI, ii°, V, i in a minor key).\nIn harmonic minor, the key Spooky's point finds, the third is an augmented triad (F A C♯ over D), the ghost-house chord that leans nowhere, and the second a diminished one (E G B♭), so the progression passes through both of the key's unstable triads before the dominant brings it home.\nIt is eight bars long, a section's, so Jambot's composer reads it as a progression (`packages/engine/src/harmony-query.ts`), unlike the four bars of `dark_cadence`; its chords are all the key's own triads, the only kind a progression's slot holds there.\nIt defines `&harm` and uses the host's `&key` and main meter; it has no card, and plays only through what reads it.\nNear Spooky's point (sync .2, harm .9, artic .3, energy .35; yggi/jambot#517), 0.05 lower in energy, as the facet `harmony`, at weight 0.4, as `dark_cadence` is, so it is found within Jambot's miss distance (0.3) of Spooky alone, and behind `dark_cadence` wherever both are farther: at weight 1 it was the nearest harmony to Synth-pop, Lo-fi hip hop, Bossa nova and Swing jazz (0.18 to 0.3), which find none of their own there and would have played it (#404).\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from haunted_progression &key` takes a copy of it, `&key` its main argument.\n","instruments/01-gm-kit":`---
id: gm_kit
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
&acousticbassdrum note=35 s=sine loop=G1 pitch=0..24 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .4 0 .05)
&bd note=36 s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0) env=&(map=adsr 0 .3 0 .05)
&rim note=37 s=sine loop=E5 env=&(map=adsr 0 .03 0 .02)
&sd note=38 s=white hpf=1500 env=&(map=adsr 0 .12 0 .05)
&cp note=39 s=white hpf=1000 env=&(map=adsr 0 .08 0 .05)
&electricsnare note=40 s=white hpf=2500 env=&(map=adsr 0 .09 0 .04)
&lt note=41 s=sine loop=G2 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .25 0 .05)
&hh note=42 s=white hpf=8000 env=&(map=adsr 0 .04 0 .02)
&highfloortom note=43 s=sine loop=A2 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .23 0 .05)
&ph note=44 s=white hpf=9000 env=&(map=adsr 0 .03 0 .01)
&mt note=45 s=sine loop=C3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .2 0 .05)
&oh note=46 s=white hpf=7000 env=&(map=adsr 0 .25 0 .1)
&lowmidtom note=47 s=sine loop=D3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .18 0 .05)
&ht note=48 s=sine loop=F3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .15 0 .05)
&cr note=49 s=white hpf=5000 env=&(map=adsr 0 .8 0 .3)
&hightom note=50 s=sine loop=A3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .13 0 .05)
&rd note=51 s=white hpf=9000 env=&(map=adsr 0 .4 0 .2)
&chinesecymbal note=52 s=white hpf=3000 distort=.3 env=&(map=adsr 0 .6 0 .2)
&ridebell note=53 s=tri loop=E6 env=&(map=adsr 0 .5 0 .2)
&tb note=54 s=white hpf=6000 env=&(map=adsr 0 .15 0 .05)
&splashcymbal note=55 s=white hpf=6000 env=&(map=adsr 0 .35 0 .1)
&cb note=56 s=square loop=G5 lpf=2500 env=&(map=adsr 0 .1 0 .03)
&crashcymbaltwo note=57 s=white hpf=4000 env=&(map=adsr 0 .9 0 .3)
&vibraslap note=58 s=white hpf=2000 crush=6 env=&(map=adsr 0 .6 0 .2)
&ridecymbaltwo note=59 s=white hpf=8000 env=&(map=adsr 0 .5 0 .2)
&hibongo note=60 s=sine loop=E4 pitch=0..7 * &(map=adsr 0 .02 0 0) env=&(map=adsr 0 .1 0 .03)
&lowbongo note=61 s=sine loop=A3 pitch=0..7 * &(map=adsr 0 .02 0 0) env=&(map=adsr 0 .12 0 .03)
&mutehiconga note=62 s=sine loop=C4 env=&(map=adsr 0 .05 0 .02)
&openhiconga note=63 s=sine loop=C4 pitch=0..5 * &(map=adsr 0 .03 0 0) env=&(map=adsr 0 .2 0 .05)
&lowconga note=64 s=sine loop=G3 pitch=0..5 * &(map=adsr 0 .03 0 0) env=&(map=adsr 0 .25 0 .05)
&hightimbale note=65 s=tri loop=D5 env=&(map=adsr 0 .15 0 .05)
&lowtimbale note=66 s=tri loop=A4 env=&(map=adsr 0 .18 0 .05)
&highagogo note=67 s=tri loop=A5 env=&(map=adsr 0 .2 0 .05)
&lowagogo note=68 s=tri loop=E5 env=&(map=adsr 0 .2 0 .05)
&cabasa note=69 s=white hpf=5000 env=&(map=adsr 0 .06 0 .03)
&sh note=70 s=white hpf=4000 env=&(map=adsr 0 .04 0 .03)
&shortwhistle note=71 s=sine loop=B6 env=&(map=adsr .01 .08 0 .03)
&longwhistle note=72 s=sine loop=B6 env=&(map=adsr .01 .1 .8 .1)
&shortguiro note=73 s=white hpf=2500 lpf=5000 crush=4 env=&(map=adsr 0 .08 0 .02)
&longguiro note=74 s=white hpf=2500 lpf=5000 crush=4 env=&(map=adsr 0 .3 0 .05)
&claves note=75 s=sine loop=D7 env=&(map=adsr 0 .06 0 .03)
&hiwoodblock note=76 s=sine loop=G5 env=&(map=adsr 0 .04 0 .02)
&lowwoodblock note=77 s=sine loop=C5 env=&(map=adsr 0 .05 0 .02)
&mutecuica note=78 s=sine loop=A4 pitch=0..7 * &(map=adsr 0 .08 0 0) env=&(map=adsr 0 .1 0 .03)
&opencuica note=79 s=sine loop=A4 pitch=0..12 * &(map=adsr .05 .2 0 0) env=&(map=adsr 0 .3 0 .05)
&mutetriangle note=80 s=sine loop=A6 env=&(map=adsr 0 .08 0 .03)
&opentriangle note=81 s=sine loop=A6 env=&(map=adsr 0 1.2 0 .4)
\`\`\`

General MIDI's drum kit (decision 054, #225): a voice for each of its 47 percussion notes, 35 to 81, in General MIDI's order, each under its kit name (\`GM_KIT\` in \`src/engine/midi.ts\`), and each writing its note, \`note=36\` (decision 075: a name gives none), so MIDI out sends each on its own note, and a member taken under another name (\`&kick=bd from gm_kit\`, once #560's rung 3 lands) sends it still.
The names are Strudel's short names where Strudel has one (\`&bd\`, \`&sd\`, \`&hh\`, \`&oh\`, \`&cp\`, \`&rim\`, \`&lt\`, \`&mt\`, \`&ht\`, \`&cr\`, \`&rd\`, \`&cb\`, \`&tb\`, \`&sh\`), else General MIDI's, spelled as one word (\`&lowmidtom\`, \`&crashcymbaltwo\`); General MIDI's names for the first are aliases (\`kick\`, \`cowbell\`), which name the same note.

It defines voices and uses nothing, so it fills the holes a groove leaves (\`&bd &sd &hh\`), fits any workbench, and sounds only what a piece plays through it. Each sound is a first pass in cells' own parameters: a sine dropping in pitch for the drums and toms, filtered noise for the snares, hats and cymbals, a tuned sine or triangle for the hand percussion.
A piece takes the voices it needs by name, so a groove need not bring in 47: \`use &bd, &sd, &hh from gm_kit\`. The drummer takes 13 so (\`drums_performer\`); a kit of its own, the core kit, did that before \`use\` could name what it takes, and is retired (#196).

A kit is style-neutral: it is associated once, as the facet \`instrument\`, at the centre of style space (every axis at 0.5), the point nearest the farthest preset, at weight 1, so a query for an instrument finds it first.
`,"instruments/03-bass":"---\nid: bass\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: instrument\nsource: seed\n---\n\n```cells\n&bassV s=saw loop=C2 lpf=450..900 * &style[artic] lpq=4 env=&(map=adsr .005 .2 .7 .05)\n```\n\nThe voice the bass lines play through (decision 054, rung 7's first; #244): `&bassV`, whose `loop=C2` sets the register, so the lines' MIDI notes on Jambot's bass channel are the notes they were when each line carried its own `&bassV loop=C2`.\nIts sound is Jambot's bass (`timbreOf`, yggi/jambot `packages/engine/src/sound.ts` @ 227aa74, and the synth that plays it, `apps/web/src/audio/voices.ts`): a saw through a resonant low-pass (`lpq=4`) that opens with the section's articulation, from 450 Hz at legato to 900 Hz at staccato (`lpf=450..900 * &style[artic]`), struck with a short attack and held (#391).\nIt reads the section's style, `&style`, the composer's: the score writes it, and the instrument defines none (decision 063 §3). Where no line writes it, as when the bass is heard alone, it reads the centre of style space, 675 Hz, and an info says so.\nIt sounds within the renderer's first stage (decision 062, R1): a wave, a filter and an envelope. A sound changes no note it sends: MIDI out sends the notes it sent with no sound, and a MIDI card alone says the sound isn't sent (decision 064).\nIt defines the one voice the five bass lines read and uses nothing, so it fills their hole on any workbench; the lines no longer carry a voice of their own.\n\nAssociated as the kit is, once as the facet `instrument` at the centre of style space, at a quarter of its weight, so a query for an instrument finds the kit first; the composer asks for the bass by its id.\n","instruments/04-keys":"---\nid: keys\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: instrument\nsource: seed\n---\n\n```cells\n&keysV s=tri loop=C3 env=&(map=adsr attack=.3..0.01 * &style[artic] decay=0 sustain=1 release=.7..0.12 * &style[artic])\n```\n\nThe voice Jambot's comp plays its stabs through, and any keyboard part: `&keysV`, whose `loop=C3` sets the register, where Jambot's section text sounds its comp (`PIN_VOICES.comp`, yggi/jambot `packages/score/src/section-text.ts` @ 24a528b), so a stab played on it sends the MIDI notes it sends today, with no move on its gate.\nIts sound is Jambot's chords (`timbreOf`, yggi/jambot `packages/engine/src/sound.ts` @ 227aa74): a triangle whose attack shortens from .3 s at legato to .01 s at staccato and its release from .7 s to .12 s, its envelope's slots read from the section's style at each note's start (`attack=.3..0.01 * &style[artic]`, decision 066; #391, #411). Where no line writes the style, the centre's: .155 s and .41 s.\nIt sounds within the renderer's first stage (decision 062, R1), and changes no note MIDI out sends.\nIts register is its own (decision 058): a performer that plays it higher or lower says so on its gate (`play=&part^$12`).\n\nAssociated as `bass` is, once as the facet `instrument` at the centre of style space, at a quarter of the kit's weight; a performer asks for it by its id.\n","instruments/05-pad":"---\nid: pad\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: instrument\nsource: seed\n---\n\n```cells\n&padV s=tri loop=C3 env=&(map=adsr attack=.3..0.01 * &style[artic] decay=0 sustain=1 release=.7..0.12 * &style[artic])\n```\n\nThe voice Jambot's pad plays through: `&padV`, whose `loop=C3` sets the register, where Jambot's section text sounds its comp, pad and stab alike (`PIN_VOICES.comp`, yggi/jambot `packages/score/src/section-text.ts` @ 24a528b), so a pad played on it sends the MIDI notes it sends today, with no move on its gate. It is a voice of its own beside `keys`, though the two sit at one register, so a sound given to one (a pad's slow attack) isn't the other's.\nIts sound is the one Jambot gives its pad and its stab alike (`timbreOf`, yggi/jambot `packages/engine/src/sound.ts` @ 227aa74): a triangle that swells in over .3 s at legato and .01 s at staccato and dies over .7 s to .12 s, as `keys` does, its envelope's slots read from the section's style at each note's start (decision 066; #391, #411); the centre's .155 s and .41 s where no line writes the style. A band that wants its pad slower than its stabs gives it its own envelope.\nIt sounds within the renderer's first stage (decision 062, R1), and changes no note MIDI out sends.\nIts register is its own (decision 058): a performer that plays it higher or lower says so on its gate (`play=&part^$12`).\n\nAssociated as `bass` is, once as the facet `instrument` at the centre of style space, at a quarter of the kit's weight; a performer asks for it by its id.\n","instruments/06-lead":"---\nid: lead\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: instrument\nsource: seed\n---\n\n```cells\n&leadV s=tri..square * &style[artic] loop=C4 lpf=1400..3600 * &style[energy] env=&(map=adsr attack=.04..0.006 * &style[artic] decay=0 sustain=1 release=.08)\n```\n\nThe voice Jambot's lead plays through: `&leadV`, whose `loop=C4` sets the register, where Jambot's section text sounds its lead (`PIN_VOICES.lead`, E35's C4: yggi/jambot `packages/score/src/section-text.ts` @ 24a528b), so a lead played on it sends the MIDI notes it sends today, with no move on its gate.\nIts sound is Jambot's lead (`timbreOf`, yggi/jambot `packages/engine/src/sound.ts` @ 227aa74): a soft triangle at legato blending to a bright square at staccato (`s=tri..square * &style[artic]`, decision 066), through a low-pass that opens with the section's energy, from 1400 Hz to 3600 Hz (`lpf=1400..3600 * &style[energy]`), its attack sharpening from 40 ms to 6 ms as articulation rises (#391, #411). Jambot weights its triangle 1.8 against the square; the blend holds each wave at its own peak.\nIt reads the section's style, `&style`, the composer's: the score writes it, and the instrument defines none (decision 063 §3); where no line writes it, it reads the centre of style space (a blend halfway, 2500 Hz, 23 ms), and an info says so in a piece with performers.\nIt sounds within the renderer's first stage (decision 062, R1), and changes no note MIDI out sends.\nIts register is its own (decision 058): a performer that plays it higher or lower says so on its gate (`play=&part^$12`).\n\nAssociated as `bass` is, once as the facet `instrument` at the centre of style space, at a quarter of the kit's weight; a performer asks for it by its id.\n","instruments/07-upright-bass":`---
id: upright_bass
association:
  - point:
      sync: 0.55
      harm: 0.75
      artic: 0.6
      energy: 0.75
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/electroswing.md @ 6d1bfa7
---

\`\`\`cells
&bassV s=saw loop=C2 lpf=700 env=&(map=adsr .005 .3 .25 .08)
\`\`\`

Electro swing's bass, plucked and dark: a saw closed down to 700 Hz with a short decay and a low sustain, so each note thumps and fades as a slapped string does.
It defines \`&bassV\`, the voice the bass performer plays (\`&bassV from bass\`), so it fills the same hole as the default \`bass\` and can stand in for it.
It is [Electro swing, in pieces](../../examples/electroswing.md)'s \`&bassV\` but for its register: \`loop=C2\`, the default instrument's, so a bass line played on it sends the MIDI notes it sends on \`bass\` (the example's \`loop=C3\` is the piece's own).
It sounds within the renderer's first stage (decision 062, R1): a wave, a low-pass filter and an envelope.

Associated at Electro swing's point (\`ELECTRO_SWING\`: sync .55, harm .75, artic .6, energy .75; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/08-brass-stab":`---
id: brass_stab
association:
  - point:
      sync: 0.55
      harm: 0.75
      artic: 0.6
      energy: 0.75
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/electroswing.md @ 6d1bfa7
---

\`\`\`cells
&keysV s=saw loop=C3 lpf=1800 env=&(map=adsr .01 .12 .25 .1)
\`\`\`

Electro swing's stabs, a short brassy chord: a saw opened to 1800 Hz, a fast attack and a quick fall to a low sustain, so the Charleston's chords bite and get out of the way.
It defines \`&keysV\`, the voice the stab performer plays (\`use &keysV from keys\`), so it fills the same hole as the default \`keys\`.
It is [Electro swing, in pieces](../../examples/electroswing.md)'s \`&keysV\` word for word, at the default's register (\`loop=C3\`), so a stab played on it sends the MIDI notes it sends on \`keys\`.
It sounds within the renderer's first stage (decision 062, R1).

Associated at Electro swing's point (\`ELECTRO_SWING\`: sync .55, harm .75, artic .6, energy .75; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/09-clarinet":`---
id: clarinet
association:
  - point:
      sync: 0.55
      harm: 0.75
      artic: 0.6
      energy: 0.75
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/electroswing.md @ 6d1bfa7
---

\`\`\`cells
&leadV s=square loop=C4 lpf=2400 env=&(map=adsr .02 .2 .7 .15) pitch=&(map=lin loop=5.5 0 .12 0 -.12 0)
\`\`\`

Electro swing's lead: a square wave, the odd harmonics a clarinet's bore gives, softened by a low-pass at 2400 Hz, with a breath of attack and a vibrato of an eighth of a semitone five and a half times a second.
It defines \`&leadV\`, the voice the lead performer plays (\`use &leadV from lead\`), so it fills the same hole as the default \`lead\`.
It is [Electro swing, in pieces](../../examples/electroswing.md)'s \`&leadV\` word for word, at the default's register (\`loop=C4\`), so a line played on it sends the MIDI notes it sends on \`lead\`.
It sounds within the renderer's first stage (decision 062, R1): a wave, a filter, an envelope and a pitch's shape.

Associated at Electro swing's point (\`ELECTRO_SWING\`: sync .55, harm .75, artic .6, energy .75; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/10-muted-trumpet":`---
id: muted_trumpet
association:
  - point:
      sync: 0.55
      harm: 0.75
      artic: 0.6
      energy: 0.75
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/electroswing.md @ 6d1bfa7
---

\`\`\`cells
&leadV s=saw loop=C4 lpf=1400 lpq=6 env=&(map=adsr .03 .1 .6 .12) pitch=&(map=lin loop=4.5 0 .08 0 -.08 0)
\`\`\`

Electro swing's second lead, the trumpet with a mute in it: a saw through a resonant low-pass (1400 Hz, \`lpq=6\`), the mute's nasal peak, with a slower, narrower vibrato than the clarinet's.
It defines \`&leadV\`, the voice the lead performer plays, so it is the other instrument a lead player at this point may take; at the point the two are equally near, and a query lists the clarinet first, by id. A piece with both, as the example, gives the second player a voice of its own.
It is [Electro swing, in pieces](../../examples/electroswing.md)'s \`&trumpetV\`, named for the hole it fills, at the default lead's register (\`loop=C4\`), so a line played on it sends the MIDI notes it sends on \`lead\`.
It sounds within the renderer's first stage (decision 062, R1).

Associated at Electro swing's point (\`ELECTRO_SWING\`: sync .55, harm .75, artic .6, energy .75; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/11-round-bass":`---
id: round_bass
association:
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.35
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/spooky.md @ 6d1bfa7
---

\`\`\`cells
&bassV s=tri loop=C2 lpf=500 env=&(map=adsr .01 .3 .6 .2)
\`\`\`

Spooky's bass, soft and round under the creep: a triangle closed down to 500 Hz, with a held sustain and a slow release, so the root and the semitone above it blur into each other.
It defines \`&bassV\`, the voice the bass performer plays (\`use &bassV from bass\`), so it fills the same hole as the default \`bass\`.
It is [Spooky, in pieces](../../examples/spooky.md)'s \`&bassV\` but for its register: \`loop=C2\`, the default instrument's, so a bass line played on it sends the MIDI notes it sends on \`bass\` (the example's \`loop=C3\` is the piece's own).
It sounds within the renderer's first stage (decision 062, R1).

Associated at Spooky's point (\`SPOOKY\`: sync .2, harm .9, artic .3, energy .35; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/12-organ":`---
id: organ
association:
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.35
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/spooky.md @ 6d1bfa7
---

\`\`\`cells
&padV s=square loop=C3 lpf=1100 env=&(map=adsr .25 .2 .8 .6)
\`\`\`

Spooky's pad, a church organ in an empty nave: a square, the reedy stop, filtered to 1100 Hz, swelling in over a quarter of a second and hanging on after the chord is let go.
It defines \`&padV\`, the voice the pad performer plays (\`use &padV from pad\`), so it fills the same hole as the default \`pad\`.
It is [Spooky, in pieces](../../examples/spooky.md)'s \`&padV\` word for word, at the default's register (\`loop=C3\`), so a chord played on it sends the MIDI notes it sends on \`pad\`.
It sounds within the renderer's first stage (decision 062, R1).

Associated at Spooky's point (\`SPOOKY\`: sync .2, harm .9, artic .3, energy .35; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/13-theremin":`---
id: theremin
association:
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.35
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/spooky.md @ 6d1bfa7
---

\`\`\`cells
&leadV s=sine loop=C4 env=&(map=adsr .15 .2 .9 .4) pitch=&(map=lin loop=5 0 .25 0 -.25 0)
\`\`\`

Spooky's lead, the theremin of a hundred horror films: a pure sine, fading in and out as a hand nears and leaves the antenna, with a wide vibrato of a quarter of a semitone five times a second.
It defines \`&leadV\`, the voice the lead performer plays (\`use &leadV from lead\`), so it fills the same hole as the default \`lead\`.
It is [Spooky, in pieces](../../examples/spooky.md)'s \`&leadV\` word for word, at the default's register (\`loop=C4\`), so a line played on it sends the MIDI notes it sends on \`lead\`.
It sounds within the renderer's first stage (decision 062, R1).

Associated at Spooky's point (\`SPOOKY\`: sync .2, harm .9, artic .3, energy .35; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/14-celesta":"---\nid: celesta\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.35\n    weight: 0.125\n    facet: instrument\nsource: seed\nlifted: yggi/cells examples/spooky.md @ 6d1bfa7\n---\n\n```cells\n&keysV s=sine loop=C3 env=&(map=adsr .002 .7 0 .5)\n```\n\nSpooky's bell, a celesta's struck tone: a sine that starts at once and dies away over most of a second with nothing held, the music box in the attic.\nIt defines `&keysV`, the voice the stab performer plays (`use &keysV from keys`), so it fills the same hole as the default `keys`.\nIt is [Spooky, in pieces](../../examples/spooky.md)'s `&keysV` but for its register: `loop=C3`, the default instrument's, so a stab played on it sends the MIDI notes it sends on `keys`. The example plays it at `loop=C5`, where a celesta sits; a player who wants it there says so on its gate (`play=&stabline^$24`, decision 058).\nIt sounds within the renderer's first stage (decision 062, R1).\n\nAssociated at Spooky's point (`SPOOKY`: sync .2, harm .9, artic .3, energy .35; yggi/jambot#517) as the facet `instrument`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).\n","instruments/15-haunted-pad":"---\nid: haunted_pad\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.3\n    weight: 0.125\n    facet: instrument\nsource: seed\n---\n\n```cells\n&padV s=tri loop=C3 env=&(map=adsr 1.5 .5 .8 2) pitch=&(map=lin loop=3 0 .1 0 -.1 0)\n```\n\nSpooky's pad: a soft triangle that swells in over a second and a half and fades over two, wavering a tenth of a semitone three times a second, so a held chord rises out of the silence and sinks back into it, the sound a ghost house opens with.\nIt defines `&padV`, the voice the pad performer plays, so it fills the same hole as the default `pad`, at the default's register (`loop=C3`), and sends the MIDI notes it sends.\nAssociated 0.05 below Spooky's point in energy (Spooky: sync .2, harm .9, artic .3, energy .35; yggi/jambot#517) as the facet `instrument`, at half the default instruments' weight (0.125), as `theremin` and `celesta` are: at Spooky's point itself it would tie with `organ`, which defines `&padV` there too, and take its place by id, so the organ plays at Spooky and this pad as the style grows quieter.\n","meters/meter":`---
id: meter
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
  - point:
      sync: 0.35
      harm: 1
      artic: 0.3
      energy: 0.6
    weight: 1
    facet: meter
    args:
      swing: 8n:2/3
  - point:
      sync: 0.55
      harm: 0.75
      artic: 0.6
      energy: 0.75
    weight: 1
    facet: meter
    args:
      swing: 8n:2/3
  - point:
      sync: 0.5
      harm: 0.75
      artic: 0.35
      energy: 0.5
    weight: 1
    facet: meter
    args:
      swing: 16n:.65
  - point:
      sync: 0.35
      harm: 0.55
      artic: 0.65
      energy: 0.65
    weight: 1
    facet: meter
    args:
      swing: 16n:.6
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: meter
    args:
      swing: 16n:.6
  - point:
      sync: 0.05
      harm: 0.3
      artic: 0
      energy: 0.2
    weight: 1
    facet: meter
    args:
      swing: 16n:31/60
  - point:
      sync: 0.2
      harm: 0.6
      artic: 0.9
      energy: 1
    weight: 1
    facet: meter
    args:
      grouping: meter("2/2", 2)
  - point:
      sync: 0
      harm: 0.1
      artic: 0.6
      energy: 1
    weight: 1
    facet: meter
    args:
      grouping: meter("2/4")
  - point:
      sync: 0
      harm: 0.7
      artic: 0.3
      energy: 0
    weight: 1
    facet: meter
    args:
      grouping: meter("3/4")
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.43
    weight: 1
    facet: meter
    args:
      grouping: meter("3/4")
  - point:
      sync: 0.3
      harm: 0.2
      artic: 0.2
      energy: 0
    weight: 1
    facet: meter
    args:
      grouping: meter("6/8")
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.27
    weight: 1
    facet: meter
    args:
      grouping: meter("6/8")
  - point:
      sync: 0.7
      harm: 0.6
      artic: 0
      energy: 0.2
    weight: 1
    facet: meter
    args:
      grouping: meter("12/8")
  - point:
      sync: 0.4
      harm: 0.9
      artic: 0.5
      energy: 0.3
    weight: 1
    facet: meter
    args:
      grouping: meter("5/4")
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.35
    weight: 1
    facet: meter
    args:
      grouping: meter("5/4")
  - point:
      sync: 0.8
      harm: 0.6
      artic: 1
      energy: 1
    weight: 1
    facet: meter
    args:
      grouping: meter("7/8")
  - point:
      sync: 0.6
      harm: 0.9
      artic: 0.8
      energy: 0.9
    weight: 1
    facet: meter
    args:
      grouping: meter("10/8")
source: seed
---

\`\`\`cells
&bar from (&grouping, &swing) &tempo
&bar base=&grouping step=&tempo swing=&swing
&grouping meter("4/4")
&swing swing=8n:1/2
\`\`\`

The one meter fragment (#507, decision 072): a bar \`&bar\` at the text's tempo, its grouping and its swing its arguments, each line its default: 4/4, straight.
Its points carry their arguments, one a style, so the style space's meters are this one list: \`meter\` itself at Synth-pop's, Techno's and Bossa nova's points; \`meter(swing=8n:2/3)\` at Swing jazz's and Electro swing's; the sixteenths leaning at Lo-fi's (\`16n:.65\`), at Deep house's and Funk's (\`16n:.6\`) and at Ambient's (\`16n:31/60\`); \`meter(grouping=meter("5/4"))\` at Spooky's, with 6/8 and 3/4 near it; 2/4, 7/8, 10/8, 12/8 and alla breve (\`meter("2/2", 2)\`) at points of their own.

**Its signature** (decision 065): \`&bar from (&grouping, &swing) &tempo\`. \`&bar from meter 120bpm\` takes 4/4; \`&bar from meter(grouping=meter("7/8"), swing=8n:2/3) &tempo\` a 7/8 swung on its pairs (its three straight, decision 071).
\`&grouping\` is a meter, read by \`base=\`: a copy of a meter is a meter (#507), so \`&bar\` is the grouping's meter at the tempo, swung as \`&swing\` says (a cell that is a swing alone, #308).
`,"modes/01-diatonic":`---
id: diatonic
association:
  - point:
      sync: 0.3
      harm: 0.45
      artic: 0.55
      energy: 0.55
    weight: 1
    facet: mode
    args:
      mode: aeolian
  - point:
      sync: 0.12
      harm: 0
      artic: 1
      energy: 0.8
    weight: 1
    facet: mode
    args:
      mode: aeolian
  - point:
      sync: 0.5
      harm: 0.75
      artic: 0.35
      energy: 0.5
    weight: 1
    facet: mode
    args:
      mode: aeolian
  - point:
      sync: 0.35
      harm: 0.55
      artic: 0.65
      energy: 0.65
    weight: 1
    facet: mode
    args:
      mode: dorian
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: mode
    args:
      mode: dorian
  - point:
      sync: 0.05
      harm: 0.3
      artic: 0
      energy: 0.2
    weight: 1
    facet: mode
    args:
      mode: ionian
  - point:
      sync: 0.75
      harm: 0.85
      artic: 0.45
      energy: 0.45
    weight: 1
    facet: mode
    args:
      mode: ionian
  - point:
      sync: 0.35
      harm: 1
      artic: 0.3
      energy: 0.6
    weight: 1
    facet: mode
    args:
      mode: ionian
  - point:
      sync: 0.1
      harm: 0.12
      artic: 0.5
      energy: 0.35
    weight: 1
    facet: mode
    args:
      mode: ionian
  - point:
      sync: 0.875
      harm: 0.485
      artic: 0.65
      energy: 0.6
    weight: 1
    facet: mode
    args:
      mode: mixolydian
  - point:
      sync: 0.6
      harm: 0.6
      artic: 0.7
      energy: 0.85
    weight: 1
    facet: mode
    args:
      mode: phrygian
  - point:
      sync: 0.15
      harm: 0.6
      artic: 0.15
      energy: 0.3
    weight: 1
    facet: mode
    args:
      mode: lydian
  - point:
      sync: 0.9
      harm: 1
      artic: 0.6
      energy: 0.9
    weight: 1
    facet: mode
    args:
      mode: locrian
source: seed
---

\`\`\`cells
&key from (&mode) &tonic
&key scale(&mode, &tonic)
&mode major
\`\`\`

The diatonic key, its mode a parameter: the one source of the seven modes (#363, the owner's ruling B; #387, B1). The mode is a number, darkest to brightest, decision 013's phase (locrian 0, phrygian 1, aeolian or minor 2, dorian 3, mixolydian 4, ionian or major 5, lydian 6), and a mode word reads as its number, as a note name does (\`C\` is 0). Major unless the use says otherwise.
Its scale is the diatonic necklace, \`even(7, 12, &mode)\`: the mode's number is even's phase, and \`scale(&mode, …)\` computes its steps so (decision 072); the library's names for the modes are generated by \`even\`, not typed (#507). Writing it as \`scale(even(7, 12, &mode), &tonic)\` is #531's.
It defines \`&key\`, the key (decision 060), and reads \`&tonic\`, its main argument, required: a default tonic plays a wrong key silently (#117). \`&mode\` is optional, its default \`major\`.

**Each point says which mode it is** (\`args: mode: …\`): the mode Jambot's composer plays at a preset's point (\`PRESETS\`' \`mode\`, yggi/jambot packages/engine/src/style.ts), weight 1, so a query for the mode at one of them finds that mode first, at distance 0. A query answers with \`diatonic(mode=aeolian)\`, the fragment with its argument, which is how a \`from\` line takes it: \`&key from diatonic(mode=aeolian) D\`. Aeolian, the natural minor, is the mode the band opens in (\`INITIAL_KEY\`, A aeolian). These were the seven mode fragments (\`aeolian\` … \`locrian\`), which read for one minor version as these (#387).

**Its signature** (decision 065): \`&key from (&mode) &tonic\`. \`&key from diatonic C\` is C major; \`&key from diatonic(mode=dorian) D\` is D dorian; with the piece's own cells, \`&key from diatonic(mode=&mode) &tonic\` binds both, so a host's slider on either keeps working. A stepped mode is not yet a form (\`&mode step=…\` is an error that says so).
`,"modes/05-bell-and-scale":"---\nid: bell_and_scale\nassociation:\n  - point:\n      sync: 0.383\n      harm: 0.717\n      artic: 0.25\n      energy: 0.417\n    weight: 1\n    facet: mode\n  - point:\n      sync: 0.8\n      harm: 0.1\n      artic: 0.9\n      energy: 0.6\n    weight: 1\n    facet: rhythm\nsource: seed\n---\n\n```cells\n&key, &bell, &agogo from &tonic\n&key scale(ionian, &tonic) step=1m*7\n&bell step=&key:pulse &highagogo &highagogo:0:.5 &highagogo:0:.7 &highagogo:0:.5 &highagogo:0:.6 &highagogo:0:.5 &highagogo:0:.7\n&agogo [&bell * .5]\n```\n\nThe West African standard bell pattern, x.x.xx.x.x.x, seven strokes over twelve pulses, has the major scale's intervals, 2 2 1 2 2 2 1 (the example `bell_and_scale`): both are `even(7, 12, 5)`, the diatonic necklace at the ionian's phase (decision 072; `even.test.ts`).\nSo one cell is both: `&key` is the major scale, the piece's main key, and stepped seven times a bar, each step as long as its interval, it is the bell's timeline, which `&bell` strikes (`step=&key:pulse`).\nThe repository's first fragment of two facets, a `mode`, ionian, and a `rhythm`, the bell, each at a place of its own: \"the bell is a world-music associated rhythm-facet and a western music associated harmony / scale-facet\" (the owner, decision 046).\n\nA stepped key that nothing plays doesn't turn, so a line over it (`over=&key`) reads the major scale as `&key scale(ionian, &tonic)` does, note for note; the tonic is left to the text that uses it, `&tonic`, as the mode fragments leave it (#290).\n`step=1m*7` lays the bell over the bar of any meter, as twelve twelfths: over 12/8 they are its pulses, the bell as it is played.\n\nSeven strokes of a high agogô (`&highagogo`, General MIDI's 67, a hole the General MIDI kit fills with its line), the example's accents, at half the level; its mix, `&agogo` (the level, no card: where its notes go is the workbench's, #291), is none of the drum bars' or the claves', so it layers on any of them.\nAs a rhythm its point is a timeline's: off the beat (sync 0.8), over one static chord (harm 0.1), struck (artic 0.9), steady and fairly dense (energy 0.6), where no preset is.\nAs a mode it is where the major is played: the centroid of the three presets that play ionian, Ambient's, Bossa nova's and Swing jazz's (each axis their mean, to three decimals), where no preset is, so at each of them the plain `ionian` is found first, at distance 0.\n\n**Its signature** (decision 065): `&key, &bell, &agogo from &tonic`. `&key, &bell, &agogo from bell_and_scale D` takes a copy of it, `&tonic` its main argument.\n","modes/06-harmonic-minor":`---
id: harmonic_minor
association:
  - point:
      sync: 0.55
      harm: 0.75
      artic: 0.6
      energy: 0.75
    weight: 1
    facet: mode
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.35
    weight: 1
    facet: mode
source: seed
lifted: yggi/cells examples/electroswing.md @ 2c120d4
---

\`\`\`cells
&key from &tonic
&key scale(harmonic, &tonic)
\`\`\`

The minor with a raised seventh: the gypsy jazz key of [Electro swing, in pieces](../../examples/electroswing.md), whose vamp's fifth is then a major chord, a dominant (\`[4,6,8]\` over D is A C♯ E), and whose line over it is the fifth's phrygian dominant.
It defines \`&key\`, the key (decision 047's interface name, decision 056, named since decision 060), and uses \`&tonic\`, a cell holding the key's tonic (\`&tonic D\`, #290), so it fits any workbench that has no key yet and gives the tonic; the harmonies and the bass lines read it (\`over=&key\`, then \`over=&harm\`).
The tonic is left to the text that uses it, a hole, as the other modes leave theirs.

At a point proposed for an Electro swing preset (sync .55, harm .75, artic .6, energy .75), weight 1, Jambot's to adopt (decision 041); Jambot's composer has no harmonic minor among its modes yet (\`COMPOSER_MODES\`, yggi/jambot packages/engine/src/key.ts).
Also at the point proposed for a Spooky preset (sync .2, harm .9, artic .3, energy .35; #349), weight 1: the key of [Spooky, in pieces](../../examples/spooky.md), its augmented second between the sixth and the seventh the sound of a horror film's minor.

**Its signature** (decision 065): \`&key from &tonic\`. \`&key from harmonic_minor D\` takes a copy of it, \`&tonic\` its main argument.
`,"modules/01-osc":"---\nid: osc\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: module\nsource: seed\n---\n\n```cells\n&osc from (&pitch)\n&osc s=saw loop=C3 pitch=&pitch\n&pitch 0\n```\n\nAn oscillator, a modular's VCO (decision 067 §3): a voice, and its jack is its pitch.\nA voice is an oscillator already (`&saw s=saw loop=C2`); this fragment gives it a panel, so that every module of a patch is written, and drawn, alike.\n\n**Its jack**, `&pitch` (default `0`, no bend): a voice's own pitch on every note, in semitones (`pitch=`, sound.md), the input a modular's exponential FM is. Patch a slow wave into it for a drift or a vibrato: `osc(pitch=&(map=lin loop=&bar/4 0 .12 0))`, or the seed's `vibrato`.\n**Its wave and its register** are its head's: a saw on C3 where the use says nothing, and the use's own attributes before `from` where it does (decision 065 §4), `&sub s=square loop=C1 from osc(pitch=&drift)`. A wave is a word, not a cell, so it is no jack.\nIts notes come from the product that plays it, as any voice's do (`[&tune * &osc]`): a modular's 1 V/oct and gate are the melody's pitch and onsets ([nets.md](../../docs/notes/nets.md)).\n\n**Its signature** (decision 065): `&osc from (&pitch)`, no main parameter. `&lead from osc` takes a copy of it, named `&lead`.\n\nAssociated once, as the facet `module`, at the centre of style space, at a quarter weight, as an instrument is: a module is no style's. In a patch it is the VCO.\n","modules/02-lowpass":"---\nid: lowpass\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: module\nsource: seed\n---\n\n```cells\n&lowpass from (&cutoff, &res, &eg) &in\n&lowpass lpf=70..4800 * &eg * &cutoff lpq=4..16 * &res [&in]\n&cutoff map=lin .5\n&res map=lin .3\n&eg map=adsr 0 0 1 0\n```\n\nA resonant low-pass filter, a modular's VCF (decision 067 §3): an instrument whose sound parameters act on what its voices play, in series after each voice's own (decision 067 §1), so one filter follows a mix of oscillators.\n\n**Its input**, the main parameter `&in`: what it filters, a voice or a mix written in place, `&vcf from lowpass [&saw, &sub * .5]`.\n**Its jacks**, each a knob at its default when nothing is patched in, each a share from 0 to 1 of its range:\n- `&cutoff` (default `.5`): where the cutoff sits, from 70 Hz to 4800 Hz. Patch a slow wave in for a sweep (`cutoff=&sweep`, with `&sweep loop=&bar/16 from lfo`).\n- `&res` (default `.3`): the resonance, from 4 to 16 (`lpq=`, Web Audio's Q in dB): at the top it rings at the cutoff.\n- `&eg` (default held at 1, no contour): an envelope that opens it on every note, a modular's contour generator (`eg=&contour`, with `&contour map=adsr .002 .2 .1 .1`, or one of the seed's `envelopes`).\nThe three multiply, as a moving parameter's cells do (sound.md): an envelope scaled by the knob, the knob moved by the LFO.\n\n**Its signature** (decision 065): `&lowpass from (&cutoff, &res, &eg) &in`. A cable is a reference argument, the piece's own cell, so a slider on it keeps working through the filter. Patched into nothing, a jack is its knob.\nIts own attributes, before `from`, are the head's: `&vcf delay=.3 delaytime=&bar*3/16 from lowpass …` sends what it filters to an echo.\n\nAssociated once, as the facet `module`, at the centre of style space, at a quarter weight; in a patch it is the VCF.\n","modules/03-highpass":`---
id: highpass
association:
  - point:
      sync: 0.5
      harm: 0.5
      artic: 0.5
      energy: 0.5
    weight: 0.25
    facet: module
source: seed
---

\`\`\`cells
&highpass from (&cutoff, &res, &eg) &in
&highpass hpf=20..2400 * &eg * &cutoff hpq=1..12 * &res [&in]
&cutoff map=lin .5
&res map=lin .1
&eg map=adsr 0 0 1 0
\`\`\`

A resonant high-pass filter (decision 067 §3), the low-pass's mirror: it takes away the lows of what its voices play, in series after each voice's own (decision 067 §1). A hat from white noise, a thin lead, the low end cleared from a pad.

**Its input**, the main parameter \`&in\`: what it filters, a voice or a mix written in place.
**Its jacks**, each a knob at its default when nothing is patched in, each a share from 0 to 1 of its range:
- \`&cutoff\` (default \`.5\`): from 20 Hz to 2400 Hz.
- \`&res\` (default \`.1\`): the resonance, from 1 to 12 (\`hpq=\`), nearly flat where nothing is patched.
- \`&eg\` (default held at 1): an envelope that moves the cutoff on every note.

**Its signature** (decision 065): \`&highpass from (&cutoff, &res, &eg) &in\`. A kind of filter is a word, and a parameter is a cell, so each kind is a fragment of its own (decision 067 §3), not one filter with a mode.

Associated once, as the facet \`module\`, at the centre of style space, at a quarter weight; in a patch, the high-pass (HPF).
`,"modules/04-amp":"---\nid: amp\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: module\nsource: seed\n---\n\n```cells\n&amp from (&eg, &level) &in\n&amp [&eg * &level * &in]\n&eg map=adsr .005 .2 .7 .1\n&level map=amp 1\n```\n\nAn amplifier, a modular's VCA (decision 067 §3): an instrument with an envelope and a level, the volumes that act on what it plays acting on each of its voices (mix.md: a pitch or a volume on a mix acts on each voice).\nIt is what an instrument with an envelope always was, `[&(map=adsr …) * &saw]`, with jacks.\n\n**Its input**, the main parameter `&in`: what it shapes, a voice, a filter, a mix.\n**Its jacks**:\n- `&eg` (default a struck and held shape: 5 ms up, a fall over .2 s to .7, a release of .1 s): the envelope on every note. An inline one is a cell of its own, `amp(eg=&(map=adsr .002 .3 .5 .06))`, its slots changed where it says; or one of the seed's `envelopes`, `amp(eg=&pluck)`.\n- `&level` (default `1`): a level over time, a volume (`map=amp`, `map=lin`, `map=db`): accents, a swell, a tremolo from a fast LFO.\n\n**Its signature** (decision 065): `&amp from (&eg, &level) &in`.\n\nAssociated once, as the facet `module`, at the centre of style space, at a quarter weight; in a patch it is the VCA.\n","modules/05-lfo":"---\nid: lfo\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: module\nsource: seed\n---\n\n```cells\n&lfo from\n&lfo map=lin loop=.5 sin(12)\n```\n\nA low-frequency oscillator, a modular's LFO (decision 067 §3): a sine, ramped (`map=lin`) through its twelve points, turning once every two seconds. Read by a jack, its −1…1 is a share from 0 to 1, its middle at .5 (decision 067 §5).\nAn LFO is a braid turned slowly, as a voice is one turned fast (sound.md): patched into a jack, it moves what the jack moves (`lowpass(cutoff=&sweep)`, `osc(pitch=&wobble)`).\n\n**Its rate** is its head's `loop=`, as any cell's: a use sets it before `from` (decision 065 §4), in seconds a lap or as a clock, so it keeps time with the piece: `&sweep loop=&bar/16 from lfo` comes round once every eight bars of 4/4, and `&wobble loop=&bar*2 from lfo` once a beat. Its shape is its braid; a use that wants another writes its own cell. A bipolar braid (one that runs below 0: `saw(8)`, `tri(4)`, `square(2)`) is read the same way, as (1 + x)/2; one that stays at 0 or above, as written.\n\n**Its signature** (decision 065): `&lfo from`, the head alone. `&sweep from lfo` takes a copy of it, named `&sweep`.\n\nAssociated once, as the facet `module`, at the centre of style space, at a quarter weight; in a patch it is the LFO.\n","modules/06-sh":`---
id: sh
association:
  - point:
      sync: 0.5
      harm: 0.5
      artic: 0.5
      energy: 0.5
    weight: 0.25
    facet: module
source: seed
---

\`\`\`cells
&sh from
&sh step=8n [0|.25|.5|.75|1]
\`\`\`

A sample and hold, a modular's S&H (decision 067 §3): on every eighth a value from 0 to 1 is taken at random and held until the next, patched into a jack, \`lowpass(res=&jitter)\` with \`&jitter from sh\`.
Its randomness is the language's own chance (decision 031): a choice \`[a|b|c]\`, drawn each lap, keyed on the seed, the cell, the lap and the step, so a piece plays the same each time it is played, and \`seed=\` gives another sequence. A level or a parameter draws it as a melody does (#457).

**Its clock** is its head's \`step=\`: a use sets it before \`from\`, \`&jitter step=16n from sh\`, or patches a clock in by tapping another meter. Its five values are its braid: a use that wants others writes its own cell.

**Its signature** (decision 065): \`&sh from\`, the head alone.

Associated once, as the facet \`module\`, at the centre of style space, at a quarter weight; in a patch it is the S&H.
`,"modules/07-bandpass":`---
id: bandpass
association:
  - point:
      sync: 0.5
      harm: 0.5
      artic: 0.5
      energy: 0.5
    weight: 0.25
    facet: module
source: seed
---

\`\`\`cells
&bandpass from (&cutoff, &res, &eg) &in
&bandpass bpf=100..5000 * &eg * &cutoff bpq=.5..12 * &res [&in]
&cutoff map=lin .5
&res map=lin .3
&eg map=adsr 0 0 1 0
\`\`\`

A band-pass filter (decision 074): it lets a band around its centre through and takes away what is above and below it, the third of superdough's filters after the low-pass and the high-pass. An instrument, as the \`lowpass\` module is (decision 067), in series after each voice's own filters.

**Its input**, the main parameter \`&in\`: what it filters, a voice or a mix written in place, \`&vcf from bandpass [&saw, &noise * .3]\`.
**Its jacks**, each a share from 0 to 1 of its range, at its default when nothing is patched in:
- \`&cutoff\` (default \`.5\`): the band's centre, from 100 Hz to 5000 Hz. Patch a slow wave in for a sweep, a wah (\`cutoff=&sweep\`).
- \`&res\` (default \`.3\`): its Q, from .5 to 12 (\`bpq=\`, read linearly as Web Audio's band-pass reads it: the centre over the bandwidth). Higher is a narrower band.
- \`&eg\` (default held at 1): an envelope that moves the centre on every note.

**Its signature** (decision 065): \`&bandpass from (&cutoff, &res, &eg) &in\`, as the \`lowpass\` module's.

Associated once, as the facet \`module\`, at the centre of style space, at a quarter weight.
`,"modules/08-lowpass24":"---\nid: lowpass24\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: module\nsource: seed\n---\n\n```cells\n&lowpass24 from (&cutoff, &res, &eg) &in\n&lowpass24 lpf=70..4800 * &eg * &cutoff lpq=4..16 * &res [&stage]\n&stage lpf=70..4800 * &eg * &cutoff lpq=4..16 * &res [&in]\n&cutoff map=lin .5\n&res map=lin .3\n&eg map=adsr 0 0 1 0\n```\n\nA 24 dB low-pass (decision 074): two of the `lowpass` module's stages in series, each at the same cutoff and resonance, so it falls twice as steeply above its cutoff and rings harder at it. That is superdough's `24db` exactly, written out: two filters in a row are two stages (decision 067), so a steeper slope is a composition, not a new kind of filter.\n\n**Its input**, the main parameter `&in`: what it filters, `&vcf from lowpass24 [&saw, &sub * .5]`.\n**Its jacks** are the `lowpass` module's: `&cutoff` (default `.5`, 70 Hz to 4800 Hz), `&res` (default `.3`, 4 to 16, Web Audio's Q in dB, on each stage) and `&eg` (default held at 1). One cable moves both stages alike.\n**`&stage`** is its first stage, its own: each use of it has its own.\n\n**Its signature** (decision 065): `&lowpass24 from (&cutoff, &res, &eg) &in`, as the `lowpass` module's.\n\nAssociated once, as the facet `module`, at the centre of style space, at a quarter weight.\n","motifs/01-hook":"---\nid: hook\nassociation:\n  - point:\n      sync: 0.3\n      harm: 0.45\n      artic: 0.55\n      energy: 0.55\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&hook from &key\n&hook over=&key step=8n 4 4 3 2@2 ~ 0 2\n```\n\nA pop hook: the fifth twice, stepping down to the third and held, a breath, then the tonic and up a step, so it asks to come round again. Written by hand for Synth-pop's minor (aeolian), its sung, fairly short notes.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&hook`), so `use &hook` takes it; a form reads it as its `&call` (`&call step=8n &hook`), the line the form moves and answers.\n\nAt Synth-pop's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&hook from &key`. `&hook from hook &key` takes a copy of it, `&key` its main argument.\n","motifs/02-octaves":"---\nid: octaves\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&octaves from &key\n&octaves over=&key step=8n 0 ~ 7 ~ 0 0 ~ 7\n```\n\nThe tonic and its octave, struck short on and off the beat: the line a techno track rides a filter over, its pitch all in two notes. Written by hand for Techno, where the harmony stands still and every note is staccato.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&octaves`), so `use &octaves` takes it; a form reads it as its `&call` (`&call step=8n &octaves`), the line the form moves and answers.\n\nAt Techno's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&octaves from &key`. `&octaves from octaves &key` takes a copy of it, `&key` its main argument.\n","motifs/03-sigh":"---\nid: sigh\nassociation:\n  - point:\n      sync: 0.35\n      harm: 0.55\n      artic: 0.65\n      energy: 0.65\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&sigh from &key\n&sigh over=&key step=8n 4@3 3 2@2 ~ ~\n```\n\nA sigh: the fifth held, falling by step to the third and held again, then two beats of air. Written by hand for Deep house's dorian, a vocal hook's shape over a vamp.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&sigh`), so `use &sigh` takes it; a form reads it as its `&call` (`&call step=8n &sigh`), the line the form moves and answers.\n\nAt Deep house's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&sigh from &key`. `&sigh from sigh &key` takes a copy of it, `&key` its main argument.\n","motifs/04-rising":"---\nid: rising\nassociation:\n  - point:\n      sync: 0.05\n      harm: 0.3\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&rising from &key\n&rising over=&key step=8n 0@2 2@2 4@4\n```\n\nThe triad rising slowly, tonic, third, fifth, the last held half the bar: the owner's own example of a motif's name (#288). Written by hand for Ambient, legato and sparse.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&rising`), so `use &rising` takes it; a form reads it as its `&call` (`&call step=8n &rising`), the line the form moves and answers.\n\nAt Ambient's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&rising from &key`. `&rising from rising &key` takes a copy of it, `&key` its main argument.\n","motifs/05-lazy":"---\nid: lazy\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.75\n      artic: 0.35\n      energy: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&lazy from &key\n&lazy over=&key step=8n ~ 2 4 ~ 3@2 2 0\n```\n\nLate in, up to the fifth, then down by step to the tonic, the fourth held: a lazy line behind the beat. Written by hand for Lo-fi hip hop's minor, its swung eighths.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&lazy`), so `use &lazy` takes it; a form reads it as its `&call` (`&call step=8n &lazy`), the line the form moves and answers.\n\nAt Lo-fi hip hop's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&lazy from &key`. `&lazy from lazy &key` takes a copy of it, `&key` its main argument.\n","motifs/06-riff":"---\nid: riff\nassociation:\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.75\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&riff from &key\n&riff over=&key step=8n 0 ~ 3 0 ~ 4 3 ~\n```\n\nA funk riff: the tonic, the fourth and the fifth, all off and on the beat in short strokes. Written by hand for Funk's dorian, at its most syncopated and staccato.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&riff`), so `use &riff` takes it; a form reads it as its `&call` (`&call step=8n &riff`), the line the form moves and answers.\n\nAt Funk's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&riff from &key`. `&riff from riff &key` takes a copy of it, `&key` its main argument.\n","motifs/07-tresillo":"---\nid: tresillo\nassociation:\n  - point:\n      sync: 0.75\n      harm: 0.85\n      artic: 0.45\n      energy: 0.45\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&tresillo from &key\n&tresillo over=&key step=8n 4@3 2@3 0@2\n```\n\nThe fifth, the third and the tonic falling on the tresillo's 3 + 3 + 2. Written by hand for Bossa nova, its melody on the clave's long-long-short.\nIts durations, 3 3 2 eighths, are `even(3, 8, 2)`, three as even as three go over eight (decision 072; `even.test.ts`); the cinquillo is its five, `even(5, 8, 2)`.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&tresillo`), so `use &tresillo` takes it; a form reads it as its `&call` (`&call step=8n &tresillo`), the line the form moves and answers.\n\nAt Bossa nova's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&tresillo from &key`. `&tresillo from tresillo &key` takes a copy of it, `&key` its main argument.\n","motifs/08-bebop":"---\nid: bebop\nassociation:\n  - point:\n      sync: 0.35\n      harm: 1\n      artic: 0.3\n      energy: 0.6\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&bebop from &key\n&bebop over=&key step=8n 0 2 4 6 7@2 6 4\n```\n\nUp the seventh chord to the octave, held, and back down through the seventh: a bebop arpeggio. Written by hand for Swing jazz, where the harmony moves most.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&bebop`), so `use &bebop` takes it; a form reads it as its `&call` (`&call step=8n &bebop`), the line the form moves and answers.\n\nAt Swing jazz's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&bebop from &key`. `&bebop from bebop &key` takes a copy of it, `&key` its main argument.\n","motifs/09-gypsy":"---\nid: gypsy\nassociation:\n  - point:\n      sync: 0.55\n      harm: 0.75\n      artic: 0.6\n      energy: 0.75\n    weight: 1\n    facet: motif\nsource: seed\nlifted: yggi/cells examples/electroswing.md @ 7622a87\n---\n\n```cells\n&gypsy from &key\n&gypsy over=&key step=8n 4 5 6 7@2 6 4@2\n```\n\nThe clarinet's call of [Electro swing, in pieces](../../examples/electroswing.md): A B♭ C♯ D and back to A in D harmonic minor, the fifth climbing through the minor sixth and the leading note to the octave, gypsy jazz's run.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&gypsy`), so `use &gypsy` takes it; a form reads it as its `&call` (`&call step=8n &gypsy`), the line the form moves and answers.\n\nAt the point proposed for an Electro swing preset (sync 0.55, harm 0.75, artic 0.6, energy 0.75), as the example's other seeds are: Jambot's to adopt (decision 041).\n\n**Its signature** (decision 065): `&gypsy from &key`. `&gypsy from gypsy &key` takes a copy of it, `&key` its main argument.\n","motifs/10-dies-irae":"---\nid: diesIrae\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.35\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&diesIrae from &key\n&diesIrae over=&key step=8n 2 1 2 0 1 -1 0@2\n```\n\nThe head of the *Dies irae*, the plainchant of the day of wrath, which Berlioz, Liszt, Saint-Saëns and a century of horror films quote: the third, the second, the third, the tonic, the second, the note below the tonic, and the tonic held (F E F D E C D in D minor; C♯ in harmonic minor, which makes it darker still). The chant is in the public domain.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&diesIrae`), so `use &diesIrae` takes it; a form reads it as its `&call` (`&call step=8n &diesIrae`), the line the form moves and answers.\nAt the point proposed for a Spooky preset (sync .2, harm .9, artic .3, energy .35; #349), weight 1, Jambot's to adopt (decision 041).\n\n**Its signature** (decision 065): `&diesIrae from &key`. `&diesIrae from diesIrae &key` takes a copy of it, `&key` its main argument.\n","motifs/11-refrain":"---\nid: refrain\nassociation:\n  - point:\n      sync: 0.3\n      harm: 0.45\n      artic: 0.55\n      energy: 0.65\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&refrain from &key\n&refrain over=&key step=8n 2 2 2 4@2 3 2 0\n```\n\nThe refrain under the hook: the third three times, up to the fifth and held, then stepping down home. Written by hand for Synth-pop's minor (aeolian), a sung line that lands where the hook only asks.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&refrain`), so `use &refrain` takes it; a form reads it as its `&call` (`&call step=8n &refrain`), the line the form moves and answers.\n\nNear Synth-pop's point, 0.1 higher in energy, so a query there finds `hook` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&refrain from &key`. `&refrain from refrain &key` takes a copy of it, `&key` its main argument.\n","motifs/12-pulse":"---\nid: pulse\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.9\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&pulse from &key\n&pulse over=&key step=8n 0 ~ 0 ~ 2 ~ 0 ~\n```\n\nThe tonic struck on every beat and the third once, all short: a line that is mostly rhythm, as a techno lead is. Written by hand for Techno, where the harmony stands still.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&pulse`), so `use &pulse` takes it; a form reads it as its `&call` (`&call step=8n &pulse`), the line the form moves and answers.\n\nNear Techno's point, 0.1 higher in energy, so a query there finds `octaves` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&pulse from &key`. `&pulse from pulse &key` takes a copy of it, `&key` its main argument.\n","motifs/13-soul":"---\nid: soul\nassociation:\n  - point:\n      sync: 0.35\n      harm: 0.55\n      artic: 0.65\n      energy: 0.75\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&soul from &key\n&soul over=&key step=8n 4 ~ 4 3 4@2 2@2\n```\n\nThe fifth twice, a turn through the fourth and back, then down to the third and held: a vocal ad lib over a vamp. Written by hand for Deep house's dorian.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&soul`), so `use &soul` takes it; a form reads it as its `&call` (`&call step=8n &soul`), the line the form moves and answers.\n\nNear Deep house's point, 0.1 higher in energy, so a query there finds `sigh` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&soul from &key`. `&soul from soul &key` takes a copy of it, `&key` its main argument.\n","motifs/14-drift":"---\nid: drift\nassociation:\n  - point:\n      sync: 0.05\n      harm: 0.3\n      artic: 0\n      energy: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&drift from &key\n&drift over=&key step=8n 4@4 3@4\n```\n\nTwo notes, the fifth and the fourth, half a bar each: a line that barely moves, legato and sparse. Written by hand for Ambient.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&drift`), so `use &drift` takes it; a form reads it as its `&call` (`&call step=8n &drift`), the line the form moves and answers.\n\nNear Ambient's point, 0.1 higher in energy, so a query there finds `rising` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&drift from &key`. `&drift from drift &key` takes a copy of it, `&key` its main argument.\n","motifs/15-dusty":"---\nid: dusty\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.75\n      artic: 0.35\n      energy: 0.6\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&dusty from &key\n&dusty over=&key step=8n ~ 0 2 ~ 4 2@3\n```\n\nLate in on the tonic, up through the third to the fifth and back to the third, held to the bar's end: a line that sits behind the beat. Written by hand for Lo-fi hip hop's minor and its swung eighths.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&dusty`), so `use &dusty` takes it; a form reads it as its `&call` (`&call step=8n &dusty`), the line the form moves and answers.\n\nNear Lo-fi hip hop's point, 0.1 higher in energy, so a query there finds `lazy` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&dusty from &key`. `&dusty from dusty &key` takes a copy of it, `&key` its main argument.\n","motifs/16-slap":"---\nid: slap\nassociation:\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.85\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&slap from &key\n&slap over=&key step=8n 0 0 ~ 6 0 ~ 4 ~\n```\n\nThe tonic twice, the flat seventh off the beat, the tonic, then the fifth: short and syncopated, the bass player's lick taken up by the lead. Written by hand for Funk's dorian.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&slap`), so `use &slap` takes it; a form reads it as its `&call` (`&call step=8n &slap`), the line the form moves and answers.\n\nNear Funk's point, 0.1 higher in energy, so a query there finds `riff` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&slap from &key`. `&slap from slap &key` takes a copy of it, `&key` its main argument.\n","motifs/17-saudade":"---\nid: saudade\nassociation:\n  - point:\n      sync: 0.75\n      harm: 0.85\n      artic: 0.45\n      energy: 0.55\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&saudade from &key\n&saudade over=&key step=8n 2 ~ 3 2 ~ 1 0@2\n```\n\nThe third, the fourth and back, then falling by step to the tonic and held: a sigh between the guitar's chords. Written by hand for Bossa nova.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&saudade`), so `use &saudade` takes it; a form reads it as its `&call` (`&call step=8n &saudade`), the line the form moves and answers.\n\nNear Bossa nova's point, 0.1 higher in energy, so a query there finds `tresillo` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&saudade from &key`. `&saudade from saudade &key` takes a copy of it, `&key` its main argument.\n","motifs/18-blue":"---\nid: blue\nassociation:\n  - point:\n      sync: 0.35\n      harm: 1\n      artic: 0.3\n      energy: 0.7\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&blue from &key\n&blue over=&key step=8n 4 3 2 1 0@2 -2@2\n```\n\nDown the scale from the fifth to the tonic and on to the sixth below, held: the line that ends a chorus on the sixth. Written by hand for Swing jazz.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&blue`), so `use &blue` takes it; a form reads it as its `&call` (`&call step=8n &blue`), the line the form moves and answers.\n\nNear Swing jazz's point, 0.1 higher in energy, so a query there finds `bebop` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&blue from &key`. `&blue from blue &key` takes a copy of it, `&key` its main argument.\n","motifs/19-lindy":"---\nid: lindy\nassociation:\n  - point:\n      sync: 0.55\n      harm: 0.75\n      artic: 0.6\n      energy: 0.85\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&lindy from &key\n&lindy over=&key step=8n 0@3 4@3 2@2\n```\n\nThe tonic, the fifth and the third on the Charleston's 3 + 3 + 2, as a Lindy hop dances it: the swing era's dance, which electro swing samples. Written by hand for Electro swing's harmonic minor.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&lindy`), so `use &lindy` takes it; a form reads it as its `&call` (`&call step=8n &lindy`), the line the form moves and answers.\n\nNear Electro swing's point, 0.1 higher in energy, so a query there finds `gypsy` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&lindy from &key`. `&lindy from lindy &key` takes a copy of it, `&key` its main argument.\n","motifs/20-toll":"---\nid: toll\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.45\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&toll from &key\n&toll over=&key step=8n 0@4 -3@4\n```\n\nA bell tolling: the tonic, then the fifth below, half a bar each. Written by hand for Spooky, the knell before the chant.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&toll`), so `use &toll` takes it; a form reads it as its `&call` (`&call step=8n &toll`), the line the form moves and answers.\n\nNear Spooky's point, 0.1 higher in energy, so a query there finds `diesIrae` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&toll from &key`. `&toll from toll &key` takes a copy of it, `&key` its main argument.\n","motifs/21-waltz":"---\nid: waltz\nassociation:\n  - point:\n      sync: 0\n      harm: 0.7\n      artic: 0.3\n      energy: 0\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&waltz from &key\n&waltz over=&key step=8n 0@2 2 4 4@2\n```\n\nThe tonic held on the downbeat, then the third and the fifth, the fifth held into the next bar: a waltz's long first beat and its two light ones.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 3/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&waltz`), so `use &waltz` takes it; a form reads it as its `&call` (`&call step=8n &waltz`), the line the form moves and answers.\n\nAt 3/4's first point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&waltz from &key`. `&waltz from waltz &key` takes a copy of it, `&key` its main argument.\n","motifs/22-music-box":"---\nid: musicBox\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.43\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&musicBox from &key\n&musicBox over=&key step=8n 4 3 4 1 2@2\n```\n\nThe fifth, the fourth and the fifth again, then down to the second and the third held: a music box running down, in three. Near Spooky, where 3/4 is found.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 3/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&musicBox`), so `use &musicBox` takes it; a form reads it as its `&call` (`&call step=8n &musicBox`), the line the form moves and answers.\n\nAt 3/4's point near Spooky (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&musicBox from &key`. `&musicBox from musicBox &key` takes a copy of it, `&key` its main argument.\n","motifs/23-rocking":"---\nid: rocking\nassociation:\n  - point:\n      sync: 0.3\n      harm: 0.2\n      artic: 0.2\n      energy: 0\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&rocking from &key\n&rocking over=&key step=8n 0@2 2 4@2 2\n```\n\nLong, short, long, short: a cradle's rock in two groups of three, from the tonic to the fifth and back to the third.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 6/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&rocking`), so `use &rocking` takes it; a form reads it as its `&call` (`&call step=8n &rocking`), the line the form moves and answers.\n\nAt 6/8's first point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&rocking from &key`. `&rocking from rocking &key` takes a copy of it, `&key` its main argument.\n","motifs/24-sway":"---\nid: sway\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.27\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&sway from &key\n&sway over=&key step=8n 0@3 -1 -2 -1\n```\n\nThe tonic held for half the bar, then a slow wobble down a step, two steps and back: a candle's flame in 6/8. Near Spooky, where 6/8 is found.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 6/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&sway`), so `use &sway` takes it; a form reads it as its `&call` (`&call step=8n &sway`), the line the form moves and answers.\n\nAt 6/8's point near Spooky (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&sway from &key`. `&sway from sway &key` takes a copy of it, `&key` its main argument.\n","motifs/25-fivefold":"---\nid: fivefold\nassociation:\n  - point:\n      sync: 0.4\n      harm: 0.9\n      artic: 0.5\n      energy: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&fivefold from &key\n&fivefold over=&key step=8n 0 2 4@4 3 2 1@2\n```\n\nUp the triad to the fifth and held, the bar's first three beats, then down by step through its last two: five beats grouped 3 + 2.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 5/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&fivefold`), so `use &fivefold` takes it; a form reads it as its `&call` (`&call step=8n &fivefold`), the line the form moves and answers.\n\nAt 5/4's first point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&fivefold from &key`. `&fivefold from fivefold &key` takes a copy of it, `&key` its main argument.\n","motifs/26-limp":"---\nid: limp\nassociation:\n  - point:\n      sync: 0.8\n      harm: 0.6\n      artic: 1\n      energy: 1\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&limp from &key\n&limp over=&key step=8n 0 ~ 4 ~ 3 2 0\n```\n\nThe tonic, the fifth, then a run down to the tonic: short notes in 7/8's 2 + 2 + 3, the last group the long one.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 7/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&limp`), so `use &limp` takes it; a form reads it as its `&call` (`&call step=8n &limp`), the line the form moves and answers.\n\nAt 7/8's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&limp from &key`. `&limp from limp &key` takes a copy of it, `&key` its main argument.\n","motifs/27-dancer":"---\nid: dancer\nassociation:\n  - point:\n      sync: 0.6\n      harm: 0.9\n      artic: 0.8\n      energy: 0.9\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&dancer from &key\n&dancer over=&key step=8n 0 ~ 2 4 ~ 5 4 2 1 0\n```\n\nTen eighths as 3 + 3 + 2 + 2: a leap up to the sixth in the threes, then stepping home in the twos.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 10/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&dancer`), so `use &dancer` takes it; a form reads it as its `&call` (`&call step=8n &dancer`), the line the form moves and answers.\n\nAt 10/8's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&dancer from &key`. `&dancer from dancer &key` takes a copy of it, `&key` its main argument.\n","motifs/28-shuffle":"---\nid: shuffle\nassociation:\n  - point:\n      sync: 0.7\n      harm: 0.6\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&shuffle from &key\n&shuffle over=&key step=8n 0@2 2 3@2 4 4@2 2 0@2 ~\n```\n\nLong, short four times over the bar's four beats: the tonic, the third, the fourth, the fifth and back, a slow blues shuffle in 12/8.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 12/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&shuffle`), so `use &shuffle` takes it; a form reads it as its `&call` (`&call step=8n &shuffle`), the line the form moves and answers.\n\nAt 12/8's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&shuffle from &key`. `&shuffle from shuffle &key` takes a copy of it, `&key` its main argument.\n","motifs/29-march":"---\nid: march\nassociation:\n  - point:\n      sync: 0\n      harm: 0.1\n      artic: 0.6\n      energy: 1\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&march from &key\n&march over=&key step=8n 4 4 0 ~\n```\n\nThe fifth twice, then the tonic, and a rest: a march's call, two beats to the bar.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 2/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&march`), so `use &march` takes it; a form reads it as its `&call` (`&call step=8n &march`), the line the form moves and answers.\n\nAt 2/4's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&march from &key`. `&march from march &key` takes a copy of it, `&key` its main argument.\n","motifs/30-fanfare":"---\nid: fanfare\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.6\n      artic: 0.9\n      energy: 1\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&fanfare from &key\n&fanfare over=&key step=8n 0 0 0 2@2 4@2 ~\n```\n\nThe tonic three times, then the third and the fifth held: a fanfare's call, in two half-note beats.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4 alla breve: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&fanfare`), so `use &fanfare` takes it; a form reads it as its `&call` (`&call step=8n &fanfare`), the line the form moves and answers.\n\nAt 4/4 alla breve's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&fanfare from &key`. `&fanfare from fanfare &key` takes a copy of it, `&key` its main argument.\n","motifs/31-question":"---\nid: question\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&question from &key\n&question over=&key step=8n 0 1 2@2 4@4\n```\n\nUp by step to the third, then a leap to the fifth held half the bar: a phrase that ends open, asking for an answer. General-purpose, for any style.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&question`), so `use &question` takes it; a form reads it as its `&call` (`&call step=8n &question`), the line the form moves and answers.\n\nAt the centre of style space (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&question from &key`. `&question from question &key` takes a copy of it, `&key` its main argument.\n","motifs/32-reply":"---\nid: reply\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&reply from &key\n&reply over=&key step=8n 4 3 2@2 0@4\n```\n\nDown by step from the fifth to the third, then home to the tonic held half the bar: the closed answer to `question`. General-purpose.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&reply`), so `use &reply` takes it; a form reads it as its `&call` (`&call step=8n &reply`), the line the form moves and answers.\n\nAt the centre, 0.2 lower in energy (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&reply from &key`. `&reply from reply &key` takes a copy of it, `&key` its main argument.\n","motifs/33-arpeggio":"---\nid: arpeggio\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.3\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&arpeggio from &key\n&arpeggio over=&key step=8n 0 2 4 7 4 2 0 ~\n```\n\nUp the triad to the octave and back down: the plainest line a chord gives. General-purpose, for plainer harmony.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&arpeggio`), so `use &arpeggio` takes it; a form reads it as its `&call` (`&call step=8n &arpeggio`), the line the form moves and answers.\n\nAt the centre, 0.2 lower in harmony (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&arpeggio from &key`. `&arpeggio from arpeggio &key` takes a copy of it, `&key` its main argument.\n","motifs/34-run":"---\nid: run\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.7\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&run from &key\n&run over=&key step=8n 0 1 2 3 4 5 6 7\n```\n\nThe scale from the tonic to the octave, one note an eighth: in each mode it walks that mode. General-purpose, for richer harmony.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&run`), so `use &run` takes it; a form reads it as its `&call` (`&call step=8n &run`), the line the form moves and answers.\n\nAt the centre, 0.2 higher in harmony (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&run from &key`. `&run from run &key` takes a copy of it, `&key` its main argument.\n","motifs/35-neighbour":"---\nid: neighbour\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.3\n      energy: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&neighbour from &key\n&neighbour over=&key step=8n 0 1 0 -1 0@4\n```\n\nThe tonic, the note above, the tonic, the note below, and the tonic held: the neighbour notes round one pitch. General-purpose, legato.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&neighbour`), so `use &neighbour` takes it; a form reads it as its `&call` (`&call step=8n &neighbour`), the line the form moves and answers.\n\nAt the centre, 0.2 lower in articulation (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&neighbour from &key`. `&neighbour from neighbour &key` takes a copy of it, `&key` its main argument.\n","motifs/36-leap":"---\nid: leap\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.7\n      energy: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&leap from &key\n&leap over=&key step=8n 0@2 4@2 3 2 1 0\n```\n\nThe tonic, a leap to the fifth, then stepping back down the scale: a leap balanced by steps. General-purpose, short notes.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&leap`), so `use &leap` takes it; a form reads it as its `&call` (`&call step=8n &leap`), the line the form moves and answers.\n\nAt the centre, 0.2 higher in articulation (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&leap from &key`. `&leap from leap &key` takes a copy of it, `&key` its main argument.\n","motifs/37-wail":"---\nid: wail\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&wail from &key\n&wail over=&key step=8n 4@3 3#@2 3@3\n```\n\nA held note that sags: the fifth held, then a semitone lower and a semitone lower again, as a ghost's moan bends down (A, G♯, G in D harmonic minor).\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&wail`), so `use &wail` takes it; a form reads it as its `&call` (`&call step=8n &wail`), the line the form moves and answers.\nNear Spooky's point (sync .2, harm .9, artic .3, energy .35; yggi/jambot#517), 0.05 lower in energy, weight 1, as the facet `motif`: one of the ghost-house idioms, a gesture of the genre and no quotation of any tune.\n\n**Its signature** (decision 065): `&wail from &key`. `&wail from wail &key` takes a copy of it, `&key` its main argument.\n","motifs/38-haunt":"---\nid: haunt\nassociation:\n  - point:\n      sync: 0.15\n      harm: 0.9\n      artic: 0.25\n      energy: 0.35\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&haunt from &key\n&haunt over=&key step=8n 2 4 6 9 6 4 2@2\n```\n\nThe augmented triad on the third, up and back: the third, the fifth, the raised seventh, the third an octave up, and down again (F A C♯ F C♯ A F in D harmonic minor), each step a major third, so no note sounds like home.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&haunt`), so `use &haunt` takes it; a form reads it as its `&call` (`&call step=8n &haunt`), the line the form moves and answers.\nNear Spooky's point (sync .2, harm .9, artic .3, energy .35; yggi/jambot#517), 0.05 lower in sync and artic, weight 1, as the facet `motif`: one of the ghost-house idioms, a gesture of the genre and no quotation of any tune.\n\n**Its signature** (decision 065): `&haunt from &key`. `&haunt from haunt &key` takes a copy of it, `&key` its main argument.\n","motifs/39-lament":"---\nid: lament\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.25\n      energy: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&lament from &key\n&lament over=&key step=8n 4 3# 3 2# 2 1 0@2\n```\n\nA chromatic descent from the fifth to the tonic, semitone by semitone where the key allows (A G♯ G F♯ F E D in D harmonic minor): the lament's falling line, made to creep.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&lament`), so `use &lament` takes it; a form reads it as its `&call` (`&call step=8n &lament`), the line the form moves and answers.\nNear Spooky's point (sync .2, harm .9, artic .3, energy .35; yggi/jambot#517), 0.05 lower in artic and energy, weight 1, as the facet `motif`: one of the ghost-house idioms, a gesture of the genre and no quotation of any tune.\n\n**Its signature** (decision 065): `&lament from &key`. `&lament from lament &key` takes a copy of it, `&key` its main argument.\n","motifs/40-peek":"---\nid: peek\nassociation:\n  - point:\n      sync: 0.3\n      harm: 0.9\n      artic: 0.3\n      energy: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&peek from &key\n&peek over=&key step=8n ~ 0 1b 0 ~ ~ -1 0\n```\n\nSomething peeks and hides: a rest, the tonic and the flat second above it and back, a silence, then the leading note below and the tonic (D E♭ D, C♯ D): the semitones on either side of home, the boo that comes when the back is turned.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&peek`), so `use &peek` takes it; a form reads it as its `&call` (`&call step=8n &peek`), the line the form moves and answers.\nIts two rests are written apart (`~ ~`), not held (`~@2`), which plays the same: cells' vary reads no line with a held rest, so it would offer no variation of it, and the recogniser no answer.\nNear Spooky's point (sync .2, harm .9, artic .3, energy .35; yggi/jambot#517), 0.1 higher in sync and 0.05 lower in energy, weight 1, as the facet `motif`: one of the ghost-house idioms, a gesture of the genre and no quotation of any tune.\n\n**Its signature** (decision 065): `&peek from &key`. `&peek from peek &key` takes a copy of it, `&key` its main argument.\n","motifs/41-twinkle":"---\nid: twinkle\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.12\n      artic: 0.5\n      energy: 0.35\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&twinkle from &key\n&twinkle over=&key step=8n 0 0 4 4 5 5 4@2\n```\n\nTwinkle's first line, *twinkle, twinkle, little star*: the tonic twice, a leap to the fifth twice, the sixth twice and back to the fifth, held. The call of the tune, open on the fifth. A traditional tune, in the public domain.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&twinkle`), so `&twinkle from twinkle &key` takes it; a form reads it as one of its lines (`&call step=8n &twinkle`).\n\nAt the point proposed for a preset of children's songs (`KINDERLIED`, `styles`), weight 1, as the facet `motif`, so a query there finds it first.\n\n**Its signature** (decision 065): `&twinkle from &key`. `&twinkle from twinkle &key` takes a copy of it, `&key` its main argument.\n","motifs/42-wonder":"---\nid: wonder\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.12\n      artic: 0.5\n      energy: 0.25\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&wonder from &key\n&wonder over=&key step=8n 3 3 2 2 1 1 0@2\n```\n\nTwinkle's second line, *how I wonder what you are*: down the scale by pairs from the fourth to the tonic, held. The closed answer to `twinkle`, and, a step up (`&wonder^1`), the tune's middle line, *up above the world so high*. A traditional tune, in the public domain.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&wonder`), so `&wonder from wonder &key` takes it; a form reads it as one of its lines (`&call step=8n &wonder`).\n\nAt `KINDERLIED` 0.1 lower in energy, as `reply` sits below `question` (#369), weight 1, as the facet `motif`: a query at the point finds `twinkle` first, and the form `ternary` plays the two together.\n\n**Its signature** (decision 065): `&wonder from &key`. `&wonder from wonder &key` takes a copy of it, `&key` its main argument.\n","motifs/43-haenschen":"---\nid: haenschen\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.12\n      artic: 0.6\n      energy: 0.45\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&haenschen from &key\n&haenschen over=&key step=8n 4 2 2@2 3 1 1@2\n```\n\nHänschen klein's first line, *Hänschen klein, ging allein* (in English *Lightly row*): the fifth falling a third and held, then the fourth falling a third and held. The call of the tune. A traditional tune, in the public domain.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&haenschen`), so `&haenschen from haenschen &key` takes it; a form reads it as one of its lines (`&call step=8n &haenschen`).\n\nAt a point 0.1 from `KINDERLIED` on articulation and energy, a little shorter and denser than Twinkle, weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&haenschen from &key`. `&haenschen from haenschen &key` takes a copy of it, `&key` its main argument.\n","motifs/44-hinein":"---\nid: hinein\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.12\n      artic: 0.6\n      energy: 0.35\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&hinein from &key\n&hinein over=&key step=8n 0 1 2 3 4 4 4@2\n```\n\nHänschen klein's second line, *in die weite Welt hinein*: up the scale from the tonic to the fifth, the fifth three times, held. The open answer to `haenschen`. A traditional tune, in the public domain.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&hinein`), so `&hinein from hinein &key` takes it; a form reads it as one of its lines (`&call step=8n &hinein`).\n\nAt `haenschen`'s point 0.1 lower in energy, weight 1, as the facet `motif`, so a query there finds the call first.\n\n**Its signature** (decision 065): `&hinein from &key`. `&hinein from hinein &key` takes a copy of it, `&key` its main argument.\n","motifs/45-heim":"---\nid: heim\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.12\n      artic: 0.6\n      energy: 0.25\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&heim from &key\n&heim over=&key step=8n 0 2 4 4 0@4\n```\n\nHänschen klein's last line, *ist gar wohlgemut* (*on the silent tide*): the tonic, the third, the fifth twice, and home to the tonic, held half the bar. The closed answer to `haenschen`. A traditional tune, in the public domain.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&heim`), so `&heim from heim &key` takes it; a form reads it as one of its lines (`&call step=8n &heim`).\n\nAt `haenschen`'s point 0.2 lower in energy, weight 1, as the facet `motif`, after the call and its open answer.\n\n**Its signature** (decision 065): `&heim from &key`. `&heim from heim &key` takes a copy of it, `&key` its main argument.\n","motifs/46-weinet":"---\nid: weinet\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.12\n      artic: 0.7\n      energy: 0.45\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&weinet from &key\n&weinet over=&key step=8n 1 1 1 1 1 2 3@2\n```\n\nHänschen klein's middle, *aber Mutter weinet sehr*: the second five times and a step up to the fourth, held; a step up (`&weinet^1`) it is the next line, *hat ja nun kein Hänschen mehr*. The tune's bridge. A traditional tune, in the public domain.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&weinet`), so `&weinet from weinet &key` takes it; a form reads it as one of its lines (`&call step=8n &weinet`).\n\nAt `haenschen`'s point 0.1 higher in articulation, weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&weinet from &key`. `&weinet from weinet &key` takes a copy of it, `&key` its main argument.\n","performers/01-drums":`---
id: drums_performer
association:
  - point:
      sync: 0.3
      harm: 0.45
      artic: 0.55
      energy: 0.55
    weight: 1
    facet: performer
  - point:
      sync: 0.12
      harm: 0
      artic: 1
      energy: 0.8
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 0.55
      artic: 0.65
      energy: 0.65
    weight: 1
    facet: performer
  - point:
      sync: 0.05
      harm: 0.3
      artic: 0
      energy: 0.2
    weight: 1
    facet: performer
  - point:
      sync: 0.5
      harm: 0.75
      artic: 0.35
      energy: 0.5
    weight: 1
    facet: performer
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: performer
  - point:
      sync: 0.75
      harm: 0.85
      artic: 0.45
      energy: 0.45
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 1
      artic: 0.3
      energy: 0.6
    weight: 1
    facet: performer
source: seed
---

\`\`\`cells
&drums, &drumsOut from (&kit) &drumlines
&bd, &rim, &sd, &cp, &lt, &hh, &ph, &mt, &oh, &ht, &cr, &rd, &claves from gm_kit
&kit &bd &rim &sd &cp &lt &hh &ph &mt &oh &ht &cr &rd &claves
&drumsOut play=&drumlines &kit
&drums map=role &drumsOut
\`\`\`

The drummer (decisions 058 and 061, #287): a gate, \`&drumsOut\` (named as Jambot's section text names its gates), whose role is \`drums\` (\`&drums map=role &drumsOut\`), playing the part \`&drumlines\` on 13 of the General MIDI kit's voices, which it takes by name.
The part is a stack of lines, one per role, as Jambot's section text writes its drums (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b, \`drumLines\`): \`&drumlines [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]\`.
A gate plays a stack line by line, each as if it were its one line, so every hit still says which line struck it (\`kit:voices:kick:…\`), the drum role the feel reads (\`contracts/feel\` v1.1).
Each line names its own voices, and a hit its level either way, as Strudel has it: its own gain (\`&bd:0:.645 ~ ~ &bd\`, \`s("bd:0:.645 ~ ~ bd")\`), or the line times a line of levels in the stack (\`&euclid * &euclidLevel\`, \`s("rim(7,16)").gain("…")\`), read at each note's written step, so a straight Euclid under a swung meter keeps its levels, and a number (\`&clave * .5\`). So the drummer has no level of its own, and its one hole is the score's: \`&drumlines\`.
Its kit is the drummer's own set-up of those 13 voices, the kick, the side stick, the snare, the clap, three toms, the closed, pedal and open hats, the crash, the ride and the claves, a table (\`&kit\`): a line that strikes a voice the kit doesn't hold is an error.

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`styles\`), at weight 1: every preset's section text plays its drums the same way, on these 13 voices on channel 10, so the eight share this one drummer, and what a preset's drums sound like is its lines, not its player.

**Its signature** (decision 065): \`&drums, &drumsOut from (&kit) &drumlines\`. \`&drums from drums_performer &groove\` takes a copy of it, \`&drumlines\` its main argument; \`&kit\` an optional parameter, its line its default (\`"drums_performer"(kit=…)\`).
`,"performers/02-bass":`---
id: bass_performer
association:
  - point:
      sync: 0.3
      harm: 0.45
      artic: 0.55
      energy: 0.55
    weight: 1
    facet: performer
  - point:
      sync: 0.12
      harm: 0
      artic: 1
      energy: 0.8
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 0.55
      artic: 0.65
      energy: 0.65
    weight: 1
    facet: performer
  - point:
      sync: 0.05
      harm: 0.3
      artic: 0
      energy: 0.2
    weight: 1
    facet: performer
  - point:
      sync: 0.5
      harm: 0.75
      artic: 0.35
      energy: 0.5
    weight: 1
    facet: performer
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: performer
  - point:
      sync: 0.75
      harm: 0.85
      artic: 0.45
      energy: 0.45
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 1
      artic: 0.3
      energy: 0.6
    weight: 1
    facet: performer
source: seed
---

\`\`\`cells
&bass, &bassOut from (&bassLevel) &bassline
&bassV from bass
&bassOut play=&bassline^$-12 level=&bassLevel &bassV
&bass map=role &bassOut
&bassLevel map=amp .8
\`\`\`

The bass player (decisions 058 and 061): a gate, \`&bassOut\` (Jambot's section text's name for it), whose role is \`bass\` (\`&bass map=role &bassOut\`), playing the part \`&bassline\` on the \`bass\` instrument an octave down.
The instrument holds the register, \`&bassV loop=C2\`, and Jambot's section text sounds its bass at C1 (\`PIN_VOICES.bass\`, yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b), so the gate moves the part 12 grid steps down (\`^$-12\`), and the bass sends the MIDI notes it sends today.
Its two inputs are the score's (decision 065: the line its main parameter, the level an optional one, one level of .8 by default): \`&bassline\`, the line (degrees over the chord in force or the key, held and shared as the section text writes them), and \`&bassLevel\`, its velocities as written: a line of levels (\`map=amp step=16n\`), or one level where they are all one (\`&bassLevel map=amp .8\`).

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`styles\`), at weight 1: every preset's section text plays this part the same way (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b: one voice, one register and one channel for all eight), so the eight share this one performer, and what a preset sounds like is its parts, not its players.

**Its signature** (decision 065): \`&bass, &bassOut from (&bassLevel) &bassline\`. \`&bass from bass_performer &line\` takes a copy of it, \`&bassline\` its main argument; \`&bassLevel\` an optional parameter, its line its default (\`"bass_performer"(bassLevel=…)\`).
`,"performers/03-pad":`---
id: pad_performer
association:
  - point:
      sync: 0.3
      harm: 0.45
      artic: 0.55
      energy: 0.55
    weight: 1
    facet: performer
  - point:
      sync: 0.12
      harm: 0
      artic: 1
      energy: 0.8
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 0.55
      artic: 0.65
      energy: 0.65
    weight: 1
    facet: performer
  - point:
      sync: 0.05
      harm: 0.3
      artic: 0
      energy: 0.2
    weight: 1
    facet: performer
  - point:
      sync: 0.5
      harm: 0.75
      artic: 0.35
      energy: 0.5
    weight: 1
    facet: performer
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: performer
  - point:
      sync: 0.75
      harm: 0.85
      artic: 0.45
      energy: 0.45
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 1
      artic: 0.3
      energy: 0.6
    weight: 1
    facet: performer
source: seed
---

\`\`\`cells
&pad, &padOut from (&padLevel) &padline
&padV from pad
&padOut play=&padline level=&padLevel &padV
&pad map=role &padOut
&padLevel map=amp .8
\`\`\`

The pad player (decisions 058 and 061): a gate, \`&padOut\` (Jambot's section text's name for it), whose role is \`pad\` (\`&pad map=role &padOut\`), playing the part \`&padline\` on the \`pad\` instrument, at its register (\`&padV loop=C3\`, where Jambot's section text sounds its comp: \`PIN_VOICES.comp\`, yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b), so with no move.
Its two inputs are the score's (decision 065: the line its main parameter, the level an optional one, one level of .8 by default): \`&padline\`, the line, and \`&padLevel\`, its velocities as written, a line of levels or one level.

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`styles\`), at weight 1: every preset's section text plays this part the same way (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b: one voice, one register and one channel for all eight), so the eight share this one performer, and what a preset sounds like is its parts, not its players.

**Its signature** (decision 065): \`&pad, &padOut from (&padLevel) &padline\`. \`&pad from pad_performer &line\` takes a copy of it, \`&padline\` its main argument; \`&padLevel\` an optional parameter, its line its default (\`"pad_performer"(padLevel=…)\`).
`,"performers/04-stab":`---
id: stab_performer
association:
  - point:
      sync: 0.3
      harm: 0.45
      artic: 0.55
      energy: 0.55
    weight: 1
    facet: performer
  - point:
      sync: 0.12
      harm: 0
      artic: 1
      energy: 0.8
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 0.55
      artic: 0.65
      energy: 0.65
    weight: 1
    facet: performer
  - point:
      sync: 0.05
      harm: 0.3
      artic: 0
      energy: 0.2
    weight: 1
    facet: performer
  - point:
      sync: 0.5
      harm: 0.75
      artic: 0.35
      energy: 0.5
    weight: 1
    facet: performer
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: performer
  - point:
      sync: 0.75
      harm: 0.85
      artic: 0.45
      energy: 0.45
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 1
      artic: 0.3
      energy: 0.6
    weight: 1
    facet: performer
source: seed
---

\`\`\`cells
&stab, &stabOut from (&stabLevel) &stabline
&keysV from keys
&stabOut play=&stabline level=&stabLevel &keysV
&stab map=role &stabOut
&stabLevel map=amp .8
\`\`\`

The stab player (decisions 058 and 061): a gate, \`&stabOut\` (Jambot's section text's name for it), whose role is \`stab\` (\`&stab map=role &stabOut\`), playing the part \`&stabline\` on the \`keys\` instrument, at its register (\`&keysV loop=C3\`, where Jambot's section text sounds its comp: \`PIN_VOICES.comp\`, yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b), so with no move.
Its two inputs are the score's (decision 065: the line its main parameter, the level an optional one, one level of .8 by default): \`&stabline\`, the line, and \`&stabLevel\`, its velocities as written, a line of levels or one level. Jambot sends the pad and the stab on one channel, 3: the score's card puts both gates in one entry (\`[&padOut, &stabOut]\`).

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`styles\`), at weight 1: every preset's section text plays this part the same way (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b: one voice, one register and one channel for all eight), so the eight share this one performer, and what a preset sounds like is its parts, not its players.

**Its signature** (decision 065): \`&stab, &stabOut from (&stabLevel) &stabline\`. \`&stab from stab_performer &line\` takes a copy of it, \`&stabline\` its main argument; \`&stabLevel\` an optional parameter, its line its default (\`"stab_performer"(stabLevel=…)\`).
`,"performers/05-lead":`---
id: lead_performer
association:
  - point:
      sync: 0.3
      harm: 0.45
      artic: 0.55
      energy: 0.55
    weight: 1
    facet: performer
  - point:
      sync: 0.12
      harm: 0
      artic: 1
      energy: 0.8
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 0.55
      artic: 0.65
      energy: 0.65
    weight: 1
    facet: performer
  - point:
      sync: 0.05
      harm: 0.3
      artic: 0
      energy: 0.2
    weight: 1
    facet: performer
  - point:
      sync: 0.5
      harm: 0.75
      artic: 0.35
      energy: 0.5
    weight: 1
    facet: performer
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: performer
  - point:
      sync: 0.75
      harm: 0.85
      artic: 0.45
      energy: 0.45
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 1
      artic: 0.3
      energy: 0.6
    weight: 1
    facet: performer
source: seed
---

\`\`\`cells
&lead, &leadOut from (&leadLevel) &leadline
&leadV from lead
&leadOut play=&leadline level=&leadLevel &leadV
&lead map=role &leadOut
&leadLevel map=amp .8
\`\`\`

The lead player (decisions 058 and 061): a gate, \`&leadOut\` (Jambot's section text's name for it), whose role is \`lead\` (\`&lead map=role &leadOut\`), playing the part \`&leadline\` on the \`lead\` instrument, at its register (\`&leadV loop=C4\`, where Jambot's section text sounds its lead: \`PIN_VOICES.lead\`, yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b), so with no move.
Its two inputs are the score's (decision 065: the line its main parameter, the level an optional one, one level of .8 by default): \`&leadline\`, the line (degrees over the melodic scale or the key), and \`&leadLevel\`, its velocities as written, a line of levels or one level.

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`styles\`), at weight 1: every preset's section text plays this part the same way (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b: one voice, one register and one channel for all eight), so the eight share this one performer, and what a preset sounds like is its parts, not its players.

**Its signature** (decision 065): \`&lead, &leadOut from (&leadLevel) &leadline\`. \`&lead from lead_performer &line\` takes a copy of it, \`&leadline\` its main argument; \`&leadLevel\` an optional parameter, its line its default (\`"lead_performer"(leadLevel=…)\`).
`,"rhythms/01-synth-pop-drums":`---
id: synth_pop_drums
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
&groove [&kick, &backbeat, &fill, &ghost, &hat]
\`\`\`

Jambot's E31 bar for Synth-pop (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Synth-pop's point.
`,"rhythms/02-techno-drums":`---
id: techno_drums
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
&groove [&kick, &backbeat, &fill, &hat]
\`\`\`

Jambot's E31 bar for Techno (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Techno's point.
`,"rhythms/03-deep-house-drums":`---
id: deep_house_drums
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
&groove [&kick, &backbeat, &fill, &ghost, &hat]
\`\`\`

Jambot's E31 bar for Deep house (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Deep house's point.
`,"rhythms/04-ambient-drums":`---
id: ambient_drums
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
&groove [&kick, &backbeat, &fill, &hat]
\`\`\`

Jambot's E31 bar for Ambient (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Ambient's point.
`,"rhythms/05-lo-fi-hip-hop-drums":`---
id: lo_fi_hip_hop_drums
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
&groove [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]
\`\`\`

Jambot's E31 bar for Lo-fi hip hop (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Lo-fi hip hop's point. The rim's Euclid taps \`1m\`, and under a swung meter its strokes lean on the sixteenths the meter leans, as the band's rim does (#121).
`,"rhythms/06-funk-drums":`---
id: funk_drums
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
&groove [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]
\`\`\`

Jambot's E31 bar for Funk (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Funk's point. The rim's Euclid taps \`1m\`, and under a swung meter its strokes lean on the sixteenths the meter leans, as the band's rim does (#121).
`,"rhythms/07-bossa-nova-drums":`---
id: bossa_nova_drums
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
&groove [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]
\`\`\`

Jambot's E31 bar for Bossa nova (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Bossa nova's point.
`,"rhythms/08-swing-jazz-drums":`---
id: swing_jazz_drums
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
&groove [&kick, &backbeat, &fill, &ghost, &hat, &pedal]
\`\`\`

Jambot's E31 bar for Swing jazz (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Swing jazz's point.
`,"rhythms/09-son-clave-3-2":`---
id: son_clave_3_2
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
&percussion [&clave * .5]
\`\`\`

The son clave, 3-2: x..x..x. ..x.x... over two bars of eighths. It is where the bossa nova clave and Funk's Bo Diddley beat come from, and sits halfway between Bossa nova and Funk.

It is not maximally even: no phase of \`even(5, 16)\` is it (its gaps run from 2 to 4 eighths), which is what sets it apart from the bossa nova clave (\`even.test.ts\`).

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is a hole, a sound the General MIDI kit fills with the line this fragment used to carry word for word (decision 054, rung 2: #244). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.
`,"rhythms/10-son-clave-2-3":`---
id: son_clave_2_3
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
&percussion [&clave * .5]
\`\`\`

The son clave from its other bar, 2-3: it starts off the downbeat, so it sits a step from 3-2 toward Funk, more off the beat and plainer.

It is not maximally even: no phase of \`even(5, 16)\` is it (its gaps run from 2 to 4 eighths), which is what sets it apart from the bossa nova clave (\`even.test.ts\`).

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is a hole, a sound the General MIDI kit fills with the line this fragment used to carry word for word (decision 054, rung 2: #244). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.
`,"rhythms/11-rumba-clave-3-2":`---
id: rumba_clave_3_2
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
&percussion [&clave * .5]
\`\`\`

The rumba clave, 3-2: the son's third stroke an eighth later, off the beat; drums and voices over a static harmony, short and dense: near Funk.

It is not maximally even: no phase of \`even(5, 16)\` is it (its gaps run from 2 to 4 eighths), which is what sets it apart from the bossa nova clave (\`even.test.ts\`).

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is a hole, a sound the General MIDI kit fills with the line this fragment used to carry word for word (decision 054, rung 2: #244). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.
`,"rhythms/12-bossa-nova-clave":`---
id: bossa_nova_clave
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
&percussion [&clave * .5]
\`\`\`

The bossa nova clave: the son's last stroke an eighth later. Bossa nova's harmony and articulation, a little more off the beat and sparser than its drum bar: five strokes in two bars.

Its five strokes are \`even(5, 16, 2)\`, as even as five go over sixteen (here sixteen eighths over two bars): a maximally even necklace, as the cinquillo is over eight and the son and rumba claves are not (decision 072; \`even.test.ts\`).

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is a hole, a sound the General MIDI kit fills with the line this fragment used to carry word for word (decision 054, rung 2: #244). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.
`,"rhythms/13-bossa-nova-clave-one-bar":`---
id: bossa_nova_clave_one_bar
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
&percussion [&clave * .5]
\`\`\`

The bossa nova clave in one bar of sixteenths, x..x..x...x..x..: as dense as Bossa nova's drum bar, written in the same sixteenths, so at Bossa nova's energy; off the beat as the two-bar one. Which of the two fits a composition is the fit's to choose (#144), not the association's.

Its five strokes are \`even(5, 16, 2)\`, as even as five go over sixteen: a maximally even necklace, as the cinquillo is over eight and the son and rumba claves are not (decision 072; \`even.test.ts\`).

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is a hole, a sound the General MIDI kit fills with the line this fragment used to carry word for word (decision 054, rung 2: #244). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.
`,"rhythms/14-cinquillo":`---
id: cinquillo
association:
  - point:
      sync: 0.85
      harm: 0.6
      artic: 0.6
      energy: 0.6
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&clave step=16n &claves ~!3 &claves ~ &claves ~!3 &claves ~ &claves ~!3
&percussion [&clave * .5]
\`\`\`

The cinquillo, x.xx.xx. over one bar of eighths: the Cuban danzón's rhythm, the habanera's and the tresillo's kin, five strokes as even as five go over eight, \`even(5, 8, 2)\` (2 1 2 1 2; decision 072). The tresillo is its three, \`even(3, 8, 2)\`, and the bossa nova clave its five over sixteen, \`even(5, 16, 2)\`: one generator, three timelines (#507).
It is written out, as the claves are, and a test states the identity (\`rhythms.test.ts\`): a rhythm struck from \`even\` by its phase, each hit a step long, is #531's.

Where it sits: no preset is Cuban. It is placed by hand beside the son clave, which grew out of the danzón (off the beat, sync 0.85), a little more harmonic (the danzón's ballroom chords, harm 0.6), and denser than a two-bar clave, five strokes in one bar (energy 0.6).

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90), as the other claves: \`&claves\` is a hole the General MIDI kit fills (decision 054, rung 2: #244). Its other names (\`&clave\`, \`&percussion\`) are none of the drum bars', so it layers on any of them in one text.
`,"rhythms/15-electro-swing-drums":`---
id: electro_swing_drums
association:
  - point:
      sync: 0.55
      harm: 0.75
      artic: 0.6
      energy: 0.75
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/cells examples/electroswing.md @ 2c120d4
---

\`\`\`cells
&kick step=4n &bd!4
&clap step=4n ~ &cp:0:.6 ~ &cp:0:.6
&hats step=8n ~ &oh:0:.4 ~ &oh:0:.4 ~ &oh:0:.4 ~ &oh:0:.4
&ticks step=16n &hh:0:.2 &hh:0:.2? &hh:0:.2 &hh:0:.2?.7 &hh:0:.2 &hh:0:.2? &hh:0:.2 [&hh:0:.2,&sd:0:.03]
&groove [&kick, &clap, &hats, &ticks]
\`\`\`

The electro swing beat of [Electro swing, in pieces](../../examples/electroswing.md): house's four on the floor and its clap on two and four, under a jazz record's swung eighths, the open hat on every off-beat and a sixteenth hat with some strokes left to chance (\`?\`, keyed on the seed: decision 031) and a ghost of the snare on the last.
It holds no \`&bar\`, so the host's meter swings it: under \`meter(swing=8n:2/3)\` (or the example's lighter \`swing=8n:.64\`) the open hats fall late, the kick and the clap stay on the beat.
Its lines strike the kit's names (\`&bd\` \`&cp\` \`&oh\` \`&hh\` \`&sd\`), holes the General MIDI kit fills, and carry no card (#291): \`&groove\` is the mix, its levels in the hits.
A piece arranging it takes its limbs by name (\`&kick, &clap, &hats, &ticks from electro_swing_drums\`), as the example does, each under a level of its own.

At a point proposed for an Electro swing preset (sync .55, harm .75, artic .6, energy .75), weight 1: no preset of Jambot's sits there yet, and the axes are Jambot's (decision 041), so the point is this file's, Jambot's to adopt.
`,"rhythms/16-spooky-drums":"---\nid: spooky_drums\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.35\n    weight: 1\n    facet: rhythm\nsource: seed\n---\n\n```cells\n&kick step=16n &bd:0:.55 &bd:0:.3 ~ ~\n&hat step=4n &rd:0:.12\n&euclid step=1m [~ &rim]\n&groove [&kick, &hat, &euclid * .25]\n```\n\nA heartbeat, a clock and a knock: the beat of [Spooky, in pieces](../../examples/spooky.md).\nThe kick is a heartbeat on every beat, its second stroke a sixteenth after the first and softer (lub-dub); the ride ticks each beat, faint, a clock; the rim knocks once, at the middle of the bar, where the heart is between beats in a bar of an odd number of them.\nEvery line fits any meter and lands on its sixteenths: the kick and the ride cycle on a beat (`step=16n` four long, `step=4n` one long), and the rim halves the bar (`step=1m [~ &rim]`), and half of every bar the library's meters make is a whole number of sixteenths (6 in 3/4, 10 in 5/4, 7 in 7/8), so in 5/4 the heart beats five times and the knock falls between the third beat's strokes.\nA Euclid spread over the bar (`step=1m &rim(3,8)`, v0.12.0's) put the knocks between the sixteenths of any bar but 4/4's and 12/8's, where a reader on the bar's sixteenths, as Jambot's drummer is, can't play them; a line on eighths (`step=8n`) lands on them but laps a bar of 4/4, which the fit refuses under the other meters.\nIts lines are named by Jambot's drum roles (`kick`, `hat`, `euclid`) and strike only voices its kit holds (`&bd` 36, `&rd` 51, `&rim` 37), so the drummer plays it as it is; they strike the kit's names, holes the General MIDI kit fills, and carry no card (#291): `&groove` is the mix.\nWritten by hand for the point proposed for a Spooky preset (sync .2, harm .9, artic .3, energy .35; #349), weight 1: no preset of Jambot's sits there yet, and the axes are Jambot's (decision 041), so the point is this file's, Jambot's to adopt.\n","rhythms/17-ghost-drums":"---\nid: ghost_drums\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.9\n      artic: 0.3\n      energy: 0.25\n    weight: 1\n    facet: rhythm\nsource: seed\n---\n\n```cells\n&kick step=1m &bd:0:.45\n&hat step=4n &rd:0:.08\n&euclid step=1m [~ &rim]\n&groove [&kick, &hat, &euclid * .2]\n```\n\nAlmost no drums, as a ghost house has: one soft heartbeat at the head of the bar, a clock ticking each beat at the edge of hearing, and a knock at the middle of the bar.\nIt is `spooky_drums` thinned for a quieter, stiller point: the heart beats once a bar, not every beat, so the bar is mostly air.\nEvery line fits any meter and lands on its sixteenths, as `spooky_drums`' do: the kick and the rim on the bar and its half, the ride on the beat.\nIts lines are named by Jambot's drum roles (`kick`, `hat`, `euclid`) and strike only voices its kit holds (`&bd` 36, `&rd` 51, `&rim` 37); they carry no card (#291): `&groove` is the mix.\nNear Spooky's point (sync .2, harm .9, artic .3, energy .35; yggi/jambot#517), 0.1 lower in sync and energy, weight 1, as the facet `rhythm`.\n","rhythms/18-kinderlied-drums":`---
id: kinderlied_drums
association:
  - point:
      sync: 0.1
      harm: 0.12
      artic: 0.5
      energy: 0.35
    weight: 0.25
    facet: rhythm
source: seed
---

\`\`\`cells
&kick step=2n &bd:0:.5
&backbeat step=2n [~ &sd:0:.35]
&hat step=4n &hh:0:.18
&groove [&kick, &backbeat, &hat]
\`\`\`

The plainest beat there is, for a children's song: the kick on one and three, the snare on two and four, a closed hat on every beat, nothing off it.
The kick and the snare cycle on a half note and the hat on a beat, so in 4/4 it is one bar, and in 3/4 or 5/4 the kick and the snare take turns on the halves of each bar; it fits every meter of the library's.
Its lines are named by Jambot's drum roles (\`kick\`, \`backbeat\`, \`hat\`) and strike only voices its kit holds (\`&bd\` 36, \`&sd\` 38, \`&hh\` 42), so the drummer plays it as it is; they strike the kit's names, holes the General MIDI kit fills, and carry no card (#291): \`&groove\` is the mix.
Written by hand for the point proposed for a Kinderlied preset (\`KINDERLIED\`, \`styles\`: sync .1, harm .12, artic .5, energy .35), where Twinkle's and Hänschen klein's motifs sit; no preset of Jambot's sits there yet, and the axes are Jambot's (decision 041).
At weight 0.25, as the dark cadence is weighted down (#404): its distance counts four times, so a query finds it within Jambot's miss distance (0.3) only within 0.075 of its point, where a Kinderlied preset finds it at distance 0.
Its weight was chosen against cells' lock-in bound when it was absolute, points added (#533 made it relative, and whether the weight goes back to 1 is #544's): both bounds on lock-in over rhythms (\`lockin.slow.test.ts\`) sat at their edge without it, 4.99 points against 5 and a spread of 2.48 against 2.5, so a rhythm that the walk away from the presets finds and learns crosses one or the other: at weight 1 the share learning adds rose to 5.55 points; at 0.5, 0.4 and 0.3 it was 5.06, 5.02 and 4.98, the last with a spread of 2.52; at 0.25 4.95 and 2.46. Three beats near it (this one, a march and a swaying one) raised it to 5.98, so this one stands alone.
`,"stab/01-charleston-stabs":"---\nid: charleston_stabs\nassociation:\n  - point:\n      sync: 0.55\n      harm: 0.75\n      artic: 0.6\n      energy: 0.75\n    weight: 0.4\n    facet: stab\nsource: seed\nlifted: yggi/cells examples/electroswing.md @ 2c120d4\n---\n\n```cells\n&stabline from &harm\n&stabline step=8n cycle=4 &charleston!3 &push\n&charleston over=&harm step=8n [0,1,2] ~ ~ [0,1,2] ~@4\n&push over=&harm step=8n [0,1,2] ~ ~ [0,1,2] ~ [0,1,2] ~ &ahead\n&ahead over=&harm[>>] [1,2,3]\n```\n\nThe stabs of [Electro swing, in pieces](../../examples/electroswing.md): the Charleston, a chord on one and on the and of two, three bars, and a fourth that pushes: its last stab, on the and of four, is the next chord, its third and fifth with its root on top (`&ahead over=&harm[>>]`, as the funk bass anticipates with `&bassNext`).\nIt is the part the stab performer plays (`&stabline`, decision 058), the first of the facet `stab`, as the bass lines are the bass performer's: its chords are indices into the chord in force (`over=&harm`), so its holes are `&harm` and a meter, and its velocities are the performer's (`&stabLevel`).\n`&charleston`, `&push` and `&ahead` are its helpers: `use &stabline from charleston_stabs` takes them.\nIt is the example's line at the commit it was lifted from, but for that last stab, which there read the chord in force (the owner's review of #305).\n\nAt a point proposed for an Electro swing preset (sync .55, harm .75, artic .6, energy .75), weight 0.4, so no other preset finds it within Jambot's miss distance (0.3; at weight 1 it was the first stab of five, #404): no preset of Jambot's sits there yet, and the axes are Jambot's (decision 041), so the point is this file's, Jambot's to adopt.\n\n**Its signature** (decision 065): `&stabline from &harm`. `&stabline from charleston_stabs &harm` takes a copy of it, `&harm` its main argument.\n","styles/01-styles":`---
id: styles
association:
  - point:
      sync: 0.3
      harm: 0.45
      artic: 0.55
      energy: 0.55
    weight: 1
    facet: style
  - point:
      sync: 0.12
      harm: 0
      artic: 1
      energy: 0.8
    weight: 1
    facet: style
  - point:
      sync: 0.35
      harm: 0.55
      artic: 0.65
      energy: 0.65
    weight: 1
    facet: style
  - point:
      sync: 0.05
      harm: 0.3
      artic: 0
      energy: 0.2
    weight: 1
    facet: style
  - point:
      sync: 0.5
      harm: 0.75
      artic: 0.35
      energy: 0.5
    weight: 1
    facet: style
  - point:
      sync: 1
      harm: 0.12
      artic: 0.85
      energy: 0.75
    weight: 1
    facet: style
  - point:
      sync: 0.75
      harm: 0.85
      artic: 0.45
      energy: 0.45
    weight: 1
    facet: style
  - point:
      sync: 0.35
      harm: 1
      artic: 0.3
      energy: 0.6
    weight: 1
    facet: style
  - point:
      sync: 0.55
      harm: 0.75
      artic: 0.6
      energy: 0.75
    weight: 1
    facet: style
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.35
    weight: 1
    facet: style
  - point:
      sync: 0.1
      harm: 0.12
      artic: 0.5
      energy: 0.35
    weight: 1
    facet: style
source: seed
---

\`\`\`cells
&synthPop map=style label="Synth-pop" step=108bpm sync=.3 harm=.45 artic=.55 energy=.55
&techno map=style label="Techno" step=130bpm sync=.12 harm=0 artic=1 energy=.8
&deepHouse map=style label="Deep house" step=122bpm sync=.35 harm=.55 artic=.65 energy=.65
&ambient map=style label="Ambient" step=72bpm sync=.05 harm=.3 artic=0 energy=.2
&lofi map=style label="Lo-fi hip hop" step=84bpm sync=.5 harm=.75 artic=.35 energy=.5
&funk map=style label="Funk" step=104bpm sync=1 harm=.12 artic=.85 energy=.75
&bossaNova map=style label="Bossa nova" step=132bpm sync=.75 harm=.85 artic=.45 energy=.45
&swingJazz map=style label="Swing jazz" step=148bpm sync=.35 harm=1 artic=.3 energy=.6
&electroSwing map=style label="Electro swing" step=124bpm sync=.55 harm=.75 artic=.6 energy=.75
&spooky map=style label="Spooky" step=100bpm sync=.2 harm=.9 artic=.3 energy=.35
&kinderlied map=style label="Kinderlied" step=96bpm sync=.1 harm=.12 artic=.5 energy=.35
\`\`\`

The library of styles (decision 063 §3, #391, #537): the eleven preset styles, each a \`map=style\` cell at its point, its axes by name (cells' table of axes, \`AXES\`), its display name its \`label=\` and its default tempo its \`step=\`. They are Jambot's eight from the prototype, then Electro swing and Spooky (#349), then Kinderlied (yggi/jambot#547), whose 96 bpm is Twinkle's.

This file is the presets' one source: \`STYLES\` (\`src/repository/styles.ts\`) reads each as \`{ id, name, point, tempo }\`, in this order, and a frontend takes its presets from there. Only the library reads the \`step=\`: \`style=\` and a query read the point, so a style has no tempo (decision 037, D6).

A score names its section's style by one of them where the section sits exactly on it, and by its numbers or a mix of them where it doesn't:

\`\`\`text
&funk from styles
&style label="Funk" style=&funk
\`\`\`

The default band reads the style through \`&style\` (\`band\`: its bass's and its lead's cutoff), and so does its choice of instruments (\`resolveBand\`): Spooky's, named, plays the round bass, the organ, the celesta and the theremin, as its numbers do.

The points were lifted from yggi/jambot \`packages/engine/src/style.ts\` @ 7b078e8, with their tempos @ dcc414d. Associated once at each of them, as the facet \`style\`, at weight 1: the style nearest a point is a query (\`{ facet: 'style' }\`), and a test holds the association to the cells' points.
`};function bp(){let e=vp(yp);if(`problems`in e)throw Error(`The seed library doesn't read: ${e.problems.join(`; `)}`);return e.files}let xp=bp(),Sp=e=>vs(e.fragment),Cp=e=>xp.filter(t=>t.path.startsWith(`${e}/`)).flatMap(Sp),wp=Cp(`styles`);function Tp(e){let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];if(e.map?.kind!==`style`||t.length!==Ft.length||!t.every(Number.isFinite))throw Error(`styles: &${e.name} is not a style cell with a value on each axis`);if(!e.label)throw Error(`styles: &${e.name} has no label=, its display name`);if(e.step?.kind!==`rate`)throw Error(`styles: &${e.name} has no step= in bpm, its default tempo`);return{id:e.name,name:e.label,point:Object.fromEntries(Ft.map((e,n)=>[e,t[n]])),tempo:Math.round(e.step.perSecond*60*1e9)/1e9}}let Ep=Ro(wp.find(e=>e.id===`styles`).text).cells.map(Tp);function Dp(e){let t=Ep.find(t=>t.id===e);if(!t)throw Error(`styles: no style ${e} (there are ${Ep.map(e=>e.id).join(`, `)})`);return t.point}Dp(`synthPop`),Dp(`techno`),Dp(`deepHouse`),Dp(`ambient`),Dp(`lofi`),Dp(`funk`),Dp(`bossaNova`),Dp(`swingJazz`),Dp(`electroSwing`),Dp(`spooky`),Dp(`kinderlied`);let Op=[`drums`,`bass`,`pad`,`stab`,`lead`],kp=[`kick`,`backbeat`,`fill`,`ghost`,`hat`,`pedal`,`euclid`,`clave`],Ap=ge[`4/4`],jp=ye(Ap).cycle,Mp=e=>2*Math.floor(e/4),Np=e=>2*Math.floor(e*3/8),Pp=(e,t)=>e.cycle===t.cycle&&e.heights.length===t.heights.length&&e.heights.every((e,n)=>e===t.heights[n]);function Fp(n){if(n.length===0)throw Error(`clockOf: a song needs a meter`);let r=[];for(let{bar:e,meter:t}of[...n].sort((e,t)=>e.bar-t.bar)){if(t.heights[0]!==0)throw Error(`clockOf: a meter starts on its downbeat`);let n=ye(t),i=r.at(-1),a=i?e-i.bar:e;r.push({bar:e,step:i?i.step+a*i.helix.cycle:a*n.cycle,beat:i?i.beat+a*i.beats:a*n.heights.length,helix:n,beats:n.heights.length})}let i=(e,t)=>r.findLast(n=>e(n)<=t)??r[0],a=e=>{let t=i(e=>e.bar,e);return t.step+(e-t.bar)*t.helix.cycle},o=e=>{let n=i(e=>e.step,e);return n.bar+Math.floor(t(n.helix,e-n.step)/n.beats)},s=e=>{let n=i(e=>e.step,e);return n.beat+t(n.helix,e-n.step)},c=t=>{let n=i(e=>e.beat,t);return n.step+e(n.helix,t-n.beat)};return{barAt:o,barStart:a,barSteps:e=>i(e=>e.bar,e).helix.cycle,stepInBar:e=>e-a(o(e)),beatAt:s,beatStart:c,beatInBar:e=>{let n=i(e=>e.step,e);return u(t(n.helix,e-n.step),n.beats)},onBeat:e=>c(s(e))===e}}let{barAt:Ip,barStart:Lp,stepInBar:Rp,beatAt:zp,beatStart:Bp,beatInBar:Vp,onBeat:Hp}=Fp([{bar:0,meter:Ap}]),Up={min:0,max:1,space:`linear`};function Wp(e){let t=R.find(t=>t.name===e);if(!t)throw Error(`cells' table of axes has no ${e}`);return{min:t.range[0],max:t.range[1],space:`linear`}}let Gp=(()=>{let e=R.map(e=>e.name),t=[`sync`,`harm`,`artic`,`energy`];if(e.length!==t.length||e.some((e,n)=>e!==t[n]))throw Error(`cells' table of axes is ${e.join(` `)}; Jambot reads ${t.join(` `)} (style.ts)`);return t})();Object.fromEntries(Gp.map(e=>{let t=R.find(t=>t.name===e);return[e,{label:t.label,ends:t.ends}]}));let Kp={sync:Wp(`sync`),harm:Wp(`harm`),artic:Wp(`artic`),energy:Wp(`energy`),entropy:Up,bpm:{min:60,max:180,space:`log`}},qp=Object.keys(Kp),Jp=Ep.map(e=>({id:e.id,name:e.name,style:{...Object.fromEntries(Gp.map(t=>[t,e.point[t]])),bpm:e.tempo}}));[`synthPop`,`techno`,`deepHouse`,`ambient`,`lofi`,`funk`,`bossaNova`,`swingJazz`].map(e=>{let t=Jp.find(t=>t.id===e);if(!t)throw Error(`cells' library of styles has no ${e}`);return t}),Lp(8),Lp(1),{...Jp[0].style};function Yp(e){let t=1e3;return Object.fromEntries(qp.map(n=>[n,Math.round(e[n]*t)/t]))}let Xp=Gp,Zp=e=>Object.fromEntries(Xp.map(t=>[t,e[t]]));function Qp(e,t,n,r,i=[],a){let{miss:o,hold:s}=e.margins??{miss:.3,hold:.02},c=a===void 0?e.query(Zp(t),r,...i.length?[i]:[]):e.query(Zp(t),r,i,a),l=c[0];if(!l||l.distance>o)return null;let u=n===null?void 0:c.find(e=>e.id===n),d=u&&u.distance<=o&&u.distance-l.distance<=s?u.id:l.id;return e.fragments.get(d)}let $p=[],em=e=>_t(.2*Math.min(1,Math.max(0,1-e))),tm=[`fill`],nm=e=>Math.floor(e/3),rm={},im=(e,{rhythmFragment:t,claveFragment:n})=>t===void 0||n===void 0||n in e?e:{...e,[n]:t};function am(e,t=rm){let n=e.filter(e=>e.rejected).flatMap(e=>e.grooves);return[...n,...Object.keys(t).filter(e=>n.includes(t[e]))]}function om(e,t){let n=t=>{let n=e.filed.find(e=>e.fragment.id===t)?.meta.varies;return typeof n==`string`?n:void 0},r=e=>{let t=/* @__PURE__ */ new Set([e]),r=e;for(let e=n(r);e!==void 0&&!t.has(e);e=n(r))t.add(e),r=e;return r},i=r(t),a=e.filed.map(e=>e.fragment.id).filter(e=>r(e)===i),o=a.includes(i)?a:[i,...a];return o.includes(t)?o:[t]}function sm(e,t){let n=e.find(e=>e.grooves.some(e=>t.includes(e)));return n?{...n,grooves:[...n.grooves,...t.filter(e=>!n.grooves.includes(e))]}:{grooves:[...t],boredom:0,rejected:!1}}function cm({grooves:e,boredom:t}){let n=nm(t);return n>=1&&n<2&&e.length-1<n}function lm(e,t,n){let r=_t(n),i=e=>t.some(t=>e.grooves.some(e=>t.grooves.includes(e)));return[...e.filter(e=>!i(e)).map(e=>({...e,boredom:e.boredom-r})).filter(e=>e.boredom>0),...t.map(({grooves:e,boredom:t})=>{let n=t+r;return{grooves:e,boredom:n,rejected:nm(n)>=2}})]}let um={miss:.3,hold:.02},dm=e=>e.margins??um;function fm(e,t,n,r,i=0){let a=e[0],o=t===void 0?void 0:e.find(e=>e.id===t);return o&&o.distance<=n+i&&o.distance-a.distance<=r?o.id:a&&a.distance<=n?a.id:void 0}function pm(e,t,n,r,i,a,o=[],s=[],c){let{miss:l,hold:u}=dm(e);return fm(e.query(t,n,a,o,l,c).filter(e=>e.distance<=l&&!s.includes(e.id)).filter(t=>i(e.read(t.id,n.meter,a),t.id)),r,l,u)}let mm=(e,t,n)=>e.filed.filter(e=>e.fragment.association.some(e=>e.facet===t)).findIndex(e=>e.fragment.id===n);function hm(e,t,n,r,i,a,o,s){if(!e||o===void 0)return{id:o,layer:i,playing:null};let c=i.filed.some(e=>e.fragment.id===o);if(!c&&!e.file)return{id:o,layer:i,playing:null};let l=sm(a,om(i,o)),u=cm(l)&&e.file&&e.vary?e.read(o,s.meter,i):null;if(!u||u.bars!==1)return{id:o,layer:i,playing:l};let d=c?mm(i,t,o):-1,f=d===-1?ft(o):d,p=e.vary(o,s,I(r.seed,n,f),i);if(!p)return{id:o,layer:i,playing:l};let{by:m,...h}=p,g=e.file(i,{...h,bench:s,point:r.point,source:`composer`,created:`song ${r.seed}, bar ${r.index*8}`,tags:r.tags,varies:o,by:m}),_=l.grooves.includes(g.id)?l.grooves:[...l.grooves,g.id];return{id:g.id,layer:g.layer,playing:{...l,grooves:_}}}function gm(e,t,n,r,i,a){if(!e?.file)return{layer:a,ids:[]};let o=a,s=[];for(let{source:a,bars:c}of t){let t=n(c);if(!t)continue;let l=e.file(o,{...t,bench:r,point:i.point,source:a,created:`song ${i.seed}, bar ${i.index*8}`,tags:i.tags});o=l.layer,s.includes(l.id)||s.push(l.id)}return{layer:o,ids:s}}function _m(e,t,n,r,i){let a=n.filter(e=>e!==void 0);return a.length&&e?.used?e.used(t,a,r,i===void 0?[]:[i]):t}function vm(e,t){return{played:n=>t.played(e.played(n)),written:n=>e.written(t.written(n))}}let ym=e=>Math.max(0,Math.min(1,e)),bm=1.5,xm=e=>.5+e/6,Sm=e=>(e-.5)*6,Cm=e=>Math.max(-1.5,Math.min(bm,e));function wm({sixteenth:e,eighth:t},n=ge[`4/4`]){return vm(Mm(2,Cm(e)),Nm(ye(n),Cm(t)))}let Tm=[`8n`,`16n`],Em={level:`16n`,share:.5};xm(bm);function Dm({level:e,share:t}){let n=Sm(t);return e===`8n`?{sixteenth:0,eighth:n}:{sixteenth:n,eighth:0}}let Om=e=>ym(Dm(e).eighth),km=e=>ym(Sm(e.share)*(e.level===`8n`?1:.5));function Am({level:e,share:t}){return{level:e,share:{from:t,to:t,start:0,length:0,slope:0,brake:0}}}function jm(e,t,n,r){return e<t?e*n/t:n+(e-t)*(r-n)/(r-t)}function Mm(e,t){let n=e/2,r=n+t*e/6,i=(t,n,r)=>{let i=Math.floor(t/e)*e;return i+jm(t-i,n,r,e)};return{played:e=>i(e,n,r),written:e=>i(e,r,n)}}function Nm(n,r){let i=2+r*4/6,a=(r,i,a)=>{let o=t(n,r),s=e(n,o),c=e(n,o+1)-s;return c===4?s+jm(r-s,i,a,c):r};return{played:e=>a(e,2,i),written:e=>a(e,i,2)}}let Pm=`bass`;function Fm(e,t,n){let r=ye(t).heights;for(let t=0;t<e.bars;t++)if([...new Set(e.notes.filter(e=>e.step>=t*n&&e.step<(t+1)*n).map(e=>e.step-t*n))].sort((e,t)=>e-t).join()!==r.join())return!1;return!0}function Im(e,t,n,r,i,a,o,s=[],c=[],l){let u=Om(r)>0;return pm(e,Zp(t),n,a,e=>e!==null&&(u||!Fm(e,n.meter,i)),o,s,c,l)}function Lm(e,t,n,r,i,a){let o=t===void 0?null:e.read(t,n,a);if(!o)return[];let s=r%o.bars;return o.notes.filter(e=>Math.floor(e.step/i)===s).map(e=>({...e,step:e.step-s*i}))}function Rm(t,n,r,i){let a=Tt(n,t.step),o=[...n.filter(e=>e.slot.step>a.slot.step),...r],s=w((t.chord===0?a:o[t.chord-1]??o.at(-1)??a).chord),c=Math.floor(t.index/s.length),l=s[t.index-c*s.length]+12*c;if(t.alter===0)return l+t.shift;let u=ot(i),d=Ke(u,l);return(d?e(u,d.degree+t.alter)+d.accidental*1:l+t.alter)+t.shift}function zm(e,t,n=`cycle`,r=0){let i=t.heights.length,a=c(t),o=Array.from({length:F(t)},()=>0),s=(n,r)=>{let i=Math.floor(n%4/2),s=t.heights[r]*2+i%a[r]*2+n%2;o[s]=Math.max(o[s],e[n])};for(let t=0;t<e.length;t++){if(e[t]===0)continue;let a=Math.floor(t/4);if(n===`fold`)s(t,a%i);else for(let e=0;e<i;e++)a===(e===0?0:(r*i+e)%4)&&s(t,e)}return o}let Bm=[33,57],Vm=[33,52],Hm=[1,0,0,.7,0,0,.8,.4,0,0,.7,.5,0,.3,.8,0],Um=[`root`,`pump`,`eight`,`funk`,`walk`];function Wm(e,t=0){let n=F(e),r=ye(e).heights,i=Se(e),a=e=>r.length>=4&&e%2==0&&i[e/2]===`half`,o=e=>Array.from({length:n},(t,n)=>e(n)),s=new Set(r.map(e=>e+2)),c=new Set(r);return{root:o(e=>e===0?1:a(e)?.6:0),pump:o(e=>+!!s.has(e)),eight:o(e=>e%2==0?e===0?1:a(e)?.9:.8:0),funk:zm(Hm,e,`cycle`,t),walk:o(e=>+!!c.has(e))}}let Gm=[`bassHit`,`bassVariation`],Km={hit:0,anticipate:1},qm={approach:0,walkTone:1,ornament:2},Jm=e=>Math.max(0,Math.min(1,e));function Ym(e,t,n){let r=Om(t),i=r*Jm(e.harm*1.5),a=e.sync*(1-i);return{root:.35,pump:(1-e.harm)*e.artic*(1-r)*(1-e.sync),eight:n*.6*(1-i)*(1-a),funk:a,walk:i}}let Xm=e=>e.helix.heights[0],Zm=e=>e.helix.heights.map(t=>t-Xm(e));function Qm(e,t){let n=40,r=1/0;for(let a=Vm[0];a<=Vm[1];a++)i(a,12)===i(e,12)&&Math.abs(a-t)<r&&(r=Math.abs(a-t),n=a);return n}function $m(e,t,n=[]){let{seed:r,bar:a,plan:o,style:s,barEnergy:c,next:l,meter:u}=e,d=o.section.index,f=[],p=F(u),m=ye(u).heights,h=e=>m.includes(e),g=wt(e.chords,u),_=e=>g.some(t=>t.slot.step===e),v=e=>g.find(t=>t.slot.step>e)??l[0]??Tt(g,e);if(o.section.type===`breakdown`)return g.forEach((e,n)=>{let r=g[n+1]?.slot.step??p;t=Qm(Xm(e.chord),t),f.push({part:`bass`,step:e.slot.step,note:t,length:r-e.slot.step})}),{carried:t,output:f};let y=Ym(s,e.swing,c),b=Object.values(y).reduce((e,t)=>e+t,0),x=.55+.6*c,S=(t,n)=>ht(r,Gm,t,d,a,n,s.entropy,e.restless),C=Wm(u,a),w=[],T=[],E=/* @__PURE__ */ new Set;for(let e=0;e<p;e++){let t=0;for(let n of Um)t+=y[n]*C[n][e];t/=b,T.push(t);let n=_(e)&&y.pump<.45||y.walk>.5&&h(e);n&&E.add(e),(n||L(S(Km.hit,e),t*x))&&w.push(e)}w.length===0&&w.push(0);let D=eh(w,n,E,T);return D.forEach(({step:e,from:n},c)=>{let u=Tt(g,e).chord,b=D[c+1]?.step??p,x=y.walk>.5&&h(e),C=Xm(u),w=!1;if(n){if(C=Rm(n,g,l,o.key),!x&&!_(e)){let t=I(r,`bassNote`,qm.ornament,d,e);w=t>=.55&&t<.8}}else if(x){let t=m.find(t=>t>e)??p,n=t>=p,i=n||_(t),o=n?l[0]?.chord??u:Tt(g,t).chord;if(_(e))C=Xm(u);else if(i)C=Xm(o)+(L(I(r,`bassNote`,qm.approach,a,e),.5)?-1:1);else{let[,t,n,i]=Zm(u),o=[t,n,i??n];C=Xm(u)+o[Math.floor(I(r,`bassNote`,qm.walkTone,a,e)*3)]}}else if(!_(e)){let t=v(e).chord;if(e>=p-3&&i(Xm(t)-Xm(u),12)!==0&&L(S(Km.anticipate,e),s.sync*.9))C=Xm(t);else{let t=I(r,`bassNote`,qm.ornament,d,e);t>=.55&&t<.8?w=!0:t>=.8&&(C=Xm(u)+Zm(u)[2])}}t=Qm(C,t),f.push({part:`bass`,step:e,note:w&&t+12<=Bm[1]?t+12:t,length:b-e})}),{carried:t,output:f}}function eh(e,t,n,r){if(!t.length)return e.map(e=>({step:e,from:null}));let i=[...t].sort((e,t)=>e.step-t.step),a=i.filter((e,t)=>i.findIndex(t=>t.step===e.step)===t).slice(0,e.length).map(e=>({step:e.step,from:e})),o=new Set(a.map(e=>e.step)),s=e.filter(e=>!o.has(e)).sort((e,t)=>Number(n.has(t))-Number(n.has(e))||r[t]-r[e]||e-t).slice(0,e.length-a.length).map(e=>({step:e,from:null}));return[...a,...s].sort((e,t)=>e.step-t.step)}let th={initial:40,advance:(e,t)=>$m(e,t)},nh=[50,79],rh=[50,63],ih=[0,0,.9,0,0,0,.9,.3,0,0,.9,0,.3,0,.9,.3],ah=[`compHit`,`compVariation`],oh={pad:0,stab:1},sh=(e,t,n)=>e+(t-e)*n;function ch(e,t){let n=(e,t)=>Math.min(...t.map(t=>Math.abs(e-t)));return t.reduce((t,r)=>t+n(r,e),0)+.5*e.reduce((e,r)=>e+n(r,t),0)}function lh(e,t){let n=w(e),r=(n.length>=5?n.filter((e,t)=>t!==2):n).map(e=>i(e,12)),a=e=>e.reduce((e,t)=>e+t,0)/e.length,o=null,s=1/0;for(let e=0;e<r.length;e++){let n=[...r.slice(e),...r.slice(0,e)];for(let e=rh[0];e<=rh[1];e++){if(i(e,12)!==n[0])continue;let r=[e];for(let e of n.slice(1)){let t=r.at(-1)+1;for(;i(t,12)!==e;)t++;r.push(t)}if(r.at(-1)>nh[1])continue;let c=t?ch(t,r):Math.abs(a(r)-62);c<s&&(s=c,o=r)}}return o??r.map(e=>60+e)}let uh=(e,t)=>w(e).join()===w(t).join(),dh={initial:null,advance(e,t){let{seed:n,bar:r,plan:i,style:a,barEnergy:o,next:s,meter:c}=e,l=Om(e.swing),u=F(c),d=ye(c).heights,f=Se(c),p=wt(e.chords,c),m=Array.from({length:u},(e,t)=>t===0?1:d.includes(t)?f[t/2]===`half`&&d.length>=4?.9:.5:0),h=zm(ih,c,`cycle`,r),g=i.section.type===`breakdown`||o<.3,_=g?Math.max(.85,1-a.artic):1-a.artic,v=g?0:(.35+.65*o)*(1-.45*l)*a.artic*1.4,y=(t,o)=>ht(n,ah,t,i.section.index,r,o,a.entropy,e.restless),b=t,x=p.map(e=>b=lh(e.chord,b)),S=[],C=/* @__PURE__ */ new Set;p.forEach((e,t)=>{let n=e.slot.step;if(!L(y(oh.pad,n),_*1.15))return;C.add(n);let r=p[t+1]?.slot.step??u;for(let e of x[t])S.push({part:`pad`,step:n,note:e,length:r-n})});for(let e=0;e<u;e++){if(C.has(e))continue;let t=sh(m[e],h[e],a.sync)*v;if(!L(y(oh.stab,e),t))continue;let n=p.indexOf(Tt(p,e)),r=x[n],i=s[0];e>=u-2&&a.sync>.5&&i&&!uh(i.chord,p[n].chord)&&(r=lh(i.chord,b));for(let t of r)S.push({part:`stab`,step:e,note:t,length:1})}return{carried:b,output:S}}},fh=[60,86];function ph(e,t,n,r,i,a=e.map(()=>0),o,s=!1){let c=e[0]>0;return{cycle:i,onsets:c?[0,...e]:[...e],degrees:c?[null,...t]:[...t],accidentals:[...c?[0]:[],...a],sync:n,energy:r,...o===void 0?{}:{fragment:o},...s?{keyed:s}:{}}}function mh(e){let t=e.degrees.flatMap((e,t)=>e===null?[]:[t]);return{steps:t.map(t=>e.onsets[t]),degrees:t.map(t=>e.degrees[t]),accidentals:t.map(t=>e.accidentals[t]??0)}}function hh(e,t,n){let{cycle:r,onsets:i,degrees:a,accidentals:o,accents:s}=e,c=n*t%r,l=[];for(let e=0;e*r<c+t;e++)i.forEach((n,i)=>{let a=e*r+n-c;a>=0&&a<t&&l.push({at:a,i})});let u=l.length>0&&l[0].at>0;return{cycle:t,onsets:[...u?[0]:[],...l.map(e=>e.at)],degrees:[...u?[null]:[],...l.map(e=>a[e.i])],accidentals:[...u?[0]:[],...l.map(e=>o[e.i])],...s?{accents:[...u?[0]:[],...l.map(e=>s[e.i])]}:{}}}let gh=[.5,.2,.4,.8,.2,.4,.8,.5,.3,.2,.8,.6,.2,.4,.9,.4];function _h(e){let t=new Set(ye(e).heights),n=Se(e);return Array.from({length:F(e)},(e,r)=>r%2==0?r===0?1:t.has(r)?n[r/2]===`half`&&t.size>=4?.9:.8:.4:t.has(r-1)?.1:.15)}let vh=[e=>Math.sin(Math.PI*e),e=>-e,e=>e,e=>Math.sin(2*Math.PI*e)*.6],yh=(e,t,n)=>e+(t-e)*n;function bh(e,t){return e<.25?ye(t).heights:e<.6?[0,Mp(F(t))]:[0]}function xh({style:e,swing:t,barEnergy:n,chords:r,plan:i,meter:a}){let s=F(a),c=new Set(ye(a).heights),l=wt(r,a);return{density:.25+.5*n,grooveMix:e.sync,pickups:Array.from({length:s},(e,n)=>n%2==0&&!c.has(n)?.3*km(t):0),pulse:o(d(Math.round(3+5*n),s,Math.round(e.sync*3))),scale:ct(i.key,i.melodic),span:2+Math.round((n+e.entropy)*3),contours:[1+(1-e.harm)*(1-e.entropy),1,1,.25+1.5*e.harm],turn:.2+.3*e.entropy,leap:e.entropy>.5?e.entropy-.5:0,variations:[.3,.25,.25,.2],nudge:e.entropy*.5,snap:Array.from({length:s},(e,t)=>t).filter(t=>bh(e.harm,a).includes(t)||l.some(e=>e.slot.step===t)),range:fh}}function Sh(e){let{seed:t,plan:n,style:r,barEnergy:i,barInSection:a,meter:o,bar:s}=e,{density:c,grooveMix:l,pickups:u,pulse:d,span:f,contours:p,turn:m,leap:h}=xh(e),g=F(o),_=_h(o),v=zm(gh,o,`cycle`,s),y=n.section.index,b=a>>2,x=0,S=()=>I(t,`leadShape`,y,b,x++),C=new Set(d),w=[];for(let e=0;e<g;e++){let n=Math.min(1,yh(_[e],v[e],l)*c+u[e]),r=yh(n,C.has(e)?.9:0,.5);L(I(t,`leadRhythm`,y,b,e),r)&&w.push(e)}for(let e of[0,Mp(g),...ye(o).heights,2,4,6]){if(w.length>=3)break;!w.includes(e)&&e<g&&w.push(e)}w.sort((e,t)=>e-t);let T=vh[vt(S(),p)],E=[0],D=0;for(let e=1;e<w.length;e++){let t=Math.round(_t(T(e/Math.max(1,w.length-1))*f)),n=E[e-1],r=Math.sign(t-n)*(Math.abs(t-n)>2?2:1);Math.abs(D)>=3?r=-Math.sign(D):L(S(),m)&&(r+=L(S(),.5)?-1:1),h>0&&L(S(),h)&&(r+=L(S(),.5)?-3:3),E.push(n+r),D=r}return ph(w,E,r.sync,i,g)}function Ch(e,t){let{seed:n,bar:r}=t,{variations:i,nudge:a}=xh(t),o=0,s=()=>I(n,`leadVariation`,r,o++),c=mh(e),{degrees:l,accidentals:u}=c,d=c.steps,f=vt(s(),i);if(f===0)l=l.map(e=>-e),u=u.map(e=>e===0?0:-e);else if(f===1)l=l.map(e=>e+2);else if(f===2){let e=l.length-1;e>0&&(l[e]=l[e-1]+(L(s(),.5)?-1:1)*(1+vt(s(),[1,1])),u[e]=0)}else d.length>2&&(d.pop(),l.pop(),u.pop());if(L(s(),a)&&d.length>1){let e=1+vt(s(),d.slice(1).map(()=>1));l[e]+=L(s(),.5)?-1:1}return ph(d,l,e.sync,e.energy,e.cycle,u,e.fragment,e.keyed)}let wh=(e,t)=>Th(w(e).map(e=>i(e,12)),t);function Th(e,t){for(let n=0;n<=6;n++)for(let r of[t-n,t+n])if(e.includes(i(r,12)))return r;return t}function Eh(e,[t,n],r=!1,i=[]){let a=r=>[...e,...i].filter(e=>e+r>=t&&e+r<=n).length,o=0;for(let e=-4;e<=4&&!r;e++){let t=12*e,n=a(t)-a(o);(n>0||n===0&&Math.abs(t)<Math.abs(o))&&(o=t)}return{notes:e.map(e=>{let r=e+o;for(;r>n;)r-=12;for(;r<t;)r+=12;return r}),octaves:o/12}}function Dh(e,t){return t<.4||e===`breakdown`||e===`intro`}function Oh(e,t,n,r){if(r!==1&&r!==3)return e;let a=w(Tt(n,t).chord),o=r===3?[a[0]]:[a[1],a[2]];return[...e.slice(0,-1),Th(o.map(e=>i(e,12)),e.at(-1))]}function kh(e,t,n){return e.map(({step:e,note:r})=>n.includes(e)?wh(Tt(t,e).chord,r):r)}function Ah(e,t,n,i,a,o=[],s=!1){let{plan:c,barInSection:l,meter:u,bar:d}=t,f=wt(t.chords,u),p=F(u),m=xh(t),{onsets:h,degrees:g,accidentals:_,accents:v}=hh(e,p,d),y=i?m.scale:ot(c.key),b=h.flatMap((e,t)=>g[t]===null?[]:[{step:e,i:t}]);if(b.length===0)return{written:[],last:n,anchor:a??null};let x=a??(s?jh(y,g[b[0].i],_[b[0].i],n):r(y,wh(Tt(f,b[0].step).chord,n))),S=b.map(({step:e,i:t})=>({step:e,note:Ge(y,x+g[t],_[t])})),C=i?kh(S,f,m.snap):S.map(e=>e.note),w=o.flatMap(e=>e.degrees.flatMap((t,n)=>t===null?[]:[Ge(y,x+t,e.accidentals[n]??0)])),T=Eh(Oh(C,b.at(-1).step,f,l%4),m.range,a!==void 0,w);return C=T.notes,{written:b.map(({step:e,i:t},n)=>({part:`lead`,step:e,note:C[n],length:(h[t+1]??p)-e,...i?{}:{accent:v?.[t]??0}})),last:C.at(-1),anchor:x+T.octaves*y.heights.length}}function jh(e,t,n,i){let a=e.heights.length,o=r=>Ge(e,r*a+t,n),s=Math.floor((r(e,i)-t)/a);return[s-1,s,s+1].reduce((e,t)=>Math.abs(o(t)-i)<Math.abs(o(e)-i)?t:e)*a}function Mh(e,t,n=null,r,i=!1){let{plan:a,style:o,barEnergy:s,barInSection:c,offer:l}=e;if(l){let{written:n,last:r}=Ah(l.motif,e,t.last,!1);return{carried:{...t,last:r,phrase:null,form:null,anchor:null,offered:l.bar},output:n}}let{section:u,theme:d}=a;if(Dh(u.type,s))return{carried:{...t,phrase:null,form:null,anchor:null,offered:null},output:[]};let f=n===null?[]:`cycle`in n?[n]:n,p=c%4,{phrase:m,melodies:h}=t,g=t.form??null,_,v=p===0||!m;if(v){let t=h[d.kind],n=t&&t.theme===d.index&&Math.abs(t.shape.sync-o.sync)<.25&&Math.abs(t.shape.energy-s)<.3;if(g=null,f.length){let e=f.map(e=>{let{steps:t,degrees:n,accidentals:a}=mh({...e,sync:0,energy:0});return ph(t,n,o.sync,s,e.cycle,a,r,i)});_=e[0],e.length>1&&(g=e)}else n?_=t.shape:(_=Sh(e),h={...h,[d.kind]:{theme:d.index,shape:_}});m=_}else _=m;let y=g?p%g.length:0;g?(_=g[y],!v&&p>=g.length&&y===g.length-1&&(_=Ch(_,e))):!v&&p%2==1&&(_=Ch(m,e));let b=g&&y>0?t.anchor??void 0:void 0,x=Ah(_,e,t.last,_.fragment===void 0,b,g&&y===0?g.slice(1):[],_.keyed===!0);return{carried:{last:x.last,phrase:m,melodies:h,offered:null,form:g,anchor:g?y===0?x.anchor:t.anchor??x.anchor:null},output:x.written}}function Nh(e){if(e.offer||Dh(e.plan.section.type,e.barEnergy))return[];let t=Sh(e);return Ah(e.barInSection%4%2==0?t:Ch(t,e),e,69,!0).written}let Ph={initial:{last:69,phrase:null,melodies:{},offered:null,form:null,anchor:null},advance:(e,t)=>Mh(e,t)},Fh={cents:.5,db:.1,seconds:25e-5,silent:1e-5},Ih=2**(Fh.cents/1200)-1,Lh=(e,t)=>e===t||Math.abs(e-t)<=Fh.seconds+Ih*Math.max(Math.abs(e),Math.abs(t));function Rh(e,t){if(typeof e==`number`&&typeof t==`number`)return Lh(e,t);if(e===null||t===null||typeof e!=`object`||typeof t!=`object`)return e===t;if(Array.isArray(e)!==Array.isArray(t))return!1;let n=Object.keys(e).filter(t=>e[t]!==void 0),r=Object.keys(t).filter(e=>t[e]!==void 0);return n.length===r.length&&n.every(n=>Rh(e[n],t[n]))}let zh=(e,t)=>e===t||e>0&&t>0&&Math.abs(1200*Math.log2(e/t))<=Fh.cents,Bh=(e,t)=>Math.abs(e)<Fh.silent?Math.abs(t)<Fh.silent:Math.abs(t)>=Fh.silent&&Math.sign(e)===Math.sign(t)&&Math.abs(20*Math.log10(e/t))<=Fh.db,Vh=/* @__PURE__ */ new Set([`white`,`pink`,`brown`]),Hh=(e,t)=>typeof t==`number`&&Number.isFinite(t)?+t.toPrecision(9):t,Uh=/* @__PURE__ */ new Set([`gain`,`pan`,`legato`]);function Wh(e){let t=gi(e),n=/* @__PURE__ */ new Map,r=(i,a)=>{if(n.has(i))return n.get(i);let o=e.cells.get(i);if(!o||a.has(i))return o?`(loop)`:i;let s=/* @__PURE__ */ new Set([...a,i]),c=e=>e?r(e,s):null,l=Vh.has(String(o.params.s)),u=Object.entries(o.params).filter(([e])=>!Uh.has(e)).sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>[e,typeof t==`string`&&Jr.has(e)?c(t):t]),d=Object.entries(o.paramCells).sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>[e,t.range,t.factors.map(e=>c(e))]),f=l?[]:dd(e,i,t).map(e=>[e.step,e.duration,e.value+e.alter+(e.transpose??0)]),p=[o.map?.kind===`table`?c(o.map.table):o.map,l?null:o.freq,l?null:o.loops,l?null:o.steps,l?null:o.glide,o.oneshot,o.kit,c(o.env),o.exciters??null,u,d,f];return a.size||n.set(i,p),p};return e=>r(e,/* @__PURE__ */ new Set)}function Gh(e,t,n,r,i={}){try{let a=yf(e,void 0,i),o=yf(t,void 0,i);if(!a.ok||!o.ok)return!1;let s=typeof n==`number`?n:n(a,o),c=e=>{let t=Qd(qd(e,gi(e),e.off),0,s,!0),n=tl(e,Xc(e));return{r:e,events:t,sent:t.map(e=>el(e.midi?n(e):null).map(t=>{let n=nl(e,t);return n?`${t?.port??1}:${n.channel}:${n.note}`:`-`}).join(`,`)),sound:Wh(e)}},l=c(a),u=c(o),d=[],f=/* @__PURE__ */ new Map,p=(e,t)=>n=>{let r=`${t}${n}`,i=f.get(r);if(i===void 0){let t=e.sound(n);i=d.findIndex(e=>Rh(e,t)),i<0&&(i=d.push(t)-1),f.set(r,i)}return i},m=(e,t)=>{let n=p(e,t);return e.events.map((t,i)=>{let a=`${`${n(t.voice)} ${e.sent[i]}`} ${t.at.toFixed(5)} ${t.dur.toFixed(5)} ${t.freq.toFixed(3)}`;return r===`note`?a:`${a} ${t.gains.map(e=>e.toFixed(5)).join(`,`)} ${JSON.stringify([t.bends,t.levels,t.params??null,t.env??null],Hh)}`}).sort().join(`
`)};if(m(l,`a`)===m(u,`b`))return!0;let h=e=>e.at<s-Fh.seconds;return Jh(Kh(l,p(l,`a`),r).filter(h),Kh(u,p(u,`b`),r).filter(h),r)}catch{return!1}}function Kh(e,t,n){let r=[],i=e.events.map((t,n)=>({e:t,sent:e.sent[n]})).sort((e,t)=>e.e.at-t.e.at);for(let{e:a,sent:o}of i){let i=Vh.has(String(e.r.cells.get(a.voice)?.params.s)),s={voice:t(a.voice),at:a.at,dur:a.dur,freq:i?null:a.freq,gains:n===`note`?[0,0]:a.gains,rest:n===`note`?null:[i?[]:a.bends,a.levels,a.params??null,a.env??null],sent:o},c=r.length-1;for(;c>=0&&s.at-r[c].at<=Fh.seconds&&!qh(r[c],s);)c--;if(c>=0&&s.at-r[c].at<=Fh.seconds){let e=r[c].gains;r[c]={...r[c],gains:[e[0]+s.gains[0],e[1]+s.gains[1]]}}else r.push(s)}return n===`note`?r:r.filter(e=>e.sent!==``||e.gains.some(e=>Math.abs(e)>=Fh.silent))}let qh=(e,t)=>e.voice===t.voice&&e.sent===t.sent&&Math.abs(e.at-t.at)<=Fh.seconds&&Math.abs(e.at+e.dur-(t.at+t.dur))<=Fh.seconds&&(e.freq===null?t.freq===null:t.freq!==null&&zh(e.freq,t.freq))&&Rh(e.rest,t.rest);function Jh(e,t,n){if(e.length!==t.length)return!1;let r=new Uint8Array(t.length),i=0;for(let a of e){for(;i<t.length&&t[i].at<a.at-Fh.seconds;){if(!r[i])return!1;i++}let e=-1;for(let o=i;o<t.length&&t[o].at<=a.at+Fh.seconds;o++)if(!r[o]&&qh(a,t[o])&&(n===`note`||Bh(a.gains[0],t[o].gains[0])&&Bh(a.gains[1],t[o].gains[1]))){e=o;break}if(e<0)return!1;r[e]=1}return!0}function Yh(e,t){let n=e=>df(e).ends??60;return Math.min(1200,Math.max(n(e),n(t)))}function Xh(e,t,n,r){return Gh(e,t,n??Yh,`whole`,r)}function Zh(e,t,n=20,r={}){let i=e,a=[];for(let e=0;e<n;e++){let e=yf(i,void 0,r);if(!e.ok)break;let n=null;for(let a of t(i,e)){let e;try{e=a.apply(i)}catch{continue}if(e!==i&&(a.exact||Xh(i,e,void 0,r))){n={next:e,title:a.title};break}}if(!n)break;a.push(n.title),i=n.next}return{source:i,steps:a}}function Qh(e,t,n=()=>!0){let r=[];for(let i of t.cells.values()){if(i.implicit||i.lambda)continue;let t=or(e,i.name);for(let[e,a]of t){let o=Kr[e];o&&!t.has(o)&&n(e,o)&&r.push({id:`alias:${i.name}:${e}`,tool:`normalise`,rule:`alias`,title:`&${i.name}: ${e}= is Strudel's or dough's name for ${o}= — write ours`,before:`${e}=${a}`,after:`${o}=${a}`,apply:t=>er(t,i.name,e,o)})}}return r}function $h(e,t){let n=[];for(let r of t.cells.values()){if(r.implicit||r.lambda)continue;let t=or(e,r.name).get(`ftype`),i=t!==void 0&&/^\d+$/.test(t)?ni[Number(t)]:void 0;i&&n.push({id:`ftype:${r.name}`,tool:`normalise`,rule:`alias`,title:`&${r.name}: ftype=${t} is superdough's number for ftype=${i} — write the word`,before:`ftype=${t}`,after:`ftype=${i}`,apply:e=>$n(e,r.name,`ftype`,i)})}return n}function eg(e){let t=Un(e.trim());return t?.kind===`use`&&!t.args&&t.main===null&&!t.head.length?{id:t.id,names:t.names,takes:t.takes}:null}let tg=(e,t,n=t)=>`${Wn(t,n)} from ${Nn(e)?e:JSON.stringify(e)}`,ng=e=>V(e)[0].trim().replace(/\s+/g,` `);function rg(e){let t=/* @__PURE__ */ new Map;for(let n of e)for(let e of n.text.split(`
`)){let r=ng(e),i=/^&([A-Za-z_][A-Za-z0-9_]*)\s/.exec(r)?.[1];i&&!t.has(r)&&t.set(r,{id:n.id,name:i})}return t}function ig(e,t){if(!t?.length)return[];let n=rg(t),r=e.split(`
`),i=e=>/[+*,[]\s*$/.test(V(r[e])[0])||e>0&&/[+*,[]\s*$/.test(V(r[e-1])[0]),a=new Set(Ro(e).cells.map(e=>e.name)),o=/* @__PURE__ */ new Map;return r.forEach((e,t)=>{let r=n.get(ng(e));if(!r||i(t)||!a.has(r.name))return;let s=o.get(r.id)??{at:[],names:[]};s.at.push(t),s.names.push(`&${r.name}`),o.set(r.id,s)}),[...o].map(([e,{at:t,names:n}])=>{let i=r.findIndex(t=>eg(V(t)[0])?.id===e),a=i>=0?eg(V(r[i])[0]):null,o=n.filter(e=>!a?.names?.includes(e)&&!a?.takes?.includes(e)),s=a&&!a.names?tg(e,null):tg(e,[...a?.names??[],...o],[...a?.takes??[],...o]),c=i>=0?i:t[0],l=t.map(e=>V(r[e])[1].trim()).filter(Boolean);return{id:`library:${e}`,tool:`normalise`,rule:`library`,title:`${n.join(`, `)} ${n.length>1?`are`:`is`} ${JSON.stringify(e)}'s: ${s}`,before:t.map(e=>ng(r[e])).join(`; `),after:s,apply:e=>{let n=e.split(`
`);if(n.length!==r.length||t.some(e=>n[e]!==r[e]))return e;let a=/^\s*/.exec(n[c])[0],o=i>=0?V(n[i])[1].trim():l.join(` `);return n[c]=`${a}${s}${o?`  ${o.startsWith(`#`)||o.startsWith(`//`)?o:`# ${o}`}`:``}`,n.filter((e,n)=>n===c||!t.includes(n)).join(`
`)}}})}function ag(e,t){if(!t?.length)return[];let n=/* @__PURE__ */ new Map;for(let[e,r]of rg(t)){let t=e.slice(r.name.length+2);t&&!n.has(t)&&n.set(t,r)}let r=new Set(Ro(e).cells.map(e=>e.name)),i=/* @__PURE__ */ new Map;for(let t of e.matchAll(/&\(([^()]*)\)/g)){let e=n.get(t[1].trim().replace(/\s+/g,` `));if(!e||r.has(e.name))continue;let a=i.get(e.name)??{...e,inline:[]};a.inline.includes(t[0])||a.inline.push(t[0]),i.set(e.name,a)}return[...i.values()].map(({id:e,name:t,inline:n})=>({id:`library-cell:${t}`,tool:`normalise`,rule:`library`,title:`${n[0]} is ${JSON.stringify(e)}'s &${t}: use it by name`,before:n[0],after:`&${t}`,apply:r=>{let i=r.split(`
`).map(e=>{let[r,i]=V(e);return n.reduce((e,n)=>e.split(n).join(`&${t}`),r)+i}),a=i.findIndex(t=>eg(V(t)[0])?.id===e);if(a>=0){let n=eg(V(i[a])[0]);return n.names&&!n.names.includes(`&${t}`)&&(i[a]=tg(e,[...n.names,`&${t}`],[...n.takes,`&${t}`])+V(i[a])[1]),i.join(`
`)}let o=-1;return i.forEach((e,t)=>{Un(V(e)[0].trim())?.kind===`use`&&(o=t)}),i.splice(o+1,0,tg(e,[`&${t}`])),i.join(`
`)}}))}let og=/^\s*&([A-Za-z_][A-Za-z0-9_]*)(?=\s|$)/,sg=e=>RegExp(`&${e}(?![A-Za-z0-9_])`);function cg(e,t){if(!t)return[];let n=e.split(`
`),r=n.map(e=>V(e)[0]),i=new Set(r.flatMap(e=>Un(e.trim())===void 0?[og.exec(e)?.[1]??``]:[]).filter(Boolean));return n.flatMap((e,n)=>{let[a,o]=V(e),s=Un(a.trim());if(!s||s.kind!==`use`||s.args||s.main||s.head.length)return[];let c=t(s.id);if(c===null||Ko(c))return[];let l=[...new Set(c.split(`
`).flatMap(e=>og.exec(V(e)[0])?.[1]??[]))],u=s.names?.map((e,t)=>[e,s.takes[t]])??l.map(e=>[`&${e}`,`&${e}`]),d=e=>!i.has(e)&&r.some((t,r)=>r!==n&&sg(e).test(t)),f=u.filter(([e])=>d(e.slice(1)));if(!f.length)return[];let p=a.trim(),m=`${Wn(f.map(([e])=>e),f.map(([,e])=>e))} from ${Nn(s.id)?s.id:JSON.stringify(s.id)}`;return m===p?[]:[{id:`narrowest:${n+1}`,tool:`normalise`,rule:`narrowest`,title:`${p} is written ${m}: the cells of it the piece uses`,before:p,after:m,apply:t=>t.split(`
`).map((t,r)=>r===n&&t===e?`${/^\s*/.exec(a)[0]}${m}${o?`${/\s*$/.exec(a)[0]}${o}`:``}`:t).join(`
`)}]})}let lg=(e,t,n,r,i)=>({id:`${e}:${n}`,tool:`normalise`,rule:e,title:t,before:n,after:r,apply:i}),ug=(e,t,n)=>{let r=e.split(`
`),i=H(e,t),a=/^\s*/.exec(r[i])[0];return r.splice(i+1,0,`${a}${n}`),r.join(`
`)},dg={from:40,to:300};function fg(e,t){let n=e.cells.get(t)?.beat||1,r=zu(e,qd(e,gi(e)).statics).map(t),i=60/((r.q(4*n)-r.q(0))/4);return Number.isFinite(i)&&i>=dg.from&&i<=dg.to}let pg=/* @__PURE__ */ new Set([`bar`,`tempo`,`key`,`tonic`,`harm`,`style`]),mg=e=>pg.has(e),hg=(e,t,n)=>H(e,n)<0&&!t.cells.has(n);function gg(e,t){let n=new Set(Ro(e).cells.map(e=>e.name)),r=[],i=[...n].filter(e=>t.clocks.has(e)&&t.cells.get(e)?.meter),a=t.mainMeter;if(a&&n.has(a)&&i.length===1&&!ir(e,a)&&fg(t,a)){!mg(a)&&hg(e,t,`bar`)&&r.push(lg(`bar`,`&${a} is the piece's meter: &bar`,`&${a}`,`&bar`,e=>ur(e,a,`bar`)));let n=or(e,a).get(`step`);a===`bar`&&n&&!n.startsWith(`&`)&&hg(e,t,`tempo`)&&r.push(lg(`tempo`,`&bar's rate is its tempo: step=&tempo, &tempo step=${n}`,`step=${n}`,`step=&tempo`,e=>ug($n(e,`bar`,`step`,`&tempo`),`bar`,`&tempo step=${n}`)))}let o=[...n].filter(t=>ar(e,t)?.braid[0]?.startsWith(`scale(`)),s=t.mainKey;if(s&&n.has(s)&&o.length===1&&!ir(e,s)){!mg(s)&&hg(e,t,`key`)&&r.push(lg(`key`,`&${s} is the piece's key: &key`,`&${s}`,`&key`,e=>ur(e,s,`key`)));let n=ar(e,s).braid,i=n.length===1?/^scale\(\s*([^,()\s]+)\s*,\s*([A-Ga-g][#b♯♭]*-?\d*)\s*\)$/.exec(n[0]):null;s===`key`&&i&&hg(e,t,`tonic`)&&r.push(lg(`tonic`,`&key's tonic is a cell: scale(${i[1]}, &tonic), &tonic ${i[2]}`,n[0],`scale(${i[1]}, &tonic)`,e=>ug(vg(e,`key`,n[0],`scale(${i[1]}, &tonic)`),`key`,`&tonic ${i[2]}`)))}return r}function _g(e,t){let n=t.mainMeter;if(!n||ir(e,n))return[];let r=ar(e,n)?.braid??[];return r.length!==1||!/^scan\(\s*1\s+1\s+1\s+1\s*\)$/.test(r[0])?[]:[{id:`meter:${n}`,tool:`normalise`,rule:`meter`,title:`&${n}: ${r[0]} is meter("4/4")`,before:r[0],after:`meter("4/4")`,apply:e=>vg(e,n,r[0],`meter("4/4")`)}]}function vg(e,t,n,r){let i=e.split(`
`),a=H(e,t);if(a<0)return e;let[o,s]=V(i[a]),c=o.indexOf(n);return c<0?e:(i[a]=o.slice(0,c)+r+o.slice(c+n.length)+s,i.join(`
`))}function yg(e,t){let n=or(e,t),r=ar(e,t),i=H(e,t);if(!n.has(`trigger`)||!r||i<0)return null;let a=[n.get(`velocity`),n.get(`gate`),n.get(`gain`)].filter(e=>!!e&&e!==`1`),o=e;for(let e of[`velocity`,`gate`,`gain`])o=$n(o,t,e,null);let s=o.split(`
`);return s[i]=s[i].replace(/(\s)trigger=(\S+)/,(e,t,n)=>`${t}play=${n}${a.length?` level=${a.join(`*`)}`:``}`),o=s.join(`
`),r.braid.length>1&&(o=sr(o,t,[`[${r.braid.join(`, `)}]`])),o}function bg(e,t,n={}){let r=[];for(let i of t.cells.values()){if(i.gate?.port!==`trigger`)continue;let t=yg(e,i.name);if(t===null||!Xh(e,t,void 0,n))continue;let a=H(e,i.name);r.push({id:`gate:${i.name}`,tool:`migrate`,rule:`gate`,title:`&${i.name} is a gate written the old way: play= for trigger=, one level= for velocity=, gate= and gain=, the voices it plays all of as a chord`,before:e.split(`
`)[a].trim(),after:t.split(`
`)[a].trim(),apply:e=>yg(e,i.name)??e})}return r}function xg(e,t,n=1){let r=e.cells.get(t)?.step;if(!r||r.tap||r.whole||r.cycle)return null;let i=e.cells.get(r.driver)?.meter;if(!i||!e.clocks.has(r.driver)||e.clocks.get(r.driver).belt)return null;let a=r.chain.reduce((e,t)=>t.op===`×`?e*t.n:e/t.n,1)/n,o=!e.cells.get(r.driver)?.step,s=gl(i.levels.length,i.pulses,o?i.unit:0,a);return e.mainMeter===r.driver?s:`&${r.driver}:${s}`}function Sg(e,t,n={}){let r=[],i=/* @__PURE__ */ new Set;for(let a of t.cells.values()){let o=xg(t,a.name),s=t.sections?.get(a.name)??a.name;if(o===null||i.has(s)||H(e,s)<0)continue;i.add(s);let c=e=>$n(e,s,`step`,o),l=[c,e=>$n(c(e),s,`cycle`,null)].find(t=>{let r=t(e);return r!==e&&Xh(e,r,void 0,n)});if(!l)continue;let u=l(e),d=H(e,s);r.push({id:`tap:${s}`,tool:`migrate`,rule:`tap`,title:`&${s} steps by the meter cell's own steps: tap the meter instead, step=${o} (decision 040)`,before:e.split(`
`)[d].trim(),after:u.split(`
`)[d].trim(),apply:l})}return r}function Cg(e,t,n={}){let r=[];for(let i of t.cells.values()){let t=i.meter,a=t&&typeof i.params.swing==`number`?or(e,i.name).get(`swing`):void 0;if(!t||!a||a.startsWith(`&`)||/^[1-9][0-9]*(?:n\.?|t):/.test(a)||H(e,i.name)<0)continue;let o=Pi(t),s=o===null?null:Di(o);if(!o||s===null||Fi(t,s)!==null)continue;let c=e=>$n(e,i.name,`swing`,`${o}:${a}`),l=c(e);if(l===e||!Xh(e,l,void 0,n))continue;let u=H(e,i.name);r.push({id:`swing:${i.name}`,tool:`migrate`,rule:`swing`,title:`&${i.name}'s swing= leans the meter cell's own steps: name the level, swing=${o}:${a} (#18)`,before:e.split(`
`)[u].trim(),after:l.split(`
`)[u].trim(),apply:c})}return r}function wg(e,t){let n=t.mainKey;return n?Ro(e).cells.flatMap(e=>{if(e.over?.name!==`key:main`)return[];let{line:t,col:r}=e.over.span,i=`over=&${n}`;return[{id:`main key:${t}:${r}`,tool:`migrate`,rule:`main key`,title:`over=key is written ${i}, the key it reads`,before:`over=key`,after:i,apply:e=>e.split(`
`).map((e,i)=>i===t-1&&e.slice(r-1-5,r-1+3)===`over=key`?`${e.slice(0,r-1)}&${n}${e.slice(r+2)}`:e).join(`
`)}]}):[]}let Tg=e=>{let t=Un(e.trim());return t?.kind===`use`&&!t.head.length&&!t.args&&t.main===null?t:null};function Eg(e){let t=e.split(`
`).map(e=>V(e)[0].trim()).filter(Boolean),n=t.length===1?Tg(t[0]):null;return n&&n.names?.every((e,t)=>e===n.takes[t])!==!1?n:null}function Dg(e,t){if(!e.names)return{names:t.names,takes:t.takes};if(!(t.names&&e.takes.some(e=>!t.names.includes(e))))return{names:e.names,takes:e.takes}}let Og=(e,{names:t,takes:n})=>`${Wn(t,n)} from ${Nn(e)?e:JSON.stringify(e)}`;function kg(e,t){return t?e.split(`
`).flatMap((e,n)=>{let[r,i]=V(e),a=Tg(r);if(!a)return[];let o=t(a.id),s=o===null?null:Eg(o),c=s?Dg(a,s):void 0;if(!s||c===void 0)return[];let l=r.trim(),u=Og(s.id,c);return[{id:`forwarded:${n+1}`,tool:`migrate`,rule:`forwarded`,title:`${l} takes what ${JSON.stringify(a.id)} forwards: ${u}`,before:l,after:u,apply:t=>t.split(`
`).map((t,a)=>a===n&&t===e?`${/^\s*/.exec(r)[0]}${u}${i?`${/\s*$/.exec(r)[0]}${i}`:``}`:t).join(`
`)}]}):[]}function Ag(e,t,n={}){let r=[];for(let n of t.cells.values()){if(!n.root||n.map?.kind!==`edo`)continue;let t=or(e,n.name),i=t.get(`cycle`),a=t.get(`map`);if(!i||!/^[1-9][0-9]*$/.test(i)||!a||H(e,n.name)<0)continue;let o=a===`edo`?`edo(${i})`:/^ed\(([^,)]+)\)$/.test(a)?`ed(${i}, ${a.slice(3,-1)})`:null;if(!o)continue;let s=e=>$n($n(e,n.name,`map`,o),n.name,`cycle`,null),c=H(e,n.name);r.push({id:`grid:${n.name}`,tool:`migrate`,rule:`grid`,title:`&${n.name}'s size is its map's: map=${o} for cycle=${i} map=${a} (decision 040)`,before:e.split(`
`)[c].trim(),after:s(e).split(`
`)[c].trim(),apply:s})}return r}function jg(e,t){let n=new Map(Ro(e).cells.map(e=>[e.name,e])),r=[];for(let i of t.cells.values()){let t=n.get(i.name),a=i.cycle;if(!t||t.step?.kind!==`driven`||t.cycle===null||t.map||a<2||t.cycle<a||t.cycle%a!==0||or(e,i.name).get(`cycle`)!==String(t.cycle)||H(e,i.name)<0)continue;let o=t.cycle/a,s=e=>$n(e,i.name,`cycle`,o===1?null:String(o)),c=H(e,i.name);r.push({id:`laps:${i.name}`,tool:`migrate`,rule:`laps`,title:`&${i.name}'s cycle=${t.cycle} counted steps: ${o===1?`one lap of its `+a+`, the default`:`cycle=${o}, ${o} laps of its ${a}`} (decision 040)`,before:e.split(`
`)[c].trim(),after:s(e).split(`
`)[c].trim(),apply:s,exact:!0})}return r}function Mg(e){let t=Un(e);return t?.kind===`use`?t.id:null}function Ng(e,t){return t?e.split(`
`).flatMap((e,n)=>{let[r]=V(e),i=Mg(r),a=i===null?void 0:zo.get(i);if(a===void 0||t(i)===null||t(i)!==t(a))return[];let o=JSON.stringify(i),s=RegExp(`(\\sfrom\\s+)(${Pg(o)}|${Pg(i)})(?=[\\s(]|$)`).exec(r);if(!s)return[];let c=s.index+s[0].length,l=a.endsWith(`)`)&&r[c]===`(`?`${a.slice(0,-1)}, ${r.slice(c+1)}`:`${a}${r.slice(c)}`;return[Fg(n,e,r,`${r.slice(0,s.index)}${s[1]}${l}`,i,a)]}):[]}let Pg=e=>e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`);function Fg(e,t,n,r,i,a){let o=n.trim();return{id:`renamed:${e+1}`,tool:`migrate`,rule:`renamed`,title:`${JSON.stringify(i)} is ${a} now: ${r.trim()}`,before:o,after:r.trim(),apply:i=>i.split(`
`).map((i,a)=>a===e&&i===t?`${r}${t.slice(n.length)}`:i).join(`
`)}}let Ig=/(^|\s)oneshot(?=\s|$)/,Lg=e=>e.replace(/"[^"]*"/g,e=>` `.repeat(e.length));function Rg(e){return e.split(`
`).flatMap((e,t)=>{let[n,r]=V(e),i=Ig.exec(Lg(n));if(!i||!/^\s*&/.test(n))return[];let a=i.index+i[1].length,o=`${n.slice(0,a)}oneshot=1${n.slice(a+7)}`,s=o+r;return[{id:`oneshot:${t+1}`,tool:`migrate`,rule:`oneshot`,title:`oneshot is a voice's parameter: oneshot=1 (decision 068)`,before:n.trim(),after:o.trim(),apply:n=>n.split(`
`).map((n,r)=>r===t&&n===e?s:n).join(`
`)}]})}let zg=/(swing=[^\s]*?[0-9)]):pairs(?=[,\s]|$)/g,Bg=e=>e.replace(/"[^"]*"/g,e=>` `.repeat(e.length));function Vg(e){return e.split(`
`).flatMap((e,t)=>{let[n,r]=V(e);if(!/^\s*&/.test(n))return[];let i=Bg(n),a=n,o=[...i.matchAll(zg)].reverse();if(!o.length)return[];for(let e of o)a=a.slice(0,e.index+e[1].length)+a.slice(e.index+e[0].length);let s=a+r;return[{id:`pairs:${t+1}`,tool:`migrate`,rule:`pairs`,title:`a swing leans a level's pairs alone, its groups of three straight: :pairs says nothing more (decision 071)`,before:n.trim(),after:a.trim(),apply:n=>n.split(`
`).map((n,r)=>r===t&&n===e?s:n).join(`
`)}]})}let Hg=e=>Number.isInteger(e)&&e>=1&&Number.isInteger(Math.log2(e));function Ug(e,t){let n=/^meter\("([^"]+)"(?:,\s*([1-8]))?\)$/.exec(e);if(n){let[,e,r]=n,i=Number(r??1),a=ia(e),o=[];if(a&&a.pulses%t===0){let e=a.pulses/t,n=a.unit/e;Hg(n)&&o.push({braid:`meter("${t}/${n}"${i*e>1?`, ${i*e}`:``})`})}let s=fa(e,i);if(s&&s.length%t===0&&a&&Hg(a.unit*i)){let e=s.length/t,n=[...s].map((t,n)=>n===0?`*`:n%e===0?`+`:t===`,`?`,`:`.`).join(``);o.push({braid:`meter("${n}", ${a.unit*i}n)`})}return o}let r=/^scan\((.*)\)$/.exec(e);if(r){let e=4*r[1].trim().split(/\s+/).reduce((e,t)=>e+(/!(\d+)$/.exec(t)?Number(/!(\d+)$/.exec(t)[1]):1),0)/t;return Hg(e)?[{pulse:`${e}n`}]:[]}return[]}function Wg(e,t,n={}){let r=[];for(let i of t.cells.values()){let t=i.params.beat,a=typeof t==`number`&&H(e,i.name)>=0?ar(e,i.name):null;if(a&&typeof t==`number`&&t>=1&&i.meter)for(let o of Ug(a.braid.join(` `),Math.round(t))){let t=a.braid.join(` `),s=e=>{let n=H(e,i.name);if(n<0)return e;let r=e.split(`
`),[a,s]=V(r[n]),c=o.braid?a.replace(t,o.braid):a;return c=c.replace(/(\s)beat=\S+/,o.pulse?`$1pulse=${o.pulse}`:``),r[n]=c+s,r.join(`
`)},c=s(e);if(c===e||!Xh(e,c,void 0,n))continue;let l=H(e,i.name);r.push({id:`beats:${i.name}`,tool:`migrate`,rule:`beats`,title:`beat= is retired: &${i.name} counts its beats as ${o.braid??`pulse=${o.pulse}`} does (#502)`,before:e.split(`
`)[l].trim(),after:c.split(`
`)[l].trim(),apply:s});break}}return r}function Gg(e,t){let n=new Map(Ro(e,{old:!0}).cells.map(e=>[e.name,e])),r=/* @__PURE__ */ new Map;for(let e of t.cells.values())if(e.kit)for(let i of e.units){if(i.atom.kind!==`ref`||r.has(i.atom.name))continue;let e=n.get(i.atom.name),a=zc(i.atom.name);e&&a!==null&&e.drumNote===void 0&&t.cells.get(i.atom.name)?.voice&&r.set(i.atom.name,a)}return[...r]}function Kg(e,t){let n=Gg(e,t);if(!n.length)return[];let r=n.map(([e,t])=>`&${e} note=${t}`).join(`, `);return[{id:`notes:${n.map(([e])=>e).join(`,`)}`,tool:`migrate`,rule:`notes`,title:`A drum's note is its note=, not its name: ${r} (decision 075)`,before:n.map(([e])=>`&${e}`).join(`, `),after:r,apply:e=>n.reduce((e,[t,n])=>$n(e,t,`note`,String(n)),e)}]}let qg=(e={})=>(t,n)=>[...bg(t,n,e),...Sg(t,n,e),...Cg(t,n,e),...wg(t,n),...kg(t,e.resolve),...Ag(t,n,e),...jg(t,n),...Ng(t,e.resolve),...Rg(t),...Vg(t),...Wg(t,n,e),...Kg(t,n)],Jg=(e={})=>(t,n)=>[...qg(e)(t,n).filter(e=>!e.exact),...gg(t,n),..._g(t,n),...Qh(t,n),...$h(t,n),...ig(t,e.library),...ag(t,e.library),...cg(t,e.resolve)],Yg=(e,t)=>{let n={...t,old:!0};return Zh(e,Jg(n),20,n)},Xg=/* @__PURE__ */ new Set([`label`,`show`,`tags`,`title`,`tier`,`about`,`size`]),Zg=e=>e.k===`ref`||e.k===`num`?1:e.k===`sum`?e.items.reduce((e,t)=>e+Zg(t.e),0):e.factors.reduce((e,t)=>e+Zg(t),0);function Qg(e){switch(e.kind){case`chord`:return e.notes.length;case`choice`:return e.values.length;case`seq`:return e.layers.reduce((e,t)=>e+$g(t),0);case`mix`:return e.exprs.reduce((e,t)=>e+Zg(t),0);default:return 1}}let $g=e=>e.reduce((e,t)=>e+Qg(t.atom),0);function e_(e,t){switch(e.kind){case`blank`:return 0;case`wave`:return 1;case`scan`:{let{line:n,col:r,len:i}=e.span;return(t[n-1]??``).slice(r-1,r-1+i).replace(/^scan\(|\)$/g,``).split(/[\s,]+/).filter(Boolean).length}case`list`:return e.signature?1:$g(e.tokens)}}function t_(e){let t=/* @__PURE__ */ new Map,n=0,r=null;return e.split(`
`).forEach((e,i)=>{let a=e.replace(/"[^"]*"/g,`""`).replace(/#.*$/,``);r===null&&(n=i+1),r=r===null?a:`${r} ${a}`,/[+*,[]\s*$/.test(r)||(t.set(n,r),r=null)}),r!==null&&t.set(n,r),t}let n_=e=>[...e.matchAll(/(?:^|[\s(])([A-Za-z][A-Za-z0-9]*)=/g)].filter(e=>!Xg.has(e[1])).length+[...e.matchAll(/(?:^|\s)(off|oneshot)(?=\s|$)/g)].length;function r_(e,{asWritten:t=!1,resolve:n}={}){let r=t?e:Yg(e,n?{resolve:n}:{}).source,i=r.replace(/(^|[\s(])base=&[A-Za-z_][A-Za-z0-9_]*(?:\^\$?-?\d+)?/gm,`$1`),a=i.split(`
`),o=Ro(i).cells.filter(e=>!gn(e)),s=t_(r),c=/* @__PURE__ */ new Set;return o.map(e=>{let t=e_(e.braid,a),n=e.span.line,r=!e.lambda&&!c.has(n)&&s.has(n)?n_(s.get(n)):0;return e.lambda||c.add(n),{name:e.name,cells:1,leaves:t,attributes:r,total:1+t+r}})}function i_(e,t={}){let n=r_(e,t),r=e=>n.reduce((t,n)=>t+n[e],0),i=Ro(e).uses?.length??0;return{cells:r(`cells`),leaves:r(`leaves`)+i,attributes:r(`attributes`),total:r(`total`)+i}}let a_=(e,t,n)=>({...e,sign:e.sign*t,by:e.by*t+n}),o_=e=>`${e.table}:${e.sign*e.value+e.by}:${e.sign*e.alter}:${e.transpose}`;function s_(e){if(typeof e.written==`number`){let t=e.sign*e.alter;return`${e.sign*e.written+e.by}${t>0?`#`:t<0?`b`:``}`}let t=e.sign===-1?`inverse(${e.written})`:e.written;return e.by===0?t:/^&[A-Za-z_][A-Za-z0-9_]*$/.test(t)?`${t}^${e.by}`:`degree(${t}, ${e.by})`}let c_=e=>zc(e.slice(1))??128,l_=/^~(?:[!@](\d+))?$/,u_=/^&([A-Za-z_][A-Za-z0-9_]*)(?::0(?::([0-9]*\.?[0-9]+))?)?(?:!(\d+))?$/,d_=/^\[([^[\]]*,[^[\]]*)\]$/,f_=/^\[([^[\],]*)\]$/,p_=/^&([A-Za-z_][A-Za-z0-9_]*)\((\d+),\s*(\d+)(?:,\s*(-?\d+))?\)$/,m_=/^([0-9]*\.?[0-9]+)(?:!(\d+))?$/,h_=/^(-?\d+)[#b]?(?:!(\d+))?$/,g_=/^(-?\d+)[#b]?@(\d+)$/,__=String.raw`&[A-Za-z_][A-Za-z0-9_]*(?:\^\$?-?\d+)?`,v_=new RegExp(String.raw`^(?:${__}|inverse\(${__}\)|degree\((?:${__}|inverse\(${__}\)),\s*-?\d+\))$`);function y_(e){let t=u_.exec(e);return t&&!t[3]?{voice:`&${t[1]}`,own:t[2]??null}:null}function b_(e){let t=[];for(let n of e){let e=l_.exec(n),r=u_.exec(n),i=d_.exec(n);if(e)for(let n=0;n<Number(e[1]??1);n++)t.push([]);else if(r)for(let e=0;e<Number(r[3]??1);e++)t.push([{voice:`&${r[1]}`,own:r[2]??null}]);else if(i){let e=i[1].split(`,`).map(e=>y_(e.trim()));if(e.some(e=>!e))return null;t.push(e)}else return null}return t}function x_(e){let t=[];for(let n of e){let e=m_.exec(n);if(!e)return null;for(let n=0;n<Number(e[2]??1);n++)t.push(e[1])}return t}let S_=(e,t,n)=>{let r=ta(e,t);return Array.from({length:t},(e,t)=>t).filter(e=>r[((e-n)%t+t)%t])};function C_(e,t){if(!e||!t)return null;let n=t.pulses/t.unit;return e===`1m`?n:e===`pulse`?1/t.unit:Di(e)}function w_(e,t){let n=ar(e,t)?.braid??[];return n.length!==1||!/^\[.*\]$/.test(n[0])?[]:n[0].slice(1,-1).split(`,`).map(e=>e.trim())}function T_(e,t){let n=new Set(e.split(`
`).flatMap(e=>[...V(e)[0].replace(/^\s*&[A-Za-z_][A-Za-z0-9_]*/,``).matchAll(/&([A-Za-z_][A-Za-z0-9_]*)/g)].map(e=>e[1]))),r=[...t.cells.values()].filter(e=>!e.implicit&&!e.lambda&&!n.has(e.name)),i=[...[...t.cells.values()].filter(e=>(e.map?.kind===`midi`||e.sink)&&!e.implicit).map(e=>e.name),...r.filter(t=>!t.map&&!t.voice&&!t.step&&w_(e,t.name).length).map(e=>e.name)],a=[],o=/* @__PURE__ */ new Set,s=n=>{if(o.has(n))return;o.add(n);let r=w_(e,n);for(let i of r){let o=/^&([A-Za-z_][A-Za-z0-9_]*)$/.exec(i)?.[1],c=o?t.cells.get(o):void 0;if(c&&!c.voice&&!c.step&&w_(e,o).length){s(o);continue}let l=i.split(`*`).map(e=>e.trim()),u=l.filter(e=>e.startsWith(`&`));if(l.some(e=>!/^&[A-Za-z_][A-Za-z0-9_]*$/.test(e)&&!m_.test(e)))continue;let d=u.map(e=>t.cells.get(e.slice(1)));if(d.some(e=>!e))continue;let f=d.filter(e=>e.map?.kind===`amp`),p=d.filter(e=>e.map?.kind!==`amp`),m=p.filter(e=>e.voice),h={name:n,entries:r,entry:i};if(p.length===2&&m.length===1&&!f.length){let n=D_(e,t,p.find(e=>!e.voice).name,m[0].name,h);n&&a.push(n);continue}if(p.length!==1||f.length>1)continue;let g=E_(e,t,p[0].name,f[0]?.name,h);g&&a.push(g)}};for(let e of i)s(e);for(let n of r){if(!n.over||!n.step||n.voice||n.map)continue;let r=D_(e,t,n.name,null,{name:n.name,entries:[],entry:`&${n.name}`});r&&a.push(r)}return a}function E_(e,t,n,r,i){let a=ar(e,n),o=t.cells.get(n);if(!a||!o.step)return null;let s=t.cells.get(o.step.driver)?.meter??null,c=C_(o.step.tap,s),l=e=>!!t.cells.get(e.slice(1))?.voice,u=`steps`,d,f;if(a.braid.length===1&&p_.test(a.braid[0])){let[,e,t,n,r]=p_.exec(a.braid[0]);u=`euclid`,f={voice:`&${e}`,k:Number(t),n:Number(n),r:Number(r??0)};let i=new Set(S_(f.k,f.n,f.r));d=Array.from({length:f.n},(e,t)=>i.has(t)?[{voice:f.voice,own:null}]:[])}else a.braid.length===1&&f_.test(a.braid[0])?(u=`seq`,d=b_(tr(f_.exec(a.braid[0])[1]))):d=b_(a.braid);if(!d?.length||d.some(e=>e.some(e=>!l(e.voice)))||u===`steps`&&d.length!==o.steps)return null;let p;if(r){let t=x_(ar(e,r)?.braid??[]);if(!t||t.length!==d.length)return null;p={cell:r,tokens:t}}let m=d.flatMap((e,t)=>e.map(e=>({step:t,voice:e.voice,own:e.own,level:Number(e.own??1)*Number(p?.tokens[t]??1)}))).filter(e=>e.level>0).sort((e,t)=>e.step-t.step||c_(e.voice)-c_(t.voice));return{name:`&${n}`,trigger:n,card:i,form:u,...f?{euclid:f}:{},...p?{levels:p}:{},steps:d.length,notes:m,stepWhole:c===null?null:u===`steps`?c:c/d.length,meter:s}}function D_(e,t,n,r,i){let a=ar(e,n),o=t.cells.get(n);if(!a||!o.step)return null;let s=t.cells.get(o.step.driver)?.meter??null,c=Symbol(`held`),l=[],u=/* @__PURE__ */ new Map;for(let e of a.braid){let t=l_.exec(e),n=h_.exec(e),r=g_.exec(e);if(t)for(let e=0;e<Number(t[1]??1);e++)l.push(null);else if(n)for(let e=0;e<Number(n[2]??1);e++)l.push(Number(n[1]));else if(r&&Number(r[2])>=2)u.set(l.length,Number(r[2])),l.push(Number(r[1]),...Array(Number(r[2])-1).fill(c));else if(v_.test(e))l.push(e);else return null}if(!l.length||l.length!==o.steps)return null;let d=dd(t,n,gi(t)),f=[];for(let[e,t]of l.entries()){let n=d.filter(t=>Math.abs(t.step-e)<1e-9),i=u.get(e)??1;if(t===null||t===c?n.length:n.length!==1||Math.abs(n[0].duration-i)>1e-9)return null;if(t===null||t===c)continue;let a=n[0],o={written:t,sign:1,by:0,table:`${a.table}:${a.tableShift}`,value:a.value,alter:a.alter,transpose:a.transpose??0};f.push({step:e,voice:r===null?``:`&${r}`,own:null,level:1,pitch:o,...i>1?{hold:i}:{}})}return d.length===f.length?{name:`&${n}`,trigger:n,card:i,form:`steps`,steps:l.length,notes:f,stepWhole:C_(o.step.tap,s),meter:s,pitched:{table:o.over,voice:r===null?``:`&${r}`}}:null}let O_=e=>e.own===null?e.voice:`${e.voice}:0:${e.own}`;function k_(e,t){let n=Array(e.steps).fill(`~`),r=/* @__PURE__ */ new Map;for(let i of t){if(!Number.isInteger(i.step))continue;for(let t=1;t<(i.hold??1);t++)i.step+t<e.steps&&(n[i.step+t]=null);let t=i.pitch?`${s_(i.pitch)}${i.hold?`@${i.hold}`:``}`:O_(i),a=r.get(i.step);a?a.push(t):r.set(i.step,[t])}for(let[t,i]of r)t>=0&&t<e.steps&&n[t]!==null&&(n[t]=i.length===1?i[0]:`[${i.join(`,`)}]`);return n}function A_(e,t,n,r=!1){let i=/* @__PURE__ */ new Map;if(!t.length){let t=e.card.entries.filter(t=>t!==e.card.entry);if(!t.length)return null;i.set(e.card.name,[`[${t.join(`, `)}]`])}if(e.euclid&&r){let{voice:t,k:n,n:r,r:a}=e.euclid;i.set(e.trigger,[`${t}(${n},${r},${(a+1)%r})`])}else{let n=k_(e,t).filter(e=>e!==null);i.set(e.trigger,e.form===`steps`?n:[`[${n.join(` `)}]`])}return e.levels&&n&&i.set(e.levels.cell,[...n]),i}let j_=Cp(`forms`),M_=Cp(`bass`),N_=Cp(`harmony`),P_=Cp(`expression`),F_=Cp(`instruments`),I_=Cp(`meters`),L_=Cp(`modes`),R_=Cp(`performers`),z_=Cp(`rhythms`),B_=Cp(`stab`),V_=Cp(`motifs`),H_=Cp(`bands`),U_=Cp(`modules`),W_=[...I_,...z_,...M_,...N_,...F_,...P_,...L_,...R_,...B_,...V_,...j_,...H_,...wp,...U_],G_=/* @__PURE__ */ new Map([[`core kit`,`&bd, &rim, &sd, &cp, &lt, &hh, &ph, &mt, &oh, &ht, &cr, &rd, &claves from gm_kit`],[`gm kit`,`* from gm_kit`]]),K_=new Map([...xp.map(e=>[e.fragment.id,e.fragment.text]),...W_.map(e=>[e.id,e.text])]),q_=[...zo].map(([e,t])=>[e,K_.get(t)]),J_=new Map([...K_,...q_,...G_]),Y_=e=>J_.get(e)??null,X_=e=>`&bar meter("${e}") step=120bpm\n&key scale(ionian, C)`,Z_=e=>`${Math.round(e.at*1e6)}:${e.degree}:${e.alter}`,Q_=(e,t)=>e.length===t.length&&e.every((e,n)=>Z_(e)===Z_(t[n]));function $_(e,t,n){let r=yf(`${X_(n)}\n${e}`,void 0,{resolve:Y_});if(!r.ok)return null;let i=r.cells.get(t),a=r.cells.get(`bar`)?.meter??null;if(!i?.step||!a)return null;let o=C_(i.step.tap,a);if(o===null)return null;let s=gi(r),c=[];for(let e of dd(r,t,s)){if(e.table!==`key`)return null;let{value:t,alter:n}=fd(r,e,s);c.push({at:e.step*o,degree:t+0,alter:n+0})}return{notes:c.sort((e,t)=>e.at-t.at||e.degree-t.degree),lap:i.steps*o,bar:a.pulses/a.unit}}let ev=e=>`${e.degree}${(e.alter>0?`#`:`b`).repeat(Math.abs(e.alter))}`;function tv(e,t,n){let r=Math.round(n*8),i=t.map(e=>e.at*8);if(i.some(e=>Math.abs(e-Math.round(e))>1e-6))return null;let a=i.map(Math.round);if(new Set(a).size!==a.length)return null;let o=[];return a[0]>0&&o.push(a[0]>1?`~@${a[0]}`:`~`),a.forEach((e,n)=>{let i=(a[n+1]??r)-e;o.push(i>1?`${ev(t[n])}@${i}`:ev(t[n]))}),`&${e} over=&key step=8n ${o.join(` `)}`}let nv=(e,t,n)=>e.filter(e=>e.at>=t-1e-9&&e.at<t+n-1e-9).map(e=>({...e,at:e.at-t})),rv=/* @__PURE__ */ new WeakMap;function iv(e,t){let n=rv.get(e)??/* @__PURE__ */ new Map;return rv.set(e,n),n.has(t)||n.set(t,e.flatMap(e=>{let n=$_(`&${e.id} from ${e.id} &key`,e.id,t);return n?[{id:e.id,...n}]:[]})),n.get(t)}function av(e){let t=/^&(\w+) from (?:\(([^)]*)\) )?&(\w+)\s*$/m.exec(e.text);if(!t)return null;let n=(t[2]??``).split(`,`).map(e=>e.trim().replace(/^&/,``)).filter(Boolean);return{head:t[1],helpers:n,hole:t[3]}}function ov(e,t,n,r={}){let i=r.forms??j_,a=r.motifs??V_,o={text:e,form:null,call:null,helpers:{},structure:i_(e).total},s=$_(e,t,n);if(!s||s.notes.length===0)return o;let{notes:c,lap:l,bar:u}=s,d=Math.round(l/u);if(Math.abs(l-d*u)>1e-9||d<2)return o;let f=iv(a,n),p=(e,t)=>f.find(n=>Math.abs(n.lap-t)<1e-9&&Q_(n.notes,e))?.id??null,m=(e,t,n)=>{let r=p(e,t);if(r)return{name:r,text:`&${r} from ${r} &key`,id:r};let i=tv(n,e,t);return i?{name:n,text:i,id:null}:null},h=o;for(let e of i){let r=av(e);if(r)for(let i=1;i<=d;i++){let a=d/i*u;if(d%i!==0)continue;let o=m(nv(c,0,a),a,`${t}Call`);if(!o)continue;let s=r=>{let i=[o.text,...r.map(e=>e.text)],a=r.length?`(${r.map(e=>`${e.param}=&${e.name}`).join(`, `)})`:``,s=[...new Set(i),`&${t} from ${e.id}${a} &${o.name}`].join(`
`);return{text:s,read:$_(s,t,n)}},f=/* @__PURE__ */ new Map;for(let e of r.helpers){let n=s([{name:`${t}Probe`,param:e,text:`&${t}Probe over=&key step=8n ${`40 `.repeat(Math.round(a*8)).trim()}`}]).read?.notes.find(e=>e.degree>=30)?.at;n!==void 0&&f.set(e,n)}let p=r.helpers.filter(e=>f.has(e));for(let n=0;n<1<<p.length;n++){let r=p.filter((e,t)=>n&1<<t).map(e=>{let n=m(nv(c,f.get(e),a),a,`${t}${e[0].toUpperCase()}${e.slice(1)}`);return n?{...n,param:e}:null});if(r.some(e=>e===null))continue;let{text:i,read:u}=s(r);if(!u||Math.abs(u.lap-l)>1e-9||!Q_(u.notes,c))continue;let d=i_(i).total;d<h.structure&&(h={text:i,form:e.id,call:o.id,helpers:Object.fromEntries(r.map(e=>[e.param,e.id])),structure:d})}}}return h}function sv(e,t,n){let r=e.map(e=>e*t);for(let[e,t]of n)r[e]+=t;return r}function cv(e,t){let n=Math.max(...e);return n>0?e.map(e=>(e/n)**t):e.map(()=>1)}jp-1;let lv={mashing:12,fewest:3,widest:19,forgetAfter:16};new Set(Object.values(ge).map(e=>F(e)));function uv(e,t=/* @__PURE__ */ new Set){let n=e=>e.degrees.filter(e=>e!==null).length,r=e=>e.confidence??1,i=e=>+!!t.has(e),a=null;for(let t of e)t.kind===`motif`&&(a===null||i(t)>i(a)||i(t)===i(a)&&(r(t)>r(a)||r(t)===r(a)&&n(t.motif)>n(a.motif)))&&(a=t);return a}let dv=.85,fv=dv**(lv.forgetAfter+.5);function pv(e,t,n){let r=sv(e.map(e=>e.weight),dv,[]),i=e.map((e,t)=>({...e,weight:r[t]})).filter(e=>e.weight>=fv),a=[...i],o=[],s=[],c=/* @__PURE__ */ new Set;for(let e of t){if(e.kind!==`motif`)continue;let t=-1,r=null;for(;r===null&&++t<i.length;)r=je(e.motif,i[t].motif);if(r!==null){let{source:n,bar:a}=i[t];s.push({source:e.source,of:{source:n,bar:a},op:r}),c.add(e)}else t=a.findIndex((t,n)=>n>=i.length&&je(e.motif,t.motif)),t===-1&&(t=a.push({motif:e.motif,source:e.source,bar:n,weight:0,heard:0})-1);o.some(([e])=>e===t)||o.push([t,1])}let l=sv(a.map(e=>e.weight),1,o),u=new Set(o.map(([e])=>e));return{memory:a.map((e,t)=>({...e,weight:l[t],heard:e.heard+ +!!u.has(t)})),recognised:s,confirmed:c}}let mv={initial:{offer:null,lastPlayed:null,memory:[]},advance({bar:e},t,{judgements:n,forget:r}){let{offer:i,lastPlayed:a}=t,o=null;r&&i&&(i=null,o=`asked`);let{memory:s,recognised:c,confirmed:l}=pv(t.memory,n,e);if(n.length>0){a=e;let t=uv(n,l),r=i!==null&&s.some(e=>e.heard>=2&&je(i.motif,e.motif)!==null);t&&(l.has(t)||!r)&&(i={motif:t.motif,source:t.source,bar:e,level:t.level})}else i&&a!==null&&e-a>lv.forgetAfter&&(i=null,o=`silence`);return{carried:{offer:i,lastPlayed:a,memory:s},output:{bar:e,judgements:n,offer:i,forgot:o,recognised:c}}}},hv=lv.fewest;function gv(e,t){let n=/* @__PURE__ */ new Map;for(let{step:t,note:r}of e)(!n.has(t)||r>n.get(t))&&n.set(t,r);let r=[...n.entries()].sort(([e],[t])=>e-t);if(!r.length)return[];let i=ot(t),a=Ke(i,r[0][1]).degree;return r.map(([e,t])=>{let{degree:n,accidental:r}=Ke(i,t);return{step:e,degree:n-a,alter:r}})}let _v=e=>e.map(e=>`${e.step}:${e.degree}:${e.alter}`).join(` `);function vv(e,t){let n=e=>`${e.step}:${e.degree}:${e.alter}`,r=/* @__PURE__ */ new Map;for(let t of e)r.set(n(t),(r.get(n(t))??0)+1);let i=0;for(let e of t){let t=n(e);(r.get(t)??0)>0&&(r.set(t,r.get(t)-1),i++)}return e.length+t.length-2*i}function yv(e,t){return bv(e).flatMap(e=>Array.from({length:Math.ceil(e.length/4)},(n,r)=>Sv(xv(e.slice(r*4,(r+1)*4)),t)))}function bv(e){let t=[...e].filter(e=>e.notes.length>=hv).sort((e,t)=>e.bar-t.bar),n=[];for(let e of t){let t=n.at(-1),r=t?.at(-1);t&&r&&e.origin!==void 0&&r.origin!==void 0&&e.bar===r.bar+1?t.push(e):n.push([e])}return n}function xv(e){let t=(e,t)=>e.origin===t.origin&&vv(e.notes,t.notes)<=2,n=[...Array(e.length).keys()].map(e=>e+1).find(n=>e.length%n===0&&e.every((r,i)=>i<n||t(r,e[i-n])))??e.length;return e.slice(0,n).map((t,r)=>e.filter((e,t)=>t%n===r).reduce((e,t)=>(t.confidence??1)>(e.confidence??1)?t:e,t))}function Sv(e,t,n=0){let r=e[0].origin??0;return e.flatMap((e,i)=>e.notes.map(a=>({...a,step:a.step+i*t,degree:a.degree+(e.origin??0)-r+n})))}function Cv(e,t,n){let r=[{tap:`1m`,size:n},{tap:`2n`,size:8},{tap:`4n`,size:4},{tap:`8n`,size:2},{tap:`16n`,size:1}].find(r=>t%r.size===0&&n%r.size===0&&e.every(e=>e.step%r.size===0)),i=new Map(e.map(e=>[e.step,e])),a=e=>`${e.degree}${(e.alter>0?`#`:`b`).repeat(Math.abs(e.alter))}`,o=Array.from({length:t/r.size},(e,t)=>i.has(t*r.size)?a(i.get(t*r.size)):`~`);return`&lead over=&key step=${r.tap} ${o.join(` `)}`}function wv(e,t,n){let r=xv(e),i=r[0]?.origin;if(r.length<2||r.length>8||i===void 0)return null;let a=Sv(r,t),o=ov(Cv(Sv(r,t,(i%7+7)%7),r.length*t,t),`lead`,n);return o.form===null?null:{notes:a,text:o.text}}function Tv(e,t,n){let r=bv(e).flatMap(e=>{let r=n===void 0?null:wv(e,t,n);return r?[r]:yv(e,t).map(e=>({notes:e}))}),i=/* @__PURE__ */ new Map;for(let e of r){let t=e.text??_v(e.notes),n=i.get(t);n?n.count++:i.set(t,{count:1,first:e})}let a=e=>Math.floor(e.notes.at(-1).step/t),o=null;for(let e of i.values())(!o||e.count>o.count||e.count===o.count&&a(e.first)>a(o.first))&&(o=e);return o?o.first:null}let Ev=`lead`;function Dv(e,t,n,r,i,a=[],o=[],s){return pm(e,Zp(t),n,r,(e,t)=>e!==null&&(e.bars===1||e.bars<=8&&(i?.filed.some(e=>e.fragment.id===t)??!1)),i,a,o,s)}function Ov(e,t){let n=[...e].sort((e,t)=>e.step-t.step),r=n.length===0||n[0].step>0;return{cycle:t,onsets:[...r?[0]:[],...n.map(e=>e.step)],degrees:[...r?[null]:[],...n.map(e=>e.degree)],accidentals:[...r?[0]:[],...n.map(e=>e.alter)]}}function kv(e,t,n,r,i){let a=t===void 0?null:e.read(t,n,i);if(!a||!a.notes.length||a.bars>8)return null;if(a.bars>1)return Array.from({length:a.bars},(e,t)=>Ov(a.notes.filter(e=>e.step>=t*r&&e.step<(t+1)*r).map(e=>({...e,step:e.step-t*r})),r));let o=e.phrase?.(a.notes,n);return!o||o.bars<2?[Ov(a.notes,r)]:Array.from({length:o.bars},(e,t)=>Ov(o.notes.filter(e=>e.step>=t*r&&e.step<(t+1)*r).map(e=>({...e,step:e.step-t*r})),r))}Object.entries(S).filter(([e])=>e!==`harmonics`).map(([e,{stack:t}])=>({name:e,tones:new Set(t.map(e=>e%12)),size:t.length}));function Av(e){return e===`bridge`||e===`breakdown`?`B`:e===`build`?`build`:`A`}let jv={aeolian:{0:{5:3,3:3,6:2,4:1,2:1},1:{4:3,6:1},2:{5:2,6:2,3:2,0:1},3:{0:2,4:2,6:2,5:1},4:{0:4,5:1},5:{6:3,2:2,3:2,4:1},6:{0:3,2:3,5:1}},dorian:{0:{3:4,6:2,4:1,2:1},1:{0:2,3:1},2:{3:2,0:1},3:{0:4,6:1},4:{0:2,3:1},5:{0:1,3:1},6:{0:3,3:1}},ionian:{0:{3:3,4:3,5:3,1:1},1:{4:4,6:1},2:{5:3,3:2},3:{4:3,0:2,1:2},4:{0:4,5:2},5:{3:3,1:2,4:1},6:{0:3}},mixolydian:{0:{6:4,3:3,4:1},1:{0:1,6:1},2:{3:1},3:{0:3,6:1},4:{0:2},5:{6:1,3:1},6:{0:3,3:2}},phrygian:{0:{1:3,6:2,3:2,5:1},1:{0:4,6:1},2:{1:2,3:2,0:1},3:{1:2,0:2,6:1},4:{1:1,0:1},5:{1:2,6:2,3:1},6:{0:3,1:2}},lydian:{0:{1:4,4:2,5:2,6:1},1:{0:4,4:1},2:{1:2,5:2},3:{0:1,1:1},4:{0:3,1:2},5:{1:2,4:2},6:{0:2,1:1}},locrian:{0:{1:4,4:2,6:2},1:{0:4,6:1},2:{1:2,6:1},3:{1:2,0:1},4:{1:2,0:2},5:{1:2,4:2},6:{0:3,1:2}}},Mv={aeolian:4,dorian:4,ionian:4,mixolydian:6,phrygian:1,lydian:4,locrian:1},Nv={aeolian:[[0],[0,6],[0,3],[0,5]],dorian:[[0,3],[0],[0,6]],ionian:[[0,3],[0,4],[0,5]],mixolydian:[[0,6],[0,3]],phrygian:[[0,1],[0],[0,6]],lydian:[[0,1],[0],[0,4]],locrian:[[0,1],[0,6]]},Pv=(e,t)=>Nv[e].findIndex(e=>e.join(` `)===t.join(` `));function Fv(e,t){let n=e=>[{step:0,degree:e}],r=t<.15?4:2,i=[0,1,2,3].map(t=>n(e[Math.floor(t/r)%e.length])),a=r===4?[0,1,2,3].map(()=>n(e[1%e.length])):i;return[...i,...a]}let Iv=e=>Math.max(0,Math.min(1,e)),Lv=(e,t)=>[0,1,2,3,4,5,6].map(n=>(e[n]??1e-4)**(1-.7*t)+t*.35),Rv=(e,t)=>l({cycle:7,heights:[t,t+2,t+4]},ot(e)).heights;function zv({seed:t,index:n,kind:r,key:a,harm:o,entropy:s,a:c}){let l=0,u=()=>I(t,`theme`,n,l++),{mode:d}=a,f=e=>[{step:0,degree:e}];if(o<.33){let e=Nv[d],t=Math.floor(u()*e.length);return r!==`A`&&c?.mode===d&&c.vamp===t&&(t=(t+1)%e.length),{kind:r,index:n,mode:d,harm:o,vamp:t,bars:Fv(e[t],o)}}let p=jv[d],m=r===`B`?u()<.5?5:3:r===`build`?3:0,h=Iv((o-.4)*1.6),g=[m];for(let e=1;e<4;e++){if(e===3&&L(u(),o*(1-s*.5)))m=Mv[d];else if(L(u(),h))m=(m+3)%7,m===6&&d===`ionian`&&o<.85&&(m=4);else{let e=Lv(p[m]??{0:1},s);e[m]*=.2,m=vt(u(),e)}m===g[e-1]&&(m=(m+3)%7),g.push(m)}let _=g.map(f),v=Iv((o-.7)/.3)*.7;for(let t=0;t<4;t++){let n=g[t],r=t<3?g[t+1]:0;if(!L(u(),v))continue;if(t===3&&n===4){_[t]=[{step:0,degree:1},{step:8,degree:4}];continue}let[o,,s]=Rv(a,r),c=s-o===6,l=i(o+7,12)===i(e(ot(a),n),12);r!==n&&!c&&!l&&(_[t]=[..._[t],{step:8,dominantOf:r}])}let y=_.map(e=>[...e]);if(L(u(),.25+s*.5)){let e=g[2];y[3]=f(vt(u(),Lv(p[e]??{0:1},s)))}return{kind:r,index:n,mode:d,harm:o,vamp:null,bars:[..._,...y]}}let Bv=`harmony`;function Vv(e,t){let n=Array.from({length:t},()=>[]);for(let{step:t,degree:r,stack:i}of[...e].sort((e,t)=>e.step-t.step))n[Math.floor(t/16)].push({step:t%16,degree:r,...i&&{stack:i}});return n}function Hv(e){if(e.bars!==8||e.notes.some(e=>e.stack))return null;let t=Vv(e.notes,e.bars);if(t.some(e=>e.length!==1||e[0].step!==0))return null;let n=e=>t[e][0].degree,r=n(0),i=n(4);return[1,2,3].some(e=>n(e)!==r)||[5,6,7].some(e=>n(e)!==i)?null:r===i?[r]:[r,i]}let Uv=(e,t)=>e!==null&&e.bars===8&&(t<.33||Hv(e)===null);function Wv(e,{kind:t,index:n,mode:r,harm:i}){let a=Hv(e);if(a){let e=Pv(r,a);return{kind:t,index:n,mode:r,harm:i,vamp:e===-1?null:e,bars:Fv(a,i)}}return{kind:t,index:n,mode:r,harm:i,vamp:null,bars:Vv(e.notes,e.bars)}}function Gv(e,t,n,{at:r,draw:i,a,chosen:o=[],rejected:s=[],layer:c,pull:l}){let{miss:u}=dm(e),d=e.query(Zp(t),n,c,o,u,l).filter(e=>e.distance<=u&&!s.includes(e.id)).map(t=>({...t,read:e.read(t.id,n.meter,c)})).filter(e=>Uv(e.read,r.harm)),f=d[0];if(!f)return;let p=e=>e.score??e.distance,m=p(f)+.25*f.distance+1e-9,h=e=>{let t=Hv(e.read),n=t?Pv(r.mode,t):-1;return n===-1?1/0:n},g=d.filter(e=>p(e)<=m).map((e,t)=>({id:e.id,place:h(e),rank:t})).sort((e,t)=>e.place-t.place||e.rank-t.rank);if(r.kind!==`A`&&g.length===1&&g[0].id===a)return;let _=Math.floor(i*g.length);return r.kind!==`A`&&g[_].id===a&&(_=(_+1)%g.length),g[_].id}function Kv(e){if(e.length!==8||!e[0]||e.filter(e=>e!==null).length<4)return null;let t=[],n=e[0][0].degree;return e.forEach((e,r)=>{if(!e){t.push({step:r*16,degree:n});return}for(let n of e)t.push({step:r*16+n.step,degree:n.degree});n=e.at(-1).degree}),t}function qv(e,t){let n=e.filter(e=>e.bar>=t&&e.bar<t+8);return[...new Set(n.map(e=>e.source))].map(e=>({source:e,bars:Array.from({length:8},(r,i)=>n.find(n=>n.source===e&&n.bar===t+i)?.slots??null)}))}let Jv={kick:36,rim:37,snare:38,clap:39,closedHat:42,pedalHat:44,openHat:46,ride:51},Yv=[`drumHit`,`drumVariation`],Xv={kick:0,backbeat:1,ghost:2,hat:3,ride:4,open:5,pedal:6,fill:7,euclid:8},Zv=[1,0,0,.7,0,0,.6,0,0,0,.8,.35,0,0,.45,0],Qv=[0,.3,0,.4,0,.2,0,.6,0,.5,0,.3,0,.2,0,.5],$v=e=>Math.max(0,Math.min(1,e)),ey=(e,t,n)=>e+(t-e)*n,ty=e=>{let t=$v(e);return t*t*(3-2*t)};function ny(e){let t=e.heights.length;return Array.from({length:t},(e,t)=>t).filter(e=>t<=3?e>0:e%2==1)}function ry(e,t=`cycle`){let{seed:n,bar:r,barInSection:i,style:a,barEnergy:s,meter:c}=e,{section:l}=e.plan,{sync:u,artic:f,harm:p,entropy:m}=a,h=Om(e.swing),g=i===7,_=ty((s-.05)/.5),v=(t,i,a)=>L(ht(n,Yv,Xv[t],l.index,r,i,m,e.restless),a),y=F(c),b=ye(c).heights,x=new Set(b),S=Se(c),C=new Set(ny(c).map(e=>b[e])),w=e=>new Set(b.filter(e).map(e=>e+2)),T=w(e=>C.has(e)),E=w(e=>!C.has(e)),D=Mp(y),O=zm(Zv,c,t,r),k=zm(Qv,c,t,r),A=/* @__PURE__ */ new Map,j=(e,t,n)=>{let r=e*128+t,i=A.get(r);(!i||kp.indexOf(n)<kp.indexOf(i.role))&&A.set(r,{part:`drums`,role:n,step:e,note:t,length:1})},M=()=>[...A.entries()].sort(([e],[t])=>e-t).map(([,e])=>e);if(l.type===`breakdown`){if(s>.2)for(let e of b)j(e+2,h>.5?Jv.ride:Jv.closedHat,`hat`);if(g)for(let e=D;e<y;e++)j(e,Jv.snare,`fill`);return M()}let ee=$v((s-.45)*3)*(1-h)*(1-u*.7),te=$v(f*(1-h)*(1-p)*1.3-.25)*_,ne=ee,N=Array.from({length:y},(e,t)=>t===0?1:x.has(t)?S[t/2]===`half`&&b.length>=4?.9:ne:0);for(let e=0;e<y;e++){let t=ey(N[e],O[e],u)*(e===0?1:_)*(1-.55*h);v(`kick`,e,t)&&j(e,Jv.kick,`kick`),C.has(e)?s>.25&&v(`backbeat`,e,1-.8*h)&&j(e,Jv.snare,`backbeat`):v(`ghost`,e,k[e]*u*_*.9+h*.12*_)&&j(e,Jv.snare,`ghost`);let n=e%2==0?$v(.15+s*1.1):$v((s-.55)*2.5)*(1-h);if(h>0&&(x.has(e)&&(n=Math.max(n,h)),T.has(e)&&(n=Math.max(n,h*.95)),E.has(e)&&(n*=1-.7*h)),n*=Math.max(_,h*.8),v(`hat`,e,n)){let t=e%2==0&&!x.has(e)&&v(`open`,e,te)?Jv.openHat:v(`ride`,e,h)?Jv.ride:Jv.closedHat;j(e,t,`hat`)}h>.3&&C.has(e)&&v(`pedal`,e,h)&&j(e,Jv.pedalHat,`pedal`)}if(v(`euclid`,0,u*_*(1-.7*h)*1.3)){let e=[3,5,7][Math.min(2,Math.floor(s*3))],t=Math.floor(I(n,`drumEuclid`,l.index)*4*u);for(let n of o(d(e,y,t)))j(n,Jv.rim,`euclid`)}if(g&&(l.type===`build`||v(`fill`,0,.35+.3*u))){let e=l.type===`build`?D:Np(y);for(let t=e;t<y;t++)j(t,Jv.snare,`fill`)}return M()}function iy(e,t=Ap){return 60*_e(t)/(e*F(t))}Bp(2);let ay=Array(12).fill(0);function oy(e,t){return sv(e,.85,sy(t))}function*sy(e){for(let[t,{slot:n,chord:r}]of e.entries()){let i=((e[t+1]?.slot.step??jp)-n.step)/jp;for(let e of new Set(w(r).map(e=>u(e,12))))yield[e,i]}}let cy=new Map(rt.map(e=>[e,o(N(e))]));function ly(e,t){let n=0;for(let r of cy.get(t.mode))n+=e[(r+t.tonic)%12];return n}let uy=(e,t,n)=>Math.max(t,Math.min(n,e)),dy=(e,t,n)=>e+(t-e)*n;function fy(e,t,n){let{type:r}=e.plan.section,i=F(e.meter),a=Mp(i);if(r===`breakdown`)return t===`fill`?45+(n-a)*9:55;switch(t){case`kick`:return n===0||n===a?112:92;case`backbeat`:return n===ye(e.meter).heights[ny(e.meter).at(-1)]?106:100;case`ghost`:return 32+14*e.style.sync;case`hat`:return py(e,n)?78:n%2==0?66:50;case`pedal`:return 58;case`euclid`:case`clave`:return 72;case`fill`:{let e=r===`build`?a:Np(i);return 50+(n-e)*(60/(i-e))}}}let py=(e,t)=>ye(e.meter).heights.includes(t);function my(e,t){let{style:n,barEnergy:r,plan:i}=e,{step:a}=t;switch(t.part){case`drums`:return fy(e,t.role,a)*(.65+.35*r);case`bass`:return i.section.type===`breakdown`?70:(py(e,a)?100:84)*(.75+.25*r);case`stab`:return 70+20*r;case`pad`:{let e=i.section.type===`breakdown`||r<.3?Math.max(.85,1-n.artic):1-n.artic;return 48+30*r*(.5+e/2)}case`lead`:return py(e,a)?100:82}}function hy(e,t){let{artic:n}=e.style,{part:r,length:i}=t;switch(r){case`drums`:return i;case`bass`:return e.plan.section.type===`breakdown`?i-.3:Math.max(.3,i*uy(1.02-.7*n,.3,1));case`pad`:return i;case`stab`:return i*dy(2.5,.45,n);case`lead`:return Math.max(.3,i*uy(1.05-.75*n,.25,1))}}let gy=kp.filter(e=>e!==`clave`),_y=e=>e.hits.every(e=>!gy.includes(e.role));function vy(e,t,n,r,i,a=[],o=[],s){let c=Zp(t),{hold:l,layer:u}=e.margins??{hold:.02,layer:.1},d=pm(e,c,n,r?.rhythmFragment,e=>e===null||!_y(e),i,a,o,s);if(d===void 0)return{};let f=fm(e.layered(c,n,d,i,u+l,a,s).filter(e=>e.distance<=u+l&&!o.includes(e.id)).filter(t=>{let r=e.read(t.id,n.meter,i);return r!==null&&_y(r)}),r?.claveFragment,u,l,l);return f===void 0?{rhythmFragment:d}:{rhythmFragment:d,claveFragment:f}}function yy(e,t,n,r,i,a){return[t.rhythmFragment,t.claveFragment].flatMap(t=>{let o=t===void 0?null:e.read(t,n,a);if(!o)return[];let s=r%o.bars;return o.hits.filter(e=>Math.floor(e.step/i)===s).map(e=>({...e,step:e.step-s*i}))})}let by=e=>e.step*128+e.note;function xy(e){let t=/* @__PURE__ */ new Map;for(let n of e){let e=t.get(by(n));(!e||kp.indexOf(n.role)<kp.indexOf(e.role))&&t.set(by(n),n)}return[...t.values()].sort((e,t)=>e.step-t.step||e.note-t.note)}let Sy=(e,t)=>({part:`drums`,role:e,step:t.step,note:t.note,length:1});function Cy(e,t,n){if(!n.length)return[...t];let r=F(e.meter),i=n.filter(e=>e.step>=0&&e.step<r),a=(e,t)=>t.velocity-e.velocity||e.step-t.step,o=(t,n)=>my(e,n)-my(e,t)||t.step-n.step,s=new Set(t.map(e=>e.role)),c=gy.filter(e=>e!==`fill`&&s.has(e)).flatMap(e=>{let n=t.filter(t=>t.role===e),r=i.filter(t=>t.role===e).sort(a).slice(0,n.length).map(t=>Sy(e,t)),s=new Set(r.map(by)),c=n.filter(e=>!s.has(by(e))).sort(o);return[...r,...c.slice(0,n.length-r.length)]}),l=t.filter(e=>e.role===`fill`),u=i.filter(e=>e.role===`clave`).map(e=>Sy(`clave`,e));return xy([...c,...l,...u])}function wy(e,t,n){let r=/* @__PURE__ */ new Map;for(let{step:t,note:n}of e)(!r.has(t)||n<r.get(t))&&r.set(t,n);return[...r.entries()].sort(([e],[t])=>e-t).map(([e,r])=>{let a=Tt(t,e),o=w(a.chord),s=i(r,12),c=o.findIndex(e=>i(e,12)===s);if(c>=0)return{step:e,chord:0,index:c,alter:0,shift:0};let l=t.find(e=>e.slot.step>a.slot.step)??n[0],u=l&&i(w(l.chord)[0],12);if(u!==void 0){let t=i(s-u+6,12)-6;if(Math.abs(t)<=1)return{step:e,chord:1,index:0,alter:0,shift:t}}return{step:e,chord:0,index:0,alter:0,shift:i(s-o[0]+6,12)-6}})}let Ty=e=>e.map(e=>`${e.step}:${e.chord}:${e.index}:${e.alter}:${e.shift}`).join(` `);function Ey(e){let t=/* @__PURE__ */ new Map;for(let n of e){if(n.length<2)continue;let e=Ty(n),r=t.get(e);r?r.count++:t.set(e,{count:1,first:n})}let n=null;for(let e of t.values())(!n||e.count>n.count)&&(n=e);return n?n.first:null}let Dy={plain:0,pentatonic:1/3,blues:2/3};function Oy(e){return it.filter(t=>e.harm>=Dy[t])}function ky(e){return Oy(e)[0]}function Ay(e){return Math.round(6*e.harm)}function jy(e,t){return .5*km(t)+.3*e.entropy+.2*(1-e.artic)}function My(e){return{tempo:Ny(e),keyReach:Math.max(1,Ay(e)),melodic:Oy(e)}}function Ny(e){let t=.08333333333333333+e.entropy*.25;return{low:Math.max(-t,Math.log2(Kp.bpm.min/e.bpm)),high:Math.min(t,Math.log2(Kp.bpm.max/e.bpm))}}let Py=(e,t,n)=>e*(1-n)+t*n;function Fy(e,t,n,r){return Iy(e,t,n,r)}function Iy(e,t,n,r){let{artic:i}=t;switch(e){case`lead`:return{triangle:1.8*(1-i),square:i,cutoff:1400+2200*r,attack:Py(.04,.006,i)};case`bass`:{let e=Om(n);return{saw:1-e,triangle:1.6*e,cutoff:.6+.6*i,resonance:6-4*e}}case`pad`:case`stab`:return{attack:Py(.3,.01,i),release:Py(.7,.12,i)};case`drums`:return{}}}let Ly=e=>Math.max(1,Math.min(127,Math.round(e)));function Ry(e){let t=Math.round(e);return t>=1&&t<=127?e:e-t+Ly(t)}function zy(e,t,n,...r){return(I(e,t,...r)-.5)*n*24}function By(e,t,n,...r){return 1-I(e,t,...r)*n*.15}function Vy(e,t,n,r,i,a,...o){let s=I(e,`ownAccent`,Op.indexOf(t),i,a,...o);return a%2==1?-s*14*n:r.includes(a)?(s-.5)*2*4*n:s*10*n}let Hy={bass:`bassVelocity`,stab:`stabVelocity`,pad:`padVelocity`,lead:`leadVelocity`},Uy={bass:`bassLength`,stab:`stabLength`,pad:`padLength`,lead:`leadLength`};function Wy(e,t){let{accent:n}=t;return t.part===`lead`?Ry(n===void 0?my(e,t):91+n):Ry(my(e,t)+(n??0))}function Gy(e,{part:t,step:n,note:r},i,a){let{seed:o,bar:s}=e,c=ye(e.meter).heights;return Ly(t===`drums`?i+zy(o,`drumVelocity`,a,s,n,r)+Vy(o,`drums`,a,c,s,n,r):i+(zy(o,Hy[t],a,s,n)+Vy(o,t,a,c,s,n)))}function Ky(e,{part:t,step:n,note:r},i){let{seed:a,bar:o}=e;return t===`drums`?By(a,`drumLength`,i,o,n,r):By(a,Uy[t],i,o,n)}function qy(e,{part:t,step:n,note:r,role:i},a,o){return{part:t,step:n,note:r,length:o,velocity:a,gain:a/127,...Fy(t,e.style,e.swing,e.barEnergy),...i!==void 0&&{role:i}}}function Jy(e,t){let n=jy(e.style,e.swing);return{...qy(e,t,Gy(e,t,Wy(e,t),n),hy(e,t)*Ky(e,t,n)),...t.accent!==void 0&&{accent:t.accent}}}function Yy(e){let t=e.beats.length;return e.beats.map((t,n)=>e.beats.slice(0,n).reduce((e,t)=>e+t,0)/e.unit).filter((e,n)=>t<=3?n>0:n%2==1)}let Xy=(e,t)=>Math.abs(e-t)<1e-9;function Zy(e){if(!e.meter||e.stepWhole===null)return!1;let t=e.meter.pulses/e.meter.unit,n=Yy(e.meter);return e.notes.every(r=>{let i=r.step*e.stepWhole%t;return n.some(e=>Xy(i,e)||Xy(i,e+t))})}let Qy=(e,t)=>e.notes.length>0&&e.notes.every(e=>zc(e.voice.slice(1))===t);function $y(e,t){let n=e.cells.get(t);if(!n?.step)return null;let r=C_(n.step.tap,e.cells.get(n.step.driver)?.meter??null);if(r===null)return null;let i=/* @__PURE__ */ new Map;for(let n of dd(e,t,gi(e)))i.set(n.step,[...i.get(n.step)??[],n.value+n.alter]);if(![...i.values()].some(e=>e.length>1))return null;let a=[...i.keys()].sort((e,t)=>e-t),o=e=>[...e].sort((e,t)=>e-t).join(`,`),s=a.filter((e,t)=>t===0||o(i.get(e))!==o(i.get(a[t-1]))).map(e=>({at:e*r,size:i.get(e).length}));return{lap:n.steps*r,changes:s}}function eb(e,t){if(!e.pitched?.table||e.stepWhole===null)return[];let n=$y(t,e.pitched.table);if(!n)return[];let r=e.steps*e.stepWhole,i=e=>Xy(e%n.lap,0)||Xy(e%n.lap,n.lap),a=1;for(;a<64&&!i(a*r);)a++;return e.notes.flatMap(t=>{let i=t.pitch;if(typeof i.written!=`number`||i.table!==`${e.pitched.table}:0`||i.alter||i.transpose)return[];let o=Array.from({length:a},(i,a)=>(t.step*e.stepWhole+a*r)%n.lap).flatMap(e=>n.changes.filter(t=>Xy(t.at,e)||Xy(t.at+n.lap,e))),s=e=>(i.value%e+e)%e===0;return o.length&&o.every(e=>s(e.size))?[{line:e.name,step:t.step,reason:`root`}]:[]})}function tb(e,t){return e.flatMap(e=>e.pitched?eb(e,t):Qy(e,36)?[{line:e.name,reason:`kick`}]:Qy(e,38)&&Zy(e)?[{line:e.name,reason:`backbeat`}]:[])}let nb=/@(\d+)$/,rb=/^(.+)!(\d+)$/;function ib(e,t){let n=[],r=0;for(let t of e){let e=nb.exec(t),i=rb.exec(t),a=e?Number(e[1]):i?Number(i[2]):1;n.push({start:r,len:a}),r+=a}return r===t?n:null}let ab=/^(label|tags|show|about|title)=/;function ob(e,t,n,r,i,a,o){if(e.form!==`steps`||e.levels||e.euclid||!i.length)return null;let s=ib(t,e.steps);if(!s)return null;let c=e.name,l=e.steps,u=s.length,d=k_(e,e.notes),f=k_(e,i),p=(e,t,n=f)=>n.slice(e,t).filter(e=>e!==null),m=n.filter(e=>!ab.test(e)),h=[...a].sort((e,t)=>e-t),g=(e,t)=>{let n=[],r=0;for(let e=0;e<l;e++){let i=t(e);if(i===null){d[e]!==null&&r++;continue}r&&n.push(r===1?`=`:`=!${r}`),n.push(i),r=0}return{form:`base=${e} ${n.join(` `)}`.trim(),line:t=>`&${t} base=${e} ${n.join(` `)}`.trim()}},_=e=>e===u-1&&u>1?`-1`:String(e),v=(e,t)=>e===0&&t===u?c:t-e===1?`${c}[${_(e)}]`:e===0?`${c}[:${t===u-1?`-1`:t}]`:t===u?`${c}[${_(e)}:]`:`${c}[${e}:${t}]`,y=(e,t)=>{let n=s.findIndex(t=>t.start===e),r=s.findIndex(e=>e.start===t);return n<0||r<0&&t!==l?null:[n,r<0?u:r]},b=(e,t,n)=>{let r=y(e,t);return r?[n(v(...r))]:p(e,t)},x=e=>{let t=e.join(` `);return{form:t,line:e=>[`&${e}`,...m,t].join(` `)}},S=null;if(r===`rotate`)s.at(-1).len===1&&(S={form:`${c}[<<]`,line:e=>`&${e} [${c}[<<]]`});else if(r===`transpose`)S=h.length?g(`${c}^${o}`,e=>a.has(e)?d[e]:null):x([`${c}^${o}`]);else if(r===`invert`){let e=e=>o?`degree(inverse(${e}), ${o})`:`inverse(${e})`,t=[],n=0;for(let r of[...h,l])r>n&&t.push(...b(n,r,e)),r<l&&t.push(...b(r,r+1,e=>e)),n=r+1;S=x(t)}else if(r===`reverse`){if(!h.length)S=x([`${c}[::-1]`]);else{let e=h[0]>0,t=e?p(0,h[0]):[];for(let[n,r]of h.entries()){t.push(...b(r,r+1,e=>e));let[i,a]=[r+1,h[n+1]??l],o=y(i,a);a<=i||(e&&n===h.length-1?t.push(...p(i,a)):a-i===1?t.push(...b(i,a,e=>e)):o?t.push(`${c}[${o[1]===u?``:o[1]-1}:${o[0]-1}:-1]`):t.push(...p(i,a)))}S=x(t)}}else S=g(c,e=>d[e]===f[e]?null:f[e]);return!S||!S.form.includes(c)?null:S.line(e.trigger).length<=[c,...m,...p(0,l)].join(` `).length?S:null}let sb=[`rotate`,`drop`,`add`],cb=[`transpose`,`invert`,`reverse`,`bend`,`trim`],lb=[-2,-1,1,2],ub=[-2,-1,1,2];function db(e,t=``){let n=new Set(Nf(e).map(e=>e.name)),r=[...Nf(t).filter(e=>!n.has(e.name)).map(e=>e.written),e].join(`
`),i=yf(r);if(!i.ok)return{lines:[],anchors:[],result:null,own:n};let a=T_(r,i);return{lines:a,anchors:tb(a,i),result:i,own:n}}let fb=e=>e.startsWith(`&`)?e:`&${e}`,pb=(e,t)=>mb(e,t).variations.map(e=>e.variation);function mb(e,t={}){let{workbench:n,operators:r=sb,keep:i=[],fewest:a=1,degrees:o=lb}=t,{lines:s,anchors:c,result:l,own:u}=db(e,n);if(!l)return{notes:null,span:null,bar:null,variations:[]};let d=/* @__PURE__ */ new Set([...c.filter(e=>e.step===void 0).map(e=>e.line),...i.map(fb)]),f=(e,t)=>c.some(n=>n.line===e.name&&n.step===t.step),p=(e,t)=>{let n=s[e].stepWhole;return n===null?`${e}@${t}`:(t*n).toFixed(9)},m=e=>String(zc(e.slice(1))??e),h=e=>e.pitch?` ${o_(e.pitch)}`:``,g=(e,t)=>t.map(t=>`${p(e,t.step)} ${s[e].stepWhole??e} ${t.voice}${h(t)}`),_=(e,t)=>t.map(t=>`${p(e,t.step)} ${m(t.voice)}${h(t)}`),v=new Map([...new Set(s.flatMap(e=>e.pitched?[e.pitched.voice]:[]))].map((e,t)=>[e,`voice#${t}`])),y=(e,t)=>{let{stepWhole:n,name:r}=s[e];return t.map(e=>{let t=`${n??r} ${e.pitch?`${v.get(e.voice)} ${o_(e.pitch)}`:m(e.voice)}`;return n===null?{at:null,key:`${r}@${e.step} ${t}`}:{at:e.step*n,key:t}})},b=s.map((e,t)=>y(t,e.notes)),x=gb(l,u,s),S=[...s.map(e=>e.stepWhole===null?null:e.steps*e.stepWhole),...x.map(e=>e.lap)],C=s.find(e=>e.meter)?.meter??x.find(e=>e.meter)?.meter??null,w=S.length&&S.every(e=>e!==null)?S.reduce((e,t)=>hb(e,t)):null,T=C?C.pulses/C.unit:null,E=x.flatMap(e=>e.notes),D=s.map((e,t)=>g(t,e.notes)),O=s.map((e,t)=>_(t,e.notes)),k=s.reduce((e,t)=>e+t.notes.length,0),A=/* @__PURE__ */ new Map,j=e=>{let t=A.get(e);if(!t){let n=s.flatMap((t,n)=>n===e?[]:O[n]),r=new Set(n);t={keys:s.flatMap((t,n)=>n===e?[]:D[n]).sort(),strikes:r.size<n.length?null:r},A.set(e,t)}return t},M=(e,t)=>{let n=j(e).keys,r=e<0?[]:g(e,t).sort(),i=[],a=0,o=0;for(;a<n.length||o<r.length;)i.push(o>=r.length||a<n.length&&n[a]<=r[o]?n[a++]:r[o++]);return i.join(`|`)},ee=(e,t)=>{let n=j(e).strikes;if(!n)return!1;let r=/* @__PURE__ */ new Set;for(let i of _(e,t)){if(n.has(i)||r.has(i))return!1;r.add(i)}return!0},te=/* @__PURE__ */ new Set([M(-1,[])]),ne=[],N=/* @__PURE__ */ new Map,re=t=>(N.has(t)||N.set(t,ar(e,t)),N.get(t)),P=(e,t,n,r,i,o,c=r)=>{if(!i||k-s[e].notes.length+n.length<a||!ee(e,n))return;let l=M(e,n);if(te.has(l))return;te.add(l);let u=s[e].name,d=(e,t)=>{let n=re(e);return n?[...n.head,...n.attrs,...t??n.braid].join(` `):``},p=re(s[e].trigger),m=new Set(s[e].notes.filter(n=>f(s[e],n)&&!(t===`invert`&&n.pitch?.written===(c??0)/2&&!n.pitch.alter)).map(e=>e.step)),h=p&&ob(s[e],p.braid,p.attrs,t,n,m,c),g={id:`vary:${t}:${u}${r===null?``:`:${r}`}:${ne.length}`,tool:`vary`,rule:t,title:`${u}: ${o}`,before:[...i.keys()].map(e=>d(e)).join(`
`),after:[...i].map(([e,t])=>d(e,t)).join(`
`),apply:e=>[...i].reduce((e,[t,n])=>sr(e,t,n),e),line:u,by:`${t} ${u}${r===null?``:` ${r}`}`,...h?{reference:h}:{}};ne.push({variation:g,notes:[...s.flatMap((t,r)=>r===e?y(e,n):b[r]),...E]})},ie=e=>e.sort((e,t)=>e.step-t.step||c_(e.voice)-c_(t.voice)),ae=e=>{let t=s[e].notes[0];return[t.step*(s[e].stepWhole??1),c_(t.voice)]},oe=s.map((e,t)=>t).filter(e=>s[e].notes.length>0&&!d.has(s[e].name)).sort((e,t)=>ae(e)[0]-ae(t)[0]||ae(e)[1]-ae(t)[1]);for(let e of oe){let t=s[e],n=t.levels?.tokens,[i,a]=t.notes.slice(-2),c=t.notes.length>=2&&!f(t,a);for(let s of r)if(cb.includes(s)===!!t.pitched&&(!t.notes.some(e=>e.hold)||[`transpose`,`invert`].includes(s))){if(s===`bend`){if(c)for(let n of ub){let r=t.notes.map(e=>e===a?{...e,pitch:a_(i.pitch,1,n)}:e);P(e,s,r,n,A_(t,r),`its last note bent to ${Math.abs(n)} degree${Math.abs(n)===1?``:`s`} ${n>0?`above`:`below`} the one before it`)}}else if(s===`trim`){if(!c||t.notes.length-1<2)continue;let n=t.notes.filter(e=>e!==a);P(e,s,n,a.step,A_(t,n),`its last note, on step ${a.step}, left out: the one before it held`)}else if(s===`transpose`)for(let n of o){let r=t.notes.map(e=>f(t,e)?e:{...e,pitch:a_(e.pitch,1,n)});P(e,s,r,n,A_(t,r),`every note ${n>0?`up`:`down`} ${Math.abs(n)} degree${Math.abs(n)===1?``:`s`}`)}else if(s===`invert`){let{written:n,alter:r}=t.notes[0].pitch;if(typeof n!=`number`||r)continue;let i=t.notes.map(e=>f(t,e)?e:{...e,pitch:a_(e.pitch,-1,2*n)});P(e,s,i,null,A_(t,i),`every note mirrored about its first`,2*n)}else if(s===`reverse`){let n=ie(_b(t,e=>f(t,e)));P(e,s,n,null,A_(t,n),`its notes in reverse order between its anchors`)}else if(s===`rotate`){let r=ie(t.notes.map(e=>({...e,step:(e.step+1)%t.steps})));P(e,s,r,null,A_(t,r,n&&[n.at(-1),...n.slice(0,-1)],!0),`every note a step later, the last to the first`)}else if(s===`drop`)for(let n of t.notes){let r=t.notes.filter(e=>e!==n);P(e,s,r,n.step,A_(t,r),`its ${n.voice} on step ${n.step} left out`)}else{let r=t.notes[0].voice,i=t.notes.reduce((e,t)=>t.level>e.level?t:e);for(let a=0;a<t.steps;a++){if(t.notes.some(e=>e.step===a&&m(e.voice)===m(r)))continue;let o=ie([...t.notes,{step:a,voice:r,own:i.own,level:i.level}]),c=n&&n.map((e,t)=>t===a?n[i.step]:e);P(e,s,o,a,A_(t,o,c),`a ${r} on step ${a}, as loud as its loudest`)}}}}return{notes:[...b.flat(),...E],span:w,bar:T,variations:ne}}function hb(e,t){let n=(e,t)=>t?n(t,e%t):e,[r,i]=[Math.round(e*3840),Math.round(t*3840)];return r&&i?r/n(r,i)*i/3840:Math.max(e,t)}function gb(e,t,n){let r=new Set(n.flatMap(e=>[e.trigger,e.card.name,...e.levels?[e.levels.cell]:[]])),i=[];for(let n of t){let t=e.cells.get(n);if(!t?.step||r.has(n)||t.voice)continue;let a=e.cells.get(t.step.driver)?.meter??null,o=C_(t.step.tap,a);if(o===null)continue;let s=dd(e,n,gi(e)),c=/* @__PURE__ */ new Map;for(let e of s)c.set(e.step,(c.get(e.step)??0)+1);if(![...c.values()].some(e=>e>1))continue;let l=i.length,u=s.map(e=>({at:e.step*o,key:`${o*e.duration} chords#${l} ${e.table}:${e.tableShift}:${e.value}:${e.alter}:${e.transpose??0}`}));i.push({notes:u,lap:t.steps*o,meter:a})}return i}function _b(e,t){let n=new Map(e.notes.map(e=>[e.step,e])),r=e.notes.filter(t).map(e=>e.step),i=[];if(!r.length)i.push(Array.from({length:e.steps},(e,t)=>t));else for(let[t,n]of r.entries()){let a=r[(t+1)%r.length]+(t+1===r.length?e.steps:0);i.push(Array.from({length:a-n-1},(t,r)=>(n+1+r)%e.steps))}let a=e.notes.filter(t);for(let e of i)for(let[t,r]of e.entries()){let i=n.get(e[e.length-1-t]);i&&a.push({...i,step:r})}return a}function vb(e,t){if(!(e>=0&&e<1))throw Error(`varied: draw ${e} is outside [0, 1)`);return Math.floor(e*t)}let yb=.1,bb=/&([A-Za-z_][A-Za-z0-9_]*)/g,xb=e=>{let t=Ko(e);return new Set(t?[...t.names,...t.optional,...t.main?[t.main]:[]].map(e=>e.slice(1)):[])},Sb=e=>{let t=xb(e);return[...new Set(Nf(e).map(e=>e.name))].filter(e=>!t.has(e))};function Cb(e){let t=new Map(Sb(e).map((e,t)=>[e,t+1]));return Nf(e).map(e=>e.code.replace(bb,(e,n)=>t.has(n)?`&#${t.get(n)}`:e)).join(`
`)}function wb(e,t){if(Cb(e)!==Cb(t))return null;let n=Sb(t);return new Map(Sb(e).flatMap((e,t)=>e===n[t]?[]:[[`&${e}`,`&${n[t]}`]]))}let Tb=e=>Math.round(e*1e9)/1e9;function Eb(e,t,n,r,i){let a=t.filed.find(e=>e.fragment.id===n)??t.filed.find(e=>ys(e.fragment,n)!==void 0),o=a&&a.fragment.id!==n?ys(a.fragment,n):void 0,s=a?a.fragment.association:e.fragments.find(e=>e.id===n).association,c=s.flatMap((e,t)=>!a||bs(e,o)?[{wp:e,own:t}]:[]);t.points.forEach((e,t)=>{e.id===n&&c.push({wp:e,row:t})});let l=new Set(op({id:n,text:`-`,association:c.map(e=>e.wp)},i)),u,d=1/0;for(let e of c){let t=l.has(e.wp)?ap(e.wp.point,r)/e.wp.weight:1/0;t<=d&&t<1/0&&([u,d]=[e,t])}if(!u)return Db(t,n,a,{point:{...r},weight:yb,...i===void 0?{}:{facet:i},...o?{args:o}:{}});let{wp:f}=u;if(f.weight>=1.2)return t;let p=Tb(Math.min(1.2,f.weight+.1));if(u.row!==void 0)return{...t,points:t.points.map((e,t)=>t===u.row?{...e,weight:p}:e)};if(!a)return Db(t,n,a,{...f,weight:p});let m=s.map((e,t)=>t===u.own?{...e,weight:p}:e);return{...t,filed:t.filed.map(e=>e===a?{...e,fragment:{...e.fragment,association:m}}:e)}}function Db(e,t,n,r){if(!n)return{...e,points:[...e.points,{id:t,...r}]};let i={...n.fragment,association:[...n.fragment.association,r]};return{...e,filed:e.filed.map(e=>e===n?{...e,fragment:i}:e)}}function Ob(e,t){let n=[...new Set(t)].sort(up);if(n.length<2)return e;let r=[...e.together],i=new Map(r.map((e,t)=>[JSON.stringify(e.ids),t]));for(let e=0;e<n.length;e++)for(let t=e+1;t<n.length;t++){let a=[n[e],n[t]],o=JSON.stringify(a),s=i.get(o);s===void 0?(i.set(o,r.length),r.push({ids:a,count:1})):r[s]={ids:a,count:r[s].count+1}}return{...e,together:r}}function kb(e,t,n){let r=new Set(e.merge(t).fragments.map(e=>e.id)),i=n.filter(e=>!r.has(e.id)).map(e=>`'${e.id}'`);if(i.length)throw Error(`useFragments: no fragment ${i.join(`, `)}`);let a=Ob(t,n.map(e=>e.id));for(let{id:t,point:r,facet:i}of n)r&&(a=Eb(e,a,t,r,i));return a}function Ab(e,t,n){let{text:r,point:i,facet:a,source:o,created:s,meta:c={},prose:l=``}=n,u=[];(typeof o!=`string`||!o.trim())&&u.push(`no source`),(typeof s!=`string`||!s.trim())&&u.push(`no created`);let d=[`id`,`association`,`source`,`created`].filter(e=>Object.hasOwn(c,e));d.length&&u.push(`its meta names ${d.join(`, `)}, which filing writes itself`);let f=[{point:{...i},weight:yb,...a===void 0?{}:{facet:a}}];if(u.push(...np({id:n.id??`filed`,text:r,association:f})),u.length)throw Error(`fileFragment: ${u.join(`; `)}`);let p=e.merge(t);for(let n of p.fragments){let o=wb(r,n.text);if(o)return{layer:Eb(e,t,n.id,i,a),id:n.id,file:null,renamed:o}}let m=/* @__PURE__ */ new Set([...p.fragments.map(e=>e.id),...p.unheld]);if(n.id!==void 0&&m.has(n.id))throw Error(`fileFragment: the id ${n.id} is taken`);let h=n.id??`${o} ${s}`;for(let e=2;m.has(h);e++)h=`${o} ${s} ${e}`;let g={fragment:{id:h,text:r,association:f},meta:{source:o,created:s,...c},prose:l};return{layer:{...t,filed:[...t.filed,g]},id:h,file:g,renamed:/* @__PURE__ */ new Map}}function jb(e){let t=e.length;for(let n=0;n<e.length;n++){let r=e.charCodeAt(n);r<128||(r<2048?t+=1:r>=55296&&r<56320&&(e.charCodeAt(n+1)&64512)==56320?(t+=2,n++):t+=2)}return t}let Mb=e=>jb(JSON.stringify(e));function Nb(e,t=16e3){if(Mb(e)<=t)return e;let{filed:n,points:r,together:i}=e,a=()=>Mb({filed:n,points:r,together:i});for(;r.length>0&&a()>t;)r=r.slice(1);for(;i.length>0&&a()>t;)i=i.slice(1);for(;n.length>0&&a()>t;)n=n.slice(1);return{filed:n,points:r,together:i}}function Pb(e,t,n){return n.filter(n=>e.fragments.some(e=>e.id===n)||t.filed.some(e=>e.fragment.id===n))}let Fb=[`gm_kit`,`bass`,`keys`,`pad`,`lead`],Ib={bass:{voice:`bassV`,own:`bass`},pad:{voice:`padV`,own:`pad`},stab:{voice:`keysV`,own:`keys`},lead:{voice:`leadV`,own:`lead`}},Lb=/* @__PURE__ */ new WeakMap;function Rb(e,t=F_){let n=Lb.get(t);n||Lb.set(t,n=fp(t));let r=n.query(Zp(e),t.length,{},{facet:`instrument`}),i={};for(let[e,{voice:t,own:n}]of Object.entries(Ib))for(let{fragment:a}of r){let r=a.text.split(`
`).find(e=>e.startsWith(`&${t} `));if(r!==void 0){a.id!==n&&(i[e]={id:a.id,line:r});break}}return i}let zb=(()=>{let e=/* @__PURE__ */ new Map,t=[...F_].sort((e,t)=>Bb(e.id)-Bb(t.id)||e.id.localeCompare(t.id));for(let n of t)for(let t of n.text.split(`
`)){let n=/^&(\w+)\s/.exec(t)?.[1];n!==void 0&&!e.has(n)&&e.set(n,t)}return e})();function Bb(e){let t=Fb.indexOf(e);return t===-1?Fb.length:t}let Vb=e=>new Set(e.split(`
`).flatMap(e=>/^&(\w+)/.exec(e)?.[1]??[])),Hb=e=>new Set(e.split(`
`).flatMap(e=>[...e.replace(/^&\w+/,``).matchAll(/&(\w+)/g)].map(e=>e[1])));function Ub(e){let t=Vb(e),n=Hb(e);return[...zb].flatMap(([e,r])=>n.has(e)&&!t.has(e)?[r]:[])}function Wb(e){let t=e;for(let n of e.split(`
`)){let e=/^&(\w+)\s/.exec(n)?.[1],r=e===void 0?null:zc(e);r!==null&&/\ss=/.test(n)&&!/\snote=/.test(n)&&(t=$n(t,e,`note`,String(r)))}return t}function Gb(e){let t=Wb(e),n=Ub(t);return n.length?`${t}\n${n.join(`
`)}`:t}let Kb=e=>Object.keys(ge).find(t=>Pp(ge[t],e))??null,qb=e=>`${e.cycle}:${e.heights.join(` `)}`;function Jb(e,t){return[{tap:`1m`,length:t},{tap:`2n`,length:8},{tap:`4n`,length:4},{tap:`8n`,length:2}].find(n=>t%n.length===0&&e.every(e=>e%n.length===0))??{tap:`16n`,length:1}}function Yb(e){let{facet:t,fragments:n,read:r,bars:i=1}=e,a=e.vary,o=fp([...n,...I_]),s=new Map(n.map(e=>[e.id,e.text])),c=(e,t)=>s.get(e)??t?.filed.find(t=>t.fragment.id===e)?.fragment.text,l=({fragment:e})=>e.association.some(e=>e.facet===t),u=/* @__PURE__ */ new Map,d=/* @__PURE__ */ new Map,f=(e,t)=>{let n=`${e}\n${qb(t)}`;return u.has(n)||u.set(n,r(e,t)),u.get(n)},p=(e,t)=>{let n=`${t}\n${e}`;if(!d.has(n)){if(!a)d.set(n,[]);else{let r=a(t),i=[r.workbench??[],Ub(e)].flat().join(`
`);d.set(n,pb(e,{...r,workbench:i}))}}return d.get(n)},m=(e,r,i,a,c)=>o.query(e,n.length+I_.length+(r?.filed.length??0),{},{facet:t,...r?{layer:r}:{},...i.length?{chosen:i}:{},...c===void 0?{}:{pull:c}}).filter(e=>s.has(e.fragment.id)||e.distance<=a);return{query(e,t,n,r=[],i=1/0,a){return m(e,n,r,i,a).filter(e=>f(e.fragment.text,t.meter)!==null).map(e=>({id:e.fragment.id,distance:e.distance,score:e.score}))},used:(e,n,r,i=[])=>Nb(kb(o,e,[...Pb(o,e,n).map(e=>({id:e,point:r,facet:t})),...Pb(o,e,i).map(e=>({id:e}))])),file(n,{notes:r,text:a,bench:s,point:c,source:l,created:d,tags:f,varies:p,by:m}){let h=a??e.text(r,F(s.meter)),g=Ab(o,n,{text:h,point:c,facet:t,source:l,created:d,meta:{tags:[...f],...p===void 0?{}:{varies:p},...m===void 0?{}:{by:m}}}),{meterFragment:_}=s,v=_===void 0?g.layer:kb(o,g.layer,[{id:g.id},{id:_}]),y=`${h}\n${qb(s.meter)}`;return g.file&&a===void 0&&!u.has(y)&&u.set(y,{bars:Math.max(i,Math.ceil((Math.max(...r.map(e=>e.step))+1)/F(s.meter))),notes:[...r].sort((e,t)=>e.step-t.step)}),{layer:Nb(v),id:g.id,held:g.file===null}},read(e,t,n){let r=c(e,n);return r===void 0?null:f(r,t)},vary(t,n,i,o){if(!a)return null;let s=c(t,o);if(s!==void 0&&e.varies&&!e.varies(s))return null;let l=Kb(n.meter);if(s===void 0||l===null||f(s,n.meter)===null)return null;let u=p(s,l);if(!u.length)return null;let d=u[vb(i,u.length)],m=r(d.apply(s),n.meter);return m&&{notes:m.notes,by:d.by}},*warm(e,t){let r=[...(t?.filed??[]).filter(l).map(e=>e.fragment.text).reverse(),...n.map(e=>e.text)],i=e.filter((t,n)=>e.findIndex(e=>Pp(e.meter,t.meter))===n);for(let{meter:e}of i){let t=Kb(e);if(t!==null)for(let n of r){if(u.has(`${n}\n${qb(e)}`))continue;let r=f(n,e);yield,a&&r!==null&&r.bars===1&&!d.has(`${t}\n${n}`)&&(p(n,t),yield)}}}}}let Xb={kick:`bd`,rim:`rim`,snare:`sd`,clap:`cp`,closedHat:`hh`,pedalHat:`ph`,openHat:`oh`,ride:`rd`},Zb=new Map([...Object.keys(Xb).map(e=>[Jv[e],Xb[e]]),[75,`claves`]]);function Qb(e){if(e>=127)return`1`;let t=e/127;return(t*t).toFixed(6).replace(/0+$/,``).replace(/^0/,``)}function $b(e,t=jp){let n=e.length;if(n===0||n>=t)return null;let r=[...e].sort((e,t)=>e-t).join(),i=ta(n,t).flatMap((e,t)=>e?[t]:[]);for(let e=0;e<t;e++)if(i.map(n=>(n+e)%t).sort((e,t)=>e-t).join()===r)return{k:n,r:e};return null}let ex=e=>[...e].sort((e,t)=>e.step-t.step||e.note-t.note),tx=e=>e>=127?``:`:0:${Qb(e)}`,nx=(e,t)=>Array.from({length:e},(e,n)=>t(n)).join(` `);function rx(e,t){let{role:n}=e[0],r=new Set(e.map(e=>e.note)),i=n===`euclid`&&r.size===1?$b(e.map(e=>e.step),t):null;if(i){let r=Zb.get(e[0].note),a=t=>e.find(e=>e.step===t)?.velocity;return{lines:[`&${n} step=1m &${r}(${i.k},${t},${i.r})`,`&${n}Level map=amp step=16n ${nx(t,e=>a(e)?Qb(a(e)):`0`)}`],term:`&${n} * &${n}Level`}}return{lines:[`&${n} step=16n ${nx(t,t=>{let n=e.filter(e=>e.step===t).map(e=>`&${Zb.get(e.note)}${tx(e.velocity)}`);return n.length===0?`~`:n.length===1?n[0]:`[${n.join(`,`)}]`})}`],term:`&${n}`}}function ix(e,t){let n=ex(e),r=n.find(e=>!Zb.has(e.note));if(r)throw Error(`grooveText: note ${r.note} is none of the kit's`);let i=kp.filter(e=>n.some(t=>t.role===e)).map(e=>rx(n.filter(t=>t.role===e),t));return[...i.flatMap(e=>e.lines),`&groove ${i.length?`[${i.map(e=>e.term).join(`, `)}]`:`~`}`].join(`
`)}let ax=e=>ex(e).map(e=>`${e.role}:${e.note}:${e.step}`).join(` `);function ox(e){let t=/* @__PURE__ */ new Map;for(let n of e){if(n.length<3)continue;let e=ax(n),r=t.get(e);r?r.count++:t.set(e,{count:1,first:n})}let n=null;for(let e of t.values())(!n||e.count>n.count)&&(n=e);return n?ex(n.first):null}function sx(e,t,n){if(!Zb.has(e))return null;if(e===Jv.kick)return`kick`;if(e===Jv.rim)return`euclid`;if(e===Jv.pedalHat)return`pedal`;if(e!==Jv.snare&&e!==Jv.clap)return`hat`;let r=ye(n).heights;return ny(n).map(e=>r[e]).includes(t)?`backbeat`:`ghost`}let cx=[];function lx(e,t,n=.5){let r=[...e.map(e=>e.id)];for(let e of t)r.includes(e)||r.push(e);let i=sv(r.map(t=>e.find(e=>e.id===t)?.weight??0),n,t.map(e=>[r.indexOf(e),1]));return r.map((e,t)=>({id:e,weight:i[t]})).filter(e=>e.weight>=.25)}let ux=e=>e.map(e=>e.id);function dx({seed:e,index:t,style:n,history:r},i){let a=Ay(n);if(a===0||!L(I(e,`keyJump`,t),n.entropy*.6))return null;let o=A(i.tonic),s=[...Array(12).keys()].filter(e=>{let t=Math.abs(u(A(e)-o+6,12)-6);return t>0&&t<=a}).map(e=>({tonic:e,mode:i.mode})),c=s.map(e=>ly(r,e));return s[vt(I(e,`keyJump`,t,1),cv(c,4))]}function fx({meter:e,swing:t=`16n`,repository:n,style:r,layer:i},a,o){if(e)return{meter:{meter:e,swing:t},found:null};let s=n?Qp(n,r,a?.meterFragment??null,i,o,em(r.entropy)):null;if(s)return{meter:{meter:s.meter,swing:s.swing.level,share:s.swing.share,meterFragment:s.id},found:s};if(n&&a){let{meter:e,swing:t,share:n,meterFragment:r}=a;return{meter:{meter:e,swing:t,...n===void 0?{}:{share:n},...r===void 0?{}:{meterFragment:r}},found:null}}return{meter:{meter:Ap,swing:t},found:null}}function px({repository:e,style:t},n,r){return r&&e?.used?e.used(n,r.id,Zp(t)):n}function mx({rhythms:e,style:t,layer:n},r,i,a=[],o=[]){return e?vy(e,t,{meter:r.meter,meterFragment:r.meterFragment},i,n,a,o,em(t.entropy)):{}}let hx=({seed:e,index:t,session:n},r,i=`groove`)=>({seed:e,index:t,point:r,tags:[i,...n===void 0?[]:[n]]}),gx=`bass line`;function _x(e,t,n,r,i){let a=hm(e.rhythms,`rhythm`,`grooveVariation`,hx(e,Zp(e.style)),t,n,r.rhythmFragment,i);return{rhythm:a.id===r.rhythmFragment?r:{...r,rhythmFragment:a.id},layer:a.layer,playing:a.playing}}function vx(e,t,n,r){return gm(e.rhythms,e.heard??[],e=>{let t=ox(e);return t&&{hits:t}},{meter:n.meter,meterFragment:n.meterFragment},hx({...e,index:e.index-1},r),t)}function yx(e,t,n,r){return gm(e.bassLines,e.bassHeard??[],e=>{let t=Ey(e);return t&&{notes:t}},{meter:n.meter,meterFragment:n.meterFragment},hx({...e,index:e.index-1},r,gx),t)}function bx(e,t,n,r,i){return n!==null&&e?.used?e.used(t,[n],i,r):t}let xx=`lead line`;function Sx(e,t,n,r){return gm(e.leads,e.leadHeard??[],e=>{let t=F(n.meter),r=Tv(e.map(e=>({...e,notes:e.notes.filter(e=>e.step<t)})),t,Kb(n.meter)??void 0);return r?.notes.length?{notes:r.notes,...r.text?{text:r.text}:{}}:null},{meter:n.meter,meterFragment:n.meterFragment},hx({...e,index:e.index-1},r,xx),t)}function Cx({leads:e,style:t,layer:n},r,i,a=[],o=[]){return e?Dv(e,t,{meter:r.meter,meterFragment:r.meterFragment},i,n,a,o,em(t.entropy)):void 0}let wx=`progression`;function Tx(e,t,n){return gm(e.harmonies,e.harmonyHeard??[],e=>{let t=Kv(e);return t&&{notes:t}},n.bench,hx({...e,index:e.index-2},n.point,wx),t)}function Ex({harmonies:e,style:t,layer:n,seed:r,index:i},a,o,s,c,l,u=[]){let d={kind:a,index:i,mode:o.mode,harm:t.harm},f=a===`A`?l.B:a===`B`?l.A:null,p=e?Gv(e,t,s,{at:d,draw:I(r,`theme`,i,0),a:l.A??void 0,chosen:f===null?[]:[f],rejected:u,layer:n,pull:em(t.entropy)}):void 0,m=p===void 0?null:e.read(p,s.meter,n);return p!==void 0&&m?{theme:Wv(m,d),fragment:p}:{theme:zv({seed:r,index:i,kind:a,key:o,harm:t.harm,entropy:t.entropy,a:c.A}),fragment:null}}function Dx({bassLines:e,style:t,layer:n,share:r},i,a,o=[],s=[]){return e?Im(e,t,{meter:i.meter,meterFragment:i.meterFragment},{level:i.swing,share:i.share??r??.5},F(i.meter),a,n,o,s,em(t.entropy)):void 0}let Ox={initial:{before:null,themes:{A:null,B:null},layer:null,shortTerm:cx,asked:null,boredom:$p,claveOwners:rm,bassFragment:null,leadFragment:null,themeFragments:{A:null,B:null},earlier:null},advance(e,{before:t,themes:n,layer:r,shortTerm:i,asked:a,boredom:o,claveOwners:s,bassFragment:c,leadFragment:l,themeFragments:u,earlier:d}){let f=r??e.layer,p=f&&t&&a?vx(e,f,t,a):{layer:f,ids:[]},m=p.layer&&t&&a?yx(e,p.layer,t,a):{layer:p.layer,ids:[]},h=m.layer&&t&&a?Sx(e,m.layer,t,a):{layer:m.layer,ids:[]},g=(h.layer&&d?Tx(e,h.layer,d):{layer:h.layer,ids:[]}).layer,_=lx(i,[...p.ids,...m.ids,...h.ids]),v=ux(_),y={...e,layer:g},{seed:b,index:x,style:S,wish:C}=y,w=jt.advance({seed:b,index:x,style:S},t?.section??null,null).output,T=t?.key??at,E=lt(T,(t&&C.tonic===null&&C.mode===T.mode?dx(y,T):null)??C),D=C.melodic!==null&&My(S).melodic.includes(C.melodic)?C.melodic:ky(S),O=fx(y,t,v),{meterFragment:k}=O.meter,A={meter:O.meter.meter,meterFragment:k},j=am(o,s),M=Av(w.type),ee=M===`build`?null:n[M],te=M===`build`?null:u[M],ne=ee&&ee.mode===E.mode&&Math.abs(ee.harm-S.harm)<=.2&&!L(I(b,`themeRenewal`,x),S.entropy*.3)&&(te===null||!j.includes(te))?{theme:ee,fragment:te}:Ex(y,M,E,A,n,u,j),{theme:N}=ne,re=g?hm(y.harmonies,Bv,`harmonyVariation`,hx(y,Zp(S),wx),g,o,ne.fragment??void 0,A):{playing:null},P=mx(y,O.meter,t,[...v,...k===void 0?[]:[k]],am(o,s)),ie=g?_x(y,g,o,P,{meter:O.meter.meter,meterFragment:k}):{rhythm:P,layer:g,playing:null},{rhythm:ae}=ie,oe=Dx(y,O.meter,c??void 0,[...v,...k===void 0?[]:[k]],am(o,s)),se=ie.layer?hm(y.bassLines,Pm,`lineVariation`,hx(y,Zp(S),gx),ie.layer,o,oe,{meter:O.meter.meter,meterFragment:k}):{id:oe,layer:ie.layer,playing:null},ce=se.id,le=Cx(y,O.meter,l??void 0,[...v,...k===void 0?[]:[k]],am(o,s)),ue=se.layer?hm(y.leads,Ev,`leadLineVariation`,hx(y,Zp(S),xx),se.layer,o,le,{meter:O.meter.meter,meterFragment:k}):{id:le,layer:se.layer,playing:null},de=ue.id,fe={section:w,key:E,...O.meter,...ae,melodic:D,theme:N},pe=[k,ae.rhythmFragment,ae.claveFragment,ce,de].filter(e=>e!==void 0);return{carried:{before:fe,themes:M===`build`?n:{...n,[M]:N},layer:ue.layer?bx(y.harmonies,_m(y.leads,_m(y.bassLines,_m(y.rhythms,px(y,ue.layer,O.found),[ae.rhythmFragment,ae.claveFragment],Zp(S),k),[ce],Zp(S),k),[de],Zp(S),k),ne.fragment,[...k===void 0?[]:[k],...(M===`A`?u.B:M===`B`?u.A:null)??[]].filter(e=>e!==ne.fragment),Zp(S)):null,shortTerm:lx(_,pe,1),asked:Zp(S),boredom:lm(o,[ie.playing,se.playing,ue.playing,re.playing].filter(e=>e!==null),S.entropy),claveOwners:ie.playing?im(s,P):s,bassFragment:ce??null,leadFragment:de??null,themeFragments:M===`build`?u:{...u,[M]:ne.fragment},earlier:a&&t?{point:a,bench:{meter:t.meter,...t.meterFragment===void 0?{}:{meterFragment:t.meterFragment}}}:null},output:fe}}},kx={own:[],players:[]},Ax={plans:Ox.initial,next:null,history:ay,parts:{bass:th.initial,comp:dh.initial,lead:Ph.initial},ear:null};function jx({seed:e,style:t,wish:n,meter:r,swing:i=Em,repository:a,layer:o,rhythms:s,session:c,bassLines:l,leads:u,harmonies:d},f,p,m,h=null){let g=f%8,_=g===0?Ox.advance({seed:e,index:f/8,style:t,wish:n,history:m,meter:r,swing:i.level,repository:a,layer:o,rhythms:s,heard:h&&h.section===f/8-1?Fx(h.drums,`drummer`):[],session:c,share:i.share,bassLines:l,bassHeard:h&&h.section===f/8-1?Fx(h.bass,`bassist`):[],leads:u,leadHeard:h&&h.section===f/8-1&&h.lead.players.length?Fx({...h.lead,own:Px(h.leadBars)},`soloist`):[],harmonies:d,harmonyHeard:h&&f>=16?qv(h.harmony,f-16):[]},p,null).carried:p,v=_.before,{key:y,theme:b}=v,x=St({seed:e,barInSection:g,key:y,theme:b,harm:t.harm});return{plans:_,decided:{bar:f,plan:v,chords:x},history:oy(m,x)}}let Mx=({swing:e=Em},t)=>({level:t.swing,share:t.share??e.share});function Nx(e,t,n){let r=e.bar%8;return{seed:e.seed,bar:e.bar,meter:t.plan.meter,plan:t.plan,barInSection:r,style:e.style,swing:Mx(e,t.plan),barEnergy:Nt(e.style.energy,t.plan.section.type,r),chords:t.chords,next:n,offer:e.offer,...e.restless===void 0?{}:{restless:e.restless}}}let Px=e=>e.map((e,t)=>({bar:t,notes:gv(Nh(e),e.plan.key)})).filter(e=>e.notes.length>0),Fx=(e,t)=>[...e.own.length?[{source:t,bars:e.own}]:[],...e.players];function Ix(e,t,n){let r=[...e.players],i=r.findIndex(e=>e.source===t);return i===-1?r.push({source:t,bars:[n]}):r[i]={source:t,bars:[...r[i].bars,n]},{...e,players:r}}function Lx(e,t,n,r){if(!e.rhythms&&!e.bassLines&&!e.leads&&!e.harmonies||n.layer===null)return null;let i=Math.floor(t.bar/8),a=r?.section===i?r:{section:i,drums:kx,bass:kx,lead:kx,unheard:null,leadBars:[],harmony:(r?.harmony??[]).filter(e=>Math.floor(e.bar/8)>=i-1)};if(a.unheard){let e={...a.unheard,next:t.chords},n=$m(e,th.initial).output,r=wy(n,wt(e.chords,e.meter),wt(e.next,e.meter));a={...a,bass:{...a.bass,own:[...a.bass.own,r]},unheard:null}}if(e.rhythms&&t.plan.rhythmFragment===void 0){let n=Nx(e,t,[]),r=ry(n).map(e=>({role:e.role,note:e.note,step:e.step,velocity:Jy(n,e).velocity}));a={...a,drums:{...a.drums,own:[...a.drums.own,r]}}}e.bassLines&&n.bassFragment===null&&(a={...a,unheard:Nx(e,t,[])}),e.leads&&n.leadFragment===null&&(a={...a,leadBars:[...a.leadBars,Nx(e,t,[])]});for(let{source:t,bar:n,hits:r}of e.drumsHeard??[])Math.floor(n/8)===i&&(a={...a,drums:Ix(a.drums,t,r)});for(let{source:t,bar:n,notes:r}of e.bassHeard??[])Math.floor(n/8)===i&&(a={...a,bass:Ix(a.bass,t,r)});for(let{source:t,bar:n,notes:r,origin:o,confidence:s}of e.leadHeard??[])Math.floor(n/8)===i&&(a={...a,lead:Ix(a.lead,t,{bar:n,origin:o,notes:r,confidence:s})});if(e.harmonies){let t=(e.harmonyHeard??[]).filter(e=>Math.floor(e.bar/8)>=i-1);t.length&&(a={...a,harmony:[...a.harmony,...t]})}return a}let Rx=e=>({...e,style:Yp(e.style)});function zx(e,t){let{plans:n,history:r}=t,i=t.next;if(!i){if(e.bar!==0)throw Error(`band: bar ${e.bar}, but the song starts at bar 0`);({plans:n,decided:i,history:r}=jx(e,0,n,r))}else if(i.bar!==e.bar)throw Error(`band: bar ${e.bar}, but the band decided bar ${i.bar} next`);let a=Lx(e,i,n,t.ear),o=jx(e,e.bar+1,n,r,a);return{here:i,at:n,carried:{...t,plans:o.plans,next:o.decided,history:o.history,ear:a}}}let Bx={initial:Ax,advance(e,t){let n=Rx(e),{here:r,at:i,carried:a}=zx(n,t),o=Nx(n,r,a.next.chords),{barInSection:s}=o,c=n.bassLines?Lm(n.bassLines,i.bassFragment??void 0,o.meter,s,F(o.meter),a.plans.layer??void 0):[],l=$m(o,t.parts.bass,c),u=dh.advance(o,t.parts.comp,null),d=n.leads?kv(n.leads,i.leadFragment??void 0,o.meter,F(o.meter),a.plans.layer??void 0):null,f=d!==null&&i.leadFragment!=null&&(n.leads?.keyed?.(i.leadFragment,a.plans.layer??void 0)??!1),p=Mh(o,t.parts.lead,d,i.leadFragment??void 0,f),m={bass:l.carried,comp:u.carried,lead:p.carried},h=n.rhythms?yy(n.rhythms,r.plan,o.meter,s,F(o.meter),a.plans.layer??void 0):[],g=[...Cy(o,ry(o),h),...l.output,...u.output,...p.output];return{carried:{...a,parts:m},output:Vx(o,g)}}};function Vx(e,t){return{...e,written:t,dough:t.map(t=>Jy(e,t))}}let Hx=/* @__PURE__ */ new WeakMap;function Ux(e){if(Hx.has(e))return Hx.get(e);let t=null,n=e.ok?e.outputs.map(t=>e.cells.get(t.cell)?.clock).find(e=>!!e):void 0,r=n&&e.clocks.get(n)?.tap?e.clocks.get(n).tap.meter:n;for(let t=0;r&&t<16;t++){let t=e.cells.get(r)?.step?.driver;if(!t||!e.clocks.has(t))break;let n=e.clocks.get(t);if(e.cells.get(r)?.meter&&!e.cells.get(t)?.meter&&!n.positional&&n.swing===void 0&&!n.swung)break;r=t}let i=r?e.clocks.get(r):void 0,a=r?e.cells.get(r):void 0;if(i&&a&&!i.belt){let n=[...e.cells.values()].some(e=>e.name!==a.name&&e.step?.driver===a.name);(i.positional||a.meter||i.swing!==void 0||i.swung||a.beat!==1||n)&&(t={cell:a.name,beat:a.beat>0?a.beat:1})}return Hx.set(e,t),t}function Wx(e,t,n){let r=Ux(e.result);if(!r||!(n>t))return null;let i=zu(e.result,e.statics).played(r.cell),a=r.beat/24,o=Math.min(n,e.end),s=e=>e<0?-1/0:i.q(e*a),c=i.stepAt(Math.max(0,t)),l=Number.isFinite(c)?Math.max(0,Math.floor(c/a-vu)-1):0;for(;s(l)<t&&Number.isFinite(s(l));)l++;for(;l>0&&s(l-1)>=t;)l--;let u=[];for(let e=l;u.length<1e5;e++){let t=s(e);if(!(t<o))break;u.push(t)}return u.length?{first:l,at:u,before:s(l-1)}:null}function Gx(e,t,n){if(!e.result.tapes.length)return[];let r=zu(e.result,e.statics),i=[];for(let a of e.result.tapes){let o=qu(e.result,r,a.name);if(!o.moving&&!a.dropout&&!a.heads.some(e=>e.wander>0))continue;let s=[];for(let e=t;e<=n;e+=.05)s.push({at:e,speed:o.speed(e)});i.push({tape:a.name,points:s})}return i}function Kx(e,t,n,r={}){return{from:t,to:t+n,events:Qd(e,t,t+n,!0,r),tapes:Gx(e,t,t+n+1e-9),clock:Wx(e,t,t+n)}}function qx(e,t,n){let r=yf(e,t,n);return qd(r,gi(r),r.off)}new Set(Lc.flatMap(e=>[e.name,...e.aliases])),Object.fromEntries(Lc.map(e=>[e.note,e.name]));let Jx=Object.fromEntries(F_.find(e=>e.id===`gm_kit`).text.split(`
`).flatMap(e=>{let t=/^&(\w+) (.*)$/.exec(e);return t?[[t[1],t[2]]]:[]}));[...Object.keys(Jx)];let Yx=2048;(()=>{let e=new Float64Array(Yx);for(let t=0;t<Yx;t++)e[t]=Math.sin(2*Math.PI*t/Yx);return e})(),Math.log(3.8)/Math.log(200);let Xx=/* @__PURE__ */ `oscillator.tone.rests.semitones.twovoices.steps.clock.voice.effects.transpose.twinkle.chords.rhythm.drums.swing.breve.canon.mirrors.variations.chance.fifths.arrangement.stereo.waveforms.moving.grids.metronome.fm.musicbox.automaton.kalimba.sympathy.harmonograph.echotape.worn.dtmf.daytime.gate.play-in.midi-out.lullaby.jazz.five.waltz.sailor.royal.pertonos.ricercar.korobeiniki.coltrane.bossa.bell.prelude.pachelbel.circle.pop.idm.alpha.studie.just.bwv847.acid.patchbay.zell.cellscape.cellscape2.baustelle.focus.hypercell.onemore.electroswing.spooky.kinderlied.radio.brothers.ghosts.tines.phase.in-c.tape.soundtape.testtones.forks.resonanz.fiveto12`.split(`.`),Zx={acid:`---
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
&bar from meter &tempo
&strike, &thump, &snap, &click from envelopes
&tempo step=free(126bpm, 100..150)
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

&tb303 s=saw loop=A2 lpf=110..3800 * &fenv * &accent * &knob lpq=&res delaytime=&bar*4/3 delay=.22 delayfeedback=.35 env=&strike
&bd note=36 gain=.8 oneshot=1 s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0) env=&thump
&cp note=39 gain=.35 oneshot=1 s=white hpf=1500 env=&snap room=.2
&hh note=42 gain=.25 s=white hpf=8000 env=&click
&oh note=46 gain=.2 oneshot=1 s=white hpf=7000 env=&(map=adsr 0 .2 0 .1)

&mix postgain=2.83 map=sample [&line * &accent * &tb303 * .45, &beat]
\`\`\`
`,alpha:`---
title: "Alpha: Carlos' scale without octaves"
tags: [genre:experimental, artist:Wendy Carlos, microtonal, tuning]
description: "Wendy Carlos' alpha scale: nine equal steps to a pure fifth, and no octave at all."
---

\`\`\`cells
&vibrato from vibrato
# Wendy Carlos' alpha scale: equal steps of about 78 cents, nine to a pure fifth —
# and no octave at all. Five steps make a near-pure major third (5:4), four a minor
# third (6:5), so triads ring true: 0 5 9 is major, 0 4 9 minor.
&bar from meter &tempo
&tempo step=free(84bpm, 50..120)
&alpha map=ed(9, 3/2)                               # nine equal steps to 3:2

&chords over=&alpha step=1m [0,5,9] [4,8,13] [9,14,18] [5,9,14]       # major · minor · major · minor
&tune over=&alpha step=8n 9 14 18 14 13 8 4 8 18 23 27 23 22 18 14 9 14 18 23 18 14 13 9@2 5 9 14 18 14 9@3

&brass s=saw loop=C4 lpf=2200 lpq=3 env=&(map=adsr .04 .2 .7 .3) pitch=&vibrato
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
&bar from meter &tempo
&tempo step=free(moderato)
&key scale(major)

&chords over=&key step=&keysBar/4 [0,2,4] [3,5,7] [4,6,8] [0,2,4]
&tune over=&key step=&tuneBar*2 4 4 5 7 7 5 4 2 0 0 2 4 4@2 2@2
&kick step=&drumBar &bd ~ &bd ~
&click off step=&drumBar 12 0!3                       # a click on the beat, switched off

&keys s=tri loop=C4 env=&(map=adsr .01 .5 .3 .3)
&lead s=square loop=C5 lpf=2500 env=&(map=adsr .01 .2 .5 .2)
&rim from gm_kit
&thump from envelopes
&bd note=36 gain=.6 s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .04 0 0) env=&thump

&sections step=4n &keysBar &tuneBar &drumBar
&song over=&sections step=1m/4 laps=1 label="intro · verse · chorus · end" 0 [0,2] [0,1,2] 0
&out map=sample postgain=6.46 [&chords * &keys * .15, &tune * &lead * .2,
                         &kick, &click * &rim * .1]   # a long line can go on: it ends with a comma
\`\`\`
`,automaton:`---
title: Automaton
tags: [tutorial, genre:experimental, rhythm, sound, stereo]
tier: 7
description: "A mechanical band on belts, all turned by one drum: bells, a drummer and a woodblock, each on a belt of different give."
---

\`\`\`cells
&thump, &tap, &click from envelopes
&drumMotorNote label="The drum (the meter, a motor) turns them all." about=&bar
&bellsNote label="The bells on a taut belt, exact." about=&bells
&drummerNote label="The drummer's arm on a slack belt, lagging and swinging." about=&drums
&woodNote label="The woodblock's arm slips when the drum jerks, a step behind for good." about=&wood
&shoveNote label="Grab the big drum and shove it: watch the belts stretch, hear the arms drag and the woodblock slip." about=&bar
# Automaton — one motor, belts of different give. belt= stiffness (taut 3000, slack 25),
# mass= the arm, damping= how soon it stops swinging (3 is what it is anyway: a little bounce), slip= its grip: past it the belt slips and the arm falls behind for good.
&bar meter("4/4") step=&tempo motor=4 mass=1 friction=.2
&tempo step=104bpm
&major scan(2 2 1 2 2 2 1) label="{mode} on {tonic}"
&bells over=&major step=8n belt=3000 label="the bells: a taut belt" 0 4 7 4 9 7 4 2 0 4 7 9 11 9 7 4
&drums step=16n belt=25 mass=1 damping=3 label="the drummer" &bd ~ &sd &bd ~ &bd &sd ~ &bd ~ &sd &bd ~ &bd &sd &sd
&wood step=8n belt=400 mass=1.5 slip=.4 label="the woodblock: it slips" 0 0 ~ 0 0 ~ 0 ~

&bell pan=.36 s=sine loop=C5 fm=&bm index=.3..2 * &(map=adsr .001 .1 .1 .1) room=.3 env=&(map=adsr .002 .9 0 .6)
&bm s=sine ratio=3.5
&bd note=36 s=sine loop=A1 pitch=0..20 * &(map=adsr 0 .05 0 0) env=&thump
&sd note=38 s=white hpf=1200 env=&tap
&blk pan=.64 s=square loop=C6 hpf=900 lpf=3000 env=&click

&out postgain=3.14 map=sample [&bells * &bell * .14, &drums * .6, &wood * &blk * .07]
\`\`\`
`,baustelle:`---
title: Baustelle
tags: [genre:experimental, genre:electronic, genre:industrial, artist:Neubauten, microtonal, arrangement]
description: "An original in the manner of Einstürzende Neubauten: struck metal and a scream; it builds, breaks, comes back harder, and collapses."
---

\`\`\`cells
&strike from envelopes
&metalsNote label="Beams, pipes and plates struck and tuned to their own partials." about=(&beams &pipes &plates)
&springNote label="A giant bass spring." about=(&feder &bassfeder)
&toolsNote label="A grinder and a drill." about=(&grind &drill)
&screamNote label="A scream." about=&schrei
&lowEndNote label="Sub-bass under a gritty riff." about=(&sub &riff)
# Baustelle — a building site, played. Metal is inharmonic: a free steel beam rings at
# 1 : 2.76 : 5.40 : 8.93, so each metal gets a grid of its own partials (map=ratios), and
# a hit is a chord of them. Some hits fall only sometimes (?), some choose ([a|b]):
# the percussionist's hand. Under it: a sub-bass kick, a crushed riff, the Bassfeder.
&bar from meter &tempo
&tempo step=free(118bpm, 90..150)

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
&grit tags="low" s=saw loop=E1 distort=.85 crush=6 lpf=90..2200 * &(map=adsr .003 .18 .15 .08) * &accent lpq=7 env=&strike
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

&out postgain=.975 map=sample [&metalPart, &plates * &platev * .05, &kick * &sub * .55,
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
&tap, &click from envelopes
# The West African standard bell pattern — seven strokes over twelve pulses,
# x.x.xx.x.x.x — has the same intervals as the major scale: 2 2 1 2 2 2 1.
# So one cell is both: the melody steps with the bell, and reads it as its scale.
&oneScanNote label="One scan is both — the melody steps with it, and reads it as its scale." about=(&bell &song)
&beat meter("4/4") step=free(100bpm, 70..140)       # four dotted-quarter beats: 12/8
&bell label="{mode} · x.x.xx.x.x.x" scan(2 2 1 2 2 2 1) step=pulse*7/4             # seven strokes a bar, over the twelve pulses

&strokes step=&bell:pulse &gankogui &gankogui:0:.5 &gankogui:0:.7 &gankogui:0:.5 &gankogui:0:.6 &gankogui:0:.5 &gankogui:0:.7 # the bell, as a rhythm
&song over=&bell step=&bell:pulse 4 4 5 4 2 1 0 2 2 1 2 0 ~ ~ # … and as a scale: C major
&drums step=8t [&dundun,&shekere:0:.5] &shekere:0:.2 &shekere:0:.3 [&dundun:0:.5,&shekere:0:.5] &shekere:0:.2 &shekere:0:.3 [
       &dundun:0:.8,&shekere:0:.5] &shekere:0:.2 &shekere:0:.3 [&dundun:0:.5,&shekere:0:.5] &shekere:0:.2 &shekere:0:.3   # the twelve pulses, the low drum on the beats

&gankogui gain=.25 s=square loop=C6 lpf=4000 env=&tap
&voice s=tri loop=C4 env=&(map=adsr .02 .2 .6 .2)
&dundun gain=.7 oneshot=1 s=sine loop=C2 pitch=0..12 * &(map=adsr 0 .04 0 0) env=&(map=adsr 0 .25 0 .1)
&shekere gain=.15 s=white hpf=6000 env=&click

&mix postgain=3.9 map=sample [&strokes, &song * &voice * .45, &drums]
\`\`\`
`,bossa:`---
title: "Bossa nova: the clave"
tags: [genre:world, genre:jazz, tonal, rhythm]
description: A bossa nova whose guitar strums on the clave's five strokes, over Dm9 and G13.
---

\`\`\`cells
&vibrato from vibrato
# Bossa nova. The clave is a meter: five strokes over a bar of sixteenths,
# scan(3 3 4 3 3) — x..x..x...x..x.. — and the guitar strums on its strokes.
&bar meter("4/4") step=free(128bpm, 90..170)
&clave scan(3 3 4 3 3) step=pulse*5/4                 # five strokes a bar
&dorian scan(2 1 2 2 2 1 2)                            # D Dorian (the voices sit on D)

&rim step=&clave:pulse &click &click:0:.8 &click:0:.9 &click &click:0:.8
&strum step=&clave:pulse [3,7,10,14]!3 [3,9,14]!2                          # Dm9 · G13, on the clave
&bassline step=4n 0 7 -7 0                             # root and fifth: D A under Dm9, G D under G13
&shaker step=16n &shh:0:.5 &shh:0:.2 &shh:0:.3 &shh:0:.2
&melody over=&dorian step=8n 4@3 3 2@2 ~@2 0 1 2@3 ~@3

&guitar s=tri loop=D3 lpf=2200 env=&(map=adsr .003 .5 .15 .3)
&bass s=sine loop=D2 env=&(map=adsr .01 .4 .5 .2)
&flute glide=.08 s=sine loop=D4 env=&(map=adsr .06 .2 .7 .4) pitch=&vibrato
&click gain=.3 s=white hpf=2500 env=&(map=adsr 0 .03 0 .02)
&shh gain=.12 s=white hpf=6000 env=&(map=adsr 0 .03 0 .02)

&mix postgain=1.58 map=sample [&strum * &guitar * .25, &bassline * &bass * .7, &melody * &flute * .4,
                                  &rim, &shaker]
\`\`\`
`,breve:`---
title: Alla breve and sixteenths
tags: [tutorial, rhythm]
tier: 4
description: Alla breve, 2/2 a step a quarter, counts a bar in halves, and pulse=16n gives a scan's entries a sixteenth each.
---

\`\`\`cells
&bar meter("2/2", 2) step=60bpm      # alla breve: two beats a bar, bpm counts half notes, its steps quarters
&sixteenths scan(1 1 1 1) pulse=16n step=60bpm   # a scan whose entries are sixteenths

&low step=&bar:beat 0 4
&run over=scale(minor) step=&sixteenths:16n 0 2 4 2

&bell s=sine loop=A2 env=&(map=adsr 0 .3 0 .1)
&out map=sample postgain=6.02 [&low * &bell * .6, &run * &bell * .3]
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
&bar from meter &tempo
&thump, &snap, &click, &strike from envelopes
&tempo step=free(112bpm, 96..132)
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

&bd note=36 tags="break" oneshot=1 s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .06 0 0) distort=.5 env=&thump
&sd note=38 tags="break" s=white hpf=900 distort=.6 crush=7 env=&snap
&hh note=42 tags="break" s=white hpf=7000 crush=6 env=&click
&tb tags="acid" s=saw loop=E2 lpf=120..3600 * &(map=adsr .003 .17 .1 .06) * &accent lpq=14 distort=.3 env=&strike
&stab tags="riff" s=square loop=E3 distort=.9 lpf=2600 room=.2 env=&(map=adsr .003 .2 .3 .1)
&siren1 tags="siren" s=sine loop=E5 delaytime=&bar*4/3 delay=.3 delayfeedback=.35 env=&(map=adsr .3 .5 .9 .6)
&subv tags="sub" s=sine loop=E1 env=&(map=adsr .005 .4 .6 .1)
&sn tags="build" s=white hpf=1000 distort=.4 env=&(map=adsr 0 .06 0 .03)
&riser tags="build" s=white lpf=400..8000 * &up lpq=5 crush=8 env=&(map=adsr 1 .5 .9 .5)

&sections step=4n &acidBar &riffBar &breakBar &sirenBar &buildBar &subBar
&song over=&sections step=1m/8 laps=1 label="break · bass · acid · build · riff · all · siren · build · all" [2] [2,5] [0,2,5] 4 [0,1,2,5] [0,1,2,3,5] [0,3] 4 [0,1,2,3,5]

&out postgain=.743 map=sample [&break * .7,
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
&vibrato from vibrato
&pluck from envelopes
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
&reed pan=.2 s=square loop=C4 lpf=2000 env=&(map=adsr .01 .2 .6 .15) pitch=&vibrato
&brass pan=.73 s=saw loop=C4 lpf=1500 lpq=4 env=&(map=adsr .02 .2 .7 .15)
&moog pan=.67 s=saw loop=C4 lpf=700 lpq=10 env=&pluck

# the form: who plays when. Each voice is a section (decision 016) and each step of the selector a section of the
# piece: the figuration, bars 25–27 (the left hand alone), *Presto*, *Adagio*, *Allegro* (the right hand alone), a
# breath, then the fugue's voices entering one by one. restart=resume: a voice switched off waits, and goes on where
# it stopped — no voice counts rests while the others play.
&sections step=pulse &rhTime &lhTime &sopranoTime &altoTime &bassTime
&form over=&sections step=pulse laps=1 restart=resume label="figuration · bars 25–27 · *Presto* · *Adagio* · *Allegro* · a breath · alto · soprano · bass" [0,1]@384 1@48 [0,1]@96 [0,1]@17 0@64 ~@15 ~@2 3@32 [2,3]@64 [2,3,4]@398

&out postgain=3.85 map=sample [&rh * &saw * .3, &lh * &pulse * .3, &soprano * &reed * .25, &alto * &brass * .22, &bass * &moog * .3]
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
&bar from meter 120bpm
&pluck from envelopes
&a 0@2 1@2 2@2 0@2                     # are you sleep-ing
&b 2@2 3@2 4@4                         # bro-ther John
&c 4 5 4 3 2@2 0@2                     # morn-ing bells are ring-ing
&d 0@2 -3@2 0@4                        # ding, dang, dong
&john over=scale(major) step=8n &a!2 &b!2 &c!2 &d!2          # C Ionian

&v1 s=tri loop=C5 env=&(map=adsr .005 .3 .5 .2)
&v2 s=square loop=C4 lpf=1800 env=&pluck
&v3 s=saw loop=C4 lpf=1200 env=&pluck
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
&bar from meter &tempo
&pluck from envelopes
&tempo step=free(72bpm, 50..96)
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
&bass tags="pulse" s=tri loop=C2 lpf=400..1400 * &breath env=&pluck
&glass tags="glass" pan=.21 s=sine loop=C5 room=.7 env=&(map=adsr 3 1 .7 4) pitch=&(map=lin loop=.11 0 .25 0 -.25 0)

# the score: which layers play in each of the twelve scenes (0 drone 1 sequence 2 leader
# 3 follower 4 bells 5 pulse 6 glass), a barrel turning a scene each 32 bars
&layers step=4n &droneBar &sequenceBar &leaderBar &followerBar &chimesBar &pulsesBar &shineBar
&scenes over=&layers step=1m/8 label="the scenes" [0] [0,4] [0,1,4] [0,1,2] [0,1,2,3] [0,1,2,3,5] [0,2,3,4,5,6] [0,1,2,3,4,5,6] [0,3,4,6] [0,1,5,6] [0,4,6] [0,6]

&out postgain=4.57 map=sample [&pad * &padv * .14,
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
&steps map=ed(25, 5) label="25 steps to 5:1, no octave"

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
&bar from meter &tempo
&click, &tap from envelopes
&tempo step=free(moderato)
&key scale(major)

&tune over=&key step=8n 0 2 [4|5|7] 4 [2|7] 0 [4|9] ~
&hats step=16n 0 0? 0 0?.7 0 0? 0 0?.2
&ghosts chance=.75 seed=3 step=16n 0?!8

&lead s=tri loop=C5 env=&(map=adsr .005 .2 .3 .2)
&hh s=white hpf=8000 env=&click
&sd s=white hpf=1500 env=&tap
&out map=sample postgain=10.1 [&tune * &lead * .3, &hats * &hh * .1, &ghosts * &sd * .1]
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
&bar from meter &tempo
&tempo step=free(andante)
&key scale(minor, &tonic) label="{mode} on {tonic}"     # A minor
&tonic A

&chords over=&key step=1m [0,2,4] [3,5,7] [4,6#,8] [0,2,4]         # i – iv – V – i
&strike step=4n 0 0 12 0                                           # on the beat, an octave up on three
&roots over=&key step=1m 0 3 4 0

&keys s=tri loop=A3 env=&(map=adsr .01 .5 .3 .3)
&bass s=sine loop=A3 env=&(map=adsr .01 .6 .6 .2)
&out map=sample postgain=2.99 [(&chords + &strike) * &keys * .15, (&roots - 24) * &bass * .5]
\`\`\`
`,circle:`---
title: "The diatonic circle: one triad, turned a fourth a bar"
tags: [genre:classical, harmony, diatonic, tonal]
description: The Baroque sequence I IV vii° iii vi ii V, its chords one triad turned through the key, not seven written out.
---

\`\`\`cells
&triadNote label="&triad is even(3, 7) over the key: every other degree, the chord. Turned with the key's degrees, a fourth each bar, it is each chord of the sequence in turn." about=&triad
&powerNote label="&power is even(2, 3, 1) over the triad: its root and fifth, the bass's notes. Each level of the key is even inside the one above, as a meter's are (decision 072)." about=&power
# The diatonic circle of fifths, the Baroque sequence I IV vii° iii vi ii V: each chord a fourth above the last.
# No chord is written out: the key's degrees turn a fourth a bar (stride=3), the triad reads them, and every part
# reads the triad, so 0 1 2 is the chord of the bar, whichever it is (#508).
&bar from meter &tempo
&tempo step=free(84bpm, 60..120)
&key scale(major, &tonic) label="{mode} on {tonic}"
&tonic C

&degrees over=&key step=1m stride=3 0 1 2 3 4 5 6        # the key from the chord's root: a fourth on, each bar
&triad over=&degrees even(3, 7)                          # the chord: every other degree
&power over=&triad even(2, 3, 1)                         # its root and fifth

&pad over=&triad step=1m [0,1,2]
&arp over=&triad step=8n 0 1 2 3 2 1 0 1
&bass over=&power step=4n -2 -1 -2 -1

&keys s=tri loop=C4 env=&(map=adsr .01 .5 .3 .3)
&low s=sine loop=C3 env=&(map=adsr .01 .3 .6 .2)
&out map=sample [&pad * &keys * .1, &arp * &keys * .15, &bass * &low * .4]
\`\`\`

The sequence written out would be seven chords of degree lists, \`[0,2,4] [3,5,7] [6,8,10] [2,4,6] [5,7,9] [1,3,5] [4,6,8]\`, and every part would carry its own copy of them: the arpeggio 56 numbers, the bass 28. Here the chord is a level of the key, as a beat is a level of the meter (#508, decision 072): the triad is \`even(3, 7)\` of the key's degrees, the root and fifth \`even(2, 3, 1)\` of the triad, and the parts read the level they need. It sounds identical to the written-out text and is 84 to its 154 by decision 049's measure (\`npm run structure\`), the test in \`grade.test.ts\` holding both.
`,clock:`---
title: "A clock: one bar drives every part"
tags: [tutorial, rhythm]
tier: 2
description: "A bar sets the tempo, and every part steps with it: on the beat, twice as fast, or once every two beats."
---

\`\`\`cells
&barNote label="&bar is the clock: a meter of 4/4, four even beats, stepped by &tempo; step=free(andante) a tempo marking, a slider from 76 to 108 beats a minute." about=(&bar &tempo)
&ratesNote label="Each part taps the bar by a note value: step=4n a step a beat (a quarter), 8n two steps a beat, 2n a step every two beats." about=(&tune &eighths &bass)
&bar from meter &tempo  # four beats, andante
&tempo step=free(andante)

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
&pluck, &snap from envelopes
# The changes of Giant Steps: three keys a major third apart — B, G, Eb — round
# the octave. The key turns down a major third each bar (stride=-4); the line plays
# 1-2-3-5 in it, then the dominant of the next key. The line is our own.
&bar meter("4/4") step=free(220bpm, 140..320)
&swing scan(free(2, 1..3) 1) step=8n
&key shift=-1 step=1m stride=-4                          # B, then G, then Eb, then B …

&line over=&key step=&swing:pulse 0 2 4 7 3 7 10 13     # 1 2 3 5 · the next key's V7: 1 3 5 b7
&walk over=&key step=4n 0 4 3 10                         # root, third · the V7's root, its fifth
&comp over=&key step=2n [4,11] [7,13]                    # the maj7 shell · the V7 shell
&ride step=&swing:pulse &cym:0:.9 ~ &cym:0:.6 &cym:0:.5 &cym:0:.9 ~ &cym:0:.6 &cym:0:.5

&sax s=saw loop=C4 lpf=1800 room=.25 env=&(map=adsr .02 .12 .6 .1)
&bass s=tri loop=C2 env=&pluck
&keys s=sine loop=C4 env=&(map=adsr .005 .3 .3 .2)
&cym gain=.22 s=white hpf=8000 env=&snap

&mix postgain=2.16 map=sample [&line * &sax * .4, &walk * &bass * .8, &comp * &keys * .3, &ride]
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
&bar from meter &tempo
&tempo step=free(moderato)

&beat &bd ~ &hh:0:.5 ~ &sd ~ &hh:0:.5 [&bd,&hh]
&fill &sd [&sd &sd] &sd &sd*3
&groove step=8n &beat!3 &bd ~ &hh ~ &fill
&clave step=16n euclid(5, 16)
&kit &lo &mid &hi
&toms over=&kit step=16n ~!12 0 1 2 1

&bd, &sd, &rim from gm_kit
&click, &thump, &snap from envelopes
&hh note=42 oneshot=1 s=white hpf=8000 env=&click
&lo note=41 s=sine loop=G2 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&thump
&mid note=45 s=sine loop=C3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .2 0 .05)
&hi note=48 s=sine loop=F3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&snap
&out map=sample postgain=3.12 [&groove * .6, &clave * &rim * .15, &toms * .4]
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
&out postgain=4.41 map=sample [&dial * &tone * .3]
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
&bar from meter 84bpm
&major scan(2 2 1 2 2 2 1) label="{mode} on {tonic}"
&tune over=&major step=8n label="the tune" 0 ~ 4 ~ 7 ~!3 11 ~ 9 ~ 7 ~!3 4 ~ 5 ~ 4 2 ~!2 0 ~!7
&tape step=&reel write=&tune length=6 erase=.45 varispeed=1 label="the tape: 6 s, a loop"
&near play=&tape at=.375 label="head 1"
&mid play=&tape at=.75 label="head 2"
&far play=&tape at=1.5 label="head 3"

&m s=sine ratio=3
&bell s=sine loop=G4 fm=&m index=.2..1.4 * &(map=adsr .001 .15 .1 .1) room=.3 env=&(map=adsr .002 1.2 0 .8)
&soft s=tri loop=G4 lpf=1800 room=.5 env=&(map=adsr .004 .9 0 .6)

&out postgain=8.13 map=sample [&tune * &bell * .22, &near * &soft * .12, &far * &soft * .08] [
                                  &tune * &bell * .22, &mid * &soft * .12, &far * &soft * .08]
\`\`\`
`,effects:`---
title: "Filters and effects: shaping a voice"
tags: [tutorial, sound]
tier: 2
description: "What shapes a voice after its source: filters, a reverb and an echo, grit, and a vibrato."
---

\`\`\`cells
&pluck from envelopes
&filterNote label="lpf= lets the lows through (a cutoff in Hz) and lpq= rings at the cutoff; hpf= and hpq= the same from above." about=(&warm &thin)
&effectsNote label="room= sends to a reverb, delay= to an echo: delaytime= apart, delayfeedback= how long it repeats. distort= and crush= add grit." about=(&glass &grit)
&vibratoNote label="pitch= is a voice's own pitch on every note: here a vibrato, a cell that turns three times a beat, in semitones." about=&warm
&bar from meter &tempo
&tempo step=free(moderato)

&tune step=8n 0 4 7 12 7 4 0 ~ 2 5 9 14 9 5 2 ~
&line step=2n 7 9 5 7
&bass step=4n 0 0 7 0 2 2 9 2
&sparkle step=1m 12 14

&warm s=saw loop=C4 lpf=1400 lpq=6 env=&(map=adsr .08 .2 .7 .4) pitch=&(loop=&bar*3 0 .15 0 -.15)
&thin s=saw loop=C4 hpf=2500 hpq=3 env=&(map=adsr .005 .2 .2 .2)
&glass s=sine loop=C5 room=.6 delay=.4 delaytime=.33 delayfeedback=.5 env=&(map=adsr .01 .8 0 .8)
&grit s=square loop=C2 lpf=900 distort=.3 crush=8 env=&pluck
&out map=sample postgain=1.89 [&tune * &thin * .2, &line * &warm * .15, &sparkle * &glass * .2, &bass * &grit * .3]
\`\`\`
`,electroswing:`---
title: Electro swing, in pieces
tags: [genre:electronic, genre:dance, genre:jazz, harmony, rhythm, arrangement]
description: "A house kick under a walking bass, Charleston stabs, and a clarinet and a muted trumpet trading a call and its answer in D harmonic minor: the band, the tune and its form are the seed library's."
---

Electro swing is a jazz record cut up over a house beat: four on the floor, the eighths swung, a walking bass, brass stabs on the Charleston and a clarinet in a minor key.
Here the band comes from the seed library, taken by name, and so does the tune: the drummer and its kit, the key, an eight-bar vamp, the walking bass Jambot plays at Swing jazz, the bass, stab and lead players, and the beat and the stabs this piece gave the library (\`electro_swing_drums\`, \`charleston_stabs\`); the tune is the motif \`gypsy\`, its call, shaped by two forms, \`call_and_answer\` and \`AABA\`.
The piece writes only what is its own: the tempo and the swing, the key's tonic, the break, who plays when, and the sound of each instrument.

\`\`\`cells
&drums, &drumsOut from drums_performer &drumlines
&key from harmonic_minor D
&harm from vamp_to_the_fifth &key
&bassline from walking_bass &harm
&kick, &clap, &hats, &ticks from electro_swing_drums
&stabline from charleston_stabs &harm
&bass, &bassOut from bass_performer(bassLevel=&bassLevel) &bassline
&stab, &stabOut from stab_performer(stabLevel=&stabLevel) &stabline
&leadOut from lead_performer(leadLevel=&leadLevel) &leadline
&useNote label="The band is the library's: each line names what it takes from it. &bassV, &keysV and &leadV are the players' instruments, named so the piece can give each a sound of its own; the drummer plays the core kit as it is." about=(&bassV &keysV &leadV)
\`\`\`

The meter is the library's too, \`meter(swing=8n:2/3)\`, Jambot's Swing jazz meter, which leaves its tempo to the piece (\`&tempo\`) and swings its eighths by a cell of its own, \`&swing\`, triplets (2/3).
The piece gives its own, an argument of the meter's (\`swing=&swing\`): the eighths a little less than triplets, .64. The tempo and the swing are both sliders.
The key is harmonic minor, from the library, on the tonic its line gives it, D (\`&key from harmonic_minor D\`, decision 065): the vamp's fifth is then A major, four bars of D minor, four of A.

\`\`\`cells
&bar from meter(swing=&swing) &tempo
&tempo step=free(124bpm, 112..132)
&swing swing=8n:free(.64, .5..0.75)
&swingNote label="Every line taps the meter (step=4n, 8n, 16n), so every line swings: the open hats on the off-beats, the stabs, the clarinet." about=&bar
\`\`\`

## The beat

\`electro_swing_drums\`, used above: a kick on every beat, the clap on two and four, the open hat on every swung off-beat; a sixteenth hat with some strokes left to chance and a ghost of the snare on the last.
The piece takes its four limbs by name and hands them to the drummer as a stack, \`&drumlines\`, each times its level in the form below; the fragment's own \`&groove\` mix it leaves.
The crackle is the piece's own, a record's: a tick of noise on a few sixteenths, by chance.

\`\`\`cells
&drumlines [&kick * &kickForm, &clap * &clapForm, &hats, &ticks]
&crackle step=16n 0?.8!16
&beatNote label="The beat is a fragment: &kick, &clap, &hats and &ticks come from Electro swing drums, their levels in their hits." about=(&kick &clap &hats &ticks)
\`\`\`

## The stabs

\`charleston_stabs\`, used above, is the stab player's part: the Charleston, a chord on one and on the and of two, three bars, and a fourth that pushes: its last stab, on the and of four, comes early with the next chord, its third and fifth with its root on top.
The stab player reads the chords in force, \`over=&harm\`, so the same rhythm is D minor in one half of the vamp and A major in the other.

\`\`\`cells
&charlestonNote label="The Charleston: one, and the and of two, a fragment's (Charleston stabs)." about=&stabline
\`\`\`

## The tune: one bar, a call and its answer, in AABA

The tune is one bar from the library, the motif \`gypsy\`: A B♭ C♯ D and back to A, the clarinet's call.
Two forms from the library make a chorus of it.
- **\`call_and_answer\`** makes the A: the call, then its answer, the call two degrees down (\`&call^-2\`), F G A B♭ and back to F.
- **\`AABA\`** makes the chorus of four As, the bridge before the last. Its bridge, by default A a fourth up, is named in its use and moved to where the harmony goes: three degrees down (\`&a^-3\`), over the vamp's A chord, E F G A, A's phrygian dominant.

The break cuts the motif into pieces with picks: its first three notes (\`&gypsy[0:3]\`) and rests, its tail moved, its first two as a stutter (\`&gypsy[0:2]!4\`), its top note hammered (\`&gypsy[3]!4\`).

\`\`\`cells
&gypsy from gypsy &key
&phrase from call_and_answer &call
&chorus from AABA(b=&b) &a
&call step=8n &gypsy
&a step=8n &phrase
&b step=8n &a^-3
&turn over=&key step=8n 6 7 6 5 4@2 ~@2
&chop over=&key step=8n &gypsy[0:3] ~@5 &gypsy[0:3] ~ &gypsy[0:3] ~ &gypsy[3:]^-2 ~@3 &gypsy[0:2]!4
&chopA over=&key step=8n degree(&gypsy[0:3], -3) ~@5 degree(&gypsy[0:3], -3) ~ degree(&gypsy[0:3], -3) ~ &turn &gypsy[3]!4
&leadline step=8n &chorus!2 &chop &chopA &chorus
&callNote label="One bar: the motif gypsy is the call, call and answer makes an A of it (the call, then the call two degrees down), and AABA a chorus, its bridge A moved three degrees down." about=(&call &a &b)
\`\`\`

## Two leads, call and answer

The clarinet calls and a muted trumpet answers: two players of one line, each heard on its own bars.
The trumpet is a second gate on the lead's line, \`&lead2\`; the clarinet is the lead player's gate, \`&leadOut\`. Both play as the lead (\`&lead map=role &leadOut &lead2\`, decision 061), so the piece takes the lead player's gate and writes the role itself.
Each one's level is a two-bar step, \`[.5 0]\` for the clarinet and \`[0 .45]\` for the trumpet, so they trade bar by bar: the call, then the answer; in the bridge, its call, then its answer; in the break, the pieces back and forth.

\`\`\`cells
&lead2 play=&leadline level=&lead2Level &trumpetV
&lead map=role &leadOut &lead2
&dialogueNote label="The clarinet plays the odd bars, the trumpet the even ones: the call and its answer, traded between two players." about=(&leadOut &lead2)
\`\`\`

## The form, in levels

The song is 32 bars, four times round the vamp: the stabs and the hats alone, then the kick and the bass, the chorus, the break with the kick and the bass out, and the chorus again.
It is written as each part's level, bar by bar, the clarinet's entry too (its line plays from the top, silent for the first eight bars), so every part keeps tapping the swung meter.
The players' levels are holes their fragments leave; here they are the form.
It is the form written six times over, and waits on #304: a selector over the performers, each step naming who plays, would write it once.

\`\`\`cells
&bassLevel map=amp step=1m 0!4 .8!12 0!8 .8!8
&stabLevel map=amp step=1m .5!16 0!8 .6!8
&leadLevel map=amp step=1m/2 0!4 [.5 0]!12
&lead2Level map=amp step=1m/2 0!4 [0 .45]!12
&kickForm map=amp step=1m 0!4 1!12 0!8 1!8
&clapForm map=amp step=1m 0!8 1!8 .6!8 1!8
&formNote label="The form: intro (4 bars), the band (4), the chorus (8), the break (8), the chorus (8)." about=(&bassLevel &stabLevel &leadLevel &lead2Level &kickForm &clapForm)
\`\`\`

## The sound

The instruments the players play are voices with no sound of their own: the piece gives each one.
An upright-ish bass, a brass stab, a clarinet with a slow vibrato, a muted trumpet, darker and with a slower one, and the crackle's noise.
In giving the bass its sound the piece gives it its register too, which is the instrument's (decision 058): the library's \`bass\` sits at C2 and the bass player plays it an octave down, at C1; this \`&bassV\` sits at C3, so the walk sounds at C2, an octave above the library's, where a laptop's speakers still carry it.

\`\`\`cells
&bassV s=saw loop=C3 lpf=700 env=&(map=adsr .005 .3 .25 .08)
&keysV s=saw loop=C3 lpf=1800 env=&(map=adsr .01 .12 .25 .1)
&leadV s=square loop=C4 lpf=2400 env=&(map=adsr .02 .2 .7 .15) pitch=&(map=lin loop=5.5 0 .12 0 -.12 0)
&trumpetV s=saw loop=C4 lpf=1400 lpq=6 env=&(map=adsr .03 .1 .6 .12) pitch=&(map=lin loop=4.5 0 .08 0 -.08 0)
&vinyl s=white hpf=2500 env=&(map=adsr 0 .004 0 .004)

&out map=sample postgain=1.96 [&drumsOut,
                         &crackle * &vinyl * .04, &bassOut, &stabOut * .4, &leadOut * .5, &lead2 * .5]
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
&bar scan(27 23 26 24) step=&tempo
&tempo step=110bpm
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
&pluck, &snap from envelopes
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
&bass s=tri loop=Eb2 env=&pluck
&cym gain=.22 s=white hpf=8000 env=&snap
&click gain=.3 oneshot=1 s=white hpf=3000 env=&(map=adsr 0 .03 0 .02)

&mix postgain=2.06 map=sample [&tune * &horn * .45,
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
&bar from meter &tempo
&tempo step=free(andante)
&key scale(major)

&tune over=&key step=4n 7 4 5 2 4 0 2@2 7 9 8 7 4@4
&chords over=&key step=1m [0,2,4] [3,5,7] [1,3,5] [0,2,4]

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
&bar from meter &tempo
&tempo step=free(62bpm, 48..80)
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
&bar from meter 60bpm
&hits step=1m/2 label="a strike, every eight seconds" 4
&forkA pan=.35 body=fork loop=A4 ring=10 hard=.35 board=none couple=&forkB coupling=.1 label="fork A: struck" 0
&forkB pan=.65 body=fork loop=free(440hz, 434..446) ring=10 hard=.35 board=none label="fork B: only the table rings it" 0

&out postgain=.447 map=sample [&hits * &forkA * .5, &forkB * .5]
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
&roleNote label="&drums is a role: it names the gates that play it, here &drumOut. A reader that knows the role (the feel's drums) plays its gates so; a gate no role names, &leadOut, plays as written. It is no sound: the card sends the gates." about=&drums
&productNote label="The bass is the same thing unnamed: a product in the sound card." about=&bass
&bar from meter &tempo
&strike, &snap, &click from envelopes
&tempo step=free(96bpm, 60..140)
&key scale(major)

&tune over=&key step=8n 0 2 4 2 5 4 2@2 4 5 7 5 4 2 0@2
&accent map=amp step=8n 1 .5 .8 .5
&roots over=&key step=2n 0 3 4 0

&lead s=tri loop=C5 env=&(map=adsr .01 .2 .4 .2)
&bell s=sine loop=C6 env=&(map=adsr 0 .6 0 .3)
&bass s=square loop=C2 lpf=500 env=&strike
&bd note=36 s=sine loop=A1 env=&(map=adsr 0 .3 0 .1)
&sd note=38 s=white env=&snap
&hh note=42 s=white hpf=7000 env=&click
&kit &bd &sd &hh
&beat step=8n 0 2 1 2

&leadOut play=&tune level=&accent*.4 [&lead, &bell]
&drumOut play=&beat level=.5 &kit
&drums map=role &drumOut
&out map=sample postgain=2.54 [&leadOut, &drumOut, &roots * &bass * .5]
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
&bar from meter &tempo
&click from envelopes
&tempo step=free(76bpm, 60..96)
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
&tick pan=.7 s=square loop=D6 hpf=4000 crush=4 env=&click
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
&edoNote label="map=edo(19): nineteen equal steps to the octave. map=ed(7, 3/2): seven equal steps to a pure fifth instead." about=(&edo19 &fifths)
&ratiosNote label="map=ratios: the tones as ratios, one period's worth, the last the period: 1 9/8 5/4 … 2." about=&just
&bar from meter &tempo
&tempo step=free(andante)
&edo19 map=edo(19)
&fifths map=ed(7, 3/2)
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
&bar from meter 60bpm
&strike step=pulse/6 label="struck together" 0
&tonic body=fork loop=A3 ring=7 hard=.3 board=none label="the tonic" 0
&fifth body=fork loop=A3 ring=7 hard=.3 board=none label="its fifth" 7
&screen scope=xy label="x: the tonic · y: its fifth" &tonic &fifth
&classes scope=spectrum fold=12 channels=split label="their pitch classes, a ring each" &tonic &fifth
&bands scope=waterfall bins=24 label="their sound, in 24 bands, over time" &tonic &fifth

&out postgain=.871 map=sample [&strike * &tonic * .5] [&strike * &fifth * .5]
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
&bar from meter &tempo
&thump, &click, &snap, &tap, &strike from envelopes
&tempo step=free(160bpm, 140..180)
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

&bd note=36 tags="drums" gain=.8 oneshot=1 s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .05 0 0) distort=.2 env=&thump
&hh note=42 tags="drums" gain=.2 s=white hpf=8000 env=&click
&cp note=39 tags="drums" gain=.35 oneshot=1 s=white hpf=1400 room=.2 env=&snap
&sn tags="drums" gain=.25 s=white hpf=900 env=&tap
&bass tags="bass" s=saw loop=C2 lpf=900 lpq=4 env=&strike
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

&out postgain=2.05 map=sample [&beat, &bassPart, &stabs * &stab * .1, &hookPart,
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
# Lydian scale, I for two bars and II for two (^1: a degree up), in pad, acid and lead;
# one breath: a slow filter sweep moves the pad and the lead together.
&bar from meter &tempo
&tap, &click, &strike from envelopes
&tempo step=free(160bpm, 110..200)
&lydian scan(2 2 2 1 2 2 1) label="the harmony: {mode} on {tonic}"     # C, then D: two bars each

&pat &bd ~ &hh &hh*2 &sd ~ &bd &hh ~ &bd &sd &hh*3 ~ &bd &sd*4!2   # a bar of sixteenths
&break step=16n &pat &pat[::-1]                            # … then the same bar backwards
&hats step=pulse*7/4 &tick:0:.6 &tick:0:.3 &tick:0:.4 &tick:0:.3 &tick:0:.5 &tick:0:.3 &tick:0:.4  # seven to the bar
&pad over=&lydian step=1m/2 [0,2,4,6] [1,3,5,7]            # the chord, I then II
&lead 7 ~ 9 11 ~ 13 ~ 11 ~ ~ 9 ~                            # the lead: the chord's own tones, in triplets
&bleeps over=&lydian step=8t &lead!2 &lead^1!2
&riff 0 0 7 0 ~ 0 14 ~ 0 3 0 ~ 7 0 ~ 10
&acid over=&lydian step=16n &riff!2 &riff^1!2
&accent map=amp step=16n 1 .5 .8 .5 0 .5 1 0 .6 .5 .9 0 .7 .5 0 1      # louder, and brighter

&breath map=lin loop=&bar/8 .15 1 .15                       # one breath, for pad and lead

&bd note=36 oneshot=1 s=sine loop=A1 pitch=0..36 * &(map=adsr 0 .03 0 0) env=&(map=adsr 0 .2 0 .05)
&sd note=38 s=white hpf=900 env=&tap
&hh note=42 s=white hpf=9000 env=&click
&tick gain=.2 s=white hpf=11000 env=&(map=adsr 0 .015 0 .01)
&bleep s=tri loop=C5 lpf=800..5000 * &breath delaytime=&bar*4/3 delay=.3 delayfeedback=.4 room=.25 env=&(map=adsr .003 .12 .3 .1)
&saw303 s=saw loop=C2 lpf=150..2600 * &(map=adsr .002 .16 .12 .06) * &accent lpq=12 env=&strike
&pad1 s=saw loop=C4 lpf=500..2200 * &breath env=&(map=adsr 1.2 .5 .7 2) pitch=&(map=lin loop=.3 0 .15 0 -.15 0)

&mix postgain=1.66 map=sample [&break * .7, &hats, &bleeps * &bleep * .3,
                                  &acid * &accent * &saw303 * .4, &pad * &pad1 * .14]
\`\`\`
`,"in-c":`---
title: In C, a sketch
tags: [genre:minimal, genre:experimental, arrangement, motifs, rhythm]
description: "After Terry Riley's In C: four of its fifty-three cells, each player repeating a cell until moving on, and a player who sits out comes back where they left off."
---

\`\`\`cells
&resumeNote label="restart=resume: a player switched off is not rewound. Take restart=resume off &song (the default, restart) to hear each come back at the top of their score." about=&song
&bar from meter &tempo
&click from envelopes
&tempo step=free(104bpm, 60..140)
&key scale(major)

# the cells (after the score's first four, simplified), in eighths
&c1 0 2 0 2 0 2
&c2 0 2 3 2
&c3 ~ 2 3 2
&c4 ~ 2 3 4

# a player's score: each cell repeated, then on to the next. Each player is a section of &sections and moves at their own pace
&alice over=&key step=&aliceBar*2 &c1!8 &c2!6 &c3!4 &c4!4
&bob over=&key step=&bobBar*2 &c1!6 &c2!6 &c3!6 &c4!2
&carol over=&key step=&carolBar*2 &c2!6 &c3!8 &c4!6

&sections step=4n &aliceBar &bobBar &carolBar
# who plays, a bar a step: Alice from the start, Bob in and out, Carol late, then everyone
&song over=&sections restart=resume step=1m laps=1 0 [0,1]!2 0 [0,2] [0,1,2] [0,1,2] [1,2] [0,1,2] [0,1,2] [0,2] [0,1,2]

&pulse s=sine loop=C6 env=&click
&marimba s=tri loop=C4 env=&(map=adsr .005 .25 0 .15)
&vibes s=sine loop=C5 env=&(map=adsr .005 .5 .1 .3)
&bell s=sine loop=C3 env=&(map=adsr .005 .8 0 .4)
&out map=sample postgain=3.8 [&alice * &marimba * .35, &bob * &vibes * .3, &carol * &bell * .35]
\`\`\`
`,jazz:`---
title: "Swing blues: 12 bars in C"
tags: [genre:jazz, genre:blues, rhythm]
description: "A 12-bar blues with swung eighths: the blues scale and the minor pentatonic as scans."
---

\`\`\`cells
&pluck, &snap from envelopes
&swingNote label="The swing is a slider." about=&swing
# A 12-bar blues in C, swung. The eighths are a meter of their own: long, short —
# their ratio is free (1 straight, 2 the triplet swing, 3 hard). Two scales, both scans:
# the blues scale for the riff, the minor pentatonic for the turnaround.
&bar meter("4/4") step=free(132bpm, 80..220)
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
&bass s=tri loop=C2 env=&pluck
&keys s=sine loop=C4 env=&(map=adsr .005 .3 .2 .2)
&cym gain=.25 s=white hpf=8000 env=&snap

&mix postgain=2.03 map=sample [&lick * &horn * .5,
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
&bar from meter &tempo
&tempo step=free(48bpm, 30..90)
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
&bar from meter 92bpm
&tune over=&kalimba step=8n label="the tune" 0 2 4 ~ 3 4 5 ~ 4 2 1 ~ 0 ~!3 5 ~ 4 3 2 ~ 1 2 0 ~!3 7 6 5 ~
&kalimba body=tine loop=C4 ring=3 hard=.3 board=box coupling=.06 label="the kalimba: eight tines on one board" 0 2 4 7 9 12 14 16

&out postgain=.168 map=sample [&tune * &kalimba * .5]
\`\`\`
`,kinderlied:`---
title: Kinderlieder, in pieces
tags: [genre:folk, diatonic, motifs, arrangement]
description: "Twinkle and Hänschen klein from the seed library: each tune's lines are motifs, each tune's shape a form, over a vamp of two chords, a root bass and the plainest beat."
---

Two children's songs, the kind a learner plays first, made of the seed library's pieces.
Each tune is its lines, each a motif of one bar: Twinkle's call \`twinkle\` and its answer \`wonder\`; Hänschen klein's call \`haenschen\`, its open answer \`hinein\`, its close \`heim\` and its bridge \`weinet\`.
Each tune's shape is a form: Twinkle's is \`ternary\`, A B A, its bridge the answer a step up; Hänschen klein's is \`rounded_binary\`, A A′ B A′.
The band is the library's too: the plainest beat, \`kinderlied_drums\` (the kick on one and three, the snare on two and four, a closed hat on every beat), a vamp of two chords, the tonic for four bars and the fifth for four, and the root bass under it.

\`\`\`cells
&bar from meter &tempo
&tempo step=free(100bpm, 80..120)
&key from diatonic(mode=ionian) C
&harm from vamp_to_the_fifth &key
&bassline from root_bass &harm
&drums, &drumsOut from drums_performer &drumlines
&bass, &bassOut from bass_performer &bassline
&leadOut from lead_performer &leadline
&kick, &backbeat, &hat from kinderlied_drums
&drumlines [&kick, &backbeat, &hat]
&bandNote label="The band: the Kinderlied beat, a vamp of the tonic and the fifth, the root bass, all from the library." about=(&drumlines &harm &bassline)
\`\`\`

## The tunes, in pieces

Each line is a motif of the library's, a bar of eighths over the key.
The forms put them together: \`ternary\` takes Twinkle's call and names its answer, and makes its bridge of the answer a step up, *up above the world so high*; \`rounded_binary\` takes Hänschen klein's call and names its open answer, its close and its bridge, which it plays twice, the second time a step up, *hat ja nun kein Hänschen mehr*.

\`\`\`cells
&twinkle from twinkle &key
&wonder from wonder &key
&haenschen from haenschen &key
&hinein from hinein &key
&heim from heim &key
&weinet from weinet &key
&twinkleSong from ternary(answer=&wonder) &twinkle
&haenschenSong from rounded_binary(answer=&hinein, close=&heim, bridge=&weinet) &haenschen
&leadline step=8n ~@16 &twinkleSong &haenschenSong
&tuneNote label="Twinkle in 6 bars after a 2-bar intro, then Hänschen klein in 8: each tune its motifs, each shape a form." about=(&twinkleSong &haenschenSong)
\`\`\`

## The sound

A music box for the tune, a soft round bass, and the general MIDI kit for the drums.

\`\`\`cells
&bassV s=sine loop=C3 env=&(map=adsr .005 .4 .4 .1)
&leadV s=tri loop=C5 env=&(map=adsr .005 .3 .3 .2)
&out map=sample postgain=1.6 [&drumsOut * .7, &bassOut * .8, &leadOut * .6]
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
&bar from meter &tempo
&tempo step=free(144bpm, 100..200)

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
&bar scan(28 37 35) step=&tempo
&tempo step=free(56bpm, 40..72)
&key scale(major)                       # C major

&rock 4@3 2 2@2 4@3 2 4@2                    # lul-la-by and good night
&rise 7@2 6@3 5 5@2 4@2 1 2                  # with ro-ses be-dight
&turn 6@2 5 4@2 6 7@4 0 0
&high 7@3 5 3@2 4@3 2 0@2                    # sung twice
&home 3@2 2@2 1@2 0@4 2 2                    # … and the next pickup
&song over=&key step=8n &rock &rise &rock^-1 &turn &high 3@2 4@2 5@2 4@4 0 0 &high &home

&roots over=&key step=1m 0!3 4!4 0 3 0 4 0 3 0 4 0

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
&tap, &click from envelopes
&chooseNote label="Choose the time signature and the grid — a click on every beat, eighth, sixteenth or triplet — the tempo and the swing." about=&bar
&levelsNote label="The bar's own steps carry their levels (the downbeat, the beats, the subdivisions): the clicks read them through a kit." about=(&bar &clicks)
# The bar is a meter: meter(signature, steps a pulse) writes it as levels — 0 the downbeat (*),
# 1 a beat (+), 2 a half (-), 3 a subdivision (.), 4 finer (,). Its bpm counts beats, however fine
# its steps. Read through &clicks (a kit), each level has its own click: a tonal tick, no noise —
# the downbeat the highest and longest, each finer division lower and shorter.
&bar meter(free(2, 0..7, "2/4 3/4 4/4 5/4 6/8 7/8 9/8 12/8"), free(0, 0..3, "1 2 3 4")) step=&tempo swing=8n:free(.5, .5...75) over=&clicks label="**{tempo}** beats a minute"
&tempo step=free(100bpm, 40..208)
&clicks &down &beatc &half &sub &fine
&down s=sine loop=G6 pitch=0..7 * &(map=adsr 0 .008 0 0) env=&tap
&beatc s=sine loop=D6 pitch=0..5 * &(map=adsr 0 .006 0 0) env=&(map=adsr 0 .05 0 .025)
&half s=sine loop=A5 pitch=0..3 * &(map=adsr 0 .005 0 0) env=&click
&sub s=sine loop=E5 env=&click
&fine s=sine loop=B4 env=&(map=adsr 0 .018 0 .01)
&mix postgain=11.3 map=sample [&bar * free(.8, 0..1)]
\`\`\`
`,"midi-out":`---
title: "MIDI out: a band on a synth"
tags: [tutorial, genre:electronic, MIDI]
tier: 9
description: "The piece names where its notes go: a melody and a bass on a synth's channels 1 and 2, the drums on 10. The bass is on the synth alone: sent, and heard at its entry's gain."
---

\`\`\`cells
&cardNote label="map=midi makes a MIDI card: its entries are channels, in order: the theme on the reed goes out on 1, the bass on the sub on 2; ~ would skip one. &sub is on no sound card: it is sent on 2, and heard as the MIDI card hears it, at its entry's gain." about=&synth
&drumNote label="map=midi(10): the whole card on channel 10, the drums by General MIDI note (bd 36, sd 38, hh 42). map=midi(10, 2) would send it to output slot 2, a device chosen in the MIDI page." about=&drums
&bar from meter 104bpm

&theme over=scale(minor, A) step=4n 0 2 4 2 3 1 0 ~
&bass over=scale(minor, A) step=2n 0 5 3 4
&groove step=8n &bd ~ &hh ~ &sd ~ &hh &hh

&reed s=square loop=C4 lpf=1800 env=&(map=adsr .01 .2 .5 .3)
&sub loop=C2
&bd, &sd, &hh from gm_kit

&out map=sample postgain=1.375 [&theme * &reed * .5, &groove * .6]
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
&bar from meter &tempo
&swell from envelopes
&tempo step=free(andante)
&key scale(dorian, &tonic) label="{mode} on {tonic}"
&tonic D

&m 0 1 2 4 3 1 2@2
&tune over=&key step=8n &m &m[::-1] &m^$7 &m[0:4]!2 &m[-1]@4
&answer over=&key step=8n inverse(&m) degree(inverse(&m), 4) inverse(&m) degree(inverse(&m), 4) 0@8

&flute s=tri loop=D4 env=&swell
&cello s=saw loop=D3 lpf=1200 env=&swell
&out map=sample postgain=4.22 [&tune * &flute * .35, &answer * &cello * .25]
\`\`\`
`,moving:`---
title: "Moving parameters: a filter that opens"
tags: [tutorial, sound]
tier: 6
description: A bass line whose filter opens on every note and swells over four bars, with accents and a fade.
---

\`\`\`cells
&strike from envelopes
&rangeNote label="lpf=150..2800 * &fenv * &swell: the cutoff moves in that range, scaled by an envelope on every note and a slow swell." about=&acid
&dbNote label="map=db: a volume in decibels, 0 as it is, −6 about half." about=&fade
&bar from meter &tempo
&tempo step=free(moderato)

&line step=16n 0 0 12 0 ~ 0 10 0 0 3 0 ~ 7 0 12 ~
&accent map=amp step=16n 1 .5 .9 .5 0 .6 1 .5 .8 .5 .7 0 1 .5 .9 0
&swell map=lin loop=&bar/4 .2 1 .2
&fade map=db step=1m 0 -3 -6 -3

&acid s=saw loop=C2 lpf=150..2800 * &(map=adsr .002 .15 .1 .05) * &swell lpq=10 env=&strike
&out map=sample postgain=9.12 [&line * &acid * &accent * &fade * .4]
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
&bar scan(1 1 1) step=&tempo motor=6 mass=1.2 friction=.4 wind=36
&tempo step=96bpm
&major scan(2 2 1 2 2 2 1) label="{mode} on {tonic}"
&tune over=&major step=8n label="the comb" 4 2 0 2 4 4 4@2 3 2 1 2 3 1 -1 1 3 3 3@2 2 1 0@2
&low over=&major step=4n label="the bass" -14 -12 -10 -14 -12 -10!2 -8 -6 -10 -8 -6
&tick step=4n label="the escapement" 0!3

&m s=sine ratio=7.1
&comb oneshot=1 pan=.36 s=sine loop=C5 fm=&m index=.2..1.6 * &(map=adsr .001 .06 .1 .1) room=.35 env=&(map=adsr .001 1.1 0 1)
&combLow oneshot=1 pan=.61 s=sine loop=C5 fm=&m index=.1...8 * &(map=adsr .001 .06 .1 .1) env=&(map=adsr .001 1.4 0 1.2)
&tickv s=white hpf=6500 env=&(map=adsr 0 .012 0 .01)

&out postgain=5.47 map=sample [&tune * &comb * .22, &low * &combLow * .18, &tick * &tickv * .05]
\`\`\`
`,onemore:`---
title: One more Cell
tags: [genre:electronic, genre:dance, artist:Daft Punk, diatonic]
description: "French filter house, an original: maj7 chords chopped in a funky rhythm under one long filter sweep."
---

\`\`\`cells
&vibrato from vibrato
&strike, &thump, &snap, &click from envelopes
&chordsNote label="Parallel maj7 chords chopped in a funky sixteenth rhythm, F G A B♭." about=(&chop &prog)
&sweepNote label="One long filter sweep, pumping on every beat." about=(&filt &pump)
&discoNote label="Disco octaves and a robotic lead." about=(&disco &robot)
&fourFloorNote label="Four-on-the-floor." about=&beat
&loopNote label="A loop: open it up and let it ride." about=&song
# One more Cell — the chords are one shape (maj7) moved F G A B♭ (&prog): parallel, as the
# filter-house records did. The pump: the chords duck on every beat (a volume stream).
&bar from meter &tempo
&tempo step=free(122bpm, 110..130)
&prog step=1m/2 tags="chords" 0 2 4 5                                        # F G A B♭, two bars each
&c tags="chords" [0,4,7,11]
&chop tags="chords" step=&choppyBar*4 label="the chop" &c ~ &c!2 ~ &c ~ &c ~ &c!2 ~ &c ~ &c!2
&pump tags="chords" map=amp step=4n .35 .55 .75 .95
&disco tags="bass" step=&discBar*2 0 12 0 12 0 12 0 12
&robot tags="robot" step=&robBar*2 label="the robot" ~ 12 14 16 ~ 16 14 12 ~ 14 16 17 ~ 16 14 ~ ~ 12 14 16 ~ 19 17 16 14@2 12@2 9@4
&filt tags="chords" map=lin loop=&bar/32 .06 .3 1 .7 .06
&beat tags="groove" step=&grooveBar*2 &bd &oh [&bd,&cp] &oh &bd &oh [&bd,&cp] &oh   # four on the floor, the clap on two and four, the open hat between
&shake tags="groove" step=&grooveBar*4 0? 0?.7 0? 0?.7

&keys tags="chords" s=square loop=F3 lpf=200..6500 * &filt lpq=5 env=&strike
&bass tags="bass" s=square loop=F1 lpf=700 env=&strike
&lead tags="robot" s=square loop=F4 lpf=1400 lpq=9 delaytime=&bar*4/3 delay=.25 delayfeedback=.3 env=&(map=adsr .02 .2 .7 .15) pitch=&vibrato
&bd note=36 tags="groove" gain=.8 oneshot=1 s=sine loop=A1 pitch=0..26 * &(map=adsr 0 .05 0 0) env=&thump
&cp note=39 tags="groove" gain=.3 oneshot=1 s=white hpf=1300 room=.25 env=&snap
&oh note=46 tags="groove" gain=.15 s=white hpf=7000 env=&(map=adsr 0 .18 0 .08)
&sh tags="groove" s=white hpf=10000 env=&click

&sections step=4n &grooveBar &choppyBar &discBar &robBar
&song over=&sections step=1m/8 label="filtered · groove · lead · breakdown" [0,1] [0,1,2] [0,1,2,3] [1,3]

&out postgain=2.57 map=sample [&beat, &shake * &sh * .1,
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
&bar from meter &tempo
&vibrato from vibrato
&tempo step=free(66bpm, 40..100)
&ground step=4n 0 -5 -3 -8 -7 -12 -7 -5                   # D A B F# G D G A — two bars, forever

# the line: three variations of two bars each (D = 0)
&line step=8n show=notes &(16@2 14@2 12@2 11@2 9@2 7@2 9@2 11@2) &(12@2 11@2 9@2 7@2 5@2 4@2 5@2 2@2) &(0 4 7 5 4 0 4 2 0 -3 0 7 5 9 7 5)

&cello s=saw loop=D3 lpf=900 env=&(map=adsr .03 .3 .7 .3)
&violin s=saw loop=D4 lpf=2600 env=&(map=adsr .08 .2 .8 .4) pitch=&vibrato

# the canon: each violin is the line a variation later ([<<]); each enters a ground later
&out postgain=2.12 map=sample [&ground * &cello * .6,
                                  &line[<<] * &(map=amp step=cycle(&ground) 0 1!11) * &violin * .35,
                                  &line[<<2] * &(map=amp step=cycle(&ground) 0 0 1!10) * &violin * .25] [
                                  &ground * &cello * .6,
                                  &line[<<2] * &(map=amp step=cycle(&ground) 0 0 1!10) * &violin * .25,
                                  &line * &(map=amp step=cycle(&ground) 0 0 0 1!9) * &violin * .35]
&parts scope=spectrum channels=split label="the ground and the canon, each its own" &ground &line
\`\`\`
`,patchbay:`---
title: "Patchbay: a modular patch"
tags: [genre:electronic, sound]
description: "A Berlin-school patch on the modules: two oscillators into one resonant low-pass, its cutoff patched from a contour and a slow LFO, its resonance from a sample and hold, then an amp and an echo."
---

\`\`\`cells
# Patchbay: a modular synthesizer's patch, each module a line and each cable a reference. Two oscillators an octave apart
# into one resonant low-pass (a VCF after a mixer: decision 067), its cutoff patched from a contour on every note and a
# slow LFO, its resonance from a sample and hold; then an amp, and an echo. A sixteen-step sequencer in A minor, moved
# every two bars, plays it.
&patchNote label="Each module is a fragment: its jacks are its parameters, a knob at its default until a cable (a cell) is patched in: lowpass(eg=&contour, cutoff=&sweep, res=&jitter)." about=(&vcf &vca)
&modNote label="The modulation: a contour on every note (&contour), an LFO once every eight bars (&sweep), a value at random each eighth, held (&jitter)." about=(&contour &sweep &jitter)
&bar from meter &tempo
&thump, &click from envelopes
&tempo step=free(116bpm, 90..140)
&key scale(minor, &tonic)
&tonic A

&seq over=&key step=16n 0 7 2 7 4 7 2 9 0 7 2 7 4 11 9 7
&changes step=1m/2 0 5 3 -2
&accent map=amp step=16n 1 .4 .6 .4 .9 .4 .6 .4 1 .4 .6 .4 .9 .5 .7 .5

&contour map=adsr .002 .22 .1 .08
&sweep loop=&bar/16 from lfo
&jitter from sh
&drift loop=&bar/8 map=lin 0 .12 0

&saw s=saw loop=C2 from osc
&sub s=square loop=C1 from osc(pitch=&drift)
&vcf delay=.3 delaytime=8n. delayfeedback=.45 from lowpass(eg=&contour, cutoff=&sweep, res=&jitter) [&saw, &sub * .5]
&vca from amp(eg=&(map=adsr .002 .3 .5 .06)) &vcf

&kick note=36 oneshot=1 s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0) env=&thump gain=.8
&hat oneshot=1 s=white hpf=7500 env=&click gain=.25
&beat step=16n &kick &hat &hat &hat [&kick,&hat] &hat &hat &hat:0:.5

&out map=sample postgain=2.85 [(&seq + &changes) * &accent * &vca * .35, &beat]
\`\`\`

The note ([docs/notes/modular.md](../docs/notes/modular.md)) writes the same patch flat, the filter and the echo on each oscillator: it plays the same notes, each through the same filter.
`,pertonos:`---
title: "Canon per tonos: rising a tone a pass"
tags: [genre:classical, artist:Bach, tonal, canon, stereo]
description: A canon on the royal theme that rises a whole tone each pass, as in the Musical Offering.
---

\`\`\`cells
&vibrato from vibrato
&swell from envelopes
# After Bach, Musical Offering: "Ascendenteque Modulatione ascendat Gloria Regis".
# The royal theme on top; below it a canon at the fifth, one bar apart;
# and every pass the whole piece rises a whole tone: C D E F# G# A# …
# (Bach's design; the inner voices here are written for this example.)
&bar scan(27 23 26 24) step=&tempo
&tempo step=free(72bpm, 56..92)
&key step=cycle(&theme) stride=2 cycle=2       # a whole tone per pass: up two octaves, then round
&scale over=&key scan(2 1 2 2 1 2 2)                  # C minor (Aeolian); 6# is the leading tone

&theme over=&scale step=4n 0@2 2@2 4@2 5@2 6#@2 ~ 7 6# 6 5# 5 4@2 ~@2

# the canon: five one-bar motifs, written in place; the cello reads them a bar later (&alto[<<])
&alto over=&scale step=4n &(4 4 7 7) &(7!4) &(8 4 7 5) &(8 7 5# 3) &(8 4 8 8)

&reed pan=.28 s=saw loop=C4 lpf=2600 lpq=1 room=.35 env=&(map=adsr .03 .4 .6 .3) pitch=&vibrato
&viola pan=.2 loop=C3 lpf=1400 room=.3 env=&swell 0 1
&cello pan=.81 s=tri loop=C2 env=&(map=adsr .01 .5 .6 .3)

# stereo: each voice placed with its own pan= (the reed and the viola left, the cello right)
&out postgain=1.58 map=sample [&theme * &reed * 0.45, &alto * &viola * 0.3, (&alto[<<] - 7) * &cello * 0.9]   # the cello a bar behind, a fifth below
\`\`\`
`,phase:`---
title: Cell Phase
tags: [genre:experimental, genre:minimal, artist:Steve Reich, modal, rhythm, stereo]
description: "After Steve Reich's Piano Phase, an original: two pianos, one pattern of twelve, slowly slipping apart."
---

\`\`\`cells
&tap from envelopes
&driftNote label="The right one plays 81 notes in the time of the left one's 80 — it slips a note ahead every 81, through all twelve alignments, back to unison after 81 rounds." about=(&left &right)
&woodNote label="A quiet euclid(5, 12) on low wood marks the left player's twelve." about=(&wood &left)
# Cell Phase — no tempo is nudged: the drift is a ratio of clocks. &left steps in sixteenths
# (step=16n); &right in pulse*81/20 — a sixteenth times 80/81. Every 81 of its notes, it's one ahead.
&bar scan(1 1 1) step=&tempo
&tempo step=free(144bpm, 100..180)
&minor scan(2 1 2 2 1 2 2) label="{mode} on {tonic}"
&pattern 0 2 4 5 7 5 4 2 1 4 7 9
&left over=&minor step=16n label="left: in time" &pattern
&right over=&minor step=pulse*81/20 label="right: 81 notes to the left's 80" &pattern
&wood step=16n label="euclid(5, 12): the left player's twelve" euclid(5, 12)

&mL s=sine ratio=1
&mR s=sine ratio=1
&pianoL pan=.15 s=sine loop=E4 fm=&mL index=.2..1.6 * &(map=adsr .001 .3 .1 .2) room=.25 env=&(map=adsr .002 .6 .2 .2)
&pianoR pan=.85 s=sine loop=E4 fm=&mR index=.2..1.6 * &(map=adsr .001 .3 .1 .2) room=.25 env=&(map=adsr .002 .6 .2 .2)
&woodv s=sine loop=E2 pitch=0..12 * &(map=adsr 0 .03 0 0) env=&tap

&out postgain=3.58 map=sample [&left * &pianoL * .2, &right * &pianoR * .2, &wood * &woodv * .1]
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
&bar from meter 96bpm

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
&vibrato from vibrato
&strike, &thump, &snap, &click from envelopes
# The four chords: I – V – vi – IV, a bar each, in C. Written as scale degrees
# over the major scale, each chord comes out the right kind: C, G, Am, F.
# Arranged: each part is a section stepped by the bar, and &song switches the sections,
# four bars a step — intro, verses, choruses, a break, an outro and an end.
&bar from meter &tempo
&tempo step=free(100bpm, 70..140)
&major scan(2 2 1 2 2 2 1)
&chords tags="keys" over=&major step=&keysBar*2 [0,2,4]!8 [4,6,8]!8 [5,7,9]!8 [3,5,7]!8
&roots tags="bass" over=&major step=&bassBar*2 0!8 4!8 5!8 3!8

&hook tags="hook" 4 4 5 4                                             # the hook …
&tune tags="hook" over=&major step=&hookBar*2 &hook 2@2 0@2 &hook 2@2 ~@2 &hook^1 4@2 2@2 3 3 2 1 0@4           # … a step up in bar 3

&beat tags="drums" step=&beatBar &bd &sd &bd &sd
&hats tags="drums" step=&hatsBar*2 &hh:0:.5 &hh:0:.25 &hh:0:.5 &hh:0:.25 &hh:0:.5 &hh:0:.25 &hh:0:.5 &hh:0:.3

&lead tags="hook" s=square loop=C5 lpf=3000 env=&(map=adsr .01 .2 .6 .2) pitch=&vibrato
&keys tags="keys" s=tri loop=C4 env=&(map=adsr .005 .3 .3 .2)
&bass tags="bass" s=square loop=C2 lpf=500 env=&strike
&bd note=36 tags="drums" gain=.8 s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .04 0 0) env=&thump
&sd note=38 tags="drums" gain=.4 s=white hpf=1200 env=&snap
&hh note=42 tags="drums" gain=.2 s=white hpf=8000 env=&click

&final tags="keys" over=&major step=&endBar [0,2,4,7]@4                  # the last chord: C

# the sections the song switches: four bars a step — a section
# picked starts from its top; a chord of sections plays them together; laps=1: it ends
&sections step=4n &bassBar &keysBar &hookBar &hatsBar &beatBar &endBar
&song over=&sections step=1m/4 laps=1 label="intro · verse · verse · chorus · chorus · break · chorus · chorus · outro · end" [1,3] [0,1,3,4]!2 [0,1,2,3,4]!2 [1,2] [0,1,2,3,4]!2 [1] 5

&out postgain=2.31 map=sample [&hats,
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
&bar from meter &tempo
&tempo step=free(66bpm, 40..100)
&chords step=1m [0,4,7,12,16] [0,2,9,14,17] [-1,2,7,14,17] [0,4,7,12,16] [0,4,9,16,21] [0,2,6,9,14] [-1,2,7,14,19] [-1,0,4,7,12] [-3,0,4,7,12] [-10,-3,2,6,12] [
        -5,-1,2,7,11] [-5,-2,4,7,13] [-7,-3,2,9,14] [-7,-4,2,5,11] [-8,-5,0,7,12] [-8,-7,-3,0,5] [-10,-7,-3,0,5] [-17,-10,-5,-1,5] [-12,-8,-5,0,4]
&figure over=&chords step=16n 0 1 2 3 4 2 3 4         # the figure: twice a bar, in sixteenths

&saw s=saw loop=C4 lpf=1600 lpq=7 env=&(map=adsr .002 .3 .4 .25)    # a resonant sawtooth …
&sub s=square loop=C3 lpf=900 env=&(map=adsr .002 .3 .4 .25)       # … and a square an octave down
&moog [&saw, &sub * .35]

&mix postgain=2.99 map=sample [&figure * &moog * .5]
\`\`\`
`,radio:`---
title: "Radio: a style that drifts"
tags: [genre:dance, arrangement, modal]
description: "A score the default band plays, its style drifting by itself: articulation as three rates summed, energy once every two sections, syncopation and harmony left to sliders. The band's instruments follow."
---

A radio station written in cells (#576): a score whose section's style, \`&style\`, moves by itself.
The score is the default band's: it ends in \`* from band\`, and the band's instruments read \`&style\` where they sound, the bass's cutoff and the keys' and the pad's envelopes with articulation, the lead's cutoff with energy.

Two of the style's axes drift, each moved by a cell within a window a hand sets (decision 079): articulation's window by its two ends, \`artic=free(.2, 0..1)..free(.9, 0..1) * &drift\`, energy's by its centre and reach, \`energy=free(.55, 0..1) ± free(.25, 0..0.5) * &swell\`.
Articulation's drift is three sample-and-holds summed (decision 079), each a value drawn afresh each step and held for it: once a section of eight bars, once a song of 32, once a set of 128, weighted .5, .3 and .2, so it moves most from section to section and least over a set, as music's slow fluctuations do.
Energy's is one sample-and-hold, once every two sections.
So the band plays the section's style and moves on at the next one: the bass bites or closes, the keys strike or swell, the lead brightens or darkens.
The other two axes are left to sliders (\`free(…)\`), for a hand to set.

\`\`\`cells
&slidersNote label="The style: syncopation and harmony on sliders, articulation and energy drifting a section at a time." about=&style
&bar meter("4/4") step=&tempo
&tempo step=104bpm
&key from "diatonic(mode=dorian)" D
&harm over=&key step=1m [0,2,4] [3,5,7]
&kick step=4n &bd &bd &bd &bd
&drumlines [&kick]
&bassline over=&harm step=8n 0 ~ 0 2 ~ 0 4 ~
&padline over=&harm step=1m [0,1,2]
&stabline over=&harm step=2n ~ [0,2,4]
&leadline over=&key step=8n 4 ~ 3 2 0@4
&mine map=style sync=free(.3, 0..1) harm=free(.45, 0..1) artic=free(.2, 0..1)..free(.9, 0..1) * &drift energy=free(.55, 0..1) ± free(.25, 0..0.5) * &swell
&drift [&section * .5 + &song * .3 + &set * .2]
&section step=1m/8 [0|.25|.5|.75|1]
&song step=1m/32 [0|.25|.5|.75|1]
&set step=1m/128 [0|.25|.5|.75|1]
&swell step=1m/16 [0|.5|1]
&style style=&mine
* from band
\`\`\`

The weights are the drift's spectrum: how much it moves at each rate (\`docs/notes/571-style-at-every-scale.md\`). The sliders lean it: a hand moves the window, and the radio wanders inside it.
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
&bar from meter 104bpm
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
&out map=sample postgain=3.48 [&rhythm * &voice * .5]
\`\`\`
`,rhythm:`---
title: "Meter and rhythm: the tresillo"
tags: [tutorial, genre:world, rhythm]
tier: 4
description: The tresillo over a meter of its own, with hats, triplets and chords on the beat.
---

\`\`\`cells
&thump, &click from envelopes
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
&bd s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .05 0 0) env=&thump
&hh s=white hpf=7000 env=&click
&sh s=white hpf=4000 env=&click
&keys s=saw loop=C4 lpf=900 env=&(map=adsr .02 .4 .3 .3)
&mix postgain=2.86 map=sample [&kick * &bd, &hats * &hh * 0.4, &shake * &sh * 0.3, &chord * &keys * 0.5]
\`\`\`
`,ricercar:`---
title: "Ricercar: a study in counterpoint"
tags: [genre:classical, artist:Bach, tonal, counterpoint, stereo]
description: A study in counterpoint on the King's theme, from strict to free, in six passes.
---

\`\`\`cells
&vibrato from vibrato
&passesNote label="A pass each: 1 the theme alone · 2 note against note, above · 3 note against note, below · 4 two against one · 5 four against one · 6 free, in three voices." about=(&upper &lower)
&consonanceNote label="On every note of the theme the voices agree (consonances only); between, a dissonance only passes, by step." about=(&theme &upper &lower)

&bar scan(27 23 26 24) step=&tempo laps=30                       # thirty bars: six passes of the theme, then it ends
&tempo step=free(66bpm, 40..96)
&theme over=&scale step=4n label="the King's theme" 0@2 2@2 4@2 5@2 6#@2 ~ 7 6# 6 5# 5 4@2 ~@2
&scale over=&key scan(2 1 2 2 1 2 2)                   # … read in C minor,
&key step=cycle(&theme) stride=free(0, 0..7) label="per tonos · in **{tonic}**"   # raise stride: a key higher each pass

# the counterpoints, in semitones over the key (they transpose with the theme), in eighths
&first over=&key label="1 : 1 above — *first species*" 24@4 22@4 19@4 17@4 20@4 ~@2 19@2 20@2 22@2 24@2 20@2 22@4 ~@4
&under over=&key label="1 : 1 below — the bass" -12@4 -13@4 -12@4 -19@4 -17@4 ~@2 -19@2 -16@2 -17@2 -15@2 -13@2 -12@4 ~@4
&second over=&key label="2 : 1 — *second species*" 19@2 17@2 19@2 20@2 19@2 17@2 15@2 17@2 19@2 21@2 ~@2 19@2 20@2 19@2 21@2 17@2 15@2 14@2 ~@4
&third over=&key label="4 : 1 — *third species*" 19 17 19 20 19 17 19 21 19 20 19 21 23 21 22 24 23 21 22 20 ~@2 19 21 23 21 19 17 21 24 23 21 22 20 22 19 ~@4
&florid over=&key label="free, over the bass" 19 17 19 20 19 17 19 20 19 21 22 24 17 20 22 24 23 24 26 23 ~@2 21 24 23 21 19 22 24 22 20 22 24 22 20 19 ~@4

&upper step=8n ~@40 &first ~@40 &second &third &florid        # a pass each: alone · above · (below) · 2:1 · 4:1 · free
&lower step=8n ~@80 &under ~@80 &under                         # the bass: in pass 3, and again under the free line

&organ loop=C4 map=lin 0 1 env=&(map=adsr .03 .25 .7 .6)        # one pipe, one breath: the theme
&flute pan=.28 s=sine loop=C4 env=&(map=adsr .03 .1 .8 .2) pitch=&vibrato
&bourdon pan=.7 s=tri loop=C4 lpf=900 env=&(map=adsr .02 .15 .8 .3)

&out postgain=2.2 map=sample [&theme * &organ * .5, &upper * &flute * .45, &lower * &bourdon * .5]
\`\`\`
`,royal:`---
title: "Royal theme: all keys and modes"
tags: [genre:classical, artist:Bach, modal, chromatic, harmony]
description: Bach's royal theme through every key in fifths, then every mode.
---

\`\`\`cells
&vibrato from vibrato
# Bach's royal theme. Every pass of &theme moves &key a fifth (C G D A …);
# every full circle of &key (12 passes) moves &scale one degree.
&bar scan(27 23 26 24) step=&tempo                             # the clock: 4/4, bent * . + .
&tempo step=free(84bpm, 60..120)
&key step=cycle(&theme) stride=7            # the 12, a fifth per pass, round the circle
&scale over=&key scan(2 1 2 2 1 2 2) step=cycle(&key)           # Aeolian, a degree per circle, all seven

&theme over=&scale step=4n 0@2 2@2 4@2 5@2 6#@2 ~ 7 6# 6 5# 5 4@2 ~@2
&pedal over=&scale step=2n 0                  # one note every two beats

# voices: loop= is pitch 0 (turns per second); sound in dough notation
&lead s=saw loop=C4 lpf=2200 lpq=2 room=.3 env=&(map=adsr .01 .3 .4 .4) pitch=&vibrato
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
&bar from meter &tempo
&tempo step=free(112bpm, 90..140)
&key from diatonic(mode=dorian) D

&m1 4!4
&m2 4 4 0 2
&m3 3 2 0 0
&m4 0@2!2
&A &m1 &m2
&C &m3 &m4
&tune over=&key step=8n &A &A^-1 &A &C

&bassline over=&key step=4n 4!4 3!4
&drums step=8n &bd &hh &sd &hh!4           # kick, hat, snare, hat

&fiddle s=saw loop=C5 lpf=3000 env=&(map=adsr .01 .15 .5 .1)
&bass s=square loop=C2 lpf=600 env=&thump
&bd note=36 s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .05 0 0) env=&thump
&sd from gm_kit
&thump, &click from envelopes
&hh note=42 s=white hpf=7000 env=&click
&mix postgain=2.03 map=sample [&tune * &fiddle * 0.6, &bassline * &bass * 0.8, &drums * 0.6]
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
&out map=sample postgain=2.42 [&climb * &voice * .5]
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
&bar from meter 72bpm
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
`,spooky:`---
title: Spooky, in pieces
tags: [genre:electronic, harmony, rhythm, arrangement, motifs]
description: "A heartbeat in 5/4, a bass that creeps, an organ's i–♭VI–iv–V in D harmonic minor, a celesta, and a theremin singing the Dies irae: the band, the tune and its form are the seed library's."
---

Halloween music counts in fives, so the beat never settles; its key is a minor with a raised seventh, and its tune is a chant of the day of wrath.
Here the band comes from the seed library, taken by name, and so does the tune: the drummer and its kit, the key, a four-bar cadence, a bass line, the bass, pad, stab and lead players, and the beat, the bass and the tune Spooky gave the library (\`spooky_drums\`, \`creeping_bass\`, \`dark_cadence\`, \`diesIrae\`).
The piece writes only what is its own: the tempo, the key's tonic, the stabs, who plays when, and the sound of each instrument.

\`\`\`cells
&drums, &drumsOut from drums_performer &drumlines
&key from harmonic_minor D
&harm from dark_cadence &key
&bassline from creeping_bass &harm
&kick, &hat, &euclid from spooky_drums
&bass, &bassOut from bass_performer(bassLevel=&bassLevel) &bassline
&pad, &padOut from pad_performer(padLevel=&padLevel) &padline
&stab, &stabOut from stab_performer(stabLevel=&stabLevel) &stabline
&leadOut from lead_performer(leadLevel=&leadLevel) &leadline
&useNote label="The band is the library's: each use names what it takes. &bassV, &padV, &keysV and &leadV are the players' instruments, named so the piece can give each a sound of its own." about=(&bassV &padV &keysV &leadV)
\`\`\`

The meter is the library's, \`5/4\`, five beats to the bar, which leaves its tempo to the piece (\`&tempo\`), a slider.
The key is harmonic minor, from the library, on the tonic its line gives it, D (\`&key from harmonic_minor D\`, decision 065): its fifth is then A major, a dominant, and its sixth B♭ sits a semitone above it.

\`\`\`cells
&bar from meter(grouping=meter("5/4")) &tempo
&tempo step=free(100bpm, 80..120)
&fiveNote label="Five beats a bar: every line taps the meter, so the heart beats five times and the knock falls at the middle of the bar, between the third beat's strokes." about=&bar
\`\`\`

## The beat

\`spooky_drums\`, used above: a heartbeat on every beat, its second stroke a sixteenth late and softer, the ride ticking each beat like a clock, the rim knocking once, at the middle of the bar.
The piece takes its three limbs by name and hands them to the drummer as a stack, \`&drumlines\`, the heart under a level of the form's.

\`\`\`cells
&drumlines [&kick * &heartForm, &hat, &euclid * .25]
&beatNote label="The beat is a fragment: &kick, &hat and &euclid come from Spooky drums." about=(&kick &hat &euclid)
\`\`\`

## The chords, the bass and the stabs

\`dark_cadence\`, used above, is the harmony: D minor, B♭ major, G minor and A major, a bar each.
The organ holds each chord a bar (\`&padline\`); \`creeping_bass\` holds each root two beats, then creeps a semitone up and back, four beats long against the bar's five, so the creep comes a beat later each time round.
The celesta plays the stab player's part, the piece's own: a chord on the and of one and on four, a music box in another room.

\`\`\`cells
&padline over=&harm step=1m [0,1,2]
&stabline over=&harm step=8n ~ [0,1,2] ~ ~ ~ ~ [0,1,2] ~ ~ ~
&creepNote label="The bass is four beats long in a bar of five: its creep comes a beat later each bar." about=&bassline
\`\`\`

## The tune: the Dies irae

The tune is the motif \`diesIrae\`, the chant's head: F E F D E C♯ D, in eighths.
The theremin sings it over D minor, rests over B♭, sings it again three degrees up over G minor, and rests over A: one call a chord, two chords a phrase.

\`\`\`cells
&diesIrae from diesIrae &key
&leadline step=8n &diesIrae ~@2 ~@10 &diesIrae^3 ~@2 ~@10
&tuneNote label="The Dies irae, over D minor, then three degrees up over G minor." about=&leadline
\`\`\`

## The form, in levels

Sixteen bars, four times round the cadence: the heart and the knock alone; then the organ and the bass, and the theremin; then the celesta joins; the heart drops out for the last lap and comes back on the last bar.
Each player's level is a hole its fragment leaves; here it is the form.

\`\`\`cells
&heartForm map=amp step=1m 1!12 0!3 1
&padLevel map=amp step=1m 0!4 .5!12
&bassLevel map=amp step=1m 0!4 .8!12
&stabLevel map=amp step=1m 0!8 .5!8
&leadLevel map=amp step=1m 0!4 .6!12
&formNote label="The form: the heart (4 bars), the band and the theremin (4), the celesta (4), the last lap without the heart (4)." about=(&heartForm &padLevel &bassLevel &stabLevel &leadLevel)
\`\`\`

## The sound

The instruments the players play are voices with no sound of their own: the piece gives each one.
A round bass, an organ, a celesta an octave and more above the stab player's register, and a theremin, a sine with a slow attack and a wide, slow vibrato; and the wind, brown noise swelling once every four bars.

\`\`\`cells
&bassV s=tri loop=C3 lpf=500 env=&(map=adsr .01 .3 .6 .2)
&padV s=square loop=C3 lpf=1100 env=&(map=adsr .25 .2 .8 .6)
&keysV s=sine loop=C5 env=&(map=adsr .002 .7 0 .5)
&leadV s=sine loop=C4 env=&(map=adsr .15 .2 .9 .4) pitch=&(map=lin loop=5 0 .25 0 -.25 0)
&windline step=1m 0 ~ ~ ~
&howl s=brown lpf=700 env=&(map=adsr 2 1 .5 2)

&out map=sample postgain=1.93 [&drumsOut, &bassOut, &padOut * .25, &stabOut * .3, &leadOut * .5, &windline * &howl * .1]
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
&bar scan(27 23 26 24) step=&tempo
&tempo step=92bpm
&high label="*Mary had a little lamb*" over=scale(major) step=4n 2 1 0 1 2 2 2@2
&low over=scale(major) step=2n 0 3 4 0

&bell s=sine loop=C5 pan=.15 env=&(map=adsr .01 .6 .2 .6)
&cello glide=.12 s=saw loop=C3 lpf=900 pan=.85 env=&(map=adsr .03 .4 .6 .4)
&out postgain=1.57 map=sample [&high * &bell, &low * &cello]
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
&steps map=ed(25, 5)                                             # 25 steps to 5:1

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

&out postgain=11.3 map=sample [&forward * &dyn * &swell * .07, &backward * &fade * .07]
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
&bar meter("4/4") step=free(moderato)
&swing scan(2 1) step=4n                         # long, short: a pair a beat
&bar2 meter("4/4", 2) step=free(moderato) swing=8n:.67   # the same, written on the bar: its eighths

&walk over=scale(major, G) step=4n 0 2 4 5 7 5 4 2
&ride step=&swing:pulse 12!3 ~ 12!3 ~
&comp over=scale(major, G) step=&bar2:8n ~ [2,4,6] ~!3 [2,4,6] ~ [2,4,6]

&bass s=sine loop=G2 env=&(map=adsr .01 .4 .5 .1)
&cym s=white hpf=7000 env=&(map=adsr 0 .2 0 .1)
&piano s=tri loop=G3 env=&(map=adsr .005 .4 .2 .2)
&out map=sample postgain=3.38 [&walk * &bass * .5, &ride * &cym * .1, &comp * &piano * .15]
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
&bar from meter 72bpm
&key scale(minor, &tonic)
&tonic A

&hits step=1m/2 0
&tune over=&key step=4n 4 ~ 2 ~ 0@2 ~@2 2 4 7 ~ 4@4

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
&click, &thump from envelopes
&capstanNote label="Hold the capstan with your finger: a tape stop, the pitch diving; let go and it spins back up." about=&bar
&slackNote label="The hats ride a slack belt, dragging behind." about=&hats
&springEndNote label="At the end the spring gives out and the tape stops for good." about=&bar
# Tape Machine — the meter is the capstan: a motor (spinning up from rest), a little wow (its
# speed swings 0.55 times a second), varispeed=1 (pitch follows speed, as on tape), and a spring
# that holds for 40 s, then gives out: a tape stop. The hats ride a slack belt: they lag, then swing.
&bar meter("4/4") step=&tempo motor=1.4 mass=1 friction=.3 wow=.012 wind=40 varispeed=1
&tempo step=78bpm
&minor scan(2 1 2 2 1 2 2) label="{mode} on {tonic}"
&loop over=&minor step=8n label="the loop" 4 ~ 2 0 ~ 2 4 7@2 ~ 6 4 2 ~ 4@2 -1 ~
&chords over=&minor step=1m label="i · VI" [0,2,4,6] [-2,0,2,4]
&hats step=8n belt=30 mass=1.5 label="the hats, on a slack belt" ~ 0 ~ 0 ~ 0 ~ 0
&kick step=4n 0 ~ 0 ~

&keys pan=.375 s=tri loop=D4 lpf=2200 room=.4 delaytime=&bar*4/3 delay=.3 delayfeedback=.4 env=&(map=adsr .004 .5 .3 .4)
&pad s=saw loop=D3 lpf=700 room=.6 env=&(map=adsr 1 1 .8 2)
&hh pan=.6 s=white hpf=7000 env=&click
&bd s=sine loop=D1 pitch=0..16 * &(map=adsr 0 .05 0 0) env=&thump

&out postgain=9.03 map=sample [&loop * &keys * .16, &chords * &pad * .05, &hats * &hh * .1, &kick * &bd * .5]
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
&bar from meter 60bpm
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
&bar from meter &tempo
&tempo step=free(84bpm, 60..110)
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
&bell oneshot=1 pan=.38 s=sine loop=C5 fm=&m3 index=.8..6 * &(map=adsr .001 1.4 .15 1.2) room=.5 delaytime=&bar*4/3 delay=.3 delayfeedback=.35 env=&(map=adsr .002 3 0 2.5)
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
&out map=sample postgain=1.64 [&note * &voice]
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
&bar from meter 96bpm
&swell from envelopes

&key label="key: **{tonic}**" shift=2 size=1.5                # the 12, turned two: D. Turning it transposes
&mode label="{mode} on {tonic}\\n{notes}" over=&key scan(2 2 1 2 2 2 1) shift=1   # turned one: it walks the modes
&fixed label="fixed for a piece, in one line: {mode} on {tonic}" scale(dorian, E)   # the same seven notes: a key and a mode in one, the tonic its argument
&theme label="the theme: {notes}" show=notes over=&mode step=4n 0 2 4 7 4 2 0@2

&flute s=tri loop=C4 room=.3 env=&swell
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
&bar from meter 96bpm
&swell from envelopes
&key label="{mode} on {tonic}" scale(major)                 # C major

&up label="*twinkle twinkle, little star*" 0 0 4 4 5 5 4@2                    # twin-kle twin-kle lit-tle star
&down label="*how I wonder what you are*" 3 3 2 2 1 1 0@2                  # how I won-der what you are
&mid label="*up above the world so high*" &down^1                # up a-bove the world so high
&tune over=&key step=4n show=do &up &down &mid!2 &up &down         # show=do: in solfège, motifs and all

&bu 0 0 3 0
&bd 3 0 4 0
&roots over=&key step=2n &bu &bd &bu^1!2 &bu &bd       # the bass moves the same way

&lead s=tri loop=C5 env=&swell
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
&bar from meter &tempo
&swell from envelopes
&tempo step=free(andante)

&subject 0 -1 0@2 -5@2 -4@2 0 -1 0 2 -5@4
&answer base=&subject^$7 =!3 0@2
&low base=&subject^$-12 =!9 =@8

&alto step=16n &subject ~@36
&soprano step=16n ~@16 &answer ~@20
&bass step=16n ~@32 &low

&flute s=tri loop=C5 env=&swell
&reed s=tri loop=C4 env=&swell
&cello s=saw loop=C3 lpf=1200 env=&swell
&out map=sample postgain=6.49 [&soprano * &flute * .3, &alto * &reed * .3, &bass * &cello * .25]
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
&bar from meter &tempo
&tempo step=free(moderato)

&tune step=8n 0 4 7 12 7 4 0 ~ 2 5 9 14 9 5 2 ~
&line step=2n 7 9 5 7
&bass step=4n 0 0 7 0 2 2 9 2

&pluck s=tri loop=C4 env=&(map=adsr .005 .3 .1 .2)        # quick to start, quick to fade: a pluck
&pad s=saw loop=C4 env=&(map=adsr .5 .3 .6 .8)            # slow in, held, slow out: a swell
&low s=square loop=C2 env=&(map=adsr .005 .25 .5 .1)
&air s=pink env=&(map=adsr .3 .2 .5 .6)                   # a noise: no note of its own
&out map=sample postgain=7.72 [&tune * &pluck * .3, &line * &pad * .06, &bass * &low * .12, &line * &air * .04]
\`\`\`
`,waltz:`---
title: "Viennese waltz: oom-pah-pah"
tags: [genre:classical, tonal, rhythm]
description: "A waltz in G: oom on one, pah-pah on two and three, a flute above."
---

\`\`\`cells
# scan(28 37 35) pulls beat 2 early: short – long – long
&bar scan(28 37 35) step=&tempo
&tempo step=free(168bpm, 140..200)
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
&bar from meter 100bpm
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
&bar from meter 72bpm
&key scale(minor, &tonic)
&tonic D

&tune over=&key step=8n 0 ~ 4 ~ 7 ~!3 6 ~ 4 ~ 2 ~!3 0 ~ 1 2 4 ~!3

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
&bar from meter &tempo
&strike, &thump, &snap, &click from envelopes
&tempo step=free(112bpm, 90..140)
&minor scan(2 1 2 2 1 2 2)                                   # A minor (the voices sit on A)

&oct tags="bass" 0 12 0 12 0 12 0 12                                     # Oktaven: a bar of eighths
&bassline tags="bass" step=&bassBar*2 label="Bass: Oktaven" &oct!2 &oct^$-4!2 &oct^$3!2 &oct^$-2!2   # A · F · C · G

&shape tags="arpeggio" 0 2 4 7                                               # a chord's tones, up (degrees)
&arp tags="arpeggio" over=&minor step=&arpBar*4 label="Arpeggio" &shape!8 &shape^5!8 &shape^2!8 &shape^6!8   # on A, F, C, G
&sweep tags="arpeggio" map=lin loop=&bar/16 .1 1 .1

&melody tags="melody" over=&minor step=&melodyBar label="Melodie" 4@2 2 1 0@4 5@2 4 2 4@4 2@2 1 0 1@4 6@2 4 3 4@4

&beat tags="beat" step=&beatBar &bd &sd &bd &sd
&ticks tags="beat" map=amp step=&ticksBar*4 .5 .2 .3 .2 .5 .2 .3 .6

&bass tags="bass" s=square loop=A1 lpf=600 env=&strike
&arpeggio tags="arpeggio" s=square loop=A3 lpf=300..4000 * &sweep lpq=4 env=&(map=adsr .002 .1 .2 .05)
&lead tags="melody" s=saw loop=A4 lpf=2200 delaytime=&bar delay=.3 delayfeedback=.3 room=.2 env=&(map=adsr .03 .2 .7 .2)
&bd note=36 tags="beat" gain=.8 s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .05 0 0) env=&thump
&sd note=38 tags="beat" gain=.35 s=white hpf=1200 env=&snap
&metal tags="beat" s=square loop=A7 hpf=5000 env=&click

# Aufbau: the sections the song stacks — eight bars (the progression) a step
&teile step=4n &beatBar &ticksBar &bassBar &arpBar &melodyBar
&lied over=&teile step=1m/8 laps=1 label="Aufbau: Klick · Bass · Takt · Arpeggio · Melodie · Pause · alles · Klick" 1 [1,2] [0,1,2] [0,1,2,3] [0,1,2,3,4] [2,3] [0,1,2,3,4] 1

&out postgain=2.41 map=sample [&ticks * &metal * .12,
                         &beat,
                         &bassline * &bass * .5,
                         &arp * &arpeggio * .18,
                         &melody * &lead * .3]
\`\`\`
`};Object.fromEntries(Xx.map(e=>{let t=Zx[e];if(t===void 0)throw Error(`examples/${e}.md is missing`);let n=pr(t);if(`problems`in n)throw Error(`examples/${e}.md: ${n.problems.map(e=>`line ${e.line}: ${e.message}`).join(`; `)}`);return[e,{source:n.text,file:t}]})),Object.fromEntries(R.map((e,t)=>[e.name,Rt[t]])),[...sb,...cb];let Qx=`taken`,$x=/* @__PURE__ */ new Map;function eS(e,t){return n=>{let r=`${e}\u0000${n}`,i=$x.get(r);if(i)return $x.delete(r),$x.set(r,i),i;let a=yf(n,void 0,{resolve:t});return $x.set(r,a),$x.size>2048&&$x.delete($x.keys().next().value),a}}function tS(e,t){let n=new Map(Nf(t).map(e=>[e.name,e.code]));return Nf(e).some(e=>n.has(e.name)&&n.get(e.name)!==e.code)}function nS(e,t){if(Go(e)||tS(e,t))return null;let n=new Map(Nf(t).map(e=>[e.name,e.code])),r=t.replace(/\s+$/,``),i=Nf(e).filter(e=>n.get(e.name)!==e.code).map(e=>e.written);return[...r?[r]:[],...i].join(`
`)}function rS(e,t,n){let r=Ko(e)!==null,i=(t,n)=>r&&t===Qx?e:Y_(t,n),a=eS(r?e:``,i);return{text:r?Xf(t,Qx,{resolve:i,compiled:a,...n}).text:nS(e,t)??Zf(Qx,t,{resolve:(t,n)=>t===Qx?e:Y_(t,n),compiled:a}).text,resolve:i,compiled:a}}let iS=({text:e,compiled:t})=>t(e),aS=[`transpose`,`invert`,`bend`,`trim`],oS=e=>[`&bar meter("${e}") step=120bpm`,`&key scale(ionian, C)`].join(`
`),sS=({degree:e,alter:t})=>`${e}${(t>0?`#`:`b`).repeat(Math.abs(t))}`;function cS(e,t){let n=[...e].sort((e,t)=>e.step-t.step),r=Jb(n.map(e=>e.step),t),i=Math.max(1,Math.ceil(((n.at(-1)?.step??0)+1)/t)),a=Array.from({length:i*t/r.length},(e,t)=>{let i=n.find(e=>e.step===t*r.length);return i?sS(i):`~`});return`&lead over=&key step=${r.tap} ${a.join(` `)}`}function lS(e,t){let n=Kb(t);if(!n)return null;let r=iS(rS(e,oS(n),{head:`&lead`,main:`&key`}));if(!r.ok)return null;let i=r.cells.get(`lead`);if(!i?.step)return null;let a=r.cells.get(i.step.driver)?.meter??null,{tap:o}=i.step,s=C_(o,a);if(s===null||!a||!o||i.steps<1)return null;let c=F(t),l=a.pulses/a.unit/c,u=i.steps*s/(l*c);if(u<1-1e-9)return uS(e,t,o,i.steps,u);if(Math.abs(u-Math.round(u))>1e-9)return null;let d=Math.round(u),f=[],p=gi(r);for(let e of dd(r,`lead`,p)){if(e.table!==`key`||e.tableShift!==0||(e.transpose??0)!==0)return null;let t=e.step*s/l,n=Math.round(t);if(Math.abs(t-n)>1e-6||n<0||n>=d*c)return null;let{value:i,alter:a}=fd(r,e,p);f.push({step:n,degree:i+0,alter:a+0})}return f.length?{bars:d,notes:f.sort((e,t)=>e.step-t.step)}:null}function uS(e,t,n,r,i){let a=r/i-r;return Math.abs(a-Math.round(a))>1e-9||Math.round(a)<1?null:lS(`${e.replace(/^&lead(?=\s)/m,`&leadLine`)}\n&lead step=${n} &leadLine ~@${Math.round(a)}`,t)}function dS(e){let t=RegExp(`^&${e.id}(?=\\s)`,`m`),n=qo(e.text).replace(t,`&lead`);return{...e,text:n,association:e.association.map(e=>e.facet===`motif`?{...e,facet:Ev}:e)}}let fS=V_.map(dS);function pS(e=fS,t=lS){return{...Yb({facet:Ev,fragments:e,read:t,text:cS,vary:e=>({workbench:oS(e),operators:aS,degrees:[2]}),varies:e=>!hS(e)}),phrase:(e,t)=>yS(e,t,gS),keyed:(t,n)=>mS(e,t,n)}}function mS(e,t,n){let r=/* @__PURE__ */ new Set;for(let i=t;i!==void 0&&!r.has(i);){if(e.some(e=>e.id===i))return!0;let t=n?.filed.find(e=>e.fragment.id===i);if(t&&hS(t.fragment.text))return!0;r.add(i);let a=n?.filed.find(e=>e.fragment.id===i)?.meta.varies;i=typeof a==`string`?a:void 0}return!1}let hS=e=>/^&\w+ from \w/m.test(e);pS();let gS=j_.find(e=>e.id===`call_and_answer`);function _S(e){let t=Ko(e.text);return t?.main&&t.names.length===1?t.names[0]:null}let vS=/* @__PURE__ */ new Map;function yS(e,t,n){let r=F(t);if(r%2!=0||e.some(e=>e.step%2!=0||e.step>=r))return null;let i=Array.from({length:r/2},(t,n)=>{let r=e.find(e=>e.step===2*n);return r?sS(r):`~`}),a=`${n.id}\n${t.cycle}:${t.heights.join(` `)}\n${i.join(` `)}`;if(!vS.has(a)){let e=_S(n),r=e&&Xf(`&leadCall over=&key step=8n ${i.join(` `)}`,n.id,{resolve:(e,t)=>e===n.id?n.text:Y_(e,t),head:e,main:`&leadCall`});vS.set(a,r?lS(`${r.text}\n&lead step=8n ${e}`,t):null)}return vS.get(a)}let bS=e=>8/e;function xS(e){let t=yf(cr(e.text,`bar`,`step`,`120bpm`)),n=t.diagnostics.filter(e=>e.severity===`error`);if(n.length)return`it doesn't compile: ${n.map(e=>e.message).join(`; `)}`;let r=t.cells.get(`bar`)?.meter;if(!r)return`it has no meter named &bar`;if(r.legato?.length)return`it articulates by level (legato=), which the band does not read`;let i=bS(r.unit),a=r.beats.reduce((e,t,n)=>[...e,n===0?0:e[n-1]+r.beats[n-1]*i],[]),o={cycle:r.pulses*i,heights:a},s=Object.values(ge).find(e=>Pp(e,o));if(!s)return`its meter, ${a.length} beats in ${o.cycle} eighths at ${a.join(` `)}, is none of the band's`;let c=r.swing??[];if(c.length>1)return`it swings on more than one level`;let[l]=c;return l?Tm.includes(l.level)?{id:e.id,meter:s,swing:{level:l.level,share:l.share}}:`it swings on ${l.level}, which the band does not`:{id:e.id,meter:s,swing:Em}}I_.map(e=>({id:e.id,read:xS(e)}));function SS(e=I_){let t=/* @__PURE__ */ new Map;for(let n of e){let e=xS(n);typeof e!=`string`&&t.set(n.id,e)}let n=fp([...e.filter(e=>t.has(e.id)),...z_]),r=t.size+z_.length;return{fragments:t,query:(e,i,a=[],o)=>(i?n.query(e,r+i.filed.length,{},{facet:`meter`,layer:i,...a.length?{chosen:a}:{},...o===void 0?{}:{pull:o}}).filter(e=>t.has(e.fragment.id)):n.query(e,t.size,{},{facet:`meter`})).map(e=>({id:e.fragment.id,distance:e.distance})),used:(e,t,r)=>Nb(kb(n,e,[{id:t,point:r,facet:`meter`}]))}}let CS=SS(),wS=[...I_,...z_,...M_,...N_,...fS],TS=e=>Object.keys(ge).find(t=>Pp(ge[t],e))??null,ES=e=>`&bar meter("${e}") step=120bpm`,DS=Uf(Y_,2048),OS=(e,t)=>nS(e,t)??DS(e,t).text;function kS({meter:e,meterFragment:t}){let n=I_.find(e=>e.id===t);if(n)return cr(n.text,`bar`,`step`,`120bpm`);let r=TS(e);return r?ES(r):null}function AS(e){let t=/^&(\w+) \[(.*)\]$/m.exec(e);return t?{line:t[0],name:t[1],terms:t[2].split(`, `)}:null}let jS=kp,MS=(e,t,n,r)=>jS.includes(e)?e:sx(t,n%F(r),r),NS=e=>Math.abs(e-Math.round(e))<1e-6?Math.round(e):e;function PS(e,t){return!TS(t)||!AS(e)?null:FS(e,t,Math.max(1,...Af(e,yf).clock.map(e=>e.bars)))}function FS(e,t,n,r){let i=TS(t),a=AS(e);if(!i||!a)return null;let o=iy(120,t),s=F(t)*n,c=[];for(let n of a.terms){let l=/^&(\w+)/.exec(n)[1];if(r!==void 0&&l!==r)continue;let u=e.replace(a.line,`&${a.name} map=midi(10) [${n}]`),d=qx(OS(Gb(u),ES(i)),void 0,{resolve:Y_}),f=tl(d.result,Xc(d.result));for(let e of Kx(d,0,s*o).events)for(let n of el(f(e))){let r=nl(e,n);if(!r||r.channel!==10)continue;let i=NS(r.at/o);if(!Number.isInteger(i)||i>=s)return null;let a=MS(l,r.note,i,t);if(a===null)return null;c.push({role:a,...a===l?{}:{line:l},note:r.note,step:i,velocity:r.velocity})}}return{bars:n,hits:LS(c)}}let IS=e=>({bars:e.bars,hits:e.hits.map(({role:e,note:t,step:n,velocity:r})=>({role:e,note:t,step:n,velocity:r}))}),LS=e=>[...e].sort((e,t)=>e.step-t.step||e.note-t.note),RS=e=>`${e.cycle}:${e.heights.join(` `)}`,zS=({fragment:e})=>e.association.some(e=>e.facet===`rhythm`),BS=(e=z_)=>e.filter(e=>!e.association.some(e=>e.facet===`rhythm`)||PS(e.text,ge[`4/4`])!==null);function VS(e=z_,t=(e,t)=>DS(e,t).fits,n=PS){e=BS(e);let r=fp([...e,...I_]),i=new Map(e.map(e=>[e.id,e.text])),a=(e,t)=>i.get(e)??t?.filed.find(t=>t.fragment.id===e)?.fragment.text,o=/* @__PURE__ */ new Map,s=/* @__PURE__ */ new Map,c=/* @__PURE__ */ new Map,l=/* @__PURE__ */ new Map,u=/* @__PURE__ */ new Map,d=/* @__PURE__ */ new Set,f=/* @__PURE__ */ new Map,p=(e,n)=>{let r=`${n.length}:${n}${e}`;return o.has(r)||o.set(r,t(e,n)),o.get(r)},m=e=>`${e.meterFragment??``}\n${RS(e.meter)}`,h=e=>{let t=m(e);return c.has(t)||c.set(t,kS(e)),c.get(t)},g=(e,t)=>{let n=`${e}\n${t}`;return l.has(n)||l.set(n,OS(e,t)),l.get(n)},_=(e,t,n)=>{let r=`${e}\n${t}\n${n}`;if(!u.has(r)){let a=i.get(e);u.set(r,a!==void 0&&a!==t&&!tS(a,g(t,n)))}return u.get(r)},v=(t,n,a,o,s)=>r.query(t,e.length+I_.length+(n?.filed.length??0),{},{facet:`rhythm`,...n?{layer:n}:{},...a.length?{chosen:a}:{},...s===void 0?{}:{pull:s}}).filter(e=>i.has(e.fragment.id)||e.distance<=o).map(e=>({id:e.fragment.id,text:e.fragment.text,distance:e.distance})),y=(e,t)=>{let r=`${e}\n${RS(t)}`;return s.has(r)||s.set(r,n(e,t)),s.get(r)},b=(e,t)=>y(e,t)!==null,x=(e,t)=>{let n=`${t.length}:${t}${e}`;return f.has(n)||f.set(n,pb(e,{workbench:[t,...Ub(e)].join(`
`),keep:tm,fewest:3})),f.get(n)};return{query(e,t,n,r=[],i=1/0,a){let o=h(t);return o===null?[]:v(e,n,r,i,a).filter(e=>p(e.text,o)&&b(e.text,t.meter)).map(({id:e,distance:t})=>({id:e,distance:t}))},layered(e,t,n,r,i=1/0,o=[],s){let c=h(t),l=a(n,r);return c===null||l===void 0?[]:v(e,r,[n,...o],i,s).filter(e=>e.distance<=i&&_(e.id,l,c)&&p(e.text,g(l,c))&&b(e.text,t.meter)).map(({id:e,distance:t})=>({id:e,distance:t}))},used:(e,t,n,i=[])=>Nb(kb(r,e,[...Pb(r,e,t).map(e=>({id:e,point:n,facet:`rhythm`})),...Pb(r,e,i).map(e=>({id:e}))])),file(e,{hits:t,bench:n,point:i,source:a,created:c,tags:l,varies:u,by:d}){let f=ix(t,F(n.meter)),p=Ab(r,e,{text:f,point:i,facet:`rhythm`,source:a,created:c,meta:{tags:[...l],...u===void 0?{}:{varies:u},...d===void 0?{}:{by:d}}}),{meterFragment:m}=n,g=m===void 0?p.layer:kb(r,p.layer,[{id:p.id},{id:m}]),_=`${f}\n${RS(n.meter)}`;p.file&&!s.has(_)&&s.set(_,{bars:1,hits:LS(t)});let v=h(n);return p.file&&v!==null&&o.set(`${v.length}:${v}${f}`,!0),{layer:Nb(g),id:p.id,held:p.file===null}},read(e,t,n){let r=a(e,n),i=r===void 0?null:y(r,t);return i&&IS(i)},vary(e,t,n,r){let i=a(e,r),o=h(t),s=i===void 0?null:y(i,t.meter);if(i===void 0||o===null||s===null)return null;let c=x(i,o);if(!c.length)return null;let l=c[vb(n,c.length)],u=l.line.slice(1),d=FS(l.apply(i),t.meter,s.bars,u);return d===null?null:{hits:IS({bars:s.bars,hits:LS([...s.hits.filter(e=>(e.line??e.role)!==u),...d.hits])}).hits,by:l.by}},*warm(t,n){let r=[...(n?.filed??[]).filter(zS).map(e=>e.fragment.text).reverse(),...e.map(e=>e.text)];for(let n of t){let t=c.has(m(n)),i=h(n);if(t||(yield),i!==null)for(let t of r){let r=`${i.length}:${i}${t}`;if(d.has(r))continue;if(d.add(r),!p(t,i)){yield;continue}let a=y(t,n.meter);yield,a!==null&&a.bars===1&&!_y(a)&&(x(t,i),yield);let o=g(t,i);yield;for(let r of e)_(r.id,t,i)&&(p(r.text,o),y(r.text,n.meter)),yield}}}}}[...[...CS.fragments.values()].map(e=>({meter:e.meter,meterFragment:e.id})),...Object.values(ge).map(e=>({meter:e}))],VS();let HS=[`&bassOut map=midi(2) [&bassline * &bassV]`],US=e=>[`&bar meter("${e}") step=120bpm`,`&key scale(ionian, C)`,`&harm over=&key step=1m [0,2,4]`].join(`
`),WS=e=>Math.abs(e-Math.round(e))<1e-6?Math.round(e):e,GS=(e,t)=>t===0?e:GS(t,e%t);function KS(e,t){let n=Kb(t);if(!n)return null;let r=rS(e,Gb([US(n),...HS].join(`
`)),{head:`&bassline`,main:`&harm`}),i=Gb(r.text),a=iS({...r,text:i});if(!a.ok)return null;let o=T_(hs(i,{resolve:r.resolve}).text,a).filter(e=>e.pitched);if(o.length!==1)return null;let[s]=o;if(s.pitched.table!==`harm`||s.stepWhole===null||!s.meter)return null;let c=dd(a,s.trigger,gi(a)),l=[];for(let e of s.notes){let t=c.find(t=>Math.abs(t.step-e.step)<1e-9);if(!t||t.table!==`harm`||t.via||t.tableShift<0||t.tableShift>1)return null;l.push({chord:t.tableShift,index:t.value+0,alter:t.alter+0,shift:(t.transpose??0)+0})}if(!l.length)return null;let u=s.meter.pulses/s.meter.unit,d=Math.ceil(u/s.stepWhole-1e-9),f=s.steps/GS(s.steps,d),p=F(t),m=iy(120,t),h=qx(i,void 0,{resolve:r.resolve}),g=tl(h.result,Xc(h.result)),_=[];for(let e of Kx(h,0,f*p*m).events)for(let t of el(g(e))){let n=nl(e,t);if(!n)continue;let r=WS(n.at/m);if(!Number.isInteger(r)||r>=f*p)return null;_.push(r)}return _.sort((e,t)=>e-t),{bars:f,notes:_.map((e,t)=>({step:e,...l[t%l.length]}))}}function qS(e){if(e.alter!==0)throw Error(`lineText: an accidental (${JSON.stringify(e)})`);if(e.chord===0&&e.shift===0)return String(e.index);let t=e.chord===1?`&bassNext`:`&bassRoot`,n=e.shift===0?t:`${t}^$${e.shift}`;return e.index===0?n:e.shift===0?`${t}^${e.index}`:`degree(${n}, ${e.index})`}function JS(e,t){let n=[...e].sort((e,t)=>e.step-t.step),r=Jb(n.map(e=>e.step),t),i=Array.from({length:t/r.length},(e,t)=>{let i=n.find(e=>e.step===t*r.length);return i?qS(i):`~`}),a=e=>n.some(t=>qS(t).includes(e));return[`&bassline from &harm`,`&bassline over=&harm step=${r.tap} ${i.join(` `)}`,...a(`&bassNext`)?[`&bassNext over=&harm[>>] 0`]:[],...a(`&bassRoot`)?[`&bassRoot over=&harm 0`]:[]].join(`
`)}function YS(e=M_,t=KS){return Yb({facet:Pm,fragments:e,read:t,text:JS,vary:e=>({workbench:US(e),operators:cb})})}YS();function XS(e){let{min:t,max:n}=Kp.bpm;return(Math.log(e)-Math.log(t))/(Math.log(n)-Math.log(t))}let ZS=Jp.map(e=>({name:e.name,at:{...e.style,bpm:XS(e.style.bpm)}}));Jp.map((e,t)=>({id:e.id,name:e.name,point:ZS[t].at,tempo:e.style.bpm}));let QS=[...rt.map(e=>({mode:e,steps:c(N(e))})),{mode:`aeolian`,steps:c({cycle:12,heights:[0,2,3,5,7,8,11]})}];function $S(e){let t=[`&bar meter("4/4") step=120bpm
&tonic C`,...Ub(e.text)].join(`
`),n=iS(rS(e.text,t,{head:`&key`,main:`&tonic`})),r=n.diagnostics.filter(e=>e.severity===`error`);if(r.length)return`it doesn't compile: ${r.map(e=>e.message).join(`; `)}`;let i=n.mainKey===void 0?void 0:n.cells.get(n.mainKey);if(!i?.scan)return`it has no key, a scale(…)`;if(!Af(e.text,yf).signature?.main)return"its tonic is fixed, which the key plan sets: a main parameter (`&key from &tonic`) leaves it to the host";let{lap:a,steps:o}=i.scan,s=QS.find(e=>a===12&&e.steps.join(` `)===o.join(` `))?.mode;return s?{id:e.id,mode:s}:`its scale, ${o.join(` `)}, is none of the composer's modes`}L_.map(e=>({id:e.id,read:$S(e)}));function eC(e=L_){let t=/* @__PURE__ */ new Map;for(let n of e){let e=$S(n);typeof e!=`string`&&t.set(n.id,e)}let n=fp(e.filter(e=>t.has(e.id)));return{fragments:t,query:e=>n.query(e,t.size,{},{facet:`mode`}).map(e=>({id:e.fragment.id,distance:e.distance}))}}eC();let tC=e=>[`&bar meter("${e}") step=120bpm`,`&key scale(ionian, C)`].join(`
`),nC=({degree:e,alter:t})=>`${e}${(t<0?`b`:`#`).repeat(Math.abs(t))}`,rC=({degree:e,stack:t})=>`[${(t??[0,2,4].map(t=>({degree:e+t,alter:0}))).map(nC).join(`,`)}]`,iC=[3,4];function aC(e){let t=Array.from({length:8},(t,n)=>{let r=e.filter(e=>Math.floor(e.step/16)===n),i=e=>r.find(t=>t.step%16===e),a=rC(i(0)),o=i(8);return o&&rC(o)!==a?`[${a} ${rC(o)}]`:a}),n=[];for(let e=0;e<t.length;){let r=1;for(;e+r<t.length&&t[e+r]===t[e];)r++;n.push(r>1?`${t[e]}!${r}`:t[e]),e+=r}return`&harm from &key\n&harm over=&key step=1m cycle=8 ${n.join(` `)}`}function oC(e,t){let n=Kb(t);if(!n)return null;let r=iS(rS(e,tC(n),{head:`&harm`,main:`&key`}));if(!r.ok)return null;let i=r.cells.get(`harm`);if(!i?.step)return null;let a=r.cells.get(i.step.driver)?.meter??null,o=C_(i.step.tap,a);if(o===null||!a)return null;let s=a.pulses/a.unit,c=i.steps*o/s;if(Math.abs(c-8)>1e-9)return null;let l=/* @__PURE__ */ new Map;for(let e of dd(r,`harm`,gi(r))){if(e.table!==`key`||e.via||e.tableShift!==0||(e.transpose??0)!==0||Math.abs(e.alter)>1)return null;let t=e.step*o/s,n=Math.round(t*16);if(Math.abs(t*16-n)>1e-6||n%8!=0||n<0||n>=128)return null;l.set(n,[...l.get(n)??[],{degree:e.value,alter:e.alter}])}let u=[];for(let[e,t]of[...l].sort(([e],[t])=>e-t)){let n=t.sort((e,t)=>e.degree-t.degree||e.alter-t.alter);if(n.some((e,t)=>t>0&&e.degree===n[t-1].degree))return null;let r=n[0].degree,i=(r%7+7)%7;if(n.map(nC).join(` `)===`${r} ${r+2} ${r+4}`)u.push({step:e,degree:i});else if(iC.includes(n.length))u.push({step:e,degree:i,stack:n});else return null}for(let e=0;e<8;e++)if(!u.some(t=>t.step===e*16))return null;return{bars:8,notes:u.filter(e=>e.step%16==0||rC(u.find(t=>t.step===e.step-8))!==rC(e))}}function sC(e=N_,t=oC){return Yb({facet:Bv,fragments:e,read:t,text:e=>aC(e),bars:8})}sC();let cC=[...Gp,`bpm`],lC=[`key`,`meter`];[...cC,...lC];let uC=e=>t=>t.association.some(t=>t.facet===e);Ub([`&kit ${[...new Set(Zb.values())].map(e=>`&${e}`).join(` `)}`,...wS.filter(uC(`rhythm`)).map(e=>e.text)].join(`
`)),Ub([...HS,...wS.filter(uC(`bass`)).map(e=>e.text)].join(`
`)),Bx.initial,mv.initial,Am(Em);let dC=[`kick`,`closedHat`,`openHat`,`pedalHat`,`ride`,`rim`],fC={kick:`bd`,closedHat:`hh`,openHat:`oh`,pedalHat:`ph`,ride:`rd`,rim:`rim`},pC=ge[`4/4`];ye(pC).cycle;let mC=e=>s(N(e.mode),e.tonic);function hC(e,t){let{root:n,quality:r}=We(mC(e),t),a=e.tonic+i(n-e.tonic,12);return C(S[r].stack.map(e=>a+e))}let gC=[`bar`,`style`,`harm`],_C=dC.map(e=>fC[e]),vC=[`frame`,`bass`,`pad`,`stab`,`next`];[...gC,...vC,..._C];let yC=e=>s(N(e.mode),e.tonic);function bC(e){let t=de(yC(e));return t.letter+(t.alteration<0?`b`:`#`).repeat(Math.abs(t.alteration))}let xC=e=>`scale(${e.mode}, ${bC(e)})`,SC=(e,t)=>`${e}${(t<0?`b`:`#`).repeat(Math.abs(t))}`,CC={major:[0,2,4],minor:[0,2,4],diminished:[0,2,4],augmented:[0,2,4],sus2:[0,1,4],sus4:[0,3,4],5:[0,4],6:[0,2,4,5],m6:[0,2,4,5],7:[0,2,4,6],maj7:[0,2,4,6],m7:[0,2,4,6],mMaj7:[0,2,4,6],m7b5:[0,2,4,6],dim7:[0,2,4,6],9:[0,2,4,6,8],maj9:[0,2,4,6,8],m9:[0,2,4,6,8],add9:[0,2,4,8]};function wC(t,n){let r=N(t.mode),i=w(n).map(e=>e-t.tonic),a=k(i.map(e=>e-i[0])),o=a&&CC[a],s=Ke(r,i[0]);if(!o||!s)throw Error(`chordTones: no degrees for ${i.join(` `)}`);return i.map((t,n)=>{let i=s.degree+o[n];return{degree:i,accidental:t-e(r,i)}})}let TC=e=>`[${e.map(e=>SC(e.degree,e.accidental)).join(`,`)}]`,EC={16:`1m`,12:`2n.`,8:`2n`,6:`4n.`,4:`4n`,3:`8n.`,2:`8n`,1:`16n`},DC=(e,t)=>t===0?e:DC(t,e%t);function OC(e,t,n=jp,r=n){let i=e.map(e=>e.step),a=[...i[0]>0?[{text:`~`,length:i[0]}]:[],...i.map((e,r)=>({text:t(r),length:(i[r+1]??n)-e}))],o=a.reduce((e,t)=>DC(e,t.length),n),s=o===r?`1m`:EC[o],c=s?o:1,l=a.map(({text:e,length:t})=>t===c?e:`${e}@${t/c}`);return`step=${s??`16n`} ${l.join(` `)}`}let kC={comp:48,bass:24,lead:60};function AC(e,t,n){let r=t-kC[n]-e.tonic,i=Ke(N(e.mode),r);return{degree:i.degree,accidental:i.accidental}}let jC=(t,n,r)=>kC[r]+t.tonic+e(N(t.mode),n.degree)+n.accidental;function MC(e,t){let n=t.map(e=>e-60),r=C(n),a=k(n.map(e=>e-n[0]));if(r&&a)return qe(yC(e),{root:i(n[0],12),quality:a})}function NC(e){return Object.keys(ge).find(t=>Pp(ge[t],e.meter))}function PC(e){return e.chords.map(t=>({step:Ct(e.meter,t.slot.step),numeral:ze(Re(Dt(t,e.plan.key)))}))}function FC(e){let t=String(e).replace(/^0/,``);for(let n=2;n<=100;n++){let r=Math.round(e*n);if(r/n===e)return`${r}/${n}`.length<t.length?`${r}/${n}`:t}return t}let IC=e=>e.heights.map((t,n)=>(e.heights[n+1]??e.cycle)-t),LC=(e,t)=>t!==`8n`||IC(e).includes(2);function RC(e,t){return t.share===Em.share||!LC(e,t.level)?``:` swing=${t.level}:${FC(t.share)}`}function zC(e,t,n){let r=Math.floor(n.n/t.length),i=t[n.n-r*t.length],a=N(e.mode).heights.length;return{degree:i.degree+r*a+n.alter,accidental:i.accidental}}let BC=[0,1,-1,2,-2],VC=Array.from({length:41},(e,t)=>t%2?(t+1)/2:t&&-t/2);function HC(e,t,n,r){for(let i of BC)for(let a of VC)if(jC(e,zC(e,t,{n:a,alter:i}),r)===n)return{n:a,alter:i};return null}let UC=e=>`${e}_performer`,WC=e=>String(Math.round(e*1e3)/1e3).replace(/^0\./,`.`),GC=e=>{let t=Jp.find(t=>Gp.every(n=>Math.abs(t.style[n]-e[n])<1e-9));return t?[`&${t.id} from styles`,`&style style=&${t.id}`]:[`&style style=&(map=style ${Gp.map(t=>`${t}=${WC(e[t])}`).join(` `)})`]},KC=e=>e===`drums`?`&drums, &drumsOut from ${UC(`drums`)} &drumlines`:`&${e}, &${e}Out from ${UC(e)}(${e}Level=&${e}Level) &${e}line`,qC=(e,t)=>e.part.localeCompare(t.part)||(Math.abs(e.step-t.step)<1e-6?0:e.step-t.step)||e.note-t.note,JC=e=>[...e].sort(qC);function YC(e){return JC(e.written.map(t=>({part:t.part===`pad`||t.part===`stab`?`comp`:t.part,line:t.part,...t.role?{role:t.role}:{},step:t.step,note:t.note,velocity:Math.round(Wy(e,t)),written:t.length,length:hy(e,t)})))}let XC=e=>e.lines.map(e=>e.text).join(`
`),ZC=(e,t)=>t===1?e:`${e}@${t}`,QC=(e,t)=>{let n=``;for(let e=t+1;e>0;e=Math.floor((e-1)/26))n=String.fromCharCode(65+(e-1)%26)+n;return`${e}${n}`};function $C(e,t,n){let r=[];for(let e of t){let t=r.at(-1);t&&t.text===`~`&&e.text===`~`?r[r.length-1]={...t,length:t.length+e.length}:r.push(e)}let i={words:r.map(e=>ZC(e.text,e.length)).join(` `),cells:[]},a=[];for(let e of r){let t=(Math.floor(e.at/n)+1)*n-e.at;if(e.length>t&&e.text!==`~`)return i;for(let t=e.at,r=e.length;r>0;){let i=Math.floor(t/n),o=Math.min(r,(i+1)*n-t);(a[i]??=[]).push(ZC(e.text,o)),t+=o,r-=o}}let o=a.map(e=>e.join(` `)),s=/* @__PURE__ */ new Map;for(let e of o)s.set(e,(s.get(e)??0)+1);let c=/* @__PURE__ */ new Map;for(let[t,n]of o.entries())s.get(n)>1&&!c.has(n)&&a[t].some(e=>!e.startsWith(`~`))&&n.length>e.length+2&&c.set(n,QC(e,c.size));if(c.size===0)return i;let l=[];for(let e=0;e<o.length;){let t=c.get(o[e]);if(!t){l.push(o[e++]);continue}let n=1;for(;o[e+n]===o[e];)n++;l.push(n===1?`&${t}`:`&${t}!${n}`),e+=n}return{words:l.join(` `),cells:[...c].map(([e,t])=>`&${t} ${e}`)}}let ew=e=>String(Number(e.toPrecision(12))).replace(/^0\./,`.`);function tw(e,{tempo:t=`held`}={}){let n=e.map(e=>({meter:NC(e),bpm:e.style.bpm,swing:RC(e.meter,e.swing),key:xC(e.plan.key),melodic:e.plan.melodic})),r=t===`held`?[`meter`,`bpm`,`swing`,`key`,`melodic`]:[`meter`,`swing`,`key`,`melodic`];for(let[e,t]of n.entries())for(let i of r)if(t[i]!==n[0][i])throw Error(`a section's ${i} changes at its bar ${e} (${n[0][i]} to ${t[i]}): one text holds one`);return n[0]}function nw(e,t){let n=ot(e).heights[0];return ct(e,t).heights.map(t=>{let r=Ke(N(e.mode),t-n);return{degree:r.degree,accidental:r.accidental}})}function rw(e,t){return e.flatMap((e,n)=>PC(e).map(e=>({step:n*t+e.step,numeral:e.numeral})))}let iw=(e,t)=>Array.from({length:e},(e,n)=>({at:n,length:1,text:t(n)})),aw=e=>e>=127?``:`:0:${Qb(e)}`;function ow(e,t,n,r){let i=[],a=[];for(let o of kp){let s=e.filter(e=>e.role===o);if(s.length===0)continue;let c=e=>s.filter(t=>Math.floor(t.at/n)===e),l=r&&o===`euclid`?Array.from({length:t},(e,t)=>{let r=c(t);if(r.length===0)return`~`;if(new Set(r.map(e=>e.note)).size!==1)return null;let i=$b(r.map(e=>e.step),n);return i&&`&${Zb.get(r[0].note)}(${i.k},${n},${i.r})`}):null;if(l&&l.every(e=>e!==null)){i.push(`&${o} step=1m ${l.join(` `)}`);let e=new Set(s.map(e=>e.velocity)),r=Array.from({length:t},(e,t)=>[...new Set(c(t).map(e=>e.velocity))]);if(e.size===1){let e=s[0].velocity;a.push(e>=127?`&${o}`:`&${o} * ${Qb(e)}`)}else if(r.every(e=>e.length<=1))i.push(`&${o}Level map=amp step=1m ${r.map(e=>e.length?Qb(e[0]):`0`).join(` `)}`),a.push(`&${o} * &${o}Level`);else{let e=e=>s.find(t=>t.at===e)?.velocity,r=$C(`${o}Level`,iw(t*n,t=>e(t)?Qb(e(t)):`0`),n);i.push(...r.cells,`&${o}Level map=amp step=16n ${r.words}`),a.push(`&${o} * &${o}Level`)}continue}let u=e=>$C(o,iw(t*n,t=>{let n=s.filter(e=>e.at===t).map(t=>`&${Zb.get(t.note)}${e(t.velocity)}`);return n.length===0?`~`:n.length===1?n[0]:`[${n.join(`,`)}]`}),n),d=u(aw),f=[...d.cells,`&${o} step=16n ${d.words}`],p=/* @__PURE__ */ new Map;if(s.every(e=>{let t=e.at%n;return(p.get(t)??e.velocity)===e.velocity&&(p.set(t,e.velocity),!0)})){let e=u(()=>``),t=[...e.cells,`&${o} step=16n ${e.words}`,`&${o}LevelA ${$C(`${o}Level`,iw(n,e=>p.has(e)?Qb(p.get(e)):`~`),n).words.replace(/~/g,`0`)}`,`&${o}Level map=amp step=16n &${o}LevelA`],r=`&${o} * &${o}Level`;if(t.join(`
`).length+r.length<f.join(`
`).length+o.length+1){i.push(...t),a.push(r);continue}}i.push(...f),a.push(`&${o}`)}return{lines:i,terms:a,voices:[...new Set(e.map(e=>Zb.get(e.note)))]}}function sw(e,t,n,r,i,a,o,s,c){let l=[...new Set(t.map(e=>e.at))].sort((e,t)=>e-t),u=[],d=[],f=[],p=[],m=[],h=0,g=0,_=e=>{for(let t of[u,d,f,p])t.push({at:g,length:e,text:`~`})};for(let[i,v]of l.entries()){v>g&&_(v-g),g=v;let y=t.filter(e=>e.at===v),b=Math.max(...y.map(e=>e.written)),x=Math.min(b,(l[i+1]??r)-v);x<b&&c.push({line:e,step:v,written:b,stated:x});let S=e=>({at:v,length:x,text:e.length===1?e[0]:`[${e.join(`,`)}]`});u.push(S(y.map(e=>{let t=AC(n,e.note,a);return SC(t.degree,t.accidental)})));let C=s===`key`?null:o(v);d.push(S(y.map(e=>{let t=C&&HC(n,C,e.note,a);return t?(t.alter!==0&&h++,SC(t.n,t.alter)):(s!==`key`&&m.push({step:v,note:e.note}),`?`)}))),f.push({at:v,length:x,text:Qb(y[0].velocity)}),p.push({at:v,length:x,text:ew(y[0].length/y[0].written)}),g=v+x}g<r&&_(r-g);let v=s!==`key`&&m.length===0?s:`key`,y=new Set(t.map(e=>e.velocity)).size===1,b=[...new Set(t.map(e=>ew(e.length/e.written)))],x=b.length>1?` legato=&${e}Share`:b[0]===`1`?``:` legato=${b[0]}`,S=$C(`${e}line`,v===`key`?u:d,i),C=$C(`${e}Share`,p,i),w=$C(`${e}Level`,f,i);return{lines:[...S.cells,`&${e}line over=&${v} step=16n${x} ${S.words}`,...b.length>1?[...C.cells,`&${e}Share step=16n ${C.words}`]:[],...y?[]:w.cells,`&${e}Level map=amp ${y?Qb(t[0].velocity):`step=16n ${w.words}`}`],pitched:{part:e,table:v,accidentals:v===`key`?0:h,unreached:m,shares:b.length}}}function cw(e,{euclid:t=e[0].swing.share===Em.share,table:n=`harm`,lead:r=`melo`,tempo:i=`held`}={}){let a=tw(e,{tempo:i}),o=e[0].plan.key,s=F(e[0].meter),c=e.length*s,l=e.flatMap((e,t)=>YC(e).map(e=>({...e,at:t*s+e.step}))),u=[],d=[],f=rw(e,s),p=e=>wC(o,hC(o,Re(e))),m=[{part:`harmony`,text:`&harm, &key from`},{part:`meter`,text:`&bar meter("${a.meter}") step=${a.bpm}bpm${a.swing}`},{part:`key`,text:`&key ${a.key}`},...GC(e[0].style).map(e=>({part:`meter`,text:e})),{part:`harmony`,text:`&harm over=&key ${OC(f,e=>TC(p(f[e].numeral)),c,s)}`}],h=e=>{let t=f.findLast(t=>t.step<=e);return t?p(t.numeral):null},g=ow(l.filter(e=>e.part===`drums`),e.length,s,t);m.push(...g.lines.map(e=>({part:`drums`,text:e})),...g.terms.length?[{part:`drums`,text:`&drumlines [${g.terms.join(`, `)}]`},{part:`drums`,text:KC(`drums`)}]:[]);let _={},v=Rb(e[0].style),y=[],b=(e,t,n,r,i)=>{let a=l.filter(t=>t.line===e);if(a.length===0)return;let f=sw(e,a,o,c,s,n,r,i,u);d.push(f.pitched),_[e]=!0,m.push(...f.lines.map(e=>({part:t,text:e})),{part:t,text:KC(e)});let p=v[e];p&&m.push({part:t,text:p.line}),y.push(e)};b(`bass`,`bass`,`bass`,h,n),b(`pad`,`comp`,`comp`,h,n),b(`stab`,`comp`,`comp`,h,n);let x=a.melodic,S=x===`plain`||r===`key`,C=nw(o,x);if(!S&&l.some(e=>e.line===`lead`)&&m.push({part:`lead`,text:`&melo over=&key step=1m ${TC(C)}`}),b(`lead`,`lead`,`lead`,()=>C,S?`key`:`melo`),_.lead){let e=m.findIndex(e=>e.text.startsWith(`&melo `));e>=0&&d.find(e=>e.part===`lead`).table===`key`&&m.splice(e,1)}let w=[`pad`,`stab`].filter(e=>_[e]),T=w.length===0?`~`:w.length===1?`&${w[0]}Out`:`[${w.map(e=>`&${e}Out`).join(`, `)}]`;return m.push({part:`card`,text:`&out map=midi ${_.lead?`&leadOut`:`~`} ${_.bass?`&bassOut`:`~`} ${T} ~!6 ${g.terms.length?`&drumsOut`:`~`}`}),y.length&&m.push({part:`card`,text:`&heard map=sample [${y.map(e=>`&${e}Out`).join(`, `)}]`}),{lines:m,pitched:d,cuts:u}}let lw={lead:1,bass:2,comp:3,drums:10},uw=e=>[...new Set(e.map(e=>(e%12+12)%12))].sort((e,t)=>e-t),dw=[`&lap step=1m 0`,`&readV loop=C4`,`&read map=midi ~!14 [&lap * &readV] [&harm * &readV]`].join(`
`);function fw(e,t,n){let r=e.tracks.find(e=>e.output.id===t);if(!r)return 1;let i=r.share;if(typeof i==`number`)return i;let a=i.series.reduce((t,r)=>{let i=wd(e,r,n);return t*(i?i.value+i.alter:1)},1);return i.range?i.range[0]+(i.range[1]-i.range[0])*a:a}function pw(e,t){let[n,r,i]=(e??``).split(`:`),a=t?.outputs.find(t=>t.id===e),o=a?[...a.via,...a.through]:[],s=t?.performers.find(e=>e.role!==void 0&&o.includes(e.name))?.role,c=n===`kit`?{role:i}:{};return s?{line:s,...s===`drums`?c:{}}:n===`kit`?{line:`drums`,...c}:{line:r}}let mw=[`lpf`,`lpq`,`hpf`,`hpq`];function hw(e,t,n){if(n&&!n.has(e.voice))return;let r=t.cells.get(e.voice),i=r?.params.s===void 0?void 0:ii[String(r.params.s)];if(!r||i!==`sine`&&i!==`triangle`&&i!==`sawtooth`&&i!==`square`)return;let a={};for(let e of mw){let t=r.params[e],n=typeof t==`number`?t:r.paramCells[e]?.range?.[0];n!==void 0&&(a[e]=n)}let o=e.bends.map(t=>({at:t.at-e.at,cents:t.cents}));return{wave:i,...a,...e.env&&{env:e.env},...o.length>0&&{bends:o}}}let gw=e=>qx(`${e}\n${dw}`,void 0,{resolve:Y_});function _w(e,t,n=gw(e)){let r=F(t[0].meter),i=t.length*r*iy(t[0].style.bpm,t[0].meter),a=tl(n.result,Xc(n.result)),o=new Set(e.split(`
`).flatMap(e=>/^&(\w+)\s/.exec(e)?.[1]??[])),s=Kx(n,0,i*1.25).events.flatMap(e=>el(a(e)).flatMap(t=>{let r=nl(e,t);return r?[{...r,share:fw(n,e.output,e.at),...pw(e.output,n.result),sound:pw(e.output,n.result).line===`drums`?void 0:hw(e,n.result,o)}]:[]})),c=[...new Set(s.filter(e=>e.channel===15).map(e=>e.at))].sort((e,t)=>e-t).slice(0,t.length+1),l=c[t.length],u=e=>c.findLastIndex(t=>t<=e+1e-9),d=t.map(()=>({timed:[]})),f=t.map(()=>/* @__PURE__ */ new Map);for(let e of s){if(e.at>=l-1e-9)continue;let n=u(e.at),i=t[n],a=c[n],o=(c[n+1]-a)/r,s=wm(Dm(i.swing),i.meter),p=e=>s.written((e-a)/o);if(e.channel===16){let t=Math.round(p(e.at));f[n].set(t,[...f[n].get(t)??[],e.note]);continue}let m=Object.keys(lw).find(t=>lw[t]===e.channel);if(!m)continue;let h=p(e.at);d[n].timed.push({at:e.at,share:e.share,onset:(e.at-a)/o,end:(e.end-a)/o,line:e.line,role:e.role,sound:e.sound,note:{part:m,step:h,note:e.note,velocity:e.velocity,written:(p(e.end)-h)/e.share,length:p(e.end)-h}})}return{bars:d.map(({timed:e})=>(e.sort((e,t)=>qC(e.note,t.note)),{notes:e.map(e=>e.note),at:e.map(e=>e.at),shares:e.map(e=>e.share),onsets:e.map(e=>e.onset),ends:e.map(e=>e.end),lines:e.map(e=>e.line),roles:e.map(e=>e.role),sounds:e.map(e=>e.sound)})),chords:f.map((e,n)=>[...e].sort(([e],[t])=>e-t).map(([e,r])=>{let i=MC(t[n].plan.key,r.sort((e,t)=>e-t));return{step:e,numeral:i?ze(i):`?`,pitchClasses:uw(r)}})),laps:c,diagnostics:n.result.diagnostics.map(e=>e.message)}}function vw(e){let t=3735928559,n=1103547991;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,2654435761),n=Math.imul(n^i,1597334677)}return t=Math.imul(t^t>>>16,2246822507),t^=Math.imul(n^n>>>13,3266489909),n=Math.imul(n^n>>>16,2246822507),n^=Math.imul(t^t>>>13,3266489909),(4294967296*(2097151&n)+(t>>>0)).toString(16)}let yw=e=>vw(JSON.stringify([YC(e),PC(e),xC(e.plan.key),e.plan.melodic,NC(e),RC(e.meter,e.swing)])),bw=e=>({meter:e.meter,swing:e.swing,bpm:e.style.bpm,key:e.plan.key}),xw=({meter:e,swing:t,bpm:n,key:r},i)=>Array.from({length:i},()=>({meter:e,swing:t,style:{bpm:n},plan:{key:r}}));function Sw(e,t=e=>e,n=()=>performance.now()){let r=n(),i=e.map(yw),a=bw(e[0]),o,s;try{let n=cw(e,{tempo:`first`});o=t(XC(n));let r=F(e[0].meter);s=[...new Set(n.cuts.map(e=>Math.floor(e.step/r)))]}catch(e){return{source:``,frame:a,foreseen:i,played:null,cut:[],error:null,unstated:String(e instanceof Error?e.message:e).replace(/^a section's (\w+) changes at its bar.*$/,`the section's $1 moves between its bars: one text states one`),cost:{build:n()-r,compile:0,play:0}}}let c=n()-r,l=Cw({bar:e[0].bar,step:0,text:o,unstated:null,frame:a,foreseen:i,cut:s},n);return{...l,cost:{...l.cost,build:c}}}function Cw(e,t=()=>performance.now()){let{text:n,frame:r,foreseen:i,cut:a,unstated:o}=e,s={source:n,frame:r,foreseen:i,unstated:o,played:null,cut:a,error:null};if(o!==null)return{...s,cost:{build:0,compile:0,play:0}};let c=t();try{let e=gw(n),a=t(),o=_w(n,xw(r,i.length),e),l=t();return{...s,played:o,cost:{build:0,compile:a-c,play:l-a}}}catch(e){return{...s,error:String(e),cost:{build:0,compile:t()-c,play:0}}}}let ww=[`&harm, &key from`,`&bar meter("4/4") step=120bpm`,`&key scale(aeolian, A)`,`&style style=&(map=style .5 .5 .5 .5)`,`&harm over=&key step=1m [0,2,4] [5,7,9]`,`&kick step=16n &bd:0:.4 ~ ~ ~`,`&drumlines [&kick]`,`&drums, &drumsOut from drums_performer &drumlines`,`&bassline over=&harm step=16n legato=.6 0@4 3@4`,`&bassLevel map=amp step=16n .4@8`,`&bass, &bassOut from bass_performer(bassLevel=&bassLevel) &bassline`,`&out map=midi ~ &bassOut ~!7 &drumsOut`,`&heard map=sample [&bassOut]`].join(`
`);function Tw(){return gw(ww).result.diagnostics}function Ew(e){return`warm`in e?(Tw(),{id:e.id,stated:null}):{id:e.id,stated:`given`in e?Cw(e.given):Sw(e.bars)}}let Dw=self;Dw.onmessage=({data:e})=>Dw.postMessage(Ew(e))})();