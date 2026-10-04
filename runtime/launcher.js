const {spawn,execFile}=require("node:child_process"),{promisify}=require("node:util"),fs=require("node:fs"),os=require("node:os"),path=require("node:path"),crypto=require("node:crypto");
const {publish}=require("./observer");
const exec=promisify(execFile),ROOT=path.resolve(__dirname,".."),POLL=Number(process.env.DD1_POLL_MS||5000),PORT=Number(process.env.DD1_PORT||3100),RESTART=75;
let child=null,busy=false,runningSha=null,lastGoodSha=null,pollSeq=0,lastPollAt=null;
async function git(args,cwd=ROOT){return (await exec("git",args,{cwd,timeout:10000,env:{...process.env,GIT_TERMINAL_PROMPT:"0"}})).stdout.trim()}
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),artifact=()=>crypto.createHash("sha256").update(fs.readFileSync(__filename)).digest("hex").slice(0,12);
async function health(port,sha,attempts=40){
 let last="no response";
 for(let i=0;i<attempts;i++){
  try{
   const r=await fetch("http://127.0.0.1:"+port+"/healthz");
   if(!r.ok){last="http "+r.status;await sleep(150);continue}
   let x;try{x=await r.json()}catch{last="invalid json";await sleep(150);continue}
   if(!x.ok){last="payload not ok";await sleep(150);continue}
   if(x.sha!==sha.slice(0,7)){last="sha mismatch expected "+sha.slice(0,7)+" got "+x.sha;await sleep(150);continue}
   return {ok:true,reason:"healthy"}
  }catch(e){last=e.cause?.code||e.code||e.message||String(e)}
  await sleep(150)
 }
 return {ok:false,reason:"health_timeout",detail:last}
}
function spawnApp(root,sha,port){return spawn(process.execPath,[path.join(root,"app/server.js")],{cwd:root,stdio:"inherit",env:{...process.env,PORT:String(port),DD1_RUNNING_SHA:sha.slice(0,7)}})}
async function stop(p){if(!p)return;await new Promise(resolve=>{const t=setTimeout(()=>{try{p.kill("SIGKILL")}catch{}resolve()},2000);p.once("exit",()=>{clearTimeout(t);resolve()});try{p.kill("SIGTERM")}catch{clearTimeout(t);resolve()}})}
async function publishState(result,extra={}){return publish({schema:2,desired_sha:extra.desired_sha||null,validated_sha:extra.validated_sha||null,running_sha:runningSha,last_good_sha:lastGoodSha,health:child?"healthy":"down",controller:"ready",alive:true,converging:busy,poll_seq:pollSeq,last_poll_at:lastPollAt,control_artifact:artifact(),last_result:result,error:extra.error||null})}
async function startAccepted(){runningSha=await git(["rev-parse","HEAD"]);lastGoodSha=runningSha;child=spawnApp(ROOT,runningSha,PORT);const h=await health(PORT,runningSha);if(!h.ok)throw new Error("accepted runtime failed health: "+h.reason+" "+(h.detail||""));await publishState("runtime_ready")}
async function deploy(){
 if(busy)return;busy=true;pollSeq++;lastPollAt=new Date().toISOString();let tmp=null,candidate=null,desired=null;
 try{
  try{await git(["fetch","origin","main"])}catch(e){const msg=(e.stderr||e.message||String(e)).trim();console.error("DD1 poll degraded:",msg);await publishState("poll_degraded",{error:msg});return}
  desired=await git(["rev-parse","origin/main"]);if(desired===runningSha){await publishState("poll_ok",{desired_sha:desired,validated_sha:runningSha});return;}
  if(await git(["status","--porcelain"]))throw new Error("working tree dirty");
  const changed=(await git(["diff","--name-only",runningSha,desired])).split("\n").filter(Boolean),control=changed.some(x=>["runtime/launcher.js","runtime/observer.js"].includes(x));
  await publishState("candidate_found",{desired_sha:desired});
  tmp=fs.mkdtempSync(path.join(os.tmpdir(),"dd1-candidate-"));await git(["worktree","add","--detach",tmp,desired]);
  await exec(process.execPath,[path.join(tmp,"runtime/validator.js"),tmp],{cwd:tmp,timeout:10000});await publishState("validated",{desired_sha:desired,validated_sha:desired});
  const probe=PORT+1;candidate=spawnApp(tmp,desired,probe);const probeHealth=await health(probe,desired);if(!probeHealth.ok)throw new Error("candidate health check failed: "+probeHealth.reason+" "+(probeHealth.detail||""));await stop(candidate);candidate=null;
  await git(["merge","--ff-only","origin/main"]);const previous=child;await stop(previous);child=null;
  const next=spawnApp(ROOT,desired,PORT);const activationHealth=await health(PORT,desired,60);if(!activationHealth.ok){await stop(next);throw new Error("activated candidate failed health: "+activationHealth.reason+" "+(activationHealth.detail||""))}
  child=next;lastGoodSha=runningSha;runningSha=desired;await publishState("deployed",{desired_sha:desired,validated_sha:desired});
  console.log("DD1 deployed:",desired.slice(0,7));
  if(control&&process.env.DD1_SUPERVISED==="1"){console.log("DD1 controller update: supervised handoff");process.exit(RESTART)}
 }catch(e){const msg=(e.stderr||e.message||String(e)).trim();console.error("DD1 deploy failed:",msg);if(candidate)await stop(candidate);if(!child&&lastGoodSha){try{await git(["reset","--hard",lastGoodSha]);child=spawnApp(ROOT,lastGoodSha,PORT);if((await health(PORT,lastGoodSha,60)).ok)runningSha=lastGoodSha}catch{}}await publishState("deploy_failed",{desired_sha:desired,error:msg})}
 finally{if(tmp)try{await git(["worktree","remove","--force",tmp])}catch{}busy=false}
}
(async()=>{await startAccepted();console.log("DD1_CONTROL_READY "+artifact());console.log("DD1 controller watching origin/main every "+POLL/1000+"s");deploy();setInterval(deploy,POLL)})();
process.on("SIGINT",async()=>{busy=true;await stop(child);process.exit(0)});process.on("SIGTERM",async()=>{busy=true;await stop(child);process.exit(0)});
