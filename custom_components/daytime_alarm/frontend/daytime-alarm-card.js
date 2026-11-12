var Xt=Object.defineProperty;var te=Object.getOwnPropertyDescriptor;var b=(n,e,t,i)=>{for(var s=i>1?void 0:i?te(e,t):e,r=n.length-1,o;r>=0;r--)(o=n[r])&&(s=(i?o(e,t,s):o(s))||s);return i&&s&&Xt(e,t,s),s};var G=globalThis,Z=G.ShadowRoot&&(G.ShadyCSS===void 0||G.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,at=Symbol(),Et=new WeakMap,N=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==at)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(Z&&e===void 0){let i=t!==void 0&&t.length===1;i&&(e=Et.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&Et.set(t,e))}return e}toString(){return this.cssText}},Ct=n=>new N(typeof n=="string"?n:n+"",void 0,at),ct=(n,...e)=>{let t=n.length===1?n[0]:e.reduce((i,s,r)=>i+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+n[r+1],n[0]);return new N(t,n,at)},Tt=(n,e)=>{if(Z)n.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let i=document.createElement("style"),s=G.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=t.cssText,n.appendChild(i)}},lt=Z?n=>n:n=>n instanceof CSSStyleSheet?(e=>{let t="";for(let i of e.cssRules)t+=i.cssText;return Ct(t)})(n):n;var{is:ee,defineProperty:ie,getOwnPropertyDescriptor:se,getOwnPropertyNames:ne,getOwnPropertySymbols:re,getPrototypeOf:oe}=Object,Y=globalThis,zt=Y.trustedTypes,ae=zt?zt.emptyScript:"",ce=Y.reactiveElementPolyfillSupport,U=(n,e)=>n,R={toAttribute(n,e){switch(e){case Boolean:n=n?ae:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,e){let t=n;switch(e){case Boolean:t=n!==null;break;case Number:t=n===null?null:Number(n);break;case Object:case Array:try{t=JSON.parse(n)}catch{t=null}}return t}},J=(n,e)=>!ee(n,e),Pt={attribute:!0,type:String,converter:R,reflect:!1,useDefault:!1,hasChanged:J};Symbol.metadata??=Symbol("metadata"),Y.litPropertyMetadata??=new WeakMap;var x=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Pt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let i=Symbol(),s=this.getPropertyDescriptor(e,i,t);s!==void 0&&ie(this.prototype,e,s)}}static getPropertyDescriptor(e,t,i){let{get:s,set:r}=se(this.prototype,e)??{get(){return this[t]},set(o){this[t]=o}};return{get:s,set(o){let c=s?.call(this);r?.call(this,o),this.requestUpdate(e,c,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Pt}static _$Ei(){if(this.hasOwnProperty(U("elementProperties")))return;let e=oe(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(U("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(U("properties"))){let t=this.properties,i=[...ne(t),...re(t)];for(let s of i)this.createProperty(s,t[s])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[i,s]of t)this.elementProperties.set(i,s)}this._$Eh=new Map;for(let[t,i]of this.elementProperties){let s=this._$Eu(t,i);s!==void 0&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let i=new Set(e.flat(1/0).reverse());for(let s of i)t.unshift(lt(s))}else e!==void 0&&t.push(lt(e));return t}static _$Eu(e,t){let i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Tt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){let i=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,i);if(s!==void 0&&i.reflect===!0){let r=(i.converter?.toAttribute!==void 0?i.converter:R).toAttribute(t,i.type);this._$Em=e,r==null?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(e,t){let i=this.constructor,s=i._$Eh.get(e);if(s!==void 0&&this._$Em!==s){let r=i.getPropertyOptions(s),o=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:R;this._$Em=s;let c=o.fromAttribute(t,r.type);this[s]=c??this._$Ej?.get(s)??c,this._$Em=null}}requestUpdate(e,t,i,s=!1,r){if(e!==void 0){let o=this.constructor;if(s===!1&&(r=this[e]),i??=o.getPropertyOptions(e),!((i.hasChanged??J)(r,t)||i.useDefault&&i.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,i))))return;this.C(e,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:s,wrapped:r},o){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),r!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),s===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[s,r]of this._$Ep)this[s]=r;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[s,r]of i){let{wrapped:o}=r,c=this[s];o!==!0||this._$AL.has(s)||c===void 0||this.C(s,void 0,r,c)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[U("elementProperties")]=new Map,x[U("finalized")]=new Map,ce?.({ReactiveElement:x}),(Y.reactiveElementVersions??=[]).push("2.1.2");var gt=globalThis,Ht=n=>n,Q=gt.trustedTypes,Mt=Q?Q.createPolicy("lit-html",{createHTML:n=>n}):void 0,Dt="$lit$",k=`lit$${Math.random().toFixed(9).slice(2)}$`,Lt="?"+k,le=`<${Lt}>`,z=document,O=()=>z.createComment(""),D=n=>n===null||typeof n!="object"&&typeof n!="function",_t=Array.isArray,de=n=>_t(n)||typeof n?.[Symbol.iterator]=="function",dt=`[ 	
\f\r]`,I=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Nt=/-->/g,Ut=/>/g,C=RegExp(`>|${dt}(?:([^\\s"'>=/]+)(${dt}*=${dt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Rt=/'/g,It=/"/g,Wt=/^(?:script|style|textarea|title)$/i,yt=n=>(e,...t)=>({_$litType$:n,strings:e,values:t}),u=yt(1),Te=yt(2),ze=yt(3),$=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),Ot=new WeakMap,T=z.createTreeWalker(z,129);function jt(n,e){if(!_t(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return Mt!==void 0?Mt.createHTML(e):e}var he=(n,e)=>{let t=n.length-1,i=[],s,r=e===2?"<svg>":e===3?"<math>":"",o=I;for(let c=0;c<t;c++){let a=n[c],p,m,l=-1,f=0;for(;f<a.length&&(o.lastIndex=f,m=o.exec(a),m!==null);)f=o.lastIndex,o===I?m[1]==="!--"?o=Nt:m[1]!==void 0?o=Ut:m[2]!==void 0?(Wt.test(m[2])&&(s=RegExp("</"+m[2],"g")),o=C):m[3]!==void 0&&(o=C):o===C?m[0]===">"?(o=s??I,l=-1):m[1]===void 0?l=-2:(l=o.lastIndex-m[2].length,p=m[1],o=m[3]===void 0?C:m[3]==='"'?It:Rt):o===It||o===Rt?o=C:o===Nt||o===Ut?o=I:(o=C,s=void 0);let d=o===C&&n[c+1].startsWith("/>")?" ":"";r+=o===I?a+le:l>=0?(i.push(p),a.slice(0,l)+Dt+a.slice(l)+k+d):a+k+(l===-2?c:d)}return[jt(n,r+(n[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]},L=class n{constructor({strings:e,_$litType$:t},i){let s;this.parts=[];let r=0,o=0,c=e.length-1,a=this.parts,[p,m]=he(e,t);if(this.el=n.createElement(p,i),T.currentNode=this.el.content,t===2||t===3){let l=this.el.content.firstChild;l.replaceWith(...l.childNodes)}for(;(s=T.nextNode())!==null&&a.length<c;){if(s.nodeType===1){if(s.hasAttributes())for(let l of s.getAttributeNames())if(l.endsWith(Dt)){let f=m[o++],d=s.getAttribute(l).split(k),y=/([.?@])?(.*)/.exec(f);a.push({type:1,index:r,name:y[2],strings:d,ctor:y[1]==="."?pt:y[1]==="?"?ut:y[1]==="@"?mt:H}),s.removeAttribute(l)}else l.startsWith(k)&&(a.push({type:6,index:r}),s.removeAttribute(l));if(Wt.test(s.tagName)){let l=s.textContent.split(k),f=l.length-1;if(f>0){s.textContent=Q?Q.emptyScript:"";for(let d=0;d<f;d++)s.append(l[d],O()),T.nextNode(),a.push({type:2,index:++r});s.append(l[f],O())}}}else if(s.nodeType===8)if(s.data===Lt)a.push({type:2,index:r});else{let l=-1;for(;(l=s.data.indexOf(k,l+1))!==-1;)a.push({type:7,index:r}),l+=k.length-1}r++}}static createElement(e,t){let i=z.createElement("template");return i.innerHTML=e,i}};function P(n,e,t=n,i){if(e===$)return e;let s=i!==void 0?t._$Co?.[i]:t._$Cl,r=D(e)?void 0:e._$litDirective$;return s?.constructor!==r&&(s?._$AO?.(!1),r===void 0?s=void 0:(s=new r(n),s._$AT(n,t,i)),i!==void 0?(t._$Co??=[])[i]=s:t._$Cl=s),s!==void 0&&(e=P(n,s._$AS(n,e.values),s,i)),e}var ht=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:i}=this._$AD,s=(e?.creationScope??z).importNode(t,!0);T.currentNode=s;let r=T.nextNode(),o=0,c=0,a=i[0];for(;a!==void 0;){if(o===a.index){let p;a.type===2?p=new W(r,r.nextSibling,this,e):a.type===1?p=new a.ctor(r,a.name,a.strings,this,e):a.type===6&&(p=new ft(r,this,e)),this._$AV.push(p),a=i[++c]}o!==a?.index&&(r=T.nextNode(),o++)}return T.currentNode=z,s}p(e){let t=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}},W=class n{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,s){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=P(this,e,t),D(e)?e===h||e==null||e===""?(this._$AH!==h&&this._$AR(),this._$AH=h):e!==this._$AH&&e!==$&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):de(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==h&&D(this._$AH)?this._$AA.nextSibling.data=e:this.T(z.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:i}=e,s=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=L.createElement(jt(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(t);else{let r=new ht(s,this),o=r.u(this.options);r.p(t),this.T(o),this._$AH=r}}_$AC(e){let t=Ot.get(e.strings);return t===void 0&&Ot.set(e.strings,t=new L(e)),t}k(e){_t(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,i,s=0;for(let r of e)s===t.length?t.push(i=new n(this.O(O()),this.O(O()),this,this.options)):i=t[s],i._$AI(r),s++;s<t.length&&(this._$AR(i&&i._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let i=Ht(e).nextSibling;Ht(e).remove(),e=i}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},H=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,s,r){this.type=1,this._$AH=h,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=r,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=h}_$AI(e,t=this,i,s){let r=this.strings,o=!1;if(r===void 0)e=P(this,e,t,0),o=!D(e)||e!==this._$AH&&e!==$,o&&(this._$AH=e);else{let c=e,a,p;for(e=r[0],a=0;a<r.length-1;a++)p=P(this,c[i+a],t,a),p===$&&(p=this._$AH[a]),o||=!D(p)||p!==this._$AH[a],p===h?e=h:e!==h&&(e+=(p??"")+r[a+1]),this._$AH[a]=p}o&&!s&&this.j(e)}j(e){e===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},pt=class extends H{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===h?void 0:e}},ut=class extends H{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==h)}},mt=class extends H{constructor(e,t,i,s,r){super(e,t,i,s,r),this.type=5}_$AI(e,t=this){if((e=P(this,e,t,0)??h)===$)return;let i=this._$AH,s=e===h&&i!==h||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,r=e!==h&&(i===h||s);s&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},ft=class{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){P(this,e)}};var pe=gt.litHtmlPolyfillSupport;pe?.(L,W),(gt.litHtmlVersions??=[]).push("3.3.3");var Bt=(n,e,t)=>{let i=t?.renderBefore??e,s=i._$litPart$;if(s===void 0){let r=t?.renderBefore??null;i._$litPart$=s=new W(e.insertBefore(O(),r),r,void 0,t??{})}return s._$AI(n),s};var bt=globalThis,v=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Bt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return $}};v._$litElement$=!0,v.finalized=!0,bt.litElementHydrateSupport?.({LitElement:v});var ue=bt.litElementPolyfillSupport;ue?.({LitElement:v});(bt.litElementVersions??=[]).push("4.2.2");var me={attribute:!0,type:String,converter:R,reflect:!1,hasChanged:J},fe=(n=me,e,t)=>{let{kind:i,metadata:s}=t,r=globalThis.litPropertyMetadata.get(s);if(r===void 0&&globalThis.litPropertyMetadata.set(s,r=new Map),i==="setter"&&((n=Object.create(n)).wrapped=!0),r.set(t.name,n),i==="accessor"){let{name:o}=t;return{set(c){let a=e.get.call(this);e.set.call(this,c),this.requestUpdate(o,a,n,!0,c)},init(c){return c!==void 0&&this.C(o,void 0,n,c),c}}}if(i==="setter"){let{name:o}=t;return function(c){let a=this[o];e.call(this,c),this.requestUpdate(o,a,n,!0,c)}}throw Error("Unsupported decorator location: "+i)};function M(n){return(e,t)=>typeof t=="object"?fe(n,e,t):((i,s,r)=>{let o=s.hasOwnProperty(r);return s.constructor.createProperty(r,i),o?Object.getOwnPropertyDescriptor(s,r):void 0})(n,e,t)}function S(n){return M({...n,state:!0,attribute:!1})}var qt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Kt=n=>(...e)=>({_$litDirective$:n,values:e}),tt=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var Ft="important",ge=" !"+Ft,j=Kt(class extends tt{constructor(n){if(super(n),n.type!==qt.ATTRIBUTE||n.name!=="style"||n.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(n){return Object.keys(n).reduce((e,t)=>{let i=n[t];return i==null?e:e+`${t=t.includes("-")?t:t.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${i};`},"")}update(n,[e]){let{style:t}=n.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(e)),this.render(e);for(let i of this.ft)e[i]==null&&(this.ft.delete(i),i.includes("-")?t.removeProperty(i):t[i]=null);for(let i in e){let s=e[i];if(s!=null){this.ft.add(i);let r=typeof s=="string"&&s.endsWith(ge);i.includes("-")||r?t.setProperty(i,r?s.slice(0,-11):s,r?Ft:""):t[i]=s}}return $}});var vt={default_title:"Wake-up light",next:"Next alarm {when}",in:"in {duration}",soon:"in less than a minute",no_alarm:"No alarm set",today:"Today",tomorrow:"Tomorrow",every_day:"Every day",weekdays:"Weekdays",weekends:"Weekends",not_scheduled:"Not scheduled",sunrise_from:"Sunrise from {time}",sunrise:"Sunrise",test_sunrise:"Test sunrise",alarm_at:"Alarm at {time}",good_morning:"Good morning",lights_off_at:"Lights off at {time}",test_restore:"Lights go back to before in a moment",stop:"Stop",stop_title:"How should the lights stay?",stop_restore:"As before",stop_full:"Full brightness",stop_off:"All off",add:"Add alarm",empty_title:"No alarms yet",empty_text:"Lights brighten slowly before the alarm, like a sunrise.",label:"Label",delete:"Delete",cancel:"Cancel",save:"Save",close:"Close",deleted:"Alarm deleted",undo:"Undo",rings:"Rings {when}",rings_once:"Rings once, {when}",minutes:"{n} min sunrise",test:"Test",test_hint:"Try a one-minute sunrise with your lights",settings:"Settings",not_found:"Wake-up light not found.",not_found_hint:"Set one up under Settings \u2192 Devices & services.",set_up:"Set up",failed:"Could not save: {error}",editor_entry:"Wake-up light",editor_title:"Title",editor_show_devices:"Show devices",picker_description:"Wake-up light with sunrise: all your alarms at a glance, switch them on and off, edit them."},_e={default_title:"Lichtwecker",next:"N\xE4chster Wecker {when}",in:"in {duration}",soon:"in weniger als einer Minute",no_alarm:"Kein Wecker gestellt",today:"Heute",tomorrow:"Morgen",every_day:"T\xE4glich",weekdays:"Werktags",weekends:"Wochenende",not_scheduled:"Nicht geplant",sunrise_from:"Sonnenaufgang ab {time}",sunrise:"Sonnenaufgang",test_sunrise:"Test-Sonnenaufgang",alarm_at:"Wecker um {time}",good_morning:"Guten Morgen",lights_off_at:"Licht aus um {time}",test_restore:"Gleich wieder wie vorher",stop:"Stopp",stop_title:"Wie soll das Licht bleiben?",stop_restore:"Wie vorher",stop_full:"Volle Helligkeit",stop_off:"Alles aus",add:"Wecker hinzuf\xFCgen",empty_title:"Noch keine Wecker",empty_text:"Vor dem Wecker werden die Lampen langsam heller, wie bei einem Sonnenaufgang.",label:"Name",delete:"L\xF6schen",cancel:"Abbrechen",save:"Speichern",close:"Schlie\xDFen",deleted:"Wecker gel\xF6scht",undo:"R\xFCckg\xE4ngig",rings:"Klingelt {when}",rings_once:"Klingelt einmal, {when}",minutes:"{n} Min. Sonnenaufgang",test:"Testen",test_hint:"Einmin\xFCtigen Sonnenaufgang mit deinen Lampen ausprobieren",settings:"Einstellungen",not_found:"Lichtwecker nicht gefunden.",not_found_hint:"Richte ihn unter Einstellungen \u2192 Ger\xE4te & Dienste ein.",set_up:"Einrichten",failed:"Speichern fehlgeschlagen: {error}",editor_entry:"Lichtwecker",editor_title:"Titel",editor_show_devices:"Ger\xE4te anzeigen",picker_description:"Lichtwecker mit Sonnenaufgang: alle Wecker auf einen Blick, ein- und ausschalten und bearbeiten."},ye={en:vt,de:_e};function E(n){return n?.locale?.language||n?.language||"en"}function g(n,e,t={}){let i=ye[E(n).split("-")[0]]??vt;return Object.entries(t).reduce((s,[r,o])=>s.replace(`{${r}}`,String(o)),i[e]??vt[e])}var be=[{name:"entry_id",selector:{config_entry:{integration:"daytime_alarm"}}},{name:"title",selector:{text:{}}},{name:"show_devices",selector:{boolean:{}}}],ve={entry_id:"editor_entry",title:"editor_title",show_devices:"editor_show_devices"},B=class extends v{setConfig(e){this._config=e}render(){return!this.hass||!this._config?h:u`
      <ha-form
        .hass=${this.hass}
        .data=${{show_devices:!0,...this._config}}
        .schema=${be}
        .computeLabel=${e=>g(this.hass,ve[e.name])}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `}_valueChanged(e){let t={...e.detail.value};for(let i of["entry_id","title"])t[i]||delete t[i];t.show_devices===!0&&delete t.show_devices,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:t},bubbles:!0,composed:!0}))}};b([M({attribute:!1})],B.prototype,"hass",2),b([S()],B.prototype,"_config",2);customElements.get("daytime-alarm-card-editor")||customElements.define("daytime-alarm-card-editor",B);var q=["mon","tue","wed","thu","fri","sat","sun"],Vt={monday:0,tuesday:1,wednesday:2,thursday:3,friday:4,saturday:5,sunday:6},et=n=>String(n).padStart(2,"0");function it(n){return n.config?.time_zone}function xe(n){let e=n.locale?.time_format;if(e==="24")return!0;if(e==="12")return!1;let t=e==="system"?void 0:E(n),i=new Intl.DateTimeFormat(t,{hour:"numeric"}).resolvedOptions().hourCycle;return i==="h23"||i==="h24"}function xt(n,e){let[t,i]=e.split(":").map(Number);if(xe(n))return{main:`${et(t)}:${et(i)}`,suffix:""};let s=new Intl.DateTimeFormat(E(n),{hour:"numeric",minute:"2-digit",hour12:!0}).formatToParts(new Date(2e3,0,1,t,i));return{main:s.filter(r=>r.type!=="dayPeriod").map(r=>r.value).join("").trim(),suffix:s.find(r=>r.type==="dayPeriod")?.value??""}}function w(n,e){let{main:t,suffix:i}=xt(n,e);return i?`${t} ${i}`:t}function st(n,e){let t=new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:it(n)}).formatToParts(e),i=s=>t.find(r=>r.type===s)?.value??"00";return`${i("hour")}:${i("minute")}`}function $e(n,e,t=new Date){let i=new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:it(n)}),s=r=>Date.parse(`${i.format(r)}T00:00:00Z`);return Math.round((s(e)-s(t))/864e5)}function $t(n,e){let t=$e(n,e);return t===0?g(n,"today"):t===1?g(n,"tomorrow"):new Intl.DateTimeFormat(E(n),{weekday:"long",timeZone:it(n)}).format(e)}function wt(n,e){let t=Math.max(1,Math.round(e)),i=Math.floor(t/1440),s=Math.floor(t%1440/60),r=t%60,o=i?{days:i,hours:s}:s?{hours:s,minutes:r}:{minutes:r},c=Intl.DurationFormat;return c?new c(E(n),{style:"narrow"}).format(o):[i?`${i} d`:"",s?`${s} h`:"",!i&&r?`${r} min`:""].filter(Boolean).join(" ")}function Gt(n,e){let t=(e.getTime()-Date.now())/6e4;return t<1?g(n,"soon"):g(n,"in",{duration:wt(n,t)})}function At(n){let e=n.locale?.first_weekday,t=e&&e in Vt?Vt[e]:void 0;if(t===void 0)try{let i=new Intl.Locale(E(n)),s=i.getWeekInfo?.()??i.weekInfo;t=s?(s.firstDay+6)%7:0}catch{t=0}return[...q.slice(t),...q.slice(0,t)]}function K(n,e,t){let i=new Date(Date.UTC(2024,0,1+q.indexOf(e),12));return new Intl.DateTimeFormat(E(n),{weekday:t,timeZone:"UTC"}).format(i)}function kt(n,e){let t=new Set(e);return t.size===7?g(n,"every_day"):t.size===5&&["mon","tue","wed","thu","fri"].every(i=>t.has(i))?g(n,"weekdays"):t.size===2&&t.has("sat")&&t.has("sun")?g(n,"weekends"):At(n).filter(i=>t.has(i)).map(i=>K(n,i,"short")).join(", ")}function nt(n,e){let[t,i]=n.split(":").map(Number),s=((t*60+i-e)%1440+1440)%1440;return`${et(Math.floor(s/60))}:${et(s%60)}`}function Zt(n,e,t){let i=new Date,s=new Intl.DateTimeFormat("en-GB",{weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:it(n)}).formatToParts(i),r=l=>s.find(f=>f.type===l)?.value??"",o=q.indexOf(r("weekday").toLowerCase().slice(0,3)),c=Number(r("hour"))*60+Number(r("minute"))+i.getSeconds()/60,[a,p]=e.split(":").map(Number),m=a*60+p;for(let l=0;l<=7;l++){let f=q[(o+l)%7];if(t.length&&!t.includes(f))continue;let d=l*1440+m-c;if(d>0)return d}return 7*1440}var Yt=ct`
  :host {
    --da-accent: var(--daytime-alarm-accent-color, var(--orange-color, #ff9800));
    --da-tile: var(
      --daytime-alarm-tile-color,
      color-mix(in srgb, var(--primary-text-color) 5%, transparent)
    );
    --da-tile-strong: color-mix(in srgb, var(--primary-text-color) 9%, transparent);
    --da-radius: var(--daytime-alarm-tile-radius, 20px);
    --da-on-primary: var(--text-primary-color, #fff);
    --da-ease: cubic-bezier(0.2, 0, 0, 1);
  }

  ha-card {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
    height: 100%;
    box-sizing: border-box;
  }

  ha-icon {
    --mdc-icon-size: 20px;
    --ha-icon-size: 20px;
    display: inline-flex;
  }

  button {
    font: inherit;
    -webkit-tap-highlight-color: transparent;
  }

  /* Header ---------------------------------------------------------------- */

  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 40px;
  }

  .header-icon {
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--da-accent);
    background: color-mix(in srgb, var(--da-accent) 18%, transparent);
  }

  .header-icon ha-icon {
    --mdc-icon-size: 22px;
    --ha-icon-size: 22px;
  }

  .header-text {
    flex: 1;
    min-width: 0;
  }

  .title {
    font-size: var(--ha-font-size-l, 1.125rem);
    font-weight: var(--ha-font-weight-medium, 500);
    line-height: 1.3;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .subtitle {
    font-size: var(--ha-font-size-s, 0.8125rem);
    line-height: 1.4;
    color: var(--secondary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .subtitle strong {
    color: var(--primary-text-color);
    font-weight: var(--ha-font-weight-medium, 500);
  }

  /* Buttons ---------------------------------------------------------------- */

  .icon-btn,
  .btn,
  .switch,
  .day,
  .chip,
  .alarm-body {
    appearance: none;
    border: none;
    margin: 0;
    background: none;
    color: inherit;
    cursor: pointer;
    outline: none;
  }

  .icon-btn {
    flex: none;
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--secondary-text-color);
    transition: background-color 0.2s;
  }

  .icon-btn:hover {
    background: var(--da-tile);
  }

  .icon-btn.add {
    border-radius: 14px;
    color: var(--da-on-primary);
    background: var(--primary-color);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  }

  .icon-btn.add:hover {
    background: color-mix(in srgb, var(--primary-color) 88%, var(--da-on-primary));
  }

  .btn {
    height: 40px;
    padding: 0 16px;
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: var(--ha-font-size-m, 0.875rem);
    font-weight: var(--ha-font-weight-medium, 500);
    letter-spacing: 0.01em;
    white-space: nowrap;
    transition:
      background-color 0.2s,
      opacity 0.2s;
  }

  .btn ha-icon {
    --mdc-icon-size: 18px;
    --ha-icon-size: 18px;
  }

  .btn.filled {
    padding: 0 24px;
    color: var(--da-on-primary);
    background: var(--primary-color);
  }

  .btn.filled:hover {
    background: color-mix(in srgb, var(--primary-color) 88%, var(--da-on-primary));
  }

  .btn.text {
    color: var(--primary-color);
  }

  .btn.text:hover {
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  }

  .btn.danger {
    color: var(--error-color, #db4437);
  }

  .btn.danger:hover {
    background: color-mix(in srgb, var(--error-color, #db4437) 10%, transparent);
  }

  .btn[disabled] {
    opacity: 0.5;
    pointer-events: none;
  }

  .icon-btn:focus-visible,
  .btn:focus-visible,
  .switch:focus-visible,
  .day:focus-visible,
  .chip:focus-visible,
  .alarm-body:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Sunrise banner ---------------------------------------------------------- */

  .banner {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 14px 14px 18px;
    border-radius: var(--da-radius);
    color: #fff;
    background: linear-gradient(
      100deg,
      #1e1b4b 0%,
      #581c87 22%,
      #be123c 45%,
      #ea580c 68%,
      #f59e0b 100%
    );
    background-size: 300% 100%;
    background-position: var(--sunrise-position, 0%) 0;
    transition: background-position 2s linear;
    animation: rise 0.35s var(--da-ease);
  }

  .banner > ha-icon {
    --mdc-icon-size: 28px;
    --ha-icon-size: 28px;
    flex: none;
    filter: drop-shadow(0 0 8px rgb(255 220 150 / 0.8));
  }

  .banner-text {
    flex: 1;
    min-width: 0;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  }

  .banner-title {
    font-weight: var(--ha-font-weight-medium, 500);
    font-variant-numeric: tabular-nums;
  }

  .banner-sub {
    font-size: var(--ha-font-size-s, 0.8125rem);
    opacity: 0.85;
  }

  .bar {
    height: 4px;
    margin-top: 8px;
    border-radius: 2px;
    overflow: hidden;
    background: rgb(255 255 255 / 0.28);
  }

  .bar > div {
    height: 100%;
    border-radius: 2px;
    background: #fff;
    transition: width 1s linear;
  }

  .banner.choosing {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px 12px 14px 18px;
    animation: none;
  }

  .choice-head {
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  }

  .choice-head .banner-title {
    flex: 1;
  }

  .choice-head .icon-btn {
    width: 36px;
    height: 36px;
    color: #fff;
  }

  .choice-head .icon-btn:hover {
    background: rgb(255 255 255 / 0.18);
  }

  .choices {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-inline-end: 6px;
    animation: rise 0.25s var(--da-ease);
  }

  .choice {
    appearance: none;
    border: none;
    margin: 0;
    cursor: pointer;
    min-height: 76px;
    padding: 10px 6px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: var(--ha-font-size-s, 0.8125rem);
    font-weight: var(--ha-font-weight-medium, 500);
    line-height: 1.25;
    text-align: center;
    color: #7c2d12;
    background: rgb(255 255 255 / 0.92);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.18);
    transition:
      background-color 0.2s,
      transform 0.15s;
  }

  .choice ha-icon {
    --mdc-icon-size: 24px;
    --ha-icon-size: 24px;
    color: #c2410c;
  }

  .choice:hover {
    background: #fff;
  }

  .choice:active {
    transform: scale(0.96);
  }

  .choice:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }

  .banner .btn {
    color: #9a3412;
    background: #fff;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  }

  .banner .btn:hover {
    background: #fff7ed;
  }

  /* Alarm tiles ------------------------------------------------------------- */

  .alarms {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .alarm {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px 14px 20px;
    border-radius: var(--da-radius);
    background: var(--da-tile);
    transition:
      background-color 0.2s,
      box-shadow 0.3s;
  }

  .alarm:hover {
    background: var(--da-tile-strong);
  }

  .alarm.active {
    box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--da-accent) 70%, transparent);
    background: linear-gradient(
      120deg,
      color-mix(in srgb, var(--da-accent) 16%, transparent),
      var(--da-tile) 70%
    );
  }

  .alarm-body {
    flex: 1;
    min-width: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    text-align: start;
    border-radius: 12px;
  }

  .meta {
    max-width: 100%;
    display: flex;
    gap: 8px;
    font-size: var(--ha-font-size-m, 0.875rem);
    line-height: 1.4;
    color: var(--secondary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta .label {
    color: var(--primary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .time {
    font-size: 2.75rem;
    font-weight: 300;
    line-height: 1.15;
    letter-spacing: -0.01em;
    font-variant-numeric: tabular-nums;
    color: var(--primary-text-color);
    transition: color 0.2s;
  }

  .time .suffix {
    margin-inline-start: 6px;
    font-size: 1rem;
    font-weight: 400;
    letter-spacing: 0;
    color: var(--secondary-text-color);
  }

  .alarm.off .time {
    color: var(--secondary-text-color);
  }

  .alarm.off .meta .label {
    color: var(--secondary-text-color);
  }

  .hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--ha-font-size-s, 0.8125rem);
    /* Pull the accent towards the text color so it stays readable on light themes. */
    color: color-mix(in srgb, var(--da-accent) 78%, var(--primary-text-color));
  }

  .hint.muted {
    color: var(--secondary-text-color);
  }

  .hint ha-icon {
    --mdc-icon-size: 16px;
    --ha-icon-size: 16px;
  }

  /* Switch (Material 3 style) ---------------------------------------------- */

  .switch {
    flex: none;
    position: relative;
    width: 52px;
    height: 32px;
    padding: 0;
    border-radius: 16px;
    box-sizing: border-box;
    border: 2px solid var(--secondary-text-color);
    background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
    transition:
      background-color 0.2s,
      border-color 0.2s;
  }

  .switch::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 6px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--secondary-text-color);
    transform: translateY(-50%);
    transition:
      left 0.25s var(--da-ease),
      width 0.25s var(--da-ease),
      height 0.25s var(--da-ease),
      background-color 0.2s;
  }

  .switch:active::after {
    width: 28px;
    height: 28px;
    left: 0;
  }

  .switch[aria-checked="true"] {
    border-color: var(--primary-color);
    background: var(--primary-color);
  }

  .switch[aria-checked="true"]::after {
    left: 22px;
    width: 24px;
    height: 24px;
    background: var(--da-on-primary);
  }

  .switch[aria-checked="true"]:active::after {
    left: 18px;
    width: 28px;
    height: 28px;
  }

  /* Editor ------------------------------------------------------------------ */

  .editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 16px 12px 20px;
    border-radius: var(--da-radius);
    background: var(--da-tile-strong);
    animation: rise 0.25s var(--da-ease);
  }

  .editor-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .time-input {
    flex: 1;
    min-width: 0;
    padding: 0 0 2px;
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: 3rem;
    font-weight: 400;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
    color: var(--primary-text-color);
    transition: border-color 0.2s;
  }

  .time-input:focus {
    border-bottom-color: var(--primary-color);
  }

  .time-input::-webkit-calendar-picker-indicator {
    width: 22px;
    height: 22px;
    padding: 9px;
    margin-inline-start: 4px;
    border-radius: 50%;
    opacity: 0.55;
    cursor: pointer;
    transition:
      opacity 0.2s,
      background-color 0.2s;
  }

  .time-input::-webkit-calendar-picker-indicator:hover {
    opacity: 0.9;
    background-color: var(--da-tile-strong);
  }

  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
  }

  .day {
    justify-self: center;
    width: 100%;
    max-width: 44px;
    aspect-ratio: 1;
    padding: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: var(--ha-font-size-m, 0.875rem);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    transition:
      background-color 0.2s,
      color 0.2s,
      transform 0.15s;
  }

  .day:active {
    transform: scale(0.92);
  }

  .day[aria-pressed="true"] {
    color: var(--da-on-primary);
    background: var(--primary-color);
  }

  .summary {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: -4px;
    font-size: var(--ha-font-size-s, 0.8125rem);
    color: var(--secondary-text-color);
  }

  .field {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 48px;
    padding: 0 14px;
    border-radius: 14px;
    color: var(--secondary-text-color);
    background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
    transition: box-shadow 0.2s;
  }

  .field:focus-within {
    box-shadow: inset 0 0 0 2px var(--primary-color);
  }

  .field input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    font-size: var(--ha-font-size-m, 0.875rem);
    color: var(--primary-text-color);
  }

  .field input::placeholder {
    color: var(--secondary-text-color);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-inline-start: -8px;
  }

  .spacer {
    flex: 1;
  }

  /* Empty state --------------------------------------------------------------- */

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 20px 16px 12px;
    text-align: center;
  }

  .empty > ha-icon {
    --mdc-icon-size: 40px;
    --ha-icon-size: 40px;
    color: var(--da-accent);
    margin-bottom: 4px;
  }

  .empty-title {
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
  }

  .empty-text {
    max-width: 280px;
    font-size: var(--ha-font-size-s, 0.8125rem);
    color: var(--secondary-text-color);
    margin-bottom: 10px;
  }

  /* Footer -------------------------------------------------------------------- */

  .footer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--divider-color);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    max-width: 100%;
    height: 32px;
    padding: 0 12px 0 8px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--ha-font-size-s, 0.8125rem);
    color: var(--primary-text-color);
    background: var(--da-tile);
    transition: background-color 0.2s;
  }

  .chip:hover {
    background: var(--da-tile-strong);
  }

  .chip span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chip ha-icon {
    --mdc-icon-size: 18px;
    --ha-icon-size: 18px;
    color: var(--secondary-text-color);
    transition: color 0.3s;
  }

  .chip.on ha-icon {
    color: var(--chip-color, var(--state-light-active-color, #ffb300));
  }

  .chip.unavailable {
    opacity: 0.5;
  }

  .footer-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-inline-end: -8px;
    font-size: var(--ha-font-size-s, 0.8125rem);
    color: var(--secondary-text-color);
  }

  .footer-row .duration {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .footer-row .duration ha-icon {
    --mdc-icon-size: 16px;
    --ha-icon-size: 16px;
  }

  .warning {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    color: var(--secondary-text-color);
  }

  .warning strong {
    color: var(--primary-text-color);
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation: none !important;
      transition: none !important;
    }
  }
`;var _="daytime_alarm",rt="daytime-alarm-card",Jt=n=>!!n&&n.state!=="unavailable"&&n.state!=="unknown",F=n=>{if(typeof n!="string"||!n)return;let e=new Date(n);return Number.isNaN(e.getTime())?void 0:e};function St(n,e,t){n.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}function Qt(n){return Object.values(n.devices??{}).filter(e=>e.identifiers?.some(([t])=>t===_))}function we(n,e){let t=Qt(n),i=e?t.find(d=>d.identifiers.some(([y,V])=>y===_&&V===e)):t[0];if(!i)return;let s=Object.values(n.entities).filter(d=>d.device_id===i.id),r=(d,y)=>s.find(V=>V.entity_id.startsWith(`${d}.`)&&V.translation_key===y)?.entity_id,o=s.filter(d=>d.entity_id.startsWith("switch.")).map(d=>n.states[d.entity_id]).filter(d=>!!d&&"time"in d.attributes).map(d=>({entityId:d.entity_id,time:d.attributes.time,days:d.attributes.days??[],label:d.attributes.label??"",enabled:d.state==="on",nextAlarm:F(d.attributes.next_alarm),sunriseStart:F(d.attributes.sunrise_start),active:!!d.attributes.sunrise_active})).sort((d,y)=>d.time.localeCompare(y.time)||d.entityId.localeCompare(y.entityId)),c=r("sensor","next_alarm"),a=c?n.states[c]:void 0,p=Jt(a)?F(a.state):void 0,m=r("sensor","status"),l=m?n.states[m]:void 0,f=l?.state;return{entryId:i.identifiers.find(([d])=>d===_)[1],name:i.name_by_user||i.name||g(n,"default_title"),alarms:o,next:p?{at:p,entityId:a.attributes.alarm_entity_id}:void 0,duration:Number(a?.attributes.duration??30),lightsOffAfter:Number(a?.attributes.lights_off_after??30),lights:a?.attributes.lights??[],switches:a?.attributes.switches??[],wake:l&&(f==="sunrise"||f==="awake")?{status:f,progress:Number(l.attributes.progress??0),at:F(l.attributes.alarm_at),offAt:F(l.attributes.lights_off_at),test:!!l.attributes.test,entityId:l.attributes.alarm_entity_id}:void 0,testEntity:r("button","test")}}var A=class extends v{constructor(){super(...arguments);this._optimistic={};this._saving=!1;this._stopChoice=!1;this._watched=[];this._addAlarm=()=>{this._draft={time:"07:00",days:[],label:""}};this._closeEditor=()=>{this._draft=void 0};this._editorKeydown=t=>{t.key==="Escape"&&this._closeEditor(),t.key==="Enter"&&t.target.tagName==="INPUT"&&this._save()};this._save=async()=>{let t=this._draft,i=this._clock;if(!t||!i||!this.hass||this._saving)return;let s={time:t.time,days:t.days,label:t.label.trim(),enabled:!0};this._saving=!0;try{t.entityId?await this.hass.callService(_,"update_alarm",s,{entity_id:t.entityId}):await this.hass.callService(_,"create_alarm",{...s,config_entry_id:i.entryId}),this._draft=void 0}catch(r){this._toast(this._t("failed",{error:r.message??String(r)}))}finally{this._saving=!1}};this._choiceKeydown=t=>{t.key==="Escape"&&(this._stopChoice=!1)}}static{this.styles=Yt}static getConfigElement(){return document.createElement("daytime-alarm-card-editor")}static getStubConfig(t){let s=Qt(t)[0]?.identifiers.find(([r])=>r===_)?.[1];return s?{entry_id:s}:{}}setConfig(t){if(!t)throw new Error("Invalid configuration");this._config={show_devices:!0,...t}}getCardSize(){return 3+(this._clock?.alarms.length??1)*2}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}connectedCallback(){super.connectedCallback(),this._ticker=window.setInterval(()=>this.requestUpdate(),3e4)}disconnectedCallback(){super.disconnectedCallback(),window.clearInterval(this._ticker)}shouldUpdate(t){if(t.size!==1||!t.has("hass")||!this._clock)return!0;let i=t.get("hass"),s=this.hass;return!i||!s||i.entities!==s.entities||i.devices!==s.devices||i.locale!==s.locale||i.themes!==s.themes?!0:this._watched.some(r=>i.states[r]!==s.states[r])}willUpdate(t){if(!this.hass||!this._config)return;this._clock=we(this.hass,this._config.entry_id);let i=this._clock;if(this._stopChoice&&!i?.wake&&(this._stopChoice=!1),i&&(this._watched=[...i.alarms.map(s=>s.entityId),...i.lights,...i.switches,...Object.values(this.hass.entities).filter(s=>s.platform===_).map(s=>s.entity_id)]),t.has("hass")&&Object.keys(this._optimistic).length){let s=Object.fromEntries(Object.entries(this._optimistic).filter(([r,o])=>this.hass.states[r]?.state==="on"!==o));Object.keys(s).length!==Object.keys(this._optimistic).length&&(this._optimistic=s)}}_t(t,i){return g(this.hass,t,i)}render(){if(!this.hass||!this._config)return h;let t=this._clock;if(!t)return this._renderNotFound();let i=this._draft&&!this._draft.entityId;return u`
      <ha-card>
        ${this._renderHeader(t)} ${t.wake?this._renderBanner(t):h}
        <div class="alarms">
          ${i?this._renderEditor(t,this._draft):h}
          ${t.alarms.map(s=>this._draft?.entityId===s.entityId?this._renderEditor(t,this._draft,s):this._renderAlarm(t,s))}
          ${!t.alarms.length&&!i?this._renderEmpty():h}
        </div>
        ${this._renderFooter(t)}
      </ha-card>
    `}_renderNotFound(){let t=this.hass?.user?.is_admin??!0;return u`
      <ha-card>
        <div class="warning">
          <strong>${this._t("not_found")}</strong>
          <span>${this._t("not_found_hint")}</span>
          ${t?u`<button
                class="btn filled"
                @click=${()=>this._navigate(`/config/integrations/dashboard/add?domain=${_}`)}
              >
                ${this._t("set_up")}
              </button>`:h}
        </div>
      </ha-card>
    `}_renderHeader(t){let i=this.hass,s=this._t("no_alarm");if(t.next){let r=`${$t(i,t.next.at)} ${w(i,st(i,t.next.at))}`;s=u`<strong>${r}</strong> · ${Gt(i,t.next.at)}`}return u`
      <div class="header">
        <div class="header-icon"><ha-icon icon="mdi:weather-sunset-up"></ha-icon></div>
        <div class="header-text">
          <div class="title">${this._config.title||t.name}</div>
          <div class="subtitle">${s}</div>
        </div>
        <button
          class="icon-btn add"
          title=${this._t("add")}
          aria-label=${this._t("add")}
          @click=${this._addAlarm}
        >
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
      </div>
    `}_renderBanner(t){let i=this.hass,s=t.wake,r=s.status==="awake",o=r?100:Math.max(0,Math.min(100,s.progress)),c=j({"--sunrise-position":`${o}%`});if(this._stopChoice){let m=[["restore","mdi:restore","stop_restore"],["full","mdi:brightness-7","stop_full"],["off","mdi:lightbulb-off-outline","stop_off"]];return u`
        <div class="banner choosing" style=${c} @keydown=${this._choiceKeydown}>
          <div class="choice-head">
            <span class="banner-title">${this._t("stop_title")}</span>
            <button
              class="icon-btn"
              title=${this._t("cancel")}
              aria-label=${this._t("cancel")}
              @click=${()=>this._stopChoice=!1}
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="choices">
            ${m.map(([l,f,d])=>u`
                <button class="choice" @click=${()=>this._stop(t,l)}>
                  <ha-icon .icon=${f}></ha-icon>
                  <span>${this._t(d)}</span>
                </button>
              `)}
          </div>
        </div>
      `}let a,p;return s.test?(a=`${this._t("test_sunrise")} \xB7 ${o}%`,p=r?this._t("test_restore"):void 0):r?(a=this._t("good_morning"),p=s.offAt?this._t("lights_off_at",{time:w(i,st(i,s.offAt))}):void 0):(a=`${this._t("sunrise")} \xB7 ${o}%`,p=s.at?this._t("alarm_at",{time:w(i,st(i,s.at))}):void 0),u`
      <div class="banner" style=${c}>
        <ha-icon icon="mdi:white-balance-sunny"></ha-icon>
        <div class="banner-text">
          <div class="banner-title">${a}</div>
          ${p?u`<div class="banner-sub">${p}</div>`:h}
          ${r?h:u`<div class="bar"><div style=${j({width:`${o}%`})}></div></div>`}
        </div>
        <button class="btn" @click=${()=>this._stopChoice=!0}>${this._t("stop")}</button>
      </div>
    `}_renderAlarm(t,i){let s=this.hass,r=this._optimistic[i.entityId]??i.enabled,{main:o,suffix:c}=xt(s,i.time),a=i.days.length?kt(s,i.days):r&&i.nextAlarm?$t(s,i.nextAlarm):this._t("not_scheduled"),p=i.label?`${i.label}, `:"";return u`
      <div class="alarm ${r?"on":"off"} ${i.active?"active":""}">
        <button
          class="alarm-body"
          aria-label="${p}${w(s,i.time)}, ${a}"
          @click=${()=>this._edit(i)}
        >
          <span class="meta">
            <span>${a}</span>
            ${i.label?u`<span class="label">${i.label}</span>`:h}
          </span>
          <span class="time">${o}${c?u`<span class="suffix">${c}</span>`:h}</span>
          ${r&&t.lights.length?u`<span class="hint">
                <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
                ${this._t("sunrise_from",{time:w(s,nt(i.time,t.duration))})}
              </span>`:h}
        </button>
        ${this._renderSwitch(r,`${p}${w(s,i.time)}`,()=>this._toggle(i,!r))}
      </div>
    `}_renderSwitch(t,i,s){return u`
      <button
        class="switch"
        role="switch"
        aria-checked=${t?"true":"false"}
        aria-label=${i}
        @click=${r=>{r.stopPropagation(),s()}}
      ></button>
    `}_renderEditor(t,i,s){let r=this.hass,o=wt(r,Zt(r,i.time,i.days)),c=i.days.length?`${kt(r,i.days)} \xB7 ${this._t("in",{duration:o})}`:this._t("rings_once",{when:this._t("in",{duration:o})});return u`
      <div class="editor" @keydown=${this._editorKeydown}>
        <div class="editor-top">
          <input
            class="time-input"
            type="time"
            required
            style=${j({colorScheme:r.themes?.darkMode?"dark":"light"})}
            .value=${i.time}
            @input=${a=>{let p=a.target.value;p&&this._patch({time:p.slice(0,5)})}}
          />
          <button
            class="icon-btn"
            title=${this._t("close")}
            aria-label=${this._t("close")}
            @click=${this._closeEditor}
          >
            <ha-icon icon="mdi:chevron-up"></ha-icon>
          </button>
        </div>

        <div class="days" role="group">
          ${At(r).map(a=>{let p=i.days.includes(a);return u`<button
              class="day"
              aria-pressed=${p?"true":"false"}
              title=${K(r,a,"long")}
              aria-label=${K(r,a,"long")}
              @click=${()=>this._toggleDay(a)}
            >
              ${K(r,a,"narrow")}
            </button>`})}
        </div>

        <div class="summary">
          <span>${c}</span>
          ${t.lights.length?u`<span class="hint">
                  <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
                  ${this._t("sunrise_from",{time:w(r,nt(i.time,t.duration))})}
                </span>`:h}
          ${t.lights.length&&t.lightsOffAfter?u`<span class="hint muted">
                <ha-icon icon="mdi:lightbulb-off-outline"></ha-icon>
                ${this._t("lights_off_at",{time:w(r,nt(i.time,-t.lightsOffAfter))})}
              </span>`:h}
        </div>

        <label class="field">
          <ha-icon icon="mdi:label-outline"></ha-icon>
          <input
            type="text"
            maxlength="40"
            placeholder=${this._t("label")}
            aria-label=${this._t("label")}
            .value=${i.label}
            @input=${a=>this._patch({label:a.target.value})}
          />
        </label>

        <div class="actions">
          ${s?u`<button class="btn danger" @click=${()=>this._delete(s)}>
                <ha-icon icon="mdi:delete-outline"></ha-icon>${this._t("delete")}
              </button>`:u`<button class="btn text" @click=${this._closeEditor}>${this._t("cancel")}</button>`}
          <span class="spacer"></span>
          <button class="btn filled" ?disabled=${this._saving} @click=${this._save}>
            ${this._t("save")}
          </button>
        </div>
      </div>
    `}_renderEmpty(){return u`
      <div class="empty">
        <ha-icon icon="mdi:weather-sunset-up"></ha-icon>
        <div class="empty-title">${this._t("empty_title")}</div>
        <div class="empty-text">${this._t("empty_text")}</div>
        <button class="btn filled" @click=${this._addAlarm}>
          <ha-icon icon="mdi:plus"></ha-icon>${this._t("add")}
        </button>
      </div>
    `}_renderFooter(t){let i=[...t.lights,...t.switches],s=this.hass?.user?.is_admin??!0;return u`
      <div class="footer">
        ${this._config.show_devices&&i.length?u`<div class="chips">${i.map(r=>this._renderChip(r))}</div>`:h}
        <div class="footer-row">
          ${t.lights.length?u`<span class="duration">
                <ha-icon icon="mdi:timer-sand"></ha-icon>${this._t("minutes",{n:t.duration})}
              </span>`:h}
          <span class="spacer"></span>
          ${t.testEntity&&t.lights.length?u`<button
                class="btn text"
                title=${this._t("test_hint")}
                ?disabled=${!!t.wake}
                @click=${()=>this._press(t.testEntity)}
              >
                <ha-icon icon="mdi:play-circle-outline"></ha-icon>${this._t("test")}
              </button>`:h}
          ${s?u`<button
                class="icon-btn"
                title=${this._t("settings")}
                aria-label=${this._t("settings")}
                @click=${()=>this._navigate(`/config/integrations/integration/${_}`)}
              >
                <ha-icon icon="mdi:cog-outline"></ha-icon>
              </button>`:h}
        </div>
      </div>
    `}_renderChip(t){let i=this.hass.states[t],s=t.split(".")[0],r=i?.state==="on",o=i?.attributes.icon||(s==="light"?r?"mdi:lightbulb":"mdi:lightbulb-outline":r?"mdi:toggle-switch-variant":"mdi:toggle-switch-variant-off"),c=i?.attributes.rgb_color,a=r&&c?j({"--chip-color":`rgb(${c.join(",")})`}):h;return u`
      <button
        class="chip ${r?"on":""} ${Jt(i)?"":"unavailable"}"
        style=${a}
        @click=${()=>St(this,"hass-more-info",{entityId:t})}
      >
        <ha-icon .icon=${o}></ha-icon>
        <span>${i?.attributes.friendly_name??t}</span>
      </button>
    `}_edit(t){this._draft={entityId:t.entityId,time:t.time,days:[...t.days],label:t.label}}_patch(t){this._draft&&(this._draft={...this._draft,...t})}_toggleDay(t){let i=new Set(this._draft?.days);i.has(t)?i.delete(t):i.add(t),this._patch({days:[...i]})}async _delete(t){let i=this.hass,s=this._clock.entryId;try{await i.callService(_,"delete_alarm",{},{entity_id:t.entityId})}catch(r){this._toast(this._t("failed",{error:r.message??String(r)}));return}this._draft=void 0,this._toast(this._t("deleted"),{text:this._t("undo"),action:()=>i.callService(_,"create_alarm",{config_entry_id:s,time:t.time,days:t.days,label:t.label,enabled:t.enabled})})}async _toggle(t,i){this._optimistic={...this._optimistic,[t.entityId]:i};try{await this.hass.callService("switch",i?"turn_on":"turn_off",{},{entity_id:t.entityId})}catch(s){let{[t.entityId]:r,...o}=this._optimistic;this._optimistic=o,this._toast(this._t("failed",{error:s.message??String(s)}))}}async _stop(t,i){this._stopChoice=!1;try{await this.hass.callService(_,"stop",{config_entry_id:t.entryId,action:i})}catch(s){this._toast(this._t("failed",{error:s.message??String(s)}))}}_press(t){this.hass.callService("button","press",{},{entity_id:t}).catch(i=>this._toast(this._t("failed",{error:i.message??String(i)})))}_navigate(t){history.pushState(null,"",t),St(window,"location-changed",{replace:!1})}_toast(t,i){St(this,"hass-notification",{message:t,action:i,duration:i?8e3:4e3})}};b([M({attribute:!1})],A.prototype,"hass",2),b([S()],A.prototype,"_config",2),b([S()],A.prototype,"_draft",2),b([S()],A.prototype,"_optimistic",2),b([S()],A.prototype,"_saving",2),b([S()],A.prototype,"_stopChoice",2);customElements.get(rt)||customElements.define(rt,A);var ot=window;ot.customCards=ot.customCards??[];ot.customCards.some(n=>n.type===rt)||ot.customCards.push({type:rt,name:"Daytime Alarm",get description(){let n=document.querySelector("home-assistant");return g(n?.hass,"picker_description")},preview:!0,documentationURL:"https://github.com/trittler/ha-daytime-alarm"});export{A as DaytimeAlarmCard};
