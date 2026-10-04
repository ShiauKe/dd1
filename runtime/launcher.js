const {spawn,execFile}=require("node:child_process"),{promisify}=require("node:util"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const exec=promisify(execFile),ROOT=path.resolve(__dirname,".."),POLL=Number(process.env.DD1_POLL_MS||5000);
let child=null,busy=false;
async function git(args,cwd=ROOT){return (await exec("git",args,{cwd,timeout:10000,env:{...process.env,GIT_TERMINAL_PROMPT:"0"}})).stdout.trim()}
async function health(port){for(let i=0;i<20;i++){try{const r=await fetch("http://127.0.0.1:"+port+"/healthz");if(r.ok)return true}catch{}await new Promise(r=>setTimeout(r,150))}return false}
async function start(root,sha,port){const p=spawn(process.execPath,[path.join(root,"app/server.js")],{cwd:root,stdio:"inherit",env:{...process.env,PORT:String(port),DD1_RUNNING_SHA:sha.slice(0,7)}});if(!await health(port)){p.kill("SIGTERM");throw new Error("candidate health check failed")}return p}
async function deploy(){
 if(busy)return;busy=true;let tmp=null;
 try{
  await git(["fetch","origin","main"]);const desired=await git(["rev-parse","origin/main"]),running=await git(["rev-parse","HEAD"]);
  if(desired===running)return;
  if(await git(["status","--porcelain"]))throw new Error("working tree dirty");
  tmp=fs.mkdtempSync(path.join(os.tmpdir(),"dd1-candidate-"));
  await git(["worktree","add","--detach",tmp,desired]);
  await exec(process.execPath,[path.join(tmp,"runtime/validator.js"),tmp],{cwd:tmp});
  const port=Number(process.env.DD1_PORT||3100);
  if(child){child.kill("SIGTERM");await new Promise(r=>setTimeout(r,250))}
  const candidate=await start(tmp,desired,port);
  await git(["merge","--ff-only","origin/main"]);
  child=candidate;console.log("DD1 deployed:",desired.slice(0,7));
 }catch(e){console.error("DD1 deploy failed:",(e.stderr||e.message||String(e)).trim());if(!child)try{child=await start(ROOT,await git(["rev-parse","HEAD"]),Number(process.env.DD1_PORT||3100))}catch{}}
 finally{if(tmp)try{await git(["worktree","remove","--force",tmp])}catch{}busy=false}
}
(async()=>{child=await start(ROOT,await git(["rev-parse","HEAD"]),Number(process.env.DD1_PORT||3100));console.log("DD1 controller ready");setInterval(deploy,POLL)})();
