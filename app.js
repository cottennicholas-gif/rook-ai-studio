const API = "https://aihorde.net/api/v2";
const ANON_KEY = "0000000000";
const CLIENT_AGENT = "RookAIStudio:0.1:rook-ai-studio";
const promptEl = document.querySelector("#prompt");
const generateBtn = document.querySelector("#generate");
const makeGifBtn = document.querySelector("#makeGif");
const progressEl = document.querySelector("#progress");
const gallery = document.querySelector("#gallery");
const gifResult = document.querySelector("#gifResult");
const contentModeEl = document.querySelector("#contentMode");
let images = [];

function setProgress(message){progressEl.textContent=message;progressEl.classList.add("show")}
function headers(){return {"Content-Type":"application/json","apikey":ANON_KEY,"Client-Agent":CLIENT_AGENT}}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function showImage(url,index){
  if(!images.length) gallery.innerHTML="";
  images.push(url);
  const tile=document.createElement("article");tile.className="tile";
  const img=document.createElement("img");img.src=url;img.alt=`Generated image ${index+1}`;img.loading="lazy";
  const foot=document.createElement("div");foot.className="tile-foot";
  const name=document.createElement("span");name.textContent=`CREATION ${String(index+1).padStart(2,"0")}`;
  const link=document.createElement("a");link.href=url;link.target="_blank";link.rel="noopener";link.textContent="Open ↗";
  foot.append(name,link);tile.append(img,foot);gallery.append(tile);
  makeGifBtn.disabled=images.length<2;
}
async function generateOne(prompt,index,total,width,height,steps,isNsfw){
  const payload={prompt,params:{width,height,steps,n:1,cfg_scale:7},nsfw:isNsfw,censor_nsfw:!isNsfw,r2:true,shared:false};
  const start=await fetch(`${API}/generate/async`,{method:"POST",headers:headers(),body:JSON.stringify(payload)});
  if(!start.ok) throw new Error(`AI Horde rejected the request (${start.status}).`);
  const job=await start.json();
  if(!job.id) throw new Error(job.message||"The service did not return a job ID.");
  let lastMessage="";
  for(let attempt=0;attempt<180;attempt++){
    await wait(3000);
    const checkRes=await fetch(`${API}/generate/check/${job.id}`,{headers:headers()});
    if(!checkRes.ok) throw new Error(`Couldn't check generation status (${checkRes.status}).`);
    const check=await checkRes.json();
    const queue=check.queue_position??"—";
    const waitTime=check.wait_time?Math.ceil(check.wait_time):"";
    const msg=`Image ${index+1} of ${total}: ${check.done?"Finished processing":`waiting in the worker queue (position ${queue})`}${waitTime?` · estimated wait ${waitTime}s`:""}.`;
    if(msg!==lastMessage){setProgress(msg);lastMessage=msg;}
    if(check.faulted) throw new Error("The generation failed on the AI Horde network.");
    if(check.done){
      const resultRes=await fetch(`${API}/generate/status/${job.id}`,{headers:headers()});
      if(!resultRes.ok) throw new Error(`Couldn't retrieve the image (${resultRes.status}).`);
      const result=await resultRes.json();
      const generation=result.generations?.find(g=>g.img);
      if(!generation) throw new Error("The job finished but no image was returned.");
      return generation.img;
    }
  }
  throw new Error("This generation is taking unusually long. Try again later.");
}
generateBtn.addEventListener("click",async()=>{
  const prompt=promptEl.value.trim();
  if(!prompt){promptEl.focus();setProgress("Add a description first, then we'll make something.");return;}
  generateBtn.disabled=true;makeGifBtn.disabled=true;gifResult.innerHTML="";
  const [width,height]=document.querySelector("#size").value.split("x").map(Number);
  const total=Number(document.querySelector("#count").value);
  const steps=20;
  let succeeded=0;
  try{
    for(let i=0;i<total;i++){
     const isNsfw=contentModeEl.value==="nsfw";
const url=await generateOne(prompt,i,total,width,height,steps,isNsfw);
      showImage(url,images.length);succeeded++;
    }
    setProgress(`All done. ${succeeded} image${succeeded===1?"":"s"} ready.`);
  }catch(err){setProgress(`${err.message}${succeeded?` ${succeeded} image(s) were still saved in your gallery.`:""}`);}
  finally{generateBtn.disabled=false;makeGifBtn.disabled=images.length<2;}
});

makeGifBtn.addEventListener("click",async()=>{
  if(images.length<2)return;
  if(typeof GIF==="undefined"){setProgress("The GIF encoder couldn't load. Check your connection and refresh.");return;}

  makeGifBtn.disabled=true;
  gifResult.innerHTML="";
  setProgress("Preparing GIF frames…");

  let gif;
  let finished=false;
  let renderTimer;

  const fail=(message)=>{
    if(finished)return;
    finished=true;
    clearTimeout(renderTimer);
    try{gif?.abort();}catch(_){}
    setProgress(message);
    makeGifBtn.disabled=false;
  };

  try{
    const selected=images.slice(-8);
    const frames=[];

    for(let i=0;i<selected.length;i++){
      setProgress(`Loading GIF frame ${i+1} of ${selected.length}…`);
      const img=new Image();
      img.crossOrigin="anonymous";

      await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>reject(new Error("An image took too long to load. The image host may be blocking access.")),30000);
        img.onload=()=>{clearTimeout(timeout);resolve();};
        img.onerror=()=>{clearTimeout(timeout);reject(new Error("The image host blocked GIF conversion. You can still save each image from the gallery."));};
        img.src=selected[i];
      });

      frames.push(img);
    }

    setProgress("Encoding GIF…");

    gif=new GIF({
      workers:2,
      quality:10,
      width:400,
      height:400,
      workerScript:"https://cdn.jsdelivr.net/npm/gif.js.optimized/dist/gif.worker.js"
    });

    frames.forEach(img=>gif.addFrame(img,{delay:650,copy:true}));

    gif.on("finished",blob=>{
      if(finished)return;
      finished=true;
      clearTimeout(renderTimer);

      const gifUrl=URL.createObjectURL(blob);
      const img=document.createElement("img");
      img.src=gifUrl;
      img.alt="Your generated animated GIF";

      const a=document.createElement("a");
      a.href=gifUrl;
      a.download="rook-ai-studio.gif";
      a.textContent="Download GIF";
      a.style.cssText="display:inline-block;margin:10px 0;color:#d4c4ff;font-size:13px";

      gifResult.append(img,document.createElement("br"),a);
      setProgress("Your GIF is ready.");
      makeGifBtn.disabled=false;
    });

    gif.on("progress",p=>{
      if(!finished)setProgress(`Encoding GIF… ${Math.round(p*100)}%`);
    });

    gif.on("abort",()=>{
      if(!finished)fail("GIF creation was cancelled.");
    });

    gif.on("error",()=>{
      fail("The GIF encoder or background worker failed. Check your connection and try again.");
    });

    renderTimer=setTimeout(()=>{
      fail("GIF encoding timed out. The browser may be blocking the GIF worker.");
    },120000);

    gif.render();

  }catch(err){
    fail(err.message||"Something went wrong while creating the GIF.");
  }
});
