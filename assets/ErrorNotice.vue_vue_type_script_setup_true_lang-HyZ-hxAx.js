import{c as r,h as c,k as i,n as t,p as a,q as s,R as d,l as m,y as u,j as n}from"./index-rGSG8dT_.js";/**
 * @license lucide-vue-next v1.0.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=r("rotate-cw",[["path",{d:"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8",key:"1p45f6"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}]]),f={role:"alert",class:"pane flex flex-col items-start gap-4 p-6 sm:p-8"},x={class:"font-display text-xl font-medium"},y={key:0,class:"mt-1 max-w-prose text-ink-muted"},b=c({__name:"ErrorNotice",props:{title:{},detail:{default:void 0},actionLabel:{default:"Try again"}},emits:["retry"],setup(e){return(l,o)=>(n(),i("div",f,[t("div",null,[t("p",x,a(e.title),1),e.detail?(n(),i("p",y,a(e.detail),1)):s("",!0)]),t("button",{type:"button",class:"inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-[#2a1745] hover:bg-white/90",onClick:o[0]||(o[0]=k=>l.$emit("retry"))},[e.actionLabel==="Try again"?(n(),d(m(p),{key:0,size:16,"aria-hidden":"true"})):s("",!0),u(" "+a(e.actionLabel),1)])]))}});export{b as _};
