(function(){function e(e,t){let n=e.heights.length;return e.cycle*Math.floor(t/n)+e.heights[u(t,n)]}function t(e,t){let{cycle:n,heights:r}=e,i=Math.floor((t-r[0])/n),a=t-i*n;return r.length*i+r.filter(e=>e<=a).length-1}function n(e,n){return t(e,n-1)+1}function r(r,i){let a=t(r,i),o=n(r,i);return i-e(r,a)<=e(r,o)-i?a:o}function i(e,t){return u(e,t)}function a(e,t,n){let r=n-u(n-e,t);return n-r<=r+t-n?r:r+t}function o(e){return e.heights.map(t=>i(t,e.cycle)).sort((e,t)=>e-t)}function s(e,t){return{cycle:e.cycle,heights:e.heights.map(e=>e+t)}}function c(t){return t.heights.map((n,r)=>e(t,r+1)-e(t,r))}function l(t,n){if(t.cycle!==n.heights.length)throw Error(`compose: the inner helix has cycle ${t.cycle}, but the outer has ${n.heights.length} degrees`);return{cycle:n.cycle,heights:t.heights.map(t=>e(n,t))}}function u(e,t){return(e%t+t)%t}function d(e,t,n=0){let r=[];for(let n=0;n<t;n++)n*e%t<e&&r.push(n);return s({cycle:t,heights:r},n)}function f(e,t){for(let n=0;n<t;n++)if(u(n*e,t)===u(1,t))return n;throw Error(`generator: ${e} and ${t} are not coprime, so ${e} of ${t} has no generator`)}let p={"2nd":`second`,"3rd":`third`,"4th":`fourth`,"5th":`fifth`,"6th":`sixth`,"7th":`seventh`,"9th":`ninth`,"11th":`eleventh`,"13th":`thirteenth`},m={maj:`major`,min:`minor`,dim:`diminished`,aug:`augmented`,dom:`dominant`,sus:`suspended`,alt:`altered`,pent:`pentatonic`,harm:`harmonic`,mel:`melodic`,phryg:`phrygian`,mixolyd:`mixolydian`},h=/(?:^| )(♭|flat|♯|sharp|♮|natural) ?(?=\d)/g,g={"♭":`b`,flat:`b`,"♯":`#`,sharp:`#`,"♮":`n`,natural:`n`};function _(e){return e.toLowerCase().replace(/\./g,` `).replace(/[\s_-]+/g,` `).trim().replace(h,(e,t)=>e.startsWith(` `)?` ${g[t]}`:g[t]).split(` `).map(e=>p[e]??m[e]??e).join(` `)}function v(t,n){return[...new Set(t.heights.map((r,i)=>e(t,i+n)-e(t,i)))].sort((e,t)=>e-t)}let y=d(7,12);v(y,0),v(y,1),v(y,2),v(y,3),v(y,4),v(y,5);function b(e){return Math.round(12*Math.log2(e))}let x=(e,t,n)=>({stack:e,symbols:t,words:n}),S={major:x([0,4,7],[``,`maj`,`M`],[`major`,`major triad`]),minor:x([0,3,7],[`m`,`min`,`-`],[`minor`,`minor triad`]),diminished:x([0,3,6],[`dim`,`°`,`o`],[`diminished`,`diminished triad`]),augmented:x([0,4,8],[`aug`,`+`],[`augmented`,`augmented triad`]),sus2:x([0,2,7],[`sus2`],[`suspended second`]),sus4:x([0,5,7],[`sus4`,`sus`],[`suspended fourth`,`suspended`]),5:x([0,7],[`5`],[`power chord`,`power`]),6:x([0,4,7,9],[`6`,`maj6`],[`sixth`,`major sixth`]),m6:x([0,3,7,9],[`m6`,`min6`,`-6`],[`minor sixth`]),7:x([0,4,7,10],[`7`,`dom7`,`Mm7`],[`seventh`,`dominant seventh`,`dominant`]),maj7:x([0,4,7,11],[`maj7`,`M7`,`Δ`,`Δ7`,`ma7`,`MM7`],[`major seventh`]),m7:x([0,3,7,10],[`m7`,`min7`,`-7`,`mm7`],[`minor seventh`]),mMaj7:x([0,3,7,11],[`mMaj7`,`m(maj7)`,`mM7`,`minMaj7`],[`minor major seventh`]),m7b5:x([0,3,6,10],[`m7b5`,`m7♭5`,`ø`,`ø7`,`min7b5`,`-7b5`],[`half diminished`,`half diminished seventh`]),dim7:x([0,3,6,9],[`dim7`,`°7`,`o7`],[`diminished seventh`]),9:x([0,4,7,10,14],[`9`,`dom9`],[`ninth`,`dominant ninth`]),maj9:x([0,4,7,11,14],[`maj9`,`M9`,`Δ9`],[`major ninth`]),m9:x([0,3,7,10,14],[`m9`,`min9`,`-9`],[`minor ninth`]),add9:x([0,4,7,14],[`add9`],[`add nine`,`added ninth`]),harmonics:x([1,2,3,4,5].map(b),[],[`harmonics`,`harmonic series`])};function C(e,t=12){if(e.length===0||e.some((t,n)=>n>0&&t<=e[n-1]))return;let n=e[0]+t;return{helix:{cycle:t,heights:e.filter(e=>e<n)},tensions:e.filter(e=>e>=n)}}function w(e){return[...e.helix.heights,...e.tensions]}let T=/* @__PURE__ */ new Map,E=/* @__PURE__ */ new Map,D=/* @__PURE__ */ new Map,O=(e,t,n)=>{e.has(t)||e.set(t,n)};for(let[e,t]of Object.entries(S)){for(let n of t.symbols)O(T,n,e),O(D,n.toLowerCase(),e);for(let n of t.words)O(E,_(n),e)}function k(e){let t=e.join();return Object.entries(S).find(([,e])=>e.stack.join()===t)?.[0]}function ee(e){return u(e*f(7,12),12)}function A(t,n){return{cycle:t.cycle,heights:t.heights.map((r,i)=>e(t,i+n))}}function j(e){return e.heights.map((t,n)=>A(e,n))}function te(e){let t=e.heights[0];return e.heights.reduce((e,n)=>e+n-t,0)}let M=[`lydian`,`ionian`,`mixolydian`,`dorian`,`aeolian`,`phrygian`,`locrian`],ne=j(d(7,12)).map(t=>s(t,-e(t,0))).sort((e,t)=>te(t)-te(e));function N(e){return ne[M.indexOf(e)]}let re=[`C`,`D`,`E`,`F`,`G`,`A`,`B`],P=[0,1,1,2,2,3,4,4,5,5,6,6],ie=[0,1,1,1,3,3,3,4,5,5,6,6],F=N(`ionian`).heights;function ae(e){let t=e.map(t=>t-e[0]),n=t.slice(1).map((e,n)=>e-t[n]);if(n.length>0&&n.every(e=>e===3||e===4))return t.map((e,t)=>2*t);if(t.length===7&&t.every((e,t)=>Math.abs(e-F[t])<=2))return t.map((e,t)=>t);let r=oe(new Set(t.map(e=>u(e,12))));return t.map(e=>r.get(u(e,12))+7*Math.floor(e/12))}function oe(e){let t=e.has(4)?4:e.has(3)?3:void 0,n=e.has(7)?7:t===4&&e.has(8)?8:e.has(6)?6:void 0,r=/* @__PURE__ */ new Map([[0,0]]);t!==void 0&&r.set(t,2),n!==void 0&&r.set(n,4);let i=/* @__PURE__ */ new Set;for(let t of[...e].sort((e,t)=>e-t)){if(r.has(t))continue;let e=ie[t];i.has(e)&&(e=P[t]),r.set(t,e),i.add(e)}return r}function se(e,t,n=ae(t)){let r=re.indexOf(e.letter);return t.map((i,a)=>{let o=r+n[a],s=u(e.pitchClass+i-t[0],12),c=F[u(o,7)],l=u(s-c,12);return l>6&&(l-=12),{letter:re[u(o,7)],alteration:l,pitchClass:s}})}function ce(e,t){return s(t,e.heights[0]-t.heights[0])}function I(e,t){let{cycle:n}=e,r=e.heights[0],s=new Set(o(e)),c=e.heights.length,l=fe(c,n)?f(c,n):1,u=i(r,n),d=-1/0;for(let e=0;e<n;e++){let a=o(ce({cycle:n,heights:[e]},t)).filter(e=>s.has(e)).length,c=pe(e-r,l,n),f=a*4*n*n-c*2-(e===i(r,n)?0:1);f>d&&(d=f,u=e)}return ce({cycle:n,heights:[a(u,n,r)]},t)}function le(e){let t=i(e.heights[0],12),n=re.flatMap((e,n)=>[0,-1,1].filter(e=>i(ue[n]+e,12)===t).map(n=>({letter:e,alteration:n,pitchClass:t}))),r=(e,t)=>se(e,t).reduce((e,t)=>e+Math.abs(t.alteration),0),a=[...M.map(N),de.harmonic,de.melodic],o=n.map(t=>({tonic:t,inKey:r(t,e.heights),around:a.reduce((e,n)=>e+r(t,n.heights),0)}));return o.sort((e,t)=>e.inKey-t.inKey||e.around-t.around),o[0].tonic}let ue=N(`ionian`).heights,de={harmonic:{cycle:12,heights:[0,2,3,5,7,8,11]},melodic:{cycle:12,heights:[0,2,3,5,7,9,11]}};function fe(e,t){return t===0?e===1:fe(t,e%t)}function pe(e,t,n){for(let r=0;r<=n;r++)if(i(r*t-e,n)===0||i(-r*t-e,n)===0)return r;return n}let L={"3/4":d(3,6),"4/4":d(4,8),"5/4":d(5,10),"5/8":d(2,5),"6/8":d(2,6),"7/8":d(3,7),"9/8":d(3,9),"10/8":d(4,10),"12/8":d(4,12)};function me(e){return e.heights.length}function he(e){let t=new Set(e.heights);return Array.from({length:e.cycle},(e,n)=>n===0?`downbeat`:t.has(n)?`pulse`:`subdivision`)}function R(e,t=2){return e.cycle*t}function z(e,t=2){return l(e,d(e.cycle,t*e.cycle))}let ge=[`downbeat`,`half`,`pulse`,`between`];function _e(e,t){let n=Array(e).fill(1/0),r=(e,i,a)=>{n[e]=Math.min(n[e],a);let o=i-e;if(o<=3){for(let t=e;t<i;t++)n[t]=Math.min(n[t],a+1);return}let s=d(2,o).heights[1],c=e+(t?o-s:s);r(e,c,a+1),r(c,i,a+1)};return r(0,e,1),n}function ve(e,t=!1){let n=_e(e.heights.length,t),r=he(e).map(()=>`between`);return e.heights.forEach((e,t)=>{r[e]=ge[Math.min(n[t],ge.length)-1]}),r}function ye(e){return{cycle:e.cycle,heights:e.onsets}}function be(e,t){let{cycle:n,onsets:r,degrees:i,accidentals:a,accents:o}=t,s=r.map((t,s)=>{let c=r[s+1]??r[0]+n,l=i[s];return{onset:u(e.rev?e.late-c:e.late+t,n),degree:l===null?null:e.strans+(e.mirror?-l:l),accidental:e.mirror?0-a[s]:a[s],accent:o?.[s]??0}});return s.sort((e,t)=>e.onset-t.onset),xe({cycle:n,onsets:s.map(e=>e.onset),degrees:s.map(e=>e.degree),accidentals:s.map(e=>e.accidental)},o&&s.map(e=>e.accent))}function xe(e,t){return t?.some(e=>e!==0)?{...e,accents:t}:e}function Se(e,t){let n=t.mirror?-1:1,r=t.rev?-1:1;return{strans:t.strans+n*e.strans,mirror:e.mirror!==t.mirror,late:t.late+r*e.late,rev:e.rev!==t.rev}}function Ce(e,t){let n=[],r=e=>`${e.degrees.filter(e=>e===null).length}|${[...c(ye(e))].sort((e,t)=>e-t)}`;if(e.cycle!==t.cycle||e.onsets.length!==t.onsets.length||r(e)!==r(t))return n;let i=e=>`${e.onsets}|${e.degrees.map(e=>e!==null)}|${e.accidentals}|${e.accents??``}`,a=i(t),o=t.degrees.findIndex(e=>e!==null);for(let r of[!1,!0])for(let s of[!1,!0]){let c=be({strans:0,mirror:s,late:0,rev:r},e).onsets,l=[...new Set(c.map(n=>u(t.onsets[0]-n,e.cycle)))];for(let c of l.sort((e,t)=>e-t)){let l=be({strans:0,mirror:s,late:c,rev:r},e);if(i(l)!==a)continue;let u=t.degrees[o]-l.degrees[o];l.degrees.every((e,n)=>e===null||e+u===t.degrees[n])&&n.push({strans:u,mirror:s,late:c,rev:r})}}return n}function we(e){return Ce(e,e)}function Te(e,t,n=we(t)){let r=e=>(Number(e.rev)*2+Number(e.mirror))*t.cycle+e.late,i;for(let a of n){let n=Se(a,e),o={...n,late:u(n.late,t.cycle)};(!i||r(o)<r(i))&&(i=o)}return i}function Ee(e){let{cycle:t,onsets:n,degrees:r,accidentals:i}=e;return{cycle:t,onsets:n,degrees:r,accidentals:i}}function De(e,t){let n=Ee(t),[r]=Ce(n,Ee(e));return r===void 0?null:Te(r,n)}let Oe=[`I`,`II`,`III`,`IV`,`V`,`VI`,`VII`],ke={major:[!0,``],minor:[!1,``],diminished:[!1,`°`],augmented:[!0,`+`],sus2:[!0,`sus2`],sus4:[!0,`sus4`],5:[!0,`5`],6:[!0,`6`],m6:[!1,`6`],7:[!0,`7`],maj7:[!0,`maj7`],m7:[!1,`7`],mMaj7:[!1,`maj7`],m7b5:[!1,`ø7`],dim7:[!1,`°7`],9:[!0,`9`],maj9:[!0,`maj9`],m9:[!1,`9`],add9:[!0,`add9`]},Ae=new Map(Object.entries(ke).map(([e,[t,n]])=>[`${t}${n}`,e])),je={b:-1,"":0,"#":1},Me=e=>e<0?`b`:e>0?`#`:``;function Ne(e){let t=e===e.toUpperCase();if(!t&&e!==e.toLowerCase())return;let n=Oe.indexOf(e.toUpperCase());return n<0?void 0:{degree:n,upper:t}}function Pe(e){let t=/^([b#]?)([IViv]+)(.*?)(?:\/([b#]?)([IViv]+))?$/u.exec(e);if(!t)return;let[,n,r,i,a,o]=t,s=Ne(r),c=s&&Ae.get(`${s.upper}${i}`);if(!s||!c)return;let l={degree:s.degree,accidental:je[n],quality:c};if(o===void 0)return l;let u=Ne(o);if(u)return l.of={degree:u.degree,accidental:je[a],minor:!u.upper},l}function Fe(e){let[t,n]=ke[e.quality],r=Oe[e.degree],i=Me(e.accidental)+(t?r:r.toLowerCase())+n;if(!e.of)return i;let a=Oe[e.of.degree];return`${i}/${Me(e.of.accidental)}${e.of.minor?a.toLowerCase():a}`}function Ie(e){let t=c(e);return Math.max(...t)-Math.min(...t)}let Le={ionian:`LLsLLLs`,aeolian:`LsLLsLL`};function Re(e,t,n){let r=c(e),i=Math.max(...r),a=r.map(e=>e===i?`L`:`s`).join(``),o=A(e,[0,1,2,3,4,5,6].find(e=>a.slice(e)+a.slice(0,e)===Le[t]));return s(o,n-o.heights[0])}function ze(e,t){return t?Re(e,t.minor?`aeolian`:`ionian`,Ve(e,t.degree,t.accidental)):e}function Be(e,t){let n=ze(e,t.of);return{root:i(Ve(n,t.degree,t.accidental,Ie(e)),n.cycle),quality:t.quality}}function Ve(t,n,r,i=Ie(t)){return e(t,n)+r*i}function He(t,n){if(t.heights.length!==7)return;let r=Re(t,`ionian`,t.heights[0]),a=Ie(t),o=(t,n)=>i(e(t,n),t.cycle),s=i(n,t.cycle),c=(e,n)=>i(o(t,e)+n*a,t.cycle)===s,l=[0,1,2,3,4,5,6],u=(r,i)=>({degree:r+7*((n-i*a-e(t,r))/t.cycle),accidental:i}),d=l.find(e=>c(e,0));if(d!==void 0)return u(d,0);let f=l.find(e=>o(r,e)===s);if(f!==void 0){for(let e of[-1,1])if(c(f,e))return u(f,e)}let p=l.find(e=>c(e,-1));if(p!==void 0)return u(p,-1);let m=l.find(e=>c(e,1));return m===void 0?void 0:u(m,1)}function Ue(e,t,n){if(!(t.quality in ke)||e.heights.length!==7)return;let r=He(ze(e,n),t.root);if(r)return{degree:i(r.degree,7),accidental:r.accidental,quality:t.quality,...n&&{of:n}}}d(3,8),d(5,8,6),d(5,16,6),d(4,16),d(2,16,4),d(7,16);let We=(t,n)=>s(A(t,n),-e(t,n)),Ge=e=>({cycle:12,heights:e}),Ke={ionian:[`major`,`ION`],dorian:[`DOR`],phrygian:[`PHR`],lydian:[`LYD`],mixolydian:[`MIX`],aeolian:[`minor`,`natural minor`,`AEO`],locrian:[`LOC`]},qe=Object.fromEntries(M.map(e=>[e,{helix:N(e),aliases:Ke[e]??[]}]));function Je(e,t){return Object.fromEntries(t.map(([t,n],r)=>[t,{helix:We(e,r),aliases:n}]))}let Ye=We(d(5,12),3),Xe=d(8,12),Ze={...qe,...Je(Ye,[[`major pentatonic`,[`pentatonic`,`pentatonic major`,`PENT`]],[`suspended pentatonic`,[`suspended`,`egyptian`]],[`man gong`,[`malkos raga`,`MGNG`]],[`ritsusen`,[`ritusen`,`RITS`]],[`minor pentatonic`,[`pentatonic minor`,`vietnamese 2`,`MPEN`]]]),"whole tone":{helix:d(6,12),aliases:[`wholetone`,`messiaen's mode #1`,`WTON`]},chromatic:{helix:d(12,12),aliases:[`CHR`]},diminished:{helix:Xe,aliases:[`whole half`,`whole half diminished`]},"half whole diminished":{helix:We(Xe,1),aliases:[`half whole`,`dominant diminished`,`octatonic`,`messiaen's mode #2`,`HWD`]},...Je(Ge([0,3,5,6,7,10]),[[`blues`,[`minor blues`,`BLUE`]],[`major blues`,[`MBLU`]]]),...Je(Ge([0,2,3,5,7,8,11]),[[`harmonic minor`,[`HMIN`]],[`locrian natural 6`,[`locrian 6`,`locrian #6`,`LOC6`]],[`ionian #5`,[`ionian augmented`,`major augmented`,`major #5`,`ION5`]],[`dorian #4`,[`ukrainian dorian`,`romanian minor`,`altered dorian`,`DOR4`]],[`phrygian dominant`,[`spanish phrygian`,`spanish`,`phrygian major`,`PDOM`]],[`lydian #2`,[`lydian #9`,`LYD2`]],[`ultralocrian`,[`altered diminished`,`superlocrian bb7`,`superlocrian diminished`,`ULOC`]]]),...Je(Ge([0,2,3,5,7,9,11]),[[`melodic minor`,[`jazz minor`,`MMIN`]],[`dorian b2`,[`phrygian natural 6`,`phrygian #6`,`melodic minor second mode`,`DOR2`]],[`lydian augmented`,[`lydian #5`,`LYD+`]],[`lydian dominant`,[`acoustic`,`overtone`,`lydian b7`,`LDOM`]],[`mixolydian b6`,[`aeolian dominant`,`hindu`,`melodic minor fifth mode`,`MIX6`]],[`locrian natural 2`,[`aeolian b5`,`locrian #2`,`LOC2`]],[`altered`,[`super locrian`,`superlocrian`,`altered dominant`,`diminished whole tone`,`pomeroy`,`ALT`]]]),augmented:{helix:Ge([0,3,4,7,8,11]),aliases:[]}},Qe=/* @__PURE__ */ new Map;for(let[e,t]of Object.entries(Ze))for(let n of[e,...t.aliases]){let t=_(n);Qe.has(t)||Qe.set(t,e)}let $e=[`kick`,`closedHat`,`openHat`,`pedalHat`,`ride`,`rim`],et={kick:`bd`,closedHat:`hh`,openHat:`oh`,pedalHat:`ph`,ride:`rd`,rim:`rim`},tt=L[`4/4`];z(tt).cycle;let nt=e=>s(N(e.mode),e.tonic);function rt(e,t){let{root:n,quality:r}=Be(nt(e),t),a=e.tonic+i(n-e.tonic,12);return C(S[r].stack.map(e=>a+e))}let it=[`bar`,`style`,`harm`],at=$e.map(e=>et[e]),ot=[`frame`,`bass`,`pad`,`stab`,`next`];[...it,...ot,...at];let st=[`aeolian`,`dorian`,`ionian`,`mixolydian`,`phrygian`,`lydian`,`locrian`],ct=[`plain`,`pentatonic`,`blues`],lt={tonic:9,mode:`aeolian`};function ut(e){return s(N(e.mode),e.tonic)}let dt={minor:{plain:[0,1,2,3,4,5,6].map(e=>[e,0]),pentatonic:[[0,0],[2,0],[3,0],[4,0],[6,0]],blues:[[0,0],[2,0],[3,0],[4,-1],[4,0],[6,0]]},major:{plain:[0,1,2,3,4,5,6].map(e=>[e,0]),pentatonic:[[0,0],[1,0],[2,0],[4,0],[5,0]],blues:[[0,0],[1,0],[2,-1],[2,0],[4,0],[5,0]]}};function ft(e,t){let n=ut(e);if(t===`plain`||n.heights[4]-n.heights[0]!==7)return n;let r=n.heights[2]-n.heights[0]===3?`minor`:`major`;return{cycle:n.cycle,heights:dt[r][t].map(([e,t])=>Ve(n,e,t))}}function pt(e,t){return t.tonic===null?t.mode===e.mode?e:{tonic:i(I(ut(e),N(t.mode)).heights[0],12),mode:t.mode}:t.tonic===e.tonic&&t.mode===e.mode?e:{tonic:t.tonic,mode:t.mode}}function mt(e){let t=e;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function ht(e,...t){let n=e>>>0;for(let e of t)n=Math.imul(n^(e|0),2654435761)>>>0;return mt(n)}function gt(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function _t(e,...t){return ht(e,...t)()}let vt={form:1,drumHit:2,drumVariation:3,drumVelocity:4,drumEuclid:5,theme:6,themeRenewal:7,chordColor:8,bassHit:9,bassVariation:10,bassNote:11,compHit:12,compVariation:13,leadRhythm:14,leadShape:15,leadVariation:16,bassVelocity:17,padVelocity:18,stabVelocity:19,leadVelocity:20,drumLength:21,bassLength:22,padLength:23,stabLength:24,leadLength:25,keyJump:26,ownAccent:27,offerVariation:28,radio:29,grooveVariation:30,lineVariation:31,leadLineVariation:32,harmonyVariation:33,restless:34};function B(e,t,...n){return _t(e,0,vt[t],...n)}function yt(e,[t,n],r,i,a,o,s,c=0){let l=B(e,t,r,i,o);return(a%2==1||c>0&&V(B(e,`restless`,vt[n],r,a),c))&&(l+=(B(e,n,r,a,o)-.5)*(.12+.4*s)),Math.min(.9999,Math.max(1e-4,l))}let bt=2**-16;function xt(e){return Math.round(e/bt)*bt}function V(e,t){if(!(e>=0&&e<1))throw Error(`chance: draw ${e} is outside [0, 1)`);if(!Number.isFinite(t))throw Error(`chance: probability ${t} is not a finite number`);return e<xt(t)}function St(e,t){if(!(e>=0&&e<1))throw Error(`pick: draw ${e} is outside [0, 1)`);let n=t.map(e=>{if(!(e>=0&&Number.isFinite(e)))throw Error(`pick: weight ${e} is negative or not finite`);return Math.round(e/bt)}),r=n.reduce((e,t)=>e+t,0);if(r===0)throw Error(`pick: the weights give nothing to pick`);let i=Math.floor(e*r);for(let e=0;e<n.length-1;e++)if(i-=n[e],i<0)return e;return n.length-1}let Ct=e=>Math.max(0,Math.min(1,e)),wt=e=>{let t=Ct(e);return t*t*(3-2*t)};function Tt(t,n){let r=n.map(n=>e(t,n.degree)+n.alter),a=k(r.map(e=>e-r[0]));return!a||!Ue(t,{root:i(r[0],12),quality:a})?null:{helix:{cycle:12,heights:r},tensions:[]}}function Et({seed:t,barInSection:n,key:r,theme:a,harm:o}){let s=ut(r),c=a.bars[n],u=wt((o-.25)/.5),d=Ct((o-.75)/.25)*.7,f=(e,r)=>B(t,`chordColor`,a.index,n,e,r);return c.map((t,p)=>{let m=V(f(p,1),d);if(`dominantOf`in t){let n=e(s,t.dominantOf),r=s.heights[0]+i(n+7-s.heights[0],12);return{slot:t,raised:!1,chord:{helix:{cycle:12,heights:[r,r+4,r+7,r+10]},tensions:m?[r+14]:[]}}}let h=t.degree,g=t.stack&&Tt(s,t.stack);if(g)return{slot:t,raised:!1,chord:g};let _=V(f(p,0),u)?4:3,v=l({cycle:7,heights:[h,h+2,h+4,h+6].slice(0,_)},s).heights,y=v[0],b=p+1<c.length?c[p+1]:a.bars[n+1]?.[0],x=b===void 0?0:`degree`in b?b.degree:null;if((r.mode===`aeolian`||r.mode===`dorian`)&&h===4&&x===0&&o>.4)return{slot:t,raised:!0,chord:{helix:{cycle:12,heights:[y,y+4,y+7,y+10].slice(0,_)},tensions:[]}};let S=e(s,h+8),C=_===4&&m&&S-y===14?[S]:[];return{slot:t,raised:!1,chord:{helix:{cycle:12,heights:v},tensions:C}}})}function Dt(e,t){let n=Math.floor(t*R(e)/16);return n%2==t%2?n:n-1}function Ot(e,t){return e.map(e=>({...e,slot:{...e.slot,step:Dt(t,e.slot.step)}}))}function kt(e,t){return e.findLast(e=>e.slot.step<=t)??e[0]}function At(e){let t=w(e),n=t.map(e=>e-t[0]),r=k(n);if(!r)throw Error(`chords: no quality for ${n.join(` `)}`);return{root:t[0],stack:n,quality:r}}function jt({slot:t,chord:n},r){let a=ut(r),{root:o,quality:s}=At(n),c=`dominantOf`in t?{degree:t.dominantOf,accidental:0,minor:e(a,t.dominantOf+2)-e(a,t.dominantOf)===3}:void 0,l=Ue(a,{root:i(o,12),quality:s},c);if(!l)throw Error(`chordNumeral: no numeral for ${s} on ${o}`);return Fe(l)}let Mt={intro:[`groove`],groove:[`groove`,`bridge`,`build`],bridge:[`groove`,`build`,`breakdown`],build:[`drop`],drop:[`drop`,`breakdown`,`groove`],breakdown:[`build`,`groove`]},Nt=(e,t,n)=>{switch(e){case`intro`:return 0;case`groove`:return .3*(1-n)+.05;case`bridge`:return .35+.2*n;case`build`:return .1+.45*t;case`drop`:return .3*t;case`breakdown`:return .35-.15*t}};function Pt(e,t,n){return Mt[e].map(e=>[e,Nt(e,t,n)])}let Ft={initial:null,advance({seed:e,index:t,style:n},r){let i=`intro`;if(t>0){let a=Pt(r?.type??`intro`,n.energy,n.entropy),o=a.length===1?[1]:a.map(([,e])=>e);i=a[St(B(e,`form`,t),o)][0]}let a={type:i,index:t};return{carried:a,output:a}}},It={intro:-.3,groove:0,bridge:-.1,build:0,drop:.3,breakdown:-.45};function Lt(e,t,n){let r=t===`build`?-.15+.45*n/7:It[t];return Math.max(0,Math.min(1,e+r))}let Rt=[`sync`,`harm`,`artic`,`energy`],H=e=>Object.fromEntries(Rt.map(t=>[t,e[t]]));function zt(e,t,n,r,i=[],a){let{miss:o,hold:s}=e.margins??{miss:.3,hold:.02},c=a===void 0?e.query(H(t),r,...i.length?[i]:[]):e.query(H(t),r,i,a),l=c[0];if(!l||l.distance>o)return null;let u=n===null?void 0:c.find(e=>e.id===n),d=u&&u.distance<=o&&u.distance-l.distance<=s?u.id:l.id;return e.fragments.get(d)}let Bt=[],Vt=e=>xt(.2*Math.min(1,Math.max(0,1-e))),Ht=[`fill`],Ut=e=>Math.floor(e/3),Wt={},Gt=(e,{rhythmFragment:t,claveFragment:n})=>t===void 0||n===void 0||n in e?e:{...e,[n]:t};function Kt(e,t=Wt){let n=e.filter(e=>e.rejected).flatMap(e=>e.grooves);return[...n,...Object.keys(t).filter(e=>n.includes(t[e]))]}function qt(e,t){let n=t=>{let n=e.filed.find(e=>e.fragment.id===t)?.meta.varies;return typeof n==`string`?n:void 0},r=e=>{let t=/* @__PURE__ */ new Set([e]),r=e;for(let e=n(r);e!==void 0&&!t.has(e);e=n(r))t.add(e),r=e;return r},i=r(t),a=e.filed.map(e=>e.fragment.id).filter(e=>r(e)===i),o=a.includes(i)?a:[i,...a];return o.includes(t)?o:[t]}function Jt(e,t){let n=e.find(e=>e.grooves.some(e=>t.includes(e)));return n?{...n,grooves:[...n.grooves,...t.filter(e=>!n.grooves.includes(e))]}:{grooves:[...t],boredom:0,rejected:!1}}function Yt({grooves:e,boredom:t}){let n=Ut(t);return n>=1&&n<2&&e.length-1<n}function Xt(e,t,n){let r=xt(n),i=e=>t.some(t=>e.grooves.some(e=>t.grooves.includes(e)));return[...e.filter(e=>!i(e)).map(e=>({...e,boredom:e.boredom-r})).filter(e=>e.boredom>0),...t.map(({grooves:e,boredom:t})=>{let n=t+r;return{grooves:e,boredom:n,rejected:Ut(n)>=2}})]}let Zt={miss:.3,hold:.02},Qt=e=>e.margins??Zt;function $t(e,t,n,r,i=0){let a=e[0],o=t===void 0?void 0:e.find(e=>e.id===t);return o&&o.distance<=n+i&&o.distance-a.distance<=r?o.id:a&&a.distance<=n?a.id:void 0}function en(e,t,n,r,i,a,o=[],s=[],c){let{miss:l,hold:u}=Qt(e);return $t(e.query(t,n,a,o,l,c).filter(e=>e.distance<=l&&!s.includes(e.id)).filter(t=>i(e.read(t.id,n.meter,a))),r,l,u)}let tn=(e,t,n)=>e.filed.filter(e=>e.fragment.association.some(e=>e.facet===t)).findIndex(e=>e.fragment.id===n);function nn(e,t,n,r,i,a,o,s){if(!e||o===void 0)return{id:o,layer:i,playing:null};let c=i.filed.some(e=>e.fragment.id===o);if(!c&&!e.file)return{id:o,layer:i,playing:null};let l=Jt(a,qt(i,o)),u=Yt(l)&&e.file&&e.vary?e.read(o,s.meter,i):null;if(!u||u.bars!==1)return{id:o,layer:i,playing:l};let d=c?tn(i,t,o):-1,f=d===-1?gt(o):d,p=e.vary(o,s,B(r.seed,n,f),i);if(!p)return{id:o,layer:i,playing:l};let{by:m,...h}=p,g=e.file(i,{...h,bench:s,point:r.point,source:`composer`,created:`song ${r.seed}, bar ${r.index*8}`,tags:r.tags,varies:o,by:m}),_=l.grooves.includes(g.id)?l.grooves:[...l.grooves,g.id];return{id:g.id,layer:g.layer,playing:{...l,grooves:_}}}function rn(e,t,n,r,i,a){if(!e?.file)return{layer:a,ids:[]};let o=a,s=[];for(let{source:a,bars:c}of t){let t=n(c);if(!t)continue;let l=e.file(o,{...t,bench:r,point:i.point,source:a,created:`song ${i.seed}, bar ${i.index*8}`,tags:i.tags});o=l.layer,s.includes(l.id)||s.push(l.id)}return{layer:o,ids:s}}function an(e,t,n,r,i){let a=n.filter(e=>e!==void 0);return a.length&&e?.used?e.used(t,a,r,i===void 0?[]:[i]):t}let on=[`drums`,`bass`,`pad`,`stab`,`lead`],sn=[`kick`,`backbeat`,`fill`,`ghost`,`hat`,`pedal`,`euclid`,`clave`],cn=L[`4/4`],ln=z(cn).cycle,un=e=>2*Math.floor(e/4),dn=e=>2*Math.floor(e*3/8),fn=(e,t)=>e.cycle===t.cycle&&e.heights.length===t.heights.length&&e.heights.every((e,n)=>e===t.heights[n]);function pn(n){if(n.length===0)throw Error(`clockOf: a song needs a meter`);let r=[];for(let{bar:e,meter:t}of[...n].sort((e,t)=>e.bar-t.bar)){if(t.heights[0]!==0)throw Error(`clockOf: a meter starts on its downbeat`);let n=z(t),i=r.at(-1),a=i?e-i.bar:e;r.push({bar:e,step:i?i.step+a*i.helix.cycle:a*n.cycle,beat:i?i.beat+a*i.beats:a*n.heights.length,helix:n,beats:n.heights.length})}let i=(e,t)=>r.findLast(n=>e(n)<=t)??r[0],a=e=>{let t=i(e=>e.bar,e);return t.step+(e-t.bar)*t.helix.cycle},o=e=>{let n=i(e=>e.step,e);return n.bar+Math.floor(t(n.helix,e-n.step)/n.beats)},s=e=>{let n=i(e=>e.step,e);return n.beat+t(n.helix,e-n.step)},c=t=>{let n=i(e=>e.beat,t);return n.step+e(n.helix,t-n.beat)};return{barAt:o,barStart:a,barSteps:e=>i(e=>e.bar,e).helix.cycle,stepInBar:e=>e-a(o(e)),beatAt:s,beatStart:c,beatInBar:e=>{let n=i(e=>e.step,e);return u(t(n.helix,e-n.step),n.beats)},onBeat:e=>c(s(e))===e}}let{barAt:mn,barStart:hn,stepInBar:gn,beatAt:_n,beatStart:vn,beatInBar:yn,onBeat:bn}=pn([{bar:0,meter:cn}]),xn=[{name:`sync`,range:[0,1],sentence:`On the beat (0) to off the beat (1).`},{name:`harm`,range:[0,1],sentence:`A static vamp (0) to moving, rich harmony (1).`},{name:`artic`,range:[0,1],sentence:`Legato (0) to staccato (1).`},{name:`energy`,range:[0,1],sentence:`Sparse (0) to dense (1).`}],Sn=xn.map(e=>e.name),Cn={adsr:[`attack`,`decay`,`sustain`,`release`],style:Sn},wn={min:0,max:1,space:`linear`};function Tn(e){let t=xn.find(t=>t.name===e);if(!t)throw Error(`cells' table of axes has no ${e}`);return{min:t.range[0],max:t.range[1],space:`linear`}}let En={sync:Tn(`sync`),harm:Tn(`harm`),artic:Tn(`artic`),energy:Tn(`energy`),entropy:wn,bpm:{min:60,max:180,space:`log`}},Dn=Object.keys(En),On=(e,[t,n,r,i,a])=>({name:e,style:{sync:t,harm:n,artic:r,energy:i,bpm:a}}),kn=[On(`Synth-pop`,[.3,.45,.55,.55,108]),On(`Techno`,[.12,0,1,.8,130]),On(`Deep house`,[.35,.55,.65,.65,122]),On(`Ambient`,[.05,.3,0,.2,72]),On(`Lo-fi hip hop`,[.5,.75,.35,.5,84]),On(`Funk`,[1,.12,.85,.75,104]),On(`Bossa nova`,[.75,.85,.45,.45,132]),On(`Swing jazz`,[.35,1,.3,.6,148]),On(`Electro swing`,[.55,.75,.6,.75,124]),On(`Spooky`,[.2,.9,.3,.35,100])];hn(8),hn(1),{...kn[0].style};function An(e){let t=1e3;return Object.fromEntries(Dn.map(n=>[n,Math.round(e[n]*t)/t]))}function jn(e,t){return{played:n=>t.played(e.played(n)),written:n=>e.written(t.written(n))}}let Mn=e=>Math.max(0,Math.min(1,e)),Nn=1.5,Pn=e=>.5+e/6,Fn=e=>(e-.5)*6,In=e=>Math.max(-1.5,Math.min(Nn,e));function Ln({sixteenth:e,eighth:t},n=L[`4/4`]){return jn(Gn(2,In(e)),Kn(z(n),In(t)))}let Rn=[`8n`,`16n`],zn={level:`16n`,share:.5};Pn(Nn);function Bn({level:e,share:t}){let n=Fn(t);return e===`8n`?{sixteenth:0,eighth:n}:{sixteenth:n,eighth:0}}let Vn=e=>Mn(Bn(e).eighth),Hn=e=>Mn(Fn(e.share)*(e.level===`8n`?1:.5));function Un({level:e,share:t}){return{level:e,share:{from:t,to:t,start:0,length:0,slope:0,brake:0}}}function Wn(e,t,n,r){return e<t?e*n/t:n+(e-t)*(r-n)/(r-t)}function Gn(e,t){let n=e/2,r=n+t*e/6,i=(t,n,r)=>{let i=Math.floor(t/e)*e;return i+Wn(t-i,n,r,e)};return{played:e=>i(e,n,r),written:e=>i(e,r,n)}}function Kn(n,r){let i=2+r*4/6,a=(r,i,a)=>{let o=t(n,r),s=e(n,o),c=e(n,o+1)-s;return c===4?s+Wn(r-s,i,a,c):r};return{played:e=>a(e,2,i),written:e=>a(e,i,2)}}let qn=`bass`;function Jn(e,t,n){let r=z(t).heights;for(let t=0;t<e.bars;t++)if([...new Set(e.notes.filter(e=>e.step>=t*n&&e.step<(t+1)*n).map(e=>e.step-t*n))].sort((e,t)=>e-t).join()!==r.join())return!1;return!0}function Yn(e,t,n,r,i,a,o,s=[],c=[],l){let u=Vn(r)>0;return en(e,H(t),n,a,e=>e!==null&&(u||!Jn(e,n.meter,i)),o,s,c,l)}function Xn(e,t,n,r,i,a){let o=t===void 0?null:e.read(t,n,a);if(!o)return[];let s=r%o.bars;return o.notes.filter(e=>Math.floor(e.step/i)===s).map(e=>({...e,step:e.step-s*i}))}function Zn(t,n,r,i){let a=kt(n,t.step),o=[...n.filter(e=>e.slot.step>a.slot.step),...r],s=w((t.chord===0?a:o[t.chord-1]??o.at(-1)??a).chord),c=Math.floor(t.index/s.length),l=s[t.index-c*s.length]+12*c;if(t.alter===0)return l+t.shift;let u=ut(i),d=He(u,l);return(d?e(u,d.degree+t.alter)+d.accidental*1:l+t.alter)+t.shift}function Qn(e,t,n=`cycle`,r=0){let i=t.heights.length,a=c(t),o=Array.from({length:R(t)},()=>0),s=(n,r)=>{let i=Math.floor(n%4/2),s=t.heights[r]*2+i%a[r]*2+n%2;o[s]=Math.max(o[s],e[n])};for(let t=0;t<e.length;t++){if(e[t]===0)continue;let a=Math.floor(t/4);if(n===`fold`)s(t,a%i);else for(let e=0;e<i;e++)a===(e===0?0:(r*i+e)%4)&&s(t,e)}return o}let $n=[33,57],er=[33,52],tr=[1,0,0,.7,0,0,.8,.4,0,0,.7,.5,0,.3,.8,0],nr=[`root`,`pump`,`eight`,`funk`,`walk`];function rr(e,t=0){let n=R(e),r=z(e).heights,i=ve(e),a=e=>r.length>=4&&e%2==0&&i[e/2]===`half`,o=e=>Array.from({length:n},(t,n)=>e(n)),s=new Set(r.map(e=>e+2)),c=new Set(r);return{root:o(e=>e===0?1:a(e)?.6:0),pump:o(e=>+!!s.has(e)),eight:o(e=>e%2==0?e===0?1:a(e)?.9:.8:0),funk:Qn(tr,e,`cycle`,t),walk:o(e=>+!!c.has(e))}}let ir=[`bassHit`,`bassVariation`],ar={hit:0,anticipate:1},or={approach:0,walkTone:1,ornament:2},sr=e=>Math.max(0,Math.min(1,e));function cr(e,t,n){let r=Vn(t),i=r*sr(e.harm*1.5),a=e.sync*(1-i);return{root:.35,pump:(1-e.harm)*e.artic*(1-r)*(1-e.sync),eight:n*.6*(1-i)*(1-a),funk:a,walk:i}}let lr=e=>e.helix.heights[0],ur=e=>e.helix.heights.map(t=>t-lr(e));function dr(e,t){let n=40,r=1/0;for(let a=er[0];a<=er[1];a++)i(a,12)===i(e,12)&&Math.abs(a-t)<r&&(r=Math.abs(a-t),n=a);return n}function fr(e,t,n=[]){let{seed:r,bar:a,plan:o,style:s,barEnergy:c,next:l,meter:u}=e,d=o.section.index,f=[],p=R(u),m=z(u).heights,h=e=>m.includes(e),g=Ot(e.chords,u),_=e=>g.some(t=>t.slot.step===e),v=e=>g.find(t=>t.slot.step>e)??l[0]??kt(g,e);if(o.section.type===`breakdown`)return g.forEach((e,n)=>{let r=g[n+1]?.slot.step??p;t=dr(lr(e.chord),t),f.push({part:`bass`,step:e.slot.step,note:t,length:r-e.slot.step})}),{carried:t,output:f};let y=cr(s,e.swing,c),b=Object.values(y).reduce((e,t)=>e+t,0),x=.55+.6*c,S=(t,n)=>yt(r,ir,t,d,a,n,s.entropy,e.restless),C=rr(u,a),w=[],T=[],E=/* @__PURE__ */ new Set;for(let e=0;e<p;e++){let t=0;for(let n of nr)t+=y[n]*C[n][e];t/=b,T.push(t);let n=_(e)&&y.pump<.45||y.walk>.5&&h(e);n&&E.add(e),(n||V(S(ar.hit,e),t*x))&&w.push(e)}w.length===0&&w.push(0);let D=pr(w,n,E,T);return D.forEach(({step:e,from:n},c)=>{let u=kt(g,e).chord,b=D[c+1]?.step??p,x=y.walk>.5&&h(e),C=lr(u),w=!1;if(n){if(C=Zn(n,g,l,o.key),!x&&!_(e)){let t=B(r,`bassNote`,or.ornament,d,e);w=t>=.55&&t<.8}}else if(x){let t=m.find(t=>t>e)??p,n=t>=p,i=n||_(t),o=n?l[0]?.chord??u:kt(g,t).chord;if(_(e))C=lr(u);else if(i)C=lr(o)+(V(B(r,`bassNote`,or.approach,a,e),.5)?-1:1);else{let[,t,n,i]=ur(u),o=[t,n,i??n];C=lr(u)+o[Math.floor(B(r,`bassNote`,or.walkTone,a,e)*3)]}}else if(!_(e)){let t=v(e).chord;if(e>=p-3&&i(lr(t)-lr(u),12)!==0&&V(S(ar.anticipate,e),s.sync*.9))C=lr(t);else{let t=B(r,`bassNote`,or.ornament,d,e);t>=.55&&t<.8?w=!0:t>=.8&&(C=lr(u)+ur(u)[2])}}t=dr(C,t),f.push({part:`bass`,step:e,note:w&&t+12<=$n[1]?t+12:t,length:b-e})}),{carried:t,output:f}}function pr(e,t,n,r){if(!t.length)return e.map(e=>({step:e,from:null}));let i=[...t].sort((e,t)=>e.step-t.step),a=i.filter((e,t)=>i.findIndex(t=>t.step===e.step)===t).slice(0,e.length).map(e=>({step:e.step,from:e})),o=new Set(a.map(e=>e.step)),s=e.filter(e=>!o.has(e)).sort((e,t)=>Number(n.has(t))-Number(n.has(e))||r[t]-r[e]||e-t).slice(0,e.length-a.length).map(e=>({step:e,from:null}));return[...a,...s].sort((e,t)=>e.step-t.step)}let mr={initial:40,advance:(e,t)=>fr(e,t)},hr=[50,79],gr=[50,63],_r=[0,0,.9,0,0,0,.9,.3,0,0,.9,0,.3,0,.9,.3],vr=[`compHit`,`compVariation`],yr={pad:0,stab:1},br=(e,t,n)=>e+(t-e)*n;function xr(e,t){let n=(e,t)=>Math.min(...t.map(t=>Math.abs(e-t)));return t.reduce((t,r)=>t+n(r,e),0)+.5*e.reduce((e,r)=>e+n(r,t),0)}function Sr(e,t){let n=w(e),r=(n.length>=5?n.filter((e,t)=>t!==2):n).map(e=>i(e,12)),a=e=>e.reduce((e,t)=>e+t,0)/e.length,o=null,s=1/0;for(let e=0;e<r.length;e++){let n=[...r.slice(e),...r.slice(0,e)];for(let e=gr[0];e<=gr[1];e++){if(i(e,12)!==n[0])continue;let r=[e];for(let e of n.slice(1)){let t=r.at(-1)+1;for(;i(t,12)!==e;)t++;r.push(t)}if(r.at(-1)>hr[1])continue;let c=t?xr(t,r):Math.abs(a(r)-62);c<s&&(s=c,o=r)}}return o??r.map(e=>60+e)}let Cr=(e,t)=>w(e).join()===w(t).join(),wr={initial:null,advance(e,t){let{seed:n,bar:r,plan:i,style:a,barEnergy:o,next:s,meter:c}=e,l=Vn(e.swing),u=R(c),d=z(c).heights,f=ve(c),p=Ot(e.chords,c),m=Array.from({length:u},(e,t)=>t===0?1:d.includes(t)?f[t/2]===`half`&&d.length>=4?.9:.5:0),h=Qn(_r,c,`cycle`,r),g=i.section.type===`breakdown`||o<.3,_=g?Math.max(.85,1-a.artic):1-a.artic,v=g?0:(.35+.65*o)*(1-.45*l)*a.artic*1.4,y=(t,o)=>yt(n,vr,t,i.section.index,r,o,a.entropy,e.restless),b=t,x=p.map(e=>b=Sr(e.chord,b)),S=[],C=/* @__PURE__ */ new Set;p.forEach((e,t)=>{let n=e.slot.step;if(!V(y(yr.pad,n),_*1.15))return;C.add(n);let r=p[t+1]?.slot.step??u;for(let e of x[t])S.push({part:`pad`,step:n,note:e,length:r-n})});for(let e=0;e<u;e++){if(C.has(e))continue;let t=br(m[e],h[e],a.sync)*v;if(!V(y(yr.stab,e),t))continue;let n=p.indexOf(kt(p,e)),r=x[n],i=s[0];e>=u-2&&a.sync>.5&&i&&!Cr(i.chord,p[n].chord)&&(r=Sr(i.chord,b));for(let t of r)S.push({part:`stab`,step:e,note:t,length:1})}return{carried:b,output:S}}},Tr=[60,86];function Er(e,t,n,r,i,a=e.map(()=>0),o){let s=e[0]>0;return{cycle:i,onsets:s?[0,...e]:[...e],degrees:s?[null,...t]:[...t],accidentals:[...s?[0]:[],...a],sync:n,energy:r,...o===void 0?{}:{fragment:o}}}function Dr(e){let t=e.degrees.flatMap((e,t)=>e===null?[]:[t]);return{steps:t.map(t=>e.onsets[t]),degrees:t.map(t=>e.degrees[t]),accidentals:t.map(t=>e.accidentals[t]??0)}}function Or(e,t,n){let{cycle:r,onsets:i,degrees:a,accidentals:o,accents:s}=e,c=n*t%r,l=[];for(let e=0;e*r<c+t;e++)i.forEach((n,i)=>{let a=e*r+n-c;a>=0&&a<t&&l.push({at:a,i})});let u=l.length>0&&l[0].at>0;return{cycle:t,onsets:[...u?[0]:[],...l.map(e=>e.at)],degrees:[...u?[null]:[],...l.map(e=>a[e.i])],accidentals:[...u?[0]:[],...l.map(e=>o[e.i])],...s?{accents:[...u?[0]:[],...l.map(e=>s[e.i])]}:{}}}let kr=[.5,.2,.4,.8,.2,.4,.8,.5,.3,.2,.8,.6,.2,.4,.9,.4];function Ar(e){let t=new Set(z(e).heights),n=ve(e);return Array.from({length:R(e)},(e,r)=>r%2==0?r===0?1:t.has(r)?n[r/2]===`half`&&t.size>=4?.9:.8:.4:t.has(r-1)?.1:.15)}let jr=[e=>Math.sin(Math.PI*e),e=>-e,e=>e,e=>Math.sin(2*Math.PI*e)*.6],Mr=(e,t,n)=>e+(t-e)*n;function Nr(e,t){return e<.25?z(t).heights:e<.6?[0,un(R(t))]:[0]}function Pr({style:e,swing:t,barEnergy:n,chords:r,plan:i,meter:a}){let s=R(a),c=new Set(z(a).heights),l=Ot(r,a);return{density:.25+.5*n,grooveMix:e.sync,pickups:Array.from({length:s},(e,n)=>n%2==0&&!c.has(n)?.3*Hn(t):0),pulse:o(d(Math.round(3+5*n),s,Math.round(e.sync*3))),scale:ft(i.key,i.melodic),span:2+Math.round((n+e.entropy)*3),contours:[1+(1-e.harm)*(1-e.entropy),1,1,.25+1.5*e.harm],turn:.2+.3*e.entropy,leap:e.entropy>.5?e.entropy-.5:0,variations:[.3,.25,.25,.2],nudge:e.entropy*.5,snap:Array.from({length:s},(e,t)=>t).filter(t=>Nr(e.harm,a).includes(t)||l.some(e=>e.slot.step===t)),range:Tr}}function Fr(e){let{seed:t,plan:n,style:r,barEnergy:i,barInSection:a,meter:o,bar:s}=e,{density:c,grooveMix:l,pickups:u,pulse:d,span:f,contours:p,turn:m,leap:h}=Pr(e),g=R(o),_=Ar(o),v=Qn(kr,o,`cycle`,s),y=n.section.index,b=a>>2,x=0,S=()=>B(t,`leadShape`,y,b,x++),C=new Set(d),w=[];for(let e=0;e<g;e++){let n=Math.min(1,Mr(_[e],v[e],l)*c+u[e]),r=Mr(n,C.has(e)?.9:0,.5);V(B(t,`leadRhythm`,y,b,e),r)&&w.push(e)}for(let e of[0,un(g),...z(o).heights,2,4,6]){if(w.length>=3)break;!w.includes(e)&&e<g&&w.push(e)}w.sort((e,t)=>e-t);let T=jr[St(S(),p)],E=[0],D=0;for(let e=1;e<w.length;e++){let t=Math.round(xt(T(e/Math.max(1,w.length-1))*f)),n=E[e-1],r=Math.sign(t-n)*(Math.abs(t-n)>2?2:1);Math.abs(D)>=3?r=-Math.sign(D):V(S(),m)&&(r+=V(S(),.5)?-1:1),h>0&&V(S(),h)&&(r+=V(S(),.5)?-3:3),E.push(n+r),D=r}return Er(w,E,r.sync,i,g)}function Ir(e,t){let{seed:n,bar:r}=t,{variations:i,nudge:a}=Pr(t),o=0,s=()=>B(n,`leadVariation`,r,o++),c=Dr(e),{degrees:l,accidentals:u}=c,d=c.steps,f=St(s(),i);if(f===0)l=l.map(e=>-e),u=u.map(e=>e===0?0:-e);else if(f===1)l=l.map(e=>e+2);else if(f===2){let e=l.length-1;e>0&&(l[e]=l[e-1]+(V(s(),.5)?-1:1)*(1+St(s(),[1,1])),u[e]=0)}else d.length>2&&(d.pop(),l.pop(),u.pop());if(V(s(),a)&&d.length>1){let e=1+St(s(),d.slice(1).map(()=>1));l[e]+=V(s(),.5)?-1:1}return Er(d,l,e.sync,e.energy,e.cycle,u,e.fragment)}let Lr=(e,t)=>Rr(w(e).map(e=>i(e,12)),t);function Rr(e,t){for(let n=0;n<=6;n++)for(let r of[t-n,t+n])if(e.includes(i(r,12)))return r;return t}function zr(e,[t,n],r=!1,i=[]){let a=r=>[...e,...i].filter(e=>e+r>=t&&e+r<=n).length,o=0;for(let e=-4;e<=4&&!r;e++){let t=12*e,n=a(t)-a(o);(n>0||n===0&&Math.abs(t)<Math.abs(o))&&(o=t)}return{notes:e.map(e=>{let r=e+o;for(;r>n;)r-=12;for(;r<t;)r+=12;return r}),octaves:o/12}}function Br(e,t){return t<.4||e===`breakdown`||e===`intro`}function Vr(e,t,n,r){if(r!==1&&r!==3)return e;let a=w(kt(n,t).chord),o=r===3?[a[0]]:[a[1],a[2]];return[...e.slice(0,-1),Rr(o.map(e=>i(e,12)),e.at(-1))]}function Hr(e,t,n){return e.map(({step:e,note:r})=>n.includes(e)?Lr(kt(t,e).chord,r):r)}function Ur(e,t,n,i,a,o=[]){let{plan:s,barInSection:c,meter:l,bar:u}=t,d=Ot(t.chords,l),f=R(l),p=Pr(t),{onsets:m,degrees:h,accidentals:g,accents:_}=Or(e,f,u),v=i?p.scale:ut(s.key),y=m.flatMap((e,t)=>h[t]===null?[]:[{step:e,i:t}]);if(y.length===0)return{written:[],last:n,anchor:a??null};let b=a??r(v,Lr(kt(d,y[0].step).chord,n)),x=y.map(({step:e,i:t})=>({step:e,note:Ve(v,b+h[t],g[t])})),S=i?Hr(x,d,p.snap):x.map(e=>e.note),C=o.flatMap(e=>e.degrees.flatMap((t,n)=>t===null?[]:[Ve(v,b+t,e.accidentals[n]??0)])),w=zr(Vr(S,y.at(-1).step,d,c%4),p.range,a!==void 0,C);return S=w.notes,{written:y.map(({step:e,i:t},n)=>({part:`lead`,step:e,note:S[n],length:(m[t+1]??f)-e,...i?{}:{accent:_?.[t]??0}})),last:S.at(-1),anchor:b+w.octaves*v.heights.length}}function Wr(e,t,n=null,r){let{plan:i,style:a,barEnergy:o,barInSection:s,offer:c}=e;if(c){let{written:n,last:r}=Ur(c.motif,e,t.last,!1);return{carried:{...t,last:r,phrase:null,form:null,anchor:null,offered:c.bar},output:n}}let{section:l,theme:u}=i;if(Br(l.type,o))return{carried:{...t,phrase:null,form:null,anchor:null,offered:null},output:[]};let d=n===null?[]:`cycle`in n?[n]:n,f=s%4,{phrase:p,melodies:m}=t,h=t.form??null,g,_=f===0||!p;if(_){let t=m[u.kind],n=t&&t.theme===u.index&&Math.abs(t.shape.sync-a.sync)<.25&&Math.abs(t.shape.energy-o)<.3;if(h=null,d.length){let e=d.map(e=>{let{steps:t,degrees:n,accidentals:i}=Dr({...e,sync:0,energy:0});return Er(t,n,a.sync,o,e.cycle,i,r)});g=e[0],e.length>1&&(h=e)}else n?g=t.shape:(g=Fr(e),m={...m,[u.kind]:{theme:u.index,shape:g}});p=g}else g=p;let v=h?f%h.length:0;h?(g=h[v],!_&&f>=h.length&&v===h.length-1&&(g=Ir(g,e))):!_&&f%2==1&&(g=Ir(p,e));let y=h&&v>0?t.anchor??void 0:void 0,b=Ur(g,e,t.last,g.fragment===void 0,y,h&&v===0?h.slice(1):[]);return{carried:{last:b.last,phrase:p,melodies:m,offered:null,form:h,anchor:h?v===0?b.anchor:t.anchor??b.anchor:null},output:b.written}}function Gr(e){if(e.offer||Br(e.plan.section.type,e.barEnergy))return[];let t=Fr(e);return Ur(e.barInSection%4%2==0?t:Ir(t,e),e,69,!0).written}let Kr={initial:{last:69,phrase:null,melodies:{},offered:null,form:null,anchor:null},advance:(e,t)=>Wr(e,t)},qr=`lead`;function Jr(e,t,n,r,i,a=[],o=[],s){return en(e,H(t),n,r,e=>e!==null&&e.bars===1,i,a,o,s)}function Yr(e,t){let n=[...e].sort((e,t)=>e.step-t.step),r=n.length===0||n[0].step>0;return{cycle:t,onsets:[...r?[0]:[],...n.map(e=>e.step)],degrees:[...r?[null]:[],...n.map(e=>e.degree)],accidentals:[...r?[0]:[],...n.map(e=>e.alter)]}}function Xr(e,t,n,r,i){let a=t===void 0?null:e.read(t,n,i);if(!a||a.bars!==1||!a.notes.length)return null;let o=e.phrase?.(a.notes,n);return!o||o.bars<2?[Yr(a.notes,r)]:Array.from({length:o.bars},(e,t)=>Yr(o.notes.filter(e=>e.step>=t*r&&e.step<(t+1)*r).map(e=>({...e,step:e.step-t*r})),r))}function Zr(e,t,n){let r=e.map(e=>e*t);for(let[e,t]of n)r[e]+=t;return r}function Qr(e,t){let n=Math.max(...e);return n>0?e.map(e=>(e/n)**t):e.map(()=>1)}ln-1;let $r={mashing:12,fewest:3,widest:19,forgetAfter:16};new Set(Object.values(L).map(e=>R(e)));function ei(e,t=/* @__PURE__ */ new Set){let n=e=>e.degrees.filter(e=>e!==null).length,r=e=>e.confidence??1,i=e=>+!!t.has(e),a=null;for(let t of e)t.kind===`motif`&&(a===null||i(t)>i(a)||i(t)===i(a)&&(r(t)>r(a)||r(t)===r(a)&&n(t.motif)>n(a.motif)))&&(a=t);return a}let ti=.85,ni=ti**($r.forgetAfter+.5);function ri(e,t,n){let r=Zr(e.map(e=>e.weight),ti,[]),i=e.map((e,t)=>({...e,weight:r[t]})).filter(e=>e.weight>=ni),a=[...i],o=[],s=[],c=/* @__PURE__ */ new Set;for(let e of t){if(e.kind!==`motif`)continue;let t=-1,r=null;for(;r===null&&++t<i.length;)r=De(e.motif,i[t].motif);if(r!==null){let{source:n,bar:a}=i[t];s.push({source:e.source,of:{source:n,bar:a},op:r}),c.add(e)}else t=a.findIndex((t,n)=>n>=i.length&&De(e.motif,t.motif)),t===-1&&(t=a.push({motif:e.motif,source:e.source,bar:n,weight:0,heard:0})-1);o.some(([e])=>e===t)||o.push([t,1])}let l=Zr(a.map(e=>e.weight),1,o),u=new Set(o.map(([e])=>e));return{memory:a.map((e,t)=>({...e,weight:l[t],heard:e.heard+ +!!u.has(t)})),recognised:s,confirmed:c}}let ii={initial:{offer:null,lastPlayed:null,memory:[]},advance({bar:e},t,{judgements:n,forget:r}){let{offer:i,lastPlayed:a}=t,o=null;r&&i&&(i=null,o=`asked`);let{memory:s,recognised:c,confirmed:l}=ri(t.memory,n,e);if(n.length>0){a=e;let t=ei(n,l),r=i!==null&&s.some(e=>e.heard>=2&&De(i.motif,e.motif)!==null);t&&(l.has(t)||!r)&&(i={motif:t.motif,source:t.source,bar:e,level:t.level})}else i&&a!==null&&e-a>$r.forgetAfter&&(i=null,o=`silence`);return{carried:{offer:i,lastPlayed:a,memory:s},output:{bar:e,judgements:n,offer:i,forgot:o,recognised:c}}}},ai=$r.fewest;function oi(e,t){let n=/* @__PURE__ */ new Map;for(let{step:t,note:r}of e)(!n.has(t)||r>n.get(t))&&n.set(t,r);let r=[...n.entries()].sort(([e],[t])=>e-t);if(!r.length)return[];let i=ut(t),a=He(i,r[0][1]).degree;return r.map(([e,t])=>{let{degree:n,accidental:r}=He(i,t);return{step:e,degree:n-a,alter:r}})}let si=e=>e.map(e=>`${e.step}:${e.degree}:${e.alter}`).join(` `);function ci(e){let t=/* @__PURE__ */ new Map;for(let n of e){if(n.length<ai)continue;let e=si(n),r=t.get(e);r?r.count++:t.set(e,{count:1,first:n})}let n=null;for(let e of t.values())(!n||e.count>n.count)&&(n=e);return n?n.first:null}Object.entries(S).filter(([e])=>e!==`harmonics`).map(([e,{stack:t}])=>({name:e,tones:new Set(t.map(e=>e%12)),size:t.length}));function li(e){return e===`bridge`||e===`breakdown`?`B`:e===`build`?`build`:`A`}let ui={aeolian:{0:{5:3,3:3,6:2,4:1,2:1},1:{4:3,6:1},2:{5:2,6:2,3:2,0:1},3:{0:2,4:2,6:2,5:1},4:{0:4,5:1},5:{6:3,2:2,3:2,4:1},6:{0:3,2:3,5:1}},dorian:{0:{3:4,6:2,4:1,2:1},1:{0:2,3:1},2:{3:2,0:1},3:{0:4,6:1},4:{0:2,3:1},5:{0:1,3:1},6:{0:3,3:1}},ionian:{0:{3:3,4:3,5:3,1:1},1:{4:4,6:1},2:{5:3,3:2},3:{4:3,0:2,1:2},4:{0:4,5:2},5:{3:3,1:2,4:1},6:{0:3}},mixolydian:{0:{6:4,3:3,4:1},1:{0:1,6:1},2:{3:1},3:{0:3,6:1},4:{0:2},5:{6:1,3:1},6:{0:3,3:2}},phrygian:{0:{1:3,6:2,3:2,5:1},1:{0:4,6:1},2:{1:2,3:2,0:1},3:{1:2,0:2,6:1},4:{1:1,0:1},5:{1:2,6:2,3:1},6:{0:3,1:2}},lydian:{0:{1:4,4:2,5:2,6:1},1:{0:4,4:1},2:{1:2,5:2},3:{0:1,1:1},4:{0:3,1:2},5:{1:2,4:2},6:{0:2,1:1}},locrian:{0:{1:4,4:2,6:2},1:{0:4,6:1},2:{1:2,6:1},3:{1:2,0:1},4:{1:2,0:2},5:{1:2,4:2},6:{0:3,1:2}}},di={aeolian:4,dorian:4,ionian:4,mixolydian:6,phrygian:1,lydian:4,locrian:1},fi={aeolian:[[0],[0,6],[0,3],[0,5]],dorian:[[0,3],[0],[0,6]],ionian:[[0,3],[0,4],[0,5]],mixolydian:[[0,6],[0,3]],phrygian:[[0,1],[0],[0,6]],lydian:[[0,1],[0],[0,4]],locrian:[[0,1],[0,6]]},pi=(e,t)=>fi[e].findIndex(e=>e.join(` `)===t.join(` `));function mi(e,t){let n=e=>[{step:0,degree:e}],r=t<.15?4:2,i=[0,1,2,3].map(t=>n(e[Math.floor(t/r)%e.length])),a=r===4?[0,1,2,3].map(()=>n(e[1%e.length])):i;return[...i,...a]}let hi=e=>Math.max(0,Math.min(1,e)),gi=(e,t)=>[0,1,2,3,4,5,6].map(n=>(e[n]??1e-4)**(1-.7*t)+t*.35),_i=(e,t)=>l({cycle:7,heights:[t,t+2,t+4]},ut(e)).heights;function vi({seed:t,index:n,kind:r,key:a,harm:o,entropy:s,a:c}){let l=0,u=()=>B(t,`theme`,n,l++),{mode:d}=a,f=e=>[{step:0,degree:e}];if(o<.33){let e=fi[d],t=Math.floor(u()*e.length);return r!==`A`&&c?.mode===d&&c.vamp===t&&(t=(t+1)%e.length),{kind:r,index:n,mode:d,harm:o,vamp:t,bars:mi(e[t],o)}}let p=ui[d],m=r===`B`?u()<.5?5:3:r===`build`?3:0,h=hi((o-.4)*1.6),g=[m];for(let e=1;e<4;e++){if(e===3&&V(u(),o*(1-s*.5)))m=di[d];else if(V(u(),h))m=(m+3)%7,m===6&&d===`ionian`&&o<.85&&(m=4);else{let e=gi(p[m]??{0:1},s);e[m]*=.2,m=St(u(),e)}m===g[e-1]&&(m=(m+3)%7),g.push(m)}let _=g.map(f),v=hi((o-.7)/.3)*.7;for(let t=0;t<4;t++){let n=g[t],r=t<3?g[t+1]:0;if(!V(u(),v))continue;if(t===3&&n===4){_[t]=[{step:0,degree:1},{step:8,degree:4}];continue}let[o,,s]=_i(a,r),c=s-o===6,l=i(o+7,12)===i(e(ut(a),n),12);r!==n&&!c&&!l&&(_[t]=[..._[t],{step:8,dominantOf:r}])}let y=_.map(e=>[...e]);if(V(u(),.25+s*.5)){let e=g[2];y[3]=f(St(u(),gi(p[e]??{0:1},s)))}return{kind:r,index:n,mode:d,harm:o,vamp:null,bars:[..._,...y]}}let yi=`harmony`;function bi(e,t){let n=Array.from({length:t},()=>[]);for(let{step:t,degree:r,stack:i}of[...e].sort((e,t)=>e.step-t.step))n[Math.floor(t/16)].push({step:t%16,degree:r,...i&&{stack:i}});return n}function xi(e){if(e.bars!==8||e.notes.some(e=>e.stack))return null;let t=bi(e.notes,e.bars);if(t.some(e=>e.length!==1||e[0].step!==0))return null;let n=e=>t[e][0].degree,r=n(0),i=n(4);return[1,2,3].some(e=>n(e)!==r)||[5,6,7].some(e=>n(e)!==i)?null:r===i?[r]:[r,i]}let Si=(e,t)=>e!==null&&e.bars===8&&(t<.33||xi(e)===null);function Ci(e,{kind:t,index:n,mode:r,harm:i}){let a=xi(e);if(a){let e=pi(r,a);return{kind:t,index:n,mode:r,harm:i,vamp:e===-1?null:e,bars:mi(a,i)}}return{kind:t,index:n,mode:r,harm:i,vamp:null,bars:bi(e.notes,e.bars)}}function wi(e,t,n,{at:r,draw:i,a,chosen:o=[],rejected:s=[],layer:c,pull:l}){let{miss:u}=Qt(e),d=e.query(H(t),n,c,o,u,l).filter(e=>e.distance<=u&&!s.includes(e.id)).map(t=>({...t,read:e.read(t.id,n.meter,c)})).filter(e=>Si(e.read,r.harm)),f=d[0];if(!f)return;let p=e=>e.score??e.distance,m=p(f)+.25*f.distance+1e-9,h=e=>{let t=xi(e.read),n=t?pi(r.mode,t):-1;return n===-1?1/0:n},g=d.filter(e=>p(e)<=m).map((e,t)=>({id:e.id,place:h(e),rank:t})).sort((e,t)=>e.place-t.place||e.rank-t.rank);if(r.kind!==`A`&&g.length===1&&g[0].id===a)return;let _=Math.floor(i*g.length);return r.kind!==`A`&&g[_].id===a&&(_=(_+1)%g.length),g[_].id}function Ti(e){if(e.length!==8||!e[0]||e.filter(e=>e!==null).length<4)return null;let t=[],n=e[0][0].degree;return e.forEach((e,r)=>{if(!e){t.push({step:r*16,degree:n});return}for(let n of e)t.push({step:r*16+n.step,degree:n.degree});n=e.at(-1).degree}),t}function Ei(e,t){let n=e.filter(e=>e.bar>=t&&e.bar<t+8);return[...new Set(n.map(e=>e.source))].map(e=>({source:e,bars:Array.from({length:8},(r,i)=>n.find(n=>n.source===e&&n.bar===t+i)?.slots??null)}))}let U={kick:36,rim:37,snare:38,clap:39,closedHat:42,pedalHat:44,openHat:46,ride:51},Di=[`drumHit`,`drumVariation`],Oi={kick:0,backbeat:1,ghost:2,hat:3,ride:4,open:5,pedal:6,fill:7,euclid:8},ki=[1,0,0,.7,0,0,.6,0,0,0,.8,.35,0,0,.45,0],Ai=[0,.3,0,.4,0,.2,0,.6,0,.5,0,.3,0,.2,0,.5],ji=e=>Math.max(0,Math.min(1,e)),Mi=(e,t,n)=>e+(t-e)*n,Ni=e=>{let t=ji(e);return t*t*(3-2*t)};function Pi(e){let t=e.heights.length;return Array.from({length:t},(e,t)=>t).filter(e=>t<=3?e>0:e%2==1)}function Fi(e,t=`cycle`){let{seed:n,bar:r,barInSection:i,style:a,barEnergy:s,meter:c}=e,{section:l}=e.plan,{sync:u,artic:f,harm:p,entropy:m}=a,h=Vn(e.swing),g=i===7,_=Ni((s-.05)/.5),v=(t,i,a)=>V(yt(n,Di,Oi[t],l.index,r,i,m,e.restless),a),y=R(c),b=z(c).heights,x=new Set(b),S=ve(c),C=new Set(Pi(c).map(e=>b[e])),w=e=>new Set(b.filter(e).map(e=>e+2)),T=w(e=>C.has(e)),E=w(e=>!C.has(e)),D=un(y),O=Qn(ki,c,t,r),k=Qn(Ai,c,t,r),ee=/* @__PURE__ */ new Map,A=(e,t,n)=>{let r=e*128+t,i=ee.get(r);(!i||sn.indexOf(n)<sn.indexOf(i.role))&&ee.set(r,{part:`drums`,role:n,step:e,note:t,length:1})},j=()=>[...ee.entries()].sort(([e],[t])=>e-t).map(([,e])=>e);if(l.type===`breakdown`){if(s>.2)for(let e of b)A(e+2,h>.5?U.ride:U.closedHat,`hat`);if(g)for(let e=D;e<y;e++)A(e,U.snare,`fill`);return j()}let te=ji((s-.45)*3)*(1-h)*(1-u*.7),M=ji(f*(1-h)*(1-p)*1.3-.25)*_,ne=te,N=Array.from({length:y},(e,t)=>t===0?1:x.has(t)?S[t/2]===`half`&&b.length>=4?.9:ne:0);for(let e=0;e<y;e++){let t=Mi(N[e],O[e],u)*(e===0?1:_)*(1-.55*h);v(`kick`,e,t)&&A(e,U.kick,`kick`),C.has(e)?s>.25&&v(`backbeat`,e,1-.8*h)&&A(e,U.snare,`backbeat`):v(`ghost`,e,k[e]*u*_*.9+h*.12*_)&&A(e,U.snare,`ghost`);let n=e%2==0?ji(.15+s*1.1):ji((s-.55)*2.5)*(1-h);if(h>0&&(x.has(e)&&(n=Math.max(n,h)),T.has(e)&&(n=Math.max(n,h*.95)),E.has(e)&&(n*=1-.7*h)),n*=Math.max(_,h*.8),v(`hat`,e,n)){let t=e%2==0&&!x.has(e)&&v(`open`,e,M)?U.openHat:v(`ride`,e,h)?U.ride:U.closedHat;A(e,t,`hat`)}h>.3&&C.has(e)&&v(`pedal`,e,h)&&A(e,U.pedalHat,`pedal`)}if(v(`euclid`,0,u*_*(1-.7*h)*1.3)){let e=[3,5,7][Math.min(2,Math.floor(s*3))],t=Math.floor(B(n,`drumEuclid`,l.index)*4*u);for(let n of o(d(e,y,t)))A(n,U.rim,`euclid`)}if(g&&(l.type===`build`||v(`fill`,0,.35+.3*u))){let e=l.type===`build`?D:dn(y);for(let t=e;t<y;t++)A(t,U.snare,`fill`)}return j()}function Ii(e,t=cn){return 60*me(t)/(e*R(t))}vn(2);let Li=Array(12).fill(0);function Ri(e,t){return Zr(e,.85,zi(t))}function*zi(e){for(let[t,{slot:n,chord:r}]of e.entries()){let i=((e[t+1]?.slot.step??ln)-n.step)/ln;for(let e of new Set(w(r).map(e=>u(e,12))))yield[e,i]}}let Bi=new Map(st.map(e=>[e,o(N(e))]));function Vi(e,t){let n=0;for(let r of Bi.get(t.mode))n+=e[(r+t.tonic)%12];return n}let Hi=(e,t,n)=>Math.max(t,Math.min(n,e)),Ui=(e,t,n)=>e+(t-e)*n;function Wi(e,t,n){let{type:r}=e.plan.section,i=R(e.meter),a=un(i);if(r===`breakdown`)return t===`fill`?45+(n-a)*9:55;switch(t){case`kick`:return n===0||n===a?112:92;case`backbeat`:return n===z(e.meter).heights[Pi(e.meter).at(-1)]?106:100;case`ghost`:return 32+14*e.style.sync;case`hat`:return Gi(e,n)?78:n%2==0?66:50;case`pedal`:return 58;case`euclid`:case`clave`:return 72;case`fill`:{let e=r===`build`?a:dn(i);return 50+(n-e)*(60/(i-e))}}}let Gi=(e,t)=>z(e.meter).heights.includes(t);function Ki(e,t){let{style:n,barEnergy:r,plan:i}=e,{step:a}=t;switch(t.part){case`drums`:return Wi(e,t.role,a)*(.65+.35*r);case`bass`:return i.section.type===`breakdown`?70:(Gi(e,a)?100:84)*(.75+.25*r);case`stab`:return 70+20*r;case`pad`:{let e=i.section.type===`breakdown`||r<.3?Math.max(.85,1-n.artic):1-n.artic;return 48+30*r*(.5+e/2)}case`lead`:return Gi(e,a)?100:82}}function qi(e,t){let{artic:n}=e.style,{part:r,length:i}=t;switch(r){case`drums`:return i;case`bass`:return e.plan.section.type===`breakdown`?i-.3:Math.max(.3,i*Hi(1.02-.7*n,.3,1));case`pad`:return i;case`stab`:return i*Ui(2.5,.45,n);case`lead`:return Math.max(.3,i*Hi(1.05-.75*n,.25,1))}}let Ji=sn.filter(e=>e!==`clave`),Yi=e=>e.hits.every(e=>!Ji.includes(e.role));function Xi(e,t,n,r,i,a=[],o=[],s){let c=H(t),{hold:l,layer:u}=e.margins??{hold:.02,layer:.1},d=en(e,c,n,r?.rhythmFragment,e=>e===null||!Yi(e),i,a,o,s);if(d===void 0)return{};let f=$t(e.layered(c,n,d,i,u+l,a,s).filter(e=>e.distance<=u+l&&!o.includes(e.id)).filter(t=>{let r=e.read(t.id,n.meter,i);return r!==null&&Yi(r)}),r?.claveFragment,u,l,l);return f===void 0?{rhythmFragment:d}:{rhythmFragment:d,claveFragment:f}}function Zi(e,t,n,r,i,a){return[t.rhythmFragment,t.claveFragment].flatMap(t=>{let o=t===void 0?null:e.read(t,n,a);if(!o)return[];let s=r%o.bars;return o.hits.filter(e=>Math.floor(e.step/i)===s).map(e=>({...e,step:e.step-s*i}))})}let Qi=e=>e.step*128+e.note;function $i(e){let t=/* @__PURE__ */ new Map;for(let n of e){let e=t.get(Qi(n));(!e||sn.indexOf(n.role)<sn.indexOf(e.role))&&t.set(Qi(n),n)}return[...t.values()].sort((e,t)=>e.step-t.step||e.note-t.note)}let ea=(e,t)=>({part:`drums`,role:e,step:t.step,note:t.note,length:1});function ta(e,t,n){if(!n.length)return[...t];let r=R(e.meter),i=n.filter(e=>e.step>=0&&e.step<r),a=(e,t)=>t.velocity-e.velocity||e.step-t.step,o=(t,n)=>Ki(e,n)-Ki(e,t)||t.step-n.step,s=new Set(t.map(e=>e.role)),c=Ji.filter(e=>e!==`fill`&&s.has(e)).flatMap(e=>{let n=t.filter(t=>t.role===e),r=i.filter(t=>t.role===e).sort(a).slice(0,n.length).map(t=>ea(e,t)),s=new Set(r.map(Qi)),c=n.filter(e=>!s.has(Qi(e))).sort(o);return[...r,...c.slice(0,n.length-r.length)]}),l=t.filter(e=>e.role===`fill`),u=i.filter(e=>e.role===`clave`).map(e=>ea(`clave`,e));return $i([...c,...l,...u])}function na(e,t,n){let r=/* @__PURE__ */ new Map;for(let{step:t,note:n}of e)(!r.has(t)||n<r.get(t))&&r.set(t,n);return[...r.entries()].sort(([e],[t])=>e-t).map(([e,r])=>{let a=kt(t,e),o=w(a.chord),s=i(r,12),c=o.findIndex(e=>i(e,12)===s);if(c>=0)return{step:e,chord:0,index:c,alter:0,shift:0};let l=t.find(e=>e.slot.step>a.slot.step)??n[0],u=l&&i(w(l.chord)[0],12);if(u!==void 0){let t=i(s-u+6,12)-6;if(Math.abs(t)<=1)return{step:e,chord:1,index:0,alter:0,shift:t}}return{step:e,chord:0,index:0,alter:0,shift:i(s-o[0]+6,12)-6}})}let ra=e=>e.map(e=>`${e.step}:${e.chord}:${e.index}:${e.alter}:${e.shift}`).join(` `);function ia(e){let t=/* @__PURE__ */ new Map;for(let n of e){if(n.length<2)continue;let e=ra(n),r=t.get(e);r?r.count++:t.set(e,{count:1,first:n})}let n=null;for(let e of t.values())(!n||e.count>n.count)&&(n=e);return n?n.first:null}let aa={plain:0,pentatonic:1/3,blues:2/3};function oa(e){return ct.filter(t=>e.harm>=aa[t])}function sa(e){return oa(e)[0]}function ca(e){return Math.round(6*e.harm)}function la(e,t){return .5*Hn(t)+.3*e.entropy+.2*(1-e.artic)}function ua(e){return{tempo:da(e),keyReach:Math.max(1,ca(e)),melodic:oa(e)}}function da(e){let t=.08333333333333333+e.entropy*.25;return{low:Math.max(-t,Math.log2(En.bpm.min/e.bpm)),high:Math.min(t,Math.log2(En.bpm.max/e.bpm))}}let fa=(e,t,n)=>e*(1-n)+t*n;function pa(e,t,n,r){let{artic:i}=t;switch(e){case`lead`:return{triangle:1.8*(1-i),square:i,cutoff:1400+2200*r,attack:fa(.04,.006,i)};case`bass`:{let e=Vn(n);return{saw:1-e,triangle:1.6*e,cutoff:.6+.6*i,resonance:6-4*e}}case`pad`:case`stab`:return{attack:fa(.3,.01,i),release:fa(.7,.12,i)};case`drums`:return{}}}let ma=e=>Math.max(1,Math.min(127,Math.round(e)));function ha(e){let t=Math.round(e);return t>=1&&t<=127?e:e-t+ma(t)}function ga(e,t,n,...r){return(B(e,t,...r)-.5)*n*24}function _a(e,t,n,...r){return 1-B(e,t,...r)*n*.15}function va(e,t,n,r,i,...a){let o=B(e,`ownAccent`,on.indexOf(t),r,i,...a);return i%2==1?-o*14*n:i%4==2?o*10*n:(o-.5)*2*4*n}let ya={bass:`bassVelocity`,stab:`stabVelocity`,pad:`padVelocity`,lead:`leadVelocity`},ba={bass:`bassLength`,stab:`stabLength`,pad:`padLength`,lead:`leadLength`};function xa(e,t){let{accent:n}=t;return t.part===`lead`?ha(n===void 0?Ki(e,t):91+n):ha(Ki(e,t)+(n??0))}function Sa(e,{part:t,step:n,note:r},i,a){let{seed:o,bar:s}=e;return ma(t===`drums`?i+ga(o,`drumVelocity`,a,s,n,r)+va(o,`drums`,a,s,n,r):i+(ga(o,ya[t],a,s,n)+va(o,t,a,s,n)))}function Ca(e,{part:t,step:n,note:r},i){let{seed:a,bar:o}=e;return t===`drums`?_a(a,`drumLength`,i,o,n,r):_a(a,ba[t],i,o,n)}function wa(e,{part:t,step:n,note:r,role:i},a,o){return{part:t,step:n,note:r,length:o,velocity:a,gain:a/127,...pa(t,e.style,e.swing,e.barEnergy),...i!==void 0&&{role:i}}}function Ta(e,t){let n=la(e.style,e.swing);return{...wa(e,t,Sa(e,t,xa(e,t),n),qi(e,t)*Ca(e,t,n)),...t.accent!==void 0&&{accent:t.accent}}}let W=(e,t,n,r,i)=>({section:e,form:t,means:n,examples:r,doc:i}),Ea={bpm:{times:1,per:60,syntax:W(`rate`,`nbpm`,`n a minute: beats on a meter (a scan’s entries; meter(…)’s beats: 6/8 two, 7/8 three unequal; beat= says another count).`,[`&bar scan(4 4 4 4) step=84bpm`],`time.md`)},hz:{times:1,per:1,syntax:W(`rate`,`nhz`,`n a second (a plain number says the same).`,[`&a loop=440hz`],`time.md`)},min:{times:1,per:60,syntax:W(`rate`,`nmin`,`n a minute (wall-clock time: loop=1min turns once a minute).`,[`&tick scan(1!60) loop=1min`],`time.md`)},h:{times:1,per:3600,syntax:W(`rate`,`nh`,`n an hour.`,[`&hour scan(1!60) loop=1h`],`time.md`)},d:{times:1,per:86400,syntax:W(`rate`,`nd`,`n a day: a day meter, loop=1d (anchor= where it stands when play starts).`,[`&day scan(1!24) loop=1d anchor=11.55`],`time.md`)},wk:{times:1,per:604800,syntax:W(`rate`,`nwk`,`n a week.`,[`&week scan(1!7) loop=1wk`],`time.md`)},k:{times:1e3,per:1,syntax:W(`rate`,`nk`,`n thousand a second: a sample rate.`,[`&out loop=44.1k map=sample &mix`],`mix.md`)}},Da=new RegExp(Object.keys(Ea).sort((e,t)=>t.length-e.length).join(`|`),`y`),Oa=(e,t)=>{let n=t?Ea[t]:void 0;return n?e*n.times/n.per:e},ka={largo:[40,60],larghetto:[60,66],adagio:[66,76],andante:[76,108],moderato:[108,120],allegro:[120,156],vivace:[156,176],presto:[168,200]};`${Object.entries(ka).map(([e,[t,n]])=>`${e} ${t}–${n}`).join(`, `)}`;let Aa=`free(0 2 4 ~ …), a braid left to the performer, is a cell's whole braid: &riff over=&key free(0 2 4 ~), with nothing else as its braid`;function ja(e,t,n){let r=e.i;if(e.match(/free\(/y)===null&&e.fail(`free(…)`),e.skipSpace(),e.peek()===`"`){let t=e.match(/"[^"]*"/y);e.skipSpace(),e.expect(`)`,`')' to close free("…")`);let n={key:`text`,value:0,unit:``,lo:0,hi:0,span:e.place(r),text:t.slice(1,-1)};return e.frees.push(n),n}(/(?:~|\[|-?[0-9.]+[#b]*(?:[@!*][0-9]+)?\s+[^\s,])/y.test(e.text.slice(e.i))||/^-?[0-9.]+[#b]*\)/.test(e.text.slice(e.i)))&&e.fail(Aa,r,e.i-r);let i=e.i,a=t===`shift`||t===`tonic`?e.noteName():null;a!==null&&/[0-9]/.test(e.text.slice(i,e.i))&&e.warn(`free(${e.text.slice(i,e.i)}): a key is a pitch class — the octave is left out: free(${e.text.slice(i,e.i).replace(/-?[0-9]+$/,``)})`,i,e.i-i);let o=a===null?e.match(/[a-z]+/y):null,s,c=``,l,u,d;if(a!==null)s=(a%12+12)%12,[l,u]=[0,11],d=[`C`,`C#`,`D`,`Eb`,`E`,`F`,`F#`,`G`,`Ab`,`A`,`Bb`,`B`];else if(o!==null){let n=ka[o];(!n||t===`shift`||t===`stride`||t===`gain`||t===`tonic`)&&e.fail(`free(${o}): a tempo marking (${Object.keys(ka).join(`, `)}) — for a rate`,r,e.i-r),[l,u]=n,s=Math.round((l+u)/2),c=`bpm`}else{let t=e.match(/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y);t===null&&e.fail(`free(default, lo..hi), like free(90bpm, 60..240) or free(.8, 0..1)`),s=parseFloat(t),n&&(c=e.match(Da)??``),e.skipSpace(),e.expect(`,`,`',' then the range, like free(${t}${c}, 60..240)`),e.skipSpace();let i=e.match(/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y);e.match(/\.\./y)===null&&e.fail(`a range lo..hi, like 60..240`);let a=e.match(/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y);(i===null||a===null)&&e.fail(`a range lo..hi, like 60..240`),l=parseFloat(i),u=parseFloat(a),l<u||e.fail(`free(…): the range runs low to high (${l}..${u})`,r,e.i-r),(s<l||s>u)&&e.fail(`free(…): ${s} is outside ${l}..${u}`,r,e.i-r)}e.skipSpace();let f;if(e.peek()===`,`){e.i++,e.skipSpace();let t=e.match(/"[^"]*"/y);t===null&&e.fail(`names for the choices, in quotes: free(0, 0..3, "a b c d")`),f=t.slice(1,-1).trim().split(/\s+/).filter(Boolean);let n=f.length>1?(u-l)/(f.length-1):0;if(a!==null){let n=e.text.lastIndexOf(`,`,e.i-t.length);e.warn(`free(${e.text.slice(i,n).trim()}, ${t}): a key by name has the twelve pitch names as its choices, so these names are ignored (names of your own go on a range: free(3, 0..11, "…"))`,n,e.i-n),f=void 0}else(!Number.isInteger(l)||!Number.isInteger(u)||f.length<2||!Number.isInteger(n)||n<1)&&e.fail(`free(…, "${f.join(` `)}"): the names spread evenly over ${l}..${u} — ${f.length} names need ${f.length-1} equal whole steps (${l}..${l+f.length-1}, or every 2nd: ${l}..${l+2*(f.length-1)})`,r,e.i-r);e.skipSpace()}e.expect(`)`,`')' to close free(…)`),f??=d;let p={key:t,value:s,unit:c,lo:l,hi:u,span:e.place(r),...f?{labels:f}:{},...a===null?{}:{byName:!0}};return e.frees.push(p),p}let Ma=(e,t)=>(e%t+t)%t,Na=[{name:`Locrian`,intervals:[0,1,3,5,6,8,10]},{name:`Phrygian`,intervals:[0,1,3,5,7,8,10]},{name:`Aeolian`,intervals:[0,2,3,5,7,8,10]},{name:`Dorian`,intervals:[0,2,3,5,7,9,10]},{name:`Mixolydian`,intervals:[0,2,4,5,7,9,10]},{name:`Ionian`,intervals:[0,2,4,5,7,9,11]},{name:`Lydian`,intervals:[0,2,4,6,7,9,11]}],Pa={major:{steps:[2,2,1,2,2,2,1],name:`Ionian`},minor:{steps:[2,1,2,2,1,2,2],name:`Aeolian`},ionian:{steps:[2,2,1,2,2,2,1],name:`Ionian`},dorian:{steps:[2,1,2,2,2,1,2],name:`Dorian`},phrygian:{steps:[1,2,2,2,1,2,2],name:`Phrygian`},lydian:{steps:[2,2,2,1,2,2,1],name:`Lydian`},mixolydian:{steps:[2,2,1,2,2,1,2],name:`Mixolydian`},aeolian:{steps:[2,1,2,2,1,2,2],name:`Aeolian`},locrian:{steps:[1,2,2,1,2,2,2],name:`Locrian`},harmonic:{steps:[2,1,2,2,1,3,1],name:`Harmonic minor`},melodic:{steps:[2,1,2,2,2,2,1],name:`Melodic minor`},pentatonic:{steps:[2,2,3,2,3],name:`Pentatonic`},minorpentatonic:{steps:[3,2,2,3,2],name:`Minor pentatonic`},blues:{steps:[3,2,1,1,3,2],name:`Blues`},wholetone:{steps:[2,2,2,2,2,2],name:`Whole tone`}},Fa={locrian:0,phrygian:1,aeolian:2,minor:2,dorian:3,mixolydian:4,ionian:5,major:5,lydian:6},Ia=e=>Va(Ra(7,12,e),12);function La(e){let t=Na[e]?.name.toLowerCase()??`major`;return t===`ionian`?`major`:t===`aeolian`?`minor`:t}function Ra(e,t,n=0,r){let i=r=>Math.floor((r*t+n)/e);return r===void 0?Array.from({length:e},(e,t)=>i(t)):[i(r)]}let za={"4/4":[0,3.24,6,9.12],"3/4":[0,3.36,7.8]};function Ba(e,t){return[...za[`${e}/${t}`]??Array.from({length:e},(t,n)=>n*12/e)]}function Va(e,t){return e.map((n,r)=>+((r+1<e.length?e[r+1]:e[0]+t)-n).toFixed(6))}function Ha(e){let t=[],n=0;for(let r of e)t.push(+n.toFixed(6)),n+=r;return{positions:t,lap:+n.toFixed(6)}}function Ua(e){let t=/^([A-G])(#|b)?(-?[0-9]+)?$/.exec(e);return t?{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[t[1]]+(t[2]===`#`?1:t[2]===`b`?-1:0)+12*((t[3]===void 0?4:parseInt(t[3],10))-4):null}let Wa=[[`1P 2M 3M 5P 6M`,`major pentatonic`,`pentatonic`],[`1P 2M 3M 4P 5P 6M 7M`,`major`,`ionian`],[`1P 2M 3m 4P 5P 6m 7m`,`minor`,`aeolian`],[`1P 2M 3m 3M 5P 6M`,`major blues`],[`1P 3m 4P 5d 5P 7m`,`minor blues`,`blues`],[`1P 2M 3m 4P 5P 6M 7M`,`melodic minor`],[`1P 2M 3m 4P 5P 6m 7M`,`harmonic minor`],[`1P 2M 3M 4P 5P 6M 7m 7M`,`bebop`],[`1P 2M 3m 4P 5d 6m 6M 7M`,`diminished`,`whole-half diminished`],[`1P 2M 3m 4P 5P 6M 7m`,`dorian`],[`1P 2M 3M 4A 5P 6M 7M`,`lydian`],[`1P 2M 3M 4P 5P 6M 7m`,`mixolydian`,`dominant`],[`1P 2m 3m 4P 5P 6m 7m`,`phrygian`],[`1P 2m 3m 4P 5d 6m 7m`,`locrian`],[`1P 3M 4P 5P 7M`,`ionian pentatonic`],[`1P 3M 4P 5P 7m`,`mixolydian pentatonic`,`indian`],[`1P 2M 4P 5P 6M`,`ritusen`],[`1P 2M 4P 5P 7m`,`egyptian`],[`1P 3M 4P 5d 7m`,`neapolitan major pentatonic`],[`1P 3m 4P 5P 6m`,`vietnamese 1`],[`1P 2m 3m 5P 6m`,`pelog`],[`1P 2m 4P 5P 6m`,`kumoijoshi`],[`1P 2M 3m 5P 6m`,`hirajoshi`],[`1P 2m 4P 5d 7m`,`iwato`],[`1P 2m 4P 5P 7m`,`in-sen`],[`1P 3M 4A 5P 7M`,`lydian pentatonic`,`chinese`],[`1P 3m 4P 6m 7m`,`malkos raga`],[`1P 3m 4P 5d 7m`,`locrian pentatonic`,`minor seven flat five pentatonic`],[`1P 3m 4P 5P 7m`,`minor pentatonic`,`vietnamese 2`],[`1P 3m 4P 5P 6M`,`minor six pentatonic`],[`1P 2M 3m 5P 6M`,`flat three pentatonic`,`kumoi`],[`1P 2M 3M 5P 6m`,`flat six pentatonic`],[`1P 2m 3M 5P 6M`,`scriabin`],[`1P 3M 5d 6m 7m`,`whole tone pentatonic`],[`1P 3M 4A 5A 7M`,`lydian #5p pentatonic`],[`1P 3M 4A 5P 7m`,`lydian dominant pentatonic`],[`1P 3m 4P 5P 7M`,`minor #7m pentatonic`],[`1P 3m 4d 5d 7m`,`super locrian pentatonic`],[`1P 2M 3m 4P 5P 7M`,`minor hexatonic`],[`1P 2A 3M 5P 5A 7M`,`augmented`],[`1P 2M 4P 5P 6M 7m`,`piongio`],[`1P 2m 3M 4A 6M 7m`,`prometheus neapolitan`],[`1P 2M 3M 4A 6M 7m`,`prometheus`],[`1P 2m 3M 5d 6m 7m`,`mystery #1`],[`1P 2m 3M 4P 5A 6M`,`six tone symmetric`],[`1P 2M 3M 4A 5A 6A`,`whole tone`,`messiaen's mode #1`],[`1P 2m 4P 4A 5P 7M`,`messiaen's mode #5`],[`1P 2M 3M 4P 5d 6m 7m`,`locrian major`,`arabian`],[`1P 2m 3M 4A 5P 6m 7M`,`double harmonic lydian`],[`1P 2m 2A 3M 4A 6m 7m`,`altered`,`super locrian`,`diminished whole tone`,`pomeroy`],[`1P 2M 3m 4P 5d 6m 7m`,`locrian #2`,`half-diminished`,`aeolian b5`],[`1P 2M 3M 4P 5P 6m 7m`,`mixolydian b6`,`melodic minor fifth mode`,`hindu`],[`1P 2M 3M 4A 5P 6M 7m`,`lydian dominant`,`lydian b7`,`overtone`],[`1P 2M 3M 4A 5A 6M 7M`,`lydian augmented`],[`1P 2m 3m 4P 5P 6M 7m`,`dorian b2`,`phrygian #6`,`melodic minor second mode`],[`1P 2m 3m 4d 5d 6m 7d`,`ultralocrian`,`superlocrian bb7`,`superlocrian diminished`],[`1P 2m 3m 4P 5d 6M 7m`,`locrian 6`,`locrian natural 6`,`locrian sharp 6`],[`1P 2A 3M 4P 5P 5A 7M`,`augmented heptatonic`],[`1P 2M 3m 4A 5P 6M 7m`,`dorian #4`,`ukrainian dorian`,`romanian minor`,`altered dorian`],[`1P 2M 3m 4A 5P 6M 7M`,`lydian diminished`],[`1P 2M 3M 4A 5A 7m 7M`,`leading whole tone`],[`1P 2M 3M 4A 5P 6m 7m`,`lydian minor`],[`1P 2m 3M 4P 5P 6m 7m`,`phrygian dominant`,`spanish`,`phrygian major`],[`1P 2m 3m 4P 5P 6m 7M`,`balinese`],[`1P 2m 3m 4P 5P 6M 7M`,`neapolitan major`],[`1P 2M 3M 4P 5P 6m 7M`,`harmonic major`],[`1P 2m 3M 4P 5P 6m 7M`,`double harmonic major`,`gypsy`],[`1P 2M 3m 4A 5P 6m 7M`,`hungarian minor`],[`1P 2A 3M 4A 5P 6M 7m`,`hungarian major`],[`1P 2m 3M 4P 5d 6M 7m`,`oriental`],[`1P 2m 3m 3M 4A 5P 7m`,`flamenco`],[`1P 2m 3m 4A 5P 6m 7M`,`todi raga`],[`1P 2m 3M 4P 5d 6m 7M`,`persian`],[`1P 2m 3M 5d 6m 7m 7M`,`enigmatic`],[`1P 2M 3M 4P 5A 6M 7M`,`major augmented`,`major #5`,`ionian augmented`,`ionian #5`],[`1P 2A 3M 4A 5P 6M 7M`,`lydian #9`],[`1P 2m 2M 4P 4A 5P 6m 7M`,`messiaen's mode #4`],[`1P 2m 3M 4P 4A 5P 6m 7M`,`purvi raga`],[`1P 2m 3m 3M 4P 5P 6m 7m`,`spanish heptatonic`],[`1P 2M 3m 3M 4P 5P 6M 7m`,`bebop minor`],[`1P 2M 3M 4P 5P 5A 6M 7M`,`bebop major`],[`1P 2m 3m 4P 5d 5P 6m 7m`,`bebop locrian`],[`1P 2M 3m 4P 5P 6m 7m 7M`,`minor bebop`],[`1P 2M 3M 4P 5d 5P 6M 7M`,`ichikosucho`],[`1P 2M 3m 4P 5P 6m 6M 7M`,`minor six diminished`],[`1P 2m 3m 3M 4A 5P 6M 7m`,`half-whole diminished`,`dominant diminished`,`messiaen's mode #2`],[`1P 3m 3M 4P 5P 6M 7m 7M`,`kafi raga`],[`1P 2M 3M 4P 4A 5A 6A 7M`,`messiaen's mode #6`],[`1P 2M 3m 3M 4P 5d 5P 6M 7m`,`composite blues`],[`1P 2M 3m 3M 4A 5P 6m 7m 7M`,`messiaen's mode #3`],[`1P 2m 2M 3m 4P 4A 5P 6m 6M 7M`,`messiaen's mode #7`],[`1P 2m 2M 3m 3M 4P 5d 5P 6m 6M 7m 7M`,`chromatic`]];function Ga(e){let t=/^([1-7])([PMmAd])$/.exec(e);if(!t)throw Error(`not an interval: ${e}`);let n=Number(t[1]);return[0,2,4,5,7,9,11][n-1]+{P:0,M:0,m:-1,A:1,d:n===1||n===4||n===5?-1:-2}[t[2]]}let Ka=Object.fromEntries(Wa.flatMap(([e,...t])=>{let n=e.split(` `).map(Ga),r=n.map((e,t)=>(n[t+1]??12)-e);return t.map(e=>[e,r])}));function qa(e,t){e.i++;let n=[];for(;e.skipSpace(),e.peek()!==`)`;){let t=e.i;if(e.text.startsWith(`geo(`,e.i)){e.i+=4,e.skipSpace();let r=e.num(`a ratio, like geo(5, 25, 0 10 5)`).value;e.skipSpace(),e.expect(`,`,`',' then the steps per ratio: geo(${r}, 25, 0 10 5)`),e.skipSpace();let i=e.int(`the steps per ratio`);e.skipSpace(),e.expect(`,`,`',' then the exponents: geo(${r}, ${i}, 0 10 5)`);let a=[];for(;e.skipSpace(),e.peek()!==`)`;)a.push(e.num(`an exponent`).value);e.i++,(!(r>0)||i<1||a.length===0)&&e.fail(`geo(r, n, k …): r above 0, n ≥ 1, at least one k`,t,e.i-t);for(let e of a)n.push(+(r**+(e/i)).toFixed(9));continue}if(e.text.startsWith(`free(`,e.i)){let r=ja(e,`interval`,!1);r.lo>0||e.fail(`A scan interval stays positive: give free(…) a range above 0`,t,e.i-t),n.push(r.value)}else{let r=e.match(/[0-9]+(?:\.[0-9]+)?|\.[0-9]+/y);(r===null||!(parseFloat(r)>0))&&e.fail(`scan(…) takes positive intervals, like scan(2 2 1 2 2 2 1)`,t);let i=1;if(e.peek()===`!`){e.i++;let n=e.match(/[0-9]+/y);(n===null||!(parseInt(n,10)>=1))&&e.fail(`x!n repeats an interval n times: scan(1!4 2)`,t,e.i-t),i=parseInt(n,10)}for(let e=0;e<i;e++)n.push(parseFloat(r))}e.skipSpace(),e.peek()===`,`&&e.i++}e.expect(`)`,`')' to close scan(…)`),n.length===0&&e.fail(`scan(…) needs at least one interval`,t,e.i-t);let r=e.span(t);return e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`),{kind:`scan`,steps:n,span:r}}function Ja(e,t){if(e<=0)return Array(t).fill(!1);let n=Array.from({length:e},()=>[!0]),r=Array.from({length:t-e},()=>[!1]);for(;r.length>1;){let e=Math.min(n.length,r.length),t=Array.from({length:e},(e,t)=>[...n[t],...r[t]]),i=n.length>e?n.slice(e):r.slice(e);n=t,r=i}return[...n,...r].flat()}function Ya(e,t){e.i++,e.skipSpace();let n;if(e.peek()===`f`)n=ja(e,`text`,!1).text??``;else{let t=e.match(/"[^"]*"/y);t===null&&e.fail(`spell(text, &table, "names"): the text first — "867 5309" or free("867 5309")`),n=t.slice(1,-1)}e.skipSpace(),e.expect(`,`,`',' then the table, like spell("867", &keys, "1 2 3 …")`),e.skipSpace();let r=e.cellRef(`the table its characters pick from, like &keys`,`in spell(…)`);e.skipSpace(),e.expect(`,`,`',' then the names of the table's entries, in quotes`),e.skipSpace();let i=e.match(/"[^"]*"/y);i===null&&e.fail(`the names of the table’s entries, in quotes: "1 2 3 A 4 5 6 B …"`);let a=i.slice(1,-1).trim().split(/\s+/).filter(Boolean);e.skipSpace(),e.expect(`)`,`')' to close spell(…)`);let o=e.span(t);e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);let s={atom:{kind:`rest`},repeat:1,subdivide:1,elongate:1,span:o},c=[...n].flatMap(e=>{let t=a.indexOf(e);return t<0?[s,s]:[{atom:{kind:`ref`,name:r.name,pick:{kind:`at`,i:t,abs:!0},shift:0},repeat:1,subdivide:1,elongate:1,span:o},s]});return c.length||c.push(s),{kind:`list`,tokens:c,span:o}}let Xa={"2/4":[1,1],"3/4":[1,1,1],"4/4":[1,1,1,1],"5/4":[1,1,1,1,1],"6/8":[3,3],"7/8":[3,2,2],"9/8":[3,3,3],"10/8":[3,2,3,2],"12/8":[3,3,3,3],"5/8":[3,2]};function Za(e,t){let[n,r]=e.split(`/`).map(e=>parseInt(e,10)),i=Xa[e]??[];return{pulses:n,unit:r,beats:e.endsWith(`/8`)?i:i.map(()=>1),sub:t}}function Qa(e,t){if(/^[*+\-.,]+$/.test(e))return e;let n=Xa[e];if(!n)return``;let r=e.endsWith(`/8`),i=``;return n.forEach((e,n)=>{if(r)for(let r=0;r<e;r++){i+=r===0?n===0?`*`:`+`:`.`;for(let e=1;e<t;e++)i+=`,`}else{i+=n===0?`*`:`+`;for(let e=1;e<t;e++)i+=t%2==0&&e===t/2||t===3?`.`:`,`}}),i}function $a(e,t){e.i++,e.skipSpace();let n=t=>{if(e.peek()===`"`)return e.match(/"[^"]*"/y).slice(1,-1);if(e.peek()===`f`){let t=ja(e,`choice`,!1);return t.key===`text`||t.text!==void 0?t.text??``:t.labels?t.labels[Math.round((t.value-t.lo)/((t.hi-t.lo)/Math.max(1,t.labels.length-1)||1))]??``:String(t.value)}let n=e.match(/[0-9]+/y);return n===null&&e.fail(`${t}: in quotes ("4/4"), a number, or free(…)`),n},r=n(`the time signature`);e.skipSpace();let i=1;e.peek()===`,`&&(e.i++,e.skipSpace(),i=Math.max(1,Math.min(8,parseInt(n(`steps a pulse`),10)||1)),e.skipSpace()),e.expect(`)`,`')' to close meter(…)`);let a=e.span(t);e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);let o=Qa(r,i);o||e.fail(`meter("${r}"): a time signature (${Object.keys(Xa).join(` `)}) or levels like "*.+.+.+." (* bar, + beat, . subdivision, , finer)`,t,a.len);let s=e=>Math.max(0,`*+-.,`.indexOf(e)),c=[...o].map(e=>({atom:{kind:`note`,value:s(e),alter:0},repeat:1,subdivide:1,elongate:1,span:a})),l=[...o].filter(e=>e===`*`||e===`+`).length||1;return{kind:`list`,tokens:c,span:a,perBeat:o.length/l,...Xa[r]?{signature:Za(r,i)}:{}}}function eo(e,t,n){e.i++;let r=[];for(;e.skipSpace(),r.push(e.int(`a number in ${t}(…)`)),e.skipSpace(),e.peek()===`,`;)e.i++;e.expect(`)`,`')' to close ${t}(…)`);let i=e.span(n);return e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`),{args:r,span:i}}function to(e,t){let{args:n,span:r}=eo(e,`euclid`,t),[i,a,o=0]=n;(n.length<2||n.length>3||!(a>=1)||!(i>=0&&i<=a))&&e.fail(`euclid(k, n): k hits spread evenly over n steps (0 ≤ k ≤ n), euclid(k, n, shift) turned`,t,r.len);let s=Ja(i,a);return{kind:`list`,tokens:Array.from({length:a},(e,t)=>{let n=((t-o)%a+a)%a;return{atom:s[n]?{kind:`note`,value:0,alter:0}:{kind:`rest`},repeat:1,subdivide:1,elongate:1,span:r}}),span:r}}let no={sin:`a sine`,saw:`a saw`,tri:`a triangle`,square:`a square`},ro=e=>(t,n)=>{let{args:r,span:i}=eo(t,e,n),[a]=r;return(r.length!==1||a<2)&&t.fail(`${e}(n): one cycle of ${no[e]} in n steps, n ≥ 2`,n,i.len),{kind:`wave`,shape:e,n:a,span:i}};function io(e,t){let n=t=>e===`sin`?Math.sin(2*Math.PI*t):e===`saw`?2*t-1:e===`tri`?t<.5?4*t-1:3-4*t:Math.floor(2*t)%2?1:-1;return Array.from({length:t},(e,r)=>+n(r/t).toFixed(6)+0)}let ao={C:0,D:2,E:4,F:5,G:7,A:9,B:11},oo=e=>[`C`,`C#`,`D`,`Eb`,`E`,`F`,`F#`,`G`,`Ab`,`A`,`Bb`,`B`][(e%12+12)%12];function so(e,t){e.i++,e.skipSpace();let n,r=0,i=`0`,a=null,o=null,s=e.match(/-?[0-9]+/y),c=s===null?e.match(/"[^"]*"/y):null;if(c!==null){let a=/^"([A-G](?:#|b)?)([0-9]*)((?::[a-z0-9#'-]+)+)"$/.exec(c);a||e.fail(`scale("tonic:name"): a tonic and a scale's name, as in Strudel — scale("D:minor"), scale("F#:harmonic:minor")`,t,e.i-t),a[2]&&e.fail(`scale("${a[1]}${a[2]}:…"): the octave is the voice's (loop=), not the scale's: scale("${a[1]}${a[3]}")`,t,e.i-t);let o=a[3].slice(1).split(`:`),[s,l]=[o.join(` `),o.join(``)],u=Object.hasOwn(Ka,s)?Ka[s]:Object.hasOwn(Pa,l)?Pa[l].steps:void 0;u||e.fail(`scale("…${a[3]}"): a scale by name — ours (${Object.keys(Pa).join(` `)}) or tonal's, as Strudel reads them (harmonic:minor, minor:pentatonic, whole:tone, diminished, chromatic, bebop … listed in tables.md)`,t,e.i-t),n=[...u];let d=a[1];r=((ao[d[0]]+(d[1]===`#`?1:d[1]===`b`?-1:0))%12+12)%12,i=String(r),e.skipSpace(),e.expect(`)`,`')' to close scale(…)`)}else if(s!==null){e.skipSpace(),e.expect(`,`,`',' then the mode — better by name: scale(minor, A)`),e.skipSpace();let a=e.i,o=e.int(`the mode, 0 (the darkest) to 6`);o>6&&e.fail(`scale(tonic, phase): the phase is a mode, 0 (the darkest, Locrian) to 6 (the brightest, Lydian) — not ${o}`,a,String(o).length),r=parseInt(s,10),i=s,n=Va(Ra(7,12,o),12),e.skipSpace(),e.expect(`)`,`')' to close scale(…)`),e.warn(`scale(${r}, ${o}) is written scale(${La(o)}, ${oo(r)}): the mode by name, then the tonic`,t,e.i-t)}else{let t=e.i;if(e.peek()===`&`)o=e.cellRef(`the cell that holds the mode, like scale(&mode, &tonic)`,`as the mode`),n=Ia(Fa.major);else{let r=e.match(/[a-z]+/y),i=r?Pa[r]:void 0;i||e.fail(`scale(name, tonic): a scale by name — ${Object.keys(Pa).join(` `)}, or a cell holding a mode (&mode)`,t,Math.max(1,(r??``).length)),n=[...i.steps]}if(e.skipSpace(),e.peek()===`,`){e.i++,e.skipSpace();let t=e.i,n=e.match(/[A-G](?:#|b)?(?![A-Za-z0-9])/y);n===null?e.peek()===`&`?(a=e.cellRef(`the cell that holds the tonic, like scale(dorian, &tonic)`,`as the tonic`),i=`&${a.name}`):e.text.startsWith(`free(`,e.i)?(r=Math.round(ja(e,`tonic`,!1).value),i=e.text.slice(t,e.i)):(r=e.int(`the tonic: a note name (D, F#, Bb), a number, a cell (&tonic) or free(…)`),i=String(r),Math.abs(r)>11&&e.warn(`scale(…, ${r}): the tonic is a pitch class, 0 (C) to 11 (B)`,t,e.i-t)):(r=((ao[n[0]]+(n[1]===`#`?1:n[1]===`b`?-1:0))%12+12)%12,i=String(r)),e.skipSpace()}e.expect(`)`,`')' to close scale(…)`)}let l=e.span(t),u=`key:λ${e.line}_${t+e.offset}`;return e.lambdas.push({name:u,span:l,lambda:`shift=${i}`,over:null,shift:r,...a?{tonic:a}:{},off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:{kind:`blank`}}),{steps:n,key:{name:u,pick:null,shift:0,span:l},span:l,...o?{mode:o}:{}}}function co(e,t){e.i++,e.skipSpace();let n=0;if(e.peek()!==`)`){let t=e.i,r=e.noteName();if(n=r===null?e.int(`how many fifths round it starts (fifths(1): on G), or the note it starts on: fifths(G)`):(r%12+12)%12*7%12,r===null&&Math.abs(n)>11){let r=Math.trunc(n/12),i=n%12,a=`C G D A E B F# C# Ab Eb Bb F`.split(` `)[(i+12)%12];e.warn(`fifths(${n}): the circle comes round after 12, and a turn past a lap climbs one, as every shift does: fifths(${i}) ${r>0?`up`:`down`} ${Math.abs(r)} octave${Math.abs(r)===1?``:`s`}${i?` (fifths(${a}) names the note, no octave)`:``}`,t,e.i-t)}e.skipSpace()}e.expect(`)`,`')' to close fifths(…)`);let r=e.span(t);return{braid:{kind:`list`,tokens:Array.from({length:12},(e,t)=>({atom:{kind:`note`,value:t*7%12,alter:0},repeat:1,subdivide:1,elongate:1,span:r})),span:r},shift:n}}let lo=W(`generator`,`sin(n) · saw(n) · tri(n) · square(n)`,`One cycle of a waveform in n steps, from −1 to 1, as Strudel's bipolar signals (sine2, saw2, tri2, square2) at each step: a sine from 0, a saw rising from −1, a triangle rising from −1 to 1 at the half and falling back, a square −1 then 1. A waveform, or a slow swell.`,[`&sine loop=220 sin(12)`,`&ramp loop=220 saw(8)`,`&swell map=lin loop=.25 tri(4)`,`&pulse loop=110 square(2)`],`braid.md`),uo={scan:{parse:qa,syntax:W(`generator`,`scan(i …)`,"Running totals of intervals: a scale or a meter. An interval can repeat (`1!4`), be geometric (`geo(r, n, k …)`: r^(k/n) for each k) or be `free(…)`.",[`&major scan(2 2 1 2 2 2 1)`,`&bar scan(27 23 26 24) step=84bpm`,`&tempo scan(1!4 .5!2)`,`&series scan(geo(5, 25, 0 10 5))`,`&swing scan(free(2, 1..3) 1)`],`braid.md`)},euclid:{parse:to,syntax:W(`generator`,`euclid(k, n) · euclid(k, n, shift)`,`k hits spread as evenly as they go over n steps (the Euclidean rhythms), turned right by shift steps, as Strudel's (k, n, r).`,[`&tresillo euclid(3, 8)`,`&clave euclid(5, 16, 2)`],`braid.md`)},sin:{parse:ro(`sin`),syntax:lo},saw:{parse:ro(`saw`),syntax:lo},tri:{parse:ro(`tri`),syntax:lo},square:{parse:ro(`square`),syntax:lo},scale:{parse:(e,t)=>e.fail(`scale(…) is read by its cell`,t,5),syntax:W(`generator`,`scale(name) · scale(name, tonic) · scale("tonic:name")`,`A scale by name over the 12, turned to its tonic (a note name, a number, a cell holding one, or free(…); C if left out): the scan of its steps over a key of its own. Its name may be a cell holding a diatonic mode (&mode dorian, its phase from the darkest: locrian 0 … lydian 6). Its shift= walks its modes; the tonic transposes. The names: ${Object.keys(Pa).join(` `)}. Strudel's spelling reads the same: scale("D:minor"), its words after colons (scale("F#:harmonic:minor")), with every scale tonal knows (${Object.keys(Ka).length} names: whole:tone, diminished, bebop:major, chromatic …); the octave is the voice's, not the scale's.`,[`&scale scale(minor, D)`,`&blues scale(blues)`,`&scale scale(dorian, free(2, 0..11))`,`&key scale(dorian, &tonic)`,`&key scale(&mode, &tonic)`,`&scale scale("F#:harmonic:minor")`],`tables.md`)},fifths:{parse:(e,t)=>e.fail(`fifths(…) is read by its cell`,t,6),syntax:W(`generator`,`fifths() · fifths(n) · fifths(note)`,`The circle of fifths: the twelve pitch classes a fifth apart, C G D A E B F# C# Ab Eb Bb F, as written from C; turned n fifths round, or to start on a note (its shift=: [0] is where it starts, [$0] is C). Drawn round its wheel in its own order.`,[`&circle fifths()`,`&circleG fifths(1)`,`&circleG fifths(G)`],`tables.md`)},meter:{parse:$a,syntax:W(`generator`,`meter("sig") · meter("sig", sub) · meter("levels")`,`A bar as levels, one per step: 0 the downbeat, 1 a beat, then finer. A time signature (${Object.keys(Xa).join(` `)}) with sub steps a pulse, or levels written out (* bar, + beat, - half, . subdivision, , finer). Its bpm counts beats. Each argument can be free(…).`,[`&bar meter("4/4", 2) step=100bpm`,`&bar meter("6/8") step=60bpm`,`&bar meter("*.+.+..") step=90bpm`],`time.md`)},spell:{parse:Ya,syntax:W(`generator`,`spell("text", &table, "names")`,`A text spelled through a table: each character that is one of the names plays that entry of the table, then a pause; anything else rests as long. The text can be free("…"), a field to type in.`,[`&dial spell("867 5309", &keys, "1 2 3 A 4 5 6 B 7 8 9 C * 0 # D")`,`&dial spell(free("867 5309"), &keys, "1 2 3 A 4 5 6 B 7 8 9 C * 0 # D")`],`braid.md`)}};function fo(e,t,n){let r=new Set(Ra(e,t,n).map(e=>(e%t+t)%t)),i=Ja(e,t);for(let n=0;n<t;n++)if(i.every((e,a)=>i[((a-n)%t+t)%t]===r.has(a)))return`euclid(${e}, ${t}${n?`, ${n}`:``})`;return Array.from({length:t},(e,t)=>r.has(t)?`0`:`~`).join(` `)}let po={even:(e,t)=>{let{args:n,span:r}=eo(e,`even`,t),[i,a=12,o=0]=n,s=i>=1&&a>=i?Va(Ra(i,a,o),a):null;return e.fail(s?`even(…) is gone: for a scale write scan(${s.join(` `)}); for a rhythm, ${fo(i,a,o)}`:`even(…) is gone: write the intervals, scan(2 2 1 2 2 2 1), or a rhythm, euclid(3, 8)`,t,r.len)},agogic:(e,t)=>{let{args:n,span:r}=eo(e,`agogic`,t),[i,a]=n,o=Ba(i,a).map(e=>Math.round(e/12*100));return e.fail(`agogic(…) is gone: write the beats as a scan, scan(${Va(o,100).join(` `)})`,t,r.len)}},mo=e=>e in uo||e in po;function ho(e,t,n){return(uo[t]?.parse??po[t])(e,n)}let go={kick:`bd`,rim:`rim`,snare:`sd`,clap:`cp`,closedHat:`hh`,pedalHat:`ph`,openHat:`oh`,ride:`rd`},_o=new Map([...Object.keys(go).map(e=>[U[e],go[e]]),[75,`claves`]]);function vo(e){if(e>=127)return`1`;let t=e/127;return(t*t).toFixed(6).replace(/0+$/,``).replace(/^0/,``)}function yo(e,t=ln){let n=e.length;if(n===0||n>=t)return null;let r=[...e].sort((e,t)=>e-t).join(),i=Ja(n,t).flatMap((e,t)=>e?[t]:[]);for(let e=0;e<t;e++)if(i.map(n=>(n+e)%t).sort((e,t)=>e-t).join()===r)return{k:n,r:e};return null}let bo=e=>[...e].sort((e,t)=>e.step-t.step||e.note-t.note),xo=e=>e>=127?``:`:0:${vo(e)}`,So=(e,t)=>Array.from({length:e},(e,n)=>t(n)).join(` `);function Co(e,t){let{role:n}=e[0],r=new Set(e.map(e=>e.note)),i=n===`euclid`&&r.size===1?yo(e.map(e=>e.step),t):null;if(i){let r=_o.get(e[0].note),a=t=>e.find(e=>e.step===t)?.velocity;return{lines:[`&${n} step=1m &${r}(${i.k},${t},${i.r})`,`&${n}Level map=amp step=16n ${So(t,e=>a(e)?vo(a(e)):`0`)}`],term:`&${n} * &${n}Level`}}return{lines:[`&${n} step=16n ${So(t,t=>{let n=e.filter(e=>e.step===t).map(e=>`&${_o.get(e.note)}${xo(e.velocity)}`);return n.length===0?`~`:n.length===1?n[0]:`[${n.join(`,`)}]`})}`],term:`&${n}`}}function wo(e,t){let n=bo(e),r=n.find(e=>!_o.has(e.note));if(r)throw Error(`grooveText: note ${r.note} is none of the kit's`);let i=sn.filter(e=>n.some(t=>t.role===e)).map(e=>Co(n.filter(t=>t.role===e),t));return[...i.flatMap(e=>e.lines),`&groove ${i.length?`[${i.map(e=>e.term).join(`, `)}]`:`~`}`].join(`
`)}let To=e=>bo(e).map(e=>`${e.role}:${e.note}:${e.step}`).join(` `);function Eo(e){let t=/* @__PURE__ */ new Map;for(let n of e){if(n.length<3)continue;let e=To(n),r=t.get(e);r?r.count++:t.set(e,{count:1,first:n})}let n=null;for(let e of t.values())(!n||e.count>n.count)&&(n=e);return n?bo(n.first):null}function Do(e,t,n){if(!_o.has(e))return null;if(e===U.kick)return`kick`;if(e===U.rim)return`euclid`;if(e===U.pedalHat)return`pedal`;if(e!==U.snare&&e!==U.clap)return`hat`;let r=z(n).heights;return Pi(n).map(e=>r[e]).includes(t)?`backbeat`:`ghost`}let Oo=[];function ko(e,t,n=.5){let r=[...e.map(e=>e.id)];for(let e of t)r.includes(e)||r.push(e);let i=Zr(r.map(t=>e.find(e=>e.id===t)?.weight??0),n,t.map(e=>[r.indexOf(e),1]));return r.map((e,t)=>({id:e,weight:i[t]})).filter(e=>e.weight>=.25)}let Ao=e=>e.map(e=>e.id);function jo({seed:e,index:t,style:n,history:r},i){let a=ca(n);if(a===0||!V(B(e,`keyJump`,t),n.entropy*.6))return null;let o=ee(i.tonic),s=[...Array(12).keys()].filter(e=>{let t=Math.abs(u(ee(e)-o+6,12)-6);return t>0&&t<=a}).map(e=>({tonic:e,mode:i.mode})),c=s.map(e=>Vi(r,e));return s[St(B(e,`keyJump`,t,1),Qr(c,4))]}function Mo({meter:e,swing:t=`16n`,repository:n,style:r,layer:i},a,o){if(e)return{meter:{meter:e,swing:t},found:null};let s=n?zt(n,r,a?.meterFragment??null,i,o,Vt(r.entropy)):null;if(s)return{meter:{meter:s.meter,swing:s.swing.level,share:s.swing.share,meterFragment:s.id},found:s};if(n&&a){let{meter:e,swing:t,share:n,meterFragment:r}=a;return{meter:{meter:e,swing:t,...n===void 0?{}:{share:n},...r===void 0?{}:{meterFragment:r}},found:null}}return{meter:{meter:cn,swing:t},found:null}}function No({repository:e,style:t},n,r){return r&&e?.used?e.used(n,r.id,H(t)):n}function Po({rhythms:e,style:t,layer:n},r,i,a=[],o=[]){return e?Xi(e,t,{meter:r.meter,meterFragment:r.meterFragment},i,n,a,o,Vt(t.entropy)):{}}let Fo=({seed:e,index:t,session:n},r,i=`groove`)=>({seed:e,index:t,point:r,tags:[i,...n===void 0?[]:[n]]}),Io=`bass line`;function Lo(e,t,n,r,i){let a=nn(e.rhythms,`rhythm`,`grooveVariation`,Fo(e,H(e.style)),t,n,r.rhythmFragment,i);return{rhythm:a.id===r.rhythmFragment?r:{...r,rhythmFragment:a.id},layer:a.layer,playing:a.playing}}function Ro(e,t,n,r){return rn(e.rhythms,e.heard??[],e=>{let t=Eo(e);return t&&{hits:t}},{meter:n.meter,meterFragment:n.meterFragment},Fo({...e,index:e.index-1},r),t)}function zo(e,t,n,r){return rn(e.bassLines,e.bassHeard??[],e=>{let t=ia(e);return t&&{notes:t}},{meter:n.meter,meterFragment:n.meterFragment},Fo({...e,index:e.index-1},r,Io),t)}function Bo(e,t,n,r,i){return n!==null&&e?.used?e.used(t,[n],i,r):t}let Vo=`lead line`;function Ho(e,t,n,r){return rn(e.leads,e.leadHeard??[],e=>{let t=ci(e)?.filter(e=>e.step<R(n.meter));return t?.length?{notes:t}:null},{meter:n.meter,meterFragment:n.meterFragment},Fo({...e,index:e.index-1},r,Vo),t)}function Uo({leads:e,style:t,layer:n},r,i,a=[],o=[]){return e?Jr(e,t,{meter:r.meter,meterFragment:r.meterFragment},i,n,a,o,Vt(t.entropy)):void 0}let Wo=`progression`;function Go(e,t,n){return rn(e.harmonies,e.harmonyHeard??[],e=>{let t=Ti(e);return t&&{notes:t}},n.bench,Fo({...e,index:e.index-2},n.point,Wo),t)}function Ko({harmonies:e,style:t,layer:n,seed:r,index:i},a,o,s,c,l,u=[]){let d={kind:a,index:i,mode:o.mode,harm:t.harm},f=a===`A`?l.B:a===`B`?l.A:null,p=e?wi(e,t,s,{at:d,draw:B(r,`theme`,i,0),a:l.A??void 0,chosen:f===null?[]:[f],rejected:u,layer:n,pull:Vt(t.entropy)}):void 0,m=p===void 0?null:e.read(p,s.meter,n);return p!==void 0&&m?{theme:Ci(m,d),fragment:p}:{theme:vi({seed:r,index:i,kind:a,key:o,harm:t.harm,entropy:t.entropy,a:c.A}),fragment:null}}function qo({bassLines:e,style:t,layer:n,share:r},i,a,o=[],s=[]){return e?Yn(e,t,{meter:i.meter,meterFragment:i.meterFragment},{level:i.swing,share:i.share??r??.5},R(i.meter),a,n,o,s,Vt(t.entropy)):void 0}let Jo={initial:{before:null,themes:{A:null,B:null},layer:null,shortTerm:Oo,asked:null,boredom:Bt,claveOwners:Wt,bassFragment:null,leadFragment:null,themeFragments:{A:null,B:null},earlier:null},advance(e,{before:t,themes:n,layer:r,shortTerm:i,asked:a,boredom:o,claveOwners:s,bassFragment:c,leadFragment:l,themeFragments:u,earlier:d}){let f=r??e.layer,p=f&&t&&a?Ro(e,f,t,a):{layer:f,ids:[]},m=p.layer&&t&&a?zo(e,p.layer,t,a):{layer:p.layer,ids:[]},h=m.layer&&t&&a?Ho(e,m.layer,t,a):{layer:m.layer,ids:[]},g=(h.layer&&d?Go(e,h.layer,d):{layer:h.layer,ids:[]}).layer,_=ko(i,[...p.ids,...m.ids,...h.ids]),v=Ao(_),y={...e,layer:g},{seed:b,index:x,style:S,wish:C}=y,w=Ft.advance({seed:b,index:x,style:S},t?.section??null,null).output,T=t?.key??lt,E=pt(T,(t&&C.tonic===null&&C.mode===T.mode?jo(y,T):null)??C),D=C.melodic!==null&&ua(S).melodic.includes(C.melodic)?C.melodic:sa(S),O=Mo(y,t,v),{meterFragment:k}=O.meter,ee={meter:O.meter.meter,meterFragment:k},A=Kt(o,s),j=li(w.type),te=j===`build`?null:n[j],M=j===`build`?null:u[j],ne=te&&te.mode===E.mode&&Math.abs(te.harm-S.harm)<=.2&&!V(B(b,`themeRenewal`,x),S.entropy*.3)&&(M===null||!A.includes(M))?{theme:te,fragment:M}:Ko(y,j,E,ee,n,u,A),{theme:N}=ne,re=g?nn(y.harmonies,yi,`harmonyVariation`,Fo(y,H(S),Wo),g,o,ne.fragment??void 0,ee):{playing:null},P=Po(y,O.meter,t,[...v,...k===void 0?[]:[k]],Kt(o,s)),ie=g?Lo(y,g,o,P,{meter:O.meter.meter,meterFragment:k}):{rhythm:P,layer:g,playing:null},{rhythm:F}=ie,ae=qo(y,O.meter,c??void 0,[...v,...k===void 0?[]:[k]],Kt(o,s)),oe=ie.layer?nn(y.bassLines,qn,`lineVariation`,Fo(y,H(S),Io),ie.layer,o,ae,{meter:O.meter.meter,meterFragment:k}):{id:ae,layer:ie.layer,playing:null},se=oe.id,ce=Uo(y,O.meter,l??void 0,[...v,...k===void 0?[]:[k]],Kt(o,s)),I=oe.layer?nn(y.leads,qr,`leadLineVariation`,Fo(y,H(S),Vo),oe.layer,o,ce,{meter:O.meter.meter,meterFragment:k}):{id:ce,layer:oe.layer,playing:null},le=I.id,ue={section:w,key:E,...O.meter,...F,melodic:D,theme:N},de=[k,F.rhythmFragment,F.claveFragment,se,le].filter(e=>e!==void 0);return{carried:{before:ue,themes:j===`build`?n:{...n,[j]:N},layer:I.layer?Bo(y.harmonies,an(y.leads,an(y.bassLines,an(y.rhythms,No(y,I.layer,O.found),[F.rhythmFragment,F.claveFragment],H(S),k),[se],H(S),k),[le],H(S),k),ne.fragment,[...k===void 0?[]:[k],...(j===`A`?u.B:j===`B`?u.A:null)??[]].filter(e=>e!==ne.fragment),H(S)):null,shortTerm:ko(_,de,1),asked:H(S),boredom:Xt(o,[ie.playing,oe.playing,I.playing,re.playing].filter(e=>e!==null),S.entropy),claveOwners:ie.playing?Gt(s,P):s,bassFragment:se??null,leadFragment:le??null,themeFragments:j===`build`?u:{...u,[j]:ne.fragment},earlier:a&&t?{point:a,bench:{meter:t.meter,...t.meterFragment===void 0?{}:{meterFragment:t.meterFragment}}}:null},output:ue}}},Yo={own:[],players:[]},Xo={plans:Jo.initial,next:null,history:Li,parts:{bass:mr.initial,comp:wr.initial,lead:Kr.initial},ear:null};function Zo({seed:e,style:t,wish:n,meter:r,swing:i=zn,repository:a,layer:o,rhythms:s,session:c,bassLines:l,leads:u,harmonies:d},f,p,m,h=null){let g=f%8,_=g===0?Jo.advance({seed:e,index:f/8,style:t,wish:n,history:m,meter:r,swing:i.level,repository:a,layer:o,rhythms:s,heard:h&&h.section===f/8-1?ts(h.drums,`drummer`):[],session:c,share:i.share,bassLines:l,bassHeard:h&&h.section===f/8-1?ts(h.bass,`bassist`):[],leads:u,leadHeard:h&&h.section===f/8-1&&h.lead.players.length?ts({...h.lead,own:es(h.leadBars)},`soloist`):[],harmonies:d,harmonyHeard:h&&f>=16?Ei(h.harmony,f-16):[]},p,null).carried:p,v=_.before,{key:y,theme:b}=v,x=Et({seed:e,barInSection:g,key:y,theme:b,harm:t.harm});return{plans:_,decided:{bar:f,plan:v,chords:x},history:Ri(m,x)}}let Qo=({swing:e=zn},t)=>({level:t.swing,share:t.share??e.share});function $o(e,t,n){let r=e.bar%8;return{seed:e.seed,bar:e.bar,meter:t.plan.meter,plan:t.plan,barInSection:r,style:e.style,swing:Qo(e,t.plan),barEnergy:Lt(e.style.energy,t.plan.section.type,r),chords:t.chords,next:n,offer:e.offer,...e.restless===void 0?{}:{restless:e.restless}}}let es=e=>e.map(e=>oi(Gr(e),e.plan.key)).filter(e=>e.length>0),ts=(e,t)=>[...e.own.length?[{source:t,bars:e.own}]:[],...e.players];function ns(e,t,n){let r=[...e.players],i=r.findIndex(e=>e.source===t);return i===-1?r.push({source:t,bars:[n]}):r[i]={source:t,bars:[...r[i].bars,n]},{...e,players:r}}function rs(e,t,n,r){if(!e.rhythms&&!e.bassLines&&!e.leads&&!e.harmonies||n.layer===null)return null;let i=Math.floor(t.bar/8),a=r?.section===i?r:{section:i,drums:Yo,bass:Yo,lead:Yo,unheard:null,leadBars:[],harmony:(r?.harmony??[]).filter(e=>Math.floor(e.bar/8)>=i-1)};if(a.unheard){let e={...a.unheard,next:t.chords},n=fr(e,mr.initial).output,r=na(n,Ot(e.chords,e.meter),Ot(e.next,e.meter));a={...a,bass:{...a.bass,own:[...a.bass.own,r]},unheard:null}}if(e.rhythms&&t.plan.rhythmFragment===void 0){let n=$o(e,t,[]),r=Fi(n).map(e=>({role:e.role,note:e.note,step:e.step,velocity:Ta(n,e).velocity}));a={...a,drums:{...a.drums,own:[...a.drums.own,r]}}}e.bassLines&&n.bassFragment===null&&(a={...a,unheard:$o(e,t,[])}),e.leads&&n.leadFragment===null&&(a={...a,leadBars:[...a.leadBars,$o(e,t,[])]});for(let{source:t,bar:n,hits:r}of e.drumsHeard??[])Math.floor(n/8)===i&&(a={...a,drums:ns(a.drums,t,r)});for(let{source:t,bar:n,notes:r}of e.bassHeard??[])Math.floor(n/8)===i&&(a={...a,bass:ns(a.bass,t,r)});for(let{source:t,bar:n,notes:r}of e.leadHeard??[])Math.floor(n/8)===i&&(a={...a,lead:ns(a.lead,t,r)});if(e.harmonies){let t=(e.harmonyHeard??[]).filter(e=>Math.floor(e.bar/8)>=i-1);t.length&&(a={...a,harmony:[...a.harmony,...t]})}return a}let is=e=>({...e,style:An(e.style)});function as(e,t){let{plans:n,history:r}=t,i=t.next;if(!i){if(e.bar!==0)throw Error(`band: bar ${e.bar}, but the song starts at bar 0`);({plans:n,decided:i,history:r}=Zo(e,0,n,r))}else if(i.bar!==e.bar)throw Error(`band: bar ${e.bar}, but the band decided bar ${i.bar} next`);let a=rs(e,i,n,t.ear),o=Zo(e,e.bar+1,n,r,a);return{here:i,at:n,carried:{...t,plans:o.plans,next:o.decided,history:o.history,ear:a}}}let os={initial:Xo,advance(e,t){let n=is(e),{here:r,at:i,carried:a}=as(n,t),o=$o(n,r,a.next.chords),{barInSection:s}=o,c=n.bassLines?Xn(n.bassLines,i.bassFragment??void 0,o.meter,s,R(o.meter),a.plans.layer??void 0):[],l=fr(o,t.parts.bass,c),u=wr.advance(o,t.parts.comp,null),d=n.leads?Xr(n.leads,i.leadFragment??void 0,o.meter,R(o.meter),a.plans.layer??void 0):null,f=Wr(o,t.parts.lead,d,i.leadFragment??void 0),p={bass:l.carried,comp:u.carried,lead:f.carried},m=n.rhythms?Zi(n.rhythms,r.plan,o.meter,s,R(o.meter),a.plans.layer??void 0):[],h=[...ta(o,Fi(o),m),...l.output,...u.output,...f.output];return{carried:{...a,parts:p},output:ss(o,h)}}};function ss(e,t){return{...e,written:t,dough:t.map(t=>Ta(e,t))}}function G(e){return e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>G(e.atom))):[e]}function cs(e){return e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>[e,...cs(e.atom)])):[]}function ls(e,t){return e.kind===`seq`?{...e,layers:e.layers.map(e=>e.map(e=>({...e,atom:ls(e.atom,t)})))}:t(e)}function us(e,t){let n=e.atom,r=n.kind===`seq`?n.layers.reduce((e,n)=>e+n.reduce((e,n)=>e+us(n,t),0),0)*(n.euclid?.k??1):t(n);return e.repeat*e.subdivide*r}let ds=1e-9,fs=e=>Math.floor(e+ds),ps=(e,t)=>(e%t+t)%t,ms=(e,t)=>t===0?e:ms(t,e%t),hs=(e,t)=>e/ms(e,t)*t;function gs(e,t){let[n,r,i,a]=[ps(e,t),t,1,0];for(;r!==0;){let e=Math.floor(n/r);[n,r,i,a]=[r,n-e*r,a,i-e*a]}return ps(i,t)}let _s=e=>e.reduce((e,t)=>e+t.elongate*t.repeat,0);function vs(e){if(e.kind!==`seq`)return 1;let t=t=>t.reduce((e,t)=>hs(e,vs(t.atom)),1)*(e.mode===`alt`?_s(t):1);return e.layers.reduce((e,n)=>hs(e,t(n)),1)*(e.slow??1)}let ys=(e,t,n)=>[{atom:e,at:t,dur:n,of:1,is:0,chances:[],picks:[]}];function bs(e,t,n,r){return e.map(e=>{let i=t*(e.is+(e.at-n)/r),a=fs(i),o=e.of*t;return{...e,at:n+Math.max(0,i-a)*r,dur:e.dur*t,of:o,is:ps(a,o),picks:e.picks.map(i=>{let o=t*(e.is+i.lap+(i.at-n)/r)-a,s=fs(o);return{...i,lap:s,at:n+Math.max(0,o-s)*r}})}})}function xs(e,t,n,r){let i=[];for(let a of t.hits){let o=a/t.n;for(let a of e){let e=(a.at-n)/r,s=a.dur/r;for(let c=0;c<e+s;c++)e<=c+o+ds&&c+o<e+s-ds&&i.push({...a,at:n+o*r,dur:r/t.n,is:ps(a.is+c,a.of),picks:a.picks.map(e=>({...e,lap:e.lap-c}))})}}return i}function Ss(e,t,n,r,i,a){if(e.kind!==`seq`)return a(e,t,n).map(e=>({...e,chances:[...i.chances,...e.chances],...Cs(i.level,e.level)}));let o=e.layers.flatMap((o,s)=>{let c=_s(o),l=[],u=0;return o.forEach((e,o)=>{l.push(...ws(e,t+u*n/c,e.elongate*n/c,`${r}/${s}.${o}`,i,a)),u+=e.elongate*e.repeat}),e.mode===`alt`?bs(l,c,t,n):e.mode===`choose`?l.map(n=>({...n,picks:[...n.picks,{id:r,of:e.layers.length,is:s,lap:0,at:t}]})):l});return e.euclid&&(o=xs(o,e.euclid,t,n)),e.slow&&e.slow>1&&(o=bs(o,e.slow,t,n)),o}let Cs=(e,t)=>{let n=t===void 0?e:e===void 0?t:t*e;return n===void 0?{}:{level:n}};function ws(e,t,n,r,i,a){let o={chances:e.chance===void 0?i.chances:[...i.chances,e.chance],level:e.level===void 0?i.level:e.level*(i.level??1)},s=e.subdivide,c=n/s,l=[];for(let i=0;i<e.repeat;i++)for(let u=0;u<s;u++){let d=t+i*n+u*c;for(let t of Ss(e.atom,d,c,r,o,a)){if(s===1||t.of===1&&!t.picks.length){l.push(t);continue}let e=ms(s,t.of);if(ps(t.is-u,e)!==0)continue;let n=t.of/e,r=n===1?0:ps((t.is-u)/e*gs(s/e,n),n);l.push({...t,of:n,is:r,picks:t.picks.map(e=>{let t=u+e.lap;return{...e,lap:Math.floor(t/s),at:e.at+(ps(t,s)-u)*c}})})}}return l}function Ts(e,t){if(e.kind!==`seq`)return t(e);if(!e.bare)return 1;let n=e.layers[0][0];return Ts(n.atom,t)*n.elongate}function Es(e,t,n,r=``){let i=[],a=0;return e.forEach((e,o)=>{let s=Ts(e.atom,t)*e.elongate;for(let t of ws(e,a,s,`${r}${o}`,{chances:[],level:void 0},n))i.push({atom:t.atom,at:t.at,dur:t.dur,chances:t.chances,top:o,...t.level===void 0?{}:{level:t.level},...t.of>1?{laps:{of:t.of,is:t.is}}:{},...t.picks.length?{chosen:t.picks}:{}});a+=s*e.repeat}),i}let Ds=(e,t)=>Es(e,t,ys),Os=[`over`,`shift`,`step`,`map`,`stride`,`cycle`,`env`,`pitch`,`show`,`chance`,`seed`,`size`],ks=e=>e.flatMap(e=>e.repeat>1?Array.from({length:e.repeat},()=>({...e,repeat:1})):[e]);function As(e,t){let n=t.transpose??0,r=t.degree??0;if(!n&&!r)return e;let i=n+r;switch(e.kind){case`seq`:return ls(e,e=>As(e,t));case`note`:return{...e,value:e.value+i};case`chord`:return{...e,notes:e.notes.map(e=>e+i)};case`choice`:return{...e,values:e.values.map(e=>e+i)};case`ref`:return n?{...e,transpose:(e.transpose??0)+n}:{...e,values:{mul:e.values?.mul??1,add:(e.values?.add??0)+r*(e.values?.mul??1)}};default:return e}}function js(e){if(!e.cells.some(e=>e.base||Ns(e)||Ms(e)))return e;let t=new Map(e.cells.map(e=>[e.name,e])),n=[...e.diagnostics],r=/* @__PURE__ */ new Map,i=/* @__PURE__ */ new Set,a=(e,t)=>n.push({severity:`error`,message:t,span:e.base?.span??e.span}),o=e=>{let s=r.get(e.name);if(s)return s;let c=e;if(e.base){let n=t.get(e.base.name);n?i.has(e.name)?a(e,`base=&${e.base.name} comes round to &${e.name} itself`):(i.add(e.name),c=Ps(e,o(n),e.base,t=>a(e,t)),i.delete(e.name)):c=e}else Ns(e)&&n.push({severity:`error`,message:`= keeps a step of the base: only in a cell with base= (&${e.name} base=&other = 4 =)`,span:e.span});return Ms(e)&&n.push({severity:`error`,message:`= keeps a whole step of the base, not part of one: write it outside brackets (&${e.name} base=&other = [0 2])`,span:e.span}),r.set(e.name,c),c};return{...e,cells:e.cells.map(o),diagnostics:n}}let Ms=e=>e.braid.kind===`list`&&e.braid.tokens.some(e=>cs(e.atom).some(e=>e.atom.kind===`rest`&&e.atom.keep)),Ns=e=>e.braid.kind===`list`&&e.braid.tokens.some(e=>e.atom.kind===`rest`&&e.atom.keep);function Ps(e,t,n,r){let i={};for(let n of Os)e[n]==null&&t[n]!=null&&(i[n]=t[n]);let a={...t.params,...e.params},o={...t.paramSpans,...e.paramSpans},s=t.paramCells||e.paramCells?{...t.paramCells,...e.paramCells}:void 0,c=t.paramClocks||e.paramClocks?{...t.paramClocks,...e.paramClocks}:void 0;n.transpose&&(e.over??t.over)&&r(`base=&${n.name}^$${n.transpose}: a cell that reads a table moves by its degrees (^n), not yet by grid steps`);let l=e.braid;if(t.braid.kind===`list`){let i=ks(t.braid.tokens),a=e.braid.kind===`list`?ks(e.braid.tokens):[],o=[];for(let e=0;e<Math.max(i.length,a.length);e++){let s=i[e],c=a[e];if(!(!c||c.atom.kind===`rest`&&c.atom.keep)){o.push(c);continue}if(!s){r(`= past the end of &${t.name} (${i.length} steps): nothing to keep`);continue}let l=As(s.atom,n);o.push(c&&c.elongate!==1?{...s,atom:l,elongate:c.elongate}:{...s,atom:l})}l={kind:`list`,tokens:o}}else e.braid.kind===`blank`?l=t.braid:Ns(e)&&r(`&${t.name} is a ${t.braid.kind}(…), not a braid: = keeps steps of a braid`);return{...e,...i,params:a,paramSpans:o,...s?{paramCells:s}:{},...c?{paramClocks:c}:{},braid:l}}let Fs=e=>{if(!e)return``;let t=e.abs?`$`:``;return e.kind===`at`?`[${t}${e.i}]`:`[${t}${e.from??``}:${e.to??``}${e.step?`:${e.step}`:``}]`},Is=e=>e===0?``:`[${e<0?`<<`:`>>`}${Math.abs(e)===1?``:Math.abs(e)}]`,Ls=e=>(e.slot?`[${e.slot}]`:Fs(e.pick)||Is(e.shift))+(e.degree?`^${e.degree}`:``)+(e.transpose?`^$${e.transpose}`:``),Rs=e=>!!(e.label||e.title)&&e.braid.kind===`blank`&&e.over===null&&e.step===null&&e.map===null&&e.cycle===null&&e.shift===null&&e.stride===null&&!e.off&&!e.frees?.length&&!e.env&&!e.pitch&&Object.keys(e.params).length===0,zs=/^(`{3,})([^`]*)$/;function Bs(e,t){let n=[],r=[],i=[],a=[],o=t;for(;o<e.length;){let t=e[o],s=zs.exec(t),c=s?e.findIndex((e,t)=>t>o&&/^`{3,}\s*$/.test(e)&&e.trim().length>=s[1].length):-1;if(s&&s[2].trim()===`cells`){if(c<0)return{problems:[{line:o+1,message:"the ```cells block is never closed (a line ```)"}]};a.push(t),r.push(a),a=[];let s=e.slice(o+1,c);s.forEach((e,t)=>i.push({block:n.length,line:o+2+t})),n.push(s),a.push(e[c]),o=c+1}else if(s){let t=c<0?e.length-1:c;a.push(...e.slice(o,t+1)),o=t+1}else a.push(t),o++}if(!n.length)return{problems:[{line:Math.max(t,1),message:"no ```cells block after the frontmatter"}]};let s=a.slice(1);r.push(a.slice(0,1));let c=s.join(`
`).replace(/^\s*\n/,``).trimEnd();return{text:n.flat().join(`
`),map:i,layout:{blocks:n,gaps:r},head:e.slice(0,t),tail:s,prose:c,raw:!1}}var K=class extends Error{line;constructor(e,t){super(t),this.line=e}};let Vs=/^[-+]?(\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE][-+]?[0-9]+)?$/,Hs=/^([-+]?0x[0-9a-fA-F]+|[-+]?0o[0-7]+|[-+]?\.(inf|Inf|INF)|\.(nan|NaN|NAN))$/,Us=/^(null|Null|NULL|~)$/,Ws=/^(true|True|TRUE)$/,Gs=/^(false|False|FALSE)$/,Ks=/^[-?:,[\]{}#&*!|>'"%@`]/,qs=e=>e!==``&&!Ks.test(e)&&!/: |:$| #|^\s|\s$/.test(e)&&!/^[0-9]+$/.test(e)&&!/[\n\r\t]/.test(e);function Js(e,t,n){let[r]=e;if(r===`&`||r===`*`)throw new K(t,`an ${r===`&`?`anchor`:`alias`} (${e}): the subset has none; write the value out`);if(r===`!`)throw new K(t,`a tag (${e}): the subset has none`);if(r===`|`||r===`>`)throw new K(t,`a block scalar (${r}): write the text on one line, quoted, with \\n`);if(r===`{`||r===`[`)throw new K(t,`flow style beyond [a, b] (${e}): write the map or the list as a block`);if(/^([-?:]( |$)|[%@`,\]}])/.test(e))throw new K(t,`${r} can't start a plain value: quote it`);if(r===`#`||e.includes(` #`))throw new K(t,`a comment: the subset has none; say it in the prose or under a key`);if(/: |:$/.test(e))throw new K(t,`a colon and a space in a plain value (${e}): quote it`);if(n&&/[[\]{},]/.test(e))throw new K(t,`flow style beyond [a, b] (${e}): quote an item that holds , [ ] { }`);if(Us.test(e))return null;if(Ws.test(e))return!0;if(Gs.test(e))return!1;if(Vs.test(e))return Number(e);if(Hs.test(e))throw new K(t,`a number the subset doesn't read (${e}): write it in decimal, or quote it`);return e}function Ys(e,t){if(e[0]===`'`){let t=``;for(let n=1;n<e.length;n++)if(e[n]!==`'`)t+=e[n];else if(e[n+1]===`'`)t+=e[n++];else return{value:t,length:n+1}}else for(let n=1;n<e.length;n++)if(e[n]===`\\`)n++;else if(e[n]===`"`)try{return{value:JSON.parse(e.slice(0,n+1)),length:n+1}}catch{throw new K(t,`an escape the subset doesn't read in ${e.slice(0,n+1)}: it reads JSON's (\\" \\\\ \\n \\t \\uXXXX …)`)}throw new K(t,`a quoted string that isn't closed on its line (${e})`)}function Xs(e,t){if(e===`{}`)return{kind:`map`,line:t,entries:[]};if(e[0]===`"`||e[0]===`'`){let{value:n,length:r}=Ys(e,t);if(e.slice(r).trim())throw new K(t,`text after a quoted string (${e.slice(r).trim()})`);return{kind:`scalar`,line:t,value:n}}if(e[0]===`[`&&e.endsWith(`]`)){let n=[],r=e.slice(1,-1).trim();for(;r;){let i;if(r[0]===`"`||r[0]===`'`){let e=Ys(r,t);i=e.value,r=r.slice(e.length).trim()}else{let n=r.indexOf(`,`),a=(n<0?r:r.slice(0,n)).trim();if(!a)throw new K(t,`an empty item in ${e}`);i=Js(a,t,!0),r=n<0?``:r.slice(n)}if(n.push({kind:`scalar`,line:t,value:i}),r&&r[0]!==`,`)throw new K(t,`a list item followed by ${r[0]}, not a comma`);if(r=r.slice(1).trim(),!r&&e.slice(1,-1).trim().endsWith(`,`))throw new K(t,`an empty item at the end of ${e}`)}return{kind:`list`,line:t,items:n}}return{kind:`scalar`,line:t,value:Js(e,t,!1)}}function Zs(e,t=1){let n=[];try{if(e.split(`
`).forEach((e,r)=>{let i=t+r;if(!e.trim())return;let a=e.length-e.trimStart().length;if(e.slice(0,a).includes(`	`))throw new K(i,`a tab in an indent: indent with spaces`);let o=e.trim();if(/^(---|\.\.\.)(\s|$)/.test(o))throw new K(i,`a second document (${o}): the frontmatter is one`);if(o[0]===`%`)throw new K(i,`a directive (${o}): the subset has none`);if(o[0]===`#`)throw new K(i,`a comment: the subset has none; say it in the prose or under a key`);n.push({line:i,indent:a,text:o})}),!n.length)return{node:{kind:`map`,line:t,entries:[]}};let r=0,i=e=>e.text===`-`||e.text.startsWith(`- `),a=e=>i(n[r])?s(e):c(e),o=(e,t,o,c)=>{let l=n[r];if(e){if(l&&l.indent>o)throw new K(l.line,`a value over two lines, or indented under a value: the subset reads a value on one line`);return Xs(e,t)}return l&&l.indent>o?a(l.indent):l&&c&&l.indent===o&&i(l)?s(o):{kind:`scalar`,line:t,value:null}},s=e=>{let t=[],s=n[r].line;for(;r<n.length&&n[r].indent===e&&i(n[r]);){let i=n[r],s=i.text.slice(1).trimStart(),c=e+i.text.length-s.length;s&&(/^-( |$)/.test(s)||/^[^"'[{][^]*?(: |:$)/.test(s))?(n[r]={line:i.line,indent:c,text:s},t.push(a(c))):(r++,t.push(o(s,i.line,e,!1)))}return{kind:`list`,line:s,items:t}},c=e=>{let t=[],a=n[r].line;for(;r<n.length&&n[r].indent===e;){let{line:a,text:s}=n[r];if(i(n[r]))throw new K(a,`a list item where a key was expected`);if(s[0]===`?`)throw new K(a,`a complex key (?): keys are plain words`);let c=s.search(/: |:$/);if(c<0)throw new K(a,`no key: a line in a map is \`key: value\` (${s})`);let l=s.slice(0,c);if(l[0]===`"`||l[0]===`'`)throw new K(a,`a quoted key (${l}): keys are plain words`);if(/^[0-9]+$/.test(l))throw new K(a,`a key that is a number (${l}): keys are words`);if(!qs(l))throw new K(a,`a key the subset doesn't read (${l}): keys are plain words`);if(t.some(e=>e.key===l))throw new K(a,`the key ${l} is given twice`);r++,t.push({key:l,line:a,value:o(s.slice(c+1).trim(),a,e,!0)})}return{kind:`map`,line:a,entries:t}},l=a(n[0].indent);if(r<n.length)throw new K(n[r].line,`indented as no key above it is`);return{node:l}}catch(e){if(e instanceof K)return{problems:[{line:e.line,message:e.message}]};throw e}}function Qs(e){return e.kind===`scalar`?e.value:e.kind===`list`?e.items.map(Qs):Object.fromEntries(e.entries.map(e=>[e.key,Qs(e.value)]))}let $s=`&[A-Za-z_][A-Za-z0-9_]*`,ec=`([A-Za-z_][A-Za-z0-9_]*|"[^"]*\\S[^"]*")`,tc=/^\s*use\s+"([^"]*\S[^"]*)"\s*$/,nc=RegExp(`^\\s*use\\s+\\*\\s+from\\s+${ec}\\s*$`),rc=RegExp(`^\\s*use\\s+(${$s}(?:\\s*,\\s*${$s})*)\\s+from\\s+${ec}\\s*$`),ic=/* @__PURE__ */ RegExp(`^\\s*use\\s+&([A-Za-z_][A-Za-z0-9_]*)\\s*$`),ac=e=>e.startsWith(`"`)?e.slice(1,-1):e,oc=e=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(e);function sc(e){if(!/^\s*use(?![A-Za-z0-9_])/.test(e))return;let t=tc.exec(e);if(t)return{id:t[1],names:null,form:`quoted`};let n=nc.exec(e);if(n)return{id:ac(n[1]),names:null,form:`all`};let r=rc.exec(e);if(r)return{id:ac(r[2]),names:[...new Set(r[1].split(`,`).map(e=>e.trim()))],form:`named`};let i=ic.exec(e);return i?{id:i[1],names:[`&${i[1]}`],form:`short`}:null}let cc=`A use line says what it takes from which fragment: use &bd, &sd from gm_kit, use * from gm_kit, or use &aeolian (from aeolian); an id of more than a word in double quotes: use * from "harmonic minor"`;function lc(e){let t=[],n=0,r=!1,i=-1;for(let a=0;a<=e.length;a++){let o=e[a];if(o===void 0||!r&&n===0&&/\s/.test(o)){i>=0&&t.push({text:e.slice(i,a),at:i}),i=-1;continue}i<0&&(i=a),o===`"`?r=!r:!r&&`([{`.includes(o)?n++:!r&&`)]}`.includes(o)&&(n=Math.max(0,n-1))}return t}function uc(e){if(!e.startsWith(`(`)||!e.endsWith(`)`))return null;let t=e.slice(1,-1),n=[],r=0,i=!1,a=0;for(let e=0;e<=t.length;e++){let o=t[e];if(o===void 0||o===`,`&&!i&&r===0){n.push(t.slice(a,e).trim()),a=e+1;continue}o===`"`?i=!i:!i&&`([{`.includes(o)?r++:!i&&`)]}`.includes(o)&&r--}return n.length===1&&n[0]===``?[]:n}let dc=RegExp(`^\\s*(\\*|${$s}(?:\\s*,\\s*${$s})*)(?=\\s|$)`),fc=RegExp(`^${$s}$`),pc=/^[A-Za-z_][A-Za-z0-9_]*/,mc=/^"[^"]*\S[^"]*"/,hc=e=>/^[A-Za-z_][A-Za-z0-9_]*=/.test(e);function gc(e){let t=dc.exec(e);if(!t)return;let n=lc(e),r=t[0].length,i=n.findIndex(e=>e.at>=r&&e.text===`from`);if(i<0)return;let a=t[1]===`*`,o=a?null:[...new Set(t[1].split(`,`).map(e=>e.trim()))],s=n.filter((e,t)=>e.at>=r&&t<i).map(e=>e.text);if(s.some(e=>!hc(e))||a&&s.length)return null;let c=e.slice(n[i].at+4).trim();if(c===``||c.startsWith(`(`)||c.startsWith(`&`)){if(!o||s.length)return null;let e=lc(c),t=e[0]?.text.startsWith(`(`)?uc(e[0].text):[];if(t===null||t.some(e=>!fc.test(e)))return null;let n=e.slice(+!!e[0]?.text.startsWith(`(`));return n.length>1||n[0]&&!fc.test(n[0].text)?null:{kind:`signature`,names:o,optional:[...new Set(t)],main:n[0]?.text??null}}let l=(mc.exec(c)??pc.exec(c))?.[0];if(!l)return null;let u=c.slice(l.length),d=null;if(/^\s*\(/.exec(u)){let e=lc(u.trimStart())[0].text,t=uc(e);if(!t)return null;d=[];for(let e of t){let t=/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(\S[\s\S]*)$/.exec(e);if(!t||d.some(e=>e.name===t[1]))return null;d.push({name:t[1],value:t[2].trim()})}u=u.trimStart().slice(e.length)}else if(u&&!/^\s/.test(u))return null;let f=u.trim();return{kind:`use`,id:ac(l),names:o,head:s,args:d,main:f||null}}let _c=`A from line says where its cells come from: &key from harmonic_minor D, &bar from swung_4_4(swing=8n:.64) &tempo, &bd, &sd from gm_kit, * from gm_kit; the head’s attributes go before from (&key label="…" from …), the named arguments in parentheses; with no id, a fragment’s signature: &bar from (&swing) &tempo`,vc=({id:e,names:t})=>`use is the old way: say where the cells come from, ${t?t.join(`, `):`*`} from ${oc(e)?e:JSON.stringify(e)} (decision 065; Normalise writes it, with a template's arguments)`;function yc(e){let t=!1;for(let n=0;n<e.length;n++){let r=e[n];if(r===`"`)t=!t;else if(!t&&(r===`/`&&e[n+1]===`/`||r===`#`&&(n===0||/\s/.test(e[n-1]))))return[e.slice(0,n),e.slice(n)]}return[e,``]}let bc=e=>RegExp(`^(\\s*&${e})(?=\\s|$)`);function xc(e,t){let n=bc(t);return e.split(`
`).findIndex(e=>n.test(yc(e)[0])&&gc(yc(e)[0].trim())===void 0)}function Sc(e,t){return e.findIndex(e=>{let n=Tc(yc(e)[0]);if(!/^&\w+$/.test(n[0]??``)||!n.some(e=>e.startsWith(`step=`)))return!1;let r=n.slice(1).filter(e=>!Ec(e));return r.length>0&&r.every(e=>/^&\w+$/.test(e))&&r.includes(`&${t}`)})}function Cc(e,t,n){let r=e.split(`
`),i=xc(e,t),a=Sc(r,t);if(i<0){if(a<0)return e;r.splice(a+1,0,`&${t}${r[a].endsWith(`\r`)?`\r`:``}`),i=a+1}let o=r[i].endsWith(`\r`)?`\r`:``,[s,c]=yc(o?r[i].slice(0,-1):r[i]),l=n(s,bc(t));if(a>=0&&!c&&l.trim()===`&${t}`)return r.splice(i,1),r.join(`
`);if(c){let e=s.length,t=l.replace(/\s+$/,``);l=t+` `.repeat(Math.max(1,e-t.length))}return r[i]=l+c+o,r.join(`
`)}function wc(e,t,n,r){return Cc(e,t,(e,t)=>{let i=`(?:"[^"]*"|[^\\s(]*\\([^)]*\\)[^\\s]*|\\S+)`,a=RegExp(`(\\s)${n}=${i}`);return a.test(e)?r===null?e.replace(RegExp(`\\s${n}=${i}`),``):e.replace(a,`$1${n}=${r}`):r===null?e:e.replace(t,`$1 ${n}=${r}`)})}function Tc(e){let t=[],n=0,r=0,i=!1,a=``;for(let o of e)o===`"`&&(i=!i),!i&&(o===`[`||o===`(`)&&n++,!i&&(o===`]`||o===`)`)&&(n=Math.max(0,n-1)),!i&&n===0&&o===`<`&&r++,!i&&n===0&&o===`>`&&(r=Math.max(0,r-1)),/\s/.test(o)&&n===0&&r===0&&!i?(a&&t.push(a),a=``):a+=o;return a&&t.push(a),t}let Ec=e=>/^[a-z][a-zA-Z]*=/.test(e)||e===`off`;function Dc(e,t){let n=xc(e,t);return n>=0&&/[+*,[]\s*$/.test(yc(e.split(`
`)[n])[0])}function Oc(e,t){let n=xc(e,t);if(n<0)return null;let r=Tc(yc(e.split(`
`)[n])[0]),i=r.slice(0,1),a=r.slice(i.length);return{head:i,attrs:a.filter(Ec),braid:a.filter(e=>!Ec(e))}}function kc(e,t,n){let r=Oc(e,t);if(!r||Dc(e,t))return e;let i=r.braid.length===1&&/^free\(\s*[^"\s]/.test(r.braid[0])&&n.length>0;return Cc(e,t,e=>/^\s*/.exec(e)[0]+[...r.head,...r.attrs,...i?[`free(${n.join(` `)})`]:n].join(` `))}function Ac(e,t,n,r){return wc(wc(e,t,n===`step`?`loop`:`step`,null),t,n,r)}function jc(e,t,n){return/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)?t!==n&&xc(e,t)>=0?`&${t} already exists`:null:`Letters, digits and _ only, starting with a letter`}function Mc(e,t,n){if(t===n||jc(e,n,t))return e;let r=RegExp(`&${t}(?![A-Za-z0-9_])`,`g`);return e.split(`
`).map(e=>{let[t,i]=yc(e);return t.replace(r,`&${n}`)+i}).join(`
`)}let Nc=/^`{3,}\s*cells\s*$/m;function Pc(e){let t=[];for(let{key:n,line:r,value:i}of e.entries){let e=Qs(i);n===`title`&&(typeof e!=`string`||!e.trim())&&t.push({line:r,message:`the title is ${JSON.stringify(e)}, not a text: title: "A name"`}),n===`description`&&typeof e!=`string`&&t.push({line:r,message:`the description is ${JSON.stringify(e)}, not a text: description: "What it is"`}),n===`tags`&&!(Array.isArray(e)&&e.every(e=>typeof e==`string`&&e.trim()))&&t.push({line:r,message:`the tags are ${JSON.stringify(e)}, not a list of names: tags: [genre:jazz, rhythm]`}),n===`tier`&&!(typeof e==`number`&&Number.isInteger(e)&&e>=1&&e<=9999)&&t.push({line:r,message:`the tier is ${JSON.stringify(e)}: a tier of the tutorial is a whole number, 1 to 9999`}),n===`uses`&&!(Array.isArray(e)&&e.every(Ic))&&t.push({line:r,message:`the uses are ${JSON.stringify(e)}, not a lockfile: uses: a list of - id: gm_kit, hash: e1:…`})}return t}function Fc(e){let t=e.split(/\r?\n/);if(t[0]!==`---`){if(!Nc.test(e))return{problems:[{line:1,message:"no frontmatter: a piece file starts with a line `---`, or holds a ```cells block"}]};let n=Bs(t,0);return`problems`in n?n:{frontmatter:{},text:n.text,prose:n.prose,map:n.map,layout:n.layout,bare:!0}}let n=t.indexOf(`---`,1);if(n<0)return{problems:[{line:1,message:"the frontmatter is never closed: no second line `---`"}]};let r=Zs(t.slice(1,n).join(`
`),2);if(`problems`in r)return r;let i=r.node;if(i.kind!==`map`)return{problems:[{line:i.line,message:"the frontmatter is a map (`title: …`, `tags: […]`)"}]};let a=Bs(t,n+1),o=[...Pc(i),...`problems`in a?a.problems:[]];return`problems`in a||o.length?{problems:o.sort((e,t)=>e.line-t.line)}:{frontmatter:Qs(i),text:a.text,prose:a.prose,map:a.map,layout:a.layout}}function Ic(e){if(typeof e!=`object`||!e||Array.isArray(e))return!1;let t=e;return Object.keys(t).sort().join()===`hash,id`&&typeof t.id==`string`&&typeof t.hash==`string`}let Lc=/[A-Za-z_][A-Za-z0-9_]*/y,Rc=/-?[0-9]+/y,zc=/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y,Bc=4096;var Vc=class extends Error{col;len;constructor(e,t,n=1){super(e),this.col=t,this.len=n}},Hc=class e{text;line;offset;lambdas;parts;warnings;depth;body;i=0;frees=[];constructor(e,t,n=0,r=[],i=[{line:t,start:0}],a=[],o=0,s){this.text=e,this.line=t,this.offset=n,this.lambdas=r,this.parts=i,this.warnings=a,this.depth=o,this.body=s}within(t,n,r=this.depth){return new e(t,this.line,this.offset+n,this.lambdas,this.parts,this.warnings,r,this.body)}warn(e,t,n){this.warnings.push({severity:`warning`,message:e,span:{...this.place(t),len:n}})}place(e){let t=e+this.offset,n=this.parts[0];for(let e of this.parts)e.start<=t&&(n=e);return{line:n.line,col:t-n.start+1,len:Math.max(1,this.i-e)}}skipSpace(){for(;this.i<this.text.length&&/\s/.test(this.text[this.i]);)this.i++}done(){return this.skipSpace(),this.i>=this.text.length}peek(){return this.text[this.i]??``}span(e){return{line:this.line,col:e+1+this.offset,len:Math.max(1,this.i-e)}}fail(e,t=this.i,n=1){throw new Vc(e,t+this.offset,n)}match(e){e.lastIndex=this.i;let t=e.exec(this.text);return t?(this.i+=t[0].length,t[0]):null}ident(e){let t=this.match(Lc);return t===null&&this.fail(`Expected ${e}`),t}int(e){let t=this.match(Rc);return t===null&&this.fail(`Expected ${e}`),parseInt(t,10)}num(e){let t=this.match(zc);t===null&&this.fail(`Expected ${e}`);let n=parseFloat(t);if(this.peek()===`/`&&/[0-9.]/.test(this.text[this.i+1]??``)){this.i++;let e=this.match(zc);(e===null||parseFloat(e)===0)&&this.fail(`a fraction needs a denominator, like 9/8`),n/=parseFloat(e)}let r=0;for(;this.peek()===`#`||this.peek()===`b`;)r+=this.text[this.i++]===`#`?1:-1;return{value:n,alter:r}}noteName(){let e=this.match(/[A-G](?:#|b)?(?:-?[0-9]+)?(?![A-Za-z0-9_])/y);return e===null?null:Ua(e)}expect(e,t){this.peek()!==e&&this.fail(`Expected ${t}`),this.i++}lambda(){let e=this.i;this.depth>=32&&this.fail(`Unnamed cells &( … ) nest 32 deep at most: name the inner ones (&env …) and refer to them`,e-1,2);let t=0,n=-1;for(let r=e;r<this.text.length;r++)if(this.text[r]===`(`)t++;else if(this.text[r]===`)`&&--t===0){n=r;break}n<0&&this.fail(`')' to close &( … )`,e);let r=`λ${this.line}_${e+this.offset}`;this.body||this.fail(`An unnamed cell &( … ) here has no parser for its body`,e-1,2);let i=this.within(this.text.slice(e+1,n),e+1,this.depth+1),a=this.body(i,{name:r,pick:null,shift:0,span:{line:this.line,col:e+this.offset,len:n-e+2}});return this.lambdas.push({...a,lambda:this.text.slice(e+1,n).trim()}),this.i=n+1,r}ref(e){let t=this.i;this.expect(`&`,e);let n=this.peek()===`(`?this.lambda():this.ident(`a name after &`),r=null,i=0;if(this.peek()===`[`){this.i++,this.skipSpace();let e=this.match(/<<|>>/y);if(e){this.skipSpace();let a=this.match(/[0-9]+/y);return i=(e===`<<`?-1:1)*(a===null?1:parseInt(a,10)),this.skipSpace(),this.expect(`]`,`']' to close &${n}[${e}…]`),{name:n,pick:r,shift:i,...this.transposition(n),span:this.span(t)}}let a=this.match(/[a-z][A-Za-z]*(?=\s*\])/y);if(a!==null)return this.skipSpace(),this.expect(`]`,`']' to close &${n}[${a}]`),{name:n,pick:r,shift:i,slot:a,...this.transposition(n),span:this.span(t)};this.text.startsWith(`free(`,this.i)&&this.fail(`&${n}[…] picks by a number written in place: free(…) is a cell's whole braid (free(0 2 4 ~)), or a number in an attribute`,this.i,5);let o=this.peek()===`$`&&(this.i++,this.skipSpace(),1)?{abs:!0}:{},s=this.match(Rc);if(this.skipSpace(),this.peek()===`:`){this.i++,this.skipSpace();let e=this.match(Rc);this.skipSpace();let t=null;if(this.peek()===`:`){this.i++,this.skipSpace();let e=this.i,n=this.match(Rc);n!==null&&parseInt(n,10)===0&&this.fail(`A slice step of 0 never moves`,e,n.length),t=n===null?null:parseInt(n,10),this.skipSpace()}r={kind:`slice`,from:s===null?null:parseInt(s,10),to:e===null?null:parseInt(e,10),...t===null?{}:{step:t},...o}}else s===null&&this.fail(`Expected an index like &${n}[0] (&${n}[$0] as written), or a slice like &${n}[1:]`),r={kind:`at`,i:parseInt(s,10),...o};this.expect(`]`,`']' to close &${n}[…]`)}else if((this.peek()===`+`||this.peek()===`-`)&&/[0-9]/.test(this.text[this.i+1]??``)){let e=this.peek(),r=/[0-9]+/.exec(this.text.slice(this.i+1))[0];this.fail(`&${n}${e}${r}: write &${n}^${e===`-`?`-`:``}${r} to move it by its table's steps (in a braid; ^$${e===`-`?`-`:``}${r}: by semitones), &${n} ${e} ${r} to add pitch (in a mix), &${n}[${e===`-`?`<<`:`>>`}${r===`1`?``:r}] to shift it, or &${n}[…] to pick from it`,t,this.i-t+1+r.length)}return{name:n,pick:r,shift:i,...this.transposition(n),span:this.span(t)}}rejectTap(e){if(this.peek()!==`:`)return;let t=/^(?:(?:pulse|beat)(?:\*\d+)?|\d+[nt]\.?|\d*m)(?![\w.])/.exec(this.text.slice(this.i+1));if(!t)return;let n=this.text.slice(e,this.i+1+t[0].length);this.fail(`${n} is a meter's tap, which only step= reads (step=${n}): here it names no cell`,e,n.length)}cellRef(e,t,n=!1){let r=this.i,i=this.ref(e);n||this.rejectTap(r);let a=this.text.lastIndexOf(`^`,this.i-1);return a>=r&&a>this.text.lastIndexOf(`)`,this.i-1)&&this.warn(`${this.text.slice(r,this.i)} ${t}: ^ and ^$ move a cell a braid plays (and base=&cell^n, a copy, and a gate's play=&cell^n); here it is the cell itself, so the move is ignored`,a,this.i-a),i}transposition(e){if(this.peek()!==`^`)return{};let t=this.i;this.i++;let n=this.peek()===`$`;n&&this.i++;let r=this.match(/-?[0-9]+/y);r===null&&this.fail(`&${e}^n moves it n steps of its table (&${e}^1, a degree up), &${e}^$n n semitones (&${e}^$7, &${e}^$-12)`,t,1),this.peek()===`.`&&/[0-9]/.test(this.text[this.i+1]??``)&&this.fail(`&${e}${this.text.slice(t,this.i)}…: ^ takes a whole number of steps (&${e}^1, &${e}^$-12)`,t,this.i-t+1+/^[0-9]+/.exec(this.text.slice(this.i+1))[0].length),this.peek()===`^`&&this.fail(`&${e}${this.text.slice(t,this.i)}^…: one ^ per reference; nest with degree(…): degree(&${e}${this.text.slice(t,this.i)}, n)`,this.i,1);let i=parseInt(r,10);return i?n?{transpose:i}:{degree:i}:{}}atBoundary(){let e=this.peek();return e===``||/\s/.test(e)}};function Uc(e){let t=!1;for(let n=0;n<e.length;n++){let r=e[n];if(r===`"`)t=!t;else if(!t&&r===`/`&&e[n+1]===`/`)return e.slice(0,n);else if(!t&&r===`#`&&(n===0||/\s/.test(e[n-1])))return e.slice(0,n)}return e}let q=(e,t,n)=>({help:e,doc:t,value:`syntax`,...n?{on:n}:{}}),J=(e,t={})=>({help:e,doc:`sound.md`,value:`number`,on:[`voice`],voice:!0,...t}),Y=(e,t,n={})=>({help:e,doc:`physics.md`,value:`number`,on:t,...n}),Wc={over:q(`the table its numbers read`,`tables.md`),base:q(`the cell it is a copy of, changed where it says: its braid step by step over the base’s (= keeps a step), its attributes where it sets none`,`braid.md`),step:q(`what moves it, step by step`,`time.md`),loop:q(`what moves it, the whole braid at a time`,`time.md`),shift:q(`how far it is turned`,`tables.md`),stride:q(`how far each step turns it`,`time.md`),map:q(`how its values sound`,`sound.md`),show:q(`how it’s shown: notes, do, scale, pattern … (and everything below it)`,`display.md`),label:q(`a name to show, in quotes — alone on a cell, a note in the graph`,`display.md`),env:q(`a voice’s own volume on every note: an envelope`,`sound.md`,[`voice`]),pitch:{...q(`a voice’s own pitch on every note: a vibrato, or a shape in semitones (pitch=0..30 * &(map=adsr 0 .04 0 0): a drop)`,`sound.md`,[`voice`]),moves:!0},cycle:q(`where it wraps: turning past this many steps starts again (a grid’s size is map=edo)`,`tables.md`),size:q(`how large it’s drawn, against the others: 2 twice, .5 half`,`display.md`),laps:q(`how many laps it plays, then it ends`,`time.md`),chance:q(`what a bare x? means here: the probability it is dropped, or free() for a slider`,`cell.md`),seed:q(`a different sequence of chance`,`cell.md`),title:{...q(`on a note: the piece’s title (its card), the old spelling: its file’s frontmatter holds it`,`display.md`,[`note`]),old:`title: in the frontmatter`},tags:q(`on a cell: its clusters in the graph, comma-separated (on the piece’s card, the old spelling of its tags: its file’s frontmatter holds them)`,`display.md`),about:q(`on a note: the cells it explains`,`display.md`,[`note`]),style:q(`its style: a map=style cell, &(map=style …), or a mix of them by weight; or a range from one to another over its scope (style=&funk..&bossa). On the note &style, the section’s, read by axis (&style[artic])`,`style.md`),tier:{...q(`on a piece’s card: its tier of the tutorial (1 the first), the old spelling: its file’s frontmatter holds it`,`display.md`,[`note`]),old:`tier: in the frontmatter`}},Gc={s:J(`sound source: sine tri saw square pulse white pink brown`,{value:`word`}),lpf:J(`low-pass cutoff, Hz`,{moves:!0,hz:!0}),lpq:J(`low-pass resonance`,{moves:!0}),hpf:J(`high-pass cutoff, Hz`,{moves:!0,hz:!0}),hpq:J(`high-pass resonance`,{moves:!0}),room:J(`reverb send 0–1`,{moves:!0}),delay:J(`delay send 0–1`,{moves:!0}),delaytime:J(`echo time, seconds — or a clock: &bar*2 (an eighth at the tempo) — or a tap: 8n, 4n.`,{clock:!0}),delayfeedback:J(`echo feedback 0–1`),glide:{help:`tied notes (each starting as the one before ends) play as one: its envelope once, each next a slide there over this many seconds (dough’s glide; 0 or none: each note its own)`,doc:`sound.md`,value:`number`,on:[`voice`]},legato:{help:`on a line: each note sounds its written length (@n, _) times this share, its end swung as its onset is, Strudel’s legato (.5 staccato, 1 as written, 1.5 into the next): a number, free(), or a cell of shares read at each onset (legato=&artic); nothing cuts a note at the bar line`,doc:`sound.md`,value:`number`,on:[`clock`,`driven`],moves:!0,form:`legato=n · legato=free(n, lo..hi) · legato=&x · legato=lo..hi * &a * &b · on a meter, its lines’ default by level: legato=16n:r,4n:r`},pan:J(`where it sits in stereo: 0 left, .5 centre (as without it), 1 right — the far side fades`),distort:J(`distortion: 0 clean, .3 gritty, 1 and more harsh`),crush:J(`bit depth: 16 clean, 8 grainy, 3 and fewer: rubble`),fm:J(`frequency modulation: the voice that modulates this one (fm=&op); it may have its own fm=`,{doc:`physics.md`,value:`cell`}),ratio:J(`as a modulator: its frequency against its carrier’s (1 the same, 3.5 a bell)`,{doc:`physics.md`,on:[`modulator`]}),index:J(`FM depth: how far the modulator swings the frequency (0 none … 10 bright); it can move`,{doc:`physics.md`,on:[`carrier`],moves:!0}),body:J(`a resonator: what its exciters are — fork, bell, bar, plate, box, tine, pipe, wire, spring; its braid lists them (semitones; the twelve by default), a note plucks the nearest`,{doc:`physics.md`,value:`word`}),ring:J(`a resonator: how long it rings, in seconds`,{doc:`physics.md`}),hard:J(`a resonator: the mallet — 0 felt (dark), 1 steel (bright)`,{doc:`physics.md`}),board:Y(`a resonator: the body its exciters share (box by default, an octave below; none: no board)`,[`resonator`],{value:`word`}),couple:Y(`a resonator: another it shares a table with (couple=&other) — each sets the other ringing`,[`resonator`],{value:`cell`}),coupling:Y(`a resonator: how strongly it is coupled (.01 faint, .05 strong)`,[`resonator`]),excite:Y(`a resonator: sound that drives it (excite=&mix) — it answers where the sound meets its modes`,[`resonator`],{value:`cell`}),postgain:{help:`on the sound card: its master, a linear gain after everything (Strudel’s postgain: 1 as it is, .5 half, a negative one inverts the phase; free(.8, 0..1) a slider)`,doc:`mix.md`,value:`number`,on:[`card`]},beat:{help:`on a meter: how many beats it counts, equal (meter("4/4") beat=2: alla breve) — its bpm counts beats`,doc:`time.md`,value:`number`,on:[`clock`]},pulse:{help:`on a scan: the note value of its entries (pulse=16n: sixteenths) — its beats then count quarters, and its taps read note values by it`,doc:`time.md`,value:`word`,on:[`clock`,`driven`]},swing:{help:`on a meter: a level of its bar leans, named by note value — of each pair of its eighths (swing=8n:.67), the second comes this far through their beat (.5 straight, .67 triplet swing), a group of three leaning, or straight with :pairs (swing=8n:.67:pairs); every beat and bar line stays. Bare (swing=.6), on a list: pairs of its steps`,doc:`time.md`,value:`number`,on:[`clock`],form:`swing=8n:r · swing=8n:r:pairs · swing=8n:r,16n:r · swing=8n:free(r, lo..hi) · swing=r`},motor:Y(`on a meter: it turns physically — a motor this strong pulls it to its tempo (from rest)`,[`clock`]),mass:Y(`physics: how heavy it turns (inertia); on a cell a meter drives, load`,[`clock`,`driven`]),friction:Y(`physics: drag — the meter sags below its tempo, more with more load`,[`clock`,`driven`]),wind:Y(`on a meter with a motor: its spring runs down over this many seconds, and it coasts to a stop`,[`motor`]),wow:Y(`on a meter with a motor: its speed swings slowly by this fraction (.01: a tape machine’s wow)`,[`motor`]),varispeed:Y(`on a clock: its notes’ pitch follows its speed, as tape does (1 fully, 0 not)`,[`clock`,`driven`]),belt:Y(`on a driven cell (step=&x): it follows through a belt this stiff (200 taut, 20 slack) — it lags, swings, catches up`,[`driven`]),damping:Y(`a belt’s damping: how soon its swinging dies (0 rings on, high creeps)`,[`driven`]),slip:Y(`a belt’s grip: past this pull it slips, and the cell falls behind for good`,[`driven`]),write:Y(`a tape: what its write head records (write=&melody); it moves with its step=`,[`tape`],{value:`cell`}),length:Y(`a tape: how long its loop is, in seconds of tape (or a clock: length=&bar/4, or a tap: length=1m); none, an open reel`,[`tape`],{clock:!0}),erase:Y(`a tape: how much of what was there each pass under the write head wipes (1 all, .3 leaves ghosts)`,[`tape`]),tone:Y(`a sound tape: its loss — each pass through the loop darker (Hz: 7000 bright, 1500 worn)`,[`tape`],{hz:!0}),drive:Y(`a sound tape: how hard it saturates each pass (0 clean, .5 warm, 1 crushed)`,[`tape`]),hiss:Y(`a sound tape: its noise floor (0 none, .02 a cassette)`,[`tape`]),print:Y(`a sound tape: print-through — a faint pre-echo before each head (.03 a whisper)`,[`tape`]),printgap:Y(`a sound tape: how far before each head the print-through sits (tape-seconds, .6)`,[`tape`]),dropout:Y(`a sound tape: brief gaps in the playback, about this many a second`,[`tape`],{hz:!0}),play:Y(`a read head: the tape it reads (play=&tape), at= tape-seconds after the write head; a gate: the notes it plays on the voices in its braid (play=&tune)`,[`head`,`gate`],{value:`cell`}),at:Y(`a read head: how far after the write head it sits, in seconds of tape (or a clock: at=&bar, or a tap: at=4n)`,[`head`],{clock:!0}),wander:Y(`a read head: how far it wanders either way (tape-seconds) — a flying head`,[`head`]),wanderhz:Y(`a read head: how fast it wanders (times a second)`,[`head`],{hz:!0}),level:{help:`on a gate: how loud, a product of level cells and a gain (level=&accent*&duck*.4)`,doc:`mix.md`,value:`number`,on:[`gate`]},trigger:{help:`a gate, the old spelling of play=: the notes it plays (trigger=&tune)`,doc:`mix.md`,value:`cell`,on:[`gate`],old:`play=`},gate:{help:`a gate, the old spelling: a level over time, one factor of level= (gate=&duck)`,doc:`mix.md`,value:`cell`,on:[`gate`],old:`level=`},velocity:{help:`a gate, the old spelling: a level, one factor of level= (velocity=&accent)`,doc:`mix.md`,value:`cell`,on:[`gate`],old:`level=`},gain:{help:`on a voice: its own gain, dough’s, times every gain it is played at (1 by default, a negative one inverts the phase; a kit member’s balance); on a gate written the old way (trigger=): the number in level=`,doc:`sound.md`,value:`number`,on:[`voice`,`gate`]},scope:{help:`a scope: stack, split, xy (in time) — spectrum, waterfall (in frequency, or value); its braid lists its channels`,doc:`display.md`,value:`word`,on:[`scope`]},fold:{help:`a spectrum or waterfall: pitches folded by this stride into as many bins (12: by pitch class, the default)`,doc:`display.md`,value:`number`,on:[`scope`]},bins:{help:`a spectrum or waterfall without a fold: this many bands, low to high (1 a meter, 3 low-mid-high, 20 an equaliser)`,doc:`display.md`,value:`number`,on:[`scope`]},channels:{help:`a spectrum or waterfall: sum (one, the default) or split (each channel its own)`,doc:`display.md`,value:`word`,on:[`scope`]},restart:{help:`what switching a part on does to its time (on a selector: for all its sections) — restart (from its top, the default), resume (where it stopped), free (its time runs on, only its sound is switched; a performer’s default)`,doc:`time.md`,value:`word`,on:[`section`,`performer`,`selector`],stub:!0},law:{help:`a law that computes the notes (law=fiveto12: the 5 to 12 cycle, a day of music)`,doc:`time.md`,value:`word`,on:[`law`]},anchor:{help:`a clock (a day meter, loop=1d): the time of day it stands at when play starts (hours.minutes — 11.55); play begins where the clock stands`,doc:`time.md`,value:`number`,on:[`clock`]}},Kc={sound:`s`,cutoff:`lpf`,ctf:`lpf`,lp:`lpf`,resonance:`lpq`,hcutoff:`hpf`,hp:`hpf`,hresonance:`hpq`,verb:`room`,reverb:`room`,delayt:`delaytime`,dt:`delaytime`,delayfb:`delayfeedback`,dfb:`delayfeedback`,clip:`legato`},qc={...Wc,...Gc},Jc=new Set(Object.keys(Gc).filter(e=>Gc[e].value===`cell`)),Yc=new Set(Object.keys(Gc).filter(e=>Gc[e].clock)),Xc=new Set(Object.keys(qc).filter(e=>qc[e].moves)),Zc=new Set(Object.keys(Gc).filter(e=>Gc[e].voice)),Qc=new Set(Object.keys(Gc).filter(e=>Gc[e].doc!==`physics.md`&&Gc[e].on?.every(e=>e===`clock`||e===`driven`))),$c=e=>Object.keys(e).some(e=>!Qc.has(e));function el(e){let t={voice:`a voice`,clock:`a meter (step= a rate)`,driven:`a driven cell (step=&x)`,motor:`a meter with a motor=`,tape:`a tape (write=)`,head:`a read head (play=)`,resonator:`a resonator (body=)`,scope:`a scope (scope=)`,law:`a law (law=)`,card:`the sound card (map=sample)`,note:`a note (a label= and nothing else)`,carrier:`a voice with fm=`,modulator:`a voice another’s fm= names`,gate:`a gate (play= with a braid)`,section:`a section (a name a stepped table of names declares)`,performer:`a performer (a gate or a role a band names)`,selector:`a selector (over= a table of sections, or a band)`},n=e.map(e=>t[e]);return n.length<2?n[0]??``:`${n.slice(0,-1).join(`, `)} or ${n[n.length-1]}`}function tl(e){let t=null,n=e.length<5?2:3;for(let r of Object.keys(qc)){let i=nl(e,r);i<n&&([t,n]=[r,i])}return t}function nl(e,t){let n=Array.from({length:e.length+1},(e,n)=>[n,...Array(t.length).fill(0)]);for(let e=1;e<=t.length;e++)n[0][e]=e;for(let r=1;r<=e.length;r++)for(let i=1;i<=t.length;i++)n[r][i]=Math.min(n[r-1][i]+1,n[r][i-1]+1,n[r-1][i-1]+(e[r-1]===t[i-1]?0:1)),r>1&&i>1&&e[r-1]===t[i-2]&&e[r-2]===t[i-1]&&(n[r][i]=Math.min(n[r][i],n[r-2][i-2]+1));return n[e.length][t.length]}Object.fromEntries(Object.entries(Gc).map(([e,t])=>[e,t.help]));let rl={sine:`sine`,tri:`triangle`,triangle:`triangle`,saw:`sawtooth`,sawtooth:`sawtooth`,square:`square`,pulse:`square`,white:`white`,pink:`pink`,brown:`brown`},il=e=>`${e}= is gone: an envelope is a cell — in the mix, &theme * &(map=adsr .01 .3 .5 .4) * &lead, or an instrument, &lead [&(map=adsr .01 .3 .5 .4) * &saw]`,al=e=>`${e}= is gone: a pitch drop is a pitch shape, an envelope in semitones — penv=30 pdec=.04 is pitch=0..30 * &(map=adsr 0 .04 0 0)`,ol={attack:il(`attack`),decay:il(`decay`),sustain:il(`sustain`),release:il(`release`),penv:al(`penv`),pdec:al(`pdec`)},sl=`fifths12TET`,cl=`key:main`,ll=[`&bar`,`&tempo`,`&key`,`&tonic`,`&harm`,`&style`],ul=5e4,dl=2e3,fl=[`name`,`notes`,`tonic`,`mode`,`steps`,`tempo`,`shift`],pl={fork:[[1,1,1],[6.27,.03,.35]],bell:[[.5,1,.5],[1,.8,1],[1.2,.6,.7],[1.5,.5,.45],[2,.45,.6],[2.5,.3,.35],[2.67,.28,.3],[3,.22,.25]],bar:[[1,1,1],[2.756,.45,.5],[5.404,.22,.3],[8.933,.12,.18]],plate:[[1,1,.8],[1.58,.8,.7],[2.24,.7,.6],[2.92,.55,.55],[3.15,.5,.5],[3.88,.4,.4],[4.47,.35,.35],[5,.3,.3]],box:[[1,1,1],[1.42,.7,.6],[1.91,.5,.45],[2.53,.35,.3]],tine:[[1,1,1],[5.93,.12,.35],[17.6,.03,.12]],pipe:[1,3,5,7,9,11,13].map(e=>[e,1/Math.sqrt(e),1/e]),wire:Array.from({length:12},(e,t)=>t+1).map(e=>[e*Math.sqrt(1+6e-4*e*e),1/(.6+.4*e),1/e]),spring:[[1,1,1]]};function ml(e){if(typeof e!=`number`)return[1,1];let t=Math.min(1,Math.max(0,e));return[Math.min(1,2*(1-t)),Math.min(1,2*t)]}let hl=e=>e?.map?.kind===`midi`,gl=e=>t=>e.cells.get(t)?.shift??0,_l={SAMPLE_RATE:48e3,A4:440},vl={C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2};function yl(e,t=440){let n=/^([A-G])([#b]?)(-?\d+)$/.exec(e);return n?t*2**((vl[n[1]]+(n[2]===`#`?1:n[2]===`b`?-1:0)+12*(parseInt(n[3],10)-4))/12):null}function bl(e,t){if(!t)return Array.from({length:e},(e,t)=>t);if(t.kind===`at`){let n=t.i<0?e+t.i:t.i;return n>=0&&n<e?[n]:null}let n=t.step??1,r=t=>t<0?e+t:t,i=[];if(n>0){let a=t.from===null?0:Math.max(0,Math.min(e,r(t.from))),o=t.to===null?e:Math.max(0,Math.min(e,r(t.to)));for(let e=a;e<o;e+=n)i.push(e)}else{let a=t.from===null?e-1:Math.max(-1,Math.min(e-1,r(t.from))),o=t.to===null?-1:Math.max(-1,Math.min(e-1,r(t.to)));for(let e=a;e>o;e+=n)i.push(e)}return i.length?i:null}function xl(e,t,n){let r=bl(e,t);return!r||!t||t.abs||!e?r:r.map(t=>((t+n)%e+e)%e)}function Sl(e,t){if(!t)return e.steps;let n=xl(e.units.length,t,e.shift);return n?n.reduce((t,n)=>t+e.unitSteps[n],0):null}function Cl(e,t,n){let r=`&${e}${Fs(t)}`,i=`&${e} has ${n} step${n===1?``:`s`}`;if(!t||t.kind===`at`)return`${r} picks nothing: ${t&&t.i<0?`before the start`:`past the end`}, ${i}`;let a=t.step??1;return a>0&&t.from!==null&&(e=>e<0?n+e:e)(t.from)>=n?`${r} picks nothing: it starts past the end, ${i}`:`${r} picks nothing: ${a>0?`it ends before it starts (a slice runs forwards unless its step is negative: [::-1])`:`it ends after it starts (a negative step runs backwards)`}, ${i}`}function wl(e){if(e.map?.kind!==`adsr`)return null;let t=e.units.map(e=>e.atom.kind===`note`?e.atom.value:NaN);return t.length!==4||t.some(e=>!(e>=0))?null:{attack:t[0],decay:t[1],sustain:Math.min(1,t[2]),release:t[3]}}function Tl(e){return e.root||e.scan!==null}function El(e){if(e.peek()!==`:`)return;e.rejectTap(e.text.slice(0,e.i).search(/&[^\s:,[\]()*+&]*$/)),e.i++;let t=e.i,n=e.match(/[0-9]+/y);if(n===null)return e.fail(`A hit is &bd:n:gain, its number first: &bd:0:.3`,t,1);if(parseInt(n,10)!==0&&e.fail(`&bd:${n} would be a pitched hit, ${n} up its table: not yet (write &bd:0:gain)`,t,n.length),e.peek()!==`:`)return;e.i++;let r=e.i,i=e.match(/[0-9]*\.[0-9]+|[0-9]+/y);return i===null?e.fail(`A hit’s gain: a number, &bd:0:.3 (1 as it is)`,r,1):parseFloat(i)}function Dl(e,t){let n=0,r=!1,i=[[]],a=``,o=()=>{a&&i[i.length-1].push(a),a=``};for(let s=t;s<e.length;s++){let t=e[s];if(t===`&`&&(r=!0),t===`[`||t===`(`){if(n++===0)continue}else if(t===`]`||t===`)`){if(--n===0)break}else if(n===1&&t===`,`){o(),i.push([]);continue}else if(n===1&&/\s/.test(t)){o();continue}a+=t}if(o(),!r)return!1;let s=e=>/^[*+(-]|[*+-]$/.test(e);return!i.some(e=>e.length>1&&!e.some(s)||e.length===1&&e[0].startsWith(`[`))}function Ol(e){e.i++;let t=[];for(;;){if(t.push(kl(e,0)),e.skipSpace(),e.peek()===`,`){e.i++;continue}let n=e.peek();return n===`|`&&e.fail(`',' or ']' in the mix: a mix lists its terms with commas ([&a, &b]); a choice [a|b] picks between numbers in a braid (&x [0|2]), not between cells`,e.i,1),(n===`[`||n===`&`)&&e.fail(`',' or ']' in the mix: a mix lists its terms with commas ([&a, &b]); one term is a product or a sum, its parts joined by * or +`,e.i,1),e.expect(`]`,`',' or ']' in the mix`),{kind:`mix`,exprs:t}}}function kl(e,t){let n=e.i,r=[{e:Al(e,t),sign:1}];for(;;){e.skipSpace();let n=e.peek();if(n!==`+`&&n!==`-`)break;e.i++,r.push({e:Al(e,t),sign:n===`-`?-1:1})}return r.length===1?r[0].e:{k:`sum`,items:r,span:e.span(n)}}function Al(e,t){e.skipSpace();let n=e.i,r=[jl(e,t)];for(;e.skipSpace(),e.peek()===`*`;)e.i++,r.push(jl(e,t));return r.length===1?r[0]:{k:`prod`,factors:r,span:e.span(n)}}function jl(e,t){e.skipSpace();let n=e.i;if(e.peek()===`(`){t>=32&&e.fail(`Parentheses in a mix nest 32 deep at most: name a part (&part [ … ]) and use it`,n),e.i++;let r=kl(e,t+1);return e.skipSpace(),e.expect(`)`,`')' to close the group`),r}if(e.peek()===`&`){let t=e.ref(`a cell, like &theme`),n=El(e);return n===void 0?{k:`ref`,ref:t}:{k:`ref`,ref:t,level:n}}if(e.text.startsWith(`free(`,e.i))return{k:`num`,value:ja(e,`gain`,!1).value,span:e.span(n)};let r=e.match(zc);return r===null?(e.match(/gate\(/y)&&e.fail(`gate(…) is planned but not built yet: for now a step= term articulates, loop= terms bend`,n,5),e.fail(`Expected a cell, a number or '(' here`)):{k:`num`,value:parseFloat(r),span:e.span(n)}}let Ml=RegExp(`(?:${Object.keys(Fa).join(`|`)})(?![A-Za-z0-9_])`,`y`),Nl=[`degree`,`inverse`],Pl=/(degree|inverse)\(/y;function Fl(e){let t=e.match(Pl);if(t===null){let t=e.ref(`a cell like &motif`);return{kind:`ref`,name:t.name,pick:t.pick,shift:t.shift,...t.slot?{slot:t.slot}:{},...t.transpose?{transpose:t.transpose}:{},...t.degree?{values:{mul:1,add:t.degree}}:{}}}let n=t.slice(0,-1);e.skipSpace(),e.peek()!==`&`&&!e.text.startsWith(`degree(`,e.i)&&!e.text.startsWith(`inverse(`,e.i)&&e.fail(n===`degree`?`degree(&cell, n): a cell, then how many steps of its table up (−n down)`:`inverse(&cell): a cell, mirrored round 0`,e.i);let r=Fl(e);e.skipSpace();let i=r.values??{mul:1,add:0},a;if(n===`degree`){e.expect(`,`,`',' then the steps: degree(&${r.name}, 1)`),e.skipSpace();let t=e.match(/[-+]?\s*[0-9]+(?![0-9.])/y);t===null&&e.fail(`degree(&${r.name}, n) moves it n whole steps of its table, a whole number: degree(&${r.name}, 1), degree(&${r.name}, -2)`,e.i),a={mul:i.mul,add:i.add+parseInt(t.replace(/\s+/g,``),10)}}else a={mul:i.mul===1?-1:1,add:-i.add};return e.skipSpace(),e.expect(`)`,`')' to close ${n}(…)`),{kind:`ref`,name:r.name,pick:r.pick,shift:r.shift,...r.slot?{slot:r.slot}:{},...r.transpose?{transpose:r.transpose}:{},...a.mul===1&&a.add===0?{}:{values:a}}}function Il(e,t){let n=e.peek();if(n===`&`||e.text.startsWith(`degree(`,e.i)||e.text.startsWith(`inverse(`,e.i))return Fl(e);if(n===`~`)return e.i++,{kind:`rest`};if(n===`=`)return e.i++,{kind:`rest`,keep:!0};if(n===`_`)return e.i++,{kind:`rest`,hold:!0};if(n===`[`)return Dl(e.text,e.i)?Ol(e):Ll(e,t);if(n===`<`)return Rl(e,t);if(n===`-`||n===`.`||n>=`0`&&n<=`9`){let t=e.num(`a number`),n=e.match(/[#bsf]+(?![A-Za-z0-9_])/y)??``,r=t.alter+[...n].reduce((e,t)=>e+(t===`#`||t===`s`?1:-1),0);return{kind:`note`,value:t.value,alter:r}}let r=e.noteName();if(r!==null)return{kind:`note`,value:r,alter:0,pitched:!0};let i=e.match(Ml);return i===null?e.fail(`Unexpected '${n}' — expected a number, a note name (C, F#), ~, [chord], &cell or key=value`):{kind:`note`,value:Fa[i],alter:0}}function Ll(e,t){let n=e.i;t>=32&&e.fail(`Brackets nest 32 deep at most: name the inner steps (&inner 0 2) and splice them`,n,1),e.i++;let r=[[]],i=null;for(;;){e.skipSpace();let a=e.peek();if(a===`]`)break;if(a===``&&e.fail(i===`|`?`']' to close the choice: [0|4|7]`:`']' to close the bracket: [0 2] · [0, 4]`,n,e.i-n),a===`,`||a===`|`){i!==null&&i!==a&&e.fail(`A bracket is a chord or a stack (commas) or a choice (bars), not both: [0, 4] · [0|4]`,e.i,1),r[r.length-1].length||e.fail(a===`,`?`A step before the comma: [0, 4]`:`A step before the bar: [0|4] · [0 2|4]`,e.i,1),i=a,r.push([]),e.i++;continue}Vl(e,r[r.length-1],Ul(e,t+1))}e.i++,r[r.length-1].length||e.fail(i===null?`Empty brackets: [0 2] is a subsequence, [0, 2] a chord`:i===`,`?`A step after the comma: [0, 4]`:`A step after the bar: [0|4] · [0 2|4]`,n,e.i-n);let a=e=>e.repeat===1&&e.subdivide===1&&e.elongate===1&&e.chance===void 0,o=r.every(e=>e.length===1&&a(e[0])&&e[0].atom.kind===`note`),s=r.map(e=>e[0].atom);if(i===`|`)return o&&!s.some(e=>e.pitched)?{kind:`choice`,values:s.map(e=>e.value),alters:s.map(e=>e.alter)}:{kind:`seq`,layers:r,mode:`choose`};if(o){let e=s.map(e=>!!e.pitched);return{kind:`chord`,notes:s.map(e=>e.value),alters:s.map(e=>e.alter),...e.some(Boolean)?{pitched:e}:{}}}return{kind:`seq`,layers:r}}function Rl(e,t){let n=e.i;t>=32&&e.fail(`Brackets nest 32 deep at most: name the inner steps (&inner 0 2) and splice them`,n,1),e.i++;let r=[[]];for(;;){e.skipSpace();let i=e.peek();if(i===`>`)break;if(i===``&&e.fail(`'>' to close the alternation: <0 2 4>`,n,e.i-n),i===`|`&&e.fail(`An alternation takes steps, stacked with commas (<0 2, 4 5>); a choice goes in square brackets: [0 2|4]`,e.i,1),i===`,`){r[r.length-1].length||e.fail(`A step before the comma: <0 2, 4 5>`,e.i,1),r.push([]),e.i++;continue}Vl(e,r[r.length-1],Ul(e,t+1))}return e.i++,r[r.length-1].length||e.fail(r.length>1?`A step after the comma: <0 2, 4 5>`:`An empty alternation: <0 2 4> plays one of its steps a lap`,n,e.i-n),{kind:`seq`,layers:r,mode:`alt`}}function zl(e){let t=e.i;e.i++;let n=[];for(;e.skipSpace(),n.push(e.int(`a whole number in x(k, n, r)`)),e.skipSpace(),e.peek()===`,`;)e.i++;e.expect(`)`,`')' to close x(k, n, r)`);let[r,i,a=0]=n;(n.length<2||n.length>3||!(i>=1&&i<=4096)||!(r>=0&&r<=i))&&e.fail(`x(k, n, r): k hits spread evenly over n parts of the step (0 ≤ k ≤ n), turned right by r: 0(3,8), &bd(3,8,2)`,t,e.i-t);let o=Ja(r,i);return{k:r,n:i,r:a,hits:Array.from({length:i},(e,t)=>t).filter(e=>o[((e-a)%i+i)%i])}}let Bl=1e4;function Vl(e,t,n){if(!(n.atom.kind===`rest`&&n.atom.hold)){t.push(n);return}let r=n.span.col-1-e.offset,i=t[t.length-1];(n.repeat!==1||n.subdivide!==1||n.elongate!==1||n.chance!==void 0)&&e.fail(`_ lengthens the step before it by one, and takes no modifiers: 0 _ _ is 0@3`,r,n.span.len),i||e.fail(`_ lengthens the step before it: 0 _ _ is 0@3 (in a cell with base=, = keeps a step of the base)`,r,n.span.len),i.repeat!==1&&e.fail(`_ after x!n would lengthen only the last copy: write the copies out, or x@n`,r,n.span.len),t[t.length-1]={...i,elongate:i.elongate+1,span:{...i.span,len:n.span.col-i.span.col+n.span.len}}}let Hl={"!":{field:`repeat`,syntax:W(`modifier`,`x!n`,`Repeat: n copies of the step, each as long as one.`,[`&beat step=4 0!4 2!2`],`cell.md`)},"*":{field:`subdivide`,syntax:W(`modifier`,`x*n`,`Ratchet: the step played n times within its own length.`,[`&hats step=2 0 0*2 0 0*3`],`cell.md`)},"@":{field:`elongate`,syntax:W(`modifier`,`x@n`,`Hold: the step lasts n steps.`,[`&tune step=2 0@2 2 4@3`],`cell.md`)}};function Ul(e,t=0){let n=e.i,r=Il(e,t),i=e.span(n),a={repeat:1,subdivide:1,elongate:1},o,s,c,l=/* @__PURE__ */ new Set;r.kind===`ref`&&(s=El(e));let u=e.peek()===`(`?zl(e):void 0;for(;e.peek()in Hl||e.peek()===`?`||e.peek()===`/`;){if(e.peek()===`/`){c!==void 0&&e.fail(`'/' can only appear once per step`),e.i++;let t=e.i,n=e.int(`a count after /`);(n<1||n>4096)&&e.fail(`Count must be between 1 and ${Bc}`,t,e.i-t),c=n;continue}if(e.peek()===`?`){o!==void 0&&e.fail(`'?' can only appear once per step`),e.i++;let t=e.i,n=e.match(/(?:0?\.[0-9]+|0|1(?:\.0+)?)(?![0-9])/y);o=n===null?null:parseFloat(n),n===null&&/[0-9]/.test(e.peek()??``)&&e.fail(`A probability is from 0 to 1: x?.3`,t,1);continue}let t=e.peek();l.has(t)&&e.fail(`'${t}' can only appear once per step`),l.add(t),e.i++;let n=e.i,r=e.int(`a count after ${t}`);(r<1||r>4096)&&e.fail(`Count must be between 1 and ${Bc}`,n,e.i-n),a[Hl[t].field]=r}if(e.peek()===`(`&&e.fail(`A euclid goes straight after its step, before its other modifiers: 0(3,8)*2`),!e.atBoundary()&&!(t>0&&/[\],|>]/.test(e.peek()))&&e.fail(`Unexpected '${e.peek()}' — separate steps with spaces`),u||c!==void 0){r.kind===`rest`&&(r.hold||r.keep)&&e.fail(`${r.hold?`_`:`=`} takes no euclid and no /n: put them on the step it stands for`,n,e.i-n);let t={...u?{euclid:u}:{},...c===void 0?{}:{slow:c}};r=r.kind===`seq`&&!r.bare?{...r,...t}:{kind:`seq`,layers:[[{atom:r,repeat:1,subdivide:1,elongate:1,span:i}]],...t,bare:!0}}return vs(r)>Bl&&e.fail(`A step comes round after ${Bl.toLocaleString(`en`)} laps at most: its <…> and /n multiplied out`,n,e.i-n),{atom:r,...a,...o===void 0?{}:{chance:o},...s===void 0?{}:{level:s},span:e.span(n)}}let Wl=e=>/^(?:pulse|beat|1m|(?:1|2|4|8|16|32|64)(?:n\.?|t))(?![A-Za-z0-9_.])/.test(e.text.slice(e.i));function Gl(e){let t=e.match(/(?:pulse|beat|1m|(?:1|2|4|8|16|32|64)(?:n\.?|t))(?![A-Za-z0-9_.])/y);if(t===null)return null;if(t===`pulse`||t===`beat`)return{written:t,kind:t};if(t===`1m`)return{written:t,kind:`bar`};let n=parseInt(t,10);return{written:t,kind:`note`,whole:t.endsWith(`.`)?3/(2*n):t.endsWith(`t`)?2/(3*n):1/n}}function Kl(e){let t=1,n=[];for(;e.peek()===`*`||e.peek()===`/`;){let r=e.text[e.i++],i=e.i,a=e.match(/[0-9]+(?:\.[0-9]+)?|\.[0-9]+/y);(a===null||!(parseFloat(a)>0))&&e.fail(`a positive number after ${r}`,i),t=r===`*`?t*parseFloat(a):t/parseFloat(a),n.push({op:r===`*`?`×`:`÷`,n:parseFloat(a)})}return{ratio:t,chain:n}}function ql(e,t){let n=e.i,r=t?`loop`:`step`,i=t?null:Gl(e);if(i)return{whole:t,kind:`tap`,meter:null,tap:i,...Kl(e),span:e.span(n)};if(e.text.startsWith(`free(`,e.i)){let r=ja(e,t?`loop`:`step`,!0),i=Oa(r.value,r.unit);return i>0||e.fail(`A rate must be positive`,n,e.i-n),{whole:t,kind:`rate`,perSecond:i,span:e.span(n),free:r}}let a=e.match(/[0-9]+(?:\.[0-9]+)?|\.[0-9]+/y);if(a!==null){let i=Oa(parseFloat(a),e.match(Da));if(i>0||e.fail(`A rate must be positive`,n,e.i-n),/[A-Za-z.]/.test(e.peek())){let i=/^[^\s,\])]+/.exec(e.text.slice(n))[0];e.fail(t?`${r}=${i} is no rate: a number with its unit (loop=100bpm, loop=2hz)`:`${r}=${i} is no rate or tap: a tap reads a note value (1n 2n 4n 8n 16n 32n), a triplet (4t 8t 16t), a dotted one (2n. 4n. 8n.), 1m, pulse, beat, or another meter's (&bar2:16n)`,n,i.length)}return{whole:t,kind:`rate`,perSecond:i,span:e.span(n)}}let o=e.match(/[A-Z](?:[#b]?-?[0-9]+|[A-Z0-9_]*)(?![A-Za-z0-9_#])/y);if(o!==null)return{whole:t,kind:`env`,name:o,span:e.span(n)};e.peek()===`{`&&e.fail(`{&x} is now written cycle(&x)`);let s=e.match(/cycle\(/y)!==null,c=e.cellRef(s?`a cell inside cycle( ), like cycle(&theme)`:`a cell or a rate after ${r}=, like ${r}=&meter`,`in ${r}=`,!0);if((c.pick||c.shift)&&e.fail(`${r}= takes a whole cell`,c.span.col-1,c.span.len),s&&e.expect(`)`,`')' to close cycle(&${c.name})`),!s&&!t&&e.peek()===`:`){e.i++;let r=Gl(e);return r||e.fail(`&${c.name}: taps a meter by pulse, beat or a note value (&${c.name}:pulse, &${c.name}:beat, &${c.name}:16n, &${c.name}:1m)`),{whole:t,kind:`tap`,meter:c,tap:r,...Kl(e),span:e.span(n)}}return{whole:t,kind:`driven`,driver:c,cycle:s,...Kl(e),span:e.span(n)}}let Jl={amp:W(`map`,`map=amp`,`A volume: its values multiply the level (on a voice, the braid as a waveform, its range onto −1…1; the default).`,[`&accent map=amp step=&bar*4 1 .4 .8 .4`],`sound.md`),lin:W(`map`,`map=lin`,`As amp, ramping from each value to the next: a glide, a triangle. In a mix it is plain: a volume in a product, a pitch in a sum.`,[`&swell map=lin loop=&bar/8 .2 1`],`sound.md`),db:W(`map`,`map=db`,`A volume in decibels (0 as it is, −6 about half).`,[`&fade map=db step=&bar 0 -6 -12`],`sound.md`),adsr:W(`map`,`map=adsr a d s r`,`An envelope: attack, decay, release in seconds, sustain a level; one per note.`,[`&pluck map=adsr .01 .3 .5 .4`],`sound.md`),sample:W(`map`,`map=sample`,`The sound card: its entries are channels, one (mono) or two (left, right).`,[`&out loop=SAMPLE_RATE map=sample &left &right`],`mix.md`),midi:W(`map`,`map=midi`,`A MIDI card: its entries are MIDI channels, in order (~ skips one); a voice only here is sent and heard, at its entry's gain.`,[`&synth map=midi [&theme * &reed] [&bass * &sub] ~!7 &groove`],`midi.md`),edo:W(`map`,`map=edo`,`A grid: cycle= equal steps to the octave.`,[`&edo19 cycle=19 map=edo`],`tuning.md`),ratios:W(`map`,`map=ratios`,`A grid of ratios: one period's tones, then the period (the last).`,[`&just map=ratios 1 9/8 5/4 4/3 3/2 5/3 15/8 2`],`tuning.md`),style:W(`map`,`map=style`,`A style: a point in style space, one value an axis in the table's order (sync harm artic energy, each 0 to 1), or each by its name (sync=.3); it doesn't sound. A pick reads an axis by name: &funk[artic].`,[`&funk map=style .3 .45 .55 .55`,`&funk map=style sync=.3 harm=.45 artic=.55 energy=.55`],`style.md`),role:W(`map`,`map=role`,`A role: its name is the role, its entries the gates that play it (two entries, two players); a gate no role names plays as written.`,[`&comp map=role &violin2 &viola`],`mix.md`)},Yl=new RegExp(Object.keys(Jl).sort((e,t)=>t.length-e.length).join(`|`),`y`);function Xl(e){let t=e.i;if(e.peek()===`&`){let n=e.cellRef(`a table cell, like map=&curve`,`after map=`);return(n.pick||n.shift)&&e.fail(`map= takes a whole table`,n.span.col-1,n.span.len),{kind:`table`,table:n,span:e.span(t)}}if(e.match(/sin\b/y)&&e.fail(`map=sin is gone: write the sine as the braid, sin(12) — or map=&table`,t,3),e.match(/ed\(/y)){let n=e.i,r=e.match(/[0-9]+(?:\.[0-9]+)?(?:\/[0-9]+(?:\.[0-9]+)?)?/y),[i,a=`1`]=(r??``).split(`/`),o=parseFloat(i)/parseFloat(a);return(r===null||!(o>1))&&e.fail(`ed(r) divides a ratio above 1: ed(2) is the octave, ed(3/2) the fifth, ed(5)`,n),e.expect(`)`,`')' to close ed(…)`),{kind:`edo`,period:o,span:e.span(t)}}let n=e.match(Yl);return n===null&&e.fail(`map= takes ${Object.keys(Jl).join(`, `)}, ed(r), midi(c, p) or a table cell (&curve)`),n===`edo`?{kind:`edo`,period:2,span:e.span(t)}:n===`midi`?Zl(e,t):{kind:n,span:e.span(t)}}function Zl(e,t){if(e.peek()!==`(`)return{kind:`midi`,channel:null,port:1,span:e.span(t)};e.i++;let n=(t,n)=>{let r=e.i,i=e.match(/[0-9]+(?:\.[0-9]+)?/y),a=i===null?NaN:parseFloat(i);return Number.isInteger(a)&&a>=1&&a<=16||e.fail(`${t} is a whole number from 1 to 16: ${n}`,r,Math.max(1,i?.length??1)),a},r=n(`A MIDI channel`,`map=midi(10)`),i=1;return e.match(/\s*,\s*/y)!==null&&(i=n(`A MIDI output slot`,`map=midi(10, 2)`)),e.expect(`)`,`')' to close midi(…)`),{kind:`midi`,channel:r,port:i,span:e.span(t)}}let Ql=[`braid`,`pattern`,`equal`,`notes`,`midi`,`do`,`degrees`,`table`,`scale`,`mode`,`key`,`grid`,`meter`,`spectrum`,`wave`,`levels`,`adsr`,`mix`,`note`,`petal`,`off`,`matrix`,`lfo`,`brightness`],$l={notes:[`flats`,`sharps`,`german`],do:[`fixed`,`movable`]},eu=e=>(t,n,r,i)=>{n[e]=t.text.startsWith(`free(`,t.i)?Math.round(ja(t,e,!1).value):t.int(`a whole number after ${e}=`),n.paramSpans[e]=t.place(i)},tu=(e,t)=>(n,r,i,a)=>{let o=n.i,s=n.match(/"([^"]*)"/y);if(s===null&&n.fail(`${e}= takes a text in quotes: ${t}`),r[e]=s.slice(1,-1),e!==`label`&&(r.paramSpans[e]=n.place(a)),e===`label`)for(let e of s.matchAll(/\{(?:&[A-Za-z_][A-Za-z0-9_]*:)?([A-Za-z_][A-Za-z0-9_]*)\}/g))fl.includes(e[1])||n.warn(`{${e[1]}} isn't a label field: it shows as written (the fields: ${fl.map(e=>`{${e}}`).join(` `)})`,o+e.index,e[0].length)},nu=e=>(t,n)=>{n[e]=t.cellRef(`a cell after ${e}=, like ${e}=&pluck or ${e}=&(map=adsr .01 .3 .5 .4)`,`after ${e}=`)},ru=(e,t,n)=>{t.step=ql(e,n===`loop`)},iu={over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{}},au={over:{form:`over=&table · over=&table[<<n] · over=scale(name, tonic)`,examples:[`&tune over=&major step=2 0 2 4`,`&mode over=&major[<<2] 0 2 4`,`&tune over=scale(minor, A) step=2 0 2 4`,`&bass over=&key step=16n 0 4 7`],read:(e,t)=>{let n=/key(?![A-Za-z0-9_])/y;if(n.lastIndex=e.i,n.test(e.text)){let n=e.i;e.i+=3,e.peek()===`[`&&e.fail(`over=key is the old way: name the key, and turn it there (over=&key[<<2])`,e.i,1),t.over={name:cl,pick:null,shift:0,span:e.place(n)}}else if(e.text.startsWith(`scale(`,e.i)){let n=e.i;e.i+=5;let r=so(e,n),i=`scale:λ${e.line}_${n+e.offset}`;e.lambdas.push({...iu,name:i,span:r.span,lambda:e.text.slice(n,e.i),over:r.key,braid:{kind:`scan`,steps:r.steps,span:r.span,...r.mode?{mode:r.mode}:{}}}),t.over={name:i,pick:null,shift:0,span:r.span}}else t.over=e.cellRef(`a cell or scale(name, tonic) after over=, like over=&key or over=scale(minor, A)`,`after over=`);t.over.pick&&e.fail(`over= takes a whole table (shifting it is fine: over=&scale[<<])`,t.over.span.col-1,t.over.span.len)}},base:{form:`base=&cell · base=&cell^$n · base=&cell^n`,examples:[`&answer base=&subject^$7 =!3 12@2`,`&last base=&subject =!21 3@2`],read:(e,t)=>{t.base=e.ref(`a cell after base=, like base=&subject or base=&subject^$7`),t.base.pick&&e.fail(`base= takes a whole cell (transposing it is fine: base=&subject^$7)`,t.base.span.col-1,t.base.span.len)}},step:{form:`step=…`,examples:[`&tune step=4n 0 2 4`,`&tune step=&clock 0 2 4`],read:ru},loop:{form:`loop=…`,examples:[`&lead s=saw loop=C4`],read:ru},shift:{form:`shift=n · shift=free(n, lo..hi)`,examples:[`&mode over=&major shift=5 0 2 4`,`&key shift=free(0, 0..11)`],read:eu(`shift`)},stride:{form:`stride=n · stride=free(n, lo..hi)`,examples:[`&key step=cycle(&theme) stride=7`],read:eu(`stride`)},map:{form:`map=…`,examples:[`&accent map=amp step=&bar 1 .5`],read:(e,t)=>t.map=Xl(e)},show:{form:`show=kind · show=notes:convention · show=do:convention · show=mix:&grid`,examples:[`&tune show=notes step=2 0 2 4`,`&tune show=notes:german step=2 0 2 4`,`&tune show=do:movable step=2 0 2 4`,`&band show=mix:&edo19 [&a, &b]`],read:(e,t)=>{let n=e.i,r=e.match(/[a-z]+/y);r===null&&e.fail(`show= takes one of: ${Ql.join(` `)}, or a plugin of the piece`,n,1);let i=``;if(r===`mix`&&e.peek()===`:`&&!e.text.startsWith(`:&`,e.i)&&e.fail(`show=mix:&grid: the grid whose colours the mix wears, like show=mix:&edo19 (no space after the colon)`,n,e.i+1-n),r===`mix`&&e.text.startsWith(`:&`,e.i)){e.i+=2;let r=e.match(Lc);r===null&&e.fail(`show=mix:&grid: the grid whose colours the mix wears, like show=mix:&edo19`,n,e.i-n),t.show=`mix:&${r}`,t.paramSpans.show=e.span(n);return}if(e.peek()===`:`){e.i++;let t=e.match(/[a-z]+/y)??``;$l[r]?.includes(t)||e.fail(`show=${r}: takes ${r===`notes`?`flats, sharps or german`:r===`do`?`fixed or movable`:`no convention`}`,n,e.i-n),i=`:${t}`}t.show=r+i,t.paramSpans.show=e.span(n)}},label:{form:`label="text"`,examples:[`&theme label="the King's theme" step=2 0 2 4`,`&note label="A note in the graph: alone on its cell."`],read:tu(`label`,`label="the King's theme"`)},env:{form:`env=&envelope`,examples:[`&lead s=saw loop=C4 env=&(map=adsr .01 .3 .5 .4)`],read:nu(`env`)},pitch:{form:`pitch=&vibrato · pitch=lo..hi * &shape`,examples:[`&lead s=saw loop=C4 pitch=&(loop=5 0 .1 -.1)`,`&bd s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0)`],read:(e,t,n,r)=>/^[0-9.]+\.\./.test(e.text.slice(e.i))?du(e,t,n):nu(`pitch`)(e,t,n,r)},cycle:{form:`cycle=n`,examples:[`&key step=cycle(&theme) stride=7 cycle=12`,`&edo19 cycle=19 map=edo`],read:(e,t)=>{let n=e.i;t.cycle=e.int(`a whole number after cycle=`),t.cycle<1&&e.fail(`cycle must be at least 1`,n,e.i-n),t.cycle>5e4&&e.fail(`cycle=${t.cycle}: at most ${ul.toLocaleString(`en`)}, the most steps a cell can hold (a grid's to its period, a table's turns before it comes round)`,n,e.i-n)}},size:{form:`size=x`,examples:[`&theme size=2 step=2 0 2 4`],read:(e,t)=>{let n=e.i,r=e.match(/[0-9]*\.?[0-9]+/y);(r===null||!(+r>=.25&&+r<=4))&&e.fail(`size= is how large it is drawn, from .25 to 4: size=2`,n,Math.max(1,(r??``).length)),t.size=+r}},laps:{form:`laps=n`,examples:[`&bar scan(4 4 4 4) step=84bpm laps=30`],read:(e,t,n,r)=>{let i=e.match(/[0-9]+/y);(i===null||!(parseInt(i,10)>=1))&&e.fail(`laps= takes a count of laps, 1 or more: laps=1`,r,n.length+1),t.laps=parseInt(i,10)}},chance:{form:`chance=p · chance=free(p, 0..1)`,examples:[`&ghost chance=.8 step=4 0? 0? 0? 0?`,`&ghost chance=free(.7, 0..1) step=4 0? 0?`],read:(e,t)=>{if(e.text.startsWith(`free(`,e.i))t.chance=ja(e,`chance`,!1).value;else{let n=e.i,r=e.match(/(?:0?\.[0-9]+|0|1(?:\.0+)?)(?![0-9])/y);r===null&&e.fail(`chance= is a probability from 0 to 1: chance=.3, or chance=free(.3, 0..1)`,n,1),t.chance=parseFloat(r)}}},seed:{form:`seed=n`,examples:[`&ghost seed=7 step=4 0? 0? 0? 0?`],read:(e,t)=>t.seed=e.int(`a whole number after seed=`)},title:{form:`title="text"`,examples:[`&piece title="Swing blues" tags="genre:jazz, rhythm" label="A blues in F."`],read:tu(`title`,`title="Swing blues"`)},tags:{form:`tags="tag, tag"`,examples:[`&lead tags="melody" s=saw loop=C4`,`&beam tags="metal" map=ratios 1 2.756 5.404`],read:tu(`tags`,`tags="jazz, blues"`)},tier:{form:`tier=n`,examples:[`&piece title="Steps: a tune on one line" tags="tutorial" tier=1 label="Numbers, rests, holds and repeats."`],read:(e,t,n,r)=>{let i=e.match(/[0-9]+(?![0-9.])/y);(i===null||!(parseInt(i,10)>=1&&parseInt(i,10)<=9999))&&e.fail(`tier= is a tier of the tutorial, 1 to 9999: tier=1`,r,n.length+1),t.tier=parseInt(i,10),t.paramSpans.tier=e.place(r)}},style:{form:`style=&s · style=[&a * w, &b * w] · style=a..b · style=a..b * &curve`,examples:[`&style label="Funk" style=&funk`,`&style label="close to Funk, then Bossa nova" style=[&funk * .8, &bossa * .2]..&bossa`],read:(e,t,n,r)=>{let i=ou(e),a=null,o=null;e.text.startsWith(`..`,e.i)&&(e.i+=2,a=ou(e),/^\s*\*\s*&/.test(e.text.slice(e.i))&&(e.skipSpace(),e.i++,e.skipSpace(),o=e.cellRef(`a curve after style=a..b *, like * &rise`,`in style=`))),t.style={from:i,to:a,...o?{curve:o}:{},span:e.place(r)}}},about:{form:`about=&cell · about=(&a &b …)`,examples:[`&fenvNote label="The filter opens on every note." about=&fenv`,`&why label="Two cells at once." about=(&fenv &accent)`],read:(e,t,n,r)=>{let i=`a cell after about=, like about=&fenv or about=(&fenv &accent)`,a=[];if(t.about=a,e.peek()===`(`){for(e.i++,e.skipSpace();e.peek()!==`)`;)e.done()&&e.fail(`')' to close about=(…)`),a.push(e.cellRef(i,`in about=`)),e.skipSpace();e.i++,a.length===0&&e.fail(i,r,n.length+1)}else a.push(e.cellRef(i,`in about=`))}}};function ou(e){let t=`a style after style=, like style=&funk, style=&(map=style .3 .45 .55 .55) or style=[&funk * .8, &bossa * .2]`;if(e.peek()!==`[`)return{kind:`cell`,ref:e.cellRef(t,`in style=`)};e.i++;let n=[];for(;;){e.skipSpace();let r=e.cellRef(t,`in style=[…]`);if(e.skipSpace(),e.expect(`*`,`'*' and a weight after &${r.name}: style=[&${r.name} * .8, …]`),e.skipSpace(),n.push({ref:r,weight:e.num(`a weight after &${r.name} *`).value}),e.skipSpace(),e.peek()===`,`){e.i++;continue}return e.expect(`]`,`']' to close style=[…]`),{kind:`mix`,terms:n}}}let su={fm:`a voice after fm=, like fm=&op`,write:`what the tape records, like write=&melody`,play:`the tape it reads, like play=&tape, or the notes a gate plays, like play=&tune`,couple:`the resonator it shares a table with, like couple=&fork`,excite:`what drives it, like excite=&mix`,trigger:`the melody whose notes it plays with, like trigger=&tune`,velocity:`a level cell, like velocity=&accent`,gate:`a level cell, like gate=&duck`},cu=(e,t,n)=>{if(n===`play`)return lu(e,t);let r=e.cellRef(su[n],`after ${n}=`);t.params[n]=r.name,t.paramSpans[n]=r.span};function lu(e,t){let n=e.i,r=e.ref(su.play);if(e.rejectTap(n),t.params.play=r.name,t.paramSpans.play=r.span,r.transpose||r.degree){let i=e.text.lastIndexOf(`^`,e.i-1);t.playMove={...r.transpose?{transpose:r.transpose}:{},...r.degree?{degree:r.degree}:{},at:i,len:e.i-i,as:e.text.slice(n,e.i)}}}let uu=(e,t,n)=>{if(!/^[1-9][0-9]*(?:n\.?|t):/.test(e.text.slice(e.i)))return du(e,t,n);let r=e.i,i=[];for(;;){let t=e.match(/[1-9][0-9]*(?:n\.?|t)(?=:)/y);t===null&&e.fail(`a level after the comma, a note value and a share: ${n}=8n:.6,16n:.55`),e.i++;let a,o=e.text.startsWith(`free(`,e.i);if(o){let t=ja(e,`param`,!1);t.param=n,a=t.value,(i.length||e.peek()===`,`)&&e.fail(`a share left free(…) is one level alone: ${n}=8n:free(.5, .5..75)`,r,e.i-r)}else if(n===`legato`){let n=e.match(/(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?![0-9.])/y);n===null&&e.fail(`a share after ${t}:, of each note's held length (.5 staccato, 1 as written): legato=${t}:.5`),a=parseFloat(n)}else{let n=e.i,r=e.match(/[0-9]+\/[0-9]+(?![0-9.])/y);if(r!==null){let[i,o]=r.split(`/`).map(Number);o===0&&e.fail(`a share's denominator can't be 0: swing=${t}:2/3`,n,r.length),i>o&&e.fail(`a share is from 0 to 1, and ${r} is above it: swing=${t}:2/3`,n,r.length),a=i/o}else{let n=e.match(/(?:0?\.[0-9]+|0|1(?:\.0+)?)(?![0-9])/y);n===null&&e.fail(`a share after ${t}:, from 0 to 1, a decimal or a fraction (.5 straight, .67 or 2/3 the triplet swing): swing=${t}:2/3`),a=parseFloat(n)}}let s=!1;if(e.peek()===`:`){let i=e.i;e.i++;let a=e.match(/[a-z]+/y);a!==`pairs`&&e.fail(`after a share, :pairs leans a level's pairs alone and keeps its groups of three straight: swing=${t}:2/3:pairs`,i,1+(a?.length??0)),n===`legato`&&e.fail(`:pairs is swing='s, a level's pairs leaning alone; a legato= share holds every note of its level: legato=${t}:.5`,i,6),s=!0,o&&e.peek()===`,`&&e.fail(`a share left free(…) is one level alone: ${n}=8n:free(.5, .5..75)`,r,e.i-r)}if(i.push({level:t,share:a,...s?{pairs:s}:{}}),e.peek()!==`,`)break;e.i++}n===`legato`?t.legato=i:(t.swing=i,t.params[n]=i[0].share),t.paramSpans[n]=e.span(r)};function du(e,t,n){let r=e.i;if(n===`level`&&(e.peek()===`&`||/^(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)\s*\*/.test(e.text.slice(e.i)))){let i=[],a=1;for(let t=!0;;t=!1){let n=e.i;if(!t){if(e.skipSpace(),e.peek()!==`*`){e.i=n;break}e.i++,e.skipSpace()}let r=e.match(/(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y);r===null?i.push(e.cellRef(`a level cell or a number, like level=&accent*&duck*.4`,`in level=`)):a*=parseFloat(r)}t.paramCells[n]={range:null,factors:i,span:e.span(r)},a!==1&&(t.params[n]=a),t.paramSpans[n]=e.span(r);return}if((e.peek()===`&`||Wl(e))&&Yc.has(n)){let i=ql(e,!1);i.kind!==`driven`&&i.kind!==`tap`&&e.fail(`${n}= takes seconds, a clock or a tap: ${n}=&bar*2, ${n}=8n`,r,e.i-r),t.paramClocks[n]=i,t.paramSpans[n]=e.span(r);return}if(e.text.startsWith(`free(`,e.i)){let i=ja(e,`param`,!1);i.param=n,t.params[n]=i.value,t.paramSpans[n]=e.span(r);return}let i=e.text.slice(e.i).match(/^([0-9]+(?:\.[0-9]+)?|\.[0-9]+)\.\.([0-9]+(?:\.[0-9]+)?|\.[0-9]+)/);if(e.peek()===`&`||i){i&&(e.i+=i[0].length);let a=[];for(i||a.push(e.cellRef(`a cell after ${n}=`,`in ${n}=`));;){let t=e.i;if(e.skipSpace(),e.peek()!==`*`){e.i=t;break}e.i++,e.skipSpace(),a.push(e.cellRef(`a cell after *, like ${n}=200..3000 * &fenv`,`in ${n}=`))}i&&a.length===0&&e.fail(`${n}=${i[0]}: a range is scaled by cells — ${n}=${i[0]} * &fenv`,r,e.i-r),!i&&a.length>1&&e.fail(`${n}=: several cells multiply a range — ${n}=200..3000 * &a * &b`,r,e.i-r),t.paramCells[n]={range:i?[parseFloat(i[1]),parseFloat(i[2])]:null,factors:a,span:e.span(r)},t.paramSpans[n]=e.span(r);return}let a=e.match(/-?[A-Za-z0-9_.]+/y);a===null&&e.fail(`Expected a value after ${n}=`),t.params[n]=/^-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/.test(a)?parseFloat(a):a,t.paramSpans[n]=e.span(r)}let fu={init:`init= is now shift=`,out:`out= is now a command: out(voice, &cell) / step(&meter, bpm=…)`,time:`time= is now a command: out(voice, &cell) / step(&meter, bpm=…)`,rung:`rung= is now tier= (decision 020): the tutorial is in tiers, tier=1 to tier=9`,...ol};function pu(e){let t=e.i;e.i+=5,e.peek()===`"`&&e.fail(`free("…") is a text, for spell(…): a braid left free is steps, free(0 2 4 ~)`,t,6);let n=e.text.indexOf(`)`,e.i);n<0&&e.fail(`')' to close free(…)`,t,e.i-t);let r=e.within(e.text.slice(e.i,n),e.i),i=[];for(;r.skipSpace(),!r.done();){let e=r.i,t=Ul(r);G(t.atom).some(e=>e.kind!==`note`&&e.kind!==`rest`&&e.kind!==`chord`)&&r.fail(`A braid left free holds steps: numbers, rests (~), chords ([0,4]) and subsequences of them ([0 2]), held (@n) or repeated (!n)`,e,r.i-e),Vl(r,i,t)}i.length||e.fail(`free(…) around a braid needs steps: free(0 2 4 ~)`,t,n-t+1),e.i=n+1;let a=i.reduce((e,t)=>e+t.repeat*t.elongate,0);return e.frees.push({key:`braid`,value:0,unit:``,lo:0,hi:a,span:e.place(t),braid:r.text.trim().replace(/\s+/g,` `)}),{kind:`list`,tokens:i}}function mu(e,t){let n={over:null,base:null,shift:null,cycle:null,step:null,map:null,stride:null,env:null,pitch:null,show:null,label:null,laps:null,title:null,tags:null,tier:null,about:null,style:null,chance:null,seed:null,size:null,swing:null,legato:null,params:{},paramSpans:{},paramCells:{},paramClocks:{},playMove:null},r=/* @__PURE__ */ new Map,i=!1,a=!1,o=[],s=null,c=null,l=null,u=!1,d=-1,f=``,p=/* @__PURE__ */ new Map;for(;!e.done();){let t=e.i,m=e.match(Lc);if(m!==null&&e.peek()===`=`){e.i++;let i=m in au||m in Gc?m:Kc[m]??null;if(i===null&&Sn.includes(m)){p.has(m)&&e.fail(`${m}= is given twice`,t,m.length);let n=e.i;e.num(`a number after ${m}= (an axis of a style, 0 to 1)`),p.set(m,{value:e.text.slice(n,e.i),at:t}),e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);continue}if(i===null){m in fu&&e.fail(fu[m],t,m.length);let n=tl(m);e.fail(`Unknown attribute ${m}=${n?` — did you mean ${n}=?`:``} (a cell: ${Object.keys(Wc).join(` `)}; a sound or a physical cell: ${Object.keys(Gc).join(` `)})`,t,m.length)}let a=i===`loop`?`step`:i;if(r.has(a)){let o=r.get(a);e.fail(a===`step`&&n.step.whole!==(m===`loop`)?`step= and loop= say the same thing two ways — pick one`:o===m?`${m}= is given twice`:`${m}= and ${o}= are one parameter, ${i}= — given twice`,t,m.length)}r.set(a,m),m===`clip`&&e.warn(`clip= is Strudel's name for legato= — write legato= (Normalise rewrites it)`,t,m.length),(au[i]?.read??(i===`swing`||i===`legato`?uu:Jc.has(i)?cu:du))(e,n,i,t),e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);continue}if(m===`free`&&e.peek()===`(`){(s||o.length)&&e.fail(Aa,t,m.length),e.i=t,s=pu(e),u=!0,d=e.i,f=e.text.slice(t+5,e.i-1).trim();continue}if(m!==null&&mo(m)&&e.peek()===`(`){if((s||o.length)&&e.fail(u?Aa:`A cell has one braid: a generator or a list of steps`,t,m.length),m===`fifths`){let n=co(e,t);s=n.braid,l=n.shift}else if(m===`scale`){let n=so(e,t);s={kind:`scan`,steps:n.steps,span:n.span,...n.mode?{mode:n.mode}:{}},c=n.key}else s=ho(e,m,t);continue}if(m!==null&&Nl.includes(m)&&e.peek()===`(`){s&&e.fail(u?Aa:`A cell has one braid: a generator or a list of steps`),e.i=t,Vl(e,o,Ul(e));continue}if(m===`off`&&e.atBoundary()){i&&e.fail(`off is given twice`,t,m.length),i=!0;continue}if(m===`oneshot`&&e.atBoundary()){a&&e.fail(`oneshot is given twice`,t,m.length),a=!0;continue}if(m!==null&&(/^[A-G](?:b?-?[0-9]*)$/.test(m)||m===`_`||Object.hasOwn(Fa,m))?e.i=t:m!==null&&e.fail(`Unexpected '${m}'`,t,m.length),s&&u&&e.peek()===`)`&&e.fail(`A ')' with nothing to close: free(${f}) ends at its first ')'`,t,1),s&&t===d&&/[@!*/?:]/.test(e.peek())){let n=/^\S+/.exec(e.text.slice(t))[0];e.fail(`free(${f})${n}: a modifier goes on its steps, inside the parentheses: free([${f}]${n})`,t,n.length)}s&&e.fail(u?Aa:`A cell has one braid: a generator or a list of steps`,t,1),Vl(e,o,Ul(e))}if(p.size){let[t,{at:r}]=[...p][0];n.map?.kind!==`style`&&e.fail(`${t}= is an axis of a style: it goes on a map=style cell (&funk map=style sync=.3 harm=.45 artic=.55 energy=.55)`,r,t.length),(s||o.length)&&e.fail(`A style writes its axes by name (sync=.3) or in order (.3 .45 .55 .55), not both`,r,t.length);let i=Sn.filter(e=>!p.has(e));i.length&&e.fail(`A style names every axis: ${i.map(e=>`${e}=`).join(` `)} ${i.length===1?`is`:`are`} missing (its axes: ${Sn.join(` `)})`,r,t.length);for(let t of Sn){let{value:n,at:r}=p.get(t),i=e.within(n,r+t.length+1);Vl(i,o,Ul(i))}}let m=s??(o.length?{kind:`list`,tokens:o}:{kind:`blank`});if(a&&typeof n.params.glide==`number`&&n.params.glide>0){let t=n.paramSpans.glide;e.fail(`oneshot or glide=: a voice plays each note through, or ties them as one`,t?t.col-1:0,5)}l!==null&&l!==0&&(n.shift!==null&&e.fail(`fifths(n) turns it already: write fifths() and shift=, or fifths(n) alone`),n.shift=l),c&&(n.over&&e.fail(`scale(…) reads through a key of its own: drop over=, or write the key as a cell (&mode over=&key scan(…))`,n.over.span.col-1,n.over.span.len),n.over=c),n.playMove&&m.kind===`blank`&&e.warn(`${n.playMove.as} after play=: ^ and ^$ move what a gate plays (one with a braid: &out play=${n.playMove.as} &lead); a read head reads the tape itself, so the move is ignored`,n.playMove.at,n.playMove.len);let h=n.playMove&&m.kind!==`blank`?{...n.playMove.transpose?{transpose:n.playMove.transpose}:{},...n.playMove.degree?{degree:n.playMove.degree}:{}}:null,{over:g,base:_,shift:v,step:y,map:b,stride:x,cycle:S,env:C,pitch:w,show:T,label:E,title:D,tags:O,tier:k,about:ee,style:A,laps:j,chance:te,seed:M,size:ne,swing:N,legato:re,params:P,paramSpans:ie,paramCells:F,paramClocks:ae}=n;return{name:t.name,span:t.span,over:g,..._?{base:_}:{},shift:v,off:i,...a?{oneshot:a}:{},step:y,map:b,stride:x,cycle:S,env:C,pitch:w,show:T,label:E,title:D,tags:O,tier:k,about:ee??void 0,...A?{style:A}:{},laps:j,chance:te,seed:M,size:ne,...N?{swing:N}:{},...re?{legato:re}:{},params:P,paramSpans:ie,paramCells:F,paramClocks:ae,...h?{playMove:h}:{},braid:m,frees:[...e.frees]}}function hu(e){e.skipSpace(),e.text.startsWith(`&(`,e.i)&&e.fail(`An unnamed cell &( … ) goes where a cell is used; a line declares a named one: &name …`);let t=e.cellRef(`a cell name like &theme`,`names the line`);return(t.pick||t.shift)&&e.fail(`Brackets go where a cell is used (&x[0], &x[<<]), not where it is named — use shift= here`,t.span.col-1,t.span.len),e.peek()===`(`&&e.fail(`&name(…) is gone — write over=&…`),mu(e,t)}let gu=/^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20}|(?:rgb|rgba|hsl|hsla)\(\s*[-0-9.%\s,/]{1,40}\)|var\(--[a-z0-9-]{1,40}\))$/,_u=/^=== plugin ([a-z]+) ===\s*$/,vu=/^=== end ===\s*$/,yu=`=== plugin name === … === end ===`,bu=/^=== plugin /m;function xu(e,t=[],n=!1){if(!bu.test(e))return{text:e,plugins:[],diagnostics:[]};let r=e.split(`
`),i=[],a=[],o=(e,t,n=`error`)=>a.push({severity:n,message:t,span:{line:e,col:1,len:Math.max(1,r[e-1]?.length??1)}});for(let e=0;e<r.length;e++){let a=_u.exec(r[e]);if(!a){vu.test(r[e])&&o(e+1,`=== end === without a plugin block before it (${yu})`);continue}let s=e,c=s+1;for(;c<r.length&&!vu.test(r[c]);)c++;let l=r.slice(s+1,c).join(`
`);c<r.length||o(s+1,`plugin ${a[1]} has no === end === line`);let u=a[1];if(t.includes(u))o(s+1,`${u} is a show of its own: a plugin needs another name`);else if(i.some(e=>e.name===u))o(s+1,`plugin ${u} is written twice`);else{let e=Cu(u,l,s+1,n);typeof e==`string`?o(s+1,`plugin ${u}: ${e}`):i.push(e)}for(let e=s;e<=Math.min(c,r.length-1);e++)r[e]=``;e=c}return{text:r.join(`
`),plugins:i,diagnostics:a}}function Su(e){let t=e.indexOf(`{`);if(t<0||e.slice(0,t).trim())return null;let n=0,r=!1;for(let i=t;i<e.length;i++){let a=e[i];if(r)a===`\\`?i++:a===`"`&&(r=!1);else if(a===`"`)r=!0;else if(a===`{`)n++;else if(a===`}`&&--n===0)return{json:e.slice(t,i+1),rest:e.slice(i+1)}}return null}function Cu(e,t,n,r){let i=Su(t);if(!i)return`starts with its manifest, a { … } of JSON: { "fits": ["meter"], "size": 200 }`;let a;try{a=JSON.parse(i.json)}catch(e){return`its manifest is not JSON (${e.message})`}if(typeof a!=`object`||!a||Array.isArray(a))return`its manifest is an object`;let o=a,s=[`fits`,`size`,`rim`,`meaning`,`dial`,`tokens`],c=Object.keys(o).find(e=>!s.includes(e));if(c)return`its manifest has no "${c}" (it has: ${s.join(`, `)})`;if(!Array.isArray(o.fits)||!o.fits.length||!o.fits.every(e=>typeof e==`string`))return`"fits" lists the kinds of cell it shows: ["meter"]`;let l=o.size??200;if(typeof l!=`number`||!(l>=60&&l<=400))return`"size" is a number from 60 to 400`;if(o.rim!==void 0&&typeof o.rim!=`boolean`)return`"rim" is true or false`;if(o.meaning!==void 0&&typeof o.meaning!=`string`)return`"meaning" is a text`;let u=null;if(o.dial!==void 0){let e=o.dial;if(!(e&&typeof e==`object`&&typeof e.label==`string`&&typeof e.turn==`number`&&e.turn>0&&typeof e.key==`number`&&e.key>0))return`"dial" is { "label": "The day", "turn": 86400, "key": 3600 }: a name, seconds for a turn, seconds for a key press`;u={label:e.label,turn:e.turn,key:e.key}}let d={};if(o.tokens!==void 0){let e=o.tokens;if(!e||typeof e!=`object`||Object.values(e).some(e=>typeof e!=`string`||!gu.test(e)))return`"tokens" maps names to colours (#rgb, rgb(…), hsl(…), a name, var(--x)): { "sun": "#ffd84a" }`;if(Object.keys(e).includes(`__proto__`))return`"tokens": a token can't be called __proto__`;Object.assign(d,e)}return{name:e,fits:o.fits,size:l,rim:o.rim!==!1,meaning:o.meaning??``,dial:u,tokens:d,code:i.rest.replace(/^\n+|\s+$/g,``),builtin:r,line:n}}let wu=String.raw`
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
`,Tu=Object.freeze(xu(wu,[],!0).plugins.map(e=>Object.freeze({...e,tokens:Object.freeze({...e.tokens})})));function Eu(e){let t=[],n=[],{text:r,plugins:i,diagnostics:a}=xu(e,[...Ql,...Tu.map(e=>e.name)]),o=[...a],s=[],c=[],l=null;return r.split(`
`).forEach((e,t)=>{let n=Uc(e);l?(l.text+=` `,l.parts.push({line:t+1,start:l.text.length}),l.text+=n):l={text:n,line:t+1,parts:[{line:t+1,start:0}]},/[+*,[]\s*$/.test(l.text)||(c.push(l),l=null)}),l&&c.push(l),c.forEach(({text:e,line:r,parts:i})=>{let a=new Hc(e,r,0,[],i,o,0,mu);if(a.done())return;let c=sc(e);if(c!==void 0){let t=e.search(/\S/),i={line:r,col:t+1,len:e.trimEnd().length-t};c===null?o.push({severity:`error`,message:cc,span:i}):(n.push({id:c.id,names:c.names,span:i}),o.push({severity:`warning`,message:vc(c),span:i}));return}let l=gc(e);if(l!==void 0){let t=e.search(/\S/),i={line:r,col:t+1,len:e.trimEnd().length-t};l===null?o.push({severity:`error`,message:_c,span:i}):l.kind===`use`&&n.push({id:l.id,names:l.names,span:i});return}try{let e=a.i,n=a.match(Lc);if(n===`step`&&a.peek()===`(`)a.fail(`step(…) is now a rate on the meter: &meter scan(27 23 26 24) step=84bpm`,e,4);else if(n===`out`&&/^\s*[(=]/.test(a.text.slice(a.i)))a.fail(`out is a cell now: &mix [&theme * &lead, …] and &out loop=SAMPLE_RATE map=sample &mix &mix`,e,3);else if(n===`cell`)a.fail(`The cell keyword is gone: a line starting with &name declares a cell`,e,4);else if(n===null){a.i=e;let n=hu(a);t.push(n,...a.lambdas)}else a.fail(`A line declares a cell: &name …`,e,n.length)}catch(t){if(!(t instanceof Vc))throw t;o.push({severity:`error`,message:t.message,span:{line:r,col:t.col+1,len:t.len}});let n=/^\s*&([A-Za-z_][A-Za-z0-9_]*)/.exec(e)?.[1];n&&s.push(n)}}),js({cells:t,diagnostics:o,broken:s,plugins:i,...n.length?{uses:n}:{}})}function Du(e,t){let n=[...e.diagnostics],r=(e,t)=>n.push({severity:`error`,message:e,span:t}),i=(e,t)=>n.push({severity:`warning`,message:e,span:t}),a=(e,t)=>n.push({severity:`info`,message:e,span:t}),o=new Set(e.broken),s=/* @__PURE__ */ new Map,c=(e,t)=>{o.has(e)||(r(`Unknown cell &${e}`,t),s.set(e,[...s.get(e)??[],t]))},l=/* @__PURE__ */ new Set;return{parsed:e,env:t,diagnostics:n,error:r,warn:i,info:a,broken:o,unknown:s,unknownCell:c,rateOf:e=>{if(!e)return null;if(e.kind===`rate`)return e.perSecond;if(e.kind===`env`){let n=t[e.name]??yl(e.name,t.A4??440)??void 0;return typeof n==`number`&&n>0?n:(l.has(e)||r(`Unknown environment value ${e.name} (known: ${Object.keys(t).join(`, `)}, and note names like C4, F#3, Bb2)`,e.span),l.add(e),null)}return null}}}let Ou={line:1,col:1,len:1},ku=e=>e.over===null&&(e.braid.kind===`blank`&&(e.name===`fifths12TET`||e.map?.kind===`edo`)||e.map?.kind===`ratios`),Au=e=>ku(e)?null:e.over?.name??`fifths12TET`,ju=e=>e.map?.kind===`ratios`&&e.braid.kind===`list`?Math.max(1,e.braid.tokens.length-1):e.cycle??12,Mu=(e,t,n=0)=>{let r=e.get(t);if(!r||n>64)return 12;if(Au(r)===null)return ju(r);let i=r.braid;return i.kind===`scan`?i.steps.length:i.kind===`wave`?i.n:i.kind===`list`?i.tokens.reduce((e,t)=>e+G(t.atom).reduce((e,t)=>e+(t.kind===`note`?1:t.kind===`chord`?t.notes.length:0),0),0):Mu(e,Au(r),n+1)},Nu=(e,t)=>{let n=e=>({atom:e,repeat:1,subdivide:1,elongate:1}),r=e=>n({kind:`note`,value:e,alter:0}),i=t.braid,a=Au(t);return a===null?Array.from({length:ju(t)},(e,t)=>r(t)):i.kind===`list`?i.tokens.map(({atom:e,repeat:t,subdivide:n,elongate:r,chance:i,level:a})=>({atom:e,repeat:t,subdivide:n,elongate:r,...i===void 0?{}:{chance:i},...a===void 0?{}:{level:a}})):i.kind===`scan`?Ha(i.steps).positions.map(r):i.kind===`wave`?io(i.shape,i.n).map(r):Array.from({length:Mu(e,a)},(e,t)=>r(t))};function Pu(e){let{parsed:t,error:n,unknownCell:r}=e,i=/* @__PURE__ */ new Map,a=/* @__PURE__ */ new Set;for(let e of t.cells)i.has(e.name)?n(`&${e.name} is already defined on line ${i.get(e.name).span.line}`,e.span):i.set(e.name,e);let o=Ru(e,i);Fu(e,i),Iu(e,i),Lu(e,i);let s=Ku(i,n),c=Vu(i,a,n);Gu(e,i);let l=!i.has(sl);for(let e of i.keys())(e.startsWith(`key:`)||e.startsWith(`scale:`))&&a.add(e);let u=Bu(i);if(u){i.set(zu,{name:zu,span:u.voices[0].span,over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:{kind:`list`,tokens:u.voices.map(e=>({atom:{kind:`ref`,name:e.name,pick:null,shift:0},repeat:1,subdivide:1,elongate:1,span:e.span}))}});for(let[e,t]of u.cells)i.set(e,{...i.get(e),over:{name:zu,pick:null,shift:0,span:i.get(e).span},braid:{kind:`list`,tokens:t}});a.add(zu)}l&&i.set(sl,{name:sl,span:Ou,over:null,shift:null,off:!1,step:null,map:{kind:`edo`,period:2,span:Ou},stride:null,cycle:12,params:{},paramSpans:{},braid:{kind:`blank`}});let d=i.get(sl);ku(d)||n(`&${sl} is the default grid: give it only cycle= and shift=`,d.span);let f=/* @__PURE__ */ new Map,p=(e,t)=>{if(f.has(e))return f.get(e);let a=i.get(e),o=Au(a),s=!0;return o!==null&&(i.has(o)?t.includes(o)?(n(`over= loops: ${[...t.slice(t.indexOf(o)),e,o].map(e=>`&`+e).join(` → `)}`,a.over?.span??a.span),s=!1):s=p(o,[...t,e]):(r(o,a.over.span),s=!1)),f.set(e,s),s};for(let e of i.keys())p(e,[]);return{decls:i,implicit:a,implicitRoot:l,overOk:f,sections:s,stacks:c,...o?{mainKey:o}:{}}}function Fu(e,t){for(let[n,r]of t){if(!r.tonic)continue;let i=t.get(r.tonic.name);if(!i){e.unknownCell(r.tonic.name,r.tonic.span);continue}let a=i.braid.kind===`list`?i.braid.tokens:[],o=a.every(e=>e.subdivide===1&&e.atom.kind===`note`&&Number.isInteger(e.atom.value))?a:[],s=o[0]?.atom;if(s?.kind!==`note`||!i.step&&(o.length!==1||o[0].repeat!==1)){e.error(i.step?`&${i.name} holds a key's tonic (scale(…, &${i.name})), stepped: write a note a step, a name or a pitch class (&${i.name} step=1m/8 D F)`:`&${i.name} holds a key's tonic (scale(…, &${i.name})): write one note, a name or a pitch class (&${i.name} D, &${i.name} 2), or step it (&${i.name} step=1m/8 D F)`,i.span);continue}t.set(n,{...r,shift:Ma(s.value+s.alter,12)})}}function Iu(e,t){for(let[n,r]of t){if(r.braid.kind!==`scan`||!r.braid.mode)continue;let i=t.get(r.braid.mode.name);if(!i){e.unknownCell(r.braid.mode.name,r.braid.mode.span);continue}let a=i.braid.kind===`list`?i.braid.tokens:[],o=a.length===1&&a[0].repeat===1&&a[0].subdivide===1?a[0].atom:null,s=o?.kind===`note`&&!o.pitched&&o.alter===0?o.value:null;if(i.step||s===null||!Number.isInteger(s)||s<0||s>6){e.error(i.step?`&${i.name} holds a scale's mode (scale(&${i.name}, …)): a stepped mode is not yet a form; write one (&${i.name} dorian)`:`&${i.name} holds a scale's mode (scale(&${i.name}, …)): write one, a name or its phase from the darkest (&${i.name} major, &${i.name} dorian, &${i.name} 3)`,i.span);continue}t.set(n,{...r,braid:{...r.braid,steps:Ia(s)}})}}function Lu(e,t){for(let[n,r]of t){let i=r.paramCells?.swing;if(!i)continue;let[a]=i.factors,o=a&&t.get(a.name),{swing:s,...c}=r.paramCells,l=()=>t.set(n,{...r,paramCells:c});if(i.factors.length!==1||i.range||a.pick||a.shift){e.error(`swing= reads one cell, a swing alone: swing=&swing, with &swing swing=8n:2/3`,i.span),l();continue}if(!o){e.unknownCell(a.name,a.span),l();continue}if(o.braid.kind!==`blank`||o.step||o.over||o.map||typeof o.params.swing!=`number`||!Object.keys(o.params).every(e=>e===`swing`||e===`label`)){e.error(`&${o.name} holds a meter's swing (swing=&${o.name}): write a swing alone, &${o.name} swing=8n:2/3`,o.span),l();continue}t.set(n,{...r,params:{...r.params,swing:o.params.swing},paramSpans:{...r.paramSpans,swing:i.span},paramCells:c,...o.swing?{swing:o.swing}:{},swingFrom:a})}}function Ru(e,t){let n=[...t.values()].find(e=>!e.lambda&&!e.base&&e.over?.name.startsWith(`key:λ`))?.name??null;for(let r of[...t.values()])r.over?.name===`key:main`&&(n?(e.warn(`over=key is the old way: name the key, over=&${n}`,r.over.span),t.set(r.name,{...r,over:{...r.over,name:n}})):(e.error(`over=key is the old way, and the piece has no main key (the first scale(…) in the text) for it to read: name a key, over=&key, and write it (&key scale(major, C))`,r.over.span),e.broken.add(cl)));return n}let zu=`kit:voices`;function Bu(e){let t=e=>Object.keys(e?.params??{}).some(e=>Zc.has(e)),n=n=>t(e.get(n)),r=e=>!e.pick&&!e.shift&&!e.transpose&&!e.degree&&!e.values,i=new Set([...e.values()].flatMap(e=>e.over?[e.over.name]:[])),a=(e,i)=>{if(!e||e.over||e.map||t(e)||e.braid.kind!==`list`||e.braid.tokens.length===0||i.length>256||i.includes(e.name))return!1;let a=!1;for(let t of e.braid.tokens.flatMap(e=>G(e.atom)))if(t.kind!==`rest`){if(t.kind===`ref`&&n(t.name)&&r(t))a=!0;else if(t.kind===`ref`&&!t.shift&&!t.transpose&&!t.values&&s(t.name,[...i,e.name]))a=!0;else if(t.kind===`mix`&&t.exprs.every(e=>e.k===`ref`&&n(e.ref.name)&&r(e.ref)))a=!0;else return!1}return a},o=/* @__PURE__ */ new Map,s=(t,n)=>{if(o.has(t))return o.get(t);let r=e.get(t),s=r?.braid.kind===`list`&&r.braid.tokens.length===1&&r.braid.tokens[0].atom.kind===`mix`,c=!!r&&!r.step&&!s&&!i.has(t)&&a(r,n);return(n.length===0||c)&&o.set(t,c),c},c=[...e.values()].filter(e=>e.step&&a(e,[]));if(!c.length)return null;let l=[],u=(e,t)=>{let n=l.findIndex(t=>t.name===e);return n>=0?n:l.push({name:e,pick:null,shift:0,span:t})-1},d=/* @__PURE__ */ new Map,f=t=>{if(d.has(t.name)||t.braid.kind!==`list`)return;d.set(t.name,[]);let r=t=>{let i=t.atom,a=i;if(i.kind===`ref`&&n(i.name))a={kind:`note`,value:u(i.name,t.span),alter:0};else if(i.kind===`ref`)f(e.get(i.name));else if(i.kind===`mix`){let e=i.exprs,n=e.map(e=>u(e.ref.name,t.span)),r=e.some(e=>e.level!==void 0)?e.map(e=>e.level??1):void 0;a={kind:`chord`,notes:n,alters:n.map(()=>0),...r?{levels:r}:{}}}else i.kind===`seq`&&(a={...i,layers:i.layers.map(e=>e.map(r))});return{...t,atom:a}},i=t.braid.tokens.map(r);d.set(t.name,i)};for(let t of[...e.values()])c.includes(t)&&f(t);return{voices:l,cells:d}}function Vu(e,t,n){let r=/* @__PURE__ */ new Set,i=(e,t)=>({k:`ref`,ref:{name:e,pick:null,shift:0,span:t}}),a=Bu(e);for(let o of[...e.values()]){let s=o.params,c=o.braid.kind===`list`?o.braid.tokens:[],l=typeof s.trigger==`string`,u=l?s.trigger:typeof s.play==`string`&&c.length?s.play:null;if(u===null)continue;let d=l?`trigger`:`play`,f=o.paramSpans[d]??o.span,p=l?void 0:o.playMove,m=e=>e.kind===`ref`&&!e.pick&&!e.shift&&!e.transpose&&!e.values,h=c.length===1&&c[0].atom.kind===`mix`&&c[0].atom.exprs.every(e=>e.k===`ref`&&!e.ref.pick)?c[0].atom.exprs:null,g=c.every(e=>m(e.atom)&&e.repeat===1&&e.subdivide===1&&e.elongate===1);if(!h&&!g){n(`&${o.name} is a gate (${d}=): its braid is what it plays: a voice, a kit, a chord of voices [&lead, &bell], or voices to pick from (&${o.name} ${d}=&${u} &lead)`,o.span);continue}let _=h?h.flatMap(e=>e.k===`ref`?[{name:e.ref.name,span:e.ref.span}]:[]):c.flatMap(e=>e.atom.kind===`ref`?[{name:e.atom.name,span:e.span}]:[]),v=_;if(!h&&!l&&_.length>1){let n=`${o.name}:kit`;e.set(n,{name:n,span:o.span,over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:o.braid}),t.add(n),v=[{name:n,span:o.span}]}let y=l?[`velocity`,`gate`].flatMap(e=>typeof s[e]==`string`?[{name:s[e],port:e,span:o.paramSpans[e]??o.span}]:[]):(o.paramCells?.level?.factors??[]).map(e=>({name:e.name,port:`level`,span:e.span})),b=l?s.gain:s.level,x=typeof b==`number`?b:1,S=o.paramSpans[l?`gain`:`level`]??o.span,C=(r,i)=>{let a=e.get(r);if(!p||!a)return r;let s=`${r}${Ls({pick:null,shift:0,...p})}`,c={name:s,span:o.span,over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:{kind:`blank`}},l={kind:`ref`,name:r,pick:null,shift:0,...p.transpose?{transpose:p.transpose}:{},...p.degree?{values:{mul:1,add:p.degree}}:{}};return e.has(s)||e.set(s,{...Ps(c,a,{name:r,pick:null,shift:0,span:i},e=>n(e,i)),shift:null,laps:a.laps??null,braid:{kind:`list`,tokens:[{atom:l,repeat:1,subdivide:1,elongate:1,span:i}]}}),t.add(s),s},w=Hu(e,e.get(u),n);w&&r.add(u);let T=(w??[{line:{name:u,pick:null,shift:0,span:f},by:[]}]).map(({line:e,by:t})=>({line:e.name,plays:C(e.name,e.span),ref:e,by:t,span:e.span})),E=t=>a?.cells.has(t)?Wu(e,t):null,D=T.flatMap(t=>{let r=e.get(t.line),a=E(t.line);return v.map(o=>{let s=Uu(e.get(o.name)),c=a&&s?a.filter(e=>!s.includes(e)):[];return c.length&&n(`&${t.line} plays ${c.map(e=>`&`+e).join(`, `)}, which &${o.name} doesn't hold: a kit's lines play its own voices`,t.span),{k:`prod`,span:o.span,factors:[{k:`ref`,ref:{...t.ref,name:t.plays}},...t.by,...y.map(e=>i(e.name,e.span)),...r?.over?.name===o.name||a&&s?[]:[i(o.name,o.span)],...x===1?[]:[{k:`num`,value:x,span:S}]]}})}),O=Object.fromEntries(Object.entries(s).filter(([e])=>![`play`,`trigger`,`velocity`,`gate`,`gain`,`level`].includes(e))),k=Object.fromEntries(Object.entries(o.paramCells??{}).filter(([e])=>e!==`level`));e.set(o.name,{...o,params:O,paramCells:k,gate:{notes:u,...p?{move:p}:{},plays:T[0].plays,...w?{lines:T.map(({line:e,plays:t})=>({line:e,plays:t}))}:{},port:d,levels:y.map(({name:e,port:t})=>({name:e,port:t})),gain:x,receivers:_.map(e=>e.name)},braid:{kind:`list`,tokens:[{atom:{kind:`mix`,exprs:D,gate:o.name},repeat:1,subdivide:1,elongate:1,span:o.span}]}})}let o=new Map([...e.values()].flatMap(e=>e.gate?.lines?[[e.gate.notes,e.name]]:[])),s=e=>e.k===`ref`?[e.ref]:e.k===`sum`?e.items.flatMap(e=>s(e.e)):e.k===`prod`?e.factors.flatMap(s):[];for(let t of e.values())if(!(t.gate||t.braid.kind!==`list`))for(let e of t.braid.tokens.flatMap(e=>G(e.atom))){let r=e.kind===`ref`?[{name:e.name,span:t.span}]:e.kind===`mix`?e.exprs.flatMap(s):[];for(let e of r)o.has(e.name)&&n(`&${e.name} is the part &${o.get(e.name)} plays, a stack of lines and no sound: mix or send &${o.get(e.name)}`,e.span)}return r}function Hu(e,t,n){if(!t||t.map||t.gate||Object.keys(t.params).length||t.braid.kind!==`list`||t.braid.tokens.length!==1)return null;let r=t.braid.tokens[0].atom;if(r.kind!==`mix`||r.gate||!r.exprs.length)return null;let i=r.exprs.map(e=>e.k===`ref`?`level`in e&&e.level!==void 0?null:{line:e.ref,by:[]}:e.k!==`prod`||e.factors[0]?.k!==`ref`||!e.factors.slice(1).every(e=>e.k===`num`||e.k===`ref`&&!e.ref.pick&&!e.ref.shift)?null:{line:e.factors[0].ref,by:e.factors.slice(1)});if(!i.every(e=>e!==null))return null;let a=t=>{let n=e.get(t);return!!n&&(!!n.gate||Object.keys(n.params).some(e=>Zc.has(e))||n.braid.kind===`list`&&n.braid.tokens.length===1&&n.braid.tokens[0].atom.kind===`mix`)};return i.map(e=>({line:e.line,by:e.by.filter(e=>e.k!==`ref`||!a(e.ref.name)||(n(`&${t.name} is a stack of lines, each times its levels: &${e.ref.name} is a sound, not a level (a cell with map=amp, map=db or map=lin, or a number)`,e.ref.span),!1))}))}function Uu(e){if(!e||e.map||e.gate||e.braid.kind!==`list`||!e.braid.tokens.length)return null;let t=e.braid.tokens.flatMap(e=>e.atom.kind===`ref`?[e.atom.name]:[]);return t.length===e.braid.tokens.length?t:null}function Wu(e,t,n=[]){let r=e.get(t);if(!r||n.includes(t)||r.braid.kind!==`list`)return[];let i=t=>Object.keys(e.get(t)?.params??{}).some(e=>Zc.has(e)),a=/* @__PURE__ */ new Set;for(let o of r.braid.tokens.flatMap(e=>G(e.atom))){let r=o.kind===`ref`?[o.name]:o.kind===`mix`?o.exprs.flatMap(e=>e.k===`ref`?[e.ref.name]:[]):[];for(let o of r)for(let r of i(o)?[o]:Wu(e,o,[...n,t]))a.add(r)}return[...a]}function Gu(e,t){let n=e=>!!e&&!e.gate&&e.map?.kind!==`sample`&&e.map?.kind!==`midi`&&e.braid.kind===`list`&&e.braid.tokens.length===1&&e.braid.tokens[0].atom.kind===`mix`;for(let r of t.values()){let i=r.over?t.get(r.over.name):void 0;i&&i.braid.kind===`list`&&i.braid.tokens.length&&i.braid.tokens.every(e=>e.atom.kind===`ref`&&n(t.get(e.atom.name)))&&(e.error(`A selector switches sections (decision 016): &${r.name} over=&${i.name} reads mixes. Write &${i.name} step=4n with a section per part (&${i.name} step=4n &keysBar &drumBar), step each part's cells by its section (step=&keysBar), and play the parts straight into the sound card`,r.over.span),e.broken.add(r.name))}}function Ku(e,t){let n=/* @__PURE__ */ new Map,r=new Set([...e.values()].flatMap(e=>e.step?.kind===`driven`?[e.step.driver.name]:[])),i=e=>!!e&&!e.step&&!e.over&&!e.map&&(e.braid.kind===`blank`||e.braid.kind===`list`&&!e.braid.tokens.length);for(let a of[...e.values()]){if(!a.step||a.over||a.map||a.braid.kind!==`list`||!a.braid.tokens.length)continue;let o=[];for(let s of a.braid.tokens){let c=s.atom;if(c.kind!==`ref`||c.pick||c.shift||c.transpose||c.values||s.repeat!==1||s.subdivide!==1||s.elongate!==1)break;let l=e.get(c.name);if(l&&!i(l)&&(!l.step||n.has(c.name))){let n=a.braid.tokens.map(e=>e.atom.kind===`ref`?e.atom.name:``).filter(e=>e!==c.name);if(l.step||!n.some(t=>t&&!e.has(t)&&r.has(t)))break;t(`&${c.name} is a section of &${a.name}, so its line can carry attributes only (off, label=, tags=, show=, size=, shift=, restart=), not steps or a table of its own`,l.span),e.set(c.name,{...l,over:null,map:null,braid:{kind:`blank`}})}o.push(c.name)}if(o.length===a.braid.tokens.length&&!o.every(t=>e.has(t)&&!i(e.get(t)))&&o.some(e=>r.has(e))){for(let[t,r]of o.entries()){n.set(r,a.name);let o=e.get(r);if(o&&!i(o))continue;let s=a.braid.tokens[t].span,c={kind:`list`,tokens:[{atom:{kind:`note`,value:0,alter:0},repeat:1,subdivide:1,elongate:1,span:s}]};e.set(r,o?{...o,step:a.step,braid:c}:{name:r,span:s,over:null,shift:null,off:!1,step:a.step,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:c})}e.set(a.name,{...a,step:null})}}return n}let qu=(e,t,n)=>e.k===`ref`?n.includes(t(e.ref.name)):e.k===`num`?!1:e.k===`prod`?e.factors.some(e=>qu(e,t,n)):e.items.some(e=>qu(e.e,t,n));var Ju=class extends Error{span;constructor(e,t){super(e),this.span=t}};let Yu=e=>e.k===`ref`?e.ref.span:e.span,Xu={k:`act`,terms:[],plain:[],offset:0,gain:1},Zu=e=>({ref:e,sign:1,inSum:!1}),Qu=(e,t)=>e(t.ref.name)===`volume`||e(t.ref.name)===`plain`&&!t.inSum;function $u(e,t,n){let r=ed(e,t);if(r.k===`signal`)return[...r.bindings];if(r.k===`num`)throw new Ju(`A number is a gain or a pitch: it needs a voice (&theme * &lead * 0.8)`,Yu(e));let i=[...r.terms.map(e=>e.ref.name),...r.plain.map(e=>e.name)],a=n?.(i);throw new Ju(`${i.map(e=>`&`+e).join(` * `)} has no voice: a product needs one sound (a voice, a mix, a pattern read through a kit) — &theme * &lead${a?`. ${a}`:``}`,Yu(e))}function ed(e,t,n=`auto`){if(e.k===`num`)return{k:`num`,value:e.value};if(e.k===`ref`){if(e.level!==void 0)throw new Ju(`&${e.ref.name}:0:${+e.level.toFixed(3)} is a hit's gain, in a groove: in a mix, a gain is a number (&${e.ref.name} * ${+e.level.toFixed(3)})`,e.ref.span);let r=t(e.ref.name);return r===`signal`||r===`wave`&&n===`auto`?{k:`signal`,bindings:[{voice:e.ref,pitches:[],offset:0,gain:1}]}:r===`plain`?{...Xu,plain:[e.ref]}:{...Xu,terms:[{ref:e.ref,sign:1,inSum:!1}]}}if(e.k===`prod`){let r=n===`pitch`||qu(e,t,[`signal`])?`pitch`:`auto`;return e.factors.map(e=>ed(e,t,r)).reduce((t,n,r)=>td(t,n,Yu(e.factors[r])))}return nd(e,t,n)}function td(e,t,n){if(e.k===`num`&&t.k===`num`)return{k:`num`,value:e.value*t.value};if(e.k===`signal`&&t.k===`signal`)throw new Ju(`Two sounds can't multiply (&${e.bindings[0].voice.name} * &${t.bindings[0].voice.name}): mix them with + or ,`,n);if(e.k===`signal`||t.k===`signal`){let[n,r,i]=e.k===`signal`?[e,t,!1]:[t,e,!0],a=r.k===`num`?{...Xu,gain:r.value}:r,o=[...a.terms,...a.plain.map(Zu)];return{k:`signal`,bindings:n.bindings.map(e=>({...e,pitches:i?[...o,...e.pitches]:[...e.pitches,...o],offset:e.offset+a.offset,gain:e.gain*a.gain}))}}let r=e.k===`num`?{...Xu,gain:e.value}:e,i=t.k===`num`?{...Xu,gain:t.value}:t;return{k:`act`,terms:[...r.terms,...r.plain.map(Zu),...i.terms,...i.plain.map(Zu)],plain:[],offset:r.offset+i.offset,gain:r.gain*i.gain}}function nd(e,t,n){let r=n===`pitch`||!qu(e,t,[`signal`])&&qu(e,t,[`pitch`,`plain`])?`pitch`:`auto`,i=e.items.map(e=>({t:ed(e.e,t,r),sign:e.sign,span:Yu(e.e)}));if(i.every(e=>e.t.k===`num`))return{k:`num`,value:i.reduce((e,t)=>e+t.sign*t.t.value,0)};if(i.some(e=>e.t.k===`signal`)){let e=[];for(let t of i){if(t.t.k===`num`)throw new Ju(`A number is a gain or a pitch: it needs a voice (&theme * &lead * 0.8)`,t.span);if(t.t.k===`act`)throw new Ju(`A pitch or a volume can't be added to a sound: it acts on one (&theme * &lead)`,t.span);if(t.sign<0)throw new Ju(`Sounds mix with +; there's no subtracting a voice`,t.span);e.push(...t.t.bindings)}return{k:`signal`,bindings:e}}let a=[],o=0;for(let{t:e,sign:n,span:r}of i){if(e.k===`num`){o+=n*e.value;continue}let i=e;if(i.gain!==1)throw new Ju(`A gain inside a pitch sum: gains multiply the sound — (&theme + 12) * &lead * 0.8`,r);for(let e of i.terms){if(e.inSum===!1&&!rd(e,t))throw new Ju(`&${e.ref.name} is a volume: it multiplies, it can't be added — &theme * &${e.ref.name} * &lead`,e.ref.span);a.push({...e,sign:e.sign*n,inSum:!0})}for(let e of i.plain)a.push({ref:e,sign:n,inSum:!0});o+=n*i.offset}return{k:`act`,terms:a,plain:[],offset:o,gain:1}}let rd=(e,t)=>!Qu(t,e),id=e=>`&${e} is a role: it names the gates that play it, and is no sound to mix, send or play (name its gates here)`;function ad(e,t,n){let{error:r}=e,i=/* @__PURE__ */ new Map;for(let e of t.values()){if(e.map?.kind!==`role`)continue;let n=e.braid.kind===`list`?e.braid.tokens:[];n.length===0&&r(`&${e.name} is a role: name the gates that play it (&${e.name} map=role &player)`,e.span);for(let a of n){let n=a.atom;if(n.kind!==`ref`){r(`a role's entries are the gates that play it, as written (&${e.name} map=role &player &player2)`,a.span);continue}let o=t.get(n.name);if(!o)continue;if(!o.gate||n.pick||n.shift||n.transpose!==void 0||n.values||a.repeat!==1||a.elongate!==1||a.subdivide!==1){r(`&${n.name}: a role's entries are gates, as written (&player play=&part &voice), and &${n.name} is not one`,a.span);continue}let s=i.get(n.name);s===void 0?i.set(n.name,e.name):s!==e.name&&r(`&${n.name} plays two roles, &${s} and &${e.name}: a gate plays one`,a.span)}}return[...t.values()].flatMap(e=>{if(!e.gate||n.has(e.name))return[];let t=i.get(e.name);return[{name:e.name,...t===void 0?{}:{role:t},part:e.gate.notes,...e.gate.move?{move:e.gate.move}:{},voices:e.gate.receivers}]})}let od=(e,t)=>{let n=e.get(t);return!!n&&(!!n.gate||n.map?.kind===`role`)};function sd(e,t){let n=/* @__PURE__ */ new Map,r=new Set([...t.values()].flatMap(e=>e.over?[e.over.name]:[]));for(let i of r){let r=t.get(i);if(!r||r.map||r.braid.kind!==`list`||!r.braid.tokens.length)continue;let a=r.braid.tokens,o=e=>e.atom.kind===`ref`&&!e.atom.pick&&!e.atom.shift&&e.atom.transpose===void 0&&!e.atom.values&&e.repeat===1&&e.subdivide===1&&e.elongate===1;if(!a.every(e=>o(e)&&e.atom.kind===`ref`&&od(t,e.atom.name)))continue;let s=a.map(e=>e.atom.kind===`ref`?e.atom.name:``);r.step&&e.warn(`&${i} is a band, a table of performers: it needs no step=, the selector reading it steps (their parts keep their time)`,r.step.span);let c=/* @__PURE__ */ new Map;for(let[n,r]of s.entries()){let o=t.get(r),s=o.gate?[r]:o.braid.kind===`list`?o.braid.tokens.flatMap(e=>e.atom.kind===`ref`&&t.get(e.atom.name)?.gate?[e.atom.name]:[]):[];for(let t of new Set(s)){let o=c.get(t);o!==void 0&&o!==r?e.error(`&${t} is in &${i} twice, as &${o} and as &${r}: a performer is one entry of a band`,a[n].span):c.set(t,r)}}n.set(i,s)}return n}function cd(e,t,n){if(!n.size)return[...e];let r=e=>[...t.values()].filter(t=>t.over===e&&t.clock).map(e=>e.name);return e.map(e=>{let i=[...e.through,...e.via].find(e=>t.get(e)?.gate);if(!i)return e;let a=[],o=[];for(let[e,s]of n){let n=s.findIndex(e=>e===i||t.get(e)?.map?.kind===`role`&&t.get(e).units.some(e=>e.atom.kind===`ref`&&e.atom.name===i));if(!(n<0)){for(let t of r(e))a.push({cell:t,entry:n,part:s[n],performer:!0});o.push(...r(e),e,s[n])}}return a.length?{...e,via:[.../* @__PURE__ */ new Set([...e.via,...o])],select:[...e.select,...a]}:e})}function ld(e,t,n,r){for(let[i,a]of r)for(let r of n.values()){if(r.over!==i||!r.clock)continue;let o=e=>n.get(e)?.params.restart??r.params.restart,s=a.find(e=>o(e)===`restart`||o(e)===`resume`),c=r.step?.tap===`1m`&&r.step.chain.every(e=>e.op===`÷`&&Number.isInteger(e.n)||e.n===1);s&&!c&&e.warn(`&${r.name} switches &${s} with restart=${o(s)} off the bar: its part starts where the switch falls, not on a bar line, so its notes move in the bar. Switch on whole bars (step=1m), or let it run on (restart=free, a performer's default)`,t.get(r.name).span)}}let ud=e=>!!e&&e.map?.kind!==`sample`&&e.map?.kind!==`midi`&&e.braid.kind===`list`&&e.braid.tokens.length===1&&e.braid.tokens[0].atom.kind===`mix`,dd=(e,{decls:t})=>!!e&&!Object.keys(e.params).some(e=>Zc.has(e))&&e.braid.kind===`list`&&e.braid.tokens.length>0&&e.braid.tokens.every(e=>e.atom.kind===`ref`&&$c(t.get(e.atom.name)?.params??{})),fd=(e,{rateOf:t})=>{if(!e.step||e.step.kind===`driven`||e.step.kind===`tap`)return null;let n=t(e.step),r=e.braid,i=r.kind===`list`?r.tokens.length:r.kind===`scan`?r.steps.length:r.kind===`wave`?r.n:1;return n===null?null:e.step.whole?n:n/Math.max(1,i)},pd=(e,{decls:t})=>e.over?t.get(e.over.name):void 0,md=[{sort:`signal`,is:`A sound parameter (s=, lpf= …): a voice.`,example:[`&lead s=saw loop=C4`],holds:e=>Object.keys(e.params).some(e=>Zc.has(e))},{sort:`signal`,is:`A mix: an instrument.`,example:[`&a s=saw loop=C4`,`&b s=sine loop=C3`,`&organ [&a, &b]`],holds:e=>ud(e)},{sort:`signal`,is:`A pattern read through a kit (a table of voices).`,example:[`&bd s=sine loop=A1`,`&hh s=white`,`&kit &bd &hh`,`&drums over=&kit step=4 0 1 0 1`],holds:(e,t)=>dd(pd(e,t),t)},{sort:`signal`,is:`A read head of a sound tape (a tape that records a mix).`,example:[`&lead s=saw loop=C4`,`&mix [&lead]`,`&tape write=&mix step=1 length=4`,`&head play=&tape at=1`],holds:(e,{decls:t})=>{let n=typeof e.params.play==`string`?t.get(e.params.play):void 0;return!!n&&typeof n.params.write==`string`&&ud(t.get(n.params.write))}},{sort:`wave`,is:`A braid turning at an audio rate (20 Hz and up) with no sound of its own. Alone in a product it is the sound (a waveform); in a pitch sum, or beside a sound, a pitch that moves at audio rate (FM). One that plays as a voice in the piece is a sound everywhere.`,example:[`&square loop=220 0 1`],holds:(e,t)=>(fd(e,t)??0)>=20},{sort:`volume`,is:`map=amp, map=db or map=adsr (an envelope).`,example:[`&accent map=amp step=2 1 .5`],holds:e=>e.map?.kind===`amp`||e.map?.kind===`db`||e.map?.kind===`adsr`},{sort:`plain`,is:`map=lin: as a number, it takes its operator's sort — a volume in a product, a pitch in a sum.`,example:[`&swell map=lin loop=.25 .2 1`],holds:e=>e.map?.kind===`lin`},{sort:`pitch`,is:`Anything else: a melody, a cell reading a table, a loop below hearing (a vibrato). In semitones.`,example:[`&vibrato loop=5 0 .1 -.1`],holds:()=>!0}];md.map(e=>W(`sort`,e.sort,e.is,[e.example[e.example.length-1]],`mix.md`));let hd=e=>e.k===`ref`?[e.ref]:e.k===`sum`?e.items.flatMap(e=>hd(e.e)):e.k===`prod`?e.factors.flatMap(hd):[],gd=e=>hd(e).map(e=>e.name);function _d(e,t){let n={decls:t,rateOf:e.rateOf};return e=>{let r=t.get(e);return r?md.find(e=>e.holds(r,n)).sort:`pitch`}}function vd(e,t){let{error:n}=e,r={decls:t,rateOf:e.rateOf},i=_d(e,t),a=e=>{let n=e[e.length-1],i=t.get(n);if(!i)return null;if(i.braid.kind===`list`){let e=e=>e.atom.kind===`ref`&&Object.keys(t.get(e.atom.name)?.params??{}).some(e=>Zc.has(e)),r=t=>t.atom.kind===`note`||t.atom.kind===`ref`&&e(t)&&(t.atom.pick||t.atom.shift||t.atom.transpose||t.atom.values),a=i.braid.tokens.flatMap(e=>G(e.atom).map(e=>({atom:e})));if(a.some(e)&&a.some(r))return`&${n} mixes voices with numbers or picks: a groove holds only voices, rests and chords of voices (&bd &hh ~ [&bd, &hh]); to play numbers through voices, read them with over= a kit`}if(i.map?.kind===`midi`)return`&${n} is a MIDI card: it sends what it names to a device, and is no sound to mix or play`;if(dd(i,r))return`&${n} is a kit, a table of voices: read a pattern through it (&drums over=&${n}) and mix that`;let a=fd(i,r);return a!==null&&a<20?`&${n} loops at ${+a.toFixed(2)} Hz, below hearing: a pitch. A voice loops at an audio rate (loop=C4) or has a sound (s=saw)`:i.step?null:`&${n} has no loop=: a voice loops at an audio rate (loop=C4) or has a sound (s=saw)`},o=/* @__PURE__ */ new WeakMap;return s=>{let c=o.get(s);if(c)return c;c=[];let l=s.gate?e=>dd(t.get(e),r)?`signal`:i(e):i,u=s.gate?t.get(s.gate)?.gate:void 0,d=e=>s.exprs.flatMap(hd).find(t=>t.name===e),f=e=>{let n=t.get(e);return!!n&&(!!n.gate||ud(n)||Object.keys(n.params).some(e=>Zc.has(e)))},p=u?(u.lines?.map(e=>e.line)??[u.notes]).map(e=>({name:e,port:u.port})):[],m=u&&[...p,...u.levels].find(e=>f(e.name));if(u&&m){let e=p.some(e=>e.name===m.name)?`the notes it plays (a melody, &tune)`:`a level (a volume: a cell with map=amp, map=db or map=lin)`;return n(`${m.port}=&${m.name}: a gate's ${m.port}= takes ${e}, and &${m.name} is a sound (${t.get(m.name)?.gate?`a gate`:ud(t.get(m.name))?`a mix`:`a voice`})`,d(m.name)?.span??t.get(s.gate).span),o.set(s,c),c}let h=e=>t.get(e)?.map?.kind===`role`,g=[...p.map(e=>e.name),...s.exprs.flatMap(gd)].find(h);if(g)return n(id(g),d(g)?.span??t.get(s.gate??g).span),o.set(s,c),c;for(let i of s.exprs)try{let o=hd(i).filter(e=>!t.has(e.name));if(o.length){for(let t of o)e.unknownCell(t.name,t.span);continue}let s=$u(i,l,a),u=s.flatMap(e=>e.pitches).find(e=>dd(t.get(e.ref.name),r));u?n(`&${u.ref.name} is a kit, a table of voices: a pattern read through it is the sound — mix the pattern alone`,u.ref.span):c.push(...s)}catch(t){if(!(t instanceof Ju))throw t;gd(i).some(t=>e.broken.has(t))||n(t.message,t.span)}return o.set(s,c),c}}let yd=`card:builtin`,bd=e=>e.k===`ref`?[e.ref.name]:e.k===`sum`?e.items.flatMap(e=>bd(e.e)):e.k===`prod`?e.factors.flatMap(bd):[],xd=e=>e.kind===`ref`?[e.name]:e.kind===`mix`?e.exprs.flatMap(bd):e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>xd(e.atom))):[],Sd=e=>e.braid.kind===`list`?e.braid.tokens.flatMap(e=>xd(e.atom)):[];function Cd(e){let t=[];for(let n of[e.over,e.tonic,e.braid.kind===`scan`?e.braid.mode:null,e.swingFrom,e.base,e.env,e.pitch,e.map?.kind===`table`?e.map.table:null,e.step?.kind===`driven`?e.step.driver:e.step?.kind===`tap`?e.step.meter:null])n&&t.push(n.name);for(let n of Object.values(e.paramCells??{}))t.push(...n.factors.map(e=>e.name));for(let n of Object.values(e.paramClocks??{}))n.kind===`driven`&&t.push(n.driver.name);for(let[n,r]of Object.entries(e.params))typeof r==`string`&&qc[n]?.value===`cell`&&t.push(r);return e.gate&&t.push(e.gate.notes,...e.gate.levels.map(e=>e.name),...e.gate.receivers),t}let wd=e=>[...Sd(e),...Cd(e)];function Td(e,t,n=/* @__PURE__ */ new Set){let{decls:r,implicit:i}=t,a={...t,builtin:null};if([...r.values()].some(e=>e.map?.kind===`sample`||e.map?.kind===`midi`))return a;let o=/* @__PURE__ */ new Set;for(let e of r.values())for(let t of wd(e))t!==e.name&&o.add(t);let s=_d(e,r),c=[...r.values()].filter(t=>!i.has(t.name)&&!n.has(t.name)&&!t.lambda&&!o.has(t.name)&&!e.broken.has(t.name)&&(s(t.name)===`signal`||s(t.name)===`wave`));if(!c.length)return a;let l=Ou,u=c.map(e=>({k:`ref`,ref:{name:e.name,pick:null,shift:0,span:e.span}})),d={name:yd,span:l,over:null,shift:null,off:!1,step:null,map:{kind:`sample`,span:l},stride:null,cycle:null,params:{postgain:.8},paramSpans:{},braid:{kind:`list`,tokens:[{atom:{kind:`mix`,exprs:u},repeat:1,subdivide:1,elongate:1,span:l}]}};return{...t,decls:new Map([...r,[yd,d]]),implicit:/* @__PURE__ */ new Set([...i,yd]),overOk:new Map([...t.overOk,[yd,!0]]),builtin:yd}}let Ed=e=>e.levels.length/Math.max(1,e.pulses);function Dd(e){let t=/^([1-9][0-9]*)(n\.?|t)$/.exec(e);if(!t)return null;let n=parseInt(t[1],10);return t[2]===`n.`?3/(2*n):t[2]===`t`?2/(3*n):1/n}function Od(e,t){let n=1/t,r=n/4;if(!(r>1))return{...e,unit:n};let i=[];for(let t=0;t<e.pulses-1e-9;t+=r)i.push(Math.min(r,e.pulses-t));return{...e,unit:n,beats:i,counted:e.pulses/r}}let kd=e=>e.counted??Math.max(1,e.beats.length);function Ad(e,t){let n=Math.max(1,Math.round(t)),{counted:r,...i}=e;return{...i,beats:Array.from({length:n},()=>e.pulses/n)}}function jd(e,t){let n=t.filter(e=>e.share!==.5);return n.length?{...e,swing:n}:e}function Md(e){let t=e=>Math.abs(e-Math.round(e))<1e-9&&Math.round(e)>=1&&Number.isInteger(Math.log2(Math.round(e)));return t(1/e)?`${Math.round(1/e)}n`:t(2/(3*e))?`${Math.round(2/(3*e))}t`:t(3/(2*e))?`${Math.round(3/(2*e))}n.`:null}let Nd=e=>Md(1/(e.unit*Ed(e)));function Pd(e,t){let n=t*e.unit;return e.beats.some(e=>{let t=e/n;return Math.abs(t-Math.round(t))<1e-9&&Math.round(t)>=2})?null:`no beat of this meter divides into two or more of ${Md(t)??`them`} (its beats: ${e.beats.map(t=>Md(t/e.unit)??t).join(` `)}), and swing never moves a beat`}function Fd(e,t){let n=t*e.unit,r={...e,swing:[{level:Md(t)??``,whole:t,share:.6,pairs:!0}]};for(let t=0;t*n<e.pulses-1e-9;t++)if(Math.abs(zd(r,t*n)-t*n)>1e-9)return null;return`every group of ${Md(t)??`them`} in it is three, and :pairs keeps those straight`}let Id=e=>{for(let t=0,n=e;t<=6;t++,n*=2)if(Math.abs(n-Math.round(n))<1e-9)return!0;return!1};function Ld(e,t){let n=Array.from({length:e+1},(t,n)=>n/e);if(t===null||e!==2&&e!==3||e===3&&t.pairs)return n;let{share:r}=t;if(e===2)return[0,Math.min(.95,Math.max(.05,r)),1];let i=Math.min(.95,Math.max(.05,r-1/6));return[0,i,(i+1)/2,1]}function Rd(e,t,n){let r=Math.min(...n.map(e=>e.len)),i=0,a=t,o=0,s=t;for(let t=0;t<16;t++){let t=a/r,c=Math.round(t);if(Math.abs(t-c)>1e-9||c<2)break;let l=c===2||c===3?c:c%3==0?3:c%2==0?2:c,u=a/l,d=(e-i)/a*l;if(!Id(d))break;let f=Ld(l,n.find(e=>Math.abs(e.len-u)<1e-9)??null),p=Math.min(l-1,Math.max(0,Math.floor(d+1e-9)));i+=p*u,a=u,o+=f[p]*s,s*=f[p+1]-f[p]}return o+(e-i)/a*s}function zd(e,t){if(!e.swing?.length)return t;let n=e.swing.map(t=>({len:t.whole*e.unit,share:t.share,...t.pairs?{pairs:!0}:{}})),r=e.pulses,i=Math.floor(t/r+1e-9),a=t-i*r,o=0,s=0;for(;s<e.beats.length-1&&o+e.beats[s]<=a+1e-9;)o+=e.beats[s++];let c=e.beats[s]??r;return i*r+o+Rd(a-o,c,n)}function Bd(e){if(!e.swing?.length)return null;let t=Math.min(...e.swing.map(t=>t.whole*e.unit));if(!(t>0))return null;let n=[],r=0;for(let i of e.beats.length?e.beats:[e.pulses]){for(let e=0;e<i-1e-9;e+=t)n.push(r+e);r+=i}return n.push(e.pulses),{written:n,swung:n.map(t=>t>=e.pulses-1e-9?e.pulses:zd(e,t))}}function Vd(e){let t=Ed(e),n=e.levels.map((n,r)=>zd(e,r/t)*t);return n.some((e,t)=>Math.abs(e-t)>1e-12)?n:null}function Hd(e,t){let n=e.length,r={level:0,from:0,to:n,groups:[]},i=[r];for(let t=1;t<n;t++){let r=Math.max(1,e[t]);for(;i.length>1&&i[i.length-1].level>=r;)i.pop();let a={level:r,from:t,to:n,groups:[]};for(let i=t+1;i<n;i++)Math.max(1,e[i])<=r&&(a.to=i,i=n);i[i.length-1].groups.push(a),i.push(a)}let a=t??Ud(e);return{tree:r,levels:e,positions:e.map((e,t)=>t),lap:n,written:`meter`,pulses:a.pulses,unit:a.unit,beats:a.beats}}function Ud(e){let t=e.flatMap((e,t)=>t===0||e<=1?[t]:[]),n=t.map((n,r)=>(t[r+1]??e.length)-n),r=e.length/Math.max(1,n.length),i=Number.isInteger(Math.log2(r))?4*r:8;return{pulses:e.length,unit:i,beats:n,sub:1}}function Wd(e){let{positions:t,lap:n}=Ha(e),r=t.map((e,t)=>({level:1,from:t,to:t+1,groups:[]})),i=t.length;return{tree:{level:0,from:0,to:i,groups:r},levels:t.map(()=>1),positions:t,lap:n,written:`scan`,pulses:i,unit:4,beats:t.map(()=>1)}}function Gd(e,t,n=1){let r=[],i=e.pulses,a=i*Math.max(1,n);if(t.kind===`note`){let n=t.whole*e.unit;for(let e=0;e*n<a-1e-9;e++)r.push(e*n);return r}for(let a=0;a<Math.max(1,n);a++)if(t.kind===`bar`)r.push(a*i);else if(t.kind===`pulse`)for(let e=0;e<i;e++)r.push(a*i+e);else{let t=0;for(let n of e.beats)r.push(a*i+t),t+=n}return r}function Kd(e,t,n){let r=(t===`pulse`?1:t===`beat`?Math.max(...e.beats):t===`1m`?e.pulses:(Dd(t)??0)*e.unit)/e.unit/n;return(e.legato??[]).filter(e=>e.whole>=r-1e-9).sort((e,t)=>e.whole-t.whole)[0]?.share??1}var qd=class extends Error{};function Jd(e){let{braid:t,params:n}=e,{beat:r,pulse:i}=n,a=t.kind===`scan`?Wd(t.steps):t.kind===`list`&&t.perBeat!==void 0?Hd(t.tokens.map(e=>e.atom.kind===`note`?e.atom.value:0),t.signature):null,o=t.kind===`scan`&&typeof i==`string`?Dd(i):null,s=a&&o?Od(a,o):a,c=s&&typeof r==`number`&&r>0?Ad(s,r):s,l=c&&e.legato?{...c,legato:e.legato.flatMap(e=>Dd(e.level)===null?[]:[{...e,whole:Dd(e.level)}])}:c;return!l||typeof n.swing!=`number`?l:jd(l,(e.swing??[{level:Nd(l)??``,share:n.swing}]).flatMap(e=>{let t=Dd(e.level);return t===null?[]:[{level:e.level,whole:t,share:e.share,...e.pairs?{pairs:!0}:{}}]}))}let Yd=e=>e?Ed(e)*e.pulses/kd(e):1;function Xd(e,{decls:t,implicit:n,implicitRoot:r,overOk:i,stacks:a},o,s){let{rateOf:c,error:l,warn:u,broken:d,unknownCell:f}=e,p=/* @__PURE__ */ new Map,m=e=>Mu(t,e),h=e=>Nu(t,e),g=[],_=/* @__PURE__ */ new Set,v=(e,i)=>{let u=p.get(e);if(u)return u;if(_.has(e)){for(let e of g)_.add(e),d.add(e);throw new qd}let y=t.get(e);if(g.length>=256){_.size||l(`&${g[0]} splices cells into each other more than 256 deep (&${g[0]} → &${g[1]} → … → &${e}): write a long chain as one braid`,i);for(let t of[...g,e])_.add(t),d.add(t);throw new qd}if(g.includes(e))throw l(`Circular reference: ${[...g.slice(g.indexOf(e)),e].map(e=>`&`+e).join(` → `)}`,i),new qd;g.push(e);let b=h(y),x=/* @__PURE__ */ new Map,S=[],C=y.braid.kind===`list`?y.braid.tokens:[],w=(e,n,r)=>{let i=e.name;if(!t.has(i)){if(d.has(i))for(let e of g)d.add(e);throw f(i,n),new qd}let a=v(i,n),o=Sl(a,e.pick);if(o===null)throw l(Cl(i,e.pick,a.units.length),n),new qd;return x.set(i,(x.get(i)??0)+r),o};b.forEach((e,t)=>{let n=1,r=C[t]?.span??y.span;e.atom.kind===`ref`&&(n=w(e.atom,r,e.repeat*e.subdivide));let i=/* @__PURE__ */ new Map;for(let t of cs(e.atom))t.atom.kind===`ref`&&i.set(t.atom,w(t.atom,t.span??r,t.repeat*t.subdivide));e.atom.kind===`seq`&&(n=Ts(e.atom,e=>i.get(e)||1)),S.push(n*e.elongate*e.repeat)});let T=S.reduce((e,t)=>e+t,0);g.pop();let E=Au(y),D=y.braid,O={name:e,span:y.span,root:E===null,implicit:e===`fifths12TET`&&r||n.has(e),over:E===null?null:y.over?.name??null,overShift:y.over?.shift??0,context:E??e,cycle:E===null?ju(y):m(e),wrap:y.cycle??null,lambda:y.lambda??null,frees:y.frees??[],show:y.show??null,...y.paramSpans?.show?{showSpan:y.paramSpans.show}:{},laps:y.laps??null,loops:!!y.step?.whole,chance:y.chance??.5,seed:y.seed??0,size:y.size??1,tags:(y.tags??``).split(`,`).map(e=>e.trim()).filter(Boolean),about:(y.about??[]).map(e=>e.name),...y.base?{base:{name:y.base.name,...y.base.transpose?{transpose:y.base.transpose}:{},...y.base.degree?{degree:y.base.degree}:{}}}:{},beat:Yd(Jd(y)),meter:Jd(y),label:y.label??null,note:Rs(y),env:y.env?.name??null,pitch:y.pitch?.name??null,braid:E===null?`blank`:D.kind,units:b,scan:D.kind===`scan`?{lap:Ha(D.steps).lap,steps:D.steps}:null,shift:y.shift??0,...y.tonic?{tonic:y.tonic.name}:{},off:y.off,oneshot:!!y.oneshot,glide:typeof y.params.glide==`number`&&y.params.glide>0?y.params.glide:0,children:x,steps:T,unitSteps:S,hasValues:b.some(e=>G(e.atom).some(e=>e.kind===`note`||e.kind===`chord`)),step:y.step?.kind===`driven`?{driver:y.step.driver.name,cycle:y.step.cycle,whole:y.step.whole,chain:y.step.chain}:null,paramClocks:Object.fromEntries(Object.entries(y.paramClocks??{}).flatMap(([e,t])=>t.kind===`driven`?[[e,{driver:t.driver.name,cycle:t.cycle,whole:t.whole,chain:t.chain}]]:[])),map:y.map?y.map.kind===`table`?{kind:`table`,table:y.map.table.name}:y.map.kind===`edo`?{kind:`edo`,period:y.map.period}:y.map.kind===`ratios`?{kind:`ratios`,ratios:y.braid.kind===`list`?y.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[]}:y.map.kind===`midi`?{kind:`midi`,channel:y.map.channel,port:y.map.port}:{kind:y.map.kind}:null,mix:a.has(e)?[]:b.length>0&&b.every(e=>e.atom.kind===`mix`)&&(b.length===1||y.map?.kind===`sample`)&&y.map?.kind!==`midi`?b.flatMap(e=>e.atom.kind===`mix`?o(e.atom):[]):null,sink:y.map?.kind===`sample`,sort:s(e),...y.map?.kind===`midi`?{chords:b.map(e=>e.atom.kind===`mix`?o(e.atom):null)}:{},clock:null,rate:0,stride:y.stride??1,params:y.params,paramCells:Object.fromEntries(Object.entries(y.paramCells??{}).map(([e,t])=>[e,{range:t.range,factors:t.factors.map(e=>e.name)}])),voice:Object.keys(y.params).some(e=>Zc.has(e)),freq:y.step?.kind===`rate`||y.step?.kind===`env`?y.step.whole?c(y.step)??261.63:(c(y.step)??261.63)/Math.max(1,T):261.63,kit:!1,...y.gate?{gate:y.gate}:{}};return p.set(e,O),O};for(let[e,n]of t)if(i.get(e))try{v(e,n.span)}catch(e){if(!(e instanceof qd))throw e;g.length=0}for(let[e,n]of t){let t=p.get(e);if(!t||t.root)continue;let r=t.over??`fifths12TET`;!p.get(r)?.root&&n.braid.kind===`list`&&n.braid.tokens.some(e=>e.atom.kind===`note`&&!Number.isInteger(e.atom.value))&&u(`&${r} is a table, so decimal indexes are rounded down`,n.span)}return p}let Zd=`tutorial`,Qd={genre:[`classical`,`jazz`,`electronic`,`experimental`,`world`,`folk`,`ambient`,`dance`,`industrial`,`blues`,`minimal`,`8-bit`],artist:[`Bach`,`Wendy Carlos`,`Stockhausen`,`Neubauten`,`Aphex Twin`,`Brahms`,`Coltrane`,`Pachelbel`,`Kraftwerk`,`Scooter`,`Daft Punk`,`Chemical Brothers`,`Nine Inch Nails`,`Steve Reich`],tutorial:[Zd],topic:[`sound`,`rhythm`,`harmony`,`diatonic`,`tonal`,`modal`,`chromatic`,`microtonal`,`tuning`,`arrangement`,`canon`,`counterpoint`,`motifs`,`pentatonic`,`stereo`,`FM`,`MIDI`,`physics`,`tape`]};function $d(e){if(e.toLowerCase()===`tutorial`)return{kind:`tutorial`,name:Zd};let t=/^(genre|artist|topic):\s*(.*)$/i.exec(e);return t?{kind:t[1].toLowerCase(),name:t[2]}:{kind:`topic`,name:e}}function ef(e){if(/^(topic:\s*)?basics$/i.test(e.trim()))return Zd;let{kind:t,name:n}=$d(e.trim());if(t===`tutorial`)return Zd;let r=e=>Qd[e].find(e=>e.toLowerCase()===n.toLowerCase());if(t===`topic`){let t=/^topic:/i.test(e.trim()),i=t?void 0:r(`genre`);if(i)return`genre:${i}`;let a=t?void 0:r(`artist`);return a?`artist:${a}`:n}return`${t}:${r(t)??n}`}let tf=e=>[...e.pitches.map(e=>e.ref.name),e.voice.name].filter(e=>!e.startsWith(`λ`)).join(`*`)||e.voice.name;function nf(e,t,n,r){let{error:i,warn:a,unknownCell:o}=e,s=new Map(n),c=e=>$c(t.get(e)?.params??{}),l=e=>e.units.length>0&&e.units.every(e=>e.atom.kind===`ref`&&c(e.atom.name));for(let e of[...s.values()])!e.voice&&!e.root&&l(e)&&s.set(e.name,{...e,kit:!0});let u=[...s.values()].filter(e=>e.sink);for(let[e,n]of t){let t=s.get(e);t&&!t.mix&&!hl(t)&&t.map?.kind!==`role`&&t.units.some(e=>e.atom.kind===`mix`)&&i(t.sink?`A sound card's channels are all mixes: [left …] [right …], or &left &right`:`A mix is one chord of sounds: &${e} [&a * &v, &b * &w]`,n.span)}let d=(e,t=[])=>{let n=s.get(e.voice.name);return!n?.mix||n.sink?[{b:e,through:t}]:t.includes(n.name)||t.length>16?(i(`&${n.name} plays itself through its mixes`,n.span),[]):n.mix.flatMap(r=>d({voice:r.voice,pitches:[...e.pitches,...r.pitches],offset:e.offset+r.offset,gain:e.gain*r.gain},[...t,n.name]))},f=/* @__PURE__ */ new Map,p=e=>[e.voice.name,e.offset,...e.pitches.map(e=>`${e.sign}${e.ref.name}${JSON.stringify(e.ref.pick)}${e.ref.shift}`)].join(`|`);for(let n of u){let a=t.get(n.name),o=n.units;if(o.length===0||o.length>2){i(`The sound card takes one channel (mono) or two (left, right): &${n.name} map=sample &left &right`,a.span);continue}o.forEach((t,c)=>{let l=t.atom.kind===`mix`?r(t.atom):null,u=t.atom.kind===`ref`?s.get(t.atom.name):l?n:void 0,m=l??(t.atom.kind===`ref`&&u?.mix&&!u.sink?u.mix:null);if(!u||!m){if(t.atom.kind===`ref`&&e.broken.has(t.atom.name))return;i(t.atom.kind===`ref`&&u?.map?.kind===`role`?id(t.atom.name):`A channel of the sound card is a mix: &mix, or [&theme * &lead] written in place`,a.span);return}for(let{b:e,through:t,top:r,index:i}of m.flatMap((e,t)=>d(e).map(n=>({...n,top:e,index:t})))){let a=p(e),s=f.get(a),l=n.implicit?r.voice.span:u.span;s||f.set(a,s={b:e,span:l,gains:[0,0],via:/* @__PURE__ */ new Set,parts:[],through:/* @__PURE__ */ new Set});for(let e of t)s.through.add(e);let d=o.length===1?[e.gain,e.gain]:c===0?[e.gain,0]:[0,e.gain];s.gains[0]+=d[0],s.gains[1]+=d[1],s.parts.push({mix:u.name,sink:n.name,gains:d,entry:{channel:c,index:i,label:tf(r)}}),s.via.add(u.name).add(n.name)}})}let m=e=>{let n=t.get(e)?.over?.name;return n&&s.get(n)?.kit?n:null};{let e=new Set([...f.values()].flatMap(e=>e.parts.map(e=>e.mix))),n=/* @__PURE__ */ new Set;for(let r of t.values())for(let t of[`excite`,`write`]){let i=r.params[t];typeof i==`string`&&s.get(i)?.mix&&!e.has(i)&&n.add(i)}for(let e of n){let t=s.get(e);for(let{b:n,through:r}of t.mix.flatMap(e=>d(e))){if(typeof s.get(n.voice.name)?.params.play==`string`)continue;let i=`send:`+p(n);f.has(i)||[...f.values()].some(e=>p(e.b)===p(n))||f.set(i,{b:n,span:t.span,gains:[n.gain,n.gain],via:/* @__PURE__ */ new Set([e]),parts:[],through:new Set(r),silent:!0})}}}let h=[...s.values()].filter(e=>hl(e));for(let e of h){let n=t.get(e.name),r=e.map;n.step&&i(`A MIDI card doesn't turn: leave out ${n.step.whole?`loop`:`step`}= (&${e.name} map=midi …)`,n.step.span);let o=n.braid.kind===`list`?n.braid.tokens:[],c=e.units.findIndex(e=>e.subdivide!==1||e.elongate!==1);if(c>=0){i(`A MIDI card's entries are channels: x!n repeats one on n channels, but * and @ mean nothing here`,o[c]?.span??n.span);continue}let l=e.units.reduce((e,t)=>e+t.repeat,0);if(r.channel===null&&l>16){i(`A MIDI card has 16 channels, and &${e.name} names ${l}: ~ skips one, map=midi(10) puts them all on one`,n.span);continue}l===0&&a(`&${e.name} is a MIDI card with no channels: write what goes on each, map=midi [&theme * &reed] ~ &groove`,n.map.span);let u=0;e.units.forEach((t,a)=>{let c=o[a]?.span??n.span,l=u;if(u+=t.repeat,t.atom.kind===`rest`)return;let h;if(t.atom.kind===`mix`)h={bindings:e.chords?.[a]??[],mix:null};else if(t.atom.kind===`ref`){let e=t.atom.name,n=s.get(e);if(!n)return;let r={voice:{name:e,pick:t.atom.pick,shift:t.atom.shift,span:c},pitches:[],offset:0,gain:1};if(n.mix&&!n.sink)h={bindings:n.mix,mix:e};else if(m(e)||n.voice||n.kit)h={bindings:[r],mix:null};else{i(n.map?.kind===`role`?id(e):hl(n)?`&${e} is a MIDI card: a card's entries are what it sends (a mix, a mix cell, a pattern read through a kit), not another card — name &${e}'s entries here`:`&${e} is a melody without a voice: a MIDI channel plays notes on a voice, [&${e} * &voice]`,c);return}}else{i(`A MIDI card's entries are channels: a mix ([&theme * &reed]), a mix cell, a pattern read through a kit, or ~ to skip one`,c);return}let{bindings:g,mix:_}=h;for(let n=0;n<t.repeat;n++){let t=r.channel??l+n+1;for(let{b:n,through:i}of g.flatMap(e=>d(e))){let a=p(n),o=f.get(a)??[...f.values()].find(e=>p(e.b)===a);o||f.set(a,o={b:n,span:e.span,gains:[0,0],via:/* @__PURE__ */ new Set,parts:[],through:/* @__PURE__ */ new Set});for(let e of i)o.through.add(e);(o.midi??=[]).push({card:e.name,mix:_,channel:t,port:r.port,gain:n.gain}),o.via.add(e.name),_&&o.via.add(_)}}})}let g=[...f.values()].map(e=>{let t=m(e.b.voice.name);return t?{...e,b:{...e.b,voice:{name:t,pick:null,shift:0,span:e.b.voice.span},pitches:[{ref:e.b.voice,sign:1},...e.b.pitches]}}:e}),_=e=>{let t=s.get(e),n=t&&typeof t.params.play==`string`?s.get(t.params.play):void 0,r=n&&typeof n.params.write==`string`?s.get(n.params.write):void 0;return!!r?.mix&&!r.sink};for(let{b:e}of g){let t=s.get(e.voice.name);t&&!t.root&&!t.kit&&!_(t.name)&&!e.pitches.some(e=>e.ref.name===t.name)&&s.set(t.name,{...t,voice:!0})}let v=[...t].find(([,e])=>e.title)?.[0];for(let[e,n]of t){let r=s.get(e);if(!r)continue;if(r.map?.kind===`table`&&!t.has(r.map.table)&&o(r.map.table,n.map.span),n.base&&!t.has(n.base.name)&&o(n.base.name,n.base.span),n.about){r.note||i(`about= belongs on a note: a cell with a label= (or title=) and nothing else`,n.about[0].span);for(let e of n.about)t.has(e.name)||o(e.name,e.span)}if(n.tier!=null&&n.title&&!(n.tags??``).split(`,`).some(e=>ef(e.trim())===`tutorial`)&&a(`tier= puts a piece in a tier of the tutorial; without tags="tutorial" it is ignored`,n.paramSpans.tier??n.span),n.tier!=null&&!n.title&&i(`tier= belongs on a piece’s card: the note with its title=`,n.paramSpans.tier??n.span),e===v&&r.note){let e=[`title`,`tags`,`tier`].filter(e=>n[e]!=null),t=e=>e.length>1?`${e.slice(0,-1).join(`, `)} and ${e.at(-1)}`:e[0],r=e.length>1;a(`${t(e.map(e=>`${e}=`))} on the piece’s card ${r?`go`:`goes`} in its file’s frontmatter now (${e.map(e=>`${e}:`).join(` `)}): Shorten moves ${r?`them`:`it`} there (decision 047)`,n.paramSpans.title??n.span)}if(!r.voice)continue;let c=n.params.s;c!==void 0&&!(String(c)in rl)&&i(`Unknown sound '${c}' (${Object.keys(rl).join(`, `)})`,n.paramSpans.s??n.span),c!==void 0&&n.braid.kind!==`blank`&&a(`s=${c} plays a built-in waveform; the braid is ignored`,n.paramSpans.s);for(let[e,t]of Object.entries(n.params))qc[e]?.value===`number`&&typeof t!=`number`&&i(`${e}= takes a number`,n.paramSpans[e]);let l=Object.keys(n.params).find(e=>Zc.has(e)),u=l?` (${l}= makes &${e} a voice; a meter takes none)`:``;n.step?.kind===`driven`||n.step?.kind===`tap`?i(`A voice moves at a rate — its pitch, like loop=C4${u}`,n.step.span):n.step&&!n.step.whole&&i(`A voice's pitch is loop= (one turn of its braid per cycle): loop=C4${u}`,n.step.span)}return{cells:s,sinks:u,cards:h,bindings:g,soundHead:_}}let rf=(e,t,n)=>`${e}:${t.written}${n>1?`:${n}`:``}`;function af(e,t,n,r){let i=r*e/Math.max(1,t),a=i*t,o=e=>Math.abs(e-Math.round(e))<1e-9&&Math.round(e)>0,s=e=>o(e)&&Number.isInteger(Math.log2(Math.round(e)))&&Math.round(e)<=64;if(o(1/a))return Math.round(1/a)===1?`1m`:`1m/${Math.round(1/a)}`;if(o(a)){if(s(i*n)&&Math.round(i*n)>1)return`${Math.round(i*n)}n`;if(s(2*i*n/3))return`${Math.round(2*i*n/3)}t`}return`pulse${of(i)}`}function of(e){if(Math.abs(e-1)<1e-9)return``;let t=cf(e);return t?t[1]===1?`*${t[0]}`:t[0]===1?`/${t[1]}`:`*${t[0]}/${t[1]}`:`*${+e.toFixed(6)}`}let sf=e=>e.map(e=>`${e.op===`×`?`*`:`/`}${e.n}`).join(``);function cf(e){for(let t=1;t<=64;t++){let n=Math.round(e*t);if(n>0&&Math.abs(n/t-e)<1e-9)return[n,t]}return null}function lf(e,t,n){let{rateOf:r,error:i,warn:a,unknownCell:o,broken:s}=e,c=new Map(n),l=/* @__PURE__ */ new Map,u=e=>{let n=e.step;if(n?.kind!==`driven`||n.whole||n.cycle||!c.get(e.name)?.meter)return null;let i=t.get(n.driver.name),a=c.get(n.driver.name);if(i?.step?.kind!==`rate`||i.step.whole||i.braid.kind!==`blank`||!a||a.voice||a.kit||a.meter)return null;let o=r(i.step);return o===null?null:o*n.ratio};for(let[e,n]of t){let t=c.get(e);if(!t||t.voice||t.kit)continue;let i=u(n);if(i===null&&n.step?.kind!==`rate`&&n.step?.kind!==`env`)continue;let o=i??r(n.step);if(o===null||!n.step)continue;typeof n.params.beat==`number`&&!t.meter&&a(`beat= says how many beats a meter(…) or scan(…) counts (alla breve: meter("4/4") beat=2); on &${e}, a list, it does nothing`,n.paramSpans?.beat??n.span),n.params.pulse!==void 0&&(n.braid.kind!==`scan`||typeof n.params.pulse!=`string`||Dd(n.params.pulse)===null)&&a(`pulse= says the note value of a scan's entries (pulse=16n: sixteenths, its bpm counting quarters); ${n.braid.kind===`scan`?`${n.params.pulse} is not one (16n, 8t, 4n.)`:`on &${e}, not a scan, it does nothing`}`,n.paramSpans?.pulse??n.span);let s=i===null&&n.step.whole,d=(s?o*Math.max(1,t.steps):o)*(s?1:t.beat),f=n.paramSpans?.swing??n.span,p,m=null,h=e=>String(e).replace(/^0\./,`.`);if(typeof n.params.swing==`number`&&t.meter){let r=t.meter;if(!n.swing){let e=Nd(r),t=e===null?null:Dd(e);a(t!==null&&Pd(r,t)===null?`swing=${h(n.params.swing)} leans the meter cell's own steps: name the level it leans, swing=${e}:${h(n.params.swing)}`:`swing=${h(n.params.swing)} leans the meter cell's own steps, and they are its beats, which swing never moves: name the level it leans, swing=8n:${h(n.params.swing)}`,f)}for(let t of n.swing??[]){let n=Dd(t.level),i=n===null?`${t.level} is not a note value (8n, 16n, 8t)`:Pd(r,n)??(t.pairs?Fd(r,n):null);i&&a(`swing=${t.level}:${h(t.share)}${t.pairs?`:pairs`:``} leans nothing on &${e}: ${i}`,f)}m=Vd(r)}else typeof n.params.swing==`number`&&n.swing?a(`swing=${n.swing.map(e=>`${e.level}:${h(e.share)}${e.pairs?`:pairs`:``}`).join(`,`)} leans levels of a meter, and &${e} is not one: write swing=${h(n.params.swing)} (pairs of its steps)`,f):typeof n.params.swing==`number`&&n.params.swing!==.5&&(p=n.params.swing);l.set(e,{cell:e,perSecond:d,positional:Tl(t),...p===void 0?{}:{swing:p},...m?{swung:m}:{}})}let d=new Set([...t.values()].flatMap(e=>e.step?.kind===`driven`?[e.step.driver.name]:e.step?.kind===`tap`&&e.step.meter?[e.step.meter.name]:[])),f=/* @__PURE__ */ new Map,p=[],m,h=/* @__PURE__ */ new Map,g=()=>{if(m!==void 0)return m;let e=[...t.values()].filter(e=>l.has(e.name)&&c.get(e.name)?.meter);return m=(e.find(e=>!e.step?.whole)??e[0])?.name??null,m},_=(e,n,r)=>{let a=e.meter?.name??g();if(!a)return i(`${n} taps the piece's main meter, and it has none: write one (&bar meter("4/4") step=100bpm)`,e.span),r(),null;if(!t.has(a))return o(a,e.meter.span),r(),null;if(p.includes(a))return i(`step= loops back: ${[...p.slice(p.indexOf(a)),a].map(e=>`&`+e).join(` → `)}`,e.span),null;let s=y(a);return!c.get(a)?.meter||!s||s.clock!==a?(i(`${n}: &${a} is not a meter that keeps time — a tap reads a meter(…) or scan(…) with a tempo (&${a} meter("4/4") step=100bpm)`,e.meter?.span??e.span),r(),null):a},v=(e,n)=>{let r=`step=${n.meter?`&${n.meter.name}:`:``}${n.tap.written}`,i=_(n,r,()=>s.add(e));if(!i)return null;let a=c.get(i).meter;h.set(e,i);let o=Math.max(1,Math.round(t.get(e)?.cycle??1)),u=a.swing&&Number.isInteger(n.ratio)&&n.ratio>1?n.ratio:1,f=rf(i,n.tap,o)+(u>1?`*${u}`:``);if(!l.has(f)){let e=Ed(a),t=Gd(a,n.tap,o),r=a.pulses*o,s=t.flatMap((e,n)=>Array.from({length:u},(i,a)=>e+a*((t[n+1]??r)-e)/u)),c=s.map(t=>zd(a,t)*e),d=s.map(t=>t*e),p=a.levels.length*o;l.set(f,{cell:i,perSecond:l.get(i).perSecond*c.length/p,positional:!1,tap:{meter:i,positions:c,lap:p,...d.some((e,t)=>Math.abs(e-c[t])>1e-12)?{written:d}:{}}})}let p=n.ratio/u,m=c.get(e);return m?.scan&&d.has(e)?(l.set(e,{cell:e,perSecond:l.get(f).perSecond*p,positional:!0}),{clock:e,rate:1}):m&&typeof t.get(e)?.params.belt==`number`?(l.set(e,{cell:e,perSecond:l.get(f).perSecond*p,positional:!1,belt:{driver:f,rate:p}}),{clock:e,rate:1}):{clock:f,rate:p}},y=e=>{if(f.has(e))return f.get(e);if(l.has(e))return f.set(e,{clock:e,rate:1}),f.get(e);let n=t.get(e)?.step;if(n?.kind===`tap`&&!c.get(e)?.voice){p.push(e);let t=v(e,n);return p.pop(),f.set(e,t),t}if(!n||n.kind!==`driven`||c.get(e)?.voice)return f.set(e,null),null;let r=n.driver.name,s=n.whole?`loop=`:`step=`,u=null;if(!t.has(r))o(r,n.driver.span);else if(p.includes(r)||r===e)i(`${s} loops back: ${[...p.slice(p.indexOf(r)),e,r].map(e=>`&`+e).join(` → `)}`,n.span);else if(c.get(r)?.voice)i(`&${r} is a voice: it moves at audio rate`,n.driver.span);else{p.push(e);let o=y(r);p.pop();let f=c.get(r)?.steps??0,m=c.get(e)?.steps??0;if(o&&!n.whole&&!n.cycle&&c.get(r)?.meter&&l.has(r)){let e=c.get(r).meter,i=af(e.levels.length,e.pulses,t.get(r)?.step?.kind===`rate`?e.unit:0,n.ratio);a(`step=&${r}${sf(n.chain)} steps by the meter cell's own steps: tap the meter by pulse, beat or a note value (step=${g()===r?``:`&${r}:`}${i})`,n.span)}if(!o)a(`&${r} never moves, so &${e} stands still — give &${r} a rate (step=84bpm) or ${s}&cell`,n.driver.span);else if(n.cycle&&f===0)i(`&${r} has no cycle to count`,n.driver.span);else if(n.whole&&m===0)i(`&${e} has no steps to loop`,n.span);else{u={clock:o.clock,rate:o.rate*n.ratio*(n.whole?m:1)/(n.cycle?f:1)};let r=c.get(e);r&&r.scan&&d.has(e)&&!n.whole?(l.set(e,{cell:e,perSecond:l.get(o.clock).perSecond*u.rate,positional:!0}),u={clock:e,rate:1}):r&&typeof t.get(e)?.params.belt==`number`&&!n.whole&&(l.set(e,{cell:e,perSecond:l.get(o.clock).perSecond*u.rate,positional:!1,belt:{driver:o.clock,rate:u.rate}}),u={clock:e,rate:1})}}return f.set(e,u),u};for(let e of[...c.values()]){let n=y(e.name),r=t.get(e.name)?.step,i=h.get(e.name),a=r?.kind===`tap`?n&&i?{driver:i,cycle:!1,whole:!1,chain:r.chain,tap:r.tap.written}:null:e.step;n?c.set(e.name,{...e,clock:n.clock,rate:n.rate,step:a}):a!==e.step&&c.set(e.name,{...e,step:a})}for(let e of t.values())for(let[t,n]of Object.entries(e.paramClocks??{})){if(n.kind===`tap`){let r=c.get(e.name),i=_(n,`${t}=${n.meter?`&${n.meter.name}:`:``}${n.tap.written}`,()=>{});if(!i||!r)continue;let a=c.get(i).meter,o=a.levels.length/l.get(i).perSecond,s=n.tap.kind===`note`?n.tap.whole*a.unit*o/a.pulses:o/Gd(a,n.tap,1).length,u=n.ratio/s;c.set(e.name,{...r,params:{...r.params,[t]:+(1/u).toFixed(6)},paramClocks:{...r.paramClocks,[t]:{driver:i,cycle:!1,whole:!1,chain:n.chain,tap:n.tap.written}}});continue}if(n.kind!==`driven`)continue;let r=y(n.driver.name),a=c.get(e.name);if(!r||!a){i(`${t}=&${n.driver.name}: that cell keeps no time`,n.span);continue}let o=l.get(r.clock).perSecond*r.rate*n.ratio;c.set(e.name,{...a,params:{...a.params,[t]:+(1/o).toFixed(6)}})}return{cells:c,clocks:l,mainMeter:g()}}function uf(e){return(e?.units??[]).flatMap(e=>G(e.atom).flatMap(e=>e.kind===`ref`?[e.name]:[]))}function df(e,t,n,r=/* @__PURE__ */ new Map,i=/* @__PURE__ */ new Map){let{error:a,warn:o,unknownCell:s}=e;for(let e of n.values()){let r=n=>t.get(e.name)?.paramSpans?.[n]??t.get(e.name).span;if(typeof e.params.body==`string`&&!(e.params.body in pl)&&a(`body=${e.params.body}: one of ${Object.keys(pl).join(`, `)}`,r(`body`)),typeof e.params.board==`string`&&e.params.board!==`none`&&!(e.params.board in pl)&&a(`board=${e.params.board}: none, or one of ${Object.keys(pl).join(`, `)}`,r(`board`)),typeof e.params.couple==`string`){let t=n.get(e.params.couple);t?typeof t.params.body!=`string`&&a(`couple=&${t.name}: it couples to another resonator (a cell with body=)`,r(`couple`)):s(e.params.couple,r(`couple`))}typeof e.params.excite==`string`&&!n.get(e.params.excite)?.mix&&a(`excite=&${e.params.excite}: a resonator is driven by sound — a mix`,r(`excite`))}for(let e of n.values()){let r=e.show?.startsWith(`mix:&`)?e.show.slice(5):null;if(r===null)continue;let i=t.get(e.name)?.paramSpans?.show??t.get(e.name).span,a=n.get(r);e.mix?a?a.root||o(`show=mix:&${r}: a mix's colours follow a grid (a cell with cycle= or map=edo), not &${r}`,i):s(r,i):o(`show=mix:&${r} does nothing on &${e.name}: it names the grid a mix's colours follow, and &${e.name} isn't a mix`,i)}for(let e of n.values()){let r=n=>t.get(e.name)?.paramSpans?.[n]??t.get(e.name).span;if(typeof e.params.write==`string`){let t=n.get(e.params.write);t?t.voice&&a(`write=&${t.name}: a tape records what plays — a melody, not a voice`,r(`write`)):s(e.params.write,r(`write`))}if(typeof e.params.play==`string`){let t=n.get(e.params.play);t?typeof t.params.write!=`string`&&a(`play=&${t.name}: a read head plays a tape — a cell with write= (what it records)`,r(`play`)):s(e.params.play,r(`play`))}}for(let e of n.values()){let r=e.params.fm;if(typeof r!=`string`)continue;let i=t.get(e.name)?.paramSpans?.fm??t.get(e.name).span,o=n.get(r);if(!o)s(r,i);else if(!o.voice)a(`fm=&${r}: a modulator is a voice (s=sine ratio=…)`,i);else{let t=/* @__PURE__ */ new Set([e.name]);for(let e=r;e;e=typeof n.get(e)?.params.fm==`string`?n.get(e).params.fm:void 0){if(t.has(e)){a(`fm=&${r}: the modulators come back round to &${e} — FM chains can't loop`,i);break}t.add(e)}}}for(let e of t.values())for(let[t,r]of Object.entries(e.paramCells??{})){Xc.has(t)||a(`${t}= can't move: it takes a number (these can: ${[...Xc].join(` `)})`,r.span),r.range&&!(r.range[0]>=0&&r.range[1]>=0)&&a(`${t}=: a range of positive values, low..high`,r.span);let e=0;for(let t of r.factors){let r=n.get(t.name);r?r.map?.kind===`adsr`&&e++:s(t.name,t.span)}e>1&&a(`${t}=: one envelope (map=adsr) at most — the other factors scale it`,r.span),e&&!r.range&&a(`${t}=&env: an envelope runs 0 to 1 — give it a range: ${t}=200..3000 * &env`,r.span)}for(let e of t.values()){let r=e.params.legato,i=e.paramSpans.legato??e.span,s=e.frees?.find(e=>e.key===`param`&&e.param===`legato`),c=e=>a(`legato=${e}: a share of each note's held length is above 0 (.5 staccato, 1 as written, 1.5 into the next)`,i);typeof r==`string`?a(`legato=${r}: a share (.5), free(.5, .25..2.5) or a cell of shares (&artic)`,i):typeof r==`number`&&!(r>0)?c(String(r)):s&&!(s.lo>0)&&c(`free(${s.value}, ${s.lo}..${s.hi})`);let l=e.legato?.find(e=>!(e.share>0));l&&c(`${l.level}:${l.share}`),e.legato&&!n.get(e.name)?.meter&&o(`legato=${e.legato.map(e=>`${e.level}:${e.share}`).join(`,`)} gives the lines tapping a meter their share: &${e.name} is not a meter, so it does nothing`,i);let u=e.paramCells?.legato;u?.range&&!(u.range[0]>0)&&c(`${u.range[0]}..${u.range[1]}`);for(let e of u&&!u.range?u.factors:[]){let n=t.get(e.name),r=(n?.braid.kind===`list`?n.braid.tokens.flatMap(e=>G(e.atom)).flatMap(e=>e.kind===`note`?[e.value+e.alter]:e.kind===`chord`?e.notes:[]):[]).find(e=>!(e>0));r!==void 0&&c(`&${e.name}: its ${r}`)}}for(let e of t.values())e.stride!==null&&e.step?.kind!==`driven`&&e.step?.kind!==`tap`&&o(`stride= only matters with step=&cell or a tap (step=1m)`,e.paramSpans?.stride??e.span);for(let e of t.values())for(let[t,r]of[[`env`,e.env],[`pitch`,e.pitch]]){if(!r)continue;let e=n.get(r.name);e?t===`env`&&e.map?.kind!==`adsr`&&e.map?.kind!==`amp`&&e.map?.kind!==`lin`&&e.map?.kind!==`db`?a(`env= takes a volume: a cell with map=adsr (an envelope), map=amp, map=db or map=lin`,r.span):t===`pitch`&&(e.map?.kind===`adsr`||e.map?.kind===`amp`||e.map?.kind===`db`)&&a(`pitch= takes a pitch (a vibrato, map=lin to glide), not a volume`,r.span):s(r.name,r.span)}for(let e of t.values()){if(e.map?.kind!==`adsr`)continue;let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];(t.length!==4||t.some(e=>!(e>=0))||t[2]>1)&&a(`map=adsr takes four numbers: attack decay sustain release — seconds, and sustain a level 0…1 (map=adsr .01 .3 .5 .4)`,e.map.span)}for(let e of t.values()){if(e.map?.kind!==`style`)continue;let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];(t.length!==xn.length||t.some((e,t)=>!(e>=xn[t].range[0]&&e<=xn[t].range[1])))&&a(`map=style takes a value for each axis, in order: ${xn.map(e=>`${e.name} (${e.range[0]} to ${e.range[1]})`).join(`, `)} (map=style .3 .45 .55 .55, or sync=.3 harm=.45 artic=.55 energy=.55)`,e.map.span)}for(let e of t.values()){if(e.map?.kind!==`ratios`)continue;let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];e.over===null?(t.length<2||t.some((e,n)=>!(e>0)||n>0&&!(e>t[n-1])))&&a(`map=ratios lists one period's tones as rising ratios, the last the period: map=ratios 1 9/8 5/4 4/3 3/2 5/3 15/8 2`,e.map.span):a(`A grid (map=ratios) reads nothing: its braid is its tones`,e.map.span)}for(let e of t.values())e.map?.kind===`edo`&&(e.over!==null||e.braid.kind!==`blank`)&&a(`A grid (map=edo, map=ed(r)) reads nothing and has no braid: &${e.name} cycle=19 map=edo`,e.map.span);for(let a of t.values()){let t=a.over?n.get(a.over.name):void 0;if(!t||t.kit||i.has(t.name))continue;let s=uf(t);if(!s.length||s.every(e=>r.get(e)===t.name)||e.broken.has(a.name))continue;let c=[...new Set(s)].map(e=>`&`+e).join(` `);o(`&${t.name} is read as a table, but its cells (${c}) aren't entries: a table is its numbers. To play cells one after another, splice them into a braid (&${a.name} ${c}); choosing a melody per step isn't built yet (#29)`,a.over.span)}for(let[e,i]of r)[...n.values()].some(t=>t.step?.driver===e||Object.values(t.paramClocks).some(t=>t.driver===e))||o(`&${e} is a section of &${i}, but nothing is stepped by it: step=&${e} on what it should play (or a name mistyped)`,t.get(e).span);for(let e of t.values()){let t=e.map?.kind===`table`?n.get(e.map.table.name):void 0;t&&(t.mix||t.sink||hl(t))&&o(`map=&${t.name}: a map reads a table's numbers, and &${t.name} is ${hl(t)?`a MIDI card`:t.sink?`the sound card`:`a mix`}, which has none: nothing is mapped`,e.map.span)}for(let e of n.values()){let n=e.map?.kind===`midi`?e.map.channel:null;if(n===null)continue;let r=t.get(e.name);(r?.braid.kind===`list`?r.braid.tokens:[]).forEach(e=>{e.repeat>1&&e.atom.kind!==`rest`&&o(`!${e.repeat} on a card with one channel (map=midi(${n})): each note goes out ${e.repeat.toLocaleString(`en`)} times on it, at once — leave out the !${e.repeat}`,e.span)})}for(let e of new Set(r.values()))if(![...t.values()].some(t=>t.over?.name===e)){let n=[...r].filter(([,t])=>t===e).map(([e])=>e),i=t.get(n[0])?.step,a=i?.kind===`driven`?i.driver.name:`bar`;o(`&${e} declares sections (${n.map(e=>`&`+e).join(` `)}), and nothing selects them: every part plays all the time. A selector reads the table and switches them, a step of the form at a time: &song over=&${e} step=&${a}/16 0 [0,1]`,t.get(e).span)}let c=Math.max(12,...[...n.values()].filter(e=>e.root).map(e=>e.cycle))*ff;for(let e of n.values()){let r=t.get(e.name);if(!r||e.implicit)continue;let i=r.braid.kind===`list`?r.braid.tokens:[];e.units.forEach((t,r)=>{let a=t.atom;if(a.kind!==`ref`||!a.values||Math.abs(a.values.add)<=c)return;let s=n.get(a.name);o(`degree(${s?.lambda?`&( … )`:`&`+a.name}, ${a.values.add}) moves it ${Math.abs(a.values.add).toLocaleString(`en`)} steps, over a hundred octaves: ${a.values.add>0?`its notes land above 20 kHz and are dropped`:`its notes fall below hearing`}, nothing plays`,i[r]?.span??e.span)});let a=Math.abs(e.shift)/Math.max(1,e.units.length);a>pf&&o(`shift=${e.shift} turns ${e.lambda?`an unnamed cell &( … )`:`&`+e.name} about ${Math.round(a).toLocaleString(`en`)} laps, and every lap climbs a lap of the grid: its notes leave hearing`,r.paramSpans?.shift??r.span)}}let ff=100,pf=20;function mf(e,t,n,r,{sinks:i,cards:a,bindings:o,soundHead:s}){let{parsed:c,error:l,warn:u,unknownCell:d}=e,f=new Set([...t.values()].flatMap(e=>e.gate?[e.gate.notes,e.gate.plays,...(e.gate.lines??[]).flatMap(e=>[e.line,e.plays])]:[])),p=[],m=[],h=[],g=e=>!!e.clock&&t.get(e.name)?.step?.whole===!1,_=e=>(r.get(e.clock)?.perSecond??0)*e.rate,v=e=>{let t=[...e].sort((e,t)=>_(t.c)-_(e.c)),[n,r]=[_(t[0].c),_(t[1].c)];return n-r>1e-9*Math.max(n,r)?t[0]:null};for(let{b:r,span:i,gains:a,via:c,parts:_,through:y,silent:b,midi:x}of o){let o=e=>t.has(e.name)?!0:(d(e.name,e.span),!1);if(![r.voice,...r.pitches.map(e=>e.ref)].every(o)||[r.voice,...r.pitches.map(e=>e.ref)].some(t=>e.broken.has(t.name)))continue;if(s(r.voice.name)&&r.pitches.length===0){m.push({head:r.voice.name,tape:n.get(r.voice.name).params.play,gains:[a[0],a[1]],parts:_,through:[...y]});continue}let S=n.get(r.voice.name);if(!S)continue;if(typeof S.params.body==`string`&&r.pitches.length===0){let[e,t]=ml(S.params.pan);h.push({cell:S.name,gains:[a[0]*e,a[1]*t],parts:_.map(n=>({...n,gains:[n.gains[0]*e,n.gains[1]*t]})),through:[...y]});continue}let C=[...c,...y].flatMap(e=>{let t=n.get(e)?.gate;return t?t.lines?.map(e=>e.plays)??[t.plays]:[]}).find(e=>r.pitches.some(t=>t.ref.name===e)),w=S.kit?r.pitches.find(e=>t.get(e.ref.name)?.over?.name===S.name||e.ref.name===C):void 0;if(S.kit&&!w){l(`A kit is a table of voices: read the pattern through it, &drums over=&${S.name}, and mix &drums`,r.voice.span);continue}if(S.root){l(`&${S.name} is a grid, not a voice`,r.voice.span);continue}if(r.voice.pick||r.voice.shift){l(`Pick or shift the melody, not the voice: &theme[0] * &${S.name}`,r.voice.span);continue}if(t.get(S.name)?.step?.kind===`driven`||t.get(S.name)?.step?.kind===`tap`){l(`&${S.name} moves with step=&…, so it can't be a voice: a voice moves at a rate, its pitch (loop=C4)`,r.voice.span);continue}!S.params.s&&S.freq<20&&u(`&${S.name} loops at ${+S.freq.toFixed(2)} Hz, below hearing — is it a pitch? Then leave out its sound parameters: (&theme + &${S.name}) * &lead`,r.voice.span);let T=[...S.env?[{ref:t.get(S.name).env,sign:1,inSum:!1}]:[],...S.pitch?[{ref:t.get(S.name).pitch,sign:1,inSum:!0}]:[]],E=r.pitches.find(e=>e.ref.transpose||e.ref.degree);E?.ref.transpose?l(`&${E.ref.name}^$${E.ref.transpose}: transposing (^$) is for braids — in a mix, add pitch: &${E.ref.name} + ${E.ref.transpose}`,E.ref.span):E&&l(`&${E.ref.name}^${E.ref.degree}: moving by degrees (^) is for braids — in a mix, write a cell that plays it: &u step=&bar &${E.ref.name}^${E.ref.degree}`,E.ref.span);let D=/* @__PURE__ */ new Map,O=[...r.pitches,...T].map(e=>{let t=n.get(e.ref.name),r=t&&typeof t.params.play==`string`?n.get(t.params.play):void 0,i=r&&typeof r.params.write==`string`?n.get(r.params.write):void 0;return t&&r&&i&&(D.set(e,{head:t.name,tape:r.name,at:typeof t.params.at==`number`?t.params.at:0,length:typeof r.params.length==`number`?r.params.length:0,erase:typeof r.params.erase==`number`?Math.min(1,Math.max(0,r.params.erase)):1}),t=i),{t:e,c:t}}).filter(e=>e.c),k=O.filter(e=>e.c.voice);if(k.length){l(`Two sounds can't multiply (&${k[0].c.name} * &${S.name}): &${k[0].c.name} plays as a voice — mix them with + or ,`,k[0].t.ref.span);continue}let ee=e=>e.c.map?.kind===`adsr`,A=e=>e.c.map?.kind===`amp`||e.c.map?.kind===`db`||e.c.map?.kind===`lin`&&!e.t.inSum,j=O.filter(ee),te=O.filter(e=>!A(e)&&!ee(e)),M=O.filter(e=>A(e));if(j.length>1){l(`One envelope per note: &${j[0].c.name} and &${j[1].c.name} both shape &${S.name}`,j[1].t.ref.span);continue}let ne=j.find(e=>e.t.inSum||e.t.sign<0);if(ne){l(`&${ne.c.name} is an envelope (map=adsr): a volume, it multiplies — keep it out of pitch sums`,ne.t.ref.span);continue}let N=j[0]?wl(j[0].c):null,re=M.find(e=>e.t.sign<0);if(re){l(`&${re.c.name} is a volume (map=amp): it multiplies, it can't be subtracted`,re.t.ref.span);continue}let P=te.filter(e=>g(e.c)),ie=P.length===0;ie&&(P=M.filter(e=>g(e.c)));let[F,ae]=S.kit?[1,1]:ml(S.params.pan),oe=e=>({cell:e.c.name,pick:e.t.ref.pick,shift:e.t.ref.shift,sign:e.t.sign,...e.t===w?{picks:!0}:{}}),se={voice:S.name,kit:S.kit,offset:r.offset,gains:[a[0]*F,a[1]*ae],parts:_.map(e=>({...e,gains:[e.gains[0]*F,e.gains[1]*ae]})),select:[],...b?{silent:!0}:{},...x?.length?{midi:x}:{},through:[...y],envelope:N,envelopeCell:j[0]?.c.name??null,via:[...c],span:i},ce=new Set(T);if(P.length===0&&!S.kit&&te.every(e=>ce.has(e.t))){p.push({id:`${S.name}:${S.name}:${r.voice.span.line}:${r.voice.span.col}`,...se,cell:S.name,pick:null,shift:0,sign:1,gate:!1,drone:!0,mods:te.map(oe),levels:M.map(oe)});continue}if(P.length===0){l(O.length?`Nothing starts notes on &${S.name}: give a pitch or a volume (map=amp) step= timing (step=4n); loop= terms only bend`:`&${S.name} has nothing to play: a melody goes before it, like &melody * &${S.name}`,i);continue}if(P.length>1){let e=v(P);if(!e){l(`Both &${P[0].c.name} and &${P[1].c.name} would start notes on &${S.name}, at the same rate — make one coarser (it then holds under the other) or loop= (it then bends or shapes them)`,P[1].t.ref.span);continue}P=[e]}let{t:I,c:le}=P[0],ue=O.find(e=>Sl(e.c,e.t.ref.pick)===null);if(ue){l(Cl(ue.c.name,ue.t.ref.pick,ue.c.units.length),ue.t.ref.span);continue}if(Sl(le,I.ref.pick)===0){l(`&${le.name} has no steps to play`,I.ref.span);continue}!D.has(I)&&!f.has(le.name)&&hf(n,le,I.ref.pick)&&u(`&${le.name}${I.ref.pick?Fs(I.ref.pick):``} plays only rests (~): nothing sounds on &${S.name}`,I.ref.span),p.push({id:`${S.name}:${le.name}:${I.ref.span.line}:${I.ref.span.col}`,...se,cell:le.name,pick:I.ref.pick,shift:I.ref.shift,sign:I.sign,gate:ie,mods:te.filter(e=>e!==P[0]).map(oe),levels:M.filter(e=>e!==P[0]).map(oe),...D.has(I)?{tape:D.get(I)}:{}})}let y=e=>p.some(t=>t.voice===e&&(t.parts.length||t.silent)),b=p.find(e=>e.midi&&!e.parts.length&&!e.silent&&!e.kit&&!y(e.voice)&&Object.keys(t.get(e.voice)?.params??{}).some(e=>Zc.has(e)));if(b){let e=t.get(b.voice),n=Object.keys(e.params).filter(e=>Zc.has(e));u(`&${b.voice} is only on a MIDI card: its sound (${n.map(e=>`${e}=`).join(` `)}) is heard here but isn't sent — MIDI carries its notes, velocity and bends; the device makes its own`,e.paramSpans[n[0]]??e.span)}return i.length===0&&a.length===0&&c.cells.length>0&&!c.broken?.length&&u(`Nothing plays yet — write a sound: a voice alone plays its own pitch (&a loop=A4), a melody plays on one ([&melody * &a])`,Ou),{outputs:p,returns:m,resonances:h}}function hf(e,t,n,r=[]){if(r.includes(t.name)||t.frees.some(e=>e.key===`braid`))return!1;let i=xl(t.units.length,n,t.shift);if(!i?.length)return!1;let a=n=>{if(n.kind===`rest`)return!0;if(n.kind===`seq`)return G(n).every(a);let i=n.kind===`ref`?e.get(n.name):void 0;return!!i&&n.kind===`ref`&&hf(e,i,n.pick,[...r,t.name])};return i.every(e=>a(t.units[e].atom))}function gf(e){let t=new Map(e),n=/* @__PURE__ */ new Map;for(let e of t.values())(e.root||e.over)&&n.set(e.name,e.root?e.name:e.over);for(let e=!0,r=0;e&&r<64;r++){e=!1;for(let r of t.values()){let t=n.get(r.name);if(t)for(let i of r.children.keys())n.has(i)||(n.set(i,t),e=!0)}}for(let e of t.values())t.set(e.name,{...e,context:n.get(e.name)??`fifths12TET`});for(let e of t.values()){if(typeof e.params.body!=`string`)continue;let n=[];for(let r of e.units.flatMap(e=>G(e.atom)))if(r.kind===`note`)n.push({shift:r.value+r.alter,params:{}});else if(r.kind===`ref`){let e=t.get(r.name);if(e)for(let t of e.units)t.atom.kind===`note`&&n.push({shift:t.atom.value+t.atom.alter,params:e.params})}else if(r.kind===`chord`)for(let[e,t]of r.notes.entries())n.push({shift:t+r.alters[e],params:{}});t.set(e.name,{...e,exciters:n.length?n:Array.from({length:12},(e,t)=>({shift:t,params:{}}))})}return t}let _f=[`restart`,`resume`,`free`];function vf(e,{decls:t,implicit:n,sections:r},i,a,o,s=/* @__PURE__ */ new Map){let{warn:c}=e,l=new Set([...i.values()].flatMap(e=>typeof e.params.fm==`string`?[e.params.fm]:[])),u=e=>{let t=/* @__PURE__ */ new Set;return e.voice&&t.add(`voice`),a.get(e.name)&&!a.get(e.name).belt&&t.add(`clock`),e.step&&t.add(`driven`),typeof e.params.motor==`number`&&t.add(`motor`),typeof e.params.write==`string`&&t.add(`tape`),typeof e.params.play==`string`&&t.add(`head`),typeof e.params.body==`string`&&t.add(`resonator`),typeof e.params.scope==`string`&&t.add(`scope`),typeof e.params.law==`string`&&t.add(`law`),e.gate&&t.add(`gate`),e.sink&&t.add(`card`),e.note&&t.add(`note`),typeof e.params.fm==`string`&&t.add(`carrier`),l.has(e.name)&&t.add(`modulator`),r.has(e.name)&&t.add(`section`),e.over&&([...r.values()].includes(e.over)||s.has(e.over))&&t.add(`selector`),[...s.values()].some(t=>t.includes(e.name))&&t.add(`performer`),t},d=new Set([...t.values()].flatMap(e=>e.swingFrom?[e.swingFrom.name]:[]));for(let r of t.values()){let t=i.get(r.name);if(!t||n.has(r.name))continue;let a=r.show?.split(`:`)[0];a&&!Ql.includes(a)&&!o.has(a)&&e.error(`show=${a}: not a show (${Ql.join(` `)}), not one of the built-in plugins (${[...o.values()].filter(e=>e.builtin).map(e=>e.name).join(` `)}), and the piece carries no plugin of that name (${yu})`,r.span);let s=u(t),l=[...Object.keys(r.params).map(e=>[e,r.paramSpans[e]??r.span]),...Object.entries(r.paramCells??{}).map(([e,t])=>[e,t.span]),...Object.entries(r.paramClocks??{}).map(([e,t])=>[e,t.span]),...[`env`,`pitch`,`title`].filter(e=>r[e]).map(e=>[e,e===`title`?r.span:r[e].span])];for(let[e,n]of l){let i=qc[e];e===`anchor`&&s.has(`law`)?c(`anchor= sets the clock a law reads, not the law: write it on ${t.over?`&${t.over}`:`its day (over=&day, a clock loop=1d)`} — the law on &${r.name} doesn't read it`,n):e===`pan`&&(t.mix||t.sink||hl(t))?c(`pan= places a voice: on ${t.sink?`the sound card`:hl(t)?`a MIDI card`:`the mix &${r.name}`} it does nothing — put it on the voice (&voice pan=${r.params.pan})`,n):e===`pan`&&typeof r.params.pan==`number`&&(r.params.pan<0||r.params.pan>1)?c(`pan=${r.params.pan}: pan runs from 0 (left) to 1 (right); ${r.params.pan<0?`this plays hard left`:`this plays hard right`}`,n):i?.on&&!i.on.some(e=>s.has(e))&&!(e===`swing`&&d.has(r.name))?c(`${e}= acts on ${el(i.on)}: on &${r.name} it does nothing`,n):e===`restart`&&!_f.includes(r.params.restart)?c(`restart=${r.params.restart}: what switching a part on does to its time is restart, resume or free — this plays as restart`,n):i?.value===`number`&&!t.voice&&typeof r.params[e]==`string`&&c(`${e}= takes a number: '${r.params[e]}' does nothing`,n)}if(r.gate){let e=r.step?r.step.whole?`loop`:`step`:null;for(let[t,n]of[[`over`,r.over?.span],[e,r.step?.span],[`shift`,r.shift===null?void 0:r.paramSpans.shift],[`stride`,r.stride===null?void 0:r.paramSpans.stride],[`map`,r.map?.span],[`cycle`,r.cycle===null?void 0:r.span]])t&&n&&c(`${t}= on a gate does nothing: a gate plays with each note of play=&${r.gate.notes}, so it times and reads nothing itself — put it on &${r.gate.notes}`,n);r.gate.gain<0&&c(`${r.gate.port===`trigger`?`gain`:`level`}=${r.gate.gain}: a level is 0 or more, and a negative one doesn't play softer — write ${-r.gate.gain}`,r.paramSpans[r.gate.port===`trigger`?`gain`:`level`]??r.span)}}let f=new Set([...t.values()].flatMap(e=>e.show?[e.show.split(`:`)[0]]:[]));for(let e of o.values())!e.builtin&&!f.has(e.name)&&c(`the piece carries the plugin "${e.name}", but no cell says show=${e.name}`,{line:e.line,col:1,len:`=== plugin ${e.name} ===`.length})}let yf=e=>Number.isFinite(e)?Math.round(e).toLocaleString(`en`):`unboundedly many`,bf=e=>e.lambda?`An unnamed cell &( … )`:`&${e.name}`;function xf(e,t,n,r,i){let{error:a,warn:o}=e,s=/* @__PURE__ */ new Map,c=/* @__PURE__ */ new Set,l=e=>{let t=s.get(e);if(t)return t;if(c.has(e))return[];c.add(e);let r=(n.get(e)?.units??[]).map(e=>us(e,e=>e.kind===`note`||e.kind===`choice`?1:e.kind===`chord`?e.notes.length:e.kind===`ref`?u(e.name,e.pick):0));return c.delete(e),s.set(e,r),r},u=(e,t=null)=>{let n=l(e);return(bl(n.length,t)??[]).reduce((e,t)=>e+n[t],0)},d=/* @__PURE__ */ new Set;for(let e of n.values()){if(e.implicit)continue;let n=l(e.name),r=n.reduce((e,t)=>e+t,0);if(r<=5e4||(d.add(e.name),e.units.some(e=>e.atom.kind===`ref`&&u(e.atom.name,e.atom.pick)>5e4)))continue;let i=t.get(e.name),o=i?.braid.kind===`list`?i.braid.tokens:[],s=0,c=o[n.findIndex(e=>(s+=e)>5e4)]?.span??e.span;a(`${bf(e)} expands to ${yf(r)} notes: more than ${yf(ul)}, the most a cell can hold — repeat less (!n), or let a clock repeat it`,c)}let f=/* @__PURE__ */ new Set,p=/* @__PURE__ */ new Map;for(let e of i){let i=n.get(e.cell);if(!i?.clock||d.has(i.name)||f.has(i.name)||i.params.law!==void 0)continue;let o=r.get(i.clock);if(!o)continue;let s=Math.max(1,i.steps),c=o.perSecond*i.rate*u(i.name)/s,l=o.tap?.meter??i.clock;if(c>(p.get(l)??0)&&p.set(l,c),!(c>2e3))continue;f.add(i.name);let m=t.get(i.name)?.step?.span??t.get(i.clock)?.step?.span??i.span;a(`${bf(i)} would start ${yf(c)} notes a second: more than ${yf(dl)}, the most a cell can play — slow its step= or loop=`,m)}let m=/* @__PURE__ */ new Set;for(let e of n.values()){let t=r.get(e.name);t&&!p.has(e.name)&&e.frees.some(e=>e.key===`step`||e.key===`loop`)&&(p.set(e.name,t.perSecond*u(e.name)/Math.max(1,e.steps)),m.add(e.name))}for(let[e,t]of p){let r=n.get(e);if(!r||!(t>0)||!Number.isFinite(t))continue;let i=e=>Math.floor(e.value*dl/t),a=r.frees.filter(e=>(e.key===`step`||e.key===`loop`)&&e.value>0&&e.hi>i(e)&&i(e)>=e.value);if(a.length){r.frees=r.frees.map(e=>a.includes(e)?{...e,hi:i(e)}:e);for(let t of a)o(m.has(e)?`${t.key}=free(…): moved up to ${yf(t.hi)}, &${e} would move what it moves more than ${yf(dl)} times a second, the most a cell can play: the slider stops at ${yf(i(t))}`:`${t.key}=free(…): moved up to ${yf(t.hi)}, a cell &${e} clocks would start more than ${yf(dl)} notes a second, the most a cell can play: the slider stops at ${yf(i(t))}`,t.span)}}}function Sf(e,t,n){if(!n.size)return[...e];let r=e=>[...t.values()].filter(t=>t.over===e&&t.clock);return e.map(e=>{let i=t.get(e.cell);for(let a=0;i?.step&&a<32;a++){let a=i.step.driver,o=n.get(a);if(o){let n=t.get(o).units.findIndex(e=>e.atom.kind===`ref`&&e.atom.name===a),i=r(o).map(e=>({cell:e.name,entry:n,part:a})),s=[.../* @__PURE__ */ new Set([...e.via,...i.map(e=>e.cell),o,a])];return i.length?{...e,via:s,select:[...e.select,...i]}:e}i=t.get(a)}return e})}function Cf(e){let t=new Map(e.cells.map(e=>[e.name,e.map?.kind??(e.style?`style`:null)])),n=[],r=(e,r)=>{let{slot:i,...a}=e,o=a.name,s=a.span??r.span;if(!t.has(o))return{...a,pick:null};let c=t.get(o),l=c?Cn[c]:void 0,u=l?.indexOf(i)??-1;return u>=0?{...a,pick:{kind:`at`,i:u,abs:!0}}:(n.push({severity:`error`,message:l?`&${o}[${i}]: &${o} (map=${c}) has no slot ${i}; its slots are ${l.join(`, `)}`:`&${o}[${i}]: &${o}'s map names no slots (${c?`map=${c}`:`it has no map=`}); pick by position (&${o}[$0]), name the slots with map=${Object.keys(Cn).join(` or map=`)}, or give it a style= (its axes)`,span:s}),{...a,pick:null})},i=(e,t)=>{if(Array.isArray(e)){let n=!1,r=e.map(e=>{let r=i(e,t);return r!==e&&(n=!0),r});return n?r:e}if(typeof e!=`object`||!e)return e;let n=e,a=null;for(let[e,r]of Object.entries(n)){let o=i(r,t);o!==r&&((a??={...n})[e]=o)}let o=a??n;return typeof o.slot==`string`&&typeof o.name==`string`?r(o,t):o},a=!1,o=e.cells.map(e=>{let t=i(e,e);return t!==e&&(a=!0),t});return a?{...e,cells:o,diagnostics:[...e.diagnostics,...n]}:e}function wf(e){let t=new Set(e.cells.map(e=>e.name)),n=/* @__PURE__ */ new Map,r=[];for(let i of e.cells){let e=i.params.play??i.params.trigger;if(typeof e!=`string`||i.braid.kind===`blank`||t.has(e)||n.has(e))continue;let a=Eu(`&${e} step=1m ~`).cells[0];if(!a)continue;let o=i.paramSpans.play??i.paramSpans.trigger??i.span;n.set(e,{...a,span:o}),r.push({severity:`info`,message:`&${i.name} plays &${e}, which no line writes: it rests`,span:o})}return n.size?{parsed:{...e,cells:[...e.cells,...n.values()],diagnostics:[...e.diagnostics,...r]},rested:new Map([...n].map(([e,t])=>[e,t.span]))}:{parsed:e,rested:/* @__PURE__ */ new Map}}let Tf=new Set(ll.map(e=>e.slice(1)));function Ef(e,t,n,r,i){if(![...t.values()].some(e=>e.gate))return;let a=/* @__PURE__ */ new Set,o=(e,t)=>{if(typeof e==`string`){a.add(e);return}if(e&&typeof e==`object`&&!t.has(e)){if(t.add(e),e instanceof Map)for(let[n,r]of e)o(n,t),o(r,t);else if(e instanceof Set)for(let n of e)o(n,t);else for(let n of Object.values(e))o(n,t)}};for(let e of n.values()){let{name:t,...n}=e;o(n,/* @__PURE__ */ new Set)}o(r,/* @__PURE__ */ new Set);for(let e of t.values())e.gate&&o(e.gate,/* @__PURE__ */ new Set);for(let t of n.values())t.clock&&t.units.length&&!a.has(t.name)&&!i.has(t.name)&&!e.broken.has(t.name)&&!Tf.has(t.name)&&e.info(`&${t.name} is written and nothing plays or reads it: it is silent (a part no performer plays)`,t.span)}let Df=e=>new Map([...Tu,...e.plugins??[]].map(e=>[e.name,e]));function Of(e,t,n=/* @__PURE__ */ new Set){let{parsed:r,rested:i}=wf(Cf(e)),a=Du(r,t);for(let[e,t]of i)a.unknown.set(e,[t]);let o=Td(a,Pu(a),n),{decls:s,builtin:c}=o,l=vd(a,s),u=_d(a,s),d=sd(a,s),f=nf(a,s,Xd(a,o,l,u),l),p=lf(a,s,f.cells),{clocks:m}=p;df(a,s,p.cells,o.sections,d),ld(a,s,p.cells,d);let h=mf(a,s,p.cells,m,f),{returns:g,resonances:_}=h,v=cd(Sf(h.outputs,p.cells,o.sections),p.cells,d);xf(a,s,p.cells,m,v),Ef(a,s,p.cells,v,m);let y=gf(p.cells);vf(a,o,y,m,Df(r),d);let b=ad(a,s,o.implicit),{diagnostics:x}=a,S=!x.some(e=>e.severity===`error`);x.sort((e,t)=>e.span.line-t.span.line||e.span.col-t.span.col);let C=(e,t)=>e.line-t.line||e.col-t.col,w=[...a.unknown].map(([e,t])=>({name:e,at:[...t].sort(C)})).sort((e,t)=>C(e.at[0],t.at[0])),T=new Set([...y.values()].filter(e=>e.off).map(e=>`cell:${e.name}`)),E=(e,t,n)=>typeof e.params[t]==`number`?e.params[t]:n;return{ok:S,cells:y,clocks:m,outputs:v,off:T,diagnostics:x,unknown:w,tapes:[...y.values()].filter(e=>typeof e.params.write==`string`&&!!y.get(e.params.write)?.mix).map(e=>({name:e.name,source:e.params.write,length:E(e,`length`,0),erase:Math.min(1,Math.max(0,E(e,`erase`,1))),tone:E(e,`tone`,7e3),drive:E(e,`drive`,.15),hiss:E(e,`hiss`,0),print:E(e,`print`,0),printgap:E(e,`printgap`,.6),dropout:E(e,`dropout`,0),heads:[...y.values()].filter(t=>t.params.play===e.name).map(e=>({head:e.name,at:E(e,`at`,0),wander:E(e,`wander`,0),wanderhz:E(e,`wanderhz`,.2)}))})),returns:g,resonances:_,plugins:Df(r),performers:b,sections:o.sections,...p.mainMeter?{mainMeter:p.mainMeter}:{},...o.mainKey?{mainKey:o.mainKey}:{},...c?{builtinCard:c}:{}}}function kf(e,t,n){let r=e.cells.get(t);return r?r.root?r.cycle:r.scan?r.scan.lap:e.cells.get(r.over??n??r.context)?.cycle??12:12}function Af(e,t,n,r){return jf(e.cells.get(t).units,n,()=>kf(e,t,r))}function jf(e,t,n){let r=e.length;if(r===0||t===0)return[...e];let i=n(),a=Math.floor(t/r),o=t-a*r;return Array.from({length:r},(t,n)=>{let s=e[(n+o)%r],c=i*(a+ +(n+o>=r));if(c===0)return s;let l=ls(s.atom,e=>e.kind===`note`?{...e,value:e.value+c}:e.kind===`choice`?{...e,values:e.values.map(e=>e+c)}:e.kind===`chord`?{...e,notes:e.notes.map(e=>e+c)}:e);return l===s.atom?s:{...s,atom:l}})}let Mf=/* @__PURE__ */ new WeakMap;function Nf(e,t){let n=e.cells.get(t);if(!n.units.some(e=>e.atom.kind===`seq`))return n.units;let r=Mf.get(e);r||Mf.set(e,r=/* @__PURE__ */ new Map);let i=r.get(t);return i||r.set(t,i=n.units.flatMap(e=>e.atom.kind===`seq`?G(e.atom).map(e=>({atom:e,repeat:1,subdivide:1,elongate:1})):[e])),i}let Pf=(e,t)=>{let n=Nf(e,t);return n.length>0&&n.every(e=>e.atom.kind===`chord`)},Ff=/* @__PURE__ */ new WeakMap;function If(e,t,n,r=!1){let i=Ff.get(e);i||Ff.set(e,i=/* @__PURE__ */ new Map);let a=r&&Pf(e,t),o=`${t}|${n}${a?`|in force`:``}`,s=i.get(o);if(s)return s;let c=[],l=jf(Nf(e,t),n,()=>kf(e,t));for(let e of(a?l.slice(0,1):l).flatMap(e=>G(e.atom)))e.kind===`note`?c.push({value:e.value,alter:e.alter}):e.kind===`chord`&&e.notes.forEach((t,n)=>c.push({value:t,alter:e.alters[n]}));return i.size>=256&&i.delete(i.keys().next().value),i.set(o,c),c}function Lf(e,t,n,r,i=0){if(e.cells.get(t).root)return{value:n+r(t)+i,alter:0};let a=If(e,t,r(t)+i,!0);if(a.length===0)return{value:0,alter:0};let o=Math.floor(n),s=Math.floor(o/a.length),c=a[o-s*a.length];return{value:c.value+s*kf(e,t),alter:c.alter}}function Rf(e,t,n,r,i,a){let o=[],s=t,c=n,l=r,u=i;for(let t=0;t<64;t++){let t=e.cells.get(s);if(t.root){let e=l+u+a(s)+c;return o.push({cell:s,index:Math.round(e)}),{root:s,position:e,path:o}}o.push({cell:s,index:Math.floor(l+c)});let n=Lf(e,s,l,a,c);l=n.value+u,u=n.alter,c=t.over?t.overShift:0,s=t.over??t.context}return{root:s,position:l,path:o}}function zf(e,t,n){let r=e.cells.get(t);if(r?.map?.kind===`ratios`){let e=r.map.ratios,t=e.length-1,i=e[t]/e[0],a=Math.floor(n/t),o=n-a*t,s=Math.floor(o),c=o-s,l=(e[s]/e[0])**(1-c)*(e[s+1]/e[0])**+c;return 12*Math.log2(i**+a*l)}let i=r?.map?.kind===`edo`?r.map.period:2;return n*12*Math.log2(i)/(r?.cycle??12)}function Bf(e,t,n){let r=e.cells.get(t),i=2**(n/12);if(r?.map?.kind===`ratios`){let e=r.map.ratios,t=e.map(t=>t/e[0]),n=t.length-1,a=Math.floor(Math.log(i)/Math.log(t[n])+1e-9),o=i/t[n]**+a,s=0;for(;s<n-1&&t[s+1]<=o+1e-12;)s++;let c=Math.log(o/t[s])/Math.log(t[s+1]/t[s]);return a*n+s+c}let a=r?.map?.kind===`edo`?r.map.period:2;return n*(r?.cycle??12)/(12*Math.log2(a))}function Vf(e,t){let n=[],r=t;for(let t=0;r!==null&&t<64;t++){n.push(r);let t=e.cells.get(r);r=!t||t.root?null:t.over??t.context}return n}let Hf=(e,t,n)=>!!n&&!n.abs&&Uf(e,t,n),Uf=(e,t,n)=>!!n&&e.cells.get(t).units.every(e=>e.atom.kind===`note`&&e.repeat===1&&e.subdivide===1&&e.chance===void 0);function Wf(e,t){let n=t;for(let t=0;t<64;t++){let t=e.cells.get(n);if(!t||t.root)return n;n=t.over??t.context}return n}let Gf=.15,Kf=(e,t)=>{let n=null;for(let r of e)r.t<=t&&(n=r);return n&&n.speed!==null&&t<=n.t+.35?n.speed:null},qf=/* @__PURE__ */ new WeakMap,Jf=(e,t)=>{let n=qf.get(e);return n||qf.set(e,n=/* @__PURE__ */ new Set),n.add(t),t},Yf=[],Xf=e=>Yf.push(e),X=.002,Zf=3600,Qf=/* @__PURE__ */ new WeakMap;function $f(e,t){let n=Qf.get(e);return n||Qf.set(e,n=/* @__PURE__ */ new Map),n.has(t)||n.set(t,ep(e,t)),n.get(t)}function ep(e,t){let n=e.cells.get(t),r=(e,t)=>typeof n?.params[e]==`number`?n.params[e]:t;if(!n||typeof n.params.motor!=`number`)return null;let i=Math.max(1e-6,r(`motor`,1)),a=Math.max(1e-6,r(`mass`,1)),o=Math.max(0,r(`friction`,0));for(let n of e.cells.values())n.name!==t&&n.step?.driver===t&&(typeof n.params.mass==`number`&&(a+=n.params.mass),typeof n.params.friction==`number`&&(o+=n.params.friction));let s=r(`wind`,1/0),c=r(`wow`,0),l=[0],u=[0],d=0,f=!1,p=[],m=e=>{for(;!f&&(l.length-1)*X<Math.min(e,Zf);){let e=(l.length-1)*X,t=Number.isFinite(s)?Math.max(0,1-(e/s)**4):1,n=1+c*Math.sin(2*Math.PI*.55*e),r=Kf(p,e);d+=(i*(n-d)*t-o*d)/a*X,r!==null&&(d+=(r-d)*Gf),Number.isFinite(d)||(d=0),d<0&&r===null&&(d=0),l.push(l[l.length-1]+d*X),u.push(d),t===0&&r===null&&d<.02&&(f=!0)}},h=e=>{let t=Math.max(1,Math.floor(e/X));t>=l.length||(l.length=t+1,u.length=t+1,d=u[t],f=!1)},g=()=>({t:(l.length-1)*X,s:l[l.length-1]});return Jf(e,{grab(e,t){h(e),p.push({t:e,speed:t})},cut:h,speed(e){let t=.01;return Math.max(0,(this.nominal(e+t)-this.nominal(Math.max(0,e-t)))/(e+t-Math.max(0,e-t)))},stopsAt(){return Number.isFinite(s)?(m(Zf),f?(l.length-1)*X:null):null},nominal(e){if(e<=0)return 0;m(e+X);let t=e/X;if(t>=l.length-1){let t=g();return f?t.s:t.s+(e-t.t)*d}let n=Math.floor(t);return l[n]+(l[n+1]-l[n])*(t-n)},real(e){if(e<=0)return 0;let t=(l.length-1)*X+60;for(;!f&&l[l.length-1]<e&&(l.length-1)*X<Math.min(Zf,t);)m((l.length-1)*X+10);if(l[l.length-1]<e){if(f||d<=1e-9)return 1/0;let t=g();return t.t+(e-t.s)/d}let n=0,r=l.length-1;for(;r-n>1;){let t=n+r>>1;l[t]<e?n=t:r=t}let i=l[r]-l[n];return(n+(i>0?(e-l[n])/i:0))*X}})}function tp(e,t,n,r,i,a){let o=[0],s=[{y:0,v:0,off:0,px:0,stretch:0,slipping:!1}],c=0,l=!1,u=[],d=e=>{for(;!l&&(o.length-1)*X<Math.min(e,Zf);){let e=(o.length-1)*X,d=s[s.length-1],{y:f,v:p,off:m}=d,h=a(e+X),g=(h-d.px)/X,_=h-m-f,v=!1;if(t*Math.abs(_)>i){let e=Math.sign(_)*i/t;m+=_-e,_=e,v=!0}let y=Kf(u,e);p+=(t*_+r*(g-p))/n*X,y!==null&&(p+=(y-p)*Gf),Number.isFinite(p)||(p=0),f+=p*X,o.push(Math.max(o[o.length-1],f)),s.push({y:f,v:p,off:m,px:h,stretch:_,slipping:v}),c=Math.abs(g)<1e-6&&Math.abs(p)<1e-4&&Math.abs(_)<1e-4&&y===null?c+X:0,c>.5&&(l=!0)}},f=e=>{let t=Math.max(1,Math.floor(e/X));t>=o.length||(o.length=t+1,s.length=t+1,c=0,l=!1)},p=e=>{if(e<=0)return 0;d(e+X);let t=Math.min(e/X,o.length-1),n=Math.floor(t);return n>=o.length-1?o[o.length-1]:o[n]+(o[n+1]-o[n])*(t-n)},m={nominal:p,real(e){if(e<=0)return 0;let t=(o.length-1)*X+60;for(;!l&&o[o.length-1]<e&&(o.length-1)*X<Math.min(Zf,t);)d((o.length-1)*X+10);if(o[o.length-1]<e)return 1/0;let n=0,r=o.length-1;for(;r-n>1;){let t=n+r>>1;o[t]<e?n=t:r=t}let i=o[r]-o[n];return(n+(i>0?(e-o[n])/i:0))*X},stopsAt:()=>null,speed(e){let t=.01;return Math.max(0,(p(e+t)-p(Math.max(0,e-t)))/(e+t-Math.max(0,e-t)))},grab(e,t){f(e),u.push({t:e,speed:t})},cut:f,state(e){if(e<=0)return{stretch:0,slipping:!1};d(e+X);let t=Math.min(Math.floor(e/X),s.length-1),n=!1;for(let e=Math.max(0,t-50);e<=t;e++)s[e].slipping&&(n=!0);return{stretch:s[t].stretch,slipping:n}}};return e?Jf(e,m):m}let np=1e-9;function rp(e,t,n){if(t.tap)return op(t.tap,ap(e,e.clocks.get(t.tap.meter),n),sp(e,t.tap.meter));let r=ap(e,t,n);return t.swung?ip(t.swung,r):r}function ip(e,t){let n=Math.max(1,e.length),r=t=>t<n?e[t]:n,i=e=>{let t=Math.floor(e),i=Math.floor(t/n),a=t-i*n;return i*n+r(a)+(e-t)*(r(a+1)-r(a))},a=e=>{let t=Math.floor(e/n),i=e-t*n,a=0;for(;a+1<n&&r(a+1)<=i;)a++;let o=r(a+1)-r(a);return t*n+a+(o>0?(i-r(a))/o:0)};return{beats:t.beats,q:e=>t.q(i(e)),stepAt:e=>a(t.stepAt(e)),...t.speed?{speed:t.speed}:{}}}function ap(e,t,n){if(!t.positional&&t.swing!==void 0){let e=Math.min(.95,Math.max(.05,t.swing)),n=t.perSecond;return{beats:1,q:t=>{let r=Math.floor(t/2),i=t/2-r;return(2*r+2*(i<.5?i/.5*e:e+(i-.5)/.5*(1-e)))/n},stepAt:t=>{let r=t*n/2,i=Math.floor(r),a=r-i;return 2*(i+(a<e?a/e*.5:.5+(a-e)/(1-e)*.5))}}}if(!t.positional)return{beats:1,q:e=>e/t.perSecond,stepAt:e=>e*t.perSecond};let r=t.cell,i=Af(e,r,n(r)).flatMap(e=>e.atom.kind===`note`?[e.atom.value+e.atom.alter]:[]),a=Math.max(1,i.length),o=kf(e,r),s=a/t.perSecond,c=e=>i[Ma(e,a)]+o*Math.floor(e/a),l=e=>{let t=Math.floor(e),n=c(t);return(n+(e-t)*(c(t+1)-n))/o*s},u=l(0),d=e=>l(e)-u;return{beats:a,q:d,stepAt:e=>{let t=Math.floor(e/s)*a;for(;d(t+1)<=e;)t++;for(;t>0&&d(t)>e;)t--;let n=d(t),r=d(t+1);return t+(r>n?(e-n)/(r-n):0)}}}function op(e,t,n=null){let r=n?cp(e,t,n):null;if(r)return r;let{positions:i,lap:a}=e,o=Math.max(1,i.length);if(i.every((e,t)=>Math.abs(e-t*a/o)<1e-9))return{beats:o,q:e=>t.q(e*a/o),stepAt:e=>t.stepAt(e)*o/a,...t.speed?{speed:t.speed}:{}};let s=e=>e<o?i[e]:a,c=e=>{let t=Math.floor(e),n=Math.floor(t/o),r=t-n*o;return n*a+s(r)+(e-t)*(s(r+1)-s(r))};return{beats:o,q:e=>t.q(c(e)),stepAt:e=>{let n=t.stepAt(e),r=Math.floor(n/a),i=n-r*a,c=0;for(;c+1<o&&s(c+1)<=i;)c++;let l=s(c+1)-s(c);return r*o+c+(l>0?(i-s(c))/l:0)},...t.speed?{speed:t.speed}:{}}}function sp(e,t){let n=e.cells.get(t)?.meter,r=n?Bd(n):null;if(!n||!r)return null;let i=Ed(n),{written:a,swung:o}=r,s=n.pulses;return e=>{let t=e/i,n=Math.floor(t/s+1e-12),r=t-n*s,c=0;for(;c+2<a.length&&a[c+1]<=r+1e-12;)c++;let l=a[c+1]-a[c];return(n*s+o[c]+(l>0?(r-a[c])/l*(o[c+1]-o[c]):0))*i}}function cp(e,t,n){let{positions:r,lap:i}=e,a=e.written??r,o=Math.max(1,r.length);if(!r.every((e,t)=>Math.abs(n(a[t])-e)<1e-9))return null;let s=e=>e<o?a[e]:i,c=e=>e<o?r[e]:i,l=e=>{let t=Math.floor(e),r=Math.floor(t/o),a=t-r*o;return e===t?r*i+c(a):r*i+n(s(a)+(e-t)*(s(a+1)-s(a)))};return{beats:o,q:e=>t.q(l(e)),stepAt:e=>{let r=t.stepAt(e),a=Math.floor(r/i),l=r-a*i,u=0;for(;u+1<o&&c(u+1)<=l;)u++;let d=s(u),f=s(u+1);if(f<=d||l<=c(u))return a*o+u;let p=0,m=1;for(let e=0;e<52;e++){let e=(p+m)/2;n(d+e*(f-d))<=l?p=e:m=e}return a*o+u+p},...t.speed?{speed:t.speed}:{}}}function lp(e){let t=up.get(e);if(t)return t;up.set(e,t=/* @__PURE__ */ new Set);let n=r=>{if(t.has(r))return;t.add(r);let i=e.cells.get(r);for(let t of i?.children.keys()??[]){let r=i.units.flatMap(e=>e.atom.kind===`ref`&&e.atom.name===t?[e.atom]:[]);(!r.length||!r.every(n=>Uf(e,t,n.pick)))&&n(t)}};for(let t of e.outputs)for(let e of[...t.drone?[]:[t],...t.mods,...t.levels])n(e.cell);return t}let up=/* @__PURE__ */ new WeakMap,dp=/* @__PURE__ */ new WeakMap;function fp(e){let t=dp.get(e);if(t)return t;dp.set(e,t=/* @__PURE__ */ new Set);for(let n of e.cells.values()){n.root&&t.add(n.name),n.over&&t.add(n.over),n.root||t.add(n.context);for(let r of n.units)r.atom.kind===`ref`&&Hf(e,r.atom.name,r.atom.pick)&&t.add(r.atom.name)}return t}let pp=/* @__PURE__ */ new WeakMap,mp=/* @__PURE__ */ new WeakMap;Xf(e=>{pp.delete(e),mp.delete(e)});function hp(e,t){let n=e.cells.get(e.clocks.get(t)?.cell??``)?.params.varispeed;return typeof n==`number`?n:0}function Z(e,t,n=0){let r=mp.get(e);r||mp.set(e,r=/* @__PURE__ */ new WeakMap);let i=r.get(t)??/* @__PURE__ */ new Map;r.set(t,i);let a=t=>{let n=i.get(t);if(!n){let r=e.clocks.get(t);n=r.tap?op(r.tap,o(r.tap.meter),sp(e,r.tap.meter)):r.swung?ip(r.swung,o(t)):o(t),i.set(t,n)}return n},o=n=>{let r=i.get(`${n}\0plain`);if(!r){let o=e.clocks.get(n);if(o.belt){let i=rp(e,e.clocks.get(o.belt.driver),t),s=a(o.belt.driver),c=e.cells.get(o.cell),l=(e,t)=>typeof c.params[e]==`number`?c.params[e]:t,u=Math.max(.001,l(`belt`,200)),d=Math.max(.001,l(`mass`,1)),f=l(`damping`,.6*Math.sqrt(u*d)),p=pp.get(e);p||pp.set(e,p=/* @__PURE__ */ new Map);let m=p.get(n);m||p.set(n,m=tp(e,u,d,f,l(`slip`,1/0),e=>i.q(s.stepAt(e))));let h=m,g=o.belt.rate;r={beats:1,q:e=>h.real(i.q(e/g)),stepAt:e=>i.stepAt(h.nominal(e))*g,speed:e=>h.speed(e)}}else{let n=ap(e,o,t),i=$f(e,o.cell);r=i?{beats:n.beats,q:e=>i.real(n.q(e)),stepAt:e=>n.stepAt(i.nominal(e)),speed:e=>i.speed(e)}:n}i.set(`${n}\0plain`,r)}return r};return{map:a,written:t=>{let n=e.clocks.get(t)?.tap;if(!n?.written)return a(t);let r=i.get(`${t}\0written`);return r||i.set(`${t}\0written`,r=op({...n,positions:n.written},o(n.meter))),r},stepOf:e=>a(e).stepAt(Math.max(0,n))}}function gp(e,t,n){let r=Z(e,t,n),i=lp(e),a=fp(e),o=/* @__PURE__ */ new Map,s=n=>{let c=t(n),l=e.cells.get(n),u=l?.tonic?e.cells.get(l.tonic):void 0;if(l&&u?.step&&u.clock){let t=Af(e,u.name,s(u.name))[0]?.atom;return t?.kind===`note`?c-l.shift+Ma(t.value+t.alter,12):c}if(!l||!l.step||!l.clock||e.clocks.has(n)||xp(e,n)||l.loops||i.has(n)&&!a.has(n))return c;let d=o.get(l.clock);d===void 0&&o.set(l.clock,d=r.stepOf(l.clock));let f=Math.floor(l.rate*d+np),p=f*l.stride,m=bp(e,n);if(!m){let t=l.wrap??vp(e,n);return c+(t>0?Ma(p,t):p)}let h=p+Math.min(.999999999,Math.max(0,l.rate*d-f)),g=l.wrap??m.length,_=g>0?Ma(h,g):h,v=Math.floor(_/m.length);return c+v*m.entries+m.inForce(_-v*m.length,Math.floor(h/m.length))};return s}let _p=(e,t,n)=>r=>r===n?t(r):e(r),vp=(e,t)=>{let n=e.cells.get(t);return bp(e,t)?.length??(n.units.length||n.cycle)},yp=/* @__PURE__ */ new WeakMap;function bp(e,t){let n=yp.get(e);if(n||yp.set(e,n=/* @__PURE__ */ new Map),n.has(t))return n.get(t);let r=e.cells.get(t).units,i=null;if(r.some(e=>e.repeat!==1||e.elongate!==1||e.atom.kind===`seq`)){let n=[],a=0;for(let e of r)n.push(a),a+=e.atom.kind===`seq`?G(e.atom).length:1;let o=Ds(r,()=>1).filter(e=>!e.chosen||e.chosen.every(e=>e.is===0)).map(e=>{let t=r[e.top],i=n[e.top]+(t.atom.kind===`seq`?G(t.atom).indexOf(e.atom):0);return{at:e.at,index:i,...e.laps?{laps:e.laps}:{}}}).sort((e,t)=>e.at-t.at),s=r.reduce((e,t)=>e+Ts(t.atom,()=>1)*t.elongate*t.repeat,0),c=(e,t)=>!e.laps||Ma(t,e.laps.of)===e.laps.is,l=Nf(e,t).length;i={length:s,entries:l,inForce(e,t){let n;for(let r of o)r.at<=e+1e-9&&c(r,t)&&(!n||r.at>n.at+1e-9)&&(n=r);if(n)return n.index;for(let e of o)c(e,t-1)&&(!n||e.at>n.at+1e-9)&&(n=e);return n?n.index-l:0}}}return n.set(t,i),i}function xp(e,t){let n=e.cells.get(t)?.over??``,r=e.cells.get(n);return!!r&&r.units.length>0&&r.units.every(t=>t.atom.kind===`ref`&&e.sections?.get(t.atom.name)===n)}function Sp(e,t,n){let r=e.cells.get(n),i=r?.clock?e.clocks.get(r.clock):void 0,a=r?.clock&&i?t.map(r.clock):null,o=i?i.perSecond:1,s=e=>a?a.stepAt(Math.max(0,e))/o:e;return{pos:s,real:e=>e<=0?0:a?a.q(e*o):e,speed:e=>Math.max(.001,(s(e+.01)-s(Math.max(0,e-.01)))/(e+.01-Math.max(0,e-.01))),moving:a}}let Cp=10080,wp=60/84,Tp=[2,2,1,2,2,2,1],Ep=[0,4,1,5,2,6,2,5,1,4,0,3],Dp=(e,t)=>(e%t+t)%t;[5,3,1,6,4,2,0].map(e=>e/6);function Op(e){let t=[0];for(let n=0;n<6;n++)t.push(t[n]+Tp[(n+e)%7]);return t}function kp(e){let t=Dp(Math.floor(e),120960),n=Math.floor(t/Cp),r=Math.floor(t%Cp/840);return{block:n,key:r,bar:Math.floor(t%840/12),inBar:t%12,mode:Ep[n],tonic:Ap(n,r)}}function Ap(e,t){return Dp((e<6?7:5)*t,12)}function jp(e,t){let n=[0,4,1,5,2,6,3],r=Ep[e];return n.map((e,i)=>Dp(n[(i+t)%7]+r,7))}function Mp(e){return Op(e)}function Np(e,t,n){let r=Math.floor(n/7),i=n%7,a=e.map((t,n)=>e[(n+i)%7]),o=Mp(t);r===1&&(o=o.map((e,t)=>Dp(o[(t+i)%7]-o[i],12)).sort((e,t)=>e-t));let s=[];for(let e=0;e<7;e++){let t=a[e],n=a[(e+2)%7]+1,c=a[(e+4)%7],l=a[(e+6)%7];r===0&&(t=Dp(t+i+1,7)),r===2&&(n=8-n),r===3&&(c=a[(6-e+4)%7]),r===4&&(l=Dp(l*5,7));let u=o[e],d=e<6?o[e+1]:12;s.push({at:u,dur:d-u,degree:t,density:n,dynamic:c,space:l})}return s}function Pp(e,t,n){let r=jp(e,t),i=Ep[e];return n<35?Np(r,i,n):Np(r,i,69-n).map(e=>({...e,at:12-(e.at+e.dur),degree:Dp(-e.degree,7)})).sort((e,t)=>e.at-t.at)}function Fp(e,t){let n=[],r=Math.floor(e/12);for(let i=r;i*12<t;i++){let r=i*12,a=kp(r),o=Op(a.mode);for(let i of Pp(a.block,a.key,a.bar)){let s=r+i.at;if(!(s<e||s>=t))for(let e=0;e<i.density;e++){let t=i.degree+2*e;n.push({step:s,dur:i.dur,semis:a.tonic+o[Dp(t,7)]+12*Math.floor(t/7),level:.18+i.dynamic*.11,pan:i.space/3-1})}}}return n}function Ip(e,t,n,r,i,a=0){if(!r)return Af(e,t,n(t)+a,i);let o=Af(e,t,r.abs?0:n(t),i);return(bl(o.length,r)??[]).map(e=>o[e])}let Lp=(e,t,n)=>Sl(e.cells.get(t),n)??0,Rp=(e,t=0)=>e?Fs(e):`>${t}`;var zp=class extends Error{};function Bp(e,t,n,r=null,i=()=>!1,a=0,o=sl){let s=/* @__PURE__ */ new Map,c=(t,r,a,o,l)=>{let u=e.cells.get(t),d=u.root?t:u.over??o,f=u.root?0:u.over?u.overShift:l,p=`${t}|${Rp(r,a)}|${d}|${f}`,m=s.get(p);if(m)return m;let h=[];if(!i(t)){let i=Hf(e,t,r)?bl(e.cells.get(t).units.length,r):null,o=Ip(e,t,n,r,d,a),s=t=>t.kind===`ref`&&Lp(e,t.name,t.pick)||1,l=(e,t,n)=>{if(e.kind!==`ref`)return ys(e,t,n);let r=n/s(e);return c(e.name,e.pick,e.shift,d,f).map(n=>({atom:{kind:`spliced`,e:n,ref:e},at:t+n.step*r,dur:n.duration*r,of:n.laps?.of??1,is:n.laps?.is??0,chances:[],picks:(n.chosen??[]).map(e=>({...e,at:t+e.at*r}))}))};for(let{atom:n,at:r,dur:a,chances:c,top:p,level:m,laps:g,chosen:_}of Es(o,s,l,`${t}:`)){let o={step:r,duration:a,cell:t,table:d,tableShift:f,...i?{via:{cell:t,index:i[p],ctx:d,mul:1,add:0}}:{},...g?{laps:g}:{},..._?{chosen:_}:{}},s=c.map(e=>e===null?u.chance??.5:e),l={...s.length?{chance:s.length===1?s[0]:1-s.reduce((e,t)=>e*(1-t),1)}:{},...m===void 0?{}:{level:m}},v=t=>({...o,table:Wf(e,d),tableShift:0,value:Math.round(Bf(e,Wf(e,d),t)*1e6)/1e6,alter:0});if(n.kind===`note`)h.push(n.pitched?{...v(n.value),...l}:{...o,value:n.value,alter:n.alter,...l});else if(n.kind===`chord`)n.notes.forEach((e,t)=>{let r=n.levels?.[t],i=r===void 0?{}:{level:r*(m??1)};h.push(n.pitched?.[t]?{...v(e),...l,...i}:{...o,value:e,alter:n.alters[t],...l,...i})});else if(n.kind===`choice`)h.push({...o,value:n.values[0],alter:n.alters[0],...l,options:n.values.map((e,t)=>({value:e,alter:n.alters[t]}))});else if(n.kind===`spliced`){let{e,ref:t}=n,i=t.transpose??0,o=t.values,{laps:s,chosen:c,...l}=e;h.push({...l,...o?{value:o.mul*e.value+o.add,alter:o.mul*e.alter,...e.options?{options:e.options.map(e=>({value:o.mul*e.value+o.add,alter:o.mul*e.alter}))}:{},...e.via?{via:{...e.via,mul:o.mul*e.via.mul,add:o.mul*e.via.add+o.add}}:{}}:{},step:r,duration:a,...g?{laps:g}:{},..._?{chosen:_}:{},...i||e.transpose?{transpose:(e.transpose??0)+i}:{},...m===void 0?{}:{level:(e.level??1)*m}})}if(h.length>5e4)throw new zp(t)}}return s.set(p,h),h};return[...c(t,r,a,o,0)].sort((e,t)=>e.step-t.step||e.value-t.value)}function Vp(e,t,n){if(!t.via)return{value:t.value,alter:t.alter};let r=Af(e,t.via.cell,n(t.via.cell),t.via.ctx)[t.via.index];return r?.atom.kind===`note`?{value:t.via.mul*r.atom.value+t.via.add,alter:t.via.mul*r.atom.alter}:{value:t.value,alter:t.alter}}let Q=e=>`cell:${e}`;function Hp(e,t,n,r){let i=e.voiceParams.get(t);if(!i||Object.keys(i).length===0)return;let a={};for(let[t,o]of Object.entries(i)){let i=o.series.map(t=>Jp(e,t,n,n+r)),s=e=>i.reduce((t,n)=>t*Yp(n,e,e=>e.level),1),c=e=>o.range?o.range[0]+(o.range[1]-o.range[0])*e:e;if(o.env&&o.range)a[t]={kind:`env`,from:o.range[0],peak:c(s(n)),...o.env};else{let e=[...new Set(i.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t);a[t]={kind:`points`,points:(e.length?e:[n]).map(e=>({at:e,value:c(s(e)),...i.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9))?{ramp:!0}:{}}))}}}return a}function Up(e,t,n){let r=gp(e.result,e.statics,n+np),i=e.played.has(t.cell)?_p(r,e.statics,t.cell):r,a=Vp(e.result,t,i),o=Rf(e.result,t.table,t.tableShift,a.value,a.alter,i),s=t.transpose?{...o,position:o.position+t.transpose}:o;return zf(e.result,s.root,s.position)}function Wp(e,t,n,r){if(t.events.length===0)return[{at:n,semis:0}];if(!t.clock)return[{at:n,semis:t.sign*Up(e,t.events[0],n)}];if(t.lin)return qp(e,t,n,r,(n,r)=>t.sign*Up(e,n,r)).map(e=>({at:e.at,semis:e.v,ramp:e.ramp}));let i=Z(e.result,e.statics).map(t.clock),a=i.stepAt(Math.max(0,n))*t.rate,o=i.stepAt(Math.max(0,r))*t.rate;Number.isFinite(a)||(a=0),Number.isFinite(o)||(o=a);let s=[],c=Math.floor(a/t.period),l=Gp(t,a);s.push({at:n,semis:l?t.sign*Up(e,l,n):0});for(let n=c;n*t.period<o;n++)for(let r of t.events){let c=n*t.period+r.step;if(c<=a+1e-9||c>=o-1e-9)continue;let l=i.q(c/t.rate);s.push({at:l,semis:t.sign*Up(e,r,l)})}return s}function Gp(e,t){let n=Math.floor(t/e.period),r=null;for(let i of[n,n-1]){for(let n of e.events)i*e.period+n.step<=t+1e-9&&(r=n);if(r)break}return r}function Kp(e,t,n){if(t.events.length===0)return null;if(!t.clock)return t.events[0];let r=Z(e.result,e.statics).map(t.clock).stepAt(Math.max(0,n))*t.rate;return Gp(t,Number.isFinite(r)?r:0)}function qp(e,t,n,r,i){let a=Z(e.result,e.statics).map(t.clock),o=[...new Map(t.events.map(e=>[e.step,e])).values()].sort((e,t)=>e.step-t.step),s=e=>a.q(e/t.rate),c=e=>{let n=Math.floor(e/t.period),r=e-n*t.period,a=o.length-1;for(let e=0;e<o.length;e++)o[e].step<=r+1e-9&&(a=e);let c=o[a],l=c.step>r+1e-9?c.step-t.period:c.step,u=i(c,s(n*t.period+l));if(a===o.length-1||l<0)return u;let d=o[a+1];return u+(i(d,s(n*t.period+d.step))-u)*(r-l)/Math.max(np,d.step-l)},l=a.stepAt(Math.max(0,n))*t.rate,u=a.stepAt(Math.max(0,r))*t.rate;Number.isFinite(l)||(l=0),Number.isFinite(u)||(u=l);let d=[{at:n,v:c(l),ramp:!1}];for(let e=Math.floor(l/t.period);e*t.period<u;e++)for(let n of o){let r=e*t.period+n.step;r>l+1e-9&&r<u-1e-9&&d.push({at:s(r),v:i(n,s(r)),ramp:n!==o[0]})}return d.push({at:r,v:c(u-1e-6),ramp:!0}),d}function Jp(e,t,n,r,i){let a=e=>t.db?10**((e.value+e.alter)/20):Math.max(0,e.value+e.alter);if(t.events.length===0)return[{at:n,level:0}];if(!t.clock)return[{at:n,level:a(t.events[0])}];if(t.lin)return qp(e,t,n,r,e=>a(e)).map(e=>({at:e.at,level:Math.max(0,e.v),ramp:e.ramp}));let o=Z(e.result,e.statics).map(t.clock),s=o.stepAt(Math.max(0,n))*t.rate,c=o.stepAt(Math.max(0,r))*t.rate;Number.isFinite(s)||(s=0),Number.isFinite(c)||(c=s);let l=e=>{let n=e-Math.floor(e/t.period)*t.period,r=-1;for(let e of t.events)n>=e.step-1e-9&&n<e.step+e.duration-1e-9&&(r=Math.max(r,a(e)));return r<0?0:r},u=i===void 0?NaN:Z(e.result,e.statics).written(t.clock).stepAt(Math.max(0,i))*t.rate,d=[{at:n,level:l(Number.isFinite(u)?u:s)}],f=/* @__PURE__ */ new Set;for(let e=Math.floor(s/t.period);e*t.period<c;e++)for(let n of t.events)for(let r of[e*t.period+n.step,e*t.period+n.step+n.duration])r>s+1e-9&&r<c-1e-9&&f.add(r);for(let e of[...f].sort((e,t)=>e-t)){let n=l(e+np*10);n!==d[d.length-1].level&&d.push({at:o.q(e/t.rate),level:n})}return d}function Yp(e,t,n){let r=0;for(let n=0;n<e.length;n++)e[n].at<=t+1e-9&&(r=n);let i=e[r+1];return!i?.ramp||Math.abs(e[r].at-t)<1e-9?n(e[r]):n(e[r])+(n(i)-n(e[r]))*(t-e[r].at)/Math.max(np,i.at-e[r].at)}function Xp(e,t,n){let r=Z(e,t),i=/* @__PURE__ */ new Set,a=[],o=t=>{for(let n=0;t&&!i.has(t)&&n<32;n++){i.add(t);let n=e.cells.get(t);if(!n)return;n.laps&&n.clock&&a.push(r.map(n.clock).q(n.laps*Math.max(1,Lp(e,t,null))/n.rate)),n.clock&&n.clock!==t&&o(n.clock),t=n.step?.driver}};o(n.cell);for(let e of n.select)o(e.cell);return a.length?Math.min(...a):1/0}function Zp(e){let t=3735928559,n=1103547991;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,2654435761),n=Math.imul(n^i,1597334677)}return t=Math.imul(t^t>>>16,2246822507)^Math.imul(n^n>>>13,3266489909),n=Math.imul(n^n>>>16,2246822507)^Math.imul(t^t>>>13,3266489909),((n>>>0)*2**21+(t>>>11))/2**53}function Qp(e,t,n,r){if(n.laps&&Ma(r,n.laps.of)!==n.laps.is)return null;if(n.chance===void 0&&!n.options&&!n.chosen)return n;let i=`${e.cells.get(t.output.cell)?.seed??0}|${t.output.cell}`;for(let e of n.chosen??[])if(Math.floor(Zp(`${i}|${r+e.lap}|${e.at.toFixed(6)}|${e.id}|picks`)*e.of)!==e.is)return null;if(n.chance===void 0&&!n.options)return n;let a=`${i}|${r}|${n.step.toFixed(6)}`;if(n.chance!==void 0&&Zp(`${a}|sounds`)>=1-n.chance)return null;if(!n.options)return n;let o=n.options[Math.floor(Zp(`${a}|picks`)*n.options.length)];return{...n,value:o.value,alter:o.alter}}function $p(e,t){let n=!1;for(let r of t){let t=e.cells.get(r.part)?.params.restart??e.cells.get(r.cell)?.params.restart;if(t===`resume`||t===`free`)return t;(t===`restart`||!r.performer)&&(n=!0)}return n?`restart`:`free`}function em(e,t,n,r){let i=t.series;if(!i.clock||i.events.length===0)return[];let a=Z(e.result,e.statics).map(i.clock),o=a.stepAt(Math.max(0,n))*i.rate,s=a.stepAt(Math.max(0,r))*i.rate;Number.isFinite(o)||(o=0),Number.isFinite(s)||(s=o);let c=[];for(let e=Math.floor(o/i.period)-1;e*i.period<s;e++)for(let n of i.events){if(Ma(Math.round(n.value+n.alter),t.entries)!==t.entry)continue;let r=e*i.period+n.step,l=r+n.duration;l<=o+1e-9||r>=s-1e-9||c.push({a:a.q(r/i.rate),b:a.q(l/i.rate)})}return c.sort((e,t)=>e.a-t.a)}let tm=(e,t,n)=>Vf(e,t).some(e=>n.has(Q(e))),nm=(e,t,n)=>{let r=e.cells.get(t);for(let t=0;r?.step&&t<32;t++){if(n.has(Q(r.step.driver)))return!0;r=e.cells.get(r.step.driver)}return!1};function rm(e,t){let n=e.cells.get(t),r=n?.voice?n.params.gain:void 0;return typeof r==`number`&&Number.isFinite(r)?r:1}function im(e,t){return e.silent?e.via.some(n=>t.has(Q(n))&&!e.midi?.some(e=>e.card===n))?[0,0]:[e.gains[0],e.gains[1]]:om(e.parts,t)}function am(e,t){let n=im(e,t);if(e.silent||sm(n))return n;let r=lm(e,t).reduce((e,t)=>Math.abs(t.gain)>Math.abs(e)?t.gain:e,0);return[r,r]}function om(e,t){let n=[0,0];for(let r of e)!t.has(Q(r.mix))&&!t.has(Q(r.sink))&&(n[0]+=r.gains[0],n[1]+=r.gains[1]);return n}let sm=e=>e[0]!==0||e[1]!==0;function cm(e,t,n){if(!dm(e,t,n))return!1;let r=im(t,n);return sm(r)||um(t,n)}function lm(e,t){return(e.midi??[]).filter(e=>!t.has(Q(e.card))&&!(e.mix&&t.has(Q(e.mix))))}let um=(e,t)=>lm(e,t).length>0;function dm(e,t,n){if(n.has(Q(t.voice))||n.has(Q(t.cell)))return!1;if(t.drone)return!t.through.some(e=>n.has(Q(e)))&&!(t.envelopeCell&&n.has(Q(t.envelopeCell)));let r=e.cells.get(t.cell);return!(!r?.clock||tm(e,r.clock,n)||nm(e,t.cell,n)||t.through.some(e=>n.has(Q(e)))||t.envelopeCell&&n.has(Q(t.envelopeCell))||t.select.some(t=>n.has(Q(t.cell))||n.has(Q(t.part))||n.has(Q(e.cells.get(t.cell).over)))||t.select.some(t=>[...e.cells.get(t.cell).children.keys()].some(e=>n.has(Q(e)))))}function fm(e,t,n=/* @__PURE__ */ new Set){if(!e.ok)return{result:e,statics:t,muted:n,tracks:[],drones:[],played:/* @__PURE__ */ new Set,voiceParams:/* @__PURE__ */ new Map,end:1/0};let r=[],i=[],a=/* @__PURE__ */ new Map;for(let o of e.outputs){if(!cm(e,o,n))continue;let s=e.cells.get(o.cell),c=(r,i,a,o)=>{let s=e.cells.get(r),c=n.has(Q(r))?[]:Bp(e,r,t,i,e=>n.has(Q(e)),a).filter(t=>!tm(e,t.table,n));return{sign:o,lin:s.map?.kind===`lin`,db:s.map?.kind===`db`,clock:s.clock,rate:s.rate,period:Math.max(1,Lp(e,r,i)),events:c}};try{for(let t of o.kit?uf(e.cells.get(o.voice)):[o.voice]){if(a.has(t))continue;let n=e.cells.get(t),r={};for(let[t,i]of Object.entries(n?.paramCells??{})){let n=i.factors.find(t=>e.cells.get(t)?.map?.kind===`adsr`);r[t]={range:i.range,series:i.factors.filter(e=>e!==n).map(e=>c(e,null,0,1)),env:n?wl(e.cells.get(n)):null}}a.set(t,r)}if(o.drone){i.push({output:o,mods:o.mods.map(e=>c(e.cell,e.pick,e.shift,e.sign)).filter(e=>e.events.length>0),levels:o.levels.map(e=>c(e.cell,e.pick,e.shift,e.sign))});continue}let n=c(o.cell,o.pick,o.shift,o.sign),l=o.mods.filter(e=>!e.picks).map(e=>c(e.cell,e.pick,e.shift,e.sign)).filter(e=>e.events.length>0),u=o.mods.find(e=>e.picks),d=u?c(u.cell,u.pick,u.shift,1):void 0,f=o.levels.map(e=>c(e.cell,e.pick,e.shift,e.sign)),p=o.select.map(t=>({series:c(t.cell,null,0,1),entry:t.entry,entries:e.cells.get(e.cells.get(t.cell).over).units.length})),m=s.paramCells.legato,h=s.step?.tap?e.cells.get(s.step.driver)?.meter:null,g=s.step?.chain.reduce((e,t)=>t.op===`×`?e*t.n:e/t.n,1)??1,_=m?{range:m.range,series:m.factors.map(e=>c(e,null,0,1))}:typeof s.params.legato==`number`?s.params.legato:h?Kd(h,s.step.tap,g):1;n.events.length&&r.push({...n,output:o,clock:s.clock,mods:l,...d?{picker:d}:{},levels:f,selects:p,end:Xp(e,t,o),share:_})}catch(e){if(!(e instanceof zp))throw e}}let o=r.map(e=>e.end),s=-1/0;for(let t of e.clocks.values()){let n=$f(e,t.cell)?.stopsAt();n!=null&&(s=Math.max(s,n))}let c=o.length?Math.max(...o):1/0;return{result:e,statics:t,muted:n,tracks:r,drones:i,played:lp(e),voiceParams:a,end:Math.min(c,s>-1/0?s:1/0)}}function pm(e,t){let n=e.cells.get(t)?.env,r=n?e.cells.get(n):void 0;return r?.map?.kind===`adsr`?wl(r):null}function mm(e,t,n){if(!t.kit)return{voice:t.voice,freq:e.cells.get(t.voice).freq};let r=e.cells.get(t.voice),i=r.units[Ma(Math.round(n),r.units.length)];return i?.atom.kind===`ref`?{voice:i.atom.name,freq:e.cells.get(i.atom.name).freq}:null}function hm(e,t){let n=e.cells.get(e.cells.get(t)?.over??``)?.params.anchor;return typeof n==`number`?Math.round((((e=>Math.floor(e)*3600+Math.round(e%1*100)*60)(n)-42900)%86400+86400)%86400/wp):0}function gm(e,t,n,r=!1,i={}){let a=t=>e.result.cells.get(t.output.cell)?.params.law!==void 0,o=e.tracks.filter(e=>!e.output.tape&&!a(e)),s=e.tracks.filter(e=>e.output.tape),c=_m({...e,tracks:o},t,n,r);e.drones.length&&(c.push(...ym(e,t,n,r,i)),c.sort((e,t)=>e.at-t.at));for(let i of e.result.outputs){if(e.result.cells.get(i.cell)?.params.law!==`fiveto12`)continue;let a=am(i,e.muted),o=i.midi?lm(i,e.muted):[],s=sm(a);if(!s&&!o.length)continue;let l=e.result.cells.get(i.voice)?.freq||261.63,u=hm(e.result,i.cell);for(let d of Fp(Math.ceil(t/wp-1e-9)+u,Math.ceil(n/wp-1e-9)+u)){let t=(d.step-u)*wp;c.push({at:t,dur:d.dur*wp,voice:i.voice,freq:l*2**(d.semis/12),bends:[],gains:[a[0]*Math.min(1,1-d.pan)*rm(e.result,i.voice),a[1]*Math.min(1,1+d.pan)*rm(e.result,i.voice)],levels:[{at:t,level:d.level}],...s?{}:{unheard:!0},...o.length?{midi:o}:{},...r?{output:i.id}:{}})}}if(!s.length)return c;let l=Z(e.result,e.statics);for(let i of s){let a=i.output.tape,o=e.result.cells.get(a.tape),{pos:s,real:u,speed:d,moving:f}=Sp(e.result,l,a.tape),p=typeof o?.params.varispeed==`number`?o.params.varispeed:0,m=1-a.erase,h=a.length>0?Math.min(40,m>0?Math.ceil(Math.log(.02)/Math.log(m)):1):1,g={...i,output:{...i.output,tape:void 0}};for(let i=0;i<h;i++){let o=a.at+i*a.length,l=m**+i,h=u(s(t)-o),_=u(s(n)-o);if(!(_>0)||!Number.isFinite(_))continue;let v=e=>u(s(e)+o);for(let i of _m({...e,tracks:[g]},Math.max(0,h),_,r)){let e=v(i.at);if(!(e>=t&&e<n)||!Number.isFinite(e))continue;let r=v(i.at+i.dur);if(f&&d(i.at)<.05)continue;let a=p?Math.min(4,Math.max(.25,(d(e)/d(i.at))**+p)):1;c.push({...i,at:e,dur:Math.max(.01,(Number.isFinite(r)?r:e+i.dur)-e),freq:i.freq*a,bends:i.bends.map(e=>({...e,at:v(e.at)})),levels:i.levels.map(e=>({...e,at:v(e.at)})),gains:[i.gains[0]*l,i.gains[1]*l],...i.params?{params:Object.fromEntries(Object.entries(i.params).map(([e,t])=>[e,t.kind===`points`?{...t,points:t.points.map(e=>({...e,at:v(e.at)}))}:t]))}:{}})}}}return c.sort((e,t)=>e.at-t.at)}function _m(e,t,n,r){let i=[],{result:a,statics:o}=e,s=Z(a,o);for(let o of e.tracks){let c=s.map(o.clock),l=Math.min(n,o.end);if(l<=t)continue;let u=c.stepAt(Math.max(0,t))*o.rate,d=c.stepAt(Math.max(0,l))*o.rate;if(!Number.isFinite(u)||!Number.isFinite(d)||d<=u)continue;let f=t=>{let n=o.share;if(typeof n==`number`)return n;let r=c.q(t/o.rate),i=n.series.reduce((t,n)=>{let i=Kp(e,n,r);return t*(i?i.value+i.alter:1)},1);return n.range?n.range[0]+(n.range[1]-n.range[0])*i:i},p=(t,n,i,l=1/0)=>{let u=c.q(t/o.rate);if(!Number.isFinite(u)||u>=o.end-1e-9)return null;let d=f(t),p=Math.min(c.q((d===1?i:t+d*(i-t))/o.rate),l<1/0?c.q(l/o.rate):1/0,o.end),m=o.picker?Kp(e,o.picker,u):n,h=m&&mm(a,o.output,m.value);if(!h||e.muted.has(Q(h.voice)))return null;let g=a.cells.get(h.voice)?.oneshot?o.output.envelope??pm(a,h.voice):null,_=g?g.attack+g.decay:Number.isFinite(p)?p-u:8,v=o.output.kit&&!o.picker||o.output.gate?o.output.offset:o.sign*Up(e,n,u)+o.output.offset,y=[];if(o.mods.length){let t=o.mods.map(t=>Wp(e,t,u,u+_)),n=t.reduce((e,t)=>e+t[0].semis,0);v+=n;let r=[...new Set(t.flatMap(e=>e.slice(1).map(e=>e.at)))].sort((e,t)=>e-t);for(let e of r){let r=t.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9)),i=t.reduce((t,n)=>t+Yp(n,e,e=>e.semis),0);y.push({at:e,cents:100*(i-n),...r?{ramp:r}:{}})}}let b=hp(a,o.clock);if(b&&c.speed&&!o.output.gate){let e=e=>Math.max(.001,c.speed(e)),t=e(u);if(t<.05)return null;if(v+=12*b*Math.log2(t),!y.length)for(let n=u+.04,r=0;n<u+_&&r<400;n+=.04,r++){let r=1200*b*Math.log2(e(n)/t);Math.abs(r)>1&&y.push({at:n,cents:r,ramp:!0})}}let x=o.db?10**((n.value+n.alter)/20):Math.max(0,n.value+n.alter),S=[{at:u,level:(o.output.gate?x:1)*(n.level??1)}];if(o.levels.length){let n=s.written(o.clock).q(t/o.rate),r=o.levels.map(t=>Jp(e,t,u,u+_,n)),i=[...new Set(r.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t),a=S[0].level;S.length=0;for(let e of i)S.push({at:e,level:a*r.reduce((t,n)=>t*Yp(n,e,e=>e.level),1),...r.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9))?{ramp:!0}:{}})}let C=h.freq*2**(v/12),w=Hp(e,h.voice,u,_),T=o.output.envelope??(o.output.kit?pm(a,h.voice):null),E=(e=>{let t=rm(a,h.voice);if(!o.output.kit)return[e[0]*t,e[1]*t];let[n,r]=ml(a.cells.get(h.voice)?.params.pan);return[e[0]*n*t,e[1]*r*t]})(am(o.output,e.muted)),D=o.output.midi?lm(o.output,e.muted):[];return C>0&&C<2e4&&S.some(e=>e.level>0)?{at:u,dur:_,voice:h.voice,freq:C,bends:y,value:n.value+n.alter,gains:E,levels:S,...!o.output.silent&&!sm(E)?{unheard:!0}:{},...D.length?{midi:D}:{},...T?{env:T}:{},...o.output.through.length?{instrument:o.output.through[0]}:{},...w?{params:w}:{},...r?{output:o.output.id}:{}}:null},m=o.output.kit||o.output.gate?0:a.cells.get(o.output.voice)?.glide??0,h=m>0,g=o.events.length,_=e=>(e===0||o.events[e-1].step!==o.events[e].step)&&(e===g-1||o.events[e+1].step!==o.events[e].step),v=(e,t)=>e>0?[e-1,t]:[g-1,t-1],y=(e,t,n,r,i)=>{if(!h||!_(e)||Ma(t*g+e,256)===0)return!1;let[s,c]=v(e,t),l=c*o.period+o.events[s].step+o.events[s].duration,u=t*o.period+o.events[e].step;return _(s)&&c>=n&&r+c*o.period+o.events[s].step>=i-1e-9&&Math.abs(l-u)<1e-9&&f(r+c*o.period+o.events[s].step)>=1-1e-9&&!!Qp(a,o,o.events[s],c)},b=(e,t,n,r=-1,s=0,c=0,l=0,u=1/0,d=-1/0)=>{if(r>=0&&y(r,s,l,c,d))return;let f=p(e,t,n,u);if(!f)return;if(r<0||!h||!_(r))return void i.push(f);let v=f,b=[{at:f.at,dur:f.dur,freq:f.freq,bends:f.bends}],[x,S]=[r,s];for(let e=0;e<256;e++){[x,S]=x<g-1?[x+1,S]:[0,S+1];let e=c+S*o.period+o.events[x].step;if(e>=u-1e-9||!y(x,S,l,c,d))break;let t=Qp(a,o,o.events[x],S),n=t&&p(e,t,e+o.events[x].duration,u);if(!n)break;let r=1200*Math.log2(n.freq/v.freq),i=v.bends.length?v.bends[v.bends.length-1].cents:0,s=Math.min(m,n.dur);v={...v,dur:n.at+n.dur-v.at,bends:[...v.bends,{at:n.at,cents:i},{at:n.at+s,cents:r,ramp:!0},...n.bends.map(e=>({...e,at:Math.max(e.at,n.at+s),cents:e.cents+r}))],levels:[...v.levels,...n.levels.filter(e=>e.at>=n.at)]},b.push({at:n.at,dur:n.dur,freq:n.freq,bends:n.bends})}i.push(b.length>1?{...v,legato:{glide:m,notes:b}}:v)};if(o.selects.length===0){for(let e=Math.floor(u/o.period)-1;e*o.period<d;e++)for(let[t,n]of o.events.entries()){let r=e*o.period+n.step;if(r<u-1e-9||r>=d-1e-9)continue;let i=Qp(a,o,n,e);i&&b(r,i,r+n.duration,t,e)}continue}let x=$p(a,o.output.select),S=e=>e.reduce((e,t)=>{let n=e[e.length-1];return n&&Math.abs(t.a-n.b)<1e-9?e[e.length-1]={a:n.a,b:t.b}:e.push(t),e},[]),C=(t,n)=>{let r=o.output.select[t],i=em(e,o.selects[t],n,l),s=a.cells.get(r.part)?.params.restart??a.cells.get(r.cell)?.params.restart;return r.performer&&s!==`restart`?S(i):i},w=(e=>{let t=C(0,e);for(let n of o.selects.keys()){if(n===0)continue;let r=C(n,e);t=t.flatMap(e=>r.flatMap(t=>Math.max(e.a,t.a)<Math.min(e.b,t.b)?[{a:Math.max(e.a,t.a),b:Math.min(e.b,t.b)}]:[]))}return x===`restart`?t:S(t)})(x===`resume`?0:t),T=0;for(let e of w){let t=c.stepAt(e.a)*o.rate,n=c.stepAt(e.b)*o.rate,r=x===`free`?0:x===`resume`?t-T:t;T+=n-t;let i=Math.max(u,t),s=Math.min(d,n);if(!(s<=i))for(let e=Math.floor((i-r)/o.period)-1;r+e*o.period<s;e++)for(let[c,l]of o.events.entries()){let u=r+e*o.period+l.step;if(e<0||u<i-1e-9||u>=s-1e-9)continue;let d=Qp(a,o,l,e);d&&b(u,d,u+l.duration,c,e,r,0,n,t)}}}return i.sort((e,t)=>e.at-t.at)}function vm(e,t,n,r){let i=[...new Set(e.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t),a=e.map(()=>0),o=[];for(let s of i){let i=r,c=!1;e.forEach((e,r)=>{let o=a[r];for(;o+1<e.length&&e[o+1].at<=s+1e-9;)o++;a[r]=o;let l=e[o],u=e[o+1],d=!u?.ramp||Math.abs(l.at-s)<1e-9?t(l):t(l)+(t(u)-t(l))*(s-l.at)/Math.max(np,u.at-l.at);i=n(i,d),l.ramp&&Math.abs(l.at-s)<1e-9&&(c=!0)}),o.push({at:s,value:i,...c?{ramp:c}:{}})}return o}function ym(e,t,n,r,i){let a=Math.max(0,i.begins??0),o=Math.min(e.end,i.until??1/0),s=[];for(let i=Math.max(0,Math.floor((t-a)/600));a+i*600<Math.min(n,o);i++){let n=a+i*600;if(n<t-1e-9)continue;let c=Math.min(600,o-n);if(c>0)for(let t of e.drones){let i=t.output,a=e.result.cells.get(i.voice);if(!a)continue;let o=vm(t.mods.map(t=>Wp(e,t,n,n+c)),e=>e.semis,(e,t)=>e+t,0),l=o[0]?.value??0,u=o.slice(1).map(e=>({at:e.at,cents:100*(e.value-l),...e.ramp?{ramp:!0}:{}})),d=t.levels.length?vm(t.levels.map(t=>Jp(e,t,n,n+c)),e=>e.level,(e,t)=>e*t,1).map(e=>({at:e.at,level:e.value,...e.ramp?{ramp:!0}:{}})):[{at:n,level:1}],f=a.freq*2**((i.offset+l)/12);if(!(f>0&&f<2e4)||!d.some(e=>e.level>0))continue;let p=am(i,e.muted),m=i.midi?lm(i,e.muted):[],h=Hp(e,i.voice,n,c);s.push({at:n,dur:c,voice:i.voice,freq:f,bends:u,gains:p,levels:d,held:!0,...!i.silent&&!sm(p)?{unheard:!0}:{},...m.length?{midi:m}:{},...i.envelope?{env:i.envelope}:{},...i.through.length?{instrument:i.through[0]}:{},...h?{params:h}:{},...r?{output:i.id}:{}})}}return s}function bm(e){return e.ends===null?e.cycle!==null&&Number.isFinite(e.cycle)&&e.cycle<=1800?e.cycle:e.longest:e.ends}function xm(e){let[t,n,r,i]=[0n,1n,1n,0n],a=e;for(let o=0;o<32;o++){let o=BigInt(Math.floor(a));if([t,n]=[n,o*n+t],[r,i]=[i,o*i+r],i>10000n)return[t,r];let s=a-Math.floor(a);if(s<1e-9||Math.abs(Number(n)/Number(i)-e)<1e-9*Math.max(1,e))break;a=1/s}return[n,i]}let Sm=(e,t)=>t===0n?e:Sm(t,e%t);function Cm(e,t){if([...e.cells.values()].some(e=>e.params.law===`fiveto12`))return{ends:86400,cycle:86400,chance:!1,longest:86400};let n=gl(e),r=fm(e,n),i=Z(e,n),a=(e,t)=>{if(!e)return null;let n=i.map(e),r=n.q(t)-n.q(0);return Number.isFinite(r)&&r>1e-6?r:null},o=[],s=!1,c=t=>{let n=e.clocks.get(t),r=n?.tap?.meter??n?.belt?.driver;return r&&r!==t?c(r):t},l=new Set(r.tracks.map(e=>c(e.clock))),u=e=>l.has(c(e));for(let e of r.tracks){let t=a(e.clock,e.period/e.rate),n=e.events.reduce((e,t)=>t.laps?Number(BigInt(e)*BigInt(t.laps.of)/Sm(BigInt(e),BigInt(t.laps.of))):e,1);t&&o.push(t*n),e.events.some(e=>e.chance!==void 0||e.options||e.chosen)&&(s=!0);for(let t of[...e.mods.filter(e=>e.clock&&u(e.clock)),...e.levels,...e.selects.map(e=>e.series)]){let e=t.clock?a(t.clock,t.period/t.rate):null;e&&o.push(e)}}for(let e of r.voiceParams.values())for(let t of Object.values(e))for(let e of t.series){let t=e.clock&&u(e.clock)?a(e.clock,e.period/e.rate):null;t&&o.push(t)}let d=new Set([...e.cells.values()].flatMap(e=>e.over?[e.over]:[]));for(let t of e.cells.values()){if(!d.has(t.name)||!t.step||!t.clock||t.loops||e.clocks.has(t.name)||!t.cycle)continue;let n=a(t.clock,1/t.rate);if(!n)continue;let r=Math.max(1,Math.abs(Math.round(t.stride||1))),i=Math.max(1,Math.round(t.wrap??vp(e,t.name))),s=i/Number(Sm(BigInt(i),BigInt(r)));o.push(n*s)}t?.push(...o);let f=Number.isFinite(r.end)?r.end:null,p=o.length?Math.max(...o):null;if(o.length===0)return{ends:f,cycle:null,chance:s,longest:p};let m=1n,h=0n;for(let e of o){let[t,n]=xm(e);t!==0n&&(m=m/Sm(m,t)*t,h=h===0n?n:Sm(h,n))}return{ends:f,cycle:h===0n?null:m/h>10n**18n?1/0:Number(m)/Number(h),chance:s,longest:p}}let wm=e=>{if(!e||e.braid.kind!==`list`)return null;let t=e.braid.tokens.map(e=>e.atom.kind===`note`&&e.repeat===1&&e.elongate===1&&e.subdivide===1?e.atom.value:NaN);return t.some(e=>Number.isNaN(e))?null:t};function Tm(e,t,n,r,i){let a=e.braid.kind===`list`?{...e.braid,tokens:e.braid.tokens.map(e=>e.atom.kind===`note`?{...e,atom:{...e.atom,value:t+(n-t)*e.atom.value}}:e)}:e.braid;return{...e,name:r,span:i,braid:a,label:null,about:void 0,...e.style?{style:void 0}:{}}}let Em=e=>String(Math.round(e*1e9)/1e9);function Dm(e,t){let n=new Map(e.cells.map(e=>[e.name,e])),r=[],i=(e,t)=>r.push({severity:`error`,message:e,span:t}),a=e=>{let t=n.get(e.name);if(!t)return null;let r=wm(t);return t.map?.kind!==`style`||!r||r.length!==xn.length?(i(`style=&${e.name}: a style is a map=style cell (&${e.name} map=style .3 .45 .55 .55), or a mix of them by weight`,e.span),null):r},o=e=>{if(e.kind===`cell`)return a(e.ref);let t=e.terms.map(e=>({v:a(e.ref),w:e.weight}));return t.some(e=>!e.v)?null:xn.map((e,n)=>t.reduce((e,t)=>e+t.w*t.v[n],0))},s=/* @__PURE__ */ new Map;for(let t of e.cells){if(!t.style)continue;let e=o(t.style.from),r=t.style.to?o(t.style.to):null;if(!e||t.style.to&&!r)continue;let a=[e,...r?[r]:[]].flatMap(e=>xn.filter((t,n)=>!(e[n]>=t.range[0]-1e-9&&e[n]<=t.range[1]+1e-9)));if(a.length){i(`&${t.name} style=: its style lies outside the axes on ${[...new Set(a.map(e=>e.name))].join(`, `)} (each ${xn[0].range[0]} to ${xn[0].range[1]}); a mix's weights sum its styles' points`,t.style.span);continue}let c=t.style.curve??null;if(c&&!n.has(c.name))continue;let l=c?n.get(c.name).braid:null;if(c&&!(l?.kind===`list`&&l.tokens.every(e=>e.atom.kind===`note`))){i(`style=a..b * &${c.name}: a curve is a line of numbers from 0 to 1 (&${c.name} map=lin step=1m 0 .5 1)`,c.span);continue}s.set(t.name,{from:e,to:r,curve:c})}let c=/* @__PURE__ */ new Map,l=!1,u=e=>{if(!e.pick||e.pick.kind!==`at`||!e.pick.abs)return null;let r=e.pick.i,i=n.get(e.name),a=s.get(e.name),o=null;if(a){let i=a.from[r],s=a.to?a.to[r]:i;a.to&&!a.curve&&(l=!0);let u=a.curve?n.get(a.curve.name):void 0;if(u&&i!==s){let t=`λ${e.name}_${r}`;return c.has(t)||c.set(t,Tm(u,i,s,t,e.span)),t}if(i===s||!t)o=Em(i);else if(`bars`in t){let e=t.bars*16;o=`map=lin step=1m*16 ${Array.from({length:e},(t,n)=>Em(i+(s-i)*n/e)).join(` `)}`}else o=`map=lin step=${Em(1/t.seconds)}hz ${Em(i)} ${Em(s)}`}else if(i&&(i.map?.kind===`style`||i.map?.kind===`adsr`)){let e=wm(i)?.[r];e!==void 0&&(o=Em(e))}if(o===null)return null;let u=`λ${e.name}_${r}`;if(!c.has(u)){let t=Eu(`&styleRead lpf=0..1 * &(${o})`).cells.find(e=>e.name!==`styleRead`);t&&c.set(u,{...t,name:u,span:e.span})}return c.has(u)?u:null},d=!1,f=e.cells.map(e=>{if(!e.paramCells)return e;let t=null;for(let[n,r]of Object.entries(e.paramCells)){let i=r.factors.map(e=>{let t=u(e);return t?{name:t,pick:null,shift:0,span:e.span}:e});i.some((e,t)=>e!==r.factors[t])&&((t??={...e.paramCells})[n]={...r,factors:i})}return t?(d=!0,{...e,paramCells:t}):e});return!d&&!r.length?{parsed:e,glides:l}:{parsed:{...e,cells:[...f,...c.values()],diagnostics:[...e.diagnostics,...r]},glides:l}}let Om=/^&([A-Za-z_][A-Za-z0-9_]*)(?=\s|$)/,km=/&([A-Za-z_][A-Za-z0-9_]*)/g,Am=/[+*,[]\s*$/;function jm(e){let t=[],n=null;return e.split(`
`).forEach((e,r)=>{let i=yc(e)[0];if(n??={written:[],code:[],line:r+1},n.written.push(e),n.code.push(i),Am.test(i))return;let a=n.code.join(` `).trim().split(/\s+/).join(` `);a&&t.push(Mm(a,n.written.join(`
`),n.line)),n=null}),t}function Mm(e,t=e,n=0){let r=sc(e),i=r===void 0?gc(e):void 0;if(r!==void 0||i!==void 0)return{name:null,use:r,from:i,reads:[],written:t,code:e,line:n};let a=Om.exec(e),o=a?[...new Set([...e.slice(a[0].length).matchAll(km)].map(e=>e[1]))]:[];return{name:a?.[1]??null,use:r,reads:o,written:t,code:e,line:n}}let Nm=e=>/^\s*use(?![A-Za-z0-9_])/m.test(e)||/^\s*(?:\*|&[A-Za-z_][A-Za-z0-9_]*)(?=[\s,]).*\sfrom(?:\s|$)/m.test(e),Pm=e=>e.split(`
`).filter(e=>gc(yc(e)[0].trim())?.kind!==`signature`).join(`
`);function Fm(e){let t=2166136261,n=1523705862;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,16777619),n=Math.imul(n^i,16777619)^n>>>15}return(t>>>0).toString(16).padStart(8,`0`)+(n>>>0).toString(16).padStart(8,`0`)}let Im=e=>`e1:${Fm(jm(e).map(e=>e.code).join(`
`))}`,$=e=>JSON.stringify(e),Lm=e=>e.map($).join(` → `),Rm=new Set(ll.map(e=>e.slice(1)));function zm(e,t,n,r){let i=new Set(e.flatMap(e=>e.name?[e.name]:[])),a=/* @__PURE__ */ new Map,o=e.filter(e=>e.name);return{lines:o,per:t.map(({id:e,names:t,lines:s,resolved:c,parameters:l},u)=>{let d=/* @__PURE__ */ new Map;for(let e of s)e.name&&!d.has(e.name)&&d.set(e.name,e);if(t&&c){let r=[...t].filter(e=>!d.has(e));for(let t of r)n(u,`&${t} is not in ${$(e)}: it defines ${[...d.keys()].map(e=>`&${e}`).join(`, `)}`)}let f=/* @__PURE__ */ new Set;if(!t)for(let e=!0;e;){e=!1;for(let t of d.keys()){if(i.has(t)||f.has(t))continue;let n=s.filter(e=>e.name&&e.name!==t&&e.reads.includes(t));n.length&&n.every(e=>i.has(e.name)||f.has(e.name))&&(f.add(t),e=!0)}}let p=t??new Set([...d.keys()].filter(e=>!f.has(e))),m=[...p].filter(e=>d.has(e)&&i.has(e)).map(e=>`&${e}`),h=/* @__PURE__ */ new Set,g=/* @__PURE__ */ new Set,_=[...p].filter(e=>d.has(e)&&!i.has(e));for(let t=_.shift();t!==void 0;t=_.shift())if(!h.has(t)){h.add(t);for(let a of d.get(t).reads)if(!(!d.has(a)||h.has(a)||p.has(a)||g.has(a))){if(!i.has(a))_.push(a);else if(Rm.has(a)||l?.has(a))continue;else g.add(a),n(u,`&${a} is ${$(e)}'s, read by its &${t}, and ${r}'s too: rename ${r}'s, or name &${a} in the use to override it`)}}let v=/* @__PURE__ */ new Set;for(let t of s){if(!t.name||!h.has(t.name))continue;let r=a.get(t.name);if(r){r.id!==e&&r.code===t.code?v.add(`&${t.name}`):r.id!==e&&n(u,`&${t.name} is defined by ${$(r.id)} and by ${$(e)}, by different lines: write it in the piece, or drop one use`);continue}a.set(t.name,{id:e,code:t.code}),v.add(`&${t.name}`),o.push(t)}let y=m.filter(e=>[...h].some(t=>d.get(t).reads.includes(e.slice(1))));return{gave:[...v],overrode:m,read:y}})}}let Bm=e=>e.names?new Set(e.names.map(e=>e.slice(1))):null,Vm=e=>e.use?{id:e.use.id,names:e.use.names,from:null}:e.from?.kind===`use`?{id:e.from.id,names:e.from.names,from:e.from}:null,Hm=(e,t)=>e.replace(/"[^"]*"|&([A-Za-z_][A-Za-z0-9_]*)/g,(e,n)=>n&&t.has(n)?`&${t.get(n)}`:e),Um=e=>e.slice(0,e.indexOf(`=`));function Wm(e,t){let n=new Set(t.map(Um)),[r,...i]=lc(e).map(e=>e.text);return[r,...i.filter(e=>!(hc(e)&&n.has(Um(e)))),...t].join(` `)}function Gm(e,t,n){let r=new Set(lc(n).flatMap(e=>hc(e.text)?[Um(e.text)]:[])),i=lc(t).slice(1).flatMap(e=>hc(e.text)&&!r.has(Um(e.text))?[e.text]:[]);return[`&${e}`,...i,n].join(` `)}let Km=/* @__PURE__ */ new Set([`step`,`loop`,`swing`]);function qm(e,t,n){if(lc(e).some(e=>hc(e.text)))return e;let r=/* @__PURE__ */ new Set,i=!1,a=RegExp(`&${t}(?![A-Za-z0-9_])`);for(let e of n)for(let n of lc(e.code).slice(1)){if(!a.test(n.text))continue;let e=RegExp(`^([A-Za-z_][A-Za-z0-9_]*)=&${t}(?![A-Za-z0-9_])`).exec(n.text);e?r.add(e[1]):i=!0}let[o]=r;return r.size===1&&!i&&Km.has(o)?`${o}=${e}`:e}function Jm(e,t){let n=[],r=[!1],i=!1,a=!0;for(let o=0;o<e.length;o++){let s=e[o];if(s===`"`&&(i=!i),i||s===`"`)continue;let c=n.every(e=>e===`lambda`);if(/\s/.test(s)){c&&(r[r.length-1]=!1),a=!0;continue}if(a&&c&&/^[A-Za-z_][A-Za-z0-9_]*=/.test(e.slice(o))&&(r[r.length-1]=!0),a=!1,s===`(`){let t=e[o-1]??``,i=t===`&`?`lambda`:/[A-Za-z0-9_]/.test(t)?`call`:`group`;n.push(i),i===`lambda`&&(r.push(r.at(-1)),a=!0);continue}if(s===`)`){n.pop()===`lambda`&&r.pop();continue}if(s!==`&`)continue;let l=/^&([A-Za-z_][A-Za-z0-9_]*)/.exec(e.slice(o));if(l?.[1]!==t)continue;let u=e[o+l[0].length];if(r.some(Boolean)||n.includes(`call`)||u===`^`||u===`[`)return!0}return!1}let Ym=e=>e.map(e=>e.shared?e:{...e,shared:!0});function Xm(e,t,n,r,i,a){let{id:o,from:s}=e,c=jm(n).flatMap(e=>e.from?.kind===`signature`?[e.from]:[]);if(!s||!c.length){s&&(s.head.length||s.args||s.main!==null)&&i(`${$(o)} has no signature, so it takes no arguments: a collection gives the cells it defines by name (${e.names?e.names.join(`, `):`*`} from ${s.id})`);let a=new Set(c.flatMap(e=>[...e.optional,...e.main?[e.main]:[]]).map(e=>e.slice(1))),l=Ym(Qm(t,n,r,i));return{taken:{id:o,names:Bm(e),lines:l,resolved:!0,...a.size?{parameters:a}:{}},copy:[]}}return c.length>1&&i(`${$(o)} has ${c.length} signatures: a fragment has one (&head from (&optional) &main)`),Zm(s,o,c[0],t,n,r,i,a)}function Zm(e,t,n,r,i,a,o,s){let c=Qm(r,i,a,o),l=c.filter(e=>!e.shared&&e.name),u=c.filter(e=>e.shared&&e.name),d=new Set(l.map(e=>e.name)),f=new Set(c.flatMap(e=>e.name?[e.name]:[])),p=e=>e.slice(1),m=n.names.map(p),h=n.optional.map(p),g=n.main?p(n.main):null;for(let e of m)d.has(e)||o(`${$(t)}'s signature names &${e} its head, and it doesn't define it`);for(let e of h)d.has(e)||o(`${$(t)}'s &${e} is an optional parameter: its line in the fragment is its default, and it has none`);g&&f.has(g)&&o(`${$(t)}'s &${g} is its main parameter: it has no line, the argument is it`);let _=/* @__PURE__ */ new Map;if(e.names?.length===1&&m.length===1)_.set(m[0],p(e.names[0]));else for(let n of e.names?.map(p)??m)m.includes(n)?_.set(n,n):o(`&${n} is not a head of ${$(t)}: its head${m.length>1?`s are`:` is`} ${m.map(e=>`&${e}`).join(`, `)}`);let v=_.size===1,y=/* @__PURE__ */ new Set,b=new Map(c.flatMap(e=>e.name?[[e.name,e]]:[]));for(let e=[..._.keys()];e.length;){let t=e.shift();if(!y.has(t)){y.add(t);for(let n of b.get(t)?.reads??[])b.has(n)&&e.push(n)}}e.head.length&&!v&&o(`The attributes before from are the head's, and this line takes ${_.size} heads from ${$(t)}: write them on each head's own line`);let x=new Map((e.args??[]).map(e=>[e.name,e.value]));for(let e of x.keys())h.includes(e)||o(`${$(t)} takes no ${e}=: ${h.length?`its optional parameters are ${h.map(e=>`${e}=`).join(`, `)}`:`it has no optional parameters`}`);g&&e.main===null&&o(`${$(t)} needs its main argument, &${g}, after its id: ${e.names?.[0]??`&${m[0]}`} from ${e.id} …`),!g&&e.main!==null&&o(`${$(t)} takes no main argument: its signature has none (&${m[0]} from ${n.optional.length?`(${n.optional.join(`, `)})`:``})`);let S=/^&([A-Za-z_][A-Za-z0-9_]*)$/,C=/* @__PURE__ */ new Map;for(let[e,t]of x)h.includes(e)&&C.set(e,t);g&&e.main!==null&&C.set(g,e.main);let w=/* @__PURE__ */ new Set;for(let[e,t]of C){let n=S.exec(t);n&&(_.set(e,n[1]),w.add(e))}let T=_.get(m[0])??[..._.values()][0]??m[0];for(let e of[..._.values()])s.add(e);for(let e of[...d,...g?[g]:[]]){if(_.has(e))continue;let t=`${T}_${e}`;for(let n=2;s.has(t)||f.has(t);n++)t=`${T}${n}_${e}`;s.add(t),_.set(e,t)}let E=/* @__PURE__ */ new Set([...f,...g?[g]:[]]),D=/* @__PURE__ */ new Set;for(let e of l)for(let n of e.reads)!E.has(n)&&!D.has(n)&&Jm(e.code,n)&&(D.add(n),o(`${$(t)}'s &${e.name} reads &${n}, which it neither defines nor declares: name it in its signature (&${m[0]} from (&${n}) …), or define it`));let O=[];for(let t of l){let n=t.name;if(w.has(n)||!y.has(n))continue;let r=Hm(t.code,_);C.has(n)&&(r=Gm(_.get(n),r,qm(C.get(n),n,l))),m.includes(n)&&e.head.length&&v&&(r=Wm(r,e.head)),O.push(Mm(r))}g&&e.main!==null&&!w.has(g)&&O.push(Mm(`&${_.get(g)} ${qm(e.main,g,l)}`));let k=u.filter(e=>y.has(e.name));return{taken:{id:t,names:new Set(k.map(e=>e.name)),lines:k,resolved:!0},copy:O,args:Object.fromEntries(C)}}function Qm(e,t,n,r){let i=jm(t),a=` (in ${Lm(e)})`,o=e=>r(`${e}${a}`),s=new Set(i.flatMap(e=>e.name?[e.name]:[])),c=[],l=i.flatMap(t=>{if(t.use===null||t.from===null)return o(t.use===null?cc:_c),[];let i=Vm(t);if(!i)return[];let{id:a}=i,l=Bm(i),u=[...e,a];if(e.includes(a))r(`use ${$(a)} is a cycle: ${Lm(u)}`);else if(u.length>8)r(`use ${$(a)} nests past 8 deep: ${Lm(u)}`);else{let e=n(a);if(e===null)o(`No fragment ${$(a)} to use`);else{let t=Xm(i,u,e,n,r,s);return c.push(...t.copy),[t.taken]}}return[{id:a,names:l,lines:[],resolved:!1}]});return zm([...i,...c],l,(e,t)=>o(t),$(e.at(-1))).lines}function $m(e,{resolve:t,locked:n=[]}={}){let r=jm(e),i=r.flatMap(e=>{let t=Vm(e);return t?[{line:e,...t}]:[]}),a=[],o=e=>{let t=e.written.split(`
`)[0]??``,n=t.search(/\S/);return{line:e.line,col:n+1,len:t.trimEnd().length-n}},s=[],c=[],l=[],u=new Set(r.flatMap(e=>e.name?[e.name]:[])),d=i.map(e=>{let{id:r}=e,i=Bm(e),d=o(e.line),f=e=>a.push({severity:`error`,message:e,span:d}),p=n.find(e=>e.id===r)?.hash,m=t?t(r,...p?[p]:[]):null;if(m===null)return f(t?`No fragment ${$(r)} to use`:`No library to use ${$(r)} from: compileSource(text, env, { resolve })`),s.push(null),c.push([]),l.push(void 0),{id:r,names:i,lines:[],resolved:!1};let h=Im(m);s.push(h),p&&p!==h&&a.push({severity:`warning`,message:`${$(r)} has changed since this piece was saved: its current version plays`,span:d});let g=Xm(e,[r],m,t,f,u);return c.push(g.copy),l.push(g.args),g.taken}),f=zm([...r,...c.flat()],d,(e,t)=>a.push({severity:`error`,message:t,span:o(i[e].line)}),`the piece`);i.forEach((e,t)=>{let{gave:n,overrode:r,read:s}=f.per[t];if(!d[t].resolved||l[t])return;let c=t=>a.push({severity:`warning`,message:t,span:o(e.line)}),{id:u,names:p}=e,m=i.findIndex(e=>e.id===u&&!l[i.indexOf(e)]);if(!n.length&&m<t)c(`${$(u)} is used already, on line ${i[m].line.line}: this use adds nothing`);else if(p)for(let e of r.filter(e=>!s.includes(e)))c(`The piece defines ${e}, so taking it from ${$(u)} adds nothing`);else!n.length&&r.length&&c(`The piece defines all ${$(u)} gives (${r.join(`, `)}): this use adds nothing`)});let p=e.split(`
`).length,m=new Map([...c.flatMap((e,t)=>e.map(e=>[e,t])),...d.flatMap((e,t)=>e.lines.map(e=>[e,t]))]),h=f.lines.filter(e=>m.has(e)),g=[];for(let e of h)for(let t=e.written.split(`
`).length;t>0;t--)g.push(o(i[m.get(e)].line));return{text:h.length?[e,...h.map(e=>e.written)].join(`
`):e,uses:i.map((e,t)=>{let n=c[t].filter(e=>m.get(e)===t&&e.name).map(e=>`&${e.name}`),r=l[t]?(e.names??[]).filter(e=>n.includes(e)):[];return{id:e.id,names:e.names,span:o(e.line),hash:s[t]??null,gave:l[t]?[.../* @__PURE__ */ new Set([...r,...n,...f.per[t].gave])]:f.per[t].gave,overrode:f.per[t].overrode,...l[t]?{args:l[t]}:{}}}),given:new Set(h.flatMap(e=>e.name&&e.shared?[e.name]:[])),diagnostics:a,through:e=>e>p?g[e-p-1]??null:null}}function eh(e,t=_l,n){let r=Cf(e),i=Dm(r,null),a=Of(i.parsed,t,n);if(!i.glides)return a;let o=th(a);return o?Of(Dm(r,o).parsed,t,n):a}function th(e){let t=e.ok?bm(Cm(e)):null;if(!t||!Number.isFinite(t)||t<=0)return null;let n=e.mainMeter;if(!n||!e.clocks.has(n))return{seconds:t};let r=e.cells.get(n)?.units.length??0;if(!r)return{seconds:t};let i=Z(e,gl(e)).map(n).stepAt(t)/r;return Math.abs(i-Math.round(i))<1e-6&&Math.round(i)>0?{bars:Math.round(i)}:{seconds:t}}function nh(e,t=_l,n={}){if(!Nm(e))return eh(Eu(e),t);let r=$m(e,n),i=eh(Eu(r.text),t,r.given),a=[...r.diagnostics,...i.diagnostics.map(e=>({...e,span:r.through(e.span.line)??e.span}))].sort((e,t)=>e.span.line-t.span.line||e.span.col-t.span.col);return{...i,ok:!a.some(e=>e.severity===`error`),diagnostics:a,uses:r.uses}}let rh=/* @__PURE__ */ new WeakMap;function ih(e){if(rh.has(e))return rh.get(e);let t=null,n=e.ok?e.outputs.map(t=>e.cells.get(t.cell)?.clock).find(e=>!!e):void 0,r=n&&e.clocks.get(n)?.tap?e.clocks.get(n).tap.meter:n;for(let t=0;r&&t<16;t++){let t=e.cells.get(r)?.step?.driver;if(!t||!e.clocks.has(t))break;let n=e.clocks.get(t);if(e.cells.get(r)?.meter&&!e.cells.get(t)?.meter&&!n.positional&&n.swing===void 0&&!n.swung)break;r=t}let i=r?e.clocks.get(r):void 0,a=r?e.cells.get(r):void 0;if(i&&a&&!i.belt){let n=[...e.cells.values()].some(e=>e.name!==a.name&&e.step?.driver===a.name);(i.positional||a.meter||i.swing!==void 0||i.swung||a.beat!==1||n)&&(t={cell:a.name,beat:a.beat>0?a.beat:1})}return rh.set(e,t),t}function ah(e,t,n){let r=ih(e.result);if(!r||!(n>t))return null;let i=Z(e.result,e.statics).map(r.cell),a=r.beat/24,o=Math.min(n,e.end),s=e=>e<0?-1/0:i.q(e*a),c=i.stepAt(Math.max(0,t)),l=Number.isFinite(c)?Math.max(0,Math.floor(c/a-np)-1):0;for(;s(l)<t&&Number.isFinite(s(l));)l++;for(;l>0&&s(l-1)>=t;)l--;let u=[];for(let e=l;u.length<1e5;e++){let t=s(e);if(!(t<o))break;u.push(t)}return u.length?{first:l,at:u,before:s(l-1)}:null}function oh(e,t,n){if(!e.result.tapes.length)return[];let r=Z(e.result,e.statics),i=[];for(let a of e.result.tapes){let o=Sp(e.result,r,a.name);if(!o.moving&&!a.dropout&&!a.heads.some(e=>e.wander>0))continue;let s=[];for(let e=t;e<=n;e+=.05)s.push({at:e,speed:o.speed(e)});i.push({tape:a.name,points:s})}return i}function sh(e,t,n,r={}){return{from:t,to:t+n,events:gm(e,t,t+n,!0,r),tapes:oh(e,t,t+n+1e-9),clock:ah(e,t,t+n)}}function ch(e,t,n){let r=nh(e,t,n);return fm(r,gl(r),r.off)}let lh=8192,uh=.02,dh=.5;function fh(e,t=440){let n=69+12*Math.log2(e/t),r=Math.round(n);return{note:r,cents:(n-r)*100}}function ph(e,t=2){if(!Number.isFinite(e))return lh;let n=Math.round(lh+e/(100*t)*lh);return Math.max(0,Math.min(16383,n))}function mh(e,t=Math.max(Math.abs(e.gains[0]),Math.abs(e.gains[1]))){let n=e.levels[0]?.level??1,r=Math.max(0,n*Math.abs(t)),i=Math.round(127*Math.sqrt(Math.min(1,r)));return Math.max(1,Math.min(127,Number.isFinite(i)?i:1))}let hh=[{note:35,name:`acousticbassdrum`,aliases:[]},{note:36,name:`bd`,aliases:[`kick`,`kd`,`bassdrum`]},{note:37,name:`rim`,aliases:[`rs`,`sidestick`]},{note:38,name:`sd`,aliases:[`snare`,`acousticsnare`]},{note:39,name:`cp`,aliases:[`clap`,`handclap`]},{note:40,name:`electricsnare`,aliases:[]},{note:41,name:`lt`,aliases:[`lo`,`lowfloortom`]},{note:42,name:`hh`,aliases:[`ch`,`closedhihat`]},{note:43,name:`highfloortom`,aliases:[]},{note:44,name:`ph`,aliases:[`pedalhihat`]},{note:45,name:`mt`,aliases:[`tom`,`mid`,`lowtom`]},{note:46,name:`oh`,aliases:[`openhihat`]},{note:47,name:`lowmidtom`,aliases:[]},{note:48,name:`ht`,aliases:[`hi`,`himidtom`]},{note:49,name:`cr`,aliases:[`crash`,`crashcymbal`]},{note:50,name:`hightom`,aliases:[]},{note:51,name:`rd`,aliases:[`ride`,`ridecymbal`]},{note:52,name:`chinesecymbal`,aliases:[]},{note:53,name:`ridebell`,aliases:[]},{note:54,name:`tb`,aliases:[`tambourine`]},{note:55,name:`splashcymbal`,aliases:[]},{note:56,name:`cb`,aliases:[`cowbell`]},{note:57,name:`crashcymbaltwo`,aliases:[]},{note:58,name:`vibraslap`,aliases:[]},{note:59,name:`ridecymbaltwo`,aliases:[]},{note:60,name:`hibongo`,aliases:[]},{note:61,name:`lowbongo`,aliases:[]},{note:62,name:`mutehiconga`,aliases:[]},{note:63,name:`openhiconga`,aliases:[]},{note:64,name:`lowconga`,aliases:[]},{note:65,name:`hightimbale`,aliases:[]},{note:66,name:`lowtimbale`,aliases:[]},{note:67,name:`highagogo`,aliases:[]},{note:68,name:`lowagogo`,aliases:[]},{note:69,name:`cabasa`,aliases:[]},{note:70,name:`sh`,aliases:[`maracas`]},{note:71,name:`shortwhistle`,aliases:[]},{note:72,name:`longwhistle`,aliases:[]},{note:73,name:`shortguiro`,aliases:[]},{note:74,name:`longguiro`,aliases:[]},{note:75,name:`claves`,aliases:[`clave`]},{note:76,name:`hiwoodblock`,aliases:[]},{note:77,name:`lowwoodblock`,aliases:[]},{note:78,name:`mutecuica`,aliases:[]},{note:79,name:`opencuica`,aliases:[]},{note:80,name:`mutetriangle`,aliases:[]},{note:81,name:`opentriangle`,aliases:[]}],gh=new Map(hh.flatMap(({note:e,name:t,aliases:n})=>[t,...n].map(t=>[t,e])));function _h(e){return gh.get(e.toLowerCase().replace(/\d+$/,``))??null}function vh(e){let t=/* @__PURE__ */ new Map;for(let n of e){let e=_h(n);e!==null&&t.set(n,e)}let n=new Set(t.values()),r=36;for(let i of e)if(!t.has(i)){for(;r<=127&&n.has(r);)r++;if(r>127)break;t.set(i,r),n.add(r)}return t}let yh=e=>[...e.cells.values()].some(e=>hl(e)),bh=e=>(t,n)=>{let r=e.cells.get(t)?.span,i=e.cells.get(n)?.span;return(r?.line??1/0)-(i?.line??1/0)||(r?.col??0)-(i?.col??0)},xh=(e,t=10)=>{let n=e%15;return n<t-1?n+1:n+2},Sh=(e,t)=>uf(e.cells.get(t.voice)),Ch=(e,t)=>[...t.through,...t.via].find(t=>!!e.cells.get(t)?.gate),wh=(e,t)=>Ch(e,t)??t.voice,Th=e=>e.kit&&(e.mods.length>0||e.offset!==0),Eh=e=>e.kit&&!Th(e);function Dh(e){let t=/* @__PURE__ */ new Set,n=/* @__PURE__ */ new Set;for(let r of e.outputs)if(!r.silent){if(Eh(r))for(let t of Sh(e,r))n.add(t);else if(r.kit)for(let n of Sh(e,r))t.add(Ch(e,r)??n);else t.add(wh(e,r))}let r=bh(e);return{voices:[...t].sort(r),members:[...n].sort(r)}}function Oh(e,t=[{}]){if(yh(e))return kh(e);let{voices:n,members:r}=Dh(e),i=vh(r),a=[],o=[];(t.length?t:[{}]).forEach((e,t)=>{let r=t===0,s=Ah(e.kit)??(r?10:0);s&&i.size&&o.push({port:t+1,channel:s}),n.forEach((n,i)=>{let o=Ah(e.voices?.[n])??(r?xh(i,s||10):0);o&&a.push({voice:n,channel:o,port:t+1})})});let s=bh(e);return{voices:a.sort((e,t)=>s(e.voice,t.voice)||e.port-t.port),kit:[...i].map(([e,t])=>({member:e,note:t})),kits:o}}function kh(e){let t=bh(e),n=/* @__PURE__ */ new Map,r=/* @__PURE__ */ new Set,i=/* @__PURE__ */ new Map,a=/* @__PURE__ */ new Set;for(let t of e.outputs)for(let o of t.midi??[])if(a.add(o.port),Eh(t)){for(let n of Sh(e,t))r.add(n);i.set(`${o.port}|${o.channel}`,{port:o.port,channel:o.channel})}else for(let r of t.kit?Sh(e,t):[t.voice])n.set(`${r}|${o.channel}|${o.port}`,{voice:r,channel:o.channel,port:o.port});for(let t of e.cells.values())t.map?.kind===`midi`&&a.add(t.map.port);let o=vh([...r].sort(t));return{voices:[...n.values()].sort((e,n)=>t(e.voice,n.voice)||e.port-n.port||e.channel-n.channel),kit:[...o].map(([e,t])=>({member:e,note:t})),kits:o.size?[...i.values()].sort((e,t)=>e.port-t.port||e.channel-t.channel):[],byPiece:!0,ports:[...a].sort((e,t)=>e-t)}}let Ah=e=>e===0?0:jh(e),jh=e=>typeof e==`number`&&Number.isInteger(e)&&e>=1&&e<=16?e:null,Mh=e=>e===null?[]:Array.isArray(e)?e:[e];function Nh(e,t){let n=new Map(e.outputs.map(e=>[e.id,e])),r=/* @__PURE__ */ new Map;for(let e of t.voices)r.set(e.voice,[...r.get(e.voice)??[],{channel:e.channel,port:e.port}]);let i=new Map(t.kit.map(e=>[e.member,e.note]));return t.byPiece?e=>{if(!e.midi?.length)return null;let t=e.output===void 0?void 0:n.get(e.output),r=t&&Eh(t)?i.get(e.voice):null;return r===void 0?null:e.midi.map(e=>({channel:e.channel,drum:r,port:e.port,gain:e.gain}))}:a=>{let o=a.output===void 0?void 0:n.get(a.output);if(o?.silent)return null;if(o&&Eh(o)){let e=i.get(a.voice);return e===void 0?null:t.kits.map(t=>({channel:t.channel,drum:e,port:t.port}))}let s=o?o.kit?Ch(e,o)??a.voice:wh(e,o):a.voice;return(r.get(s)??[]).map(e=>({channel:e.channel,drum:null,port:e.port}))}}function Ph(e,t,n=2,r=440){let i=mh(e,t.gain),a=e.at+Math.max(0,e.dur);if(t.drum!==null)return{channel:t.channel,note:t.drum,velocity:i,at:e.at,end:a,bend:lh,bends:[]};if(!(e.freq>0)||!Number.isFinite(e.freq))return null;let{note:o,cents:s}=fh(e.freq,r);if(o<0||o>127)return null;let c=Math.abs(s)<dh?0:s,l=e=>Math.abs(c+e)<dh?lh:ph(c+e,n),u=[],d={at:e.at,cents:0},f=(e,t)=>{t!==(u.at(-1)?.value??l(0))&&u.push({at:e,value:t})};for(let t of e.bends){if(t.at>=a)break;if(t.ramp&&t.at>d.at)for(let e=d.at+uh;e<t.at-1e-9;e+=uh)f(e,l(d.cents+(t.cents-d.cents)*(e-d.at)/(t.at-d.at)));let n=Math.max(e.at,t.at);f(n,l(t.cents)),d={at:n,cents:t.cents}}return{channel:t.channel,note:o,velocity:i,at:e.at,end:a,bend:l(0),bends:u}}let Fh=e=>Math.abs(e-Math.round(e))<1e-9,Ih=(e,t)=>e.steps>0&&Fh(t*e.rate/e.steps);function Lh(e){for(let t=1;t<=4096;t++)if(Ih(e,t*e.bars))return t;return 0}let Rh=(e,t,n)=>Ih(e,Gd(t,n,e.bars).length);function zh(e,t,n,r){let i=Eu(e).cells,a=r??new Set(i.map(e=>e.name)),o=t.mainMeter!==void 0&&a.has(t.mainMeter);return i.flatMap(e=>{let r=e.step;if(r?.kind!==`tap`||n&&!n.has(e.name)||(r.meter?a.has(r.meter.name):o))return[];let i=t.cells.get(e.name);if(!i||i.voice||i.steps<=0)return[];let s=Math.max(1,Math.round(e.cycle??1)),c={cell:`&${e.name}`,meter:r.meter?`&${r.meter.name}`:null,tap:r.tap.written,bars:s,steps:i.steps,rate:r.ratio};return[{need:{...c,bar:Lh(c)},tap:r.tap}]})}let Bh=e=>e.kind===`ref`?e.pick||e.shift||e.transpose||e.values?[e.name]:[]:e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>Bh(e.atom))):[],Vh=e=>new Set(e.flatMap(e=>e.braid.kind===`list`?e.braid.tokens.flatMap(e=>Bh(e.atom)):[]).map(e=>`&${e}`));function Hh(e){let t=new Set(e.flatMap(e=>Sd(e)).map(e=>`&${e}`)),n=/* @__PURE__ */ new Set([...e.flatMap(e=>Cd(e)).map(e=>`&${e}`),...Vh(e)]);return e=>t.has(e)&&!n.has(e)}let Uh=(e,t)=>t&&Nm(e)?$m(e,{resolve:t}).text:e,Wh=e=>`${e} s=white`;function Gh(e,t,n){let r=Uh(e,n),i=Eu(r).cells,a=i.filter(e=>!e.lambda),o=t(e),s=o.unknown.map(e=>`&${e.name}`),c=a.some(e=>e.over?.name===`key:main`)&&!o.mainKey,l=Hh(i),u=new Set(s.filter(l)),d=new Set(i.map(e=>`&${e.name}`));if(u.size)for(let e of new Set(a.flatMap(e=>Sd(e)).map(e=>`&${e}`)))l(e)&&!d.has(e)&&u.add(e);let f=o;for(;u.size;){f=t(`${e}\n${[...u].map(Wh).join(`
`)}`);let n=f.unknown.map(e=>`&${e.name}`).filter(e=>l(e)&&!u.has(e));if(!n.length)break;n.forEach(e=>u.add(e))}let p=[.../* @__PURE__ */ new Set([...s,...u,...c?[`key`]:[]])].sort(),m=p.filter(l),h=Vh(i),g=m.map(Wh).join(`
`),_=g?`${r}\n${g}`:r;return{uses:p,sounds:m,lines:p.filter(e=>h.has(e)),defines:[.../* @__PURE__ */ new Set([...a.map(e=>`&${e.name}`),...(o.uses??[]).flatMap(e=>e.gave)])],clock:zh(_,g?f:o).map(e=>e.need)}}let Kh=new Set(ll.map(e=>e.replace(/^&/,``))),qh=/^\s*&([A-Za-z_][A-Za-z0-9_]*)(?=\s|$)/,Jh=/^use\s/,Yh=/[+*,[]\s*$/;function Xh(e){let t=[],n=null;for(let r of e.split(`
`)){let e=yc(r)[0];if(n??={written:[],code:[]},n.written.push(r),n.code.push(e),Yh.test(e))continue;let i=n.code.join(` `).trim().split(/\s+/).join(` `),a=qh.exec(i)?.[1];a&&gc(i)===void 0&&t.push({name:a,written:n.written.join(`
`),code:i}),n=null}return t}let Zh=e=>new Set(e.split(`
`).flatMap(e=>[...yc(e)[0].matchAll(/&([A-Za-z_][A-Za-z0-9_]*)/g)]).map(e=>e[1]??``)),Qh=e=>e.split(`
`).map(e=>yc(e)[0].trim().split(/\s+/).join(` `)).filter(e=>Jh.test(e)||gc(e)?.kind===`use`);function $h(e,t){let n=new Map(Xh(t).map(e=>[e.name,e])),r=/* @__PURE__ */ new Set([...Zh(t),...Zh(e)]),i=/* @__PURE__ */ new Map;for(;;){let a=e;for(let[e,t]of i)a=Mc(a,e,t);let o=Xh(a),s=[],c=[],l=[];for(let e of o){let t=n.get(e.name);t&&(t.code===e.code?s.push(e.name):Kh.has(e.name)?c.push(e.name):l.push(e.name))}if(!l.length){let n=new Set(Qh(t)),r=[...Qh(e).filter(e=>!n.has(e)),...o.filter(e=>!s.includes(e.name)).map(e=>e.written)],a=t.replace(/\s+$/,``),l=e=>e.map(e=>`&${e}`);return{text:[...a?[a]:[],...r].join(`
`),renamed:new Map([...i].map(([e,t])=>[`&${e}`,`&${t}`])),shared:l(s),twice:l([...new Set(c)]),names:l([...new Set(o.map(e=>e.name))])}}for(let e of l){let t=2;for(;r.has(`${e}${t}`);)t++;r.add(`${e}${t}`),i.set(e,`${e}${t}`)}}}function eg(e,{need:t,tap:n}){let r=t.meter?t.meter.slice(1):e.mainMeter,i=r===void 0?null:e.cells.get(r)?.meter;return!!i&&Rh(t,i,n)}let tg=e=>e.unknown.map(e=>`&${e.name}`),ng=(e,t)=>e.severity===t.severity&&e.message===t.message&&e.span.line===t.span.line&&e.span.col===t.span.col;function rg(e,t,n,r){let i=n??(e=>nh(e,void 0,r?{resolve:r}:{})),a=Gh(e,i,r),o=i(t),s=/* @__PURE__ */ new Set([...Xh(t).map(e=>`&${e.name}`),...(o.uses??[]).flatMap(e=>e.gave)]),c=a.uses.filter(e=>e===`key`?!o.mainKey:!s.has(e)),l=c.filter(e=>a.sounds.includes(e)),u=c.filter(e=>!l.includes(e)),d=Uh(e,r),f=Hh(Eu(d).cells),p=$h(e,t),m=a.sounds.map(Wh),h=zh([d,...m].join(`
`),i([e,...m].join(`
`))).filter(e=>!eg(o,e)).map(e=>e.need),g={fits:!1,union:p,missing:u,sounds:l,unmet:h};if(u.length||p.twice.length||h.length)return g;let _=Eu(t).cells,v=Hh(_),y=[...new Set(_.flatMap(e=>Sd(e)).map(e=>`&${e}`))].filter(e=>!s.has(e)&&!p.names.includes(e)&&v(e)).map(Wh),b=y.length?i([t,...y].join(`
`)):o,x=()=>[p.text,.../* @__PURE__ */ new Set([...l.map(Wh),...y])].join(`
`),S=i(x());for(;;){let e=tg(S).filter(e=>f(e)&&!l.includes(e)&&!s.has(e)&&!p.names.includes(e));if(!e.length)break;l.push(...e),S=i(x())}l.sort();let C=[...b.diagnostics],w=new Set([...l,...y.map(e=>e.split(` `)[0])].map(e=>e.startsWith(`&`)?e:`&${e}`)),T=S.diagnostics.filter(e=>{let t=/^(&\w+) is only on a MIDI card: its sound/.exec(e.message);if(t&&w.has(t[1])||e.message.startsWith(`use is the old way`))return!1;let n=C.findIndex(t=>ng(t,e));return n<0||(C.splice(n,1),!1)}),E=e=>new Set(e.map(e=>e.slice(1))),D=E(p.names.filter(e=>!p.shared.includes(e))),O=zh(x(),S,E(p.names),D).filter(e=>!eg(S,e)).map(e=>e.need);return{fits:!T.length&&!O.length,union:p,missing:u,sounds:l,unmet:O,diagnostics:T}}function ig(e,t){let n=/* @__PURE__ */ new Map;return r=>{if(n.has(r)){let e=n.get(r);return n.delete(r),n.set(r,e),e}let i=t(r);return n.set(r,i),n.size>e&&n.delete(n.keys().next().value),i}}let ag=(e=512)=>ig(e,e=>nh(e));function og(e=512){let t=ag(e),n=ig(e,e=>{let n=e.indexOf(`:`),r=n+1+Number(e.slice(0,n));return rg(e.slice(r),e.slice(n+1,r),t)});return(e,t)=>n(`${t.length}:${t}${e}`)}let sg=(e,t,n)=>({...e,sign:e.sign*t,by:e.by*t+n}),cg=e=>`${e.table}:${e.sign*e.value+e.by}:${e.sign*e.alter}:${e.transpose}`;function lg(e){if(typeof e.written==`number`){let t=e.sign*e.alter;return`${e.sign*e.written+e.by}${t>0?`#`:t<0?`b`:``}`}let t=e.sign===-1?`inverse(${e.written})`:e.written;return e.by===0?t:/^&[A-Za-z_][A-Za-z0-9_]*$/.test(t)?`${t}^${e.by}`:`degree(${t}, ${e.by})`}let ug=e=>_h(e.slice(1))??128,dg=/^~(?:!(\d+))?$/,fg=/^&([A-Za-z_][A-Za-z0-9_]*)(?::0(?::([0-9]*\.?[0-9]+))?)?(?:!(\d+))?$/,pg=/^\[([^[\]]*,[^[\]]*)\]$/,mg=/^\[([^[\],]*)\]$/,hg=/^&([A-Za-z_][A-Za-z0-9_]*)\((\d+),\s*(\d+)(?:,\s*(-?\d+))?\)$/,gg=/^([0-9]*\.?[0-9]+)(?:!(\d+))?$/,_g=/^(-?\d+)[#b]?(?:!(\d+))?$/,vg=/^(-?\d+)[#b]?@(\d+)$/,yg=String.raw`&[A-Za-z_][A-Za-z0-9_]*(?:\^\$?-?\d+)?`,bg=new RegExp(String.raw`^(?:${yg}|inverse\(${yg}\)|degree\((?:${yg}|inverse\(${yg}\)),\s*-?\d+\))$`);function xg(e){let t=fg.exec(e);return t&&!t[3]?{voice:`&${t[1]}`,own:t[2]??null}:null}function Sg(e){let t=[];for(let n of e){let e=dg.exec(n),r=fg.exec(n),i=pg.exec(n);if(e)for(let n=0;n<Number(e[1]??1);n++)t.push([]);else if(r)for(let e=0;e<Number(r[3]??1);e++)t.push([{voice:`&${r[1]}`,own:r[2]??null}]);else if(i){let e=i[1].split(`,`).map(e=>xg(e.trim()));if(e.some(e=>!e))return null;t.push(e)}else return null}return t}function Cg(e){let t=[];for(let n of e){let e=gg.exec(n);if(!e)return null;for(let n=0;n<Number(e[2]??1);n++)t.push(e[1])}return t}let wg=(e,t,n)=>{let r=Ja(e,t);return Array.from({length:t},(e,t)=>t).filter(e=>r[((e-n)%t+t)%t])};function Tg(e,t){if(!e||!t)return null;let n=t.pulses/t.unit;return e===`1m`?n:e===`pulse`?1/t.unit:Dd(e)}function Eg(e,t){let n=Oc(e,t)?.braid??[];return n.length!==1||!/^\[.*\]$/.test(n[0])?[]:n[0].slice(1,-1).split(`,`).map(e=>e.trim())}function Dg(e,t){let n=new Set(e.split(`
`).flatMap(e=>[...yc(e)[0].replace(/^\s*&[A-Za-z_][A-Za-z0-9_]*/,``).matchAll(/&([A-Za-z_][A-Za-z0-9_]*)/g)].map(e=>e[1]))),r=[...t.cells.values()].filter(e=>!e.implicit&&!e.lambda&&!n.has(e.name)),i=[...[...t.cells.values()].filter(e=>(e.map?.kind===`midi`||e.sink)&&!e.implicit).map(e=>e.name),...r.filter(t=>!t.map&&!t.voice&&!t.step&&Eg(e,t.name).length).map(e=>e.name)],a=[],o=/* @__PURE__ */ new Set,s=n=>{if(o.has(n))return;o.add(n);let r=Eg(e,n);for(let i of r){let o=/^&([A-Za-z_][A-Za-z0-9_]*)$/.exec(i)?.[1],c=o?t.cells.get(o):void 0;if(c&&!c.voice&&!c.step&&Eg(e,o).length){s(o);continue}let l=i.split(`*`).map(e=>e.trim()),u=l.filter(e=>e.startsWith(`&`));if(l.some(e=>!/^&[A-Za-z_][A-Za-z0-9_]*$/.test(e)&&!gg.test(e)))continue;let d=u.map(e=>t.cells.get(e.slice(1)));if(d.some(e=>!e))continue;let f=d.filter(e=>e.map?.kind===`amp`),p=d.filter(e=>e.map?.kind!==`amp`),m=p.filter(e=>e.voice),h={name:n,entries:r,entry:i};if(p.length===2&&m.length===1&&!f.length){let n=kg(e,t,p.find(e=>!e.voice).name,m[0].name,h);n&&a.push(n);continue}if(p.length!==1||f.length>1)continue;let g=Og(e,t,p[0].name,f[0]?.name,h);g&&a.push(g)}};for(let e of i)s(e);for(let n of r){if(!n.over||!n.step||n.voice||n.map)continue;let r=kg(e,t,n.name,null,{name:n.name,entries:[],entry:`&${n.name}`});r&&a.push(r)}return a}function Og(e,t,n,r,i){let a=Oc(e,n),o=t.cells.get(n);if(!a||!o.step)return null;let s=t.cells.get(o.step.driver)?.meter??null,c=Tg(o.step.tap,s),l=e=>!!t.cells.get(e.slice(1))?.voice,u=`steps`,d,f;if(a.braid.length===1&&hg.test(a.braid[0])){let[,e,t,n,r]=hg.exec(a.braid[0]);u=`euclid`,f={voice:`&${e}`,k:Number(t),n:Number(n),r:Number(r??0)};let i=new Set(wg(f.k,f.n,f.r));d=Array.from({length:f.n},(e,t)=>i.has(t)?[{voice:f.voice,own:null}]:[])}else a.braid.length===1&&mg.test(a.braid[0])?(u=`seq`,d=Sg(Tc(mg.exec(a.braid[0])[1]))):d=Sg(a.braid);if(!d?.length||d.some(e=>e.some(e=>!l(e.voice)))||u===`steps`&&d.length!==o.steps)return null;let p;if(r){let t=Cg(Oc(e,r)?.braid??[]);if(!t||t.length!==d.length)return null;p={cell:r,tokens:t}}let m=d.flatMap((e,t)=>e.map(e=>({step:t,voice:e.voice,own:e.own,level:Number(e.own??1)*Number(p?.tokens[t]??1)}))).filter(e=>e.level>0).sort((e,t)=>e.step-t.step||ug(e.voice)-ug(t.voice));return{name:`&${n}`,trigger:n,card:i,form:u,...f?{euclid:f}:{},...p?{levels:p}:{},steps:d.length,notes:m,stepWhole:c===null?null:u===`steps`?c:c/d.length,meter:s}}function kg(e,t,n,r,i){let a=Oc(e,n),o=t.cells.get(n);if(!a||!o.step)return null;let s=t.cells.get(o.step.driver)?.meter??null,c=Symbol(`held`),l=[],u=/* @__PURE__ */ new Map;for(let e of a.braid){let t=dg.exec(e),n=_g.exec(e),r=vg.exec(e);if(t)for(let e=0;e<Number(t[1]??1);e++)l.push(null);else if(n)for(let e=0;e<Number(n[2]??1);e++)l.push(Number(n[1]));else if(r&&Number(r[2])>=2)u.set(l.length,Number(r[2])),l.push(Number(r[1]),...Array(Number(r[2])-1).fill(c));else if(bg.test(e))l.push(e);else return null}if(!l.length||l.length!==o.steps)return null;let d=Bp(t,n,gl(t)),f=[];for(let[e,t]of l.entries()){let n=d.filter(t=>Math.abs(t.step-e)<1e-9),i=u.get(e)??1;if(t===null||t===c?n.length:n.length!==1||Math.abs(n[0].duration-i)>1e-9)return null;if(t===null||t===c)continue;let a=n[0],o={written:t,sign:1,by:0,table:`${a.table}:${a.tableShift}`,value:a.value,alter:a.alter,transpose:a.transpose??0};f.push({step:e,voice:r===null?``:`&${r}`,own:null,level:1,pitch:o,...i>1?{hold:i}:{}})}return d.length===f.length?{name:`&${n}`,trigger:n,card:i,form:`steps`,steps:l.length,notes:f,stepWhole:Tg(o.step.tap,s),meter:s,pitched:{table:o.over,voice:r===null?``:`&${r}`}}:null}let Ag=e=>e.own===null?e.voice:`${e.voice}:0:${e.own}`;function jg(e,t){let n=Array(e.steps).fill(`~`),r=/* @__PURE__ */ new Map;for(let i of t){if(!Number.isInteger(i.step))continue;for(let t=1;t<(i.hold??1);t++)i.step+t<e.steps&&(n[i.step+t]=null);let t=i.pitch?`${lg(i.pitch)}${i.hold?`@${i.hold}`:``}`:Ag(i),a=r.get(i.step);a?a.push(t):r.set(i.step,[t])}for(let[t,i]of r)t>=0&&t<e.steps&&n[t]!==null&&(n[t]=i.length===1?i[0]:`[${i.join(`,`)}]`);return n}function Mg(e,t,n,r=!1){let i=/* @__PURE__ */ new Map;if(!t.length){let t=e.card.entries.filter(t=>t!==e.card.entry);if(!t.length)return null;i.set(e.card.name,[`[${t.join(`, `)}]`])}if(e.euclid&&r){let{voice:t,k:n,n:r,r:a}=e.euclid;i.set(e.trigger,[`${t}(${n},${r},${(a+1)%r})`])}else{let n=jg(e,t).filter(e=>e!==null);i.set(e.trigger,e.form===`steps`?n:[`[${n.join(` `)}]`])}return e.levels&&n&&i.set(e.levels.cell,[...n]),i}function Ng(e){let t=e.beats.length;return e.beats.map((t,n)=>e.beats.slice(0,n).reduce((e,t)=>e+t,0)/e.unit).filter((e,n)=>t<=3?n>0:n%2==1)}let Pg=(e,t)=>Math.abs(e-t)<1e-9;function Fg(e){if(!e.meter||e.stepWhole===null)return!1;let t=e.meter.pulses/e.meter.unit,n=Ng(e.meter);return e.notes.every(r=>{let i=r.step*e.stepWhole%t;return n.some(e=>Pg(i,e)||Pg(i,e+t))})}let Ig=(e,t)=>e.notes.length>0&&e.notes.every(e=>_h(e.voice.slice(1))===t);function Lg(e,t){let n=e.cells.get(t);if(!n?.step)return null;let r=Tg(n.step.tap,e.cells.get(n.step.driver)?.meter??null);if(r===null)return null;let i=/* @__PURE__ */ new Map;for(let n of Bp(e,t,gl(e)))i.set(n.step,[...i.get(n.step)??[],n.value+n.alter]);if(![...i.values()].some(e=>e.length>1))return null;let a=[...i.keys()].sort((e,t)=>e-t),o=e=>[...e].sort((e,t)=>e-t).join(`,`),s=a.filter((e,t)=>t===0||o(i.get(e))!==o(i.get(a[t-1]))).map(e=>({at:e*r,size:i.get(e).length}));return{lap:n.steps*r,changes:s}}function Rg(e,t){if(!e.pitched?.table||e.stepWhole===null)return[];let n=Lg(t,e.pitched.table);if(!n)return[];let r=e.steps*e.stepWhole,i=e=>Pg(e%n.lap,0)||Pg(e%n.lap,n.lap),a=1;for(;a<64&&!i(a*r);)a++;return e.notes.flatMap(t=>{let i=t.pitch;if(typeof i.written!=`number`||i.table!==`${e.pitched.table}:0`||i.alter||i.transpose)return[];let o=Array.from({length:a},(i,a)=>(t.step*e.stepWhole+a*r)%n.lap).flatMap(e=>n.changes.filter(t=>Pg(t.at,e)||Pg(t.at+n.lap,e))),s=e=>(i.value%e+e)%e===0;return o.length&&o.every(e=>s(e.size))?[{line:e.name,step:t.step,reason:`root`}]:[]})}function zg(e,t){return e.flatMap(e=>e.pitched?Rg(e,t):Ig(e,36)?[{line:e.name,reason:`kick`}]:Ig(e,38)&&Fg(e)?[{line:e.name,reason:`backbeat`}]:[])}let Bg=/@(\d+)$/,Vg=/^(.+)!(\d+)$/;function Hg(e,t){let n=[],r=0;for(let t of e){let e=Bg.exec(t),i=Vg.exec(t),a=e?Number(e[1]):i?Number(i[2]):1;n.push({start:r,len:a}),r+=a}return r===t?n:null}let Ug=/^(label|tags|show|about|title)=/;function Wg(e,t,n,r,i,a,o){if(e.form!==`steps`||e.levels||e.euclid||!i.length)return null;let s=Hg(t,e.steps);if(!s)return null;let c=e.name,l=e.steps,u=s.length,d=jg(e,e.notes),f=jg(e,i),p=(e,t,n=f)=>n.slice(e,t).filter(e=>e!==null),m=n.filter(e=>!Ug.test(e)),h=[...a].sort((e,t)=>e-t),g=(e,t)=>{let n=[],r=0;for(let e=0;e<l;e++){let i=t(e);if(i===null){d[e]!==null&&r++;continue}r&&n.push(r===1?`=`:`=!${r}`),n.push(i),r=0}return{form:`base=${e} ${n.join(` `)}`.trim(),line:t=>`&${t} base=${e} ${n.join(` `)}`.trim()}},_=e=>e===u-1&&u>1?`-1`:String(e),v=(e,t)=>e===0&&t===u?c:t-e===1?`${c}[${_(e)}]`:e===0?`${c}[:${t===u-1?`-1`:t}]`:t===u?`${c}[${_(e)}:]`:`${c}[${e}:${t}]`,y=(e,t)=>{let n=s.findIndex(t=>t.start===e),r=s.findIndex(e=>e.start===t);return n<0||r<0&&t!==l?null:[n,r<0?u:r]},b=(e,t,n)=>{let r=y(e,t);return r?[n(v(...r))]:p(e,t)},x=e=>{let t=e.join(` `);return{form:t,line:e=>[`&${e}`,...m,t].join(` `)}},S=null;if(r===`rotate`)s.at(-1).len===1&&(S={form:`${c}[<<]`,line:e=>`&${e} [${c}[<<]]`});else if(r===`transpose`)S=h.length?g(`${c}^${o}`,e=>a.has(e)?d[e]:null):x([`${c}^${o}`]);else if(r===`invert`){let e=e=>o?`degree(inverse(${e}), ${o})`:`inverse(${e})`,t=[],n=0;for(let r of[...h,l])r>n&&t.push(...b(n,r,e)),r<l&&t.push(...b(r,r+1,e=>e)),n=r+1;S=x(t)}else if(r===`reverse`){if(!h.length)S=x([`${c}[::-1]`]);else{let e=h[0]>0,t=e?p(0,h[0]):[];for(let[n,r]of h.entries()){t.push(...b(r,r+1,e=>e));let[i,a]=[r+1,h[n+1]??l],o=y(i,a);a<=i||(e&&n===h.length-1?t.push(...p(i,a)):a-i===1?t.push(...b(i,a,e=>e)):o?t.push(`${c}[${o[1]===u?``:o[1]-1}:${o[0]-1}:-1]`):t.push(...p(i,a)))}S=x(t)}}else S=g(c,e=>d[e]===f[e]?null:f[e]);return!S||!S.form.includes(c)?null:S.line(e.trigger).length<=[c,...m,...p(0,l)].join(` `).length?S:null}let Gg=[`rotate`,`drop`,`add`],Kg=[`transpose`,`invert`,`reverse`,`bend`,`trim`],qg=[-2,-1,1,2],Jg=[-2,-1,1,2];function Yg(e,t=``){let n=new Set(Xh(e).map(e=>e.name)),r=[...Xh(t).filter(e=>!n.has(e.name)).map(e=>e.written),e].join(`
`),i=nh(r);if(!i.ok)return{lines:[],anchors:[],result:null,own:n};let a=Dg(r,i);return{lines:a,anchors:zg(a,i),result:i,own:n}}let Xg=e=>e.startsWith(`&`)?e:`&${e}`,Zg=(e,t)=>Qg(e,t).variations.map(e=>e.variation);function Qg(e,t={}){let{workbench:n,operators:r=Gg,keep:i=[],fewest:a=1,degrees:o=qg}=t,{lines:s,anchors:c,result:l,own:u}=Yg(e,n);if(!l)return{notes:null,span:null,bar:null,variations:[]};let d=/* @__PURE__ */ new Set([...c.filter(e=>e.step===void 0).map(e=>e.line),...i.map(Xg)]),f=(e,t)=>c.some(n=>n.line===e.name&&n.step===t.step),p=(e,t)=>{let n=s[e].stepWhole;return n===null?`${e}@${t}`:(t*n).toFixed(9)},m=e=>String(_h(e.slice(1))??e),h=e=>e.pitch?` ${cg(e.pitch)}`:``,g=(e,t)=>t.map(t=>`${p(e,t.step)} ${s[e].stepWhole??e} ${t.voice}${h(t)}`),_=(e,t)=>t.map(t=>`${p(e,t.step)} ${m(t.voice)}${h(t)}`),v=new Map([...new Set(s.flatMap(e=>e.pitched?[e.pitched.voice]:[]))].map((e,t)=>[e,`voice#${t}`])),y=(e,t)=>{let{stepWhole:n,name:r}=s[e];return t.map(e=>{let t=`${n??r} ${e.pitch?`${v.get(e.voice)} ${cg(e.pitch)}`:m(e.voice)}`;return n===null?{at:null,key:`${r}@${e.step} ${t}`}:{at:e.step*n,key:t}})},b=s.map((e,t)=>y(t,e.notes)),x=e_(l,u,s),S=[...s.map(e=>e.stepWhole===null?null:e.steps*e.stepWhole),...x.map(e=>e.lap)],C=s.find(e=>e.meter)?.meter??x.find(e=>e.meter)?.meter??null,w=S.length&&S.every(e=>e!==null)?S.reduce((e,t)=>$g(e,t)):null,T=C?C.pulses/C.unit:null,E=x.flatMap(e=>e.notes),D=s.map((e,t)=>g(t,e.notes)),O=s.map((e,t)=>_(t,e.notes)),k=s.reduce((e,t)=>e+t.notes.length,0),ee=/* @__PURE__ */ new Map,A=e=>{let t=ee.get(e);if(!t){let n=s.flatMap((t,n)=>n===e?[]:O[n]),r=new Set(n);t={keys:s.flatMap((t,n)=>n===e?[]:D[n]).sort(),strikes:r.size<n.length?null:r},ee.set(e,t)}return t},j=(e,t)=>{let n=A(e).keys,r=e<0?[]:g(e,t).sort(),i=[],a=0,o=0;for(;a<n.length||o<r.length;)i.push(o>=r.length||a<n.length&&n[a]<=r[o]?n[a++]:r[o++]);return i.join(`|`)},te=(e,t)=>{let n=A(e).strikes;if(!n)return!1;let r=/* @__PURE__ */ new Set;for(let i of _(e,t)){if(n.has(i)||r.has(i))return!1;r.add(i)}return!0},M=/* @__PURE__ */ new Set([j(-1,[])]),ne=[],N=/* @__PURE__ */ new Map,re=t=>(N.has(t)||N.set(t,Oc(e,t)),N.get(t)),P=(e,t,n,r,i,o,c=r)=>{if(!i||k-s[e].notes.length+n.length<a||!te(e,n))return;let l=j(e,n);if(M.has(l))return;M.add(l);let u=s[e].name,d=(e,t)=>{let n=re(e);return n?[...n.head,...n.attrs,...t??n.braid].join(` `):``},p=re(s[e].trigger),m=new Set(s[e].notes.filter(n=>f(s[e],n)&&!(t===`invert`&&n.pitch?.written===(c??0)/2&&!n.pitch.alter)).map(e=>e.step)),h=p&&Wg(s[e],p.braid,p.attrs,t,n,m,c),g={id:`vary:${t}:${u}${r===null?``:`:${r}`}:${ne.length}`,tool:`vary`,rule:t,title:`${u}: ${o}`,before:[...i.keys()].map(e=>d(e)).join(`
`),after:[...i].map(([e,t])=>d(e,t)).join(`
`),apply:e=>[...i].reduce((e,[t,n])=>kc(e,t,n),e),line:u,by:`${t} ${u}${r===null?``:` ${r}`}`,...h?{reference:h}:{}};ne.push({variation:g,notes:[...s.flatMap((t,r)=>r===e?y(e,n):b[r]),...E]})},ie=e=>e.sort((e,t)=>e.step-t.step||ug(e.voice)-ug(t.voice)),F=e=>{let t=s[e].notes[0];return[t.step*(s[e].stepWhole??1),ug(t.voice)]},ae=s.map((e,t)=>t).filter(e=>s[e].notes.length>0&&!d.has(s[e].name)).sort((e,t)=>F(e)[0]-F(t)[0]||F(e)[1]-F(t)[1]);for(let e of ae){let t=s[e],n=t.levels?.tokens,[i,a]=t.notes.slice(-2),c=t.notes.length>=2&&!f(t,a);for(let s of r)if(Kg.includes(s)===!!t.pitched&&(!t.notes.some(e=>e.hold)||[`transpose`,`invert`].includes(s))){if(s===`bend`){if(c)for(let n of Jg){let r=t.notes.map(e=>e===a?{...e,pitch:sg(i.pitch,1,n)}:e);P(e,s,r,n,Mg(t,r),`its last note bent to ${Math.abs(n)} degree${Math.abs(n)===1?``:`s`} ${n>0?`above`:`below`} the one before it`)}}else if(s===`trim`){if(!c||t.notes.length-1<2)continue;let n=t.notes.filter(e=>e!==a);P(e,s,n,a.step,Mg(t,n),`its last note, on step ${a.step}, left out: the one before it held`)}else if(s===`transpose`)for(let n of o){let r=t.notes.map(e=>f(t,e)?e:{...e,pitch:sg(e.pitch,1,n)});P(e,s,r,n,Mg(t,r),`every note ${n>0?`up`:`down`} ${Math.abs(n)} degree${Math.abs(n)===1?``:`s`}`)}else if(s===`invert`){let{written:n,alter:r}=t.notes[0].pitch;if(typeof n!=`number`||r)continue;let i=t.notes.map(e=>f(t,e)?e:{...e,pitch:sg(e.pitch,-1,2*n)});P(e,s,i,null,Mg(t,i),`every note mirrored about its first`,2*n)}else if(s===`reverse`){let n=ie(t_(t,e=>f(t,e)));P(e,s,n,null,Mg(t,n),`its notes in reverse order between its anchors`)}else if(s===`rotate`){let r=ie(t.notes.map(e=>({...e,step:(e.step+1)%t.steps})));P(e,s,r,null,Mg(t,r,n&&[n.at(-1),...n.slice(0,-1)],!0),`every note a step later, the last to the first`)}else if(s===`drop`)for(let n of t.notes){let r=t.notes.filter(e=>e!==n);P(e,s,r,n.step,Mg(t,r),`its ${n.voice} on step ${n.step} left out`)}else{let r=t.notes[0].voice,i=t.notes.reduce((e,t)=>t.level>e.level?t:e);for(let a=0;a<t.steps;a++){if(t.notes.some(e=>e.step===a&&m(e.voice)===m(r)))continue;let o=ie([...t.notes,{step:a,voice:r,own:i.own,level:i.level}]),c=n&&n.map((e,t)=>t===a?n[i.step]:e);P(e,s,o,a,Mg(t,o,c),`a ${r} on step ${a}, as loud as its loudest`)}}}}return{notes:[...b.flat(),...E],span:w,bar:T,variations:ne}}function $g(e,t){let n=(e,t)=>t?n(t,e%t):e,[r,i]=[Math.round(e*3840),Math.round(t*3840)];return r&&i?r/n(r,i)*i/3840:Math.max(e,t)}function e_(e,t,n){let r=new Set(n.flatMap(e=>[e.trigger,e.card.name,...e.levels?[e.levels.cell]:[]])),i=[];for(let n of t){let t=e.cells.get(n);if(!t?.step||r.has(n)||t.voice)continue;let a=e.cells.get(t.step.driver)?.meter??null,o=Tg(t.step.tap,a);if(o===null)continue;let s=Bp(e,n,gl(e)),c=/* @__PURE__ */ new Map;for(let e of s)c.set(e.step,(c.get(e.step)??0)+1);if(![...c.values()].some(e=>e>1))continue;let l=i.length,u=s.map(e=>({at:e.step*o,key:`${o*e.duration} chords#${l} ${e.table}:${e.tableShift}:${e.value}:${e.alter}:${e.transpose??0}`}));i.push({notes:u,lap:t.steps*o,meter:a})}return i}function t_(e,t){let n=new Map(e.notes.map(e=>[e.step,e])),r=e.notes.filter(t).map(e=>e.step),i=[];if(!r.length)i.push(Array.from({length:e.steps},(e,t)=>t));else for(let[t,n]of r.entries()){let a=r[(t+1)%r.length]+(t+1===r.length?e.steps:0);i.push(Array.from({length:a-n-1},(t,r)=>(n+1+r)%e.steps))}let a=e.notes.filter(t);for(let e of i)for(let[t,r]of e.entries()){let i=n.get(e[e.length-1-t]);i&&a.push({...i,step:r})}return a}function n_(e,t){if(!(e>=0&&e<1))throw Error(`varied: draw ${e} is outside [0, 1)`);return Math.floor(e*t)}Object.freeze({filed:Object.freeze([]),points:Object.freeze([]),together:Object.freeze([])});let r_=.1,i_=(e,t,n=r_)=>t>0&&n>0?e-n*.1*Math.log1p(Math.min(t,10))/Math.log1p(10):e,a_=e=>typeof e==`number`&&Number.isFinite(e);function o_(e,t){if(typeof e!=`object`||!e)return[`${t}: not a style point`];let n=Object.entries(e);return n.length?n.flatMap(([e,n])=>a_(n)?[]:[`${t}: ${e} is ${String(n)}, not a number`]):[`${t}: an empty point (no axes)`]}function s_(e){let t=[],{id:n,text:r,association:i}=e;(typeof n!=`string`||!n.trim())&&t.push(`no id`);let a=typeof n==`string`&&n.trim()?n:`(no id)`;return(typeof r!=`string`||!r.trim())&&t.push(`${a}: no text`),!Array.isArray(i)||!i.length?t.push(`${a}: no style point in its association`):i.forEach((e,n)=>t.push(...c_(e,`${a}: point ${n+1}`))),t}function c_(e,t){let n=[];(!e||!a_(e.weight)||e.weight<=0)&&n.push(`${t}: weight ${String(e?.weight)}, not a number > 0`);let r=e?.facet;return r!==void 0&&(typeof r!=`string`||!r.trim())&&n.push(`${t}: facet ${String(r)}, not a name`),n.push(...o_(e?.point,t)),n}function l_(e){let{filed:t,points:n,together:r}=e,i=[];if(!Array.isArray(t))i.push(`the layer: filed is not a list`);else{let e=/* @__PURE__ */ new Set;t.forEach((t,n)=>{let r=`filed ${n+1}`;if(!t?.fragment)return void i.push(`${r}: no fragment`);i.push(...s_(t.fragment).map(e=>`${r}: ${e}`)),(typeof t.meta!=`object`||t.meta===null||Array.isArray(t.meta))&&i.push(`${r}: its meta is not a map`),typeof t.prose!=`string`&&i.push(`${r}: its prose is not a string`),e.has(t.fragment.id)&&i.push(`${r}: the id ${t.fragment.id} is filed twice`),e.add(t.fragment.id)})}if(Array.isArray(n)?n.forEach((e,t)=>{let n=`learned point ${t+1}`;(typeof e?.id!=`string`||!e.id.trim())&&i.push(`${n}: no id`),i.push(...c_(e,n))}):i.push(`the layer: points is not a list`),!Array.isArray(r))i.push(`the layer: together is not a list`);else{let e=/* @__PURE__ */ new Set;r.forEach((t,n)=>{let r=`pair ${n+1}`,a=t?.ids,[o,s]=Array.isArray(a)?a:[];if(!Array.isArray(a)||a.length!==2||typeof o!=`string`||typeof s!=`string`||!o.trim()||!s.trim())return void i.push(`${r}: its ids are not two names`);o<s||i.push(`${r}: its ids ${o} and ${s} are not two, in order`),Number.isInteger(t?.count)&&t.count>0||i.push(`${r}: its count ${String(t?.count)} is not a whole number > 0`);let c=JSON.stringify([o,s]);e.has(c)&&i.push(`${r}: ${o} and ${s} are counted twice`),e.add(c)})}return i}function u_(e,t,n={}){let r=0,i=0;for(let a of Object.keys(e)){if(!Object.hasOwn(t,a))continue;let o=n[a]??1;r+=o*(e[a]-t[a])**2,i+=o}return i>0?Math.sqrt(r/i):1/0}let d_=(e,t)=>t===void 0?e.association:e.association.filter(e=>e.facet===void 0||e.facet===t);function f_(e,t,n={},r){return Math.min(...d_(e,r).map(e=>u_(e.point,t,n)/e.weight))}let p_=(e,t)=>e<t?-1:+(e>t);function m_(e){let t=e.flatMap(s_),n=/* @__PURE__ */ new Set;for(let{id:r}of e)n.has(r)&&t.push(`${r}: the id is given twice`),n.add(r);if(t.length)throw Error(`A malformed repository: ${t.join(`; `)}`);let r=[...e],i=og(),a={fragments:r,filed:/* @__PURE__ */ new Set,together:/* @__PURE__ */ new Map,unheld:[]};function o(e){let t=l_(e);for(let{fragment:r}of Array.isArray(e.filed)?e.filed:[])n.has(r?.id)&&t.push(`the layer files ${r.id}, a seed fragment's id`);if(t.length)throw Error(`A malformed learned layer: ${t.join(`; `)}`);if(!e.filed.length&&!e.points.length&&!e.together.length)return a;let i=new Set(e.filed.map(e=>e.fragment.id)),o=e=>n.has(e)||i.has(e),s=/* @__PURE__ */ new Map,c=/* @__PURE__ */ new Set;for(let{id:t,point:n,weight:r,facet:i}of e.points){if(!o(t)){c.add(t);continue}let e=s.get(t)??[];e.push({point:n,weight:r,...i===void 0?{}:{facet:i}}),s.set(t,e)}let l=e=>{let t=s.get(e.id);return t?{...e,association:[...e.association,...t]}:e},u=/* @__PURE__ */ new Map,d=(e,t,n)=>{let r=u.get(e)??/* @__PURE__ */ new Map;r.set(t,(r.get(t)??0)+n),u.set(e,r)};for(let{ids:t,count:n}of e.together){let[e,r]=t;for(let e of t)o(e)||c.add(e);o(e)&&o(r)&&(d(e,r,n),d(r,e,n))}return{fragments:[...r.map(l),...e.filed.map(e=>l(e.fragment))],filed:i,together:u,unheld:[...c].sort(p_)}}return{fragments:r,merge:o,query(e,t,n={},{facet:r,chosen:s=[],workbench:c,layer:l,pull:u=r_}={}){if(!(Number.isInteger(t)&&t>=0))throw Error(`query: k is ${t}, not a whole number ≥ 0`);if(!(a_(u)&&u>=0))throw Error(`query: pull is ${String(u)}, not a number ≥ 0`);let d=[...Object.entries(e).flatMap(([e,t])=>a_(t)?[]:[`${e} is ${String(t)}`]),...Object.entries(n).flatMap(([e,t])=>a_(t)&&t>0?[]:[`${e}'s weight is ${String(t)}`])];if(d.length)throw Error(`query: ${d.join(`, `)}`);let{fragments:f,filed:p,together:m}=l?o(l):a,h=[...new Set(s)],g=e=>{let t=m.get(e),n=0;if(t)for(let e of h)n+=t.get(e)??0;return n},_=f.filter(e=>d_(e,r).length>0).map(t=>{let i=f_(t,e,n,r);return{fragment:t,distance:i,score:i_(i,g(t.id),u)}}).sort((e,t)=>e.score-t.score||Number(p.has(t.fragment.id))-Number(p.has(e.fragment.id))||p_(e.fragment.id,t.fragment.id));if(c===void 0)return _.slice(0,t);let v=[];for(let e of _){if(v.length>=t)break;i(e.fragment.text,c).fits&&v.push(e)}return v}}}let h_=[`id`,`association`],g_=[`point`,`weight`,`facet`],__=(e,t)=>e.entries.find(e=>e.key===t);function v_(e,t){return e.kind===`list`?e.items.map((e,n)=>{let r=`point ${n+1}`;if(e.kind!==`map`)return t.push({line:e.line,message:`${r} is a map (point, weight, facet)`}),{point:{},weight:0};for(let n of e.entries)g_.includes(n.key)||t.push({line:n.line,message:`${r}: ${n.key} is none of point, weight, facet`});let i={},a=__(e,`point`);if(!a)t.push({line:e.line,message:`${r} has no point`});else if(a.value.kind!==`map`||!a.value.entries.length)t.push({line:a.line,message:`${r}: its point is a map of axes to numbers`});else for(let e of a.value.entries)e.value.kind===`scalar`&&typeof e.value.value==`number`?i[e.key]=e.value.value:t.push({line:e.line,message:`${r}: ${e.key} is ${JSON.stringify(Qs(e.value))}, not a number`});let o=__(e,`weight`),s=o?.value.kind===`scalar`?o.value.value:void 0;typeof s!=`number`&&t.push({line:o?.line??e.line,message:`${r}: ${o?`its weight is ${JSON.stringify(Qs(o.value))}, not a number`:`no weight`}`});let c=__(e,`facet`),l=c?.value.kind===`scalar`?c.value.value:void 0;return c&&typeof l!=`string`&&t.push({line:c.line,message:`${r}: its facet is ${JSON.stringify(Qs(c.value))}, not a name`}),{point:i,weight:typeof s==`number`?s:0,...typeof l==`string`?{facet:l}:{}}}):(t.push({line:e.line,message:"the association is a list of points (`- point: …`)"}),[])}function y_(e){let t=e.split(/\r?\n/);if(t[0]!==`---`)return{problems:[{line:1,message:"no frontmatter: a fragment file starts with a line `---`"}]};let n=Fc(e);if(`problems`in n)return{problems:n.problems.map(e=>/^the frontmatter is a map/.test(e.message)?{...e,message:"the frontmatter is a map (`id: …`, `association: …`)"}:e)};let r=t.indexOf(`---`,1),i=Zs(t.slice(1,r).join(`
`),2).node,a=[],o=__(i,`id`),s=o?.value.kind===`scalar`?o.value.value:void 0;o?typeof s!=`string`&&a.push({line:o.line,message:`the id is ${JSON.stringify(Qs(o.value))}, not a string: quote it`}):a.push({line:1,message:`no id in the frontmatter`});let c=__(i,`association`);c||a.push({line:1,message:`no association in the frontmatter`});let l=c?v_(c.value,a):[];if(a.length)return{problems:a.sort((e,t)=>e.line-t.line)};let u={id:s,text:n.text,association:l},d=s_(u);return d.length?{problems:d.map(e=>{let t=/point (\d+)/.exec(e);return{line:t?c.value.items[Number(t[1])-1].line:/no text/.test(e)?(n.map?.[0]?.line??r+2)-1:o.line,message:e}})}:{fragment:u,meta:Object.fromEntries(Object.entries(n.frontmatter).filter(([e])=>!h_.includes(e))),prose:n.prose,layout:n.layout}}function b_(e){let t=[],n=[],r=/* @__PURE__ */ new Map;for(let[i,a]of Object.entries(e)){let e=y_(a);if(`problems`in e){n.push(...e.problems.map(e=>`${i}:${e.line}: ${e.message}`));continue}let{id:o}=e.fragment,s=r.get(o);s===void 0?r.set(o,i):n.push(`${i}:${a.split(`
`).findIndex(e=>/^id:/.test(e))+1}: the id ${o} is given twice (first in ${s})`),t.push({path:i,...e})}return n.length?{problems:n}:{files:t}}let x_={"bass/01-root-bass":`---
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
&bassline from &harm
&bassline over=&harm step=2n 0 0
\`\`\`

Jambot's bass pattern \`root\`: the root of the chord in force on one and on three, the bar's downbeat and its half (\`bass.ts\` weighs them 1 and 0.6).
Its own lines read the host's \`&harm\` (\`over=&harm\`: each index a tone of the chord sounding) and tap the host's main meter, so it fits any workbench whose \`&bar\` and \`&harm\` are written first; it has no card (#291): it is the part the bass performer plays (\`&bassline\`, decision 058), and the workbench's card sends it.

At the point where the root is all \`bass.ts\` plays: there its blend weighs the pump, the eighths and the funk line 0 (no sync, no energy, legato), so the root's share is 1.
Of the points where it is 1, this is the nearest to Ambient's, the preset where the root's share is greatest (0.68): Ambient's harmony, its sync and energy at 0.
It is also at the three presets where the root is what \`bass.ts\` plays most, as the meters are at theirs (#209): Synth-pop's (0.32, the funk line 0.27), Deep house's (0.31, tied with the funk line, which the root takes as first in \`bass.ts\`'s order) and Ambient's (0.68). A preset plays a blend, and its nearest pattern's point needn't be the pattern it plays most.

What \`bass.ts\` adds that a fixed line doesn't: on three it plays the fifth one section in five and an octave up one in four, by a draw per section and step; it thins the line by the energy (each step sounds when a held draw falls under its weight times 0.55 + 0.6 × energy); the octave, the voice leading and the velocity are the performer's.

**Its signature** (decision 065): \`&bassline from &harm\`. \`&bassline from "root bass" &harm\` takes a copy of it, \`&harm\` its main argument. Taken the old way, \`use &bassline from "root bass"\`, it reads \`&harm\` by name, as before.
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
&bassline from &harm
&bassline over=&harm step=8n ~ 0 ~ 0 ~ 0 ~ 0
\`\`\`

Jambot's bass pattern \`pump\`: the root of the chord in force on the eighth after each beat, and nothing on the beat, not even on a chord change (\`bass.ts\` plays the new root on a change only while the pump weighs under 0.45).
Its own lines read the host's \`&harm\` and tap the host's main meter; it has no card (#291): it is the part the bass performer plays (\`&bassline\`, decision 058), and the workbench's card sends it.

At the one point where the pump's share of \`bass.ts\`'s blend is greatest, 0.74: a static vamp, staccato, no sync (each a factor of the pump: \`(1 − harm) × artic × (1 − sync)\`), and no energy, which would bring in the eighths.
That is Techno's harmony and articulation, its sync and energy at 0.
It is also at Techno's, the preset where the pump is what \`bass.ts\` plays most (0.50), as the meters are at theirs (#209).

What \`bass.ts\` adds that a fixed line doesn't: the fifth one step in five and an octave up one in four, by a draw per section and step; the thinning by the energy (here 0.55: each offbeat sounds about one section in two); the octave, the voice leading and the velocity, the performer's.

**Its signature** (decision 065): \`&bassline from &harm\`. \`&bassline from "pumping bass" &harm\` takes a copy of it, \`&harm\` its main argument. Taken the old way, \`use &bassline from "pumping bass"\`, it reads \`&harm\` by name, as before.
`,"bass/03-eighths-bass":"---\nid: eighths bass\nassociation:\n  - point:\n      sync: 0\n      harm: 0.3\n      artic: 0\n      energy: 1\n    weight: 1\n    facet: bass\nsource: seed\nlifted: yggi/jambot packages/engine/src/bass.ts @ 1037a80\n---\n\n```cells\n&bassline from &harm\n&bassline over=&harm step=8n 0!8\n```\n\nJambot's bass pattern `eight`: the root of the chord in force on every eighth (`bass.ts` weighs the downbeat 1, the bar's half 0.9, the others 0.8).\nIts own lines read the host's `&harm` and tap the host's main meter; it has no card (#291): it is the part the bass performer plays (`&bassline`, decision 058), and the workbench's card sends it.\n\nAt a point where the eighths' share of `bass.ts`'s blend is greatest, 0.63: full energy and no sync (the eighths weigh `0.6 × energy × (1 − funk)`, the funk line weighs the sync), and no pump (legato, or a harmony that moves fully).\nThe eighths are what `bass.ts` plays most at no preset, so unlike the others they sit at no preset's point (#209).\nTechno, the preset where their share is greatest (0.24), is as near two of those points (Techno legato, and Techno with its harmony moving), so it sits at the root bass's point with the energy at 1: there `bass.ts` moves from the root alone to the eighths by the energy alone.\n\nWhat `bass.ts` adds that a fixed line doesn't: the fifth one step in five and an octave up one in four, off the downbeat; the thinning by the energy (here 1.15: each eighth sounds but about one in twelve); the octave, the voice leading and the velocity, the performer's.\n\n**Its signature** (decision 065): `&bassline from &harm`. `&bassline from \"eighths bass\" &harm` takes a copy of it, `&harm` its main argument. Taken the old way, `use &bassline from \"eighths bass\"`, it reads `&harm` by name, as before.\n","bass/04-funk-bass":`---
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

**Its signature** (decision 065): \`&bassline from &harm\`. \`&bassline from "funk bass" &harm\` takes a copy of it, \`&harm\` its main argument. Taken the old way, \`use &bassline from "funk bass"\`, it reads \`&harm\` by name, as before.
`,"bass/05-walking-bass":"---\nid: walking bass\nassociation:\n  - point:\n      sync: 0.35\n      harm: 1\n      artic: 0.3\n      energy: 0.6\n    weight: 1\n    facet: bass\n  - point:\n      sync: 0.55\n      harm: 0.75\n      artic: 0.6\n      energy: 0.75\n    weight: 1\n    facet: bass\nsource: seed\nlifted: yggi/jambot packages/engine/src/bass.ts @ 1037a80\n---\n\n```cells\n&bassline from &harm\n&bassline over=&harm step=4n 0 1 2 &bassNext^$-1\n&bassNext over=&harm[>>] 0\n```\n\nJambot's bass pattern `walk`, a note on every beat: the root of the chord in force on one, its third and its fifth, and on the last beat the next chord's root a semitone below (`&bassNext^$-1`: the next chord's root, `over=&harm[>>]`, moved a step of the grid, a semitone).\nThe semitone can't be an index: over the chord in force an accidental moves a degree of the key, so `0b` over `&harm[>>]` is a semitone only where the key's degree below the next root is one.\nIts own lines read the host's `&harm` and tap the host's main meter; it has no card (#291): it is the part the bass performer plays (`&bassline`, decision 058), and the workbench's card sends it.\n\nAt Swing jazz's point, under its meter swung on `8n` (`4/4 swung on 8n`): `bass.ts` walks only where the meter swings its eighths (`eighthSwing`) and the harmony moves (`harm ≥ 2/3`), and there the walk's share of its blend is the greatest it gets, 0.74, the funk line, the pump and the eighths all 0.\nThe swing is the meter's, not a style axis, so the point says only the harmony.\nSwing jazz is the only preset where the walk is what `bass.ts` plays most, and this point is Swing jazz's (#209); at the presets whose harmony moves but whose meter doesn't swing, the pattern played most is associated there and is found before the walk.\n\nWhat `bass.ts` draws that a fixed line chooses: the second and third beats each the third, the fifth or the seventh (the fifth twice over where the chord has none), a third each, so this line is one walk it plays, up through the chord; the approach from below or above, half each, so this one from below. Under a harmony that changes on the bar's half it leads into that change too. The octave, the voice leading and the velocity are the performer's.\nAlso at the point proposed for an Electro swing preset (#349), weight 1: the walk [Electro swing, in pieces](../../examples/electroswing.md) plays. It is placed by hand, not by `bass.ts`'s blend, which has no such preset.\n\n**Its signature** (decision 065): `&bassline from &harm`. `&bassline from \"walking bass\" &harm` takes a copy of it, `&harm` its main argument. Taken the old way, `use &bassline from \"walking bass\"`, it reads `&harm` by name, as before.\n","bass/06-creeping-bass":`---
id: creeping bass
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

**Its signature** (decision 065): \`&bassline from &harm\`. \`&bassline from "creeping bass" &harm\` takes a copy of it, \`&harm\` its main argument. Taken the old way, \`use &bassline from "creeping bass"\`, it reads \`&harm\` by name, as before.
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
`,"expression/02-envelopes":"---\nid: envelopes\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: expression\nsource: seed\n---\n\n```cells\n&click map=adsr 0 .03 0 .02\n&tap map=adsr 0 .08 0 .04\n&snap map=adsr 0 .12 0 .05\n&thump map=adsr 0 .3 0 .05\n&strike map=adsr .005 .15 .5 .05\n&pluck map=adsr .005 .25 .5 .1\n&swell map=adsr .02 .3 .5 .3\n```\n\nThe shapes a note's level takes, by name (#196): a voice's `env=` (`&hh s=white hpf=8000 env=&click`), each attack, decay, sustain and release in seconds and a level, as `map=adsr` reads them.\nThey are the seven the examples wrote out most, each from its most common spelling:\n- **Struck, nothing held:** `&click` (a hat, a rim, a tick, 30 ms), `&tap` (80 ms), `&snap` (a snare, 120 ms), `&thump` (a kick, 300 ms).\n- **Held:** `&strike` (a stab, struck and held at half), `&pluck` (a plucked string, a quarter second to half), `&swell` (a pad: a soft attack, a long release).\n\nAn envelope near one of them, each value within a fifth of it, became it in the examples (the owner, #196: \"collapse … minimal differences … as long as the 'spirit and style of the piece' is preserved\"); one that is a piece's own, slower, longer or shaped otherwise, stays as the piece writes it.\nThe names are no performer's (`&stab`, `&pad`, `&lead`, `&keys` are role cells, decision 061), so a piece that plays those parts takes these too.\n\nIt defines cells and uses nothing, so it fits any workbench. Associated once, as the facet `expression`, as `vibrato` is: at the centre of style space, at a quarter weight.\n","forms/01-call-and-answer":'---\nid: call and answer\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: form\nsource: seed\n---\n\n```cells\n&phrase from (&answer) &call\n&phrase step=8n &call &answer\n&answer step=8n &call^-2\n```\n\nThe call and its answer: the call, then the call two degrees down, as blues and West African music answer a call, and as Jambot\'s lead lifts a line (an operator on the call, decision 052). Its hole is `&call`; `&answer` is its helper, an operator on the call by default, which a piece overrides by naming it (`use &phrase, &answer from "call and answer"`, decision 059).\nWith a one-bar call it is 2 bars, with a two-bar call 4.\nIt taps the host\'s meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid\'s rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &phrase`), or a piece splices it where it likes.\nAt the centre of style space, as the facet `form`, weight 1: a form fits any style, and a query for one finds them in this order.\n\n**Its signature** (decision 065): `&phrase from (&answer) &call`. `&phrase from "call and answer" &motif` takes a copy of it, `&call` its main argument; `&answer` an optional parameter, its line its default (`"call and answer"(answer=…)`). Taken the old way, `use &phrase from "call and answer"`, it reads `&call` by name, as before.\n',"forms/02-sentence":"---\nid: sentence\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: form\nsource: seed\n---\n\n```cells\n&sentence from (&continuation) &call\n&sentence step=8n &call &call^1 &continuation\n&continuation step=8n inverse(&call) &call[::-1]\n```\n\nCaplin's sentence: a presentation, the idea and the idea moved a degree up, then a continuation as long, here the idea mirrored (`inverse(&call)`) and the idea backwards (`&call[::-1]`), the material broken up as a continuation does. Its hole is `&call`; `&continuation` is its helper, a piece's to override by naming it.\nWith a one-bar call it is 4 bars, with a two-bar call 8.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &sentence`), or a piece splices it where it likes.\nAt the centre of style space, as the facet `form`, weight 1: a form fits any style, and a query for one finds them in this order.\n\n**Its signature** (decision 065): `&sentence from (&continuation) &call`. `&sentence from sentence &motif` takes a copy of it, `&call` its main argument; `&continuation` an optional parameter, its line its default (`sentence(continuation=…)`). Taken the old way, `use &sentence from sentence`, it reads `&call` by name, as before.\n","forms/03-period":"---\nid: period\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: form\nsource: seed\n---\n\n```cells\n&period from (&antecedent, &consequent) &call\n&period step=8n &antecedent &consequent\n&antecedent step=8n &call &call^1\n&consequent step=8n &call &call^-1\n```\n\nA period: an antecedent and a consequent, the same start, a different end. The antecedent ends a degree above the call (open), the consequent a degree below (closed). Its hole is `&call`; `&antecedent` and `&consequent` are its helpers, a piece's to override by naming them.\nWith a one-bar call it is 4 bars, with a two-bar call 8.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &period`), or a piece splices it where it likes.\nAt the centre of style space, as the facet `form`, weight 1: a form fits any style, and a query for one finds them in this order.\n\n**Its signature** (decision 065): `&period from (&antecedent, &consequent) &call`. `&period from period &motif` takes a copy of it, `&call` its main argument; `&antecedent`, `&consequent` optional parameters, their lines their defaults (`period(antecedent=…)`). Taken the old way, `use &period from period`, it reads `&call` by name, as before.\n","forms/04-aaba":"---\nid: AABA\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: form\nsource: seed\n---\n\n```cells\n&chorus from (&b) &a\n&chorus step=8n &a &a &b &a\n&b step=8n &a^3\n```\n\nThe thirty-two-bar song form, AABA, in its letters: an A three times, the bridge before the last. Its holes are `&a`, not `&call`, because an A is often a phrase itself (`&a step=8n &phrase`, the call and answer), and the bridge `&b` is its helper, A moved a fourth up by default, a piece's to override by naming it (`use &chorus, &b from AABA`).\nWith a one-bar A it is 4 bars, with a two-bar A 8.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &chorus`), or a piece splices it where it likes.\nAt the centre of style space, as the facet `form`, weight 1: a form fits any style, and a query for one finds them in this order.\n\n**Its signature** (decision 065): `&chorus from (&b) &a`. `&chorus from AABA &motif` takes a copy of it, `&a` its main argument; `&b` an optional parameter, its line its default (`AABA(b=…)`). Taken the old way, `use &chorus from AABA`, it reads `&a` by name, as before.\n","harmony/01-tonic-vamp":"---\nid: tonic vamp\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.75\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4]!8\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for all eight bars: the vamp `[0]`, a stack of degrees `&key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `&key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `aeolian`, `dorian`.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: aeolian at Techno's point; dorian at Funk's point. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from \"tonic vamp\" &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &harm from \"tonic vamp\"`, it reads `&key` by name, as before.\n","harmony/02-vamp-to-the-seventh":"---\nid: vamp to the seventh\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.75\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4]!4 [6,8,10]!4\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its seventh (degree 6) for four: the vamp `[0, 6]`, a stack of degrees `&key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `&key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `aeolian`, `dorian`, `mixolydian`. No preset of Jambot's is mixolydian, so mixolydian gives it no point of its own.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: aeolian at Techno's point; dorian at Funk's point. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from \"vamp to the seventh\" &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &harm from \"vamp to the seventh\"`, it reads `&key` by name, as before.\n","harmony/03-vamp-to-the-fourth":"---\nid: vamp to the fourth\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.75\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 0.05\n      harm: 0.12\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4]!4 [3,5,7]!4\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its fourth (degree 3) for four: the vamp `[0, 3]`, a stack of degrees `&key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `&key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `aeolian`, `dorian`, `ionian`, `mixolydian`. No preset of Jambot's is mixolydian, so mixolydian gives it no point of its own.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: aeolian at Techno's point; dorian at Funk's point; ionian at Ambient's point with its harmony at 0.12. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from \"vamp to the fourth\" &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &harm from \"vamp to the fourth\"`, it reads `&key` by name, as before.\n","harmony/04-vamp-to-the-sixth":"---\nid: vamp to the sixth\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 0.05\n      harm: 0.12\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4]!4 [5,7,9]!4\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its sixth (degree 5) for four: the vamp `[0, 5]`, a stack of degrees `&key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `&key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `aeolian`, `ionian`.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: aeolian at Techno's point; ionian at Ambient's point with its harmony at 0.12. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from \"vamp to the sixth\" &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &harm from \"vamp to the sixth\"`, it reads `&key` by name, as before.\n","harmony/05-vamp-to-the-fifth":"---\nid: vamp to the fifth\nassociation:\n  - point:\n      sync: 0.05\n      harm: 0.12\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4]!4 [4,6,8]!4\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its fifth (degree 4) for four: the vamp `[0, 4]`, a stack of degrees `&key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `&key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `ionian`.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: ionian at Ambient's point with its harmony at 0.12. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from \"vamp to the fifth\" &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &harm from \"vamp to the fifth\"`, it reads `&key` by name, as before.\n","harmony/06-dark-cadence":`---
id: dark cadence
association:
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.35
    weight: 1
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
Its lap is four bars, not the vamps' eight: Jambot's composer reads only progressions of eight (yggi/jambot \`packages/engine/src/harmony-query.ts\`), so it doesn't take this one yet, and where no harmony is near one of its presets (Synth-pop, Deep house, Lo-fi hip hop, Bossa nova, Swing jazz) it generates its harmony as before, though this is the nearest there.
Written by hand for the point proposed for a Spooky preset (sync .2, harm .9, artic .3, energy .35; #349), weight 1, Jambot's to adopt (decision 041).

**Its signature** (decision 065): \`&harm from &key\`. \`&harm from "dark cadence" &key\` takes a copy of it, \`&key\` its main argument. Taken the old way, \`use &harm from "dark cadence"\`, it reads \`&key\` by name, as before.
`,"instruments/01-gm-kit":`---
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

It defines voices and uses nothing, so it fills the holes a groove leaves (\`&bd &sd &hh\`), fits any workbench, and sounds only what a piece plays through it. Each sound is a first pass in cells' own parameters: a sine dropping in pitch for the drums and toms, filtered noise for the snares, hats and cymbals, a tuned sine or triangle for the hand percussion.
A piece takes the voices it needs by name, so a groove need not bring in 47: \`use &bd, &sd, &hh from gm_kit\`. The drummer takes 13 so (\`drums performer\`); a kit of its own, the core kit, did that before \`use\` could name what it takes, and is retired (#196).

A kit is style-neutral: it is associated once, as the facet \`instrument\`, at the centre of style space (every axis at 0.5), the point nearest the farthest preset, at weight 1, so a query for an instrument finds it first.
`,"instruments/03-bass":`---
id: bass
association:
  - point:
      sync: 0.5
      harm: 0.5
      artic: 0.5
      energy: 0.5
    weight: 0.25
    facet: instrument
source: seed
---

\`\`\`cells
&bassV loop=C2
\`\`\`

The voice the bass lines play through (decision 054, rung 7's first; #244): \`&bassV\`, whose \`loop=C2\` sets the register, so the lines' MIDI notes on Jambot's bass channel are the notes they were when each line carried its own \`&bassV loop=C2\`.
It has no sound of its own (\`s=\`): the lines go out on a MIDI card, which sends notes and not a sound, and says so of a voice that has one; a bass that sounds in a built-in synth comes with a card that plays it.
It defines the one voice the five bass lines read and uses nothing, so it fills their hole on any workbench; the lines no longer carry a voice of their own.

Associated as the kit is, once as the facet \`instrument\` at the centre of style space, at a quarter of its weight, so a query for an instrument finds the kit first; the composer asks for the bass by its id.
`,"instruments/04-keys":"---\nid: keys\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: instrument\nsource: seed\n---\n\n```cells\n&keysV loop=C3\n```\n\nThe voice Jambot's comp plays its stabs through, and any keyboard part: `&keysV`, whose `loop=C3` sets the register, where Jambot's section text sounds its comp (`PIN_VOICES.comp`, yggi/jambot `packages/score/src/section-text.ts` @ 24a528b), so a stab played on it sends the MIDI notes it sends today, with no move on its gate.\nIt has no sound of its own (`s=`), as `bass` has none: the parts go out on a MIDI card, which sends notes and not a sound, and says so of a voice that has one; one that sounds in a built-in synth comes with a card that plays it.\nIts register is its own (decision 058): a performer that plays it higher or lower says so on its gate (`play=&part^$12`).\n\nAssociated as `bass` is, once as the facet `instrument` at the centre of style space, at a quarter of the kit's weight; a performer asks for it by its id.\n","instruments/05-pad":"---\nid: pad\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: instrument\nsource: seed\n---\n\n```cells\n&padV loop=C3\n```\n\nThe voice Jambot's pad plays through: `&padV`, whose `loop=C3` sets the register, where Jambot's section text sounds its comp, pad and stab alike (`PIN_VOICES.comp`, yggi/jambot `packages/score/src/section-text.ts` @ 24a528b), so a pad played on it sends the MIDI notes it sends today, with no move on its gate. It is a voice of its own beside `keys`, though the two sit at one register, so a sound given to one (a pad's slow attack) isn't the other's.\nIt has no sound of its own (`s=`), as `bass` has none: the parts go out on a MIDI card, which sends notes and not a sound, and says so of a voice that has one; one that sounds in a built-in synth comes with a card that plays it.\nIts register is its own (decision 058): a performer that plays it higher or lower says so on its gate (`play=&part^$12`).\n\nAssociated as `bass` is, once as the facet `instrument` at the centre of style space, at a quarter of the kit's weight; a performer asks for it by its id.\n","instruments/06-lead":"---\nid: lead\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 0.25\n    facet: instrument\nsource: seed\n---\n\n```cells\n&leadV loop=C4\n```\n\nThe voice Jambot's lead plays through: `&leadV`, whose `loop=C4` sets the register, where Jambot's section text sounds its lead (`PIN_VOICES.lead`, E35's C4: yggi/jambot `packages/score/src/section-text.ts` @ 24a528b), so a lead played on it sends the MIDI notes it sends today, with no move on its gate.\nIt has no sound of its own (`s=`), as `bass` has none: the parts go out on a MIDI card, which sends notes and not a sound, and says so of a voice that has one; one that sounds in a built-in synth comes with a card that plays it.\nIts register is its own (decision 058): a performer that plays it higher or lower says so on its gate (`play=&part^$12`).\n\nAssociated as `bass` is, once as the facet `instrument` at the centre of style space, at a quarter of the kit's weight; a performer asks for it by its id.\n","instruments/07-upright-bass":`---
id: upright bass
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
It defines \`&bassV\`, the voice the bass performer plays (\`use &bassV from bass\`), so it fills the same hole as the default \`bass\` and can stand in for it.
It is [Electro swing, in pieces](../../examples/electroswing.md)'s \`&bassV\` but for its register: \`loop=C2\`, the default instrument's, so a bass line played on it sends the MIDI notes it sends on \`bass\` (the example's \`loop=C3\` is the piece's own).
It sounds within the renderer's first stage (decision 062, R1): a wave, a low-pass filter and an envelope.

Associated at Electro swing's point (\`ELECTRO_SWING\`: sync .55, harm .75, artic .6, energy .75; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/08-brass-stab":`---
id: brass stab
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
id: muted trumpet
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
id: round bass
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
`,"instruments/14-celesta":"---\nid: celesta\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.35\n    weight: 0.125\n    facet: instrument\nsource: seed\nlifted: yggi/cells examples/spooky.md @ 6d1bfa7\n---\n\n```cells\n&keysV s=sine loop=C3 env=&(map=adsr .002 .7 0 .5)\n```\n\nSpooky's bell, a celesta's struck tone: a sine that starts at once and dies away over most of a second with nothing held, the music box in the attic.\nIt defines `&keysV`, the voice the stab performer plays (`use &keysV from keys`), so it fills the same hole as the default `keys`.\nIt is [Spooky, in pieces](../../examples/spooky.md)'s `&keysV` but for its register: `loop=C3`, the default instrument's, so a stab played on it sends the MIDI notes it sends on `keys`. The example plays it at `loop=C5`, where a celesta sits; a player who wants it there says so on its gate (`play=&stabline^$24`, decision 058).\nIt sounds within the renderer's first stage (decision 062, R1).\n\nAssociated at Spooky's point (`SPOOKY`: sync .2, harm .9, artic .3, energy .35; yggi/jambot#517) as the facet `instrument`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).\n","meters/01-4-4":`---
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
&bar from &tempo
&bar meter("4/4") step=&tempo
\`\`\`

Straight 4/4, at the points of the three presets that play straight: Synth-pop's, Techno's and Bossa nova's (yggi/jambot#360).
Its tempo is the text's: \`step=&tempo\` reads a cell the text that uses it writes, a rate alone (\`&tempo step=104bpm\`, #290).

**Its signature** (decision 065): \`&bar from &tempo\`. \`&bar from "4/4" 120bpm\` takes a copy of it, \`&tempo\` its main argument. Taken the old way, \`use &bar from "4/4"\`, it reads \`&tempo\` by name, as before.
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
  - point:
      sync: 0.55
      harm: 0.75
      artic: 0.6
      energy: 0.75
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar from (&swing) &tempo
&bar meter("4/4") step=&tempo swing=&swing
&swing swing=8n:2/3
\`\`\`

Jambot's swing 1: the triplet swing, 2/3, on the eighths; the sixteenths straight. At Swing jazz's point. A meter swung on \`8n\` brings in Jambot's jazz kit (yggi/jambot#360).
Its tempo is the text's: \`step=&tempo\` reads a cell the text that uses it writes, a rate alone (\`&tempo step=104bpm\`, #290).
Its swing is its own, \`&swing swing=8n:2/3\`, a cell that is a swing alone (#308), which the meter reads (\`swing=&swing\`): a helper \`use &bar from …\` takes with it, and a text that swings otherwise names it to override it (\`use &bar, &swing from …\` and its own \`&swing swing=8n:free(.64, .5..0.75)\`, decision 059).
Also at the point proposed for an Electro swing preset (sync .55, harm .75, artic .6, energy .75; #349), weight 1: the meter [Electro swing, in pieces](../../examples/electroswing.md) plays, there with its own lighter swing, .64. Without it a query there finds 10/8.

**Its signature** (decision 065): \`&bar from (&swing) &tempo\`. \`&bar from "4/4 swung on 8n" 120bpm\` takes a copy of it, \`&tempo\` its main argument; \`&swing\` an optional parameter, its line its default (\`"4/4 swung on 8n"(swing=…)\`). Taken the old way, \`use &bar from "4/4 swung on 8n"\`, it reads \`&tempo\` by name, as before.
`,"meters/03-4-4-leaning-on-16n":'---\nid: 4/4 leaning on 16n\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.75\n      artic: 0.35\n      energy: 0.5\n    weight: 1\n    facet: meter\nsource: seed\n---\n\n```cells\n&bar from (&swing) &tempo\n&bar meter("4/4") step=&tempo swing=&swing\n&swing swing=16n:.65\n```\n\nJambot\'s swing .45: the sixteenths\' heaviest lean of the presets. At Lo-fi hip hop\'s point.\nIts tempo is the text\'s: `step=&tempo` reads a cell the text that uses it writes, a rate alone (`&tempo step=104bpm`, #290).\nIts swing is its own, `&swing swing=16n:.65`, a cell that is a swing alone (#308), which the meter reads (`swing=&swing`): a helper `use &bar from …` takes with it, and a text that swings otherwise names it to override it (`use &bar, &swing from …` and its own `&swing swing=8n:free(.64, .5..0.75)`, decision 059).\n\n**Its signature** (decision 065): `&bar from (&swing) &tempo`. `&bar from "4/4 leaning on 16n" 120bpm` takes a copy of it, `&tempo` its main argument; `&swing` an optional parameter, its line its default (`"4/4 leaning on 16n"(swing=…)`). Taken the old way, `use &bar from "4/4 leaning on 16n"`, it reads `&tempo` by name, as before.\n',"meters/04-4-4-leaning-lightly-on-16n":`---
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
&bar from (&swing) &tempo
&bar meter("4/4") step=&tempo swing=&swing
&swing swing=16n:.6
\`\`\`

Jambot's swing .3. At Deep house's and Funk's points, whose swing is the same.
Its tempo is the text's: \`step=&tempo\` reads a cell the text that uses it writes, a rate alone (\`&tempo step=104bpm\`, #290).
Its swing is its own, \`&swing swing=16n:.6\`, a cell that is a swing alone (#308), which the meter reads (\`swing=&swing\`): a helper \`use &bar from …\` takes with it, and a text that swings otherwise names it to override it (\`use &bar, &swing from …\` and its own \`&swing swing=8n:free(.64, .5..0.75)\`, decision 059).

**Its signature** (decision 065): \`&bar from (&swing) &tempo\`. \`&bar from "4/4 leaning lightly on 16n" 120bpm\` takes a copy of it, \`&tempo\` its main argument; \`&swing\` an optional parameter, its line its default (\`"4/4 leaning lightly on 16n"(swing=…)\`). Taken the old way, \`use &bar from "4/4 leaning lightly on 16n"\`, it reads \`&tempo\` by name, as before.
`,"meters/05-4-4-leaning-faintly-on-16n":'---\nid: 4/4 leaning faintly on 16n\nassociation:\n  - point:\n      sync: 0.05\n      harm: 0.3\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: meter\nsource: seed\n---\n\n```cells\n&bar from (&swing) &tempo\n&bar meter("4/4") step=&tempo swing=&swing\n&swing swing=16n:31/60\n```\n\nJambot\'s swing .05: 31/60, an onset a thirtieth of a sixteenth late. At Ambient\'s point.\nIts tempo is the text\'s: `step=&tempo` reads a cell the text that uses it writes, a rate alone (`&tempo step=104bpm`, #290).\nIts swing is its own, `&swing swing=16n:31/60`, a cell that is a swing alone (#308), which the meter reads (`swing=&swing`): a helper `use &bar from …` takes with it, and a text that swings otherwise names it to override it (`use &bar, &swing from …` and its own `&swing swing=8n:free(.64, .5..0.75)`, decision 059).\n\n**Its signature** (decision 065): `&bar from (&swing) &tempo`. `&bar from "4/4 leaning faintly on 16n" 120bpm` takes a copy of it, `&tempo` its main argument; `&swing` an optional parameter, its line its default (`"4/4 leaning faintly on 16n"(swing=…)`). Taken the old way, `use &bar from "4/4 leaning faintly on 16n"`, it reads `&tempo` by name, as before.\n',"meters/06-4-4-alla-breve":`---
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
&bar from &tempo
&bar meter("4/4") step=&tempo beat=2
\`\`\`

Alla breve: the bpm counts half notes; fast, bright, marching.
Its tempo is the text's: \`step=&tempo\` reads a cell the text that uses it writes, a rate alone (\`&tempo step=104bpm\`, #290).

**Its signature** (decision 065): \`&bar from &tempo\`. \`&bar from "4/4 alla breve" 120bpm\` takes a copy of it, \`&tempo\` its main argument. Taken the old way, \`use &bar from "4/4 alla breve"\`, it reads \`&tempo\` by name, as before.
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
&bar from &tempo
&bar meter("2/4") step=&tempo
\`\`\`

A march, a polka: on the beat, plain, short and dense.
Its tempo is the text's: \`step=&tempo\` reads a cell the text that uses it writes, a rate alone (\`&tempo step=104bpm\`, #290).

**Its signature** (decision 065): \`&bar from &tempo\`. \`&bar from "2/4" 120bpm\` takes a copy of it, \`&tempo\` its main argument. Taken the old way, \`use &bar from "2/4"\`, it reads \`&tempo\` by name, as before.
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
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.43
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar from &tempo
&bar meter("3/4") step=&tempo
\`\`\`

A waltz, a ballad: on the beat, rich, sparse.
Its tempo is the text's: \`step=&tempo\` reads a cell the text that uses it writes, a rate alone (\`&tempo step=104bpm\`, #290).
Also near the point proposed for a Spooky preset (#349), 0.08 above it in energy, weight 1: the dance of the dead, a waltz, which the ladder fetches near \`5/4\`.

**Its signature** (decision 065): \`&bar from &tempo\`. \`&bar from "3/4" 120bpm\` takes a copy of it, \`&tempo\` its main argument. Taken the old way, \`use &bar from "3/4"\`, it reads \`&tempo\` by name, as before.
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
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.27
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar from &tempo
&bar meter("6/8") step=&tempo
\`\`\`

A lilt: plain and sparse.
Its tempo is the text's: \`step=&tempo\` reads a cell the text that uses it writes, a rate alone (\`&tempo step=104bpm\`, #290).
Also near the point proposed for a Spooky preset (#349), 0.08 below it in energy, weight 1: the slow lilt of a lullaby gone wrong, which the ladder fetches near \`5/4\`.

**Its signature** (decision 065): \`&bar from &tempo\`. \`&bar from "6/8" 120bpm\` takes a copy of it, \`&tempo\` its main argument. Taken the old way, \`use &bar from "6/8"\`, it reads \`&tempo\` by name, as before.
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
&bar from &tempo
&bar meter("12/8") step=&tempo
\`\`\`

A slow blues, a soul ballad: legato, off the beat.
Its tempo is the text's: \`step=&tempo\` reads a cell the text that uses it writes, a rate alone (\`&tempo step=104bpm\`, #290).

**Its signature** (decision 065): \`&bar from &tempo\`. \`&bar from "12/8" 120bpm\` takes a copy of it, \`&tempo\` its main argument. Taken the old way, \`use &bar from "12/8"\`, it reads \`&tempo\` by name, as before.
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
  - point:
      sync: 0.2
      harm: 0.9
      artic: 0.3
      energy: 0.35
    weight: 1
    facet: meter
source: seed
---

\`\`\`cells
&bar from &tempo
&bar meter("5/4") step=&tempo
\`\`\`

Cool jazz: rich, unhurried.
Its tempo is the text's: \`step=&tempo\` reads a cell the text that uses it writes, a rate alone (\`&tempo step=104bpm\`, #290).
Also at the point proposed for a Spooky preset (sync .2, harm .9, artic .3, energy .35; #349), weight 1: the meter of [Spooky, in pieces](../../examples/spooky.md), five beats that never settle, as a horror film's theme counts them. \`6/8\` and \`3/4\` sit near it (0.08 off, less and more energy), for the ladder to fetch.

**Its signature** (decision 065): \`&bar from &tempo\`. \`&bar from "5/4" 120bpm\` takes a copy of it, \`&tempo\` its main argument. Taken the old way, \`use &bar from "5/4"\`, it reads \`&tempo\` by name, as before.
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
&bar from &tempo
&bar meter("7/8") step=&tempo
\`\`\`

3+2+2, a Balkan dance: off the beat, short and dense.
Its tempo is the text's: \`step=&tempo\` reads a cell the text that uses it writes, a rate alone (\`&tempo step=104bpm\`, #290).

**Its signature** (decision 065): \`&bar from &tempo\`. \`&bar from "7/8" 120bpm\` takes a copy of it, \`&tempo\` its main argument. Taken the old way, \`use &bar from "7/8"\`, it reads \`&tempo\` by name, as before.
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
&bar from &tempo
&bar meter("10/8") step=&tempo
\`\`\`

3+2+3+2.
Its tempo is the text's: \`step=&tempo\` reads a cell the text that uses it writes, a rate alone (\`&tempo step=104bpm\`, #290).

**Its signature** (decision 065): \`&bar from &tempo\`. \`&bar from "10/8" 120bpm\` takes a copy of it, \`&tempo\` its main argument. Taken the old way, \`use &bar from "10/8"\`, it reads \`&tempo\` by name, as before.
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
&key from &tonic
&key scale(aeolian, &tonic)
\`\`\`

The natural minor: the key Jambot's composer plays at Synth-pop's, Techno's and Lo-fi hip hop's points (\`PRESETS\`' \`mode\`, yggi/jambot packages/engine/src/style.ts), and the mode it opens in (\`INITIAL_KEY\`, A aeolian).
It defines \`&key\`, the key (decision 047's interface name, decision 056, named since decision 060), and uses \`&tonic\`, a cell holding the key's tonic (\`&tonic D\`, #290), so it fits any workbench that has no key yet and gives the tonic; the harmonies and the bass lines read it (\`over=&key\`, then \`over=&harm\`).
The tonic is left to the text that uses it, a hole: there is no default, since a default tonic plays a wrong key silently (#117); the performer's room, \`free(…)\`, is the tonic cell's to give (\`&tonic free(…)\`, not yet a form).

At the point of each preset that plays it, weight 1, so a query for the mode at one of them finds aeolian first, at distance 0.

**Its signature** (decision 065): \`&key from &tonic\`. \`&key from aeolian D\` takes a copy of it, \`&tonic\` its main argument. Taken the old way, \`use &key from aeolian\`, it reads \`&tonic\` by name, as before.
`,"modes/02-dorian":"---\nid: dorian\nassociation:\n  - point:\n      sync: 0.35\n      harm: 0.55\n      artic: 0.65\n      energy: 0.65\n    weight: 1\n    facet: mode\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.75\n    weight: 1\n    facet: mode\nsource: seed\n---\n\n```cells\n&key from &tonic\n&key scale(dorian, &tonic)\n```\n\nThe minor with a major sixth: the key Jambot's composer plays at Deep house's and Funk's points (`PRESETS`' `mode`, yggi/jambot packages/engine/src/style.ts).\nIt defines `&key`, the key (decision 047's interface name, decision 056, named since decision 060), and uses `&tonic`, a cell holding the key's tonic (`&tonic D`, #290), so it fits any workbench that has no key yet and gives the tonic; the harmonies and the bass lines read it (`over=&key`, then `over=&harm`).\nThe tonic is left to the text that uses it, a hole: there is no default, since a default tonic plays a wrong key silently (#117); the performer's room, `free(…)`, is the tonic cell's to give (`&tonic free(…)`, not yet a form).\n\nAt the point of each preset that plays it, weight 1, so a query for the mode at one of them finds dorian first, at distance 0.\n\n**Its signature** (decision 065): `&key from &tonic`. `&key from dorian D` takes a copy of it, `&tonic` its main argument. Taken the old way, `use &key from dorian`, it reads `&tonic` by name, as before.\n","modes/03-ionian":`---
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
&key from &tonic
&key scale(ionian, &tonic)
\`\`\`

The major: the key Jambot's composer plays at Ambient's, Bossa nova's and Swing jazz's points (\`PRESETS\`' \`mode\`, yggi/jambot packages/engine/src/style.ts).
It defines \`&key\`, the key (decision 047's interface name, decision 056, named since decision 060), and uses \`&tonic\`, a cell holding the key's tonic (\`&tonic D\`, #290), so it fits any workbench that has no key yet and gives the tonic; the harmonies and the bass lines read it (\`over=&key\`, then \`over=&harm\`).
The tonic is left to the text that uses it, a hole: there is no default, since a default tonic plays a wrong key silently (#117); the performer's room, \`free(…)\`, is the tonic cell's to give (\`&tonic free(…)\`, not yet a form).

At the point of each preset that plays it, weight 1, so a query for the mode at one of them finds ionian first, at distance 0.
The bell and scale (\`05-bell-and-scale.md\`) is ionian too, elsewhere.

**Its signature** (decision 065): \`&key from &tonic\`. \`&key from ionian D\` takes a copy of it, \`&tonic\` its main argument. Taken the old way, \`use &key from ionian\`, it reads \`&tonic\` by name, as before.
`,"modes/04-mixolydian":"---\nid: mixolydian\nassociation:\n  - point:\n      sync: 0.875\n      harm: 0.485\n      artic: 0.65\n      energy: 0.6\n    weight: 1\n    facet: mode\nsource: seed\n---\n\n```cells\n&key from &tonic\n&key scale(mixolydian, &tonic)\n```\n\nThe major with a minor seventh: the fourth of the composer's modes (`COMPOSER_MODES`, yggi/jambot packages/engine/src/key.ts), which no preset plays.\nIt defines `&key`, the key (decision 047's interface name, decision 056, named since decision 060), and uses `&tonic`, a cell holding the key's tonic (`&tonic D`, #290), so it fits any workbench that has no key yet and gives the tonic; the harmonies and the bass lines read it (`over=&key`, then `over=&harm`).\nThe tonic is left to the text that uses it, a hole: there is no default, since a default tonic plays a wrong key silently (#117); the performer's room, `free(…)`, is the tonic cell's to give (`&tonic free(…)`, not yet a form).\n\nBetween the major and the dorian minor (it shares the major's third and the dorian's seventh), it sits halfway between Funk's point (dorian) and Bossa nova's (ionian), where the son clave 3-2 sits too: the funk and rock of a major key with a flat seventh. It is the nearest mode there only, since each preset's own mode is at distance 0 at its point.\n\n**Its signature** (decision 065): `&key from &tonic`. `&key from mixolydian D` takes a copy of it, `&tonic` its main argument. Taken the old way, `use &key from mixolydian`, it reads `&tonic` by name, as before.\n","modes/05-bell-and-scale":`---
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
&key, &bell, &agogo from &tonic
&key scale(ionian, &tonic) step=1m*7
&bell step=&key:pulse &highagogo &highagogo:0:.5 &highagogo:0:.7 &highagogo:0:.5 &highagogo:0:.6 &highagogo:0:.5 &highagogo:0:.7
&agogo [&bell * .5]
\`\`\`

The West African standard bell pattern, x.x.xx.x.x.x, seven strokes over twelve pulses, has the major scale's intervals, 2 2 1 2 2 2 1 (the example \`bell and scale\`).
So one cell is both: \`&key\` is the major scale, the piece's main key, and stepped seven times a bar, each step as long as its interval, it is the bell's timeline, which \`&bell\` strikes (\`step=&key:pulse\`).
The repository's first fragment of two facets, a \`mode\`, ionian, and a \`rhythm\`, the bell, each at a place of its own: "the bell is a world-music associated rhythm-facet and a western music associated harmony / scale-facet" (the owner, decision 046).

A stepped key that nothing plays doesn't turn, so a line over it (\`over=&key\`) reads the major scale as \`&key scale(ionian, &tonic)\` does, note for note; the tonic is left to the text that uses it, \`&tonic\`, as the mode fragments leave it (#290).
\`step=1m*7\` lays the bell over the bar of any meter, as twelve twelfths: over 12/8 they are its pulses, the bell as it is played.

Seven strokes of a high agogô (\`&highagogo\`, General MIDI's 67, a hole the General MIDI kit fills with its line), the example's accents, at half the level; its mix, \`&agogo\` (the level, no card: where its notes go is the workbench's, #291), is none of the drum bars' or the claves', so it layers on any of them.
As a rhythm its point is a timeline's: off the beat (sync 0.8), over one static chord (harm 0.1), struck (artic 0.9), steady and fairly dense (energy 0.6), where no preset is.
As a mode it is where the major is played: the centroid of the three presets that play ionian, Ambient's, Bossa nova's and Swing jazz's (each axis their mean, to three decimals), where no preset is, so at each of them the plain \`ionian\` is found first, at distance 0.

**Its signature** (decision 065): \`&key, &bell, &agogo from &tonic\`. \`&key, &bell, &agogo from "bell and scale" D\` takes a copy of it, \`&tonic\` its main argument. Taken the old way, \`use &key, &bell, &agogo from "bell and scale"\`, it reads \`&tonic\` by name, as before.
`,"modes/06-harmonic-minor":`---
id: harmonic minor
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

**Its signature** (decision 065): \`&key from &tonic\`. \`&key from "harmonic minor" D\` takes a copy of it, \`&tonic\` its main argument. Taken the old way, \`use &key from "harmonic minor"\`, it reads \`&tonic\` by name, as before.
`,"modes/07-phrygian":`---
id: phrygian
association:
  - point:
      sync: 0.6
      harm: 0.6
      artic: 0.7
      energy: 0.85
    weight: 1
    facet: mode
source: seed
---

\`\`\`cells
&key from &tonic
&key scale(phrygian, &tonic)
\`\`\`

The minor with a minor second: the flamenco's and metal's mode, its ♭II a semitone above the tonic, a cadence that falls onto it (♭II–i).
It defines \`&key\`, the key (decision 047's interface name, decision 056, named since decision 060), and uses \`&tonic\`, a cell holding the key's tonic (\`&tonic E\`, #290), so it fits any workbench that has no key yet and gives the tonic; the harmonies and the bass lines read it (\`over=&key\`, then \`over=&harm\`).
The tonic is left to the text that uses it, a hole, as the other modes leave theirs.

No preset of Jambot's plays it yet (the owner, 2026-10-29: "jambot should be able to play all 7 modes. they should all be fragments", yggi/jambot#516). Placed by hand where it is heard, dark and driven: off the beat, rich, clipped and loud (sync .6, harm .6, artic .7, energy .85), weight 1.

**Its signature** (decision 065): \`&key from &tonic\`. \`&key from phrygian D\` takes a copy of it, \`&tonic\` its main argument. Taken the old way, \`use &key from phrygian\`, it reads \`&tonic\` by name, as before.
`,"modes/08-lydian":"---\nid: lydian\nassociation:\n  - point:\n      sync: 0.15\n      harm: 0.6\n      artic: 0.15\n      energy: 0.3\n    weight: 1\n    facet: mode\nsource: seed\n---\n\n```cells\n&key from &tonic\n&key scale(lydian, &tonic)\n```\n\nThe major with a raised fourth: film music's and dream pop's mode, bright and floating, its II a major chord a whole tone above the tonic.\nIt defines `&key`, the key (decision 047's interface name, decision 056, named since decision 060), and uses `&tonic`, a cell holding the key's tonic (`&tonic E`, #290), so it fits any workbench that has no key yet and gives the tonic; the harmonies and the bass lines read it (`over=&key`, then `over=&harm`).\nThe tonic is left to the text that uses it, a hole, as the other modes leave theirs.\n\nNo preset of Jambot's plays it yet (yggi/jambot#516). Placed by hand where it is heard, floating: on the beat, rich, legato and quiet (sync .15, harm .6, artic .15, energy .3), weight 1.\n\n**Its signature** (decision 065): `&key from &tonic`. `&key from lydian D` takes a copy of it, `&tonic` its main argument. Taken the old way, `use &key from lydian`, it reads `&tonic` by name, as before.\n","modes/09-locrian":"---\nid: locrian\nassociation:\n  - point:\n      sync: 0.9\n      harm: 1\n      artic: 0.6\n      energy: 0.9\n    weight: 1\n    facet: mode\nsource: seed\n---\n\n```cells\n&key from &tonic\n&key scale(locrian, &tonic)\n```\n\nThe mode whose tonic is a diminished chord, its fifth flattened: the least settled of the seven, heard in metal's riffs and in jazz over a half-diminished chord.\nIt defines `&key`, the key (decision 047's interface name, decision 056, named since decision 060), and uses `&tonic`, a cell holding the key's tonic (`&tonic E`, #290), so it fits any workbench that has no key yet and gives the tonic; the harmonies and the bass lines read it (`over=&key`, then `over=&harm`).\nThe tonic is left to the text that uses it, a hole, as the other modes leave theirs.\n\nNo preset of Jambot's plays it yet (yggi/jambot#516). Placed by hand at an edge of the space, frantic: off the beat, the harmony at its richest, clipped and loud (sync .9, harm 1, artic .6, energy .9), weight 1, so no preset's neighbourhood finds it before its own mode.\n\n**Its signature** (decision 065): `&key from &tonic`. `&key from locrian D` takes a copy of it, `&tonic` its main argument. Taken the old way, `use &key from locrian`, it reads `&tonic` by name, as before.\n","motifs/01-hook":"---\nid: hook\nassociation:\n  - point:\n      sync: 0.3\n      harm: 0.45\n      artic: 0.55\n      energy: 0.55\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&hook from &key\n&hook over=&key step=8n 4 4 3 2@2 ~ 0 2\n```\n\nA pop hook: the fifth twice, stepping down to the third and held, a breath, then the tonic and up a step, so it asks to come round again. Written by hand for Synth-pop's minor (aeolian), its sung, fairly short notes.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&hook`), so `use &hook` takes it; a form reads it as its `&call` (`&call step=8n &hook`), the line the form moves and answers.\n\nAt Synth-pop's point (`presets.ts`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&hook from &key`. `&hook from hook &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &hook from hook`, it reads `&key` by name, as before.\n","motifs/02-octaves":"---\nid: octaves\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.8\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&octaves from &key\n&octaves over=&key step=8n 0 ~ 7 ~ 0 0 ~ 7\n```\n\nThe tonic and its octave, struck short on and off the beat: the line a techno track rides a filter over, its pitch all in two notes. Written by hand for Techno, where the harmony stands still and every note is staccato.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&octaves`), so `use &octaves` takes it; a form reads it as its `&call` (`&call step=8n &octaves`), the line the form moves and answers.\n\nAt Techno's point (`presets.ts`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&octaves from &key`. `&octaves from octaves &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &octaves from octaves`, it reads `&key` by name, as before.\n","motifs/03-sigh":"---\nid: sigh\nassociation:\n  - point:\n      sync: 0.35\n      harm: 0.55\n      artic: 0.65\n      energy: 0.65\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&sigh from &key\n&sigh over=&key step=8n 4@3 3 2@2 ~ ~\n```\n\nA sigh: the fifth held, falling by step to the third and held again, then two beats of air. Written by hand for Deep house's dorian, a vocal hook's shape over a vamp.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&sigh`), so `use &sigh` takes it; a form reads it as its `&call` (`&call step=8n &sigh`), the line the form moves and answers.\n\nAt Deep house's point (`presets.ts`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&sigh from &key`. `&sigh from sigh &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &sigh from sigh`, it reads `&key` by name, as before.\n","motifs/04-rising":"---\nid: rising\nassociation:\n  - point:\n      sync: 0.05\n      harm: 0.3\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&rising from &key\n&rising over=&key step=8n 0@2 2@2 4@4\n```\n\nThe triad rising slowly, tonic, third, fifth, the last held half the bar: the owner's own example of a motif's name (#288). Written by hand for Ambient, legato and sparse.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&rising`), so `use &rising` takes it; a form reads it as its `&call` (`&call step=8n &rising`), the line the form moves and answers.\n\nAt Ambient's point (`presets.ts`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&rising from &key`. `&rising from rising &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &rising from rising`, it reads `&key` by name, as before.\n","motifs/05-lazy":"---\nid: lazy\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.75\n      artic: 0.35\n      energy: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&lazy from &key\n&lazy over=&key step=8n ~ 2 4 ~ 3@2 2 0\n```\n\nLate in, up to the fifth, then down by step to the tonic, the fourth held: a lazy line behind the beat. Written by hand for Lo-fi hip hop's minor, its swung eighths.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&lazy`), so `use &lazy` takes it; a form reads it as its `&call` (`&call step=8n &lazy`), the line the form moves and answers.\n\nAt Lo-fi hip hop's point (`presets.ts`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&lazy from &key`. `&lazy from lazy &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &lazy from lazy`, it reads `&key` by name, as before.\n","motifs/06-riff":"---\nid: riff\nassociation:\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.75\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&riff from &key\n&riff over=&key step=8n 0 ~ 3 0 ~ 4 3 ~\n```\n\nA funk riff: the tonic, the fourth and the fifth, all off and on the beat in short strokes. Written by hand for Funk's dorian, at its most syncopated and staccato.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&riff`), so `use &riff` takes it; a form reads it as its `&call` (`&call step=8n &riff`), the line the form moves and answers.\n\nAt Funk's point (`presets.ts`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&riff from &key`. `&riff from riff &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &riff from riff`, it reads `&key` by name, as before.\n","motifs/07-tresillo":"---\nid: tresillo\nassociation:\n  - point:\n      sync: 0.75\n      harm: 0.85\n      artic: 0.45\n      energy: 0.45\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&tresillo from &key\n&tresillo over=&key step=8n 4@3 2@3 0@2\n```\n\nThe fifth, the third and the tonic falling on the tresillo's 3 + 3 + 2. Written by hand for Bossa nova, its melody on the clave's long-long-short.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&tresillo`), so `use &tresillo` takes it; a form reads it as its `&call` (`&call step=8n &tresillo`), the line the form moves and answers.\n\nAt Bossa nova's point (`presets.ts`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&tresillo from &key`. `&tresillo from tresillo &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &tresillo from tresillo`, it reads `&key` by name, as before.\n","motifs/08-bebop":"---\nid: bebop\nassociation:\n  - point:\n      sync: 0.35\n      harm: 1\n      artic: 0.3\n      energy: 0.6\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&bebop from &key\n&bebop over=&key step=8n 0 2 4 6 7@2 6 4\n```\n\nUp the seventh chord to the octave, held, and back down through the seventh: a bebop arpeggio. Written by hand for Swing jazz, where the harmony moves most.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&bebop`), so `use &bebop` takes it; a form reads it as its `&call` (`&call step=8n &bebop`), the line the form moves and answers.\n\nAt Swing jazz's point (`presets.ts`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&bebop from &key`. `&bebop from bebop &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &bebop from bebop`, it reads `&key` by name, as before.\n","motifs/09-gypsy":"---\nid: gypsy\nassociation:\n  - point:\n      sync: 0.55\n      harm: 0.75\n      artic: 0.6\n      energy: 0.75\n    weight: 1\n    facet: motif\nsource: seed\nlifted: yggi/cells examples/electroswing.md @ 7622a87\n---\n\n```cells\n&gypsy from &key\n&gypsy over=&key step=8n 4 5 6 7@2 6 4@2\n```\n\nThe clarinet's call of [Electro swing, in pieces](../../examples/electroswing.md): A B♭ C♯ D and back to A in D harmonic minor, the fifth climbing through the minor sixth and the leading note to the octave, gypsy jazz's run.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&gypsy`), so `use &gypsy` takes it; a form reads it as its `&call` (`&call step=8n &gypsy`), the line the form moves and answers.\n\nAt the point proposed for an Electro swing preset (sync 0.55, harm 0.75, artic 0.6, energy 0.75), as the example's other seeds are: Jambot's to adopt (decision 041).\n\n**Its signature** (decision 065): `&gypsy from &key`. `&gypsy from gypsy &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &gypsy from gypsy`, it reads `&key` by name, as before.\n","motifs/10-dies-irae":"---\nid: diesIrae\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.35\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&diesIrae from &key\n&diesIrae over=&key step=8n 2 1 2 0 1 -1 0@2\n```\n\nThe head of the *Dies irae*, the plainchant of the day of wrath, which Berlioz, Liszt, Saint-Saëns and a century of horror films quote: the third, the second, the third, the tonic, the second, the note below the tonic, and the tonic held (F E F D E C D in D minor; C♯ in harmonic minor, which makes it darker still). The chant is in the public domain.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&diesIrae`), so `use &diesIrae` takes it; a form reads it as its `&call` (`&call step=8n &diesIrae`), the line the form moves and answers.\nAt the point proposed for a Spooky preset (sync .2, harm .9, artic .3, energy .35; #349), weight 1, Jambot's to adopt (decision 041).\n\n**Its signature** (decision 065): `&diesIrae from &key`. `&diesIrae from diesIrae &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &diesIrae from diesIrae`, it reads `&key` by name, as before.\n","motifs/11-refrain":"---\nid: refrain\nassociation:\n  - point:\n      sync: 0.3\n      harm: 0.45\n      artic: 0.55\n      energy: 0.65\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&refrain from &key\n&refrain over=&key step=8n 2 2 2 4@2 3 2 0\n```\n\nThe refrain under the hook: the third three times, up to the fifth and held, then stepping down home. Written by hand for Synth-pop's minor (aeolian), a sung line that lands where the hook only asks.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&refrain`), so `use &refrain` takes it; a form reads it as its `&call` (`&call step=8n &refrain`), the line the form moves and answers.\n\nNear Synth-pop's point, 0.1 higher in energy, so a query there finds `hook` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&refrain from &key`. `&refrain from refrain &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &refrain from refrain`, it reads `&key` by name, as before.\n","motifs/12-pulse":"---\nid: pulse\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      artic: 1\n      energy: 0.9\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&pulse from &key\n&pulse over=&key step=8n 0 ~ 0 ~ 2 ~ 0 ~\n```\n\nThe tonic struck on every beat and the third once, all short: a line that is mostly rhythm, as a techno lead is. Written by hand for Techno, where the harmony stands still.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&pulse`), so `use &pulse` takes it; a form reads it as its `&call` (`&call step=8n &pulse`), the line the form moves and answers.\n\nNear Techno's point, 0.1 higher in energy, so a query there finds `octaves` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&pulse from &key`. `&pulse from pulse &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &pulse from pulse`, it reads `&key` by name, as before.\n","motifs/13-soul":"---\nid: soul\nassociation:\n  - point:\n      sync: 0.35\n      harm: 0.55\n      artic: 0.65\n      energy: 0.75\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&soul from &key\n&soul over=&key step=8n 4 ~ 4 3 4@2 2@2\n```\n\nThe fifth twice, a turn through the fourth and back, then down to the third and held: a vocal ad lib over a vamp. Written by hand for Deep house's dorian.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&soul`), so `use &soul` takes it; a form reads it as its `&call` (`&call step=8n &soul`), the line the form moves and answers.\n\nNear Deep house's point, 0.1 higher in energy, so a query there finds `sigh` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&soul from &key`. `&soul from soul &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &soul from soul`, it reads `&key` by name, as before.\n","motifs/14-drift":"---\nid: drift\nassociation:\n  - point:\n      sync: 0.05\n      harm: 0.3\n      artic: 0\n      energy: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&drift from &key\n&drift over=&key step=8n 4@4 3@4\n```\n\nTwo notes, the fifth and the fourth, half a bar each: a line that barely moves, legato and sparse. Written by hand for Ambient.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&drift`), so `use &drift` takes it; a form reads it as its `&call` (`&call step=8n &drift`), the line the form moves and answers.\n\nNear Ambient's point, 0.1 higher in energy, so a query there finds `rising` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&drift from &key`. `&drift from drift &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &drift from drift`, it reads `&key` by name, as before.\n","motifs/15-dusty":"---\nid: dusty\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.75\n      artic: 0.35\n      energy: 0.6\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&dusty from &key\n&dusty over=&key step=8n ~ 0 2 ~ 4 2@3\n```\n\nLate in on the tonic, up through the third to the fifth and back to the third, held to the bar's end: a line that sits behind the beat. Written by hand for Lo-fi hip hop's minor and its swung eighths.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&dusty`), so `use &dusty` takes it; a form reads it as its `&call` (`&call step=8n &dusty`), the line the form moves and answers.\n\nNear Lo-fi hip hop's point, 0.1 higher in energy, so a query there finds `lazy` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&dusty from &key`. `&dusty from dusty &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &dusty from dusty`, it reads `&key` by name, as before.\n","motifs/16-slap":"---\nid: slap\nassociation:\n  - point:\n      sync: 1\n      harm: 0.12\n      artic: 0.85\n      energy: 0.85\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&slap from &key\n&slap over=&key step=8n 0 0 ~ 6 0 ~ 4 ~\n```\n\nThe tonic twice, the flat seventh off the beat, the tonic, then the fifth: short and syncopated, the bass player's lick taken up by the lead. Written by hand for Funk's dorian.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&slap`), so `use &slap` takes it; a form reads it as its `&call` (`&call step=8n &slap`), the line the form moves and answers.\n\nNear Funk's point, 0.1 higher in energy, so a query there finds `riff` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&slap from &key`. `&slap from slap &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &slap from slap`, it reads `&key` by name, as before.\n","motifs/17-saudade":"---\nid: saudade\nassociation:\n  - point:\n      sync: 0.75\n      harm: 0.85\n      artic: 0.45\n      energy: 0.55\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&saudade from &key\n&saudade over=&key step=8n 2 ~ 3 2 ~ 1 0@2\n```\n\nThe third, the fourth and back, then falling by step to the tonic and held: a sigh between the guitar's chords. Written by hand for Bossa nova.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&saudade`), so `use &saudade` takes it; a form reads it as its `&call` (`&call step=8n &saudade`), the line the form moves and answers.\n\nNear Bossa nova's point, 0.1 higher in energy, so a query there finds `tresillo` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&saudade from &key`. `&saudade from saudade &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &saudade from saudade`, it reads `&key` by name, as before.\n","motifs/18-blue":"---\nid: blue\nassociation:\n  - point:\n      sync: 0.35\n      harm: 1\n      artic: 0.3\n      energy: 0.7\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&blue from &key\n&blue over=&key step=8n 4 3 2 1 0@2 -2@2\n```\n\nDown the scale from the fifth to the tonic and on to the sixth below, held: the line that ends a chorus on the sixth. Written by hand for Swing jazz.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&blue`), so `use &blue` takes it; a form reads it as its `&call` (`&call step=8n &blue`), the line the form moves and answers.\n\nNear Swing jazz's point, 0.1 higher in energy, so a query there finds `bebop` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&blue from &key`. `&blue from blue &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &blue from blue`, it reads `&key` by name, as before.\n","motifs/19-lindy":"---\nid: lindy\nassociation:\n  - point:\n      sync: 0.55\n      harm: 0.75\n      artic: 0.6\n      energy: 0.85\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&lindy from &key\n&lindy over=&key step=8n 0@3 4@3 2@2\n```\n\nThe tonic, the fifth and the third on the Charleston's 3 + 3 + 2, as a Lindy hop dances it: the swing era's dance, which electro swing samples. Written by hand for Electro swing's harmonic minor.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&lindy`), so `use &lindy` takes it; a form reads it as its `&call` (`&call step=8n &lindy`), the line the form moves and answers.\n\nNear Electro swing's point, 0.1 higher in energy, so a query there finds `gypsy` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&lindy from &key`. `&lindy from lindy &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &lindy from lindy`, it reads `&key` by name, as before.\n","motifs/20-toll":"---\nid: toll\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.45\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&toll from &key\n&toll over=&key step=8n 0@4 -3@4\n```\n\nA bell tolling: the tonic, then the fifth below, half a bar each. Written by hand for Spooky, the knell before the chant.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&toll`), so `use &toll` takes it; a form reads it as its `&call` (`&call step=8n &toll`), the line the form moves and answers.\n\nNear Spooky's point, 0.1 higher in energy, so a query there finds `diesIrae` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&toll from &key`. `&toll from toll &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &toll from toll`, it reads `&key` by name, as before.\n","motifs/21-waltz":"---\nid: waltz\nassociation:\n  - point:\n      sync: 0\n      harm: 0.7\n      artic: 0.3\n      energy: 0\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&waltz from &key\n&waltz over=&key step=8n 0@2 2 4 4@2\n```\n\nThe tonic held on the downbeat, then the third and the fifth, the fifth held into the next bar: a waltz's long first beat and its two light ones.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 3/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&waltz`), so `use &waltz` takes it; a form reads it as its `&call` (`&call step=8n &waltz`), the line the form moves and answers.\n\nAt 3/4's first point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&waltz from &key`. `&waltz from waltz &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &waltz from waltz`, it reads `&key` by name, as before.\n","motifs/22-music-box":"---\nid: musicBox\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.43\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&musicBox from &key\n&musicBox over=&key step=8n 4 3 4 1 2@2\n```\n\nThe fifth, the fourth and the fifth again, then down to the second and the third held: a music box running down, in three. Near Spooky, where 3/4 is found.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 3/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&musicBox`), so `use &musicBox` takes it; a form reads it as its `&call` (`&call step=8n &musicBox`), the line the form moves and answers.\n\nAt 3/4's point near Spooky (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&musicBox from &key`. `&musicBox from musicBox &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &musicBox from musicBox`, it reads `&key` by name, as before.\n","motifs/23-rocking":"---\nid: rocking\nassociation:\n  - point:\n      sync: 0.3\n      harm: 0.2\n      artic: 0.2\n      energy: 0\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&rocking from &key\n&rocking over=&key step=8n 0@2 2 4@2 2\n```\n\nLong, short, long, short: a cradle's rock in two groups of three, from the tonic to the fifth and back to the third.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 6/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&rocking`), so `use &rocking` takes it; a form reads it as its `&call` (`&call step=8n &rocking`), the line the form moves and answers.\n\nAt 6/8's first point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&rocking from &key`. `&rocking from rocking &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &rocking from rocking`, it reads `&key` by name, as before.\n","motifs/24-sway":"---\nid: sway\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.27\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&sway from &key\n&sway over=&key step=8n 0@3 -1 -2 -1\n```\n\nThe tonic held for half the bar, then a slow wobble down a step, two steps and back: a candle's flame in 6/8. Near Spooky, where 6/8 is found.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 6/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&sway`), so `use &sway` takes it; a form reads it as its `&call` (`&call step=8n &sway`), the line the form moves and answers.\n\nAt 6/8's point near Spooky (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&sway from &key`. `&sway from sway &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &sway from sway`, it reads `&key` by name, as before.\n","motifs/25-fivefold":"---\nid: fivefold\nassociation:\n  - point:\n      sync: 0.4\n      harm: 0.9\n      artic: 0.5\n      energy: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&fivefold from &key\n&fivefold over=&key step=8n 0 2 4@4 3 2 1@2\n```\n\nUp the triad to the fifth and held, the bar's first three beats, then down by step through its last two: five beats grouped 3 + 2.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 5/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&fivefold`), so `use &fivefold` takes it; a form reads it as its `&call` (`&call step=8n &fivefold`), the line the form moves and answers.\n\nAt 5/4's first point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&fivefold from &key`. `&fivefold from fivefold &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &fivefold from fivefold`, it reads `&key` by name, as before.\n","motifs/26-limp":"---\nid: limp\nassociation:\n  - point:\n      sync: 0.8\n      harm: 0.6\n      artic: 1\n      energy: 1\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&limp from &key\n&limp over=&key step=8n 0 ~ 4 ~ 3 2 0\n```\n\nThe tonic, the fifth, then a run down to the tonic: short notes in 7/8's 2 + 2 + 3, the last group the long one.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 7/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&limp`), so `use &limp` takes it; a form reads it as its `&call` (`&call step=8n &limp`), the line the form moves and answers.\n\nAt 7/8's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&limp from &key`. `&limp from limp &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &limp from limp`, it reads `&key` by name, as before.\n","motifs/27-dancer":"---\nid: dancer\nassociation:\n  - point:\n      sync: 0.6\n      harm: 0.9\n      artic: 0.8\n      energy: 0.9\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&dancer from &key\n&dancer over=&key step=8n 0 ~ 2 4 ~ 5 4 2 1 0\n```\n\nTen eighths as 3 + 3 + 2 + 2: a leap up to the sixth in the threes, then stepping home in the twos.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 10/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&dancer`), so `use &dancer` takes it; a form reads it as its `&call` (`&call step=8n &dancer`), the line the form moves and answers.\n\nAt 10/8's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&dancer from &key`. `&dancer from dancer &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &dancer from dancer`, it reads `&key` by name, as before.\n","motifs/28-shuffle":"---\nid: shuffle\nassociation:\n  - point:\n      sync: 0.7\n      harm: 0.6\n      artic: 0\n      energy: 0.2\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&shuffle from &key\n&shuffle over=&key step=8n 0@2 2 3@2 4 4@2 2 0@2 ~\n```\n\nLong, short four times over the bar's four beats: the tonic, the third, the fourth, the fifth and back, a slow blues shuffle in 12/8.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 12/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&shuffle`), so `use &shuffle` takes it; a form reads it as its `&call` (`&call step=8n &shuffle`), the line the form moves and answers.\n\nAt 12/8's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&shuffle from &key`. `&shuffle from shuffle &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &shuffle from shuffle`, it reads `&key` by name, as before.\n","motifs/29-march":"---\nid: march\nassociation:\n  - point:\n      sync: 0\n      harm: 0.1\n      artic: 0.6\n      energy: 1\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&march from &key\n&march over=&key step=8n 4 4 0 ~\n```\n\nThe fifth twice, then the tonic, and a rest: a march's call, two beats to the bar.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 2/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&march`), so `use &march` takes it; a form reads it as its `&call` (`&call step=8n &march`), the line the form moves and answers.\n\nAt 2/4's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&march from &key`. `&march from march &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &march from march`, it reads `&key` by name, as before.\n","motifs/30-fanfare":"---\nid: fanfare\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.6\n      artic: 0.9\n      energy: 1\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&fanfare from &key\n&fanfare over=&key step=8n 0 0 0 2@2 4@2 ~\n```\n\nThe tonic three times, then the third and the fifth held: a fanfare's call, in two half-note beats.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4 alla breve: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&fanfare`), so `use &fanfare` takes it; a form reads it as its `&call` (`&call step=8n &fanfare`), the line the form moves and answers.\n\nAt 4/4 alla breve's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&fanfare from &key`. `&fanfare from fanfare &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &fanfare from fanfare`, it reads `&key` by name, as before.\n","motifs/31-question":"---\nid: question\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&question from &key\n&question over=&key step=8n 0 1 2@2 4@4\n```\n\nUp by step to the third, then a leap to the fifth held half the bar: a phrase that ends open, asking for an answer. General-purpose, for any style.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&question`), so `use &question` takes it; a form reads it as its `&call` (`&call step=8n &question`), the line the form moves and answers.\n\nAt the centre of style space (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&question from &key`. `&question from question &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &question from question`, it reads `&key` by name, as before.\n","motifs/32-reply":"---\nid: reply\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.5\n      energy: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&reply from &key\n&reply over=&key step=8n 4 3 2@2 0@4\n```\n\nDown by step from the fifth to the third, then home to the tonic held half the bar: the closed answer to `question`. General-purpose.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&reply`), so `use &reply` takes it; a form reads it as its `&call` (`&call step=8n &reply`), the line the form moves and answers.\n\nAt the centre, 0.2 lower in energy (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&reply from &key`. `&reply from reply &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &reply from reply`, it reads `&key` by name, as before.\n","motifs/33-arpeggio":"---\nid: arpeggio\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.3\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&arpeggio from &key\n&arpeggio over=&key step=8n 0 2 4 7 4 2 0 ~\n```\n\nUp the triad to the octave and back down: the plainest line a chord gives. General-purpose, for plainer harmony.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&arpeggio`), so `use &arpeggio` takes it; a form reads it as its `&call` (`&call step=8n &arpeggio`), the line the form moves and answers.\n\nAt the centre, 0.2 lower in harmony (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&arpeggio from &key`. `&arpeggio from arpeggio &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &arpeggio from arpeggio`, it reads `&key` by name, as before.\n","motifs/34-run":"---\nid: run\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.7\n      artic: 0.5\n      energy: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&run from &key\n&run over=&key step=8n 0 1 2 3 4 5 6 7\n```\n\nThe scale from the tonic to the octave, one note an eighth: in each mode it walks that mode. General-purpose, for richer harmony.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&run`), so `use &run` takes it; a form reads it as its `&call` (`&call step=8n &run`), the line the form moves and answers.\n\nAt the centre, 0.2 higher in harmony (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&run from &key`. `&run from run &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &run from run`, it reads `&key` by name, as before.\n","motifs/35-neighbour":"---\nid: neighbour\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.3\n      energy: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&neighbour from &key\n&neighbour over=&key step=8n 0 1 0 -1 0@4\n```\n\nThe tonic, the note above, the tonic, the note below, and the tonic held: the neighbour notes round one pitch. General-purpose, legato.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&neighbour`), so `use &neighbour` takes it; a form reads it as its `&call` (`&call step=8n &neighbour`), the line the form moves and answers.\n\nAt the centre, 0.2 lower in articulation (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&neighbour from &key`. `&neighbour from neighbour &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &neighbour from neighbour`, it reads `&key` by name, as before.\n","motifs/36-leap":"---\nid: leap\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      artic: 0.7\n      energy: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&leap from &key\n&leap over=&key step=8n 0@2 4@2 3 2 1 0\n```\n\nThe tonic, a leap to the fifth, then stepping back down the scale: a leap balanced by steps. General-purpose, short notes.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&leap`), so `use &leap` takes it; a form reads it as its `&call` (`&call step=8n &leap`), the line the form moves and answers.\n\nAt the centre, 0.2 higher in articulation (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&leap from &key`. `&leap from leap &key` takes a copy of it, `&key` its main argument. Taken the old way, `use &leap from leap`, it reads `&key` by name, as before.\n","performers/01-drums":`---
id: drums performer
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

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`presets.ts\`), at weight 1: every preset's section text plays its drums the same way, on these 13 voices on channel 10, so the eight share this one drummer, and what a preset's drums sound like is its lines, not its player.

**Its signature** (decision 065): \`&drums, &drumsOut from (&kit) &drumlines\`. \`&drums from "drums performer" &groove\` takes a copy of it, \`&drumlines\` its main argument; \`&kit\` an optional parameter, its line its default (\`"drums performer"(kit=…)\`). Taken the old way, \`use &drums from "drums performer"\`, it reads \`&drumlines\` by name, as before.
`,"performers/02-bass":`---
id: bass performer
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

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`presets.ts\`), at weight 1: every preset's section text plays this part the same way (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b: one voice, one register and one channel for all eight), so the eight share this one performer, and what a preset sounds like is its parts, not its players.

**Its signature** (decision 065): \`&bass, &bassOut from (&bassLevel) &bassline\`. \`&bass from "bass performer" &line\` takes a copy of it, \`&bassline\` its main argument; \`&bassLevel\` an optional parameter, its line its default (\`"bass performer"(bassLevel=…)\`). Taken the old way, \`use &bass from "bass performer"\`, it reads \`&bassline\` by name, as before.
`,"performers/03-pad":`---
id: pad performer
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

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`presets.ts\`), at weight 1: every preset's section text plays this part the same way (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b: one voice, one register and one channel for all eight), so the eight share this one performer, and what a preset sounds like is its parts, not its players.

**Its signature** (decision 065): \`&pad, &padOut from (&padLevel) &padline\`. \`&pad from "pad performer" &line\` takes a copy of it, \`&padline\` its main argument; \`&padLevel\` an optional parameter, its line its default (\`"pad performer"(padLevel=…)\`). Taken the old way, \`use &pad from "pad performer"\`, it reads \`&padline\` by name, as before.
`,"performers/04-stab":`---
id: stab performer
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

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`presets.ts\`), at weight 1: every preset's section text plays this part the same way (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b: one voice, one register and one channel for all eight), so the eight share this one performer, and what a preset sounds like is its parts, not its players.

**Its signature** (decision 065): \`&stab, &stabOut from (&stabLevel) &stabline\`. \`&stab from "stab performer" &line\` takes a copy of it, \`&stabline\` its main argument; \`&stabLevel\` an optional parameter, its line its default (\`"stab performer"(stabLevel=…)\`). Taken the old way, \`use &stab from "stab performer"\`, it reads \`&stabline\` by name, as before.
`,"performers/05-lead":`---
id: lead performer
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

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`presets.ts\`), at weight 1: every preset's section text plays this part the same way (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b: one voice, one register and one channel for all eight), so the eight share this one performer, and what a preset sounds like is its parts, not its players.

**Its signature** (decision 065): \`&lead, &leadOut from (&leadLevel) &leadline\`. \`&lead from "lead performer" &line\` takes a copy of it, \`&leadline\` its main argument; \`&leadLevel\` an optional parameter, its line its default (\`"lead performer"(leadLevel=…)\`). Taken the old way, \`use &lead from "lead performer"\`, it reads \`&leadline\` by name, as before.
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
&groove [&kick, &backbeat, &fill, &ghost, &hat]
\`\`\`

Jambot's E31 bar for Synth-pop (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Synth-pop's point.
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
&groove [&kick, &backbeat, &fill, &hat]
\`\`\`

Jambot's E31 bar for Techno (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Techno's point.
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
&groove [&kick, &backbeat, &fill, &ghost, &hat]
\`\`\`

Jambot's E31 bar for Deep house (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Deep house's point.
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
&groove [&kick, &backbeat, &fill, &hat]
\`\`\`

Jambot's E31 bar for Ambient (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Ambient's point.
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
&groove [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]
\`\`\`

Jambot's E31 bar for Lo-fi hip hop (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Lo-fi hip hop's point. The rim's Euclid taps \`1m\`, and under a swung meter its strokes lean on the sixteenths the meter leans, as the band's rim does (#121).
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
&groove [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]
\`\`\`

Jambot's E31 bar for Funk (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Funk's point. The rim's Euclid taps \`1m\`, and under a swung meter its strokes lean on the sixteenths the meter leans, as the band's rim does (#121).
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
&groove [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]
\`\`\`

Jambot's E31 bar for Bossa nova (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Bossa nova's point.
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
&groove [&kick, &backbeat, &fill, &ghost, &hat, &pedal]
\`\`\`

Jambot's E31 bar for Swing jazz (yggi/jambot#317): the band's drum part as cells text, without its \`&bar\` line and its stand-in voices (\`&bd s=white\` …: the kit fills them, decision 054, rung 2) and its card (its mix is \`&groove\`, with no \`map=midi(10)\`: where its notes go is the workbench's and the drummer's, #291), so the host's \`&bar\`, written first, sets its meter and tempo. At Swing jazz's point.
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
&percussion [&clave * .5]
\`\`\`

The son clave, 3-2: x..x..x. ..x.x... over two bars of eighths. It is where the bossa nova clave and Funk's Bo Diddley beat come from, and sits halfway between Bossa nova and Funk.

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is a hole, a sound the General MIDI kit fills with the line this fragment used to carry word for word (decision 054, rung 2: #244). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.
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
&percussion [&clave * .5]
\`\`\`

The son clave from its other bar, 2-3: it starts off the downbeat, so it sits a step from 3-2 toward Funk, more off the beat and plainer.

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is a hole, a sound the General MIDI kit fills with the line this fragment used to carry word for word (decision 054, rung 2: #244). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.
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
&percussion [&clave * .5]
\`\`\`

The rumba clave, 3-2: the son's third stroke an eighth later, off the beat; drums and voices over a static harmony, short and dense: near Funk.

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is a hole, a sound the General MIDI kit fills with the line this fragment used to carry word for word (decision 054, rung 2: #244). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.
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
&percussion [&clave * .5]
\`\`\`

The bossa nova clave: the son's last stroke an eighth later. Bossa nova's harmony and articulation, a little more off the beat and sparser than its drum bar: five strokes in two bars.

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is a hole, a sound the General MIDI kit fills with the line this fragment used to carry word for word (decision 054, rung 2: #244). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.
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
&percussion [&clave * .5]
\`\`\`

The bossa nova clave in one bar of sixteenths, x..x..x...x..x..: as dense as Bossa nova's drum bar, written in the same sixteenths, so at Bossa nova's energy; off the beat as the two-bar one. Which of the two fits a composition is the fit's to choose (#144), not the association's.

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is a hole, a sound the General MIDI kit fills with the line this fragment used to carry word for word (decision 054, rung 2: #244). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.
`,"rhythms/14-electro-swing-drums":`---
id: Electro swing drums
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
It holds no \`&bar\`, so the host's meter swings it: under \`4/4 swung on 8n\` (or the example's lighter \`swing=8n:.64\`) the open hats fall late, the kick and the clap stay on the beat.
Its lines strike the kit's names (\`&bd\` \`&cp\` \`&oh\` \`&hh\` \`&sd\`), holes the General MIDI kit fills, and carry no card (#291): \`&groove\` is the mix, its levels in the hits.
A piece arranging it takes its limbs by name (\`use &kick, &clap, &hats, &ticks from "Electro swing drums"\`), as the example does, each under a level of its own.

At a point proposed for an Electro swing preset (sync .55, harm .75, artic .6, energy .75), weight 1: no preset of Jambot's sits there yet, and the axes are Jambot's (decision 041), so the point is this file's, Jambot's to adopt.
`,"rhythms/15-spooky-drums":"---\nid: Spooky drums\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      artic: 0.3\n      energy: 0.35\n    weight: 1\n    facet: rhythm\nsource: seed\n---\n\n```cells\n&kick step=16n &bd:0:.55 &bd:0:.3 ~ ~\n&hat step=4n &rd:0:.12\n&euclid step=1m [~ &rim]\n&groove [&kick, &hat, &euclid * .25]\n```\n\nA heartbeat, a clock and a knock: the beat of [Spooky, in pieces](../../examples/spooky.md).\nThe kick is a heartbeat on every beat, its second stroke a sixteenth after the first and softer (lub-dub); the ride ticks each beat, faint, a clock; the rim knocks once, at the middle of the bar, where the heart is between beats in a bar of an odd number of them.\nEvery line fits any meter and lands on its sixteenths: the kick and the ride cycle on a beat (`step=16n` four long, `step=4n` one long), and the rim halves the bar (`step=1m [~ &rim]`), and half of every bar the library's meters make is a whole number of sixteenths (6 in 3/4, 10 in 5/4, 7 in 7/8), so in 5/4 the heart beats five times and the knock falls between the third beat's strokes.\nA Euclid spread over the bar (`step=1m &rim(3,8)`, v0.12.0's) put the knocks between the sixteenths of any bar but 4/4's and 12/8's, where a reader on the bar's sixteenths, as Jambot's drummer is, can't play them; a line on eighths (`step=8n`) lands on them but laps a bar of 4/4, which the fit refuses under the other meters.\nIts lines are named by Jambot's drum roles (`kick`, `hat`, `euclid`) and strike only voices its kit holds (`&bd` 36, `&rd` 51, `&rim` 37), so the drummer plays it as it is; they strike the kit's names, holes the General MIDI kit fills, and carry no card (#291): `&groove` is the mix.\nWritten by hand for the point proposed for a Spooky preset (sync .2, harm .9, artic .3, energy .35; #349), weight 1: no preset of Jambot's sits there yet, and the axes are Jambot's (decision 041), so the point is this file's, Jambot's to adopt.\n","stab/01-charleston-stabs":"---\nid: Charleston stabs\nassociation:\n  - point:\n      sync: 0.55\n      harm: 0.75\n      artic: 0.6\n      energy: 0.75\n    weight: 1\n    facet: stab\nsource: seed\nlifted: yggi/cells examples/electroswing.md @ 2c120d4\n---\n\n```cells\n&stabline from &harm\n&stabline step=8n cycle=4 &charleston!3 &push\n&charleston over=&harm step=8n [0,1,2] ~ ~ [0,1,2] ~@4\n&push over=&harm step=8n [0,1,2] ~ ~ [0,1,2] ~ [0,1,2] ~ &ahead\n&ahead over=&harm[>>] [1,2,3]\n```\n\nThe stabs of [Electro swing, in pieces](../../examples/electroswing.md): the Charleston, a chord on one and on the and of two, three bars, and a fourth that pushes: its last stab, on the and of four, is the next chord, its third and fifth with its root on top (`&ahead over=&harm[>>]`, as the funk bass anticipates with `&bassNext`).\nIt is the part the stab performer plays (`&stabline`, decision 058), the first of the facet `stab`, as the bass lines are the bass performer's: its chords are indices into the chord in force (`over=&harm`), so its holes are `&harm` and a meter, and its velocities are the performer's (`&stabLevel`).\n`&charleston`, `&push` and `&ahead` are its helpers: `use &stabline from \"Charleston stabs\"` takes them.\nIt is the example's line at the commit it was lifted from, but for that last stab, which there read the chord in force (the owner's review of #305).\n\nAt a point proposed for an Electro swing preset (sync .55, harm .75, artic .6, energy .75), weight 1: no preset of Jambot's sits there yet, and the axes are Jambot's (decision 041), so the point is this file's, Jambot's to adopt.\n\n**Its signature** (decision 065): `&stabline from &harm`. `&stabline from \"Charleston stabs\" &harm` takes a copy of it, `&harm` its main argument. Taken the old way, `use &stabline from \"Charleston stabs\"`, it reads `&harm` by name, as before.\n"};function S_(){let e=b_(x_);if(`problems`in e)throw Error(`The seed library doesn't read: ${e.problems.join(`; `)}`);return e.files}let C_=S_(),w_=e=>C_.filter(t=>t.path.startsWith(`${e}/`)).map(e=>e.fragment),T_=w_(`instruments`);Object.fromEntries(hh.map(e=>[e.note,e.name]));let E_=Object.fromEntries(T_.find(e=>e.id===`gm_kit`).text.split(`
`).flatMap(e=>{let t=/^&(\w+) (.*)$/.exec(e);return t?[[t[1],t[2]]]:[]}));[...Object.keys(E_)];let D_=2048;(()=>{let e=new Float64Array(D_);for(let t=0;t<D_;t++)e[t]=Math.sin(2*Math.PI*t/D_);return e})();let O_=/* @__PURE__ */ `oscillator.tone.rests.semitones.twovoices.steps.clock.voice.effects.transpose.twinkle.chords.rhythm.drums.swing.breve.canon.mirrors.variations.chance.fifths.arrangement.stereo.waveforms.moving.grids.metronome.fm.musicbox.automaton.kalimba.sympathy.harmonograph.echotape.worn.dtmf.daytime.gate.play-in.midi-out.lullaby.jazz.five.waltz.sailor.royal.pertonos.ricercar.korobeiniki.coltrane.bossa.bell.prelude.pachelbel.pop.idm.alpha.studie.just.bwv847.acid.zell.cellscape.cellscape2.baustelle.focus.hypercell.onemore.electroswing.spooky.brothers.ghosts.tines.phase.in-c.tape.soundtape.testtones.forks.resonanz.fiveto12`.split(`.`),k_={acid:`---
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
&bar from "4/4" &tempo
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
&bd gain=.8 oneshot s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0) env=&thump
&cp gain=.35 oneshot s=white hpf=1500 env=&snap room=.2
&hh gain=.25 s=white hpf=8000 env=&click
&oh gain=.2 oneshot s=white hpf=7000 env=&(map=adsr 0 .2 0 .1)

&mix postgain=1.76 map=sample [&line * &accent * &tb303 * .45, &beat]
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
&bar scan(1 1 1 1) step=&tempo
&tempo step=free(84bpm, 50..120)
&alpha cycle=9 map=ed(3/2)                          # nine equal steps to 3:2

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
&bar from "4/4" &tempo
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
&bd gain=.6 s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .04 0 0) env=&thump

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
&bd s=sine loop=A1 pitch=0..20 * &(map=adsr 0 .05 0 0) env=&thump
&sd s=white hpf=1200 env=&tap
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
&bar scan(1 1 1 1) step=&tempo
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

&out postgain=.785 map=sample [&metalPart, &plates * &platev * .05, &kick * &sub * .55,
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
&dundun gain=.7 oneshot s=sine loop=C2 pitch=0..12 * &(map=adsr 0 .04 0 0) env=&(map=adsr 0 .25 0 .1)
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
description: beat=2 counts a 4/4 bar in halves, and pulse=16n gives a scan's entries a sixteenth each.
---

\`\`\`cells
&bar meter("4/4") beat=2 step=60bpm      # alla breve: two beats a bar, bpm counts half notes
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
&bar from "4/4" &tempo
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

&bd tags="break" oneshot s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .06 0 0) distort=.5 env=&thump
&sd tags="break" s=white hpf=900 distort=.6 crush=7 env=&snap
&hh tags="break" s=white hpf=7000 crush=6 env=&click
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
&bar from "4/4" 120bpm
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
&bar from "4/4" &tempo
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
&bar from "4/4" &tempo
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
&bar from "4/4" &tempo
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
`,clock:`---
title: "A clock: one bar drives every part"
tags: [tutorial, rhythm]
tier: 2
description: "A bar sets the tempo, and every part steps with it: on the beat, twice as fast, or once every two beats."
---

\`\`\`cells
&barNote label="&bar is the clock: a meter of 4/4, four even beats, stepped by &tempo; step=free(andante) a tempo marking, a slider from 76 to 108 beats a minute." about=(&bar &tempo)
&ratesNote label="Each part taps the bar by a note value: step=4n a step a beat (a quarter), 8n two steps a beat, 2n a step every two beats." about=(&tune &eighths &bass)
&bar from "4/4" &tempo  # four beats, andante
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
&bar from "4/4" &tempo
&tempo step=free(moderato)

&beat &bd ~ &hh:0:.5 ~ &sd ~ &hh:0:.5 [&bd,&hh]
&fill &sd [&sd &sd] &sd &sd*3
&groove step=8n &beat!3 &bd ~ &hh ~ &fill
&clave step=16n euclid(5, 16)
&kit &lo &mid &hi
&toms over=&kit step=16n ~!12 0 1 2 1

&bd, &sd, &rim from gm_kit
&click, &thump, &snap from envelopes
&hh oneshot s=white hpf=8000 env=&click
&lo s=sine loop=G2 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&thump
&mid s=sine loop=C3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&(map=adsr 0 .2 0 .05)
&hi s=sine loop=F3 pitch=0..12 * &(map=adsr 0 .05 0 0) env=&snap
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
&bar from "4/4" 84bpm
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
&bar scan(1 1 1 1) step=&tempo
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
Here the band comes from the seed library, taken by name, and so does the tune: the drummer and its kit, the key, an eight-bar vamp, the walking bass Jambot plays at Swing jazz, the bass, stab and lead players, and the beat and the stabs this piece gave the library (\`Electro swing drums\`, \`Charleston stabs\`); the tune is the motif \`gypsy\`, its call, shaped by two forms, \`call and answer\` and \`AABA\`.
The piece writes only what is its own: the tempo and the swing, the key's tonic, the break, who plays when, and the sound of each instrument.

\`\`\`cells
&drums, &drumsOut from "drums performer" &drumlines
&key from "harmonic minor" D
&harm from "vamp to the fifth" &key
&bassline from "walking bass" &harm
&kick, &clap, &hats, &ticks from "Electro swing drums"
&stabline from "Charleston stabs" &harm
&bass, &bassOut from "bass performer"(bassLevel=&bassLevel) &bassline
&stab, &stabOut from "stab performer"(stabLevel=&stabLevel) &stabline
&leadOut from "lead performer"(leadLevel=&leadLevel) &leadline
&useNote label="The band is the library's: each line names what it takes from it. &bassV, &keysV and &leadV are the players' instruments, named so the piece can give each a sound of its own; the drummer plays the core kit as it is." about=(&bassV &keysV &leadV)
\`\`\`

The meter is the library's too, \`4/4 swung on 8n\`, Jambot's Swing jazz meter, which leaves its tempo to the piece (\`&tempo\`) and swings its eighths by a cell of its own, \`&swing\`, triplets (2/3).
The piece gives its own, an argument of the meter's (\`swing=&swing\`): the eighths a little less than triplets, .64. The tempo and the swing are both sliders.
The key is harmonic minor, from the library, on the tonic its line gives it, D (\`&key from "harmonic minor" D\`, decision 065): the vamp's fifth is then A major, four bars of D minor, four of A.

\`\`\`cells
&bar from "4/4 swung on 8n"(swing=&swing) &tempo
&tempo step=free(124bpm, 112..132)
&swing swing=8n:free(.64, .5..0.75)
&swingNote label="Every line taps the meter (step=4n, 8n, 16n), so every line swings: the open hats on the off-beats, the stabs, the clarinet." about=&bar
\`\`\`

## The beat

\`Electro swing drums\`, used above: a kick on every beat, the clap on two and four, the open hat on every swung off-beat; a sixteenth hat with some strokes left to chance and a ghost of the snare on the last.
The piece takes its four limbs by name and hands them to the drummer as a stack, \`&drumlines\`, each times its level in the form below; the fragment's own \`&groove\` mix it leaves.
The crackle is the piece's own, a record's: a tick of noise on a few sixteenths, by chance.

\`\`\`cells
&drumlines [&kick * &kickForm, &clap * &clapForm, &hats, &ticks]
&crackle step=16n 0?.8!16
&beatNote label="The beat is a fragment: &kick, &clap, &hats and &ticks come from Electro swing drums, their levels in their hits." about=(&kick &clap &hats &ticks)
\`\`\`

## The stabs

\`Charleston stabs\`, used above, is the stab player's part: the Charleston, a chord on one and on the and of two, three bars, and a fourth that pushes: its last stab, on the and of four, comes early with the next chord, its third and fifth with its root on top.
The stab player reads the chords in force, \`over=&harm\`, so the same rhythm is D minor in one half of the vamp and A major in the other.

\`\`\`cells
&charlestonNote label="The Charleston: one, and the and of two, a fragment's (Charleston stabs)." about=&stabline
\`\`\`

## The tune: one bar, a call and its answer, in AABA

The tune is one bar from the library, the motif \`gypsy\`: A B♭ C♯ D and back to A, the clarinet's call.
Two forms from the library make a chorus of it.
- **\`call and answer\`** makes the A: the call, then its answer, the call two degrees down (\`&call^-2\`), F G A B♭ and back to F.
- **\`AABA\`** makes the chorus of four As, the bridge before the last. Its bridge, by default A a fourth up, is named in its use and moved to where the harmony goes: three degrees down (\`&a^-3\`), over the vamp's A chord, E F G A, A's phrygian dominant.

The break cuts the motif into pieces with picks: its first three notes (\`&gypsy[0:3]\`) and rests, its tail moved, its first two as a stutter (\`&gypsy[0:2]!4\`), its top note hammered (\`&gypsy[3]!4\`).

\`\`\`cells
&gypsy from gypsy &key
&phrase from "call and answer" &call
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
&click gain=.3 oneshot s=white hpf=3000 env=&(map=adsr 0 .03 0 .02)

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
&bar from "4/4" &tempo
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
&bar from "4/4" &tempo
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
&bar from "4/4" 60bpm
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
&bar from "4/4" &tempo
&strike, &snap, &click from envelopes
&tempo step=free(96bpm, 60..140)
&key scale(major)

&tune over=&key step=8n 0 2 4 2 5 4 2@2 4 5 7 5 4 2 0@2
&accent map=amp step=8n 1 .5 .8 .5
&roots over=&key step=2n 0 3 4 0

&lead s=tri loop=C5 env=&(map=adsr .01 .2 .4 .2)
&bell s=sine loop=C6 env=&(map=adsr 0 .6 0 .3)
&bass s=square loop=C2 lpf=500 env=&strike
&bd s=sine loop=A1 env=&(map=adsr 0 .3 0 .1)
&sd s=white env=&snap
&hh s=white hpf=7000 env=&click
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
&bar from "4/4" &tempo
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
&edoNote label="map=edo with cycle=19: nineteen equal steps to the octave. map=ed(3/2): equal steps to a pure fifth instead." about=(&edo19 &fifths)
&ratiosNote label="map=ratios: the tones as ratios, one period's worth, the last the period: 1 9/8 5/4 … 2." about=&just
&bar from "4/4" &tempo
&tempo step=free(andante)
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
&bar from "4/4" 60bpm
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
&bar from "4/4" &tempo
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

&bd tags="drums" gain=.8 oneshot s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .05 0 0) distort=.2 env=&thump
&hh tags="drums" gain=.2 s=white hpf=8000 env=&click
&cp tags="drums" gain=.35 oneshot s=white hpf=1400 room=.2 env=&snap
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
# Lydian scale turns a step every two bars, and pad, acid and lead all read it;
# one breath: a slow filter sweep moves the pad and the lead together.
&bar from "4/4" &tempo
&tap, &click, &strike from envelopes
&tempo step=free(160bpm, 110..200)
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
&sd s=white hpf=900 env=&tap
&hh s=white hpf=9000 env=&click
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
&bar from "4/4" &tempo
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
&bar from "4/4" &tempo
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
&bar from "4/4" 92bpm
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
&bar from "4/4" &tempo
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
&bar from "4/4" 104bpm

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
&bar from "4/4" &tempo
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
&bar scan(1 1 1 1) step=&tempo
&tempo step=free(moderato)

&line step=16n 0 0 12 0 ~ 0 10 0 0 3 0 ~ 7 0 12 ~
&accent map=amp step=16n 1 .5 .9 .5 0 .6 1 .5 .8 .5 .7 0 1 .5 .9 0
&swell map=lin loop=&bar/4 .2 1 .2
&fade map=db step=1m 0 -3 -6 -3

&acid s=saw loop=C2 lpf=150..2800 * &(map=adsr .002 .15 .1 .05) * &swell lpq=10 env=&strike
&out map=sample postgain=5.55 [&line * &acid * &accent * &fade * .4]
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
&comb oneshot pan=.36 s=sine loop=C5 fm=&m index=.2..1.6 * &(map=adsr .001 .06 .1 .1) room=.35 env=&(map=adsr .001 1.1 0 1)
&combLow oneshot pan=.61 s=sine loop=C5 fm=&m index=.1...8 * &(map=adsr .001 .06 .1 .1) env=&(map=adsr .001 1.4 0 1.2)
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
&bar scan(1 1 1 1) step=&tempo
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
&bd tags="groove" gain=.8 oneshot s=sine loop=A1 pitch=0..26 * &(map=adsr 0 .05 0 0) env=&thump
&cp tags="groove" gain=.3 oneshot s=white hpf=1300 room=.25 env=&snap
&oh tags="groove" gain=.15 s=white hpf=7000 env=&(map=adsr 0 .18 0 .08)
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
&bar from "4/4" &tempo
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
&key step=cycle(&theme) stride=2 cycle=24      # a whole tone per pass: up two octaves, then round
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
&bar from "4/4" 96bpm

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
&bar scan(1 1 1 1) step=&tempo
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
&bd tags="drums" gain=.8 s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .04 0 0) env=&thump
&sd tags="drums" gain=.4 s=white hpf=1200 env=&snap
&hh tags="drums" gain=.2 s=white hpf=8000 env=&click

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
&bar from "4/4" &tempo
&tempo step=free(66bpm, 40..100)
&chords step=1m [0,4,7,12,16] [0,2,9,14,17] [-1,2,7,14,17] [0,4,7,12,16] [0,4,9,16,21] [0,2,6,9,14] [-1,2,7,14,19] [-1,0,4,7,12] [-3,0,4,7,12] [-10,-3,2,6,12] [
        -5,-1,2,7,11] [-5,-2,4,7,13] [-7,-3,2,9,14] [-7,-4,2,5,11] [-8,-5,0,7,12] [-8,-7,-3,0,5] [-10,-7,-3,0,5] [-17,-10,-5,-1,5] [-12,-8,-5,0,4]
&figure over=&chords step=16n 0 1 2 3 4 2 3 4         # the figure: twice a bar, in sixteenths

&saw s=saw loop=C4 lpf=1600 lpq=7 env=&(map=adsr .002 .3 .4 .25)    # a resonant sawtooth …
&sub s=square loop=C3 lpf=900 env=&(map=adsr .002 .3 .4 .25)       # … and a square an octave down
&moog [&saw, &sub * .35]

&mix postgain=2.99 map=sample [&figure * &moog * .5]
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
&bar from "4/4" 104bpm
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
&bar from "4/4" &tempo
&tempo step=free(112bpm, 90..140)
&key from dorian D

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
&bd s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .05 0 0) env=&thump
&sd from gm_kit
&thump, &click from envelopes
&hh s=white hpf=7000 env=&click
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
&bar from "4/4" 72bpm
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
Here the band comes from the seed library, taken by name, and so does the tune: the drummer and its kit, the key, a four-bar cadence, a bass line, the bass, pad, stab and lead players, and the beat, the bass and the tune Spooky gave the library (\`Spooky drums\`, \`creeping bass\`, \`dark cadence\`, \`diesIrae\`).
The piece writes only what is its own: the tempo, the key's tonic, the stabs, who plays when, and the sound of each instrument.

\`\`\`cells
&drums, &drumsOut from "drums performer" &drumlines
&key from "harmonic minor" D
&harm from "dark cadence" &key
&bassline from "creeping bass" &harm
&kick, &hat, &euclid from "Spooky drums"
&bass, &bassOut from "bass performer"(bassLevel=&bassLevel) &bassline
&pad, &padOut from "pad performer"(padLevel=&padLevel) &padline
&stab, &stabOut from "stab performer"(stabLevel=&stabLevel) &stabline
&leadOut from "lead performer"(leadLevel=&leadLevel) &leadline
&useNote label="The band is the library's: each use names what it takes. &bassV, &padV, &keysV and &leadV are the players' instruments, named so the piece can give each a sound of its own." about=(&bassV &padV &keysV &leadV)
\`\`\`

The meter is the library's, \`5/4\`, five beats to the bar, which leaves its tempo to the piece (\`&tempo\`), a slider.
The key is harmonic minor, from the library, on the tonic its line gives it, D (\`&key from "harmonic minor" D\`, decision 065): its fifth is then A major, a dominant, and its sixth B♭ sits a semitone above it.

\`\`\`cells
&bar from "5/4" &tempo
&tempo step=free(100bpm, 80..120)
&fiveNote label="Five beats a bar: every line taps the meter, so the heart beats five times and the knock falls at the middle of the bar, between the third beat's strokes." about=&bar
\`\`\`

## The beat

\`Spooky drums\`, used above: a heartbeat on every beat, its second stroke a sixteenth late and softer, the ride ticking each beat like a clock, the rim knocking once, at the middle of the bar.
The piece takes its three limbs by name and hands them to the drummer as a stack, \`&drumlines\`, the heart under a level of the form's.

\`\`\`cells
&drumlines [&kick * &heartForm, &hat, &euclid * .25]
&beatNote label="The beat is a fragment: &kick, &hat and &euclid come from Spooky drums." about=(&kick &hat &euclid)
\`\`\`

## The chords, the bass and the stabs

\`dark cadence\`, used above, is the harmony: D minor, B♭ major, G minor and A major, a bar each.
The organ holds each chord a bar (\`&padline\`); \`creeping bass\` holds each root two beats, then creeps a semitone up and back, four beats long against the bar's five, so the creep comes a beat later each time round.
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
&bar from "4/4" 72bpm
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
&bar scan(1 1 1 1) step=&tempo motor=1.4 mass=1 friction=.3 wow=.012 wind=40 varispeed=1
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
&bar from "4/4" 60bpm
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
&bar from "4/4" &tempo
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
&bar from "4/4" 96bpm
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
&bar from "4/4" 96bpm
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
&bar from "4/4" &tempo
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
&bar from "4/4" &tempo
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
&bar scan(1 1 1 1) step=&tempo
&tempo step=100bpm
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
&bar from "4/4" 72bpm
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
&bar from "4/4" &tempo
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
&bd tags="beat" gain=.8 s=sine loop=A1 pitch=0..24 * &(map=adsr 0 .05 0 0) env=&thump
&sd tags="beat" gain=.35 s=white hpf=1200 env=&snap
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
`};Object.fromEntries(O_.map(e=>{let t=k_[e];if(t===void 0)throw Error(`examples/${e}.md is missing`);let n=Fc(t);if(`problems`in n)throw Error(`examples/${e}.md: ${n.problems.map(e=>`line ${e.line}: ${e.message}`).join(`; `)}`);return[e,{source:n.text,file:t}]}));let A_=.1,j_=new Set(ll.map(e=>e.replace(/^&/,``))),M_=/&([A-Za-z_][A-Za-z0-9_]*)/g,N_=e=>[...new Set(Xh(e).map(e=>e.name))].filter(e=>!j_.has(e));function P_(e){let t=new Map(N_(e).map((e,t)=>[e,t+1]));return Xh(e).map(e=>e.code.replace(M_,(e,n)=>t.has(n)?`&#${t.get(n)}`:e)).join(`
`)}function F_(e,t){if(P_(e)!==P_(t))return null;let n=N_(t);return new Map(N_(e).flatMap((e,t)=>e===n[t]?[]:[[`&${e}`,`&${n[t]}`]]))}let I_=e=>Math.round(e*1e9)/1e9;function L_(e,t,n,r,i){let a=t.filed.find(e=>e.fragment.id===n),o=a?a.fragment.association:e.fragments.find(e=>e.id===n).association,s=o.map((e,t)=>({wp:e,own:t}));t.points.forEach((e,t)=>{e.id===n&&s.push({wp:e,row:t})});let c=new Set(d_({id:n,text:`-`,association:s.map(e=>e.wp)},i)),l,u=1/0;for(let e of s){let t=c.has(e.wp)?u_(e.wp.point,r)/e.wp.weight:1/0;t<=u&&t<1/0&&([l,u]=[e,t])}if(!l)return R_(t,n,a,{point:{...r},weight:A_,...i===void 0?{}:{facet:i}});let{wp:d}=l;if(d.weight>=1.2)return t;let f=I_(Math.min(1.2,d.weight+.1));if(l.row!==void 0)return{...t,points:t.points.map((e,t)=>t===l.row?{...e,weight:f}:e)};if(!a)return R_(t,n,a,{...d,weight:f});let p=o.map((e,t)=>t===l.own?{...e,weight:f}:e);return{...t,filed:t.filed.map(e=>e===a?{...e,fragment:{...e.fragment,association:p}}:e)}}function R_(e,t,n,r){if(!n)return{...e,points:[...e.points,{id:t,...r}]};let i={...n.fragment,association:[...n.fragment.association,r]};return{...e,filed:e.filed.map(e=>e===n?{...e,fragment:i}:e)}}function z_(e,t){let n=[...new Set(t)].sort(p_);if(n.length<2)return e;let r=[...e.together],i=new Map(r.map((e,t)=>[JSON.stringify(e.ids),t]));for(let e=0;e<n.length;e++)for(let t=e+1;t<n.length;t++){let a=[n[e],n[t]],o=JSON.stringify(a),s=i.get(o);s===void 0?(i.set(o,r.length),r.push({ids:a,count:1})):r[s]={ids:a,count:r[s].count+1}}return{...e,together:r}}function B_(e,t,n){let r=new Set(e.merge(t).fragments.map(e=>e.id)),i=n.filter(e=>!r.has(e.id)).map(e=>`'${e.id}'`);if(i.length)throw Error(`useFragments: no fragment ${i.join(`, `)}`);let a=z_(t,n.map(e=>e.id));for(let{id:t,point:r,facet:i}of n)r&&(a=L_(e,a,t,r,i));return a}function V_(e,t,n){let{text:r,point:i,facet:a,source:o,created:s,meta:c={},prose:l=``}=n,u=[];(typeof o!=`string`||!o.trim())&&u.push(`no source`),(typeof s!=`string`||!s.trim())&&u.push(`no created`);let d=[`id`,`association`,`source`,`created`].filter(e=>Object.hasOwn(c,e));d.length&&u.push(`its meta names ${d.join(`, `)}, which filing writes itself`);let f=[{point:{...i},weight:A_,...a===void 0?{}:{facet:a}}];if(u.push(...s_({id:n.id??`filed`,text:r,association:f})),u.length)throw Error(`fileFragment: ${u.join(`; `)}`);let p=e.merge(t);for(let n of p.fragments){let o=F_(r,n.text);if(o)return{layer:L_(e,t,n.id,i,a),id:n.id,file:null,renamed:o}}let m=/* @__PURE__ */ new Set([...p.fragments.map(e=>e.id),...p.unheld]);if(n.id!==void 0&&m.has(n.id))throw Error(`fileFragment: the id ${n.id} is taken`);let h=n.id??`${o} ${s}`;for(let e=2;m.has(h);e++)h=`${o} ${s} ${e}`;let g={fragment:{id:h,text:r,association:f},meta:{source:o,created:s,...c},prose:l};return{layer:{...t,filed:[...t.filed,g]},id:h,file:g,renamed:/* @__PURE__ */ new Map}}let H_=w_(`meters`),U_=w_(`rhythms`),W_=w_(`bass`),G_=w_(`harmony`),K_=w_(`modes`),q_=w_(`performers`),J_=w_(`stab`),Y_=w_(`expression`),X_=w_(`motifs`),Z_=w_(`forms`),Q_=[...H_,...U_,...W_,...G_,...T_,...Y_,...K_,...q_,...J_,...X_,...Z_],$_=/* @__PURE__ */ new Map([[`core kit`,`use &bd, &rim, &sd, &cp, &lt, &hh, &ph, &mt, &oh, &ht, &cr, &rd, &claves from gm_kit`],[`gm kit`,`use * from gm_kit`]]),ev=new Map([...Q_.map(e=>[e.id,e.text]),...$_]),tv=e=>ev.get(e)??null;[...Gg,...Kg];function nv(e){let t=e.length;for(let n=0;n<e.length;n++){let r=e.charCodeAt(n);r<128||(r<2048?t+=1:r>=55296&&r<56320&&(e.charCodeAt(n+1)&64512)==56320?(t+=2,n++):t+=2)}return t}let rv=e=>nv(JSON.stringify(e));function iv(e,t=16e3){if(rv(e)<=t)return e;let{filed:n,points:r,together:i}=e,a=()=>rv({filed:n,points:r,together:i});for(;r.length>0&&a()>t;)r=r.slice(1);for(;i.length>0&&a()>t;)i=i.slice(1);for(;n.length>0&&a()>t;)n=n.slice(1);return{filed:n,points:r,together:i}}function av(e,t,n){return n.filter(n=>e.fragments.some(e=>e.id===n)||t.filed.some(e=>e.fragment.id===n))}let ov=[`gm_kit`,`bass`,`keys`,`pad`,`lead`],sv={bass:{voice:`bassV`,own:`bass`},pad:{voice:`padV`,own:`pad`},stab:{voice:`keysV`,own:`keys`},lead:{voice:`leadV`,own:`lead`}},cv=/* @__PURE__ */ new WeakMap;function lv(e,t=T_){let n=cv.get(t);n||cv.set(t,n=m_(t));let r=n.query(H(e),t.length,{},{facet:`instrument`}),i={};for(let[e,{voice:t,own:n}]of Object.entries(sv))for(let{fragment:a}of r){let r=a.text.split(`
`).find(e=>e.startsWith(`&${t} `));if(r!==void 0){a.id!==n&&(i[e]={id:a.id,line:r});break}}return i}let uv=(()=>{let e=/* @__PURE__ */ new Map,t=[...T_].sort((e,t)=>dv(e.id)-dv(t.id)||e.id.localeCompare(t.id));for(let n of t)for(let t of n.text.split(`
`)){let n=/^&(\w+)\s/.exec(t)?.[1];n!==void 0&&!e.has(n)&&e.set(n,t)}return e})();function dv(e){let t=ov.indexOf(e);return t===-1?ov.length:t}let fv=e=>new Set(e.split(`
`).flatMap(e=>/^&(\w+)/.exec(e)?.[1]??[])),pv=e=>new Set(e.split(`
`).flatMap(e=>[...e.replace(/^&\w+/,``).matchAll(/&(\w+)/g)].map(e=>e[1])));function mv(e){let t=fv(e),n=pv(e);return[...uv].flatMap(([e,r])=>n.has(e)&&!t.has(e)?[r]:[])}function hv(e){let t=mv(e);return t.length?`${e}\n${t.join(`
`)}`:e}let gv=e=>Object.keys(L).find(t=>fn(L[t],e))??null,_v=e=>`${e.cycle}:${e.heights.join(` `)}`;function vv(e,t){return[{tap:`1m`,length:t},{tap:`2n`,length:8},{tap:`4n`,length:4},{tap:`8n`,length:2}].find(n=>t%n.length===0&&e.every(e=>e%n.length===0))??{tap:`16n`,length:1}}function yv(e){let{facet:t,fragments:n,read:r,bars:i=1}=e,a=e.vary,o=m_([...n,...H_]),s=new Map(n.map(e=>[e.id,e.text])),c=(e,t)=>s.get(e)??t?.filed.find(t=>t.fragment.id===e)?.fragment.text,l=({fragment:e})=>e.association.some(e=>e.facet===t),u=/* @__PURE__ */ new Map,d=/* @__PURE__ */ new Map,f=(e,t)=>{let n=`${e}\n${_v(t)}`;return u.has(n)||u.set(n,r(e,t)),u.get(n)},p=(e,t)=>{let n=`${t}\n${e}`;if(!d.has(n)){if(!a)d.set(n,[]);else{let r=a(t),i=[r.workbench??[],mv(e)].flat().join(`
`);d.set(n,Zg(e,{...r,workbench:i}))}}return d.get(n)},m=(e,r,i,a,c)=>o.query(e,n.length+H_.length+(r?.filed.length??0),{},{facet:t,...r?{layer:r}:{},...i.length?{chosen:i}:{},...c===void 0?{}:{pull:c}}).filter(e=>s.has(e.fragment.id)||e.distance<=a);return{query(e,t,n,r=[],i=1/0,a){return m(e,n,r,i,a).filter(e=>f(e.fragment.text,t.meter)!==null).map(e=>({id:e.fragment.id,distance:e.distance,score:e.score}))},used:(e,n,r,i=[])=>iv(B_(o,e,[...av(o,e,n).map(e=>({id:e,point:r,facet:t})),...av(o,e,i).map(e=>({id:e}))])),file(n,{notes:r,bench:a,point:s,source:c,created:l,tags:d,varies:f,by:p}){let m=e.text(r,R(a.meter)),h=V_(o,n,{text:m,point:s,facet:t,source:c,created:l,meta:{tags:[...d],...f===void 0?{}:{varies:f},...p===void 0?{}:{by:p}}}),{meterFragment:g}=a,_=g===void 0?h.layer:B_(o,h.layer,[{id:h.id},{id:g}]),v=`${m}\n${_v(a.meter)}`;return h.file&&!u.has(v)&&u.set(v,{bars:i,notes:[...r].sort((e,t)=>e.step-t.step)}),{layer:iv(_),id:h.id,held:h.file===null}},read(e,t,n){let r=c(e,n);return r===void 0?null:f(r,t)},vary(e,t,n,i){if(!a)return null;let o=c(e,i),s=gv(t.meter);if(o===void 0||s===null||f(o,t.meter)===null)return null;let l=p(o,s);if(!l.length)return null;let u=l[n_(n,l.length)],d=r(u.apply(o),t.meter);return d&&{notes:d.notes,by:u.by}},*warm(e,t){let r=[...(t?.filed??[]).filter(l).map(e=>e.fragment.text).reverse(),...n.map(e=>e.text)],i=e.filter((t,n)=>e.findIndex(e=>fn(e.meter,t.meter))===n);for(let{meter:e}of i){let t=gv(e);if(t!==null)for(let n of r){if(u.has(`${n}\n${_v(e)}`))continue;let r=f(n,e);yield,a&&r!==null&&r.bars===1&&!d.has(`${t}\n${n}`)&&(p(n,t),yield)}}}}}let bv=[`&leadV loop=C4`,`&leadOut map=midi(1) [&lead * &leadV]`],xv=[`transpose`,`invert`,`bend`,`trim`],Sv=e=>[`&bar meter("${e}") step=120bpm`,`&key scale(ionian, C)`].join(`
`),Cv=({degree:e,alter:t})=>`${e}${(t>0?`#`:`b`).repeat(Math.abs(t))}`;function wv(e,t){let n=[...e].sort((e,t)=>e.step-t.step),r=vv(n.map(e=>e.step),t),i=Array.from({length:t/r.length},(e,t)=>{let i=n.find(e=>e.step===t*r.length);return i?Cv(i):`~`});return[`&lead over=&key step=${r.tap} ${i.join(` `)}`,...bv].join(`
`)}function Tv(e,t){let n=gv(t);if(!n)return null;let r=nh($h(e,Sv(n)).text);if(!r.ok)return null;let i=r.cells.get(`lead`);if(!i?.step)return null;let a=r.cells.get(i.step.driver)?.meter??null,{tap:o}=i.step,s=Tg(o,a);if(s===null||!a||!o||i.steps<1)return null;let c=R(t),l=a.pulses/a.unit/c,u=i.steps*s/(l*c);if(u<1-1e-9)return Ev(e,t,o,i.steps,u);if(Math.abs(u-Math.round(u))>1e-9)return null;let d=Math.round(u),f=[];for(let e of Bp(r,`lead`,gl(r))){if(e.table!==`key`||e.via||e.tableShift!==0||(e.transpose??0)!==0)return null;let t=e.step*s/l,n=Math.round(t);if(Math.abs(t-n)>1e-6||n<0||n>=d*c)return null;f.push({step:n,degree:e.value+0,alter:e.alter+0})}return f.length?{bars:d,notes:f.sort((e,t)=>e.step-t.step)}:null}function Ev(e,t,n,r,i){let a=r/i-r;return Math.abs(a-Math.round(a))>1e-9||Math.round(a)<1?null:Tv(`${e.replace(/^&lead(?=\s)/m,`&leadLine`)}\n&lead step=${n} &leadLine ~@${Math.round(a)}`,t)}function Dv(e){let t=RegExp(`^&${e.id}(?=\\s)`,`m`),n=[Pm(e.text).replace(t,`&lead`),...bv].join(`
`),r=Object.keys(L).find(e=>Tv(n,L[e])),i=r?Tv(n,L[r]).notes[0].degree:0,a=r&&i!==0?Zg(n,{workbench:Sv(r),operators:[`transpose`],degrees:[-i]})[0]:void 0;return{...e,text:a?a.apply(n):n,association:e.association.map(e=>e.facet===`motif`?{...e,facet:qr}:e)}}let Ov=X_.map(Dv);function kv(e=Ov,t=Tv){return{...yv({facet:qr,fragments:e,read:t,text:wv,vary:e=>({workbench:Sv(e),operators:xv,degrees:[2]})}),phrase:(e,t)=>Nv(e,t,Av)}}kv();let Av=Z_.find(e=>e.id===`call and answer`);function jv(e){let t=/^&(\w+)/m.exec(e.text)?.[1],n=Gh(e.text,nh).lines[0];return t&&n?{head:t,hole:n}:null}let Mv=/* @__PURE__ */ new Map;function Nv(e,t,n){let r=R(t);if(r%2!=0||e.some(e=>e.step%2!=0||e.step>=r))return null;let i=Array.from({length:r/2},(t,n)=>{let r=e.find(e=>e.step===2*n);return r?Cv(r):`~`}),a=`${n.id}\n${t.cycle}:${t.heights.join(` `)}\n${i.join(` `)}`;if(!Mv.has(a)){let e=jv(n);Mv.set(a,e&&Tv([n.text,`&leadCall over=&key step=8n ${i.join(` `)}`,`&${e.hole.slice(1)} step=8n &leadCall`,`&lead step=8n &${e.head}`].join(`
`),t))}return Mv.get(a)}let Pv=e=>8/e;function Fv(e){let t=nh(Ac(e.text,`bar`,`step`,`120bpm`)),n=t.diagnostics.filter(e=>e.severity===`error`);if(n.length)return`it doesn't compile: ${n.map(e=>e.message).join(`; `)}`;let r=t.cells.get(`bar`)?.meter;if(!r)return`it has no meter named &bar`;if(r.legato?.length)return`it articulates by level (legato=), which the band does not read`;let i=Pv(r.unit),a=r.beats.reduce((e,t,n)=>[...e,n===0?0:e[n-1]+r.beats[n-1]*i],[]),o={cycle:r.pulses*i,heights:a},s=Object.values(L).find(e=>fn(e,o));if(!s)return`its meter, ${a.length} beats in ${o.cycle} eighths at ${a.join(` `)}, is none of the band's`;let c=r.swing??[];if(c.length>1)return`it swings on more than one level`;let[l]=c;return l?Rn.includes(l.level)?{id:e.id,meter:s,swing:{level:l.level,share:l.share}}:`it swings on ${l.level}, which the band does not`:{id:e.id,meter:s,swing:zn}}H_.map(e=>({id:e.id,read:Fv(e)}));function Iv(e=H_){let t=/* @__PURE__ */ new Map;for(let n of e){let e=Fv(n);typeof e!=`string`&&t.set(n.id,e)}let n=m_([...e.filter(e=>t.has(e.id)),...U_]),r=t.size+U_.length;return{fragments:t,query:(e,i,a=[],o)=>(i?n.query(e,r+i.filed.length,{},{facet:`meter`,layer:i,...a.length?{chosen:a}:{},...o===void 0?{}:{pull:o}}).filter(e=>t.has(e.fragment.id)):n.query(e,t.size,{},{facet:`meter`})).map(e=>({id:e.fragment.id,distance:e.distance})),used:(e,t,r)=>iv(B_(n,e,[{id:t,point:r,facet:`meter`}]))}}let Lv=Iv(),Rv=[...H_,...U_,...W_,...G_,...Ov],zv=e=>Object.keys(L).find(t=>fn(L[t],e))??null,Bv=e=>`&bar meter("${e}") step=120bpm`;function Vv({meter:e,meterFragment:t}){let n=H_.find(e=>e.id===t);if(n)return Ac(n.text,`bar`,`step`,`120bpm`);let r=zv(e);return r?Bv(r):null}function Hv(e){let t=/^&(\w+) \[(.*)\]$/m.exec(e);return t?{line:t[0],name:t[1],terms:t[2].split(`, `)}:null}let Uv=sn,Wv=(e,t,n,r)=>Uv.includes(e)?e:Do(t,n%R(r),r),Gv=e=>Math.abs(e-Math.round(e))<1e-6?Math.round(e):e;function Kv(e,t){return!zv(t)||!Hv(e)?null:qv(e,t,Math.max(1,...Gh(e,nh).clock.map(e=>e.bars)))}function qv(e,t,n,r){let i=zv(t),a=Hv(e);if(!i||!a)return null;let o=Ii(120,t),s=R(t)*n,c=[];for(let n of a.terms){let l=/^&(\w+)/.exec(n)[1];if(r!==void 0&&l!==r)continue;let u=ch($h(hv(e.replace(a.line,`&${a.name} map=midi(10) [${n}]`)),Bv(i)).text),d=Nh(u.result,Oh(u.result));for(let e of sh(u,0,s*o).events)for(let n of Mh(d(e))){let r=Ph(e,n);if(!r||r.channel!==10)continue;let i=Gv(r.at/o);if(!Number.isInteger(i)||i>=s)return null;let a=Wv(l,r.note,i,t);if(a===null)return null;c.push({role:a,...a===l?{}:{line:l},note:r.note,step:i,velocity:r.velocity})}}return{bars:n,hits:Yv(c)}}let Jv=e=>({bars:e.bars,hits:e.hits.map(({role:e,note:t,step:n,velocity:r})=>({role:e,note:t,step:n,velocity:r}))}),Yv=e=>[...e].sort((e,t)=>e.step-t.step||e.note-t.note),Xv=e=>`${e.cycle}:${e.heights.join(` `)}`;function Zv(){let e=ag(2048);return(t,n)=>rg(t,n,e).fits}let Qv=({fragment:e})=>e.association.some(e=>e.facet===`rhythm`),$v=(e=U_)=>e.filter(e=>!e.association.some(e=>e.facet===`rhythm`)||Kv(e.text,L[`4/4`])!==null);function ey(e=U_,t=Zv(),n=Kv){e=$v(e);let r=m_([...e,...H_]),i=new Map(e.map(e=>[e.id,e.text])),a=(e,t)=>i.get(e)??t?.filed.find(t=>t.fragment.id===e)?.fragment.text,o=/* @__PURE__ */ new Map,s=/* @__PURE__ */ new Map,c=/* @__PURE__ */ new Map,l=/* @__PURE__ */ new Map,u=/* @__PURE__ */ new Map,d=/* @__PURE__ */ new Set,f=/* @__PURE__ */ new Map,p=(e,n)=>{let r=`${n.length}:${n}${e}`;return o.has(r)||o.set(r,t(e,n)),o.get(r)},m=e=>`${e.meterFragment??``}\n${Xv(e.meter)}`,h=e=>{let t=m(e);return c.has(t)||c.set(t,Vv(e)),c.get(t)},g=(e,t)=>{let n=`${e}\n${t}`;return l.has(n)||l.set(n,$h(e,t).text),l.get(n)},_=(e,t,n)=>{let r=`${e}\n${t}\n${n}`;if(!u.has(r)){let a=i.get(e);u.set(r,a!==void 0&&a!==t&&$h(a,g(t,n)).renamed.size===0)}return u.get(r)},v=(t,n,a,o,s)=>r.query(t,e.length+H_.length+(n?.filed.length??0),{},{facet:`rhythm`,...n?{layer:n}:{},...a.length?{chosen:a}:{},...s===void 0?{}:{pull:s}}).filter(e=>i.has(e.fragment.id)||e.distance<=o).map(e=>({id:e.fragment.id,text:e.fragment.text,distance:e.distance})),y=(e,t)=>{let r=`${e}\n${Xv(t)}`;return s.has(r)||s.set(r,n(e,t)),s.get(r)},b=(e,t)=>y(e,t)!==null,x=(e,t)=>{let n=`${t.length}:${t}${e}`;return f.has(n)||f.set(n,Zg(e,{workbench:[t,...mv(e)].join(`
`),keep:Ht,fewest:3})),f.get(n)};return{query(e,t,n,r=[],i=1/0,a){let o=h(t);return o===null?[]:v(e,n,r,i,a).filter(e=>p(e.text,o)&&b(e.text,t.meter)).map(({id:e,distance:t})=>({id:e,distance:t}))},layered(e,t,n,r,i=1/0,o=[],s){let c=h(t),l=a(n,r);return c===null||l===void 0?[]:v(e,r,[n,...o],i,s).filter(e=>e.distance<=i&&_(e.id,l,c)&&p(e.text,g(l,c))&&b(e.text,t.meter)).map(({id:e,distance:t})=>({id:e,distance:t}))},used:(e,t,n,i=[])=>iv(B_(r,e,[...av(r,e,t).map(e=>({id:e,point:n,facet:`rhythm`})),...av(r,e,i).map(e=>({id:e}))])),file(e,{hits:t,bench:n,point:i,source:a,created:c,tags:l,varies:u,by:d}){let f=wo(t,R(n.meter)),p=V_(r,e,{text:f,point:i,facet:`rhythm`,source:a,created:c,meta:{tags:[...l],...u===void 0?{}:{varies:u},...d===void 0?{}:{by:d}}}),{meterFragment:m}=n,g=m===void 0?p.layer:B_(r,p.layer,[{id:p.id},{id:m}]),_=`${f}\n${Xv(n.meter)}`;p.file&&!s.has(_)&&s.set(_,{bars:1,hits:Yv(t)});let v=h(n);return p.file&&v!==null&&o.set(`${v.length}:${v}${f}`,!0),{layer:iv(g),id:p.id,held:p.file===null}},read(e,t,n){let r=a(e,n),i=r===void 0?null:y(r,t);return i&&Jv(i)},vary(e,t,n,r){let i=a(e,r),o=h(t),s=i===void 0?null:y(i,t.meter);if(i===void 0||o===null||s===null)return null;let c=x(i,o);if(!c.length)return null;let l=c[n_(n,c.length)],u=l.line.slice(1),d=qv(l.apply(i),t.meter,s.bars,u);return d===null?null:{hits:Jv({bars:s.bars,hits:Yv([...s.hits.filter(e=>(e.line??e.role)!==u),...d.hits])}).hits,by:l.by}},*warm(t,n){let r=[...(n?.filed??[]).filter(Qv).map(e=>e.fragment.text).reverse(),...e.map(e=>e.text)];for(let n of t){let t=c.has(m(n)),i=h(n);if(t||(yield),i!==null)for(let t of r){let r=`${i.length}:${i}${t}`;if(d.has(r))continue;if(d.add(r),!p(t,i)){yield;continue}let a=y(t,n.meter);yield,a!==null&&a.bars===1&&!Yi(a)&&(x(t,i),yield);let o=g(t,i);yield;for(let r of e)_(r.id,t,i)&&(p(r.text,o),y(r.text,n.meter)),yield}}}}}[...[...Lv.fragments.values()].map(e=>({meter:e.meter,meterFragment:e.id})),...Object.values(L).map(e=>({meter:e}))],ey();let ty=[`&bassOut map=midi(2) [&bassline * &bassV]`],ny=e=>[`&bar meter("${e}") step=120bpm`,`&key scale(ionian, C)`,`&harm over=&key step=1m [0,2,4]`].join(`
`),ry=e=>Math.abs(e-Math.round(e))<1e-6?Math.round(e):e,iy=(e,t)=>t===0?e:iy(t,e%t);function ay(e,t){let n=gv(t);if(!n)return null;let r=hv($h(e,[ny(n),...ty].join(`
`)).text),i=nh(r);if(!i.ok)return null;let a=Dg(r,i).filter(e=>e.pitched);if(a.length!==1)return null;let[o]=a;if(o.pitched.table!==`harm`||o.stepWhole===null||!o.meter)return null;let s=Bp(i,o.trigger,gl(i)),c=[];for(let e of o.notes){let t=s.find(t=>Math.abs(t.step-e.step)<1e-9);if(!t||t.table!==`harm`||t.via||t.tableShift<0||t.tableShift>1)return null;c.push({chord:t.tableShift,index:t.value+0,alter:t.alter+0,shift:(t.transpose??0)+0})}if(!c.length)return null;let l=o.meter.pulses/o.meter.unit,u=Math.ceil(l/o.stepWhole-1e-9),d=o.steps/iy(o.steps,u),f=R(t),p=Ii(120,t),m=ch(r),h=Nh(m.result,Oh(m.result)),g=[];for(let e of sh(m,0,d*f*p).events)for(let t of Mh(h(e))){let n=Ph(e,t);if(!n)continue;let r=ry(n.at/p);if(!Number.isInteger(r)||r>=d*f)return null;g.push(r)}return g.sort((e,t)=>e-t),{bars:d,notes:g.map((e,t)=>({step:e,...c[t%c.length]}))}}function oy(e){if(e.alter!==0)throw Error(`lineText: an accidental (${JSON.stringify(e)})`);if(e.chord===0&&e.shift===0)return String(e.index);let t=e.chord===1?`&bassNext`:`&bassRoot`,n=e.shift===0?t:`${t}^$${e.shift}`;return e.index===0?n:e.shift===0?`${t}^${e.index}`:`degree(${n}, ${e.index})`}function sy(e,t){let n=[...e].sort((e,t)=>e.step-t.step),r=vv(n.map(e=>e.step),t),i=Array.from({length:t/r.length},(e,t)=>{let i=n.find(e=>e.step===t*r.length);return i?oy(i):`~`}),a=e=>n.some(t=>oy(t).includes(e));return[`&bassline over=&harm step=${r.tap} ${i.join(` `)}`,...a(`&bassNext`)?[`&bassNext over=&harm[>>] 0`]:[],...a(`&bassRoot`)?[`&bassRoot over=&harm 0`]:[]].join(`
`)}function cy(e=W_,t=ay){return yv({facet:qn,fragments:e,read:t,text:sy,vary:e=>({workbench:ny(e),operators:Kg})})}cy();function ly(e){let{min:t,max:n}=En.bpm;return(Math.log(e)-Math.log(t))/(Math.log(n)-Math.log(t))}kn.map(e=>({name:e.name,at:{...e.style,bpm:ly(e.style.bpm)}}));let uy=[...st.map(e=>({mode:e,steps:c(N(e))})),{mode:`aeolian`,steps:c({cycle:12,heights:[0,2,3,5,7,8,11]})}];function dy(e){let t=nh(`&bar meter("4/4") step=120bpm
&tonic C\n${hv(e.text)}`),n=t.diagnostics.filter(e=>e.severity===`error`);if(n.length)return`it doesn't compile: ${n.map(e=>e.message).join(`; `)}`;let r=t.mainKey===void 0?void 0:t.cells.get(t.mainKey);if(!r?.scan)return`it has no key, a scale(…)`;if(!Gh(e.text,nh).uses.includes(`&tonic`))return`its tonic is fixed, which the key plan sets: scale(…, &tonic) leaves it to the host`;let{lap:i,steps:a}=r.scan,o=uy.find(e=>i===12&&e.steps.join(` `)===a.join(` `))?.mode;return o?{id:e.id,mode:o}:`its scale, ${a.join(` `)}, is none of the composer's modes`}K_.map(e=>({id:e.id,read:dy(e)}));function fy(e=K_){let t=/* @__PURE__ */ new Map;for(let n of e){let e=dy(n);typeof e!=`string`&&t.set(n.id,e)}let n=m_(e.filter(e=>t.has(e.id)));return{fragments:t,query:e=>n.query(e,t.size,{},{facet:`mode`}).map(e=>({id:e.fragment.id,distance:e.distance}))}}fy();let py=e=>[`&bar meter("${e}") step=120bpm`,`&key scale(ionian, C)`].join(`
`),my=({degree:e,alter:t})=>`${e}${(t<0?`b`:`#`).repeat(Math.abs(t))}`,hy=({degree:e,stack:t})=>`[${(t??[0,2,4].map(t=>({degree:e+t,alter:0}))).map(my).join(`,`)}]`,gy=[3,4];function _y(e){let t=Array.from({length:8},(t,n)=>{let r=e.filter(e=>Math.floor(e.step/16)===n),i=e=>r.find(t=>t.step%16===e),a=hy(i(0)),o=i(8);return o&&hy(o)!==a?`[${a} ${hy(o)}]`:a}),n=[];for(let e=0;e<t.length;){let r=1;for(;e+r<t.length&&t[e+r]===t[e];)r++;n.push(r>1?`${t[e]}!${r}`:t[e]),e+=r}return`&harm over=&key step=1m cycle=8 ${n.join(` `)}`}function vy(e,t){let n=gv(t);if(!n)return null;let r=nh($h(e,py(n)).text);if(!r.ok)return null;let i=r.cells.get(`harm`);if(!i?.step)return null;let a=r.cells.get(i.step.driver)?.meter??null,o=Tg(i.step.tap,a);if(o===null||!a)return null;let s=a.pulses/a.unit,c=i.steps*o/s;if(Math.abs(c-8)>1e-9)return null;let l=/* @__PURE__ */ new Map;for(let e of Bp(r,`harm`,gl(r))){if(e.table!==`key`||e.via||e.tableShift!==0||(e.transpose??0)!==0||Math.abs(e.alter)>1)return null;let t=e.step*o/s,n=Math.round(t*16);if(Math.abs(t*16-n)>1e-6||n%8!=0||n<0||n>=128)return null;l.set(n,[...l.get(n)??[],{degree:e.value,alter:e.alter}])}let u=[];for(let[e,t]of[...l].sort(([e],[t])=>e-t)){let n=t.sort((e,t)=>e.degree-t.degree||e.alter-t.alter);if(n.some((e,t)=>t>0&&e.degree===n[t-1].degree))return null;let r=n[0].degree,i=(r%7+7)%7;if(n.map(my).join(` `)===`${r} ${r+2} ${r+4}`)u.push({step:e,degree:i});else if(gy.includes(n.length))u.push({step:e,degree:i,stack:n});else return null}for(let e=0;e<8;e++)if(!u.some(t=>t.step===e*16))return null;return{bars:8,notes:u.filter(e=>e.step%16==0||hy(u.find(t=>t.step===e.step-8))!==hy(e))}}function yy(e=G_,t=vy){return yv({facet:yi,fragments:e,read:t,text:e=>_y(e),bars:8})}yy();let by=e=>t=>t.association.some(t=>t.facet===e);mv([`&kit ${[...new Set(_o.values())].map(e=>`&${e}`).join(` `)}`,...Rv.filter(by(`rhythm`)).map(e=>e.text)].join(`
`)),mv([...ty,...Rv.filter(by(`bass`)).map(e=>e.text)].join(`
`)),os.initial,ii.initial,Un(zn);let xy=e=>s(N(e.mode),e.tonic);function Sy(e){let t=le(xy(e));return t.letter+(t.alteration<0?`b`:`#`).repeat(Math.abs(t.alteration))}let Cy=e=>`scale(${e.mode}, ${Sy(e)})`,wy=(e,t)=>`${e}${(t<0?`b`:`#`).repeat(Math.abs(t))}`,Ty={major:[0,2,4],minor:[0,2,4],diminished:[0,2,4],augmented:[0,2,4],sus2:[0,1,4],sus4:[0,3,4],5:[0,4],6:[0,2,4,5],m6:[0,2,4,5],7:[0,2,4,6],maj7:[0,2,4,6],m7:[0,2,4,6],mMaj7:[0,2,4,6],m7b5:[0,2,4,6],dim7:[0,2,4,6],9:[0,2,4,6,8],maj9:[0,2,4,6,8],m9:[0,2,4,6,8],add9:[0,2,4,8]};function Ey(t,n){let r=N(t.mode),i=w(n).map(e=>e-t.tonic),a=k(i.map(e=>e-i[0])),o=a&&Ty[a],s=He(r,i[0]);if(!o||!s)throw Error(`chordTones: no degrees for ${i.join(` `)}`);return i.map((t,n)=>{let i=s.degree+o[n];return{degree:i,accidental:t-e(r,i)}})}let Dy=e=>`[${e.map(e=>wy(e.degree,e.accidental)).join(`,`)}]`,Oy={16:`1m`,12:`2n.`,8:`2n`,6:`4n.`,4:`4n`,3:`8n.`,2:`8n`,1:`16n`},ky=(e,t)=>t===0?e:ky(t,e%t);function Ay(e,t,n=ln,r=n){let i=e.map(e=>e.step),a=[...i[0]>0?[{text:`~`,length:i[0]}]:[],...i.map((e,r)=>({text:t(r),length:(i[r+1]??n)-e}))],o=a.reduce((e,t)=>ky(e,t.length),n),s=o===r?`1m`:Oy[o],c=s?o:1,l=a.map(({text:e,length:t})=>t===c?e:`${e}@${t/c}`);return`step=${s??`16n`} ${l.join(` `)}`}let jy={comp:48,bass:24,lead:60};function My(e,t,n){let r=t-jy[n]-e.tonic,i=He(N(e.mode),r);return{degree:i.degree,accidental:i.accidental}}let Ny=(t,n,r)=>jy[r]+t.tonic+e(N(t.mode),n.degree)+n.accidental;function Py(e,t){let n=t.map(e=>e-60),r=C(n),a=k(n.map(e=>e-n[0]));if(r&&a)return Ue(xy(e),{root:i(n[0],12),quality:a})}function Fy(e){return Object.keys(L).find(t=>fn(L[t],e.meter))}function Iy(e){return e.chords.map(t=>({step:Dt(e.meter,t.slot.step),numeral:Fe(Pe(jt(t,e.plan.key)))}))}function Ly(e){let t=String(e).replace(/^0/,``);for(let n=2;n<=100;n++){let r=Math.round(e*n);if(r/n===e)return`${r}/${n}`.length<t.length?`${r}/${n}`:t}return t}let Ry=e=>e.heights.map((t,n)=>(e.heights[n+1]??e.cycle)-t),zy=(e,t)=>t!==`8n`||Ry(e).includes(2);function By(e,t){if(t.share===zn.share||!zy(e,t.level))return``;let n=t.level===`8n`&&Ry(e).some(e=>e!==2);return` swing=${t.level}:${Ly(t.share)}${n?`:pairs`:``}`}function Vy(e,t,n){let r=Math.floor(n.n/t.length),i=t[n.n-r*t.length],a=N(e.mode).heights.length;return{degree:i.degree+r*a+n.alter,accidental:i.accidental}}let Hy=[0,1,-1,2,-2],Uy=Array.from({length:41},(e,t)=>t%2?(t+1)/2:t&&-t/2);function Wy(e,t,n,r){for(let i of Hy)for(let a of Uy)if(Ny(e,Vy(e,t,{n:a,alter:i}),r)===n)return{n:a,alter:i};return null}let Gy=e=>`${e} performer`,Ky=e=>e===`drums`?`&drums, &drumsOut from "${Gy(`drums`)}" &drumlines`:`&${e}, &${e}Out from "${Gy(e)}"(${e}Level=&${e}Level) &${e}line`,qy=(e,t)=>e.part.localeCompare(t.part)||(Math.abs(e.step-t.step)<1e-6?0:e.step-t.step)||e.note-t.note,Jy=e=>[...e].sort(qy);function Yy(e){return Jy(e.written.map(t=>({part:t.part===`pad`||t.part===`stab`?`comp`:t.part,line:t.part,...t.role?{role:t.role}:{},step:t.step,note:t.note,velocity:Math.round(xa(e,t)),written:t.length,length:qi(e,t)})))}let Xy=e=>e.lines.map(e=>e.text).join(`
`),Zy=(e,t)=>t===1?e:`${e}@${t}`,Qy=(e,t)=>{let n=``;for(let e=t+1;e>0;e=Math.floor((e-1)/26))n=String.fromCharCode(65+(e-1)%26)+n;return`${e}${n}`};function $y(e,t,n){let r=[];for(let e of t){let t=r.at(-1);t&&t.text===`~`&&e.text===`~`?r[r.length-1]={...t,length:t.length+e.length}:r.push(e)}let i={words:r.map(e=>Zy(e.text,e.length)).join(` `),cells:[]},a=[];for(let e of r){let t=(Math.floor(e.at/n)+1)*n-e.at;if(e.length>t&&e.text!==`~`)return i;for(let t=e.at,r=e.length;r>0;){let i=Math.floor(t/n),o=Math.min(r,(i+1)*n-t);(a[i]??=[]).push(Zy(e.text,o)),t+=o,r-=o}}let o=a.map(e=>e.join(` `)),s=/* @__PURE__ */ new Map;for(let e of o)s.set(e,(s.get(e)??0)+1);let c=/* @__PURE__ */ new Map;for(let[t,n]of o.entries())s.get(n)>1&&!c.has(n)&&a[t].some(e=>!e.startsWith(`~`))&&n.length>e.length+2&&c.set(n,Qy(e,c.size));if(c.size===0)return i;let l=[];for(let e=0;e<o.length;){let t=c.get(o[e]);if(!t){l.push(o[e++]);continue}let n=1;for(;o[e+n]===o[e];)n++;l.push(n===1?`&${t}`:`&${t}!${n}`),e+=n}return{words:l.join(` `),cells:[...c].map(([e,t])=>`&${t} ${e}`)}}let eb=e=>String(Number(e.toPrecision(12))).replace(/^0\./,`.`);function tb(e,{tempo:t=`held`}={}){let n=e.map(e=>({meter:Fy(e),bpm:e.style.bpm,swing:By(e.meter,e.swing),key:Cy(e.plan.key),melodic:e.plan.melodic})),r=t===`held`?[`meter`,`bpm`,`swing`,`key`,`melodic`]:[`meter`,`swing`,`key`,`melodic`];for(let[e,t]of n.entries())for(let i of r)if(t[i]!==n[0][i])throw Error(`a section's ${i} changes at its bar ${e} (${n[0][i]} to ${t[i]}): one text holds one`);return n[0]}function nb(e,t){let n=ut(e).heights[0];return ft(e,t).heights.map(t=>{let r=He(N(e.mode),t-n);return{degree:r.degree,accidental:r.accidental}})}function rb(e,t){return e.flatMap((e,n)=>Iy(e).map(e=>({step:n*t+e.step,numeral:e.numeral})))}let ib=(e,t)=>Array.from({length:e},(e,n)=>({at:n,length:1,text:t(n)})),ab=e=>e>=127?``:`:0:${vo(e)}`;function ob(e,t,n,r){let i=[],a=[];for(let o of sn){let s=e.filter(e=>e.role===o);if(s.length===0)continue;let c=e=>s.filter(t=>Math.floor(t.at/n)===e),l=r&&o===`euclid`?Array.from({length:t},(e,t)=>{let r=c(t);if(r.length===0)return`~`;if(new Set(r.map(e=>e.note)).size!==1)return null;let i=yo(r.map(e=>e.step),n);return i&&`&${_o.get(r[0].note)}(${i.k},${n},${i.r})`}):null;if(l&&l.every(e=>e!==null)){i.push(`&${o} step=1m ${l.join(` `)}`);let e=new Set(s.map(e=>e.velocity)),r=Array.from({length:t},(e,t)=>[...new Set(c(t).map(e=>e.velocity))]);if(e.size===1){let e=s[0].velocity;a.push(e>=127?`&${o}`:`&${o} * ${vo(e)}`)}else if(r.every(e=>e.length<=1))i.push(`&${o}Level map=amp step=1m ${r.map(e=>e.length?vo(e[0]):`0`).join(` `)}`),a.push(`&${o} * &${o}Level`);else{let e=e=>s.find(t=>t.at===e)?.velocity,r=$y(`${o}Level`,ib(t*n,t=>e(t)?vo(e(t)):`0`),n);i.push(...r.cells,`&${o}Level map=amp step=16n ${r.words}`),a.push(`&${o} * &${o}Level`)}continue}let u=e=>$y(o,ib(t*n,t=>{let n=s.filter(e=>e.at===t).map(t=>`&${_o.get(t.note)}${e(t.velocity)}`);return n.length===0?`~`:n.length===1?n[0]:`[${n.join(`,`)}]`}),n),d=u(ab),f=[...d.cells,`&${o} step=16n ${d.words}`],p=/* @__PURE__ */ new Map;if(s.every(e=>{let t=e.at%n;return(p.get(t)??e.velocity)===e.velocity&&(p.set(t,e.velocity),!0)})){let e=u(()=>``),r=[...e.cells,`&${o} step=16n ${e.words}`,`&${o}LevelA ${$y(`${o}Level`,ib(n,e=>p.has(e)?vo(p.get(e)):`~`),n).words.replace(/~/g,`0`)}`,`&${o}Level map=amp step=16n &${o}LevelA${t>1?`!${t}`:``}`],s=`&${o} * &${o}Level`;if(r.join(`
`).length+s.length<f.join(`
`).length+o.length+1){i.push(...r),a.push(s);continue}}i.push(...f),a.push(`&${o}`)}return{lines:i,terms:a,voices:[...new Set(e.map(e=>_o.get(e.note)))]}}function sb(e,t,n,r,i,a,o,s,c){let l=[...new Set(t.map(e=>e.at))].sort((e,t)=>e-t),u=[],d=[],f=[],p=[],m=[],h=0,g=0,_=e=>{for(let t of[u,d,f,p])t.push({at:g,length:e,text:`~`})};for(let[i,v]of l.entries()){v>g&&_(v-g),g=v;let y=t.filter(e=>e.at===v),b=Math.max(...y.map(e=>e.written)),x=Math.min(b,(l[i+1]??r)-v);x<b&&c.push({line:e,step:v,written:b,stated:x});let S=e=>({at:v,length:x,text:e.length===1?e[0]:`[${e.join(`,`)}]`});u.push(S(y.map(e=>{let t=My(n,e.note,a);return wy(t.degree,t.accidental)})));let C=s===`key`?null:o(v);d.push(S(y.map(e=>{let t=C&&Wy(n,C,e.note,a);return t?(t.alter!==0&&h++,wy(t.n,t.alter)):(s!==`key`&&m.push({step:v,note:e.note}),`?`)}))),f.push({at:v,length:x,text:vo(y[0].velocity)}),p.push({at:v,length:x,text:eb(y[0].length/y[0].written)}),g=v+x}g<r&&_(r-g);let v=s!==`key`&&m.length===0?s:`key`,y=new Set(t.map(e=>e.velocity)).size===1,b=[...new Set(t.map(e=>eb(e.length/e.written)))],x=b.length>1?` legato=&${e}Share`:b[0]===`1`?``:` legato=${b[0]}`,S=$y(`${e}line`,v===`key`?u:d,i),C=$y(`${e}Share`,p,i),w=$y(`${e}Level`,f,i);return{lines:[...S.cells,`&${e}line over=&${v} step=16n${x} ${S.words}`,...b.length>1?[...C.cells,`&${e}Share step=16n ${C.words}`]:[],...y?[]:w.cells,`&${e}Level map=amp ${y?vo(t[0].velocity):`step=16n ${w.words}`}`],pitched:{part:e,table:v,accidentals:v===`key`?0:h,unreached:m,shares:b.length}}}function cb(e,{euclid:t=e[0].swing.share===zn.share,table:n=`harm`,lead:r=`melo`,tempo:i=`held`}={}){let a=tb(e,{tempo:i}),o=e[0].plan.key,s=R(e[0].meter),c=e.length*s,l=e.flatMap((e,t)=>Yy(e).map(e=>({...e,at:t*s+e.step}))),u=[],d=[],f=rb(e,s),p=e=>Ey(o,rt(o,Pe(e))),m=[{part:`meter`,text:`&bar meter("${a.meter}") step=${a.bpm}bpm${a.swing}`},{part:`key`,text:`&key ${a.key}`},{part:`harmony`,text:`&harm over=&key ${Ay(f,e=>Dy(p(f[e].numeral)),c,s)}`}],h=e=>{let t=f.findLast(t=>t.step<=e);return t?p(t.numeral):null},g=ob(l.filter(e=>e.part===`drums`),e.length,s,t);m.push(...g.lines.map(e=>({part:`drums`,text:e})),...g.terms.length?[{part:`drums`,text:`&drumlines [${g.terms.join(`, `)}]`},{part:`drums`,text:Ky(`drums`)}]:[]);let _={},v=lv(e[0].style),y=[],b=(e,t,n,r,i)=>{let a=l.filter(t=>t.line===e);if(a.length===0)return;let f=sb(e,a,o,c,s,n,r,i,u);d.push(f.pitched),_[e]=!0,m.push(...f.lines.map(e=>({part:t,text:e})),{part:t,text:Ky(e)});let p=v[e];p&&(m.push({part:t,text:p.line}),y.push(e))};b(`bass`,`bass`,`bass`,h,n),b(`pad`,`comp`,`comp`,h,n),b(`stab`,`comp`,`comp`,h,n);let x=a.melodic,S=x===`plain`||r===`key`,C=nb(o,x);if(!S&&l.some(e=>e.line===`lead`)&&m.push({part:`lead`,text:`&melo over=&key step=1m ${Dy(C)}`}),b(`lead`,`lead`,`lead`,()=>C,S?`key`:`melo`),_.lead){let e=m.findIndex(e=>e.text.startsWith(`&melo `));e>=0&&d.find(e=>e.part===`lead`).table===`key`&&m.splice(e,1)}let w=[`pad`,`stab`].filter(e=>_[e]),T=w.length===0?`~`:w.length===1?`&${w[0]}Out`:`[${w.map(e=>`&${e}Out`).join(`, `)}]`;return m.push({part:`card`,text:`&out map=midi ${_.lead?`&leadOut`:`~`} ${_.bass?`&bassOut`:`~`} ${T} ~!6 ${g.terms.length?`&drumsOut`:`~`}`}),y.length&&m.push({part:`card`,text:`&heard map=sample [${y.map(e=>`&${e}Out`).join(`, `)}]`}),{lines:m,pitched:d,cuts:u}}let lb={lead:1,bass:2,comp:3,drums:10},ub=e=>[...new Set(e.map(e=>(e%12+12)%12))].sort((e,t)=>e-t),db=[`&lap step=1m 0`,`&readV loop=C4`,`&read map=midi ~!14 [&lap * &readV] [&harm * &readV]`].join(`
`);function fb(e,t,n){let r=e.tracks.find(e=>e.output.id===t);if(!r)return 1;let i=r.share;if(typeof i==`number`)return i;let a=i.series.reduce((t,r)=>{let i=Kp(e,r,n);return t*(i?i.value+i.alter:1)},1);return i.range?i.range[0]+(i.range[1]-i.range[0])*a:a}function pb(e,t){let[n,r,i]=(e??``).split(`:`),a=t?.outputs.find(t=>t.id===e),o=a?[...a.via,...a.through]:[],s=t?.performers.find(e=>e.role!==void 0&&o.includes(e.name))?.role,c=n===`kit`?{role:i}:{};return s?{line:s,...s===`drums`?c:{}}:n===`kit`?{line:`drums`,...c}:{line:r}}let mb=[`lpf`,`lpq`,`hpf`,`hpq`];function hb(e,t){let n=t.cells.get(e.voice),r=n?.params.s===void 0?void 0:rl[String(n.params.s)];if(!n||r!==`sine`&&r!==`triangle`&&r!==`sawtooth`&&r!==`square`)return;let i={};for(let e of mb){let t=n.params[e],r=typeof t==`number`?t:n.paramCells[e]?.range?.[0];r!==void 0&&(i[e]=r)}let a=e.bends.map(t=>({at:t.at-e.at,cents:t.cents}));return{wave:r,...i,...e.env&&{env:e.env},...a.length>0&&{bends:a}}}let gb=e=>ch(`${e}\n${db}`,void 0,{resolve:tv});function _b(e,t,n=gb(e)){let r=R(t[0].meter),i=t.length*r*Ii(t[0].style.bpm,t[0].meter),a=Nh(n.result,Oh(n.result)),o=sh(n,0,i*1.25).events.flatMap(e=>Mh(a(e)).flatMap(t=>{let r=Ph(e,t);return r?[{...r,share:fb(n,e.output,e.at),...pb(e.output,n.result),sound:pb(e.output,n.result).line===`drums`?void 0:hb(e,n.result)}]:[]})),s=[...new Set(o.filter(e=>e.channel===15).map(e=>e.at))].sort((e,t)=>e-t).slice(0,t.length+1),c=s[t.length],l=e=>s.findLastIndex(t=>t<=e+1e-9),u=t.map(()=>({timed:[]})),d=t.map(()=>/* @__PURE__ */ new Map);for(let e of o){if(e.at>=c-1e-9)continue;let n=l(e.at),i=t[n],a=s[n],o=(s[n+1]-a)/r,f=Ln(Bn(i.swing),i.meter),p=e=>f.written((e-a)/o);if(e.channel===16){let t=Math.round(p(e.at));d[n].set(t,[...d[n].get(t)??[],e.note]);continue}let m=Object.keys(lb).find(t=>lb[t]===e.channel);if(!m)continue;let h=p(e.at);u[n].timed.push({at:e.at,share:e.share,onset:(e.at-a)/o,end:(e.end-a)/o,line:e.line,role:e.role,sound:e.sound,note:{part:m,step:h,note:e.note,velocity:e.velocity,written:(p(e.end)-h)/e.share,length:p(e.end)-h}})}return{bars:u.map(({timed:e})=>(e.sort((e,t)=>qy(e.note,t.note)),{notes:e.map(e=>e.note),at:e.map(e=>e.at),shares:e.map(e=>e.share),onsets:e.map(e=>e.onset),ends:e.map(e=>e.end),lines:e.map(e=>e.line),roles:e.map(e=>e.role),sounds:e.map(e=>e.sound)})),chords:d.map((e,n)=>[...e].sort(([e],[t])=>e-t).map(([e,r])=>{let i=Py(t[n].plan.key,r.sort((e,t)=>e-t));return{step:e,numeral:i?Fe(i):`?`,pitchClasses:ub(r)}})),laps:s,diagnostics:n.result.diagnostics.map(e=>e.message)}}function vb(e){let t=3735928559,n=1103547991;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,2654435761),n=Math.imul(n^i,1597334677)}return t=Math.imul(t^t>>>16,2246822507),t^=Math.imul(n^n>>>13,3266489909),n=Math.imul(n^n>>>16,2246822507),n^=Math.imul(t^t>>>13,3266489909),(4294967296*(2097151&n)+(t>>>0)).toString(16)}let yb=e=>vb(JSON.stringify([Yy(e),Iy(e),Cy(e.plan.key),e.plan.melodic,Fy(e),By(e.meter,e.swing)])),bb=e=>({meter:e.meter,swing:e.swing,bpm:e.style.bpm,key:e.plan.key}),xb=({meter:e,swing:t,bpm:n,key:r},i)=>Array.from({length:i},()=>({meter:e,swing:t,style:{bpm:n},plan:{key:r}}));function Sb(e,t=e=>e,n=()=>performance.now()){let r=n(),i=e.map(yb),a=bb(e[0]),o,s;try{let n=cb(e,{tempo:`first`});o=t(Xy(n));let r=R(e[0].meter);s=[...new Set(n.cuts.map(e=>Math.floor(e.step/r)))]}catch(e){return{source:``,frame:a,foreseen:i,played:null,cut:[],error:null,unstated:String(e instanceof Error?e.message:e).replace(/^a section's (\w+) changes at its bar.*$/,`the section's $1 moves between its bars: one text states one`),cost:{build:n()-r,compile:0,play:0}}}let c=n()-r,l=Cb({bar:e[0].bar,step:0,text:o,unstated:null,frame:a,foreseen:i,cut:s},n);return{...l,cost:{...l.cost,build:c}}}function Cb(e,t=()=>performance.now()){let{text:n,frame:r,foreseen:i,cut:a,unstated:o}=e,s={source:n,frame:r,foreseen:i,unstated:o,played:null,cut:a,error:null};if(o!==null)return{...s,cost:{build:0,compile:0,play:0}};let c=t();try{let e=gb(n),a=t(),o=_b(n,xb(r,i.length),e),l=t();return{...s,played:o,cost:{build:0,compile:a-c,play:l-a}}}catch(e){return{...s,error:String(e),cost:{build:0,compile:t()-c,play:0}}}}let wb=[`&bar meter("4/4") step=120bpm`,`&key scale(aeolian, A)`,`&harm over=&key step=1m [0,2,4] [5,7,9]`,`&kick step=16n &bd:0:.4 ~ ~ ~`,`&drumlines [&kick]`,`&drums, &drumsOut from "drums performer" &drumlines`,`&bassline over=&harm step=16n legato=.6 0@4 3@4`,`&bassLevel map=amp step=16n .4@8`,`&bass, &bassOut from "bass performer"(bassLevel=&bassLevel) &bassline`,`&out map=midi ~ &bassOut ~!7 &drumsOut`].join(`
`);function Tb(){return gb(wb).result.diagnostics}function Eb(e){return`warm`in e?(Tb(),{id:e.id,stated:null}):{id:e.id,stated:`given`in e?Cb(e.given):Sb(e.bars)}}let Db=self;Db.onmessage=({data:e})=>Db.postMessage(Eb(e))})();