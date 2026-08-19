const AUTH_KEY="kabakaro_auth_v1";
const getSession=()=>{try{return JSON.parse(localStorage.getItem(AUTH_KEY))}catch{return null}};
const saveSession=s=>localStorage.setItem(AUTH_KEY,JSON.stringify(s));
const logout=()=>{localStorage.removeItem(AUTH_KEY);location.href="connexion.html"};

async function api(url, options={}){
  const s=getSession();
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(s?.token) headers.Authorization=`Bearer ${s.token}`;
  const res=await fetch(url,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||"Erreur");
  return data;
}

document.addEventListener("DOMContentLoaded",()=>{
  const lf=document.querySelector("#loginForm");
  if(lf) lf.addEventListener("submit",async e=>{
    e.preventDefault();
    const msg=document.querySelector("#loginMsg"); msg.textContent="";
    try{
      const r=await api("/api/auth/login",{method:"POST",body:JSON.stringify({email:loginEmail.value,password:loginPassword.value})});
      saveSession({token:r.token,user:r.user}); location.href="mes-cv.html";
    }catch(err){msg.textContent=err.message}
  });

  const rf=document.querySelector("#registerForm");
  if(rf) rf.addEventListener("submit",async e=>{
    e.preventDefault();
    const msg=document.querySelector("#regMsg"); msg.textContent="";
    try{
      const r=await api("/api/auth/register",{method:"POST",body:JSON.stringify({firstName:regFirst.value,lastName:regLast.value,email:regEmail.value,password:regPassword.value})});
      saveSession({token:r.token,user:r.user}); location.href="mes-cv.html";
    }catch(err){msg.textContent=err.message}
  });
});
