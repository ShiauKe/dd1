const {execFile}=require("node:child_process"),{promisify}=require("node:util"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const exec=promisify(execFile),ROOT=path.resolve(__dirname,".."),BRANCH="runtime-observation",MAX=4;
let queue=Promise.resolve();
async function git(args,cwd=ROOT){return (await exec("git",args,{cwd,timeout:10000,env:{...process.env,GIT_TERMINAL_PROMPT:"0"}})).stdout.trim()}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function branchExists(remote){try{const out=await git(["ls-remote","--heads",remote,BRANCH]);return Boolean(out)}catch(e){throw e}}
async function write(payload){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"dd1-observe-"));
 try{
  const remote=await git(["remote","get-url","origin"]);await git(["init"],dir);await git(["remote","add","origin",remote],dir);
  for(let i=0;i<MAX;i++)try{
   if(await branchExists(remote)){await git(["fetch","--depth=1","origin",BRANCH],dir);await git(["checkout","-B",BRANCH,"FETCH_HEAD");}
   else await git(["checkout","--orphan",BRANCH],dir);
   fs.writeFileSync(path.join(dir,"state.json"),JSON.stringify({...payload,observed_at:new Date().toISOString()},null,2)+"\n");
   await git(["add","state.json"],dir);if(!(await git(["status","--porcelain"],dir)))return true;
   await git(["-c","user.name=DD1 Runtime","-c","user.email=dd1-runtime@local","commit","-m","runtime: publish state"],dir);
   await git(["push","origin","HEAD:"+BRANCH],dir);return true;
  }catch(e){if(i===MAX-1)throw e;await wait(250*2**i+Math.floor(Math.random()*250))}
 }catch(e){console.error("DD1 observation degraded:",(e.stderr||e.message||String(e)).trim());return false}
 finally{fs.rmSync(dir,{recursive:true,force:true})}
}
function publish(x){const p=queue.then(()=>write(x));queue=p.catch(()=>false);return p}
module.exports={publish};
