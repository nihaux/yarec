import * as http from 'http';
import { getAuthorizationUrl } from '../src/authorization';
import { ScopeEnum, AuthorizationDurationEnum } from '../src/types';
import { getToken } from '../src/getToken';

const port = 3000;
const baseUrl = `http://localhost:${port}`;
const redirectUri = `${baseUrl}/callback`;

const formHtml = `
  <html lang="en">
  <head>
    <title>Authorization token getter</title>
    <script type="text/javascript">
      const getAuthorizationUrl = ${getAuthorizationUrl}
      
      function submitForm(e) {
        e.stopPropagation();
        const params = { scopes: [] , redirectUri: '${redirectUri}'}; 
        for (let elt of e.target.getElementsByTagName('input')) {
          if (elt.name === 'clientId') {
            params.clientId = elt.value;
          }
          if (elt.name === 'clientSecret') {
            params.clientSecret = elt.value;
          }
          if (elt.name === 'duration' && elt.checked) {
            params.duration = elt.value;
          }
          if (elt.name === 'scopes' && elt.checked) {
            params.scopes.push(elt.id);  
          }
        }
        params.state = encodeURIComponent(JSON.stringify({ clientId: params.clientId, clientSecret: params.clientSecret }));
        window.open(getAuthorizationUrl(params))
        return false;
      }
    </script>
  </head>
  <body>
    <div style="display: flex; flex-direction: column">
      <form onsubmit="return submitForm(event)">
        <label for="clientId">Client ID</label>
        <input type="text" name="clientId" id="clientId" required/> 
        <label for="clientSecret">Client Secret</label>
        <input type="text" name="clientSecret" id="clientSecret" />
         <p>Duration:</p>
         ${Object.values(AuthorizationDurationEnum)
           .map(
             value => `
            <label for="${value}">${value}</label>
            <input type="radio" id="${value}" name="duration" value="${value}" checked="${value ===
               AuthorizationDurationEnum.permanent}" />
         `,
           )
           .join('')}
         <p>Scopes:</p>
         ${Object.values(ScopeEnum)
           .map(value => {
             return `
            <div>
              <input type="checkbox" id="${value}" name="scopes" />
              <label for="${value}">${value}</label> 
            </div>
         `;
           })
           .join('')}
         <input type="submit" value="GO"/>
      </form>
      </div>
  </body>
  </html>
`;

const requestHandler: http.RequestListener = (request, response) => {
  if (!request.url) {
    response.end('error');
    return;
  }
  const url = new URL(request.url, baseUrl);
  if (!url.pathname.includes('callback')) {
    response.end(formHtml);
    return;
  }
  const state = url.searchParams.get('state');
  if (!state) {
    response.end('error');
    return;
  }

  const code = url.searchParams.get('code');
  if (!code) {
    response.end('error');
    return;
  }
  const decodedState = JSON.parse(decodeURIComponent(state));

  getToken({
    code,
    clientId: decodedState.clientId,
    clientSecret: decodedState.clientSecret,
    redirectUri,
  }).then(jsonResponse => {
    response.end(JSON.stringify(jsonResponse));
  });
};

const server = http.createServer(requestHandler);

server.listen(port, (err: any) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  console.log(`server is listening on ${port}`);
});
