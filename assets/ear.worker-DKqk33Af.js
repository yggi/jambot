(function(){function e(e,t){let n=e.heights.length;return e.cycle*Math.floor(t/n)+e.heights[u(t,n)]}function t(e,t){let{cycle:n,heights:r}=e,i=Math.floor((t-r[0])/n),a=t-i*n;return r.length*i+r.filter(e=>e<=a).length-1}function n(e,n){return t(e,n-1)+1}function r(r,i){let a=t(r,i),o=n(r,i);return i-e(r,a)<=e(r,o)-i?a:o}function i(e,t){return u(e,t)}function a(e,t,n){let r=n-u(n-e,t);return n-r<=r+t-n?r:r+t}function o(e){return e.heights.map(t=>i(t,e.cycle)).sort((e,t)=>e-t)}function s(e,t){return{cycle:e.cycle,heights:e.heights.map(e=>e+t)}}function c(t){return t.heights.map((n,r)=>e(t,r+1)-e(t,r))}function l(t,n){if(t.cycle!==n.heights.length)throw Error(`compose: the inner helix has cycle ${t.cycle}, but the outer has ${n.heights.length} degrees`);return{cycle:n.cycle,heights:t.heights.map(t=>e(n,t))}}function u(e,t){return(e%t+t)%t}function d(e,t,n=0){let r=[];for(let n=0;n<t;n++)n*e%t<e&&r.push(n);return s({cycle:t,heights:r},n)}function f(e,t){for(let n=0;n<t;n++)if(u(n*e,t)===u(1,t))return n;throw Error(`generator: ${e} and ${t} are not coprime, so ${e} of ${t} has no generator`)}let p={"2nd":`second`,"3rd":`third`,"4th":`fourth`,"5th":`fifth`,"6th":`sixth`,"7th":`seventh`,"9th":`ninth`,"11th":`eleventh`,"13th":`thirteenth`},m={maj:`major`,min:`minor`,dim:`diminished`,aug:`augmented`,dom:`dominant`,sus:`suspended`,alt:`altered`,pent:`pentatonic`,harm:`harmonic`,mel:`melodic`,phryg:`phrygian`,mixolyd:`mixolydian`},h=/(?:^| )(♭|flat|♯|sharp|♮|natural) ?(?=\d)/g,g={"♭":`b`,flat:`b`,"♯":`#`,sharp:`#`,"♮":`n`,natural:`n`};function _(e){return e.toLowerCase().replace(/\./g,` `).replace(/[\s_-]+/g,` `).trim().replace(h,(e,t)=>e.startsWith(` `)?` ${g[t]}`:g[t]).split(` `).map(e=>p[e]??m[e]??e).join(` `)}function v(t,n){return[...new Set(t.heights.map((r,i)=>e(t,i+n)-e(t,i)))].sort((e,t)=>e-t)}let y=d(7,12);v(y,0),v(y,1),v(y,2),v(y,3),v(y,4),v(y,5);function b(e){return Math.round(12*Math.log2(e))}let x=(e,t,n)=>({stack:e,symbols:t,words:n}),S={major:x([0,4,7],[``,`maj`,`M`],[`major`,`major triad`]),minor:x([0,3,7],[`m`,`min`,`-`],[`minor`,`minor triad`]),diminished:x([0,3,6],[`dim`,`°`,`o`],[`diminished`,`diminished triad`]),augmented:x([0,4,8],[`aug`,`+`],[`augmented`,`augmented triad`]),sus2:x([0,2,7],[`sus2`],[`suspended second`]),sus4:x([0,5,7],[`sus4`,`sus`],[`suspended fourth`,`suspended`]),5:x([0,7],[`5`],[`power chord`,`power`]),6:x([0,4,7,9],[`6`,`maj6`],[`sixth`,`major sixth`]),m6:x([0,3,7,9],[`m6`,`min6`,`-6`],[`minor sixth`]),7:x([0,4,7,10],[`7`,`dom7`,`Mm7`],[`seventh`,`dominant seventh`,`dominant`]),maj7:x([0,4,7,11],[`maj7`,`M7`,`Δ`,`Δ7`,`ma7`,`MM7`],[`major seventh`]),m7:x([0,3,7,10],[`m7`,`min7`,`-7`,`mm7`],[`minor seventh`]),mMaj7:x([0,3,7,11],[`mMaj7`,`m(maj7)`,`mM7`,`minMaj7`],[`minor major seventh`]),m7b5:x([0,3,6,10],[`m7b5`,`m7♭5`,`ø`,`ø7`,`min7b5`,`-7b5`],[`half diminished`,`half diminished seventh`]),dim7:x([0,3,6,9],[`dim7`,`°7`,`o7`],[`diminished seventh`]),9:x([0,4,7,10,14],[`9`,`dom9`],[`ninth`,`dominant ninth`]),maj9:x([0,4,7,11,14],[`maj9`,`M9`,`Δ9`],[`major ninth`]),m9:x([0,3,7,10,14],[`m9`,`min9`,`-9`],[`minor ninth`]),add9:x([0,4,7,14],[`add9`],[`add nine`,`added ninth`]),harmonics:x([1,2,3,4,5].map(b),[],[`harmonics`,`harmonic series`])};function C(e){return[...e.helix.heights,...e.tensions]}let w=/* @__PURE__ */ new Map,T=/* @__PURE__ */ new Map,E=/* @__PURE__ */ new Map,D=(e,t,n)=>{e.has(t)||e.set(t,n)};for(let[e,t]of Object.entries(S)){for(let n of t.symbols)D(w,n,e),D(E,n.toLowerCase(),e);for(let n of t.words)D(T,_(n),e)}function O(e){let t=e.join();return Object.entries(S).find(([,e])=>e.stack.join()===t)?.[0]}function k(e){return u(e*f(7,12),12)}function A(t,n){return{cycle:t.cycle,heights:t.heights.map((r,i)=>e(t,i+n))}}function j(e){return e.heights.map((t,n)=>A(e,n))}function M(e){let t=e.heights[0];return e.heights.reduce((e,n)=>e+n-t,0)}let N=[`lydian`,`ionian`,`mixolydian`,`dorian`,`aeolian`,`phrygian`,`locrian`],ee=j(d(7,12)).map(t=>s(t,-e(t,0))).sort((e,t)=>M(t)-M(e));function P(e){return ee[N.indexOf(e)]}P(`ionian`).heights;function te(e,t){return s(t,e.heights[0]-t.heights[0])}function ne(e,t){let{cycle:n}=e,r=e.heights[0],s=new Set(o(e)),c=e.heights.length,l=re(c,n)?f(c,n):1,u=i(r,n),d=-1/0;for(let e=0;e<n;e++){let a=o(te({cycle:n,heights:[e]},t)).filter(e=>s.has(e)).length,c=F(e-r,l,n),f=a*4*n*n-c*2-(e===i(r,n)?0:1);f>d&&(d=f,u=e)}return te({cycle:n,heights:[a(u,n,r)]},t)}P(`ionian`).heights;function re(e,t){return t===0?e===1:re(t,e%t)}function F(e,t,n){for(let r=0;r<=n;r++)if(i(r*t-e,n)===0||i(-r*t-e,n)===0)return r;return n}let I={"2/4":d(2,4),"3/4":d(3,6),"4/4":d(4,8),"2/2":d(2,8),"5/4":d(5,10),"5/8":d(2,5),"6/8":d(2,6),"7/8":d(3,7),"9/8":d(3,9),"10/8":d(4,10),"12/8":d(4,12)};function ie(e){return e.heights.length}function ae(e){let t=new Set(e.heights);return Array.from({length:e.cycle},(e,n)=>n===0?`downbeat`:t.has(n)?`pulse`:`subdivision`)}function L(e,t=2){return e.cycle*t}function oe(e,t=2){return l(e,d(e.cycle,t*e.cycle))}let se=[`downbeat`,`half`,`pulse`,`between`];function ce(e,t){let n=Array(e).fill(1/0),r=(e,i,a)=>{n[e]=Math.min(n[e],a);let o=i-e;if(o<=3){for(let t=e;t<i;t++)n[t]=Math.min(n[t],a+1);return}let s=d(2,o).heights[1],c=e+(t?o-s:s);r(e,c,a+1),r(c,i,a+1)};return r(0,e,1),n}function le(e,t=!1){let n=ce(e.heights.length,t),r=ae(e).map(()=>`between`);e.heights.forEach((e,t)=>{r[e]=se[Math.min(n[t],se.length)-1]});let i=se[Math.min(Math.max(...e.heights.map(e=>se.indexOf(r[e])))+1,se.length-1)];return c(e).forEach((t,n)=>{if(!(t<4||t%2==1))for(let a=2;a<t;a+=2)r[e.heights[n]+a]=i}),r}function ue(e){return{cycle:e.cycle,heights:e.onsets}}function de(e,t){let{cycle:n,onsets:r,degrees:i,accidentals:a,accents:o}=t,s=r.map((t,s)=>{let c=r[s+1]??r[0]+n,l=i[s];return{onset:u(e.rev?e.late-c:e.late+t,n),degree:l===null?null:e.strans+(e.mirror?-l:l),accidental:e.mirror?0-a[s]:a[s],accent:o?.[s]??0}});return s.sort((e,t)=>e.onset-t.onset),fe({cycle:n,onsets:s.map(e=>e.onset),degrees:s.map(e=>e.degree),accidentals:s.map(e=>e.accidental)},o&&s.map(e=>e.accent))}function fe(e,t){return t?.some(e=>e!==0)?{...e,accents:t}:e}function pe(e,t){let n=t.mirror?-1:1,r=t.rev?-1:1;return{strans:t.strans+n*e.strans,mirror:e.mirror!==t.mirror,late:t.late+r*e.late,rev:e.rev!==t.rev}}function me(e,t){let n=[],r=e=>`${e.degrees.filter(e=>e===null).length}|${[...c(ue(e))].sort((e,t)=>e-t)}`;if(e.cycle!==t.cycle||e.onsets.length!==t.onsets.length||r(e)!==r(t))return n;let i=e=>`${e.onsets}|${e.degrees.map(e=>e!==null)}|${e.accidentals}|${e.accents??``}`,a=i(t),o=t.degrees.findIndex(e=>e!==null);for(let r of[!1,!0])for(let s of[!1,!0]){let c=de({strans:0,mirror:s,late:0,rev:r},e).onsets,l=[...new Set(c.map(n=>u(t.onsets[0]-n,e.cycle)))];for(let c of l.sort((e,t)=>e-t)){let l=de({strans:0,mirror:s,late:c,rev:r},e);if(i(l)!==a)continue;let u=t.degrees[o]-l.degrees[o];l.degrees.every((e,n)=>e===null||e+u===t.degrees[n])&&n.push({strans:u,mirror:s,late:c,rev:r})}}return n}function he(e){return me(e,e)}function ge(e,t,n=he(t)){let r=e=>(Number(e.rev)*2+Number(e.mirror))*t.cycle+e.late,i;for(let a of n){let n=pe(a,e),o={...n,late:u(n.late,t.cycle)};(!i||r(o)<r(i))&&(i=o)}return i}function _e(e){let{cycle:t,onsets:n,degrees:r,accidentals:i}=e;return{cycle:t,onsets:n,degrees:r,accidentals:i}}function ve(e,t){let n=_e(t),[r]=me(n,_e(e));return r===void 0?null:ge(r,n)}let ye={major:[!0,``],minor:[!1,``],diminished:[!1,`°`],augmented:[!0,`+`],sus2:[!0,`sus2`],sus4:[!0,`sus4`],5:[!0,`5`],6:[!0,`6`],m6:[!1,`6`],7:[!0,`7`],maj7:[!0,`maj7`],m7:[!1,`7`],mMaj7:[!1,`maj7`],m7b5:[!1,`ø7`],dim7:[!1,`°7`],9:[!0,`9`],maj9:[!0,`maj9`],m9:[!1,`9`],add9:[!0,`add9`]};new Map(Object.entries(ye).map(([e,[t,n]])=>[`${t}${n}`,e]));function be(e){let t=c(e);return Math.max(...t)-Math.min(...t)}let xe={ionian:`LLsLLLs`,aeolian:`LsLLsLL`};function Se(e,t,n){let r=c(e),i=Math.max(...r),a=r.map(e=>e===i?`L`:`s`).join(``),o=A(e,[0,1,2,3,4,5,6].find(e=>a.slice(e)+a.slice(0,e)===xe[t]));return s(o,n-o.heights[0])}function Ce(e,t){return t?Se(e,t.minor?`aeolian`:`ionian`,we(e,t.degree,t.accidental)):e}function we(t,n,r,i=be(t)){return e(t,n)+r*i}function Te(t,n){if(t.heights.length!==7)return;let r=Se(t,`ionian`,t.heights[0]),a=be(t),o=(t,n)=>i(e(t,n),t.cycle),s=i(n,t.cycle),c=(e,n)=>i(o(t,e)+n*a,t.cycle)===s,l=[0,1,2,3,4,5,6],u=(r,i)=>({degree:r+7*((n-i*a-e(t,r))/t.cycle),accidental:i}),d=l.find(e=>c(e,0));if(d!==void 0)return u(d,0);let f=l.find(e=>o(r,e)===s);if(f!==void 0){for(let e of[-1,1])if(c(f,e))return u(f,e)}let p=l.find(e=>c(e,-1));if(p!==void 0)return u(p,-1);let m=l.find(e=>c(e,1));return m===void 0?void 0:u(m,1)}function Ee(e,t,n){if(!(t.quality in ye)||e.heights.length!==7)return;let r=Te(Ce(e,n),t.root);if(r)return{degree:i(r.degree,7),accidental:r.accidental,quality:t.quality,...n&&{of:n}}}d(3,8),d(5,8,6),d(5,16,6),d(4,16),d(2,16,4),d(7,16);let De=(t,n)=>s(A(t,n),-e(t,n)),Oe=e=>({cycle:12,heights:e}),ke={ionian:[`major`,`ION`],dorian:[`DOR`],phrygian:[`PHR`],lydian:[`LYD`],mixolydian:[`MIX`],aeolian:[`minor`,`natural minor`,`AEO`],locrian:[`LOC`]},Ae=Object.fromEntries(N.map(e=>[e,{helix:P(e),aliases:ke[e]??[]}]));function je(e,t){return Object.fromEntries(t.map(([t,n],r)=>[t,{helix:De(e,r),aliases:n}]))}let Me=De(d(5,12),3),Ne=d(8,12),Pe={...Ae,...je(Me,[[`major pentatonic`,[`pentatonic`,`pentatonic major`,`PENT`]],[`suspended pentatonic`,[`suspended`,`egyptian`]],[`man gong`,[`malkos raga`,`MGNG`]],[`ritsusen`,[`ritusen`,`RITS`]],[`minor pentatonic`,[`pentatonic minor`,`vietnamese 2`,`MPEN`]]]),"whole tone":{helix:d(6,12),aliases:[`wholetone`,`messiaen's mode #1`,`WTON`]},chromatic:{helix:d(12,12),aliases:[`CHR`]},diminished:{helix:Ne,aliases:[`whole half`,`whole half diminished`]},"half whole diminished":{helix:De(Ne,1),aliases:[`half whole`,`dominant diminished`,`octatonic`,`messiaen's mode #2`,`HWD`]},...je(Oe([0,3,5,6,7,10]),[[`blues`,[`minor blues`,`BLUE`]],[`major blues`,[`MBLU`]]]),...je(Oe([0,2,3,5,7,8,11]),[[`harmonic minor`,[`HMIN`]],[`locrian natural 6`,[`locrian 6`,`locrian #6`,`LOC6`]],[`ionian #5`,[`ionian augmented`,`major augmented`,`major #5`,`ION5`]],[`dorian #4`,[`ukrainian dorian`,`romanian minor`,`altered dorian`,`DOR4`]],[`phrygian dominant`,[`spanish phrygian`,`spanish`,`phrygian major`,`PDOM`]],[`lydian #2`,[`lydian #9`,`LYD2`]],[`ultralocrian`,[`altered diminished`,`superlocrian bb7`,`superlocrian diminished`,`ULOC`]]]),...je(Oe([0,2,3,5,7,9,11]),[[`melodic minor`,[`jazz minor`,`MMIN`]],[`dorian b2`,[`phrygian natural 6`,`phrygian #6`,`melodic minor second mode`,`DOR2`]],[`lydian augmented`,[`lydian #5`,`LYD+`]],[`lydian dominant`,[`acoustic`,`overtone`,`lydian b7`,`LDOM`]],[`mixolydian b6`,[`aeolian dominant`,`hindu`,`melodic minor fifth mode`,`MIX6`]],[`locrian natural 2`,[`aeolian b5`,`locrian #2`,`LOC2`]],[`altered`,[`super locrian`,`superlocrian`,`altered dominant`,`diminished whole tone`,`pomeroy`,`ALT`]]]),augmented:{helix:Oe([0,3,4,7,8,11]),aliases:[]}},Fe=/* @__PURE__ */ new Map;for(let[e,t]of Object.entries(Pe))for(let n of[e,...t.aliases]){let t=_(n);Fe.has(t)||Fe.set(t,e)}let Ie=[`aeolian`,`dorian`,`ionian`,`mixolydian`,`phrygian`,`lydian`,`locrian`],Le=[`plain`,`pentatonic`,`blues`],Re={tonic:9,mode:`aeolian`};function ze(e){return s(P(e.mode),e.tonic)}let Be={minor:{plain:[0,1,2,3,4,5,6].map(e=>[e,0]),pentatonic:[[0,0],[2,0],[3,0],[4,0],[6,0]],blues:[[0,0],[2,0],[3,0],[4,-1],[4,0],[6,0]]},major:{plain:[0,1,2,3,4,5,6].map(e=>[e,0]),pentatonic:[[0,0],[1,0],[2,0],[4,0],[5,0]],blues:[[0,0],[1,0],[2,-1],[2,0],[4,0],[5,0]]}};function Ve(e,t){let n=ze(e);if(t===`plain`||n.heights[4]-n.heights[0]!==7)return n;let r=n.heights[2]-n.heights[0]===3?`minor`:`major`;return{cycle:n.cycle,heights:Be[r][t].map(([e,t])=>we(n,e,t))}}function He(e,t){return t.tonic===null?t.mode===e.mode?e:{tonic:i(ne(ze(e),P(t.mode)).heights[0],12),mode:t.mode}:t.tonic===e.tonic&&t.mode===e.mode?e:{tonic:t.tonic,mode:t.mode}}function Ue(e){let t=e;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function We(e,...t){let n=e>>>0;for(let e of t)n=Math.imul(n^(e|0),2654435761)>>>0;return Ue(n)}function Ge(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function Ke(e,...t){return We(e,...t)()}let qe={form:1,drumHit:2,drumVariation:3,drumVelocity:4,drumEuclid:5,theme:6,themeRenewal:7,chordColor:8,bassHit:9,bassVariation:10,bassNote:11,compHit:12,compVariation:13,leadRhythm:14,leadShape:15,leadVariation:16,bassVelocity:17,padVelocity:18,stabVelocity:19,leadVelocity:20,drumLength:21,bassLength:22,padLength:23,stabLength:24,leadLength:25,keyJump:26,ownAccent:27,offerVariation:28,radio:29,grooveVariation:30,lineVariation:31,leadLineVariation:32,harmonyVariation:33,restless:34};function R(e,t,...n){return Ke(e,0,qe[t],...n)}function Je(e,[t,n],r,i,a,o,s,c=0){let l=R(e,t,r,i,o);return(a%2==1||c>0&&z(R(e,`restless`,qe[n],r,a),c))&&(l+=(R(e,n,r,a,o)-.5)*(.12+.4*s)),Math.min(.9999,Math.max(1e-4,l))}let Ye=2**-16;function Xe(e){return Math.round(e/Ye)*Ye}function z(e,t){if(!(e>=0&&e<1))throw Error(`chance: draw ${e} is outside [0, 1)`);if(!Number.isFinite(t))throw Error(`chance: probability ${t} is not a finite number`);return e<Xe(t)}function Ze(e,t){if(!(e>=0&&e<1))throw Error(`pick: draw ${e} is outside [0, 1)`);let n=t.map(e=>{if(!(e>=0&&Number.isFinite(e)))throw Error(`pick: weight ${e} is negative or not finite`);return Math.round(e/Ye)}),r=n.reduce((e,t)=>e+t,0);if(r===0)throw Error(`pick: the weights give nothing to pick`);let i=Math.floor(e*r);for(let e=0;e<n.length-1;e++)if(i-=n[e],i<0)return e;return n.length-1}let Qe=e=>Math.max(0,Math.min(1,e)),$e=e=>{let t=Qe(e);return t*t*(3-2*t)};function et(t,n){let r=n.map(n=>e(t,n.degree)+n.alter),a=r.slice(0,4),o=O(a.map(e=>e-a[0]));return!o||!Ee(t,{root:i(a[0],12),quality:o})?null:{helix:{cycle:12,heights:a},tensions:r.slice(4)}}function tt({seed:t,barInSection:n,key:r,theme:a,harm:o}){let s=ze(r),c=a.bars[n],u=$e((o-.25)/.5),d=Qe((o-.75)/.25)*.7,f=(e,r)=>R(t,`chordColor`,a.index,n,e,r);return c.map((t,p)=>{let m=z(f(p,1),d);if(`dominantOf`in t){let n=e(s,t.dominantOf),r=s.heights[0]+i(n+7-s.heights[0],12);return{slot:t,raised:!1,chord:{helix:{cycle:12,heights:[r,r+4,r+7,r+10]},tensions:m?[r+14]:[]}}}let h=t.degree,g=t.stack&&et(s,t.stack);if(g)return{slot:t,raised:!1,chord:g};let _=z(f(p,0),u)?4:3,v=l({cycle:7,heights:[h,h+2,h+4,h+6].slice(0,_)},s).heights,y=v[0],b=p+1<c.length?c[p+1]:a.bars[n+1]?.[0],x=b===void 0?0:`degree`in b?b.degree:null;if((r.mode===`aeolian`||r.mode===`dorian`)&&h===4&&x===0&&o>.4)return{slot:t,raised:!0,chord:{helix:{cycle:12,heights:[y,y+4,y+7,y+10].slice(0,_)},tensions:[]}};let S=e(s,h+8),C=_===4&&m&&S-y===14?[S]:[];return{slot:t,raised:!1,chord:{helix:{cycle:12,heights:v},tensions:C}}})}function nt(e,t){let n=Math.floor(t*L(e)/16);return n%2==t%2?n:n-1}function rt(e,t){return e.map(e=>({...e,slot:{...e.slot,step:nt(t,e.slot.step)}}))}function it(e,t){return e.findLast(e=>e.slot.step<=t)??e[0]}let at={intro:[`groove`],groove:[`groove`,`bridge`,`build`],bridge:[`groove`,`build`,`breakdown`],build:[`drop`],drop:[`drop`,`breakdown`,`groove`],breakdown:[`build`,`groove`]},ot=(e,t,n)=>{switch(e){case`intro`:return 0;case`groove`:return .3*(1-n)+.05;case`bridge`:return .35+.2*n;case`build`:return .1+.45*t;case`drop`:return .3*t;case`breakdown`:return .35-.15*t}};function st(e,t,n){return at[e].map(e=>[e,ot(e,t,n)])}let ct={initial:null,advance({seed:e,index:t,style:n},r){let i=`intro`;if(t>0){let a=st(r?.type??`intro`,n.energy,n.entropy),o=a.length===1?[1]:a.map(([,e])=>e);i=a[Ze(R(e,`form`,t),o)][0]}let a={type:i,index:t};return{carried:a,output:a}}},lt={intro:-.3,groove:0,bridge:-.1,build:0,drop:.3,breakdown:-.45};function ut(e,t,n){let r=t===`build`?-.15+.45*n/7:lt[t];return Math.max(0,Math.min(1,e+r))}let dt=(e,t,n,r)=>({name:e,range:t,label:n,ends:r,sentence:`${r[0][0].toUpperCase()}${r[0].slice(1)} (${t[0]}) to ${r[1]} (${t[1]}).`}),ft=[dt(`sync`,[0,1],`Syncopation`,[`on the beat`,`offbeat`]),dt(`harm`,[0,1],`Harmony`,[`static`,`moving`]),dt(`bite`,[0,1],`Bite`,[`paddy`,`stabby`]),dt(`mood`,[0,1],`Mood`,[`darker`,`brighter`])],pt={lydian:1,ionian:.875,mixolydian:.75,dorian:.5,harmonic_minor:.375,aeolian:.25,phrygian:.125,locrian:0},mt=(e,t=.25)=>Math.round((.6*pt[e]+.4*(1-t))*1e6)/1e6,ht=ft.map(e=>e.name),gt={adsr:[`attack`,`decay`,`sustain`,`release`],style:ht},_t=`style`,vt=ft.map(e=>(e.range[0]+e.range[1])/2),yt=`&[A-Za-z_][A-Za-z0-9_]*`,bt=e=>e.startsWith(`"`)?e.slice(1,-1):e,xt=e=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(e),St=e=>/^\s*use(?![A-Za-z0-9_])/.test(e);function Ct(e){let t=[],n=0,r=!1,i=-1;for(let a=0;a<=e.length;a++){let o=e[a];if(o===void 0||!r&&n===0&&/\s/.test(o)){i>=0&&t.push({text:e.slice(i,a),at:i}),i=-1;continue}i<0&&(i=a),o===`"`?r=!r:!r&&`([{`.includes(o)?n++:!r&&`)]}`.includes(o)&&(n=Math.max(0,n-1))}return t}function wt(e){if(!e.startsWith(`(`)||!e.endsWith(`)`))return null;let t=e.slice(1,-1),n=[],r=0,i=!1,a=0;for(let e=0;e<=t.length;e++){let o=t[e];if(o===void 0||o===`,`&&!i&&r===0){n.push(t.slice(a,e).trim()),a=e+1;continue}o===`"`?i=!i:!i&&`([{`.includes(o)?r++:!i&&`)]}`.includes(o)&&r--}return n.length===1&&n[0]===``?[]:n}let Tt=`${yt}(?:=[A-Za-z_][A-Za-z0-9_]*)?`,Et=RegExp(`^\\s*(\\*|${Tt}(?:\\s*,\\s*${Tt})*)(?=\\s|$)`),Dt=RegExp(`^${yt}$`),Ot=/^[A-Za-z_][A-Za-z0-9_]*/,kt=/^"[^"]*\S[^"]*"/,At=e=>/^[A-Za-z_][A-Za-z0-9_]*=/.test(e),jt=/* @__PURE__ */ new Set([`off`]);function B(e){let t=Et.exec(e);if(!t)return;let n=Ct(e),r=t[0].length,i=n.findIndex(e=>e.at>=r&&e.text===`from`);if(i<0)return;let a=t[1]===`*`,o=a?null:t[1].split(`,`).map(e=>e.trim().split(`=`)),s=o?.map(([e,t])=>[e,t===void 0?e:`&${t}`])??null,c=e=>new Set(e).size===e.length;if(s&&o.some(([,e])=>e!==void 0)&&!(c(s.map(([e])=>e))&&c(s.map(([,e])=>e))))return null;let l=s?[...new Map(s)]:null,u=l?l.map(([e])=>e):null,d=l?l.map(([,e])=>e):null,f=n.filter((e,t)=>e.at>=r&&t<i).map(e=>e.text);if(f.some(e=>!At(e)&&!jt.has(e))||a&&f.length)return null;let p=e.slice(n[i].at+4).trim();if(p===``||p.startsWith(`(`)||p.startsWith(`&`)){if(!u||f.length||d.some((e,t)=>e!==u[t]))return null;let e=Ct(p),t=e[0]?.text.startsWith(`(`)?wt(e[0].text):[];if(t===null||t.some(e=>!Dt.test(e)))return null;let n=e.slice(+!!e[0]?.text.startsWith(`(`));return n.length>1||n[0]&&!Dt.test(n[0].text)?null:{kind:`signature`,names:u,optional:[...new Set(t)],main:n[0]?.text??null}}let m=(kt.exec(p)??Ot.exec(p))?.[0];if(!m)return null;let h=p.slice(m.length),g=null;if(/^\s*\(/.exec(h)){let e=Ct(h.trimStart())[0].text,t=wt(e);if(!t)return null;g=[];for(let e of t){let t=/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(\S[\s\S]*)$/.exec(e);if(!t||g.some(e=>e.name===t[1]))return null;g.push({name:t[1],value:t[2].trim()})}h=h.trimStart().slice(e.length)}else if(h&&!/^\s/.test(h))return null;let _=h.trim();return{kind:`use`,id:bt(m),names:u,takes:d,head:f,args:g,main:_||null}}let Mt=(e,t=e)=>e?e.map((e,n)=>t&&t[n]!==e?`${e}=${t[n].slice(1)}`:e).join(`, `):`*`,Nt=`A from line says where its cells come from: &key from harmonic_minor D, &bar from swung_4_4(swing=8n:.64) &tempo, &bd, &sd from gm_kit, &kick=bd from gm_kit (the piece’s &kick, the kit’s bd), * from gm_kit; the head’s attributes go before from (&key label="…" from …), the named arguments in parentheses; with no id, a fragment’s signature: &bar from (&swing) &tempo`;function V(e){let t=!1;for(let n=0;n<e.length;n++){let r=e[n];if(r===`"`)t=!t;else if(!t&&(r===`/`&&e[n+1]===`/`||r===`#`&&(n===0||/\s/.test(e[n-1]))))return[e.slice(0,n),e.slice(n)]}return[e,``]}let Pt=e=>RegExp(`^(\\s*&${e})(?=\\s|$)`);function H(e,t){let n=Pt(t);return e.split(`
`).findIndex(e=>n.test(V(e)[0])&&B(V(e)[0].trim())===void 0)}function Ft(e,t){return e.findIndex(e=>{let n=Ut(V(e)[0]);if(!/^&\w+$/.test(n[0]??``)||!n.some(e=>e.startsWith(`step=`)))return!1;let r=n.slice(1).filter(e=>!Wt(e));return r.length>0&&r.every(e=>/^&\w+$/.test(e))&&r.includes(`&${t}`)})}function It(e,t){for(let n=0;n<e.length;n++){let r=V(e[n].replace(/\r$/,``))[0],i=B(r);if(!i||i.kind!==`use`||i.names?.length!==1||i.names[0]!==`&${t}`)continue;if(i.args===null&&i.main===null)return null;let a=0;for(let e of Ut(r)){if(a=r.indexOf(e,a),e===`from`)return{line:n,from:a};a+=e.length}}return null}let Lt=(e,t)=>e.some(e=>{let n=B(V(e)[0]);return n?.kind===`use`&&n.names?.includes(`&${t}`)===!0});function Rt(e,t,n,r=!1){let i=e.split(`
`),a=H(e,t);if(a<0&&r){let e=It(i,t);if(e){let r=i[e.line].endsWith(`\r`)?`\r`:``,a=r?i[e.line].slice(0,-1):i[e.line],o=a.slice(0,e.from).replace(/\s+$/,``);return i[e.line]=`${n(o,Pt(t))} ${a.slice(e.from)}${r}`,i.join(`
`)}}let o=a<0&&Lt(i,t)?-1:Ft(i,t);if(a<0){if(o<0)return e;i.splice(o+1,0,`&${t}${i[o].endsWith(`\r`)?`\r`:``}`),a=o+1}let s=i[a].endsWith(`\r`)?`\r`:``,[c,l]=V(s?i[a].slice(0,-1):i[a]),u=n(c,Pt(t));if(o>=0&&!l&&u.trim()===`&${t}`)return i.splice(a,1),i.join(`
`);if(l){let e=c.length,t=u.replace(/\s+$/,``);u=t+` `.repeat(Math.max(1,e-t.length))}return i[a]=u+l+s,i.join(`
`)}function zt(e,t){let n=0,r=!1,i=t;for(;i<e.length;i++){let t=e[i];if(t===`"`&&(r=!r),!r){if(t===`[`||t===`(`)n++;else if(t===`]`||t===`)`)n=Math.max(0,n-1);else if(/\s/.test(t)&&n===0)break}}return{text:e.slice(t,i),end:i}}function Bt(e,t){let n=RegExp(`(^|\\s)${t}=`).exec(e);if(!n)return null;let r=n.index+n[0].length,i=zt(e,r),a=[],o=i.end;for(;;){let t=/^\s*\*\s*/.exec(e.slice(o));if(!t)break;let n=zt(e,o+t[0].length);if(!n.text)break;a.push(n.text),o=n.end}return{base:i.text,factors:a,start:r,end:o}}function Vt(e,t,n,r){return Rt(e,t,(e,t)=>{let i=Bt(e,n);if(!i)return r===null?e:e.replace(t,`$1 ${n}=${r}`);if(r!==null)return e.slice(0,i.start)+r+e.slice(i.end);let a=i.start-n.length-1,o=/\s/.test(e[a-1]??``)?a-1:a;return e.slice(0,o)+e.slice(i.end)},!0)}function Ht(e,t,n,r){return Rt(e,t,e=>e.replace(RegExp(`(\\s)${n}=`),`$1${r}=`))}function Ut(e){let t=[],n=0,r=0,i=!1,a=``;for(let o of e)o===`"`&&(i=!i),!i&&(o===`[`||o===`(`)&&n++,!i&&(o===`]`||o===`)`)&&(n=Math.max(0,n-1)),!i&&n===0&&o===`<`&&r++,!i&&n===0&&o===`>`&&(r=Math.max(0,r-1)),/\s/.test(o)&&n===0&&r===0&&!i?(a&&t.push(a),a=``):a+=o;return a&&t.push(a),t}let Wt=e=>/^[a-z][a-zA-Z]*=/.test(e)||e===`off`;function Gt(e){let t=[];for(let n=0;n<e.length;n++){let r=e[n],i=t[t.length-1];if(i!==void 0&&Wt(i)&&i.includes(`=`)&&(r===`*`||r.startsWith(`*`)||i.endsWith(`*`))){let a=r===`*`&&n+1<e.length?`${r} ${e[++n]}`:r;t[t.length-1]=`${i} ${a}`}else t.push(r)}return t}function Kt(e,t){let n=H(e,t);return n>=0&&/[+*,[]\s*$/.test(V(e.split(`
`)[n])[0])}function qt(e,t){let n=H(e,t);if(n<0)return null;let r=Gt(Ut(V(e.split(`
`)[n])[0])),i=r.slice(0,1),a=r.slice(i.length);return{head:i,attrs:a.filter(Wt),braid:a.filter(e=>!Wt(e))}}function Jt(e,t){let n=qt(e,t),r=/* @__PURE__ */ new Map;for(let e of n?.attrs??[]){let t=e.indexOf(`=`);t<0?r.set(e,``):r.set(e.slice(0,t),e.slice(t+1))}return r}function Yt(e,t,n){let r=qt(e,t);if(!r||Kt(e,t))return e;let i=r.braid.length===1&&/^free\(\s*[^"\s]/.test(r.braid[0])&&n.length>0;return Rt(e,t,e=>/^\s*/.exec(e)[0]+[...r.head,...r.attrs,...i?[`free(${n.join(` `)})`]:n].join(` `))}function Xt(e,t,n,r){return Vt(Vt(e,t,n===`step`?`loop`:`step`,null),t,n,r)}function Zt(e,t,n){return/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)?t!==n&&H(e,t)>=0?`&${t} already exists`:null:`Letters, digits and _ only, starting with a letter`}function Qt(e,t,n){if(t===n||Zt(e,n,t))return e;let r=RegExp(`&${t}(?![A-Za-z0-9_])`,`g`);return e.split(`
`).map(e=>{let[t,i]=V(e);return t.replace(r,`&${n}`)+i}).join(`
`)}let $t=[`sync`,`harm`,`artic`,`energy`],en=[{mode:`aeolian`,point:{sync:.3,harm:.45,artic:.55,energy:.55}},{mode:`aeolian`,point:{sync:.12,harm:0,artic:1,energy:.8}},{mode:`aeolian`,point:{sync:.5,harm:.75,artic:.35,energy:.5}},{mode:`dorian`,point:{sync:.35,harm:.55,artic:.65,energy:.65}},{mode:`dorian`,point:{sync:1,harm:.12,artic:.85,energy:.75}},{mode:`ionian`,point:{sync:.05,harm:.3,artic:0,energy:.2}},{mode:`ionian`,point:{sync:.75,harm:.85,artic:.45,energy:.45}},{mode:`ionian`,point:{sync:.35,harm:1,artic:.3,energy:.6}},{mode:`ionian`,point:{sync:.1,harm:.12,artic:.5,energy:.35}},{mode:`mixolydian`,point:{sync:.875,harm:.485,artic:.65,energy:.6}},{mode:`phrygian`,point:{sync:.6,harm:.6,artic:.7,energy:.85}},{mode:`lydian`,point:{sync:.15,harm:.6,artic:.15,energy:.3}},{mode:`locrian`,point:{sync:.9,harm:1,artic:.6,energy:.9}},{mode:`ionian`,point:{sync:.383,harm:.717,artic:.25,energy:.417}},{mode:`harmonic_minor`,point:{sync:.55,harm:.75,artic:.6,energy:.75}},{mode:`harmonic_minor`,point:{sync:.2,harm:.9,artic:.3,energy:.35}}],tn=e=>Math.round(e*1e6)/1e6,nn=e=>String(tn(e)).replace(/^0\./,`.`),rn=(e,t)=>$t.reduce((n,r)=>n+(e[r]-t[r])**2,0);function an(e){return en.reduce((t,n)=>rn(e,n.point)<rn(e,t.point)?n:t).mode}let on=[{id:`synthPop`,mood:.5,point:{sync:.3,harm:.45,artic:.55,energy:.55}},{id:`techno`,mood:.4,point:{sync:.12,harm:0,artic:1,energy:.8}},{id:`deepHouse`,mood:.65,point:{sync:.35,harm:.55,artic:.65,energy:.65}},{id:`ambient`,mood:.9,point:{sync:.05,harm:.3,artic:0,energy:.2}},{id:`lofi`,mood:.5,point:{sync:.5,harm:.75,artic:.35,energy:.5}},{id:`funk`,mood:.65,point:{sync:1,harm:.12,artic:.85,energy:.75}},{id:`bossaNova`,mood:.9,point:{sync:.75,harm:.85,artic:.45,energy:.45}},{id:`swingJazz`,mood:.85,point:{sync:.35,harm:1,artic:.3,energy:.6}},{id:`electroSwing`,mood:.5,point:{sync:.55,harm:.75,artic:.6,energy:.75}},{id:`spooky`,mood:.3,point:{sync:.2,harm:.9,artic:.3,energy:.35}},{id:`kinderlied`,mood:.95,point:{sync:.1,harm:.12,artic:.5,energy:.35}}];function sn(e){let t=on.reduce((t,n)=>rn(e,n.point)<rn(e,t.point)?n:t);return Math.sqrt(rn(e,t.point)/$t.length)<=.150000001?t.mood:mt(an(e))}function cn(e,t){let n=t,r=()=>{if(e.startsWith(`free(`,n)){let t=0;for(;n<e.length;n++)if(e[n]===`(`)t++;else if(e[n]===`)`&&--t===0)return void n++;return}let t=/&?\(?[A-Za-z0-9_.\-[\]$]+/y;t.lastIndex=n,t.test(e)&&(n=t.lastIndex)};for(r();;){let t=/\s*(\.\.|\*|±|\+-)\s*/y;if(t.lastIndex=n,!t.test(e))return n;n=t.lastIndex,r()}}let ln=e=>parseFloat(/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/.exec(e)?.[0]??`0.5`),un=e=>/^-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/.test(e);function dn(e){let t=/* @__PURE__ */ new Map;for(let n of $t){let r=RegExp(`(^|\\s)${n}=`).exec(e);if(!r)continue;let i=r.index+r[1].length,a=cn(e,i+n.length+1);t.set(n,{at:i,end:a,value:e.slice(i+n.length+1,a)})}if(t.has(`artic`)||t.has(`energy`)){if(!$t.every(e=>t.has(e)))return null;let n=e=>t.get(e).value,r=Object.fromEntries($t.map(e=>[e,ln(n(e))])),i=n(`artic`),a=nn(sn(r)),[o,s]=[t.get(`artic`),t.get(`energy`)];return[{at:o.at,end:o.end,to:`bite=${i}`},{at:s.at,end:s.end,to:`mood=${a}`}].sort((e,t)=>t.at-e.at).reduce((e,t)=>e.slice(0,t.at)+t.to+e.slice(t.end),e)}let n=/^\s+((?:free\([^)]*\)|\S)+)\s+((?:free\([^)]*\)|\S)+)\s+((?:free\([^)]*\)|\S)+)\s+((?:free\([^)]*\)|\S)+)(?=\s*(?:$|\)|\s+[a-z]+=))/.exec(e);if(!n||!n.slice(1).every(e=>un(e)||e.startsWith(`free(`)))return null;let[r,i,a,o]=n.slice(1),s={sync:ln(r),harm:ln(i),artic:ln(a),energy:ln(o)};return` sync=${r} harm=${i} bite=${a} mood=${nn(sn(s))}${e.slice(n[0].length)}`}function fn(e){let t=e.replace(/\[(artic|energy)\]/g,`[bite]`),n=[...t.matchAll(/map=style(?=\s)/g)].map(e=>e.index+9).reverse();for(let e of n){let n=t.lastIndexOf(`&(`,e)>t.lastIndexOf(`)`,e)&&t.lastIndexOf(`&(`,e)>=0?pn(t,t.lastIndexOf(`&(`,e)+1):-1,r=n>=0?n:t.length,i=dn(t.slice(e,r));i!==null&&(t=t.slice(0,e)+i+t.slice(r))}return t===e?null:t}function pn(e,t){let n=0;for(let r=t;r<e.length;r++)if(e[r]===`(`)n++;else if(e[r]===`)`&&--n===0)return r;return e.length}function mn(e){return e.split(`
`).flatMap((e,t)=>{let[n,r]=V(e);if(!/^\s*&/.test(n))return[];let i=fn(n);return i===null?[]:[{id:`axes:${t+1}`,tool:`migrate`,rule:`axes`,title:`a style on the axes sync harm bite mood: bite its articulation, mood its style's or its mode's (decision 076)`,before:n.trim(),after:i.trim(),apply:n=>n.split(`
`).map((n,a)=>a===t&&n===e?i+r:n).join(`
`),exact:!0}]})}function hn(e){return e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>hn(e.atom))):[e]}function gn(e){return e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>[e,...gn(e.atom)])):[]}function _n(e,t){return e.kind===`seq`?{...e,layers:e.layers.map(e=>e.map(e=>({...e,atom:_n(e.atom,t)})))}:t(e)}function vn(e,t){let n=e.atom,r=n.kind===`seq`?n.layers.reduce((e,n)=>e+n.reduce((e,n)=>e+vn(n,t),0),0)*(n.euclid?.k??1):t(n);return e.repeat*e.subdivide*r}let yn=1e-9,bn=e=>Math.floor(e+yn),xn=(e,t)=>(e%t+t)%t,Sn=(e,t)=>t===0?e:Sn(t,e%t),Cn=(e,t)=>e/Sn(e,t)*t;function wn(e,t){let[n,r,i,a]=[xn(e,t),t,1,0];for(;r!==0;){let e=Math.floor(n/r);[n,r,i,a]=[r,n-e*r,a,i-e*a]}return xn(i,t)}let Tn=e=>e.reduce((e,t)=>e+t.elongate*t.repeat,0);function En(e){if(e.kind!==`seq`)return 1;let t=t=>t.reduce((e,t)=>Cn(e,En(t.atom)),1)*(e.mode===`alt`?Tn(t):1);return e.layers.reduce((e,n)=>Cn(e,t(n)),1)*(e.slow??1)}let Dn=(e,t,n)=>[{atom:e,at:t,dur:n,of:1,is:0,chances:[],picks:[]}];function On(e,t,n,r){return e.map(e=>{let i=t*(e.is+(e.at-n)/r),a=bn(i),o=e.of*t;return{...e,at:n+Math.max(0,i-a)*r,dur:e.dur*t,of:o,is:xn(a,o),picks:e.picks.map(i=>{let o=t*(e.is+i.lap+(i.at-n)/r)-a,s=bn(o);return{...i,lap:s,at:n+Math.max(0,o-s)*r}})}})}function kn(e,t,n,r){let i=[];for(let a of t.hits){let o=a/t.n;for(let a of e){let e=(a.at-n)/r,s=a.dur/r;for(let c=0;c<e+s;c++)e<=c+o+yn&&c+o<e+s-yn&&i.push({...a,at:n+o*r,dur:r/t.n,is:xn(a.is+c,a.of),picks:a.picks.map(e=>({...e,lap:e.lap-c}))})}}return i}function An(e,t,n,r,i,a){if(e.kind!==`seq`)return a(e,t,n).map(e=>({...e,chances:[...i.chances,...e.chances],...jn(i.level,e.level)}));let o=e.layers.flatMap((o,s)=>{let c=Tn(o),l=[],u=0;return o.forEach((e,o)=>{l.push(...Mn(e,t+u*n/c,e.elongate*n/c,`${r}/${s}.${o}`,i,a)),u+=e.elongate*e.repeat}),e.mode===`alt`?On(l,c,t,n):e.mode===`choose`?l.map(n=>({...n,picks:[...n.picks,{id:r,of:e.layers.length,is:s,lap:0,at:t}]})):l});return e.euclid&&(o=kn(o,e.euclid,t,n)),e.slow&&e.slow>1&&(o=On(o,e.slow,t,n)),o}let jn=(e,t)=>{let n=t===void 0?e:e===void 0?t:t*e;return n===void 0?{}:{level:n}};function Mn(e,t,n,r,i,a){let o={chances:e.chance===void 0?i.chances:[...i.chances,e.chance],level:e.level===void 0?i.level:e.level*(i.level??1)},s=e.subdivide,c=n/s,l=[];for(let i=0;i<e.repeat;i++)for(let u=0;u<s;u++){let d=t+i*n+u*c;for(let t of An(e.atom,d,c,r,o,a)){if(s===1||t.of===1&&!t.picks.length){l.push(t);continue}let e=Sn(s,t.of);if(xn(t.is-u,e)!==0)continue;let n=t.of/e,r=n===1?0:xn((t.is-u)/e*wn(s/e,n),n);l.push({...t,of:n,is:r,picks:t.picks.map(e=>{let t=u+e.lap;return{...e,lap:Math.floor(t/s),at:e.at+(xn(t,s)-u)*c}})})}}return l}function Nn(e,t){if(e.kind!==`seq`)return t(e);if(!e.bare)return 1;let n=e.layers[0][0];return Nn(n.atom,t)*n.elongate}function Pn(e,t,n,r=``){let i=[],a=0;return e.forEach((e,o)=>{let s=Nn(e.atom,t)*e.elongate;for(let t of Mn(e,a,s,`${r}${o}`,{chances:[],level:void 0},n))i.push({atom:t.atom,at:t.at,dur:t.dur,chances:t.chances,top:o,...t.level===void 0?{}:{level:t.level},...t.of>1?{laps:{of:t.of,is:t.is}}:{},...t.picks.length?{chosen:t.picks}:{}});a+=s*e.repeat}),i}let Fn=(e,t)=>Pn(e,t,Dn),In=[`over`,`shift`,`step`,`map`,`stride`,`cycle`,`env`,`pitch`,`show`,`chance`,`seed`,`size`],Ln=e=>e.flatMap(e=>e.repeat>1?Array.from({length:e.repeat},()=>({...e,repeat:1})):[e]);function Rn(e,t){let n=t.transpose??0,r=t.degree??0;if(!n&&!r)return e;let i=n+r;switch(e.kind){case`seq`:return _n(e,e=>Rn(e,t));case`note`:return{...e,value:e.value+i};case`chord`:return{...e,notes:e.notes.map(e=>e+i)};case`choice`:return{...e,values:e.values.map(e=>e+i)};case`ref`:return n?{...e,transpose:(e.transpose??0)+n}:{...e,values:{mul:e.values?.mul??1,add:(e.values?.add??0)+r*(e.values?.mul??1)}};default:return e}}function zn(e){if(!e.cells.some(e=>e.base||Vn(e)||Bn(e)))return e;let t=new Map(e.cells.map(e=>[e.name,e])),n=[...e.diagnostics],r=/* @__PURE__ */ new Map,i=/* @__PURE__ */ new Set,a=(e,t)=>n.push({severity:`error`,message:t,span:e.base?.span??e.span}),o=e=>{let s=r.get(e.name);if(s)return s;let c=e;if(e.base){let n=t.get(e.base.name);n?i.has(e.name)?a(e,`base=&${e.base.name} comes round to &${e.name} itself`):(i.add(e.name),c=Hn(e,o(n),e.base,t=>a(e,t)),i.delete(e.name)):c=e}else Vn(e)&&n.push({severity:`error`,message:`= keeps a step of the base: only in a cell with base= (&${e.name} base=&other = 4 =)`,span:e.span});return Bn(e)&&n.push({severity:`error`,message:`= keeps a whole step of the base, not part of one: write it outside brackets (&${e.name} base=&other = [0 2])`,span:e.span}),r.set(e.name,c),c};return{...e,cells:e.cells.map(o),diagnostics:n}}let Bn=e=>e.braid.kind===`list`&&e.braid.tokens.some(e=>gn(e.atom).some(e=>e.atom.kind===`rest`&&e.atom.keep)),Vn=e=>e.braid.kind===`list`&&e.braid.tokens.some(e=>e.atom.kind===`rest`&&e.atom.keep);function Hn(e,t,n,r){let i={};for(let n of In)e[n]==null&&t[n]!=null&&(i[n]=t[n]);let a={...t.params,...e.params},o={...t.paramSpans,...e.paramSpans},s=t.paramCells||e.paramCells?{...t.paramCells,...e.paramCells}:void 0,c=t.paramClocks||e.paramClocks?{...t.paramClocks,...e.paramClocks}:void 0;n.transpose&&(e.over??t.over)&&r(`base=&${n.name}^$${n.transpose}: a cell that reads a table moves by its degrees (^n), not yet by grid steps`);let l=e.braid;if(t.braid.kind===`list`){let i=Ln(t.braid.tokens),a=e.braid.kind===`list`?Ln(e.braid.tokens):[],o=[];for(let e=0;e<Math.max(i.length,a.length);e++){let s=i[e],c=a[e];if(!(!c||c.atom.kind===`rest`&&c.atom.keep)){o.push(c);continue}if(!s){r(`= past the end of &${t.name} (${i.length} steps): nothing to keep`);continue}let l=Rn(s.atom,n);o.push(c&&c.elongate!==1?{...s,atom:l,elongate:c.elongate}:{...s,atom:l})}l={kind:`list`,tokens:o,...t.braid.perBeat!==void 0&&o.length===i.length?{perBeat:t.braid.perBeat,...t.braid.signature?{signature:t.braid.signature}:{}}:{}}}else e.braid.kind===`blank`?l=t.braid:Vn(e)&&r(`&${t.name} is a ${t.braid.kind}(…), not a braid: = keeps steps of a braid`);return{...e,...i,params:a,paramSpans:o,...s?{paramCells:s}:{},...c?{paramClocks:c}:{},braid:l}}let Un=e=>{if(!e)return``;let t=e.abs?`$`:``;return e.kind===`at`?`[${t}${e.i}]`:`[${t}${e.from??``}:${e.to??``}${e.step?`:${e.step}`:``}]`},Wn=e=>e===0?``:`[${e<0?`<<`:`>>`}${Math.abs(e)===1?``:Math.abs(e)}]`,Gn=e=>(e.slot?`[${e.slot}]`:Un(e.pick)||Wn(e.shift))+(e.degree?`^${e.degree}`:``)+(e.transpose?`^$${e.transpose}`:``),Kn=e=>!!(e.label||e.title)&&e.braid.kind===`blank`&&e.over===null&&e.step===null&&e.map===null&&e.cycle===null&&e.shift===null&&e.stride===null&&!e.off&&!e.frees?.length&&!e.env&&!e.pitch&&Object.keys(e.params).length===0,qn=/^(`{3,})([^`]*)$/;function Jn(e,t){let n=[],r=[],i=[],a=[],o=t;for(;o<e.length;){let t=e[o],s=qn.exec(t),c=s?e.findIndex((e,t)=>t>o&&/^`{3,}\s*$/.test(e)&&e.trim().length>=s[1].length):-1;if(s&&s[2].trim()===`cells`){if(c<0)return{problems:[{line:o+1,message:"the ```cells block is never closed (a line ```)"}]};a.push(t),r.push(a),a=[];let s=e.slice(o+1,c);s.forEach((e,t)=>i.push({block:n.length,line:o+2+t})),n.push(s),a.push(e[c]),o=c+1}else if(s){let t=c<0?e.length-1:c;a.push(...e.slice(o,t+1)),o=t+1}else a.push(t),o++}if(!n.length)return{problems:[{line:Math.max(t,1),message:"no ```cells block after the frontmatter"}]};let s=a.slice(1);r.push(a.slice(0,1));let c=s.join(`
`).replace(/^\s*\n/,``).trimEnd();return{text:n.flat().join(`
`),map:i,layout:{blocks:n,gaps:r},head:e.slice(0,t),tail:s,prose:c,raw:!1}}var U=class extends Error{line;constructor(e,t){super(t),this.line=e}};let Yn=/^[-+]?(\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE][-+]?[0-9]+)?$/,Xn=/^([-+]?0x[0-9a-fA-F]+|[-+]?0o[0-7]+|[-+]?\.(inf|Inf|INF)|\.(nan|NaN|NAN))$/,Zn=/^(null|Null|NULL|~)$/,Qn=/^(true|True|TRUE)$/,$n=/^(false|False|FALSE)$/,er=/^[-?:,[\]{}#&*!|>'"%@`]/,tr=e=>e!==``&&!er.test(e)&&!/: |:$| #|^\s|\s$/.test(e)&&!/^[0-9]+$/.test(e)&&!/[\n\r\t]/.test(e);function nr(e,t,n){let[r]=e;if(r===`&`||r===`*`)throw new U(t,`an ${r===`&`?`anchor`:`alias`} (${e}): the subset has none; write the value out`);if(r===`!`)throw new U(t,`a tag (${e}): the subset has none`);if(r===`|`||r===`>`)throw new U(t,`a block scalar (${r}): write the text on one line, quoted, with \\n`);if(r===`{`||r===`[`)throw new U(t,`flow style beyond [a, b] (${e}): write the map or the list as a block`);if(/^([-?:]( |$)|[%@`,\]}])/.test(e))throw new U(t,`${r} can't start a plain value: quote it`);if(r===`#`||e.includes(` #`))throw new U(t,`a comment: the subset has none; say it in the prose or under a key`);if(/: |:$/.test(e))throw new U(t,`a colon and a space in a plain value (${e}): quote it`);if(n&&/[[\]{},]/.test(e))throw new U(t,`flow style beyond [a, b] (${e}): quote an item that holds , [ ] { }`);if(Zn.test(e))return null;if(Qn.test(e))return!0;if($n.test(e))return!1;if(Yn.test(e))return Number(e);if(Xn.test(e))throw new U(t,`a number the subset doesn't read (${e}): write it in decimal, or quote it`);return e}function rr(e,t){if(e[0]===`'`){let t=``;for(let n=1;n<e.length;n++)if(e[n]!==`'`)t+=e[n];else if(e[n+1]===`'`)t+=e[n++];else return{value:t,length:n+1}}else for(let n=1;n<e.length;n++)if(e[n]===`\\`)n++;else if(e[n]===`"`)try{return{value:JSON.parse(e.slice(0,n+1)),length:n+1}}catch{throw new U(t,`an escape the subset doesn't read in ${e.slice(0,n+1)}: it reads JSON's (\\" \\\\ \\n \\t \\uXXXX …)`)}throw new U(t,`a quoted string that isn't closed on its line (${e})`)}function ir(e,t){if(e===`{}`)return{kind:`map`,line:t,entries:[]};if(e[0]===`"`||e[0]===`'`){let{value:n,length:r}=rr(e,t);if(e.slice(r).trim())throw new U(t,`text after a quoted string (${e.slice(r).trim()})`);return{kind:`scalar`,line:t,value:n}}if(e[0]===`[`&&e.endsWith(`]`)){let n=[],r=e.slice(1,-1).trim();for(;r;){let i;if(r[0]===`"`||r[0]===`'`){let e=rr(r,t);i=e.value,r=r.slice(e.length).trim()}else{let n=r.indexOf(`,`),a=(n<0?r:r.slice(0,n)).trim();if(!a)throw new U(t,`an empty item in ${e}`);i=nr(a,t,!0),r=n<0?``:r.slice(n)}if(n.push({kind:`scalar`,line:t,value:i}),r&&r[0]!==`,`)throw new U(t,`a list item followed by ${r[0]}, not a comma`);if(r=r.slice(1).trim(),!r&&e.slice(1,-1).trim().endsWith(`,`))throw new U(t,`an empty item at the end of ${e}`)}return{kind:`list`,line:t,items:n}}return{kind:`scalar`,line:t,value:nr(e,t,!1)}}function ar(e,t=1){let n=[];try{if(e.split(`
`).forEach((e,r)=>{let i=t+r;if(!e.trim())return;let a=e.length-e.trimStart().length;if(e.slice(0,a).includes(`	`))throw new U(i,`a tab in an indent: indent with spaces`);let o=e.trim();if(/^(---|\.\.\.)(\s|$)/.test(o))throw new U(i,`a second document (${o}): the frontmatter is one`);if(o[0]===`%`)throw new U(i,`a directive (${o}): the subset has none`);if(o[0]===`#`)throw new U(i,`a comment: the subset has none; say it in the prose or under a key`);n.push({line:i,indent:a,text:o})}),!n.length)return{node:{kind:`map`,line:t,entries:[]}};let r=0,i=e=>e.text===`-`||e.text.startsWith(`- `),a=e=>i(n[r])?s(e):c(e),o=(e,t,o,c)=>{let l=n[r];if(e){if(l&&l.indent>o)throw new U(l.line,`a value over two lines, or indented under a value: the subset reads a value on one line`);return ir(e,t)}return l&&l.indent>o?a(l.indent):l&&c&&l.indent===o&&i(l)?s(o):{kind:`scalar`,line:t,value:null}},s=e=>{let t=[],s=n[r].line;for(;r<n.length&&n[r].indent===e&&i(n[r]);){let i=n[r],s=i.text.slice(1).trimStart(),c=e+i.text.length-s.length;s&&(/^-( |$)/.test(s)||/^[^"'[{][^]*?(: |:$)/.test(s))?(n[r]={line:i.line,indent:c,text:s},t.push(a(c))):(r++,t.push(o(s,i.line,e,!1)))}return{kind:`list`,line:s,items:t}},c=e=>{let t=[],a=n[r].line;for(;r<n.length&&n[r].indent===e;){let{line:a,text:s}=n[r];if(i(n[r]))throw new U(a,`a list item where a key was expected`);if(s[0]===`?`)throw new U(a,`a complex key (?): keys are plain words`);let c=s.search(/: |:$/);if(c<0)throw new U(a,`no key: a line in a map is \`key: value\` (${s})`);let l=s.slice(0,c);if(l[0]===`"`||l[0]===`'`)throw new U(a,`a quoted key (${l}): keys are plain words`);if(/^[0-9]+$/.test(l))throw new U(a,`a key that is a number (${l}): keys are words`);if(!tr(l))throw new U(a,`a key the subset doesn't read (${l}): keys are plain words`);if(t.some(e=>e.key===l))throw new U(a,`the key ${l} is given twice`);r++,t.push({key:l,line:a,value:o(s.slice(c+1).trim(),a,e,!0)})}return{kind:`map`,line:a,entries:t}},l=a(n[0].indent);if(r<n.length)throw new U(n[r].line,`indented as no key above it is`);return{node:l}}catch(e){if(e instanceof U)return{problems:[{line:e.line,message:e.message}]};throw e}}function or(e){return e.kind===`scalar`?e.value:e.kind===`list`?e.items.map(or):Object.fromEntries(e.entries.map(e=>[e.key,or(e.value)]))}let sr=/^`{3,}\s*cells\s*$/m;function cr(e){let t=[];for(let{key:n,line:r,value:i}of e.entries){let e=or(i);n===`title`&&(typeof e!=`string`||!e.trim())&&t.push({line:r,message:`the title is ${JSON.stringify(e)}, not a text: title: "A name"`}),n===`description`&&typeof e!=`string`&&t.push({line:r,message:`the description is ${JSON.stringify(e)}, not a text: description: "What it is"`}),n===`tags`&&!(Array.isArray(e)&&e.every(e=>typeof e==`string`&&e.trim()))&&t.push({line:r,message:`the tags are ${JSON.stringify(e)}, not a list of names: tags: [genre:jazz, rhythm]`}),n===`tier`&&!(typeof e==`number`&&Number.isInteger(e)&&e>=1&&e<=9999)&&t.push({line:r,message:`the tier is ${JSON.stringify(e)}: a tier of the tutorial is a whole number, 1 to 9999`}),n===`uses`&&!(Array.isArray(e)&&e.every(ur))&&t.push({line:r,message:`the uses are ${JSON.stringify(e)}, not a lockfile: uses: a list of - id: gm_kit, hash: e1:…`})}return t}function lr(e){let t=e.split(/\r?\n/);if(t[0]!==`---`){if(!sr.test(e))return{problems:[{line:1,message:"no frontmatter: a piece file starts with a line `---`, or holds a ```cells block"}]};let n=Jn(t,0);return`problems`in n?n:{frontmatter:{},text:n.text,prose:n.prose,map:n.map,layout:n.layout,bare:!0}}let n=t.indexOf(`---`,1);if(n<0)return{problems:[{line:1,message:"the frontmatter is never closed: no second line `---`"}]};let r=ar(t.slice(1,n).join(`
`),2);if(`problems`in r)return r;let i=r.node;if(i.kind!==`map`)return{problems:[{line:i.line,message:"the frontmatter is a map (`title: …`, `tags: […]`)"}]};let a=Jn(t,n+1),o=[...cr(i),...`problems`in a?a.problems:[]];return`problems`in a||o.length?{problems:o.sort((e,t)=>e.line-t.line)}:{frontmatter:or(i),text:a.text,prose:a.prose,map:a.map,layout:a.layout}}function ur(e){if(typeof e!=`object`||!e||Array.isArray(e))return!1;let t=e;return Object.keys(t).sort().join()===`hash,id`&&typeof t.id==`string`&&typeof t.hash==`string`}let W=(e,t,n,r,i)=>({section:e,form:t,means:n,examples:r,doc:i}),dr=(e,t)=>(e%t+t)%t,fr=[`Locrian`,`Phrygian`,`Aeolian`,`Dorian`,`Mixolydian`,`Ionian`,`Lydian`].map((e,t)=>({name:e,intervals:vr(7,12,t)})),pr=(e,t,n)=>xr(vr(e,t,n),t),mr={major:{steps:pr(7,12,5),name:`Ionian`},minor:{steps:pr(7,12,2),name:`Aeolian`},ionian:{steps:pr(7,12,5),name:`Ionian`},dorian:{steps:pr(7,12,3),name:`Dorian`},phrygian:{steps:pr(7,12,1),name:`Phrygian`},lydian:{steps:pr(7,12,6),name:`Lydian`},mixolydian:{steps:pr(7,12,4),name:`Mixolydian`},aeolian:{steps:pr(7,12,2),name:`Aeolian`},locrian:{steps:pr(7,12,0),name:`Locrian`},harmonic:{steps:[2,1,2,2,1,3,1],name:`Harmonic minor`},melodic:{steps:[2,1,2,2,2,2,1],name:`Melodic minor`},pentatonic:{steps:pr(5,12,0),name:`Pentatonic`},minorpentatonic:{steps:pr(5,12,3),name:`Minor pentatonic`},blues:{steps:[3,2,1,1,3,2],name:`Blues`},wholetone:{steps:pr(6,12,0),name:`Whole tone`}},hr={locrian:0,phrygian:1,aeolian:2,minor:2,dorian:3,mixolydian:4,ionian:5,major:5,lydian:6},gr=e=>xr(vr(7,12,e),12);function _r(e){let t=fr[e]?.name.toLowerCase()??`major`;return t===`ionian`?`major`:t===`aeolian`?`minor`:t}function vr(e,t,n=0,r){let i=r=>Math.floor((r*t+n)/e);return r===void 0?Array.from({length:e},(e,t)=>i(t)):[i(r)]}let yr={"4/4":[0,3.24,6,9.12],"3/4":[0,3.36,7.8]};function br(e,t){return[...yr[`${e}/${t}`]??Array.from({length:e},(t,n)=>n*12/e)]}function xr(e,t){return e.map((n,r)=>+((r+1<e.length?e[r+1]:e[0]+t)-n).toFixed(6))}function Sr(e){let t=[],n=0;for(let r of e)t.push(+n.toFixed(6)),n+=r;return{positions:t,lap:+n.toFixed(6)}}function Cr(e){let t=/^([A-G])(#|b)?(-?[0-9]+)?$/.exec(e);return t?{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[t[1]]+(t[2]===`#`?1:t[2]===`b`?-1:0)+12*((t[3]===void 0?4:parseInt(t[3],10))-4):null}let wr={bpm:{times:1,per:60,syntax:W(`rate`,`nbpm`,`n a minute: beats on a meter (a scan’s entries; meter(…)’s beats, by its signature or levels: 6/8 two, 7/8 three unequal).`,[`&bar meter("4/4") step=84bpm`],`time.md`)},hz:{times:1,per:1,syntax:W(`rate`,`nhz`,`n a second (a plain number says the same).`,[`&a loop=440hz`],`time.md`)},min:{times:1,per:60,syntax:W(`rate`,`nmin`,`n a minute (wall-clock time: loop=1min turns once a minute).`,[`&tick scan(1!60) loop=1min`],`time.md`)},h:{times:1,per:3600,syntax:W(`rate`,`nh`,`n an hour.`,[`&hour scan(1!60) loop=1h`],`time.md`)},d:{times:1,per:86400,syntax:W(`rate`,`nd`,`n a day: a day meter, loop=1d (anchor= where it stands when play starts).`,[`&day scan(1!24) loop=1d anchor=11.55`],`time.md`)},wk:{times:1,per:604800,syntax:W(`rate`,`nwk`,`n a week.`,[`&week scan(1!7) loop=1wk`],`time.md`)},k:{times:1e3,per:1,syntax:W(`rate`,`nk`,`n thousand a second: a sample rate.`,[`&out loop=44.1k map=sample &mix`],`mix.md`)}},Tr=new RegExp(Object.keys(wr).sort((e,t)=>t.length-e.length).join(`|`),`y`),Er=(e,t)=>{let n=t?wr[t]:void 0;return n?e*n.times/n.per:e},Dr={largo:[40,60],larghetto:[60,66],adagio:[66,76],andante:[76,108],moderato:[108,120],allegro:[120,156],vivace:[156,176],presto:[168,200]};`${Object.entries(Dr).map(([e,[t,n]])=>`${e} ${t}–${n}`).join(`, `)}`;let Or=`free(0 2 4 ~ …), a braid left to the performer, is a cell's whole braid: &riff over=&key free(0 2 4 ~), with nothing else as its braid`,kr=/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:\/[1-9][0-9]*)?/y,Ar=e=>{let[t,n]=e.split(`/`);return n===void 0?parseFloat(t):parseFloat(t)/Number(n)};function jr(e,t,n,r={}){let i=e.i;if(e.match(/free\(/y)===null&&e.fail(`free(…)`),e.skipSpace(),e.peek()===`"`){let t=e.match(/"[^"]*"/y);e.skipSpace(),e.expect(`)`,`')' to close free("…")`);let n={key:`text`,value:0,unit:``,lo:0,hi:0,span:e.place(i),text:t.slice(1,-1)};return e.frees.push(n),n}(/(?:~|\[|-?[0-9.]+[#b]*(?:[@!*][0-9]+)?\s+[^\s,])/y.test(e.text.slice(e.i))||/^-?[0-9.]+[#b]*\)/.test(e.text.slice(e.i)))&&e.fail(Or,i,e.i-i);let a=e.i,o=t===`shift`||t===`tonic`?e.noteName():null;o!==null&&/[0-9]/.test(e.text.slice(a,e.i))&&e.warn(`free(${e.text.slice(a,e.i)}): a key is a pitch class — the octave is left out: free(${e.text.slice(a,e.i).replace(/-?[0-9]+$/,``)})`,a,e.i-a);let s=o===null?e.match(/[a-z]+/y):null,c,l=``,u,d,f;if(o!==null)c=(o%12+12)%12,[u,d]=[0,11],f=[`C`,`C#`,`D`,`Eb`,`E`,`F`,`F#`,`G`,`Ab`,`A`,`Bb`,`B`];else if(s!==null){let n=Dr[s];(!n||t===`shift`||t===`stride`||t===`gain`||t===`tonic`||r.whole)&&e.fail(`free(${s}): a tempo marking (${Object.keys(Dr).join(`, `)}) — for a rate`,i,e.i-i),[u,d]=n,c=Math.round((u+d)/2),l=`bpm`}else{let t=e.match(kr);t===null&&e.fail(`free(default, lo..hi), like free(90bpm, 60..240) or free(.8, 0..1)`),c=Ar(t),n&&(l=e.match(Tr)??``),e.skipSpace(),e.expect(`,`,`',' then the range, like free(${t}${l}, 60..240)`),e.skipSpace();let r=e.match(kr);e.match(/\.\./y)===null&&e.fail(`a range lo..hi, like 60..240`);let a=e.match(kr);(r===null||a===null)&&e.fail(`a range lo..hi, like 60..240`),u=Ar(r),d=Ar(a),u<d||e.fail(`free(…): the range runs low to high (${u}..${d})`,i,e.i-i),(c<u||c>d)&&e.fail(`free(…): ${c} is outside ${u}..${d}`,i,e.i-i)}e.skipSpace();let p=()=>{if(!/,\s*unit=/y.test(e.text.slice(e.i)))return;let t=e.i;e.i++,e.skipSpace(),e.match(/unit=/y);let r=e.match(/[a-z]+/y)??``,i=r?wr[r]:void 0;(!n||!i)&&e.fail(n?`unit=${r}: a rate's unit (${Object.keys(wr).join(`, `)})`:`unit=: a unit is for a rate (step=, loop=)`,t,e.i-t),l&&e.fail(`free(…${l}, …, unit=${r}): the unit is given twice — written after the number, or as unit= with the numbers a second`,t,e.i-t);let a=e=>+(e*i.per/i.times).toPrecision(12);[c,u,d]=[a(c),a(u),a(d)],l=r,e.skipSpace()};p();let m;if(e.peek()===`,`&&!/,\s*unit=/y.test(e.text.slice(e.i))){e.i++,e.skipSpace();let t=e.match(/"[^"]*"/y);t===null&&e.fail(`names for the choices, in quotes: free(0, 0..3, "a b c d")`),m=t.slice(1,-1).trim().split(/\s+/).filter(Boolean);let n=m.length>1?(d-u)/(m.length-1):0;if(o!==null){let n=e.text.lastIndexOf(`,`,e.i-t.length);e.warn(`free(${e.text.slice(a,n).trim()}, ${t}): a key by name has the twelve pitch names as its choices, so these names are ignored (names of your own go on a range: free(3, 0..11, "…"))`,n,e.i-n),m=void 0}else(!Number.isInteger(u)||!Number.isInteger(d)||m.length<2||!Number.isInteger(n)||n<1)&&e.fail(`free(…, "${m.join(` `)}"): the names spread evenly over ${u}..${d} — ${m.length} names need ${m.length-1} equal whole steps (${u}..${u+m.length-1}, or every 2nd: ${u}..${u+2*(m.length-1)})`,i,e.i-i);e.skipSpace()}p(),e.expect(`)`,`')' to close free(…)`),m??=f;let h={key:t,value:c,unit:l,lo:u,hi:d,span:e.place(i),...r.param===void 0?{}:{param:r.param},...r.whole?{whole:!0}:{},...m?{labels:m}:{},...o===null?{}:{byName:!0}};return e.frees.push(h),h}let G=`no: read as the piece is built`,Mr=e=>`not yet: ${e}`,Nr="`&k`, `lo..hi * &k`",K=e=>e,q={param:K({form:`lpf=n, and every sound parameter`,name:`param`,cell:`${Nr}, on a parameter that moves (postgain= doesn't: the renderer's; pan= is read at each note's start)`,moves:!0,example:`&lead s=saw loop=C4 lpf=free(1200, 200..5000)`}),level:K({form:`level=&a * n (a gate)`,name:`level`,cell:"`&a * &b * n`",moves:!0,example:`&out play=&tune level=&accent*free(.4, 0..1) &tune`}),slot:K({form:`attack=n (an envelope by name)`,name:`slot`,cell:`${Nr}: \`&k\` its values as the slot's (seconds; sustain a level), held at 0 until a note reads it`,moves:!0,example:`&env map=adsr attack=free(.01, 0..1) decay=.3 sustain=.5 release=.4`}),axis:K({form:`sync=n (a style by name)`,name:`axis`,cell:`${Nr}, within the axis (#576)`,moves:!0,example:`&mine map=style sync=free(.3, 0..1) harm=.45 bite=.55 mood=.5`}),end:K({form:`lo..hi * &k (a moving range’s ends) · c ± r`,name:`end`,cell:Mr(`a range’s end is a number or a slider; its cells move what lies between (decision 079)`),example:`&lead s=saw loop=C4 lpf=free(400, 200..800)..free(2400, 1200..4800) * &lfo`}),share:K({form:`swing=8n:n (a swing’s share)`,name:`share`,cell:`${Nr}, one level alone, read at each bar line and held through the bar (decision 081)`,moves:!0,example:`&bar meter("4/4") step=90bpm swing=8n:free(.6, .5...75)`}),depth:K({form:`bend=4n:&t:d (a bend’s depth)`,name:`depth`,cell:`${Nr}, read at each line of its table’s span, held through it (decision 081)`,moves:!0,example:`&bar meter("*.-.+.-.") step=90bpm bend=4n:&(27 23 26 24):free(1, -1..2)`}),legatoShare:K({form:`legato=8n:n (a legato’s share by level)`,name:`share`,cell:Mr(`a meter’s legato by level is its lines’ default; a line moves its own, legato=&artic`),example:`&bar meter("4/4") step=90bpm legato=8n:free(.5, .25..1)`}),gain:K({form:`[&x * n] (a gain in a mix)`,name:`gain`,key:`gain`,cell:"`&k`; a range moved by cells is a cell of its own, `&g [&k * .6 + .2]`, then `[&x * &g]` (decision 079)",moves:!0,example:`&out [&strings * free(.4, 0..1)]`}),hit:K({form:`&x:0:n (a hit’s gain)`,name:`hit`,min:0,cell:"no: a hit’s gain is a number; a moving one is `velocity=&accent`, or a gate’s `level=`",example:`&beat step=8 &bd &hh:0:free(.4, 0..1)`}),weight:K({form:`style=[&a * n, …] (a weight)`,name:`weight`,min:0,cell:"no: a weight is a number; a crossfade is `style=&a..&b * &curve`",example:`&s style=[&funk * free(.8, 0..1), &bossa * .2]`}),tonic:K({form:`scale(name, n) (a tonic)`,name:`tonic`,key:`tonic`,whole:!0,rounds:!0,cell:"`&k` (a note); a tonic is a pitch class, never a range",moves:!0,example:`&key scale(dorian, free(2, 0..11))`}),rate:K({form:`step=n · loop=n (a rate)`,name:`step`,key:`step`,units:!0,cell:"a clock (`step=&bar`): another meaning",moves:!0,example:`&bar meter("4/4") step=free(90bpm, 60..240)`}),by:K({form:`step=&bar*n · step=&bar/n`,name:`by`,min:0,cell:G,example:`&fast step=&bar*free(2, 1..4) 0 2`}),shift:K({form:`shift=n`,name:`shift`,key:`shift`,whole:!0,rounds:!0,cell:G,example:`&key step=cycle(&theme) shift=free(0, 0..11)`}),stride:K({form:`stride=n`,name:`stride`,key:`stride`,whole:!0,rounds:!0,cell:G,example:`&key step=cycle(&theme) stride=free(0, 0..7)`}),cycle:K({form:`cycle=n`,name:`cycle`,whole:!0,min:0,cell:G,example:`&wheel cycle=free(1, 0..4) 0 4 7`}),laps:K({form:`laps=n`,name:`laps`,whole:!0,min:1,cell:G,example:`&bar meter("4/4") step=84bpm laps=free(30, 1..60)`}),chance:K({form:`chance=p`,name:`chance`,key:`chance`,cell:G,example:`&ghost chance=free(.7, 0..1) step=4 0? 0?`}),seed:K({form:`seed=n`,name:`seed`,whole:!0,cell:G,example:`&ghost seed=free(7, 0..99) step=4 0? 0? 0? 0?`}),size:K({form:`size=x`,name:`size`,min:.25,max:4,cell:G,example:`&theme size=free(2, .25..4) step=2 0 2 4`}),interval:K({form:`scan(n …) (an interval)`,name:`interval`,key:`interval`,cell:G,example:`&mode scan(2 2 free(1, 1..2) 2 2 2 1)`}),intervals:K({form:`scan(n!k …) (an interval’s repeat)`,name:`repeat`,whole:!0,min:1,cell:G,example:`&map scan(1!free(4, 1..8) 2)`}),geo:K({form:`geo(r, n, k …)`,name:`geo`,cell:G,example:`&series scan(geo(free(5, 2..8), 25, 0 10 5))`}),args:K({form:`euclid(k, n, r) · even(k, n, r) · sin(n) …`,name:`arg`,whole:!0,cell:G,example:`&hits euclid(free(3, 0..8), 8) step=8`}),fifths:K({form:`fifths(n)`,name:`fifths`,whole:!0,cell:G,example:`&circle fifths(free(1, 0..11))`}),phase:K({form:`scale(t, phase) (retired)`,name:`phase`,whole:!0,min:0,max:6,cell:G,example:`&key scale(2, free(3, 0..6))`}),meter:K({form:`meter(n, n)`,name:`meter`,key:`choice`,cell:G,example:`&bar meter(free(2, 0..3, "2/4 3/4 4/4 6/8")) step=90bpm`}),grid:K({form:`map=edo(n) · map=ed(n, r) · map=midi(c, p)`,name:`grid`,whole:!0,min:1,cell:G,example:`&edo map=edo(free(19, 5..31))`}),ratio:K({form:`map=ed(r)`,name:`ratio`,cell:G,example:`&bp cycle=13 map=ed(free(3, 1.5..4))`}),step:K({form:`0 2 4 (a step of a braid)`,name:`value`,cell:"a cell plays there (`&k`, spliced)",moves:!0,example:`&tune step=2 0 free(2, 0..7) 4`}),modifier:K({form:`x!n · x@n · x*n · x/n`,name:`count`,whole:!0,min:1,max:4096,cell:G,example:`&beat step=4 0!free(4, 1..8) 2`}),drop:K({form:`x?p`,name:`drop`,min:0,max:1,cell:G,example:`&hats step=4 0 0?free(.3, 0..1)`}),euclidOn:K({form:`x(k, n, r)`,name:`euclid`,whole:!0,cell:G,example:`&groove step=1 0(free(3, 0..8),8)`}),pick:K({form:`&x[i] · &x[a:b:s] · &x[$i]`,name:`pick`,whole:!0,cell:`${G}: picking while it plays is a selector's (#51)`,example:`&tune step=2 &motif[free(0, 0..3)]`}),turn:K({form:`&x[<<n] · &x[>>n]`,name:`turn`,whole:!0,min:0,cell:G,example:`&canon step=2 &theme[>>free(4, 0..7)]`}),move:K({form:`&x^n · &x^$n`,name:`move`,whole:!0,cell:G,example:`&tune step=2 &motif &motif^free(1, -7..7)`}),tier:K({form:`tier=n`,name:`tier`,fixed:`the tutorial's order, not the piece's`,cell:G,example:`&piece title="Steps" tags="tutorial" tier=1`}),hitNumber:K({form:`&x:n (a hit’s number)`,name:`hit`,fixed:`a pitched hit is not yet: it is 0`,cell:G,example:`&beat step=8 &bd:0`})},Pr=/[A-Za-z_][A-Za-z0-9_]*/y,Fr=/-?[0-9]+/y,Ir=/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)\.\.-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)\s*\*\s*&/y,Lr=/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y,Rr=4096;var zr=class extends Error{col;len;constructor(e,t,n=1){super(e),this.col=t,this.len=n}},Br=class e{text;line;offset;lambdas;parts;warnings;depth;body;i=0;frees=[];constructor(e,t,n=0,r=[],i=[{line:t,start:0}],a=[],o=0,s){this.text=e,this.line=t,this.offset=n,this.lambdas=r,this.parts=i,this.warnings=a,this.depth=o,this.body=s}within(t,n,r=this.depth){return new e(t,this.line,this.offset+n,this.lambdas,this.parts,this.warnings,r,this.body)}warn(e,t,n){this.warnings.push({severity:`warning`,message:e,span:{...this.place(t),len:n}})}place(e){let t=e+this.offset,n=this.parts[0];for(let e of this.parts)e.start<=t&&(n=e);return{line:n.line,col:t-n.start+1,len:Math.max(1,this.i-e)}}skipSpace(){for(;this.i<this.text.length&&/\s/.test(this.text[this.i]);)this.i++}done(){return this.skipSpace(),this.i>=this.text.length}peek(){return this.text[this.i]??``}span(e){return{line:this.line,col:e+1+this.offset,len:Math.max(1,this.i-e)}}fail(e,t=this.i,n=1){throw new zr(e,t+this.offset,n)}match(e){e.lastIndex=this.i;let t=e.exec(this.text);return t?(this.i+=t[0].length,t[0]):null}ident(e){let t=this.match(Pr);return t===null&&this.fail(`Expected ${e}`),t}free(e,t=e.name){if(!this.text.startsWith(`free(`,this.i))return this.refuseCell(e),null;let n=this.i;e.fixed&&this.fail(`${e.form}: a number, not free(…) — ${e.fixed}`,n,5);let r=e.key??`param`,i=jr(this,r,!!e.units,{...r===`param`?{param:t}:{},...e.whole?{whole:!0}:{}}),a=this.i-n;return i.text!==void 0&&r!==`choice`&&this.fail(`free("…") is a text, for spell(…) and meter(…): ${e.form} takes free(v, lo..hi)`,n,a),e.whole&&!e.rounds&&![i.lo,i.hi].every(Number.isInteger)&&this.fail(`${e.form} takes a whole number: free(…)'s range whole — free(${Math.round(i.value)}, ${Math.floor(i.lo)}..${Math.ceil(i.hi)})`,n,a),(e.min!==void 0&&i.lo<e.min||e.max!==void 0&&i.hi>e.max)&&this.fail(`${e.form}: free(…) moves within ${e.min??`…`}..${e.max??`…`} — free(${i.value}, ${Math.max(i.lo,e.min??i.lo)}..${Math.min(i.hi,e.max??i.hi)})`,n,a),i}freeNumber(e,t){let n=this.free(e,t);return n===null?null:e.whole?Math.round(n.value):n.value}refuseCell(e){Ir.lastIndex=this.i;let t=Ir.test(this.text);if(!t&&(this.peek()!==`&`||e.moves))return;let n=Math.max(1,/^[^\s,)\]]*/.exec(this.text.slice(this.i))[0].length),r=t?`a range moved by cells`:`a cell`;this.fail(e.cell.startsWith(`no: read as the piece is built`)?`${e.form} is read as the piece is built: a number, or free(v, lo..hi), whose slider compiles it again — ${r} moves only a number read while the piece plays (decision 078)`:`${e.form} takes a number, or free(v, lo..hi), and ${r} isn't read here: ${e.cell.replace(/^no: /,``)} (decision 078)`,this.i,n)}int(e,t,n){let r=this.freeNumber(t,n);if(r!==null)return r;let i=this.match(Fr);return i===null&&this.fail(`Expected ${e}`),parseInt(i,10)}num(e,t,n){let r=this.freeNumber(t,n);if(r!==null)return{value:r,alter:0};let i=this.match(Lr);i===null&&this.fail(`Expected ${e}`);let a=parseFloat(i);if(this.peek()===`/`&&/[0-9.]/.test(this.text[this.i+1]??``)){this.i++;let e=this.match(Lr);(e===null||parseFloat(e)===0)&&this.fail(`a fraction needs a denominator, like 9/8`),a/=parseFloat(e)}let o=0;for(;this.peek()===`#`||this.peek()===`b`;)o+=this.text[this.i++]===`#`?1:-1;return{value:a,alter:o}}noteName(){let e=this.match(/[A-G](?:#|b)?(?:-?[0-9]+)?(?![A-Za-z0-9_])/y);return e===null?null:Cr(e)}expect(e,t){this.peek()!==e&&this.fail(`Expected ${t}`),this.i++}lambda(){let e=this.i;this.depth>=32&&this.fail(`Unnamed cells &( … ) nest 32 deep at most: name the inner ones (&env …) and refer to them`,e-1,2);let t=0,n=-1;for(let r=e;r<this.text.length;r++)if(this.text[r]===`(`)t++;else if(this.text[r]===`)`&&--t===0){n=r;break}n<0&&this.fail(`')' to close &( … )`,e);let r=`λ${this.line}_${e+this.offset}`;this.body||this.fail(`An unnamed cell &( … ) here has no parser for its body`,e-1,2);let i=this.within(this.text.slice(e+1,n),e+1,this.depth+1),a=this.body(i,{name:r,pick:null,shift:0,span:{line:this.line,col:e+this.offset,len:n-e+2}});return this.lambdas.push({...a,lambda:this.text.slice(e+1,n).trim()}),this.i=n+1,r}ref(e){let t=this.i;this.expect(`&`,e);let n=this.peek()===`(`?this.lambda():this.ident(`a name after &`),r=null,i=0;if(this.peek()===`[`){this.i++,this.skipSpace();let e=this.match(/<<|>>/y);if(e){this.skipSpace();let a=this.freeNumber(q.turn),o=a===null?this.match(/[0-9]+/y):String(a);return i=(e===`<<`?-1:1)*(o===null?1:parseInt(o,10)),this.skipSpace(),this.expect(`]`,`']' to close &${n}[${e}…]`),{name:n,pick:r,shift:i,...this.transposition(n),span:this.span(t)}}let a=this.match(/[a-z][A-Za-z]*(?=\s*\])/y);if(a!==null)return this.skipSpace(),this.expect(`]`,`']' to close &${n}[${a}]`),{name:n,pick:r,shift:i,slot:a,...this.transposition(n),span:this.span(t)};let o=this.peek()===`$`&&(this.i++,this.skipSpace(),1)?{abs:!0}:{},s=()=>{let e=this.freeNumber(q.pick);return e===null?this.match(Fr):String(e)},c=s();if(this.skipSpace(),this.peek()===`:`){this.i++,this.skipSpace();let e=s();this.skipSpace();let t=null;if(this.peek()===`:`){this.i++,this.skipSpace();let e=this.i,n=s();n!==null&&parseInt(n,10)===0&&this.fail(`A slice step of 0 never moves`,e,n.length),t=n===null?null:parseInt(n,10),this.skipSpace()}r={kind:`slice`,from:c===null?null:parseInt(c,10),to:e===null?null:parseInt(e,10),...t===null?{}:{step:t},...o}}else c===null&&this.fail(`Expected an index like &${n}[0] (&${n}[$0] as written), or a slice like &${n}[1:]`),r={kind:`at`,i:parseInt(c,10),...o};this.expect(`]`,`']' to close &${n}[…]`)}else if((this.peek()===`+`||this.peek()===`-`)&&/[0-9]/.test(this.text[this.i+1]??``)){let e=this.peek(),r=/[0-9]+/.exec(this.text.slice(this.i+1))[0];this.fail(`&${n}${e}${r}: write &${n}^${e===`-`?`-`:``}${r} to move it by its table's steps (in a braid; ^$${e===`-`?`-`:``}${r}: by semitones), &${n} ${e} ${r} to add pitch (in a mix), &${n}[${e===`-`?`<<`:`>>`}${r===`1`?``:r}] to shift it, or &${n}[…] to pick from it`,t,this.i-t+1+r.length)}return{name:n,pick:r,shift:i,...this.transposition(n),span:this.span(t)}}rejectTap(e){if(this.peek()!==`:`)return;let t=/^(?:(?:pulse|beat)(?:\*\d+)?|\d+[nt]\.?|\d*m)(?![\w.])/.exec(this.text.slice(this.i+1));if(!t)return;let n=this.text.slice(e,this.i+1+t[0].length);this.fail(`${n} is a meter's tap, which only step= reads (step=${n}): here it names no cell`,e,n.length)}cellRef(e,t,n=!1){let r=this.i,i=this.ref(e);n||this.rejectTap(r);let a=this.text.lastIndexOf(`^`,this.i-1);return a>=r&&a>this.text.lastIndexOf(`)`,this.i-1)&&this.warn(`${this.text.slice(r,this.i)} ${t}: ^ and ^$ move a cell a braid plays (and base=&cell^n, a copy, and a gate's play=&cell^n); here it is the cell itself, so the move is ignored`,a,this.i-a),i}transposition(e){if(this.peek()!==`^`)return{};let t=this.i;this.i++;let n=this.peek()===`$`;n&&this.i++;let r=this.freeNumber(q.move),i=r===null?this.match(/-?[0-9]+/y):String(r);i===null&&this.fail(`&${e}^n moves it n steps of its table (&${e}^1, a degree up), &${e}^$n n semitones (&${e}^$7, &${e}^$-12)`,t,1),this.peek()===`.`&&/[0-9]/.test(this.text[this.i+1]??``)&&this.fail(`&${e}${this.text.slice(t,this.i)}…: ^ takes a whole number of steps (&${e}^1, &${e}^$-12)`,t,this.i-t+1+/^[0-9]+/.exec(this.text.slice(this.i+1))[0].length),this.peek()===`^`&&this.fail(`&${e}${this.text.slice(t,this.i)}^…: one ^ per reference; nest with degree(…): degree(&${e}${this.text.slice(t,this.i)}, n)`,this.i,1);let a=parseInt(i,10);return a?n?{transpose:a}:{degree:a}:{}}atBoundary(){let e=this.peek();return e===``||/\s/.test(e)}};function Vr(e){let t=!1;for(let n=0;n<e.length;n++){let r=e[n];if(r===`"`)t=!t;else if(!t&&r===`/`&&e[n+1]===`/`)return e.slice(0,n);else if(!t&&r===`#`&&(n===0||/\s/.test(e[n-1])))return e.slice(0,n)}return e}let J=(e,t,n)=>({help:e,doc:t,value:`syntax`,...n?{on:n}:{}}),Y=(e,t={})=>({help:e,doc:`sound.md`,value:`number`,on:[`voice`],voice:!0,...t}),X=(e,t,n={})=>({help:e,doc:`physics.md`,value:`number`,on:t,...n}),Hr={over:J(`the table its numbers read`,`tables.md`),base:J(`the cell it is a copy of, changed where it says: its braid step by step over the base’s (= keeps a step), its attributes where it sets none`,`braid.md`),step:J(`what moves it, step by step`,`time.md`),loop:J(`what moves it, the whole braid at a time, read as a signal: each value held, no note started each step (a voice alone sounds as one held note, &a loop=A4)`,`time.md`),shift:J(`how far it is turned`,`tables.md`),stride:J(`how far each step turns it`,`time.md`),map:J(`how its values sound`,`sound.md`),show:J(`how it’s shown: notes, do, scale, pattern … (and everything below it)`,`display.md`),label:J(`a name to show, in quotes — alone on a cell, a note in the graph`,`display.md`),env:J(`a voice’s own volume on every note: an envelope`,`sound.md`,[`voice`]),pitch:{...J(`a voice’s own pitch on every note: a vibrato, or a shape in semitones (pitch=0..30 * &(map=adsr 0 .04 0 0): a drop)`,`sound.md`,[`voice`]),moves:!0},cycle:J(`laps before it comes round: a turning table’s, an index read through it, a tap’s bars; 0 holds the first entry (a grid’s size is its map’s, map=edo(19))`,`tables.md`),size:J(`how large it’s drawn, against the others: 2 twice, .5 half`,`display.md`),laps:J(`how many laps it plays, then it ends`,`time.md`),chance:J(`what a bare x? means here: the probability it is dropped, or free() for a slider`,`cell.md`),seed:J(`a different sequence of chance`,`cell.md`),title:{...J(`on a note: the piece’s title (its card), the old spelling: its file’s frontmatter holds it`,`display.md`,[`note`]),old:`title: in the frontmatter`},tags:J(`on a cell: its clusters in the graph, comma-separated (on the piece’s card, the old spelling of its tags: its file’s frontmatter holds them)`,`display.md`),about:J(`on a note: the cells it explains`,`display.md`,[`note`]),style:J(`its style: a map=style cell, &(map=style …), or a mix of them by weight; or a range from one to another over its scope (style=&funk..&bossa). On the note &style, the section’s, read by axis (&style[bite])`,`style.md`),tier:{...J(`on a piece’s card: its tier of the tutorial (1 the first), the old spelling: its file’s frontmatter holds it`,`display.md`,[`note`]),old:`tier: in the frontmatter`}},Ur={s:Y(`sound source: sine tri saw square pulse white pink brown; or a blend of two waves, the share of the second moved by cells: s=tri..square * &style[bite]`,{value:`word`}),lpf:Y(`low-pass cutoff, Hz`,{moves:!0,hz:!0}),lpq:Y(`low-pass resonance`,{moves:!0}),hpf:Y(`high-pass cutoff, Hz`,{moves:!0,hz:!0}),hpq:Y(`high-pass resonance`,{moves:!0}),bpf:Y(`band-pass centre, Hz (decision 074)`,{moves:!0,hz:!0}),bpq:Y(`band-pass Q: the centre over the bandwidth, 1 unless given (decision 074)`,{moves:!0}),ftype:Y(`its filters' model (decision 074): 12db (the default, one biquad each), 24db (two in series), ladder (its low-pass a ladder, lpq= its resonance, drive= its drive); or superdough's numbers 0, 2, 1`,{value:`word`}),room:Y(`reverb send 0–1`,{moves:!0}),delay:Y(`delay send 0–1`,{moves:!0}),delaytime:Y(`echo time, seconds — or a clock: &bar*2 (an eighth at the tempo) — or a tap: 8n, 4n.`,{clock:!0}),delayfeedback:Y(`echo feedback 0–1`),glide:{help:`tied notes (each starting as the one before ends) play as one: its envelope once, each next a slide there over this many seconds (dough’s glide; 0 or none: each note its own)`,doc:`sound.md`,value:`number`,on:[`voice`]},oneshot:{help:`on a voice: 1 plays each note’s envelope through (its attack and decay), whatever its step, a drum hit on any grid; 0, the default, as long as its step (decision 068: the bare word oneshot, the old way)`,doc:`sound.md`,value:`number`,on:[`voice`]},note:{help:"on a kit’s member: its MIDI note on the kit’s channel (36 a kick, 38 a snare, General MIDI’s drums: `gm_kit` writes each), a whole number 0–127; its name gives none (decision 075). A member with none takes the next free note from 36",doc:`midi.md`,value:`number`,on:[`voice`],form:`note=n (a whole number 0–127)`},legato:{help:`on a line: each note sounds its written length (@n, _) times this share, its end swung as its onset is, Strudel’s legato (.5 staccato, 1 as written, 1.5 into the next): a number, free(), or a cell of shares read at each onset (legato=&artic); nothing cuts a note at the bar line`,doc:`sound.md`,value:`number`,on:[`clock`,`driven`],moves:!0,form:`legato=n · legato=free(n, lo..hi) · legato=&x · legato=lo..hi * &a * &b · on a meter, its lines’ default by level: legato=16n:r,4n:r`},pan:Y(`where it sits in stereo: 0 left, .5 centre (as without it), 1 right — the far side fades; it can move, read at each note’s start (pan=&space, pan=0..1 * &lfo)`,{moves:!0}),distort:Y(`distortion: 0 clean, .3 gritty, 1 and more harsh`),crush:Y(`bit depth: 16 clean, 8 grainy, 3 and fewer: rubble`),fm:Y(`frequency modulation: the voice that modulates this one (fm=&op); it may have its own fm=`,{doc:`physics.md`,value:`cell`}),ratio:Y(`as a modulator: its frequency against its carrier’s (1 the same, 3.5 a bell)`,{doc:`physics.md`,on:[`modulator`]}),index:Y(`FM depth: how far the modulator swings the frequency (0 none … 10 bright); it can move`,{doc:`physics.md`,on:[`carrier`],moves:!0}),body:Y(`a resonator: what its exciters are — fork, bell, bar, plate, box, tine, pipe, wire, spring; its braid lists them (semitones; the twelve by default), a note plucks the nearest`,{doc:`physics.md`,value:`word`}),ring:Y(`a resonator: how long it rings, in seconds`,{doc:`physics.md`}),hard:Y(`a resonator: the mallet — 0 felt (dark), 1 steel (bright)`,{doc:`physics.md`}),board:X(`a resonator: the body its exciters share (box by default, an octave below; none: no board)`,[`resonator`],{value:`word`}),couple:X(`a resonator: another it shares a table with (couple=&other) — each sets the other ringing`,[`resonator`],{value:`cell`}),coupling:X(`a resonator: how strongly it is coupled (.01 faint, .05 strong)`,[`resonator`]),excite:X(`a resonator: sound that drives it (excite=&mix) — it answers where the sound meets its modes`,[`resonator`],{value:`cell`}),postgain:{help:`on the sound card: its master, a linear gain after everything (Strudel’s postgain: 1 as it is, .5 half, a negative one inverts the phase; free(.8, 0..1) a slider)`,doc:`mix.md`,value:`number`,on:[`card`]},beat:{help:`on a meter, retired (#502): how many beats it counted, equal; a meter counts its beats by its signature or its levels (meter("2/2", 2): alla breve)`,doc:`time.md`,value:`number`,on:[`clock`],old:`the signature: meter("2/2", 2)`},pulse:{help:`on a scan: the note value of its entries (pulse=16n: sixteenths) — its beats then count quarters, and its taps read note values by it`,doc:`time.md`,value:`word`,on:[`clock`,`driven`]},swing:{help:`on a meter: a level of its bar leans, named by note value — of each pair of its eighths (swing=8n:.67), the second comes this far through their beat (.5 straight, .67 triplet swing), its pairs lean, a group of three straight (decision 071); every beat and bar line stays. Bare (swing=.6), on a list at a rate: pairs of its steps (on a meter, an error that names the level)`,doc:`time.md`,value:`number`,on:[`clock`],form:`swing=8n:r · swing=8n:r,16n:r · swing=8n:free(r, lo..hi) · swing=r`},bend:{help:`on a meter: a level’s nodes played at the lengths a table gives, named by note value — bend=4n:&rubato with &rubato 27 23 26 24 plays the beats 27:23:26:24 of the bar (decision 080); finer levels within each, swung as they would be; a table longer than the bar spans as many bars as it takes, a tempo map. A scan(…) with a rate is its sugar`,doc:`time.md`,value:`cell`,on:[`clock`],form:`bend=4n:&table`},motor:X(`on a meter: it turns physically — a motor this strong pulls it to its tempo (from rest)`,[`clock`]),mass:X(`physics: how heavy it turns (inertia); on a cell a meter drives, load`,[`clock`,`driven`]),friction:X(`physics: drag — the meter sags below its tempo, more with more load`,[`clock`,`driven`]),wind:X(`on a meter with a motor: its spring runs down over this many seconds, and it coasts to a stop`,[`motor`]),wow:X(`on a meter with a motor: its speed swings slowly by this fraction (.01: a tape machine’s wow)`,[`motor`]),varispeed:X(`on a clock: its notes’ pitch follows its speed, as tape does (1 fully, 0 not)`,[`clock`,`driven`]),belt:X(`on a driven cell (step=&x): it follows through a belt this stiff (200 taut, 20 slack) — it lags, swings, catches up`,[`driven`]),damping:X(`a belt’s damping: how soon its swinging dies (0 rings on, high creeps)`,[`driven`]),slip:X(`a belt’s grip: past this pull it slips, and the cell falls behind for good`,[`driven`]),write:X(`a tape: what its write head records (write=&melody); it moves with its step=`,[`tape`],{value:`cell`}),length:X(`a tape: how long its loop is, in seconds of tape (or a clock: length=&bar/4, or a tap: length=1m); none, an open reel`,[`tape`],{clock:!0}),erase:X(`a tape: how much of what was there each pass under the write head wipes (1 all, .3 leaves ghosts)`,[`tape`]),tone:X(`a sound tape: its loss — each pass through the loop darker (Hz: 7000 bright, 1500 worn)`,[`tape`],{hz:!0}),drive:X(`how hard it saturates: a sound tape, each pass (0 clean, .5 warm, 1 crushed); a ladder (ftype=ladder, decision 074), its input pushed by e^drive into its stages, .69 unless given (superdough's)`,[`tape`,`voice`]),hiss:X(`a sound tape: its noise floor (0 none, .02 a cassette)`,[`tape`]),print:X(`a sound tape: print-through — a faint pre-echo before each head (.03 a whisper)`,[`tape`]),printgap:X(`a sound tape: how far before each head the print-through sits (tape-seconds, .6)`,[`tape`]),dropout:X(`a sound tape: brief gaps in the playback, about this many a second`,[`tape`],{hz:!0}),play:X(`a read head: the tape it reads (play=&tape), at= tape-seconds after the write head; a gate: the notes it plays on the voices in its braid (play=&tune)`,[`head`,`gate`],{value:`cell`}),at:X(`a read head: how far after the write head it sits, in seconds of tape (or a clock: at=&bar, or a tap: at=4n)`,[`head`],{clock:!0}),wander:X(`a read head: how far it wanders either way (tape-seconds) — a flying head`,[`head`]),wanderhz:X(`a read head: how fast it wanders (times a second)`,[`head`],{hz:!0}),level:{help:`on a gate: how loud, a product of level cells and a gain (level=&accent*&duck*.4)`,doc:`mix.md`,value:`number`,on:[`gate`]},licence:{help:`on a gate: its performer’s licence, how far it loosens velocity and length, a share of the feel’s (1 as the contract plays; 0 exactly as written)`,doc:`mix.md`,value:`number`,on:[`gate`]},accents:{help:`on a gate: its performer’s own accents, a share of the feel’s (1 as the contract plays; 0 none)`,doc:`mix.md`,value:`number`,on:[`gate`]},part:{help:`the part the default performer plays a line as (feel v3, decision 075): on a role cell, its performer’s part (&low map=role part=bass &lowOut), or on a line (&low part=bass …): bass, pad, stab, lead or drums; a name gives none`,doc:`mix.md`,value:`word`,form:`part=bass (bass, pad, stab, lead or drums)`},role:{help:`a drum line’s role, as the default performer plays it (feel v3, decision 075): kick, backbeat, ghost, hat, pedal, euclid, clave or fill (&k role=kick step=16n &bd!4); a name gives none`,doc:`mix.md`,value:`word`,form:`role=kick (kick, backbeat, ghost, hat, pedal, euclid, clave or fill)`},trigger:{help:`a gate, the old spelling of play=: the notes it plays (trigger=&tune)`,doc:`mix.md`,value:`cell`,on:[`gate`],old:`play=`},gate:{help:`a gate, the old spelling: a level over time, one factor of level= (gate=&duck)`,doc:`mix.md`,value:`cell`,on:[`gate`],old:`level=`},velocity:{help:`a gate, the old spelling: a level, one factor of level= (velocity=&accent)`,doc:`mix.md`,value:`cell`,on:[`gate`],old:`level=`},gain:{help:`on a voice: its own gain, dough’s, times every gain it is played at (1 by default, a negative one inverts the phase; a kit member’s balance); on a gate written the old way (trigger=): the number in level=`,doc:`sound.md`,value:`number`,on:[`voice`,`gate`]},scope:{help:`a scope: stack, split, xy (in time) — spectrum, waterfall (in frequency, or value); its braid lists its channels`,doc:`display.md`,value:`word`,on:[`scope`]},fold:{help:`a spectrum or waterfall: pitches folded by this stride into as many bins (12: by pitch class, the default)`,doc:`display.md`,value:`number`,on:[`scope`]},bins:{help:`a spectrum or waterfall without a fold: this many bands, low to high (1 a meter, 3 low-mid-high, 20 an equaliser)`,doc:`display.md`,value:`number`,on:[`scope`]},channels:{help:`a spectrum or waterfall: sum (one, the default) or split (each channel its own)`,doc:`display.md`,value:`word`,on:[`scope`]},restart:{help:`what switching a part on does to its time (on a selector: for all its sections) — restart (from its top, the default), resume (where it stopped), free (its time runs on, only its sound is switched; a performer’s default)`,doc:`time.md`,value:`word`,on:[`section`,`performer`,`selector`],stub:!0},law:{help:`a law that computes the notes (law=fiveto12: the 5 to 12 cycle, a day of music)`,doc:`time.md`,value:`word`,on:[`law`]},anchor:{help:`a clock (a day meter, loop=1d): the time of day it stands at when play starts (hours.minutes — 11.55); play begins where the clock stands`,doc:`time.md`,value:`number`,on:[`clock`]}},Wr={sound:`s`,cutoff:`lpf`,ctf:`lpf`,lp:`lpf`,resonance:`lpq`,hcutoff:`hpf`,hp:`hpf`,hresonance:`hpq`,bandf:`bpf`,bp:`bpf`,bandq:`bpq`,verb:`room`,reverb:`room`,delayt:`delaytime`,dt:`delaytime`,delayfb:`delayfeedback`,dfb:`delayfeedback`,clip:`legato`},Gr={...Hr,...Ur},Kr=new Set(Object.keys(Ur).filter(e=>Ur[e].value===`cell`)),qr=new Set(Object.keys(Ur).filter(e=>Ur[e].clock)),Jr=new Set(Object.keys(Gr).filter(e=>Gr[e].moves)),Yr=new Set(Object.keys(Ur).filter(e=>Ur[e].voice)),Xr=new Set(Object.keys(Ur).filter(e=>Ur[e].doc!==`physics.md`&&Ur[e].on?.every(e=>e===`clock`||e===`driven`))),Zr=/* @__PURE__ */ new Set([`part`,`role`]),Qr=e=>Object.keys(e).some(e=>!Xr.has(e)&&!Zr.has(e));function $r(e){let t={voice:`a voice`,clock:`a meter (step= a rate)`,driven:`a driven cell (step=&x)`,motor:`a meter with a motor=`,tape:`a tape (write=)`,head:`a read head (play=)`,resonator:`a resonator (body=)`,scope:`a scope (scope=)`,law:`a law (law=)`,card:`the sound card (map=sample)`,note:`a note (a label= and nothing else)`,carrier:`a voice with fm=`,modulator:`a voice another’s fm= names`,gate:`a gate (play= with a braid)`,section:`a section (a name a stepped table of names declares)`,performer:`a performer (a gate or a role a band names)`,selector:`a selector (over= a table of sections, or a band)`},n=e.map(e=>t[e]);return n.length<2?n[0]??``:`${n.slice(0,-1).join(`, `)} or ${n[n.length-1]}`}function ei(e){let t=null,n=e.length<5?2:3;for(let r of Object.keys(Gr)){let i=ti(e,r);i<n&&([t,n]=[r,i])}return t}function ti(e,t){let n=Array.from({length:e.length+1},(e,n)=>[n,...Array(t.length).fill(0)]);for(let e=1;e<=t.length;e++)n[0][e]=e;for(let r=1;r<=e.length;r++)for(let i=1;i<=t.length;i++)n[r][i]=Math.min(n[r-1][i]+1,n[r][i-1]+1,n[r-1][i-1]+(e[r-1]===t[i-1]?0:1)),r>1&&i>1&&e[r-1]===t[i-2]&&e[r-2]===t[i-1]&&(n[r][i]=Math.min(n[r][i],n[r-2][i-2]+1));return n[e.length][t.length]}let ni=[`12db`,`ladder`,`24db`];function ri(e){return e===void 0?`12db`:typeof e==`number`?Number.isInteger(e)&&e>=0&&e<ni.length?ni[e]:null:ni.includes(e)?e:null}Object.fromEntries(Object.entries(Ur).map(([e,t])=>[e,t.help]));let ii={sine:`sine`,tri:`triangle`,triangle:`triangle`,saw:`sawtooth`,sawtooth:`sawtooth`,square:`square`,pulse:`square`,white:`white`,pink:`pink`,brown:`brown`},ai=e=>`${e}= is gone: an envelope is a cell — in the mix, &theme * &(map=adsr .01 .3 .5 .4) * &lead, or an instrument, &lead [&(map=adsr .01 .3 .5 .4) * &saw]; on the envelope, its slots by name: &(map=adsr attack=.01 decay=.3 sustain=.5 release=.4)`,oi=e=>`${e}= is gone: a pitch drop is a pitch shape, an envelope in semitones — penv=30 pdec=.04 is pitch=0..30 * &(map=adsr 0 .04 0 0)`,si={attack:ai(`attack`),decay:ai(`decay`),sustain:ai(`sustain`),release:ai(`release`),penv:oi(`penv`),pdec:oi(`pdec`)},ci=`fifths12TET`,li=`key:main`,ui=5e4,di=2e3,fi=[`name`,`notes`,`tonic`,`mode`,`steps`,`tempo`,`shift`],pi={fork:[[1,1,1],[6.27,.03,.35]],bell:[[.5,1,.5],[1,.8,1],[1.2,.6,.7],[1.5,.5,.45],[2,.45,.6],[2.5,.3,.35],[2.67,.28,.3],[3,.22,.25]],bar:[[1,1,1],[2.756,.45,.5],[5.404,.22,.3],[8.933,.12,.18]],plate:[[1,1,.8],[1.58,.8,.7],[2.24,.7,.6],[2.92,.55,.55],[3.15,.5,.5],[3.88,.4,.4],[4.47,.35,.35],[5,.3,.3]],box:[[1,1,1],[1.42,.7,.6],[1.91,.5,.45],[2.53,.35,.3]],tine:[[1,1,1],[5.93,.12,.35],[17.6,.03,.12]],pipe:[1,3,5,7,9,11,13].map(e=>[e,1/Math.sqrt(e),1/e]),wire:Array.from({length:12},(e,t)=>t+1).map(e=>[e*Math.sqrt(1+6e-4*e*e),1/(.6+.4*e),1/e]),spring:[[1,1,1]]};function mi(e){if(typeof e!=`number`)return[1,1];let t=Math.min(1,Math.max(0,e));return[Math.min(1,2*(1-t)),Math.min(1,2*t)]}let hi=e=>e?.map?.kind===`midi`,gi=e=>t=>e.cells.get(t)?.shift??0,_i={SAMPLE_RATE:48e3,A4:440},vi={C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2};function yi(e,t=440){let n=/^([A-G])([#b]?)(-?\d+)$/.exec(e);return n?t*2**((vi[n[1]]+(n[2]===`#`?1:n[2]===`b`?-1:0)+12*(parseInt(n[3],10)-4))/12):null}function bi(e,t){if(!t)return Array.from({length:e},(e,t)=>t);if(t.kind===`at`){let n=t.i<0?e+t.i:t.i;return n>=0&&n<e?[n]:null}let n=t.step??1,r=t=>t<0?e+t:t,i=[];if(n>0){let a=t.from===null?0:Math.max(0,Math.min(e,r(t.from))),o=t.to===null?e:Math.max(0,Math.min(e,r(t.to)));for(let e=a;e<o;e+=n)i.push(e)}else{let a=t.from===null?e-1:Math.max(-1,Math.min(e-1,r(t.from))),o=t.to===null?-1:Math.max(-1,Math.min(e-1,r(t.to)));for(let e=a;e>o;e+=n)i.push(e)}return i.length?i:null}function xi(e,t,n){let r=bi(e,t);return!r||!t||t.abs||!e?r:r.map(t=>((t+n)%e+e)%e)}function Si(e,t){if(!t)return e.steps;let n=xi(e.units.length,t,e.shift);return n?n.reduce((t,n)=>t+e.unitSteps[n],0):null}function Ci(e,t,n){let r=`&${e}${Un(t)}`,i=`&${e} has ${n} step${n===1?``:`s`}`;if(!t||t.kind===`at`)return`${r} picks nothing: ${t&&t.i<0?`before the start`:`past the end`}, ${i}`;let a=t.step??1;return a>0&&t.from!==null&&(e=>e<0?n+e:e)(t.from)>=n?`${r} picks nothing: it starts past the end, ${i}`:`${r} picks nothing: ${a>0?`it ends before it starts (a slice runs forwards unless its step is negative: [::-1])`:`it ends after it starts (a negative step runs backwards)`}, ${i}`}function wi(e){if(e.map?.kind!==`adsr`)return null;let t=e.units.map(e=>e.atom.kind===`note`?e.atom.value:NaN);return t.length!==4||t.some(e=>!(e>=0))?null:{attack:t[0],decay:t[1],sustain:Math.min(1,t[2]),release:t[3]}}function Ti(e){return e.root||e.scan!==null||!!e.bend}let Ei=e=>e.levels.length/Math.max(1,e.pulses);function Di(e){let t=/^([1-9][0-9]*)(n\.?|t)$/.exec(e);if(!t)return null;let n=parseInt(t[1],10);return t[2]===`n.`?3/(2*n):t[2]===`t`?2/(3*n):1/n}function Oi(e,t){let n=1/t,r=n/4;if(!(r>1))return{...e,unit:n};let i=[];for(let t=0;t<e.pulses-1e-9;t+=r)i.push(Math.min(r,e.pulses-t));return{...e,unit:n,beats:i,counted:e.pulses/r}}let ki=e=>e.counted??Math.max(1,e.beats.length);function Ai(e,t){let n=Math.max(1,Math.round(t)),{counted:r,...i}=e;return{...i,beats:Array.from({length:n},()=>e.pulses/n)}}function ji(e,t,n,r,i=1){let a=[],o=0;for(let s=0;s<n*r;s++){let n=e[s%e.length],r=i===1?n:n**+i;for(let e=0;e<t;e++)a.push(o+e*r/t);o+=r}return{positions:a,lap:o}}function Mi(e,t){let n=t.filter(e=>e.share!==.5);return n.length?{...e,swing:n}:e}function Ni(e){let t=e=>Math.abs(e-Math.round(e))<1e-9&&Math.round(e)>=1&&Number.isInteger(Math.log2(Math.round(e)));return t(1/e)?`${Math.round(1/e)}n`:t(2/(3*e))?`${Math.round(2/(3*e))}t`:t(3/(2*e))?`${Math.round(3/(2*e))}n.`:null}let Pi=e=>Ni(1/(e.unit*Ei(e)));function Fi(e,t){let n=t*e.unit;if(!e.beats.some(e=>{let t=e/n;return Math.abs(t-Math.round(t))<1e-9&&Math.round(t)>=2}))return`no beat of this meter divides into two or more of ${Ni(t)??`them`} (its beats: ${e.beats.map(t=>Ni(t/e.unit)??t).join(` `)}), and swing never moves a beat`;let r={...e,swing:[{level:Ni(t)??``,whole:t,share:.6}]};for(let t=0;t*n<e.pulses-1e-9;t++)if(Math.abs(zi(r,t*n)-t*n)>1e-9)return null;return`every group of ${Ni(t)??`them`} in it is three, and a swing leans pairs alone, its groups of three straight`}let Ii=e=>{for(let t=0,n=e;t<=6;t++,n*=2)if(Math.abs(n-Math.round(n))<1e-9)return!0;return!1};function Li(e,t){return t!==null&&e===2?[0,Math.min(.95,Math.max(.05,t.share)),1]:Array.from({length:e+1},(t,n)=>n/e)}function Ri(e,t,n,r){let i=Math.min(...n.map(e=>e.len)),a=e=>Math.abs(e-Math.round(e))<1e-9&&Math.round(e)>=1,o=r!==void 0&&r>0&&a(t/r)?r:void 0,s=0,c=t,l=0,u=t;for(let t=0;t<16;t++){let t=c/i,r=Math.round(t);if(Math.abs(t-r)>1e-9||r<2)break;let d=r===2||r===3?r:r%3==0?3:r%2==0?2:r,f=c/d,p=(e-s)/c*d;if(o===void 0?!Ii(p):!a(f/o))break;let m=Li(d,n.find(e=>Math.abs(e.len-f)<1e-9)??null),h=Math.min(d-1,Math.max(0,Math.floor(p+1e-9)));s+=h*f,c=f,l+=m[h]*u,u*=m[h+1]-m[h]}return l+(e-s)/c*u}function zi(e,t,n){if(!e.swing?.length)return t;let r=e.swing.map(t=>({len:t.whole*e.unit,share:t.share})),i=e.pulses,a=Math.floor(t/i+1e-9),o=t-a*i,s=0,c=0;for(;c<e.beats.length-1&&s+e.beats[c]<=o+1e-9;)s+=e.beats[c++];let l=e.beats[c]??i;return a*i+s+Ri(o-s,l,r,n)}function Bi(e){if(!e.swing?.length)return null;let t=Math.min(...e.swing.map(t=>t.whole*e.unit));if(!(t>0))return null;let n=[],r=0;for(let i of e.beats.length?e.beats:[e.pulses]){for(let e=0;e<i-1e-9;e+=t)n.push(r+e);r+=i}return n.push(e.pulses),{written:n,swung:n.map(t=>t>=e.pulses-1e-9?e.pulses:zi(e,t))}}function Vi(e,t){return Wi(e,t,!1)}function Hi(e,t){return Wi(e,t,!0)}let Ui=/* @__PURE__ */ new WeakMap;function Wi(e,t,n){Ui.has(e)||Ui.set(e,Bi(e));let r=Ui.get(e);if(!r)return t;let[i,a]=n?[r.swung,r.written]:[r.written,r.swung],o=e.pulses,s=Math.floor(t/o+1e-12),c=t-s*o,l=0;for(;l+2<i.length&&i[l+1]<=c+1e-12;)l++;let u=i[l+1]-i[l];return s*o+a[l]+(u>0?(c-i[l])/u*(a[l+1]-a[l]):0)}function Gi(e){let t=Ei(e),n=e.levels.map((n,r)=>zi(e,r/t)*t);return n.some((e,t)=>Math.abs(e-t)>1e-12)?n:null}function Ki(e,t){let n=t??qi(e);return{levels:e,written:`meter`,pulses:n.pulses,unit:n.unit,beats:n.beats}}function qi(e){let t=e.flatMap((e,t)=>t===0||e<=2?[t]:[]),n=t.map((n,r)=>(t[r+1]??e.length)-n),r=e.length/Math.max(1,n.length),i=Number.isInteger(Math.log2(r))?4*r:8;return{pulses:e.length,unit:i,beats:n}}function Ji(e){let t=e.length;return{levels:e.map(()=>1),written:`scan`,pulses:t,unit:4,beats:e.map(()=>1)}}function Yi(e,t,n=1){let r=[],i=e.pulses,a=i*Math.max(1,n);if(t.kind===`note`){let n=t.whole*e.unit;for(let e=0;e*n<a-1e-9;e++)r.push(e*n);return r}for(let a=0;a<Math.max(1,n);a++)if(t.kind===`bar`)r.push(a*i);else if(t.kind===`pulse`)for(let e=0;e<i;e++)r.push(a*i+e);else{let t=0;for(let n of e.beats)r.push(a*i+t),t+=n}return r}function Xi(e,t,n){let r=(t===`pulse`?1:t===`beat`?Math.max(...e.beats):t===`1m`?e.pulses:(Di(t)??0)*e.unit)/e.unit/n;return(e.legato??[]).filter(e=>e.whole>=r-1e-9).sort((e,t)=>e.whole-t.whole)[0]?.share??1}let Zi=[[`1P 2M 3M 5P 6M`,`major pentatonic`,`pentatonic`],[`1P 2M 3M 4P 5P 6M 7M`,`major`,`ionian`],[`1P 2M 3m 4P 5P 6m 7m`,`minor`,`aeolian`],[`1P 2M 3m 3M 5P 6M`,`major blues`],[`1P 3m 4P 5d 5P 7m`,`minor blues`,`blues`],[`1P 2M 3m 4P 5P 6M 7M`,`melodic minor`],[`1P 2M 3m 4P 5P 6m 7M`,`harmonic minor`],[`1P 2M 3M 4P 5P 6M 7m 7M`,`bebop`],[`1P 2M 3m 4P 5d 6m 6M 7M`,`diminished`,`whole-half diminished`],[`1P 2M 3m 4P 5P 6M 7m`,`dorian`],[`1P 2M 3M 4A 5P 6M 7M`,`lydian`],[`1P 2M 3M 4P 5P 6M 7m`,`mixolydian`,`dominant`],[`1P 2m 3m 4P 5P 6m 7m`,`phrygian`],[`1P 2m 3m 4P 5d 6m 7m`,`locrian`],[`1P 3M 4P 5P 7M`,`ionian pentatonic`],[`1P 3M 4P 5P 7m`,`mixolydian pentatonic`,`indian`],[`1P 2M 4P 5P 6M`,`ritusen`],[`1P 2M 4P 5P 7m`,`egyptian`],[`1P 3M 4P 5d 7m`,`neapolitan major pentatonic`],[`1P 3m 4P 5P 6m`,`vietnamese 1`],[`1P 2m 3m 5P 6m`,`pelog`],[`1P 2m 4P 5P 6m`,`kumoijoshi`],[`1P 2M 3m 5P 6m`,`hirajoshi`],[`1P 2m 4P 5d 7m`,`iwato`],[`1P 2m 4P 5P 7m`,`in-sen`],[`1P 3M 4A 5P 7M`,`lydian pentatonic`,`chinese`],[`1P 3m 4P 6m 7m`,`malkos raga`],[`1P 3m 4P 5d 7m`,`locrian pentatonic`,`minor seven flat five pentatonic`],[`1P 3m 4P 5P 7m`,`minor pentatonic`,`vietnamese 2`],[`1P 3m 4P 5P 6M`,`minor six pentatonic`],[`1P 2M 3m 5P 6M`,`flat three pentatonic`,`kumoi`],[`1P 2M 3M 5P 6m`,`flat six pentatonic`],[`1P 2m 3M 5P 6M`,`scriabin`],[`1P 3M 5d 6m 7m`,`whole tone pentatonic`],[`1P 3M 4A 5A 7M`,`lydian #5p pentatonic`],[`1P 3M 4A 5P 7m`,`lydian dominant pentatonic`],[`1P 3m 4P 5P 7M`,`minor #7m pentatonic`],[`1P 3m 4d 5d 7m`,`super locrian pentatonic`],[`1P 2M 3m 4P 5P 7M`,`minor hexatonic`],[`1P 2A 3M 5P 5A 7M`,`augmented`],[`1P 2M 4P 5P 6M 7m`,`piongio`],[`1P 2m 3M 4A 6M 7m`,`prometheus neapolitan`],[`1P 2M 3M 4A 6M 7m`,`prometheus`],[`1P 2m 3M 5d 6m 7m`,`mystery #1`],[`1P 2m 3M 4P 5A 6M`,`six tone symmetric`],[`1P 2M 3M 4A 5A 6A`,`whole tone`,`messiaen's mode #1`],[`1P 2m 4P 4A 5P 7M`,`messiaen's mode #5`],[`1P 2M 3M 4P 5d 6m 7m`,`locrian major`,`arabian`],[`1P 2m 3M 4A 5P 6m 7M`,`double harmonic lydian`],[`1P 2m 2A 3M 4A 6m 7m`,`altered`,`super locrian`,`diminished whole tone`,`pomeroy`],[`1P 2M 3m 4P 5d 6m 7m`,`locrian #2`,`half-diminished`,`aeolian b5`],[`1P 2M 3M 4P 5P 6m 7m`,`mixolydian b6`,`melodic minor fifth mode`,`hindu`],[`1P 2M 3M 4A 5P 6M 7m`,`lydian dominant`,`lydian b7`,`overtone`],[`1P 2M 3M 4A 5A 6M 7M`,`lydian augmented`],[`1P 2m 3m 4P 5P 6M 7m`,`dorian b2`,`phrygian #6`,`melodic minor second mode`],[`1P 2m 3m 4d 5d 6m 7d`,`ultralocrian`,`superlocrian bb7`,`superlocrian diminished`],[`1P 2m 3m 4P 5d 6M 7m`,`locrian 6`,`locrian natural 6`,`locrian sharp 6`],[`1P 2A 3M 4P 5P 5A 7M`,`augmented heptatonic`],[`1P 2M 3m 4A 5P 6M 7m`,`dorian #4`,`ukrainian dorian`,`romanian minor`,`altered dorian`],[`1P 2M 3m 4A 5P 6M 7M`,`lydian diminished`],[`1P 2M 3M 4A 5A 7m 7M`,`leading whole tone`],[`1P 2M 3M 4A 5P 6m 7m`,`lydian minor`],[`1P 2m 3M 4P 5P 6m 7m`,`phrygian dominant`,`spanish`,`phrygian major`],[`1P 2m 3m 4P 5P 6m 7M`,`balinese`],[`1P 2m 3m 4P 5P 6M 7M`,`neapolitan major`],[`1P 2M 3M 4P 5P 6m 7M`,`harmonic major`],[`1P 2m 3M 4P 5P 6m 7M`,`double harmonic major`,`gypsy`],[`1P 2M 3m 4A 5P 6m 7M`,`hungarian minor`],[`1P 2A 3M 4A 5P 6M 7m`,`hungarian major`],[`1P 2m 3M 4P 5d 6M 7m`,`oriental`],[`1P 2m 3m 3M 4A 5P 7m`,`flamenco`],[`1P 2m 3m 4A 5P 6m 7M`,`todi raga`],[`1P 2m 3M 4P 5d 6m 7M`,`persian`],[`1P 2m 3M 5d 6m 7m 7M`,`enigmatic`],[`1P 2M 3M 4P 5A 6M 7M`,`major augmented`,`major #5`,`ionian augmented`,`ionian #5`],[`1P 2A 3M 4A 5P 6M 7M`,`lydian #9`],[`1P 2m 2M 4P 4A 5P 6m 7M`,`messiaen's mode #4`],[`1P 2m 3M 4P 4A 5P 6m 7M`,`purvi raga`],[`1P 2m 3m 3M 4P 5P 6m 7m`,`spanish heptatonic`],[`1P 2M 3m 3M 4P 5P 6M 7m`,`bebop minor`],[`1P 2M 3M 4P 5P 5A 6M 7M`,`bebop major`],[`1P 2m 3m 4P 5d 5P 6m 7m`,`bebop locrian`],[`1P 2M 3m 4P 5P 6m 7m 7M`,`minor bebop`],[`1P 2M 3M 4P 5d 5P 6M 7M`,`ichikosucho`],[`1P 2M 3m 4P 5P 6m 6M 7M`,`minor six diminished`],[`1P 2m 3m 3M 4A 5P 6M 7m`,`half-whole diminished`,`dominant diminished`,`messiaen's mode #2`],[`1P 3m 3M 4P 5P 6M 7m 7M`,`kafi raga`],[`1P 2M 3M 4P 4A 5A 6A 7M`,`messiaen's mode #6`],[`1P 2M 3m 3M 4P 5d 5P 6M 7m`,`composite blues`],[`1P 2M 3m 3M 4A 5P 6m 7m 7M`,`messiaen's mode #3`],[`1P 2m 2M 3m 4P 4A 5P 6m 6M 7M`,`messiaen's mode #7`],[`1P 2m 2M 3m 3M 4P 5d 5P 6m 6M 7m 7M`,`chromatic`]];function Qi(e){let t=/^([1-7])([PMmAd])$/.exec(e);if(!t)throw Error(`not an interval: ${e}`);let n=Number(t[1]);return[0,2,4,5,7,9,11][n-1]+{P:0,M:0,m:-1,A:1,d:n===1||n===4||n===5?-1:-2}[t[2]]}let $i=Object.fromEntries(Zi.flatMap(([e,...t])=>{let n=e.split(` `).map(Qi),r=n.map((e,t)=>(n[t+1]??12)-e);return t.map(e=>[e,r])}));function ea(e,t){e.i++;let n=[];for(;e.skipSpace(),e.peek()!==`)`;){let t=e.i;if(e.text.startsWith(`geo(`,e.i)){e.i+=4,e.skipSpace();let r=e.num(`a ratio, like geo(5, 25, 0 10 5)`,q.geo,`ratio`).value;e.skipSpace(),e.expect(`,`,`',' then the steps per ratio: geo(${r}, 25, 0 10 5)`),e.skipSpace();let i=e.int(`the steps per ratio`,{...q.geo,whole:!0,min:1},`steps`);e.skipSpace(),e.expect(`,`,`',' then the exponents: geo(${r}, ${i}, 0 10 5)`);let a=[];for(;e.skipSpace(),e.peek()!==`)`;)a.push(e.num(`an exponent`,q.geo,`exponent`).value);e.i++,(!(r>0)||i<1||a.length===0)&&e.fail(`geo(r, n, k …): r above 0, n ≥ 1, at least one k`,t,e.i-t);for(let e of a)n.push(+(r**+(e/i)).toFixed(9));continue}let r=e.free(q.interval);if(r!==null)r.lo>0||e.fail(`A scan interval stays positive: give free(…) a range above 0`,t,e.i-t),n.push(r.value);else{let r=e.match(/[0-9]+(?:\.[0-9]+)?|\.[0-9]+/y);(r===null||!(parseFloat(r)>0))&&e.fail(`scan(…) takes positive intervals, like scan(2 2 1 2 2 2 1)`,t);let i=1;if(e.peek()===`!`){e.i++;let n=e.freeNumber(q.intervals),r=n===null?e.match(/[0-9]+/y):String(n);(r===null||!(parseInt(r,10)>=1))&&e.fail(`x!n repeats an interval n times: scan(1!4 2)`,t,e.i-t),i=parseInt(r,10)}for(let e=0;e<i;e++)n.push(parseFloat(r))}e.skipSpace(),e.peek()===`,`&&e.i++}e.expect(`)`,`')' to close scan(…)`),n.length===0&&e.fail(`scan(…) needs at least one interval`,t,e.i-t);let r=e.span(t);return e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`),{kind:`scan`,steps:n,span:r}}function ta(e,t){if(e<=0)return Array(t).fill(!1);let n=Array.from({length:e},()=>[!0]),r=Array.from({length:t-e},()=>[!1]);for(;r.length>1;){let e=Math.min(n.length,r.length),t=Array.from({length:e},(e,t)=>[...n[t],...r[t]]),i=n.length>e?n.slice(e):r.slice(e);n=t,r=i}return[...n,...r].flat()}function na(e,t){e.i++,e.skipSpace();let n;if(e.peek()===`f`)n=jr(e,`text`,!1).text??``;else{let t=e.match(/"[^"]*"/y);t===null&&e.fail(`spell(text, &table, "names"): the text first — "867 5309" or free("867 5309")`),n=t.slice(1,-1)}e.skipSpace(),e.expect(`,`,`',' then the table, like spell("867", &keys, "1 2 3 …")`),e.skipSpace();let r=e.cellRef(`the table its characters pick from, like &keys`,`in spell(…)`);e.skipSpace(),e.expect(`,`,`',' then the names of the table's entries, in quotes`),e.skipSpace();let i=e.match(/"[^"]*"/y);i===null&&e.fail(`the names of the table’s entries, in quotes: "1 2 3 A 4 5 6 B …"`);let a=i.slice(1,-1).trim().split(/\s+/).filter(Boolean);e.skipSpace(),e.expect(`)`,`')' to close spell(…)`);let o=e.span(t);e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);let s={atom:{kind:`rest`},repeat:1,subdivide:1,elongate:1,span:o},c=[...n].flatMap(e=>{let t=a.indexOf(e);return t<0?[s,s]:[{atom:{kind:`ref`,name:r.name,pick:{kind:`at`,i:t,abs:!0},shift:0},repeat:1,subdivide:1,elongate:1,span:o},s]});return c.length||c.push(s),{kind:`list`,tokens:c,span:o}}let ra=[2,3,4,6];function ia(e){let t=/^([1-9][0-9]*(?:\+[1-9][0-9]*)+)(?:\/(2|4|8|16|32))?$/.exec(e);if(t){let e=t[1].split(`+`).map(Number);return e.every(e=>ra.includes(e))?{pulses:e.reduce((e,t)=>e+t,0),unit:Number(t[2]??8),groups:e}:null}let n=/^([1-9][0-9]*)\/(2|4|8|16|32)$/.exec(e);if(!n)return null;let[r,i]=[Number(n[1]),Number(n[2])];if(r<2||r>32)return null;if(i>=8){let e=vr(Math.ceil(r/3),r,Math.ceil(r/3)-1);return{pulses:r,unit:i,groups:e.map((t,n)=>(e[n+1]??r)-t)}}return{pulses:r,unit:i,groups:r%3==0&&r>=6?Array(r/3).fill(3):Array(r).fill(1)}}function aa(e){let t=ia(e);return{pulses:t?.pulses??0,unit:t?.unit??4,beats:t?.groups??[]}}function oa(e){let t=Array(e).fill(1/0),n=(e,r,i)=>{if(t[e]=Math.min(t[e],i),r-e<=3){for(let n=e+1;n<r;n++)t[n]=Math.min(t[n],i+1);return}let a=e+vr(2,r-e,1)[1];n(e,a,i+1),n(a,r,i+1)};return n(0,e,0),t}function sa(e,t){let n=e.unit>=8?1:8/e.unit,r=e.groups.map(e=>e*n),i=oa(r.length),a=Math.max(0,...i),o=r.some(e=>e>=4)?a+1:null,s=(o??a)+1,c=s+1,l=/* @__PURE__ */ new Map;r.reduce((e,t,n)=>{if(l.set(e,i[n]),o!==null&&t>=4)for(let n=2;n<t;n+=2)l.set(e+n,o);return e+t},0);let u=e.unit>=8?t:t*e.unit/8,d=e.pulses*t;return{tiers:Array.from({length:d},(n,r)=>{let i=r/u,a=e=>Math.abs(e-Math.round(e))<1e-9;return a(i)?l.get(Math.round(i))??s:a(2*i)?c:e.unit<=4&&t===3?s:c}),eighth:s,step:c}}let ca=(e,t,n)=>e===0?`*`:e===n?`,`:e===t?`.`:`+-:;`[Math.min(e-1,3)],la=(e,t,n)=>e===0?0:e===n?4:e===t?3:Math.min(e,2),ua=e=>({"*":0,"+":1,"-":2,":":2,";":2,".":3,",":4})[e]??0,da=/^[*+\-:;.,]+$/;function fa(e,t){if(da.test(e))return e;let n=ia(e);if(!n)return``;let{tiers:r,eighth:i,step:a}=sa(n,t);return r.map(e=>ca(e,i,a)).join(``)}function pa(e,t){if(da.test(e))return[...e].map(ua);let n=ia(e);if(!n)return[];let{tiers:r,eighth:i,step:a}=sa(n,t);return r.map(e=>la(e,i,a))}function ma(e,t){e.i++,e.skipSpace();let n=t=>{if(e.peek()===`"`)return e.match(/"[^"]*"/y).slice(1,-1);let n=e.free(q.meter);if(n!==null)return n.key===`text`||n.text!==void 0?n.text??``:n.labels?n.labels[Math.round((n.value-n.lo)/((n.hi-n.lo)/Math.max(1,n.labels.length-1)||1))]??``:String(n.value);let r=e.match(/[1-9][0-9]*(?:n\.?|t)(?![0-9A-Za-z])|[0-9]+/y);return r===null&&e.fail(`${t}: in quotes ("4/4"), a number, a note value (16n) or free(…)`),r},r=n(`the time signature`),i=da.test(r)?null:ia(r);e.skipSpace();let a=1,o=null;if(e.peek()===`,`){e.i++,e.skipSpace();let t=e.i,s=n(`the step: steps a pulse, or its note value`),c=Di(s);if(c!==null){if(i){let n=1/i.unit/c;Math.abs(n-Math.round(n))<1e-9&&Math.round(n)>=1&&Math.round(n)<=8||e.fail(`meter("${r}", ${s}): the step divides the pulse, ${Ni(1/i.unit)??`a 1/${i.unit}`}, into 1 to 8 steps`,t,s.length),a=Math.round(n)}else o=c}else a=Math.max(1,Math.min(8,parseInt(s,10)||1));e.skipSpace()}e.expect(`)`,`')' to close meter(…)`);let s=e.span(t);e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);let c=pa(r,a);c.length||e.fail(`meter("${r}"): a time signature (x/2 x/4 x/8 x/16: 4/4, 6/8, 7/8, 2/2), groups as sizes ("2+2+3" of eighths, "2+2+3/4" of quarters; each 2, 3, 4 or 6), or levels like "*.-.+.-." (* the bar, + - : ; beats, the higher the stronger, . the eighth, , finer)`,t,s.len);let l=c.map(e=>({atom:{kind:`note`,value:e,alter:0},repeat:1,subdivide:1,elongate:1,span:s})),u=()=>{let e=[...r].flatMap((e,t)=>t===0||e!==`.`&&e!==`,`?[t]:[]);return e.map((t,n)=>(e[n+1]??r.length)-t)},d=i?aa(r):o===null?void 0:{pulses:r.length,unit:1/o,beats:u()},f=d?d.beats.length:u().length;return{kind:`list`,tokens:l,span:s,perBeat:c.length/Math.max(1,f),...d?{signature:d}:{}}}function ha(e,t,n){e.i++;let r=[];for(;e.skipSpace(),r.push(e.int(`a number in ${t}(…)`,q.args,t)),e.skipSpace(),e.peek()===`,`;)e.i++;e.expect(`)`,`')' to close ${t}(…)`);let i=e.span(n);return e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`),{args:r,span:i}}function ga(e,t){let{args:n,span:r}=ha(e,`euclid`,t),[i,a,o=0]=n;(n.length<2||n.length>3||!(a>=1)||!(i>=0&&i<=a))&&e.fail(`euclid(k, n): k hits spread evenly over n steps (0 ≤ k ≤ n), euclid(k, n, shift) turned`,t,r.len);let s=ta(i,a);return{kind:`list`,tokens:Array.from({length:a},(e,t)=>{let n=((t-o)%a+a)%a;return{atom:s[n]?{kind:`note`,value:0,alter:0}:{kind:`rest`},repeat:1,subdivide:1,elongate:1,span:r}}),span:r}}function _a(e,t){let{args:n,span:r}=ha(e,`even`,t),[i,a,o=0]=n;return(n.length<2||n.length>3||!(i>=1)||!(a>=i))&&e.fail(`even(k, n): k places spread as evenly as they go over n (1 ≤ k ≤ n), even(k, n, phase) its mode`,t,r.len),o>=0&&o<i||e.fail(`even(${i}, ${a}, phase): the phase is a mode, 0 to ${i-1}, each one place moved`,t,r.len),{kind:`scan`,steps:xr(vr(i,a,o),a),span:r}}let va={sin:`a sine`,saw:`a saw`,tri:`a triangle`,square:`a square`},ya=e=>(t,n)=>{let{args:r,span:i}=ha(t,e,n),[a]=r;return(r.length!==1||a<2)&&t.fail(`${e}(n): one cycle of ${va[e]} in n steps, n ≥ 2`,n,i.len),{kind:`wave`,shape:e,n:a,span:i}};function ba(e,t){let n=t=>e===`sin`?Math.sin(2*Math.PI*t):e===`saw`?2*t-1:e===`tri`?t<.5?4*t-1:3-4*t:Math.floor(2*t)%2?1:-1;return Array.from({length:t},(e,r)=>+n(r/t).toFixed(6)+0)}let xa={C:0,D:2,E:4,F:5,G:7,A:9,B:11},Sa=e=>[`C`,`C#`,`D`,`Eb`,`E`,`F`,`F#`,`G`,`Ab`,`A`,`Bb`,`B`][(e%12+12)%12];function Ca(e,t){e.i++,e.skipSpace();let n,r=0,i=`0`,a=null,o=null,s=e.match(/-?[0-9]+/y),c=s===null?e.match(/"[^"]*"/y):null;if(c!==null){let a=/^"([A-G](?:#|b)?)([0-9]*)((?::[a-z0-9#'-]+)+)"$/.exec(c);a||e.fail(`scale("tonic:name"): a tonic and a scale's name, as in Strudel — scale("D:minor"), scale("F#:harmonic:minor")`,t,e.i-t),a[2]&&e.fail(`scale("${a[1]}${a[2]}:…"): the octave is the voice's (loop=), not the scale's: scale("${a[1]}${a[3]}")`,t,e.i-t);let o=a[3].slice(1).split(`:`),[s,l]=[o.join(` `),o.join(``)],u=Object.hasOwn($i,s)?$i[s]:Object.hasOwn(mr,l)?mr[l].steps:void 0;u||e.fail(`scale("…${a[3]}"): a scale by name — ours (${Object.keys(mr).join(` `)}) or tonal's, as Strudel reads them (harmonic:minor, minor:pentatonic, whole:tone, diminished, chromatic, bebop … listed in tables.md)`,t,e.i-t),n=[...u];let d=a[1];r=((xa[d[0]]+(d[1]===`#`?1:d[1]===`b`?-1:0))%12+12)%12,i=String(r),e.skipSpace(),e.expect(`)`,`')' to close scale(…)`)}else if(s!==null){e.skipSpace(),e.expect(`,`,`',' then the mode — better by name: scale(minor, A)`),e.skipSpace();let a=e.i,o=e.int(`the mode, 0 (the darkest) to 6`,q.phase);o>6&&e.fail(`scale(tonic, phase): the phase is a mode, 0 (the darkest, Locrian) to 6 (the brightest, Lydian) — not ${o}`,a,String(o).length),r=parseInt(s,10),i=s,n=xr(vr(7,12,o),12),e.skipSpace(),e.expect(`)`,`')' to close scale(…)`),e.warn(`scale(${r}, ${o}) is written scale(${_r(o)}, ${Sa(r)}): the mode by name, then the tonic`,t,e.i-t)}else{let t=e.i;if(e.peek()===`&`)o=e.cellRef(`the cell that holds the mode, like scale(&mode, &tonic)`,`as the mode`),n=gr(hr.major);else{let r=e.match(/[a-z]+/y),i=r?mr[r]:void 0;i||e.fail(`scale(name, tonic): a scale by name — ${Object.keys(mr).join(` `)}, or a cell holding a mode (&mode)`,t,Math.max(1,(r??``).length)),n=[...i.steps]}if(e.skipSpace(),e.peek()===`,`){e.i++,e.skipSpace();let t=e.i,n=e.match(/[A-G](?:#|b)?(?![A-Za-z0-9])/y);if(n!==null)r=((xa[n[0]]+(n[1]===`#`?1:n[1]===`b`?-1:0))%12+12)%12,i=String(r);else if(e.peek()===`&`)a=e.cellRef(`the cell that holds the tonic, like scale(dorian, &tonic)`,`as the tonic`),i=`&${a.name}`;else{let n=e.text.startsWith(`free(`,e.i);r=e.int(`the tonic: a note name (D, F#, Bb), a number, a cell (&tonic) or free(…)`,q.tonic),i=n?e.text.slice(t,e.i):String(r),Math.abs(r)>11&&e.warn(`scale(…, ${r}): the tonic is a pitch class, 0 (C) to 11 (B)`,t,e.i-t)}e.skipSpace()}e.expect(`)`,`')' to close scale(…)`)}let l=e.span(t),u=`key:λ${e.line}_${t+e.offset}`;return e.lambdas.push({name:u,span:l,lambda:`shift=${i}`,over:null,shift:r,...a?{tonic:a}:{},off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:{kind:`blank`}}),{steps:n,key:{name:u,pick:null,shift:0,span:l},span:l,...o?{mode:o}:{}}}function wa(e,t){e.i++,e.skipSpace();let n=0;if(e.peek()!==`)`){let t=e.i,r=e.noteName();if(n=r===null?e.int(`how many fifths round it starts (fifths(1): on G), or the note it starts on: fifths(G)`,q.fifths):(r%12+12)%12*7%12,r===null&&Math.abs(n)>11){let r=Math.trunc(n/12),i=n%12,a=`C G D A E B F# C# Ab Eb Bb F`.split(` `)[(i+12)%12];e.warn(`fifths(${n}): the circle comes round after 12, and a turn past a lap climbs one, as every shift does: fifths(${i}) ${r>0?`up`:`down`} ${Math.abs(r)} octave${Math.abs(r)===1?``:`s`}${i?` (fifths(${a}) names the note, no octave)`:``}`,t,e.i-t)}e.skipSpace()}e.expect(`)`,`')' to close fifths(…)`);let r=e.span(t);return{braid:{kind:`list`,tokens:Array.from({length:12},(e,t)=>({atom:{kind:`note`,value:t*7%12,alter:0},repeat:1,subdivide:1,elongate:1,span:r})),span:r},shift:n}}let Ta=W(`generator`,`sin(n) · saw(n) · tri(n) · square(n)`,`One cycle of a waveform in n steps, from −1 to 1, as Strudel's bipolar signals (sine2, saw2, tri2, square2) at each step: a sine from 0, a saw rising from −1, a triangle rising from −1 to 1 at the half and falling back, a square −1 then 1. A waveform, or a slow swell.`,[`&sine loop=220 sin(12)`,`&ramp loop=220 saw(8)`,`&swell map=lin loop=.25 tri(4)`,`&pulse loop=110 square(2)`],`braid.md`),Ea={scan:{parse:ea,syntax:W(`generator`,`scan(i …)`,"Running totals of intervals: a scale or a meter. An interval can repeat (`1!4`), be geometric (`geo(r, n, k …)`: r^(k/n) for each k) or be `free(…)`.",[`&major scan(2 2 1 2 2 2 1)`,`&bar scan(27 23 26 24) step=84bpm`,`&tempo scan(1!4 .5!2)`,`&series scan(geo(5, 25, 0 10 5))`,`&mode scan(2 2 free(1, 1..2) 2 2 2 1)`],`braid.md`)},euclid:{parse:ga,syntax:W(`generator`,`euclid(k, n) · euclid(k, n, shift)`,`k hits spread as evenly as they go over n steps (the Euclidean rhythms), turned right by shift steps, as Strudel's (k, n, r).`,[`&tresillo euclid(3, 8)`,`&clave euclid(5, 16, 2)`],`braid.md`)},even:{parse:_a,syntax:W(`generator`,`even(k, n) · even(k, n, phase)`,`k places spread as evenly as they go over n: a table (the scan of its intervals), its phase its mode, 0 to k − 1, each one place moved. The one generator under the diatonic (even(7, 12), its phases the seven modes), the pentatonic, the standard bell, the tresillo and a meter's groups (decision 072); euclid(k, n, r) is its places as a rhythm of n steps, turned as Strudel's.`,[`&ionian even(7, 12, 5)`,`&pentatonic even(5, 12)`,`&minorPentatonic even(5, 12, 3)`,`&tresillo even(3, 8, 2)`],`tables.md`)},sin:{parse:ya(`sin`),syntax:Ta},saw:{parse:ya(`saw`),syntax:Ta},tri:{parse:ya(`tri`),syntax:Ta},square:{parse:ya(`square`),syntax:Ta},scale:{parse:(e,t)=>e.fail(`scale(…) is read by its cell`,t,5),syntax:W(`generator`,`scale(name) · scale(name, tonic) · scale("tonic:name")`,`A scale by name over the 12, turned to its tonic (a note name, a number, a cell holding one, or free(…); C if left out): the scan of its steps over a key of its own. Its name may be a cell holding a diatonic mode (&mode dorian, its phase from the darkest: locrian 0 … lydian 6). Its shift= walks its modes; the tonic transposes. The names: ${Object.keys(mr).join(` `)}. Strudel's spelling reads the same: scale("D:minor"), its words after colons (scale("F#:harmonic:minor")), with every scale tonal knows (${Object.keys($i).length} names: whole:tone, diminished, bebop:major, chromatic …); the octave is the voice's, not the scale's.`,[`&scale scale(minor, D)`,`&blues scale(blues)`,`&scale scale(dorian, free(2, 0..11))`,`&key scale(dorian, &tonic)`,`&key scale(&mode, &tonic)`,`&scale scale("F#:harmonic:minor")`],`tables.md`)},fifths:{parse:(e,t)=>e.fail(`fifths(…) is read by its cell`,t,6),syntax:W(`generator`,`fifths() · fifths(n) · fifths(note)`,`The circle of fifths: the twelve pitch classes a fifth apart, C G D A E B F# C# Ab Eb Bb F, as written from C; turned n fifths round, or to start on a note (its shift=: [0] is where it starts, [$0] is C). Drawn round its wheel in its own order.`,[`&circle fifths()`,`&circleG fifths(1)`,`&circleG fifths(G)`],`tables.md`)},meter:{parse:ma,syntax:W(`generator`,`meter("sig") · meter("sig", step) · meter("2+2+3") · meter("2+2+3/4") · meter("levels")`,`A bar as levels, one per step, its numbers its tiers from the ends: 0 the downbeat, 1 a beat, 2 a half's beat (and any tier between), 3 the eighth, 4 finer. A time signature by rule (contracts/meter v2, decision 072): x/8 and x/16 grouped as the canonical even set of ⌈x/3⌉ groups (7/8 is 3+2+2, 8/8 3+3+2), x/4 and x/2 in beats of the denominator, or in threes where x is a multiple of 3 from 6 (6/4). Its step is a number a pulse or a note value (meter("6/8", 16n)). Groups written as sizes, of eighths or of the denominator after a slash (2+2+3, 2+2+3/4), each 2, 3, 4 or 6. Or levels written out (* the bar, + - : ; beats, . the eighth, , finer), with their step's note value. Of four groups or more, each half's start is the stronger: 4/4 is *.-.+.-. (#17). Its bpm counts beats, its groups. Each argument can be free(…).`,[`&bar meter("4/4", 2) step=100bpm`,`&bar meter("6/8") step=60bpm`,`&bar meter("2+2+3") step=90bpm`,`&bar meter("2/2", 2) step=60bpm`,`&bar meter("*.+.+..") step=90bpm`],`time.md`)},spell:{parse:na,syntax:W(`generator`,`spell("text", &table, "names")`,`A text spelled through a table: each character that is one of the names plays that entry of the table, then a pause; anything else rests as long. The text can be free("…"), a field to type in.`,[`&dial spell("867 5309", &keys, "1 2 3 A 4 5 6 B 7 8 9 C * 0 # D")`,`&dial spell(free("867 5309"), &keys, "1 2 3 A 4 5 6 B 7 8 9 C * 0 # D")`],`braid.md`)}},Da={agogic:(e,t)=>{let{args:n,span:r}=ha(e,`agogic`,t),[i,a]=n,o=br(i,a).map(e=>Math.round(e/12*100));return e.fail(`agogic(…) is gone: write the beats as a scan, scan(${xr(o,100).join(` `)})`,t,r.len)}},Oa=e=>e in Ea||e in Da;function ka(e,t,n){return(Ea[t]?.parse??Da[t])(e,n)}function Aa(e){if(e.peek()!==`:`)return;e.rejectTap(e.text.slice(0,e.i).search(/&[^\s:,[\]()*+&]*$/)),e.i++;let t=e.i;e.free(q.hitNumber);let n=e.match(/[0-9]+/y);if(n===null)return e.fail(`A hit is &bd:n:gain, its number first: &bd:0:.3`,t,1);if(parseInt(n,10)!==0&&e.fail(`&bd:${n} would be a pitched hit, ${n} up its table: not yet (write &bd:0:gain)`,t,n.length),e.peek()!==`:`)return;e.i++;let r=e.i,i=e.freeNumber(q.hit),a=i===null?e.match(/[0-9]*\.[0-9]+|[0-9]+/y):String(i);return a===null?e.fail(`A hit’s gain: a number, &bd:0:.3 (1 as it is)`,r,1):parseFloat(a)}function ja(e,t){let n=0,r=!1,i=[[]],a=``,o=()=>{a&&i[i.length-1].push(a),a=``};for(let s=t;s<e.length;s++){let t=e[s];if(t===`&`&&(r=!0),t===`[`||t===`(`){if(n++===0)continue}else if(t===`]`||t===`)`){if(--n===0)break}else if(n===1&&t===`,`){o(),i.push([]);continue}else if(n===1&&/\s/.test(t)){o();continue}a+=t}if(o(),!r)return!1;let s=e=>/^[*+(-]|[*+-]$/.test(e);return!i.some(e=>e.length>1&&!e.some(s)||e.length===1&&e[0].startsWith(`[`))}function Ma(e){e.i++;let t=[];for(;;){if(t.push(Na(e,0)),e.skipSpace(),e.peek()===`,`){e.i++;continue}let n=e.peek();return n===`|`&&e.fail(`',' or ']' in the mix: a mix lists its terms with commas ([&a, &b]); a choice [a|b] picks between numbers in a braid (&x [0|2]), not between cells`,e.i,1),(n===`[`||n===`&`)&&e.fail(`',' or ']' in the mix: a mix lists its terms with commas ([&a, &b]); one term is a product or a sum, its parts joined by * or +`,e.i,1),e.expect(`]`,`',' or ']' in the mix`),{kind:`mix`,exprs:t}}}function Na(e,t){let n=e.i,r=[{e:Pa(e,t),sign:1}];for(;;){e.skipSpace();let n=e.peek();if(n!==`+`&&n!==`-`)break;e.i++,r.push({e:Pa(e,t),sign:n===`-`?-1:1})}return r.length===1?r[0].e:{k:`sum`,items:r,span:e.span(n)}}function Pa(e,t){e.skipSpace();let n=e.i,r=[Fa(e,t)];for(;e.skipSpace(),e.peek()===`*`;)e.i++,r.push(Fa(e,t));return r.length===1?r[0]:{k:`prod`,factors:r,span:e.span(n)}}function Fa(e,t){e.skipSpace();let n=e.i;if(e.peek()===`(`){t>=32&&e.fail(`Parentheses in a mix nest 32 deep at most: name a part (&part [ … ]) and use it`,n),e.i++;let r=Na(e,t+1);return e.skipSpace(),e.expect(`)`,`')' to close the group`),r}if(e.peek()===`&`){let t=e.ref(`a cell, like &theme`),n=Aa(e);return n===void 0?{k:`ref`,ref:t}:{k:`ref`,ref:t,level:n}}let r=e.free(q.gain);if(r!==null)return{k:`num`,value:r.value,span:e.span(n)};let i=e.match(Lr);return i===null?(e.match(/gate\(/y)&&e.fail(`gate(…) is planned but not built yet: for now a step= term articulates, loop= terms bend`,n,5),e.fail(`Expected a cell, a number or '(' here`)):{k:`num`,value:parseFloat(i),span:e.span(n)}}let Ia=RegExp(`(?:${Object.keys(hr).join(`|`)})(?![A-Za-z0-9_])`,`y`),La=[`degree`,`inverse`],Ra=/(degree|inverse)\(/y;function za(e){let t=e.match(Ra);if(t===null){let t=e.ref(`a cell like &motif`);return{kind:`ref`,name:t.name,pick:t.pick,shift:t.shift,...t.slot?{slot:t.slot}:{},...t.transpose?{transpose:t.transpose}:{},...t.degree?{values:{mul:1,add:t.degree}}:{}}}let n=t.slice(0,-1);e.skipSpace(),e.peek()!==`&`&&!e.text.startsWith(`degree(`,e.i)&&!e.text.startsWith(`inverse(`,e.i)&&e.fail(n===`degree`?`degree(&cell, n): a cell, then how many steps of its table up (−n down)`:`inverse(&cell): a cell, mirrored round 0`,e.i);let r=za(e);e.skipSpace();let i=r.values??{mul:1,add:0},a;if(n===`degree`){e.expect(`,`,`',' then the steps: degree(&${r.name}, 1)`),e.skipSpace();let t=e.match(/[-+]?\s*[0-9]+(?![0-9.])/y);t===null&&e.fail(`degree(&${r.name}, n) moves it n whole steps of its table, a whole number: degree(&${r.name}, 1), degree(&${r.name}, -2)`,e.i),a={mul:i.mul,add:i.add+parseInt(t.replace(/\s+/g,``),10)}}else a={mul:i.mul===1?-1:1,add:-i.add};return e.skipSpace(),e.expect(`)`,`')' to close ${n}(…)`),{kind:`ref`,name:r.name,pick:r.pick,shift:r.shift,...r.slot?{slot:r.slot}:{},...r.transpose?{transpose:r.transpose}:{},...a.mul===1&&a.add===0?{}:{values:a}}}function Ba(e,t){let n=e.peek();if(n===`&`||e.text.startsWith(`degree(`,e.i)||e.text.startsWith(`inverse(`,e.i))return za(e);if(n===`~`)return e.i++,{kind:`rest`};if(n===`=`)return e.i++,{kind:`rest`,keep:!0};if(n===`_`)return e.i++,{kind:`rest`,hold:!0};if(n===`[`)return ja(e.text,e.i)?Ma(e):Va(e,t);if(n===`<`)return Ha(e,t);if(n===`-`||n===`.`||n>=`0`&&n<=`9`||e.text.startsWith(`free(`,e.i)){let t=e.num(`a number`,q.step),n=e.match(/[#bsf]+(?![A-Za-z0-9_])/y)??``,r=t.alter+[...n].reduce((e,t)=>e+(t===`#`||t===`s`?1:-1),0);return{kind:`note`,value:t.value,alter:r}}let r=e.noteName();if(r!==null)return{kind:`note`,value:r,alter:0,pitched:!0};let i=e.match(Ia);return i===null?e.fail(`Unexpected '${n}' — expected a number, a note name (C, F#), ~, [chord], &cell or key=value`):{kind:`note`,value:hr[i],alter:0}}function Va(e,t){let n=e.i;t>=32&&e.fail(`Brackets nest 32 deep at most: name the inner steps (&inner 0 2) and splice them`,n,1),e.i++;let r=[[]],i=null;for(;;){e.skipSpace();let a=e.peek();if(a===`]`)break;if(a===``&&e.fail(i===`|`?`']' to close the choice: [0|4|7]`:`']' to close the bracket: [0 2] · [0, 4]`,n,e.i-n),a===`,`||a===`|`){i!==null&&i!==a&&e.fail(`A bracket is a chord or a stack (commas) or a choice (bars), not both: [0, 4] · [0|4]`,e.i,1),r[r.length-1].length||e.fail(a===`,`?`A step before the comma: [0, 4]`:`A step before the bar: [0|4] · [0 2|4]`,e.i,1),i=a,r.push([]),e.i++;continue}Ga(e,r[r.length-1],qa(e,t+1))}e.i++,r[r.length-1].length||e.fail(i===null?`Empty brackets: [0 2] is a subsequence, [0, 2] a chord`:i===`,`?`A step after the comma: [0, 4]`:`A step after the bar: [0|4] · [0 2|4]`,n,e.i-n);let a=e=>e.repeat===1&&e.subdivide===1&&e.elongate===1&&e.chance===void 0,o=r.every(e=>e.length===1&&a(e[0])&&e[0].atom.kind===`note`),s=r.map(e=>e[0].atom);if(i===`|`)return o&&!s.some(e=>e.pitched)?{kind:`choice`,values:s.map(e=>e.value),alters:s.map(e=>e.alter)}:{kind:`seq`,layers:r,mode:`choose`};if(o){let e=s.map(e=>!!e.pitched);return{kind:`chord`,notes:s.map(e=>e.value),alters:s.map(e=>e.alter),...e.some(Boolean)?{pitched:e}:{}}}return{kind:`seq`,layers:r}}function Ha(e,t){let n=e.i;t>=32&&e.fail(`Brackets nest 32 deep at most: name the inner steps (&inner 0 2) and splice them`,n,1),e.i++;let r=[[]];for(;;){e.skipSpace();let i=e.peek();if(i===`>`)break;if(i===``&&e.fail(`'>' to close the alternation: <0 2 4>`,n,e.i-n),i===`|`&&e.fail(`An alternation takes steps, stacked with commas (<0 2, 4 5>); a choice goes in square brackets: [0 2|4]`,e.i,1),i===`,`){r[r.length-1].length||e.fail(`A step before the comma: <0 2, 4 5>`,e.i,1),r.push([]),e.i++;continue}Ga(e,r[r.length-1],qa(e,t+1))}return e.i++,r[r.length-1].length||e.fail(r.length>1?`A step after the comma: <0 2, 4 5>`:`An empty alternation: <0 2 4> plays one of its steps a lap`,n,e.i-n),{kind:`seq`,layers:r,mode:`alt`}}function Ua(e){let t=e.i;e.i++;let n=[];for(;e.skipSpace(),n.push(e.int(`a whole number in x(k, n, r)`,q.euclidOn)),e.skipSpace(),e.peek()===`,`;)e.i++;e.expect(`)`,`')' to close x(k, n, r)`);let[r,i,a=0]=n;(n.length<2||n.length>3||!(i>=1&&i<=4096)||!(r>=0&&r<=i))&&e.fail(`x(k, n, r): k hits spread evenly over n parts of the step (0 ≤ k ≤ n), turned right by r: 0(3,8), &bd(3,8,2)`,t,e.i-t);let o=ta(r,i);return{k:r,n:i,r:a,hits:Array.from({length:i},(e,t)=>t).filter(e=>o[((e-a)%i+i)%i])}}let Wa=1e4;function Ga(e,t,n){if(!(n.atom.kind===`rest`&&n.atom.hold)){t.push(n);return}let r=n.span.col-1-e.offset,i=t[t.length-1];(n.repeat!==1||n.subdivide!==1||n.elongate!==1||n.chance!==void 0)&&e.fail(`_ lengthens the step before it by one, and takes no modifiers: 0 _ _ is 0@3`,r,n.span.len),i||e.fail(`_ lengthens the step before it: 0 _ _ is 0@3 (in a cell with base=, = keeps a step of the base)`,r,n.span.len),i.repeat!==1&&e.fail(`_ after x!n would lengthen only the last copy: write the copies out, or x@n`,r,n.span.len),t[t.length-1]={...i,elongate:i.elongate+1,span:{...i.span,len:n.span.col-i.span.col+n.span.len}}}let Ka={"!":{field:`repeat`,syntax:W(`modifier`,`x!n`,`Repeat: n copies of the step, each as long as one.`,[`&beat step=4 0!4 2!2`],`cell.md`)},"*":{field:`subdivide`,syntax:W(`modifier`,`x*n`,`Ratchet: the step played n times within its own length.`,[`&hats step=2 0 0*2 0 0*3`],`cell.md`)},"@":{field:`elongate`,syntax:W(`modifier`,`x@n`,`Hold: the step lasts n steps.`,[`&tune step=2 0@2 2 4@3`],`cell.md`)}};function qa(e,t=0){let n=e.i,r=Ba(e,t),i=e.span(n),a={repeat:1,subdivide:1,elongate:1},o,s,c,l=/* @__PURE__ */ new Set;r.kind===`ref`&&(s=Aa(e));let u=e.peek()===`(`?Ua(e):void 0;for(;e.peek()in Ka||e.peek()===`?`||e.peek()===`/`;){if(e.peek()===`/`){c!==void 0&&e.fail(`'/' can only appear once per step`),e.i++;let t=e.i,n=e.int(`a count after /`,q.modifier,`slow`);(n<1||n>4096)&&e.fail(`Count must be between 1 and ${Rr}`,t,e.i-t),c=n;continue}if(e.peek()===`?`){o!==void 0&&e.fail(`'?' can only appear once per step`),e.i++;let t=e.i,n=e.freeNumber(q.drop),r=n===null?e.match(/(?:0?\.[0-9]+|0|1(?:\.0+)?)(?![0-9])/y):String(n);o=r===null?null:parseFloat(r),r===null&&/[0-9]/.test(e.peek()??``)&&e.fail(`A probability is from 0 to 1: x?.3`,t,1);continue}let t=e.peek();l.has(t)&&e.fail(`'${t}' can only appear once per step`),l.add(t),e.i++;let n=e.i,r=e.int(`a count after ${t}`,q.modifier,Ka[t].field);(r<1||r>4096)&&e.fail(`Count must be between 1 and ${Rr}`,n,e.i-n),a[Ka[t].field]=r}if(e.peek()===`(`&&e.fail(`A euclid goes straight after its step, before its other modifiers: 0(3,8)*2`),!e.atBoundary()&&!(t>0&&/[\],|>]/.test(e.peek()))&&e.fail(`Unexpected '${e.peek()}' — separate steps with spaces`),u||c!==void 0){r.kind===`rest`&&(r.hold||r.keep)&&e.fail(`${r.hold?`_`:`=`} takes no euclid and no /n: put them on the step it stands for`,n,e.i-n);let t={...u?{euclid:u}:{},...c===void 0?{}:{slow:c}};r=r.kind===`seq`&&!r.bare?{...r,...t}:{kind:`seq`,layers:[[{atom:r,repeat:1,subdivide:1,elongate:1,span:i}]],...t,bare:!0}}return En(r)>Wa&&e.fail(`A step comes round after ${Wa.toLocaleString(`en`)} laps at most: its <…> and /n multiplied out`,n,e.i-n),{atom:r,...a,...o===void 0?{}:{chance:o},...s===void 0?{}:{level:s},span:e.span(n)}}let Ja=e=>/^(?:pulse|beat|1m|(?:1|2|4|8|16|32|64)(?:n\.?|t))(?![A-Za-z0-9_.])/.test(e.text.slice(e.i));function Ya(e){let t=e.match(/(?:pulse|beat|1m|(?:1|2|4|8|16|32|64)(?:n\.?|t))(?![A-Za-z0-9_.])/y);if(t===null)return null;if(t===`pulse`||t===`beat`)return{written:t,kind:t};if(t===`1m`)return{written:t,kind:`bar`};let n=parseInt(t,10);return{written:t,kind:`note`,whole:t.endsWith(`.`)?3/(2*n):t.endsWith(`t`)?2/(3*n):1/n}}function Xa(e){let t=1,n=[];for(;e.peek()===`*`||e.peek()===`/`;){let r=e.text[e.i++],i=e.i,a=e.freeNumber(q.by),o=a===null?e.match(/[0-9]+(?:\.[0-9]+)?|\.[0-9]+/y):String(a);(o===null||!(parseFloat(o)>0))&&e.fail(`a positive number after ${r}`,i),t=r===`*`?t*parseFloat(o):t/parseFloat(o),n.push({op:r===`*`?`×`:`÷`,n:parseFloat(o)})}return{ratio:t,chain:n}}function Za(e,t){let n=e.i,r=t?`loop`:`step`,i=t?null:Ya(e);if(i)return{whole:t,kind:`tap`,meter:null,tap:i,...Xa(e),span:e.span(n)};let a=e.free(t?{...q.rate,key:`loop`}:q.rate);if(a!==null){let r=Er(a.value,a.unit);return r>0||e.fail(`A rate must be positive`,n,e.i-n),{whole:t,kind:`rate`,perSecond:r,span:e.span(n),free:a}}let o=e.match(/[0-9]+(?:\.[0-9]+)?|\.[0-9]+/y);if(o!==null){let i=Er(parseFloat(o),e.match(Tr));if(i>0||e.fail(`A rate must be positive`,n,e.i-n),/[A-Za-z.]/.test(e.peek())){let i=/^[^\s,\])]+/.exec(e.text.slice(n))[0];e.fail(t?`${r}=${i} is no rate: a number with its unit (loop=100bpm, loop=2hz)`:`${r}=${i} is no rate or tap: a tap reads a note value (1n 2n 4n 8n 16n 32n), a triplet (4t 8t 16t), a dotted one (2n. 4n. 8n.), 1m, pulse, beat, or another meter's (&bar2:16n)`,n,i.length)}return{whole:t,kind:`rate`,perSecond:i,span:e.span(n)}}let s=e.match(/[A-Z](?:[#b]?-?[0-9]+|[A-Z0-9_]*)(?![A-Za-z0-9_#])/y);if(s!==null)return{whole:t,kind:`env`,name:s,span:e.span(n)};e.peek()===`{`&&e.fail(`{&x} is now written cycle(&x)`);let c=e.match(/cycle\(/y)!==null,l=e.cellRef(c?`a cell inside cycle( ), like cycle(&theme)`:`a cell or a rate after ${r}=, like ${r}=&meter`,`in ${r}=`,!0);if((l.pick||l.shift)&&e.fail(`${r}= takes a whole cell`,l.span.col-1,l.span.len),c&&e.expect(`)`,`')' to close cycle(&${l.name})`),!c&&!t&&e.peek()===`:`){e.i++;let r=Ya(e);return r||e.fail(`&${l.name}: taps a meter by pulse, beat or a note value (&${l.name}:pulse, &${l.name}:beat, &${l.name}:16n, &${l.name}:1m)`),{whole:t,kind:`tap`,meter:l,tap:r,...Xa(e),span:e.span(n)}}return{whole:t,kind:`driven`,driver:l,cycle:c,...Xa(e),span:e.span(n)}}let Qa={amp:W(`map`,`map=amp`,`A volume: its values multiply the level (on a voice, the braid as a waveform, its range onto −1…1; the default).`,[`&accent map=amp step=16n 1 .4 .8 .4`],`sound.md`),lin:W(`map`,`map=lin`,`As amp, ramping from each value to the next: a glide, a triangle. In a mix it is plain: a volume in a product, a pitch in a sum.`,[`&swell map=lin loop=&bar/8 .2 1`],`sound.md`),db:W(`map`,`map=db`,`A volume in decibels (0 as it is, −6 about half).`,[`&fade map=db step=&bar 0 -6 -12`],`sound.md`),adsr:W(`map`,`map=adsr a d s r`,`An envelope: attack, decay, release in seconds, sustain a level; one per note.`,[`&pluck map=adsr .01 .3 .5 .4`],`sound.md`),sample:W(`map`,`map=sample`,`The sound card: its entries are channels, one (mono) or two (left, right).`,[`&out loop=SAMPLE_RATE map=sample &left &right`],`mix.md`),midi:W(`map`,`map=midi`,`A MIDI card: its entries are MIDI channels, in order (~ skips one); a voice only here is sent and heard, at its entry's gain.`,[`&synth map=midi [&theme * &reed] [&bass * &sub] ~!7 &groove`],`midi.md`),edo:W(`map`,`map=edo`,`A grid: cycle= equal steps to the octave.`,[`&edo19 cycle=19 map=edo`],`tuning.md`),ratios:W(`map`,`map=ratios`,`A grid of ratios: one period's tones, then the period (the last).`,[`&just map=ratios 1 9/8 5/4 4/3 3/2 5/3 15/8 2`],`tuning.md`),style:W(`map`,`map=style`,`A style: a point in style space, one value an axis in the table's order (sync harm bite mood, each 0 to 1), or each by its name (sync=.3); it doesn't sound. A pick reads an axis by name: &funk[bite].`,[`&funk map=style .3 .45 .55 .5`,`&funk map=style sync=.3 harm=.45 bite=.55 mood=.5`],`style.md`),role:W(`map`,`map=role`,`A role: its name is the role, its entries the gates that play it (two entries, two players); a gate no role names plays as written.`,[`&comp map=role &violin2 &viola`],`mix.md`)},$a=new RegExp(Object.keys(Qa).sort((e,t)=>t.length-e.length).join(`|`),`y`);function eo(e,t,n){return t>5e4&&e.fail(`${t} steps: at most ${ui.toLocaleString(`en`)}, the most a grid can hold to its period`,n,String(t).length),t}function to(e){let t=e.i;if(e.peek()===`&`){let n=e.cellRef(`a table cell, like map=&curve`,`after map=`);return(n.pick||n.shift)&&e.fail(`map= takes a whole table`,n.span.col-1,n.span.len),{kind:`table`,table:n,span:e.span(t)}}if(e.match(/sin\b/y)&&e.fail(`map=sin is gone: write the sine as the braid, sin(12) — or map=&table`,t,3),e.match(/ed\(/y)){let n=()=>{let t=e.i,n=e.freeNumber(q.ratio),r=n===null?e.match(/[0-9]+(?:\.[0-9]+)?(?:\/[0-9]+(?:\.[0-9]+)?)?/y):String(n),[i,a=`1`]=(r??``).split(`/`),o=parseFloat(i)/parseFloat(a);return(r===null||!(o>1))&&e.fail(`ed(r) divides a ratio above 1: ed(2) is the octave, ed(3/2) the fifth, ed(7, 3/2) seven steps to it`,t),o},r=e.i,i=/^(?:[0-9]+|free\([^()]*\))\s*,/.test(e.text.slice(e.i))?e.int(`the steps, ed(n, r)`,q.grid,`steps`):null;i!==null&&e.match(/\s*,\s*/y);let a=i===null?null:eo(e,i,r);a!==null&&a<1&&e.fail(`ed(n, r): n steps to the ratio, at least 1`,r);let o=n();return e.expect(`)`,`')' to close ed(…)`),{kind:`edo`,period:o,steps:a,span:e.span(t)}}let n=e.match($a);if(n===null&&e.fail(`map= takes ${Object.keys(Qa).join(`, `)}, ed(r), midi(c, p) or a table cell (&curve)`),n===`edo`){let n=null;if(e.peek()===`(`){e.i++;let t=e.i,r=e.freeNumber(q.grid,`steps`),i=r===null?e.match(/[0-9]+/y):String(r);(i===null||parseInt(i,10)<1)&&e.fail(`edo(n): n equal steps to the octave, edo(19)`,t),n=eo(e,parseInt(i,10),t),e.expect(`)`,`')' to close edo(…)`)}return{kind:`edo`,period:2,steps:n,span:e.span(t)}}return n===`midi`?no(e,t):{kind:n,span:e.span(t)}}function no(e,t){if(e.peek()!==`(`)return{kind:`midi`,channel:null,port:1,span:e.span(t)};e.i++;let n=(t,n)=>{let r=e.i,i=e.freeNumber({...q.grid,max:16},t===`A MIDI channel`?`channel`:`port`),a=i===null?e.match(/[0-9]+(?:\.[0-9]+)?/y):String(i),o=a===null?NaN:parseFloat(a);return Number.isInteger(o)&&o>=1&&o<=16||e.fail(`${t} is a whole number from 1 to 16: ${n}`,r,Math.max(1,a?.length??1)),o},r=n(`A MIDI channel`,`map=midi(10)`),i=1;return e.match(/\s*,\s*/y)!==null&&(i=n(`A MIDI output slot`,`map=midi(10, 2)`)),e.expect(`)`,`')' to close midi(…)`),{kind:`midi`,channel:r,port:i,span:e.span(t)}}let ro=gt.adsr,io=[`braid`,`pattern`,`equal`,`notes`,`midi`,`do`,`degrees`,`table`,`scale`,`mode`,`key`,`grid`,`meter`,`spectrum`,`wave`,`levels`,`adsr`,`mix`,`note`,`petal`,`off`,`matrix`,`lfo`,`brightness`],ao={notes:[`flats`,`sharps`,`german`],do:[`fixed`,`movable`]},oo=e=>(t,n,r,i)=>{n[e]=t.int(`a whole number after ${e}=`,q[e]),n.paramSpans[e]=t.place(i)},so=(e,t)=>(n,r,i,a)=>{let o=n.i,s=n.match(/"([^"]*)"/y);if(s===null&&n.fail(`${e}= takes a text in quotes: ${t}`),r[e]=s.slice(1,-1),e!==`label`&&(r.paramSpans[e]=n.place(a)),e===`label`)for(let e of s.matchAll(/\{(?:&[A-Za-z_][A-Za-z0-9_]*:)?([A-Za-z_][A-Za-z0-9_]*)\}/g))fi.includes(e[1])||n.warn(`{${e[1]}} isn't a label field: it shows as written (the fields: ${fi.map(e=>`{${e}}`).join(` `)})`,o+e.index,e[0].length)},co=e=>(t,n)=>{n[e]=t.cellRef(`a cell after ${e}=, like ${e}=&pluck or ${e}=&(map=adsr .01 .3 .5 .4)`,`after ${e}=`)},lo=(e,t,n)=>{t.step=Za(e,n===`loop`)},uo={over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{}},fo={over:{form:`over=&table · over=&table[<<n] · over=scale(name, tonic)`,examples:[`&tune over=&major step=2 0 2 4`,`&mode over=&major[<<2] 0 2 4`,`&tune over=scale(minor, A) step=2 0 2 4`,`&bass over=&key step=16n 0 4 7`],read:(e,t)=>{let n=/key(?![A-Za-z0-9_])/y;if(n.lastIndex=e.i,n.test(e.text)){let n=e.i;e.i+=3,e.peek()===`[`&&e.fail(`over=key is the old way: name the key, and turn it there (over=&key[<<2])`,e.i,1),t.over={name:li,pick:null,shift:0,span:e.place(n)}}else if(e.text.startsWith(`scale(`,e.i)){let n=e.i;e.i+=5;let r=Ca(e,n),i=`scale:λ${e.line}_${n+e.offset}`;e.lambdas.push({...uo,name:i,span:r.span,lambda:e.text.slice(n,e.i),over:r.key,braid:{kind:`scan`,steps:r.steps,span:r.span,...r.mode?{mode:r.mode}:{}}}),t.over={name:i,pick:null,shift:0,span:r.span}}else t.over=e.cellRef(`a cell or scale(name, tonic) after over=, like over=&key or over=scale(minor, A)`,`after over=`);t.over.pick&&e.fail(`over= takes a whole table (shifting it is fine: over=&scale[<<])`,t.over.span.col-1,t.over.span.len)}},base:{form:`base=&cell · base=&cell^$n · base=&cell^n`,examples:[`&answer base=&subject^$7 =!3 12@2`,`&last base=&subject =!21 3@2`],read:(e,t)=>{t.base=e.ref(`a cell after base=, like base=&subject or base=&subject^$7`),t.base.pick&&e.fail(`base= takes a whole cell (transposing it is fine: base=&subject^$7)`,t.base.span.col-1,t.base.span.len)}},step:{form:`step=…`,examples:[`&tune step=4n 0 2 4`,`&tune step=&clock 0 2 4`],read:lo},loop:{form:`loop=…`,examples:[`&lead s=saw loop=C4`],read:lo},shift:{form:`shift=n · shift=free(n, lo..hi)`,examples:[`&mode over=&major shift=5 0 2 4`,`&key shift=free(0, 0..11)`],read:oo(`shift`)},stride:{form:`stride=n · stride=free(n, lo..hi)`,examples:[`&key step=cycle(&theme) stride=7`],read:oo(`stride`)},map:{form:`map=…`,examples:[`&accent map=amp step=&bar 1 .5`],read:(e,t)=>t.map=to(e)},show:{form:`show=kind · show=notes:convention · show=do:convention · show=mix:&grid`,examples:[`&tune show=notes step=2 0 2 4`,`&tune show=notes:german step=2 0 2 4`,`&tune show=do:movable step=2 0 2 4`,`&band show=mix:&edo19 [&a, &b]`],read:(e,t)=>{let n=e.i,r=e.match(/[a-z]+/y);r===null&&e.fail(`show= takes one of: ${io.join(` `)}, or a plugin of the piece`,n,1);let i=``;if(r===`mix`&&e.peek()===`:`&&!e.text.startsWith(`:&`,e.i)&&e.fail(`show=mix:&grid: the grid whose colours the mix wears, like show=mix:&edo19 (no space after the colon)`,n,e.i+1-n),r===`mix`&&e.text.startsWith(`:&`,e.i)){e.i+=2;let r=e.match(Pr);r===null&&e.fail(`show=mix:&grid: the grid whose colours the mix wears, like show=mix:&edo19`,n,e.i-n),t.show=`mix:&${r}`,t.paramSpans.show=e.span(n);return}if(e.peek()===`:`){e.i++;let t=e.match(/[a-z]+/y)??``;ao[r]?.includes(t)||e.fail(`show=${r}: takes ${r===`notes`?`flats, sharps or german`:r===`do`?`fixed or movable`:`no convention`}`,n,e.i-n),i=`:${t}`}t.show=r+i,t.paramSpans.show=e.span(n)}},label:{form:`label="text"`,examples:[`&theme label="the King's theme" step=2 0 2 4`,`&note label="A note in the graph: alone on its cell."`],read:so(`label`,`label="the King's theme"`)},env:{form:`env=&envelope`,examples:[`&lead s=saw loop=C4 env=&(map=adsr .01 .3 .5 .4)`],read:co(`env`)},pitch:{form:`pitch=&vibrato · pitch=lo..hi * &shape`,examples:[`&lead s=saw loop=C4 pitch=&(loop=5 0 .1 -.1)`,`&bd s=sine loop=A1 pitch=0..30 * &(map=adsr 0 .04 0 0)`],read:(e,t,n,r)=>/^[0-9.]+\.\./.test(e.text.slice(e.i))?So(e,t,n):co(`pitch`)(e,t,n,r)},cycle:{form:`cycle=n`,examples:[`&key step=cycle(&theme) stride=2 cycle=2`,`&wheel cycle=1 0 4 7`,`&drone cycle=0 0 4 7`],read:(e,t,n,r)=>{let i=e.i;t.cycle=e.int(`a whole number after cycle=`,q.cycle),t.cycle<0&&e.fail(`cycle= counts laps: 0 or more`,i,e.i-i),t.paramSpans.cycle=e.place(r),t.cycle>5e4&&e.fail(`cycle=${t.cycle}: at most ${ui.toLocaleString(`en`)}, the most steps a cell can hold (a grid's to its period, a table's turns before it comes round)`,i,e.i-i)}},size:{form:`size=x`,examples:[`&theme size=2 step=2 0 2 4`],read:(e,t)=>{let n=e.i,r=e.freeNumber(q.size),i=r===null?e.match(/[0-9]*\.?[0-9]+/y):String(r);(i===null||!(+i>=.25&&+i<=4))&&e.fail(`size= is how large it is drawn, from .25 to 4: size=2`,n,Math.max(1,(i??``).length)),t.size=+i}},laps:{form:`laps=n`,examples:[`&bar meter("4/4") step=84bpm laps=30`],read:(e,t,n,r)=>{let i=e.freeNumber(q.laps),a=i===null?e.match(/[0-9]+/y):String(i);(a===null||!(parseInt(a,10)>=1))&&e.fail(`laps= takes a count of laps, 1 or more: laps=1`,r,n.length+1),t.laps=parseInt(a,10)}},chance:{form:`chance=p · chance=free(p, 0..1)`,examples:[`&ghost chance=.8 step=4 0? 0? 0? 0?`,`&ghost chance=free(.7, 0..1) step=4 0? 0?`],read:(e,t)=>{let n=e.freeNumber(q.chance);if(n!==null)t.chance=n;else{let n=e.i,r=e.match(/(?:0?\.[0-9]+|0|1(?:\.0+)?)(?![0-9])/y);r===null&&e.fail(`chance= is a probability from 0 to 1: chance=.3, or chance=free(.3, 0..1)`,n,1),t.chance=parseFloat(r)}}},seed:{form:`seed=n`,examples:[`&ghost seed=7 step=4 0? 0? 0? 0?`],read:(e,t)=>t.seed=e.int(`a whole number after seed=`,q.seed)},title:{form:`title="text"`,examples:[`&piece title="Swing blues" tags="genre:jazz, rhythm" label="A blues in F."`],read:so(`title`,`title="Swing blues"`)},tags:{form:`tags="tag, tag"`,examples:[`&lead tags="melody" s=saw loop=C4`,`&beam tags="metal" map=ratios 1 2.756 5.404`],read:so(`tags`,`tags="jazz, blues"`)},tier:{form:`tier=n`,examples:[`&piece title="Steps: a tune on one line" tags="tutorial" tier=1 label="Numbers, rests, holds and repeats."`],read:(e,t,n,r)=>{e.free(q.tier);let i=e.match(/[0-9]+(?![0-9.])/y);(i===null||!(parseInt(i,10)>=1&&parseInt(i,10)<=9999))&&e.fail(`tier= is a tier of the tutorial, 1 to 9999: tier=1`,r,n.length+1),t.tier=parseInt(i,10),t.paramSpans.tier=e.place(r)}},style:{form:`style=&s · style=[&a * w, &b * w] · style=a..b · style=a..b * &curve`,examples:[`&style label="Funk" style=&funk`,`&style label="close to Funk, then Bossa nova" style=[&funk * .8, &bossa * .2]..&bossa`],read:(e,t,n,r)=>{let i=go(e),a=null,o=null;e.text.startsWith(`..`,e.i)&&(e.i+=2,a=go(e),/^\s*\*\s*&/.test(e.text.slice(e.i))&&(e.skipSpace(),e.i++,e.skipSpace(),o=e.cellRef(`a curve after style=a..b *, like * &rise`,`in style=`))),t.style={from:i,to:a,...o?{curve:o}:{},span:e.place(r)}}},about:{form:`about=&cell · about=(&a &b …)`,examples:[`&fenvNote label="The filter opens on every note." about=&fenv`,`&why label="Two cells at once." about=(&fenv &accent)`],read:(e,t,n,r)=>{let i=`a cell after about=, like about=&fenv or about=(&fenv &accent)`,a=[];if(t.about=a,e.peek()===`(`){for(e.i++,e.skipSpace();e.peek()!==`)`;)e.done()&&e.fail(`')' to close about=(…)`),a.push(e.cellRef(i,`in about=`)),e.skipSpace();e.i++,a.length===0&&e.fail(i,r,n.length+1)}else a.push(e.cellRef(i,`in about=`))}}},po=/^\(\s*(?:-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)[a-z]*\s*,)/;function mo(e,t){let n=e.i,r=e.frees.length,i=t=>{if(e.text.startsWith(`free(`,e.i))return e.free(q.end,t).value;let n=e.match(/-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?![0-9])/y);return n===null?null:parseFloat(n)},a=()=>(e.i=n,e.frees.length=r,null),o=i(`${t} low`);if(o===null)return a();if(e.text.startsWith(`..`,e.i)){e.i+=2;let n=i(`${t} high`);return n===null&&e.fail(`${t}=: a range's other end, a number or a slider — ${t}=200..3000 * &a`),[o,n]}let s=/\s*(?:±|\+-)\s*/y;if(s.lastIndex=e.i,s.test(e.text)){e.i=s.lastIndex,e.frees.length>r&&(e.frees[r].param=t);let n=i(`${t} reach`);(n===null||n<0)&&e.fail(`${t}=c ± r: a reach, a number or a slider, 0 or more — ${t}=free(.6, 0..1) ± free(.2, 0..0.5) * &a`);let a=e=>Math.round(e*0xe8d4a51000)/0xe8d4a51000;return[Math.max(0,a(o-n)),a(o+n)]}return a()}function ho(e,t){let n=e.i,r=e.free(q.axis,t),[i,a]=ft.find(e=>e.name===t).range;return(r.lo<i||r.hi>a)&&e.fail(`${t}=free(…) moves within the axis, ${i} to ${a}: ${t}=free(${r.value}, ${i}..${a})`,n,e.i-n),r}function go(e){let t=`a style after style=, like style=&funk, style=&(map=style .3 .45 .55 .55) or style=[&funk * .8, &bossa * .2]`;if(e.peek()!==`[`)return{kind:`cell`,ref:e.cellRef(t,`in style=`)};e.i++;let n=[];for(;;){e.skipSpace();let r=e.cellRef(t,`in style=[…]`);if(e.skipSpace(),e.expect(`*`,`'*' and a weight after &${r.name}: style=[&${r.name} * .8, …]`),e.skipSpace(),n.push({ref:r,weight:e.num(`a weight after &${r.name} *`,q.weight).value}),e.skipSpace(),e.peek()===`,`){e.i++;continue}return e.expect(`]`,`']' to close style=[…]`),{kind:`mix`,terms:n}}}let _o={fm:`a voice after fm=, like fm=&op`,write:`what the tape records, like write=&melody`,play:`the tape it reads, like play=&tape, or the notes a gate plays, like play=&tune`,couple:`the resonator it shares a table with, like couple=&fork`,excite:`what drives it, like excite=&mix`,trigger:`the melody whose notes it plays with, like trigger=&tune`,velocity:`a level cell, like velocity=&accent`,gate:`a level cell, like gate=&duck`},vo=(e,t,n)=>{if(n===`play`)return yo(e,t);let r=e.cellRef(_o[n],`after ${n}=`);t.params[n]=r.name,t.paramSpans[n]=r.span};function yo(e,t){let n=e.i,r=e.ref(_o.play);if(e.rejectTap(n),t.params.play=r.name,t.paramSpans.play=r.span,r.transpose||r.degree){let i=e.text.lastIndexOf(`^`,e.i-1);t.playMove={...r.transpose?{transpose:r.transpose}:{},...r.degree?{degree:r.degree}:{},at:i,len:e.i-i,as:e.text.slice(n,e.i)}}}let bo=(e,t)=>{let n=e.i,r=e.match(/[1-9][0-9]*(?:n\.?|t)(?=:)/y);r===null&&e.fail(`a level and a table after bend=, the lengths of its nodes: bend=4n:&rubato`),e.i++;let i=e.cellRef(`a table after bend=4n:, the lengths of its nodes: bend=4n:&rubato`,`after bend=4n:`),a,o=null;if(e.peek()===`:`){e.i++;let t=e.i;o=Co(e,`depth`,t),a=o?o.range?o.range[0]:1:e.num(`a depth after bend=${r}:&${i.name}:, how far its table applies (1 as written, 0 even, -1 inverted): bend=${r}:&${i.name}:.5`,q.depth).value}t.bend={level:r,table:i,...a===void 0?{}:{depth:a},...o?{depthMoves:o}:{}},t.paramSpans.bend=e.place(n)},xo=(e,t,n)=>{if(!/^[1-9][0-9]*(?:n\.?|t):/.test(e.text.slice(e.i)))return So(e,t,n);let r=e.i,i=[];for(;;){let a=e.match(/[1-9][0-9]*(?:n\.?|t)(?=:)/y);a===null&&e.fail(`a level after the comma, a note value and a share: ${n}=8n:.6,16n:.55`),e.i++;let o,s=n===`swing`?Co(e,`swing`,e.i):null;if(s){(i.length||e.peek()===`,`||e.peek()===`:`)&&e.fail(`a share moved by cells is one level alone: swing=8n:&lean, swing=8n:.5...75 * &k`,r,e.i-r),t.swingMoves={level:a,...s},i.push({level:a,share:s.range?s.range[0]:.5});break}let c=e.free(n===`swing`?q.share:q.legatoShare,n),l=c!==null;if(l)o=c.value,(i.length||e.peek()===`,`)&&e.fail(`a share left free(…) is one level alone: ${n}=8n:free(.5, .5..75)`,r,e.i-r);else if(n===`legato`){let t=e.match(/(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?![0-9.])/y);t===null&&e.fail(`a share after ${a}:, of each note's held length (.5 staccato, 1 as written): legato=${a}:.5`),o=parseFloat(t)}else{let t=e.i,n=e.match(/[0-9]+\/[0-9]+(?![0-9.])/y);if(n!==null){let[r,i]=n.split(`/`).map(Number);i===0&&e.fail(`a share's denominator can't be 0: swing=${a}:2/3`,t,n.length),r>i&&e.fail(`a share is from 0 to 1, and ${n} is above it: swing=${a}:2/3`,t,n.length),o=r/i}else{let t=e.match(/(?:0?\.[0-9]+|0|1(?:\.0+)?)(?![0-9])/y);t===null&&e.fail(`a share after ${a}:, from 0 to 1, a decimal or a fraction (.5 straight, .67 or 2/3 the triplet swing): swing=${a}:2/3`),o=parseFloat(t)}}if(e.peek()===`:`){let t=e.i;e.i++;let i=e.match(/[a-z]+/y);i!==`pairs`&&e.fail(`a share takes no word after it: a swing leans a level's pairs alone and keeps its groups of three straight (swing=${a}:2/3)`,t,1+(i?.length??0)),n===`legato`&&e.fail(`:pairs was swing='s word; a legato= share holds every note of its level: legato=${a}:.5`,t,6),l&&e.peek()===`,`&&e.fail(`a share left free(…) is one level alone: ${n}=8n:free(.5, .5..75)`,r,e.i-r),e.warn(`:pairs says nothing more: every swing leans a level's pairs alone and keeps its groups of three straight (decision 071); Migrate drops it`,t,6)}if(i.push({level:a,share:o}),e.peek()!==`,`)break;e.i++}n===`legato`?t.legato=i:(t.swing=i,t.params[n]=i[0].share),t.paramSpans[n]=e.span(r)};function So(e,t,n){let r=e.i;if(n===`level`&&(e.peek()===`&`||/^(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+|free\([^()]*\))\s*\*/.test(e.text.slice(e.i)))){let i=[],a=1;for(let t=!0;;t=!1){let n=e.i;if(!t){if(e.skipSpace(),e.peek()!==`*`){e.i=n;break}e.i++,e.skipSpace()}let r=e.freeNumber(q.level),o=r===null?e.match(/(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/y):String(r);o===null?i.push(e.cellRef(`a level cell or a number, like level=&accent*&duck*.4`,`in level=`)):a*=parseFloat(o)}t.paramCells[n]={range:null,factors:i,span:e.span(r)},a!==1&&(t.params[n]=a),t.paramSpans[n]=e.span(r);return}if((e.peek()===`&`||Ja(e))&&qr.has(n)){let i=Za(e,!1);i.kind!==`driven`&&i.kind!==`tap`&&e.fail(`${n}= takes seconds, a clock or a tap: ${n}=&bar*2, ${n}=8n`,r,e.i-r),t.paramClocks[n]=i,t.paramSpans[n]=e.span(r);return}let i=n===`s`?e.text.slice(e.i).match(/^([A-Za-z]+)\.\.([A-Za-z]+)/):null;if(i){e.i+=i[0].length;let n=[];for(;;){let t=e.i;if(e.skipSpace(),e.peek()!==`*`){e.i=t;break}e.i++,e.skipSpace(),n.push(e.cellRef(`a cell after *, like s=${i[0]} * &style[bite]`,`in s=`))}n.length===0&&e.fail(`s=${i[0]}: a blend of two waves is moved by cells, the share of the second: s=${i[0]} * &style[bite]`,r,e.i-r),t.params.s=i[1],t.paramCells.s={range:[0,1],factors:n,span:e.span(r),to:i[2]},t.paramSpans.s=e.span(r);return}let a=Co(e,n,r);if(a){t.paramCells[n]=a,t.paramSpans[n]=e.span(r);return}let o=e.free(q.param,n);if(o!==null){t.params[n]=o.value,t.paramSpans[n]=e.span(r);return}let s=e.match(/-?[A-Za-z0-9_.]+/y);s===null&&e.fail(`Expected a value after ${n}=`);let c=/^-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/.test(s)?parseFloat(s):s;t.params[n]=n===`ftype`&&typeof c==`number`?ri(c)??c:c,t.paramSpans[n]=e.span(r)}function Co(e,t,n){let r=mo(e,t);if(e.peek()!==`&`&&!r)return null;let i=[];for(r||i.push(e.cellRef(`a cell after ${t}=`,`in ${t}=`));;){let n=e.i;if(e.skipSpace(),e.peek()!==`*`){e.i=n;break}e.i++,e.skipSpace(),i.push(e.cellRef(`a cell after *, like ${t}=200..3000 * &fenv`,`in ${t}=`))}return r&&i.length===0&&e.fail(`${t}=${e.text.slice(n,e.i)}: a range is scaled by cells — ${t}=${e.text.slice(n,e.i)} * &fenv`,n,e.i-n),!r&&i.length>1&&e.fail(`${t}=: several cells multiply a range — ${t}=200..3000 * &a * &b`,n,e.i-n),{range:r,factors:i,span:e.span(n)}}let wo={init:`init= is now shift=`,out:`out= is now a command: out(voice, &cell) / step(&meter, bpm=…)`,time:`time= is now a command: out(voice, &cell) / step(&meter, bpm=…)`,rung:`rung= is now tier= (decision 020): the tutorial is in tiers, tier=1 to tier=9`,...si};function To(e){let t=e.i;e.i+=5,e.peek()===`"`&&e.fail(`free("…") is a text, for spell(…): a braid left free is steps, free(0 2 4 ~)`,t,6);let n=e.text.indexOf(`)`,e.i);n<0&&e.fail(`')' to close free(…)`,t,e.i-t);let r=e.within(e.text.slice(e.i,n),e.i),i=[];for(;r.skipSpace(),!r.done();){let e=r.i,t=qa(r);hn(t.atom).some(e=>e.kind!==`note`&&e.kind!==`rest`&&e.kind!==`chord`)&&r.fail(`A braid left free holds steps: numbers, rests (~), chords ([0,4]) and subsequences of them ([0 2]), held (@n) or repeated (!n)`,e,r.i-e),Ga(r,i,t)}i.length||e.fail(`free(…) around a braid needs steps: free(0 2 4 ~)`,t,n-t+1),e.i=n+1;let a=i.reduce((e,t)=>e+t.repeat*t.elongate,0);return e.frees.push({key:`braid`,value:0,unit:``,lo:0,hi:a,span:e.place(t),braid:r.text.trim().replace(/\s+/g,` `)}),{kind:`list`,tokens:i}}function Eo(e,t){let n={over:null,base:null,shift:null,cycle:null,step:null,map:null,stride:null,env:null,pitch:null,show:null,label:null,laps:null,title:null,tags:null,tier:null,about:null,style:null,chance:null,seed:null,size:null,swing:null,bend:null,swingMoves:null,legato:null,params:{},paramSpans:{},paramCells:{},paramClocks:{},playMove:null},r=/* @__PURE__ */ new Map,i=!1,a=!1,o=[],s=null,c=null,l=null,u=!1,d=-1,f=``,p=/* @__PURE__ */ new Map,m=/* @__PURE__ */ new Map;for(;!e.done();){let t=e.i,h=e.match(Pr);if(h!==null&&e.peek()===`=`){e.i++;let i=h in fo||h in Ur?h:Wr[h]??null;if(i===null&&ro.includes(h)){m.has(h)&&e.fail(`${h}= is given twice`,t,h.length),m.set(h,t),So(e,n,h),e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);continue}if(i===null&&ht.includes(h)){p.has(h)&&e.fail(`${h}= is given twice`,t,h.length);let r=e.i,i=/^(?:free\([^)]*\)|-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+))\s*(?:\.\.|±|\+-)/.test(e.text.slice(e.i));if(e.text.startsWith(`free(`,e.i)&&!i)p.set(h,{value:String(ho(e,h).value),at:t});else if(e.peek()===`&`||i){let i=e.frees.length;So(e,n,h);let a=n.paramCells[h];a||e.fail(`${h}=: a moving axis is a range within it and the cell that moves it, ${h}=0..1 * &walk`,r,e.i-r);let[o,s]=ft.find(e=>e.name===h).range;for(let t of e.frees.slice(i))t.param!==`${h} reach`&&(t.lo<o||t.hi>s)&&e.fail(`${h}=: a window's end moves within the axis, ${o} to ${s}: free(${t.value}, ${Math.max(o,t.lo)}..${Math.min(s,t.hi)})`,r,e.i-r);let c=/±|\+-/.test(e.text.slice(r,e.i)),[l,u]=a.range??[o,s];c?[l,u]=[Math.min(s,Math.max(o,l)),Math.min(s,Math.max(o,u))]:l>=o&&l<=s&&u>=o&&u<=s||e.fail(`${h}= moves within the axis, ${o} to ${s}: ${h}=${o}..${s} * &walk`,r,e.i-r),a.range&&(n.paramCells[h]={...a,range:[l,u]}),p.set(h,{value:String(l),at:t})}else e.num(`a number after ${h}= (an axis of a style, 0 to 1), or a slider, ${h}=free(.3, 0..1)`,q.axis,h),p.set(h,{value:e.text.slice(r,e.i),at:t});e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);continue}if(i===null){h in wo&&e.fail(wo[h],t,h.length),(h===`artic`||h===`energy`)&&n.map?.kind===`style`&&e.fail(`${h}= is retired: a style's axes are ${ht.join(` `)}, bite its articulation and energy off the point (decision 076); Migrate rewrites it`,t,h.length);let r=ei(h);e.fail(`Unknown attribute ${h}=${r?` — did you mean ${r}=?`:``} (a cell: ${Object.keys(Hr).join(` `)}; a sound or a physical cell: ${Object.keys(Ur).join(` `)})`,t,h.length)}let a=i===`loop`?`step`:i;if(r.has(a)){let o=r.get(a);e.fail(a===`step`&&n.step.whole!==(h===`loop`)?`step= and loop= say the same thing two ways — pick one`:o===h?`${h}= is given twice`:`${h}= and ${o}= are one parameter, ${i}= — given twice`,t,h.length)}r.set(a,h),h===`clip`&&e.warn(`clip= is Strudel's name for legato= — write legato= (Normalise rewrites it)`,t,h.length),(fo[i]?.read??(i===`swing`||i===`legato`?xo:i===`bend`?bo:Kr.has(i)?vo:So))(e,n,i,t),e.atBoundary()||e.fail(`Unexpected '${e.peek()}'`);continue}if(h===`free`&&e.peek()===`(`&&n.map?.kind===`style`&&/^\(\s*[^,()]*,/.test(e.text.slice(e.i))){let n=ht[o.length];n===void 0&&e.fail(`A style has ${ht.length} axes (${ht.join(` `)}): this value is one more`,t,h.length),e.i=t;let r=e.within(String(ho(e,n).value),t);Ga(r,o,qa(r));continue}if(h===`free`&&e.peek()===`(`&&po.test(e.text.slice(e.i))){s&&e.fail(u?Or:`A cell has one braid: a generator or a list of steps`,t,h.length),e.i=t,Ga(e,o,qa(e));continue}if(h===`free`&&e.peek()===`(`){(s||o.length)&&e.fail(Or,t,h.length),e.i=t,s=To(e),u=!0,d=e.i,f=e.text.slice(t+5,e.i-1).trim();continue}if(h!==null&&Oa(h)&&e.peek()===`(`){if((s||o.length)&&e.fail(u?Or:`A cell has one braid: a generator or a list of steps`,t,h.length),h===`fifths`){let n=wa(e,t);s=n.braid,l=n.shift}else if(h===`scale`){let n=Ca(e,t);s={kind:`scan`,steps:n.steps,span:n.span,...n.mode?{mode:n.mode}:{}},c=n.key}else s=ka(e,h,t);continue}if(h!==null&&La.includes(h)&&e.peek()===`(`){s&&e.fail(u?Or:`A cell has one braid: a generator or a list of steps`),e.i=t,Ga(e,o,qa(e));continue}if(h===`off`&&e.atBoundary()){i&&e.fail(`off is given twice`,t,h.length),i=!0;continue}if(h===`oneshot`&&e.atBoundary()){a&&e.fail(`oneshot is given twice`,t,h.length),a=!0,e.warn(`oneshot is retired as a line word: a voice’s parameter, oneshot=1 (Migrate rewrites it, decision 068)`,t,h.length);continue}if(h!==null&&(/^[A-G](?:b?-?[0-9]*)$/.test(h)||h===`_`||Object.hasOwn(hr,h))?e.i=t:h!==null&&e.fail(`Unexpected '${h}'`,t,h.length),s&&u&&e.peek()===`)`&&e.fail(`A ')' with nothing to close: free(${f}) ends at its first ')'`,t,1),s&&t===d&&/[@!*/?:]/.test(e.peek())){let n=/^\S+/.exec(e.text.slice(t))[0];e.fail(`free(${f})${n}: a modifier goes on its steps, inside the parentheses: free([${f}]${n})`,t,n.length)}s&&e.fail(u?Or:`A cell has one braid: a generator or a list of steps`,t,1),Ga(e,o,qa(e))}if(p.size){let[t,{at:r}]=[...p][0];n.map?.kind!==`style`&&e.fail(`${t}= is an axis of a style: it goes on a map=style cell (&funk map=style sync=.3 harm=.45 bite=.55 mood=.5)`,r,t.length),(s||o.length)&&e.fail(`A style writes its axes by name (sync=.3) or in order (.3 .45 .55 .5), not both`,r,t.length);let i=ht.filter(e=>!p.has(e));i.length&&e.fail(`A style names every axis: ${i.map(e=>`${e}=`).join(` `)} ${i.length===1?`is`:`are`} missing (its axes: ${ht.join(` `)})`,r,t.length);for(let t of ht){let{value:n,at:r}=p.get(t),i=e.within(n,r+t.length+1);Ga(i,o,qa(i))}}if(m.size){let[t,r]=[...m][0];n.map?.kind!==`adsr`&&e.fail(wo[t]??`${t}= is a slot of an envelope: it goes on a map=adsr cell`,r,t.length),(s||o.length)&&e.fail(`An envelope writes its slots by name (attack=.01) or in order (.01 .3 .5 .4), not both`,r,t.length);let i=ro.filter(e=>!m.has(e));i.length&&e.fail(`An envelope names every slot: ${i.map(e=>`${e}=`).join(` `)} ${i.length===1?`is`:`are`} missing (its slots: ${ro.join(` `)})`,r,t.length);for(let t of ro){let r=m.get(t),i=n.paramCells[t],a=i?String(i.range?.[0]??0):n.params[t];typeof a!=`number`&&typeof a!=`string`&&e.fail(`${t}= takes a number, a range scaled by cells, or a cell`,r,t.length),delete n.params[t];let s=e.within(String(a),r+t.length+1);Ga(s,o,qa(s))}}let h=s??(o.length?{kind:`list`,tokens:o}:{kind:`blank`});if(n.params.oneshot!==void 0){let t=n.paramSpans.oneshot,r=n.params.oneshot;r!==0&&r!==1&&e.fail(`oneshot= is 1 (each note played through) or 0 (as its step, the default)`,t?t.col-1:0,7),a&&e.fail(`oneshot is given twice: write oneshot=1 alone`,t?t.col-1:0,7),a=r===1,delete n.params.oneshot,delete n.paramSpans.oneshot}let g;if(n.params.note!==void 0){let t=n.paramSpans.note,r=n.params.note;(typeof r!=`number`||!Number.isInteger(r)||r<0||r>127)&&e.fail(`note= is a MIDI note, a whole number from 0 to 127 (36 a kick, 38 a snare)`,t?t.col-1:0,4),g=r,delete n.params.note,delete n.paramSpans.note}if(a&&typeof n.params.glide==`number`&&n.params.glide>0){let t=n.paramSpans.glide;e.fail(`oneshot or glide=: a voice plays each note through, or ties them as one`,t?t.col-1:0,5)}l!==null&&l!==0&&(n.shift!==null&&e.fail(`fifths(n) turns it already: write fifths() and shift=, or fifths(n) alone`),n.shift=l),c&&(n.over&&e.fail(`scale(…) reads through a key of its own: drop over=, or write the key as a cell (&mode over=&key scan(…))`,n.over.span.col-1,n.over.span.len),n.over=c),n.playMove&&h.kind===`blank`&&e.warn(`${n.playMove.as} after play=: ^ and ^$ move what a gate plays (one with a braid: &out play=${n.playMove.as} &lead); a read head reads the tape itself, so the move is ignored`,n.playMove.at,n.playMove.len);let _=n.playMove&&h.kind!==`blank`?{...n.playMove.transpose?{transpose:n.playMove.transpose}:{},...n.playMove.degree?{degree:n.playMove.degree}:{}}:null,{over:v,base:y,shift:b,step:x,map:S,stride:C,cycle:w,env:T,pitch:E,show:D,label:O,title:k,tags:A,tier:j,about:M,style:N,laps:ee,chance:P,seed:te,size:ne,swing:re,bend:F,swingMoves:I,legato:ie,params:ae,paramSpans:L,paramCells:oe,paramClocks:se}=n;return{name:t.name,span:t.span,over:v,...y?{base:y}:{},shift:b,off:i,...a?{oneshot:a}:{},...g===void 0?{}:{drumNote:g},step:x,map:S,stride:C,cycle:w,env:T,pitch:E,show:D,label:O,title:k,tags:A,tier:j,about:M??void 0,...N?{style:N}:{},laps:ee,chance:P,seed:te,size:ne,...re?{swing:re}:{},...F?{bend:F}:{},...I?{swingMoves:I}:{},...ie?{legato:ie}:{},params:ae,paramSpans:L,paramCells:oe,paramClocks:se,..._?{playMove:_}:{},braid:h,frees:[...e.frees]}}function Do(e){e.skipSpace(),e.text.startsWith(`&(`,e.i)&&e.fail(`An unnamed cell &( … ) goes where a cell is used; a line declares a named one: &name …`);let t=e.cellRef(`a cell name like &theme`,`names the line`);return(t.pick||t.shift)&&e.fail(`Brackets go where a cell is used (&x[0], &x[<<]), not where it is named — use shift= here`,t.span.col-1,t.span.len),e.peek()===`(`&&e.fail(`&name(…) is gone — write over=&…`),Eo(e,t)}let Oo=/^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20}|(?:rgb|rgba|hsl|hsla)\(\s*[-0-9.%\s,/]{1,40}\)|var\(--[a-z0-9-]{1,40}\))$/,ko=/^=== plugin ([a-z]+) ===\s*$/,Ao=/^=== end ===\s*$/,jo=`=== plugin name === … === end ===`,Mo=/^=== plugin /m;function No(e,t=[],n=!1){if(!Mo.test(e))return{text:e,plugins:[],diagnostics:[]};let r=e.split(`
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
`,Lo=Object.freeze(No(Io,[],!0).plugins.map(e=>Object.freeze({...e,tokens:Object.freeze({...e.tokens})})));function Z(e,{old:t=!1}={}){let n=[],r=[],i=[],{text:a,plugins:o,diagnostics:s}=No(e,[...io,...Lo.map(e=>e.name)]),c=[...s],l=[],u=[],d=null;return a.split(`
`).forEach((e,t)=>{let n=Vr(e);d?(d.text+=` `,d.parts.push({line:t+1,start:d.text.length}),d.text+=n):d={text:n,line:t+1,parts:[{line:t+1,start:0}]},/[+*,[]\s*$/.test(d.text)||(u.push(d),d=null)}),d&&u.push(d),u.forEach(({text:e,line:a,parts:o})=>{let s=t?fn(e):null;if(s!==null){let t=e.search(/\S/);c.push({severity:`warning`,message:`a style on the axes before v0.23.0 (sync harm artic energy): its axes are sync harm bite mood, bite its articulation and energy off the point (decision 076); Migrate rewrites it`,span:{line:a,col:t+1,len:e.trimEnd().length-t}})}let u=s??e,d=new Br(u,a,0,[],o,c,0,Eo);if(d.done())return;if(St(u)){let e=u.search(/\S/);c.push({severity:`error`,message:`use is retired (decision 065): a line says where its cells come from, &bd, &sd from gm_kit (a collection, by name) or &key from diatonic(mode=dorian) D (a template, with its arguments)`,span:{line:a,col:e+1,len:u.trimEnd().length-e}});return}let f=B(u);if(f!==void 0){let e=u.search(/\S/),t={line:a,col:e+1,len:u.trimEnd().length-e};f===null?c.push({severity:`error`,message:Nt,span:t}):f.kind===`use`?r.push({id:f.id,names:f.names,span:t}):i.push(...f.names.map(e=>e.slice(1)));return}try{let e=d.i,r=d.match(Pr);if(r===`step`&&d.peek()===`(`)d.fail(`step(…) is now a rate on the meter: &meter scan(27 23 26 24) step=84bpm`,e,4);else if(r===`out`&&/^\s*[(=]/.test(d.text.slice(d.i)))d.fail(`out is a cell now: &mix [&theme * &lead, …] and &out loop=SAMPLE_RATE map=sample &mix &mix`,e,3);else if(r===`cell`)d.fail(`The cell keyword is gone: a line starting with &name declares a cell`,e,4);else if(r===null){d.i=e;let r=Do(d);n.push(r,...d.lambdas),r.params.beat!==void 0&&c.push({severity:t?`warning`:`error`,message:`beat= is retired: a meter counts its beats by its signature or its levels (meter("4/4") beat=2 is meter("2/2", 2); a waltz in one, meter("*..", 4n)); Migrate rewrites it`,span:r.paramSpans?.beat??r.span})}else d.fail(`A line declares a cell: &name …`,e,r.length)}catch(e){if(!(e instanceof zr))throw e;c.push({severity:`error`,message:e.message,span:{line:a,col:e.col+1,len:e.len}});let t=/^\s*&([A-Za-z_][A-Za-z0-9_]*)/.exec(u)?.[1];t&&l.push(t)}}),zn({cells:n,diagnostics:c,broken:l,plugins:o,...r.length?{takes:r}:{},...i.length?{offers:i}:{},...t?{old:t}:{}})}let Ro=/* @__PURE__ */ new Map([[`creeping bass`,`creeping_bass`],[`walking bass`,`walking_bass`],[`eighths bass`,`eighths_bass`],[`funk bass`,`funk_bass`],[`pumping bass`,`pumping_bass`],[`root bass`,`root_bass`],[`tiptoe bass`,`tiptoe_bass`],[`lead performer`,`lead_performer`],[`stab performer`,`stab_performer`],[`pad performer`,`pad_performer`],[`drums performer`,`drums_performer`],[`bass performer`,`bass_performer`],[`Charleston stabs`,`charleston_stabs`],[`Synth-pop drums`,`synth_pop_drums`],[`Funk drums`,`funk_drums`],[`Spooky drums`,`spooky_drums`],[`Lo-fi hip hop drums`,`lo_fi_hip_hop_drums`],[`Ghost drums`,`ghost_drums`],[`rumba clave 3-2`,`rumba_clave_3_2`],[`bossa nova clave`,`bossa_nova_clave`],[`Techno drums`,`techno_drums`],[`Kinderlied drums`,`kinderlied_drums`],[`Bossa nova drums`,`bossa_nova_drums`],[`Deep house drums`,`deep_house_drums`],[`son clave 3-2`,`son_clave_3_2`],[`Swing jazz drums`,`swing_jazz_drums`],[`son clave 2-3`,`son_clave_2_3`],[`bossa nova clave (one bar)`,`bossa_nova_clave_one_bar`],[`Ambient drums`,`ambient_drums`],[`Electro swing drums`,`electro_swing_drums`],[`7/8`,`meter(grouping=meter("7/8"))`],[`4/4 leaning lightly on 16n`,`meter(swing=16n:.6)`],[`4/4 leaning faintly on 16n`,`meter(swing=16n:31/60)`],[`3/4`,`meter(grouping=meter("3/4"))`],[`6/8`,`meter(grouping=meter("6/8"))`],[`4/4 alla breve`,`meter(grouping=meter("2/2", 2))`],[`4/4 swung on 8n`,`meter(swing=8n:2/3)`],[`10/8`,`meter(grouping=meter("10/8"))`],[`2/4`,`meter(grouping=meter("2/4"))`],[`4/4`,`meter`],[`12/8`,`meter(grouping=meter("12/8"))`],[`5/4`,`meter(grouping=meter("5/4"))`],[`4/4 leaning on 16n`,`meter(swing=16n:.65)`],[`vamp to the seventh`,`vamp_to_the_seventh`],[`vamp to the fifth`,`vamp_to_the_fifth`],[`vamp to the sixth`,`vamp_to_the_sixth`],[`tonic vamp`,`tonic_vamp`],[`vamp to the fourth`,`vamp_to_the_fourth`],[`haunted progression`,`haunted_progression`],[`dark cadence`,`dark_cadence`],[`muted trumpet`,`muted_trumpet`],[`round bass`,`round_bass`],[`haunted pad`,`haunted_pad`],[`brass stab`,`brass_stab`],[`upright bass`,`upright_bass`],[`bell and scale`,`bell_and_scale`],[`harmonic minor`,`harmonic_minor`],[`rounded binary`,`rounded_binary`],[`call and answer`,`call_and_answer`],[`meter_7_8`,`meter(grouping=meter("7/8"))`],[`meter_4_4_leaning_lightly_on_16n`,`meter(swing=16n:.6)`],[`meter_4_4_leaning_faintly_on_16n`,`meter(swing=16n:31/60)`],[`meter_3_4`,`meter(grouping=meter("3/4"))`],[`meter_6_8`,`meter(grouping=meter("6/8"))`],[`meter_4_4_alla_breve`,`meter(grouping=meter("2/2", 2))`],[`meter_4_4_swung_on_8n`,`meter(swing=8n:2/3)`],[`meter_10_8`,`meter(grouping=meter("10/8"))`],[`meter_2_4`,`meter(grouping=meter("2/4"))`],[`meter_4_4`,`meter`],[`meter_12_8`,`meter(grouping=meter("12/8"))`],[`meter_5_4`,`meter(grouping=meter("5/4"))`],[`meter_4_4_leaning_on_16n`,`meter(swing=16n:.65)`],[`aeolian`,`diatonic(mode=aeolian)`],[`dorian`,`diatonic(mode=dorian)`],[`ionian`,`diatonic(mode=ionian)`],[`mixolydian`,`diatonic(mode=mixolydian)`],[`phrygian`,`diatonic(mode=phrygian)`],[`lydian`,`diatonic(mode=lydian)`],[`locrian`,`diatonic(mode=locrian)`]]),zo=new Map([`twinkle`,`wonder`,`haenschen`,`hinein`,`heim`,`weinet`].map(e=>[e,{document:`kinderlied`,head:e}])),Bo=/* @__PURE__ */ new Map([[`bass`,[`style`]],[`keys`,[`style`]],[`pad`,[`style`]],[`lead`,[`style`]],[`bass_performer`,[`bassV`,`style`]],[`pad_performer`,[`padV`,`style`]],[`stab_performer`,[`keysV`,`style`]],[`lead_performer`,[`leadV`,`style`]],[`band`,[`drumlines`,`bassline`,`padline`,`stabline`,`leadline`,`bassLevel`,`padLevel`,`stabLevel`,`leadLevel`,`style`]],[`synth_pop_drums`,[`bd`,`sd`,`hh`]],[`techno_drums`,[`bd`,`sd`,`hh`,`oh`]],[`deep_house_drums`,[`bd`,`sd`,`hh`]],[`ambient_drums`,[`bd`,`sd`,`hh`]],[`lo_fi_hip_hop_drums`,[`bd`,`rim`,`sd`,`hh`]],[`funk_drums`,[`bd`,`rim`,`sd`,`hh`,`oh`]],[`bossa_nova_drums`,[`bd`,`rim`,`sd`,`hh`]],[`swing_jazz_drums`,[`bd`,`sd`,`ph`,`rd`]],[`son_clave_3_2`,[`claves`]],[`son_clave_2_3`,[`claves`]],[`rumba_clave_3_2`,[`claves`]],[`bossa_nova_clave`,[`claves`]],[`bossa_nova_clave_one_bar`,[`claves`]],[`cinquillo`,[`claves`]],[`electro_swing_drums`,[`bd`,`sd`,`cp`,`hh`,`oh`]],[`spooky_drums`,[`bd`,`rim`,`rd`]],[`ghost_drums`,[`bd`,`rim`,`rd`]],[`kinderlied_drums`,[`bd`,`sd`,`hh`]],[`acid_drums`,[`bd`,`cp`,`hh`,`oh`]],[`happy_hardcore_drums`,[`bd`,`cp`,`hh`]],[`elektro_drums`,[`bd`,`sd`,`hh`]],[`industrial_drums`,[`bd`,`hh`]]]),Vo=(e,t,n)=>`${JSON.stringify(e)} reads ${t.map(e=>`&${e}`).join(`, `)} by name no longer: pass ${t.length>1?`them`:`it`}, ${n} (Migrate writes it, decision 075)`,Ho=(e,t)=>e.map(e=>({...e,origin:[t,...e.origin??[]]})),Uo=/^&([A-Za-z_][A-Za-z0-9_]*)(?=\s|$)/,Wo=/&([A-Za-z_][A-Za-z0-9_]*)/g,Go=/[+*,[]\s*$/;function Ko(e){let t=[],n=null;return e.split(`
`).forEach((e,r)=>{let i=V(e)[0];if(n??={written:[],code:[],line:r+1},n.written.push(e),n.code.push(i),Go.test(i))return;let a=n.code.join(` `).trim().split(/\s+/).join(` `);a&&t.push(qo(a,n.written.join(`
`),n.line)),n=null}),t}function qo(e,t=e,n=0){let r=B(e);if(r!==void 0)return{name:null,from:r,reads:[],written:t,code:e,line:n};let i=Uo.exec(e),a=i?[...new Set([...e.slice(i[0].length).matchAll(Wo)].map(e=>e[1]))]:[];return{name:i?.[1]??null,reads:a,written:t,code:e,line:n}}function Jo(e,t){let n=Ko(e),r=n.flatMap(e=>e.from?.kind===`signature`?[{line:e,sig:e.from}]:[]),i=r.find(e=>e.sig.names.includes(`&${t}`));if(!i)return null;if(r.length===1)return e;let{line:a,sig:o}=i,s=o.main?o.main.slice(1):null,c=/* @__PURE__ */ new Map;for(let e of n)if(e.name)c.set(e.name,e);else if(e.from?.kind===`use`)for(let t of e.from.names??[])c.set(t.slice(1),e);let l=e=>e.from?.kind===`use`?[...e.code.slice(e.code.search(/\sfrom\s/)).matchAll(Wo)].map(e=>e[1]):e.reads,u=/* @__PURE__ */ new Set,d=/* @__PURE__ */ new Set;for(let e=[...o.names,...o.optional].map(e=>e.slice(1));e.length;){let t=e.shift();if(d.has(t)||t===s)continue;d.add(t);let n=c.get(t);n&&!u.has(n)&&(u.add(n),e.push(...l(n)))}return[a.written.trim(),...n.filter(e=>u.has(e)).map(e=>e.written)].join(`
`)}let Yo=(e,t)=>Ko(e).flatMap(e=>e.from?.kind===`use`&&e.from.main?.trim().split(/\s+/).at(-1)===`&${t}`?[{id:e.from.id,args:Object.fromEntries((e.from.args??[]).map(e=>[e.name,e.value.trim()]))}]:[]),Xo=e=>Ko(e).flatMap(e=>e.from?.kind===`signature`?[e.from.names.map(e=>e.slice(1))]:[]);function Zo(e,t,n,r){let i=Xo(t);if(i.length<2)return{text:t};let a=i.map(e=>e.map(e=>`&${e}`).join(`, `)).join(` · `),o=(n.takes??n.names)?.[0]?.slice(1);if(!o)return r(`${Q(e)} gives ${i.length} parts, each taken by its head (${a}): name one, not *`),null;let s=Jo(t,o);return s===null?(r(`${Q(e)} gives no part headed &${o}: its parts are ${a}`),null):{text:s,part:o}}let Qo=e=>/^\s*(?:\*|&[A-Za-z_][A-Za-z0-9_]*)(?=[\s,=]).*\sfrom(?:\s|$)/m.test(e);function $o(e){for(let t of Ko(e))if(t.from?.kind===`signature`)return t.from;return null}let es=e=>e.split(`
`).filter(e=>B(V(e)[0].trim())?.kind!==`signature`).join(`
`);function ts(e){let t=2166136261,n=1523705862;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,16777619),n=Math.imul(n^i,16777619)^n>>>15}return(t>>>0).toString(16).padStart(8,`0`)+(n>>>0).toString(16).padStart(8,`0`)}let ns=e=>`e1:${ts(Ko(e).map(e=>e.code).join(`
`))}`,Q=e=>JSON.stringify(e),rs=e=>e.map(Q).join(` → `);function is(e,t,n,r){let i=new Set(e.flatMap(e=>e.name?[e.name]:[])),a=new Set(e.flatMap(e=>e.reads)),o=/* @__PURE__ */ new Map,s=e.filter(e=>e.name);return{lines:s,per:t.map(({id:e,names:t,lines:c,resolved:l},u)=>{let d=/* @__PURE__ */ new Map;for(let e of c)e.name&&!d.has(e.name)&&d.set(e.name,e);if(t&&l){let r=[...t].filter(e=>!d.has(e));for(let t of r)n(u,`&${t} is not in ${Q(e)}: it defines ${[...d.keys()].map(e=>`&${e}`).join(`, `)}`)}let f=/* @__PURE__ */ new Set;if(!t)for(let e=!0;e;){e=!1;for(let t of d.keys()){if(i.has(t)||f.has(t)||a.has(t))continue;let n=c.filter(e=>e.name&&e.name!==t&&e.reads.includes(t));n.length&&n.every(e=>i.has(e.name)||f.has(e.name))&&(f.add(t),e=!0)}}let p=t??new Set([...d.keys()].filter(e=>!f.has(e))),m=[...p].filter(e=>d.has(e)&&i.has(e)).map(e=>`&${e}`),h=/* @__PURE__ */ new Set,g=/* @__PURE__ */ new Set,_=[...p].filter(e=>d.has(e)&&!i.has(e));for(let t=_.shift();t!==void 0;t=_.shift())if(!h.has(t)){h.add(t);for(let a of d.get(t).reads)if(!(!d.has(a)||h.has(a)||p.has(a)||g.has(a))){if(!i.has(a))_.push(a);else if(a===`style`)continue;else g.add(a),n(u,`&${a} is ${Q(e)}'s, read by its &${t}, and ${r}'s too: rename ${r}'s, or name &${a} in the use to override it`)}}d.has(`style`)&&n(u,`&${_t} is the composer's, the section's style: ${Q(e)} defines it, where a fragment only reads it (the score writes &${_t} style=…; a reader with none plays the centre)`);let v=/* @__PURE__ */ new Set;for(let t of c){if(!t.name||!h.has(t.name)||t.name===`style`)continue;let r=o.get(t.name);if(r){r.id!==e&&r.code===t.code?v.add(`&${t.name}`):r.id!==e&&n(u,`&${t.name} is defined by ${Q(r.id)} and by ${Q(e)}, by different lines: write it in the piece, or drop one use`);continue}o.set(t.name,{id:e,code:t.code}),v.add(`&${t.name}`),s.push(t)}let y=m.filter(e=>[...h].some(t=>d.get(t).reads.includes(e.slice(1))));return{gave:[...v],overrode:m,read:y}})}}let as=e=>e.names?new Set(e.names.map(e=>e.slice(1))):null,os=e=>e.from?.kind===`use`?{id:e.from.id,names:e.from.names,from:e.from}:null,ss=(e,t)=>e.replace(/"[^"]*"|&([A-Za-z_][A-Za-z0-9_]*)/g,(e,n)=>n&&t.has(n)?`&${t.get(n)}`:e),cs=e=>e.slice(0,e.indexOf(`=`));function ls(e,t){let n=t.filter(e=>jt.has(e)),r=t.filter(e=>!jt.has(e)),i=new Set(r.map(cs)),[a,...o]=Ct(e).map(e=>e.text);return[a,...n,...o.filter(e=>!(At(e)&&i.has(cs(e)))&&!n.includes(e)),...r].join(` `)}function us(e,t,n){let r=new Set(Ct(n).flatMap(e=>At(e.text)?[cs(e.text)]:[])),i=Ct(t).slice(1).flatMap(e=>At(e.text)&&!r.has(cs(e.text))?[e.text]:[]);return[`&${e}`,...i,n].join(` `)}function ds(e){let t=e.trim();if(!t.startsWith(`&(`)||!t.endsWith(`)`))return e;let n=0,r=!1;for(let i=1;i<t.length;i++){let a=t[i];if(a===`"`&&(r=!r),!r){if(a===`(`)n++;else if(a===`)`&&--n===0&&i<t.length-1)return e}}return t.slice(2,-1).trim()}let fs=/* @__PURE__ */ new Set([`step`,`loop`,`swing`]);function ps(e,t,n){if(Ct(e).some(e=>At(e.text)))return e;let r=/* @__PURE__ */ new Set,i=!1,a=RegExp(`&${t}(?![A-Za-z0-9_])`);for(let e of n)for(let n of Ct(e.code).slice(1)){if(!a.test(n.text))continue;let e=RegExp(`^([A-Za-z_][A-Za-z0-9_]*)=&${t}(?![A-Za-z0-9_])`).exec(n.text);e?r.add(e[1]):i=!0}let[o]=r;return r.size===1&&!i&&fs.has(o)?`${o}=${e}`:e}function ms(e,t){let n=[],r=[!1],i=!1,a=!0;for(let o=0;o<e.length;o++){let s=e[o];if(s===`"`&&(i=!i),i||s===`"`)continue;let c=n.every(e=>e===`lambda`);if(/\s/.test(s)){c&&(r[r.length-1]=!1),a=!0;continue}if(a&&c&&/^[A-Za-z_][A-Za-z0-9_]*=/.test(e.slice(o))&&(r[r.length-1]=!0),a=!1,s===`(`){let t=e[o-1]??``,i=t===`&`?`lambda`:/[A-Za-z0-9_]/.test(t)?`call`:`group`;n.push(i),i===`lambda`&&(r.push(r.at(-1)),a=!0);continue}if(s===`)`){n.pop()===`lambda`&&r.pop();continue}if(s!==`&`)continue;let l=/^&([A-Za-z_][A-Za-z0-9_]*)/.exec(e.slice(o));if(l?.[1]!==t)continue;let u=e[o+l[0].length];if(r.some(Boolean)||n.includes(`call`)||u===`^`||u===`[`)return!0}return!1}function hs(e,t,n,r){if(!e.names||!e.takes||e.takes.every((t,n)=>t===e.names[n]))return null;let i=new Set(t.flatMap(e=>e.name?[e.name]:[])),a=/* @__PURE__ */ new Map,o=/* @__PURE__ */ new Set;return e.names.forEach((t,s)=>{let[c,l]=[t.slice(1),e.takes[s].slice(1)];i.has(l)?c!==l&&(i.has(c)&&!e.takes.includes(`&${c}`)&&r(`&${c}=${l}: ${Q(n)} defines &${c} too, by its own line: take &${l} under another name`),a.set(l,c)):(r(`&${l} is not in ${Q(n)}: it defines ${[...i].map(e=>`&${e}`).join(`, `)}`),o.add(c))}),{names:a,lacking:o}}let gs=e=>e.map(e=>e.shared?e:{...e,shared:!0});function _s(e,t,n,r,i,a,o,s){let{id:c,from:l}=e,u=Ko(n).flatMap(e=>e.from?.kind===`signature`?[e.from]:[]);if(!u.length){(l.head.length||l.args||l.main!==null)&&i(`${Q(c)} has no signature, so it takes no arguments: a collection gives the cells it defines by name (${e.names?e.names.join(`, `):`*`} from ${l.id})`);let a=gs(ys(t,n,r,i)),o=hs(l,a,c,i);if(!o)return{taken:{id:c,names:as(e),lines:a,resolved:!0},copy:[]};let s=new Set(l.names.map(e=>e.slice(1)).filter(e=>!o.lacking.has(e))),u=e=>e.name!==null&&o.names.has(e.name)||e.reads.some(e=>o.names.has(e)),d=a.map(e=>u(e)?{...qo(ss(e.code,o.names),ss(e.written,o.names),e.line),...e.origin?{origin:e.origin}:{}}:e);return{taken:{id:c,names:s,lines:gs(d),resolved:!0},copy:[]}}return u.length>1&&i(`${Q(c)} has ${u.length} signatures: a fragment has one (&head from (&optional) &main)`),vs(l,c,u[0],t,n,r,i,a,o,s)}function vs(e,t,n,r,i,a,o,s,c,l){let u=ys(r,i,a,o),d=u.filter(e=>!e.shared&&e.name),f=u.filter(e=>e.shared&&e.name),p=new Set(d.map(e=>e.name)),m=new Set(u.flatMap(e=>e.name?[e.name]:[])),h=e=>e.slice(1),g=n.names.map(h),_=n.optional.map(h),v=n.main?h(n.main):null;for(let e of g)p.has(e)||o(`${Q(t)}'s signature names &${e} its head, and it doesn't define it`);for(let e of _)m.has(e)||o(`${Q(t)}'s &${e} is an optional parameter: its line in the fragment is its default, and it has none`);v&&m.has(v)&&o(`${Q(t)}'s &${v} is its main parameter: it has no line, the argument is it`);let y=/* @__PURE__ */ new Map,b=e.takes?.map(h)??g,x=e.names?.map(h)??g;x.length===1&&g.length===1&&(b[0]===x[0]||b[0]===g[0])?y.set(g[0],x[0]):b.forEach((e,n)=>{g.includes(e)?y.set(e,x[n]):o(`&${e} is not a head of ${Q(t)}: its head${g.length>1?`s are`:` is`} ${g.map(e=>`&${e}`).join(`, `)}`)});let S=y.size===1;e.head.length&&!S&&o(`The attributes before from are the head's, and this line takes ${y.size} heads from ${Q(t)}: write them on each head's own line`);let C=new Map((e.args??[]).map(e=>[e.name,e.value])),w=c?(Bo.get(t)??[]).filter(e=>_.includes(e)&&!C.has(e)&&c.defines.has(e)):[];for(let e of w)C.set(e,`&${e}`);w.length&&c.warn(Vo(t,w,`${e.id}(${[...C].map(([e,t])=>`${e}=${t}`).join(`, `)})`));for(let e of C.keys())_.includes(e)||o(`${Q(t)} takes no ${e}=: ${_.length?`its optional parameters are ${_.map(e=>`${e}=`).join(`, `)}`:`it has no optional parameters`}`);v&&e.main===null&&o(`${Q(t)} needs its main argument, &${v}, after its id: ${e.names?.[0]??`&${g[0]}`} from ${e.id} …`),!v&&e.main!==null&&o(`${Q(t)} takes no main argument: its signature has none (&${g[0]} from ${n.optional.length?`(${n.optional.join(`, `)})`:``})`);let T=/^&([A-Za-z_][A-Za-z0-9_]*)$/,E=/* @__PURE__ */ new Map;for(let[e,t]of C)_.includes(e)&&E.set(e,ds(t));v&&e.main!==null&&E.set(v,ds(e.main));let D=/* @__PURE__ */ new Set;for(let[e,t]of E){let n=T.exec(t);n&&(y.set(e,n[1]),D.add(e))}let O=/* @__PURE__ */ new Set,k=new Map(u.flatMap(e=>e.name?[[e.name,e]]:[]));for(let e=[...g.filter(e=>y.has(e))];e.length;){let t=e.shift();if(!O.has(t)&&(O.add(t),!D.has(t)))for(let n of k.get(t)?.reads??[])k.has(n)&&e.push(n)}let A=y.get(g[0])??[...y.values()][0]??g[0];for(let e of[...y.values()])s.add(e);let j=_.filter(e=>!p.has(e)&&E.has(e)&&!D.has(e));for(let e of[...p,...v?[v]:[],...j]){if(y.has(e))continue;let t=`${A}_${e}`;for(let n=2;s.has(t)||m.has(t);n++)t=`${A}${n}_${e}`;s.add(t),y.set(e,t)}let M=/* @__PURE__ */ new Set([...m,...v?[v]:[]]),N=/* @__PURE__ */ new Set;for(let e of d)for(let n of e.reads)!M.has(n)&&!N.has(n)&&ms(e.code,n)&&(N.add(n),o(`${Q(t)}'s &${e.name} reads &${n}, which it neither defines nor declares: name it in its signature (&${g[0]} from (&${n}) …), or define it`));let ee=e.names===null&&l?g.filter(e=>l.defines.has(e)):[];if(ee.length){let e=new Map([...y].map(([e,t])=>[t,e]));O.clear();let t=[...l.reads.values()].flat(),n=[...g.filter(e=>!ee.includes(e)),...t.flatMap(t=>e.get(t)??(k.has(t)&&!p.has(t)?[t]:[]))];for(let e=n.filter(e=>!ee.includes(e));e.length;){let t=e.shift();if(!(O.has(t)||ee.includes(t))&&(O.add(t),!D.has(t)))for(let n of k.get(t)?.reads??[])k.has(n)&&e.push(n)}}let P=[];for(let t of d){let n=t.name;if(D.has(n)||!O.has(n)||ee.includes(n))continue;let r=ss(t.code,y);E.has(n)&&(r=us(y.get(n),r,ps(E.get(n),n,d))),g.includes(n)&&e.head.length&&S&&(r=ls(r,e.head)),P.push({...qo(r),...t.origin?{origin:t.origin}:{}})}v&&e.main!==null&&!D.has(v)&&P.push(qo(`&${y.get(v)} ${ps(E.get(v),v,d)}`));for(let e of j)P.push({...qo(us(y.get(e),k.get(e).code,ps(E.get(e),e,d))),origin:k.get(e).origin??[]});if(l?.warn&&!c)for(let n of _)!p.has(n)&&!E.has(n)&&l.defines.has(n)&&O.has(n)&&l.codes.get(n)!==k.get(n)?.code&&l.warn(`The piece defines &${n}, and ${Q(t)} takes its &${n} from a collection by default: pass yours, ${e.id}(${n}=&${n}), or rename it`);let te=f.filter(e=>O.has(e.name)&&!D.has(e.name)&&!j.includes(e.name));return{taken:{id:t,names:new Set(te.map(e=>e.name)),lines:te,resolved:!0},copy:P,args:Object.fromEntries(E)}}function ys(e,t,n,r){let i=e.at(-1),a=Ko(t).map(e=>({...e,origin:[{id:i,line:e.line}]})),o=` (in ${rs(e)})`,s=e=>r(`${e}${o}`),c=new Set(a.flatMap(e=>e.name?[e.name]:[])),l=[],u=a.flatMap(t=>{if(t.from===null)return s(Nt),[];let a=os(t);if(!a)return[];let{id:o}=a,u=as(a),d=[...e,o];if(e.includes(o))r(`use ${Q(o)} is a cycle: ${rs(d)}`);else if(d.length>8)r(`use ${Q(o)} nests past 8 deep: ${rs(d)}`);else{let e=n(o),u=e===null?null:Zo(o,e,a.from,s)?.text??null;if(e===null)s(`No fragment ${Q(o)} to use`);else if(u!==null){let e=_s(a,d,u,n,r,c),o={id:i,line:t.line};return l.push(...Ho(e.copy,o)),[{...e.taken,lines:Ho(e.taken.lines,o)}]}}return[{id:o,names:u,lines:[],resolved:!1}]});return is([...a,...l],u,(e,t)=>s(t),Q(e.at(-1))).lines}let bs=(e,t)=>`${Q(e)} is renamed ${t}: write from ${t} (#387; Migrate rewrites it)`;function xs(e){let t=Ko(e),n=t.length===1?t[0].from:null;return n?.kind===`use`&&!n.head.length&&!n.args&&n.main===null?n.id:null}function Ss(e,{resolve:t,locked:n=[],old:r=!1}={}){let i=Ko(e),a=i.flatMap(e=>{let t=os(e);return t?[{line:e,...t}]:[]}),o=[],s=e=>{let t=e.written.split(`
`)[0]??``,n=t.search(/\S/);return{line:e.line,col:n+1,len:t.trimEnd().length-n}},c=[],l=[],u=[],d=[],f=new Set(i.flatMap(e=>e.name?[e.name]:[])),p={defines:new Set(f),reads:new Map(i.flatMap(e=>e.name?[[e.name,e.reads]]:[])),codes:new Map(i.flatMap(e=>e.name?[[e.name,e.code]]:[]))},m=a.map(e=>{let{id:a}=e,m=as(e),h=s(e.line),g=e=>o.push({severity:`error`,message:e,span:h}),_=(e.from.takes??e.from.names)?.[0]?.slice(1),v=(n.find(e=>_!==void 0&&e.id===`${a}/${_}`)??n.find(e=>e.id===a))?.hash,y=r?zo.get(a):void 0;y&&o.push({severity:`warning`,message:`${Q(a)} is a part of ${y.document} now: take it from there (Migrate rewrites it)`,span:h});let b=t?y?Jo(t(y.document)??``,y.head):t(a,...v?[v]:[]):null,x=b===null?null:Zo(a,b,e.from,g),S=x?.text??null;if(d.push(x?.part),S===null)return b===null&&g(t?`No fragment ${Q(a)} to use`:`No library to use ${Q(a)} from: compileSource(text, env, { resolve })`),c.push(null),l.push([]),u.push(void 0),{id:a,names:m,lines:[],resolved:!1};let C=ns(S);c.push(C),v&&v!==C&&o.push({severity:`warning`,message:`${Q(a)} has changed since this piece was saved: its current version plays`,span:h});let w=Ro.get(a);w!==void 0&&t(w)===S&&o.push({severity:`warning`,message:bs(a,w),span:h});let T=xs(S);T!==null&&o.push({severity:`warning`,message:`${Q(a)} only forwards to ${Q(T)}: take from it (Migrate rewrites it)`,span:h});let E=r?{defines:new Set(i.flatMap(e=>e.name?[e.name]:[])),warn:e=>o.push({severity:`warning`,message:e,span:h})}:void 0,D=_s(e,[a],S,t,g,f,E,{...p,warn:e=>o.push({severity:`warning`,message:e,span:h})}),O={id:null,line:e.line.line};return l.push(Ho(D.copy,O)),u.push(D.args),{...D.taken,lines:Ho(D.taken.lines,O)}}),h=is([...i,...l.flat()],m,(e,t)=>o.push({severity:`error`,message:t,span:s(a[e].line)}),`the piece`);a.forEach((e,t)=>{let{gave:n,overrode:r,read:i}=h.per[t];if(!m[t].resolved||u[t])return;let c=t=>o.push({severity:`warning`,message:t,span:s(e.line)}),{id:l,names:d}=e,f=a.findIndex(e=>e.id===l&&!u[a.indexOf(e)]);if(!n.length&&f<t)c(`${Q(l)} is used already, on line ${a[f].line.line}: this use adds nothing`);else if(d)for(let e of r.filter(e=>!i.includes(e)))c(`The piece defines ${e}, so taking it from ${Q(l)} adds nothing`);else!n.length&&r.length&&c(`The piece defines all ${Q(l)} gives (${r.join(`, `)}): this use adds nothing`)});let g=e.split(`
`).length,_=new Map([...l.flatMap((e,t)=>e.map(e=>[e,t])),...m.flatMap((e,t)=>e.lines.map(e=>[e,t]))]),v=h.lines.filter(e=>_.has(e)),y=[];for(let e of v)for(let t=e.written.split(`
`).length;t>0;t--)y.push(s(a[_.get(e)].line));return{text:v.length?[e,...v.map(e=>e.written)].join(`
`):e,takes:a.map((e,t)=>{let n=l[t].filter(e=>_.get(e)===t&&e.name).map(e=>`&${e.name}`),r=u[t]?(e.names??[]).filter(e=>n.includes(e)):[];return{id:e.id,names:e.names,span:s(e.line),hash:c[t]??null,gave:u[t]?[.../* @__PURE__ */ new Set([...r,...n,...h.per[t].gave])]:h.per[t].gave,overrode:h.per[t].overrode,...u[t]?{args:u[t]}:{},...d[t]?{part:d[t]}:{}}}),given:new Set(v.flatMap(e=>e.name&&e.shared?[e.name]:[])),diagnostics:o,through:e=>e>g?y[e-g-1]??null:null,origins:new Map(v.flatMap(e=>e.name&&e.origin?[[e.name,e.origin]]:[]))}}let Cs=(e,t)=>`${e}(${Object.entries(t).map(([e,t])=>`${e}=${t}`).join(`, `)})`;function ws(e,t){let n=$o(e);if(!n)throw Error(`boundText: a template's arguments, but the text has no signature`);let r=Object.keys(t).map(e=>`&${e}`);for(let e of r)if(!n.optional.includes(e))throw Error(`boundText: ${e} is none of the signature's optional parameters (${n.optional.join(`, `)})`);let i=n.optional.filter(e=>!r.includes(e)),a=`${n.names.join(`, `)} from ${i.length?`(${i.join(`, `)}) `:``}${n.main??``}`.trimEnd(),o=new Set(r.filter(t=>RegExp(`base=${t}(?![A-Za-z0-9_])`).test(e))),s=!1;return e.split(`
`).flatMap(e=>{if(/^\s*(?:&[A-Za-z_]\w*\s*,\s*)*&[A-Za-z_]\w*\s+from(?:\s|$)/.test(e)&&!s&&$o(e))return s=!0,[a];let n=r.find(t=>RegExp(`^\\s*${t}(?![A-Za-z0-9_])`).test(e));return n?o.has(n)?[`${n} ${t[n.slice(1)]}`]:[]:[Object.entries(t).reduce((e,[t,n])=>o.has(`&${t}`)?e:e.replace(RegExp(`&${t}(?![A-Za-z0-9_])`,`g`),n),e)]}).join(`
`)}function Ts(e){if(!e.association.some(e=>e.args))return[e];let t=e.association.filter(e=>!e.args),n=/* @__PURE__ */ new Map;for(let t of e.association){if(!t.args)continue;let r=Cs(e.id,t.args),{args:i,...a}=t;n.set(r,{args:t.args,points:[...n.get(r)?.points??[],a]})}return[...t.length?[{...e,association:t}]:[],...[...n].map(([t,{args:n,points:r}])=>({id:t,text:ws(e.text,n),association:r}))]}function Es(e,t){return e.association.find(n=>n.args&&Cs(e.id,n.args)===t)?.args}let Ds=(e,t)=>t===void 0?!e.args:!!e.args&&JSON.stringify(Object.entries(e.args))===JSON.stringify(Object.entries(t));function Os(e,t){let n=[...e.diagnostics],r=(e,t)=>n.push({severity:`error`,message:e,span:t}),i=(e,t)=>n.push({severity:`warning`,message:e,span:t}),a=(e,t)=>n.push({severity:`info`,message:e,span:t}),o=new Set(e.broken),s=/* @__PURE__ */ new Map,c=(e,t)=>{o.has(e)||(r(`Unknown cell &${e}`,t),s.set(e,[...s.get(e)??[],t]))},l=/* @__PURE__ */ new Set;return{parsed:e,env:t,diagnostics:n,error:r,warn:i,info:a,broken:o,unknown:s,unknownCell:c,rateOf:e=>{if(!e)return null;if(e.kind===`rate`)return e.perSecond;if(e.kind===`env`){let n=t[e.name]??yi(e.name,t.A4??440)??void 0;return typeof n==`number`&&n>0?n:(l.has(e)||r(`Unknown environment value ${e.name} (known: ${Object.keys(t).join(`, `)}, and note names like C4, F#3, Bb2)`,e.span),l.add(e),null)}return null}}}let ks=e=>e&&!e.gate&&e.map?.kind!==`sample`&&e.map?.kind!==`midi`&&e.braid.kind===`list`&&e.braid.tokens.length===1&&e.braid.tokens[0].atom.kind===`mix`?e.braid.tokens[0].atom.exprs:null;function As(e,t){if(e.k===`num`)return{constant:t*e.value};if(e.k===`ref`)return e.ref.pick||e.level!==void 0?null:{term:{cell:e.ref.name,weight:t}};if(e.k===`prod`){let n=e.factors.filter(e=>e.k===`ref`);if(n.length!==1||n[0].k!==`ref`||n[0].ref.pick||!e.factors.every(e=>e.k===`ref`||e.k===`num`))return null;let r=e.factors.reduce((e,t)=>t.k===`num`?e*t.value:e,t);return{term:{cell:n[0].ref.name,weight:r}}}return null}let js=e=>e.kind===`note`||e.kind===`rest`||e.kind===`choice`||e.kind===`seq`&&e.layers.every(e=>e.every(e=>js(e.atom)));function Ms(e,t,n=/* @__PURE__ */ new Set){let r=t.get(e);return!r||r.gate||r.over||Object.keys(r.params).some(e=>Yr.has(e))?!1:ks(r)?Ns(e,t,n)!==null:r.map&&r.map.kind!==`lin`&&r.map.kind!==`amp`&&r.map.kind!==`db`?!1:r.braid.kind===`list`&&r.braid.tokens.length>0&&r.braid.tokens.every(e=>js(e.atom))}function Ns(e,t,n=/* @__PURE__ */ new Set){let r=ks(t.get(e));if(!r||r.length!==1||n.has(e))return null;let i=r[0],a=i.k===`sum`?i.items:[{e:i,sign:1}],o=[],s=0;for(let e of a){let t=As(e.e,e.sign);if(!t)return null;`term`in t?o.push(t.term):s+=t.constant}if(!o.length||o.length===1&&o[0].weight===1&&s===0)return null;let c=/* @__PURE__ */ new Set([...n,e]);return o.every(e=>Ms(e.cell,t,c))?{terms:o,constant:s}:null}let Ps={line:1,col:1,len:1},Fs=e=>e.over===null&&(e.braid.kind===`blank`&&(e.name===`fifths12TET`||e.map?.kind===`edo`)||e.map?.kind===`ratios`),Is=e=>Fs(e)?null:e.over?.name??`fifths12TET`,Ls=e=>e.map?.kind===`ratios`&&e.braid.kind===`list`?Math.max(1,e.braid.tokens.length-1):(e.map?.kind===`edo`?e.map.steps:null)??e.cycle??12,Rs=(e,t,n=0)=>{let r=e.get(t);if(!r||n>64)return 12;if(Is(r)===null)return Ls(r);let i=r.braid;return i.kind===`scan`?i.steps.length:i.kind===`wave`?i.n:i.kind===`list`?i.tokens.reduce((e,t)=>e+hn(t.atom).reduce((e,t)=>e+(t.kind===`note`?1:t.kind===`chord`?t.notes.length:0),0),0):Rs(e,Is(r),n+1)},zs=(e,t)=>{let n=e=>({atom:e,repeat:1,subdivide:1,elongate:1}),r=e=>n({kind:`note`,value:e,alter:0}),i=t.braid,a=Is(t);return a===null?Array.from({length:Ls(t)},(e,t)=>r(t)):i.kind===`list`?i.tokens.map(({atom:e,repeat:t,subdivide:n,elongate:r,chance:i,level:a})=>({atom:e,repeat:t,subdivide:n,elongate:r,...i===void 0?{}:{chance:i},...a===void 0?{}:{level:a}})):i.kind===`scan`?Sr(i.steps).positions.map(r):i.kind===`wave`?ba(i.shape,i.n).map(r):Array.from({length:Rs(e,a)},(e,t)=>r(t))};function Bs(e){let{parsed:t,error:n,unknownCell:r}=e,i=/* @__PURE__ */ new Map,a=/* @__PURE__ */ new Set;for(let e of t.cells)i.has(e.name)?n(`&${e.name} is already defined on line ${i.get(e.name).span.line}`,e.span):i.set(e.name,e);let o=qs(e,i);Vs(e,i),Hs(e,i),Ws(e,i),Gs(e,i),Ks(e,i);let s=tc(i,n),c=Xs(i,a,n,e.warn);ec(e,i);let l=!i.has(ci);for(let e of i.keys())(e.startsWith(`key:`)||e.startsWith(`scale:`))&&a.add(e);let u=Ys(i);if(u){i.set(Js,{name:Js,span:u.voices[0].span,over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:{kind:`list`,tokens:u.voices.map(e=>({atom:{kind:`ref`,name:e.name,pick:null,shift:0},repeat:1,subdivide:1,elongate:1,span:e.span}))}});for(let[e,t]of u.cells)i.set(e,{...i.get(e),over:{name:Js,pick:null,shift:0,span:i.get(e).span},braid:{kind:`list`,tokens:t}});a.add(Js)}l&&i.set(ci,{name:ci,span:Ps,over:null,shift:null,off:!1,step:null,map:{kind:`edo`,period:2,steps:null,span:Ps},stride:null,cycle:12,params:{},paramSpans:{},braid:{kind:`blank`}});let d=i.get(ci);Fs(d)||n(`&${ci} is the default grid: give it only cycle= and shift=`,d.span);let f=/* @__PURE__ */ new Map,p=(e,t)=>{if(f.has(e))return f.get(e);let a=i.get(e),o=Is(a),s=!0;return o!==null&&(i.has(o)?t.includes(o)?(n(`over= loops: ${[...t.slice(t.indexOf(o)),e,o].map(e=>`&`+e).join(` → `)}`,a.over?.span??a.span),s=!1):s=p(o,[...t,e]):(r(o,a.over.span),s=!1)),f.set(e,s),s};for(let e of i.keys())p(e,[]);return{decls:i,implicit:a,implicitRoot:l,overOk:f,sections:s,stacks:c,...o?{mainKey:o}:{}}}function Vs(e,t){for(let[n,r]of t){if(!r.tonic)continue;let i=t.get(r.tonic.name);if(!i){e.unknownCell(r.tonic.name,r.tonic.span);continue}let a=i.braid.kind===`list`?i.braid.tokens:[],o=a.every(e=>e.subdivide===1&&e.atom.kind===`note`&&Number.isInteger(e.atom.value))?a:[],s=o[0]?.atom;if(s?.kind!==`note`||!i.step&&(o.length!==1||o[0].repeat!==1)){e.error(i.step?`&${i.name} holds a key's tonic (scale(…, &${i.name})), stepped: write a note a step, a name or a pitch class (&${i.name} step=1m/8 D F)`:`&${i.name} holds a key's tonic (scale(…, &${i.name})): write one note, a name or a pitch class (&${i.name} D, &${i.name} 2), or step it (&${i.name} step=1m/8 D F)`,i.span);continue}t.set(n,{...r,shift:dr(s.value+s.alter,12)})}}function Hs(e,t){for(let[n,r]of t){if(r.braid.kind!==`scan`||!r.braid.mode)continue;let i=t.get(r.braid.mode.name);if(!i){e.unknownCell(r.braid.mode.name,r.braid.mode.span);continue}let a=i.step?null:Us(i);if(a){t.set(n,{...r,braid:{...r.braid,steps:a}});continue}let o=i.braid.kind===`list`?i.braid.tokens:[],s=o.length===1&&o[0].repeat===1&&o[0].subdivide===1?o[0].atom:null,c=s?.kind===`note`&&!s.pitched&&s.alter===0?s.value:null;if(i.step||c===null||!Number.isInteger(c)||c<0||c>6){e.error(i.step?`&${i.name} holds a scale's mode (scale(&${i.name}, …)): a stepped mode is not yet a form; write one (&${i.name} dorian)`:`&${i.name} holds a scale's mode (scale(&${i.name}, …)): write one, a name, its phase from the darkest or its table (&${i.name} major, &${i.name} 3, &${i.name} 0 2 3 5 7 8 10)`,i.span);continue}t.set(n,{...r,braid:{...r.braid,steps:gr(c)}})}}function Us(e){if(e.braid.kind===`scan`&&!e.braid.mode)return e.braid.steps.every(e=>e>0)&&e.braid.steps.reduce((e,t)=>e+t,0)===12?[...e.braid.steps]:null;if(e.braid.kind!==`list`||e.braid.tokens.length<2)return null;let t=[];for(let n of e.braid.tokens){let e=n.atom;if(e.kind!==`note`||e.pitched||n.repeat!==1||n.subdivide!==1||n.elongate!==1)return null;t.push(e.value+e.alter)}return t[0]!==0||t.some((e,n)=>!Number.isInteger(e)||e>=12||n>0&&e<=t[n-1])?null:t.map((e,n)=>(t[n+1]??12)-e)}function Ws(e,t){for(let[n,r]of t){let i=r.paramCells?.swing;if(!i)continue;let[a]=i.factors,o=a&&t.get(a.name),{swing:s,...c}=r.paramCells,l=()=>t.set(n,{...r,paramCells:c});if(i.factors.length!==1||i.range||a.pick||a.shift){e.error(`swing= reads one cell, a swing alone: swing=&swing, with &swing swing=8n:2/3`,i.span),l();continue}if(!o){e.unknownCell(a.name,a.span),l();continue}if(o.braid.kind!==`blank`||o.step||o.over||o.map||typeof o.params.swing!=`number`||!Object.keys(o.params).every(e=>e===`swing`||e===`label`)){e.error(`&${o.name} holds a meter's swing (swing=&${o.name}): write a swing alone, &${o.name} swing=8n:2/3`,o.span),l();continue}t.set(n,{...r,params:{...r.params,swing:o.params.swing},paramSpans:{...r.paramSpans,swing:i.span},paramCells:c,...o.swing?{swing:o.swing}:{},...o.swingMoves?{swingMoves:o.swingMoves}:{},swingFrom:a})}}function Gs(e,t){for(let[n,r]of t){let i=r.swingMoves;if(!i)continue;for(let n of i.factors)t.has(n.name)||e.unknownCell(n.name,n.span);if(i.range){i.range.every(e=>e>=0&&e<=1)||e.error(`swing=${i.level}:${i.range[0]}..${i.range[1]}: a share's range lies within 0..1 — swing=${i.level}:.5...75 * &k`,i.span);continue}let a=t.get(i.factors[0].name),o=a?.braid.kind===`list`?a.braid.tokens.flatMap(e=>hn(e.atom)).flatMap(e=>e.kind===`note`?[e.value+e.alter]:e.kind===`chord`?e.notes:[]):[],s=o.find(e=>!(e>=0&&e<=1));s!==void 0&&e.error(`swing=${i.level}:&${a.name}: a share is 0 to 1, and &${a.name} holds ${s}`,i.span);let c=o[0];c!==void 0&&s===void 0&&t.set(n,{...r,params:{...r.params,swing:c},swing:(r.swing??[]).map(e=>e.level===i.level?{...e,share:c}:e)})}}function Ks(e,t){for(let[n,r]of t){let i=r.bend?.depthMoves;if(!i)continue;for(let n of i.factors)t.has(n.name)||e.unknownCell(n.name,n.span);if(i.range)continue;let a=t.get(i.factors[0].name),o=a?.braid.kind===`list`?a.braid.tokens.flatMap(e=>hn(e.atom)).find(e=>e.kind===`note`):void 0;o?.kind===`note`&&t.set(n,{...r,bend:{...r.bend,depth:o.value+o.alter}})}}function qs(e,t){let n=[...t.values()].find(e=>!e.lambda&&!e.base&&e.over?.name.startsWith(`key:λ`))?.name??null;for(let r of[...t.values()])r.over?.name===`key:main`&&(n?(e.warn(`over=key is the old way: name the key, over=&${n} (Migrate rewrites it)`,r.over.span),t.set(r.name,{...r,over:{...r.over,name:n}})):(e.error(`over=key is the old way, and the piece has no main key (the first scale(…) in the text) for it to read: name a key, over=&key, and write it (&key scale(major, C))`,r.over.span),e.broken.add(li)));return n}let Js=`kit:voices`;function Ys(e){let t=e=>Object.keys(e?.params??{}).some(e=>Yr.has(e)),n=n=>t(e.get(n)),r=e=>!e.pick&&!e.shift&&!e.transpose&&!e.degree&&!e.values,i=new Set([...e.values()].flatMap(e=>e.over?[e.over.name]:[])),a=(e,i)=>{if(!e||e.over||e.map||t(e)||e.braid.kind!==`list`||e.braid.tokens.length===0||i.length>256||i.includes(e.name))return!1;let a=!1;for(let t of e.braid.tokens.flatMap(e=>hn(e.atom)))if(t.kind!==`rest`){if(t.kind===`ref`&&n(t.name)&&r(t))a=!0;else if(t.kind===`ref`&&!t.shift&&!t.transpose&&!t.values&&s(t.name,[...i,e.name]))a=!0;else if(t.kind===`mix`&&t.exprs.every(e=>e.k===`ref`&&n(e.ref.name)&&r(e.ref)))a=!0;else return!1}return a},o=/* @__PURE__ */ new Map,s=(t,n)=>{if(o.has(t))return o.get(t);let r=e.get(t),s=r?.braid.kind===`list`&&r.braid.tokens.length===1&&r.braid.tokens[0].atom.kind===`mix`,c=!!r&&!r.step&&!s&&!i.has(t)&&a(r,n);return(n.length===0||c)&&o.set(t,c),c},c=[...e.values()].filter(e=>e.step&&a(e,[]));if(!c.length)return null;let l=[],u=(e,t)=>{let n=l.findIndex(t=>t.name===e);return n>=0?n:l.push({name:e,pick:null,shift:0,span:t})-1},d=/* @__PURE__ */ new Map,f=t=>{if(d.has(t.name)||t.braid.kind!==`list`)return;d.set(t.name,[]);let r=t=>{let i=t.atom,a=i;if(i.kind===`ref`&&n(i.name))a={kind:`note`,value:u(i.name,t.span),alter:0};else if(i.kind===`ref`)f(e.get(i.name));else if(i.kind===`mix`){let e=i.exprs,n=e.map(e=>u(e.ref.name,t.span)),r=e.some(e=>e.level!==void 0)?e.map(e=>e.level??1):void 0;a={kind:`chord`,notes:n,alters:n.map(()=>0),...r?{levels:r}:{}}}else i.kind===`seq`&&(a={...i,layers:i.layers.map(e=>e.map(r))});return{...t,atom:a}},i=t.braid.tokens.map(r);d.set(t.name,i)};for(let t of[...e.values()])c.includes(t)&&f(t);return{voices:l,cells:d}}function Xs(e,t,n,r){let i=/* @__PURE__ */ new Set,a=(e,t)=>({k:`ref`,ref:{name:e,pick:null,shift:0,span:t}}),o=Ys(e);for(let s of[...e.values()]){let c=s.params,l=s.braid.kind===`list`?s.braid.tokens:[],u=typeof c.trigger==`string`,d=u?c.trigger:typeof c.play==`string`&&l.length?c.play:null;if(d===null)continue;let f=u?`trigger`:`play`,p=s.paramSpans[f]??s.span,m=u?void 0:s.playMove;u&&r(`&${s.name} is a gate written the old way: play= for trigger=, one level= for velocity=, gate= and gain=, the voices it plays all of as a chord (Migrate rewrites it, decision 023)`,p);let h=e=>e.kind===`ref`&&!e.pick&&!e.shift&&!e.transpose&&!e.values,g=l.length===1&&l[0].atom.kind===`mix`&&l[0].atom.exprs.every(e=>e.k===`ref`&&!e.ref.pick)?l[0].atom.exprs:null,_=l.every(e=>h(e.atom)&&e.repeat===1&&e.subdivide===1&&e.elongate===1);if(!g&&!_){n(`&${s.name} is a gate (${f}=): its braid is what it plays: a voice, a kit, a chord of voices [&lead, &bell], or voices to pick from (&${s.name} ${f}=&${d} &lead)`,s.span);continue}let v=g?g.flatMap(e=>e.k===`ref`?[{name:e.ref.name,span:e.ref.span}]:[]):l.flatMap(e=>e.atom.kind===`ref`?[{name:e.atom.name,span:e.span}]:[]),y=v;if(!g&&!u&&v.length>1){let n=`${s.name}:kit`;e.set(n,{name:n,span:s.span,over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:s.braid}),t.add(n),y=[{name:n,span:s.span}]}let b=u?[`velocity`,`gate`].flatMap(e=>typeof c[e]==`string`?[{name:c[e],port:e,span:s.paramSpans[e]??s.span}]:[]):(s.paramCells?.level?.factors??[]).map(e=>({name:e.name,port:`level`,span:e.span})),x=u?c.gain:c.level,S=typeof x==`number`?x:1,C=s.paramSpans[u?`gain`:`level`]??s.span,w=(r,i)=>{let a=e.get(r);if(!m||!a)return r;let o=`${r}${Gn({pick:null,shift:0,...m})}`,c={name:o,span:s.span,over:null,shift:null,off:!1,step:null,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:{kind:`blank`}},l={kind:`ref`,name:r,pick:null,shift:0,...m.transpose?{transpose:m.transpose}:{},...m.degree?{values:{mul:1,add:m.degree}}:{}};return e.has(o)||e.set(o,{...Hn(c,a,{name:r,pick:null,shift:0,span:i},e=>n(e,i)),shift:null,laps:a.laps??null,braid:{kind:`list`,tokens:[{atom:l,repeat:1,subdivide:1,elongate:1,span:i}]}}),t.add(o),o},T=Zs(e,e.get(d),n);T&&i.add(d);let E=(T??[{line:{name:d,pick:null,shift:0,span:p},by:[]}]).map(({line:e,by:t})=>({line:e.name,plays:w(e.name,e.span),ref:e,by:t,span:e.span})),D=t=>o?.cells.has(t)?$s(e,t):null,O=E.flatMap(t=>{let r=e.get(t.line),i=D(t.line);return y.map(o=>{let s=Qs(e.get(o.name)),c=i&&s?i.filter(e=>!s.includes(e)):[];return c.length&&n(`&${t.line} plays ${c.map(e=>`&`+e).join(`, `)}, which &${o.name} doesn't hold: a kit's lines play its own voices`,t.span),{k:`prod`,span:o.span,factors:[{k:`ref`,ref:{...t.ref,name:t.plays}},...t.by,...b.map(e=>a(e.name,e.span)),...r?.over?.name===o.name||i&&s?[]:[a(o.name,o.span)],...S===1?[]:[{k:`num`,value:S,span:C}]]}})}),k=Object.fromEntries(Object.entries(c).filter(([e])=>![`play`,`trigger`,`velocity`,`gate`,`gain`,`level`].includes(e))),A=Object.fromEntries(Object.entries(s.paramCells??{}).filter(([e])=>e!==`level`));e.set(s.name,{...s,params:k,paramCells:A,gate:{notes:d,...m?{move:m}:{},plays:E[0].plays,...T?{lines:E.map(({line:e,plays:t})=>({line:e,plays:t}))}:{},port:f,levels:b.map(({name:e,port:t})=>({name:e,port:t})),gain:S,receivers:v.map(e=>e.name)},braid:{kind:`list`,tokens:[{atom:{kind:`mix`,exprs:O,gate:s.name},repeat:1,subdivide:1,elongate:1,span:s.span}]}})}let s=new Map([...e.values()].flatMap(e=>e.gate?.lines?[[e.gate.notes,e.name]]:[])),c=e=>e.k===`ref`?[e.ref]:e.k===`sum`?e.items.flatMap(e=>c(e.e)):e.k===`prod`?e.factors.flatMap(c):[];for(let t of e.values())if(!(t.gate||t.braid.kind!==`list`))for(let e of t.braid.tokens.flatMap(e=>hn(e.atom))){let r=e.kind===`ref`?[{name:e.name,span:t.span}]:e.kind===`mix`?e.exprs.flatMap(c):[];for(let e of r)s.has(e.name)&&n(`&${e.name} is the part &${s.get(e.name)} plays, a stack of lines and no sound: mix or send &${s.get(e.name)}`,e.span)}return i}function Zs(e,t,n){if(!t||t.map||t.gate||Object.keys(t.params).some(e=>!Zr.has(e))||t.braid.kind!==`list`||t.braid.tokens.length!==1)return null;let r=t.braid.tokens[0].atom;if(r.kind!==`mix`||r.gate||!r.exprs.length)return null;let i=t=>t.k===`num`||t.k===`ref`&&[`amp`,`db`,`lin`].includes(e.get(t.ref.name)?.map?.kind??``),a=r.exprs.map(e=>{if(e.k===`ref`)return`level`in e&&e.level!==void 0?null:{line:e.ref,by:[]};if(e.k!==`prod`)return null;let t=e.factors.filter(e=>!i(e)),n=t.length===1?t[0]:e.factors[0],r=e.factors.filter(e=>e!==n);return n.k!==`ref`||!r.every(e=>e.k===`num`||e.k===`ref`&&!e.ref.pick&&!e.ref.shift)?null:{line:n.ref,by:r}});if(!a.every(e=>e!==null))return null;let o=t=>{let n=e.get(t);return!!n&&(!!n.gate||Object.keys(n.params).some(e=>Yr.has(e))||n.braid.kind===`list`&&n.braid.tokens.length===1&&n.braid.tokens[0].atom.kind===`mix`)};return a.map(e=>({line:e.line,by:e.by.filter(e=>e.k!==`ref`||!o(e.ref.name)||(n(`&${t.name} is a stack of lines, each times its levels: &${e.ref.name} is a sound, not a level (a cell with map=amp, map=db or map=lin, or a number)`,e.ref.span),!1))}))}function Qs(e){if(!e||e.map||e.gate||e.braid.kind!==`list`||!e.braid.tokens.length)return null;let t=e.braid.tokens.flatMap(e=>e.atom.kind===`ref`?[e.atom.name]:[]);return t.length===e.braid.tokens.length?t:null}function $s(e,t,n=[]){let r=e.get(t);if(!r||n.includes(t)||r.braid.kind!==`list`)return[];let i=t=>Object.keys(e.get(t)?.params??{}).some(e=>Yr.has(e)),a=/* @__PURE__ */ new Set;for(let o of r.braid.tokens.flatMap(e=>hn(e.atom))){let r=o.kind===`ref`?[o.name]:o.kind===`mix`?o.exprs.flatMap(e=>e.k===`ref`?[e.ref.name]:[]):[];for(let o of r)for(let r of i(o)?[o]:$s(e,o,[...n,t]))a.add(r)}return[...a]}function ec(e,t){let n=e=>!!e&&!e.gate&&e.map?.kind!==`sample`&&e.map?.kind!==`midi`&&e.braid.kind===`list`&&e.braid.tokens.length===1&&e.braid.tokens[0].atom.kind===`mix`&&Ns(e.name,t)===null;for(let r of t.values()){let i=r.over?t.get(r.over.name):void 0;i&&i.braid.kind===`list`&&i.braid.tokens.length&&i.braid.tokens.every(e=>e.atom.kind===`ref`&&n(t.get(e.atom.name)))&&(e.error(`A selector switches sections (decision 016): &${r.name} over=&${i.name} reads mixes. Write &${i.name} step=4n with a section per part (&${i.name} step=4n &keysBar &drumBar), step each part's cells by its section (step=&keysBar), and play the parts straight into the sound card`,r.over.span),e.broken.add(r.name))}}function tc(e,t){let n=/* @__PURE__ */ new Map,r=new Set([...e.values()].flatMap(e=>e.step?.kind===`driven`?[e.step.driver.name]:[])),i=e=>!!e&&!e.step&&!e.over&&!e.map&&(e.braid.kind===`blank`||e.braid.kind===`list`&&!e.braid.tokens.length);for(let a of[...e.values()]){if(!a.step||a.over||a.map||a.braid.kind!==`list`||!a.braid.tokens.length)continue;let o=[];for(let s of a.braid.tokens){let c=s.atom;if(c.kind!==`ref`||c.pick||c.shift||c.transpose||c.values||s.repeat!==1||s.subdivide!==1||s.elongate!==1)break;let l=e.get(c.name);if(l&&!i(l)&&(!l.step||n.has(c.name))){let n=a.braid.tokens.map(e=>e.atom.kind===`ref`?e.atom.name:``).filter(e=>e!==c.name);if(l.step||!n.some(t=>t&&!e.has(t)&&r.has(t)))break;t(`&${c.name} is a section of &${a.name}, so its line can carry attributes only (off, label=, tags=, show=, size=, shift=, restart=), not steps or a table of its own`,l.span),e.set(c.name,{...l,over:null,map:null,braid:{kind:`blank`}})}o.push(c.name)}if(o.length===a.braid.tokens.length&&!o.every(t=>e.has(t)&&!i(e.get(t)))&&o.some(e=>r.has(e))){for(let[t,r]of o.entries()){n.set(r,a.name);let o=e.get(r);if(o&&!i(o))continue;let s=a.braid.tokens[t].span,c={kind:`list`,tokens:[{atom:{kind:`note`,value:0,alter:0},repeat:1,subdivide:1,elongate:1,span:s}]};e.set(r,o?{...o,step:a.step,braid:c}:{name:r,span:s,over:null,shift:null,off:!1,step:a.step,map:null,stride:null,cycle:null,params:{},paramSpans:{},braid:c})}e.set(a.name,{...a,step:null})}}return n}let nc=(e,t,n)=>e.k===`ref`?n.includes(t(e.ref.name)):e.k===`num`?!1:e.k===`prod`?e.factors.some(e=>nc(e,t,n)):e.items.some(e=>nc(e.e,t,n));var rc=class extends Error{span;constructor(e,t){super(e),this.span=t}};let ic=e=>e.k===`ref`?e.ref.span:e.span,ac={k:`act`,terms:[],plain:[],offset:0,gain:1},oc=e=>({ref:e,sign:1,inSum:!1}),sc=(e,t)=>e(t.ref.name)===`volume`||e(t.ref.name)===`plain`&&!t.inSum;function cc(e,t,n){let r=lc(e,t);if(r.k===`signal`)return[...r.bindings];if(r.k===`num`)throw new rc(`A number is a gain or a pitch: it needs a voice (&theme * &lead * 0.8)`,ic(e));let i=[...r.terms.map(e=>e.ref.name),...r.plain.map(e=>e.name)],a=n?.(i);throw new rc(`${i.map(e=>`&`+e).join(` * `)} has no voice: a product needs one sound (a voice, a mix, a pattern read through a kit) — &theme * &lead${a?`. ${a}`:``}`,ic(e))}function lc(e,t,n=`auto`){if(e.k===`num`)return{k:`num`,value:e.value};if(e.k===`ref`){if(e.level!==void 0)throw new rc(`&${e.ref.name}:0:${+e.level.toFixed(3)} is a hit's gain, in a groove: in a mix, a gain is a number (&${e.ref.name} * ${+e.level.toFixed(3)})`,e.ref.span);let r=t(e.ref.name);return r===`signal`||r===`wave`&&n===`auto`?{k:`signal`,bindings:[{voice:e.ref,pitches:[],offset:0,gain:1}]}:r===`plain`?{...ac,plain:[e.ref]}:{...ac,terms:[{ref:e.ref,sign:1,inSum:!1}]}}if(e.k===`prod`){let r=n===`pitch`||nc(e,t,[`signal`])?`pitch`:`auto`;return e.factors.map(e=>lc(e,t,r)).reduce((t,n,r)=>uc(t,n,ic(e.factors[r])))}return dc(e,t,n)}function uc(e,t,n){if(e.k===`num`&&t.k===`num`)return{k:`num`,value:e.value*t.value};if(e.k===`signal`&&t.k===`signal`)throw new rc(`Two sounds can't multiply (&${e.bindings[0].voice.name} * &${t.bindings[0].voice.name}): mix them with + or ,`,n);if(e.k===`signal`||t.k===`signal`){let[n,r,i]=e.k===`signal`?[e,t,!1]:[t,e,!0],a=r.k===`num`?{...ac,gain:r.value}:r,o=[...a.terms,...a.plain.map(oc)];return{k:`signal`,bindings:n.bindings.map(e=>({...e,pitches:i?[...o,...e.pitches]:[...e.pitches,...o],offset:e.offset+a.offset,gain:e.gain*a.gain}))}}let r=e.k===`num`?{...ac,gain:e.value}:e,i=t.k===`num`?{...ac,gain:t.value}:t;return{k:`act`,terms:[...r.terms,...r.plain.map(oc),...i.terms,...i.plain.map(oc)],plain:[],offset:r.offset+i.offset,gain:r.gain*i.gain}}function dc(e,t,n){let r=n===`pitch`||!nc(e,t,[`signal`])&&nc(e,t,[`pitch`,`plain`])?`pitch`:`auto`,i=e.items.map(e=>({t:lc(e.e,t,r),sign:e.sign,span:ic(e.e)}));if(i.every(e=>e.t.k===`num`))return{k:`num`,value:i.reduce((e,t)=>e+t.sign*t.t.value,0)};if(i.some(e=>e.t.k===`signal`)){let e=[];for(let t of i){if(t.t.k===`num`)throw new rc(`A number is a gain or a pitch: it needs a voice (&theme * &lead * 0.8)`,t.span);if(t.t.k===`act`)throw new rc(`A pitch or a volume can't be added to a sound: it acts on one (&theme * &lead)`,t.span);if(t.sign<0)throw new rc(`Sounds mix with +; there's no subtracting a voice`,t.span);e.push(...t.t.bindings)}return{k:`signal`,bindings:e}}let a=[],o=0;for(let{t:e,sign:n,span:r}of i){if(e.k===`num`){o+=n*e.value;continue}let i=e;if(i.gain!==1)throw new rc(`A gain inside a pitch sum: gains multiply the sound — (&theme + 12) * &lead * 0.8`,r);for(let e of i.terms){if(e.inSum===!1&&!fc(e,t))throw new rc(`&${e.ref.name} is a volume: it multiplies, it can't be added — &theme * &${e.ref.name} * &lead`,e.ref.span);a.push({...e,sign:e.sign*n,inSum:!0})}for(let e of i.plain)a.push({ref:e,sign:n,inSum:!0});o+=n*i.offset}return{k:`act`,terms:a,plain:[],offset:o,gain:1}}let fc=(e,t)=>!sc(t,e),pc=e=>`&${e} is a role: it names the gates that play it, and is no sound to mix, send or play (name its gates here)`;function mc(e,t,n){let{error:r}=e,i=/* @__PURE__ */ new Map;for(let e of t.values()){if(e.map?.kind!==`role`)continue;let n=e.braid.kind===`list`?e.braid.tokens:[];n.length===0&&r(`&${e.name} is a role: name the gates that play it (&${e.name} map=role &player)`,e.span);for(let a of n){let n=a.atom;if(n.kind!==`ref`){r(`a role's entries are the gates that play it, as written (&${e.name} map=role &player &player2)`,a.span);continue}let o=t.get(n.name);if(!o)continue;if(!o.gate||n.pick||n.shift||n.transpose!==void 0||n.values||a.repeat!==1||a.elongate!==1||a.subdivide!==1){r(`&${n.name}: a role's entries are gates, as written (&player play=&part &voice), and &${n.name} is not one`,a.span);continue}let s=i.get(n.name);s===void 0?i.set(n.name,e.name):s!==e.name&&r(`&${n.name} plays two roles, &${s} and &${e.name}: a gate plays one`,a.span)}}return[...t.values()].flatMap(e=>{if(!e.gate||n.has(e.name))return[];let t=i.get(e.name);return[{name:e.name,...t===void 0?{}:{role:t},part:e.gate.notes,...e.gate.move?{move:e.gate.move}:{},voices:e.gate.receivers}]})}let hc=(e,t)=>{let n=e.get(t);return!!n&&(!!n.gate||n.map?.kind===`role`)};function gc(e,t){let n=/* @__PURE__ */ new Map,r=new Set([...t.values()].flatMap(e=>e.over?[e.over.name]:[]));for(let i of r){let r=t.get(i);if(!r||r.map||r.braid.kind!==`list`||!r.braid.tokens.length)continue;let a=r.braid.tokens,o=e=>e.atom.kind===`ref`&&!e.atom.pick&&!e.atom.shift&&e.atom.transpose===void 0&&!e.atom.values&&e.repeat===1&&e.subdivide===1&&e.elongate===1;if(!a.every(e=>o(e)&&e.atom.kind===`ref`&&hc(t,e.atom.name)))continue;let s=a.map(e=>e.atom.kind===`ref`?e.atom.name:``);r.step&&e.warn(`&${i} is a band, a table of performers: it needs no step=, the selector reading it steps (their parts keep their time)`,r.step.span);let c=/* @__PURE__ */ new Map;for(let[n,r]of s.entries()){let o=t.get(r),s=o.gate?[r]:o.braid.kind===`list`?o.braid.tokens.flatMap(e=>e.atom.kind===`ref`&&t.get(e.atom.name)?.gate?[e.atom.name]:[]):[];for(let t of new Set(s)){let o=c.get(t);o!==void 0&&o!==r?e.error(`&${t} is in &${i} twice, as &${o} and as &${r}: a performer is one entry of a band`,a[n].span):c.set(t,r)}}n.set(i,s)}return n}function _c(e,t,n){if(!n.size)return[...e];let r=e=>[...t.values()].filter(t=>t.over===e&&t.clock).map(e=>e.name);return e.map(e=>{let i=[...e.through,...e.via].find(e=>t.get(e)?.gate);if(!i)return e;let a=[],o=[];for(let[e,s]of n){let n=s.findIndex(e=>e===i||t.get(e)?.map?.kind===`role`&&t.get(e).units.some(e=>e.atom.kind===`ref`&&e.atom.name===i));if(!(n<0)){for(let t of r(e))a.push({cell:t,entry:n,part:s[n],performer:!0});o.push(...r(e),e,s[n])}}return a.length?{...e,via:[.../* @__PURE__ */ new Set([...e.via,...o])],select:[...e.select,...a]}:e})}function vc(e,t,n,r){for(let[i,a]of r)for(let r of n.values()){if(r.over!==i||!r.clock)continue;let o=e=>n.get(e)?.params.restart??r.params.restart,s=a.find(e=>o(e)===`restart`||o(e)===`resume`),c=r.step?.tap===`1m`&&r.step.chain.every(e=>e.op===`÷`&&Number.isInteger(e.n)||e.n===1);s&&!c&&e.warn(`&${r.name} switches &${s} with restart=${o(s)} off the bar: its part starts where the switch falls, not on a bar line, so its notes move in the bar. Switch on whole bars (step=1m), or let it run on (restart=free, a performer's default)`,t.get(r.name).span)}}let yc=e=>!!e&&e.map?.kind!==`sample`&&e.map?.kind!==`midi`&&e.braid.kind===`list`&&e.braid.tokens.length===1&&e.braid.tokens[0].atom.kind===`mix`,bc=(e,{decls:t})=>!!e&&!Object.keys(e.params).some(e=>Yr.has(e))&&e.braid.kind===`list`&&e.braid.tokens.length>0&&e.braid.tokens.every(e=>e.atom.kind===`ref`&&Qr(t.get(e.atom.name)?.params??{})),xc=(e,{rateOf:t})=>{if(!e.step||e.step.kind===`driven`||e.step.kind===`tap`)return null;let n=t(e.step),r=e.braid,i=r.kind===`list`?r.tokens.length:r.kind===`scan`?r.steps.length:r.kind===`wave`?r.n:1;return n===null?null:e.step.whole?n:n/Math.max(1,i)},Sc=(e,{decls:t})=>e.over?t.get(e.over.name):void 0,Cc=[{sort:`signal`,is:`A sound parameter (s=, lpf= …): a voice.`,example:[`&lead s=saw loop=C4`],holds:e=>Object.keys(e.params).some(e=>Yr.has(e))},{sort:`signal`,is:`A mix: an instrument.`,example:[`&a s=saw loop=C4`,`&b s=sine loop=C3`,`&organ [&a, &b]`],holds:(e,{decls:t})=>yc(e)&&Ns(e.name,t)===null},{sort:`signal`,is:`A pattern read through a kit (a table of voices).`,example:[`&bd s=sine loop=A1`,`&hh s=white`,`&kit &bd &hh`,`&drums over=&kit step=4 0 1 0 1`],holds:(e,t)=>bc(Sc(e,t),t)},{sort:`signal`,is:`A read head of a sound tape (a tape that records a mix).`,example:[`&lead s=saw loop=C4`,`&mix [&lead]`,`&tape write=&mix step=1 length=4`,`&head play=&tape at=1`],holds:(e,{decls:t})=>{let n=typeof e.params.play==`string`?t.get(e.params.play):void 0;return!!n&&typeof n.params.write==`string`&&yc(t.get(n.params.write))}},{sort:`wave`,is:`A braid turning at an audio rate (20 Hz and up) with no sound of its own. Alone in a product it is the sound (a waveform); in a pitch sum, or beside a sound, a pitch that moves at audio rate (FM). One that plays as a voice in the piece is a sound everywhere.`,example:[`&square loop=220 0 1`],holds:(e,t)=>(xc(e,t)??0)>=20},{sort:`volume`,is:`map=amp, map=db or map=adsr (an envelope).`,example:[`&accent map=amp step=2 1 .5`],holds:e=>e.map?.kind===`amp`||e.map?.kind===`db`||e.map?.kind===`adsr`},{sort:`plain`,is:`map=lin: as a number, it takes its operator's sort — a volume in a product, a pitch in a sum.`,example:[`&swell map=lin loop=.25 .2 1`],holds:e=>e.map?.kind===`lin`},{sort:`pitch`,is:`Anything else: a melody, a cell reading a table, a loop below hearing (a vibrato). In semitones.`,example:[`&vibrato loop=5 0 .1 -.1`],holds:()=>!0}];Cc.map(e=>W(`sort`,e.sort,e.is,[e.example[e.example.length-1]],`mix.md`));let wc=e=>e.k===`ref`?[e.ref]:e.k===`sum`?e.items.flatMap(e=>wc(e.e)):e.k===`prod`?e.factors.flatMap(wc):[],Tc=e=>wc(e).map(e=>e.name);function Ec(e,t){let n={decls:t,rateOf:e.rateOf};return e=>{let r=t.get(e);return r?Cc.find(e=>e.holds(r,n)).sort:`pitch`}}function Dc(e,t){let{error:n}=e,r={decls:t,rateOf:e.rateOf},i=Ec(e,t),a=e=>{let n=e[e.length-1],i=t.get(n);if(!i)return null;if(i.braid.kind===`list`){let e=e=>e.atom.kind===`ref`&&Object.keys(t.get(e.atom.name)?.params??{}).some(e=>Yr.has(e)),r=t=>t.atom.kind===`note`||t.atom.kind===`ref`&&e(t)&&(t.atom.pick||t.atom.shift||t.atom.transpose||t.atom.values),a=i.braid.tokens.flatMap(e=>hn(e.atom).map(e=>({atom:e})));if(a.some(e)&&a.some(r))return`&${n} mixes voices with numbers or picks: a groove holds only voices, rests and chords of voices (&bd &hh ~ [&bd, &hh]); to play numbers through voices, read them with over= a kit`}if(i.map?.kind===`midi`)return`&${n} is a MIDI card: it sends what it names to a device, and is no sound to mix or play`;if(bc(i,r))return`&${n} is a kit, a table of voices: read a pattern through it (&drums over=&${n}) and mix that`;let a=xc(i,r);return a!==null&&a<20?`&${n} loops at ${+a.toFixed(2)} Hz, below hearing: a pitch. A voice loops at an audio rate (loop=C4) or has a sound (s=saw)`:i.step?null:`&${n} has no loop=: a voice loops at an audio rate (loop=C4) or has a sound (s=saw)`},o=/* @__PURE__ */ new WeakMap;return s=>{let c=o.get(s);if(c)return c;c=[];let l=s.gate?e=>bc(t.get(e),r)?`signal`:i(e):i,u=s.gate?t.get(s.gate)?.gate:void 0,d=e=>s.exprs.flatMap(wc).find(t=>t.name===e),f=e=>{let n=t.get(e);return!!n&&(!!n.gate||yc(n)&&Ns(e,t)===null||Object.keys(n.params).some(e=>Yr.has(e)))},p=u?(u.lines?.map(e=>e.line)??[u.notes]).map(e=>({name:e,port:u.port})):[],m=u&&[...p,...u.levels].find(e=>f(e.name));if(u&&m){let e=p.some(e=>e.name===m.name)?`the notes it plays (a melody, &tune)`:`a level (a volume: a cell with map=amp, map=db or map=lin)`;return n(`${m.port}=&${m.name}: a gate's ${m.port}= takes ${e}, and &${m.name} is a sound (${t.get(m.name)?.gate?`a gate`:yc(t.get(m.name))?`a mix`:`a voice`})`,d(m.name)?.span??t.get(s.gate).span),o.set(s,c),c}let h=e=>t.get(e)?.map?.kind===`role`,g=[...p.map(e=>e.name),...s.exprs.flatMap(Tc)].find(h);if(g)return n(pc(g),d(g)?.span??t.get(s.gate??g).span),o.set(s,c),c;for(let i of s.exprs)try{let o=wc(i).filter(e=>!t.has(e.name));if(o.length){for(let t of o)e.unknownCell(t.name,t.span);continue}let s=cc(i,l,a),u=s.flatMap(e=>e.pitches).find(e=>bc(t.get(e.ref.name),r));u?n(`&${u.ref.name} is a kit, a table of voices: a pattern read through it is the sound — mix the pattern alone`,u.ref.span):c.push(...s)}catch(t){if(!(t instanceof rc))throw t;Tc(i).some(t=>e.broken.has(t))||n(t.message,t.span)}return o.set(s,c),c}}let Oc=`card:builtin`,kc=e=>e.k===`ref`?[e.ref.name]:e.k===`sum`?e.items.flatMap(e=>kc(e.e)):e.k===`prod`?e.factors.flatMap(kc):[],Ac=e=>e.kind===`ref`?[e.name]:e.kind===`mix`?e.exprs.flatMap(kc):e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>Ac(e.atom))):[],jc=e=>e.braid.kind===`list`?e.braid.tokens.flatMap(e=>Ac(e.atom)):[];function Mc(e){let t=[];for(let n of[e.over,e.tonic,e.braid.kind===`scan`?e.braid.mode:null,e.swingFrom,e.base,e.env,e.pitch,e.map?.kind===`table`?e.map.table:null,e.step?.kind===`driven`?e.step.driver:e.step?.kind===`tap`?e.step.meter:null])n&&t.push(n.name);for(let n of Object.values(e.paramCells??{}))t.push(...n.factors.map(e=>e.name));for(let n of Object.values(e.paramClocks??{}))n.kind===`driven`&&t.push(n.driver.name);for(let[n,r]of Object.entries(e.params))typeof r==`string`&&Gr[n]?.value===`cell`&&t.push(r);return e.gate&&t.push(e.gate.notes,...e.gate.levels.map(e=>e.name),...e.gate.receivers),t}let Nc=e=>[...jc(e),...Mc(e)];function Pc(e,t,n=/* @__PURE__ */ new Set){let{decls:r,implicit:i}=t,a={...t,builtin:null};if([...r.values()].some(e=>e.map?.kind===`sample`||e.map?.kind===`midi`))return a;let o=/* @__PURE__ */ new Set;for(let e of r.values())for(let t of Nc(e))t!==e.name&&o.add(t);let s=Ec(e,r),c=[...r.values()].filter(t=>!i.has(t.name)&&!n.has(t.name)&&!t.lambda&&!o.has(t.name)&&!e.broken.has(t.name)&&(s(t.name)===`signal`||s(t.name)===`wave`));if(!c.length)return a;let l=Ps,u=c.map(e=>({k:`ref`,ref:{name:e.name,pick:null,shift:0,span:e.span}})),d={name:Oc,span:l,over:null,shift:null,off:!1,step:null,map:{kind:`sample`,span:l},stride:null,cycle:null,params:{postgain:.8},paramSpans:{},braid:{kind:`list`,tokens:[{atom:{kind:`mix`,exprs:u},repeat:1,subdivide:1,elongate:1,span:l}]}};return{...t,decls:new Map([...r,[Oc,d]]),implicit:/* @__PURE__ */ new Set([...i,Oc]),overOk:new Map([...t.overOk,[Oc,!0]]),builtin:Oc}}function Fc(e){return(e?.units??[]).flatMap(e=>hn(e.atom).flatMap(e=>e.kind===`ref`?[e.name]:[]))}function Ic(e){return e.clock===e.name?1:e.rate}function Lc(e,t){let n=e.cells.get(t),r=n?.clock?e.clocks.get(n.clock):void 0;return n&&r?r.perSecond*Ic(n):null}let Rc=8192,zc=.02,Bc=.5;function Vc(e,t=440){let n=69+12*Math.log2(e/t),r=Math.round(n);return{note:r,cents:(n-r)*100}}function Hc(e,t=2){if(!Number.isFinite(e))return Rc;let n=Math.round(Rc+e/(100*t)*Rc);return Math.max(0,Math.min(16383,n))}function Uc(e,t=Math.max(Math.abs(e.gains[0]),Math.abs(e.gains[1]))){let n=e.levels[0]?.level??1,r=Math.max(0,n*Math.abs(t)),i=Math.round(127*Math.sqrt(Math.min(1,r)));return Math.max(1,Math.min(127,Number.isFinite(i)?i:1))}let Wc=[{note:35,name:`acousticbassdrum`,aliases:[]},{note:36,name:`bd`,aliases:[`kick`,`kd`,`bassdrum`]},{note:37,name:`rim`,aliases:[`rs`,`sidestick`]},{note:38,name:`sd`,aliases:[`snare`,`acousticsnare`]},{note:39,name:`cp`,aliases:[`clap`,`handclap`]},{note:40,name:`electricsnare`,aliases:[]},{note:41,name:`lt`,aliases:[`lo`,`lowfloortom`]},{note:42,name:`hh`,aliases:[`ch`,`closedhihat`]},{note:43,name:`highfloortom`,aliases:[]},{note:44,name:`ph`,aliases:[`pedalhihat`]},{note:45,name:`mt`,aliases:[`tom`,`mid`,`lowtom`]},{note:46,name:`oh`,aliases:[`openhihat`]},{note:47,name:`lowmidtom`,aliases:[]},{note:48,name:`ht`,aliases:[`hi`,`himidtom`]},{note:49,name:`cr`,aliases:[`crash`,`crashcymbal`]},{note:50,name:`hightom`,aliases:[]},{note:51,name:`rd`,aliases:[`ride`,`ridecymbal`]},{note:52,name:`chinesecymbal`,aliases:[]},{note:53,name:`ridebell`,aliases:[]},{note:54,name:`tb`,aliases:[`tambourine`]},{note:55,name:`splashcymbal`,aliases:[]},{note:56,name:`cb`,aliases:[`cowbell`]},{note:57,name:`crashcymbaltwo`,aliases:[]},{note:58,name:`vibraslap`,aliases:[]},{note:59,name:`ridecymbaltwo`,aliases:[]},{note:60,name:`hibongo`,aliases:[]},{note:61,name:`lowbongo`,aliases:[]},{note:62,name:`mutehiconga`,aliases:[]},{note:63,name:`openhiconga`,aliases:[]},{note:64,name:`lowconga`,aliases:[]},{note:65,name:`hightimbale`,aliases:[]},{note:66,name:`lowtimbale`,aliases:[]},{note:67,name:`highagogo`,aliases:[]},{note:68,name:`lowagogo`,aliases:[]},{note:69,name:`cabasa`,aliases:[]},{note:70,name:`sh`,aliases:[`maracas`]},{note:71,name:`shortwhistle`,aliases:[]},{note:72,name:`longwhistle`,aliases:[]},{note:73,name:`shortguiro`,aliases:[]},{note:74,name:`longguiro`,aliases:[]},{note:75,name:`claves`,aliases:[`clave`]},{note:76,name:`hiwoodblock`,aliases:[]},{note:77,name:`lowwoodblock`,aliases:[]},{note:78,name:`mutecuica`,aliases:[]},{note:79,name:`opencuica`,aliases:[]},{note:80,name:`mutetriangle`,aliases:[]},{note:81,name:`opentriangle`,aliases:[]}],Gc=new Map(Wc.flatMap(({note:e,name:t,aliases:n})=>[t,...n].map(t=>[t,e])));function Kc(e){return Gc.get(e.toLowerCase().replace(/\d+$/,``))??null}function qc(e,t){let n=/* @__PURE__ */ new Map;for(let r of e){let e=t(r);e!=null&&n.set(r,e)}let r=new Set(n.values()),i=36;for(let t of e)if(!n.has(t)){for(;i<=127&&r.has(i);)i++;if(i>127)break;n.set(t,i),r.add(i)}return n}let Jc=e=>[...e.cells.values()].some(e=>hi(e)),Yc=e=>(t,n)=>{let r=e.cells.get(t)?.span,i=e.cells.get(n)?.span;return(r?.line??1/0)-(i?.line??1/0)||(r?.col??0)-(i?.col??0)},Xc=(e,t=10)=>{let n=e%15;return n<t-1?n+1:n+2},Zc=(e,t)=>Fc(e.cells.get(t.voice)),Qc=(e,t)=>[...t.through,...t.via].find(t=>!!e.cells.get(t)?.gate),$c=(e,t)=>Qc(e,t)??t.voice,el=e=>e.kit&&(e.mods.length>0||e.offset!==0),tl=e=>e.kit&&!el(e);function nl(e){let t=/* @__PURE__ */ new Set,n=/* @__PURE__ */ new Set;for(let r of e.outputs)if(!r.silent){if(tl(r))for(let t of Zc(e,r))n.add(t);else if(r.kit)for(let n of Zc(e,r))t.add(Qc(e,r)??n);else t.add($c(e,r))}let r=Yc(e);return{voices:[...t].sort(r),members:[...n].sort(r)}}function rl(e,t=[{}]){if(Jc(e))return il(e);let{voices:n,members:r}=nl(e),i=qc(r,t=>e.cells.get(t)?.drumNote),a=[],o=[];(t.length?t:[{}]).forEach((e,t)=>{let r=t===0,s=al(e.kit)??(r?10:0);s&&i.size&&o.push({port:t+1,channel:s}),n.forEach((n,i)=>{let o=al(e.voices?.[n])??(r?Xc(i,s||10):0);o&&a.push({voice:n,channel:o,port:t+1})})});let s=Yc(e);return{voices:a.sort((e,t)=>s(e.voice,t.voice)||e.port-t.port),kit:[...i].map(([e,t])=>({member:e,note:t})),kits:o}}function il(e){let t=Yc(e),n=/* @__PURE__ */ new Map,r=/* @__PURE__ */ new Set,i=/* @__PURE__ */ new Map,a=/* @__PURE__ */ new Set;for(let t of e.outputs)for(let o of t.midi??[])if(a.add(o.port),tl(t)){for(let n of Zc(e,t))r.add(n);i.set(`${o.port}|${o.channel}`,{port:o.port,channel:o.channel})}else for(let r of t.kit?Zc(e,t):[t.voice])n.set(`${r}|${o.channel}|${o.port}`,{voice:r,channel:o.channel,port:o.port});for(let t of e.cells.values())t.map?.kind===`midi`&&a.add(t.map.port);let o=qc([...r].sort(t),t=>e.cells.get(t)?.drumNote);return{voices:[...n.values()].sort((e,n)=>t(e.voice,n.voice)||e.port-n.port||e.channel-n.channel),kit:[...o].map(([e,t])=>({member:e,note:t})),kits:o.size?[...i.values()].sort((e,t)=>e.port-t.port||e.channel-t.channel):[],byPiece:!0,ports:[...a].sort((e,t)=>e-t)}}let al=e=>e===0?0:ol(e),ol=e=>typeof e==`number`&&Number.isInteger(e)&&e>=1&&e<=16?e:null,sl=e=>e===null?[]:Array.isArray(e)?e:[e];function cl(e,t){let n=new Map(e.outputs.map(e=>[e.id,e])),r=/* @__PURE__ */ new Map;for(let e of t.voices)r.set(e.voice,[...r.get(e.voice)??[],{channel:e.channel,port:e.port}]);let i=new Map(t.kit.map(e=>[e.member,e.note]));return t.byPiece?e=>{if(!e.midi?.length)return null;let t=e.output===void 0?void 0:n.get(e.output),r=t&&tl(t)?i.get(e.voice):null;return r===void 0?null:e.midi.map(e=>({channel:e.channel,drum:r,port:e.port,gain:e.gain}))}:a=>{let o=a.output===void 0?void 0:n.get(a.output);if(o?.silent)return null;if(o&&tl(o)){let e=i.get(a.voice);return e===void 0?null:t.kits.map(t=>({channel:t.channel,drum:e,port:t.port}))}let s=o?o.kit?Qc(e,o)??a.voice:$c(e,o):a.voice;return(r.get(s)??[]).map(e=>({channel:e.channel,drum:null,port:e.port}))}}function ll(e,t,n=2,r=440){let i=Uc(e,t.gain),a=e.at+Math.max(0,e.dur);if(t.drum!==null)return{channel:t.channel,note:t.drum,velocity:i,at:e.at,end:a,bend:Rc,bends:[]};if(!(e.freq>0)||!Number.isFinite(e.freq))return null;let{note:o,cents:s}=Vc(e.freq,r);if(o<0||o>127)return null;let c=Math.abs(s)<Bc?0:s,l=e=>Math.abs(c+e)<Bc?Rc:Hc(c+e,n),u=[],d={at:e.at,cents:0},f=(e,t)=>{t!==(u.at(-1)?.value??l(0))&&u.push({at:e,value:t})};for(let t of e.bends){if(t.at>=a)break;if(t.ramp&&t.at>d.at)for(let e=d.at+zc;e<t.at-1e-9;e+=zc)f(e,l(d.cents+(t.cents-d.cents)*(e-d.at)/(t.at-d.at)));let n=Math.max(e.at,t.at);f(n,l(t.cents)),d={at:n,cents:t.cents}}return{channel:t.channel,note:o,velocity:i,at:e.at,end:a,bend:l(0),bends:u}}var ul=class extends Error{};function dl(e){let{braid:t,params:n}=e,{beat:r,pulse:i}=n,a=t.kind===`scan`?Ji(t.steps):t.kind===`list`&&t.perBeat!==void 0?Ki(t.tokens.map(e=>e.atom.kind===`note`?e.atom.value:0),t.signature):null,o=t.kind===`scan`&&typeof i==`string`?Di(i):null,s=a&&o?Oi(a,o):a,c=s&&typeof r==`number`&&r>0?Ai(s,r):s,l=c&&e.legato?{...c,legato:e.legato.flatMap(e=>Di(e.level)===null?[]:[{...e,whole:Di(e.level)}])}:c;if(!l||typeof n.swing!=`number`)return l;let u=(e.swing??[{level:Pi(l)??``,share:n.swing}]).flatMap(e=>{let t=Di(e.level);return t===null?[]:[{level:e.level,whole:t,share:e.share}]});return e.swingMoves&&u.length?{...l,swing:u}:Mi(l,u)}function fl(e,t,n){let r=dl(e),i=e.bend,a=e.paramSpans.bend??e.span;if(!r)return t(`bend= is on a meter: &${e.name} is none`,a),{};let o=Di(i.level),s=r.levels.length,c=o===null?NaN:s*o*r.unit/r.pulses;if(!(c>=1)||!Number.isInteger(c)||s%c!==0)return t(`bend=${i.level}: the bar of &${e.name} has no whole number of ${i.level} nodes to bend`,a),{};let l=n(i.table.name),u=l?.braid.kind===`list`?l.braid.tokens.flatMap(e=>e.atom.kind===`note`?Array.from({length:Math.max(1,e.repeat)},()=>e.atom.value):[NaN]):[];if(!u.length||u.some(e=>!(e>0)))return t(`bend=${i.level}:&${i.table.name}: a table of lengths, each above 0`,a),{};let d=s/c,f=(e,t)=>t?f(t,e%t):e,p=u.length/f(d,u.length),{positions:m,lap:h}=ji(u,c,d,p,i.depth??1),g=i.depthMoves;return{bend:{positions:m,lap:h,bars:p,...g?{depth:{range:g.range,factors:g.factors.map(e=>e.name),table:u,per:c,nodes:d}}:{}}}}let pl=e=>e?Ei(e)*e.pulses/ki(e):1;function ml(e,{decls:t,implicit:n,implicitRoot:r,overOk:i,stacks:a},o,s){let{rateOf:c,error:l,warn:u,broken:d,unknownCell:f}=e,p=/* @__PURE__ */ new Map,m=e=>Rs(t,e),h=e=>zs(t,e),g=[],_=/* @__PURE__ */ new Set,v=(i,y)=>{let b=p.get(i);if(b)return b;if(_.has(i)){for(let e of g)_.add(e),d.add(e);throw new ul}let x=t.get(i),S=a.has(i)?null:Ns(i,t);if(g.length>=256){_.size||l(`&${g[0]} splices cells into each other more than 256 deep (&${g[0]} → &${g[1]} → … → &${i}): write a long chain as one braid`,y);for(let e of[...g,i])_.add(e),d.add(e);throw new ul}if(g.includes(i))throw l(`Circular reference: ${[...g.slice(g.indexOf(i)),i].map(e=>`&`+e).join(` → `)}`,y),new ul;g.push(i);let C=h(x),w=/* @__PURE__ */ new Map,T=[],E=x.braid.kind===`list`?x.braid.tokens:[],D=(e,n,r)=>{let i=e.name;if(!t.has(i)){if(d.has(i))for(let e of g)d.add(e);throw f(i,n),new ul}let a=v(i,n),o=Si(a,e.pick);if(o===null)throw l(Ci(i,e.pick,a.units.length),n),new ul;return w.set(i,(w.get(i)??0)+r),o};C.forEach((e,t)=>{let n=1,r=E[t]?.span??x.span;e.atom.kind===`ref`&&(n=D(e.atom,r,e.repeat*e.subdivide));let i=/* @__PURE__ */ new Map;for(let t of gn(e.atom))t.atom.kind===`ref`&&i.set(t.atom,D(t.atom,t.span??r,t.repeat*t.subdivide));e.atom.kind===`seq`&&(n=Nn(e.atom,e=>i.get(e)||1)),T.push(n*e.elongate*e.repeat)});let O=T.reduce((e,t)=>e+t,0);g.pop();let k=Is(x),A=x.braid,j={name:i,span:x.span,root:k===null,implicit:i===`fifths12TET`&&r||n.has(i),over:k===null?null:x.over?.name??null,overShift:x.over?.shift??0,context:k??i,cycle:k===null?Ls(x):m(i),wrap:x.cycle??null,lambda:x.lambda??null,frees:x.frees??[],show:x.show??null,...x.paramSpans?.show?{showSpan:x.paramSpans.show}:{},laps:x.laps??null,loops:!!x.step?.whole,chance:x.chance??.5,seed:x.seed??0,size:x.size??1,tags:(x.tags??``).split(`,`).map(e=>e.trim()).filter(Boolean),about:(x.about??[]).map(e=>e.name),...x.base?{base:{name:x.base.name,...x.base.transpose?{transpose:x.base.transpose}:{},...x.base.degree?{degree:x.base.degree}:{}}}:{},beat:pl(dl(x)),meter:dl(x),...x.swingMoves?{swingMoves:{level:x.swingMoves.level,range:x.swingMoves.range,factors:x.swingMoves.factors.map(e=>e.name)}}:{},label:x.label??null,note:Kn(x),env:x.env?.name??null,pitch:x.pitch?.name??null,braid:k===null?`blank`:A.kind,units:C,scan:A.kind===`scan`?{lap:Sr(A.steps).lap,steps:A.steps}:null,...x.bend?fl(x,u,e=>t.get(e)):{},shift:x.shift??0,...x.tonic?{tonic:x.tonic.name}:{},off:x.off,oneshot:!!x.oneshot,...x.drumNote===void 0?e.parsed.old&&Kc(x.name)!==null?{drumNote:Kc(x.name)}:{}:{drumNote:x.drumNote},glide:typeof x.params.glide==`number`&&x.params.glide>0?x.params.glide:0,children:w,steps:O,unitSteps:T,hasValues:C.some(e=>hn(e.atom).some(e=>e.kind===`note`||e.kind===`chord`)),step:x.step?.kind===`driven`?{driver:x.step.driver.name,cycle:x.step.cycle,whole:x.step.whole,chain:x.step.chain}:null,paramClocks:Object.fromEntries(Object.entries(x.paramClocks??{}).flatMap(([e,t])=>t.kind===`driven`?[[e,{driver:t.driver.name,cycle:t.cycle,whole:t.whole,chain:t.chain}]]:[])),map:x.map?x.map.kind===`table`?{kind:`table`,table:x.map.table.name}:x.map.kind===`edo`?{kind:`edo`,period:x.map.period}:x.map.kind===`ratios`?{kind:`ratios`,ratios:x.braid.kind===`list`?x.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[]}:x.map.kind===`midi`?{kind:`midi`,channel:x.map.channel,port:x.map.port}:{kind:x.map.kind}:null,mix:a.has(i)?[]:S?null:C.length>0&&C.every(e=>e.atom.kind===`mix`)&&(C.length===1||x.map?.kind===`sample`)&&x.map?.kind!==`midi`?C.flatMap(e=>e.atom.kind===`mix`?o(e.atom):[]):null,...S?{sum:S}:{},sink:x.map?.kind===`sample`,sort:s(i),...x.map?.kind===`midi`?{chords:C.map(e=>e.atom.kind===`mix`?o(e.atom):null)}:{},clock:null,rate:0,stride:x.stride??1,params:x.params,paramCells:Object.fromEntries(Object.entries(x.paramCells??{}).map(([e,t])=>[e,{range:t.range,factors:t.factors.map(e=>e.name),...t.to===void 0?{}:{to:t.to}}])),voice:Object.keys(x.params).some(e=>Yr.has(e)),freq:x.step?.kind===`rate`||x.step?.kind===`env`?x.step.whole?c(x.step)??261.63:(c(x.step)??261.63)/Math.max(1,O):261.63,kit:!1,...x.gate?{gate:x.gate}:{}};return p.set(i,j),j};for(let[e,n]of t)if(i.get(e))try{v(e,n.span)}catch(e){if(!(e instanceof ul))throw e;g.length=0}for(let[e,n]of t){let t=p.get(e);if(!t||t.root)continue;let r=t.over??`fifths12TET`;!p.get(r)?.root&&n.braid.kind===`list`&&n.braid.tokens.some(e=>e.atom.kind===`note`&&!Number.isInteger(e.atom.value))&&u(`&${r} is a table, so decimal indexes are rounded down`,n.span)}return p}let hl=`tutorial`,gl={genre:[`classical`,`jazz`,`electronic`,`experimental`,`world`,`folk`,`ambient`,`dance`,`industrial`,`blues`,`minimal`,`8-bit`],artist:[`Bach`,`Wendy Carlos`,`Stockhausen`,`Neubauten`,`Aphex Twin`,`Brahms`,`Coltrane`,`Pachelbel`,`Kraftwerk`,`Scooter`,`Daft Punk`,`Chemical Brothers`,`Nine Inch Nails`,`Steve Reich`],tutorial:[hl],topic:[`sound`,`rhythm`,`harmony`,`diatonic`,`tonal`,`modal`,`chromatic`,`microtonal`,`tuning`,`arrangement`,`canon`,`counterpoint`,`motifs`,`pentatonic`,`stereo`,`FM`,`MIDI`,`physics`,`tape`]};function _l(e){if(e.toLowerCase()===`tutorial`)return{kind:`tutorial`,name:hl};let t=/^(genre|artist|topic):\s*(.*)$/i.exec(e);return t?{kind:t[1].toLowerCase(),name:t[2]}:{kind:`topic`,name:e}}function vl(e){if(/^(topic:\s*)?basics$/i.test(e.trim()))return hl;let{kind:t,name:n}=_l(e.trim());if(t===`tutorial`)return hl;let r=e=>gl[e].find(e=>e.toLowerCase()===n.toLowerCase());if(t===`topic`){let t=/^topic:/i.test(e.trim()),i=t?void 0:r(`genre`);if(i)return`genre:${i}`;let a=t?void 0:r(`artist`);return a?`artist:${a}`:n}return`${t}:${r(t)??n}`}let yl=e=>[...e.pitches.map(e=>e.ref.name),e.voice.name].filter(e=>!e.startsWith(`λ`)).join(`*`)||e.voice.name;function bl(e,t,n,r){let{error:i,warn:a,unknownCell:o}=e,s=new Map(n),c=e=>Qr(t.get(e)?.params??{}),l=e=>e.units.length>0&&e.units.every(e=>e.atom.kind===`ref`&&c(e.atom.name));for(let e of[...s.values()])!e.voice&&!e.root&&l(e)&&s.set(e.name,{...e,kit:!0});let u=[...s.values()].filter(e=>e.sink);for(let[e,n]of t){let t=s.get(e);t&&!t.mix&&!t.sum&&!hi(t)&&t.map?.kind!==`role`&&t.units.some(e=>e.atom.kind===`mix`)&&i(t.sink?`A sound card's channels are all mixes: [left …] [right …], or &left &right`:`A mix is one chord of sounds: &${e} [&a * &v, &b * &w]`,n.span)}let d=(e,t=[])=>{let n=s.get(e.voice.name);return!n?.mix||n.sink?[{b:e,through:t}]:t.includes(n.name)||t.length>16?(i(`&${n.name} plays itself through its mixes`,n.span),[]):n.mix.flatMap(r=>d({voice:r.voice,pitches:[...e.pitches,...r.pitches],offset:e.offset+r.offset,gain:e.gain*r.gain},[...t,n.name]))},f=/* @__PURE__ */ new Map,p=/* @__PURE__ */ new Map,m=(e,t)=>{p.has(e)||p.set(e,[]),p.get(e).push(t)},h=e=>[e.voice.name,e.offset,...e.pitches.map(e=>`${e.sign}${e.ref.name}${JSON.stringify(e.ref.pick)}${e.ref.shift}`)].join(`|`),g=e=>{let n=[...e].filter(e=>{let n=t.get(e);return!!n&&[...Object.keys(n.params),...Object.keys(n.paramCells??{}),...Object.keys(n.paramClocks??{})].some(e=>Yr.has(e))});return n.length?`|through:${n.join(`,`)}`:``};for(let n of u){let a=t.get(n.name),o=n.units;if(o.length===0||o.length>2){i(`The sound card takes one channel (mono) or two (left, right): &${n.name} map=sample &left &right`,a.span);continue}o.forEach((t,c)=>{let l=t.atom.kind===`mix`?r(t.atom):null,u=t.atom.kind===`ref`?s.get(t.atom.name):l?n:void 0,p=l??(t.atom.kind===`ref`&&u?.mix&&!u.sink?u.mix:null);if(!u||!p){if(t.atom.kind===`ref`&&e.broken.has(t.atom.name))return;i(t.atom.kind===`ref`&&u?.map?.kind===`role`?pc(t.atom.name):`A channel of the sound card is a mix: &mix, or [&theme * &lead] written in place`,a.span);return}for(let{b:e,through:t,top:r,index:i}of p.flatMap((e,t)=>d(e).map(n=>({...n,top:e,index:t})))){let a=h(e)+g(t),s=f.get(a),l=n.implicit?r.voice.span:u.span;s||f.set(a,s={b:e,span:l,gains:[0,0],via:/* @__PURE__ */ new Set,parts:[],through:/* @__PURE__ */ new Set});for(let e of t)s.through.add(e);m(e.voice.name,t);let d=o.length===1?[e.gain,e.gain]:c===0?[e.gain,0]:[0,e.gain];s.gains[0]+=d[0],s.gains[1]+=d[1],s.parts.push({mix:u.name,sink:n.name,gains:d,entry:{channel:c,index:i,label:yl(r)}}),s.via.add(u.name).add(n.name)}})}let _=e=>{let n=t.get(e)?.over?.name;return n&&s.get(n)?.kit?n:null};{let e=new Set([...f.values()].flatMap(e=>e.parts.map(e=>e.mix))),n=/* @__PURE__ */ new Set;for(let r of t.values())for(let t of[`excite`,`write`]){let i=r.params[t];typeof i==`string`&&s.get(i)?.mix&&!e.has(i)&&n.add(i)}for(let e of n){let t=s.get(e);for(let{b:n,through:r}of t.mix.flatMap(e=>d(e))){if(typeof s.get(n.voice.name)?.params.play==`string`)continue;let i=`send:`+h(n)+g(r);f.has(i)||[...f.values()].some(e=>h(e.b)+g(e.through)===h(n)+g(r))||(f.set(i,{b:n,span:t.span,gains:[n.gain,n.gain],via:/* @__PURE__ */ new Set([e]),parts:[],through:new Set(r),silent:!0}),m(n.voice.name,r))}}}let v=[...s.values()].filter(e=>hi(e));for(let e of v){let n=t.get(e.name),r=e.map;n.step&&i(`A MIDI card doesn't turn: leave out ${n.step.whole?`loop`:`step`}= (&${e.name} map=midi …)`,n.step.span);let o=n.braid.kind===`list`?n.braid.tokens:[],c=e.units.findIndex(e=>e.subdivide!==1||e.elongate!==1);if(c>=0){i(`A MIDI card's entries are channels: x!n repeats one on n channels, but * and @ mean nothing here`,o[c]?.span??n.span);continue}let l=e.units.reduce((e,t)=>e+t.repeat,0);if(r.channel===null&&l>16){i(`A MIDI card has 16 channels, and &${e.name} names ${l}: ~ skips one, map=midi(10) puts them all on one`,n.span);continue}l===0&&a(`&${e.name} is a MIDI card with no channels: write what goes on each, map=midi [&theme * &reed] ~ &groove`,n.map.span);let u=0;e.units.forEach((t,a)=>{let c=o[a]?.span??n.span,l=u;if(u+=t.repeat,t.atom.kind===`rest`)return;let p;if(t.atom.kind===`mix`)p={bindings:e.chords?.[a]??[],mix:null};else if(t.atom.kind===`ref`){let e=t.atom.name,n=s.get(e);if(!n)return;let r={voice:{name:e,pick:t.atom.pick,shift:t.atom.shift,span:c},pitches:[],offset:0,gain:1};if(n.mix&&!n.sink)p={bindings:n.mix,mix:e};else if(_(e)||n.voice||n.kit)p={bindings:[r],mix:null};else{i(n.map?.kind===`role`?pc(e):hi(n)?`&${e} is a MIDI card: a card's entries are what it sends (a mix, a mix cell, a pattern read through a kit), not another card — name &${e}'s entries here`:`&${e} is a melody without a voice: a MIDI channel plays notes on a voice, [&${e} * &voice]`,c);return}}else{i(`A MIDI card's entries are channels: a mix ([&theme * &reed]), a mix cell, a pattern read through a kit, or ~ to skip one`,c);return}let{bindings:v,mix:y}=p;for(let n=0;n<t.repeat;n++){let t=r.channel??l+n+1;for(let{b:n,through:i}of v.flatMap(e=>d(e))){let a=h(n)+g(i),o=f.get(a)??[...f.values()].find(e=>h(e.b)===a);o||f.set(a,o={b:n,span:e.span,gains:[0,0],via:/* @__PURE__ */ new Set,parts:[],through:/* @__PURE__ */ new Set});for(let e of i)o.through.add(e);m(n.voice.name,i),(o.midi??=[]).push({card:e.name,mix:y,channel:t,port:r.port,gain:n.gain}),o.via.add(e.name),y&&o.via.add(y)}}})}let y=[...f.values()].map(e=>{let t=_(e.b.voice.name);return t?{...e,b:{...e.b,voice:{name:t,pick:null,shift:0,span:e.b.voice.span},pitches:[{ref:e.b.voice,sign:1},...e.b.pitches]}}:e}),b=e=>{let t=s.get(e),n=t&&typeof t.params.play==`string`?s.get(t.params.play):void 0,r=n&&typeof n.params.write==`string`?s.get(n.params.write):void 0;return!!r?.mix&&!r.sink};for(let{b:e}of y){let t=s.get(e.voice.name);t&&!t.root&&!t.kit&&!b(t.name)&&!e.pitches.some(e=>e.ref.name===t.name)&&s.set(t.name,{...t,voice:!0})}let x=[...t].find(([,e])=>e.title)?.[0];for(let[e,n]of t){let r=s.get(e);if(!r)continue;if(r.map?.kind===`table`&&!t.has(r.map.table)&&o(r.map.table,n.map.span),n.base&&!t.has(n.base.name)&&o(n.base.name,n.base.span),n.style)for(let e of xl(n.style))t.has(e.name)||o(e.name,e.span);if(n.about){r.note||i(`about= belongs on a note: a cell with a label= (or title=) and nothing else`,n.about[0].span);for(let e of n.about)t.has(e.name)||o(e.name,e.span)}if(n.tier!=null&&n.title&&!(n.tags??``).split(`,`).some(e=>vl(e.trim())===`tutorial`)&&a(`tier= puts a piece in a tier of the tutorial; without tags="tutorial" it is ignored`,n.paramSpans.tier??n.span),n.tier!=null&&!n.title&&i(`tier= belongs on a piece’s card: the note with its title=`,n.paramSpans.tier??n.span),e===x&&r.note){let e=[`title`,`tags`,`tier`].filter(e=>n[e]!=null),t=e=>e.length>1?`${e.slice(0,-1).join(`, `)} and ${e.at(-1)}`:e[0],r=e.length>1;a(`${t(e.map(e=>`${e}=`))} on the piece’s card ${r?`go`:`goes`} in its file’s frontmatter now (${e.map(e=>`${e}:`).join(` `)}): Shorten moves ${r?`them`:`it`} there (decision 047)`,n.paramSpans.title??n.span)}if(!r.voice)continue;let c=n.params.s;c!==void 0&&!(String(c)in ii)&&i(`Unknown sound '${c}' (${Object.keys(ii).join(`, `)})`,n.paramSpans.s??n.span),c!==void 0&&n.braid.kind!==`blank`&&a(`s=${c} plays a built-in waveform; the braid is ignored`,n.paramSpans.s);let l=Object.keys(n.params).find(e=>Yr.has(e)),u=c===void 0&&l?Fc(r).find(t=>t!==e&&(s.get(t)?.voice||s.get(t)?.kit)):void 0;u&&a(`&${e}'s braid names &${u}, a voice: a voice's braid is its waveform, and a voice is none, so &${u} isn't heard. To play it through &${e}'s ${l}=, write the mix: &${e} … [&${u}]`,n.span);for(let[e,t]of Object.entries(n.params))Gr[e]?.value===`number`&&typeof t!=`number`&&i(`${e}= takes a number`,n.paramSpans[e]);let d=Object.keys(n.params).find(e=>Yr.has(e)),f=d?` (${d}= makes &${e} a voice; a meter takes none)`:``;n.step?.kind===`driven`||n.step?.kind===`tap`?i(`A voice moves at a rate — its pitch, like loop=C4${f}`,n.step.span):n.step&&!n.step.whole&&i(`A voice's pitch is loop= (one turn of its braid per cycle): loop=C4${f}`,n.step.span)}return{cells:s,sinks:u,cards:v,bindings:y,soundHead:b,playings:p}}function xl(e){let t=e=>e.kind===`cell`?[e.ref]:e.terms.map(e=>e.ref);return[...t(e.from),...e.to?t(e.to):[],...e.curve?[e.curve]:[]]}let Sl=(e,t,n)=>`${e}:${t.written}${n>1?`:${n}`:``}`;function Cl(e,t,n,r){let i=r*e/Math.max(1,t),a=i*t,o=e=>Math.abs(e-Math.round(e))<1e-9&&Math.round(e)>0,s=e=>o(e)&&Number.isInteger(Math.log2(Math.round(e)))&&Math.round(e)<=64;if(o(1/a))return Math.round(1/a)===1?`1m`:`1m/${Math.round(1/a)}`;if(o(a)){if(s(i*n)&&Math.round(i*n)>1)return`${Math.round(i*n)}n`;if(s(2*i*n/3))return`${Math.round(2*i*n/3)}t`}return`pulse${wl(i)}`}function wl(e){if(Math.abs(e-1)<1e-9)return``;let t=El(e);return t?t[1]===1?`*${t[0]}`:t[0]===1?`/${t[1]}`:`*${t[0]}/${t[1]}`:`*${+e.toFixed(6)}`}let Tl=e=>e.map(e=>`${e.op===`×`?`*`:`/`}${e.n}`).join(``);function El(e){for(let t=1;t<=64;t++){let n=Math.round(e*t);if(n>0&&Math.abs(n/t-e)<1e-9)return[n,t]}return null}function Dl(e,t,n){let{rateOf:r,error:i,warn:a,unknownCell:o,broken:s}=e,c=(t,n)=>(e.parsed.old?a:i)(t,n),l=new Map(n),u=/* @__PURE__ */ new Map,d=e=>{let n=e.step;if(n?.kind!==`driven`||n.whole||n.cycle||!l.get(e.name)?.meter)return null;let i=t.get(n.driver.name),a=l.get(n.driver.name);if(i?.step?.kind!==`rate`||i.step.whole||i.braid.kind!==`blank`||!a||a.voice||a.kit||a.meter)return null;let o=r(i.step);return o===null?null:o*n.ratio};for(let[e,n]of t){let t=l.get(e);if(!t||t.voice||t.kit)continue;let i=d(n);if(i===null&&n.step?.kind!==`rate`&&n.step?.kind!==`env`)continue;let o=i??r(n.step);if(o===null||!n.step)continue;n.params.pulse!==void 0&&(n.braid.kind!==`scan`||typeof n.params.pulse!=`string`||Di(n.params.pulse)===null)&&a(`pulse= says the note value of a scan's entries (pulse=16n: sixteenths, its bpm counting quarters); ${n.braid.kind===`scan`?`${n.params.pulse} is not one (16n, 8t, 4n.)`:`on &${e}, not a scan, it does nothing`}`,n.paramSpans?.pulse??n.span);let s=i===null&&n.step.whole,f=(s?o*Math.max(1,t.steps):o)*(s?1:t.beat),p=n.paramSpans?.swing??n.span,m,h=null,g=e=>String(e).replace(/^0\./,`.`);if(typeof n.params.swing==`number`&&t.meter){let r=t.meter;if(!n.swing){let e=Pi(r),t=e===null?null:Di(e);t!==null&&Fi(r,t)===null?c(`swing=${g(n.params.swing)} on a meter is retired: name the level it leans, swing=${e}:${g(n.params.swing)} (Migrate rewrites it)`,p):a(`swing=${g(n.params.swing)} leans the meter cell's own steps, and they are its beats, which swing never moves: name the level it leans, swing=8n:${g(n.params.swing)}`,p)}for(let t of(n.swing??[]).filter(e=>e.share!==.5)){let n=Di(t.level),i=n===null?`${t.level} is not a note value (8n, 16n, 8t)`:Fi(r,n);i&&a(`swing=${t.level}:${g(t.share)} leans nothing on &${e}: ${i}`,p)}h=Gi(r)}else typeof n.params.swing==`number`&&n.swing?a(`swing=${n.swing.map(e=>`${e.level}:${g(e.share)}`).join(`,`)} leans levels of a meter, and &${e} is not one: write swing=${g(n.params.swing)} (pairs of its steps)`,p):typeof n.params.swing==`number`&&n.params.swing!==.5&&(m=n.params.swing);u.set(e,{cell:e,perSecond:f,positional:Ti(t),...m===void 0?{}:{swing:m},...h?{swung:h}:{}})}let f=new Set([...t.values()].flatMap(e=>e.step?.kind===`driven`?[e.step.driver.name]:e.step?.kind===`tap`&&e.step.meter?[e.step.meter.name]:[])),p=/* @__PURE__ */ new Map,m=[],h,g=/* @__PURE__ */ new Map,_=()=>{if(h!==void 0)return h;let e=[...t.values()].filter(e=>u.has(e.name)&&l.get(e.name)?.meter);return h=(e.find(e=>!e.step?.whole)??e[0])?.name??null,h},v=(e,n,r)=>{let a=e.meter?.name??_();if(!a)return i(`${n} taps the piece's main meter, and it has none: write one (&bar meter("4/4") step=100bpm)`,e.span),r(),null;if(!t.has(a))return o(a,e.meter.span),r(),null;if(m.includes(a))return i(`step= loops back: ${[...m.slice(m.indexOf(a)),a].map(e=>`&`+e).join(` → `)}`,e.span),null;let s=b(a);return!l.get(a)?.meter||!s||s.clock!==a?(i(`${n}: &${a} is not a meter that keeps time — a tap reads a meter(…) or scan(…) with a tempo (&${a} meter("4/4") step=100bpm)`,e.meter?.span??e.span),r(),null):a},y=(e,n)=>{let r=`step=${n.meter?`&${n.meter.name}:`:``}${n.tap.written}`,i=v(n,r,()=>s.add(e));if(!i)return null;let a=l.get(i).meter;g.set(e,i);let o=Math.max(1,Math.round(t.get(e)?.cycle??1)),c=a.swing&&Number.isInteger(n.ratio)&&n.ratio>1?n.ratio:1,d=Sl(i,n.tap,o)+(c>1?`*${c}`:``);if(!u.has(d)){let e=Ei(a),t=Yi(a,n.tap,o),r=a.pulses*o,s=t.flatMap((e,n)=>Array.from({length:c},()=>((t[n+1]??r)-e)/c)),f=t.flatMap((e,n)=>Array.from({length:c},(i,a)=>e+a*((t[n+1]??r)-e)/c)),p=f.map((t,n)=>zi(a,t,s[n])*e),m=f.map(t=>t*e),h=a.levels.length*o;u.set(d,{cell:i,perSecond:u.get(i).perSecond*p.length/h,positional:!1,tap:{meter:i,positions:p,lap:h,...l.get(i).swingMoves?{written:m,grids:s}:m.some((e,t)=>Math.abs(e-p[t])>1e-12)?{written:m}:{}}})}let p=n.ratio/c,m=l.get(e);return(m?.scan||m?.bend)&&f.has(e)?(u.set(e,{cell:e,perSecond:u.get(d).perSecond*p,positional:!0}),{clock:e,rate:1}):m&&typeof t.get(e)?.params.belt==`number`?(u.set(e,{cell:e,perSecond:u.get(d).perSecond*p,positional:!1,belt:{driver:d,rate:p}}),{clock:e,rate:1}):{clock:d,rate:p}},b=e=>{if(p.has(e))return p.get(e);if(u.has(e))return p.set(e,{clock:e,rate:1}),p.get(e);let n=t.get(e)?.step;if(n?.kind===`tap`&&!l.get(e)?.voice){m.push(e);let t=y(e,n);return m.pop(),p.set(e,t),t}if(!n||n.kind!==`driven`||l.get(e)?.voice)return p.set(e,null),null;let r=n.driver.name,s=n.whole?`loop=`:`step=`,d=null;if(!t.has(r))o(r,n.driver.span);else if(m.includes(r)||r===e)i(`${s} loops back: ${[...m.slice(m.indexOf(r)),e,r].map(e=>`&`+e).join(` → `)}`,n.span);else if(l.get(r)?.voice)i(`&${r} is a voice: it moves at audio rate`,n.driver.span);else{m.push(e);let o=b(r);m.pop();let p=l.get(r)?.steps??0,h=l.get(e)?.steps??0;if(o&&!n.whole&&!n.cycle&&l.get(r)?.meter&&u.has(r)){let e=l.get(r).meter,i=Cl(e.levels.length,e.pulses,t.get(r)?.step?.kind===`rate`?e.unit:0,n.ratio);c(`step=&${r}${Tl(n.chain)} is retired: a line taps the meter by pulse, beat or a note value, never its cell's own steps (step=${_()===r?``:`&${r}:`}${i}; Migrate rewrites it)`,n.span)}if(!o)a(`&${r} never moves, so &${e} stands still — give &${r} a rate (step=84bpm) or ${s}&cell`,n.driver.span);else if(n.cycle&&p===0)i(`&${r} has no cycle to count`,n.driver.span);else if(n.whole&&h===0)i(`&${e} has no steps to loop`,n.span);else{d={clock:o.clock,rate:o.rate*n.ratio*(n.whole?h:1)/(n.cycle?p:1)};let r=l.get(e);r&&(r.scan||r.bend)&&f.has(e)&&!n.whole?(u.set(e,{cell:e,perSecond:u.get(o.clock).perSecond*d.rate,positional:!0}),d={clock:e,rate:1}):r&&typeof t.get(e)?.params.belt==`number`&&!n.whole&&(u.set(e,{cell:e,perSecond:u.get(o.clock).perSecond*d.rate,positional:!1,belt:{driver:o.clock,rate:d.rate}}),d={clock:e,rate:1})}}return p.set(e,d),d};for(let e of[...l.values()]){let n=b(e.name),r=t.get(e.name)?.step,i=g.get(e.name),a=r?.kind===`tap`?n&&i?{driver:i,cycle:!1,whole:!1,chain:r.chain,tap:r.tap.written}:null:e.step;n?l.set(e.name,{...e,clock:n.clock,rate:n.rate,step:a}):a!==e.step&&l.set(e.name,{...e,step:a})}for(let e of t.values())for(let[t,n]of Object.entries(e.paramClocks??{})){if(n.kind===`tap`){let r=l.get(e.name),i=v(n,`${t}=${n.meter?`&${n.meter.name}:`:``}${n.tap.written}`,()=>{});if(!i||!r)continue;let a=l.get(i).meter,o=a.levels.length/u.get(i).perSecond,s=n.tap.kind===`note`?n.tap.whole*a.unit*o/a.pulses:o/Yi(a,n.tap,1).length,c=n.ratio/s;l.set(e.name,{...r,params:{...r.params,[t]:+(1/c).toFixed(6)},paramClocks:{...r.paramClocks,[t]:{driver:i,cycle:!1,whole:!1,chain:n.chain,tap:n.tap.written}}});continue}if(n.kind!==`driven`)continue;let r=b(n.driver.name),a=l.get(e.name);if(!r||!a){i(`${t}=&${n.driver.name}: that cell keeps no time`,n.span);continue}let o=u.get(r.clock).perSecond*r.rate*n.ratio;l.set(e.name,{...a,params:{...a.params,[t]:+(1/o).toFixed(6)}})}return{cells:l,clocks:u,mainMeter:_()}}function Ol(e,t,n,r=/* @__PURE__ */ new Map,i=/* @__PURE__ */ new Map){let{error:a,warn:o,unknownCell:s}=e;for(let e of t.values()){let t=e.tonic?n.get(e.tonic.name):void 0;t?.meter&&o(`&${t.name} is a meter: a key's tonic is a note (&tonic D); a meter's first level is read as its pitch class`,e.tonic.span)}let c=/* @__PURE__ */ new Set;for(let e of n.values())if(e.kit)for(let r of e.units){let e=r.atom.kind===`ref`?r.atom.name:null,i=e===null?void 0:t.get(e),a=e===null?null:Kc(e);i&&a!==null&&i.drumNote===void 0&&!c.has(e)&&n.get(e)?.voice&&(c.add(e),o(`&${e} is named as General MIDI's drum ${a}, and a name gives no note: write &${e} note=${a} (Migrate writes it, decision 075)`,i.span))}if(e.parsed.old)for(let e of t.values()){let t=n.get(e.name);if(!t||t.voice)continue;let r=[`bass`,`pad`,`stab`,`lead`].includes(e.name)&&t.params.part===void 0,i=[`kick`,`backbeat`,`ghost`,`hat`,`pedal`,`euclid`,`clave`,`fill`].includes(e.name)&&t.params.role===void 0&&!t.map;r?o(`&${e.name} is named as the feel's part ${e.name}, and a name gives none now: write &${e.name} part=${e.name} (Migrate writes it, decision 075)`,e.span):i&&o(`&${e.name} is named as the feel's drum role ${e.name}, and a name gives none now: write &${e.name} role=${e.name} (Migrate writes it, decision 075)`,e.span)}for(let e of n.values()){let r=n=>t.get(e.name)?.paramSpans?.[n]??t.get(e.name).span;if(typeof e.params.body==`string`&&!(e.params.body in pi)&&a(`body=${e.params.body}: one of ${Object.keys(pi).join(`, `)}`,r(`body`)),typeof e.params.board==`string`&&e.params.board!==`none`&&!(e.params.board in pi)&&a(`board=${e.params.board}: none, or one of ${Object.keys(pi).join(`, `)}`,r(`board`)),e.params.ftype!==void 0&&ri(e.params.ftype)===null&&a(`ftype=${e.params.ftype}: its filters' model is one of ${ni.join(`, `)} (or superdough's 0, 1, 2)`,r(`ftype`)),typeof e.params.couple==`string`){let t=n.get(e.params.couple);t?typeof t.params.body!=`string`&&a(`couple=&${t.name}: it couples to another resonator (a cell with body=)`,r(`couple`)):s(e.params.couple,r(`couple`))}typeof e.params.excite==`string`&&!n.get(e.params.excite)?.mix&&a(`excite=&${e.params.excite}: a resonator is driven by sound — a mix`,r(`excite`))}for(let e of n.values()){let r=e.show?.startsWith(`mix:&`)?e.show.slice(5):null;if(r===null)continue;let i=t.get(e.name)?.paramSpans?.show??t.get(e.name).span,a=n.get(r);e.mix?a?a.root||o(`show=mix:&${r}: a mix's colours follow a grid (a cell with map=edo), not &${r}`,i):s(r,i):o(`show=mix:&${r} does nothing on &${e.name}: it names the grid a mix's colours follow, and &${e.name} isn't a mix`,i)}for(let e of n.values()){let r=n=>t.get(e.name)?.paramSpans?.[n]??t.get(e.name).span;if(typeof e.params.write==`string`){let t=n.get(e.params.write);t?t.voice&&a(`write=&${t.name}: a tape records what plays — a melody, not a voice`,r(`write`)):s(e.params.write,r(`write`))}if(typeof e.params.play==`string`){let t=n.get(e.params.play);t?typeof t.params.write!=`string`&&a(`play=&${t.name}: a read head plays a tape — a cell with write= (what it records)`,r(`play`)):s(e.params.play,r(`play`))}}for(let e of n.values()){let r=e.params.fm;if(typeof r!=`string`)continue;let i=t.get(e.name)?.paramSpans?.fm??t.get(e.name).span,o=n.get(r);if(!o)s(r,i);else if(!o.voice)a(`fm=&${r}: a modulator is a voice (s=sine ratio=…)`,i);else{let t=/* @__PURE__ */ new Set([e.name]);for(let e=r;e;e=typeof n.get(e)?.params.fm==`string`?n.get(e).params.fm:void 0){if(t.has(e)){a(`fm=&${r}: the modulators come back round to &${e} — FM chains can't loop`,i);break}t.add(e)}}}let l=Ec(e,t);for(let e of t.values())for(let[t,r]of Object.entries(e.paramCells??{})){let i=e.map?.kind===`adsr`&&gt.adsr.includes(t)||e.map?.kind===`style`&&gt.style.includes(t);t===`s`&&r.to!==void 0?[e.params.s,r.to].map(e=>typeof e==`string`?ii[e]:void 0).some(e=>e===void 0||e===`white`||e===`pink`||e===`brown`)&&a(`s=${e.params.s}..${r.to}: a blend is of two of the waves, sine tri saw square (or their other names)`,r.span):!Jr.has(t)&&!i&&a(`${t}= can't move: it takes a number (these can: ${[...Jr].join(` `)}; on a map=adsr cell, its slots; on a map=style cell, its axes; s= as a blend of two waves, s=tri..square * &x)`,r.span),r.range&&!(r.range[0]>=0&&r.range[1]>=0)&&a(`${t}=: a range of positive values, low..high`,r.span);let c=0;for(let e of r.factors){let r=n.get(e.name);r?r.map?.kind===`adsr`?c++:l(e.name)===`signal`?o(`${t}= * &${e.name}: &${e.name} is a sound, not a value that moves, and moves nothing here. A CV is a braid: &${e.name} loop=.5 sin(12)`,e.span):l(e.name)===`wave`&&o(`${t}= * &${e.name}: &${e.name} turns at an audio rate, and ${t}= follows a cell turning at most 20 times a second: it is read turning at that. A sound moved at an audio rate is FM's: fm= a voice`,e.span):s(e.name,e.span)}c>1&&a(`${t}=: one envelope (map=adsr) at most — the other factors scale it`,r.span),c&&!r.range&&a(`${t}=&env: an envelope runs 0 to 1 — give it a range: ${t}=200..3000 * &env`,r.span)}for(let e of t.values()){let r=e.params.legato,i=e.paramSpans.legato??e.span,s=e.frees?.find(e=>e.key===`param`&&e.param===`legato`),c=e=>a(`legato=${e}: a share of each note's held length is above 0 (.5 staccato, 1 as written, 1.5 into the next)`,i);typeof r==`string`?a(`legato=${r}: a share (.5), free(.5, .25..2.5) or a cell of shares (&artic)`,i):typeof r==`number`&&!(r>0)?c(String(r)):s&&!(s.lo>0)&&c(`free(${s.value}, ${s.lo}..${s.hi})`);let l=e.legato?.find(e=>!(e.share>0));l&&c(`${l.level}:${l.share}`),e.legato&&!n.get(e.name)?.meter&&o(`legato=${e.legato.map(e=>`${e.level}:${e.share}`).join(`,`)} gives the lines tapping a meter their share: &${e.name} is not a meter, so it does nothing`,i);let u=e.paramCells?.legato;u?.range&&!(u.range[0]>0)&&c(`${u.range[0]}..${u.range[1]}`);for(let e of u&&!u.range?u.factors:[]){let n=t.get(e.name),r=(n?.braid.kind===`list`?n.braid.tokens.flatMap(e=>hn(e.atom)).flatMap(e=>e.kind===`note`?[e.value+e.alter]:e.kind===`chord`?e.notes:[]):[]).find(e=>!(e>0));r!==void 0&&c(`&${e.name}: its ${r}`)}}for(let e of t.values())if(e.map?.kind===`adsr`){for(let[n,r]of Object.entries(e.paramCells??{}))if(!r.range&&gt.adsr.includes(n))for(let e of r.factors){let i=t.get(e.name),o=(i&&i.map?.kind!==`adsr`&&i.braid.kind===`list`?i.braid.tokens.flatMap(e=>hn(e.atom)).flatMap(e=>e.kind===`note`?[e.value+e.alter]:e.kind===`chord`?e.notes:[]):[]).find(e=>n===`sustain`?!(e>=0&&e<=1):!(e>=0));o!==void 0&&a(n===`sustain`?`sustain=&${e.name}: a sustain is a level, 0 to 1, and &${e.name} holds ${o}`:`${n}=&${e.name}: ${n===`attack`?`an`:`a`} ${n} is seconds, 0 or more, and &${e.name} holds ${o}`,r.span)}}for(let e of t.values())e.stride!==null&&e.step?.kind!==`driven`&&e.step?.kind!==`tap`&&o(`stride= only matters with step=&cell or a tap (step=1m)`,e.paramSpans?.stride??e.span);for(let e of t.values())e.oneshot&&n.get(e.name)&&!n.get(e.name).voice&&o(`oneshot=1 is a voice's: &${e.name} is no voice, so it does nothing (put it on the voice that plays its notes)`,e.span);for(let e of t.values()){let t=n.get(e.name)?.cycle??0;e.step?.kind!==`driven`||e.cycle===null||e.map||t<2||e.cycle<t||e.cycle%t!==0||o(`cycle=${e.cycle} on &${e.name} counts laps: ${e.cycle} of its ${t} steps. Written before v0.16, when it counted steps, it says cycle=${e.cycle/t} (Migrate rewrites it, decision 040)`,e.paramSpans.cycle??e.span)}for(let e of t.values())for(let[t,r]of[[`env`,e.env],[`pitch`,e.pitch]]){if(!r)continue;let e=n.get(r.name);e?t===`env`&&e.map?.kind!==`adsr`&&e.map?.kind!==`amp`&&e.map?.kind!==`lin`&&e.map?.kind!==`db`?a(`env= takes a volume: a cell with map=adsr (an envelope), map=amp, map=db or map=lin`,r.span):t===`pitch`&&(e.map?.kind===`adsr`||e.map?.kind===`amp`||e.map?.kind===`db`)&&a(`pitch= takes a pitch (a vibrato, map=lin to glide), not a volume`,r.span):s(r.name,r.span)}for(let e of t.values()){if(e.map?.kind!==`adsr`)continue;let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];(t.length!==4||t.some(e=>!(e>=0))||t[2]>1)&&a(`map=adsr takes four numbers: attack decay sustain release — seconds, and sustain a level 0…1 (map=adsr .01 .3 .5 .4)`,e.map.span)}for(let e of t.values()){if(e.map?.kind!==`style`)continue;let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];(t.length!==ft.length||t.some((e,t)=>!(e>=ft[t].range[0]&&e<=ft[t].range[1])))&&a(`map=style takes a value for each axis, in order: ${ft.map(e=>`${e.name} (${e.range[0]} to ${e.range[1]})`).join(`, `)} (map=style .3 .45 .55 .5, or sync=.3 harm=.45 bite=.55 mood=.5)`,e.map.span)}for(let e of t.values()){if(e.map?.kind!==`ratios`)continue;let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];e.over===null?(t.length<2||t.some((e,n)=>!(e>0)||n>0&&!(e>t[n-1])))&&a(`map=ratios lists one period's tones as rising ratios, the last the period: map=ratios 1 9/8 5/4 4/3 3/2 5/3 15/8 2`,e.map.span):a(`A grid (map=ratios) reads nothing: its braid is its tones`,e.map.span)}for(let e of t.values())if(e.map?.kind===`edo`){if(e.over!==null||e.braid.kind!==`blank`)a(`A grid (map=edo, map=ed(r)) reads nothing and has no braid: &${e.name} map=edo(19)`,e.map.span);else if(e.cycle!==null&&e.name!==`fifths12TET`){let t=e.map.period===2?`edo(${e.cycle})`:`ed(${e.cycle}, ${jl(e.map.period)})`,n=e.paramSpans.cycle??e.span;e.cycle===0?a(`A grid has at least one step: its size is its map's, map=edo(19)`,n):e.map.steps===null?o(`cycle= on a grid is the old way: its size is its map's, map=${t} (Migrate rewrites it)`,n):o(`cycle=${e.cycle} does nothing on a grid whose map says its size (map=${e.map.period===2?`edo`:`ed`}(${e.map.steps}…)): leave it out`,n)}}for(let a of t.values()){let t=a.over?n.get(a.over.name):void 0;if(!t||t.kit||i.has(t.name))continue;let s=Fc(t);if(!s.length||s.every(e=>r.get(e)===t.name)||e.broken.has(a.name))continue;let c=[...new Set(s)].map(e=>`&`+e).join(` `);o(`&${t.name} is read as a table, but its cells (${c}) aren't entries: a table is its numbers. To play cells one after another, splice them into a braid (&${a.name} ${c}); choosing a melody per step isn't built yet (#29)`,a.over.span)}for(let[e,i]of r)[...n.values()].some(t=>t.step?.driver===e||Object.values(t.paramClocks).some(t=>t.driver===e))||o(`&${e} is a section of &${i}, but nothing is stepped by it: step=&${e} on what it should play (or a name mistyped)`,t.get(e).span);for(let e of t.values()){let t=e.map?.kind===`table`?n.get(e.map.table.name):void 0;t&&(t.mix||t.sink||hi(t))&&o(`map=&${t.name}: a map reads a table's numbers, and &${t.name} is ${hi(t)?`a MIDI card`:t.sink?`the sound card`:`a mix`}, which has none: nothing is mapped`,e.map.span)}for(let e of n.values()){let n=e.map?.kind===`midi`?e.map.channel:null;if(n===null)continue;let r=t.get(e.name);(r?.braid.kind===`list`?r.braid.tokens:[]).forEach(e=>{e.repeat>1&&e.atom.kind!==`rest`&&o(`!${e.repeat} on a card with one channel (map=midi(${n})): each note goes out ${e.repeat.toLocaleString(`en`)} times on it, at once — leave out the !${e.repeat}`,e.span)})}for(let e of new Set(r.values()))if(![...t.values()].some(t=>t.over?.name===e)){let n=[...r].filter(([,t])=>t===e).map(([e])=>e),i=t.get(n[0])?.step,a=i?.kind===`driven`?i.driver.name:`bar`;o(`&${e} declares sections (${n.map(e=>`&`+e).join(` `)}), and nothing selects them: every part plays all the time. A selector reads the table and switches them, a step of the form at a time: &song over=&${e} step=&${a}/16 0 [0,1]`,t.get(e).span)}let u=Math.max(12,...[...n.values()].filter(e=>e.root).map(e=>e.cycle))*kl;for(let e of n.values()){let r=t.get(e.name);if(!r||e.implicit)continue;let i=r.braid.kind===`list`?r.braid.tokens:[];e.units.forEach((t,r)=>{let a=t.atom;if(a.kind!==`ref`||!a.values||Math.abs(a.values.add)<=u)return;let s=n.get(a.name);o(`degree(${s?.lambda?`&( … )`:`&`+a.name}, ${a.values.add}) moves it ${Math.abs(a.values.add).toLocaleString(`en`)} steps, over a hundred octaves: ${a.values.add>0?`its notes land above 20 kHz and are dropped`:`its notes fall below hearing`}, nothing plays`,i[r]?.span??e.span)});let a=Math.abs(e.shift)/Math.max(1,e.units.length);a>Al&&o(`shift=${e.shift} turns ${e.lambda?`an unnamed cell &( … )`:`&`+e.name} about ${Math.round(a).toLocaleString(`en`)} laps, and every lap climbs a lap of the grid: its notes leave hearing`,r.paramSpans?.shift??r.span)}}let kl=100,Al=20;function jl(e){if(Number.isInteger(e))return String(e);for(let t=2;t<=1e3;t++){let n=Math.round(e*t);if(Math.abs(n/t-e)<1e-6)return`${n}/${t}`}return String(e)}function Ml(e,t,n,r,{sinks:i,cards:a,bindings:o,soundHead:s}){let{parsed:c,error:l,warn:u,unknownCell:d}=e,f=new Set([...t.values()].flatMap(e=>e.gate?[e.gate.notes,e.gate.plays,...(e.gate.lines??[]).flatMap(e=>[e.line,e.plays])]:[])),p=[],m=[],h=[],g=e=>!!e.clock&&t.get(e.name)?.step?.whole===!1,_=e=>(r.get(e.clock)?.perSecond??0)*e.rate,v=e=>{let t=[...e].sort((e,t)=>_(t.c)-_(e.c)),[n,r]=[_(t[0].c),_(t[1].c)];return n-r>1e-9*Math.max(n,r)?t[0]:null};for(let{b:r,span:i,gains:a,via:c,parts:_,through:y,silent:b,midi:x}of o){let o=e=>t.has(e.name)?!0:(d(e.name,e.span),!1);if(![r.voice,...r.pitches.map(e=>e.ref)].every(o)||[r.voice,...r.pitches.map(e=>e.ref)].some(t=>e.broken.has(t.name)))continue;let S=e=>{n.get(e)?.paramCells.pan&&u(`&${e}'s pan= moves, but it is read at each note's start, and &${e} rings without notes here: it sits in the centre (write a number)`,t.get(e)?.paramSpans.pan??r.voice.span)};if(s(r.voice.name)&&r.pitches.length===0){S(r.voice.name),m.push({head:r.voice.name,tape:n.get(r.voice.name).params.play,gains:[a[0],a[1]],parts:_,through:[...y]});continue}let C=n.get(r.voice.name);if(!C)continue;if(typeof C.params.body==`string`&&r.pitches.length===0){S(C.name);let[e,t]=mi(C.params.pan);h.push({cell:C.name,gains:[a[0]*e,a[1]*t],parts:_.map(n=>({...n,gains:[n.gains[0]*e,n.gains[1]*t]})),through:[...y]});continue}let w=[...c,...y].flatMap(e=>{let t=n.get(e)?.gate;return t?t.lines?.map(e=>e.plays)??[t.plays]:[]}).find(e=>r.pitches.some(t=>t.ref.name===e)),T=C.kit?r.pitches.find(e=>t.get(e.ref.name)?.over?.name===C.name||e.ref.name===w):void 0;if(C.kit&&!T){l(`A kit is a table of voices: read the pattern through it, &drums over=&${C.name}, and mix &drums`,r.voice.span);continue}if(C.root){l(`&${C.name} is a grid, not a voice`,r.voice.span);continue}if(r.voice.pick||r.voice.shift){l(`Pick or shift the melody, not the voice: &theme[0] * &${C.name}`,r.voice.span);continue}if(t.get(C.name)?.step?.kind===`driven`||t.get(C.name)?.step?.kind===`tap`){l(`&${C.name} moves with step=&…, so it can't be a voice: a voice moves at a rate, its pitch (loop=C4)`,r.voice.span);continue}!C.params.s&&C.freq<20&&u(`&${C.name} loops at ${+C.freq.toFixed(2)} Hz, below hearing — is it a pitch? Then leave out its sound parameters: (&theme + &${C.name}) * &lead`,r.voice.span);let E=[...C.env?[{ref:t.get(C.name).env,sign:1,inSum:!1}]:[],...C.pitch?[{ref:t.get(C.name).pitch,sign:1,inSum:!0}]:[]],D=r.pitches.find(e=>e.ref.transpose||e.ref.degree);D?.ref.transpose?l(`&${D.ref.name}^$${D.ref.transpose}: transposing (^$) is for braids — in a mix, add pitch: &${D.ref.name} + ${D.ref.transpose}`,D.ref.span):D&&l(`&${D.ref.name}^${D.ref.degree}: moving by degrees (^) is for braids — in a mix, write a cell that plays it: &u step=&bar &${D.ref.name}^${D.ref.degree}`,D.ref.span);let O=/* @__PURE__ */ new Map,k=[...r.pitches,...E].map(e=>{let t=n.get(e.ref.name),r=t&&typeof t.params.play==`string`?n.get(t.params.play):void 0,i=r&&typeof r.params.write==`string`?n.get(r.params.write):void 0;return t&&r&&i&&(O.set(e,{head:t.name,tape:r.name,at:typeof t.params.at==`number`?t.params.at:0,length:typeof r.params.length==`number`?r.params.length:0,erase:typeof r.params.erase==`number`?Math.min(1,Math.max(0,r.params.erase)):1}),t=i),{t:e,c:t}}).filter(e=>e.c),A=k.filter(e=>e.c.voice);if(A.length){l(`Two sounds can't multiply (&${A[0].c.name} * &${C.name}): &${A[0].c.name} plays as a voice — mix them with + or ,`,A[0].t.ref.span);continue}let j=e=>e.c.map?.kind===`adsr`,M=e=>e.c.map?.kind===`amp`||e.c.map?.kind===`db`||e.c.map?.kind===`lin`&&!e.t.inSum,N=k.filter(j),ee=k.filter(e=>!M(e)&&!j(e)),P=k.filter(e=>M(e));if(N.length>1){l(`One envelope per note: &${N[0].c.name} and &${N[1].c.name} both shape &${C.name}`,N[1].t.ref.span);continue}let te=N.find(e=>e.t.inSum||e.t.sign<0);if(te){l(`&${te.c.name} is an envelope (map=adsr): a volume, it multiplies — keep it out of pitch sums`,te.t.ref.span);continue}let ne=N[0]?wi(N[0].c):null,re=P.find(e=>e.t.sign<0);if(re){l(`&${re.c.name} is a volume (map=amp): it multiplies, it can't be subtracted`,re.t.ref.span);continue}let F=ee.filter(e=>g(e.c)),I=F.length===0;I&&(F=P.filter(e=>g(e.c)));let[ie,ae]=C.kit?[1,1]:mi(C.params.pan),[L,oe]=[...y].reduce(([e,t],r)=>{let[i,a]=mi(n.get(r)?.params.pan);return[e*i,t*a]},[ie,ae]),se=e=>({cell:e.c.name,pick:e.t.ref.pick,shift:e.t.ref.shift,sign:e.t.sign,...e.t===T?{picks:!0}:{}}),ce={voice:C.name,kit:C.kit,offset:r.offset,gains:[a[0]*L,a[1]*oe],parts:_.map(e=>({...e,gains:[e.gains[0]*L,e.gains[1]*oe]})),select:[],...b?{silent:!0}:{},...x?.length?{midi:x}:{},through:[...y],envelope:ne,envelopeCell:N[0]?.c.name??null,via:[...c],span:i},le=new Set(E);if(F.length===0&&!C.kit&&ee.every(e=>le.has(e.t))){p.push({id:`${C.name}:${C.name}:${r.voice.span.line}:${r.voice.span.col}`,...ce,cell:C.name,pick:null,shift:0,sign:1,gate:!1,drone:!0,mods:ee.map(se),levels:P.map(se)});continue}if(F.length===0){l(k.length?`Nothing starts notes on &${C.name}: give a pitch or a volume (map=amp) step= timing (step=4n); loop= terms only bend`:`&${C.name} has nothing to play: a melody goes before it, like &melody * &${C.name}`,i);continue}if(F.length>1){let e=v(F);if(!e){l(`Both &${F[0].c.name} and &${F[1].c.name} would start notes on &${C.name}, at the same rate — make one coarser (it then holds under the other) or loop= (it then bends or shapes them)`,F[1].t.ref.span);continue}F=[e]}let{t:ue,c:de}=F[0],fe=k.find(e=>Si(e.c,e.t.ref.pick)===null);if(fe){l(Ci(fe.c.name,fe.t.ref.pick,fe.c.units.length),fe.t.ref.span);continue}if(Si(de,ue.ref.pick)===0){l(`&${de.name} has no steps to play`,ue.ref.span);continue}!O.has(ue)&&!f.has(de.name)&&Nl(n,de,ue.ref.pick)&&u(`&${de.name}${ue.ref.pick?Un(ue.ref.pick):``} plays only rests (~): nothing sounds on &${C.name}`,ue.ref.span),p.push({id:`${C.name}:${de.name}:${ue.ref.span.line}:${ue.ref.span.col}`,...ce,cell:de.name,pick:ue.ref.pick,shift:ue.ref.shift,sign:ue.sign,gate:I,mods:ee.filter(e=>e!==F[0]).map(se),levels:P.filter(e=>e!==F[0]).map(se),...O.has(ue)?{tape:O.get(ue)}:{}})}let y=e=>p.some(t=>t.voice===e&&(t.parts.length||t.silent)),b=p.find(e=>e.midi&&!e.parts.length&&!e.silent&&!e.kit&&!y(e.voice)&&Object.keys(t.get(e.voice)?.params??{}).some(e=>Yr.has(e)));if(b){let e=t.get(b.voice),n=Object.keys(e.params).filter(e=>Yr.has(e));u(`&${b.voice} is only on a MIDI card: its sound (${n.map(e=>`${e}=`).join(` `)}) is heard here but isn't sent — MIDI carries its notes, velocity and bends; the device makes its own`,e.paramSpans[n[0]]??e.span)}return i.length===0&&a.length===0&&c.cells.length>0&&!c.broken?.length&&u(`Nothing plays yet — write a sound: a voice alone plays its own pitch (&a loop=A4), a melody plays on one ([&melody * &a])`,Ps),{outputs:p,returns:m,resonances:h}}function Nl(e,t,n,r=[]){if(r.includes(t.name)||t.frees.some(e=>e.key===`braid`))return!1;let i=xi(t.units.length,n,t.shift);if(!i?.length)return!1;let a=n=>{if(n.kind===`rest`)return!0;if(n.kind===`seq`)return hn(n).every(a);let i=n.kind===`ref`?e.get(n.name):void 0;return!!i&&n.kind===`ref`&&Nl(e,i,n.pick,[...r,t.name])};return i.every(e=>a(t.units[e].atom))}function Pl(e){let t=new Map(e),n=/* @__PURE__ */ new Map;for(let e of t.values())(e.root||e.over)&&n.set(e.name,e.root?e.name:e.over);for(let e=!0,r=0;e&&r<64;r++){e=!1;for(let r of t.values()){let t=n.get(r.name);if(t)for(let i of r.children.keys())n.has(i)||(n.set(i,t),e=!0)}}for(let e of t.values())t.set(e.name,{...e,context:n.get(e.name)??`fifths12TET`});for(let e of t.values()){if(typeof e.params.body!=`string`)continue;let n=[];for(let r of e.units.flatMap(e=>hn(e.atom)))if(r.kind===`note`)n.push({shift:r.value+r.alter,params:{}});else if(r.kind===`ref`){let e=t.get(r.name);if(e)for(let t of e.units)t.atom.kind===`note`&&n.push({shift:t.atom.value+t.atom.alter,params:e.params})}else if(r.kind===`chord`)for(let[e,t]of r.notes.entries())n.push({shift:t+r.alters[e],params:{}});t.set(e.name,{...e,exciters:n.length?n:Array.from({length:12},(e,t)=>({shift:t,params:{}}))})}return t}let Fl=[`restart`,`resume`,`free`];function Il(e,{decls:t,implicit:n,sections:r},i,a,o,s=/* @__PURE__ */ new Map,c=/* @__PURE__ */ new Set){let{warn:l}=e,u=new Set([...i.values()].flatMap(e=>typeof e.params.fm==`string`?[e.params.fm]:[])),d=e=>{let t=/* @__PURE__ */ new Set;return e.voice&&t.add(`voice`),a.get(e.name)&&!a.get(e.name).belt&&t.add(`clock`),e.step&&t.add(`driven`),typeof e.params.motor==`number`&&t.add(`motor`),typeof e.params.write==`string`&&t.add(`tape`),typeof e.params.play==`string`&&t.add(`head`),typeof e.params.body==`string`&&t.add(`resonator`),typeof e.params.scope==`string`&&t.add(`scope`),typeof e.params.law==`string`&&t.add(`law`),e.gate&&t.add(`gate`),e.sink&&t.add(`card`),e.note&&t.add(`note`),typeof e.params.fm==`string`&&t.add(`carrier`),u.has(e.name)&&t.add(`modulator`),r.has(e.name)&&t.add(`section`),e.over&&([...r.values()].includes(e.over)||s.has(e.over))&&t.add(`selector`),[...s.values()].some(t=>t.includes(e.name))&&t.add(`performer`),t},f=new Set([...t.values()].flatMap(e=>e.swingFrom?[e.swingFrom.name]:[]));for(let r of t.values()){let t=i.get(r.name);if(!t||n.has(r.name))continue;let a=r.show?.split(`:`)[0];a&&!io.includes(a)&&!o.has(a)&&e.error(`show=${a}: not a show (${io.join(` `)}), not one of the built-in plugins (${[...o.values()].filter(e=>e.builtin).map(e=>e.name).join(` `)}), and the piece carries no plugin of that name (${jo})`,r.span);let s=d(t),u=[...Object.keys(r.params).map(e=>[e,r.paramSpans[e]??r.span]),...Object.entries(r.paramCells??{}).map(([e,t])=>[e,t.span]),...Object.entries(r.paramClocks??{}).map(([e,t])=>[e,t.span]),...[`env`,`pitch`,`title`].filter(e=>r[e]).map(e=>[e,e===`title`?r.span:r[e].span])];for(let[e,n]of u){let i=Gr[e];c.has(r.name)&&Yr.has(e)||(e===`anchor`&&s.has(`law`)?l(`anchor= sets the clock a law reads, not the law: write it on ${t.over?`&${t.over}`:`its day (over=&day, a clock loop=1d)`} — the law on &${r.name} doesn't read it`,n):e===`pan`&&(t.mix||t.sink||hi(t))?l(`pan= places a voice: on ${t.sink?`the sound card`:hi(t)?`a MIDI card`:`the mix &${r.name}`} it does nothing — put it on the voice (&voice pan=${r.params.pan})`,n):e===`pan`&&typeof r.params.pan==`number`&&(r.params.pan<0||r.params.pan>1)?l(`pan=${r.params.pan}: pan runs from 0 (left) to 1 (right); ${r.params.pan<0?`this plays hard left`:`this plays hard right`}`,n):i?.on&&!i.on.some(e=>s.has(e))&&!(e===`swing`&&f.has(r.name))?l(`${e}= acts on ${$r(i.on)}: on &${r.name} it does nothing`,n):e===`restart`&&!Fl.includes(r.params.restart)?l(`restart=${r.params.restart}: what switching a part on does to its time is restart, resume or free — this plays as restart`,n):i?.value===`number`&&!t.voice&&typeof r.params[e]==`string`&&l(`${e}= takes a number: '${r.params[e]}' does nothing`,n))}if(r.gate){let e=r.step?r.step.whole?`loop`:`step`:null;for(let[t,n]of[[`over`,r.over?.span],[e,r.step?.span],[`shift`,r.shift===null?void 0:r.paramSpans.shift],[`stride`,r.stride===null?void 0:r.paramSpans.stride],[`map`,r.map?.span],[`cycle`,r.cycle===null?void 0:r.span]])t&&n&&l(`${t}= on a gate does nothing: a gate plays with each note of play=&${r.gate.notes}, so it times and reads nothing itself — put it on &${r.gate.notes}`,n);r.gate.gain<0&&l(`${r.gate.port===`trigger`?`gain`:`level`}=${r.gate.gain}: a level is 0 or more, and a negative one doesn't play softer — write ${-r.gate.gain}`,r.paramSpans[r.gate.port===`trigger`?`gain`:`level`]??r.span)}}let p=new Set([...t.values()].flatMap(e=>e.show?[e.show.split(`:`)[0]]:[]));for(let e of o.values())!e.builtin&&!p.has(e.name)&&l(`the piece carries the plugin "${e.name}", but no cell says show=${e.name}`,{line:e.line,col:1,len:`=== plugin ${e.name} ===`.length})}let Ll=e=>Number.isFinite(e)?Math.round(e).toLocaleString(`en`):`unboundedly many`,Rl=e=>e.lambda?`An unnamed cell &( … )`:`&${e.name}`;function zl(e,t,n,r,i){let{error:a,warn:o}=e,s=/* @__PURE__ */ new Map,c=/* @__PURE__ */ new Set,l=e=>{let t=s.get(e);if(t)return t;if(c.has(e))return[];c.add(e);let r=(n.get(e)?.units??[]).map(e=>vn(e,e=>e.kind===`note`||e.kind===`choice`?1:e.kind===`chord`?e.notes.length:e.kind===`ref`?u(e.name,e.pick):0));return c.delete(e),s.set(e,r),r},u=(e,t=null)=>{let n=l(e);return(bi(n.length,t)??[]).reduce((e,t)=>e+n[t],0)},d=/* @__PURE__ */ new Set;for(let e of n.values()){if(e.implicit)continue;let n=l(e.name),r=n.reduce((e,t)=>e+t,0);if(r<=5e4||(d.add(e.name),e.units.some(e=>e.atom.kind===`ref`&&u(e.atom.name,e.atom.pick)>5e4)))continue;let i=t.get(e.name),o=i?.braid.kind===`list`?i.braid.tokens:[],s=0,c=o[n.findIndex(e=>(s+=e)>5e4)]?.span??e.span;a(`${Rl(e)} expands to ${Ll(r)} notes: more than ${Ll(ui)}, the most a cell can hold — repeat less (!n), or let a clock repeat it`,c)}let f=/* @__PURE__ */ new Set,p=/* @__PURE__ */ new Map;for(let e of i){let i=n.get(e.cell);if(!i?.clock||d.has(i.name)||f.has(i.name)||i.params.law!==void 0)continue;let o=r.get(i.clock);if(!o)continue;let s=Math.max(1,i.steps),c=o.perSecond*i.rate*u(i.name)/s,l=o.tap?.meter??i.clock;if(c>(p.get(l)??0)&&p.set(l,c),!(c>2e3))continue;f.add(i.name);let m=t.get(i.name)?.step?.span??t.get(i.clock)?.step?.span??i.span;a(`${Rl(i)} would start ${Ll(c)} notes a second: more than ${Ll(di)}, the most a cell can play — slow its step= or loop=`,m)}let m=/* @__PURE__ */ new Set;for(let e of n.values()){let t=r.get(e.name);t&&!p.has(e.name)&&e.frees.some(e=>e.key===`step`||e.key===`loop`)&&(p.set(e.name,t.perSecond*u(e.name)/Math.max(1,e.steps)),m.add(e.name))}for(let[e,t]of p){let r=n.get(e);if(!r||!(t>0)||!Number.isFinite(t))continue;let i=e=>Math.floor(e.value*di/t),a=r.frees.filter(e=>(e.key===`step`||e.key===`loop`)&&e.value>0&&e.hi>i(e)&&i(e)>=e.value);if(a.length){r.frees=r.frees.map(e=>a.includes(e)?{...e,hi:i(e)}:e);for(let t of a)o(m.has(e)?`${t.key}=free(…): moved up to ${Ll(t.hi)}, &${e} would move what it moves more than ${Ll(di)} times a second, the most a cell can play: the slider stops at ${Ll(i(t))}`:`${t.key}=free(…): moved up to ${Ll(t.hi)}, a cell &${e} clocks would start more than ${Ll(di)} notes a second, the most a cell can play: the slider stops at ${Ll(i(t))}`,t.span)}}}function Bl(e,t,n){if(!n.size)return[...e];let r=e=>[...t.values()].filter(t=>t.over===e&&t.clock);return e.map(e=>{let i=t.get(e.cell);for(let a=0;i?.step&&a<32;a++){let a=i.step.driver,o=n.get(a);if(o){let n=t.get(o).units.findIndex(e=>e.atom.kind===`ref`&&e.atom.name===a),i=r(o).map(e=>({cell:e.name,entry:n,part:a})),s=[.../* @__PURE__ */ new Set([...e.via,...i.map(e=>e.cell),o,a])];return i.length?{...e,via:s,select:[...e.select,...i]}:e}i=t.get(a)}return e})}function Vl(e){let t=new Map(e.cells.map(e=>[e.name,e.map?.kind??(e.style?`style`:null)]));t.has(`style`)||t.set(_t,`style`);let n=[],r=(e,r)=>{let{slot:i,...a}=e,o=a.name,s=a.span??r.span;if(!t.has(o))return{...a,pick:null};let c=t.get(o),l=c?gt[c]:void 0,u=l?.indexOf(i)??-1;return u>=0?{...a,pick:{kind:`at`,i:u,abs:!0}}:(n.push({severity:`error`,message:c===`style`&&(i===`artic`||i===`energy`)?`&${o}[${i}]: ${i} is retired: a style's axes are ${l.join(`, `)}, bite its articulation and energy off the point (decision 076); Migrate rewrites it as &${o}[bite]`:l?`&${o}[${i}]: &${o} (map=${c}) has no slot ${i}; its slots are ${l.join(`, `)}`:`&${o}[${i}]: &${o}'s map names no slots (${c?`map=${c}`:`it has no map=`}); pick by position (&${o}[$0]), name the slots with map=${Object.keys(gt).join(` or map=`)}, or give it a style= (its axes)`,span:s}),{...a,pick:null})},i=(e,t)=>{if(Array.isArray(e)){let n=!1,r=e.map(e=>{let r=i(e,t);return r!==e&&(n=!0),r});return n?r:e}if(typeof e!=`object`||!e)return e;let n=e,a=null;for(let[e,r]of Object.entries(n)){let o=i(r,t);o!==r&&((a??={...n})[e]=o)}let o=a??n;return typeof o.slot==`string`&&typeof o.name==`string`?r(o,t):o},a=!1,o=e.cells.map(e=>{let t=i(e,e);return t!==e&&(a=!0),t});return a?{...e,cells:o,diagnostics:[...e.diagnostics,...n]}:e}function Hl(e){let t=new Set(e.cells.map(e=>e.name)),n=/* @__PURE__ */ new Map,r=[];for(let i of e.cells){let e=i.params.play??i.params.trigger;if(typeof e!=`string`||i.braid.kind===`blank`||t.has(e)||n.has(e))continue;let a=Z(`&${e} step=1m ~`).cells[0];if(!a)continue;let o=i.paramSpans.play??i.paramSpans.trigger??i.span;n.set(e,{...a,span:o}),r.push({severity:`info`,message:`&${i.name} plays &${e}, which no line writes: it rests`,span:o})}return n.size?{parsed:{...e,cells:[...e.cells,...n.values()],diagnostics:[...e.diagnostics,...r]},rested:new Map([...n].map(([e,t])=>[e,t.span]))}:{parsed:e,rested:/* @__PURE__ */ new Map}}function Ul(e,t,n,r,i,a=/* @__PURE__ */ new Set){if(![...t.values()].some(e=>e.gate))return;let o=/* @__PURE__ */ new Set,s=(e,t)=>{if(typeof e==`string`){o.add(e);return}if(e&&typeof e==`object`&&!t.has(e)){if(t.add(e),e instanceof Map)for(let[n,r]of e)s(n,t),s(r,t);else if(e instanceof Set)for(let n of e)s(n,t);else for(let n of Object.values(e))s(n,t)}};for(let e of n.values()){let{name:t,...n}=e;s(n,/* @__PURE__ */ new Set)}s(r,/* @__PURE__ */ new Set);for(let e of t.values())e.gate&&s(e.gate,/* @__PURE__ */ new Set);for(let t of n.values())t.clock&&t.units.length&&!o.has(t.name)&&!i.has(t.name)&&!e.broken.has(t.name)&&!a.has(t.name)&&e.info(`&${t.name} is written and nothing plays or reads it: it is silent (a part no performer plays)`,t.span)}let Wl=[`lpf`,`lpq`,`hpf`,`hpq`,`bpf`,`bpq`,`ftype`,`room`,`delay`,`delaytime`,`delayfeedback`],Gl=[...Wl,`pan`,`distort`,`crush`,`drive`],Kl=(e,t)=>new Set(e.flatMap(e=>e.through).filter(e=>!!t.get(e)?.mix));function ql(e){let t=/* @__PURE__ */ new Map;for(let n of Object.keys(e.params))Yr.has(n)&&t.set(n,e.paramSpans[n]??e.span);for(let[n,r]of Object.entries(e.paramCells??{}))Yr.has(n)&&t.set(n,r.span);for(let[n,r]of Object.entries(e.paramClocks??{}))Yr.has(n)&&t.set(n,r.span);return t}let Jl=(e,t)=>t in e.params||t in e.paramCells||t in e.paramClocks;function Yl(e,t,n,r,i){let{error:a}=e,o=Kl(r,n),s=/* @__PURE__ */ new Map;for(let e of o){let n=t.get(e);if(!n)continue;let r=ql(n);for(let[t,n]of r)Gl.includes(t)||a(`${t}= is a voice's: an instrument (&${e}) processes what its voices play, with ${Wl.slice(0,4).map(e=>`${e}=`).join(` `)} …; put ${t}= on a voice`,n);let i=[...r.keys()].filter(e=>Wl.includes(e));i.length&&s.set(e,i)}if(!s.size)return n;let c=e=>{let r=n.get(e),i=t.get(e)?.over?.name,a=r?.kit?r:i&&n.get(i)?.kit?n.get(i):null;return a?Fc(a):[e]},l=/* @__PURE__ */ new Map;for(let[e,t]of i)for(let r of t)for(let t of c(e)){let e=n.get(t);if(!e)continue;let i=/* @__PURE__ */ new Map;for(let t of[...r].reverse())for(let n of s.get(t)??[])!Jl(e,n)&&!i.has(n)&&i.set(n,t);l.has(t)||l.set(t,[]),l.get(t).push(i)}let u=(e,t)=>e.size===t.size&&[...e].every(([e,n])=>t.get(e)===n),d=new Map(n);for(let[e,t]of l){let r=t[0];if(!r.size||!t.every(e=>u(e,r)))continue;let i=n.get(e),a={...i.params},o={...i.paramCells},s={...i.paramClocks};for(let[e,t]of r){let r=n.get(t);e in r.params&&(a[e]=r.params[e]),e in r.paramCells&&(o[e]=r.paramCells[e]),e in r.paramClocks&&(s[e]=r.paramClocks[e])}d.set(e,{...i,params:a,paramCells:o,paramClocks:s,voice:!0,inherited:Object.fromEntries(r)})}return d}let Xl=e=>new Map([...Lo,...e.plugins??[]].map(e=>[e.name,e]));function Zl(e,t,n=/* @__PURE__ */ new Set){let{parsed:r,rested:i}=Hl(Vl(e)),a=Os(r,t);for(let[e,t]of i)a.unknown.set(e,[t]);let o=Pc(a,Bs(a),n),{decls:s,builtin:c}=o,l=Dc(a,s),u=Ec(a,s),d=gc(a,s),f=bl(a,s,ml(a,o,l,u),l),p=Dl(a,s,f.cells),{clocks:m}=p;Ol(a,s,p.cells,o.sections,d),vc(a,s,p.cells,d);let h=Ml(a,s,p.cells,m,f),{returns:g,resonances:_}=h,v=_c(Bl(h.outputs,p.cells,o.sections),p.cells,d);zl(a,s,p.cells,m,v),Ul(a,s,p.cells,v,m,new Set(r.offers??[]));let y=Pl(Yl(a,s,p.cells,v,f.playings));Il(a,o,y,m,Xl(r),d,Kl(v,y));let b=mc(a,s,o.implicit),{diagnostics:x}=a,S=!x.some(e=>e.severity===`error`);x.sort((e,t)=>e.span.line-t.span.line||e.span.col-t.span.col);let C=(e,t)=>e.line-t.line||e.col-t.col,w=[...a.unknown].map(([e,t])=>({name:e,at:[...t].sort(C)})).sort((e,t)=>C(e.at[0],t.at[0])),T=new Set([...y.values()].filter(e=>e.off).map(e=>`cell:${e.name}`)),E=(e,t,n)=>typeof e.params[t]==`number`?e.params[t]:n;return{ok:S,cells:y,clocks:m,outputs:v,off:T,diagnostics:x,unknown:w,tapes:[...y.values()].filter(e=>typeof e.params.write==`string`&&!!y.get(e.params.write)?.mix).map(e=>({name:e.name,source:e.params.write,length:E(e,`length`,0),erase:Math.min(1,Math.max(0,E(e,`erase`,1))),tone:E(e,`tone`,7e3),drive:E(e,`drive`,.15),hiss:E(e,`hiss`,0),print:E(e,`print`,0),printgap:E(e,`printgap`,.6),dropout:E(e,`dropout`,0),heads:[...y.values()].filter(t=>t.params.play===e.name).map(e=>({head:e.name,at:E(e,`at`,0),wander:E(e,`wander`,0),wanderhz:E(e,`wanderhz`,.2)}))})),returns:g,resonances:_,plugins:Xl(r),performers:b,sections:o.sections,...p.mainMeter?{mainMeter:p.mainMeter}:{},...o.mainKey?{mainKey:o.mainKey}:{},...c?{builtinCard:c}:{}}}function Ql(e,t,n){let r=e.cells.get(t);return r?r.root?r.cycle:r.scan?r.scan.lap:e.cells.get(r.over??n??r.context)?.cycle??12:12}function $l(e,t,n,r){return eu(e.cells.get(t).units,n,()=>Ql(e,t,r))}function eu(e,t,n){let r=e.length;if(r===0||t===0)return[...e];let i=n(),a=Math.floor(t/r),o=t-a*r;return Array.from({length:r},(t,n)=>{let s=e[(n+o)%r],c=i*(a+ +(n+o>=r));if(c===0)return s;let l=_n(s.atom,e=>e.kind===`note`?{...e,value:e.value+c}:e.kind===`choice`?{...e,values:e.values.map(e=>e+c)}:e.kind===`chord`?{...e,notes:e.notes.map(e=>e+c)}:e);return l===s.atom?s:{...s,atom:l}})}let tu=/* @__PURE__ */ new WeakMap;function nu(e,t){let n=e.cells.get(t);if(!n.units.some(e=>e.atom.kind===`seq`))return n.units;let r=tu.get(e);r||tu.set(e,r=/* @__PURE__ */ new Map);let i=r.get(t);return i||r.set(t,i=n.units.flatMap(e=>e.atom.kind===`seq`?hn(e.atom).map(e=>({atom:e,repeat:1,subdivide:1,elongate:1})):[e])),i}let ru=(e,t)=>{let n=nu(e,t);return n.length>0&&n.every(e=>e.atom.kind===`chord`)},iu=/* @__PURE__ */ new WeakMap;function au(e,t,n,r=!1){let i=iu.get(e);i||iu.set(e,i=/* @__PURE__ */ new Map);let a=r&&ru(e,t),o=`${t}|${n}${a?`|in force`:``}`,s=i.get(o);if(s)return s;let c=[],l=eu(nu(e,t),n,()=>Ql(e,t));for(let e of(a?l.slice(0,1):l).flatMap(e=>hn(e.atom)))e.kind===`note`?c.push({value:e.value,alter:e.alter}):e.kind===`chord`&&e.notes.forEach((t,n)=>c.push({value:t,alter:e.alters[n]}));return i.size>=256&&i.delete(i.keys().next().value),i.set(o,c),c}function ou(e,t,n,r,i=0){let a=e.cells.get(t);if(a.root)return{value:n+r(t)+i,alter:0};let o=au(e,t,r(t)+i,!0);if(o.length===0)return{value:0,alter:0};if(a.wrap===0)return o[0];let s=Math.floor(n),c=Math.floor(s/o.length),l=a.wrap===null||a.step?.tap?c:dr(c,a.wrap),u=o[s-c*o.length];return{value:u.value+l*Ql(e,t),alter:u.alter}}function su(e,t,n,r,i,a){let o=[],s=t,c=n,l=r,u=i;for(let t=0;t<64;t++){let t=e.cells.get(s);if(!t)return{root:s,position:l,path:o};if(t.root){let e=l+u+a(s)+c;return o.push({cell:s,index:Math.round(e)}),{root:s,position:e,path:o}}o.push({cell:s,index:Math.floor(l+c)});let n=ou(e,s,l,a,c);l=n.value+u,u=n.alter,c=t.over?t.overShift:0,s=t.over??t.context}return{root:s,position:l,path:o}}function cu(e,t,n){let r=e.cells.get(t);if(r?.map?.kind===`ratios`){let e=r.map.ratios,t=e.length-1,i=e[t]/e[0],a=Math.floor(n/t),o=n-a*t,s=Math.floor(o),c=o-s,l=(e[s]/e[0])**(1-c)*(e[s+1]/e[0])**+c;return 12*Math.log2(i**+a*l)}let i=r?.map?.kind===`edo`?r.map.period:2;return n*12*Math.log2(i)/(r?.cycle??12)}function lu(e,t,n){let r=e.cells.get(t),i=2**(n/12);if(r?.map?.kind===`ratios`){let e=r.map.ratios,t=e.map(t=>t/e[0]),n=t.length-1,a=Math.floor(Math.log(i)/Math.log(t[n])+1e-9),o=i/t[n]**+a,s=0;for(;s<n-1&&t[s+1]<=o+1e-12;)s++;let c=Math.log(o/t[s])/Math.log(t[s+1]/t[s]);return a*n+s+c}let a=r?.map?.kind===`edo`?r.map.period:2;return n*(r?.cycle??12)/(12*Math.log2(a))}function uu(e,t){let n=[],r=t;for(let t=0;r!==null&&t<64;t++){n.push(r);let t=e.cells.get(r);r=!t||t.root?null:t.over??t.context}return n}let du=(e,t,n)=>!!n&&!n.abs&&fu(e,t,n),fu=(e,t,n)=>!!n&&e.cells.get(t).units.every(e=>e.atom.kind===`note`&&e.repeat===1&&e.subdivide===1&&e.chance===void 0);function pu(e,t){let n=t;for(let t=0;t<64;t++){let t=e.cells.get(n);if(!t||t.root)return n;n=t.over??t.context}return n}let mu=.15,hu=(e,t)=>{let n=null;for(let r of e)r.t<=t&&(n=r);return n&&n.speed!==null&&t<=n.t+.35?n.speed:null},gu=/* @__PURE__ */ new WeakMap,_u=(e,t)=>{let n=gu.get(e);return n||gu.set(e,n=/* @__PURE__ */ new Set),n.add(t),t},vu=[],yu=e=>vu.push(e),$=.002,bu=3600,xu=/* @__PURE__ */ new WeakMap;function Su(e,t){let n=xu.get(e);return n||xu.set(e,n=/* @__PURE__ */ new Map),n.has(t)||n.set(t,Cu(e,t)),n.get(t)}function Cu(e,t){let n=e.cells.get(t),r=(e,t)=>typeof n?.params[e]==`number`?n.params[e]:t;if(!n||typeof n.params.motor!=`number`)return null;let i=Math.max(1e-6,r(`motor`,1)),a=Math.max(1e-6,r(`mass`,1)),o=Math.max(0,r(`friction`,0));for(let n of e.cells.values())n.name!==t&&n.step?.driver===t&&(typeof n.params.mass==`number`&&(a+=n.params.mass),typeof n.params.friction==`number`&&(o+=n.params.friction));let s=r(`wind`,1/0),c=r(`wow`,0),l=[0],u=[0],d=0,f=!1,p=[],m=e=>{for(;!f&&(l.length-1)*$<Math.min(e,bu);){let e=(l.length-1)*$,t=Number.isFinite(s)?Math.max(0,1-(e/s)**4):1,n=1+c*Math.sin(2*Math.PI*.55*e),r=hu(p,e);d+=(i*(n-d)*t-o*d)/a*$,r!==null&&(d+=(r-d)*mu),Number.isFinite(d)||(d=0),d<0&&r===null&&(d=0),l.push(l[l.length-1]+d*$),u.push(d),t===0&&r===null&&d<.02&&(f=!0)}},h=e=>{let t=Math.max(1,Math.floor(e/$));t>=l.length||(l.length=t+1,u.length=t+1,d=u[t],f=!1)},g=()=>({t:(l.length-1)*$,s:l[l.length-1]});return _u(e,{grab(e,t){h(e),p.push({t:e,speed:t})},cut:h,speed(e){let t=.01;return Math.max(0,(this.nominal(e+t)-this.nominal(Math.max(0,e-t)))/(e+t-Math.max(0,e-t)))},stopsAt(){return Number.isFinite(s)?(m(bu),f?(l.length-1)*$:null):null},nominal(e){if(e<=0)return 0;m(e+$);let t=e/$;if(t>=l.length-1){let t=g();return f?t.s:t.s+(e-t.t)*d}let n=Math.floor(t);return l[n]+(l[n+1]-l[n])*(t-n)},real(e){if(e<=0)return 0;let t=(l.length-1)*$+60;for(;!f&&l[l.length-1]<e&&(l.length-1)*$<Math.min(bu,t);)m((l.length-1)*$+10);if(l[l.length-1]<e){if(f||d<=1e-9)return 1/0;let t=g();return t.t+(e-t.s)/d}let n=0,r=l.length-1;for(;r-n>1;){let t=n+r>>1;l[t]<e?n=t:r=t}let i=l[r]-l[n];return(n+(i>0?(e-l[n])/i:0))*$}})}function wu(e,t,n,r,i,a){let o=[0],s=[{y:0,v:0,off:0,px:0,stretch:0,slipping:!1}],c=0,l=!1,u=[],d=e=>{for(;!l&&(o.length-1)*$<Math.min(e,bu);){let e=(o.length-1)*$,d=s[s.length-1],{y:f,v:p,off:m}=d,h=a(e+$),g=(h-d.px)/$,_=h-m-f,v=!1;if(t*Math.abs(_)>i){let e=Math.sign(_)*i/t;m+=_-e,_=e,v=!0}let y=hu(u,e);p+=(t*_+r*(g-p))/n*$,y!==null&&(p+=(y-p)*mu),Number.isFinite(p)||(p=0),f+=p*$,o.push(Math.max(o[o.length-1],f)),s.push({y:f,v:p,off:m,px:h,stretch:_,slipping:v}),c=Math.abs(g)<1e-6&&Math.abs(p)<1e-4&&Math.abs(_)<1e-4&&y===null?c+$:0,c>.5&&(l=!0)}},f=e=>{let t=Math.max(1,Math.floor(e/$));t>=o.length||(o.length=t+1,s.length=t+1,c=0,l=!1)},p=e=>{if(e<=0)return 0;d(e+$);let t=Math.min(e/$,o.length-1),n=Math.floor(t);return n>=o.length-1?o[o.length-1]:o[n]+(o[n+1]-o[n])*(t-n)},m={nominal:p,real(e){if(e<=0)return 0;let t=(o.length-1)*$+60;for(;!l&&o[o.length-1]<e&&(o.length-1)*$<Math.min(bu,t);)d((o.length-1)*$+10);if(o[o.length-1]<e)return 1/0;let n=0,r=o.length-1;for(;r-n>1;){let t=n+r>>1;o[t]<e?n=t:r=t}let i=o[r]-o[n];return(n+(i>0?(e-o[n])/i:0))*$},stopsAt:()=>null,speed(e){let t=.01;return Math.max(0,(p(e+t)-p(Math.max(0,e-t)))/(e+t-Math.max(0,e-t)))},grab(e,t){f(e),u.push({t:e,speed:t})},cut:f,state(e){if(e<=0)return{stretch:0,slipping:!1};d(e+$);let t=Math.min(Math.floor(e/$),s.length-1),n=!1;for(let e=Math.max(0,t-50);e<=t;e++)s[e].slipping&&(n=!0);return{stretch:s[t].stretch,slipping:n}}};return e?_u(e,m):m}let Tu=1e-9;function Eu(e,t,n){if(t.tap)return ku(t.tap,Ou(e,e.clocks.get(t.tap.meter),n),Au(e,t.tap.meter));let r=Ou(e,t,n);return t.swung?Du(t.swung,r):r}function Du(e,t,n){let r=Math.max(1,e.length),i=(t,i)=>t<r?(n?n(i):e)[t]:r,a=e=>{let t=Math.floor(e),n=Math.floor(t/r),a=t-n*r;return n*r+i(a,n)+(e-t)*(i(a+1,n)-i(a,n))},o=e=>{let t=Math.floor(e/r),n=e-t*r,a=0;for(;a+1<r&&i(a+1,t)<=n;)a++;let o=i(a+1,t)-i(a,t);return t*r+a+(o>0?(n-i(a,t))/o:0)};return{beats:t.beats,q:e=>t.q(a(e)),stepAt:e=>o(t.stepAt(e)),...t.speed?{speed:t.speed}:{}}}function Ou(e,t,n,r){if(!t.positional&&t.swing!==void 0){let e=Math.min(.95,Math.max(.05,t.swing)),n=t.perSecond;return{beats:1,q:t=>{let r=Math.floor(t/2),i=t/2-r;return(2*r+2*(i<.5?i/.5*e:e+(i-.5)/.5*(1-e)))/n},stepAt:t=>{let r=t*n/2,i=Math.floor(r),a=r-i;return 2*(i+(a<e?a/e*.5:.5+(a-e)/(1-e)*.5))}}}if(!t.positional)return{beats:1,q:e=>e/t.perSecond,stepAt:e=>e*t.perSecond};let i=t.cell,a=e.cells.get(i)?.bend,o=a?[...a.positions]:$l(e,i,n(i)).flatMap(e=>e.atom.kind===`note`?[e.atom.value+e.atom.alter]:[]),s=Math.max(1,o.length),c=a?a.lap:Ql(e,i),l=s/t.perSecond;if(a&&r){let e=e=>{let t=Math.floor(e/s),n=r(t,t*l);return t+n.positions[e-t*s]/n.lap},t=t=>{let n=Math.floor(t),r=e(n);return(r+(t-n)*(e(n+1)-r))*l};return{beats:s,q:t,stepAt:e=>{let n=Math.floor(e/l)*s;for(;t(n+1)<=e;)n++;for(;n>0&&t(n)>e;)n--;let r=t(n),i=t(n+1);return n+(i>r?(e-r)/(i-r):0)}}}let u=e=>o[dr(e,s)]+c*Math.floor(e/s),d=e=>{let t=Math.floor(e),n=u(t);return(n+(e-t)*(u(t+1)-n))/c*l},f=d(0),p=e=>d(e)-f;return{beats:s,q:p,stepAt:e=>{let t=Math.floor(e/l)*s;for(;p(t+1)<=e;)t++;for(;t>0&&p(t)>e;)t--;let n=p(t),r=p(t+1);return t+(r>n?(e-n)/(r-n):0)}}}function ku(e,t,n=null){let r=n?Ru(e,t,n):null;if(r)return r;let{positions:i,lap:a}=e,o=Math.max(1,i.length);if(i.every((e,t)=>Math.abs(e-t*a/o)<1e-9))return{beats:o,q:e=>t.q(e*a/o),stepAt:e=>t.stepAt(e)*o/a,...t.speed?{speed:t.speed}:{}};let s=e=>e<o?i[e]:a,c=e=>{let t=Math.floor(e),n=Math.floor(t/o),r=t-n*o;return n*a+s(r)+(e-t)*(s(r+1)-s(r))};return{beats:o,q:e=>t.q(c(e)),stepAt:e=>{let n=t.stepAt(e),r=Math.floor(n/a),i=n-r*a,c=0;for(;c+1<o&&s(c+1)<=i;)c++;let l=s(c+1)-s(c);return r*o+c+(l>0?(i-s(c))/l:0)},...t.speed?{speed:t.speed}:{}}}function Au(e,t,n){let r=e.cells.get(t)?.meter??void 0,i=r?Bi(r):null;if(!r||!i)return null;let a=Ei(r),o=Math.max(1,r.levels.length),s=e=>n?n(Math.floor(e/o+1e-9)):r,c=e=>Vi(s(e),e/a)*a,l=e=>Hi(s(e),e/a)*a,u=Math.min(...r.swing.map(e=>e.whole*r.unit)),d=e=>{let t=Math.log2(e/a/u);return Math.abs(t-Math.round(t))<1e-9};return{S:c,W:l,at:(e,t)=>d(t)?c(e):zi(s(e),e/a,t/a)*a,grain:u*a}}function ju(e,t,{S:n,at:r},i){let{positions:a,lap:o}=e,s=e.written??a,c=e.grids??[],l=Math.max(1,a.length),u=e=>e<l?s[e]:o,d=(e,t)=>t<l?i(e*o+u(t),c[t]??0)-e*o:o,f=(e,t)=>{let i=Math.floor(e),a=Math.floor(i/l),s=i-a*l;if(e===i)return a*o+d(a,s);let c=a*o+u(s)+(e-i)*(u(s+1)-u(s));return t!==void 0&&t>0?r(c,t*(u(s+1)-u(s))):n(c)};return{beats:l,q:(e,n)=>t.q(f(e,n)),stepAt:e=>{let r=t.stepAt(e),i=Math.floor(r/o),a=r-i*o,s=0;for(;s+1<l&&d(i,s+1)<=a;)s++;let c=i*o+u(s),f=i*o+u(s+1);if(f<=c||a<=d(i,s))return i*l+s;let p=0,m=1;for(let e=0;e<52;e++){let e=(p+m)/2;n(c+e*(f-c))-i*o<=a?p=e:m=e}return i*l+s+p},...t.speed?{speed:t.speed}:{}}}let Mu=/* @__PURE__ */ new WeakMap,Nu=/* @__PURE__ */ new WeakMap,Pu=/* @__PURE__ */ new WeakMap,Fu=/* @__PURE__ */ new WeakMap,Iu=!1;function Lu(e,t,n){let r=Mu.get(e);r||Mu.set(e,r=/* @__PURE__ */ new WeakMap),r.set(t,n),Wu.get(e)?.delete(t),Nu.get(e)?.delete(t),Pu.get(e)?.delete(t)}function Ru(e,t,{S:n,at:r}){let{positions:i,lap:a}=e,o=e.written??i,s=Math.max(1,i.length);if(!i.every((e,t)=>Math.abs(n(o[t])-e)<1e-9))return null;let c=e=>e<s?o[e]:a,l=e=>e<s?i[e]:a,u=(e,t)=>{let i=Math.floor(e),o=Math.floor(i/s),u=i-o*s;if(e===i)return o*a+l(u);let d=c(u)+(e-i)*(c(u+1)-c(u));return o*a+(t!==void 0&&t>0?r(d,t*(c(u+1)-c(u))):n(d))};return{beats:s,q:(e,n)=>t.q(u(e,n)),stepAt:e=>{let r=t.stepAt(e),i=Math.floor(r/a),o=r-i*a,u=0;for(;u+1<s&&l(u+1)<=o;)u++;let d=c(u),f=c(u+1);if(f<=d||o<=l(u))return i*s+u;let p=0,m=1;for(let e=0;e<52;e++){let e=(p+m)/2;n(d+e*(f-d))<=o?p=e:m=e}return i*s+u+p},...t.speed?{speed:t.speed}:{}}}function zu(e){let t=Bu.get(e);if(t)return t;Bu.set(e,t=/* @__PURE__ */ new Set);let n=r=>{if(t.has(r))return;t.add(r);let i=e.cells.get(r);for(let t of i?.children.keys()??[]){let r=i.units.flatMap(e=>e.atom.kind===`ref`&&e.atom.name===t?[e.atom]:[]);(!r.length||!r.every(n=>fu(e,t,n.pick)))&&n(t)}};for(let t of e.outputs)for(let e of[...t.drone?[]:[t],...t.mods,...t.levels])n(e.cell);return t}let Bu=/* @__PURE__ */ new WeakMap,Vu=/* @__PURE__ */ new WeakMap;function Hu(e){let t=Vu.get(e);if(t)return t;Vu.set(e,t=/* @__PURE__ */ new Set);for(let n of e.cells.values()){n.root&&t.add(n.name),n.over&&t.add(n.over),n.root||t.add(n.context);for(let r of n.units)r.atom.kind===`ref`&&du(e,r.atom.name,r.atom.pick)&&t.add(r.atom.name)}return t}let Uu=/* @__PURE__ */ new WeakMap,Wu=/* @__PURE__ */ new WeakMap;yu(e=>{Uu.delete(e),Wu.delete(e),Nu.delete(e)});function Gu(e,t){let n=e.cells.get(e.clocks.get(t)?.cell??``)?.params.varispeed;return typeof n==`number`?n:0}function Ku(e,t,n=0){let r=Wu.get(e);r||Wu.set(e,r=/* @__PURE__ */ new WeakMap);let i=r.get(t)??/* @__PURE__ */ new Map;r.set(t,i);let a=Mu.get(e)?.get(t),o=(n,r)=>{let i=e.cells.get(n)?.bend,o=i?.depth;if(!i||!o||!a)return;let s=Pu.get(e);s||Pu.set(e,s=/* @__PURE__ */ new WeakMap);let c=s.get(t);c||s.set(t,c=/* @__PURE__ */ new Map);let l=c.get(n);l||c.set(n,l=/* @__PURE__ */ new Map);let u=l,d={positions:[...i.positions],lap:i.lap},f=/* @__PURE__ */ new Map;return(e,t)=>{let s=u.get(e);if(s)return s;if(e<0||Iu)return d;Iu=!0;let c;try{c=a(n,`depth`,r(t))}finally{Iu=!1}let l=Number.isFinite(c)?Math.round(c*1e9)/1e9:null,p=l===null?d:f.get(l);return p||f.set(l,p=ji(o.table,o.per,o.nodes,i.bars,l)),u.set(e,p),p}},s=n=>{let r=e.cells.get(n),i=r?.swingMoves,o=r?.meter;if(!i||!o?.swing||!a)return;let s=Nu.get(e);s||Nu.set(e,s=/* @__PURE__ */ new WeakMap);let c=s.get(t);c||s.set(t,c=/* @__PURE__ */ new Map);let u=c.get(n);u||c.set(n,u=/* @__PURE__ */ new Map);let d=u,f=Fu.get(o);f||Fu.set(o,f=/* @__PURE__ */ new Map);let p=f,m=Math.max(1,o.levels.length);return e=>{let t=d.get(e);if(t)return t;if(e<0||Iu)return o;let r=l(n).q(e*m);Iu=!0;let s;try{s=a(n,`swing`,r)}finally{Iu=!1}let c=Number.isFinite(s)?Math.min(.95,Math.max(.05,Math.round(s*1e9)/1e9)):null,u=c===null?o:p.get(c);return u||p.set(c,u={...o,swing:o.swing.map(e=>e.level===i.level?{...e,share:c}:e)}),d.set(e,u),u}},c=t=>{let n=i.get(t);if(!n){let r=e.clocks.get(t),a=s(r.tap?.meter??t);if(r.tap&&a){let t=e.cells.get(r.tap.meter).meter,i=Ei(t),o=Math.max(1,t.levels.length),s=(e,t)=>zi(a(Math.floor(e/o+1e-9)),e/i,t)*i,c=Au(e,r.tap.meter,a);n=c?ju(r.tap,l(r.tap.meter),c,s):ku(r.tap,l(r.tap.meter),null)}else if(r.tap)n=ku(r.tap,l(r.tap.meter),Au(e,r.tap.meter));else if(a){let r=e.cells.get(t).meter.levels.map((e,t)=>t);n=Du(r,l(t),e=>Gi(a(e))??r)}else n=r.swung?Du(r.swung,l(t)):l(t);i.set(t,n)}return n},l=n=>{let r=i.get(`${n}\0plain`);if(!r){let a=e.clocks.get(n);if(a.belt){let i=Eu(e,e.clocks.get(a.belt.driver),t),o=c(a.belt.driver),s=e.cells.get(a.cell),l=(e,t)=>typeof s.params[e]==`number`?s.params[e]:t,u=Math.max(.001,l(`belt`,200)),d=Math.max(.001,l(`mass`,1)),f=l(`damping`,.6*Math.sqrt(u*d)),p=Uu.get(e);p||Uu.set(e,p=/* @__PURE__ */ new Map);let m=p.get(n);m||p.set(n,m=wu(e,u,d,f,l(`slip`,1/0),e=>i.q(o.stepAt(e))));let h=m,g=a.belt.rate;r={beats:1,q:e=>h.real(i.q(e/g)),stepAt:e=>i.stepAt(h.nominal(e))*g,speed:e=>h.speed(e)}}else{let n=Su(e,a.cell),i=Ou(e,a,t,o(a.cell,e=>n?n.real(e):e)),s=Su(e,a.cell);r=s?{beats:i.beats,q:e=>s.real(i.q(e)),stepAt:e=>i.stepAt(s.nominal(e)),speed:e=>s.speed(e)}:i}i.set(`${n}\0plain`,r)}return r};return{map:c,written:t=>{let n=e.clocks.get(t)?.tap;if(!n?.written)return c(t);let r=i.get(`${t}\0written`);return r||i.set(`${t}\0written`,r=ku({...n,positions:n.written},l(n.meter))),r},played:t=>{let n=e.clocks.get(t)?.tap?null:Au(e,t,s(t));if(!n)return c(t);let r=i.get(`${t}\0played`);if(!r){let e=l(t);r={beats:e.beats,q:t=>e.q(n.S(t)),stepAt:t=>n.W(e.stepAt(t)),...e.speed?{speed:e.speed}:{}},i.set(`${t}\0played`,r)}return{...r,q:r.q,stepAt:r.stepAt,grain:n.grain}},swingOf:(t,n)=>{let r=s(t);return(r?r(n):e.cells.get(t)?.meter)?.swing??null},stepOf:e=>c(e).stepAt(Math.max(0,n))}}function qu(e,t,n){let r=Ku(e,t,n),i=zu(e),a=Hu(e),o=/* @__PURE__ */ new Map,s=n=>{let c=t(n),l=e.cells.get(n),u=l?.tonic?e.cells.get(l.tonic):void 0;if(l&&u?.step&&u.clock){let t=$l(e,u.name,s(u.name))[0]?.atom;return t?.kind===`note`?c-l.shift+dr(t.value+t.alter,12):c}if(!l||!l.step||!l.clock||e.clocks.has(n)||$u(e,n)||l.loops||i.has(n)&&!a.has(n))return c;let d=o.get(l.clock);if(d===void 0&&o.set(l.clock,d=r.stepOf(l.clock)),l.wrap===0)return c;let{per:f,laps:p}=Yu(e,l),m=(f?dr(Math.floor(l.rate*d+Tu),f):Math.floor(l.rate*d+Tu))*l.stride,h=Qu(e,n);if(!h){let t=p*Xu(e,n);return c+(t>0?dr(m,t):m)}let g=m+Math.min(.999999999,Math.max(0,l.rate*d-Math.floor(l.rate*d+Tu))),_=p*h.length,v=_>0?dr(g,_):g,y=Math.floor(v/h.length);return c+y*h.entries+h.inForce(v-y*h.length,Math.floor(g/h.length))};return s}let Ju=(e,t,n)=>r=>r===n?t(r):e(r);function Yu(e,t){if(t.wrap===null)return{per:null,laps:1};let n=t.step?.tap&&t.clock?e.clocks.get(t.clock)?.tap:void 0;return n?{per:Math.max(1,Math.round(n.positions.length*t.rate)),laps:0}:{per:null,laps:t.wrap}}let Xu=(e,t)=>{let n=e.cells.get(t);return Qu(e,t)?.length??(n.units.length||n.cycle)},Zu=/* @__PURE__ */ new WeakMap;function Qu(e,t){let n=Zu.get(e);if(n||Zu.set(e,n=/* @__PURE__ */ new Map),n.has(t))return n.get(t);let r=e.cells.get(t).units,i=null;if(r.some(e=>e.repeat!==1||e.elongate!==1||e.atom.kind===`seq`)){let n=[],a=0;for(let e of r)n.push(a),a+=e.atom.kind===`seq`?hn(e.atom).length:1;let o=Fn(r,()=>1).filter(e=>!e.chosen||e.chosen.every(e=>e.is===0)).map(e=>{let t=r[e.top],i=n[e.top]+(t.atom.kind===`seq`?hn(t.atom).indexOf(e.atom):0);return{at:e.at,index:i,...e.laps?{laps:e.laps}:{}}}).sort((e,t)=>e.at-t.at),s=r.reduce((e,t)=>e+Nn(t.atom,()=>1)*t.elongate*t.repeat,0),c=(e,t)=>!e.laps||dr(t,e.laps.of)===e.laps.is,l=nu(e,t).length;i={length:s,entries:l,inForce(e,t){let n;for(let r of o)r.at<=e+1e-9&&c(r,t)&&(!n||r.at>n.at+1e-9)&&(n=r);if(n)return n.index;for(let e of o)c(e,t-1)&&(!n||e.at>n.at+1e-9)&&(n=e);return n?n.index-l:0}}}return n.set(t,i),i}function $u(e,t){let n=e.cells.get(t)?.over??``,r=e.cells.get(n);return!!r&&r.units.length>0&&r.units.every(t=>t.atom.kind===`ref`&&e.sections?.get(t.atom.name)===n)}function ed(e,t,n){let r=e.cells.get(n),i=r?.clock?e.clocks.get(r.clock):void 0,a=r?.clock&&i?t.map(r.clock):null,o=i?i.perSecond:1,s=e=>a?a.stepAt(Math.max(0,e))/o:e;return{pos:s,real:e=>e<=0?0:a?a.q(e*o):e,speed:e=>Math.max(.001,(s(e+.01)-s(Math.max(0,e-.01)))/(e+.01-Math.max(0,e-.01))),moving:a}}let td=10080,nd=td*12,rd=[`Ionian`,`Dorian`,`Phrygian`,`Lydian`,`Mixolydian`,`Aeolian`,`Locrian`],id=[2,2,1,2,2,2,1],ad=[0,4,1,5,2,6,2,5,1,4,0,3],od=[`the false zenith`,`the first shadow`,`twilight`,`evening`,`late night`,`the nadir`,`the spark`,`deep morning`,`dawn`,`morning`,`mid-morning`,`the earned zenith`],sd=(e,t)=>(e%t+t)%t;[5,3,1,6,4,2,0].map(e=>e/6);function cd(e){let t=[0];for(let n=0;n<6;n++)t.push(t[n]+id[(n+e)%7]);return t}function ld(e){let t=sd(Math.floor(e),nd),n=Math.floor(t/td),r=Math.floor(t%td/840);return{block:n,key:r,bar:Math.floor(t%840/12),inBar:t%12,mode:ad[n],tonic:ud(n,r)}}function ud(e,t){return sd((e<6?7:5)*t,12)}function dd(e,t){let n=[0,4,1,5,2,6,3],r=ad[e];return n.map((e,i)=>sd(n[(i+t)%7]+r,7))}function fd(e){return cd(e)}function pd(e,t,n){let r=Math.floor(n/7),i=n%7,a=e.map((t,n)=>e[(n+i)%7]),o=fd(t);r===1&&(o=o.map((e,t)=>sd(o[(t+i)%7]-o[i],12)).sort((e,t)=>e-t));let s=[];for(let e=0;e<7;e++){let t=a[e],n=a[(e+2)%7]+1,c=a[(e+4)%7],l=a[(e+6)%7];r===0&&(t=sd(t+i+1,7)),r===2&&(n=8-n),r===3&&(c=a[(6-e+4)%7]),r===4&&(l=sd(l*5,7));let u=o[e],d=e<6?o[e+1]:12;s.push({at:u,dur:d-u,degree:t,density:n,dynamic:c,space:l})}return s}function md(e,t,n){let r=dd(e,t),i=ad[e];return n<35?pd(r,i,n):pd(r,i,69-n).map(e=>({...e,at:12-(e.at+e.dur),degree:sd(-e.degree,7)})).sort((e,t)=>e.at-t.at)}let hd=[`C`,`C#`,`D`,`Eb`,`E`,`F`,`F#`,`G`,`Ab`,`A`,`Bb`,`B`],gd=(e,t)=>t>1?`${e}@${t}`:e,_d=(e,t)=>e.map(e=>gd(t(e),e.dur)).join(` `);function vd(e,t){let n=ld(e*t);return{...n,bar:md(n.block,n.key,n.bar)}}function yd(e,t){if(e===`notes`)return _d(vd(t,12).bar,e=>e.density>1?`[${Array.from({length:e.density},(t,n)=>e.degree+2*n).join(`, `)}]`:String(e.degree));if(e===`level`)return _d(vd(t,12).bar,e=>String(+(.18+e.dynamic*.11).toFixed(2)));if(e===`space`)return _d(vd(t,12).bar,e=>String(e.space));if(e===`mode`)return rd[ld(t*840).mode??0].toLowerCase();if(e===`tonic`)return hd[ld(t*840).tonic];if(e===`block`){let e=sd(t,12);return`${rd[ad[e]]} · ${od[e]}`}throw Error(`fiveto12 has no hole ${e}`)}let bd={id:`fiveto12`,holes:{mode:{lap:840},tonic:{lap:840},notes:{lap:12},level:{lap:12},space:{lap:12},block:{lap:td,mark:!0}},block:[`&notes over=&key step=1 fill()`,`&level map=amp step=1 fill()`,`&space map=lin step=1 fill()`,`&key scale(&mode, &tonic)`,`&mode fill()`,`&tonic fill()`].join(`
`),plays:`&notes * &level`,origin:11.55,cycle:nd,stepSeconds:.7142857142857143,fill:(e,t)=>yd(e,t)},xd=/* @__PURE__ */ new Map([[bd.id,bd]]),Sd=e=>typeof e?.law==`string`&&xd.get(e.law)||null,Cd=e=>Math.min(...Object.values(e.holes).flatMap(e=>e.lap!==void 0&&!e.mark?[e.lap]:[]));function wd(e,t,n={}){let r=Cd(e),i=Math.round(e.cycle/r),a=(t%i+i)%i;return e.block.split(`
`).map(t=>{let i=/^&([A-Za-z_][A-Za-z0-9_]*)\b/.exec(t),o=i&&e.holes[i[1]];return!o||!t.includes(`fill()`)?t:t.replace(`fill()`,e.fill(i[1],o.lap?Math.floor(a*r/o.lap):0,n))}).join(`
`)}function Td(e,t,n,r,i,a=0){if(!r)return $l(e,t,n(t)+a,i);let o=$l(e,t,r.abs?0:n(t),i);return(bi(o.length,r)??[]).map(e=>o[e])}let Ed=(e,t,n)=>Si(e.cells.get(t),n)??0,Dd=(e,t=0)=>e?Un(e):`>${t}`;var Od=class extends Error{};function kd(e,t,n,r=null,i=()=>!1,a=0,o=ci){let s=/* @__PURE__ */ new Map,c=(t,r,a,o,l)=>{let u=e.cells.get(t),d=u.root?t:u.over??o,f=u.root?0:u.over?u.overShift:l,p=`${t}|${Dd(r,a)}|${d}|${f}`,m=s.get(p);if(m)return m;let h=[];if(!i(t)){let i=du(e,t,r)?bi(e.cells.get(t).units.length,r):null,o=Td(e,t,n,r,d,a),s=t=>t.kind===`ref`&&Ed(e,t.name,t.pick)||1,l=(e,t,n)=>{if(e.kind!==`ref`)return Dn(e,t,n);let r=n/s(e);return c(e.name,e.pick,e.shift,d,f).map(n=>({atom:{kind:`spliced`,e:n,ref:e},at:t+n.step*r,dur:n.duration*r,of:n.laps?.of??1,is:n.laps?.is??0,chances:[],picks:(n.chosen??[]).map(e=>({...e,at:t+e.at*r}))}))};for(let{atom:n,at:r,dur:a,chances:c,top:p,level:m,laps:g,chosen:_}of Pn(o,s,l,`${t}:`)){let o={step:r,duration:a,cell:t,table:d,tableShift:f,...i?{via:{cell:t,index:i[p],ctx:d,mul:1,add:0}}:{},...g?{laps:g}:{},..._?{chosen:_}:{}},s=c.map(e=>e===null?u.chance??.5:e),l={...s.length?{chance:s.length===1?s[0]:1-s.reduce((e,t)=>e*(1-t),1)}:{},...m===void 0?{}:{level:m}},v=t=>({...o,table:pu(e,d),tableShift:0,value:Math.round(lu(e,pu(e,d),t)*1e6)/1e6,alter:0});if(n.kind===`note`)h.push(n.pitched?{...v(n.value),...l}:{...o,value:n.value,alter:n.alter,...l});else if(n.kind===`chord`)n.notes.forEach((e,t)=>{let r=n.levels?.[t],i=r===void 0?{}:{level:r*(m??1)};h.push(n.pitched?.[t]?{...v(e),...l,...i}:{...o,value:e,alter:n.alters[t],...l,...i})});else if(n.kind===`choice`)h.push({...o,value:n.values[0],alter:n.alters[0],...l,options:n.values.map((e,t)=>({value:e,alter:n.alters[t]}))});else if(n.kind===`spliced`){let{e,ref:t}=n,i=t.transpose??0,o=t.values,{laps:s,chosen:c,...l}=e;h.push({...l,...o?{value:o.mul*e.value+o.add,alter:o.mul*e.alter,...e.options?{options:e.options.map(e=>({value:o.mul*e.value+o.add,alter:o.mul*e.alter}))}:{},...e.via?{via:{...e.via,mul:o.mul*e.via.mul,add:o.mul*e.via.add+o.add}}:{}}:{},step:r,duration:a,...g?{laps:g}:{},..._?{chosen:_}:{},...i||e.transpose?{transpose:(e.transpose??0)+i}:{},...m===void 0?{}:{level:(e.level??1)*m}})}if(h.length>5e4)throw new Od(t)}}return s.set(p,h),h};return[...c(t,r,a,o,0)].sort((e,t)=>e.step-t.step||e.value-t.value)}function Ad(e,t,n){if(!t.via)return{value:t.value,alter:t.alter};let r=$l(e,t.via.cell,n(t.via.cell),t.via.ctx)[t.via.index];return r?.atom.kind===`note`?{value:t.via.mul*r.atom.value+t.via.add,alter:t.via.mul*r.atom.alter}:{value:t.value,alter:t.alter}}let jd=e=>`cell:${e}`;function Md(e){let t=3735928559,n=1103547991;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,2654435761),n=Math.imul(n^i,1597334677)}return t=Math.imul(t^t>>>16,2246822507)^Math.imul(n^n>>>13,3266489909),n=Math.imul(n^n>>>16,2246822507)^Math.imul(t^t>>>13,3266489909),((n>>>0)*2**21+(t>>>11)).toString(36)}let Nd=e=>+e.toPrecision(9),Pd=/* @__PURE__ */ new WeakMap;function Fd(e){let t=Pd.get(e);if(t)return t;let n=gi(e),r=/* @__PURE__ */ new Map,i=(t,a)=>{let o=r.get(t);if(o!==void 0)return o;let s=e.cells.get(t);if(!s)return t;if(a.has(t))return`↺`;let c=/* @__PURE__ */ new Set([...a,t]),l=[];try{l=kd(e,t,n).map(e=>[Nd(e.step),Nd(e.duration),Nd(e.value+e.alter+(e.transpose??0)),e.chance??null,e.options?.map(e=>e.value+e.alter)??null,e.laps?[e.laps.of,e.laps.is]:null,e.chosen?.map(e=>[Nd(e.at),e.of,e.is,e.lap])??null])}catch{}let u=Object.entries(s.params).sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>[e,typeof t==`string`&&Kr.has(e)?i(t,c):t]),d=Md(JSON.stringify([s.seed,s.steps,l,u.filter(([e])=>e!==`chance`),s.env?i(s.env,c):null]));return a.size||r.set(t,d),d},a=e=>i(e,/* @__PURE__ */ new Set);return Pd.set(e,a),a}let Id=(e,t,n)=>e.drawn?e.drawn(t,n):t;function Ld(e,t,n){let r=t.series.reduce((t,r)=>t*Kd(Gd(e,r,n,n+1),n,e=>e.level),1);return t.range?t.range[0]+(t.range[1]-t.range[0])*r:r}function Rd(e,t,n,r){let i=e.voiceParams.get(t);if(!i||Object.keys(i).length===0)return;let a={};for(let[t,o]of Object.entries(i)){if(t===`pan`)continue;let i=o.series.map(t=>Gd(e,t,n,n+r)),s=e=>i.reduce((t,n)=>t*Kd(n,e,e=>e.level),1),c=e=>o.range?o.range[0]+(o.range[1]-o.range[0])*e:e;if(o.env&&o.range)a[t]={kind:`env`,from:o.range[0],peak:c(s(n)),...o.env};else{let e=[...new Set(i.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t);a[t]={kind:`points`,points:(e.length?e:[n]).map(e=>({at:e,value:c(s(e)),...i.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9))?{ramp:!0}:{}}))}}}return Object.keys(a).length?a:void 0}function zd(e,t,n){let r=qu(e.result,e.statics,n+Tu),i=e.played.has(t.cell)?Ju(r,e.statics,t.cell):r,a=Ad(e.result,t,i),o=su(e.result,t.table,t.tableShift,a.value,a.alter,i),s=t.transpose?{...o,position:o.position+t.transpose}:o;return cu(e.result,s.root,s.position)}function Bd(e,t,n,r){if(t.events.length===0)return[{at:n,semis:0}];if(!t.clock)return[{at:n,semis:t.sign*zd(e,t.events[0],n)}];if(t.lin)return Wd(e,t,n,r,(n,r)=>t.sign*zd(e,n,r)).map(e=>({at:e.at,semis:e.v,ramp:e.ramp}));let i=Ku(e.result,e.statics).map(t.clock),a=i.stepAt(Math.max(0,n))*t.rate,o=i.stepAt(Math.max(0,r))*t.rate;Number.isFinite(a)||(a=0),Number.isFinite(o)||(o=a);let s=[],c=Math.floor(a/t.period),l=Hd(t,a);s.push({at:n,semis:l?t.sign*zd(e,l,n):0});for(let n=c;n*t.period<o;n++)for(let r of t.events){let c=n*t.period+r.step;if(c<=a+1e-9||c>=o-1e-9)continue;let l=i.q(c/t.rate);s.push({at:l,semis:t.sign*zd(e,r,l)})}return s}function Vd(e,t){return Math.floor((e+Tu)/t)}function Hd(e,t){let n=Vd(t,e.period),r=null;for(let i of[n,n-1]){for(let n of e.events)i*e.period+n.step<=t+1e-9&&(r=n);if(r)break}return r}function Ud(e,t,n){if(t.events.length===0)return null;if(!t.clock)return t.events[0];let r=Ku(e.result,e.statics).map(t.clock).stepAt(Math.max(0,n))*t.rate;return Hd(t,Number.isFinite(r)?r:0)}function Wd(e,t,n,r,i){let a=Ku(e.result,e.statics).map(t.clock),o=[...new Map(t.events.map(e=>[e.step,e])).values()].sort((e,t)=>e.step-t.step),s=e=>a.q(e/t.rate),c=(e,n,r)=>{let a=Id(t,e,n);return a?i(a,r):0},l=e=>{let n=Vd(e,t.period),r=e-n*t.period,i=o.length-1;for(let e=0;e<o.length;e++)o[e].step<=r+1e-9&&(i=e);let a=o[i],l=a.step>r+1e-9?a.step-t.period:a.step,u=c(a,l<0?n-1:n,s(n*t.period+l));if(i===o.length-1||l<0)return u;let d=o[i+1];return u+(c(d,n,s(n*t.period+d.step))-u)*(r-l)/Math.max(Tu,d.step-l)},u=a.stepAt(Math.max(0,n))*t.rate,d=a.stepAt(Math.max(0,r))*t.rate;Number.isFinite(u)||(u=0),Number.isFinite(d)||(d=u);let f=[{at:n,v:l(u),ramp:!1}];for(let e=Math.floor(u/t.period);e*t.period<d;e++)for(let n of o){let r=e*t.period+n.step;r>u+1e-9&&r<d-1e-9&&f.push({at:s(r),v:c(n,e,s(r)),ramp:n!==o[0]})}return f.push({at:r,v:l(d-1e-6),ramp:!0}),f}function Gd(e,t,n,r,i){if(t.sum){let{terms:a,constant:o}=t.sum,s=a.map(t=>Gd(e,t.series,n,r,i)),c=[...new Set(s.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t);return(c.length?c:[n]).map(e=>({at:e,level:Math.min(1,Math.max(0,a.reduce((t,n,r)=>t+n.weight*Kd(s[r],e,e=>e.level),o))),...s.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9))?{ramp:!0}:{}}))}let a=e=>t.db?10**((e.value+e.alter)/20):t.bipolar?Math.max(0,(1+e.value+e.alter)/2):Math.max(0,e.value+e.alter);if(t.events.length===0)return[{at:n,level:0}];if(!t.clock)return[{at:n,level:a(t.events[0])}];if(t.lin)return Wd(e,t,n,r,e=>a(e)).map(e=>({at:e.at,level:Math.max(0,e.v),ramp:e.ramp}));let o=Ku(e.result,e.statics).map(t.clock),s=o.stepAt(Math.max(0,n))*t.rate,c=o.stepAt(Math.max(0,r))*t.rate;Number.isFinite(s)||(s=0),Number.isFinite(c)||(c=s);let l=e=>{let n=Vd(e,t.period),r=e-n*t.period,i=-1;for(let e of t.events){if(!(r>=e.step-1e-9&&r<e.step+e.duration-1e-9))continue;let o=Id(t,e,n);o&&(i=Math.max(i,a(o)))}return i<0?0:i},u=i===void 0?NaN:Ku(e.result,e.statics).written(t.clock).stepAt(Math.max(0,i))*t.rate,d=[{at:n,level:l(Number.isFinite(u)?u:s)}],f=/* @__PURE__ */ new Set;for(let e=Math.floor(s/t.period);e*t.period<c;e++)for(let n of t.events)for(let r of[e*t.period+n.step,e*t.period+n.step+n.duration])r>s+1e-9&&r<c-1e-9&&f.add(r);for(let e of[...f].sort((e,t)=>e-t)){let n=l(e+Tu*10);n!==d[d.length-1].level&&d.push({at:o.q(e/t.rate),level:n})}return d}function Kd(e,t,n){let r=0;for(let n=0;n<e.length;n++)e[n].at<=t+1e-9&&(r=n);let i=e[r+1];return!i?.ramp||Math.abs(e[r].at-t)<1e-9?n(e[r]):n(e[r])+(n(i)-n(e[r]))*(t-e[r].at)/Math.max(Tu,i.at-e[r].at)}let qd={sign:1,lin:!1,db:!1,clock:null,rate:0,period:1,events:[]};function Jd(e,t,n){let r=Ku(e,t),i=/* @__PURE__ */ new Set,a=[],o=t=>{for(let n=0;t&&!i.has(t)&&n<32;n++){i.add(t);let n=e.cells.get(t);if(!n)return;n.laps&&n.clock&&a.push(r.map(n.clock).q(n.laps*Math.max(1,Ed(e,t,null))/n.rate)),n.clock&&n.clock!==t&&o(n.clock),t=n.step?.driver}};o(n.cell);for(let e of n.select)o(e.cell);return a.length?Math.min(...a):1/0}function Yd(e){let t=3735928559,n=1103547991;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);t=Math.imul(t^i,2654435761),n=Math.imul(n^i,1597334677)}return t=Math.imul(t^t>>>16,2246822507)^Math.imul(n^n>>>13,3266489909),n=Math.imul(n^n>>>16,2246822507)^Math.imul(t^t>>>13,3266489909),((n>>>0)*2**21+(t>>>11))/2**53}function Xd(e,t,n,r){return Zd(e,t.output.cell,n,r)}function Zd(e,t,n,r){if(n.laps&&dr(r,n.laps.of)!==n.laps.is)return null;if(n.chance===void 0&&!n.options&&!n.chosen)return n;let i=`${e.cells.get(t)?.seed??0}|${Fd(e)(t)}`;for(let e of n.chosen??[])if(Math.floor(Yd(`${i}|${r+e.lap}|${e.at.toFixed(6)}|${e.id.replace(/^[^:/]*:/,``)}|picks`)*e.of)!==e.is)return null;if(n.chance===void 0&&!n.options)return n;let a=`${i}|${r}|${n.step.toFixed(6)}`;if(n.chance!==void 0&&Yd(`${a}|sounds`)>=1-n.chance)return null;if(!n.options)return n;let o=n.options[Math.floor(Yd(`${a}|picks`)*n.options.length)];return{...n,value:o.value,alter:o.alter}}function Qd(e,t){let n=!1;for(let r of t){let t=e.cells.get(r.part)?.params.restart??e.cells.get(r.cell)?.params.restart;if(t===`resume`||t===`free`)return t;(t===`restart`||!r.performer)&&(n=!0)}return n?`restart`:`free`}function $d(e,t,n,r){let i=t.series;if(!i.clock||i.events.length===0)return[];let a=Ku(e.result,e.statics).map(i.clock),o=a.stepAt(Math.max(0,n))*i.rate,s=a.stepAt(Math.max(0,r))*i.rate;Number.isFinite(o)||(o=0),Number.isFinite(s)||(s=o);let c=[];for(let e=Math.floor(o/i.period)-1;e*i.period<s;e++)for(let n of i.events){if(dr(Math.round(n.value+n.alter),t.entries)!==t.entry)continue;let r=e*i.period+n.step,l=r+n.duration;l<=o+1e-9||r>=s-1e-9||c.push({a:a.q(r/i.rate),b:a.q(l/i.rate)})}return c.sort((e,t)=>e.a-t.a)}let ef=(e,t,n)=>uu(e,t).some(e=>n.has(jd(e))),tf=(e,t,n)=>{let r=e.cells.get(t);for(let t=0;r?.step&&t<32;t++){if(n.has(jd(r.step.driver)))return!0;r=e.cells.get(r.step.driver)}return!1};function nf(e,t){let n=e.cells.get(t),r=n?.voice?n.params.gain:void 0;return typeof r==`number`&&Number.isFinite(r)?r:1}function rf(e,t,n){let[r,i]=[1,1];for(let a of t){let t=e.voiceParams.get(a)?.pan;if(!t)continue;let[o,s]=mi(Ld(e,t,n));[r,i]=[r*o,i*s]}return[r,i]}function af(e,t){return e.silent?e.via.some(n=>t.has(jd(n))&&!e.midi?.some(e=>e.card===n))?[0,0]:[e.gains[0],e.gains[1]]:sf(e.parts,t)}function of(e,t){let n=af(e,t);if(e.silent||cf(n))return n;let r=uf(e,t).reduce((e,t)=>Math.abs(t.gain)>Math.abs(e)?t.gain:e,0);return[r,r]}function sf(e,t){let n=[0,0];for(let r of e)!t.has(jd(r.mix))&&!t.has(jd(r.sink))&&(n[0]+=r.gains[0],n[1]+=r.gains[1]);return n}let cf=e=>e[0]!==0||e[1]!==0;function lf(e,t,n){if(!ff(e,t,n))return!1;let r=af(t,n);return cf(r)||df(t,n)}function uf(e,t){return(e.midi??[]).filter(e=>!t.has(jd(e.card))&&!(e.mix&&t.has(jd(e.mix))))}let df=(e,t)=>uf(e,t).length>0;function ff(e,t,n){if(n.has(jd(t.voice))||n.has(jd(t.cell)))return!1;if(t.drone)return!t.through.some(e=>n.has(jd(e)))&&!(t.envelopeCell&&n.has(jd(t.envelopeCell)));let r=e.cells.get(t.cell);return!(!r?.clock||ef(e,r.clock,n)||tf(e,t.cell,n)||t.through.some(e=>n.has(jd(e)))||t.envelopeCell&&n.has(jd(t.envelopeCell))||t.select.some(t=>n.has(jd(t.cell))||n.has(jd(t.part))||n.has(jd(e.cells.get(t.cell).over)))||t.select.some(t=>[...e.cells.get(t.cell).children.keys()].some(e=>n.has(jd(e)))))}function pf(e,t,n){if(Math.abs(t-n)<1e-9)return{period:t,events:[...e]};let r=[];for(let i=0;i*t<n-Tu;i++)for(let a of e){let e=a.step+i*t;e>=n-1e-9||r.push({...a,step:e,duration:Math.min(a.duration,n-e)})}return{period:n,events:r}}function mf(e,t,n=/* @__PURE__ */ new Set){if(!e.ok)return{result:e,statics:t,muted:n,tracks:[],drones:[],played:/* @__PURE__ */ new Set,voiceParams:/* @__PURE__ */ new Map,envParams:/* @__PURE__ */ new Map,end:1/0,seriesOf:()=>qd};let r=[],i=[],a=/* @__PURE__ */ new Map,o=(r,i,a,s)=>{let c=e.cells.get(r);if(c.sum)return{sign:s,lin:!1,db:!1,clock:null,rate:0,period:1,events:[],sum:{terms:c.sum.terms.map(e=>({series:o(e.cell,null,0,1),weight:e.weight})),constant:c.sum.constant}};let l=n.has(jd(r))?[]:kd(e,r,t,i,e=>n.has(jd(e)),a).filter(t=>!ef(e,t.table,n)),u=l.some(e=>e.laps||e.chance!==void 0||e.options||e.chosen)?(t,n)=>Zd(e,r,t,n):void 0,d=c.map?.kind===`db`,f=!d&&l.some(e=>e.value+e.alter<0||(e.options??[]).some(e=>e.value+e.alter<0)),p=Math.max(1,Ed(e,r,i)),m=Yu(e,c).per;return{sign:s,lin:c.map?.kind===`lin`,db:d,clock:c.clock,rate:c.rate,...m?pf(l,p,m):{period:p,events:l},...u?{drawn:u}:{},...f?{bipolar:!0}:{}}},s=(t,n)=>{let r=(Lc(e,n)??0)/t.period;return r>20?{...t,rate:t.rate*20/r}:t},c=/* @__PURE__ */ new Map;for(let t of e.cells.values())if(t.map?.kind===`adsr`&&Object.keys(t.paramCells).length)try{c.set(t.name,Object.fromEntries(Object.entries(t.paramCells).map(([e,t])=>[e,{range:t.range,series:t.factors.map(e=>o(e,null,0,1)),env:null}])))}catch(e){if(!(e instanceof Od))throw e}for(let c of e.outputs){if(!lf(e,c,n))continue;let l=e.cells.get(c.cell);try{for(let t of[...c.kit?Fc(e.cells.get(c.voice)):[c.voice],...c.through]){if(a.has(t))continue;let n=e.cells.get(t),r={};for(let[t,i]of Object.entries(n?.paramCells??{})){let n=i.factors.find(t=>e.cells.get(t)?.map?.kind===`adsr`);r[t]={range:i.range,series:i.factors.filter(e=>e!==n).map(e=>s(o(e,null,0,1),e)),env:n?wi(e.cells.get(n)):null}}a.set(t,r)}if(c.drone){i.push({output:c,mods:c.mods.map(e=>o(e.cell,e.pick,e.shift,e.sign)).filter(e=>e.events.length>0),levels:c.levels.map(e=>o(e.cell,e.pick,e.shift,e.sign))});continue}let n=o(c.cell,c.pick,c.shift,c.sign),u=c.mods.filter(e=>!e.picks).map(e=>o(e.cell,e.pick,e.shift,e.sign)).filter(e=>e.events.length>0),d=c.mods.find(e=>e.picks),f=d?o(d.cell,d.pick,d.shift,1):void 0,p=c.levels.map(e=>o(e.cell,e.pick,e.shift,e.sign)),m=c.select.map(t=>({series:o(t.cell,null,0,1),entry:t.entry,entries:e.cells.get(e.cells.get(t.cell).over).units.length})),h=l.paramCells.legato,g=l.step?.tap?e.cells.get(l.step.driver)?.meter:null,_=l.step?.chain.reduce((e,t)=>t.op===`×`?e*t.n:e/t.n,1)??1,v=h?{range:h.range,series:h.factors.map(e=>o(e,null,0,1))}:typeof l.params.legato==`number`?l.params.legato:g?Xi(g,l.step.tap,_):1;n.events.length&&r.push({...n,output:c,clock:l.clock,mods:u,...f?{picker:f}:{},levels:p,selects:m,end:Jd(e,t,c),share:v})}catch(e){if(!(e instanceof Od))throw e}}let l=r.map(e=>e.end),u=-1/0;for(let t of e.clocks.values()){let n=Su(e,t.cell)?.stopsAt();n!=null&&(u=Math.max(u,n))}let d=l.length?Math.max(...l):1/0,f={result:e,statics:t,muted:n,tracks:r,drones:i,played:zu(e),voiceParams:a,envParams:c,end:Math.min(d,u>-1/0?u:1/0),seriesOf:t=>e.cells.has(t)?o(t,null,0,1):qd},p={swing:/* @__PURE__ */ new Map,depth:/* @__PURE__ */ new Map};for(let t of e.cells.values()){let e=[[`swing`,t.meter?t.swingMoves:void 0],[`depth`,t.bend?.depth]];for(let[n,r]of e)if(r)try{p[n].set(t.name,{range:r.range,series:r.factors.map(e=>o(e,null,0,1)),env:null})}catch(e){if(!(e instanceof Od))throw e}}return(p.swing.size||p.depth.size)&&Lu(e,t,(e,t,n)=>{let r=p[t].get(e);return r?Ld(f,r,n):NaN}),f}function hf(e,t,n,r){let i=n&&t?e.envParams.get(t):void 0;if(!i)return n;let a={...n};for(let[t,n]of Object.entries(i)){let i=Ld(e,n,r);t===`attack`||t===`decay`||t===`release`?a[t]=Math.max(0,i):t===`sustain`&&(a.sustain=Math.min(1,Math.max(0,i)))}return a}function gf(e,t){let n=e.cells.get(t)?.env,r=n?e.cells.get(n):void 0;return r?.map?.kind===`adsr`?wi(r):null}function _f(e,t,n){if(!t.kit)return{voice:t.voice,freq:e.cells.get(t.voice).freq};let r=e.cells.get(t.voice),i=r.units[dr(Math.round(n),r.units.length)];return i?.atom.kind===`ref`?{voice:i.atom.name,freq:e.cells.get(i.atom.name).freq}:null}function vf(e,t,n){let r=e.cells.get(e.cells.get(t)?.over??``)?.params.anchor;if(typeof r!=`number`)return 0;let i=e=>Math.floor(e)*3600+Math.round(e%1*100)*60;return Math.round(((i(r)-i(n.origin))%86400+86400)%86400/n.stepSeconds)}let yf=/* @__PURE__ */ new Map;function bf(e,t){let n=`${e.id} ${t}`,r=yf.get(n);if(r)return r;let i=Cd(e),a=Zl(Z(`${wd(e,t)}\n&lapVoice s=sine loop=C4\n&lapOut map=sample [${e.plays} * &lapVoice]`,{old:!1}),_i);if(!a.ok)throw Error(`law=${e.id}, lap ${t}: ${a.diagnostics.map(e=>e.message).join(`; `)}`);let o=gi(a),s=a.cells.get(`lapVoice`).freq,c=e.holes.space?kd(a,`space`,o,null):[],l=e=>{let t=c.find(t=>e>=t.step-1e-9&&e<t.step+t.duration-1e-9);return t?t.value/3-1:0},u=Sf(mf(a,o),0,i).map(e=>({step:e.at,dur:e.dur,ratio:e.freq/s,level:e.levels[0]?.level??0,pan:l(e.at)})).sort((e,t)=>e.step-t.step||e.ratio-t.ratio);return yf.size>=96&&yf.delete(yf.keys().next().value),yf.set(n,u),u}function xf(e,t,n){let r=Cd(e),i=[];for(let a=Math.floor(t/r);a*r<n;a++)for(let o of bf(e,a)){let e=a*r+o.step;e>=t&&e<n&&i.push({...o,step:e})}return i}function Sf(e,t,n,r=!1,i={}){let a=t=>e.result.cells.get(t.output.cell)?.params.law!==void 0,o=e.tracks.filter(e=>!e.output.tape&&!a(e)),s=e.tracks.filter(e=>e.output.tape),c=Of({...e,tracks:o},t,n,r);e.drones.length&&(c.push(...Af(e,t,n,r,i)),c.sort((e,t)=>e.at-t.at));for(let i of e.result.outputs){let a=Sd(e.result.cells.get(i.cell)?.params);if(!a)continue;let o=of(i,e.muted),s=i.midi?uf(i,e.muted):[],l=cf(o);if(!l&&!s.length)continue;let u=e.result.cells.get(i.voice)?.freq||261.63,d=vf(e.result,i.cell,a),f=a.stepSeconds;for(let p of xf(a,Math.ceil(t/f-1e-9)+d,Math.ceil(n/f-1e-9)+d)){let t=(p.step-d)*f;c.push({at:t,dur:p.dur*f,voice:i.voice,freq:u*p.ratio,bends:[],gains:[o[0]*Math.min(1,1-p.pan)*nf(e.result,i.voice),o[1]*Math.min(1,1+p.pan)*nf(e.result,i.voice)],levels:[{at:t,level:p.level}],...l?{}:{unheard:!0},...s.length?{midi:s}:{},...r?{output:i.id}:{}})}}if(!s.length)return c;let l=Ku(e.result,e.statics);for(let i of s){let a=i.output.tape,o=e.result.cells.get(a.tape),{pos:s,real:u,speed:d,moving:f}=ed(e.result,l,a.tape),p=typeof o?.params.varispeed==`number`?o.params.varispeed:0,m=1-a.erase,h=a.length>0?Math.min(40,m>0?Math.ceil(Math.log(.02)/Math.log(m)):1):1,g={...i,output:{...i.output,tape:void 0}};for(let i=0;i<h;i++){let o=a.at+i*a.length,l=m**+i,h=u(s(t)-o),_=u(s(n)-o);if(!(_>0)||!Number.isFinite(_))continue;let v=e=>u(s(e)+o);for(let i of Of({...e,tracks:[g]},Math.max(0,h),_,r)){let e=v(i.at);if(!(e>=t&&e<n)||!Number.isFinite(e))continue;let r=v(i.at+i.dur);if(f&&d(i.at)<.05)continue;let a=p?Math.min(4,Math.max(.25,(d(e)/d(i.at))**+p)):1;c.push({...i,at:e,dur:Math.max(.01,(Number.isFinite(r)?r:e+i.dur)-e),freq:i.freq*a,bends:i.bends.map(e=>({...e,at:v(e.at)})),levels:i.levels.map(e=>({...e,at:v(e.at)})),gains:[i.gains[0]*l,i.gains[1]*l],...i.params?{params:Cf(i.params,v)}:{},...i.through?{through:i.through.map(e=>e.params?{...e,params:Cf(e.params,v)}:e)}:{}})}}}return c.sort((e,t)=>e.at-t.at)}let Cf=(e,t)=>Object.fromEntries(Object.entries(e).map(([e,n])=>[e,n.kind===`points`?{...n,points:n.points.map(e=>({...e,at:t(e.at)}))}:n]));function wf(e,t,n,r){let i=[...t.through].reverse().filter(t=>{let n=e.result.cells.get(t);return!!n&&[...Object.keys(n.params),...Object.keys(n.paramCells),...Object.keys(n.paramClocks)].some(e=>Yr.has(e))}).map(t=>{let i=Rd(e,t,n,r);return{instrument:t,...i?{params:i}:{}}});return i.length?{through:i}:{}}function Tf(e){let[t,n,r,i]=[0,1,1,0],a=e;for(let o=0;o<32;o++){let o=Math.floor(a+1e-12);if([t,n]=[n,o*n+t],[r,i]=[i,o*i+r],i>1e4)return[t,r];if(Math.abs(e-n/i)<1e-9)break;a=1/(a-o)}return[n,i]}let Ef=(e,t)=>t===0?e:Ef(t,e%t);function Df(e,t){let[n,r]=Tf(e-Math.floor(e)),[i,a]=Tf(Math.max(0,t-Math.floor(t))),o=r*a/Ef(r,a);return Ef(Ef(o/r*n,o/a*i),o)/o}function Of(e,t,n,r){let i=[],{result:a,statics:o}=e,s=Ku(a,o);for(let o of e.tracks){let c=s.map(o.clock),l=Math.min(n,o.end);if(l<=t)continue;let u=c.stepAt(Math.max(0,t))*o.rate,d=c.stepAt(Math.max(0,l))*o.rate;if(!Number.isFinite(u)||!Number.isFinite(d)||d<=u)continue;let f=(t,n)=>{let r=o.share;if(typeof r==`number`)return r;let i=r.series.reduce((t,r)=>{let i=Ud(e,r,n);return t*(i?i.value+i.alter:1)},1);return r.range?r.range[0]+(r.range[1]-r.range[0])*i:i},p=(t,n,i,l=1/0)=>{let u=Df(t,n.duration)/o.rate,d=c.q(t/o.rate,u);if(!Number.isFinite(d)||d>=o.end-1e-9)return null;let p=f(t,d),m=Math.min(c.q((p===1?i:t+p*(i-t))/o.rate,u),l<1/0?c.q(l/o.rate):1/0,o.end),h=o.picker?Ud(e,o.picker,d):n,g=h&&_f(a,o.output,h.value);if(!g||e.muted.has(jd(g.voice)))return null;let _=hf(e,o.output.envelope?o.output.envelopeCell:o.output.kit?a.cells.get(g.voice)?.env:null,o.output.envelope??(o.output.kit?gf(a,g.voice):null),d),v=a.cells.get(g.voice)?.oneshot?_??gf(a,g.voice):null,y=v?v.attack+v.decay:Number.isFinite(m)?m-d:8,b=o.output.kit&&!o.picker||o.output.gate?o.output.offset:o.sign*zd(e,n,d)+o.output.offset,x=[];if(o.mods.length){let t=o.mods.map(t=>Bd(e,t,d,d+y)),n=t.reduce((e,t)=>e+t[0].semis,0);b+=n;let r=[...new Set(t.flatMap(e=>e.slice(1).map(e=>e.at)))].sort((e,t)=>e-t);for(let e of r){let r=t.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9)),i=t.reduce((t,n)=>t+Kd(n,e,e=>e.semis),0);x.push({at:e,cents:100*(i-n),...r?{ramp:r}:{}})}}let S=Gu(a,o.clock);if(S&&c.speed&&!o.output.gate){let e=e=>Math.max(.001,c.speed(e)),t=e(d);if(t<.05)return null;if(b+=12*S*Math.log2(t),!x.length)for(let n=d+.04,r=0;n<d+y&&r<400;n+=.04,r++){let r=1200*S*Math.log2(e(n)/t);Math.abs(r)>1&&x.push({at:n,cents:r,ramp:!0})}}let C=o.db?10**((n.value+n.alter)/20):Math.max(0,n.value+n.alter),w=[{at:d,level:(o.output.gate?C:1)*(n.level??1)}];if(o.levels.length){let n=s.written(o.clock).q(t/o.rate),r=o.levels.map(t=>Gd(e,t,d,d+y,n)),i=[...new Set(r.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t),a=w[0].level;w.length=0;for(let e of i)w.push({at:e,level:a*r.reduce((t,n)=>t*Kd(n,e,e=>e.level),1),...r.some(t=>t.some(t=>t.ramp&&Math.abs(t.at-e)<1e-9))?{ramp:!0}:{}})}let T=g.freq*2**(b/12),E=Rd(e,g.voice,d,y),D=_,O=e=>{let t=nf(a,g.voice);if(!o.output.kit)return[e[0]*t,e[1]*t];let[n,r]=mi(a.cells.get(g.voice)?.params.pan);return[e[0]*n*t,e[1]*r*t]},[k,A]=rf(e,[g.voice,...o.output.through],d),j=O(of(o.output,e.muted)),M=[j[0]*k,j[1]*A],N=o.output.midi?uf(o.output,e.muted):[];return T>0&&T<2e4&&w.some(e=>e.level>0)?{at:d,dur:y,voice:g.voice,freq:T,bends:x,value:n.value+n.alter,gains:M,levels:w,...!o.output.silent&&!cf(M)?{unheard:!0}:{},...N.length?{midi:N}:{},...D?{env:D}:{},...o.output.through.length?{instrument:o.output.through[0]}:{},...E?{params:E}:{},...wf(e,o.output,d,y),...r?{output:o.output.id}:{}}:null},m=o.output.kit||o.output.gate?0:a.cells.get(o.output.voice)?.glide??0,h=m>0,g=o.events.length,_=e=>(e===0||o.events[e-1].step!==o.events[e].step)&&(e===g-1||o.events[e+1].step!==o.events[e].step),v=(e,t)=>e>0?[e-1,t]:[g-1,t-1],y=(e,t,n,r,i)=>{if(!h||!_(e)||dr(t*g+e,256)===0)return!1;let[s,l]=v(e,t),u=l*o.period+o.events[s].step+o.events[s].duration,d=t*o.period+o.events[e].step;return _(s)&&l>=n&&r+l*o.period+o.events[s].step>=i-1e-9&&Math.abs(u-d)<1e-9&&f(r+l*o.period+o.events[s].step,c.q((r+l*o.period+o.events[s].step)/o.rate,Df(r+l*o.period+o.events[s].step,o.events[s].duration)/o.rate))>=1-1e-9&&!!Xd(a,o,o.events[s],l)},b=(e,t,n,r=-1,s=0,c=0,l=0,u=1/0,d=-1/0)=>{if(r>=0&&y(r,s,l,c,d))return;let f=p(e,t,n,u);if(!f)return;if(r<0||!h||!_(r))return void i.push(f);let v=f,b=[{at:f.at,dur:f.dur,freq:f.freq,bends:f.bends}],[x,S]=[r,s];for(let e=0;e<256;e++){[x,S]=x<g-1?[x+1,S]:[0,S+1];let e=c+S*o.period+o.events[x].step;if(e>=u-1e-9||!y(x,S,l,c,d))break;let t=Xd(a,o,o.events[x],S),n=t&&p(e,t,e+o.events[x].duration,u);if(!n)break;let r=1200*Math.log2(n.freq/v.freq),i=v.bends.length?v.bends[v.bends.length-1].cents:0,s=Math.min(m,n.dur);v={...v,dur:n.at+n.dur-v.at,bends:[...v.bends,{at:n.at,cents:i},{at:n.at+s,cents:r,ramp:!0},...n.bends.map(e=>({...e,at:Math.max(e.at,n.at+s),cents:e.cents+r}))],levels:[...v.levels,...n.levels.filter(e=>e.at>=n.at)]},b.push({at:n.at,dur:n.dur,freq:n.freq,bends:n.bends})}i.push(b.length>1?{...v,legato:{glide:m,notes:b}}:v)};if(o.selects.length===0){for(let e=Math.floor(u/o.period)-1;e*o.period<d;e++)for(let[t,n]of o.events.entries()){let r=e*o.period+n.step;if(r<u-1e-9||r>=d-1e-9)continue;let i=Xd(a,o,n,e);i&&b(r,i,r+n.duration,t,e)}continue}let x=Qd(a,o.output.select),S=e=>e.reduce((e,t)=>{let n=e[e.length-1];return n&&Math.abs(t.a-n.b)<1e-9?e[e.length-1]={a:n.a,b:t.b}:e.push(t),e},[]),C=(t,n)=>{let r=o.output.select[t],i=$d(e,o.selects[t],n,l),s=a.cells.get(r.part)?.params.restart??a.cells.get(r.cell)?.params.restart;return r.performer&&s!==`restart`?S(i):i},w=(e=>{let t=C(0,e);for(let n of o.selects.keys()){if(n===0)continue;let r=C(n,e);t=t.flatMap(e=>r.flatMap(t=>Math.max(e.a,t.a)<Math.min(e.b,t.b)?[{a:Math.max(e.a,t.a),b:Math.min(e.b,t.b)}]:[]))}return x===`restart`?t:S(t)})(x===`resume`?0:t),T=0;for(let e of w){let t=c.stepAt(e.a)*o.rate,n=c.stepAt(e.b)*o.rate,r=x===`free`?0:x===`resume`?t-T:t;T+=n-t;let i=Math.max(u,t),s=Math.min(d,n);if(!(s<=i))for(let e=Math.floor((i-r)/o.period)-1;r+e*o.period<s;e++)for(let[c,l]of o.events.entries()){let u=r+e*o.period+l.step;if(e<0||u<i-1e-9||u>=s-1e-9)continue;let d=Xd(a,o,l,e);d&&b(u,d,u+l.duration,c,e,r,0,n,t)}}}return i.sort((e,t)=>e.at-t.at)}function kf(e,t,n,r){let i=[...new Set(e.flatMap(e=>e.map(e=>e.at)))].sort((e,t)=>e-t),a=e.map(()=>0),o=[];for(let s of i){let i=r,c=!1;e.forEach((e,r)=>{let o=a[r];for(;o+1<e.length&&e[o+1].at<=s+1e-9;)o++;a[r]=o;let l=e[o],u=e[o+1],d=!u?.ramp||Math.abs(l.at-s)<1e-9?t(l):t(l)+(t(u)-t(l))*(s-l.at)/Math.max(Tu,u.at-l.at);i=n(i,d),l.ramp&&Math.abs(l.at-s)<1e-9&&(c=!0)}),o.push({at:s,value:i,...c?{ramp:c}:{}})}return o}function Af(e,t,n,r,i){let a=Math.max(0,i.begins??0),o=Math.min(e.end,i.until??1/0),s=[];for(let i=Math.max(0,Math.floor((t-a)/600));a+i*600<Math.min(n,o);i++){let n=a+i*600;if(n<t-1e-9)continue;let c=Math.min(600,o-n);if(c>0)for(let t of e.drones){let i=t.output,a=e.result.cells.get(i.voice);if(!a)continue;let o=kf(t.mods.map(t=>Bd(e,t,n,n+c)),e=>e.semis,(e,t)=>e+t,0),l=o[0]?.value??0,u=o.slice(1).map(e=>({at:e.at,cents:100*(e.value-l),...e.ramp?{ramp:!0}:{}})),d=t.levels.length?kf(t.levels.map(t=>Gd(e,t,n,n+c)),e=>e.level,(e,t)=>e*t,1).map(e=>({at:e.at,level:e.value,...e.ramp?{ramp:!0}:{}})):[{at:n,level:1}],f=a.freq*2**((i.offset+l)/12);if(!(f>0&&f<2e4)||!d.some(e=>e.level>0))continue;let[p,m]=rf(e,[i.voice,...i.through],n),h=of(i,e.muted),g=[h[0]*p,h[1]*m],_=i.midi?uf(i,e.muted):[],v=Rd(e,i.voice,n,c);s.push({at:n,dur:c,voice:i.voice,freq:f,bends:u,gains:g,levels:d,held:!0,...!i.silent&&!cf(g)?{unheard:!0}:{},..._.length?{midi:_}:{},...i.envelope?{env:hf(e,i.envelopeCell,i.envelope,n)}:{},...i.through.length?{instrument:i.through[0]}:{},...v?{params:v}:{},...wf(e,i,n,c),...r?{output:i.id}:{}})}}return s}function jf(e){return e.ends===null?e.cycle!==null&&Number.isFinite(e.cycle)&&e.cycle<=1800?e.cycle:e.longest:e.ends}function Mf(e){let[t,n,r,i]=[0n,1n,1n,0n],a=e;for(let o=0;o<32;o++){let o=BigInt(Math.floor(a));if([t,n]=[n,o*n+t],[r,i]=[i,o*i+r],i>10000n)return[t,r];let s=a-Math.floor(a);if(s<1e-9||Math.abs(Number(n)/Number(i)-e)<1e-9*Math.max(1,e))break;a=1/s}return[n,i]}let Nf=(e,t)=>t===0n?e:Nf(t,e%t);function Pf(e,t){let n=[...e.cells.values()].map(e=>Sd(e.params)).find(e=>e!==null);if(n){let e=n.cycle*n.stepSeconds;return{ends:e,cycle:e,chance:!1,longest:e}}let r=gi(e),i=mf(e,r),a=Ku(e,r),o=(e,t)=>{if(!e)return null;let n=a.map(e),r=n.q(t)-n.q(0);return Number.isFinite(r)&&r>1e-6?r:null},s=[],c=!1,l=t=>{let n=e.clocks.get(t),r=n?.tap?.meter??n?.belt?.driver;return r&&r!==t?l(r):t},u=new Set(i.tracks.map(e=>l(e.clock))),d=e=>u.has(l(e));for(let e of i.tracks){let t=o(e.clock,e.period/e.rate),n=e.events.reduce((e,t)=>t.laps?Number(BigInt(e)*BigInt(t.laps.of)/Nf(BigInt(e),BigInt(t.laps.of))):e,1);t&&s.push(t*n),e.events.some(e=>e.chance!==void 0||e.options||e.chosen)&&(c=!0);for(let t of[...e.mods.filter(e=>e.clock&&d(e.clock)),...e.levels,...e.selects.map(e=>e.series)]){let e=t.clock?o(t.clock,t.period/t.rate):null;e&&s.push(e)}}for(let e of i.voiceParams.values())for(let t of Object.values(e))for(let e of t.series){let t=e.clock&&d(e.clock)?o(e.clock,e.period/e.rate):null;t&&s.push(t)}let f=new Set([...e.cells.values()].flatMap(e=>e.over?[e.over]:[]));for(let t of e.cells.values()){if(!f.has(t.name)||!t.step||!t.clock||t.loops||e.clocks.has(t.name)||!t.cycle)continue;let n=o(t.clock,1/t.rate);if(!n)continue;let r=Math.max(1,Math.abs(Math.round(t.stride||1)));if(t.wrap===0)continue;let{per:i,laps:a}=Yu(e,t),c=Math.max(1,Math.round(a*Xu(e,t.name))),l=i??c/Number(Nf(BigInt(c),BigInt(r)));s.push(n*l)}t?.push(...s);let p=Number.isFinite(i.end)?i.end:null,m=s.length?Math.max(...s):null;if(s.length===0)return{ends:p,cycle:null,chance:c,longest:m};let h=1n,g=0n;for(let e of s){let[t,n]=Mf(e);t!==0n&&(h=h/Nf(h,t)*t,g=g===0n?n:Nf(g,n))}return{ends:p,cycle:g===0n?null:h/g>10n**18n?1/0:Number(h)/Number(g),chance:c,longest:m}}let Ff=e=>{if(!e||e.braid.kind!==`list`)return null;let t=e.braid.tokens.map(e=>e.atom.kind===`note`&&e.repeat===1&&e.elongate===1&&e.subdivide===1?e.atom.value:NaN);return t.some(e=>Number.isNaN(e))?null:t};function If(e,t){let n=e.atom;return n.kind===`note`?{...e,atom:{...n,value:t(n.value)}}:n.kind===`choice`?{...e,atom:{...n,values:n.values.map(t)}}:n.kind===`seq`?{...e,atom:{...n,layers:n.layers.map(e=>e.map(e=>If(e,t)))}}:e}function Lf(e,t,n,r,i){let a=e.braid.kind===`list`?{...e.braid,tokens:e.braid.tokens.map(e=>If(e,e=>t+(n-t)*e))}:e.braid;return{...e,name:r,span:i,braid:a,label:null,about:void 0,...e.style?{style:void 0}:{}}}let Rf=e=>String(Math.round(e*1e9)/1e9);function zf(e,t){let n=new Map(e.cells.map(e=>[e.name,e])),r=[],i=(e,t)=>r.push({severity:`error`,message:e,span:t}),a=e=>{let t=n.get(e.name);if(!t)return null;let r=Ff(t);return t.map?.kind!==`style`||!r||r.length!==ft.length?(i(`style=&${e.name}: a style is a map=style cell (&${e.name} map=style .3 .45 .55 .55), or a mix of them by weight`,e.span),null):r},o=e=>{if(e.kind===`cell`)return a(e.ref);let t=e.terms.map(e=>({v:a(e.ref),w:e.weight}));return t.some(e=>!e.v)?null:ft.map((e,n)=>t.reduce((e,t)=>e+t.w*t.v[n],0))},s=/* @__PURE__ */ new Map;for(let t of e.cells){if(!t.style)continue;let e=o(t.style.from),r=t.style.to?o(t.style.to):null;if(!e||t.style.to&&!r)continue;let a=[e,...r?[r]:[]].flatMap(e=>ft.filter((t,n)=>!(e[n]>=t.range[0]-1e-9&&e[n]<=t.range[1]+1e-9)));if(a.length){i(`&${t.name} style=: its style lies outside the axes on ${[...new Set(a.map(e=>e.name))].join(`, `)} (each ${ft[0].range[0]} to ${ft[0].range[1]}); a mix's weights sum its styles' points`,t.style.span);continue}let c=t.style.curve??null;if(c&&!n.has(c.name))continue;let l=c?n.get(c.name).braid:null;if(c&&!(l?.kind===`list`&&l.tokens.every(e=>e.atom.kind===`note`))){i(`style=a..b * &${c.name}: a curve is a line of numbers from 0 to 1 (&${c.name} map=lin step=1m 0 .5 1)`,c.span);continue}s.set(t.name,{from:e,to:r,curve:c})}let c=/* @__PURE__ */ new Map,l=!1,u=!1,d=e.cells.some(e=>typeof(e.params.play??e.params.trigger)==`string`&&e.braid.kind!==`blank`),f=e=>{if(!e.pick||e.pick.kind!==`at`||!e.pick.abs)return null;let a=e.pick.i,o=n.get(e.name),f=s.get(e.name),p=null,m=ft[a]?.name,h=e=>{let t=n.get(e);return t?.map?.kind===`style`&&m?t.paramCells?.[m]:void 0},g=o?.style,_=g?[g.from,...g.to?[g.to]:[]].flatMap(e=>e.kind===`cell`?[e.ref]:e.terms.map(e=>e.ref)):[],v=o?.map?.kind===`style`?h(e.name):void 0;if(!v&&_.some(e=>h(e.name))&&(g.to||g.from.kind!==`cell`&&g.from.kind!==`mix`))return i(`&${e.name}[${m}]: a range of styles doesn't move with a moving one yet; name the moving style alone, style=&${_.find(e=>h(e.name)).name}`,e.span),null;let y=(t,r,i)=>{let a=e.span,o=(e,t)=>({e:{k:`prod`,factors:[{k:`ref`,ref:{name:e,pick:null,shift:0,span:a}},{k:`num`,value:t,span:a}],span:a},sign:1}),s=[{k:`sum`,items:[...r.map(e=>o(e.cell,e.weight)),...i===0?[]:[{e:{k:`num`,value:i,span:a},sign:1}]],span:a}];return c.set(t,{...c.get(r[0].cell)??n.get(r[0].cell),name:t,span:a,params:{},paramSpans:{},paramCells:void 0,paramClocks:void 0,map:null,step:null,label:null,about:void 0,style:void 0,braid:{kind:`list`,tokens:[{atom:{kind:`mix`,exprs:s},repeat:1,subdivide:1,elongate:1,span:a}]}}),t},b=(e,t,r,a,o)=>{if(c.has(a))return a;let s=Ns(e,n);if(s){let e=s.terms.reduce((e,t)=>e+t.weight,0),n=s.terms.map((e,n)=>({cell:b(e.cell,t,r,`${a}_${n}`,o),weight:e.weight}));return n.some(e=>e.cell===null)?null:y(a,n,t*(1-e)+(r-t)*s.constant)}let l=n.get(e);return l?l.braid.kind===`list`?(c.set(a,Lf(l,t,r,a,o)),a):(i(`${m}=… * &${l.name}: an axis moves by a line of numbers from 0 to 1, like &${l.name} step=1m*8 [0|.25|.5|.75|1], or a sum of them`,o),null):null},x=(e,t)=>{if(e.factors.length!==1||e.factors[0].pick)return i(`${m}=… * &x: an axis moves by one cell, a line of numbers or a sum of them, &drift [&a * .5 + &b * .5] (decision 079)`,e.span),null;let[n,r]=e.range??ft[a].range;return b(e.factors[0].name,n,r,t,e.factors[0].span)};if(v)return x(v,`λ${e.name}_${a}`);if(g?.from.kind===`cell`&&!g.to){let e=h(g.from.ref.name);if(e)return x(e,`λ${g.from.ref.name}_${a}`)}if(g?.from.kind===`mix`&&!g.to&&_.some(e=>h(e.name))){let t=`λ${e.name}_${a}`;if(c.has(t))return t;let r=[],i=0;for(let e of g.from.terms){let t=h(e.ref.name);if(t){let n=x(t,`λ${e.ref.name}_${a}`);if(n===null)return null;r.push({cell:n,weight:e.weight})}else i+=e.weight*(Ff(n.get(e.ref.name))?.[a]??0)}return y(t,r,i)}if(!o&&e.name===`style`)p=Rf(vt[a]),!u&&d&&r.push({severity:`info`,message:`no line writes &${_t}: &${_t}[${ft[a].name}] reads the centre of style space, ${Rf(vt[a])} on each axis (a score names its style as the note &${_t} style=…, decision 063)`,span:e.span}),u=!0;else if(f){let r=f.from[a],i=f.to?f.to[a]:r;f.to&&!f.curve&&(l=!0);let o=f.curve?n.get(f.curve.name):void 0;if(o&&r!==i){let t=`λ${e.name}_${a}`;return c.has(t)||c.set(t,Lf(o,r,i,t,e.span)),t}if(r===i||!t)p=Rf(r);else if(`bars`in t){let e=t.bars*16;p=`map=lin step=1m*16 ${Array.from({length:e},(t,n)=>Rf(r+(i-r)*n/e)).join(` `)}`}else p=`map=lin step=${Rf(1/t.seconds)}hz ${Rf(r)} ${Rf(i)}`}else if(o&&(o.map?.kind===`style`||o.map?.kind===`adsr`)){let e=Ff(o)?.[a];e!==void 0&&(p=Rf(e))}if(p===null)return null;let S=`λ${e.name}_${a}`;if(!c.has(S)){let t=Z(`&styleRead lpf=0..1 * &(${p})`).cells.find(e=>e.name!==`styleRead`);t&&c.set(S,{...t,name:S,span:e.span})}return c.has(S)?S:null},p=!1,m=e.cells.map(e=>{if(!e.paramCells)return e;let t=null;for(let[n,r]of Object.entries(e.paramCells)){let i=r.factors.map(e=>{let t=f(e);return t?{name:t,pick:null,shift:0,span:e.span}:e});i.some((e,t)=>e!==r.factors[t])&&((t??={...e.paramCells})[n]={...r,factors:i})}return t?(p=!0,{...e,paramCells:t}):e});return!p&&!r.length?{parsed:e,glides:l}:{parsed:{...e,cells:[...m,...c.values()],diagnostics:[...e.diagnostics,...r]},glides:l}}function Bf(e,t=_i,n){let r=Vl(e),i=zf(r,null),a=Zl(i.parsed,t,n);if(!i.glides)return a;let o=Vf(a);return o?Zl(zf(r,o).parsed,t,n):a}function Vf(e){let t=e.ok?jf(Pf(e)):null;if(!t||!Number.isFinite(t)||t<=0)return null;let n=e.mainMeter;if(!n||!e.clocks.has(n))return{seconds:t};let r=e.cells.get(n)?.units.length??0;if(!r)return{seconds:t};let i=Ku(e,gi(e)).map(n).stepAt(t)/r;return Math.abs(i-Math.round(i))<1e-6&&Math.round(i)>0?{bars:Math.round(i)}:{seconds:t}}function Hf(e,t=_i,n={}){if(!Qo(e))return Bf(Z(e,{old:n.old??!1}),t);let r=Ss(e,n),i=Bf(Z(r.text,{old:n.old??!1}),t,r.given),a=[...r.diagnostics,...i.diagnostics.map(e=>({...e,span:r.through(e.span.line)??e.span}))].sort((e,t)=>e.span.line-t.span.line||e.span.col-t.span.col);return{...i,ok:!a.some(e=>e.severity===`error`),diagnostics:a,takes:r.takes,...r.origins.size?{origins:r.origins}:{}}}let Uf=e=>Math.abs(e-Math.round(e))<1e-9,Wf=(e,t)=>e.steps>0&&Uf(t*e.rate/e.steps);function Gf(e){for(let t=1;t<=4096;t++)if(Wf(e,t*e.bars))return t;return 0}let Kf=(e,t,n)=>Wf(e,Yi(t,n,e.bars).length);function qf(e,t,n,r){let i=Z(e).cells,a=r??new Set(i.map(e=>e.name)),o=t.mainMeter!==void 0&&a.has(t.mainMeter);return i.flatMap(e=>{let r=e.step;if(r?.kind!==`tap`||n&&!n.has(e.name)||(r.meter?a.has(r.meter.name):o))return[];let i=t.cells.get(e.name);if(!i||i.voice||i.steps<=0)return[];let s=Math.max(1,Math.round(e.cycle??1)),c={cell:`&${e.name}`,meter:r.meter?`&${r.meter.name}`:null,tap:r.tap.written,bars:s,steps:i.steps,rate:r.ratio};return[{need:{...c,bar:Gf(c)},tap:r.tap}]})}let Jf=e=>e.kind===`ref`?e.pick||e.shift||e.transpose||e.values?[e.name]:[]:e.kind===`seq`?e.layers.flatMap(e=>e.flatMap(e=>Jf(e.atom))):[],Yf=e=>new Set(e.flatMap(e=>e.braid.kind===`list`?e.braid.tokens.flatMap(e=>Jf(e.atom)):[]).map(e=>`&${e}`));function Xf(e){let t=new Set(e.flatMap(e=>jc(e)).map(e=>`&${e}`)),n=/* @__PURE__ */ new Set([...e.flatMap(e=>Mc(e)).map(e=>`&${e}`),...Yf(e)]);return e=>t.has(e)&&!n.has(e)}let Zf=(e,t)=>t&&Qo(e)?Ss(e,{resolve:t}).text:e,Qf=e=>`${e} s=white`;function $f(e,t,n){let r=Zf(e,n),i=Z(r).cells,a=i.filter(e=>!e.lambda),o=t(e),s=o.unknown.map(e=>`&${e.name}`),c=a.some(e=>e.over?.name===`key:main`)&&!o.mainKey,l=Xf(i),u=new Set(s.filter(l)),d=new Set(i.map(e=>`&${e.name}`));if(u.size)for(let e of new Set(a.flatMap(e=>jc(e)).map(e=>`&${e}`)))l(e)&&!d.has(e)&&u.add(e);let f=o;for(;u.size;){f=t(`${e}\n${[...u].map(Qf).join(`
`)}`);let n=f.unknown.map(e=>`&${e.name}`).filter(e=>l(e)&&!u.has(e));if(!n.length)break;n.forEach(e=>u.add(e))}let p=[.../* @__PURE__ */ new Set([...s,...u,...c?[`key`]:[]])].sort(),m=p.filter(l),h=Yf(i),g=m.map(Qf).join(`
`),_=g?`${r}\n${g}`:r,v=$o(e);return{uses:p,sounds:m,lines:p.filter(e=>h.has(e)),defines:[.../* @__PURE__ */ new Set([...a.map(e=>`&${e.name}`),...(o.takes??[]).flatMap(e=>e.gave)])],clock:qf(_,g?f:o).map(e=>e.need),...v?{signature:{heads:v.names,optional:v.optional,main:v.main}}:{}}}let ep=/^\s*&([A-Za-z_][A-Za-z0-9_]*)(?=\s|$)/,tp=/[+*,[]\s*$/;function np(e){let t=[],n=null;for(let r of e.split(`
`)){let e=V(r)[0];if(n??={written:[],code:[]},n.written.push(r),n.code.push(e),tp.test(e))continue;let i=n.code.join(` `).trim().split(/\s+/).join(` `),a=ep.exec(i)?.[1];a&&B(i)===void 0&&t.push({name:a,written:n.written.join(`
`),code:i}),n=null}return t}let rp=e=>new Set(e.split(`
`).flatMap(e=>[...V(e)[0].matchAll(/&([A-Za-z_][A-Za-z0-9_]*)/g)]).map(e=>e[1]??``)),ip=e=>e.split(`
`).map(e=>V(e)[0].trim().split(/\s+/).join(` `)).filter(e=>B(e)?.kind===`use`);function ap(e,t){let n=new Map(np(t).map(e=>[e.name,e])),r=/* @__PURE__ */ new Set([...rp(t),...rp(e)]),i=/* @__PURE__ */ new Map;for(;;){let a=e;for(let[e,t]of i)a=Qt(a,e,t);let o=np(a),s=[],c=[];for(let e of o){let t=n.get(e.name);t&&(t.code===e.code?s.push(e.name):c.push(e.name))}if(!c.length){let n=new Set(ip(t)),r=[...ip(e).filter(e=>!n.has(e)),...o.filter(e=>!s.includes(e.name)).map(e=>e.written)],a=t.replace(/\s+$/,``),c=e=>e.map(e=>`&${e}`);return{text:[...a?[a]:[],...r].join(`
`),renamed:new Map([...i].map(([e,t])=>[`&${e}`,`&${t}`])),shared:c(s),names:c([...new Set(o.map(e=>e.name))])}}for(let e of c){let t=2;for(;r.has(`${e}${t}`);)t++;r.add(`${e}${t}`),i.set(e,`${e}${t}`)}}}function op(e,{need:t,tap:n}){let r=t.meter?t.meter.slice(1):e.mainMeter,i=r===void 0?null:e.cells.get(r)?.meter;return!!i&&Kf(t,i,n)}let sp=e=>e.unknown.map(e=>`&${e.name}`),cp=/^(&\w+) (?:is only on a MIDI card: its sound|is named as General MIDI's drum)/,lp=(e,t)=>e.severity===t.severity&&e.message===t.message&&e.span.line===t.span.line&&e.span.col===t.span.col;function up(e,t,n,r){let i=n??(e=>Hf(e,void 0,r?{resolve:r}:{})),a=$f(e,i,r),o=i(t),s=/* @__PURE__ */ new Set([...np(t).map(e=>`&${e.name}`),...(o.takes??[]).flatMap(e=>e.gave)]),c=a.uses.filter(e=>e===`key`?!o.mainKey:!s.has(e)),l=c.filter(e=>a.sounds.includes(e)),u=c.filter(e=>!l.includes(e)),d=Zf(e,r),f=Xf(Z(d).cells),p=ap(e,t),m=a.sounds.map(Qf),h=qf([d,...m].join(`
`),i([e,...m].join(`
`))).filter(e=>!op(o,e)).map(e=>e.need),g={fits:!1,union:p,missing:u,sounds:l,unmet:h};if(u.length||h.length)return g;let _=Z(t).cells,v=Xf(_),y=[...new Set(_.flatMap(e=>jc(e)).map(e=>`&${e}`))].filter(e=>!s.has(e)&&!p.names.includes(e)&&v(e)).map(Qf),b=y.length?i([t,...y].join(`
`)):o,x=()=>[p.text,.../* @__PURE__ */ new Set([...l.map(Qf),...y])].join(`
`),S=i(x());for(;;){let e=sp(S).filter(e=>f(e)&&!l.includes(e)&&!s.has(e)&&!p.names.includes(e));if(!e.length)break;l.push(...e),S=i(x())}l.sort();let C=[...b.diagnostics],w=new Set([...l,...y.map(e=>e.split(` `)[0])].map(e=>e.startsWith(`&`)?e:`&${e}`)),T=S.diagnostics.filter(e=>{let t=cp.exec(e.message);if(t&&w.has(t[1]))return!1;let n=C.findIndex(t=>lp(t,e));return n<0||(C.splice(n,1),!1)}),E=e=>new Set(e.map(e=>e.slice(1))),D=E(p.names.filter(e=>!p.shared.includes(e))),O=qf(x(),S,E(p.names),D).filter(e=>!op(S,e)).map(e=>e.need);return{fits:!T.length&&!O.length,union:p,missing:u,sounds:l,unmet:O,diagnostics:T}}function dp(e,t){let n=/* @__PURE__ */ new Map;return r=>{if(n.has(r)){let e=n.get(r);return n.delete(r),n.set(r,e),e}let i=t(r);return n.set(r,i),n.size>e&&n.delete(n.keys().next().value),i}}function fp(e,t=512){let n=/* @__PURE__ */ new Map,r=(t,r)=>n.get(t)??e(t,r),i=dp(t,e=>Hf(e,void 0,{resolve:r})),a=dp(t,e=>{let{id:t,workbench:n,main:a}=JSON.parse(e);return xp(t,n,{resolve:r,compiled:i,...a===null?{}:{main:a}})});return(e,t,r)=>{let i=`fit_${ns(e).slice(3)}`;return n.set(i,e),a(JSON.stringify({id:i,workbench:t,main:r??null}))}}let pp=/^([^(]*)\((.*)\)$/,mp=/^([^(/]+)\/([^(]+)$/;function hp(e,t,n,r){let i=mp.exec(t),a=i?i[1]:t,o=i&&e.length===1&&e[0]!==`&${i[2]}`&&!e[0].includes(`=`)?[`${e[0]}=${i[2]}`]:e,s=pp.exec(a),c=[...s?[s[2]]:[],...Object.entries(n??{}).map(([e,t])=>`${e}=${t}`)];return`${o.join(`, `)} from ${s?s[1]:a}${c.length?`(${c.join(`, `)})`:``}${r?` ${r}`:``}`}let gp=(e,t)=>t??(t=>Hf(t,void 0,{resolve:e}));function _p(e,t){let n=[...t];return e.diagnostics.filter(e=>{let t=n.findIndex(t=>lp(t,e));return t<0||(n.splice(t,1),!1)})}function vp(e,t,n,r,i,a){let o=i([e,...a].join(`
`)),s=new Set(a.map(e=>e.split(` `)[0])),c=c=>!_p(i([e,hp(n,t,r,c),...a].join(`
`)),o.diagnostics).filter(e=>!s.has(cp.exec(e.message)?.[1]??``)).length,l=Z(e).offers,u=l?.length?l.map(e=>`&${e}`):np(e).map(e=>`&${e.name}`),d=[];for(let e of u)if(!n.includes(e)&&c(e)&&d.push(e)>1)return null;return d[0]??null}function yp(e,t){let n=rp(e),r=t.replace(/^&/,``);if(!n.has(r))return`&${r}`;let i=2;for(;n.has(`${r}${i}`);)i++;return`&${r}${i}`}function bp(e,t,n){let r=gp(n.resolve,n.compiled),i=n.resolve(t),a=e.replace(/\s+$/,``),o=e=>[...a?[a]:[],e].join(`
`),s=e=>r(e).takes?.at(-1)??null,c=i===null?null:$o(i);if(i===null||!c){let e=`* from ${t}`;return{text:o(e),line:e,heads:[],main:null,used:i===null?null:s(o(e))}}let l=c.names.length===1?[n.head??yp(e,c.names[0])]:c.names.map(t=>yp(e,t)),u=$f(i,r,n.resolve).sounds.filter(t=>!rp(e).has(t.slice(1))).map(Qf),d=n.main??(c.main?vp(e,t,l,n.args,r,u):null),f=hp(c.names.length===1?l:l.map((e,t)=>e===c.names[t]?e:`${e}=${c.names[t].slice(1)}`),t,n.args,d);return{text:o(f),line:f,heads:l,main:d,used:s(o(f))}}function xp(e,t,n){let r=gp(n.resolve,n.compiled),i=n.resolve(e);if(i===null)return{fits:!1,text:t,use:null,missing:[],sounds:[],unmet:[]};let a=$o(i);if(!a){let e=up(i,t,r,n.resolve);return{fits:e.fits,text:e.union.text,use:null,union:e.union,missing:e.missing,sounds:e.sounds,unmet:e.unmet,...e.diagnostics?{diagnostics:e.diagnostics}:{}}}let o=bp(t,e,{...n,compiled:r});if(a.main&&o.main===null)return{fits:!1,text:o.text,use:o,missing:[a.main],sounds:[],unmet:[]};let s=new Set(rp(t)),c=$f(i,r,n.resolve).sounds.filter(e=>!s.has(e.slice(1))).sort(),l=c.map(Qf),u=[o.text,...l].join(`
`),d=r(u),f=new Set(c),p=_p(d,r([t,...l].join(`
`)).diagnostics).filter(e=>{let t=cp.exec(e.message);return!(t&&f.has(t[1]))}),m=new Set((o.used?.gave??[]).map(e=>e.slice(1))),h=qf(Ss(u,{resolve:n.resolve}).text,d,m,m).filter(e=>!op(d,e)).map(e=>e.need);return{fits:!p.length&&!h.length,text:o.text,use:o,missing:[],sounds:c,unmet:h,diagnostics:p}}Object.freeze({filed:Object.freeze([]),points:Object.freeze([]),together:Object.freeze([])});let Sp=.1,Cp=(e,t,n=Sp)=>t>0&&n>0?e-n*.1*Math.log1p(Math.min(t,10))/Math.log1p(10):e,wp=e=>typeof e==`number`&&Number.isFinite(e);function Tp(e,t){if(typeof e!=`object`||!e)return[`${t}: not a style point`];let n=Object.entries(e);return n.length?n.flatMap(([e,n])=>wp(n)?[]:[`${t}: ${e} is ${String(n)}, not a number`]):[`${t}: an empty point (no axes)`]}function Ep(e){let t=[],{id:n,text:r,association:i}=e;(typeof n!=`string`||!n.trim())&&t.push(`no id`);let a=typeof n==`string`&&n.trim()?n:`(no id)`;return(typeof r!=`string`||!r.trim())&&t.push(`${a}: no text`),!Array.isArray(i)||!i.length?t.push(`${a}: no style point in its association`):i.forEach((e,n)=>t.push(...Dp(e,`${a}: point ${n+1}`))),t}function Dp(e,t){let n=[];(!e||!wp(e.weight)||e.weight<=0)&&n.push(`${t}: weight ${String(e?.weight)}, not a number > 0`);let r=e?.facet;return r!==void 0&&(typeof r!=`string`||!r.trim())&&n.push(`${t}: facet ${String(r)}, not a name`),n.push(...Tp(e?.point,t)),n}function Op(e){let{filed:t,points:n,together:r}=e,i=[];if(!Array.isArray(t))i.push(`the layer: filed is not a list`);else{let e=/* @__PURE__ */ new Set;t.forEach((t,n)=>{let r=`filed ${n+1}`;if(!t?.fragment)return void i.push(`${r}: no fragment`);i.push(...Ep(t.fragment).map(e=>`${r}: ${e}`)),(typeof t.meta!=`object`||t.meta===null||Array.isArray(t.meta))&&i.push(`${r}: its meta is not a map`),typeof t.prose!=`string`&&i.push(`${r}: its prose is not a string`),e.has(t.fragment.id)&&i.push(`${r}: the id ${t.fragment.id} is filed twice`),e.add(t.fragment.id)})}if(Array.isArray(n)?n.forEach((e,t)=>{let n=`learned point ${t+1}`;(typeof e?.id!=`string`||!e.id.trim())&&i.push(`${n}: no id`),i.push(...Dp(e,n))}):i.push(`the layer: points is not a list`),!Array.isArray(r))i.push(`the layer: together is not a list`);else{let e=/* @__PURE__ */ new Set;r.forEach((t,n)=>{let r=`pair ${n+1}`,a=t?.ids,[o,s]=Array.isArray(a)?a:[];if(!Array.isArray(a)||a.length!==2||typeof o!=`string`||typeof s!=`string`||!o.trim()||!s.trim())return void i.push(`${r}: its ids are not two names`);Pp(o,s)<0||i.push(`${r}: its ids ${o} and ${s} are not two, in order`),Number.isInteger(t?.count)&&t.count>0||i.push(`${r}: its count ${String(t?.count)} is not a whole number > 0`);let c=JSON.stringify([o,s]);e.has(c)&&i.push(`${r}: ${o} and ${s} are counted twice`),e.add(c)})}return i}function kp(e,t,n={}){let r=0,i=0;for(let a of Object.keys(e)){if(!Object.hasOwn(t,a))continue;let o=n[a]??1;r+=o*(e[a]-t[a])**2,i+=o}return i>0?Math.sqrt(r/i):1/0}let Ap=(e,t)=>t===void 0?e.association:e.association.filter(e=>e.facet===void 0||e.facet===t);function jp(e,t,n={},r){return Math.min(...Ap(e,r).map(e=>kp(e.point,t,n)/e.weight))}let Mp=new Map([...Ro].reverse().map(([e,t])=>[t,e])),Np=e=>Mp.get(e)??e,Pp=(e,t)=>{let[n,r]=[Np(e),Np(t)];return n<r?-1:+(n>r)};function Fp(e,t){try{return Ts(e)}catch(n){return t.push(`${String(e?.id)}: ${n instanceof Error?n.message:String(n)}`),[]}}function Ip(e){let t=[],n=e.flatMap(e=>Fp(e,t));t.push(...n.flatMap(Ep));let r=/* @__PURE__ */ new Set;for(let{id:e}of n)r.has(e)&&t.push(`${e}: the id is given twice`),r.add(e);if(t.length)throw Error(`A malformed repository: ${t.join(`; `)}`);let i=[...n],a=t=>{let n=new Map([...e,...t].map(e=>[e.id,e.text]));return e=>n.get(e)??null},o=fp(a(i)),s={fragments:i,filed:/* @__PURE__ */ new Set,together:/* @__PURE__ */ new Map,unheld:[]};function c(e){let t=Op(e);for(let{fragment:n}of Array.isArray(e.filed)?e.filed:[])r.has(n?.id)&&t.push(`the layer files ${n.id}, a seed fragment's id`);if(t.length)throw Error(`A malformed learned layer: ${t.join(`; `)}`);if(!e.filed.length&&!e.points.length&&!e.together.length)return s;let n=e.filed.flatMap(e=>Fp(e.fragment,t));for(let{id:i}of n)r.has(i)&&!e.filed.some(e=>e.fragment.id===i)&&t.push(`the layer files ${i}, a seed fragment's id`);if(t.length)throw Error(`A malformed learned layer: ${t.join(`; `)}`);let a=new Set(n.map(e=>e.id)),o=e=>r.has(e)||a.has(e),c=/* @__PURE__ */ new Map,l=/* @__PURE__ */ new Set;for(let{id:t,point:n,weight:r,facet:i}of e.points){if(!o(t)){l.add(t);continue}let e=c.get(t)??[];e.push({point:n,weight:r,...i===void 0?{}:{facet:i}}),c.set(t,e)}let u=e=>{let t=c.get(e.id);return t?{...e,association:[...e.association,...t]}:e},d=/* @__PURE__ */ new Map,f=(e,t,n)=>{let r=d.get(e)??/* @__PURE__ */ new Map;r.set(t,(r.get(t)??0)+n),d.set(e,r)};for(let{ids:t,count:n}of e.together){let[e,r]=t;for(let e of t)o(e)||l.add(e);o(e)&&o(r)&&(f(e,r,n),f(r,e,n))}return{fragments:[...i.map(u),...n.map(u)],filed:a,together:d,unheld:[...l].sort(Pp)}}return{fragments:i,merge:c,query(e,t,n={},{facet:r,chosen:l=[],workbench:u,layer:d,pull:f=Sp,arguments:p={}}={}){if(!(Number.isInteger(t)&&t>=0))throw Error(`query: k is ${t}, not a whole number ≥ 0`);if(!(wp(f)&&f>=0))throw Error(`query: pull is ${String(f)}, not a number ≥ 0`);let m=[...Object.entries(e).flatMap(([e,t])=>wp(t)?[]:[`${e} is ${String(t)}`]),...Object.entries(n).flatMap(([e,t])=>wp(t)&&t>0?[]:[`${e}'s weight is ${String(t)}`])];if(m.length)throw Error(`query: ${m.join(`, `)}`);let{fragments:h,filed:g,together:_}=d?c(d):s,v=[...new Set(l)],y=e=>{let t=_.get(e),n=0;if(t)for(let e of v)n+=t.get(e)??0;return n},b=h.filter(e=>Ap(e,r).length>0).map(t=>{let i=jp(t,e,n,r);return{fragment:t,distance:i,score:Cp(i,y(t.id),f)}}).sort((e,t)=>e.score-t.score||Number(g.has(t.fragment.id))-Number(g.has(e.fragment.id))||Pp(e.fragment.id,t.fragment.id));if(u===void 0)return b.slice(0,t);let x=d&&h!==i?fp(a([...h,...d.filed.map(e=>e.fragment)])):o,S=e=>{if(r!==void 0)return p[r];for(let t of e.association)if(t.facet!==void 0&&p[t.facet]!==void 0)return p[t.facet]},C=[];for(let e of b){if(C.length>=t)break;x(e.fragment.text,u,S(e.fragment)).fits&&C.push(e)}return C}}}let Lp=[`id`,`association`],Rp=[`point`,`weight`,`facet`,`args`],zp=(e,t)=>e.entries.find(e=>e.key===t);function Bp(e,t){return e.kind===`list`?e.items.map((e,n)=>{let r=`point ${n+1}`;if(e.kind!==`map`)return t.push({line:e.line,message:`${r} is a map (point, weight, facet)`}),{point:{},weight:0};for(let n of e.entries)Rp.includes(n.key)||t.push({line:n.line,message:`${r}: ${n.key} is none of point, weight, facet, args`});let i={},a=zp(e,`point`);if(!a)t.push({line:e.line,message:`${r} has no point`});else if(a.value.kind!==`map`||!a.value.entries.length)t.push({line:a.line,message:`${r}: its point is a map of axes to numbers`});else for(let e of a.value.entries)e.value.kind===`scalar`&&typeof e.value.value==`number`?i[e.key]=e.value.value:t.push({line:e.line,message:`${r}: ${e.key} is ${JSON.stringify(or(e.value))}, not a number`});let o=zp(e,`weight`),s=o?.value.kind===`scalar`?o.value.value:void 0;typeof s!=`number`&&t.push({line:o?.line??e.line,message:`${r}: ${o?`its weight is ${JSON.stringify(or(o.value))}, not a number`:`no weight`}`});let c=zp(e,`facet`),l=c?.value.kind===`scalar`?c.value.value:void 0;c&&typeof l!=`string`&&t.push({line:c.line,message:`${r}: its facet is ${JSON.stringify(or(c.value))}, not a name`});let u=zp(e,`args`),d={};if(u&&(u.value.kind!==`map`||!u.value.entries.length))t.push({line:u.line,message:`${r}: its args are a map of parameters to values`});else if(u&&u.value.kind===`map`)for(let e of u.value.entries){let n=e.value.kind===`scalar`?e.value.value:void 0;typeof n==`string`&&/^[A-Za-z0-9_.#:/+*(),"' -]+$/.test(n)&&!/[&=]/.test(n)||typeof n==`number`?d[e.key]=String(n):t.push({line:e.line,message:`${r}: its arg ${e.key} is ${JSON.stringify(or(e.value))}, not a value (a word, a number, 8n:2/3, meter("7/8"))`})}return{point:i,weight:typeof s==`number`?s:0,...typeof l==`string`?{facet:l}:{},...Object.keys(d).length?{args:d}:{}}}):(t.push({line:e.line,message:"the association is a list of points (`- point: …`)"}),[])}function Vp(e){let t=e.split(/\r?\n/);if(t[0]!==`---`)return{problems:[{line:1,message:"no frontmatter: a fragment file starts with a line `---`"}]};let n=lr(e);if(`problems`in n)return{problems:n.problems.map(e=>/^the frontmatter is a map/.test(e.message)?{...e,message:"the frontmatter is a map (`id: …`, `association: …`)"}:e)};let r=t.indexOf(`---`,1),i=ar(t.slice(1,r).join(`
`),2).node,a=[],o=zp(i,`id`),s=o?.value.kind===`scalar`?o.value.value:void 0;o?typeof s!=`string`&&a.push({line:o.line,message:`the id is ${JSON.stringify(or(o.value))}, not a string: quote it`}):a.push({line:1,message:`no id in the frontmatter`});let c=zp(i,`association`);c||a.push({line:1,message:`no association in the frontmatter`});let l=c?Bp(c.value,a):[];if(a.length)return{problems:a.sort((e,t)=>e.line-t.line)};let u={id:s,text:n.text,association:l},d=Ep(u);return d.length?{problems:d.map(e=>{let t=/point (\d+)/.exec(e);return{line:t?c.value.items[Number(t[1])-1].line:/no text/.test(e)?(n.map?.[0]?.line??r+2)-1:o.line,message:e}})}:{fragment:u,meta:Object.fromEntries(Object.entries(n.frontmatter).filter(([e])=>!Lp.includes(e))),prose:n.prose,layout:n.layout}}function Hp(e){let t=[],n=[],r=/* @__PURE__ */ new Map;for(let[i,a]of Object.entries(e)){let e=Vp(a);if(`problems`in e){n.push(...e.problems.map(e=>`${i}:${e.line}: ${e.message}`));continue}let{id:o}=e.fragment,s=r.get(o);s===void 0?r.set(o,i):n.push(`${i}:${a.split(`
`).findIndex(e=>/^id:/.test(e))+1}: the id ${o} is given twice (first in ${s})`),t.push({path:i,...e})}return n.length?{problems:n}:{files:t}}let Up={"bands/01-band":"---\nid: band\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n    weight: 1\n    facet: band\nsource: seed\n---\n\n```cells\n&band, &drums, &bass, &pad, &stab, &lead, &drumsOut, &bassOut, &padOut, &stabOut, &leadOut, &bassV, &padV, &keysV, &leadV, &sound, &midi from (&drumlines, &bassline, &padline, &stabline, &leadline, &bassLevel, &padLevel, &stabLevel, &leadLevel, &style)\n&band &drums &bass &pad &stab &lead\n&drums, &drumsOut from drums_performer &drumlines\n&bass, &bassOut from bass_performer(bassLevel=&bassLevel, bassV=&bassV) &bassline\n&pad, &padOut from pad_performer(padLevel=&padLevel, padV=&padV) &padline\n&stab, &stabOut from stab_performer(stabLevel=&stabLevel, keysV=&keysV) &stabline\n&lead, &leadOut from lead_performer(leadLevel=&leadLevel, leadV=&leadV) &leadline\n&bassV from bass(style=&style)\n&padV from pad(style=&style)\n&keysV from keys(style=&style)\n&leadV from lead(style=&style)\n&bassLevel map=amp .8\n&padLevel map=amp .8\n&stabLevel map=amp .8\n&leadLevel map=amp .8\n&sound map=sample [&drumsOut, &bassOut * .8, &padOut * .35, &stabOut * .4, &leadOut * .45]\n&midi map=midi &leadOut &bassOut [&padOut, &stabOut] ~!6 &drumsOut\n&drumlines step=1m ~\n&bassline step=1m ~\n&padline step=1m ~\n&stabline step=1m ~\n&leadline step=1m ~\n&style map=style sync=.5 harm=.5 bite=.5 mood=.5\n```\n\nThe default band (decision 063 §1, #391): who plays a score, on what, and where it goes out. A score ends in `* from band(…)`, the same line on every client, and each client's resolver answers `band` with its own; this is the one cells' library holds.\n\n**Its signature** (decision 065; decision 075, #560): its heads, `&band` and the roles, the gates, the voices and the cards, keep their names in the score; its inputs are optional parameters, `(&drumlines, &bassline, &padline, &stabline, &leadline, &bassLevel, &padLevel, &stabLevel, &leadLevel, &style)`. A score passes what it writes, `* from band(bassline=&bassline, …, style=&style)` (`bandLine(score)`, `src/repository/band.ts`). A part it doesn't pass is a tacet, `&bassline step=1m ~`, and says nothing; a level it doesn't pass is .8; a style it doesn't pass is the centre of style space, `&style map=style sync=.5 harm=.5 bite=.5 mood=.5`. A score that took them by name before passes them now, and Migrate writes it.\n\n**Its head, `&band`,** is decision 061's table of performers: the five role cells, `&drums`, `&bass`, `&pad`, `&stab` and `&lead`, so a score's selector over the band (`&form over=&band step=1m …`) reads the client's players. Who plays when is the score's; who they are, the band's.\n\n**The performers** are the seed library's five (decisions 058 and 061), each a copy taken by its signature (decision 065): its role and its gate, `&bass, &bassOut from bass_performer(bassLevel=&bassLevel, bassV=&bassV) &bassline`. The part each plays is the score's, passed as the band's argument (`bassline=&bassline`), and so are its levels (`bassLevel=&bassLevel`). A level the score doesn't pass is the band's own, one level of .8, the performers' default. A part it doesn't pass rests (decision 063 §4).\n\n**The instruments** are the performers' own (`bass`, `keys`, `pad`, `lead`, and 13 of `gm_kit`'s voices), each with a sound. The band takes each pitched one itself, `&bassV from bass(style=&style)`, and passes it to its performer (`bassV=&bassV`), so a score's own `&bassV` is the one played, and `bandAt` replaces the band's line for it. They read the score's style, `&style` (decision 063 §3), passed by the band, which declares it (#560), where Jambot's `timbreOf` reads it (yggi/jambot `packages/engine/src/sound.ts` @ 227aa74): the bass's cutoff opens with bite; the lead blends from a triangle to a square as bite rises, its cutoff opening with it; the chords' attack and release shorten as bite rises (decision 066, #411). The section's style is the composer's: the score writes it and passes it; the band's own `&style` is only its default, the centre.\n\n**Which instrument a performer plays at a style** is the band's choice, made by a query at resolution, not by a line: `resolveBand(score)` answers `band` with this text, each pitched voice the first instrument the library ranks at the score's style that defines it, where that isn't the performer's own (`bandAt`, `src/repository/band.ts`; yggi/jambot#527's rule, moved here). At each of Jambot's eight presets that is the performer's own instrument, so the band plays as written; at Electro swing's point the upright bass, the brass stab and the clarinet, at Spooky's the round bass, the organ, the celesta and the theremin (#366). Each holds its default's register, so MIDI out sends the same notes. Each is voiced for its own point and reads no `&style`: where one plays, the style moves no cutoff of that voice, as it does the default bass's and lead's. The instruments are found at the score's style where it starts, so a section that glides into or out of Electro swing plays the instruments of its first end throughout. A line can't make that choice: a voice reads a style as a moving parameter, and a wave or a set of envelopes is no such parameter.\n\n**The cards:** a sound card that hears every gate, the drums at full, the bass at .8, the lead at .45 and the chords under it (the pad at .35, the stab at .4), as Jambot's synth balances its parts (`PEAK`, yggi/jambot `apps/web/src/audio/voices.ts` @ 227aa74, its chords' several notes each quieter), and a MIDI card on Jambot's channels: 1 the lead, 2 the bass, 3 the pad and the stab, 10 the drums. A person with a fifth synth gives the stab its own channel in their band.\n\nA score played on this band sends the MIDI Jambot's section text sends on its single card (channel, note, velocity, onset and end): its twenty sections at the ten presets, seeds 1 and 2, 0 mismatched (`band.slow.test.ts`).\n\nAssociated once as the facet `band` at the centre of style space, at weight 1: it plays every style, reading the style it is given.\n","bass/01-root-bass":`---
id: root_bass
association:
  - point:
      sync: 0
      harm: 0.3
      bite: 0
      mood: 0.9
    weight: 1
    facet: bass
  - point:
      sync: 0.3
      harm: 0.45
      bite: 0.55
      mood: 0.5
    weight: 1
    facet: bass
  - point:
      sync: 0.35
      harm: 0.55
      bite: 0.65
      mood: 0.65
    weight: 1
    facet: bass
  - point:
      sync: 0.05
      harm: 0.3
      bite: 0
      mood: 0.9
    weight: 1
    facet: bass
  - point:
      sync: 0.1
      harm: 0.12
      bite: 0.5
      mood: 0.95
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
      bite: 1
      mood: 0.825
    weight: 1
    facet: bass
  - point:
      sync: 0.12
      harm: 0
      bite: 1
      mood: 0.4
    weight: 1
    facet: bass
  - point:
      sync: 0.25
      harm: 0.45
      bite: 0.8
      mood: 0.9
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

Also at Happy hardcore's point (sync .25, harm .45, bite .8, mood .9), weight 1: the eurodance bass of [Hypercell](../../examples/hypercell.md), the root on every offbeat eighth, is this line (#572).
`,"bass/03-eighths-bass":"---\nid: eighths_bass\nassociation:\n  - point:\n      sync: 0\n      harm: 0.3\n      bite: 0\n      mood: 0.45\n    weight: 1\n    facet: bass\nsource: seed\nlifted: yggi/jambot packages/engine/src/bass.ts @ 1037a80\n---\n\n```cells\n&bassline from &harm\n&bassline over=&harm step=8n 0!8\n```\n\nJambot's bass pattern `eight`: the root of the chord in force on every eighth (`bass.ts` weighs the downbeat 1, the bar's half 0.9, the others 0.8).\nIts own lines read the host's `&harm` and tap the host's main meter; it has no card (#291): it is the part the bass performer plays (`&bassline`, decision 058), and the workbench's card sends it.\n\nAt a point where the eighths' share of `bass.ts`'s blend is greatest, 0.63: full energy and no sync (the eighths weigh `0.6 × energy × (1 − funk)`, the funk line weighs the sync), and no pump (legato, or a harmony that moves fully).\nThe eighths are what `bass.ts` plays most at no preset, so unlike the others they sit at no preset's point (#209).\nTechno, the preset where their share is greatest (0.24), is as near two of those points (Techno legato, and Techno with its harmony moving), so it sits at the root bass's point with the energy at 1: there `bass.ts` moves from the root alone to the eighths by the energy alone.\n\nWhat `bass.ts` adds that a fixed line doesn't: the fifth one step in five and an octave up one in four, off the downbeat; the thinning by the energy (here 1.15: each eighth sounds but about one in twelve); the octave, the voice leading and the velocity, the performer's.\n\n**Its signature** (decision 065): `&bassline from &harm`. `&bassline from eighths_bass &harm` takes a copy of it, `&harm` its main argument.\n","bass/04-funk-bass":`---
id: funk_bass
association:
  - point:
      sync: 1
      harm: 0.12
      bite: 0.85
      mood: 0.65
    weight: 1
    facet: bass
  - point:
      sync: 0.5
      harm: 0.75
      bite: 0.35
      mood: 0.5
    weight: 1
    facet: bass
  - point:
      sync: 0.75
      harm: 0.85
      bite: 0.45
      mood: 0.9
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
`,"bass/05-walking-bass":"---\nid: walking_bass\nassociation:\n  - point:\n      sync: 0.35\n      harm: 1\n      bite: 0.3\n      mood: 0.85\n    weight: 1\n    facet: bass\n  - point:\n      sync: 0.55\n      harm: 0.75\n      bite: 0.6\n      mood: 0.5\n    weight: 1\n    facet: bass\nsource: seed\nlifted: yggi/jambot packages/engine/src/bass.ts @ 1037a80\n---\n\n```cells\n&bassline from &harm\n&bassline over=&harm step=4n 0 1 2 &bassNext^$-1\n&bassNext over=&harm[>>] 0\n```\n\nJambot's bass pattern `walk`, a note on every beat: the root of the chord in force on one, its third and its fifth, and on the last beat the next chord's root a semitone below (`&bassNext^$-1`: the next chord's root, `over=&harm[>>]`, moved a step of the grid, a semitone).\nThe semitone can't be an index: over the chord in force an accidental moves a degree of the key, so `0b` over `&harm[>>]` is a semitone only where the key's degree below the next root is one.\nIts own lines read the host's `&harm` and tap the host's main meter; it has no card (#291): it is the part the bass performer plays (`&bassline`, decision 058), and the workbench's card sends it.\n\nAt Swing jazz's point, under its meter swung on `8n` (`meter(swing=8n:2/3)`): `bass.ts` walks only where the meter swings its eighths (`eighthSwing`) and the harmony moves (`harm ≥ 2/3`), and there the walk's share of its blend is the greatest it gets, 0.74, the funk line, the pump and the eighths all 0.\nThe swing is the meter's, not a style axis, so the point says only the harmony.\nSwing jazz is the only preset where the walk is what `bass.ts` plays most, and this point is Swing jazz's (#209); at the presets whose harmony moves but whose meter doesn't swing, the pattern played most is associated there and is found before the walk.\n\nWhat `bass.ts` draws that a fixed line chooses: the second and third beats each the third, the fifth or the seventh (the fifth twice over where the chord has none), a third each, so this line is one walk it plays, up through the chord; the approach from below or above, half each, so this one from below. Under a harmony that changes on the bar's half it leads into that change too. The octave, the voice leading and the velocity are the performer's.\nAlso at the point proposed for an Electro swing preset (#349), weight 1: the walk [Electro swing, in pieces](../../examples/electroswing.md) plays. It is placed by hand, not by `bass.ts`'s blend, which has no such preset.\n\n**Its signature** (decision 065): `&bassline from &harm`. `&bassline from walking_bass &harm` takes a copy of it, `&harm` its main argument.\n","bass/06-creeping-bass":`---
id: creeping_bass
association:
  - point:
      sync: 0.2
      harm: 0.9
      bite: 0.3
      mood: 0.3
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
Written by hand for the point proposed for a Spooky preset (sync .2, harm .9, bite .3, mood .3; #349), weight 1, Jambot's to adopt (decision 041).

**Its signature** (decision 065): \`&bassline from &harm\`. \`&bassline from creeping_bass &harm\` takes a copy of it, \`&harm\` its main argument.
`,"bass/07-tiptoe-bass":`---
id: tiptoe_bass
association:
  - point:
      sync: 0.2
      harm: 0.9
      bite: 0.25
      mood: 0.3
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
Near Spooky's point (sync .2, harm .9, bite .3, mood .3; yggi/jambot#517), 0.05 lower in bite, weight 1, as the facet \`bass\`: what the bass plays when \`creeping_bass\` has tired.

**Its signature** (decision 065): \`&bassline from &harm\`. \`&bassline from tiptoe_bass &harm\` takes a copy of it, \`&harm\` its main argument.
`,"bass/08-acid-bass":`---
id: acid_bass
association:
  - point:
      sync: 0.45
      harm: 0.05
      bite: 0.85
      mood: 0.35
    weight: 1
    facet: bass
source: seed
lifted: yggi/cells examples/acid.md @ 014c4c73
---

\`\`\`cells
&bassline from &harm
&bassline over=&harm step=16n 0 0 &r^$12 0 ~ 0 &r^$7 0 &r^$10 ~ 0 &r^$12 0 &r^$3 &r^$5 &r^$7
&r over=&harm 0
\`\`\`

The riff of [Acid-Cell](../../examples/acid.md), its first bar of sixteenths: the root, its octave, the fifth, the minor seventh, the minor third and the fourth, with two rests that let the filter breathe.
The example writes it in A minor's degrees; here it is in semitones above the chord's root (\`&r^$12\` an octave up), so it plays over whatever chord the harmony holds, as a minor riff.
It is the part the bass performer plays (\`&bassline\`, decision 058); its holes are \`&harm\` and a meter.

At Acid's point (sync .45, harm .05, bite .85, mood .35), weight 1, as the facet \`bass\` (#572).
`,"bass/10-octave-bass":`---
id: octave_bass
association:
  - point:
      sync: 0.15
      harm: 0.5
      bite: 0.85
      mood: 0.45
    weight: 1
    facet: bass
  - point:
      sync: 0.3
      harm: 0.7
      bite: 1
      mood: 0.55
    weight: 1
    facet: bass
source: seed
lifted: yggi/cells examples/zell.md @ 014c4c73
---

\`\`\`cells
&bassline from &harm
&bassline over=&harm step=8n 0 3 0 3 0 3 0 3
\`\`\`

The bass of [Zelluläre Aktivität](../../examples/zell.md): the root of the chord in force and its octave, eighth by eighth (\`3\`, a triad's fourth tone, is its root an octave up).
It is the part the bass performer plays (\`&bassline\`, decision 058).

At Elektro's point (sync .15, harm .5, bite .85, mood .45), weight 1, as the facet \`bass\` (#572).
`,"bass/11-drone-bass":`---
id: drone_bass
association:
  - point:
      sync: 0.35
      harm: 0.15
      bite: 0.4
      mood: 0.1
    weight: 1
    facet: bass
source: seed
lifted: yggi/cells examples/ghosts.md @ a8de625f
---

\`\`\`cells
&bassline from &harm
&bassline over=&harm step=1m 0
\`\`\`

The low drone of [Ghost-Cells](../../examples/ghosts.md) as a bass line: the root of the chord in force, held the whole bar.
It is the part the bass performer plays (\`&bassline\`, decision 058).

At Dark ambient's point (sync .35, harm .15, bite .4, mood .1), weight 1, as the facet \`bass\` (#572).
`,"bass/12-continuo-bass":`---
id: continuo_bass
association:
  - point:
      sync: 0.15
      harm: 0.8
      bite: 0.5
      mood: 0.85
    weight: 1
    facet: bass
source: seed
---

\`\`\`cells
&bassline from &harm
&bassline over=&harm step=8n 0 1 2 1 0 1 2 1
\`\`\`

A continuo's broken chord in eighths: the root, the third, the fifth and back, twice a bar, the left hand that keeps a baroque piece moving under its upper voices.
It is the part the bass performer plays (\`&bassline\`, decision 058).

At Baroque's point (sync 0.15, harm 0.8, bite 0.5, mood 0.85), weight 1, as the facet \`bass\` (#542).
`,"bass/13-blues-walk":`---
id: blues_walk
association:
  - point:
      sync: 0.65
      harm: 0.55
      bite: 0.45
      mood: 0.65
    weight: 1
    facet: bass
source: seed
lifted: yggi/cells examples/jazz.md @ b3c0acea
---

\`\`\`cells
&bassline from &harm
&bassline over=&harm step=4n 0 1 2 3
\`\`\`

The bass of [Swing blues](../../examples/jazz.md): the chord in force walked up, root, third, fifth and seventh, a beat each, moved bar by bar with the changes.
It is the part the bass performer plays (\`&bassline\`, decision 058).

At Blues shuffle's point (sync 0.65, harm 0.55, bite 0.45, mood 0.65), weight 1, as the facet \`bass\` (#542).
`,"bass/14-quarter-bass":`---
id: quarter_bass
association:
  - point:
      sync: 0.1
      harm: 0.25
      bite: 0.7
      mood: 0.65
    weight: 1
    facet: bass
source: seed
lifted: yggi/cells examples/sailor.md @ 014c4c73
---

\`\`\`cells
&bassline from &harm
&bassline over=&harm step=4n 0 0 0 0
\`\`\`

The root of the chord in force on every beat, the stamping bass of a shanty sung on deck, as [Drunken Sailor](../../examples/sailor.md) plays it.
It is the part the bass performer plays (\`&bassline\`, decision 058).

At Sea shanty's point (sync 0.1, harm 0.25, bite 0.7, mood 0.65), weight 1, as the facet \`bass\` (#542).
`,"bass/15-tumbao-bass":`---
id: tumbao_bass
association:
  - point:
      sync: 0.9
      harm: 0.5
      bite: 0.7
      mood: 0.75
    weight: 1
    facet: bass
source: seed
---

\`\`\`cells
&bassline from &harm
&bassline over=&harm step=8n ~ ~ ~ 2 ~ ~ 0 ~
\`\`\`

The tumbao: the bass rests on the downbeat, plays the fifth on the and of two and the root on four, held across the bar line: the anticipated bass of son and salsa, which leaves the one to the clave.
It is the part the bass performer plays (\`&bassline\`, decision 058).

At Salsa's point (sync 0.9, harm 0.5, bite 0.7, mood 0.75), weight 1, as the facet \`bass\` (#542).
`,"bass/16-waltz-bass":`---
id: waltz_bass
association:
  - point:
      sync: 0
      harm: 0.7
      bite: 0.3
      mood: 0.9
    weight: 1
    facet: bass
source: seed
---

\`\`\`cells
&bassline from &harm
&bassline over=&harm step=4n 0 ~ ~
\`\`\`

The waltz's "oom": the root on the first beat of each bar of 3/4, the two light beats left to the chords.
It is the part the bass performer plays (\`&bassline\`, decision 058).

At Waltz's point (sync 0, harm 0.7, bite 0.3, mood 0.9), weight 1, as the facet \`bass\` (#542).
`,"bass/17-oom-pah-bass":`---
id: oom_pah_bass
association:
  - point:
      sync: 0
      harm: 0.1
      bite: 0.75
      mood: 0.7
    weight: 1
    facet: bass
source: seed
---

\`\`\`cells
&bassline from &harm
&bassline over=&harm step=4n 0 2
\`\`\`

The tuba's oom-pah: the root on one, the fifth on two, a march's bass in 2/4.
It is the part the bass performer plays (\`&bassline\`, decision 058).

At March's point (sync 0, harm 0.1, bite 0.75, mood 0.7), weight 1, as the facet \`bass\` (#542).
`,"bass/18-dub-bass":`---
id: dub_bass
association:
  - point:
      sync: 0.7
      harm: 0.2
      bite: 0.2
      mood: 0.25
    weight: 1
    facet: bass
source: seed
---

\`\`\`cells
&bassline from &harm
&bassline over=&harm step=8n 0@4 ~ 0 2@2
\`\`\`

A dub bass: the root held for half the bar, struck again off the beat and falling back to the fifth, deep and slow under the beat.
It is the part the bass performer plays (\`&bassline\`, decision 058).

At Trip-hop's point (sync 0.7, harm 0.2, bite 0.2, mood 0.25), weight 1, as the facet \`bass\` (#542).
`,"expression/01-vibrato":`---
id: vibrato
association:
  - point:
      sync: 0.5
      harm: 0.5
      bite: 0.5
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
`,"expression/02-envelopes":"---\nid: envelopes\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n    weight: 0.25\n    facet: expression\nsource: seed\n---\n\n```cells\n&click map=adsr 0 .03 0 .02\n&tap map=adsr 0 .08 0 .04\n&snap map=adsr 0 .12 0 .05\n&thump map=adsr 0 .3 0 .05\n&strike map=adsr .005 .15 .5 .05\n&pluck map=adsr .005 .25 .5 .1\n&swell map=adsr .02 .3 .5 .3\n```\n\nThe shapes a note's level takes, by name (#196): a voice's `env=` (`&hh s=white hpf=8000 env=&click`), each attack, decay, sustain and release in seconds and a level, as `map=adsr` reads them.\nThey are the seven the examples wrote out most, each from its most common spelling:\n- **Struck, nothing held:** `&click` (a hat, a rim, a tick, 30 ms), `&tap` (80 ms), `&snap` (a snare, 120 ms), `&thump` (a kick, 300 ms).\n- **Held:** `&strike` (a stab, struck and held at half), `&pluck` (a plucked string, a quarter second to half), `&swell` (a pad: a soft attack, a long release).\n\nAn envelope near one of them, each value within a fifth of it, became it in the examples (the owner, #196: \"collapse … minimal differences … as long as the 'spirit and style of the piece' is preserved\"); one that is a piece's own, slower, longer or shaped otherwise, stays as the piece writes it.\nThe names are no performer's (`&stab`, `&pad`, `&lead`, `&keys` are role cells, decision 061), so a piece that plays those parts takes these too.\n\nIt defines cells and uses nothing, so it fits any workbench. Associated once, as the facet `expression`, as `vibrato` is: at the centre of style space, at a quarter weight.\n","forms/01-call-and-answer":'---\nid: call_and_answer\nassociation:\n  - point:\n      sync: 0.75\n      harm: 0.35\n      bite: 0.65\n    weight: 1\n    facet: form\nsource: seed\n---\n\n```cells\n&phrase from (&answer) &call\n&phrase step=8n &call &answer\n&answer step=8n &call^-2\n```\n\nThe call and its answer: the call, then the call two degrees down, as blues and West African music answer a call, and as Jambot\'s lead lifts a line (an operator on the call, decision 052). Its hole is `&call`; `&answer` is its helper, an operator on the call by default, which a piece overrides by naming it (`use &phrase, &answer from call_and_answer`, decision 059).\nWith a one-bar call it is 2 bars, with a two-bar call 4.\nIt taps the host\'s meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid\'s rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &phrase`), or a piece splices it where it likes.\nAt `sync .75 harm .35 bite .65`, as the facet `form`, weight 1: where its idiom is, a syncopated groove over a harmony that hardly moves, struck, as in funk, the blues, West African music and dance (#371; the owner, 2026-11-09: "form follows idiom"). It names no mood: a form fits any. Of `styles`, Funk and Acid find it first (`npm run coverage -- --facet form`).\n\n**Its signature** (decision 065): `&phrase from (&answer) &call`. `&phrase from call_and_answer &motif` takes a copy of it, `&call` its main argument; `&answer` an optional parameter, its line its default (`"call_and_answer"(answer=…)`).\n',"forms/02-sentence":"---\nid: sentence\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.55\n      bite: 0.5\n    weight: 1\n    facet: form\nsource: seed\n---\n\n```cells\n&sentence from (&continuation) &call\n&sentence step=8n &call &call^1 &continuation\n&continuation step=8n inverse(&call) &call[::-1]\n```\n\nCaplin's sentence: a presentation, the idea and the idea moved a degree up, then a continuation as long, here the idea mirrored (`inverse(&call)`) and the idea backwards (`&call[::-1]`), the material broken up as a continuation does. Its hole is `&call`; `&continuation` is its helper, a piece's to override by naming it.\nWith a one-bar call it is 4 bars, with a two-bar call 8.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &sentence`), or a piece splices it where it likes.\nAt `sync .2 harm .55 bite .5`, as the facet `form`, weight 1: where its idiom is, on the beat, over a harmony that moves on in its continuation, neither legato nor struck, as in a classical theme and a pop verse built on a riff (#371; the owner, 2026-11-09: \"form follows idiom\"). It names no mood: a form fits any. Of `styles`, Synth-pop, Techno, Deep house, Happy hardcore and Elektro find it first (Techno 0.43 away, past Jambot's miss distance of 0.3; `npm run coverage -- --facet form`).\n\n**Its signature** (decision 065): `&sentence from (&continuation) &call`. `&sentence from sentence &motif` takes a copy of it, `&call` its main argument; `&continuation` an optional parameter, its line its default (`sentence(continuation=…)`).\n","forms/03-period":"---\nid: period\nassociation:\n  - point:\n      sync: 0.15\n      harm: 0.4\n      bite: 0.3\n    weight: 1\n    facet: form\nsource: seed\n---\n\n```cells\n&period from (&antecedent, &consequent) &call\n&period step=8n &antecedent &consequent\n&antecedent step=8n &call &call^1\n&consequent step=8n &call &call^-1\n```\n\nA period: an antecedent and a consequent, the same start, a different end. The antecedent ends a degree above the call (open), the consequent a degree below (closed). Its hole is `&call`; `&antecedent` and `&consequent` are its helpers, a piece's to override by naming them.\nWith a one-bar call it is 4 bars, with a two-bar call 8.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &period`), or a piece splices it where it likes.\nAt `sync .15 harm .4 bite .3`, as the facet `form`, weight 1: where its idiom is, on the beat, a half cadence answered by a full one, sung legato, as in a classical period, a folk song and a lullaby (#371; the owner, 2026-11-09: \"form follows idiom\"). It names no mood: a form fits any. Of `styles`, Ambient and Dark ambient find it first (`npm run coverage -- --facet form`).\n\n**Its signature** (decision 065): `&period from (&antecedent, &consequent) &call`. `&period from period &motif` takes a copy of it, `&call` its main argument; `&antecedent`, `&consequent` optional parameters, their lines their defaults (`period(antecedent=…)`).\n","forms/04-aaba":"---\nid: AABA\nassociation:\n  - point:\n      sync: 0.45\n      harm: 0.85\n      bite: 0.4\n    weight: 1\n    facet: form\nsource: seed\n---\n\n```cells\n&chorus from (&b) &a\n&chorus step=8n &a &a &b &a\n&b step=8n &a^3\n```\n\nThe thirty-two-bar song form, AABA, in its letters: an A three times, the bridge before the last. Its holes are `&a`, not `&call`, because an A is often a phrase itself (`&a step=8n &phrase`, the call and answer), and the bridge `&b` is its helper, A moved a fourth up by default, a piece's to override by naming it (`use &chorus, &b from AABA`).\nWith a one-bar A it is 4 bars, with a two-bar A 8.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &chorus`), or a piece splices it where it likes.\nAt `sync .45 harm .85 bite .4`, as the facet `form`, weight 1: where its idiom is, a moving, rich harmony, swung a little and played smoothly, as in the jazz standards and the songs of Tin Pan Alley (#371; the owner, 2026-11-09: \"form follows idiom\"). It names no mood: a form fits any. Of `styles`, Lo-fi hip hop, Bossa nova, Swing jazz, Electro swing and Spooky find it first (`npm run coverage -- --facet form`).\n\n**Its signature** (decision 065): `&chorus from (&b) &a`. `&chorus from AABA &motif` takes a copy of it, `&a` its main argument; `&b` an optional parameter, its line its default (`AABA(b=…)`).\n","forms/05-ternary":"---\nid: ternary\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.12\n      bite: 0.5\n    weight: 0.5\n    facet: form\nsource: seed\n---\n\n```cells\n&song from (&answer, &bridge) &call\n&song step=8n &call &answer &bridge &bridge &call &answer\n&answer step=8n &call^-2\n&bridge step=8n &answer^1\n```\n\nThe ternary song, A B A, as Twinkle has it: the call and its answer, the bridge twice, then the call and its answer again. Its hole is `&call`; `&answer` is its helper, the call two degrees down by default, and `&bridge` the answer a step up, as Twinkle's middle line is its second a step up. A piece names them to override them: `&song from ternary(answer=&wonder) &twinkle` is Twinkle whole, its bridge *up above the world so high*.\nWith a one-bar call it is 6 bars, with a two-bar call 12.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &song`), or a piece splices it where it likes.\nAt the tune's own point, not the centre of style space (#371): a children's song's form, as the facet `form`, at weight 0.5, so its distance counts double and it is found first only near the tune, not at a preset's point the centre's forms are nearer to (Techno, Ambient).\n\n**Its signature** (decision 065): `&song from (&answer, &bridge) &call`. `&song from ternary &motif` takes a copy of it, `&call` its main argument; &answer, &bridge optional parameters, their lines their defaults.\n","forms/06-rounded-binary":"---\nid: rounded_binary\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.12\n      bite: 0.6\n    weight: 0.5\n    facet: form\nsource: seed\n---\n\n```cells\n&song from (&answer, &close, &bridge) &call\n&song step=8n &call &answer &call &close &bridge &bridge^1 &call &close\n&answer step=8n &call^1\n&close step=8n &call^-2\n&bridge step=8n &call^-3\n```\n\nThe rounded binary song, A A′ B A′, as Hänschen klein has it: the call and its open answer, the call and its closing answer, a bridge and the bridge a step up, then the call and its close again. Its hole is `&call`; `&answer` (the call a step up), `&close` (two degrees down) and `&bridge` (three down) are its helpers. A piece names them to override them: `&song from rounded_binary(answer=&hinein, close=&heim, bridge=&weinet) &haenschen` is Hänschen klein whole.\nWith a one-bar call it is 8 bars, with a two-bar call 16.\nIt taps the host's meter by the eighth (`step=8n`), and a splice plays its whole line at the splicing braid's rate, so a motif written in eighths keeps its rhythm in it. It has no voice and no card (#291): the lead performer plays it as its `&leadline` (`&leadline step=8n &song`), or a piece splices it where it likes.\nAt the tune's own point, not the centre of style space (#371): a children's song's form, as the facet `form`, at weight 0.5, so its distance counts double and it is found first only near the tune, not at a preset's point the centre's forms are nearer to (Techno, Ambient).\n\n**Its signature** (decision 065): `&song from (&answer, &close, &bridge) &call`. `&song from rounded_binary &motif` takes a copy of it, `&call` its main argument; &answer, &close, &bridge optional parameters, their lines their defaults.\n","harmony/01-tonic-vamp":`---
id: tonic_vamp
association:
  - point:
      sync: 0.12
      harm: 0
      bite: 1
      mood: 0.4
    weight: 1
    facet: harmony
  - point:
      sync: 1
      harm: 0.12
      bite: 0.85
      mood: 0.65
    weight: 1
    facet: harmony
  - point:
      sync: 0.45
      harm: 0.05
      bite: 0.85
      mood: 0.35
    weight: 0.4
    facet: harmony
  - point:
      sync: 0.35
      harm: 0.15
      bite: 0.4
      mood: 0.1
    weight: 0.4
    facet: harmony
source: seed
lifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=8 [0,2,4]!8
\`\`\`

A vamp of Jambot's themes (\`themes.ts\`, \`VAMPS\`), eight bars over the host's key: the triad on the key's first degree for all eight bars: the vamp \`[0]\`, a stack of degrees \`&key\` reads (the chord in force a bass or a comp reads, \`over=&harm\`).
It defines \`&harm\` and uses the host's \`&key\` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.
The mode is the host key's, so one text is every mode's vamp that has these degrees: \`aeolian\`, \`dorian\`.

The layout is \`buildTheme\`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (\`chords[1 % n]\`, the first again for a vamp of one).
From 0.15 to 0.33 it lays the same chords two bars each, twice over (\`[0, 0, c, c]\`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.

At the points where \`buildTheme\` plays it: aeolian at Techno's point; dorian at Funk's point. A mode's vamps are drawn alike (\`next() · vamps.length\`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.

**Its signature** (decision 065): \`&harm from &key\`. \`&harm from tonic_vamp &key\` takes a copy of it, \`&key\` its main argument.

Also at Acid's point (sync .45, harm .05, bite .85, mood .35), weight 0.4: Acid holds one chord, and at weight 1 the vamp would be Synth-pop's first harmony, 0.272 away (#572). Likewise at Dark ambient's (sync .35, harm .15, bite .4, mood .1), weight 0.4: its drone holds one chord.
`,"harmony/02-vamp-to-the-seventh":`---
id: vamp_to_the_seventh
association:
  - point:
      sync: 0.12
      harm: 0
      bite: 1
      mood: 0.4
    weight: 1
    facet: harmony
  - point:
      sync: 1
      harm: 0.12
      bite: 0.85
      mood: 0.65
    weight: 1
    facet: harmony
  - point:
      sync: 0.1
      harm: 0.25
      bite: 0.7
      mood: 0.65
    weight: 0.4
    facet: harmony
source: seed
lifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=8 [0,2,4]!4 [6,8,10]!4
\`\`\`

A vamp of Jambot's themes (\`themes.ts\`, \`VAMPS\`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its seventh (degree 6) for four: the vamp \`[0, 6]\`, a stack of degrees \`&key\` reads (the chord in force a bass or a comp reads, \`over=&harm\`).
It defines \`&harm\` and uses the host's \`&key\` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.
The mode is the host key's, so one text is every mode's vamp that has these degrees: \`aeolian\`, \`dorian\`, \`mixolydian\`. No preset of Jambot's is mixolydian, so mixolydian gives it no point of its own.

The layout is \`buildTheme\`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (\`chords[1 % n]\`, the first again for a vamp of one).
From 0.15 to 0.33 it lays the same chords two bars each, twice over (\`[0, 0, c, c]\`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.

At the points where \`buildTheme\` plays it: aeolian at Techno's point; dorian at Funk's point. A mode's vamps are drawn alike (\`next() · vamps.length\`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.

**Its signature** (decision 065): \`&harm from &key\`. \`&harm from vamp_to_the_seventh &key\` takes a copy of it, \`&key\` its main argument.

Also at Sea shanty's point (sync .1, harm .25, bite .7, mood .65), weight 0.4: *Drunken Sailor* turns on the same two chords, i and VII; at weight 1 the vamp would be Synth-pop's first harmony (#542).
`,"harmony/03-vamp-to-the-fourth":"---\nid: vamp_to_the_fourth\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      bite: 1\n      mood: 0.4\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 1\n      harm: 0.12\n      bite: 0.85\n      mood: 0.65\n    weight: 1\n    facet: harmony\n  - point:\n      sync: 0.05\n      harm: 0.12\n      bite: 0\n      mood: 0.9\n    weight: 1\n    facet: harmony\nsource: seed\nlifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4]!4 [3,5,7]!4\n```\n\nA vamp of Jambot's themes (`themes.ts`, `VAMPS`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its fourth (degree 3) for four: the vamp `[0, 3]`, a stack of degrees `&key` reads (the chord in force a bass or a comp reads, `over=&harm`).\nIt defines `&harm` and uses the host's `&key` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.\nThe mode is the host key's, so one text is every mode's vamp that has these degrees: `aeolian`, `dorian`, `ionian`, `mixolydian`. No preset of Jambot's is mixolydian, so mixolydian gives it no point of its own.\n\nThe layout is `buildTheme`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (`chords[1 % n]`, the first again for a vamp of one).\nFrom 0.15 to 0.33 it lays the same chords two bars each, twice over (`[0, 0, c, c]`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.\n\nAt the points where `buildTheme` plays it: aeolian at Techno's point; dorian at Funk's point; ionian at Ambient's point with its harmony at 0.12. A mode's vamps are drawn alike (`next() · vamps.length`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from vamp_to_the_fourth &key` takes a copy of it, `&key` its main argument.\n","harmony/04-vamp-to-the-sixth":`---
id: vamp_to_the_sixth
association:
  - point:
      sync: 0.12
      harm: 0
      bite: 1
      mood: 0.4
    weight: 1
    facet: harmony
  - point:
      sync: 0.05
      harm: 0.12
      bite: 0
      mood: 0.9
    weight: 1
    facet: harmony
  - point:
      sync: 0.7
      harm: 0.2
      bite: 0.2
      mood: 0.25
    weight: 0.4
    facet: harmony
source: seed
lifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=8 [0,2,4]!4 [5,7,9]!4
\`\`\`

A vamp of Jambot's themes (\`themes.ts\`, \`VAMPS\`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its sixth (degree 5) for four: the vamp \`[0, 5]\`, a stack of degrees \`&key\` reads (the chord in force a bass or a comp reads, \`over=&harm\`).
It defines \`&harm\` and uses the host's \`&key\` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.
The mode is the host key's, so one text is every mode's vamp that has these degrees: \`aeolian\`, \`ionian\`.

The layout is \`buildTheme\`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (\`chords[1 % n]\`, the first again for a vamp of one).
From 0.15 to 0.33 it lays the same chords two bars each, twice over (\`[0, 0, c, c]\`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.

At the points where \`buildTheme\` plays it: aeolian at Techno's point; ionian at Ambient's point with its harmony at 0.12. A mode's vamps are drawn alike (\`next() · vamps.length\`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.

**Its signature** (decision 065): \`&harm from &key\`. \`&harm from vamp_to_the_sixth &key\` takes a copy of it, \`&key\` its main argument.

**At Trip-hop's point too** (#542), weight 0.4: in a minor key, i to VI, the two chords trip-hop leans on.
`,"harmony/05-vamp-to-the-fifth":`---
id: vamp_to_the_fifth
association:
  - point:
      sync: 0.05
      harm: 0.12
      bite: 0
      mood: 0.9
    weight: 1
    facet: harmony
  - point:
      sync: 0.1
      harm: 0.12
      bite: 0.5
      mood: 0.95
    weight: 0.5
    facet: harmony
  - point:
      sync: 0
      harm: 0.7
      bite: 0.3
      mood: 0.9
    weight: 0.4
    facet: harmony
  - point:
      sync: 0
      harm: 0.1
      bite: 0.75
      mood: 0.7
    weight: 0.4
    facet: harmony
source: seed
lifted: yggi/jambot packages/engine/src/themes.ts @ 0a56da9
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=8 [0,2,4]!4 [4,6,8]!4
\`\`\`

A vamp of Jambot's themes (\`themes.ts\`, \`VAMPS\`), eight bars over the host's key: the triad on the key's first degree for four bars, then the one on its fifth (degree 4) for four: the vamp \`[0, 4]\`, a stack of degrees \`&key\` reads (the chord in force a bass or a comp reads, \`over=&harm\`).
It defines \`&harm\` and uses the host's \`&key\` and main meter, so it fits any workbench that writes those first; it has no card, and plays only through what reads it.
The mode is the host key's, so one text is every mode's vamp that has these degrees: \`ionian\`.

The layout is \`buildTheme\`'s under harm 0.15, one chord per four bars: the first four bars the vamp's first chord, the second four its second (\`chords[1 % n]\`, the first again for a vamp of one).
From 0.15 to 0.33 it lays the same chords two bars each, twice over (\`[0, 0, c, c]\`), and over 0.33 it walks the mode's transition table instead, which stays Jambot's generator on a miss.

At the points where \`buildTheme\` plays it: ionian at Ambient's point with its harmony at 0.12. A mode's vamps are drawn alike (\`next() · vamps.length\`), so each weighs 1, and a query for the harmony at a mode's point finds all of that mode's vamps at distance 0.
At \`KINDERLIED\` too (\`styles\`): the tonic and the dominant of a children's song, under Twinkle's and Hänschen klein's motifs, with ionian there (yggi/jambot#547, the owner, 2026-11-04). There at weight 0.5, so its distance counts double: at weight 1 Deep house's point would find it first within 0.3, which the fence of #404 (\`library.test.ts\`) forbids.

**Its signature** (decision 065): \`&harm from &key\`. \`&harm from vamp_to_the_fifth &key\` takes a copy of it, \`&key\` its main argument.

**At Waltz's and March's points too** (#542), weight 0.4: the tonic and the dominant, four bars each, is the harmony of both.
`,"harmony/06-dark-cadence":`---
id: dark_cadence
association:
  - point:
      sync: 0.2
      harm: 0.9
      bite: 0.3
      mood: 0.3
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
Written by hand for the point proposed for a Spooky preset (sync .2, harm .9, bite .3, mood .3; #349), Jambot's to adopt (decision 041), at weight 0.4: at weight 1 it was the nearest harmony to five other presets, all within Jambot's miss distance (0.3), so a composer that read four-bar laps would play it there (#404); at 0.4 every other preset is beyond it.

**Its signature** (decision 065): \`&harm from &key\`. \`&harm from dark_cadence &key\` takes a copy of it, \`&key\` its main argument.
`,"harmony/07-haunted-progression":"---\nid: haunted_progression\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      bite: 0.25\n      mood: 0.3\n    weight: 0.4\n    facet: harmony\nsource: seed\n---\n\n```cells\n&harm from &key\n&harm over=&key step=1m cycle=8 [0,2,4] [2,4,6] [3,5,7] [4,6,8] [5,7,9] [1,3,5] [4,6,8] [0,2,4]\n```\n\nEight bars over the host's key, a chord a bar: the tonic, the third, the fourth, the fifth, the sixth, the second, the fifth again and home (i, III+, iv, V, ♭VI, ii°, V, i in a minor key).\nIn harmonic minor, the key Spooky's point finds, the third is an augmented triad (F A C♯ over D), the ghost-house chord that leans nowhere, and the second a diminished one (E G B♭), so the progression passes through both of the key's unstable triads before the dominant brings it home.\nIt is eight bars long, a section's, so Jambot's composer reads it as a progression (`packages/engine/src/harmony-query.ts`), unlike the four bars of `dark_cadence`; its chords are all the key's own triads, the only kind a progression's slot holds there.\nIt defines `&harm` and uses the host's `&key` and main meter; it has no card, and plays only through what reads it.\nNear Spooky's point (sync .2, harm .9, bite .3, mood .3; yggi/jambot#517), 0.05 lower in bite (its energy offset, #572), as the facet `harmony`, at weight 0.4, as `dark_cadence` is, so it is found within Jambot's miss distance (0.3) of Spooky alone, and behind `dark_cadence` wherever both are farther: at weight 1 it was the nearest harmony to Synth-pop, Lo-fi hip hop, Bossa nova and Swing jazz (0.18 to 0.3), which find none of their own there and would have played it (#404).\n\n**Its signature** (decision 065): `&harm from &key`. `&harm from haunted_progression &key` takes a copy of it, `&key` its main argument.\n","harmony/08-axis-progression":`---
id: axis_progression
association:
  - point:
      sync: 0.25
      harm: 0.45
      bite: 0.8
      mood: 0.9
    weight: 0.4
    facet: harmony
  - point:
      sync: 0.15
      harm: 0.5
      bite: 0.85
      mood: 0.45
    weight: 0.4
    facet: harmony
  - point:
      sync: 0.3
      harm: 0.45
      bite: 0.55
      mood: 0.5
    weight: 0.4
    facet: harmony
source: seed
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=4 [0,2,4] [5,7,9] [2,4,6] [6,8,10]
\`\`\`

A minor key's i, VI, III and VII, a bar each: in A minor, A F C G, the progression [Hypercell](../../examples/hypercell.md) and [Zelluläre Aktivität](../../examples/zell.md) both turn on (the axis progression begun on its minor chord, vi IV I V of the relative major).

At Happy hardcore's point (sync .25, harm .45, bite .8, mood .9) and Elektro's (sync .15, harm .5, bite .85, mood .45), weight 0.4 (a weight of 1 would make it the first harmony within the miss distance at Synth-pop, Deep house and Electro swing, #572), as the facet \`harmony\` (#572): two styles that share a progression and part on bite and mood.

**At Synth-pop's point too** (#540), weight 0.4: i VI III VII is the synth-pop progression as much as it is eurodance's.
`,"harmony/09-fifths-sequence":`---
id: fifths_sequence
association:
  - point:
      sync: 0.15
      harm: 0.8
      bite: 0.5
      mood: 0.85
    weight: 0.4
    facet: harmony
source: seed
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=8 [0,2,4] [3,5,7] [6,8,10] [2,4,6] [5,7,9] [1,3,5] [4,6,8] [0,2,4]
\`\`\`

The baroque sequence of falling fifths: I IV vii° iii vi ii V I, a bar each, every root a fifth below the last, the progression under countless preludes, chaconnes and concerto episodes, Bach's among them ([Bach, Prelude in C](../../examples/prelude.md) moves through it in its middle bars).

At Baroque's point (sync 0.15, harm 0.8, bite 0.5, mood 0.85), weight 0.4, as the facet \`harmony\` (#542): at 1 it would be the first harmony within the miss distance at styles it was not placed for.
`,"harmony/10-twelve-bar":`---
id: twelve_bar
association:
  - point:
      sync: 0.65
      harm: 0.55
      bite: 0.45
      mood: 0.65
    weight: 0.4
    facet: harmony
source: seed
lifted: yggi/cells examples/jazz.md @ b3c0acea
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=12 [0,2,4,6]!4 [3,5,7,9]!2 [0,2,4,6]!2 [4,6,8,10] [3,5,7,9] [0,2,4,6] [4,6,8,10]
\`\`\`

The 12-bar blues of [Swing blues: 12 bars in C](../../examples/jazz.md): I I I I · IV IV I I · V IV I V, a bar each, every chord with its seventh. In a mixolydian key the I and the IV are dominant sevenths, as the blues plays them; the V is the key's own, minor.

At Blues shuffle's point (sync 0.65, harm 0.55, bite 0.45, mood 0.65), weight 0.4, as the facet \`harmony\` (#542): at 1 it would be the first harmony within the miss distance at styles it was not placed for.
`,"harmony/11-korobeiniki-changes":`---
id: korobeiniki_changes
association:
  - point:
      sync: 0.3
      harm: 0.7
      bite: 1
      mood: 0.55
    weight: 0.4
    facet: harmony
source: seed
lifted: yggi/cells examples/korobeiniki.md @ a8de625f
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=8 [0,2,4] [0,2,4] [4,6,8] [0,2,4] [3,5,7] [0,2,4] [4,6,8] [0,2,4]
\`\`\`

The changes of [Korobeiniki](../../examples/korobeiniki.md): i i V i iv i V i, a bar each. In a harmonic minor key its V is major, the leading tone the tune leans on.

At Chiptune's point (sync 0.3, harm 0.7, bite 1, mood 0.55), weight 0.4, as the facet \`harmony\` (#542): at 1 it would be the first harmony within the miss distance at Synth-pop, Deep house and Electro swing.
`,"harmony/12-montuno":`---
id: montuno
association:
  - point:
      sync: 0.9
      harm: 0.5
      bite: 0.7
      mood: 0.75
    weight: 0.4
    facet: harmony
source: seed
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=4 [0,2,4] [3,5,7] [4,6,8] [3,5,7]
\`\`\`

The montuno's vamp: I IV V IV, a bar each, round and round under the soloists and the coro.

At Salsa's point (sync 0.9, harm 0.5, bite 0.7, mood 0.75), weight 0.4, as the facet \`harmony\` (#542).
`,"harmony/13-ninth-vamp":`---
id: ninth_vamp
association:
  - point:
      sync: 0.35
      harm: 0.55
      bite: 0.65
      mood: 0.65
    weight: 1
    facet: harmony
source: seed
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=4 [0,2,4,6,8]!2 [3,5,7,9,11]!2
\`\`\`

Deep house's vamp: the tonic's ninth chord for two bars, then the fourth's for two, round and round. In a dorian key, D, it is Dm9 to G9, the minor ninth over the dorian's major fourth: the warm, unresolved sway of a deep house pad.

At Deep house's point (sync 0.35, harm 0.55, bite 0.65, mood 0.65), weight 1, as the facet \`harmony\` (#540).
`,"harmony/14-ninth-loop":`---
id: ninth_loop
association:
  - point:
      sync: 0.5
      harm: 0.75
      bite: 0.35
      mood: 0.5
    weight: 1
    facet: harmony
source: seed
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=4 [0,2,4,6,8] [5,7,9,11,13] [3,5,7,9,11] [4,6,8,10]
\`\`\`

A lo-fi hip hop loop of ninths: i9, VImaj9, iv9 and v7, a bar each. In A minor, Am9 Fmaj9 Dm9 Em7: the soft, jazzy colour a sampled Rhodes loop gives a beat (the fifth stays a seventh, since its ninth would be a flat ninth in the minor key).

At Lo-fi hip hop's point (sync 0.5, harm 0.75, bite 0.35, mood 0.5), weight 1, as the facet \`harmony\` (#540).
`,"harmony/15-turnaround":`---
id: turnaround
association:
  - point:
      sync: 0.35
      harm: 1
      bite: 0.3
      mood: 0.85
    weight: 1
    facet: harmony
source: seed
---

\`\`\`cells
&harm from &key
&harm over=&key step=2n cycle=2 [0,2,4,6,8] [5,7,9,11,13] [1,3,5,7,9] [4,6,8,10,12]
\`\`\`

The jazz turnaround: I, vi, ii and V, two to the bar, each a ninth chord. In C, Cmaj9 Am9 Dm9 G9, the changes that close a chorus and lead back to its top, a swing band's harmony moving at its fastest.

At Swing jazz's point (sync 0.35, harm 1, bite 0.3, mood 0.85), weight 1, as the facet \`harmony\` (#540).
`,"harmony/16-ii-v-i":`---
id: ii_v_i
association:
  - point:
      sync: 0.75
      harm: 0.85
      bite: 0.45
      mood: 0.9
    weight: 1
    facet: harmony
source: seed
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=4 [1,3,5,7,9] [4,6,8,10,12] [0,2,4,6,8]!2
\`\`\`

The ii–V–I in ninths, a bar each and the tonic held for two: in C, Dm9 G9 Cmaj9 Cmaj9. Bossa nova's cadence, its guitar's soft chords moving by fifths to rest.

At Bossa nova's point (sync 0.75, harm 0.85, bite 0.45, mood 0.9), weight 1, as the facet \`harmony\` (#540).
`,"harmony/17-minor-swing":`---
id: minor_swing
association:
  - point:
      sync: 0.55
      harm: 0.75
      bite: 0.6
      mood: 0.5
    weight: 1
    facet: harmony
source: seed
---

\`\`\`cells
&harm from &key
&harm over=&key step=1m cycle=8 [0,2,4]!2 [3,5,7]!2 [0,2,4]!2 [4,6,8,10]!2
\`\`\`

Gypsy jazz's minor swing: i and iv, two bars each, then i and the dominant seventh, as Django Reinhardt's *Minor Swing* turns (in A, Am Dm Am E7 in a harmonic minor key). Electro swing's harmony, sampled from the hot club records it loops.

At Electro swing's point (sync 0.55, harm 0.75, bite 0.6, mood 0.5), weight 1, as the facet \`harmony\` (#540).
`,"instruments/01-gm-kit":`---
id: gm_kit
association:
  - point:
      sync: 0.5
      harm: 0.5
      bite: 0.5
      mood: 0.5
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
`,"instruments/03-bass":"---\nid: bass\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n      mood: 0.5\n    weight: 0.25\n    facet: instrument\nsource: seed\n---\n\n```cells\n&bassV from (&style)\n&bassV s=saw loop=C2 lpf=450..900 * &style[bite] lpq=4 env=&(map=adsr .005 .2 .7 .05)\n&style map=style sync=.5 harm=.5 bite=.5 mood=.5\n```\n\nThe voice the bass lines play through (decision 054, rung 7's first; #244): `&bassV`, whose `loop=C2` sets the register, so the lines' MIDI notes on Jambot's bass channel are the notes they were when each line carried its own `&bassV loop=C2`.\nIts sound is Jambot's bass (`timbreOf`, yggi/jambot `packages/engine/src/sound.ts` @ 227aa74, and the synth that plays it, `apps/web/src/audio/voices.ts`): a saw through a resonant low-pass (`lpq=4`) that opens with the section's bite, from 450 Hz where it is paddy to 900 Hz where it is stabby (`lpf=450..900 * &style[bite]`), struck with a short attack and held (#391).\nIt reads the section's style, `&style`, the composer's, and declares it (decision 075, #560): its signature, `&bassV from (&style)`, makes it an optional parameter, its default the centre of style space, 675 Hz, so the bass heard alone plays there. A performer passes its own (`&bassV from bass(style=&style)`).\nIt sounds within the renderer's first stage (decision 062, R1): a wave, a filter and an envelope. A sound changes no note it sends: MIDI out sends the notes it sent with no sound, and a MIDI card alone says the sound isn't sent (decision 064).\nIt defines the one voice the five bass lines read and reads nothing it doesn't declare, so it fills their hole on any workbench; the lines no longer carry a voice of their own.\n\nAssociated as the kit is, once as the facet `instrument` at the centre of style space, at a quarter of its weight, so a query for an instrument finds the kit first; the composer asks for the bass by its id.\n","instruments/04-keys":"---\nid: keys\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n      mood: 0.5\n    weight: 0.25\n    facet: instrument\nsource: seed\n---\n\n```cells\n&keysV from (&style)\n&keysV s=tri loop=C3 env=&(map=adsr attack=.3..0.01 * &style[bite] decay=0 sustain=1 release=.7..0.12 * &style[bite])\n&style map=style sync=.5 harm=.5 bite=.5 mood=.5\n```\n\nThe voice Jambot's comp plays its stabs through, and any keyboard part: `&keysV`, whose `loop=C3` sets the register, where Jambot's section text sounds its comp (`PIN_VOICES.comp`, yggi/jambot `packages/score/src/section-text.ts` @ 24a528b), so a stab played on it sends the MIDI notes it sends today, with no move on its gate.\nIts sound is Jambot's chords (`timbreOf`, yggi/jambot `packages/engine/src/sound.ts` @ 227aa74): a triangle whose attack shortens from .3 s where the style is paddy to .01 s where it is stabby and its release from .7 s to .12 s, its envelope's slots read from the section's style at each note's start (`attack=.3..0.01 * &style[bite]`, decision 066; #391, #411). Where no line writes the style, the centre's: .155 s and .41 s.\nIt sounds within the renderer's first stage (decision 062, R1), and changes no note MIDI out sends.\nIts register is its own (decision 058): a performer that plays it higher or lower says so on its gate (`play=&part^$12`).\n\nIt declares the style it reads, as `bass` does: `(&style)`, its default the centre (decision 075, #560).\n\nAssociated as `bass` is, once as the facet `instrument` at the centre of style space, at a quarter of the kit's weight; a performer asks for it by its id.\n","instruments/05-pad":"---\nid: pad\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n      mood: 0.5\n    weight: 0.25\n    facet: instrument\nsource: seed\n---\n\n```cells\n&padV from (&style)\n&padV s=tri loop=C3 env=&(map=adsr attack=.3..0.01 * &style[bite] decay=0 sustain=1 release=.7..0.12 * &style[bite])\n&style map=style sync=.5 harm=.5 bite=.5 mood=.5\n```\n\nThe voice Jambot's pad plays through: `&padV`, whose `loop=C3` sets the register, where Jambot's section text sounds its comp, pad and stab alike (`PIN_VOICES.comp`, yggi/jambot `packages/score/src/section-text.ts` @ 24a528b), so a pad played on it sends the MIDI notes it sends today, with no move on its gate. It is a voice of its own beside `keys`, though the two sit at one register, so a sound given to one (a pad's slow attack) isn't the other's.\nIts sound is the one Jambot gives its pad and its stab alike (`timbreOf`, yggi/jambot `packages/engine/src/sound.ts` @ 227aa74): a triangle that swells in over .3 s where the style is paddy and .01 s where it is stabby and dies over .7 s to .12 s, as `keys` does, its envelope's slots read from the section's style at each note's start (decision 066; #391, #411); the centre's .155 s and .41 s where no line writes the style. A band that wants its pad slower than its stabs gives it its own envelope.\nIt sounds within the renderer's first stage (decision 062, R1), and changes no note MIDI out sends.\nIts register is its own (decision 058): a performer that plays it higher or lower says so on its gate (`play=&part^$12`).\n\nIt declares the style it reads, as `bass` does: `(&style)`, its default the centre (decision 075, #560).\n\nAssociated as `bass` is, once as the facet `instrument` at the centre of style space, at a quarter of the kit's weight; a performer asks for it by its id.\n","instruments/06-lead":"---\nid: lead\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n      mood: 0.5\n    weight: 0.25\n    facet: instrument\nsource: seed\n---\n\n```cells\n&leadV from (&style)\n&leadV s=tri..square * &style[bite] loop=C4 lpf=1400..3600 * &style[bite] env=&(map=adsr attack=.04..0.006 * &style[bite] decay=0 sustain=1 release=.08)\n&style map=style sync=.5 harm=.5 bite=.5 mood=.5\n```\n\nThe voice Jambot's lead plays through: `&leadV`, whose `loop=C4` sets the register, where Jambot's section text sounds its lead (`PIN_VOICES.lead`, E35's C4: yggi/jambot `packages/score/src/section-text.ts` @ 24a528b), so a lead played on it sends the MIDI notes it sends today, with no move on its gate.\nIts sound is Jambot's lead (`timbreOf`, yggi/jambot `packages/engine/src/sound.ts` @ 227aa74): a soft triangle where the style is paddy blending to a bright square where it is stabby (`s=tri..square * &style[bite]`, decision 066), through a low-pass that opens with the section's bite (energy until decision 076; a reading of intensity may take it, #571), from 1400 Hz to 3600 Hz (`lpf=1400..3600 * &style[bite]`), its attack sharpening from 40 ms to 6 ms as bite rises (#391, #411). Jambot weights its triangle 1.8 against the square; the blend holds each wave at its own peak.\nIt reads the section's style, `&style`, the composer's, and declares it (decision 075, #560): `&leadV from (&style)`, its default the centre of style space (a blend halfway, 2500 Hz, 23 ms). A performer passes its own (`&leadV from lead(style=&style)`).\nIt sounds within the renderer's first stage (decision 062, R1), and changes no note MIDI out sends.\nIts register is its own (decision 058): a performer that plays it higher or lower says so on its gate (`play=&part^$12`).\n\nAssociated as `bass` is, once as the facet `instrument` at the centre of style space, at a quarter of the kit's weight; a performer asks for it by its id.\n","instruments/07-upright-bass":`---
id: upright_bass
association:
  - point:
      sync: 0.55
      harm: 0.75
      bite: 0.6
      mood: 0.5
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

Associated at Electro swing's point (\`ELECTRO_SWING\`: sync .55, harm .75, bite .6, mood .5; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/08-brass-stab":`---
id: brass_stab
association:
  - point:
      sync: 0.55
      harm: 0.75
      bite: 0.6
      mood: 0.5
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

Associated at Electro swing's point (\`ELECTRO_SWING\`: sync .55, harm .75, bite .6, mood .5; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/09-clarinet":`---
id: clarinet
association:
  - point:
      sync: 0.55
      harm: 0.75
      bite: 0.6
      mood: 0.5
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

Associated at Electro swing's point (\`ELECTRO_SWING\`: sync .55, harm .75, bite .6, mood .5; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/10-muted-trumpet":`---
id: muted_trumpet
association:
  - point:
      sync: 0.55
      harm: 0.75
      bite: 0.6
      mood: 0.5
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

Associated at Electro swing's point (\`ELECTRO_SWING\`: sync .55, harm .75, bite .6, mood .5; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/11-round-bass":`---
id: round_bass
association:
  - point:
      sync: 0.2
      harm: 0.9
      bite: 0.3
      mood: 0.3
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

Associated at Spooky's point (\`SPOOKY\`: sync .2, harm .9, bite .3, mood .3; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/12-organ":`---
id: organ
association:
  - point:
      sync: 0.2
      harm: 0.9
      bite: 0.3
      mood: 0.3
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

Associated at Spooky's point (\`SPOOKY\`: sync .2, harm .9, bite .3, mood .3; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/13-theremin":`---
id: theremin
association:
  - point:
      sync: 0.2
      harm: 0.9
      bite: 0.3
      mood: 0.3
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

Associated at Spooky's point (\`SPOOKY\`: sync .2, harm .9, bite .3, mood .3; yggi/jambot#517) as the facet \`instrument\`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).
`,"instruments/14-celesta":"---\nid: celesta\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      bite: 0.3\n      mood: 0.3\n    weight: 0.125\n    facet: instrument\nsource: seed\nlifted: yggi/cells examples/spooky.md @ 6d1bfa7\n---\n\n```cells\n&keysV s=sine loop=C3 env=&(map=adsr .002 .7 0 .5)\n```\n\nSpooky's bell, a celesta's struck tone: a sine that starts at once and dies away over most of a second with nothing held, the music box in the attic.\nIt defines `&keysV`, the voice the stab performer plays (`use &keysV from keys`), so it fills the same hole as the default `keys`.\nIt is [Spooky, in pieces](../../examples/spooky.md)'s `&keysV` but for its register: `loop=C3`, the default instrument's, so a stab played on it sends the MIDI notes it sends on `keys`. The example plays it at `loop=C5`, where a celesta sits; a player who wants it there says so on its gate (`play=&stabline^$24`, decision 058).\nIt sounds within the renderer's first stage (decision 062, R1).\n\nAssociated at Spooky's point (`SPOOKY`: sync .2, harm .9, bite .3, mood .3; yggi/jambot#517) as the facet `instrument`, at half the default instruments' weight (0.125), so a query for an instrument finds it first at that point, and the kit and the defaults first at each of the eight presets (#350).\n","instruments/15-haunted-pad":"---\nid: haunted_pad\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      bite: 0.25\n      mood: 0.3\n    weight: 0.125\n    facet: instrument\nsource: seed\n---\n\n```cells\n&padV s=tri loop=C3 env=&(map=adsr 1.5 .5 .8 2) pitch=&(map=lin loop=3 0 .1 0 -.1 0)\n```\n\nSpooky's pad: a soft triangle that swells in over a second and a half and fades over two, wavering a tenth of a semitone three times a second, so a held chord rises out of the silence and sinks back into it, the sound a ghost house opens with.\nIt defines `&padV`, the voice the pad performer plays, so it fills the same hole as the default `pad`, at the default's register (`loop=C3`), and sends the MIDI notes it sends.\nAssociated 0.05 below Spooky’s point in bite (its energy offset, #572) (Spooky: sync .2, harm .9, bite .3, mood .3; yggi/jambot#517) as the facet `instrument`, at half the default instruments' weight (0.125), as `theremin` and `celesta` are: at Spooky's point itself it would tie with `organ`, which defines `&padV` there too, and take its place by id, so the organ plays at Spooky and this pad as the style grows quieter.\n","instruments/16-sine-bass":`---
id: sine_bass
association:
  - point:
      sync: 0.1
      harm: 0.12
      bite: 0.5
      mood: 0.95
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/kinderlied.md @ a8de625f
---

\`\`\`cells
&bassV s=sine loop=C2 env=&(map=adsr .005 .4 .4 .1)
\`\`\`

The round, soft bass of [Kinderlieder, in pieces](../../examples/kinderlied.md): a sine struck at once, falling to under half in four tenths of a second, as a toy piano's left hand, at the default bass's register (\`loop=C2\`; the example plays it an octave up), so it sends the MIDI notes \`bass\` sends.
It defines \`&bassV\`, the voice the bass performer plays, so it fills the same hole as the default \`bass\`.

Associated at Kinderlied's point (sync .1, harm .12, bite .5, mood .95) as the facet \`instrument\`, at half the default instruments' weight (0.125), as Spooky's and Electro swing's own are (#350), so a query for an instrument finds it first there (#572).
`,"instruments/17-recorder":`---
id: recorder
association:
  - point:
      sync: 0.1
      harm: 0.12
      bite: 0.5
      mood: 0.95
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/kinderlied.md @ a8de625f
---

\`\`\`cells
&leadV s=tri loop=C4 env=&(map=adsr .005 .3 .3 .2)
\`\`\`

The lead of [Kinderlieder, in pieces](../../examples/kinderlied.md): a triangle, plain and breathy, a child's recorder, at the default lead's register (\`loop=C4\`; the example plays it an octave up), so it sends the MIDI notes \`lead\` sends.
It defines \`&leadV\`, the voice the lead performer plays, so it fills the same hole as the default \`lead\`.

Associated at Kinderlied's point (sync .1, harm .12, bite .5, mood .95) as the facet \`instrument\`, at half the default instruments' weight (0.125) (#350, #572).
`,"instruments/18-tb303":`---
id: tb303
association:
  - point:
      sync: 0.45
      harm: 0.05
      bite: 0.85
      mood: 0.35
    weight: 0.0625
    facet: instrument
source: seed
lifted: yggi/cells examples/acid.md @ 014c4c73
---

\`\`\`cells
&bassV s=saw loop=C2 lpf=110..3800 * &(map=adsr .003 .18 .1 .06) lpq=12 env=&(map=adsr .005 .15 .5 .05)
\`\`\`

The 303 of [Acid-Cell](../../examples/acid.md): a saw through a resonant low-pass (\`lpq=12\`) that opens on every note, 3 ms up and 180 ms down (its filter envelope, written in place).
It defines \`&bassV\`, the voice the bass performer plays, so the acid line is played on it as any bass line is.
The example's knobs, which turn the cutoff and the resonance over 16 and 32 bars so the squeal comes and goes, and its accents are its own, a piece's hands on the instrument: an instrument is one voice that sounds alone.

Associated at Acid's point (sync .45, harm .05, bite .85, mood .35) as the facet \`instrument\`, at a quarter of the default instruments' weight (0.0625), so it stays Acid's and Techno, 0.185 away, keeps the default bass (#350, #572).
`,"instruments/19-rave-lead":`---
id: rave_lead
association:
  - point:
      sync: 0.25
      harm: 0.45
      bite: 0.8
      mood: 0.9
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/hypercell.md @ 014c4c73
---

\`\`\`cells
&leadV s=saw loop=C4 lpf=5200 room=.3 env=&(map=adsr .01 .2 .7 .2)
\`\`\`

The hook's saw of [Hypercell](../../examples/hypercell.md): a bright saw, its filter open, a short room on it. The example plays the hook on two, one detuned a few cents against the other; one is what a voice is.
It defines \`&leadV\`, the voice the lead performer plays.

Associated at Happy hardcore's point (sync .25, harm .45, bite .8, mood .9) as the facet \`instrument\`, at half the default instruments' weight (0.125) (#350, #572).
`,"instruments/20-square-bass":`---
id: square_bass
association:
  - point:
      sync: 0.15
      harm: 0.5
      bite: 0.85
      mood: 0.45
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/zell.md @ 014c4c73
---

\`\`\`cells
&bassV s=square loop=C2 lpf=600 env=&(map=adsr .005 .15 .5 .05)
\`\`\`

The bass of [Zelluläre Aktivität](../../examples/zell.md): a square through a closed low-pass, struck and held at half, the machine bass of German electronic music of the late 1970s.
It defines \`&bassV\`, the voice the bass performer plays, at the default bass's register (\`loop=C2\`; the example's sits a third lower, on A1).

Associated at Elektro's point (sync .15, harm .5, bite .85, mood .45) as the facet \`instrument\`, at half the default instruments' weight (0.125) (#350, #572).
`,"instruments/21-prepared-piano":`---
id: prepared_piano
association:
  - point:
      sync: 0.35
      harm: 0.15
      bite: 0.4
      mood: 0.1
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/ghosts.md @ a8de625f
---

\`\`\`cells
&leadV s=tri loop=C4 lpf=3000 room=.45 env=&(map=adsr .002 1.6 0 1.8) pitch=&(map=lin loop=.19 0 .05 0 -.05 0)
\`\`\`

The piano of [Ghost-Cells](../../examples/ghosts.md): a triangle struck at once and left to ring for two seconds and more, its pitch wavering a twentieth of a semitone either way, a prepared piano heard in a large room.
It defines \`&leadV\`, the voice the lead performer plays, at the default lead's register (\`loop=C4\`; the example plays it on D4 and panned, with an echo in time).

At Dark ambient's point (sync .35, harm .15, bite .4, mood .1) as the facet \`instrument\`, at half the default instruments' weight (0.125) (#350, #572).
`,"instruments/22-drone-pad":`---
id: drone_pad
association:
  - point:
      sync: 0.35
      harm: 0.15
      bite: 0.4
      mood: 0.1
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/ghosts.md @ a8de625f
---

\`\`\`cells
&padV s=saw loop=C3 distort=.8 lpf=120..600 * &(map=lin loop=.0435 .15 .7 .3 .15) lpq=3 env=&(map=adsr 4 2 .9 6)
\`\`\`

The drone of [Ghost-Cells](../../examples/ghosts.md): a saw distorted hard, its low-pass breathing between 120 and 600 Hz over 23 seconds, swelling in over four seconds and fading over six.
It defines \`&padV\`, the voice the pad performer plays, at the default pad's register (\`loop=C3\`; the example's drone sits two octaves lower, on D1).

At Dark ambient's point (sync .35, harm .15, bite .4, mood .1) as the facet \`instrument\`, at half the default instruments' weight (0.125) (#350, #572).
`,"instruments/23-moog":`---
id: moog
association:
  - point:
      sync: 0.15
      harm: 0.8
      bite: 0.5
      mood: 0.85
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/prelude.md @ a8de625f
---

\`\`\`cells
&leadV s=saw loop=C4 lpf=1600 lpq=7 env=&(map=adsr .002 .3 .4 .25)
\`\`\`

The synthesizer of [Bach, Prelude in C: for Wendy](../../examples/prelude.md): a sawtooth through a resonant low-pass (\`lpq=7\`), struck and half held, the sound of Bach played on an old modular synthesizer. The example doubles it with a square an octave down; one is what a voice is.
It defines \`&leadV\`, the voice the lead performer plays, at the default lead's register.

At Baroque's point (sync 0.15, harm 0.8, bite 0.5, mood 0.85) as the facet \`instrument\`, at half the default instruments' weight (0.125) (#350, #542).
`,"instruments/24-blues-horn":`---
id: blues_horn
association:
  - point:
      sync: 0.65
      harm: 0.55
      bite: 0.45
      mood: 0.65
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/jazz.md @ b3c0acea
---

\`\`\`cells
&leadV s=saw loop=C4 lpf=1600 room=.3 env=&(map=adsr .02 .15 .6 .12)
\`\`\`

The horn of [Swing blues](../../examples/jazz.md): a saw softened by a low-pass, a little room on it, a brass line's attack.
It defines \`&leadV\`, the voice the lead performer plays.

At Blues shuffle's point (sync 0.65, harm 0.55, bite 0.45, mood 0.65) as the facet \`instrument\`, at half the default instruments' weight (0.125) (#350, #542).
`,"instruments/25-fiddle":`---
id: fiddle
association:
  - point:
      sync: 0.1
      harm: 0.25
      bite: 0.7
      mood: 0.65
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/sailor.md @ 014c4c73
---

\`\`\`cells
&leadV s=saw loop=C4 lpf=3000 env=&(map=adsr .01 .15 .5 .1)
\`\`\`

The fiddle of [Drunken Sailor](../../examples/sailor.md): a bright saw bowed short, at the default lead's register (\`loop=C4\`; the example plays it an octave up).
It defines \`&leadV\`, the voice the lead performer plays.

At Sea shanty's point (sync 0.1, harm 0.25, bite 0.7, mood 0.65) as the facet \`instrument\`, at half the default instruments' weight (0.125) (#350, #542).
`,"instruments/26-pulse-lead":`---
id: pulse_lead
association:
  - point:
      sync: 0.3
      harm: 0.7
      bite: 1
      mood: 0.55
    weight: 0.125
    facet: instrument
source: seed
lifted: yggi/cells examples/korobeiniki.md @ a8de625f
---

\`\`\`cells
&leadV s=pulse loop=C4 env=&(map=adsr .002 .05 .8 .05)
\`\`\`

The lead of [Korobeiniki, in Tetris form](../../examples/korobeiniki.md): a pulse wave, struck and held, the voice of an 8-bit console's sound chip. The example draws a pulse of a quarter's width from a braid of its own; \`s=pulse\` is the voice's.
It defines \`&leadV\`, the voice the lead performer plays.

At Chiptune's point (sync 0.3, harm 0.7, bite 1, mood 0.55) as the facet \`instrument\`, at half the default instruments' weight (0.125) (#350, #542).
`,"instruments/27-montuno-piano":`---
id: montuno_piano
association:
  - point:
      sync: 0.9
      harm: 0.5
      bite: 0.7
      mood: 0.75
    weight: 0.125
    facet: instrument
source: seed
---

\`\`\`cells
&leadV s=square loop=C4 lpf=2800 env=&(map=adsr .002 .3 .15 .2)
\`\`\`

A bright, struck piano for the montuno: a square wave through an open filter, quick to start and quick to fade.
It defines \`&leadV\`, the voice the lead performer plays.

At Salsa's point (sync 0.9, harm 0.5, bite 0.7, mood 0.75), weight 0.125, as the facet \`instrument\` (#542), at half the default instruments' weight (#350).
`,"instruments/28-accordion":`---
id: accordion
association:
  - point:
      sync: 0
      harm: 0.7
      bite: 0.3
      mood: 0.9
    weight: 0.125
    facet: instrument
source: seed
---

\`\`\`cells
&leadV s=square loop=C4 lpf=2200 env=&(map=adsr .03 .1 .9 .15) pitch=&(map=lin loop=6 0 .06 0 -.06 0)
\`\`\`

A musette accordion: a reedy square, held while the bellows push, with the slight beating of its detuned reeds as a shallow vibrato.
It defines \`&leadV\`, the voice the lead performer plays.

At Waltz's point (sync 0, harm 0.7, bite 0.3, mood 0.9), weight 0.125, as the facet \`instrument\` (#542), at half the default instruments' weight (#350).
`,"instruments/29-brass-band":`---
id: brass_band
association:
  - point:
      sync: 0
      harm: 0.1
      bite: 0.75
      mood: 0.7
    weight: 0.125
    facet: instrument
source: seed
---

\`\`\`cells
&leadV s=saw loop=C4 lpf=2000 lpq=2 env=&(map=adsr .03 .1 .8 .1)
\`\`\`

A brass band's cornet: a saw through a filter half open, its attack a breath slower than a stab's, held for the march's tune.
It defines \`&leadV\`, the voice the lead performer plays.

At March's point (sync 0, harm 0.1, bite 0.75, mood 0.7), weight 0.125, as the facet \`instrument\` (#542), at half the default instruments' weight (#350).
`,"instruments/30-electric-piano":`---
id: electric_piano
association:
  - point:
      sync: 0.7
      harm: 0.2
      bite: 0.2
      mood: 0.25
    weight: 0.125
    facet: instrument
source: seed
---

\`\`\`cells
&leadV s=sine loop=C4 room=.5 env=&(map=adsr .01 .8 .3 .6)
\`\`\`

An electric piano in a large room: a sine struck softly that rings and fades, the Rhodes of a trip-hop record.
It defines \`&leadV\`, the voice the lead performer plays.

At Trip-hop's point (sync 0.7, harm 0.2, bite 0.2, mood 0.25), weight 0.125, as the facet \`instrument\` (#542), at half the default instruments' weight (#350).
`,"meters/meter":`---
id: meter
association:
  - point:
      sync: 0.3
      harm: 0.45
      bite: 0.55
    weight: 1
    facet: meter
  - point:
      sync: 0.12
      harm: 0
      bite: 1
    weight: 1
    facet: meter
  - point:
      sync: 0.75
      harm: 0.85
      bite: 0.45
    weight: 1
    facet: meter
  - point:
      sync: 0.1
      harm: 0.12
      bite: 0.5
    weight: 1
    facet: meter
  - point:
      sync: 0.45
      harm: 0.05
      bite: 0.85
    weight: 1
    facet: meter
  - point:
      sync: 0.25
      harm: 0.45
      bite: 0.8
    weight: 1
    facet: meter
  - point:
      sync: 0.15
      harm: 0.5
      bite: 0.85
    weight: 1
    facet: meter
  - point:
      sync: 0.35
      harm: 0.15
      bite: 0.4
    weight: 1
    facet: meter
  - point:
      sync: 0.15
      harm: 0.8
      bite: 0.5
    weight: 1
    facet: meter
  - point:
      sync: 0.1
      harm: 0.25
      bite: 0.7
    weight: 1
    facet: meter
  - point:
      sync: 0.3
      harm: 0.7
      bite: 1
    weight: 1
    facet: meter
  - point:
      sync: 0.65
      harm: 0.55
      bite: 0.45
    weight: 1
    facet: meter
    args:
      swing: 8n:2/3
  - point:
      sync: 0.35
      harm: 1
      bite: 0.3
    weight: 1
    facet: meter
    args:
      swing: 8n:2/3
  - point:
      sync: 0.55
      harm: 0.75
      bite: 0.6
    weight: 1
    facet: meter
    args:
      swing: 8n:2/3
  - point:
      sync: 0.5
      harm: 0.75
      bite: 0.35
    weight: 1
    facet: meter
    args:
      swing: 16n:.65
  - point:
      sync: 0.35
      harm: 0.55
      bite: 0.65
    weight: 1
    facet: meter
    args:
      swing: 16n:.6
  - point:
      sync: 1
      harm: 0.12
      bite: 0.85
    weight: 1
    facet: meter
    args:
      swing: 16n:.6
  - point:
      sync: 0.05
      harm: 0.3
      bite: 0
    weight: 1
    facet: meter
    args:
      swing: 16n:31/60
  - point:
      sync: 0.2
      harm: 0.6
      bite: 0.9
    weight: 0.75
    facet: meter
    args:
      grouping: meter("2/2", 2)
  - point:
      sync: 0
      harm: 0.1
      bite: 0.6
    weight: 0.75
    facet: meter
    args:
      grouping: meter("2/4")
  - point:
      sync: 0
      harm: 0.7
      bite: 0.3
    weight: 0.75
    facet: meter
    args:
      grouping: meter("3/4")
  - point:
      sync: 0.2
      harm: 0.9
      bite: 0.38
    weight: 0.75
    facet: meter
    args:
      grouping: meter("3/4")
  - point:
      sync: 0.3
      harm: 0.2
      bite: 0.2
    weight: 0.75
    facet: meter
    args:
      grouping: meter("6/8")
  - point:
      sync: 0.2
      harm: 0.9
      bite: 0.22
    weight: 0.75
    facet: meter
    args:
      grouping: meter("6/8")
  - point:
      sync: 0.7
      harm: 0.6
      bite: 0
    weight: 0.75
    facet: meter
    args:
      grouping: meter("12/8")
  - point:
      sync: 0.4
      harm: 0.9
      bite: 0.5
    weight: 0.75
    facet: meter
    args:
      grouping: meter("5/4")
  - point:
      sync: 0.2
      harm: 0.9
      bite: 0.3
    weight: 1
    facet: meter
    args:
      grouping: meter("5/4")
  - point:
      sync: 0.8
      harm: 0.6
      bite: 1
    weight: 0.75
    facet: meter
    args:
      grouping: meter("7/8")
  - point:
      sync: 0.6
      harm: 0.9
      bite: 0.8
    weight: 0.75
    facet: meter
    args:
      grouping: meter("10/8")
  - point:
      sync: 0.9
      harm: 0.5
      bite: 0.7
    weight: 1
    facet: meter
  - point:
      sync: 0.7
      harm: 0.2
      bite: 0.2
    weight: 1
    facet: meter
  - point:
      sync: 0
      harm: 0.1
      bite: 0.75
    weight: 0.75
    facet: meter
    args:
      grouping: meter("2/4")
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

The meters placed for their own sake (2/2, 2/4, 3/4, 6/8, 12/8, 7/8, 10/8, and the 5/4 off Spooky's point) weigh 0.75, so each is still first where it was placed, and between two presets a preset's own meter is: on decision 076's axes a meter has three, and at weight 1 they crowded that space; at 0.5 they were chosen so rarely that their use stopped settling over a set (\`lockin.slow.test.ts\`) (#572).
`,"modes/01-diatonic":`---
id: diatonic
association:
  - point:
      sync: 0.3
      harm: 0.45
      bite: 0.55
      mood: 0.5
    weight: 1
    facet: mode
    args:
      mode: aeolian
  - point:
      sync: 0.12
      harm: 0
      bite: 1
      mood: 0.4
    weight: 1
    facet: mode
    args:
      mode: aeolian
  - point:
      sync: 0.5
      harm: 0.75
      bite: 0.35
      mood: 0.5
    weight: 1
    facet: mode
    args:
      mode: aeolian
  - point:
      sync: 0.35
      harm: 0.55
      bite: 0.65
      mood: 0.65
    weight: 1
    facet: mode
    args:
      mode: dorian
  - point:
      sync: 1
      harm: 0.12
      bite: 0.85
      mood: 0.65
    weight: 1
    facet: mode
    args:
      mode: dorian
  - point:
      sync: 0.05
      harm: 0.3
      bite: 0
      mood: 0.9
    weight: 1
    facet: mode
    args:
      mode: ionian
  - point:
      sync: 0.75
      harm: 0.85
      bite: 0.45
      mood: 0.9
    weight: 1
    facet: mode
    args:
      mode: ionian
  - point:
      sync: 0.35
      harm: 1
      bite: 0.3
      mood: 0.85
    weight: 1
    facet: mode
    args:
      mode: ionian
  - point:
      sync: 0.1
      harm: 0.12
      bite: 0.5
      mood: 0.95
    weight: 1
    facet: mode
    args:
      mode: ionian
  - point:
      sync: 0.875
      harm: 0.485
      bite: 0.65
      mood: 0.75
    weight: 1
    facet: mode
    args:
      mode: mixolydian
  - point:
      sync: 0.6
      harm: 0.6
      bite: 0.7
      mood: 0.375
    weight: 1
    facet: mode
    args:
      mode: phrygian
  - point:
      sync: 0.15
      harm: 0.6
      bite: 0.15
      mood: 0.9
    weight: 1
    facet: mode
    args:
      mode: lydian
  - point:
      sync: 0.9
      harm: 1
      bite: 0.6
      mood: 0.3
    weight: 1
    facet: mode
    args:
      mode: locrian
  - point:
      sync: 0.45
      harm: 0.05
      bite: 0.85
      mood: 0.35
    weight: 1
    facet: mode
    args:
      mode: aeolian
  - point:
      sync: 0.25
      harm: 0.45
      bite: 0.8
      mood: 0.9
    weight: 1
    facet: mode
    args:
      mode: aeolian
  - point:
      sync: 0.15
      harm: 0.5
      bite: 0.85
      mood: 0.45
    weight: 1
    facet: mode
    args:
      mode: aeolian
  - point:
      sync: 0.35
      harm: 0.15
      bite: 0.4
      mood: 0.1
    weight: 1
    facet: mode
    args:
      mode: aeolian
  - point:
      sync: 0.15
      harm: 0.8
      bite: 0.5
      mood: 0.85
    weight: 1
    facet: mode
    args:
      mode: ionian
  - point:
      sync: 0.65
      harm: 0.55
      bite: 0.45
      mood: 0.65
    weight: 1
    facet: mode
    args:
      mode: mixolydian
  - point:
      sync: 0.1
      harm: 0.25
      bite: 0.7
      mood: 0.65
    weight: 1
    facet: mode
    args:
      mode: dorian
  - point:
      sync: 0.9
      harm: 0.5
      bite: 0.7
      mood: 0.75
    weight: 1
    facet: mode
    args:
      mode: mixolydian
  - point:
      sync: 0
      harm: 0.7
      bite: 0.3
      mood: 0.9
    weight: 1
    facet: mode
    args:
      mode: ionian
  - point:
      sync: 0
      harm: 0.1
      bite: 0.75
      mood: 0.7
    weight: 1
    facet: mode
    args:
      mode: ionian
  - point:
      sync: 0.7
      harm: 0.2
      bite: 0.2
      mood: 0.25
    weight: 1
    facet: mode
    args:
      mode: aeolian
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
`,"modes/05-bell-and-scale":"---\nid: bell_and_scale\nassociation:\n  - point:\n      sync: 0.383\n      harm: 0.717\n      bite: 0.25\n      mood: 0.825\n    weight: 1\n    facet: mode\n  - point:\n      sync: 0.8\n      harm: 0.1\n      bite: 0.9\n    weight: 1\n    facet: rhythm\nsource: seed\n---\n\n```cells\n&key, &bell, &agogo from &tonic\n&key scale(ionian, &tonic) step=1m*7\n&bell step=&key:pulse &highagogo &highagogo:0:.5 &highagogo:0:.7 &highagogo:0:.5 &highagogo:0:.6 &highagogo:0:.5 &highagogo:0:.7\n&agogo [&bell * .5]\n```\n\nThe West African standard bell pattern, x.x.xx.x.x.x, seven strokes over twelve pulses, has the major scale's intervals, 2 2 1 2 2 2 1 (the example `bell_and_scale`): both are `even(7, 12, 5)`, the diatonic necklace at the ionian's phase (decision 072; `even.test.ts`).\nSo one cell is both: `&key` is the major scale, the piece's main key, and stepped seven times a bar, each step as long as its interval, it is the bell's timeline, which `&bell` strikes (`step=&key:pulse`).\nThe repository's first fragment of two facets, a `mode`, ionian, and a `rhythm`, the bell, each at a place of its own: \"the bell is a world-music associated rhythm-facet and a western music associated harmony / scale-facet\" (the owner, decision 046).\n\nA stepped key that nothing plays doesn't turn, so a line over it (`over=&key`) reads the major scale as `&key scale(ionian, &tonic)` does, note for note; the tonic is left to the text that uses it, `&tonic`, as the mode fragments leave it (#290).\n`step=1m*7` lays the bell over the bar of any meter, as twelve twelfths: over 12/8 they are its pulses, the bell as it is played.\n\nSeven strokes of a high agogô (`&highagogo`, General MIDI's 67, a hole the General MIDI kit fills with its line), the example's accents, at half the level; its mix, `&agogo` (the level, no card: where its notes go is the workbench's, #291), is none of the drum bars' or the claves', so it layers on any of them.\nAs a rhythm its point is a timeline's: off the beat (sync 0.8), over one static chord (harm 0.1), struck (artic 0.9), steady and fairly dense (energy 0.6), where no preset is.\nAs a mode it is where the major is played: the centroid of the three presets that play ionian, Ambient's, Bossa nova's and Swing jazz's (each axis their mean, to three decimals), where no preset is, so at each of them the plain `ionian` is found first, at distance 0.\n\n**Its signature** (decision 065): `&key, &bell, &agogo from &tonic`. `&key, &bell, &agogo from bell_and_scale D` takes a copy of it, `&tonic` its main argument.\n","modes/06-harmonic-minor":`---
id: harmonic_minor
association:
  - point:
      sync: 0.55
      harm: 0.75
      bite: 0.6
      mood: 0.5
    weight: 1
    facet: mode
  - point:
      sync: 0.2
      harm: 0.9
      bite: 0.3
      mood: 0.3
    weight: 1
    facet: mode
  - point:
      sync: 0.3
      harm: 0.7
      bite: 1
      mood: 0.55
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

At a point proposed for an Electro swing preset (sync .55, harm .75, bite .6, mood .5), weight 1, Jambot's to adopt (decision 041); Jambot's composer has no harmonic minor among its modes yet (\`COMPOSER_MODES\`, yggi/jambot packages/engine/src/key.ts).
Also at the point proposed for a Spooky preset (sync .2, harm .9, bite .3, mood .3; #349), weight 1: the key of [Spooky, in pieces](../../examples/spooky.md), its augmented second between the sixth and the seventh the sound of a horror film's minor.

**Its signature** (decision 065): \`&key from &tonic\`. \`&key from harmonic_minor D\` takes a copy of it, \`&tonic\` its main argument.
`,"modules/01-osc":"---\nid: osc\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n    weight: 0.25\n    facet: module\nsource: seed\n---\n\n```cells\n&osc from (&pitch)\n&osc s=saw loop=C3 pitch=&pitch\n&pitch 0\n```\n\nAn oscillator, a modular's VCO (decision 067 §3): a voice, and its jack is its pitch.\nA voice is an oscillator already (`&saw s=saw loop=C2`); this fragment gives it a panel, so that every module of a patch is written, and drawn, alike.\n\n**Its jack**, `&pitch` (default `0`, no bend): a voice's own pitch on every note, in semitones (`pitch=`, sound.md), the input a modular's exponential FM is. Patch a slow wave into it for a drift or a vibrato: `osc(pitch=&(map=lin loop=&bar/4 0 .12 0))`, or the seed's `vibrato`.\n**Its wave and its register** are its head's: a saw on C3 where the use says nothing, and the use's own attributes before `from` where it does (decision 065 §4), `&sub s=square loop=C1 from osc(pitch=&drift)`. A wave is a word, not a cell, so it is no jack.\nIts notes come from the product that plays it, as any voice's do (`[&tune * &osc]`): a modular's 1 V/oct and gate are the melody's pitch and onsets ([nets.md](../../docs/notes/nets.md)).\n\n**Its signature** (decision 065): `&osc from (&pitch)`, no main parameter. `&lead from osc` takes a copy of it, named `&lead`.\n\nAssociated once, as the facet `module`, at the centre of style space, at a quarter weight, as an instrument is: a module is no style's. In a patch it is the VCO.\n","modules/02-lowpass":"---\nid: lowpass\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n    weight: 0.25\n    facet: module\nsource: seed\n---\n\n```cells\n&lowpass from (&cutoff, &res, &eg) &in\n&lowpass lpf=70..4800 * &eg * &cutoff lpq=4..16 * &res [&in]\n&cutoff map=lin .5\n&res map=lin .3\n&eg map=adsr 0 0 1 0\n```\n\nA resonant low-pass filter, a modular's VCF (decision 067 §3): an instrument whose sound parameters act on what its voices play, in series after each voice's own (decision 067 §1), so one filter follows a mix of oscillators.\n\n**Its input**, the main parameter `&in`: what it filters, a voice or a mix written in place, `&vcf from lowpass [&saw, &sub * .5]`.\n**Its jacks**, each a knob at its default when nothing is patched in, each a share from 0 to 1 of its range:\n- `&cutoff` (default `.5`): where the cutoff sits, from 70 Hz to 4800 Hz. Patch a slow wave in for a sweep (`cutoff=&sweep`, with `&sweep loop=&bar/16 from lfo`).\n- `&res` (default `.3`): the resonance, from 4 to 16 (`lpq=`, Web Audio's Q in dB): at the top it rings at the cutoff.\n- `&eg` (default held at 1, no contour): an envelope that opens it on every note, a modular's contour generator (`eg=&contour`, with `&contour map=adsr .002 .2 .1 .1`, or one of the seed's `envelopes`).\nThe three multiply, as a moving parameter's cells do (sound.md): an envelope scaled by the knob, the knob moved by the LFO.\n\n**Its signature** (decision 065): `&lowpass from (&cutoff, &res, &eg) &in`. A cable is a reference argument, the piece's own cell, so a slider on it keeps working through the filter. Patched into nothing, a jack is its knob.\nIts own attributes, before `from`, are the head's: `&vcf delay=.3 delaytime=&bar*3/16 from lowpass …` sends what it filters to an echo.\n\nAssociated once, as the facet `module`, at the centre of style space, at a quarter weight; in a patch it is the VCF.\n","modules/03-highpass":`---
id: highpass
association:
  - point:
      sync: 0.5
      harm: 0.5
      bite: 0.5
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
`,"modules/04-amp":"---\nid: amp\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n    weight: 0.25\n    facet: module\nsource: seed\n---\n\n```cells\n&amp from (&eg, &level) &in\n&amp [&eg * &level * &in]\n&eg map=adsr .005 .2 .7 .1\n&level map=amp 1\n```\n\nAn amplifier, a modular's VCA (decision 067 §3): an instrument with an envelope and a level, the volumes that act on what it plays acting on each of its voices (mix.md: a pitch or a volume on a mix acts on each voice).\nIt is what an instrument with an envelope always was, `[&(map=adsr …) * &saw]`, with jacks.\n\n**Its input**, the main parameter `&in`: what it shapes, a voice, a filter, a mix.\n**Its jacks**:\n- `&eg` (default a struck and held shape: 5 ms up, a fall over .2 s to .7, a release of .1 s): the envelope on every note. An inline one is a cell of its own, `amp(eg=&(map=adsr .002 .3 .5 .06))`, its slots changed where it says; or one of the seed's `envelopes`, `amp(eg=&pluck)`.\n- `&level` (default `1`): a level over time, a volume (`map=amp`, `map=lin`, `map=db`): accents, a swell, a tremolo from a fast LFO.\n\n**Its signature** (decision 065): `&amp from (&eg, &level) &in`.\n\nAssociated once, as the facet `module`, at the centre of style space, at a quarter weight; in a patch it is the VCA.\n","modules/05-lfo":"---\nid: lfo\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n    weight: 0.25\n    facet: module\nsource: seed\n---\n\n```cells\n&lfo from\n&lfo map=lin loop=.5 sin(12)\n```\n\nA low-frequency oscillator, a modular's LFO (decision 067 §3): a sine, ramped (`map=lin`) through its twelve points, turning once every two seconds. Read by a jack, its −1…1 is a share from 0 to 1, its middle at .5 (decision 067 §5).\nAn LFO is a braid turned slowly, as a voice is one turned fast (sound.md): patched into a jack, it moves what the jack moves (`lowpass(cutoff=&sweep)`, `osc(pitch=&wobble)`).\n\n**Its rate** is its head's `loop=`, as any cell's: a use sets it before `from` (decision 065 §4), in seconds a lap or as a clock, so it keeps time with the piece: `&sweep loop=&bar/16 from lfo` comes round once every eight bars of 4/4, and `&wobble loop=&bar*2 from lfo` once a beat. Its shape is its braid; a use that wants another writes its own cell. A bipolar braid (one that runs below 0: `saw(8)`, `tri(4)`, `square(2)`) is read the same way, as (1 + x)/2; one that stays at 0 or above, as written.\n\n**Its signature** (decision 065): `&lfo from`, the head alone. `&sweep from lfo` takes a copy of it, named `&sweep`.\n\nAssociated once, as the facet `module`, at the centre of style space, at a quarter weight; in a patch it is the LFO.\n","modules/06-sh":`---
id: sh
association:
  - point:
      sync: 0.5
      harm: 0.5
      bite: 0.5
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
`,"modules/07-bandpass":"---\nid: bandpass\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n    weight: 0.25\n    facet: module\nsource: seed\n---\n\n```cells\n&bandpass from (&cutoff, &res, &eg) &in\n&bandpass bpf=100..5000 * &eg * &cutoff bpq=.5..12 * &res [&in]\n&cutoff map=lin .5\n&res map=lin .3\n&eg map=adsr 0 0 1 0\n```\n\nA band-pass filter (decision 074): it lets a band around its centre through and takes away what is above and below it, the third of superdough's filters after the low-pass and the high-pass. An instrument, as the `lowpass` module is (decision 067), in series after each voice's own filters.\n\n**Its input**, the main parameter `&in`: what it filters, a voice or a mix written in place, `&vcf from bandpass [&saw, &noise * .3]`.\n**Its jacks**, each a share from 0 to 1 of its range, at its default when nothing is patched in:\n- `&cutoff` (default `.5`): the band's centre, from 100 Hz to 5000 Hz. Patch a slow wave in for a sweep, a wah (`cutoff=&sweep`).\n- `&res` (default `.3`): its Q, from .5 to 12 (`bpq=`, read linearly as Web Audio's band-pass reads it: the centre over the bandwidth). Higher is a narrower band.\n- `&eg` (default held at 1): an envelope that moves the centre on every note.\n\n**Its signature** (decision 065): `&bandpass from (&cutoff, &res, &eg) &in`, as the `lowpass` module's.\n\nAssociated once, as the facet `module`, at the centre of style space, at a quarter weight.\n","modules/08-lowpass24":"---\nid: lowpass24\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n    weight: 0.25\n    facet: module\nsource: seed\n---\n\n```cells\n&lowpass24 from (&cutoff, &res, &eg) &in\n&lowpass24 lpf=70..4800 * &eg * &cutoff lpq=4..16 * &res [&stage]\n&stage lpf=70..4800 * &eg * &cutoff lpq=4..16 * &res [&in]\n&cutoff map=lin .5\n&res map=lin .3\n&eg map=adsr 0 0 1 0\n```\n\nA 24 dB low-pass (decision 074): two of the `lowpass` module's stages in series, each at the same cutoff and resonance, so it falls twice as steeply above its cutoff and rings harder at it. That is superdough's `24db` exactly, written out: two filters in a row are two stages (decision 067), so a steeper slope is a composition, not a new kind of filter.\n\n**Its input**, the main parameter `&in`: what it filters, `&vcf from lowpass24 [&saw, &sub * .5]`.\n**Its jacks** are the `lowpass` module's: `&cutoff` (default `.5`, 70 Hz to 4800 Hz), `&res` (default `.3`, 4 to 16, Web Audio's Q in dB, on each stage) and `&eg` (default held at 1). One cable moves both stages alike.\n**`&stage`** is its first stage, its own: each use of it has its own.\n\n**Its signature** (decision 065): `&lowpass24 from (&cutoff, &res, &eg) &in`, as the `lowpass` module's.\n\nAssociated once, as the facet `module`, at the centre of style space, at a quarter weight.\n","motifs/01-hook":"---\nid: hook\nassociation:\n  - point:\n      sync: 0.3\n      harm: 0.45\n      bite: 0.55\n      mood: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&hook from &key\n&hook over=&key step=8n 4 4 3 2@2 ~ 0 2\n```\n\nA pop hook: the fifth twice, stepping down to the third and held, a breath, then the tonic and up a step, so it asks to come round again. Written by hand for Synth-pop's minor (aeolian), its sung, fairly short notes.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&hook`), so `use &hook` takes it; a form reads it as its `&call` (`&call step=8n &hook`), the line the form moves and answers.\n\nAt Synth-pop's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&hook from &key`. `&hook from hook &key` takes a copy of it, `&key` its main argument.\n","motifs/02-octaves":"---\nid: octaves\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      bite: 1\n      mood: 0.4\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&octaves from &key\n&octaves over=&key step=8n 0 ~ 7 ~ 0 0 ~ 7\n```\n\nThe tonic and its octave, struck short on and off the beat: the line a techno track rides a filter over, its pitch all in two notes. Written by hand for Techno, where the harmony stands still and every note is staccato.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&octaves`), so `use &octaves` takes it; a form reads it as its `&call` (`&call step=8n &octaves`), the line the form moves and answers.\n\nAt Techno's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&octaves from &key`. `&octaves from octaves &key` takes a copy of it, `&key` its main argument.\n","motifs/03-sigh":"---\nid: sigh\nassociation:\n  - point:\n      sync: 0.35\n      harm: 0.55\n      bite: 0.65\n      mood: 0.65\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&sigh from &key\n&sigh over=&key step=8n 4@3 3 2@2 ~ ~\n```\n\nA sigh: the fifth held, falling by step to the third and held again, then two beats of air. Written by hand for Deep house's dorian, a vocal hook's shape over a vamp.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&sigh`), so `use &sigh` takes it; a form reads it as its `&call` (`&call step=8n &sigh`), the line the form moves and answers.\n\nAt Deep house's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&sigh from &key`. `&sigh from sigh &key` takes a copy of it, `&key` its main argument.\n","motifs/04-rising":"---\nid: rising\nassociation:\n  - point:\n      sync: 0.05\n      harm: 0.3\n      bite: 0\n      mood: 0.9\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&rising from &key\n&rising over=&key step=8n 0@2 2@2 4@4\n```\n\nThe triad rising slowly, tonic, third, fifth, the last held half the bar: the owner's own example of a motif's name (#288). Written by hand for Ambient, legato and sparse.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&rising`), so `use &rising` takes it; a form reads it as its `&call` (`&call step=8n &rising`), the line the form moves and answers.\n\nAt Ambient's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&rising from &key`. `&rising from rising &key` takes a copy of it, `&key` its main argument.\n","motifs/05-lazy":"---\nid: lazy\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.75\n      bite: 0.35\n      mood: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&lazy from &key\n&lazy over=&key step=8n ~ 2 4 ~ 3@2 2 0\n```\n\nLate in, up to the fifth, then down by step to the tonic, the fourth held: a lazy line behind the beat. Written by hand for Lo-fi hip hop's minor, its swung eighths.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&lazy`), so `use &lazy` takes it; a form reads it as its `&call` (`&call step=8n &lazy`), the line the form moves and answers.\n\nAt Lo-fi hip hop's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&lazy from &key`. `&lazy from lazy &key` takes a copy of it, `&key` its main argument.\n","motifs/06-riff":"---\nid: riff\nassociation:\n  - point:\n      sync: 1\n      harm: 0.12\n      bite: 0.85\n      mood: 0.65\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&riff from &key\n&riff over=&key step=8n 0 ~ 3 0 ~ 4 3 ~\n```\n\nA funk riff: the tonic, the fourth and the fifth, all off and on the beat in short strokes. Written by hand for Funk's dorian, at its most syncopated and staccato.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&riff`), so `use &riff` takes it; a form reads it as its `&call` (`&call step=8n &riff`), the line the form moves and answers.\n\nAt Funk's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&riff from &key`. `&riff from riff &key` takes a copy of it, `&key` its main argument.\n","motifs/07-tresillo":"---\nid: tresillo\nassociation:\n  - point:\n      sync: 0.75\n      harm: 0.85\n      bite: 0.45\n      mood: 0.9\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&tresillo from &key\n&tresillo over=&key step=8n 4@3 2@3 0@2\n```\n\nThe fifth, the third and the tonic falling on the tresillo's 3 + 3 + 2. Written by hand for Bossa nova, its melody on the clave's long-long-short.\nIts durations, 3 3 2 eighths, are `even(3, 8, 2)`, three as even as three go over eight (decision 072; `even.test.ts`); the cinquillo is its five, `even(5, 8, 2)`.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&tresillo`), so `use &tresillo` takes it; a form reads it as its `&call` (`&call step=8n &tresillo`), the line the form moves and answers.\n\nAt Bossa nova's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&tresillo from &key`. `&tresillo from tresillo &key` takes a copy of it, `&key` its main argument.\n","motifs/08-bebop":"---\nid: bebop\nassociation:\n  - point:\n      sync: 0.35\n      harm: 1\n      bite: 0.3\n      mood: 0.85\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&bebop from &key\n&bebop over=&key step=8n 0 2 4 6 7@2 6 4\n```\n\nUp the seventh chord to the octave, held, and back down through the seventh: a bebop arpeggio. Written by hand for Swing jazz, where the harmony moves most.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&bebop`), so `use &bebop` takes it; a form reads it as its `&call` (`&call step=8n &bebop`), the line the form moves and answers.\n\nAt Swing jazz's point (`styles`), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&bebop from &key`. `&bebop from bebop &key` takes a copy of it, `&key` its main argument.\n","motifs/09-gypsy":"---\nid: gypsy\nassociation:\n  - point:\n      sync: 0.55\n      harm: 0.75\n      bite: 0.6\n      mood: 0.5\n    weight: 1\n    facet: motif\nsource: seed\nlifted: yggi/cells examples/electroswing.md @ 7622a87\n---\n\n```cells\n&gypsy from &key\n&gypsy over=&key step=8n 4 5 6 7@2 6 4@2\n```\n\nThe clarinet's call of [Electro swing, in pieces](../../examples/electroswing.md): A B♭ C♯ D and back to A in D harmonic minor, the fifth climbing through the minor sixth and the leading note to the octave, gypsy jazz's run.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&gypsy`), so `use &gypsy` takes it; a form reads it as its `&call` (`&call step=8n &gypsy`), the line the form moves and answers.\n\nAt the point proposed for an Electro swing preset (sync 0.55, harm 0.75, bite 0.6, mood 0.5), as the example's other seeds are: Jambot's to adopt (decision 041).\n\n**Its signature** (decision 065): `&gypsy from &key`. `&gypsy from gypsy &key` takes a copy of it, `&key` its main argument.\n","motifs/10-dies-irae":"---\nid: diesIrae\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      bite: 0.3\n      mood: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&diesIrae from &key\n&diesIrae over=&key step=8n 2 1 2 0 1 -1 0@2\n```\n\nThe head of the *Dies irae*, the plainchant of the day of wrath, which Berlioz, Liszt, Saint-Saëns and a century of horror films quote: the third, the second, the third, the tonic, the second, the note below the tonic, and the tonic held (F E F D E C D in D minor; C♯ in harmonic minor, which makes it darker still). The chant is in the public domain.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&diesIrae`), so `use &diesIrae` takes it; a form reads it as its `&call` (`&call step=8n &diesIrae`), the line the form moves and answers.\nAt the point proposed for a Spooky preset (sync .2, harm .9, bite .3, mood .3; #349), weight 1, Jambot's to adopt (decision 041).\n\n**Its signature** (decision 065): `&diesIrae from &key`. `&diesIrae from diesIrae &key` takes a copy of it, `&key` its main argument.\n","motifs/11-refrain":"---\nid: refrain\nassociation:\n  - point:\n      sync: 0.3\n      harm: 0.45\n      bite: 0.65\n      mood: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&refrain from &key\n&refrain over=&key step=8n 2 2 2 4@2 3 2 0\n```\n\nThe refrain under the hook: the third three times, up to the fifth and held, then stepping down home. Written by hand for Synth-pop's minor (aeolian), a sung line that lands where the hook only asks.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&refrain`), so `use &refrain` takes it; a form reads it as its `&call` (`&call step=8n &refrain`), the line the form moves and answers.\n\nNear Synth-pop's point, 0.1 higher in bite (its energy offset, #572), so a query there finds `hook` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&refrain from &key`. `&refrain from refrain &key` takes a copy of it, `&key` its main argument.\n","motifs/12-pulse":"---\nid: pulse\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      bite: 0.9\n      mood: 0.4\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&pulse from &key\n&pulse over=&key step=8n 0 ~ 0 ~ 2 ~ 0 ~\n```\n\nThe tonic struck on every beat and the third once, all short: a line that is mostly rhythm, as a techno lead is. Written by hand for Techno, where the harmony stands still.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&pulse`), so `use &pulse` takes it; a form reads it as its `&call` (`&call step=8n &pulse`), the line the form moves and answers.\n\nNear Techno's point, 0.1 lower in bite (its energy offset, #572, the other way: Techno's bite is 1), so a query there finds `octaves` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&pulse from &key`. `&pulse from pulse &key` takes a copy of it, `&key` its main argument.\n","motifs/13-soul":"---\nid: soul\nassociation:\n  - point:\n      sync: 0.35\n      harm: 0.55\n      bite: 0.75\n      mood: 0.65\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&soul from &key\n&soul over=&key step=8n 4 ~ 4 3 4@2 2@2\n```\n\nThe fifth twice, a turn through the fourth and back, then down to the third and held: a vocal ad lib over a vamp. Written by hand for Deep house's dorian.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&soul`), so `use &soul` takes it; a form reads it as its `&call` (`&call step=8n &soul`), the line the form moves and answers.\n\nNear Deep house's point, 0.1 higher in bite (its energy offset, #572), so a query there finds `sigh` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&soul from &key`. `&soul from soul &key` takes a copy of it, `&key` its main argument.\n","motifs/14-drift":"---\nid: drift\nassociation:\n  - point:\n      sync: 0.05\n      harm: 0.3\n      bite: 0.1\n      mood: 0.9\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&drift from &key\n&drift over=&key step=8n 4@4 3@4\n```\n\nTwo notes, the fifth and the fourth, half a bar each: a line that barely moves, legato and sparse. Written by hand for Ambient.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&drift`), so `use &drift` takes it; a form reads it as its `&call` (`&call step=8n &drift`), the line the form moves and answers.\n\nNear Ambient's point, 0.1 higher in bite (its energy offset, #572), so a query there finds `rising` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&drift from &key`. `&drift from drift &key` takes a copy of it, `&key` its main argument.\n","motifs/15-dusty":"---\nid: dusty\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.75\n      bite: 0.45\n      mood: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&dusty from &key\n&dusty over=&key step=8n ~ 0 2 ~ 4 2@3\n```\n\nLate in on the tonic, up through the third to the fifth and back to the third, held to the bar's end: a line that sits behind the beat. Written by hand for Lo-fi hip hop's minor and its swung eighths.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&dusty`), so `use &dusty` takes it; a form reads it as its `&call` (`&call step=8n &dusty`), the line the form moves and answers.\n\nNear Lo-fi hip hop's point, 0.1 higher in bite (its energy offset, #572), so a query there finds `lazy` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&dusty from &key`. `&dusty from dusty &key` takes a copy of it, `&key` its main argument.\n","motifs/16-slap":"---\nid: slap\nassociation:\n  - point:\n      sync: 1\n      harm: 0.12\n      bite: 0.95\n      mood: 0.65\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&slap from &key\n&slap over=&key step=8n 0 0 ~ 6 0 ~ 4 ~\n```\n\nThe tonic twice, the flat seventh off the beat, the tonic, then the fifth: short and syncopated, the bass player's lick taken up by the lead. Written by hand for Funk's dorian.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&slap`), so `use &slap` takes it; a form reads it as its `&call` (`&call step=8n &slap`), the line the form moves and answers.\n\nNear Funk's point, 0.1 higher in bite (its energy offset, #572), so a query there finds `riff` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&slap from &key`. `&slap from slap &key` takes a copy of it, `&key` its main argument.\n","motifs/17-saudade":"---\nid: saudade\nassociation:\n  - point:\n      sync: 0.75\n      harm: 0.85\n      bite: 0.55\n      mood: 0.9\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&saudade from &key\n&saudade over=&key step=8n 2 ~ 3 2 ~ 1 0@2\n```\n\nThe third, the fourth and back, then falling by step to the tonic and held: a sigh between the guitar's chords. Written by hand for Bossa nova.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&saudade`), so `use &saudade` takes it; a form reads it as its `&call` (`&call step=8n &saudade`), the line the form moves and answers.\n\nNear Bossa nova's point, 0.1 higher in bite (its energy offset, #572), so a query there finds `tresillo` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&saudade from &key`. `&saudade from saudade &key` takes a copy of it, `&key` its main argument.\n","motifs/18-blue":"---\nid: blue\nassociation:\n  - point:\n      sync: 0.35\n      harm: 1\n      bite: 0.4\n      mood: 0.85\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&blue from &key\n&blue over=&key step=8n 4 3 2 1 0@2 -2@2\n```\n\nDown the scale from the fifth to the tonic and on to the sixth below, held: the line that ends a chorus on the sixth. Written by hand for Swing jazz.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&blue`), so `use &blue` takes it; a form reads it as its `&call` (`&call step=8n &blue`), the line the form moves and answers.\n\nNear Swing jazz's point, 0.1 higher in bite (its energy offset, #572), so a query there finds `bebop` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&blue from &key`. `&blue from blue &key` takes a copy of it, `&key` its main argument.\n","motifs/19-lindy":"---\nid: lindy\nassociation:\n  - point:\n      sync: 0.55\n      harm: 0.75\n      bite: 0.7\n      mood: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&lindy from &key\n&lindy over=&key step=8n 0@3 4@3 2@2\n```\n\nThe tonic, the fifth and the third on the Charleston's 3 + 3 + 2, as a Lindy hop dances it: the swing era's dance, which electro swing samples. Written by hand for Electro swing's harmonic minor.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&lindy`), so `use &lindy` takes it; a form reads it as its `&call` (`&call step=8n &lindy`), the line the form moves and answers.\n\nNear Electro swing's point, 0.1 higher in bite (its energy offset, #572), so a query there finds `gypsy` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&lindy from &key`. `&lindy from lindy &key` takes a copy of it, `&key` its main argument.\n","motifs/20-toll":"---\nid: toll\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      bite: 0.4\n      mood: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&toll from &key\n&toll over=&key step=8n 0@4 -3@4\n```\n\nA bell tolling: the tonic, then the fifth below, half a bar each. Written by hand for Spooky, the knell before the chant.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&toll`), so `use &toll` takes it; a form reads it as its `&call` (`&call step=8n &toll`), the line the form moves and answers.\n\nNear Spooky's point, 0.1 higher in bite (its energy offset, #572), so a query there finds `diesIrae` first and this one 0.05 away (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&toll from &key`. `&toll from toll &key` takes a copy of it, `&key` its main argument.\n","motifs/21-waltz":"---\nid: waltzBar\nassociation:\n  - point:\n      sync: 0\n      harm: 0.7\n      bite: 0.3\n      mood: 0.9\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&waltzBar from &key\n&waltzBar over=&key step=8n 0@2 2 4 4@2\n```\n\nThe tonic held on the downbeat, then the third and the fifth, the fifth held into the next bar: a waltz's long first beat and its two light ones.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 3/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&waltzBar`), so `&waltzBar from waltzBar &key` takes it; a form reads it as its `&call` (`&call step=8n &waltzBar`), the line the form moves and answers.\n\nAt 3/4's first point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&waltzBar from &key`. `&waltzBar from waltzBar &key` takes a copy of it, `&key` its main argument.\n","motifs/22-music-box":"---\nid: musicBox\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      bite: 0.38\n      mood: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&musicBox from &key\n&musicBox over=&key step=8n 4 3 4 1 2@2\n```\n\nThe fifth, the fourth and the fifth again, then down to the second and the third held: a music box running down, in three. Near Spooky, where 3/4 is found.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 3/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&musicBox`), so `use &musicBox` takes it; a form reads it as its `&call` (`&call step=8n &musicBox`), the line the form moves and answers.\n\nAt 3/4's point near Spooky (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&musicBox from &key`. `&musicBox from musicBox &key` takes a copy of it, `&key` its main argument.\n","motifs/23-rocking":"---\nid: rocking\nassociation:\n  - point:\n      sync: 0.3\n      harm: 0.2\n      bite: 0.2\n      mood: 0.825\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&rocking from &key\n&rocking over=&key step=8n 0@2 2 4@2 2\n```\n\nLong, short, long, short: a cradle's rock in two groups of three, from the tonic to the fifth and back to the third.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 6/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&rocking`), so `use &rocking` takes it; a form reads it as its `&call` (`&call step=8n &rocking`), the line the form moves and answers.\n\nAt 6/8's first point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&rocking from &key`. `&rocking from rocking &key` takes a copy of it, `&key` its main argument.\n","motifs/24-sway":"---\nid: sway\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      bite: 0.22\n      mood: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&sway from &key\n&sway over=&key step=8n 0@3 -1 -2 -1\n```\n\nThe tonic held for half the bar, then a slow wobble down a step, two steps and back: a candle's flame in 6/8. Near Spooky, where 6/8 is found.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 6/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&sway`), so `use &sway` takes it; a form reads it as its `&call` (`&call step=8n &sway`), the line the form moves and answers.\n\nAt 6/8's point near Spooky (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&sway from &key`. `&sway from sway &key` takes a copy of it, `&key` its main argument.\n","motifs/25-fivefold":"---\nid: fivefold\nassociation:\n  - point:\n      sync: 0.4\n      harm: 0.9\n      bite: 0.5\n      mood: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&fivefold from &key\n&fivefold over=&key step=8n 0 2 4@4 3 2 1@2\n```\n\nUp the triad to the fifth and held, the bar's first three beats, then down by step through its last two: five beats grouped 3 + 2.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 5/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&fivefold`), so `use &fivefold` takes it; a form reads it as its `&call` (`&call step=8n &fivefold`), the line the form moves and answers.\n\nAt 5/4's first point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&fivefold from &key`. `&fivefold from fivefold &key` takes a copy of it, `&key` its main argument.\n","motifs/26-limp":"---\nid: limp\nassociation:\n  - point:\n      sync: 0.8\n      harm: 0.6\n      bite: 1\n      mood: 0.375\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&limp from &key\n&limp over=&key step=8n 0 ~ 4 ~ 3 2 0\n```\n\nThe tonic, the fifth, then a run down to the tonic: short notes in 7/8's 2 + 2 + 3, the last group the long one.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 7/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&limp`), so `use &limp` takes it; a form reads it as its `&call` (`&call step=8n &limp`), the line the form moves and answers.\n\nAt 7/8's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&limp from &key`. `&limp from limp &key` takes a copy of it, `&key` its main argument.\n","motifs/27-dancer":"---\nid: dancer\nassociation:\n  - point:\n      sync: 0.6\n      harm: 0.9\n      bite: 0.8\n      mood: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&dancer from &key\n&dancer over=&key step=8n 0 ~ 2 4 ~ 5 4 2 1 0\n```\n\nTen eighths as 3 + 3 + 2 + 2: a leap up to the sixth in the threes, then stepping home in the twos.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 10/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&dancer`), so `use &dancer` takes it; a form reads it as its `&call` (`&call step=8n &dancer`), the line the form moves and answers.\n\nAt 10/8's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&dancer from &key`. `&dancer from dancer &key` takes a copy of it, `&key` its main argument.\n","motifs/28-shuffle":"---\nid: shuffle\nassociation:\n  - point:\n      sync: 0.7\n      harm: 0.6\n      bite: 0\n      mood: 0.825\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&shuffle from &key\n&shuffle over=&key step=8n 0@2 2 3@2 4 4@2 2 0@2 ~\n```\n\nLong, short four times over the bar's four beats: the tonic, the third, the fourth, the fifth and back, a slow blues shuffle in 12/8.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 12/8: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&shuffle`), so `use &shuffle` takes it; a form reads it as its `&call` (`&call step=8n &shuffle`), the line the form moves and answers.\n\nAt 12/8's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&shuffle from &key`. `&shuffle from shuffle &key` takes a copy of it, `&key` its main argument.\n","motifs/29-march":`---
id: march
association:
  - point:
      sync: 0
      harm: 0.1
      bite: 0.6
      mood: 0.45
    weight: 1
    facet: motif
  - point:
      sync: 0
      harm: 0.1
      bite: 0.75
      mood: 0.7
    weight: 1
    facet: motif
source: seed
---

\`\`\`cells
&march from &key
&march over=&key step=8n 4 4 0 ~
\`\`\`

The fifth twice, then the tonic, and a rest: a march's call, two beats to the bar.
It is a line of degrees of the key (\`over=&key\`), in eighths, one bar of 2/4: its hole is \`&key\`, and it taps the host's meter (\`step=8n\`), with no \`&bar\`, no voice and no card (#291).
Its head is named for it (\`&march\`), so \`use &march\` takes it; a form reads it as its \`&call\` (\`&call step=8n &march\`), the line the form moves and answers.

At 2/4's point (#369), weight 1, as the facet \`motif\`.

**Its signature** (decision 065): \`&march from &key\`. \`&march from march &key\` takes a copy of it, \`&key\` its main argument.

**At March's point too** (#542), weight 1, so the style finds it first.
`,"motifs/30-fanfare":"---\nid: fanfare\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.6\n      bite: 0.9\n      mood: 0.6\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&fanfare from &key\n&fanfare over=&key step=8n 0 0 0 2@2 4@2 ~\n```\n\nThe tonic three times, then the third and the fifth held: a fanfare's call, in two half-note beats.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4 alla breve: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&fanfare`), so `use &fanfare` takes it; a form reads it as its `&call` (`&call step=8n &fanfare`), the line the form moves and answers.\n\nAt 4/4 alla breve's point (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&fanfare from &key`. `&fanfare from fanfare &key` takes a copy of it, `&key` its main argument.\n","motifs/31-question":"---\nid: question\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n      mood: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&question from &key\n&question over=&key step=8n 0 1 2@2 4@4\n```\n\nUp by step to the third, then a leap to the fifth held half the bar: a phrase that ends open, asking for an answer. General-purpose, for any style.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&question`), so `use &question` takes it; a form reads it as its `&call` (`&call step=8n &question`), the line the form moves and answers.\n\nAt the centre of style space (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&question from &key`. `&question from question &key` takes a copy of it, `&key` its main argument.\n","motifs/32-reply":"---\nid: reply\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.5\n      mood: 0.45\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&reply from &key\n&reply over=&key step=8n 4 3 2@2 0@4\n```\n\nDown by step from the fifth to the third, then home to the tonic held half the bar: the closed answer to `question`. General-purpose.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&reply`), so `use &reply` takes it; a form reads it as its `&call` (`&call step=8n &reply`), the line the form moves and answers.\n\nAt the centre, 0.2 lower in energy (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&reply from &key`. `&reply from reply &key` takes a copy of it, `&key` its main argument.\n","motifs/33-arpeggio":"---\nid: arpeggio\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.3\n      bite: 0.5\n      mood: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&arpeggio from &key\n&arpeggio over=&key step=8n 0 2 4 7 4 2 0 ~\n```\n\nUp the triad to the octave and back down: the plainest line a chord gives. General-purpose, for plainer harmony.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&arpeggio`), so `use &arpeggio` takes it; a form reads it as its `&call` (`&call step=8n &arpeggio`), the line the form moves and answers.\n\nAt the centre, 0.2 lower in harmony (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&arpeggio from &key`. `&arpeggio from arpeggio &key` takes a copy of it, `&key` its main argument.\n","motifs/34-run":"---\nid: run\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.7\n      bite: 0.5\n      mood: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&run from &key\n&run over=&key step=8n 0 1 2 3 4 5 6 7\n```\n\nThe scale from the tonic to the octave, one note an eighth: in each mode it walks that mode. General-purpose, for richer harmony.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&run`), so `use &run` takes it; a form reads it as its `&call` (`&call step=8n &run`), the line the form moves and answers.\n\nAt the centre, 0.2 higher in harmony (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&run from &key`. `&run from run &key` takes a copy of it, `&key` its main argument.\n","motifs/35-neighbour":"---\nid: neighbour\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.3\n      mood: 0.5\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&neighbour from &key\n&neighbour over=&key step=8n 0 1 0 -1 0@4\n```\n\nThe tonic, the note above, the tonic, the note below, and the tonic held: the neighbour notes round one pitch. General-purpose, legato.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&neighbour`), so `use &neighbour` takes it; a form reads it as its `&call` (`&call step=8n &neighbour`), the line the form moves and answers.\n\nAt the centre, 0.2 lower in articulation (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&neighbour from &key`. `&neighbour from neighbour &key` takes a copy of it, `&key` its main argument.\n","motifs/36-leap":"---\nid: leap\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.5\n      bite: 0.7\n      mood: 0.65\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&leap from &key\n&leap over=&key step=8n 0@2 4@2 3 2 1 0\n```\n\nThe tonic, a leap to the fifth, then stepping back down the scale: a leap balanced by steps. General-purpose, short notes.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&leap`), so `use &leap` takes it; a form reads it as its `&call` (`&call step=8n &leap`), the line the form moves and answers.\n\nAt the centre, 0.2 higher in articulation (#369), weight 1, as the facet `motif`.\n\n**Its signature** (decision 065): `&leap from &key`. `&leap from leap &key` takes a copy of it, `&key` its main argument.\n","motifs/37-wail":"---\nid: wail\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      bite: 0.25\n      mood: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&wail from &key\n&wail over=&key step=8n 4@3 3#@2 3@3\n```\n\nA held note that sags: the fifth held, then a semitone lower and a semitone lower again, as a ghost's moan bends down (A, G♯, G in D harmonic minor).\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&wail`), so `use &wail` takes it; a form reads it as its `&call` (`&call step=8n &wail`), the line the form moves and answers.\nNear Spooky's point (sync .2, harm .9, bite .3, mood .3; yggi/jambot#517), 0.05 lower in bite (its energy offset, #572), weight 1, as the facet `motif`: one of the ghost-house idioms, a gesture of the genre and no quotation of any tune.\n\n**Its signature** (decision 065): `&wail from &key`. `&wail from wail &key` takes a copy of it, `&key` its main argument.\n","motifs/38-haunt":"---\nid: haunt\nassociation:\n  - point:\n      sync: 0.15\n      harm: 0.9\n      bite: 0.25\n      mood: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&haunt from &key\n&haunt over=&key step=8n 2 4 6 9 6 4 2@2\n```\n\nThe augmented triad on the third, up and back: the third, the fifth, the raised seventh, the third an octave up, and down again (F A C♯ F C♯ A F in D harmonic minor), each step a major third, so no note sounds like home.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&haunt`), so `use &haunt` takes it; a form reads it as its `&call` (`&call step=8n &haunt`), the line the form moves and answers.\nNear Spooky's point (sync .2, harm .9, bite .3, mood .3; yggi/jambot#517), 0.05 lower in sync and bite, weight 1, as the facet `motif`: one of the ghost-house idioms, a gesture of the genre and no quotation of any tune.\n\n**Its signature** (decision 065): `&haunt from &key`. `&haunt from haunt &key` takes a copy of it, `&key` its main argument.\n","motifs/39-lament":"---\nid: lament\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      bite: 0.25\n      mood: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&lament from &key\n&lament over=&key step=8n 4 3# 3 2# 2 1 0@2\n```\n\nA chromatic descent from the fifth to the tonic, semitone by semitone where the key allows (A G♯ G F♯ F E D in D harmonic minor): the lament's falling line, made to creep.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&lament`), so `use &lament` takes it; a form reads it as its `&call` (`&call step=8n &lament`), the line the form moves and answers.\nNear Spooky's point (sync .2, harm .9, bite .3, mood .3; yggi/jambot#517), 0.05 lower in bite, weight 1, as the facet `motif`: one of the ghost-house idioms, a gesture of the genre and no quotation of any tune.\n\n**Its signature** (decision 065): `&lament from &key`. `&lament from lament &key` takes a copy of it, `&key` its main argument.\n","motifs/40-peek":"---\nid: peek\nassociation:\n  - point:\n      sync: 0.3\n      harm: 0.9\n      bite: 0.3\n      mood: 0.3\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&peek from &key\n&peek over=&key step=8n ~ 0 1b 0 ~ ~ -1 0\n```\n\nSomething peeks and hides: a rest, the tonic and the flat second above it and back, a silence, then the leading note below and the tonic (D E♭ D, C♯ D): the semitones on either side of home, the boo that comes when the back is turned.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&peek`), so `use &peek` takes it; a form reads it as its `&call` (`&call step=8n &peek`), the line the form moves and answers.\nIts two rests are written apart (`~ ~`), not held (`~@2`), which plays the same: cells' vary reads no line with a held rest, so it would offer no variation of it, and the recogniser no answer.\nNear Spooky's point (sync .2, harm .9, bite .3, mood .3; yggi/jambot#517), 0.1 higher in sync and 0.05 lower in bite (its energy offset, #572), weight 1, as the facet `motif`: one of the ghost-house idioms, a gesture of the genre and no quotation of any tune.\n\n**Its signature** (decision 065): `&peek from &key`. `&peek from peek &key` takes a copy of it, `&key` its main argument.\n","motifs/47-rave-hook":`---
id: raveHook
association:
  - point:
      sync: 0.25
      harm: 0.45
      bite: 0.8
      mood: 0.9
    weight: 1
    facet: motif
source: seed
lifted: yggi/cells examples/hypercell.md @ 014c4c73
---

\`\`\`cells
&raveHook from &key
&raveHook over=&key step=8n 11!2 13 11 10 9 10@2
\`\`\`

The hook of [Hypercell](../../examples/hypercell.md), its first bar: an upper note struck twice, a leap a third up, and down by step to rest a beat. The example writes it in semitones over C; here it is in the degrees of a minor key, so it sits in any key it is given.

At Happy hardcore's point (sync .25, harm .45, bite .8, mood .9), weight 1, as the facet \`motif\` (#572).
`,"motifs/48-sequencer":`---
id: sequencer
association:
  - point:
      sync: 0.15
      harm: 0.5
      bite: 0.85
      mood: 0.45
    weight: 1
    facet: motif
source: seed
lifted: yggi/cells examples/zell.md @ 014c4c73
---

\`\`\`cells
&sequencer from &key
&sequencer over=&key step=8n 0 2 4 7 0 2 4 7
\`\`\`

The sequencer arpeggio of [Zelluläre Aktivität](../../examples/zell.md): the triad and its octave, up, twice a bar in eighths, the sequencer's figure (the example runs it in sixteenths, four times a bar; a motif is a bar of eighths, as every form reads it).

At Elektro's point (sync .15, harm .5, bite .85, mood .45), weight 1, as the facet \`motif\` (#572).
`,"motifs/49-melodie":`---
id: melodie
association:
  - point:
      sync: 0.15
      harm: 0.5
      bite: 0.75
      mood: 0.45
    weight: 1
    facet: motif
source: seed
lifted: yggi/cells examples/zell.md @ 014c4c73
---

\`\`\`cells
&melodie from &key
&melodie over=&key step=8n 4@2 2 1 0@4
\`\`\`

The melody of [Zelluläre Aktivität](../../examples/zell.md), its first bar: the fifth held, down by step to the tonic, held half the bar, plain over the arpeggio.

Near Elektro's point, 0.1 lower in bite (sync .15, harm .5, bite .75, mood .45), weight 1, as the facet \`motif\`, so a query there finds \`sequencer\` first and this one 0.05 away (#572).
`,"motifs/50-ghost-phrase":`---
id: ghostPhrase
association:
  - point:
      sync: 0.35
      harm: 0.15
      bite: 0.4
      mood: 0.1
    weight: 1
    facet: motif
source: seed
lifted: yggi/cells examples/ghosts.md @ a8de625f
---

\`\`\`cells
&ghostPhrase from &key
&ghostPhrase over=&key step=8n 0 4 3 ~ 7 5 ~ ~
\`\`\`

The piano's phrase of [Ghost-Cells](../../examples/ghosts.md): the tonic, the fifth, the fourth, the octave and the sixth, with rests between. The example plays it seven eighths long over a bar of eight, so it comes round a step later each bar; as a motif it is one bar of eighths, its eighth a rest, as every form reads one.

At Dark ambient's point (sync .35, harm .15, bite .4, mood .1), weight 1, as the facet \`motif\` (#572).
`,"motifs/51-royal-theme":`---
id: royalTheme
association:
  - point:
      sync: 0.15
      harm: 0.8
      bite: 0.5
      mood: 0.85
    weight: 1
    facet: motif
source: seed
lifted: yggi/cells examples/ricercar.md @ 3504291b
---

\`\`\`cells
&royalTheme from &key
&royalTheme over=&key step=8n 0@2 2@2 4@2 5@2
\`\`\`

The King's theme of [Ricercar](../../examples/ricercar.md), its first bar: the tonic, the third, the fifth and the sixth, a quarter each, rising, the subject Frederick the Great gave Bach for the *Musical Offering*. Public domain.

At Baroque's point (sync 0.15, harm 0.8, bite 0.5, mood 0.85), weight 1, as the facet \`motif\` (#542).
`,"motifs/52-blues-riff":`---
id: bluesRiff
association:
  - point:
      sync: 0.65
      harm: 0.55
      bite: 0.45
      mood: 0.65
    weight: 1
    facet: motif
source: seed
lifted: yggi/cells examples/jazz.md @ b3c0acea
---

\`\`\`cells
&bluesRiff from &key
&bluesRiff over=&key step=8n 0 2 3 4 ~ 6 4 ~
\`\`\`

The riff of [Swing blues](../../examples/jazz.md), its first bar: up from the tonic to the fifth, a leap to the seventh and back. The example plays it on the blues scale, its blue notes included; here it is in the key's degrees, so a mixolydian key gives it its flat seventh.

At Blues shuffle's point (sync 0.65, harm 0.55, bite 0.45, mood 0.65), weight 1, as the facet \`motif\` (#542).
`,"motifs/53-drunken-sailor":`---
id: drunkenSailor
association:
  - point:
      sync: 0.1
      harm: 0.25
      bite: 0.7
      mood: 0.65
    weight: 1
    facet: motif
source: seed
lifted: yggi/cells examples/sailor.md @ 014c4c73
---

\`\`\`cells
&drunkenSailor from &key
&drunkenSailor over=&key step=8n 4 4 4 4 4 4 0 2
\`\`\`

The tune of [Drunken Sailor](../../examples/sailor.md), its first bar: the fifth struck six times, *what shall we do with the*, then down to the tonic and up a third. A traditional sea shanty, public domain, in its dorian key.

At Sea shanty's point (sync 0.1, harm 0.25, bite 0.7, mood 0.65), weight 1, as the facet \`motif\` (#542).
`,"motifs/54-korobeiniki":`---
id: korobeinikiBar
association:
  - point:
      sync: 0.3
      harm: 0.7
      bite: 1
      mood: 0.55
    weight: 1
    facet: motif
source: seed
lifted: yggi/cells examples/korobeiniki.md @ a8de625f
---

\`\`\`cells
&korobeinikiBar from &key
&korobeinikiBar over=&key step=8n 7@2 2 3 5@2 3 2
\`\`\`

The tune of [Korobeiniki](../../examples/korobeiniki.md), its first bar: the octave held, a leap down to the third, up by step to the fifth and back. A Russian folk song, public domain, known to many from a falling-blocks video game.

At Chiptune's point (sync 0.3, harm 0.7, bite 1, mood 0.55), weight 1, as the facet \`motif\` (#542).
`,"motifs/55-guajeo":"---\nid: guajeo\nassociation:\n  - point:\n      sync: 0.9\n      harm: 0.5\n      bite: 0.7\n      mood: 0.75\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&guajeo from &key\n&guajeo over=&key step=8n ~ 2 4 ~ 2 4 ~ 7\n```\n\nA guajeo, the piano's ostinato in a montuno: the third and the fifth off the beat, twice, and the octave on the last off-beat, every downbeat left out.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&guajeo`), so `use &guajeo` takes it; a form reads it as its `&call` (`&call step=8n &guajeo`), the line the form moves and answers.\n\nAt Salsa's point (sync 0.9, harm 0.5, bite 0.7, mood 0.75), weight 1, as the facet `motif` (#542).\n\n**Its signature** (decision 065): `&guajeo from &key`. `&guajeo from guajeo &key` takes a copy of it, `&key` its main argument.\n","motifs/56-smoke":"---\nid: smoke\nassociation:\n  - point:\n      sync: 0.7\n      harm: 0.2\n      bite: 0.2\n      mood: 0.25\n    weight: 1\n    facet: motif\nsource: seed\n---\n\n```cells\n&smoke from &key\n&smoke over=&key step=8n 4@3 3 2@2 0 ~\n```\n\nA slow line falling through the minor key, the fifth held, then the fourth, the third and the tonic, and a breath: trip-hop's sung lament.\nIt is a line of degrees of the key (`over=&key`), in eighths, one bar of 4/4: its hole is `&key`, and it taps the host's meter (`step=8n`), with no `&bar`, no voice and no card (#291).\nIts head is named for it (`&smoke`), so `use &smoke` takes it; a form reads it as its `&call` (`&call step=8n &smoke`), the line the form moves and answers.\n\nAt Trip-hop's point (sync 0.7, harm 0.2, bite 0.2, mood 0.25), weight 1, as the facet `motif` (#542).\n\n**Its signature** (decision 065): `&smoke from &key`. `&smoke from smoke &key` takes a copy of it, `&key` its main argument.\n","performers/01-drums":`---
id: drums_performer
association:
  - point:
      sync: 0.3
      harm: 0.45
      bite: 0.55
    weight: 1
    facet: performer
  - point:
      sync: 0.12
      harm: 0
      bite: 1
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 0.55
      bite: 0.65
    weight: 1
    facet: performer
  - point:
      sync: 0.05
      harm: 0.3
      bite: 0
    weight: 1
    facet: performer
  - point:
      sync: 0.5
      harm: 0.75
      bite: 0.35
    weight: 1
    facet: performer
  - point:
      sync: 1
      harm: 0.12
      bite: 0.85
    weight: 1
    facet: performer
  - point:
      sync: 0.75
      harm: 0.85
      bite: 0.45
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 1
      bite: 0.3
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
      bite: 0.55
    weight: 1
    facet: performer
  - point:
      sync: 0.12
      harm: 0
      bite: 1
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 0.55
      bite: 0.65
    weight: 1
    facet: performer
  - point:
      sync: 0.05
      harm: 0.3
      bite: 0
    weight: 1
    facet: performer
  - point:
      sync: 0.5
      harm: 0.75
      bite: 0.35
    weight: 1
    facet: performer
  - point:
      sync: 1
      harm: 0.12
      bite: 0.85
    weight: 1
    facet: performer
  - point:
      sync: 0.75
      harm: 0.85
      bite: 0.45
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 1
      bite: 0.3
    weight: 1
    facet: performer
source: seed
---

\`\`\`cells
&bass, &bassOut from (&bassLevel, &bassV, &style) &bassline
&bassV from bass(style=&style)
&bassOut play=&bassline^$-12 level=&bassLevel &bassV
&bass map=role part=bass &bassOut
&bassLevel map=amp .8
&style map=style sync=.5 harm=.5 bite=.5 mood=.5
\`\`\`

The bass player (decisions 058 and 061): a gate, \`&bassOut\` (Jambot's section text's name for it), whose role is \`bass\` (\`&bass map=role &bassOut\`), playing the part \`&bassline\` on the \`bass\` instrument an octave down.
The instrument holds the register, \`&bassV loop=C2\`, and Jambot's section text sounds its bass at C1 (\`PIN_VOICES.bass\`, yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b), so the gate moves the part 12 grid steps down (\`^$-12\`), and the bass sends the MIDI notes it sends today.
Its two inputs are the score's (decision 065: the line its main parameter, the level an optional one, one level of .8 by default): \`&bassline\`, the line (degrees over the chord in force or the key, held and shared as the section text writes them), and \`&bassLevel\`, its velocities as written: a line of levels (\`map=amp step=16n\`), or one level where they are all one (\`&bassLevel map=amp .8\`).

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`styles\`), at weight 1: every preset's section text plays this part the same way (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b: one voice, one register and one channel for all eight), so the eight share this one performer, and what a preset sounds like is its parts, not its players.

**Its signature** (decision 065): \`&bass, &bassOut from (&bassLevel, &bassV, &style) &bassline\`. \`&bass from bass_performer &line\` takes a copy of it, \`&bassline\` its main argument; \`&bassLevel\` an optional parameter, its line its default (\`"bass_performer"(bassLevel=…)\`).
Its instrument and the style it plays at are optional parameters too (decision 075, #560): \`&bassV\` its default \`&bassV from bass(style=&style)\`, the \`bass\` instrument, and \`&style\` the centre of style space. A piece passes its own (\`bass_performer(bassV=&bassV, style=&style)\`), where it took them by their names before; Migrate writes it.
`,"performers/03-pad":`---
id: pad_performer
association:
  - point:
      sync: 0.3
      harm: 0.45
      bite: 0.55
    weight: 1
    facet: performer
  - point:
      sync: 0.12
      harm: 0
      bite: 1
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 0.55
      bite: 0.65
    weight: 1
    facet: performer
  - point:
      sync: 0.05
      harm: 0.3
      bite: 0
    weight: 1
    facet: performer
  - point:
      sync: 0.5
      harm: 0.75
      bite: 0.35
    weight: 1
    facet: performer
  - point:
      sync: 1
      harm: 0.12
      bite: 0.85
    weight: 1
    facet: performer
  - point:
      sync: 0.75
      harm: 0.85
      bite: 0.45
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 1
      bite: 0.3
    weight: 1
    facet: performer
source: seed
---

\`\`\`cells
&pad, &padOut from (&padLevel, &padV, &style) &padline
&padV from pad(style=&style)
&padOut play=&padline level=&padLevel &padV
&pad map=role part=pad &padOut
&padLevel map=amp .8
&style map=style sync=.5 harm=.5 bite=.5 mood=.5
\`\`\`

The pad player (decisions 058 and 061): a gate, \`&padOut\` (Jambot's section text's name for it), whose role is \`pad\` (\`&pad map=role &padOut\`), playing the part \`&padline\` on the \`pad\` instrument, at its register (\`&padV loop=C3\`, where Jambot's section text sounds its comp: \`PIN_VOICES.comp\`, yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b), so with no move.
Its two inputs are the score's (decision 065: the line its main parameter, the level an optional one, one level of .8 by default): \`&padline\`, the line, and \`&padLevel\`, its velocities as written, a line of levels or one level.

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`styles\`), at weight 1: every preset's section text plays this part the same way (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b: one voice, one register and one channel for all eight), so the eight share this one performer, and what a preset sounds like is its parts, not its players.

**Its signature** (decision 065): \`&pad, &padOut from (&padLevel, &padV, &style) &padline\`. \`&pad from pad_performer &line\` takes a copy of it, \`&padline\` its main argument; \`&padLevel\` an optional parameter, its line its default (\`"pad_performer"(padLevel=…)\`).
Its instrument and the style it plays at are optional parameters too (decision 075, #560): \`&padV\` its default \`&padV from pad(style=&style)\`, the \`pad\` instrument, and \`&style\` the centre of style space. A piece passes its own (\`pad_performer(padV=&padV, style=&style)\`), where it took them by their names before; Migrate writes it.
`,"performers/04-stab":`---
id: stab_performer
association:
  - point:
      sync: 0.3
      harm: 0.45
      bite: 0.55
    weight: 1
    facet: performer
  - point:
      sync: 0.12
      harm: 0
      bite: 1
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 0.55
      bite: 0.65
    weight: 1
    facet: performer
  - point:
      sync: 0.05
      harm: 0.3
      bite: 0
    weight: 1
    facet: performer
  - point:
      sync: 0.5
      harm: 0.75
      bite: 0.35
    weight: 1
    facet: performer
  - point:
      sync: 1
      harm: 0.12
      bite: 0.85
    weight: 1
    facet: performer
  - point:
      sync: 0.75
      harm: 0.85
      bite: 0.45
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 1
      bite: 0.3
    weight: 1
    facet: performer
source: seed
---

\`\`\`cells
&stab, &stabOut from (&stabLevel, &keysV, &style) &stabline
&keysV from keys(style=&style)
&stabOut play=&stabline level=&stabLevel &keysV
&stab map=role part=stab &stabOut
&stabLevel map=amp .8
&style map=style sync=.5 harm=.5 bite=.5 mood=.5
\`\`\`

The stab player (decisions 058 and 061): a gate, \`&stabOut\` (Jambot's section text's name for it), whose role is \`stab\` (\`&stab map=role &stabOut\`), playing the part \`&stabline\` on the \`keys\` instrument, at its register (\`&keysV loop=C3\`, where Jambot's section text sounds its comp: \`PIN_VOICES.comp\`, yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b), so with no move.
Its two inputs are the score's (decision 065: the line its main parameter, the level an optional one, one level of .8 by default): \`&stabline\`, the line, and \`&stabLevel\`, its velocities as written, a line of levels or one level. Jambot sends the pad and the stab on one channel, 3: the score's card puts both gates in one entry (\`[&padOut, &stabOut]\`).

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`styles\`), at weight 1: every preset's section text plays this part the same way (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b: one voice, one register and one channel for all eight), so the eight share this one performer, and what a preset sounds like is its parts, not its players.

**Its signature** (decision 065): \`&stab, &stabOut from (&stabLevel, &keysV, &style) &stabline\`. \`&stab from stab_performer &line\` takes a copy of it, \`&stabline\` its main argument; \`&stabLevel\` an optional parameter, its line its default (\`"stab_performer"(stabLevel=…)\`).
Its instrument and the style it plays at are optional parameters too (decision 075, #560): \`&keysV\` its default \`&keysV from keys(style=&style)\`, the \`keys\` instrument, and \`&style\` the centre of style space. A piece passes its own (\`stab_performer(keysV=&keysV, style=&style)\`), where it took them by their names before; Migrate writes it.
`,"performers/05-lead":`---
id: lead_performer
association:
  - point:
      sync: 0.3
      harm: 0.45
      bite: 0.55
    weight: 1
    facet: performer
  - point:
      sync: 0.12
      harm: 0
      bite: 1
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 0.55
      bite: 0.65
    weight: 1
    facet: performer
  - point:
      sync: 0.05
      harm: 0.3
      bite: 0
    weight: 1
    facet: performer
  - point:
      sync: 0.5
      harm: 0.75
      bite: 0.35
    weight: 1
    facet: performer
  - point:
      sync: 1
      harm: 0.12
      bite: 0.85
    weight: 1
    facet: performer
  - point:
      sync: 0.75
      harm: 0.85
      bite: 0.45
    weight: 1
    facet: performer
  - point:
      sync: 0.35
      harm: 1
      bite: 0.3
    weight: 1
    facet: performer
source: seed
---

\`\`\`cells
&lead, &leadOut from (&leadLevel, &leadV, &style) &leadline
&leadV from lead(style=&style)
&leadOut play=&leadline level=&leadLevel &leadV
&lead map=role part=lead &leadOut
&leadLevel map=amp .8
&style map=style sync=.5 harm=.5 bite=.5 mood=.5
\`\`\`

The lead player (decisions 058 and 061): a gate, \`&leadOut\` (Jambot's section text's name for it), whose role is \`lead\` (\`&lead map=role &leadOut\`), playing the part \`&leadline\` on the \`lead\` instrument, at its register (\`&leadV loop=C4\`, where Jambot's section text sounds its lead: \`PIN_VOICES.lead\`, yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b), so with no move.
Its two inputs are the score's (decision 065: the line its main parameter, the level an optional one, one level of .8 by default): \`&leadline\`, the line (degrees over the melodic scale or the key), and \`&leadLevel\`, its velocities as written, a line of levels or one level.

Associated as the facet \`performer\` at each of Jambot's eight presets' points (\`styles\`), at weight 1: every preset's section text plays this part the same way (yggi/jambot \`packages/score/src/section-text.ts\` @ 24a528b: one voice, one register and one channel for all eight), so the eight share this one performer, and what a preset sounds like is its parts, not its players.

**Its signature** (decision 065): \`&lead, &leadOut from (&leadLevel, &leadV, &style) &leadline\`. \`&lead from lead_performer &line\` takes a copy of it, \`&leadline\` its main argument; \`&leadLevel\` an optional parameter, its line its default (\`"lead_performer"(leadLevel=…)\`).
Its instrument and the style it plays at are optional parameters too (decision 075, #560): \`&leadV\` its default \`&leadV from lead(style=&style)\`, the \`lead\` instrument, and \`&style\` the centre of style space. A piece passes its own (\`lead_performer(leadV=&leadV, style=&style)\`), where it took them by their names before; Migrate writes it.
`,"rhythms/01-synth-pop-drums":"---\nid: synth_pop_drums\nassociation:\n  - point:\n      sync: 0.3\n      harm: 0.45\n      bite: 0.55\n    weight: 1\n    facet: rhythm\nsource: seed\nlifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8\n---\n\n```cells\n&kick, &backbeat, &fill, &ghost, &hat, &groove from (&bd, &sd, &hh)\n&bd, &sd, &hh from gm_kit\n&kick role=kick step=16n &bd:0:.547833 ~ ~ ~ ~ ~ ~ ~ &bd:0:.536239 ~ ~ ~ ~ ~ ~ ~\n&backbeat role=backbeat step=16n ~ ~ ~ ~ &sd:0:.458553 ~ ~ ~ ~ ~ ~ ~ &sd:0:.469279 ~ ~ ~\n&fill role=fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.161262 &sd:0:.303801 &sd:0:.386943\n&ghost role=ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.048608 ~ ~ ~ ~ ~ ~ ~ ~\n&hat role=hat step=16n ~ ~ ~ ~ &hh:0:.278319 ~ ~ ~ &hh:0:.270073 ~ ~ ~ &hh:0:.253953 ~ &hh:0:.201438 ~\n&groove [&kick, &backbeat, &fill, &ghost, &hat]\n```\n\nJambot's E31 bar for Synth-pop (yggi/jambot#317): the band's drum part as cells text, without its `&bar` line and its stand-in voices (`&bd s=white` …: the kit fills them, decision 054, rung 2) and its card (its mix is `&groove`, with no `map=midi(10)`: where its notes go is the workbench's and the drummer's, #291), so the host's `&bar`, written first, sets its meter and tempo. At Synth-pop's point.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&sd`, `&hh`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &sd, &hh from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `synth_pop_drums(bd=&mine)`.\n","rhythms/02-techno-drums":"---\nid: techno_drums\nassociation:\n  - point:\n      sync: 0.12\n      harm: 0\n      bite: 1\n    weight: 1\n    facet: rhythm\nsource: seed\nlifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8\n---\n\n```cells\n&kick, &backbeat, &fill, &hat, &groove from (&bd, &sd, &hh, &oh)\n&bd, &sd, &hh, &oh from gm_kit\n&kick role=kick step=16n &bd:0:.763904 ~ ~ ~ &bd:0:.536239 ~ ~ ~ ~ ~ ~ ~ &bd:0:.524769 ~ ~ ~\n&backbeat role=backbeat step=16n ~ ~ ~ ~ &sd:0:.607663 ~ ~ ~ ~ ~ ~ ~ &sd:0:.696633 ~ ~ ~\n&fill role=fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.155 &sd:0:.201438 &sd:0:.261951 &sd:0:.321409 ~ &sd:0:.469279 &sd:0:.571393 &sd:0:.632463\n&hat role=hat step=16n &hh:0:.367599 &hh:0:.148862 &oh:0:.270073 &hh:0:.148862 &hh:0:.377209 &hh:0:.148862 &oh:0:.278319 &hh:0:.155 &hh:0:.367599 &hh:0:.148862 &oh:0:.278319 &hh:0:.148862 &hh:0:.377209 &hh:0:.148862 &oh:0:.270073 &hh:0:.148862\n&groove [&kick, &backbeat, &fill, &hat]\n```\n\nJambot's E31 bar for Techno (yggi/jambot#317): the band's drum part as cells text, without its `&bar` line and its stand-in voices (`&bd s=white` …: the kit fills them, decision 054, rung 2) and its card (its mix is `&groove`, with no `map=midi(10)`: where its notes go is the workbench's and the drummer's, #291), so the host's `&bar`, written first, sets its meter and tempo. At Techno's point.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&sd`, `&hh`, `&oh`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &sd, &hh, &oh from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `techno_drums(bd=&mine)`.\n","rhythms/03-deep-house-drums":"---\nid: deep_house_drums\nassociation:\n  - point:\n      sync: 0.35\n      harm: 0.55\n      bite: 0.65\n    weight: 1\n    facet: rhythm\nsource: seed\nlifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8\n---\n\n```cells\n&kick, &backbeat, &fill, &ghost, &hat, &groove from (&bd, &sd, &hh)\n&bd, &sd, &hh from gm_kit\n&kick role=kick step=16n &bd:0:.595449 ~ ~ ~ ~ ~ ~ ~ &bd:0:.571393 ~ ~ ~ ~ ~ ~ ~\n&backbeat role=backbeat step=16n ~ ~ ~ ~ &sd:0:.502201 ~ ~ ~ ~ ~ ~ ~ &sd:0:.491103 ~ ~ ~\n&fill role=fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.161262 &sd:0:.339513 &sd:0:.406783\n&ghost role=ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.048608 ~ ~ ~ ~ ~ ~ ~ ~\n&hat role=hat step=16n &hh:0:.321409 ~ &hh:0:.253953 ~ &hh:0:.303801 ~ ~ ~ &hh:0:.286689 ~ ~ ~ &hh:0:.261951 &hh:0:.094302 &hh:0:.230702 ~\n&groove [&kick, &backbeat, &fill, &ghost, &hat]\n```\n\nJambot's E31 bar for Deep house (yggi/jambot#317): the band's drum part as cells text, without its `&bar` line and its stand-in voices (`&bd s=white` …: the kit fills them, decision 054, rung 2) and its card (its mix is `&groove`, with no `map=midi(10)`: where its notes go is the workbench's and the drummer's, #291), so the host's `&bar`, written first, sets its meter and tempo. At Deep house's point.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&sd`, `&hh`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &sd, &hh from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `deep_house_drums(bd=&mine)`.\n","rhythms/04-ambient-drums":"---\nid: ambient_drums\nassociation:\n  - point:\n      sync: 0.05\n      harm: 0.3\n      bite: 0\n    weight: 1\n    facet: rhythm\nsource: seed\nlifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8\n---\n\n```cells\n&kick, &backbeat, &fill, &hat, &groove from (&bd, &sd, &hh)\n&bd, &sd, &hh from gm_kit\n&kick role=kick step=16n &bd:0:.513423 ~ ~ ~ ~ ~ ~ ~ &bd:0:.502201 ~ ~ ~ ~ ~ ~ ~\n&backbeat role=backbeat step=16n ~ ~ ~ ~ &sd:0:.386943 ~ ~ ~ ~ ~ ~ ~ &sd:0:.458553 ~ ~ ~\n&fill role=fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.0992 &sd:0:.136958 &sd:0:.167648 &sd:0:.194432 ~ &sd:0:.303801 &sd:0:.416889 &sd:0:.396801\n&hat role=hat step=16n &hh:0:.238328 ~ &hh:0:.174158 ~ &hh:0:.261951 ~ ~ ~ &hh:0:.230702 ~ &hh:0:.201438 ~ &hh:0:.261951 ~ &hh:0:.2232 ~\n&groove [&kick, &backbeat, &fill, &hat]\n```\n\nJambot's E31 bar for Ambient (yggi/jambot#317): the band's drum part as cells text, without its `&bar` line and its stand-in voices (`&bd s=white` …: the kit fills them, decision 054, rung 2) and its card (its mix is `&groove`, with no `map=midi(10)`: where its notes go is the workbench's and the drummer's, #291), so the host's `&bar`, written first, sets its meter and tempo. At Ambient's point.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&sd`, `&hh`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &sd, &hh from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `ambient_drums(bd=&mine)`.\n","rhythms/05-lo-fi-hip-hop-drums":"---\nid: lo_fi_hip_hop_drums\nassociation:\n  - point:\n      sync: 0.5\n      harm: 0.75\n      bite: 0.35\n    weight: 1\n    facet: rhythm\nsource: seed\nlifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8\n---\n\n```cells\n&kick, &backbeat, &fill, &ghost, &hat, &euclid, &euclidLevel, &groove from (&bd, &rim, &sd, &hh)\n&bd, &rim, &sd, &hh from gm_kit\n&kick role=kick step=16n &bd:0:.524769 ~ ~ &bd:0:.286689 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~\n&backbeat role=backbeat step=16n ~ ~ ~ ~ &sd:0:.458553 ~ ~ ~ ~ ~ ~ ~ &sd:0:.416889 ~ ~ ~\n&fill role=fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.12555 &sd:0:.321409 &sd:0:.358113\n&ghost role=ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.041912 ~ ~ ~ ~ ~ ~ ~ ~\n&hat role=hat step=16n ~ ~ ~ ~ &hh:0:.278319 ~ ~ ~ &hh:0:.253953 ~ ~ ~ &hh:0:.2232 ~ &hh:0:.215822 ~\n&euclid role=euclid step=1m &rim(5,16,4)\n&euclidLevel map=amp step=16n .201438 0 0 0 .215822 0 0 .161262 0 0 .230702 0 0 .194432 0 0\n&groove [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]\n```\n\nJambot's E31 bar for Lo-fi hip hop (yggi/jambot#317): the band's drum part as cells text, without its `&bar` line and its stand-in voices (`&bd s=white` …: the kit fills them, decision 054, rung 2) and its card (its mix is `&groove`, with no `map=midi(10)`: where its notes go is the workbench's and the drummer's, #291), so the host's `&bar`, written first, sets its meter and tempo. At Lo-fi hip hop's point. The rim's Euclid taps `1m`, and under a swung meter its strokes lean on the sixteenths the meter leans, as the band's rim does (#121).\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&rim`, `&sd`, `&hh`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &rim, &sd, &hh from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `lo_fi_hip_hop_drums(bd=&mine)`.\n","rhythms/06-funk-drums":"---\nid: funk_drums\nassociation:\n  - point:\n      sync: 1\n      harm: 0.12\n      bite: 0.85\n    weight: 1\n    facet: rhythm\nsource: seed\nlifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8\n---\n\n```cells\n&kick, &backbeat, &fill, &ghost, &hat, &euclid, &euclidLevel, &groove from (&bd, &rim, &sd, &hh, &oh)\n&bd, &rim, &sd, &hh, &oh from gm_kit\n&kick role=kick step=16n &bd:0:.645049 ~ ~ &bd:0:.386943 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~\n&backbeat role=backbeat step=16n ~ ~ ~ ~ &sd:0:.536239 ~ ~ ~ ~ ~ ~ ~ &sd:0:.536239 ~ ~ ~\n&fill role=fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.180792 &sd:0:.367599 &sd:0:.447951\n&ghost role=ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.089528 ~ ~ ~ ~ ~ ~ ~ ~\n&hat role=hat step=16n &hh:0:.348751 ~ &oh:0:.253953 ~ &hh:0:.330399 &hh:0:.114638 &oh:0:.230702 ~ &hh:0:.312543 ~ ~ ~ &hh:0:.286689 &hh:0:.104222 &oh:0:.215822 ~\n&euclid role=euclid step=1m &rim(7,16,0)\n&euclidLevel map=amp step=16n .253953 0 0 .270073 0 .270073 0 .230702 0 0 .278319 0 .270073 0 .295183 0\n&groove [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]\n```\n\nJambot's E31 bar for Funk (yggi/jambot#317): the band's drum part as cells text, without its `&bar` line and its stand-in voices (`&bd s=white` …: the kit fills them, decision 054, rung 2) and its card (its mix is `&groove`, with no `map=midi(10)`: where its notes go is the workbench's and the drummer's, #291), so the host's `&bar`, written first, sets its meter and tempo. At Funk's point. The rim's Euclid taps `1m`, and under a swung meter its strokes lean on the sixteenths the meter leans, as the band's rim does (#121).\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&rim`, `&sd`, `&hh`, `&oh`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &rim, &sd, &hh, &oh from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `funk_drums(bd=&mine)`.\n","rhythms/07-bossa-nova-drums":"---\nid: bossa_nova_drums\nassociation:\n  - point:\n      sync: 0.75\n      harm: 0.85\n      bite: 0.45\n    weight: 1\n    facet: rhythm\nsource: seed\nlifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8\n---\n\n```cells\n&kick, &backbeat, &fill, &ghost, &hat, &euclid, &euclidLevel, &groove from (&bd, &rim, &sd, &hh)\n&bd, &rim, &sd, &hh from gm_kit\n&kick role=kick step=16n &bd:0:.502201 ~ ~ &bd:0:.312543 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~\n&backbeat role=backbeat step=16n ~ ~ ~ ~ &sd:0:.416889 ~ ~ ~ ~ ~ ~ ~ &sd:0:.427119 ~ ~ ~\n&fill role=fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.148862 &sd:0:.278319 &sd:0:.348751\n&ghost role=ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.063488 ~ ~ ~ ~ ~ ~ ~ ~\n&hat role=hat step=16n ~ ~ ~ ~ ~ ~ ~ ~ &hh:0:.246078 ~ ~ ~ &hh:0:.230702 ~ &hh:0:.18755 ~\n&euclid role=euclid step=1m &rim(5,16,4)\n&euclidLevel map=amp step=16n .201438 0 0 0 .208568 0 0 .180792 0 0 .215822 0 0 .201438 0 0\n&groove [&kick, &backbeat, &fill, &ghost, &hat, &euclid * &euclidLevel]\n```\n\nJambot's E31 bar for Bossa nova (yggi/jambot#317): the band's drum part as cells text, without its `&bar` line and its stand-in voices (`&bd s=white` …: the kit fills them, decision 054, rung 2) and its card (its mix is `&groove`, with no `map=midi(10)`: where its notes go is the workbench's and the drummer's, #291), so the host's `&bar`, written first, sets its meter and tempo. At Bossa nova's point.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&rim`, `&sd`, `&hh`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &rim, &sd, &hh from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `bossa_nova_drums(bd=&mine)`.\n","rhythms/08-swing-jazz-drums":"---\nid: swing_jazz_drums\nassociation:\n  - point:\n      sync: 0.35\n      harm: 1\n      bite: 0.3\n    weight: 1\n    facet: rhythm\nsource: seed\nlifted: yggi/jambot packages/score/experiments/drums-in-cells.ts @ 327d6a8\n---\n\n```cells\n&kick, &backbeat, &fill, &ghost, &hat, &pedal, &groove from (&bd, &sd, &ph, &rd)\n&bd, &sd, &ph, &rd from gm_kit\n&kick role=kick step=16n &bd:0:.559551 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~\n&backbeat role=backbeat step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.416889 ~ ~ ~\n&fill role=fill step=16n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ &sd:0:.109368 &sd:0:.386943 &sd:0:.367599\n&ghost role=ghost step=16n ~ ~ ~ ~ ~ ~ ~ &sd:0:.030008 &sd:0:.0558 ~ ~ ~ ~ ~ ~ ~\n&hat role=hat step=16n &rd:0:.295183 ~ ~ ~ &rd:0:.278319 ~ ~ ~ &rd:0:.230702 ~ ~ ~ &rd:0:.253953 ~ &rd:0:.215822 ~\n&pedal role=pedal step=16n ~ ~ ~ ~ &ph:0:.161262 ~ ~ ~ ~ ~ ~ ~ &ph:0:.201438 ~ ~ ~\n&groove [&kick, &backbeat, &fill, &ghost, &hat, &pedal]\n```\n\nJambot's E31 bar for Swing jazz (yggi/jambot#317): the band's drum part as cells text, without its `&bar` line and its stand-in voices (`&bd s=white` …: the kit fills them, decision 054, rung 2) and its card (its mix is `&groove`, with no `map=midi(10)`: where its notes go is the workbench's and the drummer's, #291), so the host's `&bar`, written first, sets its meter and tempo. At Swing jazz's point.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&sd`, `&ph`, `&rd`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &sd, &ph, &rd from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `swing_jazz_drums(bd=&mine)`.\n","rhythms/09-son-clave-3-2":`---
id: son_clave_3_2
association:
  - point:
      sync: 0.875
      harm: 0.485
      bite: 0.65
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&clave, &percussion from (&claves)
&claves from gm_kit
&clave role=clave step=16n cycle=2 &claves ~!5 &claves ~!5 &claves ~!7 &claves ~!3 &claves ~!7
&percussion [&clave * .5]
\`\`\`

The son clave, 3-2: x..x..x. ..x.x... over two bars of eighths. It is where the bossa nova clave and Funk's Bo Diddley beat come from, and sits halfway between Bossa nova and Funk.

It is not maximally even: no phase of \`even(5, 16)\` is it (its gaps run from 2 to 4 eighths), which is what sets it apart from the bossa nova clave (\`even.test.ts\`).

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is the General MIDI kit's own line by default, the line this fragment used to carry word for word (decision 054, rung 2: #244; a parameter since #637). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&claves\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&claves from gm_kit\`). A piece takes its lines by their names, or renamed (\`&kick2=kick\`), and passes its own drum where it has one: \`son_clave_3_2(claves=&mine)\`.
`,"rhythms/10-son-clave-2-3":`---
id: son_clave_2_3
association:
  - point:
      sync: 0.95
      harm: 0.35
      bite: 0.75
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&clave, &percussion from (&claves)
&claves from gm_kit
&clave role=clave step=16n cycle=2 ~!4 &claves ~!3 &claves ~!7 &claves ~!5 &claves ~!5 &claves ~!3
&percussion [&clave * .5]
\`\`\`

The son clave from its other bar, 2-3: it starts off the downbeat, so it sits a step from 3-2 toward Funk, more off the beat and plainer.

It is not maximally even: no phase of \`even(5, 16)\` is it (its gaps run from 2 to 4 eighths), which is what sets it apart from the bossa nova clave (\`even.test.ts\`).

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is the General MIDI kit's own line by default, the line this fragment used to carry word for word (decision 054, rung 2: #244; a parameter since #637). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&claves\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&claves from gm_kit\`). A piece takes its lines by their names, or renamed (\`&kick2=kick\`), and passes its own drum where it has one: \`son_clave_2_3(claves=&mine)\`.
`,"rhythms/11-rumba-clave-3-2":`---
id: rumba_clave_3_2
association:
  - point:
      sync: 1
      harm: 0.2
      bite: 0.75
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&clave, &percussion from (&claves)
&claves from gm_kit
&clave role=clave step=16n cycle=2 &claves ~!5 &claves ~!7 &claves ~!5 &claves ~!3 &claves ~!7
&percussion [&clave * .5]
\`\`\`

The rumba clave, 3-2: the son's third stroke an eighth later, off the beat; drums and voices over a static harmony, short and dense: near Funk.

It is not maximally even: no phase of \`even(5, 16)\` is it (its gaps run from 2 to 4 eighths), which is what sets it apart from the bossa nova clave (\`even.test.ts\`).

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is the General MIDI kit's own line by default, the line this fragment used to carry word for word (decision 054, rung 2: #244; a parameter since #637). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&claves\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&claves from gm_kit\`). A piece takes its lines by their names, or renamed (\`&kick2=kick\`), and passes its own drum where it has one: \`rumba_clave_3_2(claves=&mine)\`.
`,"rhythms/12-bossa-nova-clave":`---
id: bossa_nova_clave
association:
  - point:
      sync: 0.8
      harm: 0.85
      bite: 0.35
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&clave, &percussion from (&claves)
&claves from gm_kit
&clave role=clave step=16n cycle=2 &claves ~!5 &claves ~!5 &claves ~!7 &claves ~!5 &claves ~!5
&percussion [&clave * .5]
\`\`\`

The bossa nova clave: the son's last stroke an eighth later. Bossa nova's harmony and articulation, a little more off the beat and sparser than its drum bar: five strokes in two bars.

Its five strokes are \`even(5, 16, 2)\`, as even as five go over sixteen (here sixteen eighths over two bars): a maximally even necklace, as the cinquillo is over eight and the son and rumba claves are not (decision 072; \`even.test.ts\`).

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is the General MIDI kit's own line by default, the line this fragment used to carry word for word (decision 054, rung 2: #244; a parameter since #637). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&claves\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&claves from gm_kit\`). A piece takes its lines by their names, or renamed (\`&kick2=kick\`), and passes its own drum where it has one: \`bossa_nova_clave(claves=&mine)\`.
`,"rhythms/13-bossa-nova-clave-one-bar":`---
id: bossa_nova_clave_one_bar
association:
  - point:
      sync: 0.8
      harm: 0.85
      bite: 0.45
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&clave, &percussion from (&claves)
&claves from gm_kit
&clave role=clave step=16n &claves ~!2 &claves ~!2 &claves ~!3 &claves ~!2 &claves ~!2
&percussion [&clave * .5]
\`\`\`

The bossa nova clave in one bar of sixteenths, x..x..x...x..x..: as dense as Bossa nova's drum bar, written in the same sixteenths, so at Bossa nova's energy; off the beat as the two-bar one. Which of the two fits a composition is the fit's to choose (#144), not the association's.

Its five strokes are \`even(5, 16, 2)\`, as even as five go over sixteen: a maximally even necklace, as the cinquillo is over eight and the son and rumba claves are not (decision 072; \`even.test.ts\`).

Five strokes of a clave (\`&claves\`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90). \`&claves\` is the General MIDI kit's own line by default, the line this fragment used to carry word for word (decision 054, rung 2: #244; a parameter since #637). Its other names (\`&clave\`, \`&percussion\`, its mix at that level, with no card: where its notes go is the workbench's, #291) are none of the drum bars', so it layers on any of them in one text.

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&claves\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&claves from gm_kit\`). A piece takes its lines by their names, or renamed (\`&kick2=kick\`), and passes its own drum where it has one: \`bossa_nova_clave_one_bar(claves=&mine)\`.
`,"rhythms/14-cinquillo":"---\nid: cinquillo\nassociation:\n  - point:\n      sync: 0.85\n      harm: 0.6\n      bite: 0.6\n    weight: 1\n    facet: rhythm\nsource: seed\n---\n\n```cells\n&clave, &percussion from (&claves)\n&claves from gm_kit\n&clave role=clave step=16n &claves ~!3 &claves ~ &claves ~!3 &claves ~ &claves ~!3\n&percussion [&clave * .5]\n```\n\nThe cinquillo, x.xx.xx. over one bar of eighths: the Cuban danzón's rhythm, the habanera's and the tresillo's kin, five strokes as even as five go over eight, `even(5, 8, 2)` (2 1 2 1 2; decision 072). The tresillo is its three, `even(3, 8, 2)`, and the bossa nova clave its five over sixteen, `even(5, 16, 2)`: one generator, three timelines (#507).\nIt is written out, as the claves are, and a test states the identity (`rhythms.test.ts`): a rhythm struck from `even` by its phase, each hit a step long, is #531's.\n\nWhere it sits: no preset is Cuban. It is placed by hand beside the son clave, which grew out of the danzón (off the beat, sync 0.85), a little more harmonic (the danzón's ballroom chords, harm 0.6), and denser than a two-bar clave, five strokes in one bar (energy 0.6).\n\nFive strokes of a clave (`&claves`, General MIDI's 75), a sound of its own beside the drum bar's rim, at half the level (velocity 90), as the other claves: `&claves` is a hole the General MIDI kit fills (decision 054, rung 2: #244). Its other names (`&clave`, `&percussion`) are none of the drum bars', so it layers on any of them in one text.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&claves`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&claves from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `cinquillo(claves=&mine)`.\n","rhythms/15-electro-swing-drums":"---\nid: electro_swing_drums\nassociation:\n  - point:\n      sync: 0.55\n      harm: 0.75\n      bite: 0.6\n    weight: 1\n    facet: rhythm\nsource: seed\nlifted: yggi/cells examples/electroswing.md @ 2c120d4\n---\n\n```cells\n&kick, &clap, &hats, &ticks, &groove from (&bd, &sd, &cp, &hh, &oh)\n&bd, &sd, &cp, &hh, &oh from gm_kit\n&kick role=kick step=4n &bd!4\n&clap step=4n ~ &cp:0:.6 ~ &cp:0:.6\n&hats step=8n ~ &oh:0:.4 ~ &oh:0:.4 ~ &oh:0:.4 ~ &oh:0:.4\n&ticks step=16n &hh:0:.2 &hh:0:.2? &hh:0:.2 &hh:0:.2?.7 &hh:0:.2 &hh:0:.2? &hh:0:.2 [&hh:0:.2,&sd:0:.03]\n&groove [&kick, &clap, &hats, &ticks]\n```\n\nThe electro swing beat of [Electro swing, in pieces](../../examples/electroswing.md): house's four on the floor and its clap on two and four, under a jazz record's swung eighths, the open hat on every off-beat and a sixteenth hat with some strokes left to chance (`?`, keyed on the seed: decision 031) and a ghost of the snare on the last.\nIt holds no `&bar`, so the host's meter swings it: under `meter(swing=8n:2/3)` (or the example's lighter `swing=8n:.64`) the open hats fall late, the kick and the clap stay on the beat.\nIts lines strike the kit's names (`&bd` `&cp` `&oh` `&hh` `&sd`), holes the General MIDI kit fills, and carry no card (#291): `&groove` is the mix, its levels in the hits.\nA piece arranging it takes its limbs by name (`&kick, &clap, &hats, &ticks from electro_swing_drums`), as the example does, each under a level of its own.\n\nAt a point proposed for an Electro swing preset (sync .55, harm .75, bite .6, mood .5), weight 1: no preset of Jambot's sits there yet, and the axes are Jambot's (decision 041), so the point is this file's, Jambot's to adopt.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&sd`, `&cp`, `&hh`, `&oh`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &sd, &cp, &hh, &oh from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `electro_swing_drums(bd=&mine)`.\n","rhythms/16-spooky-drums":"---\nid: spooky_drums\nassociation:\n  - point:\n      sync: 0.2\n      harm: 0.9\n      bite: 0.3\n    weight: 1\n    facet: rhythm\nsource: seed\n---\n\n```cells\n&kick, &hat, &euclid, &groove from (&bd, &rim, &rd)\n&bd, &rim, &rd from gm_kit\n&kick role=kick step=16n &bd:0:.55 &bd:0:.3 ~ ~\n&hat role=hat step=4n &rd:0:.12\n&euclid role=euclid step=1m [~ &rim]\n&groove [&kick, &hat, &euclid * .25]\n```\n\nA heartbeat, a clock and a knock: the beat of [Spooky, in pieces](../../examples/spooky.md).\nThe kick is a heartbeat on every beat, its second stroke a sixteenth after the first and softer (lub-dub); the ride ticks each beat, faint, a clock; the rim knocks once, at the middle of the bar, where the heart is between beats in a bar of an odd number of them.\nEvery line fits any meter and lands on its sixteenths: the kick and the ride cycle on a beat (`step=16n` four long, `step=4n` one long), and the rim halves the bar (`step=1m [~ &rim]`), and half of every bar the library's meters make is a whole number of sixteenths (6 in 3/4, 10 in 5/4, 7 in 7/8), so in 5/4 the heart beats five times and the knock falls between the third beat's strokes.\nA Euclid spread over the bar (`step=1m &rim(3,8)`, v0.12.0's) put the knocks between the sixteenths of any bar but 4/4's and 12/8's, where a reader on the bar's sixteenths, as Jambot's drummer is, can't play them; a line on eighths (`step=8n`) lands on them but laps a bar of 4/4, which the fit refuses under the other meters.\nIts lines are named by Jambot's drum roles (`kick`, `hat`, `euclid`) and strike only voices its kit holds (`&bd` 36, `&rd` 51, `&rim` 37), so the drummer plays it as it is; they strike the kit's names, holes the General MIDI kit fills, and carry no card (#291): `&groove` is the mix.\nWritten by hand for the point proposed for a Spooky preset (sync .2, harm .9, bite .3, mood .3; #349), weight 1: no preset of Jambot's sits there yet, and the axes are Jambot's (decision 041), so the point is this file's, Jambot's to adopt.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&rim`, `&rd`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &rim, &rd from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `spooky_drums(bd=&mine)`.\n","rhythms/17-ghost-drums":"---\nid: ghost_drums\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.9\n      bite: 0.3\n    weight: 1\n    facet: rhythm\nsource: seed\n---\n\n```cells\n&kick, &hat, &euclid, &groove from (&bd, &rim, &rd)\n&bd, &rim, &rd from gm_kit\n&kick role=kick step=1m &bd:0:.45\n&hat role=hat step=4n &rd:0:.08\n&euclid role=euclid step=1m [~ &rim]\n&groove [&kick, &hat, &euclid * .2]\n```\n\nAlmost no drums, as a ghost house has: one soft heartbeat at the head of the bar, a clock ticking each beat at the edge of hearing, and a knock at the middle of the bar.\nIt is `spooky_drums` thinned for a quieter, stiller point: the heart beats once a bar, not every beat, so the bar is mostly air.\nEvery line fits any meter and lands on its sixteenths, as `spooky_drums`' do: the kick and the rim on the bar and its half, the ride on the beat.\nIts lines are named by Jambot's drum roles (`kick`, `hat`, `euclid`) and strike only voices its kit holds (`&bd` 36, `&rd` 51, `&rim` 37); they carry no card (#291): `&groove` is the mix.\nNear Spooky's point (sync .2, harm .9, bite .3, mood .3; yggi/jambot#517), 0.1 lower in sync, weight 1, as the facet `rhythm`.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&rim`, `&rd`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &rim, &rd from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `ghost_drums(bd=&mine)`.\n","rhythms/18-kinderlied-drums":"---\nid: kinderlied_drums\nassociation:\n  - point:\n      sync: 0.1\n      harm: 0.12\n      bite: 0.5\n    weight: 0.25\n    facet: rhythm\nsource: seed\n---\n\n```cells\n&kick, &backbeat, &hat, &groove from (&bd, &sd, &hh)\n&bd, &sd, &hh from gm_kit\n&kick role=kick step=2n &bd:0:.5\n&backbeat role=backbeat step=2n [~ &sd:0:.35]\n&hat role=hat step=4n &hh:0:.18\n&groove [&kick, &backbeat, &hat]\n```\n\nThe plainest beat there is, for a children's song: the kick on one and three, the snare on two and four, a closed hat on every beat, nothing off it.\nThe kick and the snare cycle on a half note and the hat on a beat, so in 4/4 it is one bar, and in 3/4 or 5/4 the kick and the snare take turns on the halves of each bar; it fits every meter of the library's.\nIts lines are named by Jambot's drum roles (`kick`, `backbeat`, `hat`) and strike only voices its kit holds (`&bd` 36, `&sd` 38, `&hh` 42), so the drummer plays it as it is; they strike the kit's names, holes the General MIDI kit fills, and carry no card (#291): `&groove` is the mix.\nWritten by hand for the point proposed for a Kinderlied preset (`KINDERLIED`, `styles`: sync .1, harm .12, bite .5, mood .95), where Twinkle's and Hänschen klein's motifs sit; no preset of Jambot's sits there yet, and the axes are Jambot's (decision 041).\nAt weight 0.25, as the dark cadence is weighted down (#404): its distance counts four times, so a query finds it within Jambot's miss distance (0.3) only within 0.075 of its point, where a Kinderlied preset finds it at distance 0.\nIts weight was chosen against cells' lock-in bound when it was absolute, points added (#533 made it relative, and whether the weight goes back to 1 is #544's): both bounds on lock-in over rhythms (`lockin.slow.test.ts`) sat at their edge without it, 4.99 points against 5 and a spread of 2.48 against 2.5, so a rhythm that the walk away from the presets finds and learns crosses one or the other: at weight 1 the share learning adds rose to 5.55 points; at 0.5, 0.4 and 0.3 it was 5.06, 5.02 and 4.98, the last with a spread of 2.52; at 0.25 4.95 and 2.46. Three beats near it (this one, a march and a swaying one) raised it to 5.98, so this one stands alone.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&sd`, `&hh`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &sd, &hh from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `kinderlied_drums(bd=&mine)`.\n","rhythms/19-acid-drums":`---
id: acid_drums
association:
  - point:
      sync: 0.45
      harm: 0.05
      bite: 0.85
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/cells examples/acid.md @ 014c4c73
---

\`\`\`cells
&kick, &clap, &hat, &groove from (&bd, &cp, &hh, &oh)
&bd, &cp, &hh, &oh from gm_kit
&kick role=kick step=4n &bd:0:.8
&clap step=2n [~ &cp:0:.35]
&hat role=hat step=8n [&hh:0:.3 &oh:0:.5]
&groove [&kick, &clap, &hat]
\`\`\`

The beat of [Acid-Cell](../../examples/acid.md): the kick on every beat, the clap on two and four, the closed hat on the beat and the open hat on the and.

At Acid's point (sync .45, harm .05, bite .85, mood .35), weight 1, as the facet \`rhythm\` (#572).

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&bd\`, \`&cp\`, \`&hh\`, \`&oh\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&bd, &cp, &hh, &oh from gm_kit\`). A piece takes its lines by their names, or renamed (\`&kick2=kick\`), and passes its own drum where it has one: \`acid_drums(bd=&mine)\`.
`,"rhythms/20-happy-hardcore-drums":`---
id: happy_hardcore_drums
association:
  - point:
      sync: 0.25
      harm: 0.45
      bite: 0.8
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/cells examples/hypercell.md @ 014c4c73
---

\`\`\`cells
&kick, &clap, &hat, &groove from (&bd, &cp, &hh)
&bd, &cp, &hh from gm_kit
&kick role=kick step=4n &bd:0:.8
&clap step=2n [~ &cp:0:.35]
&hat role=hat step=8n [~ &hh:0:.2]
&groove [&kick, &clap, &hat]
\`\`\`

The beat of [Hypercell](../../examples/hypercell.md): four on the floor, the clap on two and four, the closed hat between the kicks.

At Happy hardcore's point (sync .25, harm .45, bite .8, mood .9), weight 1, as the facet \`rhythm\` (#572).

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&bd\`, \`&cp\`, \`&hh\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&bd, &cp, &hh from gm_kit\`). A piece takes its lines by their names, or renamed (\`&kick2=kick\`), and passes its own drum where it has one: \`happy_hardcore_drums(bd=&mine)\`.
`,"rhythms/21-elektro-drums":`---
id: elektro_drums
association:
  - point:
      sync: 0.15
      harm: 0.5
      bite: 0.85
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/cells examples/zell.md @ 014c4c73
---

\`\`\`cells
&kick, &backbeat, &tick, &groove from (&bd, &sd, &hh)
&bd, &sd, &hh from gm_kit
&kick role=kick step=2n &bd:0:.8
&backbeat role=backbeat step=2n [~ &sd:0:.35]
&tick step=8n &hh:0:.12
&groove [&kick, &backbeat, &tick]
\`\`\`

The beat of [Zelluläre Aktivität](../../examples/zell.md): the kick on one and three, the snare on two and four, a light metallic tick on every eighth.

At Elektro's point (sync .15, harm .5, bite .85, mood .45), weight 1, as the facet \`rhythm\` (#572).

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&bd\`, \`&sd\`, \`&hh\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&bd, &sd, &hh from gm_kit\`). A piece takes its lines by their names, or renamed (\`&kick2=kick\`), and passes its own drum where it has one: \`elektro_drums(bd=&mine)\`.
`,"rhythms/22-industrial-drums":`---
id: industrial_drums
association:
  - point:
      sync: 0.35
      harm: 0.15
      bite: 0.4
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/cells examples/ghosts.md @ a8de625f
---

\`\`\`cells
&kick, &metal, &groove from (&bd, &hh)
&bd, &hh from gm_kit
&kick role=kick step=8n &bd:0:.8 ~ ~ ~ ~ ~ &bd:0:.6 ~
&metal step=16n ~ ~ &hh:0:.15 ~ ~ ~ ~ &hh:0:.12 ~ ~ ~ &hh:0:.15 ~ ~ ~ ~
&groove [&kick, &metal]
\`\`\`

The percussion of [Ghost-Cells](../../examples/ghosts.md), made plain: a heavy kick on one and on the seventh eighth, and metal ticks scattered over the sixteenths. The example draws its last kick and its ticks by chance, and adds glitches; here each is where it falls most.

At Dark ambient's point (sync .35, harm .15, bite .4), weight 1, as the facet \`rhythm\` (#572).

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&bd\`, \`&hh\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&bd, &hh from gm_kit\`). A piece takes its lines by their names, or renamed (\`&kick2=kick\`), and passes its own drum where it has one: \`industrial_drums(bd=&mine)\`.
`,"rhythms/23-ride-shuffle":`---
id: ride_shuffle
association:
  - point:
      sync: 0.65
      harm: 0.55
      bite: 0.45
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/cells examples/jazz.md @ b3c0acea
---

\`\`\`cells
&ride, &kick, &groove from (&bd, &rd)
&bd, &rd from gm_kit
&ride step=8n &rd:0:.9 ~ &rd:0:.6 &rd:0:.5 &rd:0:.9 ~ &rd:0:.6 &rd:0:.5
&kick role=kick step=2n &bd:0:.5
&groove [&ride, &kick]
\`\`\`

The ride of [Swing blues](../../examples/jazz.md): ding, ding-a ding, ding-a, on a swung meter the long and the short of each beat, a light kick under one and three.

At Blues shuffle's point (sync 0.65, harm 0.55, bite 0.45), weight 1, as the facet \`rhythm\` (#542).

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&bd\`, \`&rd\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&bd, &rd from gm_kit\`). A piece takes its lines by their names, or renamed (\`&ride2=ride\`), and passes its own drum where it has one: \`ride_shuffle(bd=&mine)\`.
`,"rhythms/24-shanty-drums":`---
id: shanty_drums
association:
  - point:
      sync: 0.1
      harm: 0.25
      bite: 0.7
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/cells examples/sailor.md @ 014c4c73
---

\`\`\`cells
&kick, &snare, &hat, &groove from (&bd, &sd, &hh)
&bd, &sd, &hh from gm_kit
&kick role=kick step=2n &bd:0:.8
&snare step=2n [~ &sd:0:.5]
&hat role=hat step=8n [~ &hh:0:.3]
&groove [&kick, &snare, &hat]
\`\`\`

The kit of [Drunken Sailor](../../examples/sailor.md): the kick on one and three, the snare on two and four, the hat on every offbeat eighth.

At Sea shanty's point (sync 0.1, harm 0.25, bite 0.7), weight 1, as the facet \`rhythm\` (#542).

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&bd\`, \`&sd\`, \`&hh\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&bd, &sd, &hh from gm_kit\`). A piece takes its lines by their names, or renamed (\`&kick2=kick\`), and passes its own drum where it has one: \`shanty_drums(bd=&mine)\`.
`,"rhythms/25-chip-drums":`---
id: chip_drums
association:
  - point:
      sync: 0.3
      harm: 0.7
      bite: 1
    weight: 1
    facet: rhythm
source: seed
lifted: yggi/cells examples/korobeiniki.md @ a8de625f
---

\`\`\`cells
&kick, &hats, &groove from (&bd, &hh)
&bd, &hh from gm_kit
&kick role=kick step=2n &bd:0:.6
&hats step=8n &hh:0:.5 &hh:0:.15 &hh &hh:0:.15 &hh:0:.5 &hh:0:.15 &hh &hh:0:.15
&groove [&kick, &hats]
\`\`\`

The drums of [Korobeiniki](../../examples/korobeiniki.md): its noise channel's hats, loud on the beat and soft between, with a kick under one and three.

At Chiptune's point (sync 0.3, harm 0.7, bite 1), weight 1, as the facet \`rhythm\` (#542).

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&bd\`, \`&hh\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&bd, &hh from gm_kit\`). A piece takes its lines by their names, or renamed (\`&kick2=kick\`), and passes its own drum where it has one: \`chip_drums(bd=&mine)\`.
`,"rhythms/26-quiet-pulse":`---
id: quiet_pulse
association:
  - point:
      sync: 0.15
      harm: 0.8
      bite: 0.5
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&tick, &groove from (&claves)
&claves from gm_kit
&tick step=4n &claves:0:.2
&groove [&tick]
\`\`\`

A quiet pulse, the claves softly on every beat: what keeps a band together where the music has no drums, a baroque ensemble's beat felt more than heard.

At Baroque's point (sync .15, harm .8, bite .5), weight 1, as the facet \`rhythm\`, so a band at Baroque plays this and no other style's kit (#542).

**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (\`&claves\`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (\`&claves from gm_kit\`). A piece takes its lines by their names, or renamed (\`&tick2=tick\`), and passes its own drum where it has one: \`quiet_pulse(claves=&mine)\`.
`,"rhythms/27-salsa-drums":`---
id: salsa_drums
association:
  - point:
      sync: 0.9
      harm: 0.5
      bite: 0.7
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&clave, &tumbao, &cascara, &groove from (&claves, &ht, &lt, &mt, &rd)
&claves, &ht, &lt, &mt, &rd from gm_kit
&clave step=16n cycle=2 &claves:0:.5 ~!5 &claves:0:.5 ~!5 &claves:0:.5 ~!7 &claves:0:.5 ~!3 &claves:0:.5 ~!7
&tumbao step=8n &mt:0:.3 &mt:0:.2 &ht:0:.5 &mt:0:.2 &mt:0:.3 &mt:0:.2 &lt:0:.6 &lt:0:.5
&cascara step=4n &rd:0:.45
&groove [&clave, &tumbao, &cascara]
\`\`\`

A salsa's percussion on a drum kit's voices: the son clave, 3-2, over two bars (as \`son_clave_3_2\` writes it); the conga's tumbao on the toms (the mid tom's muted strokes, the high tom's slap on two, the low tom's two open tones on four and its off-beat); and the bell's quarters on the ride, as a kit drummer plays the cáscara. It strikes only the 13 voices the drummer takes (#244).
At Salsa's point (sync 0.9, harm 0.5, bite 0.7), weight 1, as the facet \`rhythm\` (#542).
`,"rhythms/28-waltz-drums":`---
id: waltz_drums
association:
  - point:
      sync: 0
      harm: 0.7
      bite: 0.3
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&kick, &chick, &groove from (&bd, &ph)
&bd, &ph from gm_kit
&kick step=4n &bd:0:.5 ~ ~
&chick step=4n ~ &ph:0:.3 &ph:0:.25
&groove [&kick, &chick]
\`\`\`

A waltz's oom-pah-pah: the kick on one, the pedal hat on two and three, a little softer on three.
At Waltz's point (sync 0, harm 0.7, bite 0.3), weight 1, as the facet \`rhythm\` (#542).
`,"rhythms/29-march-drums":`---
id: march_drums
association:
  - point:
      sync: 0
      harm: 0.1
      bite: 0.75
    weight: 1
    facet: rhythm
source: seed
---

\`\`\`cells
&kick, &snare, &groove from (&bd, &sd)
&bd, &sd from gm_kit
&kick step=4n &bd:0:.7 &bd:0:.5
&snare step=16n &sd:0:.7 ~ &sd:0:.3 &sd:0:.3 &sd:0:.6 ~ &sd:0:.3 &sd:0:.3
&groove [&kick, &snare]
\`\`\`

A march's drums in 2/4: the bass drum on both beats, the snare's strokes and its soft doubles between them, the field drum's rudiment.
At March's point (sync 0, harm 0.1, bite 0.75), weight 1, as the facet \`rhythm\` (#542).
`,"rhythms/30-trip-hop-drums":`---
id: trip_hop_drums
association:
  - point:
      sync: 0.7
      harm: 0.2
      bite: 0.2
    weight: 0.5
    facet: rhythm
source: seed
---

\`\`\`cells
&kick, &snare, &hat, &groove from (&bd, &sd, &hh)
&bd, &sd, &hh from gm_kit
&kick step=16n &bd:0:.8 ~ ~ ~ ~ ~ ~ &bd:0:.5 ~ ~ &bd:0:.6 ~ ~ ~ ~ ~
&snare step=2n ~ &sd:0:.7
&hat step=8n &hh:0:.2 &hh:0:.35 &hh:0:.2 &hh:0:.35 &hh:0:.2 &hh:0:.35 &hh:0:.2 &hh:0:.35
&groove [&kick, &snare, &hat]
\`\`\`

A trip-hop beat, slow and heavy: the kick on one, its echoes off the beat after it, a hard snare on three (the half-time backbeat), the hats leaning on their off-beats.
At Trip-hop's point (sync 0.7, harm 0.2, bite 0.2), weight 0.5, as the facet \`rhythm\` (#542): it is first at Trip-hop's point, and reaches half as far, so the walk of \`lockin.ts\` still misses at the corner's far edges, where it files fragments of its own (at weight 1 no section of draws 0–31 misses there, at 0.75 none of draws 0–3, and that path loses its witness).
`,"rhythms/31-aksak-drums":"---\nid: aksak_drums\nassociation:\n  - point:\n      sync: 0.8\n      harm: 0.6\n      bite: 1\n    weight: 0.75\n    facet: rhythm\nsource: seed\n---\n\n```cells\n&kick, &ghost, &backbeat, &hat, &groove from (&bd, &sd, &hh)\n&bd, &sd, &hh from gm_kit\n&kick role=kick step=beat &bd:0:.6 ~ ~\n&ghost role=ghost step=beat ~ &sd:0:.12 ~\n&backbeat role=backbeat step=beat ~ ~ &sd:0:.5\n&hat role=hat step=pulse &hh:0:.3\n&groove [&kick, &ghost, &backbeat, &hat]\n```\n\nA drum bar for an aksak, a bar of three unequal beats, twos and a three: the kick on the first beat, a ghost of the snare on the second, the snare on the third, and the hat on every eighth.\nIt is written in the meter's counts, `step=beat` and `step=pulse`, so it lays itself out in whatever grouping the host's meter has: in 7/8 as the family reads it, `meter(\"7/8\")`, 3 + 2 + 2, the snare falls on the sixth eighth and the kick's beat is the long one; in `meter(\"2+2+3\")`, the grouping of the motif `limp`, the snare falls on the fifth and the long beat is the snare's.\nUnder a meter that swings its eighths (`swing=8n:2/3`), the hats of each two lean and those of the three stay even (decision 071); the beats never move.\nIts lines are named by Jambot's drum roles (`kick`, `ghost`, `backbeat`, `hat`) and strike only voices its kit holds (`&bd` 36, `&sd` 38, `&hh` 42), so the drummer plays it as it is; they strike the kit's names, holes the General MIDI kit fills, and carry no card (#291): `&groove` is the mix.\nIts three-beat lines lap a bar of three beats, so it fits the meters of three beats (7/8, 3/4) and no other.\nWritten by hand for [Aksak: twos and a three](../../examples/aksak.md), at 7/8's point (sync .8, harm .6, bite 1), weight 0.75 as the meter's own point there, as the facet `rhythm` (#646): where the meter fragment answers 7/8 (`meter(grouping=meter(\"7/8\"))`), this is its drum bar.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&sd`, `&hh`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &sd, &hh from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `aksak_drums(bd=&mine)`.\n","rhythms/32-twelve-eight-drums":"---\nid: twelve_eight_drums\nassociation:\n  - point:\n      sync: 0.7\n      harm: 0.6\n      bite: 0\n    weight: 0.25\n    facet: rhythm\nsource: seed\n---\n\n```cells\n&kick, &backbeat, &hat, &groove from (&bd, &sd, &rd)\n&bd, &sd, &rd from gm_kit\n&kick role=kick step=beat &bd:0:.6 ~ &bd:0:.45 ~\n&backbeat role=backbeat step=beat ~ &sd:0:.5 ~ &sd:0:.5\n&hat role=hat step=8n &rd:0:.35 &rd:0:.18 &rd:0:.24\n&groove [&kick, &backbeat, &hat]\n```\n\nA slow blues in 12/8: four beats a bar, each a dotted quarter of three eighths; the kick on one and three, the snare on two and four, and the ride on every eighth, the first of each three the loudest, the second the softest.\nThe kick and the snare tap the beats (`step=beat`); the ride's three eighths make one beat of a compound meter, so it fits 12/8 alone of the library's meters (in 6/8 its four beats are two bars).\nUnder a meter bent on its eighths (`bend=8n:&lean`, decision 080), the ride leans as the bend says, within each beat; the beats never move.\nIts lines are named by Jambot's drum roles (`kick`, `backbeat`, `hat`, the ride its hat as in `swing_jazz_drums`) and strike only voices its kit holds (`&bd` 36, `&sd` 38, `&rd` 51), so the drummer plays it as it is; they strike the kit's names, holes the General MIDI kit fills, and carry no card (#291): `&groove` is the mix.\nWritten by hand for [Twelve-eight: the lean of three](../../examples/twelve.md), at 12/8's point (sync .7, harm .6, bite 0), as the facet `rhythm` (#646): where the meter fragment answers 12/8 (`meter(grouping=meter(\"12/8\"))`), this is its drum bar.\nIt weighs 0.25, as `trip_hop_drums` weighs less than 1 (#542): at 0.5 or more the corner it fills leaves lock-in's walk no section that misses in its witness's draws, and so no witness that it files fragments of its own there; at 0.25 it is still first at its own point.\n\n**Its signature** (decision 075, #637): its lines are its heads, and the drums it strikes (`&bd`, `&sd`, `&rd`) are optional parameters, each the General MIDI kit's own line by default, taken inside it (`&bd, &sd, &rd from gm_kit`). A piece takes its lines by their names, or renamed (`&kick2=kick`), and passes its own drum where it has one: `twelve_eight_drums(bd=&mine)`.\n","stab/01-charleston-stabs":"---\nid: charleston_stabs\nassociation:\n  - point:\n      sync: 0.55\n      harm: 0.75\n      bite: 0.6\n      mood: 0.5\n    weight: 0.4\n    facet: stab\nsource: seed\nlifted: yggi/cells examples/electroswing.md @ 2c120d4\n---\n\n```cells\n&stabline from &harm\n&stabline step=8n cycle=4 &charleston!3 &push\n&charleston over=&harm step=8n [0,1,2] ~ ~ [0,1,2] ~@4\n&push over=&harm step=8n [0,1,2] ~ ~ [0,1,2] ~ [0,1,2] ~ &ahead\n&ahead over=&harm[>>] [1,2,3]\n```\n\nThe stabs of [Electro swing, in pieces](../../examples/electroswing.md): the Charleston, a chord on one and on the and of two, three bars, and a fourth that pushes: its last stab, on the and of four, is the next chord, its third and fifth with its root on top (`&ahead over=&harm[>>]`, as the funk bass anticipates with `&bassNext`).\nIt is the part the stab performer plays (`&stabline`, decision 058), the first of the facet `stab`, as the bass lines are the bass performer's: its chords are indices into the chord in force (`over=&harm`), so its holes are `&harm` and a meter, and its velocities are the performer's (`&stabLevel`).\n`&charleston`, `&push` and `&ahead` are its helpers: `use &stabline from charleston_stabs` takes them.\nIt is the example's line at the commit it was lifted from, but for that last stab, which there read the chord in force (the owner's review of #305).\n\nAt a point proposed for an Electro swing preset (sync .55, harm .75, bite .6, mood .5), weight 0.4, so no other preset finds it within Jambot's miss distance (0.3; at weight 1 it was the first stab of five, #404): no preset of Jambot's sits there yet, and the axes are Jambot's (decision 041), so the point is this file's, Jambot's to adopt.\n\n**Its signature** (decision 065): `&stabline from &harm`. `&stabline from charleston_stabs &harm` takes a copy of it, `&harm` its main argument.\n","stab/02-spooky-stabs":`---
id: spooky_stabs
association:
  - point:
      sync: 0.2
      harm: 0.9
      bite: 0.3
      mood: 0.3
    weight: 0.4
    facet: stab
source: seed
lifted: yggi/cells examples/spooky.md @ a8de625f
---

\`\`\`cells
&stabline from &harm
&stabline over=&harm step=8n ~ [0,1,2] ~ ~ ~ ~ [0,1,2] ~ ~ ~
\`\`\`

The stabs of [Spooky, in pieces](../../examples/spooky.md): a chord on the second eighth of a bar of five beats and another on the seventh, so they fall off the heartbeat and never twice in the same place in the beat.
It is the part the stab performer plays (\`&stabline\`, decision 058): its chords are indices into the chord in force (\`over=&harm\`), so its holes are \`&harm\` and a meter of five beats, and its velocities are the performer's (\`&stabLevel\`).

At Spooky's point (sync .2, harm .9, bite .3, mood .3), weight 0.4, so no other preset finds it within the miss distance (Lo-fi hip hop at weight 1, #572), as the facet \`stab\`: Spooky's own stab, as \`charleston_stabs\` is Electro swing's (#572, its parts by facet).
`,"stab/03-rave-stabs":`---
id: rave_stabs
association:
  - point:
      sync: 0.25
      harm: 0.45
      bite: 0.8
      mood: 0.9
    weight: 0.4
    facet: stab
source: seed
lifted: yggi/cells examples/hypercell.md @ 014c4c73
---

\`\`\`cells
&stabline from &harm
&stabline over=&harm step=8n ~ [0,1,2] ~ [0,1,2] ~ [0,1,2] ~ [0,1,2]
\`\`\`

The rave stabs of [Hypercell](../../examples/hypercell.md): the chord in force on every offbeat eighth, against the four-on-the-floor kick, as 90s happy hardcore and eurodance stab.
It is the part the stab performer plays (\`&stabline\`, decision 058): indices into the chord in force (\`over=&harm\`), its velocities the performer's.

At Happy hardcore's point (sync .25, harm .45, bite .8, mood .9), weight 0.4, so no other preset finds it within the miss distance (Synth-pop, Deep house and Kinderlied at weight 1, #572), as the facet \`stab\` (#572).
`,"styles/01-styles":`---
id: styles
association:
  - point:
      sync: 0.3
      harm: 0.45
      bite: 0.55
      mood: 0.5
    weight: 1
    facet: style
  - point:
      sync: 0.12
      harm: 0
      bite: 1
      mood: 0.4
    weight: 1
    facet: style
  - point:
      sync: 0.35
      harm: 0.55
      bite: 0.65
      mood: 0.65
    weight: 1
    facet: style
  - point:
      sync: 0.05
      harm: 0.3
      bite: 0
      mood: 0.9
    weight: 1
    facet: style
  - point:
      sync: 0.5
      harm: 0.75
      bite: 0.35
      mood: 0.5
    weight: 1
    facet: style
  - point:
      sync: 1
      harm: 0.12
      bite: 0.85
      mood: 0.65
    weight: 1
    facet: style
  - point:
      sync: 0.75
      harm: 0.85
      bite: 0.45
      mood: 0.9
    weight: 1
    facet: style
  - point:
      sync: 0.35
      harm: 1
      bite: 0.3
      mood: 0.85
    weight: 1
    facet: style
  - point:
      sync: 0.55
      harm: 0.75
      bite: 0.6
      mood: 0.5
    weight: 1
    facet: style
  - point:
      sync: 0.2
      harm: 0.9
      bite: 0.3
      mood: 0.3
    weight: 1
    facet: style
  - point:
      sync: 0.1
      harm: 0.12
      bite: 0.5
      mood: 0.95
    weight: 1
    facet: style
  - point:
      sync: 0.45
      harm: 0.05
      bite: 0.85
      mood: 0.35
    weight: 1
    facet: style
  - point:
      sync: 0.25
      harm: 0.45
      bite: 0.8
      mood: 0.9
    weight: 1
    facet: style
  - point:
      sync: 0.15
      harm: 0.5
      bite: 0.85
      mood: 0.45
    weight: 1
    facet: style
  - point:
      sync: 0.35
      harm: 0.15
      bite: 0.4
      mood: 0.1
    weight: 1
    facet: style
  - point:
      sync: 0.15
      harm: 0.8
      bite: 0.5
      mood: 0.85
    weight: 1
    facet: style
  - point:
      sync: 0.65
      harm: 0.55
      bite: 0.45
      mood: 0.65
    weight: 1
    facet: style
  - point:
      sync: 0.1
      harm: 0.25
      bite: 0.7
      mood: 0.65
    weight: 1
    facet: style
  - point:
      sync: 0.3
      harm: 0.7
      bite: 1
      mood: 0.55
    weight: 1
    facet: style
  - point:
      sync: 0.9
      harm: 0.5
      bite: 0.7
      mood: 0.75
    weight: 1
    facet: style
  - point:
      sync: 0
      harm: 0.7
      bite: 0.3
      mood: 0.9
    weight: 1
    facet: style
  - point:
      sync: 0
      harm: 0.1
      bite: 0.75
      mood: 0.7
    weight: 1
    facet: style
  - point:
      sync: 0.7
      harm: 0.2
      bite: 0.2
      mood: 0.25
    weight: 1
    facet: style
source: seed
---

\`\`\`cells
&synthPop map=style label="Synth-pop" step=108bpm sync=.3 harm=.45 bite=.55 mood=.5
&techno map=style label="Techno" step=130bpm sync=.12 harm=0 bite=1 mood=.4
&deepHouse map=style label="Deep house" step=122bpm sync=.35 harm=.55 bite=.65 mood=.65
&ambient map=style label="Ambient" step=72bpm sync=.05 harm=.3 bite=0 mood=.9
&lofi map=style label="Lo-fi hip hop" step=84bpm sync=.5 harm=.75 bite=.35 mood=.5
&funk map=style label="Funk" step=104bpm sync=1 harm=.12 bite=.85 mood=.65
&bossaNova map=style label="Bossa nova" step=132bpm sync=.75 harm=.85 bite=.45 mood=.9
&swingJazz map=style label="Swing jazz" step=148bpm sync=.35 harm=1 bite=.3 mood=.85
&electroSwing map=style label="Electro swing" step=124bpm sync=.55 harm=.75 bite=.6 mood=.5
&spooky map=style label="Spooky" step=100bpm sync=.2 harm=.9 bite=.3 mood=.3
&kinderlied map=style label="Kinderlied" step=96bpm sync=.1 harm=.12 bite=.5 mood=.95
&acid map=style label="Acid" step=126bpm sync=.45 harm=.05 bite=.85 mood=.35
&happyHardcore map=style label="Happy hardcore" step=160bpm sync=.25 harm=.45 bite=.8 mood=.9
&elektro map=style label="Elektro" step=112bpm sync=.15 harm=.5 bite=.85 mood=.45
&darkAmbient map=style label="Dark ambient" step=76bpm sync=.35 harm=.15 bite=.4 mood=.1
&baroque map=style label="Baroque" step=90bpm sync=.15 harm=.8 bite=.5 mood=.85
&bluesShuffle map=style label="Blues shuffle" step=120bpm sync=.65 harm=.55 bite=.45 mood=.65
&seaShanty map=style label="Sea shanty" step=112bpm sync=.1 harm=.25 bite=.7 mood=.65
&chiptune map=style label="Chiptune" step=144bpm sync=.3 harm=.7 bite=1 mood=.55
&salsa map=style label="Salsa" step=180bpm sync=.9 harm=.5 bite=.7 mood=.75
&waltz map=style label="Waltz" step=150bpm sync=0 harm=.7 bite=.3 mood=.9
&march map=style label="March" step=120bpm sync=0 harm=.1 bite=.75 mood=.7
&tripHop map=style label="Trip-hop" step=80bpm sync=.7 harm=.2 bite=.2 mood=.25
\`\`\`

The library of styles (decision 063 §3, #391, #537): the twenty-three preset styles, each a \`map=style\` cell at its point, its axes by name (cells' table of axes, \`AXES\`), its display name its \`label=\` and its default tempo its \`step=\`. They are Jambot's eight from the prototype, then Electro swing and Spooky (#349), then Kinderlied (yggi/jambot#547), whose 96 bpm is Twinkle's, then four read from the examples (#572, #542): Acid, from *Acid-Cell* (its 303, its riff and its beat), Happy hardcore, from *Hypercell*, and Elektro, from *Zelluläre Aktivität*. Their moods are placed by hand: Acid's minor hypnotic and tense (.35), Happy hardcore's euphoric though it turns on A minor (.9: the mood goes beyond the mode), Elektro's cool (.45). Dark ambient, from *Ghost-Cells*, is the bottom of the mood axis (.1): a minor drone made menacing. Then four more cut from the examples (#542): Baroque, from the Bach pieces, Blues shuffle, from *Swing blues*, Sea shanty, from *Drunken Sailor*, and Chiptune, from *Korobeiniki*; and four placed by hand, with parts written for them (#542): Salsa (the clave's off-beats, the tumbao, mixolydian), Waltz (where 3/4 and the \`waltz\` motif already sat), March (2/4, stamping and bright) and Trip-hop (.7 .2 .2 .25, the offbeat, static, paddy and dark corner no style held).

This file is the presets' one source: \`STYLES\` (\`src/repository/styles.ts\`) reads each as \`{ id, name, point, tempo }\`, in this order, and a frontend takes its presets from there. Only the library reads the \`step=\`: \`style=\` and a query read the point, so a style has no tempo (decision 037, D6).

A score names its section's style by one of them where the section sits exactly on it, and by its numbers or a mix of them where it doesn't:

\`\`\`text
&funk from styles
&style label="Funk" style=&funk
\`\`\`

The default band reads the style through \`&style\` (\`band\`: its bass's and its lead's cutoff), and so does its choice of instruments (\`resolveBand\`): Spooky's, named, plays the round bass, the organ, the celesta and the theremin, as its numbers do.

The points were lifted from yggi/jambot \`packages/engine/src/style.ts\` @ 7b078e8, with their tempos @ dcc414d. Associated once at each of them, as the facet \`style\`, at weight 1: the style nearest a point is a query (\`{ facet: 'style' }\`), and a test holds the association to the cells' points.
`};function Wp(){let e=Hp(Up);if(`problems`in e)throw Error(`The seed library doesn't read: ${e.problems.join(`; `)}`);return e.files}let Gp=Wp(),Kp=e=>Ts(e.fragment),qp=e=>Gp.filter(t=>t.path.startsWith(`${e}/`)).flatMap(Kp),Jp=qp(`styles`);function Yp(e){let t=e.braid.kind===`list`?e.braid.tokens.map(e=>e.atom.kind===`note`?e.atom.value:NaN):[];if(e.map?.kind!==`style`||t.length!==ht.length||!t.every(Number.isFinite))throw Error(`styles: &${e.name} is not a style cell with a value on each axis`);if(!e.label)throw Error(`styles: &${e.name} has no label=, its display name`);if(e.step?.kind!==`rate`)throw Error(`styles: &${e.name} has no step= in bpm, its default tempo`);return{id:e.name,name:e.label,point:Object.fromEntries(ht.map((e,n)=>[e,t[n]])),tempo:Math.round(e.step.perSecond*60*1e9)/1e9}}let Xp=Z(Jp.find(e=>e.id===`styles`).text).cells.map(Yp);function Zp(e){let t=Xp.find(t=>t.id===e);if(!t)throw Error(`styles: no style ${e} (there are ${Xp.map(e=>e.id).join(`, `)})`);return t.point}Zp(`synthPop`),Zp(`techno`),Zp(`deepHouse`),Zp(`ambient`),Zp(`lofi`),Zp(`funk`),Zp(`bossaNova`),Zp(`swingJazz`),Zp(`electroSwing`),Zp(`spooky`),Zp(`kinderlied`);let Qp=[`drums`,`bass`,`pad`,`stab`,`lead`],$p=[`kick`,`backbeat`,`fill`,`ghost`,`hat`,`pedal`,`euclid`,`clave`],em=I[`4/4`],tm=oe(em).cycle,nm=e=>2*Math.floor(e/4),rm=e=>2*Math.floor(e*3/8),im=(e,t)=>e.cycle===t.cycle&&e.heights.length===t.heights.length&&e.heights.every((e,n)=>e===t.heights[n]);function am(n){if(n.length===0)throw Error(`clockOf: a song needs a meter`);let r=[];for(let{bar:e,meter:t}of[...n].sort((e,t)=>e.bar-t.bar)){if(t.heights[0]!==0)throw Error(`clockOf: a meter starts on its downbeat`);let n=oe(t),i=r.at(-1),a=i?e-i.bar:e;r.push({bar:e,step:i?i.step+a*i.helix.cycle:a*n.cycle,beat:i?i.beat+a*i.beats:a*n.heights.length,helix:n,beats:n.heights.length})}let i=(e,t)=>r.findLast(n=>e(n)<=t)??r[0],a=e=>{let t=i(e=>e.bar,e);return t.step+(e-t.bar)*t.helix.cycle},o=e=>{let n=i(e=>e.step,e);return n.bar+Math.floor(t(n.helix,e-n.step)/n.beats)},s=e=>{let n=i(e=>e.step,e);return n.beat+t(n.helix,e-n.step)},c=t=>{let n=i(e=>e.beat,t);return n.step+e(n.helix,t-n.beat)};return{barAt:o,barStart:a,barSteps:e=>i(e=>e.bar,e).helix.cycle,stepInBar:e=>e-a(o(e)),beatAt:s,beatStart:c,beatInBar:e=>{let n=i(e=>e.step,e);return u(t(n.helix,e-n.step),n.beats)},onBeat:e=>c(s(e))===e}}let{barAt:om,barStart:sm,stepInBar:cm,beatAt:lm,beatStart:um,beatInBar:dm,onBeat:fm}=am([{bar:0,meter:em}]),pm={min:0,max:1,space:`linear`},mm={sync:`sync`,harm:`harm`,artic:`bite`,mood:`mood`};function hm(e){let t=ft.find(t=>t.name===mm[e]);if(!t)throw Error(`cells' table of axes has no ${mm[e]}`);return{min:t.range[0],max:t.range[1],space:`linear`}}let gm=(()=>{let e=ft.map(e=>e.name),t=[`sync`,`harm`,`artic`,`mood`];if(e.length!==t.length||e.some((e,n)=>e!==mm[t[n]]))throw Error(`cells' table of axes is ${e.join(` `)}; Jambot reads ${t.map(e=>mm[e]).join(` `)} (style.ts)`);return t})();Object.fromEntries(gm.map(e=>{let t=ft.find(t=>t.name===mm[e]);return[e,{label:t.label,ends:t.ends}]}));let _m={sync:hm(`sync`),harm:hm(`harm`),artic:hm(`artic`),energy:pm,entropy:pm,bpm:{min:60,max:180,space:`log`},mood:hm(`mood`)},vm=Object.keys(_m),ym={synthPop:.55,techno:.8,deepHouse:.65,ambient:.2,lofi:.5,funk:.75,bossaNova:.45,swingJazz:.6,electroSwing:.75,spooky:.35,kinderlied:.35},bm=Xp.map(e=>({id:e.id,name:e.name,style:{...Object.fromEntries(gm.map(t=>[t,e.point[mm[t]]])),energy:ym[e.id]??e.point.bite,bpm:e.tempo}}));[`synthPop`,`techno`,`deepHouse`,`ambient`,`lofi`,`funk`,`bossaNova`,`swingJazz`].map(e=>{let t=bm.find(t=>t.id===e);if(!t)throw Error(`cells' library of styles has no ${e}`);return t}),sm(8),sm(1),{...bm[0].style};function xm(e){let t=1e3;return Object.fromEntries(vm.map(n=>[n,Math.round(e[n]*t)/t]))}let Sm=gm,Cm=e=>Object.fromEntries(Sm.map(t=>[mm[t],e[t]]));function wm(e,t,n,r,i=[],a){let{miss:o,hold:s}=e.margins??{miss:.3,hold:.02},c=a===void 0?e.query(Cm(t),r,...i.length?[i]:[]):e.query(Cm(t),r,i,a),l=c[0];if(!l||l.distance>o)return null;let u=n===null?void 0:c.find(e=>e.id===n),d=u&&u.distance<=o&&u.distance-l.distance<=s?u.id:l.id;return e.fragments.get(d)}let Tm=[],Em=e=>Xe(.2*Math.min(1,Math.max(0,1-e))),Dm=[`fill`],Om=e=>Math.floor(e/3),km={},Am=(e,{rhythmFragment:t,claveFragment:n})=>t===void 0||n===void 0||n in e?e:{...e,[n]:t};function jm(e,t=km){let n=e.filter(e=>e.rejected).flatMap(e=>e.grooves);return[...n,...Object.keys(t).filter(e=>n.includes(t[e]))]}function Mm(e,t){let n=t=>{let n=e.filed.find(e=>e.fragment.id===t)?.meta.varies;return typeof n==`string`?n:void 0},r=e=>{let t=/* @__PURE__ */ new Set([e]),r=e;for(let e=n(r);e!==void 0&&!t.has(e);e=n(r))t.add(e),r=e;return r},i=r(t),a=e.filed.map(e=>e.fragment.id).filter(e=>r(e)===i),o=a.includes(i)?a:[i,...a];return o.includes(t)?o:[t]}function Nm(e,t){let n=e.find(e=>e.grooves.some(e=>t.includes(e)));return n?{...n,grooves:[...n.grooves,...t.filter(e=>!n.grooves.includes(e))]}:{grooves:[...t],boredom:0,rejected:!1}}function Pm({grooves:e,boredom:t}){let n=Om(t);return n>=1&&n<2&&e.length-1<n}function Fm(e,t,n){let r=Xe(n),i=e=>t.some(t=>e.grooves.some(e=>t.grooves.includes(e)));return[...e.filter(e=>!i(e)).map(e=>({...e,boredom:e.boredom-r})).filter(e=>e.boredom>0),...t.map(({grooves:e,boredom:t})=>{let n=t+r;return{grooves:e,boredom:n,rejected:Om(n)>=2}})]}let Im={miss:.3,hold:.02},Lm=e=>e.margins??Im;function Rm(e,t,n,r,i=0){let a=e[0],o=t===void 0?void 0:e.find(e=>e.id===t);return o&&o.distance<=n+i&&o.distance-a.distance<=r?o.id:a&&a.distance<=n?a.id:void 0}function zm(e,t,n,r,i,a,o=[],s=[],c){let{miss:l,hold:u}=Lm(e);return Rm(e.query(t,n,a,o,l,c).filter(e=>e.distance<=l&&!s.includes(e.id)).filter(t=>i(e.read(t.id,n.meter,a),t.id)),r,l,u)}let Bm=(e,t,n)=>e.filed.filter(e=>e.fragment.association.some(e=>e.facet===t)).findIndex(e=>e.fragment.id===n);function Vm(e,t,n,r,i,a,o,s){if(!e||o===void 0)return{id:o,layer:i,playing:null};let c=i.filed.some(e=>e.fragment.id===o);if(!c&&!e.file)return{id:o,layer:i,playing:null};let l=Nm(a,Mm(i,o)),u=Pm(l)&&e.file&&e.vary?e.read(o,s.meter,i):null;if(!u||u.bars!==1)return{id:o,layer:i,playing:l};let d=c?Bm(i,t,o):-1,f=d===-1?Ge(o):d,p=e.vary(o,s,R(r.seed,n,f),i);if(!p)return{id:o,layer:i,playing:l};let{by:m,...h}=p,g=e.file(i,{...h,bench:s,point:r.point,source:`composer`,created:`song ${r.seed}, bar ${r.index*8}`,tags:r.tags,varies:o,by:m}),_=l.grooves.includes(g.id)?l.grooves:[...l.grooves,g.id];return{id:g.id,layer:g.layer,playing:{...l,grooves:_}}}function Hm(e,t,n,r,i,a){if(!e?.file)return{layer:a,ids:[]};let o=a,s=[];for(let{source:a,bars:c}of t){let t=n(c);if(!t)continue;let l=e.file(o,{...t,bench:r,point:i.point,source:a,created:`song ${i.seed}, bar ${i.index*8}`,tags:i.tags});o=l.layer,s.includes(l.id)||s.push(l.id)}return{layer:o,ids:s}}function Um(e,t,n,r,i){let a=n.filter(e=>e!==void 0);return a.length&&e?.used?e.used(t,a,r,i===void 0?[]:[i]):t}let Wm=e=>Math.max(0,Math.min(1,e)),Gm=e=>.5+e/6,Km=e=>(e-.5)*6,qm=[`8n`,`16n`],Jm={level:`16n`,share:.5};Gm(1.5);function Ym({level:e,share:t}){let n=Km(t);return e===`8n`?{sixteenth:0,eighth:n}:{sixteenth:n,eighth:0}}let Xm=e=>Wm(Ym(e).eighth),Zm=e=>Wm(Km(e.share)*(e.level===`8n`?1:.5));function Qm({level:e,share:t}){return{level:e,share:{from:t,to:t,start:0,length:0,slope:0,brake:0}}}let $m=`bass`;function eh(e,t,n){let r=oe(t).heights;for(let t=0;t<e.bars;t++)if([...new Set(e.notes.filter(e=>e.step>=t*n&&e.step<(t+1)*n).map(e=>e.step-t*n))].sort((e,t)=>e-t).join()!==r.join())return!1;return!0}function th(e,t,n,r,i,a,o,s=[],c=[],l){let u=Xm(r)>0;return zm(e,Cm(t),n,a,e=>e!==null&&(u||!eh(e,n.meter,i)),o,s,c,l)}function nh(e,t,n,r,i,a){let o=t===void 0?null:e.read(t,n,a);if(!o)return[];let s=r%o.bars;return o.notes.filter(e=>Math.floor(e.step/i)===s).map(e=>({...e,step:e.step-s*i}))}function rh(t,n,r,i){let a=it(n,t.step),o=[...n.filter(e=>e.slot.step>a.slot.step),...r],s=C((t.chord===0?a:o[t.chord-1]??o.at(-1)??a).chord),c=Math.floor(t.index/s.length),l=s[t.index-c*s.length]+12*c;if(t.alter===0)return l+t.shift;let u=ze(i),d=Te(u,l);return(d?e(u,d.degree+t.alter)+d.accidental*1:l+t.alter)+t.shift}function ih(e,t,n=`cycle`,r=0){let i=t.heights.length,a=c(t),o=Array.from({length:L(t)},()=>0),s=(n,r)=>{let i=Math.floor(n%4/2),s=t.heights[r]*2+i%a[r]*2+n%2;o[s]=Math.max(o[s],e[n])};for(let t=0;t<e.length;t++){if(e[t]===0)continue;let a=Math.floor(t/4);if(n===`fold`)s(t,a%i);else for(let e=0;e<i;e++)a===(e===0?0:(r*i+e)%4)&&s(t,e)}return o}let ah=[33,57],oh=[33,52],sh=[1,0,0,.7,0,0,.8,.4,0,0,.7,.5,0,.3,.8,0],ch=[`root`,`pump`,`eight`,`funk`,`walk`];function lh(e,t=0){let n=L(e),r=oe(e).heights,i=le(e),a=e=>r.length>=4&&e%2==0&&i[e/2]===`half`,o=e=>Array.from({length:n},(t,n)=>e(n)),s=new Set(r.map(e=>e+2)),c=new Set(r);return{root:o(e=>e===0?1:a(e)?.6:0),pump:o(e=>+!!s.has(e)),eight:o(e=>e%2==0?e===0?1:a(e)?.9:.8:0),funk:ih(sh,e,`cycle`,t),walk:o(e=>+!!c.has(e))}}let uh=[`bassHit`,`bassVariation`],dh={hit:0,anticipate:1},fh={approach:0,walkTone:1,ornament:2},ph=e=>Math.max(0,Math.min(1,e));function mh(e,t,n){let r=Xm(t),i=r*ph(e.harm*1.5),a=e.sync*(1-i);return{root:.35,pump:(1-e.harm)*e.artic*(1-r)*(1-e.sync),eight:n*.6*(1-i)*(1-a),funk:a,walk:i}}let hh=e=>e.helix.heights[0],gh=e=>e.helix.heights.map(t=>t-hh(e));function _h(e,t){let n=40,r=1/0;for(let a=oh[0];a<=oh[1];a++)i(a,12)===i(e,12)&&Math.abs(a-t)<r&&(r=Math.abs(a-t),n=a);return n}function vh(e,t,n=[]){let{seed:r,bar:a,plan:o,style:s,barEnergy:c,next:l,meter:u}=e,d=o.section.index,f=[],p=L(u),m=oe(u).heights,h=e=>m.includes(e),g=rt(e.chords,u),_=e=>g.some(t=>t.slot.step===e),v=e=>g.find(t=>t.slot.step>e)??l[0]??it(g,e);if(o.section.type===`breakdown`)return g.forEach((e,n)=>{let r=g[n+1]?.slot.step??p;t=_h(hh(e.chord),t),f.push({part:`bass`,step:e.slot.step,note:t,length:r-e.slot.step})}),{carried:t,output:f};let y=mh(s,e.swing,c),b=Object.values(y).reduce((e,t)=>e+t,0),x=.55+.6*c,S=(t,n)=>Je(r,uh,t,d,a,n,s.entropy,e.restless),C=lh(u,a),w=[],T=[],E=/* @__PURE__ */ new Set;for(let e=0;e<p;e++){let t=0;for(let n of ch)t+=y[n]*C[n][e];t/=b,T.push(t);let n=_(e)&&y.pump<.45||y.walk>.5&&h(e);n&&E.add(e),(n||z(S(dh.hit,e),t*x))&&w.push(e)}w.length===0&&w.push(0);let D=yh(w,n,E,T);return D.forEach(({step:e,from:n},c)=>{let u=it(g,e).chord,b=D[c+1]?.step??p,x=y.walk>.5&&h(e),C=hh(u),w=!1;if(n){if(C=rh(n,g,l,o.key),!x&&!_(e)){let t=R(r,`bassNote`,fh.ornament,d,e);w=t>=.55&&t<.8}}else if(x){let t=m.find(t=>t>e)??p,n=t>=p,i=n||_(t),o=n?l[0]?.chord??u:it(g,t).chord;if(_(e))C=hh(u);else if(i)C=hh(o)+(z(R(r,`bassNote`,fh.approach,a,e),.5)?-1:1);else{let[,t,n,i]=gh(u),o=[t,n,i??n];C=hh(u)+o[Math.floor(R(r,`bassNote`,fh.walkTone,a,e)*3)]}}else if(!_(e)){let t=v(e).chord;if(e>=p-3&&i(hh(t)-hh(u),12)!==0&&z(S(dh.anticipate,e),s.sync*.9))C=hh(t);else{let t=R(r,`bassNote`,fh.ornament,d,e);t>=.55&&t<.8?w=!0:t>=.8&&(C=hh(u)+gh(u)[2])}}t=_h(C,t),f.push({part:`bass`,step:e,note:w&&t+12<=ah[1]?t+12:t,length:b-e})}),{carried:t,output:f}}function yh(e,t,n,r){if(!t.length)return e.map(e=>({step:e,from:null}));let i=[...t].sort((e,t)=>e.step-t.step),a=i.filter((e,t)=>i.findIndex(t=>t.step===e.step)===t).slice(0,e.length).map(e=>({step:e.step,from:e})),o=new Set(a.map(e=>e.step)),s=e.filter(e=>!o.has(e)).sort((e,t)=>Number(n.has(t))-Number(n.has(e))||r[t]-r[e]||e-t).slice(0,e.length-a.length).map(e=>({step:e,from:null}));return[...a,...s].sort((e,t)=>e.step-t.step)}let bh={initial:40,advance:(e,t)=>vh(e,t)},xh=[50,79],Sh=[50,63],Ch=[0,0,.9,0,0,0,.9,.3,0,0,.9,0,.3,0,.9,.3],wh=[`compHit`,`compVariation`],Th={pad:0,stab:1},Eh=(e,t,n)=>e+(t-e)*n;function Dh(e,t){let n=(e,t)=>Math.min(...t.map(t=>Math.abs(e-t)));return t.reduce((t,r)=>t+n(r,e),0)+.5*e.reduce((e,r)=>e+n(r,t),0)}function Oh(e,t){let n=C(e),r=(n.length>=5?n.filter((e,t)=>t!==2):n).map(e=>i(e,12)),a=e=>e.reduce((e,t)=>e+t,0)/e.length,o=null,s=1/0;for(let e=0;e<r.length;e++){let n=[...r.slice(e),...r.slice(0,e)];for(let e=Sh[0];e<=Sh[1];e++){if(i(e,12)!==n[0])continue;let r=[e];for(let e of n.slice(1)){let t=r.at(-1)+1;for(;i(t,12)!==e;)t++;r.push(t)}if(r.at(-1)>xh[1])continue;let c=t?Dh(t,r):Math.abs(a(r)-62);c<s&&(s=c,o=r)}}return o??r.map(e=>60+e)}let kh=(e,t)=>C(e).join()===C(t).join(),Ah={initial:null,advance(e,t){let{seed:n,bar:r,plan:i,style:a,barEnergy:o,next:s,meter:c}=e,l=Xm(e.swing),u=L(c),d=oe(c).heights,f=le(c),p=rt(e.chords,c),m=Array.from({length:u},(e,t)=>t===0?1:d.includes(t)?f[t/2]===`half`&&d.length>=4?.9:.5:0),h=ih(Ch,c,`cycle`,r),g=i.section.type===`breakdown`||o<.3,_=g?Math.max(.85,1-a.artic):1-a.artic,v=g?0:(.35+.65*o)*(1-.45*l)*a.artic*1.4,y=(t,o)=>Je(n,wh,t,i.section.index,r,o,a.entropy,e.restless),b=t,x=p.map(e=>b=Oh(e.chord,b)),S=[],C=/* @__PURE__ */ new Set;p.forEach((e,t)=>{let n=e.slot.step;if(!z(y(Th.pad,n),_*1.15))return;C.add(n);let r=p[t+1]?.slot.step??u;for(let e of x[t])S.push({part:`pad`,step:n,note:e,length:r-n})});for(let e=0;e<u;e++){if(C.has(e))continue;let t=Eh(m[e],h[e],a.sync)*v;if(!z(y(Th.stab,e),t))continue;let n=p.indexOf(it(p,e)),r=x[n],i=s[0];e>=u-2&&a.sync>.5&&i&&!kh(i.chord,p[n].chord)&&(r=Oh(i.chord,b));for(let t of r)S.push({part:`stab`,step:e,note:t,length:1})}return{carried:b,output:S}}},jh=[60,86];function Mh(e,t,n,r,i,a=e.map(()=>0),o,s=!1){let c=e[0]>0;return{cycle:i,onsets:c?[0,...e]:[...e],degrees:c?[null,...t]:[...t],accidentals:[...c?[0]:[],...a],sync:n,energy:r,...o===void 0?{}:{fragment:o},...s?{keyed:s}:{}}}function Nh(e){let t=e.degrees.flatMap((e,t)=>e===null?[]:[t]);return{steps:t.map(t=>e.onsets[t]),degrees:t.map(t=>e.degrees[t]),accidentals:t.map(t=>e.accidentals[t]??0)}}function Ph(e,t,n){let{cycle:r,onsets:i,degrees:a,accidentals:o,accents:s}=e,c=n*t%r,l=[];for(let e=0;e*r<c+t;e++)i.forEach((n,i)=>{let a=e*r+n-c;a>=0&&a<t&&l.push({at:a,i})});let u=l.length>0&&l[0].at>0;return{cycle:t,onsets:[...u?[0]:[],...l.map(e=>e.at)],degrees:[...u?[null]:[],...l.map(e=>a[e.i])],accidentals:[...u?[0]:[],...l.map(e=>o[e.i])],...s?{accents:[...u?[0]:[],...l.map(e=>s[e.i])]}:{}}}let Fh=[.5,.2,.4,.8,.2,.4,.8,.5,.3,.2,.8,.6,.2,.4,.9,.4];function Ih(e){let t=new Set(oe(e).heights),n=le(e);return Array.from({length:L(e)},(e,r)=>r%2==0?r===0?1:t.has(r)?n[r/2]===`half`&&t.size>=4?.9:.8:.4:t.has(r-1)?.1:.15)}let Lh=[e=>Math.sin(Math.PI*e),e=>-e,e=>e,e=>Math.sin(2*Math.PI*e)*.6],Rh=(e,t,n)=>e+(t-e)*n;function zh(e,t){return e<.25?oe(t).heights:e<.6?[0,nm(L(t))]:[0]}function Bh({style:e,swing:t,barEnergy:n,chords:r,plan:i,meter:a}){let s=L(a),c=new Set(oe(a).heights),l=rt(r,a);return{density:.25+.5*n,grooveMix:e.sync,pickups:Array.from({length:s},(e,n)=>n%2==0&&!c.has(n)?.3*Zm(t):0),pulse:o(d(Math.round(3+5*n),s,Math.round(e.sync*3))),scale:Ve(i.key,i.melodic),span:2+Math.round((n+e.entropy)*3),contours:[1+(1-e.harm)*(1-e.entropy),1,1,.25+1.5*e.harm],turn:.2+.3*e.entropy,leap:e.entropy>.5?e.entropy-.5:0,variations:[.3,.25,.25,.2],nudge:e.entropy*.5,snap:Array.from({length:s},(e,t)=>t).filter(t=>zh(e.harm,a).includes(t)||l.some(e=>e.slot.step===t)),range:jh}}function Vh(e){let{seed:t,plan:n,style:r,barEnergy:i,barInSection:a,meter:o,bar:s}=e,{density:c,grooveMix:l,pickups:u,pulse:d,span:f,contours:p,turn:m,leap:h}=Bh(e),g=L(o),_=Ih(o),v=ih(Fh,o,`cycle`,s),y=n.section.index,b=a>>2,x=0,S=()=>R(t,`leadShape`,y,b,x++),C=new Set(d),w=[];for(let e=0;e<g;e++){let n=Math.min(1,Rh(_[e],v[e],l)*c+u[e]),r=Rh(n,C.has(e)?.9:0,.5);z(R(t,`leadRhythm`,y,b,e),r)&&w.push(e)}for(let e of[0,nm(g),...oe(o).heights,2,4,6]){if(w.length>=3)break;!w.includes(e)&&e<g&&w.push(e)}w.sort((e,t)=>e-t);let T=Lh[Ze(S(),p)],E=[0],D=0;for(let e=1;e<w.length;e++){let t=Math.round(Xe(T(e/Math.max(1,w.length-1))*f)),n=E[e-1],r=Math.sign(t-n)*(Math.abs(t-n)>2?2:1);Math.abs(D)>=3?r=-Math.sign(D):z(S(),m)&&(r+=z(S(),.5)?-1:1),h>0&&z(S(),h)&&(r+=z(S(),.5)?-3:3),E.push(n+r),D=r}return Mh(w,E,r.sync,i,g)}function Hh(e,t){let{seed:n,bar:r}=t,{variations:i,nudge:a}=Bh(t),o=0,s=()=>R(n,`leadVariation`,r,o++),c=Nh(e),{degrees:l,accidentals:u}=c,d=c.steps,f=Ze(s(),i);if(f===0)l=l.map(e=>-e),u=u.map(e=>e===0?0:-e);else if(f===1)l=l.map(e=>e+2);else if(f===2){let e=l.length-1;e>0&&(l[e]=l[e-1]+(z(s(),.5)?-1:1)*(1+Ze(s(),[1,1])),u[e]=0)}else d.length>2&&(d.pop(),l.pop(),u.pop());if(z(s(),a)&&d.length>1){let e=1+Ze(s(),d.slice(1).map(()=>1));l[e]+=z(s(),.5)?-1:1}return Mh(d,l,e.sync,e.energy,e.cycle,u,e.fragment,e.keyed)}let Uh=(e,t)=>Wh(C(e).map(e=>i(e,12)),t);function Wh(e,t){for(let n=0;n<=6;n++)for(let r of[t-n,t+n])if(e.includes(i(r,12)))return r;return t}function Gh(e,[t,n],r=!1,i=[]){let a=r=>[...e,...i].filter(e=>e+r>=t&&e+r<=n).length,o=0;for(let e=-4;e<=4&&!r;e++){let t=12*e,n=a(t)-a(o);(n>0||n===0&&Math.abs(t)<Math.abs(o))&&(o=t)}return{notes:e.map(e=>{let r=e+o;for(;r>n;)r-=12;for(;r<t;)r+=12;return r}),octaves:o/12}}function Kh(e,t){return t<.4||e===`breakdown`||e===`intro`}function qh(e,t,n,r){if(r!==1&&r!==3)return e;let a=C(it(n,t).chord),o=r===3?[a[0]]:[a[1],a[2]];return[...e.slice(0,-1),Wh(o.map(e=>i(e,12)),e.at(-1))]}function Jh(e,t,n){return e.map(({step:e,note:r})=>n.includes(e)?Uh(it(t,e).chord,r):r)}function Yh(e,t,n,i,a,o=[],s=!1){let{plan:c,barInSection:l,meter:u,bar:d}=t,f=rt(t.chords,u),p=L(u),m=Bh(t),{onsets:h,degrees:g,accidentals:_,accents:v}=Ph(e,p,d),y=i?m.scale:ze(c.key),b=h.flatMap((e,t)=>g[t]===null?[]:[{step:e,i:t}]);if(b.length===0)return{written:[],last:n,anchor:a??null};let x=a??(s?Xh(y,g[b[0].i],_[b[0].i],n):r(y,Uh(it(f,b[0].step).chord,n))),S=b.map(({step:e,i:t})=>({step:e,note:we(y,x+g[t],_[t])})),C=i?Jh(S,f,m.snap):S.map(e=>e.note),w=o.flatMap(e=>e.degrees.flatMap((t,n)=>t===null?[]:[we(y,x+t,e.accidentals[n]??0)])),T=Gh(qh(C,b.at(-1).step,f,l%4),m.range,a!==void 0,w);return C=T.notes,{written:b.map(({step:e,i:t},n)=>({part:`lead`,step:e,note:C[n],length:(h[t+1]??p)-e,...i?{}:{accent:v?.[t]??0}})),last:C.at(-1),anchor:x+T.octaves*y.heights.length}}function Xh(e,t,n,i){let a=e.heights.length,o=r=>we(e,r*a+t,n),s=Math.floor((r(e,i)-t)/a);return[s-1,s,s+1].reduce((e,t)=>Math.abs(o(t)-i)<Math.abs(o(e)-i)?t:e)*a}function Zh(e,t,n=null,r,i=!1){let{plan:a,style:o,barEnergy:s,barInSection:c,offer:l}=e;if(l){let{written:n,last:r}=Yh(l.motif,e,t.last,!1);return{carried:{...t,last:r,phrase:null,form:null,anchor:null,formAt:null,offered:l.bar},output:n}}let{section:u,theme:d}=a;if(Kh(u.type,s))return{carried:{...t,phrase:null,form:null,anchor:null,formAt:null,offered:null},output:[]};let f=n===null?[]:`cycle`in n?[n]:n,p=c%4,m=(t.form?.length??0)>4,h=m&&c>0&&t.formAt!=null&&t.formAt+1<t.form.length,{phrase:g,melodies:_}=t,v=t.form??null,y,b=!h&&(p===0||!g||m);if(b){let t=_[d.kind],n=t&&t.theme===d.index&&Math.abs(t.shape.sync-o.sync)<.25&&Math.abs(t.shape.energy-s)<.3;if(v=null,f.length){let e=f.map(e=>{let{steps:t,degrees:n,accidentals:a}=Nh({...e,sync:0,energy:0});return Mh(t,n,o.sync,s,e.cycle,a,r,i)});y=e[0],e.length>1&&(v=e)}else n?y=t.shape:(y=Vh(e),_={..._,[d.kind]:{theme:d.index,shape:y}});g=y}else y=g;let x=v?v.length>4?b?0:t.formAt+1:p%v.length:0;v?(y=v[x],!b&&p>=v.length&&x===v.length-1&&(y=Hh(y,e))):!b&&p%2==1&&(y=Hh(g,e));let S=v&&x>0?t.anchor??void 0:void 0,C=Yh(y,e,t.last,y.fragment===void 0,S,v&&x===0?v.slice(1):[],y.keyed===!0);return{carried:{last:C.last,phrase:g,melodies:_,offered:null,form:v,anchor:v?x===0?C.anchor:t.anchor??C.anchor:null,formAt:v&&v.length>4?x:null},output:C.written}}function Qh(e){if(e.offer||Kh(e.plan.section.type,e.barEnergy))return[];let t=Vh(e);return Yh(e.barInSection%4%2==0?t:Hh(t,e),e,69,!0).written}let $h={initial:{last:69,phrase:null,melodies:{},offered:null,form:null,anchor:null,formAt:null},advance:(e,t)=>Zh(e,t)},eg={cents:.5,db:.1,seconds:25e-5,silent:1e-5},tg=2**(eg.cents/1200)-1,ng=(e,t)=>e===t||Math.abs(e-t)<=eg.seconds+tg*Math.max(Math.abs(e),Math.abs(t));function rg(e,t){if(typeof e==`number`&&typeof t==`number`)return ng(e,t);if(e===null||t===null||typeof e!=`object`||typeof t!=`object`)return e===t;if(Array.isArray(e)!==Array.isArray(t))return!1;let n=Object.keys(e).filter(t=>e[t]!==void 0),r=Object.keys(t).filter(e=>t[e]!==void 0);return n.length===r.length&&n.every(n=>rg(e[n],t[n]))}let ig=(e,t)=>e===t||e>0&&t>0&&Math.abs(1200*Math.log2(e/t))<=eg.cents,ag=(e,t)=>Math.abs(e)<eg.silent?Math.abs(t)<eg.silent:Math.abs(t)>=eg.silent&&Math.sign(e)===Math.sign(t)&&Math.abs(20*Math.log10(e/t))<=eg.db,og=/* @__PURE__ */ new Set([`white`,`pink`,`brown`]),sg=(e,t)=>typeof t==`number`&&Number.isFinite(t)?+t.toPrecision(9):t,cg=/* @__PURE__ */ new Set([`gain`,`pan`,`legato`]);function lg(e){let t=gi(e),n=/* @__PURE__ */ new Map,r=(i,a)=>{if(n.has(i))return n.get(i);let o=e.cells.get(i);if(!o||a.has(i))return o?`(loop)`:i;let s=/* @__PURE__ */ new Set([...a,i]),c=e=>e?r(e,s):null,l=og.has(String(o.params.s)),u=Object.entries(o.params).filter(([e])=>!cg.has(e)).sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>[e,typeof t==`string`&&Kr.has(e)?c(t):t]),d=Object.entries(o.paramCells).sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>[e,t.range,t.factors.map(e=>c(e))]),f=l?[]:kd(e,i,t).map(e=>[e.step,e.duration,e.value+e.alter+(e.transpose??0)]),p=[o.map?.kind===`table`?c(o.map.table):o.map,l?null:o.freq,l?null:o.loops,l?null:o.steps,l?null:o.glide,o.oneshot,o.kit,c(o.env),o.exciters??null,u,d,f];return a.size||n.set(i,p),p};return e=>r(e,/* @__PURE__ */ new Set)}function ug(e,t,n,r,i={}){try{let a=Hf(e,void 0,i),o=Hf(t,void 0,i);if(!a.ok||!o.ok)return!1;let s=typeof n==`number`?n:n(a,o),c=e=>{let t=Sf(mf(e,gi(e),e.off),0,s,!0),n=cl(e,rl(e));return{r:e,events:t,sent:t.map(e=>sl(e.midi?n(e):null).map(t=>{let n=ll(e,t);return n?`${t?.port??1}:${n.channel}:${n.note}`:`-`}).join(`,`)),sound:lg(e)}},l=c(a),u=c(o),d=[],f=/* @__PURE__ */ new Map,p=(e,t)=>n=>{let r=`${t}${n}`,i=f.get(r);if(i===void 0){let t=e.sound(n);i=d.findIndex(e=>rg(e,t)),i<0&&(i=d.push(t)-1),f.set(r,i)}return i},m=(e,t)=>{let n=p(e,t);return e.events.map((t,i)=>{let a=`${`${n(t.voice)} ${e.sent[i]}`} ${t.at.toFixed(5)} ${t.dur.toFixed(5)} ${t.freq.toFixed(3)}`;return r===`note`?a:`${a} ${t.gains.map(e=>e.toFixed(5)).join(`,`)} ${JSON.stringify([t.bends,t.levels,t.params??null,t.env??null],sg)}`}).sort().join(`
`)};if(m(l,`a`)===m(u,`b`))return!0;let h=e=>e.at<s-eg.seconds;return pg(dg(l,p(l,`a`),r).filter(h),dg(u,p(u,`b`),r).filter(h),r)}catch{return!1}}function dg(e,t,n){let r=[],i=e.events.map((t,n)=>({e:t,sent:e.sent[n]})).sort((e,t)=>e.e.at-t.e.at);for(let{e:a,sent:o}of i){let i=og.has(String(e.r.cells.get(a.voice)?.params.s)),s={voice:t(a.voice),at:a.at,dur:a.dur,freq:i?null:a.freq,gains:n===`note`?[0,0]:a.gains,rest:n===`note`?null:[i?[]:a.bends,a.levels,a.params??null,a.env??null],sent:o},c=r.length-1;for(;c>=0&&s.at-r[c].at<=eg.seconds&&!fg(r[c],s);)c--;if(c>=0&&s.at-r[c].at<=eg.seconds){let e=r[c].gains;r[c]={...r[c],gains:[e[0]+s.gains[0],e[1]+s.gains[1]]}}else r.push(s)}return n===`note`?r:r.filter(e=>e.sent!==``||e.gains.some(e=>Math.abs(e)>=eg.silent))}let fg=(e,t)=>e.voice===t.voice&&e.sent===t.sent&&Math.abs(e.at-t.at)<=eg.seconds&&Math.abs(e.at+e.dur-(t.at+t.dur))<=eg.seconds&&(e.freq===null?t.freq===null:t.freq!==null&&ig(e.freq,t.freq))&&rg(e.rest,t.rest);function pg(e,t,n){if(e.length!==t.length)return!1;let r=new Uint8Array(t.length),i=0;for(let a of e){for(;i<t.length&&t[i].at<a.at-eg.seconds;){if(!r[i])return!1;i++}let e=-1;for(let o=i;o<t.length&&t[o].at<=a.at+eg.seconds;o++)if(!r[o]&&fg(a,t[o])&&(n===`note`||ag(a.gains[0],t[o].gains[0])&&ag(a.gains[1],t[o].gains[1]))){e=o;break}if(e<0)return!1;r[e]=1}return!0}function mg(e,t){let n=e=>Pf(e).ends??60;return Math.min(1200,Math.max(n(e),n(t)))}function hg(e,t,n,r){return ug(e,t,n??mg,`whole`,r)}function gg(e,t,n=20,r={}){let i=e,a=[];for(let e=0;e<n;e++){let e=Hf(i,void 0,r);if(!e.ok)break;let n=null;for(let a of t(i,e)){let e;try{e=a.apply(i)}catch{continue}if(e!==i&&(a.exact||hg(i,e,void 0,r))){n={next:e,title:a.title};break}}if(!n)break;a.push(n.title),i=n.next}return{source:i,steps:a}}function _g(e,t,n=()=>!0){let r=[];for(let i of t.cells.values()){if(i.implicit||i.lambda)continue;let t=Jt(e,i.name);for(let[e,a]of t){let o=Wr[e];o&&!t.has(o)&&n(e,o)&&r.push({id:`alias:${i.name}:${e}`,tool:`normalise`,rule:`alias`,title:`&${i.name}: ${e}= is Strudel's or dough's name for ${o}= — write ours`,before:`${e}=${a}`,after:`${o}=${a}`,apply:t=>Ht(t,i.name,e,o)})}}return r}function vg(e,t){let n=[];for(let r of t.cells.values()){if(r.implicit||r.lambda)continue;let t=Jt(e,r.name).get(`ftype`),i=t!==void 0&&/^\d+$/.test(t)?ni[Number(t)]:void 0;i&&n.push({id:`ftype:${r.name}`,tool:`normalise`,rule:`alias`,title:`&${r.name}: ftype=${t} is superdough's number for ftype=${i} — write the word`,before:`ftype=${t}`,after:`ftype=${i}`,apply:e=>Vt(e,r.name,`ftype`,i)})}return n}function yg(e){let t=B(e.trim());return t?.kind===`use`&&!t.args&&t.main===null&&!t.head.length?{id:t.id,names:t.names,takes:t.takes}:null}let bg=(e,t,n=t)=>`${Mt(t,n)} from ${xt(e)?e:JSON.stringify(e)}`,xg=e=>V(e)[0].trim().replace(/\s+/g,` `);function Sg(e){let t=/* @__PURE__ */ new Map;for(let n of e)for(let e of n.text.split(`
`)){let r=xg(e),i=/^&([A-Za-z_][A-Za-z0-9_]*)\s/.exec(r)?.[1];i&&!t.has(r)&&t.set(r,{id:n.id,name:i})}return t}function Cg(e,t){if(!t?.length)return[];let n=Sg(t),r=e.split(`
`),i=e=>/[+*,[]\s*$/.test(V(r[e])[0])||e>0&&/[+*,[]\s*$/.test(V(r[e-1])[0]),a=new Set(Z(e).cells.map(e=>e.name)),o=/* @__PURE__ */ new Map;return r.forEach((e,t)=>{let r=n.get(xg(e));if(!r||i(t)||!a.has(r.name))return;let s=o.get(r.id)??{at:[],names:[]};s.at.push(t),s.names.push(`&${r.name}`),o.set(r.id,s)}),[...o].map(([e,{at:t,names:n}])=>{let i=r.findIndex(t=>yg(V(t)[0])?.id===e),a=i>=0?yg(V(r[i])[0]):null,o=n.filter(e=>!a?.names?.includes(e)&&!a?.takes?.includes(e)),s=a&&!a.names?bg(e,null):bg(e,[...a?.names??[],...o],[...a?.takes??[],...o]),c=i>=0?i:t[0],l=t.map(e=>V(r[e])[1].trim()).filter(Boolean);return{id:`library:${e}`,tool:`normalise`,rule:`library`,title:`${n.join(`, `)} ${n.length>1?`are`:`is`} ${JSON.stringify(e)}'s: ${s}`,before:t.map(e=>xg(r[e])).join(`; `),after:s,apply:e=>{let n=e.split(`
`);if(n.length!==r.length||t.some(e=>n[e]!==r[e]))return e;let a=/^\s*/.exec(n[c])[0],o=i>=0?V(n[i])[1].trim():l.join(` `);return n[c]=`${a}${s}${o?`  ${o.startsWith(`#`)||o.startsWith(`//`)?o:`# ${o}`}`:``}`,n.filter((e,n)=>n===c||!t.includes(n)).join(`
`)}}})}function wg(e,t){if(!t?.length)return[];let n=/* @__PURE__ */ new Map;for(let[e,r]of Sg(t)){let t=e.slice(r.name.length+2);t&&!n.has(t)&&n.set(t,r)}let r=new Set(Z(e).cells.map(e=>e.name)),i=/* @__PURE__ */ new Map;for(let t of e.matchAll(/&\(([^()]*)\)/g)){let e=n.get(t[1].trim().replace(/\s+/g,` `));if(!e||r.has(e.name))continue;let a=i.get(e.name)??{...e,inline:[]};a.inline.includes(t[0])||a.inline.push(t[0]),i.set(e.name,a)}return[...i.values()].map(({id:e,name:t,inline:n})=>({id:`library-cell:${t}`,tool:`normalise`,rule:`library`,title:`${n[0]} is ${JSON.stringify(e)}'s &${t}: use it by name`,before:n[0],after:`&${t}`,apply:r=>{let i=r.split(`
`).map(e=>{let[r,i]=V(e);return n.reduce((e,n)=>e.split(n).join(`&${t}`),r)+i}),a=i.findIndex(t=>yg(V(t)[0])?.id===e);if(a>=0){let n=yg(V(i[a])[0]);return n.names&&!n.names.includes(`&${t}`)&&(i[a]=bg(e,[...n.names,`&${t}`],[...n.takes,`&${t}`])+V(i[a])[1]),i.join(`
`)}let o=-1;return i.forEach((e,t)=>{B(V(e)[0].trim())?.kind===`use`&&(o=t)}),i.splice(o+1,0,bg(e,[`&${t}`])),i.join(`
`)}}))}let Tg=e=>/^([a-z]\w*)\(/.exec(e)?.[1]??(/^[a-z]\w*$/.test(e)?`word`:`other`);function Eg(e,t){let n=[],r=[...new Set(e.flatMap(e=>/^(\w+)\(/.exec(e.id)?.[1]??[]))].filter(t=>!e.some(e=>e.id===t)),i=[...e,...r.flatMap(e=>{let n=t?.(e);return typeof n==`string`?[{id:e,text:n}]:[]})];for(let e of i){if(!xt(e.id))continue;let t=e.text.split(`
`).map(e=>xg(e)),r=t.map(e=>/^&(\w+) from (?:\(([^)]*)\)\s*)?(?:&(\w+))?$/.exec(e)).find(Boolean);if(!r)continue;let i=r[1],a=t.find(e=>RegExp(`^&${i}\\s`).test(e)&&!B(e));if(!a)continue;let o=qt(a,i),s=[...(r[2]??``).matchAll(/&(\w+)/g)].map(e=>e[1]),c=/* @__PURE__ */ new Map;for(let e of s){let n=t.find(t=>RegExp(`^&${e}\\s`).test(t)),r=n?n.slice(e.length+2).trim():null,i=r&&/^(\w+)=(\S+)$/.exec(r);c.set(e,i?i[2]:r)}n.push({id:e.id,head:i,params:c,main:r[3]??null,attrs:Jt(a,i),braid:o.braid.join(` `)})}return n}function Dg(e,t,n){if(!t?.length)return[];let r=[],i=e.split(`
`);for(let a of Eg(t,n)){let t=H(e,a.head);if(t<0||Kt(e,a.head))continue;let n=qt(e,a.head),o=Jt(e,a.head),s=/* @__PURE__ */ new Map,c=!0,l=(e,t)=>{let n=a.params.get(e);(s.has(e)&&s.get(e)!==t||n!=null&&!t.startsWith(`&`)&&Tg(t)!==Tg(n))&&(c=!1),s.set(e,t)},u=n.braid.join(` `);for(let[e,t]of a.attrs){let n=/^&(\w+)$/.exec(t)?.[1],r=n!==void 0&&(a.params.has(n)||n===a.main);if(e===`base`&&r&&!o.has(`base`)){u&&([u]=[(l(n,u),``)]);continue}if(!o.has(e)){(!r||n===a.main||a.params.get(n)==null)&&(c=!1);continue}r?l(n,o.get(e)):o.get(e)!==t&&(c=!1)}if([...o.keys()].some(e=>!a.attrs.has(e))&&(c=!1),a.braid){let e=/* @__PURE__ */ new Set,t=a.braid.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`).replace(/&(\w+)/g,(t,n)=>a.params.has(n)||n===a.main?e.has(n)?`\\k<${n}>`:(e.add(n),`(?<${n}>.+?)`):`&${n}`),n=RegExp(`^${t}$`).exec(u.replace(/\s+/g,` `));if(!n)c=!1;else for(let[e,t]of Object.entries(n.groups??{}))l(e,t.trim())}else u&&(c=!1);if(!c||a.main&&!s.has(a.main))continue;let d=[...a.params].flatMap(([e,t])=>s.has(e)&&s.get(e)!==t?[`${e}=${s.get(e)}`]:[]),f=`&${a.head} from ${xt(a.id)?a.id:JSON.stringify(a.id)}${d.length?`(${d.join(`, `)})`:``}${a.main?` ${s.get(a.main)}`:``}`,p=xg(i[t]);r.some(e=>e.after===f)||r.push({id:`template:${a.id}:${a.head}`,tool:`normalise`,rule:`library`,title:`&${a.head} is ${JSON.stringify(a.id)}'s, with ${d.length?d.join(`, `):`its defaults`}: ${f}`,before:p,after:f,apply:e=>{let t=e.split(`
`),n=H(e,a.head);if(n<0||xg(t[n])!==p)return e;let[r,i]=V(t[n]),o=/^\s*/.exec(r)[0],s=i?` `.repeat(Math.max(1,r.length-o.length-f.length)):``;return t[n]=`${o}${f}${s}${i}`,t.join(`
`)}})}return r}let Og=/^\s*&([A-Za-z_][A-Za-z0-9_]*)(?=\s|$)/,kg=e=>RegExp(`&${e}(?![A-Za-z0-9_])`);function Ag(e,t){if(!t)return[];let n=e.split(`
`),r=n.map(e=>V(e)[0]),i=new Set(r.flatMap(e=>B(e.trim())===void 0?[Og.exec(e)?.[1]??``]:[]).filter(Boolean));return n.flatMap((e,n)=>{let[a,o]=V(e),s=B(a.trim());if(!s||s.kind!==`use`||s.args||s.main||s.head.length)return[];let c=t(s.id);if(c===null||$o(c))return[];let l=[...new Set(c.split(`
`).flatMap(e=>Og.exec(V(e)[0])?.[1]??[]))],u=s.names?.map((e,t)=>[e,s.takes[t]])??l.map(e=>[`&${e}`,`&${e}`]),d=e=>!i.has(e)&&r.some((t,r)=>r!==n&&kg(e).test(t)),f=u.filter(([e])=>d(e.slice(1)));if(!f.length)return[];let p=a.trim(),m=`${Mt(f.map(([e])=>e),f.map(([,e])=>e))} from ${xt(s.id)?s.id:JSON.stringify(s.id)}`;return m===p?[]:[{id:`narrowest:${n+1}`,tool:`normalise`,rule:`narrowest`,title:`${p} is written ${m}: the cells of it the piece uses`,before:p,after:m,apply:t=>t.split(`
`).map((t,r)=>r===n&&t===e?`${/^\s*/.exec(a)[0]}${m}${o?`${/\s*$/.exec(a)[0]}${o}`:``}`:t).join(`
`)}]})}let jg=(e,t,n,r,i)=>({id:`${e}:${n}`,tool:`normalise`,rule:e,title:t,before:n,after:r,apply:i}),Mg=(e,t,n)=>{let r=e.split(`
`),i=H(e,t),a=/^\s*/.exec(r[i])[0];return r.splice(i+1,0,`${a}${n}`),r.join(`
`)},Ng={from:40,to:300};function Pg(e,t){let n=e.cells.get(t)?.beat||1,r=Ku(e,mf(e,gi(e)).statics).map(t),i=60/((r.q(4*n)-r.q(0))/4);return Number.isFinite(i)&&i>=Ng.from&&i<=Ng.to}let Fg=/* @__PURE__ */ new Set([`bar`,`tempo`,`key`,`tonic`,`harm`,`style`]),Ig=e=>Fg.has(e),Lg=(e,t,n)=>H(e,n)<0&&!t.cells.has(n);function Rg(e,t){let n=new Set(Z(e).cells.map(e=>e.name)),r=[],i=[...n].filter(e=>t.clocks.has(e)&&t.cells.get(e)?.meter),a=t.mainMeter;if(a&&n.has(a)&&i.length===1&&!Kt(e,a)&&Pg(t,a)){!Ig(a)&&Lg(e,t,`bar`)&&r.push(jg(`bar`,`&${a} is the piece's meter: &bar`,`&${a}`,`&bar`,e=>Qt(e,a,`bar`)));let n=Jt(e,a).get(`step`);a===`bar`&&n&&!n.startsWith(`&`)&&Lg(e,t,`tempo`)&&r.push(jg(`tempo`,`&bar's rate is its tempo: step=&tempo, &tempo step=${n}`,`step=${n}`,`step=&tempo`,e=>Mg(Vt(e,`bar`,`step`,`&tempo`),`bar`,`&tempo step=${n}`)))}let o=[...n].filter(t=>qt(e,t)?.braid[0]?.startsWith(`scale(`)),s=t.mainKey;if(s&&n.has(s)&&o.length===1&&!Kt(e,s)){!Ig(s)&&Lg(e,t,`key`)&&r.push(jg(`key`,`&${s} is the piece's key: &key`,`&${s}`,`&key`,e=>Qt(e,s,`key`)));let n=qt(e,s).braid,i=n.length===1?/^scale\(\s*([^,()\s]+)\s*,\s*([A-Ga-g][#b♯♭]*-?\d*)\s*\)$/.exec(n[0]):null;s===`key`&&i&&Lg(e,t,`tonic`)&&r.push(jg(`tonic`,`&key's tonic is a cell: scale(${i[1]}, &tonic), &tonic ${i[2]}`,n[0],`scale(${i[1]}, &tonic)`,e=>Mg(zg(e,`key`,n[0],`scale(${i[1]}, &tonic)`),`key`,`&tonic ${i[2]}`)))}return r}function zg(e,t,n,r){let i=e.split(`
`),a=H(e,t);if(a<0)return e;let[o,s]=V(i[a]),c=o.indexOf(n);return c<0?e:(i[a]=o.slice(0,c)+r+o.slice(c+n.length)+s,i.join(`
`))}let Bg=(e,t,n,r,i)=>({id:`${e}:${n}`,tool:`normalise`,rule:e,title:t,before:n,after:r,apply:i});function Vg(e,t,n,r){let i=e.split(`
`),a=H(e,t);if(a<0)return e;let[o,s]=V(i[a]),c=o.indexOf(n);return c<0?e:(i[a]=o.slice(0,c)+r+o.slice(c+n.length)+s,i.join(`
`))}function Hg(e,t){let[n,r]=V(e);if(!r)return t;let i=n.length-n.trimEnd().length>1;return`${t}${` `.repeat(i?Math.max(1,n.length-t.length):1)}${r}`}function Ug(e,t){let n=t.mainMeter;if(!n||Kt(e,n)||Jt(e,n).has(`pulse`))return[];let r=qt(e,n)?.braid??[],i=r.length===1?/^scan\(\s*([^()]*)\)$/.exec(r[0]):null;if(!i)return[];let a=i[1].trim().split(/\s+/).flatMap(e=>{let t=/^([0-9]+)(?:!([0-9]+))?$/.exec(e);return t?Array.from({length:Number(t[2]??1)},()=>t[1]):[`?`]});if(a.length<2||a.length>12||a.some(e=>e!==a[0])||![`1`,`4`].includes(a[0]))return[];let o=`meter("${a.length}/4")`;return[Bg(`meter`,`&${n}: ${r[0]} is ${o}`,r[0],o,e=>Vg(e,n,r[0],o))]}function Wg(e){let t=/^(-?)([0-9]*)(?:\.([0-9]+))?$/.exec(e);if(!t||t[2]===``&&t[3]===void 0)return null;let n=10**(t[3]?.length??0);return[(t[1]?-1:1)*Number(`${t[2]||`0`}${t[3]??``}`),n]}let Gg=(e,t)=>t===0?Math.abs(e):Gg(t,e%t);function Kg(e,t){let[n,r]=Wg(e)??[NaN,1],[i,a]=Wg(t)??[NaN,1],o=n*a,s=n*a+i*r;if(!Number.isFinite(o)||!(o>0)||!(s>o))return null;let c=Gg(o,s);return`${o/c}/${s/c}`}function qg(e,t){let n=t.mainMeter;if(!n||Kt(e,n)||Jt(e,n).has(`swing`)||H(e,n)<0)return[];let r=[];for(let{name:t}of Z(e).cells){if(t===n||Kt(e,t))continue;let i=qt(e,t),a=Jt(e,t),o=a.get(`step`)??``;if(!i||i.braid.length!==1||a.size!==1||!/^[0-9]+n$/.test(o))continue;let s=`-?(?:[0-9]+(?:\\.[0-9]+)?|\\.[0-9]+)`,c=RegExp(`^scan\\(\\s*(${s})\\s+(${s})\\s*\\)$`).exec(i.braid[0]),l=RegExp(`^scan\\(\\s*free\\(\\s*(${s})\\s*,\\s*(${s})\\s*\\.\\.\\s*(${s})\\s*\\)\\s+(${s})\\s*\\)$`).exec(i.braid[0]),u=null;if(c)u=Kg(c[1],c[2]);else if(l){let[e,t,n]=[l[1],l[2],l[3]].map(e=>Kg(e,l[4]));u=e&&t&&n?`free(${e}, ${t}..${n})`:null}if(!u)continue;let d=e.replace(/about=(?:\([^)]*\)|&\w+)/g,``),f=[...d.matchAll(RegExp(`&${t}(?!\\w)`,`g`))].length,p=[...d.matchAll(RegExp(`step=&${t}:pulse(?![\\w*/.:])`,`g`))].length;if(p===0||f!==1+p)continue;let m=`swing=${o}:${u}`;r.push(Bg(`swing`,`&${t} ${i.braid[0]} step=${o}, tapped by its pulse, is a swing of the meter's: &${n} swing=&${t}, &${t} ${m}`,`&${t} ${i.braid[0]} step=${o}`,`&${t} ${m}`,e=>{let r=e.split(`
`),i=H(e,t),a=/^\s*/.exec(r[i])[0];r[i]=Hg(r[i],`${a}&${t} ${m}`);let s=H(e,n),[c]=V(r[s]);r[s]=Hg(r[s],`${c.trimEnd()} swing=&${t}`);let l=RegExp(`step=&${t}:pulse(?![\\w*/.:])`,`g`);return r.map(e=>l.test(e)?Hg(e,V(e)[0].trimEnd().replace(l,`step=${o}`)):e).join(`
`)}))}return r}let Jg=[...[`1n`,`2n`,`4n`,`8n`,`16n`,`32n`].flatMap(e=>[e,`${e}.`,e.replace(`n`,`t`)]),`pulse`,`beat`,`1m`],Yg={steps:64,seconds:1e-9};function Xg(e,t,...n){return[...n.reduce((e,t)=>e.replace(t,``),e.replace(/about=(?:\([^)]*\)|&\w+)/g,``)).matchAll(RegExp(`&${t}(?!\\w)`,`g`))].length-1}let Zg=(e,t)=>RegExp(`about=(?:\\([^)]*&${t}(?!\\w)[^)]*\\)|&${t}(?!\\w))`).test(e);function Qg(e,t){let n=e.split(`
`),r=H(e,t);return r<0?e:[...n.slice(0,r),...n.slice(r+1)].join(`
`)}function $g(e,t,n){let r=Hf(e,void 0,n);if(!r.clocks.has(t))return null;let i=Ku(r,mf(r,gi(r)).statics).map(t);return Array.from({length:Yg.steps},(e,t)=>i.q(t))}function e_(e,t,n={}){let r=t.mainMeter;if(!r)return[];let i=new Set(Z(e).cells.map(e=>e.name)),a=[];for(let o of i){if(o===r||!t.clocks.has(o)||Kt(e,o))continue;let i=e.split(`
`)[H(e,o)]??``;if(/free\(/.test(V(i)[0]))continue;let s=RegExp(`step=&${o}:([\\w.]+)(?![\\w*/.:])`,`g`),c=[...new Set([...e.matchAll(s)].map(e=>e[1]))];if(!c.length||Xg(e,o,s)!==0)continue;let l=`${e}\n${Jg.map((e,t)=>`&__tap${t} step=${e} 0`).join(`
`)}`,u=(e,t)=>e.every((e,n)=>Math.abs(e-t[n])<=Yg.seconds),d=/* @__PURE__ */ new Map;for(let t of c){let i=$g(e,`${o}:${t}`,n),a=i&&Jg.find(e=>{let t=$g(l,`${r}:${e}`,n);return t!==null&&u(t,i)});a&&d.set(t,a)}if(d.size!==c.length)continue;let f=[...d].map(([e,t])=>`&${o}:${e} is ${t}`).join(`, `);a.push(Bg(`meter`,`&${o}'s ticks are &${r}'s: ${f}`,`step=&${o}:${c[0]}`,`step=${d.get(c[0])}`,e=>{let t=e.replace(s,(e,t)=>`step=${d.get(t)??`&${o}:${t}`}`);return!Zg(t,o)&&Xg(t,o)===0&&(t=Qg(t,o)),t}))}return a}function t_(e,t){let n=t.mainMeter;if(!n||H(e,n)<0||Kt(e,n))return[];let r=Jt(e,n),i=r.get(`step`);if(!i||/free\(/.test(i))return[];let a=[];for(let{name:o}of Z(e).cells){if(o===n||!t.cells.get(o)?.meter||Kt(e,o))continue;let s=Jt(e,o);if(s.get(`step`)!==i)continue;let c=[`swing`,`legato`].filter(e=>s.has(e));if(!c.length||c.some(e=>r.has(e))||[...s.keys()].some(e=>e!==`step`&&!c.includes(e)))continue;let l=RegExp(`step=&${o}:([\\w.]+)(?![\\w*/.:])`,`g`);if(!l.test(e)||Xg(e,o,l)!==0)continue;let u=c.map(e=>`${e}=${s.get(e)}`).join(` `);a.push(Bg(`swing`,`&${o} is &${n} with ${u}: &${n} ${u}, its readers on &${n}'s taps`,`&${o}`,`&${n} ${u}`,e=>{let t=e.split(`
`),r=H(e,n);t[r]=Hg(t[r],`${V(t[r])[0].trimEnd()} ${u}`);let i=t.join(`
`).replace(l,(e,t)=>`step=${t}`);return!Zg(i,o)&&Xg(i,o)===0&&(i=Qg(i,o)),i}))}return a}function n_(e,t){let n=Jt(e,t),r=qt(e,t),i=H(e,t);if(!n.has(`trigger`)||!r||i<0)return null;let a=[n.get(`velocity`),n.get(`gate`),n.get(`gain`)].filter(e=>!!e&&e!==`1`),o=e;for(let e of[`velocity`,`gate`,`gain`])o=Vt(o,t,e,null);let s=o.split(`
`);return s[i]=s[i].replace(/(\s)trigger=(\S+)/,(e,t,n)=>`${t}play=${n}${a.length?` level=${a.join(`*`)}`:``}`),o=s.join(`
`),r.braid.length>1&&(o=Yt(o,t,[`[${r.braid.join(`, `)}]`])),o}function r_(e,t,n={}){let r=[];for(let i of t.cells.values()){if(i.gate?.port!==`trigger`)continue;let t=n_(e,i.name);if(t===null||!hg(e,t,void 0,n))continue;let a=H(e,i.name);r.push({id:`gate:${i.name}`,tool:`migrate`,rule:`gate`,title:`&${i.name} is a gate written the old way: play= for trigger=, one level= for velocity=, gate= and gain=, the voices it plays all of as a chord`,before:e.split(`
`)[a].trim(),after:t.split(`
`)[a].trim(),apply:e=>n_(e,i.name)??e})}return r}function i_(e,t,n=1){let r=e.cells.get(t)?.step;if(!r||r.tap||r.whole||r.cycle)return null;let i=e.cells.get(r.driver)?.meter;if(!i||!e.clocks.has(r.driver)||e.clocks.get(r.driver).belt)return null;let a=r.chain.reduce((e,t)=>t.op===`×`?e*t.n:e/t.n,1)/n,o=!e.cells.get(r.driver)?.step,s=Cl(i.levels.length,i.pulses,o?i.unit:0,a);return e.mainMeter===r.driver?s:`&${r.driver}:${s}`}function a_(e,t,n={}){let r=[],i=/* @__PURE__ */ new Set;for(let a of t.cells.values()){let o=i_(t,a.name),s=t.sections?.get(a.name)??a.name;if(o===null||i.has(s)||H(e,s)<0)continue;i.add(s);let c=e=>Vt(e,s,`step`,o),l=[c,e=>Vt(c(e),s,`cycle`,null)].find(t=>{let r=t(e);return r!==e&&hg(e,r,void 0,n)});if(!l)continue;let u=l(e),d=H(e,s);r.push({id:`tap:${s}`,tool:`migrate`,rule:`tap`,title:`&${s} steps by the meter cell's own steps: tap the meter instead, step=${o} (decision 040)`,before:e.split(`
`)[d].trim(),after:u.split(`
`)[d].trim(),apply:l})}return r}function o_(e,t,n={}){let r=[];for(let i of t.cells.values()){let t=i.meter,a=t&&typeof i.params.swing==`number`?Jt(e,i.name).get(`swing`):void 0;if(!t||!a||a.startsWith(`&`)||/^[1-9][0-9]*(?:n\.?|t):/.test(a)||H(e,i.name)<0)continue;let o=Pi(t),s=o===null?null:Di(o);if(!o||s===null||Fi(t,s)!==null)continue;let c=e=>Vt(e,i.name,`swing`,`${o}:${a}`),l=c(e);if(l===e||!hg(e,l,void 0,n))continue;let u=H(e,i.name);r.push({id:`swing:${i.name}`,tool:`migrate`,rule:`swing`,title:`&${i.name}'s swing= leans the meter cell's own steps: name the level, swing=${o}:${a} (#18)`,before:e.split(`
`)[u].trim(),after:l.split(`
`)[u].trim(),apply:c})}return r}function s_(e,t){let n=t.mainKey;return n?Z(e).cells.flatMap(e=>{if(e.over?.name!==`key:main`)return[];let{line:t,col:r}=e.over.span,i=`over=&${n}`;return[{id:`main key:${t}:${r}`,tool:`migrate`,rule:`main key`,title:`over=key is written ${i}, the key it reads`,before:`over=key`,after:i,apply:e=>e.split(`
`).map((e,i)=>i===t-1&&e.slice(r-1-5,r-1+3)===`over=key`?`${e.slice(0,r-1)}&${n}${e.slice(r+2)}`:e).join(`
`)}]}):[]}let c_=e=>{let t=B(e.trim());return t?.kind===`use`&&!t.head.length&&!t.args&&t.main===null?t:null};function l_(e){let t=e.split(`
`).map(e=>V(e)[0].trim()).filter(Boolean),n=t.length===1?c_(t[0]):null;return n&&n.names?.every((e,t)=>e===n.takes[t])!==!1?n:null}function u_(e,t){if(!e.names)return{names:t.names,takes:t.takes};if(!(t.names&&e.takes.some(e=>!t.names.includes(e))))return{names:e.names,takes:e.takes}}let d_=(e,{names:t,takes:n})=>`${Mt(t,n)} from ${xt(e)?e:JSON.stringify(e)}`;function f_(e,t){return t?e.split(`
`).flatMap((e,n)=>{let[r,i]=V(e),a=c_(r);if(!a)return[];let o=t(a.id),s=o===null?null:l_(o),c=s?u_(a,s):void 0;if(!s||c===void 0)return[];let l=r.trim(),u=d_(s.id,c);return[{id:`forwarded:${n+1}`,tool:`migrate`,rule:`forwarded`,title:`${l} takes what ${JSON.stringify(a.id)} forwards: ${u}`,before:l,after:u,apply:t=>t.split(`
`).map((t,a)=>a===n&&t===e?`${/^\s*/.exec(r)[0]}${u}${i?`${/\s*$/.exec(r)[0]}${i}`:``}`:t).join(`
`)}]}):[]}function p_(e,t,n={}){let r=[];for(let n of t.cells.values()){if(!n.root||n.map?.kind!==`edo`)continue;let t=Jt(e,n.name),i=t.get(`cycle`),a=t.get(`map`);if(!i||!/^[1-9][0-9]*$/.test(i)||!a||H(e,n.name)<0)continue;let o=a===`edo`?`edo(${i})`:/^ed\(([^,)]+)\)$/.test(a)?`ed(${i}, ${a.slice(3,-1)})`:null;if(!o)continue;let s=e=>Vt(Vt(e,n.name,`map`,o),n.name,`cycle`,null),c=H(e,n.name);r.push({id:`grid:${n.name}`,tool:`migrate`,rule:`grid`,title:`&${n.name}'s size is its map's: map=${o} for cycle=${i} map=${a} (decision 040)`,before:e.split(`
`)[c].trim(),after:s(e).split(`
`)[c].trim(),apply:s})}return r}function m_(e,t){let n=new Map(Z(e).cells.map(e=>[e.name,e])),r=[];for(let i of t.cells.values()){let t=n.get(i.name),a=i.cycle;if(!t||t.step?.kind!==`driven`||t.cycle===null||t.map||a<2||t.cycle<a||t.cycle%a!==0||Jt(e,i.name).get(`cycle`)!==String(t.cycle)||H(e,i.name)<0)continue;let o=t.cycle/a,s=e=>Vt(e,i.name,`cycle`,o===1?null:String(o)),c=H(e,i.name);r.push({id:`laps:${i.name}`,tool:`migrate`,rule:`laps`,title:`&${i.name}'s cycle=${t.cycle} counted steps: ${o===1?`one lap of its `+a+`, the default`:`cycle=${o}, ${o} laps of its ${a}`} (decision 040)`,before:e.split(`
`)[c].trim(),after:s(e).split(`
`)[c].trim(),apply:s,exact:!0})}return r}function h_(e){let t=B(e);return t?.kind===`use`?t.id:null}function g_(e,t){return t?e.split(`
`).flatMap((e,n)=>{let[r]=V(e),i=h_(r),a=i===null?void 0:Ro.get(i);if(a===void 0||t(i)===null||t(i)!==t(a))return[];let o=JSON.stringify(i),s=RegExp(`(\\sfrom\\s+)(${__(o)}|${__(i)})(?=[\\s(]|$)`).exec(r);if(!s)return[];let c=s.index+s[0].length,l=a.endsWith(`)`)&&r[c]===`(`?`${a.slice(0,-1)}, ${r.slice(c+1)}`:`${a}${r.slice(c)}`;return[v_(n,e,r,`${r.slice(0,s.index)}${s[1]}${l}`,i,a)]}):[]}let __=e=>e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`);function v_(e,t,n,r,i,a){let o=n.trim();return{id:`renamed:${e+1}`,tool:`migrate`,rule:`renamed`,title:`${JSON.stringify(i)} is ${a} now: ${r.trim()}`,before:o,after:r.trim(),apply:i=>i.split(`
`).map((i,a)=>a===e&&i===t?`${r}${t.slice(n.length)}`:i).join(`
`)}}function y_(e,t){return t?e.split(`
`).flatMap((e,n)=>{let[r]=V(e),i=B(r.trim()),a=i?.kind===`use`?zo.get(i.id):void 0;if(!i||i.kind!==`use`||!a||!i.names)return[];let o=t(a.document);if(o===null||!Xo(o).some(e=>e.includes(a.head)))return[];let s=i.names.map((e,t)=>t===0?`&${a.head}`:i.takes?.[t]??e),c=RegExp(`\\sfrom\\s+(?:"${i.id}"|${i.id})(?=[\\s(]|$)`).exec(r);if(!c)return[];let l=`${r.slice(0,r.length-r.trimStart().length)}${Mt(i.names,s)} from ${a.document}${r.slice(c.index+c[0].length)}`.trimEnd(),u=r.trim();return[{id:`moved:${n+1}`,tool:`migrate`,rule:`moved`,title:`${JSON.stringify(i.id)} is a part of ${a.document} now: ${l.trim()}`,before:u,after:l.trim(),apply:t=>t.split(`
`).map((t,i)=>i===n&&t===e?`${l}${e.slice(r.trimEnd().length)}`:t).join(`
`)}]}):[]}let b_=/(^|\s)oneshot(?=\s|$)/,x_=e=>e.replace(/"[^"]*"/g,e=>` `.repeat(e.length));function S_(e){return e.split(`
`).flatMap((e,t)=>{let[n,r]=V(e),i=b_.exec(x_(n));if(!i||!/^\s*&/.test(n))return[];let a=i.index+i[1].length,o=`${n.slice(0,a)}oneshot=1${n.slice(a+7)}`,s=o+r;return[{id:`oneshot:${t+1}`,tool:`migrate`,rule:`oneshot`,title:`oneshot is a voice's parameter: oneshot=1 (decision 068)`,before:n.trim(),after:o.trim(),apply:n=>n.split(`
`).map((n,r)=>r===t&&n===e?s:n).join(`
`)}]})}let C_=/(swing=[^\s]*?[0-9)]):pairs(?=[,\s]|$)/g,w_=e=>e.replace(/"[^"]*"/g,e=>` `.repeat(e.length));function T_(e){return e.split(`
`).flatMap((e,t)=>{let[n,r]=V(e);if(!/^\s*&/.test(n))return[];let i=w_(n),a=n,o=[...i.matchAll(C_)].reverse();if(!o.length)return[];for(let e of o)a=a.slice(0,e.index+e[1].length)+a.slice(e.index+e[0].length);let s=a+r;return[{id:`pairs:${t+1}`,tool:`migrate`,rule:`pairs`,title:`a swing leans a level's pairs alone, its groups of three straight: :pairs says nothing more (decision 071)`,before:n.trim(),after:a.trim(),apply:n=>n.split(`
`).map((n,r)=>r===t&&n===e?s:n).join(`
`)}]})}let E_=e=>Number.isInteger(e)&&e>=1&&Number.isInteger(Math.log2(e));function D_(e,t){let n=/^meter\("([^"]+)"(?:,\s*([1-8]))?\)$/.exec(e);if(n){let[,e,r]=n,i=Number(r??1),a=ia(e),o=[];if(a&&a.pulses%t===0){let e=a.pulses/t,n=a.unit/e;E_(n)&&o.push({braid:`meter("${t}/${n}"${i*e>1?`, ${i*e}`:``})`})}let s=fa(e,i);if(s&&s.length%t===0&&a&&E_(a.unit*i)){let e=s.length/t,n=[...s].map((t,n)=>n===0?`*`:n%e===0?`+`:t===`,`?`,`:`.`).join(``);o.push({braid:`meter("${n}", ${a.unit*i}n)`})}return o}let r=/^scan\((.*)\)$/.exec(e);if(r){let e=4*r[1].trim().split(/\s+/).reduce((e,t)=>e+(/!(\d+)$/.exec(t)?Number(/!(\d+)$/.exec(t)[1]):1),0)/t;return E_(e)?[{pulse:`${e}n`}]:[]}return[]}function O_(e,t,n={}){let r=[];for(let i of t.cells.values()){let t=i.params.beat,a=typeof t==`number`&&H(e,i.name)>=0?qt(e,i.name):null;if(a&&typeof t==`number`&&t>=1&&i.meter)for(let o of D_(a.braid.join(` `),Math.round(t))){let t=a.braid.join(` `),s=e=>{let n=H(e,i.name);if(n<0)return e;let r=e.split(`
`),[a,s]=V(r[n]),c=o.braid?a.replace(t,o.braid):a;return c=c.replace(/(\s)beat=\S+/,o.pulse?`$1pulse=${o.pulse}`:``),r[n]=c+s,r.join(`
`)},c=s(e);if(c===e||!hg(e,c,void 0,n))continue;let l=H(e,i.name);r.push({id:`beats:${i.name}`,tool:`migrate`,rule:`beats`,title:`beat= is retired: &${i.name} counts its beats as ${o.braid??`pulse=${o.pulse}`} does (#502)`,before:e.split(`
`)[l].trim(),after:c.split(`
`)[l].trim(),apply:s});break}}return r}function k_(e,t){let n=new Map(Z(e,{old:!0}).cells.map(e=>[e.name,e])),r=/* @__PURE__ */ new Map;for(let e of t.cells.values())if(e.kit)for(let i of e.units){if(i.atom.kind!==`ref`||r.has(i.atom.name))continue;let e=n.get(i.atom.name),a=Kc(i.atom.name);e&&a!==null&&e.drumNote===void 0&&t.cells.get(i.atom.name)?.voice&&r.set(i.atom.name,a)}return[...r]}function A_(e,t){let n=k_(e,t);if(!n.length)return[];let r=n.map(([e,t])=>`&${e} note=${t}`).join(`, `);return[{id:`notes:${n.map(([e])=>e).join(`,`)}`,tool:`migrate`,rule:`notes`,title:`A drum's note is its note=, not its name: ${r} (decision 075)`,before:n.map(([e])=>`&${e}`).join(`, `),after:r,apply:e=>n.reduce((e,[t,n])=>Vt(e,t,`note`,String(n)),e)}]}function j_(e,t,n){let r=Ct(e),i=r.findIndex(e=>e.text===`from`),a=r[i+1];if(i<0||!a)return null;let o=a.text.indexOf(`(`)>=0?{at:a.at,text:a.text}:r[i+2]?.text.startsWith(`(`)?r[i+2]:null;if(!o)return`${e.slice(0,a.at+a.text.length)}(${t}=${n})${e.slice(a.at+a.text.length)}`;let s=o.at+o.text.length-1,c=/\(\s*$/.test(e.slice(0,s));return`${e.slice(0,s)}${c?``:`, `}${t}=${n}${e.slice(s)}`}function M_(e,t,n){if(!n)return[];let r=new Set(t.cells.keys()),i=new Set(e.split(`
`).flatMap(e=>{let t=V(e)[0];return B(t.trim())===void 0?/^\s*&([A-Za-z_][A-Za-z0-9_]*)(?=\s|$)/.exec(t)?.[1]??[]:[]}));return e.split(`
`).flatMap((e,t)=>{let[a,o]=V(e),s=B(a.trim());if(s?.kind!==`use`)return[];let c=n(s.id),l=c===null?null:$o(c),u=(Bo.get(s.id)??[]).filter(e=>l?.optional.includes(`&${e}`)&&!s.args?.some(t=>t.name===e)&&i.has(e)&&r.has(e));if(!u.length)return[];let d=a.trimEnd();for(let e of u)d=d===null?null:j_(d,e,`&${e}`);if(d===null)return[];let f=a.trim(),p=d.trim();return[{id:`arguments:${t+1}`,tool:`migrate`,rule:`arguments`,title:`${JSON.stringify(s.id)} reads ${u.map(e=>`&${e}`).join(`, `)} by name no longer: ${p}`,before:f,after:p,apply:n=>n.split(`
`).map((n,r)=>r===t&&n===e?`${d}${a.slice(a.trimEnd().length)}${o}`:n).join(`
`)}]})}let N_=[`drums`,`bass`,`pad`,`stab`,`lead`],P_=/* @__PURE__ */ new Set([`kick`,`backbeat`,`ghost`,`hat`,`pedal`,`euclid`,`clave`,`fill`]);function F_(e){let[t,n,r]=(e??``).split(`:`);return t===`kit`&&n===`voices`?r!==void 0&&P_.has(r)?{part:`drums`,role:r}:null:I_(n)?{part:n}:null}let I_=e=>e!==`drums`&&N_.includes(e);function L_(e){let t=(t,n)=>t===void 0?void 0:e.cells.get(t)?.params[n],n=new Map(e.performers.flatMap(e=>{let n=t(e.role,`part`);return typeof n==`string`&&I_(n)?[[e.name,n]]:[]})),r=/* @__PURE__ */ new Map;for(let i of e.outputs){let[e,a,o]=i.id.split(`:`);if(e===`kit`&&a===`voices`){let e=t(o,`role`);typeof e==`string`&&P_.has(e)&&r.set(i.id,{part:`drums`,role:e});continue}let s=[...i.via,...i.through].find(e=>n.has(e)),c=s===void 0?t(/^[A-Za-z_][A-Za-z0-9_]*/.exec(a??``)?.[0],`part`):n.get(s);typeof c==`string`&&I_(c)&&r.set(i.id,{part:c})}return e=>e!==void 0&&r.get(e)||null}function R_(e){let t=new Map(e.performers.flatMap(e=>I_(e.role)?[[e.name,e.role]]:[])),n=/* @__PURE__ */ new Map;for(let r of e.outputs){let e=[...r.via,...r.through].find(e=>t.has(e));e!==void 0&&F_(r.id)?.part!==`drums`&&n.set(r.id,{part:t.get(e)})}return e=>e!==void 0&&n.get(e)||F_(e)}function z_(e,t){let n=new Set(Z(e,{old:!0}).cells.map(e=>e.name)),r=R_(t),i=L_(t),a=new Map(t.performers.map(e=>[e.name,e.role])),o=/* @__PURE__ */ new Map,s=(e,r,i)=>{e!==void 0&&n.has(e)&&t.cells.get(e)?.params[r]===void 0&&!o.has(`${e} ${r}`)&&o.set(`${e} ${r}`,[e,r,i])};for(let e of t.outputs){let t=r(e.id);if(!t||JSON.stringify(i(e.id))===JSON.stringify(t))continue;let[,n,o]=e.id.split(`:`);if(t.role!==void 0){s(o,`role`,t.role);continue}let c=[...e.via,...e.through].find(e=>a.get(e)===t.part);s(c===void 0?/^[A-Za-z_][A-Za-z0-9_]*/.exec(n??``)?.[0]:a.get(c),`part`,t.part)}return[...o.values()]}function B_(e,t){let n=z_(e,t);if(!n.length)return[];let r=n.map(([e,t,n])=>`&${e} ${t}=${n}`).join(`, `);return[{id:`parts:${n.map(([e,t])=>`${e}.${t}`).join(`,`)}`,tool:`migrate`,rule:`parts`,title:`The default performer reads a part and a drum role as values, not names: ${r} (decision 075)`,before:n.map(([e])=>`&${e}`).join(`, `),after:r,apply:e=>n.reduce((e,[t,n,r])=>Vt(e,t,n,r),e)}]}let V_=(e={})=>(t,n)=>[...r_(t,n,e),...a_(t,n,e),...o_(t,n,e),...s_(t,n),...f_(t,e.resolve),...p_(t,n,e),...m_(t,n),...g_(t,e.resolve),...S_(t),...T_(t),...O_(t,n,e),...A_(t,n),...M_(t,n,e.resolve),...mn(t),...B_(t,n),...y_(t,e.resolve)],H_=(e={})=>(t,n)=>[...V_(e)(t,n).filter(e=>!e.exact),...Rg(t,n),...Ug(t,n),...qg(t,n),...t_(t,n),...e_(t,n,e),..._g(t,n),...vg(t,n),...Cg(t,e.library),...Dg(t,e.library,e.resolve),...wg(t,e.library),...Ag(t,e.resolve)],U_=(e,t)=>{let n={...t,old:!0};return gg(e,H_(n),20,n)},W_=/* @__PURE__ */ new Set([`label`,`show`,`tags`,`title`,`tier`,`about`,`size`]),G_=e=>e.k===`ref`||e.k===`num`?1:e.k===`sum`?e.items.reduce((e,t)=>e+G_(t.e),0):e.factors.reduce((e,t)=>e+G_(t),0);function K_(e){switch(e.kind){case`chord`:return e.notes.length;case`choice`:return e.values.length;case`seq`:return e.layers.reduce((e,t)=>e+q_(t),0);case`mix`:return e.exprs.reduce((e,t)=>e+G_(t),0);default:return 1}}let q_=e=>e.reduce((e,t)=>e+K_(t.atom),0);function J_(e,t){switch(e.kind){case`blank`:return 0;case`wave`:return 1;case`scan`:{let{line:n,col:r,len:i}=e.span;return(t[n-1]??``).slice(r-1,r-1+i).replace(/^scan\(|\)$/g,``).split(/[\s,]+/).filter(Boolean).length}case`list`:return e.signature?1:q_(e.tokens)}}function Y_(e){let t=/* @__PURE__ */ new Map,n=0,r=null;return e.split(`
`).forEach((e,i)=>{let a=e.replace(/"[^"]*"/g,`""`).replace(/#.*$/,``);r===null&&(n=i+1),r=r===null?a:`${r} ${a}`,/[+*,[]\s*$/.test(r)||(t.set(n,r),r=null)}),r!==null&&t.set(n,r),t}let X_=e=>[...e.matchAll(/(?:^|[\s(])([A-Za-z][A-Za-z0-9]*)=/g)].filter(e=>!W_.has(e[1])).length+[...e.matchAll(/(?:^|\s)(off|oneshot)(?=\s|$)/g)].length;function Z_(e,{asWritten:t=!1,resolve:n}={}){let r=t?e:U_(e,n?{resolve:n}:{}).source,i=r.replace(/(^|[\s(])base=&[A-Za-z_][A-Za-z0-9_]*(?:\^\$?-?\d+)?/gm,`$1`),a=i.split(`
`),o=Z(i).cells.filter(e=>!Kn(e)),s=Y_(r),c=/* @__PURE__ */ new Set;return o.map(e=>{let t=J_(e.braid,a),n=e.span.line,r=!e.lambda&&!c.has(n)&&s.has(n)?X_(s.get(n)):0;return e.lambda||c.add(n),{name:e.name,cells:1,leaves:t,attributes:r,total:1+t+r}})}function Q_(e,t={}){let n=Z_(e,t),r=e=>n.reduce((t,n)=>t+n[e],0),i=Z(e).takes?.length??0;return{cells:r(`cells`),leaves:r(`leaves`)+i,attributes:r(`attributes`),total:r(`total`)+i}}let $_=(e,t,n)=>({...e,sign:e.sign*t,by:e.by*t+n}),ev=e=>`${e.table}:${e.sign*e.value+e.by}:${e.sign*e.alter}:${e.transpose}`;function tv(e){if(typeof e.written==`number`){let t=e.sign*e.alter;return`${e.sign*e.written+e.by}${t>0?`#`:t<0?`b`:``}`}let t=e.sign===-1?`inverse(${e.written})`:e.written;return e.by===0?t:/^&[A-Za-z_][A-Za-z0-9_]*$/.test(t)?`${t}^${e.by}`:`degree(${t}, ${e.by})`}let nv=(e,t)=>e.cells.get(t.slice(1))?.drumNote??null,rv=(e,t)=>nv(e,t)??128,iv=/^~(?:[!@](\d+))?$/,av=/^&([A-Za-z_][A-Za-z0-9_]*)(?::0(?::([0-9]*\.?[0-9]+))?)?(?:!(\d+))?$/,ov=/^\[([^[\]]*,[^[\]]*)\]$/,sv=/^\[([^[\],]*)\]$/,cv=/^&([A-Za-z_][A-Za-z0-9_]*)\((\d+),\s*(\d+)(?:,\s*(-?\d+))?\)$/,lv=/^([0-9]*\.?[0-9]+)(?:!(\d+))?$/,uv=/^(-?\d+)[#b]?(?:!(\d+))?$/,dv=/^(-?\d+)[#b]?@(\d+)$/,fv=String.raw`&[A-Za-z_][A-Za-z0-9_]*(?:\^\$?-?\d+)?`,pv=new RegExp(String.raw`^(?:${fv}|inverse\(${fv}\)|degree\((?:${fv}|inverse\(${fv}\)),\s*-?\d+\))$`);function mv(e){let t=av.exec(e);return t&&!t[3]?{voice:`&${t[1]}`,own:t[2]??null}:null}function hv(e){let t=[];for(let n of e){let e=iv.exec(n),r=av.exec(n),i=ov.exec(n);if(e)for(let n=0;n<Number(e[1]??1);n++)t.push([]);else if(r)for(let e=0;e<Number(r[3]??1);e++)t.push([{voice:`&${r[1]}`,own:r[2]??null}]);else if(i){let e=i[1].split(`,`).map(e=>mv(e.trim()));if(e.some(e=>!e))return null;t.push(e)}else return null}return t}function gv(e){let t=[];for(let n of e){let e=lv.exec(n);if(!e)return null;for(let n=0;n<Number(e[2]??1);n++)t.push(e[1])}return t}let _v=(e,t,n)=>{let r=ta(e,t);return Array.from({length:t},(e,t)=>t).filter(e=>r[((e-n)%t+t)%t])};function vv(e,t){if(!e||!t)return null;let n=t.pulses/t.unit;return e===`1m`?n:e===`pulse`?1/t.unit:Di(e)}function yv(e,t){let n=qt(e,t)?.braid??[];return n.length!==1||!/^\[.*\]$/.test(n[0])?[]:n[0].slice(1,-1).split(`,`).map(e=>e.trim())}function bv(e,t){let n=new Set(e.split(`
`).flatMap(e=>B(V(e)[0].trim())===void 0?[...V(e)[0].replace(/^\s*&[A-Za-z_][A-Za-z0-9_]*/,``).matchAll(/&([A-Za-z_][A-Za-z0-9_]*)/g)].map(e=>e[1]):[])),r=[...t.cells.values()].filter(e=>!e.implicit&&!e.lambda&&!n.has(e.name)),i=[...[...t.cells.values()].filter(e=>(e.map?.kind===`midi`||e.sink)&&!e.implicit).map(e=>e.name),...r.filter(t=>!t.map&&!t.voice&&!t.step&&yv(e,t.name).length).map(e=>e.name)],a=[],o=/* @__PURE__ */ new Set,s=n=>{if(o.has(n))return;o.add(n);let r=yv(e,n);for(let i of r){let o=/^&([A-Za-z_][A-Za-z0-9_]*)$/.exec(i)?.[1],c=o?t.cells.get(o):void 0;if(c&&!c.voice&&!c.step&&yv(e,o).length){s(o);continue}let l=i.split(`*`).map(e=>e.trim()),u=l.filter(e=>e.startsWith(`&`));if(l.some(e=>!/^&[A-Za-z_][A-Za-z0-9_]*$/.test(e)&&!lv.test(e)))continue;let d=u.map(e=>t.cells.get(e.slice(1)));if(d.some(e=>!e))continue;let f=d.filter(e=>e.map?.kind===`amp`),p=d.filter(e=>e.map?.kind!==`amp`),m=p.filter(e=>e.voice),h={name:n,entries:r,entry:i};if(p.length===2&&m.length===1&&!f.length){let n=Sv(e,t,p.find(e=>!e.voice).name,m[0].name,h);n&&a.push(n);continue}if(p.length!==1||f.length>1)continue;let g=xv(e,t,p[0].name,f[0]?.name,h);g&&a.push(g)}};for(let e of i)s(e);for(let n of r){if(!n.over||!n.step||n.voice||n.map)continue;let r=Sv(e,t,n.name,null,{name:n.name,entries:[],entry:`&${n.name}`});r&&a.push(r)}return a}function xv(e,t,n,r,i){let a=qt(e,n),o=t.cells.get(n);if(!a||!o.step)return null;let s=t.cells.get(o.step.driver)?.meter??null,c=vv(o.step.tap,s),l=e=>!!t.cells.get(e.slice(1))?.voice,u=`steps`,d,f;if(a.braid.length===1&&cv.test(a.braid[0])){let[,e,t,n,r]=cv.exec(a.braid[0]);u=`euclid`,f={voice:`&${e}`,k:Number(t),n:Number(n),r:Number(r??0)};let i=new Set(_v(f.k,f.n,f.r));d=Array.from({length:f.n},(e,t)=>i.has(t)?[{voice:f.voice,own:null}]:[])}else a.braid.length===1&&sv.test(a.braid[0])?(u=`seq`,d=hv(Ut(sv.exec(a.braid[0])[1]))):d=hv(a.braid);if(!d?.length||d.some(e=>e.some(e=>!l(e.voice)))||u===`steps`&&d.length!==o.steps)return null;let p;if(r){let t=gv(qt(e,r)?.braid??[]);if(!t||t.length!==d.length)return null;p={cell:r,tokens:t}}let m=d.flatMap((e,t)=>e.map(e=>({step:t,voice:e.voice,own:e.own,level:Number(e.own??1)*Number(p?.tokens[t]??1)}))).filter(e=>e.level>0).sort((e,n)=>e.step-n.step||rv(t,e.voice)-rv(t,n.voice));return{name:`&${n}`,trigger:n,card:i,form:u,...f?{euclid:f}:{},...p?{levels:p}:{},steps:d.length,notes:m,stepWhole:c===null?null:u===`steps`?c:c/d.length,meter:s}}function Sv(e,t,n,r,i){let a=qt(e,n),o=t.cells.get(n);if(!a||!o.step)return null;let s=t.cells.get(o.step.driver)?.meter??null,c=Symbol(`held`),l=[],u=/* @__PURE__ */ new Map;for(let e of a.braid){let t=iv.exec(e),n=uv.exec(e),r=dv.exec(e);if(t)for(let e=0;e<Number(t[1]??1);e++)l.push(null);else if(n)for(let e=0;e<Number(n[2]??1);e++)l.push(Number(n[1]));else if(r&&Number(r[2])>=2)u.set(l.length,Number(r[2])),l.push(Number(r[1]),...Array(Number(r[2])-1).fill(c));else if(pv.test(e))l.push(e);else return null}if(!l.length||l.length!==o.steps)return null;let d=kd(t,n,gi(t)),f=[];for(let[e,t]of l.entries()){let n=d.filter(t=>Math.abs(t.step-e)<1e-9),i=u.get(e)??1;if(t===null||t===c?n.length:n.length!==1||Math.abs(n[0].duration-i)>1e-9)return null;if(t===null||t===c)continue;let a=n[0],o={written:t,sign:1,by:0,table:`${a.table}:${a.tableShift}`,value:a.value,alter:a.alter,transpose:a.transpose??0};f.push({step:e,voice:r===null?``:`&${r}`,own:null,level:1,pitch:o,...i>1?{hold:i}:{}})}return d.length===f.length?{name:`&${n}`,trigger:n,card:i,form:`steps`,steps:l.length,notes:f,stepWhole:vv(o.step.tap,s),meter:s,pitched:{table:o.over,voice:r===null?``:`&${r}`}}:null}let Cv=e=>e.own===null?e.voice:`${e.voice}:0:${e.own}`;function wv(e,t){let n=Array(e.steps).fill(`~`),r=/* @__PURE__ */ new Map;for(let i of t){if(!Number.isInteger(i.step))continue;for(let t=1;t<(i.hold??1);t++)i.step+t<e.steps&&(n[i.step+t]=null);let t=i.pitch?`${tv(i.pitch)}${i.hold?`@${i.hold}`:``}`:Cv(i),a=r.get(i.step);a?a.push(t):r.set(i.step,[t])}for(let[t,i]of r)t>=0&&t<e.steps&&n[t]!==null&&(n[t]=i.length===1?i[0]:`[${i.join(`,`)}]`);return n}function Tv(e,t,n,r=!1){let i=/* @__PURE__ */ new Map;if(!t.length){let t=e.card.entries.filter(t=>t!==e.card.entry);if(!t.length)return null;i.set(e.card.name,[`[${t.join(`, `)}]`])}if(e.euclid&&r){let{voice:t,k:n,n:r,r:a}=e.euclid;i.set(e.trigger,[`${t}(${n},${r},${(a+1)%r})`])}else{let n=wv(e,t).filter(e=>e!==null);i.set(e.trigger,e.form===`steps`?n:[`[${n.join(` `)}]`])}return e.levels&&n&&i.set(e.levels.cell,[...n]),i}let Ev=/* @__PURE__ */ `oscillator.tone.rests.semitones.twovoices.steps.clock.voice.effects.transpose.twinkle.chords.rhythm.drums.swing.breve.canon.mirrors.variations.chance.fifths.arrangement.stereo.waveforms.moving.style.grids.metronome.fm.musicbox.automaton.kalimba.sympathy.harmonograph.echotape.worn.dtmf.daytime.gate.play-in.midi-out.lullaby.jazz.funk.twelve.five.aksak.waltz.sailor.royal.pertonos.ricercar.korobeiniki.coltrane.bossa.bell.prelude.pachelbel.circle.pop.idm.alpha.studie.just.bwv847.acid.patchbay.zell.cellscape.cellscape2.baustelle.focus.hypercell.onemore.electroswing.spooky.kinderlied.radio.brothers.ghosts.tines.phase.in-c.tape.soundtape.testtones.forks.resonanz.fiveto12`.split(`.`),Dv={acid:`---
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
`,aksak:`---
title: "Aksak: twos and a three"
tags: [genre:world, rhythm]
description: "A 7/8 of two, two and three in D harmonic minor: the pairs swing, the three stays even, and the band is the library's."
---

An aksak ("limping", in Turkish) is a bar of unequal beats, twos and threes: 7/8 as 2 + 2 + 3, 9/8 as 2 + 2 + 2 + 3.
The library's meter takes the grouping as its argument, \`meter(grouping=meter("2+2+3"))\`; \`meter("7/8")\` alone is the family's 3 + 2 + 2.
Its bpm counts the beats, three a bar, the last half again as long as the others.

Swing it, and only the twos lean: of each pair of eighths the second comes late, while a group of three plays even (decision 071), as a band swinging a mixed meter does.
The beats never move, so the bar keeps its length and its limp.

\`\`\`cells
&swingNote label="swing=8n leans the pairs: in 2 + 2 + 3 the first two beats swing, the three stays even. The beats, the long one too, never move." about=&swing
&bar from meter(grouping=meter("2+2+3"), swing=&swing) &tempo
&tempo step=free(150bpm, 100..200)
&swing swing=8n:free(.6, 1/2..2/3)
\`\`\`

## The band

The drums are the library's 7/8 bar (\`aksak_drums\`), written in the meter's own counts, beats and pulses, so they lay themselves out in this grouping as in the family's 3 + 2 + 2.
The tune is the motif \`limp\`, the tonic, the fifth, then a run down to the tonic in the long beat; the form \`call_and_answer\` answers it two degrees down.
The bass plays the tonic on the first beat and the fifth on the long one.

\`\`\`cells
&kick, &ghost, &backbeat, &hat, &groove from aksak_drums
&key from harmonic_minor D
&limp from limp &key
&phrase from call_and_answer &call
&call step=8n &limp
&bassline over=&key step=beat 0 ~ 4
&hatNote label="The hat on every eighth: in the twos the second leans late, in the three all three are even." about=&hat
&limpNote label="limp: 0 ~ | 4 ~ | 3 2 0, its run in the three, which stays straight however hard the twos swing." about=&limp
\`\`\`

## The sound

\`\`\`cells
&bassV from upright_bass
&leadV from clarinet
&out map=sample postgain=1.93 [&groove, &bassline * &bassV * .6, &phrase * &leadV * .45]
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
&kick role=kick step=&drumBar &bd ~ &bd ~
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
&beat meter("12/8") step=free(100bpm, 70..140)      # four dotted-quarter beats
&bell label="{mode} · x.x.xx.x.x.x" scan(2 2 1 2 2 2 1) step=pulse*7/12            # seven strokes a bar, over the twelve pulses

&strokes step=&bell:pulse &gankogui &gankogui:0:.5 &gankogui:0:.7 &gankogui:0:.5 &gankogui:0:.6 &gankogui:0:.5 &gankogui:0:.7 # the bell, as a rhythm
&song over=&bell step=&bell:pulse 4 4 5 4 2 1 0 2 2 1 2 0 ~ ~ # … and as a scale: C major
&drums step=8n [&dundun,&shekere:0:.5] &shekere:0:.2 &shekere:0:.3 [&dundun:0:.5,&shekere:0:.5] &shekere:0:.2 &shekere:0:.3 [
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
&bar from meter free(128bpm, 90..170)
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
&bass part=bass tags="bass" step=&bassTime label="fugue · bass" &subject^$-12 &bass1 &bass2 &bass3 &bass4 &inBass &bass5

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
&pad part=pad tags="drone" over=&lydian step=&droneBar/8 label="drone: an open ninth" [0,4,6,9]
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

&pad part=pad over=&triad step=1m [0,1,2]
&arp over=&triad step=8n 0 1 2 3 2 1 0 1
&bass part=bass over=&power step=4n -2 -1 -2 -1

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
&bass part=bass step=2n -12 -7 -12 -5         # a step every two beats

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
&bar from meter(swing=&swing) &tempo
&tempo step=free(220bpm, 140..320)
&swing swing=8n:free(2/3, 1/2..3/4)
&key shift=-1 step=1m stride=-4                          # B, then G, then Eb, then B …

&line over=&key step=8n 0 2 4 7 3 7 10 13               # 1 2 3 5 · the next key's V7: 1 3 5 b7
&walk over=&key step=4n 0 4 3 10                         # root, third · the V7's root, its fifth
&comp over=&key step=2n [4,11] [7,13]                    # the maj7 shell · the V7 shell
&ride step=8n &cym:0:.9 ~ &cym:0:.6 &cym:0:.5 &cym:0:.9 ~ &cym:0:.6 &cym:0:.5

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
&bass part=bass step=4n 0 0 7 0 2 2 9 2
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
&bass, &bassOut from bass_performer(bassLevel=&bassLevel, bassV=&bassV) &bassline
&stab, &stabOut from stab_performer(stabLevel=&stabLevel, keysV=&keysV) &stabline
&leadOut from lead_performer(leadLevel=&leadLevel, leadV=&leadV) &leadline
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
&lead part=lead map=role &leadOut &lead2
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
&keysV from brass_stab
&leadV from clarinet
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
&bar from meter(grouping=meter("5/4"), swing=&swing) &tempo # five beats
&tempo step=free(172bpm, 120..220)
&swing swing=8n:free(2/3, 1/2..3/4)                # swung eighths, as in the blues: the share free
&penta scan(3 2 2 3 2)                             # Eb Gb Ab Bb Db (the voices sit on Eb)
&harmony step=4n 0!3 -5!2                          # 3 + 2: the minor chord for three beats, the minor fifth for two

&call 4 3 2@2 0 ~ 1 2 ~@2                          # one bar of swung eighths
&tune over=&penta step=8n &call &call^1 &call 4 ~ 3 2 0@6 # the call, answered a step up the scale

&walk step=4n 0 3 7 -5 -2                          # a bass that walks the 3 + 2
&comp step=8n [0,3,7]@3!2 [0,3,10]@3 [0,3,10]
&ride step=8n &cym:0:.9 ~ &cym:0:.6 &cym:0:.5 [&cym:0:.9,&click:0:.7] ~ &cym:0:.6 &cym:0:.5 [&cym:0:.8,&click:0:.5] &cym:0:.4 # the ride, and a click on 3 and 5: the seams of 3 + 2

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
`,funk:`---
title: "Funk: the sixteenths lean"
tags: [rhythm, modal]
description: "A funk vamp in E dorian, its sixteenths leaning a little and its eighths straight: swing a level finer than jazz's, from the library's band."
---

Jazz swings the eighths, hard, near two thirds ([Swing: the long and the short](swing.md)); funk swings the sixteenths, lightly, and keeps its eighths straight.
It is the same lean, written at a finer level: \`swing=16n:.58\` moves the second sixteenth of each eighth a little late, and leaves every eighth where it is.
The share is a slider, from straight (1/2) to a triplet's (2/3).
In the Groove MIDI Dataset's drummers (#19, [the measurements](../docs/notes/groove-measure.md)), the funk performances that swing their sixteenths do so at .56 to .63, a median of .60, and the New Orleans ones at .56 to .59; most funk is played straight.

\`\`\`cells
&swingNote label="swing=16n: the sixteenths lean, the second of each pair this share of the way through its eighth (1/2 straight). The eighths stay straight: the level is the difference from jazz's swing=8n:2/3." about=&swing
&bar from meter(swing=&swing) &tempo
&tempo step=free(100bpm, 80..120)
&swing swing=16n:free(.58, 1/2..2/3)
\`\`\`

## The band

The drums are the library's, Jambot's Funk bar (\`funk_drums\`), and so is the bass (\`funk_bass\`), over a vamp from the library: four bars of E minor, four of A major, the dorian's IV (\`vamp_to_the_fourth\`).
Each taps the meter by the sixteenth, so each leans as the meter does.

\`\`\`cells
&kick, &backbeat, &fill, &ghost, &hat, &euclid, &euclidLevel, &groove from funk_drums
&key from diatonic(mode=dorian) E
&harm from vamp_to_the_fourth &key
&bassline from funk_bass &harm
&hatNote label="The hats on the e and the a of each beat (the second sixteenth of an eighth) come a little late; those on the beats and the ands are straight." about=&hat
\`\`\`

## The guitar

A chord scratched on the sixteenths, its third and its fifth: most of its strokes are on the e and the a, so they lean; the stab on the and of four is an eighth, and keeps its place.

\`\`\`cells
&chank over=&harm step=16n ~ [1,2] ~ [1,2] [1,2] ~ [1,2] ~ ~ [1,2] ~ [1,2] ~ ~ [1,2] ~
&chankNote label="Swing the eighths instead (&swing swing=8n:2/3) and this is a shuffle: the sixteenths then fall even within each long and short eighth, and the funk is gone." about=&chank
&bassV from upright_bass
&guitar s=square loop=C4 lpf=2200 env=&(map=adsr .002 .06 0 .03)
&out map=sample postgain=2.72 [&groove, &bassline * &bassV * .6, &chank * &guitar * .25]
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
&pad part=pad over=&lydian step=1m/2 [0,2,4,6] [1,3,5,7]   # the chord, I then II
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
# A 12-bar blues in C, swung. The bar leans its eighths, long, short: the second of each pair
# at a share of its beat that is free (1/2 straight, 2/3 the triplet swing, 3/4 hard). Two scales, both scans:
# the blues scale for the riff, the minor pentatonic for the turnaround.
&bar from meter(swing=&swing) &tempo
&tempo step=free(132bpm, 80..220)
&swing swing=8n:free(2/3, 1/2..3/4)                    # two eighths a beat: long, short

&blues scan(3 2 1 1 3 2)                               # C Eb F F# G Bb
&penta scan(3 2 2 3 2)                                 # C Eb F G Bb
&changes step=1m 0!4 5!2 0!2 7 5 0 7                   # I I I I · IV IV I I · V IV I V, a bar each

&riff 0 1 2 3 4 ~ 5 4 ~ ~ 2 1 0 ~@3                    # two bars — it stays put over the IV, as a blues riff does
&turn over=&penta 3 ~ 4 3 2 1 0 ~ 2 ~@3 1 0 ~ ~ 0 ~ 1 2 3 ~ 5 ~ 4 3 2 1 0@4
&lick over=&blues step=8n &riff!4 &turn

&walk step=4n 0 4 7 10                                 # root, 3rd, 5th, flat 7th — moved by the changes
&comp step=8n ~@3 [4,10] ~@3 [4,10]                    # shells (3rd and 7th) on the and of 2 and 4
&ride step=8n &cym:0:.9 ~ &cym:0:.6 &cym:0:.5 &cym:0:.9 ~ &cym:0:.6 &cym:0:.5 # ding, ding-a ding, ding-a

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
description: Twinkle and Hänschen klein, each tune's lines its own parts, each tune's shape a form, over a vamp of two chords, a root bass and the plainest beat.
parts:
  twinkle:
    association:
      - point:
          sync: 0.1
          harm: 0.12
          bite: 0.5
          mood: 0.95
        weight: 1
        facet: motif
  wonder:
    association:
      - point:
          sync: 0.1
          harm: 0.12
          bite: 0.4
          mood: 0.95
        weight: 1
        facet: motif
  haenschen:
    association:
      - point:
          sync: 0.1
          harm: 0.12
          bite: 0.7
          mood: 0.95
        weight: 1
        facet: motif
  hinein:
    association:
      - point:
          sync: 0.1
          harm: 0.12
          bite: 0.6
          mood: 0.95
        weight: 1
        facet: motif
  heim:
    association:
      - point:
          sync: 0.1
          harm: 0.12
          bite: 0.55
          mood: 0.95
        weight: 1
        facet: motif
  weinet:
    association:
      - point:
          sync: 0.1
          harm: 0.12
          bite: 0.7
          mood: 0.95
        weight: 1
        facet: motif
---

Two children's songs, the kind a learner plays first, made of the seed library's pieces.
Each tune is its lines, each a motif of one bar and a part this file gives (decision 082): Twinkle's call \`&twinkle\` and its answer \`&wonder\`; Hänschen klein's call \`&haenschen\`, its open answer \`&hinein\`, its close \`&heim\` and its bridge \`&weinet\`. Another piece takes one by its head, over its own key: \`&twinkle from kinderlied &key\`.
Each tune's shape is a form: Twinkle's is \`ternary\`, A B A, its bridge the answer a step up; Hänschen klein's is \`rounded_binary\`, A A′ B A′.
The band is the library's too: the plainest beat, \`kinderlied_drums\` (the kick on one and three, the snare on two and four, a closed hat on every beat), a vamp of two chords, the tonic for four bars and the fifth for four, and the root bass under it.

\`\`\`cells
&bar from meter &tempo
&tempo step=free(100bpm, 80..120)
&key from diatonic(mode=ionian) C
&harm from vamp_to_the_fifth &key
&bassline from root_bass &harm
&drums, &drumsOut from drums_performer &drumlines
&bass, &bassOut from bass_performer(bassV=&bassV) &bassline
&leadOut from lead_performer(leadV=&leadV) &leadline
&kick, &backbeat, &hat from kinderlied_drums
&drumlines [&kick, &backbeat, &hat]
&bandNote label="The band: the Kinderlied beat, a vamp of the tonic and the fifth, the root bass, all from the library." about=(&drumlines &harm &bassline)
\`\`\`

## The tunes, in pieces

Each tune is a part of this file: its signature (\`&twinkle from &key\`), then its line, a bar of eighths over the key. Opened, the piece plays them over its own \`&key\`; taken, a part plays over the key the taking line gives.
The forms put them together: \`ternary\` takes Twinkle's call and names its answer, and makes its bridge of the answer a step up, *up above the world so high*; \`rounded_binary\` takes Hänschen klein's call and names its open answer, its close and its bridge, which it plays twice, the second time a step up, *hat ja nun kein Hänschen mehr*.

\`\`\`cells
&twinkle from &key
&twinkle over=&key step=8n 0 0 4 4 5 5 4@2
&wonder from &key
&wonder over=&key step=8n 3 3 2 2 1 1 0@2
&haenschen from &key
&haenschen over=&key step=8n 4 2 2@2 3 1 1@2
&hinein from &key
&hinein over=&key step=8n 0 1 2 3 4 4 4@2
&heim from &key
&heim over=&key step=8n 0 2 4 4 0@4
&weinet from &key
&weinet over=&key step=8n 1 1 1 1 1 2 3@2
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
&bass part=bass over=scale(minor, A) step=2n 0 5 3 4
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
&bar meter("3/4") step=&tempo motor=6 mass=1.2 friction=.4 wind=36
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
&key from diatonic(mode=minor) &tonic
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
&bar from meter(grouping=meter("3/4")) &tempo
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
description: "A score the default band plays, its style drifting by itself: bite as three rates summed, within a window a hand sets; syncopation and harmony left to sliders. The band's instruments follow."
---

A radio station written in cells (#576): a score whose section's style, \`&style\`, moves by itself.
The score is the default band's: it ends in \`* from band(…)\`, passing the band its five parts and its style, and the band's instruments read \`&style\` where they sound, the bass's and the lead's cutoffs and the keys' and the pad's envelopes with bite, from paddy to stabby.

Bite drifts, moved by a cell within a window a hand sets (decision 079): its centre and its reach, \`bite=free(.55, 0..1) ± free(.35, 0..0.5) * &drift\`, the window .2 to .9.
The centre is where the station is tuned; the reach is how far it may wander, decision 076's entropy on this axis.
The drift is three sample-and-holds summed (decision 079), each a value drawn afresh each step and held for it: once a section of eight bars, once a song of 32, once a set of 128, weighted .5, .3 and .2, so it moves most from section to section and least over a set, as music's slow fluctuations do.
So the band plays the section's style and moves on at the next one: the bass and the lead bite or close, the keys strike or swell.
Syncopation and harmony are left to sliders (\`free(…)\`), for a hand to set, and mood is held at .5, dorian's at a little more tension than its default.

\`\`\`cells
&slidersNote label="The style: syncopation and harmony on sliders, bite drifting a section at a time." about=&style
&bar from meter &tempo
&tempo step=104bpm
&key from "diatonic(mode=dorian)" D
&harm over=&key step=1m [0,2,4] [3,5,7]
&kick role=kick step=4n &bd &bd &bd &bd
&drumlines [&kick]
&bassline over=&harm step=8n 0 ~ 0 2 ~ 0 4 ~
&padline over=&harm step=1m [0,1,2]
&stabline over=&harm step=2n ~ [0,2,4]
&leadline over=&key step=8n 4 ~ 3 2 0@4
&mine map=style sync=free(.3, 0..1) harm=free(.45, 0..1) bite=free(.55, 0..1) ± free(.35, 0..0.5) * &drift mood=.5
&drift [&section * .5 + &song * .3 + &set * .2]
&section step=1m/8 [0|.25|.5|.75|1]
&song step=1m/32 [0|.25|.5|.75|1]
&set step=1m/128 [0|.25|.5|.75|1]
&style style=&mine
* from band(drumlines=&drumlines, bassline=&bassline, padline=&padline, stabline=&stabline, leadline=&leadline, style=&style)
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
&pad part=pad over=&minor step=1m/2 label="the pad" [0,2,4] [-2,0,2]
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
&bass, &bassOut from bass_performer(bassLevel=&bassLevel, bassV=&bassV) &bassline
&pad, &padOut from pad_performer(padLevel=&padLevel, padV=&padV) &padline
&stab, &stabOut from stab_performer(stabLevel=&stabLevel, keysV=&keysV) &stabline
&leadOut from lead_performer(leadLevel=&leadLevel, leadV=&leadV) &leadline
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
&padV from organ
&keysV s=sine loop=C5 env=&(map=adsr .002 .7 0 .5)
&leadV from theremin
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
`,style:`---
title: "Style: a point the voices read"
tags: [tutorial, sound, harmony]
tier: 6
description: "Two styles, one by name and one in order, and the section's style turning between them: the bass bites as the style grows stabby, the lead darkens as its mood does."
---

A style is a point: where the accents fall (\`sync\`), how the harmony moves (\`harm\`), how notes start and end (\`bite\`, paddy to stabby) and the mood (\`mood\`, darker to brighter).
A \`map=style\` cell writes one, its axes by name (in order, \`.3 .3 .9 .2\`, reads the same); it doesn't sound, a voice reads it.
\`&style\` is the section's style, and a voice reads one of its axes by name, \`&style[bite]\`, as a factor of a moving parameter.
The tune turns the minor scale's i, VI, III and VII, a bar each, and the bass plays their roots.

\`\`\`cells
&bar from meter &tempo
&strike from envelopes
&tempo step=free(112bpm, 90..140)
&calm map=style sync=.1 harm=.3 bite=.1 mood=.9 label="Calm: on the beat, paddy, bright"
&tense map=style sync=.3 harm=.3 bite=.9 mood=.2 label="Tense: stabby and dark"
&style style=&calm..&tense * &turn
&turn map=lin step=1m 0 .25 .5 .75 1 .75 .5 .25
&styleNote label="&style turns between the two styles as &turn says, and &style[bite] and &style[mood] read one axis each: the bass's cutoff opens as the style grows stabby, the lead's closes as its mood darkens." about=(&bassV &leadV)
&key scan(2 1 2 2 1 2 2)
&tune over=&key step=8n 4 ~ 2 4 7 4 2 0
&root over=&key step=1m 0 5 2 6
&bassV s=saw loop=A1 lpf=250..1600 * &style[bite] lpq=6 env=&strike
&leadV s=tri loop=A3 lpf=500..4000 * &style[mood] env=&(map=adsr .01 .2 .6 .2)
&out map=sample postgain=2 [&tune * &leadV * .4, &root * &bassV * .5]
\`\`\`
`,swing:`---
title: "Swing: the long and the short"
tags: [tutorial, rhythm]
tier: 4
description: "A jazz swing in F: the meter leans its eighths, a slider from straight to hard, and every line that taps it swings."
---

Swing is the meter's: \`swing=8n:2/3\` leans one level of it, the eighths, and every line that taps the meter plays through it.
Of each pair of eighths the second starts a share of the way through their beat: 1/2 is straight, 2/3 the triplet swing, 3/4 hard.
The beats never move, nor the bar line: only the second eighth of each beat does.
The share here is a slider, 2/3 to start: in the Groove MIDI Dataset (#19, [the measurements](../docs/notes/groove-measure.md)), the jazz drummers who swing their eighths do so at .59 to .71, a median of .65, mostly a little short of the triplet.

\`\`\`cells
&swingNote label="swing=8n: the eighths lean. Of each pair, the second starts this share of the way through the beat: 1/2 straight, 2/3 the triplet swing, 3/4 hard. Jazz drummers swing theirs at .59 to .71, a median of .65 (Groove, #19)." about=&swing
&bar from meter(swing=&swing) &tempo
&tempo step=free(160bpm, 100..240)
&swing swing=8n:free(2/3, 1/2..3/4)
\`\`\`

## The band

The drums are the library's, Jambot's Swing jazz bar (\`swing_jazz_drums\`): the ride's ding, ding-a ding, ding-a, the pedal hat on two and four, a kick on one, the snare on four with a little fill.
The bass is the library's walking bass (\`walking_bass\`), a note on every beat, over a ii–V–I in F: G minor, C seventh, two bars of F, each chord with its seventh.
Both tap the meter, so both swing; neither writes a swing of its own.

\`\`\`cells
&kick, &backbeat, &fill, &ghost, &hat, &pedal, &groove from swing_jazz_drums
&key from diatonic F
&harm over=&key step=1m [1,3,5,7] [4,6,8,10] [0,2,4,6]!2
&bassline from walking_bass &harm
&rideNote label="The ride's ding-a: its a is the second eighth of beat four, tapped as a sixteenth (step=16n). A sixteenth is even within its eighth, so it falls where the swung eighth does: it leans." about=&hat
&beatNote label="The walk is on the beats, step=4n: the beats never move, however hard the swing. Nor does the pedal hat on two and four." about=(&bassline &pedal)
\`\`\`

## What leans, and what doesn't

The piano comps on the swung eighths: a shell of the chord, its third and its seventh, on the and of two and on four.
The head is in quarters, a pair of eighths in a beat as \`[a b]\` and a triplet as \`[a b c]\`: the pair leans, the triplet stays in its beat, even, since a triplet divides the beat and not the eighth.

\`\`\`cells
&comp over=&harm step=8n ~ ~ ~ [1,3] ~ ~ [1,3] ~
&head over=&key step=4n ~ [1 3] 5 [4 3] [2 3] 4 [6 4 3] 1 2@2 ~ [0 2] 4 [3 2 1] 0@2
&compNote label="The and of two is a second eighth: it leans late with the swing. Four is a beat: it stays." about=&comp
&headNote label="[1 3] is a pair of eighths in a beat: the second leans. [6 4 3] is a triplet in a beat: three even thirds, whatever the swing." about=&head
\`\`\`

## The sound

\`\`\`cells
&bassV from upright_bass
&keys s=sine loop=C4 env=&(map=adsr .005 .3 .2 .2)
&horn s=saw loop=C4 lpf=1600 room=.3 env=&(map=adsr .02 .15 .6 .12)
&out map=sample postgain=2.13 [&groove, &bassline * &bassV * .6, &comp * &keys * .3, &head * &horn * .4]
\`\`\`

Swing a level finer and it is funk's: [Funk: the sixteenths lean](funk.md) leans the sixteenths, lightly, and leaves the eighths straight.
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
&key from diatonic(mode=minor) &tonic
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
`,twelve:`---
title: "Twelve-eight: the lean of three"
tags: [genre:blues, rhythm]
description: "A slow blues in 12/8, four beats of three eighths: swing leans nothing here, so a bend leans each three, long, short, short."
---

12/8 is a compound meter: four beats a bar, each a dotted quarter of three eighths, and its bpm counts the beats.
Swing leans pairs, and keeps a group of three even (decision 071): \`swing=8n:2/3\` on 12/8 leans nothing, and says so.
A three leans by a bend instead (decision 080): \`bend=8n:&lean\` gives the eighths the table's numbers as their lengths, in turn, so \`&lean 4 3 3\` plays each three long, short, short, and every beat keeps its length.
Its depth, after a second colon, is a slider: 0 even, 1 as written, 2 the lengths squared (16 : 9 : 9).

\`\`\`cells
&leanNote label="A lean of three: the eighths of each beat take the lengths 4, 3 and 3, long, short, short; the beats never move. Its depth: 0 even, 1 as written, 2 twice as far." about=&lean
&bar meter("12/8") step=&tempo bend=8n:&lean:free(1, 0..2)
&tempo step=free(60bpm, 45..80)
&lean 4 3 3
\`\`\`

## The band

The drums are the library's 12/8 bar (\`twelve_eight_drums\`): the kick on one and three and the snare on two and four, tapping the beats (\`step=beat\`), and the ride on every eighth, the first of each three the loudest.
The harmony is the library's twelve-bar blues (\`twelve_bar\`), in C mixolydian, every chord a seventh.
The bass is the motif \`shuffle\`, the library's slow blues line in 12/8, read over the chord in force rather than the key: root, fifth, seventh, octave, and back.
The piano plays the chord on every eighth, the slow blues' triplets, and leans with the ride.

\`\`\`cells
&kick, &backbeat, &hat, &groove from twelve_eight_drums
&key from diatonic(mode=mixolydian) C
&harm from twelve_bar &key
&bassline from shuffle &harm
&comp over=&harm step=8n [1,2,3]
&shuffleNote label="shuffle, read over the chord (&harm): 0 2 3 4 is the root, the fifth, the seventh and the octave, long and short over each beat." about=&bassline
&compNote label="The chord on every eighth: under the bend each three is long, short, short." about=(&comp &hat)
\`\`\`

## The sound

\`\`\`cells
&bassV from upright_bass
&keys s=tri loop=C4 env=&(map=adsr .005 .25 .2 .2)
&out map=sample postgain=2.59 [&groove, &bassline * &bassV * .6, &comp * &keys * .2]
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
&bass part=bass step=16n ~@32 &low

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
&bass part=bass step=4n 0 0 7 0 2 2 9 2

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
&key from diatonic(mode=minor) &tonic
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
`},Ov=Object.fromEntries(Ev.map(e=>{let t=Dv[e];if(t===void 0)throw Error(`examples/${e}.md is missing`);let n=lr(t);if(`problems`in n)throw Error(`examples/${e}.md: ${n.problems.map(e=>`line ${e.line}: ${e.message}`).join(`; `)}`);return[e,{source:n.text,file:t}]})),kv=[`meters`,`rhythms`,`bass`,`harmony`,`instruments`,`expression`,`modes`,`performers`,`stab`,`motifs`,`forms`,`bands`,`styles`,`modules`],Av=Object.entries(Ov).flatMap(([e,t])=>{let n=lr(t.file),r=`problems`in n?void 0:n.frontmatter.parts;return!r||typeof r!=`object`||Array.isArray(r)?[]:Object.entries(r).map(([n,r])=>{let i=Jo(t.source,n);if(i===null)throw Error(`examples/${e}.md: its frontmatter keys a part &${n}, and no signature names it`);let a={id:`${e}/${n}`,text:i,association:r?.association??[]},o=Ep(a);if(o.length)throw Error(`examples/${e}.md, part &${n}: ${o.join(`; `)}`);return a})}),jv=[...kv.flatMap(e=>qp(e)),...Av],Mv=e=>jv.filter(t=>t.association.some(t=>t.facet===e)),Nv=/^[^(/]+\/[^(]+$/,Pv=e=>Nv.test(e)?e.slice(0,e.indexOf(`/`)):e,Fv=e=>Nv.test(e)?e.slice(e.indexOf(`/`)+1):e;function Iv(e){if(!Nv.test(e))return[];let t=Pv(e),n=Ov[t]?.source;if(n===void 0)return[];let r=e=>{let n=/^&(\w+)$/.exec(e)?.[1],r=n===void 0?void 0:`${t}/${n}`;return r!==void 0&&Av.some(e=>e.id===r)?r:e};return Yo(n,Fv(e)).map(e=>({id:e.id,args:Object.fromEntries(Object.entries(e.args).map(([e,t])=>[e,r(t)]))}))}let Lv=/* @__PURE__ */ new Map([[`core kit`,`&bd, &rim, &sd, &cp, &lt, &hh, &ph, &mt, &oh, &ht, &cr, &rd, &claves from gm_kit`],[`gm kit`,`* from gm_kit`]]),Rv=new Map([...Gp.map(e=>[e.fragment.id,e.fragment.text]),...jv.map(e=>[e.id,e.text])]),zv=[...Ro].map(([e,t])=>[e,Rv.get(t)]),Bv=Object.entries(Ov).map(([e,t])=>[e,t.source]),Vv=new Map([...Bv,...Rv,...zv,...Lv]),Hv=e=>Vv.get(e)??null,Uv=Mv(`motif`),Wv=Mv(`form`),Gv=e=>`&bar meter("${e}") step=120bpm\n&key scale(ionian, C)`,Kv=e=>`${Math.round(e.at*1e6)}:${e.degree}:${e.alter}`,qv=(e,t)=>e.length===t.length&&e.every((e,n)=>Kv(e)===Kv(t[n]));function Jv(e,t,n){let r=Hf(`${Gv(n)}\n${e}`,void 0,{resolve:Hv});if(!r.ok)return null;let i=r.cells.get(t),a=r.cells.get(`bar`)?.meter??null;if(!i?.step||!a)return null;let o=vv(i.step.tap,a);if(o===null)return null;let s=gi(r),c=[];for(let e of kd(r,t,s)){if(e.table!==`key`)return null;let{value:t,alter:n}=Ad(r,e,s);c.push({at:e.step*o,degree:t+0,alter:n+0})}return{notes:c.sort((e,t)=>e.at-t.at||e.degree-t.degree),lap:i.steps*o,bar:a.pulses/a.unit}}let Yv=e=>`${e.degree}${(e.alter>0?`#`:`b`).repeat(Math.abs(e.alter))}`;function Xv(e,t,n){let r=Math.round(n*8),i=t.map(e=>e.at*8);if(i.some(e=>Math.abs(e-Math.round(e))>1e-6))return null;let a=i.map(Math.round);if(new Set(a).size!==a.length)return null;let o=[];return a[0]>0&&o.push(a[0]>1?`~@${a[0]}`:`~`),a.forEach((e,n)=>{let i=(a[n+1]??r)-e;o.push(i>1?`${Yv(t[n])}@${i}`:Yv(t[n]))}),`&${e} over=&key step=8n ${o.join(` `)}`}let Zv=(e,t,n)=>e.filter(e=>e.at>=t-1e-9&&e.at<t+n-1e-9).map(e=>({...e,at:e.at-t})),Qv=/* @__PURE__ */ new WeakMap;function $v(e,t){let n=Qv.get(e)??/* @__PURE__ */ new Map;return Qv.set(e,n),n.has(t)||n.set(t,e.flatMap(e=>{let n=Jv(`&${Fv(e.id)} from ${Pv(e.id)} &key`,Fv(e.id),t);return n?[{id:e.id,...n}]:[]})),n.get(t)}function ey(e){let t=/^&(\w+) from (?:\(([^)]*)\) )?&(\w+)\s*$/m.exec(e.text);if(!t)return null;let n=(t[2]??``).split(`,`).map(e=>e.trim().replace(/^&/,``)).filter(Boolean);return{head:t[1],helpers:n,hole:t[3]}}function ty(e,t,n,r={}){let i=r.forms??Wv,a=r.motifs??Uv,o={text:e,form:null,call:null,helpers:{},structure:Q_(e).total},s=Jv(e,t,n);if(!s||s.notes.length===0)return o;let{notes:c,lap:l,bar:u}=s,d=Math.round(l/u);if(Math.abs(l-d*u)>1e-9||d<2)return o;let f=$v(a,n),p=(e,t)=>f.find(n=>Math.abs(n.lap-t)<1e-9&&qv(n.notes,e))?.id??null,m=(e,t,n)=>{let r=p(e,t);if(r)return{name:Fv(r),text:`&${Fv(r)} from ${Pv(r)} &key`,id:r};let i=Xv(n,e,t);return i?{name:n,text:i,id:null}:null},h=o;for(let e of i){let r=ey(e);if(r)for(let i=1;i<=d;i++){let a=d/i*u;if(d%i!==0)continue;let o=m(Zv(c,0,a),a,`${t}Call`);if(!o)continue;let s=r=>{let i=[o.text,...r.map(e=>e.text)],a=r.length?`(${r.map(e=>`${e.param}=&${e.name}`).join(`, `)})`:``,s=[...new Set(i),`&${t} from ${e.id}${a} &${o.name}`].join(`
`);return{text:s,read:Jv(s,t,n)}},f=/* @__PURE__ */ new Map;for(let e of r.helpers){let n=s([{name:`${t}Probe`,param:e,text:`&${t}Probe over=&key step=8n ${`40 `.repeat(Math.round(a*8)).trim()}`}]).read?.notes.find(e=>e.degree>=30)?.at;n!==void 0&&f.set(e,n)}let p=r.helpers.filter(e=>f.has(e));for(let n=0;n<1<<p.length;n++){let r=p.filter((e,t)=>n&1<<t).map(e=>{let n=m(Zv(c,f.get(e),a),a,`${t}${e[0].toUpperCase()}${e.slice(1)}`);return n?{...n,param:e}:null});if(r.some(e=>e===null))continue;let{text:i,read:u}=s(r);if(!u||Math.abs(u.lap-l)>1e-9||!qv(u.notes,c))continue;let d=Q_(i).total;d<h.structure&&(h={text:i,form:e.id,call:o.id,helpers:Object.fromEntries(r.map(e=>[e.param,e.id])),structure:d})}}}return h}function ny(e,t,n){let r=e.map(e=>e*t);for(let[e,t]of n)r[e]+=t;return r}function ry(e,t){let n=Math.max(...e);return n>0?e.map(e=>(e/n)**t):e.map(()=>1)}tm-1;let iy={mashing:12,fewest:3,widest:19,forgetAfter:16};new Set(Object.values(I).map(e=>L(e)));function ay(e,t=/* @__PURE__ */ new Set){let n=e=>e.degrees.filter(e=>e!==null).length,r=e=>e.confidence??1,i=e=>+!!t.has(e),a=null;for(let t of e)t.kind===`motif`&&(a===null||i(t)>i(a)||i(t)===i(a)&&(r(t)>r(a)||r(t)===r(a)&&n(t.motif)>n(a.motif)))&&(a=t);return a}let oy=.85,sy=oy**(iy.forgetAfter+.5);function cy(e,t,n){let r=ny(e.map(e=>e.weight),oy,[]),i=e.map((e,t)=>({...e,weight:r[t]})).filter(e=>e.weight>=sy),a=[...i],o=[],s=[],c=/* @__PURE__ */ new Set;for(let e of t){if(e.kind!==`motif`)continue;let t=-1,r=null;for(;r===null&&++t<i.length;)r=ve(e.motif,i[t].motif);if(r!==null){let{source:n,bar:a}=i[t];s.push({source:e.source,of:{source:n,bar:a},op:r}),c.add(e)}else t=a.findIndex((t,n)=>n>=i.length&&ve(e.motif,t.motif)),t===-1&&(t=a.push({motif:e.motif,source:e.source,bar:n,weight:0,heard:0})-1);o.some(([e])=>e===t)||o.push([t,1])}let l=ny(a.map(e=>e.weight),1,o),u=new Set(o.map(([e])=>e));return{memory:a.map((e,t)=>({...e,weight:l[t],heard:e.heard+ +!!u.has(t)})),recognised:s,confirmed:c}}let ly={initial:{offer:null,lastPlayed:null,memory:[]},advance({bar:e},t,{judgements:n,forget:r}){let{offer:i,lastPlayed:a}=t,o=null;r&&i&&(i=null,o=`asked`);let{memory:s,recognised:c,confirmed:l}=cy(t.memory,n,e);if(n.length>0){a=e;let t=ay(n,l),r=i!==null&&s.some(e=>e.heard>=2&&ve(i.motif,e.motif)!==null);t&&(l.has(t)||!r)&&(i={motif:t.motif,source:t.source,bar:e,level:t.level})}else i&&a!==null&&e-a>iy.forgetAfter&&(i=null,o=`silence`);return{carried:{offer:i,lastPlayed:a,memory:s},output:{bar:e,judgements:n,offer:i,forgot:o,recognised:c}}}},uy=iy.fewest;function dy(e,t){let n=/* @__PURE__ */ new Map;for(let{step:t,note:r}of e)(!n.has(t)||r>n.get(t))&&n.set(t,r);let r=[...n.entries()].sort(([e],[t])=>e-t);if(!r.length)return[];let i=ze(t),a=Te(i,r[0][1]).degree;return r.map(([e,t])=>{let{degree:n,accidental:r}=Te(i,t);return{step:e,degree:n-a,alter:r}})}let fy=e=>e.map(e=>`${e.step}:${e.degree}:${e.alter}`).join(` `);function py(e,t){let n=e=>`${e.step}:${e.degree}:${e.alter}`,r=/* @__PURE__ */ new Map;for(let t of e)r.set(n(t),(r.get(n(t))??0)+1);let i=0;for(let e of t){let t=n(e);(r.get(t)??0)>0&&(r.set(t,r.get(t)-1),i++)}return e.length+t.length-2*i}function my(e,t){return hy(e).flatMap(e=>Array.from({length:Math.ceil(e.length/4)},(n,r)=>_y(gy(e.slice(r*4,(r+1)*4)),t)))}function hy(e){let t=[...e].filter(e=>e.notes.length>=uy).sort((e,t)=>e.bar-t.bar),n=[];for(let e of t){let t=n.at(-1),r=t?.at(-1);t&&r&&e.origin!==void 0&&r.origin!==void 0&&e.bar===r.bar+1?t.push(e):n.push([e])}return n}function gy(e){let t=(e,t)=>e.origin===t.origin&&py(e.notes,t.notes)<=2,n=[...Array(e.length).keys()].map(e=>e+1).find(n=>e.length%n===0&&e.every((r,i)=>i<n||t(r,e[i-n])))??e.length;return e.slice(0,n).map((t,r)=>e.filter((e,t)=>t%n===r).reduce((e,t)=>(t.confidence??1)>(e.confidence??1)?t:e,t))}function _y(e,t,n=0){let r=e[0].origin??0;return e.flatMap((e,i)=>e.notes.map(a=>({...a,step:a.step+i*t,degree:a.degree+(e.origin??0)-r+n})))}function vy(e,t,n){let r=[{tap:`1m`,size:n},{tap:`2n`,size:8},{tap:`4n`,size:4},{tap:`8n`,size:2},{tap:`16n`,size:1}].find(r=>t%r.size===0&&n%r.size===0&&e.every(e=>e.step%r.size===0)),i=new Map(e.map(e=>[e.step,e])),a=e=>`${e.degree}${(e.alter>0?`#`:`b`).repeat(Math.abs(e.alter))}`,o=Array.from({length:t/r.size},(e,t)=>i.has(t*r.size)?a(i.get(t*r.size)):`~`);return`&lead over=&key step=${r.tap} ${o.join(` `)}`}function yy(e,t,n){let r=gy(e),i=r[0]?.origin;if(r.length<2||r.length>8||i===void 0)return null;let a=_y(r,t),o=ty(vy(_y(r,t,(i%7+7)%7),r.length*t,t),`lead`,n);return o.form===null?null:{notes:a,text:o.text}}function by(e,t,n){let r=hy(e).flatMap(e=>{let r=n===void 0?null:yy(e,t,n);return r?[r]:my(e,t).map(e=>({notes:e}))}),i=/* @__PURE__ */ new Map;for(let e of r){let t=e.text??fy(e.notes),n=i.get(t);n?n.count++:i.set(t,{count:1,first:e})}let a=e=>Math.floor(e.notes.at(-1).step/t),o=null;for(let e of i.values())(!o||e.count>o.count||e.count===o.count&&a(e.first)>a(o.first))&&(o=e);return o?o.first:null}let xy=`lead`;function Sy(e,t,n,r,i,a=[],o=[],s){return zm(e,Cm(t),n,r,(e,t)=>e!==null&&(e.bars===1||e.bars<=8&&(i?.filed.some(e=>e.fragment.id===t)??!1)),i,a,o,s)}function Cy(e,t){let n=[...e].sort((e,t)=>e.step-t.step),r=n.length===0||n[0].step>0;return{cycle:t,onsets:[...r?[0]:[],...n.map(e=>e.step)],degrees:[...r?[null]:[],...n.map(e=>e.degree)],accidentals:[...r?[0]:[],...n.map(e=>e.alter)]}}function wy(e,t,n,r,i,a){let o=t===void 0?null:e.read(t,n,i);if(!o||!o.notes.length||o.bars>8)return null;if(o.bars>1)return Array.from({length:o.bars},(e,t)=>Cy(o.notes.filter(e=>e.step>=t*r&&e.step<(t+1)*r).map(e=>({...e,step:e.step-t*r})),r));let s=e.phrase?.(o.notes,n,a&&Cm(a),t);return!s||s.bars<2?[Cy(o.notes,r)]:Array.from({length:s.bars},(e,t)=>Cy(s.notes.filter(e=>e.step>=t*r&&e.step<(t+1)*r).map(e=>({...e,step:e.step-t*r})),r))}Object.entries(S).filter(([e])=>e!==`harmonics`).map(([e,{stack:t}])=>({name:e,tones:new Set(t.map(e=>e%12)),size:t.length}));function Ty(e){return e===`bridge`||e===`breakdown`?`B`:e===`build`?`build`:`A`}let Ey={aeolian:{0:{5:3,3:3,6:2,4:1,2:1},1:{4:3,6:1},2:{5:2,6:2,3:2,0:1},3:{0:2,4:2,6:2,5:1},4:{0:4,5:1},5:{6:3,2:2,3:2,4:1},6:{0:3,2:3,5:1}},dorian:{0:{3:4,6:2,4:1,2:1},1:{0:2,3:1},2:{3:2,0:1},3:{0:4,6:1},4:{0:2,3:1},5:{0:1,3:1},6:{0:3,3:1}},ionian:{0:{3:3,4:3,5:3,1:1},1:{4:4,6:1},2:{5:3,3:2},3:{4:3,0:2,1:2},4:{0:4,5:2},5:{3:3,1:2,4:1},6:{0:3}},mixolydian:{0:{6:4,3:3,4:1},1:{0:1,6:1},2:{3:1},3:{0:3,6:1},4:{0:2},5:{6:1,3:1},6:{0:3,3:2}},phrygian:{0:{1:3,6:2,3:2,5:1},1:{0:4,6:1},2:{1:2,3:2,0:1},3:{1:2,0:2,6:1},4:{1:1,0:1},5:{1:2,6:2,3:1},6:{0:3,1:2}},lydian:{0:{1:4,4:2,5:2,6:1},1:{0:4,4:1},2:{1:2,5:2},3:{0:1,1:1},4:{0:3,1:2},5:{1:2,4:2},6:{0:2,1:1}},locrian:{0:{1:4,4:2,6:2},1:{0:4,6:1},2:{1:2,6:1},3:{1:2,0:1},4:{1:2,0:2},5:{1:2,4:2},6:{0:3,1:2}}},Dy={aeolian:4,dorian:4,ionian:4,mixolydian:6,phrygian:1,lydian:4,locrian:1},Oy={aeolian:[[0],[0,6],[0,3],[0,5]],dorian:[[0,3],[0],[0,6]],ionian:[[0,3],[0,4],[0,5]],mixolydian:[[0,6],[0,3]],phrygian:[[0,1],[0],[0,6]],lydian:[[0,1],[0],[0,4]],locrian:[[0,1],[0,6]]},ky=(e,t)=>Oy[e].findIndex(e=>e.join(` `)===t.join(` `));function Ay(e,t){let n=e=>[{step:0,degree:e}],r=t<.15?4:2,i=[0,1,2,3].map(t=>n(e[Math.floor(t/r)%e.length])),a=r===4?[0,1,2,3].map(()=>n(e[1%e.length])):i;return[...i,...a]}let jy=e=>Math.max(0,Math.min(1,e)),My=(e,t)=>[0,1,2,3,4,5,6].map(n=>(e[n]??1e-4)**(1-.7*t)+t*.35),Ny=(e,t)=>l({cycle:7,heights:[t,t+2,t+4]},ze(e)).heights;function Py({seed:t,index:n,kind:r,key:a,harm:o,entropy:s,a:c}){let l=0,u=()=>R(t,`theme`,n,l++),{mode:d}=a,f=e=>[{step:0,degree:e}];if(o<.33){let e=Oy[d],t=Math.floor(u()*e.length);return r!==`A`&&c?.mode===d&&c.vamp===t&&(t=(t+1)%e.length),{kind:r,index:n,mode:d,harm:o,vamp:t,bars:Ay(e[t],o)}}let p=Ey[d],m=r===`B`?u()<.5?5:3:r===`build`?3:0,h=jy((o-.4)*1.6),g=[m];for(let e=1;e<4;e++){if(e===3&&z(u(),o*(1-s*.5)))m=Dy[d];else if(z(u(),h))m=(m+3)%7,m===6&&d===`ionian`&&o<.85&&(m=4);else{let e=My(p[m]??{0:1},s);e[m]*=.2,m=Ze(u(),e)}m===g[e-1]&&(m=(m+3)%7),g.push(m)}let _=g.map(f),v=jy((o-.7)/.3)*.7;for(let t=0;t<4;t++){let n=g[t],r=t<3?g[t+1]:0;if(!z(u(),v))continue;if(t===3&&n===4){_[t]=[{step:0,degree:1},{step:8,degree:4}];continue}let[o,,s]=Ny(a,r),c=s-o===6,l=i(o+7,12)===i(e(ze(a),n),12);r!==n&&!c&&!l&&(_[t]=[..._[t],{step:8,dominantOf:r}])}let y=_.map(e=>[...e]);if(z(u(),.25+s*.5)){let e=g[2];y[3]=f(Ze(u(),My(p[e]??{0:1},s)))}return{kind:r,index:n,mode:d,harm:o,vamp:null,bars:[..._,...y]}}let Fy=`harmony`;function Iy(e,t){let n=Array.from({length:t},()=>[]);for(let{step:t,degree:r,stack:i}of[...e].sort((e,t)=>e.step-t.step))n[Math.floor(t/16)].push({step:t%16,degree:r,...i&&{stack:i}});return n}function Ly(e){if(e.bars!==8||e.notes.some(e=>e.stack))return null;let t=Iy(e.notes,e.bars);if(t.some(e=>e.length!==1||e[0].step!==0))return null;let n=e=>t[e][0].degree,r=n(0),i=n(4);return[1,2,3].some(e=>n(e)!==r)||[5,6,7].some(e=>n(e)!==i)?null:r===i?[r]:[r,i]}let Ry=(e,t)=>e!==null&&e.bars===8&&(t<.33||Ly(e)===null);function zy(e,{kind:t,index:n,mode:r,harm:i}){let a=Ly(e);if(a){let e=ky(r,a);return{kind:t,index:n,mode:r,harm:i,vamp:e===-1?null:e,bars:Ay(a,i)}}return{kind:t,index:n,mode:r,harm:i,vamp:null,bars:Iy(e.notes,e.bars)}}function By(e,t,n,{at:r,draw:i,a,chosen:o=[],rejected:s=[],layer:c,pull:l}){let{miss:u}=Lm(e),d=e.query(Cm(t),n,c,o,u,l).filter(e=>e.distance<=u&&!s.includes(e.id)).map(t=>({...t,read:e.read(t.id,n.meter,c)})).filter(e=>Ry(e.read,r.harm)),f=d[0];if(!f)return;let p=e=>e.score??e.distance,m=p(f)+.25*f.distance+1e-9,h=e=>{let t=Ly(e.read),n=t?ky(r.mode,t):-1;return n===-1?1/0:n},g=d.filter(e=>p(e)<=m).map((e,t)=>({id:e.id,place:h(e),rank:t})).sort((e,t)=>e.place-t.place||e.rank-t.rank);if(r.kind!==`A`&&g.length===1&&g[0].id===a)return;let _=Math.floor(i*g.length);return r.kind!==`A`&&g[_].id===a&&(_=(_+1)%g.length),g[_].id}function Vy(e){if(e.length!==8||!e[0]||e.filter(e=>e!==null).length<4)return null;let t=[],n=e[0][0].degree;return e.forEach((e,r)=>{if(!e){t.push({step:r*16,degree:n});return}for(let n of e)t.push({step:r*16+n.step,degree:n.degree});n=e.at(-1).degree}),t}function Hy(e,t){let n=e.filter(e=>e.bar>=t&&e.bar<t+8);return[...new Set(n.map(e=>e.source))].map(e=>({source:e,bars:Array.from({length:8},(r,i)=>n.find(n=>n.source===e&&n.bar===t+i)?.slots??null)}))}let Uy={kick:36,rim:37,snare:38,clap:39,closedHat:42,pedalHat:44,openHat:46,ride:51},Wy=[`drumHit`,`drumVariation`],Gy={kick:0,backbeat:1,ghost:2,hat:3,ride:4,open:5,pedal:6,fill:7,euclid:8},Ky=[1,0,0,.7,0,0,.6,0,0,0,.8,.35,0,0,.45,0],qy=[0,.3,0,.4,0,.2,0,.6,0,.5,0,.3,0,.2,0,.5],Jy=e=>Math.max(0,Math.min(1,e)),Yy=(e,t,n)=>e+(t-e)*n,Xy=e=>{let t=Jy(e);return t*t*(3-2*t)};function Zy(e){let t=e.heights.length;return Array.from({length:t},(e,t)=>t).filter(e=>t<=3?e>0:e%2==1)}function Qy(e,t=`cycle`){let{seed:n,bar:r,barInSection:i,style:a,barEnergy:s,meter:c}=e,{section:l}=e.plan,{sync:u,artic:f,harm:p,entropy:m}=a,h=Xm(e.swing),g=i===7,_=Xy((s-.05)/.5),v=(t,i,a)=>z(Je(n,Wy,Gy[t],l.index,r,i,m,e.restless),a),y=L(c),b=oe(c).heights,x=new Set(b),S=le(c),C=new Set(Zy(c).map(e=>b[e])),w=e=>new Set(b.filter(e).map(e=>e+2)),T=w(e=>C.has(e)),E=w(e=>!C.has(e)),D=nm(y),O=ih(Ky,c,t,r),k=ih(qy,c,t,r),A=/* @__PURE__ */ new Map,j=(e,t,n)=>{let r=e*128+t,i=A.get(r);(!i||$p.indexOf(n)<$p.indexOf(i.role))&&A.set(r,{part:`drums`,role:n,step:e,note:t,length:1})},M=()=>[...A.entries()].sort(([e],[t])=>e-t).map(([,e])=>e);if(l.type===`breakdown`){if(s>.2)for(let e of b)j(e+2,h>.5?Uy.ride:Uy.closedHat,`hat`);if(g)for(let e=D;e<y;e++)j(e,Uy.snare,`fill`);return M()}let N=Jy((s-.45)*3)*(1-h)*(1-u*.7),ee=Jy(f*(1-h)*(1-p)*1.3-.25)*_,P=N,te=Array.from({length:y},(e,t)=>t===0?1:x.has(t)?S[t/2]===`half`&&b.length>=4?.9:P:0);for(let e=0;e<y;e++){let t=Yy(te[e],O[e],u)*(e===0?1:_)*(1-.55*h);v(`kick`,e,t)&&j(e,Uy.kick,`kick`),C.has(e)?s>.25&&v(`backbeat`,e,1-.8*h)&&j(e,Uy.snare,`backbeat`):v(`ghost`,e,k[e]*u*_*.9+h*.12*_)&&j(e,Uy.snare,`ghost`);let n=e%2==0?Jy(.15+s*1.1):Jy((s-.55)*2.5)*(1-h);if(h>0&&(x.has(e)&&(n=Math.max(n,h)),T.has(e)&&(n=Math.max(n,h*.95)),E.has(e)&&(n*=1-.7*h)),n*=Math.max(_,h*.8),v(`hat`,e,n)){let t=e%2==0&&!x.has(e)&&v(`open`,e,ee)?Uy.openHat:v(`ride`,e,h)?Uy.ride:Uy.closedHat;j(e,t,`hat`)}h>.3&&C.has(e)&&v(`pedal`,e,h)&&j(e,Uy.pedalHat,`pedal`)}if(v(`euclid`,0,u*_*(1-.7*h)*1.3)){let e=[3,5,7][Math.min(2,Math.floor(s*3))],t=Math.floor(R(n,`drumEuclid`,l.index)*4*u);for(let n of o(d(e,y,t)))j(n,Uy.rim,`euclid`)}if(g&&(l.type===`build`||v(`fill`,0,.35+.3*u))){let e=l.type===`build`?D:rm(y);for(let t=e;t<y;t++)j(t,Uy.snare,`fill`)}return M()}function $y(e,t=em){return 60*ie(t)/(e*L(t))}um(2);let eb=Array(12).fill(0);function tb(e,t){return ny(e,.85,nb(t))}function*nb(e){for(let[t,{slot:n,chord:r}]of e.entries()){let i=((e[t+1]?.slot.step??tm)-n.step)/tm;for(let e of new Set(C(r).map(e=>u(e,12))))yield[e,i]}}let rb=new Map(Ie.map(e=>[e,o(P(e))]));function ib(e,t){let n=0;for(let r of rb.get(t.mode))n+=e[(r+t.tonic)%12];return n}let ab=(e,t,n)=>Math.max(t,Math.min(n,e)),ob=(e,t,n)=>e+(t-e)*n;function sb(e,t,n){let{type:r}=e.plan.section,i=L(e.meter),a=nm(i);if(r===`breakdown`)return t===`fill`?45+(n-a)*9:55;switch(t){case`kick`:return n===0||n===a?112:92;case`backbeat`:return n===oe(e.meter).heights[Zy(e.meter).at(-1)]?106:100;case`ghost`:return 32+14*e.style.sync;case`hat`:return cb(e,n)?78:n%2==0?66:50;case`pedal`:return 58;case`euclid`:case`clave`:return 72;case`fill`:{let e=r===`build`?a:rm(i);return 50+(n-e)*(60/(i-e))}}}let cb=(e,t)=>oe(e.meter).heights.includes(t);function lb(e,t){let{style:n,barEnergy:r,plan:i}=e,{step:a}=t;switch(t.part){case`drums`:return sb(e,t.role,a)*(.65+.35*r);case`bass`:return i.section.type===`breakdown`?70:(cb(e,a)?100:84)*(.75+.25*r);case`stab`:return 70+20*r;case`pad`:{let e=i.section.type===`breakdown`||r<.3?Math.max(.85,1-n.artic):1-n.artic;return 48+30*r*(.5+e/2)}case`lead`:return cb(e,a)?100:82}}function ub(e,t){let{artic:n}=e.style,{part:r,length:i}=t;switch(r){case`drums`:return i;case`bass`:return e.plan.section.type===`breakdown`?i-.3:Math.max(.3,i*ab(1.02-.7*n,.3,1));case`pad`:return i;case`stab`:return i*ob(2.5,.45,n);case`lead`:return Math.max(.3,i*ab(1.05-.75*n,.25,1))}}let db=$p.filter(e=>e!==`clave`),fb=e=>e.hits.every(e=>!db.includes(e.role));function pb(e,t,n,r,i,a=[],o=[],s){let c=Cm(t),{hold:l,layer:u}=e.margins??{hold:.02,layer:.1},d=zm(e,c,n,r?.rhythmFragment,e=>e===null||!fb(e),i,a,o,s);if(d===void 0)return{};let f=Rm(e.layered(c,n,d,i,u+l,a,s).filter(e=>e.distance<=u+l&&!o.includes(e.id)).filter(t=>{let r=e.read(t.id,n.meter,i);return r!==null&&fb(r)}),r?.claveFragment,u,l,l);return f===void 0?{rhythmFragment:d}:{rhythmFragment:d,claveFragment:f}}function mb(e,t,n,r,i,a){return[t.rhythmFragment,t.claveFragment].flatMap(t=>{let o=t===void 0?null:e.read(t,n,a);if(!o)return[];let s=r%o.bars;return o.hits.filter(e=>Math.floor(e.step/i)===s).map(e=>({...e,step:e.step-s*i}))})}let hb=e=>e.step*128+e.note;function gb(e){let t=/* @__PURE__ */ new Map;for(let n of e){let e=t.get(hb(n));(!e||$p.indexOf(n.role)<$p.indexOf(e.role))&&t.set(hb(n),n)}return[...t.values()].sort((e,t)=>e.step-t.step||e.note-t.note)}let _b=(e,t)=>({part:`drums`,role:e,step:t.step,note:t.note,length:1});function vb(e,t,n){if(!n.length)return[...t];let r=L(e.meter),i=n.filter(e=>e.step>=0&&e.step<r),a=(e,t)=>t.velocity-e.velocity||e.step-t.step,o=(t,n)=>lb(e,n)-lb(e,t)||t.step-n.step,s=new Set(t.map(e=>e.role)),c=db.filter(e=>e!==`fill`&&s.has(e)).flatMap(e=>{let n=t.filter(t=>t.role===e),r=i.filter(t=>t.role===e).sort(a).slice(0,n.length).map(t=>_b(e,t)),s=new Set(r.map(hb)),c=n.filter(e=>!s.has(hb(e))).sort(o);return[...r,...c.slice(0,n.length-r.length)]}),l=t.filter(e=>e.role===`fill`),u=i.filter(e=>e.role===`clave`).map(e=>_b(`clave`,e));return gb([...c,...l,...u])}function yb(e,t,n){let r=/* @__PURE__ */ new Map;for(let{step:t,note:n}of e)(!r.has(t)||n<r.get(t))&&r.set(t,n);return[...r.entries()].sort(([e],[t])=>e-t).map(([e,r])=>{let a=it(t,e),o=C(a.chord),s=i(r,12),c=o.findIndex(e=>i(e,12)===s);if(c>=0)return{step:e,chord:0,index:c,alter:0,shift:0};let l=t.find(e=>e.slot.step>a.slot.step)??n[0],u=l&&i(C(l.chord)[0],12);if(u!==void 0){let t=i(s-u+6,12)-6;if(Math.abs(t)<=1)return{step:e,chord:1,index:0,alter:0,shift:t}}return{step:e,chord:0,index:0,alter:0,shift:i(s-o[0]+6,12)-6}})}let bb=e=>e.map(e=>`${e.step}:${e.chord}:${e.index}:${e.alter}:${e.shift}`).join(` `);function xb(e){let t=/* @__PURE__ */ new Map;for(let n of e){if(n.length<2)continue;let e=bb(n),r=t.get(e);r?r.count++:t.set(e,{count:1,first:n})}let n=null;for(let e of t.values())(!n||e.count>n.count)&&(n=e);return n?n.first:null}let Sb={plain:0,pentatonic:1/3,blues:2/3};function Cb(e){return Le.filter(t=>e.harm>=Sb[t])}function wb(e){return Cb(e)[0]}function Tb(e){return Math.round(6*e.harm)}function Eb(e,t){return .5*Zm(t)+.3*e.entropy+.2*(1-e.artic)}function Db(e){return{tempo:Ob(e),keyReach:Math.max(1,Tb(e)),melodic:Cb(e)}}function Ob(e){let t=.08333333333333333+e.entropy*.25;return{low:Math.max(-t,Math.log2(_m.bpm.min/e.bpm)),high:Math.min(t,Math.log2(_m.bpm.max/e.bpm))}}let kb=(e,t,n)=>e*(1-n)+t*n;function Ab(e,t,n,r){return jb(e,t,n,r)}function jb(e,t,n,r){let{artic:i}=t;switch(e){case`lead`:return{triangle:1.8*(1-i),square:i,cutoff:1400+2200*r,attack:kb(.04,.006,i)};case`bass`:{let e=Xm(n);return{saw:1-e,triangle:1.6*e,cutoff:.6+.6*i,resonance:6-4*e}}case`pad`:case`stab`:return{attack:kb(.3,.01,i),release:kb(.7,.12,i)};case`drums`:return{}}}let Mb=e=>Math.max(1,Math.min(127,Math.round(e)));function Nb(e){let t=Math.round(e);return t>=1&&t<=127?e:e-t+Mb(t)}function Pb(e,t,n,...r){return(R(e,t,...r)-.5)*n*24}function Fb(e,t,n,...r){return 1-R(e,t,...r)*n*.15}function Ib(e,t,n,r,i,a,...o){let s=R(e,`ownAccent`,Qp.indexOf(t),i,a,...o);return a%2==1?-s*14*n:r.includes(a)?(s-.5)*2*4*n:s*10*n}let Lb={bass:`bassVelocity`,stab:`stabVelocity`,pad:`padVelocity`,lead:`leadVelocity`},Rb={bass:`bassLength`,stab:`stabLength`,pad:`padLength`,lead:`leadLength`};function zb(e,t){let{accent:n}=t;return t.part===`lead`?Nb(n===void 0?lb(e,t):91+n):Nb(lb(e,t)+(n??0))}function Bb(e,{part:t,step:n,note:r},i,a){let{seed:o,bar:s}=e,c=oe(e.meter).heights;return Mb(t===`drums`?i+Pb(o,`drumVelocity`,a,s,n,r)+Ib(o,`drums`,a,c,s,n,r):i+(Pb(o,Lb[t],a,s,n)+Ib(o,t,a,c,s,n)))}function Vb(e,{part:t,step:n,note:r},i){let{seed:a,bar:o}=e;return t===`drums`?Fb(a,`drumLength`,i,o,n,r):Fb(a,Rb[t],i,o,n)}function Hb(e,{part:t,step:n,note:r,role:i},a,o){return{part:t,step:n,note:r,length:o,velocity:a,gain:a/127,...Ab(t,e.style,e.swing,e.barEnergy),...i!==void 0&&{role:i}}}function Ub(e,t){let n=Eb(e.style,e.swing);return{...Hb(e,t,Bb(e,t,zb(e,t),n),ub(e,t)*Vb(e,t,n)),...t.accent!==void 0&&{accent:t.accent}}}let Wb=e=>e.laps===null?null:e.at+e.bars*e.laps;function Gb(e,t){if(!e||t<e.at)return null;let n=Wb(e);return n!==null&&t>=n?null:t-e.bars}function Kb(e){let t=e.beats.length;return e.beats.map((t,n)=>e.beats.slice(0,n).reduce((e,t)=>e+t,0)/e.unit).filter((e,n)=>t<=3?n>0:n%2==1)}let qb=(e,t)=>Math.abs(e-t)<1e-9;function Jb(e){if(!e.meter||e.stepWhole===null)return!1;let t=e.meter.pulses/e.meter.unit,n=Kb(e.meter);return e.notes.every(r=>{let i=r.step*e.stepWhole%t;return n.some(e=>qb(i,e)||qb(i,e+t))})}let Yb=(e,t,n)=>e.notes.length>0&&e.notes.every(e=>nv(n,e.voice)===t);function Xb(e,t){let n=e.cells.get(t);if(!n?.step)return null;let r=vv(n.step.tap,e.cells.get(n.step.driver)?.meter??null);if(r===null)return null;let i=/* @__PURE__ */ new Map;for(let n of kd(e,t,gi(e)))i.set(n.step,[...i.get(n.step)??[],n.value+n.alter]);if(![...i.values()].some(e=>e.length>1))return null;let a=[...i.keys()].sort((e,t)=>e-t),o=e=>[...e].sort((e,t)=>e-t).join(`,`),s=a.filter((e,t)=>t===0||o(i.get(e))!==o(i.get(a[t-1]))).map(e=>({at:e*r,size:i.get(e).length}));return{lap:n.steps*r,changes:s}}function Zb(e,t){if(!e.pitched?.table||e.stepWhole===null)return[];let n=Xb(t,e.pitched.table);if(!n)return[];let r=e.steps*e.stepWhole,i=e=>qb(e%n.lap,0)||qb(e%n.lap,n.lap),a=1;for(;a<64&&!i(a*r);)a++;return e.notes.flatMap(t=>{let i=t.pitch;if(typeof i.written!=`number`||i.table!==`${e.pitched.table}:0`||i.alter||i.transpose)return[];let o=Array.from({length:a},(i,a)=>(t.step*e.stepWhole+a*r)%n.lap).flatMap(e=>n.changes.filter(t=>qb(t.at,e)||qb(t.at+n.lap,e))),s=e=>(i.value%e+e)%e===0;return o.length&&o.every(e=>s(e.size))?[{line:e.name,step:t.step,reason:`root`}]:[]})}function Qb(e,t){return e.flatMap(e=>e.pitched?Zb(e,t):Yb(e,36,t)?[{line:e.name,reason:`kick`}]:Yb(e,38,t)&&Jb(e)?[{line:e.name,reason:`backbeat`}]:[])}let $b=/@(\d+)$/,ex=/^(.+)!(\d+)$/;function tx(e,t){let n=[],r=0;for(let t of e){let e=$b.exec(t),i=ex.exec(t),a=e?Number(e[1]):i?Number(i[2]):1;n.push({start:r,len:a}),r+=a}return r===t?n:null}let nx=/^(label|tags|show|about|title)=/;function rx(e,t,n,r,i,a,o){if(e.form!==`steps`||e.levels||e.euclid||!i.length)return null;let s=tx(t,e.steps);if(!s)return null;let c=e.name,l=e.steps,u=s.length,d=wv(e,e.notes),f=wv(e,i),p=(e,t,n=f)=>n.slice(e,t).filter(e=>e!==null),m=n.filter(e=>!nx.test(e)),h=[...a].sort((e,t)=>e-t),g=(e,t)=>{let n=[],r=0;for(let e=0;e<l;e++){let i=t(e);if(i===null){d[e]!==null&&r++;continue}r&&n.push(r===1?`=`:`=!${r}`),n.push(i),r=0}return{form:`base=${e} ${n.join(` `)}`.trim(),line:t=>`&${t} base=${e} ${n.join(` `)}`.trim()}},_=e=>e===u-1&&u>1?`-1`:String(e),v=(e,t)=>e===0&&t===u?c:t-e===1?`${c}[${_(e)}]`:e===0?`${c}[:${t===u-1?`-1`:t}]`:t===u?`${c}[${_(e)}:]`:`${c}[${e}:${t}]`,y=(e,t)=>{let n=s.findIndex(t=>t.start===e),r=s.findIndex(e=>e.start===t);return n<0||r<0&&t!==l?null:[n,r<0?u:r]},b=(e,t,n)=>{let r=y(e,t);return r?[n(v(...r))]:p(e,t)},x=e=>{let t=e.join(` `);return{form:t,line:e=>[`&${e}`,...m,t].join(` `)}},S=null;if(r===`rotate`)s.at(-1).len===1&&(S={form:`${c}[<<]`,line:e=>`&${e} [${c}[<<]]`});else if(r===`transpose`)S=h.length?g(`${c}^${o}`,e=>a.has(e)?d[e]:null):x([`${c}^${o}`]);else if(r===`invert`){let e=e=>o?`degree(inverse(${e}), ${o})`:`inverse(${e})`,t=[],n=0;for(let r of[...h,l])r>n&&t.push(...b(n,r,e)),r<l&&t.push(...b(r,r+1,e=>e)),n=r+1;S=x(t)}else if(r===`reverse`){if(!h.length)S=x([`${c}[::-1]`]);else{let e=h[0]>0,t=e?p(0,h[0]):[];for(let[n,r]of h.entries()){t.push(...b(r,r+1,e=>e));let[i,a]=[r+1,h[n+1]??l],o=y(i,a);a<=i||(e&&n===h.length-1?t.push(...p(i,a)):a-i===1?t.push(...b(i,a,e=>e)):o?t.push(`${c}[${o[1]===u?``:o[1]-1}:${o[0]-1}:-1]`):t.push(...p(i,a)))}S=x(t)}}else S=g(c,e=>d[e]===f[e]?null:f[e]);return!S||!S.form.includes(c)?null:S.line(e.trigger).length<=[c,...m,...p(0,l)].join(` `).length?S:null}let ix=[`rotate`,`drop`,`add`],ax=[`transpose`,`invert`,`reverse`,`bend`,`trim`],ox=[-2,-1,1,2],sx=[-2,-1,1,2];function cx(e,t=``,n){let r=new Set(np(e).map(e=>e.name)),i=[...np(t).filter(e=>!r.has(e.name)).map(e=>e.written),e].join(`
`),a=Hf(i,void 0,n?{resolve:n}:{});if(!a.ok)return{lines:[],anchors:[],result:null,own:r};let o=bv(i,a);return{lines:o,anchors:Qb(o,a),result:a,own:r}}let lx=e=>e.startsWith(`&`)?e:`&${e}`,ux=(e,t)=>dx(e,t).variations.map(e=>e.variation);function dx(e,t={}){let{workbench:n,operators:r=ix,keep:i=[],fewest:a=1,degrees:o=ox,resolve:s}=t,{lines:c,anchors:l,result:u,own:d}=cx(e,n,s);if(!u)return{notes:null,span:null,bar:null,variations:[]};let f=/* @__PURE__ */ new Set([...l.filter(e=>e.step===void 0).map(e=>e.line),...i.map(lx)]),p=(e,t)=>l.some(n=>n.line===e.name&&n.step===t.step),m=(e,t)=>{let n=c[e].stepWhole;return n===null?`${e}@${t}`:(t*n).toFixed(9)},h=e=>String(nv(u,e)??e),g=e=>e.pitch?` ${ev(e.pitch)}`:``,_=(e,t)=>t.map(t=>`${m(e,t.step)} ${c[e].stepWhole??e} ${t.voice}${g(t)}`),v=(e,t)=>t.map(t=>`${m(e,t.step)} ${h(t.voice)}${g(t)}`),y=new Map([...new Set(c.flatMap(e=>e.pitched?[e.pitched.voice]:[]))].map((e,t)=>[e,`voice#${t}`])),b=(e,t)=>{let{stepWhole:n,name:r}=c[e];return t.map(e=>{let t=`${n??r} ${e.pitch?`${y.get(e.voice)} ${ev(e.pitch)}`:h(e.voice)}`;return n===null?{at:null,key:`${r}@${e.step} ${t}`}:{at:e.step*n,key:t}})},x=c.map((e,t)=>b(t,e.notes)),S=px(u,d,c),C=[...c.map(e=>e.stepWhole===null?null:e.steps*e.stepWhole),...S.map(e=>e.lap)],w=c.find(e=>e.meter)?.meter??S.find(e=>e.meter)?.meter??null,T=C.length&&C.every(e=>e!==null)?C.reduce((e,t)=>fx(e,t)):null,E=w?w.pulses/w.unit:null,D=S.flatMap(e=>e.notes),O=c.map((e,t)=>_(t,e.notes)),k=c.map((e,t)=>v(t,e.notes)),A=c.reduce((e,t)=>e+t.notes.length,0),j=/* @__PURE__ */ new Map,M=e=>{let t=j.get(e);if(!t){let n=c.flatMap((t,n)=>n===e?[]:k[n]),r=new Set(n);t={keys:c.flatMap((t,n)=>n===e?[]:O[n]).sort(),strikes:r.size<n.length?null:r},j.set(e,t)}return t},N=(e,t)=>{let n=M(e).keys,r=e<0?[]:_(e,t).sort(),i=[],a=0,o=0;for(;a<n.length||o<r.length;)i.push(o>=r.length||a<n.length&&n[a]<=r[o]?n[a++]:r[o++]);return i.join(`|`)},ee=(e,t)=>{let n=M(e).strikes;if(!n)return!1;let r=/* @__PURE__ */ new Set;for(let i of v(e,t)){if(n.has(i)||r.has(i))return!1;r.add(i)}return!0},P=/* @__PURE__ */ new Set([N(-1,[])]),te=[],ne=/* @__PURE__ */ new Map,re=t=>(ne.has(t)||ne.set(t,qt(e,t)),ne.get(t)),F=(e,t,n,r,i,o,s=r)=>{if(!i||A-c[e].notes.length+n.length<a||!ee(e,n))return;let l=N(e,n);if(P.has(l))return;P.add(l);let u=c[e].name,d=(e,t)=>{let n=re(e);return n?[...n.head,...n.attrs,...t??n.braid].join(` `):``},f=re(c[e].trigger),m=new Set(c[e].notes.filter(n=>p(c[e],n)&&!(t===`invert`&&n.pitch?.written===(s??0)/2&&!n.pitch.alter)).map(e=>e.step)),h=f&&rx(c[e],f.braid,f.attrs,t,n,m,s),g={id:`vary:${t}:${u}${r===null?``:`:${r}`}:${te.length}`,tool:`vary`,rule:t,title:`${u}: ${o}`,before:[...i.keys()].map(e=>d(e)).join(`
`),after:[...i].map(([e,t])=>d(e,t)).join(`
`),apply:e=>[...i].reduce((e,[t,n])=>Yt(e,t,n),e),line:u,by:`${t} ${u}${r===null?``:` ${r}`}`,...h?{reference:h}:{}};te.push({variation:g,notes:[...c.flatMap((t,r)=>r===e?b(e,n):x[r]),...D]})},I=e=>e.sort((e,t)=>e.step-t.step||rv(u,e.voice)-rv(u,t.voice)),ie=e=>{let t=c[e].notes[0];return[t.step*(c[e].stepWhole??1),rv(u,t.voice)]},ae=c.map((e,t)=>t).filter(e=>c[e].notes.length>0&&!f.has(c[e].name)).sort((e,t)=>ie(e)[0]-ie(t)[0]||ie(e)[1]-ie(t)[1]);for(let e of ae){let t=c[e],n=t.levels?.tokens,[i,a]=t.notes.slice(-2),s=t.notes.length>=2&&!p(t,a);for(let c of r)if(ax.includes(c)===!!t.pitched&&(!t.notes.some(e=>e.hold)||[`transpose`,`invert`].includes(c))){if(c===`bend`){if(s)for(let n of sx){let r=t.notes.map(e=>e===a?{...e,pitch:$_(i.pitch,1,n)}:e);F(e,c,r,n,Tv(t,r),`its last note bent to ${Math.abs(n)} degree${Math.abs(n)===1?``:`s`} ${n>0?`above`:`below`} the one before it`)}}else if(c===`trim`){if(!s||t.notes.length-1<2)continue;let n=t.notes.filter(e=>e!==a);F(e,c,n,a.step,Tv(t,n),`its last note, on step ${a.step}, left out: the one before it held`)}else if(c===`transpose`)for(let n of o){let r=t.notes.map(e=>p(t,e)?e:{...e,pitch:$_(e.pitch,1,n)});F(e,c,r,n,Tv(t,r),`every note ${n>0?`up`:`down`} ${Math.abs(n)} degree${Math.abs(n)===1?``:`s`}`)}else if(c===`invert`){let{written:n,alter:r}=t.notes[0].pitch;if(typeof n!=`number`||r)continue;let i=t.notes.map(e=>p(t,e)?e:{...e,pitch:$_(e.pitch,-1,2*n)});F(e,c,i,null,Tv(t,i),`every note mirrored about its first`,2*n)}else if(c===`reverse`){let n=I(mx(t,e=>p(t,e)));F(e,c,n,null,Tv(t,n),`its notes in reverse order between its anchors`)}else if(c===`rotate`){let r=I(t.notes.map(e=>({...e,step:(e.step+1)%t.steps})));F(e,c,r,null,Tv(t,r,n&&[n.at(-1),...n.slice(0,-1)],!0),`every note a step later, the last to the first`)}else if(c===`drop`)for(let n of t.notes){let r=t.notes.filter(e=>e!==n);F(e,c,r,n.step,Tv(t,r),`its ${n.voice} on step ${n.step} left out`)}else{let r=t.notes[0].voice,i=t.notes.reduce((e,t)=>t.level>e.level?t:e);for(let a=0;a<t.steps;a++){if(t.notes.some(e=>e.step===a&&h(e.voice)===h(r)))continue;let o=I([...t.notes,{step:a,voice:r,own:i.own,level:i.level}]),s=n&&n.map((e,t)=>t===a?n[i.step]:e);F(e,c,o,a,Tv(t,o,s),`a ${r} on step ${a}, as loud as its loudest`)}}}}return{notes:[...x.flat(),...D],span:T,bar:E,variations:te}}function fx(e,t){let n=(e,t)=>t?n(t,e%t):e,[r,i]=[Math.round(e*3840),Math.round(t*3840)];return r&&i?r/n(r,i)*i/3840:Math.max(e,t)}function px(e,t,n){let r=new Set(n.flatMap(e=>[e.trigger,e.card.name,...e.levels?[e.levels.cell]:[]])),i=[];for(let n of t){let t=e.cells.get(n);if(!t?.step||r.has(n)||t.voice)continue;let a=e.cells.get(t.step.driver)?.meter??null,o=vv(t.step.tap,a);if(o===null)continue;let s=kd(e,n,gi(e)),c=/* @__PURE__ */ new Map;for(let e of s)c.set(e.step,(c.get(e.step)??0)+1);if(![...c.values()].some(e=>e>1))continue;let l=i.length,u=s.map(e=>({at:e.step*o,key:`${o*e.duration} chords#${l} ${e.table}:${e.tableShift}:${e.value}:${e.alter}:${e.transpose??0}`}));i.push({notes:u,lap:t.steps*o,meter:a})}return i}function mx(e,t){let n=new Map(e.notes.map(e=>[e.step,e])),r=e.notes.filter(t).map(e=>e.step),i=[];if(!r.length)i.push(Array.from({length:e.steps},(e,t)=>t));else for(let[t,n]of r.entries()){let a=r[(t+1)%r.length]+(t+1===r.length?e.steps:0);i.push(Array.from({length:a-n-1},(t,r)=>(n+1+r)%e.steps))}let a=e.notes.filter(t);for(let e of i)for(let[t,r]of e.entries()){let i=n.get(e[e.length-1-t]);i&&a.push({...i,step:r})}return a}function hx(e,t){if(!(e>=0&&e<1))throw Error(`varied: draw ${e} is outside [0, 1)`);return Math.floor(e*t)}function gx(e){let t=e.split(`
`),n=_x(e),r=[],i=e=>t[e.span.line-1]?.substr(e.span.col-1,e.span.len)??``,a=(e,n)=>{if(e.span.col-1+e.span.len>(t[e.span.line-1]?.length??0)||n&&e.atom.kind===`ref`)return null;let r=i(e);if(e.repeat>1){if(!r.endsWith(`!${e.repeat}`))return null;r=r.slice(0,-`!${e.repeat}`.length)}let a=/^([^\s*!@]+)\*([0-9]+)$/.exec(r);return{base:a&&e.subdivide>1&&e.atom.kind!==`ref`?`[${a[1]}!${a[2]}]`:r,n:e.repeat}},o=(e,n)=>{for(let i=0;i<e.length;){let s=e[i],c=a(s,n),l=i+1,u=c?.n??1;if(c)for(;l<e.length;l++){let r=e[l],i=a(r,n),o=e[l-1],s=r.span.line===o.span.line&&r.span.col>=o.span.col+o.span.len?t[r.span.line-1].slice(o.span.col-1+o.span.len,r.span.col-1):null;if(!i||i.base!==c.base||s===null||s.trim())break;u+=i.n}let d=e[l-1],f=c?`${c.base}${u>1?`!${u}`:``}`:null,p=d.span.col-1+d.span.len-(s.span.col-1);if(f!==null&&d.span.line===s.span.line&&f!==t[s.span.line-1].substr(s.span.col-1,p))r.push({line:s.span.line,col:s.span.col,len:p,to:f});else if(l===i+1&&s.atom.kind===`seq`)for(let e of s.atom.layers)o(e,!0);i=l}},s=/* @__PURE__ */ new Set([`adsr`,`ratios`,`role`,`style`,`table`]);for(let t of Z(e).cells)t.braid.kind===`list`&&!n.has(t.name)&&t.cycle===null&&!(t.map&&s.has(t.map.kind))&&o(t.braid.tokens,!1);r.sort((e,t)=>t.line-e.line||t.col-e.col);for(let e of r){let n=t[e.line-1];t[e.line-1]=n.slice(0,e.col-1)+e.to+n.slice(e.col-1+e.len)}return t.join(`
`)}let _x=e=>new Set([...e.matchAll(/&([A-Za-z_][A-Za-z0-9_]*)\[/g)].map(e=>e[1])),vx=.1,yx=/&([A-Za-z_][A-Za-z0-9_]*)/g,bx=e=>{let t=$o(e);return new Set(t?[...t.names,...t.optional,...t.main?[t.main]:[]].map(e=>e.slice(1)):[])},xx=e=>{let t=bx(e);return[...new Set(np(e).map(e=>e.name))].filter(e=>!t.has(e))};function Sx(e){let t=new Map(xx(e).map((e,t)=>[e,t+1]));return gx(np(e).map(e=>e.code).join(`
`)).split(`
`).map(e=>e.replace(yx,(e,n)=>t.has(n)?`&#${t.get(n)}`:e)).join(`
`)}let Cx=e=>e.split(`
`).filter(e=>B(V(e)[0].trim())===void 0).join(`
`);function wx(e,t){if(!$o(e)&&$o(t))return wx(e,Cx(t));if(Sx(e)!==Sx(t))return null;let n=xx(t);return new Map(xx(e).flatMap((e,t)=>e===n[t]?[]:[[`&${e}`,`&${n[t]}`]]))}let Tx=e=>Math.round(e*1e9)/1e9;function Ex(e,t,n,r,i){let a=t.filed.find(e=>e.fragment.id===n)??t.filed.find(e=>Es(e.fragment,n)!==void 0),o=a&&a.fragment.id!==n?Es(a.fragment,n):void 0,s=a?a.fragment.association:e.fragments.find(e=>e.id===n).association,c=s.flatMap((e,t)=>!a||Ds(e,o)?[{wp:e,own:t}]:[]);t.points.forEach((e,t)=>{e.id===n&&c.push({wp:e,row:t})});let l=new Set(Ap({id:n,text:`-`,association:c.map(e=>e.wp)},i)),u,d=1/0;for(let e of c){let t=l.has(e.wp)?kp(e.wp.point,r)/e.wp.weight:1/0;t<=d&&t<1/0&&([u,d]=[e,t])}if(!u)return Dx(t,n,a,{point:{...r},weight:vx,...i===void 0?{}:{facet:i},...o?{args:o}:{}});let{wp:f}=u;if(f.weight>=1.2)return t;let p=Tx(Math.min(1.2,f.weight+.1));if(u.row!==void 0)return{...t,points:t.points.map((e,t)=>t===u.row?{...e,weight:p}:e)};if(!a)return Dx(t,n,a,{...f,weight:p});let m=s.map((e,t)=>t===u.own?{...e,weight:p}:e);return{...t,filed:t.filed.map(e=>e===a?{...e,fragment:{...e.fragment,association:m}}:e)}}function Dx(e,t,n,r){if(!n)return{...e,points:[...e.points,{id:t,...r}]};let i={...n.fragment,association:[...n.fragment.association,r]};return{...e,filed:e.filed.map(e=>e===n?{...e,fragment:i}:e)}}function Ox(e,t){let n=[...new Set(t)].sort(Pp);if(n.length<2)return e;let r=[...e.together],i=new Map(r.map((e,t)=>[JSON.stringify(e.ids),t]));for(let e=0;e<n.length;e++)for(let t=e+1;t<n.length;t++){let a=[n[e],n[t]],o=JSON.stringify(a),s=i.get(o);s===void 0?(i.set(o,r.length),r.push({ids:a,count:1})):r[s]={ids:a,count:r[s].count+1}}return{...e,together:r}}function kx(e,t,n){let r=new Set(e.merge(t).fragments.map(e=>e.id)),i=n.filter(e=>!r.has(e.id)).map(e=>`'${e.id}'`);if(i.length)throw Error(`useFragments: no fragment ${i.join(`, `)}`);let a=Ox(t,n.map(e=>e.id));for(let{id:t,point:r,facet:i}of n)r&&(a=Ex(e,a,t,r,i));return a}function Ax(e,t,n){let{text:r,point:i,facet:a,source:o,created:s,meta:c={},prose:l=``}=n,u=[];(typeof o!=`string`||!o.trim())&&u.push(`no source`),(typeof s!=`string`||!s.trim())&&u.push(`no created`);let d=[`id`,`association`,`source`,`created`].filter(e=>Object.hasOwn(c,e));d.length&&u.push(`its meta names ${d.join(`, `)}, which filing writes itself`);let f=[{point:{...i},weight:vx,...a===void 0?{}:{facet:a}}];if(u.push(...Ep({id:n.id??`filed`,text:r,association:f})),u.length)throw Error(`fileFragment: ${u.join(`; `)}`);let p=e.merge(t);for(let n of p.fragments){let o=wx(r,n.text);if(o)return{layer:Ex(e,t,n.id,i,a),id:n.id,file:null,renamed:o}}let m=/* @__PURE__ */ new Set([...p.fragments.map(e=>e.id),...p.unheld]);if(n.id!==void 0&&m.has(n.id))throw Error(`fileFragment: the id ${n.id} is taken`);let h=n.id??`${o} ${s}`;for(let e=2;m.has(h);e++)h=`${o} ${s} ${e}`;let g={fragment:{id:h,text:r,association:f},meta:{source:o,created:s,...c},prose:l};return{layer:{...t,filed:[...t.filed,g]},id:h,file:g,renamed:/* @__PURE__ */ new Map}}let jx=e=>jv.filter(t=>t.association.some(t=>t.facet===e)),Mx=jx(`meter`),Nx=jx(`rhythm`).filter(e=>!e.association.some(e=>e.facet===`mode`)),Px=jx(`bass`),Fx=jx(`harmony`),Ix=jx(`instrument`),Lx=jx(`mode`),Rx=jx(`motif`),zx=jx(`form`);function Bx(e){let t=e.length;for(let n=0;n<e.length;n++){let r=e.charCodeAt(n);r<128||(r<2048?t+=1:r>=55296&&r<56320&&(e.charCodeAt(n+1)&64512)==56320?(t+=2,n++):t+=2)}return t}let Vx=e=>Bx(JSON.stringify(e));function Hx(e,t=16e3){if(Vx(e)<=t)return e;let{filed:n,points:r,together:i}=e,a=()=>Vx({filed:n,points:r,together:i});for(;r.length>0&&a()>t;)r=r.slice(1);for(;i.length>0&&a()>t;)i=i.slice(1);for(;n.length>0&&a()>t;)n=n.slice(1);return{filed:n,points:r,together:i}}function Ux(e,t,n){return n.filter(n=>e.fragments.some(e=>e.id===n)||t.filed.some(e=>e.fragment.id===n))}let Wx=[`gm_kit`,`bass`,`keys`,`pad`,`lead`],Gx=(()=>{let e=/* @__PURE__ */ new Map,t=[...Ix].sort((e,t)=>Kx(e.id)-Kx(t.id)||e.id.localeCompare(t.id));for(let n of t)for(let t of es(n.text).split(`
`)){let n=/^&(\w+)\s/.exec(t)?.[1];n!==void 0&&!e.has(n)&&e.set(n,t)}return e})();function Kx(e){let t=Wx.indexOf(e);return t===-1?Wx.length:t}let qx=e=>new Set(e.split(`
`).flatMap(e=>/^&(\w+)/.exec(e)?.[1]??[])),Jx=e=>new Set(e.split(`
`).flatMap(e=>[...e.replace(/^&\w+/,``).matchAll(/&(\w+)/g)].map(e=>e[1])));function Yx(e){let t=qx(e),n=Jx(e),r=/* @__PURE__ */ new Set;for(let e=!0;e;){e=!1;for(let[i,a]of Gx)if(n.has(i)&&!t.has(i)&&!r.has(i)){r.add(i);for(let e of Jx(a))n.add(e);e=!0}}return[...Gx].flatMap(([e,t])=>r.has(e)?[t]:[])}function Xx(e){let t=e;for(let n of e.split(`
`)){let e=/^&(\w+)\s/.exec(n)?.[1],r=e===void 0?null:Kc(e);r!==null&&/\ss=/.test(n)&&!/\snote=/.test(n)&&(t=Vt(t,e,`note`,String(r)))}return t}function Zx(e){let t=Xx(e),n=Yx(t);return n.length?`${t}\n${n.join(`
`)}`:t}let Qx=e=>Object.keys(I).find(t=>im(I[t],e))??null,$x=e=>`${e.cycle}:${e.heights.join(` `)}`;function eS(e,t){return[{tap:`1m`,length:t},{tap:`2n`,length:8},{tap:`4n`,length:4},{tap:`8n`,length:2}].find(n=>t%n.length===0&&e.every(e=>e%n.length===0))??{tap:`16n`,length:1}}function tS(e){let{facet:t,fragments:n,read:r,bars:i=1}=e,a=e.vary,o=Ip([...n,...Mx]),s=new Map(n.map(e=>[e.id,e.text])),c=(e,t)=>s.get(e)??t?.filed.find(t=>t.fragment.id===e)?.fragment.text,l=({fragment:e})=>e.association.some(e=>e.facet===t),u=/* @__PURE__ */ new Map,d=/* @__PURE__ */ new Map,f=(e,t)=>{let n=`${e}\n${$x(t)}`;return u.has(n)||u.set(n,r(e,t)),u.get(n)},p=(e,t)=>{let n=`${t}\n${e}`;if(!d.has(n)){if(!a)d.set(n,[]);else{let r=a(t),i=[r.workbench??[],Yx(e)].flat().join(`
`);d.set(n,ux(e,{...r,workbench:i}))}}return d.get(n)},m=(e,r,i,a,c)=>o.query(e,n.length+Mx.length+(r?.filed.length??0),{},{facet:t,...r?{layer:r}:{},...i.length?{chosen:i}:{},...c===void 0?{}:{pull:c}}).filter(e=>s.has(e.fragment.id)||e.distance<=a);return{query(e,t,n,r=[],i=1/0,a){return m(e,n,r,i,a).filter(e=>f(e.fragment.text,t.meter)!==null).map(e=>({id:e.fragment.id,distance:e.distance,score:e.score}))},used:(e,n,r,i=[])=>Hx(kx(o,e,[...Ux(o,e,n).map(e=>({id:e,point:r,facet:t})),...Ux(o,e,i).map(e=>({id:e}))])),file(n,{notes:r,text:a,bench:s,point:c,source:l,created:d,tags:f,varies:p,by:m}){let h=a??e.text(r,L(s.meter)),g=Ax(o,n,{text:h,point:c,facet:t,source:l,created:d,meta:{tags:[...f],...p===void 0?{}:{varies:p},...m===void 0?{}:{by:m}}}),{meterFragment:_}=s,v=_===void 0?g.layer:kx(o,g.layer,[{id:g.id},{id:_}]),y=`${h}\n${$x(s.meter)}`;return g.file&&a===void 0&&!u.has(y)&&u.set(y,{bars:Math.max(i,Math.ceil((Math.max(...r.map(e=>e.step))+1)/L(s.meter))),notes:[...r].sort((e,t)=>e.step-t.step)}),{layer:Hx(v),id:g.id,held:g.file===null}},read(e,t,n){let r=c(e,n);return r===void 0?null:f(r,t)},vary(t,n,i,o){if(!a)return null;let s=c(t,o);if(s!==void 0&&e.varies&&!e.varies(s))return null;let l=Qx(n.meter);if(s===void 0||l===null||f(s,n.meter)===null)return null;let u=p(s,l);if(!u.length)return null;let d=u[hx(i,u.length)],m=r(d.apply(s),n.meter);return m&&{notes:m.notes,by:d.by}},*warm(e,t){let r=[...(t?.filed??[]).filter(l).map(e=>e.fragment.text).reverse(),...n.map(e=>e.text)],i=e.filter((t,n)=>e.findIndex(e=>im(e.meter,t.meter))===n);for(let{meter:e}of i){let t=Qx(e);if(t!==null)for(let n of r){if(u.has(`${n}\n${$x(e)}`))continue;let r=f(n,e);yield,a&&r!==null&&r.bars===1&&!d.has(`${t}\n${n}`)&&(p(n,t),yield)}}}}}let nS={kick:`bd`,rim:`rim`,snare:`sd`,clap:`cp`,closedHat:`hh`,pedalHat:`ph`,openHat:`oh`,ride:`rd`},rS=new Map([...Object.keys(nS).map(e=>[Uy[e],nS[e]]),[75,`claves`]]);function iS(e){if(e>=127)return`1`;let t=e/127;return(t*t).toFixed(6).replace(/0+$/,``).replace(/^0/,``)}function aS(e,t=tm){let n=e.length;if(n===0||n>=t)return null;let r=[...e].sort((e,t)=>e-t).join(),i=ta(n,t).flatMap((e,t)=>e?[t]:[]);for(let e=0;e<t;e++)if(i.map(n=>(n+e)%t).sort((e,t)=>e-t).join()===r)return{k:n,r:e};return null}let oS=e=>[...e].sort((e,t)=>e.step-t.step||e.note-t.note),sS=e=>e>=127?``:`:0:${iS(e)}`,cS=(e,t)=>Array.from({length:e},(e,n)=>t(n)).join(` `);function lS(e,t){let{role:n}=e[0],r=new Set(e.map(e=>e.note)),i=n===`euclid`&&r.size===1?aS(e.map(e=>e.step),t):null;if(i){let r=rS.get(e[0].note),a=t=>e.find(e=>e.step===t)?.velocity;return{lines:[`&${n} role=${n} step=1m &${r}(${i.k},${t},${i.r})`,`&${n}Level map=amp step=16n ${cS(t,e=>a(e)?iS(a(e)):`0`)}`],term:`&${n} * &${n}Level`}}return{lines:[`&${n} role=${n} step=16n ${cS(t,t=>{let n=e.filter(e=>e.step===t).map(e=>`&${rS.get(e.note)}${sS(e.velocity)}`);return n.length===0?`~`:n.length===1?n[0]:`[${n.join(`,`)}]`})}`],term:`&${n}`}}function uS(e,t){let n=oS(e),r=n.find(e=>!rS.has(e.note));if(r)throw Error(`grooveText: note ${r.note} is none of the kit's`);let i=$p.filter(e=>n.some(t=>t.role===e)).map(e=>lS(n.filter(t=>t.role===e),t));return[...i.flatMap(e=>e.lines),`&groove ${i.length?`[${i.map(e=>e.term).join(`, `)}]`:`~`}`].join(`
`)}let dS=e=>oS(e).map(e=>`${e.role}:${e.note}:${e.step}`).join(` `);function fS(e){let t=/* @__PURE__ */ new Map;for(let n of e){if(n.length<3)continue;let e=dS(n),r=t.get(e);r?r.count++:t.set(e,{count:1,first:n})}let n=null;for(let e of t.values())(!n||e.count>n.count)&&(n=e);return n?oS(n.first):null}function pS(e,t,n){if(!rS.has(e))return null;if(e===Uy.kick)return`kick`;if(e===Uy.rim)return`euclid`;if(e===Uy.pedalHat)return`pedal`;if(e!==Uy.snare&&e!==Uy.clap)return`hat`;let r=oe(n).heights;return Zy(n).map(e=>r[e]).includes(t)?`backbeat`:`ghost`}RegExp(`^&(${$p.join(`|`)}) (?!.*\\brole=)`,`gm`);let mS=[];function hS(e,t,n=.5){let r=[...e.map(e=>e.id)];for(let e of t)r.includes(e)||r.push(e);let i=ny(r.map(t=>e.find(e=>e.id===t)?.weight??0),n,t.map(e=>[r.indexOf(e),1]));return r.map((e,t)=>({id:e,weight:i[t]})).filter(e=>e.weight>=.25)}let gS=e=>e.map(e=>e.id);function _S({seed:e,index:t,style:n,history:r},i){let a=Tb(n);if(a===0||!z(R(e,`keyJump`,t),n.entropy*.6))return null;let o=k(i.tonic),s=[...Array(12).keys()].filter(e=>{let t=Math.abs(u(k(e)-o+6,12)-6);return t>0&&t<=a}).map(e=>({tonic:e,mode:i.mode})),c=s.map(e=>ib(r,e));return s[Ze(R(e,`keyJump`,t,1),ry(c,4))]}function vS({meter:e,swing:t=`16n`,repository:n,style:r,layer:i},a,o){if(e)return{meter:{meter:e,swing:t},found:null};let s=n?wm(n,r,a?.meterFragment??null,i,o,Em(r.entropy)):null;if(s)return{meter:{meter:s.meter,swing:s.swing.level,share:s.swing.share,meterFragment:s.id},found:s};if(n&&a){let{meter:e,swing:t,share:n,meterFragment:r}=a;return{meter:{meter:e,swing:t,...n===void 0?{}:{share:n},...r===void 0?{}:{meterFragment:r}},found:null}}return{meter:{meter:em,swing:t},found:null}}function yS({repository:e,style:t},n,r){return r&&e?.used?e.used(n,r.id,Cm(t)):n}function bS({rhythms:e,style:t,layer:n},r,i,a=[],o=[]){return e?pb(e,t,{meter:r.meter,meterFragment:r.meterFragment},i,n,a,o,Em(t.entropy)):{}}let xS=({seed:e,index:t,session:n},r,i=`groove`)=>({seed:e,index:t,point:r,tags:[i,...n===void 0?[]:[n]]}),SS=`bass line`;function CS(e,t,n,r,i){let a=Vm(e.rhythms,`rhythm`,`grooveVariation`,xS(e,Cm(e.style)),t,n,r.rhythmFragment,i);return{rhythm:a.id===r.rhythmFragment?r:{...r,rhythmFragment:a.id},layer:a.layer,playing:a.playing}}function wS(e,t,n,r){return Hm(e.rhythms,e.heard??[],e=>{let t=fS(e);return t&&{hits:t}},{meter:n.meter,meterFragment:n.meterFragment},xS({...e,index:e.index-1},r),t)}function TS(e,t,n,r){return Hm(e.bassLines,e.bassHeard??[],e=>{let t=xb(e);return t&&{notes:t}},{meter:n.meter,meterFragment:n.meterFragment},xS({...e,index:e.index-1},r,SS),t)}function ES(e,t,n,r,i){return n!==null&&e?.used?e.used(t,[n],i,r):t}let DS=`lead line`;function OS(e,t,n,r){return Hm(e.leads,e.leadHeard??[],e=>{let t=L(n.meter),r=by(e.map(e=>({...e,notes:e.notes.filter(e=>e.step<t)})),t,Qx(n.meter)??void 0);return r?.notes.length?{notes:r.notes,...r.text?{text:r.text}:{}}:null},{meter:n.meter,meterFragment:n.meterFragment},xS({...e,index:e.index-1},r,DS),t)}function kS({leads:e,style:t,layer:n},r,i,a=[],o=[]){return e?Sy(e,t,{meter:r.meter,meterFragment:r.meterFragment},i,n,a,o,Em(t.entropy)):void 0}let AS=`progression`;function jS(e,t,n){return Hm(e.harmonies,e.harmonyHeard??[],e=>{let t=Vy(e);return t&&{notes:t}},n.bench,xS({...e,index:e.index-2},n.point,AS),t)}function MS({harmonies:e,style:t,layer:n,seed:r,index:i},a,o,s,c,l,u=[]){let d={kind:a,index:i,mode:o.mode,harm:t.harm},f=a===`A`?l.B:a===`B`?l.A:null,p=e?By(e,t,s,{at:d,draw:R(r,`theme`,i,0),a:l.A??void 0,chosen:f===null?[]:[f],rejected:u,layer:n,pull:Em(t.entropy)}):void 0,m=p===void 0?null:e.read(p,s.meter,n);return p!==void 0&&m?{theme:zy(m,d),fragment:p}:{theme:Py({seed:r,index:i,kind:a,key:o,harm:t.harm,entropy:t.entropy,a:c.A}),fragment:null}}function NS({bassLines:e,style:t,layer:n,share:r},i,a,o=[],s=[]){return e?th(e,t,{meter:i.meter,meterFragment:i.meterFragment},{level:i.swing,share:i.share??r??.5},L(i.meter),a,n,o,s,Em(t.entropy)):void 0}let PS={initial:{before:null,themes:{A:null,B:null},layer:null,shortTerm:mS,asked:null,boredom:Tm,claveOwners:km,bassFragment:null,leadFragment:null,themeFragments:{A:null,B:null},earlier:null},advance(e,{before:t,themes:n,layer:r,shortTerm:i,asked:a,boredom:o,claveOwners:s,bassFragment:c,leadFragment:l,themeFragments:u,earlier:d}){let f=r??e.layer,p=f&&t&&a?wS(e,f,t,a):{layer:f,ids:[]},m=p.layer&&t&&a?TS(e,p.layer,t,a):{layer:p.layer,ids:[]},h=m.layer&&t&&a?OS(e,m.layer,t,a):{layer:m.layer,ids:[]},g=(h.layer&&d?jS(e,h.layer,d):{layer:h.layer,ids:[]}).layer,_=hS(i,[...p.ids,...m.ids,...h.ids]),v=gS(_),y={...e,layer:g},{seed:b,index:x,style:S,wish:C}=y,w=ct.advance({seed:b,index:x,style:S},t?.section??null,null).output,T=t?.key??Re,E=He(T,(t&&C.tonic===null&&C.mode===T.mode?_S(y,T):null)??C),D=C.melodic!==null&&Db(S).melodic.includes(C.melodic)?C.melodic:wb(S),O=vS(y,t,v),{meterFragment:k}=O.meter,A={meter:O.meter.meter,meterFragment:k},j=jm(o,s),M=Ty(w.type),N=M===`build`?null:n[M],ee=M===`build`?null:u[M],P=N&&N.mode===E.mode&&Math.abs(N.harm-S.harm)<=.2&&!z(R(b,`themeRenewal`,x),S.entropy*.3)&&(ee===null||!j.includes(ee))?{theme:N,fragment:ee}:MS(y,M,E,A,n,u,j),{theme:te}=P,ne=g?Vm(y.harmonies,Fy,`harmonyVariation`,xS(y,Cm(S),AS),g,o,P.fragment??void 0,A):{playing:null},re=bS(y,O.meter,t,[...v,...k===void 0?[]:[k]],jm(o,s)),F=g?CS(y,g,o,re,{meter:O.meter.meter,meterFragment:k}):{rhythm:re,layer:g,playing:null},{rhythm:I}=F,ie=NS(y,O.meter,c??void 0,[...v,...k===void 0?[]:[k]],jm(o,s)),ae=F.layer?Vm(y.bassLines,$m,`lineVariation`,xS(y,Cm(S),SS),F.layer,o,ie,{meter:O.meter.meter,meterFragment:k}):{id:ie,layer:F.layer,playing:null},L=ae.id,oe=kS(y,O.meter,l??void 0,[...v,...k===void 0?[]:[k]],jm(o,s)),se=ae.layer?Vm(y.leads,xy,`leadLineVariation`,xS(y,Cm(S),DS),ae.layer,o,oe,{meter:O.meter.meter,meterFragment:k}):{id:oe,layer:ae.layer,playing:null},ce=se.id,le={section:w,key:E,...O.meter,...I,melodic:D,theme:te},ue=[k,I.rhythmFragment,I.claveFragment,L,ce].filter(e=>e!==void 0);return{carried:{before:le,themes:M===`build`?n:{...n,[M]:te},layer:se.layer?ES(y.harmonies,Um(y.leads,Um(y.bassLines,Um(y.rhythms,yS(y,se.layer,O.found),[I.rhythmFragment,I.claveFragment],Cm(S),k),[L],Cm(S),k),[ce],Cm(S),k),P.fragment,[...k===void 0?[]:[k],...(M===`A`?u.B:M===`B`?u.A:null)??[]].filter(e=>e!==P.fragment),Cm(S)):null,shortTerm:hS(_,ue,1),asked:Cm(S),boredom:Fm(o,[F.playing,ae.playing,se.playing,ne.playing].filter(e=>e!==null),S.entropy),claveOwners:F.playing?Am(s,re):s,bassFragment:L??null,leadFragment:ce??null,themeFragments:M===`build`?u:{...u,[M]:P.fragment},earlier:a&&t?{point:a,bench:{meter:t.meter,...t.meterFragment===void 0?{}:{meterFragment:t.meterFragment}}}:null},output:le}}},FS={own:[],players:[]},IS={plans:PS.initial,next:null,history:eb,parts:{bass:bh.initial,comp:Ah.initial,lead:$h.initial},ear:null,kept:[],nextBar:0};function LS({seed:e,style:t,wish:n,meter:r,swing:i=Jm,repository:a,layer:o,rhythms:s,session:c,bassLines:l,leads:u,harmonies:d},f,p,m,h=null){let g=f%8,_=g===0?PS.advance({seed:e,index:f/8,style:t,wish:n,history:m,meter:r,swing:i.level,repository:a,layer:o,rhythms:s,heard:h&&h.section===f/8-1?VS(h.drums,`drummer`):[],session:c,share:i.share,bassLines:l,bassHeard:h&&h.section===f/8-1?VS(h.bass,`bassist`):[],leads:u,leadHeard:h&&h.section===f/8-1&&h.lead.players.length?VS({...h.lead,own:BS(h.leadBars)},`soloist`):[],harmonies:d,harmonyHeard:h&&f>=16?Hy(h.harmony,f-16):[]},p,null).carried:p,v=_.before,{key:y,theme:b}=v,x=tt({seed:e,barInSection:g,key:y,theme:b,harm:t.harm});return{plans:_,decided:{bar:f,plan:v,chords:x},history:tb(m,x)}}let RS=({swing:e=Jm},t)=>({level:t.swing,share:t.share??e.share});function zS(e,t,n){let r=e.bar%8;return{seed:e.seed,bar:e.bar,meter:t.plan.meter,plan:t.plan,barInSection:r,style:e.style,swing:RS(e,t.plan),barEnergy:ut(e.style.energy,t.plan.section.type,r),chords:t.chords,next:n,offer:e.offer,...e.restless===void 0?{}:{restless:e.restless}}}let BS=e=>e.map((e,t)=>({bar:t,notes:dy(Qh(e),e.plan.key)})).filter(e=>e.notes.length>0),VS=(e,t)=>[...e.own.length?[{source:t,bars:e.own}]:[],...e.players];function HS(e,t,n){let r=[...e.players],i=r.findIndex(e=>e.source===t);return i===-1?r.push({source:t,bars:[n]}):r[i]={source:t,bars:[...r[i].bars,n]},{...e,players:r}}function US(e,t,n,r){if(!e.rhythms&&!e.bassLines&&!e.leads&&!e.harmonies||n.layer===null)return null;let i=Math.floor(t.bar/8),a=r?.section===i?r:{section:i,drums:FS,bass:FS,lead:FS,unheard:null,leadBars:[],harmony:(r?.harmony??[]).filter(e=>Math.floor(e.bar/8)>=i-1)};if(a.unheard){let e={...a.unheard,next:t.chords},n=vh(e,bh.initial).output,r=yb(n,rt(e.chords,e.meter),rt(e.next,e.meter));a={...a,bass:{...a.bass,own:[...a.bass.own,r]},unheard:null}}if(e.rhythms&&t.plan.rhythmFragment===void 0){let n=zS(e,t,[]),r=Qy(n).map(e=>({role:e.role,note:e.note,step:e.step,velocity:Ub(n,e).velocity}));a={...a,drums:{...a.drums,own:[...a.drums.own,r]}}}e.bassLines&&n.bassFragment===null&&(a={...a,unheard:zS(e,t,[])}),e.leads&&n.leadFragment===null&&(a={...a,leadBars:[...a.leadBars,zS(e,t,[])]});for(let{source:t,bar:n,hits:r}of e.drumsHeard??[])Math.floor(n/8)===i&&(a={...a,drums:HS(a.drums,t,r)});for(let{source:t,bar:n,notes:r}of e.bassHeard??[])Math.floor(n/8)===i&&(a={...a,bass:HS(a.bass,t,r)});for(let{source:t,bar:n,notes:r,origin:o,confidence:s}of e.leadHeard??[])Math.floor(n/8)===i&&(a={...a,lead:HS(a.lead,t,{bar:n,origin:o,notes:r,confidence:s})});if(e.harmonies){let t=(e.harmonyHeard??[]).filter(e=>Math.floor(e.bar/8)>=i-1);t.length&&(a={...a,harmony:[...a.harmony,...t]})}return a}let WS=e=>({...e,style:xm(e.style)});function GS(e,t,n=!0){let r=n?Gb(e.loop,e.bar):null,i=r===null?void 0:t.kept.find(e=>e.decided.bar===r);if(i){let n={...i.decided,bar:e.bar},r=i.played&&{...i.played,bar:e.bar},a=e.loop.song===`runs`?GS(e,t,!1).carried:{...t,next:t.next&&{...t.next,bar:e.bar+1},nextBar:e.bar+1};return{here:n,at:i.plans,carried:{...a,kept:[...t.kept,{decided:n,plans:i.plans,played:r}].slice(-8)},replayed:i}}let{plans:a,history:o}=t,s=t.next;if(!s){if(e.bar!==0)throw Error(`band: bar ${e.bar}, but the song starts at bar 0`);({plans:a,decided:s,history:o}=LS(e,0,a,o))}else if(s.bar!==e.bar)throw Error(`band: bar ${e.bar}, but the band decided bar ${s.bar} next`);let c=US(e,s,a,t.ear),l=LS(e,e.bar+1,a,o,c);return{here:s,at:a,carried:{...t,plans:l.plans,next:l.decided,history:l.history,ear:c,kept:[...t.kept,{decided:s,plans:a,played:null}].slice(-8),nextBar:e.bar+1}}}let KS=(e,t)=>e.map(e=>e.decided.bar===t.bar?{...e,played:t}:e),qS={initial:IS,advance(e,t){let n=WS(e),{here:r,at:i,carried:a,replayed:o}=GS(n,t);if(o)return{carried:a,output:o.played?{...o.played,bar:n.bar}:JS(zS(n,r,r.chords),[])};let s=zS(n,r,a.next.chords),{barInSection:c}=s,l=n.bassLines?nh(n.bassLines,i.bassFragment??void 0,s.meter,c,L(s.meter),a.plans.layer??void 0):[],u=vh(s,t.parts.bass,l),d=Ah.advance(s,t.parts.comp,null),f=n.leads?wy(n.leads,i.leadFragment??void 0,s.meter,L(s.meter),a.plans.layer??void 0,s.style):null,p=f!==null&&i.leadFragment!=null&&(n.leads?.keyed?.(i.leadFragment,a.plans.layer??void 0)??!1),m=Zh(s,t.parts.lead,f,i.leadFragment??void 0,p),h={bass:u.carried,comp:d.carried,lead:m.carried},g=n.rhythms?mb(n.rhythms,r.plan,s.meter,c,L(s.meter),a.plans.layer??void 0):[],_=JS(s,[...vb(s,Qy(s),g),...u.output,...d.output,...m.output]);return{carried:{...a,parts:h,kept:KS(a.kept,_)},output:_}}};function JS(e,t){return{...e,written:t,dough:t.map(t=>Ub(e,t))}}let YS=/* @__PURE__ */ new WeakMap;function XS(e){if(YS.has(e))return YS.get(e);let t=null,n=e.ok?e.outputs.map(t=>e.cells.get(t.cell)?.clock).find(e=>!!e):void 0,r=n&&e.clocks.get(n)?.tap?e.clocks.get(n).tap.meter:n;for(let t=0;r&&t<16;t++){let t=e.cells.get(r)?.step?.driver;if(!t||!e.clocks.has(t))break;let n=e.clocks.get(t);if(e.cells.get(r)?.meter&&!e.cells.get(t)?.meter&&!n.positional&&n.swing===void 0&&!n.swung)break;r=t}let i=r?e.clocks.get(r):void 0,a=r?e.cells.get(r):void 0;if(i&&a&&!i.belt){let n=[...e.cells.values()].some(e=>e.name!==a.name&&e.step?.driver===a.name);(i.positional||a.meter||i.swing!==void 0||i.swung||a.beat!==1||n)&&(t={cell:a.name,beat:a.beat>0?a.beat:1})}return YS.set(e,t),t}function ZS(e,t,n){let r=XS(e.result);if(!r||!(n>t))return null;let i=Ku(e.result,e.statics).played(r.cell),a=r.beat/24,o=Math.min(n,e.end),s=e=>e<0?-1/0:i.q(e*a),c=i.stepAt(Math.max(0,t)),l=Number.isFinite(c)?Math.max(0,Math.floor(c/a-Tu)-1):0;for(;s(l)<t&&Number.isFinite(s(l));)l++;for(;l>0&&s(l-1)>=t;)l--;let u=[];for(let e=l;u.length<1e5;e++){let t=s(e);if(!(t<o))break;u.push(t)}return u.length?{first:l,at:u,before:s(l-1)}:null}function QS(e,t,n){if(!e.result.tapes.length)return[];let r=Ku(e.result,e.statics),i=[];for(let a of e.result.tapes){let o=ed(e.result,r,a.name);if(!o.moving&&!a.dropout&&!a.heads.some(e=>e.wander>0))continue;let s=[];for(let e=t;e<=n;e+=.05)s.push({at:e,speed:o.speed(e)});i.push({tape:a.name,points:s})}return i}function $S(e,t,n,r={}){return{from:t,to:t+n,events:Sf(e,t,t+n,!0,r),tapes:QS(e,t,t+n+1e-9),clock:ZS(e,t,t+n)}}function eC(e,t,n){let r=Hf(e,t,n);return mf(r,gi(r),r.off)}new Set(Wc.flatMap(e=>[e.name,...e.aliases]));let tC=qp(`instruments`);Object.fromEntries(Wc.map(e=>[e.note,e.name]));let nC=Object.fromEntries(tC.find(e=>e.id===`gm_kit`).text.split(`
`).flatMap(e=>{let t=/^&(\w+) (.*)$/.exec(e);return t?[[t[1],t[2]]]:[]}));[...Object.keys(nC)];let rC=2048;(()=>{let e=new Float64Array(rC);for(let t=0;t<rC;t++)e[t]=Math.sin(2*Math.PI*t/rC);return e})(),Math.log(3.8)/Math.log(200),qp(`instruments`),Object.fromEntries(ft.map((e,t)=>[e.name,vt[t]]));let iC=[...ix,...ax],aC=e=>{let t=/* @__PURE__ */ new Map;for(let n of e)t.set(n,(t.get(n)??0)+1);return t};function oC(e,t,n,r){let i=0;for(let[n,r]of e)i+=Math.min(r,t.get(n)??0);return n+r-2*i}let sC=e=>(Math.round(e*3840)/3840).toFixed(6),cC=(e,t)=>({bar:e,notes:aC(t),size:t.length,signature:[...t].sort().join(`|`)});function lC(e,t){let n=e.windows.get(t);if(n)return n;let{span:r,bar:i,notes:a}=e,o;if(t===null||r===null||i===null)o=[cC(0,a.map(e=>e.at===null?e.key:`${sC(e.at)} ${e.key}`))];else{let e=1e-9;o=(t<r-e?Array.from({length:Math.ceil(r/i-e)},(e,t)=>t):[0]).map(n=>{let o=[];for(let s of a)if(s.at===null)o.push(s.key);else for(let a=((s.at-n*i)%r+r)%r;a<t-e;a+=r)o.push(`${sC(a)} ${s.key}`);return cC(n,o)})}return e.windows.set(t,o),o}let uC=(e,t,n)=>({path:e,notes:t,span:n.span,bar:n.bar,windows:/* @__PURE__ */ new Map}),dC=e=>e.split(`
`).map(e=>V(e)[0].replace(/\s+/g,` `).trim());function fC(e,t){for(let n=e.indexOf(t);n>=0;n=e.indexOf(t,n+1)){let r=e.slice(0,n).trimEnd().at(-1),i=e.slice(n+t.length).trimStart()[0];if((r===`[`||r===`,`)&&(i===`]`||i===`,`||i===`*`))return!0}return!1}function pC({capacity:e=512}={}){if(!((Number.isInteger(e)||e===1/0)&&e>=1))throw Error(`createRecogniser: capacity is ${String(e)}, not a whole number ≥ 1 or Infinity`);let t=/* @__PURE__ */ new Map,n=/* @__PURE__ */ new WeakMap,r=(r,i)=>{let a=n.get(i);a===void 0&&n.set(i,a=JSON.stringify([i.workbench??``,i.operators,i.keep??[],i.fewest??1,i.degrees??null]));let o=`${a}\n${r}`,s=t.get(o);s&&t.delete(o);let c=s??{readings:dx(r,i),candidates:[]};return t.set(o,c),t.size>e&&t.delete(t.keys().next().value),c},i=(e,t)=>r(e,t).readings,a=/* @__PURE__ */ new WeakMap,o=(e,t)=>{let n=a.get(e)??/* @__PURE__ */ new Map;a.set(e,n);let r=n.get(t);if(!r){r=/* @__PURE__ */ new Map;for(let n of e)for(let e of lC(n,t)){let t=r.get(e.signature);(!t||n.path.length<t.path.length)&&r.set(e.signature,{path:n.path,bar:e.bar})}n.set(t,r)}return r},s=(e,t,n)=>{let i=r(e.text,t),a=i.candidates[n];if(a)return a;let o=[],s=i.readings;if(s.notes?.length){o.push(uC([],s.notes,s));let r=e=>({operator:e.rule,line:e.line,by:e.by});if(n>=1){for(let i of s.variations)if(o.push(uC([r(i.variation)],i.notes,s)),n>=2){let n=dx(i.variation.apply(e.text),t);for(let e of n.variations)o.push(uC([r(i.variation),r(e.variation)],e.notes,n))}}}return i.candidates[n]=o,o},c=(e,t,n)=>{let r=dC(e),a=/* @__PURE__ */ new Map;for(let e of r){let t=B(e.trim());if(t?.kind!==`use`)continue;let n=a.get(t.id);a.set(t.id,n===null||t.takes===null?null:[...n??[],...t.takes])}if(!a.size)return[];let o=[];for(let e of t){if(!a.has(e.id))continue;let t=a.get(e.id);for(let{variation:a}of i(e.text,n).variations){let n=a.reference;if(!(!n||t&&!t.includes(a.line))&&r.some(e=>{let t=/^&([A-Za-z_][A-Za-z0-9_]*)\s/.exec(e)?.[1],r=t?qt(e,t):null;return r&&[...r.attrs.filter(e=>e.startsWith(`base=`)),...r.braid].join(` `)===n.form||n.line(`r`).startsWith(`&r [`)&&fC(e,n.form)})){o.push({fragment:e,path:[{operator:a.rule,line:a.line,by:a.by}],bar:0,distance:0});break}}}return o};return{get size(){return t.size},recognise(e,t,n={}){let{tolerance:r=0,depth:a=1,operators:l=iC,...u}=n;if(!(Number.isInteger(r)&&r>=0))throw Error(`recognise: tolerance is ${String(r)}, not a whole number ≥ 0`);if(a!==0&&a!==1&&a!==2)throw Error(`recognise: depth is ${String(a)}, not 0, 1 or 2`);let d={...u,operators:l},f=c(e,t,d);if(f.length)return f;let p=i(e,d);if(!p.notes?.length)return[];let m=lC(uC([],p.notes,{...p,span:null}),null)[0],h=[];for(let e of t){let t=s(e,d,a);if(r===0){let n=o(t,p.span).get(m.signature);n&&h.push({fragment:e,...n,distance:0});continue}let n=null;for(let i of t)for(let t of lC(i,p.span)){if(Math.abs(t.size-m.size)>r)continue;let a=t.signature===m.signature?0:oC(t.notes,m.notes,t.size,m.size);a>r||(!n||a<n.distance||a===n.distance&&i.path.length<n.path.length)&&(n={fragment:e,path:i.path,bar:t.bar,distance:a})}n&&h.push(n)}return h.map((e,t)=>[e,t]).sort(([e,t],[n,r])=>e.distance-n.distance||e.path.length-n.path.length||e.bar-n.bar||t-r).map(([e])=>e)}}}let mC=`taken`,hC=2048,gC=/* @__PURE__ */ new Map;function _C(e,t){return n=>{let r=`${e}\u0000${n}`,i=gC.get(r);if(i)return gC.delete(r),gC.set(r,i),i;let a=Hf(n,void 0,{resolve:t});return gC.set(r,a),gC.size>hC&&gC.delete(gC.keys().next().value),a}}let vC=/* @__PURE__ */ new Map;function yC(e){let t=vC.get(e);return t||(t=np(e),vC.set(e,t),vC.size>hC&&vC.delete(vC.keys().next().value)),t}function bC(e,t){let n=new Map(yC(t).map(e=>[e.name,e.code]));return yC(e).some(e=>n.has(e.name)&&n.get(e.name)!==e.code)}function xC(e,t){if(Qo(e)||bC(e,t))return null;let n=new Map(yC(t).map(e=>[e.name,e.code])),r=t.replace(/\s+$/,``),i=yC(e).filter(e=>n.get(e.name)!==e.code).map(e=>e.written);return[...r?[r]:[],...i].join(`
`)}function SC(e,t,n){let r=$o(e)!==null,i=(t,n)=>r&&t===mC?e:Hv(t,n),a=_C(r?e:``,i);return{text:r?bp(t,mC,{resolve:i,compiled:a,...n}).text:xC(e,t)??xp(mC,t,{resolve:(t,n)=>t===mC?e:Hv(t,n),compiled:a}).text,resolve:i,compiled:a}}let CC=({text:e,compiled:t})=>t(e),wC=[`transpose`,`invert`,`bend`,`trim`],TC=e=>[`&bar meter("${e}") step=120bpm`,`&key scale(ionian, C)`].join(`
`),EC=({degree:e,alter:t})=>`${e}${(t>0?`#`:`b`).repeat(Math.abs(t))}`;function DC(e,t){let n=[...e].sort((e,t)=>e.step-t.step),r=eS(n.map(e=>e.step),t),i=Math.max(1,Math.ceil(((n.at(-1)?.step??0)+1)/t)),a=Array.from({length:i*t/r.length},(e,t)=>{let i=n.find(e=>e.step===t*r.length);return i?EC(i):`~`});return`&lead over=&key step=${r.tap} ${a.join(` `)}`}function OC(e,t){let n=Qx(t);if(!n)return null;let r=CC(SC(e,TC(n),{head:`&lead`,main:`&key`}));if(!r.ok)return null;let i=r.cells.get(`lead`);if(!i?.step)return null;let a=r.cells.get(i.step.driver)?.meter??null,{tap:o}=i.step,s=vv(o,a);if(s===null||!a||!o||i.steps<1)return null;let c=L(t),l=a.pulses/a.unit/c,u=i.steps*s/(l*c);if(u<1-1e-9)return kC(e,t,o,i.steps,u);if(Math.abs(u-Math.round(u))>1e-9)return null;let d=Math.round(u),f=[],p=gi(r);for(let e of kd(r,`lead`,p)){if(e.table!==`key`||e.tableShift!==0||(e.transpose??0)!==0)return null;let t=e.step*s/l,n=Math.round(t);if(Math.abs(t-n)>1e-6||n<0||n>=d*c)return null;let{value:i,alter:a}=Ad(r,e,p);f.push({step:n,degree:i+0,alter:a+0})}return f.length?{bars:d,notes:f.sort((e,t)=>e.step-t.step)}:null}function kC(e,t,n,r,i){let a=r/i-r;return Math.abs(a-Math.round(a))>1e-9||Math.round(a)<1?null:OC(`${e.replace(/^&lead(?=\s)/m,`&leadLine`)}\n&lead step=${n} &leadLine ~@${Math.round(a)}`,t)}function AC(e){let t=RegExp(`^&${Fv(e.id)}(?=\\s)`,`m`),n=es(e.text).replace(t,`&lead`);return{...e,text:n,association:e.association.map(e=>e.facet===`motif`?{...e,facet:xy}:e)}}let jC=/* @__PURE__ */ new Map;function MC(e){if(!jC.has(e.text)){let t=Object.keys(I).find(t=>OC(e.text,I[t])),n=t?OC(e.text,I[t]).notes[0].degree:0,r=t&&n!==0?ux(e.text,{workbench:TC(t),operators:[`transpose`],degrees:[-n]})[0]:void 0;jC.set(e.text,r?r.apply(e.text):e.text)}return{...e,text:jC.get(e.text)}}let NC=Rx.map(AC);function PC(e=NC,t=OC){return{...tS({facet:xy,fragments:e,read:t,text:DC,vary:e=>({workbench:TC(e),operators:wC,degrees:[2]}),varies:e=>!IC(e)}),phrase:(e,t,n,r)=>{let i=r===void 0?void 0:VC(r);return i?WC(e,t,i.form,i.args):WC(e,t,n?BC(n):LC)},keyed:(t,n)=>FC(e,t,n)}}function FC(e,t,n){let r=/* @__PURE__ */ new Set;for(let i=t;i!==void 0&&!r.has(i);){if(e.some(e=>e.id===i))return!0;let t=n?.filed.find(e=>e.fragment.id===i);if(t&&IC(t.fragment.text))return!0;r.add(i);let a=n?.filed.find(e=>e.fragment.id===i)?.meta.varies;i=typeof a==`string`?a:void 0}return!1}let IC=e=>/^&\w+ from \w/m.test(e);PC();let LC=zx.find(e=>e.id===`call_and_answer`),RC=Ip(zx),zC=/* @__PURE__ */ new Map;function BC(e){let t=JSON.stringify(e);if(!zC.has(t)){let[n]=RC.query(e,1,{},{facet:`form`});zC.set(t,n&&n.distance<=.3?n.fragment:LC)}return zC.get(t)}function VC(e){for(let t of Iv(e)){let e=zx.find(e=>e.id===t.id);if(e)return{form:e,args:t.args}}}function HC(e){let t=$o(e.text);return t?.main&&t.names.length===1?t.names[0]:null}let UC=/* @__PURE__ */ new Map;function WC(e,t,n,r={}){let i=L(t);if(i%2!=0||e.some(e=>e.step%2!=0||e.step>=i))return null;let a=Array.from({length:i/2},(t,n)=>{let r=e.find(e=>e.step===2*n);return r?EC(r):`~`}),o=Object.entries(r),s=`${n.id}(${o.join(` `)})\n${t.cycle}:${t.heights.join(` `)}\n${a.join(` `)}`;if(!UC.has(s)){let e=HC(n),r=o.flatMap(([,e])=>e.includes(`/`)?[`&${Fv(e)} from ${Pv(e)} &key`]:[]),i=Object.fromEntries(o.map(([e,t])=>[e,t.includes(`/`)?`&${Fv(t)}`:t])),c=e&&bp([...r,`&leadCall over=&key step=8n ${a.join(` `)}`].join(`
`),n.id,{resolve:(e,t)=>e===n.id?n.text:Hv(e,t),head:e,main:`&leadCall`,...o.length?{args:i}:{}});UC.set(s,c?OC(`${c.text}\n&lead step=8n ${e}`,t):null)}return UC.get(s)}let GC=e=>8/e;function KC(e){let t=Hf(Xt(e.text,`bar`,`step`,`120bpm`)),n=t.diagnostics.filter(e=>e.severity===`error`);if(n.length)return`it doesn't compile: ${n.map(e=>e.message).join(`; `)}`;let r=t.cells.get(`bar`)?.meter;if(!r)return`it has no meter named &bar`;if(r.legato?.length)return`it articulates by level (legato=), which the band does not read`;let i=GC(r.unit),a=r.beats.reduce((e,t,n)=>[...e,n===0?0:e[n-1]+r.beats[n-1]*i],[]),o={cycle:r.pulses*i,heights:a},s=Object.values(I).find(e=>im(e,o));if(!s)return`its meter, ${a.length} beats in ${o.cycle} eighths at ${a.join(` `)}, is none of the band's`;let c=r.swing??[];if(c.length>1)return`it swings on more than one level`;let[l]=c;return l?qm.includes(l.level)?{id:e.id,meter:s,swing:{level:l.level,share:l.share}}:`it swings on ${l.level}, which the band does not`:{id:e.id,meter:s,swing:Jm}}Mx.map(e=>({id:e.id,read:KC(e)}));function qC(e=Mx){let t=/* @__PURE__ */ new Map;for(let n of e){let e=KC(n);typeof e!=`string`&&t.set(n.id,e)}let n=Ip([...e.filter(e=>t.has(e.id)),...Nx]),r=t.size+Nx.length;return{fragments:t,query:(e,i,a=[],o)=>(i?n.query(e,r+i.filed.length,{},{facet:`meter`,layer:i,...a.length?{chosen:a}:{},...o===void 0?{}:{pull:o}}).filter(e=>t.has(e.fragment.id)):n.query(e,t.size,{},{facet:`meter`})).map(e=>({id:e.fragment.id,distance:e.distance})),used:(e,t,r)=>Hx(kx(n,e,[{id:t,point:r,facet:`meter`}]))}}let JC=qC(),YC=[...Mx,...Nx,...Px,...Fx,...NC];new Map([...[...zo].map(([e,{document:t,head:n}])=>[e,`${t}/${n}`]),[`waltz`,`waltzBar`],[`korobeiniki`,`korobeinikiBar`]]);let XC=2048,ZC=e=>Object.keys(I).find(t=>im(I[t],e))??null,QC=e=>Qo(e)?e.split(`
`).filter(e=>!Qo(e)).join(`
`):e,$C=e=>`&bar meter("${e}") step=120bpm`,ew=fp(Hv,XC),tw=(e,t)=>xC(e,t)??ew(e,t).text;function nw({meter:e,meterFragment:t}){let n=Mx.find(e=>e.id===t);if(n)return Xt(n.text,`bar`,`step`,`120bpm`);let r=ZC(e);return r?$C(r):null}function rw(e){let t=/^&(\w+) \[(.*)\]$/m.exec(e);return t?{line:t[0],name:t[1],terms:t[2].split(`, `)}:null}let iw=$p,aw=(e,t,n,r)=>iw.includes(e)?e:pS(t,n%L(r),r),ow=e=>Math.abs(e-Math.round(e))<1e-6?Math.round(e):e;function sw(e,t){let n=QC(e);return!ZC(t)||!rw(n)?null:uw(n,t,lw(n))}let cw=/* @__PURE__ */ new Map;function lw(e){let t=cw.get(e);return t===void 0&&(t=Math.max(1,...$f(e,Hf).clock.map(e=>e.bars)),cw.set(e,t),cw.size>XC&&cw.delete(cw.keys().next().value)),t}function uw(e,t,n,r){let i=ZC(t),a=rw(e);if(!i||!a)return null;let o=$y(120,t),s=L(t)*n,c=[];for(let n of a.terms){let l=/^&(\w+)/.exec(n)[1];if(r!==void 0&&l!==r)continue;let u=e.replace(a.line,`&${a.name} map=midi(10) [${n}]`),d=eC(tw(Zx(u),$C(i)),void 0,{resolve:Hv}),f=cl(d.result,rl(d.result));for(let e of $S(d,0,s*o).events)for(let n of sl(f(e))){let r=ll(e,n);if(!r||r.channel!==10)continue;let i=ow(r.at/o);if(!Number.isInteger(i)||i>=s)return null;let a=aw(l,r.note,i,t);if(a===null)return null;c.push({role:a,...a===l?{}:{line:l},note:r.note,step:i,velocity:r.velocity})}}return{bars:n,hits:fw(c)}}let dw=e=>({bars:e.bars,hits:e.hits.map(({role:e,note:t,step:n,velocity:r})=>({role:e,note:t,step:n,velocity:r}))}),fw=e=>[...e].sort((e,t)=>e.step-t.step||e.note-t.note),pw=e=>`${e.cycle}:${e.heights.join(` `)}`,mw=({fragment:e})=>e.association.some(e=>e.facet===`rhythm`),hw=/* @__PURE__ */ new WeakMap;function gw(e=Nx){let t=hw.get(e);return t||hw.set(e,t=e.filter(e=>!e.association.some(e=>e.facet===`rhythm`)||sw(e.text,I[`4/4`])!==null).map(e=>({...e,text:QC(e.text)}))),[...t]}function _w(e=Nx,t=(e,t)=>ew(e,t).fits,n=sw){e=gw(e);let r=Ip([...e,...Mx]),i=new Map(e.map(e=>[e.id,e.text])),a=(e,t)=>i.get(e)??t?.filed.find(t=>t.fragment.id===e)?.fragment.text,o=/* @__PURE__ */ new Map,s=/* @__PURE__ */ new Map,c=/* @__PURE__ */ new Map,l=/* @__PURE__ */ new Map,u=/* @__PURE__ */ new Map,d=/* @__PURE__ */ new Set,f=/* @__PURE__ */ new Map,p=(e,n)=>{let r=`${n.length}:${n}${e}`;return o.has(r)||o.set(r,t(e,n)),o.get(r)},m=e=>`${e.meterFragment??``}\n${pw(e.meter)}`,h=e=>{let t=m(e);return c.has(t)||c.set(t,nw(e)),c.get(t)},g=(e,t)=>{let n=`${e}\n${t}`;return l.has(n)||l.set(n,tw(e,t)),l.get(n)},_=(e,t,n)=>{let r=`${e}\n${t}\n${n}`;if(!u.has(r)){let a=i.get(e);u.set(r,a!==void 0&&a!==t&&!bC(a,g(t,n)))}return u.get(r)},v=(t,n,a,o,s)=>r.query(t,e.length+Mx.length+(n?.filed.length??0),{},{facet:`rhythm`,...n?{layer:n}:{},...a.length?{chosen:a}:{},...s===void 0?{}:{pull:s}}).filter(e=>i.has(e.fragment.id)||e.distance<=o).map(e=>({id:e.fragment.id,text:e.fragment.text,distance:e.distance})),y=(e,t)=>{let r=`${e}\n${pw(t)}`;return s.has(r)||s.set(r,n(e,t)),s.get(r)},b=(e,t)=>y(e,t)!==null,x=(e,t)=>{let n=`${t.length}:${t}${e}`;return f.has(n)||f.set(n,ux(e,{workbench:[t,...Yx(e)].join(`
`),keep:Dm,fewest:3,resolve:Hv})),f.get(n)};return{query(e,t,n,r=[],i=1/0,a){let o=h(t);return o===null?[]:v(e,n,r,i,a).filter(e=>p(e.text,o)&&b(e.text,t.meter)).map(({id:e,distance:t})=>({id:e,distance:t}))},layered(e,t,n,r,i=1/0,o=[],s){let c=h(t),l=a(n,r);return c===null||l===void 0?[]:v(e,r,[n,...o],i,s).filter(e=>e.distance<=i&&_(e.id,l,c)&&p(e.text,c)&&b(e.text,t.meter)).map(({id:e,distance:t})=>({id:e,distance:t}))},used:(e,t,n,i=[])=>Hx(kx(r,e,[...Ux(r,e,t).map(e=>({id:e,point:n,facet:`rhythm`})),...Ux(r,e,i).map(e=>({id:e}))])),file(e,{hits:t,bench:n,point:i,source:a,created:c,tags:l,varies:u,by:d}){let f=uS(t,L(n.meter)),p=Ax(r,e,{text:f,point:i,facet:`rhythm`,source:a,created:c,meta:{tags:[...l],...u===void 0?{}:{varies:u},...d===void 0?{}:{by:d}}}),{meterFragment:m}=n,g=m===void 0?p.layer:kx(r,p.layer,[{id:p.id},{id:m}]),_=`${f}\n${pw(n.meter)}`;p.file&&!s.has(_)&&s.set(_,{bars:1,hits:fw(t)});let v=h(n);return p.file&&v!==null&&o.set(`${v.length}:${v}${f}`,!0),{layer:Hx(g),id:p.id,held:p.file===null}},read(e,t,n){let r=a(e,n),i=r===void 0?null:y(r,t);return i&&dw(i)},vary(e,t,n,r){let i=a(e,r),o=h(t),s=i===void 0?null:y(i,t.meter);if(i===void 0||o===null||s===null)return null;let c=x(i,o);if(!c.length)return null;let l=c[hx(n,c.length)],u=l.line.slice(1),d=uw(l.apply(i),t.meter,s.bars,u);return d===null?null:{hits:dw({bars:s.bars,hits:fw([...s.hits.filter(e=>(e.line??e.role)!==u),...d.hits])}).hits,by:l.by}},*warm(t,n){let r=[...(n?.filed??[]).filter(mw).map(e=>e.fragment.text).reverse(),...e.map(e=>e.text)];for(let n of t){let t=c.has(m(n)),i=h(n);if(t||(yield),i!==null)for(let t of r){let r=`${i.length}:${i}${t}`;if(d.has(r))continue;if(d.add(r),!p(t,i)){yield;continue}let a=y(t,n.meter);yield,a!==null&&a.bars===1&&!fb(a)&&(x(t,i),yield),g(t,i),yield;for(let r of e)_(r.id,t,i)&&(p(r.text,i),y(r.text,n.meter)),yield}}}}}let vw=[...[...JC.fragments.values()].map(e=>({meter:e.meter,meterFragment:e.id})),...Object.values(I).map(e=>({meter:e}))];_w();let yw=[`&bassOut map=midi(2) [&bassline * &bassV]`],bw=e=>[`&bar meter("${e}") step=120bpm`,`&key scale(ionian, C)`,`&harm over=&key step=1m [0,2,4]`].join(`
`),xw=e=>Math.abs(e-Math.round(e))<1e-6?Math.round(e):e,Sw=(e,t)=>t===0?e:Sw(t,e%t);function Cw(e,t){let n=Qx(t);if(!n)return null;let r=SC(e,Zx([bw(n),...yw].join(`
`)),{head:`&bassline`,main:`&harm`}),i=Zx(r.text),a=CC({...r,text:i});if(!a.ok)return null;let o=bv(Ss(i,{resolve:r.resolve}).text,a).filter(e=>e.pitched);if(o.length!==1)return null;let[s]=o;if(s.pitched.table!==`harm`||s.stepWhole===null||!s.meter)return null;let c=kd(a,s.trigger,gi(a)),l=[];for(let e of s.notes){let t=c.find(t=>Math.abs(t.step-e.step)<1e-9);if(!t||t.table!==`harm`||t.via||t.tableShift<0||t.tableShift>1)return null;l.push({chord:t.tableShift,index:t.value+0,alter:t.alter+0,shift:(t.transpose??0)+0})}if(!l.length)return null;let u=s.meter.pulses/s.meter.unit,d=Math.ceil(u/s.stepWhole-1e-9),f=s.steps/Sw(s.steps,d),p=L(t),m=$y(120,t),h=eC(i,void 0,{resolve:r.resolve}),g=cl(h.result,rl(h.result)),_=[];for(let e of $S(h,0,f*p*m).events)for(let t of sl(g(e))){let n=ll(e,t);if(!n)continue;let r=xw(n.at/m);if(!Number.isInteger(r)||r>=f*p)return null;_.push(r)}return _.sort((e,t)=>e-t),{bars:f,notes:_.map((e,t)=>({step:e,...l[t%l.length]}))}}function ww(e){if(e.alter!==0)throw Error(`lineText: an accidental (${JSON.stringify(e)})`);if(e.chord===0&&e.shift===0)return String(e.index);let t=e.chord===1?`&bassNext`:`&bassRoot`,n=e.shift===0?t:`${t}^$${e.shift}`;return e.index===0?n:e.shift===0?`${t}^${e.index}`:`degree(${n}, ${e.index})`}function Tw(e,t){let n=[...e].sort((e,t)=>e.step-t.step),r=eS(n.map(e=>e.step),t),i=Array.from({length:t/r.length},(e,t)=>{let i=n.find(e=>e.step===t*r.length);return i?ww(i):`~`}),a=e=>n.some(t=>ww(t).includes(e));return[`&bassline from &harm`,`&bassline over=&harm step=${r.tap} ${i.join(` `)}`,...a(`&bassNext`)?[`&bassNext over=&harm[>>] 0`]:[],...a(`&bassRoot`)?[`&bassRoot over=&harm 0`]:[]].join(`
`)}function Ew(e=Px,t=Cw){return tS({facet:$m,fragments:e,read:t,text:Tw,vary:e=>({workbench:bw(e),operators:ax})})}Ew();function Dw(e){let{min:t,max:n}=_m.bpm;return(Math.log(e)-Math.log(t))/(Math.log(n)-Math.log(t))}let Ow=bm.map(e=>({name:e.name,at:{...e.style,bpm:Dw(e.style.bpm)}}));bm.map((e,t)=>({id:e.id,name:e.name,point:Ow[t].at,tempo:e.style.bpm}));let kw=[...Ie.map(e=>({mode:e,steps:c(P(e))})),{mode:`aeolian`,steps:c({cycle:12,heights:[0,2,3,5,7,8,11]})}];function Aw(e){let t=[`&bar meter("4/4") step=120bpm
&tonic C`,...Yx(e.text)].join(`
`),n=CC(SC(e.text,t,{head:`&key`,main:`&tonic`})),r=n.diagnostics.filter(e=>e.severity===`error`);if(r.length)return`it doesn't compile: ${r.map(e=>e.message).join(`; `)}`;let i=n.mainKey===void 0?void 0:n.cells.get(n.mainKey);if(!i?.scan)return`it has no key, a scale(…)`;if(!$f(e.text,Hf).signature?.main)return"its tonic is fixed, which the key plan sets: a main parameter (`&key from &tonic`) leaves it to the host";let{lap:a,steps:o}=i.scan,s=kw.find(e=>a===12&&e.steps.join(` `)===o.join(` `))?.mode;return s?{id:e.id,mode:s}:`its scale, ${o.join(` `)}, is none of the composer's modes`}Lx.map(e=>({id:e.id,read:Aw(e)}));function jw(e=Lx){let t=/* @__PURE__ */ new Map;for(let n of e){let e=Aw(n);typeof e!=`string`&&t.set(n.id,e)}let n=Ip(e.filter(e=>t.has(e.id)));return{fragments:t,query:e=>n.query(e,t.size,{},{facet:`mode`}).map(e=>({id:e.fragment.id,distance:e.distance}))}}jw();let Mw=e=>[`&bar meter("${e}") step=120bpm`,`&key scale(ionian, C)`].join(`
`),Nw=({degree:e,alter:t})=>`${e}${(t<0?`b`:`#`).repeat(Math.abs(t))}`,Pw=({degree:e,stack:t})=>`[${(t??[0,2,4].map(t=>({degree:e+t,alter:0}))).map(Nw).join(`,`)}]`,Fw=[3,4,5];function Iw(e){let t=Array.from({length:8},(t,n)=>{let r=e.filter(e=>Math.floor(e.step/16)===n),i=e=>r.find(t=>t.step%16===e),a=Pw(i(0)),o=i(8);return o&&Pw(o)!==a?`[${a} ${Pw(o)}]`:a}),n=[];for(let e=0;e<t.length;){let r=1;for(;e+r<t.length&&t[e+r]===t[e];)r++;n.push(r>1?`${t[e]}!${r}`:t[e]),e+=r}return`&harm from &key\n&harm over=&key step=1m cycle=8 ${n.join(` `)}`}function Lw(e,t){let n=Qx(t);if(!n)return null;let r=CC(SC(e,Mw(n),{head:`&harm`,main:`&key`}));if(!r.ok)return null;let i=r.cells.get(`harm`);if(!i?.step)return null;let a=r.cells.get(i.step.driver)?.meter??null,o=vv(i.step.tap,a);if(o===null||!a)return null;let s=a.pulses/a.unit,c=i.steps*o/s,l=8/c;if(Math.abs(l-Math.round(l))>1e-9)return null;let u=/* @__PURE__ */ new Map;for(let e of kd(r,`harm`,gi(r))){if(e.table!==`key`||e.via||e.tableShift!==0||(e.transpose??0)!==0||Math.abs(e.alter)>1)return null;let t=e.step*o/s,n=Math.round(t*16);if(Math.abs(t*16-n)>1e-6||n%8!=0||n<0||n>=c*16)return null;for(let t=0;t<Math.round(l);t++){let r=n+Math.round(t*c*16);u.set(r,[...u.get(r)??[],{degree:e.value,alter:e.alter}])}}let d=[];for(let[e,t]of[...u].sort(([e],[t])=>e-t)){let n=t.sort((e,t)=>e.degree-t.degree||e.alter-t.alter);if(n.some((e,t)=>t>0&&e.degree===n[t-1].degree))return null;let r=n[0].degree,i=(r%7+7)%7;if(n.map(Nw).join(` `)===`${r} ${r+2} ${r+4}`)d.push({step:e,degree:i});else if(Fw.includes(n.length))d.push({step:e,degree:i,stack:n});else return null}for(let e=0;e<8;e++)if(!d.some(t=>t.step===e*16))return null;return{bars:8,notes:d.filter(e=>e.step%16==0||Pw(d.find(t=>t.step===e.step-8))!==Pw(e))}}function Rw(e,t=Lw){let n;return r=>(n??=new Map(e.flatMap(e=>{let n=t(e.text,I[`4/4`]);return n?[[JSON.stringify(n.notes),e.text.trim()]]:[]})),n.get(JSON.stringify(r))??Iw(r))}function zw(e=Fx,t=Lw){let n=Rw(e,t);return tS({facet:Fy,fragments:e,read:t,text:e=>n(e),bars:8})}zw();let Bw=[`sync`,`harm`,`artic`,`energy`,`bpm`],Vw=[`key`,`meter`];[...Bw,...Vw];let Hw=[`rhythm`,`bass`,`lead`,`harmony`],Uw=e=>t=>t.association.some(t=>t.facet===e);function Ww(e,t,n){let r=t=>e===`lead`?MC(t):e===`rhythm`?{...t,text:QC(t.text)}:t;return[...YC.filter(Uw(e)).map(r),...(t?.filed??[]).map(e=>e.fragment).filter(Uw(e)).map(r),...[...new Set(n?.[e]??[])].map((t,n)=>({id:`lately ${e} ${n}`,text:t,association:[]}))]}let Gw={rhythm:Yx([`&kit ${[...new Set(rS.values())].map(e=>`&${e}`).join(` `)}`,...YC.filter(Uw(`rhythm`)).map(e=>QC(e.text))].join(`
`)),bass:Yx([...yw,...YC.filter(Uw(`bass`)).map(e=>e.text)].join(`
`)),lead:[],harmony:[]},Kw={rhythm:ix,bass:ax,lead:wC,harmony:[]};function qw(e,t){let n=Qx(t.meter);if(n===null)return null;let r=e===`rhythm`?nw(t):e===`bass`?bw(n):e===`lead`?TC(n):Mw(n);if(r===null)return null;let i=[r,...Gw[e]].join(`
`),a=Kw[e];return e===`rhythm`?{workbench:i,operators:a,keep:Dm,fewest:3}:e===`lead`?{workbench:i,operators:a,degrees:[2]}:{workbench:i,operators:a}}function Jw(e,t,n,r,i=0,a){let o={};for(let s of Hw){let c=t[s];if(c===void 0)continue;let l=qw(s,n);o[s]=l!==null&&e.recognise(c,Ww(s,r,a),{...l,tolerance:i}).length>0}return o}function Yw(){let e=pC();for(let t of Hw){let n=Ww(t);for(let r of vw){let i=qw(t,r);if(i)for(let t of n)e.recognise(t.text,n,i)}}return e}qS.initial,ly.initial,Qm(Jm);function Xw(e,{bar:t,texts:n,bench:r,layer:i,lately:a},o=()=>performance.now()){let s=o();return{bar:t,recognition:Jw(e,n,r,i??void 0,0,a),cost:o()-s}}function Zw(){let e=null;return t=>`warm`in t?(e??=Yw(),{id:t.id,heard:null}):{id:t.id,heard:Xw(e??=pC(),t.hear)}}let Qw=Zw(),$w=self;$w.onmessage=({data:e})=>$w.postMessage(Qw(e))})();