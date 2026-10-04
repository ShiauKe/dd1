const {spawn}=require("node:child_process"),{execFileSync}=require("node:child_process"),fs=require("node:fs"),os=require("node:os"),path=require("node:path"),crypto=require("node:crypto");
const ROOT=path.resolve(__dirname,".."),RESTART=75,READY="DD1_CONTROL_READY ",TIMEOUT=Number(process.env.DD1_CONTROL_READY_TIMEOUT_MS||5000);
let child=null,stopping=false,lastGood=null;
const id=s=>crypto.createHash("sha256").update(s).digest("hex").slice(0,12);
function launcher(){return path.join(ROOT,"runtime/launcher.js")}
function snapshot(){const src=fs.readFileSync(launcher(),"utf8"),file=path.join(os.tmpdir(),"dd1-last-good-"+process.pid+".js");fs.writeFileSync(file,src);lastGood={file,id:id(src)}}
function start(rollback=false){
 const file=rollback&&lastGood?lastGood.file:launcher(),expected=rollback&&lastGood?lastGood.id:id(fs.readFileSync(file,"utf8"));
 let ready=false,buffer="";const p=spawn(process.execPath,[file],{cwd:ROOT,stdio:["ignore","pipe","pipe"],env:{...process.env,DD1_SUPERVISED:"1"}});
 child=p;const timer=setTimeout(()=>{if(!ready&&child===p)try{p.kill("SIGTERM")}catch{}},TIMEOUT);
 const feed=(chunk,target)=>{target.write(chunk);buffer+=chunk.toString();let n;while((n=buffer.indexOf("\n"))>=0){const line=buffer.slice(0,n);buffer=buffer.slice(n+1);if(line.startsWith(READY)){const got=line.slice(READY.length).trim();if(got===expected){ready=true;clearTimeout(timer);if(!rollback)snapshot()}}}};
 p.stdout.on("data",x=>feed(x,process.stdout));p.stderr.on("data",x=>feed(x,process.stderr));
 p.on("exit",(code,signal)=>{clearTimeout(timer);if(child===p)child=null;if(stopping)return;if(code===RESTART&&ready)return setTimeout(()=>start(false),100);if(!ready&&!rollback&&lastGood)return setTimeout(()=>start(true),100);console.error("DD1 bootstrap: controller stopped",code??signal);process.exit(code??1)});
}
snapshot();process.on("SIGTERM",()=>{stopping=true;if(child)child.kill("SIGTERM");else process.exit(0)});process.on("SIGINT",()=>{stopping=true;if(child)child.kill("SIGINT");else process.exit(0)});start();
