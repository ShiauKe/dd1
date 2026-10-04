const {spawn,execFile}=require("node:child_process"),{promisify}=require("node:util"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {publish}=require("./observer");
const exec=promisify(execFile),ROOT=path.resolve(__dirname,".."),POLL=Number(process.env.DD1_POLL_MS||5000),PORT=Number(process.env.DD1_PORT||3100);
let child=null,busy=false,runningSha=null,lastGoodSha=null;
async function git(args,cwd=ROOT){return (await exec("git",args,{cwd,timeout:10000,env:{...process.env,GIT_TERMINAL_PROMPT:"0"}})).stdout.trim()}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function health(port,sha){for(let i=0;i<25;i++){try{const r=await fetch("http://127.0.0.1:"+port+"/healthz");const x=await r.json();if(r.ok&&x.ok&&x.sha===sha.slice(0,7))return true}catch{}await sleep(120)}return false}
function spawnApp(root,sha,port){return spawn(process.execPath,[path.join(root,"app/server.js")],{cwd:root,stdio:"inherit",env:{...process.env,PORT:String(port),DD1_RUNNING_SHA:sha.slice(0,7)}})}
async function stop(p){if(!p)return;await new Promise(resolve=>{const t=setTimeout(()=>{try{p.kill("SIGKILL")}catch{}resolve()},2000);p.once("exit",()=>{clearTimeout(t);resolve()});try{p.kill("SIGTERM")}catch{clearTimeout(t);resolve()}})}
async function startAccepted(){runningSha=await git(["rev-parse","HEAD"]);lastGoodSha=runningSha;child=spawnApp(ROOT,runningSha,PORT);if(!await health(PORT,runningSha))throw new Error("accepted runtime failed health");await publishState("runtime_ready")}
async function publishState(result,extra={}){return publish({schema:1,desired_sha:extra.desired_sha||null,validated_sha:extra.validated_sha||null,running_sha:runningSha,last_good_sha:lastGoodSha,health:child?"healthy":"down",controller:"ready",last_result:result,error:extra.error||null})}
async function deploy(){
 if(busy)return;busy=true;let tmp=null,candidate=null;
 try{
  await git(["fetch","origin","main"]);const desired=await git(["rev-parse","origin/main"]);
  if(desired===runningSha)return;
  if(await git(["status","--porcelain"]))throw new Error("working tree dirty");
  await publishState("candidate_found",{desired_sha:desired});
  tmp=fs.mkdtempSync(path.join(os.tmpdir(),"dd1-candidate-"));await git(["worktree","add","--detach",tmp,desired]);
  await exec(process.execPath,[path.join(tmp,"runtime/validator.js"),tmp],{cwd:tmp,timeout:10000});
  await publishState("validated",{desired_sha:desired,validated_sha:desired});
  // Candidate gets a probe port while the accepted runtime continues serving.
  const probePort=PORT+1;candidate=spawnApp(tmp,desired,probePort);
  if(!await health(probePort,desired))throw new Error("candidate health check failed");
  await stop(candidate);candidate=null;
  // Activation only begins after validation + health. Root moves to the exact validated SHA.
  await git(["merge","--ff-only","origin/main"]);
  const previous=child;await stop(previous);child=null;
  const next=spawnApp(ROOT,desired,PORT);
  if(!await health(PORT,desired)){await stop(next);throw new Error("activated candidate failed health")}
  child=next;lastGoodSha=runningSha;runningSha=desired;
  await publishState("deployed",{desired_sha:desired,validated_sha:desired});
  console.log("DD1 deployed:",desired.slice(0,7));
 }catch(e){
  const msg=(e.stderr||e.message||String(e)).trim();console.error("DD1 deploy failed:",msg);
  if(candidate)await stop(candidate);
  if(!child&&lastGoodSha){try{await git(["reset","--hard",lastGoodSha]);child=spawnApp(ROOT,lastGoodSha,PORT);if(await health(PORT,lastGoodSha))runningSha=lastGoodSha}catch{}}
  await publishState("deploy_failed",{error:msg});
 }finally{if(tmp)try{await git(["worktree","remove","--force",tmp])}catch{}busy=false}
}
(async()=>{await startAccepted();console.log("DD1_CONTROL_READY "+runningSha.slice(0,7));console.log("DD1 controller watching origin/main every "+POLL/1000+"s");setInterval(deploy,POLL)})();
process.on("SIGINT",async()=>{busy=true;await stop(child);process.exit(0)});process.on("SIGTERM",async()=>{busy=true;await stop(child);process.exit(0)});
