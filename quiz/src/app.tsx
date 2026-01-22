import { h } from 'preact';
import { Router } from 'preact-router';
import { Home } from './home';
import { Quiz } from './quiz';

export function App() {
  return (
    <div>
      <Router>
        <Home path="/" />
        <Quiz path="/quiz" />
      </Router>
    </div>
  );
}
