/* Export generated synthetic PDFs for PDF renderer acceptance and visual audit. */
"use strict";
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const html=fs.readFileSync(path.join(__dirname,"..","public","index.html"),"utf8");
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert(match);
const elements=new Map();
function element(id){
 if(!elements.has(id))elements.set(id,{id,value:"",innerHTML:"",textContent:"",hidden:false,disabled:false,dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){}});
 return elements.get(id);
}
globalThis.location={hash:""};
globalThis.window={scrollTo(){}};
globalThis.document={getElementById:element,querySelectorAll(){return[];},createElement(){return element("unused");},body:{appendChild(){}}};
const api=new Function(match[1]+"\nreturn { FIXTURES,createSamplePdf };")();
const out=path.join(__dirname,"..","preview-artifacts");
fs.mkdirSync(out,{recursive:true});
for(const sample of api.FIXTURES){
 const bytes=api.createSamplePdf(sample);
 const full=path.join(out,sample.filename);
 fs.writeFileSync(full,Buffer.from(bytes));
 console.log("Generated:",sample.filename,bytes.length,"bytes");
}
