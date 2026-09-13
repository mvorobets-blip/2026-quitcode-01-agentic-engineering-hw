import { PHeading, PButton } from '@porsche-design-system/components-react'
import './App.css'

function App() {
  return (
    <main className="page">
      <PHeading size="xx-large">Porsche Design System</PHeading>
      <PButton onClick={() => alert('Clicked!')}>Click me</PButton>
    </main>
  )
}

export default App
