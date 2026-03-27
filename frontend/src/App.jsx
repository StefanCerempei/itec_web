import { useState } from 'react';
import './App.css';

function App() {
    const [count, setCount] = useState(0);

    return (
        <div className="App">
            <h1>iTECify - Platformă de Colaborare</h1>
            <button onClick={() => setCount(count + 1)}>
                Clic aici: {count}
            </button>
        </div>
    );
}

export default App;