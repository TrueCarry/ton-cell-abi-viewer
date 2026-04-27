/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element #root was not found')
}

render(() => <App />, root)
