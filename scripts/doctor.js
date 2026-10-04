const {execFileSync}=require("node:child_process"),fs=require("node:fs"),path=require("node:path"),os=require("node:os");
const ROOT=path.resolve(__dirname,".."),uid=process.getuid?.(),label="com.dd1.runtime";
const out={schema:1,at:new Date().toISOString(),root:ROOT,ok:true,earliest_failed_gate:null,checks:{}};
function check(gate,name,fn){try{const detail=fn();out.checks[name]={gate,ok:true,detail:detail??null}}catch(e){out.ok=false;if(out.earliest_failed_gate===null)out.earliest_failed_gate=gate;out.checks[name]={gate,ok:false,error:String(e.stderr||e.message||e).trim().slice(0,1500)}}}
check(4,"node",()=>{const major=Number(process.versions.node.split(".")[0]);if(major<22)throw new Error("node >=22 required, got "+process.version);return process.execPath+" "+process.version});
check(4,"git",()=>execFileSync("git",["--version"],{encoding:"utf8"}).trim());
check(4,"repo",()=>execFileSync("git",["remote","get-url","origin"],{cwd:ROOT,encoding:"utf8"}).trim());
check(5,"launchagent-file",()=>{const p=path.join(os.homedir(),"Library/LaunchAgents/"+label+".plist");if(!fs.existsSync(p))throw new Error("missing "+p);return p});
check(5,"launchd-loaded",()=>execFileSync("launchctl",["print","gui/"+uid+"/"+label],{encoding:"utf8"}).split("\n").slice(0,18).join("\n"));
check(6,"bootstrap-log",()=>{const p=path.join(os.homedir(),"Library/Logs/dd1/stdout.log");if(!fs.existsSync(p))throw new Error("stdout log missing");return fs.readFileSync(p,"utf8").slice(-3000)});
check(6,"bootstrap-error-log",()=>{const p=path.join(os.homedir(),"Library/Logs/dd1/stderr.log");return fs.existsSync(p)?fs.readFileSync(p,"utf8").slice(-3000):""});
check(7,"controller-ready",()=>{const p=path.join(os.homedir(),"Library/Logs/dd1/stdout.log"),s=fs.readFileSync(p,"utf8");const m=[...s.matchAll(/DD1_CONTROL_READY ([a-f0-9]+)/g)].at(-1);if(!m)throw new Error("DD1_CONTROL_READY not found");return m[1]});
check(8,"github-read",()=>execFileSync("git",["ls-remote","--heads","origin","main"],{cwd:ROOT,encoding:"utf8",timeout:10000}).trim());
console.log(JSON.stringify(out,null,2));process.exit(out.ok?0:2);
