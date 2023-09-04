import React, { useEffect } from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';

import icon from '../../assets/icon.svg';
import './App.global.css';
import 'bootstrap/dist/css/bootstrap.css';
import Auth from './pages/Auth';
import LabSession from './components/App/App';
import Home from './pages/Main';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/auth" component={Auth} />
        <Route path="/lab-session" component={LabSession} />
        <Route path="/" component={Home} />
      </Switch>
    </Router>
  );
}
