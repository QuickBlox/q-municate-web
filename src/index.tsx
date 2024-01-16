import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.scss'
import App from './App'
import reportWebVitals from './reportWebVitals'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)

reportWebVitals()
