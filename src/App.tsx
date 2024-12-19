import "./App.css";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";
import Home from "./components/Home.tsx";
import Signup from "./components/Signup.tsx";
import Login from "./components/Login.tsx";
import Inbox from "./components/Inbox.jsx";
import Call from "./components/Call.tsx";
import Account from "./components/Account.tsx";
import { ContextProvider } from "./context/Context.tsx";

const App = () => {
  return (
    <Router>
      <ContextProvider>
        <Navbar />
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/signup" component={Signup} />
          <Route exact path="/login" component={Login} />
          <Route exact path="/inbox" component={Inbox} />
          <Route exact path="/call" component={Call} />
          <Route exact path="/account" component={Account} />
        </Switch>
      </ContextProvider>
    </Router>
  );
};

export default App;
