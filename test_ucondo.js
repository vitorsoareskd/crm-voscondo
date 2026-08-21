async function testUcondoSessionWithAuth() {
    console.log("Iniciando teste de conexão COM AUTENTICAÇÃO na API do uCondo...");
    
    const url = "https://web.ucondo.com.br/rest/api/GetWebUserSession";
    
    // Pegamos a string gigante de cookies que você interceptou:
    const cookies = "hubspotutk=17a2f2e89f224061e051817a5b79a5ae; _fbp=fb.2.1776639270951.914132734109408801; GX_CLIENT_ID=36e03e96-9bc0-4d70-990b-0b29e41198e1; messagesUtk=d31d68f4f7a84675b18bc3d1406c4a80; DEVICE_ID=686c17e1-7dfc-4c98-884e-3c5b8c618227; __hs_cookie_cat_pref=1:true_2:true_3:true; NPS_84737676_last_seen=1784595457872; _gid=GA1.3.1998535578.1787270770; _clck=1x1cv5d%5E2%5Eg8s%5E0%5E2195; GX_SESSION_ID=Wluk25%2fp6RqvWH04a8DufkIjU%2bSwnsXkQuQBNcEOvOk%3d; __hstc=80030152.17a2f2e89f224061e051817a5b79a5ae.1776639270324.1786919226281.1787270774222.40; __hssrc=1; perfiluCondo=administradora; mkt_perfil_usuario=administradora; _ga_DEZGLSTB6H=GS2.1.s1787270770$o10$g1$t1787272544$j42$l0$h0; tutorial-administradora=true; ASP.NET_SessionId=kidj2tsycinedbftavgvlkyi; _gcl_au=1.1.983066193.1784595184.835733629.1787270774.1787272998.97955590.1787270774.1787272998; JWT_SESSION_1=%7b%22token%22%3a%22eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNDA1NTAxLTMxOTAyNjMyLTFjOWQtNGEyMC05MmM1LTlmODhhZjc4YmQ3YyIsIndoaXRlbGFiZWxJZCI6IjEiLCJjb25kb21pbml1bUlkIjoiMTU4MDAiLCJwZXJzb25zZWN1cmVJZCI6IjMwNzNjMDUwLWFlYWEtNGQ5OC1iMTYzLTdiMzZlNDAyMzU4NCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL3NpZCI6IjE0MDU1MDEiLCJjb25kb21pbml1bUFkbWluaXN0cmF0b3JJZCI6IjIwMDgiLCJwcm9maWxlIjoiQ29uZG9taW5pdW1BZG1pbmlzdHJhdG9yTWFzdGVyIiwibmJmIjoxNzg3MjczMDE2LCJleHAiOjE3ODcyNzMzMTYsImlhdCI6MTc4NzI3MzAxNiwiaXNzIjoiaHR0cHM6Ly9hcGkudWNvbmRvLmNvbS5iciIsImF1ZCI6Imh0dHBzOi8vYXBpLnVjb25kby5jb20uYnIifQ.dAZEsOV0g-oNXWuRM-DLmS-Gz2hZVdvH85OzslAQgzU%22%2c%22refreshToken%22%3a%22eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGlGcm9tIjoiMTQwNTUwMS0zMTkwMjYzMi0xYzlkLTRhMjAtOTJjNS05Zjg4YWY3OGJkN2MiLCJ3aGl0ZWxhYmVsSWQiOiIxIiwiY29uZG9taW5pdW1JZCI6IjE1ODAwIiwicGVyc29uc2VjdXJlSWQiOiIzMDczYzA1MC1hZWFhLTRkOTgtYjE2My03YjM2ZTQwMjM1ODQiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9zaWQiOiIxNDA1NTAxIiwibmJmIjoxNzg3MjczMDE2LCJleHAiOjE4MDI4MjUwMTYsImlhdCI6MTc4NzI3MzAxNiwiaXNzIjoiaHR0cHM6Ly9hcGkudWNvbmRvLmNvbS5iciIsImF1ZCI6Imh0dHBzOi8vYXBpLnVjb25kby5jb20uYnIifQ.GZxKxLd-7yMn3TSqQ5qnkbMCjDY2-LRVpbSf3I7i2H8%22%7d; EXP_CACHE_SESSION_1=1787273316; GAMSessionGUID=77c86e00-e655-4dbd-87bb-418f9739612c; ut_auth_v1=%7B%22appId%22%3A%22cmhjem6mr000uj271qgdeza3v%22%2C%22pessoaSecureId%22%3A%223073c050-aeaa-4d98-b163-7b36e4023584%22%7D; DVelopBootstrap_SidebarMenu_State_web.ucondo.com.br=E; _ga_XJJ6PM07H0=GS2.1.s1787270773$o38$g1$t1787273058$j57$l0$h0; _clsk=applz6%5E1787273059642%5E20%5E1%5Er.clarity.ms%2Fcollect; _ga=GA1.3.317501149.1767487071; __hssc=80030152.15.1787270774222; DVelopBootstrap_SidebarMenuSelected_web.ucondo.com.br=menu-cobrancas";
    
    try {
        console.log(`Fazendo requisição para: ${url} utilizando os cookies capturados...`);
        
        const response = await fetch(url, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
            },
            body: JSON.stringify({}) 
        });

        console.log("Status HTTP:", response.status, response.statusText);
        
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            console.log("SUCESSO! Resposta JSON:", JSON.stringify(data, null, 2));
        } catch(e) {
            console.log("Resposta Texto Bruto:", text);
        }

    } catch (error) {
        console.error("Erro na requisição:", error.message);
    }
}

testUcondoSessionWithAuth();
