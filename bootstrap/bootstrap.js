const {spawn}=require("node:child_process"),fs=require("node:fs"),os=require("node:os"),path=require("node:path"),crypto=require("node:crypto");
const ROOT=path.resolve(__dirname,".."),RESTART=75,READY="DD1_CONTROL_READY ",TIMEOUT=Number(process.env.DD1_CONTROL_READY_TIMEOUT_MS||5000);
let child=null,stopping=false,lastGood=null;
const id=file=>crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0,12);
const liveLauncher=()=>path.join(ROOT,"runtime/launcher.js");
function snapshot(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"dd1-last-good-"));
 for(const name of ["launcher.js","observer.js"])fs.copyFileSync(path.join(ROOT,"runtime",name),path.join(dir,name));
 lastGood={dir,launcher:path.join(dir,"launcher.js"),id:id(path.join(dir,"launcher.js"))};
}
function start(rollback=false){
 const file=rollback&&lastGood?lastGood.launcher:liveLauncher(),expected=rollback&&lastGood?lastGood.id:id(file);
 let ready=false,buffer="";const p=spawn(process.execPath,[file],{cwd:ROOT,stdio:["ignore","pipe","pipe"],env:{...process.env,DD1_SUPERVISED:"1"}});
 child=p;const timer=setTimeout(()=>{if(!ready&&child===p)try{p.kill("SIGTERM")}catch{}},TIMEOUT);
 const feed=(chunk,target)=>{target.write(chunk);buffer+=chunk.toString();let n;while((n=buffer.indexOf("\n"))>=0){const line=buffer.slice(0,n);buffer=buffer.slice(n+1);if(line.startsWith(READY)){const got=line.slice(READY.length).trim();if(got===expected){ready=true;clearTimeout(timer);if(!rollback)snapshot()}}}};
 p.stdout.on("data",x=>feed(x,process.stdout));p.stderr.on("data",x=>feed(x,process.stderr));
 p.on("exit",(code,signal)=>{clearTimeout(timer);if(child===p)child=null;if(stopping)return;if(code===RESTART&&ready)return setTimeout(()=>start(false),100);if(!ready&&!rollback&&lastGood)return setTimeout(()=>start(true),100);console.error("DD1 bootstrap: controller stopped",code??signal);process.exit(code??1)});
}
snapshot();
function shutdown(sig){stopping=true;if(child)child.kill(sig);else process.exit(0)}
process.on("SIGTERM",()=>shutdown("SIGTERM"));process.on("SIGINT",()=>shutdown("SIGINT"));start();
