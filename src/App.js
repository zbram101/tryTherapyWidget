import './App.css';
import Widget from './Widget.js';
import { configureAbly } from "@ably-labs/react-hooks"

const clientId =   
   Math.random().toString(36).substring(2, 15) +
   Math.random().toString(36).substring(2, 15);



configureAbly({
  // authUrl: `${prefix}/api/createTokenRequest?clientId=${clientId}`,
  key: "_Y_E9g.l-JtJw:SCQpYS_oEYQXArvL61PsRpnJ-IUd91ueKeOgvx6Q5NU",
  clientId
})

function App() {
  return (
        <Widget />
  );
}

export default App;
