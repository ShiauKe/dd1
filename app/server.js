const http=require("node:http");
const PORT=Number(process.env.PORT||3100),SHA=process.env.DD1_RUNNING_SHA||"unknown";
const server=http.createServer((req,res)=>{
  res.setHeader("content-type","application/json");
  if(req.url==="/healthz")return res.end(JSON.stringify({ok:true,sha:SHA}));
  res.end(JSON.stringify({system:"dd1",running_sha:SHA,status:"ready",deployment_probe:"zero-touch-v1"}));
});
server.listen(PORT,"127.0.0.1",()=>console.log("DD1_APP_READY "+PORT+" "+SHA));
function stop(){server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),2000).unref()}
process.on("SIGTERM",stop);process.on("SIGINT",stop);
