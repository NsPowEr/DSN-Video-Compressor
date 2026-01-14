import React from 'react'
import {createRoot} from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './style.css'
import App from './App'

const container = document.getElementById('root')
if (window.location.hash !== '#/') {
    window.location.hash = '#/';
}
if (!import.meta.env.DEV) {
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
}
const root = createRoot(container)

root.render(
    <React.StrictMode>
        <HashRouter>
            <App />
        </HashRouter>
    </React.StrictMode>
)
